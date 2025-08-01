const db = require('../db');

async function logActivity(userId, userName, action, details) {
  try {
    const [rows] = await db.promise().query('SELECT cancel_logs FROM user_permissions WHERE user_id = ?', [userId]);
    if (rows.length && rows[0].cancel_logs) {
      console.log(`🚫 Logging canceled for user ${userId} due to cancel_logs permission.`);
      return;
    }
  } catch (err) {
    console.error('❌ Error checking cancel_logs permission:', err);
  }
  if (typeof action === 'object') action = JSON.stringify(action);
  if (typeof details === 'object') details = JSON.stringify(details);
  const sql = `INSERT INTO Activity_Logs (user_id, user_name, action, details) VALUES (?, ?, ?, ?)`;
  db.query(sql, [userId, userName, action, details], (err) => {
    if (err) console.error('❌ Error logging activity:', err);
  });
}

function makeBilingualLog(english, arabic) {
  return { en: english, ar: arabic };
}

const updateOptionCompleteController = async (req, res) => {
  console.log("[UPDATE] req.body:", req.body);
  let { target, oldValue, newValue, type } = req.body;
  // ✅ توحيد target ليكون بنفس صيغة mapping
  if (typeof target === 'string') target = target.replace(/_/g, '-');
  if (target === "ticket-type" || target === "report-status") {
    console.log(`[UPDATE] Special case: target = ${target}, oldValue = '${oldValue}', newValue = '${newValue}', type = '${type}'`);
  }

  if (!target || !oldValue || !newValue) {
    return res.status(400).json({ error: "❌ Missing fields" });
  }
  if (oldValue.trim() === newValue.trim()) {
    return res.status(400).json({ error: "❌ Same value - no update needed" });
  }

  const updateMap = {
    "ink-type":      { table: "Ink_Types",           column: "ink_type",  propagate: [
                        { table: "Printer_info", column: "InkType_id" },
                        { table: "General_Maintenance", column: "ink_type" },
                        { table: "Regular_Maintenance", column: "ink_type" },
                        { table: "External_Maintenance", column: "ink_type" },
                        { table: "New_Maintenance_Report", column: "ink_type" }
                      ] },
    "printer-type":  { table: "Printer_Types",       column: "printer_type", propagate: [
                        { table: "Printer_info", column: "PrinterType_id" },
                        { table: "General_Maintenance", column: "printer_type" },
                        { table: "Regular_Maintenance", column: "printer_type" },
                        { table: "External_Maintenance", column: "printer_type" },
                        { table: "New_Maintenance_Report", column: "printer_type" }
                      ] },
    "scanner-type":  { table: "Scanner_Types",       column: "scanner_type", propagate: [
                        { table: "General_Maintenance", column: "scanner_type" },
                        { table: "Regular_Maintenance", column: "scanner_type" },
                        { table: "External_Maintenance", column: "scanner_type" },
                        { table: "New_Maintenance_Report", column: "scanner_type" }
                      ] },
    "section":       {
                        table: "Departments",
                        column: "name",
                        propagate: [
                          { table: "Maintenance_Devices", column: "department_id" },
                          { table: "General_Maintenance", column: "department_name" },
                          { table: "Regular_Maintenance", column: "department_name" },
                          { table: "External_Maintenance", column: "department_name" }
                        ]
                      },
    "problem-type":  { table: "DeviceType",          column: "DeviceType", propagate: [
                        { table: "Maintenance_Devices", column: "device_type" },
                        { table: "Regular_Maintenance", column: "device_type" },
                        { table: "External_Maintenance", column: "device_type" },
                        { table: "Maintance_Device_Model", column: "device_type_name" },
                        { table: "problemStates_Maintance_device", column: "device_type_name" }
                      ] },
    "os-select":     { table: "OS_Types",            column: "os_name",   propagate: [] },
    "ram-select":    { table: "RAM_Types",           column: "ram_type",  propagate: [] },
    "cpu-select":    { table: "CPU_Types",           column: "cpu_name",  propagate: [] },
    "generation-select": { table: "Processor_Generations", column: "generation_number", propagate: [] },
    "drive-select":  { table: "Hard_Drive_Types",    column: "drive_type", propagate: [] },
    "ram-size-select": { table: "RAM_Sizes",        column: "ram_size",  propagate: [] },
    "model":         {
                        table: (type === "pc")      ? "PC_Model"
                               : (type === "printer") ? "Printer_Model"
                               : (type === "scanner") ? "Scanner_Model"
                               : "Maintance_Device_Model",
                        column: "model_name",
                        propagate: []
                      },
    "floor":         { table: "floors",             column: "FloorNum",  propagate: [
                        { table: "General_Maintenance", column: "floor" }
                      ] },

    "ticket-type": {
      table: "Ticket_Types",
      column: "type_name",
      propagate: [
        { table: "Internal_Tickets", column: "ticket_type" }
      ]
    },
    "report-status": {
      table: "Report_Statuses",
      column: "status_name",
      propagate: [
        { table: "Internal_Tickets", column: "status" }
      ]
    },

    "problem-status": {
      table: (type === "pc")      ? "ProblemStates_Pc"
           : (type === "printer") ? "ProblemStates_Printer"
           : (type === "scanner") ? "ProblemStates_Scanner"
           :                         "problemStates_Maintance_device",
      column: (type === "pc" || type === "printer" || type === "scanner")
                ? "problem_text"
                : "problemStates_Maintance_device_name",
      propagate: [
        { table: "General_Maintenance", column: "problem_status" },
        { table: "Regular_Maintenance", column: "problem_status" },
        { table: "Internal_Tickets", column: "issue_description" },
        { table: "Maintenance_Reports", column: "issue_summary" }
      ]
    },
    "technical":     { table: "Engineers",           column: "name",      propagate: [] }
  };
  const tableLabelMap = {
    "Ink_Types":              { en: "Ink Type", ar: "نوع الحبر" },
    "Printer_Types":          { en: "Printer Type", ar: "نوع الطابعة" },
    "Scanner_Types":          { en: "Scanner Type", ar: "نوع الماسح" },
    "Departments":            { en: "Department", ar: "القسم" },
    "DeviceType":             { en: "Device Type", ar: "نوع الجهاز" },
    "OS_Types":               { en: "Operating System", ar: "نظام التشغيل" },
    "RAM_Types":              { en: "RAM Type", ar: "نوع الذاكرة" },
    "CPU_Types":              { en: "CPU Type", ar: "نوع المعالج" },
    "Processor_Generations":  { en: "CPU Generation", ar: "جيل المعالج" },
    "Hard_Drive_Types":       { en: "Hard Drive Type", ar: "نوع القرص الصلب" },
    "RAM_Sizes":              { en: "RAM Size", ar: "حجم الذاكرة" },
    "PC_Model":               { en: "PC Model", ar: "موديل الحاسب" },
    "Printer_Model":          { en: "Printer Model", ar: "موديل الطابعة" },
    "Scanner_Model":          { en: "Scanner Model", ar: "موديل الماسح" },
    "Maintance_Device_Model": { en: "Device Model", ar: "موديل الجهاز" },
    "floors":                 { en: "Floor", ar: "الطابق" },
    "Ticket_Types":           { en: "Ticket Type", ar: "نوع التذكرة" },
    "report_status":          { en: "Report Status", ar: "حالة التقرير" },
    "ProblemStates_Pc":       { en: "PC Problem", ar: "مشكلة الحاسب" },
    "ProblemStates_Printer":  { en: "Printer Problem", ar: "مشكلة الطابعة" },
    "ProblemStates_Scanner":  { en: "Scanner Problem", ar: "مشكلة الماسح" },
    "problemStates_Maintance_device": { en: "Device Problem", ar: "مشكلة الجهاز" },
    "Engineers":              { en: "Engineer", ar: "الفني" }
    // أضف أي جدول آخر تحتاجه هنا
  };
  const mapping = updateMap[target];
  if (!mapping) {
    console.log(`[UPDATE] Invalid target: ${target}`);
    return res.status(400).json({ error: "❌ Invalid target" });
  }

  const conn = db.promise();
  try {
    await conn.query("START TRANSACTION");

    if (target === "section") {
      console.log(`[UPDATE] SECTION: oldValue = '${oldValue}', newValue = '${newValue}'`);
      const [deptRows] = await conn.query(
        `SELECT id, name FROM Departments WHERE name = ? OR TRIM(SUBSTRING_INDEX(name, '|', 1)) = ? OR TRIM(SUBSTRING_INDEX(name, '|', -1)) = ? OR name LIKE ? LIMIT 1`,
        [oldValue.trim(), oldValue.trim(), oldValue.trim(), `%${oldValue.trim()}%`]
      );
      if (!deptRows.length) {
        const [deptRows2] = await conn.query(
          `SELECT id, name FROM Departments WHERE name LIKE ? OR name LIKE ? LIMIT 1`,
          [`%${oldValue.trim()}%`, `%${oldValue.trim()}%`]
        );
        if (!deptRows2.length) {
          throw new Error(`❌ Old Department "${oldValue}" not found`);
        }
        deptRows[0] = deptRows2[0];
      }
      const oldDeptId = deptRows[0].id;
      const fullNameOld = deptRows[0].name;
      const parts = fullNameOld.split("|").map(s => s.trim());
      const enOld = parts[0] || "";
      const arOld = parts[1] || "";
      let enNew = enOld;
      let arNew = arOld;
      const newTrim = newValue.trim();
      if (oldValue.trim() === fullNameOld) {
        const newParts = newTrim.split("|").map(s => s.trim());
        if (newParts.length === 2) {
          enNew = newParts[0];
          arNew = newParts[1];
        } else {
          const isArabic = /[\u0600-\u06FF]/.test(newTrim);
          if (isArabic) {
            arNew = newTrim;
            enNew = enOld;
          } else {
            enNew = newTrim;
            arNew = arOld;
          }
        }
      } else if (oldValue.trim() === arOld) {
        arNew = newTrim;
        enNew = enOld;
      } else if (oldValue.trim() === enOld) {
        enNew = newTrim;
        arNew = arOld;
      } else {
        const isArabic = /[\u0600-\u06FF]/.test(newTrim);
        if (isArabic) {
          arNew = newTrim;
          enNew = enOld;
        } else {
          enNew = newTrim;
          arNew = arOld;
        }
      }
      for (const { table, column } of mapping.propagate) {
        if (column === "department_id") continue;
        if (arOld && arNew) {
          await conn.query(
            `UPDATE ${table} SET ${column} = ? WHERE ${column} = ?`,
            [arNew, arOld]
          );
        }
      }
      const fullNameNew = `${enNew}|${arNew}`;
      await conn.query(
        `UPDATE ${mapping.table} SET ${mapping.column} = ? WHERE id = ?`,
        [fullNameNew, oldDeptId]
      );
    } else if (target === "problem-type") {
      console.log(`[UPDATE] PROBLEM-TYPE: oldValue = '${oldValue}', newValue = '${newValue}'`);
      const [existsRows] = await conn.query(
        `SELECT 1 FROM ${mapping.table} WHERE ${mapping.column} = ? LIMIT 1`,
        [newValue.trim()]
      );
      if (!existsRows.length) {
        await conn.query(
          `INSERT INTO ${mapping.table} (${mapping.column}) VALUES (?)`,
          [newValue.trim()]
        );
      }
      for (const { table, column } of mapping.propagate) {
        await conn.query(
          `UPDATE ${table} SET ${column} = ? WHERE ${column} = ?`,
          [newValue.trim(), oldValue.trim()]
        );
      }
      await conn.query(
        `DELETE FROM ${mapping.table} WHERE ${mapping.column} = ?`,
        [oldValue.trim()]
      );
    } else if (target === "technical") {
      console.log(`[UPDATE] TECHNICAL: oldValue = '${oldValue}', newValue = '${newValue}'`);
      const [engineerRows] = await conn.query(
        `SELECT id, name FROM Engineers WHERE TRIM(SUBSTRING_INDEX(name, '|', 1)) = ? OR TRIM(SUBSTRING_INDEX(name, '|', -1)) = ? OR name LIKE ? LIMIT 1`,
        [oldValue.trim(), oldValue.trim(), `%${oldValue.trim()}%`]
      );
      if (!engineerRows.length) {
        throw new Error("❌ Old Engineer not found");
      }
      const oldEngineerId = engineerRows[0].id;
      const fullNameOld = engineerRows[0].name;
      const [enOld, arOld] = fullNameOld.split("|").map(s => s.trim());
      let enNew = enOld;
      let arNew = arOld;
      const newTrim = newValue.trim();
      if (oldValue.trim() === arOld) {
        arNew = newTrim;
      } else if (oldValue.trim() === enOld) {
        enNew = newTrim;
      } else {
        const parts = newTrim.split("|").map(s => s.trim());
        if (parts.length === 2) {
          enNew = parts[0];
          arNew = parts[1];
        } else {
          throw new Error("❌ Unable to parse newValue for technical");
        }
      }
      
      // تحديث الجداول المرتبطة
      for (const { table, column } of mapping.propagate) {
        if (column === "technical_engineer_id") continue;
        await conn.query(
          `UPDATE ${table} SET ${column} = ? WHERE ${column} = ?`,
          [arNew, arOld]
        );
      }
      
      // تحديث اسم المهندس في جدول Engineers
      const fullNameNew = `${enNew}|${arNew}`;
      await conn.query(
        `UPDATE ${mapping.table} SET ${mapping.column} = ? WHERE id = ?`,
        [fullNameNew, oldEngineerId]
      );
      
      // تحديث اسم المهندس في جدول المستخدمين أيضاً
      try {
        console.log(`🔍 البحث عن المستخدم بالاسم: ${oldValue.trim()}`);
        
        // البحث عن المستخدم بالاسم القديم في جدول users
        const [userCheck] = await conn.query(
          'SELECT id, name FROM users WHERE name LIKE ?',
          [`%${oldValue.trim()}%`]
        );

        console.log(`🔍 تم العثور على ${userCheck.length} مستخدم`);

        if (userCheck.length > 0) {
          const user = userCheck[0];
          console.log(`🔍 المستخدم الحالي: ${user.name}`);
          
          // تحليل الاسم الحالي في جدول المستخدمين
          const currentNameParts = user.name.split('|');
          let userEnglishName = currentNameParts[0] || '';
          let userArabicName = currentNameParts[1] || '';
          
          console.log(`🔍 الاسم الإنجليزي الحالي للمستخدم: "${userEnglishName}"`);
          console.log(`🔍 الاسم العربي الحالي للمستخدم: "${userArabicName}"`);
          
          // تحديث الاسم المناسب بناءً على نوع الاسم القديم
          let updatedUserName = user.name;
          
          if (oldValue.trim() === userEnglishName) {
            // الاسم القديم هو الاسم الإنجليزي، نحدث الاسم الإنجليزي فقط
            updatedUserName = `${enNew}|${userArabicName}`;
            console.log(`✅ تم تحديث الاسم الإنجليزي في جدول users من "${userEnglishName}" إلى "${enNew}"`);
          } else if (oldValue.trim() === userArabicName) {
            // الاسم القديم هو الاسم العربي، نحدث الاسم العربي فقط
            updatedUserName = `${userEnglishName}|${arNew}`;
            console.log(`✅ تم تحديث الاسم العربي في جدول users من "${userArabicName}" إلى "${arNew}"`);
          } else {
            // الاسم القديم متطابق مع الاسم الكامل، نحدث كلا الاسمين
            updatedUserName = fullNameNew;
            console.log(`✅ تم تحديث الاسمين في جدول users من "${user.name}" إلى "${fullNameNew}"`);
          }
          
          console.log(`🔍 الاسم المحدث للمستخدم: ${updatedUserName}`);
          
          // تحديث الاسم في جدول users
          await conn.query(
            'UPDATE users SET name = ? WHERE id = ?',
            [updatedUserName, user.id]
          );
          
          console.log(`✅ تم تحديث المستخدم بنجاح`);
        } else {
          console.log(`⚠️ لم يتم العثور على مستخدم بالاسم: ${oldValue.trim()}`);
        }
      } catch (userErr) {
        console.error('⚠️ خطأ في تحديث جدول المستخدمين:', userErr);
        // لا نوقف العملية إذا فشل تحديث جدول المستخدمين
      }
    } else if (target === "problem-status") {
      console.log(`[UPDATE] PROBLEM-STATUS: oldValue = '${oldValue}', newValue = '${newValue}', type = '${type}'`);
      const [rows] = await conn.query(
        `SELECT id, ${mapping.column} AS fullname FROM ${mapping.table} WHERE ${mapping.column} = ? OR TRIM(SUBSTRING_INDEX(${mapping.column}, '|', 1)) = ? OR TRIM(SUBSTRING_INDEX(${mapping.column}, '|', -1)) = ? OR ${mapping.column} LIKE ? LIMIT 1`,
        [oldValue.trim(), oldValue.trim(), oldValue.trim(), `%${oldValue.trim()}%`]
      );
      if (!rows.length) throw new Error(`❌ Old Status "${oldValue}" not found`);
      const oldId   = rows[0].id;
      const fullOld = rows[0].fullname.trim();
      const [enOld, arOld] = fullOld.split("|").map(s => s.trim());
      const newTrim = newValue.trim();
      let enNew = enOld, arNew = arOld;
      if (newTrim.includes("|")) {
        [enNew, arNew] = newTrim.split("|").map(s => s.trim());
      } else if (oldValue.trim() === enOld) {
        enNew = newTrim;
      } else if (oldValue.trim() === arOld) {
        arNew = newTrim;
      } else {
        if (/[\u0600-\u06FF]/.test(newTrim)) arNew = newTrim;
        else                                  enNew = newTrim;
      }
      const fullNew = `${enNew} | ${arNew}`;
      for (const { table, column } of mapping.propagate) {
        const [childRows] = await conn.query(
          `SELECT id, ${column} AS raw FROM ${table}`
        );
        for (const row of childRows) {
          let arr;
          try {
            arr = JSON.parse(row.raw);
            if (!Array.isArray(arr)) throw 0;
          } catch {
            arr = row.raw.split(",").map(s => s.trim()).filter(Boolean);
          }
          let changed = false;
          const newArr = arr.map(el => {
            const [ePart, aPart] = el.split("|").map(s => s.trim());
            if (ePart === enOld) {
              changed = true;
              return fullNew;
            }
            return el;
          });
          if (!changed) continue;
          const newRaw = row.raw.trim().startsWith("[")
            ? JSON.stringify(newArr)
            : newArr.join(", ");
          await conn.query(
            `UPDATE ${table} SET ${column} = ? WHERE id = ?`,
            [newRaw, row.id]
          );
        }
      }
      await conn.query(
        `UPDATE ${mapping.table} SET ${mapping.column} = ? WHERE id = ?`,
        [fullNew, oldId]
      );
    } else if (target === "ticket-type" || target === "report-status") {
      console.log(`[UPDATE] ${target.toUpperCase()}: oldValue = '${oldValue}', newValue = '${newValue}'`);
      // Log before update
      const [beforeRows] = await conn.query(
        `SELECT * FROM ${mapping.table} WHERE ${mapping.column} = ?`,
        [oldValue.trim()]
      );
      console.log(`[UPDATE] ${target.toUpperCase()} BEFORE:`, beforeRows);
      for (const { table, column } of mapping.propagate) {
        await conn.query(
          `UPDATE ${table} SET ${column} = ? WHERE ${column} = ?`,
          [newValue.trim(), oldValue.trim()]
        );
      }
      await conn.query(
        `UPDATE ${mapping.table} SET ${mapping.column} = ? WHERE ${mapping.column} = ?`,
        [newValue.trim(), oldValue.trim()]
      );
      // Log after update
      const [afterRows] = await conn.query(
        `SELECT * FROM ${mapping.table} WHERE ${mapping.column} = ?`,
        [newValue.trim()]
      );
      console.log(`[UPDATE] ${target.toUpperCase()} AFTER:`, afterRows);
    } else {
      console.log(`[UPDATE] DEFAULT: target = ${target}, oldValue = '${oldValue}', newValue = '${newValue}'`);
      for (const { table, column } of mapping.propagate) {
        await conn.query(
          `UPDATE ${table} SET ${column} = ? WHERE ${column} = ?`,
          [newValue.trim(), oldValue.trim()]
        );
      }
      await conn.query(
        `UPDATE ${mapping.table} SET ${mapping.column} = ? WHERE ${mapping.column} = ?`,
        [newValue.trim(), oldValue.trim()]
      );
    }
    await conn.query("COMMIT");
    const userId = req.user?.id;
    const [userRow] = await db.promise().query(
      "SELECT name FROM users WHERE id = ?",
      [userId]
    );
    const userName = userRow[0]?.name || "Unknown";
    const tableLabel = tableLabelMap[mapping.table] || { en: mapping.table, ar: mapping.table };
    await logActivity(
      userId,
      userName,
      JSON.stringify(makeBilingualLog("Edited", "تعديل")),
      JSON.stringify(makeBilingualLog(
        `Updated "${oldValue}" to "${newValue}" in ${tableLabel.en}`,
        `تم تحديث "${oldValue}" إلى "${newValue}" في ${tableLabel.ar}`
      ))
    );
    return res.json({ message: "✅ Option updated correctly." });
  } catch (err) {
    await conn.query("ROLLBACK");
    console.error("❌ Error during update-option-complete:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
};

module.exports = { updateOptionCompleteController }; 
const db = require('../db');

function logActivity(userId, userName, action, details) {
  const query = `INSERT INTO Activity_Logs (user_id, user_name, action, details) VALUES (?, ?, ?, ?)`;
  db.query(query, [userId, userName, action, details], (err) => {
    if (err) console.error("❌ Failed to log activity:", err);
  });
}

function makeBilingualLog(english, arabic) {
  return { en: english, ar: arabic };
}

const deleteOptionCompleteController = async (req, res) => {
  const { target, value, type } = req.body;

  if (!target || !value) {
    return res.status(400).json({ error: "❌ Missing fields" });
  }

  const deleteMap = {
    "ink-type": {
      table: "Ink_Types",
      column: "ink_type",
      referencedTables: [
        { table: "Printer_info", column: "InkType_id" },
        { table: "General_Maintenance", column: "ink_type" },
        { table: "Regular_Maintenance", column: "ink_type" },
        { table: "External_Maintenance", column: "ink_type" },
        { table: "New_Maintenance_Report", column: "ink_type" }
      ]
    },
    "scanner-type": {
      table: "Scanner_Types",
      column: "scanner_type",
      referencedTables: [
        { table: "General_Maintenance", column: "scanner_type" },
        { table: "Regular_Maintenance", column: "scanner_type" },
        { table: "External_Maintenance", column: "scanner_type" },
        { table: "New_Maintenance_Report", column: "scanner_type" }
      ]
    },
    "printer-type": {
      table: "Printer_Types",
      column: "printer_type",
      referencedTables: [
        { table: "Printer_info", column: "PrinterType_id" },
        { table: "General_Maintenance", column: "printer_type" },
        { table: "Regular_Maintenance", column: "printer_type" },
        { table: "External_Maintenance", column: "printer_type" },
        { table: "New_Maintenance_Report", column: "printer_type" }
      ]
    },
    "section": {
      table: "Departments",
      column: "name",
      referencedTables: [
        { table: "Maintenance_Devices", column: "department_id" },
        { table: "General_Maintenance", column: "department_name" },
        { table: "Regular_Maintenance", column: "department_name" },
        { table: "External_Maintenance", column: "department_name" }
      ]
    },
    "problem-type": {
      table: "DeviceType",
      column: "DeviceType",
      referencedTables: [
        { table: "Maintenance_Devices", column: "device_type" },
        { table: "Regular_Maintenance", column: "device_type" },
        { table: "External_Maintenance", column: "device_type" },
        { table: "Maintance_Device_Model", column: "device_type_name" },
        { table: "problemStates_Maintance_device", column: "device_type_name" }
      ]
    },
    "os-select": {
      table: "OS_Types",
      column: "os_name",
      referencedTables: [
        { table: "PC_info", column: "OS_id" },
        { table: "General_Maintenance", column: "os_name" },
        { table: "Regular_Maintenance", column: "os_name" },
        { table: "External_Maintenance", column: "os_name" }
      ]
    },
    "ram-select": {
      table: "RAM_Types",
      column: "ram_type",
      referencedTables: [
        { table: "PC_info", column: "RAM_id" },
        { table: "General_Maintenance", column: "ram_type" },
        { table: "Regular_Maintenance", column: "ram_type" },
        { table: "External_Maintenance", column: "ram_type" }
      ]
    },
    "cpu-select": {
      table: "CPU_Types",
      column: "cpu_name",
      referencedTables: [
        { table: "PC_info", column: "Processor_id" },
        { table: "General_Maintenance", column: "cpu_name" },
        { table: "Regular_Maintenance", column: "cpu_name" },
        { table: "External_Maintenance", column: "cpu_name" }
      ]
    },
    "generation-select": {
      table: "Processor_Generations",
      column: "generation_number",
      referencedTables: [
        { table: "PC_info", column: "Generation_id" },
        { table: "General_Maintenance", column: "generation_number" },
        { table: "Regular_Maintenance", column: "generation_number" },
        { table: "External_Maintenance", column: "generation_number" }
      ]
    },
    "drive-select": {
      table: "Hard_Drive_Types",
      column: "drive_type",
      referencedTables: [
        { table: "PC_info", column: "Drive_id" },
        { table: "General_Maintenance", column: "drive_type" },
        { table: "Regular_Maintenance", column: "drive_type" },
        { table: "External_Maintenance", column: "drive_type" }
      ]
    },
    "ram-size-select": {
      table: "RAM_Sizes",
      column: "ram_size",
      referencedTables: [
        { table: "PC_info", column: "RamSize_id" },
        { table: "General_Maintenance", column: "ram_size" },
        { table: "Regular_Maintenance", column: "ram_size" },
        { table: "External_Maintenance", column: "ram_size" }
      ]
    },
    "model": {
      table: (type === "pc")      ? "PC_Model"
           : (type === "printer") ? "Printer_Model"
           : (type === "scanner") ? "Scanner_Model"
           : "Maintance_Device_Model",
      column: "model_name",
      referencedTables: [
        { table: "PC_info", column: "Model_id" },
        { table: "Printer_info", column: "Model_id" },
        { table: "Scanner_info", column: "Model_id" },
        { table: "Maintenance_Devices", column: "model_id" },
        { table: "General_Maintenance", column: "model_name" },
        { table: "Regular_Maintenance", column: "model_name" },
        { table: "External_Maintenance", column: "model_name" }
      ]
    },
    "floor": {
      table: "Floors",
      column: "FloorNum",
      referencedTables: [
        { table: "General_Maintenance", column: "floor" }
      ]
    },
    "technical": {
      table: "Engineers",
      column: "name",
      referencedTables: [
        { table: "General_Maintenance", column: "technician_name" },
        { table: "Regular_Maintenance", column: "technical_engineer_id" }
      ]
    },
    "problem-status": {
      table: (type === "pc")      ? "ProblemStates_Pc"
           : (type === "printer") ? "ProblemStates_Printer"
           : (type === "scanner") ? "ProblemStates_Scanner"
           : "problemStates_Maintance_device",
      column: (type === "pc" || type === "printer" || type === "scanner")
                ? "problem_text"
                : "problemStates_Maintance_device_name",
      referencedTables: []
    }
  };

  const mapping = deleteMap[target];
  if (!mapping) {
    return res.status(400).json({ error: "❌ Invalid target field" });
  }

  try {
    let departmentId = null;
    let engineerId = null;
    let statusId = null;

    if (target === "section") {
      const [deptRows] = await db.promise().query(
        `SELECT id FROM Departments WHERE TRIM(SUBSTRING_INDEX(name, '|', 1)) = ? OR TRIM(SUBSTRING_INDEX(name, '|', -1)) = ? LIMIT 1`,
        [value.trim(), value.trim()]
      );
      if (!deptRows.length) {
        return res.status(400).json({ error: `❌ Department "${value}" not found.` });
      }
      departmentId = deptRows[0].id;
    }

    if (target === "problem-status") {
      const [statusRows] = await db.promise().query(
        `SELECT id FROM ${mapping.table} WHERE TRIM(SUBSTRING_INDEX(${mapping.column}, '|', 1)) = ? OR TRIM(SUBSTRING_INDEX(${mapping.column}, '|', -1)) = ? LIMIT 1`,
        [value.trim(), value.trim()]
      );
      if (!statusRows.length) {
        return res.status(400).json({ error: `❌ Status "${value}" not found.` });
      }
      statusId = statusRows[0].id;
    }

    if (target === "technical") {
      const [engineerRows] = await db.promise().query(
        `SELECT id FROM Engineers WHERE TRIM(SUBSTRING_INDEX(name, '|', 1)) = ? OR TRIM(SUBSTRING_INDEX(name, '|', -1)) = ? LIMIT 1`,
        [value.trim(), value.trim()]
      );
      if (!engineerRows.length) {
        return res.status(400).json({ error: `❌ Engineer "${value}" not found.` });
      }
      engineerId = engineerRows[0].id;
    }

    for (const ref of mapping.referencedTables) {
      let query = "";
      let param = null;
      if (target === "section" && ref.column === "department_id") {
        query = `SELECT COUNT(*) AS count FROM ${ref.table} WHERE ${ref.column} = ?`;
        param = departmentId;
      } else if (target === "technical" && ref.column === "technical_engineer_id") {
        query = `SELECT COUNT(*) AS count FROM ${ref.table} WHERE ${ref.column} = ?`;
        param = engineerId;
      } else if (target === "problem-status" && ref.column.includes("_status_id")) {
        query = `SELECT COUNT(*) AS count FROM ${ref.table} WHERE ${ref.column} = ?`;
        param = statusId;
      } else {
        query = `SELECT COUNT(*) AS count FROM ${ref.table} WHERE ${ref.column} = ?`;
        param = value.trim();
      }
      const [rows] = await db.promise().query(query, [param]);
      if (rows[0].count > 0) {
        return res.status(400).json({
          error: `❌ Can't delete "${value}" because it is referenced in table "${ref.table}".`
        });
      }
    }

    // تنفيذ الحذف الفعلي
    if (target === "section") {
      const [delRes] = await db.promise().query(
        `DELETE FROM Departments WHERE id = ?`,
        [departmentId]
      );
      if (delRes.affectedRows === 0) {
        return res.status(404).json({ error: "❌ Department not found or already deleted." });
      }
    } else if (target === "technical") {
      const [delRes] = await db.promise().query(
        `DELETE FROM Engineers WHERE id = ?`,
        [engineerId]
      );
      if (delRes.affectedRows === 0) {
        return res.status(404).json({ error: "❌ Engineer not found or already deleted." });
      }
    } else {
      let deleteQuery = "";
      let params = [];
      if (target === "problem-status" && type && !["pc", "printer", "scanner"].includes(type)) {
        deleteQuery = `DELETE FROM ${mapping.table} WHERE ${mapping.column} = ? AND device_type_name = ?`;
        params = [value.trim(), type];
      } else {
        deleteQuery = `DELETE FROM ${mapping.table} WHERE ${mapping.column} = ?`;
        params = [value.trim()];
      }
      const [result] = await db.promise().query(deleteQuery, params);
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "❌ Value not found or already deleted." });
      }
    }
    const labelMap = {
      "ink-type":      { en: "Ink Type",      ar: "نوع الحبر" },
      "scanner-type":  { en: "Scanner Type",  ar: "نوع الماسح" },
      "printer-type":  { en: "Printer Type",  ar: "نوع الطابعة" },
      "section":       { en: "Department",    ar: "القسم" },
      "problem-type":  { en: "Device Type",   ar: "نوع الجهاز" },
      "os-select":     { en: "Operating System", ar: "نظام التشغيل" },
      "ram-select":    { en: "RAM Type",      ar: "نوع الذاكرة" },
      "cpu-select":    { en: "CPU",           ar: "المعالج" },
      "generation-select": { en: "CPU Generation", ar: "جيل المعالج" },
      "drive-select":  { en: "Drive Type",    ar: "نوع القرص" },
      "ram-size-select": { en: "RAM Size",    ar: "حجم الذاكرة" },
      "model":         { en: "Model",         ar: "الموديل" },
      "floor":         { en: "Floor",         ar: "الطابق" },
      "technical":     { en: "Engineer",      ar: "المهندس" },
      "problem-status":{ en: "Problem",       ar: "المشكلة" }
    };
    const userId = req.user?.id;
    const [userRow] = await db.promise().query('SELECT name FROM users WHERE id = ?', [userId]);
    const userName = userRow[0]?.name || 'Unknown';
    logActivity(
      userId,
      userName,
      JSON.stringify(makeBilingualLog("Deleted", "حذف")),
      JSON.stringify(makeBilingualLog(
        `Deleted "${value}" from ${labelMap[target]?.en || mapping.table}`,
        `تم حذف "${value}" من ${labelMap[target]?.ar || mapping.table}`
      ))
    );
    return res.json({ message: `✅ "${value}" deleted successfully.` });
  } catch (err) {
    console.error("❌ Error during delete-option-complete:", err.sqlMessage || err.message || err);
    return res.status(500).json({ error: err.sqlMessage || "Server error during deletion." });
  }
};

module.exports = { deleteOptionCompleteController }; 
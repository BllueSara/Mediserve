const db = require('../db');
const { makeBilingualLog } = require('../utils/makeBilingualLog');

// Controller لإضافة خيار عام
exports.addOptionGeneral = (req, res) => {
  const { target, value, type } = req.body;
  const userId = req.user?.id;

  const tableMap = {
    "device-type": {
      table: "DeviceType",
      column: "DeviceType",
      action: { en: "Add Device Type", ar: "إضافة نوع جهاز" },
      tableLabel: { en: "Device Type", ar: "نوع الجهاز" }
    },
    "section": {
      table: "Departments",
      column: "name",
      action: { en: "Add Department", ar: "إضافة قسم" },
      tableLabel: { en: "Department", ar: "القسم" }
    },
    "floor": {
      table: "Floors",
      column: "FloorNum",
      action: { en: "Add Floor", ar: "إضافة طابق" },
      tableLabel: { en: "Floor", ar: "الطابق" }
    },
    "technical": {
      table: "Engineers",
      column: "name",
      action: { en: "Add Engineer", ar: "إضافة مهندس" },
      tableLabel: { en: "Engineer", ar: "المهندس" }
    },
    "problem-status": {
      table: null,
      column: "problem_text",
      action: { en: "Add Problem", ar: "إضافة مشكلة" },
      tableLabel: { en: "Problem", ar: "المشكلة" }
    },
    "os-select": {
      table: "OS_Types",
      column: "os_name",
      action: { en: "Add OS", ar: "إضافة نظام تشغيل" },
      tableLabel: { en: "Operating System", ar: "نظام التشغيل" }
    },
    "ram-select": {
      table: "RAM_Types",
      column: "ram_type",
      action: { en: "Add RAM", ar: "إضافة نوع ذاكرة" },
      tableLabel: { en: "RAM Type", ar: "نوع الذاكرة" }
    },
    "ram-size-select": {
      table: "RAM_Sizes",
      column: "ram_size",
      action: { en: "Add RAM Size", ar: "إضافة حجم ذاكرة" },
      tableLabel: { en: "RAM Size", ar: "حجم الذاكرة" }
    },
    "cpu-select": {
      table: "CPU_Types",
      column: "cpu_name",
      action: { en: "Add CPU", ar: "إضافة معالج" },
      tableLabel: { en: "CPU", ar: "المعالج" }
    },
    "generation-select": {
      table: "Processor_Generations",
      column: "generation_number",
      action: { en: "Add CPU Generation", ar: "إضافة جيل معالج" },
      tableLabel: { en: "CPU Generation", ar: "جيل المعالج" }
    },
    "drive-select": {
      table: "Hard_Drive_Types",
      column: "drive_type",
      action: { en: "Add Drive Type", ar: "إضافة نوع قرص" },
      tableLabel: { en: "Drive Type", ar: "نوع القرص" }
    },
    "printer-type": {
      table: "Printer_Types",
      column: "printer_type",
      action: { en: "Add Printer Type", ar: "إضافة نوع طابعة" },
      tableLabel: { en: "Printer Type", ar: "نوع الطابعة" }
    },
    "ink-type": {
      table: "Ink_Types",
      column: "ink_type",
      action: { en: "Add Ink Type", ar: "إضافة نوع حبر" },
      tableLabel: { en: "Ink Type", ar: "نوع الحبر" }
    },
    "scanner-type": {
      table: "Scanner_Types",
      column: "scanner_type",
      action: { en: "Add Scanner Type", ar: "إضافة نوع ماسح" },
      tableLabel: { en: "Scanner Type", ar: "نوع الماسح" }
    }
  };

  // منطق التفرقة لـ problem-status
  if (target === "problem-status") {
    if (type === "pc") {
      tableMap[target].table = "ProblemStates_Pc";
      tableMap[target].action = { en: "Add PC Problem", ar: "إضافة مشكلة كمبيوتر" };
      tableMap[target].tableLabel = { en: "PC Problem", ar: "مشكلة كمبيوتر" };
    } else if (type === "printer") {
      tableMap[target].table = "ProblemStates_Printer";
      tableMap[target].action = { en: "Add Printer Problem", ar: "إضافة مشكلة طابعة" };
      tableMap[target].tableLabel = { en: "Printer Problem", ar: "مشكلة طابعة" };
    } else if (type === "scanner") {
      tableMap[target].table = "ProblemStates_Scanner";
      tableMap[target].action = { en: "Add Scanner Problem", ar: "إضافة مشكلة ماسح" };
      tableMap[target].tableLabel = { en: "Scanner Problem", ar: "مشكلة ماسح" };
    } else {
      tableMap[target].table = "problemStates_Maintance_device";
      tableMap[target].action = { en: "Add Generic Problem", ar: "إضافة مشكلة عامة" };
      tableMap[target].tableLabel = { en: "Generic Problem", ar: "مشكلة عامة" };
      tableMap[target].extra = "device_type_name";
    }
  }

  const mapping = tableMap[target];
  if (!mapping) return res.status(400).json({ error: "Invalid target field" });

  const query = mapping.extra
    ? `INSERT INTO ${mapping.table} (${mapping.column}, ${mapping.extra}) VALUES (?, ?)`
    : `INSERT INTO ${mapping.table} (${mapping.column}) VALUES (?)`;

  const params = mapping.extra ? [value, type] : [value];

  const checkQuery = mapping.extra
    ? `SELECT * FROM ${mapping.table} WHERE ${mapping.column} = ? AND ${mapping.extra} = ?`
    : `SELECT * FROM ${mapping.table} WHERE ${mapping.column} = ?`;

  db.query(checkQuery, params, (err, existing) => {
    if (err) return res.status(500).json({ error: "DB check error" });
    if (existing.length > 0) {
      return res.status(400).json({ error: `⚠️ \"${value}\" already exists in ${mapping.table}` });
    }

    db.query(query, params, (err2, result) => {
      if (err2) {
        console.error("❌ DB Insert Error:", err2);
        return res.status(500).json({ error: "Database error while inserting option" });
      }

      // ✅ Log to Activity_Logs
      db.query("SELECT name FROM users WHERE id = ?", [userId], (errUser, resultUser) => {
        if (!errUser && resultUser.length > 0) {
          const userName = resultUser[0].name;
          const logAction = mapping.action;
          const logTable = mapping.tableLabel;

          const logQuery = `
            INSERT INTO Activity_Logs (user_id, user_name, action, details)
            VALUES (?, ?, ?, ?)
          `;
          const logValues = [
            userId,
            userName,
            JSON.stringify(makeBilingualLog(logAction.en, logAction.ar)),
            JSON.stringify(makeBilingualLog(
              `Added '${value}' to '${logTable.en}'`,
              `تمت إضافة '${value}' إلى '${logTable.ar}'`
            ))
          ];
          db.query(logQuery, logValues, (logErr) => {
            if (logErr) console.error("❌ Logging failed:", logErr);
          });
        }
      });

      res.json({ message: `✅ ${value} added to ${mapping.table}`, insertedId: result.insertId });
    });
  });
};

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
  await db.promise().query(sql, [userId, userName, action, details]);
} 

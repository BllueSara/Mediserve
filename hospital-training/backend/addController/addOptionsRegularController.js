const db = require('../db');
const { makeBilingualLog } = require('../utils/makeBilingualLog');

exports.addOptionsRegular = (req, res) => {
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
  "problem-status": {
    // لاحظ: هنا تحتاج تفرّق حسب النوع (type) كما في كودك الأصلي
    table: null, // سيتم تحديده لاحقًا حسب type
    column: "problem_text",
    action: { en: "Add Problem", ar: "إضافة مشكلة" },
    tableLabel: { en: "Problem", ar: "المشكلة" }
  },
  "technical": {
    table: "Engineers",
    column: "name",
    action: { en: "Add Engineer", ar: "إضافة مهندس" },
    tableLabel: { en: "Engineer", ar: "المهندس" }
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
      tableMap[target] = {
        table: "ProblemStates_Pc",
        column: "problem_text",
        action: { en: "Add PC Problem", ar: "إضافة مشكلة كمبيوتر" },
        tableLabel: { en: "PC Problem", ar: "مشكلة كمبيوتر" }
      };
    } else if (type === "printer") {
      tableMap[target] = {
        table: "ProblemStates_Printer",
        column: "problem_text",
        action: { en: "Add Printer Problem", ar: "إضافة مشكلة طابعة" },
        tableLabel: { en: "Printer Problem", ar: "مشكلة طابعة" }
      };
    } else if (type === "scanner") {
      tableMap[target] = {
        table: "ProblemStates_Scanner",
        column: "problem_text",
        action: { en: "Add Scanner Problem", ar: "إضافة مشكلة ماسح" },
        tableLabel: { en: "Scanner Problem", ar: "مشكلة ماسح" }
      };
    } else {
      tableMap[target] = {
        table: "problemStates_Maintance_device",
        column: "problemStates_Maintance_device_name",
        action: { en: "Add Generic Problem", ar: "إضافة مشكلة عامة" },
        tableLabel: { en: "Generic Problem", ar: "مشكلة عامة" },
        extra: "device_type"
      };
    }
  }

  const mapping = tableMap[target];
  if (!mapping) return res.status(400).json({ error: "Invalid target field" });

  let query = "";
  let params = [];

  if (mapping.extra) {
    query = `INSERT INTO ${mapping.table} (${mapping.column}, ${mapping.extra}) VALUES (?, ?)`;
    params = [value, type];
  } else {
    query = `INSERT INTO ${mapping.table} (${mapping.column}) VALUES (?)`;
    params = [value];
  }

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
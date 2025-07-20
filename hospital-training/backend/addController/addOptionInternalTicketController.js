const db = require('../db');
const { makeBilingualLog } = require('../utils/makeBilingualLog');

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

exports.addOptionInternalTicket = async (req, res) => {
  try {
    const { target, value, type } = req.body;
    const userId = req.user?.id;
    if (!target || !value) {
      return res.status(400).json({ error: "❌ Missing target or value." });
    }
    let query = "";
    let values = [];
    switch (target) {
      case "department": query = "INSERT INTO Departments (name) VALUES (?)"; break;
      case "technical": query = "INSERT INTO Engineers (name) VALUES (?)"; break;
      case "device-type": query = "INSERT INTO DeviceType (DeviceType) VALUES (?)"; break;
      case "problem-status":
        if (!type) return res.status(400).json({ error: "❌ Missing device type for problem status." });
        if (type === "pc") query = "INSERT INTO problemstates_pc (problem_text) VALUES (?)";
        else if (type === "printer") query = "INSERT INTO problemstates_printer (problem_text) VALUES (?)";
        else if (type === "scanner") query = "INSERT INTO problemstates_scanner (problem_text) VALUES (?)";
        else {
          query = "INSERT INTO problemstates_maintance_device (problemStates_Maintance_device_name, device_type) VALUES (?, ?)";
          values = [value, type];
        }
        break;
      case "ticket-type": query = "INSERT INTO ticket_types (type_name) VALUES (?)"; break;
      case "report-status": query = "INSERT INTO report_statuses (status_name) VALUES (?)"; break;
      case "generation": query = "INSERT INTO processor_generations (generation_number) VALUES (?)"; break;
      case "processor": query = "INSERT INTO cpu_types (cpu_name) VALUES (?)"; break;
      case "ram": query = "INSERT INTO ram_types (ram_type) VALUES (?)"; break;
      case "model": query = "INSERT INTO pc_model (model_name) VALUES (?)"; break;
      case "os": query = "INSERT INTO os_types (os_name) VALUES (?)"; break;
      case "drive": query = "INSERT INTO Hard_Drive_Types (drive_type) VALUES (?)"; break;
      case "ram-size": query = "INSERT INTO RAM_Sizes (ram_size) VALUES (?)"; break;
      case "ink-type": query = "INSERT INTO Ink_Types (ink_type) VALUES (?)"; break;
      case "printer-type": query = "INSERT INTO Printer_Types (printer_type) VALUES (?)"; break;
      case "scanner-type": query = "INSERT INTO Scanner_Types (scanner_type) VALUES (?)"; break;
      default: return res.status(400).json({ error: "❌ Invalid target." });
    }
    const labelMap = {
      "department":      { en: "Department",      ar: "القسم" },
      "technical":       { en: "Engineer",        ar: "المهندس" },
      "device-type":     { en: "Device Type",     ar: "نوع الجهاز" },
      "problem-status":  { en: "Problem",         ar: "المشكلة" },
      "ticket-type":     { en: "Ticket Type",     ar: "نوع التذكرة" },
      "report-status":   { en: "Report Status",   ar: "حالة التقرير" },
      "generation":      { en: "CPU Generation",  ar: "جيل المعالج" },
      "processor":       { en: "CPU",             ar: "المعالج" },
      "ram":             { en: "RAM Type",        ar: "نوع الذاكرة" },
      "model":           { en: "Model",           ar: "الموديل" },
      "os":              { en: "Operating System",ar: "نظام التشغيل" },
      "drive":           { en: "Drive Type",      ar: "نوع القرص" },
      "ram-size":        { en: "RAM Size",        ar: "حجم الذاكرة" },
      "ink-type":        { en: "Ink Type",        ar: "نوع الحبر" },
      "printer-type":    { en: "Printer Type",    ar: "نوع الطابعة" },
      "scanner-type":    { en: "Scanner Type",    ar: "نوع الماسح" }
    };
    if (values.length === 0) values = [value];
    await db.promise().query(query, values);
    db.query("SELECT name FROM users WHERE id = ?", [userId], (errUser, resultUser) => {
      if (!errUser && resultUser.length > 0) {
        const userName = resultUser[0].name;
        logActivity(userId, userName, JSON.stringify(makeBilingualLog(
            `Added ${labelMap[target]?.en || target}`,
            `إضافة ${labelMap[target]?.ar || target}`
          )), JSON.stringify(makeBilingualLog(
            `Added '${value}' to ${labelMap[target]?.en || target}`,
            `تمت إضافة '${value}' إلى ${labelMap[target]?.ar || target}`
          )));
      }
    });
    return res.json({ message: `✅ Successfully added ${value} to ${target}` });
  } catch (err) {
    console.error("❌ Error in add-option-internal-ticket:", err);
    return res.status(500).json({ error: "❌ Server error while adding option." });
  }
}; 
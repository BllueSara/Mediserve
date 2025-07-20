const db = require('../db');
const { makeBilingualLog } = require('../utils/makeBilingualLog');

<<<<<<< HEAD
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

=======
>>>>>>> dfa1ff18f501a113e159d8d77f54553e04171c45
exports.addDeviceModel = (req, res) => {
  const { model_name, device_type_name } = req.body;
  const userId = req.user?.id;
  db.query("SELECT name FROM users WHERE id = ?", [userId], (err, result) => {
    if (err || result.length === 0) {
      return res.status(500).json({ error: "❌ Failed to get user name" });
    }
    const userName = result[0].name;
    if (!model_name || !device_type_name) {
      return res.status(400).json({ error: "❌ Missing model name or type" });
    }
    const cleanedType = device_type_name.trim().toLowerCase();
    let table = "";
    if (cleanedType === "pc") table = "PC_Model";
    else if (cleanedType === "printer") table = "Printer_Model";
    else if (cleanedType === "scanner") table = "Scanner_Model";
    else table = "Maintance_Device_Model";
    const checkQuery = table === "Maintance_Device_Model"
      ? `SELECT * FROM ${table} WHERE model_name = ? AND device_type_name = ?`
      : `SELECT * FROM ${table} WHERE model_name = ?`;
    const checkValues = table === "Maintance_Device_Model"
      ? [model_name, device_type_name]
      : [model_name];
    db.query(checkQuery, checkValues, (err, existing) => {
      if (err) return res.status(500).json({ error: "Database check failed" });
      if (existing.length > 0) {
        return res.status(400).json({ error: `⚠️ Model \"${model_name}\" already exists` });
      }
      const insertQuery = table === "Maintance_Device_Model"
        ? `INSERT INTO ${table} (model_name, device_type_name) VALUES (?, ?)`
        : `INSERT INTO ${table} (model_name) VALUES (?)`;
      const insertValues = table === "Maintance_Device_Model"
        ? [model_name, device_type_name]
        : [model_name];
      db.query(insertQuery, insertValues, (err2, result2) => {
        if (err2) return res.status(500).json({ error: "Database insert failed" });
<<<<<<< HEAD
        logActivity(userId, userName, JSON.stringify(makeBilingualLog("Add Device Model", "إضافة موديل جهاز")), JSON.stringify(makeBilingualLog(
            `Added new model '${model_name}' for device type '${device_type_name}'`,
            `تمت إضافة موديل جديد '${model_name}' لنوع الجهاز '${device_type_name}'`
          )))
        .then(() => {
          res.json({ message: `✅ Model '${model_name}'` });
        })
        .catch(logErr => {
          if (logErr) console.error("❌ Failed to log activity:", logErr);
        });
=======
        const logQuery = `INSERT INTO Activity_Logs (user_id, user_name, action, details) VALUES (?, ?, ?, ?)`;
        const logValues = [
          userId,
          userName,
          JSON.stringify(makeBilingualLog("Add Device Model", "إضافة موديل جهاز")),
          JSON.stringify(makeBilingualLog(
            `Added new model '${model_name}' for device type '${device_type_name}'`,
            `تمت إضافة موديل جديد '${model_name}' لنوع الجهاز '${device_type_name}'`
          ))
        ];
        db.query(logQuery, logValues, (logErr) => {
          if (logErr) console.error("❌ Failed to log activity:", logErr);
        });
        res.json({ message: `✅ Model '${model_name}'` });
>>>>>>> dfa1ff18f501a113e159d8d77f54553e04171c45
      });
    });
  });
}; 
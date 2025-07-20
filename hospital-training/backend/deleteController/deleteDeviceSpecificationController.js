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

const deleteDeviceSpecificationController = async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: "❌ Missing device ID" });
  }

  try {
    const [deviceInfo] = await db.promise().query(
      `SELECT device_name, Serial_Number, Governmental_Number FROM Maintenance_Devices WHERE id = ?`,
      [id]
    );

    if (!deviceInfo.length) {
      return res.status(404).json({ error: "❌ Device not found" });
    }

    // ✅ Soft delete: علّم الجهاز كمحذوف
    const [updateResult] = await db.promise().query(
      `UPDATE Maintenance_Devices SET is_deleted = TRUE WHERE id = ?`,
      [id]
    );

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ error: "❌ Already deleted or not found" });
    }

    const userId = req.user?.id;
    const [userRow] = await db.promise().query('SELECT name FROM users WHERE id = ?', [userId]);
    const userName = userRow[0]?.name || 'Unknown';

    await logActivity(
      userId,
      userName,
      JSON.stringify(makeBilingualLog("Deleted", "حذف")),
      JSON.stringify(makeBilingualLog(
        `Soft-deleted device ID ${id} (${deviceInfo[0].device_name})`,
        `تم حذف الجهاز (حذف منطقي) برقم ${id} (${deviceInfo[0].device_name})`
      ))
    );
    res.json({ message: "✅ Device soft-deleted successfully." });

  } catch (err) {
    console.error("❌ Delete device error:", err);
    res.status(500).json({ error: "Server error during deletion." });
  }
};

module.exports = { deleteDeviceSpecificationController }; 
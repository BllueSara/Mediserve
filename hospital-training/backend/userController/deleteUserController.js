const db = require("../db");
function makeBilingualLog(en, ar) { return { en, ar }; }
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
async function deleteUserController(req, res) {
  const userId = req.params.id;
  try {
    const [result] = await db.promise().query('DELETE FROM users WHERE id = ?', [userId]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found' });
    await logActivity(userId, 'System', makeBilingualLog('Delete User', 'حذف مستخدم'), makeBilingualLog(`User ${userId} deleted.`, `تم حذف المستخدم ${userId}.`));
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete user' });
  }
}
module.exports = deleteUserController; 
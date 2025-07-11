const db = require("../db");
function makeBilingualLog(en, ar) { return { en, ar }; }
function logActivity(userId, userName, action, details) {
  if (typeof action === 'object') action = JSON.stringify(action);
  if (typeof details === 'object') details = JSON.stringify(details);
  const sql = `INSERT INTO Activity_Logs (user_id, user_name, action, details) VALUES (?, ?, ?, ?)`;
  db.query(sql, [userId, userName, action, details], (err) => {
    if (err) console.error('❌ Error logging activity:', err);
  });
}
const deleteUserController = (req, res) => {
  const userId = req.params.id;
  db.query('DELETE FROM users WHERE id = ?', [userId], (err, result) => {
    if (err) return res.status(500).json({ message: 'Failed to delete user' });
    if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found' });
    logActivity(
      userId,
      'System',
      makeBilingualLog('Delete User', 'حذف مستخدم'),
      makeBilingualLog(
        `User ID ${userId} deleted`,
        `تم حذف المستخدم ذو المعرف ${userId}`
      )
    );
    res.json({ message: 'User deleted successfully' });
  });
};
module.exports = deleteUserController; 
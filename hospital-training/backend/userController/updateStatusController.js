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
const updateStatusController = (req, res) => {
  const userId = req.params.id;
  const { status } = req.body;
  if (!['active', 'inactive'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }
  db.query('UPDATE users SET status = ? WHERE id = ?', [status, userId], (err) => {
    if (err) return res.status(500).json({ message: 'Failed to update status' });
    logActivity(
      userId,
      'System',
      makeBilingualLog('Toggle Status', 'تغيير حالة المستخدم'),
      makeBilingualLog(
        `Status changed to ${status}`,
        `تم تغيير حالة المستخدم إلى ${status === 'active' ? 'نشط' : 'غير نشط'}`
      )
    );
    res.json({ message: `User status updated to ${status}` });
  });
};
module.exports = updateStatusController; 
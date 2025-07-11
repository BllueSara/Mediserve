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
const updateRoleController = (req, res) => {
  const targetUserId = req.params.id;
  const { role } = req.body;
  if (!['admin', 'user'].includes(role)) {
    return res.status(400).json({ message: '❌ Invalid role value' });
  }
  db.query('UPDATE users SET role = ? WHERE id = ?', [role, targetUserId], (err) => {
    if (err) return res.status(500).json({ message: '❌ Failed to update role' });
    logActivity(
      targetUserId,
      'System',
      makeBilingualLog('Change Role', 'تغيير الدور'),
      makeBilingualLog(
        `Changed role to ${role}`,
        `تم تغيير الدور إلى ${role === 'admin' ? 'مشرف' : 'مستخدم'}`
      )
    );
    res.json({ message: `✅ Role updated to ${role}` });
  });
};
module.exports = updateRoleController; 
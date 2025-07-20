const db = require("../db");
function makeBilingualLog(en, ar) { return { en, ar }; }
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
=======
function logActivity(userId, userName, action, details) {
>>>>>>> dfa1ff18f501a113e159d8d77f54553e04171c45
  if (typeof action === 'object') action = JSON.stringify(action);
  if (typeof details === 'object') details = JSON.stringify(details);
  const sql = `INSERT INTO Activity_Logs (user_id, user_name, action, details) VALUES (?, ?, ?, ?)`;
  db.query(sql, [userId, userName, action, details], (err) => {
    if (err) console.error('❌ Error logging activity:', err);
  });
}
<<<<<<< HEAD
async function updateRoleController(req, res) {
=======
const updateRoleController = (req, res) => {
>>>>>>> dfa1ff18f501a113e159d8d77f54553e04171c45
  const targetUserId = req.params.id;
  const { role } = req.body;
  if (!['admin', 'user'].includes(role)) {
    return res.status(400).json({ message: '❌ Invalid role value' });
  }
<<<<<<< HEAD
  try {
    await db.promise().query('UPDATE users SET role = ? WHERE id = ?', [role, targetUserId]);
    await logActivity(targetUserId, 'System', makeBilingualLog('Update Role', 'تحديث صلاحيات المستخدم'), makeBilingualLog(`Role updated for user ${targetUserId}.`, `تم تحديث صلاحيات المستخدم ${targetUserId}.`));
    res.json({ message: `✅ Role updated to ${role}` });
  } catch (err) {
    return res.status(500).json({ message: '❌ Failed to update role' });
  }
}
=======
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
>>>>>>> dfa1ff18f501a113e159d8d77f54553e04171c45
module.exports = updateRoleController; 
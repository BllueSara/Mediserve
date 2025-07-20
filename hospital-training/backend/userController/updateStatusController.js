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
async function updateStatusController(req, res) {
=======
const updateStatusController = (req, res) => {
>>>>>>> dfa1ff18f501a113e159d8d77f54553e04171c45
  const userId = req.params.id;
  const { status } = req.body;
  if (!['active', 'inactive'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }
<<<<<<< HEAD
  try {
    await db.promise().query('UPDATE users SET status = ? WHERE id = ?', [status, userId]);
    await logActivity(userId, 'System', makeBilingualLog('Update Status', 'تحديث حالة المستخدم'), makeBilingualLog(`Status updated for user ${userId}.`, `تم تحديث حالة المستخدم ${userId}.`));
    res.json({ message: `User status updated to ${status}` });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update status' });
  }
}
=======
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
>>>>>>> dfa1ff18f501a113e159d8d77f54553e04171c45
module.exports = updateStatusController; 
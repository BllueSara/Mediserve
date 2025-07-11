const db = require("../db");
const bcrypt = require('bcryptjs');
function makeBilingualLog(en, ar) { return { en, ar }; }
function logActivity(userId, userName, action, details) {
  if (typeof action === 'object') action = JSON.stringify(action);
  if (typeof details === 'object') details = JSON.stringify(details);
  const sql = `INSERT INTO Activity_Logs (user_id, user_name, action, details) VALUES (?, ?, ?, ?)`;
  db.query(sql, [userId, userName, action, details], (err) => {
    if (err) console.error('❌ Error logging activity:', err);
  });
}
const adminResetPasswordController = async (req, res) => {
  const userId = req.params.id;
  const { newPassword } = req.body;
  if (!newPassword) {
    return res.status(400).json({ message: 'Password is required' });
  }
  try {
    const hashed = await bcrypt.hash(newPassword, 12);
    await db.promise().query('UPDATE users SET password = ? WHERE id = ?', [hashed, userId]);
    logActivity(
      userId,
      'System',
      makeBilingualLog('Reset Password', 'إعادة تعيين كلمة المرور'),
      makeBilingualLog(
        'Password was reset by admin',
        'تمت إعادة تعيين كلمة المرور بواسطة المشرف'
      )
    );
    res.json({ message: '✅ Password updated successfully' });
  } catch (err) {
    console.error("❌ Error resetting password:", err);
    res.status(500).json({ message: '❌ Server error while resetting password' });
  }
};
module.exports = adminResetPasswordController; 
const db = require("../db");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'super_secret_key_123';

function makeBilingualLog(en, ar) {
  return { en, ar };
}

<<<<<<< HEAD
async function logActivity(userId, userName, action, details) {
  // Check cancel_logs permission
  try {
    const [rows] = await db.promise().query('SELECT cancel_logs FROM user_permissions WHERE user_id = ?', [userId]);
    if (rows.length && rows[0].cancel_logs) {
      console.log(`🚫 Logging canceled for user ${userId} due to cancel_logs permission.`);
      return;
    }
  } catch (err) {
    console.error('❌ Error checking cancel_logs permission:', err);
    // If error, proceed with logging to avoid losing logs
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

const loginController = (req, res) => {
  const { email: identifier, password, lang = 'en' } = req.body;
  const messages = {
    en: {
      missing: 'Missing login or password',
      invalid: 'Invalid login or password',
      inactive: '🚫 Your account is inactive. Please contact the administrator.',
      success: 'LOGIN successful'
    },
    ar: {
      missing: '❌ الرجاء إدخال بيانات الدخول',
      invalid: '❌ بيانات الدخول غير صحيحة',
      inactive: '🚫 حسابك غير نشط. الرجاء التواصل مع المشرف.',
      success: '✅ تم تسجيل الدخول بنجاح'
    }
  };
  const t = messages[lang] || messages.en;
  if (!identifier || !password) {
    return res.status(400).json({ message: t.missing });
  }
  db.query(
    'SELECT * FROM users WHERE email = ? OR name = ? OR name LIKE ? OR name LIKE ? OR employee_id = ?',
    [identifier, identifier, identifier + '|%', '%|' + identifier, identifier],
    async (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error' });
      if (results.length === 0) {
        return res.status(401).json({ message: t.invalid });
      }
      const user = results[0];
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: t.invalid });
      }
      if (user.status === 'inactive') {
        return res.status(403).json({ message: t.inactive });
      }
      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
<<<<<<< HEAD
      await logActivity(
=======
      logActivity(
>>>>>>> dfa1ff18f501a113e159d8d77f54553e04171c45
        user.id,
        user.name,
        makeBilingualLog('Login', 'تسجيل دخول'),
        makeBilingualLog(
          `User ${user.name} logged in successfully.`,
          `تم تسجيل دخول المستخدم ${user.name} بنجاح.`
        )
      );
      res.json({
        message: t.success,
        token,
        role: user.role,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      });
    }
  );
};

module.exports = loginController; 
const db = require("../db");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'super_secret_key_123';

 function makeBilingualLog(en, ar) {
  return { en, ar };
}

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

async function registerController(req, res) {
  const { name, email, password, phone, department, employee_id } = req.body;
  const isAdmin = name?.toLowerCase() === 'admin|مشرف';
  const isEngineer = department?.toLowerCase().includes('technology') || department?.includes('تقنية');
  if (!name || !email || !password || (!isAdmin && !employee_id)) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  if (isAdmin) {
    db.query(`SELECT * FROM users WHERE role = 'admin'`, (err, checkAdmin) => {
      if (err) {
        console.error('💥 Register DB error:', err);
        return res.status(500).json({ message: err.message });
      }
      if (checkAdmin.length > 0) {
        return res.status(400).json({ message: 'Admin already exists' });
      }
      checkForDuplicates();
    });
  } else {
    checkForDuplicates();
  }
  function checkForDuplicates() {
    db.query(
      'SELECT * FROM users WHERE email = ? OR phone = ? OR employee_id = ?',
      [email, phone || null, employee_id || null],
      async (err, results) => {
        if (err) return res.status(500).json({ message: 'Database Error' });
        if (results.length > 0) {
          const existing = results[0];
          if (existing.email === email) {
            return res.status(409).json({ message: 'Email already registered' });
          }
          if (!isAdmin && existing.phone === phone) {
            return res.status(409).json({ message: 'Phone number already registered' });
          }
          if (!isAdmin && existing.employee_id === employee_id) {
            return res.status(409).json({ message: 'Employee ID already registered' });
          }
        }
        const hashedPassword = await bcrypt.hash(password, 12);
        const role = isAdmin ? 'admin' : 'user';
        const sql = `INSERT INTO users (name, email, password, phone, department, employee_id, role)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const values = [
          name,
          email,
          hashedPassword,
          isAdmin ? null : phone,
          department || '',
          isAdmin ? null : employee_id,
          role
        ];
        db.query(sql, values, async (err, result) => {
          if (err) return res.status(500).json({ message: 'Error saving user' });
          const userId = result.insertId;
          const defaultPermissions = {
            device_access: 'all',
            full_access: false,
            view_access: true,
            add_items: true,
            edit_items: false,
            delete_items: false,
            check_logs: false,
            edit_permission: false,
            share_items: false
          };
          db.query(
            `INSERT INTO user_permissions (
              user_id,
              device_access,
              full_access,
              view_access,
              add_items,
              edit_items,
              delete_items,
              check_logs,
              edit_permission,
              share_items
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              userId,
              defaultPermissions.device_access,
              defaultPermissions.full_access,
              defaultPermissions.view_access,
              defaultPermissions.add_items,
              defaultPermissions.edit_items,
              defaultPermissions.delete_items,
              defaultPermissions.check_logs,
              defaultPermissions.edit_permission,
              defaultPermissions.share_items
            ],
            (err) => {
              if (err) console.warn("❌ Failed to insert default permissions:", err);
            }
          );
          if (isEngineer) {
            db.query(`INSERT INTO Engineers (name) VALUES (?)`, [name], (engErr) => {
              if (engErr) console.warn("⚠️ Couldn't insert into Engineers:", engErr);
            });
          }
          const token = jwt.sign({ id: userId, role }, JWT_SECRET, { expiresIn: '1d' });
          await logActivity(userId, name, makeBilingualLog('Register', 'تسجيل مستخدم جديد'), makeBilingualLog(`User ${name} registered.`, `تم تسجيل المستخدم ${name}.`));
          res.status(201).json({
            message: 'User registered successfully',
            token,
            role,
            user: {
              id: userId,
              name,
              email
            }
          });
        });
      }
    );
  }
};

module.exports = registerController; 
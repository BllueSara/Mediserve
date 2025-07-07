const express = require('express');
const db = require("./db");
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');


const XLSX = require('xlsx');



const fs = require('fs');

const path = require('path');




const nodemailer = require('nodemailer');
const crypto = require('crypto');



// تقديم ملفات HTML من مجلد AuthPage
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'sup.it.system.medical@gmail.com',
    pass: 'bwub ozwj dzlg uicp' // App Password من Gmail
  }
});


const app = express();
app.use(cors());
app.use(bodyParser.json());

// Serve static files from all directories
app.use(express.static(path.join(__dirname)));
app.use(express.static(path.join(__dirname, '..')));
app.use(express.static(path.join(__dirname, '..', '..')));

// Default route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Home', 'Home.html'));
});


// مفتاح التوكن (مهم تحفظه بمكان آمن)
const JWT_SECRET = 'super_secret_key_123';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;  // ← هنا يصير معك user.id في كل route
    next();
  });
}


// تسجيل المستخدم الجديد
app.post('/register', async (req, res) => {
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

      checkForDuplicates(); // 🔁 تابع التنفيذ فقط إذا ما في Admin مسبق
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

        db.query(sql, values, (err, result) => {
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

          logActivity(userId, name, 'Register', `User ${name} created an account using ${email}`);

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
});

app.get('/users', (req, res) => {
    db.query('SELECT id, name, email, employee_id FROM users', (err, results) => {
        if (err) {
            console.error('Error fetching users:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

app.get('/me/status', authenticateToken, (req, res) => {
  const userId = req.user.id;
  db.query('SELECT status FROM users WHERE id = ?', [userId], (err, result) => {
    if (err || result.length === 0) {
      return res.status(500).json({ status: 'error' });
    }
    res.json({ status: result[0].status });
  });
});





app.post('/login', (req, res) => {
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
    'SELECT * FROM users WHERE email = ? OR name = ? OR employee_id = ?',
    [identifier, identifier, identifier],
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

      logActivity(user.id, user.name, 'Login', `User ${user.name} logged in successfully.`);

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
});

// ✅ تحديث دور المستخدم
app.put('/users/:id/role', authenticateToken, (req, res) => {
  const targetUserId = req.params.id;
  const { role } = req.body;

  if (!['admin', 'user'].includes(role)) {
    return res.status(400).json({ message: '❌ Invalid role value' });
  }

  db.query('UPDATE users SET role = ? WHERE id = ?', [role, targetUserId], (err) => {
    if (err) return res.status(500).json({ message: '❌ Failed to update role' });

    logActivity(targetUserId, 'System', 'Change Role', `Changed role to ${role}`);
    res.json({ message: `✅ Role updated to ${role}` });
  });
});





app.get("/Departments", (req, res) => {
  const query = "SELECT * FROM Departments  ORDER BY name ASC ";
  db.query(query, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(result);
  });
});


app.get('/notifications', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;

  const query = role === 'admin'
    ? `SELECT * FROM Notifications ORDER BY created_at DESC LIMIT 50`
    : `SELECT * FROM Notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`;

  db.query(query, role === 'admin' ? [] : [userId], (err, result) => {
    if (err) {
      console.error('❌ Error loading notifications:', err);
      return res.status(500).json({ error: 'Failed to load notifications' });
    }
    res.json(result);
  });
});
// ✅ تحديث صلاحيات المستخدم
app.put('/users/:id/permissions', authenticateToken, (req, res) => {
  const userId = req.params.id;
  const {
    device_access,
    full_access,
    view_access,
    add_items,
    edit_items,
    delete_items,
    check_logs,
    edit_permission,
    share_items
  } = req.body;

  const sql = `
    INSERT INTO user_permissions (
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
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      device_access = VALUES(device_access),
      full_access = VALUES(full_access),
      view_access = VALUES(view_access),
      add_items = VALUES(add_items),
      edit_items = VALUES(edit_items),
      delete_items = VALUES(delete_items),
      check_logs = VALUES(check_logs),
      edit_permission = VALUES(edit_permission),
      share_items = VALUES(share_items)
  `;

  const values = [
    userId,
    device_access,
    full_access,
    view_access,
    add_items,
    edit_items,
    delete_items,
    check_logs,
    edit_permission,
    share_items
  ];

  db.query(sql, values, (err) => {
    if (err) {
      console.error("❌ Error saving permissions:", err);
      return res.status(500).json({ message: "Failed to save permissions" });
    }

    res.json({ message: "✅ Permissions saved successfully" });
  });
});

app.delete('/notifications/clear', authenticateToken, (req, res) => {
  const userId = req.user.id;
  db.query(`DELETE FROM Notifications WHERE user_id = ?`, [userId], (err) => {
    if (err) {
      console.error('❌ Error clearing notifications:', err);
      return res.status(500).json({ error: 'Failed to clear notifications' });
    }
    res.json({ message: '✅ All notifications cleared.' });
  });
});

// ✅ Get all users
// جلب كل المستخدمين
app.get('/users', authenticateToken, (req, res) => {
  db.query('SELECT id, name, email, department, employee_id FROM users', (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json(results);
  });
});

// جلب مستخدم مفصل
app.get('/users/:id', authenticateToken, (req, res) => {
  const userId = req.params.id;
  db.query('SELECT * FROM users WHERE id = ?', [userId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (!results.length) return res.status(404).json({ message: 'User not found' });
    res.json(results[0]);
  });
});

// Get user permissions
// Get user permissions
app.get('/users/:id/permissions', authenticateToken, (req, res) => {
  const userId = req.params.id;

  const sql = `SELECT * FROM user_permissions WHERE user_id = ?`;

  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });

    if (!results.length) {
      return res.json({
        device_access: 'none',
        full_access: false,
        view_access: true,
        add_items: false,
        edit_items: false,
        delete_items: false,
        check_logs: false,
        edit_permission: false,
        share_items: false

      });
    }

    res.json(results[0]);
  });
});

app.get('/users/:id/with-permissions', (req, res) => {
  const userId = req.params.id;

  db.query('SELECT id, name, email FROM users WHERE id = ?', [userId], (err, userResult) => {
    if (err || userResult.length === 0) {
      return res.status(500).json({ message: 'Failed to load user' });
    }

    const user = userResult[0];

    db.query(
      `SELECT 
        device_access,
        full_access,
        view_access,
        add_items,
        edit_items,
        delete_items,
        check_logs,
        edit_permission,
        share_items
       FROM user_permissions WHERE user_id = ?`,
      [userId],
      (permErr, permResult) => {
        if (permErr) {
          return res.status(500).json({ message: 'Failed to load permissions' });
        }

        let permissions = {
          device_access: 'none',
          full_access: false,
          view_access: false,
          add_items: false,
          edit_items: false,
          delete_items: false,
          check_logs: false,
          edit_permission: false,
          share_items: false
        };

        if (permResult.length > 0) {
          permissions = permResult[0];
        }

        res.json({
          ...user,
          permissions
        });
      }
    );
  });
});




app.put('/users/:id/status', authenticateToken, (req, res) => {
  const userId = req.params.id;
  const { status } = req.body;

  if (!['active', 'inactive'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  db.query('UPDATE users SET status = ? WHERE id = ?', [status, userId], (err) => {
    if (err) return res.status(500).json({ message: 'Failed to update status' });

    logActivity(userId, 'System', 'Toggle Status', `Status changed to ${status}`);
    res.json({ message: `User status updated to ${status}` });
  });
});
app.delete('/users/:id', authenticateToken, (req, res) => {
  const userId = req.params.id;

  db.query('DELETE FROM users WHERE id = ?', [userId], (err, result) => {
    if (err) return res.status(500).json({ message: 'Failed to delete user' });
    if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found' });

    logActivity(userId, 'System', 'Delete User', `User ID ${userId} deleted`);
    res.json({ message: 'User deleted successfully' });
  });
});


app.delete('/notifications/:id', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const notifId = req.params.id;

  db.query(`DELETE FROM Notifications WHERE id = ? AND user_id = ?`, [notifId, userId], (err) => {
    if (err) {
      console.error('❌ Error deleting notification:', err);
      return res.status(500).json({ error: 'Failed to delete notification' });
    }
    res.json({ message: '✅ Notification deleted.' });
  });
});

// ✅ تحديث الإشعارات إلى "مقروءة"
app.post('/notifications/mark-as-seen', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    await db.promise().query(
      `UPDATE Notifications SET is_seen = TRUE WHERE user_id = ? AND is_seen = FALSE`,
      [userId]
    );
    res.json({ message: 'All notifications marked as seen' });
  } catch (err) {
    console.error('❌ Error marking notifications:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/notifications/unseen-count', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const [[{ count }]] = await db.promise().query(
      `SELECT COUNT(*) AS count FROM Notifications WHERE user_id = ? AND is_seen = FALSE`,
      [userId]
    );
    res.json({ count });
  } catch (err) {
    console.error('❌ Error fetching unseen count:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function logActivity(userId, userName, action, details) {
  const sql = `INSERT INTO Activity_Logs (user_id, user_name, action, details) VALUES (?, ?, ?, ?)`;
  db.query(sql, [userId, userName, action, details], (err) => {
    if (err) console.error('❌ Error logging activity:', err);
  });
}


app.get('/activity-logs', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;

  const sql = userRole === 'admin'
    ? `SELECT * FROM Activity_Logs ORDER BY timestamp DESC LIMIT 100`
    : `SELECT * FROM Activity_Logs WHERE user_id = ? ORDER BY timestamp DESC LIMIT 100`;

  const params = userRole === 'admin' ? [] : [userId];

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error('❌ Failed to load activity logs:', err);
      return res.status(500).json({ error: 'Failed to load activity logs' });
    }
    res.json(results);
  });
});

app.post('/reset-password/:token', async (req, res) => {
  const token = req.params.token;
  const { newPassword } = req.body;

  db.query(
    'SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > NOW()',
    [token],
    async (err, users) => {
      if (err || users.length === 0) return res.status(400).json({ message: 'Invalid or expired token' });

      const hashed = await bcrypt.hash(newPassword, 12);
      db.query(
        'UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
        [hashed, users[0].id],
        (updateErr) => {
          if (updateErr) return res.status(500).json({ message: 'Failed to reset password' });
          res.json({ message: 'Password has been successfully reset' });
        }
      );
    }
  );
});


app.post('/forgot-password', (req, res) => {
  const { email, } = req.body;
  if (!email) return res.status(400).json({ message: 'Please provide email' });

  db.query('SELECT * FROM users WHERE email = ?', [email], (err, users) => {
    if (err || users.length === 0) return res.status(404).json({ message: 'Email not found' });

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000);

    db.query(
      'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?',
      [token, expires, email],
      (updateErr) => {
        if (updateErr) return res.status(500).json({ message: 'Database error' });

        const resetLink = `http://localhost:4000/reset-password.html?token=${token}`;
        const currentDate = new Date().toLocaleDateString('ar-SA', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        const mailOptions = {
          from: 'medi.servee1@gmail.com',
          to: email,
          subject: 'إعادة تعيين كلمة المرور - MediServe',
          html: `
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>إعادة تعيين كلمة المرور - MediServe</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; direction: rtl;">
              
              <!-- Container الرئيسي -->
              <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden;">
                
                <!-- Header مع اللون -->
                <div style="background: linear-gradient(135deg, #dc3545, #dc3545dd); padding: 25px; text-align: center;">
                  <div style="display: inline-block; background-color: rgba(255,255,255,0.2); border-radius: 50%; width: 60px; height: 60px; line-height: 60px; margin-bottom: 15px;">
                    <span style="font-size: 24px; color: white;">🔐</span>
                  </div>
                  <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 300;">MediServe</h1>
                  <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 16px;">إعادة تعيين كلمة المرور</p>
                </div>
                
                <!-- محتوى الإيميل -->
                <div style="padding: 30px;">
                  
                  <!-- رسالة الترحيب -->
                  <div style="margin-bottom: 25px;">
                    <h2 style="color: #333; margin: 0 0 10px 0; font-size: 20px; font-weight: 500;">مرحباً 👋</h2>
                    <p style="color: #666; margin: 0; line-height: 1.6; font-size: 16px;">لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك في نظام MediServe</p>
                  </div>
                  
                  <!-- تفاصيل الطلب -->
                  <div style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); border-radius: 10px; padding: 25px; margin-bottom: 25px; border-right: 4px solid #dc3545;">
                    <div style="display: flex; align-items: center; margin-bottom: 15px;">
                      <div style="width: 12px; height: 12px; background-color: #dc3545; border-radius: 50%; margin-left: 10px;"></div>
                      <h3 style="color: #333; margin: 0; font-size: 18px; font-weight: 600;">طلب إعادة تعيين كلمة المرور</h3>
                    </div>
                    <div style="background-color: white; border-radius: 8px; padding: 20px; border: 1px solid #e0e0e0;">
                      <p style="color: #495057; margin: 0 0 15px 0; line-height: 1.7; font-size: 15px; text-align: justify;">
                        إذا كنت قد طلبت إعادة تعيين كلمة المرور، يرجى النقر على الزر أدناه لإنشاء كلمة مرور جديدة.
                      </p>
                      <p style="color: #6c757d; margin: 0; line-height: 1.7; font-size: 14px; text-align: justify;">
                        <strong>ملاحظة:</strong> هذا الرابط صالح لمدة ساعة واحدة فقط. إذا لم تقم بإعادة تعيين كلمة المرور خلال هذه المدة، ستحتاج إلى طلب رابط جديد.
                      </p>
                    </div>
                  </div>
                  
                  <!-- معلومات إضافية -->
                  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 15px; margin-bottom: 25px; text-align: center;">
                    <p style="color: #6c757d; margin: 0; font-size: 14px;">
                      <span style="font-weight: 600;">تاريخ الطلب:</span> ${currentDate}
                    </p>
                  </div>
                  
                  <!-- زر إعادة تعيين كلمة المرور -->
                  <div style="text-align: center; margin-bottom: 25px;">
                    <a href="${resetLink}" style="background: linear-gradient(135deg, #dc3545, #dc3545dd); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3); transition: all 0.3s ease;">
                      🔑 إعادة تعيين كلمة المرور
                    </a>
                  </div>
                  
                  <!-- تحذير أمني -->
                  <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                    <div style="display: flex; align-items: center; margin-bottom: 10px;">
                      <span style="font-size: 18px; margin-left: 10px;">⚠️</span>
                      <h4 style="color: #856404; margin: 0; font-size: 16px; font-weight: 600;">تنبيه أمني</h4>
                    </div>
                    <ul style="color: #856404; margin: 0; padding-right: 20px; font-size: 14px; line-height: 1.6;">
                      <li>لا تشارك هذا الرابط مع أي شخص آخر</li>
                      <li>تأكد من أنك على الموقع الصحيح قبل إدخال كلمة المرور الجديدة</li>
                      <li>إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذا الإيميل</li>
                    </ul>
                  </div>
                  
                  <!-- معلومات النظام -->
                  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; text-align: center; border-top: 3px solid #dc3545;">
                    <p style="color: #6c757d; margin: 0 0 10px 0; font-size: 13px; line-height: 1.5;">
                      هذا البريد الإلكتروني تم إرساله تلقائياً من نظام MediServe
                    </p>
                    <p style="color: #6c757d; margin: 0; font-size: 13px; line-height: 1.5;">
                      إذا واجهت أي مشكلة، يرجى التواصل مع فريق الدعم التقني
                    </p>
                  </div>
                  
                </div>
                
                <!-- Footer -->
                <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
                  <p style="color: #6c757d; margin: 0; font-size: 12px;">
                    © 2024 MediServe - نظام إدارة المستشفى
                  </p>
                </div>
                
              </div>
              
            </body>
            </html>
          `
        };

        transporter.sendMail(mailOptions, (error) => {
          if (error) return res.status(500).json({ message: 'Failed to send email' });
          res.json({ message: 'Password reset link sent to your email.' });
        });
      }
    );
  });
});
app.put('/users/:id/reset-password', authenticateToken, async (req, res) => {
  const userId = req.params.id;
  const { newPassword } = req.body;

  if (!newPassword) {
    return res.status(400).json({ message: 'Password is required' });
  }

  try {
    const hashed = await bcrypt.hash(newPassword, 12);
    await db.promise().query('UPDATE users SET password = ? WHERE id = ?', [hashed, userId]);
    logActivity(userId, 'System', 'Reset Password', 'Password was reset by admin');
    res.json({ message: '✅ Password updated successfully' });
  } catch (err) {
    console.error("❌ Error resetting password:", err);
    res.status(500).json({ message: '❌ Server error while resetting password' });
  }
});


//داش بورد
// اول جزئيه 
app.get('/api/maintenance/completion-rates', async (req, res) => {
  try {
    const [generalTotal] = await db.promise().query(`SELECT COUNT(*) AS total FROM General_Maintenance`);
    const [generalClosed] = await db.promise().query(`SELECT COUNT(*) AS closed FROM General_Maintenance WHERE problem_status = 'Closed'`);

    const [regularTotal] = await db.promise().query(`SELECT COUNT(*) AS total FROM Regular_Maintenance`);
    const [regularClosed] = await db.promise().query(`SELECT COUNT(*) AS closed FROM Regular_Maintenance WHERE status = 'Closed'`);

    const [externalTotal] = await db.promise().query(`SELECT COUNT(*) AS total FROM External_Maintenance`);
    const [externalClosed] = await db.promise().query(`SELECT COUNT(*) AS closed FROM External_Maintenance WHERE status = 'Closed'`);

    const calc = (closed, total) => total === 0 ? 0 : Math.round((closed / total) * 100);

    res.json({
      internal: {
        total: generalTotal[0].total,
        closed: generalClosed[0].closed,
        percentage: calc(generalClosed[0].closed, generalTotal[0].total)
      },
      regular: {
        total: regularTotal[0].total,
        closed: regularClosed[0].closed,
        percentage: calc(regularClosed[0].closed, regularTotal[0].total)
      },
      external: {
        total: externalTotal[0].total,
        closed: externalClosed[0].closed,
        percentage: calc(externalClosed[0].closed, externalTotal[0].total)
      }
    });
  } catch (err) {
    console.error("Error fetching completion rates:", err);
    res.status(500).json({ error: "Server error" });
  }
});



//ticket summary
app.get('/api/tickets/summary', authenticateToken, async (req, res) => {
  try {
    const statusQueries = {
      open: `SELECT COUNT(*) AS count FROM Maintenance_Reports WHERE status = 'Open'`,
      in_progress: `SELECT COUNT(*) AS count FROM Maintenance_Reports WHERE status = 'In Progress'`,
      resolved: `SELECT COUNT(*) AS count FROM Maintenance_Reports WHERE status = 'Closed'`,
      open_last_week: `
        SELECT COUNT(*) AS count FROM Maintenance_Reports
        WHERE status = 'Open'
        AND created_at BETWEEN DATE_SUB(CURDATE(), INTERVAL 14 DAY) AND DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      `,
      in_progress_last_week: `
        SELECT COUNT(*) AS count FROM Maintenance_Reports
        WHERE status = 'In Progress'
        AND created_at BETWEEN DATE_SUB(CURDATE(), INTERVAL 14 DAY) AND DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      `,
      resolved_last_week: `
        SELECT COUNT(*) AS count FROM Maintenance_Reports
        WHERE status = 'Closed'
        AND created_at BETWEEN DATE_SUB(CURDATE(), INTERVAL 14 DAY) AND DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      `
    };

    const results = {};
    for (const key in statusQueries) {
      const [rows] = await db.promise().query(statusQueries[key]);
      results[key] = rows[0].count;
    }

    const total = results.open + results.in_progress + results.resolved;

    res.json({
      total,
      open: results.open,
      open_delta: results.open - results.open_last_week,
      in_progress: results.in_progress,
      in_progress_delta: results.in_progress - results.in_progress_last_week,
      resolved: results.resolved,
      resolved_delta: results.resolved - results.resolved_last_week
    });
  } catch (err) {
    console.error('❌ Error fetching ticket summary:', err);
    res.status(500).json({ error: 'Server error' });
  }
});



// iup coning main
app.get('/api/maintenance/upcoming', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.promise().query(`
      SELECT 
        id,
        device_name,
        serial_number,
        governmental_number,
        department_name,
        last_maintenance_date,
        frequency,
        status,
        DATE_ADD(last_maintenance_date,
          INTERVAL CASE frequency
            WHEN '3months' THEN 3
            WHEN '4months' THEN 4
            ELSE 0
          END MONTH
        ) AS next_maintenance_date
      FROM Regular_Maintenance
      WHERE status != 'Closed'
        AND DATE_ADD(last_maintenance_date,
          INTERVAL CASE frequency
            WHEN '3months' THEN 3
            WHEN '4months' THEN 4
            ELSE 0
          END MONTH
        ) >= CURDATE()
      ORDER BY next_maintenance_date ASC
      LIMIT 6
    `);

    res.json(rows);
  } catch (err) {
    console.error('❌ Error fetching upcoming maintenance:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


// Maintenance Overview API (devices summary for internal/external)
app.get('/api/maintenance/overview', authenticateToken, async (req, res) => {
  try {
    // 🔹 سحب الطلبات من General_Maintenance
    const [general] = await db.promise().query(`
      SELECT LOWER(d.device_type) AS type, COUNT(*) AS total
      FROM General_Maintenance gm
      JOIN Maintenance_Devices d ON gm.device_id = d.id
      GROUP BY LOWER(d.device_type)
    `);

    // 🔹 سحب الطلبات من Regular_Maintenance
    const [regular] = await db.promise().query(`
      SELECT LOWER(d.device_type) AS type, COUNT(*) AS total
      FROM Regular_Maintenance rm
      JOIN Maintenance_Devices d ON rm.device_id = d.id
      GROUP BY LOWER(d.device_type)
    `);

    // 🔹 سحب الطلبات من External_Maintenance
    const [external] = await db.promise().query(`
      SELECT LOWER(device_type) AS type, COUNT(*) AS total
      FROM External_Maintenance
      WHERE device_type IS NOT NULL
      GROUP BY LOWER(device_type)
    `);

    const formatted = {
      internal: {},
      external: {},
      types: new Set()
    };

    // 🟦 ندمج العامة + الدورية = internal
    const mergeCounts = (target, source) => {
      for (const row of source) {
        const type = row.type;
        target[type] = (target[type] || 0) + row.total;
        formatted.types.add(type);
      }
    };

    mergeCounts(formatted.internal, general);
    mergeCounts(formatted.internal, regular);
    mergeCounts(formatted.external, external);

    res.json({
      types: Array.from(formatted.types),
      internal: formatted.internal,
      external: formatted.external
    });
  } catch (err) {
    console.error('❌ Error loading maintenance overview:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


//inter
app.get('/api/critical-devices', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.promise().query(`
      SELECT 
        LOWER(d.device_type) AS device_type,
        gm.problem_status AS problem,
        COUNT(*) AS count
      FROM General_Maintenance gm
      JOIN Maintenance_Devices d ON gm.device_id = d.id
      WHERE gm.problem_status IS NOT NULL 
        AND gm.problem_status != ''
      GROUP BY d.device_type, gm.problem_status
      HAVING COUNT(*) >= 10
      ORDER BY COUNT(*) DESC;
    `);

    res.json(rows);
  } catch (err) {
    console.error('❌ Error loading critical devices:', err);
    res.status(500).json({ error: 'Server error' });
  }
});



// ✅ API: أجهزة تحتاج Upgrade (RAM < 8 أو الجيل < 6)
app.get('/api/devices/needs-upgrade', authenticateToken, async (req, res) => {
  const query = `
    SELECT 
      d.id,
      d.device_name,
      d.device_type,
      pi.Computer_Name,
      ram_size.ram_size,
      gen.generation_number,
      os.os_name,
      cpu.cpu_name
    FROM Maintenance_Devices d
    JOIN PC_info pi ON d.serial_number = pi.Serial_Number
    LEFT JOIN RAM_Sizes ram_size ON pi.RamSize_id = ram_size.id
    LEFT JOIN Processor_Generations gen ON pi.Generation_id = gen.id
    LEFT JOIN OS_Types os ON pi.OS_id = os.id
    LEFT JOIN CPU_Types cpu ON pi.Processor_id = cpu.id
    WHERE d.device_type = 'PC'
      AND (
        CAST(ram_size.ram_size AS UNSIGNED) < 8 OR
        CAST(gen.generation_number AS UNSIGNED) < 6 OR
        (os.os_name NOT LIKE '%10%' AND os.os_name NOT LIKE '%11%')
      )
  `;

  try {
    db.query(query, (err, results) => {
      if (err) {
        console.error("❌ Error in upgrade query:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }

      const withRecommendation = results.map(device => {
        const ram = parseInt(device.ram_size);
        const gen = parseInt(device.generation_number);
        const os = (device.os_name || "").toLowerCase();

        let issues = 0;
        if (ram < 8) issues++;
        if (gen < 6) issues++;
        if (os.includes("windows") && !os.includes("10") && !os.includes("11")) issues++;

        let status = issues >= 2 ? 'CRITICAL' : 'WARNING';
        let recommendation = [];

        if (ram < 8) recommendation.push("Upgrade RAM");
        if (gen < 6) recommendation.push("Replace CPU or Device");
        if (os.includes("windows") && !os.includes("10") && !os.includes("11")) recommendation.push("Upgrade OS");

        return {
          ...device,
          status,
          recommendation: recommendation.join(", ")
        };
      });

      res.json(withRecommendation);
    });
  } catch (err) {
    console.error("❌ Failed to get devices needing upgrade:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


app.get('/api/maintenance/monthly-closed', authenticateToken, async (req, res) => {
  try {
    const query = (table, statusField) => `
      SELECT 
        MONTH(created_at) AS month,
        COUNT(*) AS count
      FROM ${table}
      WHERE ${statusField} = 'Closed'
      GROUP BY MONTH(created_at)
    `;

    const [general] = await db.promise().query(query('General_Maintenance', 'problem_status'));
    const [regular] = await db.promise().query(query('Regular_Maintenance', 'status'));
    const [external] = await db.promise().query(query('External_Maintenance', 'status'));

    const formatData = (rows) => {
      const result = Array(12).fill(0);
      rows.forEach(row => {
        result[row.month - 1] = row.count;
      });
      return result;
    };

    res.json({
      months: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
      general: formatData(general),
      regular: formatData(regular),
      external: formatData(external)
    });

  } catch (err) {
    console.error('❌ Error fetching monthly closed stats:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


//يحتاج احلال
app.get('/api/all-device-specs', authenticateToken, async (req, res) => {
  try {
    const [devices] = await db.promise().query(`SELECT * FROM Maintenance_Devices`);

    const results = [];

    for (const device of devices) {
      const type = device.device_type?.toLowerCase().trim();
      const serial = device.serial_number;

      let baseData = {
        id: device.id,
        name: device.device_name,
        Device_Type: device.device_type,
        Serial_Number: device.serial_number,
        Governmental_Number: device.governmental_number,
        MAC_Address: device.mac_address,
        IP_Address: device.ip_address,
        Department: null,
      };

      // القسم
      const [deptRow] = await db.promise().query(`SELECT name FROM Departments WHERE id = ?`, [device.department_id]);
      if (deptRow.length > 0) baseData.Department = deptRow[0].name;

      if (["pc", "desktop", "laptop", "كمبيوتر", "لابتوب"].includes(type)) {
        const [pcRows] = await db.promise().query(`
          SELECT 
            pm.model_name AS Model,
            os.os_name AS OS,
            cpu.cpu_name AS Processor,
            ram.ram_type AS RAM,
            gen.generation_number AS Generation,
            drive.drive_type AS Hard_Drive,
            ram_size.ram_size AS RAM_Size
          FROM PC_info pc
          LEFT JOIN PC_Model pm ON pc.Model_id = pm.id
          LEFT JOIN OS_Types os ON pc.OS_id = os.id
          LEFT JOIN CPU_Types cpu ON pc.Processor_id = cpu.id
          LEFT JOIN RAM_Types ram ON pc.RAM_id = ram.id
          LEFT JOIN Processor_Generations gen ON pc.Generation_id = gen.id
          LEFT JOIN Hard_Drive_Types drive ON pc.Drive_id = drive.id
          LEFT JOIN RAM_Sizes ram_size ON pc.RamSize_id = ram_size.id
          WHERE pc.Serial_Number = ?
        `, [serial]);
        baseData = { ...baseData, ...(pcRows[0] || {}) };
      }

      else if (type === "printer") {
        const [printerRows] = await db.promise().query(`
          SELECT 
            pm.model_name AS Model,
            pt.printer_type AS Printer_Type,
            it.ink_type AS Ink_Type,
            iser.serial_number AS Ink_Serial_Number
          FROM Printer_info pi
          LEFT JOIN Printer_Model pm ON pi.Model_id = pm.id
          LEFT JOIN Printer_Types pt ON pi.PrinterType_id = pt.id
          LEFT JOIN Ink_Types it ON pi.InkType_id = it.id
          LEFT JOIN Ink_Serials iser ON pi.InkSerial_id = iser.id
          WHERE pi.Serial_Number = ?
        `, [serial]);
        baseData = { ...baseData, ...(printerRows[0] || {}) };
      }

      else if (type === "scanner") {
        const [scannerRows] = await db.promise().query(`
          SELECT 
            sm.model_name AS Model,
            st.scanner_type AS Scanner_Type
          FROM Scanner_info si
          LEFT JOIN Scanner_Model sm ON si.Model_id = sm.id
          LEFT JOIN Scanner_Types st ON si.ScannerType_id = st.id
          WHERE si.Serial_Number = ?
        `, [serial]);
        baseData = { ...baseData, ...(scannerRows[0] || {}) };
      }

      else {
        const [modelRows] = await db.promise().query(`
          SELECT model_name FROM Maintance_Device_Model WHERE id = ?
        `, [device.model_id]);
        if (modelRows.length > 0) baseData.Model = modelRows[0].model_name;
      }

      results.push(baseData);
    }

    res.json(results);
  } catch (err) {
    console.error("❌ Error in /api/all-device-specs:", err);
    res.status(500).json({ error: "❌ حدث خطأ أثناء جلب البيانات" });
  }
});







app.get('/api/replacement-report', authenticateToken, async (req, res) => {
  try {
    const [devices] = await db.promise().query(`SELECT * FROM Maintenance_Devices`);
    const results = [];

    for (const device of devices) {
      const type = device.device_type?.toLowerCase().trim();
      const serial = device.serial_number;

      let ram = '', generation = '', os = '';

      if (["pc", "desktop", "laptop", "كمبيوتر", "لابتوب"].includes(type)) {
        const [pcRows] = await db.promise().query(`
          SELECT 
            os.os_name AS OS,
            ram_size.ram_size AS RAM,
            gen.generation_number AS Generation
          FROM PC_info pc
          LEFT JOIN OS_Types os ON pc.OS_id = os.id
          LEFT JOIN RAM_Sizes ram_size ON pc.RamSize_id = ram_size.id
          LEFT JOIN Processor_Generations gen ON pc.Generation_id = gen.id
          WHERE pc.Serial_Number = ?
        `, [serial]);

        const info = pcRows[0] || {};
        ram = info.RAM || '';
        generation = info.Generation || '';
        os = info.OS || '';
      }

      const genNum = parseInt(generation?.replace(/\D/g, '')) || 0;
      const ramNum = parseInt(ram?.replace(/\D/g, '')) || 0;
      const osClean = (os || '').toLowerCase();

      const isOldGen = genNum < 8;
      const isLowRam = ramNum < 4;
      const isOldOS = osClean.includes('windows') && !osClean.includes('10') && !osClean.includes('11');

      const needsReplacement = isOldGen || isLowRam || isOldOS;

      if (needsReplacement) {
        results.push([
          serial,
          os || 'Unknown',
          generation || 'Unknown',
          ram || 'Unknown',
          '8th Gen+, 4GB+ RAM, Win 10/11',
          'Needs Replacement'
        ]);
      }
    }

    if (results.length === 0) {
      return res.status(200).json({ message: 'No devices needing replacement.' });
    }

    const worksheetData = [
      ['Serial Number', 'Windows Version', 'Generation', 'RAM', 'Microsoft Requirements', 'Replacement Status'],
      ...results
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // توسيع الأعمدة يدويًا
    const colWidths = [
      { wch: 20 }, // Serial Number
      { wch: 20 }, // Windows Version
      { wch: 15 }, // Generation
      { wch: 10 }, // RAM
      { wch: 35 }, // Microsoft Requirements
      { wch: 20 }  // Replacement Status
    ];
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Replacement Report');

const filePath = path.join(__dirname, 'Replacement_Report.xlsx');
    XLSX.writeFile(workbook, filePath);

    res.download(filePath, 'Devices_Replacement_Report.xlsx', err => {
      if (err) console.error('Download error:', err);
      else fs.unlink(filePath, () => {});
    });

  } catch (err) {
    console.error('❌ Error generating report:', err);
    res.status(500).json({ message: 'Error generating report' });
  }
});




app.use('/', express.static(path.join(__dirname, '../../authintication/AuthPage')));

// Dashboard unified API
app.get('/api/dashboard-data', authenticateToken, async (req, res) => {
  try {
    // Overview counts
    const [[{ totalDevices }]] = await db.promise().query(`SELECT COUNT(*) AS totalDevices FROM Maintenance_Devices`);
    const [[{ totalPCs }]] = await db.promise().query(`SELECT COUNT(*) AS totalPCs FROM Maintenance_Devices WHERE device_type = 'PC'`);
    const [[{ totalScanners }]] = await db.promise().query(`SELECT COUNT(*) AS totalScanners FROM Maintenance_Devices WHERE device_type = 'Scanner'`);
    const [[{ totalPrinters }]] = await db.promise().query(`SELECT COUNT(*) AS totalPrinters FROM Maintenance_Devices WHERE device_type = 'Printer'`);

    // RAM Distribution
    const [ramRows] = await db.promise().query(`
      SELECT ram_size.ram_size AS label, COUNT(*) AS count
      FROM PC_info
      LEFT JOIN RAM_Sizes ram_size ON PC_info.RamSize_id = ram_size.id
      GROUP BY ram_size.ram_size
      ORDER BY ram_size.ram_size+0
    `);
    const ramDistribution = {
      labels: ramRows.map(r => r.label || 'Unknown'),
      data: ramRows.map(r => r.count)
    };

    // CPU Generation Distribution
    const [cpuRows] = await db.promise().query(`
      SELECT gen.generation_number AS label, COUNT(*) AS count
      FROM PC_info
      LEFT JOIN Processor_Generations gen ON PC_info.Generation_id = gen.id
      GROUP BY gen.generation_number
      ORDER BY gen.generation_number+0
    `);
    const cpuGeneration = {
      labels: cpuRows.map(r => r.label || 'Unknown'),
      data: cpuRows.map(r => r.count)
    };

    // Outdated OS
    const [osRows] = await db.promise().query(`
      SELECT os.os_name AS version, COUNT(*) AS count
      FROM PC_info
      LEFT JOIN OS_Types os ON PC_info.OS_id = os.id
      GROUP BY os.os_name
    `);
    const outdatedOs = osRows.map(row => ({
      version: row.version,
      count: row.count,
      outdated: row.version && !row.version.includes('10') && !row.version.includes('11')
    }));

    // Filters
    const [departments] = await db.promise().query(`SELECT name FROM Departments ORDER BY name ASC`);
    const [cpuGens] = await db.promise().query(`SELECT DISTINCT gen.generation_number FROM Processor_Generations gen ORDER BY gen.generation_number+0`);
    const [osVersions] = await db.promise().query(`SELECT DISTINCT os.os_name FROM OS_Types os ORDER BY os.os_name`);
    const [ramSizes] = await db.promise().query(`SELECT DISTINCT ram_size.ram_size FROM RAM_Sizes ram_size ORDER BY ram_size.ram_size+0`);

    // Needs Replacement
    const [devices] = await db.promise().query(`SELECT * FROM Maintenance_Devices`);
    const needsReplacement = [];
    for (const device of devices) {
      const type = device.device_type?.toLowerCase().trim();
      const serial = device.serial_number;
      let ram = '', generation = '', os = '', department = '';
      if (["pc", "desktop", "laptop", "كمبيوتر", "لابتوب"].includes(type)) {
        const [pcRows] = await db.promise().query(`
          SELECT 
            os.os_name AS OS,
            ram_size.ram_size AS RAM,
            gen.generation_number AS Generation
          FROM PC_info pc
          LEFT JOIN OS_Types os ON pc.OS_id = os.id
          LEFT JOIN RAM_Sizes ram_size ON pc.RamSize_id = ram_size.id
          LEFT JOIN Processor_Generations gen ON pc.Generation_id = gen.id
          WHERE pc.Serial_Number = ?
        `, [serial]);
        const info = pcRows[0] || {};
        ram = info.RAM || '';
        generation = info.Generation || '';
        os = info.OS || '';
      }
      // القسم
      const [deptRow] = await db.promise().query(`SELECT name FROM Departments WHERE id = ?`, [device.department_id]);
      if (deptRow.length > 0) department = deptRow[0].name;

      const genNum = parseInt(generation?.replace(/\D/g, '')) || 0;
      const ramNum = parseInt(ram?.replace(/\D/g, '')) || 0;
      const osClean = (os || '').toLowerCase();
      const isOldGen = genNum < 8;
      const isLowRam = ramNum < 4;
      const isOldOS = osClean.includes('windows') && !osClean.includes('10') && !osClean.includes('11');
      const needs = isOldGen || isLowRam || isOldOS;
      needsReplacement.push({
        name: device.device_name,
        department,
        ram: ram || 'Unknown',
        cpu: generation || 'Unknown',
        os: os || 'Unknown',
        status: needs ? 'Replace Soon' : 'OK'
      });
    }

    res.json({
      overview: {
        totalDevices,
        totalPCs,
        totalScanners,
        totalPrinters
      },
      ramDistribution,
      cpuGeneration,
      outdatedOs,
      filters: {
        departments: departments.map(d => d.name),
        cpuGens: cpuGens.map(c => c.generation_number),
        osVersions: osVersions.map(o => o.os_name),
        ramSizes: ramSizes.map(r => r.ram_size)
      },
      needsReplacement
    });
  } catch (err) {
    console.error('❌ Error in /api/dashboard-data:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// تشغيل السيرفر
app.listen(4000, () => console.log('🚀 userServer.js running on http://localhost:4000'));  
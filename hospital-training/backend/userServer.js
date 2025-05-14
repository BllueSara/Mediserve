const express = require('express');
const db = require("./db");
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors'); 

const nodemailer = require('nodemailer');
const crypto = require('crypto');
const path = require('path');

// تقديم ملفات HTML من مجلد AuthPage
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'medi.servee1@gmail.com',
    pass: 'gfcf qtwc lucm rdfd' // App Password من Gmail
  }
});


const app = express();
app.use(cors()); 
app.use(bodyParser.json());

app.use('/', express.static(path.join(__dirname, '../../authintication/AuthPage')));


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

  const isAdmin = name?.toLowerCase() === 'admin';
  const isEngineer = department?.toLowerCase().includes('technology') || department?.includes('تقنية');

  if (!name || !email || !password || (!isAdmin && !employee_id)) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  if (isAdmin) {
    db.query(`SELECT * FROM users WHERE role = 'admin'`, (err, checkAdmin) => {
      if (err) return res.status(500).json({ message: 'Database error' });
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








app.post('/login', (req, res) => {
  const { email: identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ message: 'Missing login or password' });
  }

  db.query(
    'SELECT * FROM users WHERE email = ? OR name = ? OR employee_id = ?',
    [identifier, identifier, identifier],
    async (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error' });

      if (results.length === 0) {
        return res.status(401).json({ message: 'Invalid login or password' });
      }

      const user = results[0];
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid login or password' });
      }

      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

      logActivity(user.id, user.name, 'Login', `User ${user.name} logged in successfully.`);

      res.json({
        message: 'LOGIN successful',
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
  const { email,  } = req.body;
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
        const mailOptions = {
          from: 'your_email@gmail.com',
          to: email,
          subject: 'Reset Your Password',
          html: `<p>Click below to reset your password:</p><a href="${resetLink}">${resetLink}</a>`
        };

        transporter.sendMail(mailOptions, (error) => {
          if (error) return res.status(500).json({ message: 'Failed to send email' });
          res.json({ message: 'Password reset link sent to your email.' });
        });
      }
    );
  });
});
  // تشغيل السيرفر
app.listen(4000, () => console.log('🚀 userServer.js running on http://localhost:4000'));

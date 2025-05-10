const express = require('express');
const db = require("./db");
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors'); 



const app = express();
app.use(cors()); 
app.use(bodyParser.json());



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

  // ✅ تحقق من الحقول المطلوبة
  if (!name || !email || !password || (!isAdmin && !employee_id)) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  if (isAdmin) {
    const checkAdmin = await queryAsync(`SELECT * FROM users WHERE role = 'admin'`);
    if (checkAdmin.length > 0) {
      return res.status(400).json({ message: 'Admin already exists' });
    }
  }

  // ✅ التحقق من القيم المكررة
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

        // ✅ إذا المستخدم من قسم التقنية → نضيفه في جدول Engineers
        if (isEngineer) {
          db.query(
            `INSERT INTO Engineers (name) VALUES (?)`,
            [name],
            (engErr) => {
              if (engErr) console.warn("⚠️ Couldn't insert into Engineers:", engErr);
            }
          );
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
});






app.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Missing email or password' });
  }

  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });

    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

    // ✅ سجل النشاط
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
  
  

  // تشغيل السيرفر
app.listen(4000, () => console.log('🚀 userServer.js running on http://localhost:4000'));

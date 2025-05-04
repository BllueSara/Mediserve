const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors'); 

const app = express();
app.use(cors()); 
app.use(bodyParser.json());

// إعداد الاتصال بقاعدة البيانات
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '12345678', // ← غيّرها إذا عندك كلمة مرور
  database: 'MediServee'
});

// مفتاح التوكن (مهم تحفظه بمكان آمن)
const JWT_SECRET = 'super_secret_key_123';

const adminData = {
  name: 'Admin User',
  email: 'admin',
  password: 'Eng.2030@admin',
  phone: '1234567890',
  department: 'IT',
  employee_id: 'EMP001',
  role: 'admin'
};

(async () => {
  try {
    // تحقق إذا الأدمن موجود مسبقًا
    db.query('SELECT * FROM users WHERE email = ?', [adminData.email], async (err, results) => {
      if (err) throw err;

      if (results.length > 0) {
        console.log('❗️ Admin already exists.');
        return;
      }

      // شفر كلمة المرور
      const hashedPassword = await bcrypt.hash(adminData.password, 12);

      // أضف الأدمن
      db.query(
        `INSERT INTO users (name, email, password, phone, department, employee_id, role)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [adminData.name, adminData.email, hashedPassword, adminData.phone, adminData.department, adminData.employee_id, adminData.role],
        (err, result) => {
          if (err) throw err;
          console.log('✅ Admin user inserted successfully!');
        }
      );
    });
  } catch (err) {
    console.error('❌ Error:', err);
return  }
})();


//post route to register a new user
app.post('/register', async (req, res) => {
  const { name, email, password, phone, department, employee_id } = req.body;

  if (!name || !email || !password || !employee_id) {
      return res.status(400).json({ message: 'Missing required fields' });
  }

  db.query('SELECT * FROM users WHERE email = ? OR phone = ? OR employee_id = ?', 
      [email, phone, employee_id], async (err, results) => {
      if (err) return res.status(500).json({ message: 'Database Error' });

      if (results.length > 0) {
          const existing = results[0];
          if (existing.email === email) {
              return res.status(409).json({ message: 'Email already registered' });
          }
          if (existing.phone === phone) {
              return res.status(409).json({ message: 'Phone number already registered' });
          }
          if (existing.employee_id === employee_id) {
              return res.status(409).json({ message: 'Employee ID already registered' });
          }
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const sql = `INSERT INTO users (name, email, password, phone, department, employee_id, role) VALUES (?, ?, ?, ?, ?, ?, ?)`;
      const values = [name, email, hashedPassword, phone, department, employee_id, 'user'];

      db.query(sql, values, (err, result) => {
          if (err) return res.status(500).json({ message: 'Error saving user' });

          // بعد التسجيل، نرجع التوكن
          const userId = result.insertId;
          const token = jwt.sign({ id: userId, role: 'user' }, JWT_SECRET, { expiresIn: '1d' });

          res.status(201).json({
              message: 'User registered successfully',
              token,
              role: 'user',
              user: {
                  id: userId,
                  name,
                  email
              }
          });
      });
  });
});

app.post('/login', (req, res)=>{
    const {email , password} = req.body;

    if(!email || !password ){
        return res.status(400).json({message: 'Missing email or password'});
    }


    db.query('SELECT * FROM users WHERE email =?', [email] , async(err, results) => {
        if(err) return res.status(500).json({message: 'Database error'});

        if(results.length === 0 ){
            return res.status(401).json({message: 'Invalid email or password'});
        }

        const user = results[0];


        const isMatch = await bcrypt.compare(password , user.password);
        if (!isMatch){
            return res.status(401).json({message: 'Invalid email or password'});
        }



        const token = jwt.sign({id: user.id, role: user.role}, JWT_SECRET, {expiresIn: '1d'});


        res.json({
            message: 'LOGIN successful',
            token,
            role: user.role,
            user:{
                id: user.id,
                name: user.name,
                email: user.email,
                
            }
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
  





  // تشغيل السيرفر
app.listen(4000, () => console.log('🚀 userServer.js running on http://localhost:4000'));

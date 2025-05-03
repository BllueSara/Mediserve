const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
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




//post route to register a new user
app.post('/register', async (req, res) => {
    // Get the data from the request body (from frontend)
    const { name, email, password, phone, department, employee_id } = req.body;

    // Check for missing fields
    if (!name || !email || !password || !employee_id){
        return res.status(400).json({message: 'Missing requires fields'});
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

        //Hash the password
        const hashedPassword = await bcrypt.hash(password , 12);


        const sql = `
      INSERT INTO users (name, email, password, phone, department, employee_id, role)
      VALUES (?, ?, ?, ?, ?, ?, ?)`;
      const values = [name, email, hashedPassword, phone, department, employee_id ,'user'];


      db.query(sql,values,(err,results)=>
    {
        if (err) return res.status(500).json({message: 'Error saving user'});


        res.status(201).json({message: ' User resgistered successfully'});
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

const mysql = require("mysql2");


const db = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '12345678',
  database: process.env.DB_NAME     || 'MediServee',
  port:     process.env.DB_PORT     || 3306,
  waitForConnections: true,
  connectionLimit: 15,   // عدّل حسب حمولة السيرفر
  queueLimit: 0
});

db.getConnection((err) => {
  if (err) {
    console.error("❌ Database connection failed:", err);
    return;
  }
  console.log("✅ Connected to MySQL Database!");
});

module.exports = db;

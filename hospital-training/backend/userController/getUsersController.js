const db = require("../db");

const getUsersController = (req, res) => {
  db.query('SELECT id, name, email, department, employee_id FROM users', (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json(results);
  });
};

module.exports = getUsersController; 
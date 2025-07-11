const db = require("../db");

const getUserByIdController = (req, res) => {
  const userId = req.params.id;
  db.query('SELECT * FROM users WHERE id = ?', [userId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (!results.length) return res.status(404).json({ message: 'User not found' });
    res.json(results[0]);
  });
};

module.exports = getUserByIdController; 
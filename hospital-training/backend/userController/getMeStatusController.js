const db = require("../db");

const getMeStatusController = (req, res) => {
  const userId = req.user.id;
  db.query('SELECT status FROM users WHERE id = ?', [userId], (err, result) => {
    if (err || result.length === 0) {
      return res.status(500).json({ status: 'error' });
    }
    res.json({ status: result[0].status });
  });
};

module.exports = getMeStatusController; 
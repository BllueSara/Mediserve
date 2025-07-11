const db = require("../db");

const getNotificationsController = (req, res) => {
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
};

module.exports = getNotificationsController; 
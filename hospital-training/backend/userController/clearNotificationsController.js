const db = require("../db");

const clearNotificationsController = (req, res) => {
  const userId = req.user.id;
  db.query(`DELETE FROM Notifications WHERE user_id = ?`, [userId], (err) => {
    if (err) {
      console.error('❌ Error clearing notifications:', err);
      return res.status(500).json({ error: 'Failed to clear notifications' });
    }
    res.json({ message: '✅ All notifications cleared.' });
  });
};

module.exports = clearNotificationsController; 
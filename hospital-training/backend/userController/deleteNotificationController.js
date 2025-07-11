const db = require("../db");

const deleteNotificationController = (req, res) => {
  const userId = req.user.id;
  const notifId = req.params.id;
  db.query(`DELETE FROM Notifications WHERE id = ? AND user_id = ?`, [notifId, userId], (err) => {
    if (err) {
      console.error('❌ Error deleting notification:', err);
      return res.status(500).json({ error: 'Failed to delete notification' });
    }
    res.json({ message: '✅ Notification deleted.' });
  });
};

module.exports = deleteNotificationController; 
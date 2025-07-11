const db = require("../db");

const markNotificationsAsSeenController = async (req, res) => {
  const userId = req.user.id;
  try {
    await db.promise().query(
      `UPDATE Notifications SET is_seen = TRUE WHERE user_id = ? AND is_seen = FALSE`,
      [userId]
    );
    res.json({ message: 'All notifications marked as seen' });
  } catch (err) {
    console.error('❌ Error marking notifications:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = markNotificationsAsSeenController; 
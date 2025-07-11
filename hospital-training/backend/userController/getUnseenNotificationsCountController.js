const db = require("../db");

const getUnseenNotificationsCountController = async (req, res) => {
  const userId = req.user.id;
  try {
    const [[{ count }]] = await db.promise().query(
      `SELECT COUNT(*) AS count FROM Notifications WHERE user_id = ? AND is_seen = FALSE`,
      [userId]
    );
    res.json({ count });
  } catch (err) {
    console.error('❌ Error fetching unseen count:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = getUnseenNotificationsCountController; 
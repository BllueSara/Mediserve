const db = require("../db");

const getMyEntriesController = async (req, res) => {
  const userId = req.user.id;
  try {
    let entries;
    if (req.user.role === 'admin') {
      [entries] = await db.promise().query(`
        SELECT 
          MIN(id) AS id,
          circuit_name,
          isp,
          location,
          ip,
          speed,
          MIN(start_date) AS start_date,
          MAX(end_date) AS end_date
        FROM entries
        GROUP BY circuit_name, isp, location, ip, speed
      `);
    } else {
      [entries] = await db.promise().query(`
        SELECT 
          MIN(id) AS id,
          circuit_name,
          isp,
          location,
          ip,
          speed,
          MIN(start_date) AS start_date,
          MAX(end_date) AS end_date
        FROM entries
        WHERE user_id = ?
        GROUP BY circuit_name, isp, location, ip, speed
      `, [userId]);
    }
    res.json(entries);
  } catch (err) {
    console.error('❌ Error fetching my entries:', err.message);
    res.status(500).json({ error: 'Failed to load your entries' });
  }
};

module.exports = getMyEntriesController; 
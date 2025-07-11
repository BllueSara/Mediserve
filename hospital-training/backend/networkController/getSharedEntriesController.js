const db = require("../db");

const getSharedEntriesController = async (req, res) => {
  const userId = req.user.id;
  try {
    const [entries] = await db.promise().query(`
      SELECT 
        MIN(e.id) AS id,
        e.circuit_name,
        e.isp,
        e.location,
        e.ip,
        e.speed,
        MIN(e.start_date) AS start_date,
        MAX(e.end_date) AS end_date
      FROM entries e
      JOIN shared_entries se ON e.id = se.entry_id
      WHERE se.receiver_id = ?
      GROUP BY e.circuit_name, e.isp, e.location, e.ip, e.speed
    `, [userId]);
    res.json(entries.map(e => ({ ...e, user_id: null })));
  } catch (err) {
    console.error('❌ Error fetching shared entries:', err.message);
    res.status(500).json({ error: 'Failed to load shared entries' });
  }
};

module.exports = getSharedEntriesController; 
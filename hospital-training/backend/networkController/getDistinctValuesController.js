const db = require("../db");

const getDistinctValuesController = async (req, res) => {
  const { key } = req.params;
  const allowedKeys = [
    'circuit_name', 'isp', 'location', 'ip', 'speed', 'start_date', 'end_date'
  ];
  if (!allowedKeys.includes(key)) {
    return res.status(400).json({ error: '❌ Invalid filter key' });
  }
  try {
    const [rows] = await db.promise().query(`SELECT DISTINCT ?? AS value FROM entries`, [key]);
    const values = rows.map(r => r.value).filter(Boolean);
    res.json(values);
  } catch (err) {
    console.error('❌ Error in /distinct-values:', err.message);
    res.status(500).json({ error: 'DB query failed' });
  }
};

module.exports = getDistinctValuesController; 
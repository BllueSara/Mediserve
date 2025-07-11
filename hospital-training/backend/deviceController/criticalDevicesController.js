const db = require("../db");

const criticalDevicesController = async (req, res) => {
  try {
    const lang = req.query.lang === 'ar' ? 'ar' : 'en';
    const [rows] = await db.promise().query(`
      SELECT 
        LOWER(d.device_type) AS device_type,
        gm.problem_status AS problem,
        COUNT(*) AS count
      FROM General_Maintenance gm
      JOIN Maintenance_Devices d ON gm.device_id = d.id
      WHERE gm.problem_status IS NOT NULL 
        AND gm.problem_status != ''
      GROUP BY d.device_type, gm.problem_status
      HAVING COUNT(*) >= 10
      ORDER BY COUNT(*) DESC;
    `);
    const localizedRows = rows.map(row => {
      if (row.problem && row.problem.includes('|')) {
        const [en, ar] = row.problem.split('|').map(s => s.trim());
        row.problem = lang === 'ar' ? (ar || en) : (en || ar);
      }
      return row;
    });
    res.json(localizedRows);
  } catch (err) {
    console.error('❌ Error loading critical devices:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = criticalDevicesController; 
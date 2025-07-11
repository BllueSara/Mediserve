const db = require("../db");

const autoPingResultsController = async (req, res) => {
  const userId = req.user.id;
  try {
    const [rows] = await db.promise().query(`
      SELECT ip, latency, packetLoss, timeouts, status, timestamp
      FROM Report_Results
      WHERE report_id IN (
        SELECT id FROM Reports WHERE user_id = ? AND report_type = 'auto'
      )
      ORDER BY timestamp DESC
      LIMIT 100
    `, [userId]);
    res.json(rows);
  } catch (err) {
    console.error('❌ Auto Ping Results Error:', err.message);
    res.status(500).json({ error: '❌ Could not fetch auto ping results' });
  }
};

module.exports = autoPingResultsController; 
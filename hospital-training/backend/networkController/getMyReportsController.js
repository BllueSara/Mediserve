const db = require("../db");

const getMyReportsController = async (req, res) => {
  const userId = req.user.id;
  const isAdmin = req.user.role === "admin";
  try {
    const [reports] = await db.promise().query(`
      SELECT 
        r.id AS report_id, 
        r.created_at,
        u.name AS owner_name,
        COUNT(rr.id) AS device_count,
        GROUP_CONCAT(rr.ip) AS ips
      FROM Reports r
      LEFT JOIN Report_Results rr ON r.id = rr.report_id
      LEFT JOIN users u ON r.user_id = u.id
      ${isAdmin ? '' : 'WHERE r.user_id = ?'}
      GROUP BY r.id
      ORDER BY r.created_at DESC
    `, isAdmin ? [] : [userId]);
    res.json(reports);
  } catch (err) {
    console.error("❌ Failed to fetch reports:", err.message);
    res.status(500).json({ error: '❌ Could not fetch reports' });
  }
};

module.exports = getMyReportsController; 
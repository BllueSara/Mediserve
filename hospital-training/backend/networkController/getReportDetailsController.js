const db = require("../db");

const getReportDetailsController = async (req, res) => {
  const reportId = req.params.id;
  const userId = req.user.id;
  const isAdmin = req.user.role === 'admin';
  try {
    const [[reportInfo]] = await db.promise().query(
      `SELECT user_id, title, created_at, report_type FROM Reports WHERE id = ?`,
      [reportId]
    );
    if (!reportInfo) {
      return res.status(404).json({ error: 'Report not found' });
    }
    const isOwner = reportInfo.user_id === userId;
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const [results] = await db.promise().query(
      `SELECT * FROM Report_Results WHERE report_id = ? ORDER BY timestamp ASC`, 
      [reportId]
    );
    res.json({
      title: reportInfo.title,
      type: reportInfo.report_type || 'normal',
      created_at: reportInfo.created_at,
      results
    });
  } catch (err) {
    console.error("❌ Error loading report details:", err.message);
    res.status(500).json({ error: '❌ Could not load report details' });
  }
};

module.exports = getReportDetailsController; 
const db = require("../db");

const ticketsSummaryController = async (req, res) => {
  try {
    const statusQueries = {
      open: `SELECT COUNT(*) AS count FROM Maintenance_Reports WHERE status = 'Open'`,
      in_progress: `SELECT COUNT(*) AS count FROM Maintenance_Reports WHERE status = 'In Progress'`,
      resolved: `SELECT COUNT(*) AS count FROM Maintenance_Reports WHERE status = 'Closed'`,
      open_last_week: `
        SELECT COUNT(*) AS count FROM Maintenance_Reports
        WHERE status = 'Open'
        AND created_at BETWEEN DATE_SUB(CURDATE(), INTERVAL 14 DAY) AND DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      `,
      in_progress_last_week: `
        SELECT COUNT(*) AS count FROM Maintenance_Reports
        WHERE status = 'In Progress'
        AND created_at BETWEEN DATE_SUB(CURDATE(), INTERVAL 14 DAY) AND DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      `,
      resolved_last_week: `
        SELECT COUNT(*) AS count FROM Maintenance_Reports
        WHERE status = 'Closed'
        AND created_at BETWEEN DATE_SUB(CURDATE(), INTERVAL 14 DAY) AND DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      `
    };
    const results = {};
    for (const key in statusQueries) {
      const [rows] = await db.promise().query(statusQueries[key]);
      results[key] = rows[0].count;
    }
    const total = results.open + results.in_progress + results.resolved;
    res.json({
      total,
      open: results.open,
      open_delta: results.open - results.open_last_week,
      in_progress: results.in_progress,
      in_progress_delta: results.in_progress - results.in_progress_last_week,
      resolved: results.resolved,
      resolved_delta: results.resolved - results.resolved_last_week
    });
  } catch (err) {
    console.error('❌ Error fetching ticket summary:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = ticketsSummaryController; 
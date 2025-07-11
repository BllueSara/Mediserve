const db = require("../db");

const getActivityLogsController = (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;
  const sql = userRole === 'admin'
    ? `SELECT * FROM Activity_Logs ORDER BY timestamp DESC LIMIT 100`
    : `SELECT * FROM Activity_Logs WHERE user_id = ? ORDER BY timestamp DESC LIMIT 100`;
  const params = userRole === 'admin' ? [] : [userId];
  db.query(sql, params, (err, results) => {
    if (err) {
      console.error('❌ Failed to load activity logs:', err);
      return res.status(500).json({ error: 'Failed to load activity logs' });
    }
    const parsedResults = results.map(log => {
      let action = log.action;
      let details = log.details;
      try { action = JSON.parse(action); } catch {}
      try { details = JSON.parse(details); } catch {}
      return { ...log, action, details };
    });
    res.json(parsedResults);
  });
};

module.exports = getActivityLogsController; 
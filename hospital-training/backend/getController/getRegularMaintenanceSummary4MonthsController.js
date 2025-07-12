const db = require('../db');

exports.getRegularMaintenanceSummary4Months = (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;

  let sql = `
    SELECT 
      id,
      device_name,
      device_type,
      last_maintenance_date,
      frequency,
      status,
      DATE_ADD(last_maintenance_date, INTERVAL 4 MONTH) AS next_due_date
    FROM Regular_Maintenance
    WHERE frequency = '4months'
  `;

  if (userRole !== 'admin') {
    sql += ' AND user_id = ?';
  }

  sql += ' ORDER BY next_due_date DESC';

  const params = userRole === 'admin' ? [] : [userId];

  db.query(sql, params, (err, result) => {
    if (err) return res.status(500).json({ error: 'Error fetching 4-month data' });
    res.json(result);
  });
}; 
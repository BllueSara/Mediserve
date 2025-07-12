const db = require('../db');

exports.getInternalReports = async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;
  const userName = await getUserNameById(userId);

  let internalSql = `
    SELECT 
      R.id,
      MAX(R.created_at) AS created_at,
      MAX(R.issue_summary) AS issue_summary,
      MAX(R.full_description) AS full_description,
      MAX(R.status) AS status,
      MAX(R.device_id) AS device_id,
      MAX(R.ticket_id) AS ticket_id,
      MAX(R.maintenance_type) AS maintenance_type,
      MAX(T.ticket_number) AS ticket_number,
      MAX(R.report_number) AS report_number,
      MAX(CASE WHEN R.maintenance_type = 'Regular' THEN NULL ELSE T.issue_description END) AS issue_description,
      MAX(CASE WHEN R.maintenance_type = 'Regular' THEN RM.problem_status ELSE T.priority END) AS priority,
      MAX(COALESCE(GM.department_name, D.name)) AS department_name,
      MAX(COALESCE(GM.device_name, M.device_name)) AS device_name,
      MAX(RM.frequency) AS frequency,
      MAX(M.device_type) AS device_type,
      'internal' AS source,
      MAX(CASE WHEN R.maintenance_type = 'Regular' THEN NULL ELSE T.attachment_name END) AS attachment_name,
      MAX(CASE WHEN R.maintenance_type = 'Regular' THEN NULL ELSE T.attachment_path END) AS attachment_path,
      MAX(COALESCE(RM.problem_status, T.issue_description)) AS problem_status,
      MAX(CASE WHEN R.maintenance_type = 'Internal' THEN T.assigned_to ELSE E.name END) AS technical_engineer
    FROM Maintenance_Reports R
    LEFT JOIN Maintenance_Devices M ON R.device_id = M.id
    LEFT JOIN Departments D ON M.department_id = D.id
    LEFT JOIN (SELECT * FROM Regular_Maintenance ORDER BY last_maintenance_date DESC) AS RM ON RM.device_id = R.device_id
    LEFT JOIN Engineers E ON RM.technical_engineer_id = E.id
    LEFT JOIN General_Maintenance GM ON GM.device_id = R.device_id
    LEFT JOIN Internal_Tickets T ON R.ticket_id = T.id
    WHERE R.maintenance_type IN ('Regular', 'General', 'Internal')
  `;

  let newSql = `
    SELECT 
      id, created_at, issue_summary, NULL AS full_description, status, device_id,
      NULL AS report_number, NULL AS ticket_id, 'New' AS maintenance_type, NULL AS ticket_number,
      NULL AS issue_description, priority, NULL AS department_name, NULL AS device_name, NULL AS frequency,
      device_type, 'new' AS source, attachment_name, attachment_path, NULL AS problem_status, NULL AS technical_engineer
    FROM New_Maintenance_Report
  `;

  let params = [];

  if (userRole !== 'admin') {
    internalSql += `
      AND (
        R.user_id = ?
        OR EXISTS (
          SELECT 1 FROM Engineers E2
          JOIN Users U2 ON 
            TRIM(REPLACE(REPLACE(E2.name, '[en]', ''), '[ar]', '')) = TRIM(U2.name)
          WHERE E2.id = RM.technical_engineer_id AND U2.id = ?
        )
        OR LOWER(REPLACE(REPLACE(T.assigned_to, '[en]', ''), '[ar]', '')) = LOWER(?)
      )
    `;
    newSql += ` WHERE user_id = ? `;
    params = [userId, userId, userName, userId];
  }

  internalSql += ` GROUP BY R.id `;

  const combinedSql = `${internalSql} UNION ALL ${newSql} ORDER BY created_at DESC`;

  db.query(combinedSql, params, (err, results) => {
    if (err) {
      console.error("❌ Failed to fetch reports:", err);
      return res.status(500).json({ error: "Error fetching reports" });
    }
    res.json(results);
  });
};

// Helper
async function getUserNameById(id) {
  const [res] = await db.promise().query('SELECT name FROM Users WHERE id = ?', [id]);
  return res[0]?.name || null;
} 
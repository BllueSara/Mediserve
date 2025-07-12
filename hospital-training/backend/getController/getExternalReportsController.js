const db = require('../db');

exports.getExternalReports = async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;
  const userName = await getUserNameById(userId);

  let externalSql = `
    SELECT 
      MAX(id) AS id,
      MAX(created_at) AS created_at,
      NULL AS ticket_id,
      MAX(ticket_number) AS ticket_number,
      MAX(device_name) AS device_name,
      MAX(department_name) AS department_name,
      MAX(initial_diagnosis) AS issue_summary,
      MAX(final_diagnosis) AS full_description,
      MAX(status) AS status,
      MAX(device_type) AS device_type,
      NULL AS priority,
      'external-legacy' AS source,
      NULL AS attachment_name,
      NULL AS attachment_path,
      MAX(mac_address) AS mac_address,
      MAX(ip_address) AS ip_address,
      MAX(user_id) AS user_id
    FROM External_Maintenance
  `;

  let newSql = `
    SELECT 
      MAX(id) AS id,
      MAX(created_at) AS created_at,
      NULL AS ticket_id,
      NULL AS ticket_number,
      NULL AS device_name,
      NULL AS department_name,
      NULL AS issue_summary,
      NULL AS full_description,
      MAX(status) AS status,
      MAX(device_type) AS device_type,
      MAX(priority) AS priority,
      'new' AS source,
      MAX(attachment_name) AS attachment_name,
      MAX(attachment_path) AS attachment_path,
      NULL AS mac_address,
      NULL AS ip_address,
      MAX(user_id) AS user_id
    FROM New_Maintenance_Report
  `;

  let externalReportsSQL = `
    SELECT 
      mr.id,
      MAX(mr.created_at) AS created_at,
      mr.ticket_id,
      MAX(et.ticket_number) AS ticket_number,
      MAX(COALESCE(pc.Computer_Name, pr.Printer_Name, sc.Scanner_Name, md.device_name)) AS device_name,
      MAX(d.name) AS department_name,
      MAX(mr.issue_summary) AS issue_summary,
      MAX(mr.full_description) AS full_description,
      MAX(mr.status) AS status,
      MAX(md.device_type) AS device_type,
      MAX(mr.priority) AS priority,
      'external-new' AS source,
      MAX(et.attachment_name) AS attachment_name,
      MAX(et.attachment_path) AS attachment_path,
      MAX(md.mac_address) AS mac_address,
      MAX(md.ip_address) AS ip_address,
      MAX(mr.user_id) AS user_id
    FROM Maintenance_Reports mr
    LEFT JOIN External_Tickets et ON mr.report_number = et.ticket_number
    LEFT JOIN Maintenance_Devices md ON mr.device_id = md.id
    LEFT JOIN Departments d ON md.department_id = d.id
    LEFT JOIN PC_info pc 
      ON LOWER(md.device_type) IN ('pc', 'desktop', 'laptop', 'كمبيوتر', 'لابتوب') 
      AND md.serial_number = pc.Serial_Number
    LEFT JOIN Printer_info pr ON md.device_type = 'Printer' AND md.serial_number = pr.Serial_Number
    LEFT JOIN Scanner_info sc ON md.device_type = 'Scanner' AND md.serial_number = sc.Serial_Number
    WHERE mr.maintenance_type = 'External'
  `;

  if (userRole !== 'admin') {
    externalSql += `
      WHERE user_id = ${db.escape(userId)} 
      OR LOWER(reporter_name) LIKE CONCAT('%', LOWER(${db.escape(userName)}), '%')
    `;
    newSql += ` WHERE user_id = ${db.escape(userId)} `;
    externalReportsSQL += `
      AND (
        mr.user_id = ${db.escape(userId)} 
        OR LOWER(et.assigned_to) LIKE CONCAT('%', LOWER(${db.escape(userName)}), '%')
      )
    `;
  }

  externalSql += ` GROUP BY id `;
  newSql += ` GROUP BY id `;
  externalReportsSQL += ` GROUP BY mr.id `;

  const combinedSql = `
    (${externalSql})
    UNION ALL
    (${externalReportsSQL})
    UNION ALL
    (${newSql})
    ORDER BY created_at DESC
  `;

  db.query(combinedSql, (err, result) => {
    if (err) {
      console.error("❌ Error fetching external reports:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(result);
  });
};

// Helper
async function getUserNameById(id) {
  const [res] = await db.promise().query('SELECT name FROM Users WHERE id = ?', [id]);
  return res[0]?.name || null;
} 
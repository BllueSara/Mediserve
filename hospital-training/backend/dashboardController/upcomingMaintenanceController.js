const db = require("../db");

const upcomingMaintenanceController = async (req, res) => {
  try {
    const [rows] = await db.promise().query(`
      SELECT 
        id,
        device_name,
        serial_number,
        governmental_number,
        department_name,
        last_maintenance_date,
        frequency,
        status,
        DATE_ADD(last_maintenance_date,
          INTERVAL CASE frequency
            WHEN '3months' THEN 3
            WHEN '4months' THEN 4
            ELSE 0
          END MONTH
        ) AS next_maintenance_date
      FROM Regular_Maintenance
      WHERE status != 'Closed'
        AND DATE_ADD(last_maintenance_date,
          INTERVAL CASE frequency
            WHEN '3months' THEN 3
            WHEN '4months' THEN 4
            ELSE 0
          END MONTH
        ) >= CURDATE()
      ORDER BY next_maintenance_date ASC
      LIMIT 6
    `);
    res.json(rows);
  } catch (err) {
    console.error('❌ Error fetching upcoming maintenance:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = upcomingMaintenanceController; 
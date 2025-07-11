const db = require("../db");

const maintenanceOverviewController = async (req, res) => {
  try {
    const [general] = await db.promise().query(`
      SELECT LOWER(d.device_type) AS type, COUNT(*) AS total
      FROM General_Maintenance gm
      JOIN Maintenance_Devices d ON gm.device_id = d.id
      GROUP BY LOWER(d.device_type)
    `);
    const [regular] = await db.promise().query(`
      SELECT LOWER(d.device_type) AS type, COUNT(*) AS total
      FROM Regular_Maintenance rm
      JOIN Maintenance_Devices d ON rm.device_id = d.id
      GROUP BY LOWER(d.device_type)
    `);
    const [external] = await db.promise().query(`
      SELECT LOWER(device_type) AS type, COUNT(*) AS total
      FROM External_Maintenance
      WHERE device_type IS NOT NULL
      GROUP BY LOWER(device_type)
    `);
    const formatted = {
      internal: {},
      external: {},
      types: new Set()
    };
    const mergeCounts = (target, source) => {
      for (const row of source) {
        const type = row.type;
        target[type] = (target[type] || 0) + row.total;
        formatted.types.add(type);
      }
    };
    mergeCounts(formatted.internal, general);
    mergeCounts(formatted.internal, regular);
    mergeCounts(formatted.external, external);
    res.json({
      types: Array.from(formatted.types),
      internal: formatted.internal,
      external: formatted.external
    });
  } catch (err) {
    console.error('❌ Error loading maintenance overview:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = maintenanceOverviewController; 
const db = require("../db");

const monthlyClosedController = async (req, res) => {
  try {
    const query = (table, statusField) => `
      SELECT 
        MONTH(created_at) AS month,
        COUNT(*) AS count
      FROM ${table}
      WHERE ${statusField} = 'Closed'
      GROUP BY MONTH(created_at)
    `;
    const [general] = await db.promise().query(query('General_Maintenance', 'problem_status'));
    const [regular] = await db.promise().query(query('Regular_Maintenance', 'status'));
    const [external] = await db.promise().query(query('External_Maintenance', 'status'));
    const formatData = (rows) => {
      const result = Array(12).fill(0);
      rows.forEach(row => {
        result[row.month - 1] = row.count;
      });
      return result;
    };
    res.json({
      months: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
      general: formatData(general),
      regular: formatData(regular),
      external: formatData(external)
    });
  } catch (err) {
    console.error('❌ Error fetching monthly closed stats:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = monthlyClosedController; 
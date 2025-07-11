const db = require("../db");

const completionRatesController = async (req, res) => {
  try {
    const [generalTotal] = await db.promise().query(`SELECT COUNT(*) AS total FROM General_Maintenance`);
    const [generalClosed] = await db.promise().query(`SELECT COUNT(*) AS closed FROM General_Maintenance WHERE problem_status = 'Closed'`);
    const [regularTotal] = await db.promise().query(`SELECT COUNT(*) AS total FROM Regular_Maintenance`);
    const [regularClosed] = await db.promise().query(`SELECT COUNT(*) AS closed FROM Regular_Maintenance WHERE status = 'Closed'`);
    const [externalTotal] = await db.promise().query(`SELECT COUNT(*) AS total FROM External_Maintenance`);
    const [externalClosed] = await db.promise().query(`SELECT COUNT(*) AS closed FROM External_Maintenance WHERE status = 'Closed'`);
    const calc = (closed, total) => total === 0 ? 0 : Math.round((closed / total) * 100);
    res.json({
      internal: {
        total: generalTotal[0].total,
        closed: generalClosed[0].closed,
        percentage: calc(generalClosed[0].closed, generalTotal[0].total)
      },
      regular: {
        total: regularTotal[0].total,
        closed: regularClosed[0].closed,
        percentage: calc(regularClosed[0].closed, regularTotal[0].total)
      },
      external: {
        total: externalTotal[0].total,
        closed: externalClosed[0].closed,
        percentage: calc(externalClosed[0].closed, externalTotal[0].total)
      }
    });
  } catch (err) {
    console.error("Error fetching completion rates:", err);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = completionRatesController; 
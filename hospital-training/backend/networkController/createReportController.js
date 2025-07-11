const db = require("../db");

const createReportController = async (req, res) => {
  const userId = req.user.id;
  const { devices, type = 'normal' } = req.body;
  if (!Array.isArray(devices) || devices.length === 0) {
    return res.status(400).json({ error: '❌ No devices provided' });
  }
  try {
    const conn = db.promise();
    const now = new Date();
    const timestamp = now.toLocaleString('en-US', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
      hour12: true
    }).replace(',', '');
    const title = `Network Report - ${timestamp}`;
    const [reportRes] = await conn.query(`
      INSERT INTO Reports (user_id, title, report_type) VALUES (?, ?, ?)
    `, [userId, title, type]);
    const reportId = reportRes.insertId;
    const insertPromises = devices.map(d => {
      const commonFields = [
        reportId,
        d.ip,
        d.circuit,
        d.isp,
        d.location,
        d.speed || null,
        d.start_date || null,
        d.end_date || null
      ];
      if (type === 'auto') {
        return conn.query(`
          INSERT INTO Report_Results 
            (report_id, ip, circuit, isp, location, speed, start_date, end_date, latency, packetLoss, timeouts, status, output, timestamp)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          ...commonFields,
          d.latency || null,
          d.packetLoss || null,
          d.timeouts || null,
          d.status || null,
          d.output || '',
          new Date()
        ]);
      } else {
        return conn.query(`
          INSERT INTO Report_Results 
            (report_id, ip, circuit, isp, location, speed, start_date, end_date, status, timestamp)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          ...commonFields,
          d.status || null,
          new Date()
        ]);
      }
    });
    await Promise.all(insertPromises);
    res.json({ success: true, report_id: reportId });
  } catch (err) {
    console.error("❌ Failed to create report:", err.message);
    res.status(500).json({ error: '❌ Could not save report' });
  }
};

module.exports = createReportController; 
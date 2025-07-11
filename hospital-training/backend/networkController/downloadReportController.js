const db = require("../db");
const ExcelJS = require('exceljs');

const downloadReportController = async (req, res) => {
  const reportId = req.params.id;
  const userId = req.user.id;
  const isAdmin = req.user.role === 'admin';
  try {
    const [[reportInfo]] = await db.promise().query(
      `SELECT user_id, title, report_type FROM Reports WHERE id = ?`,
      [reportId]
    );
    if (!reportInfo) return res.status(404).json({ error: '❌ Report not found' });
    const isOwner = reportInfo.user_id === userId;
    if (!isOwner && !isAdmin) return res.status(403).json({ error: '❌ Forbidden' });
    const [results] = await db.promise().query(
      `SELECT * FROM Report_Results WHERE report_id = ? ORDER BY timestamp ASC`,
      [reportId]
    );
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Report');
    const isAuto = reportInfo.report_type === 'auto';
    sheet.columns = isAuto
      ? [
          { header: 'IP', key: 'ip', width: 20 },
          { header: 'Status', key: 'status', width: 15 },
          { header: 'Latency (ms)', key: 'latency', width: 15 },
          { header: 'Packet Loss (%)', key: 'packetLoss', width: 18 },
          { header: 'Timeouts', key: 'timeouts', width: 12 },
          { header: 'Timestamp', key: 'timestamp', width: 25 },
          { header: 'Output', key: 'output', width: 60 }
        ]
      : [
          { header: 'Circuit Name', key: 'circuit', width: 25 },
          { header: 'ISP', key: 'isp', width: 20 },
          { header: 'Location', key: 'location', width: 20 },
          { header: 'IP Address', key: 'ip', width: 20 },
          { header: 'Circuit Speed', key: 'speed', width: 20 },
          { header: 'Start Contract', key: 'start_date', width: 18 },
          { header: 'End Contract', key: 'end_date', width: 18 },
          { header: 'Status', key: 'status', width: 15 }
        ];
    results.forEach(row => {
      sheet.addRow({
        ip: row.ip,
        status: row.status,
        latency: row.latency,
        packetLoss: row.packetLoss,
        timeouts: row.timeouts,
        timestamp: row.timestamp,
        output: row.output,
        circuit: row.circuit,
        isp: row.isp,
        location: row.location,
        speed: row.speed,
        start_date: row.start_date?.toISOString?.().split('T')[0] || '',
        end_date: row.end_date?.toISOString?.().split('T')[0] || ''
      });
    });
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${reportInfo.title.replace(/\s+/g, '_')}.xlsx"`
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    await workbook.xlsx.write(res);
    res.end();
  } catch (err){
    console.error('❌ Error generating Excel report:', err.message);
    res.status(500).json({ error: '❌ Could not generate report file' });
  }
};

module.exports = downloadReportController; 
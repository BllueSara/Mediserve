const db = require("../db");
const { exec } = require('child_process');

const IP_REGEX = /^\d{1,3}(\.\d{1,3}){3}$/;
function isValidIP(ip) {
  if (!IP_REGEX.test(ip)) return false;
  return ip.split('.').every(num => parseInt(num) <= 255);
}

const autoPingStartController = async (req, res) => {
  const { ips, duration_hours } = req.body;
  if (!Array.isArray(ips) || ips.length === 0 || !duration_hours) {
    return res.status(400).json({ error: '❌ Missing IPs or duration' });
  }
  const userId = req.user.id;
  const durationMs = duration_hours * 60 * 60 * 1000;
  const endTime = Date.now() + durationMs;
  const isWindows = process.platform === 'win32';
  const formatPingOutput = (output) => {
    const latencyMatch = output.match(/time[=<](\d+\.?\d*)\s*ms/i);
    const lossMatch = output.match(/(\d+)%\s*packet loss/i);
    const timeouts = (output.match(/Request timed out/gi) || []).length;
    return {
      latency: latencyMatch ? parseFloat(latencyMatch[1]) : null,
      packetLoss: lossMatch ? parseFloat(lossMatch[1]) : 0,
      timeouts,
      status: output.includes('100% packet loss') || timeouts > 0 ? 'failed'
            : (lossMatch && parseFloat(lossMatch[1]) > 0) || (latencyMatch && parseFloat(latencyMatch[1]) > 50)
              ? 'unstable'
              : 'active'
    };
  };

  // أنشئ تقرير جديد واحصل على report_id
  let reportId;
  try {
    const [reportRes] = await db.promise().query(
      `INSERT INTO Reports (user_id, title, report_type) VALUES (?, ?, ?)` ,
      [userId, `Auto Ping Report - ${new Date().toLocaleString()}`, 'auto']
    );
    reportId = reportRes.insertId;
  } catch (err) {
    return res.status(500).json({ error: '❌ Failed to create report', details: err.message });
  }

  for (const ip of ips) {
    if (!isValidIP(ip)) continue;
    const interval = setInterval(async () => {
      if (Date.now() >= endTime) {
        clearInterval(interval);
        return;
      }
      const cmd = isWindows ? `ping -n 1 ${ip}` : `ping -c 1 ${ip}`;
      exec(cmd, async (err, stdout, stderr) => {
        const output = stdout || stderr || err?.message || 'No response';
        const parsed = formatPingOutput(output);
        try {
          await db.promise().query(`
            INSERT INTO Report_Results 
              (report_id, ip, latency, packetLoss, timeouts, status, output, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            reportId, ip, // استخدم reportId بدلاً من null
            parsed.latency, parsed.packetLoss, parsed.timeouts,
            parsed.status, output,
            new Date(),
          ]);
        } catch (dbErr) {
          console.error(`❌ DB Insert failed for ${ip}:`, dbErr.message);
        }
      });
    }, 60 * 1000);
  }
  res.json({ success: true, message: `✅ Auto ping started for ${ips.length} IP(s) for ${duration_hours} hour(s)` });
};

module.exports = autoPingStartController; 
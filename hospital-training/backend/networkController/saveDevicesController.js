const db = require("../db");
const IP_REGEX = /^\d{1,3}(\.\d{1,3}){3}$/;
function isValidIP(ip) {
  if (!IP_REGEX.test(ip)) return false;
  return ip.split('.').every(num => parseInt(num) <= 255);
}

const saveDevicesController = async (req, res) => {
  const userId = req.user.id;
  const { devices } = req.body;
  if (!Array.isArray(devices) || devices.length === 0) {
    return res.status(400).json({ error: 'No devices provided' });
  }
  let savedCount = 0;
  let skippedCount = 0;
  try {
    const insertPromises = devices
      .filter(d => d.ip && isValidIP(d.ip) && d.circuit && d.isp && d.location)
      .map(async d => {
        const [existing] = await db.promise().query(`
          SELECT id FROM entries
          WHERE circuit_name = ? AND isp = ? AND location = ? AND ip = ?
            AND speed <=> ? AND start_date <=> ? AND end_date <=> ? AND user_id = ?
          LIMIT 1
        `, [
          d.circuit,
          d.isp,
          d.location,
          d.ip,
          d.speed || null,
          d.start_date || null,
          d.end_date || null,
          userId
        ]);
        if (existing.length > 0) {
          skippedCount++;
          return null;
        }
        await db.promise().query(`
          INSERT INTO entries (circuit_name, isp, location, ip, speed, start_date, end_date, user_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          d.circuit,
          d.isp,
          d.location,
          d.ip,
          d.speed || null,
          d.start_date || null,
          d.end_date || null,
          userId
        ]);
        savedCount++;
      });
    await Promise.all(insertPromises);
    res.json({ success: true, saved: savedCount, skipped: skippedCount });
  } catch (err) {
    console.error('❌ Save error:', err);
    res.status(500).json({ error: 'Failed to save entries' });
  }
};

module.exports = saveDevicesController; 
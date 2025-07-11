const db = require("../db");
const IP_REGEX = /^\d{1,3}(\.\d{1,3}){3}$/;
function isValidIP(ip) {
  if (!IP_REGEX.test(ip)) return false;
  return ip.split('.').every(num => parseInt(num) <= 255);
}

const addEntryController = (req, res) => {
  const userId = req.user.id;
  const { circuit, isp, location, ip, speed, start_date, end_date } = req.body;

  if (!circuit || !isp || !location || !ip || !isValidIP(ip)) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  db.query(`
    INSERT INTO entries (circuit_name, isp, location, ip, speed, start_date, end_date, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [circuit, isp, location, ip, speed, start_date, end_date, userId], (err) => {
    if (err) return res.status(500).json({ error: 'Insert failed' });
    res.json({ success: true });
  });
};

module.exports = addEntryController; 
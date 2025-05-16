const express = require('express');
const cors = require('cors');
const db = require("./db");
const { exec } = require('child_process');
const { promisify } = require('util');
const ExcelJS = require('exceljs');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);
const app = express();
const PORT = process.env.PORT || 3000;

const JWT_SECRET = 'super_secret_key_123';
const jwt = require('jsonwebtoken');


function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'No token provided' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
}

module.exports = authenticateToken;


app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use(express.static(__dirname));

const IP_REGEX = /^\d{1,3}(\.\d{1,3}){3}$/;

function isValidIP(ip) {
  if (!IP_REGEX.test(ip)) return false;
  return ip.split('.').every(num => parseInt(num) <= 255);
}

// 1. Ping single IP
app.post('/api/ping', async (req, res) => {
  try {
    const { ip } = req.body;
    if (!ip || !isValidIP(ip)) {
      return res.status(400).json({ error: 'Invalid IP address' });
    }

    const isMac = process.platform === 'darwin';
    const command = isMac ? `ping -c 4 ${ip}` : `ping -n 4 ${ip}`;
    const { stdout, stderr } = await execAsync(command);

    res.json({ output: stdout || stderr || 'No response from ping', status: 'success' });
  } catch (error) {
    res.json({
      output: error.stdout || error.stderr || error.message,
      error: 'Ping failed',
      status: 'error'
    });
  }
});



// 2. Ping multiple IPs
app.post('/api/ping-all', async (req, res) => {
  try {
    const { ips } = req.body;
    if (!Array.isArray(ips)) return res.status(400).json({ error: 'Invalid input format' });

    const invalidIPs = ips.filter(ip => !isValidIP(ip));
    if (invalidIPs.length > 0) {
      return res.status(400).json({ error: 'Invalid IP addresses found', invalidIPs });
    }

    const isWindows = process.platform === 'win32';

    const results = await Promise.all(ips.map(async (ip) => {
      try {
        const command = isWindows ? `ping -n 4 ${ip}` : `ping -c 4 ${ip}`;
        const { stdout } = await execAsync(command);
        return { ip, status: 'success', output: stdout };
      } catch (error) {
        const stderr = error.stderr?.trim();
        const stdout = error.stdout?.trim();
        const fallback = error.message;

        return {
          ip,
          status: 'error',
          output: stderr || stdout || fallback || 'Unknown ping failure'
        };
      }
    }));

    res.json({ results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// 3. Traceroute
app.post('/api/traceroute', async (req, res) => {
  try {
    const { ip } = req.body;
    if (!ip || !isValidIP(ip)) return res.status(400).json({ error: 'Invalid IP address' });

    const isWindows = process.platform === 'win32';
    const command = isWindows ? `tracert ${ip}` : `traceroute ${ip}`;
    const { stdout } = await execAsync(command);

    res.json({ output: stdout });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Save IP data to DB

app.post('/api/add-entry', authenticateToken, (req, res) => {
  const userId = req.user.id; // هذا من التوكن
  const {
    circuit, isp, location, ip, speed, start_date, end_date
  } = req.body;

  db.query(`
    INSERT INTO entries (circuit_name, isp, location, ip, speed, contract_start, contract_end, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [circuit, isp, location, ip, speed, start_date, end_date, userId], (err) => {
    if (err) return res.status(500).json({ error: 'Insert failed' });
    res.json({ success: true });
  });
});


// 5. Get entries from DB



// 6. Generate report
app.post('/api/report', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const { devices } = req.body;

    if (!Array.isArray(devices) || devices.length === 0) {
      return res.status(400).json({ error: '❌ No devices provided' });
    }

    const validDevices = devices.filter(d =>
      d.circuit && d.isp && d.location && d.ip && d.speed && d.start_date && d.end_date
    );

    if (validDevices.length === 0) {
      return res.status(400).json({ error: '❌ All rows are missing required fields' });
    }

    // Safe formatter
    const formatDate = (dateStr) => {
      try {
        const d = new Date(dateStr);
        if (isNaN(d)) return '';
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      } catch {
        return '';
      }
    };

    const rows = validDevices.map(device => ({
      circuit: String(device.circuit || '').trim(),
      isp: String(device.isp || '').trim(),
      location: String(device.location || '').trim(),
      ip: String(device.ip || '').trim(),
      speed: String(device.speed || '').trim(),
      start_date: device.start_date ? formatDate(device.start_date) : '',
      end_date: device.end_date ? formatDate(device.end_date) : ''
    }));

    console.log('✅ Cleaned rows:', rows); // هنا تشوف القيم الفعلية المرسلة

    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Network Report');

    worksheet.columns = [
      { header: 'Circuit Name', key: 'circuit', width: 20 },
      { header: 'ISP', key: 'isp', width: 15 },
      { header: 'Location', key: 'location', width: 20 },
      { header: 'IP Address', key: 'ip', width: 18 },
      { header: 'Speed', key: 'speed', width: 15 },
      { header: 'Contract Start', key: 'start_date', width: 18 },
      { header: 'Contract End', key: 'end_date', width: 18 }
    ];

    worksheet.addRows(rows); 

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=network_report.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('❌ ExcelJS Error:', error);
    res.status(500).json({ error: `❌ Report error: ${error.message}` });
  }
});



app.post('/api/share-entry', authenticateToken, async (req, res) => {
  const senderId = req.user.id;
  const { devices, receiver_ids } = req.body;

  if (!Array.isArray(devices) || devices.length === 0 || !Array.isArray(receiver_ids) || receiver_ids.length === 0) {
    return res.status(400).json({ error: '❌ Missing devices or receivers' });
  }

  try {
    for (let device of devices) {
      // نتحقق إن السطر ما تم إنشاؤه سابقًا بنفس البيانات
      const [existing] = await db.promise().query(`
        SELECT id FROM entries
        WHERE circuit_name = ? AND isp = ? AND location = ? AND ip = ? AND speed = ? AND start_date = ? AND end_date = ? AND user_id IS NULL
        LIMIT 1
      `, [
        device.circuit,
        device.isp,
        device.location,
        device.ip,
        device.speed,
        device.start_date,
        device.end_date
      ]);

      let entryId;

      if (existing.length > 0) {
        entryId = existing[0].id;
      } else {
        const insertResult = await db.promise().query(`
          INSERT INTO entries (circuit_name, isp, location, ip, speed, start_date, end_date, user_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, NULL)
        `, [
          device.circuit,
          device.isp,
          device.location,
          device.ip,
          device.speed,
          device.start_date,
          device.end_date
        ]);
        entryId = insertResult[0].insertId;
      }

      // تجنب التكرار في shared_entries
      for (let receiverId of receiver_ids) {
        await db.promise().query(`
          INSERT IGNORE INTO shared_entries (sender_id, receiver_id, entry_id)
          VALUES (?, ?, ?)
        `, [senderId, receiverId, entryId]);
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error('❌ Share Error:', err);
    res.status(500).json({ error: '❌ Failed to share entries' });
  }
});







app.get('/api/users', authenticateToken, (req, res) => {
  if (!req.user?.id) {
    return res.status(400).json({ error: 'Missing user ID in token' });
  }

  db.query('SELECT id, name FROM users WHERE id != ?', [req.user.id], (err, rows) => {
    if (err) {
      console.error('DB error:', err);
      return res.status(500).json({ error: 'DB error' });
    }
    res.json(rows);
  });
});










app.post('/api/save', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { devices } = req.body;

  if (!Array.isArray(devices) || devices.length === 0) {
    return res.status(400).json({ error: 'No devices provided' });
  }

  try {
    const insertPromises = devices.map(device => {
      return db.promise().query(`
      INSERT INTO entries (circuit_name, isp, location, ip, speed, start_date, end_date, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        device.circuit, device.isp, device.location, device.ip,
        device.speed, device.start_date, device.end_date, userId
      ]);
    });

    await Promise.all(insertPromises);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Save error:', err);
    res.status(500).json({ error: 'Failed to save entries' });
  }
});




app.get('/api/entries/mine', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const [entries] = await db.promise().query(`
      SELECT * FROM entries WHERE user_id = ?
    `, [userId]);

    res.json(entries);
  } catch (err) {
    console.error('❌ Error fetching my entries:', err.message);
    res.status(500).json({ error: 'Failed to load your entries' });
  }
});

app.get('/api/entries/shared-with-me', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const [entries] = await db.promise().query(`
      SELECT e.*, se.receiver_id
      FROM entries e
      JOIN shared_entries se ON e.id = se.entry_id
      WHERE se.receiver_id = ?
    `, [userId]);

    // نرجعها مع تحديد أن user_id = null لتفرقها عن mine
    res.json(entries.map(e => ({ ...e, user_id: null })));

  } catch (err) {
    console.error('❌ Error fetching shared entries:', err.message);
    res.status(500).json({ error: 'Failed to load shared entries' });
  }
});



app.get('/api/distinct-values/:key', authenticateToken, async (req, res) => {
  const { key } = req.params;

  // قائمة الأعمدة المسموح بها (للحماية من SQL injection)
  const allowedKeys = [
    'circuit_name', 'isp', 'location', 'ip', 'speed', 'start_date', 'end_date'
  ];

  if (!allowedKeys.includes(key)) {
    return res.status(400).json({ error: '❌ Invalid filter key' });
  }

  try {
    const [rows] = await db.promise().query(`SELECT DISTINCT ?? AS value FROM entries`, [key]);
    const values = rows.map(r => r.value).filter(Boolean);
    res.json(values);
  } catch (err) {
    console.error('❌ Error in /distinct-values:', err.message);
    res.status(500).json({ error: 'DB query failed' });
  }
});


// Start server
//const os = require('os');
//const ip = Object.values(os.networkInterfaces()).flat().find(i => i.family === 'IPv4' && !i.internal).address;

//app.listen(PORT, ip, () => {
  //console.log(`Server running at http://${ip}:${PORT}`);
//});


  // تشغيل السيرفر
  app.listen(3000, () => console.log('🚀 userServer.js running on http://localhost:3000'));


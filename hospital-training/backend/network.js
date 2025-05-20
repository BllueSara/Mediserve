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
    INSERT INTO entries (circuit_name, isp, location, ip, speed, start_date, end_date, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [circuit, isp, location, ip, speed, start_date, end_date, userId], (err) => {
    if (err) return res.status(500).json({ error: 'Insert failed' });
    res.json({ success: true });
  });
});

app.delete('/api/entries/:id', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const entryId = req.params.id;

  try {
    const [result] = await db.promise().query(
      'DELETE FROM entries WHERE id = ? AND user_id = ?',
      [entryId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(403).json({ error: 'Unauthorized or not found' });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

app.put('/api/entries/:id', authenticateToken, async (req, res) => {
  const entryId = req.params.id;
  const { circuit, isp, location, ip, speed, start_date, end_date } = req.body;
  const userId = req.user.id;

  try {
    const conn = db.promise();

    // ✅ Get user's name
    const [userRows] = await conn.query(`SELECT name FROM users WHERE id = ?`, [userId]);
    const userName = userRows[0]?.name || 'Unknown';

    // ✅ Get old entry
    const [oldEntryRows] = await conn.query(`SELECT * FROM entries WHERE id = ?`, [entryId]);
    if (!oldEntryRows.length) return res.status(404).json({ message: "❌ Entry not found" });
    const oldEntry = oldEntryRows[0];

    // ✅ Update entry
    await conn.query(`
      UPDATE entries SET 
        circuit_name = ?, isp = ?, location = ?, ip = ?, speed = ?, 
        start_date = ?, end_date = ?
      WHERE id = ?
    `, [circuit, isp, location, ip, speed, start_date, end_date, entryId]);

    // ✅ Compare field changes
    const formatDate = d => d ? new Date(d).toISOString().split('T')[0] : null;
    const changes = [];

    if (oldEntry.circuit_name !== circuit)
      changes.push(`circuit_name: '${oldEntry.circuit_name}' → '${circuit}'`);
    if (oldEntry.isp !== isp)
      changes.push(`isp: '${oldEntry.isp}' → '${isp}'`);
    if (oldEntry.location !== location)
      changes.push(`location: '${oldEntry.location}' → '${location}'`);
    if (oldEntry.ip !== ip)
      changes.push(`ip: '${oldEntry.ip}' → '${ip}'`);
    if (oldEntry.speed !== speed)
      changes.push(`speed: '${oldEntry.speed}' → '${speed}'`);
    if (formatDate(oldEntry.start_date) !== formatDate(start_date))
      changes.push(`start_date: '${formatDate(oldEntry.start_date)}' → '${formatDate(start_date)}'`);
    if (formatDate(oldEntry.end_date) !== formatDate(end_date))
      changes.push(`end_date: '${formatDate(oldEntry.end_date)}' → '${formatDate(end_date)}'`);

    // ✅ Get new department ID
    const [deptRows] = await conn.query("SELECT id FROM Departments WHERE name = ?", [location]);
    if (!deptRows.length) return res.status(400).json({ message: `❌ Department '${location}' not found` });
    const newDeptId = deptRows[0].id;

    const logUpdates = [];

    // ✅ Update Maintenance_Devices
    const [deviceUpdate] = await conn.query(`
      UPDATE Maintenance_Devices
      SET department_id = ?
      WHERE ip_address = ? AND (department_id IS NULL OR department_id != ?)
    `, [newDeptId, ip, newDeptId]);
    if (deviceUpdate.affectedRows > 0) logUpdates.push("Maintenance_Devices");

    // ✅ Update Maintenance_Reports linked to those devices
    const [reportUpdate] = await conn.query(`
      UPDATE Maintenance_Reports
      SET department_id = ?
      WHERE device_id IN (
        SELECT id FROM Maintenance_Devices WHERE ip_address = ?
      )
    `, [newDeptId, ip]);
    if (reportUpdate.affectedRows > 0) logUpdates.push("Maintenance_Reports");

    // ✅ Update other linked tables
    const updates = [
      { table: "PC_info", column: "Department", conditionCol: "Department", value: newDeptId },
      { table: "General_Maintenance", column: "department_name", conditionCol: "department_name", value: location },
      { table: "Regular_Maintenance", column: "department_name", conditionCol: "department_name", value: location },
      { table: "External_Maintenance", column: "department_name", conditionCol: "department_name", value: location },
      { table: "New_Maintenance_Report", column: "department_id", conditionCol: "department_id", value: newDeptId },
      { table: "Internal_Tickets", column: "department_id", conditionCol: "department_id", value: newDeptId },
      { table: "External_Tickets", column: "department_id", conditionCol: "department_id", value: newDeptId }
    ];

    for (const update of updates) {
      const query = `
        UPDATE ${update.table}
        SET ${update.column} = ?
        WHERE ip_address = ? AND (${update.conditionCol} IS NULL OR ${update.conditionCol} != ?)
      `;
      const [result] = await conn.query(query, [update.value, ip, update.value]);
      if (result.affectedRows > 0) logUpdates.push(update.table);
    }

    // ✅ Log department change only if location changed
    if (logUpdates.length > 0 && oldEntry.location !== location) {
      await conn.query(`
        INSERT INTO Activity_Logs (user_id, user_name, action, details)
        VALUES (?, ?, 'Updated Department', ?)
      `, [
        userId,
        userName,
        `Changed department to '${location}' for IP ${ip} in: ${logUpdates.join(', ')}`
      ]);
    }

    // ✅ Log entry field changes
    if (changes.length > 0) {
      await conn.query(`
        INSERT INTO Activity_Logs (user_id, user_name, action, details)
        VALUES (?, ?, 'Edited Entry', ?)
      `, [
        userId,
        userName,
        `Edited entry ID ${entryId}:\n- ${changes.join('\n- ')}`
      ]);
    }

    res.json({
      message: `✅ Entry updated. ${changes.length || logUpdates.length ? '' : 'No actual changes.'}`
    });

  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ message: "❌ Update failed", error: err.message });
  }
});


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

  const formatDate = (iso) => {
    try {
      return new Date(iso).toISOString().split('T')[0]; // "YYYY-MM-DD"
    } catch {
      return null;
    }
  };

  try {
    const [senderInfoRows] = await db.promise().query(`SELECT name FROM users WHERE id = ?`, [senderId]);
    if (!senderInfoRows.length) {
      return res.status(400).json({ error: '❌ Sender not found' });
    }

    const senderName = senderInfoRows[0].name;
    const ipList = [];
    const receiverNames = [];

    for (const device of devices) {
      const {
        circuit_name, isp, location, ip, speed, start_date, end_date
      } = device;

      const formattedStart = formatDate(start_date);
      const formattedEnd = formatDate(end_date);

      if (!circuit_name || !isp || !location || !ip || !speed || !formattedStart || !formattedEnd) {
        continue;
      }

      const [existingRows] = await db.promise().query(`
        SELECT id FROM entries
        WHERE circuit_name = ? AND isp = ? AND location = ? AND ip = ? AND speed = ? AND start_date = ? AND end_date = ? AND user_id IS NULL
        LIMIT 1
      `, [circuit_name, isp, location, ip, speed, formattedStart, formattedEnd]);

      let entryId;

      if (existingRows.length > 0) {
        entryId = existingRows[0].id;
      } else {
        const [insertResult] = await db.promise().query(`
          INSERT INTO entries (circuit_name, isp, location, ip, speed, start_date, end_date, user_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, NULL)
        `, [circuit_name, isp, location, ip, speed, formattedStart, formattedEnd]);

        entryId = insertResult.insertId;
      }

      ipList.push(ip);

      for (const receiverId of receiver_ids) {
        await db.promise().query(`
          INSERT IGNORE INTO shared_entries (sender_id, receiver_id, entry_id)
          VALUES (?, ?, ?)
        `, [senderId, receiverId, entryId]);
      }
    }

    // إشعارات
    for (const receiverId of receiver_ids) {
      const [receiverInfo] = await db.promise().query(`SELECT name FROM users WHERE id = ?`, [receiverId]);
      const receiverName = receiverInfo[0]?.name || 'Unknown';
      receiverNames.push(receiverName);

      const message = `📡 Network entries with IPs [${ipList.join(', ')}] were shared with you by ${senderName}`;
      await db.promise().query(`
        INSERT INTO Notifications (user_id, message, type)
        VALUES (?, ?, 'network-share')
      `, [receiverId, message]);
    }

    const logMsg = `Shared entries with IPs [${ipList.join(', ')}] with users: [${receiverNames.join(', ')}]`;
    await db.promise().query(`
      INSERT INTO Activity_Logs (user_id, user_name, action, details)
      VALUES (?, ?, 'Shared Network Entry', ?)
    `, [senderId, senderName, logMsg]);

    res.json({ success: true });
  } catch (err) {
    console.error('❌ Share Error:', err);
    res.status(500).json({ error: '❌ Failed to share entries', details: err.message });
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
    let entries;
    if (req.user.role === 'admin') {
      [entries] = await db.promise().query(`
        SELECT 
          MIN(id) as id,
          circuit_name,
          isp,
          location,
          ip,
          speed,
          MIN(start_date) AS start_date,
          MAX(end_date) AS end_date,
          user_id
        FROM entries
        GROUP BY circuit_name, isp, location, ip, speed
      `);
    } else {
      [entries] = await db.promise().query(`
        SELECT 
          MIN(id) as id,
          circuit_name,
          isp,
          location,
          ip,
          speed,
          MIN(start_date) AS start_date,
          MAX(end_date) AS end_date,
          user_id
        FROM entries
        WHERE user_id = ?
        GROUP BY circuit_name, isp, location, ip, speed
      `, [userId]);
    }

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
      SELECT 
        MIN(e.id) AS id,
        e.circuit_name,
        e.isp,
        e.location,
        e.ip,
        e.speed,
        MIN(e.start_date) AS start_date,
        MAX(e.end_date) AS end_date
      FROM entries e
      JOIN shared_entries se ON e.id = se.entry_id
      WHERE se.receiver_id = ?
      GROUP BY e.circuit_name, e.isp, e.location, e.ip, e.speed
    `, [userId]);

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

const cron = require('node-cron');

cron.schedule('02 * * * *', async () => {
  try {
    const intervals = [
      { days: 90, label: '3 months' },
      { days: 30, label: '1 month' },
      { days: 7, label: '1 week' }
    ];

    for (let interval of intervals) {
      const [entries] = await db.promise().query(`
        SELECT id, user_id, circuit_name, ip, end_date
        FROM entries
        WHERE DATEDIFF(end_date, CURDATE()) = ?
      `, [interval.days]);

      for (let entry of entries) {
        const message = `Contract for circuit "${entry.circuit_name}" (IP: ${entry.ip}) will expire in ${interval.label}`;
        
        // تحقق إذا الإشعار تم مسبقًا
        const [existingNotif] = await db.promise().query(`
          SELECT id FROM Notifications
          WHERE user_id = ? AND message = ? AND type = 'contract-expiry-warning'
        `, [entry.user_id, message]);

        if (existingNotif.length === 0) {
          const [userRes] = await db.promise().query(`SELECT name FROM users WHERE id = ?`, [entry.user_id]);
          const userName = userRes[0]?.name || 'Unknown';

          await db.promise().query(`
            INSERT INTO Notifications (user_id, message, type)
            VALUES (?, ?, ?)
          `, [entry.user_id, message, 'contract-expiry-warning']);

          await db.promise().query(`
            INSERT INTO Activity_Logs (user_id, user_name, action, details)
            VALUES (?, ?, ?, ?)
          `, [
            entry.user_id,
            userName,
            'Contract Expiry Reminder',
            `System notified ${interval.label} before contract end for IP: ${entry.ip}`
          ]);
        }
      }
    }

    console.log('✅ Contract expiry reminders processed.');
  } catch (err) {
    console.error('❌ Error in contract expiry check:', err);
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


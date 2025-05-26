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

let activePersistentPings = {};

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

// Serve static files from all directories
app.use(express.static(path.join(__dirname)));
app.use(express.static(path.join(__dirname, '..')));
app.use(express.static(path.join(__dirname, '..', '..')));




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

app.get('/api/ping-t/results', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { ip } = req.query;

  if (!ip) {
    return res.status(400).json({ error: 'IP address is required in query parameters' });
  }

  if (!isValidIP(ip)) {
    return res.status(400).json({ error: 'Invalid IP address provided' });
  }

  try {
    const [rows] = await db.promise().query(
      `SELECT ip, latency, packetLoss, timeouts, status, output, timestamp 
       FROM Report_Results 
       WHERE user_id = ? AND ip = ? AND is_persistent_ping = TRUE 
       ORDER BY timestamp DESC 
       LIMIT 20`,
      [userId, ip]
    );
    res.json(rows);

  } catch (error) {
    console.error('Error fetching persistent ping results:', error);
    res.status(500).json({ error: 'Failed to fetch persistent ping results', details: error.message });
  }
});

app.get('/api/ping-t/status', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { ip } = req.query; // Optional IP from query parameter

  try {
    let query = "SELECT ip_address, status, started_at FROM Persistent_Pings WHERE user_id = ? AND status = 'running'";
    const params = [userId];

    if (ip) {
      if (!isValidIP(ip)) {
        return res.status(400).json({ error: 'Invalid IP address provided in query' });
      }
      query += " AND ip_address = ?";
      params.push(ip);
    }

    const [rows] = await db.promise().query(query, params);
    res.json(rows);

  } catch (error) {
    console.error('Error fetching persistent ping status:', error);
    res.status(500).json({ error: 'Failed to fetch persistent ping status', details: error.message });
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
      d.circuit && d.isp && d.location && d.ip
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
});




app.get('/api/entries/mine', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    let entries;
    if (req.user.role === 'admin') {
      [entries] = await db.promise().query(`
        SELECT 
          MIN(id) AS id,
          circuit_name,
          isp,
          location,
          ip,
          speed,
          MIN(start_date) AS start_date,
          MAX(end_date) AS end_date
        FROM entries
        GROUP BY circuit_name, isp, location, ip, speed
      `);
    } else {
      [entries] = await db.promise().query(`
        SELECT 
          MIN(id) AS id,
          circuit_name,
          isp,
          location,
          ip,
          speed,
          MIN(start_date) AS start_date,
          MAX(end_date) AS end_date
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
const { error } = require('console');

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


// حفظ مجموعة أجهزة من Excel
app.post('/api/entries/bulk', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { devices } = req.body;

  if (!Array.isArray(devices) || devices.length === 0) {
    return res.status(400).json({ error: '❌ No devices provided' });
  }

  let savedCount = 0;
  let skippedCount = 0;

  try {
    for (const d of devices) {
      // تحقق من صحة IP
      if (
        !d.circuit_name || !d.isp || !d.location || !d.ip ||
        !/^\d{1,3}(\.\d{1,3}){3}$/.test(d.ip) ||
        !d.ip.split('.').every(part => parseInt(part) <= 255)
      ) {
        skippedCount++;
        continue;
      }

      // تحقق من التكرار التام للمستخدم
      const [existing] = await db.promise().query(`
        SELECT id FROM entries
        WHERE circuit_name = ? AND isp = ? AND location = ? AND ip = ?
          AND speed <=> ? AND start_date <=> ? AND end_date <=> ? AND user_id = ?
        LIMIT 1
      `, [
        d.circuit_name,
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
        continue;
      }

      // إذا مو مكرر → نحفظه
      await db.promise().query(`
        INSERT INTO entries 
          (circuit_name, isp, location, ip, speed, start_date, end_date, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        d.circuit_name,
        d.isp,
        d.location,
        d.ip,
        d.speed || null,
        d.start_date || null,
        d.end_date || null,
        userId
      ]);

      savedCount++;
    }

    res.json({ success: true, saved: savedCount, skipped: skippedCount });
  } catch (err) {
    console.error('❌ Bulk insert error:', err.message);
    res.status(500).json({ error: '❌ Failed to save devices' });
  }
});


// route to ctreat report 
app.post('/api/reports/create', authenticateToken, async (req, res) => {
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

    // نحدد نوع التقرير
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

      // إذا كان auto → نحفظ النتائج التفصيلية
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
        // نوع normal → نحفظ فقط الحقول المطلوبة + status
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
});




// يجيب التقارير حسب اليوزر 
app.get('/api/reports/mine' , authenticateToken,  async(req,res) => {
  const userId = req.user.id;
  const isAdmin = req.user.role === "admin";

  try{
   const [reports] = await db.promise().query(`
    SELECT 
      r.id AS report_id, 
      r.created_at,
      u.name AS owner_name,
      COUNT(rr.id) AS device_count
    FROM Reports r
    LEFT JOIN Report_Results rr ON r.id = rr.report_id
    LEFT JOIN users u ON r.user_id = u.id
    ${isAdmin ? '' : 'WHERE r.user_id = ?'}
    GROUP BY r.id
    ORDER BY r.created_at DESC
  `, isAdmin ? [] : [userId]);

  res.json(reports);
  } catch (err) {
    console.error("❌ Failed to fetch reports:", err.message);
    res.status(500).json({ error: '❌ Could not fetch reports' });
  }
});


// detalis reports
app.get('/api/reports/:id', authenticateToken, async (req, res) => {
  const reportId = req.params.id;
  const userId = req.user.id;
  const isAdmin = req.user.role === 'admin';

  try {
    // نجيب معلومات التقرير
    const [[reportInfo]] = await db.promise().query(
      `SELECT user_id, title, created_at, report_type FROM Reports WHERE id = ?`,
      [reportId]
    );
    

    if (!reportInfo) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const isOwner = reportInfo.user_id === userId;
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // نجيب النتائج المرتبطة
    const [results] = await db.promise().query(
      `SELECT * FROM Report_Results WHERE report_id = ? ORDER BY timestamp ASC`, 
      [reportId]
    );

    // نرجع معلومات متكاملة
    res.json({
      title: reportInfo.title,
      type: reportInfo.report_type || 'normal', // <-- هنا التغيير الصحيح
      created_at: reportInfo.created_at,
      results
    });

  } catch (err) {
    console.error("❌ Error loading report details:", err.message);
    res.status(500).json({ error: '❌ Could not load report details' });
  }
});



app.get('/api/reports/:id/download', authenticateToken, async (req, res) => {
  const reportId = req.params.id;
  const userId = req.user.id;
  const isAdmin = req.user.role === 'admin';

  try {
    // تحقق من ملكية التقرير أو صلاحية الأدمن
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

    // اختر الأعمدة بناءً على نوع التقرير
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

    // أضف البيانات للصفوف
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
});



// Auto Ping Endpoint (بدون تخزين مؤقت، مجرد تشغيل مؤقت لمدة معينة)
app.post('/api/auto-ping/start', authenticateToken, async (req, res) => {
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

        // تخزين النتيجة
        try {
          await db.promise().query(`
            INSERT INTO Report_Results 
              (report_id, ip, latency, packetLoss, timeouts, status, output, timestamp, user_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            null, ip,
            parsed.latency, parsed.packetLoss, parsed.timeouts,
            parsed.status, output,
            new Date(), userId
          ]);
        } catch (dbErr) {
          console.error(`❌ DB Insert failed for ${ip}:`, dbErr.message);
        }

        console.log(`[${new Date().toISOString()}] [${ip}] ${parsed.status} (${parsed.latency}ms, ${parsed.packetLoss}% loss)`);
      });
    }, 60 * 1000); // كل دقيقة
  }

  res.json({ success: true, message: `✅ Auto ping started for ${ips.length} IP(s) for ${duration_hours} hour(s)` });
});

// في ملف السيرفر backend مثل network.js أو userServer.js
app.get('/api/auto-ping/results', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const [rows] = await db.promise().query(`
      SELECT ip, latency, packetLoss, timeouts, status, timestamp
      FROM Report_Results
      WHERE report_id IN (
        SELECT id FROM Reports WHERE user_id = ? AND report_type = 'auto'
      )
      ORDER BY timestamp DESC
      LIMIT 100
    `, [userId]);

    res.json(rows); // ✅ لازم يرجّع Array لأن front-end يتوقع كذا
  } catch (err) {
    console.error('❌ Auto Ping Results Error:', err.message);
    res.status(500).json({ error: '❌ Could not fetch auto ping results' });
  }
});




// Start server
//const os = require('os');
//const ip = Object.values(os.networkInterfaces()).flat().find(i => i.family === 'IPv4' && !i.internal).address;

//app.listen(PORT, ip, () => {
//console.log(`Server running at http://${ip}:${PORT}`);
//});


// تشغيل السيرفر

// Helper function to parse ping output (adapted from /api/auto-ping/start)
const formatPersistentPingOutput = (output) => {
  const latencyMatch = output.match(/time(?:[=<])?(\d+\.?\d*)\s*ms/i);
  const lossMatch = output.match(/(\d+)%\s*packet loss/i);
  const timeouts = (output.match(/Request timed out/gi) || []).length;
  const isWindows = process.platform === 'win32';
  let packetsTransmitted = 0;
  let packetsReceived = 0;

  if (isWindows) {
    const sentMatch = output.match(/Sent = (\d+)/);
    const receivedMatch = output.match(/Received = (\d+)/);
    if (sentMatch) packetsTransmitted = parseInt(sentMatch[1]);
    if (receivedMatch) packetsReceived = parseInt(receivedMatch[1]);
  } else { // macOS / Linux
    const summaryMatch = output.match(/(\d+) packets transmitted, (\d+) received/i);
    if (summaryMatch) {
      packetsTransmitted = parseInt(summaryMatch[1]);
      packetsReceived = parseInt(summaryMatch[2]);
    }
  }

  let status = 'active';
  if (lossMatch && parseFloat(lossMatch[1]) === 100) {
    status = 'failed';
  } else if (timeouts > 0 && packetsReceived === 0) {
    status = 'failed';
  } else if ((lossMatch && parseFloat(lossMatch[1]) > 0) || (latencyMatch && parseFloat(latencyMatch[1]) > 100) || timeouts > 0) {
    status = 'unstable';
  }


  return {
    latency: latencyMatch ? parseFloat(latencyMatch[1]) : null,
    packetLoss: lossMatch ? parseFloat(lossMatch[1]) : (packetsTransmitted > 0 ? ((packetsTransmitted - packetsReceived) / packetsTransmitted) * 100 : 0),
    timeouts,
    status
  };
};


// Persistent Ping Endpoints
app.post('/api/ping-t/start', authenticateToken, async (req, res) => {
  const { ip } = req.body;
  const userId = req.user.id;

  if (!ip || !isValidIP(ip)) {
    return res.status(400).json({ error: 'Invalid IP address' });
  }

  const pingKey = `${userId}_${ip}`;

  try {
    // Check if a ping is already running for this IP and user
    const [existingPings] = await db.promise().query(
      "SELECT id FROM Persistent_Pings WHERE user_id = ? AND ip_address = ? AND status = 'running'",
      [userId, ip]
    );

    if (existingPings.length > 0 || activePersistentPings[pingKey]) {
      return res.status(400).json({ error: `Persistent ping is already running for ${ip}` });
    }

    // Insert or update Persistent_Pings table
    const [existingStoppedPing] = await db.promise().query(
      "SELECT id FROM Persistent_Pings WHERE user_id = ? AND ip_address = ? AND status = 'stopped'",
      [userId, ip]
    );

    let persistentPingId;
    if (existingStoppedPing.length > 0) {
      persistentPingId = existingStoppedPing[0].id;
      await db.promise().query(
        "UPDATE Persistent_Pings SET status = 'running', started_at = NOW() WHERE id = ?",
        [persistentPingId]
      );
    } else {
      const [insertResult] = await db.promise().query(
        "INSERT INTO Persistent_Pings (user_id, ip_address, status, started_at) VALUES (?, ?, 'running', NOW())",
        [userId, ip]
      );
      persistentPingId = insertResult.insertId;
    }

    const isWindows = process.platform === 'win32';
    const command = isWindows ? `ping -n 1 ${ip}` : `ping -c 1 ${ip}`; // Ping once

    const intervalId = setInterval(async () => {
      try {
        const { stdout, stderr } = await execAsync(command);
        const output = stdout || stderr || 'No response from ping';
        const parsedResult = formatPersistentPingOutput(output);

        await db.promise().query(
          `INSERT INTO Report_Results 
            (ip, latency, packetLoss, timeouts, status, output, timestamp, user_id, is_persistent_ping, persistent_ping_id) 
           VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, TRUE, ?)`,
          [
            ip,
            parsedResult.latency,
            parsedResult.packetLoss,
            parsedResult.timeouts,
            parsedResult.status,
            output,
            userId,
            persistentPingId // Link to the entry in Persistent_Pings
          ]
        );
      } catch (pingError) {
        const errorOutput = pingError.stdout || pingError.stderr || pingError.message;
        const parsedResult = formatPersistentPingOutput(errorOutput);
        await db.promise().query(
          `INSERT INTO Report_Results 
            (ip, latency, packetLoss, timeouts, status, output, timestamp, user_id, is_persistent_ping, persistent_ping_id) 
           VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, TRUE, ?)`,
          [
            ip,
            parsedResult.latency,
            parsedResult.packetLoss,
            parsedResult.timeouts,
            'failed', // Mark as failed on error
            errorOutput,
            userId,
            persistentPingId
          ]
        );
        console.error(`Persistent Ping Error for ${ip} (User ${userId}):`, errorOutput);
      }
    }, 5000); // Ping every 5 seconds

    activePersistentPings[pingKey] = intervalId;

    res.json({ success: true, message: `Persistent ping started for ${ip}` });

  } catch (error) {
    console.error('Error starting persistent ping:', error);
    res.status(500).json({ error: 'Failed to start persistent ping', details: error.message });
  }
});

app.post('/api/ping-t/stop', authenticateToken, async (req, res) => {
  const { ip } = req.body;
  const userId = req.user.id;

  if (!ip || !isValidIP(ip)) {
    return res.status(400).json({ error: 'Invalid IP address' });
  }

  const pingKey = `${userId}_${ip}`;

  try {
    const intervalId = activePersistentPings[pingKey];

    if (!intervalId) {
      // Check if it was running in DB but not in memory (e.g. after server restart)
      const [existingPings] = await db.promise().query(
        "SELECT id FROM Persistent_Pings WHERE user_id = ? AND ip_address = ? AND status = 'running'",
        [userId, ip]
      );
      if (existingPings.length > 0) {
        // If it was running, update DB but can't clear interval if not in memory
         await db.promise().query(
          "UPDATE Persistent_Pings SET status = 'stopped' WHERE user_id = ? AND ip_address = ? AND status = 'running'",
          [userId, ip]
        );
        return res.json({ success: true, message: `Persistent ping for ${ip} was marked as stopped in DB. Was not actively running in this session.` });
      }
      return res.status(404).json({ error: `No active persistent ping found for ${ip}` });
    }

    clearInterval(intervalId);
    delete activePersistentPings[pingKey];

    // Update Persistent_Pings table
    const [updateResult] = await db.promise().query(
      "UPDATE Persistent_Pings SET status = 'stopped' WHERE user_id = ? AND ip_address = ? AND status = 'running'",
      [userId, ip]
    );

    if (updateResult.affectedRows === 0) {
        // This case might happen if the ping was stopped by another request or if DB state is inconsistent
        console.warn(`No 'running' persistent ping found in DB to update for ${ip} and user ${userId}, but was active in memory.`);
    }

    res.json({ success: true, message: `Persistent ping stopped for ${ip}` });

  } catch (error) {
    console.error('Error stopping persistent ping:', error);
    res.status(500).json({ error: 'Failed to stop persistent ping', details: error.message });
  }
});


app.listen(3000, () => console.log('🚀 userServer.js running on http://localhost:3000'));


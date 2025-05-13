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

    res.json({ output: stdout || stderr || 'No response from ping' });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
        return { ip, status: 'error', output: error.message };
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
app.post('/api/save', (req, res) => {
  const { devices } = req.body;
  if (!Array.isArray(devices) || devices.length === 0) {
    return res.status(400).json({ error: 'No valid devices provided' });
  }

  let completed = 0;
  let hasError = false;

  devices.forEach(device => {
    const { department, company, ip } = device;
    db.query(
      'INSERT INTO entries (department, company, ip) VALUES (?, ?, ?)',
      [department, company, ip],
      (err) => {
        if (err) {
          console.error('Insert error:', err);
          hasError = true;
        }
        completed++;
        if (completed === devices.length) {
          if (hasError) {
            return res.status(500).json({ error: 'One or more inserts failed' });
          }
          res.json({ success: true, message: 'Devices saved to database' });
        }
      }
    );
  });
});

// 5. Get entries from DB
app.get('/api/entries', (req, res) => {
  db.query('SELECT * FROM entries ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      console.error('DB error:', err);
      return res.status(500).json({ error: 'Failed to retrieve devices' });
    }
    res.json(rows);
  });
});

// 6. Generate report
app.post('/api/report', async (req, res) => {
  try {
    const { devices } = req.body;
    if (!Array.isArray(devices) || devices.length === 0) {
      return res.status(400).json({ error: 'No devices provided' });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Network Report');

    worksheet.columns = [
      { header: 'Department', key: 'department', width: 20 },
      { header: 'Company', key: 'company', width: 20 },
      { header: 'IP Address', key: 'ip', width: 18 }
    ];

    worksheet.addRows(devices);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=network_report.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
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


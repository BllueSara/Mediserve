const API_BASE_URL = 'http://localhost:3000/api';

// تحديد الصف المحدد
let selectedRow = null;
let continuousPingInterval = null;

document.addEventListener('DOMContentLoaded', () => {
  loadSavedDevices();

  const tableBody = document.getElementById('device-table-body');

  // تحديد الصف بالنقر
  tableBody.addEventListener('click', (event) => {
    const row = event.target.closest('tr');
    if (!row) return;

    if (selectedRow) {
      selectedRow.classList.remove('selected-row');
    }

    selectedRow = row;
    selectedRow.classList.add('selected-row');
  });

  // ربط الأزرار بوظائفها
  document.getElementById('ping-btn')?.addEventListener('click', pingSelectedDevice);
  document.getElementById('pingall-btn')?.addEventListener('click', pingAllDevices);
  document.getElementById('pingt-btn')?.addEventListener('click', startContinuousPing);
  document.getElementById('traceroute-btn')?.addEventListener('click', tracerouteSelectedDevice);
  document.getElementById('report-btn')?.addEventListener('click', generateReport);
  document.getElementById('saveBtn')?.addEventListener('click', saveAllIPs);
});

function isValidIP(ip) {
  const ipv4 = /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;
  return ipv4.test(ip);
}

function appendToTerminal(text, isError = false) {
  const terminal = document.getElementById('terminal-output');
  const line = document.createElement('div');
  line.textContent = text;
  line.style.color = isError ? '#e74c3c' : '#2ecc71';
  terminal.appendChild(line);
  terminal.scrollTop = terminal.scrollHeight;
}

async function pingSelectedDevice() {
  if (!selectedRow) return appendToTerminal('Please select a device.', true);
  const ip = selectedRow.cells[2].textContent.trim();
  if (!isValidIP(ip)) return appendToTerminal('Invalid IP address.', true);

  appendToTerminal(`Pinging ${ip}...`);
  try {
    const res = await fetch(`${API_BASE_URL}/ping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip })
    });
    const data = await res.json();
    appendToTerminal(data.error || data.output, !!data.error);
    updateRowStatus(selectedRow, data);
    updateStatusCounts();
  } catch (err) {
    appendToTerminal(`Ping error: ${err.message}`, true);
  }
}

async function tracerouteSelectedDevice() {
  if (!selectedRow) return appendToTerminal('Please select a device.', true);
  const ip = selectedRow.cells[2].textContent.trim();
  if (!isValidIP(ip)) return appendToTerminal('Invalid IP address.', true);

  appendToTerminal(`Tracing route to ${ip}...`);
  try {
    const res = await fetch(`${API_BASE_URL}/traceroute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip })
    });
    const data = await res.json();
    appendToTerminal(data.error || data.output, !!data.error);
  } catch (err) {
    appendToTerminal(`Traceroute error: ${err.message}`, true);
  }
}

async function pingAllDevices() {
  const rows = document.querySelectorAll('#device-table-body tr');
  const ips = [];
  const rowMap = {};

  rows.forEach(row => {
    const ip = row.cells[2].textContent.trim();
    if (isValidIP(ip)) {
      ips.push(ip);
      rowMap[ip] = row;
    }
  });

  if (!ips.length) {
    appendToTerminal('No valid IPs found.', true);
    return;
  }

  appendToTerminal('Pinging all devices...');

  try {
    const res = await fetch(`${API_BASE_URL}/ping-all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ips })
    });

    const data = await res.json();

    data.results.forEach(result => {
      const row = rowMap[result.ip];
      if (row) {
        appendToTerminal(`[${result.ip}] ${result.output}`, result.status === 'error');
        updateRowStatus(row, result);
      }
    });

    updateStatusCounts();
  } catch (err) {
    appendToTerminal(`Ping All error: ${err.message}`, true);
  }
}


function startContinuousPing() {
  if (!selectedRow) return appendToTerminal('Please select a device.', true);
  const ip = selectedRow.cells[2].textContent.trim();
  if (!isValidIP(ip)) return appendToTerminal('Invalid IP address.', true);

  if (continuousPingInterval) {
    clearInterval(continuousPingInterval);
    continuousPingInterval = null;
    appendToTerminal('Stopped continuous ping.');
    return;
  }

  appendToTerminal(`Starting continuous ping to ${ip}...`);
  continuousPingInterval = setInterval(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/ping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip })
      });
      const data = await res.json();
      appendToTerminal(data.error || data.output, !!data.error);
    } catch (err) {
      appendToTerminal(`Ping error: ${err.message}`, true);
    }
  }, 2000);
}

async function generateReport() {
  try {
    const res = await fetch(`${API_BASE_URL}/report`, { method: 'GET' });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'network_report.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    appendToTerminal(`Report error: ${err.message}`, true);
  }
}

async function saveAllIPs() {
  const rows = document.querySelectorAll('#device-table-body tr');
  const devices = Array.from(rows).map(row => ({
    department: row.cells[0].textContent.trim(),
    company: row.cells[1].textContent.trim(),
    ip: row.cells[2].textContent.trim(),
    status: row.cells[3].textContent.trim()
  })).filter(dev => isValidIP(dev.ip));

  try {
    const res = await fetch(`${API_BASE_URL}/save-ips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ devices })
    });
    const data = await res.json();
    appendToTerminal(data.message || 'IPs saved successfully.');
  } catch (err) {
    appendToTerminal(`Save error: ${err.message}`, true);
  }
}

function updateRowStatus(row, data) {
  const statusCell = row.cells[3];
  if (data.error) {
    statusCell.textContent = 'Failed';
    statusCell.style.color = 'red';
  } else if (data.output.includes('0% packet loss')) {
    statusCell.textContent = 'Active';
    statusCell.style.color = 'green';
  } else {
    statusCell.textContent = 'Unstable';
    statusCell.style.color = 'orange';
  }
}

function updateStatusCounts() {
  const rows = document.querySelectorAll('#device-table-body tr');
  let total = 0, active = 0, failed = 0, unstable = 0;

  rows.forEach(row => {
    const status = row.cells[3].textContent.trim().toLowerCase();
    if (status) {
      total++;
      if (status === 'active') active++;
      else if (status === 'failed') failed++;
      else if (status === 'unstable') unstable++;
    }
  });

  document.getElementById('total-count').textContent = total;
  document.getElementById('active-count').textContent = active;
  document.getElementById('failed-count').textContent = failed;
  document.getElementById('unstable-count').textContent = unstable;
}

async function loadSavedDevices() {
  try {
    const res = await fetch(`${API_BASE_URL}/entries`);
    const devices = await res.json();
    const tableBody = document.getElementById('device-table-body');
    tableBody.innerHTML = '';

    devices.forEach(device => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${device.department}</td>
        <td>${device.company}</td>
        <td>${device.ip}</td>
        <td style="color: gray;">Not Checked</td>
      `;
      tableBody.appendChild(row);
    });

    updateStatusCounts();
  } catch (err) {
    appendToTerminal(`Failed to load devices: ${err.message}`, true);
  }
}

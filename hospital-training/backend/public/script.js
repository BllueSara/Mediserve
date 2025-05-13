const API_BASE_URL = 'http://localhost:3000/api';

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

function getFirstValidIP(startIndex = 0) {
  const inputs = document.querySelectorAll('.ip-input');
  for (let i = startIndex; i < inputs.length; i++) {
    const ip = inputs[i].value.trim();
    if (isValidIP(ip)) return { ip, index: i };
  }
  return null;
}

async function pingSelectedIP() {
  if (typeof pingSelectedIP.currentIndex === 'undefined') pingSelectedIP.currentIndex = 0;

  const next = getFirstValidIP(pingSelectedIP.currentIndex);
  if (!next) {
    appendToTerminal('No more valid IPs to test.');
    pingSelectedIP.currentIndex = 0; // reset
    return;
  }

  pingSelectedIP.currentIndex = next.index + 1;

  try {
    appendToTerminal(`Pinging ${next.ip}...`);
    const response = await fetch(`${API_BASE_URL}/ping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip: next.ip })
    });

    const data = await response.json();
    appendToTerminal(data.error || data.output, !!data.error);

    const dot = document.getElementById(`ip-dot-${next.index}`);
    if (data.error) updateStatusDot(dot, 'error');
    else if (data.output.includes('0% packet loss')) updateStatusDot(dot, 'success');
    else updateStatusDot(dot, 'warning');

    updateStatusCounts();
  } catch (err) {
    appendToTerminal(`Ping error: ${err.message}`, true);
  }
}

async function pingAllIPs() {
  const inputs = document.querySelectorAll('.ip-input');
  const seen = new Set();
  const ips = [];

  inputs.forEach(input => {
    const ip = input.value.trim();
    if (isValidIP(ip) && !seen.has(ip)) {
      seen.add(ip);
      ips.push(ip);
    }
  });

  if (!ips.length) return appendToTerminal('No valid IPs.', true);

  try {
    appendToTerminal('Starting ping sweep...');
    const response = await fetch(`${API_BASE_URL}/ping-all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ips })
    });
    const data = await response.json();
    data.results.forEach(result => {
      appendToTerminal(`\n[${result.ip}]`);
      appendToTerminal(result.output, result.status === 'error');

      const index = Array.from(inputs).findIndex(input => input.value.trim() === result.ip);
      if (index !== -1) {
        const dot = document.getElementById(`ip-dot-${index}`);
        if (result.status === 'error') updateStatusDot(dot, 'error');
        else if (result.output.includes('0% packet loss')) updateStatusDot(dot, 'success');
        else updateStatusDot(dot, 'warning');
      }
    });

    updateStatusCounts();
  } catch (err) {
    appendToTerminal(`Ping All failed: ${err.message}`, true);
  }
}

let continuousPingInterval = null;
function startContinuousPing() {
  const next = getFirstValidIP();
  if (!next) return appendToTerminal('Please enter a valid IP for Ping -t.', true);

  if (continuousPingInterval) {
    clearInterval(continuousPingInterval);
    continuousPingInterval = null;
    appendToTerminal('Ping -t stopped.');
    return;
  }

  appendToTerminal(`Starting Ping -t to ${next.ip}...`);
  continuousPingInterval = setInterval(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/ping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: next.ip })
      });
      const data = await response.json();
      appendToTerminal(data.error || data.output, !!data.error);
    } catch (err) {
      appendToTerminal(`Ping -t error: ${err.message}`, true);
    }
  }, 2000);
}

async function generateReport() {
  const form = document.getElementById('deviceForm');
  const departments = Array.from(form.querySelectorAll('input[name="department[]"]')).map(i => i.value.trim());
  const companies = Array.from(form.querySelectorAll('input[name="company[]"]')).map(i => i.value.trim());
  const ips = Array.from(form.querySelectorAll('input[name="ip[]"]')).map(i => i.value.trim());

  const devices = [];
  for (let i = 0; i < ips.length; i++) {
    if (departments[i] || companies[i] || ips[i]) {
      devices.push({ department: departments[i], company: companies[i], ip: ips[i] });
    }
  }

  try {
    const response = await fetch(`${API_BASE_URL}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ devices })
    });

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'network_report.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    appendToTerminal(`Report error: ${error.message}`, true);
  }
}

async function tracerouteSelectedIP() {
  const next = getFirstValidIP();
  if (!next) return appendToTerminal('Please enter a valid IP for Traceroute.', true);

  try {
    appendToTerminal(`Tracing route to ${next.ip}...`);
    const response = await fetch(`${API_BASE_URL}/traceroute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip: next.ip })
    });

    const data = await response.json();
    appendToTerminal(data.error || data.output, !!data.error);
  } catch (err) {
    appendToTerminal(`Traceroute error: ${err.message}`, true);
  }
}

function updateStatusDot(dot, status) {
  dot.className = 'dot status-dot';
  dot.classList.add(
    status === 'success' ? 'green' :
    status === 'error' ? 'red' :
    status === 'warning' ? 'yellow' : 'gray'
  );
}

function updateStatusCounts() {
  const ipInputs = document.querySelectorAll('.ip-input');
  let total = 0, active = 0, failed = 0, unstable = 0;

  ipInputs.forEach((input, i) => {
    const ip = input.value.trim();
    const dot = document.getElementById(`ip-dot-${i}`);
    if (isValidIP(ip)) {
      total++;
      if (dot.classList.contains('green')) active++;
      else if (dot.classList.contains('red')) failed++;
      else if (dot.classList.contains('yellow')) unstable++;
    }
  });



  

  document.getElementById('total-count').textContent = total;
  document.getElementById('active-count').textContent = active;
  document.getElementById('failed-count').textContent = failed;
  document.getElementById('unstable-count').textContent = unstable;
}


async function saveAllIPs() {
  const form = document.getElementById('deviceForm');
  const departments = Array.from(form.querySelectorAll('input[name="department[]"]')).map(i => i.value.trim());
  const companies = Array.from(form.querySelectorAll('input[name="company[]"]')).map(i => i.value.trim());
  const ips = Array.from(form.querySelectorAll('input[name="ip[]"]')).map(i => i.value.trim());

  const devices = [];
  for (let i = 0; i < ips.length; i++) {
    if (departments[i] || companies[i] || ips[i]) {
      devices.push({ department: departments[i], company: companies[i], ip: ips[i] });
    }
  }

  if (!devices.length) return appendToTerminal('No data to save.', true);

  try {
    const res = await fetch(`${API_BASE_URL}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ devices })
    });

    const data = await res.json();
    if (data.success) {
      appendToTerminal(`Saved ${devices.length} devices to database.`);
    } else {
      appendToTerminal(data.error, true);
    }
  } catch (err) {
    appendToTerminal(`Save error: ${err.message}`, true);
  }
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
        <td>${new Date(device.created_at).toLocaleString()}</td>
      `;
      tableBody.appendChild(row);
    });
  } catch (err) {
    console.error('Failed to load devices:', err);
  }
}

document.addEventListener('DOMContentLoaded', loadSavedDevices);


document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('ping-btn')?.addEventListener('click', pingSelectedIP);
  document.getElementById('pingall-btn')?.addEventListener('click', pingAllIPs);
  document.getElementById('pingt-btn')?.addEventListener('click', startContinuousPing);
  document.getElementById('report-btn')?.addEventListener('click', generateReport);
  document.getElementById('traceroute-btn')?.addEventListener('click', tracerouteSelectedIP);
  document.getElementById('saveBtn')?.addEventListener('click', saveAllIPs);

});


document.getElementById('device-table-body').addEventListener('click', function(e) {
  const row = e.target.closest('tr');
  if (row) {
    row.classList.toggle('selected-row');
  }
});

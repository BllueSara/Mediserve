const API_BASE_URL = 'http://localhost:3000/api';

// تحديد الصف المحدد
let selectedRow = null;
let continuousPingInterval = null;

document.addEventListener('DOMContentLoaded', () => {

  loadMyDevices();
  loadSharedDevices();
  populateFilterKeyOptions();

  const tableBody = document.getElementById('device-table-body');

  tableBody.addEventListener('click', (event) => {
    const row = event.target.closest('tr');
    if (!row) return;

    if (selectedRow) {
      selectedRow.classList.remove('selected-row');
    }

    selectedRow = row;
    selectedRow.classList.add('selected-row');
  });

  document.getElementById('ping-btn')?.addEventListener('click', pingSelectedDevice);
  document.getElementById('pingall-btn')?.addEventListener('click', pingAllDevices);
  document.getElementById('pingt-btn')?.addEventListener('click', startContinuousPing);
  document.getElementById('traceroute-btn')?.addEventListener('click', tracerouteSelectedDevice);
  document.getElementById('report-btn')?.addEventListener('click', generateReport);
  document.getElementById('saveBtn')?.addEventListener('click', saveAllIPs);
  document.getElementById('search-input')?.addEventListener('input', filterDevices);
  document.getElementById('filter-key')?.addEventListener('change', populateFilterValues);
  document.getElementById('filter-value')?.addEventListener('change', filterDevices);
  document.getElementById('shareBtn')?.addEventListener('click', openSharePopup);




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

  // يعتمد على العمود الصحيح لمكان IP
  const ip = selectedRow.cells[3]?.textContent.trim(); // العمود الرابع حسب ترتيب الجدول
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
  const ip = selectedRow.querySelector('.device-ip')?.textContent.trim();
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

  rows.forEach(row => {
    const ip = row.querySelector('.device-ip')?.textContent.trim();
    if (isValidIP(ip)) ips.push(ip);
  });

  if (!ips.length) {
    appendToTerminal('❌ No valid IPs found.', true);
    return;
  }

  appendToTerminal(`⏳ Pinging ${ips.length} devices...`);
  await runPingForIPs(ips);
}




function startContinuousPing() {
  if (!selectedRow) return appendToTerminal('Please select a device.', true);
  const ip = selectedRow.querySelector('.device-ip')?.textContent.trim();
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
      updateRowStatus(selectedRow, data); // تحديث اللمبة
      updateStatusCounts();
    } catch (err) {
      appendToTerminal(`Ping error: ${err.message}`, true);
    }
  }, 2000);
}


async function generateReport() {
  const rows = document.querySelectorAll('#device-table-body tr');

  const devices = Array.from(rows).map(row => {
    const cells = row.querySelectorAll('td');
    return {
      circuit: cells[0]?.textContent.trim(),
      isp: cells[1]?.textContent.trim(),
      location: cells[2]?.textContent.trim(),
      ip: row.querySelector('.device-ip')?.textContent.trim(),
      speed: cells[4]?.textContent.trim(),
      start_date: cells[5]?.textContent.trim(),
      end_date: cells[6]?.textContent.trim()
    };
  }).filter(d => isValidIP(d.ip));

  if (devices.length === 0) {
    appendToTerminal('❌ No valid devices to include in the report.', true);
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({ devices })
    });

    if (!res.ok) throw new Error('Report generation failed');

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
    appendToTerminal(`❌ Report error: ${err.message}`, true);
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
  const ipCell = row.cells[3];
  const lamp = ipCell.querySelector('.lamp');
  if (!lamp) return;

  const output = data.output || '';
  const error = data.error || '';

  if (data.status === 'error' || error || output.includes('100% packet loss') || output.includes('Request timed out')) {
    lamp.className = 'lamp lamp-red';
    row.deviceStatus = 'Failed';

    // فقط نعرض الرد الحقيقي بدون تحليل أو رسالة إضافية
    appendToTerminal(output || error || 'No response', true);
  } else if (output.includes('0% packet loss')) {
    lamp.className = 'lamp lamp-green';
    row.deviceStatus = 'Active';
  } else {
    lamp.className = 'lamp lamp-orange';
    row.deviceStatus = 'Unstable';
  }
}




function updateStatusCounts() {
  const rows = document.querySelectorAll('#device-table-body tr');
  let total = 0, active = 0, failed = 0, unstable = 0;

  rows.forEach(row => {
    const lamp = row.querySelector('.lamp');
    if (!lamp) return;

    if (lamp.classList.contains('lamp-green')) {
      active++;
      total++;
    } else if (lamp.classList.contains('lamp-red')) {
      failed++;
      total++;
    } else if (lamp.classList.contains('lamp-orange')) {
      unstable++;
      total++;
    }
    // الرمادي (الافتراضي) ما ينحسب
  });

  document.getElementById('total-count').textContent = total;
  document.getElementById('active-count').textContent = active;
  document.getElementById('failed-count').textContent = failed;
  document.getElementById('unstable-count').textContent = unstable;
}









let allDevices = [];



function renderDeviceTable(devices) {
  const tbody = document.getElementById('device-table-body');
  tbody.innerHTML = '';

  devices.forEach(device => {
    const row = document.createElement('tr');

    row.innerHTML = `
      <td>${device.circuit_name || '—'}</td>
      <td>${device.isp || '—'}</td>
      <td>${device.location || '—'}</td>
      <td>
        <span class="lamp lamp-gray"></span>
        <span class="device-ip">${device.ip || '—'}</span>
      </td>
      <td>${device.speed || '—'}</td>
      <td>${device.start_date?.split('T')[0] || '—'}</td>
      <td>${device.end_date?.split('T')[0] || '—'}</td>
    `;

    tbody.appendChild(row);
  });
}


function filterDevices() {
  const search = document.getElementById('search-input').value.toLowerCase();
  const key = document.getElementById('filter-key').value;
  const value = document.getElementById('filter-value').value;

  let filtered = allDevices;

  if (search) {
    filtered = filtered.filter(device => {
      return Object.values(device).some(v =>
        (v || '').toString().toLowerCase().includes(search)
      );
    });
  }

  if (key && value) {
    filtered = filtered.filter(device =>
      (device[key] || '').toString().toLowerCase() === value.toLowerCase()
    );
  }

  renderDeviceTable(filtered);
}


async function populateFilterValues() {
  const key = document.getElementById('filter-key').value;
  const valueSelect = document.getElementById('filter-value');
  valueSelect.innerHTML = '<option value="">Select value</option>';

  if (!key) return;

  try {
    const res = await fetch(`${API_BASE_URL}/distinct-values/${key}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem("token")}`
      }
    });

    const values = await res.json();

    values.forEach(val => {
      const opt = document.createElement('option');
      opt.value = val;
      opt.textContent = val;
      valueSelect.appendChild(opt);
    });
  } catch (err) {
    appendToTerminal(`❌ Failed to load filter values: ${err.message}`, true);
  }
}



function populateFilterKeyOptions() {
  const filterKeySelect = document.getElementById('filter-key');

  // الأعمدة المسموحة فقط (نفس أسماء الأعمدة في قاعدة البيانات)
  const fields = [
    { key: 'circuit_name', label: 'Circle Name' },
    { key: 'isp', label: 'ISP' },
    { key: 'location', label: 'Location' },
    { key: 'ip', label: 'IP Address' },
    { key: 'speed', label: 'Circle Speed' },
    { key: 'start_date', label: 'Start Date' },
    { key: 'end_date', label: 'End Date' }
  ];

  filterKeySelect.innerHTML = '<option value="">Filter by</option>';

  fields.forEach(field => {
    const opt = document.createElement('option');
    opt.value = field.key;
    opt.textContent = field.label;
    filterKeySelect.appendChild(opt);
  });
}




function handleGroupSelect(selectElement) {
  const value = selectElement.value;
  const input = document.getElementById('custom-group-count');

  if (value === 'other') {
    input.classList.remove('hidden'); // يظهر الحقل
    input.focus();                    // يوجه المؤشر فيه
  } else {
    input.classList.add('hidden');   // يخفي الحقل
    runPingGroup(parseInt(value));   // يشغل البنق حسب القيمة
  }
}

function handleEnterKey(event) {
  if (event.key === 'Enter') {
    const val = parseInt(event.target.value, 10);
    if (!isNaN(val) && val > 0) {
      runPingGroup(val); // يشغل البنق بعد ما يكتب ويضغط Enter
    }
  }
}






async function loadMyDevices() {
  try {
    const res = await fetch(`${API_BASE_URL}/entries/mine`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem("token")}`
      }
    });

    const data = await res.json();
    allDevices = [...allDevices, ...data]; // اجمع ولا تعوض
    updateCombinedDeviceView();
  } catch (err) {
    appendToTerminal(`❌ Failed to load your devices: ${err.message}`, true);
  }
}

async function loadSharedDevices() {
  try {
    const res = await fetch(`${API_BASE_URL}/entries/shared-with-me`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem("token")}`
      }
    });

    const data = await res.json();
    allDevices = [...allDevices, ...data]; // اجمع ولا تعوض
    updateCombinedDeviceView();
  } catch (err) {
    appendToTerminal(`❌ Failed to load shared devices: ${err.message}`, true);
  }
}

function updateCombinedDeviceView() {
  // إزالة التكرارات (لو بنفس IP مثلاً)
  const unique = [];
  const seen = new Set();

  allDevices.forEach(device => {
    const key = `${device.ip}-${device.circuit_name}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(device);
    }
  });

  renderDeviceTable(unique);
}



function openSharePopup() {
  const popup = document.getElementById('sharePopup');
  popup.classList.remove('hidden');

  const confirmBtn = document.getElementById('confirmShare');
  confirmBtn.onclick = handleShareConfirm;

  fetch(`${API_BASE_URL}/users`, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem("token")}` }
  })
  .then(res => res.json())
  .then(users => {
    const container = document.getElementById('userCheckboxContainer');
    container.innerHTML = '';

    users.forEach(user => {
      const label = document.createElement('label');
      label.className = 'user-checkbox';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.name = 'shareUsers';
      checkbox.value = user.id;

      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(' ' + user.name));
      container.appendChild(label);
    });
  });
}

function closeSharePopup() {
  document.getElementById('sharePopup').classList.add('hidden');
}

async function handleShareConfirm() {
  const selectedUserIds = Array.from(document.querySelectorAll('input[name="shareUsers"]:checked'))
    .map(cb => cb.value);

  if (!selectedUserIds.length) {
    appendToTerminal('❌ Please select at least one user to share with.', true);
    return;
  }

  const rows = document.querySelectorAll('#device-table-body tr');
  const devices = Array.from(rows).map(row => {
    const cells = row.querySelectorAll('td');
    return {
      circuit: cells[0]?.textContent.trim(),
      isp: cells[1]?.textContent.trim(),
      location: cells[2]?.textContent.trim(),
      ip: cells[3]?.querySelector('.device-ip')?.textContent.trim(),
      speed: cells[4]?.textContent.trim(),
      start_date: cells[5]?.textContent.trim(),
      end_date: cells[6]?.textContent.trim()
    };
  }).filter(dev => isValidIP(dev.ip)); // تأكد أن الـ IP صحيح

  try {
    const res = await fetch(`${API_BASE_URL}/share-entry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({ devices, receiver_ids: selectedUserIds })
    });

    const data = await res.json();
    if (data.success) {
      appendToTerminal('✅ Entries shared successfully.');
      closeSharePopup();
    } else {
      appendToTerminal(`❌ Share error: ${data.error}`, true);
    }
  } catch (err) {
    appendToTerminal(`❌ Share error: ${err.message}`, true);
  }
}

function runPingGroup(count) {
  const rows = document.querySelectorAll('#device-table-body tr');
  const ips = [];

  for (let row of rows) {
    const ip = row.querySelector('.device-ip')?.textContent.trim();
    if (isValidIP(ip)) {
      ips.push(ip);
      if (ips.length === count) break;
    }
  }

  if (!ips.length) {
    appendToTerminal('❌ No valid IPs for group.', true);
    return;
  }

  appendToTerminal(`⏳ Pinging ${ips.length} devices...`);
  runPingForIPs(ips);
}




async function runPingForIPs(ips, rowMap = {}) {
  try {
    const res = await fetch(`${API_BASE_URL}/ping-all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ips })
    });

    const data = await res.json();

    // لو فيه تكرارات، عالج كل صف يحمل نفس IP
    const allRows = document.querySelectorAll('#device-table-body tr');

    data.results.forEach(result => {
      appendToTerminal(`[${result.ip}]`);
      appendToTerminal(result.output, result.status === 'error');

      // 👇 مر على كل الصفوف وعطِ نفس الحالة
      allRows.forEach(row => {
        const ipText = row.querySelector('.device-ip')?.textContent.trim();
        if (ipText === result.ip) {
          updateRowStatus(row, result);
        }
      });
    });

    // 🔴 أي صف ما تم لمسه (بقي رمادي)، نحطه failed
    allRows.forEach(row => {
      const lamp = row.querySelector('.lamp');
      if (lamp && lamp.classList.contains('lamp-gray')) {
        lamp.className = 'lamp lamp-red';
        row.deviceStatus = 'Failed';
      }
    });

    updateStatusCounts();
  } catch (err) {
    appendToTerminal(`❌ Ping error: ${err.message}`, true);
  }
}



const API_BASE_URL = 'http://localhost:3000/api';
let selectedRowId = null;
let continuousPingInterval = null;

document.addEventListener('DOMContentLoaded', () => {
  loadDevicesByOwnership();
  populateFilterKeyOptions();

  document.getElementById('ownership-filter')?.addEventListener('change', async () => {
    await loadDevicesByOwnership();
    filterDevices();
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
  if (!selectedRowId) return appendToTerminal('Please select a device.', true);

  const ipElem = document.querySelector(`.data-cell[data-row-id="${selectedRowId}"] .device-ip`);
  const ip = ipElem?.textContent.trim();

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
    updateRowStatus(selectedRowId, data);
    updateStatusCounts();
  } catch (err) {
    appendToTerminal(`Ping error: ${err.message}`, true);
  }
}



async function tracerouteSelectedDevice() {
  if (!selectedRowId) return appendToTerminal('Please select a device.', true);

  const ipCell = document.querySelector(`.data-cell[data-row-id="${selectedRowId}"].ip-cell`);
  const ip = ipCell?.querySelector('.device-ip')?.textContent.trim();

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
  const ipElems = document.querySelectorAll('.device-ip');
  const ips = Array.from(ipElems)
    .map(el => el.textContent.trim())
    .filter(ip => isValidIP(ip));

  if (!ips.length) {
    appendToTerminal('❌ No valid IPs found.', true);
    return;
  }

  appendToTerminal(`⏳ Pinging ${ips.length} devices...`);
  await runPingForIPs(ips);
}





function startContinuousPing() {
  if (!selectedRowId) return appendToTerminal('Please select a device.', true);

  const ipCell = document.querySelector(`.data-cell[data-row-id="${selectedRowId}"].ip-cell`);
  const ip = ipCell?.querySelector('.device-ip')?.textContent.trim();

  if (!isValidIP(ip)) return appendToTerminal('Invalid IP address.', true);

  if (continuousPingInterval) {
    clearInterval(continuousPingInterval);
    continuousPingInterval = null;
    appendToTerminal('⛔ Stopped continuous ping.');
    return;
  }

  appendToTerminal(`📶 Starting continuous ping to ${ip}...`);
  continuousPingInterval = setInterval(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/ping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip })
      });
      const data = await res.json();
      appendToTerminal(data.error || data.output, !!data.error);
      updateRowStatus(ipCell, data); // تحديث اللمبة بناءً على الخلية مباشرة
      updateStatusCounts();
    } catch (err) {
      appendToTerminal(`Ping error: ${err.message}`, true);
    }
  }, 2000);
}


async function generateReport() {
  const devices = allDevices.map(device => ({
    circuit: device.circuit_name || '',
    isp: device.isp || '',
    location: device.location || '',
    ip: device.ip || '',
    speed: device.speed || '',
    start_date: device.start_date || '',
    end_date: device.end_date || ''
  })).filter(device => isValidIP(device.ip));

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

    appendToTerminal('✅ Report downloaded successfully.');
  } catch (err) {
    appendToTerminal(`❌ Report error: ${err.message}`, true);
  }
}






function updateRowStatus(cellOrRowId, data) {
  let ipCell = null;

  if (typeof cellOrRowId === 'string') {
    ipCell = document.querySelector(`.data-cell[data-row-id="${cellOrRowId}"].ip-cell`);
  } else if (cellOrRowId instanceof Element) {
    ipCell = cellOrRowId;
  }

  const lamp = ipCell?.querySelector('.lamp');
  if (!lamp) return;

  const output = data.output || '';
  const error = data.error || '';

  if (data.status === 'error' || error || output.includes('100% packet loss') || output.includes('Request timed out')) {
    lamp.className = 'lamp lamp-red';
  } else if (output.includes('0% packet loss')) {
    lamp.className = 'lamp lamp-green';
  } else {
    lamp.className = 'lamp lamp-orange';
  }
}





function updateStatusCounts() {
  const lamps = document.querySelectorAll('.lamp');
  let total = 0, active = 0, failed = 0, unstable = 0;

  lamps.forEach(lamp => {
    if (lamp.classList.contains('lamp-green')) {
      active++; total++;
    } else if (lamp.classList.contains('lamp-red')) {
      failed++; total++;
    } else if (lamp.classList.contains('lamp-orange')) {
      unstable++; total++;
    }
  });

  document.getElementById('total-count').textContent = total;
  document.getElementById('active-count').textContent = active;
  document.getElementById('failed-count').textContent = failed;
  document.getElementById('unstable-count').textContent = unstable;
}









let allDevices = [];



function renderColumnLayout(devices) {
  const tableBody = document.getElementById("devices-body");
  tableBody.innerHTML = ""; // تنظيف القديم

  devices.forEach((device, index) => {
    const rowId = `row-${index}`;
    const row = document.createElement("tr");
    row.dataset.rowId = rowId;

    // العمود الأول: الأزرار
    const actionsTd = document.createElement("td");
    actionsTd.innerHTML = `
      <button class="edit-btn" onclick="openEditModal(${JSON.stringify(device).replace(/"/g, '&quot;')})">✏️</button>
      <button class="delete-btn" onclick="deleteDevice('${device.id}', '${device.ip}')">🗑️</button>
    `;
    row.appendChild(actionsTd);

    // باقي الأعمدة
    const values = [
      device.circuit_name || "—",
      device.isp || "—",
      device.location || "—",
      `<span class="status-dot gray"></span> ${device.ip || "—"}`,
      device.speed || "—",
      device.start_date?.split("T")[0] || "—",
      device.end_date?.split("T")[0] || "—"
    ];

    values.forEach(val => {
      const td = document.createElement("td");
      td.innerHTML = val;
      row.appendChild(td);
    });

    tableBody.appendChild(row);
  });
}

function selectDeviceRow(rowId) {
  selectedRowId = rowId;
  selectedRow = null;

  document.querySelectorAll(".data-cell").forEach(cell => {
    if (cell.dataset.rowId === rowId) {
      cell.classList.add("selected-row");
      if (!selectedRow && cell.classList.contains('ip-cell')) {
        selectedRow = cell; // نخزن الـ IP cell عشان تحتوي اللمبة
      }
    } else {
      cell.classList.remove("selected-row");
    }
  });
}
function openEditModal(device) {
  document.getElementById('edit-id').value = device.id;
  document.getElementById('edit-circuit').value = device.circuit_name;
  document.getElementById('edit-isp').value = device.isp;
  document.getElementById('edit-location').value = device.location;
  document.getElementById('edit-ip').value = device.ip;
  document.getElementById('edit-speed').value = device.speed;
  document.getElementById('edit-start').value = device.start_date?.split('T')[0];
  document.getElementById('edit-end').value = device.end_date?.split('T')[0];

  const modal = document.getElementById('editModal');
  modal.classList.add('show');
  modal.classList.remove('hidden');
}

function closeEditModal() {
  const modal = document.getElementById('editModal');
  modal.classList.remove('show');
  modal.classList.add('hidden');
}




async function submitEdit() {
  const id = document.getElementById('edit-id').value;
  const body = {
    circuit: document.getElementById('edit-circuit').value,
    isp: document.getElementById('edit-isp').value,
    location: document.getElementById('edit-location').value,
    ip: document.getElementById('edit-ip').value,
    speed: document.getElementById('edit-speed').value,
    start_date: document.getElementById('edit-start').value,
    end_date: document.getElementById('edit-end').value
  };

  try {
    const res = await fetch(`${API_BASE_URL}/entries/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    if (res.ok) {
      appendToTerminal('✅ Entry updated successfully');
      closeEditModal();
      await loadDevicesByOwnership(); // reload list
    } else {
      throw new Error(data.error);
    }
  } catch (err) {
    appendToTerminal(`❌ Update failed: ${err.message}`, true);
  }
}

async function deleteDevice(id, ip) {
  if (!confirm(`❗ هل تريد حذف الجهاز ذو IP ${ip}؟`)) return;

  try {
    const res = await fetch(`${API_BASE_URL}/entries/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem("token")}`
      }
    });

    const data = await res.json();
    if (res.ok && data.success) {
      appendToTerminal(`✅ تم حذف الجهاز ${ip}`);
      await loadDevicesByOwnership();
    } else {
      throw new Error(data.error || 'Unknown error');
    }
  } catch (err) {
    appendToTerminal(`❌ Delete error: ${err.message}`, true);
  }
}


function filterDevices() {
  const search = document.getElementById('search-input').value.toLowerCase();
  const key = document.getElementById('filter-key').value;
  const value = document.getElementById('filter-value').value;
  const ownership = document.getElementById('ownership-filter').value;

  let filtered = allDevices;

  if (ownership === 'mine') {
    filtered = filtered.filter(device => device.ownership === 'mine');
  } else if (ownership === 'shared') {
    filtered = filtered.filter(device => device.ownership === 'shared');
  }

  if (search) {
    filtered = filtered.filter(device =>
      Object.values(device).some(v =>
        (v || '').toString().toLowerCase().includes(search)
      )
    );
  }

  if (key && value) {
    filtered = filtered.filter(device =>
      (device[key] || '').toString().toLowerCase() === value.toLowerCase()
    );
  }

  renderColumnLayout(filtered);
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
    { key: 'circuit_name', label: 'Circuit Name' },
    { key: 'isp', label: 'ISP' },
    { key: 'location', label: 'Location' },
    { key: 'ip', label: 'IP Address' },
    { key: 'speed', label: 'Circuit Speed' },
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

  renderColumnLayout(unique);
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

  // تأكد من تنسيق الأجهزة قبل الإرسال
  const devicesToShare = allDevices
    .filter(dev => isValidIP(dev.ip))
    .map(dev => ({
      circuit_name: dev.circuit_name || '',
      isp: dev.isp || '',
      location: dev.location || '',
      ip: dev.ip || '',
      speed: dev.speed || '',
      start_date: dev.start_date || '',
      end_date: dev.end_date || ''
    }));

  try {
    const res = await fetch(`${API_BASE_URL}/share-entry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({
        devices: devicesToShare,
        receiver_ids: selectedUserIds
      })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      appendToTerminal('✅ Entries shared successfully.');
      closeSharePopup();
    } else {
      appendToTerminal(`❌ Share error: ${data.error || 'Unknown error'}`, true);
    }
  } catch (err) {
    appendToTerminal(`❌ Share error: ${err.message}`, true);
  }
}



function runPingGroup(count) {
  const ipElems = document.querySelectorAll('.device-ip');
  const ips = [];

  for (let ipElem of ipElems) {
    const ip = ipElem.textContent.trim();
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



async function runPingForIPs(ips) {
  try {
    const res = await fetch(`${API_BASE_URL}/ping-all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ips })
    });

    const data = await res.json();

    data.results.forEach(result => {
      appendToTerminal(`[${result.ip}]`);
      appendToTerminal(result.output, result.status === 'error');

      document.querySelectorAll('.device-ip').forEach(ipElem => {
        if (ipElem.textContent.trim() === result.ip) {
          const cell = ipElem.closest('.data-cell');
          if (cell) updateRowStatus(cell.dataset.rowId, result);
        }
      });
    });

    updateStatusCounts();
  } catch (err) {
    appendToTerminal(`❌ Ping error: ${err.message}`, true);
  }
}




async function loadDevicesByOwnership() {
  const ownership = document.getElementById('ownership-filter')?.value || 'all';
  allDevices = [];

  if (ownership === 'mine' || ownership === 'all') {
    try {
      const res = await fetch(`${API_BASE_URL}/entries/mine`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await res.json();

      if (Array.isArray(data)) {
        const mineDevices = data.map(device => ({ ...device, ownership: 'mine' }));
        allDevices = [...allDevices, ...mineDevices];
      } else {
        appendToTerminal(`❌ Unexpected response for your devices: ${data.error || JSON.stringify(data)}`, true);
      }
    } catch (err) {
      appendToTerminal(`❌ Failed to load your devices: ${err.message}`, true);
    }
  }

  if (ownership === 'shared' || ownership === 'all') {
    try {
      const res = await fetch(`${API_BASE_URL}/entries/shared-with-me`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await res.json();

      if (Array.isArray(data)) {
        const sharedDevices = data.map(device => ({ ...device, ownership: 'shared' }));
        allDevices = [...allDevices, ...sharedDevices];
      } else {
        appendToTerminal(`❌ Unexpected response for shared devices: ${data.error || JSON.stringify(data)}`, true);
      }
    } catch (err) {
      appendToTerminal(`❌ Failed to load shared devices: ${err.message}`, true);
    }
  }

  filterDevices(); // ✅ يعرض حسب الفلتر المختار
}




const API_BASE_URL = 'http://localhost:4000';
let selectedRowId = null;
let continuousPingInterval = null;


document.addEventListener('DOMContentLoaded', async () => {
  // تحميل صلاحيات المستخدم أولًا
  userPermissions = await checkUserPermissions();

  // إظهار زر المشاركة فقط إذا لديه الصلاحية
  if (userPermissions.share_items) {
    document.getElementById("shareBtn").style.display = "inline-block";
  } else {
    document.getElementById("shareBtn").style.display = "none";
  }

  // تحميل البيانات والتهيئة
  await loadDevicesByOwnership();
  populateFilterKeyOptions();
  await fetchAutoPingResults(); // ✅ يعرض النتائج السابقة بعد الدخول


  // أحداث الواجهة
  document.getElementById('ownership-filter')?.addEventListener('change', async () => {
    await loadDevicesByOwnership();
    filterDevices();
  });

  document.getElementById('ping-btn')?.addEventListener('click', pingSelectedDevice);
  document.getElementById('pingall-btn')?.addEventListener('click', pingAllDevices);
  document.getElementById('pingt-btn')?.addEventListener('click', startContinuousPing);
  document.getElementById('pingt-auto-btn')?.addEventListener('click', startAutoPing);
  document.getElementById('traceroute-btn')?.addEventListener('click', tracerouteSelectedDevice);
  document.getElementById('report-btn')?.addEventListener('click', generateReport);
  document.getElementById('saveBtn')?.addEventListener('click', saveAllIPs);
  document.getElementById('search-input')?.addEventListener('input', filterDevices);
  document.getElementById('filter-key')?.addEventListener('change', populateFilterValues);
  document.getElementById('filter-value')?.addEventListener('change', filterDevices);
  document.getElementById('shareBtn')?.addEventListener('click', openSharePopup);

 

  // ** هذا هو الجزء الذي يجب أن يتم ربطه بالزر الموجود بالفعل في HTML **
  // ** تأكد من إزالة أي كود آخر يحاول إنشاء زر "show-reports-btn" جديد **
  const showReportsBtn = document.getElementById('show-reports-btn');
  if(showReportsBtn) {
      showReportsBtn.addEventListener('click', showReports);
  }

  // Check if auto ping was active before page reload


  // Add event listeners for the new duration selection buttons
  const confirmModalBtn = document.getElementById('modal-confirm-duration-btn');
  const cancelModalBtn = document.getElementById('modal-cancel-duration-btn');

  if(confirmModalBtn) confirmModalBtn.addEventListener('click', handleConfirmDuration);
  if(cancelModalBtn) cancelModalBtn.addEventListener('click', handleCancelDuration);
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
  if (!selectedRowId) return appendToTerminal('❌ Please select a device.', true);

  const ipCell = document.querySelector(`tr[data-row-id="${selectedRowId}"] .device-ip`);
  const ip = ipCell?.textContent.trim();

  if (!isValidIP(ip)) return appendToTerminal('❌ Invalid IP address.', true);

  appendToTerminal(`📡 Pinging ${ip}...`);
  try {
    const res = await fetch(`${API_BASE_URL}/ping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip })
    });
    const data = await res.json();
    appendToTerminal(data.output || data.error, !!data.error);
    updateRowStatus(ipCell.closest('td'), data);
    updateStatusCounts();
  } catch (err) {
    appendToTerminal(`❌ Ping error: ${err.message}`, true);
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

let pingTActive = false;

function startContinuousPing() {
  if (!selectedRowId) {
    appendToTerminal('Please select a device.', true);
    return;
  }

  const ipCell = document.querySelector(`.data-cell[data-row-id="${selectedRowId}"].ip-cell`);
  const ip = ipCell?.querySelector('.device-ip')?.textContent.trim();

  if (!isValidIP(ip)) {
    appendToTerminal('❌ Invalid IP address.', true);
    return;
  }

  if (continuousPingInterval) {
    clearInterval(continuousPingInterval);
    continuousPingInterval = null;
    pingTActive = false;
    appendToTerminal('Ping -t stopped.');
    return;
  }

  pingTActive = true;
  appendToTerminal(`Starting Ping -t to ${ip}...`);

  continuousPingInterval = setInterval(async () => {
    if (!pingTActive) return;

    try {
      const response = await fetch(`${API_BASE_URL}/ping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip })
      });

      const data = await response.json();
      const outputLine = (data.output || '').split('\n').find(line => line.includes('time='));

      if (!pingTActive) return; // double check

      if (outputLine) {
        const match = outputLine.match(/time[=<](\d+\.?\d*)\s*ms/i);
        const latency = match ? parseFloat(match[1]) : null;

        let color = '#2ecc71';
        if (latency > 150) color = '#e74c3c';
        else if (latency > 50) color = '#f1c40f';

        const div = document.createElement('div');
        div.textContent = `↪ ${outputLine.trim()} (${latency} ms)`;
        div.style.color = color;

        const terminal = document.getElementById('terminal-output');
        terminal.appendChild(div);
        terminal.scrollTop = terminal.scrollHeight;
      } else {
        appendToTerminal(data.output || 'No response.', true);
      }

      updateRowStatus(ipCell, data);
      updateStatusCounts();
    } catch (err) {
      if (pingTActive) {
        appendToTerminal(`❌ Ping error: ${err.message}`, true);
      }
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
    start_date: formatReportDate(device.start_date),
    end_date: formatReportDate(device.end_date)
  })).filter(device => isValidIP(device.ip));

  if (devices.length === 0) {
    appendToTerminal('❌ No valid devices to include in the report.', true);
    return;
  }

  appendToTerminal(`🚀 Running ping tests on ${devices.length} devices...`);

  const results = [];

  for (let d of devices) {
    try {
      const response = await fetch(`${API_BASE_URL}/ping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: d.ip })
      });

      const data = await response.json();
      const output = data.output || '';
      const latency = extractLatency(output);
      const packetLoss = extractPacketLoss(output);
      const timeouts = extractTimeouts(output);

      let status = 'active';
      if (data.error || output.includes("100% packet loss") || timeouts > 0) {
        status = 'failed';
      } else if (packetLoss > 0 || latency > 50) {
        status = 'unstable';
      }

      results.push({
        ...d,
        latency,
        packetLoss,
        timeouts,
        status,
        output
      });

    } catch (err) {
      results.push({
        ...d,
        latency: 0,
        packetLoss: 100,
        timeouts: 4,
        status: 'failed',
        output: err.message
      });
    }
  }

  try {
    const payload = {
      devices: results
    };

    const res = await fetch(`${API_BASE_URL}/reports/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.success) {
      appendToTerminal(`✅ Report saved (ID: ${data.report_id})`);
    } else {
      appendToTerminal(`❌ Failed to save report: ${data.error || 'Unknown error'}`, true);
    }
  } catch (err) {
    appendToTerminal(`❌ Report error: ${err.message}`, true);
  }
}

// Helper functions for extracting metrics from ping output
function extractLatency(output = '') {
  const match = output.match(/time[=<](\d+\.?\d*)\s*ms/i);
  return match ? parseFloat(match[1]) : 0;
}

function extractPacketLoss(output = '') {
  const match = output.match(/(\d+)%\s*packet loss/i);
  return match ? parseFloat(match[1]) : 0;
}

function extractTimeouts(output = '') {
  const timeoutMatches = output.match(/Request timed out/gi) || [];
  return timeoutMatches.length;
}

// Helper function to format dates to YYYY-MM-DD
function formatReportDate(dateStr) {
  if (!dateStr) return null; // Use null for empty dates
  try {
    const date = new Date(dateStr);
    if (isNaN(date)) return null;
    // Get UTC date components to avoid timezone issues
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return null;
  }
}

function updateRowStatus(cellOrRowId, data) {
  let ipCell = null;

  if (typeof cellOrRowId === 'string') {
    ipCell = document.querySelector(`tr[data-row-id="${cellOrRowId}"] .ip-cell`);
  } else if (cellOrRowId instanceof Element) {
    ipCell = cellOrRowId.closest('.ip-cell');
  }

  const lamp = ipCell?.querySelector('.status-dot');
  if (!lamp) return;

  const output = data.output || '';
  const error = data.error || '';

  if (error || output.includes('100% packet loss') || output.includes('Request timed out')) {
    lamp.className = 'status-dot red';
  } else if (output.includes('0% packet loss')) {
    lamp.className = 'status-dot green';
  } else {
    lamp.className = 'status-dot yellow';
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

    // ✅ عند الضغط على الصف، يتم اختياره
    row.addEventListener("click", () => {
      selectedRowId = rowId;
      document.querySelectorAll("tr").forEach(r => r.classList.remove("selected-row"));
      row.classList.add("selected-row");
    });

    // أزرار التعديل والحذف
    const actionsTd = document.createElement("td");
    let actionsHTML = "";

    if (userPermissions.edit_items) {
      actionsHTML += `<button class="edit-btn" onclick="openEditModal(${JSON.stringify(device).replace(/"/g, '&quot;')})">✏️</button>`;
    }
    if (userPermissions.delete_items) {
      actionsHTML += `<button class="delete-btn" onclick="deleteDevice('${device.id}', '${device.ip}')">🗑️</button>`;
    }
    actionsTd.innerHTML = actionsHTML;
    row.appendChild(actionsTd);

    // الأعمدة المتبقية
    const values = [
      device.circuit_name || "—",
      device.isp || "—",
      device.location || "—",
      device.ip || "—",
      device.speed || "—",
      device.start_date?.split("T")[0] || "—",
      device.end_date?.split("T")[0] || "—"
    ];

    values.forEach((val, colIndex) => {
      const td = document.createElement("td");

      // ✅ IP cell مع لمبة وكلاسات
      if (colIndex === 3) {
        td.classList.add("data-cell", "ip-cell");
        td.dataset.rowId = rowId;
        td.innerHTML = `<span class="status-dot gray lamp"></span> <span class="device-ip">${val}</span>`;
      } else {
        td.textContent = val;
      }

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

t = (key, fallback = '') => languageManager.translations[languageManager.currentLang]?.[key] || fallback || key;

async function populateFilterValues() {
  const key = document.getElementById('filter-key').value;
  const valueSelect = document.getElementById('filter-value');
  valueSelect.innerHTML = `<option value="">${t('select_value')}</option>`;

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
    appendToTerminal(`❌ ${t('failed_to_load_filter_values')}: ${err.message}`, true);
  }
}

function populateFilterKeyOptions() {
  const filterKeySelect = document.getElementById('filter-key');

  // الأعمدة المسموحة فقط مع مفاتيح ترجمة
  const fields = [
    { key: 'circuit_name', label: t('circuit_name') },
    { key: 'isp', label: t('isp') },
    { key: 'location', label: t('location') },
    { key: 'ip', label: t('ip_address') },
    { key: 'speed', label: t('circuit_speed') },
    { key: 'start_date', label: t('start_date') },
    { key: 'end_date', label: t('end_date') }
  ];


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

// دالة فلترة أسماء المستخدمين حسب اللغة
function filterEngineerNameByLang(text, lang) {
  if (!text || typeof text !== 'string') return text;
  return text.replace(/([A-Za-z\s]+)\|([\u0600-\u06FF\s]+)/g, (match, en, ar, offset, string) => {
    const name = lang === 'ar' ? ar.trim() : en.trim();
    
    // التحقق من المسافة قبل الاسم
    const before = string.slice(0, offset);
    let result = name;
    
    if (before.length > 0 && !before.endsWith(' ')) {
      result = ' ' + name;
    }
    
    // التحقق من المسافة بعد الاسم
    const after = string.slice(offset + match.length);
    if (after.length > 0 && !after.startsWith(' ') && !after.startsWith('،') && !after.startsWith('.') && !after.startsWith('!') && !after.startsWith('?')) {
      result = result + ' ';
    }
    
    return result;
  });
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

      // الحصول على اللغة الحالية
      const currentLang = localStorage.getItem('language') || 'en';

      users.forEach(user => {
        const label = document.createElement('label');
        label.className = 'user-checkbox';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'shareUsers';
        checkbox.value = user.id;

        // فلترة اسم المستخدم حسب اللغة
        const filteredName = filterEngineerNameByLang(user.name, currentLang);

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(' ' + filteredName));
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

async function checkUserPermissions(userId) {
  if (!userId) {
    userId = localStorage.getItem("userId");
  }

  const userRole = localStorage.getItem("userRole"); // ← نجيب الدور من التخزين المحلي

  // ✅ لو أدمن، نرجع كل الصلاحيات مفتوحة
  if (userRole === "admin") {
    return {
      device_access: "all",
      view_access: true,
      full_access: true,
      add_items: true,
      edit_items: true,
      delete_items: true,
      check_logs: true,
      edit_permission: true,
      share_items: true
    };
  }

  // ✅ باقي المستخدمين (عاديين) نجيب صلاحياتهم من السيرفر
  try {
    const response = await fetch(`http://localhost:4000/users/${userId}/with-permissions`);
    if (!response.ok) throw new Error('Failed to fetch user permissions');

    const userData = await response.json();
    return {
      device_access: userData.permissions?.device_access || 'none',
      view_access: userData.permissions?.view_access || false,
      full_access: userData.permissions?.full_access || false,
      add_items: userData.permissions?.add_items || false,
      edit_items: userData.permissions?.edit_items || false,
      delete_items: userData.permissions?.delete_items || false,
      check_logs: userData.permissions?.check_logs || false,
      edit_permission: userData.permissions?.edit_permission || false,
      share_items: userData.permissions?.share_items || false
    };
  } catch (error) {
    console.error('Error checking permissions:', error);
    return {
      device_access: 'none',
      view_access: false,
      full_access: false
    };
  }
}

document.getElementById('excel-upload').addEventListener('change', handleExcelUpload);

async function handleExcelUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function (e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    const newDevices = rows.map(row => ({
      circuit_name: row['Circuit Name'] || '',
      isp: row['ISP'] || '',
      location: row['Location'] || '',
      ip: row['IP Address'] || '',
      speed: row['Speed'] || '',
      start_date: formatInputDate(row['Start Date']),
      end_date: formatInputDate(row['End Date'])
    }));

    // إرسال البيانات إلى السيرفر
    try {
      const res = await fetch(`${API_BASE_URL}/entries/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ devices: newDevices })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Upload failed');
      appendToTerminal(`✅ تم حفظ ${result.saved} جهاز`);
      if (result.skipped > 0) {
        appendToTerminal(`🔁 تم تجاهل ${result.skipped} جهاز مكرر`);
      }

      await loadDevicesByOwnership(); // إعادة تحميل البيانات من القاعدة
    } catch (err) {
      appendToTerminal(`❌ Upload error: ${err.message}`, true);
    }
  };

  reader.readAsArrayBuffer(file);
}

function formatInputDate(dateStr) {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
}

function startAutoPing() {
  let ips = [];
  
  // Check if a device is selected
  if (selectedRowId) {
    const ipCell = document.querySelector(`tr[data-row-id="${selectedRowId}"] .device-ip`);
    const ip = ipCell?.textContent.trim();
    if (isValidIP(ip)) {
      ips = [ip];
    }
  } else {
    // If no device is selected, get all IPs
    ips = Array.from(document.querySelectorAll('.device-ip'))
      .map(el => el.textContent.trim())
      .filter(ip => isValidIP(ip));
  }

  if (!ips.length) {
    appendToTerminal('❌ No valid IPs found.', true);
    return;
  }



  // ** Show duration selection section **
  document.getElementById('autoPingDurationModal').classList.remove('hidden');

  // ** The actual ping logic will be moved to a new function triggered by the confirm button **
}

function handleConfirmDuration() {
  const durationInput = document.getElementById('auto-ping-duration-hours');
  const hours = parseInt(durationInput.value);

  if (isNaN(hours) || hours < 1 || hours > 24) {
    appendToTerminal('❌ Invalid duration selected. Please enter between 1 to 24 hours.', true);
    document.getElementById('autoPingDurationModal').classList.add('hidden');
    return;
  }

  // إخفاء المودال
  document.getElementById('autoPingDurationModal').classList.add('hidden');

  let ips = [];

  if (selectedRowId) {
    const ipCell = document.querySelector(`tr[data-row-id="${selectedRowId}"] .device-ip`);
    const ip = ipCell?.textContent.trim();
    if (isValidIP(ip)) {
      ips = [ip];
    }
  } else {
    ips = Array.from(document.querySelectorAll('.device-ip'))
      .map(el => el.textContent.trim())
      .filter(ip => isValidIP(ip));
  }

  if (!ips.length) {
    appendToTerminal('❌ No valid IPs found.', true);
    return;
  }

  // إرسال الطلب للسيرفر
  fetch(`${API_BASE_URL}/auto-ping/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem("token")}`
    },
    body: JSON.stringify({
      ips,
      duration_hours: hours
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      appendToTerminal(`✅ Auto Ping started for ${ips.length} IPs for ${hours} hour(s).`);
    } else {
      appendToTerminal(`❌ Failed to start auto ping: ${data.error || 'Unknown error'}`, true);
    }
  })
  .catch(err => {
    appendToTerminal(`❌ Error starting auto ping: ${err.message}`, true);
  });
}




// ** New function to handle canceling duration selection **
function handleCancelDuration() {
  document.getElementById('autoPingDurationModal').classList.add('hidden');
  appendToTerminal('Auto Ping duration selection cancelled.');
}







function getConnectionStatus(status, latency, packetLoss) {
  if (status === 'failed' || packetLoss === 100) return 'Disconnected';
  if (packetLoss > 0) return 'Unstable';
  if (latency > 150) return 'High Latency';
  if (latency > 50) return 'Medium Latency';
  return 'Good';
}

function getDetailedStatus(result) {
  let details = [];
  
  if (result.status === 'failed') {
    details.push('Device not responding');
  }
  
  if (result.packetLoss !== '0%') {
    details.push(`Packet loss: ${result.packetLoss}`);
  }
  
  if (result.timeouts !== '0') {
    details.push(`${result.timeouts} timeouts occurred`);
  }
  
  if (result.latency > 150) {
    details.push('High latency detected');
  } else if (result.latency > 50) {
    details.push('Medium latency detected');
  }
  
  return details.join(', ') || 'Connection stable';
}

// Add event listener for the "Show Reports" button
document.addEventListener('DOMContentLoaded', () => {
    const showReportsBtn = document.getElementById('show-reports-btn');
    if (showReportsBtn) {
        showReportsBtn.addEventListener('click', () => {
            // Navigate to the reports page
            window.location.href = 'reports.html';
        });
    }
});


async function fetchAutoPingResults() {
  try {
    const res = await fetch(`${API_BASE_URL}/auto-ping/results`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });

    const data = await res.json();

    // تحقق أن الرد عبارة عن مصفوفة
    if (!Array.isArray(data)) {
      const errorMessage = data?.error || '❌ Unexpected server response.';
      appendToTerminal(errorMessage, true);
      return;
    }

    data.forEach(result => {
      const div = document.createElement('div');
      div.textContent = `↪ ${result.ip} - ${result.status} (${result.latency}ms, ${result.packetLoss}% loss)`;
      div.style.color =
        result.status === 'failed' ? '#e74c3c' :
        result.status === 'unstable' ? '#f1c40f' : '#2ecc71';
      document.getElementById('terminal-output').appendChild(div);
    });

  } catch (err) {
    appendToTerminal(`❌ Auto ping result error: ${err.message}`, true);
  }
}



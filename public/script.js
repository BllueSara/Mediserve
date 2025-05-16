function handleSelection(type) {
  if (type === "new") {
    window.location.href = "diagnostic.html";
  } else if (type === "existing") {
    window.location.href = "saved.html";
  }
}








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

  const circuits = Array.from(form.querySelectorAll('input[name="Circuit[]"]')).map(i => i.value.trim());
  const isps = Array.from(form.querySelectorAll('input[name="ISP[]"]')).map(i => i.value.trim());
  const locations = Array.from(form.querySelectorAll('input[name="Location[]"]')).map(i => i.value.trim());
  const ips = Array.from(form.querySelectorAll('input[name="ip[]"]')).map(i => i.value.trim());
  const speeds = Array.from(form.querySelectorAll('input[name="speed[]"]')).map(i => i.value.trim());
  const startDates = Array.from(form.querySelectorAll('input[name="start[]"]')).map(i => i.value);
  const endDates = Array.from(form.querySelectorAll('input[name="end[]"]')).map(i => i.value);

  const devices = [];

  for (let i = 0; i < ips.length; i++) {
    const row = {
      circuit: circuits[i],
      isp: isps[i],
      location: locations[i],
      ip: ips[i],
      speed: speeds[i],
      start_date: startDates[i],
      end_date: endDates[i]
    };

    // تحقق أن كل الحقول فيها بيانات صالحة
    const isValid = Object.values(row).every(val => val !== undefined && val !== null && val !== '');
    if (isValid) devices.push(row);
  }

  if (!devices.length) {
    appendToTerminal("❌ No valid rows to include in the report.", true);
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({ devices })
    });

    if (!response.ok) {
      const err = await response.json();
      appendToTerminal(`❌ Report error: ${err.error}`, true);
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'network_report.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    appendToTerminal('✅ Report downloaded successfully.');
  } catch (error) {
    appendToTerminal(`❌ Report error: ${error.message}`, true);
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

  const circuits = Array.from(form.querySelectorAll('input[name="Circuit[]"]')).map(i => i.value.trim());
  const isps = Array.from(form.querySelectorAll('input[name="ISP[]"]')).map(i => i.value.trim());
  const locations = Array.from(form.querySelectorAll('input[name="Location[]"]')).map(i => i.value.trim());
  const ips = Array.from(form.querySelectorAll('input[name="ip[]"]')).map(i => i.value.trim());
  const speeds = Array.from(form.querySelectorAll('input[name="speed[]"]')).map(i => i.value.trim());
  const startDates = Array.from(form.querySelectorAll('input[name="start[]"]')).map(i => i.value);
  const endDates = Array.from(form.querySelectorAll('input[name="end[]"]')).map(i => i.value);

  const devices = [];
  let hasError = false;

  for (let i = 0; i < ips.length; i++) {
    const row = {
      circuit: circuits[i],
      isp: isps[i],
      location: locations[i],
      ip: ips[i],
      speed: speeds[i],
      start_date: startDates[i],
      end_date: endDates[i]
    };

    const hasAnyValue = Object.values(row).some(val => val);

    if (hasAnyValue) {
      const isComplete = Object.values(row).every(val => val);
      if (!isComplete) {
        highlightMissingFieldsSmart(i, row);
        hasError = true;
      } else {
        devices.push(row);
      }
    }
  }

  if (hasError) {
    appendToTerminal('', true);
    return;
  }

  if (!devices.length) {
    showCenterAlert('Please fill in at least one row before saving.');
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({ devices })
    });

    const data = await res.json();
    if (data.success) {
      appendToTerminal(`✅ Saved ${devices.length} devices to database.`);
    } else {
      appendToTerminal(data.error || '❌ Save failed.', true);
    }
  } catch (err) {
    appendToTerminal(`❌ Save error: ${err.message}`, true);
  }
}



function highlightMissingFieldsSmart(index, rowData) {
  const nameMap = {
    circuit: "Circuit",
    isp: "ISP",
    location: "Location",
    ip: "ip",
    speed: "speed",

  };

  Object.entries(rowData).forEach(([key, value]) => {
    const inputName = nameMap[key];
    const inputs = document.querySelectorAll(`input[name="${inputName}[]"]`);
    const input = inputs[index];
    if (input) {
      const isEmpty = !value || value.trim() === '';
      if (isEmpty) {
        input.style.border = '2px solid red';
        input.classList.add("error-input");
      } else {
        input.style.border = '';
        input.classList.remove("error-input");
      }
    }
  });
}


function showCenterAlert(message) {
  const alert = document.getElementById('center-alert');
  alert.textContent = message;
  alert.classList.remove('hidden');

  setTimeout(() => {
    alert.classList.add('hidden');
  }, 3000);
}







document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('ping-btn')?.addEventListener('click', pingSelectedIP);
  document.getElementById('pingall-btn')?.addEventListener('click', pingAllIPs);
  document.getElementById('pingt-btn')?.addEventListener('click', startContinuousPing);
  document.getElementById('report-btn')?.addEventListener('click', generateReport);
  document.getElementById('traceroute-btn')?.addEventListener('click', tracerouteSelectedIP);
  document.getElementById('saveBtn')?.addEventListener('click', saveAllIPs);
  document.getElementById('shareBtn')?.addEventListener('click', openSharePopup);
  document.getElementById('confirmShare')?.addEventListener('click', handleShareConfirm);
});




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


let currentIndex = document.querySelectorAll('.ip-input').length;


function addRow() {
  const circuitGroup = document.getElementById('circuit-group');
  const ispGroup = document.getElementById('isp-group');
  const locationGroup = document.getElementById('location-group');
  const ipGroup = document.getElementById('ip-group');
  const speedGroup = document.getElementById('speed-group');
  const startGroup = document.getElementById('start-group');
  const endGroup = document.getElementById('end-group');

  // أنشئ الحقول
  const circuitInput = document.createElement('input');
  circuitInput.name = 'Circuit[]';
  circuitInput.placeholder = 'Enter Circuit Name';

  const ispInput = document.createElement('input');
  ispInput.name = 'ISP[]';
  ispInput.placeholder = 'STC / MOBILY / ZAIN';

  const locationInput = document.createElement('input');
  locationInput.name = 'Location[]';
  locationInput.placeholder = 'Enter Location';

  const ipWrapper = document.createElement('div');
  ipWrapper.className = 'input-row';
  const dot = document.createElement('span');
  dot.className = `dot status-dot gray`;
  dot.id = `ip-dot-${currentIndex}`;
  const ipInput = document.createElement('input');
  ipInput.name = 'ip[]';
  ipInput.className = 'ip-input';
  ipInput.setAttribute('data-index', currentIndex);
  ipInput.placeholder = `192.168.1.${currentIndex + 1}`;
  ipWrapper.appendChild(dot);
  ipWrapper.appendChild(ipInput);

  const speedInput = document.createElement('input');
  speedInput.name = 'speed[]';
  speedInput.placeholder = 'Enter Circuit Speed';

  const startInput = document.createElement('input');
  startInput.name = 'start[]';
  startInput.type = 'date';

  const endInput = document.createElement('input');
  endInput.name = 'end[]';
  endInput.type = 'date';

  // ضيفهم إلى الصفحات
  circuitGroup.appendChild(circuitInput);
  ispGroup.appendChild(ispInput);
  locationGroup.appendChild(locationInput);
  ipGroup.appendChild(ipWrapper);
  speedGroup.appendChild(speedInput);
  startGroup.appendChild(startInput);
  endGroup.appendChild(endInput);

  // احفظهم مباشرة بعد ثانية (أو بعد إدخال المستخدم لو حبيت)
  setTimeout(() => {
    const entry = {
      circuit: circuitInput.value,
      isp: ispInput.value,
      location: locationInput.value,
      ip: ipInput.value,
      speed: speedInput.value,
      start_date: startInput.value,
      end_date: endInput.value
    };

    // تحقق فيه قيمة واحدة على الأقل
    const hasAny = Object.values(entry).some(val => val?.trim?.());
    if (hasAny) {
      fetch(`${API_BASE_URL}/add-entry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(entry)
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) appendToTerminal(`✅ Row added to DB for ${entry.ip}`);
          else appendToTerminal(data.error || '❌ Failed to auto-save row.', true);
        })
        .catch(err => appendToTerminal(`❌ Auto-save error: ${err.message}`, true));
    }
  }, 1500); // تأخير خفيف عشان المستخدم يمديه يدخل بيانات
  currentIndex++;
}







function handleGroupPingSelection(value) {
  if (value === 'Other') {
    const customInput = prompt("🔧 Enter number of devices to ping:");
    const count = parseInt(customInput);
    if (!isNaN(count) && count > 0) {
      runPingGroup(count);
    } else {
      alert('❌ Please enter a valid number.');
    }
  } else {
    const count = parseInt(value);
    if (!isNaN(count)) {
      runPingGroup(count);
    }
  }
}

function runPingGroup(count) {
  const inputs = document.querySelectorAll('.ip-input');
  const validIPs = [];

  for (let input of inputs) {
    const ip = input.value.trim();
    if (isValidIP(ip)) {
      validIPs.push(ip);
      if (validIPs.length === count) break;
    }
  }

  if (validIPs.length === 0) {
    appendToTerminal('❌ No valid IPs found.', true);
    return;
  }

  fetch(`${API_BASE_URL}/ping-all`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ips: validIPs })
  })
    .then(res => res.json())
    .then(data => {
      data.results.forEach(result => {
        appendToTerminal(`[${result.ip}]`);
        appendToTerminal(result.output, result.status === 'error');

        const index = Array.from(inputs).findIndex(i => i.value.trim() === result.ip);
        if (index !== -1) {
          const dot = document.getElementById(`ip-dot-${index}`);
          if (result.status === 'error') updateStatusDot(dot, 'error');
          else if (result.output.includes('0% packet loss')) updateStatusDot(dot, 'success');
          else updateStatusDot(dot, 'warning');
        }
      });
      updateStatusCounts();
    })
    .catch(err => appendToTerminal(`Ping group error: ${err.message}`, true));
}



function openSharePopup() {
  const popup = document.getElementById('sharePopup');
  popup.classList.remove('hidden');

  // إعادة الربط بشكل صريح
  const confirmBtn = document.getElementById('confirmShare');
  confirmBtn.onclick = handleShareConfirm;

  fetch(`${API_BASE_URL}/users`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem("token")}`
    }
  })
  .then(res => res.json())
  .then(users => {
    if (!Array.isArray(users)) {
        appendToTerminal('❌ Failed to load users.', true);
      return;
    }

    const container = document.getElementById('userCheckboxContainer');
    container.innerHTML = '';

    users.forEach(user => {
      const label = document.createElement('label');
        label.className = 'user-checkbox'; // <-- استخدم كلاس بدل inline CSS
      

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.name = 'shareUsers';
      checkbox.value = user.id;

      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(' ' + user.name));
      container.appendChild(label);
    });

    })
}



function closeSharePopup() {
  const popup = document.getElementById('sharePopup');
  popup.classList.add('hidden');
}




async function handleShareConfirm() {
  const selectedUserIds = Array.from(document.querySelectorAll('input[name="shareUsers"]:checked'))
  
    .map(cb => cb.value);

    if (!selectedUserIds.length) {
    appendToTerminal('❌ Please select at least one user to share with.', true);
      return;
    }

  const form = document.getElementById('deviceForm');

  const circuits = [...form.querySelectorAll('input[name="Circuit[]"]')].map(i => i.value.trim());
  const isps = [...form.querySelectorAll('input[name="ISP[]"]')].map(i => i.value.trim());
  const locations = [...form.querySelectorAll('input[name="Location[]"]')].map(i => i.value.trim());
  const ips = [...form.querySelectorAll('input[name="ip[]"]')].map(i => i.value.trim());
  const speeds = [...form.querySelectorAll('input[name="speed[]"]')].map(i => i.value.trim());
  const startDates = [...form.querySelectorAll('input[name="start[]"]')].map(i => i.value);
  const endDates = [...form.querySelectorAll('input[name="end[]"]')].map(i => i.value);

  const devices = [];

for (let i = 0; i < ips.length; i++) {
  const row = {
    circuit: circuits[i],
    isp: isps[i],
    location: locations[i],
    ip: ips[i],
    speed: speeds[i],
    start_date: startDates[i],
    end_date: endDates[i]
  };
    if (Object.values(row).every(val => val?.trim?.())) devices.push(row);
}

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
}



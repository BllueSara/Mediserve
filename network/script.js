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

// Stores interval IDs for fetching results, keyed by IP address
let fetchResultsIntervals = {}; 
// Stores client-side state of active persistent pings, keyed by IP address
let activePersistentPingsClient = {}; 
// Index for determining which IP the "Ping -t" button currently targets
// Using a more distinct name to avoid confusion with other local 'pingTIndex' variables if any.
let pingTIndexGlobal = 0; 


async function fetchAndDisplayPersistentPingResults(ipAddress) {
  if (!ipAddress || !isValidIP(ipAddress)) {
    // appendToTerminal(`Cannot fetch results: Invalid IP ${ipAddress}`, true); // Silent return is okay
    return;
  }
  
  const token = localStorage.getItem("token");
  if (!token) {
    // appendToTerminal(`Cannot fetch results for ${ipAddress}: No token.`, true); // Silent is okay
    // Critical: If no token, stop trying to fetch for this IP.
    if (fetchResultsIntervals[ipAddress]) {
        clearInterval(fetchResultsIntervals[ipAddress]);
        delete fetchResultsIntervals[ipAddress];
    }
    activePersistentPingsClient[ipAddress] = false;
    const currentSelectedIp = getCurrentSelectedIpForPingT();
    if (currentSelectedIp === ipAddress) {
        updatePingTButtonText(false);
    }
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/ping-t/results?ip=${ipAddress}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      // appendToTerminal(`Error fetching results for ${ipAddress}: ${errorData.error || response.statusText}`, true);
      // If token is invalid or IP not found for persistent ping, stop interval.
      if (response.status === 401 || response.status === 403 || response.status === 404) {
        if (fetchResultsIntervals[ipAddress]) {
          clearInterval(fetchResultsIntervals[ipAddress]);
          delete fetchResultsIntervals[ipAddress];
        }
        activePersistentPingsClient[ipAddress] = false;
        const currentSelectedIp = getCurrentSelectedIpForPingT();
        if (currentSelectedIp === ipAddress) {
            updatePingTButtonText(false);
        }
      }
      return;
    }

    const results = await response.json();
    if (!results || results.length === 0) {
      // appendToTerminal(`No new results for ${ipAddress}.`, false); // Can be silent
      return;
    }

    appendToTerminal(`--- Results for ${ipAddress} at ${new Date().toLocaleTimeString()} ---`);
    results.forEach(result => {
      const latency = result.latency;
      let statusColor = '#2ecc71'; // green for success
      let displayText = `IP: ${result.ip}, Status: ${result.status}`;

      if (result.status === 'failed') {
        statusColor = '#e74c3c'; // red
        displayText += `, Output: ${result.output ? result.output.split('\n')[0] : 'N/A'}`;
      } else if (result.status === 'unstable') {
        statusColor = '#f1c40f'; // yellow
        displayText += `, Latency: ${latency || 'N/A'}ms, Loss: ${result.packetLoss || 0}%`;
      } else { // active
         displayText += `, Latency: ${latency || 'N/A'}ms, Loss: ${result.packetLoss || 0}%`;
      }
      
      const div = document.createElement('div');
      div.textContent = displayText;
      div.style.color = statusColor;
      const terminal = document.getElementById('terminal-output');
      terminal.appendChild(div);
      terminal.scrollTop = terminal.scrollHeight;
    });

  } catch (err) {
    // appendToTerminal(`Error fetching results for ${ipAddress}: ${err.message}`, true); // Can be silent
    // Potentially stop interval on network errors too, to prevent spam.
    if (fetchResultsIntervals[ipAddress]) {
        clearInterval(fetchResultsIntervals[ipAddress]);
        delete fetchResultsIntervals[ipAddress];
    }
    activePersistentPingsClient[ipAddress] = false;
    const currentSelectedIp = getCurrentSelectedIpForPingT();
    if (currentSelectedIp === ipAddress) {
        updatePingTButtonText(false);
    }
  }
}

function getCurrentSelectedIpForPingT() {
  const inputs = document.querySelectorAll('.ip-input');
  const validIPs = Array.from(inputs)
    .map(input => input.value.trim())
    .filter(ip => isValidIP(ip));

  if (validIPs.length === 0) {
    return null;
  }
  // Use the global pingTIndexGlobal
  pingTIndexGlobal = parseInt(localStorage.getItem("pingTIndexGlobal")) || 0;
  return validIPs[pingTIndexGlobal % validIPs.length];
}

function updatePingTButtonText(isPinging) {
    const pingTButton = document.getElementById('pingt-btn');
    if (pingTButton) {
        pingTButton.textContent = isPinging ? 'Stop Persistent Ping' : 'Start Persistent Ping';
    }
}

async function startContinuousPing() { // This function is now for Persistent Ping
  const currentIpToPing = getCurrentSelectedIpForPingT();

  if (!currentIpToPing) {
    appendToTerminal('No valid IP selected for Persistent Ping.', true);
    return;
  }

  const token = localStorage.getItem("token");
  if (!token) {
    appendToTerminal('Authentication token not found. Please log in.', true);
    return;
  }

  if (activePersistentPingsClient[currentIpToPing]) {
    // Action: Stop persistent ping
    appendToTerminal(`Attempting to stop persistent ping for ${currentIpToPing}...`);
    try {
      const response = await fetch(`${API_BASE_URL}/ping-t/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ip: currentIpToPing })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        appendToTerminal(`Persistent ping stopped for ${currentIpToPing}.`);
        if (fetchResultsIntervals[currentIpToPing]) {
          clearInterval(fetchResultsIntervals[currentIpToPing]);
          delete fetchResultsIntervals[currentIpToPing];
        }
        activePersistentPingsClient[currentIpToPing] = false;
        updatePingTButtonText(false);
      } else {
        appendToTerminal(`Failed to stop persistent ping for ${currentIpToPing}: ${data.error || 'Unknown error'}`, true);
      }
    } catch (err) {
      appendToTerminal(`Error stopping persistent ping for ${currentIpToPing}: ${err.message}`, true);
    }
  } else {
    // Action: Start persistent ping
    appendToTerminal(`Attempting to start persistent ping for ${currentIpToPing}...`);
    try {
      const response = await fetch(`${API_BASE_URL}/ping-t/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ip: currentIpToPing })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        appendToTerminal(`Persistent ping started for ${currentIpToPing}. Fetching results...`);
        activePersistentPingsClient[currentIpToPing] = true;
        updatePingTButtonText(true);
        fetchAndDisplayPersistentPingResults(currentIpToPing); // Fetch immediately
        if (fetchResultsIntervals[currentIpToPing]) { 
            clearInterval(fetchResultsIntervals[currentIpToPing]);
        }
        fetchResultsIntervals[currentIpToPing] = setInterval(() => {
          fetchAndDisplayPersistentPingResults(currentIpToPing);
        }, 5000); 
      } else {
        appendToTerminal(`Failed to start persistent ping for ${currentIpToPing}: ${data.error || 'Backend error'}`, true);
         // If backend says it's already running (e.g. from another session/browser), update client state
        if (data.error && data.error.toLowerCase().includes("already running")) {
            activePersistentPingsClient[currentIpToPing] = true;
            updatePingTButtonText(true);
             if (fetchResultsIntervals[currentIpToPing]) { 
                clearInterval(fetchResultsIntervals[currentIpToPing]);
            }
            fetchResultsIntervals[currentIpToPing] = setInterval(() => {
              fetchAndDisplayPersistentPingResults(currentIpToPing);
            }, 5000);
        }
      }
    } catch (err) {
      appendToTerminal(`Error starting persistent ping for ${currentIpToPing}: ${err.message}`, true);
    }
  }
  // Advance and save pingTIndexGlobal for the *next* targeted IP
  const inputs = document.querySelectorAll('.ip-input');
  const validIPs = Array.from(inputs).map(input => input.value.trim()).filter(ip => isValidIP(ip));
  if (validIPs.length > 0) {
      pingTIndexGlobal = parseInt(localStorage.getItem("pingTIndexGlobal")) || 0;
      const nextIndex = (pingTIndexGlobal + 1) % validIPs.length;
      localStorage.setItem("pingTIndexGlobal", nextIndex);
  }
}

async function generateReport() {
  const devices = collectValidDevices();
  if (!devices.length) {
    appendToTerminal("❌ No valid rows to include in the report.", true);
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

    // Check if the report is for an actively persistent-pinged IP
    const currentIpForPingT = getCurrentSelectedIpForPingT();
    if (currentIpForPingT && activePersistentPingsClient[currentIpForPingT]) {
      payload.type = 'auto'; // Mark as 'auto' if generated while persistent ping is active for the selected IP
      appendToTerminal(`Report type 'auto' because persistent ping is active for ${currentIpForPingT}.`);
    }

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



function collectValidDevices() {
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
    if (circuits[i] && isps[i] && locations[i] && isValidIP(ips[i])) {
      devices.push({
        circuit: circuits[i],
        isp: isps[i],
        location: locations[i],
        ip: ips[i],
        speed: speeds[i] || null,
        start_date: startDates[i] || null,
        end_date: endDates[i] || null
      });
    }
  }

  return devices;
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
      const isBasicValid = row.circuit && row.isp && row.location && isValidIP(row.ip);

      if (!isBasicValid) {
        highlightMissingFieldsSmart(i, row);
        hasError = true;
      } else {
        devices.push(row);
      }
    }
  }

  if (hasError) {
    appendToTerminal('❌ Some fields are missing or invalid.', true);
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
      const savedCount = data.saved || 0;
      const skippedCount = data.skipped || 0;
    
      if (savedCount > 0) {
        appendToTerminal(``);
      }
    
      if (skippedCount > 0) {
        showCenterAlert(` ${skippedCount} duplicate record(s) were skipped.`);
      }
    
      if (savedCount === 0 && skippedCount === 0) {
        showCenterAlert('No new valid devices to save.');
      }
    }    
  } catch (err) {
    appendToTerminal(`Save error: ${err.message}`, true);
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







document.addEventListener('DOMContentLoaded',async () => {
    userPermissions = await checkUserPermissions();

  // إظهار زر المشاركة فقط إذا لديه الصلاحية
  if (userPermissions.share_items ) {
    document.getElementById("shareBtn").style.display = "inline-block";
  } else {
    document.getElementById("shareBtn").style.display = "none";
  }

  const token = localStorage.getItem("token");
  pingTIndexGlobal = parseInt(localStorage.getItem("pingTIndexGlobal")) || 0; // Load global index

  // Page Load Logic for Persistent Pings
  if (token) {
    try {
      const response = await fetch(`${API_BASE_URL}/ping-t/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const activePings = await response.json();
        const currentSelectedIpOnLoad = getCurrentSelectedIpForPingT(); // Get it once for this scope
        
        activePings.forEach(ping => {
          if (ping.status === 'running' && isValidIP(ping.ip_address)) {
            appendToTerminal(`Persistent ping for ${ping.ip_address} is active (from backend). Fetching results...`);
            activePersistentPingsClient[ping.ip_address] = true;
            fetchAndDisplayPersistentPingResults(ping.ip_address); // Fetch immediately
            
            if (fetchResultsIntervals[ping.ip_address]) { // Clear existing interval if any (e.g. from previous state)
                clearInterval(fetchResultsIntervals[ping.ip_address]);
            }
            fetchResultsIntervals[ping.ip_address] = setInterval(() => {
              fetchAndDisplayPersistentPingResults(ping.ip_address);
            }, 5000); // Fetch results every 5 seconds

            if (ping.ip_address === currentSelectedIpOnLoad) {
              updatePingTButtonText(true); // Update button if this is the currently selected IP
            }
          }
        });
        // After checking all pings from backend, ensure button for current IP is correctly set
        // This handles case where current IP was NOT in backend's list, so it should be "Start"
        if (currentSelectedIpOnLoad && !activePersistentPingsClient[currentSelectedIpOnLoad]) {
            updatePingTButtonText(false);
        } else if (!currentSelectedIpOnLoad) {
            updatePingTButtonText(false); // No valid IP selected
        }

      } else {
        const errorData = await response.json();
        appendToTerminal(`Error fetching persistent ping status: ${errorData.error || response.statusText}`, true);
      }
    } catch (err) {
      appendToTerminal(`Error fetching persistent ping status on page load: ${err.message}`, true);
    }
  } else {
    appendToTerminal("No token found, persistent ping status check skipped.", false);
    updatePingTButtonText(false); // No token, so cannot be pinging
  }
  
  document.getElementById('ping-btn')?.addEventListener('click', pingSelectedIP);
  document.getElementById('pingall-btn')?.addEventListener('click', pingAllIPs);
  document.getElementById('pingt-btn')?.addEventListener('click', startContinuousPing); // Correctly calls the modified function
  document.getElementById('report-btn')?.addEventListener('click', generateReport);
  document.getElementById('traceroute-btn')?.addEventListener('click', tracerouteSelectedIP);
  document.getElementById('saveBtn')?.addEventListener('click', saveAllIPs);
  document.getElementById('shareBtn')?.addEventListener('click', openSharePopup);

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
    const isBasicValid = row.circuit && row.isp && row.location && isValidIP(row.ip);
    if (isBasicValid) devices.push(row);
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

// Function to handle the selection of the Reports option
function handleReportsSelection() {
  window.location.href = 'reports.html';
}



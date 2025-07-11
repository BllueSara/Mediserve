// Function to go back
function goBack() {
    if (window.history.length > 1) {
        window.history.back();
    } else {
        window.location.href = "diagnostic.html";
    }
}

const API_BASE_URL = 'http://localhost:4000';

function filterEngineerNameByLang(text, lang) {
  if (!text || typeof text !== 'string') return text;
  // فلترة أي اسم فيه | حتى لو جاء بعد كلمات مثل engineer أو user أو غيرها
  // أمثلة: to engineer Sara|سارة, assigned to user Ali|علي
  return text.replace(/([A-Za-zء-ي0-9_\-]+\|[A-Za-zء-ي0-9_\-]+)/g, (match) => {
    const parts = match.split('|').map(s => s.trim());
    if (parts.length === 2) {
      return lang === 'ar' ? (parts[1] || parts[0]) : parts[0];
    }
    return match;
  });
}

// Function to get translated text
function getTranslatedText(key) {
    const lang = languageManager.currentLang || 'en';
    return languageManager.translations[lang][key] || key;
}

// Function to format date
function formatDate(date) {
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(date).toLocaleString(undefined, options);
}

// Function to get status color class
function getStatusClass(status) {
    switch(status.toLowerCase()) {
        case 'active':
            return 'status-active';
        case 'failed':
            return 'status-failed';
        case 'unstable':
            return 'status-unstable';
        default:
            return '';
    }
}

// Function to create a report card
function createReportCard(ip, ipHistory) { // Accept IP and the full history array
    const latestReportResult = ipHistory[ipHistory.length - 1]; // Get the latest result for display

    const card = document.createElement('div');
    card.className = 'report-card';

    const header = document.createElement('div');
    header.className = 'report-header';

    const title = document.createElement('div');
    title.className = 'report-title';
    title.textContent = `${getTranslatedText('report_for')} ${ip || getTranslatedText('unknown_ip')}`;

    const date = document.createElement('div');
    date.className = 'report-date';
    date.textContent = formatDate(latestReportResult.timestamp); // Display latest timestamp

    header.appendChild(title);
    header.appendChild(date);

    const info = document.createElement('div');
    info.className = 'report-info';

    // Add details from the latest report result
    const details = [
        { 
            label: getTranslatedText('status'), 
            value: getTranslatedText(latestReportResult.status.toLowerCase()),
            class: getStatusClass(latestReportResult.status)
        },
        { 
            label: getTranslatedText('latency'), 
            value: latestReportResult.latency ? `${latestReportResult.latency}ms` : 'N/A'
        },
         { 
            label: getTranslatedText('packet_loss'), 
            value: latestReportResult.packetLoss != null ? `${latestReportResult.packetLoss}%` : 'N/A'
        },
        { 
            label: getTranslatedText('timeouts'), 
            value: latestReportResult.timeouts != null ? latestReportResult.timeouts.toString() : '0'
        }
        // Add other details like circuit name, ISP, location, speed if available in the first result of history
        // These would need to be added to the saved reportResult object in saved.js if not already
    ];

    details.forEach(detail => {
        const item = document.createElement('div');
        item.className = 'info-item';

        const label = document.createElement('span');
        label.className = 'info-label';
        label.textContent = detail.label;

        const value = document.createElement('span');
        value.className = `info-value ${detail.class || ''}`;
        value.textContent = detail.value;

        item.appendChild(label);
        item.appendChild(value);
        info.appendChild(item);
    });

    const actions = document.createElement('div');
    actions.className = 'report-actions';

    const viewButton = document.createElement('button');
    viewButton.className = 'action-button view-button';
    viewButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        </svg>
        ${getTranslatedText('view_details')}
    `;
    viewButton.onclick = () => viewReportDetails(ipHistory); // Pass the full history

    const downloadButton = document.createElement('button');
    downloadButton.className = 'action-button download-button';
    downloadButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        ${getTranslatedText('download')}
    `;
    downloadButton.onclick = () => downloadReport(ipHistory); // Pass the full history

    actions.appendChild(viewButton);
    actions.appendChild(downloadButton);

    card.appendChild(header);
    card.appendChild(info);
    card.appendChild(actions);

    return card;
}

// Function to render reports based on filters
function renderReports(reportsToRender) {
    const reportsList = document.getElementById('reportsList');
    reportsList.innerHTML = ''; // Clear current list

    if (reportsToRender.length === 0) {
        reportsList.innerHTML = `
            <div class="no-reports">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                <p data-i18n="no_reports_available">${getTranslatedText('no_reports_available')}</p>
            </div>
        `;
        // updateContent(); // Removed explicit call here
        return;
    }

    // Group reports by IP
    const groupedReportsHistory = reportsToRender.reduce((acc, reportResult) => { // Group by IP, store full history
        const ip = reportResult.ip || 'Unknown IP';
        if (!acc[ip]) {
            acc[ip] = [];
        }
        acc[ip].push(reportResult);
        // Sort history for this IP by timestamp
        acc[ip].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        return acc;
    }, {});

    // Sort IPs alphabetically before rendering cards
    const sortedIps = Object.keys(groupedReportsHistory).sort();

    sortedIps.forEach(ip => {
        const ipHistory = groupedReportsHistory[ip];
        const card = createReportCard(ip, ipHistory); // Pass IP and full history
        reportsList.appendChild(card);
    });
}

// Function to load and filter reports
async function loadAndFilterReports() {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/reports/mine`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
  
      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }
  
      const allReportResults = await res.json();
  
      if (!Array.isArray(allReportResults)) {
        console.error('❌ Unexpected response format:', allReportResults);
        document.getElementById('reportsList').innerHTML = `<p class="error">❌ Invalid response from server</p>`;
        return;
      }
  
      const searchTerm = document.getElementById('reportSearch').value.toLowerCase();
      const startDateInput = document.getElementById('startDate').value;
      const endDateInput = document.getElementById('endDate').value;
  
      const filteredResults = allReportResults.filter(report => {
        const reportDate = new Date(report.timestamp);
  
        const matchesSearch =
          (report.ip && report.ip.toLowerCase().includes(searchTerm)) ||
          (report.status && report.status.toLowerCase().includes(searchTerm));
  
        let matchesDateRange = true;
  
        if (startDateInput) {
          const startDate = new Date(startDateInput);
          startDate.setHours(0, 0, 0, 0);
          matchesDateRange = matchesDateRange && reportDate >= startDate;
        }
  
        if (endDateInput) {
          const endDate = new Date(endDateInput);
          endDate.setHours(23, 59, 59, 999);
          matchesDateRange = matchesDateRange && reportDate <= endDate;
        }
  
        return matchesSearch && matchesDateRange;
      });
  
      renderReports(filteredResults);
  
    } catch (err) {
      console.error('❌ Failed to load reports:', err);
      document.getElementById('reportsList').innerHTML = `<p class="error">❌ Failed to load reports</p>`;
    }
  }
  

// Function to view report details (placeholder)
function viewReportDetails(reportId) {
    window.location.href = `report-details.html?report_id=${reportId}`;
  }
  

// Function to download report (IMPLEMENTED)
function downloadReport(ipHistory) { // Now receives the full history array for an IP
    if (!ipHistory || ipHistory.length === 0) {
        console.error('No data to download.');
        // Optionally show a message to the user
        return;
    }

    // Filter for results with latency > 50ms or packet loss > 0%
    const filteredHistory = ipHistory.filter(result => 
      (typeof result.latency === 'number' && result.latency > 50) ||
      (typeof result.packetLoss === 'number' && result.packetLoss > 0) ||
      result.status === 'failed'
    );

    if (filteredHistory.length === 0) {
        console.log('No relevant data (latency > 50ms or packet loss > 0%) to download for this IP.');
        // Optionally show a message to the user
        return;
    }

    const ip = ipHistory[0]?.ip || 'Unknown_IP'; // Get IP from the first result
    const wb = XLSX.utils.book_new();
    const wsData = [
        ['Timestamp', 'Status', 'Latency (ms)', 'Packet Loss', 'Timeouts', 'Raw Output'] // Headers
    ];

    // Add data rows from history
    filteredHistory.forEach(result => {
        wsData.push([
            formatDate(result.timestamp), // Formatted timestamp
            result.status || 'N/A',
            result.latency != null ? result.latency : '0%',
            result.packetLoss != null ? `${result.packetLoss}%` : '0%', // Assuming packetLoss is stored
            result.timeouts != null ? result.timeouts : '0', // Assuming timeouts are stored
            result.output || '' // Raw output
        ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths (adjust as needed)
    ws['!cols'] = [
        { wch: 20 }, // Timestamp
        { wch: 15 }, // Status
        { wch: 12 }, // Latency
        { wch: 15 }, // Packet Loss
        { wch: 10 }, // Timeouts
        { wch: 50 }  // Raw Output
    ];

    XLSX.utils.book_append_sheet(wb, ws, ip.replace(/\./g, '_')); // Sheet name based on IP

    // Generate and download Excel file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `network_report_${ip.replace(/\./g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log(`Downloaded report for ${ip}`);
}

// Add event listeners for filtering and initial load
document.addEventListener('DOMContentLoaded', () => {
    loadAndFilterReports(); // Initial load from localStorage
    loadSavedReports();

    document.getElementById('reportSearch').addEventListener('input', loadAndFilterReports);
    document.getElementById('startDate').addEventListener('change', loadAndFilterReports);
    document.getElementById('endDate').addEventListener('change', loadAndFilterReports);
});

// The updateContent function should be called by Language.js's own DOMContentLoaded listener or initialization logic 


async function loadSavedReports() {
    try {
        const res = await fetch(`${API_BASE_URL}/reports/mine`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        const data = await res.json();
    if (!Array.isArray(data)) {
      console.error('Unexpected response:', data);
      return;
    }
 

    const list = document.getElementById('reportsList');
    list.innerHTML = ''; // Clear existing

    if (data.length === 0) {
      list.innerHTML = `<p style="text-align:center;">📝 No reports found.</p>`;
      return;
    }

    data.forEach(report => {
        const card = createSavedReportCard(report);
        list.appendChild(card);
      });
      
  
    } catch (err) {
      console.error('❌ Error loading saved reports:', err);
    }
  }

  function createSavedReportCard(report) {
    const card = document.createElement('div');
    card.className = 'report-card';
  
    const header = document.createElement('div');
    header.className = 'report-header';
  
    const title = document.createElement('div');
    title.className = 'report-title';
    title.textContent = getTranslatedText('network_reports');
  
    const date = document.createElement('div');
    date.className = 'report-date';
    date.textContent = formatDate(report.created_at);
  
    header.appendChild(title);
    header.appendChild(date);
  
    const info = document.createElement('div');
    info.className = 'report-info';
  
    // Get current language from localStorage
    const currentLang = localStorage.getItem('language') || 'en';
    
    // Apply language filtering to owner name
    const filteredOwnerName = report.owner_name ? filterEngineerNameByLang(report.owner_name, currentLang) : null;
  
    const items = [
      {
        label: getTranslatedText('device_count'),
        value: `${report.device_count || 0}`
      },
      // إضافة سطر لعرض كل الـ IPs
      ...(report.ips ? [{
        label: getTranslatedText('ip_address'),
        value: Array.from(new Set(report.ips.split(','))).join(', ')
      }] : []),
      ...(filteredOwnerName ? [{
        label: getTranslatedText('owner'),
        value: filteredOwnerName
      }] : [])
    ];
  
    items.forEach(item => {
      const row = document.createElement('div');
      row.className = 'info-item';
  
      const label = document.createElement('span');
      label.className = 'info-label';
      label.textContent = item.label;
  
      const value = document.createElement('span');
      value.className = 'info-value';
      value.textContent = item.value;
  
      row.appendChild(label);
      row.appendChild(value);
      info.appendChild(row);
    });
  
    const actions = document.createElement('div');
    actions.className = 'report-actions';
  
    const viewBtn = document.createElement('button');
    viewBtn.className = 'action-button view-button';
    viewBtn.textContent = getTranslatedText('view_details');
    viewBtn.onclick = () => viewReportDetails(report.report_id);
  
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'action-button download-button';
    downloadBtn.textContent = getTranslatedText('download');
    downloadBtn.onclick = () => downloadFullReport(report.report_id); 
  
    actions.appendChild(viewBtn);
    actions.appendChild(downloadBtn);
  
    card.appendChild(header);
    card.appendChild(info);
    card.appendChild(actions);
  
    return card;
  }
  

  function downloadFullReport(reportId) {
    const token = localStorage.getItem('token');
    // Correct URL to download the report
    const url = `${API_BASE_URL}/reports/${reportId}/download`;

    fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch report file");
        return res.blob();
      })
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        // Use the report ID in the filename for clarity
        a.download = `network_report_${reportId}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
      })
      .catch(err => {
        console.error('❌ Download error:', err);
        alert('❌ Failed to download the report.');
      });
  }

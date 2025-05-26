const API_BASE_URL = 'http://localhost:3000/api';


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
    switch (status.toLowerCase()) {
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

// Function to load and display report details
// استبدل كامل loadReportDetails تقريبًا بـ:
async function loadReportDetails() {
    const reportId = new URLSearchParams(location.search).get('report_id');
    if (!reportId) return;
  
    try {
      const res = await fetch(`${API_BASE_URL}/reports/${reportId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
  
      const { type, results } = await res.json();
      const isAuto = type === 'auto';
      const tableHead = document.getElementById('reportDetailsHead');
      const tableBody = document.getElementById('reportDetailsBody');
  
      tableHead.innerHTML = '';
      tableBody.innerHTML = '';
  
      const headers = isAuto
        ? ['IP Address', 'Status', 'Latency', 'Packet Loss', 'Timestamp']
        : ['Circuit Name', 'ISP', 'Location', 'IP Address', 'Circuit Speed', 'Start Contract', 'End Contract', 'Status'];
  
      const headRow = document.createElement('tr');
      headers.forEach(h => {
        const th = document.createElement('th');
        th.textContent = h;
        headRow.appendChild(th);
      });
      tableHead.appendChild(headRow);
  
      results.forEach(row => {
        const tr = document.createElement('tr');
        const cells = isAuto
  ? [row.ip, row.status, `${row.latency ?? '--'} ms`, `${row.packetLoss ?? '--'}%`, new Date(row.timestamp).toLocaleString()]
  : [
      row.circuit ?? '--',
      row.isp ?? '--',
      row.location ?? '--',
      row.ip ?? '--',
      row.speed ?? '--',
      row.start_date?.split('T')[0] ?? '--',
      row.end_date?.split('T')[0] ?? '--',
      row.status ?? '--'
    ];

  
        cells.forEach(val => {
          const td = document.createElement('td');
          td.textContent = val;
          tr.appendChild(td);
        });
  
        tr.classList.add(`status-${row.status}`);
        tableBody.appendChild(tr);
      });
  
    } catch (err) {
      console.error('❌ Failed to load report:', err);
    }
  }
  
  
  

// Load report details when the page is loaded
document.addEventListener('DOMContentLoaded', loadReportDetails);


document.getElementById('downloadReportBtn')?.addEventListener('click', generateExcelForIPDetails);

function generateExcelForIPDetails() {
    const targetIp = document.getElementById('ipAddress').textContent;
    if (!targetIp) return;

    const savedReports = JSON.parse(localStorage.getItem('autoPingReports') || '[]');

    const allReportResults = savedReports.reduce((acc, report) => {
        if (report.results && Array.isArray(report.results)) {
            const resultsWithTimestamp = report.results.map(result => ({
                ...result,
                parentTimestamp: report.timestamp
            }));
            return acc.concat(resultsWithTimestamp);
        }
        return acc;
    }, []);

    const ipHistory = allReportResults
        .filter(result => result.ip === targetIp)
        .sort((a, b) => new Date(a.parentTimestamp) - new Date(b.parentTimestamp));

    if (!ipHistory.length) {
        alert('No data found for this IP.');
        return;
    }

    const data = [['Timestamp', 'Status', 'Latency (ms)', 'Packet Loss (%)']];

    ipHistory.forEach(result => {
        const output = result.output || '';
        const latency = parseFloat(result.latency);
        const packetLoss = parseFloat(result.packetLoss);
        const timeouts = parseInt(result.timeouts) || 0;

        let status = '';
        if (
            result.status === 'failed' ||
            output.includes('100% packet loss') ||
            output.includes('Request timed out') ||
            isNaN(latency)
        ) {
            status = 'failed';
        } else if (packetLoss > 0 || timeouts > 0) {
            status = 'unstable';
        } else if (latency > 50) {
            status = 'delay';
        } else {
            status = 'active';
        }

        data.push([
            formatDate(result.timestamp),
            status,
            !isNaN(latency) ? latency : '0',
            !isNaN(packetLoss) ? packetLoss : '0'
        ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Report`);

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${targetIp}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}





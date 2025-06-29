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

// Function to translate status text
function translateStatus(status) {
    const lang = languageManager.currentLang || 'en';
    const statusTranslations = {
        active: { en: 'Active', ar: 'نشط' },
        failed: { en: 'Failed', ar: 'فشل' },
        unstable: { en: 'Unstable', ar: 'غير مستقر' },
        delay: { en: 'Delay', ar: 'تأخير' }
    };
    return statusTranslations[status]?.[lang] || status;
}

// Function to get translated headers
function getTranslatedHeaders(isAuto) {
    const lang = languageManager.currentLang || 'en';
    
    if (isAuto) {
        return {
            en: ['IP Address', 'Status', 'Latency', 'Packet Loss', 'Timestamp'],
            ar: ['عنوان IP', 'الحالة', 'زمن الاستجابة', 'فقدان الحزم', 'الوقت']
        }[lang];
    } else {
        return {
            en: ['Circuit Name', 'ISP', 'Location', 'IP Address', 'Circuit Speed', 'Start Contract', 'End Contract', 'Status'],
            ar: ['اسم الدائرة', 'مزود الخدمة', 'الموقع', 'عنوان IP', 'سرعة الدائرة', 'بداية العقد', 'نهاية العقد', 'الحالة']
        }[lang];
    }
}

// Function to load and display report details
async function loadReportDetails() {
    const reportId = new URLSearchParams(location.search).get('report_id');
    if (!reportId) {
        showNoDataMessage();
        return;
    }
  
    try {
        const res = await fetch(`${API_BASE_URL}/reports/${reportId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
  
        if (!res.ok) {
            throw new Error('Failed to fetch report');
        }

        const { type, results } = await res.json();
        const isAuto = type === 'auto';
        const tableHead = document.getElementById('reportDetailsHead');
        const tableBody = document.getElementById('reportDetailsBody');
        const ipAddressSpan = document.getElementById('ipAddress');
  
        tableHead.innerHTML = '';
        tableBody.innerHTML = '';
  
        // Get translated headers
        const headers = getTranslatedHeaders(isAuto);
  
        const headRow = document.createElement('tr');
        headers.forEach(h => {
            const th = document.createElement('th');
            th.textContent = h;
            headRow.appendChild(th);
        });
        tableHead.appendChild(headRow);
  
        if (!results || results.length === 0) {
            showNoDataMessage();
            return;
        }

        // Set IP address in header if available
        if (results[0] && results[0].ip) {
            ipAddressSpan.textContent = results[0].ip;
        }
  
        results.forEach(row => {
            const tr = document.createElement('tr');
            const cells = isAuto
                ? [
                    row.ip, 
                    translateStatus(row.status), 
                    `${row.latency ?? '--'} ms`, 
                    `${row.packetLoss ?? '--'}%`, 
                    new Date(row.timestamp).toLocaleString()
                ]
                : [
                    row.circuit ?? '--',
                    row.isp ?? '--',
                    row.location ?? '--',
                    row.ip ?? '--',
                    row.speed ?? '--',
                    row.start_date?.split('T')[0] ?? '--',
                    row.end_date?.split('T')[0] ?? '--',
                    translateStatus(row.status) ?? '--'
                ];
  
            cells.forEach(val => {
                const td = document.createElement('td');
                td.textContent = val;
                tr.appendChild(td);
            });
  
            tr.classList.add(`status-${row.status}`);
            tableBody.appendChild(tr);
        });
  
        hideNoDataMessage();
  
    } catch (err) {
        console.error('❌ Failed to load report:', err);
        showNoDataMessage();
    }
}

// Function to show no data message
function showNoDataMessage() {
    const noDataMessage = document.getElementById('noDataMessage');
    if (noDataMessage) {
        noDataMessage.style.display = 'block';
    }
}

// Function to hide no data message
function hideNoDataMessage() {
    const noDataMessage = document.getElementById('noDataMessage');
    if (noDataMessage) {
        noDataMessage.style.display = 'none';
    }
}

// Load report details when the page is loaded
document.addEventListener('DOMContentLoaded', () => {
    loadReportDetails();
    
    // Add event listener for download button
    const downloadBtn = document.getElementById('downloadReportBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', generateExcelForIPDetails);
    }
});

function generateExcelForIPDetails() {
    const targetIp = document.getElementById('ipAddress').textContent;
    if (!targetIp) {
        const lang = languageManager.currentLang || 'en';
        const message = lang === 'ar' ? 'لا يوجد عنوان IP محدد' : 'No IP address specified';
        alert(message);
        return;
    }

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
        const lang = languageManager.currentLang || 'en';
        const message = lang === 'ar' ? 'لا توجد بيانات لهذا العنوان' : 'No data found for this IP.';
        alert(message);
        return;
    }

    const lang = languageManager.currentLang || 'en';
    const headers = lang === 'ar' 
        ? ['الوقت', 'الحالة', 'زمن الاستجابة (مللي ثانية)', 'فقدان الحزم (%)']
        : ['Timestamp', 'Status', 'Latency (ms)', 'Packet Loss (%)'];

    const data = [headers];

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
            status = lang === 'ar' ? 'فشل' : 'failed';
        } else if (packetLoss > 0 || timeouts > 0) {
            status = lang === 'ar' ? 'غير مستقر' : 'unstable';
        } else if (latency > 50) {
            status = lang === 'ar' ? 'تأخير' : 'delay';
        } else {
            status = lang === 'ar' ? 'نشط' : 'active';
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
    XLSX.utils.book_append_sheet(wb, ws, lang === 'ar' ? 'تقرير' : 'Report');

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





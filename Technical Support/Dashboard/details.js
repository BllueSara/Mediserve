// Navigation functions (if needed, add here)
// t function for localization (if needed, add here)

// Global chart instances to prevent canvas reuse errors
let ramChartInstance = null;
let cpuChartInstance = null;

// Global variables for search functionality
let searchTimeout = null;
let currentSearchQuery = '';
let allDevicesData = null; // Store all devices for search
let allDashboardData = null;
let isSearchInProgress = false;

// Function to draw RAM Distribution Chart
function drawRamDistributionChart(ramData) {
    const ramChartCtx = document.getElementById('ramDistributionChart')?.getContext('2d');
    if (!ramChartCtx) return;

    // Destroy existing chart if it exists
    if (ramChartInstance) {
        ramChartInstance.destroy();
        ramChartInstance = null;
    }

    const data = {
        labels: ramData.labels,
        datasets: [{
            label: ramData.datasetLabel || 'Number of Devices',
            data: ramData.data,
            backgroundColor: '#3B82F6',
            borderColor: '#3B82F6',
            borderWidth: 1
        }]
    };

    const config = {
        type: 'bar',
        data: data,
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 90 // Adjust as needed based on actual data scale
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    };

    ramChartInstance = new Chart(ramChartCtx, config);
}

// Function to draw CPU Generation Overview Chart
function drawCpuGenerationChart(cpuData) {
    const cpuChartCtx = document.getElementById('cpuGenerationChart')?.getContext('2d');
    if (!cpuChartCtx) return;

    // Destroy existing chart if it exists
    if (cpuChartInstance) {
        cpuChartInstance.destroy();
        cpuChartInstance = null;
    }

    const data = {
        labels: cpuData.labels,
        datasets: [{
            label: cpuData.datasetLabel || 'Number of Devices',
            data: cpuData.data,
            backgroundColor: '#3B82F6',
            borderColor: '#3B82F6',
            borderWidth: 1
        }]
    };

    const config = {
        type: 'bar',
        data: data,
        options: {
            indexAxis: 'y',
            responsive: true,
            scales: {
                x: {
                    beginAtZero: true,
                     ticks: {
                        stepSize: 75 // Adjust as needed based on actual data scale
                    }
                }
            },
             plugins: {
                legend: {
                    display: false
                }
            }
        }
    };

    cpuChartInstance = new Chart(cpuChartCtx, config);
}

// Placeholder function to update overview cards (Total Devices, PCs, etc.)
function updateOverviewCards(data) {
    const cards = document.querySelectorAll('.overview-cards .card');
    if (!cards.length) return;
    cards[0].querySelector('.card-value').textContent = data.totalDevices;
    cards[1].querySelector('.card-value').textContent = data.totalPCs;
    cards[2].querySelector('.card-value').textContent = data.totalScanners;
    cards[3].querySelector('.card-value').textContent = data.totalPrinters;
}

// Placeholder function to update Outdated OS Versions list
function updateOutdatedOsList(data) {
    const osList = document.querySelector('.os-list');
    if (!osList) return;
    osList.innerHTML = '';
    data.forEach(os => {
        const div = document.createElement('div');
        div.className = 'os-item' + (os.outdated ? ' outdated' : '');
        div.innerHTML = `
            <span>${os.version}</span>
            <span class="device-count">${os.count} <span data-i18n="devices">devices</span></span>
        `;
        osList.appendChild(div);
    });
}

// Function to populate filter dropdowns with translated content
function populateFilters(filters) {
    const departmentFilter = document.getElementById('department-filter');
    if (departmentFilter && filters?.departments) {
        departmentFilter.innerHTML = '<option value="" data-i18n="all">All</option>';
        const lang = (languageManager && languageManager.currentLang) || 'en';
        filters.departments.forEach(dept => {
            const option = document.createElement('option');
            option.value = dept;
            option.textContent = getLocalizedDepartmentName(dept, lang);
            console.log('lang:', lang, 'dept:', dept, 'localized:', option.textContent);
            departmentFilter.appendChild(option);
        });
    }
    // CPU Gen
    const cpuFilter = document.getElementById('cpu-filter');
    if (cpuFilter && filters?.cpuGens) {
        cpuFilter.innerHTML = '<option value="" data-i18n="all">All</option>';
        filters.cpuGens.forEach(gen => {
            const option = document.createElement('option');
            option.value = gen;
            option.textContent = gen;
            cpuFilter.appendChild(option);
        });
    }
    // OS Version
    const osFilter = document.getElementById('os-filter');
    if (osFilter && filters?.osVersions) {
        osFilter.innerHTML = '<option value="" data-i18n="all">All</option>';
        filters.osVersions.forEach(os => {
            const option = document.createElement('option');
            option.value = os;
            option.textContent = os;
            osFilter.appendChild(option);
        });
    }
    // RAM Size
    const ramFilter = document.getElementById('ram-filter');
    if (ramFilter && filters?.ramSizes) {
        ramFilter.innerHTML = '<option value="" data-i18n="all">All</option>';
        filters.ramSizes.forEach(ram => {
            const option = document.createElement('option');
            option.value = ram;
            option.textContent = ram;
            ramFilter.appendChild(option);
        });
    }
    if (typeof languageManager !== 'undefined') languageManager.applyLanguage();
}

// Function to populate Needs Replacement table (moved to search section below)

// Function to get current filter values
function getFilterValues() {
    const department = document.getElementById('department-filter')?.value;
    const cpuGen = document.getElementById('cpu-filter')?.value;
    const osVersion = document.getElementById('os-filter')?.value;
    const ramSize = document.getElementById('ram-filter')?.value;

    return {
        department: department === '' ? null : department,
        cpuGen: cpuGen === '' ? null : cpuGen,
        osVersion: osVersion === '' ? null : osVersion,
        ramSize: ramSize === '' ? null : ramSize
    };
}

// Placeholder function to apply filters and update dashboard
function applyFilters(allData) {
    const filters = getFilterValues();
    console.log('Applying filters:', filters);

    // TODO: Implement filtering logic on allData
    // This will involve filtering the arrays inside allData (e.g., needsReplacement, outdatedOs)
    // based on the selected filters.
    // For now, we will just log the filters.

    // After filtering data, update the UI
    // updateOverviewCards(filteredData.overview);
    // drawRamDistributionChart(filteredData.ramDistribution);
    // drawCpuGenerationChart(filteredData.cpuGeneration);
    // updateOutdatedOsList(filteredData.outdatedOs);
    // populateNeedsReplacementTable(filteredData.needsReplacement);

     console.log('Filter application logic needs implementation.');
}

function getLocalizedDepartmentName(dept, lang) {
    if (!dept) return '';
    const parts = dept.split('|');
    if (parts.length === 2) {
        const en = parts[0].trim();
        const ar = parts[1].trim();
        return lang === 'ar' ? (ar || en) : (en || ar);
    }
    return dept;
}

async function loadDashboardData() {
    // Prevent multiple simultaneous calls
    if (isLoadDashboardDataInProgress) {
        console.log('loadDashboardData already in progress, skipping...');
        return;
    }
    
    isLoadDashboardDataInProgress = true;
    
    try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:4000/api/dashboard-data', {
            headers: { 'Authorization': `Bearer ${token}` },
            cache: 'no-store' // تعطيل الكاش
        });
        allDashboardData = await res.json();
        renderDashboard(allDashboardData);
    } catch (err) {
        console.error('Error loading dashboard data:', err);
    } finally {
        isLoadDashboardDataInProgress = false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadDashboardData();
    initializeSearch();
});

function renderDashboard(data) {
    updateOverviewCards(data.overview);
    drawRamDistributionChart(data.ramDistribution);
    drawCpuGenerationChart(data.cpuGeneration);
    updateOutdatedOsList(data.outdatedOs);
    populateFilters(data.filters);
    populateNeedsReplacementTable(data.needsReplacement);
}

// Placeholder for filter button event listeners
document.querySelector('.apply-filters-btn')?.addEventListener('click', () => {
    if (!allDashboardData) return;
    const filters = getFilterValues();
    let filtered = allDashboardData.needsReplacement.filter(device => {
        return (!filters.department || device.department === filters.department) &&
               (!filters.cpuGen || device.cpu === filters.cpuGen) &&
               (!filters.osVersion || device.os === filters.osVersion) &&
               (!filters.ramSize || device.ram === filters.ramSize);
    });
    populateNeedsReplacementTable(filtered);
    // يمكنك تطبيق الفلترة على باقي العناصر بنفس الطريقة إذا رغبت
});

document.querySelector('.clear-filters-btn')?.addEventListener('click', () => {
    if (allDashboardData) renderDashboard(allDashboardData);
});

// تحديث الأقسام والجدول عند تغيير اللغة
if (window.languageManager && typeof window.languageManager.onLanguageChange === 'function') {
    window.languageManager.onLanguageChange(() => {
        if (allDashboardData) {
            populateFilters(allDashboardData.filters);
            // أعد تعبئة جدول الأجهزة التي تحتاج تبديل حسب اللغة
            populateNeedsReplacementTable(
                document.querySelector('.apply-filters-btn.active') ?
                getFilteredNeedsReplacement() :
                allDashboardData.needsReplacement
            );
        }
    });
}

// Helper: إعادة الفلترة عند تغيير اللغة إذا كان هناك فلتر مطبق
function getFilteredNeedsReplacement() {
    const filters = getFilterValues();
    const filtered = allDashboardData.needsReplacement.filter(device => {
        return (!filters.department || device.department === filters.department) &&
               (!filters.cpuGen || device.cpu === filters.cpuGen) &&
               (!filters.osVersion || device.os === filters.osVersion) &&
               (!filters.ramSize || device.ram === filters.ramSize);
    });
    // إرجاع آخر 10 أجهزة فقط
    return filtered.slice(0, 10);
}

// إزالة الـ auto refresh - كان يحدث كل دقيقة
// setInterval(() => {
//     loadDashboardData();
// }, 60000); // 

// Global variables to prevent multiple simultaneous calls
let isViewLastReportInProgress = false;
let lastViewLastReportCall = 0;
let viewLastReportCallCount = 0;
let isLoadDashboardDataInProgress = false;

// Function to view last report for a device
async function viewLastReport(deviceName, department) {
    viewLastReportCallCount++;
    console.log(`=== viewLastReport call #${viewLastReportCallCount} ===`);
    console.log('Device:', deviceName, 'Department:', department);
    
    // Prevent multiple simultaneous calls and rapid successive calls
    const now = Date.now();
    if (isViewLastReportInProgress || (now - lastViewLastReportCall) < 1000) {
        console.log('View last report already in progress or called too recently, skipping...');
        return;
    }
    
    lastViewLastReportCall = now;
    isViewLastReportInProgress = true;
    
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showErrorToast('Please login first');
            return;
        }

        // Show loading indicator
        const button = event.target.closest('.view-last-report-btn');
        let originalContent = '';
        if (button) {
            originalContent = button.innerHTML;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
            button.disabled = true;
        }

        // Search for the last report for this device
        const response = await fetch(`http://localhost:4000/api/search-device-reports?deviceName=${encodeURIComponent(deviceName)}&department=${encodeURIComponent(department)}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reports = await response.json();
        
        console.log('Raw reports received from API:', reports);
        console.log('Number of reports received:', reports ? reports.length : 0);
        
        if (!reports || reports.length === 0) {
            showWarningToast('No reports found for this device');
            if (button) {
                button.innerHTML = originalContent;
                button.disabled = false;
            }
            return;
        }

        console.log('All reports found:', reports);
        
        // تحقق إضافي للتأكد من أن التقارير تعود للجهاز الصحيح
        const validReports = reports.filter(report => {
            const isValid = report.device_name === deviceName;
            if (!isValid) {
                console.log(`Filtering out report with wrong device: ${report.device_name} (expected: ${deviceName})`);
            }
            return isValid;
        });
        
        if (validReports.length === 0) {
            showWarningToast('No valid reports found for this device');
            if (button) {
                button.innerHTML = originalContent;
                button.disabled = false;
            }
            return;
        }

        console.log('Valid reports after filtering:', validReports);
        
        // تحقق إضافي من ترتيب التقارير حسب التاريخ
        const sortedValidReports = validReports.sort((a, b) => {
            const dateA = new Date(a.created_at);
            const dateB = new Date(b.created_at);
            
            // إذا كان التاريخ متساوي، رتب حسب ID تنازلي (الأكبر أولاً)
            if (dateA.getTime() === dateB.getTime()) {
                return b.id - a.id;
            }
            
            return dateB - dateA; // ترتيب تنازلي (الأحدث أولاً)
        });
        
        console.log('Sorted valid reports:', sortedValidReports);
        
        // Log all dates for debugging
        console.log('All report dates:');
        sortedValidReports.forEach((report, index) => {
            console.log(`Report ${index + 1}: ID=${report.id}, Date=${report.created_at}, Type=${report.maintenance_type}`);
        });

        // Get the most recent report
        let lastReport = sortedValidReports[0]; // Assuming the API returns reports sorted by date (newest first)
        
        console.log('Initial last report found:', lastReport);
        
        // تحقق إضافي من أن التقرير هو الأحدث فعلاً
        if (sortedValidReports.length > 1) {
            // ابحث عن التقرير الأحدث فعلاً مع مراعاة التاريخ والـ ID
            const maxDate = Math.max(...sortedValidReports.map(r => new Date(r.created_at).getTime()));
            const reportsWithMaxDate = sortedValidReports.filter(report => {
                const reportDate = new Date(report.created_at);
                return reportDate.getTime() === maxDate;
            });
            
            if (reportsWithMaxDate.length > 1) {
                // إذا كان هناك أكثر من تقرير بنفس التاريخ، اختر ذو الـ ID الأكبر
                const maxId = Math.max(...reportsWithMaxDate.map(r => r.id));
                const reportWithMaxId = reportsWithMaxDate.find(r => r.id === maxId);
                if (reportWithMaxId) {
                    console.warn('⚠️ Warning: Multiple reports with same date, selecting the one with highest ID');
                    console.log('Using report with highest ID:', reportWithMaxId);
                    lastReport = reportWithMaxId;
                }
            } else if (reportsWithMaxDate.length === 1) {
                // إذا كان هناك تقرير واحد فقط بالتاريخ الأحدث
                console.log('Found single report with latest date:', reportsWithMaxDate[0]);
                lastReport = reportsWithMaxDate[0];
            }
        }
        
        // تحقق إضافي من أن lastReport هو الأحدث فعلاً
        const currentReportDate = new Date(lastReport.created_at);
        const maxDate = Math.max(...sortedValidReports.map(r => new Date(r.created_at).getTime()));
        
        if (currentReportDate.getTime() !== maxDate) {
            console.warn('⚠️ Warning: Selected report is not the latest, correcting...');
            console.log('Selected report date:', currentReportDate);
            console.log('Latest report date:', new Date(maxDate));
            
            // Find the correct latest report
            const reportsWithMaxDate = sortedValidReports.filter(report => {
                const reportDate = new Date(report.created_at);
                return reportDate.getTime() === maxDate;
            });
            
            if (reportsWithMaxDate.length > 0) {
                // Select the one with highest ID if multiple reports have same date
                const maxId = Math.max(...reportsWithMaxDate.map(r => r.id));
                const correctReport = reportsWithMaxDate.find(r => r.id === maxId);
                if (correctReport) {
                    console.log('Correcting to latest report:', correctReport);
                    lastReport = correctReport;
                }
            }
        }
        
        // تحقق من وجود الحقول المطلوبة
        if (!lastReport.id || !lastReport.maintenance_type) {
            console.error('Invalid report data:', lastReport);
            showErrorToast('Invalid report data received');
            if (button) {
                button.innerHTML = originalContent;
                button.disabled = false;
            }
            return;
        }
        
        // تحقق إضافي من أن التقرير ينتمي للجهاز والقسم الصحيحين
        if (lastReport.device_name !== deviceName) {
            console.error('Report device name mismatch:', lastReport.device_name, 'expected:', deviceName);
            showErrorToast('Report device mismatch detected');
            if (button) {
                button.innerHTML = originalContent;
                button.disabled = false;
            }
            return;
        }
        
        // تحقق إضافي من القسم إذا كان متوفراً
        if (department && lastReport.department) {
            const reportDept = lastReport.department;
            const isDepartmentMatch = reportDept === department || 
                                    reportDept.includes('|') && 
                                    (reportDept.split('|')[0].trim() === department || 
                                     reportDept.split('|')[1].trim() === department);
            
            if (!isDepartmentMatch) {
                console.error('Report department mismatch:', reportDept, 'expected:', department);
                showErrorToast('Report department mismatch detected');
                if (button) {
                    button.innerHTML = originalContent;
                    button.disabled = false;
                }
                return;
            }
        }
        
        // Determine report type based on maintenance_type
        let reportType = 'regular';
        if (lastReport.maintenance_type === 'External') {
            reportType = 'external';
        } else if (lastReport.maintenance_type === 'General') {
            reportType = 'general';
        } else if (lastReport.maintenance_type === 'Internal') {
            reportType = 'internal';
        } else if (lastReport.maintenance_type === 'External Ticket') {
            reportType = 'external-ticket';
        } else if (lastReport.maintenance_type === 'New') {
            reportType = 'new';
        } else if (lastReport.maintenance_type === 'Maintenance Report') {
            reportType = 'maintenance-report';
        } else {
            console.warn('Unknown maintenance type:', lastReport.maintenance_type);
            reportType = 'regular'; // fallback
        }

        console.log('Report type determined:', reportType, 'from maintenance_type:', lastReport.maintenance_type);

        // Get device_id from the report or use a fallback
        const deviceId = lastReport.device_id || 'unknown';
        
        console.log('Navigating to report:', {
            id: lastReport.id,
            type: reportType,
            deviceId: deviceId,
            deviceName: lastReport.device_name,
            maintenanceType: lastReport.maintenance_type,
            createdAt: lastReport.created_at
        });

        // تحقق إضافي من صحة الرابط
        const reportUrl = `../Reports/report-details.html?id=${lastReport.id}&type=${reportType}&deviceId=${deviceId}`;
        console.log('Report URL:', reportUrl);
        
        // تحقق نهائي من البيانات قبل الانتقال
        console.log('Final validation before navigation:');
        console.log('- Report ID:', lastReport.id);
        console.log('- Report Type:', reportType);
        console.log('- Device ID:', deviceId);
        console.log('- Device Name:', lastReport.device_name);
        console.log('- Expected Device Name:', deviceName);
        console.log('- Maintenance Type:', lastReport.maintenance_type);
        console.log('- Created At:', lastReport.created_at);
        
        // تحقق إضافي من صحة البيانات
        const isValidReport = lastReport.id && 
                             lastReport.maintenance_type && 
                             lastReport.device_name && 
                             lastReport.device_name === deviceName &&
                             lastReport.created_at;
        
        if (!isValidReport) {
            console.error('Invalid report data detected:', lastReport);
            showErrorToast('Invalid report data received');
            button.innerHTML = originalContent;
            button.disabled = false;
            return;
        }
        
        console.log('✅ All validations passed, proceeding to navigation');
        
        // تحقق إضافي من نوع التقرير
        const validReportTypes = ['regular', 'external', 'general', 'internal', 'external-ticket', 'new', 'maintenance-report'];
        if (!validReportTypes.includes(reportType)) {
            console.error('Invalid report type:', reportType);
            showErrorToast('Invalid report type');
            if (button) {
                button.innerHTML = originalContent;
                button.disabled = false;
            }
            return;
        }
        
        console.log('✅ Report type validation passed');
        
        // تحقق نهائي من أن التقرير ينتمي للجهاز الصحيح
        if (lastReport.device_name !== deviceName) {
            console.error('Final validation failed: Report device name mismatch');
            console.error('Report device name:', lastReport.device_name);
            console.error('Expected device name:', deviceName);
            showErrorToast('Report device mismatch detected');
            if (button) {
                button.innerHTML = originalContent;
                button.disabled = false;
            }
            return;
        }
        
        console.log('✅ Final device validation passed');
        
        // تحقق نهائي من أن التقرير هو الأحدث فعلاً
        const finalCurrentReportDate = new Date(lastReport.created_at);
        const finalMaxDate = Math.max(...sortedValidReports.map(r => new Date(r.created_at).getTime()));
        
        if (finalCurrentReportDate.getTime() !== finalMaxDate) {
            console.error('Final validation failed: Selected report is not the latest');
            console.error('Selected report date:', finalCurrentReportDate);
            console.error('Latest report date:', new Date(finalMaxDate));
            showErrorToast('Failed to find the latest report');
            if (button) {
                button.innerHTML = originalContent;
                button.disabled = false;
            }
            return;
        }
        
        console.log('✅ Final latest report validation passed');
        
        // Navigate to report details page
        window.location.href = reportUrl;

    } catch (error) {
        console.error('Error fetching device reports:', error);
        showErrorToast('Failed to load device reports');
        
        // Restore button state
        const button = event.target.closest('.view-last-report-btn');
        if (button) {
            button.innerHTML = originalContent;
            button.disabled = false;
        }
    } finally {
        // Always reset the flag
        isViewLastReportInProgress = false;
    }
}

// Make viewLastReport globally accessible
window.viewLastReport = viewLastReport;

// Import toast functions if available
let showErrorToast, showWarningToast;

// Try to import toast functions
try {
    const toastModule = await import('../shared_functions/toast.js');
    showErrorToast = toastModule.showErrorToast;
    showWarningToast = toastModule.showWarningToast;
} catch (error) {
    // Fallback to alert if toast module is not available
    showErrorToast = (message) => alert('❌ ' + message);
    showWarningToast = (message) => alert('⚠️ ' + message);
}

// Make toast functions globally accessible
window.showErrorToast = showErrorToast;
window.showWarningToast = showWarningToast;

// ========== Search Functionality ==========

// Local search function (fallback when API is not available)
function performLocalSearch(query) {
    console.log('🔍 Performing local search for:', query);
    
    if (!allDashboardData || !allDashboardData.needsReplacement) {
        console.warn('⚠️ No dashboard data available for local search');
        return [];
    }
    
    // Log available departments for debugging
    const departments = [...new Set(allDashboardData.needsReplacement.map(d => d.department))];
    console.log('📋 Available departments:', departments);
    
    const searchTerm = query.toLowerCase().trim();
    const results = allDashboardData.needsReplacement.filter(device => {
        // Search in device name (exact match first, then partial)
        if (device.name) {
            const nameLower = device.name.toLowerCase();
            if (nameLower === searchTerm || nameLower.includes(searchTerm)) {
                console.log(`✅ Device name match: "${device.name}" contains "${searchTerm}"`);
                return true;
            }
        }
        
        // Search in department (both English and Arabic parts)
        if (device.department) {
            // Search in English part (before |)
            const englishPart = device.department.split('|')[0]?.trim().toLowerCase();
            if (englishPart && englishPart.includes(searchTerm)) {
                console.log(`✅ English department match: "${englishPart}" contains "${searchTerm}"`);
                return true;
            }
            
            // Search in Arabic part (after |) - more precise matching
            const arabicPart = device.department.split('|')[1]?.trim().toLowerCase();
            if (arabicPart) {
                // Check if search term is at the beginning of a word
                const words = arabicPart.split(' ');
                for (const word of words) {
                    if (word.startsWith(searchTerm)) {
                        console.log(`✅ Arabic department match: "${word}" starts with "${searchTerm}"`);
                        return true;
                    }
                }
                // Also check if search term is in the middle of a word (for partial matches)
                if (arabicPart.includes(searchTerm)) {
                    console.log(`✅ Arabic department match: "${arabicPart}" contains "${searchTerm}"`);
                    return true;
                }
            }
            
            // Also search in localized department name
            const localizedDept = getLocalizedDepartmentName(device.department, 'ar').toLowerCase();
            if (localizedDept.includes(searchTerm)) {
                console.log(`✅ Localized department match: "${localizedDept}" contains "${searchTerm}"`);
                return true;
            }
        }
        
        // Search in RAM (exact match for numbers)
        if (device.ram && device.ram !== 'N/A') {
            const ramLower = device.ram.toLowerCase();
            if (ramLower.includes(searchTerm)) {
                return true;
            }
        }
        
        // Search in CPU (exact match for generation numbers)
        if (device.cpu && device.cpu !== 'N/A') {
            const cpuLower = device.cpu.toLowerCase();
            if (cpuLower.includes(searchTerm)) {
                return true;
            }
        }
        
        // Search in OS
        if (device.os && device.os !== 'N/A') {
            const osLower = device.os.toLowerCase();
            if (osLower.includes(searchTerm)) {
                return true;
            }
        }
        
        // Search in IP address (exact match)
        if (device.ip_address && device.ip_address !== 'N/A') {
            const ipLower = device.ip_address.toLowerCase();
            if (ipLower.includes(searchTerm)) {
                console.log(`✅ IP address match: "${device.ip_address}" contains "${searchTerm}"`);
                return true;
            }
        }
        
        // Search in MAC address (exact match)
        if (device.mac_address && device.mac_address !== 'N/A') {
            const macLower = device.mac_address.toLowerCase();
            if (macLower.includes(searchTerm)) {
                console.log(`✅ MAC address match: "${device.mac_address}" contains "${searchTerm}"`);
                return true;
            }
        }
        
        return false;
    });
    
    // Sort results by relevance (exact matches first)
    const sortedResults = results.sort((a, b) => {
        const searchTermLower = searchTerm.toLowerCase();
        
        // Exact name match gets highest priority
        if (a.name && a.name.toLowerCase() === searchTermLower) return -1;
        if (b.name && b.name.toLowerCase() === searchTermLower) return 1;
        
        // Name contains search term
        if (a.name && a.name.toLowerCase().includes(searchTermLower)) return -1;
        if (b.name && b.name.toLowerCase().includes(searchTermLower)) return 1;
        
        // IP address match
        if (a.ip_address && a.ip_address.toLowerCase().includes(searchTermLower)) return -1;
        if (b.ip_address && b.ip_address.toLowerCase().includes(searchTermLower)) return 1;
        
        // MAC address match
        if (a.mac_address && a.mac_address.toLowerCase().includes(searchTermLower)) return -1;
        if (b.mac_address && b.mac_address.toLowerCase().includes(searchTermLower)) return 1;
        
        // Department match
        if (a.department && a.department.toLowerCase().includes(searchTermLower)) return -1;
        if (b.department && b.department.toLowerCase().includes(searchTermLower)) return 1;
        
        // Default alphabetical order
        return a.name.localeCompare(b.name);
    });
    
    console.log('🔍 Local search results:', sortedResults);
    return sortedResults;
}

// Initialize search functionality
function initializeSearch() {
    const searchInput = document.getElementById('device-search');
    const clearSearchBtn = document.getElementById('clear-search');
    const searchResultsInfo = document.getElementById('search-results-info');
    
    console.log('🔍 Initializing search functionality...');
    console.log('Search input element:', searchInput);
    console.log('Clear search button:', clearSearchBtn);
    
    if (!searchInput) {
        console.error('❌ Search input element not found!');
        return;
    }
    
    // Search input event listener
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        currentSearchQuery = query;
        
        console.log('🔍 Search input changed:', query);
        
        // Show/hide clear button
        if (query) {
            clearSearchBtn.classList.add('show');
        } else {
            clearSearchBtn.classList.remove('show');
            searchResultsInfo.style.display = 'none';
            // Reset to show all devices when input is empty
            if (allDashboardData) {
                populateNeedsReplacementTable(allDashboardData.needsReplacement);
            }
            console.log('🔍 Input is empty, returning to normal view');
        }
        
        // Immediate search for better user experience - always stay in search mode
        if (query.length >= 2) {
            console.log('🔍 Performing immediate search for:', query);
            performSearch(query);
        } else if (query.length === 0) {
            // Clear search and return to normal view
            searchResultsInfo.style.display = 'none';
            if (allDashboardData) {
                populateNeedsReplacementTable(allDashboardData.needsReplacement);
            }
            console.log('🔍 Input is empty, returning to normal view');
        } else {
            // Keep search active even for short queries
            console.log('🔍 Keeping search active for query:', query);
        }
    });
    
    // Clear search button
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        currentSearchQuery = '';
        clearSearchBtn.classList.remove('show');
        searchResultsInfo.style.display = 'none';
        
        // Reset to show all devices when clear button is clicked
        if (allDashboardData) {
            populateNeedsReplacementTable(allDashboardData.needsReplacement);
        }
        console.log('🔍 Clear button clicked, returning to normal view');
    });
    
    // Search on Enter key
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const query = e.target.value.trim();
            if (query) {
                performSearch(query);
            }
        }
    });
}

// Perform search function
async function performSearch(query) {
    console.log('🔍 performSearch called with query:', query);
    
    if (!query || query.length < 2) {
        console.log('🔍 Query too short, but keeping search active');
        // Don't return - keep search active
        return;
    }
    
    // Always perform new search for better user experience
    console.log('🔍 Performing new search for query:', query);
    currentSearchQuery = query;
    
    // Don't exit search mode - keep it active
    
    // Allow multiple searches for better responsiveness
    console.log('🔍 Starting search for:', query);
    
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('❌ No token found');
            showErrorToast('Please login first');
            // Don't return - keep search active
            return;
        }
        
        console.log('🔍 Starting search API call...');
        console.log('🔍 Search URL:', `http://localhost:4000/api/search-devices?q=${encodeURIComponent(query)}`);
        
        // Don't show loading state - keep search active
        console.log('🔍 Performing search without loading state');
        
        // Use local search only (faster and more reliable)
        console.log('🔍 Using local search for better performance');
        const localResults = performLocalSearch(query);
        console.log('🔍 Storing local search results for query:', query, 'Results count:', localResults.length);
        allDevicesData = localResults; // Cache local results
        updateSearchResults(localResults, query);
        
        // Don't restore input state - keep search active
        console.log('🔍 Search completed, keeping search active');
        
    } catch (error) {
        console.error('Search error:', error);
        showErrorToast('Search failed. Please try again.');
        
        // Don't restore input state - keep search active
        console.log('🔍 Search error occurred, but keeping search active');
    }
}

// Update search results in UI
function updateSearchResults(results, query) {
    console.log('🔍 updateSearchResults called with:', results, 'for query:', query);
    
    const searchResultsInfo = document.getElementById('search-results-info');
    const searchResultsCount = document.getElementById('search-results-count');
    
    if (!results || results.length === 0) {
        // No results found - but keep search active
        searchResultsInfo.style.display = 'none'; // Hide results count
        console.log(`❌ No devices found matching "${query}"`);
        
        // Clear the table but keep search active
        const tableBody = document.querySelector('.needs-replacement table tbody');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; color: #666; font-style: italic; padding: 20px;">
                        ${languageManager?.currentLang === 'ar' ? 
                            `🔍 لم يتم العثور على أجهزة تطابق البحث: "${query}"` : 
                            `🔍 No devices found matching: "${query}"`
                        }
                        <br>
                        <small style="color: #999; font-size: 12px;">
                            ${languageManager?.currentLang === 'ar' ? 
                                'جرب البحث بالاسم، القسم، IP، أو MAC' : 
                                'Try searching by name, department, IP, or MAC'
                            }
                        </small>
                    </td>
                </tr>
            `;
        }
        // Don't return - keep search active
        console.log('🔍 No results found, but keeping search active');
        return;
    }
    
    // Hide results count - user doesn't want to see it
    searchResultsInfo.style.display = 'none';
    
    // Show success message in console only
    console.log(`✅ Found ${results.length} devices matching "${query}"`);
    
    // Update the table with search results
    populateNeedsReplacementTable(results);
}

// Enhanced populateNeedsReplacementTable to handle search results
function populateNeedsReplacementTable(data) {
    const tableBody = document.querySelector('.needs-replacement table tbody');
    if (!tableBody) return;
    tableBody.innerHTML = '';
    const lang = (languageManager && languageManager.currentLang) || 'en';
    
    // If it's search results, show all results, otherwise limit to 10
    const limitedData = currentSearchQuery ? data : data.slice(0, 10);
    
    // Keep search active - don't exit search mode
    console.log('🔍 Populating table with', limitedData.length, 'devices');
    
    limitedData.forEach(device => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${device.name}</td>
            <td>${getLocalizedDepartmentName(device.department, lang)}</td>
            <td>${device.ram}</td>
            <td>${device.cpu}</td>
            <td>${device.os}</td>
            <td>${device.status}</td>
            <td>
                <button class="view-last-report-btn" onclick="viewLastReport('${device.name}', '${device.department}')" 
                        title="${lang === 'ar' ? 'عرض آخر تقرير' : 'View Last Report'}">
                    <i class="fas fa-file-alt"></i>
                    <span>${lang === 'ar' ? 'عرض آخر تقرير' : 'View Last Report'}</span>
                </button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
    
    // Add info message if there are more devices (only for non-search results)
    if (!currentSearchQuery && data.length > 10) {
        const infoRow = document.createElement('tr');
        infoRow.className = 'info-row';
        infoRow.innerHTML = `
            <td colspan="7" style="text-align: center; color: #666; font-style: italic; padding: 10px;">
                ${lang === 'ar' ? 
                    `عرض آخر 10 أجهزة من أصل ${data.length} جهاز يحتاج استبدال` : 
                    `Showing last 10 devices out of ${data.length} devices that need replacement`
                }
            </td>
        `;
        tableBody.appendChild(infoRow);
    }
}

// Search initialization is now handled in the main DOMContentLoaded event

// Cleanup function to destroy charts when page is unloaded
window.addEventListener('beforeunload', () => {
    if (ramChartInstance) {
        ramChartInstance.destroy();
        ramChartInstance = null;
    }
    if (cpuChartInstance) {
        cpuChartInstance.destroy();
        cpuChartInstance = null;
    }
});
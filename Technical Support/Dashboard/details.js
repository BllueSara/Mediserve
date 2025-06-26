// Navigation functions (if needed, add here)
// t function for localization (if needed, add here)

// Function to draw RAM Distribution Chart
function drawRamDistributionChart(ramData) {
    const ramChartCtx = document.getElementById('ramDistributionChart')?.getContext('2d');
    if (!ramChartCtx) return;

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

    new Chart(ramChartCtx, config);
}

// Function to draw CPU Generation Overview Chart
function drawCpuGenerationChart(cpuData) {
    const cpuChartCtx = document.getElementById('cpuGenerationChart')?.getContext('2d');
    if (!cpuChartCtx) return;

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

    new Chart(cpuChartCtx, config);
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

// Function to populate Needs Replacement table
function populateNeedsReplacementTable(data) {
    const tableBody = document.querySelector('.needs-replacement table tbody');
    if (!tableBody) return;
    tableBody.innerHTML = '';
    const lang = (languageManager && languageManager.currentLang) || 'en';
    data.forEach(device => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${device.name}</td>
            <td>${getLocalizedDepartmentName(device.department, lang)}</td>
            <td>${device.ram}</td>
            <td>${device.cpu}</td>
            <td>${device.os}</td>
            <td>${device.status}</td>
        `;
        tableBody.appendChild(tr);
    });
}

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

let allDashboardData = null;

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
    try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:4000/api/dashboard-data', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        allDashboardData = await res.json();
        renderDashboard(allDashboardData);
    } catch (err) {
        console.error('Error loading dashboard data:', err);
    }
}

document.addEventListener('DOMContentLoaded', loadDashboardData);

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
    return allDashboardData.needsReplacement.filter(device => {
        return (!filters.department || device.department === filters.department) &&
               (!filters.cpuGen || device.cpu === filters.cpuGen) &&
               (!filters.osVersion || device.os === filters.osVersion) &&
               (!filters.ramSize || device.ram === filters.ramSize);
    });
} 
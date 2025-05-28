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
    // Example: Update Total Devices
    // document.querySelector('.card:nth-child(1) .card-value').textContent = data.totalDevices;
    console.log('Updating overview cards with data:', data);
    // Implement logic to update all overview cards based on data
}

// Placeholder function to update Outdated OS Versions list
function updateOutdatedOsList(data) {
     console.log('Updating outdated OS list with data:', data);
    // Implement logic to clear existing list and add items based on data
    // Example: Loop through data.outdatedOs and create/append .os-item elements
}

// Placeholder function to populate filter dropdowns
function populateFilters(data) {
     console.log('Populating filters with data:', data);
    // Implement logic to populate dropdowns (department, cpu, os, ram) based on data
}

// Function to populate Needs Replacement table
function populateNeedsReplacementTable(data) {
     console.log('Populating needs replacement table with data:', data);
    // Implement logic to clear existing table rows and add rows based on data
    // Example: Loop through data.needsReplacement and create/append table rows
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

// Main function to fetch data and update dashboard
async function loadDashboardData() {
    console.log('Attempting to load dashboard data...');
    // TODO: Implement actual data fetching logic
    // Example: const response = await fetch('/api/dashboard-data');
    // const data = await response.json();

    // Using placeholder data for now
    const dashboardData = {
        overview: {
            totalDevices: 847,
            totalPCs: 612,
            totalScanners: 124,
            totalPrinters: 111
        },
        ramDistribution: {
            labels: ['4GB', '8GB', '16GB', '32GB'],
            data: [150, 300, 280, 80]
        },
        cpuGeneration: {
            labels: ['5th Gen', '7th Gen', '3rd Gen', '9th Gen', '10th Gen'],
            data: [120, 280, 290, 140, 50]
        },
        outdatedOs: [
            { version: 'Windows 7', count: 45, outdated: true },
            { version: 'Windows 8', count: 28, outdated: true },
            { version: 'Windows 8.1', count: 15, outdated: false },
            { version: 'Windows 10', count: 12, outdated: false }
        ],
        filters: {
            departments: ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance'],
            cpuGens: ['3rd Gen', '5th Gen', '6th Gen', '7th Gen', '8th Gen', '9th Gen', '10th Gen'],
            osVersions: ['Windows 7', 'Windows 8', 'Windows 8.1', 'Windows 10'],
            ramSizes: ['4GB', '8GB', '16GB', '32GB']
        },
        needsReplacement: [
            { name: 'DESKTOP-001', department: 'Engineering', ram: '4GB', cpu: '6th Gen', os: 'Windows 7', status: 'Replace Soon' },
            { name: 'DESKTOP-002', department: 'Marketing', ram: '8GB', cpu: '7th Gen', os: 'Windows 8', status: 'Replace Soon' },
            { name: 'DESKTOP-003', department: 'Sales', ram: '16GB', cpu: '9th Gen', os: 'Windows 10', status: 'OK' },
            { name: 'DESKTOP-004', department: 'HR', ram: '4GB', cpu: '6th Gen', os: 'Windows 7', status: 'Replace Soon' },
            { name: 'DESKTOP-005', department: 'Finance', ram: '8GB', cpu: '8th Gen', os: 'Windows 10', status: 'OK' }
        ]
    };

    // Update UI with fetched data
    updateOverviewCards(dashboardData.overview);
    drawRamDistributionChart(dashboardData.ramDistribution);
    drawCpuGenerationChart(dashboardData.cpuGeneration);
    updateOutdatedOsList(dashboardData.outdatedOs);
    populateFilters(dashboardData.filters);
    populateNeedsReplacementTable(dashboardData.needsReplacement);

     console.log('Dashboard data loaded and UI updated.');
}

// Load data when the page is fully loaded
document.addEventListener('DOMContentLoaded', loadDashboardData);

// Placeholder for filter button event listeners
document.querySelector('.apply-filters-btn')?.addEventListener('click', () => {
    console.log('Apply Filters clicked');
    // TODO: Implement filter logic and re-render sections
});

document.querySelector('.clear-filters-btn')?.addEventListener('click', () => {
    console.log('Clear All clicked');
    // TODO: Implement clear filter logic and re-render sections with all data
}); 
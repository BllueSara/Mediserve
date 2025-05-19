// Navigation functions
function goBack() {
  window.history.back();
}

function goToHome() {
  window.location.href = "Home.html";
}

// Custom chart plugins for enhanced interactivity
Chart.register({
  id: 'centerTextPlugin',
  beforeDraw(chart) {
    if (chart.config.type === 'doughnut') {
      const { ctx, width, height } = chart;
      const dataset = chart.data.datasets[0];
      const total = dataset.data.reduce((a, b) => a + b, 0);
      const value = dataset.data[0];
      const percent = total === 0 ? 0 : Math.round((value / total) * 100);

      ctx.save();
      const fontSize = Math.min(height / 5, 16);
      ctx.font = `600 ${fontSize}px 'Inter'`;
      ctx.fillStyle = chart.data.datasets[0].backgroundColor[0];
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${percent}%`, width / 2, height / 2);
      ctx.restore();
    }
  }
});

// Tooltip plugin for charts
Chart.register({
  id: 'customTooltip',
  afterEvent(chart, args) {
    const { ctx, chartArea } = chart;
    const tooltip = document.getElementById('chart-tooltip');

    if (!args.event.x || !args.event.y) return;

    if (args.event.type === 'mousemove') {
      const x = args.event.x;
      const y = args.event.y;

      // Check if mouse is within chart area
      if (x >= chartArea.left && x <= chartArea.right &&
        y >= chartArea.top && y <= chartArea.bottom) {
        const points = chart.getElementsAtEventForMode(
          args.event,
          'nearest',
          { intersect: true },
          false
        );

        if (points.length) {
          const point = points[0];
          const dataset = chart.data.datasets[point.datasetIndex];
          const value = dataset.data[point.index];
          const label = chart.data.labels[point.index];

          tooltip.innerHTML = `
            <div style="font-weight:600;margin-bottom:4px">${label}</div>
            <div>${dataset.label}: ${value}%</div>
          `;
          tooltip.style.opacity = 1;
          tooltip.style.left = `${x + 10}px`;
          tooltip.style.top = `${y + 10}px`;
        } else {
          tooltip.style.opacity = 0;
        }
      } else {
        tooltip.style.opacity = 0;
      }
    } else {
      tooltip.style.opacity = 0;
    }
  }
});

document.addEventListener('DOMContentLoaded', function () {
  // دالة لرسم الدوائر
  function drawDoughnut(id, percent, color) {
    const ctx = document.getElementById(id);
    if (!ctx) return;

    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Completed', 'Remaining'],
        datasets: [{
          data: [percent, 100 - percent],
          backgroundColor: [color, '#F3F4F6'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        }
      }
    });
  }

  // تحميل البيانات من الـ API
  fetch('http://localhost:4000/api/maintenance/completion-rates', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`  // إذا كنت مخزن التوكن هنا
    }
  })
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(data => {
      drawDoughnut('routineStatusChart', data.regular.percentage, '#8B5CF6');
      drawDoughnut('internalStatusChart', data.internal.percentage, '#3B82F6');
      drawDoughnut('externalStatusChart', data.external.percentage, '#F59E0B');

      document.getElementById('regularPercentage').textContent = `${data.regular.percentage}%`;
      document.getElementById('regularDetail').textContent = `${data.regular.closed}/${data.regular.total} tasks`;

      document.getElementById('internalPercentage').textContent = `${data.internal.percentage}%`;
      document.getElementById('internalDetail').textContent = `${data.internal.closed}/${data.internal.total} tasks`;

      document.getElementById('externalPercentage').textContent = `${data.external.percentage}%`;
      document.getElementById('externalDetail').textContent = `${data.external.closed}/${data.external.total} tasks`;
    })
    .catch(err => {
      console.error('Failed to load maintenance data:', err);
    });
});






// Navigation functions
function goBack() {
  window.history.back();
}

function goToHome() {
  window.location.href = "Home.html";
}

// Custom chart plugins for enhanced interactivity
Chart.register({
  id: 'centerTextPlugin',
  beforeDraw(chart) {
    if (chart.config.type === 'doughnut') {
      const { ctx, width, height } = chart;
      const dataset = chart.data.datasets[0];
      const total = dataset.data.reduce((a, b) => a + b, 0);
      const value = dataset.data[0];
      const percent = total === 0 ? 0 : Math.round((value / total) * 100);

      ctx.save();
      const fontSize = Math.min(height / 5, 16);
      ctx.font = `600 ${fontSize}px 'Inter'`;
      ctx.fillStyle = chart.data.datasets[0].backgroundColor[0];
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${percent}%`, width / 2, height / 2);
      ctx.restore();
    }
  }
});

// Tooltip plugin for charts
Chart.register({
  id: 'customTooltip',
  afterEvent(chart, args) {
    const { ctx, chartArea } = chart;
    const tooltip = document.getElementById('chart-tooltip');

    if (!args.event.x || !args.event.y) return;

    if (args.event.type === 'mousemove') {
      const x = args.event.x;
      const y = args.event.y;

      // Check if mouse is within chart area
      if (x >= chartArea.left && x <= chartArea.right &&
        y >= chartArea.top && y <= chartArea.bottom) {
        const points = chart.getElementsAtEventForMode(
          args.event,
          'nearest',
          { intersect: true },
          false
        );

        if (points.length) {
          const point = points[0];
          const dataset = chart.data.datasets[point.datasetIndex];
          const value = dataset.data[point.index];
          const label = chart.data.labels[point.index];

          tooltip.innerHTML = `
            <div style="font-weight:600;margin-bottom:4px">${label}</div>
            <div>${dataset.label}: ${value}%</div>
          `;
          tooltip.style.opacity = 1;
          tooltip.style.left = `${x + 10}px`;
          tooltip.style.top = `${y + 10}px`;
        } else {
          tooltip.style.opacity = 0;
        }
      } else {
        tooltip.style.opacity = 0;
      }
    } else {
      tooltip.style.opacity = 0;
    }
  }
});

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
  // Create tooltip element
  const tooltip = document.createElement('div');
  tooltip.id = 'chart-tooltip';
  tooltip.className = 'tooltip';
  document.body.appendChild(tooltip);

  // Sample data - in a real app, this would come from an API
  const maintenanceData = {
    internal: 60,
    external: 45,
    routine: 85,
    reportMonths: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    internalMonthly: [70, 78, 85, 82, 75, 80],
    externalMonthly: [50, 60, 65, 70, 68, 72],
    routineMonthly: [80, 75, 90, 88, 85, 92],
    overviewLabels: ['PCs', 'Printers', 'Scanners', 'Servers', 'Network'],
    overviewInternal: [50, 35, 15, 70, 60],
    overviewExternal: [30, 25, 10, 40, 35],
    // Added task counts for the new hover details
    routineTasks: { completed: 42, total: 50 },
    internalTasks: { completed: 30, total: 50 },
    externalTasks: { completed: 18, total: 40 }
  };

  // Enhanced function to draw doughnut charts
  function drawDoughnut(id, percent, color) {
    const ctx = document.getElementById(id);
    if (!ctx) return;

    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Completed', 'Remaining'],
        datasets: [{
          data: [percent, 100 - percent],
          backgroundColor: [color, '#F3F4F6'], // Lighter background for remaining
          borderWidth: 0,
          hoverBorderWidth: 0,
          hoverOffset: 0,
          borderRadius: percent === 100 ? 0 : 10, // Rounded edges for partial completion
          spacing: 2 // Small gap between segments
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: false // Disable default tooltips since we have our own hover info
          },
          centerTextPlugin: true // Keep center text for non-hover state
        },
        onHover: (event, chartElement) => {
          if (chartElement.length) {
            ctx.style.cursor = 'pointer';
          } else {
            ctx.style.cursor = 'default';
          }
        },
        onClick: (event, chartElement) => {
          if (chartElement.length) {
            const datasetIndex = chartElement[0].datasetIndex;
            const index = chartElement[0].index;
            console.log(`Clicked on ${chart.data.labels[index]} (${chart.data.datasets[datasetIndex].data[index]}%)`);
          }
        },
        animation: {
          animateScale: true,
          animateRotate: true,
          duration: 1000
        }
      }
    });
  }

  // Function to draw line charts with enhanced interactivity
  function drawLineChart(id, labels, internalData, externalData, routineData) {
    const ctx = document.getElementById(id);
    if (!ctx) return;

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Internal Maintenance',
            data: internalData,
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 3,
            pointBackgroundColor: '#3B82F6',
            pointRadius: 0, // Hide points for cleaner look
            pointHoverRadius: 6,
            tension: 0.4, // Increased tension for wavier lines
            fill: {
              target: 'origin',
              above: 'rgba(59, 130, 246, 0.05)' // Very light fill
            },
            borderJoinStyle: 'round', // Smoother line joints
            borderCapStyle: 'round' // Rounded line ends
          },
          {
            label: 'External Maintenance',
            data: externalData,
            borderColor: '#F59E0B',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            borderWidth: 3,
            pointBackgroundColor: '#F59E0B',
            pointRadius: 0,
            pointHoverRadius: 6,
            tension: 0.4,
            fill: {
              target: 'origin',
              above: 'rgba(245, 158, 11, 0.05)'
            },
            borderJoinStyle: 'round',
            borderCapStyle: 'round'
          },
          {
            label: 'Regular Maintenance',
            data: routineData,
            borderColor: '#8B5CF6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            borderWidth: 3,
            pointBackgroundColor: '#8B5CF6',
            pointRadius: 0,
            pointHoverRadius: 6,
            tension: 0.4,
            fill: {
              target: 'origin',
              above: 'rgba(139, 92, 246, 0.05)'
            },
            borderJoinStyle: 'round',
            borderCapStyle: 'round'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 20,
              font: {
                family: 'Inter',
                size: 12
              }
            }
          },
          tooltip: {
            enabled: true,
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleFont: {
              size: 14,
              weight: 'bold'
            },
            bodyFont: {
              size: 12
            },
            padding: 12,
            cornerRadius: 6,
            displayColors: true
          }
        },
        interaction: {
          mode: 'index',
          intersect: false
        },
        scales: {
          y: {
            beginAtZero: false, // Allow chart to start from actual data minimum
            min: Math.min(...[...internalData, ...externalData, ...routineData]) - 5,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
              drawBorder: false
            },
            ticks: {
              font: {
                family: 'Inter'
              },
              callback: function (value) {
                return value + '%'; // Add percentage sign to Y-axis
              }
            }
          },
          x: {
            grid: {
              display: false,
              drawBorder: false
            },
            ticks: {
              font: {
                family: 'Inter'
              }
            }
          }
        },
        elements: {
          line: {
            cubicInterpolationMode: 'monotone' // Smoother curves
          }
        }
      }
    });
  }

  // Function to draw bar charts with enhanced interactivity
  function drawBar(id, labels, internal, external) {
    const ctx = document.getElementById(id);
    if (!ctx) return;

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Internal',
            data: internal,
            backgroundColor: '#3B82F6',
            borderRadius: 4,
            borderWidth: 0,
            hoverBackgroundColor: '#2563EB'
          },
          {
            label: 'External',
            data: external,
            backgroundColor: '#F59E0B',
            borderRadius: 4,
            borderWidth: 0,
            hoverBackgroundColor: '#D97706'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 20,
              font: {
                family: 'Inter'
              }
            }
          },
          tooltip: {
            enabled: true,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleFont: {
              size: 14,
              weight: 'bold'
            },
            bodyFont: {
              size: 12
            },
            padding: 12,
            cornerRadius: 6
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                family: 'Inter'
              }
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              font: {
                family: 'Inter'
              }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          }
        },
        animation: {
          duration: 1000
        },
        onHover: (event, chartElement) => {
          if (chartElement.length) {
            ctx.style.cursor = 'pointer';
          } else {
            ctx.style.cursor = 'default';
          }
        }
      }
    });
  }


  drawLineChart(
    'reportLineChart',
    maintenanceData.reportMonths,
    maintenanceData.internalMonthly,
    maintenanceData.externalMonthly,
    maintenanceData.routineMonthly
  );



  // Add hover effects to device boxes
  document.querySelectorAll('.device-box').forEach(box => {
    box.addEventListener('mouseenter', function () {
      const status = this.querySelector('span').textContent;
      const tooltip = document.createElement('div');
      tooltip.className = 'tooltip';
      tooltip.textContent = `Status: ${status}`;
      this.appendChild(tooltip);

      setTimeout(() => {
        tooltip.style.opacity = '1';
      }, 10);
    });

    box.addEventListener('mouseleave', function () {
      const tooltip = this.querySelector('.tooltip');
      if (tooltip) {
        tooltip.remove();
      }
    });
  });

  // Add click event to cards for potential expansion
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', function (e) {
      // Don't trigger if clicking on a link or interactive element
      if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON' || e.target.closest('a, button')) {
        return;
      }

      // In a real app, this could expand the card or show more details
      console.log(`Card clicked: ${this.querySelector('.label').textContent}`);
    });
  });

  // Add hover effects to the new circular charts
  document.querySelectorAll('.circle-item').forEach(item => {
    item.addEventListener('mouseenter', function () {
      this.querySelector('.chart-container').style.transform = 'scale(1.05)';
    });

    item.addEventListener('mouseleave', function () {
      this.querySelector('.chart-container').style.transform = 'scale(1)';
    });
  });
});



async function loadSupportTicketsSummary() {
  try {
    const res = await fetch('http://localhost:4000/api/tickets/summary', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!res.ok) throw new Error('Failed to fetch support ticket summary');

    const data = await res.json();

    const container = document.getElementById('supportTicketsContainer');
    container.innerHTML = '';

    const statuses = [
      { name: 'Open', key: 'open', color: '#F59E0B', delta: data.open_delta },
      { name: 'In Progress', key: 'in_progress', color: '#3B82F6', delta: data.in_progress_delta },
      { name: 'Resolved', key: 'resolved', color: '#10B981', delta: data.resolved_delta }
    ];

    statuses.forEach(status => {
      const value = data[status.key] || 0;
      const percent = data.total ? Math.round((value / data.total) * 100) : 0;
      const deltaText = status.delta >= 0 ? `+${status.delta}` : `${status.delta}`;

      const ticketHTML = `
        <div class="support-ticket" style="--bar-color: ${status.color}">
          <div>
            <span>${status.name}</span>
            <span>${value}</span>
          </div>
          <div class="progress-bar">
            <div style="width: ${percent}%; background-color: ${status.color}"></div>
          </div>
          <div style="font-size: 0.75rem; color: #6B7280; margin-top: 0.5rem;">
            ${deltaText} from last week
          </div>
        </div>
      `;

      container.innerHTML += ticketHTML;
    });
  } catch (err) {
    console.error('❌ Error loading ticket summary:', err);
  }
}

document.addEventListener('DOMContentLoaded', loadSupportTicketsSummary);


function drawBar(id, labels, internal, external) {
  const ctx = document.getElementById(id);
  if (!ctx) return;

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Internal',
          data: internal,
          backgroundColor: '#3B82F6',
          borderRadius: 4,
          borderWidth: 0,
          hoverBackgroundColor: '#2563EB'
        },
        {
          label: 'External',
          data: external,
          backgroundColor: '#F59E0B',
          borderRadius: 4,
          borderWidth: 0,
          hoverBackgroundColor: '#D97706'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            padding: 20,
            font: {
              family: 'Inter'
            }
          }
        },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleFont: {
            size: 14,
            weight: 'bold'
          },
          bodyFont: {
            size: 12
          },
          padding: 12,
          cornerRadius: 6
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            font: {
              family: 'Inter'
            }
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            font: {
              family: 'Inter'
            }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        }
      },
      animation: {
        duration: 1000
      },
      onHover: (event, chartElement) => {
        if (chartElement.length) {
          ctx.style.cursor = 'pointer';
        } else {
          ctx.style.cursor = 'default';
        }
      }
    }
  });
}

async function loadUpcomingMaintenance() {
  try {
    const res = await fetch('http://localhost:4000/api/maintenance/upcoming', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!res.ok) throw new Error('❌ Failed to fetch upcoming maintenance');

    const tasks = await res.json();
    const tbody = document.querySelector('.upcoming-table tbody');

    tbody.innerHTML = ''; // Clear existing static rows

    tasks.forEach(task => {
      const priorityClass = (task.priority || 'Medium').toLowerCase(); // Default fallback
      const row = document.createElement('tr');

      row.innerHTML = `
        <td>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
            style="vertical-align: middle; margin-right: 8px;">
            <path
              d="M19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21Z"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M8 15H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round" />
          </svg>
          ${task.device_name || 'Unnamed Device'} 
        </td>
        <td>${new Date(task.next_maintenance_date).toLocaleDateString()}</td>
        <td class="${priorityClass}">${task.priority || 'Medium'}</td>
      `;

      tbody.appendChild(row);
    });
  } catch (err) {
    console.error('Error loading upcoming maintenance:', err);
  }
}

document.addEventListener('DOMContentLoaded', loadUpcomingMaintenance);

// maintenance overview
async function loadMaintenanceOverviewChart() {
  try {
    const res = await fetch('http://localhost:4000/api/maintenance/overview', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!res.ok) throw new Error('Failed to load overview data');

    const data = await res.json();

    // جمع كل الأنواع من internal و external
    const allTypesSet = new Set([
      ...Object.keys(data.internal || {}),
      ...Object.keys(data.external || {})
    ]);

    const allTypes = Array.from(allTypesSet).map(type => type.toLowerCase());

    const internal = allTypes.map(type => data.internal[type] || 0);
    const external = allTypes.map(type => data.external[type] || 0);

    drawBar('maintenanceOverviewChart', allTypes, internal, external);

  } catch (err) {
    console.error('❌ Error loading overview chart:', err);
  }
}





document.addEventListener('DOMContentLoaded', loadMaintenanceOverviewChart);


// internal 
async function loadRepeatedProblems() {
  try {
    const res = await fetch('http://localhost:4000/api/critical-devices', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!res.ok) throw new Error('❌ Failed to fetch repeated problems');

    const data = await res.json();
    const container = document.getElementById('repeatedProblemsContainer');
    container.innerHTML = '';

    data.forEach(item => {
      const box = document.createElement('div');

      // ✅ تحديد الكلاس حسب عدد التكرارات
      let boxClass = 'device-box';
      if (item.count >= 20) {
        boxClass += ' critical'; // أحمر
      } else if (item.count >= 10) {
        boxClass += ' warning'; // أصفر
      } else {
        boxClass += ' info'; // أزرق أو رمادي خفيف
      }

      box.className = boxClass;

      // ✅ محتوى الكرت بدون []
      const problemText = Array.isArray(item.problem)
        ? item.problem.join(', ')
        : item.problem;

      box.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
          xmlns="http://www.w3.org/2000/svg" style="margin-right: 8px;">
          <path d="M4 6H20M4 12H20M4 18H20" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        ${item.device_type} - ${problemText}
        <span title="Occurred ${item.count} times">CHECK</span>
      `;

      // ✅ Tooltip
      box.addEventListener('mouseenter', () => {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.style.position = 'absolute';
        tooltip.style.padding = '6px 10px';
        tooltip.style.background = '#111';
        tooltip.style.color = '#fff';
        tooltip.style.borderRadius = '4px';
        tooltip.style.fontSize = '12px';
        tooltip.textContent = `Check this issue - occurred ${item.count} times`;
        tooltip.style.top = `${box.offsetTop - 30}px`;
        tooltip.style.left = `${box.offsetLeft}px`;
        tooltip.style.zIndex = 999;

        box.appendChild(tooltip);
        box._tooltip = tooltip;
      });

      box.addEventListener('mouseleave', () => {
        if (box._tooltip) {
          box._tooltip.remove();
          box._tooltip = null;
        }
      });

      container.appendChild(box);
    });

  } catch (err) {
    console.error('🔴 Error loading repeated problems:', err);
  }
}

document.addEventListener('DOMContentLoaded', loadRepeatedProblems);



async function loadUpgradeDevices() {
  try {
    const res = await fetch('http://localhost:4000/api/devices/needs-upgrade', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!res.ok) throw new Error('❌ Failed to fetch upgrade devices');

    const data = await res.json();
    const tbody = document.getElementById('upgradeDevicesBody');
    tbody.innerHTML = '';

    if (data.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = `<td colspan="3">No upgrade needed for any devices.</td>`;
      tbody.appendChild(row);
      return;
    }

    data.forEach(device => {
      const row = document.createElement('tr');

      const ram = parseInt(device.ram_size);
      const gen = parseInt(device.generation_number);
      const os = device.os_name?.toLowerCase() || '';

      let issueCount = 0;

      if (ram < 8) issueCount++;
      if (gen < 6) issueCount++;
      if (os.includes('windows') && !os.includes('11') && !os.includes('10')) issueCount++;

      const status = issueCount >= 2 ? 'CRITICAL' : 'WARNING';

      row.innerHTML = `
        <td>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle; margin-right: 8px;">
            <path d="M4 6H20M4 12H20M4 18H20"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          ${device.device_type}
        </td>
        <td>
          ${device.cpu_name}, ${device.ram_size}GB RAM, Gen ${device.generation_number}, ${device.os_name}
        </td>
        <td class="${status.toLowerCase()}" title="${device.recommendation}">
          ${status}
        </td>
      `;

      tbody.appendChild(row);
    });
  } catch (err) {
    console.error('❌ Error loading upgrade devices:', err);
  }
}




document.addEventListener('DOMContentLoaded', loadUpgradeDevices);

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
document.addEventListener('DOMContentLoaded', function() {
  // Create tooltip element
  const tooltip = document.createElement('div');
  tooltip.id = 'chart-tooltip';
  tooltip.className = 'tooltip';
  document.body.appendChild(tooltip);
  
  // Sample data - in a real app, this would come from an API
  fetch('/api/maintenance/completion-rates')
  .then(res => res.json())
  .then(data => {
    drawDoughnut('routineStatusChart', data.regular.percentage, '#8B5CF6');
    drawDoughnut('internalStatusChart', data.internal.percentage, '#3B82F6');
    drawDoughnut('externalStatusChart', data.external.percentage, '#F59E0B');

    // تعبئة تفاصيل الهوفر
    document.getElementById('regularPercentage').textContent = `${data.regular.percentage}%`;
    document.getElementById('regularDetail').textContent = `${data.regular.closed}/${data.regular.total} tasks`;

    document.getElementById('internalPercentage').textContent = `${data.internal.percentage}%`;
    document.getElementById('internalDetail').textContent = `${data.internal.closed}/${data.internal.total} tasks`;

    document.getElementById('externalPercentage').textContent = `${data.external.percentage}%`;
    document.getElementById('externalDetail').textContent = `${data.external.closed}/${data.external.total} tasks`;

    // باقي الرسومات
    drawLineChart(
      'reportLineChart',
      data.reportMonths,
      data.internalMonthly,
      data.externalMonthly,
      data.routineMonthly
    );

    drawBar(
      'maintenanceOverviewChart',
      data.overviewLabels,
      data.overviewInternal,
      data.overviewExternal
    );
  })
  .catch(err => console.error('Error fetching dashboard data:', err));

  
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
            callback: function(value) {
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
  
  // Initialize all charts with the enhanced doughnut configuration
  drawDoughnut('routineStatusChart', maintenanceData.routine, '#8B5CF6');
  drawDoughnut('internalStatusChart', maintenanceData.internal, '#3B82F6');
  drawDoughnut('externalStatusChart', maintenanceData.external, '#F59E0B');
  
  drawLineChart(
    'reportLineChart',
    maintenanceData.reportMonths,
    maintenanceData.internalMonthly,
    maintenanceData.externalMonthly,
    maintenanceData.routineMonthly
  );
  
  drawBar(
    'maintenanceOverviewChart',
    maintenanceData.overviewLabels,
    maintenanceData.overviewInternal,
    maintenanceData.overviewExternal
  );
  
  // Add hover effects to device boxes
  document.querySelectorAll('.device-box').forEach(box => {
    box.addEventListener('mouseenter', function() {
      const status = this.querySelector('span').textContent;
      const tooltip = document.createElement('div');
      tooltip.className = 'tooltip';
      tooltip.textContent = `Status: ${status}`;
      this.appendChild(tooltip);
      
      setTimeout(() => {
        tooltip.style.opacity = '1';
      }, 10);
    });
    
    box.addEventListener('mouseleave', function() {
      const tooltip = this.querySelector('.tooltip');
      if (tooltip) {
        tooltip.remove();
      }
    });
  });
  
  // Add click event to cards for potential expansion
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', function(e) {
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
    item.addEventListener('mouseenter', function() {
      this.querySelector('.chart-container').style.transform = 'scale(1.05)';
    });
    
    item.addEventListener('mouseleave', function() {
      this.querySelector('.chart-container').style.transform = 'scale(1)';
    });
  });
});



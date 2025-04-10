window.addEventListener('DOMContentLoaded', () => {
    new Chart(document.getElementById('activeChart'), {
      type: 'doughnut',
      data: {
        datasets: [{
          data: [85, 15],
          backgroundColor: ['#1d8cf8', '#e0e0e0'],
          borderWidth: 0
        }]
      },
      options: {
        cutout: '75%',
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        }
      }
    });
  
    new Chart(document.getElementById('inactiveChart'), {
      type: 'doughnut',
      data: {
        datasets: [{
          data: [15, 85],
          backgroundColor: ['#8898aa', '#e0e0e0'],
          borderWidth: 0
        }]
      },
      options: {
        cutout: '75%',
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        }
      }
    });
  });
  const ctx = document.getElementById('reportChart').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr'],
      datasets: [
        {
          label: 'internal',
          data: [50, 60, 75, 80],
          borderColor: '#1d8cf8',
          tension: 0.3
        },
        {
          label: 'external',
          data: [40, 50, 60, 70],
          borderColor: '#fbc531',
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100
        }
      }
    }
  });
  const ctx2 = document.getElementById('maintenanceChart').getContext('2d');
  new Chart(ctx2, {
    type: 'bar',
    data: {
      labels: ['PCs', 'Printers', 'Scanners'],
      datasets: [
        {
          label: 'internal',
          data: [45, 30, 20],
          backgroundColor: '#1d8cf8'
        },
        {
          label: 'external',
          data: [25, 20, 15],
          backgroundColor: '#fbc531'
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 60
        }
      }
    }
  });
  
  
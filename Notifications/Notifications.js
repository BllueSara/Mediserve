let allNotifications = [];
let showingAll = false;

const notifPopup = document.getElementById('notifications-popup');
const notifList = document.getElementById('notifications-list');
const notifButton = document.querySelector('a[href="/Notifications/Notifications.html"]');

notifButton.addEventListener('click', (e) => {
  e.preventDefault();
  toggleNotifications();
});

async function toggleNotifications() {
  if (notifPopup.classList.contains('hidden')) {
    await loadNotifications();
    notifPopup.classList.remove('hidden');
  } else {
    notifPopup.classList.add('hidden');
  }
}

async function loadNotifications() {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:4000/notifications', {
        headers: {
          'Authorization': 'Bearer ' + token
        }
      });
      allNotifications = await res.json();
      renderNotifications();
    } catch (err) {
      console.error('Error loading notifications:', err);
      notifList.innerHTML = '<div class="p-4 text-center text-red-400">Failed to load notifications</div>';
    }
  }
  

function renderNotifications() {
  notifList.innerHTML = '';
  const notificationsToShow = showingAll ? allNotifications : allNotifications.slice(0, 4);

  notificationsToShow.forEach(n => {
    const div = document.createElement('div');
    div.className = `p-3 border-b ${getColor(n.type)}`;
    div.innerHTML = `
    <div class="font-semibold">${getTypeLabel(n.type)}</div>
    <div class="text-sm text-gray-600">${n.message}</div>
    <div class="text-xs text-gray-400">${new Date(n.created_at).toLocaleString()}</div>
  `;
  
  
    notifList.appendChild(div);
  });

  if (notificationsToShow.length === 0) {
    notifList.innerHTML = '<div class="p-4 text-center text-gray-400">No notifications</div>';
  }
}

function clearNotifications() {
  allNotifications = [];
  renderNotifications();
}

function viewAll() {
  showingAll = true;
  renderNotifications();
}

function getColor(type) {
  if (type.includes('maintenance')) return 'border-l-4 border-blue-500';
  if (type.includes('report')) return 'border-l-4 border-green-500';
  if (type.includes('ticket')) return 'border-l-4 border-yellow-500';
  return 'border-l-4 border-gray-500';
}


function getTypeLabel(type) {
  switch (type) {
    case 'regular-maintenance': return ' Regular Maintenance';
    case 'general-maintenance': return ' General Maintenance';
    case 'external-maintenance': return ' External Maintenance';
    case 'internal-ticket': return ' Internal Ticket';
    case 'external-ticket': return ' External Ticket';
    case 'general-report': return ' General Report';
    case 'regular-report': return ' Regular Report';
    case 'external-report': return ' External Report';
    case 'internal-ticket-report': return ' Internal Ticket Report';
    case 'external-ticket-report': return ' External Ticket Report';
    default: return ' Notification';
  }
}

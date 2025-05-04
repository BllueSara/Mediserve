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
      const res = await fetch('http://localhost:5050/notifications', {
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
    <div class="font-semibold">Notification</div>
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
  switch (type) {
    case 'error': return 'border-l-4 border-red-500';
    case 'info': return 'border-l-4 border-blue-500';
    case 'warning': return 'border-l-4 border-yellow-500';
    case 'success': return 'border-l-4 border-green-500';
    default: return '';
  }
}

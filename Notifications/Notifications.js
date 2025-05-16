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
div.className = `notification-item p-3 border-b ${getColor(n.type)}`;
    div.dataset.id = n.id; // 👈 هذا السطر ضروري

div.innerHTML = `
  <div class="notification-content">
    <div class="font-semibold">${getTypeLabel(n.type)}</div>
    <div class="text-sm text-gray-600">${n.message}</div>
    <div class="text-xs text-gray-400">${new Date(n.created_at).toLocaleString()}</div>
  </div>
`;

  
  
    notifList.appendChild(div);
        setupSwipeToDelete(div); // ⬅️ أضف السطر هذا

  });

  if (notificationsToShow.length === 0) {
    notifList.innerHTML = '<div class="p-4 text-center text-gray-400">No notifications</div>';
  }
}

function setupSwipeToDelete(elem) {
  let startX = 0;
  let currentX = 0;
  let dragging = false;
  let isTouch = false;

  // Start
  const start = (clientX) => {
    startX = clientX;
    currentX = startX;
    dragging = true;
    elem.classList.add('swiping');
  };

  // Move
  const move = (clientX) => {
    if (!dragging) return;
    currentX = clientX;
    const translateX = Math.max(0, currentX - startX);
    elem.style.transform = `translateX(${translateX}px)`;

    if (translateX > 100) {
      elem.classList.add('delete-ready');
    } else {
      elem.classList.remove('delete-ready');
    }
  };

  // End
  const end = async () => {
    if (!dragging) return;
    dragging = false;
    const translateX = currentX - startX;

    elem.classList.remove('swiping');

    if (translateX > 100) {
      elem.style.transform = `translateX(100%)`;
      await deleteNotification(elem);
    } else {
      // Reset
      elem.style.transform = `translateX(0)`;
      elem.classList.remove('delete-ready');
    }
  };

  // Touch events
  elem.addEventListener('touchstart', (e) => {
    isTouch = true;
    start(e.touches[0].clientX);
  });

  elem.addEventListener('touchmove', (e) => {
    if (isTouch) move(e.touches[0].clientX);
  });

  elem.addEventListener('touchend', () => {
    if (isTouch) end();
  });

  // Mouse events
  elem.addEventListener('mousedown', (e) => {
    isTouch = false;
    start(e.clientX);
  });

  elem.addEventListener('mousemove', (e) => {
    if (!isTouch && dragging) move(e.clientX);
  });

  elem.addEventListener('mouseup', () => {
    if (!isTouch) end();
  });

  // Safety: Cancel drag if mouse leaves element
  elem.addEventListener('mouseleave', () => {
    if (dragging && !isTouch) end();
  });
}

async function deleteNotification(elem) {
  const notifId = elem.dataset.id;
  try {
    const token = localStorage.getItem('token');
    await fetch(`http://localhost:4000/notifications/${notifId}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    allNotifications = allNotifications.filter(n => n.id != notifId);
    renderNotifications();
  } catch (err) {
    console.error('❌ Failed to delete notification:', err);
  }
}


async function clearNotifications() {
  const token = localStorage.getItem('token');
  try {
    await fetch('http://localhost:4000/notifications/clear', {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    allNotifications = [];
    renderNotifications();
  } catch (err) {
    console.error('❌ Failed to clear notifications:', err);
  }
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
    case 'status-update': return ' Status Update';
    case 'external-status-update': return ' External Report Status Update';
    default: return ' Notification';
  }
}

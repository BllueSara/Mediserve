const radios = document.querySelectorAll('.radio-wrapper input[type="radio"]');
document.addEventListener('DOMContentLoaded', () => {
  loadUsers(); // تحميل المستخدمين من الباك عند بدء الصفحة
});

  radios.forEach(radio => {
    radio.addEventListener('change', () => {
      document.querySelectorAll('.radio-wrapper').forEach(wrapper => {
        wrapper.classList.remove('active');
      });
      if (radio.checked) {
        radio.parentElement.classList.add('active');
      }
    });
  });

  // Initialize active state on load
  document.querySelectorAll('.radio-wrapper input[type="radio"]').forEach(radio => {
    if (radio.checked) {
      radio.parentElement.classList.add('active');
    }
  });
async function loadUsers() {
  const res = await fetch('http://localhost:4000/users', {
    headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
  });

  const users = await res.json();
  const container = document.querySelector('.sidebar');
  
  // إعادة بناء القائمة
  container.innerHTML = `
    <input type="text" placeholder="Search users..." class="w-full p-2 mb-2 border rounded" />
    <button class="add-user" onclick="showAddUserModal()">+ Add New User</button>
  `;

  users.forEach(user => {
    const item = document.createElement('div');
    item.className = 'user-item flex justify-between items-center px-2 py-1 hover:bg-gray-100 cursor-pointer';
    item.innerHTML = `
      <span>${user.name}</span>
      <span class="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
    `;
    item.onclick = () => loadUserDetails(user.id);
    container.appendChild(item);
  });
}

async function loadUserDetails(userId) {
  const res = await fetch(`http://localhost:4000/users/${userId}`, {
    headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
  });

  const user = await res.json();

  // الاسم والايميل
  document.getElementById('user-name').textContent = user.name;
  document.getElementById('user-email').textContent = user.email;

  // معلومات إضافية
  const infoBox = document.getElementById('user-extra-info');
  infoBox.innerHTML = `
    <span style="color: #4b5563;">Department: ${user.department || '-'}</span>
    <span style="color: #4b5563;">Employee ID: ${user.employee_id || '-'}</span>
    <span style="color: #4b5563;">Role: ${user.role}</span>
  `;

  // الحالة
  const statusBadge = document.getElementById('user-status-badge');
  const statusText = document.getElementById('status-text');

  if (user.status === 'inactive') {
    statusBadge.style.color = '#ef4444';
    statusBadge.style.backgroundColor = '#fef2f2';
    statusText.textContent = 'Inactive';
  } else {
    statusBadge.style.color = '#10b981';
    statusBadge.style.backgroundColor = '#ecfdf5';
    statusText.textContent = 'Active';
  }

  // ربط الزرين
// عند الضغط على الحالة: تبديل الوضع
document.getElementById('user-status-badge').onclick = () => {
  toggleStatus(user.id, user.status);
};

// عند الضغط على الحذف
document.getElementById('delete-btn').onclick = () => {
  if (confirm(`Are you sure you want to delete ${user.name}?`)) {
    deleteUser(user.id);
  }
};

// عند الضغط على إعادة التعيين
document.getElementById('toggle-status-btn').onclick = () => {
  window.location.href = `/reset-password.html?user=${user.id}`;
};


  // خزن الآي دي
  window.currentUserId = userId;
}


async function savePermissions() {
  const permissions = {
    device_access: document.querySelector('input[name="device"]:checked')?.value,
    full_access: document.querySelector('#full_access').checked,
    view_access: document.querySelector('#view_access').checked,
    // ... أكمل حسب بقية الصلاحيات
  };

  await fetch(`http://localhost:4000/users/${window.currentUserId}/permissions`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + localStorage.getItem('token')
    },
    body: JSON.stringify(permissions)
  });
}
async function deleteUser(userId) {
  if (!confirm("Are you sure you want to delete this user?")) return;

  const res = await fetch(`http://localhost:4000/users/${userId}`, {
    method: 'DELETE',
    headers: {
      Authorization: 'Bearer ' + localStorage.getItem('token')
    }
  });

  if (res.ok) {
    alert("User deleted");
    loadUsers();
  }
}
async function toggleStatus(userId, currentStatus) {
  const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

  await fetch(`http://localhost:4000/users/${userId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + localStorage.getItem('token')
    },
    body: JSON.stringify({ status: newStatus })
  });

  loadUserDetails(userId);
}
function showAddUserModal() {
  const name = prompt("User name:");
  const email = prompt("Email:");
  const password = prompt("Password:");
  const department = prompt("Department:");
  const employee_id = prompt("Employee ID:");

  if (!name || !email || !password) {
    alert("Required fields missing");
    return;
  }

  fetch('http://localhost:4000/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, department, employee_id })
  })
  .then(res => res.json())
  .then(data => {
    alert("User created");
    loadUsers();
  })
  .catch(err => {
    alert("Error creating user");
    console.error(err);
  });
}

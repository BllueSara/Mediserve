const radios = document.querySelectorAll('.radio-wrapper input[type="radio"]');
document.addEventListener('DOMContentLoaded', () => {
  loadUsers(); // تحميل المستخدمين عند تشغيل الصفحة

  // تفعيل الراديوات وتخزين التغييرات مباشرة
  document.querySelectorAll('input[name="device"], #full_access, #view_access').forEach(el => {
    el.addEventListener('change', () => {
      if (window.currentUserId) {
        savePermissions(); // حفظ مباشر عند أي تغيير
      }
    });
  });

  // تفعيل النمط النشط للراديوات
  document.querySelectorAll('.radio-wrapper input[type="radio"]').forEach(radio => {
    radio.addEventListener('change', () => {
      document.querySelectorAll('.radio-wrapper').forEach(wrapper => {
        wrapper.classList.remove('active');
      });
      if (radio.checked) {
        radio.parentElement.classList.add('active');
      }
    });

    if (radio.checked) {
      radio.parentElement.classList.add('active');
    }
  });
});
[
  '#full_access',
  '#view_access',
  '#add_items',
  '#edit_items',
  '#delete_items',
  '#check_logs',
  '#edit_permission'
].forEach(id => {
  const el = document.querySelector(id);
  if (el) {
    el.addEventListener('change', () => {
      if (window.currentUserId) savePermissions();
    });
  }
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
  try {
    // 1. جلب معلومات المستخدم
    const userRes = await fetch(`http://localhost:4000/users/${userId}`, {
      headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
    });
    const user = await userRes.json();

    // 2. جلب الصلاحيات
    const permRes = await fetch(`http://localhost:4000/users/${userId}/permissions`, {
      headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
    });
    let permissions = await permRes.json();

    // 3. إذا الصلاحيات غير موجودة، احفظ القيم الافتراضية مباشرة
    const shouldSaveDefaults = !permissions?.device_access && permissions?.full_access === false;
    if (shouldSaveDefaults) {
      permissions = {
        device_access: 'all',
        full_access: true,
        view_access: true
      };

      await fetch(`http://localhost:4000/users/${userId}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + localStorage.getItem('token')
        },
        body: JSON.stringify(permissions)
      });
    }

    // 4. تحديث الواجهة
    document.getElementById('user-name').textContent = user.name;
    document.getElementById('user-email').textContent = user.email;

    const infoBox = document.getElementById('user-extra-info');
    infoBox.innerHTML = `
      <span style="color: #4b5563;">Department: ${user.department || '-'}</span>
      <span style="color: #4b5563;">Employee ID: ${user.employee_id || '-'}</span>
      <span style="color: #4b5563;">Role: ${user.role}</span>
    `;

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

    // تحديث الصلاحيات في الواجهة
    updatePermissionsUI(permissions);
    window.currentUserId = userId;

  } catch (error) {
    console.error('Error loading user details:', error);
    alert('فشل تحميل معلومات المستخدم');
  }
}


function updatePermissionsUI(permissions) {
  const deviceAccess = permissions.device_access || 'none';
  const radio = document.querySelector(`input[name="device"][value="${deviceAccess}"]`);
  if (radio) {
    radio.checked = true;
    document.querySelectorAll('.radio-wrapper').forEach(wrapper => wrapper.classList.remove('active'));
    radio.parentElement.classList.add('active');
  }

  // الرئيسية
  document.getElementById('full_access').checked = !!permissions.full_access;
  document.getElementById('view_access').checked = !!permissions.view_access;

  // الإضافية
  document.getElementById('add_items').checked = !!permissions.add_items;
  document.getElementById('edit_items').checked = !!permissions.edit_items;
  document.getElementById('delete_items').checked = !!permissions.delete_items;
  document.getElementById('check_logs').checked = !!permissions.check_logs;
  document.getElementById('edit_permission').checked = !!permissions.edit_permission;
}



async function savePermissions() {
  try {
    const permissions = {
      device_access: document.querySelector('input[name="device"]:checked')?.value || 'none',
      full_access: document.getElementById('full_access').checked,
      view_access: document.getElementById('view_access').checked,

      // الإضافية:
      add_items: document.getElementById('add_items')?.checked || false,
      edit_items: document.getElementById('edit_items')?.checked || false,
      delete_items: document.getElementById('delete_items')?.checked || false,
      check_logs: document.getElementById('check_logs')?.checked || false,
      edit_permission: document.getElementById('edit_permission')?.checked || false,
    };

    const response = await fetch(`http://localhost:4000/users/${window.currentUserId}/permissions`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + localStorage.getItem('token')
      },
      body: JSON.stringify(permissions)
    });

    if (!response.ok) throw new Error('Failed to save permissions');
    console.log("✅ Permissions saved");
  } catch (error) {
    console.error('❌ Error saving permissions:', error);
  }
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
// تعريف دالة i18n لاستخراج الترجمة من languageManager
function i18n(key) {
  const lang = languageManager.currentLang;
  return (languageManager.translations[lang] && languageManager.translations[lang][key]) || key;
}

// تعريف دالة applyTranslations لتحديث النصوص والعناوين
function applyTranslations() {
  // لكل عنصر فيه data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = i18n(key);
  });

  // لكل عنصر فيه data-i18n-placeholder
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    const text = i18n(key);
    if ('placeholder' in el) {
      el.placeholder = text;            // لو هو input/textarea
    } else {
      el.textContent = text;            // لو هو div أو span
    }
  });
}

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
  '#edit_permission',
  '#share_items'
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

// --- قسم الأقسام Dropdown ---
let departmentsData = [];

function loadDepartmentsDropdown() {
    fetch("http://localhost:4000/Departments")
        .then((response) => response.json())
        .then((data) => {
            departmentsData = data;
            renderDepartmentsDropdown();
        })
        .catch((err) => {
            console.error("Error loading departments:", err);
        });
}

function renderDepartmentsDropdown() {
    const sectionOptions = document.getElementById("department-options");
    sectionOptions.innerHTML = "";
    const lang = document.documentElement.lang || 'en';
    departmentsData.forEach((dep) => {
        let nameEn = dep.name, nameAr = dep.name;
        if (dep.name.includes("|")) {
            const parts = dep.name.split("|");
            nameEn = parts[0].trim();
            nameAr = parts[1].trim();
        }
        const optionDiv = document.createElement("div");
        optionDiv.classList.add("dropdown-option");
        optionDiv.textContent = lang === "ar" ? nameAr : nameEn;
        optionDiv.onclick = () => {
            document.getElementById("selected-department").textContent = lang === "ar" ? nameAr : nameEn;
            document.getElementById("modal_department").value = nameAr + "|" + nameEn;
            sectionOptions.style.display = "none";
        };
        sectionOptions.appendChild(optionDiv);
    });
}

// إظهار/إخفاء الدروب داون عند الضغط
if (document.getElementById("selected-department")) {
  document.getElementById("selected-department").onclick = function() {
    const options = document.getElementById("department-options");
    options.style.display = options.style.display === "block" ? "none" : "block";
  };
}

async function loadUsers() {
  const res = await fetch('http://localhost:4000/users', {
    headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
  });

  const users = await res.json();
  const container = document.querySelector('.sidebar');

  // إعادة بناء القائمة
  container.innerHTML = `<input type="text" data-i18n-placeholder="search_users" placeholder="Search users...">
  <button class="add-user" data-i18n="add_new_user" onclick="openUserModal()">+ Add New User</button>`;
  if (window.applyTranslations) applyTranslations();

  const lang = document.documentElement.lang || (localStorage.getItem('lang') || 'en');
  users.forEach(user => {
    let name = user.name;
    if (name && name.includes('|')) {
      const parts = name.split('|');
      name = lang === 'ar' ? (parts[1] || parts[0]) : parts[0];
    }
    const item = document.createElement('div');
    item.className = 'user-item flex justify-between items-center px-2 py-1 hover:bg-gray-100 cursor-pointer';
    item.innerHTML = `
      <span>${name}</span>
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
    let name = user.name;
    if (name && name.includes('|')) {
      const parts = name.split('|');
      name = (document.documentElement.lang === 'ar') ? (parts[1] || parts[0]) : parts[0];
    }
    document.getElementById('user-name').textContent = name;
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
    // بعد ما تنتهي من تحميل بيانات المستخدم وتحديث الواجهة

    // حذف المستخدم
    document.getElementById("delete-btn")?.addEventListener("click", () => {
      deleteUser(userId);
    });

    // تغيير الحالة (Active / Inactive)
    document.getElementById("user-status-badge")?.addEventListener("click", () => {
      toggleStatus(userId, user.status);
    });

    // تغيير كلمة السر
    document.getElementById("reset-password-btn")?.addEventListener("click", () => {
      resetUserPassword(userId);
    });
    document.getElementById("change-role-btn")?.addEventListener("click", () => {
changeUserRole(userId, user.role);
    });


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
  document.getElementById('share_items').checked = !!permissions.share_items;
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
      share_items: document.getElementById('share_items')?.checked || false,
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
function openUserModal() {
  document.getElementById("userModal").style.display = "flex";
  loadDepartmentsDropdown();
  applyTranslations(); // ← يدعم الترجمة
}

function closeUserModal() {
  document.getElementById("userModal").style.display = "none";
}

function submitUser() {
  const nameEn = document.getElementById("modal_name_en").value.trim();
  const nameAr = document.getElementById("modal_name_ar").value.trim();
  const name = nameEn + '|' + nameAr;
  const email = document.getElementById("modal_email").value.trim();
  const password = document.getElementById("modal_password").value.trim();
  const department = document.getElementById("modal_department").value.trim();
  const employee_id = document.getElementById("modal_employee_id").value.trim();

  if (!nameEn || !nameAr || !email || !password) {
    alert(i18n("error.requiredFields"));
    return;
  }

  fetch("http://localhost:4000/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, department, employee_id })
  })
    .then(res => res.json())
    .then(data => {
      alert(i18n("success.userCreated"));
      closeUserModal();
      // loadUsers();
    })
    .catch(err => {
      alert(i18n("error.creationFailed"));
      console.error(err);
    });
}


async function resetUserPassword(userId) {
  const t = languageManager.translations[languageManager.currentLang];
  const newPassword = prompt(t['enter_new_password'] || "Enter new password:");

  if (!newPassword || newPassword.trim() === "") {
    return alert(t['password_required'] || "Password is required");
  }

  try {
    const res = await fetch(`http://localhost:4000/users/${userId}/reset-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + localStorage.getItem('token')
      },
      body: JSON.stringify({ newPassword })
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.message);
    alert(t['password_updated'] || "Password updated successfully");
  } catch (err) {
    console.error("❌ Failed to update password:", err);
    alert(t['password_update_failed'] || "Failed to update password");
  }
}
async function changeUserRole(userId, currentRole) {
  const newRole = currentRole === 'admin' ? 'user' : 'admin';
  const confirmText = `هل أنت متأكد أنك تريد تحويل هذا المستخدم إلى ${newRole}?`;

  if (!confirm(confirmText)) return;

  try {
    const res = await fetch(`http://localhost:4000/users/${userId}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + localStorage.getItem('token')
      },
      body: JSON.stringify({ role: newRole })
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.message);

    alert(result.message);
    loadUserDetails(userId); // إعادة تحميل البيانات بعد التحديث
  } catch (err) {
    alert("❌ فشل تغيير الدور: " + err.message);
  }
}

// دعم تحديث القائمة عند تغيير اللغة
if (window.languageManager) {
  languageManager.onChange = () => {
    // يعيد ترجمة كل شيء بعد تغيير اللغة
    applyTranslations();
    // وإعادة تحميل القوائم لو تطلّب الأمر
    loadUsers();
    renderDepartmentsDropdown();
  };
}

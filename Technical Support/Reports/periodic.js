let currentType = '3months'; // 🧠 الحالة الحالية للجدول

// ✅ تحميل جدول حسب النوع (3months أو 4months)
function loadMaintenance(type) {
  currentType = type;

  const url = type === '3months' 
    ? 'http://localhost:5050/regular-maintenance-summary' 
    : 'http://localhost:5050/regular-maintenance-summary-4months';

    fetch(url, { cache: "no-store" }) // ✅ منع الكاش
    .then(res => res.json())
    .then(data => {
      const tableBody = document.getElementById("maintenance-table-body");
      tableBody.innerHTML = "";

      let total = 0;
      let completed = 0;

      data.forEach(item => {
        if (!item.device_name) return;

        total++;
        if (item.status === 'Completed') completed++;

        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${item.device_name}</td>
          <td>${item.device_type}</td>
          <td>${formatDate(item.last_maintenance_date)}</td>
          <td>${formatDate(item.next_due_date)}</td>
          <td>
            <select onchange="updateStatus(${item.id}, this)" class="status-select ${getStatusClass(item.status)}">
              <option value="Open" ${item.status === 'Open' ? 'selected' : ''}>Open</option>
              <option value="In Progress" ${item.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
              <option value="Closed" ${item.status === 'Closed' ? 'selected' : ''}>Closed</option>
            </select>
          </td>
        `;
        
        tableBody.appendChild(row);
      });

      updateHeaderCounts(completed, total, type);
      updateActiveButton(type);
    })
    .catch(error => {
      console.error("❌ Error loading table:", error);
    });
}

// ✅ تحديث العداد والشريط حسب النوع
function updateHeaderCounts(completed, total, type = '3months') {
  const percentage = total > 0 ? (completed / total) * 100 : 0;

  if (type === '3months') {
    document.querySelector('.progress-count-3months').textContent = `${completed}/${total}`;
    document.querySelector('.progress-bar-3months').style.width = `${percentage}%`;
  } else {
    document.querySelector('.progress-count-4months').textContent = `${completed}/${total}`;
    document.querySelector('.progress-bar-4months').style.width = `${percentage}%`;
  }
}

// ✅ تحديث الحالة في قاعدة البيانات
function updateStatus(id, selectElement) {
  const newStatus = selectElement.value;

  fetch(`http://localhost:5050/update-report-status/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: newStatus })
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message || "✅ Status updated");

      // ✅ غير كلاس السلكت فقط (بدون reload)
      selectElement.className = `status-select ${getStatusClass(newStatus)}`;

      // ✅ حدّث فقط العداد والشريط
      updateSummaryCountsOnly();
    })
    .catch(err => {
      console.error("❌ Error updating status:", err);
      alert("❌ Failed to update status");
    });
}

function updateSummaryCountsOnly() {
  const url = currentType === '3months'
    ? 'http://localhost:5050/regular-maintenance-summary'
    : 'http://localhost:5050/regular-maintenance-summary-4months';

  fetch(url)
    .then(res => res.json())
    .then(data => {
      let total = 0;
      let completed = 0;
      data.forEach(item => {
        if (!item.device_name) return;
        total++;
        if (item.status === 'Completed') completed++;
      });

      updateHeaderCounts(completed, total, currentType);
    })
    .catch(err => console.error("❌ Error loading updated counts:", err));
}

// ✅ إعادة تحميل الجدول الحالي بعد التحديث
function reloadTable() {
  loadMaintenance(currentType);
}

// ✅ تحديد ألوان الحالة
function getStatusClass(status) {
  if (!status) return "pending";
  const statusClean = status.toLowerCase();
  if (statusClean === "completed" || statusClean === "closed") return "completed";
  if (statusClean === "in progress") return "in-progress";
  return "pending";
}

// ✅ تنسيق التاريخ
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toISOString().split("T")[0];
}

// ✅ تغيير الزر النشط في الأعلى
function updateActiveButton(type) {
  document.getElementById("btn-3months").classList.remove("active");
  document.getElementById("btn-4months").classList.remove("active");
  document.getElementById(`btn-${type}`).classList.add("active");
}

// ✅ عند بداية التشغيل
document.addEventListener("DOMContentLoaded", () => {
  // تحميل جدول 3 شهور افتراضيًا
  loadMaintenance("3months");

  // ✅ تحميل عدادات 4 شهور مباشرة (بدون جدول)
  fetch('http://localhost:5050/regular-maintenance-summary-4months')
    .then(res => res.json())
    .then(data => {
      let total = 0;
      let completed = 0;

      data.forEach(item => {
        if (!item.device_name) return;
        total++;
        if (item.status === 'Completed') completed++;
      });

      updateHeaderCounts(completed, total, "4months");
    })
    .catch(err => {
      console.error("❌ Error loading 4-month summary:", err);
    });

  // أزرار التبديل بين الجداول
  document.getElementById("btn-3months").addEventListener("click", () => {
    loadMaintenance("3months");
  });

  document.getElementById("btn-4months").addEventListener("click", () => {
    loadMaintenance("4months");
  });
});

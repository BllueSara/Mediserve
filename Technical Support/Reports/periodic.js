// ✅ 1. تحميل بيانات الأجهزة وعرضها في الجدول + تحديث العداد مباشرة
fetch('http://localhost:5050/regular-maintenance-summary')
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
            <option value="Pending" ${item.status === 'Pending' ? 'selected' : ''}>Pending</option>
            <option value="Completed" ${item.status === 'Completed' ? 'selected' : ''}>Completed</option>
            <option value="Overdue" ${item.status === 'Overdue' ? 'selected' : ''}>Overdue</option>
          </select>
        </td>
      `;
      tableBody.appendChild(row);
    });

    updateHeaderCounts(completed, total); // ✅ من نفس الجدول
  })
  .catch(error => {
    console.error("❌ Error loading table:", error);
  });


// ✅ 2. تحديث الرقم والشريط العلوي
function updateHeaderCounts(completed, total) {
  const percentage = total > 0 ? (completed / total) * 100 : 0;

  document.querySelector('.progress-count-3months').textContent = `${completed}/${total}`;
  document.querySelector('.progress-bar-3months').style.width = `${percentage}%`;
}


// ✅ 3. إرسال تحديث الحالة إلى السيرفر
function updateStatus(id, selectElement) {
  const newStatus = selectElement.value;

  fetch(`http://localhost:5050/update-maintenance-status/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: newStatus })
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message || "✅ Status updated");
      selectElement.className = `status-select ${getStatusClass(newStatus)}`;

      // 🔁 أعد تحميل الجدول بالكامل بعد التحديث
      reloadTable();
    })
    .catch(err => {
      console.error("❌ Failed to update status:", err);
      alert("❌ Failed to update status");
    });
}


// ✅ 4. إعادة تحميل الجدول (تستخدمها بعد تعديل الحالة)
function reloadTable() {
  fetch('http://localhost:5050/regular-maintenance-summary')
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
              <option value="Pending" ${item.status === 'Pending' ? 'selected' : ''}>Pending</option>
              <option value="Completed" ${item.status === 'Completed' ? 'selected' : ''}>Completed</option>
              <option value="Overdue" ${item.status === 'Overdue' ? 'selected' : ''}>Overdue</option>
            </select>
          </td>
        `;
        tableBody.appendChild(row);
      });

      updateHeaderCounts(completed, total);
    });
}


// ✅ مساعدات
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toISOString().split("T")[0]; // yyyy-mm-dd
}

function getStatusClass(status) {
  if (status === 'Completed') return 'completed';
  if (status === 'Pending') return 'pending';
  return 'overdue';
}

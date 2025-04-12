// ✅ 1. تحميل بيانات الأجهزة وعرضها في الجدول
fetch('http://localhost:5050/regular-maintenance-summary')
  .then(res => res.json())
  .then(data => {
    const tableBody = document.getElementById("maintenance-table-body");
    tableBody.innerHTML = "";

    data.forEach(item => {
      if (!item.device_name) return;

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${item.device_name}</td>
        <td>${item.device_type}</td>
        <td>${formatDate(item.last_maintenance_date)}</td>
        <td>${formatDate(item.next_due_date)}</td>
        <td><span class="status ${getStatusClass(item.status)}">${item.status}</span></td>
      `;
      tableBody.appendChild(row);
    });
  })
  .catch(error => {
    console.error("❌ Error loading table:", error);
  });


// ✅ 2. تحميل الإحصائيات وتحديث الأرقام والشريط
fetch('http://localhost:5050/maintenance-stats')
  .then(res => res.json())
  .then(data => {
    const completed = data.completed || 0;
    const total = data.total || 0;
    const percentage = total > 0 ? (completed / total) * 100 : 0;

    // ✅ تحديث الرقم
    document.querySelector('.progress-count-3months').textContent = `${completed}/${total}`;

    // ✅ تحديث البار
    document.querySelector('.progress-bar-3months').style.width = `${percentage}%`;
  })
  .catch(error => {
    console.error("❌ Error loading stats:", error);
  });


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

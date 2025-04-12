fetch('http://localhost:5050/regular-maintenance-summary')
  .then(res => res.json())
  .then(data => {
    const tableBody = document.getElementById("maintenance-table-body");
    tableBody.innerHTML = "";

    data.forEach(item => {
      // ✅ تخطي الأجهزة اللي بدون اسم
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
    console.error("Error fetching data:", error);
  });

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toISOString().split("T")[0]; // ➜ فقط yyyy-mm-dd
}

function getStatusClass(status) {
  if (status === 'Completed') return 'completed';
  if (status === 'Pending') return 'pending';
  return 'overdue';
}



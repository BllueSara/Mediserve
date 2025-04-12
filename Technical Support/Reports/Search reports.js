document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const page = urlParams.get('page') || 1; // الصفحة 1 افتراضيًا
  loadReports(page); // تحميل التقارير للصفحة 1 أو الصفحة المحددة

  // Pagination Buttons
  document.querySelectorAll(".pagination .page-btn[data-page]").forEach(button => {
    button.addEventListener("click", () => {
      const page = button.dataset.page;
      if (page) {
        loadReports(page); // تحميل التقارير بناءً على الرقم المحدد
      }
    });
  });

  // Previous Button
  document.getElementById("prev-btn")?.addEventListener("click", () => {
    const currentPage = parseInt(new URLSearchParams(window.location.search).get('page') || "1");
    if (currentPage > 1) {
      loadReports(currentPage - 1);
    }
  });

  // Next Button
  document.getElementById("next-btn")?.addEventListener("click", () => {
    const currentPage = parseInt(new URLSearchParams(window.location.search).get('page') || "1");
    loadReports(currentPage + 1);
  });
});

// Function to load reports
function loadReports(page) {
  fetch(`http://localhost:5050/get-internal-reports?page=${page}`)
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById("report-list");
      container.innerHTML = ""; // Reset content

      if (!data.length) {
        container.innerHTML = "<p>No reports found.</p>";
        return;
      }

      data.forEach(report => {
        const card = document.createElement("div");
        card.className = "report-card";

        const statusClass = getStatusClass(report.status);

        const maintenanceType = report.maintenance_type || "General"; // استخدم هنا الحقل الذي يحدد النوع

        card.innerHTML = `
          <div class="report-card-header">
            <img src="/icon/Maintenance.png" alt="Maintenance Icon" />
            ${maintenanceType} Maintenance
            <select onchange="updateReportStatus(${report.id}, this)" class="status-select ${statusClass}">
              <option value="Open" ${report.status === "Open" ? "selected" : ""}>Open</option>
              <option value="In Progress" ${report.status === "In Progress" ? "selected" : ""}>In Progress</option>
              <option value="Closed" ${report.status === "Closed" ? "selected" : ""}>Closed</option>
            </select>
          </div>

          <div class="report-details">
            <img src="/icon/desktop.png" alt="Device Icon" />
            <span>${formatDateTime(report.created_at)}</span>
          </div>

          <p><strong>Ticket:</strong> ${report.ticket_number || "N/A"}</p>
          <p><strong>Device:</strong> ${report.device_name || "N/A"}</p>
          <p><strong>Department:</strong> ${report.department_name || "N/A"}</p>
          <p><strong>Issue:</strong> ${report.issue_summary || "No issue summary"}</p>
        `;

        container.appendChild(card);
      });

      // Update pagination
      updatePagination(page);
    })
    .catch(err => {
      console.error("❌ Error loading reports:", err);
      document.getElementById("report-list").innerHTML = "<p>Error loading reports.</p>";
    });
}

// Update pagination
function updatePagination(currentPage) {
  const paginationButtons = document.querySelectorAll(".pagination .page-btn");
  paginationButtons.forEach(button => {
    button.classList.remove("active");
    if (button.dataset.page == currentPage) {
      button.classList.add("active");
    }
  });
}

// Format date & time
function formatDateTime(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

// Return color class based on report status
function getStatusClass(status) {
  if (!status) return "pending";
  const statusClean = status.toLowerCase();
  if (statusClean === "completed" || statusClean === "closed") return "completed";
  if (statusClean === "in progress") return "in-progress";
  return "pending";
}

// Update report status
function updateReportStatus(id, selectElement) {
  const newStatus = selectElement.value;

  fetch(`http://localhost:5050/update-report-status/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: newStatus })
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message || "✅ Status updated successfully");
      selectElement.className = `status-select ${getStatusClass(newStatus)}`;
    })
    .catch(err => {
      console.error("❌ Failed to update report status:", err);
      alert("❌ Failed to update status");
    });
}

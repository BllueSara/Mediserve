// Wait for the DOM to fully load before running any script
document.addEventListener("DOMContentLoaded", () => {
  // Extract page number from URL parameters or default to 1
  const urlParams = new URLSearchParams(window.location.search);
  const page = urlParams.get('page') || 1;
  loadReports(page); // Load reports for the current page

  // Handle page number button clicks
  document.querySelectorAll(".pagination .page-btn[data-page]").forEach(button => {
    button.addEventListener("click", () => {
      const page = button.dataset.page;
      if (page) {
        loadReports(page); // Load reports for the selected page
      }
    });
  });

  // Handle Previous button click
  document.getElementById("prev-btn")?.addEventListener("click", () => {
    const currentPage = parseInt(new URLSearchParams(window.location.search).get('page') || "1");
    if (currentPage > 1) {
      loadReports(currentPage - 1); // Load previous page
    }
  });

  // Handle Next button click
  document.getElementById("next-btn")?.addEventListener("click", () => {
    const currentPage = parseInt(new URLSearchParams(window.location.search).get('page') || "1");
    loadReports(currentPage + 1); // Load next page
  });
});

// Load reports from the server and filter by status if needed
function loadReports(page) {
  const statusFilter = localStorage.getItem("reportStatusFilter"); // Check for status filter in localStorage

  fetch(`http://localhost:5050/get-internal-reports?page=${page}`)
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById("report-list");
      container.innerHTML = ""; // Clear the current content

      // Filter reports by status if filter is set
      if (statusFilter) {
        data = data.filter(report => report.status?.toLowerCase() === statusFilter.toLowerCase());
      }

      // Show message if no reports match the filter
      if (!data.length) {
        container.innerHTML = "<p>No reports found.</p>";
        return;
      }

      // Render each report card
      data.forEach(report => {
        const card = document.createElement("div");
        card.className = "report-card";

        const statusClass = getStatusClass(report.status);
        const maintenanceType = report.maintenance_type || "General";

        card.innerHTML = `
          <div class="report-card-header">
            <img src="/icon/Maintenance.png" alt="Maintenance Icon" />
            <span>${maintenanceType} Maintenance</span>
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

      updatePagination(page); // Refresh pagination buttons

      localStorage.removeItem("reportStatusFilter"); // Clean up the status filter after use
    })
    .catch(err => {
      console.error("❌ Error loading reports:", err);
      document.getElementById("report-list").innerHTML = "<p>Error loading reports.</p>";
    });
}

// Highlight the current page button in pagination
function updatePagination(currentPage) {
  const paginationButtons = document.querySelectorAll(".pagination .page-btn");
  paginationButtons.forEach(button => {
    button.classList.remove("active");
    if (button.dataset.page == currentPage) {
      button.classList.add("active");
    }
  });
}

// Convert a date string to a formatted date/time
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

// Get the CSS class for the report status
function getStatusClass(status) {
  if (!status) return "pending";
  const statusClean = status.toLowerCase();
  if (statusClean === "completed" || statusClean === "closed") return "completed";
  if (statusClean === "in progress") return "in-progress";
  return "pending";
}

// Send an update request to change the report status
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

// Re-apply status filter from localStorage if set
document.addEventListener("DOMContentLoaded", () => {
  const status = localStorage.getItem("reportStatusFilter");
  if (status) {
    const filterDropdown = document.getElementById("filter-status");
    if (filterDropdown) {
      filterDropdown.value = status;
      filterDropdown.dispatchEvent(new Event("change"));
    }
    localStorage.removeItem("reportStatusFilter");
  }
});

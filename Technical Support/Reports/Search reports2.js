document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const page = urlParams.get("page") || 1;
  loadExternalReports(page);

  // Pagination
  document.querySelectorAll(".pagination .page-btn[data-page]").forEach(button => {
    button.addEventListener("click", () => {
      const page = button.dataset.page;
      if (page) loadExternalReports(page);
    });
  });

  document.getElementById("prev-btn")?.addEventListener("click", () => {
    const currentPage = parseInt(new URLSearchParams(window.location.search).get("page") || "1");
    if (currentPage > 1) loadExternalReports(currentPage - 1);
  });

  document.getElementById("next-btn")?.addEventListener("click", () => {
    const currentPage = parseInt(new URLSearchParams(window.location.search).get("page") || "1");
    loadExternalReports(currentPage + 1);
  });

  document.getElementById("filter-type").addEventListener("change", () => loadExternalReports(1));
  document.getElementById("filter-status").addEventListener("change", () => loadExternalReports(1));
  document.getElementById("search-input").addEventListener("input", () => loadExternalReports(1));
});

// Function to load external reports
function loadExternalReports(page) {
  fetch(`http://localhost:5050/get-external-reports?page=${page}`)
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById("report-list");
      container.innerHTML = "";

      const selectedType = document.getElementById("filter-type").value;
      const selectedStatus = document.getElementById("filter-status").value;
      const searchTerm = document.getElementById("search-input").value.toLowerCase();

      const filtered = data.filter(report => {
        const statusMatch = !selectedStatus || report.status === selectedStatus;
        const typeMatch = !selectedType || report.category === selectedType;
        const searchMatch =
          !searchTerm ||
          (report.request_number && report.request_number.toLowerCase().includes(searchTerm)) ||
          (report.device_name && report.device_name.toLowerCase().includes(searchTerm)) ||
          (report.department_name && report.department_name.toLowerCase().includes(searchTerm));
        return statusMatch && typeMatch && searchMatch;
      });

      if (!filtered.length) {
        container.innerHTML = "<p>No reports match your filters.</p>";
        return;
      }

      filtered.forEach(report => {
        const card = document.createElement("div");
        card.className = "report-card";

        const statusClass = getStatusClass(report.status);

        card.innerHTML = `
          <div class="report-card-header">
            <img src="/icon/Maintenance.png" alt="Maintenance Icon" />
            External Maintenance
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

          <p><strong>Request No:</strong> ${report.request_number || "N/A"}</p>
          <p><strong>Device:</strong> ${report.device_name || "N/A"}</p>
          <p><strong>Department:</strong> ${report.department_name || "N/A"}</p>
          <p><strong>Issue:</strong> ${report.issue_summary || "No issue summary"}</p>
        `;

        container.appendChild(card);
          
        card.addEventListener("click", () => {
          window.location.href = `report-details.html?id=${report.id}&type=external`; // أو external
        });
        
   
      });

      updatePagination(page);
    })
    .catch(err => {
      console.error("❌ Error loading external reports:", err);
      document.getElementById("report-list").innerHTML = "<p>Error loading reports.</p>";
    });
}

// Same utility functions
function updatePagination(currentPage) {
  const paginationButtons = document.querySelectorAll(".pagination .page-btn");
  paginationButtons.forEach(button => {
    button.classList.remove("active");
    if (button.dataset.page == currentPage) {
      button.classList.add("active");
    }
  });
}

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

function getStatusClass(status) {
  if (!status) return "pending";
  const s = status.toLowerCase();
  if (s === "closed" || s === "completed") return "completed";
  if (s === "in progress") return "in-progress";
  return "pending";
}

function updateReportStatus(id, selectElement) {
  const newStatus = selectElement.value;
  fetch(`http://localhost:5050/update-external-report-status/${id}`, {
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
      console.error("❌ Failed to update external report status:", err);
      alert("❌ Failed to update status");
    });
}

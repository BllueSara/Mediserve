document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const page = urlParams.get("page") || 1;
  loadExternalReports(page);

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
        const isTicket = report.issue_summary?.toLowerCase().includes("ticket created");

        let typeMatch = true;
        if (selectedType === "Ticket") typeMatch = isTicket;
        else if (selectedType === "Maintenance") typeMatch = !isTicket;

        const statusMatch = !selectedStatus || report.status === selectedStatus;
        const searchMatch =
          !searchTerm ||
          (report.ticket_number && report.ticket_number.toLowerCase().includes(searchTerm)) ||
          (report.device_name && report.device_name.toLowerCase().includes(searchTerm)) ||
          (report.department_name && report.department_name.toLowerCase().includes(searchTerm));

        return typeMatch && statusMatch && searchMatch;
      });

      if (!filtered.length) {
        container.innerHTML = "<p>No reports match your filters.</p>";
        return;
      }

      filtered.forEach(report => {
        const card = document.createElement("div");
        card.className = "report-card";

        const statusClass = getStatusClass(report.status);
        const isTicket = report.issue_summary?.toLowerCase().includes("ticket created");

        let issueHtml = "";
        if (!isTicket) {
          let initial = report.issue_summary?.trim();
          let final = report.full_description?.trim();

          issueHtml = `
            <div class="report-issue-line">
              ${initial ? `<span><strong>Initial Diagnosis:</strong> ${initial}</span>` : ""}
              ${final ? `<span><strong>Final Diagnosis:</strong> ${final}</span>` : ""}
            </div>
          `;
        }

        card.innerHTML = `
          <div class="report-card-header">
            <img src="/icon/${isTicket ? "ticket" : "Maintenance"}.png" alt="icon" />
            ${isTicket ? "Ticket - External Maintenance" : "External Maintenance"}
            <select class="status-select ${statusClass}">
              <option value="Open" ${report.status === "Open" ? "selected" : ""}>Open</option>
              <option value="In Progress" ${report.status === "In Progress" ? "selected" : ""}>In Progress</option>
              <option value="Closed" ${report.status === "Closed" ? "selected" : ""}>Closed</option>
            </select>
          </div>

          <div class="report-details">
            <img src="/icon/desktop.png" alt="Device Icon" />
            <span>${formatDateTime(report.created_at)}</span>
          </div>

          <p><strong>Ticket Number:</strong> ${report.ticket_number || "N/A"}</p>
          <p><strong>Device:</strong> ${report.device_name || "N/A"}</p>
          <p><strong>Department:</strong> ${report.department_name || "N/A"}</p>
          ${issueHtml}
        `;

        // ✅ منع التنقل للكرت إذا ضغطنا على select أو عناصر مشابهة
        card.addEventListener("click", (e) => {
          if (e.target.closest("select, option")) return;
          window.location.href = `report-details.html?id=${report.id}&type=external`;
        });

        // ✅ تحديث الحالة عند التغيير
        const statusSelect = card.querySelector("select.status-select");
        statusSelect.addEventListener("click", e => e.stopPropagation());
        statusSelect.addEventListener("change", e => {
          e.stopPropagation();
          updateReportStatus(report.id, e.target);
        });

        container.appendChild(card);
      });

      updatePagination(page);
    })
    .catch(err => {
      console.error("❌ Error loading external reports:", err);
      document.getElementById("report-list").innerHTML = "<p>Error loading reports.</p>";
    });
}

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

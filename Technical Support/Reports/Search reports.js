document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const page = urlParams.get('page') || 1;
  loadReports(page);

  document.querySelectorAll(".pagination .page-btn[data-page]").forEach(button => {
    button.addEventListener("click", () => {
      const page = button.dataset.page;
      if (page) loadReports(page);
    });
  });
  // ✅ تحميل أنواع الأجهزة (بما فيها الأنواع الجديدة)

    const select = document.getElementById("filter-device-type");
    if (!select) {
      console.warn("⚠️ filter-device-type not found in DOM!");
      return;
    }
  
    fetch("http://localhost:5050/device-types")
      .then(res => res.json())
      .then(deviceTypes => {
        console.log("📦 Fetched device types:", deviceTypes);
        const known = ["pc", "printer", "scanner"];
        const existing = new Set(known.map(t => t.toLowerCase()));
  
        deviceTypes.forEach(type => {
          type = type.trim();
          if (!existing.has(type.toLowerCase())) {
            const opt = document.createElement("option");
            opt.value = type;
            opt.textContent = type;
            select.appendChild(opt);
          }
        });
      })        
      .catch(err => console.error("❌ Failed to load device types:", err));
  

  document.getElementById("prev-btn")?.addEventListener("click", () => {
    const currentPage = parseInt(new URLSearchParams(window.location.search).get('page') || "1");
    if (currentPage > 1) loadReports(currentPage - 1);
  });
  document.getElementById("filter-type").addEventListener("change", () => loadReports(1));
  document.getElementById("filter-status").addEventListener("change", () => loadReports(1));
  document.getElementById("search-input").addEventListener("input", () => loadReports(1));
  document.getElementById("filter-date-from").addEventListener("change", () => loadReports(1));
  document.getElementById("filter-date-to").addEventListener("change", () => loadReports(1));
  document.getElementById("filter-device-type").addEventListener("change", () => loadReports(1));

  
  document.getElementById("next-btn")?.addEventListener("click", () => {
    const currentPage = parseInt(new URLSearchParams(window.location.search).get('page') || "1");
    loadReports(currentPage + 1);
  });

  // Load status filter if available
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

function loadReports(page = 1) {
  fetch(`http://localhost:5050/get-internal-reports?page=${page}`)
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById("report-list");
      container.innerHTML = "";
      
      // قراءة الفلاتر
      const type = document.getElementById("filter-type")?.value;
      const status = document.getElementById("filter-status")?.value;
      const search = document.getElementById("search-input")?.value.toLowerCase();
      const dateFrom = document.getElementById("filter-date-from")?.value;
      const dateTo = document.getElementById("filter-date-to")?.value;
      const deviceType = document.getElementById("filter-device-type")?.value;

      const filtered = data.filter(report => {
        const createdAt = new Date(report.created_at);
        const isTicket = report.issue_summary?.includes("Ticket Created");
        const isNewReport = !report.ticket_id; // يعني report ما له تذكرة
      
        let typeMatch = true;
      
        // ✅ ضبط الأنواع حسب اللي طلبته
        if (type === "Maintenance") {
          typeMatch =  !isTicket;
        } else if (type === "Ticket") {
          typeMatch = isTicket;
        } else if (type === "New") {
          typeMatch = isNewReport;
        }
      
        // باقي الفلاتر
        let statusMatch = !status || report.status === status;
      
        let searchMatch =
          !search ||
          (report.device_name?.toLowerCase().includes(search)) ||
          (report.department_name?.toLowerCase().includes(search)) ||
          (report.ticket_number?.toLowerCase().includes(search));
      
        let dateMatch = true;
        if (dateFrom) dateMatch = createdAt >= new Date(dateFrom);
        if (dateTo) dateMatch = dateMatch && createdAt <= new Date(dateTo);
        let deviceTypeMatch = !deviceType || (report.device_type?.toLowerCase() === deviceType.toLowerCase());

        return typeMatch && statusMatch && searchMatch && dateMatch && deviceTypeMatch;      });
      

      if (!filtered.length) {
        container.innerHTML = "<p>No matching reports found.</p>";
        return;
      }

      if (!data.length) {
        container.innerHTML = "<p>No reports found. Try refreshing or changing filters.</p>";
        return;
      }

      filtered.forEach(report => {
        const card = document.createElement("div");
        card.className = "report-card";

        // Maintenance Type Flags
        const isRegular = report.maintenance_type === "Regular";
        const isTicketOnly = report.issue_summary?.includes("Ticket Created");

        // Icon & Label
        let maintenanceLabel = "";
        let iconSrc = "";

        if (isTicketOnly && isRegular) {
          maintenanceLabel = "Ticket - Regular Maintenance";
          iconSrc = "/icon/ticket.png";
        } else if (isTicketOnly && !isRegular) {
          maintenanceLabel = "Ticket - General Maintenance";
          iconSrc = "/icon/ticket.png";
        } else if (isRegular) {
          maintenanceLabel = "Regular Maintenance";
          iconSrc = "/icon/Maintenance.png";
        } else {
          maintenanceLabel = "General Maintenance";
          iconSrc = "/icon/maintenance.png";
        }

        // Content Builder
        let issueHtml = "";

        if (isTicketOnly) {
          // Show ONLY ticket, device, department
          issueHtml = `
            <div style="background:#e8f4ff;padding:10px;border-radius:6px">
              <strong>Ticket Number:</strong> ${report.ticket_number}<br>
              <strong>Device:</strong> ${report.device_name || "N/A"}<br>
              <strong>Department:</strong> ${report.department_name || "N/A"}
            </div>
          `;
        } else if (isRegular) {
          // Checklist for Regular Maintenance
          let checklistItems = [];
          try {
            checklistItems = JSON.parse(report.issue_summary || "[]");
          } catch (e) {
            console.warn("⚠️ Failed to parse checklist:", e);
          }

          issueHtml = `
            <ul style="margin-left: 20px;">
              ${checklistItems.map(i => `<li>${i}</li>`).join("") || "<li>No issues listed</li>"}
            </ul>
            ${report.full_description
              ? `<div style="margin-top:10px;background:#f2f2f2;padding:8px;border-radius:6px">
                  <strong>Notes:</strong><br>${report.full_description}
                </div>` : ""}
          `;
        } else {
          // General Maintenance with issue & diagnosis on same line
          let issue = "";
          let diagnosis = "";

          if (report.issue_summary?.toLowerCase().startsWith("problem:")) {
            issue = report.issue_summary.replace(/^problem:\s*/i, "");
          } else if (report.issue_summary?.toLowerCase().startsWith("selected issue:")) {
            issue = report.issue_summary.replace(/^selected issue:\s*/i, "");
          } else {
            issue = report.issue_summary || "";
          }

          if (report.full_description?.toLowerCase().startsWith("initialdiagnosis:")) {
            diagnosis = report.full_description.replace(/^initialdiagnosis:\s*/i, "");
          } else if (report.full_description?.toLowerCase().startsWith("initial diagnosis:")) {
            diagnosis = report.full_description.replace(/^initial diagnosis:\s*/i, "");
          } else {
            diagnosis = report.full_description || "";
          }

          issueHtml = `
          <div class="report-issue-line">
            ${issue ? `<span><strong>Selected Issue:</strong> ${issue}</span>` : ""}
            ${diagnosis ? `<span><strong>Initial Diagnosis:</strong> ${diagnosis}</span>` : ""}
          </div>
        `;

        }

        // Card Layout
        card.innerHTML = `
          <div class="report-card-header">
            <img src="${iconSrc}" alt="icon" />
            <span>${maintenanceLabel}</span>
            <select 
            data-report-id="${report.id}" 
            data-ticket-id="${report.ticket_id || ''}" 
           onchange="updateReportStatus(${report.id}, this)" 
           class="status-select ${getStatusClass(report.status)}">

              <option value="Open" ${report.status === "Open" ? "selected" : ""}>Open</option>
              <option value="In Progress" ${report.status === "In Progress" ? "selected" : ""}>In Progress</option>
              <option value="Closed" ${report.status === "Closed" ? "selected" : ""}>Closed</option>
            </select>
          </div>
          <div class="report-details">
            <img src="/icon/desktop.png" alt="device" />
            <span>${formatDateTime(report.created_at)}</span>
          </div>
          <p><strong>Ticket Number:</strong> ${report.ticket_number || "N/A"}</p>
          <p><strong>Device:</strong> ${report.device_name || "N/A"}</p>
          <p><strong>Department:</strong> ${report.department_name || "N/A"}</p>
          ${!isTicketOnly ? `<p><strong>Issue:</strong><br>${issueHtml}</p>` : ""}
        `;

        container.appendChild(card);

        card.addEventListener("click", () => {
          window.location.href = `report-details.html?id=${report.id}&type=internal`; // أو external
        });
        
        
      });

      updatePagination(page);
    })
    .catch(err => {
      console.error("❌ Error:", err);
      document.getElementById("report-list").innerHTML = "<p>Error loading reports</p>";
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
  const statusClean = status.toLowerCase();
  if (statusClean === "completed" || statusClean === "closed") return "completed";
  if (statusClean === "in progress") return "in-progress";
  return "pending";
}
function updateReportStatus(reportId, selectElement) {
  const newStatus = selectElement.value;
  const ticketId = selectElement.getAttribute("data-ticket-id");

  fetch(`http://localhost:5050/update-report-status/${reportId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: newStatus })
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message || "✅ Status updated successfully");

      // ✅ حدّث كل القوائم المرتبطة بنفس التذكرة
      if (ticketId) {
        document.querySelectorAll(`select[data-ticket-id="${ticketId}"]`).forEach(dropdown => {
          dropdown.value = newStatus;
          dropdown.className = `status-select ${getStatusClass(newStatus)}`;
        });
      } else {
        // إذا ما في تذكرة، حدّث حسب report فقط
        document.querySelectorAll(`select[data-report-id="${reportId}"]`).forEach(dropdown => {
          dropdown.value = newStatus;
          dropdown.className = `status-select ${getStatusClass(newStatus)}`;
        });
      }
    })
    .catch(err => {
      console.error("❌ Failed to update report status:", err);
      alert("❌ Failed to update status");
    });
}

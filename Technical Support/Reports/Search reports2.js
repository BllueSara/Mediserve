document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const page = urlParams.get("page") || 1;

  // ✅ تحميل نوع الجهاز
  const deviceTypeSelect = document.getElementById("filter-device-type");
  if (deviceTypeSelect) {
    fetch("http://localhost:5050/device-types")
      .then(res => res.json())
      .then(deviceTypes => {
        const existing = new Set(["pc", "printer", "scanner"]);
        deviceTypes.forEach(type => {
          type = type.trim();
          if (!existing.has(type.toLowerCase())) {
            const opt = document.createElement("option");
            opt.value = type;
            opt.textContent = type;
            deviceTypeSelect.appendChild(opt);
          }
        });
      })
      .catch(err => console.error("❌ Failed to load device types:", err));
  }

  // ✅ تحميل الفلتر من localStorage إذا موجود
  const savedStatus = localStorage.getItem("reportStatusFilter");
  if (savedStatus && document.getElementById("filter-status")) {
    document.getElementById("filter-status").value = savedStatus;
    localStorage.removeItem("reportStatusFilter");
  }

  // ✅ تحميل التقارير
  loadExternalReports(page);

  // أزرار التنقل
  document.querySelector(".new-report-btn")?.addEventListener("click", () => {
    window.location.href = "Newreport.html";
  });

  document.querySelectorAll(".pagination .page-btn[data-page]").forEach(button => {
    button.addEventListener("click", () => {
      const page = button.dataset.page;
      if (page) loadExternalReports(page);
    });
  });

  document.getElementById("prev-btn")?.addEventListener("click", () => {
    const currentPage = parseInt(urlParams.get("page") || "1");
    if (currentPage > 1) loadExternalReports(currentPage - 1);
  });

  document.getElementById("next-btn")?.addEventListener("click", () => {
    const currentPage = parseInt(urlParams.get("page") || "1");
    loadExternalReports(currentPage + 1);
  });

  // ✅ فلترة
  ["filter-type", "filter-status", "search-input", "filter-date-from", "filter-date-to", "filter-device-type"]
    .forEach(id => {
      document.getElementById(id)?.addEventListener("change", () => loadExternalReports(1));
      document.getElementById(id)?.addEventListener("input", () => loadExternalReports(1));
    });
});
t = (key, fallback = '') => languageManager.translations[languageManager.currentLang]?.[key] || fallback || key;

function loadExternalReports(page = 1) {
  const token = localStorage.getItem('token');

  fetch(`http://localhost:5050/get-external-reports?page=${page}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById("report-list");
      container.innerHTML = "";

      const type = document.getElementById("filter-type")?.value;
      const status = document.getElementById("filter-status")?.value;
      const search = document.getElementById("search-input")?.value.toLowerCase();
      const dateFrom = document.getElementById("filter-date-from")?.value;
      const dateTo = document.getElementById("filter-date-to")?.value;
      const deviceType = document.getElementById("filter-device-type")?.value;

      const filtered = data.filter(report => {
        const createdAt = new Date(report.created_at);
        const isTicket =
          report.source === "external-new" ||
          (report.source === "external-legacy" &&
           report.issue_summary?.toLowerCase().includes("ticket") || 
           report.full_description?.toLowerCase().includes("ticket"));
        const isNew = report.source === "new";
        const isExternalNew = report.source === "external-new";
        const isExternalLegacy = report.source === "external-legacy";

        let typeMatch = true;
        if (type === "Ticket") typeMatch = isTicket;
        else if (type === "Maintenance") typeMatch = !isTicket && (isExternalLegacy || isExternalNew);
        else if (type === "New") typeMatch = isNew;

        const statusMatch = !status || report.status?.trim().toLowerCase() === status.trim().toLowerCase();
        const searchMatch =
          !search ||
          report.device_name?.toLowerCase().includes(search) ||
          report.department_name?.toLowerCase().includes(search) ||
          report.ticket_number?.toLowerCase().includes(search);

        let dateMatch = true;
        if (dateFrom) dateMatch = createdAt >= new Date(dateFrom);
        if (dateTo) dateMatch = dateMatch && createdAt <= new Date(dateTo);

        const deviceMatch = !deviceType || report.device_type?.toLowerCase() === deviceType.toLowerCase();

        return typeMatch && statusMatch && searchMatch && dateMatch && deviceMatch;
      });

      const reportsPerPage = 4;
      const totalReports = filtered.length;
      const totalPages = Math.ceil(totalReports / reportsPerPage);
      const startIndex = (page - 1) * reportsPerPage;
      const paginatedReports = filtered.slice(startIndex, startIndex + reportsPerPage);

      if (!paginatedReports.length) {
        container.innerHTML = `<p>${t("no_matching_reports_found")}</p>`;
        return;
      }

      paginatedReports.forEach(report => {
        const card = document.createElement("div");
        card.className = "report-card";

        const isNew = report.source === "new";
        const isExternalNew = report.source === "external-new";
        const isExternalLegacy = report.source === "external-legacy";
const isTicket = isExternalNew && report.ticket_number;
const isLegacy = isExternalLegacy;
const isPlainExternalTicket = isExternalNew && !report.ticket_number;

let sourceLabel = "";
if (isTicket) {
  sourceLabel = t("external_ticket"); // تذكرة صيانة خارجية
} else if (isPlainExternalTicket) {
  sourceLabel = t("external_maintenance_ticket"); // تذكرة خارجية فقط
} else if (isLegacy) {
  sourceLabel = t("external_maintenance"); // صيانة خارجية قديمة
}

        const statusClass = getStatusClass(report.status);

        if (isNew) {
          card.innerHTML = `
            <div class="report-card-header">
              <span>${t("new_report")}</span>
              <select class="status-select ${statusClass}">
                <option value="Open" ${report.status === "Open" ? "selected" : ""}>${t("open")}</option>
                <option value="In Progress" ${report.status === "In Progress" ? "selected" : ""}>${t("in_progress")}</option>
                <option value="Closed" ${report.status === "Closed" ? "selected" : ""}>${t("closed")}</option>
              </select>
            </div>
            <div class="report-details">
              <img src="/icon/desktop.png" alt="Device Icon" />
              <span>${formatDateTime(report.created_at)}</span>
            </div>
            <p><strong>${t("device_type")}:</strong> ${report.device_type || "N/A"}</p>
            <p><strong>${t("priority")}:</strong> ${report.priority || "N/A"}</p>
            <p><strong>${t("status")}:</strong> ${report.status}</p>
          `;

          card.addEventListener("click", e => {
            if (e.target.closest("select")) return;
            window.location.href = `report-details.html?id=${report.id}&type=new`;
          });

          const selectElement = card.querySelector("select.status-select");
          selectElement.addEventListener("click", e => e.stopPropagation());
          selectElement.addEventListener("change", e => {
            e.stopPropagation();
            updateReportStatus(report.id, e.target);
          });

          container.appendChild(card);
          return;
        }

let issueHtml = "";
let initial = report.issue_summary?.trim();
let final = report.full_description?.trim();

// تحقق: هل full_description فيها جملة إنشاء التذكرة؟
const hasAutoTicketNote = /Ticket\s+\([^)]+\)\s+has\s+been\s+created\s+by\s+\([^)]+\)/i.test(final);

if (hasAutoTicketNote && report.ticket_number) {
  // نحاول نلقى تقرير آخر بنفس ticket_number من غير نوع التذكرة (مثل legacy)
  const originalReport = data.find(
    r =>
      r.ticket_number === report.ticket_number &&
      r.source !== "external-new" &&
      r.full_description &&
      !/Ticket\s+\([^)]+\)\s+has\s+been\s+created\s+by\s+\([^)]+\)/i.test(r.full_description)
  );
  if (originalReport) {
    final = originalReport.full_description.trim();
  } else {
    final = ""; // ما لقينا بديل
  }
}

// تفادي التكرار بين initial و final
if (final && initial && final === initial) {
  final = "";
}

issueHtml = `
  <div class="report-issue-line">
    ${initial ? `<span><strong>${t("initial_diagnosis")}:</strong> ${initial}</span>` : ""}
    ${final ? `<span><strong>${t("final_diagnosis")}:</strong> ${final}</span>` : ""}
  </div>
`;




card.innerHTML = `
  <div class="report-card-header">
    <img src="/icon/${isTicket ? "ticket" : "Maintenance"}.png" alt="icon" />
    ${sourceLabel}
    <select 
      class="status-select ${statusClass}"
      data-report-id="${report.id}"
      data-ticket-id="${report.ticket_id || ''}">
      <option value="Open" ${report.status === "Open" ? "selected" : ""}>${t("open")}</option>
      <option value="In Progress" ${report.status === "In Progress" ? "selected" : ""}>${t("in_progress")}</option>
      <option value="Closed" ${report.status === "Closed" ? "selected" : ""}>${t("closed")}</option>
    </select>
  </div>
  <div class="report-details">
    <img src="/icon/desktop.png" alt="Device Icon" />
    <span>${formatDateTime(report.created_at)}</span>
  </div>
  <p><strong>${t("ticket_number")}:</strong> ${report.ticket_number ||'' }</p>
  <p><strong>${t("device_name")}:</strong> ${report.device_name || "N/A"}</p>
  <p><strong>${t("department")}:</strong> ${report.department_name || "N/A"}</p>
  ${issueHtml}
`;


        card.addEventListener("click", (e) => {
          if (e.target.closest("select")) return;
          window.location.href = `report-details.html?id=${report.id}&type=external`;
        });

        const selectElement = card.querySelector("select.status-select");
        selectElement.addEventListener("click", e => e.stopPropagation());
        selectElement.addEventListener("change", e => {
          e.stopPropagation();
          updateReportStatus(report.id, e.target);
        });

        container.appendChild(card);
      });

      updatePagination(page, totalPages);
    })
    .catch(err => {
      console.error("❌ Error loading external reports:", err);
      document.getElementById("report-list").innerHTML = `<p>${t("error_loading_reports")}</p>`;
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

function updateReportStatus(reportId, selectElement) {
  const newStatus = selectElement.value;
  const ticketId = selectElement.getAttribute("data-ticket-id");

  fetch(`http://localhost:5050/update-external-report-status/${reportId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json","Authorization": "Bearer " + localStorage.getItem("token" )},
    body: JSON.stringify({ status: newStatus })
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message || "✅ Status updated");

      if (ticketId) {
        document.querySelectorAll(`select[data-ticket-id="${ticketId}"]`).forEach(dropdown => {
          dropdown.value = newStatus;
          dropdown.className = `status-select ${getStatusClass(newStatus)}`;
        });
      } else {
        document.querySelectorAll(`select[data-report-id="${reportId}"]`).forEach(dropdown => {
          dropdown.value = newStatus;
          dropdown.className = `status-select ${getStatusClass(newStatus)}`;
        });
      }
    })
    .catch(err => {
      console.error("❌ Failed to update external report status:", err);
      alert("❌ Failed to update status");
    });
}

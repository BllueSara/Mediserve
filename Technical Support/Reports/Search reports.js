  function cleanTag(value) {
  return value?.replace(/\s*\[(ar|en)\]$/i, "").trim();
}
function cleanText(text) {
  return (text || "")
    .replace(/\[\s*(ar|en)\s*\]/gi, "")       // يزيل [ar] أو [en]
    .replace(/\s{2,}/g, " ")                  // يزيل المسافات الزائدة
    .trim();
}


function cleanReport(raw) {
  const cleaned = {};
  for (const key in raw) {
    if (typeof raw[key] === "string") {
      cleaned[key] = cleanText(raw[key]);
    } else {
      cleaned[key] = raw[key];
    }
  }
  return cleaned;
}
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const page = urlParams.get('page') || 1;
  loadReports(page);
  document.querySelector(".new-report-btn")?.addEventListener("click", () => {
    window.location.href = "Newreport.html";
  });


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
t = (key, fallback = '') => languageManager.translations[languageManager.currentLang]?.[key] || fallback || key;
function tryTranslateList(input, dict, lang) {
  try {
    const items = JSON.parse(input);
    if (!Array.isArray(items)) throw new Error();
    return items
      .map(i => `- ${dict?.[i.trim()]?.[lang] || i}`)
      .join("<br>");
  } catch {
    return input; // fallback
  }
}

function normalizeKey(str) {
  return str
    .toLowerCase()
    .replace(/[“”"']/g, "")       // يشيل علامات التنصيص الذكية
    .replace(/[^\w\s]/g, "")      // يشيل الرموز مثل () وغيرها
    .replace(/\s+/g, " ")         // يوحد الفراغات
    .trim();
}

function loadReports(page = 1) {
  const token = localStorage.getItem('token');
  fetch(`http://localhost:5050/get-internal-reports`, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  })
    .then(res => res.json())
.then(data => {
  // 🧼 تنظيف التاجات من جميع البيانات
  data = data.map(cleanReport);

  const container = document.getElementById("report-list");

      container.innerHTML = "";
const isArabic = languageManager.currentLang === 'ar';

      const type = document.getElementById("filter-type")?.value;
      const status = document.getElementById("filter-status")?.value;
      const search = document.getElementById("search-input")?.value.toLowerCase();
      const dateFrom = document.getElementById("filter-date-from")?.value;
      const dateTo = document.getElementById("filter-date-to")?.value;
      const deviceType = document.getElementById("filter-device-type")?.value;

      const filtered = data.filter(report => {
        const createdAt = new Date(report.created_at);
        const isInternalTicket = report.maintenance_type === "Internal" || (report.ticket_number && report.ticket_number.startsWith("INT-"));
        const isTicketFromOtherType = report.issue_summary?.includes("Ticket Created");

        let typeMatch = true;
        if (type === "Maintenance") {
          typeMatch = !isInternalTicket && !isTicketFromOtherType && report.source !== "new";
        } else if (type === "Ticket") {
          typeMatch = isInternalTicket || isTicketFromOtherType;
        } else if (type === "New") {
          typeMatch = report.source === "new";
        }

        const statusMatch = !status || report.status?.trim().toLowerCase() === status.trim().toLowerCase();
        const searchMatch =
          !search ||
          report.device_name?.toLowerCase().includes(search) ||
          report.department_name?.toLowerCase().includes(search) ||
          report.ticket_number?.toLowerCase().includes(search);

        let dateMatch = true;
        if (dateFrom) dateMatch = createdAt >= new Date(dateFrom);
        if (dateTo) dateMatch = dateMatch && createdAt <= new Date(dateTo);

        const deviceTypeMatch = !deviceType || (report.device_type?.toLowerCase() === deviceType.toLowerCase());

        return typeMatch && statusMatch && searchMatch && dateMatch && deviceTypeMatch;
      });

      const reportsPerPage = 4;
      const totalReports = filtered.length;
      const totalPages = Math.ceil(totalReports / reportsPerPage);
      const startIndex = (page - 1) * reportsPerPage;
      const paginatedReports = filtered.slice(startIndex, startIndex + reportsPerPage);

      if (!paginatedReports.length) {
        container.innerHTML = `<p>${t('no_matching_reports_found')}</p>`;
        return;
      }

      paginatedReports.forEach(report => {
        const isInternalTicket = report.maintenance_type === "Internal";
        const isTicketFromOtherType = report.issue_summary?.includes("Ticket Created");
let ticketNumber = report.ticket_number;
if (!ticketNumber) {
  const text = `${report.full_description || ""} ${report.issue_summary || ""}`;
  const match = text.match(/(?:#)?(TIC-\d+|INT-\d{8}-\d{3}|INT-\d+)/i);
  ticketNumber = match ? match[1].trim() : null;
}


        const isNewSimple = report.source === "new";
        const card = document.createElement("div");
        card.className = "report-card";

        if (isNewSimple) {
          card.innerHTML = `
            <div class="report-card-header">
              <img src="/icon/Report.png" alt="icon" />
              <span>${report.report_type || t('maintenance_report')}</span>
              <select 
                data-report-id="${report.id}" 
                class="status-select ${getStatusClass(report.status)}">
                <option value="Open" ${report.status === "Open" ? "selected" : ""}>${t('open')}</option>
                <option value="In Progress" ${report.status === "In Progress" ? "selected" : ""}>${t('in_progress')}</option>
                <option value="Closed" ${report.status === "Closed" ? "selected" : ""}>${t('closed')}</option>
              </select>
            </div>
            <div class="report-details">
              <img src="/icon/desktop.png" alt="device" />
              <span>${formatDateTime(report.created_at)}</span>
            </div>
            <p><strong>${t('device_type')}:</strong> ${report.device_type || "N/A"}</p>
            <p><strong>${t('priority')}:</strong> ${report.priority || "N/A"}</p>
            <p><strong>${t('status')}:</strong> ${report.status}</p>
          `;

          container.appendChild(card);

          card.addEventListener("click", (e) => {
            if (e.target.closest("select")) return;
            window.location.href = `report-details.html?id=${report.id}&type=new`;
          });

          const selectElement = card.querySelector("select.status-select");
          selectElement.addEventListener("click", e => e.stopPropagation());
          selectElement.addEventListener("change", e => {
            e.stopPropagation();
            updateReportStatus(report.id, e.target);
          });

          return;
        }

        const isRegular = report.maintenance_type === "Regular";
        const isTicketOnly = report.issue_summary?.includes("Ticket Created");

        let maintenanceLabel = t('general_maintenance');
        let iconSrc = "/icon/maintenance.png";

        if (isInternalTicket) {
          maintenanceLabel = t('internal_ticket');
          iconSrc = "/icon/ticket.png";
        } else if (isTicketFromOtherType && isRegular) {
          maintenanceLabel = `${t('ticket')} - ${t('regular_maintenance')}`;
          iconSrc = "/icon/ticket.png";
        } else if (isTicketFromOtherType && !isRegular) {
          maintenanceLabel = `${t('ticket')} - ${t('general_maintenance')}`;
          iconSrc = "/icon/ticket.png";
        } else if (isRegular) {
          maintenanceLabel = t('regular_maintenance');
          iconSrc = "/icon/Maintenance.png";
        }

        let issueHtml = "";
        if (isTicketOnly) {
          issueHtml = `
            <div style="background:#e8f4ff;padding:10px;border-radius:6px">
              <strong>${t('ticket_number')}:</strong> ${report.ticket_number}<br>
              <strong>${t('device_name')}:</strong> ${report.device_name || "N/A"}<br>
              <strong>${t('department')}:</strong> ${report.department_name || "N/A"}
            </div>
          `;
        } else if (isRegular) {
          let problemContent = report.problem_status || "";
          let isArray = false;
          let checklistItems = [];

          try {
            const parsed = JSON.parse(problemContent);
            if (Array.isArray(parsed)) {
              isArray = true;
              checklistItems = parsed;
            }
          } catch {}

const dict = languageManager.description || {};

if (isArray && checklistItems.length) {
issueHtml = `<ul style="
  margin: 0;
  padding-${isArabic ? "right" : "left"}: 20px;
  list-style-position: inside;
  text-align: ${isArabic ? "right" : "left"};
">
  ${
    checklistItems.map(item => {
      const norm = normalizeKey(item);
      const key = Object.keys(dict).find(k => normalizeKey(k) === norm);
      const translated = key ? dict[key][languageManager.currentLang] : item;
      return `<li style="margin: 0; padding: 2px 0;">${translated}</li>`;
    }).join("")
  }
</ul>`;

} else {
  issueHtml = `<div style="margin-left: 10px;">${problemContent || t('no_specifications_found')}</div>`;
}


          if (report.full_description) {
            issueHtml += `<div style="margin-top:10px;background:#f2f2f2;padding:8px;border-radius:6px"><strong>${t('notes')}:</strong><br>${report.full_description}</div>`;
          }
        } else {
  let issue = report.issue_summary || "";
  let diagnosis = report.full_description || "";

  issue = issue.replace(/^selected issue:\s*/i, "").trim();
  diagnosis = diagnosis.replace(/^initial diagnosis:\s*/i, "").trim();

  const lang = languageManager.currentLang;
  const dict = languageManager.description || {};

  // 🧠 دالة ترجمة ذكية


function translateTextBlock(text) {
  let arr = [];

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      arr = parsed;
    } else {
      throw new Error("Not array");
    }
  } catch {
    arr = text
      .replace(/^\[|\]$/g, "")
      .split(/[\n,،-]+/)
      .map(s => s.replace(/^["“”']?|["“”']?$/g, "").trim())
      .filter(Boolean);
  }

return arr.map(original => {
  const cleanedOriginal = cleanText(original); // 👈 إضافة هذه
  const norm = normalizeKey(cleanedOriginal);
  const key = Object.keys(dict).find(k => normalizeKey(k) === norm);
  return `<li style="margin: 2px 0;">${key ? dict[key][lang] : cleanedOriginal}</li>`;
}).join("");

}

const translatedIssueList = issue ? translateTextBlock(issue) : "";
const translatedDiagnosisList = diagnosis ? translateTextBlock(diagnosis) : "";

issueHtml = `
  <div class="report-issue-line" style="text-align: ${isArabic ? "right" : "left"};">
    ${translatedIssueList
      ? `<div><strong>${t('selected_issue')}:</strong><ul style="padding-${isArabic ? "right" : "left"}: 20px;">${translatedIssueList}</ul></div>`
      : ""}
    ${translatedDiagnosisList
      ? `<div style="margin-top:10px;"><strong>${t('initial_diagnosis')}:</strong><ul style="padding-${isArabic ? "right" : "left"}: 20px;">${translatedDiagnosisList}</ul></div>`
      : ""}
  </div>
`;
        }
const direction = isArabic ? "rtl" : "ltr";
const align = isArabic ? "right" : "left";
const justify = isArabic ? "space-between" : "space-between";

card.innerHTML = `
  <div class="report-card-header" dir="${direction}" style="display: flex; align-items: center; justify-content: ${justify}; gap: 10px;">
    <div style="display: flex; align-items: center; gap: 10px;">
      <img src="${iconSrc}" alt="icon" />
      <span style="text-align:${align}">${maintenanceLabel}</span>
    </div>
<select 
  data-report-id="${report.id}" 
  class="status-select ${getStatusClass(report.status)}"
  style="margin-${languageManager.currentLang === 'ar' ? 'left' : 'right'}: 12px;"
>

      <option value="Open" ${report.status === "Open" ? "selected" : ""}>${t('open')}</option>
      <option value="In Progress" ${report.status === "In Progress" ? "selected" : ""}>${t('in_progress')}</option>
      <option value="Closed" ${report.status === "Closed" ? "selected" : ""}>${t('closed')}</option>
    </select>
  </div>

  <div class="report-details" dir="${direction}">
    <img src="/icon/desktop.png" alt="device" />
    <span style="text-align:${align}">${formatDateTime(report.created_at)}</span>
  </div>

${ticketNumber ? `<p style="text-align:${align}"><strong>${t('ticket_number')}:</strong> ${ticketNumber}</p>` : ""}
  ${report.device_name ? `<p style="text-align:${align}"><strong>${t('device_name')}:</strong> ${report.device_name}</p>` : ""}
  ${report.department_name ? `<p style="text-align:${align}"><strong>${t('department')}:</strong> ${translateDepartmentName(report.department_name)}</p>` : ""}
  ${!isTicketOnly ? `<p style="text-align:${align}"><strong>${t('issue')}:</strong><br>${issueHtml}</p>` : ""}
`;



        container.appendChild(card);

        card.addEventListener("click", (e) => {
          if (e.target.closest("select")) return;
          window.location.href = `report-details.html?id=${report.id}&type=internal`;
        });

        const selectElement = card.querySelector("select.status-select");
        selectElement.addEventListener("click", e => e.stopPropagation());
        selectElement.addEventListener("change", e => {
          e.stopPropagation();
          updateReportStatus(report.id, e.target);
        });
      });

      updatePagination(page, totalPages);
    })
    .catch(err => {
      console.error("❌ Error:", err);
      document.getElementById("report-list").innerHTML = `<p>${t('error_loading_reports')}</p>`;
    });
}



function updatePagination(currentPage, totalPages) {
  const paginationContainer = document.querySelector(".pagination");
  if (!paginationContainer) return;

  paginationContainer.innerHTML = "";

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.className = `page-btn ${i == currentPage ? "active" : ""}`;
    btn.dataset.page = i;
    btn.addEventListener("click", () => loadReports(i));
    paginationContainer.appendChild(btn);
  }
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
    headers: { "Content-Type": "application/json","Authorization": "Bearer " + localStorage.getItem("token" )},
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

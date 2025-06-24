//search report
// ← 1) دالة لاستدعاء Google Translate عند غياب المفتاح في القاموس
async function translateWithGoogle(text, targetLang, sourceLang = "en") {
  if (!text || !targetLang) return text;
  const encoded = encodeURIComponent(text);
  const url =
    `https://translate.googleapis.com/translate_a/single?client=gtx` +
    `&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encoded}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch Google Translate");
    const data = await res.json();
    return data?.[0]?.[0]?.[0] || text;
  } catch (err) {
    console.warn("⚠️ translateWithGoogle error:", err);
    return text;
  }
}

// 🔙 زر الرجوع
function goBack() {
  window.history.back();
}

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



// دالة ترجمة ذكية لعناصر النصوص (Selected Issue / Initial Diagnosis)
async function translateTextBlock(text) {
  const lang = languageManager.currentLang;
  const dict = languageManager.description || {};
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
      .map(s => cleanText(s))
      .filter(Boolean);
  }

  const listItems = [];
  for (const original of arr) {
    const cleanedOriginal = cleanText(original);
    const norm = normalizeKey(cleanedOriginal);
    // ابحث في القاموس بحالة المفاتيح
    const key = Object.keys(dict).find(k => normalizeKey(k) === norm);
    if (key) {
      listItems.push(`<li style="margin: 2px 0;">${dict[key][lang]}</li>`);
    } else {
      const googleTranslated = await translateWithGoogle(cleanedOriginal, lang, "en");
      listItems.push(`<li style="margin: 2px 0;">${googleTranslated}</li>`);
    }
  }

  return listItems.join("");
}

function normalizeKey(str) {
  return str
    .toLowerCase()
    .replace(/[“”"']/g, "")       // يشيل علامات التنصيص الذكية
    .replace(/[^\w\s]/g, "")      // يشيل الرموز مثل () وغيرها
    .replace(/\s+/g, " ")         // يوحد الفراغات
    .trim();
}

function getSelectVal(id) {
  const sel = document.getElementById(id);
  const opt = sel.options[sel.selectedIndex];
  return opt?.dataset?.val ?? "";
}


async function loadReports(page = 1) {
  const token = localStorage.getItem('token');
  let data;
  try {
    const res = await fetch(`http://localhost:5050/get-internal-reports`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    data = await res.json();
  } catch (err) {
    console.error("❌ Error fetching reports:", err);
    document.getElementById("report-list").innerHTML = `<p>${t('error_loading_reports')}</p>`;
    return;
  }

  // تنظيف أي وسم [ar] أو [en] من الحقول النصية
  data = data.map(report => {
    for (const k in report) {
      if (typeof report[k] === "string") {
        report[k] = cleanText(report[k]);
      }
    }
    return report;
  });
  // 2.1) اجمع قيم الفلاتر

// ← 2.1 اجمع قيم الفلاتر باستخدام getSelectVal
const typeFilter       = getSelectVal("filter-type");
const statusFilter     = getSelectVal("filter-status");
const deviceTypeFilter = getSelectVal("filter-device-type");
const searchQuery      = document.getElementById("search-input").value.trim().toLowerCase();
const dateFrom         = document.getElementById("filter-date-from").value;
const dateTo           = document.getElementById("filter-date-to").value;

// 2.2) طبّق الفلاتر على data
// 2.2) طبّق الفلاتر على data
const filtered = data.filter(report => {
  // —— 1) فلترة حسب النوع:
  if (typeFilter) {
    if (typeFilter === "New") {
      if (report.source.toLowerCase() !== "new") return false;
    }
    else if (typeFilter === "maintenance") {
      // يشمل Regular و General
      if (report.maintenance_type !== "Regular" && report.maintenance_type !== "General") return false;
    }
    else if (typeFilter === "Regular") {
      if (report.maintenance_type !== "Regular") return false;
    }
    else if (typeFilter === "Internal") {
      if (report.maintenance_type !== "Internal") return false;
    }
    else if (typeFilter === "General") {
      if (report.maintenance_type !== "General") return false;
    }
    else if (typeFilter === "Ticket") {
      const isInternalTicket = report.maintenance_type === "Internal";
      const isCreatedTicket  = report.issue_summary?.includes("Ticket Created");
      if (!isInternalTicket && !isCreatedTicket) return false;
    }
  }
  // ... باقي الفلاتر أو الكود ..

    // —— 2) فلترة الحالة:
    if (statusFilter && (report.status || "").toLowerCase() !== statusFilter.toLowerCase()) 
      return false;

    // —— 3) فلترة نوع الجهاز:
    if (deviceTypeFilter && (report.device_type || "").toLowerCase() !== deviceTypeFilter.toLowerCase()) 
      return false;

    // —— 4) فلترة البحث الحر:
    if (searchQuery) {
      const haystack = [
        report.issue_summary, 
        report.full_description, 
        report.department_name, 
        report.device_name
      ].join(" ").toLowerCase();
      if (!haystack.includes(searchQuery)) return false;
    }

    // —— 5) فلترة التواريخ:
    const created = new Date(report.created_at);
    if (dateFrom && created < new Date(dateFrom)) return false;
    if (dateTo   && created > new Date(dateTo))   return false;

    return true;
  });


  const container = document.getElementById("report-list");
  container.innerHTML = "";

  const lang = languageManager.currentLang; // "ar" أو "en"
  const isArabic = (lang === 'ar');

  // 4.a) فلترة وفرز إلى صفحات (مثال بسيط جدًا لعرض العنصر الأول فقط لوحده)
  const reportsPerPage = 4;
  const startIndex     = (page - 1) * reportsPerPage;
const paginated = filtered.slice(startIndex, startIndex + reportsPerPage);

  if (!paginated.length) {
    container.innerHTML = `<p>${t('no_matching_reports_found')}</p>`;
    return;
  }

  // 4.b) المرور على كل تقرير داخل الصفحة
  for (const report of paginated) {
    // استخراج رقم التذكرة إن وجد أو fallback
    let ticketNumber = report.ticket_number || "";
    if (!ticketNumber) {
      const textMatch = (report.full_description || "") + " " + (report.issue_summary || "");
      const match = textMatch.match(/(?:#)?(TIC-\d+|INT-\d{8}-\d{3}|INT-\d+)/i);
      ticketNumber = match ? match[1].trim() : "";
    }

    const isNewReport  = (report.source === "new");
    const isInternal   = (report.maintenance_type === "Internal");
    const isTicketOnly = report.issue_summary?.includes("Ticket Created");

    // العنصر الذي سيصبح البطاقة
    const card = document.createElement("div");
    card.className = "report-card";

    // ——— إذا كان تقرير جديد “New”
    if (isNewReport) {
      card.innerHTML = `
        <div class="report-card-header">
          <img src="/icon/Report.png" alt="icon" />
          <span>${report.report_type || t('maintenance_report')}</span>
          <select data-report-id="${report.id}" class="status-select ${getStatusClass(report.status)}">
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

      card.addEventListener("click", e => {
        if (e.target.closest("select")) return;
        window.location.href = `report-details.html?id=${report.id}&type=new`;
      });
      const sel = card.querySelector("select.status-select");
      sel.addEventListener("click", e => e.stopPropagation());
      sel.addEventListener("change", e => {
        e.stopPropagation();
        updateReportStatus(report.id, e.target);
      });
      continue;
    }

    // ——— بناء تسمية الـ maintenanceLabel والـ iconSrc بناءً على نوع التقرير
// 1) Map maintenance_type → baseLabelKey
let baseLabelKey;
switch (report.maintenance_type) {
  case "Regular":
    baseLabelKey = 'regular_maintenance';    // "صيانة دورية"
    iconSrc      = "/icon/maintenance.png";
    break;
  case "Internal":
    baseLabelKey = 'internal_ticket';        // "تذكرة داخلية"
    iconSrc      = "/icon/ticket.png";
    break;
  default:
    baseLabelKey = 'general_maintenance';    // "صيانة عامة"
    iconSrc      = "/icon/maintenance.png";
}

// 2) Build the final maintenanceLabel
let maintenanceLabel = t(baseLabelKey);
// إذا هذا تقرير "Ticket Created" فقط → نلصق "- تذكرة" ونغيّر الأيقون
if (isTicketOnly) {
  maintenanceLabel += ` – ${t('ticket')}`;  // e.g. "صيانة دورية – تذكرة"
  iconSrc = "/icon/ticket.png";
}


    // ——— تجهيز issueHtml حسب نوع التقرير (Ticket-only / Regular / غير ذلك)
    let issueHtml = "";
    if (isTicketOnly) {
      issueHtml = `
        <div style="background:#e8f4ff;padding:10px;border-radius:6px">
          <strong>${t('ticket_number')}:</strong> ${report.ticket_number}<br>
          <strong>${t('device_name')}:</strong> ${report.device_name || "N/A"}<br>
          <strong>${t('department')}:</strong> ${report.department_name || "N/A"}
        </div>
      `;
    }
    else if (report.maintenance_type === "Regular") {
      let problemContent = report.problem_status || "";
      let isArray = false;
      let arrItems = [];
      try {
        const parsed = JSON.parse(problemContent);
        if (Array.isArray(parsed)) {
          isArray = true;
          arrItems = parsed;
        }
      } catch {}
      const dict = languageManager.description || {};

      if (isArray && arrItems.length) {
        const listItems = [];
        for (const item of arrItems) {
          const cleanedItem = cleanText(item);
          const norm = normalizeKey(cleanedItem);
          const key = Object.keys(dict).find(k => normalizeKey(k) === norm);
          if (key) {
            listItems.push(`<li style="margin:0;padding:2px 0;">${dict[key][languageManager.currentLang]}</li>`);
          } else {
            // إذا لم نجده في القاموس → نترجمه من Google
            const googleTranslated = await translateWithGoogle(cleanedItem, languageManager.currentLang, "en");
            listItems.push(`<li style="margin:0;padding:2px 0;">${googleTranslated}</li>`);
          }
        }
        issueHtml = `<ul style="
          margin:0;
          padding-${isArabic ? "right" : "left"}:20px;
          list-style-position:inside;
          text-align:${isArabic ? "right":"left"};">
          ${listItems.join("")}
        </ul>`;
      } else {
        issueHtml = `<div style="margin-left:10px;">${problemContent || t('no_specifications_found')}</div>`;
      }

      if (report.full_description) {
        issueHtml += `
          <div style="margin-top:10px;background:#f2f2f2;padding:8px;border-radius:6px">
            <strong>${t('notes')}:</strong><br>${report.full_description}
          </div>
        `;
      }
    }
    
    else {
      // ترجمة Selected Issue و Initial Diagnosis باستخدام دالة translateTextBlock
      let issueTxt     = report.issue_summary || "";
      let diagnosisTxt = report.full_description || "";

      issueTxt     = issueTxt.replace(/^selected issue:\s*/i, "").trim();
      diagnosisTxt = diagnosisTxt.replace(/^initial diagnosis:\s*/i, "").trim();

      const translatedIssueList     = issueTxt ? await translateTextBlock(issueTxt) : "";
      const translatedDiagnosisList = diagnosisTxt 

      issueHtml = `
        <div class="report-issue-line" style="text-align:${isArabic ? "right" : "left"};">
          ${translatedIssueList
            ? `<div><strong>${t('selected_issue')}:</strong>
                 <ul style="padding-${isArabic ? "right" : "left"}:20px;">
                   ${translatedIssueList}
                 </ul>
               </div>`
            : ""}
          ${translatedDiagnosisList
            ? `<div style="margin-top:10px;">
                 <strong>${t('initial_diagnosis')}:</strong>
                 <ul style="padding-${isArabic ? "right" : "left"}:20px;">
                   ${translatedDiagnosisList}
                 </ul>
               </div>`
            : ""}
        </div>
      `;
    }

    // ——— هنا نترجم اسم القسم مباشرةً (بدون دالة منفصلة)
// نعتبر أن report.department_name يأتي عادة كـ "EnglishName|ArabicName"
let translatedDeptName = "";
if (report.department_name) {
  // 1) ننظف النصّ إذا احتجت (مثلاً trim أو إزالة علامات غير ضرورية)
  const cleanedDept = cleanText(report.department_name).trim();

  // 2) نقسم عند '|' لنحصل على جزأين [EnglishPart, ArabicPart]
  const parts = cleanedDept.split("|");
  const englishPart = parts[0]?.trim() || "";
  const arabicPart  = parts[1]?.trim() || "";

  // 3) نختار الجزء المناسب حسب اللغة
  if (lang === "ar") {
    translatedDeptName = arabicPart || englishPart; 
    // إذا لم يوجد الجزء العربي، نعرض الإنجليزي كـ fallback
  } else {
    translatedDeptName = englishPart || arabicPart;
    // إذا لم يوجد الجزء الإنجليزي، نعرض العربي كـ fallback
  }
}


    // ——— أخيراً، نُنشئ البطاقة ونُدخل اسم القسم المترجم
    const direction = isArabic ? "rtl" : "ltr";
    const align     = isArabic ? "right" : "left";
    const justify   = "space-between";

    card.innerHTML = `
      <div class="report-card-header" dir="${direction}" style="
             display:flex;
             align-items:center;
             justify-content:${justify};
             gap:10px;
      ">
        <div style="display:flex;align-items:center;gap:10px;">
          <img src="${iconSrc}" alt="icon" />
          <span style="text-align:${align}">${maintenanceLabel}</span>
        </div>
        <select 
          data-report-id="${report.id}" 
          class="status-select ${getStatusClass(report.status)}"
          style="margin-${isArabic ? 'left' : 'right'}:12px;"
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

      ${ticketNumber
        ? `<p style="text-align:${align}"><strong>${t('ticket_number')}:</strong> ${ticketNumber}</p>`
        : ""}
      ${report.device_name
        ? `<p style="text-align:${align}"><strong>${t('device_name')}:</strong> ${report.device_name}</p>`
        : ""}
      ${report.department_name
        ? `<p style="text-align:${align}"><strong>${t('department')}:</strong> ${translatedDeptName}</p>`
        : ""}
      ${!isTicketOnly
        ? `<p style="text-align:${align}"><strong>${t('issue')}:</strong><br>${issueHtml}</p>`
        : ""}
    `;

    container.appendChild(card);

    // نعيد ضبط حدثي النقر والتغيير على الـ select
    card.addEventListener("click", e => {
      if (e.target.closest("select")) return;
      window.location.href = `report-details.html?id=${report.id}&type=internal`;
    });
    const selectElt = card.querySelector("select.status-select");
    selectElt.addEventListener("click", e => e.stopPropagation());
    selectElt.addEventListener("change", e => {
      e.stopPropagation();
      updateReportStatus(report.id, e.target);
    });
  }

  // ——— بعد الانتهاء من جميع البطاقات، نحدّث أزرار الصفحات
updatePagination(page, Math.ceil(filtered.length / reportsPerPage));
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
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + localStorage.getItem("token")
    },
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

// تهيئة الصفحة والروابط
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const page = parseInt(urlParams.get('page')) || 1;
  loadReports(page);

  document.querySelector(".new-report-btn")?.addEventListener("click", () => {
    window.location.href = "Newreport.html";
  });

  document.querySelectorAll(".pagination .page-btn[data-page]").forEach(button => {
    button.addEventListener("click", () => {
      const pageNum = parseInt(button.dataset.page);
      if (pageNum) loadReports(pageNum);
    });
  });

  const select = document.getElementById("filter-device-type");
  if (!select) {
    console.warn("⚠️ filter-device-type not found in DOM!");
    return;
  }

  // ✅ تحميل أنواع الأجهزة (بما فيها الأنواع الجديدة)
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
  document.getElementById("filter-type")?.addEventListener("change", () => loadReports(1));
  document.getElementById("filter-status")?.addEventListener("change", () => loadReports(1));
  document.getElementById("search-input")?.addEventListener("input", () => loadReports(1));
  document.getElementById("filter-date-from")?.addEventListener("change", () => loadReports(1));
  document.getElementById("filter-date-to")?.addEventListener("change", () => loadReports(1));
  document.getElementById("filter-device-type")?.addEventListener("change", () => loadReports(1));

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

// مساعدة الترجمة العامة
t = (key, fallback = '') => languageManager.translations[languageManager.currentLang]?.[key] || fallback || key;

// ===================== دوال مساعدة =====================

// 1) دالة لتنظيف وسوم [ar] أو [en] من قيمة نصية
function cleanTag(value) {
  return value?.replace(/\s*\[(ar|en)\]$/i, "").trim();
}

// 2) دالة أحضار ترجمة فورية من Google Translate (fallback للعبارة نفسها عند الفشل)
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

// 3) دالة لتنظيف أي وسم [ar] أو [en] من كل حقل نصي في التقرير
function cleanReport(raw) {
  const cleaned = {};
  for (const key in raw) {
    if (typeof raw[key] === "string") {
      cleaned[key] = cleanTag(raw[key]);
    } else {
      cleaned[key] = raw[key];
    }
  }
  return cleaned;
}

// 4) دالة لتوحيد مفتاح نصي قبل البحث في القواميس (normalize)
function normalizeKey(str) {
  return str
    .toLowerCase()
    .replace(/[“”"']/g, "")       // يحذف علامات التنصيص الذكية
    .replace(/[^\w\s]/g, "")      // يحذف الرموز
    .replace(/\s+/g, " ")         // يوحد الفراغات
    .trim();
}

// 5) دالة مساعدة لترجمة عناصر قائمة (Selected Issue / Initial Diagnosis)
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
      .map(s => s.trim())
      .filter(Boolean);
  }

  const listItems = [];
  for (const original of arr) {
    const cleanedOriginal = original.trim();
    const norm = normalizeKey(cleanedOriginal);
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

// 6) دالة تنسيق التاريخ/الوقت
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

// 7) دالة لاختيار اسم الصنف CSS بناءً على الحالة
function getStatusClass(status) {
  if (!status) return "pending";
  const s = status.toLowerCase();
  if (s === "closed" || s === "completed") return "completed";
  if (s === "in progress") return "in-progress";
  return "pending";
}

// 8) دالة تغيير حالة التقرير على السيرفر وتحديث كل القوائم المرتبطة
function updateReportStatus(reportId, selectElement) {
  const newStatus = selectElement.value;
  const ticketId = selectElement.getAttribute("data-ticket-id");

  fetch(`http://localhost:5050/update-external-report-status/${reportId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + localStorage.getItem("token")
    },
    body: JSON.stringify({ status: newStatus })
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message || "✅ Status updated");

      // حدّث كل القوائم المرتبطة بنفس ticket_id إن وجد
      if (ticketId) {
        document.querySelectorAll(`select[data-ticket-id="${ticketId}"]`).forEach(dropdown => {
          dropdown.value = newStatus;
          dropdown.className = `status-select ${getStatusClass(newStatus)}`;
        });
      } else {
        // إن لم يكن هناك ticket_id، حدّث حسب report_id فقط
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

// 9) دالة مساعدة لجلب ترجمة من memory لهويتك
t = (key, fallback = '') => languageManager.translations[languageManager.currentLang]?.[key] || fallback || key;


// ===================== الدالة الرئيسة =====================
function loadExternalReports(page = 1) {
  const token = localStorage.getItem('token');

  fetch(`http://localhost:5050/get-external-reports?page=${page}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => {
      // 🧼 تنظيف وسوم [ar] و [en] من جميع الحقول النصية
      data = data.map(cleanReport);

      const container = document.getElementById("report-list");
      container.innerHTML = "";

      // قيم الفلاتر الحالية من DOM
      const typeFilter = document.getElementById("filter-type")?.value;
      const statusFilter = document.getElementById("filter-status")?.value;
      const searchFilter = document.getElementById("search-input")?.value.toLowerCase();
      const dateFrom = document.getElementById("filter-date-from")?.value;
      const dateTo = document.getElementById("filter-date-to")?.value;
      const deviceTypeFilter = document.getElementById("filter-device-type")?.value;

      // 1) فلترة البيانات حسب الشروط
      const filtered = data.filter(report => {
        const createdAt = new Date(report.created_at);
        const isTicket =
          report.source === "external-new" ||
          (report.source === "external-legacy" &&
           (report.issue_summary?.toLowerCase().includes("ticket") ||
            report.full_description?.toLowerCase().includes("ticket")));
        const isNew = report.source === "new";
        const isExternalNew = report.source === "external-new";
        const isExternalLegacy = report.source === "external-legacy";

        let typeMatch = true;
        if (typeFilter === "Ticket")      typeMatch = isTicket;
        else if (typeFilter === "Maintenance") typeMatch = !isTicket && (isExternalLegacy || isExternalNew);
        else if (typeFilter === "New")     typeMatch = isNew;

        const statusMatch = !statusFilter ||
          report.status?.trim().toLowerCase() === statusFilter.trim().toLowerCase();

        const searchMatch =
          !searchFilter ||
          report.device_name?.toLowerCase().includes(searchFilter) ||
          report.department_name?.toLowerCase().includes(searchFilter) ||
          report.ticket_number?.toLowerCase().includes(searchFilter);

        let dateMatch = true;
        if (dateFrom) dateMatch = createdAt >= new Date(dateFrom);
        if (dateTo)   dateMatch = dateMatch && createdAt <= new Date(dateTo);

        const deviceTypeMatch = !deviceTypeFilter ||
          report.device_type?.toLowerCase() === deviceTypeFilter.toLowerCase();

        return typeMatch && statusMatch && searchMatch && dateMatch && deviceTypeMatch;
      });

      // 2) إعداد التصفّح والصفحات
      const reportsPerPage = 4;
      const totalReports = filtered.length;
      const totalPages = Math.ceil(totalReports / reportsPerPage);
      const startIndex = (page - 1) * reportsPerPage;
      const paginatedReports = filtered.slice(startIndex, startIndex + reportsPerPage);

      if (!paginatedReports.length) {
        container.innerHTML = `<p>${t("no_matching_reports_found")}</p>`;
        return;
      }

      // 3) بناء كل بطاقة تقرير داخل الصفحة (ناخدها async لكي نستطيع استخدام await داخلها)
      paginatedReports.forEach(async report => {
        const card = document.createElement("div");
        card.className = "report-card";

        const isNew = report.source === "new";
        const isExternalNew = report.source === "external-new";
        const isExternalLegacy = report.source === "external-legacy";

        const isTicket = isExternalNew && report.ticket_number;       // “تذكرة خارجية”
        const isPlainExternalTicket = isExternalNew && !report.ticket_number; // “تذكرة خارجية فقط”
        const isLegacy = isExternalLegacy;                             // “صيانة خارجية قديمة”

        // 3.1) تحديد sourceLabel
        let sourceLabel = "";
        if (isTicket) {
          sourceLabel = t("external_ticket");             // مثال: "تذكرة صيانة خارجية"
        } else if (isPlainExternalTicket) {
          sourceLabel = t("external_maintenance_ticket"); // مثال: "تذكرة خارجية فقط"
        } else if (isLegacy) {
          sourceLabel = t("external_maintenance");        // مثال: "صيانة خارجية قديمة"
        }

        const statusClass = getStatusClass(report.status);

        // 3.2) حالة التقرير الجديد “New”
        if (isNew) {
          card.innerHTML = `
            <div class="report-card-header">
              <span>${t("new_report")}</span>
              <select class="status-select ${statusClass}" data-report-id="${report.id}">
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

          container.appendChild(card);
          card.addEventListener("click", e => {
            if (e.target.closest("select")) return;
            window.location.href = `report-details.html?id=${report.id}&type=new`;
          });
          const selectEl = card.querySelector("select.status-select");
          selectEl.addEventListener("click", e => e.stopPropagation());
          selectEl.addEventListener("change", e => {
            e.stopPropagation();
            updateReportStatus(report.id, e.target);
          });

          return; // ننهي معالجة هذه البطاقة لأنها تقرير “New”
        }

        // 3.3) إعداد issueHtml لبقية الحالات (معالجة initial و final)
        let issueHtml = "";
        const initial = report.issue_summary?.trim();
        let final = report.full_description?.trim();

        // إذا وجدت عبارة "Ticket (<...>) has been created by (<...>)" في final
        const hasAutoTicketNote = /Ticket\s+\([^)]+\)\s+has\s+been\s+created\s+by\s+\([^)]+\)/i.test(final);
        if (hasAutoTicketNote && report.ticket_number) {
          // نحاول العثور على التقرير الأصلي بنفس ticket_number بدون عبارة إنشاء التذكرة
          const originalReport = data.find(r =>
            r.ticket_number === report.ticket_number &&
            r.source !== "external-new" &&
            r.full_description &&
            !/Ticket\s+\([^)]+\)\s+has\s+been\s+created\s+by\s+\([^)]+\)/i.test(r.full_description)
          );
          if (originalReport) {
            final = originalReport.full_description.trim();
          } else {
            final = ""; // لم نعثر على بديل
          }
        }

        // نتجنَّب التكرار إن كان final مطابقًا لـ initial
        if (final && initial && final === initial) {
          final = "";
        }

        issueHtml = `
          <div class="report-issue-line">
            ${initial ? `<span><strong>${t("initial_diagnosis")}:</strong> ${initial}</span>` : ""}
            ${final   ? `<span><strong>${t("final_diagnosis")}:</strong> ${final}</span>`     : ""}
          </div>
        `;

        // 3.4) الترجمة المدمجة لاسم القسم (بدون دالة منفصلة)
        let translatedDeptName = "";
        if (report.department_name) {
          const cleanedDept = cleanTag(report.department_name);     // نظّف وسوم [ar] أو [en]
          const normDept = normalizeKey(cleanedDept);               // وحّد المفتاح

          // احصل على قاموس الأقسام للغة الحالية (en أو ar)
          const localDeptDict = languageManager.translations[languageManager.currentLang]?.departments || {};

          // جرّب العثور على مفتاح مطابق في القاموس المحلي
          let foundLocalKey = Object.keys(localDeptDict)
            .find(k => normalizeKey(k) === normDept);

          if (foundLocalKey) {
            translatedDeptName = localDeptDict[foundLocalKey];
          } else {
            // إن لم نجده، نستدعي Google Translate مباشرة
            translatedDeptName = await translateWithGoogle(cleanedDept, languageManager.currentLang, "en");
          }
        }

        // 3.5) نحسب اتجاه النص والمحاذاة بناءً على اللغة
        const isArabic = (languageManager.currentLang === 'ar');
        const direction = isArabic ? 'rtl' : 'ltr';
        const align = isArabic ? 'right' : 'left';

        // 3.6) بناء قالب البطاقة مع استخدام translatedDeptName مباشرة
        card.innerHTML = `
          <div class="report-card-header" dir="${direction}" style="display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <img src="/icon/${isTicket ? "ticket" : "Maintenance"}.png" alt="icon" />
              <span style="text-align:${align}; display: inline-block;">${sourceLabel}</span>
            </div>
            <div style="margin-${isArabic ? 'left' : 'right'}: 12px;">
              <select 
                class="status-select ${statusClass}"
                data-report-id="${report.id}"
                data-ticket-id="${report.ticket_id || ''}">
                <option value="Open" ${report.status === "Open" ? "selected" : ""}>${t("open")}</option>
                <option value="In Progress" ${report.status === "In Progress" ? "selected" : ""}>${t("in_progress")}</option>
                <option value="Closed" ${report.status === "Closed" ? "selected" : ""}>${t("closed")}</option>
              </select>
            </div>
          </div>

          <div class="report-details" dir="${direction}">
            <img src="/icon/desktop.png" alt="Device Icon" />
            <span style="text-align:${align}; display: block;">${formatDateTime(report.created_at)}</span>
          </div>

          <p style="text-align:${align}"><strong>${t("ticket_number")}:</strong> ${report.ticket_number || ""}</p>
          <p style="text-align:${align}"><strong>${t("device_name")}:</strong> ${report.device_name || "N/A"}</p>
          <p style="text-align:${align}"><strong>${t("department")}:</strong> ${translatedDeptName}</p>
          <div style="text-align:${align}">${issueHtml}</div>
        `;

        container.appendChild(card);

        // 3.7) ربط نقر البطاقة ورابط تغيير الحالة
        card.addEventListener("click", e => {
          if (e.target.closest("select")) return;
          window.location.href = `report-details.html?id=${report.id}&type=external`;
        });
        const selectEl = card.querySelector("select.status-select");
        selectEl.addEventListener("click", e => e.stopPropagation());
        selectEl.addEventListener("change", e => {
          e.stopPropagation();
          updateReportStatus(report.id, e.target);
        });
      }); // نهاية حلقة paginatedReports.forEach

      // 4) تحديث شريط التصفح
      updatePagination(page, totalPages);
    })
    .catch(err => {
      console.error("❌ Error loading external reports:", err);
      document.getElementById("report-list").innerHTML = `<p>${t("error_loading_reports")}</p>`;
    });
}

// ===================== دالة تحديث أزرار الصفحة (Pagination) =====================
function updatePagination(currentPage, totalPages) {
  const paginationContainer = document.querySelector(".pagination");
  if (!paginationContainer) return;
  paginationContainer.innerHTML = "";

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.className = `page-btn ${i == currentPage ? "active" : ""}`;
    btn.dataset.page = i;
    btn.addEventListener("click", () => loadExternalReports(i));
    paginationContainer.appendChild(btn);
  }
}

// ===================== تهيئة الصفحة عند التحميل =====================
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const page = parseInt(urlParams.get("page")) || 1;
  loadExternalReports(page);

  document.querySelector(".new-report-btn")?.addEventListener("click", () => {
    window.location.href = "Newreport.html";
  });

  document.querySelectorAll(".pagination .page-btn[data-page]").forEach(button => {
    button.addEventListener("click", () => {
      const pageNum = parseInt(button.dataset.page);
      if (pageNum) loadExternalReports(pageNum);
    });
  });

  // تحميل أنواع الأجهزة
  const select = document.getElementById("filter-device-type");
  if (!select) {
    console.warn("⚠️ filter-device-type not found in DOM!");
    return;
  }
  fetch("http://localhost:5050/device-types")
    .then(res => res.json())
    .then(deviceTypes => {
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

  // أزرار التنقل بالفلاتر
  document.getElementById("prev-btn")?.addEventListener("click", () => {
    const currentPage = parseInt(new URLSearchParams(window.location.search).get('page') || "1");
    if (currentPage > 1) loadExternalReports(currentPage - 1);
  });
  document.getElementById("filter-type")?.addEventListener("change", () => loadExternalReports(1));
  document.getElementById("filter-status")?.addEventListener("change", () => loadExternalReports(1));
  document.getElementById("search-input")?.addEventListener("input", () => loadExternalReports(1));
  document.getElementById("filter-date-from")?.addEventListener("change", () => loadExternalReports(1));
  document.getElementById("filter-date-to")?.addEventListener("change", () => loadExternalReports(1));
  document.getElementById("filter-device-type")?.addEventListener("change", () => loadExternalReports(1));
  document.getElementById("next-btn")?.addEventListener("click", () => {
    const currentPage = parseInt(new URLSearchParams(window.location.search).get('page') || "1");
    loadExternalReports(currentPage + 1);
  });

  // تحميل حالة الفلتر من localStorage إذا وجدت
  const savedStatus = localStorage.getItem("reportStatusFilter");
  if (savedStatus) {
    const dropdown = document.getElementById("filter-status");
    if (dropdown) {
      dropdown.value = savedStatus;
      dropdown.dispatchEvent(new Event("change"));
    }
    localStorage.removeItem("reportStatusFilter");
  }
});

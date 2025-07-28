// دوال عرض البيانات في تقارير التفاصيل

import { processPipeText, translateWithGoogle, translateBatch } from './translation.js'; // استيراد دوال الترجمة
import { cleanTag, getAssignedTo, getAssignedToId } from './data_processing.js'; // استيراد دوال معالجة البيانات

/**
 * تعيين البيانات الأساسية للتقرير
 */
export async function setBasicReportData(report, translations, lang) {
  const reportId = document.getElementById("report-id"); // عنصر رقم التقرير
  const reportTitle = document.getElementById("report-title"); // عنصر عنوان التقرير
  const priority = document.getElementById("priority"); // عنصر الأولوية
  const deviceType = document.getElementById("device-type"); // عنصر نوع الجهاز
  const assignedTo = document.getElementById("assigned-to"); // عنصر المهندس المسؤول
  const department = document.getElementById("department"); // عنصر القسم
  const category = document.getElementById("category"); // عنصر الفئة
  const reportStatus = document.getElementById("report-status"); // عنصر حالة التقرير
  const submittedDate = document.getElementById("submitted-date"); // عنصر تاريخ الإرسال

  // تعيين رقم التقرير
  if (report.maintenance_type === "Internal") {
    reportId.textContent = report.ticket_number || `INT-${report.id}`; // رقم تذكرة داخلي
  } else {
    reportId.textContent = report.report_number || report.request_number || `MR-${report.id}`; // رقم تقرير أو طلب
  }

  // تعيين عنوان التقرير
  let titlePrefix = "Maintenance"; // بادئة العنوان الافتراضية
  if (report.maintenance_type === "Regular") {
    titlePrefix = "Regular Maintenance";
  } else if (report.maintenance_type === "General") {
    titlePrefix = "General Maintenance";
  } else if (report.maintenance_type === "Internal") {
    titlePrefix = "Internal Ticket";
  } else if (report.maintenance_type === "External") {
    titlePrefix = report.source === "external-new" ? "External Ticket" : "External Maintenance";
  }

  const translatedTitle = translations.titleType?.[titlePrefix]?.[lang] || titlePrefix; // ترجمة العنوان
  let ticketNum = report.ticket_number?.trim(); // رقم التذكرة
  if (!ticketNum) {
    const fullText = `${report.full_description || ""} ${report.issue_summary || ""}`;
    const match = fullText.match(/(?:Ticket Number:|Ticket\s+\()? *(TIC-\d+|INT-\d{8}-\d{3})/i);
    if (match) {
      ticketNum = match[1].trim();
    }
  }

  const reportNum = report.report_number || report.request_number || ""; // رقم التقرير
  const isTicketReport = reportNum.includes("-TICKET"); // هل هو تقرير تذكرة
  const translatedTicket = translations.titleType?.["Ticket"]?.[lang] || "Ticket"; // ترجمة كلمة تذكرة

  let finalNumber = ticketNum || reportNum || report.id; // الرقم النهائي
  if (isTicketReport && finalNumber.includes("-TICKET")) {
    finalNumber = finalNumber.replace("-TICKET", "");
  }

  let reportTitleText = `${translatedTitle} #${finalNumber}`; // نص عنوان التقرير
  if (isTicketReport) {
    reportTitleText += ` - ${translatedTicket}`;
  }

  reportTitle.textContent = reportTitleText; // تعيين نص العنوان
  reportTitle.setAttribute("data-i18n", "report_title_key"); // تعيين خاصية الترجمة

  // تجميع النصوص المطلوب ترجمتها
  const textsToTranslate = [];
  const translationMap = new Map();

  // إضافة النصوص للترجمة
  const rawPriority = report.priority || "Medium"; // الأولوية الأصلية
  const rawType = report.device_type || ""; // نوع الجهاز الأصلي
  
  if (!translations.priority?.[rawPriority]?.[lang]) {
    textsToTranslate.push(rawPriority);
    translationMap.set('priority', rawPriority);
  }
  
  if (!translations.deviceType?.[rawType]?.[lang]) {
    textsToTranslate.push(rawType);
    translationMap.set('deviceType', rawType);
  }

  // ترجمة النصوص دفعة واحدة
  let translatedTexts = [];
  if (textsToTranslate.length > 0) {
    translatedTexts = await translateBatch(textsToTranslate, lang, "en");
  }

  // تعيين الأولوية
  let translatedPriority;
  if (translations.priority?.[rawPriority]?.[lang]) {
    translatedPriority = translations.priority[rawPriority][lang];
  } else {
    const priorityIndex = textsToTranslate.indexOf(rawPriority);
    translatedPriority = translatedTexts[priorityIndex] || rawPriority;
  }
  priority.textContent = report.source === "external" ? "" : translatedPriority;
  priority.dataset.key = rawPriority;

  // تعيين نوع الجهاز
  const keyType = rawType;
  let translatedType;
  if (translations.deviceType?.[keyType]?.[lang]) {
    translatedType = translations.deviceType[keyType][lang];
  } else {
    const typeIndex = textsToTranslate.indexOf(rawType);
    translatedType = translatedTexts[typeIndex] || rawType;
  }
  deviceType.textContent = translatedType;
  deviceType.dataset.key = rawType || "";

  // تعيين المهندس المسؤول
  const translatedAssignedTo = getAssignedTo(report, lang) || "N/A";
  const engineerId = getAssignedToId(report);
  
  let originalEngineerName = "";
  switch (report.maintenance_type) {
    case "Regular":
      originalEngineerName = report.technical_engineer || "";
      break;
    case "General":
      originalEngineerName = report.technician_name || report.technical_engineer || "";
      break;
    case "Internal":
      originalEngineerName = report.technical || report.technician_name || "";
      break;
    case "External":
      originalEngineerName = report.technical_engineer || report.assigned_to || "";
      break;
    default:
      originalEngineerName = report.assigned_to || report.reporter_name || report.technical_engineer || "";
  }

  assignedTo.textContent = translatedAssignedTo;
  assignedTo.dataset.key = translatedAssignedTo;
  assignedTo.dataset.rawtext = originalEngineerName;
  
  if (report.maintenance_type === "Regular") {
    assignedTo.dataset.id = report.technical_engineer_id || '';
  } else if (report.maintenance_type === "General") {
    assignedTo.dataset.id = report.technician_id || '';
  } else {
    assignedTo.dataset.id = engineerId || '';
  }

  // تعيين القسم
  const rawDept = report.department_name || "";
  const parts = rawDept.split("|");
  const enPart = parts[0] || "";
  const arPart = parts.length > 1 ? parts[1] : "";
  let translatedDept;
  if (lang === "ar") {
    translatedDept = arPart || enPart;
  } else {
    translatedDept = enPart;
  }
  department.textContent = translatedDept;
  department.dataset.key = rawDept;
  department.dataset.rawtext = rawDept;

  // تعيين الفئة
  const rawCategory = report.maintenance_type === "Regular" ? "Regular" :
    report.maintenance_type === "General" ? "General" :
    report.maintenance_type === "Internal" ? (report.ticket_type || "Internal") :
    report.maintenance_type === "External" ? "External" : "";

  let translatedCategory;
  if (translations.category?.[rawCategory]?.[lang]) {
    translatedCategory = translations.category[rawCategory][lang];
  } else {
    translatedCategory = await translateWithGoogle(rawCategory, lang, "en");
  }
  category.textContent = translatedCategory;
  category.dataset.key = rawCategory;

  // تعيين حالة التقرير والتاريخ
  const rawStatus = report.status || "Open";
  let translatedStatus;
  if (translations.status?.[rawStatus]?.[lang]) {
    translatedStatus = translations.status[rawStatus][lang];
  } else {
    // ترجمة الحالة إذا لم تكن موجودة في القاموس
    switch (rawStatus.toLowerCase()) {
      case "open":
        translatedStatus = lang === "ar" ? "مفتوح" : "Open";
        break;
      case "in progress":
        translatedStatus = lang === "ar" ? "قيد التنفيذ" : "In Progress";
        break;
      case "closed":
        translatedStatus = lang === "ar" ? "مغلق" : "Closed";
        break;
      case "pending":
        translatedStatus = lang === "ar" ? "في الانتظار" : "Pending";
        break;
      default:
        translatedStatus = rawStatus;
    }
  }
  reportStatus.textContent = translatedStatus;
  reportStatus.dataset.key = rawStatus;
  
  // تحديث الـ CSS class بناءً على الحالة
  reportStatus.className = "status";
  // إضافة class إضافي للحالة إذا لزم الأمر
  if (rawStatus.toLowerCase() === "closed") {
    reportStatus.classList.add("status-closed");
  } else if (rawStatus.toLowerCase() === "in progress") {
    reportStatus.classList.add("status-in-progress");
  } else if (rawStatus.toLowerCase() === "open") {
    reportStatus.classList.add("status-open");
  } else if (rawStatus.toLowerCase() === "pending") {
    reportStatus.classList.add("status-pending");
  }
  submittedDate.textContent = `Submitted on ${new Date(report.created_at).toLocaleString()}`;
}

/**
 * معالجة وعرض الوصف
 */
export function setDescription(report, lang) {
  const descEl = document.getElementById("description"); // عنصر الوصف
  const isInternalTicket = report.maintenance_type === "Internal"; // هل هو تذكرة داخلية
  
  let descriptionHtml = "";
  
  if (isInternalTicket) {
    const summary = processPipeText((report.issue_summary || report.initial_diagnosis || "").trim(), lang);
    descriptionHtml = summary || "No description.";
  } else {
    const problem = processPipeText((report.problem_status || "").trim(), lang);
    const summary = processPipeText((report.issue_summary || report.initial_diagnosis || "").trim(), lang);

    // معالجة problem_status كـ JSON array
    let processedProblem = problem;
    if (typeof report.problem_status === "string" && report.problem_status.trim().startsWith("[")) {
      try {
        const problemArray = JSON.parse(report.problem_status);
        if (Array.isArray(problemArray) && problemArray.length > 0) {
          const processedItems = problemArray.map(item => {
            if (typeof item === "string" && item.includes("|")) {
              const parts = item.split("|").map(p => p.trim());
              return lang === "ar" ? (parts[1] || parts[0]) : parts[0];
            }
            return item;
          });
          processedProblem = processedItems.map(item => '• ' + item).join('<br>');
        }
      } catch (e) {
        console.warn("⚠️ Failed to parse problem_status JSON:", e);
        processedProblem = problem;
      }
    }

    const normalizedProblem = processedProblem.toLowerCase();
    const normalizedSummary = summary.toLowerCase();

    if (processedProblem && summary) {
      if (normalizedSummary.includes(normalizedProblem)) {
        descriptionHtml = summary;
      } else if (normalizedProblem.includes(normalizedSummary)) {
        descriptionHtml = processedProblem;
      } else {
        descriptionHtml = `${summary}<br>${processedProblem}`;
      }
    } else if (processedProblem) {
      descriptionHtml = processedProblem;
    } else if (summary) {
      descriptionHtml = summary;
    } else {
      descriptionHtml = "No description.";
    }
  }

  // معالجة خاصة لأنواع الصيانة المختلفة
  if (report.maintenance_type === "General") {
    descriptionHtml = processGeneralMaintenanceDescription(report, lang);
  } else if (report.maintenance_type === "Regular") {
    descriptionHtml = processRegularMaintenanceDescription(report, lang);
  } else if (report.source === "new") {
    descriptionHtml = processNewReportDescription(report, lang);
  } else if (report.maintenance_type === "Internal") {
    descriptionHtml = processInternalTicketDescription(report, lang);
  }

  // تنظيف النص النهائي
  let cleanedDescription = descriptionHtml
    .replace(/^Selected Issue:\s*/i, "")
    .replace(/\s*\[(ar|en)\]/gi, "")
    .trim();

  if (cleanedDescription.startsWith("[") && cleanedDescription.endsWith("]")) {
    cleanedDescription = cleanedDescription.slice(1, -1);
  } else if (cleanedDescription.startsWith("[")) {
    cleanedDescription = cleanedDescription.slice(1);
  } else if (cleanedDescription.endsWith("]")) {
    cleanedDescription = cleanedDescription.slice(0, -1);
  }
  
  cleanedDescription = cleanedDescription.replace(/^"""?|"""?$/g, "").trim();

  // عرض الوصف
  if (cleanedDescription.includes('<br>')) {
    descEl.innerHTML = cleanedDescription || "No description.";
  } else {
    const processedDescription = processPipeText(cleanedDescription, lang);
    if (processedDescription.includes("\n") || processedDescription.includes(",")) {
      const items = processedDescription
        .split(/[\n,،]+/)
        .map(item => item.trim())
        .filter(Boolean)
        .map(item => `- ${item}`)
        .join("<br>");
      descEl.innerHTML = items || "No description.";
    } else {
      descEl.innerHTML = processedDescription || "No description.";
    }
  }
  
  descEl.style.textAlign = lang === 'ar' ? 'right' : 'left'; // محاذاة النص حسب اللغة
}

/**
 * معالجة وصف الصيانة العامة
 */
function processGeneralMaintenanceDescription(report, lang) {
  let generalDescription = report.issue_description || report.issue_summary || "No description.";
  if (typeof report.problem_status === "string" && report.problem_status.trim().startsWith("[")) {
    try {
      const problemArray = JSON.parse(report.problem_status);
      if (Array.isArray(problemArray) && problemArray.length > 0) {
        const processedItems = problemArray.map(item => {
          if (typeof item === "string" && item.includes("|")) {
            const parts = item.split("|").map(p => p.trim());
            return lang === "ar" ? (parts[1] || parts[0]) : parts[0];
          }
          return item;
        });
        generalDescription = processedItems.map(item => '• ' + item).join('<br>');
      }
    } catch (e) {
      console.warn("⚠️ Failed to parse General problem_status JSON:", e);
      generalDescription = processPipeText(report.issue_description || report.issue_summary || "No description.", lang);
    }
  } else {
    generalDescription = processPipeText(report.issue_description || report.issue_summary || "No description.", lang);
  }
  return generalDescription;
}

/**
 * معالجة وصف الصيانة الدورية
 */
function processRegularMaintenanceDescription(report, lang) {
  let regularProblem = report.problem_status || report.issue_summary || "No description.";
  if (typeof regularProblem === "string" && regularProblem.trim().startsWith("[")) {
    try {
      const problemArray = JSON.parse(regularProblem);
      if (Array.isArray(problemArray) && problemArray.length > 0) {
        const processedItems = problemArray.map(item => {
          if (typeof item === "string" && item.includes("|")) {
            const parts = item.split("|").map(p => p.trim());
            return lang === "ar" ? (parts[1] || parts[0]) : parts[0];
          }
          return item;
        });
        regularProblem = processedItems.map(item => '• ' + item).join('<br>');
      }
    } catch (e) {
      console.warn("⚠️ Failed to parse Regular problem_status JSON:", e);
    }
  }
  return processPipeText(regularProblem, lang);
}

/**
 * معالجة وصف التقارير الجديدة
 */
function processNewReportDescription(report, lang) {
  let newDescription = report.description || "No description.";
  if (typeof report.problem_status === "string" && report.problem_status.trim().startsWith("[")) {
    try {
      const problemArray = JSON.parse(report.problem_status);
      if (Array.isArray(problemArray) && problemArray.length > 0) {
        const processedItems = problemArray.map(item => {
          if (typeof item === "string" && item.includes("|")) {
            const parts = item.split("|").map(p => p.trim());
            return lang === "ar" ? (parts[1] || parts[0]) : parts[0];
          }
          return item;
        });
        newDescription = processedItems.map(item => '• ' + item).join('<br>');
      }
    } catch (e) {
      console.warn("⚠️ Failed to parse new report problem_status JSON:", e);
      newDescription = processPipeText(report.description, lang) || "No description.";
    }
  } else {
    newDescription = processPipeText(report.description, lang) || "No description.";
  }
  return newDescription;
}

/**
 * معالجة وصف التذاكر الداخلية
 */
function processInternalTicketDescription(report, lang) {
  let internalSummary = report.issue_summary || report.initial_diagnosis || "No description.";
  if (typeof internalSummary === "string" && internalSummary.trim().startsWith("[")) {
    try {
      const summaryArray = JSON.parse(internalSummary);
      if (Array.isArray(summaryArray) && summaryArray.length > 0) {
        const processedItems = summaryArray.map(item => {
          if (typeof item === "string" && item.includes("|")) {
            const parts = item.split("|").map(p => p.trim());
            return lang === "ar" ? (parts[1] || parts[0]) : parts[0];
          }
          return item;
        });
        internalSummary = processedItems.map(item => '• ' + item).join('<br>');
      }
    } catch (e) {
      console.warn("⚠️ Failed to parse Internal issue_summary JSON:", e);
      internalSummary = processPipeText(report.issue_summary, lang) || "No description.";
    }
  } else {
    internalSummary = processPipeText(report.issue_summary, lang) || "No description.";
  }
  return internalSummary;
}

/**
 * تعيين الملاحظات التقنية
 */
export function setTechnicalNotes(report, lang, translations) {
  const noteEl = document.getElementById("note"); // عنصر الملاحظات
  const isExternal = report.source === "external"; // هل التقرير خارجي

  if (report.maintenance_type === "General") {
    const generalInfo = [
      { label: "Customer Name", value: report.customer_name, i18n: "customer_name" },
      { label: "ID Number", value: report.id_number, i18n: "id_number" },
      { label: "Ext Number", value: report.extension, i18n: "ext_number" },
      { label: "Initial Diagnosis", value: report.diagnosis_initial, i18n: "initial_diagnosis" },
      { label: "Final Diagnosis", value: report.diagnosis_final, i18n: "final_diagnosis" },
      { label: "Floor", value: report.floor, i18n: "floor" },
    ];

    const generalHtml = generalInfo
      .map(item => {
        const tmap = translations?.[lang] || {};
        const translatedLabel = tmap[item.i18n] || item.label;
        const displayValue = processPipeText(item.value, lang) || "N/A";
        return `
          <div class="info-row">
            <span class="info-label" data-i18n="${item.i18n}">${translatedLabel}</span>
            <span class="info-value">${displayValue}</span>
          </div>
        `;
      })
      .join("");

    noteEl.innerHTML = `
      <div class="info-box">
        <div class="info-title" data-i18n="additional_information">Additional Information</div>
        ${generalHtml}
      </div>
    `;
  } else {
    const baseNote = isExternal
      ? processPipeText(report.final_diagnosis || report.technical_notes || report.full_description, lang)
      : processPipeText(report.technical_notes || report.full_description || report.final_diagnosis, lang);
    
    let noteHtml = `
      <div class="info-box">
        <div class="info-title" data-i18n="${isExternal ? 'final_diagnosis' : 'technical_notes'}">
          ${isExternal ? "Final Diagnosis" : "Technical Team Notes"}:
        </div>
        <div class="info-row">
          <span class="info-value">${baseNote || ""}</span>
        </div>
      </div>
    `;

    if (report.ticket_type) {
      noteHtml += `
        <div class="info-box" style="margin-top:10px;">
          <div class="info-title" data-i18n="issue_summary">Issue Summary:</div>
          <div class="info-row">
            <span class="info-value">${processPipeText(report.issue_description, lang)}</span>
          </div>
        </div>
      `;
    }

    if (report.source === "external-legacy") {
      if (report.final_diagnosis) {
        noteHtml += `
          <div class="info-box" style="margin-top:10px;">
            <div class="info-title" data-i18n="final_diagnosis">Final Diagnosis:</div>
            <div class="info-row">
              <span class="info-value">${processPipeText(report.final_diagnosis, lang)}</span>
            </div>
          </div>
        `;
      }
      if (report.maintenance_manager) {
        noteHtml += `
          <div class="info-box" style="margin-top:10px;">
            <div class="info-title" data-i18n="maintenance_manager">Maintenance Manager:</div>
            <div class="info-row">
              <span class="info-value">${processPipeText(report.maintenance_manager, lang)}</span>
            </div>
          </div>
        `;
      }
    }

    noteEl.innerHTML = noteHtml;
    noteEl.dataset.oldText = noteEl.innerText.trim();
    
    // تطبيق الترجمة على العناوين
    setTimeout(() => {
      if (window.languageManager) {
        window.languageManager.applyLanguage();
      }
    }, 100);
  }
}

/**
 * تعيين المرفقات والتوقيع
 */
export function setAttachments(report) {
  const attachmentSection = document.getElementById("attachment-section"); // عنصر المرفقات

  // عرض المرفق إذا موجود
  if (report.attachment_name && report.attachment_path) {
    const attachmentLink = document.createElement("a"); // إنشاء رابط للمرفق
    attachmentLink.href = `http://localhost:4000/uploads/${report.attachment_path}`; // رابط المرفق
    attachmentLink.textContent = `📎 ${report.attachment_name}`; // نص الرابط
    attachmentLink.download = report.attachment_name; // اسم الملف عند التحميل
    attachmentLink.style = "display: block; margin-top: 10px; color: #007bff; text-decoration: underline;";
    attachmentSection.appendChild(attachmentLink); // إضافة الرابط إلى القسم
  }

  // عرض التوقيع إذا موجود
  if (report.signature_path) {
    const sigImg = document.createElement("img"); // إنشاء عنصر صورة للتوقيع
    sigImg.src = `http://localhost:4000/${report.signature_path}`; // رابط الصورة
    sigImg.alt = "Signature"; // نص بديل
    sigImg.style = "margin-top: 10px; max-width: 200px; border: 1px solid #ccc; display: block;";
    attachmentSection.appendChild(sigImg); // إضافة الصورة إلى القسم
  }
} 
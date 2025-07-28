// دوال معالجة التقارير الأولية

import { cleanReport, getAssignedTo, getAssignedToId } from './data_processing.js'; // استيراد دوال معالجة البيانات
import { processPipeText } from './translation.js'; // استيراد دالة معالجة النصوص
import { isDevelopment } from './performance_optimizer.js'; // استيراد دالة التحقق من بيئة التطوير

/**
 * معالجة التقرير الجديد
 */
export function processNewReport(report, lang, languageManager) {
  // تعيين البيانات الأساسية
  document.getElementById("report-title").textContent = `New Maintenance Report #${report.id}`; // تعيين عنوان التقرير
  document.getElementById("report-id").textContent = `NMR-${report.id}`; // تعيين رقم التقرير
  document.getElementById("priority").textContent = report.priority || "Medium"; // تعيين الأولوية
  document.getElementById("device-type").textContent = report.device_type || ""; // تعيين نوع الجهاز
  
  // معالجة اسم المهندس
  const assignedToEl = document.getElementById("assigned-to"); // عنصر المهندس
  assignedToEl.textContent = getAssignedTo(report, lang); // تعيين اسم المهندس
  assignedToEl.dataset.key = report.assigned_to_raw || report.assigned_to || ""; // تعيين البيانات الإضافية
  assignedToEl.dataset.rawtext = report.assigned_to_raw || report.assigned_to || ""; // تعيين النص الخام
  
  document.getElementById("department").textContent = report.department_name || ""; // تعيين القسم
  document.getElementById("category").textContent = "New"; // تعيين الفئة
  // تعيين حالة التقرير مع الترجمة
  const rawStatus = report.status || "Open";
  let translatedStatus;
  if (lang === "ar") {
    switch (rawStatus.toLowerCase()) {
      case "open":
        translatedStatus = "مفتوح";
        break;
      case "in progress":
        translatedStatus = "قيد التنفيذ";
        break;
      case "closed":
        translatedStatus = "مغلق";
        break;
      case "pending":
        translatedStatus = "في الانتظار";
        break;
      default:
        translatedStatus = rawStatus;
    }
  } else {
    translatedStatus = rawStatus;
  }
  const statusElement = document.getElementById("report-status");
  statusElement.textContent = translatedStatus;
  statusElement.dataset.key = rawStatus;
  
  // تحديث الـ CSS class بناءً على الحالة
  statusElement.className = "status";
  if (rawStatus.toLowerCase() === "closed") {
    statusElement.classList.add("status-closed");
  } else if (rawStatus.toLowerCase() === "in progress") {
    statusElement.classList.add("status-in-progress");
  } else if (rawStatus.toLowerCase() === "open") {
    statusElement.classList.add("status-open");
  } else if (rawStatus.toLowerCase() === "pending") {
    statusElement.classList.add("status-pending");
  }
  document.getElementById("submitted-date").textContent = `Submitted on ${new Date(report.created_at).toLocaleString()}`; // تعيين تاريخ الإرسال
  
  // معالجة problem_status
  let descriptionText = report.description || "No description."; // نص الوصف الافتراضي
  if (typeof report.problem_status === "string" && report.problem_status.trim().startsWith("[")) {
    try {
      const problemArray = JSON.parse(report.problem_status); // تحويل النص إلى مصفوفة
      if (Array.isArray(problemArray) && problemArray.length > 0) {
        const processedItems = problemArray.map(item => {
          if (typeof item === "string" && item.includes("|")) {
            const parts = item.split("|").map(p => p.trim());
            return lang === "ar" ? (parts[1] || parts[0]) : parts[0];
          }
          return item;
        });
        descriptionText = processedItems.map(item => '• ' + item).join('<br>'); // تحويل العناصر إلى قائمة نقطية
      }
    } catch (e) {
      console.warn("⚠️ Failed to parse new report problem_status JSON:", e);
      descriptionText = processPipeText(report.description, lang) || "No description.";
    }
  } else {
    descriptionText = processPipeText(report.description, lang) || "No description.";
  }
  
  document.getElementById("description").innerHTML = descriptionText; // تعيين الوصف
  document.getElementById("note").innerHTML = `<strong>Note:</strong><br>${processPipeText(report.details, lang) || ""}`; // تعيين الملاحظة
}

/**
 * إعداد البيانات الأساسية للتقرير
 */
export function setupReportData(report, translations, lang) {
  const map = {
    'device-type': report.device_type,
    'assigned-to': (() => {
      switch (report.maintenance_type) {
        case "General":
          return report.technician_id || report.assigned_to_id || report.technical;
        case "Regular":
          return report.assigned_to_id || report.technical;
        case "Internal":
          return report.assigned_to_id || report.technical || report.technician_id;
        case "External":
          return report.assigned_to_id || report.technical;
        default:
          return report.assigned_to_id || report.technical || report.technician_id;
      }
    })(),
    'department': report.department_id,
    'category': report.maintenance_type,
  };

  const rawMap = {
    'device-type': report.device_type_raw,
    'assigned-to': (() => {
      switch (report.maintenance_type) {
        case "General":
          return report.assigned_to_raw || report.technician_name || report.technical_engineer;
        case "Regular":
          return report.assigned_to_raw || report.technical_engineer;
        case "Internal":
          return report.assigned_to_raw || report.technical || report.technician_name;
        case "External":
          return report.assigned_to_raw || report.technical_engineer || report.assigned_to;
        default:
          return report.assigned_to_raw || report.assigned_to || report.technical_engineer || report.technician_name;
      }
    })(),
    'department': report.department_raw,
    'category': report.category_raw,
  };

  // تعيين البيانات في العناصر
  Object.keys(map).forEach(fieldId => {
    const el = document.getElementById(fieldId);
    if (!el) return;
    el.dataset.id = map[fieldId] || '';
    el.dataset.rawtext = rawMap[fieldId] || el.textContent.trim();
  });

  return { map, rawMap };
}

/**
 * تنظيف وإعداد التقرير
 */
export function prepareReport(rawReport) {
  console.log("📦 التقرير (خام):", rawReport);

  const report = cleanReport(rawReport);
  report.status = report.status || "Open";

  console.log("🧼 التقرير (نظيف):", report);

  return report;
}

/**
 * استخراج رقم التذكرة من النص
 */
export function extractTicketNumber(report) {
  let ticketNumber = report.ticket_number?.trim();

  if (!ticketNumber) {
    const fullText = `${report.full_description || ""} ${report.issue_summary || ""}`;
    const match = fullText.match(/(?:Ticket Number:|Ticket\s+\()? *(TIC-\d+|INT-\d{8}-\d{3})/i);
    if (match) {
      ticketNumber = match[1].trim();
      console.log("📌 Extracted ticket number:", ticketNumber);
    } else {
      console.warn("⚠️ No ticket number found in report");
    }
  }

  return ticketNumber;
}

/**
 * إنشاء عنوان التقرير
 */
export function createReportTitle(report, translations, lang) {
  let titlePrefix = "Maintenance";

  if (report.maintenance_type === "Regular") {
    titlePrefix = "Regular Maintenance";
  } else if (report.maintenance_type === "General") {
    titlePrefix = "General Maintenance";
  } else if (report.maintenance_type === "Internal") {
    titlePrefix = "Internal Ticket";
  } else if (report.maintenance_type === "External") {
    titlePrefix = report.source === "external-new" ? "External Ticket" : "External Maintenance";
  }

  const translatedTitle = translations.titleType?.[titlePrefix]?.[lang] || titlePrefix;

  let ticketNum = report.ticket_number?.trim();
  if (!ticketNum) {
    const fullText = `${report.full_description || ""} ${report.issue_summary || ""}`;
    const match = fullText.match(/(?:Ticket Number:|Ticket\s+\()? *(TIC-\d+|INT-\d{8}-\d{3})/i);
    if (match) {
      ticketNum = match[1].trim();
    }
  }

  const reportNum = report.report_number || report.request_number || "";
  const isTicketReport = reportNum.includes("-TICKET");
  const translatedTicket = translations.titleType?.["Ticket"]?.[lang] || "Ticket";

  let finalNumber = ticketNum || reportNum || report.id;
  if (isTicketReport && finalNumber.includes("-TICKET")) {
    finalNumber = finalNumber.replace("-TICKET", "");
  }

  let reportTitle = `${translatedTitle} #${finalNumber}`;
  if (isTicketReport) {
    reportTitle += ` - ${translatedTicket}`;
  }

  return reportTitle;
}

/**
 * معالجة البيانات الأولية للتقرير
 */
export function processInitialData(report, translations, lang) {
  // إعداد البيانات الأساسية
  const { map, rawMap } = setupReportData(report, translations, lang);

  // تسجيل البيانات للتشخيص (فقط في وضع التطوير)
  if (isDevelopment()) {
    console.log("🔍 Initial Engineer Data:", {
      assigned_to_id: report.assigned_to_id,
      assigned_to_raw: report.assigned_to_raw,
      assigned_to: report.assigned_to,
      technical_engineer: report.technical_engineer,
      technician_name: report.technician_name,
      technical: report.technical,
      technician_id: report.technician_id
    });

    console.log("🔍 Mapped Engineer Data:", {
      'assigned-to-id': map['assigned-to'],
      'assigned-to-raw': rawMap['assigned-to']
    });

    console.log("🔍 Detailed Engineer Mapping:", {
      maintenance_type: report.maintenance_type,
      assigned_to_raw: report.assigned_to_raw,
      technician_name: report.technician_name,
      technical_engineer: report.technical_engineer,
      technical: report.technical,
      assigned_to: report.assigned_to,
      'rawMap-assigned-to': rawMap['assigned-to'],
      'map-assigned-to': map['assigned-to']
    });

    console.log("report payload:", report);
  }

  return { map, rawMap };
} 
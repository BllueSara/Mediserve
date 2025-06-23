
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
    const firstSegment = data?.[0]?.[0]?.[0];
    return firstSegment || text;
  } catch (err) {
    console.warn("⚠️ translateWithGoogle error:", err);
    return text;
  }
}
function goBack() {
  window.history.back();
}

const { jsPDF } = window.jspdf;
let fontsReady = false;
let tajawalRegularBase64 = "";
let tajawalBoldBase64 = "";

const fetchFont = async (url) => {
  const res = await fetch(url);
  const blob = await res.blob();

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1]; // فقط البايس64 بدون data:...
      resolve(base64);
    };
    reader.readAsDataURL(blob);
  });
};

const loadFonts = async () => {
  tajawalRegularBase64 = await fetchFont("/fonts/Amiri-Regular.ttf");
  tajawalBoldBase64 = await fetchFont("/fonts/Amiri-Bold.ttf");
  fontsReady = true;
};

loadFonts();

function normalizeKey(str) {
  return str
    .toLowerCase()
    .replace(/[“”"']/g, "")     // حذف علامات التنصيص
    .replace(/[^\w\s]/g, "")     // حذف الرموز
    .replace(/\s+/g, " ")        // توحيد المسافات
    .trim();
}

function fixEncoding(badText) {
  try {
    const bytes = new Uint8Array([...badText].map(ch => ch.charCodeAt(0)));
    const decoder = new TextDecoder("utf-8");
    return decoder.decode(bytes);
  } catch {
    return badText;
  }
}

function cleanValue(val) {
  return (val || "").replace(/\s*\[(ar|en)\]$/i, "").trim();
}

function cleanTag(value) {
  return value?.toString().trim().replace(/\s*\[(ar|en)\]$/i, "");
}

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

let reportData = null;

const canvas = document.getElementById("signatureCanvas");
const ctx = canvas.getContext("2d");
let drawing = false;
let userDrewOnCanvas = false;

document.addEventListener("DOMContentLoaded", () => {

  const saveBtn = document.querySelector(".save-btn");

  const reportId = new URLSearchParams(window.location.search).get("id");
  const reportType = new URLSearchParams(window.location.search).get("type");

  if (!reportId) return alert("No report ID provided");

  fetch(`http://localhost:5050/report/${reportId}?type=${reportType}`)
    .then(res => res.json())
    .then(async rawReport => { // ← جعل المعالج async لاستخدام await
      console.log("📦 التقرير (خام):", rawReport);

      const report = cleanReport(rawReport); // ← 🧼 تنظيف التاجات
      reportData = report;
          reportData.status = report.status || "Open";

      // بعد cleanReport(rawReport) وقبل apply اللغة والترجمة:
      const map = {
        'device-type': report.device_type,       // raw English key
        'assigned-to': report.assigned_to_id,    // مثلا رقم المهندس المسؤول
        'department': report.department_id,     // مثلا رقم القسم
        'category': report.maintenance_type,  // أو الحقل اللي تحدده
      };

      const rawMap = {
        'device-type': report.device_type_raw,   // مثلا "scanner|ماسح ضوئي"
        'assigned-to': report.assigned_to_raw,   // مثلا "rawad|راود"
        'department': report.department_raw,    // مثلا "e|ي"
        'category': report.category_raw,      // مثلا "Regular|دورية"
      };

      Object.keys(map).forEach(fieldId => {
        const el = document.getElementById(fieldId);
        if (!el) return;
        el.dataset.id = map[fieldId] || '';
        el.dataset.rawtext = rawMap[fieldId] || el.textContent.trim();
      });
      console.log("report payload:", report);

      function getAssignedTo(report) {
        switch (report.maintenance_type) {
          case "Regular":
            return report.technical_engineer || "";
          case "General":
            return report.technician_name || "";
          case "Internal":
            return report.technical || report.technician_name || "";
          default:
            // External أو أي حالة ثانية
            return report.assigned_to       // إذا الباك يرسل assigned_to
              || report.reporter_name
              || report.technical_engineer
              || "";
        }
      }



      const lang = languageManager.currentLang;
      const normalizeKey = (text) => text.replace(/[^\w\s]/gi, "").toLowerCase().trim();

      // — 3) ترجمة Priority/Type/Dept/Category مع الفالباك إلى Google
      const rawPriority = report.priority || "Medium";
      const rawType = report.device_type || "";
      const rawDept = report.department_name || "";
      const parts = rawDept.split("|");

      const rawCategory =
        report.maintenance_type === "Regular" ? "Regular" :
          report.maintenance_type === "General" ? "General" :
            report.maintenance_type === "Internal" ? (report.ticket_type || "Internal") :
              report.maintenance_type === "External" ? "External" : "";
      let translatedPriority;
      if (translations.priority?.[rawPriority]?.[lang]) {
        translatedPriority = translations.priority[rawPriority][lang];
      } else {
        // كحالة احتياطية، ترجم بـ Google إذا لم نجد المفتاح
        translatedPriority = await translateWithGoogle(rawPriority, lang, "en");
      }

      // عرض الترجمة في العنصر #priority
      const priorityEl = document.getElementById("priority");
      priorityEl.textContent = translatedPriority;

      // تخزين المفتاح الإنجليزي في data-key حتى نستخدمه لاحقًا يوم الحفظ
      priorityEl.dataset.key = rawPriority;

      const keyType = normalizeKey(rawType);
      // rawType هو القيمة الإنكليزية الأصلية مثل "printer"

      // keyType للاطّلاع على المفتاح في قاموس الترجمات

      let translatedType;
      if (translations.deviceType?.[keyType]?.[lang]) {
        translatedType = translations.deviceType[keyType][lang];
      } else {
        translatedType = await translateWithGoogle(rawType, lang, "en");
      }

      // عنصر عرض نوع الجهاز
      const deviceTypeEl = document.getElementById("device-type");

      // 1) نعرض النص المترجم
      deviceTypeEl.textContent = translatedType;

      // 2) نخزن المفتاح الأصلي (rawType) في data-key
      //    إذا كنت تريد إرسال null لاحقًا في حال كانت السلسلة فارغة:
      deviceTypeEl.dataset.key = rawType || "";



      const enPart = parts[0] || "";
      const arPart = parts.length > 1 ? parts[1] : "";

      // 1.1) ابني النص المعروض بناءً على اللغة
      let translatedDept;
      if (languageManager.currentLang === "ar") {
        translatedDept = arPart || enPart;
      } else {
        translatedDept = enPart;
      }

      // 1.2) حدّد العنصر وضع النص ومعرّف data-key
      const departmentEl = document.getElementById("department");
      departmentEl.textContent = translatedDept;
      // المفتاح (value) للباك إند
      departmentEl.dataset.key = rawDept;
      // **هذا نص العرض الأصلي (en|ar) قبل أي تحويل**
      departmentEl.dataset.rawtext = rawDept;


      let translatedCategory;
      if (translations.category?.[rawCategory]?.[lang]) {
        translatedCategory = translations.category[rawCategory][lang];
      } else {
        translatedCategory = await translateWithGoogle(rawCategory, lang, "en");
      }
      const categoryEl = document.getElementById("category");
      categoryEl.textContent = translatedCategory;
      // هذا يحفظ المفتاح الإنجليزي الأصلي في data-key
      categoryEl.dataset.key = rawCategory;
      const attachmentSection = document.getElementById("attachment-section");

      // ✅ عرض المرفق إذا موجود
      if (report.attachment_name && report.attachment_path) {
        const attachmentLink = document.createElement("a");
        attachmentLink.href = `http://localhost:5050/uploads/${report.attachment_path}`;
        attachmentLink.textContent = `📎 ${report.attachment_name}`;
        attachmentLink.download = report.attachment_name;
        attachmentLink.style = "display: block; margin-top: 10px; color: #007bff; text-decoration: underline;";
        attachmentSection.appendChild(attachmentLink);
      }

      // ✅ عرض التوقيع إذا موجود (نفس مكان المرفق)
      if (report.signature_path) {
        const sigImg = document.createElement("img");
        sigImg.src = `http://localhost:5050/${report.signature_path}`;
        sigImg.alt = "Signature";
        sigImg.style = "margin-top: 10px; max-width: 200px; border: 1px solid #ccc; display: block;";
        attachmentSection.appendChild(sigImg);
      }

      const isExternal = report.source === "external";

      if (reportType === "new") {
        document.getElementById("report-title").textContent = `New Maintenance Report #${report.id}`;
        document.getElementById("report-id").textContent = `NMR-${report.id}`;
        document.getElementById("priority").textContent = report.priority || "Medium";
        document.getElementById("device-type").textContent = report.device_type || "";
        document.getElementById("assigned-to").textContent = report.assigned_to || "";
        document.getElementById("department").textContent = report.department_name || "";
        document.getElementById("category").textContent = "New";
        document.getElementById("report-status").textContent = report.status || "Open";
        document.getElementById("submitted-date").textContent = `Submitted on ${new Date(report.created_at).toLocaleString()}`;
        document.getElementById("description").textContent = report.description || "No description.";
        document.getElementById("note").innerHTML = `<strong>Note:</strong><br>${report.details || "No notes."}`;

        const specsContainer = document.getElementById("device-specs");
        specsContainer.innerHTML = "";
        if (report.device_type) {
          const deviceType = report.device_type?.trim()?.toLowerCase() || "";
          const fields = [
            { icon: "🔘", label: "Device Name:", value: report.device_name, alwaysShow: true, i18n: "device_name" },
            { icon: "🔑", label: "Serial Number:", value: report.serial_number, alwaysShow: true, i18n: "serial_number" },
            { icon: "🏛️", label: "Ministry Number:", value: report.governmental_number, alwaysShow: true, i18n: "ministry_number" },
            { icon: "🧠", label: "CPU:", value: report.cpu_name, showForPC: true, i18n: "cpu" },
            { icon: "💾", label: "RAM:", value: report.ram_type, showForPC: true, i18n: "ram" },
            { icon: "🖥️", label: "OS:", value: report.os_name, showForPC: true, i18n: "os" },
            { icon: "📶", label: "Generation:", value: report.generation_number, showForPC: true, i18n: "generation" },
            { icon: "🔧", label: "Model:", value: report.model_name, alwaysShow: true, i18n: "model" },
            { icon: "📟", label: "Device Type:", value: report.device_type, i18n: "device_type" },
            { icon: "💽", label: "Hard Drive:", value: report.drive_type, showForPC: true, i18n: "hard_drive" },
            { icon: "📏", label: "RAM Size:", value: report.ram_size, showForPC: true, i18n: "ram_size" },
            { icon: "🌐", label: "MAC Address:", value: report.mac_address, showForPC: true, i18n: "mac_address" },
            { icon: "🖧", label: "IP Address:", value: report.ip_address, showForPC: true, i18n: "ip_address" },
            { icon: "🖨️", label: "Printer Type:", value: report.printer_type, showForPrinter: true, i18n: "printer_type" },
            { icon: "🖋️", label: "Ink Type:", value: report.ink_type, showForPrinter: true, i18n: "ink_type" },
            { icon: "🔖", label: "Ink Serial Number:", value: report.ink_serial_number, showForPrinter: true, i18n: "ink_serial" },
            { icon: "📠", label: "Scanner Type:", value: report.scanner_type, showForScanner: true, i18n: "scanner_type" },
          ];
          
               fields.forEach(({ icon, label, value, showForPC, showForPrinter, showForScanner, alwaysShow, i18n, idField }) => {
          const shouldShow =
            alwaysShow ||
            (showForPC && ["pc", "desktop", "laptop", "كمبيوتر", "لابتوب"].includes(deviceType)) ||
            (showForPrinter && deviceType === "printer") ||
            (showForScanner && deviceType === "scanner") ||
            !!value;

          if (!shouldShow) return;

          const div = document.createElement("div");
          div.className = "spec-box";

          // أيقونة
          const iconSpan = document.createElement("span");
          iconSpan.textContent = icon;
          iconSpan.style.marginRight = "5px";
          div.appendChild(iconSpan);

          // تسمية الحقل
          const labelSpan = document.createElement("span");
          labelSpan.setAttribute("data-i18n", i18n);
          labelSpan.textContent = label;
          div.appendChild(labelSpan);

          // مسافة
          div.appendChild(document.createTextNode(" "));

          // القيمة مع id و data-id و data-rawtext
          const valueSpan = document.createElement("span");
          // نص خام قبل أي تعديل يطابق option الحالي
          const raw = value != null ? String(value).trim() : "";
          switch (i18n) {
            case "device_name":
              valueSpan.id = "device_name";
              valueSpan.dataset.id = idField || raw;
              valueSpan.dataset.rawtext = raw;
              valueSpan.textContent = report.device_name || "";
              break;

            case "serial_number":
              valueSpan.id = "serial_number";
              valueSpan.dataset.id = idField || raw;
              valueSpan.dataset.rawtext = raw;
              valueSpan.textContent = report.serial_number || "";
              break;

            case "ministry_number": // governmental_number
              valueSpan.id = "governmental_number";
              valueSpan.dataset.id = idField || raw;
              valueSpan.dataset.rawtext = raw;
              valueSpan.textContent = report.governmental_number || "";
              break;

            case "ip_address":
              valueSpan.id = "ip_address";
              valueSpan.dataset.id = idField || raw;
              valueSpan.dataset.rawtext = raw;
              valueSpan.textContent = report.ip_address || "";
              break;

            case "mac_address":
              valueSpan.id = "mac_address";
              valueSpan.dataset.id = idField || raw;
              valueSpan.dataset.rawtext = raw;
              valueSpan.textContent = report.mac_address || "";
              break;

            case "model":
              valueSpan.id = "model";
              valueSpan.dataset.id = idField || raw;
              valueSpan.dataset.rawtext = raw;
              valueSpan.textContent = report.model_name || "";
              break;

            case "device_type":
              valueSpan.id = "device_type";
              valueSpan.dataset.id = idField || raw;
              valueSpan.dataset.rawtext = raw;
              valueSpan.textContent = report.device_type || "";
              break;

            case "cpu":
              valueSpan.id = "cpu";
              // خزن الـ ID الرقمي مباشرة من البيانات اللي جابها من الباك
              valueSpan.dataset.id = report.cpu_id || "";
              valueSpan.dataset.rawtext = raw;
              valueSpan.textContent = report.cpu_name || "";
              break;

            case "ram":
              valueSpan.id = "ram_type";
              // خزن الـ ID الرقمي مباشرة من البيانات اللي جابها من الباك
              valueSpan.dataset.id = report.ram_id || "";
              valueSpan.dataset.rawtext = raw;
              valueSpan.textContent = report.ram_type || "";
              break;


            case "os":
              valueSpan.id = "os";
              // خزن الـ ID الرقمي مباشرة من البيانات اللي جابها من الباك
              valueSpan.dataset.id = report.os_id || "";
              valueSpan.dataset.rawtext = raw;
              valueSpan.textContent = report.os_name || "";
              break;

            case "generation":
              valueSpan.id = "generation";
              // خزن الـ ID الرقمي مباشرة من البيانات اللي جابها من الباك
              valueSpan.dataset.id = report.generation_id || "";
              valueSpan.dataset.rawtext = raw;
              valueSpan.textContent = report.generation_number || "";
              break;

            case "hard_drive":
              valueSpan.id = "drive_type";
              // خزن الـ ID الرقمي مباشرة من البيانات اللي جابها من الباك
              valueSpan.dataset.id = report.drive_id || "";
              valueSpan.dataset.rawtext = raw;
              valueSpan.textContent = report.drive_type || "";
              break;
            case "ram_size":
              valueSpan.id = "ram_size";
              // خزن الـ ID الرقمي مباشرة من البيانات اللي جابها من الباك
              valueSpan.dataset.id = report.ram_id || "";
              valueSpan.dataset.rawtext = raw;
              valueSpan.textContent = report.ram_size || "";
              break;

            case "scanner_type":
              valueSpan.id = "scanner_type";
              // خزن الـ ID الرقمي مباشرة من البيانات اللي جابها من الباك
              valueSpan.dataset.id = report.scanner_type_id || "";
              valueSpan.dataset.rawtext = raw;
              valueSpan.textContent = report.scanner_type || "";
              break;

            case "printer_type":
              valueSpan.id = "printer_type";
              // خزن الـ ID الرقمي مباشرة من البيانات اللي جابها من الباك
              valueSpan.dataset.id = report.printer_type_id || "";
              valueSpan.dataset.rawtext = raw;
              valueSpan.textContent = report.printer_type || "";
              break;

            case "ink_type":
              valueSpan.id = "ink_type";
              // خزن الـ ID الرقمي مباشرة من البيانات اللي جابها من الباك
              valueSpan.dataset.id = report.ink_type_id || "";
              valueSpan.dataset.rawtext = raw;
              valueSpan.textContent = report.ink_type || "";
              break;

            case "ink_serial":
              valueSpan.id = "ink_serial";
              valueSpan.dataset.id = idField || raw;
              valueSpan.dataset.rawtext = raw;
              valueSpan.textContent = report.ink_serial_number || "";
              break;

            default:
              valueSpan.dataset.rawtext = raw;
              valueSpan.textContent = value || "";
          }

          div.appendChild(valueSpan);
          specsContainer.appendChild(div);

          // ترجمة التسمية إذا العربية
          if (languageManager.currentLang === "ar") {
            const tr = languageManager.translations.ar[i18n];
            if (tr) labelSpan.textContent = tr;
          }
        });


      




        }

        return;
      }

      // داخلية أو خارجية
      const isInternalTicket = report.maintenance_type === "Internal";
      let ticketNumber = report.ticket_number?.trim();

      // محاولة استخراج رقم التذكرة من الوصف أو الملخص
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
let titlePrefix = "Maintenance";

if (report.maintenance_type === "Regular") {
  titlePrefix = "Regular Maintenance";
}
else if (report.maintenance_type === "General") {
  titlePrefix = "General Maintenance";
}
else if (report.maintenance_type === "Internal") {
  titlePrefix = "Internal Ticket";
}
else if (report.maintenance_type === "External") {
  // distinguish the “new” external path
  titlePrefix =
    report.source === "external-new"
      ? "External Ticket"
      : "External Maintenance";
}

const translatedTitle =
  translations.titleType?.[titlePrefix]?.[lang] ||
  titlePrefix;


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

      document.getElementById("report-title").textContent = reportTitle;
      document.getElementById("report-title").setAttribute("data-i18n", "report_title_key");

      document.getElementById("report-id").textContent =
        report.maintenance_type === "Internal"
          ? report.ticket_number || `INT-${report.id}`
          : report.report_number || report.request_number || `MR-${report.id}`;

      document.getElementById("priority").textContent = isExternal ? "" : translatedPriority;
      document.getElementById("device-type").textContent = translatedType;
      document.getElementById("assigned-to").textContent = getAssignedTo(report);


      document.getElementById("department").textContent = translatedDept;
      document.getElementById("category").textContent = translatedCategory;
      document.getElementById("report-status").textContent = report.status || "Pending";
      document.getElementById("submitted-date").textContent = `Submitted on ${new Date(report.created_at).toLocaleString()}`;

      const problem = (report.problem_status || "").trim();
      const summary = (report.issue_summary || report.initial_diagnosis || "").trim();

      let descriptionHtml = "";
      if (isInternalTicket) {
        descriptionHtml = summary || "No description.";
      } else {
        const normalizedProblem = problem.toLowerCase();
        const normalizedSummary = summary.toLowerCase();

        if (problem && summary) {
          if (normalizedSummary.includes(normalizedProblem)) {
            descriptionHtml = summary;
          } else if (normalizedProblem.includes(normalizedSummary)) {
            descriptionHtml = problem;
          } else {
            descriptionHtml = `${summary}<br>${problem}`;
          }
        } else if (problem) {
          descriptionHtml = problem;
        } else if (summary) {
          descriptionHtml = summary;
        } else {
          descriptionHtml = "No description.";
        }
      }

      if (report.maintenance_type === "General") {
        descriptionHtml = report.issue_description || report.issue_summary || "No description.";
      }

      if (report.maintenance_type === "Regular") {
        descriptionHtml = report.problem_status || report.issue_summary || "No description.";
      }

      descriptionHtml = descriptionHtml
        .replace(/^Selected Issue:\s*/i, "")
        .replace(/\s*\[(ar|en)\]/gi, "")
        .trim();

      // 🔄 تحويل النصوص إلى مصفوفة عناصر items
      let items = [];
      try {
        const parsed = JSON.parse(descriptionHtml);
        if (Array.isArray(parsed)) {
          items = parsed;
        } else {
          throw new Error("Not array");
        }
      } catch {
        items = descriptionHtml
          .replace(/^\[|\]$/g, "")
          .split(/[\n,،]+/)
          .map(s =>
            s
              .replace(/^["“”']?|["“”']?$/g, "")
              .replace(/\s*\[(ar|en)\]$/i, "")
              .trim()
          )
          .filter(Boolean);
      }

      // — 4) ترجمة كل عنصر في items بالقاموس أو Google إذا لم يوجد
      const translatedItems = [];
      for (const text of items) {
        const cleanedText = text.replace(/[“”]/g, '"').trim();
        const dict = translations.description || {};
        const foundKey = Object.keys(dict).find(key => key.trim() === cleanedText);

        if (foundKey) {
          translatedItems.push(`- ${dict[foundKey][lang]}`);
        } else {
          const googleTranslated = await translateWithGoogle(cleanedText, lang, "en");
          translatedItems.push(`- ${googleTranslated}`);
        }
      }
      const finalTranslated = translatedItems.join("<br>");

      const descEl = document.getElementById("description");
      descEl.innerHTML = finalTranslated || "No description.";
      descEl.style.textAlign = lang === 'ar' ? 'right' : 'left';

      if (report.maintenance_type === "General") {
        const generalInfo = [
          { label: "Customer Name", value: report.customer_name, i18n: "customer_name" },
          { label: "ID Number", value: report.id_number, i18n: "id_number" },
          { label: "Ext Number", value: report.extension, i18n: "ext_number" },
          { label: "Initial Diagnosis", value: report.diagnosis_initial, i18n: "initial_diagnosis" },
          { label: "Final Diagnosis", value: report.diagnosis_final, i18n: "final_diagnosis" },
          { label: "Floor", value: report.floor, i18n: "floor" },
        ];

        // نبني الـ HTML للحقول، ونستخدم دائماً Google Translate لطباعة قيمة الطابق
    const generalHtml = generalInfo
  .map(item => {
    const tmap = languageManager.translations?.[lang] || {};
    const translatedLabel = tmap[item.i18n] || item.label;
    // هنا نستخدم القيمة الأصلية بدون ترجمة جوجل
    const displayValue = item.value || "N/A";
    return `
      <div class="info-row">
        <span class="info-label" data-i18n="${item.i18n}">${translatedLabel}</span>
        <span class="info-value">${displayValue}</span>
      </div>
    `;
  })

        document.getElementById("note").innerHTML = `
    <div class="info-box">
      <div class="info-title" data-i18n="additional_information">Additional Information</div>
      ${generalHtml.join("")}
    </div>
  `;

        languageManager.applyLanguage();
      }
      else {
         // new: أولاً technical_notes، بعدين fallbacks
 const baseNote = isExternal
   ? (report.final_diagnosis || report.technical_notes || report.full_description)
   : (report.technical_notes || report.full_description || report.final_diagnosis);
 let noteHtml = `
   <div class="info-box">
     <div class="info-title" data-i18n="${isExternal ? 'final_diagnosis' : 'technical_notes'}">
       ${isExternal ? "Final Diagnosis" : "Technical Team Notes"}:
     </div>
     <div class="info-row">
       <span class="info-value">${baseNote || "No notes."}</span>
     </div>
   </div>
 `;

        if (report.ticket_type) {
          noteHtml += `
            <div class="info-box" style="margin-top:10px;">
              <div class="info-title" data-i18n="issue_summary">Issue Summary:</div>
              <div class="info-row">
                <span class="info-value">${report.issue_description}</span>
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
                  <span class="info-value">${report.final_diagnosis}</span>
                </div>
              </div>
            `;
          }
          if (report.maintenance_manager) {
            noteHtml += `
              <div class="info-box" style="margin-top:10px;">
                <div class="info-title" data-i18n="maintenance_manager">Maintenance Manager:</div>
                <div class="info-row">
                  <span class="info-value">${report.maintenance_manager}</span>
                </div>
              </div>
            `;
          }
        }

        document.getElementById("note").innerHTML = noteHtml;
        languageManager.applyLanguage();
        const noteEl = document.getElementById("note");
        noteEl.dataset.oldText = noteEl.innerText.trim();
        

      }







      const specs = [];
      const cleanTag = (value) => value?.toString().trim().replace(/\s*\[(ar|en)\]$/i, "");

      if (report.device_name) specs.push(`🔘 Device Name: ${cleanTag(report.device_name)}`);
      if (report.serial_number) specs.push(`🔑 Serial Number: ${cleanTag(report.serial_number)}`);
      if (report.governmental_number) specs.push(`🏛️ Ministry Number: ${cleanTag(report.governmental_number)}`);
      if (report.cpu_name) specs.push(`🧠 CPU: ${cleanTag(report.cpu_name)}`);
      if (report.ram_type) specs.push(`💾 RAM: ${cleanTag(report.ram_type)}`);
      if (report.os_name) specs.push(`🖥️ OS: ${cleanTag(report.os_name)}`);
      if (report.generation_number) specs.push(`📶 Generation: ${cleanTag(report.generation_number)}`);
      if (report.model_name) specs.push(`🔧 Model: ${cleanTag(report.model_name)}`);
      if (report.drive_type) specs.push(`💽 Hard Drive: ${cleanTag(report.drive_type)}`);
      if (report.ram_size) specs.push(`📏 RAM Size: ${cleanTag(report.ram_size)}`);
      if (report.mac_address) specs.push(`🌐 MAC Address: ${cleanTag(report.mac_address)}`);
      if (report.ip_address) specs.push(`🖧 IP Address: ${cleanTag(report.ip_address)}`);
      if (report.printer_type) specs.push(`🖨️ Printer Type: ${cleanTag(report.printer_type)}`);
      if (report.ink_type) specs.push(`🖋️ Ink Type: ${cleanTag(report.ink_type)}`);
      if (report.ink_serial_number) specs.push(`🔖 Ink Serial Number: ${cleanTag(report.ink_serial_number)}`);
      if (report.scanner_type) specs.push(`📠 Scanner Type: ${cleanTag(report.scanner_type)}`);





      const specsContainer = document.getElementById("device-specs");
      specsContainer.innerHTML = "";
      if (report.device_type) {
        const specsContainer = document.getElementById("device-specs");
        specsContainer.innerHTML = "";

        const deviceType = (report.device_type || "").trim().toLowerCase();

        const fields = [
          { icon: "🔘", label: "Device Name:", value: cleanTag(report.device_name), alwaysShow: true, i18n: "device_name" },
          { icon: "🔑", label: "Serial Number:", value: cleanTag(report.serial_number), alwaysShow: true, i18n: "serial_number" },
          { icon: "🏛️", label: "Ministry Number:", value: cleanTag(report.governmental_number), alwaysShow: true, i18n: "ministry_number" },
          { icon: "🧠", label: "CPU:", value: cleanTag(report.cpu_name), showForPC: true, i18n: "cpu" },
          { icon: "💾", label: "RAM:", value: cleanTag(report.ram_type), showForPC: true, i18n: "ram" },
          { icon: "🖥️", label: "OS:", value: cleanTag(report.os_name), showForPC: true, i18n: "os" },
          { icon: "📶", label: "Generation:", value: cleanTag(report.generation_number), showForPC: true, i18n: "generation" },
          { icon: "🔧", label: "Model:", value: cleanTag(report.model_name), alwaysShow: true, i18n: "model" },
          { icon: "📟", label: "Device Type:", value: cleanTag(report.device_type), i18n: "device_type" },
          { icon: "💽", label: "Hard Drive:", value: cleanTag(report.drive_type), showForPC: true, i18n: "hard_drive" },
          { icon: "📏", label: "RAM Size:", value: cleanTag(report.ram_size), showForPC: true, i18n: "ram_size" },
          { icon: "🌐", label: "MAC Address:", value: cleanTag(report.mac_address), showForPC: true, i18n: "mac_address" },
          { icon: "🖧", label: "IP Address:", value: cleanTag(report.ip_address), showForPC: true, i18n: "ip_address" },
          { icon: "🖨️", label: "Printer Type:", value: cleanTag(report.printer_type), showForPrinter: true, i18n: "printer_type" },
          { icon: "🖋️", label: "Ink Type:", value: cleanTag(report.ink_type), showForPrinter: true, i18n: "ink_type" },
          { icon: "🔖", label: "Ink Serial Number:", value: cleanTag(report.ink_serial_number), showForPrinter: true, i18n: "ink_serial" },
          { icon: "📠", label: "Scanner Type:", value: cleanTag(report.scanner_type), showForScanner: true, i18n: "scanner_type" },
        ];
        fields.forEach(({ icon, label, value, showForPC, showForPrinter, showForScanner, alwaysShow, i18n, idField }) => {
          const shouldShow =
            alwaysShow ||
            (showForPC && ["pc", "desktop", "laptop", "كمبيوتر", "لابتوب"].includes(deviceType)) ||
            (showForPrinter && deviceType === "printer") ||
            (showForScanner && deviceType === "scanner") ||
            !!value;

          if (!shouldShow) return;

          const div = document.createElement("div");
          div.className = "spec-box";

          // أيقونة
          const iconSpan = document.createElement("span");
          iconSpan.textContent = icon;
          iconSpan.style.marginRight = "5px";
          div.appendChild(iconSpan);

          // تسمية الحقل
          const labelSpan = document.createElement("span");
          labelSpan.setAttribute("data-i18n", i18n);
          labelSpan.textContent = label;
          div.appendChild(labelSpan);

          // مسافة
          div.appendChild(document.createTextNode(" "));

          // القيمة مع id و data-id و data-rawtext
          const valueSpan = document.createElement("span");
          // نص خام قبل أي تعديل يطابق option الحالي
          const raw = value != null ? String(value).trim() : "";
          switch (i18n) {
            case "device_name":
              valueSpan.id = "device_name";
              valueSpan.dataset.id = idField || raw;
              valueSpan.dataset.rawtext = raw;
              valueSpan.textContent = report.device_name || "";
              break;

            case "serial_number":
              valueSpan.id = "serial_number";
              valueSpan.dataset.id = idField || raw;
              valueSpan.dataset.rawtext = raw;
              valueSpan.textContent = report.serial_number || "";
              break;

            case "ministry_number": // governmental_number
              valueSpan.id = "governmental_number";
              valueSpan.dataset.id = idField || raw;
              valueSpan.dataset.rawtext = raw;
              valueSpan.textContent = report.governmental_number || "";
              break;

            case "ip_address":
              valueSpan.id = "ip_address";
              valueSpan.dataset.id = idField || raw;
              valueSpan.dataset.rawtext = raw;
              valueSpan.textContent = report.ip_address || "";
              break;

            case "mac_address":
              valueSpan.id = "mac_address";
              valueSpan.dataset.id = idField || raw;
              valueSpan.dataset.rawtext = raw;
              valueSpan.textContent = report.mac_address || "";
              break;

            case "model":
              valueSpan.id = "model";
              valueSpan.dataset.id = idField || raw;
              valueSpan.dataset.rawtext = raw;
              valueSpan.textContent = report.model_name || "";
              break;

            case "device_type":
              valueSpan.id = "device_type";
              valueSpan.dataset.id = idField || raw;
              valueSpan.dataset.rawtext = raw;
              valueSpan.textContent = report.device_type || "";
              break;

            case "cpu":
              valueSpan.id = "cpu";
              // خزن الـ ID الرقمي مباشرة من البيانات اللي جابها من الباك
              valueSpan.dataset.id = report.cpu_id || "";
              valueSpan.dataset.rawtext = raw;
              valueSpan.textContent = report.cpu_name || "";
              break;

            case "ram":
              valueSpan.id = "ram_type";
              // خزن الـ ID الرقمي مباشرة من البيانات اللي جابها من الباك
              valueSpan.dataset.id = report.ram_id || "";
              valueSpan.dataset.rawtext = raw;
              valueSpan.textContent = report.ram_type || "";
              break;


            case "os":
              valueSpan.id = "os";
              // خزن الـ ID الرقمي مباشرة من البيانات اللي جابها من الباك
              valueSpan.dataset.id = report.os_id || "";
              valueSpan.dataset.rawtext = raw;
              valueSpan.textContent = report.os_name || "";
              break;

            case "generation":
              valueSpan.id = "generation";
              // خزن الـ ID الرقمي مباشرة من البيانات اللي جابها من الباك
              valueSpan.dataset.id = report.generation_id || "";
              valueSpan.dataset.rawtext = raw;
              valueSpan.textContent = report.generation_number || "";
              break;

            case "hard_drive":
              valueSpan.id = "drive_type";
              // خزن الـ ID الرقمي مباشرة من البيانات اللي جابها من الباك
              valueSpan.dataset.id = report.drive_id || "";
              valueSpan.dataset.rawtext = raw;
              valueSpan.textContent = report.drive_type || "";
              break;
            case "ram_size":
              valueSpan.id = "ram_size";
              // خزن الـ ID الرقمي مباشرة من البيانات اللي جابها من الباك
              valueSpan.dataset.id = report.ram_id || "";
              valueSpan.dataset.rawtext = raw;
              valueSpan.textContent = report.ram_size || "";
              break;

            case "scanner_type":
              valueSpan.id = "scanner_type";
              // خزن الـ ID الرقمي مباشرة من البيانات اللي جابها من الباك
              valueSpan.dataset.id = report.scanner_type_id || "";
              valueSpan.dataset.rawtext = raw;
              valueSpan.textContent = report.scanner_type || "";
              break;

            case "printer_type":
              valueSpan.id = "printer_type";
              // خزن الـ ID الرقمي مباشرة من البيانات اللي جابها من الباك
              valueSpan.dataset.id = report.printer_type_id || "";
              valueSpan.dataset.rawtext = raw;
              valueSpan.textContent = report.printer_type || "";
              break;

            case "ink_type":
              valueSpan.id = "ink_type";
              // خزن الـ ID الرقمي مباشرة من البيانات اللي جابها من الباك
              valueSpan.dataset.id = report.ink_type_id || "";
              valueSpan.dataset.rawtext = raw;
              valueSpan.textContent = report.ink_type || "";
              break;

            case "ink_serial":
              valueSpan.id = "ink_serial";
              valueSpan.dataset.id = idField || raw;
              valueSpan.dataset.rawtext = raw;
              valueSpan.textContent = report.ink_serial_number || "";
              break;

            default:
              valueSpan.dataset.rawtext = raw;
              valueSpan.textContent = value || "";
          }

          div.appendChild(valueSpan);
          specsContainer.appendChild(div);

          // ترجمة التسمية إذا العربية
          if (languageManager.currentLang === "ar") {
            const tr = languageManager.translations.ar[i18n];
            if (tr) labelSpan.textContent = tr;
          }
        });






      }



    })
    .catch(err => {
      console.error("❌ Error fetching report:", err);
    });

  function prepareArabic(text) {
    try {
      const reshaped = ArabicReshaper.reshape(text);
      return bidi.getVisualString(reshaped);
    } catch {
      return text;
    }
  }

  function getImageBase64(imgElement) {
    const canvas = document.createElement("canvas");
    canvas.width = imgElement.naturalWidth;
    canvas.height = imgElement.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(imgElement, 0, 0);
    return canvas.toDataURL("image/png");
  }
  function waitForImagesToLoad(images) {
    return Promise.all(
      images.map(img => {
        return new Promise(resolve => {
          if (img.complete) resolve();
          else img.onload = () => resolve();
        });
      })
    );
  }
  function normalizeKey(str) {
    return str?.trim().toLowerCase();
  }

  const translations = {

    titleType: {
      "Internal Ticket": { en: "Internal Ticket", ar: "تذكرة داخلية" },
      "External Ticket": { en: "External Ticket", ar: "تذكرة خارجية" },
      "Regular Maintenance": { en: "Regular Maintenance", ar: "صيانة دورية" },
      "General Maintenance": { en: "General Maintenance", ar: "صيانة عامة" },
      "External Maintenance": { en: "External Maintenance", ar: "صيانة خارجية" },
      "Ticket": { en: "Ticket", ar: "تذكرة" } // ← هذا السطر مهم"
    },
    priority: {
      "High": { en: "High", ar: "عالية" },
      "Medium": { en: "Medium", ar: "متوسطة" },
      "Low": { en: "Low", ar: "منخفضة" }
    },
    deviceType: {
      "pc": { en: "pc", ar: "كمبيوتر" },
      "Printer": { en: "Printer", ar: "طابعة" },
      "printer": { en: "printer", ar: "طابعة" },
      "Scanner": { en: "Scanner", ar: "ماسح ضوئي" },
      "scanner": { en: "Scanner", ar: "ماسح ضوئي" }
    },
    departments: {
      "Laboratory Department": { en: "Laboratory Department", ar: "قسم المختبر" },
      "Orthopedic Nursing (Men's Ward)": {
        en: "Orthopedic Nursing (Men's Ward)",
        ar: "تمريض العظام - قسم الرجال"
      },
      "Executive Director's Office": {
        en: "Executive Director's Office",
        ar: "مكتب المدير التنفيذي"
      },
      "Internal Medicine Nursing (Women's Ward)": {
        en: "Internal Medicine Nursing (Women's Ward)",
        ar: "تمريض الباطنة - قسم النساء"
      },
      "Surgical Nursing (Women's Ward)": {
        en: "Surgical Nursing (Women's Ward)",
        ar: "تمريض الجراحة - قسم النساء"
      },
      "Orthopedic Nursing (Women's Ward)": {
        en: "Orthopedic Nursing (Women's Ward)",
        ar: "تمريض العظام - قسم النساء"
      },
      "Surgical Nursing (Men's Ward)": {
        en: "Surgical Nursing (Men's Ward)",
        ar: "تمريض الجراحة - قسم الرجال"
      },

      "Internal Medicine Nursing (Men's Ward)": { en: "Internal Medicine Nursing (Men's Ward)", ar: "تمريض الباطنة (قسم الرجال)" },
      "Intensive Care Unit (ICU) Nursing": { en: "Intensive Care Unit (ICU) Nursing", ar: "تمريض العناية المركزة" },
      "Nursing Services Administration": { en: "Nursing Services Administration", ar: "إدارة خدمات التمريض" },
      "Daily Procedures Unit Nursing": { en: "Daily Procedures Unit Nursing", ar: "تمريض وحدة الإجراءات اليومية" },
      "Pulmonology Department": { en: "Pulmonology Department", ar: "قسم الأمراض الصدرية" },
      "General Surgery Department": { en: "General Surgery Department", ar: "قسم الجراحة العامة" },
      "Medical Supply Department": { en: "Medical Supply Department", ar: "قسم الإمداد الطبي" },
      "Medical Rehabilitation and Physiotherapy": { en: "Medical Rehabilitation and Physiotherapy", ar: "قسم التأهيل والعلاج الطبيعي" },
      "Bed Management Administration": { en: "Bed Management Administration", ar: "إدارة تنسيق الأسرة" },
      "Outpatient Clinics": { en: "Outpatient Clinics", ar: "العيادات الخارجية" },
      "Emergency Department": { en: "Emergency Department", ar: "قسم الطوارئ" },
      "Academic Affairs, Training, and Medical Education Administration": {
        en: "Academic Affairs, Training, and Medical Education Administration",
        ar: "إدارة الشؤون الأكاديمية والتدريب والتعليم الطبي"
      },
      "Endoscopy and Gastroenterology Department": { en: "Endoscopy and Gastroenterology Department", ar: "قسم التنظير والجهاز الهضمي" },
      "Health Economics Administration": { en: "Health Economics Administration", ar: "إدارة الاقتصاد الصحي" },
      "On-Call Supervisors' Office": { en: "On-Call Supervisors' Office", ar: "مكتب المشرفين المناوبين" },
      "Outpatient Clinics Nursing": { en: "Outpatient Clinics Nursing", ar: "تمريض العيادات الخارجية" },
      "Legal Affairs Department": { en: "Legal Affairs Department", ar: "قسم الشؤون القانونية" },
      "General Maintenance Department": { en: "General Maintenance Department", ar: "قسم الصيانة العامة" },
      "Finance and Accounting Administration": { en: "Finance and Accounting Administration", ar: "إدارة المالية والمحاسبة" },
      "Records, Archives, and Administrative Communications Department": {
        en: "Records, Archives, and Administrative Communications Department",
        ar: "قسم السجلات والأرشيف والمراسلات الإدارية"
      },
      "Nutrition Services Administration": { en: "Nutrition Services Administration", ar: "إدارة خدمات التغذية" },
      "Mental Health Department": { en: "Mental Health Department", ar: "قسم الصحة النفسية" },
      "Mortality Department": { en: "Mortality Department", ar: "قسم الوفيات" },
      "Psychiatric Nursing": { en: "Psychiatric Nursing", ar: "تمريض الطب النفسي" },
      "Orthopedic Nursing (Men’s Ward)": { en: "Orthopedic Nursing (Men’s Ward)", ar: "تمريض العظام (قسم الرجال)" },
      "Psychiatric Clinics Nursing": { en: "Psychiatric Clinics Nursing", ar: "تمريض العيادات النفسية" },
      "Diagnostic Radiology Department": { en: "Diagnostic Radiology Department", ar: "قسم الأشعة التشخيصية" },
      "Endoscopy Nursing": { en: "Endoscopy Nursing", ar: "تمريض التنظير" },
      "Home Healthcare Department": { en: "Home Healthcare Department", ar: "قسم الرعاية الصحية المنزلية" },
      "Telephone Exchange Department": { en: "Telephone Exchange Department", ar: "قسم سنترال الهاتف" },
      "Facilities and Support Services Administration": { en: "Facilities and Support Services Administration", ar: "إدارة المرافق والخدمات المساندة" },
      "Urology Department": { en: "Urology Department", ar: "قسم المسالك البولية" },
      "Surgical Nursing (Men’s Ward)": { en: "Surgical Nursing (Men’s Ward)", ar: "تمريض الجراحة (قسم الرجال)" },
      "Facilities and Maintenance Administration": { en: "Facilities and Maintenance Administration", ar: "إدارة المرافق والصيانة" },
      "Warehouse Department": { en: "Warehouse Department", ar: "قسم المستودعات" },
      "Security Department": { en: "Security Department", ar: "قسم الأمن" },
      "Archive Department": { en: "Archive Department", ar: "قسم الأرشيف" },
      "General Services Administration": { en: "General Services Administration", ar: "إدارة الخدمات العامة" },
      "Blood Bank Department": { en: "Blood Bank Department", ar: "قسم بنك الدم" },
      "Surgical Operations Department": { en: "Surgical Operations Department", ar: "قسم العمليات الجراحية" },
      "Procurement Administration": { en: "Procurement Administration", ar: "إدارة المشتريات" },
      "Transportation Department": { en: "Transportation Department", ar: "قسم النقل" },
      "Health Education Department": { en: "Health Education Department", ar: "قسم التوعية الصحية" },
      "Patient Experience Administration": { en: "Patient Experience Administration", ar: "إدارة تجربة المريض" },
      "Investment Administration": { en: "Investment Administration", ar: "إدارة الاستثمار" },
      "Internal Medicine Department": { en: "Internal Medicine Department", ar: "قسم الباطنة" },
      "Inventory Control Administration": { en: "Inventory Control Administration", ar: "إدارة مراقبة المخزون" },
      "Conservative Treatment Department": { en: "Conservative Treatment Department", ar: "قسم العلاج التحفظي" },
      "Emergency Nursing": { en: "Emergency Nursing", ar: "تمريض الطوارئ" },
      "Central Sterilization Department": { en: "Central Sterilization Department", ar: "قسم التعقيم المركزي" },
      "Internal Audit Department": { en: "Internal Audit Department", ar: "قسم التدقيق الداخلي" },
      "Dental Assistants Department": { en: "Dental Assistants Department", ar: "قسم مساعدي الأسنان" },
      "Endodontics Department": { en: "Endodontics Department", ar: "قسم علاج جذور الأسنان" },
      "Periodontology and Gum Surgery Department": { en: "Periodontology and Gum Surgery Department", ar: "قسم أمراض اللثة وجراحة اللثة" },
      "Payroll and Entitlements Department": { en: "Payroll and Entitlements Department", ar: "قسم الرواتب والمستحقات" },
      "Executive Administration for Medical Services": { en: "Executive Administration for Medical Services", ar: "الإدارة التنفيذية للخدمات الطبية" },
      "Home Psychiatry Department": { en: "Home Psychiatry Department", ar: "قسم الطب النفسي المنزلي" },
      "Security Services Nursing": { en: "Security Services Nursing", ar: "تمريض الخدمات الأمنية" },
      "Pharmacy Department": { en: "Pharmacy Department", ar: "قسم الصيدلية" },
      "Outpatient Clinics": { en: "Outpatient Clinics", ar: "العيادات الخارجية" },
      "Infection Control Department": { en: "Infection Control Department", ar: "قسم مكافحة العدوى" },
      "Public Health Department": { en: "Public Health Department", ar: "قسم الصحة العامة" },
      "Internal Medicine Nursing (Women’s Ward)": { en: "Internal Medicine Nursing (Women’s Ward)", ar: "تمريض الباطنة (قسم النساء)" },
      "Human Resources Operations Department": { en: "Human Resources Operations Department", ar: "إدارة عمليات الموارد البشرية" },
      "Patient Affairs Administration": { en: "Patient Affairs Administration", ar: "إدارة شؤون المرضى" },
      "Medical Secretary Department": { en: "Medical Secretary Department", ar: "قسم السكرتارية الطبية" },
      "Information Release Department": { en: "Information Release Department", ar: "قسم الإفصاح عن المعلومات" },
      "Social Services Department": { en: "Social Services Department", ar: "قسم الخدمة الاجتماعية" },
      "Jobs and Recruitment Department": { en: "Jobs and Recruitment Department", ar: "قسم التوظيف والاستقطاب" },
      "Dental Center": { en: "Dental Center", ar: "مركز الأسنان" },
      "Dermatology Department": { en: "Dermatology Department", ar: "قسم الأمراض الجلدية" },
      "Admissions Office": { en: "Admissions Office", ar: "مكتب الدخول" },
      "Orthopedics Department": { en: "Orthopedics Department", ar: "قسم العظام" },
      "Medical Statistics Department": { en: "Medical Statistics Department", ar: "قسم الإحصاء الطبي" },
      "Financial Planning and Control Administration": { en: "Financial Planning and Control Administration", ar: "إدارة التخطيط والرقابة المالية" },
      "Human Resources Planning Administration": { en: "Human Resources Planning Administration", ar: "إدارة تخطيط الموارد البشرية" },
      "Telemedicine Administration": { en: "Telemedicine Administration", ar: "إدارة الطب الاتصالي" },
      "Health Information Management": { en: "Health Information Management", ar: "إدارة المعلومات الصحية" },
      "Nephrology Nursing": { en: "Nephrology Nursing", ar: "تمريض الكلى" },
      "Home Healthcare Nursing": { en: "Home Healthcare Nursing", ar: "تمريض الرعاية الصحية المنزلية" },
      "Medical Records Department": { en: "Medical Records Department", ar: "قسم السجلات الطبية" },
      "Safety Department": { en: "Safety Department", ar: "قسم السلامة" },
      "Executive Administration for Human Resources": { en: "Executive Administration for Human Resources", ar: "الإدارة التنفيذية للموارد البشرية" },
      "Prosthodontics Department": { en: "Prosthodontics Department", ar: "قسم تركيبات الأسنان" },
      "Surgical Nursing (Women’s Ward)": { en: "Surgical Nursing (Women’s Ward)", ar: "تمريض الجراحة (قسم النساء)" },
      "Quality and Patient Safety Administration": { en: "Quality and Patient Safety Administration", ar: "إدارة الجودة وسلامة المرضى" },
      "Executive Administration for Financial and Administrative Affairs": { en: "Executive Administration for Financial and Administrative Affairs", ar: "الإدارة التنفيذية للشؤون المالية والإدارية" },
      "Operating Room Nursing": { en: "Operating Room Nursing", ar: "تمريض غرف العمليات" },
      "Information Technology Administration": { en: "Information Technology Administration", ar: "إدارة تقنية المعلومات" },
      "Compliance Department": { en: "Compliance Department", ar: "قسم الالتزام" },
      "Ophthalmology and Optometry Unit": { en: "Ophthalmology and Optometry Unit", ar: "وحدة طب وجراحة العيون والبصريات" },
      "Attendance Monitoring Administration": { en: "Attendance Monitoring Administration", ar: "إدارة متابعة الحضور" },
      "Emergency Department": { en: "Emergency Department", ar: "قسم الطوارئ" },
      "Human Resources Services Administration": { en: "Human Resources Services Administration", ar: "إدارة خدمات الموارد البشرية" },
      "Medical Maintenance Department": { en: "Medical Maintenance Department", ar: "قسم الصيانة الطبية" },
      "Government Relations Department": { en: "Government Relations Department", ar: "قسم العلاقات الحكومية" },
      "Finance Office": { en: "Finance Office", ar: "مكتب المالية" },
      "Orthopedic Nursing (Women’s Ward)": { en: "Orthopedic Nursing (Women’s Ward)", ar: "تمريض العظام (قسم النساء)" },
      "Housing Department": { en: "Housing Department", ar: "قسم الإسكان" },
      "Vascular Surgery Department": { en: "Vascular Surgery Department", ar: "قسم جراحة الأوعية الدموية" },
      "Anesthesiology Department": { en: "Anesthesiology Department", ar: "قسم التخدير" },
      "Executive Director’s Office": { en: "Executive Director’s Office", ar: "مكتب المدير التنفيذي" },
      "Human Resources Development Administration": { en: "Human Resources Development Administration", ar: "إدارة تطوير الموارد البشرية" },
      "Admissions and Healthcare Access Support Administration": { en: "Admissions and Healthcare Access Support Administration", ar: "إدارة القبول ودعم الوصول للرعاية الصحية" },
      "Internal Communication Administration": { en: "Internal Communication Administration", ar: "إدارة الاتصال الداخلي" },
      "Nephrology Department": { en: "Nephrology Department", ar: "قسم أمراض الكلى" },
      "Medical Documentation Department": { en: "Medical Documentation Department", ar: "قسم التوثيق الطبي" },
      "Neurosurgery Department": { en: "Neurosurgery Department", ar: "قسم جراحة الأعصاب" },
      "Endocrinology Department": { en: "Endocrinology Department", ar: "قسم الغدد الصماء" },
      "Ambulance Transportation Department": { en: "Ambulance Transportation Department", ar: "قسم النقل بالإسعاف" },
      "Religious Awareness and Spiritual Support Administration": { en: "Religious Awareness and Spiritual Support Administration", ar: "إدارة التوعية الدينية والدعم الروحي" },
      "Neurology Department": { en: "Neurology Department", ar: "قسم الأعصاب" },
      "Neurosurgery Nursing": { en: "Neurosurgery Nursing", ar: "تمريض جراحة الأعصاب" },
      "Occupational Health Clinic": { en: "Occupational Health Clinic", ar: "عيادة الصحة المهنية" },
      "Pediatric Dentistry Department": { en: "Pediatric Dentistry Department", ar: "قسم أسنان الأطفال" },
      "Otorhinolaryngology (ENT) Department": { en: "Otorhinolaryngology (ENT) Department", ar: "قسم الأنف والأذن والحنجرة" },
      "Strategic Planning and Transformation Administration": { en: "Strategic Planning and Transformation Administration", ar: "إدارة التخطيط الاستراتيجي والتحول" },
      "Emergency Planning and Preparedness Unit": { en: "Emergency Planning and Preparedness Unit", ar: "وحدة التخطيط للطوارئ والاستعداد" },
      "Clinical Nutrition Department": { en: "Clinical Nutrition Department", ar: "قسم التغذية العلاجية" },
      "Celiac Disease Center": { en: "Celiac Disease Center", ar: "مركز مرض السيلياك" },
      "Respiratory Therapy Department": { en: "Respiratory Therapy Department", ar: "قسم العلاج التنفسي" },
      "Orthodontics Department": { en: "Orthodontics Department", ar: "قسم تقويم الأسنان" },
      "Communication, Public Relations, and Health Media Administration": { en: "Communication, Public Relations, and Health Media Administration", ar: "إدارة التواصل والعلاقات العامة والإعلام الصحي" },
      "Geriatrics and Elderly Care Center": { en: "Geriatrics and Elderly Care Center", ar: "مركز طب ورعاية المسنين" },
      "Medical Coding Department": { en: "Medical Coding Department", ar: "قسم الترميز الطبي" },
      "Executive Administration": { en: "Executive Administration", ar: "الإدارة التنفيذية" },
      "Prisons Department": { en: "Prisons Department", ar: "قسم السجون" },
    },

    category: {
      'General': { en: "General ", ar: "صيانة عامة" },
      'General Maintenance': { en: "General Maintenance", ar: "صيانة عامة" },
      'Regular': { en: "Regular ", ar: "صيانة دورية" },
      'Regular Maintenance': { en: "Regular Maintenance", ar: "صيانة دورية" },
      "External Maintenance": { en: "External Maintenance", ar: "صيانة خارجية" },
      "Incident / Report": { en: "Incident / Report", ar: "بلاغ داخلي / بلاغ عادي" },
      "Incident": { en: "Incident", ar: "بلاغ داخلي / بلاغ عادي" },
      "Follow-Up": { en: "FollowUp", ar: "متابعة" },
      "Modification Request": { en: "Modification", ar: "طلب تعديل" },
      "Other": { en: "Other", ar: "أي نوع آخر" }
    },

    description: {
      "Computer won’t turn on at all (no lights/sound)": { en: "Computer won’t turn on at all (no lights/sound)", ar: "الكمبيوتر لا يعمل إطلاقًا (لا أضواء/أصوات)" },
      "Turns on but screen stays black": { en: "Turns on but screen stays black", ar: "يعمل ولكن تبقى الشاشة سوداء" },
      "Black screen / Blue screen with white error text (crashes suddenly)": { en: "Black screen / Blue screen with white error text (crashes suddenly)", ar: "شاشة سوداء أو زرقاء برسالة خطأ (يتعطل فجأة)" },
      "Stuck on loading screen (Windows/macOS won’t start)": { en: "Stuck on loading screen (Windows/macOS won’t start)", ar: "عالق في شاشة التحميل (ويندوز/ماك لا يقلع)" },
      "Monitor says \"No Signal\"": { en: "Monitor says \"No Signal\"", ar: "الشاشة تعرض \"لا يوجد إشارة\"" },
      "Blank Screen but computer is on": { en: "Blank Screen but computer is on", ar: "شاشة فارغة ولكن الكمبيوتر يعمل" },
      "Randomly shuts down or restarts": { en: "Randomly shuts down or restarts", ar: "يغلق أو يعيد التشغيل عشوائيًا" },
      "Computer makes weird noises (beeping, grinding)": { en: "Computer makes weird noises (beeping, grinding)", ar: "الكمبيوتر يصدر أصواتًا غريبة (صفير، طحن)" },
      "External hard drive not recognized": { en: "External hard drive not recognized", ar: "الهارد الخارجي غير معرّف" },
      "Mouse/keyboard disconnects randomly (wireless)": { en: "Mouse/keyboard disconnects randomly (wireless)", ar: "الماوس أو الكيبورد يفصل بشكل عشوائي (لاسلكي)" },
      "USB port not connecting / not charging": { en: "USB port not connecting / not charging", ar: "منفذ USB لا يعمل / لا يشحن" },
      "Extremely slow (takes a long time to open files/apps)": { en: "Extremely slow (takes a long time to open files/apps)", ar: "بطئ شديد (يتأخر في فتح الملفات/البرامج)" },
      "Freezes or gets stuck (mouse/keyboard stop working)": { en: "Freezes or gets stuck (mouse/keyboard stop working)", ar: "يتجمد أو يتوقف عن الاستجابة (الماوس/الكيبورد لا يعمل)" },
      "Programs keep crashing/closing unexpectedly": { en: "Programs keep crashing/closing unexpectedly", ar: "البرامج تغلق فجأة أو تتعطل باستمرار" },
      "Wrong colors (too dark, Inverted colors)": { en: "Wrong colors (too dark, Inverted colors)", ar: "ألوان غير صحيحة (غامقة جدًا، معكوسة)" },
      "Flickering or flashing screen": { en: "Flickering or flashing screen", ar: "وميض أو اهتزاز في الشاشة" },
      "Mouse not working": { en: "Mouse not working", ar: "الماوس لا يعمل" },
      "Keyboard not working": { en: "Keyboard not working", ar: "الكيبورد لا يعمل" },
      "Mouse pointer moves on its own": {
        en: "Mouse pointer moves on its own",
        ar: "مؤشر الماوس يتحرك من تلقاء نفسه"
      },
      "No sound from speakers/headphones": {
        en: "No sound from speakers/headphones",
        ar: "لا يوجد صوت من السماعات أو سماعات الرأس"
      },
      "Sound is crackling or distorted": {
        en: "Sound is crackling or distorted",
        ar: "الصوت مشوش أو متقطع"
      },
      "Microphone not working": {
        en: "Microphone not working",
        ar: "الميكروفون لا يعمل"
      },
      "Wi-Fi keeps disconnecting": {
        en: "Wi-Fi keeps disconnecting",
        ar: "الواي فاي ينقطع باستمرار"
      },
      "No internet even when connected": {
        en: "No internet even when connected",
        ar: "لا يوجد إنترنت رغم الاتصال"
      },
      "Can’t connect to Wi-Fi (wrong password/error)": {
        en: "Can’t connect to Wi-Fi (wrong password/error)",
        ar: "لا يمكن الاتصال بالواي فاي (كلمة مرور خاطئة أو خطأ)"
      },
      "Web pages load very slowly": {
        en: "Web pages load very slowly",
        ar: "صفحات الإنترنت تفتح ببطء شديد"
      },
      "Deleted a file by accident (need recovery)": {
        en: "Deleted a file by accident (need recovery)",
        ar: "تم حذف ملف عن طريق الخطأ (يحتاج استرجاع)"
      },
      "“Disk full” error (out of storage space)": {
        en: "“Disk full” error (out of storage space)",
        ar: "رسالة \"امتلاء القرص\" (لا توجد مساحة تخزين)"
      },
      "Application Problem (Apps not working)": {
        en: "Application Problem (Apps not working)",
        ar: "مشكلة في التطبيقات (لا تعمل)"
      },
      "Program won’t install/uninstall": {
        en: "Program won’t install/uninstall",
        ar: "لا يمكن تثبيت أو إزالة البرنامج"
      },
      "“Not responding” errors (frozen apps)": {
        en: "“Not responding” errors (frozen apps)",
        ar: "أخطاء \"لا يستجيب\" (البرامج مجمدة)"
      },
      "Pop-up ads/viruses (suspicious programs)": {
        en: "Pop-up ads/viruses (suspicious programs)",
        ar: "نوافذ منبثقة / فيروسات (برامج مشبوهة)"
      },
      "Windows/Mac update failed": {
        en: "Windows/Mac update failed",
        ar: "فشل تحديث النظام (ويندوز أو ماك)"
      },
      "Microsoft Office needs activation / Not working": {
        en: "Microsoft Office needs activation / Not working",
        ar: "أوفيس يحتاج تفعيل / لا يعمل"
      },
      "Windows needs activation / Not working": {
        en: "Windows needs activation / Not working",
        ar: "ويندوز يحتاج تفعيل / لا يعمل"
      },
      "Forgot password (can’t sign in)": {
        en: "Forgot password (can’t sign in)",
        ar: "نسيت كلمة المرور (لا يمكن تسجيل الدخول)"
      },
      "“Your account is locked” message": {
        en: "“Your account is locked” message",
        ar: "رسالة \"تم قفل حسابك\""
      },
      "Wrong username/password (but it’s correct)": {
        en: "Wrong username/password (but it’s correct)",
        ar: "اسم المستخدم أو كلمة المرور غير صحيحة (رغم أنها صحيحة)"
      },
      "Can’t open a file (unsupported format)": {
        en: "Can’t open a file (unsupported format)",
        ar: "لا يمكن فتح الملف (صيغة غير مدعومة)"
      },
      "Date/time keeps resetting to wrong value": {
        en: "Date/time keeps resetting to wrong value",
        ar: "التاريخ أو الوقت يعيد التعيين لقيمة خاطئة"
      },
      "Takes too long to shut down": {
        en: "Takes too long to shut down",
        ar: "يستغرق وقتًا طويلاً عند الإغلاق"
      },
      "Cables not connected / Need replacement": {
        en: "Cables not connected / Need replacement",
        ar: "الأسلاك غير متصلة أو تحتاج استبدال"
      },

      "Printer is not responding": { en: "Printer is not responding", ar: "الطابعة لا تستجيب" },
      "Printer is not detected": { en: "Printer is not detected", ar: "الطابعة غير مكتشفة" },
      "Printer says \"offline\" when it’s plugged in": { en: "Printer says \"offline\" when it’s plugged in", ar: "الطابعة تظهر غير متصلة رغم توصيلها" },
      "Printer driver error pops up": { en: "Printer driver error pops up", ar: "ظهور خطأ تعريف الطابعة" },
      "Printer turns on but screen is blank": { en: "Printer turns on but screen is blank", ar: "الطابعة تعمل ولكن الشاشة فارغة" },
      "Printer keeps restarting": { en: "Printer keeps restarting", ar: "الطابعة تعيد التشغيل باستمرار" },
      "Printer makes loud grinding noises": { en: "Printer makes loud grinding noises", ar: "الطابعة تصدر أصوات طحن عالية" },
      "Printer disconnects (USB cable not working)": { en: "Printer disconnects (USB cable not working)", ar: "الطابعة تفصل (كابل USB لا يعمل)" },
      "Wi-Fi printer won’t connect to network": { en: "Wi-Fi printer won’t connect to network", ar: "الطابعة اللاسلكية لا تتصل بالشبكة" },
      "Printer works for one computer but not another": { en: "Printer works for one computer but not another", ar: "الطابعة تعمل على جهاز ولا تعمل على آخر" },
      "Can’t find printer in the list of devices": { en: "Can’t find printer in the list of devices", ar: "لا يمكن العثور على الطابعة في قائمة الأجهزة" },
      "Random error message (e.g., \"Error 0x000001\")": { en: "Random error message (e.g., \"Error 0x000001\")", ar: "رسالة خطأ عشوائية (مثل: Error 0x000001)" },
      "Print jobs stuck in queue (nothing comes out)": { en: "Print jobs stuck in queue (nothing comes out)", ar: "أوامر الطباعة عالقة (لا شيء يُطبع)" },
      "Spooler errors (print jobs stuck in queue)": { en: "Spooler errors (print jobs stuck in queue)", ar: "أخطاء في خدمة الطباعة (الطباعة عالقة)" },
      "Printer is turned on but does nothing": { en: "Printer is turned on but does nothing", ar: "الطابعة تعمل لكنها لا تطبع" },
      "Printer won’t print black (only color works)": { en: "Printer won’t print black (only color works)", ar: "الطابعة لا تطبع بالأسود (تطبع ألوان فقط)" },
      "Printer won’t print colors (only black works)": { en: "Printer won’t print colors (only black works)", ar: "الطابعة لا تطبع ألوان (تطبع أسود فقط)" },
      "Ink not recognized (error even after replacing)": { en: "Ink not recognized (error even after replacing)", ar: "الحبر غير معروف (حتى بعد الاستبدال)" },
      "Printer says \"low ink\" but cartridge is new": { en: "Printer says \"low ink\" but cartridge is new", ar: "الطابعة تظهر أن الحبر منخفض رغم أنه جديد" },
      "Printer says \"out of paper\" but tray is full": { en: "Printer says \"out of paper\" but tray is full", ar: "الطابعة تقول أن الورق ناقص رغم امتلاء الصينية" },
      "Paper keeps jamming / Feeding Issues": { en: "Paper keeps jamming / Feeding Issues", ar: "الورق ينحشر باستمرار / مشاكل في السحب" },
      "Printer pulls multiple sheets at once": { en: "Printer pulls multiple sheets at once", ar: "الطابعة تسحب أكثر من ورقة في وقت واحد" },
      "Paper comes out wrinkled or crumpled": { en: "Paper comes out wrinkled or crumpled", ar: "الورق يخرج مجعد أو مكرمش" },
      "Ink smears when touched": { en: "Ink smears when touched", ar: "الحبر يتلطخ عند اللمس" },
      "Print too faint or faded": { en: "Print too faint or faded", ar: "الطباعة باهتة جدًا" },
      "Streaks or lines on printed pages": { en: "Streaks or lines on printed pages", ar: "خطوط على الصفحات المطبوعة" },
      "Spots or smudges on prints": { en: "Spots or smudges on prints", ar: "بقع أو لطخات على المطبوعات" },
      "Colors look wrong (e.g., green instead of blue)": { en: "Colors look wrong (e.g., green instead of blue)", ar: "ألوان غير صحيحة (مثل: أخضر بدل أزرق)" },
      "Wrong colors in prints": { en: "Wrong colors in prints", ar: "ألوان غير صحيحة في الطباعة" },
      "Black ink prints as blank/gray": { en: "Black ink prints as blank/gray", ar: "الحبر الأسود يُطبع رمادي أو لا يُطبع" },
      "Cartridge alignment problems": { en: "Cartridge alignment problems", ar: "مشاكل في محاذاة الخراطيش" },
      "Slow printing speed": { en: "Slow printing speed", ar: "سرعة طباعة بطيئة" },
      "Scanner won’t scan (no response)": { en: "Scanner won’t scan (no response)", ar: "الماسح لا يستجيب" },
      "Scanned image is weird or cut off": { en: "Scanned image is weird or cut off", ar: "الصورة الممسوحة غير مكتملة أو مقطوعة" },
      "Scanned documents come out blurry": { en: "Scanned documents come out blurry", ar: "المستندات الممسوحة غير واضحة" },
      "The pages are blank / empty": { en: "The pages are blank / empty", ar: "الصفحات فارغة / لا تحتوي على محتوى" },
      "Spooler errors (print jobs stuck in queue)": {
        en: "Spooler errors (print jobs stuck in queue)",
        ar: "أخطاء في خدمة الطباعة (الطباعة عالقة)"
      },

      "Scanner won’t turn on (no lights/noise)": { en: "Scanner won’t turn on (no lights/noise)", ar: "الماسح لا يعمل (لا أضواء أو صوت)" },
      "Scanner not detected": { en: "Scanner not detected", ar: "الماسح غير مكتشف" },
      "\"Driver not found\" error": { en: "\"Driver not found\" error", ar: "خطأ \"لم يتم العثور على التعريف\"" },
      "Scanner not showing up in the list": { en: "Scanner not showing up in the list", ar: "الماسح لا يظهر في القائمة" },
      "Scanner makes loud grinding noises": { en: "Scanner makes loud grinding noises", ar: "الماسح يصدر أصوات طحن عالية" },
      "Scanner light flickers or stays off": { en: "Scanner light flickers or stays off", ar: "ضوء الماسح يومض أو لا يعمل" },
      "Scanner makes noise but doesn’t scan": { en: "Scanner makes noise but doesn’t scan", ar: "الماسح يصدر صوتًا لكنه لا يعمل" },
      "Scanner is busy error (even when not in use)": { en: "Scanner is busy error (even when not in use)", ar: "خطأ: الماسح مشغول (حتى عند عدم الاستخدام)" },
      "Scanner won’t grab the paper (no movement)": { en: "Scanner won’t grab the paper (no movement)", ar: "الماسح لا يسحب الورق (لا حركة)" },
      "Paper jams while scanning": { en: "Paper jams while scanning", ar: "الورق ينحشر أثناء المسح" },
      "Paper gets stuck or crumpled": { en: "Paper gets stuck or crumpled", ar: "الورق يتعطل أو يتكرمش" },
      "Scanner pulls multiple pages at once": { en: "Scanner pulls multiple pages at once", ar: "الماسح يسحب عدة صفحات دفعة واحدة" },
      "Printer works but scanner doesn’t": { en: "Printer works but scanner doesn’t", ar: "الطابعة تعمل ولكن الماسح لا يعمل" },
      "Scanner disconnects randomly (USB/Wi-Fi)": { en: "Scanner disconnects randomly (USB/Wi-Fi)", ar: "الماسح ينفصل عشوائيًا (USB/واي فاي)" },
      "Scanning software freezes or crashes": { en: "Scanning software freezes or crashes", ar: "برنامج المسح يتجمد أو يتعطل" },
      "Scanner button does nothing (on all-in-one machines)": { en: "Scanner button does nothing (on all-in-one machines)", ar: "زر الماسح لا يستجيب (في الأجهزة متعددة الوظائف)" },
      "Scanned document saves as blank/black": { en: "Scanned document saves as blank/black", ar: "المستند الممسوح يُحفظ فارغًا أو أسود" },
      "Only scans part of the page (cuts off edges)": { en: "Only scans part of the page (cuts off edges)", ar: "يمسح جزءًا من الصفحة فقط (يقطع الحواف)" },
      "Scanned file won’t save": { en: "Scanned file won’t save", ar: "الملف الممسوح لا يُحفظ" },
      "File format is wrong (e.g., saves as .BMP instead of .PDF)": { en: "File format is wrong (e.g., saves as .BMP instead of .PDF)", ar: "صيغة الملف غير صحيحة (مثل: .BMP بدلاً من .PDF)" },
      "Scanned image is blurry": { en: "Scanned image is blurry", ar: "الصورة الممسوحة غير واضحة" },
      "Dark or faded scans (too light/too dark)": { en: "Dark or faded scans (too light/too dark)", ar: "الصور الممسوحة باهتة جدًا أو مظلمة" },
      "Lines or streaks on scanned documents": { en: "Lines or streaks on scanned documents", ar: "خطوط أو شرائط على المستندات الممسوحة" },
      "Colors look wrong (e.g., red looks pink)": { en: "Colors look wrong (e.g., red looks pink)", ar: "ألوان غير صحيحة (مثلاً الأحمر يبدو وردي)" },
      "Black & white scans come out gray": { en: "Black & white scans come out gray", ar: "المسح بالأبيض والأسود يظهر رمادي" },
      "Scanning takes forever (unusually slow)": { en: "Scanning takes forever (unusually slow)", ar: "المسح يستغرق وقتًا طويلاً بشكل غير طبيعي" }
    }
    ,
  };

  function normalizeKey(text) {
    return text
      .replace(/[“”]/g, '"')        // اقتباسات ذكية إلى عادية
      .replace(/[‘’]/g, "'")        // اقتباسات مفردة ذكية
      .replace(/[^A-Za-z0-9\s]/g, "") // نحذف الرموز
      .toLowerCase()
      .trim();
  }


  const normalizedDescriptions = {};
  Object.entries(translations.description).forEach(([key, val]) => {
    const normalized = normalizeKey(key);
    normalizedDescriptions[normalized] = val;
  });

  function reverseTranslate(value, dictionary, targetLang) {
    for (const key in dictionary) {
      const entry = dictionary[key];
      const values = typeof entry === "object" ? Object.values(entry).map(v => v?.trim()) : [entry];
      if (values.includes(value?.trim())) {
        return entry[targetLang] || value;
      }
    }
    return value;
  }


  // ⬇️ تحميل PDF
  document.querySelector(".download-btn")?.addEventListener("click", () => {
    document.getElementById("pdf-options-modal").style.display = "block";

    // ← لا تعتمد على لغة الموقع إطلاقًا، فقط على اختيار المستخدم
    const lang = document.getElementById("pdf-lang").value || "en";
    const isArabic = lang === "ar";

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("p", "mm", "a4", true);

    // ✅ استخدم خط Amiri دائمًا
    doc.addFileToVFS("Amiri-Regular.ttf", tajawalRegularBase64);
    doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
    doc.setFont("Amiri", "normal");

    // 🔄 يمكنك الآن استخدام المتغير isArabic لضبط الاتجاه فقط
  });

  // ✅ دعم توليد PDF بلغتين (عربية / إنجليزية)

  document.getElementById("generate-pdf-btn")?.addEventListener("click", async () => {
    document.getElementById("pdf-options-modal").style.display = "none";

    const msLogoImg = document.querySelector(".ms-logo img");
    const hospitalLogoImg = document.querySelector(".hospital-logo img");
    await waitForImagesToLoad([msLogoImg, hospitalLogoImg]);

    const { jsPDF } = window.jspdf;
    const lang = document.getElementById("pdf-lang").value;
    const isArabic = lang === "ar";

    const doc = new jsPDF("p", "mm", "a4", true);

    doc.addFileToVFS("Amiri-Regular.ttf", tajawalRegularBase64);
    doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
    doc.addFileToVFS("Amiri-Bold.ttf", tajawalBoldBase64);
    doc.addFont("Amiri-Bold.ttf", "Amiri", "bold");

    doc.setFont("Amiri", "normal");
    const pageWidth = doc.internal.pageSize.getWidth();

    const msBase64 = getImageBase64(msLogoImg);
    const hospitalBase64 = getImageBase64(hospitalLogoImg);

    doc.addImage(msBase64, "PNG", 3, 8, 25, 12);
    doc.addImage(hospitalBase64, "PNG", pageWidth - 35, 8, 25, 12);

    const L = {
      en: { report: "Report", report_id: "Report ID", priority: "Priority", device_type: "Device Type", assigned_to: "Assigned To", department: "Department", category: "Category", attachment: "Attachment", description: "Description", technical_notes: "Technical Notes", signature: "Signature", specs: "Device Specifications" },
      ar: { report: "تقرير", report_id: "رقم التقرير", priority: "الأولوية", device_type: "نوع الجهاز", assigned_to: "المسؤول", department: "القسم", category: "الفئة", attachment: "المرفق", description: "الوصف", technical_notes: "ملاحظات فنية", signature: "التوقيع", specs: "مواصفات الجهاز" }
    }[lang];

    let y = 40;

    doc.setFontSize(16);
    // ✅ عنوان التقرير
    // ✅ عنوان التقرير مع دعم الترجمة واللغة
    function normalizeText(text) {
      return text
        .replace(/[“”]/g, '"')
        .replace(/[‘’]/g, "'")
        .replace(/[^A-Za-z\u0600-\u06FF0-9\s]/g, "") // إنجليزي + عربي + أرقام
        .toLowerCase()
        .trim();
    }

    function getTitleKey(text) {
      const norm = normalizeText(text);
      for (const [key, val] of Object.entries(translations.titleType || {})) {
        if (
          normalizeText(key) === norm ||
          normalizeText(val.en) === norm ||
          normalizeText(val.ar) === norm
        ) {
          return key;
        }
      }
      return null;
    }

    // --- داخل كود توليد التقرير
    let reportTitle = document.getElementById("report-title")?.textContent || L.report;
    reportTitle = reportTitle.split("#")[0].trim();

    const titleKey = getTitleKey(reportTitle);
    const translatedReportTitle = titleKey
      ? translations.titleType[titleKey]?.[lang]
      : reportTitle;

    const titleText = isArabic
      ? prepareArabic(`${L.report} :${translatedReportTitle}`)
      : `${L.report}: ${translatedReportTitle}`;

    doc.setFont("Amiri", "bold");
    doc.text(titleText, pageWidth / 2, 20, { align: "center" });



    doc.setFontSize(12);
    const attachmentName = reportData?.attachment_name || null;
    const attachmentUrl = reportData?.attachment_path ? `http://localhost:5050/uploads/${reportData.attachment_path}` : null;

    const showPriority = document.getElementById("opt-priority").checked;
    const showDeviceType = document.getElementById("opt-device-type").checked;
    const showDescription = document.getElementById("opt-description").checked;
    const showNote = document.getElementById("opt-note").checked;
    const showSignature = document.getElementById("opt-signature").checked;
    const showAttachment = document.getElementById("opt-attachment").checked;
    const showSpecs = document.getElementById("opt-specs").checked;

    const align = isArabic ? "right" : "left";
    const xLabel = isArabic ? pageWidth - 15 : 15;
    const xValue = isArabic ? pageWidth - 60 : 60;

    const rawDeviceType = document.getElementById("device-type")?.textContent?.trim();
    const rawCategory = document.getElementById("category")?.textContent?.trim();
    const rawPriority = document.getElementById("priority")?.textContent?.trim();
    const rawDeptFull = reportData.department_name || ""; // مثال: "sun|شمس"

    // 3) اقسمها على '|'
    const parts = rawDeptFull.split("|");
    const enPart = parts[0]?.trim() || ""; // "sun"
    const arPart = parts[1]?.trim() || ""; // "شمس"

    // 4) اختر الجزء المناسب بناءً على lang
    const translatedDepartment = (lang === "ar")
      ? (arPart || enPart)
      : enPart;
    const translatedPriority = reverseTranslate(rawPriority, translations.priority, lang);
    const translatedDeviceType = reverseTranslate(rawDeviceType, translations.deviceType, lang);
    const translatedCategory = reverseTranslate(rawCategory, translations.category, lang);


    const fields = [
      [L.report_id, document.getElementById("report-id")?.textContent],
      showPriority && [L.priority, translatedPriority],
      showDeviceType && [L.device_type, translatedDeviceType],
      [L.assigned_to, document.getElementById("assigned-to")?.textContent],
      [L.department, translatedDepartment],
      [L.category, translatedCategory]
    ].filter(Boolean);

    fields.forEach(([label, value]) => {
      const labelText = isArabic ? prepareArabic(`${label}`) : `${label}:`;
      const valueText = isArabic ? prepareArabic(value || "") : (value || "");
      doc.setFont("Amiri", "bold").text(labelText, xLabel, y, { align });
      doc.setFont("Amiri", "normal").text(valueText, xValue, y, { align });
      y += 8;
    });

    if (showAttachment && attachmentName && attachmentUrl) {
      const label = isArabic ? prepareArabic(`${L.attachment}:`) : `${L.attachment}:`;
      doc.setFont("Amiri", "bold").text(label, xLabel, y, { align });
      doc.setTextColor(0, 0, 255);
      doc.textWithLink(attachmentName, xValue, y, { url: attachmentUrl, align });
      doc.setTextColor(0, 0, 0);
      y += 8;
    }

    if (showDescription) {
      y += 5;
      const descLabel = isArabic ? prepareArabic(L.description) : `${L.description}:`;
      doc.setFont("Amiri", "bold").text(descLabel, xLabel, y, { align });
      y += 6;

      const descEl = document.getElementById("description");
      let rawDesc = descEl?.textContent?.trim() || "";

      if (rawDesc.startsWith("Selected Issue:")) {
        rawDesc = rawDesc.replace(/^Selected Issue:\s*/i, "").trim();
      }

      let items = [];

      try {
        items = JSON.parse(rawDesc);
        if (!Array.isArray(items)) throw new Error();
      } catch {
        // يدعم التقسيم بناءً على الشرطة (-) أو النقطتين أو أسطر جديدة
        items = rawDesc
          .split(/[\n\r\-•]+/g)
          .map(s => s.replace(/^["“”']?|["“”']?$/g, "").trim())
          .filter(Boolean);
      }

      function normalizeKey(text) {
        return text
          .replace(/[“”]/g, '"')        // اقتباسات ذكية
          .replace(/[‘’]/g, "'")        // اقتباسات مفردة
          .replace(/^[^A-Za-z\u0600-\u06FF0-9]+/, "") // نحذف الرموز من بداية النص فقط
          .replace(/[^A-Za-z\u0600-\u06FF0-9\s]/g, "") // نحذف باقي الرموز
          .toLowerCase()
          .trim();
      }

      function findOriginalKeyByAnyLang(text) {
        const normalizedText = normalizeKey(text);
        for (const [key, val] of Object.entries(translations.description)) {
          if (
            normalizeKey(val.en) === normalizedText ||
            normalizeKey(val.ar) === normalizedText ||
            normalizeKey(key) === normalizedText
          ) {
            return key;
          }
        }
        return null;
      }

      items.forEach(text => {
        const normalizedInput = normalizeKey(text);
        const originalKey = findOriginalKeyByAnyLang(text);
        const translated = originalKey
          ? translations.description[originalKey][lang]
          : text;

        console.log("--------");
        console.log("Raw Text:", text);
        console.log("Normalized Input:", normalizedInput);
        console.log("Detected Original Key:", originalKey);
        console.log("Translated Text:", translated);
        console.log("Language:", lang);

        const finalText = lang === "ar" ? prepareArabic(translated) : translated;

        const wrapped = doc.splitTextToSize(finalText, pageWidth - 30);
        doc.setFont("Amiri", "normal").text(wrapped, xLabel, y, { align });
        y += wrapped.length * 6 + 2;
      });


      y += 3;
    }
    if (showNote) {
      const rows = Array.from(document.querySelectorAll("#note .info-row"));
      const isReportArabic = lang === "ar";
      const noteLabel = isReportArabic ? prepareArabic(L.technical_notes) : L.technical_notes;

      doc.setFont("Amiri", "bold").text(noteLabel, xLabel, y, { align });
      y += 6;

      const noteLabelTranslations = {
        "Customer Name": { en: "Customer Name", ar: "اسم العميل" },
        "ID Number": { en: "ID Number", ar: "رقم الهوية" },
        "Ext Number": { en: "Ext Number", ar: "رقم التمديد" }, // ✅ أضف هذا
        "Initial Diagnosis": { en: "Initial Diagnosis", ar: "التشخيص الأولي" }, // ✅ أضف هذا
        "Final Diagnosis": { en: "Final Diagnosis", ar: "التشخيص النهائي" },
        "Floor": { en: "Floor", ar: "الطابق" }
      };

      const floors = {
        "Basement 2": { en: "Basement 2", ar: "القبو الثاني" },
        "Basement 1": { en: "Basement 1", ar: "القبو الأول" },
        "Below Ground": { en: "Below Ground", ar: "تحت الأرض" },
        "Ground Level": { en: "Ground Level", ar: "الدور الأرضي" },
        "First Floor": { en: "First Floor", ar: "الدور الأول" },
        "Second Floor": { en: "Second Floor", ar: "الدور الثاني" },
        "Third Floor": { en: "Third Floor", ar: "الدور الثالث" },
        "Forth Floor": { en: "Fourth Floor", ar: "الدور الرابع" },
        "Fifth Floor": { en: "Fifth Floor", ar: "الدور الخامس" },
        "Sixth Floor": { en: "Sixth Floor", ar: "الدور السادس" },
        "Seventh Floor": { en: "Seventh Floor", ar: "الدور السابع" },
        "Eighth Floor": { en: "Eighth Floor", ar: "الدور الثامن" },
        "Ninth Floor": { en: "Ninth Floor", ar: "الدور التاسع" },
        "Tenth Floor": { en: "Tenth Floor", ar: "الدور العاشر" },
        "Rooftop": { en: "Rooftop", ar: "السطح" },
        "Parking": { en: "Parking", ar: "مواقف السيارات" }
      };

      function findLabelKeyByAnyLang(label, dictionary) {
        const normalized = normalizeKey(label);
        for (const [key, value] of Object.entries(dictionary)) {
          if (
            normalizeKey(key) === normalized ||
            normalizeKey(value.en) === normalized ||
            normalizeKey(value.ar) === normalized
          ) {
            return key;
          }
        }
        return null;
      }


      rows.forEach(row => {
        let rawLabel = row.querySelector(".info-label")?.textContent?.trim() || "";
        let value = row.querySelector(".info-value")?.textContent?.trim() || "";

        rawLabel = rawLabel.replace(/:$/, "").trim();
        const labelKey = findLabelKeyByAnyLang(rawLabel, noteLabelTranslations);
        const translatedLabel = labelKey ? noteLabelTranslations[labelKey][lang] : rawLabel;

        let translatedValue = value;
        if (labelKey === "Floor") {
          const floorKey = findLabelKeyByAnyLang(value, floors);
          translatedValue = floorKey ? floors[floorKey][lang] : value;
        }

        console.log("----------- NOTE ITEM -----------");
        console.log("Raw Label:", rawLabel);
        console.log("Value:", value);
        console.log("Label Key:", labelKey);
        console.log("Translated Label:", translatedLabel);
        console.log("Translated Value:", translatedValue);
        console.log("Language:", lang);

        const line = isArabic
          ? prepareArabic(`${translatedValue} :${translatedLabel}`)
          : `${translatedLabel}: ${translatedValue}`;

        const lines = doc.splitTextToSize(line, pageWidth - 30);
        doc.setFont("Amiri", "normal").text(lines, xLabel, y, { align });
        y += lines.length * 6 + 2;
      });



      y += 5;
    }

    if (showSpecs) {
      const specsTitle = isArabic ? prepareArabic(L.specs) : `${L.specs}:`;
      doc.setFont("Amiri", "bold").text(specsTitle, xLabel, y, { align });
      y += 8;

      const labelTranslations = {
        device_name: { en: "Device Name", ar: "اسم الجهاز" },
        serial_number: { en: "Serial Number", ar: "الرقم التسلسلي" },
        ministry_number: { en: "Ministry Number", ar: "الرقم الوزاري" },
        cpu: { en: "CPU", ar: "المعالج" },
        ram: { en: "RAM", ar: "نوع الذاكرة" },
        os: { en: "OS", ar: "نظام التشغيل" },
        generation: { en: "Generation", ar: "الجيل" },
        model: { en: "Model", ar: "الموديل" },
        device_type: { en: "Device Type", ar: "نوع الجهاز" },
        hard_drive: { en: "Hard Drive", ar: "نوع القرص" },
        ram_size: { en: "RAM Size", ar: "حجم الذاكرة" },
        mac_address: { en: "MAC Address", ar: "عنوان MAC" },
        ip_address: { en: "IP Address", ar: "عنوان IP" },
        printer_type: { en: "Printer Type", ar: "نوع الطابعة" },
        ink_type: { en: "Ink Type", ar: "نوع الحبر" },
        ink_serial: { en: "Ink Serial Number", ar: "الرقم التسلسلي للحبر" },
        scanner_type: { en: "Scanner Type", ar: "نوع الماسح الضوئي" }
      };

      const specs = Array.from(document.querySelectorAll("#device-specs .spec-box"))
        .map(box => {
          const spans = box.querySelectorAll("span");
          if (spans.length < 2) return null;

          const i18nKey = spans[1].getAttribute("data-i18n")?.trim();
          const rawLabel = i18nKey || spans[1].textContent.trim().replace(/[:\s]*$/, "");
          const value = spans[2]?.textContent?.trim() || "";

          if (!rawLabel || !value) return null;

          const translation = labelTranslations[rawLabel]?.[lang] || rawLabel;
          const line = isArabic
            ? prepareArabic(`${value} :${translation}`)
            : `${translation}: ${value}`;
          return line;
        })
        .filter(Boolean);

      const colCount = 2;
      const colWidth = (pageWidth - 30) / colCount;
      let col = 0;
      let startX = 15;

      specs.forEach((spec) => {
        const x = startX + (col * colWidth);
        const lines = doc.splitTextToSize(spec, colWidth);
        lines.forEach((line, idx) => {
          doc.setFont("Amiri", "normal").text(line, x, y + (idx * 5));
        });
        col++;
        if (col === colCount) {
          col = 0;
          y += lines.length * 5 + 2;
        }
      });

      if (col !== 0) y += 10;
    }


    y = Math.max(y + 20, 240);
    const signLabel = isArabic ? prepareArabic(`${L.signature}`) : `${L.signature}:`;
    doc.setFont("Amiri", "bold").text(signLabel, xLabel, y, { align });

    if (showSignature && reportData?.signature_path) {
      try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = `http://localhost:5050/${reportData.signature_path}`;
        await new Promise((res, rej) => {
          img.onload = res;
          img.onerror = rej;
        });

        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext("2d").drawImage(img, 0, 0);
        const url = canvas.toDataURL("image/png");
        doc.addImage(url, "PNG", xLabel - 50, y + 5, 50, 25);
      } catch (e) {
        console.warn("⚠️ Signature not loaded", e);
      }
    }

    const [typeOnly, ticketPart] = reportTitle.split("#").map(p => p.trim());
    const fileName = ticketPart ? `${typeOnly} - ${ticketPart}` : typeOnly;
    doc.save(`${fileName}.pdf`);
  });
  // ===== تكوين الحقول بسبب lookupConfig (ثابتة) =====


  const lookupConfig = [
    { fieldId: "assigned-to", api: "http://localhost:5050/Technical" },
    { fieldId: "department", api: "http://localhost:5050/Departments" },
    { fieldId: "category", api: "http://localhost:5050/api/categories" },
    { fieldId: "device_type", api: "http://localhost:5050/api/device-types" },
  ];


  // ===== نحذف الحقل الثابت model من هنا ونعلّمه خاصة =====
  const specConfig = [
    // { key: "model", api: "/api/pc-models" }, ← يحذف
    { key: "cpu", api: "http://localhost:5050/CPU_Types" },
    { key: "ram", api: "http://localhost:5050/RAM_Types" },
    { key: "os", api: "http://localhost:5050/OS_Types" },
    { key: "generation", api: "http://localhost:5050/Processor_Generations" },
    { key: "hard_drive", api: "http://localhost:5050/Hard_Drive_Types" },
    { key: "ram_size", api: "http://localhost:5050/RAM_Sizes" },
    { key: "printer_type", api: "http://localhost:5050/Printer_Types" },
    { key: "scanner_type", api: "http://localhost:5050/Scanner_Types" },
    { key: "ink_type", api: "http://localhost:5050/Ink_Types" },
  ];

  // دالة لجلب قائمة الخيارات من مسار API
  // ===== تكوين الحقول بسبب lookupConfig (ثابتة) =====



  // قبل:
function createSelectElement(options, currentId, currentRawText, fieldId) {
  const select = document.createElement("select");
  select.style.minWidth = "140px";
  select.style.padding  = "4px";
  select.style.display  = "inline-block";

  // دالة تنظيف الصيغة [en]/[ar] وتقسيم الـ pipe
  const clean = str => (str||"")
    .replace(/\[en\]$/i, "")
    .replace(/\[ar\]$/i, "")
    .trim()
    .split("|")[0];

  // 1) حدد currentText المعروض
  let currentText;
  if (fieldId === "department") {
    const parts = (currentRawText||"").split("|").map(p=>p.trim());
    currentText = languageManager.currentLang === "ar" ? (parts[1]||parts[0]) : parts[0];
  } else {
    currentText = clean(currentRawText);
  }

  // 2) إذا ما عندنا currentId، جرّب تطابق currentText مع options
  let effectiveId = currentId;
  if (!effectiveId) {
    const match = options.find(opt =>
      clean(opt.fullName||opt.name||"") === currentText
    );
    if (match) effectiveId = String(match.id);
  }

  // 3) بناء خيار الـ placeholder بالقيمة الصحيحة
  if (currentText) {
    const optCurr = document.createElement("option");
    optCurr.value       = effectiveId || "";
    optCurr.textContent = currentText;
    optCurr.selected    = true;
    optCurr.dataset.fullname    = currentRawText || currentText;

    select.appendChild(optCurr);

    // خزّن الـ effectiveId والمؤشرات كلها
    select.dataset.oldId        = effectiveId || "";
    select.dataset.currentId    = effectiveId || "";
    select.dataset.oldText      = currentRawText || "";
    select.dataset.currentName  = currentText;
  }

  // 4) بناء بقية الخيارات
  options.forEach(opt => {
    let raw;
    switch (fieldId) {
      case "department":
        const parts = (opt.fullName||"").split("|");
        raw = (languageManager.currentLang === "ar"
               ? (parts[1]||parts[0])
               : parts[0]).trim();
        break;
      case "generation": raw = clean(opt.generation_number); break;
      case "cpu":        raw = clean(opt.cpu_name);       break;
      case "ram":        raw = clean(opt.ram_type);       break;
      case "os":         raw = clean(opt.os_name);        break;
      case "hard_drive": raw = clean(opt.drive_type);     break;
      case "ram_size":   raw = clean(opt.ram_size);       break;
      case "printer_type": raw = clean(opt.printer_type); break;
      case "scanner_type": raw = clean(opt.scanner_type); break;
      case "ink_type":     raw = clean(opt.ink_type);     break;
      default:
        raw = clean(opt.fullName||opt.name||"");
    }

    // تجاهل التكرار
    if (String(opt.id) === select.dataset.currentId || raw === currentText) return;

    const o = document.createElement("option");
    o.value           = String(opt.id);
    o.textContent     = raw;
    o.dataset.fullname = opt.fullName||opt.name||raw;
    select.appendChild(o);
  });

  return select;
}



  async function fetchOptions(apiUrl) {
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error("فشل جلب البيانات من " + apiUrl);
    const rawData = await res.json();

    return rawData.map(opt => ({
      ...opt,
      fullName:
        opt.fullName ||
        opt.name ||
        opt.model_name ||
        opt.serial_number ||
        opt.printer_type ||
        opt.scanner_type ||
        opt.ink_type ||
        ""
    }));
  }

  async function populateModelDropdown(deviceTypeName, currentLang = "en") {
    const spanModel = document.getElementById("model");
    if (!spanModel) return;

    const currentModelId = spanModel.dataset.id || "";
    const currentModelRawText = spanModel.dataset.rawtext || spanModel.textContent.trim();

    // نفصل rawText للإنجليزي والعربي
    const clean = currentModelRawText
      .replace(/\[en\]$/i, "")
      .replace(/\[ar\]$/i, "")
      .trim();
    const [enName, arName] = clean.split("|").map(p => p.trim());
    const displayName = currentLang === "ar" ? (arName || enName) : enName;

    // حدد المفتاح الإنكليزي للـ endpoint (نفس ما عندك)
    let key = deviceTypeName.trim().toLowerCase();
    if (/[^a-z0-9]/i.test(deviceTypeName)) {
      for (const engKey of Object.keys(translations.deviceType)) {
        if (translations.deviceType[engKey].ar === deviceTypeName) {
          key = engKey.toLowerCase();
          break;
        }
      }
    }
    let endpoint;
    if (["pc", "laptop", "desktop"].includes(key)) endpoint = "http://localhost:5050/PC_Model";
    else if (key === "printer") endpoint = "http://localhost:5050/Printer_Model";
    else if (key === "scanner") endpoint = "http://localhost:5050/Scanner_Model";
    else endpoint = `http://localhost:5050/models-by-type/${encodeURIComponent(key)}`;

    console.log("▶ Fetching endpoint:", endpoint);

    // جلب البيانات
    let raw = [];
    try {
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(res.statusText);
      raw = await res.json();
    } catch {
      raw = [];
    }

    // فكّ البيانات إلى modelOptions
    let modelOptions = [];
    if (raw.length > 0) {
      const sample = raw[0];
      if (sample.model_id != null && sample.model_name != null) {
        modelOptions = raw.map(i => ({ id: String(i.model_id), text: i.model_name }));
      } else if (sample.id != null && sample.name != null) {
        modelOptions = raw.map(i => ({ id: String(i.id), text: i.name }));
      } else {
        modelOptions = raw.map(i => ({
          id: String(i.id || i.model_name || JSON.stringify(i)),
          text: String(i.model_name || i.name || JSON.stringify(i))
        }));
      }
    }
    console.log("▶ Parsed modelOptions:", modelOptions);

    // ابني الـ <select>
    const selectModel = document.createElement("select");
    selectModel.id = "model-select";
    selectModel.style.minWidth = "140px";
    selectModel.style.padding = "4px";

    // 👇 هذا الخيار الأول دائماً هو الموديل الحالي
    const placeholder = document.createElement("option");
    placeholder.value = currentModelId;       // ← هنا ID
    placeholder.textContent = displayName;          // ← اسم ظاهر
    placeholder.selected = true;
    selectModel.appendChild(placeholder);

    // بعدين إذا فيه نتائج من السيرفر، ضيفهم تحت
    modelOptions.forEach(opt => {
      const o = document.createElement("option");
      o.value = opt.id;       // ← model_id فعلي
      o.textContent = opt.text;     // ← اسم الموديل للمستخدم
      o.dataset.name = opt.text;    // ← لو احتجت تخزين الاسم كـ data attribute
      selectModel.appendChild(o);
    });


    if (spanModel) spanModel.replaceWith(selectModel);
  }


const noteEl = document.getElementById("note");
noteEl.dataset.oldText = noteEl.textContent.trim();



  // ===== تفعيل وضع التعديل (Edit Mode) =====
  document.querySelector(".edit-btn")?.addEventListener("click", async () => {
    // إظهار/إخفاء الأزرار
    document.querySelector(".edit-btn").style.display = "none";
    document.querySelector(".save-btn").style.display = "inline-block";
    // بعد loop على lookupConfig و specConfig:
    const editableFields = [
      "device_name",
      "serial_number",
      "governmental_number", // بدل ministry-number
      "ip_address",
      "mac_address",
      "ink_serial"    // هذا
    ];

    // استبدال كل <span> بالـ <input>
    editableFields.forEach(fieldId => {
      // إذا هذا الحقل هو ink_serial، نعبّي value و data-id و oldText بشكل خاص
      if (fieldId === "ink_serial") {
        const span = document.getElementById("ink_serial");
        if (!span) return;
        const input = document.createElement("input");
        input.type = "text";
        input.id = "ink_serial-input";
        // القيمة الظاهرة الحالية
        input.value = span.textContent.trim();
        // نحفظ الـ id القديم
        input.dataset.id = span.dataset.id || "";
        input.dataset.oldText = span.textContent.trim();
        span.replaceWith(input);
        return; // ننهي هنا للتجنب إنشاء Input مزدوج
      }

      // البقية تتصرّف كالمعتاد
      const span = document.getElementById(fieldId);
      if (!span) return;
      const input = document.createElement("input");
      input.type = "text";
      input.id = `${fieldId}-input`;
      input.value = span.textContent.trim();
      span.dataset.oldText = span.textContent;
      span.replaceWith(input);
    });


    // 3) بعدها مباشرة: loop على lookupConfig لتحويل spans إلى <select>
    for (const cfg of lookupConfig) {
      const spanEl = document.getElementById(cfg.fieldId);
      if (!spanEl) continue;

      const currentId = spanEl.dataset.id || "";
      const currentRawText = spanEl.dataset.rawtext || spanEl.textContent.trim();
      let options;
      try { options = await fetchOptions(cfg.api); }
      catch { continue; }

      const select = createSelectElement(
        options,
        currentId,
        currentRawText,
        cfg.fieldId
      );
      select.id = cfg.fieldId + "-select";

      // لو الحقل هو "assigned-to" (المهندس) خزن الـ id القديم
      if (cfg.fieldId === "assigned-to") {
        select.dataset.oldId = currentId;
      }

      spanEl.dataset.oldText = spanEl.textContent;
      spanEl.replaceWith(select);
    }


    const deviceTypeSelect = document.getElementById("device_type-select");
    if (deviceTypeSelect) {
      // هنا القيمة ستكون إنكليزي مثل "scanner"
      await populateModelDropdown(deviceTypeSelect.value);
    }

    // 5) بعد الموديل: loop على specConfig لتحويل كل span داخل #device-specs
    const specBoxes = document.querySelectorAll("#device-specs .spec-box");
    for (const { key, api } of specConfig) {
      for (const box of specBoxes) {
        const labelSpan = box.querySelector(`span[data-i18n="${key}"]`);
        if (!labelSpan) continue;

        // إيجاد span القيمة المجاورة
        let sibling = labelSpan.nextSibling;
        while (sibling && sibling.nodeType !== Node.ELEMENT_NODE) {
          sibling = sibling.nextSibling;
        }
        if (!sibling || sibling.tagName !== "SPAN") continue;

        const valueSpan = sibling;
        const currentId = valueSpan.dataset.id || "";
        const currentRawText = valueSpan.dataset.rawtext || valueSpan.textContent.trim();

        let options;
        try {
          options = await fetchOptions(api);
          console.log(`[specConfig] key=${key}`, options);

        }
        catch { continue; }

        const select = createSelectElement(
          options,
          currentId,
          currentRawText,
          key
        );
        select.id = `${key}-select`;
        valueSpan.dataset.oldText = valueSpan.textContent;
        valueSpan.replaceWith(select);

      }
    }

    // === 4) حقل الوصف (#description) ===
    const descEl = document.getElementById("description");
    if (descEl) {
      descEl.dataset.oldText = descEl.textContent;
      descEl.contentEditable = "true";
      descEl.style.border = "1px dashed #aaa";
      descEl.style.backgroundColor = "#fdfdfd";
      descEl.style.minHeight = "60px";
      descEl.style.padding = "4px";
    }


    // === 5) إظهار مداخل المرفقات والتوقيع ===
    document.getElementById("attachment-input").style.display = "block";
    document.getElementById("signature-edit-wrapper").style.display = "block";

    alert("📝 وضع التعديل مفعل");
  });
  function getLookupField(fieldId,) {
    if (fieldId === "assigned-to") {
      return "assigned_to";    // نرسل دايمًا هذا المفتاح
    }
    const map = {
      category: "category",
      device_type: "device_type",
      department: "department_name",
    };
    return map[fieldId] || fieldId;
  }




  document.querySelector(".save-btn")?.addEventListener("click", async () => {
    // أولاً، جب الـ <select> حق “المسؤول”:
    const engSelect = document.getElementById("assigned-to-select");

    const oldEngineerId = engSelect.dataset.oldId || reportData.assigned_to_id || null;


// مباشرة خذ الحالة القديمة:


    // نجمع الحقول الأساسية
    const updatedData = {
      id: reportData.id,
        technical_notes: reportData.technical_notes,  // ← احتفظ بقيمة الملاحظة القديمة

      engineer_id: oldEngineerId,
      printer_type_id: reportData.printer_type_id,
      printer_type: reportData.printer_type,
      ink_type_id: reportData.ink_type_id,
      ink_type: reportData.ink_type,
      scanner_type_id: reportData.scanner_type_id,
      scanner_type: reportData.scanner_type,
      status : reportData.status,
        full_description: reportData.full_description,   // ← أضفته
  priority: reportData.priority,                   // ← أضفته
    };

    // 👇 جيب القيمة الجديدة
    const newEngineerId = engSelect.value || null;

    if (newEngineerId !== oldEngineerId) {
      updatedData.engineer_id = newEngineerId;
      updatedData.assigned_to = engSelect.options[engSelect.selectedIndex]?.text || null;
    }



    for (const cfg of lookupConfig) {
      if (cfg.fieldId === 'assigned-to') continue;

      const selectId = cfg.fieldId + "-select";
      const select = document.getElementById(selectId);
      if (!select) {
        console.warn(`⚠️ no <select> found for "${selectId}"`);
        continue;  // نتجاوز لو ما فيه select
      }

      // طباعة كم خيار وفهرس المحدد حالياً
      console.log(`🔍 ${cfg.fieldId}: selectedIndex=${select.selectedIndex}, optionsCount=${select.options.length}`);

      const selIdx = select.selectedIndex;
      const opt = select.options[selIdx];
      if (!opt) {
        console.warn(`⚠️ no <option> at index ${selIdx} for "${selectId}"`);
        continue;  // نتجاوز لو ما فيه option
      }

      const backendField = getLookupField(cfg.fieldId, reportData.maintenance_type);

      if (cfg.fieldId === "department") {
        updatedData[backendField] = opt.dataset.fullname?.trim() || null;
      }
      else if (cfg.fieldId === "category") {
        updatedData[backendField] = select.value.trim() || null;
      }
      else if (cfg.fieldId === "device_type") {
        const span = document.getElementById("device_type");
        const sel = select.value.trim();
        const orig = span?.dataset.key?.trim();
        const fb = reportData.device_type?.trim();
        updatedData[backendField] = sel || orig || fb || null;
      }
      else {
        updatedData[backendField] =
          opt.dataset.fullname?.trim()
          || select.value.trim()
          || opt.textContent.trim()
          || null;
      }
    }




    {
      const descEl = document.getElementById("description");
      const descNew = descEl?.innerText.trim() || null;
      const descOld = descEl?.dataset.oldText?.trim() || null;
      if (descNew !== descOld) {
        updatedData.full_description = descNew;
      }
    }  

// —————— هنا نسهِّل التعامل مع technical_notes ——————
const noteEl = document.getElementById("note");
const newNoteText = noteEl.textContent.trim();
// اقرأ النص القديم اللي خزّنته عند بدء التحرير
const oldNoteText = noteEl.dataset.oldText?.trim() || "";

// لو تغيّر النص، أبعته
if (newNoteText !== oldNoteText) {
  updatedData.technical_notes = newNoteText;
}



// لو الصيانة عامة نحدّد حقول General من الـ info-row
if (reportData.maintenance_type === "General") {
  document.querySelectorAll("#note .info-row").forEach(row => {
    const key = row.querySelector(".info-label").dataset.i18n;
    const val = row.querySelector(".info-value").innerText.trim() || null;
    switch (key) {
      case "customer_name":
        if (val !== reportData.customer_name) updatedData.customer_name = val;
        break;
      case "id_number":
        if (val !== reportData.id_number) updatedData.id_number = val;
        break;
      case "ext_number":
        if (val !== reportData.extension) updatedData.extension = val;
        break;
      case "initial_diagnosis":
        if (val !== reportData.diagnosis_initial) updatedData.diagnosis_initial = val;
        break;
      case "final_diagnosis":
        if (val !== reportData.diagnosis_final) updatedData.diagnosis_final = val;
        break;
      case "floor":
        if (val !== reportData.floor) updatedData.floor = val;
        break;
    }
  });
} else {



  // وإذا كنت تحتاج تأخذ final_diagnosis أو maintenance_manager
  // للـ external-legacy مثلاً:
  if (reportData.source === "external-legacy") {
    const finalDiag = reportData.final_diagnosis;
    if (finalDiag && finalDiag !== reportData.final_diagnosis) {
      updatedData.final_diagnosis = finalDiag;
    }
    const manager = reportData.maintenance_manager;
    if (manager && manager !== reportData.maintenance_manager) {
      updatedData.maintenance_manager = manager;
    }
  }
}


    // 3) حقول الإدخال الأساسية
    updatedData.device_name = document.getElementById("device_name-input")?.value || null;
    updatedData.serial_number = document.getElementById("serial_number-input")?.value || null;
    updatedData.governmental_number = document.getElementById("governmental_number-input")?.value || null;

    // 4) الموديل
    const selModel = document.getElementById("model-select");
    if (selModel) {
      // القيمة الآن هي model_id
      updatedData.model_id = selModel.value || null;
      // اسمه نجيبه من نص الـ option المحدد
      updatedData.model_name = selModel.options[selModel.selectedIndex]?.textContent || null;
    }
for (const { key } of specConfig) {

  // 1) حاول تجيب الـ select
  const sel = document.getElementById(`${key}-select`);
  let id, name;

  // 2) لو الـ select موجود وفيه خيار محدد
  if (sel && sel.selectedIndex >= 0) {
    const opt = sel.options[sel.selectedIndex];
    id   = opt.value;
    name = opt.dataset.fullname?.trim() || opt.textContent.trim() || null;
  } else {
    // 3) fallback على القيم القديمة في updatedData
    switch (key) {
      case "printer_type":
        id   = updatedData.printer_type_id;
        name = updatedData.printer_type;
        break;
      case "scanner_type":
        id   = updatedData.scanner_type_id;
        name = updatedData.scanner_type;
        break;
      case "ink_type":
        id   = updatedData.ink_type_id;
        name = updatedData.ink_type;
        break;
      default:
        // لبقية المفاتيح زي cpu, ram, os...
        id   = updatedData[`${key}_id`];
        name = updatedData[key];
    }
  }

  // 4) أخيراً حدّد updatedData بناءً على key
  switch (key) {
    case "printer_type":
      updatedData.printer_type_id = id;
      updatedData.printer_type    = name;
      break;
    case "scanner_type":
      updatedData.scanner_type_id = id;
      updatedData.scanner_type    = name;
      break;
    case "ink_type":
      updatedData.ink_type_id = id;
      updatedData.ink_type    = name;
      break;
    case "cpu":
      updatedData.cpu_id   = id;
      updatedData.cpu_name = name;
      break;
    case "ram":
      updatedData.ram_id   = id;
      updatedData.ram_type = name;
      break;
    case "os":
      updatedData.os_id   = id;
      updatedData.os_name = name;
      break;
    case "hard_drive":
      updatedData.drive_id   = id;
      updatedData.drive_type = name;
      break;
    case "generation":
      updatedData.generation_id     = id;
      updatedData.generation_number = name;
      break;
    case "ram_size":
      updatedData.ram_size_id = id;
      updatedData.ram_size    = name;
      break;
  }
}






    // 6) IP و MAC
    updatedData.ip_address = document.getElementById("ip_address-input")?.value
      || document.getElementById("ip_address")?.textContent.trim()
      || null;



    updatedData.mac_address = document.getElementById("mac_address-input")?.value
      || document.getElementById("mac_address")?.textContent.trim()
      || null;

    updatedData.source = reportData.source || "internal";
    console.log(">>> Payload.data.source =", updatedData.source);


    const inkSerialInput = document.getElementById("ink_serial-input");
    if (inkSerialInput) {
      const newSerial = inkSerialInput.value.trim() || null;
      const oldText = inkSerialInput.dataset.oldText?.trim() || "";
      const oldId = inkSerialInput.dataset.id || null;

      if (newSerial === oldText) {
        // ما تغيّر: نبعت الـ id القديم كنص
        updatedData.ink_serial_number = oldId;
      } else {
        // تغيّر: نبعت النص الجديد عشان الباك يسوي getOrCreate عليه
        updatedData.ink_serial_number = newSerial;
      }

      console.log(
        "🏷️ ink_serial-input →",
        "newSerial=", newSerial,
        "oldText=", oldText,
        "→ sending ink_serial_number=", updatedData.ink_serial_number
      );
    }



    // ——————————————————————————

    console.log("🚀 إرسال التحديث:", updatedData);

    // 8) تجهيز FormData
    const formData = new FormData();
    formData.append("data", JSON.stringify(updatedData));

    // إرفاق الملفات
    const file = document.getElementById("attachment-input")?.files[0];
    if (file) formData.append("attachment", file);

    const signatureUpload = document.getElementById("signatureUpload");
    const canvas = document.getElementById("signatureCanvas");
    if (signatureUpload?.files?.length > 0) {
      formData.append("signature", signatureUpload.files[0]);
    } else if (userDrewOnCanvas) {
      await new Promise(resolve => {
        canvas.toBlob(blob => {
          if (blob?.size > 100) {
            formData.append("signature", blob, "signature.png");
          }
          resolve();
        });
      });
    }

    // 9) الإرسال
    try {
      const res = await fetch("http://localhost:5050/update-report-full", {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: formData
      });
      const result = await res.json();

      if (result.message) {
        alert("✅ تم الحفظ بنجاح.");

        // 10) إخفاء الحقول بأمان
        const att = document.getElementById("attachment-input");
        if (att) att.style.display = "none";
        const sigWr = document.getElementById("signature-edit-wrapper");
        if (sigWr) sigWr.style.display = "none";

        const saveBtn = document.querySelector(".save-btn");
        const cancelBtn = document.querySelector(".cancel-btn");
        const editBtn = document.querySelector(".edit-btn");
        if (saveBtn) saveBtn.style.display = "none";
        if (cancelBtn) cancelBtn.style.display = "none";
        if (editBtn) editBtn.style.display = "inline-block";

        location.reload();
      } else {
        throw new Error("❌ لم يتم الحفظ");
      }
    } catch (err) {
      console.error("❌ فشل الحفظ:", err);
      alert("❌ حدث خطأ أثناء الحفظ");
    }


    // 7.2) إعادة .spec-box إلى spans الأصلية أو استبدال الـ selects داخلها
    for (const { key } of specConfig) {
      for (const box of specBoxes) {
        const labelSpan = box.querySelector(`span[data-i18n="${key}"]`);
        if (!labelSpan) continue;

        const select = box.querySelector(`#${key}-select`);
        if (select) {
          const newValText = select.options[select.selectedIndex]?.textContent || "";
          const spanVal = document.createElement("span");
          spanVal.textContent = newValText;
          // نخزن id جديد إن لزم الأمر
          spanVal.dataset.id = select.value || "";
          select.replaceWith(spanVal);
        } else {
          // إن بقي النص حراً، نعيده كما كان
          let oldText = labelSpan.dataset.oldText || "";
          let sibling = labelSpan.nextSibling;
          while (sibling && sibling.nodeType !== Node.ELEMENT_NODE) {
            sibling = sibling.nextSibling;
          }
          if (sibling && sibling.tagName === "SPAN") {
            sibling.textContent = oldText;
          }
        }
      }
    }

    // 7.3) إعادة حالة الوصف النصي
    const descEl2 = document.getElementById("description");
    if (descEl2) {
      descEl2.removeAttribute("contenteditable");
      descEl2.style.border = "none";
      descEl2.style.backgroundColor = "transparent";
      descEl2.style.padding = "0";
      descEl2.textContent = descEl2.dataset.oldText || descEl2.textContent;
    }

    // 7.4) إعادة حقول المواصفات الغير قابلة للتعديل
    const allSpecEls = document.querySelectorAll("#device-specs .spec-box");
    allSpecEls.forEach(el => {
      el.removeAttribute("contenteditable");
      el.style.border = "none";
      el.style.backgroundColor = "transparent";
      el.style.padding = "0";
      el.style.display = "";
      el.style.minHeight = "";
    });

    // 7.5) إخفاء مدخلي المرفق والتوقيع
    document.getElementById("attachment-input").style.display = "none";
    document.getElementById("signature-edit-wrapper").style.display = "none";

    // 7.6) إعادة الأزرار إلى وضعهم الأصلي
    document.querySelector(".save-btn").style.display = "none";
    document.querySelector(".cancel-btn").style.display = "none";
    document.querySelector(".edit-btn").style.display = "inline-block";
  });


  // إغلاق
  document.querySelector(".close-btn")?.addEventListener("click", () => {
    if (confirm("Are you sure you want to close this report?")) {
      window.location.href = "Search Reports.html";
    }
  });
  // ✅ توقيع بالقلم على Canvas


  canvas.addEventListener("mousedown", () => {
    drawing = true;
    userDrewOnCanvas = true; // ✅ تسجيل إن المستخدم رسم

    ctx.beginPath();
  });
  canvas.addEventListener("mousemove", (e) => {
    if (!drawing) return;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
  });
  canvas.addEventListener("mouseup", () => drawing = false);
  canvas.addEventListener("mouseleave", () => drawing = false);

  // ✅ رفع صورة توقيع
  const signatureUpload = document.getElementById("signatureUpload");
  const uploadedSignature = document.getElementById("uploadedSignature");

  signatureUpload.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      uploadedSignature.src = event.target.result;
      uploadedSignature.style.display = "block";
      ctx.clearRect(0, 0, canvas.width, canvas.height); // مسح التوقيع اليدوي
    };
    reader.readAsDataURL(file);
  });

  // ✅ تنظيف التوقيع
  document.getElementById("clearSignature").addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    signatureUpload.value = "";
    uploadedSignature.src = "";
    uploadedSignature.style.display = "none";
  });

});
document.addEventListener("DOMContentLoaded", async () => {
  const editBtn = document.querySelector(".edit-btn"); // ✅ حل المشكلة

  async function checkUserPermissions(userId) {
    if (!userId) {
      userId = localStorage.getItem("userId");
    }

    const userRole = localStorage.getItem("userRole"); // ← نجيب الدور من التخزين المحلي

    // ✅ لو أدمن، نرجع كل الصلاحيات مفتوحة
    if (userRole === "admin") {
      return {
        device_access: "all",
        view_access: true,
        full_access: true,
        add_items: true,
        edit_items: true,
        delete_items: true,
        check_logs: true,
        edit_permission: true
      };
    }

    // ✅ باقي المستخدمين (عاديين) نجيب صلاحياتهم من السيرفر
    try {
      const response = await fetch(`http://localhost:4000/users/${userId}/with-permissions`);
      if (!response.ok) throw new Error('Failed to fetch user permissions');

      const userData = await response.json();
      return {
        device_access: userData.permissions?.device_access || 'none',
        view_access: userData.permissions?.view_access || false,
        full_access: userData.permissions?.full_access || false,
        add_items: userData.permissions?.add_items || false,
        edit_items: userData.permissions?.edit_items || false,
        delete_items: userData.permissions?.delete_items || false,
        check_logs: userData.permissions?.check_logs || false,
        edit_permission: userData.permissions?.edit_permission || false
      };
    } catch (error) {
      console.error('Error checking permissions:', error);
      return {
        device_access: 'none',
        view_access: false,
        full_access: false
      };
    }
  }
  const permissions = await checkUserPermissions();

  if (permissions.full_access || permissions.edit_items) {
    editBtn.style.display = "inline-block"; // 👈 يظهر زر التعديل
  } else {
    editBtn.style.display = "none";
  }

});

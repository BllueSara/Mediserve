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
    .replace(/[""]/g, "")     // حذف علامات التنصيص
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

// انقل دالة getAssignedTo إلى أعلى الملف (خارج أي دوال أو DOMContentLoaded)
function getAssignedTo(report, lang) {
  lang = lang || (languageManager?.currentLang || 'en');
  let raw = '';
  
  console.log("🔍 getAssignedTo called with:", {
    maintenance_type: report.maintenance_type,
    technical_engineer: report.technical_engineer,
    technician_name: report.technician_name,
    technical: report.technical,
    assigned_to: report.assigned_to,
    reporter_name: report.reporter_name
  });
  
  switch (report.maintenance_type) {
    case "Regular":
      raw = report.technical_engineer || '';
      break;
    case "General":
      // 🔧 إصلاح: للـ General استخدم technician_name
      raw = report.technician_name || report.technical_engineer || '';
      break;
    case "Internal":
      raw = report.technical || report.technician_name || '';
      break;
    case "External":
      raw = report.technical_engineer || report.assigned_to || '';
      break;
    default:
      raw = report.assigned_to || report.reporter_name || report.technical_engineer || '';
  }
  
  console.log("🔍 getAssignedTo raw value:", raw);
  
  if (raw.includes("|")) {
    const parts = raw.split("|");
    const en = parts[0] || "";
    const ar = parts[1] || "";
    const result = lang === "ar" ? (ar || en) : en;
    console.log("🔍 getAssignedTo result (with pipe):", result);
    return result;
  }
  
  console.log("🔍 getAssignedTo result (no pipe):", raw);
  return raw;
}

// 🔧 إضافة دالة جديدة للحصول على ID المهندس
function getAssignedToId(report) {
  switch (report.maintenance_type) {
    case "Regular":
      return report.technical_engineer_id || report.assigned_to_id || null;
    case "General":
      // 🔧 إصلاح: للـ General استخدم technician_id
      return report.technician_id || report.assigned_to_id || null;
    case "Internal":
      return report.assigned_to_id || report.technical || report.technician_id || null;
    default:
      return report.assigned_to_id || report.technical || report.technician_id || null;
  }
}

document.addEventListener("DOMContentLoaded", () => {

  const saveBtn = document.querySelector(".save-btn");

  const reportId = new URLSearchParams(window.location.search).get("id");
  const reportType = new URLSearchParams(window.location.search).get("type");

  if (!reportId) return alert("No report ID provided");

  fetch(`http://localhost:4000/report/${reportId}?type=${reportType}`)
    .then(res => res.json())
    .then(async rawReport => { // ← جعل المعالج async لاستخدام await
      console.log("📦 التقرير (خام):", rawReport);

      const report = cleanReport(rawReport); // ← 🧼 تنظيف التاجات
      reportData = report;
          reportData.status = report.status || "Open";

      // بعد cleanReport(rawReport) وقبل apply اللغة والترجمة:
      const map = {
        'device-type': report.device_type,       // raw English key
        'assigned-to': (() => {
          // 🔧 إصلاح: اختر الحقل الصحيح بناءً على نوع الصيانة
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
        'department': report.department_id,     // مثلا رقم القسم
        'category': report.maintenance_type,  // أو الحقل اللي تحدده
      };

      const rawMap = {
        'device-type': report.device_type_raw,   // مثلا "scanner|ماسح ضوئي"
        'assigned-to': (() => {
          // 🔧 إصلاح: اختر الحقل الصحيح بناءً على نوع الصيانة
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
        'department': report.department_raw,    // مثلا "e|ي"
        'category': report.category_raw,      // مثلا "Regular|دورية"
      };

      // 🔧 إضافة logging للتشخيص
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

      // 🔧 إضافة logging مفصل لتشخيص المشكلة
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

      Object.keys(map).forEach(fieldId => {
        const el = document.getElementById(fieldId);
        if (!el) return;
        el.dataset.id = map[fieldId] || '';
        el.dataset.rawtext = rawMap[fieldId] || el.textContent.trim();
      });
      console.log("report payload:", report);

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

      // معالجة المهندس بنفس طريقة القسم
      const assignedToEl = document.getElementById("assigned-to");
      const translatedAssignedTo = getAssignedTo(reportData, lang) || "N/A";
      const engineerId = getAssignedToId(reportData);

      console.log("🔍 Setting assigned-to element:", {
        element: assignedToEl,
        translatedValue: translatedAssignedTo,
        engineerId: engineerId,
        rawData: {
          assigned_to_id: reportData.assigned_to_id,
          assigned_to_raw: reportData.assigned_to_raw,
          assigned_to: reportData.assigned_to,
          technical: reportData.technical,
          technical_engineer: reportData.technical_engineer
        }
      });

      assignedToEl.textContent = translatedAssignedTo;
      assignedToEl.dataset.key = translatedAssignedTo;
      assignedToEl.dataset.rawtext = translatedAssignedTo;
      // 🔧 إضافة ID المهندس الصحيح حسب نوع الصيانة
      if (reportData.maintenance_type === "Regular") {
        assignedToEl.dataset.id = reportData.technical_engineer_id || '';
      } else if (reportData.maintenance_type === "General") {
        assignedToEl.dataset.id = reportData.technician_id || '';
      } else {
        assignedToEl.dataset.id = engineerId || '';
      }


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
        attachmentLink.href = `http://localhost:4000/uploads/${report.attachment_path}`;
        attachmentLink.textContent = `📎 ${report.attachment_name}`;
        attachmentLink.download = report.attachment_name;
        attachmentLink.style = "display: block; margin-top: 10px; color: #007bff; text-decoration: underline;";
        attachmentSection.appendChild(attachmentLink);
      }

      // ✅ عرض التوقيع إذا موجود (نفس مكان المرفق)
      if (report.signature_path) {
        const sigImg = document.createElement("img");
        sigImg.src = `http://localhost:4000/${report.signature_path}`;
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
        
        // معالجة اسم المهندس في حالة new
        const assignedToEl = document.getElementById("assigned-to");
        assignedToEl.textContent = getAssignedTo(report);
        assignedToEl.dataset.key = report.assigned_to_raw || report.assigned_to || "";
        assignedToEl.dataset.rawtext = report.assigned_to_raw || report.assigned_to || "";
        
        document.getElementById("department").textContent = report.department_name || "";
        document.getElementById("category").textContent = "New";
        document.getElementById("report-status").textContent = report.status || "Open";
        document.getElementById("submitted-date").textContent = `Submitted on ${new Date(report.created_at).toLocaleString()}`;
        
        // 🔧 إصلاح: معالجة problem_status في حالة new reports
        let descriptionText = report.description || "No description.";
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
              descriptionText = processedItems.map(item => '• ' + item).join('<br>');
            }
          } catch (e) {
            console.warn("⚠️ Failed to parse new report problem_status JSON:", e);
            descriptionText = processPipeText(report.description, lang) || "No description.";
          }
        } else {
          descriptionText = processPipeText(report.description, lang) || "No description.";
        }
        
        document.getElementById("description").innerHTML = descriptionText;
        document.getElementById("note").innerHTML = `<strong>Note:</strong><br>${processPipeText(report.details, lang) || ""}`;

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
  // distinguish the "new" external path
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
      document.getElementById("assigned-to").textContent = getAssignedTo(report); // <--- REMOVE THIS LINE
      // إعادة تعيين اسم المهندس بالطريقة الصحيحة

      document.getElementById("department").textContent = translatedDept;
      document.getElementById("category").textContent = translatedCategory;
      document.getElementById("report-status").textContent = report.status || "Pending";
      document.getElementById("submitted-date").textContent = `Submitted on ${new Date(report.created_at).toLocaleString()}`;

      const problem = processPipeText((report.problem_status || "").trim(), lang);
      const summary = processPipeText((report.issue_summary || report.initial_diagnosis || "").trim(), lang);

      let descriptionHtml = "";
      if (isInternalTicket) {
        descriptionHtml = summary || "No description.";
      } else {
        // 🔧 إصلاح: معالجة problem_status كـ JSON array
        let processedProblem = problem;
        if (typeof report.problem_status === "string" && report.problem_status.trim().startsWith("[")) {
          try {
            const problemArray = JSON.parse(report.problem_status);
            if (Array.isArray(problemArray) && problemArray.length > 0) {
              // معالجة كل عنصر في المصفوفة
              const processedItems = problemArray.map(item => {
                if (typeof item === "string" && item.includes("|")) {
                  // نص ثنائي اللغة، اختر الجزء المناسب
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

      if (report.maintenance_type === "General") {
        // 🔧 إصلاح: معالجة problem_status للـ General Maintenance
        console.log("🔍 General Maintenance - problem_status:", report.problem_status);
        console.log("🔍 General Maintenance - issue_description:", report.issue_description);
        console.log("🔍 General Maintenance - issue_summary:", report.issue_summary);
        
        let generalDescription = report.issue_description || report.issue_summary || "No description.";
        if (typeof report.problem_status === "string" && report.problem_status.trim().startsWith("[")) {
          try {
            const problemArray = JSON.parse(report.problem_status);
            console.log("🔍 General Maintenance - parsed problemArray:", problemArray);
            if (Array.isArray(problemArray) && problemArray.length > 0) {
              const processedItems = problemArray.map(item => {
                if (typeof item === "string" && item.includes("|")) {
                  const parts = item.split("|").map(p => p.trim());
                  return lang === "ar" ? (parts[1] || parts[0]) : parts[0];
                }
                return item;
              });
              console.log("🔍 General Maintenance - processedItems:", processedItems);
              generalDescription = processedItems.map(item => '• ' + item).join('<br>');
              console.log("🔍 General Maintenance - final generalDescription:", generalDescription);
            }
          } catch (e) {
            console.warn("⚠️ Failed to parse General problem_status JSON:", e);
            generalDescription = processPipeText(report.issue_description || report.issue_summary || "No description.", lang);
          }
        } else {
          generalDescription = processPipeText(report.issue_description || report.issue_summary || "No description.", lang);
        }
        descriptionHtml = generalDescription;
        console.log("🔍 General Maintenance - final descriptionHtml:", descriptionHtml);
      }

      if (report.maintenance_type === "Regular") {
        // 🔧 إصلاح: معالجة problem_status للـ Regular Maintenance
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
        descriptionHtml = processPipeText(regularProblem, lang);
      }

      // 🔧 إضافة معالجة خاصة للـ new reports
      if (report.source === "new") {
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
        descriptionHtml = newDescription;
      }

      // 🔧 إضافة معالجة خاصة للـ Internal tickets
      if (report.maintenance_type === "Internal") {
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
        descriptionHtml = internalSummary;
      }

      descriptionHtml = descriptionHtml
        .replace(/^Selected Issue:\s*/i, "")
        .replace(/\s*\[(ar|en)\]/gi, "")
        .trim();

      // 🔧 إصلاح: معالجة أفضل للنصوص غير المكتملة
      let cleanedDescription = descriptionHtml;
      
      // إذا كان النص يبدأ بـ [ وينتهي بـ ]، احذفهم
      if (cleanedDescription.startsWith("[") && cleanedDescription.endsWith("]")) {
        cleanedDescription = cleanedDescription.slice(1, -1);
      }
      // إذا كان النص يبدأ بـ [ فقط، احذف القوس الأول
      else if (cleanedDescription.startsWith("[")) {
        cleanedDescription = cleanedDescription.slice(1);
      }
      // إذا كان النص ينتهي بـ ] فقط، احذف القوس الأخير
      else if (cleanedDescription.endsWith("]")) {
        cleanedDescription = cleanedDescription.slice(0, -1);
      }
      
      // احذف علامات التنصيص من البداية والنهاية
      cleanedDescription = cleanedDescription.replace(/^["""]?|["""]?$/g, "").trim();

      // 🔧 إصلاح: عرض الوصف بشكل مباشر
      const descEl = document.getElementById("description");
      
      console.log("🔍 Final cleanedDescription:", cleanedDescription);
      console.log("🔍 Final cleanedDescription includes <br>:", cleanedDescription.includes('<br>'));
      console.log("🔍 descEl element:", descEl);
      
      // إذا كان النص يحتوي على HTML tags مثل <br>، اعرضه مباشرة
      if (cleanedDescription.includes('<br>')) {
        descEl.innerHTML = cleanedDescription || "No description.";
        console.log("🔍 Displaying with innerHTML (contains <br>):", cleanedDescription);
        console.log("🔍 After setting innerHTML, descEl.innerHTML:", descEl.innerHTML);
        console.log("🔍 After setting innerHTML, descEl.textContent:", descEl.textContent);
      } else {
        // إذا كان النص يحتوي على "|"، طبق processPipeText
        const processedDescription = processPipeText(cleanedDescription, lang);
        
        // إذا كان النص يحتوي على أسطر متعددة، اعرضه مع فواصل
        if (processedDescription.includes("\n") || processedDescription.includes(",")) {
          const items = processedDescription
            .split(/[\n,،]+/)
            .map(item => item.trim())
            .filter(Boolean)
            .map(item => `- ${item}`)
            .join("<br>");
          
          descEl.innerHTML = items || "No description.";
          console.log("🔍 Displaying with split items:", items);
        } else {
          // نص عادي، اعرضه كما هو
          descEl.innerHTML = processedDescription || "No description.";
          console.log("🔍 Displaying with processedDescription:", processedDescription);
        }
      }
      
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
    // 🔧 إصلاح: معالجة النصوص التي تحتوي على "|" مثل القسم
    const displayValue = processPipeText(item.value, lang) || "N/A";
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
   
    category: {
      'General': { en: "General ", ar: "صيانة عامة" },
      'General Maintenance': { en: "General Maintenance", ar: "صيانة عامة" },
      'Regular': { en: "Regular ", ar: "صيانة دورية" },
      'Regular Maintenance': { en: "Regular Maintenance", ar: "صيانة دورية" },
      "External": { en: "External Maintenance", ar: "صيانة خارجية" },
      "Incident / Report": { en: "Incident / Report", ar: "بلاغ داخلي / بلاغ عادي" },
      "Incident": { en: "Incident", ar: "بلاغ داخلي / بلاغ عادي" },
      "Follow-Up": { en: "FollowUp", ar: "متابعة" },
      "Modification Request": { en: "Modification", ar: "طلب تعديل" },
      "Other": { en: "Other", ar: "أي نوع آخر" }
    },
  };

  function normalizeKey(text) {
    return text
      .replace(/[""]/g, '"')        // اقتباسات ذكية إلى عادية
      .replace(/['']/g, "'")        // اقتباسات مفردة ذكية
      .replace(/[^A-Za-z0-9\s]/g, "") // نحذف الرموز
      .toLowerCase()
      .trim();
  }


  const normalizedDescriptions = {};
  // Object.entries(translations.description).forEach(([key, val]) => {
  //   const normalized = normalizeKey(key);
  //   normalizedDescriptions[normalized] = val;
  // });

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
    console.log("assigned_to_raw:", reportData.assigned_to_raw);
console.log("assigned_to:", reportData.assigned_to);
console.log("عنصر الصفحة:", document.getElementById("assigned-to")?.textContent);
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
        .replace(/[""]/g, '"')
        .replace(/['']/g, "'")
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
    const attachmentUrl = reportData?.attachment_path ? `http://localhost:4000/uploads/${reportData.attachment_path}` : null;

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
    
    // معالجة اسم المهندس بنفس طريقة القسم
    const translatedAssignedTo = getAssignedTo(reportData, lang) || "N/A";

    const translatedPriority = reverseTranslate(rawPriority, translations.priority, lang);
    const translatedDeviceType = reverseTranslate(rawDeviceType, translations.deviceType, lang);
    const translatedCategory = reverseTranslate(rawCategory, translations.category, lang);


    const fields = [
      [L.report_id, document.getElementById("report-id")?.textContent],
      showPriority && [L.priority, translatedPriority],
      showDeviceType && [L.device_type, translatedDeviceType],
      [L.assigned_to, translatedAssignedTo],
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
      let rawDesc = reportData.problem_status || reportData.issue_description || reportData.description || "";

      // 🔧 إصلاح: معالجة أفضل للنصوص غير المكتملة
      if (typeof rawDesc === "string" && rawDesc.trim().startsWith("[")) {
        try {
          // جرب JSON.parse أولاً
          const arr = JSON.parse(rawDesc);
          if (Array.isArray(arr) && arr.length > 0) {
            rawDesc = arr[0];
          }
        } catch {
          // إذا فشل، استخرج النص من داخل الأقواس المربعة
          let cleaned = rawDesc.replace(/^\[/, "").replace(/\]$/, "");
          
          // إذا كان النص يحتوي على فاصلة، خذ أول جزء
          if (cleaned.includes(",")) {
            rawDesc = cleaned.split(",")[0];
          } 
          // إذا كان النص يحتوي على سطر جديد، خذ أول سطر
          else if (cleaned.includes("\n")) {
            rawDesc = cleaned.split("\n")[0];
          } 
          // إذا كان النص يحتوي على علامة تنصيص، خذ أول جزء
          else if (cleaned.includes('"')) {
            rawDesc = cleaned.split('"')[0];
          } 
          // وإلا خذ كل النص داخل الأقواس
          else {
            rawDesc = cleaned;
          }
          
          // تنظيف إضافي للنص المستخرج
          rawDesc = rawDesc.replace(/^["""]?|["""]?$/g, "").trim();
        }
      } else if (typeof rawDesc === "string" && rawDesc.includes('"') && rawDesc.includes(']')) {
        // 🔧 إصلاح: معالجة الحالات مثل 'اسدي"]'
        rawDesc = rawDesc.replace(/["""]?\]$/, "").trim();
      }

      // الآن طبق دالة اللغة
      rawDesc = processPipeText(rawDesc, lang);

      if (rawDesc.startsWith("Selected Issue:")) {
        rawDesc = rawDesc.replace(/^Selected Issue:\s*/i, "").trim();
      }

      // 🔧 إصلاح: استخدم البيانات الأصلية من reportData بدلاً من العنصر في الصفحة
      let originalDescription = "";
      
      // 🔧 إضافة معالجة خاصة للـ new reports
      if (reportData.source === "new") {
        let newDescription = reportData.description || "";
        if (typeof reportData.problem_status === "string" && reportData.problem_status.trim().startsWith("[")) {
          try {
            const problemArray = JSON.parse(reportData.problem_status);
            if (Array.isArray(problemArray) && problemArray.length > 0) {
              const processedItems = problemArray.map(item => {
                if (typeof item === "string" && item.includes("|")) {
                  const parts = item.split("|").map(p => p.trim());
                  return lang === "ar" ? (parts[1] || parts[0]) : parts[0];
                }
                return item;
              });
              originalDescription = processedItems.join("\n");
            }
          } catch (e) {
            console.warn("⚠️ Failed to parse new report problem_status JSON in PDF:", e);
            originalDescription = newDescription;
          }
        } else {
          originalDescription = newDescription;
        }
      } else if (reportData.maintenance_type === "General") {
        // 🔧 إصلاح: معالجة problem_status للـ General Maintenance في PDF
        let generalProblem = reportData.problem_status || reportData.issue_description || reportData.issue_summary || "";
        if (typeof generalProblem === "string" && generalProblem.trim().startsWith("[")) {
          try {
            const problemArray = JSON.parse(generalProblem);
            if (Array.isArray(problemArray) && problemArray.length > 0) {
              const processedItems = problemArray.map(item => {
                if (typeof item === "string" && item.includes("|")) {
                  const parts = item.split("|").map(p => p.trim());
                  return lang === "ar" ? (parts[1] || parts[0]) : parts[0];
                }
                return item;
              });
              originalDescription = processedItems.join("\n");
            }
          } catch (e) {
            console.warn("⚠️ Failed to parse General problem_status JSON in PDF:", e);
            originalDescription = generalProblem;
          }
        } else {
          originalDescription = generalProblem;
        }
      } else if (reportData.maintenance_type === "Regular") {
        // 🔧 إصلاح: معالجة problem_status للـ Regular Maintenance في PDF
        let regularProblem = reportData.problem_status || reportData.issue_summary || "";
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
              originalDescription = processedItems.join("\n");
            }
          } catch (e) {
            console.warn("⚠️ Failed to parse Regular problem_status JSON in PDF:", e);
            originalDescription = regularProblem;
          }
        } else {
          originalDescription = regularProblem;
        }
      } else if (reportData.maintenance_type === "Internal") {
        // 🔧 إصلاح: معالجة issue_summary للـ Internal Maintenance في PDF
        let internalSummary = reportData.issue_summary || reportData.initial_diagnosis || "";
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
              originalDescription = processedItems.join("\n");
            }
          } catch (e) {
            console.warn("⚠️ Failed to parse Internal issue_summary JSON in PDF:", e);
            originalDescription = internalSummary;
          }
        } else {
          originalDescription = internalSummary;
        }
      } else {
        // 🔧 إصلاح: معالجة problem_status للأنواع الأخرى
        let problem = reportData.problem_status || "";
        if (typeof problem === "string" && problem.trim().startsWith("[")) {
          try {
            const problemArray = JSON.parse(problem);
            if (Array.isArray(problemArray) && problemArray.length > 0) {
              const processedItems = problemArray.map(item => {
                if (typeof item === "string" && item.includes("|")) {
                  const parts = item.split("|").map(p => p.trim());
                  return lang === "ar" ? (parts[1] || parts[0]) : parts[0];
                }
                return item;
              });
              problem = processedItems.join("\n");
            }
          } catch (e) {
            console.warn("⚠️ Failed to parse problem_status JSON in PDF:", e);
          }
        }
        
        const summary = reportData.issue_summary || reportData.initial_diagnosis || "";
        
        if (problem && summary) {
          const normalizedProblem = problem.toLowerCase();
          const normalizedSummary = summary.toLowerCase();
          
          if (normalizedSummary.includes(normalizedProblem)) {
            originalDescription = summary;
          } else if (normalizedProblem.includes(normalizedSummary)) {
            originalDescription = problem;
          } else {
            originalDescription = `${summary}\n${problem}`;
          }
        } else if (problem) {
          originalDescription = problem;
        } else if (summary) {
          originalDescription = summary;
        }
      }

      // 🔧 إضافة معالجة خاصة للـ new reports في PDF
      if (reportData.source === "new") {
        let newDescription = reportData.description || "";
        if (typeof reportData.problem_status === "string" && reportData.problem_status.trim().startsWith("[")) {
          try {
            const problemArray = JSON.parse(reportData.problem_status);
            if (Array.isArray(problemArray) && problemArray.length > 0) {
              const processedItems = problemArray.map(item => {
                if (typeof item === "string" && item.includes("|")) {
                  const parts = item.split("|").map(p => p.trim());
                  return lang === "ar" ? (parts[1] || parts[0]) : parts[0];
                }
                return item;
              });
              originalDescription = processedItems.join("\n");
            }
          } catch (e) {
            console.warn("⚠️ Failed to parse new report problem_status JSON in PDF:", e);
            originalDescription = newDescription;
          }
        } else {
          originalDescription = newDescription;
        }
      }

      // 🔧 إصلاح: معالجة النصوص التي تحتوي على "|" مثل القسم
      originalDescription = processPipeText(originalDescription, lang);

      let items = [];

      // 🔧 إضافة معالجة خاصة للـ General reports في PDF
      if (reportData.maintenance_type === "General") {
        console.log("🔍 PDF General Maintenance - reportData.problem_status:", reportData.problem_status);
        let generalProblem = reportData.problem_status || "";
        if (typeof generalProblem === "string" && generalProblem.trim().startsWith("[")) {
          try {
            const problemArray = JSON.parse(generalProblem);
            console.log("🔍 PDF General Maintenance - parsed problemArray:", problemArray);
            if (Array.isArray(problemArray) && problemArray.length > 0) {
              const processedItems = problemArray.map(item => {
                if (typeof item === "string" && item.includes("|")) {
                  const parts = item.split("|").map(p => p.trim());
                  return lang === "ar" ? (parts[1] || parts[0]) : parts[0];
                }
                return item;
              });
              console.log("🔍 PDF General Maintenance - processedItems:", processedItems);
              items = processedItems;
            }
          } catch (e) {
            console.warn("⚠️ Failed to parse General problem_status JSON in PDF:", e);
            items = [originalDescription];
          }
        } else {
          console.log("🔍 PDF General Maintenance - using originalDescription:", originalDescription);
          items = [originalDescription];
        }
        console.log("🔍 PDF General Maintenance - final items:", items);
      } else if (reportData.maintenance_type === "Internal") {
        console.log("🔍 PDF Internal Maintenance - reportData.issue_summary:", reportData.issue_summary);
        let internalSummary = reportData.issue_summary || "";
        if (typeof internalSummary === "string" && internalSummary.trim().startsWith("[")) {
          try {
            const summaryArray = JSON.parse(internalSummary);
            console.log("🔍 PDF Internal Maintenance - parsed summaryArray:", summaryArray);
            if (Array.isArray(summaryArray) && summaryArray.length > 0) {
              const processedItems = summaryArray.map(item => {
                if (typeof item === "string" && item.includes("|")) {
                  const parts = item.split("|").map(p => p.trim());
                  return lang === "ar" ? (parts[1] || parts[0]) : parts[0];
                }
                return item;
              });
              console.log("🔍 PDF Internal Maintenance - processedItems:", processedItems);
              items = processedItems;
            }
          } catch (e) {
            console.warn("⚠️ Failed to parse Internal issue_summary JSON in PDF:", e);
            items = [originalDescription];
          }
        } else {
          console.log("🔍 PDF Internal Maintenance - using originalDescription:", originalDescription);
          items = [originalDescription];
        }
        console.log("🔍 PDF Internal Maintenance - final items:", items);
      } else if (reportData.source === "new") {
        let newDescription = reportData.description || "";
        if (typeof reportData.problem_status === "string" && reportData.problem_status.trim().startsWith("[")) {
          try {
            const problemArray = JSON.parse(reportData.problem_status);
            if (Array.isArray(problemArray) && problemArray.length > 0) {
              const processedItems = problemArray.map(item => {
                if (typeof item === "string" && item.includes("|")) {
                  const parts = item.split("|").map(p => p.trim());
                  return lang === "ar" ? (parts[1] || parts[0]) : parts[0];
                }
                return item;
              });
              newDescription = processedItems.join("\n");
            }
          } catch (e) {
            console.warn("⚠️ Failed to parse new report problem_status JSON:", e);
            newDescription = processPipeText(report.description, lang) || "No description.";
          }
        } else {
          newDescription = processPipeText(report.description, lang) || "No description.";
        }
        originalDescription = newDescription;
      } else {
        try {
          items = JSON.parse(originalDescription);
          if (!Array.isArray(items)) throw new Error();
        } catch {
          // 🔧 إصلاح: معالجة أفضل للنصوص غير المكتملة
          let cleanedDesc = originalDescription;
          
          // إذا كان النص يبدأ بـ [ وينتهي بـ ]، احذفهم
          if (cleanedDesc.startsWith("[") && cleanedDesc.endsWith("]")) {
            cleanedDesc = cleanedDesc.slice(1, -1);
          }
          // إذا كان النص يبدأ بـ [ فقط، احذف القوس الأول
          else if (cleanedDesc.startsWith("[")) {
            cleanedDesc = cleanedDesc.slice(1);
          }
          
          // يدعم التقسيم بناءً على الشرطة (-) أو النقطتين أو أسطر جديدة
          items = cleanedDesc
            .replace(/^["""]?|["""]?$/g, "") // احذف علامات التنصيص من البداية والنهاية
            .split(/[\n\r\-•]+/g)
            .map(s => s.replace(/^["""]?|["""]?$/g, "").trim())
            .filter(Boolean);
        }
      }

      function normalizeKey(text) {
        return text
          .replace(/[""]/g, '"')        // اقتباسات ذكية
          .replace(/['']/g, "'")        // اقتباسات مفردة
          .replace(/^[^A-Za-z\u0600-\u06FF0-9]+/, "") // نحذف الرموز من بداية النص فقط
          .replace(/[^A-Za-z\u0600-\u06FF0-9\s]/g, "") // نحذف باقي الرموز
          .toLowerCase()
          .trim();
      }

      function findOriginalKeyByAnyLang(text) {
        const normalizedText = normalizeKey(text);
        // for (const [key, val] of Object.entries(translations.description)) {
        //   if (
        //     normalizeKey(val.en) === normalizedText ||
        //     normalizeKey(val.ar) === normalizedText ||
        //     normalizeKey(key) === normalizedText
        //   ) {
        //     return key;
        //   }
        // }
        return null;
      }

      items.forEach(text => {
        const normalizedInput = normalizeKey(text);
        const originalKey = findOriginalKeyByAnyLang(text);
        
        // 🔧 إصلاح: معالجة النصوص التي تحتوي على "|" مثل القسم
        const processedText = processPipeText(text, lang);
        
        const translated = originalKey
          ? translations.description[originalKey][lang]
          : processedText; // 🔧 استخدم النص المعالج بدلاً من النص الأصلي

        console.log("--------");
        console.log("Raw Text:", text);
        console.log("Normalized Input:", normalizedInput);
        console.log("Detected Original Key:", originalKey);
        console.log("Processed Text:", processedText);
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
        img.src = `http://localhost:4000/${reportData.signature_path}`;
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
    { fieldId: "assigned-to", api: "http://localhost:4000/Technical" },
    { fieldId: "department", api: "http://localhost:4000/Departments" },
    { fieldId: "category", api: "http://localhost:4000/api/categories" },
    { fieldId: "device_type", api: "http://localhost:4000/api/device-types" },
  ];


  // ===== نحذف الحقل الثابت model من هنا ونعلّمه خاصة =====
  const specConfig = [
    // { key: "model", api: "/api/pc-models" }, ← يحذف
    { key: "cpu", api: "http://localhost:4000/CPU_Types" },
    { key: "ram", api: "http://localhost:4000/RAM_Types" },
    { key: "os", api: "http://localhost:4000/OS_Types" },
    { key: "generation", api: "http://localhost:4000/Processor_Generations" },
    { key: "hard_drive", api: "http://localhost:4000/Hard_Drive_Types" },
    { key: "ram_size", api: "http://localhost:4000/RAM_Sizes" },
    { key: "printer_type", api: "http://localhost:4000/Printer_Types" },
    { key: "scanner_type", api: "http://localhost:4000/Scanner_Types" },
    { key: "ink_type", api: "http://localhost:4000/Ink_Types" },
  ];

  // دالة لجلب قائمة الخيارات من مسار API
  // ===== تكوين الحقول بسبب lookupConfig (ثابتة) =====



  // قبل:
function createSelectElement(options, currentId, currentRawText, fieldId) {
  console.log("🔍 createSelectElement called:", {
    fieldId: fieldId,
    currentId: currentId,
    currentRawText: currentRawText,
    optionsCount: options.length
  });
  
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
  if (fieldId === "department" || fieldId === "assigned-to") {
    const parts = (currentRawText||"").split("|").map(p=>p.trim());
    currentText = languageManager.currentLang === "ar" ? (parts[1]||parts[0]) : parts[0];
  } else {
    currentText = clean(currentRawText);
  }

  // 2) إذا ما عندنا currentId، جرّب تطابق currentText مع options
  let effectiveId = currentId;
  if (!effectiveId) {
    const match = options.find(opt => {
      // 🔧 إصلاح: تطابق أكثر دقة للمهندسين
      if (fieldId === "assigned-to") {
        const optFullName = opt.fullName || opt.technician_name || opt.name || "";
        const optParts = optFullName.split("|");
        const optEn = optParts[0]?.trim() || "";
        const optAr = optParts[1]?.trim() || "";
        
        // تطابق مع النص الحالي
        return optEn === currentText || optAr === currentText || optFullName === currentText;
      } else {
        return clean(opt.fullName||opt.name||"") === currentText;
      }
    });
    if (match) effectiveId = String(match.id);
  }

  console.log("🔍 createSelectElement processing:", {
    currentText: currentText,
    effectiveId: effectiveId,
    fieldId: fieldId
  });

  // 3) بناء خيار الـ placeholder بالقيمة الصحيحة
  if (currentText) {
    const optCurr = document.createElement("option");
    // 🔧 إصلاح: تأكد من أن value يحتوي على ID صحيح
    optCurr.value = effectiveId || "";
    optCurr.textContent = currentText;
    optCurr.selected = true;
    
    // 🔧 إصلاح: احفظ الاسم الكامل في dataset.fullname
    if (fieldId === "assigned-to") {
      // للمهندسين، ابحث عن الاسم الكامل في قائمة الخيارات
      let fullNameToUse = currentRawText || currentText;
      
      // 🔧 ابحث عن الخيار المطابق في options للحصول على الاسم الكامل
      const matchingOption = options.find(opt => {
        const optFullName = opt.fullName || opt.technician_name || opt.name || "";
        const optParts = optFullName.split("|");
        const optEn = optParts[0]?.trim() || "";
        const optAr = optParts[1]?.trim() || "";
        
        // تطابق مع النص الحالي أو الاسم الكامل
        return optEn === currentText || optAr === currentText || optFullName === currentText || optFullName === currentRawText;
      });
      
      if (matchingOption && matchingOption.fullName && matchingOption.fullName.includes("|")) {
        fullNameToUse = matchingOption.fullName;
        console.log("🔍 Found matching option for current engineer:", {
          currentText: currentText,
          matchingFullName: fullNameToUse
        });
      }
      
      optCurr.dataset.fullname = fullNameToUse;
    } else {
      optCurr.dataset.fullname = currentRawText || currentText;
    }

    select.appendChild(optCurr);

    // خزّن الـ effectiveId والمؤشرات كلها
    select.dataset.oldId = effectiveId || "";
    select.dataset.currentId = effectiveId || "";
    select.dataset.oldText = currentRawText || "";
    select.dataset.currentName = currentText;
    
    console.log("🔍 Created current option:", {
      value: optCurr.value,
      textContent: optCurr.textContent,
      fullname: optCurr.dataset.fullname
    });
  }

  // 4) بناء بقية الخيارات
  options.forEach(opt => {
    let raw;
    switch (fieldId) {
      case "department":
      case "assigned-to":
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
    // 🔧 إصلاح: تأكد من أن value يحتوي على ID صحيح
    o.value = String(opt.id);
    o.textContent = raw;
    o.dataset.fullname = opt.fullName||opt.name||raw;
    select.appendChild(o);
  });

  // 🔧 إضافة event listener لتحديث dataset عند تغيير الاختيار
  select.addEventListener("change", function() {
    const selectedOption = this.options[this.selectedIndex];
    if (selectedOption) {
      this.dataset.currentId = selectedOption.value;
      this.dataset.currentName = selectedOption.textContent;
      console.log("🔍 Select changed:", {
        fieldId: fieldId,
        newValue: selectedOption.value,
        newText: selectedOption.textContent
      });
    }
  });

  console.log("🔍 Final select created:", {
    fieldId: fieldId,
    optionsCount: select.options.length,
    selectedIndex: select.selectedIndex,
    selectedValue: select.options[select.selectedIndex]?.value
  });

  return select;
}



  async function fetchOptions(apiUrl) {
    console.log("🔍 Fetching options from:", apiUrl);
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error("فشل جلب البيانات من " + apiUrl);
    const rawData = await res.json();
    
    console.log("🔍 Raw data from API:", rawData);

    const processedData = rawData.map(opt => ({
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
    
    console.log("🔍 Processed data:", processedData);
    return processedData;
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
    if (["pc", "laptop", "desktop"].includes(key)) endpoint = "http://localhost:4000/PC_Model";
    else if (key === "printer") endpoint = "http://localhost:4000/Printer_Model";
    else if (key === "scanner") endpoint = "http://localhost:4000/Scanner_Model";
    else endpoint = `http://localhost:4000/models-by-type/${encodeURIComponent(key)}`;

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
      
      // 🔧 إضافة logging خاص للمهندس
      if (cfg.fieldId === "assigned-to") {
        console.log("🔍 Creating assigned-to select:", {
          currentId: currentId,
          currentRawText: currentRawText,
          spanText: spanEl.textContent,
          dataset: {
            id: spanEl.dataset.id,
            rawtext: spanEl.dataset.rawtext,
            key: spanEl.dataset.key
          }
        });
        
        // 🔧 إضافة logging مفصل للبيانات الأصلية
        console.log("🔍 Original report data for engineer:", {
          maintenance_type: reportData.maintenance_type,
          technician_name: reportData.technician_name,
          technical_engineer: reportData.technical_engineer,
          assigned_to: reportData.assigned_to,
          assigned_to_raw: reportData.assigned_to_raw,
          assigned_to_id: reportData.assigned_to_id,
          technician_id: reportData.technician_id
        });
      }
      
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
        console.log("🔍 Set assigned-to oldId:", currentId);
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
    // أولاً، جب الـ <select> حق "المسؤول":
    const engSelect = document.getElementById("assigned-to-select");

    const oldEngineerId = engSelect.dataset.oldId || reportData.assigned_to_id || null;

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

    // 👇 جيب القيمة الجديدة للمهندس
    const selectedOption = engSelect.options[engSelect.selectedIndex];
    
    // 🔧 إصلاح: احصل على الاسم الكامل من الخيار المحدد
    let fullName = selectedOption.dataset.fullname?.trim() || selectedOption.textContent.trim() || null;
    
    console.log("🔍 Initial fullName from selectedOption:", {
      dataset_fullname: selectedOption.dataset.fullname,
      textContent: selectedOption.textContent,
      fullName: fullName
    });
    
    // 🔧 إذا كان الخيار المحدد هو الخيار الأول (الحالي)، استخدم الاسم الكامل من البيانات الأصلية
    if (engSelect.selectedIndex === 0 && engSelect.dataset.oldText) {
      fullName = engSelect.dataset.oldText;
      console.log("🔍 Using oldText for first option:", engSelect.dataset.oldText);
    }
    
    // 🔧 إذا لم نجد الاسم الكامل، ابحث عنه في قائمة الخيارات
    if (!fullName || !fullName.includes("|")) {
      console.log("🔍 Searching for full name in options...");
      for (let i = 0; i < engSelect.options.length; i++) {
        const opt = engSelect.options[i];
        console.log(`🔍 Option ${i}:`, {
          value: opt.value,
          textContent: opt.textContent,
          dataset_fullname: opt.dataset.fullname,
          matches: opt.value === selectedOption.value
        });
        
        if (opt.value === selectedOption.value && opt.dataset.fullname && opt.dataset.fullname.includes("|")) {
          fullName = opt.dataset.fullname;
          console.log("🔍 Found full name in option:", fullName);
          break;
        }
      }
    }

    // 🔧 إصلاح: استخدم value من الخيار المحدد مباشرة
    const selectedEngineerId = selectedOption.value || engSelect.dataset.oldId || reportData.assigned_to_id || null;

    console.log("🔧 Engineer Debug:", {
      selectedIndex: engSelect.selectedIndex,
      selectedValue: selectedOption.value,
      selectedText: selectedOption.textContent,
      fullName: fullName,
      oldId: engSelect.dataset.oldId,
      reportId: reportData.assigned_to_id,
      finalId: selectedEngineerId
    });

    // 🔧 إضافة validation
    if (!selectedEngineerId && selectedOption.value !== "") {
      console.warn("⚠️ Warning: No engineer ID found but option has value:", selectedOption.value);
    }

    updatedData.engineer_id = selectedEngineerId;
    updatedData.assigned_to = fullName;
    updatedData.technical_engineer = fullName;

    // 🔧 إصلاح: إضافة الحقول الصحيحة حسب نوع الصيانة
    if (reportData.maintenance_type === "Regular") {
      updatedData.technical_engineer_id = selectedEngineerId;  // ← إضافة ID للمهندس
      updatedData.technical_engineer = fullName;               // ← الاسم الكامل
      console.log("🔧 Regular Maintenance - Engineer fields:", {
        technical_engineer_id: selectedEngineerId,
        technical_engineer: fullName
      });
    } else if (reportData.maintenance_type === "General") {
      updatedData.technician_id = selectedEngineerId;          // ← ID للفني
      updatedData.technician_name = fullName;                  // ← اسم الفني
      console.log("🔧 General Maintenance - Technician fields:", {
        technician_id: selectedEngineerId,
        technician_name: fullName
      });
    } else if (reportData.maintenance_type === "Internal") {
      updatedData.assigned_to_id = selectedEngineerId;         // ← ID للمسؤول
      updatedData.assigned_to = fullName;                      // ← اسم المسؤول
      console.log("🔧 Internal Maintenance - Assigned fields:", {
        assigned_to_id: selectedEngineerId,
        assigned_to: fullName
      });
    } else if (reportData.maintenance_type === "External") {
      updatedData.assigned_to_id = selectedEngineerId;         // ← ID للمسؤول
      updatedData.assigned_to = fullName;                      // ← اسم المسؤول
      console.log("🔧 External Maintenance - Assigned fields:", {
        assigned_to_id: selectedEngineerId,
        assigned_to: fullName
      });
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

      if (cfg.fieldId === "department" || cfg.fieldId === "assigned-to") {
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

    // 🔧 إضافة logging مفصل للبيانات المرسلة
    console.log("🔍 Final Payload Analysis:", {
      maintenance_type: reportData.maintenance_type,
      engineer_fields: {
        engineer_id: updatedData.engineer_id,
        assigned_to: updatedData.assigned_to,
        technical_engineer: updatedData.technical_engineer,
        technical_engineer_id: updatedData.technical_engineer_id,
        technician_id: updatedData.technician_id,
        technician_name: updatedData.technician_name,
        assigned_to_id: updatedData.assigned_to_id
      },
      selectedEngineerId: selectedEngineerId,
      fullName: fullName
    });

    // 8) تجهيز FormData
    const formData = new FormData();
    formData.append("data", JSON.stringify(updatedData));

    // إضافة logging إضافي للتشخيص
    console.log("🔍 Final Engineer Data:", {
      engineer_id: updatedData.engineer_id,
      assigned_to: updatedData.assigned_to,
      technical_engineer: updatedData.technical_engineer
    });

    // 🔧 إضافة validation نهائي
    if (!updatedData.engineer_id && updatedData.assigned_to) {
      console.warn("⚠️ Warning: No engineer_id but assigned_to exists:", updatedData.assigned_to);
    }

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
      console.log("🚀 Sending request to server...");
      const res = await fetch("http://localhost:4000/update-report-full", {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: formData
      });
      const result = await res.json();

      console.log("🔍 Server response:", result);
  if (!res.ok || result.error) {
    const msg = result.error || result.message || `خطأ HTTP ${res.status}`;
    throw new Error(msg);
  }

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

        // 🔧 إضافة تأخير قصير قبل إعادة التحميل
        setTimeout(() => {
          console.log("🔄 Reloading page...");
          location.reload();
        }, 500);
      } else {
        throw new Error("❌ لم يتم الحفظ");
      }

} catch (err) {
  console.error("❌ فشل الحفظ:", err);
  // הצגת ההודעה שהגיעה מהשרת
  alert("❌ حدث خطأ أثناء الحفظ: " + err.message);
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

// دالة مساعدة لمعالجة النصوص التي تحتوي على "|" مثل القسم
function processPipeText(text, lang) {
  if (!text || typeof text !== 'string') return text;
  
  // إذا كان النص يحتوي على "|"، اقسمه واختر الجزء المناسب
  if (text.includes("|")) {
    const parts = text.split("|").map(p => p.trim());
    const enPart = parts[0] || "";
    const arPart = parts[1] || "";
    
    // اختر الجزء المناسب حسب اللغة
    if (lang === "ar") {
      return arPart || enPart;
    } else {
      return enPart;
    }
  }
  
  // إذا لم يحتوي على "|"، ارجع النص كما هو
  return text;
}

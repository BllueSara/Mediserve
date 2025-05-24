// 🔙 زر الرجوع
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




function fixEncoding(badText) {
  try {
    const bytes = new Uint8Array([...badText].map(ch => ch.charCodeAt(0)));
    const decoder = new TextDecoder("utf-8");
    return decoder.decode(bytes);
  } catch {
    return badText;
  }
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
    .then(report => {
      console.log("📦 التقرير:", report);

      

      reportData = report;
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
        document.getElementById("assigned-to").textContent = report.assigned_to ||"";
        document.getElementById("department").textContent = report.department_name || "";
        document.getElementById("category").textContent = "New";
        document.getElementById("report-status").textContent = report.status || "Open";
        document.getElementById("submitted-date").textContent = `Submitted on ${new Date(report.created_at).toLocaleString()}`;
        document.getElementById("description").textContent = report.description || "No description.";
        document.getElementById("note").innerHTML = `<strong>Note:</strong><br>${report.details || "No notes."}`;

        const specsContainer = document.getElementById("device-specs");
        specsContainer.innerHTML = "";
        if (report.device_type) {
          const specsContainer = document.getElementById("device-specs");
          specsContainer.innerHTML = "";
          
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
          
          fields.forEach(({ icon, label, value, showForPC, showForPrinter, showForScanner, alwaysShow, i18n }) => {
            const shouldShow =
              alwaysShow ||
              (showForPC && deviceType === "pc") ||
              (showForPrinter && deviceType === "printer") ||
              (showForScanner && deviceType === "scanner") ||
              !!value;
          
            if (shouldShow) {
              const div = document.createElement("div");
              div.className = "spec-box";
              
              // إنشاء عنصر span للأيقونة
              const iconSpan = document.createElement("span");
              iconSpan.textContent = icon;
              iconSpan.style.marginRight = "5px";
              
              // إنشاء عنصر span للتسمية
              const labelSpan = document.createElement("span");
              labelSpan.setAttribute("data-i18n", i18n);
              labelSpan.textContent = label;
              
              // إنشاء عنصر span للقيمة
              const valueSpan = document.createElement("span");
              valueSpan.textContent = value || "";
              
              // إضافة العناصر إلى div
              div.appendChild(iconSpan);
              div.appendChild(labelSpan);
              div.appendChild(document.createTextNode(" "));
              div.appendChild(valueSpan);
              
              specsContainer.appendChild(div);
              
              // تطبيق الترجمة مباشرة
              if (languageManager.currentLang === 'ar') {
                const translation = languageManager.translations.ar[i18n];
                if (translation) {
                  labelSpan.textContent = translation;
                }
              }
            }
          });
          
          
          
          
        }

        
        
        
        return;
      }

      // داخلية أو خارجية
      const isInternalTicket = report.maintenance_type === "Internal";
      let ticketNumber = report.ticket_number?.trim();

 // محاولة استخراج رقم التذكرة من الوصف أو الملخص حتى لو بصيغة مختلفة
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
if (report.maintenance_type === "Regular") titlePrefix = "Regular Maintenance";
else if (report.maintenance_type === "General") titlePrefix = "General Maintenance";
else if (report.maintenance_type === "Internal") titlePrefix = "Internal Ticket";
else if (report.maintenance_type === "External") titlePrefix = "External Maintenance";

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

// ✅ فقط لو فيه ticketNum نستخدمه، ولو فيه -TICKET نضيف "Ticket"
let reportTitle = titlePrefix;
if (ticketNum) {
  reportTitle += ` #${ticketNum}`;
  if (isTicketReport) {
    reportTitle += `-Ticket`; // 🟢 أضف الكلمة فقط بدون رقم التقرير
  }
} else {
  reportTitle += ` #${reportNum || report.id}`;
}

document.getElementById("report-title").textContent = reportTitle;


document.getElementById("report-title").textContent = reportTitle;


   
document.getElementById("report-title").setAttribute("data-i18n", "report_title_key");
      
document.getElementById("report-id").textContent =
  report.maintenance_type === "Internal"
    ? report.ticket_number || `INT-${report.id}`
    : report.report_number || report.request_number || `MR-${report.id}`;

      document.getElementById("priority").textContent = isExternal ? "" : (report.priority || "");
      document.getElementById("device-type").textContent = report.device_type || "";
      if (report.maintenance_type === "Regular" ) {
        document.getElementById("assigned-to").textContent = report.technical_engineer || "";
      }else if (  report.maintenance_type === "General") {
        document.getElementById("assigned-to").textContent = report.technician_name || "";
      } else if (report.maintenance_type === "Internal") {
        document.getElementById("assigned-to").textContent =report.technical  || report.technician_name ||'' ;
      }
       else {
        document.getElementById("assigned-to").textContent = isExternal
          ? (report.reporter_name || "")
          : (report.assigned_to || report.reporter_name || report.technical_engineer);
      }
      
      document.getElementById("department").textContent = report.department_name || "";
      document.getElementById("category").textContent =
      isExternal ? "External" :
      report.maintenance_type === "Regular" ? "Regular" :
      report.maintenance_type === "Internal" ? (report.ticket_type || "Internal") :
      (report.maintenance_type || "");
    
          document.getElementById("report-status").textContent = report.status || "Pending";
      document.getElementById("submitted-date").textContent = `Submitted on ${new Date(report.created_at).toLocaleString()}`;
      
      if (report.maintenance_type === "Regular") {
        document.getElementById("description").textContent =
          report.problem_status || report.issue_summary || report.issue_summary || "No description.";
      }else {
        const problem = (report.problem_status || "").trim();
        const summary = (report.issue_summary || report.initial_diagnosis || "").trim();
        const isInternalTicket = report.maintenance_type === "Internal";
      
        let descriptionHtml = "";
      
        // لو Internal Ticket → اعرض فقط problem_status
        if (isInternalTicket) {
          descriptionHtml = summary || "No description.";
        } 
        else {
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
          } 
          else if (problem) {
            descriptionHtml = problem;
          } 
          else if (summary) {
            descriptionHtml = summary;
          } 
          else {
            descriptionHtml = "No description.";
          }
        }
      
        document.getElementById("description").innerHTML = descriptionHtml;
      }
      
      
      
  if (report.maintenance_type === "General") {
  const generalInfo = [
    { label: "customer_name", text: "Customer Name", value: report.customer_name },
    { label: "id_number", text: "ID Number", value: report.id_number },
    { label: "ext_number", text: "Ext Number", value: report.extension },
    { label: "initial_diagnosis", text: "Initial Diagnosis", value: report.diagnosis_initial },
    { label: "final_diagnosis", text: "Final Diagnosis", value: report.diagnosis_final },
    { label: "floor", text: "Floor", value: report.floor },
  ];

  const generalHtml = generalInfo.map(item =>
    `<div class="info-row">
      <span class="info-label" data-i18n="${item.label}">${item.text}:</span>
      <span class="info-value">${item.value || "N/A"}</span>
    </div>`
  ).join("");

  document.getElementById("note").innerHTML = `
    <div class="info-box">
      <div class="info-title" data-i18n="additional_information">Additional Information:</div>
      ${generalHtml}
    </div>
  `;
} else {
  let noteHtml = `
    <div class="info-box">
      <div class="info-title" data-i18n="${isExternal ? 'final_diagnosis' : 'technical_notes'}">
        ${isExternal ? "Final Diagnosis" : "Technical Team Notes"}:
      </div>
      <div class="info-row">
        <span class="info-value">${report.full_description || report.final_diagnosis || "No notes."}</span>
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
}


      
      
      
      

      const specs = [];
      if (report.device_name) specs.push(`🔘 Device Name: ${report.device_name}`);
      if (report.serial_number) specs.push(`🔑 Serial Number: ${report.serial_number}`);
      if (report.governmental_number) specs.push(`🏛️ Ministry Number: ${report.governmental_number}`);
      if (report.cpu_name) specs.push(`🧠 CPU: ${report.cpu_name}`);
      if (report.ram_type) specs.push(`💾 RAM: ${report.ram_type}`);
      if (report.os_name) specs.push(`🖥️ OS: ${report.os_name}`);
      if (report.generation_number) specs.push(`📶 Generation: ${report.generation_number}`);
      if (report.model_name) specs.push(`🔧 Model: ${report.model_name}`);
      if (report.drive_type) specs.push(`💽 Hard Drive: ${report.drive_type}`);
      if (report.ram_size) specs.push(`📏 RAM Size: ${report.ram_size}`);
      if (report.mac_address) specs.push(`🌐 MAC Address: ${report.mac_address}`);
      if (report.ip_address) specs.push(`🖧 IP Address: ${report.ip_address}`);
      if (report.printer_type) specs.push(`🖨️ Printer Type: ${report.printer_type}`);
      if (report.ink_type) specs.push(`🖋️ Ink Type: ${report.ink_type}`);
      if (report.ink_serial_number) specs.push(`🔖 Ink Serial Number: ${report.ink_serial_number}`);
      if (report.scanner_type) specs.push(`📠 Scanner Type: ${report.scanner_type}`);
      

      

      const specsContainer = document.getElementById("device-specs");
      specsContainer.innerHTML = "";
      if (report.device_type) {
        const specsContainer = document.getElementById("device-specs");
        specsContainer.innerHTML = "";
        
        const deviceType = (report.device_type || "").trim().toLowerCase();
        
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
        
        fields.forEach(({ icon, label, value, showForPC, showForPrinter, showForScanner, alwaysShow, i18n }) => {
          const shouldShow =
            alwaysShow ||
            (showForPC && deviceType === "pc") ||
            (showForPrinter && deviceType === "printer") ||
            (showForScanner && deviceType === "scanner") ||
            !!value;
        
          if (shouldShow) {
            const div = document.createElement("div");
            div.className = "spec-box";
            
            // إنشاء عنصر span للأيقونة
            const iconSpan = document.createElement("span");
            iconSpan.textContent = icon;
            iconSpan.style.marginRight = "5px";
            
            // إنشاء عنصر span للتسمية
            const labelSpan = document.createElement("span");
            labelSpan.setAttribute("data-i18n", i18n);
            labelSpan.textContent = label;
            
            // إنشاء عنصر span للقيمة
            const valueSpan = document.createElement("span");
            valueSpan.textContent = value || "";
            
            // إضافة العناصر إلى div
            div.appendChild(iconSpan);
            div.appendChild(labelSpan);
            div.appendChild(document.createTextNode(" "));
            div.appendChild(valueSpan);
            
            specsContainer.appendChild(div);
            
            // تطبيق الترجمة مباشرة
            if (languageManager.currentLang === 'ar') {
              const translation = languageManager.translations.ar[i18n];
              if (translation) {
                labelSpan.textContent = translation;
              }
            }
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
    "External Maintenance": { en: "External Maintenance", ar: "صيانة خارجية" }
  },
  priority: {
    "High": { en: "High", ar: "عالية" },
    "Medium": { en: "Medium", ar: "متوسطة" },
    "Low": { en: "Low", ar: "منخفضة" }
  },
  deviceType: {
  "pc": { en: "pc", ar: "جهاز كمبيوتر" },
   "Printer": { en: "Printer", ar: "طابعة" },
   "Scanner": { en: "Scanner", ar: "ماسح ضوئي" }
  },
departments: {
  "Laboratory Department": { en: "Laboratory Department", ar: "قسم المختبر" },
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
  "Surgical Operations Department": { en: "Surgical Operations Department", ar: "قسم العمليات الجراحية" }
},

  category: {
'General': { en: "General ", ar: "صيانة عامة" },
'General Maintenance': { en: "General Maintenance", ar: "صيانة عامة" },
    'Regular': { en: "Regular ", ar: "صيانة دورية" },
    'Regular Maintenance': { en: "Regular Maintenance", ar: "صيانة دورية" },
"External Maintenance": { en: "External Maintenance", ar: "صيانة خارجية" },

"Incident": { en: "Incident", ar: "بلاغ داخلي / بلاغ عادي" },
"FollowUp": { en: "FollowUp", ar: "متابعة" },
"Modification": { en: "Modification", ar: "طلب تعديل" },
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



  // ⬇️ تحميل PDF
  document.querySelector(".download-btn")?.addEventListener("click", () => {
    document.getElementById("pdf-options-modal").style.display = "block";
      const lang = document.getElementById("pdf-lang").value || "en"; // ← هنا فقط نحدد اللغة
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "mm", "a4", true);
  doc.setFont(lang === "ar" ? "Amiri" : "helvetica", "normal"); 
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

if (isArabic) {
  doc.addFileToVFS("Amiri-Regular.ttf", tajawalRegularBase64);
  doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");

  doc.addFileToVFS("Amiri-Bold.ttf", tajawalBoldBase64);
  doc.addFont("Amiri-Bold.ttf", "Amiri", "bold");

  doc.setFont("Amiri", "normal");
} else {
  doc.setFont("helvetica", "bold");
}


  const pageWidth = doc.internal.pageSize.getWidth();

  const msBase64 = getImageBase64(msLogoImg);
  const hospitalBase64 = getImageBase64(hospitalLogoImg);

  doc.addImage(msBase64, "PNG", 3, 8, 25, 12);
  doc.addImage(hospitalBase64, "PNG", pageWidth - 35, 8, 25, 12);

  doc.setFontSize(14);





  let y = 40;


  const labels = {
    en: { report: "Report", report_id: "Report ID", priority: "Priority", device_type: "Device Type", assigned_to: "Assigned To", department: "Department", category: "Category", attachment: "Attachment", description: "Description", technical_notes: "Technical Notes", signature: "Signature", specs: "Device Specifications" },
    ar: { report: "تقرير", report_id: "رقم التقرير", priority: "الأولوية", device_type: "نوع الجهاز", assigned_to: "المسؤول", department: "القسم", category: "الفئة", attachment: "المرفق", description: "الوصف", technical_notes: "ملاحظات فنية", signature: "التوقيع", specs: "مواصفات الجهاز" }
  };

  const L = labels[lang];

doc.setFontSize(16);

// جلب عنوان التقرير من العنصر
let reportTitle = document.getElementById("report-title")?.textContent || L.report;

// إزالة رقم التذكرة (مثلاً: "#123")
reportTitle = reportTitle.split("#")[0].trim();

// تحديد اللغة

// استخدام الترجمة إن توفرت
const translatedReportTitle = translations.titleType[reportTitle]?.[lang] || reportTitle;

// ✅ تصحيح الترتيب: "التقرير :اسم"
const titleText = isArabic
  ? prepareArabic(`${L.report} :${translatedReportTitle}`)
  : `${L.report}: ${translatedReportTitle}`;

// طباعة العنوان في منتصف الصفحة
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
const rawDepartment = document.getElementById("department")?.textContent?.trim();
const rawCategory = document.getElementById("category")?.textContent?.trim();
const rawPriority = document.getElementById("priority")?.textContent?.trim();
const translatedPriority = translations.priority?.[rawPriority]?.[lang] || rawPriority;

const translatedDeviceType = translations.deviceType?.[normalizeKey(rawDeviceType)]?.[lang] || rawDeviceType;
const translatedDepartment = translations.departments?.[rawDepartment]?.[lang] || rawDepartment;
const translatedCategory = translations.category?.[rawCategory]?.[lang] || rawCategory;

console.log("✅ Device:", translatedDeviceType, "Dept:", translatedDepartment);

const fields = [
  [L.report_id, document.getElementById("report-id")?.textContent],
  showPriority && [L.priority, translatedPriority], // ✅ هنا استخدم الترجمة
  showDeviceType && [L.device_type, translatedDeviceType],
  [L.assigned_to, document.getElementById("assigned-to")?.textContent],
  [L.department, translatedDepartment],
  [L.category, translatedCategory]
].filter(Boolean);


fields.forEach(([label, value]) => {
  const labelText = isArabic ? prepareArabic(`${label}`) : `${label}:`;
  const valueText = isArabic ? prepareArabic(value || "") : (value || "");
  doc.setFont(isArabic ? "Amiri" : "helvetica", "bold").text(labelText, xLabel, y, { align });
  doc.setFont(isArabic ? "Amiri" : "helvetica", "normal").text(valueText, xValue, y, { align });
  y += 8;
});


  if (showAttachment && attachmentName && attachmentUrl) {
    const label = isArabic ? prepareArabic(`${L.attachment}:`) : `${L.attachment}:`;
    doc.setFont(isArabic ? "Amiri" : "helvetica", "bold").text(label, xLabel, y, { align });
    doc.setTextColor(0, 0, 255);
    doc.textWithLink(attachmentName, xValue, y, { url: attachmentUrl, align });
    doc.setTextColor(0, 0, 0);
    y += 8;
  }

if (showDescription) {
  y += 5;

  const descLabel = isArabic ? prepareArabic(L.description) : `${L.description}:`;
  doc.setFont(isArabic ? "Amiri" : "helvetica", "bold").text(descLabel, xLabel, y, { align });
  y += 6;

  const descEl = document.getElementById("description");
  let rawDesc = descEl?.textContent?.trim() || "";

  // ✅ إصلاح النص إذا احتوى على "Selected Issue:"
  if (rawDesc.startsWith("Selected Issue:")) {
    rawDesc = rawDesc.replace(/^Selected Issue:\s*/i, "").trim();
  }

  let items = [];

  try {
    items = JSON.parse(rawDesc);
    if (!Array.isArray(items)) throw new Error();
  } catch {
    items = rawDesc
      .replace(/^\[|\]$/g, "")
      .split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/g)
      .map(s => s.replace(/^["“”']?|["“”']?$/g, "").trim())
      .filter(Boolean);
  }

  items.forEach(text => {
    const norm = normalizeKey(text);
    const translated = normalizedDescriptions[norm]?.[lang] || text;
    const finalText = isArabic ? prepareArabic(translated) : translated;

    const wrapped = doc.splitTextToSize(finalText, pageWidth - 30);
    doc.setFont(isArabic ? "Amiri" : "helvetica", "normal").text(wrapped, xLabel, y, { align });
    y += wrapped.length * 6 + 2;
  });

  y += 3;
}




if (showNote) {
const align = isArabic ? "right" : "left";
const xLabel = isArabic ? pageWidth - 15 : 15;


  const noteLabel = isArabic ? prepareArabic(L.technical_notes) : L.technical_notes;
  doc.setFont(isArabic ? "Amiri" : "helvetica", "bold")
     .text(noteLabel, xLabel, y, { align });
  y += 6;

  const lang = isArabic ? "ar" : "en";
  const rows = Array.from(document.querySelectorAll("#note .info-row"));

  const noteLabelTranslations = {
    "Customer Name": { en: "Customer Name", ar: "اسم العميل" },
    "ID Number": { en: "ID Number", ar: "رقم الهوية" },
    "Ext Number": { en: "Ext Number", ar: "رقم التحويلة" },
    "Initial Diagnosis": { en: "Initial Diagnosis", ar: "التشخيص المبدئي" },
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
    "Fourth Floor": { en: "Fourth Floor", ar: "الدور الرابع" },
    "Fifth Floor": { en: "Fifth Floor", ar: "الدور الخامس" },
    "Sixth Floor": { en: "Sixth Floor", ar: "الدور السادس" },
    "Seventh Floor": { en: "Seventh Floor", ar: "الدور السابع" },
    "Eighth Floor": { en: "Eighth Floor", ar: "الدور الثامن" },
    "Ninth Floor": { en: "Ninth Floor", ar: "الدور التاسع" },
    "Tenth Floor": { en: "Tenth Floor", ar: "الدور العاشر" },
    "Rooftop": { en: "Rooftop", ar: "السطح" },
    "Parking": { en: "Parking", ar: "مواقف السيارات" }
  };
const textAlign = isArabic ? "right" : "left";
const xText = isArabic ? pageWidth - 15 : 15;

rows.forEach(row => {
  let rawLabel = row.querySelector(".info-label")?.textContent?.trim() || "";
  let value = row.querySelector(".info-value")?.textContent?.trim() || "";

  rawLabel = rawLabel.replace(/:$/, "").trim();
  const translatedLabel = noteLabelTranslations[rawLabel]?.[lang] || rawLabel;

  let translatedValue = value;

  if (rawLabel === "Floor") {
    translatedValue = floors?.[value]?.[lang] || value;
  }

  let finalLine;

  if (isArabic && rawLabel === "Floor") {
    finalLine = prepareArabic(`${translatedLabel}: ${translatedValue}`);
  } else if (isArabic) {
    finalLine = prepareArabic(`${translatedValue} :${translatedLabel}`);
  } else {
    finalLine = `${translatedLabel}: ${translatedValue}`;
  }

  const lines = doc.splitTextToSize(finalLine, pageWidth - 30);
  doc.setFont(isArabic ? "Amiri" : "helvetica", "normal")
     .text(lines, xText, y, { align: textAlign });

  y += lines.length * 6 + 2;
});



  y += 5;
}



if (showSpecs) {
  // عنوان قسم المواصفات
  const specsTitle = isArabic ? prepareArabic(L.specs) : `${L.specs}:`;
  doc.setFont(isArabic ? "Amiri" : "helvetica", "bold").text(specsTitle, xLabel, y, { align });
  y += 8;

  // ترجمة العناوين
  const labelTranslations = {
    "Device Name": { en: "Device Name", ar: "اسم الجهاز" },
    "Serial Number": { en: "Serial Number", ar: "الرقم التسلسلي" },
    "Ministry Number": { en: "Ministry Number", ar: "الرقم الوزاري" },
    "CPU": { en: "CPU", ar: "المعالج" },
    "RAM": { en: "RAM", ar: "نوع الذاكرة" },
    "OS": { en: "OS", ar: "نظام التشغيل" },
    "Generation": { en: "Generation", ar: "الجيل" },
    "Model": { en: "Model", ar: "الموديل" },
    "Device Type": { en: "Device Type", ar: "نوع الجهاز" },
    "Hard Drive": { en: "Hard Drive", ar: "نوع القرص" },
    "RAM Size": { en: "RAM Size", ar: "حجم الذاكرة" },
    "MAC Address": { en: "MAC Address", ar: "عنوان MAC" },
    "IP Address": { en: "IP Address", ar: "عنوان IP" },
    "Printer Type": { en: "Printer Type", ar: "نوع الطابعة" },
    "Ink Type": { en: "Ink Type", ar: "نوع الحبر" },
    "Ink Serial Number": { en: "Ink Serial Number", ar: "الرقم التسلسلي للحبر" },
    "Scanner Type": { en: "Scanner Type", ar: "نوع الماسح الضوئي" }
  };

  const lang = isArabic ? "ar" : "en";

  // استخراج المواصفات من الصفحة
const specs = Array.from(document.querySelectorAll("#device-specs .spec-box"))
  .flatMap(el => {
    const text = el.innerText.trim();
    const matches = [...text.matchAll(/([\w\s]+?):\s*([^:]+)(?=\s+\w+?:|$)/g)];

    return matches.map(([_, rawLabel, value]) => {
      const normalized = rawLabel
        .replace(/[:\u200B-\u200D\uFEFF]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();

      let translatedLabel = rawLabel;
      for (const key in labelTranslations) {
        if (key.toLowerCase() === normalized) {
          translatedLabel = labelTranslations[key][lang];
          break;
        }
      }

      // ✅ القيمة ثم النقطتين ثم العنوان
const line = isArabic
  ? prepareArabic(`${value.trim()} :${translatedLabel}`)
  : `${translatedLabel}: ${value.trim()}`;
      return isArabic ? prepareArabic(line) : line;
    });
  })
  .filter(Boolean);


  // إعداد العرض في عمودين
  const colCount = 2;
  const colWidth = (pageWidth - 30) / colCount;
  let col = 0;
  let startX = 15;

  specs.forEach((spec) => {
    const x = startX + (col * colWidth);
    const lines = doc.splitTextToSize(spec, colWidth);

    lines.forEach((line, idx) => {
      doc.setFont(isArabic ? "Amiri" : "helvetica", "normal").text(line, x, y + (idx * 5));
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
doc.setFont(isArabic ? "Amiri" : "helvetica", "bold").text(signLabel, xLabel, y, { align });

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


  // تفعيل التعديل
  document.querySelector(".edit-btn")?.addEventListener("click", () => {
    const editableEls = document.querySelectorAll("#report-id, #priority, #device-type, #assigned-to, #department, #category, .description, .note, .spec-box");
    
    editableEls.forEach(el => {
      el.setAttribute("contenteditable", "true");
      el.style.border = "1px dashed #aaa";
      el.style.backgroundColor = "#fdfdfd";
      el.style.padding = "4px";
      el.style.display = "inline-block";
      el.style.minHeight = "20px";
    });
  
    // 👇 عرض مدخل رفع المرفق
    document.getElementById("attachment-input").style.display = "block";
  document.getElementById("signature-edit-wrapper").style.display = "block";

    saveBtn.style.display = "inline-block";
    document.querySelector(".edit-btn").style.display = "none";
    alert("📝 Edit mode is ON");
  });
  
  
  

  // حفظ التعديلات
  saveBtn?.addEventListener("click", async () => {
    const updatedData = {
      id: reportData.id,
      issue_summary: document.getElementById("description")?.innerText.trim() || "",
      full_description: document.getElementById("note")?.innerText.replace(/^(.*?:)?\s*/, "").trim() || "",
      priority: document.getElementById("priority")?.innerText.trim(),
      status: document.getElementById("report-status")?.innerText.trim(),
      device_type: document.getElementById("device-type")?.innerText.trim(),
      technical: document.getElementById("assigned-to")?.innerText.trim(),
      department_name: document.getElementById("department")?.innerText.trim(),
      category: document.getElementById("category")?.innerText.trim() === "" ? null : document.getElementById("category")?.innerText.trim(),
      source: reportData.source || reportType,
      device_id: reportData.device_id || null,
      mac_address: reportData.mac_address || null,
    
      device_name: null,
      serial_number: null,
      governmental_number: null,
      cpu_name: null,
      ram_type: null,
      drive_type: null,
      ram_size: null,
      os_name: null,
      generation_number: null,
      model_name: null,
      printer_type: null,
      scanner_type: null,
      ink_type: null,
      ink_serial_number: null,
    };
    

    // مواصفات الجهاز
  // مواصفات الجهاز
  document.querySelectorAll("#device-specs .spec-box").forEach(box => {
    const [rawLabel, value] = box.textContent.split(":").map(str => str.trim());
    const label = rawLabel.toLowerCase().replace(/[^\w]/gi, "").trim();
  
    switch (label) {
      case "devicename": updatedData.device_name = value; break;
      case "serialnumber": updatedData.serial_number = value; break;
      case "ministrynumber": updatedData.governmental_number = value; break;
      case "cpu": updatedData.cpu_name = value; break;
      case "ram": updatedData.ram_type = value; break;
      case "os": updatedData.os_name = value; break;
      case "generation": updatedData.generation_number = value; break;
      case "model": updatedData.model_name = value; break;
      case "harddrive": updatedData.drive_type = value; break;
      case "ramsize": updatedData.ram_size = value; break;
      case "macaddress": updatedData.mac_address = value; break;
      case "ipaddress": updatedData.ip_address = value; break;
      case "printertype": updatedData.printer_type = value; break;
      case "inktype": updatedData.ink_type = value; break;
      case "inkserialnumber": updatedData.ink_serial_number = value; break;
      case "scannertype": updatedData.scanner_type = value; break;
    }
  });
  

    const fileInput = document.getElementById("attachment-input");
    const file = fileInput.files[0];
    
    const formData = new FormData();
    formData.append("data", JSON.stringify(updatedData));
    
    if (file) {
      formData.append("attachment", file);
    }
    // ✅ التوقيع: إما من الصورة أو من الرسم
if (signatureUpload.files.length > 0) {
  // ✅ المستخدم اختار توقيع صورة من الجهاز
  formData.append("signature", signatureUpload.files[0]);
} else if (userDrewOnCanvas) {
  // ✅ المستخدم رسم على الـ canvas
  await new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob && blob.size > 100) {
        formData.append("signature", blob, "signature.png");
      }
      resolve();
    });
  });
} else {
  // 🟡 لا توقيع جديد مرسل – سيتم الاحتفاظ بالتوقيع القديم في السيرفر
  console.log("ℹ️ No signature update – using existing one.");
}


    
    try {
      console.log("🚀 Sending updated data:", updatedData);

      const res = await fetch("http://localhost:5050/update-report-full", {
        method: "POST",
        headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
                 },
        body: formData
      });
    
      const result = await res.json();
      if (result.message) {
        alert("✅ All changes saved successfully.");
      } else {
        throw new Error("❌ Update failed on server.");
      }
    } catch (err) {
      console.error("❌ Error during update:", err);
      alert("❌ Failed to save changes.");
    }
    
    // تعطيل التحرير
// تعطيل التحرير بعد الحفظ
const editableElements = document.querySelectorAll(
  "#report-id, #priority, #device-type, #assigned-to, #department, #category, .description, .note, .spec-box"
);
editableElements.forEach(el => {
  el.removeAttribute("contenteditable");
  el.style.border = "none";
  el.style.backgroundColor = "transparent";
  el.style.padding = "0";
});

document.getElementById("attachment-input").style.display = "none";
document.getElementById("signature-edit-wrapper").style.display = "none";

saveBtn.style.display = "none";
editBtn.style.display = "inline-block";

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
document.addEventListener("DOMContentLoaded",async () => {
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

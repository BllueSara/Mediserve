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
        document.getElementById("assigned-to").textContent = report.technical_engineer || "";
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
  let reportTitle = document.getElementById("report-title")?.textContent || L.report;
  reportTitle = reportTitle.split("#")[0].trim();
let titleText = isArabic
  ? prepareArabic(`${reportTitle} :${L.report}`)
  : `${L.report}: ${reportTitle}`;

doc.text(titleText, pageWidth / 2, 20, { align: "center" });
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

  const fields = [
    [L.report_id, document.getElementById("report-id")?.textContent],
    showPriority && [L.priority, document.getElementById("priority")?.textContent],
    showDeviceType && [L.device_type, document.getElementById("device-type")?.textContent],
    [L.assigned_to, document.getElementById("assigned-to")?.textContent],
    [L.department, document.getElementById("department")?.textContent],
    [L.category, document.getElementById("category")?.textContent]
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
  const descLabel = isArabic ? prepareArabic(`${L.description}`) : `${L.description}:`;
  doc.setFont(isArabic ? "Amiri" : "helvetica", "bold").text(descLabel, xLabel, y, { align });

  y += 6;
  const descText = document.getElementById("description")?.innerText || "";
  const lines = doc.splitTextToSize(isArabic ? prepareArabic(descText) : descText, pageWidth - 30);
  doc.setFont(isArabic ? "Amiri" : "helvetica", "normal").text(lines, xLabel, y, { align });

  y += lines.length * 6 + 5;
}

if (showNote) {
  const noteLabel = isArabic ? prepareArabic(L.technical_notes) : L.technical_notes;
  doc.setFont(isArabic ? "Amiri" : "helvetica", "bold").text(noteLabel, xLabel, y, { align });

  y += 6;
  const rows = Array.from(document.querySelectorAll("#note .info-row"));
  rows.forEach(row => {
    const label = row.querySelector(".info-label")?.textContent || "";
    const value = row.querySelector(".info-value")?.textContent || "";
    const line = isArabic ? prepareArabic(`${label} ${value}`) : `${label} ${value}`;
    const lines = doc.splitTextToSize(line, pageWidth - 30);
    doc.setFont(isArabic ? "Amiri" : "helvetica", "normal").text(lines, xLabel, y, { align });
    y += lines.length * 6 + 2;
  });
  y += 5;
}
if (showSpecs) {
  const specsTitle = isArabic ? prepareArabic(`${L.specs}`) : `${L.specs}:`;
  doc.setFont(isArabic ? "Amiri" : "helvetica", "bold").text(specsTitle, xLabel, y, { align });
  y += 8;

  const specs = Array.from(document.querySelectorAll("#device-specs .spec-box"))
    .map(el => el.innerText.replace(/[^\w\s:.-]/g, "").trim())
    .filter(Boolean);

  const colCount = 3;
  const colWidth = (pageWidth - 30) / colCount;
  let col = 0;
  let startX = 15;

  specs.forEach((spec) => {
    const x = startX + (col * colWidth);
    const lines = doc.splitTextToSize(isArabic ? prepareArabic(spec) : spec, colWidth);

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

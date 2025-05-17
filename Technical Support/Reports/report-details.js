// 🔙 زر الرجوع
function goBack() {
  window.history.back();
}

let reportData = null;

const canvas = document.getElementById("signatureCanvas");
const ctx = canvas.getContext("2d");
let drawing = false;
let userDrewOnCanvas = false;

document.addEventListener("DOMContentLoaded", () => {
  const saveBtn = document.querySelector(".save-btn");
  const editBtn = document.querySelector(".edit-btn"); // ✅ حل المشكلة

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
      else if (report.maintenance_type === "External") titlePrefix = "External Maintenance "|| "External Maintenance Ticket";
      
      const reportTitle = ticketNumber
        ? `${titlePrefix} #${ticketNumber}`
        : `${titlePrefix} #${report.report_number || report.id}`;
      
      document.getElementById("report-title").textContent = reportTitle;
      
      
      document.getElementById("report-id").textContent =
        report.report_number || report.request_number || `MR-${report.id}`;
      document.getElementById("priority").textContent = isExternal ? "" : (report.priority || "");
      document.getElementById("device-type").textContent = report.device_type || "";
      if (report.maintenance_type === "Regular" || report.maintenance_type === "Internal" || report.maintenance_type === "General") {
        document.getElementById("assigned-to").textContent = report.technical_engineer || "";
      } else {
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
          report.problem_status || report.issue_summary || report.initial_diagnosis || "No description.";
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
          ["Customer Name", report.customer_name],
          ["ID Number", report.id_number],
          ["Ext Number", report.extension],
          ["Initial Diagnosis", report.diagnosis_initial],
          ["Final Diagnosis", report.diagnosis_final],
          ["Floor", report.floor],
        ];
      
        const generalHtml = generalInfo.map(([label, value]) =>
          `<div class="info-row"><span class="info-label">${label}:</span><span class="info-value">${value || "N/A"}</span></div>`
        ).join("");
      
        document.getElementById("note").innerHTML = `
          <div class="info-box">
            <div class="info-title">Additional Information:</div>
            ${generalHtml}
          </div>
        `;
      } else {
        let noteHtml = `
          <div class="info-box">
            <div class="info-title">${isExternal ? "Final Diagnosis" : "Technical Team Note"}:</div>
            <div class="info-row">
              <span class="info-value">${report.full_description || report.final_diagnosis || "No notes."}</span>
            </div>
          </div>
        `;
      
        // ✅ إضافة box جديد إذا فيه ticket_type
        if (report.ticket_type) {
          noteHtml += `
            <div class="info-box" style="margin-top:10px;">
              <div class="info-title">Issue Summary:</div>
              <div class="info-row">
                <span class="info-value">${report.issue_description}</span>
              </div>
            </div>
          `;
        }
      
        // ✅ Box المانجر القديم
        if (report.source === "external-legacy" && report.maintenance_manager) {
          noteHtml += `
            <div class="info-box" style="margin-top:10px;">
              <div class="info-title">Maintenance Manager:</div>
              <div class="info-row">
                <span class="info-value">${report.maintenance_manager}</span>
              </div>
            </div>
          `;
        }
      
        document.getElementById("note").innerHTML = noteHtml;
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

  // ⬇️ تحميل PDF
  document.querySelector(".download-btn")?.addEventListener("click", () => {
    document.getElementById("pdf-options-modal").style.display = "block";
  });

  document.getElementById("generate-pdf-btn")?.addEventListener("click", async () => {
  document.getElementById("pdf-options-modal").style.display = "none";

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "mm", "a4", true);
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 40;

  // التحقق من التحديد
  const showPriority = document.getElementById("opt-priority").checked;
  const showDeviceType = document.getElementById("opt-device-type").checked;
  const showDescription = document.getElementById("opt-description").checked;
  const showNote = document.getElementById("opt-note").checked;
  const showSignature = document.getElementById("opt-signature").checked;
  const showAttachment = document.getElementById("opt-attachment").checked;
  const showSpecs = document.getElementById("opt-specs").checked;

  // رأس التقرير
  doc.setFillColor(0, 90, 156);
  doc.rect(0, 0, pageWidth, 30, "F");
  doc.addImage("/icon/MS Logo.png", "PNG", 3, 8, 25, 12);
  doc.addImage("/icon/hospital-logo.png", "PNG", pageWidth - 35, 8, 25, 12);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold").setFontSize(16);
  let reportTitle = document.getElementById("report-title")?.textContent || "Maintenance Report";
  reportTitle = reportTitle.split("#")[0].trim();
  doc.text(`Report: ${reportTitle}`, pageWidth / 2, 20, { align: "center" });

  // محتوى التقرير
  doc.setTextColor(0, 0, 0).setFontSize(12);
  const attachmentName = reportData?.attachment_name || null;
  const attachmentUrl = reportData?.attachment_path ? `http://localhost:5050/uploads/${reportData.attachment_path}` : null;

  [
    ["Report ID", document.getElementById("report-id")?.textContent],
    showPriority && ["Priority", document.getElementById("priority")?.textContent],
    showDeviceType && ["Device Type", document.getElementById("device-type")?.textContent],
    ["Assigned To", document.getElementById("assigned-to")?.textContent],
    ["Department", document.getElementById("department")?.textContent],
    ["Category", document.getElementById("category")?.textContent]
  ].filter(Boolean).forEach(([label, value]) => {
    doc.text(`${label}:`, 15, y);
    doc.text(value || "", 60, y);
    y += 8;
  });

  if (showAttachment && attachmentName && attachmentUrl) {
    doc.text("Attachment:", 15, y);
    doc.setTextColor(0, 0, 255);
    doc.textWithLink(attachmentName, 60, y, { url: attachmentUrl });
    doc.setTextColor(0, 0, 0);
    y += 8;
  }

  if (showDescription) {
    y += 5;
    doc.setFont("helvetica", "bold").text("Description:", 15, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(document.getElementById("description")?.innerText || "", pageWidth - 30);
    doc.text(lines, 15, y);
    y += lines.length * 6 + 5;
  }

  if (showNote) {
    doc.setFont("helvetica", "bold").text("Technical Notes:", 15, y);
    y += 6;
  
    const noteElement = document.getElementById("note");
    if (noteElement) {
      const rows = Array.from(noteElement.querySelectorAll(".info-row"));
      rows.forEach(row => {
        const label = row.querySelector(".info-label")?.textContent || "";
        const value = row.querySelector(".info-value")?.textContent || "";
        const line = `${label} ${value}`;
        const lines = doc.splitTextToSize(line, pageWidth - 30);
        doc.setFont("helvetica", "normal").text(lines, 15, y);
        y += lines.length * 6 + 2;
      });
    }
    y += 5;
  }
  

  if (showSpecs) {
    doc.setFont("helvetica", "bold").text("Device Specifications:", 15, y);
    y += 6;
    const specs = Array.from(document.querySelectorAll("#device-specs .spec-box"))
      .map(el => el.innerText.replace(/[^\w\s:.-]/g, "").trim());
    specs.forEach(spec => {
      const lines = doc.splitTextToSize(spec, pageWidth - 30);
      doc.text(lines, 15, y);
      y += lines.length * 6 + 2;
    });
  }

  y = Math.max(y + 20, 240);
  doc.setFont("helvetica", "bold").text("Signature:", 20, y);
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
      doc.addImage(url, "PNG", 15, y + 5, 50, 25);
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

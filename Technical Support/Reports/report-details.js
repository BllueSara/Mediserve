
function goBack() {
  window.history.back();
}

document.addEventListener("DOMContentLoaded", () => {
  const saveBtn = document.querySelector(".save-btn");
  const reportId = new URLSearchParams(window.location.search).get("id");
  if (!reportId) return alert("No report ID provided");
  const reportType = new URLSearchParams(window.location.search).get("type");
  fetch(`http://localhost:5050/report/${reportId}?type=${reportType}`)
  
    .then(res => res.json())
    .then(report => {
      const isExternal = report.source === "external"; // ✅ الطريقة الصحيحة الآن

      let reportTitle = "Maintenance Report";
    
      if (report.maintenance_type === "Regular") {
        reportTitle = `Regular Maintenance #${report.report_number}`;
      } else if (report.maintenance_type === "General") {
        reportTitle = `General Maintenance #${report.report_number}`;
      } else if (report.ticket_number) {
        reportTitle = `Ticket Report #${report.ticket_number}`;
      } else {
        reportTitle = `Maintenance Report #${report.report_number}`;
      }
    
      document.getElementById("report-title").textContent = isExternal
        ? `External Maintenance #${report.request_number || report.id}`
        : reportTitle;
    
      document.getElementById("report-id").textContent = report.report_number || report.request_number || `MR-${report.id}`;
      document.getElementById("priority").textContent = isExternal ? "N/A" : (report.priority || "N/A");
      document.getElementById("device-type").textContent = report.device_type || "N/A";
      document.getElementById("assigned-to").textContent = isExternal ? (report.reporter_name || "N/A") : (report.technical || "N/A");
      document.getElementById("department").textContent = report.department_name || "N/A";
      document.getElementById("category").textContent = isExternal ? "External" : (report.category || "N/A");
      document.getElementById("report-status").textContent = report.status || "Pending";
    
      document.getElementById("submitted-date").textContent = `Submitted on ${new Date(report.created_at).toLocaleString()}`;
      document.getElementById("description").textContent =
        report.issue_summary || report.initial_diagnosis || "No description.";
      document.getElementById("note").innerHTML = `
        <strong>${isExternal ? "Final Diagnosis" : "Technical Team Note"}:</strong><br>
        ${report.full_description || report.final_diagnosis || "No notes."}
      `;
    

      // Optional: Split specs string into boxes if available
// ✅ تكوين المواصفات من الحقول الفردية
const specs = [];
if (report.device_name) specs.push(`🔘 Device Name: ${report.device_name}`);
if (report.serial_number) specs.push(`🔑 Serial Number: ${report.serial_number}`);
if (report.governmental_number) specs.push(`🏛️ Ministry Number: ${report.governmental_number}`);

if (report.cpu_name) specs.push(`🧠 CPU: ${report.cpu_name}`);
if (report.ram_type) specs.push(`💾 RAM: ${report.ram_type}`);
if (report.os_name) specs.push(`🖥️ OS: ${report.os_name}`);
if (report.generation_number) specs.push(`📶 Generation: ${report.generation_number}`);
if (report.model_name) specs.push(`🔧 Model: ${report.model_name}`);

const specsContainer = document.getElementById("device-specs");
specsContainer.innerHTML = ""; // Clear any previous specs

specs.forEach(spec => {
const div = document.createElement("div");
div.className = "spec-box";
div.textContent = spec;
specsContainer.appendChild(div);
});

    })
    .catch(err => {
      console.error("❌ Error fetching report:", err);
      alert("Failed to load report data.");
    });
  
const downloadBtn = document.querySelector(".download-btn");
downloadBtn?.addEventListener("click", async () => {
const { jsPDF } = window.jspdf;
const doc = new jsPDF("p", "mm", "a4", true);
const pageWidth = doc.internal.pageSize.getWidth();

// Header
doc.setFillColor(0, 90, 156);
doc.rect(0, 0, pageWidth, 30, "F");
doc.addImage("/icon/MS Logo.png", "PNG", 3, 8, 25, 12);
doc.addImage("/icon/hospital-logo.png", "PNG", pageWidth - 35, 8, 25, 12);
doc.setTextColor(255, 255, 255);
doc.setFont("helvetica", "bold");
doc.setFontSize(16);
doc.text("Maintenance Report", pageWidth / 2, 20, { align: "center" });

// Details
doc.setTextColor(0, 0, 0);
doc.setFontSize(12);
let y = 40;
const details = [
  ["Report ID", document.getElementById("report-id").textContent],
  ["Priority", document.getElementById("priority").textContent],
  ["Device Type", document.getElementById("device-type").textContent],
  ["Assigned To", document.getElementById("assigned-to").textContent],
  ["Department", document.getElementById("department").textContent],
  ["Category", document.getElementById("category").textContent]
];
details.forEach(([label, value]) => {
  doc.text(`${label}:`, 15, y);
  doc.text(value, 60, y);
  y += 8;
});

// Description
y += 5;
doc.setFont("helvetica", "bold");
doc.text("Description:", 15, y);
y += 6;
doc.setFont("helvetica", "normal");
const desc = document.getElementById("description")?.innerText || "N/A";
const descLines = doc.splitTextToSize(desc, pageWidth - 30);
doc.text(descLines, 15, y);
y += descLines.length * 6;

// Notes
y += 5;
doc.setFont("helvetica", "bold");
doc.text("Technical Notes:", 15, y);
y += 6;
doc.setFont("helvetica", "normal");
const notes = document.getElementById("note")?.innerText || "No notes.";
const noteLines = doc.splitTextToSize(notes, pageWidth - 30);
doc.text(noteLines, 15, y);
y += noteLines.length * 6 + 4;

// Device Specs (بدون إيموجيات)
y += 5;
doc.setFont("helvetica", "bold");
doc.text("Device Specifications:", 15, y);
y += 6;
doc.setFont("helvetica", "normal");
const specs = Array.from(document.querySelectorAll("#device-specs .spec-box")).map(el =>
  el.innerText.replace(/^.*?:/, match => match.replace(/[^\w\s:]/g, ""))
);
specs.forEach(spec => {
  const lines = doc.splitTextToSize(spec, pageWidth - 30);
  doc.text(lines, 15, y);
  y += lines.length * 6 + 2;
});

// Footer
const footerY = 270;
doc.setFont("helvetica", "bold");
doc.text("Signature", 20, footerY);
doc.text("Stamp", pageWidth - 50, footerY);
doc.line(15, footerY - 5, 60, footerY - 5);
doc.line(pageWidth - 55, footerY - 5, pageWidth - 10, footerY - 5);

// Save
doc.save(`${document.getElementById("report-id").textContent || "Maintenance_Report"}.pdf`);
});




  // ✏️ تعديل التقرير
  const editBtn = document.querySelector(".edit-btn");
  editBtn?.addEventListener("click", () => {
const editableElements = document.querySelectorAll(".editable, .description, .note");
editableElements.forEach(el => {
el.setAttribute("contenteditable", "true");
el.style.border = "1px dashed #aaa";
el.style.backgroundColor = "#fdfdfd";
el.style.padding = "4px";
});
saveBtn.style.display = "inline-block"; // عرض زر الحفظ
editBtn.style.display = "none"; // إخفاء زر التعديل
alert("Edit mode activated. You can now edit the report fields.");
});
saveBtn?.addEventListener("click", () => {
const editableElements = document.querySelectorAll(".grid div, .description, .note, h2");
editableElements.forEach(el => {
el.removeAttribute("contenteditable");
el.style.border = "none";
el.style.backgroundColor = "transparent";
el.style.padding = "0";
});
saveBtn.style.display = "none"; // إخفاء زر الحفظ
editBtn.style.display = "inline-block"; // إرجاع زر التعديل
alert("Changes saved successfully.");
});


 // ❌ إغلاق التقرير ➜ تحويل لصفحة Search Report.html
const closeBtn = document.querySelector(".close-btn");
closeBtn?.addEventListener("click", () => {
  const confirmed = confirm("Are you sure you want to close this report?");
  if (confirmed) {
    window.location.href = "Search Reports.html"; // ✅ الانتقال للصفحة
  }
});
}); 

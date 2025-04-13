
function goBack() {
    window.history.back();
  }

  document.addEventListener("DOMContentLoaded", () => {
    const saveBtn = document.querySelector(".save-btn");

    
const downloadBtn = document.querySelector(".download-btn");
downloadBtn?.addEventListener("click", async () => {
const { jsPDF } = window.jspdf;
const doc = new jsPDF("p", "mm", "a4");
const pageWidth = doc.internal.pageSize.getWidth();

// ✅ Blue Header with Logos
doc.setFillColor(0, 90, 156); // Blue background
doc.rect(0, 0, pageWidth, 30, "F"); // Full-width rectangle
doc.addImage("logo2.png", "PNG", 3, 8, 25, 12); // حجم أصغر ورفع للأعلى
doc.addImage("logo4.png", "PNG", pageWidth - 35, 8, 25, 12); // تحقيق التوازن بنفس التعديلات




doc.setTextColor(255, 255, 255); // White text
doc.setFont("helvetica", "bold");
doc.setFontSize(16);
doc.text("Maintenance Report", pageWidth / 2, 20, { align: "center" });

// ✅ Report Details
doc.setTextColor(0, 0, 0); // Reset to black
doc.setFontSize(12);
let y = 40;
const details = [
  ["Report ID", "MR-2024-001"],
  ["Priority", "High"],
  ["Device Type", "Laptop XPS 15"],
  ["Assigned To", "Technical Team A"],
  ["Department", "IT Support"],
  ["Category", "Hardware Issue"]
];

details.forEach(([label, value]) => {
  doc.text(`${label}:`, 15, y);
  doc.text(value, 60, y);
  y += 8;
});

// ✅ Description
y += 5;
doc.setFont("helvetica", "bold");
doc.text("Description:", 15, y);
y += 6;
doc.setFont("helvetica", "normal");
const desc = document.querySelector(".description")?.innerText || "N/A";
const descLines = doc.splitTextToSize(desc, pageWidth - 30);
doc.text(descLines, 15, y);
y += descLines.length * 6;

// ✅ Notes
y += 5;
doc.setFont("helvetica", "bold");
doc.text("Technical Notes:", 15, y);
y += 6;
doc.setFont("helvetica", "normal");

const notes = Array.from(document.querySelectorAll(".note")).map(n => n.innerText);
notes.forEach(note => {
  const noteLines = doc.splitTextToSize(note, pageWidth - 30);
  doc.text(noteLines, 15, y);
  y += noteLines.length * 6 + 4;
});

// ✅ Signature and Stamp at the bottom
const footerY = 270;
doc.setFont("helvetica", "bold");
doc.text("Signature", 20, footerY);
doc.text("Stamp", pageWidth - 50, footerY);
doc.line(15, footerY - 5, 60, footerY - 5); // Signature line
doc.line(pageWidth - 55, footerY - 5, pageWidth - 10, footerY - 5); // Stamp line

doc.save("Maintenance_Report.pdf");
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
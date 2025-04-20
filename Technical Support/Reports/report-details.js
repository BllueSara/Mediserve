// 🔙 زر الرجوع للصفحة السابقة
function goBack() {
  window.history.back();
}

// 🧠 تخزين بيانات التقرير
let reportData = null;

// 🚀 عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", () => {
  const saveBtn = document.querySelector(".save-btn");

  // 🆔 قراءة رقم التقرير ونوعه من الرابط
  const reportId = new URLSearchParams(window.location.search).get("id");
  const reportType = new URLSearchParams(window.location.search).get("type");
  if (!reportId) return alert("No report ID provided");

  // 📥 جلب بيانات التقرير من السيرفر
  fetch(`http://localhost:5050/report/${reportId}?type=${reportType}`)
    .then(res => res.json())
    .then(report => {
      reportData = report;
      const isExternal = report.source === "external";

      // 📝 بناء عنوان التقرير حسب النوع
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

      // ⬅️ عرض العنوان والحقول في الواجهة
      document.getElementById("report-title").textContent =
        isExternal ? `External Maintenance #${report.request_number || report.id}` : reportTitle;

      document.getElementById("report-id").textContent =
        report.report_number || report.request_number || `MR-${report.id}`;
      document.getElementById("priority").textContent = isExternal ? "N/A" : (report.priority || "N/A");
      document.getElementById("device-type").textContent = report.device_type || "N/A";
      document.getElementById("assigned-to").textContent = isExternal
        ? (report.reporter_name || "N/A")
        : (report.technical || "N/A");
      document.getElementById("department").textContent = report.department_name || "N/A";
      document.getElementById("category").textContent = isExternal ? "External" : (report.category || "N/A");
      document.getElementById("report-status").textContent = report.status || "Pending";

      document.getElementById("submitted-date").textContent =
        `Submitted on ${new Date(report.created_at).toLocaleString()}`;
      document.getElementById("description").textContent =
        report.issue_summary || report.initial_diagnosis || "No description.";
      document.getElementById("note").innerHTML = `
        <strong>${isExternal ? "Final Diagnosis" : "Technical Team Note"}:</strong><br>
        ${report.full_description || report.final_diagnosis || "No notes."}
      `;

      // 🧾 بناء المواصفات
      const specs = [];
      if (report.device_name) specs.push(`🔘 Device Name: ${report.device_name}`);
      if (report.serial_number) specs.push(`🔑 Serial Number: ${report.serial_number}`);
      if (report.governmental_number) specs.push(`🏛️ Ministry Number: ${report.governmental_number}`);
      if (report.cpu_name) specs.push(`🧠 CPU: ${report.cpu_name}`);
      if (report.ram_type) specs.push(`💾 RAM: ${report.ram_type}`);
      if (report.os_name) specs.push(`🖥️ OS: ${report.os_name}`);
      if (report.generation_number) specs.push(`📶 Generation: ${report.generation_number}`);
      if (report.model_name) specs.push(`🔧 Model: ${report.model_name}`);

      // 📦 عرض المواصفات في الصفحة
      const specsContainer = document.getElementById("device-specs");
      specsContainer.innerHTML = "";
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

  // ⬇️ تحميل التقرير كـ PDF
  const downloadBtn = document.querySelector(".download-btn");
  downloadBtn?.addEventListener("click", async () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("p", "mm", "a4", true);
    const pageWidth = doc.internal.pageSize.getWidth();

    // 🎨 رأس التقرير (الشعار والعنوان)
    doc.setFillColor(0, 90, 156);
    doc.rect(0, 0, pageWidth, 30, "F");
    doc.addImage("/icon/MS Logo.png", "PNG", 3, 8, 25, 12);
    doc.addImage("/icon/hospital-logo.png", "PNG", pageWidth - 35, 8, 25, 12);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Maintenance Report", pageWidth / 2, 20, { align: "center" });

    // 🧾 بيانات التقرير
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

    // 📃 وصف المشكلة
    y += 5;
    doc.setFont("helvetica", "bold");
    doc.text("Description:", 15, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    const desc = document.getElementById("description")?.innerText || "N/A";
    const descLines = doc.splitTextToSize(desc, pageWidth - 30);
    doc.text(descLines, 15, y);
    y += descLines.length * 6;

    // 🧑‍🔧 ملاحظات الفريق الفني
    y += 5;
    doc.setFont("helvetica", "bold");
    doc.text("Technical Notes:", 15, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    const notes = document.getElementById("note")?.innerText || "No notes.";
    const noteLines = doc.splitTextToSize(notes, pageWidth - 30);
    doc.text(noteLines, 15, y);
    y += noteLines.length * 6 + 4;

    // 🖥️ مواصفات الجهاز
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

    // 🖊️ ✅ إدراج التوقيع والختم في الأسفل
    y = Math.max(y + 20, 240); // نخليه ثابت تحت
    doc.setFont("helvetica", "bold");
    doc.text("Signature:", 20, y);
    doc.text("Stamp:", pageWidth - 50, y);

    const signaturePath = reportData?.signature_path;
    if (signaturePath) {
      try {
        const signatureImg = new Image();
        signatureImg.crossOrigin = "anonymous";
        signatureImg.src = `http://localhost:5050/${signaturePath}`;

        await new Promise((resolve, reject) => {
          signatureImg.onload = () => resolve();
          signatureImg.onerror = () => reject("❌ Failed to load signature image");
        });

        const canvas = document.createElement("canvas");
        canvas.width = signatureImg.width;
        canvas.height = signatureImg.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(signatureImg, 0, 0);
        const signatureDataURL = canvas.toDataURL("image/png");

        // التوقيع يسار
        doc.addImage(signatureDataURL, "PNG", 15, y + 5, 50, 25);
        // الختم يمين (نفس التوقيع إذا مافيه ختم حقيقي)
        doc.addImage(signatureDataURL, "PNG", pageWidth - 65, y + 5, 50, 25);
      } catch (err) {
        console.warn("⚠️ Could not include signature or stamp:", err);
      }
    }

    // 💾 حفظ التقرير
    const fileName = document.getElementById("report-id").textContent || "Maintenance_Report";
    doc.save(`${fileName}.pdf`);
  });

  // ✏️ تفعيل وضع التعديل
  const editBtn = document.querySelector(".edit-btn");
  editBtn?.addEventListener("click", () => {
    const editableElements = document.querySelectorAll(".editable, .description, .note");
    editableElements.forEach(el => {
      el.setAttribute("contenteditable", "true");
      el.style.border = "1px dashed #aaa";
      el.style.backgroundColor = "#fdfdfd";
      el.style.padding = "4px";
    });
    saveBtn.style.display = "inline-block";
    editBtn.style.display = "none";
    alert("Edit mode activated. You can now edit the report fields.");
  });

  // 💾 حفظ التعديلات (بدون رفع للسيرفر)
  saveBtn?.addEventListener("click", async () => {
    const updatedData = {
      id: reportData.id,
      type: reportType,
      issue_summary: document.getElementById("description")?.innerText.trim() || "",
      full_description: document.getElementById("note")?.innerText.replace(/^(.*?:)?\s*/, "").trim() || "",
      priority: document.getElementById("priority")?.innerText.trim(),
      status: document.getElementById("report-status")?.innerText.trim()
    };
  
    try {
      const response = await fetch(`http://localhost:5050/update-report`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData)
      });
  
      const result = await response.json();
      if (result.message) {
        alert("✅ Changes saved to server.");
      } else {
        throw new Error("❌ Server failed to update.");
      }
    } catch (err) {
      console.error("❌ Error saving changes:", err);
      alert("⚠️ Failed to save changes.");
    }
  
    // ⏹️ تعطيل التحرير مرة ثانية
    const editableElements = document.querySelectorAll(".grid div, .description, .note, h2");
    editableElements.forEach(el => {
      el.removeAttribute("contenteditable");
      el.style.border = "none";
      el.style.backgroundColor = "transparent";
      el.style.padding = "0";
    });
    saveBtn.style.display = "none";
    editBtn.style.display = "inline-block";
  });
  

  // ❌ زر الإغلاق
  const closeBtn = document.querySelector(".close-btn");
  closeBtn?.addEventListener("click", () => {
    const confirmed = confirm("Are you sure you want to close this report?");
    if (confirmed) {
      window.location.href = "Search Reports.html";
    }
  });
});

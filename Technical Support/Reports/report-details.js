// 🔙 زر الرجوع
function goBack() {
  window.history.back();
}

let reportData = null;


document.addEventListener("DOMContentLoaded", () => {
  const saveBtn = document.querySelector(".save-btn");
  const reportId = new URLSearchParams(window.location.search).get("id");
  const reportType = new URLSearchParams(window.location.search).get("type");

  if (!reportId) return alert("No report ID provided");

  fetch(`http://localhost:5050/report/${reportId}?type=${reportType}`)
    .then(res => res.json())
    .then(report => {
      reportData = report;
      const isExternal = report.source === "external";

      if (reportType === "new") {
        document.getElementById("report-title").textContent = `New Maintenance Report #${report.id}`;
        document.getElementById("report-id").textContent = `NMR-${report.id}`;
        document.getElementById("priority").textContent = report.priority || "Medium";
        document.getElementById("device-type").textContent = report.device_type || "N/A";
        document.getElementById("assigned-to").textContent = "N/A";
        document.getElementById("department").textContent = "N/A";
        document.getElementById("category").textContent = "New";
        document.getElementById("report-status").textContent = report.status || "Open";
        document.getElementById("submitted-date").textContent = `Submitted on ${new Date(report.created_at).toLocaleString()}`;
        document.getElementById("description").textContent = report.description || "No description.";
        document.getElementById("note").innerHTML = `<strong>Note:</strong><br>${report.details || "No notes."}`;

        const specsContainer = document.getElementById("device-specs");
        specsContainer.innerHTML = "";
        if (report.device_type) {
          const div = document.createElement("div");
          div.className = "spec-box";
          div.textContent = ` Device Type: ${report.device_type}`;
          specsContainer.appendChild(div);
        }

        if (report.signature_path) {
          const sigImg = document.createElement("img");
          sigImg.src = `http://localhost:5050/${report.signature_path}`;
          sigImg.alt = "Signature";
          sigImg.style = "margin-top: 10px; max-width: 200px; border: 1px solid #ccc";
          specsContainer.appendChild(sigImg);
        }
        return;
      }

      // داخلية أو خارجية
      const reportTitle =
        report.maintenance_type === "Regular"
          ? `Regular Maintenance #${report.report_number}`
          : report.maintenance_type === "General"
          ? `General Maintenance #${report.report_number}`
          : report.ticket_number
          ? `Ticket Report #${report.ticket_number}`
          : `Maintenance Report #${report.report_number}`;

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
      document.getElementById("submitted-date").textContent = `Submitted on ${new Date(report.created_at).toLocaleString()}`;
      document.getElementById("description").textContent =
        report.issue_summary || report.initial_diagnosis || "No description.";
      document.getElementById("note").innerHTML = `
        <strong>${isExternal ? "Final Diagnosis" : "Technical Team Note"}:</strong><br>
        ${report.full_description || report.final_diagnosis || "No notes."}
      `;

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

  // ⬇️ تحميل PDF
  document.querySelector(".download-btn")?.addEventListener("click", async () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("p", "mm", "a4", true);
    const pageWidth = doc.internal.pageSize.getWidth();

    // رأس
    doc.setFillColor(0, 90, 156);
    doc.rect(0, 0, pageWidth, 30, "F");
    doc.addImage("/icon/MS Logo.png", "PNG", 3, 8, 25, 12);
    doc.addImage("/icon/hospital-logo.png", "PNG", pageWidth - 35, 8, 25, 12);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold").setFontSize(16);
    doc.text("Maintenance Report", pageWidth / 2, 20, { align: "center" });

    // التفاصيل
    doc.setTextColor(0, 0, 0).setFontSize(12);
    let y = 40;
    [
      ["Report ID", document.getElementById("report-id")?.textContent],
      ["Priority", document.getElementById("priority")?.textContent],
      ["Device Type", document.getElementById("device-type")?.textContent],
      ["Assigned To", document.getElementById("assigned-to")?.textContent],
      ["Department", document.getElementById("department")?.textContent],
      ["Category", document.getElementById("category")?.textContent]
    ].forEach(([label, value]) => {
      doc.text(`${label}:`, 15, y);
      doc.text(value || "N/A", 60, y);
      y += 8;
    });

    // الوصف والملاحظات
    y += 5;
    doc.setFont("helvetica", "bold").text("Description:", 15, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    const descLines = doc.splitTextToSize(document.getElementById("description")?.innerText || "N/A", pageWidth - 30);
    doc.text(descLines, 15, y);
    y += descLines.length * 6 + 5;

    doc.setFont("helvetica", "bold").text("Technical Notes:", 15, y);
    y += 6;
    const noteLines = doc.splitTextToSize(document.getElementById("note")?.textContent?.replace(/^.*?:\s*/, "") || "No notes.", pageWidth - 30);
    doc.setFont("helvetica", "normal").text(noteLines, 15, y);
    y += noteLines.length * 6 + 5;

    doc.setFont("helvetica", "bold").text("Device Specifications:", 15, y);
    y += 6;
    const specs = Array.from(document.querySelectorAll("#device-specs .spec-box"))
    .map(el => el.innerText.replace(/[^\w\s:.-]/g, "").trim()); // يشيل الرموز والإيموجيات
      specs.forEach(spec => {
      const lines = doc.splitTextToSize(spec, pageWidth - 30);
      doc.text(lines, 15, y);
      y += lines.length * 6 + 2;
    });

    // التوقيع والختم
    y = Math.max(y + 20, 240);
    doc.setFont("helvetica", "bold").text("Signature:", 20, y);
    doc.text("Stamp:", pageWidth - 50, y);

    if (reportData?.signature_path) {
      try {
        const signatureImg = new Image();
        signatureImg.crossOrigin = "anonymous";
        signatureImg.src = `http://localhost:5050/${reportData.signature_path}`;

        await new Promise((resolve, reject) => {
          signatureImg.onload = () => resolve();
          signatureImg.onerror = () => reject("Failed to load signature");
        });

        const canvas = document.createElement("canvas");
        canvas.width = signatureImg.width;
        canvas.height = signatureImg.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(signatureImg, 0, 0);
        const signatureDataURL = canvas.toDataURL("image/png");

        doc.addImage(signatureDataURL, "PNG", 15, y + 5, 50, 25);
        doc.addImage(signatureDataURL, "PNG", pageWidth - 65, y + 5, 50, 25);
      } catch (e) {
        console.warn("⚠️ Couldn't add signature image:", e);
      }
    }

    const fileName = document.getElementById("report-id")?.textContent || "Maintenance_Report";
    doc.save(`${fileName}.pdf`);
  });

  // تفعيل التعديل
  document.querySelector(".edit-btn")?.addEventListener("click", () => {
    document.querySelectorAll(".editable, .description, .note").forEach(el => {
      el.setAttribute("contenteditable", "true");
      el.style.border = "1px dashed #aaa";
      el.style.backgroundColor = "#fdfdfd";
      el.style.padding = "4px";
    });
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
      category: document.getElementById("category")?.innerText.trim(),
      device_name: null,
      serial_number: null,
      governmental_number: null,
      cpu_name: null,
      ram_type: null,
      os_name: null,
      generation_number: null,
      model_name: null
    };
  
    // مواصفات الجهاز
    document.querySelectorAll("#device-specs .spec-box").forEach(box => {
      const [rawLabel, value] = box.textContent.split(":").map(str => str.trim());
      const label = rawLabel.replace(/[^\w\s]/gi, "").trim(); // 🔥 يشيل الإيموجي والرموز
            switch (label) {
        case " Device Name": updatedData.device_name = value; break;
        case " Serial Number": updatedData.serial_number = value; break;
        case " Ministry Number": updatedData.governmental_number = value; break;
        case " CPU": updatedData.cpu_name = value; break;
        case " RAM": updatedData.ram_type = value; break;
        case " OS": updatedData.os_name = value; break;
        case " Generation": updatedData.generation_number = value; break;
        case " Model": updatedData.model_name = value; break;
      }
    });
  
    try {
      const res = await fetch("http://localhost:5050/update-report-full", {

        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData)
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
  

  // إغلاق
  document.querySelector(".close-btn")?.addEventListener("click", () => {
    if (confirm("Are you sure you want to close this report?")) {
      window.location.href = "Search Reports.html";
    }
  });
});

document.addEventListener("DOMContentLoaded", function () {

  // 🔍 عناصر DOM
  const fileInput = document.getElementById("upload-file");
  const fileLabel = document.querySelector(".upload-box");
  const saveButton = document.querySelector(".submit-btn");
  const ticketTypeSelect = document.getElementById("ticket-type");
  const customTypeContainer = document.getElementById("custom-type-container");
  const customTypeInput = document.getElementById("custom-ticket-type");
  const ticketNumberInput = document.getElementById("ticket-number");

  // 🔒 اجعل خانة رقم التذكرة مقفلة
  ticketNumberInput.readOnly = true;
  ticketNumberInput.value = "";

  // 🧠 تحميل أنواع التذاكر من السيرفر
  fetch("http://localhost:5050/ticket-types")
    .then(res => res.json())
    .then(types => {
      // 📥 تعبئة قائمة الأنواع
      ticketTypeSelect.innerHTML = '<option value="" disabled selected>Select ticket type</option>';
      types.forEach(type => {
        const option = document.createElement("option");
        option.value = type.type_name;
        option.textContent = type.type_name;
        ticketTypeSelect.appendChild(option);
      });

      // ➕ إضافة خيار "Other"
      const otherOption = document.createElement("option");
      otherOption.value = "Other";
      otherOption.textContent = "Other";
      ticketTypeSelect.appendChild(otherOption);
    })
    .catch(err => console.error("❌ Error loading ticket types:", err));

  // 🎯 عند تغيير نوع التذكرة
  ticketTypeSelect.addEventListener("change", () => {
    // إذا اختار Other أظهر حقل مخصص
    if (ticketTypeSelect.value === "Other") {
      customTypeContainer.style.display = "block";
    } else {
      customTypeContainer.style.display = "none";
      customTypeInput.value = "";
    }

    // 🧠 توليد رقم التذكرة تلقائياً من السيرفر
    fetch("http://localhost:5050/generate-internal-ticket-number")
      .then(res => res.json())
      .then(data => {
        ticketNumberInput.value = data.ticket_number;
      })
      .catch(err => {
        console.error("❌ Failed to generate ticket number:", err);
        ticketNumberInput.value = "ERROR";
      });
  });

  // 📎 عند الضغط على صندوق الرفع يتم تفعيل اختيار ملف
  fileLabel.addEventListener("click", () => fileInput.click());

  // ✔️ عند اختيار ملف يتحقق من النوع
  fileInput.addEventListener("change", function (event) {
    const file = event.target.files[0];
    const allowedExtensions = ["pdf", "doc", "docx", "eml"];
    const ext = file?.name?.split(".").pop().toLowerCase();

    // 🛑 تحقق من نوع الملف
    if (file && !allowedExtensions.includes(ext)) {
      alert("Invalid file type. Only PDF, DOC, DOCX, and EML are allowed.");
      fileInput.value = "";
      fileLabel.querySelector("p").textContent = "Drop files here or click to upload";
    } else if (file) {
      fileLabel.querySelector("p").textContent = "Selected File: " + file.name;
    }
  });

  // 🔄 دعم السحب والإفلات للملفات
  ["dragenter", "dragover", "dragleave", "drop"].forEach(evt =>
    fileLabel.addEventListener(evt, e => {
      e.preventDefault();
      e.stopPropagation();
    })
  );

  // 🌟 تنسيق عند السحب
  fileLabel.addEventListener("dragover", () => fileLabel.classList.add("drag-over"));
  ["dragleave", "drop"].forEach(evt =>
    fileLabel.addEventListener(evt, () => fileLabel.classList.remove("drag-over"))
  );

  // 📥 عند إسقاط ملف
  fileLabel.addEventListener("drop", e => {
    const file = e.dataTransfer.files[0];
    fileInput.files = e.dataTransfer.files;
    fileInput.dispatchEvent(new Event("change"));
  });

  // ⬅️ زر الرجوع للصفحة السابقة
  const backButton = document.querySelector(".back-button");
  if (backButton) {
    backButton.addEventListener("click", e => {
      e.preventDefault();
      window.history.back();
    });
  }

  // 🧠 تحميل التشخيصات من السيرفر
  fetch("http://localhost:5050/get-all-problems")
    .then(res => res.json())
    .then(data => {
      const diagnosisSelect = document.getElementById("initial-diagnosis");
      diagnosisSelect.innerHTML = '<option disabled selected>Select diagnosis</option>';
      data.forEach(problem => {
        const option = document.createElement("option");
        option.textContent = problem.problem_text;
        diagnosisSelect.appendChild(option);
      });
    })
    .catch(err => console.error("❌ Fetch error:", err));

  // 💾 عند الضغط على زر الحفظ
  saveButton.addEventListener("click", function (event) {
    event.preventDefault();

    // 🔎 جمع البيانات من النموذج
    const reportNumber = document.querySelector('input[placeholder="Enter report number"]').value.trim();
    const initialDiagnosis = document.getElementById("initial-diagnosis").value;
    const reportDetails = document.querySelector('textarea[placeholder="Enter detailed description of the issue"]').value.trim();
    const finalDiagnosis = document.querySelector('textarea[placeholder="Enter final diagnosis after investigation"]').value.trim();
    const otherDescription = document.querySelector('textarea[placeholder="Please provide additional details if \'Other\' is selected"]').value.trim();
    const status = document.querySelector("select").value;
    const file = fileInput.files[0];

    // 📌 النوع المختار
    const selectedType = ticketTypeSelect.value;
    const ticketType = selectedType === "Other" ? customTypeInput.value.trim() : selectedType;

    // 🛑 تحقق من الحقول المطلوبة فقط
    if (!ticketType || !initialDiagnosis) {
      alert("Please select ticket type and initial diagnosis.");
      return;
    }

    // 🧳 تعبئة البيانات في FormData
    const formData = new FormData();
    formData.append("report_number", reportNumber);
    formData.append("ticket_type", ticketType);
    formData.append("initial_diagnosis", initialDiagnosis);
    formData.append("report_details", reportDetails);
    formData.append("final_diagnosis", finalDiagnosis);
    formData.append("other_description", otherDescription);
    formData.append("status", status);
    if (file) formData.append("attachment", file); // 🧷 أرفق الملف

    // 📤 إرسال البيانات للسيرفر
    fetch("http://localhost:5050/internal-ticket-with-file", {
      method: "POST",
      body: formData,
    })
      .then(res => res.json())
      .then(data => {
        alert(data.message || "✅ Ticket submitted successfully!");
      })
      .catch(err => {
        console.error("❌ Error:", err);
        alert("❌ Failed to submit ticket.");
      });
  });
});

document.addEventListener("DOMContentLoaded", function () {
  // ========== رفع الملفات ==========
  const fileInput = document.getElementById("upload-file");
  const fileLabel = document.querySelector(".upload-box");
  const saveButton = document.querySelector(".submit-btn");

  fileLabel.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (file) {
      const allowedExtensions = ["pdf", "doc", "docx", "eml"];
      const fileExtension = file.name.split(".").pop().toLowerCase();

      if (!allowedExtensions.includes(fileExtension)) {
        alert("Invalid file type. Only PDF, DOC, DOCX, and EML are allowed.");
        fileInput.value = "";
        fileLabel.querySelector("p").textContent = "Drop files here or click to upload";
      } else {
        fileLabel.querySelector("p").textContent = "Selected File: " + file.name;
      }
    }
  });

  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    fileLabel.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  });

  fileLabel.addEventListener("dragover", () => fileLabel.classList.add("drag-over"));
  ["dragleave", "drop"].forEach((eventName) => {
    fileLabel.addEventListener(eventName, () => fileLabel.classList.remove("drag-over"));
  });

  fileLabel.addEventListener("drop", (e) => {
    const droppedFile = e.dataTransfer.files[0];
    fileInput.files = e.dataTransfer.files;
    fileInput.dispatchEvent(new Event("change"));
  });

  // ========== الرجوع للخلف ==========
  const backButton = document.querySelector(".back-button");
  if (backButton) {
    backButton.addEventListener("click", (e) => {
      e.preventDefault();
      window.history.back();
    });
  }

  // ========== تحقق من الحقول ==========
  saveButton.addEventListener("click", function (event) {
    const ticketNumber = document.querySelector('input[placeholder="Enter ticket number"]').value.trim();
    const reportNumber = document.querySelector('input[placeholder="Enter report number"]').value.trim();
    const reportDetails = document.querySelector('textarea[placeholder="Enter detailed description of the issue"]').value.trim();

    if (!ticketNumber || !reportNumber || !reportDetails) {
      event.preventDefault();
      alert("Please fill in all required fields.");
    }
  });

  // ========== جلب التشخيصات من السيرفر ==========
  fetch('http://localhost:5050/get-all-problems')
    .then(response => response.json())
    .then(data => {
      const diagnosisSelect = document.getElementById('initial-diagnosis');
      if (!diagnosisSelect) {
        console.warn("⚠️ عنصر #initial-diagnosis غير موجود في الصفحة");
        return;
      }

      diagnosisSelect.innerHTML = '<option disabled selected>Select diagnosis</option>';
      data.forEach(problem => {
        const option = document.createElement('option');
        option.textContent = problem.problem_text;
        diagnosisSelect.appendChild(option);
      });
    })
    .catch(error => console.error("❌ Fetch error:", error));
});

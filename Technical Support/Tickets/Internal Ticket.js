document.addEventListener("DOMContentLoaded", function () {
  // 🔄 عناصر مهمة في الصفحة
  const fileInput = document.getElementById("upload-file");
  const fileLabel = document.querySelector(".upload-box");
  const saveButton = document.querySelector(".submit-btn");

  // ✅ فتح نافذة اختيار الملف عند الضغط على الصندوق
  fileLabel.addEventListener("click", () => fileInput.click());

  // ✅ التحقق من نوع الملف عند اختياره
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

  // ✅ دعم السحب والإفلات
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
    fileInput.dispatchEvent(new Event("change")); // Triggers change event to validate
  });

  // ✅ زر الرجوع
  const backButton = document.querySelector(".back-button");
  if (backButton) {
    backButton.addEventListener("click", (e) => {
      e.preventDefault();
      window.history.back();
    });
  }

  // ✅ التحقق من الحقول المطلوبة قبل الحفظ
  saveButton.addEventListener("click", function (event) {
    const ticketNumber = document.querySelector('input[placeholder="Enter ticket number"]').value.trim();
    const reportNumber = document.querySelector('input[placeholder="Enter report number"]').value.trim();
    const reportDetails = document.querySelector('textarea[placeholder="Enter detailed description of the issue"]').value.trim();

    if (!ticketNumber || !reportNumber || !reportDetails) {
      event.preventDefault();
      alert("Please fill in all required fields.");
    }
  });
});
function goBack() {
  window.history.back();
}


window.addEventListener('DOMContentLoaded', () => {
  fetch('http://localhost:5050/get-all-problems') // ✅ تأكدي الرابط مو فيه "/http"
    .then(response => response.json())
    .then(data => {
      const diagnosisSelect = document.getElementById('initial-diagnosis');
      diagnosisSelect.innerHTML = '<option disabled selected>Select diagnosis</option>';
      data.forEach(problem => {
        const option = document.createElement('option');
        option.textContent = problem.problem_text;
        diagnosisSelect.appendChild(option);
      });
    })
    .catch(error => console.error("❌ Fetch error:", error));
});

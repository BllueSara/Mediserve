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
// إظهار إشعار أسفل الدروب ليست
function showNotification(message, selectId) {
  const selectElement = document.getElementById(selectId);
  // إيجاد الحاوية الأقرب التي تحتوي على الـ dropdown، مع استخدام .closest
  let container = selectElement.closest('.dropdown-container');
  if (!container) {
    container = selectElement.parentNode; // في حال عدم دعم .closest
  }

  // إنشاء عنصر الإشعار
  const notification = document.createElement('div');
  notification.className = "notification";
  notification.textContent = message;

  // تعديل الأنماط؛ يمكنك نقل هذه الأنماط إلى ملف CSS
  notification.style.color = "#d9534f";      // لون أحمر للإشعار
  notification.style.fontSize = "14px";
  notification.style.marginTop = "4px";

  // إضافة الإشعار إلى الحاوية
  container.appendChild(notification);

  // إزالة الإشعار بعد 3 ثوانٍ
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 3000);
}

// فتح البوب أب وتعبئة العنوان والنص الحالي
function openPopup(selectId, title) {
  const select = document.getElementById(selectId);
  const selectedOption = select.options[select.selectedIndex];

  // استبدال تنبيه الـ alert بإشعار يظهر أسفل الدروب ليست
  if (!selectedOption || selectedOption.disabled || selectedOption.value === "add-custom") {
    showNotification("Please select a valid option to edit.", selectId);
    return;
  }

  document.getElementById("popup-title").textContent = `Edit ${title}`;
  const popupFields = document.getElementById("popup-fields");
  popupFields.innerHTML = `
    <label>Update ${title}:</label>
    <input type="text" id="popup-input" value="${selectedOption.text}">
  `;

  // حفظ التعديل عند الضغط على زر الحفظ داخل البوب أب
  const saveBtn = document.getElementById("popup-save-btn");
  saveBtn.onclick = () => {
    const newValue = document.getElementById("popup-input").value.trim();
    if (newValue) {
      selectedOption.text = newValue;
    }
    closePopup();
  };

  // عرض البوب أب الموجود مسبقاً
  document.getElementById("popup-modal").style.display = "flex";
}

// إغلاق البوب أب
function closePopup() {
  document.getElementById("popup-modal").style.display = "none";
}

// فتح/إغلاق حقل البحث
function toggleSearch(selectId) {
  const container = document.getElementById(`search-container-${selectId}`);
  container.style.display = container.style.display === "none" ? "block" : "none";

  const input = container.querySelector("input");
  input.value = "";
  input.focus();

  input.oninput = () => {
    const filter = input.value.toLowerCase();
    const select = document.getElementById(selectId);

    for (let i = 0; i < select.options.length; i++) {
      const option = select.options[i];
      const shouldShow = option.text.toLowerCase().includes(filter) || option.value === "add-custom";
      option.style.display = shouldShow ? "block" : "none";
    }
  };
}

// حذف الخيار المحدد مع حفظ الحذف بشكل دائم باستخدام localStorage
function deleteOption(selectId) {
  const select = document.getElementById(selectId);
  const selectedIndex = select.selectedIndex;
  const selectedOption = select.options[selectedIndex];

  if (!selectedOption || selectedOption.disabled || selectedOption.value === "add-custom") {
    showNotification("Please select a valid option to delete.", selectId);
    return;
  }

  const deletedOptionText = selectedOption.text;
  // إزالة الخيار من القائمة الحالية
  select.removeChild(selectedOption);

  // حفظ الحذف بشكل دائم؛ نستخدم مفتاح "deletedOptions_<selectId>" لتخزين النصوص المحذوفة
  const persistentKey = "deletedOptions_" + selectId;
  let deletedOptions = JSON.parse(localStorage.getItem(persistentKey)) || [];
  if (!deletedOptions.includes(deletedOptionText)) {
    deletedOptions.push(deletedOptionText);
    localStorage.setItem(persistentKey, JSON.stringify(deletedOptions));
  }

  showNotification("Deleted option: " + deletedOptionText, selectId);
}

// دالة تطبق الحذف الدائم عند تحميل الصفحة (تحذف الخيارات التي سبق وأن حُذفت)
function applyDeletions(selectId) {
  const persistentKey = "deletedOptions_" + selectId;
  let deletedOptions = JSON.parse(localStorage.getItem(persistentKey)) || [];
  const select = document.getElementById(selectId);
  // استخدام حلقة عكسية لتجنب التأثير على الترتيب عند الحذف
  for (let i = select.options.length - 1; i >= 0; i--) {
    const option = select.options[i];
    if (deletedOptions.includes(option.text)) {
      select.remove(i);
    }
  }
}

// عند تحميل الصفحة، نطبق الحذف الدائم على القوائم المطلوبة
document.addEventListener("DOMContentLoaded", function() {
  // قائمة بمعرّفات الـ select التي تريد تطبيق الحذف الدائم عليها
  const selectIds = ["problem-type", "section", "device-spec", "floor", "technical", "problem-status"];
  selectIds.forEach(id => {
    if (document.getElementById(id)) {
      applyDeletions(id);
    }
  });
});
// لما تظهر مربع البحث:
dropdownContainer.classList.add("with-search");

// لما تخفيه:
dropdownContainer.classList.remove("with-search");


import {
  fetchDeviceSpecsByTypeAndDepartment,
  fetchDepartments,
  loadTicketTypes,
  loadReportStatuses,
  onTicketTypeChange,
  fetchDeviceTypes,
  fetchTechnicalStatus
} from "../shared_functions/device.js";
import {
  filterDropdown,
  toggleDropdown,
  closeAllDropdowns,
} from "../shared_functions/dropdowns.js";


import {

  initInputFieldValidation,
} from "../shared_functions/helpers.js";
import {
  openGenericPopup,
  updatePopupHeadingAndFields
} from "../shared_functions/popup.js";
import {
  fetchProblemStatus,

} from "../shared_functions/problem.js";
window.toggleDropdown = toggleDropdown;
window.filterDropdown = filterDropdown;


document.addEventListener("DOMContentLoaded", function () {
  const fileInput = document.getElementById("upload-file");
  const fileLabel = document.querySelector(".upload-box");
  const saveButton = document.querySelector(".submit-btn");
  const ticketTypeSelect = document.getElementById("ticket-type");
  const customTypeContainer = document.getElementById("custom-type-container");
  const customTypeInput = document.getElementById("custom-ticket-type");
  const ticketNumberInput = document.getElementById("ticket-number");
  const deviceTypeSelect = document.getElementById("device-type");
  const departmentSelect = document.getElementById("department");
  const specSelect = document.getElementById("device-specification");

  ticketNumberInput.readOnly = true;
  ticketNumberInput.value = "";

  // Load dropdowns
  loadTicketTypes();
  loadReportStatuses();


  ticketTypeSelect.addEventListener("change", onTicketTypeChange);


  fileLabel.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", handleFileChange);

  ["dragenter", "dragover", "dragleave", "drop"].forEach(evt =>
    fileLabel.addEventListener(evt, e => {
      e.preventDefault();
      e.stopPropagation();
    })
  );

  fileLabel.addEventListener("dragover", () => fileLabel.classList.add("drag-over"));
  ["dragleave", "drop"].forEach(evt =>
    fileLabel.addEventListener(evt, () => fileLabel.classList.remove("drag-over"))
  );

  fileLabel.addEventListener("drop", e => {
    fileInput.files = e.dataTransfer.files;
    fileInput.dispatchEvent(new Event("change"));
  });

  const backButton = document.querySelector(".back-button");
  if (backButton) {
    backButton.addEventListener("click", e => {
      e.preventDefault();
      window.history.back();
    });
  }

});









import { showToast, showErrorToast, showSuccessToast, showWarningToast, showInfoToast } from '../shared_functions/toast.js';

function handleFileChange(event) {
  const fileInput = event.target;
  const file = fileInput.files[0];
  const allowedExtensions = ["pdf", "doc", "docx", "eml"];
  const ext = file?.name?.split(".").pop().toLowerCase();

  const fileLabel = document.querySelector(".upload-box p");
  if (file && !allowedExtensions.includes(ext)) {
    showErrorToast("Invalid file type. Only PDF, DOC, DOCX, and EML are allowed.");
    fileInput.value = "";
    fileLabel.textContent = "Drop files here or click to upload";
  } else if (file) {
    fileLabel.textContent = "Selected File: " + file.name;
  }
}
  function removeLangTag(value) {
    return value?.replace(/\s*\[(ar|en)\]$/i, "").trim();
  }



  document.querySelector("form").addEventListener("submit", function (e) {
    e.preventDefault();

    const form = e.target;
    let hasError = false;

    const errorMappings = {
      "ticket-type": "selected-ticket-type",
      "technical-status": "selected-technical-status",
      "report-status": "selected-report-status",
      "device-type": "selected-device-type",
      "section": "selected-section",
      "device-spec": "selected-device-spec",
      "problem-status": "selected-problem-status"
    };

    // 🧼 تنظيف الأخطاء القديمة
    form.querySelectorAll(".input-error-message").forEach(el => el.remove());
    form.querySelectorAll(".input-error").forEach(el => el.classList.remove("input-error"));
    Object.values(errorMappings).forEach(id => {
      const toggle = document.getElementById(id)?.closest(".dropdown-toggle");
      if (toggle) {
        toggle.style.border = "";
        toggle.style.borderRadius = "";
      }
    });

    // ✅ التحقق من الحقول المطلوبة
    form.querySelectorAll("[required]").forEach(input => {
      const isHidden = input.type === "hidden" || input.type === "file";
      const isRadio = input.type === "radio";
      const isEmpty = isRadio
        ? !form.querySelector(`input[name="${input.name}"]:checked`)
        : !input.value.trim();

      if (isEmpty) {
        const msg = document.createElement("div");
        msg.className = "input-error-message";
        msg.textContent = "This field is required";

        if (!isHidden) {
          input.classList.add("input-error");
          if (!input.nextElementSibling?.classList?.contains("input-error-message")) {
            input.insertAdjacentElement("afterend", msg);
          }
        } else {
          const visibleId = errorMappings[input.id];
          const toggle = document.getElementById(visibleId)?.closest(".dropdown-toggle");
          if (toggle) {
            toggle.style.border = "1px solid red";
            toggle.style.borderRadius = "4px";
          }

          const wrapper = document.getElementById(visibleId)?.closest(".custom-dropdown-wrapper") ||
            document.getElementById(visibleId)?.closest(".custom-dropdown-wrapperr");

          if (wrapper && !wrapper.nextElementSibling?.classList.contains("input-error-message")) {
            wrapper.insertAdjacentElement("afterend", msg);
          }
        }

        hasError = true;
      }
    });
  const techInput = document.getElementById("technical-status");
  let fullTechnical = "";
  if (techInput) {
    const selectedId = techInput.value;
    // ابحث عن fullName من قائمة المهندسين حسب الـ ID
    const options = window.lastTechnicalOptions || [];
    const found = options.find(item => item.id == selectedId || item.Engineer_ID == selectedId);
    fullTechnical = found ? (found.fullName || found.Engineer_Name || found.name || selectedId) : selectedId;
  }
    if (hasError) return;

    // ✅ تجميع البيانات مع تنظيف الوسوم
    const formData = new FormData();
    formData.append("ticket_number", document.getElementById("ticket-number").value.trim());
    formData.append("ticket_type", removeLangTag(document.getElementById("ticket-type").value));
    formData.append("assigned_to", fullTechnical);
    formData.append("report_status", removeLangTag(document.getElementById("report-status").value));
    formData.append("device_type", removeLangTag(document.getElementById("device-type").value));
  formData.append("section", document.getElementById("section").value); // raw, no trim/tag
    formData.append("device_id", document.getElementById("device-spec").value); // ID ما يحتاج تنظيف
    formData.append("initial_diagnosis", removeLangTag(document.getElementById("problem-status").value));

    const priorityInput = form.querySelector('input[name="priority"]:checked');
    formData.append("priority", priorityInput ? priorityInput.value : '');

    const issueDescription = form.querySelector('#issue_description')?.value.trim() || '';
    const finalDiagnosis = form.querySelector('#final_diagnosis')?.value.trim() || '';
    const otherDescription = form.querySelector('#other_description')?.value.trim() || '';

    formData.append("issue_description", issueDescription);
    formData.append("final_diagnosis", finalDiagnosis);
    formData.append("other_description", otherDescription);

    const file = document.getElementById("upload-file")?.files[0];
    if (file) {
      formData.append("attachment", file);
    }

    const token = localStorage.getItem("token");

    fetch("http://localhost:4000/internal-ticket-with-file", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      body: formData
    })
      .then(res => res.json())
      .then(data => {
        location.reload();
      })
      .catch(err => {
        console.error("❌ Error submitting ticket:", err);
      });
  });



const deviceTypeSelect = document.getElementById("device-type");
const deviceSpecSelect = document.getElementById("device-spec");
const popup = document.getElementById("popup-modal");


if (deviceTypeSelect) {
  deviceTypeSelect.addEventListener("change", function () {
    const type = this.value.trim().toLowerCase();
    const department = sectionDropdown?.value?.trim();

    deviceSpecSelect.value = "";

    fetchDeviceSpecsByTypeAndDepartment(); // ✅ تحديث الأجهزة
    if (type) fetchProblemStatus(type);     // ✅ تحديث الأعطال
  });
}



document.addEventListener(" ", () => {
  document.addEventListener("click", e => {
    if (!e.target.closest(".custom-dropdown-wrapper")) {
      closeAllDropdowns();
    }
  });
});


document.addEventListener("DOMContentLoaded", () => {
  fetchDeviceTypes();
  fetchDepartments("section");
  fetchTechnicalStatus(); // ✅ جلب أسماء المهندسين مع بداية الصفحة
  const typeDropdown = document.getElementById("device-type");
  const sectionDropdown = document.getElementById("section");

  if (typeDropdown && sectionDropdown) {
    typeDropdown.addEventListener("change", () => {
      const type = typeDropdown.value.toLowerCase();
      const dept = sectionDropdown.value;

      if (type && dept) {
        fetchDeviceSpecsByTypeAndDepartment();
      }
      if (type) fetchProblemStatus(type);
    });

    sectionDropdown.addEventListener("change", () => {
      const dept = sectionDropdown.value; // هذه هي القيمة الكاملة "English|Arabic"
      const type = typeDropdown.value.toLowerCase();

      const englishOnly = dept.split("|")[0];
      sessionStorage.setItem("original-department", englishOnly);

      if (type && dept) {
        fetchDeviceSpecsByTypeAndDepartment();
      }
    });
  }
  const optionsContainer = document.getElementById("device-spec-options");

  if (optionsContainer) {
    optionsContainer.addEventListener("click", (e) => {
      const row = e.target.closest(".dropdown-option-row");
      if (!row) return;

      const value = row.textContent.trim();
      if (value === "+ Add New Specification") {
        const type = typeDropdown?.value?.toLowerCase();

        if (!type) {
          console.log("❌ نوع الجهاز غير محدد");
          showErrorToast("❌ اختر نوع الجهاز أولاً");
          return;
        }

        if (["pc", "printer", "scanner", "desktop", "laptop", "كمبيوتر", "لابتوب"].includes(type)) {
          console.log("✅ فتح بوب أب المواصفات لنوع:", type);
          updatePopupHeadingAndFields(type);
          document.getElementById("popup-modal").style.display = "flex";
          initInputFieldValidation(popupForm); // ✅ ربط التحقق للحقول الجديدة
        } else {
          console.log("�� فتح بوب أب generic للجهاز من نوع:", type);
          openGenericPopup("Device Specification", "device-spec");
        }

      }
    });
  }
});


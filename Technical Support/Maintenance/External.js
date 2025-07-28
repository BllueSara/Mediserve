// استيراد الدوال من ملفات ريقولر هيلبر
import {
  fetchDeviceSpecsByTypeAndDepartment,
  fetchDepartments,
  fetchDeviceTypes,
  fetchReporterNames
} from "../shared_functions/device.js";
import {
  filterDropdown,
  toggleDropdown,
  closeAllDropdowns,
} from "../shared_functions/dropdowns.js";


import {

  cleanLangTag,
checkUserPermissions,
  initInputFieldValidation,
} from "../shared_functions/helpers.js";
import {
  openGenericPopup,
  updatePopupHeadingAndFields
} from "../shared_functions/popup.js";

// هنا ضع السطرين 👇
window.toggleDropdown = toggleDropdown;
window.filterDropdown = filterDropdown;

const deviceTypeSelect = document.getElementById("device-type");
const deviceSpecSelect = document.getElementById("device-spec");
const popup = document.getElementById("popup-modal");
const popupHeading = popup.querySelector("#popup-title");
const popupForm = document.getElementById("pc-spec-form");
const popupFieldsContainer = document.getElementById("popup-fields");

if (deviceTypeSelect) {
  deviceTypeSelect.addEventListener("change", function () {
    const type = this.value.trim().toLowerCase();
    const department = sectionDropdown?.value?.trim();

    deviceSpecSelect.value = "";

    fetchDeviceSpecsByTypeAndDepartment(); // ✅ تحديث الأجهزة
  });
}





document.addEventListener("DOMContentLoaded", () => {
  fetchDeviceTypes();
  fetchDepartments("section");
  fetchReporterNames(); // ✅ التقنيين حقين التقارير

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
        
        if (["pc", "printer", "scanner","desktop", "laptop", "كمبيوتر", "لابتوب"].includes(type)) {
          console.log("✅ فتح بوب أب المواصفات لنوع:", type);
          updatePopupHeadingAndFields(type);
          document.getElementById("popup-modal").style.display = "flex";
            initInputFieldValidation(popupForm); // ✅ ربط التحقق للحقول الجديدة

        } else {
          console.log("🔁 فتح بوب أب generic للجهاز من نوع:", type);
          openGenericPopup("device_specifications", "device-spec");
        }
      }
    });
  }
});




import { showToast, showErrorToast, showSuccessToast, showWarningToast, showInfoToast } from '../shared_functions/toast.js';

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("external-maintenance-form");
  if (!form) return console.error("❌ Form not found!");

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    let hasError = false;

    const errorMappings = {
      "device-type": "selected-device-type",
      "device-spec": "selected-device-spec",
      "section": "selected-section",
      "technical": "selected-technical"
    };

    const t = languageManager.translations[languageManager.currentLang] || {};

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

    form.querySelectorAll("[required]").forEach(input => {
      const isHidden = input.type === "hidden";
      const isEmpty = !input.value.trim();

      if (isEmpty) {
        if (!isHidden) {
          input.classList.add("input-error");
          const msg = document.createElement("div");
          msg.className = "input-error-message";
          msg.textContent = t["field_required"] || "This field is required";
          if (!input.nextElementSibling?.classList.contains("input-error-message")) {
            input.insertAdjacentElement("afterend", msg);
          }
        } else {
          const visibleId = errorMappings[input.id];
          const toggle = document.getElementById(visibleId)?.closest(".dropdown-toggle");
          if (toggle) {
            toggle.style.border = "1px solid red";
            toggle.style.borderRadius = "4px";
          }

          const msg = document.createElement("div");
          msg.className = "input-error-message";
          msg.textContent = t["field_required"] || "This field is required";

          const wrapper = document.getElementById(visibleId)?.closest(".custom-dropdown-wrapper");
          if (wrapper && !wrapper.nextElementSibling?.classList.contains("input-error-message")) {
            wrapper.insertAdjacentElement("afterend", msg);
          }
        }
        hasError = true;
      }
    });

    if (hasError) return;

    const cleanLangTag = (val) => (val || "").replace(/\s*\[(ar|en)\]$/i, "").trim();
    const getVal = id => cleanLangTag(document.getElementById(id)?.value.trim() || "");
const getRaw   = id  => (document.getElementById(id)?.value || "").trim();

    const data = {
      ticket_number: getVal("ticket-number"),
      device_type: getVal("device-type"),
      device_specifications: getVal("device-spec"),
      section: getRaw("section"),
      maintenance_manager: getVal("maintenance-manager"),
      reporter_name: document.getElementById("technical")?.value || getVal("technical"),
      initial_diagnosis: getVal("initial-diagnosis"),
      final_diagnosis: getVal("final-diagnosis")
    };

    const techInput = document.getElementById("technical");
    if (techInput?.dataset?.id) {
      data.reporter_name = techInput.dataset.id; // استخدام ID لو متوفر
    }

    const token = localStorage.getItem('token');

    fetch("http://localhost:4000/submit-external-maintenance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(data)
    })
      .then(res => res.json())
      .then(result => {
        console.log("✅ Server response:", result);
        location.reload();
      })
      .catch(err => {
        console.error("❌ Error sending data:", err);
      });
  });
});

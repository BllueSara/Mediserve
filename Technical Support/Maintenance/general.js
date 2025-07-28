// استيراد الدوال من ملفات ريقولر هيلبر
import {
  fetchDeviceSpecsByTypeAndDepartment,
  fetchDepartments,
fetchFloors,
  fetchDeviceTypes,
  fetchTechnicalStatus
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
import {
  fetchProblemStatus,

} from "../shared_functions/problem.js";
// هنا ضع السطرين 👇
window.toggleDropdown = toggleDropdown;
window.filterDropdown = filterDropdown;
// ... الاستيرادات الأخرى ...

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
    if (type) fetchProblemStatus(type);     // ✅ تحديث الأعطال
  });
}



document.addEventListener("DOMContentLoaded", () => {
  fetchDeviceTypes();
  fetchDepartments("section");
  fetchTechnicalStatus(); // ✅ جلب أسماء المهندسين مع بداية الصفحة
  fetchFloors();
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
          return;
        }

        if (["pc", "printer", "scanner", "desktop", "laptop", "كمبيوتر", "لابتوب"].includes(type)) {
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



// ================== إرسال النموذج =====================
document.querySelector("form").addEventListener("submit", function (e) {
  e.preventDefault();

  const form = e.target;
  let hasError = false;

  // 🧼 تنظيف الأخطاء القديمة
  const errorMappings = {
    "device-type": "selected-device-type",
    "section": "selected-section",
    "device-spec": "selected-device-spec",
    "problem-status": "selected-problem-status",
    "technical-status": "selected-technical-status"
  };

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
    const isHidden = input.type === "hidden";
    const isEmpty = !input.value.trim();

    if (isEmpty) {
      if (!isHidden) {
        input.classList.add("input-error");
        const msg = document.createElement("div");
        msg.className = "input-error-message";
        msg.textContent = "This field is required";
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
        msg.textContent = "This field is required";

        const wrapper = document.getElementById(visibleId)?.closest(".custom-dropdown-wrapper");
        if (wrapper && !wrapper.nextElementSibling?.classList.contains("input-error-message")) {
          wrapper.insertAdjacentElement("afterend", msg);
        }
      }

      hasError = true;
    }
  });

  if (hasError) return;

  // ✅ اجمع البيانات بعد تنظيف الوسوم
  const cleanLangTag = (value) => value?.replace(/\s*\[(ar|en)\]$/i, "").trim();

  const getValue = id => cleanLangTag(document.getElementById(id)?.value || "");
  const getValueByName = name => cleanLangTag(document.querySelector(`input[name="${name}"]`)?.value || "");
const getRaw   = id  => (document.getElementById(id)?.value || "").trim();

  const techInput = document.getElementById("technical-status");
  let fullTechnical = "";
  if (techInput) {
    const selectedId = techInput.value;
    // ابحث عن fullName من قائمة المهندسين حسب الـ ID
    const options = window.lastTechnicalOptions || [];
    const found = options.find(item => item.id == selectedId || item.Engineer_ID == selectedId);
    fullTechnical = found ? (found.fullName || found.Engineer_Name || found.name || selectedId) : selectedId;
  }

  const data = {
    DeviceType: getValue("device-type"),
    DeviceID: getValue("device-spec"),
    Section: getRaw("section"),
    Floor: getValue("floor"),
    ProblemType: getValue("device-type"),
    ProblemStatus: getValue("problem-status"),
    InitialDiagnosis: getValueByName("InitialDiagnosis"),
    FinalDiagnosis: getValueByName("FinalDiagnosis"),
    CustomerName: getValueByName("CustomerName"),
    IDNumber: getValueByName("IDNumber"),
    Extension: getValueByName("ExtNumber"),
    Technical: fullTechnical
  };

  const token = localStorage.getItem("token");

  fetch("http://localhost:4000/submit-general-maintenance", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(data)
  })
    .then(res => res.json())
    .then(result => {
      location.reload();
    })
    .catch(err => {
      console.error("❌ Failed to submit form:", err);
      showErrorToast("❌ فشل في الإرسال. تحقق من الاتصال.");
    });
});


import { showToast, showErrorToast, showSuccessToast, showWarningToast, showInfoToast } from '../shared_functions/toast.js';

document.addEventListener("DOMContentLoaded", () => {


  const t = languageManager.translations[languageManager.currentLang];

  dropdownConfigs.forEach(config => {
    const optionsContainer = document.getElementById(`${config.id}-options`);
    const hiddenInput = document.getElementById(config.id);
    const displaySpan = document.getElementById(`selected-${config.id}`);

    if (!optionsContainer || !hiddenInput || !displaySpan) {
      console.warn(`❌ العناصر غير مكتملة لـ ${config.id}`);
      return;
    }

   async function loadOptions() {
 await checkUserPermissions().then(permissions => {
    fetch(`http://localhost:4000${config.endpoint}`)
      .then(res => res.json())
      .then(data => {
        optionsContainer.innerHTML = "";

        // ✅ Add New Button (إذا عنده صلاحية)
        if (permissions.full_access || permissions.add_items) {
          const addNew = document.createElement("div");
          addNew.className = "dropdown-option-row add-new-option";
          addNew.innerHTML = `<div class="dropdown-option-text">+ ${t['add_new']} ${t[config.labelKey]}</div>`;
          addNew.onclick = () => {
            sessionStorage.setItem("lastDropdownOpened", config.id);
            openAddNewOptionPopup(config);
            closeAllDropdowns();
          };
          optionsContainer.appendChild(addNew);
        }

        data.forEach(item => {
          const value = item[config.key];
          if (!value) return;

          const row = document.createElement("div");
          row.className = "dropdown-option-row";

          const text = document.createElement("div");
          text.className = "dropdown-option-text";
          text.textContent = value;
          text.onclick = () => {
            hiddenInput.value = value;
            displaySpan.textContent = value;
            cleanDropdownError(hiddenInput);
            closeAllDropdowns();
          };

          const icons = document.createElement("div");
          icons.className = "dropdown-actions-icons";

          // ✏️ Edit
          if (permissions.full_access || permissions.edit_items) {
            const editIcon = document.createElement("i");
            editIcon.className = "fas fa-edit";
            editIcon.title = t['edit'] || "Edit";
            editIcon.onclick = (e) => {
              e.stopPropagation();
              // تمرير القيمة الكاملة عند التعديل
              if (inputId === "section" || inputId === "spec-department") {
                onEditOption?.(item.fullName || actualValue);
              } else if (inputId === "technical-status") {
                onEditOption?.(item.fullName || actualValue);
              } else {
                onEditOption?.(actualValue);
              }
            };
            icons.appendChild(editIcon);
          }

          // 🗑️ Delete
          if (permissions.full_access || permissions.delete_items) {
            const deleteIcon = document.createElement("i");
            deleteIcon.className = "fas fa-trash";
            deleteIcon.title = t['delete'];
            deleteIcon.onclick = (e) => {
              e.stopPropagation();
              if (confirm(`${t['confirm_delete']} "${value}"?`)) {
                deleteOption(config.id, value);
              }
            };
            icons.appendChild(deleteIcon);
          }

          row.appendChild(text);
          row.appendChild(icons);
          optionsContainer.appendChild(row);
        });

        // ✅ استعادة القيمة المحفوظة
        const saved = sessionStorage.getItem(config.id);
        if (saved) {
          displaySpan.textContent = saved;
          hiddenInput.value = saved;
          sessionStorage.removeItem(config.id);
        }

        attachEditDeleteHandlers(`${config.id}-options`, t[config.labelKey]);
      })
      .catch(err => console.error(`❌ Error loading ${config.id}:`, err));
  });
}


    loadOptions();
  });
});


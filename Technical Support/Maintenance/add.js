// استيراد الدوال من ملفات ريقولر هيلبر
import {
  fetchDeviceSpecsByTypeAndDepartment,
  fetchDepartments,

  fetchDeviceTypes,
} from "../shared_functions/device.js";
import {
  filterDropdown,
  toggleDropdown,
  closeAllDropdowns,
} from "../shared_functions/dropdowns.js";


import {

  cleanLangTag,

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

if (deviceTypeSelect) {
  deviceTypeSelect.addEventListener("change", function () {

    deviceSpecSelect.value = "";

    fetchDeviceSpecsByTypeAndDepartment(); // ✅ تحديث الأجهزة
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
          alert("❌ اختر نوع الجهاز أولاً");
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

document.querySelector("form").addEventListener("submit", function (e) {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);
  const data = {};
  let hasError = false;

  // 🧼 نظف الأخطاء القديمة
  const errorMappings = {
    "device-type": "selected-device-type",
    "section": "selected-section",
    "device-spec": "selected-device-spec",
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
        const visibleSpan = document.getElementById(visibleId);
        const wrapper = visibleSpan?.closest(".custom-dropdown-wrapper") || visibleSpan?.closest(".custom-dropdown-wrapperr");
        if (wrapper && !wrapper.nextElementSibling?.classList.contains("input-error-message")) {
          wrapper.insertAdjacentElement("afterend", msg);
        }
      }

      hasError = true;
    }
  });

  if (hasError) return;

  // ✅ جمع البيانات وتنظيف الوسوم
formData.forEach((value, key) => {

    data[key] = value; 

});

  // لا حاجة لاستبدال القسم هنا، أرسل القيمة كما هي من الفورم
  console.log("✅ القسم المرسل فعليًا:", data.section);

  // ⏎ إرسال الطلب
  submitNewDevice(data);
});


// ✅ دالة إرسال الطلب
async function submitNewDevice(data) {
  try {
    const token = localStorage.getItem('token');

    const response = await fetch("http://localhost:4000/submit-new-device", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) throw new Error(result.error || "Unknown server error");

    location.reload();

  } catch (err) {
    console.error("❌ Submission error:", err);
    alert("❌ Failed to submit device.");
  }
}



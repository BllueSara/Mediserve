// استيراد الدوال من ملفات ريقولر هيلبر
import {
  fetchDeviceSpecsByTypeAndDepartment,
  fetchDepartments,

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
const deviceTypeSelect = document.getElementById("device-type");
const deviceSpecSelect = document.getElementById("device-spec");

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
document.querySelector("form").addEventListener("submit", function (e) {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);
  const data = {};
  let hasError = false;

  // 🧼 تنظيف الأخطاء القديمة
  const errorMappings = {
    "device-type": "selected-device-type",
    "section": "selected-section",
    "device-spec": "selected-device-spec",
    "problem-status": "selected-problem-status",
    "technical-status": "selected-technical-status"
  };

  form.querySelectorAll("[required]").forEach(input => {
    const isHidden = input.type === "hidden";
    const isEmpty = !input.value.trim();

    if (isEmpty) {
      if (!isHidden) {
        input.classList.add("input-error");
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

        const wrapper = document.getElementById(visibleId)?.closest(".custom-dropdown-wrapperr");
        if (wrapper && !wrapper.querySelector(".input-error-message")) {
          wrapper.insertAdjacentElement("afterend", msg);
        }
      }

      hasError = true;
    }
  });

  if (hasError) return;

  // ✅ جمع البيانات

  formData.forEach((value, key) => {
    if (key === "section") {
      // اذا كان المفتاح هو "section" (القسم)، نخزّن القيمة كما هي 
      data[key] = value; 
    } else if (key === "problem-status") {
      // ✅ للمشاكل، نحول JSON string إلى string مفصولة بفواصل
      console.log("🔍 Original problem-status value:", value);
      console.log("🔍 Type of value:", typeof value);
      console.log("🔍 Is Array:", Array.isArray(value));
      
      // تحويل مباشر إلى نص مفصول بفواصل
      if (Array.isArray(value)) {
        data["problem_status"] = value.join(", ");
      } else if (typeof value === "string") {
        try {
          // محاولة تحويل JSON string إلى array
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) {
            data["problem_status"] = parsed.join(", ");
          } else {
            data["problem_status"] = value;
          }
        } catch (e) {
          // إذا فشل التحويل، استخدم القيمة كما هي
          data["problem_status"] = value;
        }
      } else {
        data["problem_status"] = String(value);
      }
      
      console.log("🔍 Final problem_status:", data["problem_status"]);
    } else {
      // لبقية الحقول نطبّق التنظيف كالمعتاد
      data[key] = cleanLangTag(value);
    }
  });

  console.log("🔍 القسم المرسل في submit:", data["section"]);

  // ✅ استبدال الاسم بـ ID للفني
  const techInput = document.getElementById("technical-status");
  // أضف هذي الأسطر قبل if (techInput?.dataset?.id)
  console.log("🧪 input موجود؟", !!techInput);
  console.log("🧪 value:", techInput?.value);
  console.log("🧪 id:", techInput?.dataset?.id);
if (techInput?.dataset?.id) {
  data["technical-status"] = techInput.dataset.id;
  data["technical_engineer_id"] = techInput.dataset.id; // ✅ استخدام الاسم الصحيح للسيرفر
} else {
  console.warn("❌ لم يتم العثور على ID للمهندس");
}

  console.log("📤 البيانات المرسلة للسيرفر:", data);
  console.log("🟢 سيتم إرسال problem_status:", data["problem_status"]);

  // ✅ معالجة إضافية للمشاكل قبل الإرسال
  if (data["problem_status"] && Array.isArray(data["problem_status"])) {
    console.log("🔧 تحويل problem_status من array إلى string");
    data["problem_status"] = data["problem_status"].join(", ");
    console.log("🔧 problem_status بعد التحويل:", data["problem_status"]);
  }

  submitRegularMaintenance(data);
});


// ✅ دالة الإرسال إلى السيرفر
async function submitRegularMaintenance(data) {
  try {
    const token = localStorage.getItem('token');

    const response = await fetch("http://localhost:4000/submit-regular-maintenance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.error);
      return;
    }

    // ✅ نجاح العملية
    location.reload();

  } catch (err) {
    console.error("❌ Submission error:", err);
    alert("❌ فشل في الاتصال بالسيرفر. حاول مرة أخرى.");
  }
}



// دوال إدارة النوافذ المنبثقة (Popups)
import * as device from "./device.js";
import {labelWithStar } from "./helpers.js";
import { getFullName,editOptionWithFullName } from "./edit.js";

const popup = document.getElementById("popup-modal");
const popupHeading = popup.querySelector("#popup-title");
const popupForm = document.getElementById("pc-spec-form");
const popupFieldsContainer = document.getElementById("popup-fields");
export function openGenericPopup(labelKey, targetId) {
  const popup = document.getElementById("generic-popup");
  const lang = languageManager.currentLang;
  const t = languageManager.translations[lang];

  const translatedLabel = t[labelKey] || labelKey;
  const addNewText = t['add_new'] || 'Add New';
  const enterValueText = t['enter_new_value'] || 'Enter new value...';
  const saveText = t['save'] || 'Save';
  const cancelText = t['cancel'] || 'Cancel';

  const deviceType = document.getElementById("device-type")?.value;
  const cleanedType = deviceType?.trim().toLowerCase() || '';

  if (labelKey === "device_specifications") {
    fetch("http://localhost:4000/Departments")
      .then(res => res.json())
      .then((departments) => {
        const isUnknownType = !["pc", "printer", "scanner", "desktop", "laptop", "كمبيوتر", "لابتوب"].includes(cleanedType);

        const departmentsOptions = isUnknownType
          ? `<option value="add-new-department">+ ${t['add_new']} ${t['section']}</option>` +
          departments.map(dep => `<option value="${dep.name}">${dep.name}</option>`).join("")
          : departments.map(dep => `<option value="${dep.name}">${dep.name}</option>`).join("") +
          `<option value="add-new-department">+ ${t['add_new']} ${t['section']}</option>`;

        popup.innerHTML = `
          <div class="popup-contentt">
            <h3>${t['add_device']}</h3>

            <label>${labelWithStar(t['device_name'], true)}</label>
            <input type="text" id="spec-name" required />

            <label>${labelWithStar(t['serial_number'], true)}</label>
            <input type="text" id="spec-serial" required/>

            <label>${labelWithStar(t['ministry_number'], true)}</label>
            <input type="text" id="spec-ministry" required/>

<label>${labelWithStar(t['model'], true)}</label>
<div class="custom-dropdown-wrapper">
  <div class="custom-dropdown">
    <div class="dropdown-toggle" onclick="toggleDropdown(this)">
      <span id="selected-spec-model">${t['select_model']}</span>
      <span>▼</span>
    </div>
    <div class="dropdown-content">
      <input type="text" class="dropdown-search" placeholder="${t['search_model']}" oninput="filterDropdown(this, 'spec-model-options')">
      <div class="dropdown-options" id="spec-model-options"></div>
    </div>
  </div>
</div>
<input type="hidden" id="spec-model" name="model" required />


<label>${labelWithStar(t['section'], true)}</label>
<div class="custom-dropdown-wrapper">
  <div class="custom-dropdown">
    <div class="dropdown-toggle" onclick="toggleDropdown(this)">
      <span id="selected-spec-department">${t['select_department']}</span>
      <span>▼</span>
    </div>
    <div class="dropdown-content">
      <input type="text" class="dropdown-search" placeholder="${t['search_department']}" oninput="filterDropdown(this, 'spec-department-options')">
      <div class="dropdown-options" id="spec-department-options"></div>
    </div>
  </div>
</div>
<input type="hidden" id="spec-department" name="department" required />


            <input type="hidden" id="generic-popup-target-id" value="${targetId}" />
            <div class="popup-buttons">
              <button onclick="saveDeviceSpecification()">${saveText}</button>
              <button onclick="closeGenericPopup(true); event.stopPropagation()">${cancelText}</button>
            </div>
          </div>
        `;

        popup.style.display = "flex";
        requestAnimationFrame(() => device.fetchDepartments("spec-department"));

        document.getElementById("spec-department").addEventListener("change", function (e) {
          if (e.target.value === "add-new-department") {
            const currentFields = ["spec-ministry", "spec-name", "spec-serial", "spec-model"];
            currentFields.forEach(id => {
              const el = document.getElementById(id);
              if (el) sessionStorage.setItem(id, el.value);
            });
            openAddSectionPopup();
          }
        });

       device. fetchAndRenderModels(cleanedType, "spec-model");

        setTimeout(() => {
          const fields = ["spec-ministry", "spec-name", "spec-serial", "spec-department"];
          fields.forEach(id => {
            const el = document.getElementById(id);
            const saved = sessionStorage.getItem(id);
            if (el && saved) {
              el.value = saved;
              sessionStorage.removeItem(id);
            }
          });

          const lastModel = sessionStorage.getItem("lastAddedModel");
          if (lastModel) {
            document.getElementById("spec-model").value = lastModel;
            sessionStorage.removeItem("lastAddedModel");
          }
        }, 0);

        document.getElementById("spec-model").addEventListener("change", (e) => {
          if (e.target.value === "add-new-model") {
            sessionStorage.setItem("lastDropdownOpened", "spec-model");
            const fields = ["spec-ministry", "spec-name", "spec-serial", "spec-department"];
            fields.forEach(id => {
              const el = document.getElementById(id);
              if (el) sessionStorage.setItem(id, el.value);
            });
            openAddModelPopup(deviceType);
          }
        });

      })
      .catch(err => {
        console.error("❌ Error loading departments:", err);
        alert(t['failed_to_load_departments']);
      });

  } else {
    popup.innerHTML = `
      <div class="popup-contentt">
        <h3 id="generic-popup-title">${addNewText} ${translatedLabel}</h3>
        <label for="generic-popup-input" id="generic-label">${translatedLabel}:</label>
        <input type="text" id="generic-popup-input" placeholder="${enterValueText}" required />
        <input type="hidden" id="generic-popup-target-id" value="${targetId}" />
        <div class="popup-buttons">
          <button type="button" class="save-btn" onclick="saveGenericOption()">${saveText}</button>
          <button onclick="closeGenericPopup(true); event.stopPropagation()">${cancelText}</button>
        </div>
      </div>
    `;
    popup.style.display = "flex";
  }
}


export function saveDeviceSpecification() {


  const lang = languageManager.currentLang;
  const t = languageManager.translations[lang];

  const requiredFields = [
    { id: "spec-ministry", label: t['ministry_number'] },
    { id: "spec-name", label: t['device_name'] },
    { id: "spec-model", label: t['model'] },
    { id: "spec-serial", label: t['serial_number'] },
    { id: "spec-department", label: t['section'] }
  ];

  let hasError = false;

  requiredFields.forEach(({ id }) => {
    const input = document.getElementById(id);
    if (!input) return;
    input.classList.remove("input-error");

    const next = input.nextElementSibling;
    if (next?.classList.contains("input-error-message")) {
      next.remove();
    }

    if (input.type === "hidden") {
      const visible = input.closest(".form-field")?.querySelector(".dropdown-toggle");
      if (visible) {
        visible.style.border = "";
        visible.style.borderRadius = "";
      }
    }
  });

  requiredFields.forEach(({ id, label }) => {
    const input = document.getElementById(id);
    if (!input) return;

    if (!input.value.trim()) {
      hasError = true;

      if (input.type === "hidden") {
        const visible = document.querySelector(`#${id}-dropdown-wrapper .dropdown-toggle`);
        if (visible) {
          visible.style.border = "1px solid red";
          visible.style.borderRadius = "4px";
        }

        const msg = document.createElement("div");
        msg.className = "input-error-message";
        msg.textContent = `${label} ${t['is_required']}`;

        const wrapper = document.getElementById(`${id}-dropdown-wrapper`);
        if (wrapper && !wrapper.nextElementSibling?.classList.contains("input-error-message")) {
          wrapper.insertAdjacentElement("afterend", msg);
        }
      } else {
        input.classList.add("input-error");

        const msg = document.createElement("div");
        msg.className = "input-error-message";
        msg.textContent = `${label} ${t['is_required']}`;
        input.insertAdjacentElement("afterend", msg);
      }
    }
  });

  const deviceType = document.getElementById("device-type").value.toLowerCase();
  const dropdown = document.getElementById("device-spec");

  if (!deviceType) {
    alert(t['device_type_not_selected']);
    return;
  }

  if (hasError) return;

  function cleanLangTag(value) {
    return value.replace(/\s*\[(ar|en)\]$/i, "").trim();
  }

 const specData = {
    "ministry-id": cleanLangTag(document.getElementById("spec-ministry").value.trim()),
    "device-name": cleanLangTag(document.getElementById("spec-name").value.trim()),
    model: cleanLangTag(document.getElementById("spec-model").value.trim()),
    serial: cleanLangTag(document.getElementById("spec-serial").value.trim()),
   department:   sessionStorage.getItem("department-full") ||
                  document.getElementById("spec-department").value.trim()
    
  };


  fetch(`http://localhost:4000/AddDevice/${deviceType}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem('token')}` },
    body: JSON.stringify(specData)
  })
    .then(res => {
      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      return res.json();
    })
    .then(result => {
      if (result.message) {
        sessionStorage.setItem("spec-saved", "true");

        const option = document.createElement("option");
        option.value = result.insertedId;
        option.textContent = `${specData["device-name"]} | ${specData.serial} | ${specData["ministry-id"]}`;
        dropdown.appendChild(option);
        dropdown.value = result.insertedId;

        const displaySpan = document.getElementById("selected-device-spec");
        if (displaySpan) displaySpan.textContent = option.textContent;

        sessionStorage.removeItem("returnToPopup");

        device.fetchDeviceSpecsByTypeAndDepartment();

        requiredFields.forEach(({ id }) => document.getElementById(id).value = "");

        document.getElementById("generic-popup").style.display = "none";
      } else {
        alert(t['save_failed'] + ": " + result.error);
      }
    })
    .catch(err => {
      console.error("❌ Error saving device_specifications:", err);
      alert(t['error_saving_specifications']);
    });
}
window.saveDeviceSpecification = saveDeviceSpecification;
export function saveGenericOption() {
  const rawValue = document.getElementById("generic-popup-input").value.trim();
  const targetId = document.getElementById("generic-popup-target-id").value;
  const dropdown = document.getElementById(targetId);
  const t = languageManager.translations[languageManager.currentLang];

  if (!rawValue || !dropdown) return;

  // ✅ لا نضيف تاجات لغة - نحفظ القيمة كما هي
  const value = rawValue;

  fetch("http://localhost:4000/add-options-regular", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + localStorage.getItem("token")
    },
    body: JSON.stringify({ target: targetId, value: value })
  })
    .then(res => res.json())
    .then(result => {
      if (result.error) {
        alert(t[result.error] || result.error);
      } else {
        if (targetId === "device-type") {
          sessionStorage.setItem("device-type", value);
          device.fetchDeviceTypes(); // ✅ إعادة تحميل DeviceType بعد الإضافة
        }
        sessionStorage.removeItem("returnToPopup");
        closeGenericPopup();
      }
    })
    .catch(err => {
      alert(err.message || "❌ Failed to save");
    });
}
window.saveGenericOption = saveGenericOption;
export function openAddModelPopup() {
  const deviceType = document.getElementById("device-type").value.trim();
  const origin = document.getElementById("generic-popup-target-id")?.value;
  const lang = languageManager.currentLang;
  const t = languageManager.translations[lang];

  if (origin === "device-spec") {
    sessionStorage.setItem("returnToPopup", "true");
  }

  const popup = document.getElementById("generic-popup");
  popup.innerHTML = `
    <div class="popup-contentt">
      <h3>${t['add_new']} ${t['model']} ${t['for']} ${deviceType}</h3>
      <label>${t['model_name']}:</label>
      <input type="text" id="new-model-name" placeholder="${t['enter_model_name']}" />
      <input type="hidden" id="generic-popup-target-id" value="model" />
      <div class="popup-buttons">
        <button onclick="saveNewModel()">${t['save']}</button>
        <button onclick="closeGenericPopup(true); event.stopPropagation()">${t['cancel']}</button>
      </div>
    </div>
  `;
  popup.style.display = "flex";
}

export function openAddSectionPopup(contextId = "section", oldValue = "") {
  const lang = languageManager.currentLang;
  const t = languageManager.translations[lang];
  sessionStorage.setItem("addSectionContext", contextId);
  const origin = document.getElementById("generic-popup-target-id")?.value;
  if (origin === "device-spec") {
    sessionStorage.setItem("returnToPopup", "true");
    sessionStorage.setItem("popupContext", "device-spec");
  }
  
  const popup = document.getElementById("generic-popup");
  const isEdit = oldValue && oldValue.trim() !== "";
  
if (isEdit) {
  // ✅ عند التعديل، جلب الاسم الكامل أولاً
  console.log(` Opening edit popup for section: "${oldValue}"`);
  
  // استخراج الجزء المناسب من الاسم إذا كان فيه "|"
  let searchValue = oldValue;
  if (oldValue && oldValue.includes("|")) {
    const parts = oldValue.split("|").map(s => s.trim());
    const currentLang = languageManager.currentLang;
    searchValue = currentLang === "ar" ? (parts[1] || parts[0]) : parts[0];
    console.log(`🔍 Using local part for search: "${searchValue}" (from "${oldValue}")`);
  }
  
  // عرض رسالة تحميل
  popup.innerHTML = `
    <div class="popup-contentt">
      <h3>${t['loading'] || 'Loading...'}</h3>
      <p>${t['loading_section_data'] || 'Loading section data...'}</p>
    </div>
  `;
  popup.style.display = "flex";
  
  // جلب الاسم الكامل باستخدام الجزء المحلي
  getFullName("section", searchValue).then(fullNameData => {
    if (!fullNameData) {
      alert(`❌ Could not find section "${searchValue}". Please check the spelling.`);
      popup.style.display = "none";
      return;
    }
    
    console.log(`✅ Found section data:`, fullNameData);
    
    // ✅ معالجة القيمة القديمة - الآن لدينا الاسم الكامل
    const enVal = fullNameData.englishName || "";
    const arVal = fullNameData.arabicName || "";
    
    const title = t['edit'] + " " + t['section'];
    
    popup.innerHTML = `
      <div class="popup-contentt">
        <h3>${title}</h3>
        <label>${t['section_name']} (English):</label>
        <input type="text" id="new-section-en" placeholder="${t['enter_section_name']} (English)" value="${enVal}" />
        <label>${t['section_name']} (عربي):</label>
        <input type="text" id="new-section-ar" placeholder="${t['enter_section_name']} (عربي)" value="${arVal}" />
        <input type="hidden" id="old-section-value" value="${fullNameData.fullName}" />
        <input type="hidden" id="generic-popup-target-id" value="section" />
        <div class="popup-buttons">
          <button onclick="saveNewSection()">${t['save']}</button>
          <button onclick="closeGenericPopup(true); event.stopPropagation()">${t['cancel']}</button>
        </div>
      </div>
    `;
  }).catch(err => {
    console.error("❌ Error loading section data:", err);
    alert("❌ Error loading section data. Please try again.");
    popup.style.display = "none";
  });
  
  return;
}
  
  // ✅ إضافة جديدة - المنطق العادي
  let enVal = "", arVal = "";
  if (oldValue) {
    if (oldValue.includes("|")) {
      [enVal, arVal] = oldValue.split("|").map(s => s.trim());
    } else {
      // تحقق إذا كانت القيمة عربية أم إنجليزية
      const isArabic = /[\u0600-\u06FF]/.test(oldValue);
      if (isArabic) {
        arVal = oldValue;
      } else {
        enVal = oldValue;
      }
    }
  }
  
  const title = t['add_new'] + " " + t['section'];
  
  popup.innerHTML = `
    <div class="popup-contentt">
      <h3>${title}</h3>
      <label>${t['section_name']} (English):</label>
      <input type="text" id="new-section-en" placeholder="${t['enter_section_name']} (English)" value="${enVal || ''}" />
      <label>${t['section_name']} (عربي):</label>
      <input type="text" id="new-section-ar" placeholder="${t['enter_section_name']} (عربي)" value="${arVal || ''}" />
      <input type="hidden" id="old-section-value" value="${oldValue || ''}" />
      <input type="hidden" id="generic-popup-target-id" value="section" />
      <div class="popup-buttons">
        <button onclick="saveNewSection()">${t['save']}</button>
        <button onclick="closeGenericPopup(true); event.stopPropagation()">${t['cancel']}</button>
      </div>
    </div>
  `;
  popup.style.display = "flex";
}

export function closeGenericPopup(cancelled = false) {
  if (cancelled) {
    const returnToSpec = sessionStorage.getItem("returnToPopup");
    const deviceType = document.getElementById("device-type")?.value?.toLowerCase();

    // ✅ إذا كنا راجعين من بوب أب المواصفات لنوع جهاز غير معروف
    if (returnToSpec === "true" && !["pc", "printer", "scanner", "desktop", "laptop", "كمبيوتر", "لابتوب"].includes(deviceType)) {
      sessionStorage.removeItem("returnToPopup");
      setTimeout(() => {
        openGenericPopup("device_specifications", "device-spec");
      }, 100);
    } else {
      sessionStorage.removeItem("returnToPopup");
      document.getElementById("generic-popup").style.display = "none";
    }
    return;
  }

  const popup = document.getElementById("generic-popup");
  popup.style.display = "none";

  const returnToSpec = sessionStorage.getItem("returnToPopup");
  const popupContext = sessionStorage.getItem("popupContext");
  const deviceType = document.getElementById("device-type")?.value?.toLowerCase();
  const lastDropdownId = sessionStorage.getItem("lastDropdownOpened");
  const deviceSpecValue = document.getElementById("device-spec")?.value;

  const fieldsToPreserve = ["spec-ministry", "spec-name", "spec-serial", "spec-model", "spec-department"];
  fieldsToPreserve.forEach(id => {
    const el = document.getElementById(id);
    if (el) sessionStorage.setItem(id, el.value);
  });

  if (lastDropdownId) {
    const select = document.getElementById(lastDropdownId);
    if (select && ["add-new", "add-new-model", "add-new-department", "add-custom"].includes(select.value)) {
      const firstOption = select.querySelector('option[disabled][selected]');
      if (firstOption) {
        firstOption.selected = true;
      } else {
        select.selectedIndex = 0;
      }
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }
    sessionStorage.removeItem("lastDropdownOpened");
  }

  // ✅ فقط إذا كان من سياق المواصفات وبعد الحفظ، نرجع
  if (
    popupContext === "device-spec" &&
    returnToSpec === "true" &&
    !cancelled &&
    (!deviceSpecValue || deviceSpecValue === "add-custom") &&
    !["pc", "printer", "scanner", "desktop", "laptop", "كمبيوتر", "لابتوب"].includes(deviceType) &&
    lastDropdownId !== "section" &&
    !sessionStorage.getItem("spec-saved")
  ) {
    setTimeout(() => {
      openGenericPopup("device_specifications", "device-spec");

      setTimeout(() => {
        fieldsToPreserve.forEach(id => {
          const el = document.getElementById(id);
          const val = sessionStorage.getItem(id);
          if (el && val) {
            el.value = val;
            sessionStorage.removeItem(id);
          }
        });

        const dept = sessionStorage.getItem("spec-department");
        if (dept) {
          const deptSelect = document.getElementById("spec-department");
          if (deptSelect) {
            deptSelect.value = dept;
            deptSelect.dispatchEvent(new Event("change", { bubbles: true }));
            sessionStorage.removeItem("spec-department");
          }
        }

        const model = sessionStorage.getItem("spec-model");
        if (model) {
          const modelSelect = document.getElementById("spec-model");
          if (modelSelect) {
            modelSelect.value = model;
            modelSelect.dispatchEvent(new Event("change", { bubbles: true }));
            sessionStorage.removeItem("spec-model");
          }
        }
      }, 150);
    }, 100);
    return;
  }

  // 🧹 تنظيف بعد الإغلاق
  sessionStorage.removeItem("returnToPopup");
  sessionStorage.removeItem("popupContext");

  ["spec-ministry", "spec-name", "spec-serial", "spec-model", "spec-department", "lastAddedModel"]
    .forEach(k => sessionStorage.removeItem(k));
}
window.closeGenericPopup = closeGenericPopup;

export function openAddOptionPopup(targetId) {
  const t = languageManager.translations[languageManager.currentLang];

  const labelMap = {
    "ram-select": t['ram'],
    "cpu-select": t['cpu'],
    "os-select": t['operating_system'],
    "drive-select": t['hard_drive'],
    "ram-size-select": t['ram_size'],
    "generation-select": t['processor_generation'],
    "printer-type": t['printer_type'],
    "ink-type": t['ink_type'],
    "scanner-type": t['scanner_type']
  };

  const label = labelMap[targetId] || t['new_value'];

  const popup = document.getElementById("generic-popup");
  popup.innerHTML = `
    <div class="popup-contentt">
      <h3>${t['add_new']} ${label}</h3>
      <label for="generic-popup-input">${label} ${t['name'] || t['new_value']}:</label>
      <input type="text" id="generic-popup-input" placeholder="${t['enter_new_value']}" />
      <input type="hidden" id="generic-popup-target-id" value="${targetId}" />
      <div class="popup-buttons">
        <button onclick="saveOptionForSelect()">${t['save']}</button>
        <button onclick="closeGenericPopup()">${t['cancel']}</button>
      </div>
    </div>
  `;
  popup.style.display = "flex";
}

export function saveOptionForSelect() {
  const t = languageManager.translations[languageManager.currentLang];

  const rawValue = document.getElementById("generic-popup-input").value.trim();
  const targetId = document.getElementById("generic-popup-target-id").value;
  const dropdown = document.getElementById(targetId);

  if (!rawValue || !dropdown) return;

  // ✅ لا نضيف تاجات لغة - نحفظ القيمة كما هي
  const value = rawValue;

  fetch("http://localhost:4000/add-options-regular", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({ target: targetId, value })
  })
    .then(res => res.json())
    .then(result => {
      if (result.error) {
        alert(t[result.error] || result.error);
      } else {
        switch (targetId) {
          case "os-select": device.fetchOS(); break;
          case "ram-select": device.fetchRAM(); break;
          case "drive-select": device.fetchDrives(); break;
          case "cpu-select": device.fetchCPU(); break;
          case "generation-select": device.fetchProcessorGen(); break;
          case "ram-size-select":device.fetchRAMSize(); break;
          case "printer-type": device.fetchPrinterTypes(); break;
          case "ink-type": device.fetchInkTypes(); break;
          case "scanner-type":device.fetchScannerTypes(); break;
        }

        sessionStorage.setItem(targetId, rawValue); // ✅ حفظ القيمة بدون الوسم
        closeGenericPopup();
      }
    })
    .catch(err => {
      console.error("❌ Error saving new option:", err);
      alert(t['failed_to_save'] || "Failed to save");
    });
}
window.saveOptionForSelect = saveOptionForSelect;
export function openPopup(selectId, title) {
  const select = document.getElementById(selectId);
  const selectedOption = select.options[select.selectedIndex];

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

  const saveBtn = document.getElementById("popup-save-btn");
  saveBtn.onclick = () => {
    const newValue = document.getElementById("popup-input").value.trim();
    if (newValue) {
      selectedOption.text = newValue;
    }
    closePopup();
  };

  document.getElementById("popup-modal").style.display = "flex";
}

export function closePopup() {
  document.getElementById("popup-modal").style.display = "none";
} 
window.closePopup = closePopup;

// ✅ تحديث الحقول إلى custom dropdown
export function updatePopupHeadingAndFields(type) {
  popupFieldsContainer.innerHTML = "";
  const typeCleaned = type.trim().toLowerCase();
  const lang = languageManager.currentLang;
  const t = languageManager.translations[lang];

  if (["pc", "printer", "scanner", "desktop", "laptop", "كمبيوتر", "لابتوب"].includes(typeCleaned)) {
    let fieldsHtml = `<div class="form-grid">`;

    fieldsHtml += `
      <div class="form-field">
        <label>${labelWithStar(t['device_name'], true)}</label>
        <input type="text" name="device-name" required>
      </div>

      <div class="form-field">
        <label>${labelWithStar(t['serial_number'], true)}</label>
        <input type="text" name="serial" required>
      </div>

      <div class="form-field">
        <label>${labelWithStar(t['ministry_number'], true)}</label>
        <input type="text" name="ministry-id" required>
      </div>
    `;

    if (["pc", "desktop", "laptop", "كمبيوتر", "لابتوب"].includes(typeCleaned)) {
      fieldsHtml += `
        <div class="form-field">
          <label>${labelWithStar(t['mac_address'], true)}</label>
          <input type="text" name="mac-address" required>
        </div>
        <div class="form-field">
          <label>${t['ip_address']}</label>
          <input type="text" name="ip-address" required>
        </div>
      `;
    }

    if (typeCleaned === "printer") {
      fieldsHtml += `
        <div class="form-field">
          <label>${t['ink_serial_number']}:</label>
          <input type="text" name="ink-serial-number">
        </div>

        <div class="form-field">
          <label>${t['ink_type']}:</label>
          <div class="custom-dropdown-wrapper">
            <div class="custom-dropdown">
              <div class="dropdown-toggle" onclick="toggleDropdown(this)">
                <span id="selected-ink-type">${t['select_ink_type']}</span>
                <span>▼</span>
              </div>
              <div class="dropdown-content">
                <input type="text" class="dropdown-search" placeholder="${t['search_ink_type']}" oninput="filterDropdown(this, 'ink-type-options')">
                <div class="dropdown-options" id="ink-type-options"></div>
              </div>
            </div>
          </div>
          <input type="hidden" id="ink-type" name="ink-type">
        </div>

        <div class="form-field">
          <label>${t['printer_type']}:</label>
          <div class="custom-dropdown-wrapper">
            <div class="custom-dropdown">
              <div class="dropdown-toggle" onclick="toggleDropdown(this)">
                <span id="selected-printer-type">${t['select_printer_type']}</span>
                <span>▼</span>
              </div>
              <div class="dropdown-content">
                <input type="text" class="dropdown-search" placeholder="${t['search_printer_type']}" oninput="filterDropdown(this, 'printer-type-options')">
                <div class="dropdown-options" id="printer-type-options"></div>
              </div>
            </div>
          </div>
          <input type="hidden" id="printer-type" name="printer-type">
        </div>
      `;
    }

    fieldsHtml += `
      <div class="form-field">
        <label>${labelWithStar(t['department'], true)}</label>
        <div class="custom-dropdown-wrapper">
          <div class="custom-dropdown">
            <div class="dropdown-toggle" onclick="toggleDropdown(this)">
              <span id="selected-department-${typeCleaned}">${t['select_department']}</span>
              <span>▼</span>
            </div>
            <div class="dropdown-content">
              <input type="text" class="dropdown-search" placeholder="${t['search_department']}" oninput="filterDropdown(this, 'department-${typeCleaned}-options')">
              <div class="dropdown-options" id="department-${typeCleaned}-options"></div>
            </div>
          </div>
        </div>
        <input type="hidden" id="department-${typeCleaned}" name="department" required>
      </div>
    `;

    if (typeCleaned === "scanner") {
      fieldsHtml += `
        <div class="form-field">
          <label>${labelWithStar(t['scanner_type'], true)}</label>
          <div class="custom-dropdown-wrapper">
            <div class="custom-dropdown">
              <div class="dropdown-toggle" onclick="toggleDropdown(this)">
                <span id="selected-scanner-type">${t['select_scanner_type']}</span>
                <span>▼</span>
              </div>
              <div class="dropdown-content">
                <input type="text" class="dropdown-search" placeholder="${t['search_scanner_type']}" oninput="filterDropdown(this, 'scanner-type-options')">
                <div class="dropdown-options" id="scanner-type-options"></div>
              </div>
            </div>
          </div>
          <input type="hidden" id="scanner-type" name="scanner-type">
        </div>
      `;
    }

    if (["pc", "desktop", "laptop", "كمبيوتر", "لابتوب"].includes(typeCleaned)) {
      fieldsHtml += `
        <div class="form-field">
          <label>${labelWithStar(t['processor_generation'], true)}</label>
          <div class="custom-dropdown-wrapper">
            <div class="custom-dropdown">
              <div class="dropdown-toggle" onclick="toggleDropdown(this)">
                <span id="selected-generation-select">${t['select_generation']}</span>
                <span>▼</span>
              </div>
              <div class="dropdown-content">
                <input type="text" class="dropdown-search" placeholder="${t['search_generation']}" oninput="filterDropdown(this, 'generation-select-options')">
                <div class="dropdown-options" id="generation-select-options"></div>
              </div>
            </div>
          </div>
          <input type="hidden" id="generation-select" name="generation" required>
        </div>

        <div class="form-field">
          <label>${labelWithStar(t['processor'], true)}</label>
          <div class="custom-dropdown-wrapper">
            <div class="custom-dropdown">
              <div class="dropdown-toggle" onclick="toggleDropdown(this)">
                <span id="selected-cpu-select">${t['select_processor']}</span>
                <span>▼</span>
              </div>
              <div class="dropdown-content">
                <input type="text" class="dropdown-search" placeholder="${t['search_processor']}" oninput="filterDropdown(this, 'cpu-select-options')">
                <div class="dropdown-options" id="cpu-select-options"></div>
              </div>
            </div>
          </div>
          <input type="hidden" id="cpu-select" name="processor" required>
        </div>

        <div class="form-field">
          <label>${labelWithStar(t['ram'], true)}</label>
          <div class="custom-dropdown-wrapper">
            <div class="custom-dropdown">
              <div class="dropdown-toggle" onclick="toggleDropdown(this)">
                <span id="selected-ram-select">${t['select_ram']}</span>
                <span>▼</span>
              </div>
              <div class="dropdown-content">
                <input type="text" class="dropdown-search" placeholder="${t['search_ram']}" oninput="filterDropdown(this, 'ram-select-options')">
                <div class="dropdown-options" id="ram-select-options"></div>
              </div>
            </div>
          </div>
          <input type="hidden" id="ram-select" name="ram" required>
        </div>

        <div class="form-field">
          <label>${labelWithStar(t['hard_drive'], true)}</label>
          <div class="custom-dropdown-wrapper">
            <div class="custom-dropdown">
              <div class="dropdown-toggle" onclick="toggleDropdown(this)">
                <span id="selected-drive-select">${t['select_hard_drive']}</span>
                <span>▼</span>
              </div>
              <div class="dropdown-content">
                <input type="text" class="dropdown-search" placeholder="${t['search_drive']}" oninput="filterDropdown(this, 'drive-select-options')">
                <div class="dropdown-options" id="drive-select-options"></div>
              </div>
            </div>
          </div>
          <input type="hidden" id="drive-select" name="drive" required>
        </div>
      `;
    }

    fieldsHtml += `
      <div class="form-field">
        <label>${labelWithStar(t['model'], true)}</label>
        <div class="custom-dropdown-wrapper">
          <div class="custom-dropdown">
            <div class="dropdown-toggle" onclick="toggleDropdown(this)">
              <span id="selected-model-${typeCleaned}">${t['select_model']}</span>
              <span>▼</span>
            </div>
            <div class="dropdown-content">
              <input type="text" class="dropdown-search" placeholder="${t['search_model']}" oninput="filterDropdown(this, 'model-${typeCleaned}-options')">
              <div class="dropdown-options" id="model-${typeCleaned}-options"></div>
            </div>
          </div>
        </div>
        <input type="hidden" id="model-${typeCleaned}" name="model" required>
      </div>
    `;

    if (["pc", "desktop", "laptop", "كمبيوتر", "لابتوب"].includes(typeCleaned)) {
      fieldsHtml += `
        <div class="form-field">
          <label>${labelWithStar(t['operating_system'], true)}</label>
          <div class="custom-dropdown-wrapper">
            <div class="custom-dropdown">
              <div class="dropdown-toggle" onclick="toggleDropdown(this)">
                <span id="selected-os-select">${t['select_os']}</span>
                <span>▼</span>
              </div>
              <div class="dropdown-content">
                <input type="text" class="dropdown-search" placeholder="${t['search_os']}" oninput="filterDropdown(this, 'os-select-options')">
                <div class="dropdown-options" id="os-select-options"></div>
              </div>
            </div>
          </div>
          <input type="hidden" id="os-select" name="os" required>
        </div>

        <div class="form-field">
          <label>${labelWithStar(t['ram_size'], true)}</label>
          <div class="custom-dropdown-wrapper">
            <div class="custom-dropdown">
              <div class="dropdown-toggle" onclick="toggleDropdown(this)">
                <span id="selected-ram-size-select">${t['select_ram_size']}</span>
                <span>▼</span>
              </div>
              <div class="dropdown-content">
                <input type="text" class="dropdown-search" placeholder="${t['search_ram_size']}" oninput="filterDropdown(this, 'ram-size-select-options')">
                <div class="dropdown-options" id="ram-size-select-options"></div>
              </div>
            </div>
          </div>
          <input type="hidden" id="ram-size-select" name="ram_size" required>
        </div>
      `;
    }

    fieldsHtml += `</div>`;

    popupHeading.textContent = `${t['enter_device_specifications']}`;
    popupFieldsContainer.innerHTML = fieldsHtml;

   device.fetchDepartments(`department-${typeCleaned}`);
   device.fetchAndRenderModels(typeCleaned, `model-${typeCleaned}`);
    if (["pc", "desktop", "laptop", "كمبيوتر", "لابتوب"].includes(typeCleaned)) {
     device.fetchCPU();
      device.fetchRAM();
      device.fetchOS();
      device.fetchProcessorGen();
      device.fetchDrives();
      device.fetchRAMSize();
    }
    if (typeCleaned === "printer") {
      device.fetchPrinterTypes();
      device.fetchInkTypes();
    }
    if (typeCleaned === "scanner") {
      device.fetchScannerTypes();
    }
  }
} 
window.updatePopupHeadingAndFields = updatePopupHeadingAndFields;
// حفظ مواصفات جهاز PC أو مشابه
export function savePCSpec() {
  const data = new FormData(popupForm);
  const deviceData = {};
  let hasError = false;

  // 🧼 نظف الأخطاء القديمة
  popupForm.querySelectorAll("input").forEach(input => {
    input.classList.remove("input-error");
    const errorMsg = input.nextElementSibling;
    if (errorMsg && errorMsg.classList.contains("input-error-message")) {
      errorMsg.remove();
    }

    if (input.type === "hidden") {
      const visible = input.closest(".form-field")?.querySelector(".dropdown-toggle");
      if (visible) {
        visible.style.border = "";
        visible.style.borderRadius = "";
        const msg = visible.parentElement.nextElementSibling;
        if (msg && msg.classList.contains("input-error-message")) {
          msg.remove();
        }
      }
    }
  });

  data.forEach((value, key) => {
    const raw = value.trim();
    const cleanValue = raw.replace(/\s*\[(ar|en)\]$/i, ""); // ✅ حذف التاج
    deviceData[key] = cleanValue;

    const input = popupForm.querySelector(`[name="${key}"]`);

    if (input?.hasAttribute("required") && !value.trim()) {
      const msg = document.createElement("div");
      msg.className = "input-error-message";
      msg.textContent = "This field is required.";

      if (input.type !== "hidden") {
        input.classList.add("input-error");
        input.after(msg);
      } else {
        const visible = input.closest(".form-field")?.querySelector(".dropdown-toggle");
        if (visible) {
          visible.style.border = "1px solid red";
          visible.style.borderRadius = "4px";
          // ✅ تأكد ما في رسالة مكررة
          const existingMsg = visible.parentElement.nextElementSibling;
          if (!existingMsg || !existingMsg.classList.contains("input-error-message")) {
            visible.parentElement.insertAdjacentElement("afterend", msg);
          }
        }
      }

      hasError = true;
    }
  });

  if (hasError) return;

  const deviceType = document.getElementById("device-type").value.toLowerCase();

  if (!["pc", "desktop", "laptop", "كمبيوتر", "لابتوب"].includes(deviceType)) {
    delete deviceData["mac-address"];
    delete deviceData["ip-address"];
  }
  // ✅ اجلب اسم القسم الصحيح من sessionStorage
  // اجلب الـ fullName المحفوظ كاملاً من sessionStorage:
  const departmentFullName = sessionStorage.getItem("department-full") || "";
  deviceData.department = departmentFullName;

  console.log("📦 البيانات المرسلة:", deviceData);

  fetch(`http://localhost:4000/AddDevice/${deviceType}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem('token')}` },
    body: JSON.stringify(deviceData)
  })
    .then(res => res.json())
    .then(result => {
      if (result.error) {
        if (result.error === "already_exists") {
          const input = popupForm.querySelector(`[name="${result.field}"]`);
          const msg = document.createElement("div");
          msg.className = "input-error-message";
          msg.textContent = result.message;

          if (input) {
            if (input.type !== "hidden") {
              input.classList.add("input-error");
              input.after(msg);
            } else {
              const visible = input.closest(".form-field")?.querySelector(".dropdown-toggle");
              if (visible) {
                visible.style.border = "1px solid red";
                visible.style.borderRadius = "4px";
                const existingMsg = visible.parentElement.nextElementSibling;
                if (!existingMsg || !existingMsg.classList.contains("input-error-message")) {
                  visible.parentElement.insertAdjacentElement("afterend", msg);
                }
              }
            }
          }
        } else {
          // ✅ هنا نعرض رسالة السيرفر تحت الحقل الصحيح

          // تحديد الحقل المناسب حسب نوع الخطأ
          if (result.error.includes("IP")) {
            const ipInput = popupForm.querySelector('[name="ip-address"]');
            if (ipInput) {
              ipInput.classList.add("input-error");

              // إزالة أي رسالة موجودة مسبقًا
              const oldMsg = ipInput.nextElementSibling;
              if (!oldMsg || !oldMsg.classList.contains("input-error-message")) {
                const msg = document.createElement("div");
                msg.className = "input-error-message";
                msg.textContent = result.error;
                ipInput.insertAdjacentElement("afterend", msg);
              }
            }
          } else if (result.error.includes("MAC")) {
            const macInput = popupForm.querySelector('[name="mac-address"]');
            if (macInput) {
              macInput.classList.add("input-error");

              const oldMsg = macInput.nextElementSibling;
              if (!oldMsg || !oldMsg.classList.contains("input-error-message")) {
                const msg = document.createElement("div");
                msg.className = "input-error-message";
                msg.textContent = result.error;
                macInput.insertAdjacentElement("afterend", msg);
              }
            }
          } else {
            alert(result.error); // ← fallback
          }
        }
        return;
      }

      // ✅ تم الحفظ بنجاح
      const dropdown = document.getElementById("device-spec");
      const option = document.createElement("option");
      option.value = result.insertedId || deviceData.serial || deviceData["device-name"];
      option.textContent = `${deviceData["device-name"]} | ${deviceData.serial} | ${deviceData["ministry-id"]}`;
      dropdown.appendChild(option);
      dropdown.value = option.value;

      const displaySpan = document.getElementById("selected-device-spec");
      if (displaySpan) {
        displaySpan.textContent = option.textContent;
      }

      popup.style.display = "none";
      // أعد تحميل قائمة الأجهزة
      device.fetchDeviceSpecsByTypeAndDepartment();
      // بعد قليل، عيّن الجهاز الجديد تلقائيًا في الـ dropdown
      setTimeout(() => {
        const dropdown = document.getElementById("device-spec");
        if (dropdown) dropdown.value = option.value;
        const displaySpan = document.getElementById("selected-device-spec");
        if (displaySpan) displaySpan.textContent = option.textContent;
      }, 500); // 500ms كافية غالبًا بعد إعادة التحميل
    })
    .catch(err => {
      console.error("❌ خطأ أثناء الاتصال بالسيرفر:", err);
    });
} 
window.savePCSpec = savePCSpec;
// حفظ قسم جديد أو تعديله
export function saveNewSection() {
  const t = languageManager.translations[languageManager.currentLang];
  const en = document.getElementById("new-section-en").value.trim();
  const ar = document.getElementById("new-section-ar").value.trim();
  if (!en || !ar) {
    alert("❌ الرجاء إدخال اسم القسم بالإنجليزي والعربي.");
    return;
  }
  const combined = `${en}|${ar}`;
  
  // ✅ تحديد إذا كان تعديل أم إضافة جديدة
  const oldValue = document.getElementById("old-section-value")?.value;
  const isEdit = oldValue && oldValue.trim() !== "";
  
  if (isEdit) {
    // ✅ استخدام الدالة الجديدة للتعديل
    console.log(`🔄 Editing section from "${oldValue}" to "${combined}"`);
    editOptionWithFullName("section", oldValue, combined).then(success => {
      if (success) {
        // ✅ إعادة تحميل قائمة الأقسام
        const selectId = sessionStorage.getItem("lastDepartmentSelectId") || "section";
        device.fetchDepartments(selectId);
        
        // ✅ تنظيف وإغلاق
        sessionStorage.removeItem("lastDepartmentSelectId");
        sessionStorage.removeItem("returnToPopup");
        document.getElementById("generic-popup").style.display = "none";
      }
    });
    return;
  }
  
  // ✅ إضافة جديدة
  console.log(`➕ Adding new section: "${combined}"`);

  fetch("http://localhost:4000/add-department", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({ value: combined })
  })
    .then(res => res.json())
    .then(result => {
      if (result.error) {
        alert(result.error);
        return;
      }

      // ===== 1) إعادة تحميل قائمة الأقسام =====
      const selectId = sessionStorage.getItem("lastDepartmentSelectId") || "section";
     device.fetchDepartments(selectId);

      // ===== 2) خزن الجزء المناسب للعرض فقط =====
      //    صيغة combined = "EnglishText|ArabicText"
      const [enPart, arPart] = combined.split("|").map(s => s.trim());
      const toStore = (languageManager.currentLang === "ar" ? arPart : enPart) || enPart;
      sessionStorage.setItem(selectId, toStore);

      // 6) بعد قليل (على سبيل المثال 200ms) حدّد العنصر الظاهر والقيمة المخفية
      setTimeout(() => {
        const displaySpan = document.getElementById(`selected-${selectId}`);
        const hiddenInput = document.getElementById(selectId);
        if (displaySpan && hiddenInput) {
          if (languageManager.currentLang === "ar") {
            displaySpan.textContent = arPart;   // الجزء العربي الظاهر
          } else {
            displaySpan.textContent = enPart;   // الجزء الإنجليزي الظاهر
          }
          // نخزّن القيمة الكاملة (English|Arabic) في الحقل المخفي
          hiddenInput.value = combined;

          // نخزّن الجزء الإنجليزي في original-department لاستخدامه لاحقًا
          sessionStorage.setItem("original-department", enPart);
        }
      }, 200);

      // ===== 4) تنظيف مفاتيح sessionStorage المؤقتة =====
      sessionStorage.removeItem("lastDepartmentSelectId");
      sessionStorage.removeItem("returnToPopup");

      // ===== 5) فتح popup مواصفات الأجهزة (إن تطلب السياق) =====
      const deviceType = document.getElementById("device-type")?.value?.toLowerCase();
      const isSpecContext = ["spec-department", "department-pc", "department-printer", "department-scanner"].includes(selectId);

      if (isSpecContext && !["pc", "printer", "scanner", "desktop", "laptop", "كمبيوتر", "لابتوب"].includes(deviceType)) {
        const modelName = document.getElementById("spec-model")?.value;
        if (modelName) sessionStorage.setItem("spec-model", modelName);

        setTimeout(() => {
          openGenericPopup("Device Specification", "device-spec");
          setTimeout(() => {
            const deptSelect = document.getElementById("spec-department");
            if (deptSelect) {
              deptSelect.value = combined;
              deptSelect.dispatchEvent(new Event("change", { bubbles: true }));
            }
            const modelSelect = document.getElementById("spec-model");
            const savedModel = sessionStorage.getItem("spec-model");
            if (modelSelect && savedModel) {
              modelSelect.value = savedModel;
              modelSelect.dispatchEvent(new Event("change", { bubbles: true }));
              sessionStorage.removeItem("spec-model");
            }
          }, 150);
        }, 100);
      }

      // ===== 6) بعد إضافة القسم، أعد تحميل مواصفات الجهاز وافتح قائمة المواصفات =====
      setTimeout(() => {
       device.fetchDeviceSpecsByTypeAndDepartment()
          .then(() => {
            const displaySpanSpec = document.getElementById("selected-device-spec");
            const optionsContainerSpec = document.getElementById("device-spec-options");
            if (displaySpanSpec && optionsContainerSpec) {
              displaySpanSpec.classList.add("open");
              optionsContainerSpec.style.display = "block";
            }
          })
          .catch(err => {
            console.error("❌ خطأ عند تحميل مواصفات الأجهزة بعد إضافة القسم:", err);
          });
      }, 500);

      // ===== 7) أغلق popup إضافة القسم =====
      document.getElementById("generic-popup").style.display = "none";
    })
    .catch(err => {
  console.error("❌ Failed to save section:", err, err?.message, err?.stack);
      alert("❌ Error saving section");
    });
}
window.saveNewSection = saveNewSection; 

// حفظ موديل جديد
export function saveNewModel() {
  const deviceType = document.getElementById("device-type").value.trim().toLowerCase();
  const token = localStorage.getItem("token");
  const modelName = document.getElementById("new-model-name").value.trim();
  const t = languageManager.translations[languageManager.currentLang];
  
  if (!modelName) {
    alert("❌ Please enter a model name");
    return;
  }

  // ✅ لا نضيف تاجات لغة للموديلات - تظهر في كل اللغات
  const nameToSave = modelName;

  fetch("http://localhost:4000/add-device-model", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    },
    body: JSON.stringify({ model_name: nameToSave, device_type_name: deviceType })
  })
    .then(res => res.json())
    .then(result => {
      if (result.error) {
        alert(result.error);
        return;
      }

      sessionStorage.setItem(`model-${deviceType}`, modelName);
      device.fetchAndRenderModels(deviceType, `model-${deviceType}`);
      sessionStorage.setItem("spec-model", modelName);

      const isSpecContext = sessionStorage.getItem("returnToPopup") === "true";
      if (isSpecContext) {
       device. fetchAndRenderModels(deviceType, "spec-model");

        setTimeout(() => {
          const displaySpan = document.getElementById(`selected-spec-model`);
          const hiddenInput = document.getElementById(`spec-model`);
          if (displaySpan && hiddenInput) {
            displaySpan.textContent = modelName;
            hiddenInput.value = modelName;
          }
        }, 300);
      }

      document.getElementById("generic-popup").style.display = "none";
      sessionStorage.removeItem("returnToPopup");

      if (!["pc", "printer", "scanner"].includes(deviceType)) {
        setTimeout(() => {
          openGenericPopup("device_specifications", "device-spec");
        }, 150);
      }
    })
    .catch(err => {
      console.error("❌ Failed to save model:", err);
      alert(t['failed_to_save_model']);
    });
}
window.saveNewModel = saveNewModel; 


// ✅ دالة فتح بوب أب إضافة عنصر جديد
export function openAddNewOptionPopup(config) {
  const t = languageManager.translations[languageManager.currentLang];
  const popup = document.getElementById("generic-popup");

  popup.innerHTML = `
    <div class="popup-contentt">
      <h3>${t['add_new']} ${t[config.labelKey]}</h3>
      <label>${t[config.labelKey]} </label>
      <input type="text" id="new-option-input" placeholder="${t['enter']} ${t[config.labelKey]}..." />
      <div class="popup-buttons">
        <button onclick="saveNewOption('${config.id}', '${config.labelKey}')">${t['save']}</button>
        <button onclick="closeGenericPopup()">${t['cancel']}</button>
      </div>
    </div>
  `;
  popup.style.display = "flex";
}
window.openAddNewOptionPopup = openAddNewOptionPopup;
// ✅ دالة حفظ العنصر الجديد
export function saveNewOption(selectId, labelKey) {
  const t = languageManager.translations[languageManager.currentLang];
  const input = document.getElementById("new-option-input");
  const rawValue = input.value.trim();

  if (!rawValue) {
    alert(`❌ ${t['please_enter']} ${t[labelKey]}`);
    return;
  }

  // ✅ لا نضيف تاجات لغة - نحفظ القيمة كما هي
  const value = rawValue;

  fetch("http://localhost:4000/add-option-general", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + localStorage.getItem("token")
    },
    body: JSON.stringify({ target: selectId, value })
  })
    .then(async res => {
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP Error: ${res.status}`);
      }
      return res.json();
    })
    .then(result => {
      if (result.error) {
        alert(result.error);
      } else {
        closeGenericPopup();

        // ✅ تحديد ما يتم تحديثه بعد الإضافة
        switch (selectId) {
          case "floor":
            sessionStorage.setItem("floor", rawValue);
           device. fetchFloors();
            break;

          case "problem-status":
            const deviceType = document.getElementById("device-type")?.value?.toLowerCase();
            sessionStorage.setItem("problem-status", rawValue);
            fetchProblemStatus(deviceType);
            break;

          case "technical-status":
            sessionStorage.setItem("technical-status", rawValue);
            device.fetchTechnicalStatus();
            break;

          default:
            document.dispatchEvent(new Event("DOMContentLoaded"));
        }
      }
    })
    .catch(err => {
      console.error(`❌ Error adding new ${t[labelKey]}:`, err.message || err);
    });
}

window.saveNewOption = saveNewOption;

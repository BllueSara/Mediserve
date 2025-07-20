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

function isArabicText(text) {
  const arabicRegex = /[\u0600-\u06FF]/;
  return arabicRegex.test(text);
}



function fetchAndRenderModels(deviceType, dropdownId) {
  const cleanedType = deviceType.trim().toLowerCase();
  let endpoint = "";

  if (["pc", "laptop", "desktop", "كمبيوتر", "لابتوب"].includes(cleanedType)) {
    endpoint = "http://localhost:4000/PC_Model";
  } else if (cleanedType === "printer") {
    endpoint = "http://localhost:4000/Printer_Model";
  } else if (cleanedType === "scanner") {
    endpoint = "http://localhost:4000/Scanner_Model";
  } else {
    endpoint = `http://localhost:4000/models-by-type/${cleanedType}`;
  }

  renderDropdownOptions({
    endpoint,
    containerId: `${dropdownId}-options`,
    displayId: `selected-${dropdownId}`,
    inputId: dropdownId,
    labelKey: "model",
    itemKey: "model_name",
    storageKey: dropdownId,

    // ✅ إزالة التاجات من الموديلات - تظهر في كل اللغات
    transformData: (items) => {
      return items.map(item => {
        const cleanedName = item.model_name?.replace(/\s*\[(ar|en)\]$/, "").trim() || "";
        return {
          ...item,
          model_name: cleanedName
        };
      });
    },

    onAddNew: () => {
      sessionStorage.setItem("lastDropdownOpened", dropdownId);

      ["spec-ministry", "spec-name", "spec-serial", "spec-department"].forEach(id => {
        const el = document.getElementById(id);
        if (el) sessionStorage.setItem(id, el.value);
      });

      openAddModelPopup();
    },

    onEditOption: (oldVal) => {
      const newVal = prompt("Edit Model:", oldVal);
      if (newVal && newVal !== oldVal) {
        editOption(dropdownId, oldVal, newVal, cleanedType);
      }
    },

    onDeleteOption: (val) => {
      if (confirm(`Delete "${val}"?`)) {
        deleteOption(dropdownId, val, cleanedType);
      }
    },

    onSelectOption: () => {}
  });
}






// ✅ تحديث الحقول إلى custom dropdown
function updatePopupHeadingAndFields(type) {
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
<<<<<<< HEAD
          <label>${t['ip_address']}</label>
          <input type="text" name="ip-address">
=======
          <label>${labelWithStar(t['ip_address'], true)}</label>
          <input type="text" name="ip-address" required>
>>>>>>> dfa1ff18f501a113e159d8d77f54553e04171c45
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

    fetchDepartments(`department-${typeCleaned}`);
    fetchAndRenderModels(typeCleaned, `model-${typeCleaned}`);
    if (["pc", "desktop", "laptop", "كمبيوتر", "لابتوب"].includes(typeCleaned)) {
      fetchCPU();
      fetchRAM();
      fetchOS();
      fetchProcessorGen();
      fetchDrives();
      fetchRAMSize();
    }
    if (typeCleaned === "printer") {
      fetchPrinterTypes();
      fetchInkTypes();
    }
    if (typeCleaned === "scanner") {
      fetchScannerTypes();
    }
  }
}

function labelWithStar(labelText, isRequired = false) {
  return `${labelText}${isRequired ? '<span class="required-star">*</span>' : ''}`;
}


function closePopup() {
  popup.style.display = "none";
  popupForm.reset();
  deviceSpecSelect.value = "";

  // ✅ إعادة اختيار القوائم إلى الوضع الافتراضي (لو كان مختار + Add New)
  const modelSelect = document.getElementById("model-select");
  if (modelSelect && modelSelect.value === "add-new-model") {
    modelSelect.selectedIndex = 0;
  }
}

function savePCSpec() {
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
      setTimeout(() => {
        fetchDeviceSpecsByTypeAndDepartment();
      }, 100);
    })
    .catch(err => {
      console.error("❌ خطأ أثناء الاتصال بالسيرفر:", err);
    });
}

function createLangAwareTransform(field) {
  return (items) => {
    const currentLang = languageManager.currentLang;

    return items
      .filter(item => {
        const raw = item[field]?.trim() || "";
        const isArabic = raw.endsWith("[ar]");
        const isEnglish = raw.endsWith("[en]");
        const isUnlabeled = !isArabic && !isEnglish;

        return currentLang === "ar"
          ? isArabic || isUnlabeled
          : isEnglish || isUnlabeled;
      })
      .map(item => {
        const raw = item[field]?.trim() || "";
        const cleaned = raw.replace(/\s*\[(ar|en)\]$/, "");
        return {
          ...item,
          [field]: cleaned
        };
      });
  };
}

function fetchScannerTypes() {
  renderDropdownOptions({
    endpoint: "http://localhost:4000/Scanner_Types",
    containerId: "scanner-type-options",
    displayId: "selected-scanner-type",
    inputId: "scanner-type",
    labelKey: "scanner_type",
    itemKey: "scanner_type",
    storageKey: "scanner-type",
    // ✅ إزالة التاجات من أنواع الماسحات
    transformData: (items) => {
      return items.map(item => {
        const cleanedName = item.scanner_type?.replace(/\s*\[(ar|en)\]$/, "").trim() || "";
        return {
          ...item,
          scanner_type: cleanedName
        };
      });
    },

    onAddNew: () => {
      sessionStorage.setItem("lastDropdownOpened", "scanner-type");
      openAddOptionPopup("scanner-type");
    },
    onEditOption: (oldValue) => {
      openAddTechnicalPopup(oldValue);
    },
    onDeleteOption: (val) => {
      if (confirm(`Delete "${val}"?`)) {
        deleteOption("scanner-type", val);
      }
    }
  });
}


function fetchPrinterTypes() {
  renderDropdownOptions({
    endpoint: "http://localhost:4000/Printer_Types",
    containerId: "printer-type-options",
    displayId: "selected-printer-type",
    inputId: "printer-type",
    labelKey: "printer_type",
    itemKey: "printer_type",
    storageKey: "printer-type", 
    // ✅ إزالة التاجات من أنواع الطابعات
    transformData: (items) => {
      return items.map(item => {
        const cleanedName = item.printer_type?.replace(/\s*\[(ar|en)\]$/, "").trim() || "";
        return {
          ...item,
          printer_type: cleanedName
        };
      });
    },

    onAddNew: () => {
      sessionStorage.setItem("lastDropdownOpened", "printer-type");
      openAddOptionPopup("printer-type");
    },
    onEditOption: (oldValue) => {
      openAddTechnicalPopup(oldValue);
    },
    onDeleteOption: (val) => {
      if (confirm(`Delete "${val}"?`)) {
        deleteOption("printer-type", val);
      }
    }
  });
}

function fetchInkTypes() {
  renderDropdownOptions({
    endpoint: "http://localhost:4000/Ink_Types",
    containerId: "ink-type-options",
    displayId: "selected-ink-type",
    inputId: "ink-type",
    labelKey: "ink_type",
    itemKey: "ink_type",
    storageKey: "ink-type",
    // ✅ إزالة التاجات من أنواع الحبر
    transformData: (items) => {
      return items.map(item => {
        const cleanedName = item.ink_type?.replace(/\s*\[(ar|en)\]$/, "").trim() || "";
        return {
          ...item,
          ink_type: cleanedName
        };
      });
    },

    onAddNew: () => {
      sessionStorage.setItem("lastDropdownOpened", "ink-type");
      openAddOptionPopup("ink-type");
    },
    onEditOption: (oldValue) => {
      openAddTechnicalPopup(oldValue);
    },
    onDeleteOption: (val) => {
      if (confirm(`Delete "${val}"?`)) {
        deleteOption("ink-type", val);
      }
    }
  });
}

function fetchDepartments(selectId = "section") {
  const url = `http://localhost:4000/Departments`;

  renderDropdownOptions({
    endpoint: url,
    containerId: `${selectId}-options`,   // "section-options"
    displayId: `selected-${selectId}`,     // "selected-section"
    inputId: selectId,                     // هذا للوحة الدروب داون التفاعلي
    labelKey: "section",
    itemKey: "name",                       // الحقل المعروض في القائمة
    storageKey: selectId,

    transformData: (items) => {
      const currentLang = languageManager.currentLang; // "ar" أو "en"
console.log("currentLang:", currentLang);
      return items.map(item => {
const parts = (item.name || "").split("|");
        const enPart = parts[0].trim();
        const arPart = parts.length > 1 ? parts[1].trim() : "";

        // نختار القسم المعروض بناءً على اللغة:
        let displayName;
        if (currentLang === "ar") {
          displayName = arPart || enPart;
        } else {
          displayName = enPart;
        }
        displayName = displayName.replace(/\s*\[(ar|en)\]$/i, "").trim();

        return {
          id: item.id,
fullName: item.name.trim(),
          name: displayName
        };
      });
    },

    onAddNew: () => {
      sessionStorage.setItem("lastDepartmentSelectId", selectId);
      openAddSectionPopup();
    },

    onEditOption: (oldFullName) => {
      openAddSectionPopup(selectId, oldFullName);
    },

    onDeleteOption: (fullName) => {
      if (confirm(`هل تريد حذف هذا القسم؟`)) {
        deleteOption("section", fullName, "Department");
      }
    },

onSelectOption: (localizedValue, fullItem) => {
  // fullItem.fullName = "dwq|دوق" (ما خزّنناه من قاعدة البيانات)
  // لن نفصلها هنا (نحتفظ بها كاملة)، لأننا نريد إرسالها كلّها لاحقًا.

  // نحفظ الـ fullName كاملًا في sessionStorage
  sessionStorage.setItem("department-full", fullItem.fullName);

  // بعد ذلك نبيّن الجزء المختار ظاهريًا للمستخدم:
  document.getElementById(`selected-section`).textContent = localizedValue;

  // إذا كنت تريد إضافيًّا الحقل المخفي للقيمة المنظّفة:
  // (مثلاً للبحث في API حالياً)
  const parts = fullItem.fullName.split("|");
  const enPart = parts[0].trim().replace(/\s*\[en\]$/i, "").trim();
  const arPart = (parts[1] || "").trim().replace(/\s*\[ar\]$/i, "").trim();

  // نخزّن في الحقل المخفي #section القسم المنظَّف (عربي أو إنجليزي) لطلبات fetch
  const hiddenSection = document.getElementById("section");
  hiddenSection.value = arPart; 
  // أو: hiddenSection.value = (languageManager.currentLang === "ar" ? arPart : enPart);

  // وأخيرًا نستدعي جلب مواصفات الجهاز
  fetchDeviceSpecsByTypeAndDepartment();
}


  });
}




function saveNewSection() {
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
        fetchDepartments(selectId);
        
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
      fetchDepartments(selectId);

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
        fetchDeviceSpecsByTypeAndDepartment()
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
      console.error("❌ Failed to save section:", err);
      alert("❌ Error saving section");
    });
}


function saveNewModel() {
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
      fetchAndRenderModels(deviceType, `model-${deviceType}`);
      sessionStorage.setItem("spec-model", modelName);

      const isSpecContext = sessionStorage.getItem("returnToPopup") === "true";
      if (isSpecContext) {
        fetchAndRenderModels(deviceType, "spec-model");

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



function saveDeviceSpecification() {


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

        fetchDeviceSpecsByTypeAndDepartment();

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


function closeGenericPopup(cancelled = false) {
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



function openAddOptionPopup(targetId) {
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


function saveOptionForSelect() {
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
          case "os-select": fetchOS(); break;
          case "ram-select": fetchRAM(); break;
          case "drive-select": fetchDrives(); break;
          case "cpu-select": fetchCPU(); break;
          case "generation-select": fetchProcessorGen(); break;
          case "ram-size-select": fetchRAMSize(); break;
          case "printer-type": fetchPrinterTypes(); break;
          case "ink-type": fetchInkTypes(); break;
          case "scanner-type": fetchScannerTypes(); break;
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

async function fetchDeviceTypes() {
  const permissions = await checkUserPermissions();

  fetch("http://localhost:4000/TypeProplem", {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  }).then(res => res.json())
    .then(data => {
      const container = document.getElementById("device-type-options");
      const selectedDisplay = document.getElementById("selected-device-type");
      const hiddenInput = document.getElementById("device-type");

      container.innerHTML = "";

      const lang = languageManager.currentLang;
      const translations = languageManager.translations[lang];

      // زر الإضافة
      if (permissions.full_access || permissions.add_items) {
        const addNewRow = document.createElement("div");
        addNewRow.className = "dropdown-option-row add-new-option";
        addNewRow.innerHTML = `<div class="dropdown-option-text">+ ${translations['add_new']} ${translations['device_type']}</div>`;
        addNewRow.onclick = () => {
          sessionStorage.setItem("lastDropdownOpened", "device-type");
          const el = document.getElementById("device-type");
          if (el) sessionStorage.setItem("device-type", el.value);
          openGenericPopup("device_type", "device-type");
          closeAllDropdowns();
        };
        container.appendChild(addNewRow);
      }

      data.deviceTypes.forEach((item) => {
  const originalType = item.DeviceType?.trim() || "";
  const deviceType = originalType.toLowerCase();

  const isPCRelated = ["pc", "laptop", "desktop", "كمبيوتر", "لابتوب"].includes(deviceType);
  const allowedType =
    permissions.device_access === 'all' ||
    (permissions.device_access === 'pc' && isPCRelated) ||
    permissions.device_access === deviceType;

  if (!allowedType) return;

  // ✅ تحقق من الوسم
  const hasArTag = /\[ar\]$/i.test(originalType);
  const hasEnTag = /\[en\]$/i.test(originalType);
  const isUnlabeled = !hasArTag && !hasEnTag;

  const showThis =
    (hasArTag && lang === "ar") ||
    (hasEnTag && lang === "en") ||
    isUnlabeled;

  if (!showThis) return;


  // ✅ إزالة الوسم من العرض فقط
  const displayName = originalType.replace(/\s*\[(ar|en)\]$/i, "").trim();

  const row = document.createElement("div");
  row.className = "dropdown-option-row";

  const text = document.createElement("div");
  text.className = "dropdown-option-text";
  text.textContent = displayName;

  text.onclick = () => {
    selectedDisplay.textContent = displayName;
    hiddenInput.value = originalType;

    const specDisplay = document.getElementById("selected-device-spec");
    const specInput = document.getElementById("device-spec");
    if (specDisplay && specInput) {
      specDisplay.textContent = translations['select_specification'];
      specInput.value = "";
      cleanDropdownError(specInput);
    }

    cleanDropdownError(hiddenInput);
    closeAllDropdowns();

    const type = displayName.toLowerCase();
    const sectionDropdown = document.getElementById("section");
    const dept = sectionDropdown?.value;

    if (type && dept) fetchDeviceSpecsByTypeAndDepartment();
    if (type) fetchProblemStatus(type);
  };

  row.appendChild(text);
  container.appendChild(row);

  if (permissions.full_access || permissions.edit_items || permissions.delete_items) {
    const icons = document.createElement("div");
    icons.className = "dropdown-actions-icons";

    if (permissions.full_access || permissions.edit_items) {
      const editIcon = document.createElement("i");
      editIcon.className = "fas fa-edit";
      editIcon.title = translations['edit'];
      editIcon.onclick = (e) => {
        e.stopPropagation();
        const newVal = prompt(`${translations['edit']} ${translations['device_type']}:`, displayName);
        if (newVal && newVal.trim() !== displayName) {
          editOption("problem-type", originalType, newVal.trim());
        }
      };
      icons.appendChild(editIcon);
    }

    if (permissions.full_access || permissions.delete_items) {
      const deleteIcon = document.createElement("i");
      deleteIcon.className = "fas fa-trash";
      deleteIcon.title = translations['delete'];
      deleteIcon.onclick = (e) => {
        e.stopPropagation();
        if (confirm(`${translations['confirm_delete']} "${displayName}"?`)) {
          deleteOption("problem-type", originalType);
        }
      };
      icons.appendChild(deleteIcon);
    }

    row.appendChild(icons);
  }
});
      // ✅ خيار "كل الأجهزة" للمشرف
      if (data.role === 'admin') {
        const allRow = document.createElement("div");
        allRow.className = "dropdown-option-row";
        allRow.innerHTML = `<div class="dropdown-option-text">${translations['all_devices']}</div>`;
        allRow.onclick = () => {
          selectedDisplay.textContent = translations['all_devices'];
          hiddenInput.value = "all-devices";
          closeAllDropdowns();
          sessionStorage.removeItem("original-department");
          fetchDeviceSpecsByTypeAndDepartment(true);
        };
        container.appendChild(allRow);
      }

      // ✅ إعادة تعيين الجهاز المحفوظ
      const savedDeviceType = sessionStorage.getItem("device-type");
      if (savedDeviceType) {
        const display = savedDeviceType.replace(/\s*\[(ar|en)\]$/, "").trim();
        selectedDisplay.textContent = display;
        hiddenInput.value = savedDeviceType;
        sessionStorage.removeItem("device-type");
        fetchProblemStatus(display.toLowerCase());
      }
    })
    .catch(err => {
      console.error("❌ Failed to fetch device types:", err);
    });
}


function detectLangTag(text) {
  const hasArabic = /[\u0600-\u06FF]/.test(text);
  return hasArabic ? "ar" : "en";
}


function fetchTechnicalStatus(callback) {
  renderDropdownOptions({
    endpoint: "http://localhost:4000/Technical",
    containerId: "technical-status-options",
    displayId: "selected-technical-status",
    inputId: "technical-status",
    labelKey: "technical",
    itemKey: (item) => {
      // نعرض الجزء المناسب حسب اللغة
      const raw = item.Engineer_Name || item.name || "";
      const parts = raw.split("|").map(p => p.trim());
      const en = parts[0] || "";
      const ar = parts[1] || "";
      return languageManager.currentLang === "ar" ? (ar || en) : en;
    },
    storageKey: "technical",
    transformData: (items) => {
      window.lastTechnicalOptions = items; // ← حفظ القائمة كاملة
      const currentLang = languageManager.currentLang;
      return items.map(item => {
        const raw = item.Engineer_Name || item.name || "";
        const parts = raw.split("|").map(p => p.trim());
        const en = parts[0] || "";
        const ar = parts[1] || "";
        return {
          ...item,
          name: currentLang === "ar" ? (ar || en) : en,
          fullName: raw
        };
      });
    },
    onAddNew: () => {
      sessionStorage.setItem("lastDropdownOpened", "technical-status");
      openAddTechnicalPopup();
    },
    onEditOption: (oldVal) => {
      openAddTechnicalPopup(oldVal);
    },
    onDeleteOption: (val) => {
      if (confirm(`Delete "${val}"?`)) {
        deleteOption("technical-status", val);
      }
    },
    onSelectOption: () => {},
  });
  if (typeof callback === "function") callback();
}


function fetchDrives() {
  renderDropdownOptions({
    endpoint: "http://localhost:4000/Hard_Drive_Types",
    containerId: "drive-select-options",
    displayId: "selected-drive-select",
    inputId: "drive-select",
    labelKey: "hard_drive",
    itemKey: "drive_type",
    storageKey: "drive-select",
transformData: createLangAwareTransform("drive_type")
,
    onAddNew: () => {
      sessionStorage.setItem("lastDropdownOpened", "drive-select");
      openAddOptionPopup("drive-select");
    },
    onEditOption: (oldVal) => {
      const newVal = prompt("Edit Hard Drive:", oldVal);
      if (newVal) editOption("drive-select", oldVal, newVal);
    },
    onDeleteOption: (val) => {
      if (confirm(`Delete "${val}"?`)) deleteOption("drive-select", val);
    }
  });
}

function fetchCPU() {
  renderDropdownOptions({
    endpoint: "http://localhost:4000/CPU_Types",
    containerId: "cpu-select-options",
    displayId: "selected-cpu-select",
    inputId: "cpu-select",
    labelKey: "processor",
    itemKey: "cpu_name",
    transformData: createLangAwareTransform("cpu_name")
,
    onAddNew: () => {
      sessionStorage.setItem("lastDropdownOpened", "cpu-select");
      openAddOptionPopup("cpu-select");
    },
    onEditOption: (oldVal) => {
      const newVal = prompt("Edit CPU:", oldVal);
      if (newVal) editOption("cpu-select", oldVal, newVal);
    },
    onDeleteOption: (val) => {
      if (confirm(`Delete "${val}"?`)) deleteOption("cpu-select", val);
    }
  });
}

function fetchRAM() {
  renderDropdownOptions({
    endpoint: "http://localhost:4000/RAM_Types",
    containerId: "ram-select-options",
    displayId: "selected-ram-select",
    inputId: "ram-select",
    labelKey: "ram",
    itemKey: "ram_type",
    storageKey: "ram-select",
    transformData: createLangAwareTransform("ram_type")
,
    onAddNew: () => {
      sessionStorage.setItem("lastDropdownOpened", "ram-select");
      openAddOptionPopup("ram-select");
    },
    onEditOption: (oldVal) => {
      const newVal = prompt("Edit RAM Type:", oldVal);
      if (newVal) editOption("ram-select", oldVal, newVal);
    },
    onDeleteOption: (val) => {
      if (confirm(`Delete "${val}"?`)) deleteOption("ram-select", val);
    }
  });
}

function fetchOS() {
  renderDropdownOptions({
    endpoint: "http://localhost:4000/OS_Types",
    containerId: "os-select-options",
    displayId: "selected-os-select",
    inputId: "os-select",
    labelKey: "operating_system",
    itemKey: "os_name",
    storageKey: "os-select",
    transformData: createLangAwareTransform("os_name")
,
    onAddNew: () => {
      sessionStorage.setItem("lastDropdownOpened", "os-select");
      openAddOptionPopup("os-select");
    },
    onEditOption: (oldVal) => {
      const newVal = prompt("Edit OS:", oldVal);
      if (newVal) editOption("os-select", oldVal, newVal);
    },
    onDeleteOption: (val) => {
      if (confirm(`Delete "${val}"?`)) deleteOption("os-select", val);
    }
  });
}

function fetchProcessorGen() {
  renderDropdownOptions({
    endpoint: "http://localhost:4000/Processor_Generations",
    containerId: "generation-select-options",
    displayId: "selected-generation-select",
    inputId: "generation-select",
    labelKey: "processor_generation",
    itemKey: "generation_number",
    storageKey: "generation-select",
    transformData: createLangAwareTransform("generation_number"),

    onAddNew: () => {
      sessionStorage.setItem("lastDropdownOpened", "generation-select");
      openAddOptionPopup("generation-select");
    },
    onEditOption: (oldVal) => {
      const newVal = prompt("Edit Generation:", oldVal);
      if (newVal) editOption("generation-select", oldVal, newVal);
    },
    onDeleteOption: (val) => {
      if (confirm(`Delete "${val}"?`)) deleteOption("generation-select", val);
    }
  });
}
function fetchRAMSize() {
  renderDropdownOptions({
    endpoint: "http://localhost:4000/RAM_Sizes",
    containerId: "ram-size-select-options",
    displayId: "selected-ram-size-select",
    inputId: "ram-size-select",
    labelKey: "ram_size",
    itemKey: "ram_size",
    storageKey: "ram-size-select",
    transformData: createLangAwareTransform("ram_size"),

    onAddNew: () => {
      sessionStorage.setItem("lastDropdownOpened", "ram-size-select");
      openAddOptionPopup("ram-size-select");
    },
    onEditOption: (oldVal) => {
      const newVal = prompt("Edit RAM Size:", oldVal);
      if (newVal) editOption("ram-size-select", oldVal, newVal);
    },
    onDeleteOption: (val) => {
      if (confirm(`Delete "${val}"?`)) deleteOption("ram-size-select", val);
    }
  });
}


function openAddTechnicalPopup(oldValue = "") {
  const t = languageManager.translations[languageManager.currentLang];
  let enVal = "", arVal = "";
  if (oldValue && oldValue.includes("|")) {
    [enVal, arVal] = oldValue.split("|").map(s => s.trim());
  } else if (oldValue) {
    // إذا القيمة قديمة ولكن ليست مفصولة |
    const isArabic = /[\u0600-\u06FF]/.test(oldValue);
    if (isArabic) {
      arVal = oldValue;
    } else {
      enVal = oldValue;
    }
  }
  const popup = document.getElementById("generic-popup");
  popup.innerHTML = `
    <div class="popup-contentt">
      <h3>${t['add_new']} ${t['technical']}</h3>
      <label>${t['technical_name']} (English):</label>
      <input type="text" id="new-technical-en" placeholder="${t['technical_name']} (English)" value="${enVal || ''}" />
      <label>${t['technical_name']} (عربي):</label>
      <input type="text" id="new-technical-ar" placeholder="${t['technical_name']} (عربي)" value="${arVal || ''}" />
      <input type="hidden" id="old-technical-value" value="${oldValue || ''}" />
      <div class="popup-buttons">
        <button type="button" onclick="saveNewTechnical()">${t['save']}</button>
        <button type="button" onclick="closeGenericPopup()">${t['cancel']}</button>
      </div>
    </div>
  `;
  popup.style.display = "flex";
}

function saveNewTechnical() {
  const t = languageManager.translations[languageManager.currentLang];
  const en = document.getElementById("new-technical-en").value.trim();
  const ar = document.getElementById("new-technical-ar").value.trim();
  const oldValue = document.getElementById("old-technical-value")?.value.trim();
  if (!en || !ar) {
    alert("❌ الرجاء إدخال اسم المهندس بالإنجليزي والعربي.");
    return;
  }
  const rawName = `${en}|${ar}`;
  // إذا يوجد قيمة قديمة، أرسل تحديث
  if (oldValue) {
    // تحديث
    fetch("http://localhost:4000/update-option-complete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + localStorage.getItem("token")
      },
      body: JSON.stringify({
        target: "technical",
        oldValue: oldValue,
        newValue: rawName
      })
    })
      .then(res => res.json())
      .then(result => {
        if (result.error) {
          alert(result.error);
        } else {
          fetchTechnicalStatus(() => {
            const displaySpan = document.getElementById("selected-technical-status");
            const hiddenInput = document.getElementById("technical-status");
            const displayName = languageManager.currentLang === "ar" ? ar : en;
            if (displaySpan) displaySpan.textContent = displayName;
            if (hiddenInput) hiddenInput.value = displayName;
          });
          closeGenericPopup();
        }
      })
      .catch(err => {
        console.error("❌ Error updating engineer:", err);
        alert(t['failed_to_save'] || "Failed to update engineer");
      });
    return;
  }
  // إضافة جديدة
  fetch("http://localhost:4000/add-options-regular", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + localStorage.getItem("token")
    },
    body: JSON.stringify({
      target: "technical",
      value: rawName
    })
  })
    .then(res => res.status === 204 ? {} : res.json())
    .then(result => {
      if (result.error) {
        alert(result.error);
      } else {
        // ✅ بعد الإضافة، أظهر الجزء المناسب حسب اللغة
        const parts = rawName.split("|").map(p => p.trim());
        const en = parts[0] || "";
        const ar = parts[1] || "";
        const displayName = languageManager.currentLang === "ar" ? (ar || en) : en;
        fetchTechnicalStatus(() => {
          const displaySpan = document.getElementById("selected-technical-status");
          const hiddenInput = document.getElementById("technical-status");
          displaySpan.textContent = displayName;
          hiddenInput.value = displayName;
        });
        closeGenericPopup();
      }
    })
    .catch(err => {
      console.error("❌ Error saving engineer:", err);
      alert(t['failed_to_save'] || "Failed to save engineer");
    });
}

async function fetchProblemStatus(deviceType, onFinished) {
  const permissions = await checkUserPermissions();
  const t = languageManager.translations[languageManager.currentLang];

  const container = document.getElementById("problem-status-options");
  const displaySpan = document.getElementById("selected-problem-status");
  const hiddenInput = document.getElementById("problem-status");

  if (!container || !displaySpan || !hiddenInput) {
    console.error("❌ Elements missing for problem status");
    return;
  }

  container.innerHTML = "";

  const isAllDevices = deviceType?.toLowerCase() === "all" || deviceType?.toLowerCase() === "all-devices";

  if (!deviceType || deviceType === "add-custom") {
    const row = document.createElement("div");
    row.className = "dropdown-option-row";
    row.innerHTML = `<div class="dropdown-option-text">${t['select_device_type']}</div>`;
    container.appendChild(row);
    return;
  }

  if (!isAllDevices && (permissions.full_access || permissions.add_items)) {
    const addNewRow = document.createElement("div");
    addNewRow.className = "dropdown-option-row add-new-option";
    addNewRow.innerHTML = `<div class="dropdown-option-text">+ ${t['add_new']} ${t['problem_status']}</div>`;
    addNewRow.onclick = () => {
      sessionStorage.setItem("lastDropdownOpened", "problem-status");
      openAddProblemStatusPopup(deviceType);
      closeAllDropdowns();
    };
    container.appendChild(addNewRow);
  }

  try {
    const res = await fetch(`http://localhost:4000/problem-states/${encodeURIComponent(deviceType)}`);
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      const row = document.createElement("div");
      row.className = "dropdown-option-row";
      row.innerHTML = `<div class="dropdown-option-text">${t['no_problem_status_found']}</div>`;
      container.appendChild(row);
      return;
    }

    // ✅ متغير لتخزين المشاكل المختارة
    let selectedProblems = [];

    data.forEach(item => {
      const originalText = item.problem_text || item.problemStates_Maintance_device_name || "Unnamed Problem";
      
      // ✅ معالجة خاصة للمشاكل التي تحتوي على "|" (إنجليزي|عربي)
      let displayName = originalText;
      if (originalText.includes("|")) {
        const parts = originalText.split("|").map(s => s.trim());
        const currentLang = languageManager.currentLang;
        if (currentLang === "ar") {
          displayName = parts[1] || parts[0]; // الجزء العربي أو الإنجليزي كبديل
        } else {
          displayName = parts[0]; // الجزء الإنجليزي
        }
      } else {
        // ✅ للمشاكل العادية، استخدم الترجمة
        const translated = translateProblemText(deviceType, originalText);
        displayName = translated.replace(/\s*\[(ar|en)\]$/i, "").trim();
      }

      const value = originalText;

      const currentLang = languageManager.currentLang;
      const isTranslated = translateProblemText(deviceType, originalText) !== originalText;
      const isUserAddedArabic = !isTranslated && isArabicText(originalText);

      const hasArTag = /\[ar\]$/i.test(originalText);
      const hasEnTag = /\[en\]$/i.test(originalText);

      // ✅ فلترة حسب اللغة الحالية والوسم
      if (currentLang === "ar" && hasEnTag) return;
      if (currentLang === "en" && hasArTag) return;

      // ✅ إزالة الفلترة المفرطة للمشاكل العربية غير الموسومة
      // if (currentLang === "en" && !hasArTag && !hasEnTag && isUserAddedArabic) return;

      const row = document.createElement("div");
      row.className = "dropdown-option-row";

      const text = document.createElement("div");
      text.className = "dropdown-option-text";

      text.textContent = isAllDevices
        ? `${displayName} (${item.device_type || deviceType})`
        : displayName;

      // ✅ منطق الاختيار المتعدد - نفس general.js
      text.onclick = () => {
        const existingIndex = selectedProblems.findIndex(p => p.value === value);

        if (existingIndex === -1) {
          selectedProblems.push({ value, label: displayName });
          text.style.backgroundColor = "#d0f0fd";
        } else {
          selectedProblems.splice(existingIndex, 1);
          text.style.backgroundColor = "";
        }

        displaySpan.textContent = selectedProblems.map(p => p.label).join(", ");
        hiddenInput.value = JSON.stringify(selectedProblems.map(p => p.value));
        cleanDropdownError(hiddenInput);
      };

      row.appendChild(text);

      if (permissions.full_access || permissions.edit_items || permissions.delete_items) {
        const icons = document.createElement("div");
        icons.className = "dropdown-actions-icons";

        if (permissions.full_access || permissions.edit_items) {
          const editIcon = document.createElement("i");
          editIcon.className = "fas fa-edit";
          editIcon.title = t['edit'];
          editIcon.onclick = (e) => {
            e.stopPropagation();
            openAddProblemStatusPopup(deviceType, originalText);
          };
          icons.appendChild(editIcon);
        }

        if (permissions.full_access || permissions.delete_items) {
          const deleteIcon = document.createElement("i");
          deleteIcon.className = "fas fa-trash";
          deleteIcon.title = t['delete'];
          deleteIcon.onclick = (e) => {
            e.stopPropagation();
            if (confirm(`${t['confirm_delete']} "${displayName}"?`)) {
              deleteOption("problem-status", originalText, deviceType);
            }
          };
          icons.appendChild(deleteIcon);
        }

        row.appendChild(icons);
      }

      container.appendChild(row);
    });

    // ✅ Call callback after loading
    if (typeof onFinished === "function") onFinished();

  } catch (err) {
    console.error("❌ Failed to fetch problem statuses:", err);
    const row = document.createElement("div");
    row.className = "dropdown-option-row";
    row.innerHTML = `<div class="dropdown-option-text">${t['failed_to_load']}</div>`;
    container.appendChild(row);
  }
}







function openAddProblemStatusPopup(deviceType, oldValue = "") {
  const t = languageManager.translations[languageManager.currentLang];
  
  let enVal = "", arVal = "";
  if (oldValue && oldValue.includes("|")) {
    [enVal, arVal] = oldValue.split("|").map(s => s.trim());
  } else if (oldValue) {
    // إذا القيمة قديمة ولكن ليست مفصولة |
    const isArabic = /[\u0600-\u06FF]/.test(oldValue);
    if (isArabic) {
      arVal = oldValue;
    } else {
      enVal = oldValue;
    }
  }

  const popup = document.getElementById("generic-popup");
  const isEdit = oldValue && oldValue.trim() !== "";
  const title = isEdit ? `${t['edit']} ${t['problem_status']}` : `${t['add_new']} ${t['problem_status']}`;
  
  popup.innerHTML = `
    <div class="popup-content">
      <h3>${title}</h3>
      <label>${t['problem_status']} (English):</label>
      <input type="text" id="new-problem-status-en" placeholder="${t['problem_status']} (English)" value="${enVal || ''}" />
      <label>${t['problem_status']} (عربي):</label>
      <input type="text" id="new-problem-status-ar" placeholder="${t['problem_status']} (عربي)" value="${arVal || ''}" />
      <input type="hidden" id="old-problem-status-value" value="${oldValue || ''}" />
      <input type="hidden" id="problem-status-device-type" value="${deviceType}" />
      <div class="popup-buttons">
        <button type="button" onclick="saveNewProblemStatus()">${t['save']}</button>
        <button type="button" onclick="closeGenericPopup()">${t['cancel']}</button>
      </div>
    </div>
  `;
  popup.style.display = "flex";
}

function saveNewProblemStatus() {
  const t = languageManager.translations[languageManager.currentLang];
  const en = document.getElementById("new-problem-status-en").value.trim();
  const ar = document.getElementById("new-problem-status-ar").value.trim();
  const oldValue = document.getElementById("old-problem-status-value")?.value.trim();
  const deviceType = document.getElementById("problem-status-device-type")?.value;
  
  if (!en || !ar) {
    alert("❌ الرجاء إدخال المشكلة بالإنجليزي والعربي.");
    return;
  }
  
  const rawName = `${en}|${ar}`;
  
  // إذا يوجد قيمة قديمة، أرسل تحديث
  if (oldValue) {
    // تحديث
    fetch("http://localhost:4000/update-option-complete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + localStorage.getItem("token")
      },
      body: JSON.stringify({
        target: "problem-status",
        oldValue: oldValue,
        newValue: rawName,
        type: deviceType
      })
    })
      .then(res => res.json())
      .then(result => {
        if (result.error) {
          alert(result.error);
        } else {
          fetchProblemStatus(deviceType, () => {
            const displaySpan = document.getElementById("selected-problem-status");
            const hiddenInput = document.getElementById("problem-status");
            const displayName = languageManager.currentLang === "ar" ? ar : en;
            if (displaySpan) displaySpan.textContent = displayName;
            // ✅ للمشاكل المتعددة، نحتفظ بالقيم الموجودة ونضيف الجديدة
            if (hiddenInput) {
              let currentProblems = [];
              try {
                const currentValue = hiddenInput.value;
                if (currentValue) {
                  currentProblems = JSON.parse(currentValue);
                }
              } catch (e) {
                currentProblems = [];
              }
              
              // ✅ استبدال المشكلة القديمة بالجديدة
              const oldIndex = currentProblems.indexOf(oldValue);
              if (oldIndex !== -1) {
                currentProblems[oldIndex] = rawName;
              } else {
                // ✅ إذا لم نجد المشكلة القديمة، نضيف الجديدة
                currentProblems.push(rawName);
              }
              
              hiddenInput.value = JSON.stringify(currentProblems);
            }
          });
          closeGenericPopup();
        }
      })
      .catch(err => {
        console.error("❌ Error updating problem status:", err);
        alert(t['failed_to_save'] || "Failed to update problem status");
      });
    return;
  }
  
  // إضافة جديدة
  fetch("http://localhost:4000/add-options-regular", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + localStorage.getItem("token")
    },
    body: JSON.stringify({
      target: "problem-status",
      value: rawName,
      type: deviceType
    })
  })
    .then(res => res.status === 204 ? {} : res.json())
    .then(result => {
      if (result.error) {
        alert(result.error);
      } else {
        // ✅ بعد الإضافة، أظهر الجزء المناسب حسب اللغة
        const parts = rawName.split("|").map(p => p.trim());
        const en = parts[0] || "";
        const ar = parts[1] || "";
        const displayName = languageManager.currentLang === "ar" ? (ar || en) : en;
        
        fetchProblemStatus(deviceType, () => {
          const displaySpan = document.getElementById("selected-problem-status");
          const hiddenInput = document.getElementById("problem-status");
          displaySpan.textContent = displayName;
          // ✅ للمشاكل المتعددة، نحتفظ بالقيم الموجودة ونضيف الجديدة
          if (hiddenInput) {
            let currentProblems = [];
            try {
              const currentValue = hiddenInput.value;
              if (currentValue) {
                currentProblems = JSON.parse(currentValue);
              }
            } catch (e) {
              currentProblems = [];
            }
            
            // ✅ إضافة المشكلة الجديدة إذا لم تكن موجودة
            if (!currentProblems.includes(rawName)) {
              currentProblems.push(rawName);
            }
            
            hiddenInput.value = JSON.stringify(currentProblems);
          }
        });
        closeGenericPopup();
      }
    })
    .catch(err => {
      console.error("❌ Error saving problem status:", err);
      alert(t['failed_to_save'] || "Failed to save problem status");
    });
}




function toggleDropdown(toggleEl) {
  const content = toggleEl.nextElementSibling;
  const isOpen = content.style.display === "block";
  closeAllDropdowns();
  if (!isOpen) {
    content.style.display = "block";
    const input = content.querySelector(".dropdown-search");
    input.value = "";
    filterDropdown(input, content.querySelector(".dropdown-options").id);
  }
}

function filterDropdown(input, optionsContainerId) {
  const filter = input.value.toLowerCase();
  const rows = document.getElementById(optionsContainerId).querySelectorAll(".dropdown-option-row");

  rows.forEach(row => {
    const textEl = row.querySelector(".dropdown-option-text");
    if (!textEl) {
      row.style.display = "none"; // 🔥 إذا مافي نص، أخفِ العنصر
      return;
    }

    const text = textEl.textContent.toLowerCase();
    row.style.display = text.includes(filter) ? "flex" : "none";
  });
}

function closeAllDropdowns() {
  document.querySelectorAll(".dropdown-content").forEach(d => d.style.display = "none");
}

document.addEventListener(" ", () => {
  document.addEventListener("click", e => {
    if (!e.target.closest(".custom-dropdown-wrapper")) {
      closeAllDropdowns();
    }
  });
});

function fetchDevicesBySection() {
  const type = document.getElementById("device-type").value.toLowerCase();
  const department = sessionStorage.getItem("section");

  if (!type || !department) {
    alert("❌ تأكد من اختيار نوع الجهاز والقسم");
    return;
  }

  fetch(`http://localhost:4000/devices/${type}/${department}`)
    .then(res => res.json())
    .then(data => {
      const dropdown = document.getElementById("device-spec");
      dropdown.innerHTML = '<option disabled selected>Select specification</option>';


      data.forEach(device => {
        const option = document.createElement("option");
        option.value = device.Serial_Number;
        option.textContent = `${device.Serial_Number} | ${device[type === 'pc',"desktop", "laptop", "كمبيوتر", "لابتوب" ? 'Computer_Name' : type === 'printer' ? 'Printer_Name' : 'Scanner_Name']}`;
        dropdown.appendChild(option);
      });
    })
    .catch(err => console.error("❌ Error fetching device specs:", err));
}


async function fetchDeviceSpecsByTypeAndDepartment() {
  const type = document.getElementById("device-type")?.value?.toLowerCase();
  const full = sessionStorage.getItem("department-full"); // أو من الـ hidden input
  if (!type || !full) {
    console.warn("❌ النوع أو اسم القسم غير متوفر");
    return;
  }

  const [enPart, arPart] = full.split("|").map(s => s.trim());
  const deptNameToSend = languageManager.currentLang === "ar"
    ? (arPart || enPart)
    : (enPart || arPart);

  console.log("📤 القسم المرسل فعليًا حسب اللغة:", deptNameToSend);

  // … باقي الشيفرة تستدعي الـ fetch
  fetch(`http://localhost:4000/devices/${type}/${encodeURIComponent(deptNameToSend)}`)

  console.log("📤 القسم المرسل فعليًا حسب اللغة:", deptNameToSend);

  const optionsContainer = document.getElementById("device-spec-options");
  const displaySpan = document.getElementById("selected-device-spec");
  const hiddenInput = document.getElementById("device-spec");
  if (!optionsContainer || !displaySpan || !hiddenInput) return;

  const permissions = await checkUserPermissions();
  optionsContainer.innerHTML = "";

  const currentLang = languageManager.currentLang;
  const t = languageManager.translations[currentLang];

  // إضافة زر "Add New Specification" كما كان لديك
  const addNewRow = document.createElement("div");
  addNewRow.className = "dropdown-option-row add-new-option";
  addNewRow.innerHTML = `<div class="dropdown-option-text">+ ${t['add_new']} ${t['device_specifications']}</div>`;
  addNewRow.onclick = () => {
    sessionStorage.setItem("lastDropdownOpened", "device-spec");
    if (["pc", "printer", "scanner", "desktop", "laptop", "كمبيوتر", "لابتوب"].includes(type)) {
      updatePopupHeadingAndFields(type);
      popup.style.display = "flex";
    } else {
      openGenericPopup("device_specifications", "device-spec");
    }
    closeAllDropdowns();
  };
  optionsContainer.appendChild(addNewRow);

  if (type === "all-devices") {
    fetch(`http://localhost:4000/all-devices-specs`)
      .then(res => res.json())
      .then(data => {
        data.forEach(device => {
          const text = `${device.device_name} | ${device.Serial_Number} | ${device.Governmental_Number} (${device.device_type})`;
          const row = document.createElement("div");
          row.className = "dropdown-option-row";
          const optionText = document.createElement("div");
          optionText.className = "dropdown-option-text";
          optionText.textContent = text;
          optionText.onclick = () => {
            displaySpan.textContent = text;
            hiddenInput.value = device.id;
            cleanDropdownError(hiddenInput);
            closeAllDropdowns();
          };
          row.appendChild(optionText);
          optionsContainer.appendChild(row);
        });
      })
      .catch(err => console.error("❌ Error fetching all device specs:", err));
    return;
  }

  fetch(`http://localhost:4000/devices/${type}/${encodeURIComponent(deptNameToSend)}`)
    .then(res => res.json())
    .then(data => {
      if (!Array.isArray(data) || data.length === 0) {
        const noData = document.createElement("div");
        noData.className = "dropdown-option-row";
        noData.innerHTML = `<div class="dropdown-option-text">${t['no_data_found'] || 'No specifications found'}</div>`;
        optionsContainer.appendChild(noData);
        return;
      }

      data.forEach(device => {
        const text = `${device.device_name} | ${device.Serial_Number} | ${device.Governmental_Number}`;
        const row = document.createElement("div");
        row.className = "dropdown-option-row";

        const optionText = document.createElement("div");
        optionText.className = "dropdown-option-text";
        optionText.textContent = text;
        optionText.onclick = () => {
          displaySpan.textContent = text;
          hiddenInput.value = device.id;
          cleanDropdownError(hiddenInput);
          closeAllDropdowns();
        };

        row.appendChild(optionText);

        if (permissions.full_access || permissions.edit_items || permissions.delete_items) {
          const icons = document.createElement("div");
          icons.className = "dropdown-actions-icons";

          if (permissions.full_access || permissions.edit_items) {
            const editIcon = document.createElement("i");
            editIcon.className = "fas fa-edit";
            editIcon.title = t['edit'];
            editIcon.onclick = async (e) => {
              e.stopPropagation();
              const deviceId = device.id;
              if (!deviceId) {
                console.error("❌ device.id is undefined!");
                return;
              }
              try {
                const res = await fetch(`http://localhost:4000/device-spec/${deviceId}`, {
                  headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                  }
                });
                const fullDeviceData = await res.json();
                console.log("✅ Full device data loaded:", fullDeviceData);

                const deviceType = fullDeviceData.Device_Type || "pc";
                const typeCleaned = deviceType.trim().toLowerCase();
                let mappedType = "other";
                if (["pc", "desktop", "laptop", "كمبيوتر", "لابتوب"].includes(typeCleaned)) {
                  mappedType = "pc";
                } else if (typeCleaned === "printer") {
                  mappedType = "printer";
                } else if (typeCleaned === "scanner") {
                  mappedType = "scanner";
                }

                if (["pc", "printer", "scanner"].includes(mappedType)) {
                  openDeviceEditPopup(mappedType, fullDeviceData);
                } else {
                  openGenericEditPopup(fullDeviceData);
                }
              } catch (err) {
                console.error("❌ Failed to fetch full device data:", err);
                alert("❌ Could not load full device data for editing.");
              }
            };
            icons.appendChild(editIcon);
          }

          if (permissions.full_access || permissions.delete_items) {
            const deleteIcon = document.createElement("i");
            deleteIcon.className = "fas fa-trash";
            deleteIcon.title = t['delete'];
            deleteIcon.onclick = async (e) => {
              e.stopPropagation();
              if (confirm(`${t['confirm_delete']} "${device.name}"?`)) {
                const success = await deleteOption("device-spec", { id: device.id });
                if (success) {
                  fetchDeviceSpecsByTypeAndDepartment();
                }
              }
            };
            icons.appendChild(deleteIcon);
          }

          row.appendChild(icons);
        }

        optionsContainer.appendChild(row);
      });

      // استرجاع القيمة المحفوظة إن وجدت
      const saved = sessionStorage.getItem("device-spec");
      if (saved) {
        const match = data.find(d => d.id === saved);
        if (match) {
          const label = `${match.name} | ${match.Serial_Number} | ${match.Governmental_Number}`;
          displaySpan.textContent = label;
          hiddenInput.value = saved;
          sessionStorage.removeItem("device-spec");
        }
      }
    })
    .catch(err => console.error("❌ Error fetching specs:", err));
}



function openDeviceEditPopup(type, deviceData) {
  const lang = languageManager.currentLang;
  const t = languageManager.translations[lang];

  const popup = document.getElementById("popup-modal");
  const fieldsContainer = document.getElementById("popup-fields");

  // إظهار النافذة
const popupTitle = document.getElementById("popup-title");
popup.style.display = "flex";
popupTitle.textContent = t['edit'] + " " + t['device_specifications']; // ✅ هذا صحيح



  // حفظ المرجع عالميًا لتستخدمه دوال أخرى
  window.popupFieldsContainer = fieldsContainer;
  window.popupHeading = popupTitle;

  // رسم الحقول حسب نوع الجهاز
  updatePopupHeadingAndFields(type);

 (async () => {
  document.querySelector("input[name='device-name']").value = deviceData.name || "";
  document.querySelector("input[name='serial']").value = deviceData.Serial_Number || "";
  document.querySelector("input[name='ministry-id']").value = deviceData.Governmental_Number || "";

  await setSelectedOption("model-" + type, deviceData.Model);
  await setSelectedOption("department-" + type, deviceData.Department);
  await setSelectedOption("generation-select", deviceData.Generation);
  await setSelectedOption("cpu-select", deviceData.Processor);
  await setSelectedOption("ram-select", deviceData.RAM);
  await setSelectedOption("drive-select", deviceData.Hard_Drive);
  await setSelectedOption("os-select", deviceData.OS);
  await setSelectedOption("ram-size-select", deviceData.RAM_Size);

  const macInput = document.querySelector("input[name='mac-address']");
  if (macInput) macInput.value = deviceData.MAC_Address || "";

  const ipInput = document.querySelector("input[name='ip-address']");
  if (ipInput) ipInput.value = deviceData.IP_Address || "";

  if (type === "printer") {
    await setSelectedOption("ink-type", deviceData.Ink_Type);
    await setSelectedOption("printer-type", deviceData.Printer_Type);
    document.querySelector("input[name='ink-serial-number']").value = deviceData.Ink_Serial_Number || "";
  }

  if (type === "scanner") {
    await setSelectedOption("scanner-type", deviceData.Scanner_Type);
  }

  // زر الحفظ
  const saveBtn = document.querySelector("#popup-modal .save-btn");
  saveBtn.onclick = async () => {
  const updatedDevice = {
    id: deviceData.id,
    name: document.querySelector("input[name='device-name']").value.trim(),
    Serial_Number: document.querySelector("input[name='serial']").value.trim(),
    Governmental_Number: document.querySelector("input[name='ministry-id']").value.trim(),

    Model: appendLangTagIfMissingg(document.getElementById("model-" + type)?.value, "model-" + type),
Department: sessionStorage.getItem("department-full") || "",
    Generation: appendLangTagIfMissingg(document.getElementById("generation-select")?.value, "generation-select"),
    Processor: appendLangTagIfMissingg(document.getElementById("cpu-select")?.value, "cpu-select"),
    RAM: appendLangTagIfMissingg(document.getElementById("ram-select")?.value, "ram-select"),
    Hard_Drive: appendLangTagIfMissingg(document.getElementById("drive-select")?.value, "drive-select"),
    OS: appendLangTagIfMissingg(document.getElementById("os-select")?.value, "os-select"),
    RAM_Size: appendLangTagIfMissingg(document.getElementById("ram-size-select")?.value, "ram-size-select"),

    MAC_Address: document.querySelector("input[name='mac-address']")?.value || null,
    IP_Address: document.querySelector("input[name='ip-address']")?.value || null,
    Device_Type: type
  };

  if (type === "printer") {
    updatedDevice.Ink_Type = appendLangTagIfMissingg(document.getElementById("ink-type")?.value, "ink-type");
    updatedDevice.Printer_Type = appendLangTagIfMissingg(document.getElementById("printer-type")?.value, "printer-type");
    updatedDevice.Ink_Serial_Number = document.querySelector("input[name='ink-serial-number']")?.value || "";
  }

  if (type === "scanner") {
    updatedDevice.Scanner_Type = appendLangTagIfMissingg(document.getElementById("scanner-type")?.value, "scanner-type");
  }

  console.log("🚀 سيتم إرسال updatedDevice:", updatedDevice);

  const success = await editOption("device-spec", updatedDevice);
  if (success) {
    popup.style.display = "none";
    fetchDeviceSpecsByTypeAndDepartment(); // ✅ إعادة تحميل القائمة بعد الحفظ
  }
};
})();

}

function appendLangTagIfMissingg(value, selectId = null) {
  if (!value) return value;

  const hasTag = /\[(ar|en)\]$/i.test(value);
  if (hasTag) return value;

  if (selectId) {
    const select = document.getElementById(selectId);
    if (select && select.options) {
      const options = Array.from(select.options);
      const match = options.find(
        opt => opt.textContent?.trim() === value.trim() && /\[(ar|en)\]$/i.test(opt.value)
      );


      if (match) return match.value;
    }
  }

  const isArabic = /[\u0600-\u06FF]/.test(value);
  return isArabic ? `${value} [ar]` : value;
}



async function setSelectedOption(inputId, value, attempts = 10) {
  if (!value || attempts <= 0) return;

  const wait = (ms) => new Promise(res => setTimeout(res, ms));

  for (let i = 0; i < attempts; i++) {
    const input = document.getElementById(inputId);
    const span = document.getElementById("selected-" + inputId);

    if (input && span) {
      // طباعة قيمة الأصلية
      console.log(`🔍 setSelectedOption: inputId = ${inputId}, original value = "${value}"`);

      // تنظيف القيمة من وسوم اللغة للعرض
      let displayValue = value;
      
      // إزالة وسوم اللغة [ar] و [en]
      displayValue = displayValue.replace(/\s*\[(ar|en)\]$/i, "").trim();
      
      // معالجة خاصة للأقسام (إذا كانت تحتوي على |)
      if (inputId.includes("department") && displayValue.includes("|")) {
        const parts = displayValue.split("|").map(s => s.trim());
        const currentLang = languageManager.currentLang;
        if (currentLang === "ar") {
          displayValue = parts[1] || parts[0]; // الجزء العربي أو الإنجليزي كبديل
        } else {
          displayValue = parts[0]; // الجزء الإنجليزي
        }
      }
      
      // معالجة خاصة للموديلات والمعالجات والرام إلخ
      if (inputId.includes("model") || inputId.includes("cpu") || inputId.includes("ram") || 
          inputId.includes("drive") || inputId.includes("os") || inputId.includes("generation") ||
          inputId.includes("printer-type") || inputId.includes("ink-type") || inputId.includes("scanner-type")) {
        // إزالة وسوم اللغة من هذه الحقول أيضاً
        displayValue = displayValue.replace(/\s*\[(ar|en)\]$/i, "").trim();
      }

      // إذا كانت القيمة فيها [ar] أو [en] اطبع تنبيه خاص
      if (/\[(ar|en)\]$/i.test(value)) {
        console.log(`⚠️ القيمة تحتوي على تاج لغة: "${value}" -> تم تنظيفها إلى: "${displayValue}"`);
      }

      // حفظ القيمة الأصلية في الحقل المخفي
      input.value = value;
      // عرض القيمة المنظفة في العنصر الظاهر
      span.textContent = displayValue;
      return;
    } 

    await wait(200); // انتظر حتى تجهز العناصر
  }

  console.warn(`❌ setSelectedOption فشل: ${inputId} لم يتم العثور عليه بعد محاولات ${attempts}`);
}

function openGenericEditPopup(deviceData) {
  const type = deviceData.Device_Type || "";
  openGenericPopup("device_specifications", "device-spec");

  setTimeout(() => {
    document.getElementById("spec-name").value = deviceData.name || "";
    document.getElementById("spec-serial").value = deviceData.Serial_Number || "";
    document.getElementById("spec-ministry").value = deviceData.Governmental_Number || "";

    setSelectedOption("spec-model", deviceData.Model);
    setSelectedOption("spec-department", deviceData.Department);

    const saveBtn = document.querySelector("#generic-popup .popup-buttons button");
    saveBtn.onclick = async () => {
       const departmentFull = sessionStorage.getItem("department-full")
        || deviceData.Department
        || "";
      const updatedDevice = {
        id: deviceData.id,
        name: document.getElementById("spec-name").value.trim(),
        Serial_Number: document.getElementById("spec-serial").value.trim(),
        Governmental_Number: document.getElementById("spec-ministry").value.trim(),
        Model: appendLangTagIfMissingg(document.getElementById("spec-model")?.value, "spec-model"),
        Department: departmentFull,
        Device_Type: type,
      };

  const success = await editOption("device-spec", updatedDevice);
  if (success) {
    document.getElementById("generic-popup").style.display = "none";
    fetchDeviceSpecsByTypeAndDepartment(); // ✅ إعادة تحميل القائمة بعد الحفظ
  }

    };
  }, 200);
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

function mapSelectIdToServerTarget(selectId) {
  const map = {
    "device-type": "problem-type",
    "technical-status": "technical",
    "problem-status": "problem-status",
    "floor": "floor",
    "section": "section",
    "spec-department": "section",
    "spec-model": "model",
    "model-pc": "model",
    "model-printer": "model",
    "model-scanner": "model",
    "drive-select": "drive-select",
    "cpu-select": "cpu-select",
    "ram-select": "ram-select",
    "printer-type": "printer-type",
    "ink-type": "ink-type",
    "ram-size-select": "ram-size-select",
    "scanner-type": "scanner-type",

    "os-select": "os-select",
    "generation-select": "generation-select",
    "device-spec": "device-spec"
  };

  return map[selectId] || selectId;
}




async function deleteOption(selectId, valueOrObject, type = null) {
  const lang = languageManager.currentLang;
  const t = languageManager.translations[lang];

  if (!valueOrObject) {
    alert(t['please_select_valid_option']);
    return false;
  }

  const isDeviceSpec = selectId === "device-spec";
  const url = isDeviceSpec
    ? "http://localhost:4000/delete-device-specification"
    : "http://localhost:4000/delete-option-complete";

  // تحديد إذا المستخدم مرر كائن جاهز (targetObject) أو قيمة تقليدية
  const body = typeof valueOrObject === "object" && (valueOrObject.id || valueOrObject.target)
    ? valueOrObject
    : isDeviceSpec
      ? { id: valueOrObject }
      : {
        target: mapSelectIdToServerTarget(selectId),
        value: valueOrObject,
        type
      };

  try {
    console.log("🚀 Sending payload:", body);
    console.log("📦 JSON.stringify output:", JSON.stringify(body));

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify(body)
    });

    const result = await res.json();

    if (result.error) {
      alert(result.error);
      return false;
    }

    if (!isDeviceSpec) {
      refreshDropdown(selectId);
    }

    return true;
  } catch (err) {
    console.error("❌ Error deleting option:", err);
    alert(t['failed_to_delete_option']);
    return false;
  }
}

function refreshDropdown(selectId) {
  if (selectId === "problem-type") {
    fetchDeviceTypes();
  } else if (selectId === "section" || selectId.startsWith("department-")) {
    fetchDepartments(selectId);
  } else if (selectId === "ram-select") {
    fetchRAM();
  } else if (selectId === "ram-size-select") {
    fetchRAMSize();
  }
  else if (selectId === "cpu-select") {
    fetchCPU();
  }

  else if (selectId === "os-select") {
    fetchOS();
  } else if (selectId === "drive-select") {
    fetchDrives();
  }
  else if (selectId === "printer-type") {
    fetchPrinterTypes();
  }
  else if (selectId === "ink-type") {
    fetchInkTypes();
  } else if (selectId === "scanner-type") {
    fetchScannerTypes();
  }
  else if (selectId === "generation-select") {
    fetchProcessorGen();
  } else if (selectId.startsWith("model-")) {
    const type = selectId.replace("model-", "");
    fetchAndRenderModels(type, selectId);
  } else if (selectId === "device-spec") {
    fetchDeviceSpecsByTypeAndDepartment();
  }
  else if (selectId === "floor") {
    fetchFloors();
  }

  // ✅✅ الإضافات الجديدة:
  else if (selectId === "problem-status") {
    const typeDropdown = document.getElementById("device-type");
    const type = typeDropdown?.value?.toLowerCase();
    if (type) fetchProblemStatus(type);
  } else if (selectId === "technical-status") {
    fetchTechnicalStatus();
  }
  // -------------------
  else {
    console.warn(`❓ Unknown selectId for refreshing: ${selectId}`);
  }
}

function appendLangTagIfMissing(value) {
  const hasLangTag = /\[(ar|en)\]$/i.test(value);
  if (hasLangTag) return value;

  const isArabic = isArabicText(value);
  return `${value} ${isArabic ? "[ar]" : "[en]"}`;
}



function attachEditDeleteHandlers(optionsContainerId, type = null) {
  const optionsContainer = document.getElementById(optionsContainerId);

  if (!optionsContainer) {
    console.error(`❌ Cannot find options container for: ${optionsContainerId}`);
    return;
  }

  const rows = optionsContainer.querySelectorAll(".dropdown-option-row:not(.add-new-option)");

  rows.forEach(row => {
    const textEl = row.querySelector(".dropdown-option-text");
    let iconsContainer = row.querySelector(".dropdown-actions-icons");

    if (!iconsContainer) {
      iconsContainer = document.createElement("div");
      iconsContainer.className = "dropdown-actions-icons";

      const editIcon = document.createElement("i");
      editIcon.className = "fas fa-edit";
      editIcon.title = "Edit";
      editIcon.style.cursor = "pointer";
      editIcon.onclick = (e) => {
        e.stopPropagation();
        const oldValue = textEl.textContent.trim();
        const selectId = optionsContainerId.replace("-options", "");
        
        console.log(`✏️ Edit clicked for ${selectId}: "${oldValue}"`);
        
        // استخدام الدالة الجديدة للمهندس والقسم
        if (selectId === "section" || selectId === "spec-department" || selectId === "technical-status") {
          console.log(`🔄 Using enhanced edit for ${selectId}`);
          // استخدم النص المعروض للبحث عن الاسم الكامل
          editOptionWithFullName(selectId, oldValue, null, type);
        } else {
          // للمجالات الأخرى، استخدم المنطق العادي
          console.log(`📝 Using standard edit for ${selectId}`);
          const newValue = prompt(`Edit "${oldValue}"`, oldValue);
          if (newValue && newValue.trim() !== oldValue) {
            editOption(selectId, oldValue, newValue.trim(), type);
          }
        }
      };

      const deleteIcon = document.createElement("i");
      deleteIcon.className = "fas fa-trash";
      deleteIcon.title = "Delete";
      deleteIcon.style.cursor = "pointer";
      deleteIcon.onclick = (e) => {
        e.stopPropagation();
        const valueToDelete = textEl.textContent.trim();
        const selectId = optionsContainerId.replace("-options", "");
        console.log(`🗑️ Delete clicked for ${selectId}: "${valueToDelete}"`);
        deleteOption(selectId, valueToDelete, type);
      };

      iconsContainer.appendChild(editIcon);
      iconsContainer.appendChild(deleteIcon);
      row.appendChild(iconsContainer);
    }
  });
}


function openGenericPopup(labelKey, targetId) {
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
        requestAnimationFrame(() => fetchDepartments("spec-department"));

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

        fetchAndRenderModels(cleanedType, "spec-model");

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



function saveGenericOption() {
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
          fetchDeviceTypes(); // ✅ إعادة تحميل DeviceType بعد الإضافة
        }
        sessionStorage.removeItem("returnToPopup");
        closeGenericPopup();
      }
    })
    .catch(err => {
      alert(err.message || "❌ Failed to save");
    });
}



function openAddModelPopup() {
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
}function openAddSectionPopup(contextId = "section", oldValue = "") {
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


function saveNewModel() {
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
      fetchAndRenderModels(deviceType, `model-${deviceType}`);
      sessionStorage.setItem("spec-model", modelName);

      const isSpecContext = sessionStorage.getItem("returnToPopup") === "true";
      if (isSpecContext) {
        fetchAndRenderModels(deviceType, "spec-model");

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



function saveDeviceSpecification() {


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

        fetchDeviceSpecsByTypeAndDepartment();

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


function closeGenericPopup(cancelled = false) {
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









function prependAddNewOption(selectElement, value = "add-new", text = "+ Add New") {
  if (!selectElement) return;

  const addNewOption = document.createElement("option");
  addNewOption.value = value;
  addNewOption.textContent = text;

  const options = Array.from(selectElement.options);
  const hasAddNew = options.some(opt => opt.value === value);
  if (!hasAddNew) {
    selectElement.insertBefore(addNewOption, selectElement.firstChild);
  }
}




// إظهار إشعار أسفل الدروب ليست
function showNotification(message, selectId) {
  const selectElement = document.getElementById(selectId);
  let container = selectElement.closest('.dropdown-container') || selectElement.parentNode;

  const notification = document.createElement('div');
  notification.className = "notification";
  notification.textContent = message;
  notification.style.color = "#d9534f";
  notification.style.fontSize = "14px";
  notification.style.marginTop = "4px";

  container.appendChild(notification);

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


// دالة تطبق الحذف الدائم عند تحميل الصفحة
function applyDeletions(selectId) {
  const persistentKey = `deletedOptions_${selectId}`;
  const deletedOptions = JSON.parse(localStorage.getItem(persistentKey)) || [];
  const select = document.getElementById(selectId);

  for (let i = select.options.length - 1; i >= 0; i--) {
    if (deletedOptions.includes(select.options[i].text)) {
      select.remove(i);
    }
  }
}

function cleanDropdownError(hiddenInput) {
  if (!hiddenInput) return;

  hiddenInput.classList.remove("input-error");

  const visibleId = hiddenInput.id;
  const displayElement = document.getElementById("selected-" + visibleId);

  // ✅ نظف الحدود من العنصر الظاهر
  const toggle = displayElement?.closest(".dropdown-toggle");
  if (toggle) {
    toggle.style.border = "";
    toggle.style.borderRadius = "";
  }

  // ✅ 1: جرب ID مباشر للـ wrapper
  let wrapper = document.getElementById(visibleId + "-wrapper") ||
                document.getElementById(visibleId + "-dropdown-wrapper");

  // ✅ 2: جرب العنصر اللي قبل hiddenInput
  if (!wrapper) {
    const prev = hiddenInput.previousElementSibling;
    if (prev?.classList.contains("custom-dropdown-wrapper")) {
      wrapper = prev;
    }
  }

  // ✅ 3: fallback خاص مثل حالة device-spec
  if (!wrapper && displayElement) {
    wrapper = displayElement.closest(".custom-dropdown-wrapper");
  }

  // ✅ احذف الرسالة بعد الـ wrapper إذا وُجدت
  const wrapperError = wrapper?.nextElementSibling;
  if (wrapperError && wrapperError.classList.contains("input-error-message")) {
    wrapperError.remove();
  }

  // ✅ دعم إضافي من .form-field
  const formField = hiddenInput.closest(".form-field");
  if (formField) {
    const extraErrors = formField.querySelectorAll(".input-error-message");
    extraErrors.forEach(err => err.remove());

    const toggleInside = formField.querySelector(".dropdown-toggle");
    if (toggleInside) {
      toggleInside.style.border = "";
      toggleInside.style.borderRadius = "";
    }
  }
}
function initInputFieldValidation(formElement) {
  if (!formElement) return;

  const inputs = formElement.querySelectorAll('input[required]:not([type="hidden"])');

  inputs.forEach(input => {
    input.addEventListener("input", () => {
      if (input.value.trim() !== "") {
        input.classList.remove("input-error");

        const msg = input.nextElementSibling;
        if (msg && msg.classList.contains("input-error-message")) {
          msg.remove();
        }
      }
    });
  });
}


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

  // اجلب الاسم الكامل للمهندس من قائمة الخيارات
  let fullTechnical = "";
  if (techInput) {
    const selectedVal = techInput.value;
    // ابحث في قائمة المهندسين عن الاسم الكامل
    const options = window.lastTechnicalOptions || [];
    const found = options.find(item => {
      const raw = item.Engineer_Name || item.name || "";
      const parts = raw.split("|").map(p => p.trim());
      const en = parts[0] || "";
      const ar = parts[1] || "";
      const display = languageManager.currentLang === "ar" ? (ar || en) : en;
      return display === selectedVal;
    });
    fullTechnical = found ? (found.Engineer_Name || found.name || selectedVal) : selectedVal;
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
      alert("❌ فشل في الإرسال. تحقق من الاتصال.");
    });
});


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

    function loadOptions() {
  checkUserPermissions().then(permissions => {
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

// ✅ دالة فتح بوب أب إضافة عنصر جديد
function openAddNewOptionPopup(config) {
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

// ✅ دالة حفظ العنصر الجديد
function saveNewOption(selectId, labelKey) {
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
            fetchFloors();
            break;

          case "problem-status":
            const deviceType = document.getElementById("device-type")?.value?.toLowerCase();
            sessionStorage.setItem("problem-status", rawValue);
            fetchProblemStatus(deviceType);
            break;

          case "technical-status":
            sessionStorage.setItem("technical-status", rawValue);
            fetchTechnicalStatus();
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


function fetchFloors() {
  renderDropdownOptions({
    endpoint: "http://localhost:4000/floors",
    containerId: "floor-options",
    displayId: "selected-floor",
    inputId: "floor",
    labelKey: "floor",
    itemKey: "FloorNum",
    storageKey: "floor",

    transformData: (items) => {
      const currentLang = languageManager.currentLang;

      return items
        .filter(item => {
          const original = item.FloorNum?.trim() || "";
          const translated = translateFloorName(original); // 🔍 الترجمة

          const isTranslated = translated !== original;
          const isArabicTag = original.endsWith("[ar]");
          const isEnglishTag = original.endsWith("[en]");
          const isUnlabeled = !isArabicTag && !isEnglishTag;

          // ✅ نعرض العناصر المترجمة دائمًا
          if (isTranslated) return true;

          // ✅ نعرض العناصر حسب لغة الموقع
          if (currentLang === "ar") return isArabicTag || isUnlabeled;
          return isEnglishTag || isUnlabeled;
        })
        .map(item => {
          const original = item.FloorNum?.trim() || "";
          const translated = translateFloorName(original);
          const cleaned = translated.replace(/\s*\[(ar|en)\]$/i, "").trim(); // إزالة الوسم بعد الترجمة
          return {
            ...item,
            FloorNum: cleaned
          };
        });
    },

    onAddNew: () => {
      openAddNewOptionPopup({ id: "floor", labelKey: "floor" });
    },
    onEditOption: (oldVal) => {
      const newVal = prompt("Edit Floor:", oldVal);
      if (newVal && newVal !== oldVal) {
        editOption("floor", oldVal, newVal);
      }
    },
    onDeleteOption: (val) => {
      if (confirm(`Delete "${val}"?`)) {
        deleteOption("floor", val);
      }
    }
  });
}


async function checkUserPermissions(userId) {
  if (!userId) {
    userId = localStorage.getItem("userId");
  }

  const userRole = localStorage.getItem("userRole"); // ← نجيب الدور من التخزين المحلي

  // ✅ لو أدمن، نرجع كل الصلاحيات مفتوحة
  if (userRole === "admin") {
    return {
      device_access: "all",
      view_access: true,
      full_access: true,
      add_items: true,
      edit_items: true,
      delete_items: true,
      check_logs: true,
      edit_permission: true
    };
  }

  // ✅ باقي المستخدمين (عاديين) نجيب صلاحياتهم من السيرفر
  try {
    const response = await fetch(`http://localhost:4000/users/${userId}/with-permissions`);
    if (!response.ok) throw new Error('Failed to fetch user permissions');

    const userData = await response.json();
    return {
      device_access: userData.permissions?.device_access || 'none',
      view_access: userData.permissions?.view_access || false,
      full_access: userData.permissions?.full_access || false,
      add_items: userData.permissions?.add_items || false,
      edit_items: userData.permissions?.edit_items || false,
      delete_items: userData.permissions?.delete_items || false,
      check_logs: userData.permissions?.check_logs || false,
      edit_permission: userData.permissions?.edit_permission || false
    };
  } catch (error) {
    console.error('Error checking permissions:', error);
    return {
      device_access: 'none',
      view_access: false,
      full_access: false
    };
  }
}


async function renderDropdownOptions({
  endpoint,
  containerId,
  displayId,
  inputId,
  labelKey,
  itemKey, // ممكن تكون string أو دالة
  storageKey,
  onAddNew,
  onEditOption,
  onDeleteOption,
  onSelectOption,
  transformData // ← أضف هذا
}) {
  const permissions = await checkUserPermissions();
  const res = await fetch(endpoint);
  let data = await res.json();

  // ✅ دعم التحويل (الترجمة)
  if (typeof transformData === "function") {
    data = transformData(data);
  }
  const container = document.getElementById(containerId);
  const display = document.getElementById(displayId);
  const input = document.getElementById(inputId);
  const lang = languageManager?.currentLang || 'en';
  const t = languageManager?.translations?.[lang] || {};

  if (!container || !display || !input) {
    console.warn(`❌ عناصر الدروب داون ناقصة: ${containerId}, ${displayId}, ${inputId}`);
    return;
  }

  container.innerHTML = "";

  // ✅ زر الإضافة - فقط إذا كان عنده صلاحية
  if ((permissions.full_access || permissions.add_items) && onAddNew) {
    const addNewRow = document.createElement("div");
    addNewRow.className = "dropdown-option-row add-new-option";
    addNewRow.innerHTML = `<div class="dropdown-option-text">+ ${t['add_new'] || 'Add New'} ${t[labelKey] || labelKey}</div>`;
    addNewRow.onclick = () => {
      sessionStorage.setItem("lastDropdownOpened", inputId);
      onAddNew();
      closeAllDropdowns();
    };
    container.appendChild(addNewRow);
  }

  // ✅ العناصر
  data.forEach(item => {
    const value = typeof itemKey === 'function' ? itemKey(item) : item[itemKey];
    const displayText = typeof value === 'object' ? value.name : value;
    const actualValue = typeof value === 'object' ? value.name : value;

    const row = document.createElement("div");
    row.className = "dropdown-option-row";

    const text = document.createElement("div");
    text.className = "dropdown-option-text";
    text.textContent = displayText;

    text.onclick = () => {
      display.textContent = displayText;
      // إذا كان العنصر خاص بـ technical-status → احفظ fullName
      if (inputId === "technical-status" && item.fullName) {
        input.value = item.fullName;
      } else {
        input.value = actualValue;
      }
      if (onSelectOption) onSelectOption(actualValue, item);
      cleanDropdownError(input);
      closeAllDropdowns();
    };

    const icons = document.createElement("div");
    icons.className = "dropdown-actions-icons";

    // ✏️ تعديل
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

    // 🗑️ حذف
    if (permissions.full_access || permissions.delete_items) {
      const deleteIcon = document.createElement("i");
      deleteIcon.className = "fas fa-trash";
      deleteIcon.title = t['delete'] || "Delete";
      deleteIcon.onclick = (e) => {
        e.stopPropagation();
        onDeleteOption?.(value);
      };
      icons.appendChild(deleteIcon);
    }

    row.appendChild(text);
    row.appendChild(icons);
    container.appendChild(row);
  });

  // ✅ استرجاع القيمة المحفوظة
const saved = sessionStorage.getItem(storageKey || inputId);
if (saved) {
  const allRows = container.querySelectorAll(".dropdown-option-row");
  for (const row of allRows) {
    const textEl = row.querySelector(".dropdown-option-text");
    if (textEl?.textContent?.trim() === saved.trim()) {
      textEl.click();  // ← هذا ينفذ الكود اللي يحفظ dataset.id
      break;
    }
  }

  sessionStorage.removeItem(storageKey || inputId);
}






  attachEditDeleteHandlers(containerId, t[labelKey] || labelKey);
}

// ✅ دالة إغلاق البوب أب


// ✅ دالة إغلاق كل الدروب داون
function closeAllDropdowns() {
  document.querySelectorAll(".dropdown-content").forEach(drop => drop.style.display = "none");
}

// دالة لجلب الاسم الكامل للمهندس والقسم عند التعديل
async function getFullName(target, value) {
  try {
    console.log(`🔍 Fetching full name for ${target}: "${value}"`);
    
    const response = await fetch("http://localhost:4000/get-full-name", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ target, value })
    });

    if (!response.ok) {
      console.error(`❌ HTTP Error: ${response.status} ${response.statusText}`);
      return null;
    }

    const result = await response.json();
    
    if (result.error) {
      console.error("❌ Server error getting full name:", result.error);
      return null;
    }

    console.log(`✅ Full name data received:`, result);
    return result;
  } catch (err) {
    console.error("❌ Network error getting full name:", err);
    return null;
  }
}

// دالة محسنة للتعديل تدعم جلب الاسم الكامل
async function editOptionWithFullName(selectId, oldValue, newValue = null, type = null) {
  const lang = languageManager.currentLang;
  const t = languageManager.translations[lang];

  console.log(`🔍 editOptionWithFullName called with:`, { selectId, oldValue, newValue, type });

  if (!oldValue) {
    alert(t['please_select_and_enter_valid_value']);
    return false;
  }

  // تحديد نوع الهدف
  let target;
  if (selectId === "section" || selectId === "spec-department") {
    target = "section";
  } else if (selectId === "technical-status") {
    target = "technical";
  } else {
    // للمجالات الأخرى، استخدم المنطق العادي
    return editOption(selectId, oldValue, newValue, type);
  }

  // تنظيف القيمة المرسلة واستخراج الجزء المناسب
  let searchValue = oldValue.trim();
  if (searchValue.includes("|")) {
    const parts = searchValue.split("|").map(s => s.trim());
    const currentLang = languageManager.currentLang;
    searchValue = currentLang === "ar" ? (parts[1] || parts[0]) : parts[0];
  }

  console.log(`🔍 Searching for ${target} with value: "${searchValue}"`);

  // جلب الاسم الكامل القديم
  const fullNameData = await getFullName(target, searchValue);
  if (!fullNameData) {
    alert(`❌ Could not find ${target === "section" ? "department" : "engineer"} information.`);
    return false;
  }

  console.log(`✅ Found full name data:`, fullNameData);

  // إذا لم يتم تمرير newValue، اطلب من المستخدم إدخاله
  let enVal = fullNameData.englishName || "";
  let arVal = fullNameData.arabicName || "";
  if (!newValue) {
    const currentLang = languageManager.currentLang;
    const currentName = currentLang === "ar" ? arVal : enVal;
    const otherName = currentLang === "ar" ? enVal : arVal;
    const promptMessage = `Edit ${target === "section" ? "Department" : "Engineer"} Name\n\nCurrent ${currentLang === "ar" ? "Arabic" : "English"}: ${currentName}\nCurrent ${currentLang === "ar" ? "English" : "Arabic"}: ${otherName}\n\nEnter new ${currentLang === "ar" ? "Arabic" : "English"} name:`;
    newValue = prompt(promptMessage, currentName);
    if (!newValue || newValue.trim() === "") {
      return false;
    }
  }

  // بناء الاسم الكامل الجديد
  let fullNameNew = "";
  const cleanNewValue = newValue.trim();
  if (cleanNewValue.includes("|")) {
    // إذا أدخل المستخدم الاسمين معًا
    const parts = cleanNewValue.split("|").map(s => s.trim());
    if (parts.length === 2) {
      fullNameNew = `${parts[0]}|${parts[1]}`;
    } else {
      alert("❌ Please enter both English and Arabic names separated by | e.g. en|عربي");
      return false;
    }
  } else {
    // إذا أدخل المستخدم جزء واحد فقط
    if (lang === "ar") {
      fullNameNew = `${enVal}|${cleanNewValue}`;
    } else {
      fullNameNew = `${cleanNewValue}|${arVal}`;
    }
  }

  console.log(`🔄 Sending update request:`, {
    target,
    oldValue: fullNameData.fullName,
    newValue: fullNameNew
  });

  // إرسال الطلب للباكند
  try {
    const response = await fetch("http://localhost:4000/update-option-complete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        target,
        oldValue: fullNameData.fullName, // إرسال الاسم الكامل بدلاً من الجزء المحلي
        newValue: fullNameNew, // الاسم الكامل الجديد
        type
      })
    });
    const result = await response.json();
    if (result.error) {
      alert(result.error);
      return false;
    } else {
      console.log(`✅ Update successful:`, result);
      refreshDropdown(selectId);
      return true;
    }
  } catch (err) {
    console.error("❌ Error in editOptionWithFullName:", err);
    alert(t['failed_to_edit_option']);
    return false;
  }
}

async function editOption(selectId, updatedDevice, newValue = null, type = null) {
  const lang = languageManager.currentLang;
  const t = languageManager.translations[lang];

  if (!updatedDevice || (selectId !== "device-spec" && (!updatedDevice || !newValue))) {
    alert(t['please_select_and_enter_valid_value']);
    return false;
  }

  const isDeviceSpec = selectId === "device-spec";
  const url = isDeviceSpec
    ? "http://localhost:4000/update-device-specification"
    : "http://localhost:4000/update-option-complete";

  let body;
  if (isDeviceSpec) {
    body = updatedDevice;
  } else {
    const target = mapSelectIdToServerTarget(selectId);
    let valueToSend;

if (selectId === "section" || selectId === "technical-status") {
      // إذا القسم، لا نضيف أي تاج لغة، نأخذ newValue كما هو
      valueToSend = newValue.trim();
    } else {
      // لأي حقل آخر (غير device-spec و section) نستخدم appendLangTagIfMissing
      valueToSend = (newValue.trim());
    }

    body = {
      target,
      oldValue: updatedDevice,
      newValue: valueToSend,
      type
    };
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(body)
    });
    const result = await res.json();

    if (result.error) {
      alert(result.error);
      return false;
    } else {
      if (!isDeviceSpec) refreshDropdown(selectId);
      return true;
    }
  } catch (err) {
    console.error("❌ Error editing option:", err);
    alert(t['failed_to_edit_option']);
    return false;
  }
}
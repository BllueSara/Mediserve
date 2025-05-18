

// التعامل مع منطقة رفع الملفات باستخدام Drag & Drop والنقر

// الحصول على عناصر السحب والإفلات وعناصر الـ input المخفي
const dropArea = document.getElementById("drop-area");
const uploadFileInput = document.getElementById("upload-file");

// عند النقر على منطقة الرفع، يتم تفعيل اختيار الملفات
dropArea.addEventListener("click", () => {
uploadFileInput.click();
});

// التعامل مع سحب الملفات فوق منطقة الرفع
dropArea.addEventListener("dragover", (e) => {
e.preventDefault(); // منع السلوك الافتراضي (مثلاً فتح الملف في المتصفح)
dropArea.classList.add("drag-over"); // تفعيل تأثير بصري عند السحب
});

// عند مغادرة الملفات للمنطقة (دون إفلاتها)
dropArea.addEventListener("dragleave", (e) => {
e.preventDefault();
dropArea.classList.remove("drag-over"); // إزالة التأثير البصري
});

// عند إفلات الملفات داخل منطقة الرفع
dropArea.addEventListener("drop", (e) => {
e.preventDefault();
dropArea.classList.remove("drag-over"); // إزالة التأثير البصري
const files = e.dataTransfer.files;
handleFiles(files);
});

// عند اختيار الملفات باستخدام متصفح الملفات (عن طريق الـ input المخفي)
uploadFileInput.addEventListener("change", (e) => {
const files = e.target.files;
handleFiles(files);
});

/**
* دالة للتعامل مع الملفات المختارة وإرسالها للسيرفر
* @param {FileList} files - قائمة الملفات المختارة
*/
function handleFiles(files) {
// إنشاء كائن FormData لتجميع الملفات
const formData = new FormData();

// إضافة كل ملف إلى formData
for (let i = 0; i < files.length; i++) {
  formData.append("files", files[i]);
}

// إرسال الملفات للسيرفر عبر طلب POST باستخدام fetch
// تأكد من تعديل الرابط التالي (URL) ليناسب إعدادات السيرفر لديك
fetch("http://localhost:5050/upload", {
  method: "POST",
  body: formData
})
  .then(response => response.json())
  .then(result => {
    console.log("Upload successful!", result);
    // يمكنك هنا عرض رسالة نجاح أو تحديث الواجهة بحسب النتيجة
  })
  .catch(error => {
    console.error("Upload error:", error);
    // يمكنك هنا تقديم رسالة للمستخدم عند حدوث خطأ ما
  });
}



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

function fetchAndRenderModels(deviceType, dropdownId) {
  const cleanedType = deviceType.trim().toLowerCase();
  const optionsContainer = document.getElementById(`${dropdownId}-options`);
  const displaySpan = document.getElementById(`selected-${dropdownId}`);
  const hiddenInput = document.getElementById(dropdownId);
  const lang = languageManager.currentLang;
  const t = languageManager.translations[lang];

  if (!optionsContainer || !displaySpan || !hiddenInput) {
    console.error(`❌ ${t['dropdown_elements_not_found']}: ${dropdownId}`);
    return;
  }

  let endpoint = "";
  if (["pc", "laptop", "desktop", "كمبيوتر", "لابتوب"].includes(cleanedType)) {
    endpoint = "/PC_Model";
  } else if (cleanedType === "printer") {
    endpoint = "/Printer_Model";
  } else if (cleanedType === "scanner") {
    endpoint = "/Scanner_Model";
  } else {
    endpoint = `/models-by-type/${cleanedType}`;
  }

  fetch(`http://localhost:5050${endpoint}`)
    .then(res => res.json())
    .then(data => {
      optionsContainer.innerHTML = "";

      const addNewRow = document.createElement("div");
      addNewRow.className = "dropdown-option-row add-new-option";
      addNewRow.innerHTML = `<div class="dropdown-option-text">+ ${t['add_new_model']}</div>`;
      addNewRow.onclick = () => {
        sessionStorage.setItem("lastDropdownOpened", dropdownId);

        ["spec-ministry", "spec-name", "spec-serial", "spec-department"].forEach(id => {
          const el = document.getElementById(id);
          if (el) sessionStorage.setItem(id, el.value);
        });

        openAddModelPopup();
        closeAllDropdowns();
      };
      optionsContainer.appendChild(addNewRow);

      data.forEach(item => {
        const row = document.createElement("div");
        row.className = "dropdown-option-row";

        const text = document.createElement("div");
        text.className = "dropdown-option-text";
        text.textContent = item.model_name;
        text.onclick = () => {
          displaySpan.textContent = item.model_name;
          hiddenInput.value = item.model_name;
          cleanDropdownError(hiddenInput);
          closeAllDropdowns();
        };

        const icons = document.createElement("div");
        icons.className = "dropdown-actions-icons";

        const editIcon = document.createElement("i");
        editIcon.className = "fas fa-edit";
        editIcon.title = t['edit'];
        editIcon.onclick = (e) => {
          e.stopPropagation();
          const newValue = prompt(`${t['edit']} ${t['model']}:`, item.model_name);
          if (newValue) {
            editOption(dropdownId, item.model_name, newValue, cleanedType);
          }
        };

        const deleteIcon = document.createElement("i");
        deleteIcon.className = "fas fa-trash";
        deleteIcon.title = t['delete'];
        deleteIcon.onclick = (e) => {
          e.stopPropagation();
          if (confirm(`${t['confirm_delete']} "${item.model_name}"?`)) {
            deleteOption(dropdownId, item.model_name, cleanedType);
          }
        };

        icons.appendChild(editIcon);
        icons.appendChild(deleteIcon);
        row.appendChild(text);
        row.appendChild(icons);
        optionsContainer.appendChild(row);
      });

      const saved = sessionStorage.getItem(dropdownId) || sessionStorage.getItem("lastAddedModel");
      if (saved) {
        displaySpan.textContent = saved;
        hiddenInput.value = saved;
        sessionStorage.removeItem(dropdownId);
        sessionStorage.removeItem("lastAddedModel");
      }
      attachEditDeleteHandlers(`${dropdownId}-options`, t['model']);
    })
    .catch(err => {
      console.error(`❌ ${t['error_fetching_models']}:`, err);
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
          <label>${labelWithStar(t['ip_address'], true)}</label>
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
    deviceData[key] = value.trim();
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

  fetch(`http://localhost:5050/AddDevice/${deviceType}`, {
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
          console.error("⚠️ خطأ غير متوقع:", result.error);
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
      fetchDeviceSpecsByTypeAndDepartment();
    })
    .catch(err => {
      console.error("❌ خطأ أثناء الاتصال بالسيرفر:", err);
    });
}

function fetchScannerTypes() {
  fetch("http://localhost:5050/Scanner_Types")
    .then(res => res.json())
    .then(data => {
      const optionsContainer = document.getElementById("scanner-type-options");
      const displaySpan = document.getElementById("selected-scanner-type");
      const hiddenInput = document.getElementById("scanner-type");

      if (!optionsContainer || !displaySpan || !hiddenInput) return;

      optionsContainer.innerHTML = "";

      // + Add New Scanner Type
      const addNewRow = document.createElement("div");
      addNewRow.className = "dropdown-option-row add-new-option";
      addNewRow.innerHTML = `<div class="dropdown-option-text">+ Add New Scanner Type</div>`;
      addNewRow.onclick = () => {
        sessionStorage.setItem("lastDropdownOpened", "scanner-type");
        openAddOptionPopup("scanner-type");
        closeAllDropdowns();
      };
      optionsContainer.appendChild(addNewRow);

      data.forEach(item => {
        const row = document.createElement("div");
        row.className = "dropdown-option-row";

        const text = document.createElement("div");
        text.className = "dropdown-option-text";
        text.textContent = item.scanner_type;
        text.onclick = () => {
          displaySpan.textContent = item.scanner_type;
          hiddenInput.value = item.scanner_type;
          cleanDropdownError(hiddenInput);

          closeAllDropdowns();
        };

        const icons = document.createElement("div");
        icons.className = "dropdown-actions-icons";

        const editIcon = document.createElement("i");
        editIcon.className = "fas fa-edit";
        editIcon.title = "Edit";
        editIcon.onclick = (e) => {
          e.stopPropagation();
          const newValue = prompt("Edit Scanner Type:", item.scanner_type);
          if (newValue) {
            editOption("scanner-type", item.scanner_type, newValue);
          }
        };

        const deleteIcon = document.createElement("i");
        deleteIcon.className = "fas fa-trash";
        deleteIcon.title = "Delete";
        deleteIcon.onclick = (e) => {
          e.stopPropagation();
          if (confirm(`Delete "${item.scanner_type}"?`)) {
            deleteOption("scanner-type", item.scanner_type);
          }
        };

        icons.appendChild(editIcon);
        icons.appendChild(deleteIcon);
        row.appendChild(text);
        row.appendChild(icons);
        optionsContainer.appendChild(row);
      });

      const saved = sessionStorage.getItem("scanner-type");
      if (saved) {
        displaySpan.textContent = saved;
        hiddenInput.value = saved;
        sessionStorage.removeItem("scanner-type");
      }

      attachEditDeleteHandlers("scanner-type-options", "Scanner Type");
    })
    .catch(err => {
      console.error("❌ Error fetching scanner types:", err);
    });
}

function fetchPrinterTypes() {
  fetch("http://localhost:5050/Printer_Types")
    .then(res => res.json())
    .then(data => {
      const optionsContainer = document.getElementById("printer-type-options");
      const displaySpan = document.getElementById("selected-printer-type");
      const hiddenInput = document.getElementById("printer-type");

      if (!optionsContainer || !displaySpan || !hiddenInput) return;

      optionsContainer.innerHTML = "";

      // + Add New Printer Type
      const addNewRow = document.createElement("div");
      addNewRow.className = "dropdown-option-row add-new-option";
      addNewRow.innerHTML = `<div class="dropdown-option-text">+ Add New Printer Type</div>`;
      addNewRow.onclick = () => {
        sessionStorage.setItem("lastDropdownOpened", "printer-type");
        openAddOptionPopup("printer-type");
        closeAllDropdowns();
      };
      optionsContainer.appendChild(addNewRow);

      data.forEach(item => {
        const row = document.createElement("div");
        row.className = "dropdown-option-row";

        const text = document.createElement("div");
        text.className = "dropdown-option-text";
        text.textContent = item.printer_type;
        text.onclick = () => {
          displaySpan.textContent = item.printer_type;
          hiddenInput.value = item.printer_type;
          cleanDropdownError(hiddenInput);

          closeAllDropdowns();
        };

        const icons = document.createElement("div");
        icons.className = "dropdown-actions-icons";

        const editIcon = document.createElement("i");
        editIcon.className = "fas fa-edit";
        editIcon.title = "Edit";
        editIcon.onclick = (e) => {
          e.stopPropagation();
          const newValue = prompt("Edit Printer Type:", item.printer_type);
          if (newValue) {
            editOption("printer-type", item.printer_type, newValue);
          }
        };

        const deleteIcon = document.createElement("i");
        deleteIcon.className = "fas fa-trash";
        deleteIcon.title = "Delete";
        deleteIcon.onclick = (e) => {
          e.stopPropagation();
          if (confirm(`Delete "${item.printer_type}"?`)) {
            deleteOption("printer-type", item.printer_type);
          }
        };

        icons.appendChild(editIcon);
        icons.appendChild(deleteIcon);
        row.appendChild(text);
        row.appendChild(icons);
        optionsContainer.appendChild(row);
      });

      const saved = sessionStorage.getItem("printer-type");
      if (saved) {
        displaySpan.textContent = saved;
        hiddenInput.value = saved;
        sessionStorage.removeItem("printer-type");
      }
      attachEditDeleteHandlers("printer-type-options", "Printer Type");
    })
    .catch(err => {
      console.error("❌ Error fetching printer types:", err);
    });
}
function fetchInkTypes() {
  fetch("http://localhost:5050/Ink_Types")
    .then(res => res.json())
    .then(data => {
      const optionsContainer = document.getElementById("ink-type-options");
      const displaySpan = document.getElementById("selected-ink-type");
      const hiddenInput = document.getElementById("ink-type");

      if (!optionsContainer || !displaySpan || !hiddenInput) return;

      optionsContainer.innerHTML = "";

      // + Add New Ink Type
      const addNewRow = document.createElement("div");
      addNewRow.className = "dropdown-option-row add-new-option";
      addNewRow.innerHTML = `<div class="dropdown-option-text">+ Add New Ink Type</div>`;
      addNewRow.onclick = () => {
        sessionStorage.setItem("lastDropdownOpened", "ink-type");
        openAddOptionPopup("ink-type");
        closeAllDropdowns();
      };
      optionsContainer.appendChild(addNewRow);

      data.forEach(item => {
        const row = document.createElement("div");
        row.className = "dropdown-option-row";

        const text = document.createElement("div");
        text.className = "dropdown-option-text";
        text.textContent = item.ink_type;
        text.onclick = () => {
          displaySpan.textContent = item.ink_type;
          hiddenInput.value = item.ink_type;
          cleanDropdownError(hiddenInput);

          closeAllDropdowns();
        };

        const icons = document.createElement("div");
        icons.className = "dropdown-actions-icons";

        const editIcon = document.createElement("i");
        editIcon.className = "fas fa-edit";
        editIcon.title = "Edit";
        editIcon.onclick = (e) => {
          e.stopPropagation();
          const newValue = prompt("Edit Ink Type:", item.ink_type);
          if (newValue) {
            editOption("ink-type", item.ink_type, newValue);
          }
        };

        const deleteIcon = document.createElement("i");
        deleteIcon.className = "fas fa-trash";
        deleteIcon.title = "Delete";
        deleteIcon.onclick = (e) => {
          e.stopPropagation();
          if (confirm(`Delete "${item.ink_type}"?`)) {
            deleteOption("ink-type", item.ink_type);
          }
        };

        icons.appendChild(editIcon);
        icons.appendChild(deleteIcon);
        row.appendChild(text);
        row.appendChild(icons);
        optionsContainer.appendChild(row);
      });

      const saved = sessionStorage.getItem("ink-type");
      if (saved) {
        displaySpan.textContent = saved;
        hiddenInput.value = saved;
        sessionStorage.removeItem("ink-type");
      }
      attachEditDeleteHandlers("ink-type-options", "Ink Type");
    })
    .catch(err => {
      console.error("❌ Error fetching ink types:", err);
    });
}




function fetchDepartments(selectId = "department") {
  fetch("http://localhost:5050/Departments")
    .then(res => res.json())
    .then(data => {
      const optionsContainer = document.getElementById(`${selectId}-options`);
      const displaySpan = document.getElementById(`selected-${selectId}`);
      const hiddenInput = document.getElementById(selectId);

      if (!optionsContainer || !displaySpan || !hiddenInput) {
        console.error(`❌ عناصر الدروب داون غير موجودة لـ: ${selectId}`);
        return;
      }

      optionsContainer.innerHTML = "";

      // ✅ زر إضافة جديد
      const addNewRow = document.createElement("div");
      addNewRow.className = "dropdown-option-row add-new-option";
const lang = languageManager.currentLang;
const t = languageManager.translations[lang];
addNewRow.innerHTML = `<div class="dropdown-option-text">+ ${t['add_new']} ${t['section']}</div>`;
      addNewRow.onclick = () => {
        sessionStorage.setItem("lastDepartmentSelectId", selectId);

        ["spec-name", "spec-serial", "spec-ministry", "spec-model", selectId].forEach(id => {
          const el = document.getElementById(id);
          if (el) sessionStorage.setItem(id, el.value);
        });

        sessionStorage.setItem("lastDropdownOpened", selectId);
        openAddSectionPopup();
        closeAllDropdowns();
      };
      optionsContainer.appendChild(addNewRow);

      // ✅ الأقسام من السيرفر
      data.forEach((item) => {
        const row = document.createElement("div");
        row.className = "dropdown-option-row";

        const text = document.createElement("div");
        text.className = "dropdown-option-text";
        text.textContent = item.name;
        text.onclick = () => {
displaySpan.textContent = item.name;
hiddenInput.value = item.id;
hiddenInput.dataset.name = item.name; // ✅ نحفظ الاسم داخل dataset

          cleanDropdownError(hiddenInput);

          closeAllDropdowns();
          fetchDeviceSpecsByTypeAndDepartment(); // 🔁 لتحديث الأجهزة حسب القسم
        };

        const icons = document.createElement("div");
        icons.className = "dropdown-actions-icons";

        // ✏️ أيقونة التعديل (Edit)
        const editIcon = document.createElement("i");
        editIcon.className = "fas fa-edit";
        editIcon.title = "Edit";
        editIcon.onclick = (e) => {
          e.stopPropagation();
          const oldValue = item.name;
          const newValue = prompt("Edit Section:", oldValue);
          if (newValue && newValue.trim() !== oldValue) {
            editOption("section", oldValue, newValue.trim(), "Department");
          }
        };

        // 🗑️ أيقونة الحذف (Delete)
        const deleteIcon = document.createElement("i");
        deleteIcon.className = "fas fa-trash";
        deleteIcon.title = "Delete";
        deleteIcon.onclick = (e) => {
          e.stopPropagation();
          if (confirm(`Delete "${item.name}"?`)) {
            deleteOption("section", item.name, "Department");
          }
        };

        icons.appendChild(editIcon);
        icons.appendChild(deleteIcon);
        row.appendChild(text);
        row.appendChild(icons);
        optionsContainer.appendChild(row);
      });

      // ✅ استعادة القيمة المخزنة مؤقتًا
      const saved = sessionStorage.getItem(selectId);
      if (saved) {
        displaySpan.textContent = saved;
        hiddenInput.value = saved;
        sessionStorage.removeItem(selectId);
      }

      attachEditDeleteHandlers(`${selectId}-options`, "Department");
    })
    .catch(err => {
      console.error(`❌ Failed to fetch departments for ${selectId}:`, err);
    });
}

function saveNewSection() {
  const sectionName = document.getElementById("new-section-name").value.trim();
  const lang = languageManager.currentLang;
  const t = languageManager.translations[lang];

  if (!sectionName) {
    alert(t['please_enter_section_name']);
    return;
  }

  fetch("http://localhost:5050/AddDepartment", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem('token')}` },
    body: JSON.stringify({ department_name: sectionName })
  })
    .then(res => res.json())
    .then(result => {
      if (result.error) {
        if (result.error === "already_exists") {
          alert(t['department_already_exists']);
        } else {
          console.error(`⚠️ ${t['unexpected_error']}:`, result.error);
        }
        return;
      }

      const selectId = sessionStorage.getItem("lastDropdownOpened");
      if (selectId) {
        const displaySpan = document.getElementById(`selected-${selectId}`);
        const hiddenInput = document.getElementById(selectId);
        if (displaySpan && hiddenInput) {
          displaySpan.textContent = sectionName;
          hiddenInput.value = sectionName;
          sessionStorage.setItem(selectId, sectionName);
        }
      }

      closeGenericPopup();
      refreshDropdown(selectId);
    })
    .catch(err => {
      console.error(`❌ ${t['server_connection_error']}:`, err);
    });
}

function fetchRAMSize() {
  fetch("http://localhost:5050/RAM_Sizes")
    .then(res => res.json())
    .then(data => {
      const optionsContainer = document.getElementById("ram-size-select-options");
      const displaySpan = document.getElementById("selected-ram-size-select");
      const hiddenInput = document.getElementById("ram-size-select");
      const lang = languageManager.currentLang;
      const t = languageManager.translations[lang];

      if (!optionsContainer || !displaySpan || !hiddenInput) return;

      optionsContainer.innerHTML = "";

      const addNewRow = document.createElement("div");
      addNewRow.className = "dropdown-option-row add-new-option";
      addNewRow.innerHTML = `<div class="dropdown-option-text">+ ${t['add_new_ram_size']}</div>`;
      addNewRow.onclick = () => {
        sessionStorage.setItem("lastDropdownOpened", "ram-size-select");
        openAddOptionPopup("ram-size-select");
        closeAllDropdowns();
      };
      optionsContainer.appendChild(addNewRow);

      data.forEach(item => {
        const row = document.createElement("div");
        row.className = "dropdown-option-row";

        const text = document.createElement("div");
        text.className = "dropdown-option-text";
        text.textContent = item.ram_size;
        text.onclick = () => {
          displaySpan.textContent = item.ram_size;
          hiddenInput.value = item.ram_size;
          cleanDropdownError(hiddenInput);
          closeAllDropdowns();
        };

        const icons = document.createElement("div");
        icons.className = "dropdown-actions-icons";

        const editIcon = document.createElement("i");
        editIcon.className = "fas fa-edit";
        editIcon.title = t['edit'];
        editIcon.onclick = (e) => {
          e.stopPropagation();
          const newValue = prompt(`${t['edit']} ${t['ram_size']}:`, item.ram_size);
          if (newValue) {
            editOption("ram-size-select", item.ram_size, newValue);
          }
        };

        const deleteIcon = document.createElement("i");
        deleteIcon.className = "fas fa-trash";
        deleteIcon.title = t['delete'];
        deleteIcon.onclick = (e) => {
          e.stopPropagation();
          if (confirm(`${t['confirm_delete']} "${item.ram_size}"?`)) {
            deleteOption("ram-size-select", item.ram_size);
          }
        };

        icons.appendChild(editIcon);
        icons.appendChild(deleteIcon);
        row.appendChild(text);
        row.appendChild(icons);
        optionsContainer.appendChild(row);
      });

      const saved = sessionStorage.getItem("ram-size-select");
      if (saved) {
        displaySpan.textContent = saved;
        hiddenInput.value = saved;
        sessionStorage.removeItem("ram-size-select");
      }
      attachEditDeleteHandlers("ram-size-select-options", t['ram_size']);
    })
    .catch(err => {
      console.error(`❌ ${t['error_fetching_ram_sizes']}:`, err);
    });
}

function fetchDrives() {
  fetch("http://localhost:5050/Hard_Drive_Types")
    .then(res => res.json())
    .then(data => {
      const optionsContainer = document.getElementById("drive-select-options");
      const displaySpan = document.getElementById("selected-drive-select");
      const hiddenInput = document.getElementById("drive-select");
      const lang = languageManager.currentLang;
      const t = languageManager.translations[lang];

      if (!optionsContainer || !displaySpan || !hiddenInput) return;

      optionsContainer.innerHTML = "";

      const addNewRow = document.createElement("div");
      addNewRow.className = "dropdown-option-row add-new-option";
      addNewRow.innerHTML = `<div class="dropdown-option-text">+ ${t['add_new_hard_drive']}</div>`;
      addNewRow.onclick = () => {
        sessionStorage.setItem("lastDropdownOpened", "drive-select");
        openAddOptionPopup("drive-select");
        closeAllDropdowns();
      };
      optionsContainer.appendChild(addNewRow);

      data.forEach(item => {
        const row = document.createElement("div");
        row.className = "dropdown-option-row";

        const text = document.createElement("div");
        text.className = "dropdown-option-text";
        text.textContent = item.drive_type;
        text.onclick = () => {
          displaySpan.textContent = item.drive_type;
          hiddenInput.value = item.drive_type;
          cleanDropdownError(hiddenInput);
          closeAllDropdowns();
        };

        const icons = document.createElement("div");
        icons.className = "dropdown-actions-icons";

        const editIcon = document.createElement("i");
        editIcon.className = "fas fa-edit";
        editIcon.title = t['edit'];
        editIcon.onclick = (e) => {
          e.stopPropagation();
          const newValue = prompt(`${t['edit']} ${t['hard_drive']}:`, item.drive_type);
          if (newValue) {
            editOption("drive-select", item.drive_type, newValue);
          }
        };

        const deleteIcon = document.createElement("i");
        deleteIcon.className = "fas fa-trash";
        deleteIcon.title = t['delete'];
        deleteIcon.onclick = (e) => {
          e.stopPropagation();
          if (confirm(`${t['confirm_delete']} "${item.drive_type}"?`)) {
            deleteOption("drive-select", item.drive_type);
          }
        };

        icons.appendChild(editIcon);
        icons.appendChild(deleteIcon);
        row.appendChild(text);
        row.appendChild(icons);
        optionsContainer.appendChild(row);
      });

      const saved = sessionStorage.getItem("drive-select");
      if (saved) {
        displaySpan.textContent = saved;
        hiddenInput.value = saved;
        sessionStorage.removeItem("drive-select");
      }
      attachEditDeleteHandlers("drive-select-options", t['hard_drive']);
    })
    .catch(err => {
      console.error(`❌ ${t['error_fetching_drives']}:`, err);
    });
}



function fetchCPU() {
  fetch("http://localhost:5050/CPU_Types")
    .then(res => res.json())
    .then(data => {
      const optionsContainer = document.getElementById("cpu-select-options");
      const displaySpan = document.getElementById("selected-cpu-select");
      const hiddenInput = document.getElementById("cpu-select");
      const lang = languageManager.currentLang;
      const t = languageManager.translations[lang];

      if (!optionsContainer || !displaySpan || !hiddenInput) return;

      optionsContainer.innerHTML = "";

      const addNewRow = document.createElement("div");
      addNewRow.className = "dropdown-option-row add-new-option";
      addNewRow.innerHTML = `<div class="dropdown-option-text">+ ${t['add_new_processor']}</div>`;
      addNewRow.onclick = () => {
        sessionStorage.setItem("lastDropdownOpened", "cpu-select");
        openAddOptionPopup("cpu-select");
        closeAllDropdowns();
      };
      optionsContainer.appendChild(addNewRow);

      data.forEach(item => {
        const row = document.createElement("div");
        row.className = "dropdown-option-row";

        const text = document.createElement("div");
        text.className = "dropdown-option-text";
        text.textContent = item.cpu_name;
        text.onclick = () => {
          displaySpan.textContent = item.cpu_name;
          hiddenInput.value = item.cpu_name;
          cleanDropdownError(hiddenInput);
          closeAllDropdowns();
        };

        const icons = document.createElement("div");
        icons.className = "dropdown-actions-icons";

        const editIcon = document.createElement("i");
        editIcon.className = "fas fa-edit";
        editIcon.title = t['edit'];
        editIcon.onclick = (e) => {
          e.stopPropagation();
          const newValue = prompt(`${t['edit']} ${t['processor']}:`, item.cpu_name);
          if (newValue) {
            editOption("cpu-select", item.cpu_name, newValue);
          }
        };

        const deleteIcon = document.createElement("i");
        deleteIcon.className = "fas fa-trash";
        deleteIcon.title = t['delete'];
        deleteIcon.onclick = (e) => {
          e.stopPropagation();
          if (confirm(`${t['confirm_delete']} "${item.cpu_name}"?`)) {
            deleteOption("cpu-select", item.cpu_name);
          }
        };

        icons.appendChild(editIcon);
        icons.appendChild(deleteIcon);
        row.appendChild(text);
        row.appendChild(icons);
        optionsContainer.appendChild(row);
      });

      const saved = sessionStorage.getItem("cpu-select");
      if (saved) {
        displaySpan.textContent = saved;
        hiddenInput.value = saved;
        sessionStorage.removeItem("cpu-select");
      }
      attachEditDeleteHandlers("cpu-select-options", t['processor']);
    })
    .catch(err => {
      console.error(`❌ ${t['error_fetching_processors']}:`, err);
    });
}

function fetchRAM() {
  fetch("http://localhost:5050/RAM_Types")
    .then(res => res.json())
    .then(data => {
      const optionsContainer = document.getElementById("ram-select-options");
      const displaySpan = document.getElementById("selected-ram-select");
      const hiddenInput = document.getElementById("ram-select");
      const lang = languageManager.currentLang;
      const t = languageManager.translations[lang];

      if (!optionsContainer || !displaySpan || !hiddenInput) return;

      optionsContainer.innerHTML = "";

      const addNewRow = document.createElement("div");
      addNewRow.className = "dropdown-option-row add-new-option";
      addNewRow.innerHTML = `<div class="dropdown-option-text">+ ${t['add_new_ram']}</div>`;
      addNewRow.onclick = () => {
        sessionStorage.setItem("lastDropdownOpened", "ram-select");
        openAddOptionPopup("ram-select");
        closeAllDropdowns();
      };
      optionsContainer.appendChild(addNewRow);

      data.forEach(item => {
        const row = document.createElement("div");
        row.className = "dropdown-option-row";

        const text = document.createElement("div");
        text.className = "dropdown-option-text";
        text.textContent = item.ram_type;
        text.onclick = () => {
          displaySpan.textContent = item.ram_type;
          hiddenInput.value = item.ram_type;
          cleanDropdownError(hiddenInput);
          closeAllDropdowns();
        };

        const icons = document.createElement("div");
        icons.className = "dropdown-actions-icons";

        const editIcon = document.createElement("i");
        editIcon.className = "fas fa-edit";
        editIcon.title = t['edit'];
        editIcon.onclick = (e) => {
          e.stopPropagation();
          const newValue = prompt(`${t['edit']} ${t['ram']}:`, item.ram_type);
          if (newValue) {
            editOption("ram-select", item.ram_type, newValue);
          }
        };

        const deleteIcon = document.createElement("i");
        deleteIcon.className = "fas fa-trash";
        deleteIcon.title = t['delete'];
        deleteIcon.onclick = (e) => {
          e.stopPropagation();
          if (confirm(`${t['confirm_delete']} "${item.ram_type}"?`)) {
            deleteOption("ram-select", item.ram_type);
          }
        };

        icons.appendChild(editIcon);
        icons.appendChild(deleteIcon);
        row.appendChild(text);
        row.appendChild(icons);
        optionsContainer.appendChild(row);
      });

      const saved = sessionStorage.getItem("ram-select");
      if (saved) {
        displaySpan.textContent = saved;
        hiddenInput.value = saved;
        sessionStorage.removeItem("ram-select");
      }
      attachEditDeleteHandlers("ram-select-options", t['ram']);
    })
    .catch(err => {
      console.error(`❌ ${t['error_fetching_ram_types']}:`, err);
    });
}

function fetchOS() {
  fetch("http://localhost:5050/OS_Types")
    .then(res => res.json())
    .then(data => {
      const optionsContainer = document.getElementById("os-select-options");
      const displaySpan = document.getElementById("selected-os-select");
      const hiddenInput = document.getElementById("os-select");
      const lang = languageManager.currentLang;
      const t = languageManager.translations[lang];

      if (!optionsContainer || !displaySpan || !hiddenInput) return;

      optionsContainer.innerHTML = "";

      const addNewRow = document.createElement("div");
      addNewRow.className = "dropdown-option-row add-new-option";
      addNewRow.innerHTML = `<div class="dropdown-option-text">+ ${t['add_new_os']}</div>`;
      addNewRow.onclick = () => {
        sessionStorage.setItem("lastDropdownOpened", "os-select");
        openAddOptionPopup("os-select");
        closeAllDropdowns();
      };
      optionsContainer.appendChild(addNewRow);

      data.forEach(item => {
        const row = document.createElement("div");
        row.className = "dropdown-option-row";

        const text = document.createElement("div");
        text.className = "dropdown-option-text";
        text.textContent = item.os_name;
        text.onclick = () => {
          displaySpan.textContent = item.os_name;
          hiddenInput.value = item.os_name;
          cleanDropdownError(hiddenInput);
          closeAllDropdowns();
        };

        const icons = document.createElement("div");
        icons.className = "dropdown-actions-icons";

        const editIcon = document.createElement("i");
        editIcon.className = "fas fa-edit";
        editIcon.title = t['edit'];
        editIcon.onclick = (e) => {
          e.stopPropagation();
          const newValue = prompt(`${t['edit']} ${t['operating_system']}:`, item.os_name);
          if (newValue) {
            editOption("os-select", item.os_name, newValue);
          }
        };

        const deleteIcon = document.createElement("i");
        deleteIcon.className = "fas fa-trash";
        deleteIcon.title = t['delete'];
        deleteIcon.onclick = (e) => {
          e.stopPropagation();
          if (confirm(`${t['confirm_delete']} "${item.os_name}"?`)) {
            deleteOption("os-select", item.os_name);
          }
        };

        icons.appendChild(editIcon);
        icons.appendChild(deleteIcon);
        row.appendChild(text);
        row.appendChild(icons);
        optionsContainer.appendChild(row);
      });

      const saved = sessionStorage.getItem("os-select");
      if (saved) {
        displaySpan.textContent = saved;
        hiddenInput.value = saved;
        sessionStorage.removeItem("os-select");
      }
      attachEditDeleteHandlers("os-select-options", t['operating_system']);
    })
    .catch(err => {
      console.error(`❌ ${t['error_fetching_os_types']}:`, err);
    });
}

function fetchProcessorGen() {
  fetch("http://localhost:5050/Processor_Generations")
    .then(res => res.json())
    .then(data => {
      const optionsContainer = document.getElementById("generation-select-options");
      const displaySpan = document.getElementById("selected-generation-select");
      const hiddenInput = document.getElementById("generation-select");
      const lang = languageManager.currentLang;
      const t = languageManager.translations[lang];

      if (!optionsContainer || !displaySpan || !hiddenInput) return;

      optionsContainer.innerHTML = "";

      const addNewRow = document.createElement("div");
      addNewRow.className = "dropdown-option-row add-new-option";
      addNewRow.innerHTML = `<div class="dropdown-option-text">+ ${t['add_new_generation']}</div>`;
      addNewRow.onclick = () => {
        sessionStorage.setItem("lastDropdownOpened", "generation-select");
        openAddOptionPopup("generation-select");
        closeAllDropdowns();
      };
      optionsContainer.appendChild(addNewRow);

      data.forEach(item => {
        const row = document.createElement("div");
        row.className = "dropdown-option-row";

        const text = document.createElement("div");
        text.className = "dropdown-option-text";
        text.textContent = item.generation_number;
        text.onclick = () => {
          displaySpan.textContent = item.generation_number;
          hiddenInput.value = item.generation_number;
          cleanDropdownError(hiddenInput);
          closeAllDropdowns();
        };

        const icons = document.createElement("div");
        icons.className = "dropdown-actions-icons";

        const editIcon = document.createElement("i");
        editIcon.className = "fas fa-edit";
        editIcon.title = t['edit'];
        editIcon.onclick = (e) => {
          e.stopPropagation();
          const newValue = prompt(`${t['edit']} ${t['processor_generation']}:`, item.generation_number);
          if (newValue) {
            editOption("generation-select", item.generation_number, newValue);
          }
        };

        const deleteIcon = document.createElement("i");
        deleteIcon.className = "fas fa-trash";
        deleteIcon.title = t['delete'];
        deleteIcon.onclick = (e) => {
          e.stopPropagation();
          if (confirm(`${t['confirm_delete']} "${item.generation_number}"?`)) {
            deleteOption("generation-select", item.generation_number);
          }
        };

        icons.appendChild(editIcon);
        icons.appendChild(deleteIcon);
        row.appendChild(text);
        row.appendChild(icons);
        optionsContainer.appendChild(row);
      });

      const saved = sessionStorage.getItem("generation-select");
      if (saved) {
        displaySpan.textContent = saved;
        hiddenInput.value = saved;
        sessionStorage.removeItem("generation-select");
      }
      attachEditDeleteHandlers("generation-select-options", t['processor_generation']);
    })
    .catch(err => {
      console.error(`❌ ${t['error_fetching_generations']}:`, err);
    });
}

function fetchRAMSize() {
  fetch("http://localhost:5050/RAM_Sizes")
    .then(res => res.json())
    .then(data => {
      const optionsContainer = document.getElementById("ram-size-select-options");
      const displaySpan = document.getElementById("selected-ram-size-select");
      const hiddenInput = document.getElementById("ram-size-select");
      const lang = languageManager.currentLang;
      const t = languageManager.translations[lang];

      if (!optionsContainer || !displaySpan || !hiddenInput) return;

      optionsContainer.innerHTML = "";

      const addNewRow = document.createElement("div");
      addNewRow.className = "dropdown-option-row add-new-option";
      addNewRow.innerHTML = `<div class="dropdown-option-text">+ ${t['add_new_ram_size']}</div>`;
      addNewRow.onclick = () => {
        sessionStorage.setItem("lastDropdownOpened", "ram-size-select");
        openAddOptionPopup("ram-size-select");
        closeAllDropdowns();
      };
      optionsContainer.appendChild(addNewRow);

      data.forEach(item => {
        const row = document.createElement("div");
        row.className = "dropdown-option-row";

        const text = document.createElement("div");
        text.className = "dropdown-option-text";
        text.textContent = item.ram_size;
        text.onclick = () => {
          displaySpan.textContent = item.ram_size;
          hiddenInput.value = item.ram_size;
          cleanDropdownError(hiddenInput);
          closeAllDropdowns();
        };

        const icons = document.createElement("div");
        icons.className = "dropdown-actions-icons";

        const editIcon = document.createElement("i");
        editIcon.className = "fas fa-edit";
        editIcon.title = t['edit'];
        editIcon.onclick = (e) => {
          e.stopPropagation();
          const newValue = prompt(`${t['edit']} ${t['ram_size']}:`, item.ram_size);
          if (newValue) {
            editOption("ram-size-select", item.ram_size, newValue);
          }
        };

        const deleteIcon = document.createElement("i");
        deleteIcon.className = "fas fa-trash";
        deleteIcon.title = t['delete'];
        deleteIcon.onclick = (e) => {
          e.stopPropagation();
          if (confirm(`${t['confirm_delete']} "${item.ram_size}"?`)) {
            deleteOption("ram-size-select", item.ram_size);
          }
        };

        icons.appendChild(editIcon);
        icons.appendChild(deleteIcon);
        row.appendChild(text);
        row.appendChild(icons);
        optionsContainer.appendChild(row);
      });

      const saved = sessionStorage.getItem("ram-size-select");
      if (saved) {
        displaySpan.textContent = saved;
        hiddenInput.value = saved;
        sessionStorage.removeItem("ram-size-select");
      }
      attachEditDeleteHandlers("ram-size-select-options", t['ram_size']);
    });
}

function fetchPrinterTypes() {
  fetch("http://localhost:5050/Printer_Types")
    .then(res => res.json())
    .then(data => {
      const optionsContainer = document.getElementById("printer-type-options");
      const displaySpan = document.getElementById("selected-printer-type");
      const hiddenInput = document.getElementById("printer-type");
      const lang = languageManager.currentLang;
      const t = languageManager.translations[lang];

      if (!optionsContainer || !displaySpan || !hiddenInput) return;

      optionsContainer.innerHTML = "";

      const addNewRow = document.createElement("div");
      addNewRow.className = "dropdown-option-row add-new-option";
      addNewRow.innerHTML = `<div class="dropdown-option-text">+ ${t['add_new_printer_type']}</div>`;
      addNewRow.onclick = () => {
        sessionStorage.setItem("lastDropdownOpened", "printer-type");
        openAddOptionPopup("printer-type");
        closeAllDropdowns();
      };
      optionsContainer.appendChild(addNewRow);

      data.forEach(item => {
        const row = document.createElement("div");
        row.className = "dropdown-option-row";

        const text = document.createElement("div");
        text.className = "dropdown-option-text";
        text.textContent = item.printer_type;
        text.onclick = () => {
          displaySpan.textContent = item.printer_type;
          hiddenInput.value = item.printer_type;
          cleanDropdownError(hiddenInput);
          closeAllDropdowns();
        };

        const icons = document.createElement("div");
        icons.className = "dropdown-actions-icons";

        const editIcon = document.createElement("i");
        editIcon.className = "fas fa-edit";
        editIcon.title = t['edit'];
        editIcon.onclick = (e) => {
          e.stopPropagation();
          const newValue = prompt(`${t['edit']} ${t['printer_type']}:`, item.printer_type);
          if (newValue) {
            editOption("printer-type", item.printer_type, newValue);
          }
        };

        const deleteIcon = document.createElement("i");
        deleteIcon.className = "fas fa-trash";
        deleteIcon.title = t['delete'];
        deleteIcon.onclick = (e) => {
          e.stopPropagation();
          if (confirm(`${t['confirm_delete']} "${item.printer_type}"?`)) {
            deleteOption("printer-type", item.printer_type);
          }
        };

        icons.appendChild(editIcon);
        icons.appendChild(deleteIcon);
        row.appendChild(text);
        row.appendChild(icons);
        optionsContainer.appendChild(row);
      });

      const saved = sessionStorage.getItem("printer-type");
      if (saved) {
        displaySpan.textContent = saved;
        hiddenInput.value = saved;
        sessionStorage.removeItem("printer-type");
      }
      attachEditDeleteHandlers("printer-type-options", t['printer_type']);
    });
}

function fetchInkTypes() {
  fetch("http://localhost:5050/Ink_Types")
    .then(res => res.json())
    .then(data => {
      const optionsContainer = document.getElementById("ink-type-options");
      const displaySpan = document.getElementById("selected-ink-type");
      const hiddenInput = document.getElementById("ink-type");
      const lang = languageManager.currentLang;
      const t = languageManager.translations[lang];

      if (!optionsContainer || !displaySpan || !hiddenInput) return;

      optionsContainer.innerHTML = "";

      const addNewRow = document.createElement("div");
      addNewRow.className = "dropdown-option-row add-new-option";
      addNewRow.innerHTML = `<div class="dropdown-option-text">+ ${t['add_new_ink_type']}</div>`;
      addNewRow.onclick = () => {
        sessionStorage.setItem("lastDropdownOpened", "ink-type");
        openAddOptionPopup("ink-type");
        closeAllDropdowns();
      };
      optionsContainer.appendChild(addNewRow);

      data.forEach(item => {
        const row = document.createElement("div");
        row.className = "dropdown-option-row";

        const text = document.createElement("div");
        text.className = "dropdown-option-text";
        text.textContent = item.ink_type;
        text.onclick = () => {
          displaySpan.textContent = item.ink_type;
          hiddenInput.value = item.ink_type;
          cleanDropdownError(hiddenInput);
          closeAllDropdowns();
        };

        const icons = document.createElement("div");
        icons.className = "dropdown-actions-icons";

        const editIcon = document.createElement("i");
        editIcon.className = "fas fa-edit";
        editIcon.title = t['edit'];
        editIcon.onclick = (e) => {
          e.stopPropagation();
          const newValue = prompt(`${t['edit']} ${t['ink_type']}:`, item.ink_type);
          if (newValue) {
            editOption("ink-type", item.ink_type, newValue);
          }
        };

        const deleteIcon = document.createElement("i");
        deleteIcon.className = "fas fa-trash";
        deleteIcon.title = t['delete'];
        deleteIcon.onclick = (e) => {
          e.stopPropagation();
          if (confirm(`${t['confirm_delete']} "${item.ink_type}"?`)) {
            deleteOption("ink-type", item.ink_type);
          }
        };

        icons.appendChild(editIcon);
        icons.appendChild(deleteIcon);
        row.appendChild(text);
        row.appendChild(icons);
        optionsContainer.appendChild(row);
      });

      const saved = sessionStorage.getItem("ink-type");
      if (saved) {
        displaySpan.textContent = saved;
        hiddenInput.value = saved;
        sessionStorage.removeItem("ink-type");
      }
      attachEditDeleteHandlers("ink-type-options", t['ink_type']);
    });
}

function fetchScannerTypes() {
  fetch("http://localhost:5050/Scanner_Types")
    .then(res => res.json())
    .then(data => {
      const optionsContainer = document.getElementById("scanner-type-options");
      const displaySpan = document.getElementById("selected-scanner-type");
      const hiddenInput = document.getElementById("scanner-type");
      const lang = languageManager.currentLang;
      const t = languageManager.translations[lang];

      if (!optionsContainer || !displaySpan || !hiddenInput) return;

      optionsContainer.innerHTML = "";

      const addNewRow = document.createElement("div");
      addNewRow.className = "dropdown-option-row add-new-option";
      addNewRow.innerHTML = `<div class="dropdown-option-text">+ ${t['add_new_scanner_type']}</div>`;
      addNewRow.onclick = () => {
        sessionStorage.setItem("lastDropdownOpened", "scanner-type");
        openAddOptionPopup("scanner-type");
        closeAllDropdowns();
      };
      optionsContainer.appendChild(addNewRow);

      data.forEach(item => {
        const row = document.createElement("div");
        row.className = "dropdown-option-row";

        const text = document.createElement("div");
        text.className = "dropdown-option-text";
        text.textContent = item.scanner_type;
        text.onclick = () => {
          displaySpan.textContent = item.scanner_type;
          hiddenInput.value = item.scanner_type;
          cleanDropdownError(hiddenInput);
          closeAllDropdowns();
        };

        const icons = document.createElement("div");
        icons.className = "dropdown-actions-icons";

        const editIcon = document.createElement("i");
        editIcon.className = "fas fa-edit";
        editIcon.title = t['edit'];
        editIcon.onclick = (e) => {
          e.stopPropagation();
          const newValue = prompt(`${t['edit']} ${t['scanner_type']}:`, item.scanner_type);
          if (newValue) {
            editOption("scanner-type", item.scanner_type, newValue);
          }
        };

        const deleteIcon = document.createElement("i");
        deleteIcon.className = "fas fa-trash";
        deleteIcon.title = t['delete'];
        deleteIcon.onclick = (e) => {
          e.stopPropagation();
          if (confirm(`${t['confirm_delete']} "${item.scanner_type}"?`)) {
            deleteOption("scanner-type", item.scanner_type);
          }
        };

        icons.appendChild(editIcon);
        icons.appendChild(deleteIcon);
        row.appendChild(text);
        row.appendChild(icons);
        optionsContainer.appendChild(row);
      });

      const saved = sessionStorage.getItem("scanner-type");
      if (saved) {
        displaySpan.textContent = saved;
        hiddenInput.value = saved;
        sessionStorage.removeItem("scanner-type");
      }
      attachEditDeleteHandlers("scanner-type-options", t['scanner_type']);
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

  const value = document.getElementById("generic-popup-input").value.trim();
  const targetId = document.getElementById("generic-popup-target-id").value;
  const dropdown = document.getElementById(targetId);

  if (!value || !dropdown) return;

  fetch("http://localhost:5050/add-option-general", {
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
        alert(t[result.error] || result.error); // ✅ إذا كان الخطأ موجود في الترجمة استخدمه
      } else {
        // ✅ تحديث الخيارات بعد الإضافة
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

        // ✅ حفظ القيمة لاختيارها تلقائيًا بعد التحديث
        sessionStorage.setItem(targetId, value);

        closeGenericPopup();
      }
    })
    .catch(err => {
      console.error("❌ Error saving new option:", err);
      alert(t['failed_to_save'] || "Failed to save");
    });
}


function fetchDeviceTypes() {
  fetch("http://localhost:5050/TypeProplem", {
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

      const addNewRow = document.createElement("div");
      addNewRow.className = "dropdown-option-row add-new-option";
      addNewRow.innerHTML = `
      <div class="dropdown-option-text">+ ${translations['add_new']} ${translations['device_type']}</div>
    `;
      addNewRow.onclick = () => {
        sessionStorage.setItem("lastDropdownOpened", "device-type");
        const el = document.getElementById("device-type");
        if (el) sessionStorage.setItem("device-type", el.value);
        openGenericPopup("device_type", "device-type");
        closeAllDropdowns();
      };

      container.appendChild(addNewRow);

      data.deviceTypes.forEach((item) => {
        const row = document.createElement("div");
        row.className = "dropdown-option-row";

        const text = document.createElement("div");
        text.className = "dropdown-option-text";
        text.textContent = item.DeviceType;
        text.onclick = () => {
          selectedDisplay.textContent = item.DeviceType;
          hiddenInput.value = item.DeviceType;

          const specDisplay = document.getElementById("selected-device-spec");
          const specInput = document.getElementById("device-spec");
          if (specDisplay && specInput) {
            specDisplay.textContent = translations['select_specification'];
            specInput.value = "";
            cleanDropdownError(specInput);
          }

          cleanDropdownError(hiddenInput);
          closeAllDropdowns();
          fetchDeviceSpecsByTypeAndDepartment();

        };

        const icons = document.createElement("div");
        icons.className = "dropdown-actions-icons";

        const editIcon = document.createElement("i");
        editIcon.className = "fas fa-edit";
        editIcon.title = translations['edit'];
        editIcon.onclick = (e) => {
          e.stopPropagation();
          const newValue = prompt(`${translations['edit']} ${translations['device_type']}:`, item.DeviceType);
          if (newValue && newValue.trim() !== item.DeviceType) {
            editOption("problem-type", item.DeviceType, newValue.trim());
          }
        };

        const deleteIcon = document.createElement("i");
        deleteIcon.className = "fas fa-trash";
        deleteIcon.title = translations['delete'];
        deleteIcon.onclick = (e) => {
          e.stopPropagation();
          if (confirm(`${translations['confirm_delete']} "${item.DeviceType}"?`)) {
            deleteOption("problem-type", item.DeviceType);
          }
        };

        icons.appendChild(editIcon);
        icons.appendChild(deleteIcon);
        row.appendChild(text);
        row.appendChild(icons);
        container.appendChild(row);
      });

      if (data.role === 'admin') {
        const allRow = document.createElement("div");
        allRow.className = "dropdown-option-row";
        allRow.innerHTML = `<div class="dropdown-option-text">${translations['all_devices']}</div>`;
        allRow.onclick = () => {
          selectedDisplay.textContent = translations['all_devices'];
          hiddenInput.value = "all-devices";
          closeAllDropdowns();
          fetchDeviceSpecsByTypeAndDepartment(true);
        };
        container.appendChild(allRow);
      }

      const savedDeviceType = sessionStorage.getItem("device-type");
      if (savedDeviceType) {
        selectedDisplay.textContent = savedDeviceType;
        hiddenInput.value = savedDeviceType;
        sessionStorage.removeItem("device-type");
      }

      attachEditDeleteHandlers("device-type-options", "problem-type");
    })
    .catch(err => {
      console.error("❌ Failed to fetch device types:", err);
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
  const department = document.getElementById("section").value;

  if (!type || !department) {
    alert("❌ تأكد من اختيار نوع الجهاز والقسم");
    return;
  }

  fetch(`http://localhost:5050/devices/${type}/${department}`)
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





function fetchDeviceSpecsByTypeAndDepartment() {
  const type = document.getElementById("device-type").value?.toLowerCase();
const dept = document.getElementById("section").dataset.name;
  const optionsContainer = document.getElementById("device-spec-options");
  const displaySpan = document.getElementById("selected-device-spec");
  const hiddenInput = document.getElementById("device-spec");

  if (type === "all-devices") {
    fetch(`http://localhost:5050/all-devices-specs`)
      .then(res => res.json())
      .then(data => {
        optionsContainer.innerHTML = "";

        data.forEach(device => {
          const text = `${device.name} | ${device.Serial_Number} | ${device.Governmental_Number} (${device.device_type})`;
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
      .catch(err => {
        console.error("❌ Error fetching all device specs:", err);
      });
    return; // نوقف
  }


  if (!type || !dept || !optionsContainer || !displaySpan || !hiddenInput) return;

  optionsContainer.innerHTML = "";

  // + Add New Specification
  const addNewRow = document.createElement("div");
  addNewRow.className = "dropdown-option-row add-new-option";
const lang = languageManager.currentLang;
const t = languageManager.translations[lang];
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

  fetch(`http://localhost:5050/devices/${type}/${encodeURIComponent(dept)}`)
    .then(res => res.json())
    .then(data => {
      if (!Array.isArray(data) || data.length === 0) {
        const noData = document.createElement("div");
        noData.className = "dropdown-option-row";
        noData.innerHTML = `<div class="dropdown-option-text">No specifications found</div>`;
        optionsContainer.appendChild(noData);
        return;
      }

      data.forEach(device => {
        const text = `${device.name || "Unnamed"} | ${device.Serial_Number} | ${device.Governmental_Number}`;
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

      // ✅ Restore from sessionStorage
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
    .catch(err => {
      console.error("❌ Error fetching specs:", err);
    });
}



document.addEventListener("DOMContentLoaded", () => {
  fetchDeviceTypes();
  fetchDepartments("section");
  const typeDropdown = document.getElementById("device-type");
  const sectionDropdown = document.getElementById("section");

  if (typeDropdown && sectionDropdown) {
    typeDropdown.addEventListener("change", () => {
      fetchDeviceSpecsByTypeAndDepartment();

      const type = typeDropdown?.value?.toLowerCase();
      if (type) fetchProblemStatus(type); // ✅ جلب حالة الأعطال حسب نوع الجهاز
    });

    sectionDropdown.addEventListener("change", () => {
      fetchDeviceSpecsByTypeAndDepartment();
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


document.querySelector("form").addEventListener("submit", async function (e) {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);
  const data = {};
  let hasError = false;

  const errorMappings = {
    "device-type": "selected-device-type",
    "section": "selected-section",
    "device-spec": "selected-device-spec"
  };

  // 🧼 تنظيف الأخطاء
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
    const isRadio = input.type === "radio";
    const isEmpty = isRadio
      ? !form.querySelector(`input[name="${input.name}"]:checked`)
      : !input.value.trim();

    if (isEmpty) {
      const msg = document.createElement("div");
      msg.className = "input-error-message";
      msg.textContent = "This field is required";

      if (!isHidden && !isRadio) {
        input.classList.add("input-error");
        if (!input.nextElementSibling?.classList.contains("input-error-message")) {
          input.insertAdjacentElement("afterend", msg);
        }
      } else if (isRadio) {
        const radioGroup = form.querySelectorAll(`input[name="${input.name}"]`);
        const parent = radioGroup[0]?.closest(".form-group");
        if (parent && !parent.querySelector(".input-error-message")) {
          parent.insertAdjacentElement("beforeend", msg);
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

  if (hasError) return;

  // ✅ تحويل FormData إلى JSON
  formData.forEach((value, key) => {
    if (data[key]) {
      if (!Array.isArray(data[key])) {
        data[key] = [data[key]];
      }
      data[key].push(value);
    } else {
      data[key] = value;
    }
  });

  const token = localStorage.getItem('token');

  try {
    const response = await fetch("http://localhost:5050/external-ticket-with-file", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) throw new Error(result.error || "Unknown error");

    location.reload();
  } catch (err) {
    console.error("❌ Submission error:", err);
  }
});

function mapSelectIdToServerTarget(selectId) {
  const map = {
    "device-type": "problem-type",
    "technical-status": "technical",
    "problem-status": "problem-status",
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


function deleteOption(selectId, value, type = null) {
  const lang = languageManager.currentLang;
  const t = languageManager.translations[lang];

  if (!value) {
    alert(t['please_select_valid_option']);
    return;
  }

  if (!confirm(`${t['confirm_delete']} "${value}"?`)) {
    return;
  }

  fetch("http://localhost:5050/delete-option-complete", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem('token')}` },
    body: JSON.stringify({ target: mapSelectIdToServerTarget(selectId), value, type })
  })
    .then(res => res.json())
    .then(result => {
      if (result.error) {
        alert(result.error);
      } else {
        refreshDropdown(selectId);
      }
    })
    .catch(err => {
      console.error("❌ Error deleting option:", err);
      alert(t['failed_to_delete_option']);
    });
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
  // -------------------
  else {
    console.warn(`❓ Unknown selectId for refreshing: ${selectId}`);
  }
}

function editOption(selectId, oldValue, newValue, type = null) {
  const lang = languageManager.currentLang;
  const t = languageManager.translations[lang];

  if (!oldValue || !newValue) {
    alert(t['please_select_and_enter_valid_value']);
    return;
  }

  fetch("http://localhost:5050/update-option-complete", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem('token')}` },
    body: JSON.stringify({ target: mapSelectIdToServerTarget(selectId), oldValue, newValue, type })
  })
    .then(res => res.json())
    .then(result => {
      if (result.error) {
        alert(result.error);
      } else {
        refreshDropdown(selectId);
      }
    })
    .catch(err => {
      console.error("❌ Error editing option:", err);
      alert(t['failed_to_edit_option']);
    });
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
        const newValue = prompt(`Edit "${oldValue}"`, oldValue);
        if (newValue && newValue.trim() !== oldValue) {
          editOption(optionsContainerId.replace("-options", ""), oldValue, newValue.trim(), type);
        }
      };

      const deleteIcon = document.createElement("i");
      deleteIcon.className = "fas fa-trash";
      deleteIcon.title = "Delete";
      deleteIcon.style.cursor = "pointer";
      deleteIcon.onclick = (e) => {
        e.stopPropagation();
        const valueToDelete = textEl.textContent.trim();
        deleteOption(optionsContainerId.replace("-options", ""), valueToDelete, type);

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
    fetch("http://localhost:5050/Departments")
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
}function openAddSectionPopup(contextId = "section") {
  const lang = languageManager.currentLang;
  const t = languageManager.translations[lang];

  sessionStorage.setItem("addSectionContext", contextId);

  const origin = document.getElementById("generic-popup-target-id")?.value;
  if (origin === "device-spec") {
    sessionStorage.setItem("returnToPopup", "true");
    sessionStorage.setItem("popupContext", "device-spec");
  }

  const popup = document.getElementById("generic-popup");
  popup.innerHTML = `
    <div class="popup-contentt">
      <h3>${t['add_new']} ${t['section']}</h3>
      <label>${t['section_name']}:</label>
      <input type="text" id="new-section-name" placeholder="${t['enter_section_name']}" />
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
  const modelName = document.getElementById("new-model-name").value.trim();
  const token = localStorage.getItem("token"); // ✅ استرجاع التوكن

  if (!modelName) {
    alert("❌ Please enter a model name");
    return;
  }

  fetch("http://localhost:5050/add-device-model", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token // ✅ مهم جدًا
    },
    body: JSON.stringify({ model_name: modelName, device_type_name: deviceType })
  })
    .then(res => res.json())
    .then(result => {
      if (result.error) {
        alert(result.error);
        return;
      }

      sessionStorage.setItem("lastAddedModel", modelName);
      fetchAndRenderModels(deviceType, `model-${deviceType}`);

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

  const specData = {
    "ministry-id": document.getElementById("spec-ministry").value.trim(),
    "device-name": document.getElementById("spec-name").value.trim(),
    model: document.getElementById("spec-model").value.trim(),
    serial: document.getElementById("spec-serial").value.trim(),
    department: document.getElementById("spec-department").value.trim()
  };

  fetch(`http://localhost:5050/AddDevice/${deviceType}`, {
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
    if (returnToSpec === "true" && !["pc", "printer", "scanner"].includes(deviceType)) {
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
  ){
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



document.addEventListener("DOMContentLoaded", () => {
  const dropdownConfigs = [
    { id: "technical", endpoint: "/Technical", key: "name", label: "Technical" },
  ];

  dropdownConfigs.forEach(config => {
    const optionsContainer = document.getElementById(`${config.id}-options`);
    const hiddenInput = document.getElementById(config.id);
    const displaySpan = document.getElementById(`selected-${config.id}`);

    function loadOptions() {
      fetch(`http://localhost:5050${config.endpoint}`)
        .then(res => res.json())
        .then(data => {
          optionsContainer.innerHTML = "";

          // ✅ زر "Add New"
          const addNew = document.createElement("div");
          addNew.className = "dropdown-option-row add-new-option";
          addNew.innerHTML = `<div class="dropdown-option-text">+ Add New ${config.label}</div>`;
          addNew.onclick = () => {
            openAddNewOptionPopup(config);
            closeAllDropdowns();
          };
          optionsContainer.appendChild(addNew);

          // ✅ البيانات الحالية
          data.forEach(item => {
            const value = item[config.key];

            const row = document.createElement("div");
            row.className = "dropdown-option-row";
            row.style.display = "flex";
            row.style.justifyContent = "space-between";
            row.style.alignItems = "center";

            const valueSpan = document.createElement("div");
            valueSpan.className = "dropdown-option-text";
            valueSpan.textContent = value;
            valueSpan.style.flex = "1";
            valueSpan.style.cursor = "pointer";
            valueSpan.onclick = () => {
              hiddenInput.value = value;
              displaySpan.textContent = value;
              closeAllDropdowns();
            };

            const iconGroup = document.createElement("div");
            iconGroup.innerHTML = `
              <i class="fa-solid fa-edit" style="color:#6c757d; margin-left: 8px; cursor:pointer;" title="Edit"></i>
              <i class="fa-solid fa-trash" style="color:#6c757d; margin-left: 8px; cursor:pointer;" title="Delete"></i>
            `;

            iconGroup.querySelector(".fa-edit").onclick = (e) => {
              e.stopPropagation();
              openPopup(config.id, config.label);
            };

            iconGroup.querySelector(".fa-trash").onclick = (e) => {
              e.stopPropagation();
              deleteOption(config.id);
            };

            row.appendChild(valueSpan);
            row.appendChild(iconGroup);
            optionsContainer.appendChild(row);
          });

        })
        .catch(err => console.error(`❌ Error loading ${config.id}:`, err));
    }

    loadOptions(); // ✅ أول تحميل
  });

});

// ✅ دالة فتح بوب أب إضافة عنصر جديد
function openAddNewOptionPopup(config) {
  const popup = document.getElementById("generic-popup");
  popup.innerHTML = `
    <div class="popup-contentt>
      <h3>Add New ${config.label}</h3>
      <label>${config.label} Name:</label>
      <input type="text" id="new-option-input" placeholder="Enter ${config.label}..." />
      <div class="popup-buttons">
        <button onclick="saveNewOption('${config.id}', '${config.label}')">Save</button>
        <button onclick="closeGenericPopup()">Cancel</button>
      </div>
    </div>
  `;
  popup.style.display = "flex";
}

// ✅ دالة حفظ العنصر الجديد
function saveNewOption(selectId, label) {
  const input = document.getElementById("new-option-input");
  const value = input.value.trim();
  if (!value) {
    alert(`❌ Please enter ${label} name.`);
    return;
  }

  fetch("http://localhost:5050/add-option-external-ticket", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
      }
    })
    .catch(err => {
      console.error(`❌ Error adding new ${label}:`, err.message || err);
    });
}





// ✅ دالة إغلاق البوب أب


// ✅ دالة إغلاق كل الدروب داون
function closeAllDropdowns() {
  document.querySelectorAll(".dropdown-content").forEach(drop => drop.style.display = "none");
}

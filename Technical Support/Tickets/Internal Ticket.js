

let currentDropdownId = "";

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



function loadTicketTypes() {
  renderDropdownOptions({
    endpoint: "http://localhost:5050/ticket-types",
    containerId: "ticket-type-options",
    displayId: "selected-ticket-type",
    inputId: "ticket-type",
    labelKey: "ticket_type",
    itemKey: "type_name",
    storageKey: "ticket-type",
    onAddNew: () => {
      openGenericPopup(languageManager.translations[languageManager.currentLang]['ticket_type'], "ticket-type");
    },
    onEditOption: (oldVal) => {
      const newVal = prompt("Edit Ticket Type:", oldVal);
      if (newVal && newVal !== oldVal) {
        editOption("ticket-type", oldVal, newVal);
      }
    },
    onDeleteOption: (val) => {
      if (confirm(`Delete "${val}"?`)) {
        deleteOption("ticket-type", val);
      }
    },
    onSelectOption: () => {
      onTicketTypeChange(); // ✅ استدعاء الدالة عند الاختيار
    }
  });
}


function loadReportStatuses() {
  renderDropdownOptions({
    endpoint: "http://localhost:5050/report-statuses",
    containerId: "report-status-options",
    displayId: "selected-report-status",
    inputId: "report-status",
    labelKey: "report_status",
    itemKey: "status_name",
    storageKey: "report-status",
    onAddNew: () => {
      openGenericPopup(languageManager.translations[languageManager.currentLang]['report_status'], "report-status");
    },
    onEditOption: (oldVal) => {
      const newVal = prompt("Edit Report Status:", oldVal);
      if (newVal && newVal !== oldVal) {
        editOption("report-status", oldVal, newVal);
      }
    },
    onDeleteOption: (val) => {
      if (confirm(`Delete "${val}"?`)) {
        deleteOption("report-status", val);
      }
    }
  });
}


function onTicketTypeChange() {
  const hiddenInput = document.getElementById("ticket-type"); // ✅ نجيب الـ input الخفي
  const customTypeContainer = document.getElementById("custom-type-container");
  const customTypeInput = document.getElementById("custom-ticket-type");
  const ticketNumberInput = document.getElementById("ticket-number");

  if (hiddenInput.value === "Other") {
    customTypeContainer.style.display = "block";
  } else {
    customTypeContainer.style.display = "none";
    customTypeInput.value = "";
  }

  fetch("http://localhost:5050/generate-internal-ticket-number")
    .then(res => res.json())
    .then(data => {
      if (ticketNumberInput) {
        ticketNumberInput.value = data.ticket_number;
      }
    })
    .catch(() => {
      if (ticketNumberInput) {
        ticketNumberInput.value = "ERROR";
      }
    });
}


function handleFileChange(event) {
  const fileInput = event.target;
  const file = fileInput.files[0];
  const allowedExtensions = ["pdf", "doc", "docx", "eml"];
  const ext = file?.name?.split(".").pop().toLowerCase();

  const fileLabel = document.querySelector(".upload-box p");
  if (file && !allowedExtensions.includes(ext)) {
    alert("Invalid file type. Only PDF, DOC, DOCX, and EML are allowed.");
    fileInput.value = "";
    fileLabel.textContent = "Drop files here or click to upload";
  } else if (file) {
    fileLabel.textContent = "Selected File: " + file.name;
  }
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
    const isHidden = input.type === "hidden" || input.type === "file";
    const isRadio = input.type === "radio";
    const isEmpty = isRadio ? !form.querySelector(`input[name="${input.name}"]:checked`) : !input.value.trim();

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

  if (hasError) return;

  // ✅ تجميع البيانات
  const formData = new FormData();
  formData.append("ticket_type", document.getElementById("ticket-type").value);
  formData.append("assigned_to", document.getElementById("technical-status").value);
  formData.append("report_status", document.getElementById("report-status").value);
  formData.append("device_type", document.getElementById("device-type").value);
  formData.append("section", document.getElementById("section").value);
  formData.append("device_id", document.getElementById("device-spec").value);
  formData.append("initial_diagnosis", document.getElementById("problem-status").value);
  const priorityInput = form.querySelector('input[name="priority"]:checked');
  formData.append("priority", priorityInput ? priorityInput.value : '');
  const issueDescription = form.querySelector('textarea[placeholder="Enter detailed description of the issue"]')?.value?.trim() || '';
  const finalDiagnosis = form.querySelector('textarea[placeholder="Enter final diagnosis after investigation"]')?.value?.trim() || '';
  const otherDescription = form.querySelector('textarea[placeholder="Please provide additional details if \'Other\' is selected"]')?.value?.trim() || '';

  formData.append("issue_description", issueDescription);
  formData.append("final_diagnosis", finalDiagnosis);
  formData.append("other_description", otherDescription);


  const file = document.getElementById("upload-file")?.files[0];
  if (file) formData.append("attachment", file);

  const token = localStorage.getItem("token");

  fetch("http://localhost:5050/internal-ticket-with-file", {
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



function formatLabel(id) {
  return id.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
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
    if (type) fetchProblemStatus(type);     // ✅ تحديث الأعطال
  });
}


function fetchAndRenderModels(deviceType, dropdownId) {
  const cleanedType = deviceType.trim().toLowerCase();
  let endpoint = "";

  if (["pc", "laptop", "desktop", "كمبيوتر", "لابتوب"].includes(cleanedType)) {
    endpoint = "http://localhost:5050/PC_Model";
  } else if (cleanedType === "printer") {
    endpoint = "http://localhost:5050/Printer_Model";
  } else if (cleanedType === "scanner") {
    endpoint = "http://localhost:5050/Scanner_Model";
  } else {
    endpoint = `http://localhost:5050/models-by-type/${cleanedType}`;
  }

  renderDropdownOptions({
    endpoint,
    containerId: `${dropdownId}-options`,
    displayId: `selected-${dropdownId}`,
    inputId: dropdownId,
    labelKey: "model",
    itemKey: "model_name",
    storageKey: dropdownId,
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
    onSelectOption: () => {
    }
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
  renderDropdownOptions({
    endpoint: "http://localhost:5050/Scanner_Types",
    containerId: "scanner-type-options",
    displayId: "selected-scanner-type",
    inputId: "scanner-type",
    labelKey: "scanner_type",
    itemKey: "scanner_type",
    storageKey: "scanner-type",
    onAddNew: () => {
      sessionStorage.setItem("lastDropdownOpened", "scanner-type");
      openAddOptionPopup("scanner-type");
    },
    onEditOption: (oldValue) => {
      const newValue = prompt("Edit Scanner Type:", oldValue);
      if (newValue && newValue.trim() !== oldValue) {
        editOption("scanner-type", oldValue, newValue.trim());
      }
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
    endpoint: "http://localhost:5050/Printer_Types",
    containerId: "printer-type-options",
    displayId: "selected-printer-type",
    inputId: "printer-type",
    labelKey: "printer_type",
    itemKey: "printer_type",
    storageKey: "printer-type",
    onAddNew: () => {
      sessionStorage.setItem("lastDropdownOpened", "printer-type");
      openAddOptionPopup("printer-type");
    },
    onEditOption: (oldValue) => {
      const newValue = prompt("Edit Printer Type:", oldValue);
      if (newValue && newValue.trim() !== oldValue) {
        editOption("printer-type", oldValue, newValue.trim());
      }
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
    endpoint: "http://localhost:5050/Ink_Types",
    containerId: "ink-type-options",
    displayId: "selected-ink-type",
    inputId: "ink-type",
    labelKey: "ink_type",
    itemKey: "ink_type",
    storageKey: "ink-type",
    onAddNew: () => {
      sessionStorage.setItem("lastDropdownOpened", "ink-type");
      openAddOptionPopup("ink-type");
    },
    onEditOption: (oldValue) => {
      const newValue = prompt("Edit Ink Type:", oldValue);
      if (newValue && newValue.trim() !== oldValue) {
        editOption("ink-type", oldValue, newValue.trim());
      }
    },
    onDeleteOption: (val) => {
      if (confirm(`Delete "${val}"?`)) {
        deleteOption("ink-type", val);
      }
    }
  });
}



function fetchDepartments(selectId = "department") {
  renderDropdownOptions({
    endpoint: "http://localhost:5050/Departments",
    containerId: `${selectId}-options`,
    displayId: `selected-${selectId}`,
    inputId: selectId,
    labelKey: "section",
    itemKey: "name",
    storageKey: selectId,
    onAddNew: () => {
      sessionStorage.setItem("lastDepartmentSelectId", selectId);
      ["spec-name", "spec-serial", "spec-ministry", "spec-model", selectId].forEach(id => {
        const el = document.getElementById(id);
        if (el) sessionStorage.setItem(id, el.value);
      });
      sessionStorage.setItem("lastDropdownOpened", selectId);
      openAddSectionPopup();
    },
    onEditOption: (oldVal) => {
      const newVal = prompt("Edit Section:", oldVal);
      if (newVal && newVal !== oldVal) {
        editOption("section", oldVal, newVal, "Department");
      }
    },
    onDeleteOption: (val) => {
      if (confirm(`Delete "${val}"?`)) {
        deleteOption("section", val, "Department");
      }
    },
    onSelectOption: () => {
      fetchDeviceSpecsByTypeAndDepartment();
    }
  });
}

function saveNewSection() {
  const sectionName = document.getElementById("new-section-name").value.trim();
  if (!sectionName) {
    alert("❌ Please enter a section name");
    return;
  }

  fetch("http://localhost:5050/add-options-regular", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem('token')}` },
    body: JSON.stringify({ target: "section", value: sectionName })
  })
    .then(res => res.json())
    .then(result => {
      if (result.error) {
        alert(result.error);
        return;
      }


      const selectId = sessionStorage.getItem("lastDepartmentSelectId") || "spec-department";

      // ✅ تحديث الدروب داون المخصص
      // ✅ بعد fetchDepartments(selectId);
      fetchDepartments(selectId);
      sessionStorage.setItem(selectId, sectionName);

      // ✅ إظهار القيمة الجديدة يدويًا
      setTimeout(() => {
        const displaySpan = document.getElementById(`selected-${selectId}`);
        const hiddenInput = document.getElementById(selectId);

        if (displaySpan && hiddenInput) {
          displaySpan.textContent = sectionName;
          hiddenInput.value = sectionName;
        }
      }, 200);


      // ✅ إزالة بيانات الجلس
      sessionStorage.removeItem("lastDepartmentSelectId");
      sessionStorage.removeItem("returnToPopup");

      // ✅ أغلق البوب أب الحالي
      document.getElementById("generic-popup").style.display = "none";

      // ✅ فقط إذا كانت الإضافة داخل popup المواصفات + نوع الجهاز غير معروف
      const deviceType = document.getElementById("device-type")?.value?.toLowerCase();
      const isSpecContext = ["spec-department", "department-pc", "department-printer", "department-scanner"].includes(selectId);

      if (isSpecContext && !["pc", "printer", "scanner", "desktop", "laptop", "كمبيوتر", "لابتوب"].includes(deviceType)) {
        const modelName = document.getElementById("spec-model")?.value;
        if (modelName) sessionStorage.setItem("spec-model", modelName);

        const popup = document.getElementById("generic-popup");

        // ✅ إذا البوب أب موجود ومفتوح، لا تفتحه من جديد
        if (popup && popup.style.display !== "flex") {
          setTimeout(() => {
            openGenericPopup("Device Specification", "device-spec");

            setTimeout(() => {
              const deptSelect = document.getElementById("spec-department");
              if (deptSelect) {
                deptSelect.value = sectionName;
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
      }

    })
    .catch(err => {
      console.error("❌ Failed to save section:", err);
      alert("❌ Error saving section");
    });
}




function fetchDrives() {
  renderDropdownOptions({
    endpoint: "http://localhost:5050/Hard_Drive_Types",
    containerId: "drive-select-options",
    displayId: "selected-drive-select",
    inputId: "drive-select",
    labelKey: "hard_drive",
    itemKey: "drive_type",
    storageKey: "drive-select",
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
    endpoint: "http://localhost:5050/CPU_Types",
    containerId: "cpu-select-options",
    displayId: "selected-cpu-select",
    inputId: "cpu-select",
    labelKey: "processor",
    itemKey: "cpu_name",
    storageKey: "cpu-select",
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
    endpoint: "http://localhost:5050/RAM_Types",
    containerId: "ram-select-options",
    displayId: "selected-ram-select",
    inputId: "ram-select",
    labelKey: "ram",
    itemKey: "ram_type",
    storageKey: "ram-select",
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
    endpoint: "http://localhost:5050/OS_Types",
    containerId: "os-select-options",
    displayId: "selected-os-select",
    inputId: "os-select",
    labelKey: "operating_system",
    itemKey: "os_name",
    storageKey: "os-select",
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
    endpoint: "http://localhost:5050/Processor_Generations",
    containerId: "generation-select-options",
    displayId: "selected-generation-select",
    inputId: "generation-select",
    labelKey: "processor_generation",
    itemKey: "generation_number",
    storageKey: "generation-select",
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
    endpoint: "http://localhost:5050/RAM_Sizes",
    containerId: "ram-size-select-options",
    displayId: "selected-ram-size-select",
    inputId: "ram-size-select",
    labelKey: "ram_size",
    itemKey: "ram_size",
    storageKey: "ram-size-select",
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
async function fetchDeviceTypes() {
  const permissions = await checkUserPermissions();

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

      // إضافة زر "Add New" فقط إذا كان لديه صلاحية كاملة
      if (permissions.full_access || permissions.add_items) {
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
      }

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
          const type = item.DeviceType.trim().toLowerCase();
          if (type) fetchProblemStatus(type);
        };
        row.appendChild(text);
        container.appendChild(row);
        // إضافة أيقونات التعديل والحذف فقط إذا كان لديه صلاحية كاملة
        if (permissions.full_access || permissions.edit_items || permissions.delete_items) {
          const icons = document.createElement("div");
          icons.className = "dropdown-actions-icons";

          if (permissions.full_access || permissions.edit_items) {
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
            icons.appendChild(editIcon);
          }

          if (permissions.full_access || permissions.delete_items) {
            const deleteIcon = document.createElement("i");
            deleteIcon.className = "fas fa-trash";
            deleteIcon.title = translations['delete'];
            deleteIcon.onclick = (e) => {
              e.stopPropagation();
              if (confirm(`${translations['confirm_delete']} "${item.DeviceType}"?`)) {
                deleteOption("problem-type", item.DeviceType);
              }
            };
            icons.appendChild(deleteIcon);
          }

          row.appendChild(icons);
        }



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
    })
    .catch(err => {
      console.error("❌ Failed to fetch device types:", err);
    });
}

function fetchTechnicalStatus(callback) {
  renderDropdownIDs({
    endpoint: "http://localhost:5050/Technical",
    containerId: "technical-status-options",
    displayId: "selected-technical-status",
    inputId: "technical-status",
    labelKey: "technical",
    itemKey: (item) => item.name || "N/A", // ✅ عدّل هنا
    storageKey: "technical-status",
    onAddNew: () => {
      sessionStorage.setItem("lastDropdownOpened", "technical-status");
      openAddTechnicalPopup();
    },
    onEditOption: (oldVal) => {
      const newVal = prompt("Edit Technical:", oldVal);
      if (newVal && newVal.trim() !== oldVal) {
        editOption("technical-status", oldVal, newVal);
      }
    },
    onDeleteOption: (val) => {
      if (confirm(`Delete "${val}"?`)) {
        deleteOption("technical-status", val);
      }
    },
    onSelectOption: () => { },
  });

  if (typeof callback === "function") callback();
}




function openAddTechnicalPopup() {
  const t = languageManager.translations[languageManager.currentLang];

  const popup = document.getElementById("generic-popup");
  popup.innerHTML = `
    <div class="popup-contentt">
      <h3>${t['add_new']} ${t['technical']}</h3>
      <label for="new-technical-name">${t['technical_name']}:</label>
      <input type="text" id="new-technical-name" placeholder="${t['enter']} ${t['technical_name'].toLowerCase()}..." />
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
  const name = document.getElementById("new-technical-name").value.trim();
  if (!name) {
    alert(`${t['please_enter_valid_value']}`);
    return;
  }

  fetch("http://localhost:5050/add-option-general", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + localStorage.getItem("token")
    },
    body: JSON.stringify({
      target: "technical",
      value: name
    })
  })
    .then(res => res.status === 204 ? {} : res.json())
    .then(result => {
      if (result.error) {
        alert(result.error);
      } else {
        fetchTechnicalStatus(() => {
          const displaySpan = document.getElementById("selected-technical-status");
          const hiddenInput = document.getElementById("technical-status");
          displaySpan.textContent = name;
          hiddenInput.value = name;
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
    const res = await fetch(`http://localhost:5050/problem-states/${encodeURIComponent(deviceType)}`);
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      const row = document.createElement("div");
      row.className = "dropdown-option-row";
      row.innerHTML = `<div class="dropdown-option-text">${t['no_problem_status_found']}</div>`;
      container.appendChild(row);
      return;
    }

    let selectedProblems = [];

    data.forEach(item => {
      const row = document.createElement("div");
      row.className = "dropdown-option-row";

      const text = document.createElement("div");
      text.className = "dropdown-option-text";
      const value = item.problem_text || item.problemStates_Maintance_device_name || "Unnamed Problem";
      text.textContent = item.device_type ? `${value} (${item.device_type})` : value;

      text.onclick = () => {
        const idx = selectedProblems.indexOf(value);
        if (idx === -1) {
          selectedProblems.push(value);
          text.style.backgroundColor = "#d0f0fd";
        } else {
          selectedProblems.splice(idx, 1);
          text.style.backgroundColor = "";
        }
        displaySpan.textContent = selectedProblems.join(", ");
        hiddenInput.value = JSON.stringify(selectedProblems);
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
            const newValue = prompt(`${t['edit']} ${t['problem_status']}:`, value);
            if (newValue && newValue.trim() !== value) {
              editOption("problem-status", value, newValue.trim(), deviceType);
            }
          };
          icons.appendChild(editIcon);
        }

        if (permissions.full_access || permissions.delete_items) {
          const deleteIcon = document.createElement("i");
          deleteIcon.className = "fas fa-trash";
          deleteIcon.title = t['delete'];
          deleteIcon.onclick = (e) => {
            e.stopPropagation();
            if (confirm(`${t['confirm_delete']} "${value}"?`)) {
              deleteOption("problem-status", value, deviceType);
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




function openAddProblemStatusPopup(deviceType) {
  const t = languageManager.translations[languageManager.currentLang];

  const popup = document.getElementById("generic-popup");
  popup.innerHTML = `
    <div class="popup-contentt">
      <h3>${t['add_new']} ${t['problem_status']}</h3>
      <label for="new-problem-status-name">${t['problem_status']}:</label>
      <input type="text" id="new-problem-status-name" placeholder="${t['enter']} ${t['problem_status'].toLowerCase()}..." />
      <div class="popup-buttons">
        <button type="button" onclick="saveNewProblemStatus('${deviceType}')">${t['save']}</button>
        <button type="button" onclick="closeGenericPopup()">${t['cancel']}</button>
      </div>
    </div>
  `;
  popup.style.display = "flex";
}

function saveNewProblemStatus(deviceType) {
  const t = languageManager.translations[languageManager.currentLang];
  const name = document.getElementById("new-problem-status-name").value.trim();

  if (!name) {
    alert(t['please_enter_valid_value']);
    return;
  }

  fetch("http://localhost:5050/add-options-regular", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + localStorage.getItem("token")
    },
    body: JSON.stringify({
      target: "problem-status",
      value: name,
      type: deviceType
    })
  })
    .then(res => res.status === 204 ? {} : res.json())
    .then(result => {
      if (result.error) {
        alert(result.error);
      } else {
        // ✅ أعد تحميل القائمة وحدد العنصر المضاف
        fetchProblemStatus(deviceType, () => {
          const displaySpan = document.getElementById("selected-problem-status");
          const hiddenInput = document.getElementById("problem-status");
          displaySpan.textContent = name;
          hiddenInput.value = JSON.stringify([name]);
        });
        closeGenericPopup();
      }
    })
    .catch(err => {
      console.error("❌ Error saving problem status:", err);
      alert(t['failed_to_save']);
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
        option.textContent = `${device.Serial_Number} | ${device[type === 'pc', "desktop", "laptop", "كمبيوتر", "لابتوب" ? 'Computer_Name' : type === 'printer' ? 'Printer_Name' : 'Scanner_Name']}`;
        dropdown.appendChild(option);
      });
    })
    .catch(err => console.error("❌ Error fetching device specs:", err));
}


function fetchDeviceSpecsByTypeAndDepartment() {
  const type = document.getElementById("device-type").value?.toLowerCase();
  const dept = document.getElementById("section").value;
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
  addNewRow.innerHTML = `<div class="dropdown-option-text">+ Add New Specification</div>`;
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
  fetchTechnicalStatus(); // ✅ جلب أسماء المهندسين مع بداية الصفحة
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
          openGenericPopup("Device Specification", "device-spec");
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
  if (!value) {
    alert("❌ Please select a valid option to delete.");
    return;
  }

  if (!confirm(`❗ Are you sure you want to delete "${value}"?`)) {
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

        // ✅ بعد الحذف، نحدث القائمة بالكامل
        refreshDropdown(selectId);
      }
    })
    .catch(err => {
      console.error("❌ Error deleting option:", err);
      alert("❌ Failed to delete option");
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


function editOption(selectId, oldValue, newValue, type = null) {
  if (!oldValue || !newValue) {
    alert("❌ Please select and enter a valid value to edit.");
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

        // ✅ بعد التعديل، نرجع نحمل البيانات من السيرفر من جديد
        refreshDropdown(selectId);
      }
    })
    .catch(err => {
      console.error("❌ Error editing option:", err);
      alert("❌ Failed to edit option");
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


function saveGenericOption() {
  const value = document.getElementById("generic-popup-input").value.trim();
  const targetId = document.getElementById("generic-popup-target-id").value;
  const dropdown = document.getElementById(targetId);
  const lang = languageManager.currentLang;
  const t = languageManager.translations[lang];
  if (!value || !dropdown) return;

  fetch("http://localhost:5050/add-option-internal-ticket", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + localStorage.getItem("token")
    },
    body: JSON.stringify({ target: targetId, value })
  })
    .then(res => {
      if (!res.ok) return res.json().then(err => { throw new Error(err.error) });
      return res.json();
    })
    .then(result => {
      // ✅ حفظ القيمة لتحديدها بعد إعادة التحميل
      sessionStorage.setItem(targetId, value);

      // ✅ محاولة تشغيل دالة إعادة التحميل بناءً على targetId
      const reloadFunc = window[`load${camelCase(targetId)}s`];
      if (typeof reloadFunc === "function") {
        reloadFunc(); // مثل loadTicketTypes, loadReportStatuses, loadDepartments...
      } else {
        console.warn(`🔁 لا توجد دالة تحميل لقائمة: ${targetId}`);
      }

      sessionStorage.removeItem("returnToPopup");
      closeGenericPopup();
    })
    .catch(err => {
      alert(err.message);
    });
}

// ✅ لتحويل ticket-type → TicketType
function camelCase(str) {
  return str
    .replace(/[-_]+(.)?/g, (_, char) => char ? char.toUpperCase() : "")
    .replace(/^(.)/, (_, char) => char.toUpperCase());
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
} function openAddSectionPopup(contextId = "section") {
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




document.addEventListener("DOMContentLoaded", () => {
  const dropdownConfigs = [
    { id: "technical-status", endpoint: "/Technical", key: "name", labelKey: "technical" },
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
          const t = languageManager.translations[languageManager.currentLang];

          const addNew = document.createElement("div");
          addNew.className = "dropdown-option-row add-new-option";
          addNew.innerHTML = `<div class="dropdown-option-text">+ ${t['add_new']} ${t[config.labelKey]}</div>`;

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
function saveNewOption(selectId, label) {
  const t = languageManager.translations[languageManager.currentLang];

  const input = document.getElementById("new-option-input");
  const value = input.value.trim();
  if (!value) {
    alert(`❌ ${t['please_enter']} ${t[labelKey]}`);
    return;
  }

  fetch("http://localhost:5050/add-option-internal-ticket", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem('token')}` },
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

        if (selectId === "problem-status") {
          const deviceType = document.getElementById("device-type")?.value?.toLowerCase();
          sessionStorage.setItem("problem-status", value);
          fetchProblemStatus(deviceType);
        }
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
  onSelectOption
}) {
  const permissions = await checkUserPermissions();
  const res = await fetch(endpoint);
  const data = await res.json();

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

    const row = document.createElement("div");
    row.className = "dropdown-option-row";

    const text = document.createElement("div");
    text.className = "dropdown-option-text";
    text.textContent = value;
    text.onclick = () => {
      display.textContent = value;
      input.value = value;
      if (onSelectOption) onSelectOption(value);
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
        onEditOption?.(value);
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
    display.textContent = saved;
    input.value = saved;
    sessionStorage.removeItem(storageKey || inputId);
  }

  attachEditDeleteHandlers(containerId, t[labelKey] || labelKey);
}
async function renderDropdownIDs({
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
  onSelectOption
}) {
  const permissions = await checkUserPermissions();
  const res = await fetch(endpoint);
  const data = await res.json();

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

    const row = document.createElement("div");
    row.className = "dropdown-option-row";

    const text = document.createElement("div");
    text.className = "dropdown-option-text";
    text.textContent = value;
    text.onclick = () => {
      display.textContent = value;
      input.value = item.id; // ← احفظ ID المهندس وليس الاسم
      if (onSelectOption) onSelectOption(item);
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
        onEditOption?.(value);
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
  const match = data.find(d => String(d.id) === saved || d.name === saved);
  if (match) {
    display.textContent = match.name;
    input.value = match.id;
  } else {
    display.textContent = saved;
    input.value = saved;
  }
  sessionStorage.removeItem(storageKey || inputId);
}


  attachEditDeleteHandlers(containerId, t[labelKey] || labelKey);
}
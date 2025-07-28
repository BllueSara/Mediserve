// استيراد الدوال أو المتغيرات المساعدة المطلوبة
import { renderDropdownOptions, closeAllDropdowns } from "./dropdowns.js";
import { checkUserPermissions, createLangAwareTransform, cleanDropdownError } from "./helpers.js";
import { openAddModelPopup, openAddSectionPopup, openAddOptionPopup,openGenericPopup,updatePopupHeadingAndFields,openAddNewOptionPopup } from "./popup.js";
import { editOption, deleteOption,openDeviceEditPopup,openGenericEditPopup } from "./edit.js";
import { fetchProblemStatus } from "./problem.js";
import { showToast, showErrorToast, showSuccessToast, showWarningToast } from "./toast.js";

// ========== الدوال المنقولة من Regular.js ===========

export async function fetchDeviceSpecsByTypeAndDepartment() {
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
      document.getElementById("popup-modal").style.display = "flex";
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
                showErrorToast("❌ Could not load full device data for editing.");
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
                const success = await deleteOption("device-spec", device.id);
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

export function fetchCPU() {
  renderDropdownOptions({
    endpoint: "http://localhost:4000/CPU_Types",
    containerId: "cpu-select-options",
    displayId: "selected-cpu-select",
    inputId: "cpu-select",
    labelKey: "processor",
    itemKey: "cpu_name",
    transformData: createLangAwareTransform("cpu_name"),
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

export function fetchRAM() {
  renderDropdownOptions({
    endpoint: "http://localhost:4000/RAM_Types",
    containerId: "ram-select-options",
    displayId: "selected-ram-select",
    inputId: "ram-select",
    labelKey: "ram",
    itemKey: "ram_type",
    storageKey: "ram-select",
    transformData: createLangAwareTransform("ram_type"),
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

export function fetchOS() {
  renderDropdownOptions({
    endpoint: "http://localhost:4000/OS_Types",
    containerId: "os-select-options",
    displayId: "selected-os-select",
    inputId: "os-select",
    labelKey: "operating_system",
    itemKey: "os_name",
    storageKey: "os-select",
    transformData: createLangAwareTransform("os_name"),
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

export function fetchProcessorGen() {
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

export function fetchDrives() {
  renderDropdownOptions({
    endpoint: "http://localhost:4000/Hard_Drive_Types",
    containerId: "drive-select-options",
    displayId: "selected-drive-select",
    inputId: "drive-select",
    labelKey: "hard_drive",
    itemKey: "drive_type",
    storageKey: "drive-select",
    transformData: createLangAwareTransform("drive_type"),
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

export function fetchRAMSize() {
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

export function fetchPrinterTypes() {
  renderDropdownOptions({
    endpoint: "http://localhost:4000/Printer_Types",
    containerId: "printer-type-options",
    displayId: "selected-printer-type",
    inputId: "printer-type",
    labelKey: "printer_type",
    itemKey: "printer_type",
    storageKey: "printer-type",
    transformData: createLangAwareTransform("printer_type"),
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

export function fetchInkTypes() {
  renderDropdownOptions({
    endpoint: "http://localhost:4000/Ink_Types",
    containerId: "ink-type-options",
    displayId: "selected-ink-type",
    inputId: "ink-type",
    labelKey: "ink_type",
    itemKey: "ink_type",
    storageKey: "ink-type",
    transformData: createLangAwareTransform("ink_type"),
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

export function fetchScannerTypes() {
  renderDropdownOptions({
    endpoint: "http://localhost:4000/Scanner_Types",
    containerId: "scanner-type-options",
    displayId: "selected-scanner-type",
    inputId: "scanner-type",
    labelKey: "scanner_type",
    itemKey: "scanner_type",
    storageKey: "scanner-type",
    transformData: createLangAwareTransform("scanner_type"),
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

// ========== إضافة دالة fetchAndRenderModels ===========

export function fetchAndRenderModels(deviceType, dropdownId) {
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

export function fetchTechnicalStatus(callback) {
  renderDropdownOptions({
    endpoint: "http://localhost:4000/Technical",
    containerId: "technical-status-options",
    displayId: "selected-technical-status",
    inputId: "technical-status",
    labelKey: "technical",
    itemKey: (item) => ({ id: item.id, name: item.Engineer_Name || item.name || "N/A", fullName: item.Engineer_Name || item.name || "N/A" }),
    storageKey: "technical-status",
    transformData: (items) => {
      const currentLang = languageManager.currentLang;
      const result = items.map(item => {
        const raw = item.Engineer_Name || item.name || "";
        const parts = raw.split("|");
        const enPart = parts[0]?.trim() || "";
        const arPart = parts[1]?.trim() || "";
        let displayName = currentLang === "ar" ? arPart : enPart;
        if (!displayName) displayName = enPart || arPart;
        return {
          ...item,
          name: displayName,
          fullName: raw
        };
      });
      window.lastTechnicalOptions = result;
      return result;
    },
    onAddNew: () => {
      sessionStorage.setItem("lastDropdownOpened", "technical-status");
      if (typeof openAddTechnicalPopup === "function") openAddTechnicalPopup();
    },
    onEditOption: (oldVal) => {
      if (typeof openAddTechnicalPopup === "function") openAddTechnicalPopup(oldVal);
    },
    onDeleteOption: (id) => {
      if (confirm(`Delete?`)) {
        deleteOption("technical-status", id);
      }
    },
    onSelectOption: () => { },
  });
  if (typeof callback === "function") callback();
}

export function fetchDepartments(selectId = "section") {
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
      return items.map(item => {
        const parts = (item.name || "").split("|");
        const enPart = parts[0].trim();
        const arPart = parts.length > 1 ? parts[1].trim() : "";
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
      sessionStorage.setItem("department-full", fullItem.fullName);
      document.getElementById(`selected-section`).textContent = localizedValue;
      const parts = fullItem.fullName.split("|");
      const enPart = parts[0].trim().replace(/\s*\[en\]$/i, "").trim();
      const arPart = (parts[1] || "").trim().replace(/\s*\[ar\]$/i, "").trim();
      const hiddenSection = document.getElementById("section");
      hiddenSection.value = arPart;
      fetchDeviceSpecsByTypeAndDepartment();
    }
  });
}

export async function fetchDeviceTypes() {
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
export function fetchFloors() {
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

export function fetchDevicesBySection() {
  const type = document.getElementById("device-type").value.toLowerCase();
  const department = sessionStorage.getItem("section");

  if (!type || !department) {
    showErrorToast("❌ تأكد من اختيار نوع الجهاز والقسم");
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
        option.textContent = `${device.Serial_Number} | ${device[
          ["pc", "desktop", "laptop", "كمبيوتر", "لابتوب"].includes(type)
            ? 'Computer_Name'
            : type === 'printer'
            ? 'Printer_Name'
            : 'Scanner_Name']}`;
        dropdown.appendChild(option);
      });
    })
    .catch(err => console.error("❌ Error fetching device specs:", err));
}

// ========== نهاية الدوال المنقولة =========== 


export function openAddTechnicalPopup(oldValue = "") {
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

export function saveNewTechnical() {
  const t = languageManager.translations[languageManager.currentLang];
  const en = document.getElementById("new-technical-en").value.trim();
  const ar = document.getElementById("new-technical-ar").value.trim();
  const oldValue = document.getElementById("old-technical-value")?.value.trim();
  if (!en || !ar) {
    showErrorToast("❌ الرجاء إدخال اسم المهندس بالإنجليزي والعربي.");
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
          showErrorToast(result.error);
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
        showErrorToast(t['failed_to_save'] || "Failed to update engineer");
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
        showErrorToast(result.error);
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
      showErrorToast(t['failed_to_save'] || "Failed to save engineer");
    });
}
window.saveNewTechnical = saveNewTechnical;

// ========== إضافة دالة حفظ مراسل جديد أو تعديل ===========

export function saveNewReporter() {
  const t = languageManager.translations[languageManager.currentLang];
const en = document.getElementById("new-technical-en").value.trim();
const ar = document.getElementById("new-technical-ar").value.trim();
const oldValue = document.getElementById("old-technical-value")?.value.trim();
  if (!en || !ar) {
    showErrorToast("❌ الرجاء إدخال اسم المراسل بالإنجليزي والعربي.");
    return;
  }
  const rawName = `${en}|${ar}`;
  if (oldValue) {
    // تحديث
    fetch("http://localhost:4000/update-option-complete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + localStorage.getItem("token")
      },
      body: JSON.stringify({
        target: "technical", // نفس الهدف المستخدم في الفنيين
        oldValue: oldValue,
        newValue: rawName
      })
    })
      .then(res => res.json())
      .then(result => {
        if (result.error) {
          showErrorToast(result.error);
        } else {
          fetchReporterNames(() => {
            const displaySpan = document.getElementById("selected-technical");
            const hiddenInput = document.getElementById("technical");
            const displayName = languageManager.currentLang === "ar" ? ar : en;
            if (displaySpan) displaySpan.textContent = displayName;
            if (hiddenInput) hiddenInput.value = `${en}|${ar}`;
          });
          closeGenericPopup();
        }
      })
      .catch(err => {
        console.error("❌ Error updating reporter:", err);
        showErrorToast(t['failed_to_save'] || "Failed to update reporter");
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
        showErrorToast(result.error);
      } else {
        const displayName = languageManager.currentLang === "ar" ? (ar || en) : en;
        fetchReporterNames(() => {
          const displaySpan = document.getElementById("selected-technical");
          const hiddenInput = document.getElementById("technical");
          if (displaySpan) displaySpan.textContent = displayName;
          if (hiddenInput) hiddenInput.value = `${en}|${ar}`;
        });
        closeGenericPopup();
      }
    })
    .catch(err => {
      console.error("❌ Error saving reporter:", err);
      showErrorToast(t['failed_to_save'] || "Failed to save reporter");
    });
}
window.saveNewReporter = saveNewReporter;

// ========== تعديل fetchReporterNames لدعم callback ===========

export function fetchReporterNames(callback) {
  renderDropdownOptions({
    endpoint: "http://localhost:4000/Technical",
    containerId: "technical-options",
    displayId: "selected-technical",
    inputId: "technical",
    labelKey: "reporter",
    itemKey: (item) => item.Engineer_Name || item.name || "Unnamed",
    storageKey: "technical",
    transformData: (items) => {
      window.lastTechnicalOptions = items;
      const currentLang = languageManager.currentLang;
      return items.map(item => {
        const rawName = item.Engineer_Name || item.name || "";
        const parts = rawName.split("|").map(p => p.trim());
        const en = parts[0] || "";
        const ar = parts[1] || "";
        const displayName = currentLang === "ar" ? (ar || en) : en;
        return {
          ...item,
          name: displayName,
          fullName: rawName
        };
      });
    },
    onAddNew: () => {
      openAddReporterPopup();
    },
    onEditOption: (oldVal, item) => {
      openAddReporterPopup(item && item.fullName ? item.fullName : oldVal);
    },
    onDeleteOption: (val) => {
      if (confirm(`Delete "${val}"?`)) {
        deleteOption("technical-status", val);
      }
    },
    onSelectOption: (actualValue, item) => {
      const input = document.getElementById("technical");
      if (input && item.fullName) {
        input.value = item.fullName;
      }
    }
  });
  if (typeof callback === "function") callback();
}

// ========== إضافة دالة openAddReporterPopup ===========

export function openAddReporterPopup(oldValue = "") {
  console.log("القيمة المستلمة في التعديل:", oldValue);

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
        <button type="button" onclick="saveNewReporter()">${t['save']}</button>
        <button type="button" onclick="closeGenericPopup()">${t['cancel']}</button>
      </div>
    </div>
  `;
  popup.style.display = "flex";
}




export function loadTicketTypes() {
  renderDropdownOptions({
    endpoint: "http://localhost:4000/ticket-types",
    containerId: "ticket-type-options",
    displayId: "selected-ticket-type",
    inputId: "ticket-type",
    labelKey: "ticket_type",
    itemKey: "type_name",
    storageKey: "ticket-type",

    // ✅ فلترة حسب اللغة
    transformData: createLangAwareTransform("type_name"),


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
      onTicketTypeChange(); // ✅ استدعاء عند اختيار النوع
    }
  });
}
export function onTicketTypeChange() {
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

  fetch("http://localhost:4000/generate-internal-ticket-number")
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


export function loadReportStatuses() {
  renderDropdownOptions({
    endpoint: "http://localhost:4000/report-statuses",
    containerId: "report-status-options",
    displayId: "selected-report-status",
    inputId: "report-status",
    labelKey: "report_status",
    itemKey: "status_name",
    storageKey: "report-status",

    // ✅ فلترة الحالات حسب اللغة
    transformData: createLangAwareTransform("status_name"),


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

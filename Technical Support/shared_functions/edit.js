import * as device from "./device.js";
import { fetchProblemStatus } from "./problem.js";
import { showToast, showErrorToast, showSuccessToast, showWarningToast } from "./toast.js";

export async function editOption(selectId, updatedDevice, newValue = null, type = null) {
  const lang = languageManager.currentLang;
  const t = languageManager.translations[lang];

  if (!updatedDevice || (selectId !== "device-spec" && (!updatedDevice || !newValue))) {
    showErrorToast(t['please_select_and_enter_valid_value']);
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
      valueToSend = newValue.trim();
    } else {
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
      showErrorToast(result.error);
      return false;
    } else {
      if (!isDeviceSpec) refreshDropdown(selectId);
      return true;
    }
  } catch (err) {
    console.error("❌ Error editing option:", err);
    showErrorToast(t['failed_to_edit_option']);
    return false;
  }
}

export async function editOptionWithFullName(selectId, oldValue, newValue = null, type = null) {
  const lang = languageManager.currentLang;
  const t = languageManager.translations[lang];

  console.log(`🔍 editOptionWithFullName called with:`, { selectId, oldValue, newValue, type });

  if (!oldValue) {
    showErrorToast(t['please_select_and_enter_valid_value']);
    return false;
  }

  let target;
  if (selectId === "section" || selectId === "spec-department") {
    target = "section";
  } else if (selectId === "technical-status") {
    target = "technical";
  } else if (selectId === "problem-status") {
    target = "problem-status";
  } else {
    return editOption(selectId, oldValue, newValue, type);
  }

  let searchValue = oldValue.trim();
  if (searchValue.includes("|")) {
    const parts = searchValue.split("|").map(s => s.trim());
    const currentLang = languageManager.currentLang;
    searchValue = currentLang === "ar" ? (parts[1] || parts[0]) : parts[0];
  }

  console.log(`🔍 Searching for ${target} with value: "${searchValue}"`);

  const fullNameData = await getFullName(target, searchValue);
  if (!fullNameData) {
    const itemType = target === "section" ? "department" : 
                    target === "technical" ? "engineer" : 
                    target === "problem-status" ? "problem" : "item";
    showErrorToast(`❌ Could not find ${itemType} information.`);
    return false;
  }

  console.log(`✅ Found full name data:`, fullNameData);

  let enVal = fullNameData.englishName || "";
  let arVal = fullNameData.arabicName || "";
  if (!newValue) {
    const currentLang = languageManager.currentLang;
    const currentName = currentLang === "ar" ? arVal : enVal;
    const otherName = currentLang === "ar" ? enVal : arVal;
    const itemType = target === "section" ? "Department" : 
                    target === "technical" ? "Engineer" : 
                    target === "problem-status" ? "Problem" : "Item";
    const promptMessage = `Edit ${itemType} Name\n\nCurrent ${currentLang === "ar" ? "Arabic" : "English"}: ${currentName}\nCurrent ${currentLang === "ar" ? "English" : "Arabic"}: ${otherName}\n\nEnter new ${currentLang === "ar" ? "Arabic" : "English"} name:`;
    newValue = prompt(promptMessage, currentName);
    if (!newValue || newValue.trim() === "") {
      return false;
    }
  }

  let fullNameNew = "";
  const cleanNewValue = newValue.trim();
  if (cleanNewValue.includes("|")) {
    const parts = cleanNewValue.split("|").map(s => s.trim());
    if (parts.length === 2) {
      fullNameNew = `${parts[0]}|${parts[1]}`;
    } else {
      showErrorToast("❌ Please enter both English and Arabic names separated by | e.g. en|عربي");
      return false;
    }
  } else {
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

  try {
    const response = await fetch("http://localhost:4000/update-option-complete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        target,
        oldValue: fullNameData.fullName,
        newValue: fullNameNew,
        type
      })
    });
    const result = await response.json();
    if (result.error) {
      showErrorToast(result.error);
      return false;
    } else {
      console.log(`✅ Update successful:`, result);
      refreshDropdown(selectId);
      return true;
    }
  } catch (err) {
    console.error("❌ Error in editOptionWithFullName:", err);
    showErrorToast(t['failed_to_edit_option']);
    return false;
  }
}

export async function getFullName(target, value) {
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

export function appendLangTagIfMissingg(value, selectId = null) {
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

export async function setSelectedOption(inputId, value, attempts = 10) {
  if (!value || attempts <= 0) return;
  const wait = (ms) => new Promise(res => setTimeout(res, ms));
  for (let i = 0; i < attempts; i++) {
    const input = document.getElementById(inputId);
    const span = document.getElementById("selected-" + inputId);
    if (input && span) {
      console.log(`🔍 setSelectedOption: inputId = ${inputId}, original value = "${value}"`);
      let displayValue = value;
      displayValue = displayValue.replace(/\s*\[(ar|en)\]$/i, "").trim();
      if (inputId.includes("department") && displayValue.includes("|")) {
        const parts = displayValue.split("|").map(s => s.trim());
        const currentLang = languageManager.currentLang;
        if (currentLang === "ar") {
          displayValue = parts[1] || parts[0];
        } else {
          displayValue = parts[0];
        }
      }
      if (inputId.includes("model") || inputId.includes("cpu") || inputId.includes("ram") || 
          inputId.includes("drive") || inputId.includes("os") || inputId.includes("generation") ||
          inputId.includes("printer-type") || inputId.includes("ink-type") || inputId.includes("scanner-type")) {
        displayValue = displayValue.replace(/\s*\[(ar|en)\]$/i, "").trim();
      }
      if (/\[(ar|en)\]$/i.test(value)) {
        console.log(`⚠️ القيمة تحتوي على تاج لغة: "${value}" -> تم تنظيفها إلى: "${displayValue}"`);
      }
      input.value = value;
      span.textContent = displayValue;
      return;
    } 
    await wait(200);
  }
  console.warn(`❌ setSelectedOption فشل: ${inputId} لم يتم العثور عليه بعد محاولات ${attempts}`);
}

export function openDeviceEditPopup(type, deviceData) {
  const lang = languageManager.currentLang;
  const t = languageManager.translations[lang];
  const popup = document.getElementById("popup-modal");
  const fieldsContainer = document.getElementById("popup-fields");
  const popupTitle = document.getElementById("popup-title");
  popup.style.display = "flex";
  popupTitle.textContent = t['edit'] + " " + t['device_specifications'];
  window.popupFieldsContainer = fieldsContainer;
  window.popupHeading = popupTitle;
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
    device.fetchDeviceSpecsByTypeAndDepartment();
  }
};
})();
}
window.openDeviceEditPopup = openDeviceEditPopup;

export function mapSelectIdToServerTarget(selectId) {
  const map = {
    "device-type": "problem-type",
    "technical-status": "technical",
    "problem-status": "problem-status",
    "section": "section",
     "floor": "floor",
'ticket-type': 'ticket_type',
'report-status': 'report_status',
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


export function openGenericEditPopup(deviceData) {
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
    device.fetchDeviceSpecsByTypeAndDepartment();
  }

    };
  }, 200);
} 
window.openGenericEditPopup = openGenericEditPopup;


export async function deleteOption(selectId, valueOrObject, type = null) {
  const lang = languageManager.currentLang;
  const t = languageManager.translations[lang];

  // تحقق مبكر من القيمة
  if (valueOrObject === undefined || valueOrObject === null) {
    showErrorToast(t['please_select_valid_option']);
    return false;
  }

  // إذا كان حذف مواصفة جهاز (device-spec) أرسل id فقط بدون أي معالجة نصية
  if (selectId === "device-spec") {
    let idToSend = valueOrObject;
    if (typeof valueOrObject === "object" && valueOrObject.id) {
      idToSend = valueOrObject.id;
    }
    const url = "http://localhost:4000/delete-device-specification";
    const body = { id: idToSend };
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
        showErrorToast(result.error);
        return false;
      }
      return true;
    } catch (err) {
      console.error("❌ Error deleting device specification:", err);
      showErrorToast(t['failed_to_delete_option']);
      return false;
    }
  }

  // نحتاج فقط الجزء العربي أو الإنجليزي عند حذف قسم أو مشكلة أو مهندس
  const needsFullName = ["section", "spec-department", "technical-status", "problem-status"].includes(selectId);
  let valueToSend = valueOrObject;
  let target = mapSelectIdToServerTarget(selectId);

  if (needsFullName && typeof valueOrObject === "string" && valueOrObject) {
    if (valueOrObject.includes("|")) {
      const parts = valueOrObject.split("|").map(s => s && s.trim());
      valueToSend = (languageManager.currentLang === "ar") ? (parts[1] || parts[0]) : parts[0];
    } else {
      valueToSend = valueOrObject;
    }
  } else if (typeof valueOrObject === "object" && valueOrObject && valueOrObject.fullName) {
    const parts = valueOrObject.fullName.split("|").map(s => s && s.trim());
    valueToSend = (languageManager.currentLang === "ar") ? (parts[1] || parts[0]) : parts[0];
  } else if (!valueOrObject) {
    showErrorToast(t['please_select_valid_option']);
    return false;
  }

  // تنظيف الفراغات حول |
  let valueString = valueToSend;
  if (typeof valueString === "string" && valueString.includes("|")) {
    const parts = valueString.split("|").map(s => s.trim());
    valueString = parts.join("|");
  }
  valueString = valueString.trim();

  // بناء body النهائي
  const isDeviceSpec = selectId === "device-spec";
  const url = isDeviceSpec
    ? "http://localhost:4000/delete-device-specification"
    : "http://localhost:4000/delete-option-complete";

  // فقط device-spec يرسل id
  const body = isDeviceSpec
    ? (typeof valueOrObject === "object" && valueOrObject.id ? { id: valueOrObject.id } : { id: valueOrObject })
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
      showErrorToast(result.error);
      return false;
    }

    if (!isDeviceSpec) {
      refreshDropdown(selectId);
    }

    return true;
  } catch (err) {
    console.error("❌ Error deleting option:", err);
    showErrorToast(t['failed_to_delete_option']);
    return false;
  }
}



export function refreshDropdown(selectId) {
  if (selectId === "problem-type") {
    device.fetchDeviceTypes();
  } else if (selectId === "section" || selectId.startsWith("department-")) {
    device.fetchDepartments(selectId);
  } else if (selectId === "ram-select") {
    device.fetchRAM();
  } else if (selectId === "ram-size-select") {
    device.fetchRAMSize();
  }
  else if (selectId === "cpu-select") {
    device.fetchCPU();
  }

  else if (selectId === "os-select") {
    device.fetchOS();
  } else if (selectId === "drive-select") {
    device.fetchDrives();
  }
  else if (selectId === "printer-type") {
    device.fetchPrinterTypes();
  }
  else if (selectId === "ink-type") {
    device.fetchInkTypes();
  } else if (selectId === "scanner-type") {
    device.fetchScannerTypes();
  }
  else if (selectId === "generation-select") {
    device.fetchProcessorGen();
  } else if (selectId.startsWith("model-")) {
    const type = selectId.replace("model-", "");
    device.fetchAndRenderModels(type, selectId);
  } else if (selectId === "device-spec") {
    device.fetchDeviceSpecsByTypeAndDepartment();
  }
    else if (selectId === "floor") {
    device.fetchFloors();
  }
  else if (selectId === "technical" || selectId === "technical-status") {
    device.fetchReporterNames(); // ✅ هنا الحل لتحديث الريبورترز بعد الحذف
    // -------------------
  }
  else if (selectId === "ticket-type") {
    device.loadTicketTypes();
  }
    else if (selectId === "report-status") {
    device.loadReportStatuses();
  }
  // ✅✅ الإضافات الجديدة:
  else if (selectId === "problem-status") {
    const typeDropdown = document.getElementById("device-type");
    const type = typeDropdown?.value?.toLowerCase();
    if (type) fetchProblemStatus(type);
  } else if (selectId === "technical-status") {
    device.fetchTechnicalStatus();
  }
  // -------------------
  else {
    console.warn(`❓ Unknown selectId for refreshing: ${selectId}`);
  }
}


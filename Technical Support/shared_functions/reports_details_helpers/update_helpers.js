import { fetchOptions, createSelectElement, populateModelDropdown, getLookupField } from './helpers.js'; // استيراد الدوال المساعدة
import { showToast, showErrorToast, showSuccessToast, showWarningToast } from '../toast.js';

/**
 * Activates edit mode for the report details page
 * @param {Object} reportData - The current report data
 * @param {Array} lookupConfig - Configuration for lookup fields
 * @param {Array} specConfig - Configuration for specification fields
 */
export const activateEditMode = async (reportData, lookupConfig, specConfig) => {
  // إظهار/إخفاء الأزرار
  document.querySelector(".edit-btn").style.display = "none"; // إخفاء زر التعديل
  document.querySelector(".save-btn").style.display = "inline-block"; // إظهار زر الحفظ
  
  // بعد loop على lookupConfig و specConfig:
  const editableFields = [
    "device_name",
    "serial_number",
    "governmental_number", // بدل ministry-number
    "ip_address",
    "mac_address",
    "ink_serial"    // هذا
  ];

  // استبدال كل <span> بالـ <input>
  editableFields.forEach(fieldId => {
    // إذا هذا الحقل هو ink_serial، نعبّي value و data-id و oldText بشكل خاص
    if (fieldId === "ink_serial") {
      const span = document.getElementById("ink_serial");
      if (!span) return;
      const input = document.createElement("input");
      input.type = "text";
      input.id = "ink_serial-input";
      // القيمة الظاهرة الحالية
      input.value = span.textContent.trim();
      // نحفظ الـ id القديم
      input.dataset.id = span.dataset.id || "";
      input.dataset.oldText = span.textContent.trim();
      span.replaceWith(input);
      return; // ننهي هنا للتجنب إنشاء Input مزدوج
    }

    // البقية تتصرّف كالمعتاد
    const span = document.getElementById(fieldId);
    if (!span) return;
    const input = document.createElement("input");
    input.type = "text";
    input.id = `${fieldId}-input`;
    input.value = span.textContent.trim();
    span.dataset.oldText = span.textContent;
    span.replaceWith(input);
  });

  // 3) بعدها مباشرة: loop على lookupConfig لتحويل spans إلى <select>
  for (const cfg of lookupConfig) {
    const spanEl = document.getElementById(cfg.fieldId);
    if (!spanEl) continue;

    const currentId = spanEl.dataset.id || "";
    const currentRawText = spanEl.dataset.rawtext || spanEl.textContent.trim();
    
    // 🔧 إضافة logging خاص للمهندس
    if (cfg.fieldId === "assigned-to") {
      console.log("🔍 Creating assigned-to select:", {
        currentId: currentId,
        currentRawText: currentRawText,
        spanText: spanEl.textContent,
        dataset: {
          id: spanEl.dataset.id,
          rawtext: spanEl.dataset.rawtext,
          key: spanEl.dataset.key
        }
      });
      
      // 🔧 إضافة logging مفصل للبيانات الأصلية
      console.log("🔍 Original report data for engineer:", {
        maintenance_type: reportData.maintenance_type,
        technician_name: reportData.technician_name,
        technical_engineer: reportData.technical_engineer,
        assigned_to: reportData.assigned_to,
        assigned_to_raw: reportData.assigned_to_raw,
        assigned_to_id: reportData.assigned_to_id,
        technician_id: reportData.technician_id
      });
    }
    
    let options;
    try { options = await fetchOptions(cfg.api); }
    catch { continue; }

    const select = createSelectElement(
      options,
      currentId,
      currentRawText,
      cfg.fieldId
    );
    select.id = cfg.fieldId + "-select";

    // لو الحقل هو "assigned-to" (المهندس) خزن الـ id القديم
    if (cfg.fieldId === "assigned-to") {
      select.dataset.oldId = currentId;
      console.log("🔍 Set assigned-to oldId:", currentId);
    }

    spanEl.dataset.oldText = spanEl.textContent;
    spanEl.replaceWith(select);
  }

  const deviceTypeSelect = document.getElementById("device_type-select");
  if (deviceTypeSelect) {
    // هنا القيمة ستكون إنكليزي مثل "scanner"
    await populateModelDropdown(deviceTypeSelect.value);
  }

  // 5) بعد الموديل: loop على specConfig لتحويل كل span داخل #device-specs
  const specBoxes = document.querySelectorAll("#device-specs .spec-box");
  for (const { key, api } of specConfig) {
    for (const box of specBoxes) {
      const labelSpan = box.querySelector(`span[data-i18n="${key}"]`);
      if (!labelSpan) continue;

      // إيجاد span القيمة المجاورة
      let sibling = labelSpan.nextSibling;
      while (sibling && sibling.nodeType !== Node.ELEMENT_NODE) {
        sibling = sibling.nextSibling;
      }
      if (!sibling || sibling.tagName !== "SPAN") continue;

      const valueSpan = sibling;
      const currentId = valueSpan.dataset.id || "";
      const currentRawText = valueSpan.dataset.rawtext || valueSpan.textContent.trim();

      let options;
      try {
        options = await fetchOptions(api);
        console.log(`[specConfig] key=${key}`, options);
      }
      catch { continue; }

      const select = createSelectElement(
        options,
        currentId,
        currentRawText,
        key
      );
      select.id = `${key}-select`;
      valueSpan.dataset.oldText = valueSpan.textContent;
      valueSpan.replaceWith(select);
    }
  }

  // === 4) حقل الوصف (#description) ===
  const descEl = document.getElementById("description");
  if (descEl) {
    descEl.dataset.oldText = descEl.textContent;
    descEl.contentEditable = "true";
    descEl.style.border = "1px dashed #aaa";
    descEl.style.backgroundColor = "#fdfdfd";
    descEl.style.minHeight = "60px";
    descEl.style.padding = "4px";
  }

  // === 5) إظهار مداخل المرفقات والتوقيع ===
  document.getElementById("attachment-input").style.display = "block";
  document.getElementById("signature-edit-wrapper").style.display = "block";

  showInfoToast("📝 وضع التعديل مفعل");
};

/**
 * Collects updated data from the form fields
 * @param {Object} reportData - The original report data
 * @param {Array} lookupConfig - Configuration for lookup fields
 * @param {Array} specConfig - Configuration for specification fields
 * @returns {Object} The updated data object
 */
export const collectUpdatedData = (reportData, lookupConfig, specConfig) => {
  // أولاً، جب الـ <select> حق "المسؤول":
  const engSelect = document.getElementById("assigned-to-select");
  const oldEngineerId = engSelect.dataset.oldId || reportData.assigned_to_id || null;

  // نجمع الحقول الأساسية
  const updatedData = {
    id: reportData.id,
    technical_notes: reportData.technical_notes,  // ← احتفظ بقيمة الملاحظة القديمة
    engineer_id: oldEngineerId,
    printer_type_id: reportData.printer_type_id,
    printer_type: reportData.printer_type,
    ink_type_id: reportData.ink_type_id,
    ink_type: reportData.ink_type,
    scanner_type_id: reportData.scanner_type_id,
    scanner_type: reportData.scanner_type,
    status: reportData.status,
    full_description: reportData.full_description,   // ← أضفته
    priority: reportData.priority,                   // ← أضفته
  };

  // 👇 جيب القيمة الجديدة للمهندس
  const selectedOption = engSelect.options[engSelect.selectedIndex];
  
  // 🔧 إصلاح: احصل على الاسم الكامل من الخيار المحدد
  let fullName = selectedOption.dataset.fullname?.trim() || selectedOption.textContent.trim() || null;
  
  console.log("🔍 Initial fullName from selectedOption:", {
    dataset_fullname: selectedOption.dataset.fullname,
    textContent: selectedOption.textContent,
    fullName: fullName,
    selectedIndex: engSelect.selectedIndex,
    totalOptions: engSelect.options.length
  });
  
  // 🔧 إضافة logging مفصل لجميع الخيارات
  console.log("🔍 All engineer options:", Array.from(engSelect.options).map((opt, index) => ({
    index: index,
    value: opt.value,
    textContent: opt.textContent,
    dataset_fullname: opt.dataset.fullname,
    selected: opt.selected
  })));
  
  // 🔧 إذا كان الخيار المحدد هو الخيار الأول (الحالي)، استخدم الاسم الكامل من البيانات الأصلية
  if (engSelect.selectedIndex === 0 && engSelect.dataset.oldText) {
    fullName = engSelect.dataset.oldText;
    console.log("🔍 Using oldText for first option:", engSelect.dataset.oldText);
  }
  
  // 🔧 إذا لم نجد الاسم الكامل، ابحث عنه في قائمة الخيارات
  if (!fullName || !fullName.includes("|")) {
    console.log("🔍 Searching for full name in options...");
    for (let i = 0; i < engSelect.options.length; i++) {
      const opt = engSelect.options[i];
      console.log(`🔍 Option ${i}:`, {
        value: opt.value,
        textContent: opt.textContent,
        dataset_fullname: opt.dataset.fullname,
        matches: opt.value === selectedOption.value
      });
      
      if (opt.value === selectedOption.value && opt.dataset.fullname && opt.dataset.fullname.includes("|")) {
        fullName = opt.dataset.fullname;
        console.log("🔍 Found full name in option:", fullName);
        break;
      }
    }
  }

  // 🔧 إصلاح: استخدم value من الخيار المحدد مباشرة
  const selectedEngineerId = selectedOption.value || engSelect.dataset.oldId || reportData.assigned_to_id || null;

  console.log("🔧 Engineer Debug:", {
    selectedIndex: engSelect.selectedIndex,
    selectedValue: selectedOption.value,
    selectedText: selectedOption.textContent,
    fullName: fullName,
    oldId: engSelect.dataset.oldId,
    reportId: reportData.assigned_to_id,
    finalId: selectedEngineerId
  });

  // 🔧 إضافة validation
  if (!selectedEngineerId && selectedOption.value !== "") {
    console.warn("⚠️ Warning: No engineer ID found but option has value:", selectedOption.value);
  }

  updatedData.engineer_id = selectedEngineerId;
  updatedData.assigned_to = fullName;
  updatedData.technical_engineer = fullName;

  // 🔧 إصلاح: إضافة الحقول الصحيحة حسب نوع الصيانة
  if (reportData.maintenance_type === "Regular") {
    updatedData.technical_engineer_id = selectedEngineerId;  // ← إضافة ID للمهندس
    updatedData.technical_engineer = fullName;               // ← الاسم الكامل
    console.log("🔧 Regular Maintenance - Engineer fields:", {
      technical_engineer_id: selectedEngineerId,
      technical_engineer: fullName
    });
  } else if (reportData.maintenance_type === "General") {
    updatedData.technician_id = selectedEngineerId;          // ← ID للفني
    updatedData.technician_name = fullName;                  // ← اسم الفني
    console.log("🔧 General Maintenance - Technician fields:", {
      technician_id: selectedEngineerId,
      technician_name: fullName
    });
  } else if (reportData.maintenance_type === "Internal") {
    updatedData.assigned_to_id = selectedEngineerId;         // ← ID للمسؤول
    updatedData.assigned_to = fullName;                      // ← اسم المسؤول
    console.log("🔧 Internal Maintenance - Assigned fields:", {
      assigned_to_id: selectedEngineerId,
      assigned_to: fullName
    });
  } else if (reportData.maintenance_type === "External") {
    updatedData.assigned_to_id = selectedEngineerId;         // ← ID للمسؤول
    updatedData.assigned_to = fullName;                      // ← اسم المسؤول
    console.log("🔧 External Maintenance - Assigned fields:", {
      assigned_to_id: selectedEngineerId,
      assigned_to: fullName
    });
  }

  // Process lookup fields
  for (const cfg of lookupConfig) {
    if (cfg.fieldId === 'assigned-to') continue;

    const selectId = cfg.fieldId + "-select";
    const select = document.getElementById(selectId);
    if (!select) {
      console.warn(`⚠️ no <select> found for "${selectId}"`);
      continue;  // نتجاوز لو ما فيه select
    }

    // طباعة كم خيار وفهرس المحدد حالياً
    console.log(`🔍 ${cfg.fieldId}: selectedIndex=${select.selectedIndex}, optionsCount=${select.options.length}`);

    const selIdx = select.selectedIndex;
    const opt = select.options[selIdx];
    if (!opt) {
      console.warn(`⚠️ no <option> at index ${selIdx} for "${selectId}"`);
      continue;  // نتجاوز لو ما فيه option
    }

    const backendField = getLookupField(cfg.fieldId, reportData.maintenance_type);

    if (cfg.fieldId === "department" || cfg.fieldId === "assigned-to") {
      updatedData[backendField] = opt.dataset.fullname?.trim() || null;
    }
    else if (cfg.fieldId === "category") {
      updatedData[backendField] = select.value.trim() || null;
    }
    else if (cfg.fieldId === "device_type") {
      const span = document.getElementById("device_type");
      const sel = select.value.trim();
      const orig = span?.dataset.key?.trim();
      const fb = reportData.device_type?.trim();
      updatedData[backendField] = sel || orig || fb || null;
    }
    else {
      updatedData[backendField] =
        opt.dataset.fullname?.trim()
        || select.value.trim()
        || opt.textContent.trim()
        || null;
    }
  }

  // Process description
  {
    const descEl = document.getElementById("description");
    const descNew = descEl?.innerText.trim() || null;
    const descOld = descEl?.dataset.oldText?.trim() || null;
    if (descNew !== descOld) {
      updatedData.full_description = descNew;
    }
  }  

  // Process technical notes
  const noteEl = document.getElementById("note");
  const newNoteText = noteEl.textContent.trim();
  const oldNoteText = noteEl.dataset.oldText?.trim() || "";

  if (newNoteText !== oldNoteText) {
    updatedData.technical_notes = newNoteText;
  }

  // Process General maintenance specific fields
  if (reportData.maintenance_type === "General") {
    document.querySelectorAll("#note .info-row").forEach(row => {
      const key = row.querySelector(".info-label").dataset.i18n;
      const val = row.querySelector(".info-value").innerText.trim() || null;
      switch (key) {
        case "customer_name":
          if (val !== reportData.customer_name) updatedData.customer_name = val;
          break;
        case "id_number":
          if (val !== reportData.id_number) updatedData.id_number = val;
          break;
        case "ext_number":
          if (val !== reportData.extension) updatedData.extension = val;
          break;
        case "initial_diagnosis":
          if (val !== reportData.diagnosis_initial) updatedData.diagnosis_initial = val;
          break;
        case "final_diagnosis":
          if (val !== reportData.diagnosis_final) updatedData.diagnosis_final = val;
          break;
        case "floor":
          if (val !== reportData.floor) updatedData.floor = val;
          break;
      }
    });
  } else {
    // Process external-legacy specific fields
    if (reportData.source === "external-legacy") {
      const finalDiag = reportData.final_diagnosis;
      if (finalDiag && finalDiag !== reportData.final_diagnosis) {
        updatedData.final_diagnosis = finalDiag;
      }
      const manager = reportData.maintenance_manager;
      if (manager && manager !== reportData.maintenance_manager) {
        updatedData.maintenance_manager = manager;
      }
    }
  }

  // Process basic input fields
  updatedData.device_name = document.getElementById("device_name-input")?.value || null;
  updatedData.serial_number = document.getElementById("serial_number-input")?.value || null;
  updatedData.governmental_number = document.getElementById("governmental_number-input")?.value || null;

  // Process model
  const selModel = document.getElementById("model-select");
  if (selModel) {
    updatedData.model_id = selModel.value || null;
    updatedData.model_name = selModel.options[selModel.selectedIndex]?.textContent || null;
  }

  // Process specification fields
  for (const { key } of specConfig) {
    const sel = document.getElementById(`${key}-select`);
    let id, name;

    if (sel && sel.selectedIndex >= 0) {
      const opt = sel.options[sel.selectedIndex];
      id   = opt.value;
      name = opt.dataset.fullname?.trim() || opt.textContent.trim() || null;
    } else {
      switch (key) {
        case "printer_type":
          id   = updatedData.printer_type_id;
          name = updatedData.printer_type;
          break;
        case "scanner_type":
          id   = updatedData.scanner_type_id;
          name = updatedData.scanner_type;
          break;
        case "ink_type":
          id   = updatedData.ink_type_id;
          name = updatedData.ink_type;
          break;
        default:
          id   = updatedData[`${key}_id`];
          name = updatedData[key];
      }
    }

    switch (key) {
      case "printer_type":
        updatedData.printer_type_id = id;
        updatedData.printer_type    = name;
        break;
      case "scanner_type":
        updatedData.scanner_type_id = id;
        updatedData.scanner_type    = name;
        break;
      case "ink_type":
        updatedData.ink_type_id = id;
        updatedData.ink_type    = name;
        break;
      case "cpu":
        updatedData.cpu_id   = id;
        updatedData.cpu_name = name;
        break;
      case "ram":
        updatedData.ram_id   = id;
        updatedData.ram_type = name;
        break;
      case "os":
        updatedData.os_id   = id;
        updatedData.os_name = name;
        break;
      case "hard_drive":
        updatedData.drive_id   = id;
        updatedData.drive_type = name;
        break;
      case "generation":
        updatedData.generation_id     = id;
        updatedData.generation_number = name;
        break;
      case "ram_size":
        updatedData.ram_size_id = id;
        updatedData.ram_size    = name;
        break;
    }
  }

  // Process IP and MAC addresses
  updatedData.ip_address = document.getElementById("ip_address-input")?.value
    || document.getElementById("ip_address")?.textContent.trim()
    || null;

  updatedData.mac_address = document.getElementById("mac_address-input")?.value
    || document.getElementById("mac_address")?.textContent.trim()
    || null;

  updatedData.source = reportData.source || "internal";
  console.log(">>> Payload.data.source =", updatedData.source);

  // Process ink serial
  const inkSerialInput = document.getElementById("ink_serial-input");
  if (inkSerialInput) {
    const newSerial = inkSerialInput.value.trim() || null;
    const oldText = inkSerialInput.dataset.oldText?.trim() || "";
    const oldId = inkSerialInput.dataset.id || null;

    if (newSerial === oldText) {
      updatedData.ink_serial_number = oldId;
    } else {
      updatedData.ink_serial_number = newSerial;
    }

    console.log(
      "🏷️ ink_serial-input →",
      "newSerial=", newSerial,
      "oldText=", oldText,
      "→ sending ink_serial_number=", updatedData.ink_serial_number
    );
  }

  console.log("🚀 إرسال التحديث:", updatedData);

  // 🔧 إضافة logging مفصل للبيانات المرسلة
  console.log("🔍 Final Payload Analysis:", {
    maintenance_type: reportData.maintenance_type,
    engineer_fields: {
      engineer_id: updatedData.engineer_id,
      assigned_to: updatedData.assigned_to,
      technical_engineer: updatedData.technical_engineer,
      technical_engineer_id: updatedData.technical_engineer_id,
      technician_id: updatedData.technician_id,
      technician_name: updatedData.technician_name,
      assigned_to_id: updatedData.assigned_to_id
    },
    selectedEngineerId: selectedEngineerId,
    fullName: fullName
  });

  return updatedData;
};

/**
 * Prepares FormData for submission including attachments and signatures
 * @param {Object} updatedData - The updated data object
 * @param {boolean} userDrewOnCanvas - Whether user drew on signature canvas
 * @returns {Promise<FormData>} The prepared FormData
 */
export const prepareFormData = async (updatedData, userDrewOnCanvas) => {
  const formData = new FormData();
  formData.append("data", JSON.stringify(updatedData));

  // إضافة logging إضافي للتشخيص
  console.log("🔍 Final Engineer Data:", {
    engineer_id: updatedData.engineer_id,
    assigned_to: updatedData.assigned_to,
    technical_engineer: updatedData.technical_engineer
  });

  // 🔧 إضافة validation نهائي
  if (!updatedData.engineer_id && updatedData.assigned_to) {
    console.warn("⚠️ Warning: No engineer_id but assigned_to exists:", updatedData.assigned_to);
  }

  // إرفاق الملفات
  const file = document.getElementById("attachment-input")?.files[0];
  if (file) formData.append("attachment", file);

  const signatureUpload = document.getElementById("signatureUpload");
  const canvas = document.getElementById("signatureCanvas");
  if (signatureUpload?.files?.length > 0) {
    formData.append("signature", signatureUpload.files[0]);
  } else if (userDrewOnCanvas) {
    await new Promise(resolve => {
      canvas.toBlob(blob => {
        if (blob?.size > 100) {
          formData.append("signature", blob, "signature.png");
        }
        resolve();
      });
    });
  }

  return formData;
};

/**
 * Submits the updated data to the server
 * @param {FormData} formData - The prepared FormData
 * @returns {Promise<Object>} The server response
 */
export const submitUpdatedData = async (formData) => {
  console.log("🚀 Sending request to server...");
  const res = await fetch("http://localhost:4000/update-report-full", {
    method: "POST",
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    body: formData
  });
  
  const result = await res.json();
  console.log("🔍 Server response:", result);
  
  if (!res.ok || result.error) {
    const msg = result.error || result.message || `خطأ HTTP ${res.status}`;
    throw new Error(msg);
  }
  
  return result;
};

/**
 * Handles successful save by hiding form elements and reloading the page
 */
export const handleSuccessfulSave = () => {
  showSuccessToast("✅ تم الحفظ بنجاح.");

  // إخفاء الحقول بأمان
  const att = document.getElementById("attachment-input");
  if (att) att.style.display = "none";
  const sigWr = document.getElementById("signature-edit-wrapper");
  if (sigWr) sigWr.style.display = "none";

  const saveBtn = document.querySelector(".save-btn");
  const cancelBtn = document.querySelector(".cancel-btn");
  const editBtn = document.querySelector(".edit-btn");
  if (saveBtn) saveBtn.style.display = "none";
  if (cancelBtn) cancelBtn.style.display = "none";
  if (editBtn) editBtn.style.display = "inline-block";

  // 🔧 إضافة تأخير أطول قبل إعادة التحميل للتأكد من اكتمال التحديث في الباك إند
  setTimeout(() => {
    console.log("🔄 Reloading page after successful save...");
    // 🔧 إضافة cache-busting parameter للتأكد من عدم استخدام cache
    const currentUrl = new URL(window.location);
    currentUrl.searchParams.set('_t', Date.now());
    window.location.href = currentUrl.toString();
  }, 1000);
};

/**
 * Deactivates edit mode and restores original display
 * @param {Array} specConfig - Configuration for specification fields
 */
export const deactivateEditMode = (specConfig) => {
  // 7.1) إعادة حقول الإدخال الأساسية إلى spans
  const editableFields = [
    "device_name",
    "serial_number", 
    "governmental_number",
    "ip_address",
    "mac_address",
    "ink_serial"
  ];

  editableFields.forEach(fieldId => {
    const input = document.getElementById(`${fieldId}-input`);
    if (!input) return;
    
    const span = document.createElement("span");
    span.id = fieldId;
    span.textContent = input.value.trim();
    
    // حفظ البيانات الإضافية
    if (input.dataset.id) span.dataset.id = input.dataset.id;
    if (input.dataset.oldText) span.dataset.oldText = input.dataset.oldText;
    
    input.replaceWith(span);
  });

  // 7.2) إعادة .spec-box إلى spans الأصلية أو استبدال الـ selects داخلها
  const specBoxes = document.querySelectorAll("#device-specs .spec-box");
  for (const { key } of specConfig) {
    for (const box of specBoxes) {
      const labelSpan = box.querySelector(`span[data-i18n="${key}"]`);
      if (!labelSpan) continue;

      const select = box.querySelector(`#${key}-select`);
      if (select) {
        const newValText = select.options[select.selectedIndex]?.textContent || "";
        const spanVal = document.createElement("span");
        spanVal.textContent = newValText;
        // نخزن id جديد إن لزم الأمر
        spanVal.dataset.id = select.value || "";
        select.replaceWith(spanVal);
      } else {
        // إن بقي النص حراً، نعيده كما كان
        let oldText = labelSpan.dataset.oldText || "";
        let sibling = labelSpan.nextSibling;
        while (sibling && sibling.nodeType !== Node.ELEMENT_NODE) {
          sibling = sibling.nextSibling;
        }
        if (sibling && sibling.tagName === "SPAN") {
          sibling.textContent = oldText;
        }
      }
    }
  }

  // 7.3) إعادة حالة الوصف النصي
  const descEl2 = document.getElementById("description");
  if (descEl2) {
    descEl2.removeAttribute("contenteditable");
    descEl2.style.border = "none";
    descEl2.style.backgroundColor = "transparent";
    descEl2.style.padding = "0";
    descEl2.textContent = descEl2.dataset.oldText || descEl2.textContent;
  }

  // 7.4) إعادة حقول المواصفات الغير قابلة للتعديل
  const allSpecEls = document.querySelectorAll("#device-specs .spec-box");
  allSpecEls.forEach(el => {
    el.removeAttribute("contenteditable");
    el.style.border = "none";
    el.style.backgroundColor = "transparent";
    el.style.padding = "0";
    el.style.display = "";
    el.style.minHeight = "";
  });

  // 7.5) إخفاء مدخلي المرفق والتوقيع
  document.getElementById("attachment-input").style.display = "none";
  document.getElementById("signature-edit-wrapper").style.display = "none";

  // 7.6) إعادة الأزرار إلى وضعهم الأصلي
  document.querySelector(".save-btn").style.display = "none";
  document.querySelector(".cancel-btn").style.display = "none";
  document.querySelector(".edit-btn").style.display = "inline-block";
}; 
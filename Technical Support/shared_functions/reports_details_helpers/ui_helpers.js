// دوال واجهة المستخدم والصور لتقارير التفاصيل

// استيراد المتغيرات المطلوبة
let languageManager, translations;

// تخزين مؤقت لاستدعاءات API
const apiCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 دقائق

// دالة لتعيين المتغيرات
export function setGlobalVariables(langManager, trans) {
  languageManager = langManager;
  translations = trans;
}

// دالة للتحقق من التخزين المؤقت
function getCachedData(key) {
  const cached = apiCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

// دالة لحفظ البيانات في التخزين المؤقت
function setCachedData(key, data) {
  apiCache.set(key, {
    data,
    timestamp: Date.now()
  });
}

export function getImageBase64(imgElement) {
  const canvas = document.createElement("canvas");
  canvas.width = imgElement.naturalWidth;
  canvas.height = imgElement.naturalHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(imgElement, 0, 0);
  return canvas.toDataURL("image/png");
}

export function waitForImagesToLoad(images) {
  return Promise.all(
    images.map(img => {
      return new Promise(resolve => {
        if (img.complete) resolve();
        else img.onload = () => resolve();
      });
    })
  );
}

// دالة إنشاء عنصر select معقدة
export function createSelectElement(options, currentId, currentRawText, fieldId) {
  console.log("🔍 createSelectElement called:", {
    fieldId: fieldId,
    currentId: currentId,
    currentRawText: currentRawText,
    optionsCount: options.length
  });
  
  const select = document.createElement("select");
  select.style.minWidth = "140px";
  select.style.padding  = "4px";
  select.style.display  = "inline-block";

  // دالة تنظيف الصيغة [en]/[ar] وتقسيم الـ pipe
  const clean = str => (str||"")
    .replace(/\[en\]$/i, "")
    .replace(/\[ar\]$/i, "")
    .trim()
    .split("|")[0];

  // 1) حدد currentText المعروض
  let currentText;
  if (fieldId === "department" || fieldId === "assigned-to") {
    const parts = (currentRawText||"").split("|").map(p=>p.trim());
    // 🔧 إصلاح: استخدم اللغة الحالية بدلاً من الإنجليزية دائماً
    currentText = languageManager.currentLang === "ar" ? (parts[1]||parts[0]) : parts[0];
  } else {
    currentText = clean(currentRawText);
  }

  // 2) إذا ما عندنا currentId، جرّب تطابق currentText مع options
  let effectiveId = currentId;
  if (!effectiveId) {
    const match = options.find(opt => {
      // 🔧 إصلاح: تطابق أكثر دقة للمهندسين
      if (fieldId === "assigned-to") {
        const optFullName = opt.fullName || opt.technician_name || opt.name || "";
        const optParts = optFullName.split("|");
        const optEn = optParts[0]?.trim() || "";
        const optAr = optParts[1]?.trim() || "";
        
        // تطابق مع النص الحالي
        return optEn === currentText || optAr === currentText || optFullName === currentText;
      } else {
        return clean(opt.fullName||opt.name||"") === currentText;
      }
    });
    if (match) effectiveId = String(match.id);
  }

  console.log("🔍 createSelectElement processing:", {
    currentText: currentText,
    effectiveId: effectiveId,
    fieldId: fieldId
  });

  // 3) بناء خيار الـ placeholder بالقيمة الصحيحة
  if (currentText) {
    const optCurr = document.createElement("option");
    // 🔧 إصلاح: تأكد من أن value يحتوي على ID صحيح
    optCurr.value = effectiveId || "";
    optCurr.textContent = currentText;
    optCurr.selected = true;
    
    // 🔧 إصلاح: احفظ الاسم الكامل في dataset.fullname
    if (fieldId === "assigned-to") {
      // للمهندسين، ابحث عن الاسم الكامل في قائمة الخيارات
      let fullNameToUse = currentRawText || currentText;
      
      // 🔧 ابحث عن الخيار المطابق في options للحصول على الاسم الكامل
      const matchingOption = options.find(opt => {
        const optFullName = opt.fullName || opt.technician_name || opt.name || "";
        const optParts = optFullName.split("|");
        const optEn = optParts[0]?.trim() || "";
        const optAr = optParts[1]?.trim() || "";
        
        // تطابق مع النص الحالي أو الاسم الكامل
        return optEn === currentText || optAr === currentText || optFullName === currentText || optFullName === currentRawText;
      });
      
      if (matchingOption && matchingOption.fullName && matchingOption.fullName.includes("|")) {
        fullNameToUse = matchingOption.fullName;
        console.log("🔍 Found matching option for current engineer:", {
          currentText: currentText,
          matchingFullName: fullNameToUse
        });
      }
      
      optCurr.dataset.fullname = fullNameToUse;
      
      // 🔧 إضافة logging مفصل للمهندسين
      console.log("🔍 Engineer option details:", {
        fieldId: fieldId,
        currentText: currentText,
        currentRawText: currentRawText,
        fullNameToUse: fullNameToUse,
        effectiveId: effectiveId,
        matchingOption: matchingOption ? {
          id: matchingOption.id,
          fullName: matchingOption.fullName
        } : null
      });
    } else {
      optCurr.dataset.fullname = currentRawText || currentText;
    }

    select.appendChild(optCurr);

    // خزّن الـ effectiveId والمؤشرات كلها
    select.dataset.oldId = effectiveId || "";
    select.dataset.currentId = effectiveId || "";
    select.dataset.oldText = currentRawText || "";
    select.dataset.currentName = currentText;
    
    console.log("🔍 Created current option:", {
      value: optCurr.value,
      textContent: optCurr.textContent,
      fullname: optCurr.dataset.fullname
    });
  }

  // 4) بناء بقية الخيارات
  options.forEach(opt => {
    let raw;
    switch (fieldId) {
      case "department":
      case "assigned-to":
        const parts = (opt.fullName||"").split("|");
        // 🔧 إصلاح: استخدم اللغة الحالية بدلاً من الإنجليزية دائماً
        raw = (languageManager.currentLang === "ar"
               ? (parts[1]||parts[0])
               : parts[0]).trim();
        break;
      case "generation": raw = clean(opt.generation_number); break;
      case "cpu":        raw = clean(opt.cpu_name);       break;
      case "ram":        raw = clean(opt.ram_type);       break;
      case "os":         raw = clean(opt.os_name);        break;
      case "hard_drive": raw = clean(opt.drive_type);     break;
      case "ram_size":   raw = clean(opt.ram_size);       break;
      case "printer_type": raw = clean(opt.printer_type); break;
      case "scanner_type": raw = clean(opt.scanner_type); break;
      case "ink_type":     raw = clean(opt.ink_type);     break;
      default:
        raw = clean(opt.fullName||opt.name||"");
    }

    // تجاهل التكرار
    if (String(opt.id) === select.dataset.currentId || raw === currentText) return;

    const o = document.createElement("option");
    // 🔧 إصلاح: تأكد من أن value يحتوي على ID صحيح
    o.value = String(opt.id);
    o.textContent = raw;
    // 🔧 إصلاح: احفظ الاسم الكامل ثنائي اللغة للمهندسين والأقسام
    if (fieldId === "assigned-to" || fieldId === "department") {
      o.dataset.fullname = opt.fullName || opt.name || "";
    } else {
      o.dataset.fullname = opt.fullName||opt.name||raw;
    }
    select.appendChild(o);
  });

  // 🔧 إضافة event listener لتحديث dataset عند تغيير الاختيار
  select.addEventListener("change", function() {
    const selectedOption = this.options[this.selectedIndex];
    if (selectedOption) {
      this.dataset.currentId = selectedOption.value;
      this.dataset.currentName = selectedOption.textContent;
      console.log("🔍 Select changed:", {
        fieldId: fieldId,
        newValue: selectedOption.value,
        newText: selectedOption.textContent
      });
    }
  });

  console.log("🔍 Final select created:", {
    fieldId: fieldId,
    optionsCount: select.options.length,
    selectedIndex: select.selectedIndex,
    selectedValue: select.options[select.selectedIndex]?.value
  });

  return select;
}

// دالة جلب الخيارات من API
export async function fetchOptions(apiUrl) {
  console.log("🔍 Fetching options from:", apiUrl);
  
  // التحقق من التخزين المؤقت أولاً
  const cachedData = getCachedData(apiUrl);
  if (cachedData) {
    console.log("🔍 Using cached data for:", apiUrl);
    return cachedData;
  }
  
  const res = await fetch(apiUrl);
  if (!res.ok) throw new Error("فشل جلب البيانات من " + apiUrl);
  const rawData = await res.json();
  
  console.log("🔍 Raw data from API:", rawData);

  const processedData = rawData.map(opt => {
    // 🔧 إصلاح: معالجة خاصة للمهندسين من API /Technical
    if (apiUrl.includes('/Technical')) {
      return {
        ...opt,
        id: opt.id,
        fullName: opt.name || "" // Engineers table has 'name' column with bilingual format
      };
    }
    
    return {
      ...opt,
      fullName:
        opt.fullName ||
        opt.name ||
        opt.model_name ||
        opt.serial_number ||
        opt.printer_type ||
        opt.scanner_type ||
        opt.ink_type ||
        ""
    };
  });
  
  console.log("🔍 Processed data:", processedData);
  
  // حفظ البيانات في التخزين المؤقت
  setCachedData(apiUrl, processedData);
  
  return processedData;
}

// دالة تعبئة قائمة الموديلات
export async function populateModelDropdown(deviceTypeName, currentLang = "en") {
  const spanModel = document.getElementById("model");
  if (!spanModel) return;

  const currentModelId = spanModel.dataset.id || "";
  const currentModelRawText = spanModel.dataset.rawtext || spanModel.textContent.trim();

  // نفصل rawText للإنجليزي والعربي
  const clean = currentModelRawText
    .replace(/\[en\]$/i, "")
    .replace(/\[ar\]$/i, "")
    .trim();
  const [enName, arName] = clean.split("|").map(p => p.trim());
  const displayName = currentLang === "ar" ? (arName || enName) : enName;

  // حدد المفتاح الإنكليزي للـ endpoint (نفس ما عندك)
  let key = deviceTypeName.trim().toLowerCase();
  if (/[^a-z0-9]/i.test(deviceTypeName)) {
    for (const engKey of Object.keys(translations.deviceType)) {
      if (translations.deviceType[engKey].ar === deviceTypeName) {
        key = engKey.toLowerCase();
        break;
      }
    }
  }
  let endpoint;
  if (["pc", "laptop", "desktop"].includes(key)) endpoint = "http://localhost:4000/PC_Model";
  else if (key === "printer") endpoint = "http://localhost:4000/Printer_Model";
  else if (key === "scanner") endpoint = "http://localhost:4000/Scanner_Model";
  else endpoint = `http://localhost:4000/models-by-type/${encodeURIComponent(key)}`;

  console.log("▶ Fetching endpoint:", endpoint);

  // جلب البيانات
  let raw = [];
  try {
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error(res.statusText);
    raw = await res.json();
  } catch {
    raw = [];
  }

  // فكّ البيانات إلى modelOptions
  let modelOptions = [];
  if (raw.length > 0) {
    const sample = raw[0];
    if (sample.model_id != null && sample.model_name != null) {
      modelOptions = raw.map(i => ({ id: String(i.model_id), text: i.model_name }));
    } else if (sample.id != null && sample.name != null) {
      modelOptions = raw.map(i => ({ id: String(i.id), text: i.name }));
    } else {
      modelOptions = raw.map(i => ({
        id: String(i.id || i.model_name || JSON.stringify(i)),
        text: String(i.model_name || i.name || JSON.stringify(i))
      }));
    }
  }
  console.log("▶ Parsed modelOptions:", modelOptions);

  // ابني الـ <select>
  const selectModel = document.createElement("select");
  selectModel.id = "model-select";
  selectModel.style.minWidth = "140px";
  selectModel.style.padding = "4px";

  // 👇 هذا الخيار الأول دائماً هو الموديل الحالي
  const placeholder = document.createElement("option");
  placeholder.value = currentModelId;       // ← هنا ID
  placeholder.textContent = displayName;          // ← اسم ظاهر
  placeholder.selected = true;
  selectModel.appendChild(placeholder);

  // بعدين إذا فيه نتائج من السيرفر، ضيفهم تحت
  modelOptions.forEach(opt => {
    const o = document.createElement("option");
    o.value = opt.id;       // ← model_id فعلي
    o.textContent = opt.text;     // ← اسم الموديل للمستخدم
    o.dataset.name = opt.text;    // ← لو احتجت تخزين الاسم كـ data attribute
    selectModel.appendChild(o);
  });

  if (spanModel) spanModel.replaceWith(selectModel);
} 
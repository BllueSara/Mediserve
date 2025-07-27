// دوال واجهة المستخدم والصور لتقارير التفاصيل

// استيراد المتغيرات المطلوبة - تعريف متغيرات عامة لإدارة اللغة والترجمات
let languageManager, translations;

// تخزين مؤقت لاستدعاءات API - إنشاء خريطة لتخزين البيانات مؤقتاً
const apiCache = new Map();
// تحديد مدة التخزين المؤقت - 5 دقائق بالمللي ثانية
const CACHE_DURATION = 5 * 60 * 1000; // 5 دقائق

// دالة لتعيين المتغيرات - تعيين مدير اللغة والترجمات
export function setGlobalVariables(langManager, trans) {
  languageManager = langManager; // تعيين مدير اللغة
  translations = trans; // تعيين الترجمات
}

// دالة للتحقق من التخزين المؤقت - البحث عن البيانات المخزنة
function getCachedData(key) {
  const cached = apiCache.get(key); // الحصول على البيانات المخزنة
  // التحقق من وجود البيانات وأنها لم تنتهي صلاحيتها
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data; // إرجاع البيانات إذا كانت صالحة
  }
  return null; // إرجاع null إذا لم تكن البيانات موجودة أو منتهية الصلاحية
}

// دالة لحفظ البيانات في التخزين المؤقت - حفظ البيانات مع الطابع الزمني
function setCachedData(key, data) {
  apiCache.set(key, {
    data, // البيانات المراد حفظها
    timestamp: Date.now() // الطابع الزمني الحالي
  });
}

// دالة تحويل الصورة إلى Base64 - تحويل عنصر الصورة إلى نص Base64
export function getImageBase64(imgElement) {
  const canvas = document.createElement("canvas"); // إنشاء عنصر canvas
  canvas.width = imgElement.naturalWidth; // تعيين عرض canvas لعرض الصورة الطبيعي
  canvas.height = imgElement.naturalHeight; // تعيين ارتفاع canvas لارتفاع الصورة الطبيعي
  const ctx = canvas.getContext("2d"); // الحصول على سياق الرسم ثنائي الأبعاد
  ctx.drawImage(imgElement, 0, 0); // رسم الصورة على canvas
  return canvas.toDataURL("image/png"); // تحويل canvas إلى Base64 بصيغة PNG
}

// دالة انتظار تحميل الصور - انتظار اكتمال تحميل جميع الصور
export function waitForImagesToLoad(images) {
  return Promise.all(
    images.map(img => {
      return new Promise(resolve => {
        if (img.complete) resolve(); // إذا كانت الصورة محملة بالفعل
        else img.onload = () => resolve(); // انتظار تحميل الصورة
      });
    })
  );
}

// دالة إنشاء عنصر select معقدة - إنشاء قائمة اختيار متقدمة
export function createSelectElement(options, currentId, currentRawText, fieldId) {
  console.log("🔍 createSelectElement called:", {
    fieldId: fieldId, // معرف الحقل
    currentId: currentId, // المعرف الحالي
    currentRawText: currentRawText, // النص الخام الحالي
    optionsCount: options.length // عدد الخيارات
  });
  
  const select = document.createElement("select"); // إنشاء عنصر select
  select.style.minWidth = "140px"; // تعيين الحد الأدنى للعرض
  select.style.padding  = "4px"; // تعيين التباعد الداخلي
  select.style.display  = "inline-block"; // تعيين نوع العرض

  // دالة تنظيف الصيغة [en]/[ar] وتقسيم الـ pipe - تنظيف النصوص من الرموز الخاصة
  const clean = str => (str||"")
    .replace(/\[en\]$/i, "") // إزالة [en] من نهاية النص
    .replace(/\[ar\]$/i, "") // إزالة [ar] من نهاية النص
    .trim() // إزالة المسافات الزائدة
    .split("|")[0]; // أخذ الجزء الأول قبل |

  // 1) حدد currentText المعروض - تحديد النص المعروض حالياً
  let currentText;
  if (fieldId === "department" || fieldId === "assigned-to") {
    const parts = (currentRawText||"").split("|").map(p=>p.trim()); // تقسيم النص إلى أجزاء
    // 🔧 إصلاح: استخدم اللغة الحالية بدلاً من الإنجليزية دائماً
    currentText = languageManager.currentLang === "ar" ? (parts[1]||parts[0]) : parts[0]; // اختيار الجزء المناسب حسب اللغة
  } else {
    currentText = clean(currentRawText); // تنظيف النص للحقول الأخرى
  }

  // 2) إذا ما عندنا currentId، جرّب تطابق currentText مع options - البحث عن المعرف الفعال
  let effectiveId = currentId; // المعرف الفعال
  if (!effectiveId) {
    const match = options.find(opt => {
      // 🔧 إصلاح: تطابق أكثر دقة للمهندسين
      if (fieldId === "assigned-to") {
        const optFullName = opt.fullName || opt.technician_name || opt.name || ""; // الاسم الكامل للخيار
        const optParts = optFullName.split("|"); // تقسيم الاسم إلى أجزاء
        const optEn = optParts[0]?.trim() || ""; // الجزء الإنجليزي
        const optAr = optParts[1]?.trim() || ""; // الجزء العربي
        
        // تطابق مع النص الحالي
        return optEn === currentText || optAr === currentText || optFullName === currentText;
      } else {
        return clean(opt.fullName||opt.name||"") === currentText; // تطابق للخيارات الأخرى
      }
    });
    if (match) effectiveId = String(match.id); // تعيين المعرف إذا تم العثور على تطابق
  }

  console.log("🔍 createSelectElement processing:", {
    currentText: currentText, // النص الحالي
    effectiveId: effectiveId, // المعرف الفعال
    fieldId: fieldId // معرف الحقل
  });

  // 3) بناء خيار الـ placeholder بالقيمة الصحيحة - إنشاء الخيار الحالي
  if (currentText) {
    const optCurr = document.createElement("option"); // إنشاء خيار جديد
    // 🔧 إصلاح: تأكد من أن value يحتوي على ID صحيح
    optCurr.value = effectiveId || ""; // تعيين قيمة الخيار
    optCurr.textContent = currentText; // تعيين نص الخيار
    optCurr.selected = true; // تحديد الخيار كـ selected
    
    // 🔧 إصلاح: احفظ الاسم الكامل في dataset.fullname
    if (fieldId === "assigned-to") {
      // للمهندسين، ابحث عن الاسم الكامل في قائمة الخيارات
      let fullNameToUse = currentRawText || currentText; // الاسم الكامل للاستخدام
      
      // 🔧 ابحث عن الخيار المطابق في options للحصول على الاسم الكامل
      const matchingOption = options.find(opt => {
        const optFullName = opt.fullName || opt.technician_name || opt.name || ""; // الاسم الكامل للخيار
        const optParts = optFullName.split("|"); // تقسيم الاسم
        const optEn = optParts[0]?.trim() || ""; // الجزء الإنجليزي
        const optAr = optParts[1]?.trim() || ""; // الجزء العربي
        
        // تطابق مع النص الحالي أو الاسم الكامل
        return optEn === currentText || optAr === currentText || optFullName === currentText || optFullName === currentRawText;
      });
      
      if (matchingOption && matchingOption.fullName && matchingOption.fullName.includes("|")) {
        fullNameToUse = matchingOption.fullName; // استخدام الاسم الكامل المطابق
        console.log("🔍 Found matching option for current engineer:", {
          currentText: currentText, // النص الحالي
          matchingFullName: fullNameToUse // الاسم الكامل المطابق
        });
      }
      
      optCurr.dataset.fullname = fullNameToUse; // حفظ الاسم الكامل في dataset
      
      // 🔧 إضافة logging مفصل للمهندسين
      console.log("🔍 Engineer option details:", {
        fieldId: fieldId, // معرف الحقل
        currentText: currentText, // النص الحالي
        currentRawText: currentRawText, // النص الخام الحالي
        fullNameToUse: fullNameToUse, // الاسم الكامل المستخدم
        effectiveId: effectiveId, // المعرف الفعال
        matchingOption: matchingOption ? {
          id: matchingOption.id, // معرف الخيار المطابق
          fullName: matchingOption.fullName // الاسم الكامل للخيار المطابق
        } : null
      });
    } else {
      optCurr.dataset.fullname = currentRawText || currentText; // حفظ الاسم الكامل للحقول الأخرى
    }

    select.appendChild(optCurr); // إضافة الخيار إلى select

    // خزّن الـ effectiveId والمؤشرات كلها - حفظ البيانات في dataset
    select.dataset.oldId = effectiveId || ""; // المعرف القديم
    select.dataset.currentId = effectiveId || ""; // المعرف الحالي
    select.dataset.oldText = currentRawText || ""; // النص القديم
    select.dataset.currentName = currentText; // الاسم الحالي
    
    console.log("🔍 Created current option:", {
      value: optCurr.value, // قيمة الخيار
      textContent: optCurr.textContent, // نص الخيار
      fullname: optCurr.dataset.fullname // الاسم الكامل
    });
  }

  // 4) بناء بقية الخيارات - إنشاء باقي الخيارات
  options.forEach(opt => {
    let raw; // النص الخام للخيار
    switch (fieldId) {
      case "department":
      case "assigned-to":
        const parts = (opt.fullName||"").split("|"); // تقسيم الاسم الكامل
        // 🔧 إصلاح: استخدم اللغة الحالية بدلاً من الإنجليزية دائماً
        raw = (languageManager.currentLang === "ar"
               ? (parts[1]||parts[0]) // استخدام الجزء العربي
               : parts[0]).trim(); // استخدام الجزء الإنجليزي
        break;
      case "generation": raw = clean(opt.generation_number); break; // تنظيف رقم الجيل
      case "cpu":        raw = clean(opt.cpu_name);       break; // تنظيف اسم المعالج
      case "ram":        raw = clean(opt.ram_type);       break; // تنظيف نوع الذاكرة
      case "os":         raw = clean(opt.os_name);        break; // تنظيف اسم نظام التشغيل
      case "hard_drive": raw = clean(opt.drive_type);     break; // تنظيف نوع القرص الصلب
      case "ram_size":   raw = clean(opt.ram_size);       break; // تنظيف حجم الذاكرة
      case "printer_type": raw = clean(opt.printer_type); break; // تنظيف نوع الطابعة
      case "scanner_type": raw = clean(opt.scanner_type); break; // تنظيف نوع الماسح الضوئي
      case "ink_type":     raw = clean(opt.ink_type);     break; // تنظيف نوع الحبر
      default:
        raw = clean(opt.fullName||opt.name||""); // تنظيف الاسم الكامل أو الاسم
    }

    // تجاهل التكرار - تجاهل الخيار إذا كان مطابقاً للخيار الحالي
    if (String(opt.id) === select.dataset.currentId || raw === currentText) return;

    const o = document.createElement("option"); // إنشاء خيار جديد
    // 🔧 إصلاح: تأكد من أن value يحتوي على ID صحيح
    o.value = String(opt.id); // تعيين قيمة الخيار
    o.textContent = raw; // تعيين نص الخيار
    // 🔧 إصلاح: احفظ الاسم الكامل ثنائي اللغة للمهندسين والأقسام
    if (fieldId === "assigned-to" || fieldId === "department") {
      o.dataset.fullname = opt.fullName || opt.name || ""; // حفظ الاسم الكامل للمهندسين والأقسام
    } else {
      o.dataset.fullname = opt.fullName||opt.name||raw; // حفظ الاسم الكامل للخيارات الأخرى
    }
    select.appendChild(o); // إضافة الخيار إلى select
  });

  // 🔧 إضافة event listener لتحديث dataset عند تغيير الاختيار
  select.addEventListener("change", function() {
    const selectedOption = this.options[this.selectedIndex]; // الحصول على الخيار المحدد
    if (selectedOption) {
      this.dataset.currentId = selectedOption.value; // تحديث المعرف الحالي
      this.dataset.currentName = selectedOption.textContent; // تحديث الاسم الحالي
      console.log("🔍 Select changed:", {
        fieldId: fieldId, // معرف الحقل
        newValue: selectedOption.value, // القيمة الجديدة
        newText: selectedOption.textContent // النص الجديد
      });
    }
  });

  console.log("🔍 Final select created:", {
    fieldId: fieldId, // معرف الحقل
    optionsCount: select.options.length, // عدد الخيارات
    selectedIndex: select.selectedIndex, // فهرس الخيار المحدد
    selectedValue: select.options[select.selectedIndex]?.value // قيمة الخيار المحدد
  });

  return select; // إرجاع عنصر select
}

// دالة جلب الخيارات من API - جلب البيانات من الخادم
export async function fetchOptions(apiUrl) {
  console.log("🔍 Fetching options from:", apiUrl); // طباعة رابط API
  
  // التحقق من التخزين المؤقت أولاً - البحث عن البيانات المخزنة
  const cachedData = getCachedData(apiUrl); // الحصول على البيانات المخزنة
  if (cachedData) {
    console.log("🔍 Using cached data for:", apiUrl); // استخدام البيانات المخزنة
    return cachedData; // إرجاع البيانات المخزنة
  }
  
  const res = await fetch(apiUrl); // جلب البيانات من API
  if (!res.ok) throw new Error("فشل جلب البيانات من " + apiUrl); // رمي خطأ إذا فشل الطلب
  const rawData = await res.json(); // تحويل الاستجابة إلى JSON
  
  console.log("🔍 Raw data from API:", rawData); // طباعة البيانات الخام

  const processedData = rawData.map(opt => {
    // 🔧 إصلاح: معالجة خاصة للمهندسين من API /Technical
    if (apiUrl.includes('/Technical')) {
      return {
        ...opt, // نسخ جميع خصائص الخيار
        id: opt.id, // معرف الخيار
        fullName: opt.name || "" // Engineers table has 'name' column with bilingual format
      };
    }
    
    return {
      ...opt, // نسخ جميع خصائص الخيار
      fullName:
        opt.fullName ||
        opt.name ||
        opt.model_name ||
        opt.serial_number ||
        opt.printer_type ||
        opt.scanner_type ||
        opt.ink_type ||
        "" // الاسم الكامل أو قيم بديلة
    };
  });
  
  console.log("🔍 Processed data:", processedData); // طباعة البيانات المعالجة
  
  // حفظ البيانات في التخزين المؤقت - حفظ البيانات للاستخدام المستقبلي
  setCachedData(apiUrl, processedData);
  
  return processedData; // إرجاع البيانات المعالجة
}

// دالة تعبئة قائمة الموديلات - ملء قائمة النماذج
export async function populateModelDropdown(deviceTypeName, currentLang = "en") {
  const spanModel = document.getElementById("model"); // الحصول على عنصر النموذج
  if (!spanModel) return; // الخروج إذا لم يتم العثور على العنصر

  const currentModelId = spanModel.dataset.id || ""; // معرف النموذج الحالي
  const currentModelRawText = spanModel.dataset.rawtext || spanModel.textContent.trim(); // النص الخام للنموذج الحالي

  // نفصل rawText للإنجليزي والعربي - تقسيم النص إلى أجزاء
  const clean = currentModelRawText
    .replace(/\[en\]$/i, "") // إزالة [en] من النهاية
    .replace(/\[ar\]$/i, "") // إزالة [ar] من النهاية
    .trim(); // إزالة المسافات الزائدة
  const [enName, arName] = clean.split("|").map(p => p.trim()); // تقسيم النص إلى اسم إنجليزي وعربي
  const displayName = currentLang === "ar" ? (arName || enName) : enName; // اختيار الاسم المعروض حسب اللغة

  // حدد المفتاح الإنكليزي للـ endpoint (نفس ما عندك) - تحديد مفتاح نوع الجهاز
  let key = deviceTypeName.trim().toLowerCase(); // تحويل اسم نوع الجهاز إلى مفتاح
  if (/[^a-z0-9]/i.test(deviceTypeName)) {
    for (const engKey of Object.keys(translations.deviceType)) {
      if (translations.deviceType[engKey].ar === deviceTypeName) {
        key = engKey.toLowerCase(); // استخدام المفتاح الإنجليزي إذا كان النص عربي
        break;
      }
    }
  }
  let endpoint; // رابط API
  if (["pc", "laptop", "desktop"].includes(key)) endpoint = "http://localhost:4000/PC_Model"; // رابط نماذج الحاسوب
  else if (key === "printer") endpoint = "http://localhost:4000/Printer_Model"; // رابط نماذج الطابعات
  else if (key === "scanner") endpoint = "http://localhost:4000/Scanner_Model"; // رابط نماذج الماسحات الضوئية
  else endpoint = `http://localhost:4000/models-by-type/${encodeURIComponent(key)}`; // رابط عام للنماذج

  console.log("▶ Fetching endpoint:", endpoint); // طباعة رابط API

  // جلب البيانات - جلب البيانات من الخادم
  let raw = []; // مصفوفة البيانات الخام
  try {
    const res = await fetch(endpoint); // جلب البيانات
    if (!res.ok) throw new Error(res.statusText); // رمي خطأ إذا فشل الطلب
    raw = await res.json(); // تحويل الاستجابة إلى JSON
  } catch {
    raw = []; // تعيين مصفوفة فارغة في حالة الخطأ
  }

  // فكّ البيانات إلى modelOptions - تحويل البيانات إلى خيارات النماذج
  let modelOptions = []; // مصفوفة خيارات النماذج
  if (raw.length > 0) {
    const sample = raw[0]; // عينة من البيانات
    if (sample.model_id != null && sample.model_name != null) {
      modelOptions = raw.map(i => ({ id: String(i.model_id), text: i.model_name })); // استخدام model_id و model_name
    } else if (sample.id != null && sample.name != null) {
      modelOptions = raw.map(i => ({ id: String(i.id), text: i.name })); // استخدام id و name
    } else {
      modelOptions = raw.map(i => ({
        id: String(i.id || i.model_name || JSON.stringify(i)), // معرف النموذج
        text: String(i.model_name || i.name || JSON.stringify(i)) // اسم النموذج
      }));
    }
  }
  console.log("▶ Parsed modelOptions:", modelOptions); // طباعة خيارات النماذج

  // ابني الـ <select> - إنشاء عنصر select
  const selectModel = document.createElement("select"); // إنشاء عنصر select
  selectModel.id = "model-select"; // تعيين معرف العنصر
  selectModel.style.minWidth = "140px"; // تعيين الحد الأدنى للعرض
  selectModel.style.padding = "4px"; // تعيين التباعد الداخلي

  // 👇 هذا الخيار الأول دائماً هو الموديل الحالي - إنشاء الخيار الحالي
  const placeholder = document.createElement("option"); // إنشاء خيار جديد
  placeholder.value = currentModelId;       // ← هنا ID - تعيين قيمة الخيار
  placeholder.textContent = displayName;          // ← اسم ظاهر - تعيين نص الخيار
  placeholder.selected = true; // تحديد الخيار كـ selected
  selectModel.appendChild(placeholder); // إضافة الخيار إلى select

  // بعدين إذا فيه نتائج من السيرفر، ضيفهم تحت - إضافة باقي الخيارات
  modelOptions.forEach(opt => {
    const o = document.createElement("option"); // إنشاء خيار جديد
    o.value = opt.id;       // ← model_id فعلي - تعيين قيمة الخيار
    o.textContent = opt.text;     // ← اسم الموديل للمستخدم - تعيين نص الخيار
    o.dataset.name = opt.text;    // ← لو احتجت تخزين الاسم كـ data attribute - حفظ الاسم في dataset
    selectModel.appendChild(o); // إضافة الخيار إلى select
  });

  if (spanModel) spanModel.replaceWith(selectModel); // استبدال عنصر span بعنصر select
} 
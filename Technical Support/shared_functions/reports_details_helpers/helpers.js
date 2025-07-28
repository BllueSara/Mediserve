// ملف تجميعي لجميع الدوال المساعدة لتقارير التفاصيل

// استيراد دوال الترجمة واللغة - تصدير جميع دوال الترجمة من ملف translation.js
export {
  translateWithGoogle, // دالة الترجمة باستخدام Google
  reverseTranslate, // دالة الترجمة العكسية
  processPipeText, // دالة معالجة النصوص مع الرموز الخاصة
  prepareArabic, // دالة تحضير النصوص العربية
  normalizeText, // دالة تطبيع النصوص
  getTitleKey, // دالة الحصول على مفتاح العنوان
  findOriginalKeyByAnyLang, // دالة البحث عن المفتاح الأصلي بأي لغة
  findLabelKeyByAnyLang, // دالة البحث عن مفتاح التسمية بأي لغة
  translateBatch // دالة الترجمة المجمعة
} from './translation.js';

// استيراد دوال معالجة البيانات - تصدير دوال معالجة وتنظيف البيانات
export {
  normalizeKey, // دالة تطبيع المفاتيح
  fixEncoding, // دالة إصلاح الترميز
  cleanValue, // دالة تنظيف القيم
  cleanTag, // دالة تنظيف العلامات
  cleanReport, // دالة تنظيف التقرير
  getAssignedTo, // دالة الحصول على المسؤول
  getAssignedToId, // دالة الحصول على معرف المسؤول
  getLookupField // دالة الحصول على حقل البحث
} from './data_processing.js';

// استيراد دوال واجهة المستخدم والصور - تصدير دوال واجهة المستخدم
export {
  getImageBase64, // دالة الحصول على الصورة بصيغة Base64
  waitForImagesToLoad, // دالة انتظار تحميل الصور
  createSelectElement, // دالة إنشاء عنصر اختيار
  fetchOptions, // دالة جلب الخيارات
  populateModelDropdown // دالة ملء قائمة النماذج
} from './ui_helpers.js';

// استيراد دوال الصلاحيات - تصدير دوال التحقق من الصلاحيات
export {
  checkUserPermissions // دالة التحقق من صلاحيات المستخدم
} from './permissions.js';

// استيراد دوال الخطوط - تصدير دوال إدارة الخطوط
export {
  goBack, // دالة العودة للصفحة السابقة
  fetchFont, // دالة جلب الخط
  loadFonts // دالة تحميل الخطوط
} from './font_helpers.js';

// استيراد دوال توليد PDF - تصدير جميع دوال إنشاء ملفات PDF
export {
  generatePdf, // دالة توليد ملف PDF
  setupPdfFonts, // دالة إعداد خطوط PDF
  addLogosToPdf, // دالة إضافة الشعارات إلى PDF
  addReportTitle, // دالة إضافة عنوان التقرير
  addBasicFields, // دالة إضافة الحقول الأساسية
  addAttachments, // دالة إضافة المرفقات
  processDescriptionForPdf, // دالة معالجة الوصف لـ PDF
  addDescription, // دالة إضافة الوصف
  addTechnicalNotes, // دالة إضافة الملاحظات التقنية
  addDeviceSpecs, // دالة إضافة مواصفات الجهاز
  addSignature // دالة إضافة التوقيع
} from './pdf_helpers.js';

// استيراد دوال عرض البيانات - تصدير دوال عرض البيانات في الواجهة
export {
  setBasicReportData, // دالة تعيين البيانات الأساسية للتقرير
  setDescription, // دالة تعيين الوصف
  setTechnicalNotes, // دالة تعيين الملاحظات التقنية
  setAttachments // دالة تعيين المرفقات
} from './display_helpers.js';

// استيراد دوال مواصفات الأجهزة - تصدير دوال إدارة مواصفات الأجهزة
export {
  createNewReportSpecs, // دالة إنشاء مواصفات تقرير جديد
  createRegularReportSpecs, // دالة إنشاء مواصفات تقرير دوري
  createLegacySpecs // دالة إنشاء مواصفات قديمة
} from './specs_helpers.js';

// استيراد دوال معالجة التقارير - تصدير دوال معالجة وإعداد التقارير
export {
  processNewReport, // دالة معالجة تقرير جديد
  setupReportData, // دالة إعداد بيانات التقرير
  prepareReport, // دالة تحضير التقرير
  extractTicketNumber, // دالة استخراج رقم التذكرة
  createReportTitle, // دالة إنشاء عنوان التقرير
  processInitialData // دالة معالجة البيانات الأولية
} from './report_processor.js';

// استيراد دوال تحسينات الأداء - تصدير دوال تحسين الأداء
export {
  PerformanceCache, // فئة التخزين المؤقت للأداء
  batchApiCalls, // دالة استدعاءات API المجمعة
  createElementsBatch, // دالة إنشاء عناصر DOM مجمعة
  processTextBatch, // دالة معالجة النصوص المجمعة
  translateBatchOptimized, // دالة الترجمة المجمعة المحسنة
  preloadImages, // دالة تحميل الصور مسبقاً
  debounce, // دالة تأخير تنفيذ الدوال
  optimizedTextSearch, // دالة البحث المحسن في النصوص
  cleanupMemory, // دالة تنظيف الذاكرة
  isDevelopment // دالة التحقق من بيئة التطوير
} from './performance_optimizer.js';

// دالة مساعدة لتعيين حالة التقرير مع الترجمة والألوان
export function setReportStatus(status, lang = "en") {
  const statusElement = document.getElementById("report-status");
  if (!statusElement) return;
  
  const rawStatus = status || "Open";
  let translatedStatus;
  
  // ترجمة الحالة
  if (lang === "ar") {
    switch (rawStatus.toLowerCase()) {
      case "open":
        translatedStatus = "مفتوح";
        break;
      case "in progress":
        translatedStatus = "قيد التنفيذ";
        break;
      case "closed":
        translatedStatus = "مغلق";
        break;
      case "pending":
        translatedStatus = "في الانتظار";
        break;
      default:
        translatedStatus = rawStatus;
    }
  } else {
    translatedStatus = rawStatus;
  }
  
  // تعيين النص والبيانات
  statusElement.textContent = translatedStatus;
  statusElement.dataset.key = rawStatus;
  
  // تحديث الـ CSS classes
  statusElement.className = "status";
  if (rawStatus.toLowerCase() === "closed") {
    statusElement.classList.add("status-closed");
  } else if (rawStatus.toLowerCase() === "in progress") {
    statusElement.classList.add("status-in-progress");
  } else if (rawStatus.toLowerCase() === "open") {
    statusElement.classList.add("status-open");
  } else if (rawStatus.toLowerCase() === "pending") {
    statusElement.classList.add("status-pending");
  }
} 
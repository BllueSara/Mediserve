// ملف تجميعي لجميع الدوال المساعدة لتقارير التفاصيل

// استيراد دوال الترجمة واللغة
export {
  translateWithGoogle,
  reverseTranslate,
  processPipeText,
  prepareArabic,
  normalizeText,
  getTitleKey,
  findOriginalKeyByAnyLang,
  findLabelKeyByAnyLang,
  translateBatch
} from './translation.js';

// استيراد دوال معالجة البيانات
export {
  normalizeKey,
  fixEncoding,
  cleanValue,
  cleanTag,
  cleanReport,
  getAssignedTo,
  getAssignedToId,
  getLookupField
} from './data_processing.js';

// استيراد دوال واجهة المستخدم والصور
export {
  getImageBase64,
  waitForImagesToLoad,
  createSelectElement,
  fetchOptions,
  populateModelDropdown
} from './ui_helpers.js';

// استيراد دوال الصلاحيات
export {
  checkUserPermissions
} from './permissions.js';

// استيراد دوال الخطوط
export {
  goBack,
  fetchFont,
  loadFonts
} from './font_helpers.js';

// استيراد دوال توليد PDF
export {
  generatePdf,
  setupPdfFonts,
  addLogosToPdf,
  addReportTitle,
  addBasicFields,
  addAttachments,
  processDescriptionForPdf,
  addDescription,
  addTechnicalNotes,
  addDeviceSpecs,
  addSignature
} from './pdf_helpers.js';

// استيراد دوال عرض البيانات
export {
  setBasicReportData,
  setDescription,
  setTechnicalNotes,
  setAttachments
} from './display_helpers.js';

// استيراد دوال مواصفات الأجهزة
export {
  createNewReportSpecs,
  createRegularReportSpecs,
  createLegacySpecs
} from './specs_helpers.js';

// استيراد دوال معالجة التقارير
export {
  processNewReport,
  setupReportData,
  prepareReport,
  extractTicketNumber,
  createReportTitle,
  processInitialData
} from './report_processor.js';

// استيراد دوال تحسينات الأداء
export {
  PerformanceCache,
  batchApiCalls,
  createElementsBatch,
  processTextBatch,
  translateBatchOptimized,
  preloadImages,
  debounce,
  optimizedTextSearch,
  cleanupMemory,
  isDevelopment
} from './performance_optimizer.js'; 
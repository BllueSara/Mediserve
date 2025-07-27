// تحسينات الأداء لتقارير التفاصيل - نسخة محسنة لبيئة المستشفى

// تخزين مؤقت عام للتطبيق - إنشاء خريطة جديدة لتخزين البيانات
const appCache = new Map();
// تحديد مدة التخزين المؤقت - 10 دقائق في التطوير، 5 دقائق في الإنتاج
const CACHE_DURATION = isDevelopment() ? 10 * 60 * 1000 : 5 * 60 * 1000; // 5 دقائق في الإنتاج

/**
 * دالة للتحقق من بيئة التطوير
 */
export function isDevelopment() {
  // إرجاع true إذا كان اسم المضيف localhost أو 127.0.0.1 أو يحتوي على dev أو test
  return window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1' ||
         window.location.hostname.includes('dev') ||
         window.location.hostname.includes('test');
}

/**
 * دالة للتحقق من بيئة المستشفى
 */
export function isHospitalEnvironment() {
  // التحقق من IP addresses الخاصة بالمستشفى - قائمة بعناوين IP المستشفى
  const hospitalIPs = [
    '10.99.28.23',  // IP المستشفى
    '10.99.28.24',  // IP احتياطي (إذا كان موجود)
    '192.168.1.100' // IP محلي للمستشفى (إذا كان موجود)
  ];
  
  // الحصول على اسم المضيف الحالي
  const currentHost = window.location.hostname;
  // الحصول على المنفذ الحالي
  const currentPort = window.location.port;
  
  // التحقق من IP addresses - إذا كان المضيف الحالي في قائمة IP المستشفى
  if (hospitalIPs.includes(currentHost)) {
    return true; // إرجاع true إذا كان في بيئة المستشفى
  }
  
  // التحقق من النطاقات - إذا كان اسم المضيف يحتوي على كلمات المستشفى
  if (currentHost.includes('hospital') ||
      currentHost.includes('mediserve') ||
      currentHost.includes('medical')) {
    return true; // إرجاع true إذا كان في بيئة المستشفى
  }
  
  // التحقق من المنفذ 4000 (إذا كان المستشفى يستخدم منفذ محدد)
  if (currentPort === '4000' && !isDevelopment()) {
    return true; // إرجاع true إذا كان المنفذ 4000 وليس بيئة تطوير
  }
  
  return false; // إرجاع false إذا لم يكن في بيئة المستشفى
}

/**
 * دالة التخزين المؤقت العامة - محسنة للأمان
 */
export class PerformanceCache {
  // دالة للحصول على البيانات من التخزين المؤقت
  static get(key) {
    try {
      // الحصول على البيانات المخزنة مؤقتاً
      const cached = appCache.get(key);
      // التحقق من أن البيانات موجودة ولم تنتهي صلاحيتها
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data; // إرجاع البيانات إذا كانت صالحة
      }
      return null; // إرجاع null إذا لم تكن البيانات موجودة أو منتهية الصلاحية
    } catch (error) {
      // طباعة تحذير في بيئة التطوير فقط
      if (isDevelopment()) {
        console.warn('Cache get error:', error);
      }
      return null; // إرجاع null في حالة الخطأ
    }
  }

  // دالة لحفظ البيانات في التخزين المؤقت
  static set(key, data) {
    try {
      // التحقق من حجم البيانات في بيئة المستشفى - تجنب تخزين بيانات كبيرة جداً
      if (isHospitalEnvironment() && JSON.stringify(data).length > 1000000) {
        console.warn('Large data detected, skipping cache'); // تحذير من البيانات الكبيرة
        return; // الخروج من الدالة بدون حفظ
      }
      
      // حفظ البيانات مع الطابع الزمني
      appCache.set(key, {
        data, // البيانات المراد حفظها
        timestamp: Date.now() // الطابع الزمني الحالي
      });
    } catch (error) {
      // طباعة تحذير في بيئة التطوير فقط
      if (isDevelopment()) {
        console.warn('Cache set error:', error);
      }
    }
  }

  // دالة لمسح جميع البيانات من التخزين المؤقت
  static clear() {
    try {
      appCache.clear(); // مسح جميع البيانات من الخريطة
    } catch (error) {
      // طباعة تحذير في بيئة التطوير فقط
      if (isDevelopment()) {
        console.warn('Cache clear error:', error);
      }
    }
  }

  // دالة لمسح البيانات منتهية الصلاحية فقط
  static clearExpired() {
    try {
      const now = Date.now(); // الحصول على الوقت الحالي
      // التكرار على جميع البيانات المخزنة مؤقتاً
      for (const [key, value] of appCache.entries()) {
        // التحقق من انتهاء صلاحية البيانات
        if (now - value.timestamp > CACHE_DURATION) {
          appCache.delete(key); // حذف البيانات منتهية الصلاحية
        }
      }
    } catch (error) {
      // طباعة تحذير في بيئة التطوير فقط
      if (isDevelopment()) {
        console.warn('Cache cleanup error:', error);
      }
    }
  }
}

/**
 * دالة لتحسين استدعاءات API المتعددة - محسنة للأمان
 */
export async function batchApiCalls(apiCalls) {
  // تحويل استدعاءات API إلى وعود متوازية
  const promises = apiCalls.map(async ({ url, cacheKey, processor }) => {
    try {
      // التحقق من التخزين المؤقت - البحث عن البيانات المخزنة مسبقاً
      const cached = PerformanceCache.get(cacheKey || url);
      if (cached) {
        return cached; // إرجاع البيانات المخزنة إذا كانت موجودة
      }

      // استدعاء API مع timeout في بيئة المستشفى - إنشاء وحدة تحكم للإلغاء
      const controller = new AbortController();
      // تعيين timeout - 30 ثانية في المستشفى، 60 ثانية في بيئات أخرى
      const timeoutId = setTimeout(() => controller.abort(), isHospitalEnvironment() ? 30000 : 60000);

      // إجراء طلب fetch إلى API
      const response = await fetch(url, {
        signal: controller.signal, // إشارة الإلغاء
        headers: {
          'Content-Type': 'application/json', // نوع المحتوى
          // إضافة headers أمان إضافية في بيئة المستشفى
          ...(isHospitalEnvironment() && {
            'X-Requested-With': 'XMLHttpRequest' // header للأمان
          })
        }
      });
      
      clearTimeout(timeoutId); // إلغاء timeout بعد استلام الاستجابة
      
      // التحقق من نجاح الاستجابة
      if (!response.ok) {
        throw new Error(`API call failed: ${url} - Status: ${response.status}`);
      }
      
      let data = await response.json(); // تحويل الاستجابة إلى JSON
      
      // معالجة البيانات إذا تم توفير معالج
      if (processor) {
        data = processor(data); // تطبيق المعالج على البيانات
      }
      
      // حفظ في التخزين المؤقت
      PerformanceCache.set(cacheKey || url, data);
      
      return data; // إرجاع البيانات المعالجة
    } catch (error) {
      // طباعة الخطأ في بيئة التطوير فقط
      if (isDevelopment()) {
        console.error('API call error:', error);
      }
      throw error; // إعادة رمي الخطأ
    }
  });

  return Promise.all(promises); // انتظار اكتمال جميع الوعود
}

/**
 * دالة لتحسين إنشاء عناصر DOM
 */
export function createElementsBatch(elements) {
  // إنشاء fragment لتحسين الأداء
  const fragment = document.createDocumentFragment();
  
  // التكرار على تكوينات العناصر
  elements.forEach(elementConfig => {
    // إنشاء عنصر DOM جديد
    const element = document.createElement(elementConfig.tag || 'div');
    
    // تعيين الخصائص - إضافة class name إذا كان موجوداً
    if (elementConfig.className) {
      element.className = elementConfig.className;
    }
    
    // تعيين ID إذا كان موجوداً
    if (elementConfig.id) {
      element.id = elementConfig.id;
    }
    
    // تعيين النص إذا كان موجوداً
    if (elementConfig.textContent) {
      element.textContent = elementConfig.textContent;
    }
    
    // تعيين HTML إذا كان موجوداً
    if (elementConfig.innerHTML) {
      element.innerHTML = elementConfig.innerHTML;
    }
    
    // تعيين السمات إذا كانت موجودة
    if (elementConfig.attributes) {
      Object.entries(elementConfig.attributes).forEach(([key, value]) => {
        element.setAttribute(key, value); // تعيين كل سمة
      });
    }
    
    // تعيين بيانات dataset إذا كانت موجودة
    if (elementConfig.dataset) {
      Object.entries(elementConfig.dataset).forEach(([key, value]) => {
        element.dataset[key] = value; // تعيين كل قيمة dataset
      });
    }
    
    // إضافة العناصر الفرعية إذا كانت موجودة
    if (elementConfig.children) {
      elementConfig.children.forEach(child => {
        // إنشاء العنصر الفرعي وإضافته
        element.appendChild(createElementsBatch([child])[0]);
      });
    }
    
    fragment.appendChild(element); // إضافة العنصر إلى fragment
  });
  
  return fragment; // إرجاع fragment جاهز للإدراج
}

/**
 * دالة لتحسين معالجة النصوص
 */
export function processTextBatch(texts, processor) {
  // تطبيق المعالج على كل نص في المصفوفة
  return texts.map(text => processor(text));
}

/**
 * دالة لتحسين الترجمة المجمعة - محسنة للأمان
 */
export async function translateBatchOptimized(texts, targetLang, sourceLang = "en") {
  try {
    // تجميع النصوص الفريدة فقط - إزالة التكرارات والنصوص الفارغة
    const uniqueTexts = [...new Set(texts.filter(text => text && text.trim()))];
    
    // إرجاع مصفوفة فارغة إذا لم تكن هناك نصوص للترجمة
    if (uniqueTexts.length === 0) {
      return texts.map(() => "");
    }
    
    // التحقق من التخزين المؤقت للترجمات
    const cachedTranslations = new Map(); // خريطة للترجمات المخزنة
    const textsToTranslate = []; // مصفوفة للنصوص التي تحتاج ترجمة
    
    // فحص كل نص فريد للترجمة المخزنة
    uniqueTexts.forEach(text => {
      const cacheKey = `translate_${text}_${sourceLang}_${targetLang}`; // مفتاح التخزين المؤقت
      const cached = PerformanceCache.get(cacheKey); // البحث في التخزين المؤقت
      if (cached) {
        cachedTranslations.set(text, cached); // حفظ الترجمة المخزنة
      } else {
        textsToTranslate.push(text); // إضافة النص للترجمة
      }
    });
    
    // ترجمة النصوص الجديدة فقط
    if (textsToTranslate.length > 0) {
      const { translateBatch } = await import('./translation.js'); // استيراد دالة الترجمة
      const newTranslations = await translateBatch(textsToTranslate, targetLang, sourceLang); // ترجمة النصوص الجديدة
      
      // حفظ الترجمات الجديدة في التخزين المؤقت
      textsToTranslate.forEach((text, index) => {
        const cacheKey = `translate_${text}_${sourceLang}_${targetLang}`; // مفتاح التخزين المؤقت
        PerformanceCache.set(cacheKey, newTranslations[index]); // حفظ الترجمة الجديدة
        cachedTranslations.set(text, newTranslations[index]); // إضافة للخريطة المحلية
      });
    }
    
    // إرجاع الترجمات بالترتيب الأصلي
    return texts.map(text => {
      if (!text || !text.trim()) return ""; // إرجاع نص فارغ للنصوص الفارغة
      return cachedTranslations.get(text) || text; // إرجاع الترجمة أو النص الأصلي
    });
  } catch (error) {
    // طباعة الخطأ في بيئة التطوير فقط
    if (isDevelopment()) {
      console.error('Translation error:', error);
    }
    // إرجاع النصوص الأصلية في حالة الخطأ
    return texts;
  }
}

/**
 * دالة لتحسين تحميل الصور
 */
export function preloadImages(imageUrls) {
  // تحميل جميع الصور بشكل متوازي
  return Promise.all(
    imageUrls.map(url => {
      return new Promise((resolve, reject) => {
        const img = new Image(); // إنشاء عنصر صورة جديد
        img.onload = () => resolve(img); // حل الوعد عند تحميل الصورة بنجاح
        img.onerror = () => reject(new Error(`Failed to load image: ${url}`)); // رفض الوعد عند فشل التحميل
        img.src = url; // تعيين مصدر الصورة
      });
    })
  );
}

/**
 * دالة لتحسين معالجة الأحداث
 */
export function debounce(func, wait) {
  let timeout; // متغير لتخزين timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout); // إلغاء timeout السابق
      func(...args); // تنفيذ الدالة
    };
    clearTimeout(timeout); // إلغاء timeout الحالي
    timeout = setTimeout(later, wait); // تعيين timeout جديد
  };
}

/**
 * دالة لتحسين البحث في النصوص
 */
export function optimizedTextSearch(text, searchTerm) {
  // إرجاع false إذا كان النص أو مصطلح البحث فارغ
  if (!text || !searchTerm) return false;
  
  const normalizedText = text.toLowerCase().trim(); // تطبيع النص للبحث
  const normalizedSearch = searchTerm.toLowerCase().trim(); // تطبيع مصطلح البحث
  
  return normalizedText.includes(normalizedSearch); // التحقق من وجود مصطلح البحث في النص
}

/**
 * دالة لتنظيف الذاكرة - محسنة لبيئة المستشفى
 */ 
export function cleanupMemory() {
  try {
    // تنظيف التخزين المؤقت منتهي الصلاحية
    PerformanceCache.clearExpired();
    
    // تنظيف إضافي في بيئة المستشفى
    if (isHospitalEnvironment()) {
      // تنظيف الصور المحملة مسبقاً - البحث عن الصور المحملة
      const images = document.querySelectorAll('img[data-preloaded]');
      images.forEach(img => {
        if (img.complete) {
          img.removeAttribute('data-preloaded'); // إزالة السمة بعد اكتمال التحميل
        }
      });
    }
    
    // إجبار جمع القمامة (إذا كان متاحاً)
    if (window.gc) {
      window.gc(); // استدعاء garbage collector
    }
  } catch (error) {
    // طباعة تحذير في بيئة التطوير فقط
    if (isDevelopment()) {
      console.warn('Memory cleanup error:', error);
    }
  }
}

// تنظيف الذاكرة كل 5 دقائق في الإنتاج، كل 10 دقائق في التطوير - تعيين الفاصل الزمني
const cleanupInterval = isDevelopment() ? 10 * 60 * 1000 : 5 * 60 * 1000;
// بدء تنظيف الذاكرة الدوري
setInterval(cleanupMemory, cleanupInterval);

// إضافة event listener لتنظيف الذاكرة عند إغلاق الصفحة
window.addEventListener('beforeunload', () => {
  PerformanceCache.clear(); // مسح التخزين المؤقت عند إغلاق الصفحة
}); 
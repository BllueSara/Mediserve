// تحسينات الأداء لتقارير التفاصيل - نسخة محسنة لبيئة المستشفى

// تخزين مؤقت عام للتطبيق
const appCache = new Map();
const CACHE_DURATION = isDevelopment() ? 10 * 60 * 1000 : 5 * 60 * 1000; // 5 دقائق في الإنتاج

/**
 * دالة للتحقق من بيئة التطوير
 */
export function isDevelopment() {
  return window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1' ||
         window.location.hostname.includes('dev') ||
         window.location.hostname.includes('test');
}

/**
 * دالة للتحقق من بيئة المستشفى
 */
export function isHospitalEnvironment() {
  // التحقق من IP addresses الخاصة بالمستشفى
  const hospitalIPs = [
    '10.99.28.23',  // IP المستشفى
    '10.99.28.24',  // IP احتياطي (إذا كان موجود)
    '192.168.1.100' // IP محلي للمستشفى (إذا كان موجود)
  ];
  
  const currentHost = window.location.hostname;
  const currentPort = window.location.port;
  
  // التحقق من IP addresses
  if (hospitalIPs.includes(currentHost)) {
    return true;
  }
  
  // التحقق من النطاقات
  if (currentHost.includes('hospital') ||
      currentHost.includes('mediserve') ||
      currentHost.includes('medical')) {
    return true;
  }
  
  // التحقق من المنفذ 4000 (إذا كان المستشفى يستخدم منفذ محدد)
  if (currentPort === '4000' && !isDevelopment()) {
    return true;
  }
  
  return false;
}

/**
 * دالة التخزين المؤقت العامة - محسنة للأمان
 */
export class PerformanceCache {
  static get(key) {
    try {
      const cached = appCache.get(key);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
      }
      return null;
    } catch (error) {
      if (isDevelopment()) {
        console.warn('Cache get error:', error);
      }
      return null;
    }
  }

  static set(key, data) {
    try {
      // التحقق من حجم البيانات في بيئة المستشفى
      if (isHospitalEnvironment() && JSON.stringify(data).length > 1000000) {
        console.warn('Large data detected, skipping cache');
        return;
      }
      
      appCache.set(key, {
        data,
        timestamp: Date.now()
      });
    } catch (error) {
      if (isDevelopment()) {
        console.warn('Cache set error:', error);
      }
    }
  }

  static clear() {
    try {
      appCache.clear();
    } catch (error) {
      if (isDevelopment()) {
        console.warn('Cache clear error:', error);
      }
    }
  }

  static clearExpired() {
    try {
      const now = Date.now();
      for (const [key, value] of appCache.entries()) {
        if (now - value.timestamp > CACHE_DURATION) {
          appCache.delete(key);
        }
      }
    } catch (error) {
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
  const promises = apiCalls.map(async ({ url, cacheKey, processor }) => {
    try {
      // التحقق من التخزين المؤقت
      const cached = PerformanceCache.get(cacheKey || url);
      if (cached) {
        return cached;
      }

      // استدعاء API مع timeout في بيئة المستشفى
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), isHospitalEnvironment() ? 30000 : 60000);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          // إضافة headers أمان إضافية في بيئة المستشفى
          ...(isHospitalEnvironment() && {
            'X-Requested-With': 'XMLHttpRequest'
          })
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`API call failed: ${url} - Status: ${response.status}`);
      }
      
      let data = await response.json();
      
      // معالجة البيانات إذا تم توفير معالج
      if (processor) {
        data = processor(data);
      }
      
      // حفظ في التخزين المؤقت
      PerformanceCache.set(cacheKey || url, data);
      
      return data;
    } catch (error) {
      if (isDevelopment()) {
        console.error('API call error:', error);
      }
      throw error;
    }
  });

  return Promise.all(promises);
}

/**
 * دالة لتحسين إنشاء عناصر DOM
 */
export function createElementsBatch(elements) {
  const fragment = document.createDocumentFragment();
  
  elements.forEach(elementConfig => {
    const element = document.createElement(elementConfig.tag || 'div');
    
    // تعيين الخصائص
    if (elementConfig.className) {
      element.className = elementConfig.className;
    }
    
    if (elementConfig.id) {
      element.id = elementConfig.id;
    }
    
    if (elementConfig.textContent) {
      element.textContent = elementConfig.textContent;
    }
    
    if (elementConfig.innerHTML) {
      element.innerHTML = elementConfig.innerHTML;
    }
    
    if (elementConfig.attributes) {
      Object.entries(elementConfig.attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
      });
    }
    
    if (elementConfig.dataset) {
      Object.entries(elementConfig.dataset).forEach(([key, value]) => {
        element.dataset[key] = value;
      });
    }
    
    if (elementConfig.children) {
      elementConfig.children.forEach(child => {
        element.appendChild(createElementsBatch([child])[0]);
      });
    }
    
    fragment.appendChild(element);
  });
  
  return fragment;
}

/**
 * دالة لتحسين معالجة النصوص
 */
export function processTextBatch(texts, processor) {
  return texts.map(text => processor(text));
}

/**
 * دالة لتحسين الترجمة المجمعة - محسنة للأمان
 */
export async function translateBatchOptimized(texts, targetLang, sourceLang = "en") {
  try {
    // تجميع النصوص الفريدة فقط
    const uniqueTexts = [...new Set(texts.filter(text => text && text.trim()))];
    
    if (uniqueTexts.length === 0) {
      return texts.map(() => "");
    }
    
    // التحقق من التخزين المؤقت للترجمات
    const cachedTranslations = new Map();
    const textsToTranslate = [];
    
    uniqueTexts.forEach(text => {
      const cacheKey = `translate_${text}_${sourceLang}_${targetLang}`;
      const cached = PerformanceCache.get(cacheKey);
      if (cached) {
        cachedTranslations.set(text, cached);
      } else {
        textsToTranslate.push(text);
      }
    });
    
    // ترجمة النصوص الجديدة فقط
    if (textsToTranslate.length > 0) {
      const { translateBatch } = await import('./translation.js');
      const newTranslations = await translateBatch(textsToTranslate, targetLang, sourceLang);
      
      // حفظ الترجمات الجديدة في التخزين المؤقت
      textsToTranslate.forEach((text, index) => {
        const cacheKey = `translate_${text}_${sourceLang}_${targetLang}`;
        PerformanceCache.set(cacheKey, newTranslations[index]);
        cachedTranslations.set(text, newTranslations[index]);
      });
    }
    
    // إرجاع الترجمات بالترتيب الأصلي
    return texts.map(text => {
      if (!text || !text.trim()) return "";
      return cachedTranslations.get(text) || text;
    });
  } catch (error) {
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
  return Promise.all(
    imageUrls.map(url => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
        img.src = url;
      });
    })
  );
}

/**
 * دالة لتحسين معالجة الأحداث
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * دالة لتحسين البحث في النصوص
 */
export function optimizedTextSearch(text, searchTerm) {
  if (!text || !searchTerm) return false;
  
  const normalizedText = text.toLowerCase().trim();
  const normalizedSearch = searchTerm.toLowerCase().trim();
  
  return normalizedText.includes(normalizedSearch);
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
      // تنظيف الصور المحملة مسبقاً
      const images = document.querySelectorAll('img[data-preloaded]');
      images.forEach(img => {
        if (img.complete) {
          img.removeAttribute('data-preloaded');
        }
      });
    }
    
    // إجبار جمع القمامة (إذا كان متاحاً)
    if (window.gc) {
      window.gc();
    }
  } catch (error) {
    if (isDevelopment()) {
      console.warn('Memory cleanup error:', error);
    }
  }
}

// تنظيف الذاكرة كل 5 دقائق في الإنتاج، كل 10 دقائق في التطوير
const cleanupInterval = isDevelopment() ? 10 * 60 * 1000 : 5 * 60 * 1000;
setInterval(cleanupMemory, cleanupInterval);

// إضافة event listener لتنظيف الذاكرة عند إغلاق الصفحة
window.addEventListener('beforeunload', () => {
  PerformanceCache.clear();
}); 
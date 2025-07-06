let allNotifications = [];
let showingAll = false;

const notifPopup   = document.getElementById('notifications-popup');
const notifList    = document.getElementById('notifications-list');
const notifButton  = document.querySelector('a[href="/Notifications/Notifications.html"]');

// نظام فلترة النصوص حسب اللغة:
// 1. النصوص داخل قوسين []: (["Printer driver error pops up| يظهر خطأ في برنامج تشغيل الطابعة"])
// 2. الأسماء المفصولة بـ |: "Ahmed Al-Khuzai|احمد الخزاعي", "admin|مشرف"
// 3. أسماء المهندسين باللغتين: "assigned to engineer Mohammed محمد مشاط"
// يتم فلترة النص حسب اللغة المحددة في languageManager.currentLang

function cleanTag(text) {
  return typeof text === 'string'
    ? text.replace(/\s*\[(ar|en)\]/gi, '').trim()
    : text;
}

/// دالة ترجمة عبر Google Translate


notifButton.addEventListener('click', (e) => {
  e.preventDefault();
  toggleNotifications();
});

async function fetchUnseenCount() {
  const token = localStorage.getItem('token');
  const notifCount = document.getElementById('notif-count');

  try {
    const res = await fetch('http://localhost:4000/notifications/unseen-count', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const { count } = await res.json();

    if (count > 0) {
      notifCount.textContent = count;
      notifCount.style.display = 'inline-block';
    } else {
      notifCount.textContent = '';
      notifCount.style.display = 'none';
    }
  } catch (err) {
    console.error('❌ Failed to fetch unseen count:', err);
  }
}

async function toggleNotifications() {
  const notifCount = document.getElementById('notif-count');

  if (notifPopup.classList.contains('hidden')) {
    await loadNotifications();
    notifPopup.classList.remove('hidden');

    try {
      // بعد عرض البوب أب، نعلم السيرفر أن الإشعارات أصبحت مرئية
      const res = await fetch('http://localhost:4000/notifications/mark-as-seen', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
      });
      const result = await res.json();

      if (res.ok && result.message === 'All notifications marked as seen') {
        // نعيد جلب عدد الإشعارات غير المقروءة
        await fetchUnseenCount();
        // نحدّث allNotifications داخليًا لو أردنا الاحتفاظ بوضع is_seen
        allNotifications = allNotifications.map(n => ({ ...n, is_seen: true }));
      } else {
        console.warn("⚠️ Server didn't confirm marking as seen.");
      }
    } catch (err) {
      console.error('❌ Failed to mark notifications as seen:', err);
    }
  } else {
    notifPopup.classList.add('hidden');
  }
}

async function loadNotifications() {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:4000/notifications', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    allNotifications = await res.json();
    renderNotifications();
  } catch (err) {
    console.error('Error loading notifications:', err);
    notifList.innerHTML = '<div class="p-4 text-center text-red-400">Failed to load notifications</div>';
  }
}

// دالة فلترة أسماء المهندسين بـ '|' - محدثة لتكون مثل السيرفر
function filterEngineerNameByLang(text, lang) {
  if (!text || typeof text !== 'string') return text;
  return text.replace(/([A-Za-z\s]+)\|([\u0600-\u06FF\s]+)/g, (match, en, ar, offset, string) => {
    const name = lang === 'ar' ? ar.trim() : en.trim();
    
    // التحقق من المسافة قبل الاسم
    const before = string.slice(0, offset);
    let result = name;
    
    if (before.length > 0 && !before.endsWith(' ')) {
      result = ' ' + name;
    }
    
    // التحقق من المسافة بعد الاسم
    const after = string.slice(offset + match.length);
    if (after.length > 0 && !after.startsWith(' ') && !after.startsWith('،') && !after.startsWith('.') && !after.startsWith('!') && !after.startsWith('?')) {
      result = result + ' ';
    }
    
    return result;
  });
}

// دالة للتعامل مع النصوص داخل قوسين [] التي تحتوي على | لفصل اللغتين
function filterBracketedTextByLang(text, lang) {
  if (!text || typeof text !== 'string') return text;
  
  // التعامل مع النصوص المعقدة التي تحتوي على أقواس مربعة متداخلة
  return text.replace(/\["([^"]+)\|([^"]+)"\]/g, (match, englishPart, arabicPart) => {
    const en = englishPart.trim();
    const ar = arabicPart.trim();
    
    // التحقق من وجود أحرف عربية في الجزء العربي
    const hasArabicChars = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(ar);
    
    if (lang === 'ar') {
      return hasArabicChars ? ar : en;
    } else {
      return en || ar;
    }
  });
}

// دالة للتعامل مع النصوص التي تحتوي على arrays داخل الأقواس المربعة
function filterComplexBracketedText(text, lang) {
  if (!text || typeof text !== 'string') return text;
  
  // التعامل مع النصوص المعقدة التي تحتوي على أقواس مربعة مزدوجة مثل [["text|text"]]
  return text.replace(/\[\[([^\]]+)\]\]/g, (match, arrayContent) => {
    // تنظيف المحتوى من علامات الاقتباس الزائدة
    let cleanContent = arrayContent.replace(/^"/, '').replace(/"$/, '');
    
    // إذا كان المحتوى يحتوي على | لفصل اللغتين
    if (cleanContent.includes('|')) {
      const parts = cleanContent.split('|').map(s => s.trim());
      if (parts.length >= 2) {
        // البحث عن الجزء الإنجليزي والعربي
        let englishPart = '';
        let arabicPart = '';
        
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          const hasArabicChars = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(part);
          
          if (hasArabicChars) {
            arabicPart = part;
          } else {
            englishPart = part;
          }
        }
        
        // إرجاع الجزء المناسب حسب اللغة
        if (lang === 'ar') {
          return arabicPart || englishPart;
        } else {
          return englishPart || arabicPart;
        }
      }
    }
    
    // إذا لم يكن هناك |، نعيد المحتوى كما هو
    return cleanContent;
  });
}

// دالة للتعامل مع أسماء المهندسين التي تأتي باللغتين معًا
function filterEngineerNamesByLang(text, lang) {
  if (!text || typeof text !== 'string') return text;
  
  try {
    // البحث عن أسماء مهندسين تأتي باللغتين معًا
    // مثال: "assigned to engineer Mohammed محمد مشاط"
    return text.replace(/(\b[A-Za-z]+\s+)([A-Za-zء-ي0-9_\-]+\s+[ء-ي0-9_\-]+)/g, (match, prefix, namePart) => {
      try {
        if (!namePart || typeof namePart !== 'string') {
          return match;
        }
        
        const parts = namePart.trim().split(/\s+/).filter(part => part.length > 0);
        
        if (parts.length === 0) {
          return match;
        }
        
        // البحث عن الجزء الإنجليزي والجزء العربي
        let englishName = '';
        let arabicName = '';
        
        for (const part of parts) {
          // التحقق من أن الجزء يحتوي على أحرف عربية
          const hasArabicChars = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(part);
          
          if (hasArabicChars) {
            arabicName = part;
          } else {
            englishName = part;
          }
        }
        
        if (lang === 'ar') {
          return prefix + (arabicName || englishName); // إذا كانت اللغة عربية، نعرض الاسم العربي إذا وجد
        } else {
          return prefix + (englishName || arabicName); // إذا كانت اللغة إنجليزية، نعرض الاسم الإنجليزي إذا وجد
        }
      } catch (error) {
        console.warn('Error in filterEngineerNamesByLang inner:', error, 'for namePart:', namePart);
        return match; // إرجاع النص الأصلي إذا حدث خطأ
      }
    });
  } catch (error) {
    console.warn('Error in filterEngineerNamesByLang outer:', error, 'for text:', text);
    return text; // إرجاع النص الأصلي إذا حدث خطأ
  }
}

// دالة بديلة أبسط للتعامل مع أسماء المهندسين
function filterEngineerNamesSimple(text, lang) {
  if (!text || typeof text !== 'string') return text;
  
  try {
    // البحث عن النمط: engineer + اسم إنجليزي + اسم عربي
    return text.replace(/(\bengineer\s+)([A-Za-z]+)\s+([ء-ي]+)/gi, (match, prefix, englishName, arabicName) => {
      if (lang === 'ar') {
        return prefix + arabicName;
      } else {
        return prefix + englishName;
      }
    });
  } catch (error) {
    console.warn('Error in filterEngineerNamesSimple:', error, 'for text:', text);
    return text;
  }
}

// دالة للتعامل مع أسماء المهندسين بشكل عام
function filterEngineerNamesGeneral(text, lang) {
  if (!text || typeof text !== 'string') return text;
  
  try {
    // البحث عن أي نص يحتوي على "engineer" متبوع باسمين (إنجليزي وعربي)
    return text.replace(/(\bengineer\s+)([A-Za-zء-ي0-9_\-]+\s+[ء-ي0-9_\-]+)/gi, (match, prefix, names) => {
      const nameParts = names.trim().split(/\s+/);
      
      if (nameParts.length >= 2) {
        // البحث عن الاسم الإنجليزي والعربي
        let englishName = '';
        let arabicName = '';
        
        for (const part of nameParts) {
          const hasArabicChars = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(part);
          if (hasArabicChars) {
            arabicName = part;
          } else if (/^[A-Za-z0-9_\-]+$/.test(part)) {
            englishName = part;
          }
        }
        
        if (lang === 'ar') {
          return prefix + (arabicName || englishName || nameParts[0]);
        } else {
          return prefix + (englishName || arabicName || nameParts[0]);
        }
      }
      
      return match;
    });
  } catch (error) {
    console.warn('Error in filterEngineerNamesGeneral:', error, 'for text:', text);
    return text;
  }
}

// دالة للتعامل مع "assigned to" و "to"
function filterAssignedTo(text, lang) {
  if (!text || typeof text !== 'string') return text;
  
  try {
    // البحث عن "assigned to engineer" أو "to engineer"
    return text.replace(/(\b(?:assigned\s+)?to\s+engineer\s+)([A-Za-zء-ي0-9_\-]+\s+[ء-ي0-9_\-]+)/gi, (match, prefix, names) => {
      const nameParts = names.trim().split(/\s+/);
      
      if (nameParts.length >= 2) {
        // البحث عن الاسم الإنجليزي والعربي
        let englishName = '';
        let arabicName = '';
        
        for (const part of nameParts) {
          const hasArabicChars = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(part);
          if (hasArabicChars) {
            arabicName = part;
          } else if (/^[A-Za-z0-9_\-]+$/.test(part)) {
            englishName = part;
          }
        }
        
        if (lang === 'ar') {
          return prefix + (arabicName || englishName || nameParts[0]);
        } else {
          return prefix + (englishName || arabicName || nameParts[0]);
        }
      }
      
      return match;
    });
  } catch (error) {
    console.warn('Error in filterAssignedTo:', error, 'for text:', text);
    return text;
  }
}

// دالة للتعامل مع أي نص يحتوي على اسمين متتاليين (إنجليزي وعربي)
function filterConsecutiveNames(text, lang) {
  if (!text || typeof text !== 'string') return text;
  
  try {
    // البحث عن نمط: كلمة إنجليزية + كلمة عربية متتالية
    return text.replace(/(\b[A-Za-z0-9_\-]+\s+)([ء-ي0-9_\-]+)/g, (match, englishPart, arabicPart) => {
      // التحقق من أن الجزء العربي يحتوي على أحرف عربية
      const hasArabicChars = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(arabicPart);
      
      if (hasArabicChars) {
        if (lang === 'ar') {
          return arabicPart;
        } else {
          return englishPart.trim();
        }
      }
      
      return match;
    });
  } catch (error) {
    console.warn('Error in filterConsecutiveNames:', error, 'for text:', text);
    return text;
  }
}

// دالة للتعامل مع "user" و "assigned to user"
function filterUserNames(text, lang) {
  if (!text || typeof text !== 'string') return text;
  
  try {
    // البحث عن "assigned to user" أو "to user"
    return text.replace(/(\b(?:assigned\s+)?to\s+user\s+)([A-Za-zء-ي0-9_\-]+\s+[ء-ي0-9_\-]+)/gi, (match, prefix, names) => {
      const nameParts = names.trim().split(/\s+/);
      
      if (nameParts.length >= 2) {
        // البحث عن الاسم الإنجليزي والعربي
        let englishName = '';
        let arabicName = '';
        
        for (const part of nameParts) {
          const hasArabicChars = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(part);
          if (hasArabicChars) {
            arabicName = part;
          } else if (/^[A-Za-z0-9_\-]+$/.test(part)) {
            englishName = part;
          }
        }
        
        if (lang === 'ar') {
          return prefix + (arabicName || englishName || nameParts[0]);
        } else {
          return prefix + (englishName || arabicName || nameParts[0]);
        }
      }
      
      return match;
    });
  } catch (error) {
    console.warn('Error in filterUserNames:', error, 'for text:', text);
    return text;
  }
}
// ١) دالة للتأكد إذا الرسالة هي array أو JSON string تمثل array
// ١) دالة لتوحيد الرسالة إلى string
function normalizeMessage(text) {
  // لو array أصلاً → نبسطه (flatten) ونجمعه
  if (Array.isArray(text)) {
    return text.flat(Infinity).join(' ');
  }

  // لو string → نجرب parse JSON
  if (typeof text === 'string') {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return parsed.flat(Infinity).join(' ');
      }
    } catch (e) {
      // مش JSON → نستعمل النص كما هو
    }
    return text;
  }

  // أي نوع ثاني → نحوله string
  return String(text);
}
// دالة عامة تختار القسم اللي يناسب اللغة لأي نص فيه | - محدثة لتكون مثل السيرفر
function filterByPipe(text, lang) {
  if (typeof text !== 'string') return text;
  
  // التعامل مع النصوص المعقدة التي تحتوي على أقواس وarrays
  return text.replace(/([^|]+)\|([^|]+)/g, (match, en, ar, offset, string) => {
    // فلترة النص العادي
    const englishPart = en.trim();
    const arabicPart = ar.trim();
    
    // التحقق من وجود أحرف عربية في الجزء العربي
    const hasArabicChars = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(arabicPart);
    
    const name = lang === 'ar' ? (hasArabicChars ? arabicPart : englishPart) : (englishPart || arabicPart);
    
    // التحقق من المسافة قبل الاسم
    const before = string.slice(0, offset);
    let result = name;
    
    if (before.length > 0 && !before.endsWith(' ')) {
      result = ' ' + name;
    }
    
    // التحقق من المسافة بعد الاسم
    const after = string.slice(offset + match.length);
    if (after.length > 0 && !after.startsWith(' ') && !after.startsWith('،') && !after.startsWith('.') && !after.startsWith('!') && !after.startsWith('?')) {
      result = result + ' ';
    }
    
    return result;
  });
}

// دالة للتعامل مع النصوص الطويلة التي تحتوي على | واحد يفصل بين النص الإنجليزي والعربي بالكامل - محدثة لتكون مثل السيرفر
function filterLongTextByPipe(text, lang) {
  if (typeof text !== 'string') return text;
  
  // البحث عن النصوص التي تحتوي على | واحد فقط يفصل بين نصين طويلين
  const parts = text.split('|');
  if (parts.length === 2) {
    const englishPart = parts[0].trim();
    const arabicPart = parts[1].trim();
    
    // التحقق من وجود أحرف عربية في الجزء العربي
    const hasArabicChars = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(arabicPart);
    
    const name = lang === 'ar' ? (hasArabicChars ? arabicPart : englishPart) : (englishPart || arabicPart);
    
    // التحقق من المسافة قبل الاسم
    const before = text.substring(0, text.indexOf('|'));
    let result = name;
    
    if (before.length > 0 && !before.endsWith(' ')) {
      result = ' ' + name;
    }
    
    // التحقق من المسافة بعد الاسم
    const after = text.substring(text.indexOf('|') + 1 + arabicPart.length);
    if (after.length > 0 && !after.startsWith(' ') && !after.startsWith('،') && !after.startsWith('.') && !after.startsWith('!') && !after.startsWith('?')) {
      result = result + ' ';
    }
    
    return result;
  }
  
  // إذا كان النص يحتوي على أقواس مربعة في البداية والنهاية، نزيلها أولاً
  if (text.startsWith('["') && text.endsWith('"]')) {
    const innerText = text.slice(2, -2); // إزالة [" و "]
    const innerParts = innerText.split('|');
    if (innerParts.length === 2) {
      const englishPart = innerParts[0].trim();
      const arabicPart = innerParts[1].trim();
      
      // التحقق من وجود أحرف عربية في الجزء العربي
      const hasArabicChars = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(arabicPart);
      
      const name = lang === 'ar' ? (hasArabicChars ? arabicPart : englishPart) : (englishPart || arabicPart);
      
      // التحقق من المسافة قبل الاسم
      const before = innerText.substring(0, innerText.indexOf('|'));
      let result = name;
      
      if (before.length > 0 && !before.endsWith(' ')) {
        result = ' ' + name;
      }
      
      // التحقق من المسافة بعد الاسم
      const after = innerText.substring(innerText.indexOf('|') + 1 + arabicPart.length);
      if (after.length > 0 && !after.startsWith(' ') && !after.startsWith('،') && !after.startsWith('.') && !after.startsWith('!') && !after.startsWith('?')) {
        result = result + ' ';
      }
      
      return result;
    }
  }
  
  return text;
}

// دالة للتعامل مع النصوص المختلطة (إنجليزي متبوع بعربي بدون فواصل) - محدثة لتكون مثل السيرفر
function filterMixedText(text, lang) {
  if (typeof text !== 'string') return text;
  
  // البحث عن النمط: نص إنجليزي + نص عربي متصل بدون فواصل
  // مثال: "Main report... رواد بن صديق... تم تقديم التقرير..."
  
  // البحث عن أول ظهور لأحرف عربية متتالية
  const arabicStartIndex = text.search(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/);
  
  if (arabicStartIndex > 0) {
    const englishPart = text.substring(0, arabicStartIndex).trim();
    const arabicPart = text.substring(arabicStartIndex).trim();
    
    // التحقق من وجود أحرف عربية في الجزء العربي
    const hasArabicChars = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(arabicPart);
    
    if (hasArabicChars) {
      if (lang === 'ar') {
        return arabicPart;
      } else {
        return englishPart;
      }
    }
  }
  
  return text;
}


async function renderNotifications() {
  notifList.innerHTML = '';
  const notificationsToShow = showingAll ? allNotifications : allNotifications.slice(0, 4);
  const lang = languageManager.currentLang;

  if (notificationsToShow.length === 0) {
    const noNotificationsText = lang === 'ar' ? 'لا توجد إشعارات' : 'No notifications';
    notifList.innerHTML = `<div class="p-4 text-center text-gray-400">${noNotificationsText}</div>`;
    return;
  }

  for (const n of notificationsToShow) {
    console.debug('[DEBUG] original n.message:', n.message, typeof n.message);

    // 1) تطبيع وتحويل الرسالة
    let rawMessage = normalizeMessage(n.message);
    console.debug('[DEBUG] after normalizeMessage:', rawMessage);

    // 2) إزالة وسوم [ar] أو [en]
    rawMessage = cleanTag(rawMessage);
    console.debug('[DEBUG] after cleanTag:', rawMessage);

    // 3) تطبيق الفلاتر المحدثة (مثل السيرفر) بالترتيب الصحيح
    try {
      // فلترة النصوص الطويلة أولاً (للتعامل مع رسائل التذاكر)
      rawMessage = filterLongTextByPipe(rawMessage, lang);
      console.debug('[DEBUG] after filterLongTextByPipe:', rawMessage);
    } catch (error) {
      console.warn('Error in filterLongTextByPipe:', error);
    }

    try {
      // فلترة النصوص داخل الأقواس المربعة
      rawMessage = filterBracketedTextByLang(rawMessage, lang);
      console.debug('[DEBUG] after filterBracketedTextByLang:', rawMessage);
    } catch (error) {
      console.warn('Error in filterBracketedTextByLang:', error);
    }

    try {
      // فلترة النصوص المعقدة التي تحتوي على arrays
      rawMessage = filterComplexBracketedText(rawMessage, lang);
      console.debug('[DEBUG] after filterComplexBracketedText:', rawMessage);
    } catch (error) {
      console.warn('Error in filterComplexBracketedText:', error);
    }

    try {
      // فلترة أسماء المهندسين بـ '|'
      rawMessage = filterEngineerNameByLang(rawMessage, lang);
      console.debug('[DEBUG] after filterEngineerNameByLang:', rawMessage);
    } catch (error) {
      console.warn('Error in filterEngineerNameByLang:', error);
    }

    try {
      // فلترة أي "en|ar" عام
      rawMessage = filterByPipe(rawMessage, lang);
      console.debug('[DEBUG] after filterByPipe:', rawMessage);
    } catch (error) {
      console.warn('Error in filterByPipe:', error);
    }

    try {
      // فلترة النصوص المختلطة (إنجليزي متبوع بعربي بدون فواصل)
      rawMessage = filterMixedText(rawMessage, lang);
      console.debug('[DEBUG] after filterMixedText:', rawMessage);
    } catch (error) {
      console.warn('Error in filterMixedText:', error);
    }



    // بناء العنصر للعرض
    const displayLabel = getTypeLabel(n.type);
    const div = document.createElement('div');
    div.className = `notification-item p-3 border-b ${getColor(n.type)}`;
    div.dataset.id = n.id;
    div.innerHTML = `
      <div class="notification-content">
        <div class="font-semibold">${displayLabel}</div>
        <div class="text-sm text-gray-600">${rawMessage}</div>
        <div class="text-xs text-gray-400">${new Date(n.created_at).toLocaleString()}</div>
      </div>
    `;
    notifList.appendChild(div);
    setupSwipeToDelete(div);
  }
}

function setupSwipeToDelete(elem) {
  let startX = 0;
  let currentX = 0;
  let dragging = false;
  let isTouch = false;

  const start = (clientX) => {
    startX = clientX;
    currentX = startX;
    dragging = true;
    elem.classList.add('swiping');
  };

  const move = (clientX) => {
    if (!dragging) return;
    currentX = clientX;
    const translateX = Math.max(0, currentX - startX);
    elem.style.transform = `translateX(${translateX}px)`;

    if (translateX > 100) {
      elem.classList.add('delete-ready');
    } else {
      elem.classList.remove('delete-ready');
    }
  };

  const end = async () => {
    if (!dragging) return;
    dragging = false;
    const translateX = currentX - startX;

    elem.classList.remove('swiping');

    if (translateX > 100) {
      elem.style.transform = `translateX(100%)`;
      await deleteNotification(elem);
    } else {
      elem.style.transform = `translateX(0)`;
      elem.classList.remove('delete-ready');
    }
  };

  // Touch events
  elem.addEventListener('touchstart', (e) => {
    isTouch = true;
    start(e.touches[0].clientX);
  });
  elem.addEventListener('touchmove', (e) => {
    if (isTouch) move(e.touches[0].clientX);
  });
  elem.addEventListener('touchend', () => {
    if (isTouch) end();
  });

  // Mouse events
  elem.addEventListener('mousedown', (e) => {
    isTouch = false;
    start(e.clientX);
  });
  elem.addEventListener('mousemove', (e) => {
    if (!isTouch && dragging) move(e.clientX);
  });
  elem.addEventListener('mouseup', () => {
    if (!isTouch) end();
  });
  elem.addEventListener('mouseleave', () => {
    if (dragging && !isTouch) end();
  });
}

async function deleteNotification(elem) {
  const notifId = elem.dataset.id;
  try {
    const token = localStorage.getItem('token');
    await fetch(`http://localhost:4000/notifications/${notifId}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    allNotifications = allNotifications.filter(n => n.id != notifId);
    renderNotifications();
  } catch (err) {
    console.error('❌ Failed to delete notification:', err);
  }
}

async function clearNotifications() {
  const token = localStorage.getItem('token');
  try {
    await fetch('http://localhost:4000/notifications/clear', {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    allNotifications = [];
    renderNotifications();
  } catch (err) {
    console.error('❌ Failed to clear notifications:', err);
  }
}

function viewAll() {
  showingAll = true;
  renderNotifications();
}

function getColor(type) {
  if (type.includes('maintenance')) return 'border-l-4 border-blue-500';
  if (type.includes('report'))      return 'border-l-4 border-green-500';
  if (type.includes('ticket'))      return 'border-l-4 border-yellow-500';
  return 'border-l-4 border-gray-500';
}

function getTypeLabel(type) {
  const lang = languageManager.currentLang;
  
  switch (type) {
    case 'regular-maintenance':         
      return lang === 'ar' ? ' صيانة دورية' : ' Regular Maintenance';
    case 'general-maintenance':         
      return lang === 'ar' ? ' صيانة عامة' : ' General Maintenance';
    case 'external-maintenance':        
      return lang === 'ar' ? ' صيانة خارجية' : ' External Maintenance';
    case 'internal-ticket':             
      return lang === 'ar' ? ' تذكرة داخلية' : ' Internal Ticket';
    case 'external-ticket':             
      return lang === 'ar' ? ' تذكرة خارجية' : ' External Ticket';
    case 'general-report':              
      return lang === 'ar' ? ' تقرير عام' : ' General Report';
    case 'regular-report':              
      return lang === 'ar' ? ' تقرير دوري' : ' Regular Report';
    case 'external-report':             
      return lang === 'ar' ? ' تقرير خارجي' : ' External Report';
    case 'internal-ticket-report':      
      return lang === 'ar' ? ' تقرير التذكرة الداخلية' : ' Internal Ticket Report';
    case 'external-ticket-report':      
      return lang === 'ar' ? ' تقرير التذكرة الخارجية' : ' External Ticket Report';
    case 'status-update':               
      return lang === 'ar' ? ' تحديث الحالة' : ' Status Update';
    case 'external-status-update':      
      return lang === 'ar' ? ' تحديث حالة التقرير الخارجي' : ' External Report Status Update';
    case 'network-share':               
      return lang === 'ar' ? ' مشاركة شبكة' : ' Network Share';
    case 'contract-expiry-warning':     
      return lang === 'ar' ? ' تحذير انتهاء العقد' : ' Contract Expiry Warning';
    case 'technical-notification':      
      return lang === 'ar' ? ' إشعار تقني' : ' Technical Notification';
    default:                            
      return lang === 'ar' ? ' إشعار' : ' Notification';
  }
}

window.addEventListener('DOMContentLoaded', fetchUnseenCount);


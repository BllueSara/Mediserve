const nodemailer = require('nodemailer');
const db = require('../db');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'sup.it.system.medical@gmail.com',
    pass: 'bwub ozwj dzlg uicp' // App Password من Gmail
  },
  // تحسينات الأداء
  pool: true, // استخدام pool للاتصالات
  maxConnections: 5, // عدد أقصى للاتصالات المتزامنة
  maxMessages: 100, // عدد أقصى للرسائل في الاتصال الواحد
  rateLimit: 5, // عدد الرسائل في الثانية
  rateDelta: 1000, // الفاصل الزمني بين الرسائل (ملي ثانية)
  // إعدادات إضافية للأداء
  connectionTimeout: 60000, // timeout للاتصال (60 ثانية)
  greetingTimeout: 30000, // timeout للتحية
  socketTimeout: 60000, // timeout للـ socket
});

// وظيفة تنظيف النصوص للبريد الإلكتروني (عربي فقط)
// دالة تطبيع الرسالة (مثل الموجودة في Notifications.js)
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

// دالة إزالة وسوم اللغة [ar] أو [en]
function cleanTag(text) {
  if (!text || typeof text !== 'string') return text;
  return text.replace(/\[(ar|en)\]/g, '').trim();
}

// دالة فلترة النصوص داخل قوسين [] التي تحتوي على | لفصل اللغتين
function filterBracketedTextByLang(text, lang = 'ar') {
  if (!text || typeof text !== 'string') return text;
  
  // التعامل مع النصوص المعقدة التي تحتوي على أقواس مربعة متداخلة
  // النمط الأول: ["text1|text2"]
  let result = text.replace(/\["([^"]+)\|([^"]+)"\]/g, (match, englishPart, arabicPart) => {
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
  
  // النمط الثاني: ["text1 with [brackets]|text2"]
  result = result.replace(/\["([^|]+)\|([^"]+)"\]/g, (match, englishPart, arabicPart) => {
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
  
  return result;
}

// دالة للتعامل مع النصوص التي تحتوي على arrays داخل الأقواس المربعة
function filterComplexBracketedText(text, lang = 'ar') {
  if (!text || typeof text !== 'string') return text;
  
  // التعامل مع النصوص التي تحتوي على arrays مثل [["text1|text2", "text3|text4"]]
  return text.replace(/\[\[([^\]]+)\]\]/g, (match, arrayContent) => {
    // تقسيم المحتوى إلى عناصر منفصلة
    const items = arrayContent.split('","').map(item => 
      item.replace(/^"/, '').replace(/"$/, '')
    );
    
    // فلترة كل عنصر حسب اللغة
    const filteredItems = items.map(item => {
      if (item.includes('|')) {
        const [en, ar] = item.split('|').map(s => s.trim());
        const hasArabicChars = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(ar);
        return lang === 'ar' ? (hasArabicChars ? ar : en) : en;
      }
      return item;
    });
    
    return filteredItems.join(', ');
  });
}

// دالة فلترة أسماء المهندسين بـ '|'
function filterEngineerNameByLang(text, lang = 'ar') {
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



// دالة عامة تختار القسم اللي يناسب اللغة لأي نص فيه |
function filterByPipe(text, lang = 'ar') {
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


// دالة للتعامل مع النصوص الطويلة التي تحتوي على | واحد يفصل بين النص الإنجليزي والعربي بالكامل
function filterLongTextByPipe(text, lang = 'ar') {
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

// دالة للتعامل مع النصوص المختلطة (إنجليزي متبوع بعربي بدون فواصل)
function filterMixedText(text, lang = 'ar') {
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
function cleanEmailText(text, lang = 'ar') {
  if (!text) return '';
  
  // تطبيق نفس الفلترة الموجودة في Notifications.js مع التركيز على اللغة المحددة
  
  // 1) تطبيع وتحويل الرسالة
  let rawMessage = normalizeMessage(text);
  
  // 2) إزالة وسوم [ar] أو [en]
  rawMessage = cleanTag(rawMessage);
  
  // 3) فلترة النصوص الطويلة التي تحتوي على | واحد (للتعامل مع رسائل التذاكر)
  rawMessage = filterLongTextByPipe(rawMessage, lang);
  
  // 4) فلترة bracketed text حسب اللغة المحددة
  rawMessage = filterBracketedTextByLang(rawMessage, lang);
  
  // 5) فلترة النصوص المعقدة التي تحتوي على arrays
  rawMessage = filterComplexBracketedText(rawMessage, lang);
  
  // 6) فلترة الأسماء بـ '|'
  rawMessage = filterEngineerNameByLang(rawMessage, lang);
  
  // 7) فلترة أي "en|ar" عام
  rawMessage = filterByPipe(rawMessage, lang);
  
  // 8) فلترة النصوص المختلطة (إنجليزي متبوع بعربي بدون فواصل)
  rawMessage = filterMixedText(rawMessage, lang);
  


  return rawMessage.trim();
}
// وظيفة إرسال البريد الإلكتروني للإشعارات
async function sendNotificationEmail(userId, notificationMessage, notificationType, lang = 'ar') {
  try {
    // جلب معلومات المستخدم
    const [userResult] = await db.promise().query('SELECT name, email FROM users WHERE id = ?', [userId]);
    
    if (userResult.length === 0) {
      console.warn(`⚠️ User not found for ID: ${userId}`);
      return false;
    }

    const user = userResult[0];
    if (!user.email) {
      console.warn(`⚠️ No email found for user: ${user.name}`);
      return false;
    }

    // تنظيف اسم المستخدم
    const cleanUserName = cleanEmailText(user.name, lang);

    // تحديد نوع الإشعار وترجمته
    const notificationTypes = {
      'regular-maintenance': 'صيانة دورية',
      'general-maintenance': 'صيانة عامة',
      'external-maintenance': 'صيانة خارجية',
      'internal-ticket': 'تذكرة داخلية',
      'external-ticket': 'تذكرة خارجية',
      'general-report': 'تقرير عام',
      'regular-report': 'تقرير دوري',
      'external-report': 'تقرير خارجي',
      'internal-ticket-report': 'تقرير تذكرة داخلية',
      'external-ticket-report': 'تقرير تذكرة خارجية',
      'status-update': 'تحديث الحالة',
      'external-status-update': 'تحديث حالة التقرير الخارجي',
      'maintenance-reminder': 'تذكير بالصيانة',
      'external-ticket-followup': 'متابعة التذكرة الخارجية',
      'contract-expiry-warning': 'تحذير انتهاء العقد',
      'technical-notification': 'إشعار تقني',
      'network-share': 'مشاركة شبكة'
    };

    const typeLabel = notificationTypes[notificationType] || 'إشعار';
    
    // تنظيف رسالة الإشعار
    const cleanMessage = cleanEmailText(notificationMessage, lang);
    
    // إنشاء محتوى البريد الإلكتروني
    const emailSubject = `إشعار جديد - ${typeLabel}`;
    
    // تحديد لون الإشعار حسب النوع
    const getNotificationColor = (type) => {
      if (type.includes('maintenance')) return '#007bff'; // أزرق للصيانة
      if (type.includes('report')) return '#28a745';      // أخضر للتقارير
      if (type.includes('ticket')) return '#ffc107';      // أصفر للتذاكر
      return '#6c757d'; // رمادي للأنواع الأخرى
    };
    
    const notificationColor = getNotificationColor(notificationType);
    const currentDate = new Date().toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const emailHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>إشعار جديد - MediServe</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; direction: rtl;">
        
        <!-- Container الرئيسي -->
        <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden;">
          
          <!-- Header مع اللون -->
          <div style="background: linear-gradient(135deg, ${notificationColor}, ${notificationColor}dd); padding: 25px; text-align: center;">
            <div style="display: inline-block; background-color: rgba(255,255,255,0.2); border-radius: 50%; width: 60px; height: 60px; line-height: 60px; margin-bottom: 15px;">
              <span style="font-size: 24px; color: white;">🔔</span>
            </div>
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 300;">MediServe</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 16px;">إشعار جديد</p>
          </div>
          
          <!-- محتوى الإشعار -->
          <div style="padding: 30px;">
            
            <!-- تحية المستخدم -->
            <div style="margin-bottom: 25px;">
              <h2 style="color: #333; margin: 0 0 10px 0; font-size: 20px; font-weight: 500;">مرحباً ${cleanUserName} 👋</h2>
              <p style="color: #666; margin: 0; line-height: 1.6; font-size: 16px;">لديك إشعار جديد في نظام MediServe</p>
            </div>
            
            <!-- تفاصيل الإشعار -->
            <div style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); border-radius: 10px; padding: 25px; margin-bottom: 25px; border-right: 4px solid ${notificationColor};">
              <div style="display: flex; align-items: center; margin-bottom: 15px;">
                <div style="width: 12px; height: 12px; background-color: ${notificationColor}; border-radius: 50%; margin-left: 10px;"></div>
                <h3 style="color: #333; margin: 0; font-size: 18px; font-weight: 600;">${typeLabel}</h3>
              </div>
              <div style="background-color: white; border-radius: 8px; padding: 20px; border: 1px solid #e0e0e0;">
                <p style="color: #495057; margin: 0; line-height: 1.7; font-size: 15px; text-align: justify;">${cleanMessage}</p>
              </div>
            </div>
            
            <!-- معلومات إضافية -->
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 15px; margin-bottom: 25px; text-align: center;">
              <p style="color: #6c757d; margin: 0; font-size: 14px;">
                <span style="font-weight: 600;">التاريخ والوقت:</span> ${currentDate}
              </p>
            </div>
            
            
            <!-- معلومات النظام -->
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; text-align: center; border-top: 3px solid ${notificationColor};">
              <p style="color: #6c757d; margin: 0 0 10px 0; font-size: 13px; line-height: 1.5;">
                هذا البريد الإلكتروني تم إرساله تلقائياً من نظام MediServe
              </p>
            </div>
            
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
            <p style="color: #6c757d; margin: 0; font-size: 12px;">
              © 2024 MediServe - نظام إدارة المستشفى
            </p>
          </div>
          
        </div>
        
      </body>
      </html>
    `;

    const mailOptions = {
      from: 'sup.it.system.medical@gmail.com',
      to: user.email,
      subject: emailSubject,
      html: emailHtml
    };

    // إرسال البريد الإلكتروني مع timeout
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Email sending timeout'));
      }, 10000); // timeout بعد 10 ثواني

      transporter.sendMail(mailOptions, (error, info) => {
        clearTimeout(timeout);
        if (error) {
          console.error(`❌ Failed to send notification email to ${user.email}:`, error);
          reject(error);
        } else {
          console.log(`✅ Email sent successfully to ${user.email}`);
          resolve(info);
        }
      });
    });

    return true;
  } catch (error) {
    console.error(`❌ Error sending notification email:`, error);
    return false;
  }
}

// وظيفة إنشاء إشعار مع إرسال البريد الإلكتروني
async function createNotificationWithEmail(userId, message, type, lang = 'ar') {
  try {
    // إنشاء الإشعار في قاعدة البيانات
    await db.promise().query(`INSERT INTO Notifications (user_id, message, type) VALUES (?, ?, ?)`, [userId, message, type]);

    // إرسال البريد الإلكتروني في الخلفية باستخدام setImmediate
    setImmediate(() => {
      sendNotificationEmail(userId, message, type, lang).catch(error => {
        console.error(`❌ Error sending notification email (background):`, error);
      });
    });

  } catch (error) {
    console.error(`❌ Error creating notification with email:`, error);
  }
}


module.exports = {
  normalizeMessage,
  cleanTag,
  filterBracketedTextByLang,
  filterComplexBracketedText,
  filterEngineerNameByLang,
  filterByPipe,
  filterLongTextByPipe,
  filterMixedText,
  cleanEmailText,
  sendNotificationEmail,
  createNotificationWithEmail
}; 
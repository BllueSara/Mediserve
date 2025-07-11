const db = require("../db");
const nodemailer = require('nodemailer');

// تكوين البريد الإلكتروني
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'sup.it.system.medical@gmail.com',
    pass: 'bwub ozwj dzlg uicp'
  },
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  rateLimit: 5,
  rateDelta: 1000,
  connectionTimeout: 60000,
  greetingTimeout: 30000,
  socketTimeout: 60000,
});

function cleanEmailText(text) {
  if (!text) return '';
  text = text.replace(/([^|]+)\|([^|]+)/g, '$2');
  text = text.replace(/\[([^\]]+)\]/g, (match, content) => {
    const parts = content.split('|');
    return parts.length > 1 ? parts[1] : parts[0];
  });
  text = text.replace(/([A-Za-z\s]+)\s+([\u0600-\u06FF\s]+)/g, '$2');
  text = text.replace(/([A-Za-z\s]+)\s*\[([^\]]+)\]/g, '$2');
  text = text.replace(/\[\s*(ar|en)\s*\]/gi, '');
  const translations = {
    'General Maintenance': 'صيانة عامة',
    'Internal Ticket': 'تذكرة داخلية',
    'External Ticket': 'تذكرة خارجية',
    'General Report': 'تقرير عام',
    'Regular Report': 'تقرير دوري',
    'External Report': 'تقرير خارجي',
    'Status Update': 'تحديث الحالة',
    'Maintenance Reminder': 'تذكير بالصيانة',
    'Technical Notification': 'إشعار تقني',
    'Network Share': 'مشاركة شبكة',
    'Contract Expiry Warning': 'تحذير انتهاء العقد',
    'Open': 'مفتوح',
    'Closed': 'مغلق',
    'In Progress': 'قيد التنفيذ',
    'Pending': 'في الانتظار',
    'Resolved': 'تم الحل',
    'Engineer': 'مهندس',
    'Technician': 'فني',
    'Admin': 'مشرف',
    'User': 'مستخدم',
    'Device': 'جهاز',
    'Printer': 'طابعة',
    'Scanner': 'سكانر',
    'PC': 'كمبيوتر',
    'Laptop': 'لابتوب',
    'Desktop': 'كمبيوتر مكتبي',
    'Network': 'شبكة',
    'Maintenance': 'صيانة',
    'Report': 'تقرير',
    'Ticket': 'تذكرة',
    'Problem': 'مشكلة',
    'Issue': 'مشكلة',
    'Solution': 'حل',
    'Department': 'قسم',
    'IT Department': 'قسم تقنية المعلومات',
    'Technical Department': 'القسم التقني',
    'Support Department': 'قسم الدعم',
    'Maintenance Department': 'قسم الصيانة',
    'N/A': 'غير محدد',
    'No issues reported': 'لا توجد مشاكل مبلغ عنها',
    'Regular Maintenance': 'صيانة دورية',
    'Ticket Created': 'تم إنشاء التذكرة',
    'You have been assigned': 'تم تعيينك',
    'has been created by': 'تم إنشاءه بواسطة',
    'has been opened by': 'تم فتحه بواسطة',
    'has been submitted by': 'تم تقديمه بواسطة',
    'and assigned to engineer': 'وتم تعيينه للمهندس',
    'and handled by engineer': 'وتم تنفيذه بواسطة المهندس'
  };
  Object.keys(translations).forEach(english => {
    const arabic = translations[english];
    text = text.replace(new RegExp(english, 'g'), arabic);
  });
  text = text.replace(/\s+/g, ' ');
  text = text.replace(/\s*,\s*/g, '، ');
  text = text.replace(/\s*\.\s*/g, '. ');
  return text.trim();
}

async function sendNotificationEmail(userId, notificationMessage, notificationType) {
  try {
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
    const cleanUserName = cleanEmailText(user.name);
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
    const cleanMessage = cleanEmailText(notificationMessage);
    const emailSubject = `إشعار جديد - ${typeLabel}`;
    const getNotificationColor = (type) => {
      const colors = {
        'regular-maintenance': '#28a745',
        'general-maintenance': '#17a2b8',
        'external-maintenance': '#ffc107',
        'internal-ticket': '#007bff',
        'external-ticket': '#6f42c1',
        'general-report': '#20c997',
        'regular-report': '#fd7e14',
        'external-report': '#e83e8c',
        'internal-ticket-report': '#6c757d',
        'external-ticket-report': '#dc3545',
        'status-update': '#20c997',
        'external-status-update': '#fd7e14',
        'maintenance-reminder': '#ffc107',
        'external-ticket-followup': '#6f42c1',
        'contract-expiry-warning': '#dc3545',
        'technical-notification': '#17a2b8',
        'network-share': '#28a745'
      };
      return colors[type] || '#007bff';
    };
    const notificationColor = getNotificationColor(notificationType);
    const getNotificationIcon = (type) => {
      const icons = {
        'regular-maintenance': '🔧',
        'general-maintenance': '🛠️',
        'external-maintenance': '🔨',
        'internal-ticket': '🎫',
        'external-ticket': '📋',
        'general-report': '📊',
        'regular-report': '📈',
        'external-report': '📑',
        'internal-ticket-report': '📝',
        'external-ticket-report': '📄',
        'status-update': '🔄',
        'external-status-update': '📊',
        'maintenance-reminder': '⏰',
        'external-ticket-followup': '📞',
        'contract-expiry-warning': '⚠️',
        'technical-notification': '⚙️',
        'network-share': '🌐'
      };
      return icons[type] || '🔔';
    };
    const notificationIcon = getNotificationIcon(notificationType);

    const emailHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>إشعار جديد - MediServe</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa; direction: rtl;">
        
        <!-- Container الرئيسي -->
        <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header مع اللون المخصص -->
          <div style="background: linear-gradient(135deg, ${notificationColor}, ${notificationColor}dd); padding: 25px; text-align: center;">
            <div style="width:60px;height:60px;background:rgba(255,255,255,0.2);border-radius:50%;display:table; margin:0 auto 15px auto;">
              <span style="display:table-cell;vertical-align:middle;text-align:center;font-size:24px;color:white;width:60px;height:60px;">🔔</span>
            </div>
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">MediServe</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 16px;">نظام إدارة الصيانة الطبية</p>
          </div>
          
          <!-- محتوى الإشعار -->
          <div style="padding: 30px;">
            
            <!-- ترحيب -->
            <div style="margin-bottom: 25px;">
              <h2 style="color: #2c3e50; margin: 0 0 10px 0; font-size: 20px; font-weight: 600;">مرحباً ${cleanUserName} 👋</h2>
              <p style="color: #7f8c8d; margin: 0; font-size: 16px; line-height: 1.6;">لديك إشعار جديد في نظام MediServe</p>
            </div>
            
            <!-- نوع الإشعار -->
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 25px; border-right: 4px solid ${notificationColor};">
              <div style="display: flex; align-items: center; margin-bottom: 15px;">
                <div style="width:40px;height:40px;background:${notificationColor};border-radius:50%;display:table; margin-left:15px;">
                  <span style="display:table-cell;vertical-align:middle;text-align:center;font-size:18px;font-weight:bold;color:white;width:40px;height:40px;line-height:1;">${notificationIcon}</span>
                </div>
                <h3 style="color: #2c3e50; margin: 0; font-size: 18px; font-weight: 600;">${typeLabel}</h3>
              </div>
              <div style="background-color: white; border-radius: 6px; padding: 15px; border: 1px solid #e9ecef;">
                <p style="color: #495057; margin: 0; font-size: 15px; line-height: 1.6; text-align: justify;">${cleanMessage}</p>
              </div>
            </div>
            
            <!-- معلومات إضافية -->
            <div style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); border-radius: 8px; padding: 20px; margin-bottom: 25px;">
              <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <div style="width:30px;height:30px;background:${notificationColor};border-radius:50%;display:table; margin-left:12px;">
                  <span style="display:table-cell;vertical-align:middle;text-align:center;font-size:14px;color:white;width:30px;height:30px;">🕒</span>
                </div>
                <div>
                  <p style="color: #2c3e50; margin: 0; font-size: 14px; font-weight: 600;">وقت الإرسال</p>
                  <p style="color: #6c757d; margin: 0; font-size: 13px;">${new Date().toLocaleString('ar-SA', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}</p>
                </div>
              </div>
              <div style="display: flex; align-items: center;">
                <div style="width:30px;height:30px;background:${notificationColor};border-radius:50%;display:table; margin-left:12px;">
                  <span style="display:table-cell;vertical-align:middle;text-align:center;font-size:14px;color:white;width:30px;height:30px;">📋</span>
                </div>
                <div>
                  <p style="color: #2c3e50; margin: 0; font-size: 14px; font-weight: 600;">نوع الإشعار</p>
                  <p style="color: #6c757d; margin: 0; font-size: 13px;">${typeLabel}</p>
                </div>
              </div>
            </div>
            
            
          </div>
          
          <!-- Footer -->
          <div style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); padding: 25px; text-align: center; border-top: 1px solid #e9ecef;">
            <div style="margin-bottom: 20px;">
              <div style="width:50px;height:50px;background:linear-gradient(135deg, ${notificationColor}, ${notificationColor}dd);border-radius:50%;display:table; margin:0 auto 15px auto;">
                <span style="display:table-cell;vertical-align:middle;text-align:center;font-size:20px;font-weight:bold;color:white;width:50px;height:50px;">🏥</span>
              </div>
            </div>
            <p style="color: #2c3e50; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">MediServe</p>
            <p style="color: #6c757d; margin: 0 0 8px 0; font-size: 14px; font-weight: 500;">نظام إدارة الصيانة الطبية</p>
            <div style="margin: 15px 0; padding: 15px; background-color: white; border-radius: 6px; border: 1px solid #e9ecef;">
              <p style="color: #adb5bd; margin: 0 0 8px 0; font-size: 12px;">📧 هذا البريد الإلكتروني تم إرساله تلقائياً من النظام</p>
              <p style="color: #adb5bd; margin: 0; font-size: 12px;">⚙️ إذا كنت لا تريد تلقي هذه الإشعارات، يمكنك تعديل إعداداتك في النظام</p>
            </div>
          </div>
          
        </div>
        
        <!-- معلومات إضافية للمطورين -->
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; text-align: center;">
          <p style="color: #adb5bd; font-size: 11px; margin: 0;">
            تم إرسال هذا البريد بواسطة نظام MediServe في ${new Date().toLocaleString('ar-SA', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
        
      </body>
      </html>
    `;    const mailOptions = {
      from: 'medi.servee1@gmail.com',
      to: user.email,
      subject: emailSubject,
      html: emailHtml
    };
    await new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error(`❌ Failed to send notification email to ${user.email}:`, error);
          reject(error);
        } else {
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

async function createNotificationWithEmail(userId, message, type) {
  try {
    await db.promise().query(
      'INSERT INTO Notifications (user_id, message, type) VALUES (?, ?, ?)',
      [userId, message, type]
    );
    await sendNotificationEmail(userId, message, type);
  } catch (error) {
    console.error(`❌ Error creating notification with email:`, error);
  }
}

module.exports = {
  cleanEmailText,
  sendNotificationEmail,
  createNotificationWithEmail
}; 
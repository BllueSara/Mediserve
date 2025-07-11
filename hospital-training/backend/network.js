const express = require('express');
const cors = require('cors');
const db = require("./db");
const { exec } = require('child_process');
const { promisify } = require('util');
const ExcelJS = require('exceljs');
const fs = require('fs').promises;
const path = require('path');
const nodemailer = require('nodemailer');

// تكوين البريد الإلكتروني
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
function cleanEmailText(text) {
  if (!text) return '';
  
  // تنظيف النصوص المفصولة بـ |
  text = text.replace(/([^|]+)\|([^|]+)/g, '$2'); // يأخذ الجزء العربي
  
  // تنظيف النصوص داخل قوسين []
  text = text.replace(/\[([^\]]+)\]/g, (match, content) => {
    const parts = content.split('|');
    return parts.length > 1 ? parts[1] : parts[0]; // يأخذ الجزء العربي
  });
  
  // تنظيف أسماء المهندسين والأشخاص
  text = text.replace(/([A-Za-z\s]+)\s+([\u0600-\u06FF\s]+)/g, '$2'); // يأخذ الاسم العربي
  text = text.replace(/([A-Za-z\s]+)\s*\[([^\]]+)\]/g, '$2'); // يأخذ المحتوى داخل الأقواس
  
  // تنظيف التاجات اللغوية
  text = text.replace(/\[\s*(ar|en)\s*\]/gi, ''); // إزالة تاجات اللغة
  
  // ترجمة الكلمات الإنجليزية الشائعة
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
  
  // تطبيق الترجمات
  Object.keys(translations).forEach(english => {
    const arabic = translations[english];
    text = text.replace(new RegExp(english, 'g'), arabic);
  });
  
  // تنظيف إضافي للنصوص
  text = text.replace(/\s+/g, ' '); // إزالة المسافات الزائدة
  text = text.replace(/\s*,\s*/g, '، '); // تحويل الفواصل الإنجليزية إلى عربية
  text = text.replace(/\s*\.\s*/g, '. '); // تنظيف النقاط
  
  return text.trim();
}

// وظيفة إرسال البريد الإلكتروني للإشعارات
async function sendNotificationEmail(userId, notificationMessage, notificationType) {
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
    const cleanUserName = cleanEmailText(user.name);

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
    const cleanMessage = cleanEmailText(notificationMessage);
    
    // إنشاء محتوى البريد الإلكتروني
    const emailSubject = `إشعار جديد - ${typeLabel}`;
    
    // تحديد لون الإشعار حسب النوع
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
    
    // تحديد الأيقونة حسب نوع الإشعار
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
    `;

    const mailOptions = {
      from: 'medi.servee1@gmail.com',
      to: user.email,
      subject: emailSubject,
      html: emailHtml
    };

    // إرسال البريد الإلكتروني
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

// وظيفة إنشاء إشعار مع إرسال البريد الإلكتروني
async function createNotificationWithEmail(userId, message, type) {
  try {
    // إنشاء الإشعار في قاعدة البيانات
    await db.promise().query(
      'INSERT INTO Notifications (user_id, message, type) VALUES (?, ?, ?)',
      [userId, message, type]
    );

    // إرسال البريد الإلكتروني
    await sendNotificationEmail(userId, message, type);

  } catch (error) {
    console.error(`❌ Error creating notification with email:`, error);
  }
}

const execAsync = promisify(exec);
const app = express();
const PORT = process.env.PORT || 3000;

const JWT_SECRET = 'super_secret_key_123';
const jwt = require('jsonwebtoken');


function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'No token provided' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
}

module.exports = authenticateToken;


app.use(cors());
app.use(express.json());

// Serve static files from all directories
app.use(express.static(path.join(__dirname)));
app.use(express.static(path.join(__dirname, '..')));
app.use(express.static(path.join(__dirname, '..', '..')));




const IP_REGEX = /^\d{1,3}(\.\d{1,3}){3}$/;

function isValidIP(ip) {
  if (!IP_REGEX.test(ip)) return false;
  return ip.split('.').every(num => parseInt(num) <= 255);
}

// 1. Ping single IP
app.post('/api/ping', async (req, res) => {
  try {
    const { ip } = req.body;
    if (!ip || !isValidIP(ip)) {
      return res.status(400).json({ error: 'Invalid IP address' });
    }

    const isMac = process.platform === 'darwin';
    const command = isMac ? `ping -c 4 ${ip}` : `ping -n 4 ${ip}`;
    const { stdout, stderr } = await execAsync(command);

    res.json({ output: stdout || stderr || 'No response from ping', status: 'success' });
  } catch (error) {
    res.json({
      output: error.stdout || error.stderr || error.message,
      error: 'Ping failed',
      status: 'error'
    });
  }
});



// 2. Ping multiple IPs
app.post('/api/ping-all', async (req, res) => {
  try {
    const { ips } = req.body;
    if (!Array.isArray(ips)) return res.status(400).json({ error: 'Invalid input format' });

    const invalidIPs = ips.filter(ip => !isValidIP(ip));
    if (invalidIPs.length > 0) {
      return res.status(400).json({ error: 'Invalid IP addresses found', invalidIPs });
    }

    const isWindows = process.platform === 'win32';

    const results = await Promise.all(ips.map(async (ip) => {
      try {
        const command = isWindows ? `ping -n 4 ${ip}` : `ping -c 4 ${ip}`;
        const { stdout } = await execAsync(command);
        return { ip, status: 'success', output: stdout };
      } catch (error) {
        const stderr = error.stderr?.trim();
        const stdout = error.stdout?.trim();
        const fallback = error.message;

        return {
          ip,
          status: 'error',
          output: stderr || stdout || fallback || 'Unknown ping failure'
        };
      }
    }));

    res.json({ results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// 3. Traceroute
app.post('/api/traceroute', async (req, res) => {
  try {
    const { ip } = req.body;
    if (!ip || !isValidIP(ip)) return res.status(400).json({ error: 'Invalid IP address' });

    const isWindows = process.platform === 'win32';
    const command = isWindows ? `tracert ${ip}` : `traceroute ${ip}`;
    const { stdout } = await execAsync(command);

    res.json({ output: stdout });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Save IP data to DB

app.post('/api/add-entry', authenticateToken, (req, res) => {
  const userId = req.user.id; // هذا من التوكن
  const {
    circuit, isp, location, ip, speed, start_date, end_date
  } = req.body;

  if (!circuit || !isp || !location || !ip || !isValidIP(ip)) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  db.query(`
    INSERT INTO entries (circuit_name, isp, location, ip, speed, start_date, end_date, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [circuit, isp, location, ip, speed, start_date, end_date, userId], (err) => {
    if (err) return res.status(500).json({ error: 'Insert failed' });
    res.json({ success: true });
  });
});

app.delete('/api/entries/:id', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const entryId = req.params.id;

  try {
    const conn = db.promise();

    // ✅ Get user info
    const [userRows] = await conn.query(`SELECT name, role FROM users WHERE id = ?`, [userId]);
    const user = userRows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isAdmin = user.role === 'admin'; // أو user.is_admin === 1

    // ✅ Get entry to check ownership
    const [entryRows] = await conn.query(`SELECT * FROM entries WHERE id = ?`, [entryId]);
    if (!entryRows.length) return res.status(404).json({ error: 'Entry not found' });

    const entry = entryRows[0];

    // ✅ Check permission
    if (!isAdmin && entry.user_id !== userId) {
      return res.status(403).json({ error: '❌ Unauthorized to delete this entry' });
    }

    // ✅ Delete the entry
    const [result] = await conn.query('DELETE FROM entries WHERE id = ?', [entryId]);

    if (result.affectedRows === 0) {
      return res.status(400).json({ error: '❌ Delete failed' });
    }

    res.json({ success: true });

  } catch (err) {
    console.error("❌ Delete Error:", err);
    res.status(500).json({ error: '❌ Delete failed', details: err.message });
  }
});

app.put('/api/entries/:id', authenticateToken, async (req, res) => {
  const entryId = req.params.id;
  const { circuit, isp, location, ip, speed, start_date, end_date } = req.body;
  const userId = req.user.id;

  try {
    const conn = db.promise();

    // ✅ Get user's name and role
    const [userRows] = await conn.query(`SELECT name, role FROM users WHERE id = ?`, [userId]);
    const user = userRows[0];
    if (!user) return res.status(404).json({ message: "❌ User not found" });

    const userName = user.name;
    const isAdmin = user.role === 'admin'; // أو استبدل بـ: user.is_admin === 1

    // ✅ Get old entry
    const [oldEntryRows] = await conn.query(`SELECT * FROM entries WHERE id = ?`, [entryId]);
    if (!oldEntryRows.length) return res.status(404).json({ message: "❌ Entry not found" });

    const oldEntry = oldEntryRows[0];

    // ✅ Block update if not owner and not admin
    if (!isAdmin && oldEntry.user_id !== userId) {
      return res.status(403).json({ message: "❌ غير مصرح لك بتعديل هذا الإدخال" });
    }

    // ✅ Update entry
    await conn.query(`
      UPDATE entries SET 
        circuit_name = ?, isp = ?, location = ?, ip = ?, speed = ?, 
        start_date = ?, end_date = ?
      WHERE id = ?
    `, [circuit, isp, location, ip, speed, start_date, end_date, entryId]);

    // ✅ Compare changes
    const formatDate = d => d ? new Date(d).toISOString().split('T')[0] : null;
    const changes = [];

    if (oldEntry.circuit_name !== circuit)
      changes.push(`circuit_name: '${oldEntry.circuit_name}' → '${circuit}'`);
    if (oldEntry.isp !== isp)
      changes.push(`isp: '${oldEntry.isp}' → '${isp}'`);
    if (oldEntry.location !== location)
      changes.push(`location: '${oldEntry.location}' → '${location}'`);
    if (oldEntry.ip !== ip)
      changes.push(`ip: '${oldEntry.ip}' → '${ip}'`);
    if (oldEntry.speed !== speed)
      changes.push(`speed: '${oldEntry.speed}' → '${speed}'`);
    if (formatDate(oldEntry.start_date) !== formatDate(start_date))
      changes.push(`start_date: '${formatDate(oldEntry.start_date)}' → '${formatDate(start_date)}'`);
    if (formatDate(oldEntry.end_date) !== formatDate(end_date))
      changes.push(`end_date: '${formatDate(oldEntry.end_date)}' → '${formatDate(end_date)}'`);

    // ✅ Get new department ID
    const [deptRows] = await conn.query("SELECT id FROM Departments WHERE name = ?", [location]);
    if (!deptRows.length) return res.status(400).json({ message: `❌ Department '${location}' not found` });
    const newDeptId = deptRows[0].id;

    const logUpdates = [];

    // ✅ Update Maintenance_Devices
    const [deviceUpdate] = await conn.query(`
      UPDATE Maintenance_Devices
      SET department_id = ?
      WHERE ip_address = ? AND (department_id IS NULL OR department_id != ?)
    `, [newDeptId, ip, newDeptId]);
    if (deviceUpdate.affectedRows > 0) logUpdates.push("Maintenance_Devices");

    // ✅ Update Maintenance_Reports
    const [reportUpdate] = await conn.query(`
      UPDATE Maintenance_Reports
      SET department_id = ?
      WHERE device_id IN (
        SELECT id FROM Maintenance_Devices WHERE ip_address = ?
      )
    `, [newDeptId, ip]);
    if (reportUpdate.affectedRows > 0) logUpdates.push("Maintenance_Reports");

    // ✅ Update other related tables
    const updates = [
      { table: "PC_info", column: "Department", conditionCol: "Department", value: newDeptId },
      { table: "General_Maintenance", column: "department_name", conditionCol: "department_name", value: location },
      { table: "Regular_Maintenance", column: "department_name", conditionCol: "department_name", value: location },
      { table: "External_Maintenance", column: "department_name", conditionCol: "department_name", value: location },
      { table: "New_Maintenance_Report", column: "department_id", conditionCol: "department_id", value: newDeptId },
      { table: "Internal_Tickets", column: "department_id", conditionCol: "department_id", value: newDeptId },
      { table: "External_Tickets", column: "department_id", conditionCol: "department_id", value: newDeptId }
    ];
// خريطة ترجمة ثنائية اللغة لأسماء الحقول
const fieldLabelMap = {
  circuit_name: { en: "Circuit Name", ar: "اسم الدائرة" },
  isp: { en: "ISP", ar: "مزود الخدمة" },
  location: { en: "Location", ar: "الموقع" },
  ip: { en: "IP Address", ar: "عنوان IP" },
  speed: { en: "Speed", ar: "السرعة" },
  start_date: { en: "Contract Start", ar: "بداية العقد" },
  end_date: { en: "Contract End", ar: "نهاية العقد" }
};

// خريطة ترجمة للجداول
const tableLabelMap = {
  Maintenance_Devices: { en: "Maintenance Devices", ar: "أجهزة الصيانة" },
  Maintenance_Reports: { en: "Maintenance Reports", ar: "تقارير الصيانة" },
  PC_info: { en: "PC Info", ar: "معلومات الكمبيوتر" },
  General_Maintenance: { en: "General Maintenance", ar: "الصيانة العامة" },
  Regular_Maintenance: { en: "Regular Maintenance", ar: "الصيانة الدورية" },
  External_Maintenance: { en: "External Maintenance", ar: "الصيانة الخارجية" },
  New_Maintenance_Report: { en: "New Maintenance Report", ar: "تقرير صيانة جديد" },
  Internal_Tickets: { en: "Internal Tickets", ar: "تذاكر داخلية" },
  External_Tickets: { en: "External Tickets", ar: "تذاكر خارجية" }
};

// خريطة ترجمة للإجراءات
const actionLabelMap = {
  "Updated Department": { en: "Updated Department", ar: "تحديث القسم" },
  "Edited Entry": { en: "Edited Entry", ar: "تعديل الإدخال" }
};
    for (const update of updates) {
      const query = `
        UPDATE ${update.table}
        SET ${update.column} = ?
        WHERE ip_address = ? AND (${update.conditionCol} IS NULL OR ${update.conditionCol} != ?)
      `;
      const [result] = await conn.query(query, [update.value, ip, update.value]);
      if (result.affectedRows > 0) logUpdates.push(update.table);
    }

// ✅ Log department change
if (logUpdates.length > 0 && oldEntry.location !== location) {
  const logTables = logUpdates.map(tbl => {
    const label = tableLabelMap[tbl] || { en: tbl, ar: tbl };
    return `[${label.en}|${label.ar}]`;
  }).join(', ');

  await conn.query(`
    INSERT INTO Activity_Logs (user_id, user_name, action, details)
    VALUES (?, ?, ?, ?)
  `, [
    userId,
    userName,
    `[${actionLabelMap["Updated Department"].en}|${actionLabelMap["Updated Department"].ar}]`,
    `Changed department to '[${location}|${location}]' for IP [${ip}|${ip}] in: ${logTables}`
  ]);
}

// ✅ Log entry field changes
if (changes.length > 0) {
  // ترجم أسماء الحقول في التغييرات
  const bilingualChanges = changes.map(change => {
    // مثال: circuit_name: 'old' → 'new'
    const match = change.match(/^(\w+): '(.+)' → '(.+)'$/);
    if (match) {
      const field = match[1];
      const oldVal = match[2];
      const newVal = match[3];
      const label = fieldLabelMap[field] || { en: field, ar: field };
      return `[${label.en}|${label.ar}]: '[${oldVal}|${oldVal}]' → '[${newVal}|${newVal}]'`;
    }
    return change;
  });

  await conn.query(`
    INSERT INTO Activity_Logs (user_id, user_name, action, details)
    VALUES (?, ?, ?, ?)
  `, [
    userId,
    userName,
    `[${actionLabelMap["Edited Entry"].en}|${actionLabelMap["Edited Entry"].ar}]`,
    `Edited entry ID [${entryId}|${entryId}]:\n- ${bilingualChanges.join('\n- ')}`
  ]);
}

    res.json({
      message: `✅ Entry updated. ${changes.length || logUpdates.length ? '' : 'No actual changes.'}`
    });

  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ message: "❌ Update failed", error: err.message });
  }
});



// 6. Generate report
app.post('/api/report', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const { devices } = req.body;

    if (!Array.isArray(devices) || devices.length === 0) {
      return res.status(400).json({ error: '❌ No devices provided' });
    }

    const validDevices = devices.filter(d =>
      d.circuit && d.isp && d.location && d.ip
    );

    if (validDevices.length === 0) {
      return res.status(400).json({ error: '❌ All rows are missing required fields' });
    }

    // Safe formatter
    const formatDate = (dateStr) => {
      try {
        const d = new Date(dateStr);
        if (isNaN(d)) return '';
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      } catch {
        return '';
      }
    };

    const rows = validDevices.map(device => ({
      circuit: String(device.circuit || '').trim(),
      isp: String(device.isp || '').trim(),
      location: String(device.location || '').trim(),
      ip: String(device.ip || '').trim(),
      speed: String(device.speed || '').trim(),
      start_date: device.start_date ? formatDate(device.start_date) : '',
      end_date: device.end_date ? formatDate(device.end_date) : ''
    }));

    console.log('✅ Cleaned rows:', rows); // هنا تشوف القيم الفعلية المرسلة

    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Network Report');

    worksheet.columns = [
      { header: 'Circuit Name', key: 'circuit', width: 20 },
      { header: 'ISP', key: 'isp', width: 15 },
      { header: 'Location', key: 'location', width: 20 },
      { header: 'IP Address', key: 'ip', width: 18 },
      { header: 'Speed', key: 'speed', width: 15 },
      { header: 'Contract Start', key: 'start_date', width: 18 },
      { header: 'Contract End', key: 'end_date', width: 18 }
    ];

    worksheet.addRows(rows);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=network_report.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('❌ ExcelJS Error:', error);
    res.status(500).json({ error: `❌ Report error: ${error.message}` });
  }
});



app.post('/api/share-entry', authenticateToken, async (req, res) => {
  const senderId = req.user.id;
  const { devices, receiver_ids } = req.body;

  if (!Array.isArray(devices) || devices.length === 0 || !Array.isArray(receiver_ids) || receiver_ids.length === 0) {
    return res.status(400).json({ error: '❌ Missing devices or receivers' });
  }

  const formatDate = (iso) => {
    try {
      return new Date(iso).toISOString().split('T')[0]; // "YYYY-MM-DD"
    } catch {
      return null;
    }
  };

  try {
    const [senderInfoRows] = await db.promise().query(`SELECT name FROM users WHERE id = ?`, [senderId]);
    if (!senderInfoRows.length) {
      return res.status(400).json({ error: '❌ Sender not found' });
    }

    const senderName = senderInfoRows[0].name;
    const ipList = [];
    const receiverNames = [];

    for (const device of devices) {
      const {
        circuit_name, isp, location, ip, speed, start_date, end_date
      } = device;

      const formattedStart = formatDate(start_date);
      const formattedEnd = formatDate(end_date);

      if (!circuit_name || !isp || !location || !ip || !speed || !formattedStart || !formattedEnd) {
        continue;
      }

      const [existingRows] = await db.promise().query(`
        SELECT id FROM entries
        WHERE circuit_name = ? AND isp = ? AND location = ? AND ip = ? AND speed = ? AND start_date = ? AND end_date = ? AND user_id IS NULL
        LIMIT 1
      `, [circuit_name, isp, location, ip, speed, formattedStart, formattedEnd]);

      let entryId;

      if (existingRows.length > 0) {
        entryId = existingRows[0].id;
      } else {
        const [insertResult] = await db.promise().query(`
          INSERT INTO entries (circuit_name, isp, location, ip, speed, start_date, end_date, user_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, NULL)
        `, [circuit_name, isp, location, ip, speed, formattedStart, formattedEnd]);

        entryId = insertResult.insertId;
      }

      ipList.push(ip);

      for (const receiverId of receiver_ids) {
        await db.promise().query(`
          INSERT IGNORE INTO shared_entries (sender_id, receiver_id, entry_id)
          VALUES (?, ?, ?)
        `, [senderId, receiverId, entryId]);
      }
    }

    // إشعارات
    for (const receiverId of receiver_ids) {
      const [receiverInfo] = await db.promise().query(`SELECT name FROM users WHERE id = ?`, [receiverId]);
      const receiverName = receiverInfo[0]?.name || 'Unknown';
      receiverNames.push(receiverName);

      const message = `["📡 Network entries with IPs [${ipList.join(', ')}] were shared with you by ${senderName}|📡 تم مشاركة مداخل الشبكة ذات عناوين IP [${ipList.join(', ')}] معك بواسطة ${senderName}"]`;
      await createNotificationWithEmail(receiverId, message, 'network-share');
    }

    // سجل النشاط ثنائي اللغة
    const actionBilingual = `[${shareEntryActionLabelMap["Shared Network Entry"].en}|${shareEntryActionLabelMap["Shared Network Entry"].ar}]`;
    const ipListStr = ipList.join(', ');
    const receiverNamesStr = receiverNames.join(', ');
    const logMsgBilingual =
      `[${shareEntryFieldLabelMap.entry.en}|${shareEntryFieldLabelMap.entry.ar}]s with [${shareEntryFieldLabelMap.ip.en}|${shareEntryFieldLabelMap.ip.ar}]s [${ipListStr}|${ipListStr}] were shared with [${shareEntryFieldLabelMap.user.en}|${shareEntryFieldLabelMap.user.ar}]s: [${receiverNamesStr}|${receiverNamesStr}]`;

    await db.promise().query(`
      INSERT INTO Activity_Logs (user_id, user_name, action, details)
      VALUES (?, ?, ?, ?)
    `, [senderId, senderName, actionBilingual, logMsgBilingual]);

    res.json({ success: true });
  } catch (err) {
    console.error('❌ Share Error:', err);
    res.status(500).json({ error: '❌ Failed to share entries', details: err.message });
  }
});








app.get('/api/users', authenticateToken, (req, res) => {
  if (!req.user?.id) {
    return res.status(400).json({ error: 'Missing user ID in token' });
  }

  db.query('SELECT id, name FROM users WHERE id != ?', [req.user.id], (err, rows) => {
    if (err) {
      console.error('DB error:', err);
      return res.status(500).json({ error: 'DB error' });
    }
    res.json(rows);
  });
});









app.post('/api/save', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { devices } = req.body;

  if (!Array.isArray(devices) || devices.length === 0) {
    return res.status(400).json({ error: 'No devices provided' });
  }

  let savedCount = 0;
  let skippedCount = 0;

  try {
    const insertPromises = devices
      .filter(d => d.ip && isValidIP(d.ip) && d.circuit && d.isp && d.location)
      .map(async d => {
        const [existing] = await db.promise().query(`
          SELECT id FROM entries
          WHERE circuit_name = ? AND isp = ? AND location = ? AND ip = ?
            AND speed <=> ? AND start_date <=> ? AND end_date <=> ? AND user_id = ?
          LIMIT 1
        `, [
          d.circuit,
          d.isp,
          d.location,
          d.ip,
          d.speed || null,
          d.start_date || null,
          d.end_date || null,
          userId
        ]);

        if (existing.length > 0) {
          skippedCount++;
          return null;
        }

        await db.promise().query(`
          INSERT INTO entries (circuit_name, isp, location, ip, speed, start_date, end_date, user_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          d.circuit,
          d.isp,
          d.location,
          d.ip,
          d.speed || null,
          d.start_date || null,
          d.end_date || null,
          userId
        ]);

        savedCount++;
      });

    await Promise.all(insertPromises);

    res.json({ success: true, saved: savedCount, skipped: skippedCount });
  } catch (err) {
    console.error('❌ Save error:', err);
    res.status(500).json({ error: 'Failed to save entries' });
  }
});




app.get('/api/entries/mine', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    let entries;
    if (req.user.role === 'admin') {
      [entries] = await db.promise().query(`
        SELECT 
          MIN(id) AS id,
          circuit_name,
          isp,
          location,
          ip,
          speed,
          MIN(start_date) AS start_date,
          MAX(end_date) AS end_date
        FROM entries
        GROUP BY circuit_name, isp, location, ip, speed
      `);
    } else {
      [entries] = await db.promise().query(`
        SELECT 
          MIN(id) AS id,
          circuit_name,
          isp,
          location,
          ip,
          speed,
          MIN(start_date) AS start_date,
          MAX(end_date) AS end_date
        FROM entries
        WHERE user_id = ?
        GROUP BY circuit_name, isp, location, ip, speed
      `, [userId]);
    }

    res.json(entries);
  } catch (err) {
    console.error('❌ Error fetching my entries:', err.message);
    res.status(500).json({ error: 'Failed to load your entries' });
  }
});



app.get('/api/entries/shared-with-me', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const [entries] = await db.promise().query(`
      SELECT 
        MIN(e.id) AS id,
        e.circuit_name,
        e.isp,
        e.location,
        e.ip,
        e.speed,
        MIN(e.start_date) AS start_date,
        MAX(e.end_date) AS end_date
      FROM entries e
      JOIN shared_entries se ON e.id = se.entry_id
      WHERE se.receiver_id = ?
      GROUP BY e.circuit_name, e.isp, e.location, e.ip, e.speed
    `, [userId]);

    res.json(entries.map(e => ({ ...e, user_id: null })));
  } catch (err) {
    console.error('❌ Error fetching shared entries:', err.message);
    res.status(500).json({ error: 'Failed to load shared entries' });
  }
});





app.get('/api/distinct-values/:key', authenticateToken, async (req, res) => {
  const { key } = req.params;

  // قائمة الأعمدة المسموح بها (للحماية من SQL injection)
  const allowedKeys = [
    'circuit_name', 'isp', 'location', 'ip', 'speed', 'start_date', 'end_date'
  ];

  if (!allowedKeys.includes(key)) {
    return res.status(400).json({ error: '❌ Invalid filter key' });
  }

  try {
    const [rows] = await db.promise().query(`SELECT DISTINCT ?? AS value FROM entries`, [key]);
    const values = rows.map(r => r.value).filter(Boolean);
    res.json(values);
  } catch (err) {
    console.error('❌ Error in /distinct-values:', err.message);
    res.status(500).json({ error: 'DB query failed' });
  }
});

const cron = require('node-cron');
const { error } = require('console');


cron.schedule('02 * * * *', async () => {
  try {
    console.log('🚀 Starting contract expiry check at', new Date().toISOString());

    // خريطة ترجمة ثنائية اللغة للإجراء والتفاصيل
    const contractExpiryActionLabel = { en: 'Contract Expiry Reminder', ar: 'تذكير بانتهاء العقد' };
    const contractExpiryFieldLabel = {
      contract: { en: 'Contract', ar: 'العقد' },
      ip: { en: 'IP Address', ar: 'عنوان IP' },
      days: { en: 'Days Remaining', ar: 'الأيام المتبقية' }
    };

    const intervals = [
      { days: 90, label: '3 months', label_ar: '3 أشهر' },
      { days: 30, label: '1 month', label_ar: 'شهر واحد' },
      { days: 7, label: '1 week', label_ar: 'أسبوع واحد' },
    ];

    for (let interval of intervals) {
      console.log(`🔍 Checking for contracts expiring in ${interval.label} (${interval.days} days)`);

      const [entries] = await db.promise().query(`
        SELECT id, user_id, circuit_name, ip, end_date, DATEDIFF(end_date, CURDATE()) AS diff
        FROM entries
        WHERE DATEDIFF(end_date, CURDATE()) = ?
      `, [interval.days]);

      console.log(`📊 Found ${entries.length} entries for ${interval.label}`);

      for (let entry of entries) {
        console.log(`➡️ Entry ID ${entry.id}, circuit "${entry.circuit_name}", IP ${entry.ip}, diff=${entry.diff}`);

        const message = `"Contract for circuit \"${entry.circuit_name}\" (IP: ${entry.ip}) will expire in ${interval.label}|عقد الدائرة \"${entry.circuit_name}\" (IP: ${entry.ip}) سينتهي خلال ${interval.label_ar}"`;

        const [existingNotif] = await db.promise().query(`
          SELECT id FROM Notifications
          WHERE user_id = ? AND message = ? AND type = 'contract-expiry-warning'
        `, [entry.user_id, message]);

        console.log(`🔎 Existing notifications: ${existingNotif.length}`);

        if (existingNotif.length === 0) {
          const [userRes] = await db.promise().query(`SELECT name FROM users WHERE id = ?`, [entry.user_id]);
          const userName = userRes[0]?.name || 'Unknown';

          console.log(`✉️ Sending notification to user ${userName} (${entry.user_id})`);

          await createNotificationWithEmail(entry.user_id, message, 'contract-expiry-warning');

          // سجل النشاط ثنائي اللغة
          const actionBilingual = `[${contractExpiryActionLabel.en}|${contractExpiryActionLabel.ar}]`;
          const detailsBilingual =
            `[${contractExpiryFieldLabel.contract.en}|${contractExpiryFieldLabel.contract.ar}] for circuit "${entry.circuit_name}|${entry.circuit_name}" ([${contractExpiryFieldLabel.ip.en}|${contractExpiryFieldLabel.ip.ar}]: ${entry.ip}|${entry.ip}) will expire in [${contractExpiryFieldLabel.days.en}|${contractExpiryFieldLabel.days.ar}]: ${interval.label}|${interval.label_ar}`;

          await db.promise().query(`
            INSERT INTO Activity_Logs (user_id, user_name, action, details)
            VALUES (?, ?, ?, ?)
          `, [
            entry.user_id,
            userName,
            actionBilingual,
            detailsBilingual
          ]);

          console.log(`✅ Notification and log inserted for circuit ${entry.circuit_name}`);
        } else {
          console.log(`⚠️ Notification already exists for this contract.`);
        }
      }
    }

    console.log('✅ Contract expiry reminders processed completely.');
  } catch (err) {
    console.error('❌ Error in contract expiry check:', err);
  }
});


// حفظ مجموعة أجهزة من Excel
app.post('/api/entries/bulk', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { devices } = req.body;

  if (!Array.isArray(devices) || devices.length === 0) {
    return res.status(400).json({ error: '❌ No devices provided' });
  }

  let savedCount = 0;
  let skippedCount = 0;

  try {
    for (const d of devices) {
      // تحقق من صحة IP
      if (
        !d.circuit_name || !d.isp || !d.location || !d.ip ||
        !/^\d{1,3}(\.\d{1,3}){3}$/.test(d.ip) ||
        !d.ip.split('.').every(part => parseInt(part) <= 255)
      ) {
        skippedCount++;
        continue;
      }

      // تحقق من التكرار التام للمستخدم
      const [existing] = await db.promise().query(`
        SELECT id FROM entries
        WHERE circuit_name = ? AND isp = ? AND location = ? AND ip = ?
          AND speed <=> ? AND start_date <=> ? AND end_date <=> ? AND user_id = ?
        LIMIT 1
      `, [
        d.circuit_name,
        d.isp,
        d.location,
        d.ip,
        d.speed || null,
        d.start_date || null,
        d.end_date || null,
        userId
      ]);

      if (existing.length > 0) {
        skippedCount++;
        continue;
      }

      // إذا مو مكرر → نحفظه
      await db.promise().query(`
        INSERT INTO entries 
          (circuit_name, isp, location, ip, speed, start_date, end_date, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        d.circuit_name,
        d.isp,
        d.location,
        d.ip,
        d.speed || null,
        d.start_date || null,
        d.end_date || null,
        userId
      ]);

      savedCount++;
    }

    res.json({ success: true, saved: savedCount, skipped: skippedCount });
  } catch (err) {
    console.error('❌ Bulk insert error:', err.message);
    res.status(500).json({ error: '❌ Failed to save devices' });
  }
});


// route to ctreat report 
app.post('/api/reports/create', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { devices, type = 'normal' } = req.body;

  if (!Array.isArray(devices) || devices.length === 0) {
    return res.status(400).json({ error: '❌ No devices provided' });
  }

  try {
    const conn = db.promise();

    const now = new Date();
    const timestamp = now.toLocaleString('en-US', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
      hour12: true
    }).replace(',', '');
    const title = `Network Report - ${timestamp}`;

    // نحدد نوع التقرير
    const [reportRes] = await conn.query(`
      INSERT INTO Reports (user_id, title, report_type) VALUES (?, ?, ?)
    `, [userId, title, type]);

    const reportId = reportRes.insertId;

    const insertPromises = devices.map(d => {
      const commonFields = [
        reportId,
        d.ip,
        d.circuit,
        d.isp,
        d.location,
        d.speed || null,
        d.start_date || null,
        d.end_date || null
      ];

      // إذا كان auto → نحفظ النتائج التفصيلية
      if (type === 'auto') {
        return conn.query(`
          INSERT INTO Report_Results 
            (report_id, ip, circuit, isp, location, speed, start_date, end_date, latency, packetLoss, timeouts, status, output, timestamp)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          ...commonFields,
          d.latency || null,
          d.packetLoss || null,
          d.timeouts || null,
          d.status || null,
          d.output || '',
          new Date()
        ]);
      } else {
        // نوع normal → نحفظ فقط الحقول المطلوبة + status
        return conn.query(`
          INSERT INTO Report_Results 
            (report_id, ip, circuit, isp, location, speed, start_date, end_date, status, timestamp)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          ...commonFields,
          d.status || null,
          new Date()
        ]);
      }
    });

    await Promise.all(insertPromises);

    res.json({ success: true, report_id: reportId });
  } catch (err) {
    console.error("❌ Failed to create report:", err.message);
    res.status(500).json({ error: '❌ Could not save report' });
  }
});




// يجيب التقارير حسب اليوزر 
app.get('/api/reports/mine' , authenticateToken,  async(req,res) => {
  const userId = req.user.id;
  const isAdmin = req.user.role === "admin";

  try{
   const [reports] = await db.promise().query(`
    SELECT 
      r.id AS report_id, 
      r.created_at,
      u.name AS owner_name,
      COUNT(rr.id) AS device_count
    FROM Reports r
    LEFT JOIN Report_Results rr ON r.id = rr.report_id
    LEFT JOIN users u ON r.user_id = u.id
    ${isAdmin ? '' : 'WHERE r.user_id = ?'}
    GROUP BY r.id
    ORDER BY r.created_at DESC
  `, isAdmin ? [] : [userId]);

  res.json(reports);
  } catch (err) {
    console.error("❌ Failed to fetch reports:", err.message);
    res.status(500).json({ error: '❌ Could not fetch reports' });
  }
});


// detalis reports
app.get('/api/reports/:id', authenticateToken, async (req, res) => {
  const reportId = req.params.id;
  const userId = req.user.id;
  const isAdmin = req.user.role === 'admin';

  try {
    // نجيب معلومات التقرير
    const [[reportInfo]] = await db.promise().query(
      `SELECT user_id, title, created_at, report_type FROM Reports WHERE id = ?`,
      [reportId]
    );
    

    if (!reportInfo) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const isOwner = reportInfo.user_id === userId;
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // نجيب النتائج المرتبطة
    const [results] = await db.promise().query(
      `SELECT * FROM Report_Results WHERE report_id = ? ORDER BY timestamp ASC`, 
      [reportId]
    );

    // نرجع معلومات متكاملة
    res.json({
      title: reportInfo.title,
      type: reportInfo.report_type || 'normal', // <-- هنا التغيير الصحيح
      created_at: reportInfo.created_at,
      results
    });

  } catch (err) {
    console.error("❌ Error loading report details:", err.message);
    res.status(500).json({ error: '❌ Could not load report details' });
  }
});



app.get('/api/reports/:id/download', authenticateToken, async (req, res) => {
  const reportId = req.params.id;
  const userId = req.user.id;
  const isAdmin = req.user.role === 'admin';

  try {
    // تحقق من ملكية التقرير أو صلاحية الأدمن
    const [[reportInfo]] = await db.promise().query(
      `SELECT user_id, title, report_type FROM Reports WHERE id = ?`,
      [reportId]
    );

    if (!reportInfo) return res.status(404).json({ error: '❌ Report not found' });

    const isOwner = reportInfo.user_id === userId;
    if (!isOwner && !isAdmin) return res.status(403).json({ error: '❌ Forbidden' });

    const [results] = await db.promise().query(
      `SELECT * FROM Report_Results WHERE report_id = ? ORDER BY timestamp ASC`,
      [reportId]
    );

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Report');

    const isAuto = reportInfo.report_type === 'auto';

    // اختر الأعمدة بناءً على نوع التقرير
    sheet.columns = isAuto
      ? [
          { header: 'IP', key: 'ip', width: 20 },
          { header: 'Status', key: 'status', width: 15 },
          { header: 'Latency (ms)', key: 'latency', width: 15 },
          { header: 'Packet Loss (%)', key: 'packetLoss', width: 18 },
          { header: 'Timeouts', key: 'timeouts', width: 12 },
          { header: 'Timestamp', key: 'timestamp', width: 25 },
          { header: 'Output', key: 'output', width: 60 }
        ]
      : [
          { header: 'Circuit Name', key: 'circuit', width: 25 },
          { header: 'ISP', key: 'isp', width: 20 },
          { header: 'Location', key: 'location', width: 20 },
          { header: 'IP Address', key: 'ip', width: 20 },
          { header: 'Circuit Speed', key: 'speed', width: 20 },
          { header: 'Start Contract', key: 'start_date', width: 18 },
          { header: 'End Contract', key: 'end_date', width: 18 },
          { header: 'Status', key: 'status', width: 15 }
        ];

    // أضف البيانات للصفوف
    results.forEach(row => {
      sheet.addRow({
        ip: row.ip,
        status: row.status,
        latency: row.latency,
        packetLoss: row.packetLoss,
        timeouts: row.timeouts,
        timestamp: row.timestamp,
        output: row.output,
        circuit: row.circuit,
        isp: row.isp,
        location: row.location,
        speed: row.speed,
        start_date: row.start_date?.toISOString?.().split('T')[0] || '',
        end_date: row.end_date?.toISOString?.().split('T')[0] || ''
      });
    });

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${reportInfo.title.replace(/\s+/g, '_')}.xlsx"`
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err){
    console.error('❌ Error generating Excel report:', err.message);
    res.status(500).json({ error: '❌ Could not generate report file' });
  }
});



// Auto Ping Endpoint (بدون تخزين مؤقت، مجرد تشغيل مؤقت لمدة معينة)
app.post('/api/auto-ping/start', authenticateToken, async (req, res) => {
  const { ips, duration_hours } = req.body;

  if (!Array.isArray(ips) || ips.length === 0 || !duration_hours) {
    return res.status(400).json({ error: '❌ Missing IPs or duration' });
  }

  const userId = req.user.id;
  const durationMs = duration_hours * 60 * 60 * 1000;
  const endTime = Date.now() + durationMs;
  const isWindows = process.platform === 'win32';

  const formatPingOutput = (output) => {
    const latencyMatch = output.match(/time[=<](\d+\.?\d*)\s*ms/i);
    const lossMatch = output.match(/(\d+)%\s*packet loss/i);
    const timeouts = (output.match(/Request timed out/gi) || []).length;

    return {
      latency: latencyMatch ? parseFloat(latencyMatch[1]) : null,
      packetLoss: lossMatch ? parseFloat(lossMatch[1]) : 0,
      timeouts,
      status: output.includes('100% packet loss') || timeouts > 0 ? 'failed'
            : (lossMatch && parseFloat(lossMatch[1]) > 0) || (latencyMatch && parseFloat(latencyMatch[1]) > 50)
              ? 'unstable'
              : 'active'
    };
  };

  for (const ip of ips) {
    if (!isValidIP(ip)) continue;

    const interval = setInterval(async () => {
      if (Date.now() >= endTime) {
        clearInterval(interval);
        return;
      }

      const cmd = isWindows ? `ping -n 1 ${ip}` : `ping -c 1 ${ip}`;
      exec(cmd, async (err, stdout, stderr) => {
        const output = stdout || stderr || err?.message || 'No response';
        const parsed = formatPingOutput(output);

        // تخزين النتيجة
        try {
          await db.promise().query(`
            INSERT INTO Report_Results 
              (report_id, ip, latency, packetLoss, timeouts, status, output, timestamp, user_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            null, ip,
            parsed.latency, parsed.packetLoss, parsed.timeouts,
            parsed.status, output,
            new Date(), userId
          ]);
        } catch (dbErr) {
          console.error(`❌ DB Insert failed for ${ip}:`, dbErr.message);
        }

        console.log(`[${new Date().toISOString()}] [${ip}] ${parsed.status} (${parsed.latency}ms, ${parsed.packetLoss}% loss)`);
      });
    }, 60 * 1000); // كل دقيقة
  }

  res.json({ success: true, message: `✅ Auto ping started for ${ips.length} IP(s) for ${duration_hours} hour(s)` });
});

// في ملف السيرفر backend مثل network.js أو userServer.js
app.get('/api/auto-ping/results', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const [rows] = await db.promise().query(`
      SELECT ip, latency, packetLoss, timeouts, status, timestamp
      FROM Report_Results
      WHERE report_id IN (
        SELECT id FROM Reports WHERE user_id = ? AND report_type = 'auto'
      )
      ORDER BY timestamp DESC
      LIMIT 100
    `, [userId]);

    res.json(rows); // ✅ لازم يرجّع Array لأن front-end يتوقع كذا
  } catch (err) {
    console.error('❌ Auto Ping Results Error:', err.message);
    res.status(500).json({ error: '❌ Could not fetch auto ping results' });
  }
});




// Start server
//const os = require('os');
//const ip = Object.values(os.networkInterfaces()).flat().find(i => i.family === 'IPv4' && !i.internal).address;

//app.listen(PORT, ip, () => {
//console.log(`Server running at http://${ip}:${PORT}`);
//});


// تشغيل السيرفر
app.listen(3000, () => console.log('🚀 userServer.js running on http://localhost:3000'));


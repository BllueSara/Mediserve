const db = require("../db");
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'sup.it.system.medical@gmail.com',
    pass: 'bwub ozwj dzlg uicp'
  }
});

const forgotPasswordController = (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Please provide email' });
  db.query('SELECT * FROM users WHERE email = ?', [email], (err, users) => {
    if (err || users.length === 0) return res.status(404).json({ message: 'Email not found' });
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000);
    db.query(
      'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?',
      [token, expires, email],
      (updateErr) => {
        if (updateErr) return res.status(500).json({ message: 'Database error' });
        const resetLink = `http://localhost:4000/reset-password.html?token=${token}`;
        const currentDate = new Date().toLocaleDateString('ar-SA', {
          year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
   
        const mailOptions = {
          from: 'sup.it.system.medical@gmail.com',
          to: email,
          subject: 'إعادة تعيين كلمة المرور - MediServe',
          html: `
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>إعادة تعيين كلمة المرور - MediServe</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; direction: rtl;">
              
              <!-- Container الرئيسي -->
              <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden;">
                
                <!-- Header مع اللون -->
                <div style="background: linear-gradient(135deg, #dc3545, #dc3545dd); padding: 25px; text-align: center;">
                  <div style="display: inline-block; background-color: rgba(255,255,255,0.2); border-radius: 50%; width: 60px; height: 60px; line-height: 60px; margin-bottom: 15px;">
                    <span style="font-size: 24px; color: white;">🔐</span>
                  </div>
                  <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 300;">MediServe</h1>
                  <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 16px;">إعادة تعيين كلمة المرور</p>
                </div>
                
                <!-- محتوى الإيميل -->
                <div style="padding: 30px;">
                  
                  <!-- رسالة الترحيب -->
                  <div style="margin-bottom: 25px;">
                    <h2 style="color: #333; margin: 0 0 10px 0; font-size: 20px; font-weight: 500;">مرحباً 👋</h2>
                    <p style="color: #666; margin: 0; line-height: 1.6; font-size: 16px;">لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك في نظام MediServe</p>
                  </div>
                  
                  <!-- تفاصيل الطلب -->
                  <div style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); border-radius: 10px; padding: 25px; margin-bottom: 25px; border-right: 4px solid #dc3545;">
                    <div style="display: flex; align-items: center; margin-bottom: 15px;">
                      <div style="width: 12px; height: 12px; background-color: #dc3545; border-radius: 50%; margin-left: 10px;"></div>
                      <h3 style="color: #333; margin: 0; font-size: 18px; font-weight: 600;">طلب إعادة تعيين كلمة المرور</h3>
                    </div>
                    <div style="background-color: white; border-radius: 8px; padding: 20px; border: 1px solid #e0e0e0;">
                      <p style="color: #495057; margin: 0 0 15px 0; line-height: 1.7; font-size: 15px; text-align: justify;">
                        إذا كنت قد طلبت إعادة تعيين كلمة المرور، يرجى النقر على الزر أدناه لإنشاء كلمة مرور جديدة.
                      </p>
                      <p style="color: #6c757d; margin: 0; line-height: 1.7; font-size: 14px; text-align: justify;">
                        <strong>ملاحظة:</strong> هذا الرابط صالح لمدة ساعة واحدة فقط. إذا لم تقم بإعادة تعيين كلمة المرور خلال هذه المدة، ستحتاج إلى طلب رابط جديد.
                      </p>
                    </div>
                  </div>
                  
                  <!-- معلومات إضافية -->
                  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 15px; margin-bottom: 25px; text-align: center;">
                    <p style="color: #6c757d; margin: 0; font-size: 14px;">
                      <span style="font-weight: 600;">تاريخ الطلب:</span> ${currentDate}
                    </p>
                  </div>
                  
                  <!-- زر إعادة تعيين كلمة المرور -->
                  <div style="text-align: center; margin-bottom: 25px;">
                    <a href="${resetLink}" style="background: linear-gradient(135deg, #dc3545, #dc3545dd); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3); transition: all 0.3s ease;">
                      🔑 إعادة تعيين كلمة المرور
                    </a>
                  </div>
                  
                  <!-- تحذير أمني -->
                  <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                    <div style="display: flex; align-items: center; margin-bottom: 10px;">
                      <span style="font-size: 18px; margin-left: 10px;">⚠️</span>
                      <h4 style="color: #856404; margin: 0; font-size: 16px; font-weight: 600;">تنبيه أمني</h4>
                    </div>
                    <ul style="color: #856404; margin: 0; padding-right: 20px; font-size: 14px; line-height: 1.6;">
                      <li>لا تشارك هذا الرابط مع أي شخص آخر</li>
                      <li>تأكد من أنك على الموقع الصحيح قبل إدخال كلمة المرور الجديدة</li>
                      <li>إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذا الإيميل</li>
                    </ul>
                  </div>
                  
                  <!-- معلومات النظام -->
                  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; text-align: center; border-top: 3px solid #dc3545;">
                    <p style="color: #6c757d; margin: 0 0 10px 0; font-size: 13px; line-height: 1.5;">
                      هذا البريد الإلكتروني تم إرساله تلقائياً من نظام MediServe
                    </p>
                    <p style="color: #6c757d; margin: 0; font-size: 13px; line-height: 1.5;">
                      إذا واجهت أي مشكلة، يرجى التواصل مع فريق الدعم التقني
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
          `
        };
        transporter.sendMail(mailOptions, (error) => {
          if (error) return res.status(500).json({ message: 'Failed to send email' });
          res.json({ message: 'Password reset link sent to your email.' });
        });
      }
    );
  });
};

module.exports = forgotPasswordController; 
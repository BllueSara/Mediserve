const db = require("../db");
function makeBilingualLog(en, ar) { return { en, ar }; }

async function logActivity(userId, userName, action, details) {
  try {
    const [rows] = await db.promise().query('SELECT cancel_logs FROM user_permissions WHERE user_id = ?', [userId]);
    if (rows.length && rows[0].cancel_logs) {
      console.log(`🚫 Logging canceled for user ${userId} due to cancel_logs permission.`);
      return;
    }
  } catch (err) {
    console.error('❌ Error checking cancel_logs permission:', err);
  }
  if (typeof action === 'object') action = JSON.stringify(action);
  if (typeof details === 'object') details = JSON.stringify(details);
  const sql = `INSERT INTO Activity_Logs (user_id, user_name, action, details) VALUES (?, ?, ?, ?)`;
  db.query(sql, [userId, userName, action, details], (err) => {
    if (err) console.error('❌ Error logging activity:', err);
  });
}

async function updateUserController(req, res) {
  const userId = req.params.id;
  const { name, email, department, employee_id } = req.body;

  // التحقق من البيانات المطلوبة
  if (!name || !email) {
    return res.status(400).json({ message: 'Name and email are required' });
  }

  // التحقق من صحة البريد الإلكتروني
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  try {
    // جلب الاسم القديم للمستخدم قبل التحديث
    const [oldUserData] = await db.promise().query(
      'SELECT name FROM users WHERE id = ?',
      [userId]
    );
    
    const oldName = oldUserData.length > 0 ? oldUserData[0].name : null;
    console.log(`🔍 الاسم القديم للمستخدم: ${oldName}`);

    // التحقق من عدم وجود بريد إلكتروني مكرر (باستثناء المستخدم الحالي)
    const [existingUsers] = await db.promise().query(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email, userId]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    // التحقق من عدم وجود رقم موظف مكرر (إذا كان موجود)
    if (employee_id) {
      const [existingEmployee] = await db.promise().query(
        'SELECT id FROM users WHERE employee_id = ? AND id != ?',
        [employee_id, userId]
      );

      if (existingEmployee.length > 0) {
        return res.status(409).json({ message: 'Employee ID already exists' });
      }
    }

    // تحديث بيانات المستخدم
    const updateQuery = `
      UPDATE users 
      SET name = ?, email = ?, department = ?, employee_id = ?
      WHERE id = ?
    `;
    
    await db.promise().query(updateQuery, [
      name,
      email,
      department || null,
      employee_id || null,
      userId
    ]);

        // التحقق من وجود المستخدم في جدول المهندسين وتحديث الاسم هناك أيضاً
    try {
      if (oldName) {
        console.log(`🔍 البحث عن المهندس بالاسم: ${oldName}`);
        
        // البحث عن المهندس بالاسم القديم في جدول engineers
        const [engineerCheck] = await db.promise().query(
          'SELECT id, name FROM engineers WHERE name LIKE ?',
          [`%${oldName}%`]
        );

        console.log(`🔍 تم العثور على ${engineerCheck.length} مهندس`);

        if (engineerCheck.length > 0) {
          const engineer = engineerCheck[0];
          console.log(`🔍 المهندس الحالي: ${engineer.name}`);
          
          // تحليل الاسم الحالي في جدول المهندسين
          const currentNameParts = engineer.name.split('|');
          let englishName = currentNameParts[0] || '';
          let arabicName = currentNameParts[1] || '';
          
          console.log(`🔍 الاسم الإنجليزي الحالي: "${englishName}"`);
          console.log(`🔍 الاسم العربي الحالي: "${arabicName}"`);
          
          // تحليل الاسم الجديد
          const newNameParts = name.split('|');
          let newEnglishName = newNameParts[0] || '';
          let newArabicName = newNameParts[1] || '';
          
          console.log(`🔍 الاسم الإنجليزي الجديد: "${newEnglishName}"`);
          console.log(`🔍 الاسم العربي الجديد: "${newArabicName}"`);
          
          // تحديث الاسم المناسب بناءً على نوع الاسم القديم
          let updatedName = engineer.name;
          
          if (oldName === englishName) {
            // الاسم القديم هو الاسم الإنجليزي، نحدث الاسم الإنجليزي فقط
            updatedName = `${newEnglishName || newName}|${arabicName}`;
            console.log(`✅ تم تحديث الاسم الإنجليزي في جدول engineers من "${englishName}" إلى "${newEnglishName || newName}"`);
          } else if (oldName === arabicName) {
            // الاسم القديم هو الاسم العربي، نحدث الاسم العربي فقط
            updatedName = `${englishName}|${newArabicName || newName}`;
            console.log(`✅ تم تحديث الاسم العربي في جدول engineers من "${arabicName}" إلى "${newArabicName || newName}"`);
          } else {
            // الاسم القديم متطابق مع الاسم الكامل، نحدث كلا الاسمين
            updatedName = name;
            console.log(`✅ تم تحديث الاسمين في جدول engineers من "${engineer.name}" إلى "${name}"`);
          }
          
          console.log(`🔍 الاسم المحدث: ${updatedName}`);
          
          // تحديث الاسم في جدول engineers
          await db.promise().query(
            'UPDATE engineers SET name = ? WHERE id = ?',
            [updatedName, engineer.id]
          );
          
          console.log(`✅ تم تحديث المهندس بنجاح`);
        } else {
          console.log(`⚠️ لم يتم العثور على مهندس بالاسم: ${oldName}`);
        }
      } else {
        console.log(`⚠️ لا يوجد اسم قديم للمستخدم`);
      }
    } catch (engineerErr) {
      console.error('⚠️ خطأ في تحديث جدول المهندسين:', engineerErr);
      // لا نوقف العملية إذا فشل تحديث جدول المهندسين
    }

    // تسجيل النشاط
    await logActivity(
      userId, 
      'System', 
      makeBilingualLog('Update User Data', 'تحديث بيانات المستخدم'), 
      makeBilingualLog(
        `User data updated for user ${userId}.`, 
        `تم تحديث بيانات المستخدم ${userId}.`
      )
    );

    res.json({ 
      message: 'User updated successfully',
      user: { id: userId, name, email, department, employee_id }
    });

  } catch (err) {
    console.error('❌ Error updating user:', err);
    return res.status(500).json({ message: 'Failed to update user' });
  }
}

module.exports = updateUserController; 
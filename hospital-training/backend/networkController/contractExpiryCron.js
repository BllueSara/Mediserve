const db = require("../db");
const { createNotificationWithEmail } = require("./notificationUtils");
const cron = require('node-cron');

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
  await db.promise().query(sql, [userId, userName, action, details]);
}

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

          await logActivity(entry.user_id, userName, actionBilingual, detailsBilingual);

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
const db = require('../db');
const { createNotificationWithEmail } = require('../utils/notificationUtils');
const cron = require('node-cron');

cron.schedule('1 9 * * *', async () => {
  console.log('🔍 Checking for due maintenance...');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  try {
    const [rows] = await db.promise().query(`
      SELECT 
        rm.id, rm.device_id, rm.device_name, rm.device_type, rm.technical_engineer_id,
        rm.last_maintenance_date, rm.frequency
      FROM Regular_Maintenance rm
      WHERE rm.status = 'Open' AND rm.frequency IS NOT NULL
    `);
    for (const row of rows) {
      try {
        const rawDate = row.last_maintenance_date;
        const freq = parseInt(row.frequency);
        if (!rawDate || isNaN(new Date(rawDate)) || isNaN(freq)) {
          console.warn(`⚠️ Skipping invalid entry for device ID ${row.device_id}`);
          continue;
        }
        const dueDate = new Date(rawDate);
        dueDate.setMonth(dueDate.getMonth() + freq);
        dueDate.setHours(0, 0, 0, 0);
        if (dueDate.getTime() === today.getTime()) {
          const [engineerRes] = await db.promise().query(
            `SELECT name FROM Engineers WHERE id = ?`, [row.technical_engineer_id]
          );
          const engineerName = engineerRes[0]?.name;
          if (!engineerName) {
            console.warn(`⚠️ Engineer not found for ID ${row.technical_engineer_id}`);
            continue;
          }
          const [userRes] = await db.promise().query(
            `SELECT id FROM Users WHERE name = ?`, [engineerName]
          );
          const techUserId = userRes[0]?.id;
          if (!techUserId) {
            console.warn(`⚠️ No matching user for engineer name ${engineerName}`);
            continue;
          }
          const message = `["🔔 Maintenance is due today for device: ${row.device_name} (${row.device_type})|🔔 الصيانة مستحقة اليوم للجهاز: ${row.device_name} (${row.device_type})"]`;
          const [existingNotifs] = await db.promise().query(
            `SELECT id FROM Notifications 
            WHERE user_id = ? AND message = ? AND DATE(created_at) = CURDATE()`,
            [techUserId, message]
          );
          if (existingNotifs.length > 0) {
            console.log(`⏭️ Skipping duplicate reminder for ${engineerName} & device ${row.device_name}`);
            continue;
          }
          await createNotificationWithEmail(techUserId, message, 'maintenance-reminder', 'ar');
          console.log(`✅ Notification sent to ${engineerName} for ${row.device_name}`);
        }
      } catch (innerErr) {
        console.error(`❌ Error processing row for device ID ${row.device_id}:`, innerErr.message);
      }
    }
  } catch (error) {
    console.error("❌ Error in maintenance reminder cron:", error);
  }
}); 
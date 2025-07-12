const db = require('../db');
const { createNotificationWithEmail } = require('../utils/notificationUtils');
const cron = require('node-cron');

cron.schedule('2 9 * * *', async () => {
  console.log('🔍 Checking external tickets older than 3 days...');
  try {
    const [tickets] = await db.promise().query(`
      SELECT et.id, et.ticket_number, et.status, et.report_datetime, et.user_id, u.name AS user_name
      FROM External_Tickets et
      LEFT JOIN Users u ON et.user_id = u.id
      WHERE et.status = 'Open'
        AND DATEDIFF(CURDATE(), DATE(et.report_datetime)) >= 3
    `);
    for (const ticket of tickets) {
      const notifMessage = `["🚨 Ticket ${ticket.ticket_number} has been open for 3+ days. Please follow up.|🚨 التذكرة ${ticket.ticket_number} مفتوحة منذ 3+ أيام. يرجى المتابعة."]`;
      const [existing] = await db.promise().query(`
        SELECT id FROM Notifications
        WHERE user_id = ? AND message = ? AND DATE(created_at) = CURDATE()
      `, [ticket.user_id, notifMessage]);
      if (existing.length > 0) {
        console.log(`⏭️ Notification already sent today for ticket ${ticket.ticket_number}`);
        continue;
      }
      await createNotificationWithEmail(ticket.user_id, notifMessage, 'external-ticket-followup', 'ar');
      console.log(`✅ Reminder sent to ${ticket.user_name} for ticket ${ticket.ticket_number}`);
    }
  } catch (err) {
    console.error("❌ Error in external ticket reminder cron:", err);
  }
}); 
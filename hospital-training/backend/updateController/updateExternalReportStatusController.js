const db = require('../db');
const { createNotificationWithEmail } = require('../utils/notificationUtils');

exports.updateExternalReportStatus = async (req, res) => {
  const reportId = req.params.id;
  const { status } = req.body;
  const userId = req.user.id;

  try {
    const userNameRes = await queryAsync(`SELECT name FROM Users WHERE id = ?`, [userId]);
    const userName = userNameRes[0]?.name || "Unknown";

    // 1. Get the report
    const reportRes = await queryAsync("SELECT * FROM Maintenance_Reports WHERE id = ?", [reportId]);
    if (!reportRes[0]) return res.status(404).json({ error: "Report not found" });
    const report = reportRes[0];

    // 2. Get device info
    const deviceRes = await queryAsync(`
      SELECT device_name, device_type 
      FROM Maintenance_Devices 
      WHERE id = ?
    `, [report.device_id]);
    const deviceName = deviceRes[0]?.device_name || "Unknown Device";
    const deviceType = deviceRes[0]?.device_type || "Unknown Type";
    const readableDevice = `${deviceName} (${deviceType})`;

    // 3. Get engineer from External_Maintenance
    const extMaintRes = await queryAsync(`
      SELECT technical_engineer_id 
      FROM External_Maintenance 
      WHERE id = ?
    `, [reportId]);

    const technicalEngineerId = extMaintRes[0]?.technical_engineer_id || null;
    let engineerName = null;
    let engineerUserId = null;

    if (technicalEngineerId) {
      const engineerRes = await queryAsync(`SELECT name FROM Engineers WHERE id = ?`, [technicalEngineerId]);
      engineerName = engineerRes[0]?.name || null;

      if (engineerName) {
        const techUserRes = await queryAsync(`SELECT id FROM Users WHERE name = ?`, [engineerName]);
        engineerUserId = techUserRes[0]?.id || null;
      }
    }

    // 4. Update main report
    await queryAsync("UPDATE Maintenance_Reports SET status = ? WHERE id = ?", [status, reportId]);

    // 5. Update external ticket if available
    if (report.ticket_id) {
      await queryAsync("UPDATE External_Tickets SET status = ? WHERE id = ?", [status, report.ticket_id]);
      await queryAsync("UPDATE Maintenance_Reports SET status = ? WHERE ticket_id = ?", [status, report.ticket_id]);
    }

    // 6. Update External_Maintenance if exists
    if (extMaintRes[0]) {
      await queryAsync("UPDATE External_Maintenance SET status = ? WHERE id = ?", [status, reportId]);
    }

    // 7. Notify user who did the update
    await createNotificationWithEmail(userId,
      `["You updated external report status to '${status}' for ${readableDevice}|تم تحديث حالة التقرير الخارجي إلى '${status}' للجهاز ${readableDevice}"]`,
      'external-status-update',
      'ar' // Pass the language preference to the notification creation function
    );

    // 8. Notify engineer
    if (engineerUserId && engineerUserId !== userId) {
      await createNotificationWithEmail(engineerUserId,
        `["External report status updated to '${status}' for ${readableDevice}|تم تحديث حالة التقرير الخارجي إلى '${status}' للجهاز ${readableDevice}"]`,
        'external-status-update',
        'ar' // Pass the language preference to the notification creation function
      );
    }

    // 9. Log the action
    await queryAsync(`
      INSERT INTO Activity_Logs (user_id, user_name, action, details)
      VALUES (?, ?, ?, ?)
    `, [
      userId,
      userName,
      JSON.stringify(makeBilingualLog('Updated External Report Status', 'تحديث حالة تقرير خارجي')),
      JSON.stringify(makeBilingualLog(
        `Updated external report #${reportId} to '${status}' | Device: ${readableDevice}`,
        `تم تحديث حالة التقرير الخارجي رقم ${reportId} إلى '${status}' للجهاز ${readableDevice}`
      ))
    ]);

    res.json({ message: "✅ External report, ticket, and related entries updated with notifications." });

  } catch (err) {
    console.error("❌ Failed to update external report status:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Helper functions
async function queryAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}


function makeBilingualLog(english, arabic) {
  return { en: english, ar: arabic };
} 
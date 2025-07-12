const db = require('../db');
const { createNotificationWithEmail } = require('../utils/notificationUtils');

async function queryAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

async function getUserNameById(id) {
  const [rows] = await queryAsync(`SELECT name FROM Users WHERE id = ?`, [id]);
  return rows[0]?.name || "Unknown";
}

function makeBilingualLog(english, arabic) {
  return {
    en: english,
    ar: arabic
  };
}

async function updateReportStatus(req, res) {
  const reportId = req.params.id;
  const { status } = req.body;
  const userId = req.user.id;

  try {
    const userNameRes = await queryAsync(`SELECT name FROM Users WHERE id = ?`, [userId]);
    const userName = userNameRes[0]?.name || "Unknown";

    // Get the report
    const report = await queryAsync("SELECT * FROM Maintenance_Reports WHERE id = ?", [reportId]);
    if (!report[0]) return res.status(404).json({ error: "Report not found" });
    const reportData = report[0];

    // Get device info (name + type)
    const deviceRes = await queryAsync(`
      SELECT device_name, device_type 
      FROM Maintenance_Devices 
      WHERE id = ?
    `, [reportData.device_id]);

    const deviceName = deviceRes[0]?.device_name || "Unknown Device";
    const deviceType = deviceRes[0]?.device_type || "Unknown Type";
    const readableDevice = `${deviceName} (${deviceType})`;

    // Get engineer from Regular_Maintenance
    const maintenanceRes = await queryAsync(`
      SELECT technical_engineer_id 
      FROM Regular_Maintenance 
      WHERE device_id = ?
      ORDER BY last_maintenance_date DESC
      LIMIT 1
    `, [reportData.device_id]);

    const technicalEngineerId = maintenanceRes[0]?.technical_engineer_id;

    // Get engineer name (if available)
    let engineerName = null;
    let engineerUserId = null;

    if (technicalEngineerId) {
      const engineerRes = await queryAsync(`SELECT name FROM Engineers WHERE id = ?`, [technicalEngineerId]);
      engineerName = engineerRes[0]?.name || null;

      if (engineerName) {
        const userRes = await queryAsync(`SELECT id FROM Users WHERE name = ?`, [engineerName]);
        engineerUserId = userRes[0]?.id || null;
      }
    }

    // === Update operations ===

    await queryAsync("UPDATE Maintenance_Reports SET status = ? WHERE id = ?", [status, reportId]);
    await queryAsync("UPDATE Internal_Tickets SET status = ? WHERE id = ?", [status, reportData.ticket_id]);
    await queryAsync("UPDATE Maintenance_Reports SET status = ? WHERE ticket_id = ?", [status, reportData.ticket_id]);

    if (reportData.maintenance_type === "Regular") {
      await queryAsync(`
        UPDATE Regular_Maintenance 
        SET status = ? 
        WHERE device_id = ?
        ORDER BY last_maintenance_date DESC
        LIMIT 1
      `, [status, reportData.device_id]);
    }

    // === Notifications ===

    await createNotificationWithEmail(userId,
      `["You updated report status to '${status}' for ${readableDevice}|تم تحديث حالة التقرير إلى '${status}' للجهاز ${readableDevice}"]`,
      'status-update',
      'ar' // Pass the language preference to the notification creation function
    );

    if (engineerUserId && engineerUserId !== userId) {
      await createNotificationWithEmail(engineerUserId,
        `["Report status updated to '${status}' for ${readableDevice}|تم تحديث حالة التقرير إلى '${status}' للجهاز ${readableDevice}"]`,
        'status-update',
        'ar' // Pass the language preference to the notification creation function
      );
    }

    // === Logs ===

await queryAsync(`
  INSERT INTO Activity_Logs (user_id, user_name, action, details)
  VALUES (?, ?, ?, ?)
`, [
  userId,
  userName,
  JSON.stringify(makeBilingualLog('Updated Report Status', 'تحديث حالة التقرير')),
  JSON.stringify(makeBilingualLog(
    `Updated report status to '${status}' for ${readableDevice} (Report ID: ${reportId})`,
    `تم تحديث حالة التقرير إلى '${status}' للجهاز ${readableDevice} (رقم التقرير: ${reportId})`
  ))
]);

    res.json({ message: "✅ Status updated and notifications sent." });

  } catch (err) {
    console.error("❌ Failed to update status:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  updateReportStatus
}; 
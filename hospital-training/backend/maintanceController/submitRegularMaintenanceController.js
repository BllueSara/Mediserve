const db = require('../db');
const { createNotificationWithEmail } = require('../utils/notificationUtils');
const {
  removeLangTag,
  cleanTag,
  makeBilingualLog,
  formatNumber,
  queryAsync,
  getUserById,
  getUserNameById,
  generateNumber
} = require('./helpers');

<<<<<<< HEAD
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

=======
>>>>>>> dfa1ff18f501a113e159d8d77f54553e04171c45
const submitRegularMaintenanceController = async (req, res) => {
  const userId = req.user.id;
  const {
    "maintenance-date": date,
    frequency,
    "device-type": rawDeviceTypeInput,
    section: rawSection,
    "device-spec": deviceSpec,
    details = [],
    notes = "",
    problem_status: rawProblemStatus = "",
    technical_engineer_id = null
  } = req.body;

  const section = removeLangTag(rawSection);
  const rawDeviceType = removeLangTag(rawDeviceTypeInput);

  const problem_status = Array.isArray(rawProblemStatus)
    ? rawProblemStatus.map(removeLangTag)
    : removeLangTag(rawProblemStatus);

  let formattedProblemStatus = "No issues reported";
  if (Array.isArray(problem_status)) {
    formattedProblemStatus = problem_status.length ? problem_status.join(", ") : formattedProblemStatus;
  } else if (typeof problem_status === "string" && problem_status.trim() !== "") {
    formattedProblemStatus = problem_status;
  }

  const adminUser = await getUserById(userId);
  const userName = await getUserNameById(userId);

  let engineerName = 'N/A';
  let cleanedName = 'N/A';
  let finalEngineerId = null;
  if (technical_engineer_id && !isNaN(technical_engineer_id)) {
    const parsed = parseInt(technical_engineer_id);
    if (Number.isInteger(parsed)) {
      finalEngineerId = parsed;
      const techEngineerRes = await queryAsync(`SELECT name FROM Engineers WHERE id = ?`, [finalEngineerId]);
      engineerName = techEngineerRes[0]?.name || 'N/A';
      cleanedName = cleanTag(engineerName);
    }
  }

  const isAllDevices = (rawDeviceType && rawDeviceType.toLowerCase() === "all-devices");

  try {
    const departmentRes = await queryAsync("SELECT id FROM Departments WHERE name = ?", [section]);
    const departmentId = departmentRes[0]?.id || null;
    const existingOpenMaintenance = await queryAsync(`
      SELECT id FROM Regular_Maintenance
      WHERE device_id = ? AND status = 'Open'
    `, [deviceSpec]);
    if (existingOpenMaintenance.length > 0) {
      return res.status(400).json({
        error: "❌ This device already has an active regular maintenance request."
      });
    }
    const deviceRes = await queryAsync(`
      SELECT md.*, COALESCE(pc.Computer_Name, pr.Printer_Name, sc.Scanner_Name, md.device_name) AS device_name,
             COALESCE(c.cpu_name, '') AS cpu_name,
             COALESCE(r.ram_type, '') AS ram_type,
             COALESCE(rs.ram_size, '') AS ram_size,
             COALESCE(o.os_name, '') AS os_name,
             COALESCE(g.generation_number, '') AS generation_number,
             COALESCE(pm.model_name, prm.model_name, scm.model_name, '') AS model_name,
             COALESCE(hdt.drive_type, '') AS drive_type,
             COALESCE(pc.Mac_Address, '') AS mac_address,
             COALESCE(pc.Ip_Address, '') AS ip_address,
             COALESCE(pt.printer_type, '') AS printer_type,
             COALESCE(it.ink_type, '') AS ink_type,
             COALESCE(iser.serial_number, '') AS ink_serial_number,
             COALESCE(st.scanner_type, '') AS scanner_type,
             d.name AS department_name
      FROM Maintenance_Devices md
      LEFT JOIN PC_info pc ON md.device_type = 'PC' AND md.serial_number = pc.Serial_Number AND md.governmental_number = pc.Governmental_Number
      LEFT JOIN Printer_info pr ON md.device_type = 'Printer' AND md.serial_number = pr.Serial_Number AND md.governmental_number = pr.Governmental_Number
      LEFT JOIN Scanner_info sc ON md.device_type = 'Scanner' AND md.serial_number = sc.Serial_Number AND md.governmental_number = sc.Governmental_Number
      LEFT JOIN CPU_Types c ON pc.Processor_id = c.id
      LEFT JOIN RAM_Types r ON pc.RAM_id = r.id
      LEFT JOIN RAM_Sizes rs ON pc.RamSize_id = rs.id
      LEFT JOIN OS_Types o ON pc.OS_id = o.id
      LEFT JOIN Processor_Generations g ON pc.Generation_id = g.id
      LEFT JOIN PC_Model pm ON pc.Model_id = pm.id
      LEFT JOIN Printer_Model prm ON pr.Model_id = prm.id
      LEFT JOIN Scanner_Model scm ON sc.Model_id = scm.id
      LEFT JOIN Printer_Types pt ON pr.PrinterType_id = pt.id
      LEFT JOIN Ink_Types it ON pr.InkType_id = it.id
      LEFT JOIN Ink_Serials iser ON pr.InkSerial_id = iser.id
      LEFT JOIN Scanner_Types st ON sc.ScannerType_id = st.id
      LEFT JOIN Departments d ON md.department_id = d.id
      LEFT JOIN Hard_Drive_Types hdt ON pc.Drive_id = hdt.id
      WHERE md.id = ?
    `, [deviceSpec]);
    const deviceInfo = deviceRes[0];
    if (!deviceInfo) return res.status(404).json({ error: "Device not found" });
    const displayDevice = isAllDevices
      ? 'ALL DEVICES'
      : `${deviceInfo.device_name} (${deviceInfo.device_type})`;
    const checklist = JSON.stringify(details);
    await queryAsync(`
      INSERT INTO Regular_Maintenance (
        device_id, device_type, last_maintenance_date, frequency, checklist, notes,
        serial_number, governmental_number, device_name, department_name,
        cpu_name, ram_type, ram_size, os_name, generation_number, model_name, drive_type, status,
        problem_status, technical_engineer_id, mac_address,ip_address, printer_type, ink_type, ink_serial_number,
        scanner_type, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?, ?, ?, ?, ?)
    `, [
      deviceSpec,
      rawDeviceType || deviceInfo.device_type,
      date,
      frequency,
      checklist,
      notes,
      deviceInfo.serial_number,
      deviceInfo.governmental_number,
      deviceInfo.device_name,
      deviceInfo.department_name,
      deviceInfo.cpu_name,
      deviceInfo.ram_type,
      deviceInfo.ram_size || '',
      deviceInfo.os_name,
      deviceInfo.generation_number,
      deviceInfo.model_name,
      deviceInfo.drive_type,
      "Open",
      problem_status || "",
      finalEngineerId,
      deviceInfo.mac_address,
      deviceInfo.ip_address,
      deviceInfo.printer_type,
      deviceInfo.ink_type,
      deviceInfo.ink_serial_number,
      deviceInfo.scanner_type,
      userId
    ]);
    await createNotificationWithEmail(userId,
      `["Regular maintenance for ${displayDevice} has been created by ${userName} and assigned to engineer ${cleanedName || 'N/A'} [${formattedProblemStatus}]|تم إنشاء صيانة دورية للجهاز ${displayDevice} بواسطة ${userName} وتعيينها للمهندس ${cleanedName || 'غير محدد'} [${formattedProblemStatus}]"]`,
      'regular-maintenance',
      'ar'
    );
    const nextTicketId = await generateNumber("INT");
    const ticketNumber = formatNumber("TIC", nextTicketId);
    const ticketRes = await queryAsync(`
      INSERT INTO Internal_Tickets (
        ticket_number, priority, department_id, issue_description, assigned_to, mac_address,ip_address, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?,?)
    `, [
      ticketNumber,
      "Medium",
      departmentId,
      problem_status || "Regular Maintenance",
      finalEngineerId,
      deviceInfo.mac_address,
      deviceInfo.ip_address,
      userId
    ]);
    const ticketId = ticketRes.insertId;
    const reportNumberTicket = formatNumber("REP", nextTicketId, "TICKET");
    await queryAsync(`
      INSERT INTO Maintenance_Reports (
        report_number, ticket_id, device_id,
        issue_summary, full_description, status, maintenance_type, mac_address,ip_address, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,?)
    `, [
      reportNumberTicket,
      ticketId,
      deviceSpec,
      "Ticket Created",
      notes,
      "Open",
      "Regular",
      deviceInfo.mac_address,
      deviceInfo.ip_address,
      userId
    ]);
    await createNotificationWithEmail(userId,
      `["Ticket ${ticketNumber} has been opened by ${userName} and assigned to engineer ${cleanedName || 'N/A'} [${formattedProblemStatus}]|تم فتح التذكرة ${ticketNumber} بواسطة ${userName} وتعيينها للمهندس ${cleanedName || 'غير محدد'} [${formattedProblemStatus}]"]`,
      'internal-ticket-report',
      'ar'
    );
    const reportNumberMain = formatNumber("REP", nextTicketId, "MAIN");
    await queryAsync(`
      INSERT INTO Maintenance_Reports (
        report_number, ticket_id, device_id,
        issue_summary, full_description, status, maintenance_type, mac_address,ip_address, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,?)
    `, [
      reportNumberMain,
      ticketId,
      deviceSpec,
      checklist,
      notes || "",
      "Open",
      "Regular",
      deviceInfo.mac_address,
      deviceInfo.ip_address,
      userId
    ]);
    await createNotificationWithEmail(userId,
      `["Main report ${reportNumberMain} for device  (${displayDevice}) has been submitted by ${userName} and handled by engineer ${cleanedName || 'N/A'} |تم تقديم التقرير الرئيسي ${reportNumberMain} للجهاز  (${displayDevice}) بواسطة ${userName} وتنفيذه بواسطة المهندس ${cleanedName || 'غير محدد'}"]`,
      'regular-report',
      'ar'
    );
    if (technical_engineer_id && cleanedName !== 'N/A') {
      const techUserRes = await queryAsync(`SELECT id FROM Users WHERE name = ?`, [cleanedName]);
      const techUserId = techUserRes[0]?.id;
      if (techUserId) {
        await createNotificationWithEmail(techUserId,
          `["You have been assigned a new Regular maintenance task for ${displayDevice} by ${userName}|تم تعيين مهمة صيانة دورية جديدة لك للجهاز ${displayDevice} بواسطة ${userName}"]`,
          'technical-notification',
          'ar'
        );
      }
    }
<<<<<<< HEAD
    await logActivity(userId, userName, JSON.stringify(makeBilingualLog('Submitted Regular Maintenance', 'إرسال صيانة دورية')), JSON.stringify(makeBilingualLog(
      `Submitted regular maintenance for a ${deviceInfo.device_type} | Device: ${deviceInfo.device_name} | Serial: ${deviceInfo.serial_number} | Governmental No.: ${deviceInfo.governmental_number}`,
      `تم إرسال صيانة دورية لجهاز ${deviceInfo.device_type} - اسم الجهاز: ${deviceInfo.device_name} - سيريال: ${deviceInfo.serial_number} - الرقم الحكومي: ${deviceInfo.governmental_number}`
    )));
=======
    await queryAsync(`
      INSERT INTO Activity_Logs (user_id, user_name, action, details)
      VALUES (?, ?, ?, ?)
    `, [
      userId,
      userName,
      JSON.stringify(makeBilingualLog('Submitted Regular Maintenance', 'إرسال صيانة دورية')),
      JSON.stringify(makeBilingualLog(
        `Submitted regular maintenance for a ${deviceInfo.device_type} | Device: ${deviceInfo.device_name} | Serial: ${deviceInfo.serial_number} | Governmental No.: ${deviceInfo.governmental_number}`,
        `تم إرسال صيانة دورية لجهاز ${deviceInfo.device_type} - اسم الجهاز: ${deviceInfo.device_name} - سيريال: ${deviceInfo.serial_number} - الرقم الحكومي: ${deviceInfo.governmental_number}`
      ))
    ]);
>>>>>>> dfa1ff18f501a113e159d8d77f54553e04171c45
    res.json({ message: "✅ Regular maintenance, ticket, and reports created successfully." });
  } catch (error) {
    console.error("❌ Error in regular maintenance submission:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = submitRegularMaintenanceController; 
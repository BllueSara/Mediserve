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

const submitGeneralMaintenanceController = async (req, res) => {
  const userId = req.user.id;
  const {
    "maintenance-date": date,
    DeviceType: rawDeviceType,
    DeviceID: deviceSpec,
    Section: rawSection,
    Floor: floor,
    Extension: extension,
    ProblemStatus: rawProblemStatus,
    InitialDiagnosis: initialDiagnosis,
    FinalDiagnosis: finalDiagnosis,
    Technical: technical,
    CustomerName: customerName,
    IDNumber: idNumber,
    Notes: notes = ""
  } = req.body;

  const section = removeLangTag(rawSection);
  const deviceType = removeLangTag(rawDeviceType);
  const problemStatus = Array.isArray(rawProblemStatus)
    ? rawProblemStatus.map(removeLangTag)
    : removeLangTag(rawProblemStatus);
  let formattedProblemStatus = "No issues reported";
  if (Array.isArray(problemStatus)) {
    formattedProblemStatus = problemStatus.length ? problemStatus.join(", ") : formattedProblemStatus;
  } else if (typeof problemStatus === "string" && problemStatus.trim() !== "") {
    formattedProblemStatus = problemStatus;
  }
  const adminUser = await getUserById(userId);
  const userName = await getUserNameById(userId);
  const cleanedTechnical = cleanTag(technical);
  let engineerName;
  let cleanedName = 'N/A';
  if (adminUser?.role === 'admin' && cleanedTechnical) {
    const techEngineerRes = await queryAsync(`SELECT name FROM Engineers WHERE name = ?`, [cleanedTechnical]);
    engineerName = techEngineerRes[0]?.name || userName;
    cleanedName = cleanTag(engineerName);
  } else {
    engineerName = userName;
    cleanedName = userName;
  }
  const isAllDevices = (rawDeviceType && rawDeviceType.toLowerCase() === "all-devices");
  try {
    const departmentRes = await queryAsync("SELECT id FROM Departments WHERE name = ?", [section]);
    const departmentId = departmentRes[0]?.id || null;
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
    if (!deviceInfo) return res.status(404).json({ error: "❌ Device not found" });
    const displayDevice = isAllDevices
      ? 'ALL DEVICES'
      : `${deviceInfo.device_name} (${deviceInfo.device_type})`;
    const maintenanceDate = date || new Date().toISOString().split("T")[0];
    await queryAsync(`
      INSERT INTO General_Maintenance (
        customer_name, id_number, maintenance_date, issue_type, diagnosis_initial, diagnosis_final, device_id,
        technician_name, floor, extension, problem_status, notes,
        serial_number, governmental_number, device_name, department_name,
        cpu_name, ram_type, os_name, generation_number, model_name,
        drive_type, ram_size, mac_address,ip_address, printer_type, ink_type, ink_serial_number,scanner_type, created_at, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?, ?, ?, ?,CURRENT_TIMESTAMP, ?)
    `, [
      customerName, idNumber, maintenanceDate,
      "General Maintenance", initialDiagnosis || "", finalDiagnosis || "", deviceSpec,
      technical, floor || "", extension || "", problemStatus || "", notes,
      deviceInfo.serial_number, deviceInfo.governmental_number, deviceInfo.device_name, deviceInfo.department_name,
      deviceInfo.cpu_name, deviceInfo.ram_type, deviceInfo.os_name, deviceInfo.generation_number, deviceInfo.model_name,
      deviceInfo.drive_type, deviceInfo.ram_size, deviceInfo.mac_address, deviceInfo.ip_address, deviceInfo.printer_type, deviceInfo.ink_type,
      deviceInfo.ink_serial_number, deviceInfo.scanner_type, userId
    ]);
    const nextTicketId = await generateNumber("INT");
    const ticketNumber = formatNumber("TIC", nextTicketId);
    const ticketRes = await queryAsync(
      "INSERT INTO Internal_Tickets (ticket_number, priority, department_id, issue_description, assigned_to, mac_address,ip_address, user_id) VALUES (?, ?, ?, ?, ?, ?, ?,?)",
      [ticketNumber, "Medium", departmentId, problemStatus, technical, deviceInfo.mac_address, deviceInfo.ip_address, userId]
    );
    const ticketId = ticketRes.insertId;
    const reportNumberMain = formatNumber("REP", nextTicketId, "MAIN");
    await queryAsync(`
      INSERT INTO Maintenance_Reports (report_number, ticket_id, device_id, issue_summary, full_description, status, maintenance_type, mac_address,ip_address, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,?)
    `, [
      reportNumberMain, ticketId, deviceSpec,
      `Selected Issue: ${problemStatus}`,
      `Initial Diagnosis: ${initialDiagnosis}`,
      "Open", "General", deviceInfo.mac_address, deviceInfo.ip_address, userId
    ]);
    const reportNumberTicket = formatNumber("REP", nextTicketId, "TICKET");
    await queryAsync(`
      INSERT INTO Maintenance_Reports (report_number, ticket_id, device_id, issue_summary, full_description, status, maintenance_type, mac_address,ip_address, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,?)
    `, [
      reportNumberTicket, ticketId, deviceSpec,
      "Ticket Created",
      `Initial Diagnosis: ${initialDiagnosis}`,
      "Open", "General", deviceInfo.mac_address, deviceInfo.ip_address, userId
    ]);
    await createNotificationWithEmail(userId,
      `["General maintenance created for  (${displayDevice}) by engineer ${(userName || 'N/A').trim()} and assigned to ${(cleanedTechnical || 'N/A').trim()}|تم إنشاء صيانة عامة للجهاز  (${displayDevice}) بواسطة المهندس ${(userName || 'غير محدد').trim()} وتم تعيينها للمهندس ${(cleanedTechnical || 'غير محدد').trim()} (${formattedProblemStatus})"]`,
      'general-maintenance',
      'ar'
    );
    await createNotificationWithEmail(userId,
      `["Report created ${reportNumberMain} for device  (${displayDevice}) by engineer ${(userName || 'N/A').trim()} and assigned to ${(cleanedTechnical || 'N/A').trim()}|تم إنشاء التقرير ${reportNumberMain} للجهاز  (${displayDevice}) بواسطة المهندس ${(userName || 'غير محدد').trim()} وتم تعيينه للمهندس ${(cleanedTechnical || 'غير محدد').trim()}]`,
      'general-report',
      'ar'
    );
    await createNotificationWithEmail(userId,
      `["Report created (Ticket) ${reportNumberTicket} for device  (${displayDevice}) by engineer ${(userName|| 'N/A').trim()} and assigned to ${(cleanedTechnical || 'N/A').trim()}|تم إنشاء التقرير (تذكرة) ${reportNumberTicket} للجهاز  (${displayDevice}) بواسطة المهندس ${(userName || 'غير محدد').trim()} وتم تعيينه للمهندس ${(cleanedTechnical || 'غير محدد').trim()}]`,
      'internal-ticket-report',
      'ar'
    );
    const techEngineerRes = await queryAsync(`
      SELECT name FROM Engineers 
      WHERE TRIM(REPLACE(REPLACE(name, '[en]', ''), '[ar]', '')) = ?
    `, [cleanedTechnical]);
    const techEngineerName = techEngineerRes[0]?.name;
    if (techEngineerName) {
      const techUserRes = await queryAsync(`
        SELECT id FROM Users 
        WHERE TRIM(REPLACE(REPLACE(name, '[en]', ''), '[ar]', '')) = ?
      `, [cleanedTechnical]);
      const techUserId = techUserRes[0]?.id;
      if (techUserId) {
        await createNotificationWithEmail(techUserId,
          `["You have been assigned a new General maintenance task on ${deviceInfo.device_name} (${displayDevice}) by ${userName}|تم تعيين مهمة صيانة عامة جديدة لك على الجهاز ${deviceInfo.device_name} (${displayDevice}) بواسطة ${userName}"]`,
          'technical-notification',
          'ar'
        );
      } else {
        console.warn("❌ No user found in Users with cleaned name:", cleanedTechnical);
      }
    } else {
      console.warn("❌ No engineer found in Engineers with cleaned name:", cleanedTechnical);
    }
    await queryAsync(`
      INSERT INTO Activity_Logs (user_id, user_name, action, details)
      VALUES (?, ?, ?, ?)
    `, [
      userId,
      userName,
      JSON.stringify(makeBilingualLog('Submitted General Maintenance', 'إرسال صيانة عامة')),
      JSON.stringify(makeBilingualLog(
        `General maintenance for ${deviceInfo.device_type} | Device Name: ${deviceInfo.device_name} | Serial: ${deviceInfo.serial_number} | Gov: ${deviceInfo.governmental_number}`,
        `تم إرسال صيانة عامة لجهاز ${deviceInfo.device_type} - اسم الجهاز: ${deviceInfo.device_name} - سيريال: ${deviceInfo.serial_number} - الرقم الحكومي: ${deviceInfo.governmental_number}`
      ))
    ]);
    res.json({ message: "✅ General maintenance, ticket, and reports created successfully." });
  } catch (error) {
    console.error("❌ Error in general maintenance:", error);
    res.status(500).json({ error: "❌ Internal server error" });
  }
};

module.exports = submitGeneralMaintenanceController; 
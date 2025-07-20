const db = require('../db');
const { createNotificationWithEmail } = require('../utils/notificationUtils');
const {
  removeLangTag,
  makeBilingualLog,
  queryAsync,
  getUserNameById
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
const submitExternalMaintenanceController =  async (req, res) => {
  const userId = req.user.id;
  const {
    ticket_number,
    device_type: rawDeviceType,
    device_specifications,
    section: rawSection,
    maintenance_manager,
    reporter_name: rawReporter,
    initial_diagnosis,
    final_diagnosis
  } = req.body;

  // 🧼 تنظيف اللغة من المدخلات
  const section = removeLangTag(rawSection);
  const reporter_name = removeLangTag(rawReporter);
  const deviceType = removeLangTag(rawDeviceType)?.toLowerCase();

  const userName = await getUserNameById(userId);
  const isAllDevices = (rawDeviceType && rawDeviceType.toLowerCase() === "all-devices");

  try {
    const deviceRes = await queryAsync(`
      SELECT md.*, 
        COALESCE(pc.Computer_Name, pr.Printer_Name, sc.Scanner_Name, md.device_name) AS device_name,
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
    `, [device_specifications]);

    const deviceInfo = deviceRes[0];
    if (!deviceInfo) {
      return res.status(404).json({ error: "❌ لم يتم العثور على معلومات الجهاز" });
    }

    const displayDevice = isAllDevices
      ? 'ALL DEVICES'
      : `${deviceInfo.device_name} (${deviceInfo.device_type})`;

    let deviceType = rawDeviceType?.toLowerCase();
    const allowedTypes = ["pc", "printer", "scanner"];
    const normalizedDeviceType = allowedTypes.includes(deviceType)
      ? deviceType.charAt(0).toUpperCase() + deviceType.slice(1)
      : deviceInfo.device_type;

    const engineerRes = await queryAsync(
      `SELECT id FROM Engineers WHERE name = ?`,
      [reporter_name]
    );
    const technicalEngineerId = engineerRes[0]?.id || null;

    const commonValues = [
      ticket_number, normalizedDeviceType, device_specifications, section,
      maintenance_manager, reporter_name,
      initial_diagnosis, final_diagnosis,
      deviceInfo.serial_number, deviceInfo.governmental_number, deviceInfo.device_name,
      deviceInfo.department_name, deviceInfo.cpu_name, deviceInfo.ram_type, deviceInfo.os_name,
      deviceInfo.generation_number, deviceInfo.model_name, deviceInfo.drive_type, deviceInfo.ram_size,
      deviceInfo.mac_address, deviceInfo.ip_address, deviceInfo.printer_type, deviceInfo.ink_type, deviceInfo.ink_serial_number,
      deviceInfo.scanner_type,
      userId
    ];

    await queryAsync(`
      INSERT INTO External_Maintenance (
        ticket_number, device_type, device_specifications, section,
        maintenance_manager, reporter_name,
        initial_diagnosis, final_diagnosis,
        serial_number, governmental_number, device_name,
        department_name, cpu_name, ram_type, os_name,
        generation_number, model_name, drive_type, ram_size,
        mac_address, ip_address,
        printer_type, ink_type, ink_serial_number, scanner_type, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, commonValues, technicalEngineerId);

    await createNotificationWithEmail(userId, 
      `["External maintenance report saved for (${displayDevice}) problem is ${initial_diagnosis} by engineer ${reporter_name} (created by ${userName})|تم حفظ تقرير صيانة خارجية للجهاز (${displayDevice}) والمشكلة هي ${initial_diagnosis} بواسطة المهندس ${reporter_name} (أنشأه ${userName})"]`,
      'external-maintenance',
      'ar'
    );

    // البحث عن المهندس في جدول users بنفس منطق الجنرال
    const techUserRes = await queryAsync(`
      SELECT id FROM users 
      WHERE TRIM(REPLACE(REPLACE(name, '[en]', ''), '[ar]', '')) = ?
    `, [reporter_name.trim()]);
    const techUserId = techUserRes[0]?.id;

    if (techUserId) {
      await createNotificationWithEmail(techUserId,
        `["New external maintenance task assigned on (${displayDevice}) by ${userName} (you are the assigned engineer)|تم تعيين مهمة صيانة خارجية جديدة على الجهاز (${displayDevice}) بواسطة ${userName} (أنت المهندس المخصص)"]`,
        'external-maintenance-assigned',
        'ar'
      );
    }

<<<<<<< HEAD
    await logActivity(userId, userName, 
=======
    await queryAsync(`
      INSERT INTO Activity_Logs (user_id, user_name, action, details)
      VALUES (?, ?, ?, ?)
    `, [
      userId,
      userName,
>>>>>>> dfa1ff18f501a113e159d8d77f54553e04171c45
      JSON.stringify(makeBilingualLog('Submitted External Maintenance', 'إرسال صيانة خارجية')),
      JSON.stringify(makeBilingualLog(
        `Submitted external maintenance for a ${deviceInfo.device_type} | Device Name: ${deviceInfo.device_name} | Serial: ${deviceInfo.serial_number} | Governmental No.: ${deviceInfo.governmental_number}`,
        `تم إرسال صيانة خارجية لجهاز ${deviceInfo.device_type} - اسم الجهاز: ${deviceInfo.device_name} - سيريال: ${deviceInfo.serial_number} - الرقم الحكومي: ${deviceInfo.governmental_number}`
      ))
<<<<<<< HEAD
    );
=======
    ]);
>>>>>>> dfa1ff18f501a113e159d8d77f54553e04171c45

    res.json({ message: "✅ External maintenance, ticket summary, and notifications saved successfully." });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: "❌ Internal server error" });
  }
};

module.exports = submitExternalMaintenanceController; 
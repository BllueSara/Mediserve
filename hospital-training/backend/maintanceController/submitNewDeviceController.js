const db = require('../db');
const {
  removeLangTag,
  makeBilingualLog,
  queryAsync,
  getUserNameById
} = require('./helpers');

const submitNewDeviceController = async (req, res) => {
  const userId = req.user.id;
  const {
    "device-spec": deviceId,
    "device-type": rawDeviceType,
    section: rawSection
  } = req.body;

  const deviceType = removeLangTag(rawDeviceType);
  const section = removeLangTag(rawSection);

  try {
    const deptRes = await queryAsync("SELECT id FROM Departments WHERE name = ?", [section]);
    const departmentId = deptRes[0]?.id;
    if (!departmentId) return res.status(400).json({ error: "❌ القسم غير موجود" });
    const deviceRes = await queryAsync(`
      SELECT md.*, 
             COALESCE(pc.Computer_Name, pr.Printer_Name, sc.Scanner_Name, md.device_name) AS device_name,
             d.name AS department_name
      FROM Maintenance_Devices md
      LEFT JOIN PC_info pc ON md.serial_number = pc.Serial_Number AND md.governmental_number = pc.Governmental_Number
      LEFT JOIN Printer_info pr ON md.serial_number = pr.Serial_Number AND md.governmental_number = pr.Governmental_Number
      LEFT JOIN Scanner_info sc ON md.serial_number = sc.Serial_Number AND md.governmental_number = sc.Governmental_Number
      LEFT JOIN Departments d ON md.department_id = d.id
      WHERE md.id = ?
    `, [deviceId]);
    const device = deviceRes[0];
    if (!device) return res.status(404).json({ error: "❌ الجهاز غير موجود" });
    const dbType = device.device_type?.toLowerCase();
    const reqType = rawDeviceType?.toLowerCase();
    if (dbType !== reqType) {
      return res.status(400).json({ error: `❌ نوع الجهاز غير متطابق (Expected: ${dbType}, Received: ${deviceType})` });
    }
    if (device.department_id !== departmentId) {
      return res.status(400).json({ error: `❌ القسم المختار لا يطابق قسم الجهاز المحفوظ` });
    }
    const userName = await getUserNameById(userId);
    await queryAsync(`
      INSERT INTO Activity_Logs (user_id, user_name, action, details)
      VALUES (?, ?, ?, ?)
    `, [
      userId,
      userName,
      JSON.stringify(makeBilingualLog('Used Existing Device', 'استخدام جهاز محفوظ')),
      JSON.stringify(makeBilingualLog(
        `Used existing device (ID: ${device.id}) - Type: ${device.device_type} - Department: ${device.department_name}`,
        `تم استخدام جهاز محفوظ مسبقًا (المعرف: ${device.id}) - النوع: ${device.device_type} - القسم: ${device.department_name}`
      ))
    ]);
    res.json({ message: "✅ تم استخدام الجهاز المحفوظ بنجاح." });
  } catch (err) {
    console.error("❌ Error using existing device:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = submitNewDeviceController; 
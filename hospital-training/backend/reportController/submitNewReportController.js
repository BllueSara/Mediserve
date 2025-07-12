const db = require('../db');
const helpers = require('../maintanceController/helpers');
const multer = require('multer');
const path = require('path');

const submitNewReportController = async (req, res) => {
  const userId = req.user.id;
  const {
    report_type,
    device_type,
    priority,
    details,
    device_name,
    serial_number,
    governmental_number,
    department_name,
    cpu_name,
    ram_type,
    ram_size,
    os_name,
    generation_number,
    model_name,
    drive_type,
    mac_address,
    ip_address,
    printer_type,
    ink_type
  } = req.body;

  const attachment = req.files?.attachment?.[0] || null;
  const signature = req.files?.signature?.[0] || null;

  const attachmentName = attachment?.originalname || null;
  const attachmentPath = attachment ? `uploads/${attachment.filename}` : null;
  const signaturePath = signature ? `uploads/${signature.filename}` : null;

  try {
    const isPC = device_type?.toLowerCase() === "pc";
    const insertReportSql = `
      INSERT INTO New_Maintenance_Report (
        report_type, device_type, priority, status,
        attachment_name, attachment_path, signature_path,
        details, device_id, department_id, model_id,
        ${isPC ? "cpu_id, ram_id, os_id, generation_id, drive_id, ram_size, mac_address,ip_address," : ""}
        printer_type, ink_type, 
        device_name, serial_number, governmental_number, user_id
      )
      VALUES (?, ?, ?, 'Open', ?, ?, ?, ?, NULL, ?, ?,
        ${isPC ? "?, ?, ?, ?, ?, ?, ?,?," : ""}
        ?, ?, ?, ?, ?, ?
      )
    `;
    const insertParams = [
      report_type,
      device_type,
      priority || "Medium",
      attachmentName,
      attachmentPath,
      signaturePath,
      details?.trim() || null,
      await helpers.getId("Departments", "name", department_name),
      await helpers.getModelId(device_type, model_name)
    ];
    if (isPC) {
      insertParams.push(
        await helpers.getId("CPU_Types", "cpu_name", cpu_name),
        await helpers.getId("RAM_Types", "ram_type", ram_type),
        await helpers.getId("OS_Types", "os_name", os_name),
        await helpers.getId("Processor_Generations", "generation_number", generation_number),
        await helpers.getId("Hard_Drive_Types", "drive_type", drive_type),
        ram_size || null,
        mac_address || null,
        ip_address || null
      );
    }
    insertParams.push(
      printer_type || null,
      ink_type || null,
      device_name || null,
      serial_number || null,
      governmental_number || null,
      userId
    );
    await db.promise().query(insertReportSql, insertParams);
    await helpers.queryAsync(`
      INSERT INTO Activity_Logs (user_id, user_name, action, details)
      VALUES (?, ?, ?, ?)
    `, [
      userId,
      await helpers.getUserNameById(userId),
      JSON.stringify(helpers.makeBilingualLog('Submitted New Maintenance Report', 'إرسال تقرير صيانة جديد')),
      JSON.stringify(helpers.makeBilingualLog(
        `New report for ${device_type} | Device Name: ${device_name || 'N/A'} | Serial: ${serial_number || 'N/A'} | Department: ${department_name || 'N/A'}`,
        `تقرير صيانة جديد لجهاز ${device_type} - اسم الجهاز: ${device_name || 'غير متوفر'} - السيريال: ${serial_number || 'غير متوفر'} - القسم: ${department_name || 'غير متوفر'}`
      ))
    ]);
    res.json({ message: "✅ Report saved successfully" });
  } catch (err) {
    console.error("❌ Error saving report:", err);
    res.status(500).json({ error: "Server error during insert" });
  }
};

module.exports = submitNewReportController;
const db = require('../db');

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
  db.query(sql, [userId, userName, action, details], (err) => {
    if (err) console.error('❌ Error logging activity:', err);
=======
function logActivity(userId, userName, action, details) {
  const query = `INSERT INTO Activity_Logs (user_id, user_name, action, details) VALUES (?, ?, ?, ?)`;
  db.query(query, [userId, userName, action, details], (err) => {
    if (err) console.error("❌ Failed to log activity:", err);
>>>>>>> dfa1ff18f501a113e159d8d77f54553e04171c45
  });
}

function makeBilingualLog(english, arabic) {
  return { en: english, ar: arabic };
}

const updateDeviceSpecificationController = async (req, res) => {
  const {
    id,
    name,
    Serial_Number,
    Governmental_Number,
    Model,
    Department,
    Device_Type,
    Generation,
    Processor,
    RAM,
    Hard_Drive,
    OS,
    RAM_Size,
    MAC_Address,
    IP_Address,
    Ink_Type,
    Printer_Type,
    Ink_Serial_Number,
    Scanner_Type
  } = req.body;

  if (!id || !name || !Serial_Number || !Governmental_Number) {
    return res.status(400).json({ error: "❌ Missing required fields" });
  }

  const isValidMac = (mac) => /^([0-9A-F]{2}[:-]){5}([0-9A-F]{2})$/i.test(mac);
  const isValidIp = (ip) => /^((25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.|$)){4}$/.test(ip);

  if (IP_Address && !isValidIp(IP_Address)) {
    return res.status(400).json({ error: " عنوان IP غير صالح. مثال صحيح: 192.168.1.1" });
  }

  if (MAC_Address && !isValidMac(MAC_Address)) {
    return res.status(400).json({ error: " عنوان MAC غير صالح. مثال صحيح: 00:1A:2B:3C:4D:5E" });
  }
  try {
    const getId = async (table, column, value) => {
      if (!value) return null;
      const [rows] = await db.promise().query(`SELECT id FROM ${table} WHERE ${column} = ?`, [value]);
      return rows[0]?.id || null;
    };

    const modelId = await getId("Maintance_Device_Model", "model_name", Model);
    const departmentId = await getId("Departments", "name", Department);

    // 1️⃣ تحديث Maintenance_Devices
    await db.promise().query(`
      UPDATE Maintenance_Devices SET
        device_name = ?, serial_number = ?, governmental_number = ?,
        model_id = ?, department_id = ?, device_type = ?
      WHERE id = ?
    `, [
      name.trim(), Serial_Number.trim(), Governmental_Number.trim(),
      modelId, departmentId, Device_Type?.trim(), id
    ]);

    // 2️⃣ تحديث حسب نوع الجهاز
    const type = Device_Type?.toLowerCase().trim();

    if (["pc", "desktop", "laptop", "كمبيوتر", "لابتوب"].includes(type)) {
      const osId = await getId("OS_Types", "os_name", OS);
      const cpuId = await getId("CPU_Types", "cpu_name", Processor);
      const genId = await getId("Processor_Generations", "generation_number", Generation);
      const ramId = await getId("RAM_Types", "ram_type", RAM);
      const driveId = await getId("Hard_Drive_Types", "drive_type", Hard_Drive);
      const ramSizeId = await getId("RAM_Sizes", "ram_size", RAM_Size);
      const pcModelId = await getId("PC_Model", "model_name", Model);

      await db.promise().query(`
        UPDATE PC_info SET
          Computer_Name = ?, Governmental_Number = ?, Department = ?, 
          Model_id = ?, OS_id = ?, Processor_id = ?, Generation_id = ?, RAM_id = ?, 
          RamSize_id = ?, Drive_id = ?, Mac_Address = ?, Ip_Address = ?
        WHERE Serial_Number = ?
      `, [
        name, Governmental_Number, departmentId, pcModelId, osId, cpuId,
        genId, ramId, ramSizeId, driveId, MAC_Address, IP_Address, Serial_Number
      ]);

    } else if (type === "printer") {
      const printerTypeId = await getId("Printer_Types", "printer_type", Printer_Type);
      let inkTypeId = await getId("Ink_Types", "ink_type", Ink_Type);
      let inkSerialId = await getId("Ink_Serials", "serial_number", Ink_Serial_Number);

      // إضافة إذا ما كانوا موجودين
      if (!inkTypeId && Ink_Type) {
        const [res] = await db.promise().query(`INSERT INTO Ink_Types (ink_type) VALUES (?)`, [Ink_Type]);
        inkTypeId = res.insertId;
      }

      if (!inkSerialId && Ink_Serial_Number) {
        const [res] = await db.promise().query(
          `INSERT INTO Ink_Serials (serial_number, ink_type_id) VALUES (?, ?)`,
          [Ink_Serial_Number, inkTypeId]
        );
        inkSerialId = res.insertId;
      }

      const printerModelId = await getId("Printer_Model", "model_name", Model);

      await db.promise().query(`
        UPDATE Printer_info SET
          Printer_Name = ?, Governmental_Number = ?, Department = ?, 
          Model_id = ?, PrinterType_id = ?, InkType_id = ?, InkSerial_id = ?
        WHERE Serial_Number = ?
      `, [
        name, Governmental_Number, departmentId, printerModelId, printerTypeId,
        inkTypeId, inkSerialId, Serial_Number
      ]);

    } else if (type === "scanner") {
      const scannerTypeId = await getId("Scanner_Types", "scanner_type", Scanner_Type);
      const scannerModelId = await getId("Scanner_Model", "model_name", Model);

      await db.promise().query(`
        UPDATE Scanner_info SET
          Scanner_Name = ?, Governmental_Number = ?, Department = ?, 
          Model_id = ?, ScannerType_id = ?
        WHERE Serial_Number = ?
      `, [
        name, Governmental_Number, departmentId, scannerModelId, scannerTypeId, Serial_Number
      ]);
    }

    // 3️⃣ تحديث الجداول المرتبطة
const relatedTables = [
  { table: "General_Maintenance" },
  { table: "Regular_Maintenance" },
  { table: "External_Maintenance" },
  { table: "New_Maintenance_Report" },
  { table: "Internal_Tickets" },
  { table: "External_Tickets" }
];

for (const { table } of relatedTables) {
  const [columns] = await db.promise().query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = ? AND COLUMN_NAME = 'device_id'
  `, [table]);

  if (columns.length > 0) {
    await db.promise().query(`
      UPDATE ${table}
      SET device_name = ?, serial_number = ?, governmental_number = ?
      WHERE device_id = ?
    `, [name, Serial_Number, Governmental_Number, id]);
  }
}


    // 4️⃣ Logging
    const userId = req.user?.id;
    const [userRow] = await db.promise().query('SELECT name FROM users WHERE id = ?', [userId]);
    const userName = userRow[0]?.name || 'Unknown';

<<<<<<< HEAD
await logActivity(
=======
logActivity(
>>>>>>> dfa1ff18f501a113e159d8d77f54553e04171c45
  userId,
  userName,
  JSON.stringify(makeBilingualLog("Edited", "تعديل")),
  JSON.stringify(makeBilingualLog(
    `Updated device ID ${id} – name: ${name}, serial: ${Serial_Number}, gov#: ${Governmental_Number}`,
    `تم تحديث بيانات الجهاز رقم ${id} – الاسم: ${name}، السيريال: ${Serial_Number}، الرقم الحكومي: ${Governmental_Number}`
  ))
);

    res.json({ message: "✅ Device specification updated successfully." });

  } catch (err) {
    console.error("❌ Update device error:", err);
    res.status(500).json({ error: "❌ Server error during update." });
  }
};

module.exports = { updateDeviceSpecificationController }; 
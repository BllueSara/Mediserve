const db = require('../db');
const { makeBilingualLog } = require('../utils/makeBilingualLog');

function removeLangTag(str) {
  return typeof str === "string" ? str.replace(/\s*\[(ar|en)\]$/i, "").trim() : str;
}

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

exports.addDevice = async (req, res) => {
  const deviceType = req.params.type.toLowerCase();
  const Serial_Number = req.body.serial;
  const Governmental_Number = req.body["ministry-id"];
  const Mac_Address = req.body["mac-address"] || null;
  const Ip_Address = req.body["ip-address"] || null;
  const Ink_Serial_Number = req.body["ink-serial-number"] || null;

  const normalizeValue = (value) => {
    return value?.trim().replace(/\s*\[(ar|en)\]$/i, "");
  };

  const department = normalizeValue(req.body.department);
  const model = normalizeValue(req.body.model);
  const Device_Name = normalizeValue(req.body["device-name"] || req.body["pc-name"] || null);
  const Printer_Type = normalizeValue(req.body["printer-type"] || "");
  const Ink_Type = normalizeValue(req.body["ink-type"] || "");
  const Scanner_Type = normalizeValue(req.body["scanner-type"] || "");

  const isValidMac = (mac) => /^([0-9A-F]{2}[:-]){5}([0-9A-F]{2})$/i.test(mac);
  const isValidIp = (ip) => /^((25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.|$)){4}$/.test(ip);

  if (Ip_Address && !isValidIp(Ip_Address)) {
    return res.status(400).json({ error: " عنوان IP غير صالح. مثال صحيح: 192.168.1.1" });
  }
  if (Mac_Address && !isValidMac(Mac_Address)) {
    return res.status(400).json({ error: " عنوان MAC غير صالح. مثال صحيح: 00:1A:2B:3C:4D:5E" });
  }

  const safeGetId = async (table, column, value) => {
    const cleanValue = normalizeValue(value);
    if (!cleanValue) return null;
    return new Promise((resolve, reject) => {
      const searchQuery = `SELECT id FROM ${table} WHERE TRIM(REPLACE(REPLACE(${column}, ' [ar]', ''), ' [en]', '')) = ? LIMIT 1`;
      db.query(searchQuery, [cleanValue], async (err, result) => {
        if (err) return reject(err);
        if (result.length > 0) {
          return resolve(result[0].id);
        } else {
          try {
            const [insertResult] = await db.promise().query(
              `INSERT INTO ${table} (${column}) VALUES (?)`,
              [cleanValue]
            );
            resolve(insertResult.insertId);
          } catch (insertErr) {
            reject(insertErr);
          }
        }
      });
    });
  };

  try {
    const Department_id = await safeGetId('Departments', 'name', department);
    if (!Department_id || !Serial_Number || !Governmental_Number || !Device_Name) {
      return res.status(400).json({ error: "❌ تأكد من تعبئة جميع الحقول المطلوبة" });
    }
    const [existing] = await db.promise().query(
      `SELECT * FROM Maintenance_Devices WHERE serial_number = ? OR governmental_number = ?`,
      [Serial_Number, Governmental_Number]
    );
    if (existing.length > 0) {
      const existingDevice = existing[0];
      if (existingDevice.serial_number === Serial_Number) {
        return res.status(400).json({
          error: "already_exists",
          field: "serial",
          message: "❌ serial number already exists"
        });
      } else if (existingDevice.governmental_number === Governmental_Number) {
        return res.status(400).json({
          error: "already_exists",
          field: "ministry-id",
          message: "❌ governmental number already exists"
        });
      }
    }
    const normalizedType = (deviceType || "").trim().toLowerCase();
    const isPcType = ["pc", "desktop", "laptop", "كمبيوتر", "لابتوب"].includes(normalizedType);
    if (isPcType) {
      const OS_id = await safeGetId('OS_Types', 'os_name', req.body.os);
      const Processor_id = await safeGetId('CPU_Types', 'cpu_name', req.body.processor);
      const Generation_id = await safeGetId('Processor_Generations', 'generation_number', req.body.generation);
      const RAM_id = await safeGetId('RAM_Types', 'ram_type', req.body.ram);
      const Drive_id = await safeGetId('Hard_Drive_Types', 'drive_type', req.body.drive);
      const RamSize_id = await safeGetId('RAM_Sizes', 'ram_size', req.body.ram_size);
      const Model_id = await safeGetId("PC_Model", "model_name", model);
      if (!OS_id || !Processor_id || !Generation_id || !RAM_id || !Model_id || !Drive_id) {
        return res.status(400).json({ error: "❌ تأكد من اختيار كل الخيارات للجهاز (PC)" });
      }
      const insertQuery = `INSERT INTO PC_info (Serial_Number, Computer_Name, Governmental_Number, Department, OS_id, Processor_id, Generation_id, RAM_id, RamSize_id, Drive_id, Model_id, Mac_Address, Ip_Address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      const values = [Serial_Number, Device_Name, Governmental_Number, Department_id, OS_id, Processor_id, Generation_id, RAM_id, RamSize_id, Drive_id, Model_id, Mac_Address, Ip_Address];
      await db.promise().query(insertQuery, values);
    } else if (deviceType === 'printer') {
      const Model_id = await safeGetId("Printer_Model", "model_name", model);
      const PrinterType_id = Printer_Type ? await safeGetId("Printer_Types", "printer_type", Printer_Type) : null;
      const InkType_id = Ink_Type ? await safeGetId("Ink_Types", "ink_type", Ink_Type) : null;
      const InkSerial_id = Ink_Serial_Number ? await safeGetId("Ink_Serials", "serial_number", Ink_Serial_Number) : null;
      if (InkSerial_id && InkType_id) {
        await db.promise().query(
          `UPDATE Ink_Serials SET ink_type_id = ? WHERE id = ?`,
          [InkType_id, InkSerial_id]
        );
      }
      if (!Model_id) {
        return res.status(400).json({ error: "❌ لم يتم تحديد موديل الطابعة" });
      }
      const insertQuery = `INSERT INTO Printer_info (Serial_Number, Printer_Name, Governmental_Number, Department, Model_id, PrinterType_id, InkType_id, InkSerial_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
      const values = [Serial_Number, Device_Name, Governmental_Number, Department_id, Model_id, PrinterType_id, InkType_id, InkSerial_id];
      await db.promise().query(insertQuery, values);
    } else if (deviceType === 'scanner') {
      const Model_id = await safeGetId("Scanner_Model", "model_name", model);
      const ScannerType_id = Scanner_Type ? await safeGetId("Scanner_Types", "scanner_type", Scanner_Type) : null;
      if (!Model_id) {
        return res.status(400).json({ error: "❌ لم يتم تحديد موديل الماسح الضوئي" });
      }
      const insertQuery = `INSERT INTO Scanner_info (Serial_Number, Scanner_Name, Governmental_Number, Department, Model_id, ScannerType_id) VALUES (?, ?, ?, ?, ?, ?)`;
      const values = [Serial_Number, Device_Name, Governmental_Number, Department_id, Model_id, ScannerType_id];
      await db.promise().query(insertQuery, values);
    }
    const insertMaintenanceDevice = `INSERT INTO Maintenance_Devices (serial_number, governmental_number, device_type, device_name, department_id) VALUES (?, ?, ?, ?, ?)`;
    const [result2] = await db.promise().query(insertMaintenanceDevice, [Serial_Number, Governmental_Number, deviceType, Device_Name, Department_id]);
    const userId = req.user?.id;
    if (userId) {
      db.query("SELECT name FROM users WHERE id = ?", [userId], (errUser, resultUser) => {
        if (!errUser && resultUser.length > 0) {
          const userName = resultUser[0].name;
          logActivity(userId, userName, JSON.stringify(makeBilingualLog("Add Device", "إضافة جهاز")), JSON.stringify(makeBilingualLog(
            `Added '${deviceType}' with serial '${Serial_Number}'`,
            `تمت إضافة جهاز من النوع '${deviceType}' برقم سيريال '${Serial_Number}'`
          )));
        }
      });
    }
    res.json({
      message: `✅ تم حفظ بيانات الجهاز (${deviceType}) بنجاح`,
      insertedId: result2.insertId
    });
  } catch (err) {
    console.error("❌ خطأ عام:", err);
    res.status(500).json({ error: "❌ حدث خطأ أثناء المعالجة" });
  }
}; 
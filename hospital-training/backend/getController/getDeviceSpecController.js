const db = require('../db');

exports.getDeviceSpec = async (req, res) => {
  const { id } = req.params;
  try {
    const [deviceRows] = await db.promise().query(
      `SELECT * FROM Maintenance_Devices WHERE id = ?`,
      [id]
    );
    if (deviceRows.length === 0) {
      return res.status(404).json({ error: "❌ الجهاز غير موجود" });
    }
    const device = deviceRows[0];
    const type = device.device_type?.toLowerCase().trim();
    const serial = device.serial_number;
    let baseData = {
      id: device.id,
      name: device.device_name,
      Device_Type: device.device_type,
      Serial_Number: device.serial_number,
      Governmental_Number: device.governmental_number,
      MAC_Address: device.mac_address,
      IP_Address: device.ip_address,
    };
    // قسم
    const [deptRow] = await db.promise().query(
      `SELECT name FROM Departments WHERE id = ?`,
      [device.department_id]
    );
    if (deptRow.length > 0) baseData.Department = deptRow[0].name;
    // PC
    if (["pc", "desktop", "laptop", "كمبيوتر", "لابتوب"].includes(type)) {
      const [pcRows] = await db.promise().query(`
        SELECT 
          pm.model_name AS Model,
          os.os_name AS OS,
          cpu.cpu_name AS Processor,
          ram.ram_type AS RAM,
          gen.generation_number AS Generation,
          drive.drive_type AS Hard_Drive,
          ram_size.ram_size AS RAM_Size,
          pc.Mac_Address AS MAC_Address,
          pc.Ip_Address AS IP_Address
        FROM PC_info pc
        LEFT JOIN PC_Model pm ON pc.Model_id = pm.id
        LEFT JOIN OS_Types os ON pc.OS_id = os.id
        LEFT JOIN CPU_Types cpu ON pc.Processor_id = cpu.id
        LEFT JOIN RAM_Types ram ON pc.RAM_id = ram.id
        LEFT JOIN Processor_Generations gen ON pc.Generation_id = gen.id
        LEFT JOIN Hard_Drive_Types drive ON pc.Drive_id = drive.id
        LEFT JOIN RAM_Sizes ram_size ON pc.RamSize_id = ram_size.id
        WHERE pc.Serial_Number = ?
      `, [serial]);
      baseData = { ...baseData, ...(pcRows[0] || {}) };
    }
    // Printer
    if (type === "printer") {
      const [printerRows] = await db.promise().query(`
        SELECT 
          pm.model_name AS Model,
          pt.printer_type AS Printer_Type,
          it.ink_type AS Ink_Type,
          iser.serial_number AS Ink_Serial_Number
        FROM Printer_info pi
        LEFT JOIN Printer_Model pm ON pi.Model_id = pm.id
        LEFT JOIN Printer_Types pt ON pi.PrinterType_id = pt.id
        LEFT JOIN Ink_Types it ON pi.InkType_id = it.id
        LEFT JOIN Ink_Serials iser ON pi.InkSerial_id = iser.id
        WHERE pi.Serial_Number = ?
      `, [serial]);
      baseData = { ...baseData, ...(printerRows[0] || {}) };
    }
    // Scanner
    if (type === "scanner") {
      const [scannerRows] = await db.promise().query(`
        SELECT 
          sm.model_name AS Model,
          st.scanner_type AS Scanner_Type
        FROM Scanner_info si
        LEFT JOIN Scanner_Model sm ON si.Model_id = sm.id
        LEFT JOIN Scanner_Types st ON si.ScannerType_id = st.id
        WHERE si.Serial_Number = ?
      `, [serial]);
      baseData = { ...baseData, ...(scannerRows[0] || {}) };
    }
    // أجهزة غير معروفة
    if (!["pc", "printer", "scanner", "desktop", "laptop", "كمبيوتر", "لابتوب"].includes(type)) {
      const [modelRows] = await db.promise().query(`
        SELECT model_name FROM Maintance_Device_Model WHERE id = ?
      `, [device.model_id]);
      if (modelRows.length > 0) {
        baseData.Model = modelRows[0].model_name;
      }
    }
    res.json(baseData);
  } catch (err) {
    console.error("❌ Error fetching full device data:", err);
    res.status(500).json({ error: "❌ حدث خطأ أثناء جلب البيانات" });
  }
}; 
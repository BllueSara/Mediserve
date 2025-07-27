const db = require('../db');

// دوال مساعدة من server.js
const compareReadable = (label, oldVal, newVal, changes) => {
  if (newVal == null || newVal.toString().trim() === "") return;
  const oldStr = (oldVal ?? "").toString().trim();
  const newStr = newVal.toString().trim();
  if (label !== "Assigned To" && (oldStr === "" || oldStr === "-") && newStr !== "") {
    return;
  }
  if (oldStr !== newStr) {
    changes.push(` ${label}: "${oldStr || "-"}" → "${newStr || "-"}"`);
  }
};


  // إذا كنت تستخدم upload من multer في المشروع الرئيسي، يجب تمريره من ملف الراوتر
  
  // الدالة الأصلية كما هي من server.js
  async function updateReportFull(req, res) {
    const updatedData = JSON.parse(req.body.data || "{}");
  const attachmentFile = req.files?.attachment?.[0] || null;
  const signatureRaw = req.files?.signature?.[0] || null;
  const signatureFile = signatureRaw && signatureRaw.size > 0 ? signatureRaw : null;

  console.log("📩 Received update data:", updatedData);
  if (attachmentFile) {
    console.log("📎 Received attachment file:", attachmentFile.originalname);
  }
  if (signatureFile) {
    console.log("✍️ Received signature file:", signatureFile.originalname);
  }
let departmentId = null;

  let {
    id,        // ← هنا
 issue_summary,ticket_number, full_description, priority, status, device_type,
    assigned_to, department_name, category, source,
    device_id, device_name, serial_number, governmental_number,
    cpu_name, ram_type, ram_size, os_name, generation_number,
    model_name, drive_type, mac_address, ip_address,
    ink_type, ink_serial_number, printer_type, scanner_type,
    // لاحظ: ضفنا هالثلاث لأجل الـ fallback
    ink_type_id, printer_type_id, scanner_type_id
  } = updatedData;


  async function calcId(oldId, name, table, col) {
    const num = Number(oldId);
    if (!isNaN(num) && num > 0) return num;
    if (name && name.trim()) {
      return await getOrCreateId(table, col, name.trim());
    }
    return null;
  }

  // ————————— حاسبة الـ IDs الثلاثة —————————
  updatedData.printer_type_id = await calcId(
    printer_type_id, printer_type,
    "Printer_Types", "printer_type"
  );
  updatedData.ink_type_id     = await calcId(
    ink_type_id, ink_type,
    "Ink_Types", "ink_type"
  );
  updatedData.scanner_type_id = await calcId(
    scanner_type_id, scanner_type,
    "Scanner_Types", "scanner_type"
  );

if (department_name && department_name.trim() !== "") {
  departmentId = await getOrCreateDepartment(department_name.trim());
}


  const lowerType = device_type?.toLowerCase();
  const isPC = lowerType === "pc";
  const isPrinter = lowerType === "printer";
  const isScanner = lowerType === "scanner";

  // تعريف المتغيرات في البداية لتجنب أخطاء ReferenceError
  const isExternal = source === "external-legacy";
  let actualDeviceId = null;

  // استخدم جدول Maintance_Device_Model في جميع الحالات
  const { model_id } = updatedData;



  if (!source) {
    return res.status(400).json({ error: "Missing source type" });
  }

  try {// 🧠 سجل تغييرات شامل
    const changes = [];

    // 🕵️‍♂️ جلب البيانات القديمة
    const [oldReportRows] = await db.promise().query(
      `SELECT * FROM ${source === 'new' ? 'New_Maintenance_Report' : 'Maintenance_Reports'} WHERE id = ?`,
      [id]
    );

        const reportOld = oldReportRows[0] || {};
        updatedData.device_specifications = reportOld.device_specifications;

updatedData.technician_name = reportOld.technician_name;
// }
  if (!Object.prototype.hasOwnProperty.call(updatedData, 'status')) {
    updatedData.status = reportOld.status;
  }
// وبعد كذا:
// ——— تعويض القيم إذا ما أرسلناها ———
updatedData.printer_type = updatedData.printer_type  ?? reportOld.printer_type;
updatedData.ink_type     = updatedData.ink_type      ?? reportOld.ink_type;

// وللمعرفات أيضاً
updatedData.printer_type_id = updatedData.printer_type_id ?? reportOld.printer_type_id;
updatedData.ink_type_id     = updatedData.ink_type_id     ?? reportOld.ink_type_id;
  // ——————————————————————————
  // ↘ هنا نركّز على report_type فقط ↙
const { maintenance_type: reportType, device_id: deviceId, ticket_id: ticketId } = reportOld;
  let oldAssigned = null;

  if (reportType === "Regular") {
    const [[r]] = await db.promise().query(
      `SELECT u.name AS techName
         FROM Regular_Maintenance rm
         JOIN users u ON rm.technical_engineer_id = u.id
        WHERE rm.device_id = ?`,
      [reportOld.device_id]
    );
    oldAssigned = r?.techName ?? null;

  } else if (reportType === "General") {
    const [[g]] = await db.promise().query(
      `SELECT technician_name
         FROM General_Maintenance
        WHERE device_id = ?`,
      [reportOld.device_id]
    );
    oldAssigned = g?.technician_name ?? null;

  } else if (reportType === "Internal") {
    const [[i]] = await db.promise().query(
      `SELECT assigned_to
         FROM Internal_Tickets
        WHERE id = ?`,
      [reportOld.ticket_id]
    );
    oldAssigned = i?.assigned_to ?? null;

  } else if (reportType === "External" || source === "external-legacy") {
    const [[e]] = await db.promise().query(
      `SELECT reporter_name
         FROM External_Maintenance
        WHERE id = ?`,
      [id]
    );
    oldAssigned = e?.reporter_name ?? null;
  }
  else if (source === 'external-new') {
    const [[e]] = await db.promise().query(
      `UPDATE External_Tickets
       SET assigned_to = ?
       WHERE ticket_number = ?`,
      [id]
    );
    oldAssigned = e?.assigned_to ?? null;
  }

  // تشخيص قيمة oldAssigned قبل المقارنة
  // 🔧 إصلاح: استخراج البيانات الصحيحة حسب نوع الصيانة
  let engId = null;
  let engName = null;
  
  if (reportType === "Regular") {
    engId = updatedData.technical_engineer_id;
    engName = updatedData.technical_engineer;
  } else if (reportType === "General") {
    engId = updatedData.technician_id;
    engName = updatedData.technician_name || updatedData.assigned_to || null;
  } else if (reportType === "Internal" || reportType === "External") {
    engId = updatedData.assigned_to_id;
    engName = updatedData.assigned_to;
  } else {
    // fallback للحقول العامة
    engId = updatedData.engineer_id;
    engName = updatedData.assigned_to;
  }

  console.log("🔍 Backend Engineer Data:", {
    reportType,
    engId,
    engName,
    technical_engineer_id: updatedData.technical_engineer_id,
    technician_id: updatedData.technician_id,
    assigned_to_id: updatedData.assigned_to_id
  });

  // 🔧 إضافة validation للتأكد من أن engId رقم صحيح
  if (reportType === "Regular" && engId) {
    const numericId = Number(engId);
    if (isNaN(numericId) || numericId <= 0) {
      console.error("❌ Invalid technical_engineer_id:", engId);
      return res.status(400).json({ 
        error: "Invalid engineer ID", 
        details: `Expected numeric ID, got: ${engId}` 
      });
    }
    engId = numericId; // تأكد من أنه رقم
  }

  switch (reportType) {
    case "Regular":
      await db.promise().query(
        `UPDATE Regular_Maintenance
         SET technical_engineer_id = ?
         WHERE device_id = ?`,
        [engId, deviceId]
      );
      break;

    case "General":
      await db.promise().query(
        `UPDATE General_Maintenance
         SET technician_name = ?
         WHERE device_id = ?`,
        [engName, deviceId]
      );
      break;

    case "Internal":
      await db.promise().query(
        `UPDATE Internal_Tickets
         SET assigned_to = ?
         WHERE id = ?`,
        [engName, ticketId]
      );
      break;

    default:
      // لا تحديث
      break;
  }
  // ——————————————————————————

if(source === "external-legacy"){
  await db.promise().query(
    `UPDATE External_Maintenance
     SET reporter_name = ?
     WHERE id = ?`,
    [engName, id]
  );
}

if (source === "external-new") {
  // جلب ticket_number إذا لم يكن موجودًا
  let ticketNum = ticket_number;
  if (!ticketNum) {
    const [[row]] = await db.promise().query(
      `SELECT report_number FROM Maintenance_Reports WHERE id = ?`,
      [id]
    );
    ticketNum = row?.ticket_number;
  }

  console.log('external-new: updating ticket', { id, engName, ticketNum });

  try {
    const [result] = await db.promise().query(
      `UPDATE External_Tickets
       SET assigned_to = ?
       WHERE ticket_number = ?`,
      [engName, ticketNum]
    );
    console.log('external-new affectedRows =', result.affectedRows);

    if (result.affectedRows === 0) {
      console.warn(`No ticket found with ticket_number=${ticketNum} in External_Tickets.`);
    }
  } catch (err) {
    console.error('Error updating External_Tickets:', err);
  }
}


    // 🎯 استخراج أسماء الملفات السابقة
    const oldAttachmentName = reportOld.attachment_name || null;
    const oldSignaturePath = reportOld.signature_path || null;


    // جلب بيانات Maintenance_Devices
// جلب بيانات Maintenance_Devices باستخدام id أو fallback إلى serial_number
let oldDevice = {};
if (reportOld.device_id) {
  const [rows] = await db.promise().query(`SELECT * FROM Maintenance_Devices WHERE id = ? LIMIT 1`, [reportOld.device_id]);
  oldDevice = rows[0] || {};
} else if (serial_number) {
  const [rows] = await db.promise().query(`SELECT * FROM Maintenance_Devices WHERE serial_number = ? LIMIT 1`, [serial_number]);
  oldDevice = rows[0] || {};
}

// للصيانة الخارجية، تحسين منطق البحث عن الجهاز بالرقم التسلسلي القديم
if (isExternal && serial_number && oldDevice.serial_number && oldDevice.serial_number !== serial_number) {
  console.log(`🔍 EXTERNAL MAINTENANCE DEBUG - Starting device search for serial: ${serial_number}`);
  console.log(`🔍 STEP 1: Searching for device with OLD serial number in Maintenance_Devices`);
  console.log(`🔍 OLD serial from device: ${oldDevice.serial_number}, NEW serial: ${serial_number}`);
  
  // ابحث عن الجهاز بالرقم التسلسلي القديم في Maintenance_Devices
  const [oldSerialDevice] = await db.promise().query(
    `SELECT id, serial_number FROM Maintenance_Devices WHERE serial_number = ? LIMIT 1`,
    [oldDevice.serial_number]
  );
  
  if (oldSerialDevice.length > 0) {
    actualDeviceId = oldSerialDevice[0].id;
    console.log(`🔗 FOUND device ${actualDeviceId} with OLD serial ${oldSerialDevice[0].serial_number}, will UPDATE it to new serial ${serial_number}`);
    console.log(`📝 CRITICAL: This ensures we UPDATE existing device, NOT create new one`);
    
    // ربط التقرير بالجهاز الموجود
    await db.promise().query(
      `UPDATE Maintenance_Reports SET device_id = ? WHERE id = ?`,
      [actualDeviceId, id]
    );
    console.log(`🔗 Linked report ${id} to existing device ${actualDeviceId} (found by OLD serial)`);
  } else {
    console.log(`⚠️ No device found with OLD serial ${oldDevice.serial_number}, continuing with normal search`);
  }
}

    // جلب بيانات PC_info / Printer_info / Scanner_info
    let oldSpec = {};
    if (isPC) {
      [[oldSpec]] = await db.promise().query(`SELECT * FROM PC_info WHERE Serial_Number = ?`, [serial_number]);
    } else if (isPrinter) {
      [[oldSpec]] = await db.promise().query(`SELECT * FROM Printer_info WHERE Serial_Number = ?`, [serial_number]);
    } else if (isScanner) {
      [[oldSpec]] = await db.promise().query(`SELECT * FROM Scanner_info WHERE Serial_Number = ?`, [serial_number]);
    }
    oldSpec = oldSpec || {};

    // ✅ مقارنات عامة
    compareReadable("Issue Summary", reportOld.issue_summary, issue_summary, changes);
    compareReadable("Description", reportOld.full_description ?? reportOld.details, full_description, changes);
    compareReadable("Priority", reportOld.priority, priority, changes);
    compareReadable("Status", reportOld.status, status, changes);
// 1) احسب oldAssigned بناءً على reportType و source القديم

// 2) جهّز القيمة الجديدة (engName) عشان تقارنها في كل الحالات
const newAssigned = engName; 

// 3) سجّل التغيير
compareReadable("Assigned To", oldAssigned, newAssigned, changes);

compareReadable("Category", reportOld.report_type, category, changes);


    // ✅ بيانات نصية مباشرة
    compareReadable("Device Name", oldDevice.device_name, device_name, changes);
    compareReadable("Serial Number", oldDevice.serial_number, serial_number, changes);
    compareReadable("Governmental Number", oldDevice.governmental_number, governmental_number, changes);
    compareReadable("IP Address", oldDevice.ip_address, ip_address, changes);
    compareReadable("MAC Address", oldDevice.mac_address, mac_address, changes);

    // ✅ المواصفات - جلب الأسماء مباشرة من الجداول المرجعية

    // Model
// بعد ما تجيب oldDevice و oldSpec
const oldModelId = oldDevice.model_id ?? oldSpec?.Model_id;

// حساب modelId مع fallback للقيمة القديمة
let modelId = null;
if (device_type && model_id) {
  const parsedModelId = Number(model_id);
  modelId = isNaN(parsedModelId) ? oldModelId : parsedModelId;
} else {
  modelId = oldModelId; // استخدم القيمة القديمة إذا لم يتم إرسال model_id جديد
}

let modelNameOld = null;

if (oldModelId) {
  const [[row]] = await db.promise().query(
    `SELECT model_name 
     FROM Maintance_Device_Model 
     WHERE id = ?`,
    [oldModelId]
  );
  modelNameOld = row?.model_name || null;
}

// بعدين بس اعمل المقارنة
compareReadable("Model", modelNameOld, updatedData.model_name, changes);

    // CPU
    let cpuNameOld = null;
    const oldCpuId = reportOld.cpu_id || oldSpec?.Processor_id;
    if (oldCpuId) {
      const [[row]] = await db.promise().query(`SELECT cpu_name FROM CPU_Types WHERE id = ?`, [oldCpuId]);
      cpuNameOld = row?.cpu_name;
    }
    compareReadable("Processor", cpuNameOld, cpu_name, changes);

    // RAM
    let ramNameOld = null;
    const oldRamId = reportOld.ram_id || oldSpec?.RAM_id;
    if (oldRamId) {
      const [[row]] = await db.promise().query(`SELECT ram_type FROM RAM_Types WHERE id = ?`, [oldRamId]);
      ramNameOld = row?.ram_type;
    }
    compareReadable("RAM", ramNameOld, ram_type, changes);

    // RAM Size
    let ramSizeOld = null;
    const oldRamSizeId = reportOld.ram_size_id || oldSpec?.RamSize_id;
    if (oldRamSizeId) {
      const [[row]] = await db.promise().query(`SELECT ram_size FROM RAM_Sizes WHERE id = ?`, [oldRamSizeId]);
      ramSizeOld = row?.ram_size;
    }
    compareReadable("RAM Size", ramSizeOld, ram_size, changes);

    // OS
    let osNameOld = null;
    const oldOsId = reportOld.os_id || oldSpec?.OS_id;
    if (oldOsId) {
      const [[row]] = await db.promise().query(`SELECT os_name FROM OS_Types WHERE id = ?`, [oldOsId]);
      osNameOld = row?.os_name;
    }
    compareReadable("OS", osNameOld, os_name, changes);

    // Generation
    let genOld = null;
    const oldGenId = reportOld.generation_id || oldSpec?.Generation_id;
    if (oldGenId) {
      const [[row]] = await db.promise().query(`SELECT generation_number FROM Processor_Generations WHERE id = ?`, [oldGenId]);
      genOld = row?.generation_number;
    }
    compareReadable("Generation", genOld, generation_number, changes);

    // Drive Type
    let driveOld = null;
    const oldDriveId = reportOld.drive_id || oldSpec?.Drive_id;
    if (oldDriveId) {
      const [[row]] = await db.promise().query(`SELECT drive_type FROM Hard_Drive_Types WHERE id = ?`, [oldDriveId]);
      driveOld = row?.drive_type;
    }
    compareReadable("Drive Type", driveOld, drive_type, changes);

    // ✅ الطابعة
    let inkOld = null;
    if (oldDevice.ink_type) {
      const [[row]] = await db.promise().query(`SELECT ink_type FROM Ink_Types WHERE id = ?`, [oldDevice.ink_type]);
      inkOld = row?.ink_type;
    }
    compareReadable("Ink Type", inkOld, ink_type, changes);

    let inkSerialOld = null;
    if (oldDevice.ink_serial_number) {
      const [[row]] = await db.promise().query(`SELECT serial_number FROM Ink_Serials WHERE id = ?`, [oldDevice.ink_serial_number]);
      inkSerialOld = row?.serial_number;
    }
    compareReadable("Ink Serial", inkSerialOld, ink_serial_number, changes);

    let printerTypeOld = null;
    if (oldDevice.printer_type) {
      const [[row]] = await db.promise().query(`SELECT printer_type FROM Printer_Types WHERE id = ?`, [oldDevice.printer_type]);
      printerTypeOld = row?.printer_type;
    }
    compareReadable("Printer Type", printerTypeOld, printer_type, changes);

    // ✅ الماسح
    let scannerTypeOld = null;
    if (oldDevice.scanner_type_id) {
      const [[row]] = await db.promise().query(`SELECT scanner_type FROM Scanner_Types WHERE id = ?`, [oldDevice.scanner_type_id]);
      scannerTypeOld = row?.scanner_type;
    }
    compareReadable("Scanner Type", scannerTypeOld, scanner_type, changes);

    // ✅ القسم
    let deptOld = null;
    if (oldDevice.department_id) {
      const [[row]] = await db.promise().query(`SELECT name FROM Departments WHERE id = ?`, [oldDevice.department_id]);
      deptOld = row?.name;
    }
    compareReadable("Department", deptOld, department_name, changes);

    if (attachmentFile && attachmentFile.originalname !== oldAttachmentName) {
      changes.push(`📎 New attachment uploaded: ${attachmentFile.originalname}`);
    }

    if (signatureFile) {
      const newSigPath = `uploads/${signatureFile.filename}`;
      if (newSigPath !== oldSignaturePath) {
        changes.push(`✍️ New signature uploaded`);
      }
    }



// … بعد كل compareReadable(...) …

// لو في تغييرات، سجلها كلها بس هي فقط



    // Get specification IDs
    let cpuId, ramId, osId, generationId, driveId, ramSizeId;
    if (isPC) {
      cpuId = await getOrCreateId("CPU_Types", "cpu_name", cpu_name);
      ramId = await getOrCreateId("RAM_Types", "ram_type", ram_type);
      osId = await getOrCreateId("OS_Types", "os_name", os_name?.trim());
      generationId = await getOrCreateId("Processor_Generations", "generation_number", generation_number);
      driveId = await getOrCreateId("Hard_Drive_Types", "drive_type", drive_type);
      ramSizeId = await getOrCreateId("RAM_Sizes", "ram_size", ram_size);
    }

    if (isPrinter) {
      ink_type = await getOrCreateId("Ink_Types", "ink_type", ink_type);
      ink_serial_number = await getOrCreateinkId("Ink_Serials", "serial_number", ink_serial_number);
      printer_type = await getOrCreateId("Printer_Types", "printer_type", printer_type);
    }

    // تحسين: تأكد من أن جميع المتغيرات المطلوبة متوفرة للصيانة الخارجية
    if (source === "external-legacy" || source === "external-new") {
      console.log(`🔧 External maintenance detected. Ensuring all required variables are available.`);
      console.log(`📋 Device type: ${device_type}, Serial: ${serial_number}, Model: ${model_name}`);
      
      // تأكد من أن serial_number متوفر
      if (!serial_number) {
        console.warn(`⚠️ Serial number is missing for external maintenance. Using device_id: ${actualDeviceId}`);
      }
      
      // تأكد من أن device_type متوفر
      if (!device_type) {
        console.warn(`⚠️ Device type is missing for external maintenance.`);
      }
      
      // تأكد من أن modelId متوفر
      if (!modelId) {
        console.warn(`⚠️ Model ID is missing for external maintenance.`);
      }
    }

    if (source === "new") {
      const updateSql = `
        UPDATE New_Maintenance_Report
        SET
          issue_summary = ?, details = ?, assigned_to = ?, 
          priority = ?, status = ?, device_type = ?,
          device_name = ?, serial_number = ?, governmental_number = ?,
          department_id = ?, model_id = ?,
          ${isPC ? "cpu_id = ?, ram_id = ?, os_id = ?, generation_id = ?, drive_id = ?, ram_size_id = ?," : ""}
          ${isPrinter ? "ink_type = ?, ink_serial_number = ?, printer_type = ?," : ""}
          ${isScanner ? "scanner_type_id = ?," : ""}
          ${attachmentFile ? "attachment_name = ?, attachment_path = ?," : ""}
          details = ?
        WHERE id = ?`;

      const values = [
        issue_summary, full_description, assigned_to,
        priority, status, device_type,
        device_name, serial_number, governmental_number,
        departmentId, modelId
      ];

      if (isPC) {
        values.push(cpuId || null, ramId || null, osId || null, generationId || null, driveId || null, ramSizeId || null);
      }
      if (isPrinter) {
        values.push(ink_type || null, ink_serial_number || null, printer_type || null);
      }
      if (isScanner) {
        values.push(scanner_type_id || null);
      }
      if (attachmentFile) {
        values.push(attachmentFile.originalname, `uploads/${attachmentFile.filename}`);
      }
      values.push(full_description?.trim() || null, id);

      await db.promise().query(updateSql, values);
    }
    if (source === "internal") {
      // 👇 جلب التوقيع القديم قبل التحديث
      const [[reportRow]] = await db.promise().query(
        `SELECT signature_path, attachment_name, attachment_path FROM Maintenance_Reports WHERE id = ?`,
        [id]
      );

      if (!reportRow) {
        return res.status(404).json({ error: "Report not found" });
      }

      const attachmentNameToUse = attachmentFile?.originalname || reportRow.attachment_name;
      const attachmentPathToUse = attachmentFile ? `${attachmentFile.filename}` : reportRow.attachment_path;

      const signaturePathToUse = signatureFile
        ? `uploads/${signatureFile.filename}`
        : reportRow.signature_path;

      const updateReportSql = `
  UPDATE Maintenance_Reports 
  SET  status = ?, report_type = ?,
      attachment_name = ?, attachment_path = ?, signature_path = ?
  WHERE id = ?`;

      const reportValues = [
        status,
        reportRow.report_type, // يظل كما هو (عادة "Internal")
        attachmentNameToUse,
        attachmentPathToUse,
        signaturePathToUse,
        id
      ];

      await db.promise().query(updateReportSql, reportValues);






      await db.promise().query(`
        UPDATE Internal_Tickets 
        SET priority = ?, assigned_to = ?, status = ? 
        WHERE id = (SELECT ticket_id FROM Maintenance_Reports WHERE id = ?)`,
        [priority, assigned_to, status, id]);
      }
if (source === "external-new" || source === "external-legacy") {
  try {
    // ← initialize here
    const setFields = [];
    const reportValues = [];

if (attachmentFile) {
  setFields.push("attachment_name = ?", "attachment_path = ?");
  reportValues.push(
    attachmentFile.originalname,   // الاسم الأصلي
    `${attachmentFile.filename}`   // مسار/اسم الملف المحفوظ
  );
}

if (signatureFile) {
  setFields.push("signature_path = ?");
  reportValues.push(
    `uploads/${signatureFile.filename}`  // مسار التوقيع داخل مجلد uploads
  );
}
if (attachmentFile) {
  setFields.push("attachment_path = ?");
  reportValues.push(
    `uploads/${attachmentFile.filename}`  // مسافر التوقيع داخل مجلد uploads
  );
}
if (setFields.length > 0) {
  const updateReportSql = `
    UPDATE Maintenance_Reports
    SET ${setFields.join(", ")}
    WHERE id = ?`;
  reportValues.push(id);
  await db.promise().query(updateReportSql, reportValues);
}

    console.log(
      "✅ Maintenance_Reports updated with attachment:",
      attachmentFile?.originalname,
      "and signature:",
      signatureFile?.originalname,
      "for report id:",
      id
    );
    console.log("✅ تم تحديث External_Maintenance بشكل كامل");
  } catch (error) {
    console.error("❌ خطأ في تحديث External:", error);
  }
}

// خذ ID الجهاز من التقرير نفسه
actualDeviceId = reportOld.device_id;

console.log(`🔍 External Legacy Debug - Report ID: ${id}, Source: ${source}, Initial device_id: ${actualDeviceId}, Serial: ${serial_number}`);

  // للصيانة الخارجية، تحسين منطق البحث عن الجهاز
if (isExternal && serial_number) {
  // إذا كان هناك device_id موجود، استخدمه أولاً (الأولوية للجهاز المرتبط بالتقرير)
  if (actualDeviceId) {
    const [deviceCheck] = await db.promise().query(
      `SELECT id, serial_number FROM Maintenance_Devices WHERE id = ? LIMIT 1`,
      [actualDeviceId]
    );
    if (deviceCheck.length > 0) {
      console.log(`🔗 Using existing linked device ${actualDeviceId} for report ${id} (current serial: ${deviceCheck[0].serial_number}, new serial: ${serial_number})`);
      // نستخدم الجهاز الموجود حتى لو تغير الرقم التسلسلي
    } else {
      console.log(`⚠️ Linked device ${actualDeviceId} not found, will search for new device`);
      actualDeviceId = null;
    }
  }

  // إذا لم يكن هناك device_id مرتبط، ابحث عن جهاز بالرقم التسلسلي
  if (!actualDeviceId) {
    console.log(`🔍 Searching for existing device in Maintenance_Devices for serial: ${serial_number}`);
    const [deviceRows] = await db.promise().query(
      `SELECT id FROM Maintenance_Devices WHERE serial_number = ? LIMIT 1`,
      [serial_number]
    );
    
    if (deviceRows.length > 0) {
      // الجهاز موجود في Maintenance_Devices، استخدمه
      actualDeviceId = deviceRows[0].id;
      console.log(`🔗 Found existing device ${actualDeviceId} in Maintenance_Devices for serial: ${serial_number}`);
      
      // ربط التقرير بالجهاز الموجود
      await db.promise().query(
        `UPDATE Maintenance_Reports SET device_id = ? WHERE id = ?`,
        [actualDeviceId, id]
      );
      console.log(`🔗 Linked report ${id} to existing device ${actualDeviceId}`);
    } else {
      // لم يوجد في Maintenance_Devices، ابحث في External_Maintenance
      console.log(`🔍 Device not found in Maintenance_Devices, searching in External_Maintenance for serial: ${serial_number}`);
      const [externalRows] = await db.promise().query(
        `SELECT * FROM External_Maintenance WHERE serial_number = ? LIMIT 1`,
        [serial_number]
      );
      
      if (externalRows.length > 0) {
        // وجد الجهاز في External_Maintenance، أنشئ سجل جديد في Maintenance_Devices
        await db.promise().query(
        `UPDATE Maintenance_Reports SET device_id = ? WHERE id = ?`,
        [actualDeviceId, id]
      );
        console.log(`🆕 Created new device ${actualDeviceId} for external-legacy report ${id}`);
        
        // إنشاء السجل في الجدول التفصيلي المناسب (فقط إذا لم يكن موجوداً)
        if (device_type === "Printer" || device_type === "printer") {
          console.log(`🖨️ Checking if Printer_info record exists for serial: ${serial_number}`);
          const [existingPrinter] = await db.promise().query(
            `SELECT 1 FROM Printer_info WHERE Serial_Number = ? LIMIT 1`,
            [serial_number]
          );
          
          if (existingPrinter.length === 0) {
            console.log(`🖨️ Creating new Printer_info record for serial: ${serial_number}`);
            let inkTypeId = Number(updatedData.ink_type_id);
            if ((!inkTypeId || isNaN(inkTypeId)) && updatedData.ink_type) {
              inkTypeId = await getOrCreateId("Ink_Types", "ink_type", updatedData.ink_type.trim());
            }
            const newInkSerialStr = updatedData.ink_serial_number?.trim() || null;
            const inkSerialId = newInkSerialStr ? await getOrCreateinkId("Ink_Serials", "serial_number", newInkSerialStr) : null;
            let printerTypeId = Number(updatedData.printer_type_id);
            if ((!printerTypeId || isNaN(printerTypeId)) && updatedData.printer_type) {
              printerTypeId = await getOrCreateId("Printer_Types", "printer_type", updatedData.printer_type.trim());
            }
            await db.promise().query(`
              INSERT INTO Printer_info (Serial_Number, Printer_Name, Governmental_Number, Department, InkType_id, InkSerial_id, PrinterType_id, Model_id)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [serial_number, device_name, governmental_number, departmentId, inkTypeId, inkSerialId, printerTypeId, modelId]);
            console.log(`✅ Created new Printer_info record for serial: ${serial_number}`);
          } else {
            console.log(`✅ Printer_info record already exists for serial: ${serial_number}`);
          }
        } else if (device_type === "PC") {
          console.log(`🖥️ Checking if PC_info record exists for serial: ${serial_number}`);
          const [existingPC] = await db.promise().query(
            `SELECT 1 FROM PC_info WHERE Serial_Number = ? LIMIT 1`,
            [serial_number]
          );
          
          if (existingPC.length === 0) {
            console.log(`🖥️ Creating new PC_info record for serial: ${serial_number}`);
            await db.promise().query(`
              INSERT INTO PC_info (Serial_Number, Computer_Name, Governmental_Number, Department, Model_id, Mac_Address, Ip_Address)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [serial_number, device_name, governmental_number, departmentId, modelId, mac_address, ip_address]);
            console.log(`✅ Created new PC_info record for serial: ${serial_number}`);
          } else {
            console.log(`✅ PC_info record already exists for serial: ${serial_number}`);
          }
        } else if (device_type === "Scanner" || device_type === "scanner") {
          console.log(`📷 Checking if Scanner_info record exists for serial: ${serial_number}`);
          const [existingScanner] = await db.promise().query(
            `SELECT 1 FROM Scanner_info WHERE Serial_Number = ? LIMIT 1`,
            [serial_number]
          );
          
          if (existingScanner.length === 0) {
            console.log(`📷 Creating new Scanner_info record for serial: ${serial_number}`);
            let scannerTypeId = Number(updatedData.scanner_type_id);
            if ((!scannerTypeId || isNaN(scannerTypeId)) && updatedData.scanner_type) {
              scannerTypeId = await getOrCreateId("Scanner_Types", "scanner_type", updatedData.scanner_type.trim());
            }
            await db.promise().query(`
              INSERT INTO Scanner_info (Serial_Number, Scanner_Name, Governmental_Number, Department, ScannerType_id, Model_id)
              VALUES (?, ?, ?, ?, ?, ?)
            `, [serial_number, device_name, governmental_number, departmentId, scannerTypeId, modelId]);
            console.log(`✅ Created new Scanner_info record for serial: ${serial_number}`);
          } else {
            console.log(`✅ Scanner_info record already exists for serial: ${serial_number}`);
          }
        }
      } else {
        // لم يوجد في أي مكان، أنشئ جهاز جديد ببيانات الطلب الحالي
        console.log(`🆕 Creating new device for serial number: ${serial_number}`);
        actualDeviceId = result.insertId;
        await db.promise().query(
          `UPDATE Maintenance_Reports SET device_id = ? WHERE id = ?`,
          [actualDeviceId, id]
        );
        console.log(`🆕 Created new device ${actualDeviceId} for external-legacy report ${id}`);
        
        // إنشاء السجل في الجدول التفصيلي المناسب (فقط إذا لم يكن موجوداً)
        if (device_type === "Printer" || device_type === "printer") {
          console.log(`🖨️ Checking if Printer_info record exists for serial: ${serial_number}`);
          const [existingPrinter] = await db.promise().query(
            `SELECT 1 FROM Printer_info WHERE Serial_Number = ? LIMIT 1`,
            [serial_number]
          );
          
          if (existingPrinter.length === 0) {
            console.log(`🖨️ Creating new Printer_info record for serial: ${serial_number}`);
            let inkTypeId = Number(updatedData.ink_type_id);
            if ((!inkTypeId || isNaN(inkTypeId)) && updatedData.ink_type) {
              inkTypeId = await getOrCreateId("Ink_Types", "ink_type", updatedData.ink_type.trim());
            }
            const newInkSerialStr = updatedData.ink_serial_number?.trim() || null;
            const inkSerialId = newInkSerialStr ? await getOrCreateinkId("Ink_Serials", "serial_number", newInkSerialStr) : null;
            let printerTypeId = Number(updatedData.printer_type_id);
            if ((!printerTypeId || isNaN(printerTypeId)) && updatedData.printer_type) {
              printerTypeId = await getOrCreateId("Printer_Types", "printer_type", updatedData.printer_type.trim());
            }
            await db.promise().query(`
              INSERT INTO Printer_info (Serial_Number, Printer_Name, Governmental_Number, Department, InkType_id, InkSerial_id, PrinterType_id, Model_id)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [serial_number, device_name, governmental_number, departmentId, inkTypeId, inkSerialId, printerTypeId, modelId]);
            console.log(`✅ Created new Printer_info record for serial: ${serial_number}`);
          } else {
            console.log(`✅ Printer_info record already exists for serial: ${serial_number}`);
          }
        } else if (device_type === "PC") {
          console.log(`🖥️ Checking if PC_info record exists for serial: ${serial_number}`);
          const [existingPC] = await db.promise().query(
            `SELECT 1 FROM PC_info WHERE Serial_Number = ? LIMIT 1`,
            [serial_number]
          );
          
          if (existingPC.length === 0) {
            console.log(`🖥️ Creating new PC_info record for serial: ${serial_number}`);
            await db.promise().query(`
              INSERT INTO PC_info (Serial_Number, Computer_Name, Governmental_Number, Department, Model_id, Mac_Address, Ip_Address)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [serial_number, device_name, governmental_number, departmentId, modelId, mac_address, ip_address]);
            console.log(`✅ Created new PC_info record for serial: ${serial_number}`);
          } else {
            console.log(`✅ PC_info record already exists for serial: ${serial_number}`);
          }
        } else if (device_type === "Scanner" || device_type === "scanner") {
          console.log(`📷 Checking if Scanner_info record exists for serial: ${serial_number}`);
          const [existingScanner] = await db.promise().query(
            `SELECT 1 FROM Scanner_info WHERE Serial_Number = ? LIMIT 1`,
            [serial_number]
          );
          
          if (existingScanner.length === 0) {
            console.log(`📷 Creating new Scanner_info record for serial: ${serial_number}`);
            let scannerTypeId = Number(updatedData.scanner_type_id);
            if ((!scannerTypeId || isNaN(scannerTypeId)) && updatedData.scanner_type) {
              scannerTypeId = await getOrCreateId("Scanner_Types", "scanner_type", updatedData.scanner_type.trim());
            }
            await db.promise().query(`
              INSERT INTO Scanner_info (Serial_Number, Scanner_Name, Governmental_Number, Department, ScannerType_id, Model_id)
              VALUES (?, ?, ?, ?, ?, ?)
            `, [serial_number, device_name, governmental_number, departmentId, scannerTypeId, modelId]);
            console.log(`✅ Created new Scanner_info record for serial: ${serial_number}`);
          } else {
            console.log(`✅ Scanner_info record already exists for serial: ${serial_number}`);
          }
        }
      }
    }
  }
}

console.log(`✅ Final actualDeviceId for external-legacy: ${actualDeviceId}`);

// تحديث External_Maintenance مع جميع المواصفات والقسم
await updateExternalMaintenanceInfo(actualDeviceId, updatedData, id, source);

// تحديث Maintenance_Reports لربط التقرير بالجهاز إذا لم يكن مرتبطاً
if (actualDeviceId && !reportOld.device_id) {
  await db.promise().query(
    `UPDATE Maintenance_Reports SET device_id = ? WHERE id = ?`,
    [actualDeviceId, id]
  );
  console.log(`🔗 Linked report ${id} to device ${actualDeviceId}`);
}

// جب بيانات الجهاز القديم باستخدام نفس الـ ID
if (actualDeviceId) {
  const [rows] = await db.promise().query(
    `SELECT * FROM Maintenance_Devices WHERE id = ? LIMIT 1`,
    [actualDeviceId]
  );
  oldDevice = rows[0] || {};
}

// تحديث الجداول الأخرى لجميع أنواع التقارير (بما في ذلك الصيانة الخارجية)
console.log(`🔧 Starting device updates for actualDeviceId: ${actualDeviceId}, Source: ${source}`);

// تحديث Maintenance_Devices إذا كان actualDeviceId موجود
if (actualDeviceId) {
  const oldSerial = oldDevice.serial_number?.trim();
  const newSerial = serial_number?.trim();
  const isValidMac = (mac) => /^([0-9A-F]{2}[:-]){5}([0-9A-F]{2})$/i.test(mac);
  const isValidIp = (ip) => /^((25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.|$)){4}$/.test(ip);

  if (ip_address && !isValidIp(ip_address)) {
    return res.status(400).json({ error: " عنوان IP غير صالح. مثال صحيح: 192.168.1.1" });
  }

  if (mac_address && !isValidMac(mac_address)) {
    return res.status(400).json({ error: " عنوان MAC غير صالح. مثال صحيح: 00:1A:2B:3C:4D:5E" });
  }
  
  console.log(`🔧 Updating existing device ${actualDeviceId} in Maintenance_Devices`);
  
  // ✅ طباعة لتأكيد الفرق
  console.log("🧾 Comparing old vs new serial");
  console.log("🔴 old:", oldSerial);
  console.log("🟢 new:", newSerial);

  // تحسين شرط الفحص - إزالة استثناء الصيانة الخارجية:
  if (
    oldSerial && newSerial &&
    oldSerial !== newSerial &&
    newSerial !== "" &&
    newSerial !== null
  ) {
    const [conflictRows] = await db.promise().query(
      `SELECT id FROM Maintenance_Devices WHERE serial_number = ? AND id != ?`,
      [newSerial, actualDeviceId]
    );
    if (conflictRows.length > 0) {
      // أضف رقم الجهاز المسبب للتعارض في الرسالة
      return res.status(400).json({ error: `❌ الرقم التسلسلي مستخدم مسبقًا من قبل جهاز آخر (ID: ${conflictRows[0].id})` });
    }

    // تحديث الجداول المرتبطة...
    const tablesToUpdate = [
      { table: 'PC_info', field: 'Serial_Number' },
      { table: 'Printer_info', field: 'Serial_Number' },
      { table: 'Scanner_info', field: 'Serial_Number' },
      { table: 'General_Maintenance', field: 'serial_number' },
      { table: 'Regular_Maintenance', field: 'serial_number' },
      { table: 'External_Maintenance', field: 'serial_number' }
    ];
    for (const { table, field } of tablesToUpdate) {
      await db.promise().query(
        `UPDATE ${table} SET ${field} = ? WHERE ${field} = ?`,
        [newSerial, oldSerial]
      );
    }

    console.log("📦 modelId to update:", modelId);

    // ✅ تحديث Serial Number أولًا
    await db.promise().query(
      `UPDATE Maintenance_Devices SET serial_number = ? WHERE id = ?`,
      [newSerial, actualDeviceId]
    );
    oldDevice.serial_number = newSerial;
  }

  // الآن نعرّف مصفوفة التحديثات والقيم قبل طباعتهما
  const updates = [
    "device_type = ?", 
    "device_name = ?", 
    "governmental_number = ?", 
    "department_id = ?"
  ];
  const values = [
    device_type, 
    device_name, 
    governmental_number, 
    departmentId
  ];

  console.log("🎯 modelId from getOrCreateModelId:", modelId);

  updates.push("model_id = ?");
  values.push(modelId || null);

  if (isPrinter && serial_number && modelId) {
    const [existingPrinter] = await db.promise().query(
      `SELECT 1 FROM Printer_info WHERE Serial_Number = ? LIMIT 1`,
      [serial_number]
    );
    if (existingPrinter.length > 0) {
      await db.promise().query(
        `UPDATE Printer_info SET Model_id = ? WHERE Serial_Number = ?`,
        [modelId, serial_number]
      );
    }
  }
  if (isScanner && serial_number && modelId) {
    const [existingScanner] = await db.promise().query(
      `SELECT 1 FROM Scanner_info WHERE Serial_Number = ? LIMIT 1`,
      [serial_number]
    );
    if (existingScanner.length > 0) {
      await db.promise().query(
        `UPDATE Scanner_info SET Model_id = ? WHERE Serial_Number = ?`,
        [modelId, serial_number]
      );
    }
  }
  if (isPC && serial_number && modelId) {
    const [existingPC] = await db.promise().query(
      `SELECT 1 FROM PC_info WHERE Serial_Number = ? LIMIT 1`,
      [serial_number]
    );
    if (existingPC.length > 0) {
      await db.promise().query(
        `UPDATE PC_info SET Model_id = ? WHERE Serial_Number = ?`,
        [modelId, serial_number]
      );
    }
  }

  if (isPC) {
    updates.push(
      "cpu_id = ?", 
      "ram_id = ?", 
      "os_id = ?", 
      "generation_id = ?",
      "drive_id = ?", 
      "ram_size_id = ?", 
      "mac_address = ?", 
      "ip_address = ?"
    );
    values.push(cpuId, ramId, osId, generationId, driveId, ramSizeId, mac_address, ip_address);
  }

  // يمكن الآن طباعتهما بأمان
  console.log(
    " Final SQL:", 
    `UPDATE Maintenance_Devices SET ${updates.join(", ")} WHERE id = ?`
  );
  console.log("📥 Values:", values);

  // ثم ننفّذ التحديث
  values.push(actualDeviceId);
  await db.promise().query(
    `UPDATE Maintenance_Devices SET ${updates.join(", ")} WHERE id = ?`,
    values
  );
}

// تحديث Maintenance_Devices بالرقم التسلسلي إذا لم يكن actualDeviceId موجود
if (!actualDeviceId && serial_number) {
  console.log(`🔧 Updating Maintenance_Devices by serial number: ${serial_number}`);
  
  const maintenanceUpdates = [
    "device_name = ?", "governmental_number = ?", "department_id = ?", 
    "model_id = ?", "mac_address = ?", "ip_address = ?"
  ];
  const maintenanceValues = [
    device_name, governmental_number, departmentId, modelId, mac_address, ip_address
  ];

  if (isPC) {
    maintenanceUpdates.push("cpu_id = ?", "ram_id = ?", "os_id = ?", "generation_id = ?", "drive_id = ?", "ram_size_id = ?");
    maintenanceValues.push(cpuId, ramId, osId, generationId, driveId, ramSizeId);
  }

  maintenanceValues.push(serial_number);
  await db.promise().query(`
    UPDATE Maintenance_Devices 
    SET ${maintenanceUpdates.join(", ")}
    WHERE serial_number = ?
  `, maintenanceValues);
  
  console.log(`✅ Maintenance_Devices updated by serial number`);
}

// تحديث الجداول التفصيلية لجميع أنواع التقارير (بما في ذلك الصيانة الخارجية)
console.log(`🔧 Starting detailed table updates for source: ${source}`);

// تحديث PC_info
if ((isPC || device_type === "PC") && serial_number) {
  console.log(`🖥️ Updating PC_info for serial: ${serial_number}`);
  const [existingPC] = await db.promise().query(
    `SELECT 1 FROM PC_info WHERE Serial_Number = ? LIMIT 1`,
    [serial_number]
  );
  
  if (existingPC.length > 0) {
    await db.promise().query(`
      UPDATE PC_info
      SET Computer_Name = ?,  Processor_id = ?, RAM_id = ?, RamSize_id = ?, OS_id = ?, Generation_id = ?, Drive_id = ?, Mac_Address = ? ,Ip_Address = ?
      WHERE Serial_Number = ?
    `, [device_name, cpuId,  ramId, ramSizeId, osId, generationId, driveId, mac_address, ip_address, serial_number]);
    console.log(`✅ PC_info updated successfully`);
  } else {
    console.log(`⚠️ PC_info record not found for serial: ${serial_number}, skipping update`);
  }
}

// تحديث Printer_info
if ((device_type === "printer" || device_type === "Printer") && serial_number) {
  console.log(`🖨️ Updating Printer_info for serial: ${serial_number}`);
  
  const [existingPrinter] = await db.promise().query(
    `SELECT 1 FROM Printer_info WHERE Serial_Number = ? LIMIT 1`,
    [serial_number]
  );
  
  if (existingPrinter.length > 0) {
    // 1) حضّر inkTypeId
    let inkTypeId = Number(updatedData.ink_type_id);
    if ((!inkTypeId || isNaN(inkTypeId)) && updatedData.ink_type) {
      inkTypeId = await getOrCreateId(
        "Ink_Types",
        "ink_type",
        updatedData.ink_type.trim()
      );
    }

    // 2) حضّر inkSerialId
    const newInkSerialStr = updatedData.ink_serial_number?.trim() || null;
    const inkSerialId = newInkSerialStr
      ? await getOrCreateinkId("Ink_Serials", "serial_number", newInkSerialStr)
      : null;

    // 3) حضّر printerTypeId
    let printerTypeId = Number(updatedData.printer_type_id);
    if ((!printerTypeId || isNaN(printerTypeId)) && updatedData.printer_type) {
      printerTypeId = await getOrCreateId(
        "Printer_Types",
        "printer_type",
        updatedData.printer_type.trim()
      );
    }

    // 4) استخدم دائمًاًً الـ serial_number المحدث
    const serialKey = serial_number.trim(); // من updatedData

    await db.promise().query(
      `UPDATE Printer_info
         SET 
             Printer_Name   = ?,
             Governmental_Number = ?,
             Department     = ?,
          InkType_id     = ?,
             InkSerial_id   = ?,
             PrinterType_id = ?
       WHERE Serial_Number = ?`,
      [ device_name, governmental_number, departmentId, inkTypeId, inkSerialId, printerTypeId, serialKey]
    );
    console.log(`✅ Printer_info updated successfully`);
  } else {
    console.log(`⚠️ Printer_info record not found for serial: ${serial_number}, skipping update`);
  }
}

// تحديث Scanner_info
if ((device_type === "scanner" || device_type === "Scanner") && serial_number) {
  console.log(`📷 Updating Scanner_info for serial: ${serial_number}`);
  
  const [existingScanner] = await db.promise().query(
    `SELECT 1 FROM Scanner_info WHERE Serial_Number = ? LIMIT 1`,
    [serial_number]
  );
  
  if (existingScanner.length > 0) {
    // خذ القيمة القديمة أو الجديدة
    let scannerTypeId = Number(updatedData.scanner_type_id);
    // لو ما عندنا ID صالح لكن عندنا اسم جديد:
    if ((!scannerTypeId || isNaN(scannerTypeId)) && updatedData.scanner_type) {
      scannerTypeId = await getOrCreateId(
        "Scanner_Types",
        "scanner_type",
        updatedData.scanner_type.trim()
      );
    }

    await db.promise().query(
      `UPDATE Scanner_info
       SET
         Scanner_Name        = ?,
         Governmental_Number = ?,
         Department          = ?,
         ScannerType_id      = ?
       WHERE Serial_Number = ?`,
      [
        device_name,
        governmental_number,
        departmentId,
        scannerTypeId,
        serial_number
      ]
    );
    console.log(`✅ Scanner_info updated successfully`);
  } else {
    console.log(`⚠️ Scanner_info record not found for serial: ${serial_number}, skipping update`);
  }
}

// تحديث الجداول المشتركة لجميع أنواع التقارير
if (serial_number) {
  console.log(`🔄 Updating shared tables for ${source} maintenance with serial: ${serial_number}`);
  
  const sharedParams = [
    device_name, serial_number, governmental_number, department_name,
    model_name, cpu_name, ram_type, os_name, generation_number, drive_type,
    ram_size, updatedData.ink_type, updatedData.ink_serial_number, updatedData.printer_type, mac_address, ip_address, scanner_type
  ];

  // تحديث General_Maintenance بالرقم التسلسلي
  await db.promise().query(`
    UPDATE General_Maintenance 
    SET device_name = ?, governmental_number = ?, department_name = ?, 
        model_name = ?, cpu_name = ?, ram_type = ?, os_name = ?, generation_number = ?, 
        drive_type = ?, ram_size = ?, ink_type = ?, ink_serial_number = ?, printer_type = ?, 
        mac_address = ?, ip_address = ?, scanner_type = ? 
    WHERE serial_number = ?
  `, [...sharedParams, serial_number]);

  // تحديث Regular_Maintenance بالرقم التسلسلي
  await db.promise().query(`
    UPDATE Regular_Maintenance 
    SET device_name = ?, governmental_number = ?, department_name = ?, 
        model_name = ?, cpu_name = ?, ram_type = ?, ram_size = ?, os_name = ?, 
        generation_number = ?, drive_type = ?, ink_type = ?, ink_serial_number = ?, 
        printer_type = ?, mac_address = ?, ip_address = ?, scanner_type = ? 
    WHERE serial_number = ?
  `, [device_name, governmental_number, department_name, model_name, cpu_name, ram_type, 
      ram_size, os_name, generation_number, drive_type, updatedData.ink_type, updatedData.ink_serial_number, 
      updatedData.printer_type, mac_address, ip_address, scanner_type, serial_number]);

  // تحديث External_Maintenance بالرقم التسلسلي
  await db.promise().query(`
    UPDATE External_Maintenance 
    SET device_name = ?, governmental_number = ?, department_name = ?, 
        model_name = ?, cpu_name = ?, ram_type = ?, os_name = ?, generation_number = ?, 
        drive_type = ?, ram_size = ?, ink_type = ?, ink_serial_number = ?, printer_type = ?, 
        mac_address = ?, ip_address = ?, scanner_type = ? 
    WHERE serial_number = ?
  `, [...sharedParams, serial_number]);

  // تحديث Maintenance_Devices بالرقم التسلسلي (فقط إذا لم يتم تحديثه مسبقاً)
  if (!actualDeviceId) {
    const maintenanceUpdates = [
      "device_name = ?", "governmental_number = ?", "department_id = ?", 
      "model_id = ?", "mac_address = ?", "ip_address = ?"
    ];
    const maintenanceValues = [
      device_name, governmental_number, departmentId, modelId, mac_address, ip_address
    ];

    if (isPC) {
      maintenanceUpdates.push("cpu_id = ?", "ram_id = ?", "os_id = ?", "generation_id = ?", "drive_id = ?", "ram_size_id = ?");
      maintenanceValues.push(cpuId, ramId, osId, generationId, driveId, ramSizeId);
    }

    maintenanceValues.push(serial_number);
    await db.promise().query(`
      UPDATE Maintenance_Devices 
      SET ${maintenanceUpdates.join(", ")}
      WHERE serial_number = ?
    `, maintenanceValues);
  }

  console.log(`✅ Updated shared tables for ${source} maintenance with serial: ${serial_number}`);
}

// تحديث إضافي للصيانة الخارجية: تحديث External_Maintenance باستخدام ID التقرير
if (source === "external-legacy" || source === "external-new") {
  console.log(`🔧 Final External_Maintenance update for ${source} with report ID: ${id}`);
  await updateExternalMaintenanceInfo(actualDeviceId, updatedData, id, source);
  
  // تحسين إضافي: تأكد من تحديث جميع الجداول المشتركة للصيانة الخارجية
  if (serial_number) {
    console.log(`🔄 Final verification: Updating all shared tables for external maintenance`);
    
    // تحديث إضافي للجداول المشتركة بالرقم التسلسلي
    const finalSharedParams = [
      device_name, serial_number, governmental_number, department_name,
      model_name, cpu_name, ram_type, os_name, generation_number, drive_type,
      ram_size, updatedData.ink_type, updatedData.ink_serial_number, updatedData.printer_type, mac_address, ip_address, scanner_type
    ];

    // تحديث نهائي لـ External_Maintenance بالرقم التسلسلي
    await db.promise().query(`
      UPDATE External_Maintenance 
      SET device_name = ?, governmental_number = ?, department_name = ?, 
          model_name = ?, cpu_name = ?, ram_type = ?, os_name = ?, generation_number = ?, 
          drive_type = ?, ram_size = ?, ink_type = ?, ink_serial_number = ?, printer_type = ?, 
          mac_address = ?, ip_address = ?, scanner_type = ? 
      WHERE serial_number = ?
    `, [...finalSharedParams, serial_number]);

    // تحديث نهائي لـ General_Maintenance بالرقم التسلسلي
    await db.promise().query(`
      UPDATE General_Maintenance 
      SET device_name = ?, governmental_number = ?, department_name = ?, 
          model_name = ?, cpu_name = ?, ram_type = ?, os_name = ?, generation_number = ?, 
          drive_type = ?, ram_size = ?, ink_type = ?, ink_serial_number = ?, printer_type = ?, 
          mac_address = ?, ip_address = ?, scanner_type = ? 
      WHERE serial_number = ?
    `, [...finalSharedParams, serial_number]);

    // تحديث نهائي لـ Regular_Maintenance بالرقم التسلسلي
    await db.promise().query(`
      UPDATE Regular_Maintenance 
      SET device_name = ?, governmental_number = ?, department_name = ?, 
          model_name = ?, cpu_name = ?, ram_type = ?, ram_size = ?, os_name = ?, 
          generation_number = ?, drive_type = ?, ink_type = ?, ink_serial_number = ?, 
          printer_type = ?, mac_address = ?, ip_address = ?, scanner_type = ? 
      WHERE serial_number = ?
    `, [device_name, governmental_number, department_name, model_name, cpu_name, ram_type, 
        ram_size, os_name, generation_number, drive_type, updatedData.ink_type, updatedData.ink_serial_number, 
        updatedData.printer_type, mac_address, ip_address, scanner_type, serial_number]);

    console.log(`✅ Final verification completed for external maintenance`);
  }
}

// تحديث نهائي للجداول التفصيلية لجميع أنواع الصيانة
if (serial_number) {
  console.log(`🔄 Final detailed table updates for all maintenance types with serial: ${serial_number}`);
  
  // تحديث نهائي لـ PC_info
  if (isPC || device_type === "PC") {
    console.log(`🖥️ Final PC_info update for serial: ${serial_number}`);
    const [existingPC] = await db.promise().query(
      `SELECT 1 FROM PC_info WHERE Serial_Number = ? LIMIT 1`,
      [serial_number]
    );
    
    if (existingPC.length > 0) {
      await db.promise().query(`
        UPDATE PC_info
        SET Computer_Name = ?, Processor_id = ?, RAM_id = ?, RamSize_id = ?, OS_id = ?, Generation_id = ?, Drive_id = ?, Mac_Address = ?, Ip_Address = ?
        WHERE Serial_Number = ?
      `, [device_name, cpuId, ramId, ramSizeId, osId, generationId, driveId, mac_address, ip_address, serial_number]);
      console.log(`✅ Final PC_info update completed`);
    } else {
      console.log(`⚠️ PC_info record not found for serial: ${serial_number}, skipping update`);
    }
  }

  // تحديث نهائي لـ Printer_info
  if (device_type === "printer" || device_type === "Printer") {
    console.log(`🖨️ Final Printer_info update for serial: ${serial_number}`);
    
    const [existingPrinter] = await db.promise().query(
      `SELECT 1 FROM Printer_info WHERE Serial_Number = ? LIMIT 1`,
      [serial_number]
    );
    
    if (existingPrinter.length > 0) {
      // حضّر inkTypeId
      let inkTypeId = Number(updatedData.ink_type_id);
      if ((!inkTypeId || isNaN(inkTypeId)) && updatedData.ink_type) {
        inkTypeId = await getOrCreateId("Ink_Types", "ink_type", updatedData.ink_type.trim());
      }

      // حضّر inkSerialId
      const newInkSerialStr = updatedData.ink_serial_number?.trim() || null;
      const inkSerialId = newInkSerialStr ? await getOrCreateinkId("Ink_Serials", "serial_number", newInkSerialStr) : null;

      // حضّر printerTypeId
      let printerTypeId = Number(updatedData.printer_type_id);
      if ((!printerTypeId || isNaN(printerTypeId)) && updatedData.printer_type) {
        printerTypeId = await getOrCreateId("Printer_Types", "printer_type", updatedData.printer_type.trim());
      }

      await db.promise().query(`
        UPDATE Printer_info
        SET Printer_Name = ?, Governmental_Number = ?, Department = ?, InkType_id = ?, InkSerial_id = ?, PrinterType_id = ?
        WHERE Serial_Number = ?
      `, [device_name, governmental_number, departmentId, inkTypeId, inkSerialId, printerTypeId, serial_number]);
      console.log(`✅ Final Printer_info update completed`);
    } else {
      console.log(`⚠️ Printer_info record not found for serial: ${serial_number}, skipping update`);
    }
  }

  // تحديث نهائي لـ Scanner_info
  if (device_type === "scanner" || device_type === "Scanner") {
    console.log(`📷 Final Scanner_info update for serial: ${serial_number}`);
    
    const [existingScanner] = await db.promise().query(
      `SELECT 1 FROM Scanner_info WHERE Serial_Number = ? LIMIT 1`,
      [serial_number]
    );
    
    if (existingScanner.length > 0) {
      let scannerTypeId = Number(updatedData.scanner_type_id);
      if ((!scannerTypeId || isNaN(scannerTypeId)) && updatedData.scanner_type) {
        scannerTypeId = await getOrCreateId("Scanner_Types", "scanner_type", updatedData.scanner_type.trim());
      }

      await db.promise().query(`
        UPDATE Scanner_info
        SET Scanner_Name = ?, Governmental_Number = ?, Department = ?, ScannerType_id = ?
        WHERE Serial_Number = ?
      `, [device_name, governmental_number, departmentId, scannerTypeId, serial_number]);
      console.log(`✅ Final Scanner_info update completed`);
    } else {
      console.log(`⚠️ Scanner_info record not found for serial: ${serial_number}, skipping update`);
    }
  }

  console.log(`✅ Final detailed table updates completed for all maintenance types`);
}

  if (changes.length > 0) {
    // جلب اسم المستخدم من req.user
    const userId = req.user.id;
    const [[userRow]] = await db.promise().query(
      'SELECT name FROM users WHERE id = ?',
      [userId]
    );
    const userName = userRow?.name || 'Unknown';
    const fieldLabelMap = {
      "Issue Summary":      { en: "Issue Summary",      ar: "ملخص المشكلة" },
      "Description":        { en: "Description",        ar: "الوصف" },
      "Priority":           { en: "Priority",           ar: "الأولوية" },
      "Status":             { en: "Status",             ar: "الحالة" },
      "Assigned To":        { en: "Assigned To",        ar: "المسند إليه" },
      "Category":           { en: "Category",           ar: "الفئة" },
      "Device Name":        { en: "Device Name",        ar: "اسم الجهاز" },
      "Serial Number":      { en: "Serial Number",      ar: "الرقم التسلسلي" },
      "Governmental Number":{ en: "Governmental Number",ar: "الرقم الحكومي" },
      "IP Address":         { en: "IP Address",         ar: "عنوان IP" },
      "MAC Address":        { en: "MAC Address",        ar: "عنوان MAC" },
      "Model":              { en: "Model",              ar: "الموديل" },
      "Processor":          { en: "Processor",          ar: "المعالج" },
      "RAM":                { en: "RAM",                ar: "الذاكرة" },
      "RAM Size":           { en: "RAM Size",           ar: "حجم الذاكرة" },
      "OS":                 { en: "OS",                 ar: "نظام التشغيل" },
      "Generation":         { en: "Generation",         ar: "جيل المعالج" },
      "Drive Type":         { en: "Drive Type",         ar: "نوع القرص" },
      "Ink Type":           { en: "Ink Type",           ar: "نوع الحبر" },
      "Ink Serial":         { en: "Ink Serial",         ar: "سيريال الحبر" },
      "Printer Type":       { en: "Printer Type",       ar: "نوع الطابعة" },
      "Scanner Type":       { en: "Scanner Type",       ar: "نوع الماسح" },
      "Department":         { en: "Department",         ar: "القسم" }
      // أضف أي حقل آخر تحتاجه هنا
    };
    // سجل كل تغيير في لوق منفصل
    for (const change of changes) {
      // استخراج اسم الحقل من التغيير (مثلاً: "Device Name" أو "Status" ...)
      // إذا كان التغيير بصيغة: "Device Name: old → new"
      const match = change.match(/^(.+?):/);
      const field = match ? match[1].trim() : "";
      const label = fieldLabelMap[field] || { en: field, ar: field };
    
      await logActivity(
        userId,
        userName,
        JSON.stringify(makeBilingualLog("Edited", "تعديل")),
        JSON.stringify(makeBilingualLog(
          `Report ID ${id} changed: ${change.replace(field, label.en).trim()}`,
          `تم تعديل تقرير رقم ${id}: ${change.replace(field, label.ar).trim()}`
        ))
      );
    }
  }

  res.json({ message: "تم تحديث التقرير والجهاز والمواصفات بنجاح." });
} catch (err) {
  console.error("Error during update:", err);
  res.status(500).json({ error: "خطأ في الخادم أثناء التحديث" });
}
};

async function updateExternalMaintenanceInfo(deviceSpecId, data, reportId = null, source = null) {
  if (!deviceSpecId && !reportId) {
    console.warn("⚠️ missing deviceSpecId and reportId → cannot sync External_Maintenance");
    return;
  }

  try {
    console.log(`🔧 updateExternalMaintenanceInfo called with:`, {
      deviceSpecId,
      reportId,
      source,
      hasData: !!data
    });

    // For external-legacy, we need to fetch current data and merge with updates
    let mergedData = { ...data };
    
    if (source === "external-legacy" && reportId) {
      // Fetch current data from External_Maintenance
      const [[currentData]] = await db.promise().query(
        `SELECT * FROM External_Maintenance WHERE id = ?`,
        [reportId]
      );
      
      if (currentData) {
        console.log(`📋 Found existing External_Maintenance data for report ${reportId}`);
        // Merge current data with updates (updates take precedence)
        mergedData = {
          device_name:        data.device_name ?? currentData.device_name,
          serial_number:      data.serial_number ?? currentData.serial_number,
          governmental_number:data.governmental_number ?? currentData.governmental_number,
          model_name:         data.model_name ?? currentData.model_name,
          department_name:    data.department_name ?? currentData.department_name,
          cpu_name:           data.cpu_name ?? currentData.cpu_name,
          ram_type:           data.ram_type ?? currentData.ram_type,
          os_name:            data.os_name ?? currentData.os_name,
          generation_number:  data.generation_number ?? currentData.generation_number,
          drive_type:         data.drive_type ?? currentData.drive_type,
          ram_size:           data.ram_size ?? currentData.ram_size,
          mac_address:        data.mac_address ?? currentData.mac_address,
          ip_address:         data.ip_address ?? currentData.ip_address,
          ink_type:           data.ink_type ?? currentData.ink_type,
          ink_serial_number:  data.ink_serial_number ?? currentData.ink_serial_number,
          printer_type:       data.printer_type ?? currentData.printer_type,
          scanner_type:       data.scanner_type ?? currentData.scanner_type
        };
      } else {
        console.log(`⚠️ No existing External_Maintenance data found for report ${reportId}`);
      }
    }

    // 1) جهّز خريطة الحقول اللي بنحدثها - تشمل جميع المواصفات والقسم
    const map = {
      device_name:        mergedData.device_name,
      serial_number:      mergedData.serial_number,
      governmental_number:mergedData.governmental_number,
      model_name:         mergedData.model_name,
      department_name:    mergedData.department_name,
      cpu_name:           mergedData.cpu_name,
      ram_type:           mergedData.ram_type,
      os_name:            mergedData.os_name,
      generation_number:  mergedData.generation_number,
      drive_type:         mergedData.drive_type,
      ram_size:           mergedData.ram_size,
      mac_address:        mergedData.mac_address,
      ip_address:         mergedData.ip_address,
      ink_type:           mergedData.ink_type,
      ink_serial_number:  mergedData.ink_serial_number,
      printer_type:       mergedData.printer_type,
      scanner_type:       mergedData.scanner_type
    };

    // 2) صفّي الحقول والقيم - نأخذ فقط الحقول التي لها قيم
    const fields  = Object.keys(map).filter(k => mergedData[k] !== undefined && mergedData[k] !== null && mergedData[k] !== "");
    const updates = fields.map(k => `${k} = ?`);
    const values  = fields.map(k => map[k]);

    console.log(`📝 Fields to update:`, fields);
    console.log(`📝 Values:`, values);

    // 3) حدد شرط WHERE بناءً على المصدر
    let whereClause, whereValue;
    
    if (source === "external-legacy" && reportId) {
      // للحالات القديمة، نستخدم id
      whereClause = "id = ?";
      whereValue = reportId;
      console.log(`🎯 Using WHERE clause: ${whereClause} = ${whereValue}`);
    } else if (deviceSpecId) {
      // للحالات الجديدة، نستخدم device_specifications
      whereClause = "device_specifications = ?";
      whereValue = deviceSpecId;
      console.log(`🎯 Using WHERE clause: ${whereClause} = ${whereValue}`);
    } else {
      console.warn("⚠️ No valid WHERE condition for External_Maintenance update");
      return;
    }

    // 4) أضف قيمة WHERE في الأخير
    values.push(whereValue);

    // 5) نفّذ التحديث
    if (fields.length > 0) {
      const sql = `UPDATE External_Maintenance SET ${updates.join(", ")} WHERE ${whereClause}`;
      console.log(`🔧 Executing SQL:`, sql);
      console.log(`🔧 With values:`, values);
      
      const [result] = await db.promise().query(sql, values);
      console.log("✅ External_Maintenance updated with fields:", fields);
      console.log("✅ External_Maintenance affectedRows =", result.affectedRows);
      
      if (result.affectedRows === 0) {
        console.warn(`⚠️ No rows were updated in External_Maintenance. This might indicate the record doesn't exist.`);
      }
    } else {
      console.log("ℹ️ No fields to update in External_Maintenance");
    }
  } catch (error) {
    console.error("❌ Error updating External_Maintenance:", error);
    throw error; // Re-throw to be handled by the calling function
  }
}

async function getOrCreateId(table, column, value) {
  if (!value || value.toString().trim() === "") return null;

  const trimmed = value.toString().trim();

  const [rows] = await db.promise().query(
    `SELECT id FROM ${table} WHERE ${column} = ? LIMIT 1`,
    [trimmed]
  );

  if (rows.length > 0) {
    return rows[0].id;
  }
}
async function getOrCreateinkId(table, column, value) {
  if (!value || value.toString().trim() === "") return null;

  const trimmed = value.toString().trim();

  const [rows] = await db.promise().query(
    `SELECT id FROM ${table} WHERE ${column} = ? LIMIT 1`,
    [trimmed]
  );

  if (rows.length > 0) {
    return rows[0].id;
  } else {
    const [result] = await db.promise().query(
      `INSERT INTO ${table} (${column}) VALUES (?)`,
      [trimmed]
    );
    return result.insertId;
  }

}

async function getOrCreateDepartment(rawDept) {
  if (!rawDept || rawDept.toString().trim() === "") {
    return null;
  }

  // نفترض أنّ rawDept مكتوب على شكل "English Part|Arabic Part"
  const trimmed = rawDept.trim();
  // نقسم القسم إلى جزأين بناءً على الفاصل "|"
  const parts = trimmed.split("|").map(s => s.trim());
  // الجزء الإنجليزي دائمًا هو الجزء الأول، والعربي هو الجزء الأخير
  const enName = parts[0] || "";
  const arName = parts.length > 1 ? parts[1] : "";

  // 1) نحاول أن نجد السطر بناءً على أي منهما
  const [rows] = await db.promise().query(
    `
      SELECT id
      FROM Departments
      WHERE
        TRIM(SUBSTRING_INDEX(name, '|', 1)) = ?
        OR TRIM(SUBSTRING_INDEX(name, '|', -1)) = ?
      LIMIT 1
    `,
    [enName, arName]
  );

  if (rows.length > 0) {
    // وجدناه، نُرجع الـ id فقط
    return rows[0].id;
  }


}
  // 🔁 دوال المساعدة

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
    });
  }

  function makeBilingualLog(english, arabic) {
    return { en: english, ar: arabic };
  }

async function getOrCreateId(table, column, value) {
  if (!value || value.toString().trim() === "") return null;

  const trimmed = value.toString().trim();

  const [rows] = await db.promise().query(
    `SELECT id FROM ${table} WHERE ${column} = ? LIMIT 1`,
    [trimmed]
  );

  if (rows.length > 0) {
    return rows[0].id;
  }
}

module.exports = {
  updateReportFull
}; 
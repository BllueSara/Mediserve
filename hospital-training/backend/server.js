const express = require("express");
const cors = require("cors");
const db = require("./db");
const path = require("path");
const jwt = require('jsonwebtoken');
const app = express();
const port = 5050;
const JWT_SECRET = 'super_secret_key_123';

app.use(express.json());
app.use(cors());

// Serve static files from all directories
app.use(express.static(path.join(__dirname)));
app.use(express.static(path.join(__dirname, '..')));
app.use(express.static(path.join(__dirname, '..', '..')));

app.get("/", (req, res) => {
  res.send("🚀 Server is running!");
});


const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve(__dirname, "uploads")); // ← يضمن أنه يروح للمجلد الصح
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;  // ← هنا يصير معك user.id في كل route
    next();
  });
}


// إعداد رفع ملف واحد فقط باسم `attachment`
const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // ✅ يقبل أي نوع من الملفات
    console.log("📥 Received file:", file.originalname, "| Type:", file.mimetype);
    cb(null, true);
  }
});



app.get("/floors", (req, res) => {
  const query = "SELECT * FROM Floors";
  db.query(query, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(result);
  });
});


app.get("/Technical", (req, res) => {
  const query = "SELECT * FROM Engineers";
  db.query(query, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(result);
  });
});

// ✅ جلب جميع أنواع Hard Drive
app.get("/Hard_Drive_Types", (req, res) => {
  db.query("SELECT * FROM Hard_Drive_Types", (err, result) => {
    if (err) {
      console.error("❌ Error fetching hard drives:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(result);
  });
});
app.get("/RAM_Sizes", (req, res) => {
  db.query("SELECT * FROM RAM_Sizes", (err, result) => {
    if (err) {
      console.error("❌ Error fetching RAM Sizes:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(result);
  });
});
app.get("/DeviceType", (req, res) => {
  db.query("SELECT * FROM DeviceType", (err, result) => {
    if (err) {
      console.error("❌ Error fetching device types:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(result);
  });
});


app.get('/TypeProplem', authenticateToken, (req, res) => {
  const role = req.user.role;  // هذا يجيك من التوكن
  db.query("SELECT * FROM DeviceType", (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deviceTypes: result, role });
  });
});

app.get("/problem-states/:deviceType", (req, res) => {
  const rawType = req.params.deviceType.toLowerCase().trim();

  const typeMap = {
    pc: ['pc', 'desktop', 'laptop', 'كمبيوتر', 'لابتوب'],
    printer: ['printer', 'طابعة'],
    scanner: ['scanner', 'سكانر']
  };

  let matchedType = null;

  for (const [key, aliases] of Object.entries(typeMap)) {
    if (aliases.includes(rawType)) {
      matchedType = key;
      break;
    }
  }

  if (rawType === 'all-devices') {
    const sql = `
      SELECT problem_text, 'PC' AS device_type FROM ProblemStates_Pc
      UNION ALL
      SELECT problem_text, 'Printer' AS device_type FROM ProblemStates_Printer
      UNION ALL
      SELECT problem_text, 'Scanner' AS device_type FROM ProblemStates_Scanner
    `;
    db.query(sql, (err, results) => {
      if (err) {
        console.error("❌ Error fetching all problem states:", err);
        return res.status(500).json({ error: "Server error" });
      }
      res.json(results);
    });
  } else if (matchedType) {
    const tableName = {
      pc: 'ProblemStates_Pc',
      printer: 'ProblemStates_Printer',
      scanner: 'ProblemStates_Scanner'
    }[matchedType];

    db.query(`SELECT * FROM ${tableName}`, (err, result) => {
      if (err) {
        console.error("❌ DB Error:", err);
        return res.status(500).json({ error: "Server error" });
      }
      res.json(result);
    });
  } else {
    db.query(
      "SELECT problemStates_Maintance_device_name FROM `problemStates_Maintance_device` WHERE device_type_name = ?",
      [rawType],
      (err, results) => {
        if (err) {
          console.error("❌ DB Error:", err);
          return res.status(500).json({ error: "DB error" });
        }
        res.json(results);
      }
    );
  }
});



// 💾 راوت للمشكلة حق الصيانة
app.get("/problem-states/maintenance/:deviceType", (req, res) => {
  const { deviceType } = req.params;

  db.query(
    "SELECT problemStates_Maintance_device_name FROM `problemStates_Maintance_device` WHERE device_type_name = ?",
    [deviceType],
    (err, results) => {
      if (err) {
        console.error("❌ DB Error:", err);
        return res.status(500).json({ error: "DB error" });
      }
      res.json(results);
    }
  );
});



// ✅ كل الأجهزة
app.get('/all-devices-specs', (req, res) => {
  const sql = `
    SELECT 
      md.id, md.serial_number AS Serial_Number, md.governmental_number AS Governmental_Number,
      COALESCE(pc.Computer_Name, pr.Printer_Name, sc.Scanner_Name, md.device_name) AS name,
      md.device_type
    FROM Maintenance_Devices md
    LEFT JOIN PC_info pc 
      ON md.device_type = 'PC' AND md.serial_number = pc.Serial_Number AND md.governmental_number = pc.Governmental_Number
    LEFT JOIN Printer_info pr 
      ON md.device_type = 'Printer' AND md.serial_number = pr.Serial_Number AND md.governmental_number = pr.Governmental_Number
    LEFT JOIN Scanner_info sc 
      ON md.device_type = 'Scanner' AND md.serial_number = sc.Serial_Number AND md.governmental_number = sc.Governmental_Number
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Error fetching all device specs:", err);
      return res.status(500).json({ error: "Server error" });
    }
    res.json(results);
  });
});




app.get("/Departments", (req, res) => {
  const sql = `
    SELECT 
      id,
      name AS fullName
    FROM Departments
    ORDER BY name ASC;
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});




app.get("/CPU_Types", (req, res) => {
  const query = "SELECT * FROM CPU_Types";
  db.query(query, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(result);
  });
});


app.get("/RAM_Types", (req, res) => {
  const query = "SELECT * FROM RAM_Types";
  db.query(query, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(result);
  });
});

app.get("/Scanner_Types", (req, res) => {
  const query = "SELECT * FROM Scanner_Types ORDER BY scanner_type ASC";
  db.query(query, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(result);
  });
});

app.get("/OS_Types", (req, res) => {
  const query = "SELECT * FROM OS_Types";
  db.query(query, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(result);
  });
});


app.get("/Processor_Generations", (req, res) => {
  const query = "SELECT * FROM Processor_Generations";
  db.query(query, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(result);
  });
});


app.get("/PC_Model", (req, res) => {
  const query = "SELECT * FROM PC_Model";
  db.query(query, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(result);
  });
});


app.get("/Scanner_Model", (req, res) => {
  const query = "SELECT * FROM Scanner_Model";
  db.query(query, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(result);
  });
});

app.get("/Printer_Model", (req, res) => {
  const query = "SELECT * FROM Printer_Model";
  db.query(query, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(result);
  });
});

app.get('/Printer_Types', (req, res) => {
  db.query('SELECT * FROM Printer_Types', (err, results) => {
    if (err) {
      console.error('❌ Error fetching Printer_Types:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// ✅ Get Ink Types
app.get('/Ink_Types', (req, res) => {
  db.query('SELECT * FROM Ink_Types', (err, results) => {
    if (err) {
      console.error('❌ Error fetching Ink_Types:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

app.get("/device-specifications", (req, res) => {
  const query = `
    SELECT DISTINCT 
      CONCAT(device_name, ' - ', serial_number, ' - ', governmental_number) AS name 
    FROM Maintenance_Devices 
    ORDER BY name ASC
  `;

  db.query(query, (err, result) => {
    if (err) {
      console.error("❌ Error fetching device specifications:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(result);
  });
});
app.get("/device-spec/:id", authenticateToken, async (req, res) => {
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

    // ✅ أجهزة غير معروفة - نحاول نجيب موديلها على الأقل
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
});




app.post("/submit-external-maintenance", authenticateToken, async (req, res) => {
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

    // ✅ displayDevice صار بعد ما جبنا deviceInfo
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

    // 1️⃣ إدخال التقرير الأساسي
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





    // 🛎️ إشعار 1: تقرير الصيانة
    await queryAsync(`INSERT INTO Notifications (user_id, message, type) VALUES (?, ?, ?)`, [
      userId,
      `External maintenance report saved for ${deviceInfo.device_name} (${displayDevice}) problem is ${initial_diagnosis} by ${userName}`,
      'external-maintenance'
    ]);

    // 🛎️ إشعار 2: تلخيص التذكرة


    const reporterRes = await queryAsync(`SELECT id FROM users WHERE name = ?`, [reporter_name]);
    const reporterId = reporterRes[0]?.id;

    if (reporterId) {
      await queryAsync(`INSERT INTO Notifications (user_id, message, type) VALUES (?, ?, ?)`, [
        reporterId,
        `New external maintenance task assigned on ${deviceInfo.device_name} (${displayDevice}) by ${userName}`,
        'external-maintenance-assigned'
      ]);
    }

    await queryAsync(`
      INSERT INTO Activity_Logs (user_id, user_name, action, details)
      VALUES (?, ?, ?, ?)
    `, [
      userId,
      userName,
      'Submitted External Maintenance',
      `Submitted external maintenance for a ${deviceInfo.normalizedDeviceType} | Device Name: ${deviceInfo.device_name} | Serial: ${deviceInfo.serial_number} | Governmental No.: ${deviceInfo.governmental_number}`
    ]);


    res.json({ message: "✅ External maintenance, ticket summary, and notifications saved successfully." });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: "❌ Internal server error" });
  }
});



// ✅ GET Devices with ID from Maintenance_Devices

app.get("/devices/:type/:department", (req, res) => {
  const type = req.params.type.toLowerCase();         // مثلاً "pc"
  const departmentParam = req.params.department;      // مثلاً "دوق"

  // اولًا: نحصل على department_id من اسم القسم
  const findDeptSql = `
    SELECT id
    FROM Departments
    WHERE 
      SUBSTRING_INDEX(name, '|', 1) = ?
      OR SUBSTRING_INDEX(name, '|', -1) = ?
    LIMIT 1
  `;

  db.query(findDeptSql, [departmentParam, departmentParam], (err, deptRows) => {
    if (err) {
      console.error("❌ خطأ في جلب القسم:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (deptRows.length === 0) {
      // إذا لم يكن هناك قسم يطابق الاسم الإنكليزي أو العربي
      return res.json([]); // نرجع مصفوفة فارغة
    }

    const departmentId = deptRows[0].id; // مثلاً 144

    // ثانيًا: نُرجع كل الأجهزة التي تتطابق معها شروط device_type و department_id
    const sql = `
      SELECT
        md.id,
        md.device_type,
        md.device_name,
        md.serial_number       AS Serial_Number,
        md.governmental_number AS Governmental_Number
      FROM Maintenance_Devices AS md
      WHERE
        md.device_type = ?
        AND md.department_id = ?
        AND (md.is_deleted IS NULL OR md.is_deleted = FALSE)
    `;

    db.query(sql, [type, departmentId], (err2, deviceRows) => {
      if (err2) {
        console.error("❌ خطأ في جلب الأجهزة:", err2);
        return res.status(500).json({ error: "Database error" });
      }
      res.json(deviceRows);
    });
  });
});

// أضف هذه الدالة المساعدة مرة واحدة في ملفك (مثلاً أعلى الملف)
function queryAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}
async function getUserById(id) {
  const res = await queryAsync('SELECT * FROM Users WHERE id = ?', [id]);
  return res[0];
}
async function getUserNameById(id) {
  const res = await queryAsync('SELECT name FROM Users WHERE id = ?', [id]);
  return res[0]?.name || null;
}

function formatNumber(prefix, number, suffix = "", digits = 4) {
  return `${prefix}-${number.toString().padStart(digits, '0')}${suffix ? `-${suffix}` : ""}`;
}
async function generateNumber(type) {
  const [row] = await queryAsync(`SELECT last_number FROM Ticket_Counters WHERE type = ?`, [type]);

  if (!row) throw new Error(`No counter entry for type ${type}`);

  const nextNumber = row.last_number + 1;

  await queryAsync(`UPDATE Ticket_Counters SET last_number = ? WHERE type = ?`, [nextNumber, type]);

  return nextNumber;
}


app.post("/submit-regular-maintenance", authenticateToken, async (req, res) => {
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

  // تنسيق عرض المشاكل للإشعارات
  let formattedProblemStatus = "No issues reported";
  if (Array.isArray(problem_status)) {
    formattedProblemStatus = problem_status.length ? problem_status.join(", ") : formattedProblemStatus;
  } else if (typeof problem_status === "string" && problem_status.trim() !== "") {
    formattedProblemStatus = problem_status;
  }

  const adminUser = await getUserById(userId);
  const userName = await getUserNameById(userId);

  let engineerName;
  if (adminUser?.role === 'admin' && technical_engineer_id) {
    // نجيب اسم المهندس الفني من جدول Engineers
    const techEngineerRes = await queryAsync(`SELECT name FROM Engineers WHERE id = ?`, [technical_engineer_id]);
    engineerName = techEngineerRes[0]?.name || userName;
  } else {
    engineerName = userName;
  }
  const isAllDevices = (rawDeviceType && rawDeviceType.toLowerCase() === "all-devices");


  let finalEngineerId = null;

  if (technical_engineer_id && !isNaN(technical_engineer_id)) {
    const parsed = parseInt(technical_engineer_id);
    if (Number.isInteger(parsed)) {
      finalEngineerId = parsed;
    }
  }


  try {
    const departmentRes = await queryAsync("SELECT id FROM Departments WHERE name = ?", [section]);
    const departmentId = departmentRes[0]?.id || null;
    // ✅ فحص إذا فيه صيانة مفتوحة لنفس الجهاز
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
  LEFT JOIN RAM_Sizes rs ON pc.RAMSize_id = rs.id
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

    await queryAsync(`INSERT INTO Notifications (user_id, message, type) VALUES (?, ?, ?)`, [
      userId,
      `Regular maintenance for ${displayDevice} has been created by ${userName} and assigned to engineer ${engineerName || 'N/A'} [${formattedProblemStatus}]`,
  'regular-maintenance'
    ]);

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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?,?,?)
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
    await queryAsync(`
      INSERT INTO Notifications (user_id, message, type)
      VALUES (?, ?, ?)
    `, [
      userId,
      `Ticket ${ticketNumber} has been opened by ${userName} and assigned to engineer ${engineerName || 'N/A'} [${formattedProblemStatus}]`,
  'internal-ticket-report'
    ]);

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
      notes || "Routine periodic maintenance performed.",
      "Open",
      "Regular",
      deviceInfo.mac_address,
      deviceInfo.ip_address,
      userId
    ]);

    await queryAsync(`
      INSERT INTO Notifications (user_id, message, type)
      VALUES (?, ?, ?)
    `, [
      userId,
      `Main report ${reportNumberMain} for device ${deviceInfo.device_name} (${displayDevice}) has been submitted by ${userName} and handled by engineer ${engineerName || 'N/A'}`,
  'regular-report'
    ]);

// 🧼 دالة تنظيف التاج من الاسم
function cleanTag(str) {
  return (str || "").replace(/\[\s*(ar|en)\s*\]/gi, "").trim();
}

const techEngineerRes = await queryAsync(`SELECT name FROM Engineers WHERE id = ?`, [technical_engineer_id]);
const techEngineerName = techEngineerRes[0]?.name;

if (techEngineerName) {
  const cleanedName = cleanTag(techEngineerName); // ✅ نظف الاسم
  const techUserRes = await queryAsync(`SELECT id FROM Users WHERE name = ?`, [cleanedName]);
  const techUserId = techUserRes[0]?.id;

      if (techUserId) {
        await queryAsync(`INSERT INTO Notifications (user_id, message, type) VALUES (?, ?, ?)`, [
          techUserId,
          `You have been assigned a new Regular maintenance task for ${displayDevice} by ${userName}. [Engineer: ${cleanedName}]`,
      'technical-notification'
        ]);
      }
    }


    await queryAsync(`
      INSERT INTO Activity_Logs (user_id, user_name, action, details)
      VALUES (?, ?, ?, ?)
    `, [
      userId,
      userName,
      'Submitted Regular Maintenance',
      `Submitted regular maintenance for a ${deviceInfo.device_type} | Device: ${deviceInfo.device_name} | Serial: ${deviceInfo.serial_number} | Governmental No.: ${deviceInfo.governmental_number}`
    ]);


    res.json({ message: "✅ Regular maintenance, ticket, and reports created successfully." });

  } catch (error) {
    console.error("❌ Error in regular maintenance submission:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/report-statuses", (req, res) => {
  db.query("SELECT * FROM Report_Statuses", (err, result) => {
    if (err) {
      console.error("❌ Failed to fetch report statuses:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(result);
  });
});

app.post("/add-popup-option", (req, res) => {
  const { target, value } = req.body;
  if (!target || !value) return res.status(400).json({ message: "Missing target or value" });

  const tableMap = {
    "device-type": { table: "DeviceType", column: "DeviceType" },
    "technical": { table: "Engineers", column: "name" },
    "report-status": { table: "Report_Statuses", column: "status_name" },
    "ticket-type": { table: "Ticket_Types", column: "type_name" },
    "department": { table: "Departments", column: "name" },
    "device-specification": { table: "Maintenance_Devices", column: "device_name" },
    "initial-diagnosis": { table: "ProblemStates_Pc", column: "problem_text" } // تقدر توسعها حسب نوع الجهاز
  };


  const mapping = tableMap[target];
  if (!mapping) return res.status(400).json({ message: "Invalid target" });

  const checkQuery = `SELECT * FROM ${mapping.table} WHERE ${mapping.column} = ?`;
  db.query(checkQuery, [value], (checkErr, existing) => {
    if (checkErr) return res.status(500).json({ message: "DB error" });
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: "⚠️ Already exists" });
    }

    const insertQuery = `INSERT INTO ${mapping.table} (${mapping.column}) VALUES (?)`;
    db.query(insertQuery, [value], (err) => {
      if (err) return res.status(500).json({ success: false, message: "❌ Insert error" });


      res.json({ success: true });
    });
  });
});

app.post("/submit-new-device", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const {
    "device-spec": deviceId,
    "device-type": rawDeviceType,
    section: rawSection
  } = req.body;

  // 🧼 تنظيف النوع والقسم من أي وسم لغة
  const deviceType = removeLangTag(rawDeviceType);
  const section = removeLangTag(rawSection);

  try {
    // 1. تحقق من القسم
    const deptRes = await queryAsync("SELECT id FROM Departments WHERE name = ?", [section]);
    const departmentId = deptRes[0]?.id;
    if (!departmentId) return res.status(400).json({ error: "❌ القسم غير موجود" });

    // 2. تحقق من الجهاز
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

    // 3. تحقق من تطابق النوع والقسم
    const dbType = device.device_type?.toLowerCase();
    const reqType = rawDeviceType?.toLowerCase();
    if (dbType !== reqType) {
      return res.status(400).json({ error: `❌ نوع الجهاز غير متطابق (Expected: ${dbType}, Received: ${deviceType})` });
    }

    if (device.department_id !== departmentId) {
      return res.status(400).json({ error: `❌ القسم المختار لا يطابق قسم الجهاز المحفوظ` });
    }

    // 5. سجل النشاط
    const userName = await getUserNameById(userId);
    await queryAsync(`
      INSERT INTO Activity_Logs (user_id, user_name, action, details)
      VALUES (?, ?, ?, ?)
    `, [
      userId,
      userName,
      "Used Existing Device",
      `تم استخدام جهاز محفوظ مسبقًا (ID: ${device.id}) - النوع: ${device.device_type} - القسم: ${device.department_name}`
    ]);

    res.json({ message: "✅ تم استخدام الجهاز المحفوظ بنجاح." });

  } catch (err) {
    console.error("❌ Error using existing device:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});




app.post("/add-option-general", authenticateToken, (req, res) => {
  const { target, value, type } = req.body;
  const userId = req.user?.id;

  const tableMap = {
    "device-type": { table: "DeviceType", column: "DeviceType" },
    "section": { table: "Departments", column: "name" },
    "floor": { table: "Floors", column: "FloorNum" },
    "technical": { table: "Engineers", column: "name" },
    "problem-status": type === "pc"
      ? { table: "ProblemStates_Pc", column: "problem_text" }
      : type === "printer"
        ? { table: "ProblemStates_Printer", column: "problem_text" }
        : type === "scanner"
          ? { table: "ProblemStates_Scanner", column: "problem_text" }
          : { table: "problemStates_Maintance_device", column: "problemStates_Maintance_device_name", extra: "device_type_name" },
    "os-select": { table: "OS_Types", column: "os_name" },
    "ram-select": { table: "RAM_Types", column: "ram_type" },
    "ram-size-select": { table: "RAM_Sizes", column: "ram_size" },
    "cpu-select": { table: "CPU_Types", column: "cpu_name" },
    "generation-select": { table: "Processor_Generations", column: "generation_number" },
    "drive-select": { table: "Hard_Drive_Types", column: "drive_type" },
    "printer-type": { table: "Printer_Types", column: "printer_type" },
    "ink-type": { table: "Ink_Types", column: "ink_type" },
    "scanner-type": { table: "Scanner_Types", column: "scanner_type" },
  };

  const mapping = tableMap[target];
  if (!mapping) return res.status(400).json({ error: "Invalid target field" });

  const query = mapping.extra
    ? `INSERT INTO ${mapping.table} (${mapping.column}, ${mapping.extra}) VALUES (?, ?)`
    : `INSERT INTO ${mapping.table} (${mapping.column}) VALUES (?)`;

  const params = mapping.extra ? [value, type] : [value];

  const checkQuery = mapping.extra
    ? `SELECT * FROM ${mapping.table} WHERE ${mapping.column} = ? AND ${mapping.extra} = ?`
    : `SELECT * FROM ${mapping.table} WHERE ${mapping.column} = ?`;

  db.query(checkQuery, params, (err, existing) => {
    if (err) return res.status(500).json({ error: "DB check error" });
    if (existing.length > 0) {
      return res.status(400).json({ error: `⚠️ \"${value}\" already exists in ${mapping.table}` });
    }

    db.query(query, params, (err2, result) => {
      if (err2) {
        console.error("❌ DB Insert Error:", err2);
        return res.status(500).json({ error: "Database error while inserting option" });
      }

      // ✅ Log to Activity_Logs
      db.query("SELECT name FROM users WHERE id = ?", [userId], (errUser, resultUser) => {
        if (!errUser && resultUser.length > 0) {
          const userName = resultUser[0].name;
          const logQuery = `
            INSERT INTO Activity_Logs (user_id, user_name, action, details)
            VALUES (?, ?, ?, ?)
          `;
          const logValues = [
            userId,
            userName,
            `Added '${mapping.table}'`,
            `Added '${value}' to '${mapping.table}'`
          ];
          db.query(logQuery, logValues, (logErr) => {
            if (logErr) console.error("❌ Logging failed:", logErr);
          });
        }
      });

      res.json({ message: `✅ ${value} added to ${mapping.table}`, insertedId: result.insertId });
    });
  });
});





app.post("/add-options-external", authenticateToken, (req, res) => {
  const { target, value } = req.body;
  const userId = req.user?.id;

  if (!target || !value) {
    return res.status(400).json({ error: "Missing target or value" });
  }

  let table = "";
  let column = "";

  switch (target) {
    case "device-type":
      table = "DeviceType";
      column = "DeviceType";
      break;
    case "section":
      table = "Departments";
      column = "name";
      break;
    case "technical-status":
      table = "Engineers";
      column = "name";
      break;
    default:
      return res.status(400).json({ error: "Unsupported dropdown" });
  }

  const checkQuery = `SELECT * FROM ${table} WHERE ${column} = ? LIMIT 1`;
  db.query(checkQuery, [value], (checkErr, checkResult) => {
    if (checkErr) {
      console.error("❌ Error checking existing value:", checkErr);
      return res.status(500).json({ error: "Database error" });
    }

    if (checkResult.length > 0) {
      return res.status(400).json({ error: `⚠️ "${value}" already exists!` });
    }

    const insertQuery = `INSERT INTO ${table} (${column}) VALUES (?)`;
    db.query(insertQuery, [value], (insertErr, insertResult) => {
      if (insertErr) {
        console.error("❌ Error inserting option:", insertErr);
        return res.status(500).json({ error: "Database insert error" });
      }

      // ✅ سجل اللوق بعد الإدخال
      db.query("SELECT name FROM users WHERE id = ?", [userId], (errUser, resultUser) => {
        if (!errUser && resultUser.length > 0) {
          const userName = resultUser[0].name;

          const logQuery = `
            INSERT INTO Activity_Logs (user_id, user_name, action, details)
            VALUES (?, ?, ?, ?)
          `;
          const logValues = [
            userId,
            userName,
            `Added '${table}'`,
            `Added '${value}' to '${table}'`
          ];

          db.query(logQuery, logValues, (logErr) => {
            if (logErr) console.error("❌ Logging failed:", logErr);
          });
        }
      });

      res.json({ message: `✅ ${value} added successfully` });
    });
  });
});

app.post("/add-options-regular", authenticateToken, (req, res) => {
  const { target, value, type } = req.body;
  const userId = req.user?.id;

  const tableMap = {
    "device-type": { table: "DeviceType", column: "DeviceType", action: "Add Device Type" },
    "section": { table: "Departments", column: "name", action: "Add Department" },
    "os-select": { table: "OS_Types", column: "os_name", action: "Add OS" },
    "ram-select": { table: "RAM_Types", column: "ram_type", action: "Add RAM" },
    "ram-size-select": { table: "RAM_Sizes", column: "ram_size", action: "Add RAM Size" },
    "cpu-select": { table: "CPU_Types", column: "cpu_name", action: "Add CPU" },
    "generation-select": { table: "Processor_Generations", column: "generation_number", action: "Add CPU Generation" },
    "drive-select": { table: "Hard_Drive_Types", column: "drive_type", action: "Add Drive Type" },
    "problem-status": type === "pc"
      ? { table: "ProblemStates_Pc", column: "problem_text", action: "Add PC Problem" }
      : type === "printer"
        ? { table: "ProblemStates_Printer", column: "problem_text", action: "Add Printer Problem" }
        : type === "scanner"
          ? { table: "ProblemStates_Scanner", column: "problem_text", action: "Add Scanner Problem" }
          : { table: "problemStates_Maintance_device", column: "problemStates_Maintance_device_name", extra: "device_type_name", action: "Add Generic Problem" },
    "technical": { table: "Engineers", column: "name", action: "Add Engineer" },
    "printer-type": { table: "Printer_Types", column: "printer_type", action: "Add Printer Type" },
    "ink-type": { table: "Ink_Types", column: "ink_type", action: "Add Ink Type" },
    "scanner-type": { table: "Scanner_Types", column: "scanner_type", action: "Add Scanner Type" },
  };

  const mapping = tableMap[target];
  if (!mapping) return res.status(400).json({ error: "Invalid target field" });

  let query = "";
  let params = [];

  if (mapping.extra) {
    query = `INSERT INTO ${mapping.table} (${mapping.column}, ${mapping.extra}) VALUES (?, ?)`;
    params = [value, type];
  } else {
    query = `INSERT INTO ${mapping.table} (${mapping.column}) VALUES (?)`;
    params = [value];
  }

  const checkQuery = mapping.extra
    ? `SELECT * FROM ${mapping.table} WHERE ${mapping.column} = ? AND ${mapping.extra} = ?`
    : `SELECT * FROM ${mapping.table} WHERE ${mapping.column} = ?`;

  db.query(checkQuery, params, (err, existing) => {
    if (err) return res.status(500).json({ error: "DB check error" });
    if (existing.length > 0) {
      return res.status(400).json({ error: `⚠️ \"${value}\" already exists in ${mapping.table}` });
    }

    db.query(query, params, (err2, result) => {
      if (err2) {
        console.error("❌ DB Insert Error:", err2);
        return res.status(500).json({ error: "Database error while inserting option" });
      }

      // ✅ Log to Activity_Logs
      db.query("SELECT name FROM users WHERE id = ?", [userId], (errUser, resultUser) => {
        if (!errUser && resultUser.length > 0) {
          const userName = resultUser[0].name;
          const logQuery = `
            INSERT INTO Activity_Logs (user_id, user_name, action, details)
            VALUES (?, ?, ?, ?)
          `;
          const logValues = [
            userId,
            userName,
            `Added '${mapping.table}'`,
            `Added '${value}' to '${mapping.table}'`
          ];
          db.query(logQuery, logValues, (logErr) => {
            if (logErr) console.error("❌ Logging failed:", logErr);
          });
        }
      });

      res.json({ message: `✅ ${value} added to ${mapping.table}`, insertedId: result.insertId });
    });
  });
});


app.post("/submit-general-maintenance", authenticateToken, async (req, res) => {
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

// 🧼 إزالة الوسوم من القيم
const section = removeLangTag(rawSection);
const deviceType = removeLangTag(rawDeviceType);

const problemStatus = Array.isArray(rawProblemStatus)
  ? rawProblemStatus.map(removeLangTag)
  : removeLangTag(rawProblemStatus);

// تنسيق عرض المشاكل للإشعارات
let formattedProblemStatus = "No issues reported";
if (Array.isArray(problemStatus)) {
  formattedProblemStatus = problemStatus.length ? problemStatus.join(", ") : formattedProblemStatus;
} else if (typeof problemStatus === "string" && problemStatus.trim() !== "") {
  formattedProblemStatus = problemStatus;
}

function cleanTag(str) {
  return (str || "").replace(/\[\s*(ar|en)\s*\]/gi, "").trim();
}

  const adminUser = await getUserById(userId);
  const userName = await getUserNameById(userId);

const cleanedTechnical = cleanTag(technical);

let engineerName;
if (adminUser?.role === 'admin' && cleanedTechnical) {
  const techEngineerRes = await queryAsync(`SELECT name FROM Engineers WHERE name = ?`, [cleanedTechnical]);
  engineerName = techEngineerRes[0]?.name || userName;
} else {
  engineerName = userName;
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

    // 👇 نحدد التاريخ (إما التاريخ المُرسل أو CURRENT_DATE)
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

    await queryAsync(`INSERT INTO Notifications (user_id, message, type) VALUES (?, ?, ?)`, [
      userId,
      `General maintenance created for ${deviceInfo.device_name} (${displayDevice}) by engineer ${engineerName || 'N/A'} (${formattedProblemStatus})`,
      'general-maintenance'
    ]);

    await queryAsync(`INSERT INTO Notifications (user_id, message, type) VALUES (?, ?, ?)`, [
      userId,
      `Report created ${reportNumberMain} for device ${deviceInfo.device_name} (${displayDevice}) by engineer ${engineerName || 'N/A'}`,
      'general-report'
    ]);

    await queryAsync(`INSERT INTO Notifications (user_id, message, type) VALUES (?, ?, ?)`, [
      userId,
      `Report created (Ticket) ${reportNumberTicket} for device ${deviceInfo.device_name} (${displayDevice}) by engineer ${engineerName || 'N/A'}`,
      'internal-ticket-report'
    ]);

// 🧼 دالة تنظيف التاج من الاسم

const cleanedTechnical = cleanTag(technical); // "rawad"

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
    await queryAsync(`INSERT INTO Notifications (user_id, message, type) VALUES (?, ?, ?)`, [
      techUserId,
      `You have been assigned a new General maintenance task on ${deviceInfo.device_name} (${displayDevice}) by ${userName}`,
      'technical-notification'
    ]);
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
      'Submitted General Maintenance',
      `General maintenance for ${deviceInfo.device_type} | Device Name: ${deviceInfo.device_name} | Serial: ${deviceInfo.serial_number} | Gov: ${deviceInfo.governmental_number}`
    ]);

    res.json({ message: "✅ General maintenance, ticket, and reports created successfully." });

  } catch (error) {
    console.error("❌ Error in general maintenance:", error);
    res.status(500).json({ error: "❌ Internal server error" });
  }
});


app.get("/device-types", (req, res) => {
  db.query("SELECT DISTINCT device_type FROM Maintenance_Devices WHERE device_type IS NOT NULL ORDER BY device_type ASC", (err, result) => {
    if (err) {
      console.error("❌ Error fetching device types:", err);
      return res.status(500).json({ error: "Database error" });
    }
    // رجّع قائمة بسيطة بدل ما تكون كائنات
    res.json(result.map(row => row.device_type));
  });
});
app.get("/get-external-reports", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;
  const userName = await getUserNameById(userId);

  let externalSql = `
    SELECT 
      MAX(id) AS id,
      MAX(created_at) AS created_at,
      NULL AS ticket_id,
      MAX(ticket_number) AS ticket_number,
      MAX(device_name) AS device_name,
      MAX(department_name) AS department_name,
      MAX(initial_diagnosis) AS issue_summary,
      MAX(final_diagnosis) AS full_description,
      MAX(status) AS status,
      MAX(device_type) AS device_type,
      NULL AS priority,
      'external-legacy' AS source,
      NULL AS attachment_name,
      NULL AS attachment_path,
      MAX(mac_address) AS mac_address,
      MAX(ip_address) AS ip_address,
      MAX(user_id) AS user_id
    FROM External_Maintenance
  `;

  let newSql = `
    SELECT 
      MAX(id) AS id,
      MAX(created_at) AS created_at,
      NULL AS ticket_id,
      NULL AS ticket_number,
      NULL AS device_name,
      NULL AS department_name,
      NULL AS issue_summary,
      NULL AS full_description,
      MAX(status) AS status,
      MAX(device_type) AS device_type,
      MAX(priority) AS priority,
      'new' AS source,
      MAX(attachment_name) AS attachment_name,
      MAX(attachment_path) AS attachment_path,
      NULL AS mac_address,
      NULL AS ip_address,
      MAX(user_id) AS user_id
    FROM New_Maintenance_Report
  `;

  let externalReportsSQL = `
    SELECT 
      mr.id,
      MAX(mr.created_at) AS created_at,
      mr.ticket_id,
      MAX(et.ticket_number) AS ticket_number,
      MAX(COALESCE(pc.Computer_Name, pr.Printer_Name, sc.Scanner_Name, md.device_name)) AS device_name,
      MAX(d.name) AS department_name,
      MAX(mr.issue_summary) AS issue_summary,
      MAX(mr.full_description) AS full_description,
      MAX(mr.status) AS status,
      MAX(md.device_type) AS device_type,
      MAX(mr.priority) AS priority,
      'external-new' AS source,
      MAX(et.attachment_name) AS attachment_name,
      MAX(et.attachment_path) AS attachment_path,
      MAX(md.mac_address) AS mac_address,
      MAX(md.ip_address) AS ip_address,
      MAX(mr.user_id) AS user_id
    FROM Maintenance_Reports mr
    LEFT JOIN External_Tickets et ON mr.report_number = et.ticket_number
    LEFT JOIN Maintenance_Devices md ON mr.device_id = md.id
    LEFT JOIN Departments d ON md.department_id = d.id
LEFT JOIN PC_info pc 
  ON LOWER(md.device_type) IN ('pc', 'desktop', 'laptop', 'كمبيوتر', 'لابتوب') 
  AND md.serial_number = pc.Serial_Number
    LEFT JOIN Printer_info pr ON md.device_type = 'Printer' AND md.serial_number = pr.Serial_Number
    LEFT JOIN Scanner_info sc ON md.device_type = 'Scanner' AND md.serial_number = sc.Serial_Number
    WHERE mr.maintenance_type = 'External'
  `;

  // إذا لم يكن المستخدم Admin، أضف فلاتر
  if (userRole !== 'admin') {
    externalSql += `
      WHERE user_id = ${db.escape(userId)} 
      OR LOWER(reporter_name) LIKE CONCAT('%', LOWER(${db.escape(userName)}), '%')
    `;

    newSql += ` WHERE user_id = ${db.escape(userId)} `;

    // ✴️ ملاحظة: لا تكتب AND بعد GROUP BY → ضف الشروط قبل GROUP BY
    externalReportsSQL += `
      AND (
        mr.user_id = ${db.escape(userId)} 
        OR LOWER(et.assigned_to) LIKE CONCAT('%', LOWER(${db.escape(userName)}), '%')
      )
    `;
  }

  // أضف GROUP BY بعد كل فلترة
  externalSql += ` GROUP BY id `;
  newSql += ` GROUP BY id `;
  externalReportsSQL += ` GROUP BY mr.id `;

  // الصيغة النهائية الموحدة للاستعلام
  const combinedSql = `
    (${externalSql})
    UNION ALL
    (${externalReportsSQL})
    UNION ALL
    (${newSql})
    ORDER BY created_at DESC
  `;

  db.query(combinedSql, (err, result) => {
    if (err) {
      console.error("❌ Error fetching external reports:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(result);
  });
});


app.put("/update-external-report-status/:id", authenticateToken, async (req, res) => {
  const reportId = req.params.id;
  const { status } = req.body;
  const userId = req.user.id;

  try {
    const userNameRes = await queryAsync(`SELECT name FROM Users WHERE id = ?`, [userId]);
    const userName = userNameRes[0]?.name || "Unknown";

    // 1. Get the report
    const reportRes = await queryAsync("SELECT * FROM Maintenance_Reports WHERE id = ?", [reportId]);
    if (!reportRes[0]) return res.status(404).json({ error: "Report not found" });
    const report = reportRes[0];

    // 2. Get device info
    const deviceRes = await queryAsync(`
      SELECT device_name, device_type 
      FROM Maintenance_Devices 
      WHERE id = ?
    `, [report.device_id]);
    const deviceName = deviceRes[0]?.device_name || "Unknown Device";
    const deviceType = deviceRes[0]?.device_type || "Unknown Type";
    const readableDevice = `${deviceName} (${deviceType})`;

    // 3. Get engineer from External_Maintenance
    const extMaintRes = await queryAsync(`
      SELECT technical_engineer_id 
      FROM External_Maintenance 
      WHERE id = ?
    `, [reportId]);

    const technicalEngineerId = extMaintRes[0]?.technical_engineer_id || null;
    let engineerName = null;
    let engineerUserId = null;

    if (technicalEngineerId) {
      const engineerRes = await queryAsync(`SELECT name FROM Engineers WHERE id = ?`, [technicalEngineerId]);
      engineerName = engineerRes[0]?.name || null;

      if (engineerName) {
        const techUserRes = await queryAsync(`SELECT id FROM Users WHERE name = ?`, [engineerName]);
        engineerUserId = techUserRes[0]?.id || null;
      }
    }

    // 4. Update main report
    await queryAsync("UPDATE Maintenance_Reports SET status = ? WHERE id = ?", [status, reportId]);

    // 5. Update external ticket if available
    if (report.ticket_id) {
      await queryAsync("UPDATE External_Tickets SET status = ? WHERE id = ?", [status, report.ticket_id]);
      await queryAsync("UPDATE Maintenance_Reports SET status = ? WHERE ticket_id = ?", [status, report.ticket_id]);
    }

    // 6. Update External_Maintenance if exists
    if (extMaintRes[0]) {
      await queryAsync("UPDATE External_Maintenance SET status = ? WHERE id = ?", [status, reportId]);
    }

    // 7. Notify user who did the update
    await queryAsync(`INSERT INTO Notifications (user_id, message, type) VALUES (?, ?, ?)`, [
      userId,
      `You updated external report status to '${status}' for ${readableDevice}`,
      'external-status-update'
    ]);

    // 8. Notify engineer
    if (engineerUserId && engineerUserId !== userId) {
      await queryAsync(`INSERT INTO Notifications (user_id, message, type) VALUES (?, ?, ?)`, [
        engineerUserId,
        `External report status updated to '${status}' for ${readableDevice}`,
        'external-status-update'
      ]);
    }

    // 9. Log the action
    await queryAsync(`
      INSERT INTO Activity_Logs (user_id, user_name, action, details)
      VALUES (?, ?, ?, ?)
    `, [
      userId,
      userName,
      'Updated External Report Status',
      `Updated external report #${reportId} to '${status}' | Device: ${readableDevice}`
    ]);

    res.json({ message: "✅ External report, ticket, and related entries updated with notifications." });

  } catch (err) {
    console.error("❌ Failed to update external report status:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/report/:id", (req, res) => {
  const reportId = req.params.id;
  const reportType = req.query.type;
    const lang       = (req.query.lang || "en").toLowerCase(); // "ar" أو "en" (افتراضي "en")

  console.log("Request reportId:", reportId);
  console.log("Request reportType:", reportType);
    console.log("Request lang:", lang);

  const printerJoin = `
    LEFT JOIN Printer_Types pr_type ON pr.PrinterType_id = pr_type.id
    LEFT JOIN Ink_Types ink_type ON pr.InkType_id = ink_type.id
    LEFT JOIN Ink_Serials ink_serial ON pr.InkSerial_id = ink_serial.id
  `;

  if (reportType === "external") {
    const newExternalSQL = `
      SELECT 
        mr.id AS report_id,
        mr.report_number,
        mr.status,
        mr.created_at,
        mr.issue_summary,
        mr.full_description,
        mr.maintenance_type,
        mr.priority,
   mr.attachment_name      AS attachment_name,    -- أضفت هذا
   mr.attachment_path      AS attachment_path,    -- وأيضاً هذا
   mr.signature_path       AS signature_path,     -- وأيضاً هذا
        et.ticket_number,
        et.attachment_name,
        et.attachment_path,
        et.report_datetime,
        et.issue_description,
        et.assigned_to AS reporter_name,

        d.name AS department_name,
        md.device_type,
        md.serial_number,
        md.governmental_number,
        COALESCE(pc.Computer_Name, pr.Printer_Name, sc.Scanner_Name, md.device_name) AS device_name,
pc.Mac_Address AS mac_address,
pc.Ip_Address AS ip_address,

        cpu.cpu_name,
        ram.ram_type,
        rsize.ram_size,
        os.os_name,
        gen.generation_number,
        hdt.drive_type,
        COALESCE(pcm.model_name, prm.model_name, scm.model_name, mdm_fixed.model_name) AS model_name,
        pr_type.printer_type,
        ink_type.ink_type,
        ink_serial.serial_number AS ink_serial_number,
        st.scanner_type

      FROM Maintenance_Reports mr
      LEFT JOIN External_Tickets et ON mr.ticket_id = et.id
      LEFT JOIN Maintenance_Devices md ON mr.device_id = md.id
      LEFT JOIN Departments d ON md.department_id = d.id

LEFT JOIN PC_info pc 
  ON LOWER(md.device_type) IN ('pc', 'desktop', 'laptop', 'كمبيوتر', 'لابتوب') 
  AND md.serial_number = pc.Serial_Number
      LEFT JOIN CPU_Types cpu ON pc.Processor_id = cpu.id
      LEFT JOIN RAM_Types ram ON pc.RAM_id = ram.id
      LEFT JOIN RAM_Sizes rsize ON pc.RamSize_id = rsize.id
      LEFT JOIN OS_Types os ON pc.OS_id = os.id
      LEFT JOIN Processor_Generations gen ON pc.Generation_id = gen.id
      LEFT JOIN Hard_Drive_Types hdt ON pc.Drive_id = hdt.id
      LEFT JOIN PC_Model pcm ON pc.Model_id = pcm.id

LEFT JOIN Printer_info pr
  ON LOWER(md.device_type) = 'printer'
  AND md.serial_number = pr.Serial_Number
        LEFT JOIN Printer_Model prm ON pr.Model_id = prm.id

LEFT JOIN Scanner_info sc
  ON LOWER(md.device_type) = 'scanner'
  AND md.serial_number = sc.Serial_Number 
       LEFT JOIN Scanner_Model scm ON sc.model_id = scm.id
      LEFT JOIN Scanner_Types st ON sc.ScannerType_id = st.id

      LEFT JOIN Maintance_Device_Model mdm_fixed ON md.model_id = mdm_fixed.id
      ${printerJoin}

      WHERE mr.id = ? AND mr.maintenance_type = 'External'
      LIMIT 1
    `;
    console.log("Running external SQL:", newExternalSQL);

    db.query(newExternalSQL, [reportId], (err, result) => {
      if (err) {
        console.error("Error in newExternalSQL:", err);
        return res.status(500).json({ error: "Server error" });
      }
      console.log("Result from newExternalSQL:", result);
      if (result.length) {
        const r = result[0];
        return res.json({
          id: r.report_id,
          report_number: r.report_number,
          ticket_number: r.ticket_number,
          created_at: r.created_at,
          reporter_name: r.reporter_name || "",
          assigned_to: r.reporter_name || "",
          report_type: "Incident",
          priority: r.priority || "Medium",
          mac_address: r.mac_address || "",
          ip_address: r.ip_address || "",
          scanner_type: r.scanner_type || "",
attachment_name:   r.attachment_name   || "",  // من Maintenance_Reports
attachment_path:   r.attachment_path   || "",
signature_path:    r.signature_path    || "",
          maintenance_manager: "",
          device_name: r.device_name || "",
          device_type: r.device_type || "",
          serial_number: r.serial_number || "",
          governmental_number: r.governmental_number || "",
          department_name: r.department_name || "",
          issue_summary: r.issue_summary || "",
          full_description: r.full_description || "",
          cpu_name: r.cpu_name || "",
          ram_type: r.ram_type || "",
          ram_size: r.ram_size || "",
          os_name: r.os_name || "",
          generation_number: r.generation_number || "",
          model_name: r.model_name || "",
          drive_type: r.drive_type || "",
          attachment_name: r.attachment_name || "",
          attachment_path: r.attachment_path || "",
          maintenance_type: r.maintenance_type,
          printer_type: r.printer_type || "",
          ink_type: r.ink_type || "",
          ink_serial_number: r.ink_serial_number || "",
          status: r.status || "Open",
          source: "external-new"
        });
      } else {
        const oldExternalSQL = `SELECT * FROM External_Maintenance WHERE id = ? LIMIT 1`;
        console.log("Running oldExternalSQL:", oldExternalSQL);

        db.query(oldExternalSQL, [reportId], (err2, result2) => {
          if (err2) return res.status(500).json({ error: "Server error" });
          if (!result2.length) return res.status(404).json({ error: "External report not found" });

          const r = result2[0];
          return res.json({
            id: r.id,
            report_number: r.ticket_number,
            ticket_number: r.ticket_number,
            created_at: r.created_at,
            reporter_name: r.reporter_name,
            assigned_to: r.reporter_name || "",
            report_type: "External",
            priority: r.priority || "Medium",
            mac_address: r.mac_address || "",
            ip_address: r.ip_address || "",
attachment_name:   r.attachment_name   || "",  // من Maintenance_Reports
attachment_path:   r.attachment_path   || "",
signature_path:    r.signature_path    || "",
            maintenance_manager: r.maintenance_manager,
            device_name: r.device_name,
            device_type: r.device_type,
            serial_number: r.serial_number,
            governmental_number: r.governmental_number,
            department_name: r.department_name,
            issue_summary: r.initial_diagnosis,
            full_description: r.final_diagnosis,
            cpu_name: r.cpu_name,
            ram_type: r.ram_type,
            ram_size: r.ram_size || "",
            scanner_type: r.scanner_type || "",
            os_name: r.os_name,
            generation_number: r.generation_number,
            model_name: r.model_name,
            drive_type: r.drive_type || "",
            printer_type: r.printer_type || "",
            ink_type: r.ink_type || "",
            ink_serial_number: r.ink_serial_number || "",
            maintenance_type: "External",
            status: r.status || "Open",
            source: "external-legacy"
          });
        });
      }
    });


  
  } else if (reportType === "new") {
    const sql = `
      SELECT 
        r.*, 
        d.name AS department_name,
        COALESCE(pc.model_name, pr.model_name, sc.model_name) AS model_name,
        cpu.cpu_name,
        ram.ram_type,
        rsize.ram_size,
        os.os_name,
        gen.generation_number,
        hdt.drive_type,
        pr_type.printer_type,
        ink_type.ink_type,
        ink_serial.serial_number AS ink_serial_number,
        st.scanner_type
      FROM New_Maintenance_Report r
      LEFT JOIN Departments d ON r.department_id = d.id
      LEFT JOIN PC_Model pc ON r.device_type = 'PC' AND r.model_id = pc.id
      LEFT JOIN Printer_Model pr ON r.device_type = 'Printer' AND r.model_id = pr.id
      LEFT JOIN Scanner_Model sc ON r.device_type = 'Scanner' AND r.model_id = sc.id
      LEFT JOIN Scanner_Types st ON r.device_type = 'Scanner' AND r.scanner_type_id = st.id
      LEFT JOIN CPU_Types cpu ON r.cpu_id = cpu.id
      LEFT JOIN RAM_Types ram ON r.ram_id = ram.id
      LEFT JOIN RAM_Sizes rsize ON r.ram_size_id = rsize.id
      LEFT JOIN OS_Types os ON r.os_id = os.id
      LEFT JOIN Processor_Generations gen ON r.generation_id = gen.id
      LEFT JOIN Hard_Drive_Types hdt ON r.drive_id = hdt.id
      LEFT JOIN Printer_Types pr_type ON r.printer_type_id = pr_type.id
      LEFT JOIN Ink_Types ink_type ON r.ink_type_id = ink_type.id
      LEFT JOIN Ink_Serials ink_serial ON r.ink_serial_id = ink_serial.id
      WHERE r.id = ? LIMIT 1
    `;
    console.log("Running new report SQL:", sql);

    db.query(sql, [reportId], (err, result) => {
      if (err) {
        console.error("Error in new report SQL:", err);
        return res.status(500).json({ error: "Server error" });
      }
      console.log("Result from new report SQL:", result);
      if (!result.length) return res.status(404).json({ error: "New maintenance report not found" });

      const r = result[0];
      return res.json({
        id: r.id,
        created_at: r.created_at,
        report_type: r.report_type,
        device_type: r.device_type,
        priority: r.priority,
        status: r.status,
        maintenance_type: "New",
        issue_summary: r.issue_summary || "",
        details: r.details || "",
        assigned_to: r.assigned_to || "",
        attachment_name: r.attachment_name,
        attachment_path: r.attachment_path,
        signature_path: r.signature_path || null,
        department_name: r.department_name,
        device_name: r.device_name,
        serial_number: r.serial_number,
        governmental_number: r.governmental_number,
        model_name: r.model_name,
        mac_address: r.mac_address || "",
        ip_address: r.ip_address || "",
        scanner_type: r.scanner_type || "",

        cpu_name: r.cpu_name,
        ram_type: r.ram_type,
        ram_size: r.ram_size || "",
        os_name: r.os_name,
        generation_number: r.generation_number,
        drive_type: r.drive_type || "",
        printer_type: r.printer_type || "",
        ink_type: r.ink_type || "",
        ink_serial_number: r.ink_serial_number || "",
        source: "new"
      });
    });

  } else {
    const sql = `
SELECT
  mr.id                     AS report_id,
  mr.report_number,
  mr.report_type,
  mr.status,
  mr.created_at,
  mr.issue_summary,
  mr.full_description,
  mr.maintenance_type,
  mr.signature_path,
  mr.attachment_name,
  mr.attachment_path,

  md.device_type,
  md.serial_number,
  md.governmental_number,
  COALESCE(pc.Computer_Name, pr.Printer_Name, sc.Scanner_Name, md.device_name) AS device_name,
  pc.Mac_Address           AS mac_address,
  pc.IP_Address            AS ip_address,

  d.name                   AS department_name,

  it.ticket_number,
  it.ticket_type,
  it.priority,
  it.assigned_to           AS technical,
  it.issue_description,

  pc_os.os_name,
  cpu.cpu_name,
  gen.generation_number,
  ram.ram_type,
  rsize.ram_size,
  hdt.drive_type,
  COALESCE(pcm.model_name, prm.model_name, scm.model_name, mdm_fixed.model_name) AS model_name,

  rm.problem_status,
  eng.name                 AS technical_engineer,
  rm.technical_engineer_id AS assigned_to_id,      -- ← هنا

  pr_type.printer_type,
  pr.PrinterType_id        AS printer_type_id,     -- ← هنا

  ink_type.ink_type,
  pr.InkType_id            AS ink_type_id,         -- ← هنا

  ink_serial.serial_number AS ink_serial_number,
  pr.InkSerial_id          AS ink_serial_id,       -- ← هنا

  st.scanner_type,

  gm.id                    AS general_id,
  gm.maintenance_date,
  gm.issue_type,
  gm.diagnosis_initial,
  gm.diagnosis_final,
  gm.device_id             AS general_device_id,
  gm.technician_name,
  gm.floor,
  gm.extension,
  gm.problem_status        AS general_problem_status,
  gm.notes,
  gm.customer_name,
  gm.id_number

FROM Maintenance_Reports mr
LEFT JOIN Maintenance_Devices md     ON mr.device_id = md.id
LEFT JOIN Departments d             ON md.department_id = d.id
LEFT JOIN Internal_Tickets it       ON mr.ticket_id = it.id

LEFT JOIN PC_info pc
  ON LOWER(md.device_type) IN ('pc','desktop','laptop','كمبيوتر','لابتوب')
  AND md.serial_number = pc.Serial_Number
LEFT JOIN CPU_Types cpu             ON pc.Processor_id = cpu.id
LEFT JOIN RAM_Types ram             ON pc.RAM_id       = ram.id
LEFT JOIN RAM_Sizes rsize           ON pc.RamSize_id   = rsize.id
LEFT JOIN OS_Types pc_os            ON pc.OS_id        = pc_os.id
LEFT JOIN Processor_Generations gen ON pc.Generation_id= gen.id
LEFT JOIN Hard_Drive_Types hdt      ON pc.Drive_id     = hdt.id
LEFT JOIN PC_Model pcm              ON pc.Model_id     = pcm.id

LEFT JOIN Printer_info pr
  ON LOWER(md.device_type) = 'printer'
  AND md.serial_number = pr.Serial_Number
LEFT JOIN Printer_Model prm         ON pr.Model_id     = prm.id
LEFT JOIN Printer_Types pr_type     ON pr.PrinterType_id = pr_type.id

LEFT JOIN Ink_Types ink_type        ON pr.InkType_id   = ink_type.id
LEFT JOIN Ink_Serials ink_serial    ON pr.InkSerial_id = ink_serial.id

LEFT JOIN Scanner_info sc
  ON LOWER(md.device_type) = 'scanner'
  AND md.serial_number = sc.Serial_Number
LEFT JOIN Scanner_Model scm         ON sc.model_id      = scm.id
LEFT JOIN Scanner_Types st          ON sc.ScannerType_id= st.id

LEFT JOIN Maintance_Device_Model mdm_fixed
  ON md.model_id = mdm_fixed.id

LEFT JOIN (
  SELECT *
  FROM Regular_Maintenance
  ORDER BY last_maintenance_date DESC
) AS rm ON rm.device_id = mr.device_id
LEFT JOIN Engineers eng             ON rm.technical_engineer_id = eng.id

LEFT JOIN (
    SELECT gm1.*
    FROM General_Maintenance gm1
    INNER JOIN (
        SELECT device_id, MAX(maintenance_date) AS max_date
        FROM General_Maintenance
        GROUP BY device_id
    ) gm2 ON gm1.device_id = gm2.device_id
         AND gm1.maintenance_date = gm2.max_date
) gm ON gm.device_id = mr.device_id

WHERE mr.id = ?


    `;
    console.log("Running internal report SQL:", sql);

    db.query(sql, [reportId], (err2, result2) => {
      if (err2) {
        console.error("Error in internal report SQL:", err2);
        return res.status(500).json({ error: "Server error" });
      }
      console.log("Result from internal report SQL:", result2);
      if (!result2.length) return res.status(404).json({ error: "Internal report not found" });

      let report = result2[0];

      if (result2.length > 1) {
        report = result2.reduce((latest, current) => {
          if (!latest.general_id || (current.general_id && current.general_id > latest.general_id)) {
            return current;
          }
          return latest;
        }, result2[0]);
      }

      return res.json({
        id: report.report_id,
        report_number: report.report_number,
        ticket_type: report.ticket_type || "",
        ticket_number: report.ticket_number,
        drive_type: report.drive_type || "",
        device_type: report.device_type,
        serial_number: report.serial_number,
        mac_address: report.mac_address,
        ip_address: report.ip_address,
        governmental_number: report.governmental_number,
        device_name: report.device_name,
        department_name: report.department_name,
        priority: report.priority,
        technical: report.technical,
        maintenance_type: report.maintenance_type,
        issue_summary: report.issue_summary,
        full_description: report.full_description,
        issue_description: report.issue_description || "",
        attachment_name: report.attachment_name || "",
        attachment_path: report.attachment_path || "",
        signature_path: report.signature_path || "",
        created_at: report.created_at,
        report_type: report.report_type,
        cpu_name: report.cpu_name || "",
        ram_type: report.ram_type || "",
        ram_size: report.ram_size || "",
        os_name: report.os_name || "",
        generation_number: report.generation_number || "",
        model_name: report.model_name || "",
        problem_status: report.problem_status || "",
        technical_engineer: report.technical_engineer || "",
        printer_type: report.printer_type || "",
        ink_type: report.ink_type || "",
        ink_serial_number: report.ink_serial_number || "",
        scanner_type: report.scanner_type || "",

        // General_Maintenance fields
        general_id: report.general_id,
        maintenance_date: report.maintenance_date,
        issue_type: report.issue_type,
        diagnosis_initial: report.diagnosis_initial,
        diagnosis_final: report.diagnosis_final,
        general_device_id: report.general_device_id,
        technician_name: report.technician_name,
        floor: report.floor,
        extension: report.extension || "N/A",
        general_problem_status: report.general_problem_status,
        notes: report.notes,
        customer_name: report.customer_name || "N/A",
        id_number: report.id_number || "N/A",
        source: "internal"
      });


    });
  }
});


// POST /add-options-device
app.post("/add-options-add-device", authenticateToken, (req, res) => {
  const { target, value } = req.body;
  const userId = req.user?.id;

  if (!target || !value) {
    return res.status(400).json({ error: "❌ Missing target or value" });
  }

  const tableMap = {
    "cpu-select": { table: "CPU_Types", column: "cpu_name" },
    "ram-select": { table: "RAM_Types", column: "ram_type" },
    "os-select": { table: "OS_Types", column: "os_name" },
    "drive-select": { table: "Hard_Drive_Types", column: "drive_type" },
    "ram-size-select": { table: "RAM_Sizes", column: "ram_size" },
    "generation-select": { table: "Processor_Generations", column: "generation_number" },
    "printer-type": { table: "Printer_Types", column: "printer_type" },
    "ink-type": { table: "Ink_Types", column: "ink_type" },
    "scanner-type": { table: "Scanner_Types", column: "scanner_type" },
    "model": { table: "Device_Models", column: "model_name" },
    "section": { table: "Departments", column: "name" },
    "device-type": { table: "DeviceType", column: "DeviceType" }
  };

  const mapping = tableMap[target];
  if (!mapping) return res.status(400).json({ error: "Invalid target field" });

  const query = mapping.extra
    ? `INSERT INTO ${mapping.table} (${mapping.column}, ${mapping.extra}) VALUES (?, ?)`
    : `INSERT INTO ${mapping.table} (${mapping.column}) VALUES (?)`;

  const params = mapping.extra ? [value, type] : [value];

  const checkQuery = mapping.extra
    ? `SELECT * FROM ${mapping.table} WHERE ${mapping.column} = ? AND ${mapping.extra} = ?`
    : `SELECT * FROM ${mapping.table} WHERE ${mapping.column} = ?`;

  db.query(checkQuery, params, (err, existing) => {
    if (err) return res.status(500).json({ error: "DB check error" });
    if (existing.length > 0) {
      return res.status(400).json({ error: `⚠️ \"${value}\" already exists in ${mapping.table}` });
    }

    db.query(query, params, (err2, result) => {
      if (err2) {
        console.error("❌ DB Insert Error:", err2);
        return res.status(500).json({ error: "Database error while inserting option" });
      }

      // ✅ Log to Activity_Logs
      db.query("SELECT name FROM users WHERE id = ?", [userId], (errUser, resultUser) => {
        if (!errUser && resultUser.length > 0) {
          const userName = resultUser[0].name;
          const logQuery = `
            INSERT INTO Activity_Logs (user_id, user_name, action, details)
            VALUES (?, ?, ?, ?)
          `;
          const logValues = [
            userId,
            userName,
            `Added '${mapping.table}'`,
            `Added '${value}' to '${mapping.table}'`
          ];
          db.query(logQuery, logValues, (logErr) => {
            if (logErr) console.error("❌ Logging failed:", logErr);
          });
        }
      });

      res.json({ message: `✅ ${value} added to ${mapping.table}`, insertedId: result.insertId });
    });
  });
});





app.post("/add-device-specification", async (req, res) => {
  const { ministry, name, model, serial, department, type } = req.body; // 🟢 Extract device data from body

  try {
    // 🟢 Get department ID
    const getDeptId = () =>
      new Promise((resolve, reject) => {
        db.query("SELECT id FROM Departments WHERE name = ?", [department], (err, result) => {
          if (err) return reject(err);
          resolve(result[0]?.id || null);
        });
      });

    const departmentId = await getDeptId();

    // 🔴 Validate required fields
    if (!departmentId || !serial || !ministry || !name || !model) {
      return res.status(400).json({ error: "❌ Missing fields" });
    }

    // 🔍 Check for duplicate serial or governmental number
    const checkQuery = `SELECT * FROM Maintenance_Devices WHERE serial_number = ? OR governmental_number = ?`;
    db.query(checkQuery, [serial, ministry], (err, result) => {
      if (err) return res.status(500).json({ error: "DB error" });
      if (result.length > 0) {
        return res.status(400).json({ error: "⚠️ Device already exists" });
      }

      // ✅ Insert new device if not duplicated
      const insertQuery = `
        INSERT INTO Maintenance_Devices 
        (serial_number, governmental_number, device_type, device_name, department_id)
        VALUES (?, ?, ?, ?, ?)
      `;

      db.query(insertQuery, [serial, ministry, type, name, departmentId], (err, result) => {
        if (err) return res.status(500).json({ error: "DB error" });
        res.json({ message: "✅ Specification added successfully", insertedId: result.insertId });
      });
    });
  } catch (error) {
    res.status(500).json({ error: "❌ Internal error" });
  }
});



// ✅ دالة تنظيف التاج من نهاية النصوص
function removeLangTag(str) {
  return typeof str === "string" ? str.replace(/\s*\[(ar|en)\]$/i, "").trim() : str;
}

app.post('/AddDevice/:type', authenticateToken, async (req, res) => {
  const deviceType = req.params.type.toLowerCase();
  const Serial_Number = req.body.serial;
  const Governmental_Number = req.body["ministry-id"];
  const Mac_Address = req.body["mac-address"] || null;
  const Ip_Address = req.body["ip-address"] || null;
  const Ink_Serial_Number = req.body["ink-serial-number"] || null;

  // ✅ تنظيف التاجات والمسافات من القيم النصية
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

  // ✅ دالة موحدة لجلب أو إنشاء القيمة بعد تنظيفها
  const safeGetId = async (table, column, value) => {
    const cleanValue = normalizeValue(value);
    if (!cleanValue) return null;

    return new Promise((resolve, reject) => {
      const searchQuery = `
        SELECT id FROM ${table}
        WHERE TRIM(REPLACE(REPLACE(${column}, ' [ar]', ''), ' [en]', '')) = ?
        LIMIT 1
      `;
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

      const insertQuery = `
        INSERT INTO PC_info 
        (Serial_Number, Computer_Name, Governmental_Number, Department, OS_id, Processor_id, Generation_id, RAM_id, RamSize_id, Drive_id, Model_id, Mac_Address, Ip_Address)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        Serial_Number,
        Device_Name,
        Governmental_Number,
        Department_id,
        OS_id,
        Processor_id,
        Generation_id,
        RAM_id,
        RamSize_id,
        Drive_id,
        Model_id,
        Mac_Address,
        Ip_Address
      ];

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

      const insertQuery = `
        INSERT INTO Printer_info 
        (Serial_Number, Printer_Name, Governmental_Number, Department, Model_id, PrinterType_id, InkType_id, InkSerial_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        Serial_Number,
        Device_Name,
        Governmental_Number,
        Department_id,
        Model_id,
        PrinterType_id,
        InkType_id,
        InkSerial_id
      ];

      await db.promise().query(insertQuery, values);

    } else if (deviceType === 'scanner') {
      const Model_id = await safeGetId("Scanner_Model", "model_name", model);
      const ScannerType_id = Scanner_Type ? await safeGetId("Scanner_Types", "scanner_type", Scanner_Type) : null;

      if (!Model_id) {
        return res.status(400).json({ error: "❌ لم يتم تحديد موديل الماسح الضوئي" });
      }

      const insertQuery = `
        INSERT INTO Scanner_info 
        (Serial_Number, Scanner_Name, Governmental_Number, Department, Model_id, ScannerType_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      const values = [
        Serial_Number,
        Device_Name,
        Governmental_Number,
        Department_id,
        Model_id,
        ScannerType_id
      ];

      await db.promise().query(insertQuery, values);
    }

    const insertMaintenanceDevice = `
      INSERT INTO Maintenance_Devices (serial_number, governmental_number, device_type, device_name, department_id)
      VALUES (?, ?, ?, ?, ?)
    `;

    const [result2] = await db.promise().query(insertMaintenanceDevice, [
      Serial_Number,
      Governmental_Number,
      deviceType,
      Device_Name,
      Department_id
    ]);

    // ✅ Logging
    const userId = req.user?.id;
    if (userId) {
      db.query("SELECT name FROM users WHERE id = ?", [userId], (errUser, resultUser) => {
        if (!errUser && resultUser.length > 0) {
          const userName = resultUser[0].name;
          const logQuery = `
            INSERT INTO Activity_Logs (user_id, user_name, action, details)
            VALUES (?, ?, ?, ?)
          `;
          const logValues = [
            userId,
            userName,
            "Add Device",
            `Added '${deviceType}' with serial '${Serial_Number}'`
          ];
          db.query(logQuery, logValues);
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
});

app.get("/api/ink-serials", (req, res) => {
  const sql = "SELECT id, serial_number AS name FROM Ink_Serials";
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});
// مثال: جلب الفئات (Ticket_Types)
app.get("/api/categories", (req, res) => {
  const sql = "SELECT id, type_name AS name FROM Ticket_Types";
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});
app.get("/api/device-types", (req, res) => {
  const sql = "SELECT id, DeviceType AS name FROM DeviceType";
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/get-all-problems', (req, res) => {
  const sql = `
    SELECT problem_text FROM ProblemStates_Pc
    UNION ALL
    SELECT problem_text FROM ProblemStates_Printer
    UNION ALL
    SELECT problem_text FROM ProblemStates_Scanner
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error("❌ Error while fetching problems:", err);
      return res.status(500).json({ error: 'Server error' });
    }

    console.log("✅ Fetched problems:", result);
    res.json(result);
  });
});


app.get("/models-by-type/:type", (req, res) => {
  const { type } = req.params;
  db.query("SELECT model_name FROM Maintance_Device_Model WHERE device_type_name = ?", [type], (err, result) => {
    if (err) {
      console.error("❌ Error fetching models:", err);
      return res.status(500).json({ error: "DB error" });
    }
    res.json(result);
  });
});

app.post("/add-device-model", authenticateToken, (req, res) => {
  const { model_name, device_type_name } = req.body;
  const userId = req.user?.id;

  db.query("SELECT name FROM users WHERE id = ?", [userId], (err, result) => {
    if (err || result.length === 0) {
      return res.status(500).json({ error: "❌ Failed to get user name" });
    }

    const userName = result[0].name;

    if (!model_name || !device_type_name) {
      return res.status(400).json({ error: "❌ Missing model name or type" });
    }

    const cleanedType = device_type_name.trim().toLowerCase();
    let table = "";
    if (cleanedType === "pc") table = "PC_Model";
    else if (cleanedType === "printer") table = "Printer_Model";
    else if (cleanedType === "scanner") table = "Scanner_Model";
    else table = "Maintance_Device_Model";

    const checkQuery = table === "Maintance_Device_Model"
      ? `SELECT * FROM ${table} WHERE model_name = ? AND device_type_name = ?`
      : `SELECT * FROM ${table} WHERE model_name = ?`;

    const checkValues = table === "Maintance_Device_Model"
      ? [model_name, device_type_name]
      : [model_name];

    db.query(checkQuery, checkValues, (err, existing) => {
      if (err) return res.status(500).json({ error: "Database check failed" });
      if (existing.length > 0) {
        return res.status(400).json({ error: `⚠️ Model "${model_name}" already exists` });
      }

      const insertQuery = table === "Maintance_Device_Model"
        ? `INSERT INTO ${table} (model_name, device_type_name) VALUES (?, ?)`
        : `INSERT INTO ${table} (model_name) VALUES (?)`;

      const insertValues = table === "Maintance_Device_Model"
        ? [model_name, device_type_name]
        : [model_name];

      db.query(insertQuery, insertValues, (err2, result2) => {
        if (err2) return res.status(500).json({ error: "Database insert failed" });

        const logQuery = `
          INSERT INTO Activity_Logs (user_id, user_name, action, details)
          VALUES (?, ?, ?, ?)
        `;
        const logValues = [
          userId,
          userName,
          "Add Device Model",
          `Added new model '${model_name}' for device type '${device_type_name}'`
        ];

        db.query(logQuery, logValues, (logErr) => {
          if (logErr) console.error("❌ Failed to log activity:", logErr);
        });

        res.json({ message: `✅ Model '${model_name}'` });
      });
    });
  });
});







app.get('/regular-maintenance-summary', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;

  let sql = `
    SELECT 
      id, device_name, device_type, last_maintenance_date, frequency, status,
      DATE_ADD(last_maintenance_date, INTERVAL 
        CASE WHEN frequency = '3months' THEN 3 WHEN frequency = '4months' THEN 4 END MONTH) AS next_due_date
    FROM Regular_Maintenance
    WHERE frequency = '3months'
  `;

  // فلترة حسب اليوزر لو مو ادمن
  if (userRole !== 'admin') {
    sql += ' AND user_id = ?';
  }

  sql += ' ORDER BY next_due_date DESC';

  const params = userRole === 'admin' ? [] : [userId];

  db.query(sql, params, (err, result) => {
    if (err) return res.status(500).json({ error: 'Error fetching data' });
    res.json(result);
  });
});



app.put("/update-report-status/:id", authenticateToken, async (req, res) => {
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

    await queryAsync(`INSERT INTO Notifications (user_id, message, type) VALUES (?, ?, ?)`, [
      userId,
      `You updated report status to '${status}' for ${readableDevice}`,
      'status-update'
    ]);

    if (engineerUserId && engineerUserId !== userId) {
      await queryAsync(`INSERT INTO Notifications (user_id, message, type) VALUES (?, ?, ?)`, [
        engineerUserId,
        `Report status updated to '${status}' for ${readableDevice}`,
        'status-update'
      ]);
    }

    // === Logs ===

    await queryAsync(`
      INSERT INTO Activity_Logs (user_id, user_name, action, details)
      VALUES (?, ?, ?, ?)
    `, [
      userId,
      userName,
      'Updated Report Status',
      `Updated report status to '${status}' for ${readableDevice} (Report ID: ${reportId})`
    ]);

    res.json({ message: "✅ Status updated and notifications sent." });

  } catch (err) {
    console.error("❌ Failed to update status:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});





app.get('/maintenance-stats', (req, res) => {
  const sql = `
    SELECT
      COUNT(*) AS total,
      SUM(CASE
        WHEN CURDATE() > DATE_ADD(last_maintenance_date, INTERVAL 3 MONTH)
        THEN 1
        ELSE 0
      END) AS completed
    FROM Regular_Maintenance
    WHERE frequency = '3months';
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error fetching stats' });
    }
    res.json(result[0]);
  });
});


app.get('/regular-maintenance-summary-4months', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;

  let sql = `
    SELECT 
      id,
      device_name,
      device_type,
      last_maintenance_date,
      frequency,
      status,
      DATE_ADD(last_maintenance_date, INTERVAL 4 MONTH) AS next_due_date
    FROM Regular_Maintenance
    WHERE frequency = '4months'
  `;

  if (userRole !== 'admin') {
    sql += ' AND user_id = ?';
  }

  sql += ' ORDER BY next_due_date DESC';

  const params = userRole === 'admin' ? [] : [userId];

  db.query(sql, params, (err, result) => {
    if (err) return res.status(500).json({ error: 'Error fetching 4-month data' });
    res.json(result);
  });
});

app.get('/get-internal-reports', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;
  const userName = await getUserNameById(userId);

  let internalSql = `
    SELECT 
      R.id,
      MAX(R.created_at) AS created_at,
      MAX(R.issue_summary) AS issue_summary,
      MAX(R.full_description) AS full_description,
      MAX(R.status) AS status,
      MAX(R.device_id) AS device_id,
      MAX(R.ticket_id) AS ticket_id,
      MAX(R.maintenance_type) AS maintenance_type,
MAX(T.ticket_number) AS ticket_number,
MAX(R.report_number) AS report_number,
      MAX(CASE WHEN R.maintenance_type = 'Regular' THEN NULL ELSE T.issue_description END) AS issue_description,
      MAX(CASE WHEN R.maintenance_type = 'Regular' THEN RM.problem_status ELSE T.priority END) AS priority,
      MAX(COALESCE(GM.department_name, D.name)) AS department_name,
      MAX(COALESCE(GM.device_name, M.device_name)) AS device_name,
      MAX(RM.frequency) AS frequency,
      MAX(M.device_type) AS device_type,
      'internal' AS source,
      MAX(CASE WHEN R.maintenance_type = 'Regular' THEN NULL ELSE T.attachment_name END) AS attachment_name,
      MAX(CASE WHEN R.maintenance_type = 'Regular' THEN NULL ELSE T.attachment_path END) AS attachment_path,
      MAX(COALESCE(RM.problem_status, T.issue_description)) AS problem_status,
      MAX(CASE WHEN R.maintenance_type = 'Internal' THEN T.assigned_to ELSE E.name END) AS technical_engineer
    FROM Maintenance_Reports R
    LEFT JOIN Maintenance_Devices M ON R.device_id = M.id
    LEFT JOIN Departments D ON M.department_id = D.id
    LEFT JOIN (SELECT * FROM Regular_Maintenance ORDER BY last_maintenance_date DESC) AS RM ON RM.device_id = R.device_id
    LEFT JOIN Engineers E ON RM.technical_engineer_id = E.id
    LEFT JOIN General_Maintenance GM ON GM.device_id = R.device_id
    LEFT JOIN Internal_Tickets T ON R.ticket_id = T.id
    WHERE R.maintenance_type IN ('Regular', 'General', 'Internal')
  `;

  let newSql = `
    SELECT 
      id, created_at, issue_summary, NULL AS full_description, status, device_id,
      NULL AS report_number, NULL AS ticket_id, 'New' AS maintenance_type, NULL AS ticket_number,
      NULL AS issue_description, priority, NULL AS department_name, NULL AS device_name, NULL AS frequency,
      device_type, 'new' AS source, attachment_name, attachment_path, NULL AS problem_status, NULL AS technical_engineer
    FROM New_Maintenance_Report
  `;

  let params = [];

if (userRole !== 'admin') {
  internalSql += `
    AND (
      R.user_id = ?
      OR EXISTS (
        SELECT 1 FROM Engineers E2
        JOIN Users U2 ON 
          TRIM(REPLACE(REPLACE(E2.name, '[en]', ''), '[ar]', '')) = TRIM(U2.name)
        WHERE E2.id = RM.technical_engineer_id AND U2.id = ?
      )
      OR LOWER(REPLACE(REPLACE(T.assigned_to, '[en]', ''), '[ar]', '')) = LOWER(?)
    )
  `;
  newSql += ` WHERE user_id = ? `;
  params = [userId, userId, userName, userId];
}


  internalSql += ` GROUP BY R.id `;

  const combinedSql = `${internalSql} UNION ALL ${newSql} ORDER BY created_at DESC`;

  db.query(combinedSql, params, (err, results) => {
    if (err) {
      console.error("❌ Failed to fetch reports:", err);
      return res.status(500).json({ error: "Error fetching reports" });
    }

    res.json(results);
  });
});


  const compareReadable = (label, oldVal, newVal, changes) => {
    if (newVal == null || newVal.toString().trim() === "") return;

    const oldStr = (oldVal ?? "").toString().trim();
    const newStr = newVal.toString().trim();

    // لا نتجاهل Assigned To من فارغ→شيء
    if (label !== "Assigned To" && (oldStr === "" || oldStr === "-") && newStr !== "") {
      return;
    }

    if (oldStr !== newStr) {
      changes.push(` ${label}: "${oldStr || "-"}" → "${newStr || "-"}"`);
    }
  };




app.post("/update-report-full", authenticateToken, upload.fields([
  { name: "attachment", maxCount: 1 },
  { name: "signature", maxCount: 1 }
]), async (req, res) => {
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
    id,  ticket_number,      // ← هنا
 issue_summary, full_description, priority, status, device_type,
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

  // استخدم جدول Maintance_Device_Model في جميع الحالات
  const { model_id } = updatedData;
let modelId = null;
if (device_type && model_id) {
  modelId = Number(model_id);
}



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
  const { engineer_id: engId, assigned_to: engName }        = updatedData;

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
  );}

if (source === "external-new") {
  console.log('external-new: updating ticket', { id, engName });

  try {
    const [result] = await db.promise().query(
      `UPDATE External_Tickets
       SET assigned_to = ?
       WHERE ticket_number = ?`,
      [engName, ticket_number]
    );
    console.log('external-new affectedRows =', result.affectedRows);

    if (result.affectedRows === 0) {
      // ممكن تسجل خطأ أو ترسل رسبونس مختلف
      console.warn(`No ticket found with id=${ticket_number} in External_Tickets.`);
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
    // 2. ابني جملة الـ SQL بشكل صحيح
    const updateReportSql = `
      UPDATE Maintenance_Reports
      SET ${setFields.join(", ")}
      WHERE id = ?`;
    reportValues.push(id);

    // 3. نفذ التحديث
    await db.promise().query(updateReportSql, reportValues);
    await updateExternalMaintenanceInfo(reportOld.id, updatedData);

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
let actualDeviceId = reportOld.device_id;

// جب بيانات الجهاز القديم باستخدام نفس الـ ID
if (actualDeviceId) {
  const [rows] = await db.promise().query(
    `SELECT * FROM Maintenance_Devices WHERE id = ? LIMIT 1`,
    [actualDeviceId]
  );
  oldDevice = rows[0] || {};
}

if (actualDeviceId) {
  const oldSerial = oldDevice.serial_number?.trim();
  const newSerial = serial_number?.trim();

  // ✅ طباعة لتأكيد الفرق
  console.log("🧾 Comparing old vs new serial");
  console.log("🔴 old:", oldSerial);
  console.log("🟢 new:", newSerial);

  if (oldSerial && newSerial && oldSerial !== newSerial) {
    const [conflictRows] = await db.promise().query(
      `SELECT id FROM Maintenance_Devices WHERE serial_number = ? AND id != ?`,
      [newSerial, actualDeviceId]
    );
    if (conflictRows.length > 0) {
      return res.status(400).json({ error: "❌ الرقم التسلسلي مستخدم مسبقًا من قبل جهاز آخر." });
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

    // في هذه النقطة لم نعرِّف بعد `updates` و `values`
    // لذا ننقل طباعتهما إلى ما بعد تعريفهما

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
    await db.promise().query(
      `UPDATE Printer_info SET Model_id = ? WHERE Serial_Number = ?`,
      [modelId, serial_number]
    );
  }
  if (isScanner && serial_number && modelId) {
    await db.promise().query(
      `UPDATE Scanner_info SET Model_id = ? WHERE Serial_Number = ?`,
      [modelId, serial_number]
    );
  }
  if (isPC && serial_number && modelId) {
    await db.promise().query(
      `UPDATE PC_info SET Model_id = ? WHERE Serial_Number = ?`,
      [modelId, serial_number]
    );
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




    // تحديث PC_info
    if (isPC && serial_number) {
      await db.promise().query(`
        UPDATE PC_info
        SET Computer_Name = ?,  Processor_id = ?, RAM_id = ?, RamSize_id = ?, OS_id = ?, Generation_id = ?, Drive_id = ?, Mac_Address = ? ,Ip_Address = ?
        WHERE Serial_Number = ?
      `, [device_name, cpuId,  ramId, ramSizeId, osId, generationId, driveId, mac_address, ip_address, serial_number]);
    }

 // ———— تحديث Printer_info ————
if (device_type === "printer") {
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

  // 4) استخدم دائماً الـ serial_number المحدث
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
}


// ———— تحديث موديل الطابعة لو تغير ————
if (isPrinter && serial_number && modelId) {
  await db.promise().query(
    `UPDATE Printer_info
     SET Model_id = ?
     WHERE Serial_Number = ?`,
    [modelId, serial_number]
  );
}



// 1) جهّز scannerTypeId مضبوط:
 if (device_type === "scanner") {
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

   // إذا ما حصلنا ID، حذّر وما تحدث:
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


   
 }



    // تحديث Scanner_info
    if (isScanner && serial_number && modelId) {
      await db.promise().query(`
        UPDATE Scanner_info
        SET Model_id = ?
        WHERE Serial_Number = ?
      `, [modelId, serial_number]);
    }

    // تحديث الجداول المشتركة
    const sharedParams = [
      device_name, serial_number, governmental_number, department_name,
      model_name, cpu_name, ram_type, os_name, generation_number, drive_type,
      ram_size, ink_type, ink_serial_number, printer_type, mac_address, ip_address, scanner_type
    ];

    if (actualDeviceId) {
      await db.promise().query(`
  UPDATE General_Maintenance 
  SET device_name = ?, serial_number = ?, governmental_number = ?, department_name = ?, 
      model_name = ?, cpu_name = ?, ram_type = ?, os_name = ?, generation_number = ?, 
      drive_type = ?, ram_size = ?, ink_type = ?, ink_serial_number = ?, printer_type = ?, 
      mac_address = ?,ip_address = ?, scanner_type = ? 
  WHERE device_id = ?
`, [...sharedParams, actualDeviceId]);
      await db.promise().query(`
  UPDATE Regular_Maintenance 
  SET device_name = ?, serial_number = ?, governmental_number = ?, department_name = ?, 
      model_name = ?, cpu_name = ?, ram_type = ?, ram_size = ?, os_name = ?, 
      generation_number = ?, drive_type = ?, ink_type = ?, ink_serial_number = ?, 
      printer_type = ?, mac_address = ?,ip_address = ?, scanner_type = ? 
  WHERE device_id = ?
`, [...sharedParams, actualDeviceId]);

// واستبدله بـ:

    }

if (changes.length > 0) {
  // جلب اسم المستخدم من req.user
  const userId = req.user.id;
  const [[userRow]] = await db.promise().query(
    'SELECT name FROM users WHERE id = ?',
    [userId]
  );
  const userName = userRow?.name || 'Unknown';

  // سجل كل تغيير في لوق منفصل
  for (const change of changes) {
    logActivity(
      userId,
      userName,
      "Edited",
      `Report ID ${id} changed: ${change.trim()}`
    );
  }
}

    res.json({ message: "تم تحديث التقرير والجهاز والمواصفات بنجاح." });
  } catch (err) {
    console.error("Error during update:", err);
    res.status(500).json({ error: "خطأ في الخادم أثناء التحديث" });
  }

});

// تحديث مواصفات الجهاز في جدول External_Maintenance
async function updateExternalMaintenanceInfo(reportId, data) {
  const map = {
    device_name: data.device_name,
    serial_number: data.serial_number,
    governmental_number: data.governmental_number,
    model_name: data.model_name,
    department_name: data.department_name,
    mac_address: data.mac_address,
    ip_address: data.ip_address,
    scanner_type: data.scanner_type,
    printer_type: data.printer_type,
    ink_type: data.ink_type,
    ink_serial_number: data.ink_serial_number
  };
  const fields = Object.keys(map).filter(k => map[k] !== undefined);
  const updates = fields.map(k => `${k} = ?`);
  const values = fields.map(k => map[k]);
  console.log('🟢 UPDATE External_Maintenance:', updates, values);
  if (updates.length) {
    values.push(reportId);
    await db.promise().query(`UPDATE External_Maintenance SET ${updates.join(", ")} WHERE id = ?`, values);
    console.log('✅ External_Maintenance updated');
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
const getModelId = async (type, modelName) => {
  if (!modelName || !type) return null;

  const [existing] = await db.promise().query(
    `SELECT id FROM Maintance_Device_Model WHERE model_name = ? AND device_type_name = ? LIMIT 1`,
    [modelName.trim(), type.trim()]
  );

  if (existing.length > 0) return existing[0].id;

  // 🆕 إذا غير موجود نضيفه تلقائيًا
  const [insert] = await db.promise().query(
    `INSERT INTO Maintance_Device_Model (model_name, device_type_name) VALUES (?, ?)`,
    [modelName.trim(), type.trim()]
  );

  console.log("🆕 Inserted new model:", modelName, "for", type);
  return insert.insertId;
};





// ✅ إضافة خيار جديد في جدول OS_Types بعد التحقق
app.post("/add-os", (req, res) => {
  const { value } = req.body; // استخراج القيمة من الطلب
  if (!value) return res.status(400).json({ error: "❌ Missing OS value" }); // التحقق أن القيمة موجودة

  // التحقق من التكرار
  db.query("SELECT * FROM OS_Types WHERE os_name = ?", [value], (err, result) => {
    if (err) return res.status(500).json({ error: "DB error" });
    if (result.length > 0) return res.status(400).json({ error: "⚠️ OS already exists" });

    // إدخال القيمة إذا لم تكن مكررة
    db.query("INSERT INTO OS_Types (os_name) VALUES (?)", [value], (err2) => {
      if (err2) return res.status(500).json({ error: "Insert error" });
      res.json({ message: "✅ OS added successfully" }); // رسالة نجاح
    });
  });
});

app.post("/add-scanner-type", (req, res) => {
  const { value } = req.body;

  if (!value) {
    return res.status(400).json({ error: "❌ Missing scanner type value" });
  }

  const checkQuery = "SELECT * FROM Scanner_Types WHERE scanner_type = ?";
  db.query(checkQuery, [value], (err, result) => {
    if (err) {
      return res.status(500).json({ error: "❌ DB error during lookup" });
    }

    if (result.length > 0) {
      return res.status(400).json({ error: "⚠️ Scanner type already exists" });
    }

    const insertQuery = "INSERT INTO Scanner_Types (scanner_type) VALUES (?)";
    db.query(insertQuery, [value], (err2) => {
      if (err2) {
        return res.status(500).json({ error: "❌ Error inserting scanner type" });
      }

      res.json({ message: "✅ Scanner type added successfully" });
    });
  });
});

// ✅ إضافة خيار جديد في جدول RAM_Types
app.post("/add-ram", (req, res) => {
  const { value } = req.body;
  if (!value) return res.status(400).json({ error: "❌ Missing RAM value" });

  db.query("SELECT * FROM RAM_Types WHERE ram_type = ?", [value], (err, result) => {
    if (err) return res.status(500).json({ error: "DB error" });
    if (result.length > 0) return res.status(400).json({ error: "⚠️ RAM already exists" });

    db.query("INSERT INTO RAM_Types (ram_type) VALUES (?)", [value], (err2) => {
      if (err2) return res.status(500).json({ error: "Insert error" });
      res.json({ message: "✅ RAM added successfully" });
    });
  });
});

// ✅ إضافة خيار جديد في جدول CPU_Types
app.post("/add-cpu", (req, res) => {
  const { value } = req.body;
  if (!value) return res.status(400).json({ error: "❌ Missing CPU value" });

  db.query("SELECT * FROM CPU_Types WHERE cpu_name = ?", [value], (err, result) => {
    if (err) return res.status(500).json({ error: "DB error" });
    if (result.length > 0) return res.status(400).json({ error: "⚠️ CPU already exists" });

    db.query("INSERT INTO CPU_Types (cpu_name) VALUES (?)", [value], (err2) => {
      if (err2) return res.status(500).json({ error: "Insert error" });
      res.json({ message: "✅ CPU added successfully" });
    });
  });
});
// ✅ إضافة خيار جديد في جدول HardDrive_Types
app.post("/add-harddrive", (req, res) => {
  const { value } = req.body;
  if (!value) return res.status(400).json({ error: "❌ Missing Hard Drive value" });

  db.query("SELECT * FROM Hard_Drive_Types WHERE drive_type = ?", [value], (err, result) => {
    if (err) return res.status(500).json({ error: "DB error" });
    if (result.length > 0) return res.status(400).json({ error: "⚠️ Hard Drive already exists" });

    db.query("INSERT INTO Hard_Drive_Types (drive_type) VALUES (?)", [value], (err2) => {
      if (err2) return res.status(500).json({ error: "Insert error" });
      res.json({ message: "✅ Hard Drive type added successfully" });
    });
  });
});
app.post("/add-printer-type", (req, res) => {
  const { value } = req.body;
  if (!value) return res.status(400).json({ error: "❌ Missing printer type value" });

  db.query("SELECT * FROM Printer_Types WHERE printer_type = ?", [value], (err, result) => {
    if (err) return res.status(500).json({ error: "DB error" });
    if (result.length > 0) return res.status(400).json({ error: "⚠️ Printer type already exists" });

    db.query("INSERT INTO Printer_Types (printer_type) VALUES (?)", [value], (err2) => {
      if (err2) return res.status(500).json({ error: "Insert error" });
      res.json({ message: "✅ Printer type added successfully" });
    });
  });
});
app.post("/add-ink-type", (req, res) => {
  const { value } = req.body;
  if (!value) return res.status(400).json({ error: "❌ Missing ink type value" });

  db.query("SELECT * FROM Ink_Types WHERE ink_type = ?", [value], (err, result) => {
    if (err) return res.status(500).json({ error: "DB error" });
    if (result.length > 0) return res.status(400).json({ error: "⚠️ Ink type already exists" });

    db.query("INSERT INTO Ink_Types (ink_type) VALUES (?)", [value], (err2) => {
      if (err2) return res.status(500).json({ error: "Insert error" });
      res.json({ message: "✅ Ink type added successfully" });
    });
  });
});


// ✅ إضافة خيار جديد في جدول Processor_Generations
app.post("/add-generation", (req, res) => {
  const { value } = req.body;
  if (!value) return res.status(400).json({ error: "❌ Missing generation value" });

  db.query("SELECT * FROM Processor_Generations WHERE generation_number = ?", [value], (err, result) => {
    if (err) return res.status(500).json({ error: "DB error" });
    if (result.length > 0) return res.status(400).json({ error: "⚠️ Generation already exists" });

    db.query("INSERT INTO Processor_Generations (generation_number) VALUES (?)", [value], (err2) => {
      if (err2) return res.status(500).json({ error: "Insert error" });
      res.json({ message: "✅ Generation added successfully" });
    });
  });
});

// ✅ إضافة قسم جديد في جدول Departments
app.post("/add-department", (req, res) => {
  const { value } = req.body;
  // 2.1) التحقق من وجود قيمة وفاصل '|'
  if (!value || typeof value !== "string" || !value.includes("|")) {
    return res.status(400).json({ error: "❌ يجب إرسال النص بصيغة 'EnglishName|ArabicName'" });
  }

  // 2.2) تأكد أن هذا القسم غير موجود
  db.query("SELECT 1 FROM Departments WHERE name = ?", [value], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.length > 0) {
      return res.status(400).json({ error: "⚠️ هذا القسم موجود مسبقًا" });
    }

    // 2.3) أدخله إلى الجدول
    db.query("INSERT INTO Departments (name) VALUES (?)", [value], (err2, result2) => {
      if (err2) return res.status(500).json({ error: err2.message });
      return res.json({ message: "✅ Department added successfully", insertedId: result2.insertId });
    });
  });
});

app.post("add-ram-size", (req, res) => {
  const { value } = req.body;
  if (!value) return res.status(400).json({ error: "❌ Missing RAM size value" });

  db.query("SELECT * FROM RAM_Sizes WHERE ram_size = ?", [value], (err, result) => {
    if (err) return res.status(500).json({ error: "DB error" });
    if (result.length > 0) return res.status(400).json({ error: "⚠️ RAM size already exists" });

    db.query("INSERT INTO RAM_Sizes (ram_size) VALUES (?)", [value], (err2) => {
      if (err2) return res.status(500).json({ error: "Insert error" });
      res.json({ message: "✅ RAM size added successfully" });
    });
  });
});



app.post("/delete-option-general", (req, res) => {
  const { target, value, type } = req.body;

  const tableMap = {
    "problem-type": { table: "DeviceType", column: "DeviceType" },
    "section": { table: "Departments", column: "name" },
    "floor": { table: "Floors", column: "FloorNum" },
    "technical": { table: "Engineers", column: "name" },
    "problem-status": type === "pc"
      ? { table: "ProblemStates_Pc", column: "problem_text" }
      : type === "printer"
        ? { table: "ProblemStates_Printer", column: "problem_text" }
        : type === "scanner"
          ? { table: "ProblemStates_Scanner", column: "problem_text" }
          : { table: "problemStates_Maintance_device", column: "problemStates_Maintance_device_name", extra: "device_type_name" }
  };

  const mapping = tableMap[target];
  if (!mapping) return res.status(400).json({ error: "❌ Invalid target field" });

  let query = "";
  let params = [];

  if (mapping.extra) {
    query = `DELETE FROM ${mapping.table} WHERE ${mapping.column} = ? AND ${mapping.extra} = ?`;
    params = [value, type];
  } else {
    query = `DELETE FROM ${mapping.table} WHERE ${mapping.column} = ?`;
    params = [value];
  }

  db.query(query, params, (err) => {
    if (err) {
      if (err.code === "ER_ROW_IS_REFERENCED_2") {
        return res.status(400).json({
          error: `❌ لا يمكن حذف "${value}" لأنه مرتبط بعناصر أخرى في النظام`
        });
      }

      console.error("❌ Delete failed:", err);
      return res.status(500).json({ error: "❌ Failed to delete option from database" });
    }

    res.json({ message: "✅ Option deleted successfully" });
  });
});

app.put("/update-linked-reports", async (req, res) => {
  const { maintenance_id, status } = req.body;

  try {
    // أولاً نجيب بيانات الجهاز والتاريخ من الجدول الدوري
    const maintenance = await new Promise((resolve, reject) => {
      db.query("SELECT * FROM Regular_Maintenance WHERE id = ?", [maintenance_id], (err, result) => {
        if (err) return reject(err);
        resolve(result[0]);
      });
    });

    if (!maintenance) return res.status(404).json({ error: "Maintenance record not found" });

    // تحديث تقارير الصيانة المرتبطة بنفس الجهاز ونفس التاريخ
    db.query(
      `UPDATE Maintenance_Reports 
       SET status = ? 
       WHERE device_id = ? 
       AND maintenance_type = 'Regular'
       AND DATE(created_at) = DATE(?)`,
      [status, maintenance.device_id, maintenance.last_maintenance_date],
      (err) => {
        if (err) {
          console.error("❌ Error updating linked reports:", err);
          return res.status(500).json({ error: "Failed to update linked reports" });
        }

        res.json({ message: "✅ Linked reports updated" });
      }
    );

  } catch (err) {
    console.error("❌ Internal error updating linked reports:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/update-option-general", (req, res) => {
  // 🟡 استقبل البيانات من الطلب
  const { target, oldValue, newValue, type } = req.body;

  // 🟡 خريطة الربط بين العناصر والجدوال والأعمدة
  const tableMap = {
    "problem-type": { table: "DeviceType", column: "DeviceType" },
    "section": { table: "Departments", column: "name" },
    "floor": { table: "Floors", column: "FloorNum" },
    "technical": { table: "Engineers", column: "name" },
    "problem-status": type === "pc"
      ? { table: "ProblemStates_Pc", column: "problem_text" }
      : type === "printer"
        ? { table: "ProblemStates_Printer", column: "problem_text" }
        : type === "scanner"
          ? { table: "ProblemStates_Scanner", column: "problem_text" }
          : { table: "problemStates_Maintance_device", column: "problemStates_Maintance_device_name", extra: "device_type_name" }
  };

  // 🔴 تحقق أن العنصر موجود في الخريطة
  const mapping = tableMap[target];
  if (!mapping) return res.status(400).json({ error: "Invalid target field" });

  // 🟢 تحقق إذا كانت القيمة الجديدة موجودة مسبقًا
  let checkQuery = `SELECT COUNT(*) AS count FROM ${mapping.table} WHERE ${mapping.column} = ?`;
  let checkParams = [newValue];

  // 🟢 إذا الجدول يحتوي على عمود إضافي (مثل نوع الجهاز في problem-status المخصصة)
  if (mapping.extra) {
    checkQuery += ` AND ${mapping.extra} = ?`;
    checkParams.push(type);
  }

  db.query(checkQuery, checkParams, (checkErr, checkResult) => {
    if (checkErr) {
      console.error("❌ Database check failed:", checkErr);
      return res.status(500).json({ error: "Database check failed" });
    }

    // 🛑 إذا القيمة الجديدة موجودة، نمنع التحديث
    if (checkResult[0].count > 0) {
      return res.status(400).json({ error: `❌ "${newValue}" already exists.` });
    }

    // ✅ إنشاء جملة التحديث الرئيسية
    let updateQuery = "";
    let updateParams = [];

    if (mapping.extra) {
      updateQuery = `UPDATE ${mapping.table} SET ${mapping.column} = ? WHERE ${mapping.column} = ? AND ${mapping.extra} = ?`;
      updateParams = [newValue, oldValue, type];
    } else {
      updateQuery = `UPDATE ${mapping.table} SET ${mapping.column} = ? WHERE ${mapping.column} = ?`;
      updateParams = [newValue, oldValue];
    }

    // 🟢 تنفيذ عملية التحديث
    db.query(updateQuery, updateParams, (err, result) => {
      if (err) {
        console.error("❌ Update failed:", err);
        return res.status(500).json({ error: "Failed to update option" });
      }

      // ✅ رد ناجح
      res.json({ message: `✅ "${oldValue}" updated to "${newValue}" successfully.` });
    });
  });
});


// ✅ تعديل خيار عام + تحديث الجداول المرتبطة تلقائيًا
app.post("/edit-option-general", (req, res) => {
  const { target, oldValue, newValue, type } = req.body;

  if (!target || !oldValue || !newValue) {
    return res.status(400).json({ error: "Missing fields" });
  }

  if (oldValue.trim() === newValue.trim()) {
    return res.status(400).json({ error: "Same value - no change needed" });
  }

  // 🧠 ماب الجداول والأعمدة حسب نوع السلكت
  const updateMap = {
    "problem-type": {
      table: "DeviceType",
      column: "DeviceType",
      propagate: [
        { table: "Maintenance_Devices", column: "device_type" },
        { table: "General_Maintenance", column: "device_type" },
        { table: "External_Maintenance", column: "device_type" },
        { table: "Regular_Maintenance", column: "device_type" },
        { table: "Maintance_Device_Model", column: "device_type_name" },
        { table: "problemStates_Maintance_device", column: "device_type_name" },
      ]
    },
    "section": {
      table: "Departments",
      column: "name",
      propagate: [
        { table: "Maintenance_Devices", column: "department_name" },
        { table: "General_Maintenance", column: "department_name" },
        { table: "External_Maintenance", column: "department_name" },
        { table: "Regular_Maintenance", column: "department_name" },
      ]
    },
    "floor": {
      table: "Floors",
      column: "FloorNum",
      propagate: [
        { table: "General_Maintenance", column: "floor" }
      ]
    },
    "technical": {
      table: "Engineers",
      column: "name",
      propagate: [
        { table: "General_Maintenance", column: "technician_name" }
      ]
    },
    "problem-status": {
      table: type === "pc"
        ? "ProblemStates_Pc"
        : type === "printer"
          ? "ProblemStates_Printer"
          : type === "scanner"
            ? "ProblemStates_Scanner"
            : "problemStates_Maintance_device",
      column: type === "pc" || type === "printer" || type === "scanner"
        ? "problem_text"
        : "problemStates_Maintance_device_name",
      propagate: [
        { table: "General_Maintenance", column: "problem_status" }
      ]
    }
  };

  const map = updateMap[target];
  if (!map) return res.status(400).json({ error: "Invalid target" });

  const checkDuplicateQuery = `SELECT * FROM ${map.table} WHERE ${map.column} = ?`;
  db.query(checkDuplicateQuery, [newValue], (err, rows) => {
    if (err) return res.status(500).json({ error: "DB error" });
    if (rows.length > 0) {
      return res.status(400).json({ error: "This value already exists" });
    }

    const updateQuery = `UPDATE ${map.table} SET ${map.column} = ? WHERE ${map.column} = ?`;
    db.query(updateQuery, [newValue, oldValue], (err) => {
      if (err) return res.status(500).json({ error: "Failed to update main value" });

      // ✅ Update all related tables
      let updateCount = 0;
      map.propagate?.forEach(({ table, column }) => {
        const q = `UPDATE ${table} SET ${column} = ? WHERE ${column} = ?`;
        db.query(q, [newValue, oldValue], (err) => {
          if (err) console.error(`❌ Failed to update ${table}.${column}`, err);
          updateCount++;
        });
      });

      res.json({ message: "✅ Option updated everywhere!" });
    });
  });
});

// 📦 Dependencies: Express, multer, custom authenticateToken middleware, queryAsync, getUserById, getUserNameById

app.post("/internal-ticket-with-file", upload.single("attachment"), authenticateToken, async (req, res) => {
  const userId = req.user.id;

  const {
    report_number,
    priority,
    department_id,
    device_id,
    issue_description,
    initial_diagnosis,
    final_diagnosis,
    other_description,
    assigned_to,
    status = 'Open',
    ticket_type,
    ticket_number
  } = req.body;

  const file = req.file;
  const fileName = file ? file.filename : null;
  const filePath = file ? file.path : null;

  const adminUser = await getUserById(userId);
  const userName = await getUserNameById(userId);

  let engineerName;
  if (adminUser?.role === 'admin' && assigned_to) {
    const techEngineerRes = await queryAsync(`SELECT name FROM Engineers WHERE name = ?`, [assigned_to]);
    engineerName = techEngineerRes[0]?.name || userName;
  } else {
    engineerName = userName;
  }

  // ✅ Handle ticket number (use provided or auto-generate)
  let newTicketNumber = ticket_number;

  const proceedWithInsert = (generatedTicketNumber) => {
    const insertTicketQuery = `
      INSERT INTO Internal_Tickets (
        ticket_number, priority, department_id, issue_description, 
        assigned_to, status, attachment_name, attachment_path, ticket_type, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const ticketValues = [
      generatedTicketNumber,
      priority || "Medium",
      department_id || null,
      issue_description || '',
      assigned_to || '',
      status,
      fileName,
      filePath,
      ticket_type || '',
      userId
    ];

    db.query(insertTicketQuery, ticketValues, (ticketErr, ticketResult) => {
      if (ticketErr) {
        console.error("❌ Insert error (Internal_Tickets):", ticketErr);
        return res.status(500).json({ error: "Failed to insert internal ticket" });
      }

      const ticketId = ticketResult.insertId;

      const insertReportQuery = `
        INSERT INTO Maintenance_Reports (
          report_number, ticket_id, device_id, issue_summary, full_description, 
          status, maintenance_type, report_type, user_id
        ) VALUES (?, ?, ?, ?, ?, ?, 'Internal', 'Incident', ?)
      `;
      const reportValues = [
        generatedTicketNumber,
        ticketId,
        device_id || null,
        initial_diagnosis || '',
        final_diagnosis || other_description || '',
        status,
        userId
      ];

      db.query(insertReportQuery, reportValues, async (reportErr) => {
        if (reportErr) {
          console.error("❌ Insert error (Maintenance_Reports):", reportErr);
          return res.status(500).json({ error: "Failed to insert maintenance report" });
        }

        await queryAsync(`INSERT INTO Notifications (user_id, message, type) VALUES (?, ?, ?)`, [
          userId,
          `Internal ticket created: ${generatedTicketNumber} for ${ticket_type} by ${engineerName}`,
          'internal-ticket'
        ]);

        await queryAsync(`INSERT INTO Notifications (user_id, message, type) VALUES (?, ?, ?)`, [
          userId,
          `Report created for ticket ${generatedTicketNumber} for ${ticket_type}`,
          'internal-ticket-report'
        ]);

        let techUserId;

        // ✅ لو القيمة رقم → اعتبرها user ID مباشرة
        if (!isNaN(assigned_to)) {
          techUserId = parseInt(assigned_to);
        } else {
          // ✅ لو اسم → نحاول نجيب ID من جدول Users
          const techUserRes = await queryAsync(`
    SELECT id FROM Users WHERE name = ?
  `, [assigned_to.trim()]);

          techUserId = techUserRes[0]?.id;



          if (techUserId) {
            await queryAsync(`INSERT INTO Notifications (user_id, message, type) VALUES (?, ?, ?)`, [
              techUserId,
              `You have been assigned a new internal ticket ${generatedTicketNumber} by ${userName}`,
              'technical-notification'
            ]);
          }
        }

        await queryAsync(`
          INSERT INTO Activity_Logs (user_id, user_name, action, details)
          VALUES (?, ?, ?, ?)
        `, [
          userId,
          userName,
          'Submitted Internal Ticket',
          `Internal ticket submitted (${generatedTicketNumber}) with report )`
        ]);

        res.status(201).json({
          message: "✅ Internal ticket and report created",
          ticket_number: generatedTicketNumber,
          ticket_id: ticketId
        });
      });
    });
  };

  if (!newTicketNumber) {
    const counterQuery = `SELECT last_number FROM Ticket_Counters WHERE type = 'INT'`;

    db.query(counterQuery, (counterErr, counterResult) => {
      if (counterErr) {
        console.error("❌ Counter fetch error:", counterErr);
        return res.status(500).json({ error: "Failed to generate ticket number" });
      }

      if (!counterResult.length) {
        return res.status(500).json({ error: "Ticket counter not initialized for type 'INT'" });
      }

      const currentNumber = counterResult[0].last_number;
      const newNumber = currentNumber + 1;
      newTicketNumber = `INT-${String(newNumber).padStart(3, '0')}`;

      const updateCounterQuery = `UPDATE Ticket_Counters SET last_number = ? WHERE type = 'INT'`;

      db.query(updateCounterQuery, [newNumber], (updateErr) => {
        if (updateErr) {
          console.error("❌ Counter update error:", updateErr);
          return res.status(500).json({ error: "Failed to update ticket counter" });
        }

        // بعد تحديث العداد بنجاح، أنشئ التذكرة
        proceedWithInsert(newTicketNumber);
      });
    });
  } else {
    // مثال: INT-008 → ناخذ 8 ونزيده 1
    const manualNumber = parseInt(ticket_number.split("-")[1]);

    if (!isNaN(manualNumber)) {
      const nextNumber = manualNumber + 1;
      newTicketNumber = `INT-${String(nextNumber).padStart(3, '0')}`;

      const updateCounterQuery = `
      UPDATE Ticket_Counters 
      SET last_number = GREATEST(last_number, ?) 
      WHERE type = 'INT'
    `;

      db.query(updateCounterQuery, [nextNumber], (updateErr) => {
        if (updateErr) {
          console.error("❌ Counter update error:", updateErr);
          return res.status(500).json({ error: "Failed to update ticket counter" });
        }

        // ✅ بعد تحديث العداد، أنشئ التذكرة برقم +1 من المستخدم
        proceedWithInsert(newTicketNumber);
      });
    } else {
      return res.status(400).json({ error: "Invalid manual ticket number format" });
    }
  }


});


app.get("/generate-internal-ticket-number", async (req, res) => {
  try {
    const [counterRes] = await queryAsync(`SELECT last_number FROM Ticket_Counters WHERE type = 'INT'`);
    const ticketNumber = `INT-${String(counterRes.last_number).padStart(3, '0')}`;
    return res.json({ ticket_number: ticketNumber });
  } catch (err) {
    console.error("❌ Ticket generation failed:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});




app.get("/ticket-types", (req, res) => {
  const sql = "SELECT * FROM Ticket_Types ORDER BY type_name ASC";
  db.query(sql, (err, result) => {
    if (err) {
      console.error("❌ Failed to fetch ticket types:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(result);
  });
});

app.post("/submit-new-report", authenticateToken, upload.fields([
  { name: "attachment", maxCount: 1 },
  { name: "signature", maxCount: 1 }
]), async (req, res) => {
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
      await getId("Departments", "name", department_name),
      await getModelId(device_type, model_name)
    ];

    if (isPC) {
      insertParams.push(
        await getId("CPU_Types", "cpu_name", cpu_name),
        await getId("RAM_Types", "ram_type", ram_type),
        await getId("OS_Types", "os_name", os_name),
        await getId("Processor_Generations", "generation_number", generation_number),
        await getId("Hard_Drive_Types", "drive_type", drive_type),
        ram_size || null,
        mac_address || null,
        ip_address || null
      );
    }

    insertParams.push(
      printer_type || null,    // ✅ نوع الطابعة (يسمح null)
      ink_type || null,        // ✅ نوع الحبر (يسمح null)
      device_name || null,
      serial_number || null,   // ✅ رقم سيريال (يسمح null للحبر)
      governmental_number || null,
      userId
    );

    await db.promise().query(insertReportSql, insertParams);


    await queryAsync(`
      INSERT INTO Activity_Logs (user_id, user_name, action, details)
      VALUES (?, ?, ?, ?)
    `, [
      userId,
      await getUserNameById(userId),
      'Submitted New Maintenance Report',
      `New report for ${device_type} | Device Name: ${device_name || 'N/A'} | Serial: ${serial_number || 'N/A'} | Department: ${department_name || 'N/A'}`
    ]);


    res.json({ message: "✅ Report saved successfully with printer type and ink type" });

  } catch (err) {
    console.error("❌ Error saving report:", err);
    res.status(500).json({ error: "Server error during insert" });
  }
});


// دالة جلب ID من جدول معين
const getId = async (table, column, value) => {
  if (!value) return null;
  const [rows] = await db.promise().query(`SELECT id FROM ${table} WHERE ${column} = ? LIMIT 1`, [value]);
  return rows[0]?.id || null;
};

function logActivity(userId, userName, action, details) {
  const query = `
    INSERT INTO Activity_Logs (user_id, user_name, action, details)
    VALUES (?, ?, ?, ?)
  `;
  db.query(query, [userId, userName, action, details], (err) => {
    if (err) console.error("❌ Failed to log activity:", err);
  });
}


app.get("/ticket-status", (req, res) => {
  db.query("SELECT DISTINCT status FROM Maintenance_Reports", (err, result) => {
    if (err) {
      console.error("❌ Failed to fetch statuses:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(result.map(r => ({ status_name: r.status })));
  });
});
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// افترض أنّ لديك بالفعل تهيئة لـ express و mysql2/promise و authenticateToken و logActivity
// لاحظ تضمين db كـ instance من mysql2/promise: 
//   const mysql = require('mysql2');
//   const db = mysql.createPool({ /* بيانات الاتصال */ });

app.post("/delete-option-complete", authenticateToken, async (req, res) => {
  const { target, value, type } = req.body;

  if (!target || !value) {
    return res.status(400).json({ error: "❌ Missing fields" });
  }

  // خريطة الحذف بناءً على الـ selectId أو الـ target
  const deleteMap = {
    "ink-type": {
      table: "Ink_Types",
      column: "ink_type",
      referencedTables: [
        { table: "Printer_info", column: "InkType_id" },
        { table: "General_Maintenance", column: "ink_type" },
        { table: "Regular_Maintenance", column: "ink_type" },
        { table: "External_Maintenance", column: "ink_type" },
        { table: "New_Maintenance_Report", column: "ink_type" }
      ]
    },
    "scanner-type": {
      table: "Scanner_Types",
      column: "scanner_type",
      referencedTables: [
        { table: "General_Maintenance", column: "scanner_type" },
        { table: "Regular_Maintenance", column: "scanner_type" },
        { table: "External_Maintenance", column: "scanner_type" },
        { table: "New_Maintenance_Report", column: "scanner_type" }
      ]
    },
    "printer-type": {
      table: "Printer_Types",
      column: "printer_type",
      referencedTables: [
        { table: "Printer_info", column: "PrinterType_id" },
        { table: "General_Maintenance", column: "printer_type" },
        { table: "Regular_Maintenance", column: "printer_type" },
        { table: "External_Maintenance", column: "printer_type" },
        { table: "New_Maintenance_Report", column: "printer_type" }
      ]
    },
    "section": {
      table: "Departments",
      column: "name", // لا نستخدمه مباشرة للحذف؛ نستخدم ID بعد البحث
      referencedTables: [
        { table: "Maintenance_Devices", column: "department_id" },
        { table: "General_Maintenance", column: "department_name" },
        { table: "Regular_Maintenance", column: "department_name" },
        { table: "External_Maintenance", column: "department_name" }
      ]
    },
    "problem-type": {
      table: "DeviceType",
      column: "DeviceType",
      referencedTables: [
        { table: "Maintenance_Devices", column: "device_type" },
        { table: "Regular_Maintenance", column: "device_type" },
        { table: "External_Maintenance", column: "device_type" },
        { table: "Maintance_Device_Model", column: "device_type_name" },
        { table: "problemStates_Maintance_device", column: "device_type_name" }
      ]
    },
    "os-select": {
      table: "OS_Types",
      column: "os_name",
      referencedTables: [
        { table: "PC_info", column: "OS_id" },
        { table: "General_Maintenance", column: "os_name" },
        { table: "Regular_Maintenance", column: "os_name" },
        { table: "External_Maintenance", column: "os_name" }
      ]
    },
    "ram-select": {
      table: "RAM_Types",
      column: "ram_type",
      referencedTables: [
        { table: "PC_info", column: "RAM_id" },
        { table: "General_Maintenance", column: "ram_type" },
        { table: "Regular_Maintenance", column: "ram_type" },
        { table: "External_Maintenance", column: "ram_type" }
      ]
    },
    "cpu-select": {
      table: "CPU_Types",
      column: "cpu_name",
      referencedTables: [
        { table: "PC_info", column: "Processor_id" },
        { table: "General_Maintenance", column: "cpu_name" },
        { table: "Regular_Maintenance", column: "cpu_name" },
        { table: "External_Maintenance", column: "cpu_name" }
      ]
    },
    "generation-select": {
      table: "Processor_Generations",
      column: "generation_number",
      referencedTables: [
        { table: "PC_info", column: "Generation_id" },
        { table: "General_Maintenance", column: "generation_number" },
        { table: "Regular_Maintenance", column: "generation_number" },
        { table: "External_Maintenance", column: "generation_number" }
      ]
    },
    "drive-select": {
      table: "Hard_Drive_Types",
      column: "drive_type",
      referencedTables: [
        { table: "PC_info", column: "Drive_id" },
        { table: "General_Maintenance", column: "drive_type" },
        { table: "Regular_Maintenance", column: "drive_type" },
        { table: "External_Maintenance", column: "drive_type" }
      ]
    },
    "ram-size-select": {
      table: "RAM_Sizes",
      column: "ram_size",
      referencedTables: [
        { table: "PC_info", column: "RamSize_id" },
        { table: "General_Maintenance", column: "ram_size" },
        { table: "Regular_Maintenance", column: "ram_size" },
        { table: "External_Maintenance", column: "ram_size" }
      ]
    },
    "model": {
      table: (type === "pc")      ? "PC_Model"
           : (type === "printer") ? "Printer_Model"
           : (type === "scanner") ? "Scanner_Model"
           : "Maintance_Device_Model",
      column: "model_name",
      referencedTables: [
        { table: "PC_info", column: "Model_id" },
        { table: "Printer_info", column: "Model_id" },
        { table: "Scanner_info", column: "Model_id" },
        { table: "Maintenance_Devices", column: "model_id" },
        { table: "General_Maintenance", column: "model_name" },
        { table: "Regular_Maintenance", column: "model_name" },
        { table: "External_Maintenance", column: "model_name" }
      ]
    },
    "floor": {
      table: "Floors",
      column: "FloorNum",
      referencedTables: [
        { table: "General_Maintenance", column: "floor" }
      ]
    },
    "technical": {
      table: "Engineers",
      column: "name",
      referencedTables: [
        { table: "General_Maintenance", column: "technician_name" },
        { table: "Regular_Maintenance", column: "technical_engineer_id" }
      ]
    },
    "problem-status": {
      table: (type === "pc")      ? "ProblemStates_Pc"
           : (type === "printer") ? "ProblemStates_Printer"
           : (type === "scanner") ? "ProblemStates_Scanner"
           : "problemStates_Maintance_device",
      column: (type === "pc" || type === "printer" || type === "scanner")
                ? "problem_text"
                : "problemStates_Maintance_device_name",
      referencedTables: []
    }
  };

  const mapping = deleteMap[target];
  if (!mapping) {
    return res.status(400).json({ error: "❌ Invalid target field" });
  }

  try {
    let departmentId = null;

    // 1) إذا كان الهدف حذف قسم ("section")، نبحث أولًا عن الـ ID الصحيح
    if (target === "section") {
      // البحث في قسم Departments عن أي صفّ يطابق الاسم العربي أو الإنجليزي
      const [deptRows] = await db.promise().query(
        `
        SELECT id
        FROM Departments
        WHERE TRIM(SUBSTRING_INDEX(name, '|', 1)) = ?
           OR TRIM(SUBSTRING_INDEX(name, '|', -1)) = ?
        LIMIT 1
        `,
        [value.trim(), value.trim()]
      );
      if (!deptRows.length) {
        return res.status(400).json({ error: `❌ Department "${value}" not found.` });
      }
      departmentId = deptRows[0].id;
    }

    // 2) التحقق ما إذا كانت القيمة (أو المعرف) مستخدمة في الجداول الأخرى
    for (const ref of mapping.referencedTables) {
      let query = "";
      let param = null;

      if (target === "section" && ref.column === "department_id") {
        // إذا كان ref.column هو department_id في Maintenance_Devices
        query = `SELECT COUNT(*) AS count FROM ${ref.table} WHERE ${ref.column} = ?`;
        param = departmentId;
      } else {
        // في باقي الحقول، نتحقق عبر القيمة النصية value.trim()
        query = `SELECT COUNT(*) AS count FROM ${ref.table} WHERE ${ref.column} = ?`;
        param = value.trim();
      }

      const [rows] = await db.promise().query(query, [param]);
      if (rows[0].count > 0) {
        return res.status(400).json({
          error: `❌ Can't delete "${value}" because it is referenced in table "${ref.table}".`
        });
      }
    }

    // 3) تنفيذ الحذف الفعلي
    if (target === "section") {
      // حذف السطر اعتمادًا على departmentId
      const [delRes] = await db.promise().query(
        `DELETE FROM Departments WHERE id = ?`,
        [departmentId]
      );
      if (delRes.affectedRows === 0) {
        return res.status(404).json({ error: "❌ Department not found or already deleted." });
      }
    } else {
      // الحذف في حالات أخرى حسب العمود والتحقق إذا لزم الأمر
      let deleteQuery = "";
      let params = [];

      if (target === "problem-status" && type && !["pc", "printer", "scanner"].includes(type)) {
        deleteQuery = `DELETE FROM ${mapping.table} WHERE ${mapping.column} = ? AND device_type_name = ?`;
        params = [value.trim(), type];
      } else {
        deleteQuery = `DELETE FROM ${mapping.table} WHERE ${mapping.column} = ?`;
        params = [value.trim()];
      }

      const [result] = await db.promise().query(deleteQuery, params);
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "❌ Value not found or already deleted." });
      }
    }

    // 4) تسجيل النشاط بعد الحذف
    const userId = req.user?.id;
    const [userRow] = await db.promise().query('SELECT name FROM users WHERE id = ?', [userId]);
    const userName = userRow[0]?.name || 'Unknown';
    logActivity(userId, userName, "Deleted", `Deleted "${value}" from ${mapping.table}`);

    return res.json({ message: `✅ "${value}" deleted successfully.` });
  } catch (err) {
    console.error("❌ Error during delete-option-complete:", err.sqlMessage || err.message || err);
    return res.status(500).json({ error: err.sqlMessage || "Server error during deletion." });
  }
});


// تأكد أنّك قمت بإعداد db كـ mysql2/promise pool، وأن لديك الدالة authenticateToken
// ودالة logActivity مسجّلة مسبقًا في مشروعك.
app.post("/update-option-complete", authenticateToken, async (req, res) => {
  const { target, oldValue, newValue, type } = req.body;

  if (!target || !oldValue || !newValue) {
    return res.status(400).json({ error: "❌ Missing fields" });
  }
  if (oldValue.trim() === newValue.trim()) {
    return res.status(400).json({ error: "❌ Same value - no update needed" });
  }

  // خريطة التحديث لبقية الحقول (غير القسم)
  const updateMap = {
    "ink-type":      { table: "Ink_Types",           column: "ink_type",  propagate: [
                        { table: "Printer_info", column: "InkType_id" },
                        { table: "General_Maintenance", column: "ink_type" },
                        { table: "Regular_Maintenance", column: "ink_type" },
                        { table: "External_Maintenance", column: "ink_type" },
                        { table: "New_Maintenance_Report", column: "ink_type" }
                      ] },
    "printer-type":  { table: "Printer_Types",       column: "printer_type", propagate: [
                        { table: "Printer_info", column: "PrinterType_id" },
                        { table: "General_Maintenance", column: "printer_type" },
                        { table: "Regular_Maintenance", column: "printer_type" },
                        { table: "External_Maintenance", column: "printer_type" },
                        { table: "New_Maintenance_Report", column: "printer_type" }
                      ] },
    "scanner-type":  { table: "Scanner_Types",       column: "scanner_type", propagate: [
                        { table: "General_Maintenance", column: "scanner_type" },
                        { table: "Regular_Maintenance", column: "scanner_type" },
                        { table: "External_Maintenance", column: "scanner_type" },
                        { table: "New_Maintenance_Report", column: "scanner_type" }
                      ] },
    "section":       {
                        table: "Departments",
                        column: "name",
                        propagate: [
                          // department_id لا يحتاج تغيير رقميّ
                          { table: "Maintenance_Devices", column: "department_id" },
                          { table: "General_Maintenance", column: "department_name" },
                          { table: "Regular_Maintenance", column: "department_name" },
                          { table: "External_Maintenance", column: "department_name" }
                        ]
                      },
    "problem-type":  { table: "DeviceType",          column: "DeviceType", propagate: [
                        { table: "Maintenance_Devices", column: "device_type" },
                        { table: "Regular_Maintenance", column: "device_type" },
                        { table: "External_Maintenance", column: "device_type" },
                        { table: "Maintance_Device_Model", column: "device_type_name" },
                        { table: "problemStates_Maintance_device", column: "device_type_name" }
                      ] },
    "os-select":     { table: "OS_Types",            column: "os_name",   propagate: [] },
    "ram-select":    { table: "RAM_Types",           column: "ram_type",  propagate: [] },
    "cpu-select":    { table: "CPU_Types",           column: "cpu_name",  propagate: [] },
    "generation-select": { table: "Processor_Generations", column: "generation_number", propagate: [] },
    "drive-select":  { table: "Hard_Drive_Types",    column: "drive_type", propagate: [] },
    "ram-size-select": { table: "RAM_Sizes",        column: "ram_size",  propagate: [] },
    "model":         {
                        table: (type === "pc")      ? "PC_Model"
                               : (type === "printer") ? "Printer_Model"
                               : (type === "scanner") ? "Scanner_Model"
                               : "Maintance_Device_Model",
                        column: "model_name",
                        propagate: []
                      },
    "floor":         { table: "floors",             column: "FloorNum",  propagate: [
                        { table: "General_Maintenance", column: "floor" }
                      ] },
    "problem-status":{ table: "problem_status",      column: "status_name", propagate: [
                        { table: "General_Maintenance", column: "problem_status" },
                        { table: "Regular_Maintenance", column: "problem_status" }
                      ] },
    "technical":     { table: "Engineers",           column: "name",      propagate: [] }
  };

  const mapping = updateMap[target];
  if (!mapping) {
    return res.status(400).json({ error: "❌ Invalid target" });
  }

  const conn = db.promise();
  try {
    await conn.query("START TRANSACTION");

    if (target === "section") {
      // 1) أولاً: نبحث في جدول Departments عن السطر الذي يحوي oldValue
      //    نعتبر oldValue إمّا الجزء الإنجليزي أو الجزء العربي.
      const [deptRows] = await conn.query(
        `
        SELECT id, name
        FROM Departments
        WHERE
          TRIM(SUBSTRING_INDEX(name, '|', 1)) = ?
          OR TRIM(SUBSTRING_INDEX(name, '|', -1)) = ?
        LIMIT 1
        `,
        [oldValue.trim(), oldValue.trim()]
      );
      if (!deptRows.length) {
        throw new Error("❌ Old Department not found");
      }

      const oldDeptId = deptRows[0].id;
      const fullNameOld = deptRows[0].name; // مثلاً "man|رجل"

      // 2) نفصل الصيغة القديمة إلى الجزأين
      const [enOld, arOld] = fullNameOld.split("|").map(s => s.trim());

      // 3) نحدّد إذا كان oldValue يطابق الجزء العربي (arOld) أو الإنجليزي (enOld)
      //    ونفصل newValue إلى الجزء الجديد (مهما كان بحسب المستخدم).
      //    نفترض أن العميل مرّر newValue كـ نصٍ بلا فاصل "|" (جزء واحد فقط).
      //    فإذا كان oldValue === arOld إذًا نقوم بتغيير الجانب العربي فقط.
      //    وإلا إذا oldValue === enOld نغيّر الجانب الإنجليزي فقط.
      let enNew = enOld;
      let arNew = arOld;
      const newTrim = newValue.trim();

      if (oldValue.trim() === arOld) {
        // العميل غيّر الجزء العربي فقط
        arNew = newTrim;
      } else if (oldValue.trim() === enOld) {
        // العميل غيّر الجزء الإنجليزي فقط
        enNew = newTrim;
      } else {
        // في حالات أخرى، ربما مرّر التطبيق كامل الصيغة "EN_NEW|AR_NEW"
        const parts = newTrim.split("|").map(s => s.trim());
        if (parts.length === 2) {
          enNew = parts[0];
          arNew = parts[1];
        } else {
          throw new Error("❌ Unable to parse newValue for section");
        }
      }

      // 4) Propagate: تحديث الجداول الأخرى التي تخزن department_name (النصي)
      for (const { table, column } of mapping.propagate) {
        if (column === "department_id") {
          // department_id رقمي، لا يتغيّر—يتبقى oldDeptId نفسه
          continue;
        }
        // نُحدّث أي جدول يخزن الاسم النصيّ القديم (arOld) إلى النصي الجديد (arNew)
        await conn.query(
          `UPDATE ${table} SET ${column} = ? WHERE ${column} = ?`,
          [arNew, arOld]
        );
      }

      // 5) تحديث اسم القسم في جدول Departments إلى الصيغة الكاملة الجديدة "enNew|arNew"
      const fullNameNew = `${enNew}|${arNew}`;
      await conn.query(
        `UPDATE ${mapping.table} SET ${mapping.column} = ? WHERE id = ?`,
        [fullNameNew, oldDeptId]
      );

    } else if (target === "problem-type") {
      // منطق التحديث المعتاد للـ problem-type (إضافة قيمة جديدة إن لم تكن موجودة، ثم Propagate ثم حذف القديم)
      const [existsRows] = await conn.query(
        `SELECT 1 FROM ${mapping.table} WHERE ${mapping.column} = ? LIMIT 1`,
        [newValue.trim()]
      );
      if (!existsRows.length) {
        await conn.query(
          `INSERT INTO ${mapping.table} (${mapping.column}) VALUES (?)`,
          [newValue.trim()]
        );
      }
      for (const { table, column } of mapping.propagate) {
        await conn.query(
          `UPDATE ${table} SET ${column} = ? WHERE ${column} = ?`,
          [newValue.trim(), oldValue.trim()]
        );
      }
      await conn.query(
        `DELETE FROM ${mapping.table} WHERE ${mapping.column} = ?`,
        [oldValue.trim()]
      );

    } else {
      // باقي الحقول: Propagate ثم تحديث الجدول الرئيسي
      for (const { table, column } of mapping.propagate) {
        await conn.query(
          `UPDATE ${table} SET ${column} = ? WHERE ${column} = ?`,
          [newValue.trim(), oldValue.trim()]
        );
      }
      await conn.query(
        `UPDATE ${mapping.table} SET ${mapping.column} = ? WHERE ${mapping.column} = ?`,
        [newValue.trim(), oldValue.trim()]
      );
    }

    await conn.query("COMMIT");

    // تسجيل النشاط
    const userId = req.user?.id;
    const [userRow] = await db.promise().query(
      "SELECT name FROM users WHERE id = ?",
      [userId]
    );
    const userName = userRow[0]?.name || "Unknown";
    logActivity(
      userId,
      userName,
      "Edited",
      `Updated "${oldValue}" to "${newValue}" in ${mapping.table}`
    );

    return res.json({ message: "✅ Option updated correctly." });

  } catch (err) {
    await conn.query("ROLLBACK");
    console.error("❌ Error during update-option-complete:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
});


app.post("/delete-device-specification", authenticateToken, async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: "❌ Missing device ID" });
  }

  try {
    const [deviceInfo] = await db.promise().query(
      `SELECT device_name, Serial_Number, Governmental_Number FROM Maintenance_Devices WHERE id = ?`,
      [id]
    );

    if (!deviceInfo.length) {
      return res.status(404).json({ error: "❌ Device not found" });
    }

    // ✅ Soft delete: علّم الجهاز كمحذوف
    const [updateResult] = await db.promise().query(
      `UPDATE Maintenance_Devices SET is_deleted = TRUE WHERE id = ?`,
      [id]
    );

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ error: "❌ Already deleted or not found" });
    }

    const userId = req.user?.id;
    const [userRow] = await db.promise().query('SELECT name FROM users WHERE id = ?', [userId]);
    const userName = userRow[0]?.name || 'Unknown';

    await logActivity(userId, userName, "Deleted", `Soft-deleted device ID ${id} (${deviceInfo[0].device_name})`);

    res.json({ message: "✅ Device soft-deleted successfully." });

  } catch (err) {
    console.error("❌ Delete device error:", err);
    res.status(500).json({ error: "Server error during deletion." });
  }
});
app.post("/update-device-specification", authenticateToken, async (req, res) => {
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

    logActivity(
      userId,
      userName,
      "Edited",
      `Updated device ID ${id} – name: ${name}, serial: ${Serial_Number}, gov#: ${Governmental_Number}`
    );

    res.json({ message: "✅ Device specification updated successfully." });

  } catch (err) {
    console.error("❌ Update device error:", err);
    res.status(500).json({ error: "❌ Server error during update." });
  }
});


// ضروري تتأكد إن عندك body-parser أو express.json() مفعّل

app.post('/add-option-internal-ticket', authenticateToken, async (req, res) => {
  try {
    const { target, value, type } = req.body;
    const userId = req.user?.id;

    if (!target || !value) {
      return res.status(400).json({ error: "❌ Missing target or value." });
    }

    let query = "";
    let values = [];

    switch (target) {
      case "department": query = "INSERT INTO Departments (name) VALUES (?)"; break;
      case "technical": query = "INSERT INTO Engineers (name) VALUES (?)"; break;
      case "device-type": query = "INSERT INTO DeviceType (DeviceType) VALUES (?)"; break;
      case "problem-status":
        if (!type) return res.status(400).json({ error: "❌ Missing device type for problem status." });
        if (type === "pc") query = "INSERT INTO problemstates_pc (problem_text) VALUES (?)";
        else if (type === "printer") query = "INSERT INTO problemstates_printer (problem_text) VALUES (?)";
        else if (type === "scanner") query = "INSERT INTO problemstates_scanner (problem_text) VALUES (?)";
        else {
          query = "INSERT INTO problemstates_maintance_device (problemStates_Maintance_device_name, device_type) VALUES (?, ?)";
          values = [value, type];
        }
        break;
      case "ticket-type": query = "INSERT INTO ticket_types (type_name) VALUES (?)"; break;
      case "report-status": query = "INSERT INTO report_statuses (status_name) VALUES (?)"; break;
      case "generation": query = "INSERT INTO processor_generations (generation_number) VALUES (?)"; break;
      case "processor": query = "INSERT INTO cpu_types (cpu_name) VALUES (?)"; break;
      case "ram": query = "INSERT INTO ram_types (ram_type) VALUES (?)"; break;
      case "model": query = "INSERT INTO pc_model (model_name) VALUES (?)"; break;
      case "os": query = "INSERT INTO os_types (os_name) VALUES (?)"; break;
      case "drive": query = "INSERT INTO Hard_Drive_Types (drive_type) VALUES (?)"; break;
      case "ram-size": query = "INSERT INTO RAM_Sizes (ram_size) VALUES (?)"; break;
      case "ink-type": query = "INSERT INTO Ink_Types (ink_type) VALUES (?)"; break;
      case "printer-type": query = "INSERT INTO Printer_Types (printer_type) VALUES (?)"; break;
      case "scanner-type": query = "INSERT INTO Scanner_Types (scanner_type) VALUES (?)"; break;
      default: return res.status(400).json({ error: "❌ Invalid target." });
    }

    if (values.length === 0) values = [value];

    await db.promise().query(query, values);

    // 🔐 تسجيل اللوق
    db.query("SELECT name FROM users WHERE id = ?", [userId], (errUser, resultUser) => {
      if (!errUser && resultUser.length > 0) {
        const userName = resultUser[0].name;
        const logQuery = `
          INSERT INTO Activity_Logs (user_id, user_name, action, details)
          VALUES (?, ?, ?, ?)
        `;
        const logValues = [
          userId,
          userName,
          `Added '${target}'`,
          `Added '${value}' to '${target}'`
        ];
        db.query(logQuery, logValues, (logErr) => {
          if (logErr) console.error("❌ Logging failed:", logErr);
        });
      }
    });

    return res.json({ message: `✅ Successfully added ${value} to ${target}` });

  } catch (err) {
    console.error("❌ Error in add-option-internal-ticket:", err);
    return res.status(500).json({ error: "❌ Server error while adding option." });
  }
});

app.post('/add-option-external-ticket', authenticateToken, async (req, res) => {
  try {
    const { target, value } = req.body;
    const userId = req.user?.id;

    if (!target || !value) {
      return res.status(400).json({ error: "❌ Missing target or value." });
    }

    let query = "";
    let values = [];

    switch (target) {
      case "department": query = "INSERT INTO Departments (name) VALUES (?)"; break;
      case "device-type": query = "INSERT INTO DeviceType (DeviceType) VALUES (?)"; break;
      case "generation": query = "INSERT INTO processor_generations (generation_number) VALUES (?)"; break;
      case "processor": query = "INSERT INTO cpu_types (cpu_name) VALUES (?)"; break;
      case "ram": query = "INSERT INTO ram_types (ram_type) VALUES (?)"; break;
      case "model": query = "INSERT INTO pc_model (model_name) VALUES (?)"; break;
      case "os": query = "INSERT INTO os_types (os_name) VALUES (?)"; break;
      case "drive": query = "INSERT INTO Hard_Drive_Types (drive_type) VALUES (?)"; break;
      case "ram-size": query = "INSERT INTO RAM_Sizes (ram_size) VALUES (?)"; break;
      case "ink-type": query = "INSERT INTO Ink_Types (ink_type) VALUES (?)"; break;
      case "printer-type": query = "INSERT INTO Printer_Types (printer_type) VALUES (?)"; break;
      case "scanner-type": query = "INSERT INTO Scanner_Types (scanner_type) VALUES (?)"; break;
      default: return res.status(400).json({ error: "❌ Invalid target." });
    }

    values = [value];
    await db.promise().query(query, values);

    // 🔐 تسجيل اللوق
    db.query("SELECT name FROM users WHERE id = ?", [userId], (errUser, resultUser) => {
      if (!errUser && resultUser.length > 0) {
        const userName = resultUser[0].name;
        const logQuery = `
          INSERT INTO Activity_Logs (user_id, user_name, action, details)
          VALUES (?, ?, ?, ?)
        `;
        const logValues = [
          userId,
          userName,
          `Added '${target}'`,
          `Added '${value}' to '${target}'`
        ];
        db.query(logQuery, logValues, (logErr) => {
          if (logErr) console.error("❌ Logging failed:", logErr);
        });
      }
    });

    return res.json({ message: `✅ Successfully added ${value} to ${target}` });

  } catch (err) {
    console.error("❌ Error in add-option-external-ticket:", err);
    return res.status(500).json({ error: "❌ Server error while adding option." });
  }
});




app.post("/external-ticket-with-file", upload.single("attachment"), authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const {
      ticket_number,
      reporter_name,
      device_type,
      section,
      device_spec,
      priority,
      issue_description,
      report_datetime
    } = req.body;

    const file = req.file;
    const fileName = file ? file.filename : null;
    const filePath = file ? file.path : null;

    const capitalizedPriority = priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase();

    const userName = await getUserNameById(userId);


    const insertTicketQuery = `
      INSERT INTO External_Tickets (
        ticket_number,
        department_id,
        priority,
        issue_description,
        assigned_to,
        status,
        attachment_name,
        attachment_path,
        report_datetime,
        user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const ticketValues = [
      ticket_number,
      section || null,
      capitalizedPriority,
      issue_description || '',
      reporter_name || '',
      'Open',
      fileName || '',
      filePath || '',
      report_datetime || new Date(),
      userId
    ];

    const ticketResult = await queryAsync(insertTicketQuery, ticketValues);
    const ticketId = ticketResult.insertId;

    const insertReportQuery = `
      INSERT INTO Maintenance_Reports (
        report_number,
        ticket_id,
        device_id,
        issue_summary,
        full_description,
        status,
        maintenance_type,
        report_type,
        priority,
        user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const reportValues = [
      ticket_number,
      ticketId,
      device_spec || null,
      issue_description || '',
      '',
      'Open',
      'External',
      'Incident',
      capitalizedPriority || 'Medium',
      userId
    ];

    await queryAsync(insertReportQuery, reportValues);

    // ✅ إشعار إنشاء التذكرة
    await queryAsync(`INSERT INTO Notifications (user_id, message, type) VALUES (?, ?, ?)`, [
      userId,
      `External ticket created: ${ticket_number} by ${userName || 'N/A'}`,
      'external-ticket'
    ]);

    // ✅ إشعار إنشاء التقرير
    await queryAsync(`INSERT INTO Notifications (user_id, message, type) VALUES (?, ?, ?)`, [
      userId,
      `Report created for external ticket ${ticket_number} by ${userName || 'N/A'}`,
      'external-ticket-report'
    ]);

    res.status(201).json({
      message: "✅ External ticket and report created successfully",
      ticket_number: ticket_number,
      ticket_id: ticketId
    });

  } catch (err) {
    console.error("❌ Server error:", err);

    // ✅ معالجة خطأ "Duplicate report_number"
    if (err.code === 'ER_DUP_ENTRY' && err.sqlMessage.includes('report_number')) {
      return res.status(400).json({
        error: `The report number "${req.body.ticket_number}" is already in use. Please use a different one.`
      });
    }

    // ❌ خطأ عام
    res.status(500).json({ error: "Unexpected server error" });
  }

});

const cron = require('node-cron');
const e = require("express");

// 🔁 الصيانة الدورية
cron.schedule('1 9 * * *', async () => {
  console.log('🔍 Checking for due maintenance...');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const [rows] = await db.promise().query(`
      SELECT 
        rm.id, rm.device_id, rm.device_name, rm.device_type, rm.technical_engineer_id,
        rm.last_maintenance_date, rm.frequency
      FROM Regular_Maintenance rm
      WHERE rm.status = 'Open' AND rm.frequency IS NOT NULL
    `);

    for (const row of rows) {
      try {
        const rawDate = row.last_maintenance_date;
        const freq = parseInt(row.frequency);

        if (!rawDate || isNaN(new Date(rawDate)) || isNaN(freq)) {
          console.warn(`⚠️ Skipping invalid entry for device ID ${row.device_id}`);
          continue;
        }

        const dueDate = new Date(rawDate);
        dueDate.setMonth(dueDate.getMonth() + freq);
        dueDate.setHours(0, 0, 0, 0);

        if (dueDate.getTime() === today.getTime()) {
          const [engineerRes] = await db.promise().query(
            `SELECT name FROM Engineers WHERE id = ?`, [row.technical_engineer_id]
          );
          const engineerName = engineerRes[0]?.name;
          if (!engineerName) {
            console.warn(`⚠️ Engineer not found for ID ${row.technical_engineer_id}`);
            continue;
          }

          const [userRes] = await db.promise().query(
            `SELECT id FROM Users WHERE name = ?`, [engineerName]
          );
          const techUserId = userRes[0]?.id;
          if (!techUserId) {
            console.warn(`⚠️ No matching user for engineer name ${engineerName}`);
            continue;
          }

          const message = `🔔 Maintenance is due today for device: ${row.device_name} (${row.device_type})`;

          const [existingNotifs] = await db.promise().query(`
            SELECT id FROM Notifications 
            WHERE user_id = ? AND message = ? AND DATE(created_at) = CURDATE()
          `, [techUserId, message]);

          if (existingNotifs.length > 0) {
            console.log(`⏭️ Skipping duplicate reminder for ${engineerName} & device ${row.device_name}`);
            continue;
          }

          await db.promise().query(`
            INSERT INTO Notifications (user_id, message, type)
            VALUES (?, ?, ?)
          `, [techUserId, message, 'maintenance-reminder']);

          console.log(`✅ Notification sent to ${engineerName} for ${row.device_name}`);
        }
      } catch (innerErr) {
        console.error(`❌ Error processing row for device ID ${row.device_id}:`, innerErr.message);
      }
    }
  } catch (error) {
    console.error("❌ Error in maintenance reminder cron:", error);
  }
});

// 🧾 تذاكر الدعم الخارجية
cron.schedule('2 9 * * *', async () => {
  console.log('🔍 Checking external tickets older than 3 days...');

  try {
    const [tickets] = await db.promise().query(`
      SELECT et.id, et.ticket_number, et.status, et.report_datetime, et.user_id, u.name AS user_name
      FROM External_Tickets et
      LEFT JOIN Users u ON et.user_id = u.id
      WHERE et.status = 'Open'
        AND DATEDIFF(CURDATE(), DATE(et.report_datetime)) >= 3
    `);

    for (const ticket of tickets) {
      const notifMessage = `🚨 Ticket ${ticket.ticket_number} has been open for 3+ days. Please follow up.`;

      const [existing] = await db.promise().query(`
        SELECT id FROM Notifications
        WHERE user_id = ? AND message = ? AND DATE(created_at) = CURDATE()
      `, [ticket.user_id, notifMessage]);

      if (existing.length > 0) {
        console.log(`⏭️ Notification already sent today for ticket ${ticket.ticket_number}`);
        continue;
      }

      await db.promise().query(`
        INSERT INTO Notifications (user_id, message, type)
        VALUES (?, ?, ?)
      `, [ticket.user_id, notifMessage, 'external-ticket-followup']);

      console.log(`✅ Reminder sent to ${ticket.user_name} for ticket ${ticket.ticket_number}`);
    }

  } catch (err) {
    console.error("❌ Error in external ticket reminder cron:", err);
  }
});

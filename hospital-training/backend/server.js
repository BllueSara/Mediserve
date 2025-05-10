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
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "authintication")));
app.use(express.static(path.join(__dirname, "Home")));


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


app.get('/TypeProplem', authenticateToken, (req, res) => {
  const role = req.user.role;  // هذا يجيك من التوكن
  db.query("SELECT * FROM DeviceType", (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deviceTypes: result, role });
  });
});

app.get("/problem-states/:deviceType", (req, res) => {
  const { deviceType } = req.params;
  const allowedTables = {
    pc: 'ProblemStates_Pc',
    printer: 'ProblemStates_Printer',
    scanner: 'ProblemStates_Scanner'
  };

  if (deviceType === 'all-devices') {
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
  } else if (allowedTables[deviceType.toLowerCase()]) {
    const tableName = allowedTables[deviceType.toLowerCase()];
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
      [deviceType],
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
  const query = "SELECT * FROM Departments  ORDER BY name ASC ";
  db.query(query, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(result);
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



app.post("/submit-external-maintenance", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const {
    ticket_number,
    device_type: rawDeviceType,
    device_specifications,
    section,
    maintenance_manager,
    reporter_name,
    initial_diagnosis,
    final_diagnosis
  } = req.body;

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
        COALESCE(pt.printer_type, '') AS printer_type,
        COALESCE(it.ink_type, '') AS ink_type,
        COALESCE(iser.serial_number, '') AS ink_serial_number,
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
    deviceType = allowedTypes.includes(deviceType)
      ? deviceType.charAt(0).toUpperCase() + deviceType.slice(1)
      : deviceInfo.device_type;

    const commonValues = [
      ticket_number, deviceType, device_specifications, section,
      maintenance_manager, reporter_name,
      initial_diagnosis, final_diagnosis,
      deviceInfo.serial_number, deviceInfo.governmental_number, deviceInfo.device_name,
      deviceInfo.department_name, deviceInfo.cpu_name, deviceInfo.ram_type, deviceInfo.os_name,
      deviceInfo.generation_number, deviceInfo.model_name, deviceInfo.drive_type, deviceInfo.ram_size,
      deviceInfo.mac_address, deviceInfo.printer_type, deviceInfo.ink_type, deviceInfo.ink_serial_number,
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
        generation_number, model_name, drive_type, ram_size, mac_address,
        printer_type, ink_type, ink_serial_number, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, commonValues);

    // 2️⃣ إدخال تلخيص التذكرة
    await queryAsync(`
      INSERT INTO External_Maintenance (
        ticket_number, device_type, device_specifications, section,
        maintenance_manager, reporter_name,
        initial_diagnosis, final_diagnosis,
        serial_number, governmental_number, device_name,
        department_name, cpu_name, ram_type, os_name,
        generation_number, model_name, drive_type, ram_size, mac_address,
        printer_type, ink_type, ink_serial_number, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      ticket_number, deviceType, device_specifications, section,
      maintenance_manager, reporter_name,
      initial_diagnosis, `Ticket (${ticket_number}) has been created by (${reporter_name})`,
      deviceInfo.serial_number, deviceInfo.governmental_number, deviceInfo.device_name,
      deviceInfo.department_name, deviceInfo.cpu_name, deviceInfo.ram_type, deviceInfo.os_name,
      deviceInfo.generation_number, deviceInfo.model_name, deviceInfo.drive_type, deviceInfo.ram_size,
      deviceInfo.mac_address, deviceInfo.printer_type, deviceInfo.ink_type, deviceInfo.ink_serial_number,
      userId
    ]);

    // 🛎️ إشعار 1: تقرير الصيانة
    await queryAsync(`INSERT INTO Notifications (user_id, message, type) VALUES (?, ?, ?)`, [
      userId,
      `External maintenance report saved for ${deviceInfo.device_name} (${displayDevice}) problem is ${initial_diagnosis} by ${userName}`,
      'external-maintenance'
    ]);

    // 🛎️ إشعار 2: تلخيص التذكرة
    await queryAsync(`INSERT INTO Notifications (user_id, message, type) VALUES (?, ?, ?)`, [
      userId,
      `Ticket (${ticket_number}) saved for ${deviceInfo.device_name} (${displayDevice}) problem is ${initial_diagnosis} by ${userName}`,
      'external-ticket-report'
    ]);

    // 🛎️ إشعار 3: للمدير (admin) إذا موجود
    const adminRes = await queryAsync(`SELECT id FROM users WHERE name = ?`, [reporter_name]);
    const adminId = adminRes[0]?.id;
    if (adminId) {
      await queryAsync(`INSERT INTO Notifications (user_id, message, type) VALUES (?, ?, ?)`, [
        adminId,
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
      `Submitted external maintenance for a ${deviceInfo.device_type} | Device Name: ${deviceInfo.device_name} | Serial: ${deviceInfo.serial_number} | Governmental No.: ${deviceInfo.governmental_number}`
    ]);
    

    res.json({ message: "✅ External maintenance, ticket summary, and notifications saved successfully." });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: "❌ Internal server error" });
  }
});



// ✅ GET Devices with ID from Maintenance_Devices

app.get("/devices/:type/:department", (req, res) => {
  const type = req.params.type.toLowerCase();
  const department = req.params.department;

  // جداول info لبعض الأنواع المشهورة
  const tableMap = {
    pc: { table: "PC_info", nameCol: "Computer_Name" },
    printer: { table: "Printer_info", nameCol: "Printer_Name" },
    scanner: { table: "Scanner_info", nameCol: "Scanner_Name" },
  };
  let joinClause = "";
  let nameSelect = "md.device_name AS name";

  if (tableMap[type]) {
    const table = tableMap[type].table;
    const nameCol = tableMap[type].nameCol;

    joinClause = `
      LEFT JOIN ${table} d
      ON md.serial_number = d.Serial_Number
      AND md.governmental_number = d.Governmental_Number
    `;
    nameSelect = `COALESCE(d.${nameCol}, md.device_name) AS name`;
  }


  const sql = `
    SELECT 
      md.id,
      md.serial_number AS Serial_Number,
      md.governmental_number AS Governmental_Number,
      ${nameSelect}
    FROM Maintenance_Devices md
    ${joinClause}
    WHERE md.device_type = ?
      AND md.department_id = (SELECT id FROM Departments WHERE name = ?)
  `;

  db.query(sql, [type, department], (err, result) => {
    if (err) {
      console.error("❌ Error fetching devices:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.json(result);
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

app.post("/submit-regular-maintenance", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const {
    "maintenance-date": date,
    frequency,
    "device-type": rawDeviceType,
    section,
    "device-spec": deviceSpec,
    details = [],
    notes = "",
    problem_status = "",
    technical_engineer_id = null
  } = req.body;

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
             COALESCE(pt.printer_type, '') AS printer_type,
             COALESCE(it.ink_type, '') AS ink_type,
             COALESCE(iser.serial_number, '') AS ink_serial_number,
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
        problem_status, technical_engineer_id, mac_address, printer_type, ink_type, ink_serial_number,
        user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      technical_engineer_id,
      deviceInfo.mac_address,
      deviceInfo.printer_type,
      deviceInfo.ink_type,
      deviceInfo.ink_serial_number,
      userId
    ]);

    await queryAsync(`INSERT INTO Notifications (user_id, message, type) VALUES (?, ?, ?)`, [
      userId,
      `Regular maintenance created for ${displayDevice} by engineer ${engineerName || 'N/A'} {${problem_status}}`,
      'regular-maintenance'
    ]);
    

    const ticketNumber = `TIC-${Date.now()}`;
    const ticketRes = await queryAsync(`
      INSERT INTO Internal_Tickets (
        ticket_number, priority, department_id, issue_description, assigned_to, mac_address, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      ticketNumber,
      "Medium",
      departmentId,
      problem_status || "Regular Maintenance",
      technical_engineer_id,
      deviceInfo.mac_address,
      userId
    ]);
    const ticketId = ticketRes.insertId;
    const reportNumberTicket = `REP-${Date.now()}-TICKET`;
    await queryAsync(`
      INSERT INTO Maintenance_Reports (
        report_number, ticket_id, device_id,
        issue_summary, full_description, status, maintenance_type, mac_address, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      reportNumberTicket,
      ticketId,
      deviceSpec,
      "Ticket Created",
      `Ticket (${ticketNumber}) for device: ${deviceInfo.device_name} - Department: ${deviceInfo.department_name}`,
      "Open",
      "Regular",
      deviceInfo.mac_address,
      userId
    ]);
    await queryAsync(`
      INSERT INTO Notifications (user_id, message, type)
      VALUES (?, ?, ?)
    `, [
      userId,
      `Report created ${ticketNumber} for ${displayDevice} by engineer ${engineerName || 'N/A'} (${problem_status})`,
      'internal-ticket-report'
    ]);
    
    const reportNumberMain = `REP-${Date.now()}-MAIN`;
    await queryAsync(`
      INSERT INTO Maintenance_Reports (
        report_number, ticket_id, device_id,
        issue_summary, full_description, status, maintenance_type, mac_address, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      reportNumberMain,
      ticketId,
      deviceSpec,
      checklist,
      notes || "Routine periodic maintenance performed.",
      "Open",
      "Regular",
      deviceInfo.mac_address,
      userId
    ]);

    await queryAsync(`
      INSERT INTO Notifications (user_id, message, type)
      VALUES (?, ?, ?)
    `, [
      userId,
      `Report created ${reportNumberMain} for device ${deviceInfo.device_name} (${displayDevice}) by engineer ${engineerName || 'N/A'}`,
      'regular-report'
    ]);

    const techEngineerRes = await queryAsync(`SELECT name FROM Engineers WHERE id = ?`, [technical_engineer_id]);
    const techEngineerName = techEngineerRes[0]?.name;

    if (adminUser?.role === 'admin' && techEngineerName) {
      const techUserRes = await queryAsync(`SELECT id FROM Users WHERE name = ?`, [techEngineerName]);
      const techUserId = techUserRes[0]?.id;
    
      if (techUserId) {
        await queryAsync(`INSERT INTO Notifications (user_id, message, type) VALUES (?, ?, ?)`, [
          techUserId,
          `You have been assigned a new Regular maintenance task on ${displayDevice} by ${adminUser.name}`,
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



app.post("/add-option-general", (req, res) => {
  const { target, value, type } = req.body;

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
    "printer-type": { table: "Printer_Types", column: "printer_type" }, // ✅ NEW
    "ink-type": { table: "Ink_Types", column: "ink_type" },             // ✅ NEW
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
      res.json({ message: `✅ ${value} added to ${mapping.table}`, insertedId: result.insertId });
    });
  });
});




app.post("/add-options-external", (req, res) => {
  const { target, value } = req.body;
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

  // ✅ تحقق أولاً إذا كانت القيمة موجودة مسبقًا
  const checkQuery = `SELECT * FROM ${table} WHERE ${column} = ? LIMIT 1`;
  db.query(checkQuery, [value], (checkErr, checkResult) => {
    if (checkErr) {
      console.error("❌ Error checking existing value:", checkErr);
      return res.status(500).json({ error: "Database error" });
    }

    if (checkResult.length > 0) {
      return res.status(400).json({ error: `⚠️ "${value}" already exists!` });
    }

    // ✅ إذا ما كانت موجودة، أضفها
    const insertQuery = `INSERT INTO ${table} (${column}) VALUES (?)`;
    db.query(insertQuery, [value], (insertErr, insertResult) => {
      if (insertErr) {
        console.error("❌ Error inserting option:", insertErr);
        return res.status(500).json({ error: "Database insert error" });
      }
      res.json({ message: `✅ ${value} added successfully` });
    });
  });
});

app.post("/add-options-regular", (req, res) => {
  const { target, value, type } = req.body; // 🟢 استخراج البيانات من الجسم

  const tableMap = {
    "device-type": { table: "DeviceType", column: "DeviceType" },
    "section": { table: "Departments", column: "name" },
    "os-select": { table: "OS_Types", column: "os_name" },
    "ram-select": { table: "RAM_Types", column: "ram_type" },
    "ram-size-select": { table: "RAM_Sizes", column: "ram_size" },
    "cpu-select": { table: "CPU_Types", column: "cpu_name" },
    "generation-select": { table: "Processor_Generations", column: "generation_number" },
    "drive-select": { table: "Hard_Drive_Types", column: "drive_type" },
    "problem-status": type === "pc"
      ? { table: "ProblemStates_Pc", column: "problem_text" }
      : type === "printer"
        ? { table: "ProblemStates_Printer", column: "problem_text" }
        : type === "scanner"
          ? { table: "ProblemStates_Scanner", column: "problem_text" }
          : { table: "problemStates_Maintance_device", column: "problemStates_Maintance_device_name", extra: "device_type_name" },
    "technical": { table: "Engineers", column: "name" },
    "printer-type": { table: "Printer_Types", column: "printer_type" },
    "ink-type": { table: "Ink_Types", column: "ink_type" },
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
      res.json({ message: `✅ ${value} added to ${mapping.table}` });
    });
  });
});

app.post("/submit-general-maintenance", authenticateToken, async (req, res) => {
  const userId = req.user.id;

  const {
    "maintenance-date": date,
    DeviceType: rawDeviceType,
    DeviceID: deviceSpec,
    Section: section,
    Floor: floor,
    Extension: extension,
    ProblemStatus: problemStatus,
    InitialDiagnosis: initialDiagnosis,
    FinalDiagnosis: finalDiagnosis,
    Technical: technical,
    CustomerName: customerName,
    IDNumber: idNumber,
    Notes: notes = ""
  } = req.body;

  const adminUser = await getUserById(userId);
  const userName = await getUserNameById(userId);

  let engineerName;
  if (adminUser?.role === 'admin' && technical) {
    const techEngineerRes = await queryAsync(`SELECT name FROM Engineers WHERE id = ?`, [technical]);
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
             COALESCE(pt.printer_type, '') AS printer_type,
             COALESCE(it.ink_type, '') AS ink_type,
             COALESCE(iser.serial_number, '') AS ink_serial_number,
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
        drive_type, ram_size, mac_address, printer_type, ink_type, ink_serial_number, created_at, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
    `, [
      customerName, idNumber, maintenanceDate,
      "General Maintenance", initialDiagnosis || "", finalDiagnosis || "", deviceSpec,
      technical, floor || "", extension || "", problemStatus || "", notes,
      deviceInfo.serial_number, deviceInfo.governmental_number, deviceInfo.device_name, deviceInfo.department_name,
      deviceInfo.cpu_name, deviceInfo.ram_type, deviceInfo.os_name, deviceInfo.generation_number, deviceInfo.model_name,
      deviceInfo.drive_type, deviceInfo.ram_size, deviceInfo.mac_address, deviceInfo.printer_type, deviceInfo.ink_type,
      deviceInfo.ink_serial_number, userId
    ]);

    const ticketNumber = `TIC-${Date.now()}`;
    const ticketRes = await queryAsync(
      "INSERT INTO Internal_Tickets (ticket_number, priority, department_id, issue_description, assigned_to, mac_address, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [ticketNumber, "Medium", departmentId, problemStatus, technical, deviceInfo.mac_address, userId]
    );
    const ticketId = ticketRes.insertId;

    const reportNumberMain = `REP-${Date.now()}-MAIN`;
    await queryAsync(`
      INSERT INTO Maintenance_Reports (report_number, ticket_id, device_id, issue_summary, full_description, status, maintenance_type, mac_address, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      reportNumberMain, ticketId, deviceSpec,
      `Selected Issue: ${problemStatus}`,
      `Initial Diagnosis: ${initialDiagnosis}`,
      "Open", "General", deviceInfo.mac_address, userId
    ]);

    const reportNumberTicket = `REP-${Date.now()}-TICKET`;
    await queryAsync(`
      INSERT INTO Maintenance_Reports (report_number, ticket_id, device_id, issue_summary, full_description, status, maintenance_type, mac_address, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      reportNumberTicket, ticketId, deviceSpec,
      "Ticket Created",
      `Ticket (${ticketNumber}) for device: ${deviceInfo.device_name} - Department: ${deviceInfo.department_name}`,
      "Open", "General", deviceInfo.mac_address, userId
    ]);

    await queryAsync(`INSERT INTO Notifications (user_id, message, type) VALUES (?, ?, ?)`, [
      userId,
      `General maintenance created for ${deviceInfo.device_name} (${displayDevice}) by engineer ${engineerName || 'N/A'} (${problemStatus})`,
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

    const techEngineerRes = await queryAsync(`SELECT name FROM Engineers WHERE id = ?`, [technical]);
    const techEngineerName = techEngineerRes[0]?.name;

    if (adminUser?.role === 'admin' && techEngineerName) {
      const techUserRes = await queryAsync(`SELECT id FROM Users WHERE name = ?`, [techEngineerName]);
      const techUserId = techUserRes[0]?.id;

      if (techUserId) {
        await queryAsync(`INSERT INTO Notifications (user_id, message, type) VALUES (?, ?, ?)`, [
          techUserId,
          `You have been assigned a new General maintenance task on ${deviceInfo.device_name} (${displayDevice}) by ${adminUser.name}`,
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

app.get("/get-external-reports", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;

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
  MAX(user_id) AS user_id   -- 👈 أضفه هنا
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
      MAX(mr.user_id) AS user_id
    FROM Maintenance_Reports mr
    LEFT JOIN External_Tickets et ON mr.ticket_id = et.id
    LEFT JOIN Maintenance_Devices md ON mr.device_id = md.id
    LEFT JOIN Departments d ON md.department_id = d.id
    LEFT JOIN PC_info pc ON md.device_type = 'PC' AND md.serial_number = pc.Serial_Number
    LEFT JOIN Printer_info pr ON md.device_type = 'Printer' AND md.serial_number = pr.Serial_Number
    LEFT JOIN Scanner_info sc ON md.device_type = 'Scanner' AND md.serial_number = sc.Serial_Number
    WHERE mr.maintenance_type = 'External'
  `;

  // لو ليس admin → فلتر بالتقارير المملوكة للمستخدم فقط
  if (userRole !== 'admin') {
    externalSql += ` WHERE user_id = ${db.escape(userId)} `;
    newSql += ` WHERE user_id = ${db.escape(userId)} `;
    externalReportsSQL += ` AND mr.user_id = ${db.escape(userId)} `;
  }

  const combinedSql = `
    (${externalSql} GROUP BY id)
    UNION ALL
    (${externalReportsSQL} GROUP BY mr.id)
    UNION ALL
    (${newSql} GROUP BY id)
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



app.put("/update-external-report-status/:id", async (req, res) => {
  const reportId = req.params.id;
  const { status } = req.body;

  try {
    // ✅ 1. جلب التقرير من Maintenance_Reports
    const report = await new Promise((resolve, reject) => {
      db.query("SELECT * FROM Maintenance_Reports WHERE id = ?", [reportId], (err, result) => {
        if (err) return reject(err);
        resolve(result[0]);
      });
    });

    if (!report) return res.status(404).json({ error: "Report not found" });

    // ✅ 2. تحديث الحالة في Maintenance_Reports
    await new Promise((resolve, reject) => {
      db.query("UPDATE Maintenance_Reports SET status = ? WHERE id = ?", [status, reportId], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    // ✅ 3. تحديث التذكرة الخارجية المرتبطة (External_Tickets)
    if (report.ticket_id) {
      await new Promise((resolve, reject) => {
        db.query("UPDATE External_Tickets SET status = ? WHERE id = ?", [status, report.ticket_id], (err) => {
          if (err) return reject(err);
          resolve();
        });
      });

      // ✅ 4. تحديث باقي التقارير المرتبطة بنفس التذكرة الخارجية
      await new Promise((resolve, reject) => {
        db.query("UPDATE Maintenance_Reports SET status = ? WHERE ticket_id = ?", [status, report.ticket_id], (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    }

    // ✅ 5. إذا كان نوع الصيانة من النوع القديم (External_Maintenance)، نحدثه أيضًا
    const legacy = await new Promise((resolve, reject) => {
      db.query("SELECT * FROM External_Maintenance WHERE id = ?", [reportId], (err, result) => {
        if (err) return reject(err);
        resolve(result[0]);
      });
    });

    if (legacy) {
      await new Promise((resolve, reject) => {
        db.query("UPDATE External_Maintenance SET status = ? WHERE id = ?", [status, reportId], (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    }

    res.json({ message: "✅ External report, ticket, and related entries updated successfully" });

  } catch (err) {
    console.error("❌ Failed to update external report status:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/report/:id", (req, res) => {
  const reportId = req.params.id;
  const reportType = req.query.type;
  console.log("Request reportId:", reportId);
  console.log("Request reportType:", reportType);
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

        cpu.cpu_name,
        ram.ram_type,
        rsize.ram_size,
        os.os_name,
        gen.generation_number,
        hdt.drive_type,
        COALESCE(pcm.model_name, prm.model_name, scm.model_name, mdm_fixed.model_name) AS model_name,
        pr_type.printer_type,
        ink_type.ink_type,
        ink_serial.serial_number AS ink_serial_number

      FROM Maintenance_Reports mr
      LEFT JOIN External_Tickets et ON mr.ticket_id = et.id
      LEFT JOIN Maintenance_Devices md ON mr.device_id = md.id
      LEFT JOIN Departments d ON md.department_id = d.id

      LEFT JOIN PC_info pc ON md.device_type = 'PC' AND md.serial_number = pc.Serial_Number
      LEFT JOIN CPU_Types cpu ON pc.Processor_id = cpu.id
      LEFT JOIN RAM_Types ram ON pc.RAM_id = ram.id
      LEFT JOIN RAM_Sizes rsize ON pc.RamSize_id = rsize.id
      LEFT JOIN OS_Types os ON pc.OS_id = os.id
      LEFT JOIN Processor_Generations gen ON pc.Generation_id = gen.id
      LEFT JOIN Hard_Drive_Types hdt ON pc.Drive_id = hdt.id
      LEFT JOIN PC_Model pcm ON pc.Model_id = pcm.id

      LEFT JOIN Printer_info pr ON md.device_type = 'Printer' AND md.serial_number = pr.Serial_Number
      LEFT JOIN Printer_Model prm ON pr.Model_id = prm.id

      LEFT JOIN Scanner_info sc ON md.device_type = 'Scanner' AND md.serial_number = sc.Serial_Number
      LEFT JOIN Scanner_Model scm ON sc.model_id = scm.id

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
        ink_serial.serial_number AS ink_serial_number
      FROM New_Maintenance_Report r
      LEFT JOIN Departments d ON r.department_id = d.id
      LEFT JOIN PC_Model pc ON r.device_type = 'PC' AND r.model_id = pc.id
      LEFT JOIN Printer_Model pr ON r.device_type = 'Printer' AND r.model_id = pr.id
      LEFT JOIN Scanner_Model sc ON r.device_type = 'Scanner' AND r.model_id = sc.id
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
  mr.id AS report_id,
  mr.report_number,
  mr.report_type,
  mr.status,
  mr.created_at,
  mr.issue_summary,
  mr.full_description,
  mr.maintenance_type,

  md.device_type,
  md.serial_number,
  md.governmental_number,
  COALESCE(pc.Computer_Name, pr.Printer_Name, sc.Scanner_Name, md.device_name) AS device_name,
  pc.Mac_Address AS mac_address,

  d.name AS department_name,
  it.ticket_number,
  it.ticket_type,
  it.priority,
  it.assigned_to AS technical,
it.issue_description,

  pc_os.os_name,
  cpu.cpu_name,
  gen.generation_number,
  ram.ram_type,
  rsize.ram_size,
  hdt.drive_type,
  COALESCE(pcm.model_name, prm.model_name, scm.model_name, mdm_fixed.model_name) AS model_name,

  rm.problem_status,
  eng.name AS technical_engineer,

  pr_type.printer_type,
  ink_type.ink_type,
  ink_serial.serial_number AS ink_serial_number,

  gm.id AS general_id,
  gm.maintenance_date,
  gm.issue_type,
  gm.diagnosis_initial,
  gm.diagnosis_final,
  gm.device_id AS general_device_id,
  gm.technician_name,
  gm.floor,
  gm.extension,
  gm.problem_status AS general_problem_status,
  gm.notes,
  gm.customer_name,
  gm.id_number

FROM Maintenance_Reports mr
LEFT JOIN Maintenance_Devices md ON mr.device_id = md.id
LEFT JOIN Departments d ON md.department_id = d.id
LEFT JOIN Internal_Tickets it ON mr.ticket_id = it.id
LEFT JOIN PC_info pc ON md.device_type = 'PC' AND md.serial_number = pc.Serial_Number
LEFT JOIN CPU_Types cpu ON pc.Processor_id = cpu.id
LEFT JOIN RAM_Types ram ON pc.RAM_id = ram.id
LEFT JOIN RAM_Sizes rsize ON pc.RamSize_id = rsize.id
LEFT JOIN OS_Types pc_os ON pc.OS_id = pc_os.id
LEFT JOIN Processor_Generations gen ON pc.Generation_id = gen.id
LEFT JOIN Hard_Drive_Types hdt ON pc.Drive_id = hdt.id
LEFT JOIN PC_Model pcm ON pc.Model_id = pcm.id
LEFT JOIN Printer_info pr ON md.device_type = 'Printer' AND md.serial_number = pr.Serial_Number
LEFT JOIN Printer_Model prm ON pr.Model_id = prm.id
LEFT JOIN Scanner_info sc ON md.device_type = 'Scanner' AND md.serial_number = sc.Serial_Number
LEFT JOIN Scanner_Model scm ON sc.model_id = scm.id
LEFT JOIN Maintance_Device_Model mdm_fixed ON md.model_id = mdm_fixed.id
LEFT JOIN (
  SELECT *
  FROM Regular_Maintenance
  ORDER BY last_maintenance_date DESC
) AS rm ON rm.device_id = mr.device_id  
LEFT JOIN Engineers eng ON rm.technical_engineer_id = eng.id
LEFT JOIN Printer_Types pr_type ON pr.PrinterType_id = pr_type.id
LEFT JOIN Ink_Types ink_type ON pr.InkType_id = ink_type.id
LEFT JOIN Ink_Serials ink_serial ON pr.InkSerial_id = ink_serial.id
LEFT JOIN (
    SELECT gm1.*
    FROM General_Maintenance gm1
    INNER JOIN (
        SELECT device_id, MAX(maintenance_date) AS max_date
        FROM General_Maintenance
        GROUP BY device_id
    ) gm2 ON gm1.device_id = gm2.device_id AND gm1.maintenance_date = gm2.max_date
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
        governmental_number: report.governmental_number,
        device_name: report.device_name,
        department_name: report.department_name,
        priority: report.priority,
        technical: report.technical,
        maintenance_type: report.maintenance_type,
        issue_summary: report.issue_summary,
        full_description: report.full_description,
        issue_description: report.issue_description || "",

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

app.post('/AddDevice/:type', async (req, res) => {
  const deviceType = req.params.type.toLowerCase();
  const Serial_Number = req.body.serial;
  const Governmental_Number = req.body["ministry-id"];
  const department = req.body.department;
  const model = req.body.model;
  const Device_Name = req.body["device-name"] || req.body["pc-name"] || null;
  const Mac_Address = req.body["mac-address"] || null;

  // ✅ إضافات للطابعة
  const Printer_Type = req.body["printer-type"] || null;
  const Ink_Type = req.body["ink-type"] || null;
  const Ink_Serial_Number = req.body["ink-serial-number"] || null;

  try {
    const getId = async (table, column, value) => {
      return new Promise((resolve, reject) => {
        db.query(`SELECT id FROM ${table} WHERE ${column} = ?`, [value], (err, result) => {
          if (err) reject(err);
          else resolve(result[0]?.id || null);
        });
      });
    };

    const Department_id = await getId('Departments', 'name', department);

    if (!Department_id || !Serial_Number || !Governmental_Number || !Device_Name) {
      return res.status(400).json({ error: "❌ تأكد من تعبئة جميع الحقول المطلوبة" });
    }

    if (deviceType === 'pc') {
      const OS_id = await getId('OS_Types', 'os_name', req.body.os);
      const Processor_id = await getId('CPU_Types', 'cpu_name', req.body.processor);
      const Generation_id = await getId('Processor_Generations', 'generation_number', req.body.generation);
      const RAM_id = await getId('RAM_Types', 'ram_type', req.body.ram);
      const Model_id = await getId("PC_Model", "model_name", model);
      const Drive_id = await getId('Hard_Drive_Types', 'drive_type', req.body.drive);
      const RamSize_id = await getId('RAM_Sizes', 'ram_size', req.body.ram_size);

      if (!OS_id || !Processor_id || !Generation_id || !RAM_id || !Model_id || !Drive_id) {
        return res.status(400).json({ error: "❌ تأكد من اختيار كل الخيارات للجهاز (PC)" });
      }

      const insertQuery = `
        INSERT INTO PC_info 
        (Serial_Number, Computer_Name, Governmental_Number, Department, OS_id, Processor_id, Generation_id, RAM_id, RamSize_id, Drive_id, Model_id, Mac_Address)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        Mac_Address
      ];

      await new Promise((resolve, reject) => {
        db.query(insertQuery, values, (err, result) => {
          if (err) return reject(err);
          resolve(result);
        });
      });

    } else if (deviceType === 'printer') {
      const Model_id = await getId("Printer_Model", "model_name", model);
      const PrinterType_id = Printer_Type ? await getId("Printer_Types", "printer_type", Printer_Type) : null;
      let InkType_id = null;
      if (Ink_Type) {
        InkType_id = await getId("Ink_Types", "ink_type", Ink_Type);
        if (!InkType_id) {
          const [insertResult] = await db.promise().query(
            "INSERT INTO Ink_Types (ink_type) VALUES (?)",
            [Ink_Type]
          );
          InkType_id = insertResult.insertId;
        }
      }
            let InkSerial_id = null;
      if (Ink_Serial_Number) {
        InkSerial_id = await getId("Ink_Serials", "serial_number", Ink_Serial_Number);
        if (!InkSerial_id) {
          // لازم تعرف ink_type_id، لنفترض InkType_id موجود
          const [insertResult] = await db.promise().query(
            "INSERT INTO Ink_Serials (serial_number, ink_type_id) VALUES (?, ?)",
            [Ink_Serial_Number, InkType_id]
          );
          InkSerial_id = insertResult.insertId;
        }
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
    
    
      await new Promise((resolve, reject) => {
        db.query(insertQuery, values, (err, result) => {
          if (err) return reject(err);
          resolve(result);
        });
      });
    }
    
     else if (deviceType === 'scanner') {
      const Model_id = await getId("Scanner_Model", "model_name", model);
      if (!Model_id) {
        return res.status(400).json({ error: "❌ لم يتم تحديد موديل الماسح" });
      }

      const insertQuery = `
        INSERT INTO Scanner_info 
        (Serial_Number, Scanner_Name, Governmental_Number, Department, Model_id)
        VALUES (?, ?, ?, ?, ?)
      `;
      const values = [Serial_Number, Device_Name, Governmental_Number, Department_id, Model_id];

      await new Promise((resolve, reject) => {
        db.query(insertQuery, values, (err, result) => {
          if (err) return reject(err);
          resolve(result);
        });
      });

    } else {
      console.log(`🔶 نوع جديد سيتم تخزينه فقط في Maintenance_Devices: ${deviceType}`);
    }

    const insertMaintenanceDevice = `
      INSERT INTO Maintenance_Devices (serial_number, governmental_number, device_type, device_name, department_id)
      VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
      insertMaintenanceDevice,
      [Serial_Number, Governmental_Number, deviceType, Device_Name, Department_id],
      (err2, result2) => {
        if (err2) {
          console.error("⚠️ خطأ أثناء إدخال Maintenance_Devices:", err2);
          return res.status(500).json({ error: "❌ خطأ في إضافة Maintenance_Devices" });
        }

        console.log("✅ تم إدخال الجهاز في Maintenance_Devices بنجاح، ID:", result2.insertId);

        res.json({
          message: `✅ تم حفظ بيانات الجهاز (${deviceType}) بنجاح`,
          insertedId: result2.insertId
        });
      }
    );

  } catch (err) {
    console.error("❌ خطأ عام:", err);
    res.status(500).json({ error: "❌ حدث خطأ أثناء المعالجة" });
  }
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

app.post("/add-device-model", (req, res) => {
  const { model_name, device_type_name } = req.body; // 🟢 Extract model name and type from request
  if (!model_name || !device_type_name) {
    return res.status(400).json({ error: "❌ Missing model name or type" }); // 🔴 Validation
  }

  const cleanedType = device_type_name.trim().toLowerCase(); // 🟢 Normalize type input
  let table = "";
  if (cleanedType === "pc") table = "PC_Model";
  else if (cleanedType === "printer") table = "Printer_Model";
  else if (cleanedType === "scanner") table = "Scanner_Model";
  else table = "Maintance_Device_Model"; // 🟢 Use general model table for custom types

  // 🟢 Check if model already exists
  const checkQuery = table === "Maintance_Device_Model"
    ? `SELECT * FROM ${table} WHERE model_name = ? AND device_type_name = ?`
    : `SELECT * FROM ${table} WHERE model_name = ?`;

  const checkValues = table === "Maintance_Device_Model"
    ? [model_name, device_type_name]
    : [model_name];

  db.query(checkQuery, checkValues, (err, existing) => {
    if (err) return res.status(500).json({ error: "Database check failed" });
    if (existing.length > 0) {
      return res.status(400).json({ error: `⚠️ Model \"${model_name}\" already exists` });
    }

    // 🟢 Insert model into appropriate table
    const insertQuery = table === "Maintance_Device_Model"
      ? `INSERT INTO ${table} (model_name, device_type_name) VALUES (?, ?)`
      : `INSERT INTO ${table} (model_name) VALUES (?)`;
    const insertValues = table === "Maintance_Device_Model" ? [model_name, device_type_name] : [model_name];

    db.query(insertQuery, insertValues, (err2) => {
      if (err2) return res.status(500).json({ error: "Database insert failed" });
      res.json({ message: `✅ Model '${model_name}' added successfully` });
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




app.put("/update-report-status/:id", async (req, res) => {
  const reportId = req.params.id;
  const { status } = req.body;

  try {
    // Get report with linked ticket_id, device_id and type
    const report = await new Promise((resolve, reject) => {
      db.query("SELECT * FROM Maintenance_Reports WHERE id = ?", [reportId], (err, result) => {
        if (err) return reject(err);
        resolve(result[0]);
      });
    });

    if (!report) return res.status(404).json({ error: "Report not found" });

    // Update this specific report
    await new Promise((resolve, reject) => {
      db.query("UPDATE Maintenance_Reports SET status = ? WHERE id = ?", [status, reportId], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    // Update the linked ticket
    await new Promise((resolve, reject) => {
      db.query("UPDATE Internal_Tickets SET status = ? WHERE id = ?", [status, report.ticket_id], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    // ✅ NEW: Update all other reports under same ticket to match the status
    await new Promise((resolve, reject) => {
      db.query("UPDATE Maintenance_Reports SET status = ? WHERE ticket_id = ?", [status, report.ticket_id], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    // If regular maintenance, update Regular_Maintenance table
    if (report.maintenance_type === "Regular") {
      await new Promise((resolve, reject) => {
        db.query(
          `UPDATE Regular_Maintenance 
           SET status = ? 
           WHERE device_id = ?
           ORDER BY last_maintenance_date DESC
           LIMIT 1`,
          [status, report.device_id],
          (err) => {
            if (err) return reject(err);
            resolve();
          }
        );
      });
    }
    

    res.json({ message: "✅ Status updated across report, ticket, and all linked reports" });

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

app.get('/get-internal-reports', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;

  let internalSql = `
SELECT 
  R.id,
  MAX(R.created_at) AS created_at,
  MAX(R.issue_summary) AS issue_summary,
  MAX(R.full_description) AS full_description,
  MAX(R.status) AS status,
  MAX(R.device_id) AS device_id,
  MAX(R.report_number) AS report_number,
  MAX(R.ticket_id) AS ticket_id,
  MAX(R.maintenance_type) AS maintenance_type,
  MAX(
    CASE 
      WHEN R.maintenance_type = 'Internal' THEN R.report_number
      WHEN R.maintenance_type = 'Regular' THEN NULL
      ELSE T.ticket_number
    END
  ) AS ticket_number,
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
  MAX(COALESCE(E.name, T.assigned_to)) AS technical_engineer
FROM Maintenance_Reports R
LEFT JOIN Maintenance_Devices M ON R.device_id = M.id
LEFT JOIN Departments D ON M.department_id = D.id
LEFT JOIN (SELECT * FROM Regular_Maintenance ORDER BY last_maintenance_date DESC) AS RM ON RM.device_id = R.device_id
LEFT JOIN Engineers E ON RM.technical_engineer_id = E.id
LEFT JOIN General_Maintenance GM ON GM.device_id = R.device_id
LEFT JOIN Internal_Tickets T ON R.ticket_id = T.id
WHERE R.maintenance_type IN ('Regular', 'General', 'Internal')

`;
if (userRole !== 'admin') {
  internalSql += ` AND R.user_id = ? `;
}

internalSql += ` GROUP BY R.id `;

let newSql = `
SELECT 
  id, created_at, issue_summary, NULL AS full_description, status, device_id,
  NULL AS report_number, NULL AS ticket_id, 'New' AS maintenance_type, NULL AS ticket_number,
  NULL AS issue_description, priority, NULL AS department_name, NULL AS device_name, NULL AS frequency,
  device_type, 'new' AS source, attachment_name, attachment_path, NULL AS problem_status, NULL AS technical_engineer
FROM New_Maintenance_Report
`;

if (userRole !== 'admin') {
  newSql += ` WHERE user_id = ? `;
}

const combinedSql = `${internalSql} UNION ALL ${newSql} ORDER BY created_at DESC`;
const params = userRole === 'admin' ? [] : [userId, userId];

db.query(combinedSql, params, (err, results) => {
  if (err) {
    console.error("❌ Failed to fetch reports:", err);
    return res.status(500).json({ error: "Error fetching reports" });
  }
  res.json(results);
});
});

app.post("/update-report-full", upload.single("attachment"), async (req, res) => {
  const updatedData = JSON.parse(req.body.data || "{}");
  console.log("📩 Received update data:", updatedData);
  if (req.file) {
    console.log("📎 Received file:", req.file.originalname);
  }

  const {
    id, issue_summary, full_description, priority, status, device_type,
    technical, department_name, category, source,
    device_id, device_name, serial_number, governmental_number,
    cpu_name, ram_type, ram_size,
    os_name, generation_number, model_name, drive_type,
    mac_address, ink_type, ink_serial_number, printer_type
  } = updatedData;

  const attachmentFile = req.file;

  if (!source) {
    return res.status(400).json({ error: "Missing source type" });
  }

  try {
    const departmentId = await getId("Departments", "name", department_name);
    const modelId = await getModelId(device_type, model_name);

    const isPC = device_type?.toLowerCase() === "pc";
    const isPrinter = device_type?.toLowerCase() === "printer";
    let cpuId, ramId, osId, generationId, driveId, ramSizeId;

    if (isPC) {
      cpuId = await getId("CPU_Types", "cpu_name", cpu_name);
      ramId = await getId("RAM_Types", "ram_type", ram_type);
      osId = await getId("OS_Types", "os_name", os_name);
      generationId = await getId("Processor_Generations", "generation_number", generation_number);
      driveId = await getId("Hard_Drive_Types", "drive_type", drive_type);
      ramSizeId = await getId("RAM_Sizes", "ram_size", ram_size);
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
          ${attachmentFile ? "attachment_name = ?, attachment_path = ?," : ""}
          details = ?
        WHERE id = ?`;

      const values = [
        issue_summary, full_description, technical,
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
      if (attachmentFile) {
        values.push(attachmentFile.originalname, `uploads/${attachmentFile.filename}`);
      }
      values.push(full_description?.trim() || null, id);

      await db.promise().query(updateSql, values);
    }

    if (source === "internal") {
      const updateReportSql = `
        UPDATE Maintenance_Reports 
        SET issue_summary = ?, full_description = ?, status = ?, report_type = ?
        ${attachmentFile ? ", attachment_name = ?, attachment_path = ?" : ""}
        WHERE id = ?`;

      const reportValues = attachmentFile
        ? [issue_summary, full_description, status, category, attachmentFile.originalname, `uploads/${attachmentFile.filename}`, id]
        : [issue_summary, full_description, status, category, id];

      await db.promise().query(updateReportSql, reportValues);

      await db.promise().query(`
        UPDATE Internal_Tickets 
        SET priority = ?, assigned_to = ?, status = ? 
        WHERE id = (SELECT ticket_id FROM Maintenance_Reports WHERE id = ?)`,
        [priority, technical, status, id]);
    }

    let actualDeviceId = device_id;
    if (!actualDeviceId && serial_number) {
      const [rows] = await db.promise().query(
        `SELECT id FROM Maintenance_Devices WHERE serial_number = ? LIMIT 1`,
        [serial_number]
      );
      if (rows.length > 0) {
        actualDeviceId = rows[0].id;
      }
    }

    if (actualDeviceId) {
      const isOtherDevice = !["pc", "printer", "scanner"].includes(device_type?.toLowerCase());
      const updates = [
        "device_type = ?", "device_name = ?", "serial_number = ?", "governmental_number = ?",
        "department_id = ?", "model_id = ?"
      ];
      const values = [
        device_type, device_name, serial_number, governmental_number,
        departmentId, modelId
      ];

      if (isPC) {
        updates.push("cpu_id = ?", "ram_id = ?", "os_id = ?", "generation_id = ?", "drive_id = ?", "ram_size_id = ?", "mac_address = ?");
        values.push(cpuId, ramId, osId, generationId, driveId, ramSizeId, mac_address);
      }
      if (isPrinter) {
        updates.push("ink_type = ?", "ink_serial_number = ?", "printer_type = ?");
        values.push(ink_type, ink_serial_number, printer_type);
      }

      const sql = `UPDATE Maintenance_Devices SET ${updates.join(", ")} WHERE id = ?`;
      values.push(actualDeviceId);
      await db.promise().query(sql, values);

      const updateSharedTables = async () => {
        await db.promise().query(`
          UPDATE General_Maintenance 
          SET device_name = ?, serial_number = ?, governmental_number = ?, department_name = ?,
              model_name = ?, cpu_name = ?, ram_type = ?, os_name = ?, generation_number = ?, drive_type = ?,
              ram_size = ?, ink_type = ?, ink_serial_number = ?, printer_type = ?, mac_address = ?
          WHERE device_id = ?`,
          [device_name, serial_number, governmental_number, department_name,
          model_name, cpu_name, ram_type, os_name, generation_number, drive_type,
          ram_size, ink_type, ink_serial_number, printer_type, mac_address, actualDeviceId]);

        await db.promise().query(`
          UPDATE Regular_Maintenance 
          SET device_name = ?, serial_number = ?, governmental_number = ?, department_name = ?,
              model_name = ?, cpu_name = ?, ram_type = ?, ram_size = ?, os_name = ?, generation_number = ?, drive_type = ?,
              ink_type = ?, ink_serial_number = ?, printer_type = ?, mac_address = ?
          WHERE device_id = ?`,
          [device_name, serial_number, governmental_number, department_name,
          model_name, cpu_name, ram_type, ram_size, os_name, generation_number, drive_type,
          ink_type, ink_serial_number, printer_type, mac_address, actualDeviceId]);

        await db.promise().query(`
          UPDATE External_Maintenance 
          SET device_name = ?, governmental_number = ?, department_name = ?,
              model_name = ?, cpu_name = ?, ram_type = ?, ram_size = ?, os_name = ?, generation_number = ?, drive_type = ?,
              ink_type = ?, ink_serial_number = ?, printer_type = ?, mac_address = ?
          WHERE serial_number = ?`,
          [device_name, governmental_number, department_name,
          model_name, cpu_name, ram_type, ram_size, os_name, generation_number, drive_type,
          ink_type, ink_serial_number, printer_type, mac_address, serial_number]);
      };

      await updateSharedTables();
    }

    res.json({ message: "✅ Report and device updated successfully including ink and printer type fields." });
  } catch (err) {
    console.error("❌ Error during update:", err);
    res.status(500).json({ error: "❌ Server error during update" });
  }
});


// 🔁 دوال المساعدة
const getModelId = async (type, modelName) => {
  if (!modelName || !type) return null;

  const lower = type.toLowerCase();

  if (lower === "pc") return getId("PC_Model", "model_name", modelName);
  if (lower === "printer") return getId("Printer_Model", "model_name", modelName);
  if (lower === "scanner") return getId("Scanner_Model", "model_name", modelName);

  // ✅ تحقق إذا الموديل موجود في Maintance_Device_Model
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
  if (!value) return res.status(400).json({ error: "❌ Missing department value" });

  db.query("SELECT * FROM Departments WHERE name = ?", [value], (err, result) => {
    if (err) return res.status(500).json({ error: "DB error" });
    if (result.length > 0) return res.status(400).json({ error: "⚠️ Department already exists" });

    db.query("INSERT INTO Departments (name) VALUES (?)", [value], (err2) => {
      if (err2) return res.status(500).json({ error: "Insert error" });
      res.json({ message: "✅ Department added successfully" });
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

async function generateTicketNumber(type) {
  return new Promise((resolve, reject) => {
    // نزيد الرقم بمقدار 1
    db.query(
      "UPDATE Ticket_Counters SET last_number = last_number + 1 WHERE type = ?",
      [type],
      (err) => {
        if (err) return reject(err);

        // نسترجع الرقم الجديد
        db.query(
          "SELECT last_number FROM Ticket_Counters WHERE type = ?",
          [type],
          (err, result) => {
            if (err) return reject(err);
            const number = String(result[0].last_number).padStart(6, "0");
            const ticketNumber = `${type}-${number}`;
            resolve(ticketNumber);
          }
        );
      }
    );
  });
}

app.post("/internal-ticket-with-file", upload.single("attachment"), authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
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
      ticket_type
    } = req.body;

    const file = req.file;
    const fileName = file ? file.filename : null;
    const filePath = file ? file.path : null;

    const adminUser = await getUserById(userId);
    const userName = await getUserNameById(userId);

    let engineerName;
    if (adminUser?.role === 'admin' && assigned_to) {
      const techEngineerRes = await queryAsync(`SELECT name FROM Engineers WHERE id = ?`, [assigned_to]);
      engineerName = techEngineerRes[0]?.name || userName;
    } else {
      engineerName = userName;
    }

    const counterQuery = `SELECT last_number FROM Ticket_Counters WHERE type = 'INT'`;
    db.query(counterQuery, (counterErr, counterResult) => {
      if (counterErr) {
        console.error("❌ Counter fetch error:", counterErr);
        return res.status(500).json({ error: "Failed to generate ticket number" });
      }

      let newNumber = counterResult[0].last_number + 1;
      let today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      let newTicketNumber = `INT-${today}-${String(newNumber).padStart(3, '0')}`;

      const updateCounterQuery = `UPDATE Ticket_Counters SET last_number = ? WHERE type = 'INT'`;
      db.query(updateCounterQuery, [newNumber], (updateErr) => {
        if (updateErr) {
          console.error("❌ Counter update error:", updateErr);
          return res.status(500).json({ error: "Failed to update ticket counter" });
        }

        const insertTicketQuery = `
          INSERT INTO Internal_Tickets (
            ticket_number, priority, department_id, issue_description, 
            assigned_to, status, attachment_name, attachment_path, ticket_type, user_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const ticketValues = [
          newTicketNumber,
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
            report_number,
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
              `Internal ticket created: ${newTicketNumber} for ${ticket_type} by ${engineerName || 'N/A'}`,
              'internal-ticket'
            ]);

            await queryAsync(`INSERT INTO Notifications (user_id, message, type) VALUES (?, ?, ?)`, [
              userId,
              `Report created ${report_number} linked to ticket ${newTicketNumber} for ${ticket_type} by ${engineerName || 'N/A'}`,
              'internal-ticket-report'
            ]);

            if (adminUser?.role === 'admin' && assigned_to) {
              const techUserRes = await queryAsync(`SELECT id FROM Users WHERE name = (SELECT name FROM Engineers WHERE id = ?)`, [assigned_to]);
              const techUserId = techUserRes[0]?.id;

              if (techUserId) {
                await queryAsync(`INSERT INTO Notifications (user_id, message, type) VALUES (?, ?, ?)`, [
                  techUserId,
                  `You have been assigned a new internal ticket ${newTicketNumber} by ${adminUser.name}`,
                  'technical-notification'
                ]);
              }
            }

            // ✅ سجل في اللوق
            await queryAsync(`
              INSERT INTO Activity_Logs (user_id, user_name, action, details)
              VALUES (?, ?, ?, ?)
            `, [
              userId,
              userName,
              'Submitted Internal Ticket',
              `Internal ticket submitted (${newTicketNumber}) with report (${report_number}) for: ${ticket_type} | Priority: ${priority}`
            ]);

            res.status(201).json({
              message: "✅ Internal ticket and report created",
              ticket_number: newTicketNumber,
              ticket_id: ticketId
            });
          });
        });
      });
    });

  } catch (err) {
    console.error("❌ Server error:", err);
    res.status(500).json({ error: "Unexpected server error" });
  }
});


app.get("/generate-internal-ticket-number", async (req, res) => {
  try {
    const getCounter = `SELECT last_number FROM Ticket_Counters WHERE type = 'INT'`;
    db.query(getCounter, (err, result) => {
      if (err) return res.status(500).json({ error: "Failed to get counter" });

      let newNumber = result[0].last_number + 1;
      let today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      let ticketNumber = `INT-${today}-${String(newNumber).padStart(3, '0')}`;

      return res.json({ ticket_number: ticketNumber });
    });
  } catch (err) {
    console.error("❌ Ticket generation failed:", err);
    res.status(500).json({ error: "Internal server error" });
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

app.post("/submit-new-report",authenticateToken, upload.fields([
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
        ${isPC ? "cpu_id, ram_id, os_id, generation_id, drive_id, ram_size, mac_address," : ""}
        printer_type, ink_type, 
        device_name, serial_number, governmental_number, user_id
      )
      VALUES (?, ?, ?, 'Open', ?, ?, ?, ?, NULL, ?, ?,
        ${isPC ? "?, ?, ?, ?, ?, ?, ?," : ""}
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
        mac_address || null
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

app.post("/delete-option-complete", async (req, res) => {
  const { target, value, type } = req.body;

  if (!target || !value) {
    return res.status(400).json({ error: "❌ Missing fields" });
  }

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
      column: "name",
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
      table: type === "pc" ? "PC_Model"
           : type === "printer" ? "Printer_Model"
           : type === "scanner" ? "Scanner_Model"
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
      referencedTables: []
    }
  };
  

  const mapping = deleteMap[target];
  if (!mapping) return res.status(400).json({ error: "❌ Invalid target field" });

  try {
    let departmentId = null;

    if (target === "section") {
      // ✅ إذا كان الهدف "section"، نجيب الـ ID الخاص بالاسم
      const [deptRows] = await db.promise().query(
        `SELECT id FROM Departments WHERE TRIM(name) = ?`,
        [value.trim()]
      );
      if (!deptRows.length) {
        return res.status(400).json({ error: `❌ Department "${value}" not found.` });
      }
      departmentId = deptRows[0].id;
    }

    // ✅ تحقق هل الخيار مستخدم في جداول أخرى؟
    for (const ref of mapping.referencedTables) {
      let query = "";
      let param = null;

      if (target === "section" && ref.column === "department_id") {
        // نستخدم ID بدلاً من الاسم
        query = `SELECT COUNT(*) AS count FROM ${ref.table} WHERE ${ref.column} = ?`;
        param = departmentId;
      } else {
        query = `SELECT COUNT(*) AS count FROM ${ref.table} WHERE ${ref.column} = ?`;
        param = value.trim();
      }

      const [rows] = await db.promise().query(query, [param]);
      if (rows[0].count > 0) {
        return res.status(400).json({
          error: `❌ Can't delete "${value}" because it is referenced in table "${ref.table}"`
        });
      }
    }

    // ✅ حذف من الجدول الرئيسي
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

    res.json({ message: `✅ "${value}" deleted successfully.` });

  } catch (err) {
    console.error("❌ Error during delete-option-complete:", err.sqlMessage || err.message || err);
    res.status(500).json({ error: err.sqlMessage || "Server error during deletion." });
  }
});


app.post("/update-option-complete", async (req, res) => {
  const { target, oldValue, newValue, type } = req.body;

  if (!target || !oldValue || !newValue) {
    return res.status(400).json({ error: "❌ Missing fields" });
  }

  if (oldValue.trim() === newValue.trim()) {
    return res.status(400).json({ error: "❌ Same value - no update needed" });
  }

  const updateMap = {
    "ink-type": {
  table: "Ink_Types",
  column: "ink_type",
  propagate: [
    { table: "Printer_info", column: "InkType_id" },
    { table: "General_Maintenance", column: "ink_type" },
    { table: "Regular_Maintenance", column: "ink_type" },
    { table: "External_Maintenance", column: "ink_type" },
    { table: "New_Maintenance_Report", column: "ink_type" }
  ]
},

"printer-type": {
  table: "Printer_Types",
  column: "printer_type",
  propagate: [
    { table: "Printer_info", column: "PrinterType_id" },
    { table: "General_Maintenance", column: "printer_type" },
    { table: "Regular_Maintenance", column: "printer_type" },
    { table: "External_Maintenance", column: "printer_type" },
    { table: "New_Maintenance_Report", column: "printer_type" }
  ]
},

    "section": {
      table: "Departments",
      column: "name",
      propagate: [
        { table: "Maintenance_Devices", column: "department_id" }, // يحتاج تعديل بالأرقام
        { table: "General_Maintenance", column: "department_name" },
        { table: "Regular_Maintenance", column: "department_name" },
        { table: "External_Maintenance", column: "department_name" }
      ]
    },
    "problem-type": {
      table: "DeviceType",
      column: "DeviceType",
      propagate: [
        { table: "Maintenance_Devices", column: "device_type" },
        { table: "Regular_Maintenance", column: "device_type" },
        { table: "External_Maintenance", column: "device_type" },
        { table: "Maintance_Device_Model", column: "device_type_name" },
        { table: "problemStates_Maintance_device", column: "device_type_name" }
      ]
    },
    "os-select": { table: "OS_Types", column: "os_name", propagate: [] },
    "ram-select": { table: "RAM_Types", column: "ram_type", propagate: [] },
    "cpu-select": { table: "CPU_Types", column: "cpu_name", propagate: [] },
    "generation-select": { table: "Processor_Generations", column: "generation_number", propagate: [] },
    "drive-select": { table: "Hard_Drive_Types", column: "drive_type", propagate: [] },
    "ram-size-select": { table: "RAM_Sizes", column: "ram_size", propagate: [] },
    "model": {
      table: type === "pc" ? "PC_Model"
           : type === "printer" ? "Printer_Model"
           : type === "scanner" ? "Scanner_Model"
           : "Maintance_Device_Model",
      column: "model_name",
      propagate: []
    },
    "floor": { 
      table: "floors", 
      column: "FloorNum",
      propagate: [
        { table: "General_Maintenance", column: "floor" }
      ]
    },
    "problem-status": { 
      table: "problem_status", 
      column: "status_name",
      propagate: [
        { table: "General_Maintenance", column: "problem_status" },
        { table: "Regular_Maintenance", column: "problem_status" }
      ]
    },
    "technical": { 
      table: "Engineers", 
      column: "name",
      propagate: []
    }
  };

  const mapping = updateMap[target];
  if (!mapping) return res.status(400).json({ error: "❌ Invalid target" });

  const connection = db.promise();

  try {
    await connection.query('START TRANSACTION');
    if (target === "section") {
      // ✅ نجيب ID القديم
      const [oldDept] = await connection.query(`SELECT id FROM Departments WHERE TRIM(name) = ?`, [oldValue.trim()]);
    
      if (!oldDept.length) {
        throw new Error("Old Department not found");
      }
    
      const oldDeptId = oldDept[0].id;
    
      // ✅ نحدث الجداول المرتبطة
      for (const { table, column } of mapping.propagate) {
        if (column === "department_id") {
          // department_id هو رقم، ما يتغير، فلا تحديث هنا فعلياً على الرقم
          continue; 
        } else {
          // تحديث أسماء الأقسام في الجداول الثانية
          await connection.query(
            `UPDATE ${table} SET ${column} = ? WHERE ${column} = ?`,
            [newValue.trim(), oldValue.trim()]
          );
        }
      }
    
      // ✅ نحدث اسم القسم نفسه
      await connection.query(
        `UPDATE ${mapping.table} SET ${mapping.column} = ? WHERE id = ?`,
        [newValue.trim(), oldDeptId]
      );
    }
     else if (target === "problem-type") {
      // ✅ إضافة جديدة لو كانت مشكلة جهاز
      const [newExists] = await connection.query(
        `SELECT * FROM ${mapping.table} WHERE ${mapping.column} = ?`,
        [newValue]
      );
      if (newExists.length === 0) {
        await connection.query(
          `INSERT INTO ${mapping.table} (${mapping.column}) VALUES (?)`,
          [newValue]
        );
      }

      for (const { table, column } of mapping.propagate) {
        await connection.query(
          `UPDATE ${table} SET ${column} = ? WHERE ${column} = ?`,
          [newValue, oldValue]
        );
      }

      // بعدين نحذف القديم
      await connection.query(
        `DELETE FROM ${mapping.table} WHERE ${mapping.column} = ?`,
        [oldValue]
      );

    } else {
      // باقي الكيسات العادية
      for (const { table, column } of mapping.propagate) {
        await connection.query(
          `UPDATE ${table} SET ${column} = ? WHERE ${column} = ?`,
          [newValue, oldValue]
        );
      }

      await connection.query(
        `UPDATE ${mapping.table} SET ${mapping.column} = ? WHERE ${mapping.column} = ?`,
        [newValue, oldValue]
      );
    }

    await connection.query('COMMIT');

    res.json({ message: "✅ Option updated everywhere correctly!" });

  } catch (err) {
    await connection.query('ROLLBACK');
    console.error("❌ Error during update-option-complete:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});



// ضروري تتأكد إن عندك body-parser أو express.json() مفعّل


app.post('/add-option-internal-ticket', async (req, res) => {
  try {
    const { target, value, type } = req.body;

    if (!target || !value) {
      return res.status(400).json({ error: "❌ Missing target or value." });
    }

    let query = "";
    let values = [];

    switch (target) {
      case "department":
        query = "INSERT INTO Departments (name) VALUES (?)";
        values = [value];
        break;
      case "technical":
        query = "INSERT INTO Engineers (name) VALUES (?)";
        values = [value];
        break;
      case "device-type":
        query = "INSERT INTO DeviceType (DeviceType) VALUES (?)";
        values = [value];
        break;
      case "problem-status":
        if (!type) {
          return res.status(400).json({ error: "❌ Missing device type for problem status." });
        }
        if (type === "pc") {
          query = "INSERT INTO problemstates_pc (problem_text) VALUES (?)";
          values = [value];
        } else if (type === "printer") {
          query = "INSERT INTO problemstates_printer (problem_text) VALUES (?)";
          values = [value];
        } else if (type === "scanner") {
          query = "INSERT INTO problemstates_scanner (problem_text) VALUES (?)";
          values = [value];
        } else {
          query = "INSERT INTO problemstates_maintance_device (problemStates_Maintance_device_name, device_type) VALUES (?, ?)";
          values = [value, type];
        }
        break;
      case "ticket-type":
        query = "INSERT INTO ticket_types (type_name) VALUES (?)";
        values = [value];
        break;
      case "report-status":
        query = "INSERT INTO report_statuses (status_name) VALUES (?)";
        values = [value];
        break;
      case "generation":
        query = "INSERT INTO processor_generations (generation_number) VALUES (?)";
        values = [value];
        break;
      case "processor":
        query = "INSERT INTO cpu_types (cpu_name) VALUES (?)";
        values = [value];
        break;
      case "ram":
        query = "INSERT INTO ram_types (ram_type) VALUES (?)";
        values = [value];
        break;
      case "model":
        query = "INSERT INTO pc_model (model_name) VALUES (?)";
        values = [value];
        break;
      case "os":
        query = "INSERT INTO os_types (os_name) VALUES (?)";
        values = [value];
        break;
      case "drive":
        query = "INSERT INTO Hard_Drive_Types (drive_type) VALUES (?)";
        values = [value];
        break;
      case "ram-size":
        query = "INSERT INTO RAM_Sizes (ram_size) VALUES (?)";
        values = [value];
        break;
      case "ink-type":
        query = "INSERT INTO Ink_Types (ink_type) VALUES (?)";
        values = [value];
        break;

      case "printer-type":
        query = "INSERT INTO Printer_Types (printer_type) VALUES (?)";
        values = [value];
        break;
      default:
        return res.status(400).json({ error: "❌ Invalid target." });
    }

    await db.promise().query(query, values);
    return res.json({ message: `✅ Successfully added ${value} to ${target}` });

  } catch (err) {
    console.error("❌ Error in add-option-internal-ticket:", err);
    return res.status(500).json({ error: "❌ Server error while adding option." });
  }
});

app.post('/add-option-external-ticket', async (req, res) => {
  try {
    const { target, value } = req.body;

    if (!target || !value) {
      return res.status(400).json({ error: "❌ Missing target or value." });
    }

    let query = "";
    let values = [];

    switch (target) {
      case "department":
        query = "INSERT INTO Departments (name) VALUES (?)";
        values = [value];
        break;
      case "device-type":
        query = "INSERT INTO DeviceType (DeviceType) VALUES (?)";
        values = [value];
        break;
      case "generation":
        query = "INSERT INTO processor_generations (generation_number) VALUES (?)";
        values = [value];
        break;
      case "processor":
        query = "INSERT INTO cpu_types (cpu_name) VALUES (?)";
        values = [value];
        break;
      case "ram":
        query = "INSERT INTO ram_types (ram_type) VALUES (?)";
        values = [value];
        break;
      case "model":
        query = "INSERT INTO pc_model (model_name) VALUES (?)";
        values = [value];
        break;
      case "os":
        query = "INSERT INTO os_types (os_name) VALUES (?)";
        values = [value];
        break;
      case "drive":
        query = "INSERT INTO Hard_Drive_Types (drive_type) VALUES (?)";
        values = [value];
        break;
      case "ram-size":
        query = "INSERT INTO RAM_Sizes (ram_size) VALUES (?)";
        values = [value];
        break;
      case "ink-type":
        query = "INSERT INTO Ink_Types (ink_type) VALUES (?)";
        values = [value];
        break;

      case "printer-type":
        query = "INSERT INTO Printer_Types (printer_type) VALUES (?)";
        values = [value];
        break;
      default:
        return res.status(400).json({ error: "❌ Invalid target." });
    }

    await db.promise().query(query, values);
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
      null,
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
    res.status(500).json({ error: "Unexpected server error" });
  }
});

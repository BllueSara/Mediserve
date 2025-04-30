const express = require("express");
const cors = require("cors");
const db = require("./db");
const path = require("path");

const app = express();
const port = 5050;

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



// إعداد رفع ملف واحد فقط باسم `attachment`
const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // ✅ يقبل أي نوع من الملفات
    console.log("📥 Received file:", file.originalname, "| Type:", file.mimetype);
    cb(null, true);
  }
});


const admin = {
  email: 'admin',
  password: 'Eng.2030&Admin'
};



app.post("/login", (req, res) => {
  const {email, password} = req.body;


  if (email == admin.email && password == admin.password){
    res.status(200).json({success: true })
  }
  else {
    res.status(401).json({ success: fals })
  }
})

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


app.get("/TypeProplem", (req, res) => {
  const query = "SELECT * FROM DeviceType";
  db.query(query, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(result);
  });
});

app.get("/problem-states/pc", (req, res) => {
  db.query("SELECT * FROM ProblemStates_Pc", (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
});

app.get("/problem-states/printer", (req, res) => {
  db.query("SELECT * FROM ProblemStates_Printer", (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
});

app.get("/problem-states/scanner", (req, res) => {
  db.query("SELECT * FROM ProblemStates_Scanner", (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
});

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

app.post("/submit-regular-maintenance", async (req, res) => {
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

  try {
    // 1️⃣ جلب رقم القسم
    const departmentId = await new Promise((resolve, reject) => {
      db.query("SELECT id FROM Departments WHERE name = ?", [section], (err, result) => {
        if (err) return reject(err);
        resolve(result[0]?.id || null);
      });
    });

    // 2️⃣ جلب بيانات الجهاز
    const deviceInfo = await new Promise((resolve, reject) => {
      const query = `
        SELECT md.*, COALESCE(pc.Computer_Name, pr.Printer_Name, sc.Scanner_Name, md.device_name) AS device_name,
               COALESCE(c.cpu_name, '') AS cpu_name,
               COALESCE(r.ram_type, '') AS ram_type,
               COALESCE(o.os_name, '') AS os_name,
               COALESCE(g.generation_number, '') AS generation_number,
               COALESCE(pm.model_name, prm.model_name, scm.model_name, '') AS model_name,
               COALESCE(hdt.drive_type, '') AS drive_type,
               d.name AS department_name
        FROM Maintenance_Devices md
        LEFT JOIN PC_info pc ON md.device_type = 'PC' AND md.serial_number = pc.Serial_Number AND md.governmental_number = pc.Governmental_Number
        LEFT JOIN Printer_info pr ON md.device_type = 'Printer' AND md.serial_number = pr.Serial_Number AND md.governmental_number = pr.Governmental_Number
        LEFT JOIN Scanner_info sc ON md.device_type = 'Scanner' AND md.serial_number = sc.Serial_Number AND md.governmental_number = sc.Governmental_Number
        LEFT JOIN CPU_Types c ON pc.Processor_id = c.id
        LEFT JOIN RAM_Types r ON pc.RAM_id = r.id
        LEFT JOIN OS_Types o ON pc.OS_id = o.id
        LEFT JOIN Processor_Generations g ON pc.Generation_id = g.id
        LEFT JOIN PC_Model pm ON pc.Model_id = pm.id
        LEFT JOIN Printer_Model prm ON pr.Model_id = prm.id
        LEFT JOIN Scanner_Model scm ON sc.Model_id = scm.id
        LEFT JOIN Departments d ON md.department_id = d.id
        LEFT JOIN Hard_Drive_Types hdt ON pc.Drive_id = hdt.id
        WHERE md.id = ?
      `;
      db.query(query, [deviceSpec], (err, result) => {
        if (err) return reject(err);
        resolve(result[0]);
      });
    });

    if (!deviceInfo) return res.status(404).json({ error: "Device not found" });

    // 3️⃣ إدخال سجل الصيانة الدورية
    const checklist = JSON.stringify(details);
    await new Promise((resolve, reject) => {
      db.query(`
        INSERT INTO Regular_Maintenance (
          device_id, device_type, last_maintenance_date, frequency, checklist, notes,
          serial_number, governmental_number, device_name, department_name,
          cpu_name, ram_type, os_name, generation_number, model_name, drive_type, status,
          problem_status, technical_engineer_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        deviceInfo.os_name,
        deviceInfo.generation_number,
        deviceInfo.model_name,
        deviceInfo.drive_type,
        "Open",
        problem_status || "",
        technical_engineer_id
      ], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    // 4️⃣ إنشاء تذكرة
    const ticketNumber = `TIC-${Date.now()}`;
    const ticketId = await new Promise((resolve, reject) => {
      db.query(`
        INSERT INTO Internal_Tickets (
          ticket_number, priority, department_id, issue_description, assigned_to
        ) VALUES (?, ?, ?, ?, ?)
      `, [
        ticketNumber,
        "Medium",
        departmentId,
        problem_status || "Regular Maintenance",
        technical_engineer_id
      ], (err, result) => {
        if (err) return reject(err);
        resolve(result.insertId);
      });
    });

    // 5️⃣ التحقق من وجود تقرير صيانة اليوم
    const alreadyReported = await new Promise((resolve, reject) => {
      db.query(`
        SELECT id FROM Maintenance_Reports 
        WHERE device_id = ? AND maintenance_type = 'Regular' 
        AND DATE(created_at) = CURDATE()
      `, [deviceSpec], (err, result) => {
        if (err) return reject(err);
        resolve(result.length > 0);
      });
    });

    // 6️⃣ إضافة تقرير صيانة إن لم يكن موجودًا
    if (!alreadyReported) {
      const reportNumberMain = `REP-${Date.now()}-MAIN`;
      await new Promise((resolve, reject) => {
        db.query(`
          INSERT INTO Maintenance_Reports (
            report_number, ticket_id, device_id,
            issue_summary, full_description, status, maintenance_type
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          reportNumberMain,
          ticketId,
          deviceSpec,
          checklist,
          notes || "Routine periodic maintenance performed.",
          "Open",
          "Regular"
        ], (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    }

    // 7️⃣ تحقق من وجود تقرير "Ticket Created"
    const ticketReportExists = await new Promise((resolve, reject) => {
      db.query(`
        SELECT id FROM Maintenance_Reports 
        WHERE device_id = ? AND ticket_id = ? AND issue_summary = 'Ticket Created'
      `, [deviceSpec, ticketId], (err, result) => {
        if (err) return reject(err);
        resolve(result.length > 0);
      });
    });

    if (!ticketReportExists) {
      const reportNumberTicket = `REP-${Date.now()}-TICKET`;
      await new Promise((resolve, reject) => {
        db.query(`
          INSERT INTO Maintenance_Reports (
            report_number, ticket_id, device_id,
            issue_summary, full_description, status, maintenance_type
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          reportNumberTicket,
          ticketId,
          deviceSpec,
          "Ticket Created",
          `Ticket (${ticketNumber}) for device: ${deviceInfo.device_name} - Department: ${deviceInfo.department_name}`,
          "Open",
          "Regular"
        ], (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    }

    res.json({ message: "✅ Regular maintenance, ticket, and both reports created successfully." });

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




// ✅ Endpoint لإضافة الخيارات (Dropdown Options) - GENERAL
app.post("/add-option-general", (req, res) => {
  const { target, value, type } = req.body;

  const tableMap = {
    "device-type": { table: "DeviceType", column: "DeviceType" },
    "section": { table: "Departments", column: "name" },
    "floor": { table: "Floors", column: "FloorNum" },
    "technical-status": { table: "Engineers", column: "name" }, // ✅ هنا الصحيح
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
    "cpu-select": { table: "CPU_Types", column: "cpu_name" },
    "generation-select": { table: "Processor_Generations", column: "generation_number" },
    "drive-select": { table: "Hard_Drive_Types", column: "drive_type" }
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
      // ✨ رجعنا ID الجديد
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
    "technical": { table: "Engineers", column: "name" } // 🆕 دعم الفنيين هنا ✅
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



app.post("/submit-general-maintenance", async (req, res) => {
  const {
    DeviceType: rawDeviceType,
    DeviceID: deviceSpec,
    Section: section,
    Floor: floor,
    ProblemStatus: problemStatus,
    InitialDiagnosis: initialDiagnosis,
    FinalDiagnosis: finalDiagnosis,
    Technical: technical
  } = req.body;

  try {
    // 1️⃣ Get Department ID
    const departmentId = await new Promise((resolve, reject) => {
      db.query("SELECT id FROM Departments WHERE name = ?", [section], (err, result) => {
        if (err) return reject(err);
        resolve(result[0]?.id || null);
      });
    });

    // 2️⃣ Get Device Info
    const deviceInfo = await new Promise((resolve, reject) => {
      const query = `
        SELECT 
          md.*, 
          COALESCE(pc.Computer_Name, pr.Printer_Name, sc.Scanner_Name, md.device_name) AS device_name,
          d.name AS department_name
        FROM Maintenance_Devices md
        LEFT JOIN PC_info pc ON md.device_type = 'PC' AND md.serial_number = pc.Serial_Number AND md.governmental_number = pc.Governmental_Number
        LEFT JOIN Printer_info pr ON md.device_type = 'Printer' AND md.serial_number = pr.Serial_Number AND md.governmental_number = pr.Governmental_Number
        LEFT JOIN Scanner_info sc ON md.device_type = 'Scanner' AND md.serial_number = sc.Serial_Number AND md.governmental_number = sc.Governmental_Number
        LEFT JOIN Departments d ON md.department_id = d.id
        WHERE md.id = ?
      `;
      db.query(query, [deviceSpec], (err, result) => {
        if (err) return reject(err);
        resolve(result[0]);
      });
    });

    if (!deviceInfo) return res.status(404).json({ error: "❌ Device not found" });

    const deviceType = rawDeviceType || deviceInfo.device_type;

    // 3️⃣ Create Internal Ticket
    const ticketNumber = `TIC-${Date.now()}`;
    const ticketId = await new Promise((resolve, reject) => {
      db.query(
"INSERT INTO Internal_Tickets (ticket_number, priority, department_id, issue_description, assigned_to) VALUES (?, ?, ?, ?, ?)",
[ticketNumber, "Medium", departmentId, problemStatus, technical],

        (err, result) => {
          if (err) return reject(err);
          resolve(result.insertId);
        }
      );
    });

    // 4️⃣ Create Main General Maintenance Report
    const reportNumberMain = `REP-${Date.now()}-MAIN`;
    await new Promise((resolve, reject) => {
      db.query(
        "INSERT INTO Maintenance_Reports (report_number, ticket_id, device_id, issue_summary, full_description, status, maintenance_type) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          reportNumberMain,
          ticketId,
          deviceSpec,
          `Selected Issue: ${problemStatus}`,
          `Initial Diagnosis: ${initialDiagnosis}`,
          "Open",
          "General"
        ],
        (err) => {
          if (err) return reject(err);
          resolve();
        }
      );
    });

    // 5️⃣ Create Ticket Summary Report
    const reportNumberTicket = `REP-${Date.now()}-TICKET`;
    await new Promise((resolve, reject) => {
      db.query(
        "INSERT INTO Maintenance_Reports (report_number, ticket_id, device_id, issue_summary, full_description, status, maintenance_type) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          reportNumberTicket,
          ticketId,
          deviceSpec,
          "Ticket Created",
          `Ticket (${ticketNumber}) for device: ${deviceInfo.device_name} - Department: ${deviceInfo.department_name}`,
          "Open",
          "General"
        ],
        (err) => {
          if (err) return reject(err);
          resolve();
        }
      );
    });

    // ✅ Success
    res.json({ message: "✅ General Maintenance and ticket created successfully" });

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
app.get("/get-external-reports", (req, res) => {
  const externalSql = `
    SELECT 
      id,
      created_at,
      ticket_number,
      device_name,
      department_name,
      initial_diagnosis AS issue_summary,
      final_diagnosis AS full_description,
      status,
      device_type,
      NULL AS priority,
      'external-legacy' AS source,
      NULL AS attachment_name,
      NULL AS attachment_path
    FROM External_Maintenance
  `;

  const newSql = `
    SELECT 
      id,
      created_at,
      NULL AS ticket_number,
      NULL AS device_name,
      NULL AS department_name,
      NULL AS issue_summary,
      NULL AS full_description,
      status,
      device_type,
      priority,
      'new' AS source,
      attachment_name,
      attachment_path
    FROM New_Maintenance_Reports
  `;

  const externalReportsSQL = `
    SELECT 
      mr.id,
      mr.created_at,
      et.ticket_number,
      COALESCE(pc.Computer_Name, pr.Printer_Name, sc.Scanner_Name, md.device_name) AS device_name,
      d.name AS department_name,
      mr.issue_summary,
      mr.full_description,
      mr.status,
      md.device_type,
      mr.priority,
      'external-new' AS source,
      et.attachment_name,
      et.attachment_path
    FROM Maintenance_Reports mr
    LEFT JOIN External_Tickets et ON mr.ticket_id = et.id
    LEFT JOIN Maintenance_Devices md ON mr.device_id = md.id
    LEFT JOIN Departments d ON md.department_id = d.id

    LEFT JOIN PC_info pc ON md.device_type = 'PC' AND md.serial_number = pc.Serial_Number
    LEFT JOIN Printer_info pr ON md.device_type = 'Printer' AND md.serial_number = pr.Serial_Number
    LEFT JOIN Scanner_info sc ON md.device_type = 'Scanner' AND md.serial_number = sc.Serial_Number

    WHERE mr.maintenance_type = 'External'
  `;

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


app.get("/report/:id", (req, res) => {
  const reportId = req.params.id;
  const reportType = req.query.type;
  if (reportType === "external") {
    // أولاً: نحاول نجيب من التقارير الجديدة (External_Tickets + Maintenance_Reports)
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
  
        cpu.cpu_name,
        ram.ram_type,
        os.os_name,
        gen.generation_number,
        hdt.drive_type,
        COALESCE(pcm.model_name, prm.model_name, scm.model_name, mdm_fixed.model_name) AS model_name
  
      FROM Maintenance_Reports mr
      LEFT JOIN External_Tickets et ON mr.ticket_id = et.id
      LEFT JOIN Maintenance_Devices md ON mr.device_id = md.id
      LEFT JOIN Departments d ON md.department_id = d.id
  
      LEFT JOIN PC_info pc ON md.device_type = 'PC' AND md.serial_number = pc.Serial_Number
      LEFT JOIN CPU_Types cpu ON pc.Processor_id = cpu.id
      LEFT JOIN RAM_Types ram ON pc.RAM_id = ram.id
      LEFT JOIN OS_Types os ON pc.OS_id = os.id
      LEFT JOIN Processor_Generations gen ON pc.Generation_id = gen.id
      LEFT JOIN Hard_Drive_Types hdt ON pc.Drive_id = hdt.id
      LEFT JOIN PC_Model pcm ON pc.Model_id = pcm.id
  
      LEFT JOIN Printer_info pr ON md.device_type = 'Printer' AND md.serial_number = pr.Serial_Number
      LEFT JOIN Printer_Model prm ON pr.Model_id = prm.id
  
      LEFT JOIN Scanner_info sc ON md.device_type = 'Scanner' AND md.serial_number = sc.Serial_Number
      LEFT JOIN Scanner_Model scm ON sc.model_id = scm.id
  
      LEFT JOIN Maintance_Device_Model mdm_fixed ON md.model_id = mdm_fixed.id
  
      WHERE mr.id = ? AND mr.maintenance_type = 'External'
      LIMIT 1
    `;
  
    db.query(newExternalSQL, [reportId], (err, result) => {
      if (err) return res.status(500).json({ error: "Server error" });
      if (result.length) {
        const r = result[0];
        return res.json({
          id: r.report_id,
          report_number: r.report_number,
          ticket_number: r.ticket_number,
          created_at: r.created_at,
          reporter_name: r.reporter_name || "",
          assigned_to: r.reporter_name || "", // ✅ جديد
          report_type: "Incident",            // ✅ أو "External" أو حسب نظامك
          priority: r.priority || "Medium",   // ✅ مهم للعرض والتعديل
      
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
          os_name: r.os_name || "",
          generation_number: r.generation_number || "",
          model_name: r.model_name || "",
          drive_type: r.drive_type || "",
          attachment_name: r.attachment_name || "",
          attachment_path: r.attachment_path || "",
          maintenance_type: r.maintenance_type,
          status: r.status || "Open",
          source: "external-new"
        });
      }
       else {
        // إذا ما لقى في external الجديدة، يبحث في External_Maintenance
        const oldExternalSQL = `SELECT * FROM External_Maintenance WHERE id = ? LIMIT 1`;
        db.query(oldExternalSQL, [reportId], (err2, result2) => {
          if (err2) return res.status(500).json({ error: "Server error" });
          if (!result2.length) return res.status(404).json({ error: "External report not found" });
  
          const r = result2[0];
          return res.json({
            id: r.id,
            report_number: r.ticket_number,         // ✅ توحيد التسمية
            ticket_number: r.ticket_number,
            created_at: r.created_at,
            reporter_name: r.reporter_name,
            assigned_to: r.reporter_name || "",     // ✅ مهم للعرض
            report_type: "External",                // ✅ لتعرض في category
            priority: r.priority || "Medium",       // ✅ إذا موجودة أو نعطي قيمة افتراضية
          
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
            os_name: r.os_name,
            generation_number: r.generation_number,
            model_name: r.model_name,
            drive_type: r.drive_type || "",
            maintenance_type: "External",
            status: r.status || "Open",
            source: "external-legacy"
          });
          
        });
      }
    });
  }
   else if (reportType === "new") {
    const sql = `
SELECT 
  r.*, 
  d.name AS department_name,
  COALESCE(pc.model_name, pr.model_name, sc.model_name) AS model_name,
  cpu.cpu_name,
  ram.ram_type,
  os.os_name,
  gen.generation_number,
  hdt.drive_type
FROM New_Maintenance_Report r
LEFT JOIN Departments d ON r.department_id = d.id
LEFT JOIN PC_Model pc ON r.device_type = 'PC' AND r.model_id = pc.id
LEFT JOIN Printer_Model pr ON r.device_type = 'Printer' AND r.model_id = pr.id
LEFT JOIN Scanner_Model sc ON r.device_type = 'Scanner' AND r.model_id = sc.id
LEFT JOIN CPU_Types cpu ON r.cpu_id = cpu.id
LEFT JOIN RAM_Types ram ON r.ram_id = ram.id
LEFT JOIN OS_Types os ON r.os_id = os.id
LEFT JOIN Processor_Generations gen ON r.generation_id = gen.id
LEFT JOIN Hard_Drive_Types hdt ON r.drive_id = hdt.id
WHERE r.id = ? LIMIT 1
    `;

    db.query(sql, [reportId], (err, result) => {
      if (err) return res.status(500).json({ error: "Server error" });
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
        cpu_name: r.cpu_name,
        ram_type: r.ram_type,
        os_name: r.os_name,
        generation_number: r.generation_number,
        drive_type: r.drive_type || "", // ✅ أضفناها هنا
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
  d.name AS department_name,
  it.ticket_number,
  it.priority,
  it.assigned_to AS technical,

  pc_os.os_name,
  cpu.cpu_name,
  gen.generation_number,
  ram.ram_type,
  hdt.drive_type,

  COALESCE(
    pcm.model_name,
    prm.model_name,
    scm.model_name,
    mdm_fixed.model_name
    
  ) AS model_name,

  rm.problem_status,
  eng.name AS technical_engineer -- ✅ هنا جلبنا اسم الفني
FROM Maintenance_Reports mr
LEFT JOIN Maintenance_Devices md ON mr.device_id = md.id
LEFT JOIN Departments d ON md.department_id = d.id
LEFT JOIN Internal_Tickets it ON mr.ticket_id = it.id

LEFT JOIN PC_info pc ON md.device_type = 'PC' AND md.serial_number = pc.Serial_Number
LEFT JOIN CPU_Types cpu ON pc.Processor_id = cpu.id
LEFT JOIN RAM_Types ram ON pc.RAM_id = ram.id
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


LEFT JOIN Engineers eng
  ON rm.technical_engineer_id = eng.id -- ✅ الربط الصح للفني

WHERE mr.id = ?

    `;
    
    db.query(sql, [reportId], (err2, result2) => {
      if (err2) return res.status(500).json({ error: "Server error" });
      if (!result2.length) return res.status(404).json({ error: "Internal report not found" });
    
      const report = result2[0];
    
      return res.json({
        id: report.report_id,
          report_number: report.report_number,   // 🛠️ أضف هذا السطر عشان ترجع رقم التقرير!

        ticket_number: report.ticket_number,
        drive_type: report.drive_type || "",
        device_type: report.device_type,
        serial_number: report.serial_number,
        governmental_number: report.governmental_number,
        device_name: report.device_name,
        department_name: report.department_name,
        priority: report.priority,
        technical: report.technical,
        maintenance_type: report.maintenance_type,
        issue_summary: report.issue_summary,
        full_description: report.full_description,
        created_at: report.created_at,
        report_type: report.report_type,
        cpu_name: report.cpu_name || "",
        ram_type: report.ram_type || "",
        os_name: report.os_name || "",
        generation_number: report.generation_number || "",
        drive_type: report.drive_type || "",
        model_name: report.model_name || "",        
        problem_status: report.problem_status || "",        // 🆕 إرجاع حالة المشكلة
        technical_engineer: report.technical_engineer || "",// 🆕 إرجاع اسم الفني
        source: "internal"
      });
    });    
  }
});


app.post("/submit-external-maintenance", async (req, res) => {
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

  try {
    // 🔍 جلب بيانات الجهاز
    const getDeviceInfo = () =>
      new Promise((resolve, reject) => {
        const query = `
         SELECT 
  md.*, 
  COALESCE(pc.Computer_Name, pr.Printer_Name, sc.Scanner_Name, md.device_name) AS device_name,
  COALESCE(c.cpu_name, '') AS cpu_name,
  COALESCE(r.ram_type, '') AS ram_type,
  COALESCE(o.os_name, '') AS os_name,
  COALESCE(g.generation_number, '') AS generation_number,
  COALESCE(pm.model_name, prm.model_name, scm.model_name, '') AS model_name,
 COALESCE(hdt.drive_type, '') AS drive_type,
  d.name AS department_name
FROM Maintenance_Devices md
LEFT JOIN PC_info pc ON md.device_type = 'PC' AND md.serial_number = pc.Serial_Number AND md.governmental_number = pc.Governmental_Number
LEFT JOIN Printer_info pr ON md.device_type = 'Printer' AND md.serial_number = pr.Serial_Number AND md.governmental_number = pr.Governmental_Number
LEFT JOIN Scanner_info sc ON md.device_type = 'Scanner' AND md.serial_number = sc.Serial_Number AND md.governmental_number = sc.Governmental_Number
LEFT JOIN CPU_Types c ON pc.Processor_id = c.id
LEFT JOIN RAM_Types r ON pc.RAM_id = r.id
LEFT JOIN OS_Types o ON pc.OS_id = o.id
LEFT JOIN Processor_Generations g ON pc.Generation_id = g.id
LEFT JOIN PC_Model pm ON pc.Model_id = pm.id
LEFT JOIN Printer_Model prm ON pr.Model_id = prm.id
LEFT JOIN Scanner_Model scm ON sc.Model_id = scm.id
LEFT JOIN Departments d ON md.department_id = d.id
 LEFT JOIN Hard_Drive_Types hdt ON pc.Drive_id = hdt.id
WHERE md.id = ?

        `;
        db.query(query, [device_specifications], (err, result) => {
          if (err) return reject(err);
          resolve(result[0]);
        });
      });

    const deviceInfo = await getDeviceInfo();

    if (!deviceInfo) {
      return res.status(404).json({ error: "❌ لم يتم العثور على معلومات الجهاز" });
    }

    // ✅ تجهيز نوع الجهاز
    let deviceType = rawDeviceType?.toLowerCase();
    const allowedTypes = ["pc", "printer", "scanner"];
    deviceType = allowedTypes.includes(deviceType)
      ? deviceType.charAt(0).toUpperCase() + deviceType.slice(1)
      : deviceInfo.device_type;

    // ✅ إنشاء التقرير الأساسي (التشخيص)
    const insertMain = () =>
      new Promise((resolve, reject) => {
        const sql = `
         INSERT INTO External_Maintenance (
  ticket_number, device_type, device_specifications, section,
  maintenance_manager, reporter_name,
  initial_diagnosis, final_diagnosis,
  serial_number, governmental_number, device_name,
  department_name, cpu_name, ram_type, os_name,
  generation_number, model_name, drive_type
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

        `;
        const values = [
          ticket_number,
          deviceType,
          device_specifications,
          section,
          maintenance_manager,
          reporter_name,
          initial_diagnosis,
          final_diagnosis,
          deviceInfo.serial_number,
          deviceInfo.governmental_number,
          deviceInfo.device_name,
          deviceInfo.department_name,
          deviceInfo.cpu_name,
          deviceInfo.ram_type,
          deviceInfo.os_name,
          deviceInfo.generation_number,
          deviceInfo.model_name,
          deviceInfo.drive_type // ✅ أضفنا هذا آخر شيء
        ];
        db.query(sql, values, (err, result) => {
          if (err) return reject(err);
          resolve();
        });
      });

    // ✅ إنشاء تقرير "Ticket Created"
    const insertTicketSummary = () =>
      new Promise((resolve, reject) => {
        const sql = `
          INSERT INTO External_Maintenance (
            ticket_number, device_type, device_specifications, section,
            maintenance_manager, reporter_name,
            initial_diagnosis, final_diagnosis,
            serial_number, governmental_number, device_name,
            department_name, cpu_name, ram_type, os_name,
            generation_number, model_name
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
          ticket_number,
          deviceType,
          device_specifications,
          section,
          maintenance_manager,
          reporter_name,
          "Ticket Created", // 🟦 initial_diagnosis
          `Ticket (${ticket_number}) for device: ${deviceInfo.device_name} - Department: ${deviceInfo.department_name}`, // 🟦 final_diagnosis
          deviceInfo.serial_number,
          deviceInfo.governmental_number,
          deviceInfo.device_name,
          deviceInfo.department_name,
          deviceInfo.cpu_name,
          deviceInfo.ram_type,
          deviceInfo.os_name,
          deviceInfo.generation_number,
          deviceInfo.model_name
        ];
        db.query(sql, values, (err, result) => {
          if (err) return reject(err);
          resolve();
        });
      });

    // ✨ تنفيذ الاثنين معًا
    await insertMain();
    await insertTicketSummary();

    res.json({ message: "✅ External maintenance and ticket summary saved successfully." });

  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: "❌ Internal server error" });
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

    // ✅ إذا الجهاز من الأنواع المعروفة
    if (deviceType === 'pc') {
      const OS_id = await getId('OS_Types', 'os_name', req.body.os);
      const Processor_id = await getId('CPU_Types', 'cpu_name', req.body.processor);
      const Generation_id = await getId('Processor_Generations', 'generation_number', req.body.generation);
      const RAM_id = await getId('RAM_Types', 'ram_type', req.body.ram);
      const Model_id = await getId("PC_Model", "model_name", model);
      const Drive_id = await getId('Hard_Drive_Types', 'drive_type', req.body.drive);


      if (!OS_id || !Processor_id || !Generation_id || !RAM_id || !Model_id || !Drive_id) {
        return res.status(400).json({ error: "❌ تأكد من اختيار كل الخيارات للجهاز (PC)" });
      }

      const insertQuery = `
        INSERT INTO PC_info 
       (Serial_Number, Computer_Name, Governmental_Number, Department, OS_id, Processor_id, Generation_id, RAM_id, Drive_id, Model_id)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

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
        Drive_id,
        Model_id,
      ];

      await new Promise((resolve, reject) => {
        db.query(insertQuery, values, (err, result) => {
          if (err) return reject(err);
          resolve(result);
        });
      });

    } else if (deviceType === 'printer') {
      const Model_id = await getId("Printer_Model", "model_name", model);
      if (!Model_id) {
        return res.status(400).json({ error: "❌ لم يتم تحديد موديل الطابعة" });
      }

      const insertQuery = `
        INSERT INTO Printer_info 
        (Serial_Number, Printer_Name, Governmental_Number, Department, Model_id)
        VALUES (?, ?, ?, ?, ?)
      `;
      const values = [
        Serial_Number,
        Device_Name,
        Governmental_Number,
        Department_id,
        Model_id
      ];

      await new Promise((resolve, reject) => {
        db.query(insertQuery, values, (err, result) => {
          if (err) return reject(err);
          resolve(result);
        });
      });

    } else if (deviceType === 'scanner') {
      const Model_id = await getId("Scanner_Model", "model_name", model);
      if (!Model_id) {
        return res.status(400).json({ error: "❌ لم يتم تحديد موديل الماسح" });
      }

      const insertQuery = `
        INSERT INTO Scanner_info 
        (Serial_Number, Scanner_Name, Governmental_Number, Department, Model_id)
        VALUES (?, ?, ?, ?, ?)
      `;
      const values = [
        Serial_Number,
        Device_Name,
        Governmental_Number,
        Department_id,
        Model_id
      ];

      await new Promise((resolve, reject) => {
        db.query(insertQuery, values, (err, result) => {
          if (err) return reject(err);
          resolve(result);
        });
      });

    } else {
      console.log(`🔶 نوع جديد سيتم تخزينه فقط في Maintenance_Devices: ${deviceType}`);
    }

    // ✅ إدخال الجهاز في Maintenance_Devices
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



app.get('/regular-maintenance-summary', (req, res) => {
  const sql = `
    SELECT 
      id,
      device_name,
      device_type,
      last_maintenance_date,
      frequency,
      status, -- ✅ نستخدم الحالة المخزنة، ما نحسبها
      DATE_ADD(last_maintenance_date, INTERVAL 
        CASE 
          WHEN frequency = '3months' THEN 3
          WHEN frequency = '4months' THEN 4
        END MONTH) AS next_due_date
    FROM Regular_Maintenance
    WHERE frequency = '3months'
    ORDER BY next_due_date DESC
  `;

  db.query(sql, (err, result) => {
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


app.get('/regular-maintenance-summary-4months', (req, res) => {
  const sql = `
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
    ORDER BY next_due_date DESC;
  `;

  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ error: 'Error fetching 4-month data' });
    res.json(result);
  });
});

app.get('/get-internal-reports', (req, res) => {
  const internalSql = `
    SELECT 
      R.id,
      R.created_at,
      R.issue_summary,
      R.full_description,
      R.status,
      R.device_id,
      R.report_number,
      R.ticket_id,
      R.maintenance_type,

      CASE 
        WHEN R.maintenance_type = 'Regular' THEN NULL 
        ELSE T.ticket_number
      END AS ticket_number,

      CASE 
        WHEN R.maintenance_type = 'Regular' THEN NULL 
        ELSE T.issue_description
      END AS issue_description,

      CASE 
        WHEN R.maintenance_type = 'Regular' THEN RM.problem_status
        ELSE T.priority
      END AS priority,

      COALESCE(GM.department_name, D.name) AS department_name,
      COALESCE(GM.device_name, M.device_name) AS device_name,
      RM.frequency,
      M.device_type,
      'internal' AS source,

      CASE 
        WHEN R.maintenance_type = 'Regular' THEN NULL 
        ELSE T.attachment_name
      END AS attachment_name,

      CASE 
        WHEN R.maintenance_type = 'Regular' THEN NULL 
        ELSE T.attachment_path
      END AS attachment_path,

      COALESCE(RM.problem_status, T.issue_description) AS problem_status,
      COALESCE(E.name, T.assigned_to) AS technical_engineer

    FROM Maintenance_Reports R
    LEFT JOIN Maintenance_Devices M ON R.device_id = M.id
    LEFT JOIN Departments D ON M.department_id = D.id
    LEFT JOIN (
        SELECT *
        FROM Regular_Maintenance
        ORDER BY last_maintenance_date DESC
    ) AS RM ON RM.device_id = R.device_id
    LEFT JOIN Engineers E ON RM.technical_engineer_id = E.id
    LEFT JOIN General_Maintenance GM ON GM.device_id = R.device_id
    LEFT JOIN Internal_Tickets T ON R.ticket_id = T.id
    WHERE R.maintenance_type IN ('Regular', 'General', 'Internal')
  `;

  const newSql = `
    SELECT 
      id,
      created_at,
      issue_summary,
      NULL AS full_description,
      status,
      device_id,
      NULL AS report_number,
      NULL AS ticket_id,
      'New' AS maintenance_type,
      NULL AS ticket_number,
      NULL AS issue_description,
      priority,
      NULL AS department_name,
      NULL AS device_name,
      NULL AS frequency,
      device_type,
      'new' AS source,
      attachment_name,
      attachment_path,
      NULL AS problem_status,
      NULL AS technical_engineer
    FROM New_Maintenance_Report
  `;

  const combinedSql = `${internalSql} UNION ALL ${newSql} ORDER BY created_at DESC`;

  db.query(combinedSql, (err, results) => {
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
    cpu_name, ram_type, os_name, generation_number, model_name, drive_type
  } = updatedData;

  const attachmentFile = req.file;

  if (!source) {
    return res.status(400).json({ error: "Missing source type" });
  }

  try {
    const departmentId = await getId("Departments", "name", department_name);
    const modelId = await getModelId(device_type, model_name);

    const isPC = device_type?.toLowerCase() === "pc";
    let cpuId, ramId, osId, generationId, driveId;

    if (isPC) {
      cpuId = await getId("CPU_Types", "cpu_name", cpu_name);
      ramId = await getId("RAM_Types", "ram_type", ram_type);
      osId = await getId("OS_Types", "os_name", os_name);
      generationId = await getId("Processor_Generations", "generation_number", generation_number);
      driveId = await getId("Hard_Drive_Types", "drive_type", drive_type);
    }

    // ✅ تحديث تقرير جديد
    if (source === "new") {
      const updateSql = `
        UPDATE New_Maintenance_Report
        SET
          issue_summary = ?, details = ?, assigned_to = ?, 
          priority = ?, status = ?, device_type = ?,
          device_name = ?, serial_number = ?, governmental_number = ?,
          department_id = ?, model_id = ?,
          ${isPC ? "cpu_id = ?, ram_id = ?, os_id = ?, generation_id = ?, drive_id = ?," : ""}
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
        values.push(cpuId || null, ramId || null, osId || null, generationId || null, driveId || null);
      }

      if (attachmentFile) {
        values.push(attachmentFile.originalname, `uploads/${attachmentFile.filename}`);
      }

      values.push(full_description?.trim() || null, id);

      const [result] = await db.promise().query(updateSql, values);
      console.log("✅ Updated New Maintenance rows:", result.affectedRows);
    }

    // ✅ تحديث بلاغ داخلي
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

      const updateTicketSql = `
        UPDATE Internal_Tickets 
        SET priority = ?, assigned_to = ?, status = ? 
        WHERE id = (SELECT ticket_id FROM Maintenance_Reports WHERE id = ?)`;

      await db.promise().query(updateTicketSql, [priority, technical, status, id]);
    }

    let actualDeviceId = device_id;

    // إذا مافي device_id نحاول نجيبه عبر serial_number
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

      if (isOtherDevice) {
        const updateUnknownSql = `
          UPDATE Maintenance_Devices 
          SET device_type = ?, device_name = ?, serial_number = ?, 
              governmental_number = ?, department_id = ?, model_id = ?
          WHERE id = ?`;

        await db.promise().query(updateUnknownSql, [
          device_type, device_name, serial_number,
          governmental_number, departmentId, modelId,
          actualDeviceId
        ]);
        console.log("🔎 Final Device ID (unknown type) updated:", actualDeviceId);
      }

      const updates = [
        "device_type = ?", "device_name = ?", "serial_number = ?", "governmental_number = ?",
        "department_id = ?", "model_id = ?"
      ];
      const values = [
        device_type, device_name, serial_number, governmental_number,
        departmentId, modelId
      ];

      if (isPC) {
        updates.push("cpu_id = ?", "ram_id = ?", "os_id = ?", "generation_id = ?", "drive_id = ?");
        values.push(cpuId, ramId, osId, generationId, driveId);
      }

      const sql = `UPDATE Maintenance_Devices SET ${updates.join(", ")} WHERE id = ?`;
      values.push(actualDeviceId);

      const [deviceResult] = await db.promise().query(sql, values);
      console.log("🔧 Device updated rows:", deviceResult.affectedRows);

      // ✨ تحديث الجداول المشتركة Regular, General, External
      const updateSharedTables = async () => {
        const updates = {
          device_name,
          serial_number,
          governmental_number,
          department_name,
          model_name,
          cpu_name,
          ram_type,
          os_name,
          generation_number,
          drive_type
        };

        await db.promise().query(`
          UPDATE General_Maintenance 
          SET 
            device_name = ?, serial_number = ?, governmental_number = ?, department_name = ?,
            model_name = ?, cpu_name = ?, ram_type = ?, os_name = ?, generation_number = ?, drive_type = ?
          WHERE device_id = ?
        `, [
          updates.device_name, updates.serial_number, updates.governmental_number, updates.department_name,
          updates.model_name, updates.cpu_name, updates.ram_type, updates.os_name, updates.generation_number, updates.drive_type,
          actualDeviceId
        ]);

        await db.promise().query(`
          UPDATE Regular_Maintenance 
          SET 
            device_name = ?, serial_number = ?, governmental_number = ?, department_name = ?,
            model_name = ?, cpu_name = ?, ram_type = ?, os_name = ?, generation_number = ?, drive_type = ?
          WHERE device_id = ?
        `, [
          updates.device_name, updates.serial_number, updates.governmental_number, updates.department_name,
          updates.model_name, updates.cpu_name, updates.ram_type, updates.os_name, updates.generation_number, updates.drive_type,
          actualDeviceId
        ]);

        await db.promise().query(`
          UPDATE External_Maintenance 
          SET 
            device_name = ?, governmental_number = ?, department_name = ?,
            model_name = ?, cpu_name = ?, ram_type = ?, os_name = ?, generation_number = ?, drive_type = ?
          WHERE serial_number = ?
        `, [
          updates.device_name, updates.governmental_number, updates.department_name,
          updates.model_name, updates.cpu_name, updates.ram_type, updates.os_name, updates.generation_number, updates.drive_type,
          updates.serial_number
        ]);
      };

      await updateSharedTables();
    }

    res.json({ message: "✅ Report and device updated successfully including Drive Type." });
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

app.post("/internal-ticket-with-file", upload.single("attachment"), async (req, res) => {
  try {
    const {
      report_number,
      priority,
      department_id,
      device_id, // 👈 أضفناها هنا ✅

      issue_description,
      initial_diagnosis,
      final_diagnosis,
      other_description,
      assigned_to,
      status = 'Open'
    } = req.body;

    const file = req.file;
    const fileName = file ? file.filename : null;
    const filePath = file ? file.path : null;

    // ✅ 1. نجيب الرقم الأخير من جدول العدادات
    const counterQuery = `SELECT last_number FROM Ticket_Counters WHERE type = 'INT'`;
    db.query(counterQuery, (counterErr, counterResult) => {
      if (counterErr) {
        console.error("❌ Counter fetch error:", counterErr);
        return res.status(500).json({ error: "Failed to generate ticket number" });
      }

      let newNumber = counterResult[0].last_number + 1;
      let today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      let newTicketNumber = `INT-${today}-${String(newNumber).padStart(3, '0')}`;

      // ✅ 2. نحدث جدول العدادات
      const updateCounterQuery = `UPDATE Ticket_Counters SET last_number = ? WHERE type = 'INT'`;
      db.query(updateCounterQuery, [newNumber], (updateErr) => {
        if (updateErr) {
          console.error("❌ Counter update error:", updateErr);
          return res.status(500).json({ error: "Failed to update ticket counter" });
        }

        // ✅ 3. إدخال التذكرة في جدول Internal_Tickets
        const insertTicketQuery = `
          INSERT INTO Internal_Tickets (
            ticket_number, priority, department_id, issue_description, 
            assigned_to, status, attachment_name, attachment_path
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const ticketValues = [
          newTicketNumber,
          priority || "Medium",
          department_id || null,
          issue_description || '',
          assigned_to || '',
          status,
          fileName,
          filePath
        ];

        db.query(insertTicketQuery, ticketValues, (ticketErr, ticketResult) => {
          if (ticketErr) {
            console.error("❌ Insert error (Internal_Tickets):", ticketErr);
            return res.status(500).json({ error: "Failed to insert internal ticket" });
          }

          const ticketId = ticketResult.insertId;

          // ✅ 4. ربط التقرير بالتذكرة
          const insertReportQuery = `
          INSERT INTO Maintenance_Reports (
            report_number, ticket_id, device_id, issue_summary, full_description, 
            status, maintenance_type, report_type
          ) VALUES (?, ?, ?, ?, ?, ?, 'Internal', 'Incident')
        `;
        
        const reportValues = [
          report_number,
          ticketId,
          device_id || null, // 👈 أضفنا الـ device_id مع القيم
          initial_diagnosis || '',
          final_diagnosis || other_description || '',
          status
        ];
        

          db.query(insertReportQuery, reportValues, (reportErr) => {
            if (reportErr) {
              console.error("❌ Insert error (Maintenance_Reports):", reportErr);
              return res.status(500).json({ error: "Failed to insert maintenance report" });
            }

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
app.post("/submit-new-report", upload.fields([
  { name: "attachment", maxCount: 1 },
  { name: "signature", maxCount: 1 }
]), async (req, res) => {
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
    os_name,
    generation_number,
    model_name,
    drive_type
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
        ${isPC ? "cpu_id, ram_id, os_id, generation_id, drive_id," : ""}
        device_name, serial_number, governmental_number
      )
      VALUES (?, ?, ?, 'Open', ?, ?, ?, ?, NULL, ?, ?, 
        ${isPC ? "?, ?, ?, ?, ?," : ""}
        ?, ?, ?
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
        await getId("Hard_Drive_Types", "drive_type", drive_type)
      );
    }

    insertParams.push(
      device_name || null,
      serial_number || null,
      governmental_number || null
    );

    await db.promise().query(insertReportSql, insertParams);

    res.json({ message: "✅ Report saved successfully with Drive Type support" });

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
    "section": {
      table: "Departments",
      column: "name",
      referencedTables: [
        { table: "Maintenance_Devices", column: "department_id" }, // يحتاج التعامل بالأرقام
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
        { table: "General_Maintenance", column: "technician_name" }
      ]
    },
    "ticket-type": {
      table: "ticket_types",
      column: "type_name",
      referencedTables: [
        { table: "ticket_types", column: "type_name" }
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
      default:
        return res.status(400).json({ error: "❌ Invalid target." });
    }

    if (!query) {
      return res.status(400).json({ error: "❌ No query found for the target." });
    }

    // ⚡ التنفيذ بطريقة صحيحة
    await db.promise().query(query, values);


    return res.json({ message: `✅ Successfully added ${value} to ${target}` });

  } catch (err) {
    console.error("❌ Error in add-option-internal-ticket:", err);
    return res.status(500).json({ error: "❌ Server error while adding option." });
  }
});


app.post('/add-option-external-ticket', async (req, res) => {
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
      default:
        return res.status(400).json({ error: "❌ Invalid target." });
    }

    if (!query) {
      return res.status(400).json({ error: "❌ No query found for the target." });
    }

    // ⚡ التنفيذ بطريقة صحيحة
    await db.promise().query(query, values);


    return res.json({ message: `✅ Successfully added ${value} to ${target}` });

  } catch (err) {
    console.error("❌ Error in add-option external-ticket:", err);
    return res.status(500).json({ error: "❌ Server error while adding option." });
  }
});


app.post("/external-ticket-with-file", upload.single("attachment"), (req, res) => {
  try {
    const {
      ticket_number,      // ✅ المستخدم يدخله
      reporter_name,      // ✅ المستخدم يدخله
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

    // ✅ إدخال التذكرة في External_Tickets
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
      report_datetime
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  

  const ticketValues = [
    ticket_number,                      // ticket_number
    section || null,                    // department_id
    priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase(), // priority (High/Medium/Low)
    issue_description || '',            // issue_description
    reporter_name || '',                // assigned_to
    'Open',                             // status
    fileName || '',                     // attachment_name
    filePath || '',                     // attachment_path
    report_datetime || new Date()       // report_datetime
  ];
  

    db.query(insertTicketQuery, ticketValues, (ticketErr, ticketResult) => {
      if (ticketErr) {
        console.error("❌ Insert external ticket error:", ticketErr);
        return res.status(500).json({ error: "Failed to create external ticket" });
      }

      const ticketId = ticketResult.insertId;

      // ✅ بعد إنشاء التذكرة نضيف تقرير صيانة
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
        priority
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const reportValues = [
      ticket_number,                  // report_number
      ticketId,                        // ticket_id
      device_spec || null,             // device_id
      issue_description || '',         // issue_summary
      '',                              // full_description (فارغ مؤقتاً)
      'Open',                          // status
      'External',                      // maintenance_type
      'Incident',                      // report_type
      priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase() || 'Medium' // priority (High/Medium/Low)
    ];
    

      db.query(insertReportQuery, reportValues, (reportErr) => {
        if (reportErr) {
          console.error("❌ Insert report error:", reportErr);
          return res.status(500).json({ error: "Failed to create maintenance report" });
        }

        res.status(201).json({
          message: "✅ External ticket and report created successfully",
          ticket_number: ticket_number,
          ticket_id: ticketId
        });
      });
    });

  } catch (err) {
    console.error("❌ Server error:", err);
    res.status(500).json({ error: "Unexpected server error" });
  }
});
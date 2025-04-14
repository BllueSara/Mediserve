const express = require("express");
const cors = require("cors");
const db = require("./db");
const path = require("path");

const app = express();
const port = 5050;

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.send("🚀 Server is running!");
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


app.get("/Technical" , (req, res) => {
  const query = "SELECT * FROM Engineers";
  db.query(query, (err, result)  => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(result);
  });
});



app.get("/TypeProplem", (req, res) => {
  const query = "SELECT * FROM DeviceType";
  db.query(query, (err, result)  => {
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
  db.query(query, (err, result)  => { 
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(result);
  });
});




app.get("/CPU_Types", (req, res) => {
  const query = "SELECT * FROM CPU_Types";
  db.query(query, (err, result)  => { 
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(result);
  });
});


app.get("/RAM_Types", (req, res) => {
  const query = "SELECT * FROM RAM_Types";
  db.query(query, (err, result)  => { 
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(result);
  });
});

app.get("/OS_Types", (req, res) => {
  const query = "SELECT * FROM OS_Types";
  db.query(query, (err, result)  => { 
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(result);
  });
});


app.get("/Processor_Generations", (req, res) => {
  const query = "SELECT * FROM Processor_Generations";
  db.query(query, (err, result)  => { 
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(result);
  });
});


app.get("/PC_Model", (req, res) => {
  const query = "SELECT * FROM PC_Model";
  db.query(query, (err, result)  => { 
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(result);
  });
});


app.get("/Scanner_Model", (req, res) => {
  const query = "SELECT * FROM Scanner_Model";
  db.query(query, (err, result)  => { 
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(result);
  });
});

app.get("/Printer_Model", (req, res) => {
  const query = "SELECT * FROM Printer_Model";
  db.query(query, (err, result)  => { 
    if (err) {
      return res.status(500).json({ error: err.message });
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
  console.log("📥 Data received for maintenance:", req.body);

  const {
    "maintenance-date": date,
    frequency,
    "device-type": rawDeviceType,
    section,
    "device-spec": deviceSpec,
    details = [],
    notes = ""
  } = req.body;

  try {
    const departmentId = await new Promise((resolve, reject) => {
      db.query("SELECT id FROM Departments WHERE name = ?", [section], (err, result) => {
        if (err) return reject(err);
        resolve(result[0]?.id || null);
      });
    });

    const deviceInfoQuery = `
      SELECT 
        md.*, 
        COALESCE(pc.Computer_Name, pr.Printer_Name, sc.Scanner_Name, md.device_name) AS device_name,
        COALESCE(c.cpu_name, '') AS cpu_name,
        COALESCE(r.ram_type, '') AS ram_type,
        COALESCE(o.os_name, '') AS os_name,
        COALESCE(g.generation_number, '') AS generation_number,
        COALESCE(pm.model_name, prm.model_name, scm.model_name, '') AS model_name,
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
      WHERE md.id = ?
    `;

    const deviceInfo = await new Promise((resolve, reject) => {
      db.query(deviceInfoQuery, [deviceSpec], (err, result) => {
        if (err) return reject(err);
        resolve(result[0]);
      });
    });

    if (!deviceInfo) {
      return res.status(404).json({ error: "❌ Device info not found" });
    }

    // ✅ نحاول نستخدم النوع اللي في Maintenance_Devices إذا النوع غير معروف
    let deviceType = rawDeviceType?.trim();
    if (!deviceType || deviceType === "") {
      deviceType = deviceInfo.device_type || "Unknown";
    }

    const checklist = JSON.stringify(details);

    await new Promise((resolve, reject) => {
      const insertQuery = `
        INSERT INTO Regular_Maintenance 
        (device_id, device_type, last_maintenance_date, frequency, checklist, notes, 
        serial_number, governmental_number, device_name, department_name, 
        cpu_name, ram_type, os_name, generation_number, model_name)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      db.query(insertQuery, [
        deviceSpec,
        deviceType,
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
        deviceInfo.model_name
      ], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });

    const ticketNumber = `Tec-${Math.floor(1000 + Math.random() * 9000)}`;
    const ticketId = await new Promise((resolve, reject) => {
      db.query(
        "INSERT INTO Internal_Tickets (ticket_number, priority, department_id, issue_description) VALUES (?, ?, ?, ?)",
        [ticketNumber, "Medium", departmentId, notes || deviceInfo.device_name],
        (err, result) => {
          if (err) return reject(err);
          resolve(result.insertId);
        }
      );
    });

    const reportNumber = `REP-${Date.now()}`;
    await new Promise((resolve, reject) => {
      db.query(
        "INSERT INTO Maintenance_Reports (report_number, ticket_id, device_id, issue_summary, full_description, status) VALUES (?, ?, ?, ?, ?, ?)",
        [
          reportNumber,
          ticketId,
          deviceSpec,
          "Scheduled periodic maintenance",
          notes || "Routine periodic maintenance performed.",
          "Closed"
        ],
        (err, result) => {
          if (err) return reject(err);
          resolve(result);
        }
      );
    });

    res.json({ message: "✅ Regular Maintenance, Ticket, and Report saved successfully." });
  } catch (error) {
    console.error("❌ Error in regular maintenance submission:", error);
    res.status(500).json({ error: "❌ Internal server error" });
  }
});


app.put("/update-report-status/:id", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const sql = `UPDATE Maintenance_Reports SET status = ? WHERE id = ?`;

  db.query(sql, [status, id], (err) => {
    if (err) {
      console.error("❌ Error updating report status:", err);
      return res.status(500).json({ message: "Error updating report status" });
    }
    res.json({ message: "✅ Report status updated successfully" });
  });
});



app.post("/add-option-general", (req, res) => {
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

  db.query(query, params, (err, result) => {
    if (err) {
      console.error("❌ DB Insert Error:", err);
      return res.status(500).json({ error: "Database error while inserting option" });
    }
    res.json({ message: `✅ ${value} added to ${mapping.table}` });
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
    case "reporter-name":
      table = "Engineers";
      column = "name";
      break;
    default:
      return res.status(400).json({ error: "Unsupported dropdown" });
  }

  const query = `INSERT INTO ${table} (${column}) VALUES (?)`;

  db.query(query, [value], (err, result) => {
    if (err) {
      console.error("❌ Error inserting option:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ message: `✅ ${value} added successfully` });
  });
});
// API في Node.js
app.post("/add-options-regular", (req, res) => {
  const { target, value } = req.body;

  let table = "";
  let column = "";

  if (target === "device-type") {
    table = "DeviceType";
    column = "DeviceType";
  } else if (target === "section") {
    table = "Departments";
    column = "name";
  } else {
    return res.status(400).json({ error: "Invalid target" });
  }

  const query = `INSERT INTO ${table} (${column}) VALUES (?)`;
  db.query(query, [value], (err, result) => {
    if (err) {
      console.error("❌ DB Error:", err);
      return res.status(500).json({ error: "Database insert failed" });
    }
    res.json({ message: `✅ Added to ${table}: ${value}` });
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
    CustomerName: customerName,
    IDNumber: idNumber,
    ExtNumber: extNumber,
    Technical: technical
  } = req.body;

  try {
    // ✅ جلب department_id من القسم
    const departmentId = await new Promise((resolve, reject) => {
      db.query("SELECT id FROM Departments WHERE name = ?", [section], (err, result) => {
        if (err) return reject(err);
        resolve(result[0]?.id || null);
      });
    });

    // ✅ جلب معلومات الجهاز (سواء من الجدول الأساسي أو من التفاصيل)
    const query = `
      SELECT 
        md.*, 
        COALESCE(pc.Computer_Name, pr.Printer_Name, sc.Scanner_Name, md.device_name) AS device_name,
        COALESCE(c.cpu_name, '') AS cpu_name,
        COALESCE(r.ram_type, '') AS ram_type,
        COALESCE(o.os_name, '') AS os_name,
        COALESCE(g.generation_number, '') AS generation_number,
        COALESCE(pm.model_name, prm.model_name, scm.model_name, '') AS model_name,
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
      WHERE md.id = ?
    `;

    const deviceInfo = await new Promise((resolve, reject) => {
      db.query(query, [deviceSpec], (err, result) => {
        if (err) return reject(err);
        resolve(result[0]);
      });
    });

    if (!deviceInfo) {
      return res.status(404).json({ error: "❌ Device info not found" });
    }

    // ✅ نحول نوع الجهاز لحرف أول كبير (أو نستخدم من الجدول مباشرة)
    let deviceType = rawDeviceType?.toLowerCase();
    if (["pc", "printer", "scanner"].includes(deviceType)) {
      deviceType = deviceType.charAt(0).toUpperCase() + deviceType.slice(1);
    } else {
      deviceType = deviceInfo.device_type; // fallback
    }

    // ✅ Step 1: Insert General Maintenance
    await new Promise((resolve, reject) => {
      const insertQuery = `
        INSERT INTO General_Maintenance 
        (maintenance_date, issue_type, diagnosis_initial, diagnosis_final, device_id, 
        technician_name, floor, extension, problem_status, notes,
        serial_number, governmental_number, device_name, department_name,
        cpu_name, ram_type, os_name, generation_number, model_name)
        VALUES (CURDATE(), ?, ?, ?, ?, ?, ?, ?, ?, NULL,
                ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      db.query(
        insertQuery,
        [
          deviceType,
          initialDiagnosis,
          finalDiagnosis,
          deviceSpec,
          technical,
          floor,
          extNumber,
          problemStatus,
          deviceInfo.serial_number,
          deviceInfo.governmental_number,
          deviceInfo.device_name,
          deviceInfo.department_name,
          deviceInfo.cpu_name,
          deviceInfo.ram_type,
          deviceInfo.os_name,
          deviceInfo.generation_number,
          deviceInfo.model_name
        ],
        (err, result) => {
          if (err) return reject(err);
          resolve(result);
        }
      );
    });

    // ✅ Step 2: Insert Ticket
    const ticketNumber = `TIC-${Date.now()}`;
    const priority = "Medium";

    const ticketId = await new Promise((resolve, reject) => {
      db.query(
        `INSERT INTO Internal_Tickets (ticket_number, priority, department_id, issue_description)
         VALUES (?, ?, ?, ?)`,
        [ticketNumber, priority, departmentId, initialDiagnosis],
        (err, result) => {
          if (err) return reject(err);
          resolve(result.insertId);
        }
      );
    });

    // ✅ Step 3: Insert Report
    const reportNumber = `REP-${Date.now()}`;
    const reportStatus = "Open";

    await new Promise((resolve, reject) => {
      db.query(
        `INSERT INTO Maintenance_Reports 
         (report_number, ticket_id, device_id, issue_summary, full_description, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [reportNumber, ticketId, deviceSpec, initialDiagnosis, finalDiagnosis, reportStatus],
        (err, result) => {
          if (err) return reject(err);
          resolve(result);
        }
      );
    });

    res.json({ message: "✅ Maintenance + Ticket + Report saved successfully" });

  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: "❌ Internal server error" });
  }
});

app.post("/submit-external-maintenance", async (req, res) => {
  const {
    ticket_number,
    device_type: rawDeviceType,
    device_specifications, // ← ID من Maintenance_Devices
    section,
    maintenance_manager,
    reporter_name,
    initial_diagnosis,
    final_diagnosis
  } = req.body;

  try {
    // 🔍 Get device info (يدعم fallback للأجهزة الجديدة)
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

    // ✨ تأكد أن device_type مطابق للأنواع المسموح بها أو استخدم القيمة من الجدول مباشرة
    let deviceType = rawDeviceType?.toLowerCase();
    const allowedTypes = ["pc", "printer", "scanner"];
    deviceType = allowedTypes.includes(deviceType)
      ? deviceType.charAt(0).toUpperCase() + deviceType.slice(1)
      : deviceInfo.device_type; // fallback

    const insertQuery = `
      INSERT INTO External_Maintenance (
        ticket_number, device_type, device_specifications, section,
        maintenance_manager, reporter_name,
        initial_diagnosis, final_diagnosis,
        serial_number, governmental_number, device_name,
        department_name, cpu_name, ram_type, os_name,
        generation_number, model_name
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
      insertQuery,
      [
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
        deviceInfo.model_name
      ],
      (err, result) => {
        if (err) {
          console.error("❌ Error inserting external maintenance:", err);
          return res.status(500).json({ error: "❌ Database error while inserting external maintenance" });
        }
        res.json({ message: "✅ External Maintenance saved successfully" });
      }
    );
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: "❌ Internal server error" });
  }
});





app.post("/add-device-specification", async (req, res) => {
  const { ministry, name, model, serial, department, type } = req.body;

  try {
    const getDeptId = () =>
      new Promise((resolve, reject) => {
        db.query("SELECT id FROM Departments WHERE name = ?", [department], (err, result) => {
          if (err) return reject(err);
          resolve(result[0]?.id || null);
        });
      });

    const departmentId = await getDeptId();

    if (!departmentId || !serial || !ministry || !name || !model) {
      return res.status(400).json({ error: "❌ Missing fields" });
    }

    // Add to Maintenance_Devices directly
    const insertQuery = `
    INSERT INTO Maintenance_Devices 
    (serial_number, governmental_number, device_type, device_name, department_id)
    VALUES (?, ?, ?, ?, ?)
  `;
  
  db.query(insertQuery, [serial, ministry, type, name, departmentId], (err, result) => {
    if (err) {
      console.error("❌ Error inserting spec:", err);
      return res.status(500).json({ error: "DB error" });
    }
  
    res.json({ message: "✅ Specification added successfully", insertedId: result.insertId });
  });
  

  } catch (error) {
    console.error("❌ Error:", error);
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

    let insertQuery = '';
    let values = [];

    if (deviceType === 'pc') {
      const OS_id = await getId('OS_Types', 'os_name', req.body.os);
      const Processor_id = await getId('CPU_Types', 'cpu_name', req.body.processor);
      const Generation_id = await getId('Processor_Generations', 'generation_number', req.body.generation);
      const RAM_id = await getId('RAM_Types', 'ram_type', req.body.ram);
      const Model_id = await getId("PC_Model", "model_name", model);

      if (!OS_id || !Processor_id || !Generation_id || !RAM_id || !Model_id) {
        return res.status(400).json({ error: "❌ تأكد من اختيار كل الخيارات للجهاز (PC)" });
      }

      insertQuery = `
        INSERT INTO PC_info 
        (Serial_Number, Computer_Name, Governmental_Number, Department, OS_id, Processor_id, Generation_id, RAM_id, Model_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      values = [
        Serial_Number,
        Device_Name,
        Governmental_Number,
        Department_id,
        OS_id,
        Processor_id,
        Generation_id,
        RAM_id,
        Model_id
      ];
    } else if (deviceType === 'printer') {
      const Model_id = await getId("Printer_Model", "model_name", model);
      if (!Model_id) {
        return res.status(400).json({ error: "❌ لم يتم تحديد موديل الطابعة" });
      }

      insertQuery = `
        INSERT INTO Printer_info 
        (Serial_Number, Printer_Name, Governmental_Number, Department, Model_id)
        VALUES (?, ?, ?, ?, ?)
      `;
      values = [
        Serial_Number,
        Device_Name,
        Governmental_Number,
        Department_id,
        Model_id
      ];
    } else if (deviceType === 'scanner') {
      const Model_id = await getId("Scanner_Model", "model_name", model);
      if (!Model_id) {
        return res.status(400).json({ error: "❌ لم يتم تحديد موديل الماسح" });
      }

      insertQuery = `
        INSERT INTO Scanner_info 
        (Serial_Number, Scanner_Name, Governmental_Number, Department, Model_id)
        VALUES (?, ?, ?, ?, ?)
      `;
      values = [
        Serial_Number,
        Device_Name,
        Governmental_Number,
        Department_id,
        Model_id
      ];
    } else {
      return res.status(400).json({ error: "❌ نوع الجهاز غير مدعوم" });
    }

    // تخزين الجهاز في الجدول الأساسي
    db.query(insertQuery, values, (err, result) => {
      if (err) {
        console.error("❌ خطأ أثناء الإدخال:", err);
        return res.status(500).json({ error: "❌ خطأ في قاعدة البيانات" });
      }

      // ✅ ثم إدخاله في Maintenance_Devices
     // ✅ ثم إدخاله في Maintenance_Devices (مع التحقق من التكرار)
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
        message: `✅ تم حفظ بيانات ${deviceType} بنجاح`,
        insertedId: result2.insertId // ✅ نرجع الـ ID الصحيح هنا
      });
    }
  );
  
  

    });
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
  const { model_name, device_type_name } = req.body;

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
    if (err) {
      console.error("❌ Error checking model:", err);
      return res.status(500).json({ error: "❌ Failed to check model" });
    }

    if (existing.length > 0) {
      return res.status(400).json({ error: "❌ Model already exists" });
    }

    const insertQuery = table === "Maintance_Device_Model"
      ? `INSERT INTO ${table} (model_name, device_type_name) VALUES (?, ?)`
      : `INSERT INTO ${table} (model_name) VALUES (?)`;

    const insertValues = table === "Maintance_Device_Model"
      ? [model_name, device_type_name]
      : [model_name];

    db.query(insertQuery, insertValues, (err2) => {
      if (err2) {
        console.error("❌ Error inserting model:", err2);
        return res.status(500).json({ error: "❌ Failed to insert model" });
      }

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


app.put('/update-maintenance-status/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const sql = `UPDATE Regular_Maintenance SET status = ? WHERE id = ?`;

  db.query(sql, [status, id], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Error updating status" });
    }
    res.json({ message: "✅ Status updated successfully" });
  });
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
  const sql = `
    SELECT 
      R.id,
      R.created_at,
      R.issue_summary,
      R.full_description,
      R.status,
      R.device_id,
      R.report_number,
      R.ticket_id,
      T.ticket_number,
      T.issue_description,
      T.priority,
      D.name AS department_name,
      M.device_name
    FROM Maintenance_Reports R
    LEFT JOIN Internal_Tickets T ON R.ticket_id = T.id
    LEFT JOIN Departments D ON T.department_id = D.id
    LEFT JOIN Maintenance_Devices M ON R.device_id = M.id
    ORDER BY R.created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Failed to fetch reports:", err);
      return res.status(500).json({ error: "Error fetching reports" });
    }

    res.json(results);
  });
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
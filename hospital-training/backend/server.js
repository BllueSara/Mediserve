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

  const table = type === "pc" ? "PC_info"
              : type === "printer" ? "Printer_info"
              : type === "scanner" ? "Scanner_info"
              : null;

  const nameCol = type === "pc" ? "Computer_Name"
               : type === "printer" ? "Printer_Name"
               : type === "scanner" ? "Scanner_Name"
               : null;

  if (!table || !nameCol) return res.status(400).json({ error: "Invalid device type" });

  const sql = `
    SELECT md.id, d.Serial_Number, d.${nameCol} AS name, d.Governmental_Number
    FROM ${table} d
    JOIN Maintenance_Devices md
      ON md.serial_number = d.Serial_Number
      AND md.governmental_number = d.Governmental_Number
      AND md.device_type = ?
    WHERE d.Department = (SELECT id FROM Departments WHERE name = ?)
  `;

  db.query(sql, [type, department], (err, result) => {
    if (err) {
      console.error("❌ Error fetching devices:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(result);
  });
});

// ✅ POST Regular Maintenance
app.post("/submit-regular-maintenance", async (req, res) => {
  const {
    "maintenance-date": date,
    frequency,
    "device-type": rawDeviceType,
    section,
    "device-spec": deviceSpec,
    details = [],
    notes = ""
  } = req.body;
  const deviceType = rawDeviceType.toLowerCase(); // 🔥 الحل هنا

  

  console.log("Data received:", req.body); // تحقق من البيانات المستلمة

  try {
    const getDepartmentId = () => new Promise((resolve, reject) => {
      db.query("SELECT id FROM Departments WHERE name = ?", [section], (err, result) => {
        if (err) return reject(err);
        resolve(result[0]?.id || null);
      });
    });

    const departmentId = await getDepartmentId();

    console.log("Department ID:", departmentId); // تحقق من الـ Department ID المسترجع

    const query = `
    SELECT 
      md.*, 
      COALESCE(pc.Computer_Name, pr.Printer_Name, sc.Scanner_Name) AS device_name,
      COALESCE(c.cpu_name, NULL) AS cpu_name,
      COALESCE(r.ram_type, NULL) AS ram_type,
      COALESCE(o.os_name, NULL) AS os_name,
      COALESCE(g.generation_number, NULL) AS generation_number,
      COALESCE(pm.model_name, prm.model_name, scm.model_name) AS model_name,
      d.name AS department_name
    FROM Maintenance_Devices md
    LEFT JOIN PC_info pc 
      ON md.device_type = 'PC' AND md.serial_number = pc.Serial_Number AND md.governmental_number = pc.Governmental_Number
    LEFT JOIN Printer_info pr 
      ON md.device_type = 'Printer' AND md.serial_number = pr.Serial_Number AND md.governmental_number = pr.Governmental_Number
    LEFT JOIN Scanner_info sc 
      ON md.device_type = 'Scanner' AND md.serial_number = sc.Serial_Number AND md.governmental_number = sc.Governmental_Number
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
      return res.status(404).json({ error: "❌ لم يتم العثور على معلومات الجهاز" });
    }
    
    const checklist = JSON.stringify(details);
    
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
      if (err) {
        console.error("❌ Error inserting maintenance:", err);
        return res.status(500).json({ error: "❌ Database error while inserting maintenance" });
      }
      res.json({ message: "✅ Maintenance log saved successfully" });
    });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: "❌ Internal server error" });
  }
});
    
// ✅ POST General Maintenance
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
  

  const deviceType = rawDeviceType.toLowerCase();
  console.log("🔧 General Maintenance Data:", req.body);

  try {
    const getDepartmentId = () =>
      new Promise((resolve, reject) => {
        db.query(
          "SELECT id FROM Departments WHERE name = ?",
          [section],
          (err, result) => {
            if (err) return reject(err);
            resolve(result[0]?.id || null);
          }
        );
      });

    const departmentId = await getDepartmentId();

    const query = `
      SELECT 
        md.*, 
        COALESCE(pc.Computer_Name, pr.Printer_Name, sc.Scanner_Name) AS device_name,
        COALESCE(c.cpu_name, NULL) AS cpu_name,
        COALESCE(r.ram_type, NULL) AS ram_type,
        COALESCE(o.os_name, NULL) AS os_name,
        COALESCE(g.generation_number, NULL) AS generation_number,
        COALESCE(pm.model_name, prm.model_name, scm.model_name) AS model_name,
        d.name AS department_name
      FROM Maintenance_Devices md
      LEFT JOIN PC_info pc 
        ON md.device_type = 'PC' AND md.serial_number = pc.Serial_Number AND md.governmental_number = pc.Governmental_Number
      LEFT JOIN Printer_info pr 
        ON md.device_type = 'Printer' AND md.serial_number = pr.Serial_Number AND md.governmental_number = pr.Governmental_Number
      LEFT JOIN Scanner_info sc 
        ON md.device_type = 'Scanner' AND md.serial_number = sc.Serial_Number AND md.governmental_number = sc.Governmental_Number
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
      return res.status(404).json({ error: "❌ لم يتم العثور على معلومات الجهاز" });
    }

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
        if (err) {
          console.error("❌ Error inserting general maintenance:", err);
          return res.status(500).json({ error: "❌ Database error while inserting general maintenance" });
        }
        res.json({ message: "✅ General Maintenance saved successfully" });
      }
    );
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: "❌ Internal server error" });
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
    (err2) => {
      if (err2) {
        console.error("⚠️ خطأ أثناء إدخال Maintenance_Devices:", err2);
      } else {
        console.log("✅ تم إدخال الجهاز في Maintenance_Devices بنجاح");
      }
  
      res.json({ message: `✅ تم حفظ بيانات ${deviceType} بنجاح` });
    }
  );
  

    });
  } catch (err) {
    console.error("❌ خطأ عام:", err);
    res.status(500).json({ error: "❌ حدث خطأ أثناء المعالجة" });
  }
});




app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
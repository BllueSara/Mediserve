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

app.get("/Printer_Model", (req, res) => {
  const query = "SELECT * FROM Printer_Model";
  db.query(query, (err, result)  => { 
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(result);
  });
});

app.post('/AddPC', async (req, res) => {
  const {
    ["pc-name"]: Computer_Name,
    serial: Serial_Number,
    ["ministry-id"]: Governmental_Number,
    department,
    os,
    processor,
    generation,
    ram,
    model
  } = req.body;

  try {
    // دوال مساعدة تجيب الـ ID من الاسم
    const getId = async (table, column, value) => {
      return new Promise((resolve, reject) => {
        db.query(`SELECT id FROM ${table} WHERE ${column} = ?`, [value], (err, result) => {
          if (err) reject(err);
          else resolve(result[0]?.id || null);
        });
      });
    };

    const Department_id = await getId('Departments', 'name', department);
    const OS_id = await getId('OS_Types', 'os_name', os);
    const Processor_id = await getId('CPU_Types', 'cpu_name', processor);
    const Generation_id = await getId('Processor_Generations', 'generation_number', generation);
    const RAM_id = await getId('RAM_Types', 'ram_type', ram);
    const Model_id = await getId('PC_Model', 'model_name', model);

    if (!Department_id || !OS_id || !Processor_id || !Generation_id || !RAM_id || !Model_id) {
      return res.status(400).json({ error: "Invalid values provided" });
    }

    const sql = `
      INSERT INTO PC_info 
      (Serial_Number, Computer_Name, Governmental_Number, Department, OS_id, Processor_id, Generation_id, RAM_id, Model_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      Serial_Number,
      Computer_Name,
      Governmental_Number,
      Department_id,
      OS_id,
      Processor_id,
      Generation_id,
      RAM_id,
      Model_id
    ];

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error("❌ Error inserting PC:", err);
        return res.status(500).json({ error: "Database error" });
      }
      res.json({ message: "✅ PC saved successfully" });
    });

  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});


app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
});




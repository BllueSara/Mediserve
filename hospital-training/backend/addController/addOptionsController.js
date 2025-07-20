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
  await db.promise().query(sql, [userId, userName, action, details]);
}

=======
>>>>>>> dfa1ff18f501a113e159d8d77f54553e04171c45
exports.addOS = (req, res) => {
  const { value } = req.body;
  if (!value) return res.status(400).json({ error: "❌ Missing OS value" });
  db.query("SELECT * FROM OS_Types WHERE os_name = ?", [value], (err, result) => {
    if (err) return res.status(500).json({ error: "DB error" });
    if (result.length > 0) return res.status(400).json({ error: "⚠️ OS already exists" });
    db.query("INSERT INTO OS_Types (os_name) VALUES (?)", [value], (err2) => {
      if (err2) return res.status(500).json({ error: "Insert error" });
      res.json({ message: "✅ OS added successfully" });
    });
  });
};

exports.addRAM = (req, res) => {
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
};

exports.addCPU = (req, res) => {
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
};

exports.addHardDrive = (req, res) => {
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
};

exports.addInkType = (req, res) => {
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
};

exports.addScannerType = (req, res) => {
  const { value } = req.body;
  if (!value) return res.status(400).json({ error: "❌ Missing scanner type value" });
  db.query("SELECT * FROM Scanner_Types WHERE scanner_type = ?", [value], (err, result) => {
    if (err) return res.status(500).json({ error: "❌ DB error during lookup" });
    if (result.length > 0) return res.status(400).json({ error: "⚠️ Scanner type already exists" });
    db.query("INSERT INTO Scanner_Types (scanner_type) VALUES (?)", [value], (err2) => {
      if (err2) return res.status(500).json({ error: "❌ Error inserting scanner type" });
      res.json({ message: "✅ Scanner type added successfully" });
    });
  });
};

exports.addDepartment = (req, res) => {
  const { value } = req.body;
  if (!value || typeof value !== "string" || !value.includes("|")) {
    return res.status(400).json({ error: "❌ يجب إرسال النص بصيغة 'EnglishName|ArabicName'" });
  }
  db.query("SELECT 1 FROM Departments WHERE name = ?", [value], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.length > 0) {
      return res.status(400).json({ error: "⚠️ هذا القسم موجود مسبقًا" });
    }
    db.query("INSERT INTO Departments (name) VALUES (?)", [value], (err2, result2) => {
      if (err2) return res.status(500).json({ error: err2.message });
      return res.json({ message: "✅ Department added successfully", insertedId: result2.insertId });
    });
  });
};

exports.addPopupOption = (req, res) => {
  const { target, value } = req.body;
  if (!target || !value) return res.status(400).json({ message: "Missing target or value" });
  const tableMap = {
    "device-type": { table: "DeviceType", column: "DeviceType" },
    "technical": { table: "Engineers", column: "name" },
    "report-status": { table: "Report_Statuses", column: "status_name" },
    "ticket-type": { table: "Ticket_Types", column: "type_name" },
    "department": { table: "Departments", column: "name" },
    "device-specification": { table: "Maintenance_Devices", column: "device_name" },
    "initial-diagnosis": { table: "ProblemStates_Pc", column: "problem_text" }
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
};

exports.addPrinterType = (req, res) => {
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
};

exports.addGeneration = (req, res) => {
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
};

exports.addRamSize = (req, res) => {
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
}; 
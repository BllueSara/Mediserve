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

// ✅ Get all device types
app.get("/api/device-types", (req, res) => {
  const query = "SELECT id, type FROM Device_type";
  db.query(query, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
});

// ✅ Get devices by type (example: Printer)
app.get("/api/devices/by-type/:type", (req, res) => {
  const type = req.params.type;

  let query = "";
  switch (type) {
    case "Printer":
      query = "SELECT Serial_Number, Printer_name AS name FROM Printer_info";
      break;
    default:
      return res.status(400).json({ error: "Invalid device type" });
  }

  db.query(query, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
});

// 🔹 Get all printer models
app.get("/api/printers/models", (req, res) => {
  const query = "SELECT DISTINCT Model FROM Printer_info";
  db.query(query, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
});

// 🔹 Get full printer details by selected model
app.get("/api/printer/details/:model", (req, res) => {
  const model = req.params.model;
  const query = "SELECT * FROM Printer_info WHERE Model = ?";
  db.query(query, [model], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
});

// 🔹 Get unique printer companies
app.get("/api/printers/companies", (req, res) => {
  const query = "SELECT DISTINCT company_name FROM Printer_info";
  db.query(query, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
});

// 🔹 Get printers by selected company
app.get("/api/printers/by-company/:company", (req, res) => {
  const company = req.params.company;
  const query = "SELECT Serial_Number, Printer_name FROM Printer_info WHERE company_name = ?";
  db.query(query, [company], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});



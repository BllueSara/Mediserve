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

app.get("/test-db", (req, res) => {
  db.query("SELECT 1 + 1 AS result", (err, results) => {
    if (err) return res.status(500).send(err);
    res.json({ message: "✅ Database Connected!", result: results[0] });
  });
});



app.get("/users", (req, res) => {
  db.query("SELECT * FROM User_info", (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(result);
  });
});


app.post("/users", (req, res) => {
  const { Job_id, user_name, email, password } = req.body;
  db.query(
    "INSERT INTO User_info (Job_id, user_name, email, password) VALUES (?, ?, ?, ?)",
    [Job_id, user_name, email, password],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: "User added successfully!", userId: result.insertId });
    }
  );
});


app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

app.get("/pcs", (req, res) => {
  db.query("SELECT * FROM PC_info", (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(result);
  });
});

app.get("/pc-specifications", (req, res) => {
  db.query("SELECT Serial_Number, Computer_Name FROM PC_info", (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(result);
  });
});
app.get("/api/devices/by-type/:type", (req, res) => {
  const type = req.params.type;

  let query = "";
  switch (type) {
    case "PC":
      query = "SELECT Serial_Number, Computer_Name AS name FROM PC_info";
      break;
    case "Printer":
      query = "SELECT Serial_Number, Printer_name AS name FROM Printer_info";
      break;
    case "Zebra":
      query = "SELECT Serial_Number, zebra_name AS name FROM zebra_info";
      break;
    case "Scanner":
      query = "SELECT Serial_Number, scan_name AS name FROM scan_info";
      break;
    default:
      return res.status(400).json({ error: "Invalid device type" });
  }

  db.query(query, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
});

app.get('/sticker_Printer', (req, res) => {
  const sql = 'SELECT * FROM sticker_Printer';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching data:', err);
      res.status(500).send('Error');
    } else {
      console.log('Fetched PC Info:', results); // Console log here
      res.json(results);
    }
  });
});
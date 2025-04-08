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

app.get("/ProblemStates", (req, res) => {
  const query = "SELECT * FROM ProblemStates ";
  db.query(query, (err, result)  => {
    if (err) {
      return res.status(500).json({ error: err.message });      
    }    
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








app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
});




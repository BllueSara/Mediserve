const db = require("../db");

const getDepartmentsController = (req, res) => {
  const query = "SELECT * FROM Departments  ORDER BY name ASC ";
  db.query(query, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(result);
  });
};

module.exports = getDepartmentsController; 
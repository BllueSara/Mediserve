const db = require('../db');

// دالة تحديث الخيارات العامة
const updateOptionGeneralController = (req, res) => {
  const { target, oldValue, newValue, type } = req.body;

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

  let checkQuery = `SELECT COUNT(*) AS count FROM ${mapping.table} WHERE ${mapping.column} = ?`;
  let checkParams = [newValue];

  if (mapping.extra) {
    checkQuery += ` AND ${mapping.extra} = ?`;
    checkParams.push(type);
  }

  db.query(checkQuery, checkParams, (checkErr, checkResult) => {
    if (checkErr) {
      console.error("❌ Database check failed:", checkErr);
      return res.status(500).json({ error: "Database check failed" });
    }
    if (checkResult[0].count > 0) {
      return res.status(400).json({ error: `❌ \"${newValue}\" already exists.` });
    }
    let updateQuery = "";
    let updateParams = [];
    if (mapping.extra) {
      updateQuery = `UPDATE ${mapping.table} SET ${mapping.column} = ? WHERE ${mapping.column} = ? AND ${mapping.extra} = ?`;
      updateParams = [newValue, oldValue, type];
    } else {
      updateQuery = `UPDATE ${mapping.table} SET ${mapping.column} = ? WHERE ${mapping.column} = ?`;
      updateParams = [newValue, oldValue];
    }
    db.query(updateQuery, updateParams, (err, result) => {
      if (err) {
        console.error("❌ Update failed:", err);
        return res.status(500).json({ error: "Failed to update option" });
      }
      res.json({ message: `✅ \"${oldValue}\" updated to \"${newValue}\" successfully.` });
    });
  });
};

module.exports = { updateOptionGeneralController }; 
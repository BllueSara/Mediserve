const db = require('../db');

const getFullNameController = async (req, res) => {
  const { target, value, type } = req.body;

  if (!target || !value) {
    return res.status(400).json({ error: "❌ Missing fields" });
  }

  console.log(`🔍 get-full-name request: target=${target}, value="${value}"`);

  try {
    let query = "";
    let params = [];
    let tableName, columnName;

    if (target === "section") {
      query = `
        SELECT id, name
        FROM Departments
        WHERE name = ? 
           OR TRIM(SUBSTRING_INDEX(name, '|', 1)) = ?
           OR TRIM(SUBSTRING_INDEX(name, '|', -1)) = ?
           OR name LIKE ?
        LIMIT 1
      `;
      params = [value.trim(), value.trim(), value.trim(), `%${value.trim()}%`];
    } else if (target === "technical") {
      query = `
        SELECT id, name
        FROM Engineers
        WHERE name = ?
           OR TRIM(SUBSTRING_INDEX(name, '|', 1)) = ?
           OR TRIM(SUBSTRING_INDEX(name, '|', -1)) = ?
           OR name LIKE ?
        LIMIT 1
      `;
      params = [value.trim(), value.trim(), value.trim(), `%${value.trim()}%`];
    } else if (target === "problem-status") {
      if (!type) {
        return res.status(400).json({ error: "❌ Missing device type for problem-status" });
      }
      switch (type) {
        case "pc":
          tableName  = "ProblemStates_Pc";
          columnName = "problem_text";
          break;
        case "printer":
          tableName  = "ProblemStates_Printer";
          columnName = "problem_text";
          break;
        case "scanner":
          tableName  = "ProblemStates_Scanner";
          columnName = "problem_text";
          break;
        default:
          tableName  = "problemStates_Maintance_device";
          columnName = "problemStates_Maintance_device_name";
      }
      query = `
        SELECT id, ${columnName} AS name
        FROM ${tableName}
        WHERE
          ${columnName} = ?
          OR TRIM(SUBSTRING_INDEX(${columnName}, '|', 1)) = ?
          OR TRIM(SUBSTRING_INDEX(${columnName}, '|', -1)) = ?
          OR ${columnName} LIKE ?
        LIMIT 1
      `;
      params = [value.trim(), value.trim(), value.trim(), `%${value.trim()}%`];
    } else {
      return res.status(400).json({ error: "❌ Invalid target field" });
    }

    console.log(`🔍 Executing query on "${target}":`, query, params);
    const [rows] = await db.promise().query(query, params);
    console.log(`🔍 Query returned ${rows.length} rows`);

    if (!rows.length) {
      let allQuery = "", allRows;
      if (target === "section") {
        allQuery = "SELECT id, name FROM Departments LIMIT 10";
      } else if (target === "technical") {
        allQuery = "SELECT id, name FROM Engineers LIMIT 10";
      } else if (target === "problem-status") {
        allQuery = `SELECT id, ${columnName} AS name FROM ${tableName} LIMIT 10`;
      }
      if (allQuery) {
        [allRows] = await db.promise().query(allQuery);
        console.log(`🔍 Available ${target}s:`, allRows.map(r => r.name));
      }
      return res.status(404).json({
        error: `❌ ${target === "section" ? "Department" : target === "technical" ? "Engineer" : "Status"} "${value}" not found.`
      });
    }

    const fullName = rows[0].name;
    const parts = fullName.split("|").map(s => s.trim());
    const result = {
      id: rows[0].id,
      fullName: fullName,
      englishName: parts[0] || "",
      arabicName: parts[1] || ""
    };
    console.log(`✅ Found ${target}:`, result);
    return res.json(result);
  } catch (err) {
    console.error("❌ Error getting full name:", err.sqlMessage || err.message || err);
    return res.status(500).json({ error: err.sqlMessage || "Server error getting full name." });
  }
};

module.exports = getFullNameController; 
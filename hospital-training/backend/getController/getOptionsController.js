const db = require('../db');

exports.getHardDriveTypes = (req, res) => {
  db.query("SELECT * FROM Hard_Drive_Types", (err, result) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(result);
  });
};

exports.getRamSizes = (req, res) => {
  db.query("SELECT * FROM RAM_Sizes", (err, result) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(result);
  });
};

exports.getDeviceTypes = (req, res) => {
  db.query("SELECT * FROM DeviceType", (err, result) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(result);
  });
};

exports.getRamTypes = (req, res) => {
  db.query("SELECT * FROM RAM_Types", (err, result) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(result);
  });
};

exports.getReportStatuses = (req, res) => {
  db.query("SELECT * FROM Report_Statuses", (err, result) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(result);
  });
};

exports.getTicketStatuses = (req, res) => {
  db.query("SELECT DISTINCT status FROM Maintenance_Reports", (err, result) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(result.map(r => ({ status_name: r.status })));
  });
};

exports.getApiDeviceTypes = (req, res) => {
  db.query("SELECT id, DeviceType AS name FROM DeviceType", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

exports.getAllProblems = (req, res) => {
  const sql = `
    SELECT problem_text FROM ProblemStates_Pc
    UNION ALL
    SELECT problem_text FROM ProblemStates_Printer
    UNION ALL
    SELECT problem_text FROM ProblemStates_Scanner
  `;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json(result);
  });
};

exports.getTypeProplem = (req, res) => {
  const role = req.user?.role;
  db.query("SELECT * FROM DeviceType", (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deviceTypes: result, role });
  });
};

exports.getDepartments = (req, res) => {
  const sql = `SELECT id, name AS fullName FROM Departments ORDER BY name ASC;`;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

exports.getCpuTypes = (req, res) => {
  db.query("SELECT * FROM CPU_Types", (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
};

exports.getScannerTypes = (req, res) => {
  db.query("SELECT * FROM Scanner_Types ORDER BY scanner_type ASC", (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
};

exports.getOsTypes = (req, res) => {
  db.query("SELECT * FROM OS_Types", (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
};

exports.getPcModels = (req, res) => {
  db.query("SELECT * FROM PC_Model", (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
};

exports.getScannerModels = (req, res) => {
  db.query("SELECT * FROM Scanner_Model", (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
};

exports.getInkTypes = (req, res) => {
  db.query('SELECT * FROM Ink_Types', (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(results);
  });
};

exports.getDeviceSpecifications = (req, res) => {
  const query = `SELECT DISTINCT CONCAT(device_name, ' - ', serial_number, ' - ', governmental_number) AS name FROM Maintenance_Devices ORDER BY name ASC`;
  db.query(query, (err, result) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(result);
  });
};

exports.getModelsByType = (req, res) => {
  const { type } = req.params;
  db.query("SELECT model_name FROM Maintance_Device_Model WHERE device_type_name = ?", [type], (err, result) => {
    if (err) return res.status(500).json({ error: "DB error" });
    res.json(result);
  });
};

exports.getTicketTypes = (req, res) => {
  db.query("SELECT * FROM Ticket_Types ORDER BY type_name ASC", (err, result) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(result);
  });
};

exports.getApiInkSerials = (req, res) => {
  db.query("SELECT id, serial_number AS name FROM Ink_Serials", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

exports.getApiCategories = (req, res) => {
  db.query("SELECT id, type_name AS name FROM Ticket_Types", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

exports.getDeviceTypesSimple = (req, res) => {
  db.query("SELECT DISTINCT device_type FROM Maintenance_Devices WHERE device_type IS NOT NULL ORDER BY device_type ASC", (err, result) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(result.map(row => row.device_type));
  });
};

exports.getProblemStates = (req, res) => {
  const rawType = req.params.deviceType.toLowerCase().trim();
  const typeMap = {
    pc: ['pc', 'desktop', 'laptop', 'كمبيوتر', 'لابتوب'],
    printer: ['printer', 'طابعة'],
    scanner: ['scanner', 'سكانر']
  };
  let matchedType = null;
  for (const [key, aliases] of Object.entries(typeMap)) {
    if (aliases.includes(rawType)) {
      matchedType = key;
      break;
    }
  }
  if (rawType === 'all-devices') {
    const sql = `
      SELECT problem_text, 'PC' AS device_type FROM ProblemStates_Pc
      UNION ALL
      SELECT problem_text, 'Printer' AS device_type FROM ProblemStates_Printer
      UNION ALL
      SELECT problem_text, 'Scanner' AS device_type FROM ProblemStates_Scanner
    `;
    db.query(sql, (err, results) => {
      if (err) return res.status(500).json({ error: "Server error" });
      res.json(results);
    });
  } else if (matchedType) {
    const tableName = {
      pc: 'ProblemStates_Pc',
      printer: 'ProblemStates_Printer',
      scanner: 'ProblemStates_Scanner'
    }[matchedType];
    db.query(`SELECT * FROM ${tableName}`, (err, result) => {
      if (err) return res.status(500).json({ error: "Server error" });
      res.json(result);
    });
  } else {
    db.query(
      "SELECT problemStates_Maintance_device_name FROM `problemStates_Maintance_device` WHERE device_type_name = ?",
      [rawType],
      (err, results) => {
        if (err) return res.status(500).json({ error: "DB error" });
        res.json(results);
      }
    );
  }
};

exports.getAllDevicesSpecs = (req, res) => {
  const sql = `
    SELECT 
      md.id, md.serial_number AS Serial_Number, md.governmental_number AS Governmental_Number,
      COALESCE(pc.Computer_Name, pr.Printer_Name, sc.Scanner_Name, md.device_name) AS name,
      md.device_type
    FROM Maintenance_Devices md
    LEFT JOIN PC_info pc 
      ON md.device_type = 'PC' AND md.serial_number = pc.Serial_Number AND md.governmental_number = pc.Governmental_Number
    LEFT JOIN Printer_info pr 
      ON md.device_type = 'Printer' AND md.serial_number = pr.Serial_Number AND md.governmental_number = pr.Governmental_Number
    LEFT JOIN Scanner_info sc 
      ON md.device_type = 'Scanner' AND md.serial_number = sc.Serial_Number AND md.governmental_number = sc.Governmental_Number
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: "Server error" });
    res.json(results);
  });
}; 

exports.getFloors = (req, res) => {
  const query = "SELECT * FROM Floors";
  db.query(query, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
};

exports.getTechnical = (req, res) => {
  const query = "SELECT * FROM Engineers";
  db.query(query, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
};

exports.getProcessorGenerations = (req, res) => {
  const query = "SELECT * FROM Processor_Generations";
  db.query(query, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
};

exports.getPrinterModels = (req, res) => {
  const query = "SELECT * FROM Printer_Model";
  db.query(query, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
};

exports.getPrinterTypes = (req, res) => {
  const query = "SELECT * FROM Printer_Types";
  db.query(query, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
};

exports.getDevicesByTypeAndDepartment = (req, res) => {
  const type = req.params.type.toLowerCase();
  const departmentParam = req.params.department;

  const findDeptSql = `
    SELECT id
    FROM Departments
    WHERE 
      SUBSTRING_INDEX(name, '|', 1) = ?
      OR SUBSTRING_INDEX(name, '|', -1) = ?
    LIMIT 1
  `;

  db.query(findDeptSql, [departmentParam, departmentParam], (err, deptRows) => {
    if (err) return res.status(500).json({ error: "Database error" });

    if (deptRows.length === 0) {
      return res.json([]);
    }

    const departmentId = deptRows[0].id;

    const sql = `
      SELECT
        md.id,
        md.device_type,
        md.device_name,
        md.serial_number       AS Serial_Number,
        md.governmental_number AS Governmental_Number
      FROM Maintenance_Devices AS md
      WHERE
        md.device_type = ?
        AND md.department_id = ?
        AND (md.is_deleted IS NULL OR md.is_deleted = FALSE)
    `;

    db.query(sql, [type, departmentId], (err2, deviceRows) => {
      if (err2) return res.status(500).json({ error: "Database error" });
      res.json(deviceRows);
    });
  });
};

exports.getProblemStatesMaintenance = (req, res) => {
  const rawType = req.params.deviceType.toLowerCase().trim();
  const typeMap = {
    pc: ['pc', 'desktop', 'laptop', 'كمبيوتر', 'لابتوب'],
    printer: ['printer', 'طابعة'],
    scanner: ['scanner', 'سكانر']
  };
  let matchedType = null;
  for (const [key, aliases] of Object.entries(typeMap)) {
    if (aliases.includes(rawType)) {
      matchedType = key;
      break;
    }
  }
  if (rawType === 'all-devices') {
    const sql = `
      SELECT problem_text, 'PC' AS device_type FROM ProblemStates_Pc
      UNION ALL
      SELECT problem_text, 'Printer' AS device_type FROM ProblemStates_Printer
      UNION ALL
      SELECT problem_text, 'Scanner' AS device_type FROM ProblemStates_Scanner
    `;
    db.query(sql, (err, results) => {
      if (err) return res.status(500).json({ error: "Server error" });
      res.json(results);
    });
  } else if (matchedType) {
    const tableName = {
      pc: 'ProblemStates_Pc',
      printer: 'ProblemStates_Printer',
      scanner: 'ProblemStates_Scanner'
    }[matchedType];
    db.query(`SELECT * FROM ${tableName}`, (err, result) => {
      if (err) return res.status(500).json({ error: "Server error" });
      res.json(result);
    });
  } else {
    db.query(
      "SELECT problemStates_Maintance_device_name FROM `problemStates_Maintance_device` WHERE device_type_name = ?",
      [rawType],
      (err, results) => {
        if (err) return res.status(500).json({ error: "DB error" });
        res.json(results);
      }
    );
  }
};

exports.generateInternalTicketNumber = async (req, res) => {
  try {
    const db = require('../db');
    db.query(
      "SELECT last_number FROM Ticket_Counters WHERE type = 'INT'",
      (err, result) => {
        if (err) {
          console.error("❌ Ticket generation failed:", err);
          return res.status(500).json({ error: "Internal server error" });
        }
        if (!result.length) {
          return res.status(500).json({ error: "Ticket counter not initialized for type 'INT'" });
        }
        const ticketNumber = `INT-${String(result[0].last_number).padStart(3, '0')}`;
        return res.json({ ticket_number: ticketNumber });
      }
    );
  } catch (error) {
    console.error("❌ Ticket generation failed:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

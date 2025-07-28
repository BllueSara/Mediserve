const db = require('../db');

exports.getReportDetails = (req, res) => {
 const reportId = req.params.id;
  const reportType = req.query.type;
    const lang       = (req.query.lang || "en").toLowerCase(); // "ar" أو "en" (افتراضي "en")

  console.log("Request reportId:", reportId);
  console.log("Request reportType:", reportType);
    console.log("Request lang:", lang);

  const printerJoin = `
    LEFT JOIN Printer_Types pr_type ON pr.PrinterType_id = pr_type.id
    LEFT JOIN Ink_Types ink_type ON pr.InkType_id = ink_type.id
    LEFT JOIN Ink_Serials ink_serial ON pr.InkSerial_id = ink_serial.id
  `;

  if (reportType === "external") {
    const newExternalSQL = `
      SELECT 
        mr.id AS report_id,
        mr.report_number,
        mr.status,
        mr.created_at,
        mr.issue_summary,
        mr.full_description,
        mr.maintenance_type,
        mr.priority,
   mr.attachment_name      AS attachment_name,    -- أضفت هذا
   mr.attachment_path      AS attachment_path,    -- وأيضاً هذا
   mr.signature_path       AS signature_path,     -- وأيضاً هذا
        et.ticket_number,
        et.attachment_name,
        et.attachment_path,
        et.report_datetime,
        et.issue_description,
        et.assigned_to AS reporter_name,

        d.name AS department_name,
        md.device_type,
        md.serial_number,
        md.governmental_number,
        COALESCE(pc.Computer_Name, pr.Printer_Name, sc.Scanner_Name, md.device_name) AS device_name,
pc.Mac_Address AS mac_address,
pc.Ip_Address AS ip_address,

        cpu.cpu_name,
        ram.ram_type,
        rsize.ram_size,
        os.os_name,
        gen.generation_number,
        hdt.drive_type,
        COALESCE(pcm.model_name, prm.model_name, scm.model_name, mdm_fixed.model_name) AS model_name,
        pr_type.printer_type,
        ink_type.ink_type,
        ink_serial.serial_number AS ink_serial_number,
        st.scanner_type

      FROM Maintenance_Reports mr
      LEFT JOIN External_Tickets et ON mr.ticket_id = et.id
      LEFT JOIN Maintenance_Devices md ON mr.device_id = md.id
      LEFT JOIN Departments d ON md.department_id = d.id

LEFT JOIN PC_info pc 
  ON LOWER(md.device_type) IN ('pc', 'desktop', 'laptop', 'كمبيوتر', 'لابتوب') 
  AND md.serial_number = pc.Serial_Number
      LEFT JOIN CPU_Types cpu ON pc.Processor_id = cpu.id
      LEFT JOIN RAM_Types ram ON pc.RAM_id = ram.id
      LEFT JOIN RAM_Sizes rsize ON pc.RamSize_id = rsize.id
      LEFT JOIN OS_Types os ON pc.OS_id = os.id
      LEFT JOIN Processor_Generations gen ON pc.Generation_id = gen.id
      LEFT JOIN Hard_Drive_Types hdt ON pc.Drive_id = hdt.id
      LEFT JOIN PC_Model pcm ON pc.Model_id = pcm.id

LEFT JOIN Printer_info pr
  ON LOWER(md.device_type) = 'printer'
  AND md.serial_number = pr.Serial_Number
        LEFT JOIN Printer_Model prm ON pr.Model_id = prm.id

LEFT JOIN Scanner_info sc
  ON LOWER(md.device_type) = 'scanner'
  AND md.serial_number = sc.Serial_Number 
       LEFT JOIN Scanner_Model scm ON sc.model_id = scm.id
      LEFT JOIN Scanner_Types st ON sc.ScannerType_id = st.id

      LEFT JOIN Maintance_Device_Model mdm_fixed ON md.model_id = mdm_fixed.id
      ${printerJoin}

      WHERE mr.id = ? AND mr.maintenance_type = 'External'
      LIMIT 1
    `;
    console.log("Running external SQL:", newExternalSQL);

    db.query(newExternalSQL, [reportId], (err, result) => {
      if (err) {
        console.error("Error in newExternalSQL:", err);
        return res.status(500).json({ error: "Server error" });
      }
      console.log("Result from newExternalSQL:", result);
      if (result.length) {
        const r = result[0];
        return res.json({
          id: r.report_id,
          report_number: r.report_number,
          ticket_number: r.ticket_number,
          created_at: r.created_at,
          reporter_name: r.reporter_name || "",
          assigned_to: r.reporter_name || "",
          report_type: "Incident",
          priority: r.priority || "Medium",
          mac_address: r.mac_address || "",
          ip_address: r.ip_address || "",
          scanner_type: r.scanner_type || "",
attachment_name:   r.attachment_name   || "",  // من Maintenance_Reports
attachment_path:   r.attachment_path   || "",
signature_path:    r.signature_path    || "",
          maintenance_manager: "",
          device_name: r.device_name || "",
          device_type: r.device_type || "",
          serial_number: r.serial_number || "",
          governmental_number: r.governmental_number || "",
          department_name: r.department_name || "",
          issue_summary: r.issue_summary || "",
          full_description: r.full_description || "",
          cpu_name: r.cpu_name || "",
          ram_type: r.ram_type || "",
          ram_size: r.ram_size || "",
          os_name: r.os_name || "",
          generation_number: r.generation_number || "",
          model_name: r.model_name || "",
          drive_type: r.drive_type || "",
          attachment_name: r.attachment_name || "",
          attachment_path: r.attachment_path || "",
          maintenance_type: r.maintenance_type,
          printer_type: r.printer_type || "",
          ink_type: r.ink_type || "",
          ink_serial_number: r.ink_serial_number || "",
          status: r.status || "Open",
          source: "external-new"
        });
      } else {
        const oldExternalSQL = `SELECT * FROM External_Maintenance WHERE id = ? LIMIT 1`;
        console.log("Running oldExternalSQL:", oldExternalSQL);

        db.query(oldExternalSQL, [reportId], (err2, result2) => {
          if (err2) return res.status(500).json({ error: "Server error" });
          if (!result2.length) return res.status(404).json({ error: "External report not found" });

          const r = result2[0];
          return res.json({
            id: r.id,
            report_number: r.ticket_number,
            ticket_number: r.ticket_number,
            created_at: r.created_at,
            reporter_name: r.reporter_name,
            assigned_to: r.reporter_name || "",
            report_type: "External",
            priority: r.priority || "Medium",
            mac_address: r.mac_address || "",
            ip_address: r.ip_address || "",
attachment_name:   r.attachment_name   || "",  // من Maintenance_Reports
attachment_path:   r.attachment_path   || "",
signature_path:    r.signature_path    || "",
            maintenance_manager: r.maintenance_manager,
            device_name: r.device_name,
            device_type: r.device_type,
            serial_number: r.serial_number,
            governmental_number: r.governmental_number,
            department_name: r.department_name,
            issue_summary: r.initial_diagnosis,
            full_description: r.final_diagnosis,
            cpu_name: r.cpu_name,
            ram_type: r.ram_type,
            ram_size: r.ram_size || "",
            scanner_type: r.scanner_type || "",
            os_name: r.os_name,
            generation_number: r.generation_number,
            model_name: r.model_name,
            drive_type: r.drive_type || "",
            printer_type: r.printer_type || "",
            ink_type: r.ink_type || "",
            ink_serial_number: r.ink_serial_number || "",
            maintenance_type: "External",
            status: r.status || "Open",
            source: "external-legacy"
          });
        });
      }
    });


  
  } else if (reportType === "new") {
    const sql = `
      SELECT 
        r.*, 
        d.name AS department_name,
        COALESCE(pc.model_name, pr.model_name, sc.model_name) AS model_name,
        cpu.cpu_name,
        ram.ram_type,
        rsize.ram_size,
        os.os_name,
        gen.generation_number,
        hdt.drive_type,
        pr_type.printer_type,
        ink_type.ink_type,
        ink_serial.serial_number AS ink_serial_number,
        st.scanner_type
      FROM New_Maintenance_Report r
      LEFT JOIN Departments d ON r.department_id = d.id
      LEFT JOIN PC_Model pc ON r.device_type = 'PC' AND r.model_id = pc.id
      LEFT JOIN Printer_Model pr ON r.device_type = 'Printer' AND r.model_id = pr.id
      LEFT JOIN Scanner_Model sc ON r.device_type = 'Scanner' AND r.model_id = sc.id
      LEFT JOIN Scanner_Types st ON r.device_type = 'Scanner' AND r.scanner_type_id = st.id
      LEFT JOIN CPU_Types cpu ON r.cpu_id = cpu.id
      LEFT JOIN RAM_Types ram ON r.ram_id = ram.id
      LEFT JOIN RAM_Sizes rsize ON r.ram_size_id = rsize.id
      LEFT JOIN OS_Types os ON r.os_id = os.id
      LEFT JOIN Processor_Generations gen ON r.generation_id = gen.id
      LEFT JOIN Hard_Drive_Types hdt ON r.drive_id = hdt.id
      LEFT JOIN Printer_Types pr_type ON r.printer_type_id = pr_type.id
      LEFT JOIN Ink_Types ink_type ON r.ink_type_id = ink_type.id
      LEFT JOIN Ink_Serials ink_serial ON r.ink_serial_id = ink_serial.id
      WHERE r.id = ? LIMIT 1
    `;
    console.log("Running new report SQL:", sql);

    db.query(sql, [reportId], (err, result) => {
      if (err) {
        console.error("Error in new report SQL:", err);
        return res.status(500).json({ error: "Server error" });
      }
      console.log("Result from new report SQL:", result);
      if (!result.length) return res.status(404).json({ error: "New maintenance report not found" });

      const r = result[0];
      return res.json({
        id: r.id,
        created_at: r.created_at,
        report_type: r.report_type,
        device_type: r.device_type,
        priority: r.priority,
        status: r.status,
        maintenance_type: "New",
        issue_summary: r.issue_summary || "",
        details: r.details || "",
        assigned_to: r.assigned_to || "",
        attachment_name: r.attachment_name,
        attachment_path: r.attachment_path,
        signature_path: r.signature_path || null,
        department_name: r.department_name,
        device_name: r.device_name,
        serial_number: r.serial_number,
        governmental_number: r.governmental_number,
        model_name: r.model_name,
        mac_address: r.mac_address || "",
        ip_address: r.ip_address || "",
        scanner_type: r.scanner_type || "",

        cpu_name: r.cpu_name,
        ram_type: r.ram_type,
        ram_size: r.ram_size || "",
        os_name: r.os_name,
        generation_number: r.generation_number,
        drive_type: r.drive_type || "",
        printer_type: r.printer_type || "",
        ink_type: r.ink_type || "",
        ink_serial_number: r.ink_serial_number || "",
        source: "new"
      });
    });

  } else {
    const sql = `
SELECT
  mr.id                     AS report_id,
  mr.report_number,
  mr.report_type,
  mr.status,
  mr.created_at,
  mr.issue_summary,
  mr.full_description,
  mr.maintenance_type,
  mr.signature_path,
  mr.attachment_name,
  mr.attachment_path,

  md.device_type,
  md.serial_number,
  md.governmental_number,
  COALESCE(pc.Computer_Name, pr.Printer_Name, sc.Scanner_Name, md.device_name) AS device_name,
  pc.Mac_Address           AS mac_address,
  pc.IP_Address            AS ip_address,

  d.name                   AS department_name,

  it.ticket_number,
  it.ticket_type,
  it.priority,
  it.assigned_to           AS technical,
  it.issue_description,

  pc_os.os_name,
  cpu.cpu_name,
  gen.generation_number,
  ram.ram_type,
  rsize.ram_size,
  hdt.drive_type,
  COALESCE(pcm.model_name, prm.model_name, scm.model_name, mdm_fixed.model_name) AS model_name,

  rm.problem_status,
  eng.name                 AS technical_engineer,
  rm.technical_engineer_id AS assigned_to_id,      -- ← هنا

  pr_type.printer_type,
  pr.PrinterType_id        AS printer_type_id,     -- ← هنا

  ink_type.ink_type,
  pr.InkType_id            AS ink_type_id,         -- ← هنا

  ink_serial.serial_number AS ink_serial_number,
  pr.InkSerial_id          AS ink_serial_id,       -- ← هنا

  st.scanner_type,

  gm.id                    AS general_id,
  gm.maintenance_date,
  gm.issue_type,
  gm.diagnosis_initial,
  gm.diagnosis_final,
  gm.device_id             AS general_device_id,
  gm.technician_name,
  gm.floor,
  gm.extension,
  gm.problem_status        AS general_problem_status,
  gm.notes,
  gm.customer_name,
  gm.id_number

FROM Maintenance_Reports mr
LEFT JOIN Maintenance_Devices md     ON mr.device_id = md.id
LEFT JOIN Departments d             ON md.department_id = d.id
LEFT JOIN Internal_Tickets it       ON mr.ticket_id = it.id

LEFT JOIN PC_info pc
  ON LOWER(md.device_type) IN ('pc','desktop','laptop','كمبيوتر','لابتوب')
  AND md.serial_number = pc.Serial_Number
LEFT JOIN CPU_Types cpu             ON pc.Processor_id = cpu.id
LEFT JOIN RAM_Types ram             ON pc.RAM_id       = ram.id
LEFT JOIN RAM_Sizes rsize           ON pc.RamSize_id   = rsize.id
LEFT JOIN OS_Types pc_os            ON pc.OS_id        = pc_os.id
LEFT JOIN Processor_Generations gen ON pc.Generation_id= gen.id
LEFT JOIN Hard_Drive_Types hdt      ON pc.Drive_id     = hdt.id
LEFT JOIN PC_Model pcm              ON pc.Model_id     = pcm.id

LEFT JOIN Printer_info pr
  ON LOWER(md.device_type) = 'printer'
  AND md.serial_number = pr.Serial_Number
LEFT JOIN Printer_Model prm         ON pr.Model_id     = prm.id
LEFT JOIN Printer_Types pr_type     ON pr.PrinterType_id = pr_type.id

LEFT JOIN Ink_Types ink_type        ON pr.InkType_id   = ink_type.id
LEFT JOIN Ink_Serials ink_serial    ON pr.InkSerial_id = ink_serial.id

LEFT JOIN Scanner_info sc
  ON LOWER(md.device_type) = 'scanner'
  AND md.serial_number = sc.Serial_Number
LEFT JOIN Scanner_Model scm         ON sc.model_id      = scm.id
LEFT JOIN Scanner_Types st          ON sc.ScannerType_id= st.id

LEFT JOIN Maintance_Device_Model mdm_fixed
  ON md.model_id = mdm_fixed.id

LEFT JOIN (
  SELECT *
  FROM Regular_Maintenance
  ORDER BY last_maintenance_date DESC
) AS rm ON rm.device_id = mr.device_id
LEFT JOIN Engineers eng             ON rm.technical_engineer_id = eng.id

LEFT JOIN (
    SELECT gm1.*
    FROM General_Maintenance gm1
    INNER JOIN (
        SELECT device_id, MAX(maintenance_date) AS max_date
        FROM General_Maintenance
        GROUP BY device_id
    ) gm2 ON gm1.device_id = gm2.device_id
         AND gm1.maintenance_date = gm2.max_date
) gm ON gm.device_id = mr.device_id

WHERE mr.id = ?


    `;
    console.log("Running internal report SQL:", sql);

    db.query(sql, [reportId], (err2, result2) => {
      if (err2) {
        console.error("Error in internal report SQL:", err2);
        return res.status(500).json({ error: "Server error" });
      }
      console.log("Result from internal report SQL:", result2);
      if (!result2.length) return res.status(404).json({ error: "Internal report not found" });

      let report = result2[0];

      if (result2.length > 1) {
        report = result2.reduce((latest, current) => {
          if (!latest.general_id || (current.general_id && current.general_id > latest.general_id)) {
            return current;
          }
          return latest;
        }, result2[0]);
      }

      return res.json({
        id: report.report_id,
        report_number: report.report_number,
        ticket_type: report.ticket_type || "",
        ticket_number: report.ticket_number,
        drive_type: report.drive_type || "",
        device_type: report.device_type,
        serial_number: report.serial_number,
        mac_address: report.mac_address,
        ip_address: report.ip_address,
        governmental_number: report.governmental_number,
        device_name: report.device_name,
        department_name: report.department_name,
        priority: report.priority,
        technical: report.technical,
        maintenance_type: report.maintenance_type,
        issue_summary: report.issue_summary,
        full_description: report.full_description,
        issue_description: report.issue_description || "",
        attachment_name: report.attachment_name || "",
        attachment_path: report.attachment_path || "",
        signature_path: report.signature_path || "",
        created_at: report.created_at,
        report_type: report.report_type,
        status: report.status || "Open",
        cpu_name: report.cpu_name || "",
        ram_type: report.ram_type || "",
        ram_size: report.ram_size || "",
        os_name: report.os_name || "",
        generation_number: report.generation_number || "",
        model_name: report.model_name || "",
        problem_status: report.problem_status || "",
        technical_engineer: report.technical_engineer || "",
        printer_type: report.printer_type || "",
        ink_type: report.ink_type || "",
        ink_serial_number: report.ink_serial_number || "",
        scanner_type: report.scanner_type || "",

        // General_Maintenance fields
        general_id: report.general_id,
        maintenance_date: report.maintenance_date,
        issue_type: report.issue_type,
        diagnosis_initial: report.diagnosis_initial,
        diagnosis_final: report.diagnosis_final,
        general_device_id: report.general_device_id,
        technician_name: report.technician_name,
        floor: report.floor,
        extension: report.extension || "N/A",
        general_problem_status: report.general_problem_status,
        notes: report.notes,
        customer_name: report.customer_name || "N/A",
        id_number: report.id_number || "N/A",
        source: "internal"
      });


    });
  }
}; 
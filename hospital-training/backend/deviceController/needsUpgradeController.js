const db = require("../db");

const needsUpgradeController = (req, res) => {
  const query = `
    SELECT 
      d.id,
      d.device_name,
      d.device_type,
      pi.Computer_Name,
      ram_size.ram_size,
      gen.generation_number,
      os.os_name,
      cpu.cpu_name
    FROM Maintenance_Devices d
    JOIN PC_info pi ON d.serial_number = pi.Serial_Number
    LEFT JOIN RAM_Sizes ram_size ON pi.RamSize_id = ram_size.id
    LEFT JOIN Processor_Generations gen ON pi.Generation_id = gen.id
    LEFT JOIN OS_Types os ON pi.OS_id = os.id
    LEFT JOIN CPU_Types cpu ON pi.Processor_id = cpu.id
    WHERE d.device_type = 'PC'
      AND (
        CAST(ram_size.ram_size AS UNSIGNED) < 8 OR
        CAST(gen.generation_number AS UNSIGNED) < 6 OR
        (os.os_name NOT LIKE '%10%' AND os.os_name NOT LIKE '%11%')
      )
  `;
  try {
    db.query(query, (err, results) => {
      if (err) {
        console.error("❌ Error in upgrade query:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }
      const withRecommendation = results.map(device => {
        const ram = parseInt(device.ram_size);
        const gen = parseInt(device.generation_number);
        const os = (device.os_name || "").toLowerCase();
        let issues = 0;
        if (ram < 8) issues++;
        if (gen < 6) issues++;
        if (os.includes("windows") && !os.includes("10") && !os.includes("11")) issues++;
        let status = issues >= 2 ? 'CRITICAL' : 'WARNING';
        let recommendation = [];
        if (ram < 8) recommendation.push("Upgrade RAM");
        if (gen < 6) recommendation.push("Replace CPU or Device");
        if (os.includes("windows") && !os.includes("10") && !os.includes("11")) recommendation.push("Upgrade OS");
        return {
          ...device,
          status,
          recommendation: recommendation.join(", ")
        };
      });
      res.json(withRecommendation);
    });
  } catch (err) {
    console.error("❌ Failed to get devices needing upgrade:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = needsUpgradeController; 
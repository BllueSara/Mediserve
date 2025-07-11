const db = require("../db");

const dashboardDataController = async (req, res) => {
  try {
    const [[{ totalDevices }]] = await db.promise().query(`SELECT COUNT(*) AS totalDevices FROM Maintenance_Devices`);
    const [[{ totalPCs }]] = await db.promise().query(`SELECT COUNT(*) AS totalPCs FROM Maintenance_Devices WHERE device_type = 'PC'`);
    const [[{ totalScanners }]] = await db.promise().query(`SELECT COUNT(*) AS totalScanners FROM Maintenance_Devices WHERE device_type = 'Scanner'`);
    const [[{ totalPrinters }]] = await db.promise().query(`SELECT COUNT(*) AS totalPrinters FROM Maintenance_Devices WHERE device_type = 'Printer'`);
    const [ramRows] = await db.promise().query(`
      SELECT ram_size.ram_size AS label, COUNT(*) AS count
      FROM PC_info
      LEFT JOIN RAM_Sizes ram_size ON PC_info.RamSize_id = ram_size.id
      GROUP BY ram_size.ram_size
      ORDER BY ram_size.ram_size+0
    `);
    const ramDistribution = {
      labels: ramRows.map(r => r.label || 'Unknown'),
      data: ramRows.map(r => r.count)
    };
    const [cpuRows] = await db.promise().query(`
      SELECT gen.generation_number AS label, COUNT(*) AS count
      FROM PC_info
      LEFT JOIN Processor_Generations gen ON PC_info.Generation_id = gen.id
      GROUP BY gen.generation_number
      ORDER BY gen.generation_number+0
    `);
    const cpuGeneration = {
      labels: cpuRows.map(r => r.label || 'Unknown'),
      data: cpuRows.map(r => r.count)
    };
    const [osRows] = await db.promise().query(`
      SELECT os.os_name AS version, COUNT(*) AS count
      FROM PC_info
      LEFT JOIN OS_Types os ON PC_info.OS_id = os.id
      GROUP BY os.os_name
    `);
    const outdatedOs = osRows.map(row => ({
      version: row.version,
      count: row.count,
      outdated: row.version && !row.version.includes('10') && !row.version.includes('11')
    }));
    const [departments] = await db.promise().query(`SELECT name FROM Departments ORDER BY name ASC`);
    const [cpuGens] = await db.promise().query(`SELECT DISTINCT gen.generation_number FROM Processor_Generations gen ORDER BY gen.generation_number+0`);
    const [osVersions] = await db.promise().query(`SELECT DISTINCT os.os_name FROM OS_Types os ORDER BY os.os_name`);
    const [ramSizes] = await db.promise().query(`SELECT DISTINCT ram_size.ram_size FROM RAM_Sizes ram_size ORDER BY ram_size.ram_size+0`);
    const [devices] = await db.promise().query(`SELECT * FROM Maintenance_Devices`);
    const needsReplacement = [];
    for (const device of devices) {
      const type = device.device_type?.toLowerCase().trim();
      const serial = device.serial_number;
      let department = '';
      const pcTypes = ["pc", "desktop", "laptop", "كمبيوتر", "لابتوب"];
      if (pcTypes.includes(type)) {
        const [deptRow] = await db.promise().query(`SELECT name FROM Departments WHERE id = ?`, [device.department_id]);
        if (deptRow.length > 0) department = deptRow[0].name;
        let ram = '', generation = '', os = '';
        const [pcRows] = await db.promise().query(`
          SELECT 
            os.os_name AS OS,
            ram_size.ram_size AS RAM,
            gen.generation_number AS Generation
          FROM PC_info pc
          LEFT JOIN OS_Types os ON pc.OS_id = os.id
          LEFT JOIN RAM_Sizes ram_size ON pc.RamSize_id = ram_size.id
          LEFT JOIN Processor_Generations gen ON pc.Generation_id = gen.id
          WHERE pc.Serial_Number = ?
        `, [serial]);
        const info = pcRows[0] || {};
        ram = info.RAM || '';
        generation = info.Generation || '';
        os = info.OS || '';
        const genNum = parseInt(generation?.replace(/\D/g, '')) || 0;
        const ramNum = parseInt(ram?.replace(/\D/g, '')) || 0;
        const osClean = (os || '').toLowerCase();
        const isOldGen = genNum < 8;
        const isLowRam = ramNum < 4;
        const isOldOS = osClean.includes('windows') && !osClean.includes('10') && !osClean.includes('11');
        const needs = isOldGen || isLowRam || isOldOS;
        needsReplacement.push({
          name: device.device_name,
          department,
          ram: ram || 'Unknown',
          cpu: generation || 'Unknown',
          os: os || 'Unknown',
          status: needs ? 'Replace Soon' : 'OK'
        });
      }
    }
    res.json({
      overview: {
        totalDevices,
        totalPCs,
        totalScanners,
        totalPrinters
      },
      ramDistribution,
      cpuGeneration,
      outdatedOs,
      filters: {
        departments: departments.map(d => d.name),
        cpuGens: cpuGens.map(c => c.generation_number),
        osVersions: osVersions.map(o => o.os_name),
        ramSizes: ramSizes.map(r => r.ram_size)
      },
      needsReplacement
    });
  } catch (err) {
    console.error('❌ Error in /api/dashboard-data:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = dashboardDataController; 
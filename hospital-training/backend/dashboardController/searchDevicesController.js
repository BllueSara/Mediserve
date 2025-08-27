const db = require("../db");

const searchDevicesController = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters long' });
    }
    
    const searchTerm = `%${q.trim()}%`;
    const searchTermWithSpaces = `% ${q.trim()} %`;
    const searchTermStart = `${q.trim()}%`;
    const searchTermEnd = `%${q.trim()}`;
    
    // البحث في الأجهزة التي تحتاج استبدال وتطابق البحث
    const [devices] = await db.promise().query(`
      SELECT DISTINCT
        md.device_name AS name,
        d.name AS department,
        ram_size.ram_size AS ram,
        gen.generation_number AS cpu,
        os.os_name AS os,
        'Replace Soon' AS status,
        pc.Mac_Address AS mac_address,
        pc.Ip_Address AS ip_address
      FROM Maintenance_Devices md
      LEFT JOIN Departments d ON md.department_id = d.id
      LEFT JOIN PC_info pc ON md.serial_number = pc.Serial_Number
      LEFT JOIN OS_Types os ON pc.OS_id = os.id
      LEFT JOIN RAM_Sizes ram_size ON pc.RamSize_id = ram_size.id
      LEFT JOIN Processor_Generations gen ON pc.Generation_id = gen.id
      WHERE md.device_type IN ('PC', 'pc', 'desktop', 'laptop', 'كمبيوتر', 'لابتوب')
      AND (
        (gen.generation_number IS NOT NULL AND CAST(REPLACE(gen.generation_number, 'th', '') AS UNSIGNED) < 8) OR
        (ram_size.ram_size IS NOT NULL AND CAST(REPLACE(ram_size.ram_size, 'GB', '') AS UNSIGNED) < 4) OR
        (os.os_name IS NOT NULL AND os.os_name LIKE '%windows%' AND os.os_name NOT LIKE '%10%' AND os.os_name NOT LIKE '%11%')
      )
      AND (
        md.device_name LIKE ? OR
        d.name LIKE ? OR
        TRIM(SUBSTRING_INDEX(d.name, '|', 1)) LIKE ? OR
        TRIM(SUBSTRING_INDEX(d.name, '|', -1)) LIKE ? OR
        ram_size.ram_size LIKE ? OR
        gen.generation_number LIKE ? OR
        os.os_name LIKE ? OR
        pc.Mac_Address LIKE ? OR
        pc.Ip_Address LIKE ?
      )
      ORDER BY 
        CASE 
          WHEN md.device_name LIKE ? THEN 1
          WHEN d.name LIKE ? THEN 2
          WHEN pc.Ip_Address LIKE ? THEN 3
          WHEN pc.Mac_Address LIKE ? THEN 4
          ELSE 5
        END,
        md.device_name ASC
      LIMIT 50
    `, [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm]);
    
    console.log(`🔍 Search for "${q}" returned ${devices.length} devices`);
    
    // Log search term and available departments for debugging
    console.log('🔍 Search term:', searchTerm);
    
    // Log first few results for debugging
    if (devices.length > 0) {
      console.log('📋 First few results:', devices.slice(0, 3).map(d => ({
        name: d.name,
        department: d.department,
        ip: d.ip_address,
        mac: d.mac_address
      })));
      
      // Log why each device was matched
      devices.slice(0, 3).forEach((device, index) => {
        console.log(`🔍 Device ${index + 1} "${device.name}" matched because:`);
        if (device.name && device.name.toLowerCase().includes(q.toLowerCase())) {
          console.log(`  - Device name contains "${q}"`);
        }
        if (device.department && device.department.toLowerCase().includes(q.toLowerCase())) {
          console.log(`  - Department "${device.department}" contains "${q}"`);
        }
        if (device.ip_address && device.ip_address.toLowerCase().includes(q.toLowerCase())) {
          console.log(`  - IP address "${device.ip_address}" contains "${q}"`);
        }
        if (device.mac_address && device.mac_address.toLowerCase().includes(q.toLowerCase())) {
          console.log(`  - MAC address "${device.mac_address}" contains "${q}"`);
        }
      });
    } else {
      console.log('❌ No results found - checking if departments exist...');
      // Check if there are any departments that might match
      const [deptCheck] = await db.promise().query(`
        SELECT DISTINCT d.name 
        FROM Departments d 
        WHERE d.name LIKE ? OR TRIM(SUBSTRING_INDEX(d.name, '|', 1)) LIKE ? OR TRIM(SUBSTRING_INDEX(d.name, '|', -1)) LIKE ?
        LIMIT 5
      `, [searchTerm, searchTerm, searchTerm]);
      console.log('📋 Matching departments found:', deptCheck);
    }
    
    res.json(devices);
    
  } catch (err) {
    console.error('❌ Error in search devices:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = searchDevicesController;

const db = require("../db");
const XLSX = require('xlsx');


const replacementReportController = async (req, res) => {
  try {
    const [devices] = await db.promise().query(`SELECT * FROM Maintenance_Devices`);
    const results = [];
    const pcTypes = ["pc", "desktop", "laptop", "كمبيوتر", "لابتوب"];

    for (const device of devices) {
      const type = device.device_type?.toLowerCase().trim();
      const serial = device.serial_number;
      if (pcTypes.includes(type)) {
        const [pcRows] = await db.promise().query(`
          SELECT 
            os.os_name    AS OS,
            ram_size.ram_size    AS RAM,
            gen.generation_number AS Generation
          FROM PC_info pc
          LEFT JOIN OS_Types os           ON pc.OS_id         = os.id
          LEFT JOIN RAM_Sizes ram_size    ON pc.RamSize_id    = ram_size.id
          LEFT JOIN Processor_Generations gen ON pc.Generation_id = gen.id
          WHERE pc.Serial_Number = ?
        `, [serial]);

        const info = pcRows[0] || {};
        const ram        = info.RAM        || '';
        const generation = info.Generation || '';
        const os         = info.OS        || '';

        const genNum = parseInt(generation.replace(/\D/g, '')) || 0;
        const ramNum = parseInt(ram.replace(/\D/g, ''))           || 0;
        const osClean = os.toLowerCase();
        const needsReplacement =
          genNum < 8 ||
          ramNum < 4 ||
          (osClean.includes('windows') && !osClean.includes('10') && !osClean.includes('11'));

        if (needsReplacement) {
          results.push([
            serial,
            os  || 'Unknown',
            generation || 'Unknown',
            ram || 'Unknown',
            '8th Gen+, 4GB+ RAM, Win 10/11',
            'Needs Replacement'
          ]);
        }
      }
    }

    if (results.length === 0) {
      return res.status(200).json({ message: 'No devices needing replacement.' });
    }

    // جهز البيانات للورقة
    const worksheetData = [
      ['Serial Number', 'Windows Version', 'Generation', 'RAM', 'Microsoft Requirements', 'Replacement Status'],
      ...results
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    worksheet['!cols'] = [
      { wch: 20 }, { wch: 20 }, { wch: 15 },
      { wch: 10 }, { wch: 35 }, { wch: 20 }
    ];

    // أنشئ المصنف (Workbook)
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Replacement Report');

    // === التعديل هنا: كتابة المصنف كـ binary string ثم تحويله إلى Buffer ===
    const wbBinary = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'binary'
    });
    const buffer = Buffer.from(wbBinary, 'binary');

    // راسل الهيدر لتنزيل الملف
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="Devices_Replacement_Report.xlsx"'
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Length', buffer.length);

    // أرسل البافر
    res.send(buffer);

  } catch (err) {
    console.error('❌ Error generating report:', err);
    res.status(500).json({ message: 'Error generating report' });
  }
};

module.exports = replacementReportController;

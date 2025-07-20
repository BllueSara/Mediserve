const db = require("../db");
// إذا احتجت إشعار استورد من notificationUtils

async function logActivity(userId, userName, action, details) {
  try {
    const [rows] = await db.promise().query('SELECT cancel_logs FROM user_permissions WHERE user_id = ?', [userId]);
    if (rows.length && rows[0].cancel_logs) {
      console.log(`🚫 Logging canceled for user ${userId} due to cancel_logs permission.`);
      return;
    }
  } catch (err) {
    console.error('❌ Error checking cancel_logs permission:', err);
  }
  if (typeof action === 'object') action = JSON.stringify(action);
  if (typeof details === 'object') details = JSON.stringify(details);
  const sql = `INSERT INTO Activity_Logs (user_id, user_name, action, details) VALUES (?, ?, ?, ?)`;
  await db.promise().query(sql, [userId, userName, action, details]);
}

const updateEntryController = async (req, res) => {
  const entryId = req.params.id;
  const { circuit, isp, location, ip, speed, start_date, end_date } = req.body;
  const userId = req.user.id;
  try {
    const conn = db.promise();
    const [userRows] = await conn.query(`SELECT name, role FROM users WHERE id = ?`, [userId]);
    const user = userRows[0];
    if (!user) return res.status(404).json({ message: "❌ User not found" });
    const userName = user.name;
    const isAdmin = user.role === 'admin';
    const [oldEntryRows] = await conn.query(`SELECT * FROM entries WHERE id = ?`, [entryId]);
    if (!oldEntryRows.length) return res.status(404).json({ message: "❌ Entry not found" });
    const oldEntry = oldEntryRows[0];
    if (!isAdmin && oldEntry.user_id !== userId) {
      return res.status(403).json({ message: "❌ غير مصرح لك بتعديل هذا الإدخال" });
    }
    await conn.query(`
      UPDATE entries SET 
        circuit_name = ?, isp = ?, location = ?, ip = ?, speed = ?, 
        start_date = ?, end_date = ?
      WHERE id = ?
    `, [circuit, isp, location, ip, speed, start_date, end_date, entryId]);
    // سجل التغييرات (نفس منطق network.js)
    const formatDate = d => d ? new Date(d).toISOString().split('T')[0] : null;
    const changes = [];
    if (oldEntry.circuit_name !== circuit)
      changes.push(`circuit_name: '${oldEntry.circuit_name}' → '${circuit}'`);
    if (oldEntry.isp !== isp)
      changes.push(`isp: '${oldEntry.isp}' → '${isp}'`);
    if (oldEntry.location !== location)
      changes.push(`location: '${oldEntry.location}' → '${location}'`);
    if (oldEntry.ip !== ip)
      changes.push(`ip: '${oldEntry.ip}' → '${ip}'`);
    if (oldEntry.speed !== speed)
      changes.push(`speed: '${oldEntry.speed}' → '${speed}'`);
    if (formatDate(oldEntry.start_date) !== formatDate(start_date))
      changes.push(`start_date: '${formatDate(oldEntry.start_date)}' → '${formatDate(start_date)}'`);
    if (formatDate(oldEntry.end_date) !== formatDate(end_date))
      changes.push(`end_date: '${formatDate(oldEntry.end_date)}' → '${formatDate(end_date)}'`);
    // سجل تغيير القسم في Activity_Logs إذا تغير القسم أو أي جدول مرتبط
    const tableLabelMap = {
      Maintenance_Devices: { en: "Maintenance Devices", ar: "أجهزة الصيانة" },
      Maintenance_Reports: { en: "Maintenance Reports", ar: "تقارير الصيانة" },
      PC_info: { en: "PC Info", ar: "معلومات الكمبيوتر" },
      General_Maintenance: { en: "General Maintenance", ar: "الصيانة العامة" },
      Regular_Maintenance: { en: "Regular Maintenance", ar: "الصيانة الدورية" },
      External_Maintenance: { en: "External Maintenance", ar: "الصيانة الخارجية" },
      New_Maintenance_Report: { en: "New Maintenance Report", ar: "تقرير صيانة جديد" },
      Internal_Tickets: { en: "Internal Tickets", ar: "تذاكر داخلية" },
      External_Tickets: { en: "External Tickets", ar: "تذاكر خارجية" }
    };
    const actionLabelMap = {
      "Updated Department": { en: "Updated Department", ar: "تحديث القسم" },
      "Edited Entry": { en: "Edited Entry", ar: "تعديل الإدخال" }
    };
    const fieldLabelMap = {
      circuit_name: { en: "Circuit Name", ar: "اسم الدائرة" },
      isp: { en: "ISP", ar: "مزود الخدمة" },
      location: { en: "Location", ar: "الموقع" },
      ip: { en: "IP Address", ar: "عنوان IP" },
      speed: { en: "Speed", ar: "السرعة" },
      start_date: { en: "Contract Start", ar: "بداية العقد" },
      end_date: { en: "Contract End", ar: "نهاية العقد" }
    };
    // Log department change
    if (logUpdates.length > 0 && oldEntry.location !== location) {
      const logTables = logUpdates.map(tbl => {
        const label = tableLabelMap[tbl] || { en: tbl, ar: tbl };
        return `[${label.en}|${label.ar}]`;
      }).join(', ');

      await logActivity(userId, userName, `[${actionLabelMap["Updated Department"].en}|${actionLabelMap["Updated Department"].ar}]`, `Changed department to '[${location}|${location}]' for IP [${ip}|${ip}] in: ${logTables}`);
    }

    // Log entry field changes
    if (changes.length > 0) {
      // ترجم أسماء الحقول في التغييرات
      const bilingualChanges = changes.map(change => {
        // مثال: circuit_name: 'old' → 'new'
        const match = change.match(/^(\w+): '(.+)' → '(.+)'$/);
        if (match) {
          const field = match[1];
          const oldVal = match[2];
          const newVal = match[3];
          const label = fieldLabelMap[field] || { en: field, ar: field };
          return `[${label.en}|${label.ar}]: '[${oldVal}|${oldVal}]' → '[${newVal}|${newVal}]'`;
        }
        return change;
      });

      await logActivity(userId, userName, `[${actionLabelMap["Edited Entry"].en}|${actionLabelMap["Edited Entry"].ar}]`, `Edited entry ID [${entryId}|${entryId}]:\n- ${bilingualChanges.join('\n- ')}`);
    }
    res.json({ message: `✅ Entry updated.` });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ message: "❌ Update failed", error: err.message });
  }
};

module.exports = updateEntryController; 
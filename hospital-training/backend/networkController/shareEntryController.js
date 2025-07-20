const db = require("../db");
const { createNotificationWithEmail } = require("./notificationUtils");

<<<<<<< HEAD
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

=======
>>>>>>> dfa1ff18f501a113e159d8d77f54553e04171c45
const shareEntryController = async (req, res) => {
  const senderId = req.user.id;
  const { devices, receiver_ids } = req.body;
  if (!Array.isArray(devices) || devices.length === 0 || !Array.isArray(receiver_ids) || receiver_ids.length === 0) {
    return res.status(400).json({ error: '❌ Missing devices or receivers' });
  }
  const formatDate = (iso) => {
    try {
      return new Date(iso).toISOString().split('T')[0];
    } catch {
      return null;
    }
  };
  try {
    const [senderInfoRows] = await db.promise().query(`SELECT name FROM users WHERE id = ?`, [senderId]);
    if (!senderInfoRows.length) {
      return res.status(400).json({ error: '❌ Sender not found' });
    }
    const senderName = senderInfoRows[0].name;
    const ipList = [];
    const receiverNames = [];
    for (const device of devices) {
      const { circuit_name, isp, location, ip, speed, start_date, end_date } = device;
      const formattedStart = formatDate(start_date);
      const formattedEnd = formatDate(end_date);
      if (!circuit_name || !isp || !location || !ip || !speed || !formattedStart || !formattedEnd) {
        continue;
      }
      const [existingRows] = await db.promise().query(`
        SELECT id FROM entries
        WHERE circuit_name = ? AND isp = ? AND location = ? AND ip = ? AND speed = ? AND start_date = ? AND end_date = ? AND user_id IS NULL
        LIMIT 1
      `, [circuit_name, isp, location, ip, speed, formattedStart, formattedEnd]);
      let entryId;
      if (existingRows.length > 0) {
        entryId = existingRows[0].id;
      } else {
        const [insertResult] = await db.promise().query(`
          INSERT INTO entries (circuit_name, isp, location, ip, speed, start_date, end_date, user_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, NULL)
        `, [circuit_name, isp, location, ip, speed, formattedStart, formattedEnd]);
        entryId = insertResult.insertId;
      }
      ipList.push(ip);
      for (const receiverId of receiver_ids) {
        await db.promise().query(`
          INSERT IGNORE INTO shared_entries (sender_id, receiver_id, entry_id)
          VALUES (?, ?, ?)
        `, [senderId, receiverId, entryId]);
      }
    }
    // إشعارات
    for (const receiverId of receiver_ids) {
      const [receiverInfo] = await db.promise().query(`SELECT name FROM users WHERE id = ?`, [receiverId]);
      const receiverName = receiverInfo[0]?.name || 'Unknown';
      receiverNames.push(receiverName);

      const message = `["📡 Network entries with IPs [${ipList.join(', ')}] were shared with you by ${senderName}|📡 تم مشاركة مداخل الشبكة ذات عناوين IP [${ipList.join(', ')}] معك بواسطة ${senderName}"]`;
      await createNotificationWithEmail(receiverId, message, 'network-share');
    }

    // سجل النشاط ثنائي اللغة
    const shareEntryActionLabelMap = { "Shared Network Entry": { en: "Shared Network Entry", ar: "مشاركة إدخال شبكة" } };
    const shareEntryFieldLabelMap = {
      entry: { en: "Entry", ar: "إدخال" },
      ip: { en: "IP Address", ar: "عنوان IP" },
      user: { en: "User", ar: "مستخدم" }
    };
    const actionBilingual = `[${shareEntryActionLabelMap["Shared Network Entry"].en}|${shareEntryActionLabelMap["Shared Network Entry"].ar}]`;
    const ipListStr = ipList.join(', ');
    const receiverNamesStr = receiverNames.join(', ');
    const logMsgBilingual =
      `[${shareEntryFieldLabelMap.entry.en}|${shareEntryFieldLabelMap.entry.ar}]s with [${shareEntryFieldLabelMap.ip.en}|${shareEntryFieldLabelMap.ip.ar}]s [${ipListStr}|${ipListStr}] were shared with [${shareEntryFieldLabelMap.user.en}|${shareEntryFieldLabelMap.user.ar}]s: [${receiverNamesStr}|${receiverNamesStr}]`;

<<<<<<< HEAD
    await logActivity(senderId, senderName, actionBilingual, logMsgBilingual);
=======
    await db.promise().query(`
      INSERT INTO Activity_Logs (user_id, user_name, action, details)
      VALUES (?, ?, ?, ?)
    `, [senderId, senderName, actionBilingual, logMsgBilingual]);
>>>>>>> dfa1ff18f501a113e159d8d77f54553e04171c45
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Share Error:', err);
    res.status(500).json({ error: '❌ Failed to share entries', details: err.message });
  }
};

module.exports = shareEntryController; 
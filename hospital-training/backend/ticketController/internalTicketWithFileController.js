const db = require('../db');
const upload = require('multer')();
const { createNotificationWithEmail } = require('../utils/notificationUtils');
const {
  cleanTag,
  makeBilingualLog,
  queryAsync,
  getUserById,
  getUserNameById
} = require('../maintanceController/helpers');

const internalTicketWithFileController = async (req, res) => {
  const userId = req.user.id;
  const {
    report_number,
    priority,
    department_id,
    device_id,
    issue_description,
    initial_diagnosis,
    final_diagnosis,
    other_description,
    assigned_to,
    status = 'Open',
    ticket_type,
    ticket_number
  } = req.body;

  const file = req.file;
  const fileName = file ? file.filename : null;
  const filePath = file ? file.path : null;

  const adminUser = await getUserById(userId);
  const userName = await getUserNameById(userId);

  let engineerName;
  let cleanedName = 'N/A';
  if (adminUser?.role === 'admin' && assigned_to) {
    const techEngineerRes = await queryAsync(`SELECT name FROM Engineers WHERE name = ?`, [assigned_to]);
    engineerName = techEngineerRes[0]?.name || userName;
    cleanedName = cleanTag(engineerName);
  } else {
    engineerName = userName;
    cleanedName = userName;
  }

  // ✅ Handle ticket number (use provided or auto-generate)
  let newTicketNumber = ticket_number;

  const proceedWithInsert = (generatedTicketNumber) => {
    const insertTicketQuery = `
      INSERT INTO Internal_Tickets (
        ticket_number, priority, department_id, issue_description, 
        assigned_to, status, attachment_name, attachment_path, ticket_type, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const ticketValues = [
      generatedTicketNumber,
      priority || "Medium",
      department_id || null,
      issue_description || '',
      assigned_to || '',
      status,
      fileName,
      filePath,
      ticket_type || '',
      userId
    ];

    db.query(insertTicketQuery, ticketValues, (ticketErr, ticketResult) => {
      if (ticketErr) {
        console.error("❌ Insert error (Internal_Tickets):", ticketErr);
        return res.status(500).json({ error: "Failed to insert internal ticket" });
      }

      const ticketId = ticketResult.insertId;

      const insertReportQuery = `
        INSERT INTO Maintenance_Reports (
          report_number, ticket_id, device_id, issue_summary, full_description, 
          status, maintenance_type, report_type, user_id
        ) VALUES (?, ?, ?, ?, ?, ?, 'Internal', 'Incident', ?)
      `;
      const reportValues = [
        generatedTicketNumber,
        ticketId,
        device_id || null,
        initial_diagnosis || '',
        final_diagnosis || other_description || '',
        status,
        userId
      ];

      db.query(insertReportQuery, reportValues, async (reportErr) => {
        if (reportErr) {
          console.error("❌ Insert error (Maintenance_Reports):", reportErr);
          return res.status(500).json({ error: "Failed to insert report" });
        }

        await createNotificationWithEmail(userId,
          `["Internal ticket created: ${generatedTicketNumber} for ${ticket_type} by engineer ${userName} and assigned to ${assigned_to}|تم إنشاء تذكرة داخلية: ${generatedTicketNumber} لـ ${ticket_type} بواسطة المهندس ${userName} وتم تعيينها للمهندس ${assigned_to}"]`,
          'internal-ticket',
          'ar' // Pass the language preference to the notification creation function
        );

        await createNotificationWithEmail(userId,
          `["Report created for ticket ${generatedTicketNumber} for ${ticket_type} by engineer ${userName} and assigned to ${assigned_to}|تم إنشاء تقرير للتذكرة ${generatedTicketNumber} لـ ${ticket_type} بواسطة المهندس ${userName} وتم تعيينها للمهندس ${assigned_to}"]`,
          'internal-ticket-report',
          'ar' // Pass the language preference to the notification creation function
        );

        let techUserId;
        if (!isNaN(assigned_to)) {
          techUserId = parseInt(assigned_to);
        } else {
          // ✅ لو اسم → نحاول نجيب ID من جدول Users
          const techUserRes = await queryAsync(`
            SELECT id FROM Users WHERE name = ?
          `, [assigned_to.trim()]);
          techUserId = techUserRes[0]?.id;
          if (techUserId) {
            await createNotificationWithEmail(techUserId,
              `["You have been assigned a new internal ticket ${generatedTicketNumber} by ${userName}|تم تعيين تذكرة داخلية جديدة لك ${generatedTicketNumber} بواسطة ${userName}"]`,
              'technical-notification',
              'ar'
            );
          }
        }

        await queryAsync(`
          INSERT INTO Activity_Logs (user_id, user_name, action, details)
          VALUES (?, ?, ?, ?)
        `, [
          userId,
          userName,
          JSON.stringify(makeBilingualLog('Submitted Internal Ticket', 'إرسال تذكرة داخلية')),
          JSON.stringify(makeBilingualLog(
            `Internal ticket submitted (${generatedTicketNumber}) with report`,
            `تم إرسال تذكرة داخلية (${generatedTicketNumber}) مع تقرير`
          ))
        ]);

        res.status(201).json({
          message: "✅ Internal ticket and report created",
          ticket_number: generatedTicketNumber,
          ticket_id: ticketId
        });
      });
    });
  };

  if (!ticket_number) {
    // Auto-generate ticket number logic here if needed
    return res.status(400).json({ error: "Missing ticket number" });
  } else {
    // مثال: INT-008 → ناخذ 8 ونزيده 1
    const manualNumber = parseInt(ticket_number.split("-")[1]);
    if (!isNaN(manualNumber)) {
      const nextNumber = manualNumber + 1;
      newTicketNumber = `INT-${String(nextNumber).padStart(3, '0')}`;
      const updateCounterQuery = `
        UPDATE Ticket_Counters 
        SET last_number = GREATEST(last_number, ?) 
        WHERE type = 'INT'
      `;
      db.query(updateCounterQuery, [nextNumber], (updateErr) => {
        if (updateErr) {
          console.error("❌ Counter update error:", updateErr);
          return res.status(500).json({ error: "Failed to update ticket counter" });
        }
        proceedWithInsert(newTicketNumber);
      });
    } else {
      return res.status(400).json({ error: "Invalid manual ticket number format" });
    }
  }
};

module.exports = internalTicketWithFileController; 
const db = require('../db');
const { createNotificationWithEmail } = require('../utils/notificationUtils');
const {
  makeBilingualLog,
  queryAsync,
  getUserNameById
} = require('../maintanceController/helpers');

const externalTicketWithFileController = async (req, res) => {
  const userId = req.user.id;
  try {
    const {
      ticket_number,
      reporter_name,
      device_type,
      section,
      device_spec,
      priority,
      issue_description,
      report_datetime
    } = req.body;

    const file = req.file;
    const fileName = file ? file.filename : null;
    const filePath = file ? file.path : null;

    const capitalizedPriority = priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase();
    const userName = await getUserNameById(userId);

    // استقبل department_id كرقم
    let department_id = req.body.department_id;
    if (department_id !== undefined) {
      department_id = parseInt(department_id, 10);
      if (isNaN(department_id)) {
        return res.status(400).json({ error: "Invalid department_id. Must be an integer." });
      }
    } else {
      // دعم قديم: إذا لم يُرسل department_id، استخدم section (لكن هذا سيؤدي لخطأ في الإدخال)
      department_id = null;
    }

    const insertTicketQuery = `
      INSERT INTO External_Tickets (
        ticket_number,
        department_id,
        priority,
        issue_description,
        assigned_to,
        status,
        attachment_name,
        attachment_path,
        report_datetime,
        user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const ticketValues = [
      ticket_number,
      department_id, // <-- استخدم id فقط
      capitalizedPriority,
      issue_description || '',
      reporter_name || '',
      'Open',
      fileName || '',
      filePath || '',
      report_datetime || new Date(),
      userId
    ];
    const ticketResult = await queryAsync(insertTicketQuery, ticketValues);
    const ticketId = ticketResult.insertId;
    const insertReportQuery = `
      INSERT INTO Maintenance_Reports (
        report_number,
        ticket_id,
        device_id,
        issue_summary,
        full_description,
        status,
        maintenance_type,
        report_type,
        priority,
        user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const reportValues = [
      ticket_number,
      ticketId,
      device_spec || null,
      issue_description || '',
      '',
      'Open',
      'External',
      'Incident',
      capitalizedPriority || 'Medium',
      userId
    ];
    await queryAsync(insertReportQuery, reportValues);
    await createNotificationWithEmail(userId,
      `["External ticket created: ${ticket_number} by engineer ${reporter_name || 'N/A'}|تم إنشاء تذكرة خارجية: ${ticket_number} بواسطة المهندس ${reporter_name || 'غير محدد'}]`,
      'external-ticket',
      'ar'
    );
    await createNotificationWithEmail(userId,
      `["Report created for external ticket ${ticket_number} by engineer ${reporter_name || 'N/A'}|تم إنشاء تقرير للتذكرة الخارجية ${ticket_number} بواسطة المهندس ${reporter_name || 'غير محدد'}]`,
      'external-ticket-report',
      'ar'
    );
    res.status(201).json({
      message: "✅ External ticket and report created successfully",
      ticket_number: ticket_number,
      ticket_id: ticketId
    });
  } catch (err) {
    console.error("❌ Server error:", err);
    if (err.code === 'ER_DUP_ENTRY' && err.sqlMessage.includes('report_number')) {
      return res.status(400).json({
        error: `The report number "${req.body.ticket_number}" is already in use. Please use a different one.`
      });
    }
    res.status(500).json({ error: "Unexpected server error" });
  }
};

module.exports = externalTicketWithFileController; 
const db = require("../db");

const getUserPermissionsController = (req, res) => {
  const userId = req.params.id;
  const sql = `SELECT * FROM user_permissions WHERE user_id = ?`;
  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (!results.length) {
      return res.json({
        device_access: 'none',
        full_access: false,
        view_access: true,
        add_items: false,
        edit_items: false,
        delete_items: false,
        check_logs: false,
        edit_permission: false,
<<<<<<< HEAD
        share_items: false,
        cancel_emails: false,
        cancel_notifications: false,
        cancel_logs: false
      });
    }
    // Ensure new fields are present in the result (for backward compatibility)
    const perms = results[0];
    perms.cancel_emails = perms.cancel_emails || false;
    perms.cancel_notifications = perms.cancel_notifications || false;
    perms.cancel_logs = perms.cancel_logs || false;
    res.json(perms);
=======
        share_items: false
      });
    }
    res.json(results[0]);
>>>>>>> dfa1ff18f501a113e159d8d77f54553e04171c45
  });
};

module.exports = getUserPermissionsController; 
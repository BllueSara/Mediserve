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
        share_items: false
      });
    }
    res.json(results[0]);
  });
};

module.exports = getUserPermissionsController; 
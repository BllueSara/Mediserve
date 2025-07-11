const db = require("../db");

const getUserWithPermissionsController = (req, res) => {
  const userId = req.params.id;
  db.query('SELECT id, name, email FROM users WHERE id = ?', [userId], (err, userResult) => {
    if (err || userResult.length === 0) {
      return res.status(500).json({ message: 'Failed to load user' });
    }
    const user = userResult[0];
    db.query(
      `SELECT 
        device_access,
        full_access,
        view_access,
        add_items,
        edit_items,
        delete_items,
        check_logs,
        edit_permission,
        share_items
       FROM user_permissions WHERE user_id = ?`,
      [userId],
      (permErr, permResult) => {
        if (permErr) {
          return res.status(500).json({ message: 'Failed to load permissions' });
        }
        let permissions = {
          device_access: 'none',
          full_access: false,
          view_access: false,
          add_items: false,
          edit_items: false,
          delete_items: false,
          check_logs: false,
          edit_permission: false,
          share_items: false
        };
        if (permResult.length > 0) {
          permissions = permResult[0];
        }
        res.json({
          ...user,
          permissions
        });
      }
    );
  });
};

module.exports = getUserWithPermissionsController; 
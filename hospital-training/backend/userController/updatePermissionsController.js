const db = require("../db");

const updatePermissionsController = (req, res) => {
  const userId = req.params.id;
  const {
    device_access,
    full_access,
    view_access,
    add_items,
    edit_items,
    delete_items,
    check_logs,
    edit_permission,
    share_items
  } = req.body;

  const sql = `
    INSERT INTO user_permissions (
      user_id,
      device_access,
      full_access,
      view_access,
      add_items,
      edit_items,
      delete_items,
      check_logs,
      edit_permission,
      share_items
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      device_access = VALUES(device_access),
      full_access = VALUES(full_access),
      view_access = VALUES(view_access),
      add_items = VALUES(add_items),
      edit_items = VALUES(edit_items),
      delete_items = VALUES(delete_items),
      check_logs = VALUES(check_logs),
      edit_permission = VALUES(edit_permission),
      share_items = VALUES(share_items)
  `;

  const values = [
    userId,
    device_access,
    full_access,
    view_access,
    add_items,
    edit_items,
    delete_items,
    check_logs,
    edit_permission,
    share_items
  ];

  db.query(sql, values, (err) => {
    if (err) {
      console.error("❌ Error saving permissions:", err);
      return res.status(500).json({ message: "Failed to save permissions" });
    }
    res.json({ message: "✅ Permissions saved successfully" });
  });
};

module.exports = updatePermissionsController; 
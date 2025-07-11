const db = require("../db");

const deleteEntryController = async (req, res) => {
  const userId = req.user.id;
  const entryId = req.params.id;

  try {
    const conn = db.promise();
    const [userRows] = await conn.query(`SELECT name, role FROM users WHERE id = ?`, [userId]);
    const user = userRows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });
    const isAdmin = user.role === 'admin';
    const [entryRows] = await conn.query(`SELECT * FROM entries WHERE id = ?`, [entryId]);
    if (!entryRows.length) return res.status(404).json({ error: 'Entry not found' });
    const entry = entryRows[0];
    if (!isAdmin && entry.user_id !== userId) {
      return res.status(403).json({ error: '❌ Unauthorized to delete this entry' });
    }
    const [result] = await conn.query('DELETE FROM entries WHERE id = ?', [entryId]);
    if (result.affectedRows === 0) {
      return res.status(400).json({ error: '❌ Delete failed' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Delete Error:", err);
    res.status(500).json({ error: '❌ Delete failed', details: err.message });
  }
};

module.exports = deleteEntryController; 
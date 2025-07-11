const db = require("../db");
const bcrypt = require('bcryptjs');

const resetPasswordController = async (req, res) => {
  const token = req.params.token;
  const { newPassword } = req.body;
  db.query(
    'SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > NOW()',
    [token],
    async (err, users) => {
      if (err || users.length === 0) return res.status(400).json({ message: 'Invalid or expired token' });
      const hashed = await bcrypt.hash(newPassword, 12);
      db.query(
        'UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
        [hashed, users[0].id],
        (updateErr) => {
          if (updateErr) return res.status(500).json({ message: 'Failed to reset password' });
          res.json({ message: 'Password has been successfully reset' });
        }
      );
    }
  );
};

module.exports = resetPasswordController; 
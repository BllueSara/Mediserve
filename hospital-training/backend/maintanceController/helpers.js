const db = require('../db');

function removeLangTag(text) {
  if (!text || typeof text !== 'string') return text;
  return text.replace(/\[(ar|en)\]/g, '').trim();
}

function cleanTag(text) {
  if (!text || typeof text !== 'string') return text;
  return text.replace(/\[(ar|en)\]/g, '').trim();
}

function makeBilingualLog(en, ar) {
  return { en, ar };
}

function formatNumber(prefix, number, suffix = "", digits = 4) {
  return `${prefix}-${number.toString().padStart(digits, '0')}${suffix ? `-${suffix}` : ""}`;
}

async function queryAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

async function getUserById(id) {
  const res = await queryAsync('SELECT * FROM Users WHERE id = ?', [id]);
  return res[0];
}

async function getUserNameById(id) {
  const res = await queryAsync('SELECT name FROM Users WHERE id = ?', [id]);
  return res[0]?.name || null;
}

async function generateNumber(type) {
  const [row] = await queryAsync(`SELECT last_number FROM Ticket_Counters WHERE type = ?`, [type]);
  if (!row) throw new Error(`No counter entry for type ${type}`);
  const nextNumber = row.last_number + 1;
  await queryAsync(`UPDATE Ticket_Counters SET last_number = ? WHERE type = ?`, [nextNumber, type]);
  return nextNumber;
}

module.exports = {
  removeLangTag,
  cleanTag,
  makeBilingualLog,
  formatNumber,
  queryAsync,
  getUserById,
  getUserNameById,
  generateNumber
}; 
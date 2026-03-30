const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

function resolveDbPath() {
  const baseDir = app && app.getPath ? app.getPath('userData') : __dirname;
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }
  return path.join(baseDir, 'bilimbox.db');
}

const db = new Database(resolveDbPath());

// Jadvallarni yaratish
db.exec(`
  CREATE TABLE IF NOT EXISTS foydalanuvchi (
    id INTEGER PRIMARY KEY,
    ism TEXT NOT NULL,
    yaratilgan TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS statistika (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bolim TEXT NOT NULL,
    togriler INTEGER DEFAULT 0,
    xatolar INTEGER DEFAULT 0,
    sana TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

module.exports = {
  getIsm() {
    const row = db.prepare('SELECT ism FROM foydalanuvchi LIMIT 1').get();
    return row ? row.ism : null;
  },

  saveIsm(ism) {
    db.prepare('DELETE FROM foydalanuvchi').run();
    db.prepare('INSERT INTO foydalanuvchi (ism) VALUES (?)').run(ism);
  },

  getStatistika() {
    return db.prepare('SELECT * FROM statistika').all();
  },

  addStatistika(bolim, togri, xato) {
    db.prepare(`
      INSERT INTO statistika (bolim, togriler, xatolar)
      VALUES (?, ?, ?)
    `).run(bolim, togri, xato);
  },

  clearStatistika() {
    db.prepare('DELETE FROM statistika').run();
  },

  clearFoydalanuvchi() {
    db.prepare('DELETE FROM foydalanuvchi').run();
  }
};

const initSqlJs = require("sql.js");
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs");

const DB_DIR = path.join(__dirname, "..", "data");
const DB_PATH = path.join(DB_DIR, "clinic.db");

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

let _sqlDb = null;
let _saveTimer = null;

function scheduleSave() {
  if (_saveTimer) clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => {
    if (_sqlDb) fs.writeFileSync(DB_PATH, Buffer.from(_sqlDb.export()));
  }, 300);
}

function rowsFromResult(result) {
  if (!result || result.length === 0) return [];
  const { columns, values } = result[0];
  return values.map(row => {
    const obj = {};
    columns.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
}

function queryRows(sql, params) {
  try {
    return rowsFromResult(_sqlDb.exec(sql, params || []));
  } catch (err) { throw err; }
}

function runSql(sql, params) {
  _sqlDb.run(sql, params || []);
  scheduleSave();
  const r = _sqlDb.exec("SELECT last_insert_rowid() as id");
  return { lastInsertRowid: r[0]?.values[0]?.[0] ?? 0 };
}

const prepare = (sql) => ({
  get(...params) { return queryRows(sql, params)[0] ?? undefined; },
  all(...params) { return queryRows(sql, params); },
  run(...params) { return runSql(sql, params); },
});

const transaction = (fn) => () => {
  _sqlDb.run("BEGIN");
  try {
    const r = fn();
    _sqlDb.run("COMMIT");
    scheduleSave();
    return r;
  } catch (e) { _sqlDb.run("ROLLBACK"); throw e; }
};

const db = { prepare, transaction, exec: (s) => { _sqlDb.run(s); scheduleSave(); }, pragma: () => {} };

function seedUsers() {
  const r = _sqlDb.exec("SELECT COUNT(*) as c FROM users");
  if (r[0]?.values[0]?.[0] === 0) {
    db.prepare("INSERT INTO users (username,password_hash,role,full_name) VALUES (?,?,?,?)").run(
      "doctor", bcrypt.hashSync("doctor123", 10), "doctor", "Dr. Chavan");
    db.prepare("INSERT INTO users (username,password_hash,role,full_name) VALUES (?,?,?,?)").run(
      "staff", bcrypt.hashSync("staff123", 10), "receptionist", "Clinic Staff");
    console.log("Seeded default users: doctor/doctor123  staff/staff123");
  }
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, role TEXT NOT NULL, full_name TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, is_deleted INTEGER DEFAULT 0)
CREATE TABLE IF NOT EXISTS patients (id INTEGER PRIMARY KEY AUTOINCREMENT, patient_id TEXT UNIQUE NOT NULL, full_name TEXT NOT NULL, date_of_birth TEXT, gender TEXT, contact_number TEXT, address TEXT, guardian_name TEXT, allergies TEXT, notes TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, created_by INTEGER, is_deleted INTEGER DEFAULT 0)
CREATE TABLE IF NOT EXISTS visits (id INTEGER PRIMARY KEY AUTOINCREMENT, patient_id INTEGER NOT NULL, visit_date TEXT NOT NULL, chief_complaints TEXT, diagnosis TEXT, observations TEXT, follow_up_date TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, created_by INTEGER, is_deleted INTEGER DEFAULT 0)
CREATE TABLE IF NOT EXISTS prescriptions (id INTEGER PRIMARY KEY AUTOINCREMENT, visit_id INTEGER NOT NULL, patient_id INTEGER NOT NULL, notes TEXT, investigations TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, created_by INTEGER, is_deleted INTEGER DEFAULT 0)
CREATE TABLE IF NOT EXISTS prescription_items (id INTEGER PRIMARY KEY AUTOINCREMENT, prescription_id INTEGER NOT NULL, medicine_name TEXT NOT NULL, dosage TEXT, frequency TEXT, duration TEXT, special_instructions TEXT, sort_order INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP)
CREATE TABLE IF NOT EXISTS medicines (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description TEXT, dosage TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, is_deleted INTEGER DEFAULT 0)
CREATE INDEX IF NOT EXISTS idx_p_pid ON patients(patient_id)
CREATE INDEX IF NOT EXISTS idx_p_name ON patients(full_name)
CREATE INDEX IF NOT EXISTS idx_v_pid ON visits(patient_id)
CREATE INDEX IF NOT EXISTS idx_rx_vid ON prescriptions(visit_id)
CREATE INDEX IF NOT EXISTS idx_med_name ON medicines(name)
`;

let _initialized = false;
let _initPromise = null;

function initDb() {
  if (_initPromise) return _initPromise;
  _initPromise = initSqlJs().then((SQL) => {
    _sqlDb = fs.existsSync(DB_PATH) ? new SQL.Database(fs.readFileSync(DB_PATH)) : new SQL.Database();
    SCHEMA.trim().split("\n").map(s => s.trim()).filter(s => s && !s.startsWith('--')).forEach(s => {
      try { _sqlDb.run(s); } catch(e) { if (!e.message.includes('already exists')) throw e; }
    });
    // Migrations for existing databases
    try { _sqlDb.run("ALTER TABLE prescriptions ADD COLUMN investigations TEXT"); } catch(e) { /* column already exists */ }
    // medicines table is created by SCHEMA above (CREATE TABLE IF NOT EXISTS), no ALTER needed
    seedUsers();
    _initialized = true;
    console.log("Database ready:", DB_PATH);
    return db;
  });
  return _initPromise;
}

module.exports = { initDb, getDb: () => db };

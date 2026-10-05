import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Detect Vercel serverless / AWS Lambda environment
const isVercel = Boolean(
  process.env.VERCEL ||
  process.env.VERCEL_ENV ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.LAMBDA_TASK_ROOT
);

// On Vercel, the application filesystem is read-only; use /tmp for SQLite
const defaultDbPath = isVercel
  ? path.join('/tmp', 'queueless.db')
  : path.join(__dirname, 'queueless.db');

let resolvedDbPath = process.env.DATABASE_PATH || process.env.DATABASE_URL || defaultDbPath;
if (resolvedDbPath.startsWith('file:')) {
  resolvedDbPath = resolvedDbPath.replace(/^file:\/\/?/, '');
}

// Ensure database directory exists before initializing SQLite
const dbDir = path.dirname(resolvedDbPath);
if (dbDir && !fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new DatabaseSync(resolvedDbPath);

// Enable Foreign Keys and appropriate journal mode for environment
db.exec('PRAGMA foreign_keys = ON;');
if (!isVercel) {
  db.exec('PRAGMA journal_mode = WAL;');
} else {
  db.exec('PRAGMA journal_mode = DELETE;');
}

export function initDatabase() {
  db.exec('PRAGMA foreign_keys = OFF;');

  // Migrate existing users table if it still has old 'user' constraint
  const tableInfo = db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'users'").get();
  if (tableInfo && !tableInfo.sql.includes("'student'")) {
    db.exec(`
      CREATE TABLE users_migrated (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'student' CHECK(role IN ('student', 'staff', 'admin')),
        phone TEXT,
        student_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      INSERT INTO users_migrated (id, name, email, password_hash, role, phone, student_id, created_at)
      SELECT id, name, email, password_hash, CASE WHEN role = 'user' THEN 'student' ELSE role END, phone, student_id, created_at FROM users;
      DROP TABLE users;
      ALTER TABLE users_migrated RENAME TO users;
    `);
  }

  db.exec('PRAGMA foreign_keys = ON;');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student' CHECK(role IN ('student', 'staff', 'admin')),
      phone TEXT,
      student_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      description TEXT,
      category TEXT DEFAULT 'General',
      location TEXT,
      avg_service_mins INTEGER DEFAULT 10,
      daily_capacity INTEGER DEFAULT 120,
      is_active INTEGER DEFAULT 1,
      is_paused INTEGER DEFAULT 0,
      open_time TEXT DEFAULT '09:00',
      close_time TEXT DEFAULT '17:00',
      icon_name TEXT DEFAULT 'Layers',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS counters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
      counter_number TEXT NOT NULL,
      name TEXT NOT NULL,
      assigned_staff_id INTEGER REFERENCES users(id),
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS queue_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_id INTEGER NOT NULL REFERENCES services(id),
      session_date DATE NOT NULL,
      last_token_number INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'closed', 'paused')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(service_id, session_date)
    );

    CREATE TABLE IF NOT EXISTS queue_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token_number TEXT NOT NULL UNIQUE,
      numeric_token INTEGER NOT NULL,
      session_id INTEGER REFERENCES queue_sessions(id),
      service_id INTEGER NOT NULL REFERENCES services(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      counter_id INTEGER REFERENCES counters(id),
      status TEXT NOT NULL DEFAULT 'waiting' CHECK(status IN ('waiting', 'called', 'serving', 'completed', 'skipped', 'cancelled')),
      priority INTEGER DEFAULT 0,
      notes TEXT,
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      called_at DATETIME,
      served_at DATETIME,
      completed_at DATETIME,
      estimated_wait_mins INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_id INTEGER NOT NULL REFERENCES services(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      appointment_date DATE NOT NULL,
      time_slot TEXT NOT NULL,
      purpose TEXT,
      status TEXT DEFAULT 'confirmed' CHECK(status IN ('confirmed', 'checked_in', 'cancelled', 'completed')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'info' CHECK(type IN ('info', 'call', 'alert', 'complete')),
      is_read INTEGER DEFAULT 0,
      link TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      queue_entry_id INTEGER REFERENCES queue_entries(id),
      service_id INTEGER NOT NULL REFERENCES services(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      comments TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_queue_service_status ON queue_entries(service_id, status);
    CREATE INDEX IF NOT EXISTS idx_queue_user ON queue_entries(user_id);
    CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, is_read);
  `);

  // Ensure default system settings exist
  const insertSetting = db.prepare('INSERT OR IGNORE INTO system_settings (key, value) VALUES (?, ?)');
  insertSetting.run('campus_name', 'Metropolitan State University');
  insertSetting.run('operating_hours', '08:30 AM - 05:00 PM');
  insertSetting.run('max_daily_capacity', '150');
  insertSetting.run('sound_chime_enabled', 'true');
  insertSetting.run('sms_notifications_enabled', 'true');
  insertSetting.run('auto_call_delay_seconds', '30');

  seedInitialData();
}

function seedInitialData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) {
    return; // Already initialized
  }

  console.log('[Database] Seeding initial baseline accounts and services...');

  const salt = bcrypt.genSaltSync(10);
  const adminPass = bcrypt.hashSync('admin123', salt);
  const staffPass = bcrypt.hashSync('staff123', salt);
  const studentPass = bcrypt.hashSync('student123', salt);
  const demoPass = bcrypt.hashSync('demo123', salt);

  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, phone, student_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertUser.run('Campus Admin Office', 'admin@queueless.edu', adminPass, 'admin', '+1 555-0100', 'ADM-ROOT');
  insertUser.run('Officer Sarah Jenkins', 'staff@queueless.edu', staffPass, 'staff', '+1 555-0101', 'STAFF-01');
  insertUser.run('Alex Chen', 'student@queueless.edu', studentPass, 'student', '+1 555-0102', 'STU-2026-884');
  insertUser.run('Maya Patel', 'demo@queueless.edu', demoPass, 'student', '+1 555-0103', 'STU-2026-912');

  const insertService = db.prepare(`
    INSERT INTO services (name, code, description, category, location, avg_service_mins, daily_capacity, open_time, close_time, icon_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const s1 = insertService.run(
    'Registrar & Academic Affairs',
    'REG',
    'Transcript verification, degree certificates, enrollment letters, course adds/drops, and graduation clearances.',
    'Academic',
    'Admin Building, Block A, 1st Floor',
    8,
    150,
    '08:30',
    '16:30',
    'GraduationCap'
  );

  const s2 = insertService.run(
    'Finance & Fee Accounts',
    'FIN',
    'Tuition payment receipts, scholarship disbursals, examination fees clearance, and fee reconciliation.',
    'Financial',
    'Finance Wing, Ground Floor, Counter Hall',
    7,
    180,
    '09:00',
    '16:00',
    'CreditCard'
  );

  const s3 = insertService.run(
    'Central University Library',
    'LIB',
    'Library access cards, book returns, thesis deposit, research database access, and study room reservations.',
    'Library',
    'Central Library Complex, Level 2',
    5,
    200,
    '08:00',
    '20:00',
    'BookOpen'
  );

  const s4 = insertService.run(
    'Student Health & Medical Care',
    'MED',
    'General physician consultations, emergency first aid, physical health clearances, and medical certifications.',
    'Healthcare',
    'Student Wellness Center, East Wing',
    12,
    80,
    '08:30',
    '17:30',
    'Activity'
  );

  const s5 = insertService.run(
    'Campus IT Helpdesk & Systems',
    'ITD',
    'Portal logins, Wi-Fi credentials, campus smart identity badges, and high-performance computing access.',
    'Technical',
    'Science & Tech Block, Ground Floor',
    6,
    160,
    '09:00',
    '17:00',
    'Monitor'
  );

  // Seed Counters
  const insertCounter = db.prepare(`
    INSERT INTO counters (service_id, counter_number, name, assigned_staff_id, is_active)
    VALUES (?, ?, ?, ?, ?)
  `);

  // REG counters
  insertCounter.run(s1.lastInsertRowid, '1', 'Counter 1 — Transcripts & Verifications', 2, 1);
  insertCounter.run(s1.lastInsertRowid, '2', 'Counter 2 — Degree & Certificates', 2, 1);
  insertCounter.run(s1.lastInsertRowid, '3', 'Counter 3 — General Academic Inquiries', 2, 1);

  // FIN counters
  insertCounter.run(s2.lastInsertRowid, '1', 'Counter 1 — Fee Clearance & Receipts', 2, 1);
  insertCounter.run(s2.lastInsertRowid, '2', 'Counter 2 — Scholarships & Adjustments', 2, 1);

  // LIB counters
  insertCounter.run(s3.lastInsertRowid, '1', 'Counter 1 — Circulation & Return', 2, 1);
  insertCounter.run(s3.lastInsertRowid, '2', 'Counter 2 — Digital Library & Research', 2, 1);

  // MED counters
  insertCounter.run(s4.lastInsertRowid, '1', 'Counter 1 — Triage & General Physician', 2, 1);
  insertCounter.run(s4.lastInsertRowid, '2', 'Counter 2 — Pharmacy & Medical Records', 2, 1);

  // ITD counters
  insertCounter.run(s5.lastInsertRowid, '1', 'Counter 1 — Identity Cards & Wi-Fi Access', 2, 1);

  // Seed Today's Active Queue Sessions
  const today = new Date().toISOString().split('T')[0];
  const insertSession = db.prepare(`
    INSERT INTO queue_sessions (service_id, session_date, last_token_number, status)
    VALUES (?, ?, ?, 'active')
  `);

  const sessReg = insertSession.run(s1.lastInsertRowid, today, 105);
  const sessFin = insertSession.run(s2.lastInsertRowid, today, 204);
  const sessLib = insertSession.run(s3.lastInsertRowid, today, 303);
  const sessMed = insertSession.run(s4.lastInsertRowid, today, 402);
  const sessItd = insertSession.run(s5.lastInsertRowid, today, 502);

  // Seed sample realistic queue entries to illustrate active queue
  const insertQueue = db.prepare(`
    INSERT INTO queue_entries (token_number, numeric_token, session_id, service_id, user_id, counter_id, status, notes, joined_at, called_at, served_at, completed_at, estimated_wait_mins)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?), datetime('now', ?), datetime('now', ?), datetime('now', ?), ?)
  `);

  // REG queue: 1 completed, 1 currently serving at counter 1, 2 waiting
  insertQueue.run('REG-101', 101, sessReg.lastInsertRowid, s1.lastInsertRowid, 4, 1, 'completed', 'Degree verification', '-40 minutes', '-38 minutes', '-37 minutes', '-28 minutes', 0);
  insertQueue.run('REG-102', 102, sessReg.lastInsertRowid, s1.lastInsertRowid, 4, 1, 'serving', 'Official transcript copy', '-25 minutes', '-10 minutes', '-9 minutes', null, 0);
  insertQueue.run('REG-103', 103, sessReg.lastInsertRowid, s1.lastInsertRowid, 3, null, 'waiting', 'Enrollment verification letter', '-15 minutes', null, null, null, 4);
  insertQueue.run('REG-104', 104, sessReg.lastInsertRowid, s1.lastInsertRowid, 4, null, 'waiting', 'Course add/drop form signature', '-5 minutes', null, null, null, 8);

  // FIN queue: 1 serving at counter 1, 1 waiting
  insertQueue.run('FIN-201', 201, sessFin.lastInsertRowid, s2.lastInsertRowid, 4, 4, 'completed', 'Tuition challan submission', '-50 minutes', '-45 minutes', '-44 minutes', '-35 minutes', 0);
  insertQueue.run('FIN-202', 202, sessFin.lastInsertRowid, s2.lastInsertRowid, 4, 4, 'serving', 'Scholarship deduction receipt', '-20 minutes', '-6 minutes', '-5 minutes', null, 0);
  insertQueue.run('FIN-203', 203, sessFin.lastInsertRowid, s2.lastInsertRowid, 3, null, 'waiting', 'Fee clearance for exams', '-12 minutes', null, null, null, 5);

  // Seed sample notifications for student (Alex Chen - id: 3)
  const insertNotif = db.prepare(`
    INSERT INTO notifications (user_id, title, message, type, is_read, link)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertNotif.run(3, 'Welcome to QueueLess', 'Your smart queue account is ready. Browse campus services and join queues remotely!', 'info', 1, '/services');
  insertNotif.run(3, 'Queue Position Alert', 'You are currently position #1 in line for Registrar & Academic Affairs. Estimated wait: ~4 minutes.', 'alert', 0, '/track/3');

  // Seed sample appointment
  const insertAppt = db.prepare(`
    INSERT INTO appointments (service_id, user_id, appointment_date, time_slot, purpose, status)
    VALUES (?, ?, ?, ?, ?, 'confirmed')
  `);
  insertAppt.run(s4.lastInsertRowid, 3, today, '02:30 PM', 'Routine physical fitness checkup for athletics');

  // Seed sample feedback
  const insertFb = db.prepare(`
    INSERT INTO feedback (queue_entry_id, service_id, user_id, rating, comments)
    VALUES (1, ?, 4, 5, 'Super fast service! Skipped 45 minutes of physical standing.')
  `);
  insertFb.run(s1.lastInsertRowid);

  console.log('[Database] Baseline seed completed successfully.');
}

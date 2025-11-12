// database/init.js - Database initialization and schema
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Database configuration
const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '..', 'data', 'atlas.db');
const DATA_DIR = path.dirname(DB_PATH);

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Create database connection
const db = new Database(DB_PATH);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = -20000'); // 20MB cache
db.pragma('temp_store = MEMORY');

// Database schema
const schema = `
-- Users table for authentication and user tracking
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'provider',
  full_name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME,
  is_active BOOLEAN DEFAULT 1
);

-- Patients table matching frontend schema
CREATE TABLE IF NOT EXISTS patients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  age INTEGER,
  gender TEXT,
  date_of_birth DATE,
  phone TEXT,
  email TEXT,
  address TEXT,
  emergency_contact TEXT,
  medical_history TEXT,
  allergies TEXT,
  current_medications TEXT,
  last_visit DATETIME,
  created_by TEXT,
  modified_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  modified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_modified_by TEXT,
  sync_version INTEGER DEFAULT 1,
  is_deleted BOOLEAN DEFAULT 0
);

-- Consultations table matching frontend schema
CREATE TABLE IF NOT EXISTS consultations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  date DATETIME DEFAULT CURRENT_TIMESTAMP,
  chief_complaint TEXT,
  symptoms TEXT,
  physical_examination TEXT,
  vital_signs TEXT,
  diagnosis TEXT,
  plan TEXT,
  tags TEXT, -- JSON array
  ai_recommendations TEXT, -- JSON
  final_diagnosis TEXT,
  provider_notes TEXT,
  created_by TEXT,
  provider_id TEXT,
  provider_name TEXT,
  provider_role TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  modified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  sync_version INTEGER DEFAULT 1,
  is_deleted BOOLEAN DEFAULT 0,
  FOREIGN KEY (patient_id) REFERENCES patients(id)
);

-- Medications reference table
CREATE TABLE IF NOT EXISTS medications (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  dosages TEXT, -- JSON array
  indications TEXT, -- JSON array
  contraindications TEXT, -- JSON array
  side_effects TEXT, -- JSON array
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Conditions reference table
CREATE TABLE IF NOT EXISTS conditions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  symptoms TEXT, -- JSON array
  diagnostics TEXT, -- JSON array
  treatments TEXT, -- JSON array
  keywords TEXT, -- JSON array
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Guidelines reference table
CREATE TABLE IF NOT EXISTS guidelines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  category TEXT,
  subcategory TEXT,
  resource_level TEXT,
  content TEXT, -- JSON
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Performance metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  operation TEXT,
  duration REAL,
  additional_data TEXT, -- JSON
  device_id TEXT,
  user_id TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User activity log
CREATE TABLE IF NOT EXISTS user_activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  action TEXT,
  table_name TEXT,
  record_id TEXT,
  data TEXT, -- JSON
  ip_address TEXT,
  user_agent TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

// Indexes for better performance
const indexes = `
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(name);
CREATE INDEX IF NOT EXISTS idx_patients_created_at ON patients(created_at);
CREATE INDEX IF NOT EXISTS idx_patients_last_visit ON patients(last_visit);
CREATE INDEX IF NOT EXISTS idx_patients_deleted ON patients(is_deleted);
CREATE INDEX IF NOT EXISTS idx_consultations_patient ON consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultations_date ON consultations(date);
CREATE INDEX IF NOT EXISTS idx_consultations_provider ON consultations(provider_id);
CREATE INDEX IF NOT EXISTS idx_consultations_deleted ON consultations(is_deleted);
CREATE INDEX IF NOT EXISTS idx_medications_name ON medications(name);
CREATE INDEX IF NOT EXISTS idx_medications_category ON medications(category);
CREATE INDEX IF NOT EXISTS idx_conditions_name ON conditions(name);
CREATE INDEX IF NOT EXISTS idx_guidelines_category ON guidelines(category);
CREATE INDEX IF NOT EXISTS idx_performance_timestamp ON performance_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_performance_operation ON performance_metrics(operation);
CREATE INDEX IF NOT EXISTS idx_user_activity_user ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_timestamp ON user_activity(timestamp);
`;

// Triggers for updating modified_at timestamps
const triggers = `
CREATE TRIGGER IF NOT EXISTS update_patients_modified_at 
  AFTER UPDATE ON patients 
  BEGIN 
    UPDATE patients SET modified_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS update_consultations_modified_at 
  AFTER UPDATE ON consultations 
  BEGIN 
    UPDATE consultations SET modified_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS update_users_updated_at 
  AFTER UPDATE ON users 
  BEGIN 
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;
`;

// Initialize database with schema
async function initializeDatabase() {
  try {
    console.log(' Creating database schema...');
    
    const transaction = db.transaction(() => {
      db.exec(schema);
      db.exec(indexes);
      db.exec(triggers);
    });
    
    transaction();
    
    console.log(' Database schema created successfully');
    
    await seedInitialData();
    
    console.log(' Database initialization completed');
    
    return db;
  } catch (error) {
    console.error(' Database initialization failed:', error);
    throw error;
  }
}

// Seed initial reference data
async function seedInitialData() {
  try {
    const medicationCount = db.prepare('SELECT COUNT(*) as count FROM medications').get();
    const conditionCount = db.prepare('SELECT COUNT(*) as count FROM conditions').get();
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
    
    if (medicationCount.count === 0) {
      console.log(' Seeding initial medications...');
      
      const insertMedication = db.prepare(`
        INSERT INTO medications (id, name, category, dosages, indications, contraindications, side_effects)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      const medications = [
        {
          id: 'med1',
          name: 'Amoxicillin',
          category: 'Antibiotic',
          dosages: JSON.stringify([
            { form: 'Tablet', strength: '250mg', dosing: 'Adult: 250-500mg three times daily' },
            { form: 'Suspension', strength: '125mg/5ml', dosing: 'Children: 20-40mg/kg/day in divided doses' }
          ]),
          indications: JSON.stringify(['Respiratory tract infections', 'Urinary tract infections', 'Skin infections']),
          contraindications: JSON.stringify(['Known hypersensitivity to penicillins']),
          sideEffects: JSON.stringify(['Diarrhea', 'Rash', 'Nausea'])
        },
        {
          id: 'med2',
          name: 'Paracetamol',
          category: 'Analgesic',
          dosages: JSON.stringify([
            { form: 'Tablet', strength: '500mg', dosing: 'Adult: 500-1000mg every 4-6 hours, max 4g/day' },
            { form: 'Syrup', strength: '120mg/5ml', dosing: 'Children: 10-15mg/kg every 4-6 hours' }
          ]),
          indications: JSON.stringify(['Pain relief', 'Fever reduction']),
          contraindications: JSON.stringify(['Severe liver disease']),
          sideEffects: JSON.stringify(['Rare: liver toxicity with overdose'])
        }
      ];
      
      const insertMeds = db.transaction((meds) => {
        for (const med of meds) {
          insertMedication.run(med.id, med.name, med.category, med.dosages, med.indications, med.contraindications, med.sideEffects);
        }
      });
      
      insertMeds(medications);
      console.log(' Medications seeded');
    }
    
    if (conditionCount.count === 0) {
      console.log(' Seeding initial conditions...');
      
      const insertCondition = db.prepare(`
        INSERT INTO conditions (id, name, symptoms, diagnostics, treatments, keywords)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      const conditions = [
        {
          id: 'cond1',
          name: 'Pneumonia',
          symptoms: JSON.stringify(['Cough', 'Fever', 'Shortness of breath', 'Chest pain']),
          diagnostics: JSON.stringify(['Clinical assessment', 'Chest X-ray if available']),
          treatments: JSON.stringify([
            'Mild: Amoxicillin 500mg three times daily for 5 days',
            'Severe: Refer to hospital if available'
          ]),
          keywords: JSON.stringify(['respiratory', 'infection', 'lung'])
        },
        {
          id: 'cond2',
          name: 'Malaria',
          symptoms: JSON.stringify(['Fever', 'Headache', 'Chills', 'Muscle pain']),
          diagnostics: JSON.stringify(['RDT (Rapid Diagnostic Test)', 'Clinical assessment']),
          treatments: JSON.stringify([
            'Uncomplicated: Artemisinin-based combination therapy',
            'Severe: IM artesunate and urgent referral'
          ]),
          keywords: JSON.stringify(['fever', 'tropical', 'parasitic'])
        }
      ];
      
      const insertConds = db.transaction((conds) => {
        for (const cond of conds) {
          insertCondition.run(cond.id, cond.name, cond.symptoms, cond.diagnostics, cond.treatments, cond.keywords);
        }
      });
      
      insertConds(conditions);
      console.log(' Conditions seeded');
    }
    
    if (userCount.count === 0) {
      console.log(' Creating default admin user...');
      
      const bcrypt = require('bcryptjs');
      const defaultPassword = process.env.ADMIN_PASSWORD || 'atlas123';
      const hashedPassword = bcrypt.hashSync(defaultPassword, 10);
      
      const insertUser = db.prepare(`
        INSERT INTO users (username, email, password_hash, role, full_name)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      insertUser.run('admin', 'admin@atlas.local', hashedPassword, 'admin', 'System Administrator');
      
      console.log(' Default admin user created');
      console.log(' Login: admin / ' + defaultPassword);
    }
    
  } catch (error) {
    console.error(' Error seeding data:', error);
  }
}

module.exports = {
  db,
  initializeDatabase,
  seedInitialData
};

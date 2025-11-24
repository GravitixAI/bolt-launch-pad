import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';

// Database stored in user's app data folder
// Windows: C:\Users\<username>\AppData\Roaming\electron-vite-react-boilerplate
const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'app-database.db');

// Ensure directory exists
if (!fs.existsSync(userDataPath)) {
  fs.mkdirSync(userDataPath, { recursive: true });
}

// Initialize database connection
export const db = new Database(dbPath, { 
  verbose: process.env.NODE_ENV === 'development' ? console.log : undefined
});

// Enable foreign keys for referential integrity
db.pragma('foreign_keys = ON');

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

/**
 * Initialize database schema
 * Creates tables if they don't exist
 */
export function initializeDatabase() {
  // Example table: app_settings
  db.exec(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Example table: user_preferences (for demonstration)
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      preference_key TEXT NOT NULL,
      preference_value TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(category, preference_key)
    );
  `);

  console.log('✅ Database initialized at:', dbPath);
}

/**
 * Graceful shutdown - closes database connection
 * Call this before app quits to prevent corruption
 */
export function closeDatabase() {
  try {
    db.close();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database:', error);
  }
}

/**
 * Get database file path
 * Useful for debugging or backup operations
 */
export function getDatabasePath(): string {
  return dbPath;
}


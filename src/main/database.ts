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
  // App settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // User preferences table
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

  // Migration: Add tags column to existing tables if they don't have it
  try {
    // Check if bookmarks table has tags column
    const bookmarksInfo = db.prepare("PRAGMA table_info(bookmarks)").all() as any[];
    const hasBookmarksTags = bookmarksInfo.some(col => col.name === 'tags');
    if (!hasBookmarksTags && bookmarksInfo.length > 0) {
      console.log('📊 Adding tags column to bookmarks table...');
      db.exec('ALTER TABLE bookmarks ADD COLUMN tags TEXT');
    }

    // Check if executables table has tags column
    const executablesInfo = db.prepare("PRAGMA table_info(executables)").all() as any[];
    const hasExecutablesTags = executablesInfo.some(col => col.name === 'tags');
    if (!hasExecutablesTags && executablesInfo.length > 0) {
      console.log('📊 Adding tags column to executables table...');
      db.exec('ALTER TABLE executables ADD COLUMN tags TEXT');
    }

    // Check if scripts table has tags column
    const scriptsInfo = db.prepare("PRAGMA table_info(scripts)").all() as any[];
    const hasScriptsTags = scriptsInfo.some(col => col.name === 'tags');
    if (!hasScriptsTags && scriptsInfo.length > 0) {
      console.log('📊 Adding tags column to scripts table...');
      db.exec('ALTER TABLE scripts ADD COLUMN tags TEXT');
    }
  } catch (error) {
    console.error('Migration error:', error);
  }

  // Bookmarks table
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookmarks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      favicon TEXT,
      category TEXT,
      tags TEXT, -- Comma-separated list of tags
      is_team_level INTEGER DEFAULT 0,
      is_personal INTEGER DEFAULT 1,
      created_by TEXT,
      updated_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_sync_at DATETIME,
      sync_hash TEXT
    );
  `);

  // Executables table
  db.exec(`
    CREATE TABLE IF NOT EXISTS executables (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      executable_path TEXT NOT NULL,
      parameters TEXT,
      icon TEXT,
      category TEXT,
      tags TEXT, -- Comma-separated list of tags
      is_team_level INTEGER DEFAULT 0,
      is_personal INTEGER DEFAULT 1,
      created_by TEXT,
      updated_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_sync_at DATETIME,
      sync_hash TEXT
    );
  `);

  // Scripts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS scripts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      script_content TEXT NOT NULL,
      script_type TEXT CHECK(script_type IN ('powershell', 'cmd')),
      icon TEXT,
      category TEXT,
      tags TEXT, -- Comma-separated list of tags
      is_team_level INTEGER DEFAULT 0,
      is_personal INTEGER DEFAULT 1,
      created_by TEXT,
      updated_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_sync_at DATETIME,
      sync_hash TEXT
    );
  `);

  // User shares table (for direct user-to-user sharing)
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_shares (
      id TEXT PRIMARY KEY,
      item_type TEXT CHECK(item_type IN ('bookmark', 'executable', 'script')),
      item_id TEXT NOT NULL,
      shared_by TEXT NOT NULL,
      shared_with TEXT NOT NULL,
      shared_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create indices for better query performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_bookmarks_team ON bookmarks(is_team_level);
    CREATE INDEX IF NOT EXISTS idx_bookmarks_personal ON bookmarks(is_personal);
    CREATE INDEX IF NOT EXISTS idx_bookmarks_created_by ON bookmarks(created_by);
    
    CREATE INDEX IF NOT EXISTS idx_executables_team ON executables(is_team_level);
    CREATE INDEX IF NOT EXISTS idx_executables_personal ON executables(is_personal);
    CREATE INDEX IF NOT EXISTS idx_executables_created_by ON executables(created_by);
    
    CREATE INDEX IF NOT EXISTS idx_scripts_team ON scripts(is_team_level);
    CREATE INDEX IF NOT EXISTS idx_scripts_personal ON scripts(is_personal);
    CREATE INDEX IF NOT EXISTS idx_scripts_created_by ON scripts(created_by);
    CREATE INDEX IF NOT EXISTS idx_scripts_type ON scripts(script_type);
    
    CREATE INDEX IF NOT EXISTS idx_user_shares_item ON user_shares(item_type, item_id);
    CREATE INDEX IF NOT EXISTS idx_user_shares_with ON user_shares(shared_with);
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


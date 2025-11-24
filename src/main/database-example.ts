/**
 * Database Usage Examples
 * 
 * This file demonstrates how to use the database in your app.
 * You can delete this file once you understand the patterns.
 */

import { dbOperations } from './db-operations';
import { db } from './database';

/**
 * Example 1: Basic Settings Management
 */
export function exampleBasicSettings() {
  // Store app configuration
  dbOperations.setSetting('app_version', '1.0.0');
  dbOperations.setSetting('first_run', 'false');
  dbOperations.setSetting('last_sync', new Date().toISOString());

  // Retrieve settings
  const version = dbOperations.getSetting('app_version');
  console.log('App version:', version?.value);

  // Get all settings
  const allSettings = dbOperations.getAllSettings();
  console.log('All settings:', allSettings);
}

/**
 * Example 2: User Preferences by Category
 */
export function exampleUserPreferences() {
  // Store UI preferences
  dbOperations.setPreference('ui', 'theme', 'dark');
  dbOperations.setPreference('ui', 'language', 'en');
  dbOperations.setPreference('ui', 'sidebar_collapsed', 'false');

  // Store notification preferences
  dbOperations.setPreference('notifications', 'email', 'true');
  dbOperations.setPreference('notifications', 'desktop', 'true');

  // Retrieve by category
  const uiPrefs = dbOperations.getPreferencesByCategory('ui');
  console.log('UI preferences:', uiPrefs);

  // Get specific preference
  const theme = dbOperations.getPreference('ui', 'theme');
  console.log('Current theme:', theme);
}

/**
 * Example 3: Using Transactions
 * Transactions ensure all operations succeed or all fail
 */
export function exampleTransaction() {
  try {
    const result = dbOperations.transaction(() => {
      // All these operations will be atomic
      dbOperations.setSetting('sync_status', 'in_progress');
      dbOperations.setPreference('sync', 'last_attempt', new Date().toISOString());
      
      // If any error occurs here, all changes are rolled back
      if (Math.random() > 0.5) {
        throw new Error('Simulated error');
      }
      
      dbOperations.setSetting('sync_status', 'complete');
      return { success: true };
    });
    
    console.log('Transaction completed:', result);
  } catch (error) {
    console.error('Transaction failed:', error);
    // Database is unchanged due to rollback
  }
}

/**
 * Example 4: Custom Table Creation
 * Add your own tables for app-specific data
 */
export function exampleCustomTable() {
  // Create a custom table
  db.exec(`
    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Insert data
  const insertStmt = db.prepare(`
    INSERT INTO todos (title, completed) 
    VALUES (?, ?)
  `);
  
  insertStmt.run('Learn Electron', 1);
  insertStmt.run('Build awesome app', 0);

  // Query data
  const todos = db.prepare('SELECT * FROM todos').all();
  console.log('Todos:', todos);

  // Update data
  const updateStmt = db.prepare(`
    UPDATE todos SET completed = ? WHERE id = ?
  `);
  updateStmt.run(1, 2);

  // Delete data
  const deleteStmt = db.prepare('DELETE FROM todos WHERE completed = ?');
  deleteStmt.run(1);
}

/**
 * Example 5: Complex Queries with Joins
 */
export function exampleComplexQuery() {
  // Create a related table
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      title TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );
  `);

  // Insert sample data
  const projectStmt = db.prepare('INSERT INTO projects (name) VALUES (?)');
  const projectId = projectStmt.run('My Project').lastInsertRowid;

  const taskStmt = db.prepare('INSERT INTO tasks (project_id, title) VALUES (?, ?)');
  taskStmt.run(projectId, 'Task 1');
  taskStmt.run(projectId, 'Task 2');

  // Join query
  const results = db.prepare(`
    SELECT 
      p.name as project_name,
      t.title as task_title
    FROM projects p
    INNER JOIN tasks t ON t.project_id = p.id
    WHERE p.id = ?
  `).all(projectId);

  console.log('Project tasks:', results);
}

/**
 * Example 6: Database Statistics and Maintenance
 */
export function exampleMaintenance() {
  // Get statistics
  const stats = dbOperations.getStats();
  console.log('Database stats:', stats);

  // Get database file size
  const dbInfo = db.prepare("SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()").get() as { size: number };
  console.log('Database size:', (dbInfo.size / 1024).toFixed(2), 'KB');

  // Vacuum database (reclaim space)
  db.exec('VACUUM');

  // Analyze database (update statistics for query optimizer)
  db.exec('ANALYZE');
}

/**
 * Run all examples
 * Call this from main.ts to test the database
 */
export function runAllExamples() {
  console.log('\n=== Running Database Examples ===\n');
  
  console.log('1. Basic Settings:');
  exampleBasicSettings();
  
  console.log('\n2. User Preferences:');
  exampleUserPreferences();
  
  console.log('\n3. Transactions:');
  exampleTransaction();
  
  console.log('\n4. Custom Table:');
  exampleCustomTable();
  
  console.log('\n5. Complex Query:');
  exampleComplexQuery();
  
  console.log('\n6. Maintenance:');
  exampleMaintenance();
  
  console.log('\n=== Examples Complete ===\n');
}

// Uncomment to run examples on app start:
// import { runAllExamples } from './database-example';
// app.whenReady().then(() => {
//   initializeDatabase();
//   runAllExamples(); // Run examples
//   createWindow();
// });


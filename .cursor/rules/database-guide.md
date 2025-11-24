# Database Guide - SQLite with better-sqlite3

## Overview

This boilerplate includes SQLite database support using `better-sqlite3`, providing a robust, embedded database for local application data storage.

## Why SQLite?

- ✅ **No server required** - Database embedded in your app
- ✅ **Single file** - Easy backups and migrations
- ✅ **Fast** - Synchronous API, no network overhead
- ✅ **Reliable** - Battle-tested, used by millions of apps
- ✅ **Full SQL** - Complete SQL support with transactions
- ✅ **Cross-platform** - Works on Windows, macOS, Linux

## Database Location

### Windows 11 (Primary Target)
```
C:\Users\<username>\AppData\Roaming\electron-vite-react-boilerplate\app-database.db
```

### Development
The database is automatically created in the user's app data folder when the app first runs.

### Access Path Programmatically
```typescript
import { getDatabasePath } from './database';
console.log(getDatabasePath());
```

## File Structure

```
src/main/
├── database.ts          # Database initialization and connection
├── db-operations.ts     # CRUD operations and queries
└── main.ts             # Integration (initialize/close)
```

## Basic Usage

### 1. Database is Automatically Initialized

The database is initialized when the app starts:

```typescript
// In main.ts
app.whenReady().then(() => {
  initializeDatabase(); // Creates tables if they don't exist
  createWindow();
});
```

### 2. Using Database Operations

Import and use the pre-built operations:

```typescript
import { dbOperations } from './db-operations';

// Set a setting
dbOperations.setSetting('theme', 'dark');

// Get a setting
const theme = dbOperations.getSetting('theme');
console.log(theme?.value); // 'dark'

// Get all settings
const allSettings = dbOperations.getAllSettings();
```

### 3. Direct Database Access

For custom queries, import the database connection:

```typescript
import { db } from './database';

// Simple query
const result = db.prepare('SELECT * FROM app_settings').all();

// Parameterized query (prevents SQL injection)
const stmt = db.prepare('SELECT * FROM app_settings WHERE key = ?');
const setting = stmt.get('theme');
```

## Schema

### Default Tables

#### app_settings
```sql
CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Use for:** App-wide configuration, feature flags, last sync time, etc.

#### user_preferences
```sql
CREATE TABLE user_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  preference_key TEXT NOT NULL,
  preference_value TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(category, preference_key)
);
```

**Use for:** User-specific settings organized by category (UI, notifications, etc.)

## Common Patterns

### 1. Simple CRUD Operations

```typescript
// Create/Update
dbOperations.setSetting('last_opened', new Date().toISOString());

// Read
const lastOpened = dbOperations.getSetting('last_opened');

// Delete
dbOperations.deleteSetting('last_opened');
```

### 2. Transactions

Use transactions when multiple operations must succeed or fail together:

```typescript
const result = dbOperations.transaction(() => {
  dbOperations.setSetting('sync_status', 'in_progress');
  dbOperations.setPreference('ui', 'theme', 'dark');
  dbOperations.setPreference('ui', 'language', 'en');
  
  // If any operation fails, all are rolled back
  return { success: true };
});
```

### 3. Complex Queries

```typescript
import { db } from './database';

// Join queries
const stmt = db.prepare(`
  SELECT s.*, p.preference_value 
  FROM app_settings s
  LEFT JOIN user_preferences p ON p.category = 'sync'
  WHERE s.key LIKE ?
`);
const results = stmt.all('%sync%');

// Aggregations
const stats = db.prepare(`
  SELECT 
    category, 
    COUNT(*) as count 
  FROM user_preferences 
  GROUP BY category
`).all();
```

## Security Considerations

### ✅ Best Practices (Already Implemented)

1. **Main Process Only**
   - Database runs in main process (secure)
   - No direct renderer access to database
   - Use IPC for renderer-to-database communication

2. **Prepared Statements**
   - All operations use parameterized queries
   - Prevents SQL injection attacks

3. **Context Isolation**
   - Renderer cannot directly access database
   - Must go through controlled IPC channels

### ⚠️ Important Notes

- **Never expose** direct database access to renderer
- **Always validate** data before database operations
- **Use IPC handlers** to expose specific operations to renderer

## Adding IPC Support (Optional)

To allow renderer process to access database:

### 1. Add IPC Handlers in main.ts

```typescript
import { ipcMain } from 'electron';
import { dbOperations } from './db-operations';

// Register IPC handlers
ipcMain.handle('db:getSetting', async (event, key: string) => {
  return dbOperations.getSetting(key);
});

ipcMain.handle('db:setSetting', async (event, key: string, value: string) => {
  return dbOperations.setSetting(key, value);
});
```

### 2. Update Preload Script

```typescript
// In src/preload/preload.ts
contextBridge.exposeInMainWorld('database', {
  getSetting: (key: string) => ipcRenderer.invoke('db:getSetting', key),
  setSetting: (key: string, value: string) => 
    ipcRenderer.invoke('db:setSetting', key, value),
});
```

### 3. Use in Renderer

```typescript
// In React component
const theme = await window.database.getSetting('theme');
await window.database.setSetting('theme', 'dark');
```

## Migrations (Future Enhancement)

For schema changes, consider adding a migration system:

```typescript
// Example migration structure
const migrations = [
  {
    version: 1,
    up: (db) => {
      db.exec(`CREATE TABLE new_table (...)`);
    }
  },
  {
    version: 2,
    up: (db) => {
      db.exec(`ALTER TABLE existing_table ADD COLUMN new_col TEXT`);
    }
  }
];
```

## Backup and Export

### Manual Backup

```typescript
import fs from 'fs';
import { getDatabasePath } from './database';

// Copy database file
const dbPath = getDatabasePath();
const backupPath = `${dbPath}.backup`;
fs.copyFileSync(dbPath, backupPath);
```

### Export to JSON

```typescript
const allSettings = dbOperations.getAllSettings();
fs.writeFileSync('backup.json', JSON.stringify(allSettings, null, 2));
```

## Performance Tips

1. **Use Prepared Statements**
   - Reuse statements for repeated queries
   - Better performance and security

2. **Use Transactions**
   - Batch multiple operations
   - Much faster than individual operations

3. **Index Frequently Queried Columns**
   ```sql
   CREATE INDEX idx_preferences_category ON user_preferences(category);
   ```

4. **WAL Mode (Already Enabled)**
   - Better concurrency
   - Faster writes

## Debugging

### View Database Contents

Use a SQLite viewer:
- **DB Browser for SQLite** (free, cross-platform)
- **SQLiteStudio** (free, portable)
- VS Code extension: **SQLite Viewer**

### Enable Query Logging

Already enabled in development mode:

```typescript
// In database.ts
export const db = new Database(dbPath, { 
  verbose: process.env.NODE_ENV === 'development' ? console.log : undefined
});
```

## Common Issues

### Database Locked
**Cause:** Another process has database open  
**Fix:** Ensure database is closed properly (`closeDatabase()`)

### Permission Errors
**Cause:** Can't write to app data folder  
**Fix:** Check folder permissions, run app as user (not admin)

### Missing Tables
**Cause:** `initializeDatabase()` not called  
**Fix:** Verify it's called in `app.whenReady()`

## Future Enhancements

Consider adding:
- [ ] Migration system for schema changes
- [ ] TypeScript ORM (Drizzle, Kysely)
- [ ] Automatic backups
- [ ] Data encryption (SQLCipher)
- [ ] Import/Export functionality
- [ ] Database vacuum/optimize on startup

## Resources

- [better-sqlite3 Documentation](https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md)
- [SQLite SQL Syntax](https://www.sqlite.org/lang.html)
- [SQLite Best Practices](https://www.sqlite.org/bestpractice.html)

---

**Last Updated:** November 24, 2025


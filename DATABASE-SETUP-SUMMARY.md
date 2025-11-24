# Database Setup Summary

## ✅ Installation Complete

SQLite database support has been successfully added to the Electron-Vite-React boilerplate using **better-sqlite3**.

---

## What Was Added

### Dependencies
- `better-sqlite3@12.4.6` - SQLite database library
- `@types/better-sqlite3@7.6.13` - TypeScript definitions

### Files Created

#### Core Database Files
1. **`src/main/database.ts`**
   - Database connection and initialization
   - Schema creation
   - Graceful shutdown handling
   - Database path utilities

2. **`src/main/db-operations.ts`**
   - Pre-built CRUD operations
   - Settings management functions
   - User preferences management
   - Transaction support
   - Database statistics

3. **`src/main/database-example.ts`**
   - Complete usage examples
   - Custom table creation
   - Complex queries
   - Transaction examples
   - Maintenance operations

#### Documentation
4. **`.cursor/rules/database-guide.md`**
   - Comprehensive database guide
   - Usage patterns and examples
   - Security considerations
   - IPC integration guide
   - Troubleshooting tips

### Files Modified

1. **`src/main/main.ts`**
   - Added database imports
   - Initialize database on app ready
   - Close database on app quit

2. **`.gitignore`**
   - Added `*.db`, `*.db-shm`, `*.db-wal` patterns

3. **`README.md`**
   - Added database feature
   - Added database quick start section

4. **`.cursor/rules/electron-vite-react-rules.md`**
   - Added database section with security notes

5. **`.cursor/rules/QUICK-REFERENCE.md`**
   - Added database usage to common tasks

6. **`CHANGELOG.md`**
   - Documented version 1.1.0 with database additions

---

## Database Schema

### Table: app_settings
```sql
CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose:** Store application-wide settings and configuration

### Table: user_preferences
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

**Purpose:** Store user preferences organized by category

---

## Database Location

### Windows 11 (Primary Target)
```
C:\Users\<username>\AppData\Roaming\electron-vite-react-boilerplate\app-database.db
```

The database is automatically created in the proper Windows user data folder when the app first runs.

---

## Quick Start Usage

### Basic Operations

```typescript
import { dbOperations } from './db-operations';

// Set a setting
dbOperations.setSetting('theme', 'dark');

// Get a setting
const theme = dbOperations.getSetting('theme');
console.log(theme?.value); // 'dark'

// Set a preference
dbOperations.setPreference('ui', 'language', 'en');

// Get preferences by category
const uiPrefs = dbOperations.getPreferencesByCategory('ui');
```

### Using Transactions

```typescript
const result = dbOperations.transaction(() => {
  dbOperations.setSetting('sync_status', 'in_progress');
  dbOperations.setPreference('sync', 'last_sync', new Date().toISOString());
  return { success: true };
});
```

### Direct Database Access

```typescript
import { db } from './database';

// Custom query
const results = db.prepare('SELECT * FROM app_settings WHERE key LIKE ?').all('%theme%');
```

---

## Security Features

✅ **Main Process Only**
- Database runs exclusively in main process
- No direct renderer access (secure by default)
- Use IPC handlers to expose specific operations to renderer

✅ **Prepared Statements**
- All operations use parameterized queries
- Prevents SQL injection attacks

✅ **Context Isolation**
- Renderer cannot directly access database
- Must go through controlled IPC channels (when implemented)

---

## Integration Points

### App Lifecycle

```typescript
// src/main/main.ts

import { initializeDatabase, closeDatabase } from './database';

// On app ready
app.whenReady().then(() => {
  initializeDatabase(); // ✅ Creates tables if needed
  createWindow();
});

// Before quit
app.on('before-quit', () => {
  closeDatabase(); // ✅ Graceful shutdown
});
```

---

## Next Steps (Optional)

### Add IPC Support for Renderer Access

1. **Add IPC handlers in main.ts:**
```typescript
import { ipcMain } from 'electron';
import { dbOperations } from './db-operations';

ipcMain.handle('db:getSetting', async (event, key: string) => {
  return dbOperations.getSetting(key);
});

ipcMain.handle('db:setSetting', async (event, key: string, value: string) => {
  return dbOperations.setSetting(key, value);
});
```

2. **Update preload script:**
```typescript
// Add to src/preload/preload.ts
contextBridge.exposeInMainWorld('database', {
  getSetting: (key: string) => ipcRenderer.invoke('db:getSetting', key),
  setSetting: (key: string, value: string) => 
    ipcRenderer.invoke('db:setSetting', key, value),
});
```

3. **Use in renderer:**
```typescript
// In React components
const theme = await window.database.getSetting('theme');
await window.database.setSetting('theme', 'dark');
```

### Add Migration System

Consider adding a migration system for schema version management as your app evolves.

### Add ORM/Query Builder

For type-safe queries, consider:
- **Drizzle ORM** - Lightweight, TypeScript-first
- **Kysely** - Type-safe SQL query builder

---

## Testing the Database

### Option 1: Run Examples

Uncomment in `src/main/main.ts`:
```typescript
import { runAllExamples } from './database-example';

app.whenReady().then(() => {
  initializeDatabase();
  runAllExamples(); // Run all database examples
  createWindow();
});
```

### Option 2: View with SQLite Browser

1. Install [DB Browser for SQLite](https://sqlitebrowser.org/)
2. Open: `%APPDATA%\electron-vite-react-boilerplate\app-database.db`
3. Browse tables and data

### Option 3: Check in DevTools

Run the app and check the terminal output for:
```
✅ Database initialized at: C:\Users\...\app-database.db
```

---

## Configuration

### WAL Mode (Enabled)
- Better concurrency
- Faster writes
- Creates `.db-shm` and `.db-wal` files (temporary)

### Foreign Keys (Enabled)
- Enforces referential integrity
- Prevents orphaned records

### Verbose Logging (Development Only)
- SQL queries logged in development mode
- Disabled in production for performance

---

## Maintenance

### Backup Database

```typescript
import fs from 'fs';
import { getDatabasePath } from './database';

const dbPath = getDatabasePath();
fs.copyFileSync(dbPath, `${dbPath}.backup`);
```

### Optimize Database

```typescript
import { db } from './database';

db.exec('VACUUM');   // Reclaim unused space
db.exec('ANALYZE');  // Update query optimizer statistics
```

---

## Documentation Reference

For complete documentation, see:
- **Quick Reference:** `.cursor/rules/QUICK-REFERENCE.md`
- **Full Guide:** `.cursor/rules/database-guide.md`
- **Code Examples:** `src/main/database-example.ts`
- **Main README:** `README.md` (Database section)

---

## Troubleshooting

### Database Locked Error
**Cause:** Another process has the database open  
**Solution:** Ensure `closeDatabase()` is called before app quits

### Permission Errors
**Cause:** Cannot write to app data folder  
**Solution:** Check folder permissions, ensure running as user

### Missing Tables
**Cause:** `initializeDatabase()` not called  
**Solution:** Verify it's called in `app.whenReady()`

---

## Status

✅ **Fully Functional**
- Database initializes on app start
- Tables created automatically
- CRUD operations ready to use
- Graceful shutdown configured
- Documentation complete

🎯 **Ready for Use**
- Start using immediately with `dbOperations`
- Extend with custom tables as needed
- Add IPC support when renderer access required

---

**Last Updated:** November 24, 2025  
**Version:** 1.1.0


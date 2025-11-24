# New Project Setup Guide (For LLM/AI Assistants)

> **Purpose:** This guide is for AI assistants helping users set up a new Electron application from this boilerplate.
> When a user clones this repo for a new project, reference this document for the complete setup process.

## 🎯 Overview

This is a production-ready Electron-Vite-React boilerplate with SQLite database support, designed for Windows 11 applications. When setting up a new project from this template, follow these steps carefully.

## 📋 Step-by-Step Setup Process

### Step 1: Clone and Initialize

```powershell
# User will typically do this:
git clone https://github.com/GravitixAI/electron-vite-react-boilerplate.git new-project-name
cd new-project-name

# Remove original git history
Remove-Item -Recurse -Force .git

# Initialize new repository
git init
```

### Step 2: Update Project Identity (REQUIRED)

**Critical Files to Update:**

#### `package.json`
Update these mandatory fields:
- `"name"`: New app name (lowercase, hyphenated) - **affects database location**
- `"version"`: Reset to `"0.1.0"` or `"1.0.0"`
- `"description"`: Your app's description
- `"author"`: User's name and email
- `"keywords"`: Relevant keywords for the app

**Example:**
```json
{
  "name": "my-awesome-app",
  "version": "0.1.0",
  "description": "An awesome desktop application",
  "author": "John Doe <john@example.com>",
  "keywords": ["electron", "desktop", "windows", "awesome"]
}
```

#### `electron-builder.json`
Update branding configuration:
- `"appId"`: Unique identifier (reverse domain notation)
- `"productName"`: Display name for the application

**Example:**
```json
{
  "appId": "com.company.myawesomeapp",
  "productName": "My Awesome App"
}
```

### Step 3: Install Dependencies

```powershell
pnpm install
```

**What happens during install:**
1. ✅ All npm packages are installed
2. ✅ `electron-builder install-app-deps` runs automatically
3. ✅ `better-sqlite3` is rebuilt for Electron runtime
4. ⏱️ This may take 2-3 minutes on first install

**If installation fails:**
```powershell
# Clean and retry
Remove-Item -Recurse -Force node_modules
pnpm install --force
```

### Step 4: Database Customization

**Important:** The database file location is automatically determined by the app name in `package.json`:

```
Windows: C:\Users\{username}\AppData\Roaming\{app-name}\app-database.db
```

#### If keeping the database:

**Edit `src/main/database.ts` - `initializeDatabase()` function:**

Replace the demo tables with your custom schema:

```typescript
export function initializeDatabase() {
  // Example: Replace with your app's tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS app_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  console.log('✅ Database initialized at:', dbPath);
}
```

**Edit `src/main/db-operations.ts`:**

Add custom CRUD operations for your tables:

```typescript
export const dbOperations = {
  // Add your custom operations
  createUser: (username: string, email: string) => {
    const stmt = db.prepare('INSERT INTO users (username, email) VALUES (?, ?)');
    return stmt.run(username, email);
  },
  
  getUserById: (id: number) => {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id);
  },
  
  // ... more operations
};
```

**Update IPC handlers in `src/main/ipc-handlers.ts`:**

```typescript
export function registerDatabaseHandlers() {
  ipcMain.handle('database:createUser', async (event, username: string, email: string) => {
    return dbOperations.createUser(username, email);
  });
  
  ipcMain.handle('database:getUserById', async (event, id: number) => {
    return dbOperations.getUserById(id);
  });
  
  // ... more handlers
}
```

**Expose new methods in `src/preload/preload.ts`:**

```typescript
contextBridge.exposeInMainWorld('database', {
  createUser: (username: string, email: string) => 
    ipcRenderer.invoke('database:createUser', username, email),
  getUserById: (id: number) => 
    ipcRenderer.invoke('database:getUserById', id),
  // ... expose all your methods
});
```

#### If removing the database:

1. Remove from `package.json`:
   - `"better-sqlite3"` from dependencies
   - `"@types/better-sqlite3"` from devDependencies
   - Remove `&& electron-rebuild -f -w better-sqlite3` from postinstall script

2. Delete files:
   ```powershell
   Remove-Item src/main/database.ts
   Remove-Item src/main/db-operations.ts
   Remove-Item src/main/ipc-handlers.ts
   Remove-Item src/main/database-example.ts
   ```

3. Update `src/main/main.ts`:
   - Remove database imports
   - Remove `initializeDatabase()` call
   - Remove `registerDatabaseHandlers()` call
   - Remove `closeDatabase()` call

4. Update `src/preload/preload.ts`:
   - Remove database API exposure

5. Remove `*.db*` from `.gitignore` if desired

### Step 5: Remove Demo UI (Optional)

The boilerplate includes a `DatabaseDemo` component for testing. For a fresh start:

**Edit `src/renderer/src/App.tsx`:**

```typescript
import { ExampleComponent } from './components/ExampleComponent';

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <h1 className="text-4xl font-bold">Welcome to Your New App</h1>
      <ExampleComponent />
      {/* Build your UI here */}
    </div>
  );
}

export default App;
```

**Delete demo files:**
```powershell
Remove-Item src/renderer/src/components/DatabaseDemo.tsx
Remove-Item src/renderer/src/components/DatabaseTest.tsx
```

### Step 6: Customize Electron Window

**Edit `src/main/main.ts` - `createWindow()` function:**

```typescript
const createWindow = (): void => {
  mainWindow = new BrowserWindow({
    width: 1200,              // Adjust dimensions
    height: 800,
    title: 'Your App Name',   // Window title
    
    // Optional customizations:
    // minWidth: 800,
    // minHeight: 600,
    // resizable: false,
    // frame: false,           // Custom title bar
    // transparent: true,      // Transparent window
    // backgroundColor: '#1e1e1e',
    
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,         // Required for IPC with contextBridge
    },
  });
  
  // ... rest of function
};
```

### Step 7: Add Custom App Icon (For Production)

1. Create a 256x256 ICO file for Windows
2. Place it at `build/icon.ico`
3. Verify `electron-builder.json` references it:

```json
{
  "win": {
    "icon": "build/icon.ico"
  }
}
```

### Step 8: Update Documentation

**`README.md`:**
- Update project name and description
- Update feature list
- Add app-specific documentation
- Update screenshots/examples

**`CHANGELOG.md`:**
- Clear or reset for new project
- Start with version 0.1.0 or 1.0.0

**`.cursor/rules/electron-vite-react-rules.md`:**
- Add app-specific rules if needed
- Update project overview section

### Step 9: Test the Application

```powershell
pnpm dev
```

**Verify checklist:**
- [ ] Electron window opens without errors
- [ ] UI renders correctly with your changes
- [ ] Database initializes (if kept) - check AppData folder
- [ ] Hot reload works when editing React components
- [ ] No console errors in DevTools
- [ ] IPC communication works (if testing database operations)

**Common issues:**
- If window doesn't open: Check `dist/main/main.js` exists after build
- If CSS errors: Ensure `src/renderer/src/index.css` uses `@import "tailwindcss";`
- If database errors: Verify `better-sqlite3` rebuilt correctly

### Step 10: Initialize Git Repository

```powershell
# Add all files
git add .

# Initial commit
git commit -m "Initial commit: [App Name] based on electron-vite-react-boilerplate"

# Connect to remote (if ready)
git remote add origin https://github.com/username/new-repo.git
git branch -M main
git push -u origin main
```

---

## 🔧 Configuration Files (Keep As-Is Initially)

These files are pre-configured and should **not** be modified unless there's a specific need:

### `.npmrc`
```
shamefully-hoist=true
public-hoist-pattern[]=*
enable-pre-post-scripts=true
```
**Why:** Required for pnpm to work correctly with Electron's native modules and build scripts.

### `vite.config.ts`
**Already configured for:**
- Correct path resolution for main/preload/renderer
- Externalization of `better-sqlite3` (prevents bundling native modules)
- Proper build output directories

**Only modify if:** Adding new native modules or changing project structure.

### `postcss.config.js`
```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```
**Why:** Tailwind CSS v4 requires `@tailwindcss/postcss` instead of `tailwindcss` plugin.

### `tailwind.config.js`
**Pre-configured with:**
- shadcn/ui paths
- Correct content paths for all source files

**Modify if:** Adding new component directories or changing structure.

### `tsconfig.json`
**Pre-configured with:**
- Strict type checking
- Path aliases (`@/` → `src/renderer/src/`)
- Proper module resolution

### `components.json`
**shadcn/ui configuration**
- Already set up for the correct paths
- Style: New York
- Color: Slate

---

## 🗄️ Database Architecture (If Using SQLite)

### Security Model
- ✅ Database runs in **main process only**
- ✅ Renderer communicates via **IPC handlers** (secure)
- ✅ All queries use **prepared statements** (SQL injection protected)
- ❌ **Never** expose `db` object directly to renderer

### File Location Logic
```typescript
// In src/main/database.ts
const userDataPath = app.getPath('userData');
// Returns: C:\Users\{username}\AppData\Roaming\{app-name}\

const dbPath = path.join(userDataPath, 'app-database.db');
```

The `app-name` comes from `package.json` → `"name"` field.

### Data Flow
```
Renderer (React)
  ↓ window.database.someMethod()
Preload (contextBridge)
  ↓ ipcRenderer.invoke('database:someMethod')
Main Process (IPC Handler)
  ↓ dbOperations.someMethod()
Database (better-sqlite3)
```

### Transaction Example
```typescript
// In db-operations.ts
const transaction = db.transaction((userId: number, data: any) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) throw new Error('User not found');
  
  db.prepare('UPDATE users SET data = ? WHERE id = ?').run(data, userId);
  db.prepare('INSERT INTO audit_log (user_id, action) VALUES (?, ?)').run(userId, 'updated');
});

// Use it
transaction(123, { some: 'data' });
```

---

## ⚠️ Critical Pitfalls to Avoid

### 1. **Don't Bundle Native Modules**
❌ **Wrong:** Letting Vite bundle `better-sqlite3`
✅ **Correct:** Already externalized in `vite.config.ts`:
```typescript
rollupOptions: {
  external: ['electron', 'better-sqlite3'],
}
```

### 2. **Sandbox Mode for IPC**
The boilerplate uses `sandbox: false` because:
- `contextBridge` requires it for IPC communication
- Context isolation is still enabled (secure)
- Node integration is disabled (secure)
- Only whitelisted IPC channels work

### 3. **Path Resolution in Main Process**
✅ **Correct way (already implemented):**
```typescript
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```

❌ **Don't use:** `__dirname` directly (not available in ES modules)

### 4. **Tailwind CSS v4 Syntax**
✅ **Correct (`src/renderer/src/index.css`):**
```css
@import "tailwindcss";
```

❌ **Old syntax (v3):**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 5. **Hot Reload During Database Changes**
When modifying database schema:
1. Close the Electron window
2. Delete the database file from AppData
3. Restart `pnpm dev`

Otherwise, old schema persists and migrations may be needed.

---

## 📦 Adding New shadcn/ui Components

```powershell
# Install a component (e.g., card)
pnpm dlx shadcn@latest add card

# Multiple components
pnpm dlx shadcn@latest add card dialog alert
```

Components are added to: `src/renderer/src/components/ui/`

---

## 🧪 Testing Checklist Before Development

Run through these tests after setup:

```powershell
# 1. Dev server starts
pnpm dev
# ✅ Electron window opens
# ✅ No console errors
# ✅ DevTools accessible (F12)

# 2. Hot reload works
# Edit App.tsx → Save → Window updates automatically

# 3. Database works (if kept)
# Use the DatabaseDemo component or check:
Get-ChildItem $env:APPDATA\{your-app-name}\
# ✅ app-database.db exists

# 4. Build works
pnpm build
# ✅ dist/ folder created
# ✅ No TypeScript errors

# 5. Package works (optional, slower)
pnpm package
# ✅ Installer created in release/
```

---

## 📚 Quick Reference for Common Tasks

### Add a New IPC Channel
1. Create handler in `src/main/ipc-handlers.ts` or `main.ts`
2. Expose in `src/preload/preload.ts`
3. Add TypeScript types if needed
4. Use in renderer: `window.yourApi.method()`

### Add Environment Variables
1. Create `.env` (copy from `.env.example`)
2. Access in Vite: `import.meta.env.VITE_YOUR_VAR`
3. Access in main: `process.env.YOUR_VAR`

### Debug Main Process
In `src/main/main.ts`:
```typescript
if (process.env.VITE_DEV_SERVER_URL) {
  mainWindow.webContents.openDevTools();
  // Main process logs appear in terminal, not DevTools
}
```

### Debug Renderer Process
- Press F12 in Electron window
- Console logs appear in DevTools

---

## 🎯 Final Checklist for LLM Assistants

When helping a user set up from this boilerplate, ensure:

- [ ] `package.json` name, version, description, author updated
- [ ] `electron-builder.json` appId and productName updated
- [ ] `pnpm install` completed successfully
- [ ] Database schema customized or removed entirely
- [ ] Demo components removed or kept based on user preference
- [ ] Window configuration customized
- [ ] App tested with `pnpm dev`
- [ ] No console errors or warnings
- [ ] User understands database file location
- [ ] Git initialized and first commit made
- [ ] Documentation updated for the new project

---

## 🆘 Emergency Troubleshooting

### "Electron binary not found"
```powershell
node node_modules\electron\install.js
pnpm dev
```

### "Cannot find module better-sqlite3"
```powershell
pnpm electron-rebuild -f -w better-sqlite3
```

### "CSS compilation error"
Check `src/renderer/src/index.css` uses:
```css
@import "tailwindcss";
```

### Complete Reset
```powershell
Remove-Item -Recurse -Force dist, node_modules
pnpm install
pnpm dev
```

---

**Last Updated:** Initial version with database demo
**Boilerplate Version:** 1.0.0


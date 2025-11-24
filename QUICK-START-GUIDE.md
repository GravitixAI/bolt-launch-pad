# Bolt Launch Pad - Quick Start Guide

## Getting Started (5 Minutes)

### 1. Install Dependencies
```powershell
pnpm install
```

### 2. Start Development Server
```powershell
pnpm dev
```

The application will launch automatically.

## First Time Setup

### Initial Login

1. **Skip Azure AD for Now** (Optional for testing)
   - The login screen will appear
   - For local testing, you can modify `src/renderer/src/App.tsx` to bypass auth temporarily
   - Or proceed with Azure AD setup below

### Azure AD Configuration (For Team Features)

**Option A: Quick Test (Skip Auth)**
Temporarily bypass authentication for local development:

```typescript
// In src/renderer/src/App.tsx
// Comment out the auth check temporarily:
// if (!isAuthenticated) {
//   return <LoginScreen />;
// }
```

**Option B: Full Azure AD Setup**
1. Go to Azure Portal → App Registrations
2. Create new registration
   - Name: "Bolt Launch Pad"
   - Redirect URI: `http://localhost`
3. Copy:
   - Application (client) ID
   - Directory (tenant) ID
   - Authority: `https://login.microsoftonline.com/{tenant-id}`
4. In the app:
   - Go to Settings view
   - Click "Configure Azure AD"
   - Enter credentials

### MySQL Configuration (For Team Sync)

**Option A: Skip for Now**
- App works without MySQL (local-only mode)
- All items remain personal until MySQL is configured

**Option B: Set Up MySQL**

1. **Prepare MySQL Database**
```sql
CREATE DATABASE bolt_launch_pad_dev;
CREATE DATABASE bolt_launch_pad_prod;
```

2. **Initialize Tables**
In the app console (F12):
```javascript
await window.mysql.initialize({
  host: 'localhost',
  port: 3306,
  user: 'your_user',
  password: 'your_password',
  database: 'bolt_launch_pad_dev'
}, 'dev');

await window.mysql.initializeTables();
```

3. **Save Configuration**
- Go to Settings
- Configure connection details
- Test connection

## Quick Feature Tour

### 1. Bookmarks
- Click "Bookmarks" in sidebar
- Click "Add Bookmark" (note: dialog is placeholder)
- Test search by typing in search bar

### 2. Executables
- Click "Executables" in sidebar
- Add shortcuts to applications
- Launch with parameters

### 3. Scripts
- Click "Scripts" in sidebar
- Store PowerShell/CMD scripts
- Execute or copy to clipboard

### 4. Settings
- Toggle Dev/Prod environments
- Configure MySQL
- Test sync

## Development Workflow

### Hot Reload
- Changes to renderer (React) → automatic reload
- Changes to main process → restart required (Ctrl+C, `pnpm dev`)

### View Console Logs
- Renderer: F12 → Console tab
- Main process: Terminal where `pnpm dev` is running

### Test Database
```javascript
// In browser console (F12)
const stats = await window.database.getStats();
console.log(stats);

const bookmarks = await window.bookmarks.getAll();
console.log(bookmarks);
```

## Common Commands

```powershell
# Development
pnpm dev                    # Start dev server

# Building
pnpm build                  # Build for production
pnpm package               # Create installer
pnpm package:portable      # Create portable .exe

# Cleanup
pnpm clean                 # Remove dist & release folders
Remove-Item node_modules -Recurse -Force
pnpm install              # Fresh install

# Native modules
pnpm rebuild              # Rebuild better-sqlite3, sharp
```

## Testing Features

### Test Bookmarks
```javascript
// Create a bookmark (console)
await window.bookmarks.create({
  title: 'Google',
  url: 'https://www.google.com',
  favicon: null,
  category: 'Search',
  is_team_level: 0,
  is_personal: 1,
  created_by: 'test@example.com',
  updated_by: 'test@example.com'
});

// Get all bookmarks
const bookmarks = await window.bookmarks.getAll();
console.log(bookmarks);
```

### Test Executables
```javascript
// Create an executable shortcut
await window.executables.create({
  title: 'Notepad',
  executable_path: 'C:\\Windows\\System32\\notepad.exe',
  parameters: '',
  icon: null,
  category: 'Tools',
  is_team_level: 0,
  is_personal: 1,
  created_by: 'test@example.com',
  updated_by: 'test@example.com'
});
```

### Test Scripts
```javascript
// Create a script
await window.scripts.create({
  title: 'Hello World',
  script_content: 'Write-Host "Hello, World!"',
  script_type: 'powershell',
  category: 'Demo',
  is_team_level: 0,
  is_personal: 1,
  created_by: 'test@example.com',
  updated_by: 'test@example.com'
});

// Execute a script
const result = await window.scripts.execute('Write-Host "Hello"', 'powershell');
console.log(result);
```

## Troubleshooting

### App Won't Start
```powershell
# Clean and reinstall
pnpm clean
Remove-Item node_modules -Recurse -Force
pnpm install
pnpm dev
```

### White Screen
- Check browser console (F12) for errors
- Check terminal for main process errors
- Verify all dependencies installed

### Database Errors
```powershell
# Reset database
Remove-Item $env:APPDATA\bolt-launch-pad\app-database.db
# Restart app
```

### Icon Extraction Not Working
```powershell
# Rebuild sharp
pnpm rebuild
```

## Next Steps

1. **Add Full CRUD Dialogs**
   - Create modal forms for add/edit operations
   - Currently shows toast placeholders

2. **Enable Team Features**
   - Set up Azure AD
   - Configure MySQL
   - Test team-level promotion and sync

3. **Customize UI**
   - Modify colors in `src/renderer/src/index.css`
   - Add custom components
   - Update branding

4. **Add More Features**
   - See `IMPLEMENTATION-SUMMARY.md` for enhancement ideas
   - Follow existing patterns for new features

## Resources

- **Full Documentation**: See `IMPLEMENTATION-SUMMARY.md`
- **Plan**: See `bolt-launch-pad-implementation.plan.md`
- **Boilerplate Docs**: See `.cursor/rules/` folder

## Getting Help

1. Check console (F12) for errors
2. Check terminal for main process errors
3. Review `IMPLEMENTATION-SUMMARY.md`
4. Check boilerplate troubleshooting docs

---

**Ready to build!** 🚀


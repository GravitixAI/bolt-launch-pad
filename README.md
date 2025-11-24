# Bolt Launch Pad

A modern desktop application built with Electron, Vite, React, TypeScript, Tailwind CSS, and shadcn/ui for Windows 11.

## 🚀 Features

- ⚡ **Vite** - Lightning-fast development with Hot Module Replacement (HMR)
- ⚛️ **React 19** - Latest React with TypeScript support
- 🖥️ **Electron** - Build native desktop applications for Windows 11
- 🎨 **Tailwind CSS** - Utility-first CSS framework
- 🎯 **shadcn/ui** - Beautiful, accessible component library
- 📦 **pnpm** - Fast, disk space efficient package manager
- 🔒 **Security** - Context isolation and sandboxed renderer process
- 🏗️ **TypeScript** - Full type safety across the stack
- 💾 **SQLite Database** - Embedded database with better-sqlite3 for local data storage

## 📋 Prerequisites

- Node.js 18+ installed
- pnpm installed globally (`npm install -g pnpm`)
- Windows 11 (target platform)

## 🛠️ Getting Started

### Installation

```bash
# Install dependencies
pnpm install
```

### Development

```bash
# Start development server with HMR
pnpm dev
```

This will start the Vite dev server and launch Electron with hot reload enabled.

### Building

```bash
# Build for production
pnpm build
```

### Packaging

```bash
# Create Windows installer (NSIS)
pnpm package

# Create portable version (no installation)
pnpm package:portable

# Create both NSIS and portable
pnpm package:all

# Build without packaging (for testing)
pnpm package:dir
```

The packaged applications will be available in the `release` directory.

**Before first packaging:**
- Add an app icon: `build/icon.ico` (required)
- Update app name in `package.json`
- Update `electron-builder.json` with your branding
- See [Code Signing Guide](.cursor/rules/CODE-SIGNING-GUIDE.md) for production releases

## 📁 Project Structure

```
bolt-launch-pad/
├── .cursor/
│   └── rules/
│       └── electron-vite-react-rules.md   # Project-specific coding rules
├── src/
│   ├── main/
│   │   └── main.ts                         # Electron main process
│   ├── preload/
│   │   └── preload.ts                      # Preload scripts for IPC
│   └── renderer/
│       ├── src/
│       │   ├── components/                 # React components
│       │   ├── lib/
│       │   │   └── utils.ts                # Utility functions (cn helper)
│       │   ├── App.tsx                     # Main App component
│       │   ├── main.tsx                    # React entry point
│       │   └── index.css                   # Tailwind CSS imports
│       └── index.html                      # HTML template
├── dist/                                    # Build output
├── release/                                 # Packaged applications
├── components.json                          # shadcn/ui configuration
├── electron-builder.json                    # Electron Builder config
├── tailwind.config.js                       # Tailwind CSS config
├── postcss.config.js                        # PostCSS config
├── tsconfig.json                            # TypeScript config
├── vite.config.ts                           # Vite config
└── package.json
```

## 🎨 Adding UI Components

This boilerplate is configured to work with shadcn/ui. To add components:

```bash
# Example: Add a button component
pnpm dlx shadcn@latest add button
```

Components will be added to `src/renderer/src/components/ui/`.

## 💾 Database (SQLite)

The boilerplate includes SQLite database support for local data storage:

### Quick Start

```typescript
// In main process (src/main/main.ts or db-operations.ts)
import { dbOperations } from './db-operations';

// Store data
dbOperations.setSetting('theme', 'dark');
dbOperations.setPreference('ui', 'language', 'en');

// Retrieve data
const theme = dbOperations.getSetting('theme');
const uiPrefs = dbOperations.getPreferencesByCategory('ui');
```

### Database Location

**Windows:** `C:\Users\<username>\AppData\Roaming\bolt-launch-pad\app-database.db`

### Features

- ✅ Embedded SQLite database (no server required)
- ✅ Automatic initialization on app start
- ✅ Pre-built CRUD operations
- ✅ Transaction support
- ✅ Secure (main process only)
- ✅ Example tables included

**Full Documentation:** See `.cursor/rules/database-guide.md`

## 🔌 IPC Communication

The boilerplate includes a secure IPC setup with context isolation:

### In Renderer Process (React):

```typescript
// Send data to main process
window.electron.send('toMain', { data: 'hello' });

// Receive data from main process
window.electron.receive('fromMain', (data) => {
  console.log(data);
});

// Invoke main process and get response
const result = await window.electron.invoke('getAppVersion');
```

### In Main Process:

Add IPC handlers in `src/main/main.ts`:

```typescript
import { ipcMain } from 'electron';

ipcMain.on('toMain', (event, data) => {
  console.log('Received from renderer:', data);
});

ipcMain.handle('getAppVersion', () => {
  return app.getVersion();
});
```

## 🔒 Security

This boilerplate follows Electron security best practices:

- ✅ Context isolation enabled
- ✅ Node integration disabled in renderer
- ✅ Controlled IPC communication through preload script
- ✅ Content Security Policy (CSP) headers
- ✅ Secure database access (main process only)
- ✅ Prepared statements (SQL injection protected)

## 🚀 Production Features

### Auto-Updates
Built-in support for automatic application updates using `electron-updater`:

```typescript
// In renderer process
window.updates.checkForUpdates();

// Listen for updates
window.updates.onUpdateAvailable((info) => {
  console.log('Update available:', info.version);
});

window.updates.onUpdateDownloaded((info) => {
  // Prompt user to restart and install
  window.updates.installUpdate();
});
```

**Configuration:** Updates are published to GitHub Releases automatically when packaging with the correct setup.

### Build Optimization
- ✅ **ASAR packaging** with maximum compression
- ✅ **Native module handling** (SQLite unpacked from ASAR)
- ✅ **Code signing ready** (see guide below)
- ✅ **Multiple installer formats** (NSIS, Portable)

### Code Signing
For production releases, code signing prevents Windows SmartScreen warnings:

📖 **See [Code Signing Guide](.cursor/rules/CODE-SIGNING-GUIDE.md)** for complete setup instructions

**Quick setup:**
1. Obtain a code signing certificate ($180-$600/year)
2. Store as `certs/certificate.pfx`
3. Set environment variable: `$env:CERTIFICATE_PASSWORD = "your-password"`
4. Uncomment signing config in `electron-builder.json`
5. Build: `pnpm package`

### App Icon
Before packaging, add your application icon:

```
build/
  └── icon.ico (256x256 or 512x512 recommended)
```

**Quick icon creation:**
1. Design your icon as PNG
2. Convert to ICO: https://convertio.co/png-ico/
3. Place in `build/icon.ico`

## 📝 Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server with hot reload |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build |
| `pnpm package` | Create Windows installer (NSIS) |
| `pnpm package:portable` | Create portable executable |
| `pnpm package:all` | Create both NSIS and portable versions |
| `pnpm package:dir` | Build unpacked directory (for testing) |
| `pnpm clean` | Clean dist and release folders |
| `pnpm rebuild` | Rebuild native modules (SQLite) |

## 🎯 Customization

### Branding

1. Update app name and metadata in `package.json`
2. Update `appId` and `productName` in `electron-builder.json`
3. Replace icon at `build/icon.ico` (256x256 recommended)

### Tailwind Theme

Customize the theme in `src/renderer/src/index.css` by modifying CSS variables.

### Window Configuration

Modify window settings in `src/main/main.ts`:

```typescript
const mainWindow = new BrowserWindow({
  width: 1200,      // Change window dimensions
  height: 800,
  // Add more options...
});
```

## 🐛 Troubleshooting

### ⚠️ Important Setup Notes

This boilerplate has been fully tested and configured, but there are **critical setup requirements**:

📋 **See `.cursor/rules/QUICK-REFERENCE.md`** for fast troubleshooting  
📖 **See `.cursor/rules/setup-troubleshooting.md`** for detailed solutions

### Common Issues

**Electron window shows "Error":**
- CSS compilation failed. Check `src/renderer/src/index.css` uses Tailwind v4 syntax
- See setup-troubleshooting.md #4

**Electron binary missing:**
- Run: `node node_modules/electron/install.js`
- Verify `.npmrc` exists with `enable-pre-post-scripts=true`
- See setup-troubleshooting.md #1

**Dev server not starting:**
- Ensure all dependencies are installed: `pnpm install`
- Check that port 5173 is available
- Kill existing processes: `Get-Process | Where-Object {$_.ProcessName -like "*electron*"} | Stop-Process -Force`

**Build errors:**
- Clear dist folder and rebuild: `Remove-Item -Recurse -Force dist && pnpm build`
- Ensure TypeScript compiles without errors: `tsc --noEmit`

**Package errors:**
- Install app deps: `pnpm postinstall`
- Verify electron-builder configuration in `electron-builder.json`

### Emergency Reset

```powershell
Remove-Item -Recurse -Force dist, node_modules
pnpm install
pnpm dev
```

## 📚 Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [Vite Documentation](https://vite.dev/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [shadcn/ui Documentation](https://ui.shadcn.com/)

## 📄 License

MIT

## 🤝 Contributing

This is a boilerplate template. Feel free to customize it for your specific needs.

---

Built with ❤️ for Windows 11 applications


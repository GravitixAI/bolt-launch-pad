# Quick Reference Card

## 🚨 READ THIS FIRST 🚨

This boilerplate is **fully functional** but has specific requirements and known pitfalls.

---

## Critical Files That Must Be Correct

| File | Critical Issue | Solution Location |
|------|----------------|-------------------|
| `.npmrc` | Electron binary won't install without this | See setup-troubleshooting.md #1 |
| `vite.config.ts` | Path resolution breaks with `/simple` variant | See setup-troubleshooting.md #2 |
| `src/main/main.ts` | Needs ESM `__dirname` definition | See setup-troubleshooting.md #3 |
| `postcss.config.js` | Must use `@tailwindcss/postcss` | See setup-troubleshooting.md #4 |
| `src/renderer/src/index.css` | Tailwind v4 syntax | See setup-troubleshooting.md #4 |

---

## 🏃 Quick Start Commands

```powershell
# First time setup
pnpm install

# Start development (opens Electron window)
pnpm dev

# Build for production
pnpm build

# Create Windows installer
pnpm package

# Add shadcn component
pnpm dlx shadcn@latest add button
```

---

## ⚠️ Top 3 Pitfalls

### 1. Electron Window Shows "Error" Title
**Cause:** CSS compilation failed  
**Fix:** Check `index.css` uses Tailwind v4 syntax (`@import "tailwindcss"`)

### 2. Electron Binary Missing
**Cause:** pnpm blocked install script  
**Fix:** Verify `.npmrc` exists with `enable-pre-post-scripts=true`

### 3. Build Files in Wrong Location
**Cause:** vite-plugin-electron path resolution  
**Fix:** Use absolute paths with `path.join(__dirname, ...)` in vite.config.ts

---

## ✅ Success Indicators

The setup works when:
- ✅ `pnpm dev` opens Electron window automatically
- ✅ Window shows styled UI with counter button
- ✅ DevTools open on the right side
- ✅ No errors in terminal or DevTools console
- ✅ Clicking counter button increments the number

---

## 🆘 Emergency Fixes

```powershell
# Electron won't start
node node_modules/electron/install.js

# CSS errors won't clear
# Stop server, clear cache, restart:
Get-Process | Where-Object {$_.ProcessName -like "*electron*"} | Stop-Process -Force
Remove-Item -Recurse -Force node_modules/.vite
pnpm dev

# Complete reset
Remove-Item -Recurse -Force dist, node_modules
pnpm install
pnpm dev
```

---

## 📚 Documentation Files

1. **`electron-vite-react-rules.md`** - Development rules and conventions
2. **`setup-troubleshooting.md`** - Detailed fixes (READ THIS for context)
3. **`QUICK-REFERENCE.md`** - This file (quick lookup)
4. **`project-setup-summary.md`** - Complete project structure
5. **`../TESTING_GUIDE.md`** - Full testing procedures
6. **`../README.md`** - User documentation

---

## 🔧 Tech Stack Specifics

- **Package Manager:** pnpm (NOT npm/yarn)
- **Shell:** PowerShell (NOT bash/cmd)
- **Module System:** ESM (NOT CommonJS)
- **Tailwind:** v4 (major breaking changes from v3)
- **Target Platform:** Windows 11

---

## 🎯 Common Tasks

### Add New React Component
```typescript
// Create: src/renderer/src/components/MyComponent.tsx
import React from 'react';

export function MyComponent() {
  return <div>Hello</div>;
}
```

### Use Database (SQLite)
```typescript
// In src/main/main.ts or db-operations.ts
import { dbOperations } from './db-operations';

dbOperations.setSetting('theme', 'dark');
const theme = dbOperations.getSetting('theme');
```

### Add IPC Communication
```typescript
// In src/main/main.ts
ipcMain.handle('myChannel', async () => {
  return 'response';
});

// In src/renderer/src/App.tsx
const result = await window.electron.invoke('myChannel');
```

### Add shadcn/ui Component
```powershell
pnpm dlx shadcn@latest add card
# Component added to src/renderer/src/components/ui/card.tsx
```

---

## 🐛 Debugging Tips

### Check Electron is Running
```powershell
Get-Process | Where-Object {$_.ProcessName -like "*Electron*"}
```

### View Terminal Output
Check: `terminals/*.txt` files in Cursor

### Check Build Output
- Main: `dist/main/main.js`
- Preload: `dist/preload/preload.js`
- Renderer: `dist/renderer/`

### Common Error Messages

| Error | File to Check | Solution |
|-------|---------------|----------|
| "Electron failed to install" | `.npmrc` | Add `enable-pre-post-scripts=true` |
| "__dirname is not defined" | `src/main/main.ts` | Add ESM __dirname derivation |
| "Cannot apply unknown utility class" | `src/renderer/src/index.css` | Use Tailwind v4 syntax |
| "Could not resolve entry module" | `vite.config.ts` | Use absolute paths |

---

## 📞 When Things Go Wrong

1. **Read:** `setup-troubleshooting.md` for detailed solutions
2. **Check:** This file's Emergency Fixes section
3. **Verify:** All 5 critical files are correct
4. **Test:** Run `pnpm dev` and observe terminal output
5. **Search:** Error message in setup-troubleshooting.md

---

## ⏱️ Last Tested

**Date:** November 24, 2025  
**Status:** ✅ Fully Working  
**Versions:** Electron 39.2.3, Vite 7.2.4, React 19.2.0, Tailwind 4.1.17


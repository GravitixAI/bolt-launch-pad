# Setup Troubleshooting & Fixes Applied

## Document Purpose
This document records all issues encountered during initial setup and their solutions. Use this as a reference when setting up similar projects or troubleshooting issues.

**Date Created**: November 24, 2025  
**Status**: ✅ Fully Functional

---

## Critical Fixes Applied

### 1. Electron Binary Installation Issue

**Problem:**
- Electron binary failed to install automatically
- Error: "Electron failed to install correctly"
- pnpm blocked build scripts by default

**Solution:**
```bash
# Create .npmrc file to enable build scripts
echo "enable-pre-post-scripts=true" > .npmrc

# Manually trigger Electron install
node node_modules/electron/install.js

# Or rebuild Electron
pnpm rebuild electron
```

**Files Created/Modified:**
- `.npmrc` (NEW)

**Why This Happened:**
pnpm 10.x has security features that block post-install scripts by default. Electron requires a post-install script to download its binary.

---

### 2. Vite-Plugin-Electron Path Resolution

**Problem:**
- Plugin tried to resolve `src/main/main.ts` as `src/renderer/src/main/main.ts`
- Build succeeded but files went to wrong location
- Electron couldn't start due to missing entry points

**Root Cause:**
Using `root: 'src/renderer'` in vite.config.ts caused relative paths in the electron plugin to resolve incorrectly.

**Solution:**
Use the full `vite-plugin-electron` (not the `/simple` variant) with explicit root configuration for each build target:

```typescript
import electron from 'vite-plugin-electron'; // Not /simple!
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

electron([
  {
    entry: path.join(__dirname, 'src/main/main.ts'),
    vite: {
      root: __dirname,  // Override root for main process
      build: {
        outDir: path.join(__dirname, 'dist/main'),
      },
    },
  },
  {
    entry: path.join(__dirname, 'src/preload/preload.ts'),
    onstart(args) {
      args.reload();
    },
    vite: {
      root: __dirname,  // Override root for preload
      build: {
        outDir: path.join(__dirname, 'dist/preload'),
      },
    },
  },
])
```

**Files Modified:**
- `vite.config.ts`

**Key Takeaway:**
When using a custom `root` in Vite config, electron plugin paths need explicit absolute path configuration.

---

### 3. ESM __dirname Issue in Main Process

**Problem:**
- Main process threw error: `__dirname is not defined`
- Happened because main.ts compiles to ESM (not CommonJS)

**Solution:**
Define `__dirname` manually in ESM context:

```typescript
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```

**Files Modified:**
- `src/main/main.ts`

**Why This Happened:**
Modern Node.js with ESM doesn't provide `__dirname` automatically. Must be derived from `import.meta.url`.

---

### 4. Tailwind CSS v4 Breaking Changes

**Problem #1 - PostCSS Plugin:**
- Error: "tailwindcss directly as a PostCSS plugin" not supported
- Tailwind v4 moved the PostCSS plugin to a separate package

**Solution:**
```bash
pnpm add -D @tailwindcss/postcss
```

Update `postcss.config.js`:
```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},  // Not 'tailwindcss'!
    autoprefixer: {},
  },
};
```

**Problem #2 - CSS Syntax:**
- Error: "Cannot apply unknown utility class `border-border`"
- `@tailwind` directives replaced with `@import`
- `@apply` in `@layer base` no longer works the same way

**Solution:**
Replace in `index.css`:

```css
/* OLD (Tailwind v3) */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    @apply border-border;  /* This breaks! */
  }
}

/* NEW (Tailwind v4) */
@import "tailwindcss";

:root {
  /* CSS variables stay the same */
}

* {
  border-color: hsl(var(--border));  /* Plain CSS instead */
}

body {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
}
```

**Files Modified:**
- `postcss.config.js`
- `src/renderer/src/index.css`

**Dependencies Added:**
- `@tailwindcss/postcss@4.1.17`

**Key Takeaway:**
Tailwind CSS v4 is a major rewrite. Use plain CSS for base styles instead of `@apply` directives in the base layer.

---

### 5. Removed Unused electron-squirrel-startup

**Problem:**
- Code referenced `electron-squirrel-startup` package
- Package not installed, causing potential issues

**Solution:**
Removed the reference (not needed for development):

```typescript
// REMOVED:
if (require('electron-squirrel-startup')) {
  app.quit();
}
```

**Files Modified:**
- `src/main/main.ts`

**Note:**
This is only needed for Windows installers. Can be re-added later if needed.

---

## Dependency Versions That Work

```json
{
  "devDependencies": {
    "@radix-ui/react-slot": "^1.2.4",
    "@tailwindcss/postcss": "4.1.17",
    "@types/node": "^24.10.1",
    "@types/react": "^19.2.7",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^5.1.1",
    "autoprefixer": "^10.4.22",
    "electron": "^39.2.3",
    "electron-builder": "^26.0.12",
    "postcss": "^8.5.6",
    "tailwindcss": "^4.1.17",
    "typescript": "^5.9.3",
    "vite": "^7.2.4",
    "vite-plugin-electron": "^0.29.0",
    "vite-plugin-electron-renderer": "^0.14.6"
  },
  "dependencies": {
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "tailwind-merge": "^3.4.0"
  }
}
```

---

## Testing Checklist

When setting up a new project based on this boilerplate:

### Initial Setup
- [ ] Run `pnpm install`
- [ ] Verify `.npmrc` exists with `enable-pre-post-scripts=true`
- [ ] Check Electron binary exists: `node_modules/electron/dist/electron.exe`
- [ ] If binary missing, run: `node node_modules/electron/install.js`

### Development Server
- [ ] Run `pnpm dev`
- [ ] Verify Vite starts on port 5173
- [ ] Verify main process builds to `dist/main/main.js`
- [ ] Verify preload builds to `dist/preload/preload.js`
- [ ] Verify Electron window opens (not just process running)
- [ ] Check window title is correct (not "Error")
- [ ] Verify no CSS errors in console

### UI Functionality
- [ ] App UI renders (no error overlay)
- [ ] Tailwind styles applied (borders, colors visible)
- [ ] Interactive elements work (buttons clickable)
- [ ] DevTools open automatically
- [ ] HMR works (edit file, auto-refresh)

### Build & Package
- [ ] Run `pnpm build` - no TypeScript errors
- [ ] Check all dist folders created
- [ ] Run `pnpm package` - installer created
- [ ] Test installer on clean machine

---

## Common Pitfalls to Avoid

### ❌ DON'T: Use vite-plugin-electron/simple with custom root
**Why:** Path resolution breaks. Use full plugin with explicit roots.

### ❌ DON'T: Use `@tailwind` directives with Tailwind v4
**Why:** Syntax changed to `@import "tailwindcss"`

### ❌ DON'T: Use `@apply` for custom CSS variables in base layer
**Why:** Tailwind v4 doesn't support this. Use plain CSS instead.

### ❌ DON'T: Assume __dirname exists in ESM
**Why:** Must be derived from `import.meta.url` in ES modules

### ❌ DON'T: Forget .npmrc for pnpm projects with Electron
**Why:** Electron binary won't install without enabling post-install scripts

---

## Files Critical to Setup

### Must Have Correct Configuration:
1. **`.npmrc`** - Enables Electron install scripts
2. **`vite.config.ts`** - Path resolution for electron plugin
3. **`src/main/main.ts`** - ESM __dirname definition
4. **`postcss.config.js`** - Correct Tailwind v4 plugin
5. **`src/renderer/src/index.css`** - Tailwind v4 syntax

### Auto-Generated (Don't Commit):
- `dist/` - Build output
- `node_modules/` - Dependencies
- `release/` - Packaged applications

---

## Environment Details

**Tested On:**
- OS: Windows 11
- Node.js: v22.19.0
- pnpm: 10.20.0
- PowerShell: 7.x

**Key Characteristics:**
- Package manager: pnpm (not npm/yarn)
- Shell: PowerShell (not bash)
- Module system: ESM (not CommonJS)
- Tailwind: v4 (major breaking changes from v3)

---

## Quick Fix Commands

```powershell
# Fix Electron binary not found
node node_modules/electron/install.js

# Fix "command not found" errors
pnpm install --force

# Clear Vite cache
Remove-Item -Recurse -Force node_modules/.vite

# Full clean restart
Remove-Item -Recurse -Force dist, node_modules
pnpm install
pnpm dev

# Check if Electron process is running
Get-Process | Where-Object {$_.ProcessName -like "*Electron*"}

# Kill stuck Electron processes
Get-Process | Where-Object {$_.ProcessName -like "*electron*"} | Stop-Process -Force
```

---

## Future Considerations

### When Adding shadcn/ui Components:
- Use: `pnpm dlx shadcn@latest add <component>`
- Components go to: `src/renderer/src/components/ui/`
- All components are compatible with Tailwind v4

### When Upgrading Dependencies:
- Test Tailwind CSS updates carefully (v4 still evolving)
- Verify Electron binary installs after version bumps
- Check vite-plugin-electron changelog for breaking changes

### When Packaging for Production:
- Update `electron-builder.json` with your app details
- Add proper app icon: `build/icon.ico` (256x256)
- Test installer on clean Windows machine
- Consider code signing for Windows

---

## Success Indicators

✅ **The setup is successful when:**
1. `pnpm dev` launches Electron window automatically
2. Window shows styled UI (not blank/error)
3. DevTools open in development mode
4. HMR updates work without full reload
5. Counter button increments when clicked
6. No errors in terminal or DevTools console
7. Window title shows "Electron Vite React App"

---

## Additional Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [Vite Plugin Electron](https://github.com/electron-vite/vite-plugin-electron)
- [Tailwind CSS v4 Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide)
- [pnpm Configuration](https://pnpm.io/npmrc)

---

## Last Updated
November 24, 2025 - Initial setup completed and documented


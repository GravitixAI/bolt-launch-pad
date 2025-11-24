# Testing Guide for Electron-Vite-React Boilerplate

## ✅ Current Test Status

**Date**: November 24, 2025  
**Result**: ✓ Successfully running

The Electron app has been tested and is currently running with:
- ✓ Vite dev server on http://localhost:5173/
- ✓ Main process built successfully
- ✓ Preload script built successfully
- ✓ Electron window launched

---

## Manual Testing Checklist

### 1. **Development Server Launch** ✓
```powershell
pnpm dev
```

**Expected Results:**
- ✓ Vite server starts on port 5173
- ✓ Main process compiles to `dist/main/main.js`
- ✓ Preload script compiles to `dist/preload/preload.mjs`
- ✓ Electron window opens automatically
- ✓ DevTools open in development mode

### 2. **Visual Tests** (in the Electron window)

**Window Properties:**
- [ ] Window opens at 1200x800 pixels
- [ ] Window has proper title: "Electron Vite React App"
- [ ] Window is resizable
- [ ] Window can be minimized/maximized

**UI Elements:**
- [ ] Heading: "Electron + Vite + React" is visible
- [ ] Subheading: "Windows 11 Application Boilerplate"
- [ ] Welcome card with "Welcome! 🚀" text
- [ ] Interactive counter button with initial value 0
- [ ] Reset button next to counter
- [ ] Features list showing 6 technologies
- [ ] Button variants demo section with 6 different button styles

### 3. **Interactive Tests**

**Counter Functionality:**
1. [ ] Click the "Count is 0" button
2. [ ] Counter increments to 1, 2, 3...
3. [ ] Click "Reset" button
4. [ ] Counter returns to 0

**Button Variants:**
- [ ] All 6 button variants are visible:
  - Default (dark)
  - Secondary (light gray)
  - Destructive (red)
  - Outline (bordered)
  - Ghost (transparent with hover)
  - Link (underlined text)
- [ ] Hover effects work on all buttons
- [ ] All buttons are clickable

### 4. **Hot Module Replacement (HMR)**

1. [ ] Keep the Electron app open
2. [ ] Edit `src/renderer/src/App.tsx`
3. [ ] Change some text (e.g., the heading)
4. [ ] Save the file
5. [ ] App updates instantly without full reload
6. [ ] Counter state is preserved (if React Fast Refresh works)

**Test this:**
```typescript
// Change this line in App.tsx
<h1 className="text-4xl font-bold mb-4">
  Electron + Vite + React
</h1>

// To this:
<h1 className="text-4xl font-bold mb-4">
  Testing HMR! 🔥
</h1>
```

### 5. **Tailwind CSS Styling**

- [ ] Background is white (or dark if dark mode)
- [ ] Text has proper colors (foreground/muted-foreground)
- [ ] Borders are visible on cards
- [ ] Rounded corners on cards and buttons
- [ ] Proper spacing and padding
- [ ] Responsive container width

### 6. **TypeScript**

```powershell
# Run TypeScript check
pnpm exec tsc --noEmit
```

**Expected:**
- [ ] No TypeScript errors
- [ ] All imports resolve correctly
- [ ] Type checking passes

### 7. **DevTools Console**

**Open DevTools (should already be open):**
- [ ] No errors in Console tab
- [ ] No warnings (or only expected warnings)
- [ ] React DevTools extension works (if installed)

**Common acceptable warnings:**
- Vite HMR connection messages
- React development mode warnings

### 8. **Build Test**

```powershell
# Stop the dev server (Ctrl+C in terminal)
pnpm build
```

**Expected Results:**
- [ ] TypeScript compiles without errors
- [ ] Vite builds renderer process
- [ ] `dist/renderer/` folder created with:
  - [ ] `index.html`
  - [ ] `assets/` folder with JS and CSS bundles
- [ ] `dist/main/` folder contains `main.js`
- [ ] `dist/preload/` folder contains `preload.mjs`
- [ ] No build errors

### 9. **Production Build Preview**

```powershell
# After building
pnpm preview
```

**Expected:**
- [ ] Electron launches in production mode
- [ ] DevTools DON'T open automatically
- [ ] App looks and functions the same as dev mode
- [ ] All features work correctly

### 10. **Package Test** (Optional - takes time)

```powershell
pnpm package
```

**Expected Results:**
- [ ] Build completes successfully
- [ ] `release/` folder created
- [ ] Windows installer (.exe) is created
- [ ] Installer size is reasonable (usually 100-200MB for basic app)

**Install and Test:**
1. [ ] Run the installer
2. [ ] App installs without errors
3. [ ] Desktop shortcut created (if configured)
4. [ ] Start menu entry created
5. [ ] App launches from desktop/start menu
6. [ ] App works identically to dev version

---

## Additional Component Tests

### shadcn/ui Integration

**Test adding a new component:**
```powershell
pnpm dlx shadcn@latest add card
```

**Expected:**
- [ ] Component downloads successfully
- [ ] Files created in `src/renderer/src/components/ui/`
- [ ] No errors or conflicts

**Use the new component:**
```typescript
import { Card } from '@/components/ui/card';

// Add to App.tsx
<Card>Test Card</Card>
```

- [ ] Import works (no red squiggles in IDE)
- [ ] Component renders correctly
- [ ] Styling is applied

---

## Performance Tests

### Startup Time
- [ ] Electron window opens within 2-3 seconds in dev mode
- [ ] Electron window opens within 1-2 seconds in production

### Build Time
- [ ] Initial build completes in < 5 seconds
- [ ] Subsequent HMR updates in < 500ms

### Memory Usage
- [ ] Check Task Manager
- [ ] Electron processes use reasonable memory
- [ ] No memory leaks after extended use

---

## Cross-Process Communication Test

**Add this to `src/main/main.ts`:**
```typescript
import { ipcMain } from 'electron';

ipcMain.handle('getAppVersion', () => {
  return app.getVersion();
});
```

**Add this to `src/renderer/src/App.tsx`:**
```typescript
const [version, setVersion] = useState<string>('');

useEffect(() => {
  window.electron.invoke('getAppVersion').then(setVersion);
}, []);

// Display it:
<p>App Version: {version}</p>
```

**Expected:**
- [ ] Version displays correctly
- [ ] No console errors
- [ ] IPC communication works securely

---

## Security Verification

### Context Isolation
**Open DevTools Console and run:**
```javascript
// Should be undefined (good!)
console.log(window.require);
console.log(window.process);

// Should exist (good!)
console.log(window.electron);
```

**Expected:**
- [ ] `window.require` is undefined
- [ ] `window.process` is undefined  
- [ ] `window.electron` is defined
- [ ] ✓ Context isolation is working

---

## Troubleshooting Common Issues

### Issue: Electron doesn't start
**Solution:**
```powershell
# Reinstall Electron
Remove-Item -Recurse -Force node_modules\.pnpm\electron@*
pnpm install --force
```

### Issue: TypeScript errors
**Solution:**
```powershell
# Clean and rebuild
Remove-Item -Recurse -Force dist
pnpm build
```

### Issue: HMR not working
**Solution:**
- Restart dev server
- Clear browser cache (Ctrl+Shift+R in DevTools)
- Check console for errors

### Issue: Build fails
**Solution:**
```powershell
# Clean everything
Remove-Item -Recurse -Force dist, node_modules
pnpm install
pnpm build
```

---

## Automated Testing (Future Enhancement)

Consider adding:
- [ ] Vitest for unit tests
- [ ] React Testing Library for component tests
- [ ] Playwright for E2E tests
- [ ] Jest for main process tests

---

## Test Report Template

```
Test Date: _______________
Tester: __________________

Development Launch:     [ ] Pass  [ ] Fail
Visual Elements:        [ ] Pass  [ ] Fail
Interactive Features:   [ ] Pass  [ ] Fail
HMR:                    [ ] Pass  [ ] Fail
TypeScript:             [ ] Pass  [ ] Fail
Production Build:       [ ] Pass  [ ] Fail
Package/Installer:      [ ] Pass  [ ] Fail

Notes:
_________________________________
_________________________________
_________________________________
```

---

## Next Testing Steps

After basic tests pass:
1. Test with real features from your app requirements
2. Test with more complex state management
3. Test with API calls (if applicable)
4. Test with file system operations
5. Test with native OS integrations

Good luck with your testing! 🚀


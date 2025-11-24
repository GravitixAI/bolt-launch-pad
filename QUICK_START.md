# Quick Start Guide

## First Time Setup

1. **Install dependencies**
   ```powershell
   pnpm install
   ```

2. **Start development**
   ```powershell
   pnpm dev
   ```

   The Electron app will launch automatically with hot reload enabled.

## Common Tasks

### Adding shadcn/ui Components

```powershell
# Add a specific component (e.g., card)
pnpm dlx shadcn@latest add card

# Add multiple components
pnpm dlx shadcn@latest add card dialog dropdown-menu
```

Components will be added to `src/renderer/src/components/ui/`

### Project Structure Quick Reference

- `src/main/` - Electron main process (Node.js)
- `src/preload/` - Preload scripts (bridge between main and renderer)
- `src/renderer/` - React app (runs in browser context)
  - `src/` - React source files
    - `components/` - React components
    - `lib/` - Utility functions
    - `App.tsx` - Main app component
    - `main.tsx` - React entry point

### Building for Production

```powershell
# Build the app
pnpm build

# Package as Windows installer
pnpm package
```

The installer will be in the `release/` folder.

## Tips

- DevTools open automatically in development mode
- Changes to renderer process hot reload instantly
- Changes to main process require app restart
- Use `console.log()` in renderer, check DevTools
- Use `console.log()` in main process, check terminal

## Next Steps

1. Customize branding in `package.json` and `electron-builder.json`
2. Add your app logic to `src/renderer/src/App.tsx`
3. Add IPC handlers in `src/main/main.ts` for main process features
4. Install shadcn/ui components as needed
5. Update `.cursor/rules/electron-vite-react-rules.md` with project-specific conventions

## Troubleshooting

**App doesn't start:**
- Delete `node_modules` and run `pnpm install` again
- Make sure you're using pnpm, not npm or yarn

**Build fails:**
- Clear the dist folder: `Remove-Item -Recurse -Force dist`
- Run `pnpm build` again

**TypeScript errors:**
- Check `tsconfig.json` paths match your project structure
- Run `pnpm add -D @types/node` if Node types are missing


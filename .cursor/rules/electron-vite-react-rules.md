# Electron-Vite-React Boilerplate Rules

## Project Overview
This boilerplate is designed for building Windows 11 Electron applications using Vite, React, and modern tooling.

## Package Manager
- **Use pnpm** for all package management operations
- Commands:
  - Install: `pnpm install`
  - Add dependency: `pnpm add <package>`
  - Add dev dependency: `pnpm add -D <package>`
  - Remove: `pnpm remove <package>`
  - Run scripts: `pnpm run <script>` or `pnpm <script>`

## Terminal
- **PowerShell** is the default terminal for this project
- All terminal commands should be PowerShell compatible

## Target Platform
- **Windows 11** is the primary target platform
- Configure Electron builder and packaging for Windows
- Consider Windows-specific features and UX patterns

## UI Framework
- **React** for component-based UI
- **Tailwind CSS** for styling
- **shadcn/ui** for pre-built, customizable UI components
- Follow shadcn conventions for component structure

## Build Tool
- **Vite** for fast development and optimized builds
- Separate configurations for main and renderer processes
- Hot Module Replacement (HMR) in development

## Project Structure
```
electron-vite-react-boilerplate/
├── .cursor/
│   └── rules/
│       └── electron-vite-react-rules.md
├── src/
│   ├── main/              # Electron main process
│   ├── preload/           # Preload scripts
│   └── renderer/          # React application
│       ├── src/
│       │   ├── components/
│       │   ├── lib/
│       │   └── App.tsx
│       └── index.html
├── dist/                  # Build output
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Code Style
- Use TypeScript for type safety
- Use ES modules (ESM) syntax
- Follow React best practices and hooks
- Use functional components over class components

## Development Workflow
1. Development: `pnpm dev` - Starts Vite dev server and Electron
2. Build: `pnpm build` - Builds for production
3. Preview: `pnpm preview` - Preview production build

## Electron Best Practices
- Use context isolation and sandbox for security
- Implement proper IPC communication between main and renderer
- Follow the principle of least privilege
- Never disable web security features unless absolutely necessary

## Database (SQLite)
- **Package:** better-sqlite3
- **Location:** User's app data folder (`%APPDATA%\electron-vite-react-boilerplate\`)
- **Access:** Main process only (secure by default)
- **Usage:** See `database-guide.md` for complete documentation
- **Files:** 
  - `src/main/database.ts` - Connection and initialization
  - `src/main/db-operations.ts` - CRUD operations
- **Security:** Never expose direct database access to renderer process

## Known Issues & Solutions

### Electron Build Scripts
- pnpm may block Electron build scripts by default
- Solution: Add `.npmrc` with `enable-pre-post-scripts=true`
- Alternative: Run `node node_modules\electron\install.js` manually

### Vite Plugin Electron Paths
- Use absolute paths in `vite.config.ts` for main and preload entries
- Relative paths may resolve incorrectly due to the `root: 'src/renderer'` setting
- Pattern: `path.resolve(__dirname, 'src/main/main.ts')`

## Additional Notes
- This file will be updated as the project evolves
- Add project-specific rules and conventions as needed
- See `TESTING_GUIDE.md` for comprehensive testing procedures
- **IMPORTANT:** See `setup-troubleshooting.md` for critical fixes and pitfalls to avoid
- **FOR LLMs/AI:** When cloning this boilerplate for a new project, see `NEW-PROJECT-SETUP.md` for complete setup guide


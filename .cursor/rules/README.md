# Cursor Rules Documentation Index

## 📋 Quick Navigation

**Setting up a NEW project from this boilerplate?** Start here: [`NEW-PROJECT-SETUP.md`](./NEW-PROJECT-SETUP.md) ⭐ **FOR LLMs/AI ASSISTANTS**

**New to this existing project?** Start here: [`QUICK-REFERENCE.md`](./QUICK-REFERENCE.md)

**Having issues?** Check: [`setup-troubleshooting.md`](./setup-troubleshooting.md)

---

## Documentation Files

### 🆕 For LLM/AI Assistants

**[NEW-PROJECT-SETUP.md](./NEW-PROJECT-SETUP.md)** ⭐ **READ THIS WHEN CLONING FOR NEW PROJECT**
- Complete step-by-step setup guide
- What files to update (package.json, electron-builder.json, etc.)
- Database customization or removal
- Common pitfalls to avoid
- Testing checklist
- **Purpose:** Guide AI assistants when helping users create a new app from this boilerplate

### 🚀 Getting Started (Existing Project)

1. **[QUICK-REFERENCE.md](./QUICK-REFERENCE.md)** ⭐ START HERE
   - One-page reference card
   - Common commands
   - Top pitfalls to avoid
   - Emergency fixes

2. **[../PROJECT-STATUS.md](../PROJECT-STATUS.md)**
   - Current project status
   - What's working
   - Testing results
   - Environment details

### 🔧 Troubleshooting

3. **[setup-troubleshooting.md](./setup-troubleshooting.md)** ⭐ ESSENTIAL READING
   - All fixes applied during setup
   - Detailed solutions with code examples
   - Why each issue happened
   - Prevention strategies

4. **[../TESTING_GUIDE.md](../TESTING_GUIDE.md)**
   - Complete testing checklist
   - Manual testing procedures
   - Performance benchmarks
   - Troubleshooting steps

### 📖 Development Guidelines

5. **[electron-vite-react-rules.md](./electron-vite-react-rules.md)**
   - Project overview
   - Package manager (pnpm)
   - Terminal (PowerShell)
   - Code style guidelines
   - Best practices

6. **[database-guide.md](./database-guide.md)**
   - SQLite setup and usage
   - CRUD operations
   - IPC communication
   - Security best practices
   - Transaction examples

7. **[CODE-SIGNING-GUIDE.md](./CODE-SIGNING-GUIDE.md)** ⭐ FOR PRODUCTION
   - Why code signing matters
   - How to obtain certificates
   - Setup and configuration
   - CI/CD integration
   - Troubleshooting
   - Cost comparison

8. **[project-setup-summary.md](./project-setup-summary.md)**
   - Complete file structure
   - Installed dependencies
   - Configuration files
   - Security features

### 📚 User Documentation

9. **[../README.md](../README.md)**
   - Full project documentation
   - Installation instructions
   - Usage examples
   - API reference
   - Production features

10. **[../QUICK_START.md](../QUICK_START.md)**
    - Fast setup guide
    - Common tasks
    - Tips and tricks

11. **[../CHANGELOG.md](../CHANGELOG.md)**
    - Version history
    - Changes and updates
    - Future enhancements

---

## Quick Links by Topic

### 🆕 "Setting up a new app from this boilerplate" (LLM/AI)
→ [NEW-PROJECT-SETUP.md](./NEW-PROJECT-SETUP.md) - **Complete setup guide**  
→ Follow the 10-step process for proper initialization

### 🐛 "My app won't start"
→ [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) - Emergency Fixes section  
→ [setup-troubleshooting.md](./setup-troubleshooting.md) - Section #1 & #2

### 🎨 "CSS/Styling issues"
→ [setup-troubleshooting.md](./setup-troubleshooting.md) - Section #4  
→ [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) - Pitfall #1

### ⚙️ "Build/Configuration problems"
→ [setup-troubleshooting.md](./setup-troubleshooting.md) - All sections  
→ [electron-vite-react-rules.md](./electron-vite-react-rules.md) - Known Issues

### 💾 "Database questions"
→ [database-guide.md](./database-guide.md) - Complete guide  
→ [NEW-PROJECT-SETUP.md](./NEW-PROJECT-SETUP.md) - Step 4 (customization)

### 📦 "Preparing for production / code signing"
→ [CODE-SIGNING-GUIDE.md](./CODE-SIGNING-GUIDE.md) - **Complete signing guide**  
→ [../README.md](../README.md) - Production Features section

### 🧪 "How do I test?"
→ [../TESTING_GUIDE.md](../TESTING_GUIDE.md) - Complete guide  
→ [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) - Success Indicators

### 📦 "Adding features"
→ [electron-vite-react-rules.md](./electron-vite-react-rules.md) - Development Workflow  
→ [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) - Common Tasks

---

## Critical Information Summary

### Must-Have Files
These files are REQUIRED for the project to work:

| File | Purpose | See |
|------|---------|-----|
| `.npmrc` | Enables Electron binary installation | setup-troubleshooting.md #1 |
| `vite.config.ts` | Correct path resolution for builds | setup-troubleshooting.md #2 |
| `postcss.config.js` | Tailwind CSS v4 support | setup-troubleshooting.md #4 |

### Breaking Changes to Know

#### Tailwind CSS v4
- **Old:** `@tailwind base;`
- **New:** `@import "tailwindcss";`
- **Details:** setup-troubleshooting.md #4

#### ESM vs CommonJS
- **Issue:** `__dirname` not defined
- **Fix:** Derive from `import.meta.url`
- **Details:** setup-troubleshooting.md #3

---

## Reading Order for Different Scenarios

### 🆕 LLM/AI Setting Up New Project from Boilerplate
1. Read: [NEW-PROJECT-SETUP.md](./NEW-PROJECT-SETUP.md) - **PRIMARY GUIDE**
2. Follow: 10-step setup process
3. Reference: [setup-troubleshooting.md](./setup-troubleshooting.md) if issues arise
4. Test: Using checklist in Step 9

### 👨‍💻 New Developer (Existing Project)

#### First Time Setup
1. Read: [QUICK-REFERENCE.md](./QUICK-REFERENCE.md)
2. Run: `pnpm install` and `pnpm dev`
3. If issues: [setup-troubleshooting.md](./setup-troubleshooting.md)

#### Understanding the Project
1. Read: [../PROJECT-STATUS.md](../PROJECT-STATUS.md)
2. Read: [project-setup-summary.md](./project-setup-summary.md)
3. Read: [electron-vite-react-rules.md](./electron-vite-react-rules.md)

#### Building Features
1. Read: [../README.md](../README.md) - API examples
2. Read: [../QUICK_START.md](../QUICK_START.md) - Common patterns
3. Reference: [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) - As needed

---

## Document Maintenance

### When to Update

**QUICK-REFERENCE.md**
- New critical pitfall discovered
- Emergency fix command changes
- Success criteria changes

**setup-troubleshooting.md**
- New issue encountered and fixed
- Dependency version changes
- Configuration changes

**electron-vite-react-rules.md**
- New coding conventions adopted
- Project structure changes
- New best practices

**PROJECT-STATUS.md**
- Major milestone reached
- Testing status changes
- Dependency updates

---

## Key Takeaways

### ✅ What Works
- Complete Electron + Vite + React setup
- Tailwind CSS v4 with shadcn/ui
- TypeScript with strict mode
- Secure IPC communication
- Hot Module Replacement
- Windows 11 packaging

### ⚠️ What to Watch
- Tailwind v4 is still evolving (breaking changes possible)
- pnpm configuration for Electron (`.npmrc` required)
- Path resolution with custom Vite root
- ESM module system requirements

### 🎯 Success Indicators
1. `pnpm dev` launches window automatically
2. UI renders with styling
3. DevTools open
4. No console errors
5. HMR works

---

## Support & Resources

### Internal Documentation
- All files in `.cursor/rules/` folder
- `PROJECT-STATUS.md` in project root
- Code comments in critical files

### External Resources
- [Electron Docs](https://www.electronjs.org/docs)
- [Vite Plugin Electron](https://github.com/electron-vite/vite-plugin-electron)
- [Tailwind v4 Docs](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)

---

## Version Information

**Documentation Created:** November 24, 2025  
**Last Updated:** November 24, 2025  
**Project Version:** 1.0.0  
**Status:** ✅ Fully Functional

---

*This documentation represents a complete setup with all known issues resolved and documented.*


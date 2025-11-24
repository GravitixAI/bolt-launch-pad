# Bolt Launch Pad - Implementation Summary

## Overview

Bolt Launch Pad is a comprehensive IT Launch tool built with Electron, React, TypeScript, and modern web technologies. It provides three main views for managing bookmarks, executable shortcuts, and PowerShell/CMD scripts, with team-level synchronization via MySQL and Azure AD SSO.

## Architecture

### Backend (Main Process)

1. **Database Layer**
   - `database.ts`: SQLite schema with tables for bookmarks, executables, scripts, user_shares
   - `db-operations.ts`: Complete CRUD operations for all entities
   - `mysql-connection.ts`: MySQL connection pooling with dev/prod environments
   - `sync-engine.ts`: Bidirectional sync with conflict resolution

2. **Services**
   - `auth-service.ts`: Azure AD SSO using MSAL
   - `favicon-service.ts`: Favicon fetching with fallback strategies
   - `icon-service.ts`: Windows executable icon extraction
   - `script-executor.ts`: Safe PowerShell/CMD script execution

3. **IPC Layer**
   - `ipc-handlers-new.ts`: Comprehensive IPC handlers for all operations
   - `preload.ts`: Secure API exposure to renderer process

### Frontend (Renderer Process)

1. **Core**
   - `App.tsx`: Main application with routing and authentication
   - `AuthContext.tsx`: Authentication state management
   - `types/index.ts`: TypeScript type definitions

2. **Layout**
   - `MainLayout.tsx`: Sidebar navigation with user profile
   - `SearchBar.tsx`: Real-time search component

3. **Views**
   - `BookmarksView.tsx`: URL bookmarks management
   - `ExecutablesView.tsx`: Application shortcuts with parameters
   - `ScriptsView.tsx`: PowerShell/CMD script library
   - `SettingsView.tsx`: Configuration and environment management

4. **Components**
   - `LoginScreen.tsx`: Azure AD authentication UI
   - `ThemeProvider.tsx` & `ThemeToggle.tsx`: Dark/light theme support
   - `ui/`: shadcn/ui components (button, dropdown-menu)

## Key Features Implemented

### 1. Database Architecture
- **SQLite Local Storage**: All items stored locally with full CRUD
- **MySQL Team Sync**: Team-level items sync to central MySQL database
- **Conflict Resolution**: Last-write-wins with conflict detection
- **Sync Hash**: SHA256 hashing for change detection

### 2. Authentication & Authorization
- **Azure AD SSO**: Device code flow for secure authentication
- **User Context**: All operations tagged with user email
- **Session Persistence**: Automatic session restoration

### 3. Three Main Views

#### Bookmarks
- Create, read, update, delete bookmarks
- Automatic favicon fetching (with Google fallback)
- Real-time search
- Team promotion
- Direct user sharing
- Click to open in browser

#### Executables
- Executable shortcuts with parameter support
- Automatic icon extraction from .exe files
- Launch with parameters
- Team promotion
- Real-time search

#### Scripts
- PowerShell and CMD script storage
- Execute scripts directly from app
- Copy to clipboard
- Default PS/CMD icons with custom override
- Safety validation warnings
- Team promotion

### 4. Synchronization
- **Automatic Sync**: Every 5 minutes (long polling)
- **Manual Sync**: Button in sidebar
- **Bidirectional**: Local → MySQL and MySQL → Local
- **Status Tracking**: Last sync time, items synced, conflicts

### 5. Environment Management
- **Dev/Prod Toggle**: Switch between environments
- **Connection Testing**: Test MySQL connectivity
- **Configuration Storage**: Secure credential storage in SQLite

### 6. User Experience
- **Dark/Light Themes**: System-aware with manual override
- **Toast Notifications**: Success/error feedback
- **Loading States**: Skeleton loaders and spinners
- **Responsive Design**: Tailwind CSS utilities
- **Native Menus**: File, Edit, View, Help menus

## Setup Instructions

### Prerequisites
```powershell
# Install dependencies
pnpm install

# Rebuild native modules
pnpm postinstall
```

### First Run Configuration

1. **Azure AD Setup** (Required for team features)
   - Register app in Azure Portal
   - Get Client ID, Authority URL, Redirect URI
   - Configure in Settings view

2. **MySQL Setup** (Required for team sync)
   - Prepare dev and/or prod MySQL databases
   - Run initialization: `window.mysql.initializeTables()`
   - Configure connection details in Settings

3. **Development**
```powershell
pnpm dev
```

4. **Production Build**
```powershell
pnpm build
pnpm package
```

## Database Schema

### SQLite Tables

**bookmarks**
- id, title, url, favicon (base64)
- is_team_level, is_personal
- created_by, updated_by, timestamps
- sync_hash for conflict detection

**executables**
- id, title, executable_path, parameters
- icon (base64)
- is_team_level, is_personal
- created_by, updated_by, timestamps

**scripts**
- id, title, script_content, script_type
- icon (base64), category
- is_team_level, is_personal
- created_by, updated_by, timestamps

**user_shares**
- item_type, item_id
- shared_by, shared_with

### MySQL Tables

Same schema as SQLite for team-level items (is_team_level = 1)

## API Reference

### Window APIs Exposed to Renderer

```typescript
window.bookmarks.*
window.executables.*
window.scripts.*
window.auth.*
window.sync.*
window.mysql.*
window.system.*
window.database.*
```

See `src/preload/preload.ts` for complete API.

## Security Features

1. **Context Isolation**: Enabled
2. **Node Integration**: Disabled in renderer
3. **Prepared Statements**: All database queries
4. **Secure IPC**: Whitelisted channels only
5. **Script Validation**: Basic safety checks for dangerous operations

## Known Limitations & Future Enhancements

### Current Limitations
- Add/Edit dialogs are placeholders (show toast notifications)
- No bulk operations (select multiple items)
- No categories/tags filtering UI
- No search history
- No favorites/pinning

### Recommended Enhancements
1. **Add/Edit Dialogs**: Create modal forms for CRUD operations
2. **Advanced Search**: Filter by category, date, creator
3. **Batch Operations**: Select and operate on multiple items
4. **Export/Import**: Backup and restore functionality
5. **Script Editor**: Syntax highlighting with Monaco Editor
6. **Execution History**: Log of script executions
7. **Team Management**: View team members, manage shares
8. **Notifications**: Real-time sync notifications
9. **Keyboard Shortcuts**: Cmd/Ctrl+K global search, etc.
10. **Analytics**: Usage statistics and metrics

## Troubleshooting

### Database Issues
```powershell
# View database location
$env:APPDATA\bolt-launch-pad\app-database.db

# Reset database
Remove-Item $env:APPDATA\bolt-launch-pad\app-database.db
# Restart app
```

### MySQL Connection
- Verify network connectivity
- Check firewall rules
- Ensure MySQL server is running
- Validate credentials in Settings

### Native Modules
```powershell
# Rebuild if icons/sharp not working
pnpm rebuild
```

### Azure AD
- Verify app registration in Azure Portal
- Check redirect URI matches
- Ensure user has permissions

## Technology Stack

- **Electron**: 39.2.3
- **React**: 19.2.0
- **TypeScript**: 5.9.3
- **Vite**: 7.2.4
- **Tailwind CSS**: 4.1.17
- **shadcn/ui**: Latest
- **SQLite**: better-sqlite3
- **MySQL**: mysql2
- **Azure AD**: @azure/msal-node
- **Icons**: lucide-react
- **Toast**: sonner
- **Image Processing**: sharp

## File Structure

```
bolt-launch-pad/
├── src/
│   ├── main/
│   │   ├── database.ts
│   │   ├── db-operations.ts
│   │   ├── mysql-connection.ts
│   │   ├── sync-engine.ts
│   │   ├── auth-service.ts
│   │   ├── favicon-service.ts
│   │   ├── icon-service.ts
│   │   ├── script-executor.ts
│   │   ├── ipc-handlers-new.ts
│   │   └── main.ts
│   ├── preload/
│   │   └── preload.ts
│   └── renderer/
│       ├── src/
│       │   ├── components/
│       │   │   ├── Auth/
│       │   │   │   └── LoginScreen.tsx
│       │   │   ├── Layout/
│       │   │   │   ├── MainLayout.tsx
│       │   │   │   └── SearchBar.tsx
│       │   │   ├── ui/
│       │   │   │   ├── button.tsx
│       │   │   │   └── dropdown-menu.tsx
│       │   │   ├── ThemeProvider.tsx
│       │   │   └── ThemeToggle.tsx
│       │   ├── contexts/
│       │   │   └── AuthContext.tsx
│       │   ├── views/
│       │   │   ├── BookmarksView.tsx
│       │   │   ├── ExecutablesView.tsx
│       │   │   ├── ScriptsView.tsx
│       │   │   └── SettingsView.tsx
│       │   ├── types/
│       │   │   └── index.ts
│       │   └── App.tsx
│       └── index.html
├── package.json
├── vite.config.ts
├── electron-builder.json
└── README.md
```

## Contributing

When adding new features:
1. Add backend service in `src/main/`
2. Add IPC handlers in `ipc-handlers-new.ts`
3. Expose in `preload.ts`
4. Create UI components
5. Update types in `types/index.ts`

## License

MIT

---

**Built with ❤️ for IT teams**


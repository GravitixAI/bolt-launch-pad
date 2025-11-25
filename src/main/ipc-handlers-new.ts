/**
 * Comprehensive IPC Handlers for Bolt Launch Pad
 * Handles all communication between renderer and main process
 */

import { ipcMain, dialog, shell, BrowserWindow, clipboard } from 'electron';
import { autoUpdater } from 'electron-updater';
import { dbOperations } from './db-operations';
import { db, getDatabasePath } from './database';
import * as mysqlConnection from './mysql-connection';
import * as syncEngine from './sync-engine';
import * as authService from './auth-service';
import * as faviconService from './favicon-service';
import * as iconService from './icon-service';
import * as scriptExecutor from './script-executor';

/**
 * Register all IPC handlers
 * Call this in main.ts after database initialization
 */
export function registerAllHandlers(mainWindow: BrowserWindow) {
  registerDatabaseHandlers();
  registerBookmarkHandlers();
  registerExecutableHandlers();
  registerScriptHandlers();
  registerSyncHandlers();
  registerAuthHandlers(mainWindow);
  registerSystemHandlers();
  registerUpdateHandlers();
  registerMySQLHandlers();
}

// ============ Database (Settings & Preferences) Handlers ============

function registerDatabaseHandlers() {
  ipcMain.handle('db:getSetting', async (_event, key: string) => {
    try {
      return dbOperations.getSetting(key);
    } catch (error) {
      console.error('Error getting setting:', error);
      throw error;
    }
  });

  ipcMain.handle('db:setSetting', async (_event, key: string, value: string) => {
    try {
      return dbOperations.setSetting(key, value);
    } catch (error) {
      console.error('Error setting setting:', error);
      throw error;
    }
  });

  ipcMain.handle('db:getAllSettings', async () => {
    try {
      return dbOperations.getAllSettings();
    } catch (error) {
      console.error('Error getting all settings:', error);
      throw error;
    }
  });

  ipcMain.handle('db:getDatabasePath', async () => {
    try {
      return getDatabasePath();
    } catch (error) {
      console.error('Error getting database path:', error);
      throw error;
    }
  });

  ipcMain.handle('db:getStats', async () => {
    try {
      return dbOperations.getStats();
    } catch (error) {
      console.error('Error getting stats:', error);
      throw error;
    }
  });
}

// ============ Bookmarks Handlers ============

function registerBookmarkHandlers() {
  ipcMain.handle('bookmarks:getAll', async (_event, userEmail?: string) => {
    try {
      return dbOperations.getAllBookmarks(userEmail);
    } catch (error) {
      console.error('Error getting bookmarks:', error);
      throw error;
    }
  });

  ipcMain.handle('bookmarks:create', async (_event, bookmark: any) => {
    try {
      return dbOperations.createBookmark(bookmark);
    } catch (error) {
      console.error('Error creating bookmark:', error);
      throw error;
    }
  });

  ipcMain.handle('bookmarks:update', async (_event, id: string, updates: any) => {
    try {
      return dbOperations.updateBookmark(id, updates);
    } catch (error) {
      console.error('Error updating bookmark:', error);
      throw error;
    }
  });

  ipcMain.handle('bookmarks:delete', async (_event, id: string) => {
    try {
      return dbOperations.deleteBookmark(id);
    } catch (error) {
      console.error('Error deleting bookmark:', error);
      throw error;
    }
  });

  ipcMain.handle('bookmarks:search', async (_event, searchTerm: string, userEmail?: string) => {
    try {
      return dbOperations.searchBookmarks(searchTerm, userEmail);
    } catch (error) {
      console.error('Error searching bookmarks:', error);
      throw error;
    }
  });

  ipcMain.handle('bookmarks:shareWithUser', async (_event, bookmarkId: string, sharedBy: string, sharedWith: string) => {
    try {
      return dbOperations.createShare({
        item_type: 'bookmark',
        item_id: bookmarkId,
        shared_by: sharedBy,
        shared_with: sharedWith,
      });
    } catch (error) {
      console.error('Error sharing bookmark:', error);
      throw error;
    }
  });

  ipcMain.handle('bookmarks:promoteToTeam', async (_event, bookmarkId: string, userEmail: string) => {
    try {
      return dbOperations.promoteToTeam('bookmark', bookmarkId, userEmail);
    } catch (error) {
      console.error('Error promoting bookmark:', error);
      throw error;
    }
  });
}

// ============ Executables Handlers ============

function registerExecutableHandlers() {
  ipcMain.handle('executables:getAll', async (_event, userEmail?: string) => {
    try {
      return dbOperations.getAllExecutables(userEmail);
    } catch (error) {
      console.error('Error getting executables:', error);
      throw error;
    }
  });

  ipcMain.handle('executables:create', async (_event, executable: any) => {
    try {
      return dbOperations.createExecutable(executable);
    } catch (error) {
      console.error('Error creating executable:', error);
      throw error;
    }
  });

  ipcMain.handle('executables:update', async (_event, id: string, updates: any) => {
    try {
      return dbOperations.updateExecutable(id, updates);
    } catch (error) {
      console.error('Error updating executable:', error);
      throw error;
    }
  });

  ipcMain.handle('executables:delete', async (_event, id: string) => {
    try {
      return dbOperations.deleteExecutable(id);
    } catch (error) {
      console.error('Error deleting executable:', error);
      throw error;
    }
  });

  ipcMain.handle('executables:search', async (_event, searchTerm: string, userEmail?: string) => {
    try {
      return dbOperations.searchExecutables(searchTerm, userEmail);
    } catch (error) {
      console.error('Error searching executables:', error);
      throw error;
    }
  });

  ipcMain.handle('executables:launch', async (_event, executablePath: string, parameters?: string) => {
    try {
      return await scriptExecutor.executeExecutable(executablePath, parameters);
    } catch (error) {
      console.error('Error launching executable:', error);
      throw error;
    }
  });

  ipcMain.handle('executables:extractIcon', async (_event, executablePath: string) => {
    try {
      return await iconService.extractIcon(executablePath);
    } catch (error) {
      console.error('Error extracting icon:', error);
      throw error;
    }
  });

  ipcMain.handle('executables:shareWithUser', async (_event, executableId: string, sharedBy: string, sharedWith: string) => {
    try {
      return dbOperations.createShare({
        item_type: 'executable',
        item_id: executableId,
        shared_by: sharedBy,
        shared_with: sharedWith,
      });
    } catch (error) {
      console.error('Error sharing executable:', error);
      throw error;
    }
  });

  ipcMain.handle('executables:promoteToTeam', async (_event, executableId: string, userEmail: string) => {
    try {
      return dbOperations.promoteToTeam('executable', executableId, userEmail);
    } catch (error) {
      console.error('Error promoting executable:', error);
      throw error;
    }
  });
}

// ============ Scripts Handlers ============

function registerScriptHandlers() {
  ipcMain.handle('scripts:getAll', async (_event, userEmail?: string) => {
    try {
      return dbOperations.getAllScripts(userEmail);
    } catch (error) {
      console.error('Error getting scripts:', error);
      throw error;
    }
  });

  ipcMain.handle('scripts:create', async (_event, script: any) => {
    try {
      return dbOperations.createScript(script);
    } catch (error) {
      console.error('Error creating script:', error);
      throw error;
    }
  });

  ipcMain.handle('scripts:update', async (_event, id: string, updates: any) => {
    try {
      return dbOperations.updateScript(id, updates);
    } catch (error) {
      console.error('Error updating script:', error);
      throw error;
    }
  });

  ipcMain.handle('scripts:delete', async (_event, id: string) => {
    try {
      return dbOperations.deleteScript(id);
    } catch (error) {
      console.error('Error deleting script:', error);
      throw error;
    }
  });

  ipcMain.handle('scripts:search', async (_event, searchTerm: string, userEmail?: string) => {
    try {
      return dbOperations.searchScripts(searchTerm, userEmail);
    } catch (error) {
      console.error('Error searching scripts:', error);
      throw error;
    }
  });

  ipcMain.handle('scripts:execute', async (_event, scriptContent: string, scriptType: 'powershell' | 'cmd') => {
    try {
      if (scriptType === 'powershell') {
        return await scriptExecutor.executePowerShellScript(scriptContent);
      } else {
        return await scriptExecutor.executeCmdScript(scriptContent);
      }
    } catch (error) {
      console.error('Error executing script:', error);
      throw error;
    }
  });

  ipcMain.handle('scripts:copyToClipboard', async (_event, scriptContent: string) => {
    try {
      clipboard.writeText(scriptContent);
      return { success: true };
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      throw error;
    }
  });

  ipcMain.handle('scripts:validateSafety', async (_event, scriptContent: string) => {
    try {
      return scriptExecutor.validateScriptSafety(scriptContent);
    } catch (error) {
      console.error('Error validating script:', error);
      throw error;
    }
  });

  ipcMain.handle('scripts:shareWithUser', async (_event, scriptId: string, sharedBy: string, sharedWith: string) => {
    try {
      return dbOperations.createShare({
        item_type: 'script',
        item_id: scriptId,
        shared_by: sharedBy,
        shared_with: sharedWith,
      });
    } catch (error) {
      console.error('Error sharing script:', error);
      throw error;
    }
  });

  ipcMain.handle('scripts:promoteToTeam', async (_event, scriptId: string, userEmail: string) => {
    try {
      return dbOperations.promoteToTeam('script', scriptId, userEmail);
    } catch (error) {
      console.error('Error promoting script:', error);
      throw error;
    }
  });
}

// ============ Sync Handlers ============

function registerSyncHandlers() {
  ipcMain.handle('sync:manual', async () => {
    try {
      return await syncEngine.manualSync();
    } catch (error) {
      console.error('Error during manual sync:', error);
      throw error;
    }
  });

  ipcMain.handle('sync:getStatus', async () => {
    try {
      return syncEngine.getSyncStatus();
    } catch (error) {
      console.error('Error getting sync status:', error);
      throw error;
    }
  });

  ipcMain.handle('sync:startLongPolling', async () => {
    try {
      syncEngine.startSyncPolling();
      return { success: true };
    } catch (error) {
      console.error('Error starting sync polling:', error);
      throw error;
    }
  });

  ipcMain.handle('sync:stopLongPolling', async () => {
    try {
      syncEngine.stopSyncPolling();
      return { success: true };
    } catch (error) {
      console.error('Error stopping sync polling:', error);
      throw error;
    }
  });
}

// ============ Auth Handlers ============

function registerAuthHandlers(mainWindow: BrowserWindow) {
  ipcMain.handle('auth:login', async () => {
    try {
      return await authService.login(mainWindow);
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  });

  ipcMain.handle('auth:logout', async () => {
    try {
      return await authService.logout();
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  });

  ipcMain.handle('auth:getUser', async () => {
    try {
      return authService.getCurrentUser();
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  });

  ipcMain.handle('auth:getUserEmail', async () => {
    try {
      return authService.getCurrentUserEmail();
    } catch (error) {
      console.error('Error getting user email:', error);
      throw error;
    }
  });

  ipcMain.handle('auth:isAuthenticated', async () => {
    try {
      return authService.isAuthenticated();
    } catch (error) {
      console.error('Error checking authentication:', error);
      throw error;
    }
  });

  ipcMain.handle('auth:restoreSession', async () => {
    try {
      return await authService.restoreSession();
    } catch (error) {
      console.error('Error restoring session:', error);
      throw error;
    }
  });

  ipcMain.handle('auth:initializeAuth', async (_event, config: any) => {
    try {
      await authService.initializeAuth(config);
      return { success: true };
    } catch (error) {
      console.error('Error initializing auth:', error);
      throw error;
    }
  });
}

// ============ System Handlers ============

function registerSystemHandlers() {
  ipcMain.handle('system:pickFile', async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
          { name: 'Executables', extensions: ['exe', 'bat', 'cmd', 'ps1', 'lnk'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (result.canceled || result.filePaths.length === 0) {
        return null;
      }

      return result.filePaths[0];
    } catch (error) {
      console.error('Error picking file:', error);
      throw error;
    }
  });

  ipcMain.handle('system:openExternal', async (_event, url: string) => {
    try {
      await shell.openExternal(url);
      return { success: true };
    } catch (error) {
      console.error('Error opening external URL:', error);
      throw error;
    }
  });

  ipcMain.handle('system:getFavicon', async (_event, url: string) => {
    try {
      return await faviconService.fetchFavicon(url);
    } catch (error) {
      console.error('Error fetching favicon:', error);
      // Return null instead of throwing - favicon is optional
      return null;
    }
  });

  ipcMain.handle('system:getAppIcon', async (_event, executablePath: string) => {
    try {
      return await iconService.extractIcon(executablePath);
    } catch (error) {
      console.error('Error getting app icon:', error);
      // Return null instead of throwing - icon is optional
      return null;
    }
  });

  ipcMain.handle('system:getDefaultPowerShellIcon', async () => {
    try {
      return iconService.getDefaultPowerShellIcon();
    } catch (error) {
      console.error('Error getting default PowerShell icon:', error);
      throw error;
    }
  });

  ipcMain.handle('system:getDefaultCmdIcon', async () => {
    try {
      return iconService.getDefaultCmdIcon();
    } catch (error) {
      console.error('Error getting default CMD icon:', error);
      throw error;
    }
  });
}

// ============ MySQL Handlers ============

function registerMySQLHandlers() {
  ipcMain.handle('mysql:initialize', async (_event, config: any, env: 'dev' | 'prod') => {
    try {
      await mysqlConnection.initializeMySQLConnection(config, env);
      return { success: true };
    } catch (error) {
      console.error('Error initializing MySQL:', error);
      throw error;
    }
  });

  ipcMain.handle('mysql:testConnection', async () => {
    try {
      return await mysqlConnection.testConnection();
    } catch (error) {
      console.error('Error testing MySQL connection:', error);
      throw error;
    }
  });

  ipcMain.handle('mysql:saveConfig', async (_event, config: any, env: 'dev' | 'prod') => {
    try {
      mysqlConnection.saveMySQLConfig(config, env);
      return { success: true };
    } catch (error) {
      console.error('Error saving MySQL config:', error);
      throw error;
    }
  });

  ipcMain.handle('mysql:getConfig', async (_event, env: 'dev' | 'prod') => {
    try {
      return mysqlConnection.getMySQLConfigFromSettings(env);
    } catch (error) {
      console.error('Error getting MySQL config:', error);
      throw error;
    }
  });

  ipcMain.handle('mysql:switchEnvironment', async (_event, env: 'dev' | 'prod') => {
    try {
      await mysqlConnection.switchEnvironment(env);
      return { success: true };
    } catch (error) {
      console.error('Error switching MySQL environment:', error);
      throw error;
    }
  });

  ipcMain.handle('mysql:isConnected', async () => {
    try {
      return mysqlConnection.isConnected();
    } catch (error) {
      console.error('Error checking MySQL connection:', error);
      throw error;
    }
  });

  ipcMain.handle('mysql:initializeTables', async () => {
    try {
      await mysqlConnection.initializeMySQLTables();
      return { success: true };
    } catch (error) {
      console.error('Error initializing MySQL tables:', error);
      throw error;
    }
  });
}

// ============ Update Handlers ============

function registerUpdateHandlers() {
  ipcMain.handle('updates:check', async () => {
    try {
      return await autoUpdater.checkForUpdates();
    } catch (error) {
      console.error('Error checking for updates:', error);
      throw error;
    }
  });

  ipcMain.handle('updates:download', async () => {
    try {
      return await autoUpdater.downloadUpdate();
    } catch (error) {
      console.error('Error downloading update:', error);
      throw error;
    }
  });

  ipcMain.handle('updates:install', async () => {
    try {
      autoUpdater.quitAndInstall();
      return { success: true };
    } catch (error) {
      console.error('Error installing update:', error);
      throw error;
    }
  });
}


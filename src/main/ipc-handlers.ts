/**
 * IPC Handlers for Database Operations and App Updates
 * Exposes secure database operations and update controls to the renderer process
 */

import { ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import { dbOperations } from './db-operations';
import { db, getDatabasePath } from './database';

/**
 * Register all IPC handlers for database operations
 * Call this in main.ts after database initialization
 */
export function registerDatabaseHandlers() {
  // ============ Settings Operations ============
  
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

  ipcMain.handle('db:deleteSetting', async (_event, key: string) => {
    try {
      return dbOperations.deleteSetting(key);
    } catch (error) {
      console.error('Error deleting setting:', error);
      throw error;
    }
  });

  // ============ User Preferences Operations ============

  ipcMain.handle('db:getPreference', async (_event, category: string, preferenceKey: string) => {
    try {
      return dbOperations.getPreference(category, preferenceKey);
    } catch (error) {
      console.error('Error getting preference:', error);
      throw error;
    }
  });

  ipcMain.handle('db:setPreference', async (_event, category: string, preferenceKey: string, preferenceValue: string) => {
    try {
      return dbOperations.setPreference(category, preferenceKey, preferenceValue);
    } catch (error) {
      console.error('Error setting preference:', error);
      throw error;
    }
  });

  ipcMain.handle('db:getPreferencesByCategory', async (_event, category: string) => {
    try {
      return dbOperations.getPreferencesByCategory(category);
    } catch (error) {
      console.error('Error getting preferences by category:', error);
      throw error;
    }
  });

  ipcMain.handle('db:getAllPreferences', async () => {
    try {
      return dbOperations.getAllPreferences();
    } catch (error) {
      console.error('Error getting all preferences:', error);
      throw error;
    }
  });

  ipcMain.handle('db:deletePreference', async (_event, category: string, preferenceKey: string) => {
    try {
      return dbOperations.deletePreference(category, preferenceKey);
    } catch (error) {
      console.error('Error deleting preference:', error);
      throw error;
    }
  });

  // ============ Utility Operations ============

  ipcMain.handle('db:getStats', async () => {
    try {
      return dbOperations.getStats();
    } catch (error) {
      console.error('Error getting stats:', error);
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

  ipcMain.handle('db:getDatabaseSize', async () => {
    try {
      const result = db.prepare("SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()").get() as { size: number };
      return {
        bytes: result.size,
        kilobytes: (result.size / 1024).toFixed(2),
        megabytes: (result.size / 1024 / 1024).toFixed(2),
      };
    } catch (error) {
      console.error('Error getting database size:', error);
      throw error;
    }
  });

  ipcMain.handle('db:testTransaction', async () => {
    try {
      const result = dbOperations.transaction(() => {
        dbOperations.setSetting('transaction_test', new Date().toISOString());
        dbOperations.setPreference('test', 'transaction_key', 'transaction_value');
        return { success: true, timestamp: new Date().toISOString() };
      });
      return result;
    } catch (error) {
      console.error('Error testing transaction:', error);
      throw error;
    }
  });

  ipcMain.handle('db:clearAllData', async () => {
    try {
      db.exec('DELETE FROM app_settings');
      db.exec('DELETE FROM user_preferences');
      return { success: true, message: 'All data cleared' };
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  });

  console.log('✅ Database IPC handlers registered');
}

/**
 * Register IPC handlers for app updates
 * Call this in main.ts after app is ready
 */
export function registerUpdateHandlers() {
  // Check for updates manually
  ipcMain.handle('update:check', async () => {
    try {
      return await autoUpdater.checkForUpdates();
    } catch (error) {
      console.error('Error checking for updates:', error);
      throw error;
    }
  });

  // Download update
  ipcMain.handle('update:download', async () => {
    try {
      return await autoUpdater.downloadUpdate();
    } catch (error) {
      console.error('Error downloading update:', error);
      throw error;
    }
  });

  // Install update and restart
  ipcMain.handle('update:install', async () => {
    autoUpdater.quitAndInstall(false, true);
  });

  console.log('✅ Update IPC handlers registered');
}


import { contextBridge, ipcRenderer } from 'electron';

console.log('🔧 Preload script is executing...');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // Example IPC methods - add your own as needed
  send: (channel: string, data: any) => {
    // Whitelist channels
    const validChannels = ['toMain'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  receive: (channel: string, func: (...args: any[]) => void) => {
    const validChannels = ['fromMain', 'update-available', 'update-downloaded'];
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender`
      ipcRenderer.on(channel, (_event, ...args) => func(...args));
    }
  },
  invoke: async (channel: string, data?: any) => {
    const validChannels = ['getAppVersion'];
    if (validChannels.includes(channel)) {
      return await ipcRenderer.invoke(channel, data);
    }
  },
});

// Expose database operations to renderer process
console.log('🔧 Exposing window.database API...');
contextBridge.exposeInMainWorld('database', {
  // Settings operations
  getSetting: (key: string) => ipcRenderer.invoke('db:getSetting', key),
  setSetting: (key: string, value: string) => ipcRenderer.invoke('db:setSetting', key, value),
  getAllSettings: () => ipcRenderer.invoke('db:getAllSettings'),
  deleteSetting: (key: string) => ipcRenderer.invoke('db:deleteSetting', key),
  
  // Preferences operations
  getPreference: (category: string, preferenceKey: string) => 
    ipcRenderer.invoke('db:getPreference', category, preferenceKey),
  setPreference: (category: string, preferenceKey: string, preferenceValue: string) => 
    ipcRenderer.invoke('db:setPreference', category, preferenceKey, preferenceValue),
  getPreferencesByCategory: (category: string) => 
    ipcRenderer.invoke('db:getPreferencesByCategory', category),
  getAllPreferences: () => ipcRenderer.invoke('db:getAllPreferences'),
  deletePreference: (category: string, preferenceKey: string) => 
    ipcRenderer.invoke('db:deletePreference', category, preferenceKey),
  
  // Utility operations
  getStats: () => ipcRenderer.invoke('db:getStats'),
  getDatabasePath: () => ipcRenderer.invoke('db:getDatabasePath'),
  getDatabaseSize: () => ipcRenderer.invoke('db:getDatabaseSize'),
  testTransaction: () => ipcRenderer.invoke('db:testTransaction'),
  clearAllData: () => ipcRenderer.invoke('db:clearAllData'),
});

// Expose app update operations to renderer process
console.log('🔧 Exposing window.updates API...');
contextBridge.exposeInMainWorld('updates', {
  checkForUpdates: () => ipcRenderer.invoke('update:check'),
  downloadUpdate: () => ipcRenderer.invoke('update:download'),
  installUpdate: () => ipcRenderer.invoke('update:install'),
  onUpdateAvailable: (callback: (info: any) => void) => {
    ipcRenderer.on('update-available', (_event, info) => callback(info));
  },
  onUpdateDownloaded: (callback: (info: any) => void) => {
    ipcRenderer.on('update-downloaded', (_event, info) => callback(info));
  },
});

console.log('✅ Preload script completed successfully');

// Type declarations for the exposed APIs
declare global {
  interface Window {
    electron: {
      send: (channel: string, data: any) => void;
      receive: (channel: string, func: (...args: any[]) => void) => void;
      invoke: (channel: string, data?: any) => Promise<any>;
    };
    database: {
      // Settings
      getSetting: (key: string) => Promise<{ key: string; value: string; updated_at: string } | undefined>;
      setSetting: (key: string, value: string) => Promise<any>;
      getAllSettings: () => Promise<any[]>;
      deleteSetting: (key: string) => Promise<any>;
      // Preferences
      getPreference: (category: string, preferenceKey: string) => Promise<any>;
      setPreference: (category: string, preferenceKey: string, preferenceValue: string) => Promise<any>;
      getPreferencesByCategory: (category: string) => Promise<any[]>;
      getAllPreferences: () => Promise<any[]>;
      deletePreference: (category: string, preferenceKey: string) => Promise<any>;
      // Utilities
      getStats: () => Promise<{ settings: number; preferences: number }>;
      getDatabasePath: () => Promise<string>;
      getDatabaseSize: () => Promise<{ bytes: number; kilobytes: string; megabytes: string }>;
      testTransaction: () => Promise<{ success: boolean; timestamp: string }>;
      clearAllData: () => Promise<{ success: boolean; message: string }>;
    };
    updates: {
      checkForUpdates: () => Promise<any>;
      downloadUpdate: () => Promise<any>;
      installUpdate: () => Promise<void>;
      onUpdateAvailable: (callback: (info: any) => void) => void;
      onUpdateDownloaded: (callback: (info: any) => void) => void;
    };
  }
}


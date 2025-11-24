import { contextBridge, ipcRenderer } from 'electron';

console.log('🔧 Preload script is executing...');

// ============ Database (Settings & Preferences) API ============
contextBridge.exposeInMainWorld('database', {
  getSetting: (key: string) => ipcRenderer.invoke('db:getSetting', key),
  setSetting: (key: string, value: string) => ipcRenderer.invoke('db:setSetting', key, value),
  getAllSettings: () => ipcRenderer.invoke('db:getAllSettings'),
  getDatabasePath: () => ipcRenderer.invoke('db:getDatabasePath'),
  getStats: () => ipcRenderer.invoke('db:getStats'),
});

// ============ Bookmarks API ============
contextBridge.exposeInMainWorld('bookmarks', {
  getAll: (userEmail?: string) => ipcRenderer.invoke('bookmarks:getAll', userEmail),
  create: (bookmark: any) => ipcRenderer.invoke('bookmarks:create', bookmark),
  update: (id: string, updates: any) => ipcRenderer.invoke('bookmarks:update', id, updates),
  delete: (id: string) => ipcRenderer.invoke('bookmarks:delete', id),
  search: (searchTerm: string, userEmail?: string) => ipcRenderer.invoke('bookmarks:search', searchTerm, userEmail),
  shareWithUser: (bookmarkId: string, sharedBy: string, sharedWith: string) => 
    ipcRenderer.invoke('bookmarks:shareWithUser', bookmarkId, sharedBy, sharedWith),
  promoteToTeam: (bookmarkId: string, userEmail: string) => 
    ipcRenderer.invoke('bookmarks:promoteToTeam', bookmarkId, userEmail),
});

// ============ Executables API ============
contextBridge.exposeInMainWorld('executables', {
  getAll: (userEmail?: string) => ipcRenderer.invoke('executables:getAll', userEmail),
  create: (executable: any) => ipcRenderer.invoke('executables:create', executable),
  update: (id: string, updates: any) => ipcRenderer.invoke('executables:update', id, updates),
  delete: (id: string) => ipcRenderer.invoke('executables:delete', id),
  search: (searchTerm: string, userEmail?: string) => ipcRenderer.invoke('executables:search', searchTerm, userEmail),
  launch: (executablePath: string, parameters?: string) => 
    ipcRenderer.invoke('executables:launch', executablePath, parameters),
  extractIcon: (executablePath: string) => ipcRenderer.invoke('executables:extractIcon', executablePath),
  shareWithUser: (executableId: string, sharedBy: string, sharedWith: string) => 
    ipcRenderer.invoke('executables:shareWithUser', executableId, sharedBy, sharedWith),
  promoteToTeam: (executableId: string, userEmail: string) => 
    ipcRenderer.invoke('executables:promoteToTeam', executableId, userEmail),
});

// ============ Scripts API ============
contextBridge.exposeInMainWorld('scripts', {
  getAll: (userEmail?: string) => ipcRenderer.invoke('scripts:getAll', userEmail),
  create: (script: any) => ipcRenderer.invoke('scripts:create', script),
  update: (id: string, updates: any) => ipcRenderer.invoke('scripts:update', id, updates),
  delete: (id: string) => ipcRenderer.invoke('scripts:delete', id),
  search: (searchTerm: string, userEmail?: string) => ipcRenderer.invoke('scripts:search', searchTerm, userEmail),
  execute: (scriptContent: string, scriptType: 'powershell' | 'cmd') => 
    ipcRenderer.invoke('scripts:execute', scriptContent, scriptType),
  copyToClipboard: (scriptContent: string) => ipcRenderer.invoke('scripts:copyToClipboard', scriptContent),
  validateSafety: (scriptContent: string) => ipcRenderer.invoke('scripts:validateSafety', scriptContent),
  shareWithUser: (scriptId: string, sharedBy: string, sharedWith: string) => 
    ipcRenderer.invoke('scripts:shareWithUser', scriptId, sharedBy, sharedWith),
  promoteToTeam: (scriptId: string, userEmail: string) => 
    ipcRenderer.invoke('scripts:promoteToTeam', scriptId, userEmail),
});

// ============ Sync API ============
contextBridge.exposeInMainWorld('sync', {
  manual: () => ipcRenderer.invoke('sync:manual'),
  getStatus: () => ipcRenderer.invoke('sync:getStatus'),
  startLongPolling: () => ipcRenderer.invoke('sync:startLongPolling'),
  stopLongPolling: () => ipcRenderer.invoke('sync:stopLongPolling'),
});

// ============ Auth API ============
contextBridge.exposeInMainWorld('auth', {
  login: () => ipcRenderer.invoke('auth:login'),
  logout: () => ipcRenderer.invoke('auth:logout'),
  getUser: () => ipcRenderer.invoke('auth:getUser'),
  getUserEmail: () => ipcRenderer.invoke('auth:getUserEmail'),
  isAuthenticated: () => ipcRenderer.invoke('auth:isAuthenticated'),
  restoreSession: () => ipcRenderer.invoke('auth:restoreSession'),
  initializeAuth: (config: any) => ipcRenderer.invoke('auth:initializeAuth', config),
  onDeviceCode: (callback: (response: any) => void) => {
    ipcRenderer.on('auth:device-code', (_event, response) => callback(response));
  },
});

// ============ System API ============
contextBridge.exposeInMainWorld('system', {
  pickFile: () => ipcRenderer.invoke('system:pickFile'),
  openExternal: (url: string) => ipcRenderer.invoke('system:openExternal', url),
  getFavicon: (url: string) => ipcRenderer.invoke('system:getFavicon', url),
  getAppIcon: (executablePath: string) => ipcRenderer.invoke('system:getAppIcon', executablePath),
  getDefaultPowerShellIcon: () => ipcRenderer.invoke('system:getDefaultPowerShellIcon'),
  getDefaultCmdIcon: () => ipcRenderer.invoke('system:getDefaultCmdIcon'),
});

// ============ MySQL API ============
contextBridge.exposeInMainWorld('mysql', {
  initialize: (config: any, env: 'dev' | 'prod') => ipcRenderer.invoke('mysql:initialize', config, env),
  testConnection: () => ipcRenderer.invoke('mysql:testConnection'),
  saveConfig: (config: any, env: 'dev' | 'prod') => ipcRenderer.invoke('mysql:saveConfig', config, env),
  getConfig: (env: 'dev' | 'prod') => ipcRenderer.invoke('mysql:getConfig', env),
  switchEnvironment: (env: 'dev' | 'prod') => ipcRenderer.invoke('mysql:switchEnvironment', env),
  isConnected: () => ipcRenderer.invoke('mysql:isConnected'),
  initializeTables: () => ipcRenderer.invoke('mysql:initializeTables'),
});

// ============ Updates API ============
contextBridge.exposeInMainWorld('updates', {
  check: () => ipcRenderer.invoke('updates:check'),
  download: () => ipcRenderer.invoke('updates:download'),
  install: () => ipcRenderer.invoke('updates:install'),
  onUpdateAvailable: (callback: (info: any) => void) => {
    ipcRenderer.on('update-available', (_event, info) => callback(info));
  },
  onUpdateDownloaded: (callback: (info: any) => void) => {
    ipcRenderer.on('update-downloaded', (_event, info) => callback(info));
  },
});

console.log('✅ Preload script completed successfully');

// ============ TypeScript Declarations ============
declare global {
  interface Window {
    database: {
      getSetting: (key: string) => Promise<{ key: string; value: string; updated_at: string } | undefined>;
      setSetting: (key: string, value: string) => Promise<any>;
      getAllSettings: () => Promise<any[]>;
      getDatabasePath: () => Promise<string>;
      getStats: () => Promise<any>;
    };
    bookmarks: {
      getAll: (userEmail?: string) => Promise<any[]>;
      create: (bookmark: any) => Promise<string>;
      update: (id: string, updates: any) => Promise<any>;
      delete: (id: string) => Promise<any>;
      search: (searchTerm: string, userEmail?: string) => Promise<any[]>;
      shareWithUser: (bookmarkId: string, sharedBy: string, sharedWith: string) => Promise<string>;
      promoteToTeam: (bookmarkId: string, userEmail: string) => Promise<any>;
    };
    executables: {
      getAll: (userEmail?: string) => Promise<any[]>;
      create: (executable: any) => Promise<string>;
      update: (id: string, updates: any) => Promise<any>;
      delete: (id: string) => Promise<any>;
      search: (searchTerm: string, userEmail?: string) => Promise<any[]>;
      launch: (executablePath: string, parameters?: string) => Promise<any>;
      extractIcon: (executablePath: string) => Promise<string | null>;
      shareWithUser: (executableId: string, sharedBy: string, sharedWith: string) => Promise<string>;
      promoteToTeam: (executableId: string, userEmail: string) => Promise<any>;
    };
    scripts: {
      getAll: (userEmail?: string) => Promise<any[]>;
      create: (script: any) => Promise<string>;
      update: (id: string, updates: any) => Promise<any>;
      delete: (id: string) => Promise<any>;
      search: (searchTerm: string, userEmail?: string) => Promise<any[]>;
      execute: (scriptContent: string, scriptType: 'powershell' | 'cmd') => Promise<any>;
      copyToClipboard: (scriptContent: string) => Promise<any>;
      validateSafety: (scriptContent: string) => Promise<{ safe: boolean; warnings: string[] }>;
      shareWithUser: (scriptId: string, sharedBy: string, sharedWith: string) => Promise<string>;
      promoteToTeam: (scriptId: string, userEmail: string) => Promise<any>;
    };
    sync: {
      manual: () => Promise<any>;
      getStatus: () => Promise<any>;
      startLongPolling: () => Promise<any>;
      stopLongPolling: () => Promise<any>;
    };
    auth: {
      login: () => Promise<any>;
      logout: () => Promise<void>;
      getUser: () => Promise<any>;
      getUserEmail: () => Promise<string | null>;
      isAuthenticated: () => Promise<boolean>;
      restoreSession: () => Promise<boolean>;
      initializeAuth: (config: any) => Promise<any>;
      onDeviceCode: (callback: (response: any) => void) => void;
    };
    system: {
      pickFile: () => Promise<string | null>;
      openExternal: (url: string) => Promise<any>;
      getFavicon: (url: string) => Promise<string | null>;
      getAppIcon: (executablePath: string) => Promise<string | null>;
      getDefaultPowerShellIcon: () => Promise<string>;
      getDefaultCmdIcon: () => Promise<string>;
    };
    mysql: {
      initialize: (config: any, env: 'dev' | 'prod') => Promise<any>;
      testConnection: () => Promise<boolean>;
      saveConfig: (config: any, env: 'dev' | 'prod') => Promise<any>;
      getConfig: (env: 'dev' | 'prod') => Promise<any>;
      switchEnvironment: (env: 'dev' | 'prod') => Promise<any>;
      isConnected: () => Promise<boolean>;
      initializeTables: () => Promise<any>;
    };
    updates: {
      check: () => Promise<any>;
      download: () => Promise<any>;
      install: () => Promise<void>;
      onUpdateAvailable: (callback: (info: any) => void) => void;
      onUpdateDownloaded: (callback: (info: any) => void) => void;
    };
  }
}

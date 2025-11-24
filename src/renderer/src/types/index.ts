// Type definitions for the application

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  category?: string;
  is_team_level: number;
  is_personal: number;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  last_sync_at?: string;
  sync_hash?: string;
}

export interface Executable {
  id: string;
  title: string;
  executable_path: string;
  parameters?: string;
  icon?: string;
  category?: string;
  is_team_level: number;
  is_personal: number;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  last_sync_at?: string;
  sync_hash?: string;
}

export interface Script {
  id: string;
  title: string;
  script_content: string;
  script_type: 'powershell' | 'cmd';
  icon?: string;
  category?: string;
  is_team_level: number;
  is_personal: number;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  last_sync_at?: string;
  sync_hash?: string;
}

export interface UserShare {
  id: string;
  item_type: 'bookmark' | 'executable' | 'script';
  item_id: string;
  shared_by: string;
  shared_with: string;
  shared_at: string;
}

export interface SyncStatus {
  isSyncing: boolean;
  lastSyncTime: Date | null;
  lastSyncResult: {
    success: boolean;
    itemsSynced: number;
    conflicts: number;
    errors: string[];
  } | null;
}

export interface ScriptExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  error?: string;
}

export interface MySQLConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export interface AzureADConfig {
  clientId: string;
  authority: string;
  redirectUri: string;
}

export type ViewType = 'bookmarks' | 'executables' | 'scripts' | 'settings';


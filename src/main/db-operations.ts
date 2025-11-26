import { db } from './database';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

// ============ Type Definitions ============

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

// ============ Helper Functions ============

/**
 * Generate sync hash for conflict detection
 */
function generateSyncHash(data: any): string {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

// ============ Database Operations ============

export const dbOperations = {
  // ============ Settings Operations ============
  
  getSetting: (key: string): { key: string; value: string; updated_at: string } | undefined => {
    const stmt = db.prepare('SELECT * FROM app_settings WHERE key = ?');
    return stmt.get(key) as any;
  },

  setSetting: (key: string, value: string) => {
    const stmt = db.prepare(`
      INSERT INTO app_settings (key, value, updated_at) 
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET 
        value = excluded.value, 
        updated_at = CURRENT_TIMESTAMP
    `);
    return stmt.run(key, value);
  },

  getAllSettings: () => {
    const stmt = db.prepare('SELECT * FROM app_settings ORDER BY key');
    return stmt.all();
  },

  deleteSetting: (key: string) => {
    const stmt = db.prepare('DELETE FROM app_settings WHERE key = ?');
    return stmt.run(key);
  },

  // ============ User Preferences Operations ============

  getPreference: (category: string, preferenceKey: string) => {
    const stmt = db.prepare(`
      SELECT * FROM user_preferences 
      WHERE category = ? AND preference_key = ?
    `);
    return stmt.get(category, preferenceKey);
  },

  setPreference: (category: string, preferenceKey: string, preferenceValue: string) => {
    const stmt = db.prepare(`
      INSERT INTO user_preferences (category, preference_key, preference_value) 
      VALUES (?, ?, ?)
      ON CONFLICT(category, preference_key) DO UPDATE SET 
        preference_value = excluded.preference_value
    `);
    return stmt.run(category, preferenceKey, preferenceValue);
  },

  getPreferencesByCategory: (category: string) => {
    const stmt = db.prepare(`
      SELECT * FROM user_preferences 
      WHERE category = ? 
      ORDER BY preference_key
    `);
    return stmt.all(category);
  },

  getAllPreferences: () => {
    const stmt = db.prepare(`
      SELECT * FROM user_preferences 
      ORDER BY category, preference_key
    `);
    return stmt.all();
  },

  deletePreference: (category: string, preferenceKey: string) => {
    const stmt = db.prepare(`
      DELETE FROM user_preferences 
      WHERE category = ? AND preference_key = ?
    `);
    return stmt.run(category, preferenceKey);
  },

  // ============ Bookmarks Operations ============

  createBookmark: (bookmark: Omit<Bookmark, 'id' | 'created_at' | 'updated_at' | 'sync_hash'>) => {
    const id = uuidv4();
    const sync_hash = generateSyncHash({ ...bookmark, id });
    
    const stmt = db.prepare(`
      INSERT INTO bookmarks (
        id, title, url, favicon, category, tags, is_team_level, is_personal, 
        created_by, updated_by, sync_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id, bookmark.title, bookmark.url, bookmark.favicon, bookmark.category,
      bookmark.tags, bookmark.is_team_level, bookmark.is_personal, bookmark.created_by,
      bookmark.updated_by, sync_hash
    );
    
    return id;
  },

  getBookmark: (id: string): Bookmark | undefined => {
    const stmt = db.prepare('SELECT * FROM bookmarks WHERE id = ?');
    return stmt.get(id) as Bookmark | undefined;
  },

  getAllBookmarks: (userEmail?: string): Bookmark[] => {
    let query = 'SELECT * FROM bookmarks WHERE 1=1';
    const params: any[] = [];
    
    if (userEmail) {
      query += ' AND (is_team_level = 1 OR created_by = ?)';
      params.push(userEmail);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const stmt = db.prepare(query);
    return stmt.all(...params) as Bookmark[];
  },

  searchBookmarks: (searchTerm: string, userEmail?: string): Bookmark[] => {
    let query = `
      SELECT * FROM bookmarks 
      WHERE (title LIKE ? OR url LIKE ? OR category LIKE ?)
    `;
    const params: any[] = [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`];
    
    if (userEmail) {
      query += ' AND (is_team_level = 1 OR created_by = ?)';
      params.push(userEmail);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const stmt = db.prepare(query);
    return stmt.all(...params) as Bookmark[];
  },

  updateBookmark: (id: string, updates: Partial<Bookmark>) => {
    const current = dbOperations.getBookmark(id);
    if (!current) throw new Error('Bookmark not found');
    
    const updated = { ...current, ...updates };
    const sync_hash = generateSyncHash(updated);
    
    const stmt = db.prepare(`
      UPDATE bookmarks 
      SET title = ?, url = ?, favicon = ?, category = ?, tags = ?,
          is_team_level = ?, is_personal = ?, updated_by = ?,
          updated_at = CURRENT_TIMESTAMP, sync_hash = ?
      WHERE id = ?
    `);
    
    return stmt.run(
      updated.title, updated.url, updated.favicon, updated.category, updated.tags,
      updated.is_team_level, updated.is_personal, updated.updated_by,
      sync_hash, id
    );
  },

  deleteBookmark: (id: string) => {
    const stmt = db.prepare('DELETE FROM bookmarks WHERE id = ?');
    return stmt.run(id);
  },

  // ============ Executables Operations ============

  createExecutable: (executable: Omit<Executable, 'id' | 'created_at' | 'updated_at' | 'sync_hash'>) => {
    const id = uuidv4();
    const sync_hash = generateSyncHash({ ...executable, id });
    
    const stmt = db.prepare(`
      INSERT INTO executables (
        id, title, executable_path, parameters, icon, category, tags,
        is_team_level, is_personal, created_by, updated_by, sync_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id, executable.title, executable.executable_path, executable.parameters,
      executable.icon, executable.category, executable.tags, executable.is_team_level,
      executable.is_personal, executable.created_by, executable.updated_by, sync_hash
    );
    
    return id;
  },

  getExecutable: (id: string): Executable | undefined => {
    const stmt = db.prepare('SELECT * FROM executables WHERE id = ?');
    return stmt.get(id) as Executable | undefined;
  },

  getAllExecutables: (userEmail?: string): Executable[] => {
    let query = 'SELECT * FROM executables WHERE 1=1';
    const params: any[] = [];
    
    if (userEmail) {
      query += ' AND (is_team_level = 1 OR created_by = ?)';
      params.push(userEmail);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const stmt = db.prepare(query);
    return stmt.all(...params) as Executable[];
  },

  searchExecutables: (searchTerm: string, userEmail?: string): Executable[] => {
    let query = `
      SELECT * FROM executables 
      WHERE (title LIKE ? OR executable_path LIKE ? OR category LIKE ?)
    `;
    const params: any[] = [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`];
    
    if (userEmail) {
      query += ' AND (is_team_level = 1 OR created_by = ?)';
      params.push(userEmail);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const stmt = db.prepare(query);
    return stmt.all(...params) as Executable[];
  },

  updateExecutable: (id: string, updates: Partial<Executable>) => {
    const current = dbOperations.getExecutable(id);
    if (!current) throw new Error('Executable not found');
    
    const updated = { ...current, ...updates };
    const sync_hash = generateSyncHash(updated);
    
    const stmt = db.prepare(`
      UPDATE executables 
      SET title = ?, executable_path = ?, parameters = ?, icon = ?, category = ?, tags = ?,
          is_team_level = ?, is_personal = ?, updated_by = ?,
          updated_at = CURRENT_TIMESTAMP, sync_hash = ?
      WHERE id = ?
    `);
    
    return stmt.run(
      updated.title, updated.executable_path, updated.parameters, updated.icon,
      updated.category, updated.tags, updated.is_team_level, updated.is_personal,
      updated.updated_by, sync_hash, id
    );
  },

  deleteExecutable: (id: string) => {
    const stmt = db.prepare('DELETE FROM executables WHERE id = ?');
    return stmt.run(id);
  },

  // ============ Scripts Operations ============

  createScript: (script: Omit<Script, 'id' | 'created_at' | 'updated_at' | 'sync_hash'>) => {
    const id = uuidv4();
    const sync_hash = generateSyncHash({ ...script, id });
    
    const stmt = db.prepare(`
      INSERT INTO scripts (
        id, title, script_content, script_type, icon, category, tags,
        is_team_level, is_personal, created_by, updated_by, sync_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id, script.title, script.script_content, script.script_type,
      script.icon, script.category, script.tags, script.is_team_level,
      script.is_personal, script.created_by, script.updated_by, sync_hash
    );
    
    return id;
  },

  getScript: (id: string): Script | undefined => {
    const stmt = db.prepare('SELECT * FROM scripts WHERE id = ?');
    return stmt.get(id) as Script | undefined;
  },

  getAllScripts: (userEmail?: string): Script[] => {
    let query = 'SELECT * FROM scripts WHERE 1=1';
    const params: any[] = [];
    
    if (userEmail) {
      query += ' AND (is_team_level = 1 OR created_by = ?)';
      params.push(userEmail);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const stmt = db.prepare(query);
    return stmt.all(...params) as Script[];
  },

  searchScripts: (searchTerm: string, userEmail?: string): Script[] => {
    let query = `
      SELECT * FROM scripts 
      WHERE (title LIKE ? OR script_content LIKE ? OR category LIKE ?)
    `;
    const params: any[] = [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`];
    
    if (userEmail) {
      query += ' AND (is_team_level = 1 OR created_by = ?)';
      params.push(userEmail);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const stmt = db.prepare(query);
    return stmt.all(...params) as Script[];
  },

  updateScript: (id: string, updates: Partial<Script>) => {
    const current = dbOperations.getScript(id);
    if (!current) throw new Error('Script not found');
    
    const updated = { ...current, ...updates };
    const sync_hash = generateSyncHash(updated);
    
    const stmt = db.prepare(`
      UPDATE scripts 
      SET title = ?, script_content = ?, script_type = ?, icon = ?, category = ?, tags = ?,
          is_team_level = ?, is_personal = ?, updated_by = ?,
          updated_at = CURRENT_TIMESTAMP, sync_hash = ?
      WHERE id = ?
    `);
    
    return stmt.run(
      updated.title, updated.script_content, updated.script_type, updated.icon,
      updated.category, updated.tags, updated.is_team_level, updated.is_personal,
      updated.updated_by, sync_hash, id
    );
  },

  deleteScript: (id: string) => {
    const stmt = db.prepare('DELETE FROM scripts WHERE id = ?');
    return stmt.run(id);
  },

  // ============ User Shares Operations ============

  createShare: (share: Omit<UserShare, 'id' | 'shared_at'>) => {
    const id = uuidv4();
    
    const stmt = db.prepare(`
      INSERT INTO user_shares (id, item_type, item_id, shared_by, shared_with)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run(id, share.item_type, share.item_id, share.shared_by, share.shared_with);
    return id;
  },

  getSharesForUser: (userEmail: string): UserShare[] => {
    const stmt = db.prepare(`
      SELECT * FROM user_shares 
      WHERE shared_with = ?
      ORDER BY shared_at DESC
    `);
    return stmt.all(userEmail) as UserShare[];
  },

  deleteShare: (id: string) => {
    const stmt = db.prepare('DELETE FROM user_shares WHERE id = ?');
    return stmt.run(id);
  },

  // ============ Promotion Operations ============

  promoteToTeam: (itemType: 'bookmark' | 'executable' | 'script', itemId: string, userEmail: string) => {
    const table = itemType === 'bookmark' ? 'bookmarks' : itemType === 'executable' ? 'executables' : 'scripts';
    
    const stmt = db.prepare(`
      UPDATE ${table}
      SET is_team_level = 1, updated_by = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    return stmt.run(userEmail, itemId);
  },

  // ============ Utility Operations ============

  transaction: <T>(callback: () => T): T => {
    return db.transaction(callback)();
  },

  getStats: () => {
    const bookmarksCount = db.prepare('SELECT COUNT(*) as count FROM bookmarks').get() as { count: number };
    const executablesCount = db.prepare('SELECT COUNT(*) as count FROM executables').get() as { count: number };
    const scriptsCount = db.prepare('SELECT COUNT(*) as count FROM scripts').get() as { count: number };
    const sharesCount = db.prepare('SELECT COUNT(*) as count FROM user_shares').get() as { count: number };
    
    return {
      bookmarks: bookmarksCount.count,
      executables: executablesCount.count,
      scripts: scriptsCount.count,
      shares: sharesCount.count,
    };
  },
};

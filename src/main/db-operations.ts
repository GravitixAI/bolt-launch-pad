import { db } from './database';

/**
 * Database operations for app settings
 * These are example CRUD operations you can use as a template
 */
export const dbOperations = {
  // ============ Settings Operations ============
  
  /**
   * Get a setting value by key
   */
  getSetting: (key: string): { key: string; value: string; updated_at: string } | undefined => {
    const stmt = db.prepare('SELECT * FROM app_settings WHERE key = ?');
    return stmt.get(key) as any;
  },

  /**
   * Set a setting value (insert or update)
   */
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

  /**
   * Get all settings
   */
  getAllSettings: () => {
    const stmt = db.prepare('SELECT * FROM app_settings ORDER BY key');
    return stmt.all();
  },

  /**
   * Delete a setting
   */
  deleteSetting: (key: string) => {
    const stmt = db.prepare('DELETE FROM app_settings WHERE key = ?');
    return stmt.run(key);
  },

  // ============ User Preferences Operations ============

  /**
   * Get user preference
   */
  getPreference: (category: string, preferenceKey: string) => {
    const stmt = db.prepare(`
      SELECT * FROM user_preferences 
      WHERE category = ? AND preference_key = ?
    `);
    return stmt.get(category, preferenceKey);
  },

  /**
   * Set user preference (insert or update)
   */
  setPreference: (category: string, preferenceKey: string, preferenceValue: string) => {
    const stmt = db.prepare(`
      INSERT INTO user_preferences (category, preference_key, preference_value) 
      VALUES (?, ?, ?)
      ON CONFLICT(category, preference_key) DO UPDATE SET 
        preference_value = excluded.preference_value
    `);
    return stmt.run(category, preferenceKey, preferenceValue);
  },

  /**
   * Get all preferences in a category
   */
  getPreferencesByCategory: (category: string) => {
    const stmt = db.prepare(`
      SELECT * FROM user_preferences 
      WHERE category = ? 
      ORDER BY preference_key
    `);
    return stmt.all(category);
  },

  /**
   * Get all preferences (all categories)
   */
  getAllPreferences: () => {
    const stmt = db.prepare(`
      SELECT * FROM user_preferences 
      ORDER BY category, preference_key
    `);
    return stmt.all();
  },

  /**
   * Delete a preference
   */
  deletePreference: (category: string, preferenceKey: string) => {
    const stmt = db.prepare(`
      DELETE FROM user_preferences 
      WHERE category = ? AND preference_key = ?
    `);
    return stmt.run(category, preferenceKey);
  },

  // ============ Utility Operations ============

  /**
   * Execute a transaction
   * Useful for multiple operations that should succeed or fail together
   */
  transaction: <T>(callback: () => T): T => {
    return db.transaction(callback)();
  },

  /**
   * Get database statistics
   */
  getStats: () => {
    const settingsCount = db.prepare('SELECT COUNT(*) as count FROM app_settings').get() as { count: number };
    const preferencesCount = db.prepare('SELECT COUNT(*) as count FROM user_preferences').get() as { count: number };
    
    return {
      settings: settingsCount.count,
      preferences: preferencesCount.count,
    };
  },
};

/**
 * Example of a complex transaction
 * This demonstrates how to use multiple operations safely
 */
export function exampleTransaction() {
  const result = dbOperations.transaction(() => {
    dbOperations.setSetting('last_sync', new Date().toISOString());
    dbOperations.setPreference('ui', 'theme', 'dark');
    return { success: true };
  });
  
  return result;
}


import { dbOperations, Bookmark, Executable, Script } from './db-operations';
import { executeQuery, isConnected } from './mysql-connection';

// Sync status tracking
let isSyncing = false;
let lastSyncTime: Date | null = null;
let syncInterval: NodeJS.Timeout | null = null;
const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

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

let lastSyncResult: SyncStatus['lastSyncResult'] = null;

/**
 * Start automatic sync polling
 */
export function startSyncPolling(): void {
  if (syncInterval) {
    console.log('Sync polling already running');
    return;
  }

  console.log('Starting sync polling...');
  
  // Initial sync
  performSync().catch(console.error);
  
  // Set up interval
  syncInterval = setInterval(() => {
    performSync().catch(console.error);
  }, SYNC_INTERVAL_MS);
}

/**
 * Stop automatic sync polling
 */
export function stopSyncPolling(): void {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log('Sync polling stopped');
  }
}

/**
 * Get current sync status
 */
export function getSyncStatus(): SyncStatus {
  return {
    isSyncing,
    lastSyncTime,
    lastSyncResult,
  };
}

/**
 * Perform manual sync
 */
export async function manualSync(): Promise<SyncStatus['lastSyncResult']> {
  return await performSync();
}

/**
 * Main sync operation
 */
async function performSync(): Promise<SyncStatus['lastSyncResult']> {
  if (isSyncing) {
    console.log('Sync already in progress, skipping...');
    return lastSyncResult;
  }

  if (!isConnected()) {
    console.log('MySQL not connected, skipping sync');
    return {
      success: false,
      itemsSynced: 0,
      conflicts: 0,
      errors: ['MySQL not connected'],
    };
  }

  isSyncing = true;
  const errors: string[] = [];
  let itemsSynced = 0;
  let conflicts = 0;

  try {
    console.log('Starting sync operation...');

    // Sync bookmarks
    const bookmarkResult = await syncBookmarks();
    itemsSynced += bookmarkResult.synced;
    conflicts += bookmarkResult.conflicts;
    errors.push(...bookmarkResult.errors);

    // Sync executables
    const executableResult = await syncExecutables();
    itemsSynced += executableResult.synced;
    conflicts += executableResult.conflicts;
    errors.push(...executableResult.errors);

    // Sync scripts
    const scriptResult = await syncScripts();
    itemsSynced += scriptResult.synced;
    conflicts += scriptResult.conflicts;
    errors.push(...scriptResult.errors);

    lastSyncTime = new Date();
    dbOperations.setSetting('last_sync_timestamp', lastSyncTime.toISOString());

    lastSyncResult = {
      success: errors.length === 0,
      itemsSynced,
      conflicts,
      errors,
    };

    console.log(`✅ Sync completed: ${itemsSynced} items synced, ${conflicts} conflicts, ${errors.length} errors`);
  } catch (error) {
    console.error('❌ Sync failed:', error);
    lastSyncResult = {
      success: false,
      itemsSynced: 0,
      conflicts: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  } finally {
    isSyncing = false;
  }

  return lastSyncResult;
}

/**
 * Sync bookmarks between SQLite and MySQL
 */
async function syncBookmarks(): Promise<{ synced: number; conflicts: number; errors: string[] }> {
  const errors: string[] = [];
  let synced = 0;
  let conflicts = 0;

  try {
    // Get all team-level bookmarks from MySQL
    const mysqlBookmarks = await executeQuery<any[]>(
      'SELECT * FROM bookmarks WHERE is_team_level = 1'
    );

    // Get all team-level bookmarks from SQLite
    const sqliteBookmarks = dbOperations.getAllBookmarks().filter(b => b.is_team_level === 1);

    // Create a map for faster lookup
    const sqliteMap = new Map(sqliteBookmarks.map(b => [b.id, b]));
    const mysqlMap = new Map(mysqlBookmarks.map((b: any) => [b.id, b]));

    // Sync from MySQL to SQLite (pull)
    for (const mysqlBookmark of mysqlBookmarks) {
      try {
        const sqliteBookmark = sqliteMap.get(mysqlBookmark.id);

        if (!sqliteBookmark) {
          // New item from MySQL - insert into SQLite
          await insertBookmarkFromMySQL(mysqlBookmark);
          synced++;
        } else {
          // Item exists in both - check for conflicts
          const conflict = detectConflict(sqliteBookmark, mysqlBookmark);
          
          if (conflict) {
            // MySQL is source of truth - update SQLite
            await updateBookmarkFromMySQL(mysqlBookmark);
            conflicts++;
          } else if (sqliteBookmark.sync_hash !== mysqlBookmark.sync_hash) {
            // Item was updated, sync from MySQL
            await updateBookmarkFromMySQL(mysqlBookmark);
            synced++;
          }
        }
      } catch (error) {
        errors.push(`Bookmark ${mysqlBookmark.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Push local team-level changes to MySQL
    for (const sqliteBookmark of sqliteBookmarks) {
      try {
        const mysqlBookmark = mysqlMap.get(sqliteBookmark.id);

        if (!mysqlBookmark) {
          // New item from SQLite - push to MySQL
          await pushBookmarkToMySQL(sqliteBookmark);
          synced++;
        }
      } catch (error) {
        errors.push(`Bookmark ${sqliteBookmark.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  } catch (error) {
    errors.push(`Bookmarks sync: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return { synced, conflicts, errors };
}

/**
 * Sync executables between SQLite and MySQL
 */
async function syncExecutables(): Promise<{ synced: number; conflicts: number; errors: string[] }> {
  const errors: string[] = [];
  let synced = 0;
  let conflicts = 0;

  try {
    const mysqlExecutables = await executeQuery<any[]>(
      'SELECT * FROM executables WHERE is_team_level = 1'
    );

    const sqliteExecutables = dbOperations.getAllExecutables().filter(e => e.is_team_level === 1);

    const sqliteMap = new Map(sqliteExecutables.map(e => [e.id, e]));
    const mysqlMap = new Map(mysqlExecutables.map((e: any) => [e.id, e]));

    // Pull from MySQL
    for (const mysqlExecutable of mysqlExecutables) {
      try {
        const sqliteExecutable = sqliteMap.get(mysqlExecutable.id);

        if (!sqliteExecutable) {
          await insertExecutableFromMySQL(mysqlExecutable);
          synced++;
        } else {
          const conflict = detectConflict(sqliteExecutable, mysqlExecutable);
          
          if (conflict) {
            await updateExecutableFromMySQL(mysqlExecutable);
            conflicts++;
          } else if (sqliteExecutable.sync_hash !== mysqlExecutable.sync_hash) {
            await updateExecutableFromMySQL(mysqlExecutable);
            synced++;
          }
        }
      } catch (error) {
        errors.push(`Executable ${mysqlExecutable.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Push to MySQL
    for (const sqliteExecutable of sqliteExecutables) {
      try {
        const mysqlExecutable = mysqlMap.get(sqliteExecutable.id);

        if (!mysqlExecutable) {
          await pushExecutableToMySQL(sqliteExecutable);
          synced++;
        }
      } catch (error) {
        errors.push(`Executable ${sqliteExecutable.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  } catch (error) {
    errors.push(`Executables sync: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return { synced, conflicts, errors };
}

/**
 * Sync scripts between SQLite and MySQL
 */
async function syncScripts(): Promise<{ synced: number; conflicts: number; errors: string[] }> {
  const errors: string[] = [];
  let synced = 0;
  let conflicts = 0;

  try {
    const mysqlScripts = await executeQuery<any[]>(
      'SELECT * FROM scripts WHERE is_team_level = 1'
    );

    const sqliteScripts = dbOperations.getAllScripts().filter(s => s.is_team_level === 1);

    const sqliteMap = new Map(sqliteScripts.map(s => [s.id, s]));
    const mysqlMap = new Map(mysqlScripts.map((s: any) => [s.id, s]));

    // Pull from MySQL
    for (const mysqlScript of mysqlScripts) {
      try {
        const sqliteScript = sqliteMap.get(mysqlScript.id);

        if (!sqliteScript) {
          await insertScriptFromMySQL(mysqlScript);
          synced++;
        } else {
          const conflict = detectConflict(sqliteScript, mysqlScript);
          
          if (conflict) {
            await updateScriptFromMySQL(mysqlScript);
            conflicts++;
          } else if (sqliteScript.sync_hash !== mysqlScript.sync_hash) {
            await updateScriptFromMySQL(mysqlScript);
            synced++;
          }
        }
      } catch (error) {
        errors.push(`Script ${mysqlScript.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Push to MySQL
    for (const sqliteScript of sqliteScripts) {
      try {
        const mysqlScript = mysqlMap.get(sqliteScript.id);

        if (!mysqlScript) {
          await pushScriptToMySQL(sqliteScript);
          synced++;
        }
      } catch (error) {
        errors.push(`Script ${sqliteScript.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  } catch (error) {
    errors.push(`Scripts sync: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return { synced, conflicts, errors };
}

/**
 * Detect conflict based on updated_at timestamps
 */
function detectConflict(sqliteItem: any, mysqlItem: any): boolean {
  const sqliteUpdated = new Date(sqliteItem.updated_at);
  const mysqlUpdated = new Date(mysqlItem.updated_at);
  
  // If MySQL is newer and hashes don't match, there's a conflict
  return mysqlUpdated > sqliteUpdated && sqliteItem.sync_hash !== mysqlItem.sync_hash;
}

// Helper functions for bookmarks
async function insertBookmarkFromMySQL(mysqlBookmark: any): Promise<void> {
  const stmt = dbOperations.transaction(() => {
    const id = dbOperations.createBookmark({
      title: mysqlBookmark.title,
      url: mysqlBookmark.url,
      favicon: mysqlBookmark.favicon,
      category: mysqlBookmark.category,
      is_team_level: 1,
      is_personal: 1,
      created_by: mysqlBookmark.created_by,
      updated_by: mysqlBookmark.updated_by,
    });
    
    // Update with MySQL timestamps and sync info
    dbOperations.updateBookmark(id, {
      created_at: mysqlBookmark.created_at,
      updated_at: mysqlBookmark.updated_at,
      sync_hash: mysqlBookmark.sync_hash,
      last_sync_at: new Date().toISOString(),
    } as any);
  });
}

async function updateBookmarkFromMySQL(mysqlBookmark: any): Promise<void> {
  dbOperations.updateBookmark(mysqlBookmark.id, {
    title: mysqlBookmark.title,
    url: mysqlBookmark.url,
    favicon: mysqlBookmark.favicon,
    category: mysqlBookmark.category,
    updated_by: mysqlBookmark.updated_by,
    sync_hash: mysqlBookmark.sync_hash,
    last_sync_at: new Date().toISOString(),
  } as any);
}

async function pushBookmarkToMySQL(sqliteBookmark: Bookmark): Promise<void> {
  await executeQuery(
    `INSERT INTO bookmarks (id, title, url, favicon, category, is_team_level, created_by, updated_by, created_at, updated_at, sync_hash)
     VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)`,
    [
      sqliteBookmark.id,
      sqliteBookmark.title,
      sqliteBookmark.url,
      sqliteBookmark.favicon || null,
      sqliteBookmark.category || null,
      sqliteBookmark.created_by || null,
      sqliteBookmark.updated_by || null,
      sqliteBookmark.created_at,
      sqliteBookmark.updated_at,
      sqliteBookmark.sync_hash || null,
    ]
  );
}

// Helper functions for executables
async function insertExecutableFromMySQL(mysqlExecutable: any): Promise<void> {
  dbOperations.transaction(() => {
    const id = dbOperations.createExecutable({
      title: mysqlExecutable.title,
      executable_path: mysqlExecutable.executable_path,
      parameters: mysqlExecutable.parameters,
      icon: mysqlExecutable.icon,
      category: mysqlExecutable.category,
      is_team_level: 1,
      is_personal: 1,
      created_by: mysqlExecutable.created_by,
      updated_by: mysqlExecutable.updated_by,
    });
    
    dbOperations.updateExecutable(id, {
      created_at: mysqlExecutable.created_at,
      updated_at: mysqlExecutable.updated_at,
      sync_hash: mysqlExecutable.sync_hash,
      last_sync_at: new Date().toISOString(),
    } as any);
  });
}

async function updateExecutableFromMySQL(mysqlExecutable: any): Promise<void> {
  dbOperations.updateExecutable(mysqlExecutable.id, {
    title: mysqlExecutable.title,
    executable_path: mysqlExecutable.executable_path,
    parameters: mysqlExecutable.parameters,
    icon: mysqlExecutable.icon,
    category: mysqlExecutable.category,
    updated_by: mysqlExecutable.updated_by,
    sync_hash: mysqlExecutable.sync_hash,
    last_sync_at: new Date().toISOString(),
  } as any);
}

async function pushExecutableToMySQL(sqliteExecutable: Executable): Promise<void> {
  await executeQuery(
    `INSERT INTO executables (id, title, executable_path, parameters, icon, category, is_team_level, created_by, updated_by, created_at, updated_at, sync_hash)
     VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)`,
    [
      sqliteExecutable.id,
      sqliteExecutable.title,
      sqliteExecutable.executable_path,
      sqliteExecutable.parameters || null,
      sqliteExecutable.icon || null,
      sqliteExecutable.category || null,
      sqliteExecutable.created_by || null,
      sqliteExecutable.updated_by || null,
      sqliteExecutable.created_at,
      sqliteExecutable.updated_at,
      sqliteExecutable.sync_hash || null,
    ]
  );
}

// Helper functions for scripts
async function insertScriptFromMySQL(mysqlScript: any): Promise<void> {
  dbOperations.transaction(() => {
    const id = dbOperations.createScript({
      title: mysqlScript.title,
      script_content: mysqlScript.script_content,
      script_type: mysqlScript.script_type,
      icon: mysqlScript.icon,
      category: mysqlScript.category,
      is_team_level: 1,
      is_personal: 1,
      created_by: mysqlScript.created_by,
      updated_by: mysqlScript.updated_by,
    });
    
    dbOperations.updateScript(id, {
      created_at: mysqlScript.created_at,
      updated_at: mysqlScript.updated_at,
      sync_hash: mysqlScript.sync_hash,
      last_sync_at: new Date().toISOString(),
    } as any);
  });
}

async function updateScriptFromMySQL(mysqlScript: any): Promise<void> {
  dbOperations.updateScript(mysqlScript.id, {
    title: mysqlScript.title,
    script_content: mysqlScript.script_content,
    script_type: mysqlScript.script_type,
    icon: mysqlScript.icon,
    category: mysqlScript.category,
    updated_by: mysqlScript.updated_by,
    sync_hash: mysqlScript.sync_hash,
    last_sync_at: new Date().toISOString(),
  } as any);
}

async function pushScriptToMySQL(sqliteScript: Script): Promise<void> {
  await executeQuery(
    `INSERT INTO scripts (id, title, script_content, script_type, icon, category, is_team_level, created_by, updated_by, created_at, updated_at, sync_hash)
     VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)`,
    [
      sqliteScript.id,
      sqliteScript.title,
      sqliteScript.script_content,
      sqliteScript.script_type,
      sqliteScript.icon || null,
      sqliteScript.category || null,
      sqliteScript.created_by || null,
      sqliteScript.updated_by || null,
      sqliteScript.created_at,
      sqliteScript.updated_at,
      sqliteScript.sync_hash || null,
    ]
  );
}


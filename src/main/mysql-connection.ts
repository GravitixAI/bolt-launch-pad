import mysql from 'mysql2/promise';
import { dbOperations } from './db-operations';

// MySQL Connection Configuration
interface MySQLConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

let pool: mysql.Pool | null = null;
let currentEnv: 'dev' | 'prod' = 'dev';

/**
 * Initialize MySQL connection pool
 */
export async function initializeMySQLConnection(config: MySQLConfig, env: 'dev' | 'prod' = 'dev'): Promise<void> {
  try {
    // Close existing pool if any
    if (pool) {
      await pool.end();
    }

    // Create new connection pool
    pool = mysql.createPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    });

    currentEnv = env;
    
    // Test the connection
    await testConnection();
    
    console.log(`✅ MySQL connection initialized (${env})`);
    
    // Store current environment in settings
    dbOperations.setSetting('mysql_env', env);
  } catch (error) {
    console.error('❌ Failed to initialize MySQL connection:', error);
    throw error;
  }
}

/**
 * Get MySQL configuration from SQLite settings
 */
export function getMySQLConfigFromSettings(env: 'dev' | 'prod'): MySQLConfig | null {
  try {
    const host = dbOperations.getSetting(`mysql_${env}_host`);
    const port = dbOperations.getSetting(`mysql_${env}_port`);
    const user = dbOperations.getSetting(`mysql_${env}_user`);
    const password = dbOperations.getSetting(`mysql_${env}_password`);
    const database = dbOperations.getSetting(`mysql_${env}_database`);

    if (!host || !port || !user || !password || !database) {
      return null;
    }

    return {
      host: host.value,
      port: parseInt(port.value),
      user: user.value,
      password: password.value,
      database: database.value,
    };
  } catch (error) {
    console.error('Error getting MySQL config:', error);
    return null;
  }
}

/**
 * Save MySQL configuration to SQLite settings
 */
export function saveMySQLConfig(config: MySQLConfig, env: 'dev' | 'prod'): void {
  dbOperations.setSetting(`mysql_${env}_host`, config.host);
  dbOperations.setSetting(`mysql_${env}_port`, config.port.toString());
  dbOperations.setSetting(`mysql_${env}_user`, config.user);
  dbOperations.setSetting(`mysql_${env}_password`, config.password);
  dbOperations.setSetting(`mysql_${env}_database`, config.database);
}

/**
 * Test MySQL connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    if (!pool) {
      throw new Error('MySQL pool not initialized');
    }

    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    
    console.log('✅ MySQL connection test successful');
    return true;
  } catch (error) {
    console.error('❌ MySQL connection test failed:', error);
    return false;
  }
}

/**
 * Execute a MySQL query
 */
export async function executeQuery<T = any>(query: string, params: any[] = []): Promise<T> {
  try {
    if (!pool) {
      throw new Error('MySQL pool not initialized. Please configure connection first.');
    }

    const [rows] = await pool.execute(query, params);
    return rows as T;
  } catch (error) {
    console.error('MySQL query error:', error);
    throw error;
  }
}

/**
 * Get current environment
 */
export function getCurrentEnvironment(): 'dev' | 'prod' {
  return currentEnv;
}

/**
 * Switch environment (requires reinitialization)
 */
export async function switchEnvironment(env: 'dev' | 'prod'): Promise<void> {
  const config = getMySQLConfigFromSettings(env);
  if (!config) {
    throw new Error(`No configuration found for ${env} environment`);
  }
  
  await initializeMySQLConnection(config, env);
}

/**
 * Close MySQL connection
 */
export async function closeMySQLConnection(): Promise<void> {
  try {
    if (pool) {
      await pool.end();
      pool = null;
      console.log('✅ MySQL connection closed');
    }
  } catch (error) {
    console.error('❌ Error closing MySQL connection:', error);
  }
}

/**
 * Check if MySQL is connected
 */
export function isConnected(): boolean {
  return pool !== null;
}

/**
 * Initialize MySQL tables (run this once to set up the database)
 */
export async function initializeMySQLTables(): Promise<void> {
  if (!pool) {
    throw new Error('MySQL pool not initialized');
  }

  try {
    // Bookmarks table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS bookmarks (
        id VARCHAR(36) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        url TEXT NOT NULL,
        favicon LONGTEXT,
        category VARCHAR(100),
        is_team_level TINYINT(1) DEFAULT 0,
        created_by VARCHAR(255),
        updated_by VARCHAR(255),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        sync_hash VARCHAR(64),
        INDEX idx_team_level (is_team_level),
        INDEX idx_created_by (created_by),
        INDEX idx_category (category)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Executables table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS executables (
        id VARCHAR(36) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        executable_path TEXT NOT NULL,
        parameters TEXT,
        icon LONGTEXT,
        category VARCHAR(100),
        is_team_level TINYINT(1) DEFAULT 0,
        created_by VARCHAR(255),
        updated_by VARCHAR(255),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        sync_hash VARCHAR(64),
        INDEX idx_team_level (is_team_level),
        INDEX idx_created_by (created_by),
        INDEX idx_category (category)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Scripts table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS scripts (
        id VARCHAR(36) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        script_content LONGTEXT NOT NULL,
        script_type ENUM('powershell', 'cmd') NOT NULL,
        icon LONGTEXT,
        category VARCHAR(100),
        is_team_level TINYINT(1) DEFAULT 0,
        created_by VARCHAR(255),
        updated_by VARCHAR(255),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        sync_hash VARCHAR(64),
        INDEX idx_team_level (is_team_level),
        INDEX idx_created_by (created_by),
        INDEX idx_category (category),
        INDEX idx_script_type (script_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Sync log table (for tracking sync operations)
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS sync_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        item_type ENUM('bookmark', 'executable', 'script') NOT NULL,
        item_id VARCHAR(36) NOT NULL,
        operation ENUM('create', 'update', 'delete') NOT NULL,
        synced_by VARCHAR(255),
        synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_item (item_type, item_id),
        INDEX idx_synced_at (synced_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('✅ MySQL tables initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize MySQL tables:', error);
    throw error;
  }
}


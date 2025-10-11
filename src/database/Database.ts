/**
 * HARDCODED SYNC TIMESTAMP CONFIGURATION
 * ======================================
 * 
 * The initial sync timestamp is currently hardcoded to October 8th, 2024, 12:01 PM (UTC)
 * This is set in two methods:
 * 1. setInitialSyncTimestamp() - line ~480
 * 2. resetSyncTimestampForNewInstall() - line ~508
 * 
 * TO CHANGE BACK TO USUAL BUNDLING TIME:
 * =====================================
 * Replace the hardcoded date with current time:
 * 
 * OLD (hardcoded):
 * const hardcodedTime = new Date('2024-10-08T12:01:00Z').getTime();
 * 
 * NEW (bundling time):
 * const currentTime = Date.now();
 * 
 * Then use 'currentTime' instead of 'hardcodedTime' in both methods.
 */

import SQLite, { SQLiteDatabase } from 'react-native-sqlite-storage';
import {
  Kalaam,
  MasaibGroup,
  PoetGroup,
  ReciterGroup,
  KalaamListResponse,
} from '../types';

export interface Settings {
  theme: 'light' | 'dark';
  accent_color: string;
  urdu_font_size: string;
  urdu_font: string;
  eng_font_size: string;
  eng_font: string;
  default_language: 'urdu' | 'english';
  last_source_sync_timestamp?: string;
  sync_config?: string;
  daily_sync_attempts?: string; // JSON string of sync attempts per day
  last_sync_date?: string; // YYYY-MM-DD format
}

SQLite.enablePromise(true);

class Database {
  private static instance: Database | null = null;
  private db: SQLiteDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  async init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    if (this.db) {
      return;
    }

    this.initPromise = (async () => {
      try {
        this.db = await SQLite.openDatabase({
          name: 'database.sqlite',
          createFromLocation: '~www/database.sqlite',
          location: 'default',
        });

        // Create settings table if it doesn't exist
        await this.db.executeSql(`
          CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at DATETIME
          )
        `);

        // Create favourites table if it doesn't exist
        await this.db.executeSql(`
          CREATE TABLE IF NOT EXISTS favourites (
            kalaam_id INTEGER PRIMARY KEY,
            created_at DATETIME
          )
        `);

        // Auto-favorite special content (Hadees e Kisa, Ziyarat Ashura)
        // These IDs are negative and permanently favorited
        await this.db.executeSql(`
          INSERT OR IGNORE INTO favourites (kalaam_id, created_at)
          VALUES (-1, datetime('now')), (-2, datetime('now'))
        `);

        // Create pins table if it doesn't exist
        await this.db.executeSql(`
          CREATE TABLE IF NOT EXISTS pins (
            kalaam_id INTEGER PRIMARY KEY,
            created_at DATETIME
          )
        `);

        // Auto-pin special content (Hadees e Kisa, Ziyarat Ashura)
        // These IDs are negative and permanently pinned
        await this.db.executeSql(`
          INSERT OR IGNORE INTO pins (kalaam_id, created_at)
          VALUES (-1, datetime('now')), (-2, datetime('now'))
        `);

        // Update kalaam table to include new fields if they don't exist
        await this.db.executeSql(`
          ALTER TABLE kalaam ADD COLUMN last_modified TIMESTAMP
        `).catch(() => {
          // Column might already exist, ignore error
        });

        await this.db.executeSql(`
          ALTER TABLE kalaam ADD COLUMN deleted BOOLEAN DEFAULT FALSE
        `).catch(() => {
          // Column might already exist, ignore error
        });

        // Create indexes for performance
        await this.db.executeSql(`
          CREATE INDEX IF NOT EXISTS idx_kalaam_deleted ON kalaam(deleted)
        `);

        await this.db.executeSql(`
          CREATE INDEX IF NOT EXISTS idx_kalaam_last_modified ON kalaam(last_modified)
        `);

        // Set initial sync timestamp to current bundling time
        await this.setInitialSyncTimestamp();
        
        // For new installs, always reset to current bundling time
        await this.resetSyncTimestampForNewInstall();

        // Insert default settings if they don't exist
        const defaultSettings = {
          theme: 'light',
          accent_color: '#16a34a',
          urdu_font_size: '1.2',
          urdu_font: 'System',
          eng_font_size: '1.0',
          eng_font: 'System',
          default_language: 'urdu',
        };

        for (const [key, value] of Object.entries(defaultSettings)) {
          await this.db.executeSql(
            'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)',
            [key, value],
          );
        }
      } catch (error) {
        this.db = null;
        throw error;
      } finally {
        this.initPromise = null;
      }
    })();

    return this.initPromise;
  }

  private ensureInitialized(): SQLite.SQLiteDatabase {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }
    return this.db;
  }

  // Settings operations
  async getSetting(key: string): Promise<string | null> {
    const db = this.ensureInitialized();
    const [result] = await db.executeSql(
      'SELECT value FROM settings WHERE key = ?',
      [key],
    );
    return result.rows.length > 0 ? result.rows.item(0).value : null;
  }

  async setSetting(key: string, value: string): Promise<void> {
    const db = this.ensureInitialized();
    await db.executeSql(
      'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
      [key, value],
    );
  }

  async getAllSettings(): Promise<Partial<Settings>> {
    const db = this.ensureInitialized();
    const [result] = await db.executeSql('SELECT key, value FROM settings');
    
    const settings: Partial<Settings> = {};
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i);
      (settings as any)[row.key] = row.value;
    }
    return settings;
  }

  // Kalaam operations
  async searchKalaams(
    query: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<KalaamListResponse> {
    const db = this.ensureInitialized();
    const offset = (page - 1) * limit;
    const searchQuery = `%${query}%`;

    // Get total count for all matches
    const [countResult] = await db.executeSql(
      'SELECT COUNT(*) as total FROM kalaam WHERE title LIKE ? OR lyrics_eng LIKE ? OR lyrics_urdu LIKE ?',
      [searchQuery, searchQuery, searchQuery],
    );

    const total = countResult.rows.item(0).total;

    // Priority-based search: title matches first, then lyrics matches
    const [result] = await db.executeSql(`
      SELECT * FROM kalaam 
      WHERE title LIKE ? OR lyrics_eng LIKE ? OR lyrics_urdu LIKE ? 
      ORDER BY 
        CASE 
          WHEN title LIKE ? THEN 1 
          WHEN lyrics_eng LIKE ? OR lyrics_urdu LIKE ? THEN 2 
          ELSE 3 
        END,
        title
      LIMIT ? OFFSET ?
    `, [searchQuery, searchQuery, searchQuery, searchQuery, searchQuery, searchQuery, limit, offset]);

    const kalaams: Kalaam[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      kalaams.push(result.rows.item(i));
    }

    return { kalaams, total, page, limit };
  }

  async getKalaamsByMasaib(
    masaib: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<KalaamListResponse> {
    const db = this.ensureInitialized();
    const offset = (page - 1) * limit;

    const [countResult] = await db.executeSql(
      'SELECT COUNT(*) as total FROM kalaam WHERE masaib = ?',
      [masaib],
    );

    const total = countResult.rows.item(0).total;

    const [result] = await db.executeSql(
      'SELECT * FROM kalaam WHERE masaib = ? ORDER BY title LIMIT ? OFFSET ?',
      [masaib, limit, offset],
    );

    const kalaams: Kalaam[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      kalaams.push(result.rows.item(i));
    }

    return { kalaams, total, page, limit };
  }

  async getKalaamsByPoet(
    poet: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<KalaamListResponse> {
    const db = this.ensureInitialized();
    const offset = (page - 1) * limit;

    const [countResult] = await db.executeSql(
      'SELECT COUNT(*) as total FROM kalaam WHERE poet = ?',
      [poet],
    );

    const total = countResult.rows.item(0).total;

    const [result] = await db.executeSql(
      'SELECT * FROM kalaam WHERE poet = ? ORDER BY title LIMIT ? OFFSET ?',
      [poet, limit, offset],
    );

    const kalaams: Kalaam[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      kalaams.push(result.rows.item(i));
    }

    return { kalaams, total, page, limit };
  }

  async getKalaamsByReciter(
    reciter: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<KalaamListResponse> {
    const db = this.ensureInitialized();
    const offset = (page - 1) * limit;

    const [countResult] = await db.executeSql(
      'SELECT COUNT(*) as total FROM kalaam WHERE reciter = ?',
      [reciter],
    );

    const total = countResult.rows.item(0).total;

    const [result] = await db.executeSql(
      'SELECT * FROM kalaam WHERE reciter = ? ORDER BY title LIMIT ? OFFSET ?',
      [reciter, limit, offset],
    );

    const kalaams: Kalaam[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      kalaams.push(result.rows.item(i));
    }

    return { kalaams, total, page, limit };
  }

  async getKalaamById(id: number): Promise<Kalaam | null> {
    const db = this.ensureInitialized();
    const [result] = await db.executeSql('SELECT * FROM kalaam WHERE id = ?', [id]);
    return result.rows.length > 0 ? result.rows.item(0) : null;
  }

  async getKalaamsByReciterAndMasaib(
    reciter: string,
    masaib: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<KalaamListResponse> {
    const db = this.ensureInitialized();
    const offset = (page - 1) * limit;

    const [countResult] = await db.executeSql(
      'SELECT COUNT(*) as total FROM kalaam WHERE reciter = ? AND masaib = ?',
      [reciter, masaib],
    );

    const total = countResult.rows.item(0).total;

    const [result] = await db.executeSql(
      'SELECT * FROM kalaam WHERE reciter = ? AND masaib = ? ORDER BY title LIMIT ? OFFSET ?',
      [reciter, masaib, limit, offset],
    );

    const kalaams: Kalaam[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      kalaams.push(result.rows.item(i));
    }

    return { kalaams, total, page, limit };
  }

  // Group operations
  async getMasaibGroups(): Promise<MasaibGroup[]> {
    const db = this.ensureInitialized();
    const [result] = await db.executeSql(
      'SELECT masaib, COUNT(*) as count FROM kalaam WHERE masaib IS NOT NULL GROUP BY masaib ORDER BY count DESC, masaib ASC',
    );

    const groups: MasaibGroup[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i);
      groups.push({
        masaib: row.masaib,
        count: row.count,
      });
    }

    return groups;
  }

  async getPoetGroups(): Promise<PoetGroup[]> {
    const db = this.ensureInitialized();
    const [result] = await db.executeSql(
      'SELECT poet, COUNT(*) as count FROM kalaam WHERE poet IS NOT NULL GROUP BY poet ORDER BY count DESC, poet ASC',
    );

    const groups: PoetGroup[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i);
      groups.push({
        poet: row.poet,
        count: row.count,
      });
    }

    return groups;
  }

  async getReciterGroups(): Promise<ReciterGroup[]> {
    const db = this.ensureInitialized();
    const [result] = await db.executeSql(
      'SELECT reciter, COUNT(*) as count FROM kalaam WHERE reciter IS NOT NULL GROUP BY reciter ORDER BY count DESC, reciter ASC',
    );

    const groups: ReciterGroup[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i);
      groups.push({
        reciter: row.reciter,
        count: row.count,
      });
    }

    return groups;
  }

  async getMasaibByReciter(reciter: string): Promise<string[]> {
    const db = this.ensureInitialized();
    const [result] = await db.executeSql(
      'SELECT DISTINCT masaib FROM kalaam WHERE reciter = ? AND masaib IS NOT NULL ORDER BY masaib',
      [reciter],
    );

    const masaibs: string[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      masaibs.push(result.rows.item(i).masaib);
    }

    return masaibs;
  }

  // Sync-related methods
  async getLastSyncTimestamp(): Promise<number> {
    const timestamp = await this.getSetting('last_source_sync_timestamp');
    return timestamp ? parseInt(timestamp) : 0;
  }

  async updateSyncTimestamp(): Promise<void> {
    const now = Date.now();
    await this.setSetting('last_source_sync_timestamp', now.toString());
  }

  async upsertKalaam(kalaam: Kalaam): Promise<void> {
    const db = this.ensureInitialized();
    await db.executeSql(`
      INSERT OR REPLACE INTO kalaam 
      (id, title, lyrics_urdu, lyrics_eng, poet, reciter, masaib, yt_link, last_modified, deleted)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      kalaam.id,
      kalaam.title || '',
      kalaam.lyrics_urdu || '',
      kalaam.lyrics_eng || '',
      kalaam.poet || '',
      kalaam.reciter || '',
      kalaam.masaib || '',
      kalaam.yt_link || '',
      kalaam.last_modified || new Date().toISOString(),
      kalaam.deleted ? 1 : 0
    ]);
  }

  async deleteKalaam(id: number): Promise<void> {
    const db = this.ensureInitialized();
    await db.executeSql('DELETE FROM kalaam WHERE id = ?', [id]);
  }

  async getKalaamCount(): Promise<number> {
    const db = this.ensureInitialized();
    const [result] = await db.executeSql('SELECT COUNT(*) as count FROM kalaam WHERE deleted = 0');
    return result.rows.item(0).count;
  }

  // Sync attempt tracking methods
  async getDailySyncAttempts(): Promise<{ date: string; attempts: number }> {
    const db = this.ensureInitialized();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    try {
      const [result] = await db.executeSql(
        'SELECT value FROM settings WHERE key = ?',
        ['daily_sync_attempts']
      );
      
      if (result.rows.length > 0) {
        const data = JSON.parse(result.rows.item(0).value);
        if (data.date === today) {
          return { date: today, attempts: data.attempts };
        }
      }
    } catch (error) {
      console.error('[Database] Error getting daily sync attempts:', error);
    }
    
    return { date: today, attempts: 0 };
  }

  async incrementSyncAttempt(): Promise<{ date: string; attempts: number }> {
    const db = this.ensureInitialized();
    const today = new Date().toISOString().split('T')[0];
    
    try {
      const current = await this.getDailySyncAttempts();
      const newAttempts = current.date === today ? current.attempts + 1 : 1;
      
      await db.executeSql(
        'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)',
        ['daily_sync_attempts', JSON.stringify({ date: today, attempts: newAttempts }), new Date().toISOString()]
      );
      
      return { date: today, attempts: newAttempts };
    } catch (error) {
      console.error('[Database] Error incrementing sync attempts:', error);
      return { date: today, attempts: 1 };
    }
  }

  async canPerformManualSync(): Promise<boolean> {
    const { attempts } = await this.getDailySyncAttempts();
    return attempts < 2; // Maximum 2 manual syncs per day
  }

  private async setInitialSyncTimestamp(): Promise<void> {
    const db = this.ensureInitialized();
    // HARDCODED: October 8th, 2024, 12:01 PM (UTC)
    const hardcodedTime = new Date('2024-10-08T12:01:00Z').getTime();
    
    try {
      // Check if last_source_sync_timestamp already exists
      const [result] = await db.executeSql(
        'SELECT value FROM settings WHERE key = ?',
        ['last_source_sync_timestamp']
      );
      
      // Only set initial timestamp if it doesn't exist (new app install)
      if (result.rows.length === 0) {
        await db.executeSql(
          'INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)',
          ['last_source_sync_timestamp', hardcodedTime.toString(), new Date().toISOString()]
        );
        console.log('[Database] Initial sync timestamp set to HARDCODED date:', new Date(hardcodedTime).toISOString());
      } else {
        console.log('[Database] Sync timestamp already exists, keeping existing value');
      }
    } catch (error) {
      console.error('[Database] Failed to set initial sync timestamp:', error);
    }
  }

  // Method to reset sync timestamp for new app installs (when SQLite is recreated)
  async resetSyncTimestampForNewInstall(): Promise<void> {
    const db = this.ensureInitialized();
    // HARDCODED: October 8th, 2024, 12:01 PM (UTC)
    const hardcodedTime = new Date('2024-10-08T12:01:00Z').getTime();
    
    try {
      // Always update to hardcoded date for new installs
      await db.executeSql(
        'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)',
        ['last_source_sync_timestamp', hardcodedTime.toString(), new Date().toISOString()]
      );
      console.log('[Database] Sync timestamp reset to HARDCODED date:', new Date(hardcodedTime).toISOString());
    } catch (error) {
      console.error('[Database] Failed to reset sync timestamp:', error);
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      this.initPromise = null;
    }
  }
}

// Export singleton instance
export const database = Database.getInstance();
export default database;

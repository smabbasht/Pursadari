import SQLite from 'react-native-sqlite-storage';
import {
  Kalaam,
  MasaibGroup,
  PoetGroup,
  ReciterGroup,
  KalaamListResponse,
} from '../../types';
import { IDatabaseService } from '../interfaces/IDatabaseService';

export interface Settings {
  theme: 'light' | 'dark';
  accent_color: string;
  urdu_font_size: string;
  urdu_font: string;
  eng_font_size: string;
  eng_font: string;
  default_language: 'urdu' | 'english';
}

SQLite.enablePromise(true);

export class SQLiteRepository implements IDatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    // Return existing initialization if in progress
    if (this.initPromise) {
      return this.initPromise;
    }

    // Return immediately if already initialized
    if (this.db) {
      return;
    }

    // Start new initialization
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
            value TEXT NOT NULL
          )
        `);

        // Insert default settings if they don't exist
        const defaultSettings = {
          theme: 'light',
          accent_color: '#000000',
          urdu_font_size: '18',
          urdu_font: 'default',
          eng_font_size: '16',
          eng_font: 'default',
          default_language: 'urdu',
        };

        for (const [key, value] of Object.entries(defaultSettings)) {
          await this.db.executeSql(
            'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)',
            [key, value],
          );
        }
      } catch (error) {
        this.db = null; // Ensure db is null on failure
        throw error;
      } finally {
        this.initPromise = null;
      }
    })();

    return this.initPromise;
  }

  async searchKalaams(
    query: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<KalaamListResponse> {
    if (!this.db) throw new Error('Database not initialized');

    const offset = (page - 1) * limit;
    const searchQuery = `%${query}%`;

    const [countResult] = await this.db.executeSql(
      'SELECT COUNT(*) as total FROM kalaam WHERE title LIKE ? OR lyrics_eng LIKE ? OR lyrics_urdu LIKE ?',
      [searchQuery, searchQuery, searchQuery],
    );

    const total = countResult.rows.item(0).total;

    const [result] = await this.db.executeSql(
      'SELECT * FROM kalaam WHERE title LIKE ? OR lyrics_eng LIKE ? OR lyrics_urdu LIKE ? ORDER BY title LIMIT ? OFFSET ?',
      [searchQuery, searchQuery, searchQuery, limit, offset],
    );

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
    if (!this.db) throw new Error('Database not initialized');

    const offset = (page - 1) * limit;

    const [countResult] = await this.db.executeSql(
      'SELECT COUNT(*) as total FROM kalaam WHERE masaib = ?',
      [masaib],
    );

    const total = countResult.rows.item(0).total;

    const [result] = await this.db.executeSql(
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
    if (!this.db) throw new Error('Database not initialized');

    const offset = (page - 1) * limit;

    const [countResult] = await this.db.executeSql(
      'SELECT COUNT(*) as total FROM kalaam WHERE poet = ?',
      [poet],
    );

    const total = countResult.rows.item(0).total;

    const [result] = await this.db.executeSql(
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
    if (!this.db) throw new Error('Database not initialized');

    const offset = (page - 1) * limit;

    const [countResult] = await this.db.executeSql(
      'SELECT COUNT(*) as total FROM kalaam WHERE reciter = ?',
      [reciter],
    );

    const total = countResult.rows.item(0).total;

    const [result] = await this.db.executeSql(
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
    if (!this.db) throw new Error('Database not initialized');

    const [result] = await this.db.executeSql(
      'SELECT * FROM kalaam WHERE id = ?',
      [id],
    );

    return result.rows.length > 0 ? result.rows.item(0) : null;
  }

  async getSetting(key: string): Promise<string | null> {
    if (!this.db) throw new Error('Database not initialized');

    const [result] = await this.db.executeSql(
      'SELECT value FROM settings WHERE key = ?',
      [key],
    );

    return result.rows.length > 0 ? result.rows.item(0).value : null;
  }

  async setSetting(key: string, value: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.executeSql(
      'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
      [key, value],
    );
  }

  async getAllSettings(): Promise<Partial<Settings>> {
    if (!this.db) throw new Error('Database not initialized');

    const [result] = await this.db.executeSql(
      'SELECT key, value FROM settings',
    );

    const settings: Partial<Settings> = {};
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i);
      settings[row.key as keyof Settings] = row.value;
    }

    return settings;
  }

  async getMasaibGroups(): Promise<MasaibGroup[]> {
    if (!this.db) throw new Error('Database not initialized');

    const [result] = await this.db.executeSql(
      // Order by count desc, then alphabetically
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
    if (!this.db) throw new Error('Database not initialized');

    const [result] = await this.db.executeSql(
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
    if (!this.db) throw new Error('Database not initialized');

    const [result] = await this.db.executeSql(
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
    if (!this.db) throw new Error('Database not initialized');

    const [result] = await this.db.executeSql(
      'SELECT DISTINCT masaib FROM kalaam WHERE reciter = ? AND masaib IS NOT NULL ORDER BY masaib',
      [reciter],
    );

    const masaibs: string[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      masaibs.push(result.rows.item(i).masaib);
    }

    return masaibs;
  }

  async getKalaamsByReciterAndMasaib(
    reciter: string,
    masaib: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<KalaamListResponse> {
    if (!this.db) throw new Error('Database not initialized');

    const offset = (page - 1) * limit;

    const [countResult] = await this.db.executeSql(
      'SELECT COUNT(*) as total FROM kalaam WHERE reciter = ? AND masaib = ?',
      [reciter, masaib],
    );

    const total = countResult.rows.item(0).total;

    const [result] = await this.db.executeSql(
      'SELECT * FROM kalaam WHERE reciter = ? AND masaib = ? ORDER BY title LIMIT ? OFFSET ?',
      [reciter, masaib, limit, offset],
    );

    const kalaams: Kalaam[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      kalaams.push(result.rows.item(i));
    }

    return { kalaams, total, page, limit };
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      this.initPromise = null;
    }
  }
}

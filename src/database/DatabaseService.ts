import SQLite from 'react-native-sqlite-storage';
import { Kalaam, MasaibGroup, PoetGroup, ReciterGroup, KalaamListResponse } from '../types';

SQLite.DEBUG(true);
SQLite.enablePromise(true);

export class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async init(): Promise<void> {
    try {
      this.db = await SQLite.openDatabase({
        name: 'database.sqlite',
        location: 'default',
        // 1 = copy prepopulated DB from android/app/src/main/assets/www/<name>
        createFromLocation: 1 as any,
      });
      console.log('Database initialized successfully');

      await this.db.executeSql(
        'CREATE TABLE IF NOT EXISTS favourites (kalaam_id INTEGER PRIMARY KEY, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)'
      );
    } catch (error) {
      try {
        console.error('Failed to initialize database:', error);
      } catch (_) {
        // Fallback in case error object is not serializable
        // eslint-disable-next-line no-console
        console.log('Failed to initialize database (non-serializable error)');
      }
      throw error;
    }
  }

  async searchKalaams(query: string, page: number = 1, limit: number = 50): Promise<KalaamListResponse> {
    if (!this.db) throw new Error('Database not initialized');
    
    const offset = (page - 1) * limit;
    const searchQuery = `%${query}%`;
    
    const [countResult] = await this.db.executeSql(
      'SELECT COUNT(*) as total FROM kalaam WHERE title LIKE ? OR reciter LIKE ? OR poet LIKE ?',
      [searchQuery, searchQuery, searchQuery]
    );
    
    const total = countResult.rows.item(0).total;
    
    const [result] = await this.db.executeSql(
      'SELECT * FROM kalaam WHERE title LIKE ? OR reciter LIKE ? OR poet LIKE ? ORDER BY title LIMIT ? OFFSET ?',
      [searchQuery, searchQuery, searchQuery, limit, offset]
    );
    
    const kalaams: Kalaam[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      kalaams.push(result.rows.item(i));
    }
    
    return { kalaams, total, page, limit };
  }

  async getKalaamsByMasaib(masaib: string, page: number = 1, limit: number = 50): Promise<KalaamListResponse> {
    if (!this.db) throw new Error('Database not initialized');
    
    const offset = (page - 1) * limit;
    
    const [countResult] = await this.db.executeSql(
      'SELECT COUNT(*) as total FROM kalaam WHERE masaib = ?',
      [masaib]
    );
    
    const total = countResult.rows.item(0).total;
    
    const [result] = await this.db.executeSql(
      'SELECT * FROM kalaam WHERE masaib = ? ORDER BY title LIMIT ? OFFSET ?',
      [masaib, limit, offset]
    );
    
    const kalaams: Kalaam[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      kalaams.push(result.rows.item(i));
    }
    
    return { kalaams, total, page, limit };
  }

  async getKalaamsByPoet(poet: string, page: number = 1, limit: number = 50): Promise<KalaamListResponse> {
    if (!this.db) throw new Error('Database not initialized');
    
    const offset = (page - 1) * limit;
    
    const [countResult] = await this.db.executeSql(
      'SELECT COUNT(*) as total FROM kalaam WHERE poet = ?',
      [poet]
    );
    
    const total = countResult.rows.item(0).total;
    
    const [result] = await this.db.executeSql(
      'SELECT * FROM kalaam WHERE poet = ? ORDER BY title LIMIT ? OFFSET ?',
      [poet, limit, offset]
    );
    
    const kalaams: Kalaam[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      kalaams.push(result.rows.item(i));
    }
    
    return { kalaams, total, page, limit };
  }

  async getKalaamsByReciter(reciter: string, page: number = 1, limit: number = 50): Promise<KalaamListResponse> {
    if (!this.db) throw new Error('Database not initialized');
    
    const offset = (page - 1) * limit;
    
    const [countResult] = await this.db.executeSql(
      'SELECT COUNT(*) as total FROM kalaam WHERE reciter = ?',
      [reciter]
    );
    
    const total = countResult.rows.item(0).total;
    
    const [result] = await this.db.executeSql(
      'SELECT * FROM kalaam WHERE reciter = ? ORDER BY title LIMIT ? OFFSET ?',
      [reciter, limit, offset]
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
      [id]
    );
    
    if (result.rows.length > 0) {
      return result.rows.item(0);
    }
    
    return null;
  }

  async getMasaibGroups(): Promise<MasaibGroup[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const [result] = await this.db.executeSql(
      'SELECT masaib, COUNT(*) as count FROM kalaam GROUP BY masaib ORDER BY count DESC'
    );
    
    const groups: MasaibGroup[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      groups.push(result.rows.item(i));
    }
    
    return groups;
  }

  async getPoetGroups(): Promise<PoetGroup[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const [result] = await this.db.executeSql(
      'SELECT poet, COUNT(*) as count FROM kalaam GROUP BY poet ORDER BY count DESC'
    );
    
    const groups: PoetGroup[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      groups.push(result.rows.item(i));
    }
    
    return groups;
  }

  async getReciterGroups(): Promise<ReciterGroup[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const [result] = await this.db.executeSql(
      'SELECT reciter, COUNT(*) as count FROM kalaam GROUP BY reciter ORDER BY count DESC'
    );
    
    const groups: ReciterGroup[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      groups.push(result.rows.item(i));
    }
    
    return groups;
  }

  async addFavourite(kalaamId: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.executeSql('INSERT OR REPLACE INTO favourites (kalaam_id) VALUES (?)', [kalaamId]);
  }

  async removeFavourite(kalaamId: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.executeSql('DELETE FROM favourites WHERE kalaam_id = ?', [kalaamId]);
  }

  async isFavourite(kalaamId: number): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');
    const [result] = await this.db.executeSql('SELECT 1 FROM favourites WHERE kalaam_id = ? LIMIT 1', [kalaamId]);
    return result.rows.length > 0;
  }

  async getFavouriteKalaams(page: number = 1, limit: number = 50): Promise<KalaamListResponse> {
    if (!this.db) throw new Error('Database not initialized');
    const offset = (page - 1) * limit;

    const [countResult] = await this.db.executeSql('SELECT COUNT(*) as total FROM favourites');
    const total = countResult.rows.item(0).total;

    const [result] = await this.db.executeSql(
      'SELECT k.* FROM favourites f JOIN kalaam k ON k.id = f.kalaam_id ORDER BY f.created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
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
    }
  }
}

export default new DatabaseService();

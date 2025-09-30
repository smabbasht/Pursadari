import { Kalaam, MasaibGroup, PoetGroup, ReciterGroup, KalaamListResponse } from '../types';
import { databaseService } from './DatabaseFactory';
import { Settings } from './repositories/SQLiteRepository';
import { IDatabaseService } from './interfaces/IDatabaseService';

/**
 * DatabaseService - Facade for database operations
 * 
 * This service acts as a facade over the actual database implementation.
 * It uses the DatabaseFactory to get the configured database service.
 */
export class DatabaseService {
  private static instance: DatabaseService | null = null;
  private initialized = false;
  private initPromise: Promise<void> | null = null;
  private db: IDatabaseService | null = null;

  private constructor() {
    console.log('DatabaseService: Constructor called');
    try {
      this.db = databaseService;
      console.log('DatabaseService: Database service assigned successfully');
    } catch (error) {
      console.error('DatabaseService: Failed to get database service:', error);
      this.db = null;
    }
  }
  
  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      console.log('DatabaseService: Creating new instance');
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private async ensureInitialized(): Promise<void> {
    console.log('DatabaseService: Ensuring initialization...');
    
    if (this.initialized && this.db) {
      console.log('DatabaseService: Already initialized');
      return;
    }

    if (this.initPromise) {
      console.log('DatabaseService: Initialization in progress, waiting...');
      return this.initPromise;
    }

    if (!this.db) {
      console.log('DatabaseService: Trying to recreate database service...');
      try {
        this.db = databaseService;
      } catch (error) {
        console.error('DatabaseService: Failed to get database service:', error);
        throw new Error('Database service not available');
      }
    }

    this.initPromise = (async () => {
      try {
        console.log('DatabaseService: Starting database initialization...');
        const db = this.ensureDatabase();
        await db.init();
        this.initialized = true;
        console.log('DatabaseService: Database initialized successfully');
      } catch (error) {
        console.error('DatabaseService: Failed to initialize database:', error);
        this.initialized = false;
        this.db = null; // Clear the reference if initialization fails
        throw error;
      } finally {
        this.initPromise = null;
      }
    })();

    return this.initPromise;
  }

  private ensureDatabase(): IDatabaseService {
    if (!this.db) {
      throw new Error('Database service not available');
    }
    return this.db;
  }

  async init(): Promise<void> {
    console.log('DatabaseService: Beginning initialization...');
    
    try {
      await this.ensureInitialized();
      console.log('DatabaseService: Checking settings...');
      const db = this.ensureDatabase();
      const settings = await db.getAllSettings();
      
      // Ensure required settings exist
      const requiredSettings = {
        theme: 'light',
        accent_color: '#16a34a',
        urdu_font_size: '1.2',
        eng_font_size: '1.0',
        urdu_font: 'System',
        eng_font: 'System',
        default_language: 'urdu'
      };

      // Set any missing settings with defaults
      for (const [key, defaultValue] of Object.entries(requiredSettings)) {
        if (!settings || !(key in settings)) {
          console.log(`DatabaseService: Setting default value for ${key}`);
          const db = this.ensureDatabase();  // Get fresh instance to ensure it's available
          await db.setSetting(key, defaultValue);
        }
      }
    } catch (error) {
      console.error('Error initializing settings:', error);
      throw error;
    }
  }

  async getSetting(key: string): Promise<string | null> {
    await this.ensureInitialized();
    const db = this.ensureDatabase();
    return db.getSetting(key);
  }

  async setSetting(key: string, value: string): Promise<void> {
    await this.ensureInitialized();
    const db = this.ensureDatabase();
    return db.setSetting(key, value);
  }

  async getAllSettings(): Promise<Partial<Settings>> {
    await this.ensureInitialized();
    const db = this.ensureDatabase();
    return db.getAllSettings();
  }

  async searchKalaams(
    query: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<KalaamListResponse> {
    await this.ensureInitialized();
    const db = this.ensureDatabase();
    return db.searchKalaams(query, page, limit);
  }

  async getKalaamsByMasaib(
    masaib: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<KalaamListResponse> {
    await this.ensureInitialized();
    const db = this.ensureDatabase();
    return db.getKalaamsByMasaib(masaib, page, limit);
  }

  async getKalaamsByPoet(
    poet: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<KalaamListResponse> {
    await this.ensureInitialized();
    const db = this.ensureDatabase();
    return db.getKalaamsByPoet(poet, page, limit);
  }

  async getKalaamsByReciter(
    reciter: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<KalaamListResponse> {
    await this.ensureInitialized();
    const db = this.ensureDatabase();
    return db.getKalaamsByReciter(reciter, page, limit);
  }

  async getKalaamById(id: number): Promise<Kalaam | null> {
    await this.ensureInitialized();
    const db = this.ensureDatabase();
    return db.getKalaamById(id);
  }

  async getMasaibGroups(): Promise<MasaibGroup[]> {
    await this.ensureInitialized();
    const db = this.ensureDatabase();
    return db.getMasaibGroups();
  }

  async getPoetGroups(): Promise<PoetGroup[]> {
    await this.ensureInitialized();
    const db = this.ensureDatabase();
    return db.getPoetGroups();
  }

  async getReciterGroups(): Promise<ReciterGroup[]> {
    await this.ensureInitialized();
    const db = this.ensureDatabase();
    return db.getReciterGroups();
  }

  async getMasaibByReciter(reciter: string): Promise<string[]> {
    await this.ensureInitialized();
    const db = this.ensureDatabase();
    return db.getMasaibByReciter(reciter);
  }

  async getKalaamsByReciterAndMasaib(
    reciter: string,
    masaib: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<KalaamListResponse> {
    await this.ensureInitialized();
    const db = this.ensureDatabase();
    return db.getKalaamsByReciterAndMasaib(reciter, masaib, page, limit);
  }

  async close(): Promise<void> {
    await this.ensureInitialized();
    const db = this.ensureDatabase();
    return db.close();
  }
}
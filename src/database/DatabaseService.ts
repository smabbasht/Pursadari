import {
  Kalaam,
  MasaibGroup,
  PoetGroup,
  ReciterGroup,
  KalaamListResponse,
} from '../types';
import { databaseService } from './DatabaseFactory';

/**
 * DatabaseService - Facade for database operations
 * 
 * This service acts as a facade over the actual database implementation.
 * It uses the DatabaseFactory to get the configured database service
 * (currently SQLite, but easily switchable to Firebase).
 * 
 * To switch to Firebase in the future:
 * 1. Change DATABASE_TYPE in DatabaseFactory.ts to DatabaseType.FIREBASE
 * 2. Implement the FirebaseRepository methods
 * 3. No changes needed in this file or any consuming code
 */
export class DatabaseService {
  private db = databaseService;

  async init(): Promise<void> {
    return this.db.init();
  }

  async searchKalaams(
    query: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<KalaamListResponse> {
    return this.db.searchKalaams(query, page, limit);
  }

  async getKalaamsByMasaib(
    masaib: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<KalaamListResponse> {
    return this.db.getKalaamsByMasaib(masaib, page, limit);
  }

  async getKalaamsByPoet(
    poet: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<KalaamListResponse> {
    return this.db.getKalaamsByPoet(poet, page, limit);
  }

  async getKalaamsByReciter(
    reciter: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<KalaamListResponse> {
    return this.db.getKalaamsByReciter(reciter, page, limit);
  }

  async getKalaamById(id: number): Promise<Kalaam | null> {
    return this.db.getKalaamById(id);
  }

  async getMasaibGroups(): Promise<MasaibGroup[]> {
    return this.db.getMasaibGroups();
  }

  async getPoetGroups(): Promise<PoetGroup[]> {
    return this.db.getPoetGroups();
  }

  async getReciterGroups(): Promise<ReciterGroup[]> {
    return this.db.getReciterGroups();
  }

  async getMasaibByReciter(reciter: string): Promise<string[]> {
    return this.db.getMasaibByReciter(reciter);
  }

  async getKalaamsByReciterAndMasaib(
    reciter: string,
    masaib: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<KalaamListResponse> {
    return this.db.getKalaamsByReciterAndMasaib(reciter, masaib, page, limit);
  }

  // Note: Favorites operations are now handled by FavoritesService using AsyncStorage

  async close(): Promise<void> {
    return this.db.close();
  }
}

export default new DatabaseService();

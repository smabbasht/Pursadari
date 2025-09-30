import {
  Kalaam,
  MasaibGroup,
  PoetGroup,
  ReciterGroup,
  KalaamListResponse,
} from '../../types';
import { Settings } from '../repositories/SQLiteRepository';

export interface IDatabaseService {
  init(): Promise<void>;
  close(): Promise<void>;
  
  // Kalaam operations
  searchKalaams(query: string, page?: number, limit?: number): Promise<KalaamListResponse>;
  getKalaamsByMasaib(masaib: string, page?: number, limit?: number): Promise<KalaamListResponse>;
  getKalaamsByPoet(poet: string, page?: number, limit?: number): Promise<KalaamListResponse>;
  getKalaamsByReciter(reciter: string, page?: number, limit?: number): Promise<KalaamListResponse>;
  getKalaamsByReciterAndMasaib(reciter: string, masaib: string, page?: number, limit?: number): Promise<KalaamListResponse>;
  getKalaamById(id: number): Promise<Kalaam | null>;
  
  // Group operations
  getMasaibGroups(): Promise<MasaibGroup[]>;
  getPoetGroups(): Promise<PoetGroup[]>;
  getReciterGroups(): Promise<ReciterGroup[]>;
  getMasaibByReciter(reciter: string): Promise<string[]>;
  
  // Settings operations
  getSetting(key: string): Promise<string | null>;
  setSetting(key: string, value: string): Promise<void>;
  getAllSettings(): Promise<Partial<Settings>>;
}

import {
  Kalaam,
  MasaibGroup,
  PoetGroup,
  ReciterGroup,
  KalaamListResponse,
} from '../../types';

export interface KalaamListResponse {
  kalaams: Kalaam[];
  total: number;
  page: number; // Keep page for context, though not directly used in Firestore pagination
  limit: number;
  lastVisibleDoc?: any; // Add this to return the last document snapshot for cursor-based pagination
}

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
  
  // Note: Favorites operations are now handled by FavoritesService using AsyncStorage
}

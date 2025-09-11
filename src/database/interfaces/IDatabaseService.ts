import {
  Kalaam,
  MasaibGroup,
  PoetGroup,
  ReciterGroup,
  KalaamListResponse,
} from '../../types';

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
  
  // Favorites operations
  addFavourite(kalaamId: number): Promise<void>;
  removeFavourite(kalaamId: number): Promise<void>;
  isFavourite(kalaamId: number): Promise<boolean>;
  getFavouriteKalaams(page?: number, limit?: number): Promise<KalaamListResponse>;
}

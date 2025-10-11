export interface Kalaam {
  id: number;
  title: string;
  reciter: string;
  poet: string;
  masaib: string;
  lyrics_urdu: string;
  lyrics_eng: string;
  yt_link: string;
  source_url: string;
  fetched_at: string;
  last_modified?: string;
  deleted?: boolean;
}

export interface MasaibGroup {
  masaib: string;
  count: number;
}

export interface PoetGroup {
  poet: string;
  count: number;
}

export interface ReciterGroup {
  reciter: string;
  count: number;
}

export interface KalaamListResponse {
  kalaams: Kalaam[];
  total: number;
  page: number;
  limit: number;
  lastVisibleDoc?: any; // Add this to return the last document snapshot for cursor-based pagination
}

export interface KalaamDetailResponse {
  kalaam: Kalaam;
}

export type RootStackParamList = {
  Tabs: undefined;
  Masaib: { masaib: string };
  Poet: { poet: string };
  Reciter: { reciter: string };
  Kalaam: { id: number };
};

export type TabParamList = {
  Home: undefined;
  Search: undefined;
  AddLyrics: undefined;
  Favourites: undefined;
  Settings: undefined;
};

// Sync-related interfaces
export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  activeRecords: number;
  deletedRecords: number;
  error?: string;
}

export interface SyncConfig {
  backgroundSyncInterval: number; // minutes
  foregroundSyncOnAppOpen: boolean;
  wifiOnlySync: boolean;
  maxRetryAttempts: number;
  batchSize: number;
}

export interface SyncEvent {
  type: 'background' | 'foreground' | 'manual';
  recordsProcessed: number;
  duration: number;
  success: boolean;
  error?: string;
}

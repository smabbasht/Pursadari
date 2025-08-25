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
}

export interface KalaamDetailResponse {
  kalaam: Kalaam;
}

export type RootStackParamList = {
  Home: undefined;
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

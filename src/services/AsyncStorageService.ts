import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * AsyncStorage Service for client-side data persistence
 * 
 * This service handles all client-side storage operations including:
 * - App settings (theme, fonts, colors, etc.)
 * - User favorites
 * - Any other local app data
 */

export class AsyncStorageService {
  // Storage keys
  private static readonly KEYS = {
    SETTINGS: '@bayaaz_settings',
    FAVORITES: '@bayaaz_favorites',
  };

  // Settings operations
  static async saveSettings(settings: any): Promise<void> {
    try {
      await AsyncStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('AsyncStorageService: Error saving settings:', error);
      throw error;
    }
  }

  static async loadSettings(): Promise<any | null> {
    try {
      const settings = await AsyncStorage.getItem(this.KEYS.SETTINGS);
      return settings ? JSON.parse(settings) : null;
    } catch (error) {
      console.error('AsyncStorageService: Error loading settings:', error);
      return null;
    }
  }

  // Favorites operations
  static async saveFavorites(favorites: number[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.KEYS.FAVORITES, JSON.stringify(favorites));
    } catch (error) {
      console.error('AsyncStorageService: Error saving favorites:', error);
      throw error;
    }
  }

  static async loadFavorites(): Promise<number[]> {
    try {
      const favorites = await AsyncStorage.getItem(this.KEYS.FAVORITES);
      return favorites ? JSON.parse(favorites) : [];
    } catch (error) {
      console.error('AsyncStorageService: Error loading favorites:', error);
      return [];
    }
  }

  static async addFavorite(kalaamId: number): Promise<void> {
    try {
      const favorites = await this.loadFavorites();
      if (!favorites.includes(kalaamId)) {
        favorites.push(kalaamId);
        await this.saveFavorites(favorites);
      }
    } catch (error) {
      console.error('AsyncStorageService: Error adding favorite:', error);
      throw error;
    }
  }

  static async removeFavorite(kalaamId: number): Promise<void> {
    try {
      const favorites = await this.loadFavorites();
      const updatedFavorites = favorites.filter(id => id !== kalaamId);
      await this.saveFavorites(updatedFavorites);
    } catch (error) {
      console.error('AsyncStorageService: Error removing favorite:', error);
      throw error;
    }
  }

  static async isFavorite(kalaamId: number): Promise<boolean> {
    try {
      const favorites = await this.loadFavorites();
      return favorites.includes(kalaamId);
    } catch (error) {
      console.error('AsyncStorageService: Error checking favorite:', error);
      return false;
    }
  }

  // Clear all data (useful for logout or reset)
  static async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        this.KEYS.SETTINGS,
        this.KEYS.FAVORITES,
      ]);
    } catch (error) {
      console.error('AsyncStorageService: Error clearing all data:', error);
      throw error;
    }
  }
}

export default AsyncStorageService;

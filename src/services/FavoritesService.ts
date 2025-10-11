import { Kalaam, KalaamListResponse } from '../types';
import database from '../database/Database';


/**
 * Favorites Service
 * 
 * This service manages user favorites using SQLite for persistence.
 * It provides methods to add, remove, check, and retrieve favorite kalaams.
 * The actual kalaam data is fetched from the database service.
 */
class FavoritesService {
  private static FAVORITES_KEY = 'user_favorites';
  private static PINS_KEY = 'user_pins';
  private static MAX_PINS = 3;

  private static async getFavoritesList(): Promise<number[]> {
    const favoritesStr = await database.getSetting(this.FAVORITES_KEY);
    return favoritesStr ? JSON.parse(favoritesStr) : [];
  }

  private static async saveFavoritesList(favorites: number[]): Promise<void> {
    await database.setSetting(this.FAVORITES_KEY, JSON.stringify(favorites));
  }

  private static async getPinsList(): Promise<number[]> {
    const pinsStr = await database.getSetting(this.PINS_KEY);
    return pinsStr ? JSON.parse(pinsStr) : [];
  }

  private static async savePinsList(pins: number[]): Promise<void> {
    await database.setSetting(this.PINS_KEY, JSON.stringify(pins));
  }

  /**
   * Add a kalaam to favorites
   */
  static async addFavorite(kalaamId: number): Promise<void> {
    const favorites = await this.getFavoritesList();
    if (!favorites.includes(kalaamId)) {
      favorites.push(kalaamId);
      await this.saveFavoritesList(favorites);
    }
  }

  /**
   * Remove a kalaam from favorites
   */
  static async removeFavorite(kalaamId: number): Promise<void> {
    // Prevent unfavoriting special content (Hadees e Kisa, Ziyarat Ashura)
    if (kalaamId < 0) {
      console.log('[FavoritesService] Cannot unfavorite special content');
      return;
    }
    
    const favorites = await this.getFavoritesList();
    const index = favorites.indexOf(kalaamId);
    if (index !== -1) {
      favorites.splice(index, 1);
      await this.saveFavoritesList(favorites);
    }
  }

  /**
   * Check if a kalaam is favorited
   */
  static async isFavorite(kalaamId: number): Promise<boolean> {
    const favorites = await this.getFavoritesList();
    return favorites.includes(kalaamId);
  }

  /**
   * Pin a kalaam (max 3 pins allowed)
   */
  static async pinKalaam(kalaamId: number): Promise<boolean> {
    const pins = await this.getPinsList();
    
    if (pins.includes(kalaamId)) {
      return false; // Already pinned
    }
    
    if (pins.length >= this.MAX_PINS) {
      return false; // Max pins reached
    }
    
    pins.push(kalaamId);
    await this.savePinsList(pins);
    return true;
  }

  /**
   * Unpin a kalaam
   */
  static async unpinKalaam(kalaamId: number): Promise<void> {
    // Prevent unpinning special content (Hadees e Kisa, Ziyarat Ashura)
    if (kalaamId < 0) {
      console.log('[FavoritesService] Cannot unpin special content');
      return;
    }
    
    const pins = await this.getPinsList();
    const index = pins.indexOf(kalaamId);
    if (index !== -1) {
      pins.splice(index, 1);
      await this.savePinsList(pins);
    }
  }

  /**
   * Check if a kalaam is pinned
   */
  static async isPinned(kalaamId: number): Promise<boolean> {
    const pins = await this.getPinsList();
    return pins.includes(kalaamId);
  }

  /**
   * Get all pinned kalaams
   */
  static async getPinnedKalaams(): Promise<Kalaam[]> {
    try {
      const pinIds = await this.getPinsList();
      
      if (pinIds.length === 0) {
        return [];
      }

      // Fetch kalaams by IDs
      const promises = pinIds.map(id => database.getKalaamById(id));
      const kalaams = (await Promise.all(promises)).filter((k): k is Kalaam => k !== null);
      
      return kalaams;
    } catch (error) {
      console.error('Error getting pinned kalaams:', error);
      return [];
    }
  }

  /**
   * Get all favorite kalaams with pagination
   */
  static async getFavoriteKalaams(
    limit: number = 50,
    startAfterDoc?: any
  ): Promise<KalaamListResponse> {
    try {
      const favoriteIds = await this.getFavoritesList();
      
      if (favoriteIds.length === 0) {
        return {
          kalaams: [],
          total: 0,
          page: 1,
          limit,
          lastVisibleDoc: null
        };
      }

      // Fetch kalaams by IDs
      const promises = favoriteIds.map(id => database.getKalaamById(id));
      const kalaams = (await Promise.all(promises)).filter((k): k is Kalaam => k !== null);

      return {
        kalaams,
        total: kalaams.length,
        page: 1,
        limit,
        lastVisibleDoc: null
      };
    } catch (error) {
      console.error('Error getting favorite kalaams:', error);
      return {
        kalaams: [],
        total: 0,
        page: 1,
        limit,
        lastVisibleDoc: null
      };
    }
  }
}

export default FavoritesService;
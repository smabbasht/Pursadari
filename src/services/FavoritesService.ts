import { Kalaam, KalaamListResponse } from '../types';
import databaseService from '../database/DatabaseFactory';


/**
 * Favorites Service
 * 
 * This service manages user favorites using SQLite for persistence.
 * It provides methods to add, remove, check, and retrieve favorite kalaams.
 * The actual kalaam data is fetched from the database service.
 */
class FavoritesService {
  private static FAVORITES_KEY = 'user_favorites';

  private static async getFavoritesList(): Promise<number[]> {
    const favoritesStr = await databaseService.getSetting(this.FAVORITES_KEY);
    return favoritesStr ? JSON.parse(favoritesStr) : [];
  }

  private static async saveFavoritesList(favorites: number[]): Promise<void> {
    await databaseService.setSetting(this.FAVORITES_KEY, JSON.stringify(favorites));
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
      const promises = favoriteIds.map(id => databaseService.getKalaamById(id));
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
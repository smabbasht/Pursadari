import { Kalaam, KalaamListResponse } from '../types';
import AsyncStorageService from './AsyncStorageService';
import DatabaseService from '../database/DatabaseService';

/**
 * Favorites Service
 * 
 * This service manages user favorites using AsyncStorage for persistence.
 * It provides methods to add, remove, check, and retrieve favorite kalaams.
 * The actual kalaam data is fetched from the database service when needed.
 */
export class FavoritesService {
  /**
   * Add a kalaam to favorites
   */
  static async addFavorite(kalaamId: number): Promise<void> {
    await AsyncStorageService.addFavorite(kalaamId);
  }

  /**
   * Remove a kalaam from favorites
   */
  static async removeFavorite(kalaamId: number): Promise<void> {
    await AsyncStorageService.removeFavorite(kalaamId);
  }

  /**
   * Check if a kalaam is favorited
   */
  static async isFavorite(kalaamId: number): Promise<boolean> {
    return await AsyncStorageService.isFavorite(kalaamId);
  }

  /**
   * Get all favorite kalaams with pagination
   */
  static async getFavoriteKalaams(
    limit: number = 50,
    startAfterDoc?: any
  ): Promise<KalaamListResponse> {
    try {
      // Get favorite IDs from AsyncStorage
      const favoriteIds = await AsyncStorageService.loadFavorites();
      
      if (favoriteIds.length === 0) {
        return {
          kalaams: [],
          total: 0,
          page: 1,
          limit,
          hasMore: false,
          lastVisibleDoc: undefined,
        };
      }

      // For pagination, we'll implement a simple offset-based approach
      // since we're working with a local array of IDs
      const startIndex = startAfterDoc ? startAfterDoc : 0;
      const endIndex = startIndex + limit;
      const paginatedIds = favoriteIds.slice(startIndex, endIndex);

      // Fetch kalaam details for the paginated IDs
      const kalaams: Kalaam[] = [];
      for (const id of paginatedIds) {
        try {
          const kalaam = await DatabaseService.getKalaamById(id);
          if (kalaam) {
            kalaams.push(kalaam);
          }
        } catch (error) {
          console.warn(`FavoritesService: Could not fetch kalaam ${id}:`, error);
        }
      }

      const hasMore = endIndex < favoriteIds.length;
      const lastVisibleDoc = hasMore ? endIndex : undefined;

      return {
        kalaams,
        total: favoriteIds.length,
        page: Math.floor(startIndex / limit) + 1,
        limit,
        hasMore,
        lastVisibleDoc,
      };
    } catch (error) {
      console.error('FavoritesService: Error getting favorite kalaams:', error);
      return {
        kalaams: [],
        total: 0,
        page: 1,
        limit,
        hasMore: false,
        lastVisibleDoc: undefined,
      };
    }
  }

  /**
   * Get all favorite IDs (useful for checking multiple items at once)
   */
  static async getAllFavoriteIds(): Promise<number[]> {
    return await AsyncStorageService.loadFavorites();
  }

  /**
   * Clear all favorites
   */
  static async clearAllFavorites(): Promise<void> {
    await AsyncStorageService.saveFavorites([]);
  }
}

export default FavoritesService;

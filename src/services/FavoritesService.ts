import { Kalaam, KalaamListResponse } from '../types';
import database from '../database/Database';


/**
 * Favorites Service
 * 
 * This service manages user favorites using SQLite database table for persistence.
 * It provides methods to add, remove, check, and retrieve favorite kalaams.
 * Pinned items stay at the top, ordered by when they were pinned.
 */
class FavoritesService {

  /**
   * Add a kalaam to favorites
   */
  static async addFavorite(kalaamId: number): Promise<void> {
    console.log('[FavoritesService] addFavorite called with id:', kalaamId, 'type:', typeof kalaamId);
    const db = database.ensureInitialized();
    const stringId = kalaamId.toString();
    console.log('[FavoritesService] Converting to string ID:', stringId);
    await db.executeSql(`
      INSERT OR IGNORE INTO favourites (kalaam_id, created_at, pinned)
      VALUES (?, datetime('now'), 0)
    `, [stringId]);
    console.log('[FavoritesService] addFavorite completed for id:', stringId);
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
    
    const db = database.ensureInitialized();
    await db.executeSql('DELETE FROM favourites WHERE kalaam_id = ?', [kalaamId.toString()]);
  }

  /**
   * Check if a kalaam is favorited
   */
  static async isFavorite(kalaamId: number): Promise<boolean> {
    console.log('[FavoritesService] isFavorite called with id:', kalaamId, 'type:', typeof kalaamId);
    const db = database.ensureInitialized();
    const stringId = kalaamId.toString();
    console.log('[FavoritesService] Checking favorite for string ID:', stringId);
    const [result] = await db.executeSql('SELECT COUNT(*) as count FROM favourites WHERE kalaam_id = ?', [stringId]);
    const isFav = result.rows.item(0).count > 0;
    console.log('[FavoritesService] isFavorite result:', isFav, 'for id:', stringId);
    return isFav;
  }

  /**
   * Pin a kalaam (updates existing favorite or creates new one)
   */
  static async pinKalaam(kalaamId: number): Promise<boolean> {
    const db = database.ensureInitialized();
    
    // Check if already pinned
    const [checkResult] = await db.executeSql('SELECT pinned FROM favourites WHERE kalaam_id = ?', [kalaamId.toString()]);
    if (checkResult.rows.length > 0 && checkResult.rows.item(0).pinned) {
      return false; // Already pinned
    }
    
    // Update existing favorite or insert new one
    await db.executeSql(`
      INSERT OR REPLACE INTO favourites (kalaam_id, created_at, pinned)
      VALUES (?, datetime('now'), 1)
    `, [kalaamId.toString()]);
    
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
    
    const db = database.ensureInitialized();
    await db.executeSql('UPDATE favourites SET pinned = 0 WHERE kalaam_id = ?', [kalaamId.toString()]);
  }

  /**
   * Check if a kalaam is pinned
   */
  static async isPinned(kalaamId: number): Promise<boolean> {
    const db = database.ensureInitialized();
    const [result] = await db.executeSql('SELECT pinned FROM favourites WHERE kalaam_id = ?', [kalaamId.toString()]);
    return result.rows.length > 0 && result.rows.item(0).pinned === 1;
  }

  /**
   * Get all pinned kalaams
   */
  static async getPinnedKalaams(): Promise<Kalaam[]> {
    try {
      console.log('[FavoritesService] getPinnedKalaams called');
      const db = database.ensureInitialized();
      
      // Get pinned kalaams ordered by created_at
      const [result] = await db.executeSql(`
        SELECT kalaam_id FROM favourites 
        WHERE pinned = 1 
        ORDER BY created_at ASC
      `);

      console.log('[FavoritesService] Found', result.rows.length, 'pinned kalaams');

      const pinnedIds: number[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        const row = result.rows.item(i);
        console.log('[FavoritesService] Pinned row:', row);
        // Convert string ID back to number for getKalaamById
        const numId = parseInt(row.kalaam_id);
        pinnedIds.push(numId);
        console.log('[FavoritesService] Converted pinned string ID', row.kalaam_id, 'to number ID', numId);
      }

      if (pinnedIds.length === 0) {
        console.log('[FavoritesService] No pinned kalaams found');
        return [];
      }

      // Fetch kalaams by IDs
      console.log('[FavoritesService] Fetching pinned kalaams for IDs:', pinnedIds);
      const promises = pinnedIds.map(id => database.getKalaamById(id));
      const kalaams = (await Promise.all(promises)).filter((k): k is Kalaam => k !== null);
      console.log('[FavoritesService] Successfully fetched', kalaams.length, 'pinned kalaams');
      
      return kalaams;
    } catch (error) {
      console.error('[FavoritesService] Error getting pinned kalaams:', error);
      return [];
    }
  }

  /**
   * Get all favorite kalaams with pinned items at the top
   */
  static async getFavoriteKalaams(
    limit: number = 50,
    startAfterDoc?: any
  ): Promise<KalaamListResponse> {
    try {
      console.log('[FavoritesService] getFavoriteKalaams called with limit:', limit);
      const db = database.ensureInitialized();
      
      // Get favorites ordered by pinned first, then by created_at
      const [result] = await db.executeSql(`
        SELECT kalaam_id, pinned, created_at 
        FROM favourites 
        ORDER BY pinned DESC, created_at ASC
        LIMIT ?
      `, [limit]);

      console.log('[FavoritesService] Found', result.rows.length, 'favorites in database');

      const favoriteIds: number[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        const row = result.rows.item(i);
        console.log('[FavoritesService] Favorite row:', row);
        // Convert string ID back to number for getKalaamById
        const numId = parseInt(row.kalaam_id);
        favoriteIds.push(numId);
        console.log('[FavoritesService] Converted string ID', row.kalaam_id, 'to number ID', numId);
      }

      console.log('[FavoritesService] Favorite IDs to fetch:', favoriteIds);

      if (favoriteIds.length === 0) {
        console.log('[FavoritesService] No favorites found, returning empty result');
        return {
          kalaams: [],
          total: 0,
          page: 1,
          limit,
          lastVisibleDoc: null
        };
      }

      // Fetch kalaams by IDs
      console.log('[FavoritesService] Fetching kalaams for IDs:', favoriteIds);
      const promises = favoriteIds.map(id => database.getKalaamById(id));
      const kalaams = (await Promise.all(promises)).filter((k): k is Kalaam => k !== null);
      console.log('[FavoritesService] Successfully fetched', kalaams.length, 'kalaams');

      return {
        kalaams,
        total: kalaams.length,
        page: 1,
        limit,
        lastVisibleDoc: null
      };
    } catch (error) {
      console.error('[FavoritesService] Error getting favorite kalaams:', error);
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
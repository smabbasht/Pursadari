import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import database from '../database/Database';
import { notificationService } from './NotificationService';
import { Kalaam, SyncResult, SyncConfig } from '../types';

const defaultSyncConfig: SyncConfig = {
  backgroundSyncInterval: 30,
  foregroundSyncOnAppOpen: true,
  wifiOnlySync: false,
  maxRetryAttempts: 3,
  batchSize: 100
};

export class SyncManager {
  private firestore: typeof firestore;
  private lastSyncTimestamp: number = 0;
  private syncConfig: SyncConfig = defaultSyncConfig;
  private isSyncing: boolean = false; // Sync lock to prevent concurrent syncs

  constructor() {
    this.firestore = firestore();
  }

  async syncKalaamData(): Promise<SyncResult> {
    // Prevent concurrent syncs
    if (this.isSyncing) {
      console.log('[SyncManager] Sync already in progress, skipping...');
      return {
        success: true,
        recordsProcessed: 0,
        activeRecords: 0,
        deletedRecords: 0
      };
    }

    this.isSyncing = true;

    try {
      console.log('[SyncManager] Starting sync...');

      // Ensure database is initialized
      await database.init();
      console.log('[SyncManager] Database initialized for sync');

      // Get last sync timestamp
      this.lastSyncTimestamp = await database.getLastSyncTimestamp();
      console.log('[SyncManager] Last sync timestamp:', this.lastSyncTimestamp);


      // Check if sync already happened today
      const now = Date.now();
      const today = new Date().toDateString();
      const lastSyncDate = new Date(this.lastSyncTimestamp).toDateString();
      
      if (today === lastSyncDate && this.lastSyncTimestamp > 0) {
        console.log('[SyncManager] Daily sync already completed today, skipping...');
        // Show notification that sync already happened today
        notificationService.showAlreadySyncedTodayNotification();
        return {
          success: true,
          recordsProcessed: 0,
          activeRecords: 0,
          deletedRecords: 0
        };
      }

      // Ensure we only fetch records with last_modified > last sync timestamp
      let queryTimestamp = this.lastSyncTimestamp;
      if (this.lastSyncTimestamp === 0) {
        // For first sync (new app install), only get last 3 days to reduce initial load
        const threeDaysAgo = now - (3 * 24 * 60 * 60 * 1000);
        queryTimestamp = threeDaysAgo;
        console.log('[SyncManager] First sync - limiting to last 3 days from bundling time');
      } else {
        // For daily syncs, use exact last sync timestamp to ensure delta sync
        // Only fetch records modified AFTER our last sync
        queryTimestamp = this.lastSyncTimestamp;
        console.log('[SyncManager] Daily sync - fetching only records modified after last sync:', new Date(queryTimestamp).toISOString());
      }

      // CRITICAL: Only fetch records with last_modified > last sync timestamp
      const query = this.firestore
        .collection('kalaam')
        .where('last_modified', '>', new Date(queryTimestamp))
        .orderBy('last_modified')
        .limit(50); // Reduced limit for better performance

      const snapshot = await query.get();
      const records = snapshot.docs.map(doc => ({
        id: parseInt(doc.id),
        ...doc.data()
      })) as Kalaam[];

      console.log(`[SyncManager] Found ${records.length} records to sync`);
      console.log(`[SyncManager] Query timestamp: ${new Date(queryTimestamp).toISOString()}`);
      console.log(`[SyncManager] Only fetching records with last_modified > ${new Date(queryTimestamp).toISOString()}`);
      
      // If no records to sync, return early
      if (records.length === 0) {
        console.log('[SyncManager] No new records to sync - all records are up to date');
        return {
          success: true,
          recordsProcessed: 0,
          activeRecords: 0,
          deletedRecords: 0
        };
      }
      
      // Skip start notification to reduce notification spam
      // notificationService.showSyncStartNotification(records.length);
      
      // Smart batching for large datasets
      if (records.length >= 50) {
        console.log('[SyncManager] Large dataset detected - using smart batching');
        return await this.performBatchedSync(records);
      }

      // Filter out deleted records
      const activeRecords = records.filter(record => !record.deleted);
      const deletedRecords = records.filter(record => record.deleted);

      console.log(`[SyncManager] Active records: ${activeRecords.length}, Deleted records: ${deletedRecords.length}`);

      // Update local database
      await this.updateLocalDatabase(activeRecords, deletedRecords);

      // Update sync timestamp
      await database.updateSyncTimestamp();
      
      // Track sync attempt for daily limits
      await database.incrementSyncAttempt();

      const result: SyncResult = {
        success: true,
        recordsProcessed: records.length,
        activeRecords: activeRecords.length,
        deletedRecords: deletedRecords.length
      };

      console.log('[SyncManager] Sync completed successfully:', result);
      return result;

    } catch (error) {
      console.error('[SyncManager] Sync failed:', error);
      return {
        success: false,
        recordsProcessed: 0,
        activeRecords: 0,
        deletedRecords: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      // Always release the sync lock
      this.isSyncing = false;
    }
  }

  private async updateLocalDatabase(activeRecords: Kalaam[], deletedRecords: Kalaam[]): Promise<void> {
    console.log('[SyncManager] Updating local database...');
    
    const totalRecords = activeRecords.length + deletedRecords.length;
    let processedRecords = 0;
    
    // Process active records (upsert)
    for (const record of activeRecords) {
      await database.upsertKalaam(record);
      processedRecords++;
      
      // Show progress notification every 10 records or at the end
      if (processedRecords % 10 === 0 || processedRecords === totalRecords) {
        // Disabled to prevent notification spam
        // notificationService.showSyncProgressNotification(processedRecords, totalRecords);
      }
    }

    // Process deleted records (remove from local database)
    for (const record of deletedRecords) {
      await database.deleteKalaam(record.id);
      processedRecords++;
      
      // Show progress notification every 10 records or at the end
      if (processedRecords % 10 === 0 || processedRecords === totalRecords) {
        // Disabled to prevent notification spam
        // notificationService.showSyncProgressNotification(processedRecords, totalRecords);
      }
    }

    console.log('[SyncManager] Local database updated successfully');
  }

  private async performBatchedSync(records: Kalaam[]): Promise<SyncResult> {
    console.log('[SyncManager] Performing batched sync for large dataset');
    
    const batchSize = 10; // Process 10 records at a time
    const activeRecords = records.filter(record => !record.deleted);
    const deletedRecords = records.filter(record => record.deleted);
    
    let processedCount = 0;
    const totalRecords = records.length;
    
    // Process active records in batches
    for (let i = 0; i < activeRecords.length; i += batchSize) {
      const batch = activeRecords.slice(i, i + batchSize);
      
      for (const record of batch) {
        await database.upsertKalaam(record);
        processedCount++;
        
        // Show progress every 5 records
        if (processedCount % 5 === 0) {
          // Disabled to prevent notification spam
          // notificationService.showSyncProgressNotification(processedCount, totalRecords);
        }
      }
      
      // Small delay between batches to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Process deleted records in batches
    for (let i = 0; i < deletedRecords.length; i += batchSize) {
      const batch = deletedRecords.slice(i, i + batchSize);
      
      for (const record of batch) {
        await database.deleteKalaam(record.id);
        processedCount++;
        
        // Show progress every 5 records
        if (processedCount % 5 === 0) {
          // Disabled to prevent notification spam
          // notificationService.showSyncProgressNotification(processedCount, totalRecords);
        }
      }
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Update sync timestamp
    await database.updateSyncTimestamp();
    await database.incrementSyncAttempt();
    
    console.log('[SyncManager] Batched sync completed successfully');
    return {
      success: true,
      recordsProcessed: records.length,
      activeRecords: activeRecords.length,
      deletedRecords: deletedRecords.length
    };
  }

  async performFullSync(): Promise<SyncResult> {
    try {
      console.log('[SyncManager] Starting full sync...');
      
      // Get all records from Firebase
      const query = this.firestore
        .collection('kalaam')
        .where('deleted', '==', false)
        .orderBy('last_modified');

      const snapshot = await query.get();
      const records = snapshot.docs.map(doc => ({
        id: parseInt(doc.id),
        ...doc.data()
      })) as Kalaam[];

      console.log(`[SyncManager] Found ${records.length} records for full sync`);

      // Update local database
      await this.updateLocalDatabase(records, []);

      // Update sync timestamp
      await database.updateSyncTimestamp();

      const result: SyncResult = {
        success: true,
        recordsProcessed: records.length,
        activeRecords: records.length,
        deletedRecords: 0
      };

      console.log('[SyncManager] Full sync completed successfully:', result);
      return result;

    } catch (error) {
      console.error('[SyncManager] Full sync failed:', error);
      return {
        success: false,
        recordsProcessed: 0,
        activeRecords: 0,
        deletedRecords: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getSyncStatus(): Promise<{
    lastSync: number;
    recordCount: number;
    isOnline: boolean;
    dailyAttempts: number;
  }> {
    const lastSync = await database.getLastSyncTimestamp();
    const recordCount = await database.getKalaamCount();
    const { attempts } = await database.getDailySyncAttempts();
    
    return {
      lastSync,
      recordCount,
      isOnline: true, // TODO: Implement proper network check
      dailyAttempts: attempts
    };
  }

  setSyncConfig(config: Partial<SyncConfig>): void {
    this.syncConfig = { ...this.syncConfig, ...config };
  }

  getSyncConfig(): SyncConfig {
    return this.syncConfig;
  }
}

// Export singleton instance
export const syncManager = new SyncManager();
export default syncManager;

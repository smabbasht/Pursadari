import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncManager } from './SyncManager';
import { notificationService } from './NotificationService';

export class BackgroundSyncManager {
  private isConfigured: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private lastSyncTime: number = 0;
  private readonly SYNC_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  private readonly STORAGE_KEY = 'last_background_sync';

  constructor() {
    // Disabled auto-sync for first release
    // this.initializeBackgroundSync();
  }

  private async initializeBackgroundSync(): Promise<void> {
    if (this.isConfigured) {
      return;
    }

    try {
      // Load last sync time
      const lastSync = await AsyncStorage.getItem(this.STORAGE_KEY);
      this.lastSyncTime = lastSync ? parseInt(lastSync) : 0;

      // Set up app state listener for background sync
      AppState.addEventListener('change', this.handleAppStateChange.bind(this));

      this.isConfigured = true;
      console.log('[BackgroundSync] Background sync initialized');
    } catch (error) {
      console.error('[BackgroundSync] Failed to initialize:', error);
    }
  }

  private handleAppStateChange(nextAppState: AppStateStatus): void {
    if (nextAppState === 'background') {
      this.startPeriodicSync();
    } else if (nextAppState === 'active') {
      this.stopPeriodicSync();
    }
  }

  private startPeriodicSync(): void {
    if (this.syncInterval) {
      return;
    }

    console.log('[BackgroundSync] Starting periodic sync...');
    this.syncInterval = setInterval(async () => {
      await this.performBackgroundSync();
    }, this.SYNC_INTERVAL);
  }

  private stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('[BackgroundSync] Periodic sync stopped');
    }
  }

  async startBackgroundSync(): Promise<void> {
    try {
      console.log('[BackgroundSync] Background sync started');
      await this.performBackgroundSync();
    } catch (error) {
      console.error('[BackgroundSync] Failed to start background sync:', error);
    }
  }

  async stopBackgroundSync(): Promise<void> {
    try {
      this.stopPeriodicSync();
      console.log('[BackgroundSync] Background sync stopped');
    } catch (error) {
      console.error('[BackgroundSync] Failed to stop background sync:', error);
    }
  }

  async performBackgroundSync(): Promise<void> {
    try {
      const now = Date.now();
      
      // Check if enough time has passed since last sync
      if (now - this.lastSyncTime < this.SYNC_INTERVAL) {
        console.log('[BackgroundSync] Sync skipped - too soon since last sync (24 hours minimum)');
        return;
      }

      console.log('[BackgroundSync] Performing background sync...');
      const result = await syncManager.syncKalaamData();
      console.log('[BackgroundSync] Background sync completed:', result);
      
      // Update last sync time
      this.lastSyncTime = now;
      await AsyncStorage.setItem(this.STORAGE_KEY, now.toString());
      
      // Disable background sync notifications to prevent spam
      // Only foreground sync should show notifications
      // if (result.success && result.recordsProcessed > 0 && (result.activeRecords > 0 || result.deletedRecords > 0)) {
      //   notificationService.showSyncNotification(result);
      // }
    } catch (error) {
      console.error('[BackgroundSync] Background sync failed:', error);
    }
  }
}

// Export singleton instance (lazy-loaded to prevent auto-sync)
let _backgroundSyncManager: BackgroundSyncManager | null = null;

export const backgroundSyncManager = (): BackgroundSyncManager => {
  if (!_backgroundSyncManager) {
    _backgroundSyncManager = new BackgroundSyncManager();
  }
  return _backgroundSyncManager;
};

export default backgroundSyncManager;

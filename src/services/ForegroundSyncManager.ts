import { AppState, AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { syncManager } from './SyncManager';
import { notificationService } from './NotificationService';
import { SyncResult } from '../types';

export class ForegroundSyncManager {
  private isOnline: boolean = false;
  private isInitialized: boolean = false;

  constructor() {
    // Disabled auto-sync for first release
    // this.setupNetworkListener();
    // this.setupAppStateListener();
    this.initializeNotificationService();
  }

  private setupNetworkListener(): void {
    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected ?? false;
      
      console.log('[ForegroundSync] Network status changed:', this.isOnline);
      
      // If we just came online and weren't online before, perform sync
      if (this.isOnline && !wasOnline) {
        console.log('[ForegroundSync] Network became available, performing sync...');
        notificationService.showNetworkNotification(true);
        this.performSync();
      }
    });
  }

  private setupAppStateListener(): void {
    AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      console.log('[ForegroundSync] App state changed to:', nextAppState);
      
      if (nextAppState === 'active' && this.isOnline) {
        console.log('[ForegroundSync] App became active and online, performing sync...');
        this.performSync();
      }
    });
  }

  async performSync(): Promise<SyncResult> {
    try {
      console.log('[ForegroundSync] Starting foreground sync...');
      const result = await syncManager.syncKalaamData();
      
      if (result.success) {
        console.log(`[ForegroundSync] Sync completed: ${result.recordsProcessed} records processed`);
        
        // Only show notification if there are significant changes
        if (result.recordsProcessed > 0 && (result.activeRecords > 0 || result.deletedRecords > 0)) {
          notificationService.showSyncNotification(result);
        }
      } else {
        console.error('[ForegroundSync] Sync failed:', result.error);
        // Only show error notification for actual failures, not for "already synced today"
        if (result.error && !result.error.includes('already synced')) {
          notificationService.showSyncNotification(result);
        }
      }
      
      return result;
    } catch (error) {
      console.error('[ForegroundSync] Foreground sync failed:', error);
      return {
        success: false,
        recordsProcessed: 0,
        activeRecords: 0,
        deletedRecords: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async performManualSync(): Promise<SyncResult> {
    console.log('[ForegroundSync] Manual sync requested');
    return await this.performSync();
  }

  private async initializeNotificationService(): Promise<void> {
    try {
      await notificationService.initialize();
      console.log('[ForegroundSync] Notification service initialized');
    } catch (error) {
      console.error('[ForegroundSync] Failed to initialize notification service:', error);
    }
  }

  getNetworkStatus(): boolean {
    return this.isOnline;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      const netInfo = await NetInfo.fetch();
      this.isOnline = netInfo.isConnected ?? false;
      this.isInitialized = true;
      console.log('[ForegroundSync] Initialized with network status:', this.isOnline);
    } catch (error) {
      console.error('[ForegroundSync] Failed to initialize:', error);
    }
  }
}

// Export singleton instance (lazy-loaded to prevent auto-sync)
let _foregroundSyncManager: ForegroundSyncManager | null = null;

export const foregroundSyncManager = (): ForegroundSyncManager => {
  if (!_foregroundSyncManager) {
    _foregroundSyncManager = new ForegroundSyncManager();
  }
  return _foregroundSyncManager;
};

export default foregroundSyncManager;

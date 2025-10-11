# Client-Side Sync Implementation Guide

## Overview

This document provides detailed implementation guidance for the client-side sync functionality in the Pursadari mobile app. The sync system handles data synchronization between Firebase Firestore and local SQLite database, supporting both background and foreground sync operations.

## Architecture

### Data Flow
```
Firebase Firestore → Client App → Local SQLite
     ↑                    ↓
   Server-side         Background/Foreground
   PostgreSQL          Sync Operations
```

### Key Components
- **Firebase Firestore**: Source of truth for kalaam data
- **Local SQLite**: Client-side database for offline access
- **Sync Manager**: Handles synchronization logic
- **Background Tasks**: Periodic sync when app is backgrounded
- **Foreground Sync**: Immediate sync when app is opened

## Database Schema

### Local SQLite Tables

#### 1. Kalaam Table (Synced from Firebase)
```sql
CREATE TABLE kalaam (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    lyrics_urdu TEXT,
    lyrics_eng TEXT,
    poet TEXT,
    reciter TEXT,
    masaib TEXT,
    yt_link TEXT,
    last_modified TIMESTAMP,
    deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_kalaam_deleted ON kalaam(deleted);
CREATE INDEX idx_kalaam_last_modified ON kalaam(last_modified);
```

#### 2. Settings Table (Local Only)
```sql
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME
);
```

#### 3. Favourites Table (Local Only)
```sql
CREATE TABLE favourites (
    kalaam_id INTEGER PRIMARY KEY,
    created_at DATETIME
);
```

### Firebase Collections

#### 1. Kalaam Collection
- **Document ID**: PostgreSQL ID (string)
- **Fields**: Same as SQLite kalaam table
- **Soft Delete**: Records with `deleted: true` should be filtered out

#### 2. Kalaam Source Collection
- **Document ID**: PostgreSQL kalaam_id (string)
- **Fields**: `kalaam_id`, `source`, `id_at_source`, `migrated_at`

#### 3. Scraping Metadata Collection
- **Document ID**: Source name (string)
- **Fields**: `source`, `last_run`, `migrated_at`

## Sync Implementation

### 1. Sync Manager Class

```typescript
class SyncManager {
  private firestore: FirebaseFirestore;
  private sqlite: SQLiteDatabase;
  private lastSyncTimestamp: number;
  
  constructor() {
    this.firestore = firebase.firestore();
    this.sqlite = new SQLiteDatabase();
    this.lastSyncTimestamp = this.getLastSyncTimestamp();
  }
  
  async syncKalaamData(): Promise<SyncResult> {
    try {
      // Get records modified since last sync
      const query = this.firestore
        .collection('kalaam')
        .where('last_modified', '>', new Date(this.lastSyncTimestamp))
        .orderBy('last_modified');
      
      const snapshot = await query.get();
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter out deleted records
      const activeRecords = records.filter(record => !record.deleted);
      
      // Update local SQLite
      await this.updateLocalDatabase(activeRecords);
      
      // Update sync timestamp
      await this.updateSyncTimestamp();
      
      return {
        success: true,
        recordsProcessed: records.length,
        activeRecords: activeRecords.length,
        deletedRecords: records.length - activeRecords.length
      };
      
    } catch (error) {
      console.error('Sync failed:', error);
      return { success: false, error: error.message };
    }
  }
  
  private async updateLocalDatabase(records: KalaamRecord[]): Promise<void> {
    const transaction = this.sqlite.beginTransaction();
    
    try {
      for (const record of records) {
        if (record.deleted) {
          // Remove from local database
          await this.sqlite.execute(
            'DELETE FROM kalaam WHERE id = ?',
            [record.id]
          );
        } else {
          // Upsert record
          await this.sqlite.execute(`
            INSERT OR REPLACE INTO kalaam 
            (id, title, lyrics_urdu, lyrics_eng, poet, reciter, masaib, yt_link, last_modified, deleted)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            record.id,
            record.title,
            record.lyrics_urdu,
            record.lyrics_eng,
            record.poet,
            record.reciter,
            record.masaib,
            record.yt_link,
            record.last_modified,
            record.deleted || false
          ]);
        }
      }
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
  
  private getLastSyncTimestamp(): number {
    const timestamp = this.sqlite.query(
      'SELECT value FROM settings WHERE key = ?',
      ['last_source_sync_timestamp']
    );
    return timestamp ? parseInt(timestamp) : 0;
  }
  
  private async updateSyncTimestamp(): Promise<void> {
    const now = Date.now();
    await this.sqlite.execute(`
      INSERT OR REPLACE INTO settings (key, value, updated_at)
      VALUES (?, ?, ?)
    `, ['last_source_sync_timestamp', now.toString(), new Date().toISOString()]);
    
    this.lastSyncTimestamp = now;
  }
}
```

### 2. Background Sync Implementation

#### React Native Background Fetch

```typescript
import BackgroundFetch from 'react-native-background-fetch';

class BackgroundSyncManager {
  private syncManager: SyncManager;
  
  constructor() {
    this.syncManager = new SyncManager();
    this.configureBackgroundFetch();
  }
  
  private configureBackgroundFetch(): void {
    BackgroundFetch.configure({
      minimumFetchInterval: 30, // 30 minutes
      stopOnTerminate: false,
      startOnBoot: true,
      enableHeadless: true,
      requiredNetworkType: BackgroundFetch.NETWORK_TYPE_ANY
    }, async (taskId) => {
      console.log('[BackgroundFetch] taskId:', taskId);
      
      try {
        const result = await this.syncManager.syncKalaamData();
        console.log('Background sync result:', result);
        
        BackgroundFetch.finish(taskId);
      } catch (error) {
        console.error('Background sync failed:', error);
        BackgroundFetch.finish(taskId);
      }
    }, (error) => {
      console.error('[BackgroundFetch] failed to start:', error);
    });
  }
  
  async startBackgroundSync(): Promise<void> {
    const status = await BackgroundFetch.status();
    
    if (status === BackgroundFetch.STATUS_RESTRICTED) {
      console.log('Background fetch is restricted');
    } else if (status === BackgroundFetch.STATUS_DENIED) {
      console.log('Background fetch is denied');
    } else {
      console.log('Background fetch is enabled');
    }
  }
}
```

### 3. Foreground Sync Implementation

```typescript
class ForegroundSyncManager {
  private syncManager: SyncManager;
  private isOnline: boolean = false;
  
  constructor() {
    this.syncManager = new SyncManager();
    this.setupNetworkListener();
    this.setupAppStateListener();
  }
  
  private setupNetworkListener(): void {
    NetInfo.addEventListener(state => {
      this.isOnline = state.isConnected;
      
      if (this.isOnline) {
        this.performSync();
      }
    });
  }
  
  private setupAppStateListener(): void {
    AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && this.isOnline) {
        this.performSync();
      }
    });
  }
  
  async performSync(): Promise<void> {
    try {
      const result = await this.syncManager.syncKalaamData();
      
      if (result.success) {
        console.log(`Sync completed: ${result.recordsProcessed} records processed`);
        
        // Show user notification if significant changes
        if (result.recordsProcessed > 0) {
          this.showSyncNotification(result);
        }
      }
    } catch (error) {
      console.error('Foreground sync failed:', error);
    }
  }
  
  private showSyncNotification(result: SyncResult): void {
    // Implementation depends on notification library
    // Example with react-native-push-notification
    PushNotification.localNotification({
      title: 'Data Updated',
      message: `${result.activeRecords} new items available`,
      playSound: false
    });
  }
}
```

### 4. Initial App Setup

```typescript
class AppInitializer {
  private syncManager: SyncManager;
  private backgroundSync: BackgroundSyncManager;
  private foregroundSync: ForegroundSyncManager;
  
  async initializeApp(): Promise<void> {
    try {
      // Initialize Firebase
      await this.initializeFirebase();
      
      // Initialize local database
      await this.initializeLocalDatabase();
      
      // Check if first launch
      const isFirstLaunch = await this.isFirstLaunch();
      
      if (isFirstLaunch) {
        // Perform initial full sync
        await this.performInitialSync();
        await this.markAsLaunched();
      } else {
        // Perform incremental sync
        await this.performIncrementalSync();
      }
      
      // Start background sync
      this.backgroundSync = new BackgroundSyncManager();
      await this.backgroundSync.startBackgroundSync();
      
      // Start foreground sync
      this.foregroundSync = new ForegroundSyncManager();
      
    } catch (error) {
      console.error('App initialization failed:', error);
      // Handle initialization failure
    }
  }
  
  private async performInitialSync(): Promise<void> {
    // For first launch, sync all records
    const query = this.firestore.collection('kalaam')
      .where('deleted', '==', false)
      .orderBy('last_modified');
    
    const snapshot = await query.get();
    const records = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    await this.syncManager.updateLocalDatabase(records);
    await this.syncManager.updateSyncTimestamp();
  }
  
  private async performIncrementalSync(): Promise<void> {
    await this.syncManager.syncKalaamData();
  }
}
```

## Error Handling

### 1. Network Errors
```typescript
class NetworkErrorHandler {
  static async handleNetworkError(error: Error): Promise<void> {
    if (error.code === 'unavailable') {
      // Firebase is unavailable, retry later
      await this.scheduleRetry();
    } else if (error.code === 'permission-denied') {
      // Handle permission issues
      console.error('Firebase permission denied');
    } else {
      // Generic network error
      console.error('Network error:', error);
    }
  }
  
  private static async scheduleRetry(): Promise<void> {
    // Implement exponential backoff
    const retryDelay = Math.min(1000 * Math.pow(2, this.retryCount), 30000);
    setTimeout(() => {
      this.performSync();
    }, retryDelay);
  }
}
```

### 2. Data Consistency
```typescript
class DataConsistencyManager {
  static async validateSyncResult(result: SyncResult): Promise<boolean> {
    // Verify record counts
    const localCount = await this.getLocalRecordCount();
    const expectedCount = this.lastKnownCount + result.activeRecords - result.deletedRecords;
    
    if (localCount !== expectedCount) {
      console.warn('Data consistency issue detected');
      return false;
    }
    
    return true;
  }
  
  static async repairInconsistency(): Promise<void> {
    // Perform full re-sync if inconsistency detected
    await this.performFullSync();
  }
}
```

## Performance Optimization

### 1. Batch Processing
```typescript
class BatchProcessor {
  private static readonly BATCH_SIZE = 100;
  
  static async processRecordsInBatches(records: KalaamRecord[]): Promise<void> {
    for (let i = 0; i < records.length; i += this.BATCH_SIZE) {
      const batch = records.slice(i, i + this.BATCH_SIZE);
      await this.processBatch(batch);
      
      // Small delay to prevent blocking
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }
}
```

### 2. Memory Management
```typescript
class MemoryManager {
  static optimizeSyncMemory(): void {
    // Clear unused references
    if (global.gc) {
      global.gc();
    }
    
    // Limit batch sizes for large datasets
    const availableMemory = this.getAvailableMemory();
    if (availableMemory < 100 * 1024 * 1024) { // 100MB
      BatchProcessor.BATCH_SIZE = 50;
    }
  }
}
```

## Testing

### 1. Unit Tests
```typescript
describe('SyncManager', () => {
  it('should sync new records correctly', async () => {
    const mockRecords = [/* test data */];
    const result = await syncManager.syncKalaamData();
    
    expect(result.success).toBe(true);
    expect(result.recordsProcessed).toBe(mockRecords.length);
  });
  
  it('should handle soft deletes correctly', async () => {
    const mockRecords = [
      { id: '1', deleted: false },
      { id: '2', deleted: true }
    ];
    
    const result = await syncManager.syncKalaamData();
    
    expect(result.activeRecords).toBe(1);
    expect(result.deletedRecords).toBe(1);
  });
});
```

### 2. Integration Tests
```typescript
describe('Background Sync Integration', () => {
  it('should sync in background without app focus', async () => {
    // Simulate background state
    AppState.currentState = 'background';
    
    // Trigger background sync
    await backgroundSyncManager.performBackgroundSync();
    
    // Verify data was synced
    const localCount = await getLocalRecordCount();
    expect(localCount).toBeGreaterThan(0);
  });
});
```

## Configuration

### 1. Sync Settings
```typescript
interface SyncConfig {
  backgroundSyncInterval: number; // minutes
  foregroundSyncOnAppOpen: boolean;
  wifiOnlySync: boolean;
  maxRetryAttempts: number;
  batchSize: number;
}

const defaultConfig: SyncConfig = {
  backgroundSyncInterval: 30,
  foregroundSyncOnAppOpen: true,
  wifiOnlySync: false,
  maxRetryAttempts: 3,
  batchSize: 100
};
```

### 2. User Preferences
```typescript
class SyncPreferences {
  static async updateSyncSettings(settings: Partial<SyncConfig>): Promise<void> {
    await sqlite.execute(`
      INSERT OR REPLACE INTO settings (key, value, updated_at)
      VALUES (?, ?, ?)
    `, ['sync_config', JSON.stringify(settings), new Date().toISOString()]);
  }
  
  static async getSyncSettings(): Promise<SyncConfig> {
    const result = await sqlite.query(
      'SELECT value FROM settings WHERE key = ?',
      ['sync_config']
    );
    
    return result ? JSON.parse(result) : defaultConfig;
  }
}
```

## Monitoring and Analytics

### 1. Sync Metrics
```typescript
class SyncAnalytics {
  static trackSyncEvent(event: SyncEvent): void {
    // Track sync performance
    analytics.track('sync_event', {
      event_type: event.type,
      records_processed: event.recordsProcessed,
      duration: event.duration,
      success: event.success,
      error: event.error
    });
  }
  
  static trackSyncError(error: Error): void {
    analytics.track('sync_error', {
      error_message: error.message,
      error_stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
}
```

### 2. Performance Monitoring
```typescript
class PerformanceMonitor {
  static measureSyncPerformance<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    const startTime = Date.now();
    
    return operation().then(result => {
      const duration = Date.now() - startTime;
      
      analytics.track('sync_performance', {
        operation: operationName,
        duration: duration,
        timestamp: new Date().toISOString()
      });
      
      return result;
    });
  }
}
```

## Conclusion

This implementation provides a robust, efficient sync system that handles both background and foreground synchronization while maintaining data consistency and optimal performance. The modular design allows for easy testing and maintenance, while the comprehensive error handling ensures reliable operation across various network conditions and device states.

# Firebase to SQLite Sync Strategy

## Overview

Pursadari implements a hybrid sync approach combining background tasks with foreground sync triggers for Android devices. This ensures reliable data synchronization while maintaining battery efficiency and user experience.

## Sync Options Considered

### 1. Firebase Realtime Database Listener

- **Pros**: Real-time updates
- **Cons**:
  - Battery intensive
  - Constant connection required
  - Higher data usage
  - Expensive in terms of Firebase quota
- **Decision**: Rejected due to resource constraints

### 2. Periodic REST API Calls

- **Pros**: Simple implementation
- **Cons**:
  - May miss updates between intervals
  - No guarantee of data consistency
- **Decision**: Rejected due to reliability concerns

### 3. Hybrid Background + Foreground Sync (Selected)

- **Pros**:
  - Battery efficient
  - Reliable data delivery
  - Works when app is backgrounded
  - Guarantees sync on app open
- **Cons**:
  - More complex implementation
  - Requires Android-specific configuration
- **Decision**: Selected as optimal solution

## Implementation Details

### Background Sync Configuration

```typescript
minimumFetchInterval: 30, // 30 minutes
stopOnTerminate: false,   // Continue after app close
startOnBoot: true,       // Start after device reboot
enableHeadless: true     // Run without UI
```

### Sync Logic

1. **Trigger Points**:

   - App launch
   - Every 30 minutes in background
   - Device reboot

2. **Sync Process**:

   ```typescript
   - Get last_source_sync_timestamp from SQLite
   - Query Firebase for records newer than timestamp
   - Batch process new records into SQLite
   - Update sync timestamp
   ```

3. **Error Handling**:
   - Network failures: Silent retry on next sync
   - Partial sync: Transaction-based updates
   - Data conflicts: Firebase data is source of truth

## Android-Specific Considerations

1. **Background Processing**

   - Uses `react-native-background-fetch`
   - Survives app termination
   - Respects Android Doze mode
   - Auto-starts on device boot

2. **Battery Optimization**

   - 30-minute minimum interval
   - Network-aware sync attempts
   - Batch processing to reduce wake cycles

3. **Data Usage**
   - Only fetches delta changes
   - No continuous connection
   - Efficient query structure

## Code Structure

```typescript
class SyncManager {
    - AppState listener for foreground sync
    - Background fetch configuration
    - Sync logic implementation
    - Error handling
    - Transaction management
}
```

## Future Improvements

1. **Sync Optimization**

   - Adaptive sync intervals based on update frequency
   - Wi-Fi only sync option
   - Conflict resolution for edge cases

2. **Monitoring**

   - Sync success/failure tracking
   - Performance metrics
   - Battery impact analysis

3. **User Control**
   - Manual sync trigger
   - Sync settings configuration
   - Background sync toggle

## Conclusion

The hybrid sync approach provides reliable data delivery while maintaining battery efficiency. Android-specific optimizations ensure consistent operation across different device states and conditions.


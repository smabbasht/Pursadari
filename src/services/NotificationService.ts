import PushNotification from 'react-native-push-notification';
import { Platform, PermissionsAndroid } from 'react-native';
import { SyncResult } from '../types';

export class NotificationService {
  private static instance: NotificationService | null = null;
  private isInitialized: boolean = false;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Request notification permissions
      await this.requestPermissions();

      // Create notification channel for Android
      if (Platform.OS === 'android') {
        PushNotification.createChannel(
          {
            channelId: 'sync-notifications',
            channelName: 'Sync Notifications',
            channelDescription: 'Notifications for data synchronization',
            playSound: false,
            soundName: 'default',
            importance: 4,
            vibrate: false,
          },
          (created) => console.log('[NotificationService] Channel created:', created)
        );
      }

      // Configure push notification
      PushNotification.configure({
        onRegister: function (token) {
          console.log('[NotificationService] Token:', token);
        },
        onNotification: function (notification) {
          console.log('[NotificationService] Notification received:', notification);
        },
        onAction: function (notification) {
          console.log('[NotificationService] Action:', notification);
        },
        onRegistrationError: function(err) {
          console.error('[NotificationService] Registration error:', err);
        },
        permissions: {
          alert: true,
          badge: true,
          sound: true,
        },
        popInitialNotification: true,
        requestPermissions: Platform.OS === 'ios',
      });

      this.isInitialized = true;
      console.log('[NotificationService] Initialized successfully');
    } catch (error) {
      console.error('[NotificationService] Initialization failed:', error);
    }
  }

  private async requestPermissions(): Promise<void> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: 'Notification Permission',
            message: 'Pursadari needs notification permission to show sync status updates.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('[NotificationService] Notification permission granted');
        } else {
          console.log('[NotificationService] Notification permission denied');
        }
      } catch (error) {
        console.error('[NotificationService] Permission request failed:', error);
      }
    }
  }

  showSyncNotification(result: SyncResult): void {
    if (!this.isInitialized) {
      console.warn('[NotificationService] Service not initialized');
      return;
    }

    try {
      // Only show notification if there are significant changes
      if (result.success && result.recordsProcessed === 0) {
        console.log('[NotificationService] No changes to sync, skipping notification');
        return;
      }

      let title = 'Data Updated';
      let message = '';

      if (result.success) {
        if (result.activeRecords > 0) {
          title = 'New Content Available';
          message = `${result.activeRecords} new kalaam${result.activeRecords > 1 ? 's' : ''} added`;
        } else if (result.deletedRecords > 0) {
          title = 'Content Updated';
          message = `${result.deletedRecords} item${result.deletedRecords > 1 ? 's' : ''} removed`;
        } else {
          title = 'Sync Complete';
          message = `${result.recordsProcessed} record${result.recordsProcessed > 1 ? 's' : ''} processed`;
        }
      } else {
        title = 'Sync Failed';
        message = result.error || 'Unable to sync data';
      }

      // Check if PushNotification.localNotification is a function
      if (typeof PushNotification.localNotification === 'function') {
        PushNotification.localNotification({
          title,
          message,
          playSound: false,
          vibrate: false,
          priority: 'low',
          importance: 'low',
          channelId: 'sync-notifications',
          smallIcon: 'ic_notification',
          largeIcon: 'ic_launcher',
        });
        console.log('[NotificationService] Sync notification shown:', { title, message });
      } else {
        console.error('[NotificationService] PushNotification.localNotification is not a function');
      }
    } catch (error) {
      console.error('[NotificationService] Failed to show notification:', error);
    }
  }

  showSyncStartNotification(totalRecords?: number): void {
    if (!this.isInitialized) {
      return;
    }

    try {
      let message = 'Checking for new content...';
      if (totalRecords && totalRecords > 0) {
        message = `Syncing ${totalRecords} records...`;
      }

      // Check if PushNotification.localNotification is a function
      if (typeof PushNotification.localNotification === 'function') {
        PushNotification.localNotification({
          title: 'Syncing Data',
          message,
          playSound: false,
          vibrate: false,
          priority: 'low',
          importance: 'low',
          channelId: 'sync-notifications',
          smallIcon: 'ic_notification',
          largeIcon: 'ic_launcher',
        });
        console.log('[NotificationService] Sync start notification shown');
      } else {
        console.error('[NotificationService] PushNotification.localNotification is not a function');
      }
    } catch (error) {
      console.error('[NotificationService] Failed to show start notification:', error);
    }
  }

  showSyncProgressNotification(current: number, total: number): void {
    if (!this.isInitialized) {
      return;
    }

    try {
      const percentage = Math.round((current / total) * 100);
      const message = `Syncing ${current}/${total} records (${percentage}%)`;

      // Check if PushNotification.localNotification is a function
      if (typeof PushNotification.localNotification === 'function') {
        PushNotification.localNotification({
          title: 'Syncing Data',
          message,
          playSound: false,
          vibrate: false,
          priority: 'low',
          importance: 'low',
          channelId: 'sync-notifications',
          smallIcon: 'ic_notification',
          largeIcon: 'ic_launcher',
        });
      } else {
        console.error('[NotificationService] PushNotification.localNotification is not a function');
      }

      console.log('[NotificationService] Sync progress notification shown:', { current, total, percentage });
    } catch (error) {
      console.error('[NotificationService] Failed to show progress notification:', error);
    }
  }

  showNetworkNotification(isOnline: boolean): void {
    if (!this.isInitialized) {
      return;
    }

    try {
      if (isOnline) {
        PushNotification.localNotification({
          title: 'Connection Restored',
          message: 'Syncing data...',
          playSound: false,
          vibrate: false,
          priority: 'low',
          importance: 'low',
          channelId: 'sync-notifications',
          smallIcon: 'ic_notification',
          largeIcon: 'ic_launcher',
        });
      }

      console.log('[NotificationService] Network notification shown:', isOnline);
    } catch (error) {
      console.error('[NotificationService] Failed to show network notification:', error);
    }
  }

  showAlreadySyncedTodayNotification(): void {
    if (!this.isInitialized) {
      return;
    }

    try {
      // Check if PushNotification.localNotification is a function
      if (typeof PushNotification.localNotification === 'function') {
        PushNotification.localNotification({
          title: 'Already Synced Today',
          message: 'We have already synced today. Check back tomorrow for new content.',
          playSound: false,
          vibrate: false,
          priority: 'low',
          importance: 'low',
          channelId: 'sync-notifications',
          smallIcon: 'ic_notification',
          largeIcon: 'ic_launcher',
        });
        console.log('[NotificationService] Already synced today notification shown');
      } else {
        console.error('[NotificationService] PushNotification.localNotification is not a function');
      }
    } catch (error) {
      console.error('[NotificationService] Failed to show already synced notification:', error);
    }
  }

  clearAllNotifications(): void {
    try {
      if (typeof PushNotification.cancelAllLocalNotifications === 'function') {
        PushNotification.cancelAllLocalNotifications();
        console.log('[NotificationService] All notifications cleared');
      } else {
        console.error('[NotificationService] PushNotification.cancelAllLocalNotifications is not a function');
      }
    } catch (error) {
      console.error('[NotificationService] Failed to clear notifications:', error);
    }
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();
export default notificationService;

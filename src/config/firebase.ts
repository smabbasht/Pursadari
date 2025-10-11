// Firebase configuration
// This file should be configured with your Firebase project settings

import firestore from '@react-native-firebase/firestore';

// Initialize Firebase (this should be done in your app's entry point)
// Make sure to call this before using any Firebase services

export const initializeFirebase = async () => {
  try {
    // Firebase is automatically initialized when the app starts
    // if you have the google-services.json (Android) and GoogleService-Info.plist (iOS) files
    // in the correct locations
    
    console.log('[Firebase] Initialized successfully');
    return true;
  } catch (error) {
    console.error('[Firebase] Initialization failed:', error);
    return false;
  }
};

// Export Firestore instance for use in sync managers
export { firestore };
export default firestore;

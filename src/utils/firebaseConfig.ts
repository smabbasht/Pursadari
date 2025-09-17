import firebase from '@react-native-firebase/app';
import firestore from '@react-native-firebase/firestore';

/**
 * Firebase Configuration Utility
 * 
 * This utility ensures Firebase is properly initialized before use.
 * It handles the case where Firebase might not be auto-initialized.
 */

export function initializeFirebase(): { firestoreDb: any; kalaamCollection: any } {
  try {
    // Check if Firebase is already initialized
    if (!firebase.apps.length) {
      console.warn('FirebaseConfig: Firebase not initialized, this might cause issues');
      console.warn('FirebaseConfig: Make sure you have proper Firebase configuration files:');
      console.warn('FirebaseConfig: - android/app/google-services.json');
      console.warn('FirebaseConfig: - ios/GoogleService-Info.plist');
      console.warn('FirebaseConfig: The app will continue but may not work properly without Firebase configuration.');
    }

    // Initialize Firestore
    const firestoreDb = firestore();
    if (!firestoreDb) {
      throw new Error('Failed to initialize Firestore - check your Firebase configuration');
    }

    // Get the kalaam collection
    const kalaamCollection = firestoreDb.collection('kalaam');
    if (!kalaamCollection) {
      throw new Error('Failed to get kalaam collection');
    }

    console.log('FirebaseConfig: Firebase initialized successfully');
    return { firestoreDb, kalaamCollection };
  } catch (error) {
    console.error('FirebaseConfig: Error initializing Firebase:', error);
    console.error('FirebaseConfig: This is likely due to missing Firebase configuration files.');
    console.error('FirebaseConfig: Please ensure you have:');
    console.error('FirebaseConfig: 1. Created a Firebase project');
    console.error('FirebaseConfig: 2. Added google-services.json to android/app/');
    console.error('FirebaseConfig: 3. Added GoogleService-Info.plist to ios/');
    console.error('FirebaseConfig: 4. Followed the React Native Firebase setup guide');
    throw error;
  }
}

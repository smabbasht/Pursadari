import {
  Kalaam,
  MasaibGroup,
  PoetGroup,
  ReciterGroup,
  KalaamListResponse,
} from '../../types';
import { IDatabaseService } from '../interfaces/IDatabaseService';
import firestore from '@react-native-firebase/firestore';
// import firebase from '@react-native-firebase/app'; // Not used directly anymore
import { initializeFirebase } from '../../utils/firebaseConfig';

/**
 * Firebase Repository Implementation with Offline First Support (Firestore Persistence)
 *
 * This implementation leverages Firebase Firestore's built-in offline persistence
 * to provide "offline forever" access to all data.
 *
 * - On initialization, it enables Firestore persistence and performs an initial
 *   full download of all 'kalaam' and 'favourites' data. This ensures all data
 *   is cached locally for offline access.
 * - All data retrieval methods will automatically benefit from Firestore's
 *   persistence, serving data from the local cache when offline, or synchronizing
 *   with the server when online.
 * - Favourites are managed directly in the Firebase 'favourites' collection,
 *   which also benefits from offline persistence.
 *
 * Before using, ensure you have:
 * 1. Installed Firebase packages:
 *    npm install @react-native-firebase/app @react-native-firebase/firestore
 * 2. Configured Firebase in your project (e.g., `google-services.json` for Android, `GoogleService-Info.plist` for iOS)
 * 3. Enabled Firestore persistence (handled in the `init` method of this class).
 *
 * IMPORTANT Firestore Considerations:
 * - Full-text search across multiple fields (like `title`, `lyrics_eng`, `lyrics_urdu`) is not natively supported with a single query.
 *   For robust full-text search, consider integrating with a dedicated search service (e.g., Algolia) or using Firebase Extensions for text search.
 *   The current `searchKalaams` implementation provides a basic prefix search on `title` only.
 * - Aggregation (e.g., `GROUP BY` and `COUNT`) is not directly available in Firestore queries.
 *   The current `getMasaibGroups`, `getPoetGroups`, `getReciterGroups`, and `getMasaibByReciter` methods
 *   perform client-side aggregation on locally available (cached) data, which is efficient after the initial sync.
 */
export class FirebaseRepository implements IDatabaseService {
  private firestoreDb: firestore.FirebaseFirestore;
  private kalaamCollection: firestore.CollectionReference<firestore.DocumentData>;
  // Note: Favorites are now handled by FavoritesService using AsyncStorage
  private isInitialSyncComplete: boolean = false;

  constructor() {
    try {
      const { firestoreDb, kalaamCollection } = initializeFirebase();
      this.firestoreDb = firestoreDb;
      this.kalaamCollection = kalaamCollection;
      // Note: Favorites collection removed - now handled by FavoritesService using AsyncStorage
    } catch (error: any) {
      console.error('FirebaseRepo: Error in constructor:', error);
      console.error('FirebaseRepo: This is likely due to missing Firebase configuration.');
      console.error('FirebaseRepo: The app will not work properly without proper Firebase setup.');
      // Don't throw here - let the app continue but log the error
      // The init() method will handle the actual error
    }
  }

  async init(): Promise<void> {
    console.log('FirebaseRepo: Initializing Firebase Database. Enabling persistence...');
    try {
      // Check if Firestore is properly initialized
      if (!this.firestoreDb) {
        throw new Error('Firestore database not initialized - check Firebase configuration');
      }

      // Enable Firestore offline persistence
      await this.firestoreDb.settings({ persistence: true });
      console.log('FirebaseRepo: Firestore persistence enabled.');

      // Perform initial full download of all data to ensure it's in the cache
      console.log('FirebaseRepo: Performing initial full data download from Firebase...');
      await this.performFullDataDownload();
      this.isInitialSyncComplete = true;
      console.log('FirebaseRepo: Initial full data download complete. Data is now available offline.');
    } catch (error: any) {
      console.error('FirebaseRepo: Error during Firebase initialization or persistence setup:', error);
      console.error('FirebaseRepo: Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      console.error('FirebaseRepo: This error is likely due to missing Firebase configuration files.');
      console.error('FirebaseRepo: Please ensure you have properly configured Firebase for your project.');
      // Don't throw here - let the app continue but with limited functionality
      // The app can still work with AsyncStorage for settings and favorites
    }
  }

  async close(): Promise<void> {
    console.log('FirebaseRepo: Close operation (no-op for Firestore).');
    // Firestore handles its own connection management with persistence enabled.
  }

  private async performFullDataDownload(): Promise<void> {
    // Fetch all Kalaam documents. This will cache them locally.
    console.log('FirebaseRepo: Fetching all Kalaams for initial cache...');
    await this.kalaamCollection.get();

    // Note: Favorites are now handled by FavoritesService using AsyncStorage
    // No need to fetch favorites from Firestore

    console.log('FirebaseRepo: All available data has been cached locally.');
  }

  // All data retrieval methods will now implicitly use Firestore's cache
  // due to persistence being enabled.

  async searchKalaams(
    query: string,
    limit: number = 50,
    startAfterDoc?: firestore.QueryDocumentSnapshot<firestore.DocumentData>,
  ): Promise<KalaamListResponse> {
    console.log(`FirebaseRepo: searchKalaams called with query: '${query}', limit: ${limit}, startAfterDoc present: ${!!startAfterDoc}`);
    const searchQuery = query.toLowerCase();
    let queryRef = this.kalaamCollection
      .orderBy('title')
      .startAt(searchQuery)
      .endAt(searchQuery + '\uf8ff');

    return this.getPaginatedKalaams(queryRef, limit, 'searchKalaams', startAfterDoc);
  }

  async getKalaamsByMasaib(
    masaib: string,
    limit: number = 50,
    startAfterDoc?: firestore.QueryDocumentSnapshot<firestore.DocumentData>,
  ): Promise<KalaamListResponse> {
    console.log(`FirebaseRepo: getKalaamsByMasaib called with masaib: '${masaib}', limit: ${limit}, startAfterDoc present: ${!!startAfterDoc}`);
    let queryRef = this.kalaamCollection
      .where('masaib', '==', masaib)
      .orderBy('title');
    return this.getPaginatedKalaams(queryRef, limit, 'getKalaamsByMasaib', startAfterDoc);
  }

  async getKalaamsByPoet(
    poet: string,
    limit: number = 50,
    startAfterDoc?: firestore.QueryDocumentSnapshot<firestore.DocumentData>,
  ): Promise<KalaamListResponse> {
    console.log(`FirebaseRepo: getKalaamsByPoet called with poet: '${poet}', limit: ${limit}, startAfterDoc present: ${!!startAfterDoc}`);
    let queryRef = this.kalaamCollection
      .where('poet', '==', poet)
      .orderBy('title');
    return this.getPaginatedKalaams(queryRef, limit, 'getKalaamsByPoet', startAfterDoc);
  }

  async getKalaamsByReciter(
    reciter: string,
    limit: number = 50,
    startAfterDoc?: firestore.QueryDocumentSnapshot<firestore.DocumentData>,
  ): Promise<KalaamListResponse> {
    console.log(`FirebaseRepo: getKalaamsByReciter called with reciter: '${reciter}', limit: ${limit}, startAfterDoc present: ${!!startAfterDoc}`);
    let queryRef = this.kalaamCollection
      .where('reciter', '==', reciter)
      .orderBy('title');
    return this.getPaginatedKalaams(queryRef, limit, 'getKalaamsByReciter', startAfterDoc);
  }

  async getKalaamById(id: number): Promise<Kalaam | null> {
    console.log(`FirebaseRepo: getKalaamById called with id: ${id}`);
    try {
      // Query by the 'id' field instead of document ID
      const query = this.kalaamCollection.where('id', '==', id).limit(1);
      const snapshot = await query.get();
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const data = doc.data();
        console.log(`FirebaseRepo: getKalaamById found doc for id: ${id}`);
        console.log(`FirebaseRepo: getKalaamById data:`, data);
        return { id: data.id, ...data } as Kalaam;
      }
      console.log(`FirebaseRepo: getKalaamById did not find doc for id: ${id}`);
      return null;
    } catch (error) {
      console.error(`FirebaseRepo: Error in getKalaamById for id ${id}:`, error);
      return null;
    }
  }

  // Renamed getCount to getTotalCount to avoid confusion and pass methodName
  private async getTotalCount(
    queryRef: firestore.Query<firestore.DocumentData>,
    methodName: string,
  ): Promise<number> {
    try {
      console.log(`FirebaseRepo: ${methodName} - getting total count...`);
      const snapshot = await queryRef.count().get();
      const count = snapshot.data().count;
      console.log(`FirebaseRepo: ${methodName} - total count: ${count}`);
      return count;
    } catch (error) {
      console.error(`FirebaseRepo: Error in getTotalCount for ${methodName}:`, error);
      throw error; // Re-throw to propagate the error
    }
  }

  private async getPaginatedKalaams(
    baseQueryRef: firestore.Query<firestore.DocumentData>,
    limit: number,
    methodName: string, // Added for logging
    startAfterDoc?: firestore.QueryDocumentSnapshot<firestore.DocumentData>,
  ): Promise<KalaamListResponse> {
    try {
      let queryRef = baseQueryRef;
      if (startAfterDoc) {
        queryRef = queryRef.startAfter(startAfterDoc);
        console.log(`FirebaseRepo: ${methodName} - starting after document with ID: ${startAfterDoc.id}`);
      } else {
        console.log(`FirebaseRepo: ${methodName} - fetching first page.`);
      }

      console.log(`FirebaseRepo: ${methodName} - executing query with limit: ${limit}`);
      const snapshot = await queryRef.limit(limit).get();

      console.log(`FirebaseRepo: ${methodName} - received ${snapshot.docs.length} documents.`);
      const kalaams = snapshot.docs.map(
        (doc: firestore.QueryDocumentSnapshot<firestore.DocumentData>) => {
          const data = doc.data();
          // Basic validation/logging for individual documents
          if (!data.title) {
            console.warn(`FirebaseRepo: ${methodName} - Document ${doc.id} is missing a 'title' field.`);
          }
          return { id: parseInt(doc.id, 10), ...data } as Kalaam;
        },
      ) as Kalaam[];

      const lastVisibleDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : undefined;

      // Note: For true pagination with total, we still need to get the total count
      // from the base query without limit/startAfter.
      // This is less efficient than just getting the next batch, but needed for 'total' field.
      const totalCount = await this.getTotalCount(baseQueryRef, methodName);


      console.log(`FirebaseRepo: ${methodName} - returning ${kalaams.length} kalaams. Total: ${totalCount}. Last visible doc present: ${!!lastVisibleDoc}`);
      return {
        kalaams,
        total: totalCount,
        page: 1, // Page number becomes less meaningful with cursor pagination, set to 1 or remove if not needed
        limit,
        lastVisibleDoc,
      };
    } catch (error) {
      console.error(`FirebaseRepo: Error in getPaginatedKalaams for ${methodName}:`, error);
      throw error; // Re-throw to propagate the error
    }
  }

  async getMasaibGroups(): Promise<MasaibGroup[]> {
    console.log('FirebaseRepo: getMasaibGroups called.');
    try {
      const snapshot = await this.kalaamCollection.get(); // Fetch all documents to aggregate from cache/server
      console.log(`FirebaseRepo: getMasaibGroups - fetched ${snapshot.docs.length} documents for aggregation.`);
    const masaibCounts: { [key: string]: number } = {};

    snapshot.docs.forEach(
      (doc: firestore.QueryDocumentSnapshot<firestore.DocumentData>) => {
        const masaib = doc.data().masaib;
        if (masaib) {
          masaibCounts[masaib] = (masaibCounts[masaib] || 0) + 1;
        }
      },
    );
      console.log('FirebaseRepo: getMasaibGroups - masaib counts:', masaibCounts);
    return Object.entries(masaibCounts)
        .map(([masaib, count]) => ({ masaib, count }))
      .sort((a, b) => b.count - a.count);
    } catch (error) {
      console.error('FirebaseRepo: Error in getMasaibGroups:', error);
      return []; // Return empty on error
    }
  }

  async getPoetGroups(): Promise<PoetGroup[]> {
    console.log('FirebaseRepo: getPoetGroups called.');
    try {
      const snapshot = await this.kalaamCollection.get(); // Fetch all documents to aggregate from cache/server
      console.log(`FirebaseRepo: getPoetGroups - fetched ${snapshot.docs.length} documents for aggregation.`);
    const poetCounts: { [key: string]: number } = {};

    snapshot.docs.forEach(
      (doc: firestore.QueryDocumentSnapshot<firestore.DocumentData>) => {
        const poet = doc.data().poet;
        if (poet) {
          poetCounts[poet] = (poetCounts[poet] || 0) + 1;
        }
      },
    );
      console.log('FirebaseRepo: getPoetGroups - poet counts:', poetCounts);
    return Object.entries(poetCounts)
        .map(([poet, count]) => ({ poet, count }))
      .sort((a, b) => b.count - a.count);
    } catch (error) {
      console.error('FirebaseRepo: Error in getPoetGroups:', error);
      return []; // Return empty on error
    }
  }

  async getReciterGroups(): Promise<ReciterGroup[]> {
    console.log('FirebaseRepo: getReciterGroups called.');
    try {
      const snapshot = await this.kalaamCollection.get(); // Fetch all documents to aggregate from cache/server
      console.log(`FirebaseRepo: getReciterGroups - fetched ${snapshot.docs.length} documents for aggregation.`);
    const reciterCounts: { [key: string]: number } = {};

    snapshot.docs.forEach(
      (doc: firestore.QueryDocumentSnapshot<firestore.DocumentData>) => {
        const reciter = doc.data().reciter;
        if (reciter) {
          reciterCounts[reciter] = (reciterCounts[reciter] || 0) + 1;
        }
      },
    );
      console.log('FirebaseRepo: getReciterGroups - reciter counts:', reciterCounts);
    return Object.entries(reciterCounts)
        .map(([reciter, count]) => ({ reciter, count }))
      .sort((a, b) => b.count - a.count);
    } catch (error) {
      console.error('FirebaseRepo: Error in getReciterGroups:', error);
      return []; // Return empty on error
    }
  }

  async getMasaibByReciter(reciter: string): Promise<string[]> {
    console.log(`FirebaseRepo: getMasaibByReciter called with reciter: '${reciter}'.`);
    try {
    const snapshot = await this.kalaamCollection
      .where('reciter', '==', reciter)
      .get();

      console.log(`FirebaseRepo: getMasaibByReciter - fetched ${snapshot.docs.length} documents.`);
    const masaibList = new Set<string>();
    snapshot.docs.forEach(
      (doc: firestore.QueryDocumentSnapshot<firestore.DocumentData>) => {
        const masaib = doc.data().masaib;
        if (masaib) {
          masaibList.add(masaib);
        }
      },
    );
      console.log('FirebaseRepo: getMasaibByReciter - unique masaib found:', Array.from(masaibList).sort());
    return Array.from(masaibList).sort();
    } catch (error) {
      console.error(`FirebaseRepo: Error in getMasaibByReciter for reciter '${reciter}':`, error);
      return []; // Return empty on error
    }
  }

  async getKalaamsByReciterAndMasaib(
    reciter: string,
    masaib: string,
    limit: number = 50,
    startAfterDoc?: firestore.QueryDocumentSnapshot<firestore.DocumentData>,
  ): Promise<KalaamListResponse> {
    console.log(`FirebaseRepo: getKalaamsByReciterAndMasaib called with reciter: '${reciter}', masaib: '${masaib}', limit: ${limit}, startAfterDoc present: ${!!startAfterDoc}`);
    let queryRef = this.kalaamCollection
      .where('reciter', '==', reciter)
      .where('masaib', '==', masaib)
      .orderBy('title');

    return this.getPaginatedKalaams(queryRef, limit, 'getKalaamsByReciterAndMasaib', startAfterDoc);
  }

  // Note: addFavourite method removed - now handled by FavoritesService using AsyncStorage

  // Note: removeFavourite method removed - now handled by FavoritesService using AsyncStorage

  // Note: isFavourite method removed - now handled by FavoritesService using AsyncStorage

  // Note: getFavouriteKalaams method removed - now handled by FavoritesService using AsyncStorage
}
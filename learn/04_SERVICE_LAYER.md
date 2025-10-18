# Pursadari App - Service Layer Documentation

## Overview of Service Layer

The service layer contains the business logic and external service integrations of your React Native app. It's separate from the UI components to maintain clean architecture and reusability.

### React Native Perspective
In React Native, services are:
- **Business Logic Containers** - Handle complex operations
- **Data Access Layer** - Interface between UI and data sources
- **External Service Integration** - Connect to APIs and cloud services
- **State Management** - Handle application state and persistence

## Database.ts - The Data Access Layer

### Purpose
`Database.ts` is the central data access layer that handles all SQLite database operations. It's like a repository pattern that abstracts database operations from the rest of the app.

### React Native Perspective
This class demonstrates several key React Native concepts:
- **Singleton Pattern** - Single database instance
- **Async/Await** - Handling asynchronous operations
- **SQLite Integration** - Local database operations
- **Error Handling** - Graceful failure management
- **Type Safety** - TypeScript for data operations

### Key React Native Concepts Used

#### 1. **Singleton Pattern**
```typescript
class Database {
  private static instance: Database | null = null;
  private db: SQLiteDatabase | null = null;

  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }
}
```
**What it does**: Ensures only one database instance exists across the app.
**React Native Perspective**: 
- **Singleton Pattern**: Single instance for shared resources
- **Private Constructor**: Prevents direct instantiation
- **Static Methods**: Class-level functionality
- **Memory Management**: Efficient resource usage

#### 2. **SQLite Integration**
```typescript
import SQLite, { SQLiteDatabase } from 'react-native-sqlite-storage';

async init(): Promise<void> {
  this.db = await SQLite.openDatabase({
    name: 'database.sqlite',
    createFromLocation: '~www/database.sqlite',
    location: 'default',
  });
}
```
**What it does**: Opens and initializes the SQLite database.
**React Native Perspective**: 
- **react-native-sqlite-storage**: Third-party library for SQLite
- **Async Operations**: Database operations are asynchronous
- **Database Location**: Specifies where database is stored
- **Error Handling**: Database operations can fail

#### 3. **Database Schema Management**
```typescript
await this.db.executeSql(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME
  )
`);

await this.db.executeSql(`
  CREATE TABLE IF NOT EXISTS favourites (
    kalaam_id INTEGER PRIMARY KEY,
    created_at DATETIME
  )
`);
```
**What it does**: Creates database tables if they don't exist.
**React Native Perspective**: 
- **SQL DDL**: Data Definition Language for schema
- **IF NOT EXISTS**: Prevents errors on re-runs
- **Schema Migration**: Database structure management
- **Data Types**: SQLite data types

#### 4. **CRUD Operations**
```typescript
async searchKalaams(
  query: string,
  page: number = 1,
  limit: number = 50,
): Promise<KalaamListResponse> {
  const db = this.ensureInitialized();
  const offset = (page - 1) * limit;
  const searchQuery = `%${query}%`;

  const [result] = await db.executeSql(`
    SELECT * FROM kalaam 
    WHERE title LIKE ? OR lyrics_eng LIKE ? OR lyrics_urdu LIKE ? 
    ORDER BY 
      CASE 
        WHEN title LIKE ? THEN 1 
        WHEN lyrics_eng LIKE ? OR lyrics_urdu LIKE ? THEN 2 
        ELSE 3 
      END,
      title
    LIMIT ? OFFSET ?
  `, [searchQuery, searchQuery, searchQuery, searchQuery, searchQuery, searchQuery, limit, offset]);

  const kalaams: Kalaam[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    kalaams.push(result.rows.item(i));
  }

  return { kalaams, total, page, limit };
}
```
**What it does**: Searches for kalaams with pagination and priority-based results.
**React Native Perspective**: 
- **SQL Queries**: Complex database queries
- **Pagination**: LIMIT and OFFSET for large datasets
- **Priority Ordering**: CASE statements for result ranking
- **Type Safety**: TypeScript return types
- **Error Handling**: Database operation failures

#### 5. **Transaction Management**
```typescript
async upsertKalaam(kalaam: Kalaam): Promise<void> {
  const db = this.ensureInitialized();
  await db.executeSql(`
    INSERT OR REPLACE INTO kalaam 
    (id, title, lyrics_urdu, lyrics_eng, poet, reciter, masaib, yt_link, last_modified, deleted)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    kalaam.id,
    kalaam.title || '',
    kalaam.lyrics_urdu || '',
    kalaam.lyrics_eng || '',
    kalaam.poet || '',
    kalaam.reciter || '',
    kalaam.masaib || '',
    kalaam.yt_link || '',
    kalaam.last_modified || new Date().toISOString(),
    kalaam.deleted ? 1 : 0
  ]);
}
```
**What it does**: Inserts or updates kalaam records with proper data handling.
**React Native Perspective**: 
- **INSERT OR REPLACE**: Upsert operation
- **Parameterized Queries**: SQL injection prevention
- **Data Validation**: Handling null/undefined values
- **Type Conversion**: Boolean to integer conversion

#### 6. **Error Handling**
```typescript
private ensureInitialized(): SQLite.SQLiteDatabase {
  if (!this.db) {
    throw new Error('Database not initialized. Call init() first.');
  }
  return this.db;
}
```
**What it does**: Ensures database is initialized before operations.
**React Native Perspective**: 
- **Error Throwing**: Explicit error handling
- **Validation**: Pre-operation checks
- **Debugging**: Clear error messages
- **Type Safety**: Return type validation

### Key Patterns Used

#### 1. **Repository Pattern**
- Abstract data access
- Consistent interface
- Database abstraction
- Type-safe operations

#### 2. **Singleton Pattern**
- Single database instance
- Shared state management
- Resource efficiency
- Global access

#### 3. **Error Handling**
- Graceful failures
- Clear error messages
- Validation checks
- Debugging support

## SyncManager.ts - Data Synchronization

### Purpose
`SyncManager.ts` handles data synchronization between the local SQLite database and Firebase Firestore. It manages background sync, conflict resolution, and data consistency.

### React Native Perspective
This service demonstrates:
- **Cloud Integration** - Firebase Firestore connection
- **Background Processing** - Sync without user interaction
- **Conflict Resolution** - Handling data conflicts
- **Batch Operations** - Efficient data processing
- **Error Recovery** - Handling sync failures

### Key React Native Concepts Used

#### 1. **Firebase Integration**
```typescript
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export class SyncManager {
  private firestore: typeof firestore;
  private lastSyncTimestamp: number = 0;
  private isSyncing: boolean = false;

  constructor() {
    this.firestore = firestore();
  }
}
```
**What it does**: Initializes Firebase Firestore connection.
**React Native Perspective**: 
- **@react-native-firebase/firestore**: Firebase integration library
- **Firebase Types**: TypeScript support for Firebase
- **Service Initialization**: Constructor-based setup
- **State Management**: Track sync state

#### 2. **Sync Lock Pattern**
```typescript
async syncKalaamData(): Promise<SyncResult> {
  if (this.isSyncing) {
    console.log('[SyncManager] Sync already in progress, skipping...');
    return { success: true, recordsProcessed: 0, activeRecords: 0, deletedRecords: 0 };
  }

  this.isSyncing = true;
  try {
    // ... sync logic
  } finally {
    this.isSyncing = false;
  }
}
```
**What it does**: Prevents concurrent sync operations.
**React Native Perspective**: 
- **Sync Lock**: Prevent race conditions
- **Boolean Flags**: Simple state tracking
- **Finally Block**: Ensure cleanup
- **Concurrency Control**: Thread-safe operations

#### 3. **Delta Sync**
```typescript
const query = this.firestore
  .collection('kalaam')
  .where('last_modified', '>', new Date(queryTimestamp))
  .orderBy('last_modified')
  .limit(50);

const snapshot = await query.get();
const records = snapshot.docs.map(doc => ({
  id: parseInt(doc.id),
  ...doc.data()
})) as Kalaam[];
```
**What it does**: Only sync records modified since last sync.
**React Native Perspective**: 
- **Firestore Queries**: Cloud database queries
- **Timestamp Filtering**: Delta sync optimization
- **Data Mapping**: Transform Firebase data
- **Type Safety**: TypeScript type assertions

#### 4. **Batch Processing**
```typescript
private async performBatchedSync(records: Kalaam[]): Promise<SyncResult> {
  const batchSize = 10;
  const activeRecords = records.filter(record => !record.deleted);
  const deletedRecords = records.filter(record => record.deleted);
  
  let processedCount = 0;
  const totalRecords = records.length;
  
  for (let i = 0; i < activeRecords.length; i += batchSize) {
    const batch = activeRecords.slice(i, i + batchSize);
    
    for (const record of batch) {
      await database.upsertKalaam(record);
      processedCount++;
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}
```
**What it does**: Processes large datasets in batches to prevent memory issues.
**React Native Perspective**: 
- **Batch Processing**: Handle large datasets
- **Memory Management**: Prevent memory overflow
- **Progress Tracking**: Monitor processing progress
- **Async Delays**: Prevent overwhelming system

#### 5. **Error Handling and Recovery**
```typescript
try {
  const result = await this.performBatchedSync(records);
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
}
```
**What it does**: Handles sync failures gracefully with detailed error information.
**React Native Perspective**: 
- **Try-Catch**: Error handling
- **Error Types**: Type-safe error handling
- **Logging**: Debug information
- **Graceful Degradation**: Continue app operation

### Key Patterns Used

#### 1. **Sync Manager Pattern**
- Centralized sync logic
- State management
- Error handling
- Progress tracking

#### 2. **Batch Processing Pattern**
- Large dataset handling
- Memory optimization
- Progress tracking
- Performance optimization

#### 3. **Error Recovery Pattern**
- Graceful failures
- Error logging
- State recovery
- User feedback

## FavoritesService.ts - User Preferences

### Purpose
`FavoritesService.ts` manages user favorites and pins using SQLite for persistence. It provides methods to add, remove, check, and retrieve favorite kalaams.

### React Native Perspective
This service demonstrates:
- **User Preferences** - Managing user choices
- **Data Persistence** - Storing user data locally
- **Service Layer** - Business logic separation
- **Type Safety** - TypeScript for data operations
- **Error Handling** - Graceful failure management

### Key React Native Concepts Used

#### 1. **Static Methods**
```typescript
class FavoritesService {
  private static FAVORITES_KEY = 'user_favorites';
  private static PINS_KEY = 'user_pins';
  private static MAX_PINS = 3;

  static async addFavorite(kalaamId: number): Promise<void> {
    const favorites = await this.getFavoritesList();
    if (!favorites.includes(kalaamId)) {
      favorites.push(kalaamId);
      await this.saveFavoritesList(favorites);
    }
  }
}
```
**What it does**: Provides utility methods for managing favorites.
**React Native Perspective**: 
- **Static Methods**: Class-level functionality
- **Private Constants**: Internal configuration
- **Async Operations**: Database operations
- **Data Validation**: Check for duplicates

#### 2. **Data Serialization**
```typescript
private static async getFavoritesList(): Promise<number[]> {
  const favoritesStr = await database.getSetting(this.FAVORITES_KEY);
  return favoritesStr ? JSON.parse(favoritesStr) : [];
}

private static async saveFavoritesList(favorites: number[]): Promise<void> {
  await database.setSetting(this.FAVORITES_KEY, JSON.stringify(favorites));
}
```
**What it does**: Serializes and deserializes favorite data.
**React Native Perspective**: 
- **JSON Serialization**: Convert objects to strings
- **Data Storage**: Store in database
- **Default Values**: Handle missing data
- **Type Safety**: TypeScript return types

#### 3. **Business Logic**
```typescript
static async pinKalaam(kalaamId: number): Promise<boolean> {
  const pins = await this.getPinsList();
  
  if (pins.includes(kalaamId)) {
    return false; // Already pinned
  }
  
  if (pins.length >= this.MAX_PINS) {
    return false; // Max pins reached
  }
  
  pins.push(kalaamId);
  await this.savePinsList(pins);
  return true;
}
```
**What it does**: Implements business rules for pinning content.
**React Native Perspective**: 
- **Business Rules**: Application logic
- **Validation**: Check constraints
- **Return Values**: Success/failure indication
- **State Updates**: Modify data

#### 4. **Data Retrieval**
```typescript
static async getFavoriteKalaams(
  limit: number = 50,
  startAfterDoc?: any
): Promise<KalaamListResponse> {
  try {
    const favoriteIds = await this.getFavoritesList();
    
    if (favoriteIds.length === 0) {
      return {
        kalaams: [],
        total: 0,
        page: 1,
        limit,
        lastVisibleDoc: null
      };
    }

    const promises = favoriteIds.map(id => database.getKalaamById(id));
    const kalaams = (await Promise.all(promises)).filter((k): k is Kalaam => k !== null);

    return {
      kalaams,
      total: kalaams.length,
      page: 1,
      limit,
      lastVisibleDoc: null
    };
  } catch (error) {
    console.error('Error getting favorite kalaams:', error);
    return {
      kalaams: [],
      total: 0,
      page: 1,
      limit,
      lastVisibleDoc: null
    };
  }
}
```
**What it does**: Retrieves favorite kalaams with proper error handling.
**React Native Perspective**: 
- **Promise.all**: Parallel database operations
- **Error Handling**: Try-catch for failures
- **Data Filtering**: Remove null results
- **Type Safety**: TypeScript type guards

### Key Patterns Used

#### 1. **Service Layer Pattern**
- Business logic separation
- Data access abstraction
- Reusable methods
- Type-safe operations

#### 2. **Data Persistence Pattern**
- Local storage
- Serialization
- Error handling
- Default values

#### 3. **Business Logic Pattern**
- Application rules
- Validation
- State management
- User preferences

## FontManager.ts - Typography Management

### Purpose
`FontManager.ts` manages font availability and provides safe font handling for different languages and platforms.

### React Native Perspective
This utility demonstrates:
- **Font Management** - Handling custom fonts
- **Platform Detection** - iOS vs Android differences
- **Font Loading** - Managing font availability
- **Type Safety** - TypeScript for font operations
- **Fallback Handling** - Safe font selection

### Key React Native Concepts Used

#### 1. **Platform Detection**
```typescript
import { Platform } from 'react-native';

private static readonly SYSTEM_FONTS = {
  ios: [
    'System',
    'Helvetica',
    'Helvetica-Bold',
    'Arial',
    'Arial-Bold',
    'Times New Roman',
    'Times New Roman-Bold',
  ],
  android: [
    'System',
    'Roboto',
    'Roboto-Light',
    'Roboto-Medium',
    'Roboto-Bold',
    'Droid Sans',
    'Droid Sans Mono',
    'serif',
    'monospace',
  ],
};
```
**What it does**: Defines platform-specific font lists.
**React Native Perspective**: 
- **Platform.OS**: Detect current platform
- **Platform-Specific Code**: Different behavior per platform
- **Font Lists**: Available fonts per platform
- **System Fonts**: Default platform fonts

#### 2. **Font Initialization**
```typescript
static async initialize(): Promise<void> {
  if (this.isInitialized) return;

  try {
    const systemFonts = Platform.OS === 'ios' 
      ? this.SYSTEM_FONTS.ios 
      : this.SYSTEM_FONTS.android;
    
    systemFonts.forEach(font => this.availableFonts.add(font));
    this.URDU_FONTS.forEach(font => this.availableFonts.add(font));
    this.ENGLISH_FONTS.forEach(font => this.availableFonts.add(font));

    this.isInitialized = true;
  } catch (error) {
    console.error('Failed to initialize FontManager:', error);
    // Fallback to system fonts only
  }
}
```
**What it does**: Initializes font manager with available fonts.
**React Native Perspective**: 
- **Async Initialization**: Font loading is asynchronous
- **Error Handling**: Graceful fallbacks
- **State Management**: Track initialization state
- **Font Registration**: Add fonts to available list

#### 3. **Safe Font Selection**
```typescript
static getSafeFontFamily(fontName: string, isUrdu: boolean = false): string {
  if (!fontName || fontName === 'System') {
    return 'System';
  }

  return fontName;
}
```
**What it does**: Provides safe font family selection with fallbacks.
**React Native Perspective**: 
- **Fallback Handling**: Default to system fonts
- **Parameter Validation**: Check for valid font names
- **Type Safety**: TypeScript parameter types
- **Safe Defaults**: Always return valid font

#### 4. **Font Options for UI**
```typescript
static getFontOptions(): {
  urdu: Array<{ label: string; value: string }>;
  english: Array<{ label: string; value: string }>;
} {
  const urduOptions = [
    { label: 'System Default', value: 'System' },
    ...this.getAvailableUrduFonts().map(font => ({
      label: this.getFontDisplayName(font),
      value: font,
    })),
  ];

  const englishOptions = [
    { label: 'System Default', value: 'System' },
    ...this.getAvailableEnglishFonts().map(font => ({
      label: this.getFontDisplayName(font),
      value: font,
    })),
  ];

  return { urdu: urduOptions, english: englishOptions };
}
```
**What it does**: Provides font options for UI components.
**React Native Perspective**: 
- **UI Data**: Format data for UI components
- **Display Names**: User-friendly font names
- **Option Lists**: Array of font choices
- **Type Safety**: TypeScript return types

### Key Patterns Used

#### 1. **Utility Pattern**
- Static methods
- No instance state
- Pure functions
- Reusable logic

#### 2. **Font Management Pattern**
- Font availability tracking
- Safe font selection
- Platform-specific handling
- Fallback mechanisms

#### 3. **Initialization Pattern**
- One-time setup
- Error handling
- State tracking
- Graceful fallbacks

## Common Patterns Across All Services

### 1. **Service Layer Pattern**
- Business logic separation
- Data access abstraction
- Reusable methods
- Type-safe operations

### 2. **Error Handling**
- Try-catch blocks
- Graceful failures
- Error logging
- Fallback values

### 3. **Type Safety**
- TypeScript interfaces
- Type guards
- Return type validation
- Parameter validation

### 4. **Performance Optimization**
- Async operations
- Batch processing
- Memory management
- Efficient algorithms

### 5. **State Management**
- Singleton patterns
- State tracking
- Initialization
- Cleanup

## Next Steps

Now that you understand the service layer, the next documentation will cover:

1. **Database Operations** - SQLite and data persistence
2. **Context and State** - Global state management
3. **Utilities and Helpers** - Supporting functions
4. **Best Practices** - React Native development guidelines
5. **Recipes and Patterns** - Common development solutions

Each section will include detailed explanations of React Native concepts and how they're implemented in your app.

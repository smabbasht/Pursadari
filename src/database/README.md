# Database Architecture

This directory contains the database layer for the Pursadari app, designed to be easily switchable between SQLite and Firebase.

## Architecture Overview

The database layer uses the **Repository Pattern** with a **Factory Pattern** to abstract the database implementation:

```
DatabaseService (Facade)
    ↓
DatabaseFactory
    ↓
IDatabaseService (Interface)
    ↓
┌─────────────────┬─────────────────┐
│ SQLiteRepository│ FirebaseRepository│
│   (Current)     │   (Future)      │
└─────────────────┴─────────────────┘
```

## Current Implementation

- **SQLite**: Currently active, using `react-native-sqlite-storage`
- **Firebase**: Placeholder implementation ready for future migration

## Files Structure

```
src/database/
├── README.md                           # This file
├── DatabaseService.ts                  # Main facade (unchanged API)
├── DatabaseFactory.ts                  # Factory to create database instances
├── interfaces/
│   └── IDatabaseService.ts            # Database interface
└── repositories/
    ├── SQLiteRepository.ts            # SQLite implementation
    └── FirebaseRepository.ts          # Firebase implementation (placeholder)
```

## How to Switch to Firebase

When you're ready to migrate to Firebase:

### 1. Install Firebase Dependencies

```bash
npm install @react-native-firebase/app @react-native-firebase/firestore
```

### 2. Configure Firebase

- Set up Firebase project
- Add configuration files to your project
- Follow React Native Firebase setup guide

### 3. Switch Database Type

In `DatabaseFactory.ts`, change:

```typescript
const DATABASE_TYPE: DatabaseType = DatabaseType.FIREBASE;
```

### 4. Implement Firebase Methods

Update `FirebaseRepository.ts` to implement all the methods using Firebase Firestore.

### 5. No Other Changes Needed!

All your existing code will continue to work without any modifications.

## Benefits of This Architecture

1. **Zero Breaking Changes**: Existing code doesn't need to change
2. **Easy Testing**: Can easily mock the database interface
3. **Future-Proof**: Easy to add more database types (MongoDB, PostgreSQL, etc.)
4. **Clean Separation**: Database logic is separated from business logic
5. **Type Safety**: Full TypeScript support with interfaces

## Usage

The existing code continues to work exactly the same:

```typescript
import DatabaseService from '../database/DatabaseService';

// All existing code works unchanged
const kalaams = await DatabaseService.searchKalaams('query');
const kalaam = await DatabaseService.getKalaamById(1);
await DatabaseService.addFavourite(1);
```

## Migration Checklist

When migrating to Firebase:

- [ ] Install Firebase packages
- [ ] Configure Firebase project
- [ ] Update `DATABASE_TYPE` in `DatabaseFactory.ts`
- [ ] Implement all methods in `FirebaseRepository.ts`
- [ ] Test all functionality
- [ ] Update data structure if needed (SQLite → Firestore)
- [ ] Handle offline capabilities
- [ ] Implement proper error handling
- [ ] Add Firebase security rules
- [ ] Test performance and optimize queries

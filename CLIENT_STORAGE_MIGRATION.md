# Client-Side Storage Migration

This document outlines the migration from Firestore-based storage to client-side storage using React Native AsyncStorage for app settings and favorites.

## Overview

The app now uses a hybrid storage approach:
- **Firestore**: Only stores the `kalaam` collection (religious content)
- **AsyncStorage**: Stores user settings and favorites locally on the device

## Changes Made

### 1. New Services Created

#### AsyncStorageService (`src/services/AsyncStorageService.ts`)
- Centralized service for all AsyncStorage operations
- Handles settings persistence (theme, fonts, colors, etc.)
- Handles favorites management (add, remove, check, list)
- Provides error handling and logging

#### FavoritesService (`src/services/FavoritesService.ts`)
- High-level service for favorites management
- Uses AsyncStorageService for persistence
- Fetches kalaam details from DatabaseService when needed
- Provides pagination support for favorites list

### 2. Updated Components

#### SettingsContext (`src/context/SettingsContext.tsx`)
- Added AsyncStorage integration for settings persistence
- Settings are automatically saved when changed
- Settings are loaded on app startup
- Added loading state to prevent saving during initial load

#### FavouritesScreen (`src/screens/FavouritesScreen.tsx`)
- Updated to use FavoritesService instead of DatabaseService
- No changes to UI or user experience
- Maintains pagination and loading states

#### KalaamScreen (`src/screens/KalaamScreen.tsx`)
- Updated to use FavoritesService for favorite operations
- No changes to UI or user experience

### 3. Database Layer Updates

#### Database Interface (`src/database/interfaces/IDatabaseService.ts`)
- Removed favorites-related method signatures
- Added comment explaining favorites are now handled by FavoritesService

#### DatabaseService (`src/database/DatabaseService.ts`)
- Removed favorites method implementations
- Added comment explaining the change

#### Repository Implementations
- **FirebaseRepository**: Removed all favorites methods and collection references
- **SQLiteRepository**: Removed all favorites methods and table creation

## Benefits

1. **Offline-First**: Settings and favorites work completely offline
2. **Performance**: No network calls for user preferences
3. **Privacy**: User data stays on device
4. **Simplicity**: Cleaner separation between content and user data
5. **Cost**: Reduced Firestore usage and costs

## Storage Structure

### AsyncStorage Keys
- `@bayaaz_settings`: User preferences (theme, fonts, colors, etc.)
- `@bayaaz_favorites`: Array of favorite kalaam IDs

### Settings Object
```typescript
{
  theme: 'light' | 'dark',
  accentColor: string,
  engFont: string,
  urduFont: string,
  engFontScale: number,
  urduFontScale: number,
  fontScale: number
}
```

### Favorites Array
```typescript
number[] // Array of kalaam IDs
```

## Migration Notes

- Existing Firestore favorites data is not migrated automatically
- Users will need to re-add their favorites after this update
- Settings will be reset to defaults on first launch
- No data loss for kalaam content (still in Firestore)

## Testing

- Created test file for AsyncStorageService
- All existing functionality should work as before
- Settings persist across app restarts
- Favorites work offline
- No network dependency for user preferences

## Future Considerations

- Consider adding data export/import functionality
- Could add cloud backup for settings and favorites
- Might want to add migration tools for existing users

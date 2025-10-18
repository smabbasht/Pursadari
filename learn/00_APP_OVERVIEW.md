# Pursadari App - Complete Overview

## What is Pursadari?

**Pursadari** is a comprehensive offline-first mobile application for accessing and managing Shia religious content, specifically focused on Kalaam, Nohas, and religious texts. It's built with React Native and TypeScript, prioritizing offline functionality while maintaining sync capabilities for collaborative content management.

## App Architecture Overview

### Core Philosophy
- **Offline-First**: Complete functionality without internet connection
- **Local SQLite Database**: Fast, reliable data storage
- **Smart Sync System**: Updates when connection is available
- **Multi-language Support**: Arabic, Urdu, and English content
- **Cross-platform**: Works on both iOS and Android

### Technology Stack

#### Frontend (React Native)
- **React Native 0.81.0** - Cross-platform mobile development
- **TypeScript** - Type-safe development
- **React Navigation** - Navigation between screens
- **React Native Vector Icons** - Icon library
- **React Native SQLite Storage** - Local database
- **React Native Safe Area Context** - Safe area handling
- **React Native Gesture Handler** - Touch gestures

#### Backend & Sync
- **Firebase Firestore** - Cloud database for content management
- **SQLite** - Local database for offline storage
- **Custom Sync Engine** - Intelligent data synchronization
- **Background Sync** - Automatic content updates

## Key Features

### 🔄 Offline-First Architecture
- Complete offline functionality
- Local SQLite database for fast access
- Smart sync system with background updates
- One sync per day optimization

### 📚 Content Management
- **Kalaam & Nohas** - Extensive collection of religious poetry
- **Multi-language support** - Arabic, Urdu, and English
- **Advanced search** - Search by title, lyrics, poet, reciter, or masaib
- **Priority-based search** - Title matches first, then lyrics
- **Streaming search results** - Real-time search with progressive loading

### 🎵 Rich Media Experience
- **YouTube integration** - Embedded video content
- **Custom fonts** - Support for Arabic, Urdu, and English typography
- **Theme support** - Light and dark mode with custom accent colors
- **High-quality audio** - Optimized for religious recitations

### ⭐ Personalization
- **Favorites system** - Save and organize preferred content
- **Pin functionality** - Pin up to 3 items for quick access
- **Special content** - Auto-favorited religious texts (Hadees e Kisa, Ziyarat Ashura)
- **Custom fonts** - Choose from multiple Arabic and Urdu font families
- **Font sizing** - Adjustable text size for better readability

### 🔍 Advanced Search & Discovery
- **Multi-language search** - Search in Urdu, English, or Arabic
- **Roman script support** - Search Urdu content using English characters
- **Smart suggestions** - Context-aware search recommendations
- **Search guidance** - Built-in help for effective searching

## App Structure

### Main Navigation
The app uses a **Bottom Tab Navigator** with 5 main sections:

1. **Add Lyrics** - Add new content to the app
2. **Search** - Search through existing content
3. **Home** - Browse content by categories (Masaib, Poet, Reciter)
4. **Favourites** - View saved content
5. **Settings** - App configuration and preferences

### Screen Hierarchy
```
App.tsx (Root)
├── Tab Navigator
│   ├── AddLyricsScreen
│   ├── SearchScreen
│   ├── HomeScreen (Stack Navigator)
│   │   ├── ContentListScreen (Masaib/Poet/Reciter)
│   │   └── KalaamScreen (Individual content)
│   ├── FavouritesScreen
│   └── SettingsScreen
```

## Data Flow

### 1. Content Sync Process
```
Firebase Firestore → SyncManager → Local SQLite → UI Components
```

### 2. User Interaction Flow
```
User Action → Screen Component → Database Service → SQLite → UI Update
```

### 3. Search Flow
```
User Query → SearchScreen → Database.searchKalaams() → Results → UI
```

## Key React Native Concepts Used

### 1. **Navigation**
- **React Navigation** for screen transitions
- **Stack Navigator** for hierarchical navigation
- **Tab Navigator** for main app sections
- **Navigation Props** for passing data between screens

### 2. **State Management**
- **React Context** for global app state (SettingsContext)
- **useState** for local component state
- **useEffect** for side effects and lifecycle management
- **useMemo** for performance optimization

### 3. **Database Integration**
- **SQLite** for local data storage
- **Async/await** for database operations
- **Singleton pattern** for database access
- **Transaction handling** for data consistency

### 4. **UI Components**
- **Custom Components** for reusable UI elements
- **Animated Components** for smooth transitions
- **TouchableOpacity** for interactive elements
- **SafeAreaView** for proper screen boundaries

### 5. **Performance Optimization**
- **FlatList** for efficient list rendering
- **useMemo** for expensive calculations
- **useCallback** for function memoization
- **Lazy loading** for large datasets

## Development Patterns

### 1. **Service Layer Pattern**
- Database operations abstracted into services
- FavoritesService for user preferences
- SyncManager for data synchronization
- FontManager for typography management

### 2. **Context Pattern**
- SettingsContext for global app settings
- Theme management with useThemeTokens
- Font configuration and management

### 3. **Singleton Pattern**
- Database instance for consistent access
- SyncManager for centralized sync operations
- FontManager for font management

### 4. **Repository Pattern**
- Database class acts as repository
- Abstracted data access methods
- Consistent interface for data operations

## File Organization

```
src/
├── components/          # Reusable UI components
├── screens/            # App screens
├── services/           # Business logic and API services
├── database/           # SQLite database management
├── context/            # React context providers
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## Next Steps

This overview provides the foundation for understanding the app. The following documentation will dive deeper into:

1. **Folder Structure** - Purpose of each directory
2. **File Documentation** - Detailed explanation of each file
3. **React Native Concepts** - How each concept is used in the app
4. **Recipes & Patterns** - Common development patterns and solutions
5. **Best Practices** - React Native development guidelines

Each section will include both the **purpose** (what it does for the app) and the **React Native perspective** (how it works in React Native) to help you learn the framework while understanding your codebase.

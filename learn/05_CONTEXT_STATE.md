# Pursadari App - Context and State Management Documentation

## Overview of State Management

State management in React Native is about managing data that changes over time and needs to be shared across components. Your app uses React Context for global state management, which is perfect for settings, themes, and user preferences.

### React Native Perspective
In React Native, state management involves:
- **Local State** - Component-specific data using useState
- **Global State** - App-wide data using Context
- **State Updates** - Triggering re-renders when data changes
- **State Persistence** - Saving state to local storage
- **State Synchronization** - Keeping state in sync across components

## SettingsContext.tsx - Global Settings Management

### Purpose
`SettingsContext.tsx` manages global app settings like theme, fonts, and sync configuration. It provides a centralized way to manage app-wide state and preferences.

### React Native Perspective
This context demonstrates several key React Native concepts:
- **React Context** - Global state management
- **Custom Hooks** - Reusable state logic
- **Theme Management** - Dynamic theming system
- **State Persistence** - Saving settings to database
- **Type Safety** - TypeScript for state management

### Key React Native Concepts Used

#### 1. **React Context Creation**
```typescript
import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

type SettingsValue = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  accentColor: string;
  setAccentColor: (c: string) => void;
  engFont: string;
  setEngFont: (f: string) => void;
  urduFont: string;
  setUrduFont: (f: string) => void;
  // ... more settings
};

const SettingsContext = createContext<SettingsValue>({
  theme: 'light',
  setTheme: () => {},
  accentColor: '#16a34a',
  setAccentColor: () => {},
  // ... default values
});
```
**What it does**: Creates a context with default values for all settings.
**React Native Perspective**: 
- **createContext**: Creates a context for global state
- **TypeScript**: Type-safe context values
- **Default Values**: Fallback values for context
- **State Shape**: Defines the structure of global state

#### 2. **Context Provider Component**
```typescript
export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [accentColor, setAccentColor] = useState<string>('#16a34a');
  const [engFont, setEngFont] = useState<string>('System');
  const [urduFont, setUrduFont] = useState<string>('System');
  // ... more state

  useEffect(() => {
    const loadSettings = async () => {
      await database.init();
      await FontManager.initialize();
      const settings = await database.getAllSettings();
      
      if (settings.theme) setTheme(settings.theme as Theme);
      if (settings.accent_color) setAccentColor(settings.accent_color);
      // ... load other settings
    };
    loadSettings();
  }, []);

  const value = useMemo(() => ({ 
    theme, 
    setTheme: (t: Theme) => {
      setTheme(t);
      updateSetting('theme', t);
    },
    accentColor, 
    setAccentColor: (c: string) => {
      setAccentColor(c);
      updateSetting('accent_color', c);
    },
    // ... more setters
  }), [theme, accentColor, engFont, urduFont, engFontScale, urduFontScale, fontScale, defaultLanguage, syncConfig, lastSyncTimestamp, isOnline]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}
```
**What it does**: Provides context values to all child components and manages state updates.
**React Native Perspective**: 
- **useState**: Local state for each setting
- **useEffect**: Load settings on component mount
- **useMemo**: Optimize context value creation
- **Provider**: Makes context available to children
- **State Updates**: Update both local state and database

#### 3. **Custom Hook for Context**
```typescript
export function useSettings() {
  return useContext(SettingsContext);
}
```
**What it does**: Provides a simple way to access settings context.
**React Native Perspective**: 
- **useContext**: Access context values
- **Custom Hook**: Encapsulate context usage
- **Type Safety**: TypeScript return types
- **Reusability**: Use in any component

#### 4. **Theme Tokens System**
```typescript
export type ThemeTokens = {
  isDark: boolean;
  background: string;
  surface: string;
  card: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  divider: string;
  overlay: string;
  modalBackdrop: string;
  accent: string;
  accentOnAccent: string;
  accentSubtle: string;
  danger: string;
};

export function useThemeTokens(): ThemeTokens {
  const { theme, accentColor } = useSettings();
  const isDark = theme === 'dark';
  
  return useMemo(() => {
    if (isDark) {
      return {
        isDark: true,
        background: '#0b1220',
        surface: '#0f172a',
        card: '#0f172a',
        textPrimary: '#e5e7eb',
        textSecondary: '#cbd5e1',
        textMuted: '#94a3b8',
        border: '#1f2937',
        divider: '#111827',
        overlay: 'rgba(2,6,23,0.65)',
        modalBackdrop: 'rgba(2,6,23,0.7)',
        accent: accentColor,
        accentOnAccent: '#ffffff',
        accentSubtle: hexToRGBA(accentColor, 0.16),
        danger: '#ef4444',
      } as ThemeTokens;
    }
    return {
      isDark: false,
      background: '#f9fafb',
      surface: '#ffffff',
      card: '#ffffff',
      textPrimary: '#111827',
      textSecondary: '#374151',
      textMuted: '#6b7280',
      border: '#e5e7eb',
      divider: '#f3f4f6',
      overlay: 'rgba(249,250,251,0.65)',
      modalBackdrop: 'rgba(17,24,39,0.5)',
      accent: accentColor,
      accentOnAccent: '#ffffff',
      accentSubtle: hexToRGBA(accentColor, 0.12),
      danger: '#dc2626',
    } as ThemeTokens;
  }, [isDark, accentColor]);
}
```
**What it does**: Provides a comprehensive theme system with light and dark modes.
**React Native Perspective**: 
- **Theme System**: Centralized color management
- **useMemo**: Optimize theme calculation
- **Type Safety**: TypeScript for theme tokens
- **Dynamic Theming**: Runtime theme switching
- **Color Utilities**: Helper functions for color manipulation

#### 5. **State Persistence**
```typescript
const updateSetting = async (key: string, value: string) => {
  await database.setSetting(key, value);
};

const value = useMemo(() => ({ 
  theme, 
  setTheme: (t: Theme) => {
    setTheme(t);
    updateSetting('theme', t);
  },
  accentColor, 
  setAccentColor: (c: string) => {
    setAccentColor(c);
    updateSetting('accent_color', c);
  },
  // ... more setters
}), [/* dependencies */]);
```
**What it does**: Automatically saves settings to database when they change.
**React Native Perspective**: 
- **State Persistence**: Save state to local storage
- **Database Integration**: SQLite for persistence
- **Automatic Saving**: Save on every change
- **Async Operations**: Database operations are asynchronous

### Key Patterns Used

#### 1. **Context Pattern**
- Global state management
- Provider/Consumer pattern
- Type-safe context
- Default values

#### 2. **Custom Hooks Pattern**
- Encapsulate context usage
- Reusable state logic
- Type safety
- Clean API

#### 3. **Theme System Pattern**
- Centralized theming
- Light/dark mode support
- Dynamic color switching
- Type-safe theme tokens

#### 4. **State Persistence Pattern**
- Automatic saving
- Database integration
- State synchronization
- Error handling

## State Management Patterns

### 1. **Local State Management**
```typescript
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [data, setData] = useState<DataType[]>([]);

const handleLoadData = async () => {
  setIsLoading(true);
  setError(null);
  try {
    const result = await fetchData();
    setData(result);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Unknown error');
  } finally {
    setIsLoading(false);
  }
};
```
**What it does**: Manages component-specific state with loading and error states.
**React Native Perspective**: 
- **useState**: Local component state
- **State Updates**: Trigger re-renders
- **Error Handling**: Manage error states
- **Loading States**: User feedback

### 2. **Global State Management**
```typescript
// In context provider
const [globalState, setGlobalState] = useState<GlobalStateType>(initialState);

const updateGlobalState = useCallback((newState: Partial<GlobalStateType>) => {
  setGlobalState(prev => ({ ...prev, ...newState }));
}, []);

// In component
const { globalState, updateGlobalState } = useGlobalContext();
```
**What it does**: Manages app-wide state that needs to be shared across components.
**React Native Perspective**: 
- **Context**: Global state sharing
- **useCallback**: Optimize function references
- **Partial Types**: Type-safe partial updates
- **State Merging**: Combine old and new state

### 3. **State Persistence**
```typescript
const [persistedState, setPersistedState] = useState<PersistedStateType>(initialState);

useEffect(() => {
  const loadPersistedState = async () => {
    try {
      const saved = await AsyncStorage.getItem('persistedState');
      if (saved) {
        setPersistedState(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load persisted state:', error);
    }
  };
  loadPersistedState();
}, []);

useEffect(() => {
  const savePersistedState = async () => {
    try {
      await AsyncStorage.setItem('persistedState', JSON.stringify(persistedState));
    } catch (error) {
      console.error('Failed to save persisted state:', error);
    }
  };
  savePersistedState();
}, [persistedState]);
```
**What it does**: Automatically saves and loads state from local storage.
**React Native Perspective**: 
- **AsyncStorage**: Local storage for React Native
- **JSON Serialization**: Convert objects to strings
- **Error Handling**: Handle storage failures
- **Automatic Persistence**: Save on state changes

### 4. **State Synchronization**
```typescript
const [localState, setLocalState] = useState<LocalStateType>(initialState);
const [serverState, setServerState] = useState<ServerStateType>(initialState);
const [isSyncing, setIsSyncing] = useState(false);

useEffect(() => {
  const syncWithServer = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    try {
      const serverData = await fetchFromServer();
      setServerState(serverData);
      
      // Merge local and server state
      const mergedState = mergeStates(localState, serverData);
      setLocalState(mergedState);
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };
  
  syncWithServer();
}, [localState, isSyncing]);
```
**What it does**: Keeps local and server state in sync.
**React Native Perspective**: 
- **State Synchronization**: Keep multiple state sources in sync
- **Conflict Resolution**: Handle state conflicts
- **Sync Lock**: Prevent concurrent syncs
- **Error Handling**: Handle sync failures

## Common State Management Patterns

### 1. **Loading States**
```typescript
const [isLoading, setIsLoading] = useState(false);
const [isRefreshing, setIsRefreshing] = useState(false);
const [isSubmitting, setIsSubmitting] = useState(false);

const handleRefresh = async () => {
  setIsRefreshing(true);
  try {
    await refreshData();
  } finally {
    setIsRefreshing(false);
  }
};
```
**What it does**: Provides user feedback during async operations.
**React Native Perspective**: 
- **Loading Indicators**: Show progress to users
- **Different Loading States**: Various types of loading
- **User Feedback**: Clear indication of app state

### 2. **Error States**
```typescript
const [error, setError] = useState<string | null>(null);
const [retryCount, setRetryCount] = useState(0);

const handleRetry = () => {
  setError(null);
  setRetryCount(prev => prev + 1);
  // Retry logic
};

const handleError = (err: Error) => {
  setError(err.message);
  setRetryCount(prev => prev + 1);
};
```
**What it does**: Manages error states and retry logic.
**React Native Perspective**: 
- **Error Handling**: Graceful error management
- **Retry Logic**: Allow users to retry failed operations
- **Error Display**: Show errors to users
- **Error Recovery**: Recover from errors

### 3. **Optimistic Updates**
```typescript
const [data, setData] = useState<DataType[]>([]);
const [pendingUpdates, setPendingUpdates] = useState<Set<string>>(new Set());

const handleUpdate = async (id: string, updates: Partial<DataType>) => {
  // Optimistic update
  setData(prev => prev.map(item => 
    item.id === id ? { ...item, ...updates } : item
  ));
  setPendingUpdates(prev => new Set(prev).add(id));
  
  try {
    await updateOnServer(id, updates);
    setPendingUpdates(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  } catch (error) {
    // Revert optimistic update
    setData(prev => prev.map(item => 
      item.id === id ? { ...item, ...originalData } : item
    ));
    setPendingUpdates(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  }
};
```
**What it does**: Updates UI immediately, then syncs with server.
**React Native Perspective**: 
- **Optimistic Updates**: Update UI before server response
- **Error Recovery**: Revert changes on failure
- **Pending State**: Track pending updates
- **User Experience**: Immediate feedback

### 4. **State Normalization**
```typescript
interface NormalizedState {
  entities: {
    [id: string]: EntityType;
  };
  ids: string[];
  loading: boolean;
  error: string | null;
}

const [state, setState] = useState<NormalizedState>({
  entities: {},
  ids: [],
  loading: false,
  error: null,
});

const addEntity = (entity: EntityType) => {
  setState(prev => ({
    ...prev,
    entities: {
      ...prev.entities,
      [entity.id]: entity,
    },
    ids: [...prev.ids, entity.id],
  }));
};

const updateEntity = (id: string, updates: Partial<EntityType>) => {
  setState(prev => ({
    ...prev,
    entities: {
      ...prev.entities,
      [id]: { ...prev.entities[id], ...updates },
    },
  }));
};
```
**What it does**: Normalizes state structure for efficient updates.
**React Native Perspective**: 
- **Normalized State**: Flat state structure
- **Efficient Updates**: Update specific entities
- **ID-based Lookups**: Fast entity access
- **State Consistency**: Maintain data integrity

## Best Practices for State Management

### 1. **State Structure**
- Keep state flat and normalized
- Use TypeScript for type safety
- Separate local and global state
- Use meaningful state names

### 2. **State Updates**
- Use functional updates for state
- Avoid direct state mutation
- Use useCallback for stable references
- Use useMemo for expensive calculations

### 3. **Error Handling**
- Always handle errors gracefully
- Provide user feedback for errors
- Implement retry mechanisms
- Log errors for debugging

### 4. **Performance**
- Use useMemo for expensive calculations
- Use useCallback for stable function references
- Avoid unnecessary re-renders
- Use React.memo for component optimization

### 5. **Testing**
- Test state updates
- Test error scenarios
- Test loading states
- Test state persistence

## Next Steps

Now that you understand state management, the next documentation will cover:

1. **Database Operations** - SQLite and data persistence
2. **Utilities and Helpers** - Supporting functions
3. **Best Practices** - React Native development guidelines
4. **Recipes and Patterns** - Common development solutions
5. **Testing Strategies** - How to test your React Native app

Each section will include detailed explanations of React Native concepts and how they're implemented in your app.

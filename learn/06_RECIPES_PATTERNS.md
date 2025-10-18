# Pursadari App - Recipes and Common Patterns Documentation

## Overview of React Native Patterns

This document covers common React Native patterns and recipes used throughout your Pursadari app. These patterns are reusable solutions to common problems in React Native development.

### React Native Perspective
React Native patterns are:
- **Reusable Solutions** - Common problems with proven solutions
- **Best Practices** - Industry-standard approaches
- **Performance Optimizations** - Efficient ways to handle common tasks
- **Code Organization** - How to structure React Native code
- **User Experience** - Patterns that improve app usability

## Navigation Patterns

### 1. **Type-Safe Navigation**
```typescript
// Define navigation types
export type RootStackParamList = {
  Tabs: undefined;
  Masaib: { masaib: string };
  Poet: { poet: string };
  Reciter: { reciter: string };
  Kalaam: { id: number };
};

export type TabParamList = {
  Home: undefined;
  Search: undefined;
  AddLyrics: undefined;
  Favourites: undefined;
  Settings: undefined;
};

// Use in components
const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
const route = useRoute<RouteProp<RootStackParamList, 'Kalaam'>>();

// Navigate with type safety
navigation.navigate('Kalaam', { id: 123 });
```
**What it does**: Provides type safety for navigation parameters.
**React Native Perspective**: 
- **TypeScript**: Compile-time type checking
- **Navigation Types**: Define parameter shapes
- **Type Safety**: Prevent runtime errors
- **IDE Support**: Autocomplete and error detection

### 2. **Nested Navigation**
```typescript
// Stack Navigator inside Tab Navigator
<Tab.Screen
  name="Home"
  children={() => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={HomeScreen} />
      <Stack.Screen name="Masaib" component={ContentListScreen} />
      <Stack.Screen name="Poet" component={ContentListScreen} />
      <Stack.Screen name="Reciter" component={ContentListScreen} />
      <Stack.Screen name="Kalaam" component={KalaamScreen} />
    </Stack.Navigator>
  )}
/>
```
**What it does**: Creates hierarchical navigation structure.
**React Native Perspective**: 
- **Nested Navigators**: Multiple navigation levels
- **Screen Composition**: Combine different navigators
- **Navigation Flow**: Logical screen hierarchy
- **User Experience**: Intuitive navigation

### 3. **Navigation Props Pattern**
```typescript
// Screen component with navigation props
interface ScreenProps {
  navigation: StackNavigationProp<RootStackParamList>;
  route: RouteProp<RootStackParamList, 'ScreenName'>;
}

export default function ScreenComponent({ navigation, route }: ScreenProps) {
  const { param1, param2 } = route.params;
  
  const handleNavigate = () => {
    navigation.navigate('NextScreen', { data: 'value' });
  };
  
  return (
    <View>
      <TouchableOpacity onPress={handleNavigate}>
        <Text>Navigate</Text>
      </TouchableOpacity>
    </View>
  );
}
```
**What it does**: Standardizes how screens receive navigation props.
**React Native Perspective**: 
- **Props Interface**: Type-safe component props
- **Route Params**: Access navigation parameters
- **Navigation Methods**: Use navigation functions
- **Type Safety**: Compile-time parameter checking

## State Management Patterns

### 1. **Custom Hooks Pattern**
```typescript
// Custom hook for data fetching
function useKalaamData(id: number) {
  const [kalaam, setKalaam] = useState<Kalaam | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchKalaam = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await database.getKalaamById(id);
        setKalaam(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchKalaam();
  }, [id]);

  return { kalaam, loading, error };
}

// Use in component
function KalaamScreen({ route }: ScreenProps) {
  const { id } = route.params;
  const { kalaam, loading, error } = useKalaamData(id);
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!kalaam) return <NotFoundMessage />;
  
  return <KalaamContent kalaam={kalaam} />;
}
```
**What it does**: Encapsulates data fetching logic in reusable hooks.
**React Native Perspective**: 
- **Custom Hooks**: Reusable state logic
- **Data Fetching**: Async operations
- **Error Handling**: Graceful error management
- **Loading States**: User feedback
- **Reusability**: Use across multiple components

### 2. **Context Provider Pattern**
```typescript
// Context definition
interface AppContextType {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  user: User | null;
  setUser: (user: User | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [user, setUser] = useState<User | null>(null);

  const value = useMemo(() => ({
    theme,
    setTheme,
    user,
    setUser,
  }), [theme, user]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

// Custom hook for context
export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}
```
**What it does**: Provides global state management with type safety.
**React Native Perspective**: 
- **Context API**: Global state sharing
- **Provider Pattern**: Wrap app with context
- **Custom Hooks**: Easy context access
- **Type Safety**: TypeScript for context
- **Error Boundaries**: Handle context errors

### 3. **State Persistence Pattern**
```typescript
// Custom hook for persistent state
function usePersistentState<T>(
  key: string,
  defaultValue: T
): [T, (value: T) => void] {
  const [state, setState] = useState<T>(defaultValue);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadState = async () => {
      try {
        const saved = await AsyncStorage.getItem(key);
        if (saved !== null) {
          setState(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Failed to load state:', error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadState();
  }, [key]);

  useEffect(() => {
    if (isLoaded) {
      const saveState = async () => {
        try {
          await AsyncStorage.setItem(key, JSON.stringify(state));
        } catch (error) {
          console.error('Failed to save state:', error);
        }
      };
      saveState();
    }
  }, [key, state, isLoaded]);

  return [state, setState];
}

// Use in component
function SettingsScreen() {
  const [theme, setTheme] = usePersistentState('theme', 'light');
  const [fontSize, setFontSize] = usePersistentState('fontSize', 16);
  
  return (
    <View>
      <Text>Theme: {theme}</Text>
      <Text>Font Size: {fontSize}</Text>
    </View>
  );
}
```
**What it does**: Automatically persists state to local storage.
**React Native Perspective**: 
- **AsyncStorage**: Local storage for React Native
- **JSON Serialization**: Convert objects to strings
- **Automatic Persistence**: Save on state changes
- **Error Handling**: Handle storage failures
- **Loading States**: Wait for state to load

## UI Patterns

### 1. **Loading States Pattern**
```typescript
// Loading component
function LoadingSpinner({ size = 'large', color = '#16a34a' }: {
  size?: 'small' | 'large';
  color?: string;
}) {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size={size} color={color} />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
}

// Error component
function ErrorMessage({ error, onRetry }: {
  error: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.errorContainer}>
      <MaterialCommunityIcons name="alert-circle" size={48} color="#ef4444" />
      <Text style={styles.errorText}>{error}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// Empty state component
function EmptyState({ message, icon = 'database-off' }: {
  message: string;
  icon?: string;
}) {
  return (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name={icon} size={64} color="#9ca3af" />
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

// Use in screen
function DataScreen() {
  const [data, setData] = useState<DataType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} onRetry={handleRetry} />;
  if (data.length === 0) return <EmptyState message="No data available" />;
  
  return <DataList data={data} />;
}
```
**What it does**: Provides consistent loading, error, and empty states.
**React Native Perspective**: 
- **Loading States**: Show progress to users
- **Error Handling**: Graceful error display
- **Empty States**: Handle no data scenarios
- **User Feedback**: Clear indication of app state
- **Reusability**: Consistent UI across app

### 2. **List Rendering Pattern**
```typescript
// Optimized list component
function OptimizedList({ data, renderItem, onEndReached }: {
  data: any[];
  renderItem: ({ item }: { item: any }) => React.ReactElement;
  onEndReached?: () => void;
}) {
  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderItem}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      showsVerticalScrollIndicator={false}
      windowSize={10}
      initialNumToRender={20}
      maxToRenderPerBatch={20}
      updateCellsBatchingPeriod={50}
      removeClippedSubviews
      ListEmptyComponent={<EmptyState message="No items found" />}
      ListFooterComponent={loading ? <LoadingSpinner size="small" /> : null}
    />
  );
}

// List item component
function ListItem({ item, onPress }: {
  item: DataType;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.listItem} onPress={onPress}>
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color="#9ca3af" />
    </TouchableOpacity>
  );
}

// Use in screen
function DataListScreen() {
  const [data, setData] = useState<DataType[]>([]);
  const [loading, setLoading] = useState(false);

  const handleLoadMore = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const moreData = await fetchMoreData();
      setData(prev => [...prev, ...moreData]);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: DataType }) => (
    <ListItem item={item} onPress={() => handleItemPress(item)} />
  );

  return (
    <OptimizedList
      data={data}
      renderItem={renderItem}
      onEndReached={handleLoadMore}
    />
  );
}
```
**What it does**: Provides efficient list rendering with performance optimizations.
**React Native Perspective**: 
- **FlatList**: Optimized list component
- **Performance Props**: Optimize for large lists
- **Infinite Scroll**: Load more data on scroll
- **Memory Management**: Remove clipped subviews
- **Reusable Components**: Consistent list items

### 3. **Form Handling Pattern**
```typescript
// Form hook
function useForm<T extends Record<string, any>>(initialValues: T) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const setValue = (name: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const setTouched = (name: keyof T) => {
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const validate = (validationRules: ValidationRules<T>) => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    
    Object.keys(validationRules).forEach(key => {
      const rule = validationRules[key as keyof T];
      const value = values[key as keyof T];
      
      if (rule.required && (!value || value.toString().trim() === '')) {
        newErrors[key as keyof T] = rule.required;
      } else if (rule.pattern && !rule.pattern.test(value)) {
        newErrors[key as keyof T] = rule.pattern.message;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  };

  return {
    values,
    errors,
    touched,
    setValue,
    setTouched,
    validate,
    reset,
  };
}

// Form component
function FormScreen() {
  const { values, errors, touched, setValue, setTouched, validate, reset } = useForm({
    title: '',
    description: '',
    email: '',
  });

  const validationRules = {
    title: { required: 'Title is required' },
    description: { required: 'Description is required' },
    email: { 
      required: 'Email is required',
      pattern: { 
        test: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Invalid email format'
      }
    },
  };

  const handleSubmit = () => {
    if (validate(validationRules)) {
      // Submit form
      console.log('Form submitted:', values);
    }
  };

  return (
    <View style={styles.formContainer}>
      <TextInput
        style={[styles.input, errors.title && styles.inputError]}
        value={values.title}
        onChangeText={(text) => setValue('title', text)}
        onBlur={() => setTouched('title')}
        placeholder="Title"
      />
      {touched.title && errors.title && (
        <Text style={styles.errorText}>{errors.title}</Text>
      )}
      
      <TextInput
        style={[styles.input, errors.description && styles.inputError]}
        value={values.description}
        onChangeText={(text) => setValue('description', text)}
        onBlur={() => setTouched('description')}
        placeholder="Description"
        multiline
      />
      {touched.description && errors.description && (
        <Text style={styles.errorText}>{errors.description}</Text>
      )}
      
      <TextInput
        style={[styles.input, errors.email && styles.inputError]}
        value={values.email}
        onChangeText={(text) => setValue('email', text)}
        onBlur={() => setTouched('email')}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      {touched.email && errors.email && (
        <Text style={styles.errorText}>{errors.email}</Text>
      )}
      
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Submit</Text>
      </TouchableOpacity>
    </View>
  );
}
```
**What it does**: Provides comprehensive form handling with validation.
**React Native Perspective**: 
- **Form State**: Manage form values and errors
- **Validation**: Client-side validation
- **User Experience**: Real-time error feedback
- **Type Safety**: TypeScript for form data
- **Reusability**: Custom hook for forms

## Performance Patterns

### 1. **Memoization Pattern**
```typescript
// Memoized component
const MemoizedListItem = React.memo(({ item, onPress }: {
  item: DataType;
  onPress: () => void;
}) => {
  return (
    <TouchableOpacity style={styles.listItem} onPress={onPress}>
      <Text style={styles.itemTitle}>{item.title}</Text>
    </TouchableOpacity>
  );
});

// Memoized calculations
function ExpensiveComponent({ data }: { data: DataType[] }) {
  const expensiveValue = useMemo(() => {
    return data.reduce((sum, item) => sum + item.value, 0);
  }, [data]);

  const handlePress = useCallback((id: string) => {
    // Handle press
  }, []);

  return (
    <View>
      <Text>Total: {expensiveValue}</Text>
      {data.map(item => (
        <MemoizedListItem
          key={item.id}
          item={item}
          onPress={() => handlePress(item.id)}
        />
      ))}
    </View>
  );
}
```
**What it does**: Optimizes performance by preventing unnecessary re-renders.
**React Native Perspective**: 
- **React.memo**: Memoize component renders
- **useMemo**: Memoize expensive calculations
- **useCallback**: Memoize function references
- **Performance**: Prevent unnecessary re-renders

### 2. **Lazy Loading Pattern**
```typescript
// Lazy component loading
const LazyScreen = React.lazy(() => import('./LazyScreen'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <LazyScreen />
    </Suspense>
  );
}

// Lazy data loading
function useLazyData<T>(
  fetchFn: () => Promise<T>,
  deps: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { data, loading, error, refetch: loadData };
}
```
**What it does**: Loads components and data only when needed.
**React Native Perspective**: 
- **React.lazy**: Lazy component loading
- **Suspense**: Handle loading states
- **Code Splitting**: Reduce initial bundle size
- **Performance**: Load only what's needed

### 3. **Debouncing Pattern**
```typescript
// Debounced search hook
function useDebouncedSearch<T>(
  searchFn: (query: string) => Promise<T[]>,
  delay: number = 300
) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearch = useMemo(
    () => debounce(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const searchResults = await searchFn(searchQuery);
        setResults(searchResults);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
      } finally {
        setLoading(false);
      }
    }, delay),
    [searchFn, delay]
  );

  useEffect(() => {
    debouncedSearch(query);
    return () => {
      debouncedSearch.cancel();
    };
  }, [query, debouncedSearch]);

  return {
    query,
    setQuery,
    results,
    loading,
    error,
  };
}

// Debounce utility
function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T & { cancel: () => void } {
  let timeoutId: NodeJS.Timeout;
  
  const debounced = ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T & { cancel: () => void };
  
  debounced.cancel = () => {
    clearTimeout(timeoutId);
  };
  
  return debounced;
}
```
**What it does**: Prevents excessive API calls during user input.
**React Native Perspective**: 
- **Debouncing**: Delay function execution
- **Performance**: Reduce unnecessary operations
- **User Experience**: Smooth search experience
- **Memory Management**: Clean up timeouts

## Error Handling Patterns

### 1. **Error Boundary Pattern**
```typescript
// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Log to crash reporting service
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={64} color="#ef4444" />
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => this.setState({ hasError: false, error: undefined })}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

// Use in app
function App() {
  return (
    <ErrorBoundary>
      <NavigationContainer>
        <TabNavigator />
      </NavigationContainer>
    </ErrorBoundary>
  );
}
```
**What it does**: Catches JavaScript errors anywhere in the component tree.
**React Native Perspective**: 
- **Error Boundaries**: Catch component errors
- **Error Recovery**: Allow users to retry
- **Error Logging**: Track errors for debugging
- **User Experience**: Graceful error handling

### 2. **Async Error Handling**
```typescript
// Async error handling hook
function useAsyncError() {
  const [error, setError] = useState<Error | null>(null);

  const handleAsyncError = useCallback((error: Error) => {
    setError(error);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { error, handleAsyncError, clearError };
}

// Async operation with error handling
function useAsyncOperation<T>(
  operation: () => Promise<T>,
  deps: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await operation();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    execute();
  }, [execute]);

  return { data, loading, error, retry: execute };
}
```
**What it does**: Provides consistent error handling for async operations.
**React Native Perspective**: 
- **Async Operations**: Handle promise rejections
- **Error States**: Track error state
- **Retry Logic**: Allow users to retry
- **User Feedback**: Show error messages

## Testing Patterns

### 1. **Component Testing**
```typescript
// Component test
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { KalaamScreen } from '../KalaamScreen';

describe('KalaamScreen', () => {
  it('renders kalaam content correctly', async () => {
    const mockKalaam = {
      id: 1,
      title: 'Test Kalaam',
      lyrics_urdu: 'Test lyrics',
      lyrics_eng: 'Test lyrics in English',
    };

    const { getByText } = render(
      <KalaamScreen route={{ params: { id: 1 } }} />
    );

    await waitFor(() => {
      expect(getByText('Test Kalaam')).toBeTruthy();
    });
  });

  it('handles favorite toggle', async () => {
    const { getByTestId } = render(
      <KalaamScreen route={{ params: { id: 1 } }} />
    );

    const favoriteButton = getByTestId('favorite-button');
    fireEvent.press(favoriteButton);

    await waitFor(() => {
      expect(getByTestId('favorite-button')).toHaveStyle({ color: '#16a34a' });
    });
  });
});
```
**What it does**: Tests component behavior and user interactions.
**React Native Perspective**: 
- **Component Testing**: Test component rendering
- **User Interactions**: Test touch events
- **Async Operations**: Wait for async updates
- **Assertions**: Verify expected behavior

### 2. **Hook Testing**
```typescript
// Hook test
import { renderHook, act } from '@testing-library/react-hooks';
import { useKalaamData } from '../useKalaamData';

describe('useKalaamData', () => {
  it('fetches kalaam data successfully', async () => {
    const { result } = renderHook(() => useKalaamData(1));

    await act(async () => {
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.kalaam).toBeTruthy();
        expect(result.current.error).toBeNull();
      });
    });
  });

  it('handles fetch error', async () => {
    // Mock database to throw error
    jest.spyOn(database, 'getKalaamById').mockRejectedValue(new Error('Database error'));

    const { result } = renderHook(() => useKalaamData(1));

    await act(async () => {
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.kalaam).toBeNull();
        expect(result.current.error).toBe('Database error');
      });
    });
  });
});
```
**What it does**: Tests custom hooks in isolation.
**React Native Perspective**: 
- **Hook Testing**: Test custom hooks
- **Async Testing**: Handle async operations
- **Mocking**: Mock dependencies
- **State Testing**: Verify hook state

## Best Practices Summary

### 1. **Code Organization**
- Use TypeScript for type safety
- Organize code by feature or type
- Use custom hooks for reusable logic
- Keep components small and focused

### 2. **Performance**
- Use React.memo for expensive components
- Use useMemo for expensive calculations
- Use useCallback for stable function references
- Optimize list rendering with FlatList

### 3. **Error Handling**
- Use error boundaries for component errors
- Handle async operation errors
- Provide user feedback for errors
- Implement retry mechanisms

### 4. **Testing**
- Test component behavior
- Test user interactions
- Test async operations
- Mock external dependencies

### 5. **User Experience**
- Provide loading states
- Handle empty states
- Show error messages
- Implement smooth animations

## Next Steps

Now that you understand the common patterns and recipes, you have a comprehensive understanding of your React Native app. The documentation covers:

1. **App Overview** - High-level architecture
2. **Folder Structure** - Code organization
3. **Main Files** - Core app files
4. **Screen Components** - UI screens
5. **Service Layer** - Business logic
6. **Context and State** - State management
7. **Recipes and Patterns** - Common solutions

You now have the knowledge to:
- Understand how your app works
- Learn React Native concepts through your code
- Apply patterns to new features
- Debug and maintain your app
- Extend functionality with confidence

Each pattern and recipe in this documentation is based on real React Native best practices and is used throughout your Pursadari app. You can use these patterns as templates for building new features and improving existing ones.

# Pursadari App - Screen Components Documentation

## Overview of Screen Components

Screen components are the main pages of your React Native app. Each screen represents a different view that users can navigate to. They're like pages in a web app, but optimized for mobile devices.

### React Native Perspective
In React Native, screens are:
- **Full-screen components** that take up the entire screen
- **Navigation destinations** that users can navigate to
- **Stateful components** that manage their own data
- **Interactive interfaces** that respond to user input

## HomeScreen.tsx - The Main Browse Screen

### Purpose
`HomeScreen.tsx` is the main browsing screen where users can explore content by categories (Masaib, Poet, Reciter). It's like a homepage that shows different ways to browse content.

### React Native Perspective
This screen demonstrates several key React Native concepts:
- **Complex State Management** - Multiple pieces of state
- **Navigation Integration** - Moving between screens
- **Gesture Handling** - Swipe gestures for tab switching
- **Animation** - Smooth transitions and effects
- **Performance Optimization** - Efficient list rendering

### Key React Native Concepts Used

#### 1. **State Management**
```typescript
const [browseCategory, setBrowseCategory] = useState<BrowseCategory>('masaib');
const [masaibGroups, setMasaibGroups] = useState<MasaibGroup[] | null>(null);
const [poetGroups, setPoetGroups] = useState<PoetGroup[] | null>(null);
const [reciterGroups, setReciterGroups] = useState<ReciterGroup[] | null>(null);
```
**What it does**: Manages different types of data for the screen.
**React Native Perspective**: 
- **useState**: Local component state
- **TypeScript**: Type safety for state
- **Null States**: Handling loading states

#### 2. **Navigation Integration**
```typescript
const navigation = useNavigation<HomeScreenNavigationProp>();
```
**What it does**: Provides navigation functionality to move between screens.
**React Native Perspective**: 
- **useNavigation**: Hook to access navigation
- **TypeScript**: Type-safe navigation
- **Navigation Props**: Data passed between screens

#### 3. **Gesture Handling**
```typescript
const onSwipeGesture = (event: any) => {
  const { translationX, state } = event.nativeEvent;
  
  if (state === State.END) {
    const threshold = 50;
    
    if (translationX > threshold) {
      // Swipe right - go to previous tab
      switchToTab(currentTabIndex.current - 1);
    } else if (translationX < -threshold) {
      // Swipe left - go to next tab
      switchToTab(currentTabIndex.current + 1);
    }
  }
};
```
**What it does**: Handles swipe gestures to switch between tabs.
**React Native Perspective**: 
- **PanGestureHandler**: Detects touch gestures
- **Gesture State**: Different phases of gestures
- **Threshold**: Minimum distance for action
- **Native Events**: Access to gesture data

#### 4. **Animation**
```typescript
const tabAnimation = useRef(new Animated.Value(0)).current;

const switchToTab = (newIndex: number) => {
  Animated.timing(tabAnimation, {
    toValue: newIndex,
    duration: 300,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: false,
  }).start();
};
```
**What it does**: Creates smooth animations for tab switching.
**React Native Perspective**: 
- **Animated.Value**: Animated values for smooth transitions
- **useRef**: Persistent values across renders
- **Animated.timing**: Time-based animations
- **Easing**: Animation curves for natural feel

#### 5. **Performance Optimization**
```typescript
const displayedItems = useMemo(() => {
  const src = items || [];
  const q = searchQuery.trim().toLowerCase();
  if (!searchOpen || q.length === 0) return src;
  return src.filter((it: any) => labelForItem(it).toLowerCase().includes(q));
}, [items, searchOpen, searchQuery, browseCategory]);
```
**What it does**: Optimizes list filtering to prevent unnecessary re-renders.
**React Native Perspective**: 
- **useMemo**: Memoizes expensive calculations
- **Dependency Array**: Re-runs when dependencies change
- **Performance**: Prevents unnecessary re-renders

#### 6. **List Rendering**
```typescript
<AFlatList
  data={displayedItems}
  keyExtractor={(it, idx) => (it.masaib ?? it.poet ?? it.reciter ?? idx).toString()}
  renderItem={renderItem}
  contentContainerStyle={styles.listContainer}
  showsVerticalScrollIndicator={false}
  windowSize={7}
  initialNumToRender={20}
  maxToRenderPerBatch={20}
  updateCellsBatchingPeriod={50}
  removeClippedSubviews
/>
```
**What it does**: Efficiently renders large lists of items.
**React Native Perspective**: 
- **FlatList**: Optimized list component
- **keyExtractor**: Unique keys for list items
- **renderItem**: Function to render each item
- **Performance Props**: Optimize for large lists
- **removeClippedSubviews**: Better memory usage

### Key Patterns Used

#### 1. **Custom Hooks Pattern**
```typescript
const t = useThemeTokens();
const { accentColor } = useSettings();
```
**What it does**: Uses custom hooks for theme and settings.
**React Native Perspective**: Custom hooks encapsulate reusable logic.

#### 2. **Component Composition**
```typescript
function PressableCard({ children, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity onPress={onPress}>
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}
```
**What it does**: Creates reusable animated components.
**React Native Perspective**: Composition over inheritance.

#### 3. **Error Handling**
```typescript
try {
  const [m, p, r] = await Promise.all([
    database.getMasaibGroups(),
    database.getPoetGroups(),
    database.getReciterGroups(),
  ]);
  setMasaibGroups(m);
  setPoetGroups(p);
  setReciterGroups(r);
} catch (e) {
  console.error('Home init load failed', e);
  setMasaibGroups([]);
  setPoetGroups([]);
  setReciterGroups([]);
}
```
**What it does**: Handles database errors gracefully.
**React Native Perspective**: Try-catch for async operations.

## SearchScreen.tsx - The Search Interface

### Purpose
`SearchScreen.tsx` provides a powerful search interface for finding content. It includes advanced features like streaming results and Roman Urdu support.

### React Native Perspective
This screen demonstrates:
- **Real-time Search** - Search as you type
- **Debouncing** - Preventing excessive API calls
- **Streaming Results** - Progressive result display
- **Text Input Handling** - Managing user input
- **Performance Optimization** - Efficient search operations

### Key React Native Concepts Used

#### 1. **Debounced Search**
```typescript
const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

const onChange = (text: string) => {
  setQuery(text);
  if (timerRef.current) clearTimeout(timerRef.current);
  timerRef.current = setTimeout(() => runSearch(text), 250);
};
```
**What it does**: Prevents excessive search calls while typing.
**React Native Perspective**: 
- **useRef**: Persistent values across renders
- **setTimeout**: Delays function execution
- **clearTimeout**: Cancels previous timeouts
- **Debouncing**: Performance optimization technique

#### 2. **Request Cancellation**
```typescript
const reqIdRef = useRef(0);

const runSearch = async (q: string) => {
  const myReq = ++reqIdRef.current;
  setLoading(true);

  try {
    const res = await database.searchKalaams(qTrim, 1, 100);
    
    if (reqIdRef.current !== myReq) return; // Request was cancelled
    // ... process results
  } catch (e) {
    if (reqIdRef.current === myReq) {
      // Handle error only for current request
    }
  }
};
```
**What it does**: Cancels outdated search requests.
**React Native Perspective**: 
- **Request IDs**: Track active requests
- **Cancellation**: Prevent stale results
- **Race Conditions**: Handle concurrent requests

#### 3. **Streaming Results**
```typescript
const [streamingResults, setStreamingResults] = useState<Kalaam[]>([]);

// Simulate streaming by showing results progressively
const allResults = res.kalaams;
const batchSize = 3; // Show 3 results at a time

for (let i = 0; i <= allResults.length; i += batchSize) {
  if (reqIdRef.current !== myReq) break;
  
  const currentBatch = allResults.slice(0, i + batchSize);
  setStreamingResults([...currentBatch]);
  
  if (i + batchSize < allResults.length) {
    await new Promise(resolve => setTimeout(resolve, 30));
  }
}
```
**What it does**: Shows search results progressively for better UX.
**React Native Perspective**: 
- **Progressive Loading**: Better perceived performance
- **setTimeout**: Delays between batches
- **State Updates**: Multiple state updates for smooth experience

#### 4. **Text Input Handling**
```typescript
<TextInput
  placeholder="Search titles, lyrics, or any text..."
  style={[styles.input, { color: t.textPrimary, backgroundColor: t.surface }]}
  value={query}
  onChangeText={onChange}
  onSubmitEditing={onSearchPress}
  returnKeyType="search"
  placeholderTextColor={t.textMuted}
  selectionColor={accentColor}
/>
```
**What it does**: Handles user text input with proper styling.
**React Native Perspective**: 
- **TextInput**: Native text input component
- **onChangeText**: Text change handler
- **onSubmitEditing**: Enter key handler
- **returnKeyType**: Keyboard button type
- **selectionColor**: Text selection color

#### 5. **Roman Urdu Normalization**
```typescript
const normalizeRomanUrduQuery = (input: string): string => {
  const VOWELS = 'aeiou';
  
  // Word-level canonicalizations for ultra-common tokens
  const WORD_EQUIV: Array<[RegExp, string]> = [
    [/\b(main|mein|mei|mn)\b/g, 'mai'],
    [/\b(nahin|nahi|nahee|nai)\b/g, 'nahi'],
    // ... more rules
  ];
  
  // Character/digraph rules
  const SEQ_RULES: Array<[RegExp, string]> = [
    [/kh/g, 'x'],
    [/gh/g, 'g'],
    [/q/g, 'k'],
    // ... more rules
  ];
  
  let s = input.toLowerCase().trim();
  for (const [pat, repl] of WORD_EQUIV) s = s.replace(pat, repl);
  for (const [pat, repl] of SEQ_RULES) s = s.replace(pat, repl);
  
  return s;
};
```
**What it does**: Normalizes Roman Urdu text for better search results.
**React Native Perspective**: 
- **String Processing**: Text normalization
- **Regular Expressions**: Pattern matching
- **Functional Programming**: Pure functions
- **Search Optimization**: Better search results

### Key Patterns Used

#### 1. **Custom Search Logic**
- Roman Urdu normalization
- Debounced input handling
- Request cancellation
- Streaming results

#### 2. **Performance Optimization**
- useMemo for expensive calculations
- Request cancellation
- Debounced search
- Efficient list rendering

#### 3. **User Experience**
- Loading states
- Progressive results
- Error handling
- Search guidance

## ContentListScreen.tsx - Category Content Display

### Purpose
`ContentListScreen.tsx` displays content filtered by category (Masaib, Poet, Reciter). It's a reusable screen that shows different types of content lists.

### React Native Perspective
This screen demonstrates:
- **Reusable Components** - Same screen for different content types
- **Navigation Props** - Receiving data from navigation
- **List Rendering** - Efficient content display
- **Pagination** - Handling large datasets
- **Loading States** - User feedback during data loading

### Key React Native Concepts Used

#### 1. **Navigation Props**
```typescript
type ContentListScreenProps = {
  route: {
    params: {
      masaib?: string;
      poet?: string;
      reciter?: string;
    };
  };
};

export default function ContentListScreen({ route }: ContentListScreenProps) {
  const { masaib, poet, reciter } = route.params;
  // ... use params to determine content type
}
```
**What it does**: Receives data from navigation to determine what content to show.
**React Native Perspective**: 
- **Route Params**: Data passed between screens
- **TypeScript**: Type safety for navigation
- **Props**: Data passed to components

#### 2. **Conditional Content Loading**
```typescript
useEffect(() => {
  const loadContent = async () => {
    if (masaib) {
      const result = await database.getKalaamsByMasaib(masaib, page, limit);
      setContent(result.kalaams);
    } else if (poet) {
      const result = await database.getKalaamsByPoet(poet, page, limit);
      setContent(result.kalaams);
    } else if (reciter) {
      const result = await database.getKalaamsByReciter(reciter, page, limit);
      setContent(result.kalaams);
    }
  };
  
  loadContent();
}, [masaib, poet, reciter, page]);
```
**What it does**: Loads different content based on navigation parameters.
**React Native Perspective**: 
- **useEffect**: Runs when dependencies change
- **Conditional Logic**: Different behavior based on props
- **Async Operations**: Database calls

#### 3. **Pagination**
```typescript
const [page, setPage] = useState(1);
const [limit] = useState(50);
const [hasMore, setHasMore] = useState(true);

const loadMore = async () => {
  if (!hasMore || loading) return;
  
  setLoading(true);
  const nextPage = page + 1;
  
  try {
    const result = await database.getKalaamsByMasaib(masaib, nextPage, limit);
    if (result.kalaams.length === 0) {
      setHasMore(false);
    } else {
      setContent(prev => [...prev, ...result.kalaams]);
      setPage(nextPage);
    }
  } catch (error) {
    console.error('Error loading more content:', error);
  } finally {
    setLoading(false);
  }
};
```
**What it does**: Loads more content when user scrolls to bottom.
**React Native Perspective**: 
- **Infinite Scroll**: Load more content as needed
- **State Management**: Track pagination state
- **Performance**: Only load what's needed

#### 4. **List Rendering with Performance**
```typescript
<FlatList
  data={content}
  keyExtractor={(item) => item.id.toString()}
  renderItem={renderItem}
  onEndReached={loadMore}
  onEndReachedThreshold={0.5}
  ListFooterComponent={loading ? <ActivityIndicator /> : null}
  showsVerticalScrollIndicator={false}
  windowSize={10}
  initialNumToRender={20}
  maxToRenderPerBatch={20}
  updateCellsBatchingPeriod={50}
  removeClippedSubviews
/>
```
**What it does**: Efficiently renders large lists with pagination.
**React Native Perspective**: 
- **FlatList**: Optimized list component
- **onEndReached**: Trigger when reaching end
- **Performance Props**: Optimize for large lists
- **Loading States**: Show loading indicators

### Key Patterns Used

#### 1. **Reusable Screen Pattern**
- Same screen for different content types
- Navigation props determine behavior
- Conditional logic based on props

#### 2. **Pagination Pattern**
- Load content in batches
- Track pagination state
- Handle loading states
- Optimize performance

#### 3. **Error Handling**
- Try-catch for async operations
- Graceful error handling
- User feedback for errors

## KalaamScreen.tsx - Individual Content Display

### Purpose
`KalaamScreen.tsx` displays individual content items with full details, including lyrics, metadata, and YouTube integration.

### React Native Perspective
This screen demonstrates:
- **Detail Views** - Showing complete content information
- **Media Integration** - YouTube video embedding
- **Text Display** - Multi-language content
- **User Interactions** - Favorites, sharing, etc.

### Key React Native Concepts Used

#### 1. **Navigation Props**
```typescript
type KalaamScreenProps = {
  route: {
    params: {
      id: number;
    };
  };
};

export default function KalaamScreen({ route }: KalaamScreenProps) {
  const { id } = route.params;
  const [kalaam, setKalaam] = useState<Kalaam | null>(null);
  
  useEffect(() => {
    const loadKalaam = async () => {
      const result = await database.getKalaamById(id);
      setKalaam(result);
    };
    loadKalaam();
  }, [id]);
}
```
**What it does**: Loads specific content based on ID from navigation.
**React Native Perspective**: 
- **Route Params**: Data passed from navigation
- **useEffect**: Load data when component mounts
- **State Management**: Track content state

#### 2. **YouTube Integration**
```typescript
import YouTube from 'react-native-youtube-iframe';

<YouTube
  videoId={extractVideoId(kalaam.yt_link)}
  height={200}
  width="100%"
  play={false}
  onChangeState={onStateChange}
/>
```
**What it does**: Embeds YouTube videos in the app.
**React Native Perspective**: 
- **Third-party Libraries**: External functionality
- **Native Integration**: Bridge to native code
- **Media Handling**: Video playback

#### 3. **Multi-language Text Display**
```typescript
<Text style={[styles.lyrics, { fontFamily: urduFont }]}>
  {kalaam.lyrics_urdu}
</Text>
<Text style={[styles.lyrics, { fontFamily: engFont }]}>
  {kalaam.lyrics_eng}
</Text>
```
**What it does**: Displays content in multiple languages with appropriate fonts.
**React Native Perspective**: 
- **Font Management**: Custom fonts for different languages
- **Text Styling**: Consistent typography
- **Internationalization**: Multi-language support

#### 4. **User Interactions**
```typescript
const handleFavorite = async () => {
  if (isFavorite) {
    await FavoritesService.removeFavorite(kalaam.id);
  } else {
    await FavoritesService.addFavorite(kalaam.id);
  }
  setIsFavorite(!isFavorite);
};

<TouchableOpacity onPress={handleFavorite}>
  <MaterialCommunityIcons
    name={isFavorite ? "heart" : "heart-outline"}
    size={24}
    color={isFavorite ? accentColor : t.textMuted}
  />
</TouchableOpacity>
```
**What it does**: Handles user interactions like favoriting content.
**React Native Perspective**: 
- **TouchableOpacity**: Interactive elements
- **State Updates**: Update UI based on user actions
- **Async Operations**: Database updates
- **Visual Feedback**: Icons change based on state

### Key Patterns Used

#### 1. **Detail View Pattern**
- Load specific content by ID
- Display complete information
- Handle user interactions
- Media integration

#### 2. **State Management**
- Local state for content
- Loading states
- User interaction states
- Error handling

#### 3. **Performance Optimization**
- Lazy loading of content
- Efficient re-renders
- Memory management
- Smooth animations

## Common Patterns Across All Screens

### 1. **Navigation Integration**
- useNavigation hook
- Type-safe navigation
- Route parameters
- Navigation props

### 2. **State Management**
- useState for local state
- useEffect for side effects
- Custom hooks for shared logic
- Context for global state

### 3. **Performance Optimization**
- useMemo for expensive calculations
- useCallback for function memoization
- FlatList for efficient lists
- removeClippedSubviews for memory

### 4. **Error Handling**
- Try-catch for async operations
- Graceful error states
- User feedback
- Fallback UI

### 5. **User Experience**
- Loading states
- Smooth animations
- Responsive design
- Accessibility

## Next Steps

Now that you understand the screen components, the next documentation will cover:

1. **Service Layer** - Business logic and data management
2. **Database Operations** - SQLite and data persistence
3. **Context and State** - Global state management
4. **Utilities and Helpers** - Supporting functions
5. **Best Practices** - React Native development guidelines

Each section will include detailed explanations of React Native concepts and how they're implemented in your app.

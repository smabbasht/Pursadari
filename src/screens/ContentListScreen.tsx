// ContentListScreen.tsx - Unified screen for Masaib, Poet, and Reciter

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Feather from 'react-native-vector-icons/Feather';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Animated,
  Keyboard,
  FlatList,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import database from '../database/Database';
import { RootStackParamList, KalaamListResponse, Kalaam } from '../types';
import AppHeader from '../components/AppHeader';
import { useThemeTokens, useSettings } from '../context/SettingsContext';

// Screen types
type ContentType = 'masaib' | 'poet' | 'reciter';

type MasaibRoute = RouteProp<RootStackParamList, 'Masaib'>;
type PoetRoute = RouteProp<RootStackParamList, 'Poet'>;
type ReciterRoute = RouteProp<RootStackParamList, 'Reciter'>;

type ContentRoute = MasaibRoute | PoetRoute | ReciterRoute;
type Nav = StackNavigationProp<RootStackParamList>;

// Screen configuration
const SCREEN_CONFIG = {
  masaib: {
    icon: 'book-open-variant',
    title: (name: string) => name,
    subtitle: (count: number) => `${count} nohas in this category`,
    filterLabel: 'reciter',
    filterPlaceholder: 'Search reciters…',
    filterIcon: 'account-music',
    emptyMessage: 'No nohas found for this category.',
    filterEmptyMessage: 'No reciters found',
  },
  poet: {
    icon: 'feather',
    title: (name: string) => name,
    subtitle: (count: number) => `${count} nohas by this poet`,
    filterLabel: 'masaib',
    filterPlaceholder: 'Search masaib…',
    filterIcon: 'book-open-variant',
    emptyMessage: 'No nohas found for this poet.',
    filterEmptyMessage: 'No masaib found',
  },
  reciter: {
    icon: 'account-music',
    title: (name: string) => name,
    subtitle: (count: number) => `${count} nohas by this reciter`,
    filterLabel: 'masaib',
    filterPlaceholder: 'Search masaib…',
    filterIcon: 'book-open-variant',
    emptyMessage: (filter?: string) => filter 
      ? `No nohas found for this reciter in "${filter}".`
      : 'No nohas found for this reciter.',
    filterEmptyMessage: 'No masaib found',
  },
};

// Global filter persistence
const globalFilters = new Map<string, string>();

export default function ContentListScreen() {
  const t = useThemeTokens();
  const { accentColor } = useSettings();
  const route = useRoute<ContentRoute>();
  const navigation = useNavigation<Nav>();

  // Determine content type and get the name
  const contentType: ContentType = 
    'masaib' in route.params ? 'masaib' :
    'poet' in route.params ? 'poet' : 'reciter';
  
  const contentName = 
    contentType === 'masaib' ? route.params.masaib :
    contentType === 'poet' ? route.params.poet : route.params.reciter;

  const config = SCREEN_CONFIG[contentType];
  const limit = 50;

  // State
  const [kalaams, setKalaams] = useState<Kalaam[]>([]);
  const [totalKalaams, setTotalKalaams] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [nextPageLoading, setNextPageLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Filter states
  const [selectedFilter, setSelectedFilter] = useState<string | null>(
    globalFilters.get(contentName) || null,
  );
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterList, setFilterList] = useState<string[]>([]);
  const [filteredList, setFilteredList] = useState<string[]>([]);

  // Animations
  const searchAnimation = useRef(new Animated.Value(0)).current;
  const keyboardHeight = useRef(new Animated.Value(0)).current;

  // Keyboard handling
  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (e: any) => {
      const h = e?.endCoordinates?.height ?? 0;
      keyboardHeight.stopAnimation();
      keyboardHeight.setValue(h);
    };
    const onHide = () => {
      keyboardHeight.stopAnimation();
      keyboardHeight.setValue(0);
    };

    const s1 = Keyboard.addListener(showEvt, onShow);
    const s2 = Keyboard.addListener(hideEvt, onHide);
    return () => {
      s1.remove();
      s2.remove();
    };
  }, [keyboardHeight]);

  // Build filter list based on content type
  const buildFilterList = useCallback(async () => {
    try {
      let list: string[] = [];
      
      switch (contentType) {
        case 'masaib':
          // Build reciter list from masaib data
          const set = new Set<string>();
          let page = 1;
          const HARD_CAP_ITERATIONS = 200;
          let iterations = 0;

          while (iterations < HARD_CAP_ITERATIONS) {
            const res = await database.getKalaamsByMasaib(contentName, page, limit);
            res.kalaams.forEach(k => {
              if (k.reciter) set.add(k.reciter);
            });
            if (res.kalaams.length < limit) break;
            page += 1;
            iterations += 1;
          }
          list = Array.from(set).sort((a, b) => a.localeCompare(b));
          break;
          
        case 'poet':
          // Build masaib list from poet data
          const masaibSet = new Set<string>();
          let poetPage = 1;
          const POET_CAP_ITERATIONS = 200;
          let poetIterations = 0;

          while (poetIterations < POET_CAP_ITERATIONS) {
            const res = await database.getKalaamsByPoet(contentName, poetPage, limit);
            res.kalaams.forEach(k => {
              if (k.masaib) masaibSet.add(k.masaib);
            });
            if (res.kalaams.length < limit) break;
            poetPage += 1;
            poetIterations += 1;
          }
          list = Array.from(masaibSet).sort((a, b) => a.localeCompare(b));
          break;
          
        case 'reciter':
          // Use database method for reciter
          list = await database.getMasaibByReciter(contentName);
          break;
      }

      setFilterList(list);
      setFilteredList(list);
    } catch (e) {
      console.error('Failed to build filter list:', e);
      setFilterList([]);
      setFilteredList([]);
    }
  }, [contentType, contentName]);

  // Load kalaams based on content type and filter
  const load = useCallback(async (page: number = 1) => {
    try {
      setIsLoading(true);
      setNextPageLoading(page > 1);

      let result: KalaamListResponse;

      switch (contentType) {
        case 'masaib':
          if (selectedFilter) {
            result = await database.getKalaamsByReciterAndMasaib(
              selectedFilter,
              contentName,
              page,
              limit,
            );
          } else {
            result = await database.getKalaamsByMasaib(contentName, page, limit);
          }
          break;
          
        case 'poet':
          result = await database.getKalaamsByPoet(contentName, page, limit);
          // Client-side filtering for poet screen
          if (selectedFilter) {
            result = {
              ...result,
              kalaams: result.kalaams.filter(k => k.masaib === selectedFilter),
            };
          }
          break;
          
        case 'reciter':
          if (selectedFilter) {
            result = await database.getKalaamsByReciterAndMasaib(
              contentName,
              selectedFilter,
              page,
              limit,
            );
          } else {
            result = await database.getKalaamsByReciter(contentName, page, limit);
          }
          break;
          
        default:
          throw new Error('Unknown content type');
      }

      setKalaams(result.kalaams);
      setTotalKalaams(result.total);
      setHasMore(result.kalaams.length === limit);
      setCurrentPage(page);
      setError(null);
    } catch (e) {
      console.error('Failed to load kalaams', e);
      setError('Error loading nohas. Please try again.');
      setKalaams([]);
    } finally {
      setIsLoading(false);
      setNextPageLoading(false);
    }
  }, [contentType, contentName, selectedFilter, limit]);

  // Effects
  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    buildFilterList();
  }, [buildFilterList]);

  useEffect(() => {
    if (searchText) {
      setFilteredList(
        filterList.filter(item =>
          item.toLowerCase().includes(searchText.toLowerCase()),
        ),
      );
    } else {
      setFilteredList(filterList);
    }
  }, [searchText, filterList]);

  // Filter controls
  const toggleFilter = () => {
    const toValue = isFilterOpen ? 0 : 1;
    setIsFilterOpen(!isFilterOpen);
    Animated.timing(searchAnimation, {
      toValue,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      if (toValue === 0) {
        setSearchText('');
        Keyboard.dismiss();
      }
    });
  };

  const selectFilter = (filterValue: string) => {
    console.log('Selecting filter:', filterValue);
    setSelectedFilter(filterValue);
    globalFilters.set(contentName, filterValue);
    setKalaams([]);
    load(1);
    // Close filter dialog
    setIsFilterOpen(false);
    setSearchText('');
    Keyboard.dismiss();
    Animated.timing(searchAnimation, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  };

  const clearFilter = () => {
    setSelectedFilter(null);
    globalFilters.delete(contentName);
    setKalaams([]);
    load(1);
  };

  const handlePrev = () => {
    if (currentPage > 1) load(currentPage - 1);
  };

  const handleNext = () => {
    if (hasMore && !nextPageLoading) load(currentPage + 1);
  };

  // Loading state
  if (isLoading && kalaams.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: t.background }]}>
        <AppHeader />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={accentColor} />
          <Text style={[styles.loadingText, { color: t.textMuted }]}>Loading nohas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: t.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText]}>{error}</Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: accentColor }]} onPress={() => load()}>
            <Text style={[styles.retryButtonText, { color: t.accentOnAccent }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Animation values
  const kbLift = Animated.multiply(keyboardHeight, -1);
  const overlayEntrance = searchAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 0],
  });
  const overlayLift = Animated.add(kbLift, overlayEntrance);
  const topResults = filteredList.slice(0, 3);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: t.background }]} edges={['top']}>
      <AppHeader />
      <ScrollView style={styles.scrollView}>
        {/* Header Card */}
        <View style={[styles.headerCard, { backgroundColor: t.surface }]}>
          <View style={[styles.headerBanner, { backgroundColor: accentColor }]}>
            <Text style={[styles.headerTitle, { color: t.accentOnAccent }]}>
              <MaterialCommunityIcons name={config.icon} size={18} color={t.accentOnAccent} /> {config.title(contentName)}
            </Text>
            <Text style={[styles.headerSubtitle, { color: t.accentOnAccent }]}>
              {config.subtitle(totalKalaams)}
            </Text>
          </View>
        </View>

        {/* Active Filter Chip */}
        {selectedFilter && (
          <View style={styles.filterChipContainer}>
            <View style={[styles.filterChip, { backgroundColor: t.accentSubtle }]}>
              <MaterialCommunityIcons name="filter" size={14} color={accentColor} />
              <Text style={[styles.filterChipText, { color: accentColor }]}>{selectedFilter}</Text>
              <TouchableOpacity onPress={clearFilter}>
                <MaterialCommunityIcons
                  name="close"
                  size={16}
                  color={accentColor}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* List Card */}
        <View style={[styles.listCard, { backgroundColor: t.surface }]}>
          {isLoading && kalaams.length === 0 ? (
            <View style={styles.loadingInline}>
              <ActivityIndicator size="small" color={accentColor} />
              <Text style={[styles.loadingText, { color: t.textMuted }]}>Loading nohas...</Text>
            </View>
          ) : kalaams.length > 0 ? (
            <View style={[styles.listDivider, { borderTopColor: t.divider }]}>
              {kalaams.map(k => (
                <TouchableOpacity
                  key={k.id}
                  style={[styles.itemRow, { borderBottomColor: t.divider }]}
                  onPress={() => navigation.navigate('Kalaam', { id: k.id })}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemTitle, { color: t.textPrimary }]}>{k.title}</Text>
                    <View style={styles.metaRow}>
                      {/* Show only relevant fields based on content type */}
                      {contentType === 'masaib' && k.reciter ? (
                        <View style={styles.metaChip}>
                          <MaterialCommunityIcons
                            name="account-music"
                            size={14}
                            color={t.textMuted}
                          />
                          <Text style={[styles.metaText, { color: t.textMuted }]}>{k.reciter}</Text>
                        </View>
                      ) : null}
                      {contentType === 'masaib' && k.poet ? (
                        <View style={styles.metaChip}>
                          <MaterialCommunityIcons
                            name="feather"
                            size={14}
                            color={t.textMuted}
                          />
                          <Text style={[styles.metaText, { color: t.textMuted }]}>{k.poet}</Text>
                        </View>
                      ) : null}
                      
                      {contentType === 'poet' && k.reciter ? (
                        <View style={styles.metaChip}>
                          <MaterialCommunityIcons
                            name="account-music"
                            size={14}
                            color={t.textMuted}
                          />
                          <Text style={[styles.metaText, { color: t.textMuted }]}>{k.reciter}</Text>
                        </View>
                      ) : null}
                      {contentType === 'poet' && k.masaib ? (
                        <View style={styles.metaChip}>
                          <MaterialCommunityIcons
                            name="book-open-variant"
                            size={14}
                            color={t.textMuted}
                          />
                          <Text style={[styles.metaText, { color: t.textMuted }]}>{k.masaib}</Text>
                        </View>
                      ) : null}
                      
                      {contentType === 'reciter' && k.poet ? (
                        <View style={styles.metaChip}>
                          <MaterialCommunityIcons
                            name="feather"
                            size={14}
                            color={t.textMuted}
                          />
                          <Text style={[styles.metaText, { color: t.textMuted }]}>{k.poet}</Text>
                        </View>
                      ) : null}
                      {contentType === 'reciter' && k.masaib ? (
                        <View style={styles.metaChip}>
                          <MaterialCommunityIcons
                            name="book-open-variant"
                            size={14}
                            color={t.textMuted}
                          />
                          <Text style={[styles.metaText, { color: t.textMuted }]}>{k.masaib}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={22}
                    color={t.textMuted}
                  />
                </TouchableOpacity>
              ))}
              {nextPageLoading && (
                <View style={styles.loadingMore}>
                  <ActivityIndicator size="small" color={accentColor} />
                  <Text style={[styles.loadingText, { color: t.textMuted }]}>Loading more...</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: t.textMuted }]}>
                {typeof config.emptyMessage === 'function' 
                  ? config.emptyMessage(selectedFilter || undefined)
                  : config.emptyMessage}
              </Text>
            </View>
          )}
        </View>

        {/* Pagination */}
        {kalaams.length > 0 && (
          <View style={styles.pagination}>
            <TouchableOpacity
              style={
                currentPage === 1
                  ? [styles.pageButton, styles.pageButtonDisabled]
                  : [styles.pageButton, { backgroundColor: accentColor }]
              }
              onPress={handlePrev}
              disabled={currentPage === 1 || nextPageLoading}
            >
              <Text style={currentPage === 1 ? [styles.pageButtonText, { color: t.textMuted }] : [styles.pageButtonText, { color: t.accentOnAccent }]}>Prev</Text>
            </TouchableOpacity>

            <Text style={[styles.pageIndicator, { color: t.textMuted }]}>Page {currentPage}</Text>

            <TouchableOpacity
              style={
                !hasMore
                  ? [styles.pageButton, styles.pageButtonDisabled]
                  : [styles.pageButton, { backgroundColor: accentColor }]
              }
              onPress={handleNext}
              disabled={!hasMore || nextPageLoading}
            >
              {nextPageLoading ? (
                <ActivityIndicator size="small" color={t.accentOnAccent} />
              ) : (
                <Text style={!hasMore ? [styles.pageButtonText, { color: t.textMuted }] : [styles.pageButtonText, { color: t.accentOnAccent }]}>Next</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 96 }} />
      </ScrollView>

      {/* Floating Filter Button */}
      <Animated.View
        style={[
          styles.floatingButton,
          {
            bottom: 30,
            transform: [
              { translateY: kbLift },
              {
                scale: searchAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0.98],
                }),
              },
            ],
            opacity: searchAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0.95],
            }),
          },
        ]}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: t.surface, borderColor: t.border }]}
          onPress={toggleFilter}
          activeOpacity={0.85}
        >
          <Feather name="filter" size={22} color={t.textPrimary} />
        </TouchableOpacity>
      </Animated.View>

      {/* Search Overlay */}
      {isFilterOpen && (
        <Animated.View
          style={[
            styles.searchOverlay,
            {
              bottom: 12,
              opacity: searchAnimation,
              transform: [{ translateY: overlayLift }],
            },
          ]}
          pointerEvents="auto"
        >
        <View style={[
          styles.overlayInner, 
          { 
            backgroundColor: t.surface,
            borderColor: t.border,
          }
        ]}>
          <FlatList
            data={topResults}
            keyExtractor={(item, index) => `${item}-${index}`}
            style={styles.resultsList}
            contentContainerStyle={{ paddingTop: 8, paddingBottom: 8 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.resultRow, { borderBottomColor: t.divider }]}
                onPress={() => selectFilter(item)}
                activeOpacity={0.85}
              >
                <View style={styles.resultIconWrap}>
                  <MaterialCommunityIcons
                    name={config.filterIcon}
                    size={16}
                    color={accentColor}
                  />
                </View>
                <Text style={[styles.resultTitle, { color: t.textPrimary }]} numberOfLines={1}>
                  {item}
                </Text>
                {selectedFilter === item && (
                  <MaterialCommunityIcons
                    name="check"
                    size={18}
                    color={accentColor}
                  />
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <MaterialCommunityIcons
                  name="magnify"
                  size={24}
                  color={t.textMuted}
                />
                <Text style={[styles.emptyText, { color: t.textMuted }]}>{config.filterEmptyMessage}</Text>
              </View>
            }
          />

          {/* Search Footer */}
          <View style={[styles.searchFooter, { backgroundColor: t.surface, borderTopColor: t.divider }]}>
            <View style={[styles.searchInputContainer, { backgroundColor: t.surface, borderColor: t.border }]}>
              <MaterialCommunityIcons
                name="magnify"
                size={20}
                color={t.textMuted}
                style={styles.searchIcon}
              />
              <TextInput
                style={[styles.searchInput, { color: t.textPrimary }]}
                placeholder={config.filterPlaceholder}
                placeholderTextColor={t.textMuted}
                value={searchText}
                onChangeText={setSearchText}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
              />
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={toggleFilter}
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            >
              <MaterialCommunityIcons name="close" size={22} color={t.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scrollView: { flex: 1 },

  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    margin: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  headerBanner: {
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  headerTitle: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
  headerSubtitle: { color: '#d1fae5', fontSize: 13, marginTop: 4 },

  filterChipContainer: { paddingHorizontal: 16, marginBottom: 8 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    gap: 6,
    overflow: 'hidden',
  },
  filterChipText: { color: '#16a34a', fontSize: 12, fontWeight: '600' },

  listCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  loadingInline: { padding: 16, alignItems: 'center' },
  loadingText: { color: '#6b7280', fontSize: 16 },
  listDivider: { borderTopColor: '#f3f4f6', borderTopWidth: 1 },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomColor: '#f3f4f6',
    borderBottomWidth: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  metaRow: { flexDirection: 'row', gap: 12 },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#6b7280', marginLeft: 4 },

  emptyState: { padding: 16, alignItems: 'center' },
  emptyText: { color: '#6b7280' },

  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 12,
    marginBottom: 80,
  },
  pageButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  pageButtonDisabled: { backgroundColor: '#9ca3af' },
  pageButtonText: { color: '#ffffff', fontWeight: '600' },
  pageIndicator: { marginHorizontal: 12, color: '#6b7280' },

  // FAB
  floatingButton: {
    position: 'absolute',
    right: 16,
    zIndex: 100,
    elevation: 12,
  },
  filterButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    overflow: 'hidden',
  },

  // Overlay
  searchOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
    zIndex: 101,
    overflow: 'hidden', // This ensures the border follows the rounded corners
  },
  overlayInner: { flexDirection: 'column', maxHeight: 280 },

  resultsList: { flexGrow: 0 },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  resultIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  resultTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: '#111827' },

  // Search footer
  searchFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    backgroundColor: '#ffffff',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 12,
  },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, fontSize: 16, color: '#111827', paddingVertical: 0 },
  closeButton: { padding: 8 },

  // Loading/Error
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: { color: '#ffffff', fontWeight: '600' },
  errorText: { color: '#dc2626', textAlign: 'center' },
  
  loadingMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
});

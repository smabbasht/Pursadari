// PoetScreen.tsx

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

import DatabaseService from '../database/DatabaseService';
import { RootStackParamList, Kalaam, KalaamListResponse } from '../types';
import AppHeader from '../components/AppHeader';
import { useThemeTokens, useSettings } from '../context/SettingsContext';

type PoetRoute = RouteProp<RootStackParamList, 'Poet'>;
type Nav = StackNavigationProp<RootStackParamList, 'Poet'>;

// Persist poet->masaib selection across session (same behavior as Reciter screen)
const globalFilters = new Map<string, string>();

export default function PoetScreen() {
  const t = useThemeTokens();
  const { accentColor } = useSettings();
  const route = useRoute<PoetRoute>();
  const navigation = useNavigation<Nav>();
  const { poet } = route.params;

  const limit = 50;

  const [kalaams, setKalaams] = useState<Kalaam[]>([]);
  const [totalKalaams, setTotalKalaams] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination states
  const [lastVisibleDoc, setLastVisibleDoc] = useState<any | undefined>(undefined);
  const [nextPageLoading, setNextPageLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [selectedMasaib, setSelectedMasaib] = useState<string | null>(
    globalFilters.get(poet) || null,
  );

  // Search/filter UI state (masaib)
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [masaibList, setMasaibList] = useState<string[]>([]);
  const [filteredMasaib, setFilteredMasaib] = useState<string[]>([]);

  // Animations (JS-driven to avoid native "bottom" restrictions)
  const searchAnimation = useRef(new Animated.Value(0)).current; // 0 closed, 1 open
  const keyboardHeight = useRef(new Animated.Value(0)).current;

  // --- Keyboard listeners (set value directly; no 'bottom' animation) ---
  useEffect(() => {
    const showEvt =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

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

  // Build distinct masaib list for this poet
  const buildMasaibList = useCallback(async () => {
    // Pull enough kalaams for this poet to compute distinct masaib
    // (no DB change needed)
    const set = new Set<string>();
    let startDoc: any;
    const HARD_CAP_ITERATIONS = 200;
    let iterations = 0;

    while (iterations < HARD_CAP_ITERATIONS) {
      const res = await DatabaseService.getKalaamsByPoet(poet, limit, startDoc);
      res.kalaams.forEach(k => {
        if (k.masaib) set.add(k.masaib);
      });
      if (res.kalaams.length < limit || !res.lastVisibleDoc) break;
      startDoc = res.lastVisibleDoc;
      iterations += 1;
    }
    const list = Array.from(set).sort((a, b) => a.localeCompare(b));
    setMasaibList(list);
    setFilteredMasaib(list);
  }, [poet]);

  // Load kalaams (with optional client-side filter by masaib)
  const load = useCallback(async (startDoc?: any, append: boolean = false) => {
    try {
      if (!append) {
        setIsLoading(true);
      } else {
        setNextPageLoading(true);
      }

      // No masaib selected -> regular paginated query by poet
      if (!selectedMasaib) {
        const result = await DatabaseService.getKalaamsByPoet(
          poet,
          limit,
          startDoc,
        );
        
        if (append) {
          setKalaams(prev => [...prev, ...result.kalaams]);
        } else {
          setKalaams(result.kalaams);
        }
        
        setTotalKalaams(result.total);
        setLastVisibleDoc(result.lastVisibleDoc);
        setHasMore(result.kalaams.length === limit && !!result.lastVisibleDoc);
        setError(null);
        return;
      }

      // Masaib selected -> fetch ALL kalaams by poet and filter by masaib,
      // then paginate on the client so totals/buttons are correct.
      const all: Kalaam[] = [];
      let currentStartDoc: any;
      const HARD_CAP_ITERATIONS = 200;
      let iterations = 0;

      while (iterations < HARD_CAP_ITERATIONS) {
        const res = await DatabaseService.getKalaamsByPoet(poet, limit, currentStartDoc);
        all.push(...res.kalaams);
        if (res.kalaams.length < limit || !res.lastVisibleDoc) break;
        currentStartDoc = res.lastVisibleDoc;
        iterations += 1;
      }

      const filtered = all.filter(k => k.masaib === selectedMasaib);
      const total = filtered.length;
      
      // For client-side pagination with masaib filter
      const start = append ? kalaams.length : 0;
      const end = start + limit;
      const pageItems = filtered.slice(start, end);
      
      if (append) {
        setKalaams(prev => [...prev, ...pageItems]);
      } else {
        setKalaams(pageItems);
      }
      
      setTotalKalaams(total);
      setLastVisibleDoc(end < total ? { hasMore: true } : undefined);
      setHasMore(end < total);
      setError(null);
    } catch (e) {
      console.error('Failed to load poet kalaams', e);
      setError('Error loading nohas. Please try again.');
      if (!append) {
        setKalaams([]);
      }
    } finally {
      setIsLoading(false);
      setNextPageLoading(false);
    }
  }, [poet, selectedMasaib, limit, kalaams.length]);

  // Effects
  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    buildMasaibList();
  }, [buildMasaibList]);

  useEffect(() => {
    if (searchText) {
      setFilteredMasaib(
        masaibList.filter(m =>
          m.toLowerCase().includes(searchText.toLowerCase()),
        ),
      );
    } else {
      setFilteredMasaib(masaibList);
    }
  }, [searchText, masaibList]);

  // Filter controls
  const toggleFilter = () => {
    const toValue = isFilterOpen ? 0 : 1;
    setIsFilterOpen(!isFilterOpen);

    Animated.timing(searchAnimation, {
      toValue,
      duration: 220,
      useNativeDriver: false,
    }).start(() => {
      if (toValue === 0) {
        setSearchText('');
        Keyboard.dismiss();
      }
    });
  };

  const selectMasaib = (masaib: string) => {
    setSelectedMasaib(masaib);
    globalFilters.set(poet, masaib);
    setLastVisibleDoc(undefined);
    setKalaams([]);
    load();
    toggleFilter();
  };

  const clearFilter = () => {
    setSelectedMasaib(null);
    globalFilters.delete(poet);
    setLastVisibleDoc(undefined);
    setKalaams([]);
    load();
  };

  const handleLoadMore = () => {
    if (hasMore && !nextPageLoading && lastVisibleDoc) {
      load(lastVisibleDoc, true);
    }
  };

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

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: t.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText]}>{error}</Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: accentColor }]} onPress={load}>
            <Text style={[styles.retryButtonText, { color: t.accentOnAccent }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Keep FAB/overlay above keyboard using translateY (never animate 'bottom')
  const kbLift = Animated.multiply(keyboardHeight, -1);
  const overlayEntrance = searchAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 0],
  });
  const overlayLift = Animated.add(kbLift, overlayEntrance);

  const topResults = filteredMasaib.slice(0, 3);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: t.background }]} edges={['top']}>
      <AppHeader />
      <ScrollView style={styles.scrollView}>
        <View style={[styles.headerCard, { backgroundColor: t.surface }]}>
          <View style={[styles.headerBanner, { backgroundColor: accentColor }]}>
            <Text style={[styles.headerTitle, { color: t.accentOnAccent }]}>
              <MaterialCommunityIcons name="feather" size={18} color={t.accentOnAccent} /> {poet}
            </Text>
            <Text style={[styles.headerSubtitle, { color: t.accentOnAccent }]}>
              {totalKalaams} nohas by this poet
            </Text>
          </View>
        </View>

        {/* Active Filter Chip */}
        {selectedMasaib && (
          <View style={styles.filterChipContainer}>
            <View style={[styles.filterChip, { backgroundColor: t.accentSubtle }]}>
              <MaterialCommunityIcons name="filter" size={14} color={accentColor} />
              <Text style={[styles.filterChipText, { color: accentColor }]}>{selectedMasaib}</Text>
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

        <View style={[styles.listCard, { backgroundColor: t.surface }]}>
          {isLoading && kalaams.length === 0 ? (
            <View style={styles.loadingInline}>
              <ActivityIndicator size="small" color={accentColor} />
              <Text style={[styles.loadingText, { color: t.textMuted }]}>Loading nohas...</Text>
            </View>
          ) : kalaams.length > 0 ? (
            <View style={styles.listDivider}>
              {kalaams.map(k => (
                <TouchableOpacity
                  key={k.id}
                  style={styles.itemRow}
                  onPress={() => navigation.navigate('Kalaam', { id: k.id })}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemTitle, { color: t.textPrimary }]}>{k.title}</Text>
                    <View style={styles.metaRow}>
                      {k.reciter ? (
                        <View style={styles.metaChip}>
                          <MaterialCommunityIcons
                            name="account-music"
                            size={14}
                            color={t.textMuted}
                          />
                          <Text style={[styles.metaText, { color: t.textMuted }]}>{k.reciter}</Text>
                        </View>
                      ) : null}
                      {k.masaib ? (
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
                No nohas found for this poet.
              </Text>
            </View>
          )}
        </View>

        {hasMore && kalaams.length > 0 && (
          <View style={styles.loadMoreContainer}>
            <TouchableOpacity
              style={[styles.loadMoreButton, { backgroundColor: accentColor }]}
              onPress={handleLoadMore}
              disabled={nextPageLoading}
            >
              {nextPageLoading ? (
                <ActivityIndicator size="small" color={t.accentOnAccent} />
              ) : (
                <Text style={[styles.loadMoreText, { color: t.accentOnAccent }]}>
                  Load More
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 96 }} />
      </ScrollView>

      {/* Floating Filter Button (Feather) */}
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

      {/* Compact Overlay: results (top-3) above, search at bottom */}
      <Animated.View
        style={[
          styles.searchOverlay,
          {
            bottom: 12,
            opacity: searchAnimation,
            transform: [{ translateY: Animated.add(kbLift, overlayEntrance) }],
          },
        ]}
        pointerEvents={isFilterOpen ? 'auto' : 'none'}
      >
        <View style={[styles.overlayInner, { backgroundColor: t.surface }]}>
          <FlatList
            data={topResults}
            keyExtractor={(item, index) => `${item}-${index}`}
            style={styles.resultsList}
            contentContainerStyle={{ paddingTop: 8, paddingBottom: 8 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.resultRow}
                onPress={() => selectMasaib(item)}
                activeOpacity={0.85}
              >
                <View style={styles.resultIconWrap}>
                  <MaterialCommunityIcons
                    name="book-open-variant"
                    size={16}
                    color={accentColor}
                  />
                </View>
                <Text style={[styles.resultTitle, { color: t.textPrimary }]} numberOfLines={1}>
                  {item}
                </Text>
                {selectedMasaib === item && (
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
                <Text style={[styles.emptyText, { color: t.textMuted }]}>No masaib found</Text>
              </View>
            }
          />

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
                placeholder="Search masaib…"
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scrollView: { flex: 1 },

  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    margin: 16,
    overflow: 'hidden',
    elevation: 2,
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
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 6,
  },
  filterChipText: { color: '#16a34a', fontSize: 12, fontWeight: '600' },

  listCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
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
    width: 64,
    height: 64,
    borderRadius: 32,
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
  },

  // Overlay (results top, search bottom)
  searchOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
    zIndex: 101,
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
  errorText: { color: '#dc2626', fontSize: 16, textAlign: 'center' },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: { color: '#ffffff', fontWeight: '600' },
  
  loadingMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  loadMoreContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  loadMoreButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  loadMoreText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
});

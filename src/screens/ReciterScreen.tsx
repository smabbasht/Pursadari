// ReciterScreen.tsx

import React, { useEffect, useState, useRef } from 'react';
// @ts-ignore
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
import { RootStackParamList, KalaamListResponse, Kalaam } from '../types';
import AppHeader from '../components/AppHeader';
import { useThemeTokens, useSettings } from '../context/SettingsContext';

type ReciterRoute = RouteProp<RootStackParamList, 'Reciter'>;
type Nav = StackNavigationProp<RootStackParamList, 'Reciter'>;

// Global state for filter persistence across app session
const globalFilters = new Map<string, string>();

export default function ReciterScreen() {
  const t = useThemeTokens();
  const { accentColor } = useSettings();
  const route = useRoute<ReciterRoute>();
  const navigation = useNavigation<Nav>();
  const { reciter } = route.params;

  const [kalaams, setKalaams] = useState<Kalaam[]>([]);
  const [totalKalaams, setTotalKalaams] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination states
  const [lastVisibleDoc, setLastVisibleDoc] = useState<any | undefined>(undefined);
  const [nextPageLoading, setNextPageLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedMasaib, setSelectedMasaib] = useState<string | null>(
    globalFilters.get(reciter) || null,
  );

  // Filter UI state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [masaibList, setMasaibList] = useState<string[]>([]);
  const [filteredMasaib, setFilteredMasaib] = useState<string[]>([]);

  // Animation refs
  const searchAnimation = useRef(new Animated.Value(0)).current; // 0 closed, 1 open (JS-driven)
  const keyboardHeight = useRef(new Animated.Value(0)).current; // JS-driven only

  const limit = 50;

  useEffect(() => {
    load();
    loadMasaibList();
  }, [reciter, selectedMasaib]);

  // Keyboard -> set value directly (avoid mixed native/JS driver issues)
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

  useEffect(() => {
    if (searchText) {
      const filtered = masaibList.filter(masaib =>
        masaib.toLowerCase().includes(searchText.toLowerCase()),
      );
      setFilteredMasaib(filtered);
    } else {
      setFilteredMasaib(masaibList);
    }
  }, [searchText, masaibList]);

  const load = async (startDoc?: any, append: boolean = false) => {
    try {
      if (!append) {
      setIsLoading(true);
      } else {
        setNextPageLoading(true);
      }
      
      let result;
      if (selectedMasaib) {
        result = await DatabaseService.getKalaamsByReciterAndMasaib(
          reciter,
          selectedMasaib,
          limit,
          startDoc,
        );
      } else {
        result = await DatabaseService.getKalaamsByReciter(
          reciter,
          limit,
          startDoc,
        );
      }
      
      if (append) {
        setKalaams(prev => [...prev, ...result.kalaams]);
      } else {
        setKalaams(result.kalaams);
      }
      
      setTotalKalaams(result.total);
      setLastVisibleDoc(result.lastVisibleDoc);
      setHasMore(result.kalaams.length === limit && !!result.lastVisibleDoc);
      setError(null);
    } catch (e) {
      console.error('Failed to load reciter kalaams', e);
      setError('Error loading nohas. Please try again.');
      if (!append) {
        setKalaams([]);
      }
    } finally {
      setIsLoading(false);
      setNextPageLoading(false);
    }
  };

  const loadMasaibList = async () => {
    try {
      const masaibs = await DatabaseService.getMasaibByReciter(reciter);
      setMasaibList(masaibs);
      setFilteredMasaib(masaibs);
    } catch (e) {
      console.error('Failed to load masaib list', e);
    }
  };

  const toggleFilter = () => {
    const toValue = isFilterOpen ? 0 : 1;
    setIsFilterOpen(!isFilterOpen);

    Animated.timing(searchAnimation, {
      toValue,
      duration: 220,
      useNativeDriver: false, // JS-driven so we can combine with non-supported style props safely
    }).start(() => {
      if (toValue === 0) {
        setSearchText('');
        Keyboard.dismiss();
      }
    });
  };

  const selectMasaib = (masaib: string) => {
    setSelectedMasaib(masaib);
    globalFilters.set(reciter, masaib);
    setLastVisibleDoc(undefined);
    setKalaams([]);
    load();
    toggleFilter();
  };

  const clearFilter = () => {
    setSelectedMasaib(null);
    globalFilters.delete(reciter);
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

  // Keep FAB & overlay above keyboard with translateY (do NOT animate 'bottom')
  const kbLift = Animated.multiply(keyboardHeight, -1);
  const overlayEntrance = searchAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 0],
  });
  const overlayLift = Animated.add(kbLift, overlayEntrance);

  // Only show top 3 results
  const topResults = filteredMasaib.slice(0, 3);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: t.background }]} edges={['top']}>
      <AppHeader />
      <ScrollView style={styles.scrollView}>
        <View style={[styles.headerCard, { backgroundColor: t.surface }]}>
          <View style={[styles.headerBanner, { backgroundColor: accentColor }]}>
            <Text style={[styles.headerTitle, { color: t.accentOnAccent }]}>
              <MaterialCommunityIcons name="account-music" size={18} color={t.accentOnAccent} /> {reciter}
            </Text>
            <Text style={[styles.headerSubtitle, { color: t.accentOnAccent }]}>
              {totalKalaams} nohas by this reciter
            </Text>
          </View>
        </View>

        {/* Active Filter Indicator */}
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
                      {k.poet ? (
                        <View style={styles.metaChip}>
                          <MaterialCommunityIcons
                            name="feather"
                            size={14}
                            color={t.textMuted}
                          />
                          <Text style={[styles.metaText, { color: t.textMuted }]}>{k.poet}</Text>
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
                {selectedMasaib
                  ? `No nohas found for this reciter in "${selectedMasaib}".`
                  : 'No nohas found for this reciter.'}
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

      {/* Floating Filter Button (Feather icon, sleek) */}
      <Animated.View
        style={[
          styles.floatingButton,
          {
            bottom: 24, // constant
            transform: [
              { translateY: kbLift }, // lift above keyboard
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

      {/* Compact Overlay: RESULTS ON TOP, SEARCH AT BOTTOM (top 3) */}
      <Animated.View
        style={[
          styles.searchOverlay,
          {
            bottom: 12, // constant
            opacity: searchAnimation,
            transform: [{ translateY: overlayLift }],
          },
        ]}
        pointerEvents={isFilterOpen ? 'auto' : 'none'}
      >
        <View style={[styles.overlayInner, { backgroundColor: t.surface }]}>
          {/* Results (top-3) */}
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
                <View style={[styles.resultIconWrap, { backgroundColor: t.accentSubtle }]}>
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

          {/* Search bar pinned at bottom of the overlay */}
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

  // Filter Chip
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
    backgroundColor: '#16a34a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  pageButtonDisabled: { backgroundColor: '#9ca3af' },
  pageButtonText: { color: '#ffffff', fontWeight: '600' },
  pageIndicator: { marginHorizontal: 12, color: '#6b7280' },

  // Floating Button (sleek, consistent)
  floatingButton: {
    position: 'absolute',
    right: 16,
    zIndex: 100,
    elevation: 12,
  },
  filterButton: {
    width: 56,
    height: 56,
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

  // Overlay card (results above, search pinned at bottom)
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
  overlayInner: {
    flexDirection: 'column',
    maxHeight: 280, // compact card
  },
  resultsList: {
    flexGrow: 0, // just content height (top-3)
  },
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

  // Search bar at bottom of overlay
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
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 0,
  },
  closeButton: { padding: 8 },

  // Loading/Error states
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
    backgroundColor: '#16a34a',
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

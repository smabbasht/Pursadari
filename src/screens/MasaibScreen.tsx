// MasaibScreen.tsx

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
import { RootStackParamList, KalaamListResponse, Kalaam } from '../types';
import AppHeader from '../components/AppHeader';
import { useThemeTokens, useSettings } from '../context/SettingsContext';

type MasaibRoute = RouteProp<RootStackParamList, 'Masaib'>;
type Nav = StackNavigationProp<RootStackParamList, 'Masaib'>;

// Persist masaib -> reciter selection across session
const globalFilters = new Map<string, string>();

export default function MasaibScreen() {
  const t = useThemeTokens();
  const { accentColor } = useSettings();
  const route = useRoute<MasaibRoute>();
  const navigation = useNavigation<Nav>();
  const { masaib } = route.params;

  const limit = 50;

  const [page, setPage] = useState(1);
  const [data, setData] = useState<KalaamListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedReciter, setSelectedReciter] = useState<string | null>(
    globalFilters.get(masaib) || null,
  );

  // Filter UI state (search reciters)
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [reciterList, setReciterList] = useState<string[]>([]);
  const [filteredReciters, setFilteredReciters] = useState<string[]>([]);

  // Animations (JS-driven)
  const searchAnimation = useRef(new Animated.Value(0)).current; // 0 closed, 1 open
  const keyboardHeight = useRef(new Animated.Value(0)).current;

  // --- Keyboard: update value directly, then lift with translateY ---
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

  // Distinct reciters for this masaib (client-built; no DB change needed)
  const buildReciterList = useCallback(async () => {
    const set = new Set<string>();
    let p = 1;
    const HARD_CAP_PAGES = 200;

    while (p <= HARD_CAP_PAGES) {
      const res = await DatabaseService.getKalaamsByMasaib(masaib, p, limit);
      res.kalaams.forEach(k => {
        if (k.reciter) set.add(k.reciter);
      });
      if (res.kalaams.length < limit) break;
      p += 1;
    }

    const list = Array.from(set).sort((a, b) => a.localeCompare(b));
    setReciterList(list);
    setFilteredReciters(list);
  }, [masaib]);

  // Load kalaams (either by masaib or by reciter+masaib)
  const load = useCallback(async () => {
    try {
      setIsLoading(true);

      if (!selectedReciter) {
        const result = await DatabaseService.getKalaamsByMasaib(
          masaib,
          page,
          limit,
        );
        setData(result);
        setError(null);
        return;
      }

      // Use dedicated DB method when reciter is selected
      const result = await DatabaseService.getKalaamsByReciterAndMasaib(
        selectedReciter,
        masaib,
        page,
        limit,
      );
      setData(result);
      setError(null);
    } catch (e) {
      console.error('Failed to load masaib kalaams', e);
      setError('Error loading nohas. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [masaib, page, selectedReciter]);

  // Effects
  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    buildReciterList();
  }, [buildReciterList]);

  useEffect(() => {
    if (searchText) {
      setFilteredReciters(
        reciterList.filter(r =>
          r.toLowerCase().includes(searchText.toLowerCase()),
        ),
      );
    } else {
      setFilteredReciters(reciterList);
    }
  }, [searchText, reciterList]);

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

  const selectReciter = (reciter: string) => {
    setSelectedReciter(reciter);
    globalFilters.set(masaib, reciter);
    setPage(1);
    toggleFilter();
  };

  const clearFilter = () => {
    setSelectedReciter(null);
    globalFilters.delete(masaib);
    setPage(1);
  };

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  if (isLoading && !data) {
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
          <Text style={[styles.errorText, { color: t.danger }]}>{error}</Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: accentColor }]} onPress={load}>
            <Text style={[styles.retryButtonText, { color: t.accentOnAccent }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Keep FAB/overlay above keyboard using translateY
  const kbLift = Animated.multiply(keyboardHeight, -1);
  const overlayEntrance = searchAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 0],
  });
  const overlayLift = Animated.add(kbLift, overlayEntrance);

  const topResults = filteredReciters.slice(0, 3);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: t.background }]} edges={['top']}>
      <AppHeader />
      <ScrollView style={styles.scrollView}>
        <View style={[styles.headerCard, { backgroundColor: t.surface }]}>
          <View style={[styles.headerBanner, { backgroundColor: accentColor }]}>
            <Text style={[styles.headerTitle, { color: t.accentOnAccent }]}>
              <MaterialCommunityIcons name="book-open-variant" size={18} color={t.accentOnAccent} /> {masaib}
            </Text>
            <Text style={[styles.headerSubtitle, { color: t.accentOnAccent }]}>
              {data?.total || 0} nohas in this category
            </Text>
          </View>
        </View>

        {/* Active Filter Chip (reciter) */}
        {selectedReciter && (
          <View style={styles.filterChipContainer}>
            <View style={[styles.filterChip, { backgroundColor: t.accentSubtle }] }>
              <MaterialCommunityIcons name="filter" size={14} color={accentColor} />
              <Text style={[styles.filterChipText, { color: accentColor }]}>{selectedReciter}</Text>
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
          {!data || isLoading ? (
            <View style={styles.loadingInline}>
              <ActivityIndicator size="small" color={accentColor} />
              <Text style={[styles.loadingText, { color: t.textMuted }]}>Loading nohas...</Text>
            </View>
          ) : data.kalaams.length > 0 ? (
            <View className="listDivider" style={styles.listDivider}>
              {data.kalaams.map(k => (
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
                    </View>
                  </View>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={22}
                    color={t.textMuted}
                  />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: t.textMuted }] }>
                No nohas found for this category.
              </Text>
            </View>
          )}
        </View>

        {data && totalPages > 1 ? (
          <View style={styles.pagination}>
            <TouchableOpacity
              onPress={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={[
                styles.pageButton,
                { backgroundColor: accentColor },
                page === 1 && styles.pageButtonDisabled,
              ]}
            >
              <Text style={[styles.pageButtonText, { color: t.accentOnAccent }]}>Prev</Text>
            </TouchableOpacity>
            <Text style={[styles.pageIndicator, { color: t.textMuted }]}>
              {page} / {totalPages}
            </Text>
            <TouchableOpacity
              onPress={() => setPage(p => (data && p < totalPages ? p + 1 : p))}
              disabled={!data || page >= totalPages}
              style={[
                styles.pageButton,
                { backgroundColor: accentColor },
                (!data || page >= totalPages) && styles.pageButtonDisabled,
              ]}
            >
              <Text style={[styles.pageButtonText, { color: t.accentOnAccent }]}>Next</Text>
            </TouchableOpacity>
          </View>
        ) : null}

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
          style={styles.filterButton}
          onPress={toggleFilter}
          activeOpacity={0.85}
        >
          <Feather name="filter" size={22} color={t.textPrimary} />
        </TouchableOpacity>
      </Animated.View>

      {/* Compact Overlay: results (top-3 reciters) above, search at bottom */}
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
        <View style={[styles.overlayInner, { backgroundColor: t.surface }] }>
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
                onPress={() => selectReciter(item)}
                activeOpacity={0.85}
              >
                <View style={styles.resultIconWrap}>
                  <MaterialCommunityIcons
                    name="account-music"
                    size={16}
                    color={accentColor}
                  />
                </View>
                <Text style={[styles.resultTitle, { color: t.textPrimary }]} numberOfLines={1}>
                  {item}
                </Text>
                {selectedReciter === item && (
                  <MaterialCommunityIcons
                    name="check"
                    size={18}
                    color={accentColor}
                  />
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <MaterialCommunityIcons
                  name="magnify"
                  size={24}
                  color={t.textMuted}
                />
                <Text style={[styles.emptyText, { color: t.textMuted }]}>No reciters found</Text>
              </View>
            }
          />

          {/* Search bar pinned at bottom */}
          <View style={[styles.searchFooter, { backgroundColor: t.surface, borderTopColor: t.divider }]}>
            <View style={[styles.searchInputContainer, { backgroundColor: t.surface, borderColor: t.border }] }>
              <MaterialCommunityIcons
                name="magnify"
                size={20}
                color={t.textMuted}
                style={styles.searchIcon}
              />
              <TextInput
                style={[styles.searchInput, { color: t.textPrimary }]} 
                placeholder="Search reciters…"
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
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: { color: '#ffffff', fontWeight: '600' },
});

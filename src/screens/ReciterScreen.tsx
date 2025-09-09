// ReciterScreen.tsx

import React, { useEffect, useState, useRef } from 'react';
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
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import DatabaseService from '../database/DatabaseService';
import { RootStackParamList, KalaamListResponse } from '../types';
import AppHeader from '../components/AppHeader';

type ReciterRoute = RouteProp<RootStackParamList, 'Reciter'>;
type Nav = StackNavigationProp<RootStackParamList, 'Reciter'>;

// Global state for filter persistence across app session
const globalFilters = new Map<string, string>();

export default function ReciterScreen() {
  const route = useRoute<ReciterRoute>();
  const navigation = useNavigation<Nav>();
  const { reciter } = route.params;

  const [page, setPage] = useState(1);
  const [data, setData] = useState<KalaamListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
  }, [reciter, page, selectedMasaib]);

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

  const load = async () => {
    try {
      setIsLoading(true);
      let result;
      if (selectedMasaib) {
        result = await DatabaseService.getKalaamsByReciterAndMasaib(
          reciter,
          selectedMasaib,
          page,
          limit,
        );
      } else {
        result = await DatabaseService.getKalaamsByReciter(
          reciter,
          page,
          limit,
        );
      }
      setData(result);
      setError(null);
    } catch (e) {
      console.error('Failed to load reciter kalaams', e);
      setError('Error loading nohas. Please try again.');
    } finally {
      setIsLoading(false);
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
    setPage(1);
    toggleFilter();
  };

  const clearFilter = () => {
    setSelectedMasaib(null);
    globalFilters.delete(reciter);
    setPage(1);
  };

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  if (isLoading && !data) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text style={styles.loadingText}>Loading nohas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={load}>
            <Text style={styles.retryButtonText}>Retry</Text>
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader />
      <ScrollView style={styles.scrollView}>
        <View style={styles.headerCard}>
          <View style={styles.headerBanner}>
            <Text style={styles.headerTitle}>
              <MaterialCommunityIcons name="account-music" size={18} />{' '}
              {reciter}
            </Text>
            <Text style={styles.headerSubtitle}>
              {data?.total || 0} nohas by this reciter
            </Text>
          </View>
        </View>

        {/* Active Filter Indicator */}
        {selectedMasaib && (
          <View style={styles.filterChipContainer}>
            <View style={styles.filterChip}>
              <MaterialCommunityIcons name="filter" size={14} color="#16a34a" />
              <Text style={styles.filterChipText}>{selectedMasaib}</Text>
              <TouchableOpacity onPress={clearFilter}>
                <MaterialCommunityIcons
                  name="close"
                  size={16}
                  color="#16a34a"
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.listCard}>
          {!data || isLoading ? (
            <View style={styles.loadingInline}>
              <ActivityIndicator size="small" color="#16a34a" />
              <Text style={styles.loadingText}>Loading nohas...</Text>
            </View>
          ) : data.kalaams.length > 0 ? (
            <View style={styles.listDivider}>
              {data.kalaams.map(k => (
                <TouchableOpacity
                  key={k.id}
                  style={styles.itemRow}
                  onPress={() => navigation.navigate('Kalaam', { id: k.id })}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{k.title}</Text>
                    <View style={styles.metaRow}>
                      {k.poet ? (
                        <View style={styles.metaChip}>
                          <MaterialCommunityIcons
                            name="feather"
                            size={14}
                            color="#6b7280"
                          />
                          <Text style={styles.metaText}>{k.poet}</Text>
                        </View>
                      ) : null}
                      {k.masaib ? (
                        <View style={styles.metaChip}>
                          <MaterialCommunityIcons
                            name="book-open-variant"
                            size={14}
                            color="#6b7280"
                          />
                          <Text style={styles.metaText}>{k.masaib}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={22}
                    color="#9ca3af"
                  />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {selectedMasaib
                  ? `No nohas found for this reciter in "${selectedMasaib}".`
                  : 'No nohas found for this reciter.'}
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
                page === 1 && styles.pageButtonDisabled,
              ]}
            >
              <Text style={styles.pageButtonText}>Prev</Text>
            </TouchableOpacity>
            <Text style={styles.pageIndicator}>
              {page} / {totalPages}
            </Text>
            <TouchableOpacity
              onPress={() => setPage(p => (data && p < totalPages ? p + 1 : p))}
              disabled={!data || page >= totalPages}
              style={[
                styles.pageButton,
                (!data || page >= totalPages) && styles.pageButtonDisabled,
              ]}
            >
              <Text style={styles.pageButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={{ height: 96 }} />
      </ScrollView>

      {/* Floating Filter Button (Feather icon, sleek) */}
      <Animated.View
        style={[
          styles.floatingButton,
          {
            bottom: 48, // constant
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
          style={styles.filterButton}
          onPress={toggleFilter}
          activeOpacity={0.85}
        >
          <Feather name="filter" size={22} color="#111827" />
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
        <View style={styles.overlayInner}>
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
                <View style={styles.resultIconWrap}>
                  <MaterialCommunityIcons
                    name="book-open-variant"
                    size={16}
                    color="#16a34a"
                  />
                </View>
                <Text style={styles.resultTitle} numberOfLines={1}>
                  {item}
                </Text>
                {selectedMasaib === item && (
                  <MaterialCommunityIcons
                    name="check"
                    size={18}
                    color="#16a34a"
                  />
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <MaterialCommunityIcons
                  name="magnify"
                  size={24}
                  color="#9ca3af"
                />
                <Text style={styles.emptyText}>No masaib found</Text>
              </View>
            }
          />

          {/* Search bar pinned at bottom of the overlay */}
          <View style={styles.searchFooter}>
            <View style={styles.searchInputContainer}>
              <MaterialCommunityIcons
                name="magnify"
                size={20}
                color="#6b7280"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search masaib…"
                placeholderTextColor="#9ca3af"
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
              <MaterialCommunityIcons name="close" size={22} color="#6b7280" />
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
});

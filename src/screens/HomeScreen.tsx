import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  TextInput,
  Dimensions,
  Platform,
  Keyboard,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import AppHeader from '../components/AppHeader';
import { useThemeTokens, useSettings } from '../context/SettingsContext';
import databaseService from '../database/DatabaseFactory';
import {
  RootStackParamList,
  MasaibGroup,
  PoetGroup,
  ReciterGroup,
} from '../types';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;
type BrowseCategory = 'masaib' | 'poet' | 'reciter';

const SLIDES = [
  { key: 'masaib', icon: 'book-open-variant', label: 'Masaib' },
  { key: 'poet', icon: 'feather', label: 'Poet' },
  { key: 'reciter', icon: 'account-music', label: 'Reciter' },
] as const;

const { width: SCREEN_W } = Dimensions.get('window');
// Animated FlatList
const AFlatList = Animated.createAnimatedComponent(
  require('react-native').FlatList as any,
);

function Ring({
  size = 36,
  color = '#16a34a',
}: {
  size?: number;
  color?: string;
}) {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);
  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const thickness = Math.max(2, Math.floor(size / 12));
  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        transform: [{ rotate }],
        borderWidth: thickness,
        borderColor: '#e5e7eb',
        borderRightColor: color,
        borderTopColor: color,
      }}
    />
  );
}

function PressableCard({
  children,
  onPress,
  disabled,
}: {
  children: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View
      style={{ transform: [{ scale }], opacity: disabled ? 0.6 : 1 }}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        disabled={disabled}
        onPressIn={() =>
          Animated.spring(scale, {
            toValue: 0.98,
            useNativeDriver: true,
            friction: 6,
          }).start()
        }
        onPressOut={() =>
          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            friction: 6,
          }).start()
        }
        onPress={onPress}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const t = useThemeTokens();
  const { accentColor } = useSettings();

  const [browseCategory, setBrowseCategory] =
    useState<BrowseCategory>('masaib');
  const [masaibGroups, setMasaibGroups] = useState<MasaibGroup[] | null>(null);
  const [poetGroups, setPoetGroups] = useState<PoetGroup[] | null>(null);
  const [reciterGroups, setReciterGroups] = useState<ReciterGroup[] | null>(
    null,
  );
  const [initLoading, setInitLoading] = useState(true);
  const [navigating, setNavigating] = useState(false);

  // Swipe gesture state
  const tabAnimation = useRef(new Animated.Value(0)).current;
  const currentTabIndex = useRef(0);

  // --- Search UI state ---
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchAnim = useRef(new Animated.Value(0)).current; // 0=closed, 1=open
  const inputRef = useRef<TextInput>(null);

  // --- Keyboard-aware FAB offset ---
  const baseFabBottom = React.useMemo(
    () => 48 + Math.max(insets.bottom, 12),
    [insets.bottom],
  );
  const kbAnim = useRef(new Animated.Value(0)).current; // keyboard height

  useEffect(() => {
    const showEvt =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (e: any) => {
      const h = e?.endCoordinates?.height ?? 0;
      Animated.timing(kbAnim, {
        toValue: h,
        duration: Platform.OS === 'ios' ? e?.duration ?? 250 : 150,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start();
    };
    const onHide = (e: any) => {
      Animated.timing(kbAnim, {
        toValue: 0,
        duration: Platform.OS === 'ios' ? e?.duration ?? 250 : 120,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start();
    };

    const s1 = Keyboard.addListener(showEvt, onShow);
    const s2 = Keyboard.addListener(hideEvt, onHide);
    return () => {
      s1.remove();
      s2.remove();
    };
  }, [kbAnim]);

  useEffect(() => {
    (async () => {
      setInitLoading(true);
      try {
        // Ensure database is initialized
        await databaseService.init();
        
        const [m, p, r] = await Promise.all([
          databaseService.getMasaibGroups(),
          databaseService.getPoetGroups(),
          databaseService.getReciterGroups(),
        ]);
        setMasaibGroups(m);
        setPoetGroups(p);
        setReciterGroups(r);
      } catch (e) {
        console.error('Home init load failed', e);
        setMasaibGroups([]);
        setPoetGroups([]);
        setReciterGroups([]);
      } finally {
        setInitLoading(false);
      }
    })();
  }, []);

  const items = useMemo(() => {
    if (browseCategory === 'masaib') return masaibGroups ?? [];
    if (browseCategory === 'poet') return poetGroups ?? [];
    return reciterGroups ?? [];
  }, [browseCategory, masaibGroups, poetGroups, reciterGroups]);

  // Sync current tab index with browse category
  useEffect(() => {
    const tabIndex = SLIDES.findIndex(slide => slide.key === browseCategory);
    if (tabIndex !== -1) {
      currentTabIndex.current = tabIndex;
      tabAnimation.setValue(tabIndex);
    }
  }, [browseCategory]);

  const labelForItem = (item: MasaibGroup | PoetGroup | ReciterGroup) => {
    if (browseCategory === 'masaib') return (item as MasaibGroup).masaib;
    if (browseCategory === 'poet') return (item as PoetGroup).poet;
    return (item as ReciterGroup).reciter;
  };

  const goToItem = (item: MasaibGroup | PoetGroup | ReciterGroup) => {
    setNavigating(true);
    try {
      if (browseCategory === 'masaib') {
        navigation.navigate('Masaib', { masaib: (item as MasaibGroup).masaib });
      } else if (browseCategory === 'poet') {
        navigation.navigate('Poet', { poet: (item as PoetGroup).poet });
      } else {
        navigation.navigate('Reciter', {
          reciter: (item as ReciterGroup).reciter,
        });
      }
      if (searchOpen) {
        setSearchQuery('');
        toggleSearch(false);
      }
    } finally {
      setTimeout(() => setNavigating(false), 250);
    }
  };

  // Swipe gesture functions
  const switchToTab = (newIndex: number) => {
    if (newIndex < 0 || newIndex >= SLIDES.length) return;
    
    const newCategory = SLIDES[newIndex].key as BrowseCategory;
    setBrowseCategory(newCategory);
    setSearchQuery('');
    currentTabIndex.current = newIndex;
    
    // Animate tab switch
    Animated.timing(tabAnimation, {
      toValue: newIndex,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  };

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
      } else {
        // Snap back to current position
        Animated.timing(tabAnimation, {
          toValue: currentTabIndex.current,
          duration: 200,
          useNativeDriver: false,
        }).start();
      }
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <PressableCard onPress={() => goToItem(item)} disabled={navigating}>
      <View style={[styles.listItem, { backgroundColor: t.surface }]}>
        <View style={[styles.itemIconWrap, { backgroundColor: t.accentSubtle }]}>
          <MaterialCommunityIcons
            name={
              browseCategory === 'masaib'
                ? 'book-open-variant'
                : browseCategory === 'poet'
                ? 'feather'
                : 'account-music'
            }
            size={18}
            color={accentColor}
          />
        </View>
        <View style={styles.itemContent}>
          <Text style={[styles.itemName, { color: t.textPrimary }]} numberOfLines={2}>
            {labelForItem(item)}
          </Text>
          <Text style={[styles.itemCount, { color: t.textMuted }]}>{item.count} nohas</Text>
        </View>
        <MaterialCommunityIcons
          name="chevron-right"
          size={22}
          color={t.textMuted}
        />
      </View>
    </PressableCard>
  );

  // ---- Filter main list instead of dropdown ----
  const displayedItems = useMemo(() => {
    const src = items || [];
    const q = searchQuery.trim().toLowerCase();
    if (!searchOpen || q.length === 0) return src;
    return src.filter((it: any) => labelForItem(it).toLowerCase().includes(q));
  }, [items, searchOpen, searchQuery, browseCategory]);

  // ---- Search UI animations ----
  const toggleSearch = (open?: boolean) => {
    const next = open ?? !searchOpen;
    setSearchOpen(next);
    Animated.timing(searchAnim, {
      toValue: next ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false, // animating width/radius
    }).start(({ finished }) => {
      if (finished && next) {
        setTimeout(() => inputRef.current?.focus(), 10);
      } else if (!next) {
        Keyboard.dismiss();
      }
    });
  };

  const barWidth = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [56, Math.max(280, SCREEN_W - 32)],
  });
  const barRadius = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [28, 14],
  });
  const barPaddingH = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 12],
  });
  const iconRotate = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  // --- Parallax “Browse by” + sticky chips ---
  const scrollY = useRef(new Animated.Value(0)).current;
  const BROWSE_LABEL_H = 36; // green chip height
  const BROWSE_LABEL_GAP = 8; // gap below it
  const BROWSE_TOTAL = BROWSE_LABEL_H + BROWSE_LABEL_GAP;

  if (initLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: t.background }]}>
        <AppHeader />
        <View style={styles.centerFill}>
          <Ring size={44} color={accentColor} />
          <Text style={[styles.loadingText, { color: t.textSecondary }]}>Loading Pursadari…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: t.background }]} edges={['top']}>
      <AppHeader />

      <View style={styles.contentWrap}>
        {/* Animated, absolute "Browse by" that slides up and hides */}
        <Animated.View
          style={[
            styles.browseLabelAbs,
            {
              transform: [
                {
                  translateY: scrollY.interpolate({
                    inputRange: [0, BROWSE_TOTAL],
                    outputRange: [0, -BROWSE_TOTAL],
                    extrapolateRight: 'clamp',
                  }),
                },
              ],
              opacity: scrollY.interpolate({
                inputRange: [0, BROWSE_TOTAL * 0.6, BROWSE_TOTAL],
                outputRange: [1, 0.2, 0],
                extrapolateRight: 'clamp',
              }),
            },
          ]}
        >
          <View style={[styles.browseChip, { backgroundColor: accentColor }]}>
            <MaterialCommunityIcons
              name={
                browseCategory === 'masaib'
                  ? 'book-open-variant'
                  : browseCategory === 'poet'
                  ? 'feather'
                  : 'account-music'
              }
              size={16}
              color={t.accentOnAccent}
            />
            <Text style={[styles.browseLabel, { color: t.accentOnAccent }]}>Browse by:</Text>
          </View>
        </Animated.View>

        <PanGestureHandler
          onHandlerStateChange={onSwipeGesture}
          onGestureEvent={onSwipeGesture}
          activeOffsetX={[-10, 10]}
          failOffsetY={[-5, 5]}
        >
          <Animated.View style={{ flex: 1 }}>
        <AFlatList
          data={displayedItems}
          keyExtractor={(it, idx) =>
            (it.masaib ?? it.poet ?? it.reciter ?? idx).toString()
          }
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContainer,
            { paddingTop: BROWSE_TOTAL + 8, paddingBottom: baseFabBottom + 88 },
          ]}
          ListHeaderComponent={
                <View style={[styles.tabsRow, { backgroundColor: t.background }]}>
              {SLIDES.map(s => {
                const active = browseCategory === s.key;
                return (
                  <TouchableOpacity
                    key={s.key}
                    activeOpacity={0.85}
                    onPress={() => {
                          const tabIndex = SLIDES.findIndex(slide => slide.key === s.key);
                          switchToTab(tabIndex);
                        }}
                        style={[
                          styles.tabPill,
                          { backgroundColor: t.surface, borderColor: t.border },
                          active && { backgroundColor: accentColor, borderColor: accentColor },
                        ]}
                  >
                    <MaterialCommunityIcons
                      name={s.icon}
                      size={18}
                          color={active ? t.accentOnAccent : t.textPrimary}
                    />
                    <Text
                      style={[
                        styles.tabPillText,
                            { color: t.textPrimary },
                            active && { color: t.accentOnAccent },
                      ]}
                    >
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          }
          stickyHeaderIndices={[0]}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true },
          )}
          showsVerticalScrollIndicator={false}
          windowSize={7}
          initialNumToRender={20}
          maxToRenderPerBatch={20}
          updateCellsBatchingPeriod={50}
          removeClippedSubviews
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <MaterialCommunityIcons
                name={searchOpen && searchQuery ? 'magnify' : 'database-off'}
                size={22}
                    color={t.textMuted}
              />
                  <Text style={[styles.emptyText, { color: t.textMuted }]}>
                {searchOpen && searchQuery ? 'No matches' : 'No results'}
              </Text>
            </View>
          }
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.select({
            ios: 'interactive',
            android: 'on-drag',
            default: 'none',
          })}
        />
          </Animated.View>
        </PanGestureHandler>
      </View>

      {navigating && (
        <View style={styles.blockOverlay}>
          <Ring size={40} color={accentColor} />
        </View>
      )}

      {/* ---------- Floating Search (keyboard-aware) ---------- */}
      <Animated.View
        pointerEvents="box-none"
        style={[
          styles.fabWrap,
          {
            bottom: Animated.add(
              kbAnim,
              new Animated.Value(baseFabBottom + 20),
            ),
          },
        ]}
      >
        <Animated.View
          style={[
            styles.searchBar,
            {
              width: barWidth,
              borderRadius: barRadius,
              paddingHorizontal: barPaddingH,
              backgroundColor: t.surface,
              borderColor: t.border,
            },
          ]}
        >
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={searchOpen ? 'Close search' : 'Open search'}
            onPress={() => {
              if (searchOpen && !searchQuery) return toggleSearch(false);
              toggleSearch();
            }}
            activeOpacity={0.85}
            style={styles.searchIconBtn}
          >
            <Animated.View style={{ transform: [{ rotate: iconRotate }] }}>
              <MaterialCommunityIcons
                name={searchOpen ? 'close' : 'magnify'}
                size={22}
                color={t.textPrimary}
              />
            </Animated.View>
          </TouchableOpacity>

          {searchOpen && (
            <TextInput
              ref={inputRef}
              style={[styles.searchInput, { color: t.textPrimary, backgroundColor: t.surface }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={`Search ${
                browseCategory === 'poet'
                  ? 'Poets'
                  : browseCategory === 'masaib'
                  ? 'Masaib'
                  : 'Reciters'
              }…`}
              placeholderTextColor={t.textMuted}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
              selectionColor={accentColor}
            />
          )}
        </Animated.View>
      </Animated.View>
      {/* ---------- /Floating Search ---------- */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 14, fontSize: 16 },

  // container for list + parallax header
  contentWrap: { flex: 1, position: 'relative' },

  // Absolute "Browse by" that slides away
  browseLabelAbs: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingTop: 8,
    zIndex: 10,
  },

  browseChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    gap: 8,
  },
  browseLabel: { color: '#ffffff', fontWeight: '700' },

  tabsRow: {
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
  },
  tabPillActive: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  tabPillText: { fontSize: 15, fontWeight: '700', color: '#111827' },
  tabPillTextActive: { color: '#ffffff' },

  listContainer: { paddingHorizontal: 16 },

  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemContent: { flex: 1 },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 3,
  },
  itemCount: { fontSize: 13, color: '#6b7280' },

  emptyWrap: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: { marginTop: 8, color: '#9ca3af', fontSize: 14 },

  blockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(249,250,251,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* --- Floating search --- */
  fabWrap: {
    position: 'absolute',
    right: 16,
    left: 16,
  },
  searchBar: {
    position: 'absolute',
    right: 0,
    height: 56,
    borderWidth: 1,
    alignItems: 'center',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  searchIconBtn: {
    height: 56,
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    flex: 1,
    height: 56,
    paddingHorizontal: 8,
    fontSize: 16,
    color: '#111827',
  },
});

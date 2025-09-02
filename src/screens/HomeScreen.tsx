import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import AppHeader from '../components/AppHeader';
import DatabaseService from '../database/DatabaseService';
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
  // const insets = useSafeAreaInsets();

  const [browseCategory, setBrowseCategory] =
    useState<BrowseCategory>('masaib');
  const [masaibGroups, setMasaibGroups] = useState<MasaibGroup[] | null>(null);
  const [poetGroups, setPoetGroups] = useState<PoetGroup[] | null>(null);
  const [reciterGroups, setReciterGroups] = useState<ReciterGroup[] | null>(
    null,
  );
  const [initLoading, setInitLoading] = useState(true);
  const [navigating, setNavigating] = useState(false);

  useEffect(() => {
    (async () => {
      setInitLoading(true);
      try {
        const [m, p, r] = await Promise.all([
          DatabaseService.getMasaibGroups(),
          DatabaseService.getPoetGroups(),
          DatabaseService.getReciterGroups(),
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
    } finally {
      setTimeout(() => setNavigating(false), 250);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <PressableCard onPress={() => goToItem(item)} disabled={navigating}>
      <View style={styles.listItem}>
        <View style={styles.itemIconWrap}>
          <MaterialCommunityIcons
            name={
              browseCategory === 'masaib'
                ? 'book-open-variant'
                : browseCategory === 'poet'
                ? 'feather'
                : 'account-music'
            }
            size={18}
            color="#16a34a"
          />
        </View>
        <View style={styles.itemContent}>
          <Text style={styles.itemName} numberOfLines={2}>
            {browseCategory === 'masaib'
              ? (item as MasaibGroup).masaib
              : browseCategory === 'poet'
              ? (item as PoetGroup).poet
              : (item as ReciterGroup).reciter}
          </Text>
          <Text style={styles.itemCount}>{item.count} nohas</Text>
        </View>
        <MaterialCommunityIcons
          name="chevron-right"
          size={22}
          color="#9ca3af"
        />
      </View>
    </PressableCard>
  );

  if (initLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader />
        <View style={styles.centerFill}>
          <Ring size={44} />
          <Text style={styles.loadingText}>Loading Bayaaz…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader />

      <View style={styles.browseLabelWrap}>
        <View style={styles.browseChip}>
          <MaterialCommunityIcons
            name={
              browseCategory === 'masaib'
                ? 'book-open-variant'
                : browseCategory === 'poet'
                ? 'feather'
                : 'account-music'
            }
            size={16}
            color="#ffffff"
          />
          <Text style={styles.browseLabel}>Browse by:</Text>
        </View>
      </View>

      <View style={styles.tabsRow}>
        {SLIDES.map(s => {
          const active = browseCategory === s.key;
          return (
            <TouchableOpacity
              key={s.key}
              activeOpacity={0.85}
              onPress={() => setBrowseCategory(s.key as BrowseCategory)}
              style={[styles.tabPill, active && styles.tabPillActive]}
            >
              <MaterialCommunityIcons
                name={s.icon}
                size={18}
                color={active ? '#ffffff' : '#111827'}
              />
              <Text
                style={[styles.tabPillText, active && styles.tabPillTextActive]}
              >
                {s.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={items}
        keyExtractor={(it, idx) =>
          (it.masaib ?? it.poet ?? it.reciter ?? idx).toString()
        }
        renderItem={renderItem}
        contentContainerStyle={[styles.listContainer]}
        showsVerticalScrollIndicator={false}
        windowSize={7}
        initialNumToRender={20}
        maxToRenderPerBatch={20}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <MaterialCommunityIcons
              name="database-off"
              size={22}
              color="#9ca3af"
            />
            <Text style={styles.emptyText}>No results</Text>
          </View>
        }
      />

      {navigating && (
        <View style={styles.blockOverlay}>
          <Ring size={40} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 14, fontSize: 16, color: '#374151' },
  browseLabelWrap: { alignItems: 'center', marginTop: 8 },
  browseChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    gap: 8,
  },
  browseLabel: { color: '#ffffff', fontWeight: '700' },
  tabsRow: {
    marginTop: 12,
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
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tabPillActive: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  tabPillText: { fontSize: 15, fontWeight: '700', color: '#111827' },
  tabPillTextActive: { color: '#ffffff' },
  listContainer: { paddingHorizontal: 16 },
  listItem: {
    backgroundColor: '#ffffff',
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
    backgroundColor: '#ecfdf5',
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
});

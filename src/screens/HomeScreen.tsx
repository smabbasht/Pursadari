import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import DatabaseService from '../database/DatabaseService';
import { MasaibGroup, PoetGroup, ReciterGroup } from '../types';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AppHeader from '../components/AppHeader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SLIDES = [
  { key: 'masaib', icon: 'book-open-variant', label: 'Masaib' },
  { key: 'poet', icon: 'feather', label: 'Poet' },
  { key: 'reciter', icon: 'account-music', label: 'Reciter' },
] as const;

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

type BrowseCategory = 'masaib' | 'poet' | 'reciter';

function PressableCard({ children, onPress }: { children: React.ReactNode; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, friction: 6 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6 }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [browseCategory, setBrowseCategory] = useState<BrowseCategory>('masaib');
  const [masaibGroups, setMasaibGroups] = useState<MasaibGroup[]>([]);
  const [poetGroups, setPoetGroups] = useState<PoetGroup[]>([]);
  const [reciterGroups, setReciterGroups] = useState<ReciterGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [slideIndex, setSlideIndex] = useState(0);
  const sliderRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const next = (slideIndex + 1) % SLIDES.length;
      setSlideIndex(next);
      sliderRef.current?.scrollTo({ x: next * (SCREEN_WIDTH - 120), animated: true });
      setBrowseCategory(SLIDES[next].key as BrowseCategory);
    }, 3500);
    return () => clearInterval(interval);
  }, [slideIndex]);

  const onSlideEnd = (x: number) => {
    const width = SCREEN_WIDTH - 120;
    const idx = Math.round(x / width);
    const safeIdx = Math.min(Math.max(idx, 0), SLIDES.length - 1);
    setSlideIndex(safeIdx);
    setBrowseCategory(SLIDES[safeIdx].key as BrowseCategory);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [masaibData, poetData, reciterData] = await Promise.all([
        DatabaseService.getMasaibGroups(),
        DatabaseService.getPoetGroups(),
        DatabaseService.getReciterGroups(),
      ]);
      setMasaibGroups(masaibData);
      setPoetGroups(poetData);
      setReciterGroups(reciterData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBrowseData = () => {
    switch (browseCategory) {
      case 'masaib':
        return masaibGroups;
      case 'poet':
        return poetGroups;
      case 'reciter':
        return reciterGroups;
      default:
        return masaibGroups;
    }
  };

  const getCategoryIcon = (category: BrowseCategory) => {
    switch (category) {
      case 'masaib':
        return 'book-open-variant';
      case 'poet':
        return 'feather';
      case 'reciter':
        return 'account-music';
      default:
        return 'book-open-variant';
    }
  };

  const getCategoryLabel = (category: BrowseCategory) => {
    switch (category) {
      case 'masaib':
        return 'Masaib';
      case 'poet':
        return 'Poet';
      case 'reciter':
        return 'Reciter';
      default:
        return 'Masaib';
    }
  };

  const getItemLink = (item: MasaibGroup | PoetGroup | ReciterGroup) => {
    switch (browseCategory) {
      case 'masaib':
        return () => navigation.navigate('Masaib', { masaib: (item as MasaibGroup).masaib });
      case 'poet':
        return () => navigation.navigate('Poet', { poet: (item as PoetGroup).poet });
      case 'reciter':
        return () => navigation.navigate('Reciter', { reciter: (item as ReciterGroup).reciter });
      default:
        return () => {};
    }
  };

  const getItemName = (item: MasaibGroup | PoetGroup | ReciterGroup) => {
    switch (browseCategory) {
      case 'masaib':
        return (item as MasaibGroup).masaib;
      case 'poet':
        return (item as PoetGroup).poet;
      case 'reciter':
        return (item as ReciterGroup).reciter;
      default:
        return '';
    }
  };

  const getItemCount = (item: MasaibGroup | PoetGroup | ReciterGroup) => {
    return item.count;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text style={styles.loadingText}>Loading NauhaArchive...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader />

      <View style={styles.browseLabelWrap}>
        <View style={styles.browseChip}>
          <MaterialCommunityIcons name="book-open-variant" size={16} color="#ffffff" />
          <Text style={styles.browseLabel}>Browse by:</Text>
        </View>
      </View>

      {/* Minimal category slider */}
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.categorySlider}
        ref={sliderRef}
        contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 60 }}
        onMomentumScrollEnd={(e) => onSlideEnd(e.nativeEvent.contentOffset.x)}
      >
        {SLIDES.map((s, i) => (
          <TouchableOpacity
            key={s.key}
            activeOpacity={0.85}
            onPress={() => {
              setSlideIndex(i);
              setBrowseCategory(s.key as BrowseCategory);
              sliderRef.current?.scrollTo({ x: i * (SCREEN_WIDTH - 120), animated: true });
            }}
            style={[styles.catPill, i === slideIndex && styles.catPillActive, { width: SCREEN_WIDTH - 120 }]}
          >
            <MaterialCommunityIcons name={s.icon} size={18} color={i === slideIndex ? '#ffffff' : '#111827'} />
            <Text style={[styles.catPillText, i === slideIndex && styles.catPillTextActive]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={styles.dotsRow}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === slideIndex && styles.dotActive]} />
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.listContainer}>
          {getBrowseData().map((item, index) => (
            <PressableCard key={index} onPress={getItemLink(item)}>
              <View style={styles.listItem}>
                <View style={styles.itemIconWrap}>
                  <MaterialCommunityIcons name="music" size={18} color="#16a34a" />
                </View>
                <View style={styles.itemContent}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {getItemName(item)}
                  </Text>
                  <Text style={styles.itemCount}>{getItemCount(item)} nohas</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={22} color="#9ca3af" />
              </View>
            </PressableCard>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#374151',
  },
  header: {
    backgroundColor: '#111827',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#0f172a',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 4,
  },
  slider: {
    marginTop: 12,
  },
  categorySlider: {
    marginTop: 12,
    marginBottom: 6,
  },
  slideCard: {
    marginHorizontal: 16,
    backgroundColor: '#16a34a',
    borderRadius: 16,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catPill: {
    height: 56,
    marginHorizontal: 8,
    borderRadius: 28,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 1,
  },
  catPillActive: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  catPillText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  catPillTextActive: {
    color: '#ffffff',
  },
  slideIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  slideTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  slideSubtitle: {
    color: '#e5e7eb',
    marginTop: 4,
  },
  browseSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  browseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  browseTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  activeTab: {
    backgroundColor: '#16a34a',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
    marginTop: 16,
  },
  listContainer: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
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
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 3,
  },
  itemCount: {
    fontSize: 13,
    color: '#6b7280',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#d1d5db',
  },
  dotActive: {
    backgroundColor: '#16a34a',
    width: 18,
  },
  browseLabelWrap: {
    alignItems: 'center',
    marginTop: 8,
  },
  browseChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    gap: 8,
  },
  browseLabel: {
    color: '#ffffff',
    fontWeight: '700',
  },
});

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import AppHeader from '../components/AppHeader';
import { useThemeTokens, useSettings } from '../context/SettingsContext';
import database from '../database/Database';
import { RootStackParamList, Kalaam } from '../types';
import FavoritesService from '../services/FavoritesService';

type Nav = StackNavigationProp<RootStackParamList>;

export default function FavouritesScreen() {
  const t = useThemeTokens();
  const { accentColor } = useSettings();
  const navigation = useNavigation<Nav>();
  const isFocused = useIsFocused();
  const [kalaams, setKalaams] = useState<Kalaam[]>([]);
  const [totalKalaams, setTotalKalaams] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pinnedKalaams, setPinnedKalaams] = useState<Kalaam[]>([]);
  const [pinStates, setPinStates] = useState<Record<number, boolean>>({});
  const limit = 50;
  
  // Pagination states
  const [lastVisibleDoc, setLastVisibleDoc] = useState<any | undefined>(undefined);
  const [nextPageLoading, setNextPageLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (isFocused) {
      load();
    }
  }, [isFocused]);

  const load = async (startDoc?: any, append: boolean = false) => {
    try {
      if (!append) {
        setLoading(true);
      } else {
        setNextPageLoading(true);
      }
      
      const [result, pinned] = await Promise.all([
        FavoritesService.getFavoriteKalaams(limit, startDoc),
        FavoritesService.getPinnedKalaams()
      ]);
      
      if (append) {
        setKalaams(prev => [...prev, ...result.kalaams]);
      } else {
        // Sort kalaams: special content (negative IDs) first, then pinned, then others
        const sortedKalaams = result.kalaams.sort((a, b) => {
          // Special content always comes first
          if (a.id < 0 && b.id >= 0) return -1;
          if (a.id >= 0 && b.id < 0) return 1;
          
          // Within special content, Hadees e Kisa (-1) comes before Ziyarat Ashura (-2)
          if (a.id < 0 && b.id < 0) {
            return a.id - b.id; // -1 comes before -2
          }
          
          // Within non-special content, sort by pinned status
          if (a.id >= 0 && b.id >= 0) {
            const aPinned = pinned.some(p => p.id === a.id);
            const bPinned = pinned.some(p => p.id === b.id);
            if (aPinned && !bPinned) return -1;
            if (!aPinned && bPinned) return 1;
          }
          
          return 0;
        });
        setKalaams(sortedKalaams);
      }
      
      setTotalKalaams(result.total);
      setLastVisibleDoc(result.lastVisibleDoc);
      setHasMore(result.kalaams.length === limit && !!result.lastVisibleDoc);
      setPinnedKalaams(pinned);
      
      // Load pin states for all kalaams
      const pinStates: Record<number, boolean> = {};
      for (const kalaam of result.kalaams) {
        pinStates[kalaam.id] = await FavoritesService.isPinned(kalaam.id);
      }
      setPinStates(pinStates);
    } finally {
      setLoading(false);
      setNextPageLoading(false);
    }
  };

  const togglePin = async (kalaamId: number) => {
    try {
      const isPinned = pinStates[kalaamId];
      
      if (isPinned) {
        await FavoritesService.unpinKalaam(kalaamId);
        setPinStates(prev => ({ ...prev, [kalaamId]: false }));
        setPinnedKalaams(prev => prev.filter(k => k.id !== kalaamId));
      } else {
        const success = await FavoritesService.pinKalaam(kalaamId);
        if (success) {
          setPinStates(prev => ({ ...prev, [kalaamId]: true }));
          // Add to pinned list
          const kalaam = kalaams.find(k => k.id === kalaamId);
          if (kalaam) {
            setPinnedKalaams(prev => [...prev, kalaam]);
          }
        } else {
          // Show error - max pins reached
          console.log('Max pins reached (3)');
        }
      }
      
      // Re-sort the kalaams list to move pinned items to top
      setKalaams(prev => {
        const updatedPinned = isPinned 
          ? pinnedKalaams.filter(k => k.id !== kalaamId)
          : [...pinnedKalaams, kalaams.find(k => k.id === kalaamId)].filter(Boolean);
        
        return prev.sort((a, b) => {
          const aPinned = updatedPinned.some(p => p.id === a.id);
          const bPinned = updatedPinned.some(p => p.id === b.id);
          if (aPinned && !bPinned) return -1;
          if (!aPinned && bPinned) return 1;
          return 0;
        });
      });
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  };

  const remove = async (k: Kalaam) => {
    await FavoritesService.removeFavorite(k.id);
    setKalaams(prev => prev.filter(item => item.id !== k.id));
    setTotalKalaams(prev => prev - 1);
  };

  const handleLoadMore = () => {
    if (hasMore && !nextPageLoading && lastVisibleDoc) {
      load(lastVisibleDoc, true);
    }
  };


  return (
    <SafeAreaView style={[styles.container, { backgroundColor: t.background }]}>
      <AppHeader />
      <ScrollView style={{ flex: 1 }}>
        <View style={styles.headerCard}>
          <View style={[styles.headerBanner, { backgroundColor: accentColor }]}>
            <Text style={[styles.headerTitle, { color: t.accentOnAccent }]}><MaterialCommunityIcons name="heart" size={18} color={t.accentOnAccent} /> Your favourites</Text>
            <Text style={[styles.headerSubtitle, { color: t.accentOnAccent }]}>{totalKalaams} saved nohas</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingInline}>
            <ActivityIndicator size="small" color={accentColor} />
            <Text style={[styles.loadingText, { color: t.textMuted }]}>Loading favourites...</Text>
          </View>
        ) : kalaams.length > 0 ? (
          <View style={[styles.listCard, { backgroundColor: t.surface }]}>
            {kalaams.map((k) => (
              <View key={k.id} style={styles.itemRow}>
                <TouchableOpacity
                  style={{ flex: 1 }}
                  onPress={() => navigation.navigate('Home' as never, { screen: 'Kalaam', params: { id: k.id } } as never)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {k.id < 0 && (
                      <MaterialCommunityIcons name="star" size={16} color={accentColor} />
                    )}
                    <Text style={[styles.itemTitle, { color: t.textPrimary, flex: 1 }]}>{k.title}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    {k.reciter ? (
                      <View style={styles.metaChip}>
                        <MaterialCommunityIcons name="account-music" size={14} color={t.textMuted} />
                        <Text style={[styles.metaText, { color: t.textMuted }]} numberOfLines={1} ellipsizeMode="tail">{k.reciter}</Text>
                      </View>
                    ) : null}
                    {k.poet ? (
                      <View style={styles.metaChip}>
                        <MaterialCommunityIcons name="feather" size={14} color={t.textMuted} />
                        <Text style={[styles.metaText, { color: t.textMuted }]} numberOfLines={1} ellipsizeMode="tail">{k.poet}</Text>
                      </View>
                    ) : null}
                  </View>
                </TouchableOpacity>
                {/* Action buttons for all items */}
                <View style={styles.actionButtons}>
                  {k.id >= 0 ? (
                    // Regular items - functional buttons
                    <>
                      <TouchableOpacity 
                        onPress={() => togglePin(k.id)}
                        style={styles.pinButton}
                      >
                        <MaterialCommunityIcons 
                          name={pinStates[k.id] ? "pin" : "pin-outline"} 
                          size={20} 
                          color={pinStates[k.id] ? accentColor : t.textMuted} 
                        />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => remove(k)}
                        style={styles.removeButton}
                      >
                        <MaterialCommunityIcons name="minus-circle" size={20} color={t.danger} />
                      </TouchableOpacity>
                    </>
                  ) : (
                    // Special content - visual-only buttons
                    <>
                      <View style={styles.pinButton}>
                        <MaterialCommunityIcons 
                          name="pin" 
                          size={20} 
                          color={accentColor} 
                        />
                      </View>
                      <View style={styles.removeButton}>
                        <MaterialCommunityIcons name="heart" size={20} color={accentColor} />
                      </View>
                    </>
                  )}
                </View>
              </View>
            ))}
            {nextPageLoading && (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color={accentColor} />
                <Text style={[styles.loadingText, { color: t.textMuted }]}>Loading more...</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.loadingInline}><Text style={[styles.metaText, { color: t.textMuted }]}>No favourites yet.</Text></View>
        )}

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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  headerCard: { backgroundColor: '#ffffff', borderRadius: 12, margin: 16, overflow: 'hidden', elevation: 2 },
  headerBanner: { backgroundColor: '#16a34a', paddingVertical: 12, paddingHorizontal: 16 },
  headerTitle: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
  headerSubtitle: { color: '#d1fae5', fontSize: 13, marginTop: 4 },
  loadingInline: { padding: 16, alignItems: 'center' },
  loadingText: { color: '#6b7280', marginTop: 4 },
  listCard: { backgroundColor: '#ffffff', borderRadius: 12, marginHorizontal: 16, marginBottom: 16, elevation: 2 },
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomColor: '#f3f4f6', borderBottomWidth: 1 },
  itemTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 },
  metaRow: { flexDirection: 'row', gap: 12 },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#6b7280', marginLeft: 4 },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, paddingVertical: 12 },
  pageButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  pageButtonDisabled: { backgroundColor: '#9ca3af' },
  pageButtonText: { fontWeight: '600' },
  pageIndicator: { marginHorizontal: 12, color: '#6b7280' },
  removeButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  
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

  // Action buttons
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pinButton: {
    padding: 4,
  },
});

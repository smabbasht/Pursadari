import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import AppHeader from '../components/AppHeader';
import { useThemeTokens, useSettings } from '../context/SettingsContext';
import databaseService from '../database/DatabaseFactory';
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
      
      const result = await FavoritesService.getFavoriteKalaams(limit, startDoc);
      
      if (append) {
        setKalaams(prev => [...prev, ...result.kalaams]);
      } else {
        setKalaams(result.kalaams);
      }
      
      setTotalKalaams(result.total);
      setLastVisibleDoc(result.lastVisibleDoc);
      setHasMore(result.kalaams.length === limit && !!result.lastVisibleDoc);
    } finally {
      setLoading(false);
      setNextPageLoading(false);
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
                  <Text style={[styles.itemTitle, { color: t.textPrimary }]}>{k.title}</Text>
                  <View style={styles.metaRow}>
                    {k.reciter ? (
                      <View style={styles.metaChip}>
                        <MaterialCommunityIcons name="account-music" size={14} color={t.textMuted} />
                        <Text style={[styles.metaText, { color: t.textMuted }]}>{k.reciter}</Text>
                      </View>
                    ) : null}
                    {k.poet ? (
                      <View style={styles.metaChip}>
                        <MaterialCommunityIcons name="feather" size={14} color={t.textMuted} />
                        <Text style={[styles.metaText, { color: t.textMuted }]}>{k.poet}</Text>
                      </View>
                    ) : null}
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => remove(k)}>
                  <MaterialCommunityIcons name="delete" size={20} color={t.danger} />
                </TouchableOpacity>
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

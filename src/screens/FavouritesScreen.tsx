import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import AppHeader from '../components/AppHeader';
import { useThemeTokens, useSettings } from '../context/SettingsContext';
import DatabaseService from '../database/DatabaseService';
import { RootStackParamList, KalaamListResponse, Kalaam } from '../types';

type Nav = StackNavigationProp<RootStackParamList>;

export default function FavouritesScreen() {
  const t = useThemeTokens();
  const { accentColor } = useSettings();
  const navigation = useNavigation<Nav>();
  const isFocused = useIsFocused();
  const [data, setData] = useState<KalaamListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 50;

  useEffect(() => {
    if (isFocused) {
      load();
    }
  }, [isFocused, page]);

  const load = async () => {
    try {
      setLoading(true);
      const result = await DatabaseService.getFavouriteKalaams(page, limit);
      setData(result);
    } finally {
      setLoading(false);
    }
  };

  const remove = async (k: Kalaam) => {
    await DatabaseService.removeFavourite(k.id);
    load();
  };

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: t.background }]}>
      <AppHeader />
      <ScrollView style={{ flex: 1 }}>
        <View style={styles.headerCard}>
          <View style={[styles.headerBanner, { backgroundColor: accentColor }]}>
            <Text style={[styles.headerTitle, { color: t.accentOnAccent }]}><MaterialCommunityIcons name="heart" size={18} color={t.accentOnAccent} /> Your favourites</Text>
            <Text style={[styles.headerSubtitle, { color: t.accentOnAccent }]}>{data?.total || 0} saved nohas</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingInline}>
            <ActivityIndicator size="small" color={accentColor} />
            <Text style={[styles.loadingText, { color: t.textMuted }]}>Loading favourites...</Text>
          </View>
        ) : data && data.kalaams.length > 0 ? (
          <View style={[styles.listCard, { backgroundColor: t.surface }]}>
            {data.kalaams.map((k) => (
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
          </View>
        ) : (
          <View style={styles.loadingInline}><Text style={[styles.metaText, { color: t.textMuted }]}>No favourites yet.</Text></View>
        )}

        {data && totalPages > 1 ? (
          <View style={styles.pagination}>
            <TouchableOpacity onPress={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={[styles.pageButton, { backgroundColor: accentColor }, page === 1 && styles.pageButtonDisabled]}>
              <Text style={[styles.pageButtonText, { color: t.accentOnAccent }]}>Prev</Text>
            </TouchableOpacity>
            <Text style={[styles.pageIndicator, { color: t.textMuted }]}>{page} / {totalPages}</Text>
            <TouchableOpacity onPress={() => setPage((p) => (p < totalPages ? p + 1 : p))} disabled={page >= totalPages} style={[styles.pageButton, { backgroundColor: accentColor }, page >= totalPages && styles.pageButtonDisabled]}>
              <Text style={[styles.pageButtonText, { color: t.accentOnAccent }]}>Next</Text>
            </TouchableOpacity>
          </View>
        ) : null}
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
});

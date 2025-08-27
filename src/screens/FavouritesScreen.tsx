import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import AppHeader from '../components/AppHeader';
import DatabaseService from '../database/DatabaseService';
import { RootStackParamList, KalaamListResponse, Kalaam } from '../types';

type Nav = StackNavigationProp<RootStackParamList>;

export default function FavouritesScreen() {
  const navigation = useNavigation<Nav>();
  const [data, setData] = useState<KalaamListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 50;

  useEffect(() => {
    load();
  }, [page]);

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
    <SafeAreaView style={styles.container}>
      <AppHeader />
      <ScrollView style={{ flex: 1 }}>
        <View style={styles.headerCard}>
          <View style={styles.headerBanner}>
            <Text style={styles.headerTitle}><MaterialCommunityIcons name="heart" size={18} /> Your favourites</Text>
            <Text style={styles.headerSubtitle}>{data?.total || 0} saved nohas</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingInline}>
            <ActivityIndicator size="small" color="#16a34a" />
            <Text style={styles.loadingText}>Loading favourites...</Text>
          </View>
        ) : data && data.kalaams.length > 0 ? (
          <View style={styles.listCard}>
            {data.kalaams.map((k) => (
              <View key={k.id} style={styles.itemRow}>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => navigation.navigate('Kalaam', { id: k.id })}>
                  <Text style={styles.itemTitle}>{k.title}</Text>
                  <View style={styles.metaRow}>
                    {k.reciter ? (
                      <View style={styles.metaChip}>
                        <MaterialCommunityIcons name="account-music" size={14} color="#6b7280" />
                        <Text style={styles.metaText}>{k.reciter}</Text>
                      </View>
                    ) : null}
                    {k.poet ? (
                      <View style={styles.metaChip}>
                        <MaterialCommunityIcons name="feather" size={14} color="#6b7280" />
                        <Text style={styles.metaText}>{k.poet}</Text>
                      </View>
                    ) : null}
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => remove(k)}>
                  <MaterialCommunityIcons name="delete" size={20} color="#dc2626" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.loadingInline}><Text style={styles.metaText}>No favourites yet.</Text></View>
        )}

        {data && totalPages > 1 ? (
          <View style={styles.pagination}>
            <TouchableOpacity onPress={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={[styles.pageButton, page === 1 && styles.pageButtonDisabled]}>
              <Text style={styles.pageButtonText}>Prev</Text>
            </TouchableOpacity>
            <Text style={styles.pageIndicator}>{page} / {totalPages}</Text>
            <TouchableOpacity onPress={() => setPage((p) => (p < totalPages ? p + 1 : p))} disabled={page >= totalPages} style={[styles.pageButton, page >= totalPages && styles.pageButtonDisabled]}>
              <Text style={styles.pageButtonText}>Next</Text>
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
  pageButton: { backgroundColor: '#16a34a', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  pageButtonDisabled: { backgroundColor: '#9ca3af' },
  pageButtonText: { color: '#ffffff', fontWeight: '600' },
  pageIndicator: { marginHorizontal: 12, color: '#6b7280' },
});

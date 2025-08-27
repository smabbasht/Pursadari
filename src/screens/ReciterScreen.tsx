import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
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

export default function ReciterScreen() {
  const route = useRoute<ReciterRoute>();
  const navigation = useNavigation<Nav>();
  const { reciter } = route.params;

  const [page, setPage] = useState(1);
  const [data, setData] = useState<KalaamListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const limit = 50;

  useEffect(() => {
    load();
  }, [reciter, page]);

  const load = async () => {
    try {
      setIsLoading(true);
      const result = await DatabaseService.getKalaamsByReciter(reciter, page, limit);
      setData(result);
      setError(null);
    } catch (e) {
      console.error('Failed to load reciter kalaams', e);
      setError('Error loading nohas. Please try again.');
    } finally {
      setIsLoading(false);
    }
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

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader />
      <ScrollView style={styles.scrollView}>
        <View style={styles.headerCard}>
          <View style={styles.headerBanner}>
            <Text style={styles.headerTitle}><MaterialCommunityIcons name="account-music" size={18} /> {reciter}</Text>
            <Text style={styles.headerSubtitle}>{data?.total || 0} nohas by this reciter</Text>
          </View>
        </View>

        <View style={styles.listCard}>
          {!data || isLoading ? (
            <View style={styles.loadingInline}>
              <ActivityIndicator size="small" color="#16a34a" />
              <Text style={styles.loadingText}>Loading nohas...</Text>
            </View>
          ) : data.kalaams.length > 0 ? (
            <View style={styles.listDivider}>
              {data.kalaams.map((k) => (
                <TouchableOpacity key={k.id} style={styles.itemRow} onPress={() => navigation.navigate('Kalaam', { id: k.id })}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{k.title}</Text>
                    <View style={styles.metaRow}>
                      {k.poet ? (
                        <View style={styles.metaChip}>
                          <MaterialCommunityIcons name="feather" size={14} color="#6b7280" />
                          <Text style={styles.metaText}>{k.poet}</Text>
                        </View>
                      ) : null}
                      {k.masaib ? (
                        <View style={styles.metaChip}>
                          <MaterialCommunityIcons name="book-open-variant" size={14} color="#6b7280" />
                          <Text style={styles.metaText}>{k.masaib}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={22} color="#9ca3af" />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}><Text style={styles.emptyText}>No nohas found for this reciter.</Text></View>
          )}
        </View>

        {data && totalPages > 1 ? (
          <View style={styles.pagination}>
            <TouchableOpacity
              onPress={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={[styles.pageButton, page === 1 && styles.pageButtonDisabled]}
            >
              <Text style={styles.pageButtonText}>Prev</Text>
            </TouchableOpacity>
            <Text style={styles.pageIndicator}>{page} / {totalPages}</Text>
            <TouchableOpacity
              onPress={() => setPage((p) => (data && p < totalPages ? p + 1 : p))}
              disabled={!data || page >= totalPages}
              style={[styles.pageButton, (!data || page >= totalPages) && styles.pageButtonDisabled]}
            >
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
  scrollView: { flex: 1 },
  headerCard: { backgroundColor: '#ffffff', borderRadius: 12, margin: 16, overflow: 'hidden', elevation: 2 },
  headerBanner: { backgroundColor: '#16a34a', paddingVertical: 12, paddingHorizontal: 16 },
  headerTitle: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
  headerSubtitle: { color: '#d1fae5', fontSize: 13, marginTop: 4 },
  listCard: { backgroundColor: '#ffffff', borderRadius: 12, marginHorizontal: 16, marginBottom: 16, elevation: 2 },
  loadingInline: { padding: 16, alignItems: 'center' },
  listDivider: { borderTopColor: '#f3f4f6', borderTopWidth: 1 },
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomColor: '#f3f4f6', borderBottomWidth: 1 },
  itemTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 },
  metaRow: { flexDirection: 'row', gap: 12 },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#6b7280', marginLeft: 4 },
  emptyState: { padding: 16, alignItems: 'center' },
  emptyText: { color: '#6b7280' },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, paddingVertical: 12 },
  pageButton: { backgroundColor: '#16a34a', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  pageButtonDisabled: { backgroundColor: '#9ca3af' },
  pageButtonText: { color: '#ffffff', fontWeight: '600' },
  pageIndicator: { marginHorizontal: 12, color: '#6b7280' },
});

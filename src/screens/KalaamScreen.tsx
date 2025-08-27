import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import DatabaseService from '../database/DatabaseService';
import { RootStackParamList, Kalaam } from '../types';
import AppHeader from '../components/AppHeader';

type KalaamRoute = RouteProp<RootStackParamList, 'Kalaam'>;

export default function KalaamScreen() {
  const route = useRoute<KalaamRoute>();
  const { id } = route.params;

  const [kalaam, setKalaam] = useState<Kalaam | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<'english' | 'urdu'>('english');
  const [isFavourite, setIsFavourite] = useState(false);

  useEffect(() => {
    load();
  }, [id]);

  const load = async () => {
    try {
      setIsLoading(true);
      const data = await DatabaseService.getKalaamById(id);
      setKalaam(data);
      const fav = await DatabaseService.isFavourite(id);
      setIsFavourite(fav);
      setError(null);
    } catch (e) {
      console.error('Failed to load kalaam', e);
      setError('Failed to load kalaam');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFavourite = async () => {
    try {
      if (!kalaam) return;
      if (isFavourite) {
        await DatabaseService.removeFavourite(kalaam.id);
        setIsFavourite(false);
      } else {
        await DatabaseService.addFavourite(kalaam.id);
        setIsFavourite(true);
      }
    } catch (e) {
      console.error('Failed to toggle favourite', e);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text style={styles.loadingText}>Loading kalaam...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !kalaam) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Kalaam not found'}</Text>
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
      <ScrollView style={styles.scrollView} contentContainerStyle={{ alignItems: 'center' }}>
        <View style={[styles.card, styles.maxWidth]}>
          <Text style={styles.title}>{kalaam.title}</Text>
          <TouchableOpacity style={styles.favButton} onPress={toggleFavourite}>
            <MaterialCommunityIcons name={isFavourite ? 'heart' : 'heart-outline'} size={20} color={isFavourite ? '#dc2626' : '#6b7280'} />
            <Text style={styles.favButtonText}>{isFavourite ? 'Remove from Favourites' : 'Add to Favourites'}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, styles.maxWidth]}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Reciter:</Text>
            <Text style={styles.detailValue}>{kalaam.reciter || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Poet:</Text>
            <Text style={styles.detailValue}>{kalaam.poet || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Masaib:</Text>
            <Text style={styles.detailValue}>{kalaam.masaib || 'N/A'}</Text>
          </View>
        </View>

        {(kalaam.lyrics_urdu || kalaam.lyrics_eng) ? (
          <View style={[styles.card, styles.maxWidth]}>
            <View style={styles.languageToggle}>
              <TouchableOpacity
                style={[styles.languageButton, language === 'english' && styles.languageButtonActive]}
                onPress={() => setLanguage('english')}
              >
                <Text style={[styles.languageButtonText, language === 'english' && styles.languageButtonTextActive]}>English</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.languageButton, language === 'urdu' && styles.languageButtonActive]}
                onPress={() => setLanguage('urdu')}
              >
                <Text style={[styles.languageButtonText, language === 'urdu' && styles.languageButtonTextActive]}>اردو</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        <View style={[styles.card, styles.maxWidth]}>
          {language === 'english' && kalaam.lyrics_eng ? (
            <Text style={styles.lyricsText}>{kalaam.lyrics_eng}</Text>
          ) : language === 'urdu' && kalaam.lyrics_urdu ? (
            <Text style={[styles.lyricsText, styles.urduText]}>{kalaam.lyrics_urdu}</Text>
          ) : (
            <Text style={styles.noLyricsText}>
              {language === 'english' ? 'English lyrics not available.' : 'اردو کے بول دستیاب نہیں ہیں۔'}
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scrollView: { flex: 1, paddingVertical: 16 },
  maxWidth: { width: '92%', maxWidth: 720 },
  card: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827', textAlign: 'center', marginBottom: 8 },
  favButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', backgroundColor: '#f3f4f6', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginTop: 8 },
  favButtonText: { marginLeft: 6, color: '#374151', fontWeight: '600' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  detailLabel: { fontSize: 16, fontWeight: '600', color: '#374151' },
  detailValue: { fontSize: 16, color: '#6b7280', textAlign: 'right', flex: 1, marginLeft: 16 },
  languageToggle: { flexDirection: 'row', backgroundColor: '#f3f4f6', borderRadius: 25, padding: 4 },
  languageButton: { flex: 1, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 21, alignItems: 'center' },
  languageButtonActive: { backgroundColor: '#16a34a' },
  languageButtonText: { fontSize: 16, fontWeight: '600', color: '#6b7280' },
  languageButtonTextActive: { color: '#ffffff' },
  lyricsText: { fontSize: 16, lineHeight: 24, color: '#111827' },
  urduText: { textAlign: 'right', writingDirection: 'rtl' },
  noLyricsText: { fontSize: 16, color: '#6b7280', textAlign: 'center', fontStyle: 'italic' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#6b7280' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { fontSize: 16, color: '#dc2626', textAlign: 'center', marginBottom: 16 },
  retryButton: { backgroundColor: '#16a34a', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  retryButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
});

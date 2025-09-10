import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Share,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { WebView } from 'react-native-webview';
import { useSettings } from '../context/SettingsContext';

import DatabaseService from '../database/DatabaseService';
import { RootStackParamList, Kalaam } from '../types';
import AppHeader from '../components/AppHeader';

type KalaamRoute = RouteProp<RootStackParamList, 'Kalaam'>;

function toYouTubeEmbed(url?: string): string {
  if (!url) return 'about:blank';
  try {
    const u = new URL(url);
    const host = u.hostname.replace('www.', '');
    if (host === 'youtu.be') {
      return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    }
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${v}`;
      if (u.pathname.startsWith('/embed/')) return url;
    }
    return url;
  } catch {
    return 'about:blank';
  }
}

export default function KalaamScreen() {
  const insets = useSafeAreaInsets();

  const route = useRoute<KalaamRoute>();
  const { id } = route.params;

  const [kalaam, setKalaam] = useState<Kalaam | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<'english' | 'urdu'>('english');
  const [isFavourite, setIsFavourite] = useState(false);
  const screenWidth = Dimensions.get('window').width;
  const { engFont, urduFont, engFontScale, urduFontScale } = useSettings();

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

  const onShare = async () => {
    if (!kalaam) return;
    const text =
      `${kalaam.title}\n\n` +
      (kalaam.reciter ? `Reciter: ${kalaam.reciter}\n` : '') +
      (kalaam.poet ? `Poet: ${kalaam.poet}\n\n` : '') +
      (kalaam.yt_link ? `\n${kalaam.yt_link}\n\n` : '') +
      (kalaam.lyrics_eng ? `Lyrics: \n\n${kalaam.lyrics_eng}\n\n` : '') +
      (kalaam.lyrics_urdu ? `\n${kalaam.lyrics_urdu}` : '');
    try {
      await Share.share({
        title: kalaam.title,
        message: text,
        url: kalaam.yt_link || undefined,
      });
    } catch {}
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          alignItems: 'center',
          paddingBottom: (insets.bottom || 8) + 16,
        }}
      >
        <View style={[styles.card, styles.maxWidth]}>
          <Text style={styles.title}>{kalaam.title}</Text>
          <TouchableOpacity style={styles.favButton} onPress={toggleFavourite}>
            <MaterialCommunityIcons
              name={isFavourite ? 'heart' : 'heart-outline'}
              size={20}
              color={isFavourite ? '#dc2626' : '#6b7280'}
            />
            <Text style={styles.favButtonText}>
              {isFavourite ? 'Remove from Favourites' : 'Add to Favourites'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, styles.maxWidth]}>
          <View style={styles.metaColumn}>
            <View style={styles.metaRowLine}>
              <Text style={styles.metaLabel}>Reciter:</Text>
              <View style={styles.metaChipFull}>
                <MaterialCommunityIcons
                  name="account-music"
                  size={16}
                  color="#6b7280"
                />
                <Text style={styles.metaText}>{kalaam.reciter || 'N/A'}</Text>
              </View>
            </View>
            <View style={styles.metaRowLine}>
              <Text style={styles.metaLabel}>Poet:</Text>
              <View style={styles.metaChipFull}>
                <MaterialCommunityIcons
                  name="feather"
                  size={16}
                  color="#6b7280"
                />
                <Text style={styles.metaText}>{kalaam.poet || 'N/A'}</Text>
              </View>
            </View>
            <View style={styles.metaRowLine}>
              <Text style={styles.metaLabel}>Masaib:</Text>
              <View style={styles.metaChipFull}>
                <MaterialCommunityIcons
                  name="book-open-variant"
                  size={16}
                  color="#6b7280"
                />
                <Text style={styles.metaText}>{kalaam.masaib || 'N/A'}</Text>
              </View>
            </View>
          </View>
        </View>

        {kalaam.yt_link ? (
          <View style={[styles.card, styles.maxWidth, { overflow: 'hidden' }]}>
            <View
              style={{
                width: '100%',
                aspectRatio: 16 / 9,
                borderRadius: 8,
                overflow: 'hidden',
              }}
            >
              <WebView
                source={{ uri: toYouTubeEmbed(kalaam.yt_link) }}
                allowsFullscreenVideo={true}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                scalesPageToFit={true}
                mediaPlaybackRequiresUserAction={false}
                allowsInlineMediaPlayback={true}
                originWhitelist={['*']}
                style={{ backgroundColor: '#000000' }}
                onError={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent;
                  console.warn('WebView error: ', nativeEvent);
                }}
                onHttpError={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent;
                  console.warn('WebView HTTP error: ', nativeEvent);
                }}
              />
            </View>
          </View>
        ) : null}

        {kalaam.lyrics_urdu || kalaam.lyrics_eng ? (
          <View style={[styles.maxWidth, styles.flatSection]}>
            <View style={styles.languageToggle}>
              <TouchableOpacity
                style={[
                  styles.languageButton,
                  language === 'english' && styles.languageButtonActive,
                ]}
                onPress={() => setLanguage('english')}
              >
                <Text
                  style={[
                    styles.languageButtonText,
                    language === 'english' && styles.languageButtonTextActive,
                  ]}
                >
                  English
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.languageButton,
                  language === 'urdu' && styles.languageButtonActive,
                ]}
                onPress={() => setLanguage('urdu')}
              >
                <Text
                  style={[
                    styles.languageButtonText,
                    language === 'urdu' && styles.languageButtonTextActive,
                  ]}
                >
                  اردو
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        <View style={[styles.card, styles.maxWidth]}>
          {language === 'english' && kalaam.lyrics_eng ? (
            <Text
              style={[
                styles.lyricsText,
                styles.centeredText,
                { 
                  fontSize: 16 * engFontScale, 
                  lineHeight: 26 * engFontScale,
                  fontFamily: engFont === 'System' ? undefined : engFont,
                },
              ]}
            >
              {kalaam.lyrics_eng}
            </Text>
          ) : language === 'urdu' && kalaam.lyrics_urdu ? (
            <Text
              style={[
                styles.lyricsText,
                styles.urduText,
                styles.centeredText,
                { 
                  fontSize: 16 * urduFontScale, 
                  lineHeight: 26 * urduFontScale,
                  fontFamily: urduFont === 'System' ? undefined : urduFont,
                },
              ]}
            >
              {kalaam.lyrics_urdu}
            </Text>
          ) : (
            <Text style={styles.noLyricsText}>
              {language === 'english'
                ? 'English lyrics not available.'
                : 'اردو کے بول دستیاب نہیں ہیں۔'}
            </Text>
          )}
        </View>

        {/* Share button moved inside ScrollView at the bottom */}
        <View style={[styles.maxWidth, styles.shareContainer]}>
          <TouchableOpacity
            style={styles.shareBtn}
            onPress={onShare}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="share-variant"
              size={18}
              color="#16a34a"
            />
            <Text style={styles.shareBtnText}>Share Lyrics</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scrollView: { flex: 1, paddingVertical: 16 },
  maxWidth: { width: '92%', maxWidth: 720 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  favButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  favButtonText: { marginLeft: 6, color: '#374151', fontWeight: '600' },
  metaColumn: { gap: 8 },
  metaRowLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  metaLabel: { fontWeight: '700', color: '#374151' },
  metaChipFull: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  metaText: { marginLeft: 6, color: '#374151' },
  flatSection: {
    backgroundColor: 'transparent',
    paddingTop: 4,
    paddingBottom: 8,
  },
  languageToggle: {
    alignSelf: 'center',
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 9999,
    padding: 3,
  },
  languageButton: {
    minWidth: 90,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 9999,
    alignItems: 'center',
  },
  languageButtonActive: { backgroundColor: '#16a34a' },
  languageButtonText: { fontSize: 13, fontWeight: '700', color: '#6b7280' },
  languageButtonTextActive: { color: '#ffffff' },
  lyricsText: { fontSize: 16, lineHeight: 26, color: '#111827' },
  centeredText: { textAlign: 'center' },
  urduText: { textAlign: 'right', writingDirection: 'rtl' },
  noLyricsText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#6b7280' },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  shareContainer: {
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 0,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  shareBtnText: {
    marginLeft: 8,
    color: '#16a34a',
    fontWeight: '600',
    fontSize: 16,
  },
});

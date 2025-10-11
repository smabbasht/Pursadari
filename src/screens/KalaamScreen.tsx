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
import { useRoute, useNavigation } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import YoutubePlayer from 'react-native-youtube-iframe';
import { WebView } from 'react-native-webview';
import { useSettings, useThemeTokens } from '../context/SettingsContext';

import database from '../database/Database';
import FavoritesService from '../services/FavoritesService';
import { RootStackParamList, Kalaam } from '../types';
import AppHeader from '../components/AppHeader';

type KalaamRoute = RouteProp<RootStackParamList, 'Kalaam'>;

function extractYouTubeVideoId(url?: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = (u as any).hostname.replace('www.', '');
    
    if (host === 'youtu.be') {
      return (u as any).pathname.slice(1);
    } else if (host === 'youtube.com' || host === 'm.youtube.com') {
      const videoId = (u as any).searchParams.get('v');
      if (videoId) return videoId;
      
      // Handle embed URLs
      if ((u as any).pathname.startsWith('/embed/')) {
        const embedMatch = (u as any).pathname.match(/\/embed\/([^/?]+)/);
        return embedMatch ? embedMatch[1] : null;
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

function createYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=0&controls=1&showinfo=0&fs=1&cc_load_policy=0&iv_load_policy=3&autohide=0&enablejsapi=1&playsinline=1&origin=${encodeURIComponent('https://www.youtube.com')}&widget_referrer=${encodeURIComponent('https://www.youtube.com')}`;
}

export default function KalaamScreen() {
  const insets = useSafeAreaInsets();
  const t = useThemeTokens();
  const { accentColor } = useSettings();
  const navigation = useNavigation();

  const route = useRoute<KalaamRoute>();
  const { id } = route.params;

  const [kalaam, setKalaam] = useState<Kalaam | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavourite, setIsFavourite] = useState(false);
  const screenWidth = Dimensions.get('window').width;
  const { 
    engFont, 
    urduFont, 
    engFontScale, 
    urduFontScale,
    defaultLanguage,
    setDefaultLanguage
  } = useSettings();

  // Current language selection (derived from settings)
  const language = defaultLanguage;

  useEffect(() => {
    load();
  }, [id]);

  const load = async () => {
    try {
      setIsLoading(true);
      await database.init();
      const data = await database.getKalaamById(id);
      setKalaam(data);
      const fav = await FavoritesService.isFavorite(id);
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
        await FavoritesService.removeFavorite(kalaam.id);
        setIsFavourite(false);
      } else {
        await FavoritesService.addFavorite(kalaam.id);
        setIsFavourite(true);
      }
    } catch (e) {
      console.error('Failed to toggle favourite', e);
    }
  };

  const navigateToReciter = () => {
    if (kalaam?.reciter) {
      navigation.navigate('Reciter', { reciter: kalaam.reciter });
    }
  };

  const navigateToPoet = () => {
    if (kalaam?.poet) {
      navigation.navigate('Poet', { poet: kalaam.poet });
    }
  };

  const navigateToMasaib = () => {
    if (kalaam?.masaib) {
      navigation.navigate('Masaib', { masaib: kalaam.masaib });
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: t.background }]}>
        <AppHeader />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={accentColor} />
          <Text style={[styles.loadingText, { color: t.textMuted }]}>Loading kalaam...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !kalaam) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: t.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: t.danger }]}>{error || 'Kalaam not found'}</Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: accentColor }]} onPress={() => load()}>
            <Text style={[styles.retryButtonText, { color: t.accentOnAccent }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: t.background }]} edges={['top']}>
      <AppHeader />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          alignItems: 'center',
          paddingBottom: (insets.bottom || 8) + 16,
        }}
      >
        <View style={[styles.card, styles.maxWidth, { backgroundColor: t.surface }]}>
          <Text style={[styles.title, { color: t.textPrimary }]}>{kalaam.title}</Text>
          {/* Hide favorite button for special content (Hadees e Kisa, Ziyarat Ashura) */}
          {kalaam.id >= 0 && (
            <TouchableOpacity style={[styles.favButton, { backgroundColor: t.divider }]} onPress={toggleFavourite}>
              <MaterialCommunityIcons
                name={isFavourite ? 'heart' : 'heart-outline'}
                size={20}
                color={isFavourite ? t.danger : t.textMuted}
              />
              <Text style={[styles.favButtonText, { color: t.textSecondary }]}>
                {isFavourite ? 'Remove from Favourites' : 'Add to Favourites'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Hide metadata for special content (Hadees e Kisa, Ziyarat Ashura) */}
        {kalaam.id >= 0 && (
          <View style={[styles.card, styles.maxWidth, { backgroundColor: t.surface }]}>
            <View style={styles.metaColumn}>
            <TouchableOpacity 
              style={styles.metaRowLine} 
              onPress={navigateToReciter}
              disabled={!kalaam.reciter}
            >
              <Text style={[styles.metaLabel, { color: t.textSecondary }]}>Reciter:</Text>
              <View style={[
                styles.metaChipFull, 
                { 
                  backgroundColor: kalaam.reciter ? t.divider : t.border,
                  opacity: kalaam.reciter ? 1 : 0.5
                }
              ]}>
                <MaterialCommunityIcons
                  name="account-music"
                  size={16}
                  color={t.textMuted}
                />
                <Text style={[styles.metaText, { color: t.textSecondary }]}>{kalaam.reciter || 'N/A'}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.metaRowLine} 
              onPress={navigateToPoet}
              disabled={!kalaam.poet}
            >
              <Text style={[styles.metaLabel, { color: t.textSecondary }]}>Poet:</Text>
              <View style={[
                styles.metaChipFull, 
                { 
                  backgroundColor: kalaam.poet ? t.divider : t.border,
                  opacity: kalaam.poet ? 1 : 0.5
                }
              ]}>
                <MaterialCommunityIcons
                  name="feather"
                  size={16}
                  color={t.textMuted}
                />
                <Text style={[styles.metaText, { color: t.textSecondary }]}>{kalaam.poet || 'N/A'}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.metaRowLine} 
              onPress={navigateToMasaib}
              disabled={!kalaam.masaib}
            >
              <Text style={[styles.metaLabel, { color: t.textSecondary }]}>Masaib:</Text>
              <View style={[
                styles.metaChipFull, 
                { 
                  backgroundColor: kalaam.masaib ? t.divider : t.border,
                  opacity: kalaam.masaib ? 1 : 0.5
                }
              ]}>
                <MaterialCommunityIcons
                  name="book-open-variant"
                  size={16}
                  color={t.textMuted}
                />
                <Text style={[styles.metaText, { color: t.textSecondary }]}>{kalaam.masaib || 'N/A'}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
        )}

        {kalaam.yt_link ? (
          <View style={[styles.card, styles.maxWidth, { overflow: 'hidden', backgroundColor: t.surface }]}>
            <View
              style={{
                width: '100%',
                aspectRatio: 16 / 9,
                borderRadius: 8,
                overflow: 'hidden',
              }}
            >
              {(() => {
                const videoId = extractYouTubeVideoId(kalaam.yt_link);
                console.log('YouTube URL:', kalaam.yt_link);
                console.log('Extracted Video ID:', videoId);
                
                if (!videoId) {
                  return (
                    <View style={{ 
                      flex: 1, 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      backgroundColor: t.divider
                    }}>
                      <Text style={{ color: t.textMuted, textAlign: 'center' }}>
                        Invalid YouTube URL
                      </Text>
                    </View>
                  );
                }
                
                return (
                  <WebView
                    source={{ uri: createYouTubeEmbedUrl(videoId) }}
                    style={{ flex: 1, backgroundColor: '#000000' }}
                    allowsFullscreenVideo={true}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    mediaPlaybackRequiresUserAction={false}
                    allowsInlineMediaPlayback={true}
                    startInLoadingState={true}
                    scalesPageToFit={false}
                    mixedContentMode="compatibility"
                    originWhitelist={['*']}
                    thirdPartyCookiesEnabled={false}
                    sharedCookiesEnabled={false}
                    userAgent="Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
                    onError={(syntheticEvent) => {
                      console.warn('WebView error:', syntheticEvent.nativeEvent);
                      // Handle 153 error specifically
                      if (syntheticEvent.nativeEvent.code === 153) {
                        console.log('YouTube video unavailable or restricted - trying alternative approach');
                      }
                    }}
                    onHttpError={(syntheticEvent) => {
                      console.warn('WebView HTTP error:', syntheticEvent.nativeEvent);
                      if (syntheticEvent.nativeEvent.statusCode === 403) {
                        console.log('YouTube access forbidden - video may be restricted');
                      }
                    }}
                    onLoadEnd={() => {
                      console.log('YouTube WebView loaded successfully');
                    }}
                    onLoadStart={() => {
                      console.log('Loading YouTube WebView...');
                    }}
                    onMessage={(event) => {
                      try {
                        const message = JSON.parse(event.nativeEvent.data);
                        if (message.type === 'youtube_error') {
                          console.log('YouTube player error:', message.error);
                        }
                      } catch (e) {
                        // Ignore non-JSON messages
                      }
                    }}
                    renderError={(errorDomain, errorCode, errorDesc) => {
                      console.log('WebView render error:', errorDomain, errorCode, errorDesc);
                      return (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
                          <Text style={{ color: '#fff', textAlign: 'center', padding: 20 }}>
                            Video unavailable. Error: {errorDesc}
                          </Text>
                        </View>
                      );
                    }}
                  />
                );
              })()}
            </View>
          </View>
        ) : null}

        {kalaam.lyrics_urdu || kalaam.lyrics_eng ? (
          <View style={[styles.maxWidth, styles.flatSection]}>
            <View style={[styles.languageToggle, { backgroundColor: t.divider }]}>
              <TouchableOpacity
                style={[
                  styles.languageButton,
                  language === 'english' && { backgroundColor: accentColor },
                ]}
                onPress={() => setDefaultLanguage('english')}
              >
                <Text
                  style={[
                    styles.languageButtonText,
                    { color: t.textMuted },
                    language === 'english' && { color: t.accentOnAccent },
                  ]}
                >
                  {kalaam.id < 0 ? 'Transliteration' : 'English'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.languageButton,
                  language === 'urdu' && { backgroundColor: accentColor },
                ]}
                onPress={() => setDefaultLanguage('urdu')}
              >
                <Text
                  style={[
                    styles.languageButtonText,
                    { color: t.textMuted },
                    language === 'urdu' && { color: t.accentOnAccent },
                  ]}
                >
                  {kalaam.id < 0 ? 'Arabic' : 'اردو'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        <View style={[styles.card, styles.maxWidth, { backgroundColor: t.surface }]}>
          {language === 'english' && kalaam.lyrics_eng ? (
            <Text
              style={[
                styles.lyricsText,
                styles.centeredText,
                { 
                  fontSize: 16 * engFontScale, 
                  lineHeight: 26 * engFontScale,
                  fontFamily: engFont === 'System' ? undefined : engFont,
                  color: t.textPrimary,
                },
              ]}
            >
              {kalaam.lyrics_eng}
            </Text>
          ) : defaultLanguage === 'urdu' && kalaam.lyrics_urdu ? (
            <Text
              style={[
                styles.lyricsText,
                styles.urduText,
                styles.centeredText,
                { 
                  fontSize: 16 * urduFontScale, 
                  lineHeight: 26 * urduFontScale,
                  fontFamily: urduFont === 'System' ? undefined : urduFont,
                  color: t.textPrimary,
                },
              ]}
            >
              {kalaam.lyrics_urdu}
            </Text>
          ) : (
            <Text style={[styles.noLyricsText, { color: t.textMuted }]}>
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
              color={accentColor}
            />
            <Text style={[styles.shareBtnText, { color: accentColor }]}>Share Lyrics</Text>
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
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: 'hidden',
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
    borderRadius: 20,
    padding: 3,
    overflow: 'hidden',
  },
  languageButton: {
    minWidth: 90,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: 'center',
    overflow: 'hidden',
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

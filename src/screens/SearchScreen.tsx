import AppHeader from '../components/AppHeader';
import { useThemeTokens, useSettings } from '../context/SettingsContext';
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import database from '../database/Database';
import { Kalaam, RootStackParamList } from '../types';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

type Nav = StackNavigationProp<RootStackParamList>;

export default function SearchScreen() {
  const t = useThemeTokens();
  const { accentColor } = useSettings();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Kalaam[]>([]);
  const navigation = useNavigation<Nav>();

  // debounce timer + request token to drop stale responses
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reqIdRef = useRef(0);

  const normalizeRomanUrduQuery = (input: string): string => {
    const VOWELS = 'aeiou';

    // Word-level canonicalizations for ultra-common tokens
    const WORD_EQUIV: Array<[RegExp, string]> = [
      [/\b(main|mein|mei|mn)\b/g, 'mai'],
      [/\b(nahin|nahi|nahee|nai)\b/g, 'nahi'],
      [/\b(hain+)\b/g, 'hain'],
      [/\b(kya|kia|ky[aa])\b/g, 'kya'],
      [/\b(mera+a*h*)\b/g, 'mera'],
    ];

    // Ordered character/digraph rules (apply in sequence)
    const SEQ_RULES: Array<[RegExp, string]> = [
      // drop punctuation, keep spaces
      [/[^\w\s]/g, ' '],

      // digraphs/phones
      [/kh/g, 'x'],
      [/gh/g, 'g'],
      [/zh/g, 'z'],
      [/ph/g, 'f'],
      [/th/g, 't'],
      [/dh/g, 'd'],
      [/bh/g, 'b'],
      [/q/g, 'k'],

      // c → k before a/o/u; c → s before e/i/y
      [/c(?=[aou])/g, 'k'],
      [/c(?=[eiy])/g, 's'],

      // long vowels
      [/aa+/g, 'a'],
      [/(ee+|ii+)/g, 'i'],
      [/oo+/g, 'u'],

      // ai/ei/ay family → ai
      [/(ei|ay)/g, 'ai'],

      // terminal h after a vowel → drop
      [new RegExp(`([${VOWELS}])h\\b`, 'g'), '$1'],

      // collapse repeats: vowels to max 2, consonants to 1
      [new RegExp(`([${VOWELS}])\\1{2,}`, 'g'), '$1$1'],
      [new RegExp(`([^${VOWELS}\\W])\\1+`, 'g'), '$1'],

      // e/i and o/u collapse (after ai handling)
      [/e/g, 'i'],
      [/o/g, 'u'],
    ];

    let s = input.toLowerCase().trim();

    for (const [pat, repl] of WORD_EQUIV) s = s.replace(pat, repl);
    for (const [pat, repl] of SEQ_RULES) s = s.replace(pat, repl);

    // normalize whitespace
    s = s.replace(/\s+/g, ' ').trim();

    return s;
  };

  const runSearch = async (q: string) => {
    // empty query -> clear state, no DB call
    const qTrim = q.trim();
    if (!qTrim) {
      setResults([]);
      setLoading(false);
      return;
    }

    // const qTrim = normalizeRomanUrduQuery(qTrim);

    const myReq = ++reqIdRef.current;
    setLoading(true);
    try {
      const res = await database.searchKalaams(qTrim, 1, 100);
      if (reqIdRef.current === myReq) setResults(res.kalaams);
    } catch (e) {
      // swallow or log; keep UI stable
      console.warn('search error', e);
      if (reqIdRef.current === myReq) setResults([]);
    } finally {
      if (reqIdRef.current === myReq) setLoading(false);
    }
  };

  const onChange = (text: string) => {
    setQuery(text);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => runSearch(text), 250);
  };

  const onSearchPress = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    runSearch(query);
  };

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      reqIdRef.current++; // invalidate inflight
    },
    [],
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: t.background }]}>
      <AppHeader />
      <View style={{ padding: 16 }}>
        <View style={[styles.searchRow, { backgroundColor: t.surface, borderColor: t.border }]}>
          <MaterialCommunityIcons name="magnify" size={22} color={t.textMuted} />
          <TextInput
            placeholder="Search title..."
            style={[styles.input, { color: t.textPrimary, backgroundColor: t.surface }]}
            value={query}
            onChangeText={onChange}
            onSubmitEditing={onSearchPress}
            returnKeyType="search"
            placeholderTextColor={t.textMuted}
            selectionColor={accentColor}
          />
          <TouchableOpacity style={[styles.searchBtn, { backgroundColor: accentColor }]} onPress={onSearchPress}>
            <Text style={[styles.searchBtnText, { color: t.accentOnAccent }]}>Search</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={{ padding: 16 }}>
          <ActivityIndicator color={accentColor} />
        </View>
      ) : (
        <ScrollView style={{ flex: 1, paddingHorizontal: 16 }}>
          {results.map(k => (
            <TouchableOpacity
              key={k.id}
              style={[styles.itemRow, { backgroundColor: t.surface }]}
              onPress={() =>
                navigation.navigate(
                  'Home' as never,
                  { screen: 'Kalaam', params: { id: k.id } } as never,
                )
              }
            >
              <MaterialCommunityIcons name="music" size={18} color={accentColor} />
              <Text style={[styles.itemTitle, { color: t.textPrimary }]} numberOfLines={2}>
                {k.title}
              </Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={22}
                color={t.textMuted}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
  },
  input: { flex: 1, fontSize: 15, color: '#111827' },
  searchBtn: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchBtnText: { fontWeight: '700' },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  itemTitle: { flex: 1, color: '#111827', fontWeight: '600' },
});

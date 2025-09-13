import AppHeader from '../components/AppHeader';
import { useThemeTokens, useSettings } from '../context/SettingsContext';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const FORM_ID = '1FAIpQLSfWWPk7P63MUB4LpyJlU__NdlstEUctI68Qy9LXnRiYbknsgw';
const FORM_ACTION = `https://docs.google.com/forms/d/e/${FORM_ID}/formResponse`;

// Map your Google Form "entry.<id>" keys (from your prefill link) to local fields
const ENTRY = {
  title: 'entry.2061820390',
  reciter: 'entry.647295075',
  poet: 'entry.1880082884',
  masaib: 'entry.36781146',
  lyricsEng: 'entry.1876937203',
  lyricsUrdu: 'entry.928956035',
  yt: 'entry.497476536',
  email: 'entry.1139126885',
};

async function submitToGoogleForm(payload: Record<string, string>) {
  const body = Object.entries(payload)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v ?? '')}`)
    .join('&');

  const res = await fetch(FORM_ACTION, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) throw new Error(`Form submit failed: ${res.status}`);
}

export default function AddLyricsScreen() {
  const t = useThemeTokens();
  const { accentColor } = useSettings();
  const [title, setTitle] = useState('');
  const [reciter, setReciter] = useState('');
  const [poet, setPoet] = useState('');
  const [masaib, setMasaib] = useState('');
  const [lyricsUrdu, setLyricsUrdu] = useState('');
  const [lyricsEng, setLyricsEng] = useState('');
  const [yt, setYt] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setTitle('');
    setReciter('');
    setPoet('');
    setMasaib('');
    setLyricsUrdu('');
    setLyricsEng('');
    setYt('');
    setEmail('');
  };

  const onSubmit = async () => {
    // minimal required validation (adjust if your form has different required fields)
    if (
      !title.trim() ||
      !reciter.trim() ||
      !poet.trim() ||
      !masaib.trim() ||
      !lyricsEng.trim() ||
      !yt.trim() ||
      !email.trim()
    ) {
      Alert.alert('Missing fields', 'Fill all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, string> = {
        [ENTRY.title]: title.trim(),
        [ENTRY.reciter]: reciter.trim(),
        [ENTRY.poet]: poet.trim(),
        [ENTRY.masaib]: masaib.trim(),
        [ENTRY.lyricsEng]: lyricsEng.trim(),
        [ENTRY.lyricsUrdu]: lyricsUrdu.trim(),
        [ENTRY.yt]: yt.trim(),
        [ENTRY.email]: email.trim(),
      };

      await submitToGoogleForm(payload);
      Alert.alert('Submitted', 'Your lyrics were submitted.');
      resetForm();
    } catch (e: any) {
      Alert.alert('Submission failed', String(e?.message ?? e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: t.background }]}>
      <AppHeader />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        <View style={[styles.card, { backgroundColor: t.surface }]}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="file-document-edit"
              size={18}
              color={accentColor}
            />
            <Text style={[styles.sectionTitle, { color: t.textPrimary }]}>Basic Information</Text>
          </View>
          <Text style={[styles.label, { color: t.textSecondary }]}>Title *</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Enter the title of the Kalaam"
            placeholderTextColor={t.textMuted}
            style={[styles.input, { backgroundColor: t.background, borderColor: t.border, color: t.textPrimary }]}
          />

          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: t.textSecondary }]}>
                <MaterialCommunityIcons name="account-music" /> Reciter *
              </Text>
              <TextInput
                value={reciter}
                onChangeText={setReciter}
                placeholder="Name of the reciter"
                placeholderTextColor={t.textMuted}
                style={[styles.input, { backgroundColor: t.background, borderColor: t.border, color: t.textPrimary }]}
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: t.textSecondary }]}>
                <MaterialCommunityIcons name="feather" /> Poet *
              </Text>
              <TextInput
                value={poet}
                onChangeText={setPoet}
                placeholder="Name of the poet"
                placeholderTextColor={t.textMuted}
                style={[styles.input, { backgroundColor: t.background, borderColor: t.border, color: t.textPrimary }]}
              />
            </View>
          </View>

          <Text style={[styles.label, { color: t.textSecondary }]}>
            <MaterialCommunityIcons name="book-open-variant" /> Category
            (Masaib) *
          </Text>
          <TextInput
            value={masaib}
            onChangeText={setMasaib}
            placeholder="e.g., Karbala, Ashura, Ahlul Bayt"
            placeholderTextColor={t.textMuted}
            style={[styles.input, { backgroundColor: t.background, borderColor: t.border, color: t.textPrimary }]}
          />
        </View>

        <View style={[styles.card, { backgroundColor: t.surface }]}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="file-document"
              size={18}
              color={accentColor}
            />
            <Text style={[styles.sectionTitle, { color: t.textPrimary }]}>Lyrics</Text>
          </View>
          <Text style={[styles.label, { color: t.textSecondary }]}>English Lyrics *</Text>
          <TextInput
            value={lyricsEng}
            onChangeText={setLyricsEng}
            placeholder="Enter the lyrics in English..."
            placeholderTextColor={t.textMuted}
            style={[styles.input, styles.textarea, { backgroundColor: t.background, borderColor: t.border, color: t.textPrimary }]}
            multiline
          />
          <Text style={[styles.label, { color: t.textSecondary }]}>Urdu Lyrics</Text>
          <TextInput
            value={lyricsUrdu}
            onChangeText={setLyricsUrdu}
            placeholder="اردو میں نوحہ لکھیے ...."
            placeholderTextColor={t.textMuted}
            style={[styles.input, styles.textarea, { backgroundColor: t.background, borderColor: t.border, color: t.textPrimary }]}
            multiline
          />
        </View>

        <View style={[styles.card, { backgroundColor: t.surface }]}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="link" size={18} color={accentColor} />
            <Text style={[styles.sectionTitle, { color: t.textPrimary }]}>Links & Contact</Text>
          </View>
          <Text style={styles.label}>
            <MaterialCommunityIcons name="youtube" color={t.danger} /> YouTube
            Link *
          </Text>
          <TextInput
            value={yt}
            onChangeText={setYt}
            placeholder="https://www.youtube.com/watch?v=..."
            placeholderTextColor={t.textMuted}
            style={[styles.input, { backgroundColor: t.background, borderColor: t.border, color: t.textPrimary }]}
            autoCapitalize="none"
          />
          <Text style={styles.label}>
            <MaterialCommunityIcons name="email" /> Your Email *
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="your.email@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor={t.textMuted}
            style={[styles.input, { backgroundColor: t.background, borderColor: t.border, color: t.textPrimary }]}
          />
          <View style={{ height: 12 }} />

          <View style={styles.row2}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: t.textMuted }]}
              onPress={resetForm}
              disabled={submitting}
            >
              <Text style={[styles.buttonText, { color: t.accentOnAccent }]}>Reset Form</Text>
            </TouchableOpacity>
            <View style={{ width: 12 }} />
            <TouchableOpacity
              style={[styles.button, { backgroundColor: accentColor }, submitting && { opacity: 0.6 }]}
              onPress={onSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={t.accentOnAccent} />
              ) : (
                <>
                  <MaterialCommunityIcons name="send" color={t.accentOnAccent} />
                  <Text style={[styles.buttonText, { marginLeft: 6, color: t.accentOnAccent }]}>
                    Submit Lyrics
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  label: {
    color: '#374151',
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#111827',
  },
  textarea: { height: 140, textAlignVertical: 'top' },
  row2: { flexDirection: 'row', alignItems: 'center' },
  button: {
    flex: 1,
    backgroundColor: '#16a34a',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonText: { color: '#ffffff', fontWeight: '700' },
});

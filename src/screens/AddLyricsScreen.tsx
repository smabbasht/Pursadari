import AppHeader from '../components/AppHeader';
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
    <SafeAreaView style={styles.container}>
      <AppHeader />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="file-document-edit"
              size={18}
              color="#10b981"
            />
            <Text style={styles.sectionTitle}>Basic Information</Text>
          </View>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Enter the title of the nauha"
            placeholderTextColor="#9ca3af"
            style={styles.input}
          />

          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>
                <MaterialCommunityIcons name="account-music" /> Reciter *
              </Text>
              <TextInput
                value={reciter}
                onChangeText={setReciter}
                placeholder="Name of the reciter"
                placeholderTextColor="#9ca3af"
                style={styles.input}
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>
                <MaterialCommunityIcons name="feather" /> Poet *
              </Text>
              <TextInput
                value={poet}
                onChangeText={setPoet}
                placeholder="Name of the poet"
                placeholderTextColor="#9ca3af"
                style={styles.input}
              />
            </View>
          </View>

          <Text style={styles.label}>
            <MaterialCommunityIcons name="book-open-variant" /> Category
            (Masaib) *
          </Text>
          <TextInput
            value={masaib}
            onChangeText={setMasaib}
            placeholder="e.g., Karbala, Ashura, Ahlul Bayt"
            placeholderTextColor="#9ca3af"
            style={styles.input}
          />
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="file-document"
              size={18}
              color="#10b981"
            />
            <Text style={styles.sectionTitle}>Lyrics</Text>
          </View>
          <Text style={styles.label}>English Lyrics *</Text>
          <TextInput
            value={lyricsEng}
            onChangeText={setLyricsEng}
            placeholder="Enter the lyrics in English..."
            placeholderTextColor="#9ca3af"
            style={[styles.input, styles.textarea]}
            multiline
          />
          <Text style={styles.label}>Urdu Lyrics</Text>
          <TextInput
            value={lyricsUrdu}
            onChangeText={setLyricsUrdu}
            placeholder="اردو میں نوحہ لکھیے ...."
            placeholderTextColor="#9ca3af"
            style={[styles.input, styles.textarea]}
            multiline
          />
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="link" size={18} color="#10b981" />
            <Text style={styles.sectionTitle}>Links & Contact</Text>
          </View>
          <Text style={styles.label}>
            <MaterialCommunityIcons name="youtube" color="#ef4444" /> YouTube
            Link *
          </Text>
          <TextInput
            value={yt}
            onChangeText={setYt}
            placeholder="https://www.youtube.com/watch?v=..."
            placeholderTextColor="#9ca3af"
            style={styles.input}
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
            placeholderTextColor="#9ca3af"
            style={styles.input}
          />
          <View style={{ height: 12 }} />

          <View style={styles.row2}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#9ca3af' }]}
              onPress={resetForm}
              disabled={submitting}
            >
              <Text style={styles.buttonText}>Reset Form</Text>
            </TouchableOpacity>
            <View style={{ width: 12 }} />
            <TouchableOpacity
              style={[styles.button, submitting && { opacity: 0.6 }]}
              onPress={onSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <MaterialCommunityIcons name="send" color="#ffffff" />
                  <Text style={[styles.buttonText, { marginLeft: 6 }]}>
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

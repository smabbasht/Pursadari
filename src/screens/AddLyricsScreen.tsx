import AppHeader from '../components/AppHeader';
import { useThemeTokens, useSettings } from '../context/SettingsContext';
import database from '../database/Database';
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  Keyboard,
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

  // Dropdown states
  const [masaibList, setMasaibList] = useState<string[]>([]);
  const [reciterList, setReciterList] = useState<string[]>([]);
  const [poetList, setPoetList] = useState<string[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);
  
  // Dropdown UI states
  const [showMasaibDropdown, setShowMasaibDropdown] = useState(false);
  const [showReciterDropdown, setShowReciterDropdown] = useState(false);
  const [showPoetDropdown, setShowPoetDropdown] = useState(false);
  const [newReciter, setNewReciter] = useState('');
  const [newPoet, setNewPoet] = useState('');

  // Load dropdown data
  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        await database.init();
        const [masaibs, poets, reciters] = await Promise.all([
          database.getMasaibGroups(),
          database.getPoetGroups(),
          database.getReciterGroups(),
        ]);
        
        setMasaibList(masaibs.map(m => m.masaib).sort());
        setPoetList(poets.map(p => p.poet).sort());
        setReciterList(reciters.map(r => r.reciter).sort());
      } catch (error) {
        console.error('Failed to load dropdown data:', error);
      } finally {
        setLoadingLists(false);
      }
    };
    
    loadDropdownData();
  }, []);

  // Filtered lists for search - masaib should always show full list
  const filteredMasaibList = useMemo(() => {
    return masaibList; // Always show full list for masaib
  }, [masaibList]);

  const filteredReciterList = useMemo(() => {
    return reciterList.filter(r => r.toLowerCase().includes(reciter.toLowerCase()));
  }, [reciterList, reciter]);

  const filteredPoetList = useMemo(() => {
    return poetList.filter(p => p.toLowerCase().includes(poet.toLowerCase()));
  }, [poetList, poet]);

  // Dropdown handlers
  const handleMasaibSelect = (selectedMasaib: string) => {
    // If clicking the same masaib, unselect it
    if (masaib === selectedMasaib) {
      setMasaib('');
    } else {
      setMasaib(selectedMasaib);
    }
    setShowMasaibDropdown(false);
  };

  const handleReciterSelect = (selectedReciter: string) => {
    setReciter(selectedReciter);
    setShowReciterDropdown(false);
    Keyboard.dismiss();
  };

  const handlePoetSelect = (selectedPoet: string) => {
    setPoet(selectedPoet);
    setShowPoetDropdown(false);
    Keyboard.dismiss();
  };

  const handleAddNewReciter = () => {
    if (newReciter.trim()) {
      setReciter(newReciter.trim());
      setNewReciter('');
      setShowReciterDropdown(false);
    }
  };

  const handleAddNewPoet = () => {
    if (newPoet.trim()) {
      setPoet(newPoet.trim());
      setNewPoet('');
      setShowPoetDropdown(false);
    }
  };

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
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ padding: 16, paddingBottom: 200 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets={true}
        keyboardDismissMode="interactive"
      >
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
              <TouchableOpacity
                style={[styles.dropdownInput, { backgroundColor: t.background, borderColor: t.border }]}
                onPress={() => setShowReciterDropdown(true)}
              >
                <Text style={[styles.dropdownText, { color: reciter ? t.textPrimary : t.textMuted }]}>
                  {reciter || 'Select reciter'}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color={t.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: t.textSecondary }]}>
                <MaterialCommunityIcons name="feather" /> Poet *
              </Text>
              <TouchableOpacity
                style={[styles.dropdownInput, { backgroundColor: t.background, borderColor: t.border }]}
                onPress={() => setShowPoetDropdown(true)}
              >
                <Text style={[styles.dropdownText, { color: poet ? t.textPrimary : t.textMuted }]}>
                  {poet || 'Select poet'}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color={t.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={[styles.label, { color: t.textSecondary }]}>
            <MaterialCommunityIcons name="book-open-variant" /> Category
            (Masaib) *
          </Text>
          <TouchableOpacity
            style={[styles.dropdownInput, { backgroundColor: t.background, borderColor: t.border }]}
            onPress={() => setShowMasaibDropdown(true)}
          >
            <Text style={[styles.dropdownText, { color: masaib ? t.textPrimary : t.textMuted }]}>
              {masaib || 'Select masaib'}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color={t.textMuted} />
          </TouchableOpacity>
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

      {/* Masaib Dropdown Modal */}
      <Modal
        visible={showMasaibDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMasaibDropdown(false)}
      >
        <View style={[styles.modalBackdrop, { backgroundColor: t.modalBackdrop }]}>
          <View style={[styles.modalContent, { backgroundColor: t.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: t.divider }]}>
              <Text style={[styles.modalTitle, { color: t.textPrimary }]}>Select Masaib</Text>
              <TouchableOpacity onPress={() => setShowMasaibDropdown(false)}>
                <MaterialCommunityIcons name="close" size={24} color={t.textMuted} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={filteredMasaibList}
              keyExtractor={(item) => item}
              style={styles.dropdownList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.dropdownItem, 
                    { 
                      borderBottomColor: t.divider,
                      backgroundColor: masaib === item ? accentColor + '20' : 'transparent'
                    }
                  ]}
                  onPress={() => handleMasaibSelect(item)}
                >
                  <Text style={[
                    styles.dropdownItemText, 
                    { 
                      color: masaib === item ? accentColor : t.textPrimary,
                      fontWeight: masaib === item ? '600' : '400'
                    }
                  ]}>{item}</Text>
                  {masaib === item && (
                    <MaterialCommunityIcons name="check" size={20} color={accentColor} />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyDropdown}>
                  <Text style={[styles.emptyDropdownText, { color: t.textMuted }]}>
                    No masaib found
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Reciter Dropdown Modal */}
      <Modal
        visible={showReciterDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReciterDropdown(false)}
      >
        <View style={[styles.modalBackdrop, { backgroundColor: t.modalBackdrop }]}>
          <View style={[styles.modalContent, { backgroundColor: t.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: t.divider }]}>
              <Text style={[styles.modalTitle, { color: t.textPrimary }]}>Select Reciter</Text>
              <TouchableOpacity onPress={() => setShowReciterDropdown(false)}>
                <MaterialCommunityIcons name="close" size={24} color={t.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={[styles.searchSection, { borderBottomColor: t.divider }]}>
              <TextInput
                style={[styles.searchInput, { backgroundColor: t.background, borderColor: t.border, color: t.textPrimary }]}
                value={reciter}
                onChangeText={(text) => {
                  setReciter(text);
                }}
                placeholder="Search reciters..."
                placeholderTextColor={t.textMuted}
                onFocus={() => {
                  // Don't close modal on focus
                }}
              />
            </View>

            {/* Add New Reciter Input */}
            <View style={[styles.addNewSection, { borderBottomColor: t.divider }]}>
              <Text style={[styles.addNewLabel, { color: t.textSecondary }]}>Add New Reciter:</Text>
              <View style={styles.addNewInputRow}>
                <TextInput
                  style={[styles.addNewInput, { backgroundColor: t.background, borderColor: t.border, color: t.textPrimary }]}
                  value={newReciter}
                  onChangeText={setNewReciter}
                  placeholder="Enter new reciter name"
                  placeholderTextColor={t.textMuted}
                />
                <TouchableOpacity
                  style={[styles.addNewButton, { backgroundColor: accentColor }]}
                  onPress={handleAddNewReciter}
                  disabled={!newReciter.trim()}
                >
                  <MaterialCommunityIcons name="plus" size={20} color={t.accentOnAccent} />
                </TouchableOpacity>
              </View>
            </View>
            
            <FlatList
              data={filteredReciterList}
              keyExtractor={(item) => item}
              style={styles.dropdownList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.dropdownItem, { borderBottomColor: t.divider }]}
                  onPress={() => handleReciterSelect(item)}
                >
                  <Text style={[styles.dropdownItemText, { color: t.textPrimary }]}>{item}</Text>
                  {reciter === item && (
                    <MaterialCommunityIcons name="check" size={20} color={accentColor} />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyDropdown}>
                  <Text style={[styles.emptyDropdownText, { color: t.textMuted }]}>
                    No reciters found
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Poet Dropdown Modal */}
      <Modal
        visible={showPoetDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPoetDropdown(false)}
      >
        <View style={[styles.modalBackdrop, { backgroundColor: t.modalBackdrop }]}>
          <View style={[styles.modalContent, { backgroundColor: t.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: t.divider }]}>
              <Text style={[styles.modalTitle, { color: t.textPrimary }]}>Select Poet</Text>
              <TouchableOpacity onPress={() => setShowPoetDropdown(false)}>
                <MaterialCommunityIcons name="close" size={24} color={t.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={[styles.searchSection, { borderBottomColor: t.divider }]}>
              <TextInput
                style={[styles.searchInput, { backgroundColor: t.background, borderColor: t.border, color: t.textPrimary }]}
                value={poet}
                onChangeText={(text) => {
                  setPoet(text);
                }}
                placeholder="Search poets..."
                placeholderTextColor={t.textMuted}
                onFocus={() => {
                  // Don't close modal on focus
                }}
              />
            </View>

            {/* Add New Poet Input */}
            <View style={[styles.addNewSection, { borderBottomColor: t.divider }]}>
              <Text style={[styles.addNewLabel, { color: t.textSecondary }]}>Add New Poet:</Text>
              <View style={styles.addNewInputRow}>
                <TextInput
                  style={[styles.addNewInput, { backgroundColor: t.background, borderColor: t.border, color: t.textPrimary }]}
                  value={newPoet}
                  onChangeText={setNewPoet}
                  placeholder="Enter new poet name"
                  placeholderTextColor={t.textMuted}
                />
                <TouchableOpacity
                  style={[styles.addNewButton, { backgroundColor: accentColor }]}
                  onPress={handleAddNewPoet}
                  disabled={!newPoet.trim()}
                >
                  <MaterialCommunityIcons name="plus" size={20} color={t.accentOnAccent} />
                </TouchableOpacity>
              </View>
            </View>
            
            <FlatList
              data={filteredPoetList}
              keyExtractor={(item) => item}
              style={styles.dropdownList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.dropdownItem, { borderBottomColor: t.divider }]}
                  onPress={() => handlePoetSelect(item)}
                >
                  <Text style={[styles.dropdownItemText, { color: t.textPrimary }]}>{item}</Text>
                  {poet === item && (
                    <MaterialCommunityIcons name="check" size={20} color={accentColor} />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyDropdown}>
                  <Text style={[styles.emptyDropdownText, { color: t.textMuted }]}>
                    No poets found
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
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

  // Dropdown styles
  dropdownInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
  },
  dropdownText: {
    flex: 1,
    fontSize: 16,
  },

  // Modal styles
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxHeight: '70%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  dropdownList: {
    maxHeight: 300,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  dropdownItemText: {
    flex: 1,
    fontSize: 16,
  },
  emptyDropdown: {
    padding: 20,
    alignItems: 'center',
  },
  emptyDropdownText: {
    fontSize: 16,
  },

  // Add new section styles
  addNewSection: {
    padding: 16,
    borderBottomWidth: 1,
  },
  addNewLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  addNewInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addNewInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  addNewButton: {
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
  },

  // Search section styles
  searchSection: {
    padding: 16,
    borderBottomWidth: 1,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
});

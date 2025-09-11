// SettingsScreen.tsx

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import Slider from '@react-native-community/slider';
import AppHeader from '../components/AppHeader';
import { useSettings } from '../context/SettingsContext';

const EN_PREVIEW = 'Aao ro lein Shah-e-Karbala ko';
const UR_PREVIEW = 'آؤ رو لیں شاہِ کربلا کو';

// Curated safe palette + nice defaults
const PALETTE = [
  '#16a34a',
  '#0ea5e9',
  '#6366f1',
  '#db2777',
  '#f59e0b',
  '#ef4444',
  '#10b981',
  '#6b7280',
];

const EN_FONTS = [
  { label: 'System', value: 'System' },
  { label: 'Inter', value: 'Inter' },
  { label: 'Roboto', value: 'Roboto' },
  { label: 'Merriweather', value: 'Merriweather' },
];

const UR_FONTS = [
  { label: 'System', value: 'System' },
  { label: 'Noto Nastaliq Urdu', value: 'Noto Nastaliq Urdu' },
  { label: 'Jameel Noori Nastaleeq', value: 'Jameel Noori Nastaleeq' },
  { label: 'Mehr Nastaliq Web', value: 'Mehr Nastaliq Web' },
];

export default function SettingsScreen() {
  // Pull from settings if available; otherwise use local safe defaults.
  const settings = useSettings?.() ?? ({} as any);

  const [theme, setTheme] = useState<'light' | 'dark'>(
    settings.theme ?? 'light',
  );
  const [accentColor, setAccentColor] = useState<string>(
    settings.accentColor ?? '#16a34a',
  );

  const [engFont, setEngFont] = useState<string>(
    settings.engFont ?? EN_FONTS[0].value,
  );
  const [urduFont, setUrduFont] = useState<string>(
    settings.urduFont ?? UR_FONTS[0].value,
  );

  const [engScale, setEngScale] = useState<number>(
    settings.engFontScale ?? 1.0,
  );
  const [urduScale, setUrduScale] = useState<number>(
    settings.urduFontScale ?? 1.2,
  );

  const isDark = theme === 'dark';

  // If context provides setters, mirror changes back out
  const applyTheme = (t: 'light' | 'dark') => {
    setTheme(t);
    settings.setTheme?.(t);
  };
  const applyAccent = (c: string) => {
    setAccentColor(c);
    settings.setAccentColor?.(c);
  };
  const applyEngFont = (f: string) => {
    setEngFont(f);
    settings.setEngFont?.(f);
  };
  const applyUrduFont = (f: string) => {
    setUrduFont(f);
    settings.setUrduFont?.(f);
  };
  const applyEngScale = (v: number) => {
    const clamped = Math.min(1.8, Math.max(0.8, +v.toFixed(2)));
    setEngScale(clamped);
    settings.setEngFontScale?.(clamped);
  };
  const applyUrduScale = (v: number) => {
    const clamped = Math.min(2.0, Math.max(0.9, +v.toFixed(2)));
    setUrduScale(clamped);
    settings.setUrduFontScale?.(clamped);
  };

  // Accent Color Modal
  const [pickerOpen, setPickerOpen] = useState(false);
  const [hexInput, setHexInput] = useState(accentColor.replace('#', ''));

  const validHex = useMemo(
    () => /^([0-9a-f]{6}|[0-9a-f]{3})$/i.test(hexInput),
    [hexInput],
  );

  const onConfirmHex = () => {
    if (!validHex) return;
    const hex = `#${
      hexInput.length === 3 ? hexInput.replace(/(.)/g, '$1$1') : hexInput
    }`.toLowerCase();
    applyAccent(hex);
    setPickerOpen(false);
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? '#0b1220' : '#f9fafb' },
      ]}
    >
      <AppHeader />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Appearance */}
        <View style={[styles.section, styles.card]}>
          <Text style={styles.sectionTitle}>Appearance</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Dark Mode</Text>
            <Switch
              value={isDark}
              onValueChange={v => applyTheme(v ? 'dark' : 'light')}
              trackColor={{ false: '#d1d5db', true: accentColor }}
              thumbColor={isDark ? '#ffffff' : '#ffffff'}
            />
          </View>

          <View style={styles.divider} />

          <Text style={styles.label}>Accent Color</Text>
          <View style={styles.accentRow}>
            {PALETTE.map(c => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.swatch,
                  {
                    backgroundColor: c,
                    borderColor: c === accentColor ? '#111827' : '#e5e7eb',
                  },
                ]}
                activeOpacity={0.85}
                onPress={() => applyAccent(c)}
              />
            ))}
            <TouchableOpacity
              style={[styles.customBtn, { borderColor: accentColor }]}
              onPress={() => setPickerOpen(true)}
            >
              <Text style={[styles.customBtnText, { color: '#111827' }]}>
                Custom
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* English Typography */}
        <View style={[styles.section, styles.card]}>
          <Text style={styles.sectionTitle}>English Typography</Text>

          <Text style={styles.label}>Font</Text>
          <View style={styles.pickerWrap}>
            <Picker
              selectedValue={engFont}
              onValueChange={applyEngFont}
              dropdownIconColor="#6b7280"
              style={styles.picker}
            >
              {EN_FONTS.map(f => (
                <Picker.Item key={f.value} label={f.label} value={f.value} />
              ))}
            </Picker>
          </View>

          <View style={styles.sliderRow}>
            <Text style={styles.label}>Font Size</Text>
            <Text style={styles.valueChip}>{engScale.toFixed(2)}x</Text>
          </View>
          <Slider
            value={engScale}
            onValueChange={applyEngScale}
            minimumValue={0.8}
            maximumValue={1.8}
            step={0.02}
            minimumTrackTintColor={accentColor}
            maximumTrackTintColor="#e5e7eb"
            thumbTintColor={accentColor}
          />

          <View style={styles.previewCard}>
            <Text
              style={{
                fontSize: 16 * engScale,
                color: '#111827',
                fontFamily: engFont === 'System' ? undefined : engFont,
              }}
            >
              {EN_PREVIEW}
            </Text>
          </View>
        </View>

        {/* Urdu Typography */}
        <View style={[styles.section, styles.card]}>
          <Text style={styles.sectionTitle}>Urdu Typography</Text>

          <Text style={styles.label}>Font</Text>
          <View style={styles.pickerWrap}>
            <Picker
              selectedValue={urduFont}
              onValueChange={applyUrduFont}
              dropdownIconColor="#6b7280"
              style={styles.picker}
            >
              {UR_FONTS.map(f => (
                <Picker.Item key={f.value} label={f.label} value={f.value} />
              ))}
            </Picker>
          </View>

          <View style={styles.sliderRow}>
            <Text style={styles.label}>Font Size</Text>
            <Text style={styles.valueChip}>{urduScale.toFixed(2)}x</Text>
          </View>
          <Slider
            value={urduScale}
            onValueChange={applyUrduScale}
            minimumValue={0.9}
            maximumValue={2.0}
            step={0.02}
            minimumTrackTintColor={accentColor}
            maximumTrackTintColor="#e5e7eb"
            thumbTintColor={accentColor}
          />

          <View style={[styles.previewCard, { alignItems: 'flex-end' }]}>
            <Text
              style={{
                fontSize: 18 * urduScale,
                color: '#111827',
                writingDirection: 'rtl',
                textAlign: 'right',
                fontFamily: urduFont === 'System' ? undefined : urduFont,
              }}
            >
              {UR_PREVIEW}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Accent Color Modal */}
      <Modal
        visible={pickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Pick Accent Color</Text>
            <View style={styles.accentRow}>
              {PALETTE.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.swatchLarge,
                    {
                      backgroundColor: c,
                      borderColor: c === accentColor ? '#111827' : '#e5e7eb',
                    },
                  ]}
                  activeOpacity={0.9}
                  onPress={() => applyAccent(c)}
                />
              ))}
            </View>

            <View style={styles.hexRow}>
              <Text style={styles.label}>HEX</Text>
              <View style={styles.hexInputWrap}>
                <Text style={styles.hash}>#</Text>
                <TextInput
                  value={hexInput}
                  onChangeText={setHexInput}
                  placeholder="16a34a"
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.hexInput}
                  maxLength={6}
                />
                <View
                  style={[
                    styles.hexPreview,
                    { backgroundColor: validHex ? `#${hexInput}` : '#e5e7eb' },
                  ]}
                />
              </View>
            </View>

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.btn, styles.btnGhost]}
                onPress={() => setPickerOpen(false)}
              >
                <Text style={[styles.btnText, { color: '#111827' }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.btn,
                  { backgroundColor: validHex ? accentColor : '#e5e7eb' },
                ]}
                onPress={onConfirmHex}
                disabled={!validHex}
              >
                <Text
                  style={[
                    styles.btnText,
                    { color: validHex ? '#fff' : '#9ca3af' },
                  ]}
                >
                  Apply
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ---------- Styles ---------- */

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1, paddingBottom: 20 },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    // subtle shadow
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  section: {},
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  divider: { height: 1, backgroundColor: '#f3f4f6', marginVertical: 12 },

  label: { color: '#374151', fontWeight: '600' },

  accentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  swatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
  },
  customBtn: {
    borderWidth: 2,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  customBtnText: { fontWeight: '700' },

  // Pickers
  pickerWrap: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 8,
  },
  picker: {
    height: Platform.OS === 'ios' ? 180 : 44,
    ...(Platform.OS === 'ios' ? { backgroundColor: '#fff' } : {}),
  },

  // Sliders
  sliderRow: {
    marginTop: 12,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  valueChip: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    color: '#111827',
    fontWeight: '700',
    minWidth: 56,
    textAlign: 'center',
  },

  previewCard: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#fff',
  },

  /* Modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(17,24,39,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },

  swatchLarge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    marginRight: 6,
    marginTop: 10,
  },

  hexRow: { marginTop: 12 },
  hexInputWrap: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 44,
    gap: 6,
  },
  hash: { color: '#6b7280', fontWeight: '700' },
  hexInput: { flex: 1, color: '#111827' },
  hexPreview: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  modalBtns: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 16,
  },
  btn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  btnGhost: { backgroundColor: '#f3f4f6' },
  btnText: { fontWeight: '700' },
});

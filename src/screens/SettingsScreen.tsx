// SettingsScreen.tsx

import React, { useMemo, useState, useEffect } from 'react';
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
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AppHeader from '../components/AppHeader';
import { useSettings, useThemeTokens } from '../context/SettingsContext';
import FontManager from '../utils/FontManager';
import { foregroundSyncManager } from '../services/ForegroundSyncManager';
import { syncManager } from '../services/SyncManager';
import { SyncResult } from '../types';
import database from '../database/Database';

const EN_PREVIEW = 'Aao ro lein Shah-e-Karbala ko';
const UR_PREVIEW = 'آؤ رو لیں شہِ کربلا کو';

// Curated color palette as requested
const PALETTE = [
  '#8b5cf6', // Purple
  '#3b82f6', // Blue
  '#0ea5e9', // Light Blue
  '#16a34a', // Green
  '#f59e0b', // Mustardish Yellow
  '#ef4444', // Red
  // '#a16207', // Brown
  '#6b7280', // Grey
  '#000000', // Black
  // '#a16207', // Brown
  // '#d97706', // Mustard
  // '#eab308', // Yellow
];

// Font options will be loaded dynamically from FontManager

export default function SettingsScreen() {
  // Pull from settings if available; otherwise use local safe defaults.
  const settings = useSettings?.() ?? ({} as any);
  const t = useThemeTokens();

  const [theme, setTheme] = useState<'light' | 'dark'>(
    settings.theme ?? 'light',
  );
  const [accentColor, setAccentColor] = useState<string>(
    settings.accentColor ?? '#16a34a',
  );

  // Font options from FontManager
  const [fontOptions, setFontOptions] = useState<{
    urdu: Array<{ label: string; value: string }>;
    english: Array<{ label: string; value: string }>;
  }>({ urdu: [{ label: 'System Default', value: 'System' }], english: [{ label: 'System Default', value: 'System' }] });

  const [engFont, setEngFont] = useState<string>(
    settings.engFont ?? 'System',
  );
  const [urduFont, setUrduFont] = useState<string>(
    settings.urduFont ?? 'System',
  );

  // Initialize FontManager and load font options
  useEffect(() => {
    const initializeFonts = async () => {
      await FontManager.initialize();
      const options = FontManager.getFontOptions();
      setFontOptions(options);
      
      // Set safe fallback fonts if current fonts are not available
      const safeEngFont = FontManager.getSafeFontFamily(settings.engFont ?? 'System', false);
      const safeUrduFont = FontManager.getSafeFontFamily(settings.urduFont ?? 'System', true);
      
      if (safeEngFont !== engFont) setEngFont(safeEngFont);
      if (safeUrduFont !== urduFont) setUrduFont(safeUrduFont);
    };
    
    initializeFonts();
  }, []);

  const [engScale, setEngScale] = useState<number>(
    settings.engFontScale ?? 1.0,
  );
  const [urduScale, setUrduScale] = useState<number>(
    settings.urduFontScale ?? 1.2,
  );

  // Sync-related state
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [remainingSyncs, setRemainingSyncs] = useState<number>(2);

  // Font dropdown states
  const [showEngFontDropdown, setShowEngFontDropdown] = useState(false);
  const [showUrduFontDropdown, setShowUrduFontDropdown] = useState(false);

  const isDark = theme === 'dark';

  // Load sync status on component mount
  useEffect(() => {
    loadSyncStatus();
  }, []);

  const loadSyncStatus = async () => {
    try {
      const status = await syncManager.getSyncStatus();
      setLastSyncTime(new Date(status.lastSync).toLocaleString());
      setSyncStatus(`Records: ${status.recordCount} | Online: ${status.isOnline ? 'Yes' : 'No'}`);
      setRemainingSyncs(2 - status.dailyAttempts);
    } catch (error) {
      console.error('Failed to load sync status:', error);
      setSyncStatus('Failed to load status');
    }
  };

  const handleManualSync = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    setSyncStatus('Syncing...');
    
    try {
      const result: SyncResult = await foregroundSyncManager().performManualSync();
      
      if (result.success) {
        setSyncStatus(`Synced ${result.recordsProcessed} records (${result.activeRecords} new, ${result.deletedRecords} deleted)`);
        setLastSyncTime(new Date().toLocaleString());
        // Refresh sync status to update remaining syncs
        await loadSyncStatus();
      } else {
        setSyncStatus(`Sync failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Manual sync failed:', error);
      setSyncStatus(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSyncing(false);
    }
  };

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
    <SafeAreaView style={[styles.container, { backgroundColor: t.background }]}>
      <AppHeader />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Appearance */}
        <View
          style={[styles.section, styles.card, { backgroundColor: t.surface }]}
        >
          <Text style={[styles.sectionTitle, { color: t.textPrimary }]}>
            Appearance
          </Text>

          <View style={styles.row}>
            <Text style={[styles.label, { color: t.textSecondary }]}>
              Dark Mode
            </Text>
            <Switch
              value={isDark}
              onValueChange={v => applyTheme(v ? 'dark' : 'light')}
              trackColor={{ false: t.border, true: accentColor }}
              thumbColor={t.accentOnAccent}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: t.divider }]} />

          <Text style={[styles.label, { color: t.textSecondary }]}>
            Accent Color
          </Text>
          <View style={styles.accentRow}>
            {PALETTE.map(c => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.swatch,
                  {
                    backgroundColor: c,
                    borderColor: c === accentColor ? t.textPrimary : t.border,
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
              <Text style={[styles.customBtnText, { color: t.textPrimary }]}>
                Custom
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* English Typography */}
        <View
          style={[styles.section, styles.card, { backgroundColor: t.surface }]}
        >
          <Text style={[styles.sectionTitle, { color: t.textPrimary }]}>
            English Typography
          </Text>

          <Text style={[styles.label, { color: t.textSecondary }]}>Font</Text>
          <TouchableOpacity
            style={[
              styles.pickerWrap,
              { 
                borderColor: t.border, 
                backgroundColor: isDark ? '#1f2937' : '#ffffff',
                borderWidth: 1,
                borderRadius: 12,
                marginTop: 8,
                paddingHorizontal: 16,
                paddingVertical: 14,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              },
            ]}
            onPress={() => setShowEngFontDropdown(true)}
          >
            <Text style={[styles.pickerText, { color: t.textPrimary }]}>
              {fontOptions.english.find(f => f.value === engFont)?.label || 'Select Font'}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={24} color={t.textMuted} />
          </TouchableOpacity>

          <View style={styles.sliderRow}>
            <Text style={[styles.label, { color: t.textSecondary }]}>
              Font Size
            </Text>
            <Text
              style={[
                styles.valueChip,
                { backgroundColor: t.divider, color: t.textPrimary },
              ]}
            >
              {engScale.toFixed(2)}x
            </Text>
          </View>
          <Slider
            value={engScale}
            onValueChange={applyEngScale}
            minimumValue={0.8}
            maximumValue={1.8}
            step={0.02}
            minimumTrackTintColor={accentColor}
            maximumTrackTintColor={t.border}
            thumbTintColor={accentColor}
          />

          <View
            style={[
              styles.previewCard,
              { 
                backgroundColor: t.surface, 
                borderColor: t.border,
                padding: 16,
                borderRadius: 12,
                borderWidth: 1,
              },
            ]}
          >
            <Text
              style={{
                fontSize: 16 * engScale,
                color: t.textPrimary,
                fontFamily: engFont === 'System' ? undefined : engFont,
                lineHeight: 24 * engScale,
              }}
            >
              {EN_PREVIEW}
            </Text>
            <Text style={[styles.fontName, { color: t.textMuted }]}>
              {fontOptions.english.find(f => f.value === engFont)?.label || 'Unknown Font'}
            </Text>
          </View>
        </View>

        {/* Urdu Typography */}
        <View
          style={[styles.section, styles.card, { backgroundColor: t.surface, marginBottom: 20 }]}
        >
          <Text style={[styles.sectionTitle, { color: t.textPrimary }]}>
            Urdu Typography
          </Text>

          <Text style={[styles.label, { color: t.textSecondary }]}>Font</Text>
          <TouchableOpacity
            style={[
              styles.pickerWrap,
              { 
                borderColor: t.border, 
                backgroundColor: isDark ? '#1f2937' : '#ffffff',
                borderWidth: 1,
                borderRadius: 12,
                marginTop: 8,
                paddingHorizontal: 16,
                paddingVertical: 14,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              },
            ]}
            onPress={() => setShowUrduFontDropdown(true)}
          >
            <Text style={[styles.pickerText, { color: t.textPrimary }]}>
              {fontOptions.urdu.find(f => f.value === urduFont)?.label || 'Select Font'}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={24} color={t.textMuted} />
          </TouchableOpacity>

          <View style={styles.sliderRow}>
            <Text style={[styles.label, { color: t.textSecondary }]}>
              Font Size
            </Text>
            <Text
              style={[
                styles.valueChip,
                { backgroundColor: t.divider, color: t.textPrimary },
              ]}
            >
              {urduScale.toFixed(2)}x
            </Text>
          </View>
          <Slider
            value={urduScale}
            onValueChange={applyUrduScale}
            minimumValue={0.9}
            maximumValue={2.0}
            step={0.02}
            minimumTrackTintColor={accentColor}
            maximumTrackTintColor={t.border}
            thumbTintColor={accentColor}
          />

          <View
            style={[
              styles.previewCard,
              {
                alignItems: 'flex-end',
                backgroundColor: t.surface,
                borderColor: t.border,
                padding: 16,
                borderRadius: 12,
                borderWidth: 1,
              },
            ]}
          >
            <Text
              style={{
                fontSize: 18 * urduScale,
                color: t.textPrimary,
                writingDirection: 'rtl',
                textAlign: 'right',
                fontFamily: urduFont === 'System' ? undefined : urduFont,
                lineHeight: 32 * urduScale,
                marginBottom: 16,
                paddingBottom: 8,
              }}
            >
              {UR_PREVIEW}
            </Text>
            <Text style={[styles.fontName, { color: t.textMuted, textAlign: 'right' }]}>
              {fontOptions.urdu.find(f => f.value === urduFont)?.label || 'Unknown Font'}
            </Text>
          </View>
        </View>

        {/* Data Sync */}
        <View
          style={[styles.section, styles.card, { backgroundColor: t.surface, marginBottom: 20 }]}
        >
          <Text style={[styles.sectionTitle, { color: t.textPrimary }]}>
            Data Sync (Daily)
          </Text>

          <View style={styles.syncStatusContainer}>
            <View style={styles.syncStatusRow}>
              <Text style={[styles.syncLabel, { color: t.textSecondary }]}>
                Status
              </Text>
              <Text style={[styles.syncStatusText, { color: t.textMuted }]}>
                {syncStatus}
              </Text>
            </View>

            {lastSyncTime && (
              <View style={styles.syncStatusRow}>
                <Text style={[styles.syncLabel, { color: t.textSecondary }]}>
                  Last Sync
                </Text>
                <Text style={[styles.syncTimeText, { color: t.textMuted }]}>
                  {lastSyncTime}
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.syncButton,
              {
                backgroundColor: isSyncing ? t.border : accentColor,
                opacity: isSyncing ? 0.6 : 1,
                shadowColor: accentColor,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 3,
              },
            ]}
            onPress={handleManualSync}
            disabled={isSyncing}
          >
            <Text
              style={[
                styles.syncButtonText,
                { color: isSyncing ? t.textMuted : t.accentOnAccent },
              ]}
            >
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Accent Color Modal */}
      <Modal
        visible={pickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerOpen(false)}
      >
        <View
          style={[styles.modalBackdrop, { backgroundColor: t.modalBackdrop }]}
        >
          <View style={[styles.modalCard, { backgroundColor: t.surface }]}>
            <Text style={[styles.modalTitle, { color: t.textPrimary }]}>
              Pick Accent Color
            </Text>
            <View style={styles.accentRow}>
              {PALETTE.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.swatchLarge,
                    {
                      backgroundColor: c,
                      borderColor: c === accentColor ? t.textPrimary : t.border,
                    },
                  ]}
                  activeOpacity={0.9}
                  onPress={() => applyAccent(c)}
                />
              ))}
            </View>

            <View style={styles.hexRow}>
              <Text style={[styles.label, { color: t.textSecondary }]}>
                HEX
              </Text>
              <View style={[styles.hexInputWrap, { borderColor: t.border }]}>
                <Text style={[styles.hash, { color: t.textMuted }]}>#</Text>
                <TextInput
                  value={hexInput}
                  onChangeText={setHexInput}
                  placeholder="16a34a"
                  placeholderTextColor={t.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[styles.hexInput, { color: t.textPrimary }]}
                  maxLength={6}
                />
                <View
                  style={[
                    styles.hexPreview,
                    {
                      backgroundColor: validHex ? `#${hexInput}` : t.border,
                      borderColor: t.border,
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: t.divider }]}
                onPress={() => setPickerOpen(false)}
              >
                <Text style={[styles.btnText, { color: t.textPrimary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.btn,
                  { backgroundColor: validHex ? accentColor : t.border },
                ]}
                onPress={onConfirmHex}
                disabled={!validHex}
              >
                <Text
                  style={[
                    styles.btnText,
                    { color: validHex ? t.accentOnAccent : t.textMuted },
                  ]}
                >
                  Apply
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* English Font Dropdown Modal */}
      <Modal
        visible={showEngFontDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEngFontDropdown(false)}
      >
        <View style={[styles.modalBackdrop, { backgroundColor: t.modalBackdrop }]}>
          <View style={[styles.fontModalContent, { backgroundColor: t.surface, borderColor: t.border }]}>
            <View style={[styles.fontModalHeader, { borderBottomColor: t.divider }]}>
              <Text style={[styles.modalTitle, { color: t.textPrimary }]}>Select English Font</Text>
              <TouchableOpacity onPress={() => setShowEngFontDropdown(false)}>
                <MaterialCommunityIcons name="close" size={24} color={t.textMuted} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={fontOptions.english}
              keyExtractor={(item) => item.value}
              style={styles.fontDropdownList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.fontDropdownItem, 
                    { 
                      borderBottomColor: t.divider,
                      backgroundColor: engFont === item.value ? accentColor + '20' : 'transparent'
                    }
                  ]}
                  onPress={() => {
                    applyEngFont(item.value);
                    setShowEngFontDropdown(false);
                  }}
                >
                  <Text style={[
                    styles.fontDropdownItemText, 
                    { 
                      color: engFont === item.value ? accentColor : t.textPrimary,
                      fontWeight: engFont === item.value ? '600' : '400',
                      fontFamily: item.value === 'System' ? undefined : item.value
                    }
                  ]}>{item.label}</Text>
                  {engFont === item.value && (
                    <MaterialCommunityIcons name="check" size={20} color={accentColor} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Urdu Font Dropdown Modal */}
      <Modal
        visible={showUrduFontDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUrduFontDropdown(false)}
      >
        <View style={[styles.modalBackdrop, { backgroundColor: t.modalBackdrop }]}>
          <View style={[styles.fontModalContent, { backgroundColor: t.surface, borderColor: t.border }]}>
            <View style={[styles.fontModalHeader, { borderBottomColor: t.divider }]}>
              <Text style={[styles.modalTitle, { color: t.textPrimary }]}>Select Urdu Font</Text>
              <TouchableOpacity onPress={() => setShowUrduFontDropdown(false)}>
                <MaterialCommunityIcons name="close" size={24} color={t.textMuted} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={fontOptions.urdu}
              keyExtractor={(item) => item.value}
              style={styles.fontDropdownList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.fontDropdownItem, 
                    { 
                      borderBottomColor: t.divider,
                      backgroundColor: urduFont === item.value ? accentColor + '20' : 'transparent'
                    }
                  ]}
                  onPress={() => {
                    applyUrduFont(item.value);
                    setShowUrduFontDropdown(false);
                  }}
                >
                  <Text style={[
                    styles.fontDropdownItemText, 
                    { 
                      color: urduFont === item.value ? accentColor : t.textPrimary,
                      fontWeight: urduFont === item.value ? '600' : '400',
                      fontFamily: item.value === 'System' ? undefined : item.value,
                      writingDirection: 'rtl',
                      textAlign: 'right'
                    }
                  ]}>{item.label}</Text>
                  {urduFont === item.value && (
                    <MaterialCommunityIcons name="check" size={20} color={accentColor} />
                  )}
                </TouchableOpacity>
              )}
            />
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
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 20,
    // subtle shadow
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  section: {},
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  divider: { height: 1, marginVertical: 12 },

  label: { fontWeight: '600' },

  accentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  swatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    overflow: 'hidden',
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
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  picker: {
    height: Platform.OS === 'ios' ? 200 : 50,
    fontSize: 16,
  },
  pickerText: {
    fontSize: 16,
    fontWeight: '500',
  },

  // Font Dropdown Modals
  fontModalContent: {
    width: '85%',
    maxHeight: '70%',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  fontModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  fontDropdownList: {
    maxHeight: 400,
  },
  fontDropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  fontDropdownItemText: {
    fontSize: 16,
    flex: 1,
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
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontWeight: '700',
    minWidth: 56,
    textAlign: 'center',
  },

  previewCard: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  fontName: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },

  /* Modal */
  modalBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    borderRadius: 14,
    padding: 16,
  },
  modalTitle: { fontSize: 16, fontWeight: '700' },

  swatchLarge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    marginRight: 6,
    marginTop: 10,
    overflow: 'hidden',
  },

  hexRow: { marginTop: 12 },
  hexInputWrap: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 44,
    gap: 6,
  },
  hash: { fontWeight: '700' },
  hexInput: { flex: 1 },
  hexPreview: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    overflow: 'hidden',
  },

  modalBtns: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 16,
  },
  btn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  btnGhost: {},
  btnText: { fontWeight: '700' },
  
  // Sync styles
  syncStatusContainer: {
    marginBottom: 16,
  },
  syncStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  syncLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  syncStatusText: {
    fontSize: 12,
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  syncTimeText: {
    fontSize: 12,
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  syncButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  syncButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

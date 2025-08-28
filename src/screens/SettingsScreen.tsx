import AppHeader from '../components/AppHeader';
import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { useSettings } from '../context/SettingsContext';

export default function SettingsScreen() {
  const { theme, setTheme, fontScale, setFontScale } = useSettings();
  const isDark = theme === 'dark';
  return (
    <SafeAreaView style={styles.container}>
      <AppHeader />
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Dark Mode</Text>
          <Switch value={isDark} onValueChange={(v) => setTheme(v ? 'dark' : 'light')} />
        </View>
        <View style={styles.rowColumn}>
          <Text style={styles.label}>Font Size</Text>
          <View style={styles.sizeRow}>
            <TouchableOpacity style={styles.sizeBtn} onPress={() => setFontScale(Math.max(0.8, +(fontScale - 0.05).toFixed(2)))}>
              <Text style={styles.sizeBtnText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.sizeValue}>{fontScale.toFixed(2)}x</Text>
            <TouchableOpacity style={styles.sizeBtn} onPress={() => setFontScale(Math.min(1.6, +(fontScale + 0.05).toFixed(2)))}>
              <Text style={styles.sizeBtnText}>+</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.helper}>Affects lyrics and large text</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  section: { backgroundColor: '#ffffff', borderRadius: 12, margin: 16, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  rowColumn: { paddingVertical: 8 },
  label: { color: '#374151', fontWeight: '600' },
  helper: { color: '#6b7280', marginTop: 6 },
  sizeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6 },
  sizeBtn: { backgroundColor: '#16a34a', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  sizeBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 16 },
  sizeValue: { minWidth: 56, textAlign: 'center', fontWeight: '700', color: '#111827' },
});

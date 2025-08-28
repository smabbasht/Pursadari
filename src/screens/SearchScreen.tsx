import AppHeader from '../components/AppHeader';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DatabaseService from '../database/DatabaseService';
import { Kalaam, RootStackParamList } from '../types';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

type Nav = StackNavigationProp<RootStackParamList>;

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Kalaam[]>([]);
  const navigation = useNavigation<Nav>();

  const onSearch = async () => {
    try {
      setLoading(true);
      const res = await DatabaseService.searchKalaams(query, 1, 100);
      setResults(res.kalaams);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader />
      <View style={{ padding: 16 }}>
        <View style={styles.searchRow}>
          <MaterialCommunityIcons name="magnify" size={22} color="#6b7280" />
          <TextInput
            placeholder="Search title..."
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={onSearch}
            returnKeyType="search"
            placeholderTextColor="#9ca3af"
            selectionColor="#16a34a"
          />
          <TouchableOpacity style={styles.searchBtn} onPress={onSearch}>
            <Text style={styles.searchBtnText}>Search</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={{ padding: 16 }}><ActivityIndicator color="#16a34a" /></View>
      ) : (
        <ScrollView style={{ flex: 1, paddingHorizontal: 16 }}>
          {results.map((k) => (
            <TouchableOpacity
              key={k.id}
              style={styles.itemRow}
              onPress={() =>
                // Navigate into the nested Home stack -> Kalaam
                navigation.navigate('Home' as never, { screen: 'Kalaam', params: { id: k.id } } as never)
              }
            >
              <MaterialCommunityIcons name="music" size={18} color="#16a34a" />
              <Text style={styles.itemTitle} numberOfLines={2}>{k.title}</Text>
              <MaterialCommunityIcons name="chevron-right" size={22} color="#9ca3af" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#ffffff', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  input: { flex: 1, fontSize: 15 },
  searchBtn: { backgroundColor: '#16a34a', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  searchBtnText: { color: '#ffffff', fontWeight: '700' },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#ffffff', borderRadius: 12, padding: 12, marginBottom: 10 },
  itemTitle: { flex: 1, color: '#111827', fontWeight: '600' },
});

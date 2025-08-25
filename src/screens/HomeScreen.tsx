import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import DatabaseService from '../database/DatabaseService';
import { MasaibGroup, PoetGroup, ReciterGroup } from '../types';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

type BrowseCategory = 'masaib' | 'poet' | 'reciter';

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [browseCategory, setBrowseCategory] = useState<BrowseCategory>('masaib');
  const [masaibGroups, setMasaibGroups] = useState<MasaibGroup[]>([]);
  const [poetGroups, setPoetGroups] = useState<PoetGroup[]>([]);
  const [reciterGroups, setReciterGroups] = useState<ReciterGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [masaibData, poetData, reciterData] = await Promise.all([
        DatabaseService.getMasaibGroups(),
        DatabaseService.getPoetGroups(),
        DatabaseService.getReciterGroups(),
      ]);
      
      setMasaibGroups(masaibData);
      setPoetGroups(poetData);
      setReciterGroups(reciterData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBrowseData = () => {
    switch (browseCategory) {
      case 'masaib':
        return masaibGroups;
      case 'poet':
        return poetGroups;
      case 'reciter':
        return reciterGroups;
      default:
        return masaibGroups;
    }
  };

  const getCategoryIcon = (category: BrowseCategory) => {
    switch (category) {
      case 'masaib':
        return '📖';
      case 'poet':
        return '✍️';
      case 'reciter':
        return '🎤';
      default:
        return '📖';
    }
  };

  const getCategoryLabel = (category: BrowseCategory) => {
    switch (category) {
      case 'masaib':
        return 'Masaib';
      case 'poet':
        return 'Poet';
      case 'reciter':
        return 'Reciter';
      default:
        return 'Masaib';
    }
  };

  const getItemLink = (item: MasaibGroup | PoetGroup | ReciterGroup) => {
    switch (browseCategory) {
      case 'masaib':
        return () => navigation.navigate('Masaib', { masaib: (item as MasaibGroup).masaib });
      case 'poet':
        return () => navigation.navigate('Poet', { poet: (item as PoetGroup).poet });
      case 'reciter':
        return () => navigation.navigate('Reciter', { reciter: (item as ReciterGroup).reciter });
      default:
        return () => {};
    }
  };

  const getItemName = (item: MasaibGroup | PoetGroup | ReciterGroup) => {
    switch (browseCategory) {
      case 'masaib':
        return (item as MasaibGroup).masaib;
      case 'poet':
        return (item as PoetGroup).poet;
      case 'reciter':
        return (item as ReciterGroup).reciter;
      default:
        return '';
    }
  };

  const getItemCount = (item: MasaibGroup | PoetGroup | ReciterGroup) => {
    return item.count;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text style={styles.loadingText}>Loading NauhaArchive...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>NauhaArchive</Text>
        <Text style={styles.subtitle}>Offline Nauha Collection</Text>
      </View>

      <View style={styles.browseSection}>
        <View style={styles.browseHeader}>
          <Text style={styles.browseIcon}>📚</Text>
          <Text style={styles.browseTitle}>Browse by:</Text>
        </View>
        
        <View style={styles.tabContainer}>
          {(['masaib', 'poet', 'reciter'] as BrowseCategory[]).map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.tab,
                browseCategory === category && styles.activeTab,
              ]}
              onPress={() => setBrowseCategory(category)}
            >
              <Text style={[
                styles.tabText,
                browseCategory === category && styles.activeTabText,
              ]}>
                {getCategoryIcon(category)} {getCategoryLabel(category)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.listContainer}>
          {getBrowseData().map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.listItem}
              onPress={getItemLink(item)}
            >
              <View style={styles.itemContent}>
                <Text style={styles.itemName} numberOfLines={2}>
                  {getItemName(item)}
                </Text>
                <Text style={styles.itemCount}>
                  {getItemCount(item)} nohas
                </Text>
              </View>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#374151',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
  },
  browseSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  browseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  browseIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  browseTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#16a34a',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
    marginTop: 16,
  },
  listContainer: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  listItem: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  itemCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  arrow: {
    fontSize: 18,
    color: '#9ca3af',
    marginLeft: 12,
  },
});

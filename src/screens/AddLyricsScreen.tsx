import AppHeader from '../components/AppHeader';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function AddLyricsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <AppHeader />
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="plus" size={48} color="#16a34a" />
        </View>
        <Text style={styles.title}>Add Lyrics</Text>
        <Text style={styles.subtitle}>
          This feature will allow you to add new nauha lyrics to the collection.
        </Text>
        <Text style={styles.comingSoon}>Coming soon...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  comingSoon: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
});

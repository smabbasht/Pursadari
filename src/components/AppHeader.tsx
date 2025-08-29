import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

export default function AppHeader() {
  return (
    <View style={styles.header}>
      <View style={styles.innerRow}>
        <View style={styles.logoWrap}>
          <Image
            source={require('../../assets/favicon.png')}
            style={styles.logo}
          />
        </View>
        <Text style={styles.title}>Bayaaz</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  innerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  logoWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    elevation: 0,
  },
  logo: {
    width: 34,
    height: 34,
    resizeMode: 'contain',
  },
  title: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '700',
  },
});

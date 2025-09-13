import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useThemeTokens } from '../context/SettingsContext';

export default function AppHeader() {
  const t = useThemeTokens();
  return (
    <View style={[styles.header, { backgroundColor: t.surface, borderBottomColor: t.border }] }>
      <View style={styles.innerRow}>
        <View style={styles.logoWrap}>
          <Image
            source={require('../../assets/favicon.png')}
            style={styles.logo}
          />
        </View>
        <Text style={[styles.title, { color: t.textPrimary }]}>Bayaaz</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: 1,
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
    backgroundColor: 'transparent',
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
    fontSize: 20,
    fontWeight: '700',
  },
});

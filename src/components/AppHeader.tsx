import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useThemeTokens, useSettings } from '../context/SettingsContext';

interface AppHeaderProps {
  onPress?: () => void;
}

export default function AppHeader({ onPress }: AppHeaderProps) {
  const t = useThemeTokens();
  const { theme } = useSettings();
  
  // Choose the appropriate icon based on theme
  const iconSource = theme === 'dark' 
    ? require('../../assets/pursadari-dark.png')
    : require('../../assets/pursadari-light.png');
  
  return (
    <View
      style={[
        styles.header,
        { backgroundColor: t.surface, borderBottomColor: t.border },
      ]}
    >
      <TouchableOpacity 
        style={styles.innerRow}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.logoWrap}>
          <Image
            source={iconSource}
            style={styles.logo}
          />
        </View>
      </TouchableOpacity>
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
    paddingVertical: 8,
  },
  logoWrap: {
    width: 120,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 0,
  },
  logo: {
    width: 120,
    height: 60,
    resizeMode: 'cover',
  },
});

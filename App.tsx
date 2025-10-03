/**
 * PursaDari App
 * https://github.com/smabbasht/PursaDari
 */

import React, { useEffect, useState } from 'react';
import {
  StatusBar,
  useColorScheme,
  View,
  Text,
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import databaseService from './src/database/DatabaseFactory';
import { SettingsProvider, useSettings } from './src/context/SettingsContext';
import { useThemeTokens } from './src/context/SettingsContext';

import { RootStackParamList, TabParamList } from './src/types';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import SearchScreen from './src/screens/SearchScreen';
import AddLyricsScreen from './src/screens/AddLyricsScreen';
import FavouritesScreen from './src/screens/FavouritesScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import MasaibScreen from './src/screens/MasaibScreen';
import PoetScreen from './src/screens/PoetScreen';
import ReciterScreen from './src/screens/ReciterScreen';
import KalaamScreen from './src/screens/KalaamScreen';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

// Progress Bar Component
function ProgressBar({ progress, color }: { progress: number; color: string }) {
  const width = Dimensions.get('window').width - 64; // 32px margin on each side
  const animatedWidth = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: (progress / 100) * width,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress, width]);

  return (
    <View
      style={{
        width: width,
        height: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      <Animated.View
        style={{
          height: '100%',
          backgroundColor: color,
          width: animatedWidth,
          borderRadius: 2,
        }}
      />
    </View>
  );
}

function AnimatedTabIcon({
  name,
  color,
  size,
  focused,
}: {
  name: any;
  color: string;
  size: number;
  focused: boolean;
}) {
  const scale = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1.15 : 1,
      useNativeDriver: true,
      friction: 5,
      tension: 200,
    }).start();
  }, [focused, scale]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <MaterialCommunityIcons name={name} color={color} size={size} />
    </Animated.View>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        tabBarActiveTintColor: '#16a34a',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingBottom: 5,
          paddingTop: 5,
          height: 70,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="AddLyrics"
        component={AddLyricsScreen}
        options={{
          tabBarLabel: 'Add Lyrics',
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon
              name="text-box-plus"
              color={color}
              size={size}
              focused={focused ?? false}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarLabel: 'Search',
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon
              name="magnify"
              color={color}
              size={size}
              focused={focused ?? false}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon
              name="home-variant"
              color={color}
              size={size}
              focused={focused ?? false}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Favourites"
        component={FavouritesScreen}
        options={{
          tabBarLabel: 'Favourites',
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon
              name="heart"
              color={color}
              size={size}
              focused={focused ?? false}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon
              name="cog"
              color={color}
              size={size}
              focused={focused ?? false}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [initializationStep, setInitializationStep] = useState('');

  useEffect(() => {
    async function initializeApp() {
      try {
        setInitializationStep('Initializing database...');
        setProgress(10);

        await databaseService.init();

        setInitializationStep('Loading settings...');
        setProgress(50);

        // Small delay for visual feedback
        await new Promise<void>(resolve => setTimeout(resolve, 300));

        setInitializationStep('Finalizing...');
        setProgress(90);

        await new Promise<void>(resolve => setTimeout(resolve, 200));

        setProgress(100);

        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to initialize app',
        );
        setIsLoading(false);
      }
    }

    initializeApp();
  }, []);

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: isDarkMode ? '#0b1220' : '#f9fafb',
          }}
        >
          <Image
            source={require('./assets/favicon_512.png')}
            style={{
              width: 80,
              height: 80,
              marginBottom: 8,
            }}
            resizeMode="contain"
          />
          <Text
            style={{
              marginTop: 24,
              fontSize: 24,
              fontWeight: '700',
              color: isDarkMode ? '#e5e7eb' : '#111827',
              marginBottom: 8,
            }}
          >
            Pursadari
          </Text>
          <Text
            style={{
              marginBottom: 32,
              fontSize: 16,
              color: isDarkMode ? '#94a3b8' : '#6b7280',
            }}
          >
            {initializationStep}
          </Text>
          <ProgressBar
            progress={progress}
            color={isDarkMode ? '#e5e7eb' : '#16a34a'}
          />
          <Text
            style={{
              marginTop: 16,
              fontSize: 14,
              color: isDarkMode ? '#94a3b8' : '#6b7280',
            }}
          >
            {progress}%
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }

  if (error) {
    return (
      <SafeAreaProvider>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: isDarkMode ? '#0b1220' : '#f9fafb',
            paddingHorizontal: 20,
          }}
        >
          <Image
            source={require('./assets/favicon_512.png')}
            style={{
              width: 64,
              height: 64,
              marginBottom: 8,
              opacity: 0.7,
            }}
            resizeMode="contain"
          />
          <MaterialCommunityIcons
            name="alert-circle"
            size={32}
            color={isDarkMode ? '#ef4444' : '#dc2626'}
            style={{ marginTop: -16 }}
          />
          <Text
            style={{
              fontSize: 18,
              color: isDarkMode ? '#ef4444' : '#dc2626',
              textAlign: 'center',
              marginTop: 16,
              fontWeight: '600',
            }}
          >
            Error: {error}
          </Text>
          <Text
            style={{
              marginTop: 16,
              fontSize: 14,
              color: isDarkMode ? '#94a3b8' : '#6b7280',
              textAlign: 'center',
              lineHeight: 20,
            }}
          >
            Please restart the app or check your database file.
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }

  const ThemedNav = () => {
    const { theme } = useSettings();
    const t = useThemeTokens();
    const insets = useSafeAreaInsets();
    return (
      <NavigationContainer theme={theme === 'dark' ? DarkTheme : DefaultTheme}>
        <StatusBar barStyle={t.isDark ? 'light-content' : 'dark-content'} />
        <Tab.Navigator
          initialRouteName="Home"
          screenOptions={{
            tabBarActiveTintColor: t.accent,
            tabBarInactiveTintColor: t.textMuted,
            tabBarStyle: {
              backgroundColor: t.surface,
              borderTopWidth: 1,
              borderTopColor: t.border,
              paddingBottom: Math.max(insets.bottom, 6),
              paddingTop: 6,
              height: 56 + insets.bottom,
            },
            headerShown: false,
            tabBarHideOnKeyboard: true,
          }}
        >
          <Tab.Screen
            name="AddLyrics"
            component={AddLyricsScreen}
            options={{
              tabBarLabel: 'Add Lyrics',
              tabBarIcon: ({ color, size, focused }) => (
                <AnimatedTabIcon
                  name="text-box-plus"
                  color={color}
                  size={size}
                  focused={focused ?? false}
                />
              ),
            }}
          />
          <Tab.Screen
            name="Search"
            component={SearchScreen}
            options={{
              tabBarLabel: 'Search',
              tabBarIcon: ({ color, size, focused }) => (
                <AnimatedTabIcon
                  name="magnify"
                  color={color}
                  size={size}
                  focused={focused ?? false}
                />
              ),
            }}
          />
          <Tab.Screen
            name="Home"
            children={() => (
              <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Tabs" component={HomeScreen} />
                <Stack.Screen name="Masaib" component={MasaibScreen} />
                <Stack.Screen name="Poet" component={PoetScreen} />
                <Stack.Screen name="Reciter" component={ReciterScreen} />
                <Stack.Screen name="Kalaam" component={KalaamScreen} />
              </Stack.Navigator>
            )}
            options={{
              tabBarLabel: 'Home',
              tabBarIcon: ({ color, size, focused }) => (
                <AnimatedTabIcon
                  name="home-variant"
                  color={color}
                  size={size}
                  focused={focused ?? false}
                />
              ),
            }}
          />
          <Tab.Screen
            name="Favourites"
            component={FavouritesScreen}
            options={{
              tabBarLabel: 'Favourites',
              tabBarIcon: ({ color, size, focused }) => (
                <AnimatedTabIcon
                  name="heart"
                  color={color}
                  size={size}
                  focused={focused ?? false}
                />
              ),
            }}
          />
          <Tab.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              tabBarLabel: 'Settings',
              tabBarIcon: ({ color, size, focused }) => (
                <AnimatedTabIcon
                  name="cog"
                  color={color}
                  size={size}
                  focused={focused ?? false}
                />
              ),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    );
  };

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <SettingsProvider>
        <ThemedNav />
      </SettingsProvider>
    </SafeAreaProvider>
  );
}

export default App;

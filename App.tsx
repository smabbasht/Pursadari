/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import {
  StatusBar,
  useColorScheme,
  View,
  Text,
  ActivityIndicator,
  Animated,
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
import { SettingsProvider, useSettings } from './src/context/SettingsContext';
import DatabaseService from './src/database/DatabaseService';
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
          height: 60,
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
  // Keep defaults; actual values are provided by SettingsProvider

  useEffect(() => {
    async function initializeApp() {
      try {
        await DatabaseService.init();
        setIsLoading(false);
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
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#ffffff',
        }}
      >
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#374151' }}>
          Initializing Bayaaz...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#ffffff',
        }}
      >
        <Text
          style={{
            fontSize: 18,
            color: '#dc2626',
            textAlign: 'center',
            marginHorizontal: 20,
          }}
        >
          Error: {error}
        </Text>
        <Text
          style={{
            marginTop: 16,
            fontSize: 14,
            color: '#6b7280',
            textAlign: 'center',
            marginHorizontal: 20,
          }}
        >
          Please restart the app or check your database file.
        </Text>
      </View>
    );
  }

  const ThemedNav = () => {
    const { theme } = useSettings();
    const insets = useSafeAreaInsets();
    return (
      <NavigationContainer theme={theme === 'dark' ? DarkTheme : DefaultTheme}>
        <Tab.Navigator
          initialRouteName="Home"
          screenOptions={{
            tabBarActiveTintColor: '#16a34a',
            tabBarInactiveTintColor: '#6b7280',
            tabBarStyle: {
              backgroundColor: '#ffffff',
              borderTopWidth: 1,
              borderTopColor: '#e5e7eb',
              paddingBottom: Math.max(insets.bottom, 6),
              paddingTop: 6,
              height: 56 + insets.bottom,
            },
            safeAreaInsets: { bottom: 0 },
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

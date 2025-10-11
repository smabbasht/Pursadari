/**
 * Pursadari App
 * https://github.com/smabbasht/Pursadari
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
  TouchableOpacity,
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
import database from './src/database/Database';
import { SettingsProvider, useSettings } from './src/context/SettingsContext';
import { useThemeTokens } from './src/context/SettingsContext';
import { backgroundSyncManager } from './src/services/BackgroundSyncManager';
import { foregroundSyncManager } from './src/services/ForegroundSyncManager';
import { notificationService } from './src/services/NotificationService';

import { RootStackParamList, TabParamList } from './src/types';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import SearchScreen from './src/screens/SearchScreen';
import AddLyricsScreen from './src/screens/AddLyricsScreen';
import FavouritesScreen from './src/screens/FavouritesScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ContentListScreen from './src/screens/ContentListScreen';
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

function TabNavigator({ onHeaderPress }: { onHeaderPress: () => void }) {
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
      >
        {() => <AddLyricsScreen />}
      </Tab.Screen>
      <Tab.Screen
        name="Search"
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
      >
        {() => <SearchScreen />}
      </Tab.Screen>
      <Tab.Screen
        name="Home"
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
      >
        {() => <HomeScreen />}
      </Tab.Screen>
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

// Launch Screen Component that can access theme settings
function LaunchScreen({ 
  progress, 
  onPress 
}: { 
  progress: number; 
  onPress: () => void; 
}) {
  const { theme } = useSettings();
  const isDarkMode = theme === 'dark';

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: isDarkMode ? '#0b1220' : '#f9fafb',
      }}
    >
      {/* Modern Launch Screen Design */}
      <TouchableOpacity
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 20,
        }}
        onPress={onPress}
        activeOpacity={1}
      >
        {/* Calligraphy Logo - Top Section */}
        <View
          style={{
            marginTop: -20,
            marginBottom: 16,
            alignItems: 'center',
          }}
        >
          <Image
            source={isDarkMode ? require('./assets/pursadari-calligraphy-dark.png') : require('./assets/pursadari-calligraphy-light.png')}
            style={{
              width: 200,
              height: 60,
              resizeMode: 'contain',
            }}
          />
        </View>

        {/* Main Image - Center Section */}
        <Image
          source={isDarkMode ? require('./assets/intro-pic-dark.png') : require('./assets/intro-pic-light.png')}
          style={{
            width: 320,
            height: 320,
            borderRadius: 24,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 8,
            marginBottom: 16,
          }}
          resizeMode="cover"
        />

        {/* Progress Section - Bottom Section */}
        <View
          style={{
            alignItems: 'center',
            paddingHorizontal: 20,
          }}
        >
          <Text
            style={{
              marginBottom: 16,
              fontSize: 18,
              color: isDarkMode ? '#ffffff' : '#000000',
              textAlign: 'center',
              fontFamily: 'Roboto-Medium',
              textShadowColor: isDarkMode ? '#000000' : '#ffffff',
              textShadowOffset: { width: 1, height: 1 },
              textShadowRadius: 2,
            }}
          >
            Tap Anywhere
          </Text>
          
          <ProgressBar
            progress={progress}
            color={isDarkMode ? '#ffffff' : '#16a34a'}
          />
          
          <Text
            style={{
              marginTop: 12,
              fontSize: 16,
              color: isDarkMode ? '#ffffff' : '#000000',
              fontFamily: 'Roboto-Regular',
              textShadowColor: isDarkMode ? '#000000' : '#ffffff',
              textShadowOffset: { width: 1, height: 1 },
              textShadowRadius: 2,
            }}
          >
            {progress < 100 ? 'Initializing...' : 'Ready to continue'}
          </Text>
        </View>

      </TouchableOpacity>
    </View>
  );
}

function App() {
  const systemIsDark = useColorScheme() === 'dark';
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [initializationStep, setInitializationStep] = useState('');
  const [showLaunchScreen, setShowLaunchScreen] = useState(false);

  useEffect(() => {
    async function initializeApp() {
      try {
        setInitializationStep('Initializing database...');
        setProgress(10);

        await database.init();

        setInitializationStep('Loading settings...');
        setProgress(50);

        // Small delay for visual feedback
        await new Promise<void>(resolve => setTimeout(resolve, 300));

        setInitializationStep('Finalizing...');
        setProgress(90);

        // Initialize sync managers in background (non-blocking)
        setTimeout(async () => {
          try {
            await notificationService.initialize();
            // Disabled all auto sync on launch for first release
            // await foregroundSyncManager.initialize();
            // await backgroundSyncManager.startBackgroundSync();
            console.log('[App] App initialization completed (all auto sync disabled)');
          } catch (error) {
            console.error(
              '[App] App initialization failed:',
              error,
            );
          }
        }, 100);

        setInitializationStep('Finalizing...');
        setProgress(90);

        await new Promise<void>(resolve => setTimeout(resolve, 200));

        setProgress(100);
        // Keep showing launch screen, don't auto-continue
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to initialize app',
        );
        setIsLoading(false);
      }
    }

    initializeApp();
  }, []);


  if (error) {
    return (
      <SafeAreaProvider>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: systemIsDark ? '#0b1220' : '#f9fafb',
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
            color={systemIsDark ? '#ef4444' : '#dc2626'}
            style={{ marginTop: -16 }}
          />
          <Text
            style={{
              fontSize: 18,
              color: systemIsDark ? '#ef4444' : '#dc2626',
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
              color: systemIsDark ? '#94a3b8' : '#6b7280',
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
              paddingBottom: Math.max(insets.bottom, 8),
              paddingTop: 8,
              height: 60 + Math.max(insets.bottom, 8),
              minHeight: 60,
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
                <Stack.Screen name="Masaib" component={ContentListScreen} />
                <Stack.Screen name="Poet" component={ContentListScreen} />
                <Stack.Screen name="Reciter" component={ContentListScreen} />
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

  // Show launch screen during loading or when requested
  if (isLoading || showLaunchScreen) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle={systemIsDark ? 'light-content' : 'dark-content'} />
        <SettingsProvider>
          <LaunchScreen 
            progress={progress} 
            onPress={() => {
              if (progress >= 100) {
                setShowLaunchScreen(false);
                setIsLoading(false);
              }
            }} 
          />
        </SettingsProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={systemIsDark ? 'light-content' : 'dark-content'} />
      <SettingsProvider>
        <ThemedNav />
      </SettingsProvider>
    </SafeAreaProvider>
  );
}

export default App;

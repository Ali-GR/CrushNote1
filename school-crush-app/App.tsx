import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './context/AuthContext';
import { View, Text, Modal, StyleSheet, TouchableOpacity, Platform } from 'react-native';

import AuthScreen from './screens/AuthScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import OnboardingSlidesScreen from './screens/OnboardingSlidesScreen';
import FeedScreen from './screens/FeedScreen';
import PostCreateScreen from './screens/PostCreateScreen';
import CommentsScreen from './screens/CommentsScreen';
import ReportScreen from './screens/ReportScreen';
import SplashScreen from './screens/SplashScreen';
import AdminDashboardScreen from './screens/AdminDashboardScreen';
import SettingsScreen from './screens/SettingsScreen';
import PrivacyPolicyScreen from './screens/PrivacyPolicyScreen';
import BannedScreen from './screens/BannedScreen';
import PremiumScreen from './screens/PremiumScreen';
import AGBScreen from './screens/AGBScreen';
import SupportScreen from './screens/SupportScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';

// Root Param Lists
export type RootStackParamList = {
  Splash: undefined;
  OnboardingSlides: undefined;
  AuthStack: undefined;
  Onboarding: undefined;
  MainStack: undefined;
  Banned: undefined;
  Support: { initialType?: string };
};

export type AuthStackParamList = {
  Auth: undefined;
};

export type MainStackParamList = {
  Feed: undefined;
  CreatePost: undefined;
  Comments: { post: any };
  Report: { postId?: string; commentId?: string; type: 'post' | 'comment' };
  AdminDashboard: undefined;
  Settings: undefined;
  PrivacyPolicy: undefined;
  Premium: undefined;
  AGB: undefined;
};

// Create navigators with proper typing
const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthNavigatorStack = createNativeStackNavigator<AuthStackParamList>();
const MainNavigatorStack = createNativeStackNavigator<MainStackParamList>();

function AuthNavigator() {
  return (
    <AuthNavigatorStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <AuthNavigatorStack.Screen name="Auth" component={AuthScreen} />
    </AuthNavigatorStack.Navigator>
  );
}

function MainNavigator() {
  return (
    <MainNavigatorStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#2d0a1f' },
      }}
    >
      <MainNavigatorStack.Screen name="Feed" component={FeedScreen} />
      <MainNavigatorStack.Screen
        name="CreatePost"
        component={PostCreateScreen}
        options={{ presentation: 'modal' }}
      />
      <MainNavigatorStack.Screen name="Comments" component={CommentsScreen} />
      <MainNavigatorStack.Screen
        name="Report"
        component={ReportScreen}
        options={{ presentation: 'modal' }}
      />
      <MainNavigatorStack.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{ presentation: 'modal' }}
      />
      <MainNavigatorStack.Screen name="Settings" component={SettingsScreen} />
      <MainNavigatorStack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <MainNavigatorStack.Screen
        name="Premium"
        component={PremiumScreen}
        options={{ presentation: 'modal' }}
      />
      <MainNavigatorStack.Screen name="AGB" component={AGBScreen} />
    </MainNavigatorStack.Navigator>
  );
}

function Navigation() {
  const { session, loading, hasProfile, profile, slidesSeen } = useAuth();
  const [isSplashFinished, setIsSplashFinished] = React.useState(false);

  // Check for ban
  const isBanned = profile && profile.strikes >= 3;

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsSplashFinished(true);
    }, 2500);
    
    // Request Apple Tracking Transparency permission
    const requestTracking = async () => {
      if (Platform.OS === 'ios') {
        const { status } = await requestTrackingPermissionsAsync();
        console.log('Tracking Permission Status:', status);
      }
    };
    requestTracking();
    
    return () => clearTimeout(timer);
  }, []);

  if (loading || !isSplashFinished || slidesSeen === null) {
    return (
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Splash" component={SplashScreen} />
      </RootStack.Navigator>
    );
  }

  console.log("Navigation Decision:", { isBanned, session: !!session, hasProfile, slidesSeen });

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {isBanned ? (
        <RootStack.Screen name="Banned" component={BannedScreen} />
      ) : !slidesSeen ? (
        // Every user who hasn't seen the intro slides yet
        <RootStack.Screen name="OnboardingSlides" component={OnboardingSlidesScreen} />
      ) : !session ? (
        <RootStack.Screen name="AuthStack" component={AuthNavigator} />
      ) : !hasProfile ? (
        <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : (
        <RootStack.Screen name="MainStack" component={MainNavigator} />
      )}
      <RootStack.Screen name="Support" component={SupportScreen} />
    </RootStack.Navigator>
  );
}

const styles = StyleSheet.create({
  bannedContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  bannedModal: {
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FF10F0',
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
    padding: 20,
  },
  bannedTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  bannedDivider: {
    height: 1,
    backgroundColor: '#FF10F0',
    width: '100%',
    marginBottom: 20,
  },
  bannedText: {
    color: '#ddd',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
  bannedButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#fff',
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 5,
  },
  bannedButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  }
});

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer theme={DarkTheme}>
          <Navigation />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
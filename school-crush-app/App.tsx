import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './context/AuthContext';
import { View, Text, Modal, StyleSheet, TouchableOpacity } from 'react-native';

import AuthScreen from './screens/AuthScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import FeedScreen from './screens/FeedScreen';
import PostCreateScreen from './screens/PostCreateScreen';
import CommentsScreen from './screens/CommentsScreen';
import ReportScreen from './screens/ReportScreen';
import AdminDashboardScreen from './screens/AdminDashboardScreen';
import SettingsScreen from './screens/SettingsScreen';
import PrivacyPolicyScreen from './screens/PrivacyPolicyScreen';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Root Param Lists
export type RootStackParamList = {
  AuthStack: undefined;
  Onboarding: undefined;
  MainStack: undefined;
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
    </MainNavigatorStack.Navigator>
  );
}

function Navigation() {
  const { session, loading, hasProfile, profile, signOut } = useAuth();

  // Check for ban
  const isBanned = profile && profile.strikes >= 3;

  React.useEffect(() => {
    async function handleSplashScreen() {
      if (!loading) {
        // Wait a small bit more for UI to be ready
        await new Promise(resolve => setTimeout(resolve, 500));
        await SplashScreen.hideAsync();
      }
    }
    handleSplashScreen();
  }, [loading]);

  if (loading) {
    return null; // Return null while loading, native splash screen is showing
  }

  if (isBanned) {
    return (
      <View style={styles.bannedContainer}>
        <View style={styles.bannedModal}>
          <Text style={styles.bannedTitle}>⚠️ ACCOUNT GESPERRT</Text>
          <View style={styles.bannedDivider} />
          <Text style={styles.bannedText}>
            Dein Account wurde aufgrund von wiederholten Regelverstößen gesperrt.
          </Text>
          <TouchableOpacity 
             style={styles.bannedButton} 
             onPress={() => signOut()}
          >
            <Text style={styles.bannedButtonText}>OK (Abmelden)</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {!session ? (
        <RootStack.Screen name="AuthStack" component={AuthNavigator} />
      ) : !hasProfile ? (
        <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : (
        <RootStack.Screen name="MainStack" component={MainNavigator} />
      )}
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
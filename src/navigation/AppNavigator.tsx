import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import screens
import OnboardingScreen from '../screens/OnboardingScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { CalendarScreen } from '../screens/CalendarScreen';
import { StatsScreen } from '../screens/StatsScreen';
import { HabitsScreen } from '../screens/HabitsScreen';
import MyBillsScreen from '../screens/MyBillsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import HydrationReminderScreen from '../screens/HydrationReminderScreen';
import HydrationStatsScreen from '../screens/HydrationStatsScreen';
import HydrationRemindersScreen from '../screens/HydrationRemindersScreen';
import HydrationSetupScreen from '../screens/HydrationSetupScreen';

// Import navigation components
import { BottomNavigation, NavTab } from '../components/BottomNavigation';

// Simple navigation without react-navigation to avoid Java casting error
const AppNavigator = () => {
  const { userSettings, isLoading } = useApp();
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [showRemindersTutorial, setShowRemindersTutorial] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<string | null>(null);
  const [hydrationSetupComplete, setHydrationSetupComplete] = useState<boolean | null>(null);
  const [hydrationCheckLoading, setHydrationCheckLoading] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Check hydration setup status when screen is set to HydrationReminder
  useEffect(() => {
    if (currentScreen === 'HydrationReminder' && hydrationSetupComplete === null) {
      checkHydrationSetup();
    }
  }, [currentScreen]);

  // Check if hydration setup is complete
  const checkHydrationSetup = async () => {
    setHydrationCheckLoading(true);
    try {
      const setupComplete = await AsyncStorage.getItem(
        '@nudgepal_hydration_setup_complete'
      );
      setHydrationSetupComplete(setupComplete === 'true');
    } catch (error) {
      console.error('Error checking hydration setup:', error);
      setHydrationSetupComplete(false);
    } finally {
      setHydrationCheckLoading(false);
    }
  };

  // Navigation handler
  const navigate = (screenName: string, params?: any) => {
    if (screenName === 'HydrationReminder') {
      setCurrentScreen(screenName);
    } else {
      setCurrentScreen(screenName);
    }
  };

  const navigateBack = () => {
    setCurrentScreen(null);
  };

  // While settings are loading from AsyncStorage, render a lightweight loader
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading…</Text>
      </SafeAreaView>
    );
  }

  // Just show onboarding if not completed
  if (!userSettings.hasCompletedOnboarding) {
    return <OnboardingScreen />;
  }

  // Render the appropriate screen based on active tab
  const renderScreen = () => {
    // If a specific screen is set (like hydration screens), render that
    if (currentScreen) {
      switch (currentScreen) {
        case 'HydrationReminder':
          // Show setup screen if not complete
          if (hydrationSetupComplete === false) {
            return (
              <HydrationSetupScreen
                navigation={{
                  goBack: navigateBack,
                  navigate,
                  replace: (screenName: string) => {
                    setCurrentScreen(screenName);
                    setHydrationSetupComplete(true);
                  },
                }}
                onComplete={() => {
                  setHydrationSetupComplete(true);
                  setCurrentScreen('HydrationReminder');
                }}
              />
            );
          }
          // Show reminder screen if setup is complete
          if (hydrationSetupComplete === true) {
            return (
              <HydrationReminderScreen
                navigation={{ goBack: navigateBack, navigate }}
              />
            );
          }
          // Show loading while checking
          return (
            <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
              <ActivityIndicator size="large" color={colors.primary} />
            </SafeAreaView>
          );
        case 'HydrationStats':
          return (
            <HydrationStatsScreen
              navigation={{ goBack: navigateBack, navigate }}
            />
          );
        case 'HydrationReminders':
          return (
            <HydrationRemindersScreen
              navigation={{ goBack: navigateBack, navigate }}
            />
          );
        default:
          return null;
      }
    }

    // Otherwise render based on tabs
    switch (activeTab) {
      case 'home':
        return (
          <DashboardScreen
            onMenuPress={() => {}}
            onProfilePress={() => setShowProfile(true)}
            onNavigateToReminders={() => {
              setShowRemindersTutorial(true);
              setActiveTab('calendar');
            }}
          />
        );
      case 'calendar':
        return (
          <CalendarScreen
            onMenuPress={() => {}}
            onProfilePress={() => setShowProfile(true)}
            showRemindersTutorial={showRemindersTutorial}
            onTutorialClose={() => setShowRemindersTutorial(false)}
          />
        );
      case 'habits':
        return (
          <HabitsScreen 
            onProfilePress={() => setShowProfile(true)}
          />
        );
      case 'bills':
        return (
          <MyBillsScreen 
            onProfilePress={() => setShowProfile(true)}
          />
        );
      case 'hydration':
        return (
          <HydrationReminderScreen
            navigation={{ goBack: () => setActiveTab('home'), navigate: () => {} }}
            onProfilePress={() => setShowProfile(true)}
          />
        );
      default:
        return (
          <DashboardScreen
            onMenuPress={() => {}}
            onProfilePress={() => setShowProfile(true)}
          />
        );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Main Content */}
      {renderScreen()}

      {/* Bottom Navigation - only show when not on a modal screen */}
      {!currentScreen && (
        <BottomNavigation
          activeTab={activeTab}
          onTabPress={(tab) => {
            setActiveTab(tab);
          }}
        />
      )}

      {/* Profile Modal */}
      {showProfile && (
        <View style={styles.modalContainer}>
          <ProfileScreen
            onBack={() => setShowProfile(false)}
          />
        </View>
      )}
    </View>
  );
};

export default AppNavigator;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
});
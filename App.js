import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from './src/contexts/AppContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { BillsProvider } from './src/contexts/BillsContext';
import { ErrorBoundary } from './src/ErrorBoundary';
import AppNavigator from './src/navigation/AppNavigator';
import { setupNotifications } from './src/utils/notificationSetup';

function AppContent() {
  useEffect(() => {
    // Setup notifications on app start
    setupNotifications().catch(error => {
      console.warn('⚠️ Notification setup failed:', error);
      // Don't crash the app if notifications fail
    });
  }, []);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <AppProvider>
            <ThemeProvider>
              <BillsProvider>
                <StatusBar barStyle="dark-content" />
                <AppNavigator />
              </BillsProvider>
            </ThemeProvider>
          </AppProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

export default function App() {
  return <AppContent />;
}

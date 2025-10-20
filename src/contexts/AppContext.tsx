import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

// Language types
export type Language = 'en' | 'fr' | 'ar';

// Theme types
export type Theme = 'light' | 'dark';

// User settings interface
interface UserSettings {
  name: string;
  language: Language;
  theme: Theme;
  hasCompletedOnboarding: boolean;
  notificationsEnabled: boolean;
  hydrationGoal: number; // ml per day
  hydrationInterval: number; // minutes
}

// App context interface
interface AppContextType {
  userSettings: UserSettings;
  updateUserSettings: (settings: Partial<UserSettings>) => Promise<void>;
  isLoading: boolean;
  isRTL: boolean;
}

// Default settings
const defaultSettings: UserSettings = {
  name: '',
  language: 'en',
  theme: 'light',
  hasCompletedOnboarding: false,
  notificationsEnabled: true,
  hydrationGoal: 2000, // 2L per day
  hydrationInterval: 75, // 75 minutes
};

// Create context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Storage keys
const STORAGE_KEYS = {
  USER_SETTINGS: '@nudgepal_user_settings',
};

// Language detection helper
const detectLanguage = (): Language => {
  const locale = Localization.getLocales()[0]?.languageCode || 'en';
  if (locale.startsWith('fr')) return 'fr';
  if (locale.startsWith('ar')) return 'ar';
  return 'en';
};

// App provider component
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userSettings, setUserSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from storage with timeout
  const loadSettings = async () => {
    try {
      console.log('🚀 AppContext: Starting loadSettings');
      
      // Add a small delay to ensure native modules are initialized
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Wrap AsyncStorage in a timeout promise to prevent indefinite hanging
      const settingsPromise = AsyncStorage.getItem(STORAGE_KEYS.USER_SETTINGS);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AsyncStorage timeout')), 2000)
      );
      
      let storedSettings;
      try {
        storedSettings = await Promise.race([settingsPromise, timeoutPromise]) as string | null;
      } catch (timeoutError) {
        console.warn('⏱️ AsyncStorage timeout, using defaults:', timeoutError);
        storedSettings = null;
      }
      
      if (storedSettings) {
        console.log('✅ Loaded stored settings');
        const parsed = JSON.parse(storedSettings);
        setUserSettings({ ...defaultSettings, ...parsed });
      } else {
        // Set detected language as default
        console.log('📍 No stored settings, using defaults');
        const detectedLang = detectLanguage();
        setUserSettings({ ...defaultSettings, language: detectedLang });
      }
    } catch (error) {
      console.warn('⚠️ Error loading user settings (using defaults):', error);
      // Still set defaults even if storage fails
      const detectedLang = detectLanguage();
      setUserSettings({ ...defaultSettings, language: detectedLang });
    } finally {
      console.log('✨ AppContext: loadSettings complete, setting isLoading = false');
      setIsLoading(false);
    }
  };

  // Update settings
  const updateUserSettings = async (newSettings: Partial<UserSettings>) => {
    try {
      const updatedSettings = { ...userSettings, ...newSettings };
      setUserSettings(updatedSettings);
      // Try to save to storage, but don't crash if it fails
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify(updatedSettings));
      } catch (storageError) {
        console.warn('Failed to save to AsyncStorage:', storageError);
      }
    } catch (error) {
      console.warn('Error updating user settings:', error);
    }
  };

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Check if current language is RTL
  const isRTL = userSettings.language === 'ar';

  return (
    <AppContext.Provider
      value={{
        userSettings,
        updateUserSettings,
        isLoading,
        isRTL,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// Hook to use app context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
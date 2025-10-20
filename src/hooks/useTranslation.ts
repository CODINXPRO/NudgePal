import { useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import { translations } from '../i18n';
import { getDirection, getTextAlign, getFlexDirection } from '../utils/rtlUtils';

/**
 * Enhanced useTranslation hook
 * Provides access to translations, RTL utilities, and language switching
 */
export const useTranslation = () => {
  const { userSettings, updateUserSettings, isRTL } = useApp();
  
  // Current language translations
  const t = translations[userSettings.language];
  
  // Change language programmatically
  const setLanguage = useCallback(
    async (language: 'en' | 'fr' | 'ar') => {
      try {
        await updateUserSettings({ language });
      } catch (error) {
        console.error('Failed to change language:', error);
      }
    },
    [updateUserSettings]
  );
  
  return {
    // Translations
    t,
    
    // Current language code
    language: userSettings.language,
    
    // RTL indicator
    isRTL,
    
    // Direction string ('rtl' | 'ltr')
    dir: getDirection(isRTL),
    
    // Language switching function
    setLanguage,
    
    // RTL utility helpers
    textAlign: (preferred: 'left' | 'right' | 'center' = 'left') =>
      getTextAlign(isRTL, preferred),
    
    flexDirection: (preferred: 'row' | 'column' = 'row') =>
      getFlexDirection(isRTL, preferred),
    
    // Language list
    supportedLanguages: [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'fr', name: 'Français', nativeName: 'Français' },
      { code: 'ar', name: 'العربية', nativeName: 'العربية' },
    ] as const,
  };
};

/**
 * Hook for time-based greetings
 */
export const useGreeting = () => {
  const { t, language } = useTranslation();
  const { userSettings } = useApp();
  
  const getGreeting = useCallback(() => {
    const hour = new Date().getHours();
    
    if (hour < 12) {
      return t.greetings.goodMorning;
    } else if (hour < 17) {
      return t.greetings.goodAfternoon;
    } else {
      return t.greetings.goodEvening;
    }
  }, [t, language]);

  const getPersonalizedGreeting = useCallback(() => {
    const greeting = getGreeting();
    return userSettings.name ? `${greeting}, ${userSettings.name}!` : `${greeting}!`;
  }, [userSettings.name, getGreeting]);

  return { getGreeting, getPersonalizedGreeting };
};

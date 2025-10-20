import { useApp } from '../contexts/AppContext';
import translations, { Translations } from '../utils/translations';

// Hook returning translations and direction helper
export const useTranslation = (): {
  t: Translations;
  isRTL: boolean;
  dir: 'rtl' | 'ltr';
} => {
  const { userSettings, isRTL } = useApp();
  return { t: translations[userSettings.language], isRTL, dir: isRTL ? 'rtl' : 'ltr' };
};

export const useGreeting = () => {
  const { userSettings } = useApp();
  const { t } = useTranslation();
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    
    if (hour < 12) {
      return t.goodMorning;
    } else if (hour < 17) {
      return t.goodAfternoon;
    } else {
      return t.goodEvening;
    }
  };

  const getPersonalizedGreeting = () => {
    const greeting = getGreeting();
    return userSettings.name ? `${greeting}, ${userSettings.name}!` : `${greeting}!`;
  };

  return { getGreeting, getPersonalizedGreeting };
};
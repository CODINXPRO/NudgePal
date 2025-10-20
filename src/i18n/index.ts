import en from './en.json';
import fr from './fr.json';
import ar from './ar.json';
import { Language } from '../contexts/AppContext';

// Type for translation keys
export type TranslationKey = string;

// Export translations object
export const translations: Record<Language, typeof en> = {
  en,
  fr,
  ar,
};

/**
 * Helper function to get nested translation value
 * Usage: getTranslation(t, 'dashboard.dailyHub')
 */
export const getTranslation = (
  translations: typeof en,
  key: string,
  defaultValue: string = key
): string => {
  try {
    const keys = key.split('.');
    let value: any = translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return defaultValue;
      }
    }
    
    return typeof value === 'string' ? value : defaultValue;
  } catch {
    return defaultValue;
  }
};

export default translations;

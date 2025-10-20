import { getLocales } from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  locale: string;
}

// Currency mapping by country code
const CURRENCY_MAP: { [key: string]: CurrencyInfo } = {
  US: { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
  GB: { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
  EU: { code: 'EUR', symbol: '€', name: 'Euro', locale: 'en-EU' },
  FR: { code: 'EUR', symbol: '€', name: 'Euro', locale: 'fr-FR' },
  DE: { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
  IT: { code: 'EUR', symbol: '€', name: 'Euro', locale: 'it-IT' },
  ES: { code: 'EUR', symbol: '€', name: 'Euro', locale: 'es-ES' },
  NL: { code: 'EUR', symbol: '€', name: 'Euro', locale: 'nl-NL' },
  BE: { code: 'EUR', symbol: '€', name: 'Euro', locale: 'nl-BE' },
  AT: { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-AT' },
  GR: { code: 'EUR', symbol: '€', name: 'Euro', locale: 'el-GR' },
  PT: { code: 'EUR', symbol: '€', name: 'Euro', locale: 'pt-PT' },
  IE: { code: 'EUR', symbol: '€', name: 'Euro', locale: 'en-IE' },
  FI: { code: 'EUR', symbol: '€', name: 'Euro', locale: 'fi-FI' },
  JP: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP' },
  CN: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', locale: 'zh-CN' },
  IN: { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN' },
  CA: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', locale: 'en-CA' },
  AU: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU' },
  BR: { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', locale: 'pt-BR' },
  MX: { code: 'MXN', symbol: '$', name: 'Mexican Peso', locale: 'es-MX' },
  ZA: { code: 'ZAR', symbol: 'R', name: 'South African Rand', locale: 'en-ZA' },
  CH: { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', locale: 'de-CH' },
  SE: { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', locale: 'sv-SE' },
  NO: { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', locale: 'nb-NO' },
  DK: { code: 'DKK', symbol: 'kr', name: 'Danish Krone', locale: 'da-DK' },
  PL: { code: 'PLN', symbol: 'zł', name: 'Polish Zloty', locale: 'pl-PL' },
  CZ: { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna', locale: 'cs-CZ' },
  RU: { code: 'RUB', symbol: '₽', name: 'Russian Ruble', locale: 'ru-RU' },
  TR: { code: 'TRY', symbol: '₺', name: 'Turkish Lira', locale: 'tr-TR' },
  SA: { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', locale: 'ar-SA' },
  AE: { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', locale: 'ar-AE' },
  EG: { code: 'EGP', symbol: '£', name: 'Egyptian Pound', locale: 'ar-EG' },
  NG: { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', locale: 'en-NG' },
  KE: { code: 'KES', symbol: 'Sh', name: 'Kenyan Shilling', locale: 'en-KE' },
  MA: { code: 'MAD', symbol: 'د.م.', name: 'Moroccan Dirham', locale: 'ar-MA' },
  TN: { code: 'TND', symbol: 'د.ت', name: 'Tunisian Dinar', locale: 'ar-TN' },
  DZ: { code: 'DZD', symbol: 'د.ج', name: 'Algerian Dinar', locale: 'ar-DZ' },
  TH: { code: 'THB', symbol: '฿', name: 'Thai Baht', locale: 'th-TH' },
  MY: { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', locale: 'ms-MY' },
  SG: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', locale: 'en-SG' },
  PH: { code: 'PHP', symbol: '₱', name: 'Philippine Peso', locale: 'en-PH' },
  ID: { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', locale: 'id-ID' },
  VN: { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', locale: 'vi-VN' },
  PK: { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee', locale: 'en-PK' },
  BD: { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', locale: 'bn-BD' },
  HK: { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', locale: 'en-HK' },
  TW: { code: 'TWD', symbol: 'NT$', name: 'New Taiwan Dollar', locale: 'zh-TW' },
  NZ: { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', locale: 'en-NZ' },
};

const STORAGE_KEY = 'userCurrency';

export class CurrencyService {
  private static instance: CurrencyInfo | null = null;

  /**
   * Get the user's currency based on device locale
   */
  static async getUserCurrency(): Promise<CurrencyInfo> {
    // Check if user has already set a currency preference
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }

    // Get device locale
    const locales = getLocales();
    if (locales && locales.length > 0) {
      const locale = locales[0];
      const countryCode = locale.regionCode?.toUpperCase();

      if (countryCode && CURRENCY_MAP[countryCode]) {
        const currency = CURRENCY_MAP[countryCode];
        // Cache it for future use
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(currency));
        return currency;
      }
    }

    // Default to USD if locale not recognized
    const defaultCurrency = CURRENCY_MAP.US;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(defaultCurrency));
    return defaultCurrency;
  }

  /**
   * Set a custom currency for the user
   */
  static async setUserCurrency(countryCode: string): Promise<CurrencyInfo | null> {
    const currency = CURRENCY_MAP[countryCode.toUpperCase()];
    if (currency) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(currency));
      this.instance = currency;
      return currency;
    }
    return null;
  }

  /**
   * Format an amount with the user's currency
   */
  static async formatCurrency(amount: number): Promise<string> {
    const currency = await this.getUserCurrency();
    
    // Format based on currency locale
    return new Intl.NumberFormat(currency.locale, {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  /**
   * Format amount with just the symbol
   */
  static async formatSimple(amount: number): Promise<string> {
    const currency = await this.getUserCurrency();
    const formatted = amount.toFixed(2);
    return `${currency.symbol}${formatted}`;
  }

  /**
   * Get current currency info without formatting
   */
  static async getCurrencyInfo(): Promise<CurrencyInfo> {
    return this.getUserCurrency();
  }

  /**
   * Get currency symbol only
   */
  static async getCurrencySymbol(): Promise<string> {
    const currency = await this.getUserCurrency();
    return currency.symbol;
  }

  /**
   * Get all available currencies
   */
  static getAvailableCurrencies(): CurrencyInfo[] {
    return Object.values(CURRENCY_MAP);
  }
}

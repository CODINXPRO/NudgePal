import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  I18nManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp, Language } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContext';
import { translations } from '../i18n';

const OnboardingScreen: React.FC = () => {
  const { userSettings, updateUserSettings, isRTL } = useApp();
  const { colors, isDark } = useTheme();
  const [name, setName] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(userSettings.language);
  
  const t = translations[selectedLanguage];

  const languages = [
    { code: 'en' as Language, name: 'English', flag: '🇺🇸' },
    { code: 'fr' as Language, name: 'Français', flag: '🇫🇷' },
    { code: 'ar' as Language, name: 'العربية', flag: '🇸🇦' },
  ];

  const handleGetStarted = async () => {
    if (!name.trim()) {
      Alert.alert('Name Required', 'Please enter your name to continue.');
      return;
    }

    try {
      // Update RTL layout if Arabic is selected
      if (selectedLanguage === 'ar') {
        I18nManager.forceRTL(true);
      } else {
        I18nManager.forceRTL(false);
      }

      await updateUserSettings({
        name: name.trim(),
        language: selectedLanguage,
        hasCompletedOnboarding: true,
      });

      // App will automatically switch to MyDay screen when hasCompletedOnboarding becomes true
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        backgroundColor={colors.background}
      />
      <LinearGradient
        colors={isDark ? [colors.primary, colors.secondary] : ['#6366f1', '#8b5cf6', '#06b6d4'] as const}
        style={styles.gradient}
      >
        <View style={[styles.content, isRTL && styles.rtlContent]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.welcomeText, { color: '#ffffff' }, isRTL && styles.rtlText]}>
              {t.onboarding.welcome}
            </Text>
            <Text style={[styles.subtitleText, { color: 'rgba(255, 255, 255, 0.9)' }, isRTL && styles.rtlText]}>
              {t.onboarding.welcomeSubtitle}
            </Text>
          </View>

          {/* Name Input */}
          <View style={styles.inputSection}>
            <Text style={[styles.questionText, { color: '#ffffff' }, isRTL && styles.rtlText]}>
              {t.onboarding.nameQuestion}
            </Text>
            <TextInput
              style={[
                styles.nameInput,
                { backgroundColor: 'rgba(255, 255, 255, 0.15)', color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.3)' },
                isRTL && styles.rtlInput,
              ]}
              placeholder={t.onboarding.namePlaceholder}
              placeholderTextColor="rgba(255, 255, 255, 0.7)"
              value={name}
              onChangeText={setName}
              textAlign={isRTL ? 'right' : 'left'}
            />
          </View>

          {/* Language Selection */}
          <View style={styles.languageSection}>
            <Text style={[styles.questionText, { color: '#ffffff' }, isRTL && styles.rtlText]}>
              {t.onboarding.selectLanguage}
            </Text>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageOption,
                  selectedLanguage === lang.code && styles.selectedLanguage,
                  isRTL && styles.rtlLanguageOption,
                ]}
                onPress={() => setSelectedLanguage(lang.code)}
              >
                <Text style={styles.flagText}>{lang.flag}</Text>
                <Text style={[
                  styles.languageText,
                  { color: selectedLanguage === lang.code ? '#ffffff' : 'rgba(255, 255, 255, 0.8)' },
                  selectedLanguage === lang.code && styles.selectedLanguageText,
                  isRTL && styles.rtlLanguageText,
                ]}>
                  {lang.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Get Started Button */}
          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={handleGetStarted}
          >
            <Text style={styles.getStartedText}>{t.onboarding.getStarted}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  rtlContent: {
    alignItems: 'flex-end',
  },
  header: {
    marginBottom: 40,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitleText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  rtlText: {
    textAlign: 'right',
  },
  inputSection: {
    marginBottom: 32,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 12,
  },
  nameInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: 'white',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  rtlInput: {
    textAlign: 'right',
  },
  languageSection: {
    marginBottom: 40,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  rtlLanguageOption: {
    flexDirection: 'row-reverse',
  },
  selectedLanguage: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  flagText: {
    fontSize: 20,
    marginRight: 12,
  },
  languageText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  rtlLanguageText: {
    marginRight: 0,
    marginLeft: 12,
  },
  selectedLanguageText: {
    color: 'white',
    fontWeight: 'bold',
  },
  getStartedButton: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 'auto',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  getStartedText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6366f1',
  },
});

export default OnboardingScreen;
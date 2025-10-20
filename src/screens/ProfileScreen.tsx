import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Switch,
  Alert,
  Image,
  ActivityIndicator,
  Modal,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
// import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';
import { Language } from '../contexts/AppContext';

interface ProfileScreenProps {
  onBack: () => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ onBack }) => {
  const { userSettings, updateUserSettings, isRTL } = useApp();
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();

  const [editingField, setEditingField] = useState<string | null>(null);
  const [editName, setEditName] = useState(userSettings.name);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [loadingPhoto, setLoadingPhoto] = useState(false);
  const [tempPhotoUri, setTempPhotoUri] = useState<string | null>(null);
  const [showPhotoPreview, setShowPhotoPreview] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(userSettings.theme === 'dark');
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const scaleAnim = useState(new Animated.Value(0))[0];
  const fadeAnim = useState(new Animated.Value(0))[0];

  // Define loadProfilePhoto function BEFORE using it in useEffect
  const loadProfilePhoto = async () => {
    try {
      const savedPhoto = await AsyncStorage.getItem('@nudgepal_profile_photo');
      if (savedPhoto) {
        setProfilePhoto(savedPhoto);
      }
    } catch (error) {
      console.error('Error loading profile photo:', error);
    }
  };

  // Load profile photo on component mount with timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      console.warn('⏱️ ProfileScreen: loadProfilePhoto timeout, skipping');
      setLoadingPhoto(false);
    }, 2000);
    
    loadProfilePhoto().finally(() => clearTimeout(timer));
  }, []);

  const saveProfilePhoto = async (photoUri: string) => {
    try {
      await AsyncStorage.setItem('@nudgepal_profile_photo', photoUri);
      setProfilePhoto(photoUri);
    } catch (error) {
      console.error('Error saving profile photo:', error);
      Alert.alert(t.alerts.error, t.alerts.failedToSavePhoto);
    }
  };

  const removeProfilePhoto = async () => {
    try {
      await AsyncStorage.removeItem('@nudgepal_profile_photo');
      setProfilePhoto(null);
    } catch (error) {
      console.error('Error removing profile photo:', error);
    }
  };

  const handleAvatarPress = async () => {
    Alert.alert('Upload Photo', 'Choose a photo source', [
      {
        text: 'Camera',
        onPress: handleCameraPhoto,
      },
      {
        text: 'Gallery',
        onPress: handleGalleryPhoto,
      },
      profilePhoto ? {
        text: 'Remove Photo',
        onPress: () => {
          removeProfilePhoto();
        },
        style: 'destructive',
      } : null,
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ].filter(Boolean) as any);
  };

  const handleCameraPhoto = async () => {
    try {
      setLoadingPhoto(true);
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Camera access is required to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setTempPhotoUri(result.assets[0].uri);
        setShowPhotoPreview(true);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    } finally {
      setLoadingPhoto(false);
    }
  };

  const handleGalleryPhoto = async () => {
    try {
      setLoadingPhoto(true);
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Gallery access is required');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setTempPhotoUri(result.assets[0].uri);
        setShowPhotoPreview(true);
      }
    } catch (error) {
      console.error('Error picking photo:', error);
      Alert.alert('Error', 'Failed to pick photo');
    } finally {
      setLoadingPhoto(false);
    }
  };

  const handleSaveName = async () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }
    await updateUserSettings({ name: editName.trim() });
    setEditingField(null);
  };

  const handleConfirmPhoto = async () => {
    if (tempPhotoUri) {
      await saveProfilePhoto(tempPhotoUri);
      setShowPhotoPreview(false);
      setTempPhotoUri(null);
    }
  };

  const handleCancelPhoto = () => {
    setShowPhotoPreview(false);
    setTempPhotoUri(null);
  };

  const handleNotificationToggle = async (value: boolean) => {
    if (value) {
      // Request notification permissions when enabling
      try {
        // const { status } = await Notifications.requestPermissionsAsync();
        // if (status === 'granted') {
          setNotifications(true);
          await updateUserSettings({ notificationsEnabled: true });
          Alert.alert(
            'Notifications Enabled',
            'Local notifications are active. Note: Remote push notifications require a development build (not available in Expo Go).'
          );
        // } else {
        //   Alert.alert('Permission Denied', 'Notification permissions are required to enable notifications');
        //   setNotifications(false);
        // }
      } catch (error) {
        console.error('Error requesting notification permissions:', error);
        Alert.alert('Info', 'Notifications setup: Using local notifications only in Expo Go');
        setNotifications(true);
        await updateUserSettings({ notificationsEnabled: true });
      }
    } else {
      // Disable notifications
      setNotifications(false);
      await updateUserSettings({ notificationsEnabled: false });
      Alert.alert('Notifications Disabled', 'You will no longer receive notifications');
    }
  };

  const handleDarkModeToggle = async (value: boolean) => {
    setDarkMode(value);
    await updateUserSettings({ theme: value ? 'dark' : 'light' });
    Alert.alert('Theme Changed', `Switched to ${value ? 'Dark' : 'Light'} Mode. The app will update after restart.`);
  };

  const handleLanguageChange = async (language: 'en' | 'fr' | 'ar') => {
    await updateUserSettings({ language });
    // Animate modal close
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 250,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowLanguageModal(false);
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
    });
  };

  useEffect(() => {
    if (showLanguageModal) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showLanguageModal]);

  const SectionHeader = ({ title, emoji }: { title: string; emoji: string }) => (
    <View style={[styles.sectionHeader, isRTL && styles.sectionHeaderRTL]}>
      <Text style={styles.sectionEmoji}>{emoji}</Text>
      <Text style={[styles.sectionTitle, { color: colors.text }, isRTL && styles.rtlText]}>{title}</Text>
    </View>
  );

  const EditableField = ({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) => (
    <TouchableOpacity
      style={[styles.editableField, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }, isRTL && styles.editableFieldRTL]}
      onPress={onEdit}
    >
      <View style={styles.fieldLeft}>
        <Text style={[styles.fieldLabel, { color: colors.textSecondary }, isRTL && styles.rtlText]}>{label}</Text>
        <Text style={[styles.fieldValue, { color: colors.text }, isRTL && styles.rtlText]}>{value}</Text>
      </View>
      <Text style={styles.editIcon}>✏️</Text>
    </TouchableOpacity>
  );

  const SettingToggle = ({ label, emoji, value, onToggle }: { label: string; emoji: string; value: boolean; onToggle: (val: boolean) => void }) => (
    <View style={[styles.settingToggle, { backgroundColor: colors.surfaceAlt }, isRTL && styles.settingToggleRTL]}>
      <View style={styles.settingLeft}>
        <Text style={styles.settingEmoji}>{emoji}</Text>
        <Text style={[styles.settingLabel, { color: colors.text }, isRTL && styles.rtlText]}>{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: colors.info }}
        thumbColor={value ? colors.primary : colors.textTertiary}
      />
    </View>
  );

  const NavigationOption = ({ label, emoji, onPress }: { label: string; emoji: string; onPress: () => void }) => (
    <TouchableOpacity
      style={[styles.navigationOption, { backgroundColor: colors.surfaceAlt }, isRTL && styles.navigationOptionRTL]}
      onPress={onPress}
    >
      <View style={styles.navOptionLeft}>
        <Text style={styles.navOptionEmoji}>{emoji}</Text>
        <Text style={[styles.navOptionLabel, { color: colors.text }, isRTL && styles.rtlText]}>{label}</Text>
      </View>
      <Text style={[styles.navOptionArrow, { color: colors.textTertiary }]}>›</Text>
    </TouchableOpacity>
  );

  // Photo preview modal component
  const PhotoPreviewModal = () => (
    <Modal
      visible={showPhotoPreview}
      transparent={true}
      animationType="fade"
      onRequestClose={handleCancelPhoto}
    >
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.7)' }]}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <Text style={[styles.modalTitle, { color: colors.text }, isRTL && styles.rtlText]}>{t.profile.previewPhoto || "Preview Photo"}</Text>
          
          {tempPhotoUri && (
            <Image
              source={{ uri: tempPhotoUri }}
              style={styles.previewImage}
            />
          )}
          
          <View style={styles.modalButtonsContainer}>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.border }]}
              onPress={handleCancelPhoto}
            >
              <Text style={[styles.modalButtonText, { color: colors.text }]}>{t.common.cancel}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.primary }]}
              onPress={handleConfirmPhoto}
            >
              <Text style={[styles.modalButtonText, { color: '#ffffff' }]}>{t.common.confirm}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <>
      <PhotoPreviewModal />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar 
          barStyle={isDark ? 'light-content' : 'dark-content'} 
          backgroundColor={colors.background} 
        />
        <LinearGradient 
          colors={isDark ? [colors.surface, colors.background] : ['#f8fafc', '#f1f5f9']} 
          style={styles.gradient}
        >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
          >
            <Text style={[styles.backIcon, { color: colors.primary }]}>{isRTL ? '›' : '‹'}</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }, isRTL && styles.rtlText]}>👤 {t.profile.profile || "Profile"}</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Content */}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Premium Profile Card */}
          <View style={[styles.premiumCardContainer, { backgroundColor: colors.primary }]}>
            <LinearGradient
              colors={[colors.primary, `${colors.primary}dd`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.premiumGradient}
            >
              <TouchableOpacity
                style={styles.avatarContainerPremium}
                onPress={handleAvatarPress}
                disabled={loadingPhoto}
              >
                {loadingPhoto ? (
                  <View style={[styles.avatarPremium, { backgroundColor: `${colors.primary}88` }]}>
                    <ActivityIndicator size="large" color="white" />
                  </View>
                ) : profilePhoto ? (
                  <>
                    <Image
                      source={{ uri: profilePhoto }}
                      style={styles.avatarImagePremium}
                    />
                    <View style={styles.cameraOverlayPremium}>
                      <Text style={styles.cameraIconPremium}>📷</Text>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={[styles.avatarPremium, { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
                      <Text style={styles.avatarTextPremium}>
                        {userSettings.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.cameraOverlayPremium}>
                      <Text style={styles.cameraIconPremium}>📷</Text>
                    </View>
                  </>
                )}
              </TouchableOpacity>
              <Text style={styles.userNamePremium}>
                {userSettings.name}
              </Text>
              <Text style={styles.premiumBadge}>✨ NudgePal User</Text>
            </LinearGradient>
          </View>

          {/* Personal Information Section */}
          <View style={styles.section}>
            <SectionHeader title={t.profile.personalInformation || "Personal Information"} emoji="👤" />
            
            {editingField === 'name' ? (
              <View style={[styles.editingContainer, { backgroundColor: colors.surfaceAlt }, isRTL && styles.editingContainerRTL]}>
                <TextInput
                  style={[styles.editInput, { backgroundColor: colors.inputBackground, color: colors.inputText, borderColor: colors.inputBorder }, isRTL && styles.editInputRTL]}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Enter your name"
                  placeholderTextColor={colors.inputPlaceholder}
                />
                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: colors.primary }]}
                  onPress={handleSaveName}
                >
                  <Text style={[styles.saveButtonText, { color: '#ffffff' }]}>Save</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <EditableField
                label="Name"
                value={userSettings.name}
                onEdit={() => setEditingField('name')}
              />
            )}
          </View>

          {/* Preferences Section */}
          <View style={styles.section}>
            <SectionHeader title={t.profile.preferences || "Preferences"} emoji="⚙️" />
            
            <SettingToggle
              label="Notifications"
              emoji="🔔"
              value={notifications}
              onToggle={handleNotificationToggle}
            />
            
            <SettingToggle
              label="Dark Mode"
              emoji="🌙"
              value={darkMode}
              onToggle={handleDarkModeToggle}
            />
          </View>

          {/* Settings Navigation Section */}
          <View style={styles.section}>
            <SectionHeader title={t.profile.advancedSettings || "Advanced Settings"} emoji="🔧" />
            
            <NavigationOption
              label={t.profile.language || "Language & Region"}
              emoji="🌐"
              onPress={() => setShowLanguageModal(true)}
            />
            
            <NavigationOption
              label={t.profile.about || "About App"}
              emoji="ℹ️"
              onPress={() => Alert.alert(t.profile.about || 'About', `${t.profile.appVersion || 'Version'} 1.0.0\n\nA daily habit and bill reminder app`)}
            />
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </LinearGradient>

      {/* Language Selection Modal */}
      <Modal 
        visible={showLanguageModal} 
        transparent 
        animationType="none"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <Animated.View style={[styles.languageModalOverlay, { opacity: fadeAnim }]}>
          <Animated.View
            style={[
              styles.languageModalContainer,
              {
                backgroundColor: colors.surface,
                transform: [
                  { scale: scaleAnim },
                  {
                    translateY: scaleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [100, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {/* Header */}
            <View style={[styles.languageModalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.languageModalTitle, { color: colors.text }]}>
                🌐 {t.profile.language || "Select Language"}
              </Text>
              <Text style={[styles.languageModalSubtitle, { color: colors.textSecondary }]}>
                {t.alerts.choosePreferredLanguage}
              </Text>
            </View>

            {/* Language Options */}
            <View style={styles.languageOptions}>
              {/* English */}
              <TouchableOpacity
                style={[
                  styles.languageOption,
                  {
                    backgroundColor: userSettings.language === 'en' ? `${colors.primary}10` : colors.surface,
                    borderColor: userSettings.language === 'en' ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => handleLanguageChange('en')}
              >
                <View style={styles.languageOptionLeft}>
                  <Text style={styles.languageFlag}>🇺🇸</Text>
                  <View>
                    <Text style={[styles.languageName, { color: colors.text }]}>English</Text>
                    <Text style={[styles.languageNative, { color: colors.textSecondary }]}>English</Text>
                  </View>
                </View>
                {userSettings.language === 'en' && (
                  <View style={[styles.checkmark, { backgroundColor: colors.primary }]}>
                    <Text style={styles.checkmarkIcon}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* French */}
              <TouchableOpacity
                style={[
                  styles.languageOption,
                  {
                    backgroundColor: userSettings.language === 'fr' ? `${colors.primary}10` : colors.surface,
                    borderColor: userSettings.language === 'fr' ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => handleLanguageChange('fr')}
              >
                <View style={styles.languageOptionLeft}>
                  <Text style={styles.languageFlag}>🇫🇷</Text>
                  <View>
                    <Text style={[styles.languageName, { color: colors.text }]}>Français</Text>
                    <Text style={[styles.languageNative, { color: colors.textSecondary }]}>French</Text>
                  </View>
                </View>
                {userSettings.language === 'fr' && (
                  <View style={[styles.checkmark, { backgroundColor: colors.primary }]}>
                    <Text style={styles.checkmarkIcon}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Arabic */}
              <TouchableOpacity
                style={[
                  styles.languageOption,
                  {
                    backgroundColor: userSettings.language === 'ar' ? `${colors.primary}10` : colors.surface,
                    borderColor: userSettings.language === 'ar' ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => handleLanguageChange('ar')}
              >
                <View style={styles.languageOptionLeft}>
                  <Text style={styles.languageFlag}>🇸🇦</Text>
                  <View>
                    <Text style={[styles.languageName, { color: colors.text }]}>العربية</Text>
                    <Text style={[styles.languageNative, { color: colors.textSecondary }]}>Arabic</Text>
                  </View>
                </View>
                {userSettings.language === 'ar' && (
                  <View style={[styles.checkmark, { backgroundColor: colors.primary }]}>
                    <Text style={styles.checkmarkIcon}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={[styles.languageModalFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: colors.border }]}
                onPress={() => setShowLanguageModal(false)}
              >
                <Text style={[styles.closeButtonText, { color: colors.text }]}>
                  {t.common.cancel || "Cancel"}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerRTL: {
    flexDirection: 'row-reverse',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  backIcon: {
    fontSize: 24,
    color: '#6366f1',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  headerSpacer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  rtlText: {
    textAlign: 'right',
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 12,
    right: -5,
    backgroundColor: '#0ea5e9',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  cameraIcon: {
    fontSize: 16,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 12,
  },
  sectionHeaderRTL: {
    flexDirection: 'row-reverse',
  },
  sectionEmoji: {
    fontSize: 24,
    marginRight: 12,
    marginLeft: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  editableField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  editableFieldRTL: {
    flexDirection: 'row-reverse',
  },
  fieldLeft: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  fieldValue: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  editIcon: {
    fontSize: 18,
    marginLeft: 12,
  },
  editingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 12,
    gap: 12,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  editingContainerRTL: {
    flexDirection: 'row-reverse',
  },
  editInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    fontWeight: '500',
  },
  editInputRTL: {
    textAlign: 'right',
  },
  saveButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  saveButtonText: {
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  settingToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  settingToggleRTL: {
    flexDirection: 'row-reverse',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingEmoji: {
    fontSize: 24,
    marginRight: 14,
    marginLeft: 0,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  navigationOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  navigationOptionRTL: {
    flexDirection: 'row-reverse',
  },
  navOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navOptionEmoji: {
    fontSize: 22,
    marginRight: 14,
    marginLeft: 0,
  },
  navOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  navOptionArrow: {
    fontSize: 20,
    marginLeft: 8,
    fontWeight: '600',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  dangerButtonRTL: {
    flexDirection: 'row-reverse',
  },
  dangerButtonIcon: {
    fontSize: 22,
    marginRight: 14,
    marginLeft: 0,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  bottomSpacing: {
    height: 60,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '85%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#1e293b',
  },
  previewImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  // Language Modal Styles
  languageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  languageModalContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    width: '100%',
    maxHeight: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  languageModalHeader: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  languageModalTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  languageModalSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  languageOptions: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    maxHeight: 300,
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  languageOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  languageFlag: {
    fontSize: 32,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  languageNative: {
    fontSize: 13,
    fontWeight: '500',
  },
  checkmark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  checkmarkIcon: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  languageModalFooter: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  closeButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    minWidth: 200,
  },
  closeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  // Premium Profile Card Styles
  premiumCardContainer: {
    marginHorizontal: 20,
    marginVertical: 24,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  premiumGradient: {
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  avatarContainerPremium: {
    marginBottom: 16,
  },
  avatarPremium: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarImagePremium: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  cameraOverlayPremium: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cameraIconPremium: {
    fontSize: 18,
  },
  avatarTextPremium: {
    fontSize: 36,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -1,
  },
  userNamePremium: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  premiumBadge: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 0.5,
  },
});

export default ProfileScreen;

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useApp } from '../contexts/AppContext';
import { useTranslation } from '../utils/useTranslation';

interface MenuItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  isRTL: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, title, subtitle, onPress, isRTL }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
    <LinearGradient
      colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.menuItemGradient}
    >
      <View style={[styles.menuItemContent, isRTL && styles.rtlMenuItemContent]}>
        <View style={[styles.menuIcon, isRTL && styles.rtlMenuIcon]}>
          <Text style={styles.menuIconText}>{icon}</Text>
        </View>
        <View style={[styles.menuTextContainer, isRTL && styles.rtlMenuTextContainer]}>
          <Text 
            style={[
              styles.menuTitle, 
              isRTL && styles.rtlText,
              { textAlign: isRTL ? 'right' : 'left' }
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle && (
            <Text 
              style={[
                styles.menuSubtitle, 
                isRTL && styles.rtlText,
                { textAlign: isRTL ? 'right' : 'left' }
              ]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>
        <View style={styles.menuArrow}>
          <Text style={styles.menuArrowText}>
            {isRTL ? '‹' : '›'}
          </Text>
        </View>
      </View>
    </LinearGradient>
  </TouchableOpacity>
);

const MenuScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { userSettings, updateUserSettings, isRTL } = useApp();
  const { t } = useTranslation();

  const handleMenuPress = async (action: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    switch (action) {
      case 'overview':
        // Navigate to overview
        break;
      case 'habits':
        navigation.navigate('Main', { screen: 'Habits' });
        break;
      case 'calendar':
        navigation.navigate('Main', { screen: 'Calendar' });
        break;
      case 'bills':
        navigation.navigate('Main', { screen: 'MyBills' });
        break;
      case 'hydration':
        navigation.navigate('Main', { screen: 'Hydration' });
        break;
      case 'reports':
        // Navigate to reports
        break;
      case 'themes':
        // Toggle theme
        const newTheme = userSettings.theme === 'light' ? 'dark' : 'light';
        await updateUserSettings({ theme: newTheme });
        break;
      case 'backup':
        // Handle backup
        break;
      case 'help':
        // Navigate to help
        break;
    }
  };

  const menuItems = [
    {
      icon: '📊',
      title: t.todayOverview,
      subtitle: isRTL ? '' : 'See your daily progress',
      action: 'overview',
    },
    {
      icon: '🎯',
      title: t.habitsRoutines,
      subtitle: isRTL ? '' : 'Manage your daily habits',
      action: 'habits',
    },
    {
      icon: '📅',
      title: t.calendar,
      subtitle: '',
      action: 'calendar',
    },
    {
      icon: '💳',
      title: t.billsPayments,
      subtitle: isRTL ? '' : 'Track upcoming payments',
      action: 'bills',
    },
    {
      icon: '💧',
      title: t.hydration,
      subtitle: '',
      action: 'hydration',
    },
    {
      icon: '📈',
      title: t.weeklyReports,
      subtitle: isRTL ? '' : 'View your progress over time',
      action: 'reports',
    },
    {
      icon: '🎨',
      title: t.themesAppearance,
      subtitle: `${t.current}: ${userSettings.theme} ${isRTL ? 'الوضع' : 'mode'}`,
      action: 'themes',
    },
    {
      icon: '☁️',
      title: t.backupExport,
      subtitle: isRTL ? '' : 'Save your data securely',
      action: 'backup',
    },
    {
      icon: '💡',
      title: t.helpTips,
      subtitle: isRTL ? '' : 'Learn more about NudgePal',
      action: 'help',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#6366f1', '#8b5cf6', '#06b6d4']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={[styles.header, isRTL && styles.rtlHeader]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={[styles.title, isRTL && styles.rtlText]}>
            {t.menuTitle || 'Menu'}
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* User Info */}
        <View style={[styles.userInfo, isRTL && styles.rtlUserInfo]}>
          <View style={[styles.avatar, isRTL && styles.rtlAvatar]}>
            <Text style={styles.avatarText}>
              {userSettings.name ? userSettings.name.charAt(0).toUpperCase() : '👤'}
            </Text>
          </View>
          <View style={[styles.userDetails, isRTL && styles.rtlUserDetails]}>
            <Text style={[styles.userName, isRTL && styles.rtlText]}>
              {userSettings.name || 'NudgePal User'}
            </Text>
            <Text style={[styles.userLanguage, isRTL && styles.rtlText]}>
              {userSettings.language === 'en' ? 'English' : 
               userSettings.language === 'fr' ? 'Français' : 'العربية'}
            </Text>
          </View>
        </View>

        {/* Menu Items */}
        <ScrollView 
          style={styles.menuContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.menuContent}
        >
          {menuItems.map((item, index) => (
            <MenuItem
              key={index}
              icon={item.icon}
              title={item.title}
              subtitle={item.subtitle}
              onPress={() => handleMenuPress(item.action)}
              isRTL={isRTL}
            />
          ))}
          
          {/* App Info */}
          <View style={styles.appInfo}>
            <Text style={[styles.appInfoText, isRTL && styles.rtlText]}>
              NudgePal v1.0.0
            </Text>
            <Text style={[styles.appInfoSubtext, isRTL && styles.rtlText]}>
              Made with 💜 for better habits
            </Text>
          </View>
        </ScrollView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  rtlHeader: {
    flexDirection: 'row-reverse',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  rtlText: {
    textAlign: 'right',
  },
  placeholder: {
    width: 40,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  rtlUserInfo: {
    flexDirection: 'row-reverse',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  rtlAvatar: {
    marginRight: 0,
    marginLeft: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  userDetails: {
    flex: 1,
  },
  rtlUserDetails: {
    alignItems: 'flex-end',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  userLanguage: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  menuContainer: {
    flex: 1,
  },
  menuContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  menuItem: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItemGradient: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  rtlMenuItemContent: {
    flexDirection: 'row-reverse',
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  rtlMenuIcon: {
    marginRight: 0,
    marginLeft: 16,
  },
  menuIconText: {
    fontSize: 20,
  },
  menuTextContainer: {
    flex: 1,
  },
  rtlMenuTextContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  menuArrow: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuArrowText: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: 'bold',
  },
  appInfo: {
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 20,
  },
  appInfoText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  appInfoSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
});

export default MenuScreen;
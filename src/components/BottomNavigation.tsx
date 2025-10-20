import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';

export type NavTab = 'home' | 'calendar' | 'habits' | 'bills' | 'hydration';

interface BottomNavigationProps {
  activeTab: NavTab;
  onTabPress: (tab: NavTab) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabPress,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { t, isRTL } = useTranslation();

  const tabs: Array<{ id: NavTab; label: string; emoji: string }> = [
    { id: 'home', label: t.navigation.home, emoji: '🏠' },
    { id: 'calendar', label: t.navigation.calendar, emoji: '📅' },
    { id: 'habits', label: t.navigation.habits, emoji: '🎯' },
    { id: 'bills', label: t.navigation.bills, emoji: '💳' },
    { id: 'hydration', label: t.navigation.hydration, emoji: '💧' },
  ];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: insets.bottom,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
          elevation: 5,
        },
      ]}
    >
      {tabs.map((tab) => (
        <Pressable
          key={tab.id}
          style={({ pressed }) => [
            styles.tab,
            activeTab === tab.id && {
              backgroundColor: isDark ? 'rgba(129, 140, 248, 0.15)' : 'rgba(99, 102, 241, 0.1)',
            },
            pressed && { opacity: 0.7 },
          ]}
          onPress={() => onTabPress(tab.id)}
        >
          <Text style={[styles.emoji, activeTab === tab.id && { transform: [{ scale: 1.15 }] }]}>
            {tab.emoji}
          </Text>
          <Text
            style={[
              styles.label,
              {
                color: activeTab === tab.id ? colors.primary : colors.textSecondary,
                fontWeight: activeTab === tab.id ? '700' : '500',
              },
            ]}
          >
            {tab.label}
          </Text>
          {activeTab === tab.id && (
            <View
              style={[
                styles.indicator,
                { 
                  backgroundColor: colors.primary,
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.4,
                  shadowRadius: 2,
                  elevation: 3,
                },
              ]}
            />
          )}
        </Pressable>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1.5,
    paddingTop: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    position: 'relative',
  },
  emoji: {
    fontSize: 26,
    marginBottom: 5,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    width: '70%',
    height: 3.5,
    borderRadius: 2,
  },
});

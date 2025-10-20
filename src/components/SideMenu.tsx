import React, { useEffect, useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useApp } from '../contexts/AppContext';
import { useTranslation } from '../utils/useTranslation';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onMenuItemPress: (item: string) => void;
}

export const SideMenu: React.FC<SideMenuProps> = ({
  isOpen,
  onClose,
  onMenuItemPress,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { isRTL } = useApp();
  const { t } = useTranslation();
  const [slideAnim] = useState(new Animated.Value(isOpen ? 0 : -300));

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOpen ? 0 : -300,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isOpen, slideAnim]);

  const menuItems = [
    { id: 'overview', label: t.todayOverview, emoji: '📊' },
    { id: 'habits', label: t.habitsRoutines, emoji: '🎯' },
    { id: 'calendar', label: t.calendar, emoji: '📅' },
    { id: 'bills', label: t.billsPayments, emoji: '💳' },
    { id: 'hydration', label: t.hydration, emoji: '💧' },
  ];

  const handleMenuItemPress = (itemId: string) => {
    onMenuItemPress(itemId);
    onClose();
  };

  return (
    <>
      {isOpen && (
        <TouchableOpacity
          style={styles.overlay}
          onPress={onClose}
          activeOpacity={0}
        />
      )}
      <Animated.View
        style={[
          styles.container,
          isRTL && styles.containerRTL,
          {
            backgroundColor: colors.surface,
            transform: [{ translateX: slideAnim }],
            paddingTop: insets.top,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.closeButton, { marginRight: isRTL ? 0 : insets.right, marginLeft: isRTL ? insets.right : 0 }]}
          onPress={onClose}
        >
          <Text style={[styles.closeIcon, { color: colors.text }]}>✕</Text>
        </TouchableOpacity>

        <ScrollView
          style={styles.menuContent}
          showsVerticalScrollIndicator={false}
        >
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                isRTL && styles.menuItemRTL,
                {
                  borderBottomColor: colors.border,
                },
              ]}
              onPress={() => handleMenuItemPress(item.id)}
            >
              <Text style={styles.menuItemEmoji}>{item.emoji}</Text>
              <Text style={[styles.menuItemLabel, isRTL && styles.rtlText, { color: colors.text }]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View
          style={[
            styles.footer,
            {
              borderTopColor: colors.border,
              paddingBottom: insets.bottom,
            },
          ]}
        >
          <Text style={[styles.versionText, isRTL && styles.rtlText, { color: colors.textSecondary }]}>
            App v1.0.0
          </Text>
        </View>
      </Animated.View>
    </>
  );
};

const windowWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  container: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 300,
    zIndex: 1000,
    borderRightWidth: 1,
    flexDirection: 'column',
  },
  containerRTL: {
    left: undefined,
    right: 0,
    borderRightWidth: 0,
    borderLeftWidth: 1,
  },
  closeButton: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'flex-end',
  },
  closeIcon: {
    fontSize: 28,
    fontWeight: '300',
  },
  menuContent: {
    flex: 1,
    paddingHorizontal: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  menuItemRTL: {
    flexDirection: 'row-reverse',
  },
  menuItemEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  menuItemLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  rtlText: {
    textAlign: 'right',
  },
  footer: {
    borderTopWidth: 1,
    paddingTop: 16,
    paddingBottom: 16,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 12,
    fontWeight: '400',
  },
});

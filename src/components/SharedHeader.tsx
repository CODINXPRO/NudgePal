import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useApp } from '../contexts/AppContext';

interface SharedHeaderProps {
  title: string;
  onProfilePress: () => void;
}

export const SharedHeader: React.FC<SharedHeaderProps> = ({ title, onProfilePress }) => {
  const { colors } = useTheme();
  const { isRTL } = useApp();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.header,
        isRTL && styles.headerRTL,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
          paddingTop: insets.top,
        },
      ]}
    >
      <TouchableOpacity onPress={onProfilePress}>
        <Text style={styles.headerIcon}>👤</Text>
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.headerIcon} />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerRTL: {
    flexDirection: 'row-reverse',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  headerIcon: {
    fontSize: 24,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

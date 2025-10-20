import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from '../../hooks/useTranslation';
import { BillService, Bill } from '../../services/billService';
import * as Haptics from 'expo-haptics';

interface BillCardProps {
  bill: Bill;
  onDelete?: (billId: string) => void;
  onMarkAsPaid?: (billId: string) => void;
  isPaidTab?: boolean;
}

export const BillCard: React.FC<BillCardProps> = ({ bill, onDelete, onMarkAsPaid, isPaidTab = false }) => {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const daysUntil = BillService.getDaysUntilDue(bill);

  const getStatusColor = () => {
    if (daysUntil < 0) return '#EF4444';
    if (daysUntil <= bill.reminderDays) return '#F97316';
    return '#10B981';
  };

  const getStatusText = () => {
    if (daysUntil < 0) return `${Math.abs(daysUntil)} ${t.billCard.daysText} ${t.billCard.daysOverdue}`;
    if (daysUntil === 0) return t.billCard.dueToday;
    return `${t.billCard.dueIn} ${daysUntil} ${t.billCard.daysText}`;
  };

  const handleMarkAsPaid = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onMarkAsPaid?.(bill.id);
    } catch (error) {
      console.error('Error marking as paid:', error);
    }
  };

  const handleDelete = () => {
    Alert.alert(t.billCard.deleteBill, `${t.billCard.areYouSure} ${bill.name}?`, [
      { text: t.billCard.cancel, onPress: () => {} },
      {
        text: t.billCard.delete,
        onPress: async () => {
          try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onDelete?.(bill.id);
          } catch (error) {
            console.error('Error deleting bill:', error);
          }
        },
        style: 'destructive',
      },
    ]);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? 'rgba(45, 45, 45, 0.5)' : 'rgba(255, 255, 255, 1)',
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.left}>
          <Text style={styles.icon}>💰</Text>
          <View style={styles.info}>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
              {bill.name}
            </Text>
            <Text style={[styles.frequency, { color: colors.textSecondary }]}>
              {bill.frequency === 'monthly' ? t.billCard.monthly :
               bill.frequency === 'quarterly' ? t.billCard.quarterly :
               bill.frequency === 'yearly' ? t.billCard.yearly : t.billCard.oneTime}
            </Text>
          </View>
        </View>

        <View style={styles.right}>
          <Text style={[styles.amount, { color: colors.text }]}>
            ${bill.amount.toFixed(2)}
          </Text>
          <View style={[styles.status, { backgroundColor: getStatusColor() + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.actions, { borderTopColor: colors.border }]}>
        {!isPaidTab && (
          <TouchableOpacity
            style={[styles.actionBtn, { flex: 1, marginRight: 8 }]}
            onPress={handleMarkAsPaid}
          >
            <Text style={styles.actionText}>{t.billCard.paid}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            styles.actionBtn,
            styles.deleteBtn,
            { flex: !isPaidTab ? 1 : undefined, width: isPaidTab ? '100%' : 'auto' },
          ]}
          onPress={handleDelete}
        >
          <Text style={styles.deleteText}>{t.billCard.delete}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 32,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  frequency: {
    fontSize: 12,
  },
  right: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  status: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
  },
  actionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#10B98120',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  deleteBtn: {
    backgroundColor: '#EF444420',
  },
  deleteText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
});

export default BillCard;

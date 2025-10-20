import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  frequency: 'one-time' | 'monthly' | 'quarterly' | 'yearly';
  reminderDays: number;
  notes: string;
  isActive: boolean;
  paymentHistory: Array<{
    date: string;
    amount: number;
  }>;
  createdAt: string;
}

export class BillService {
  private static readonly STORAGE_KEY = '@nudgepal_bills';

  /**
   * Load all bills from storage
   */
  static async loadBills(): Promise<Bill[]> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading bills:', error);
      return [];
    }
  }

  /**
   * Add a new bill
   */
  static async addBill(billData: Omit<Bill, 'id' | 'createdAt' | 'paymentHistory'>): Promise<Bill> {
    try {
      const bills = await this.loadBills();
      const newBill: Bill = {
        ...billData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        paymentHistory: [],
      };

      bills.push(newBill);
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(bills));

      // Schedule notification
      await this.scheduleNotification(newBill);

      return newBill;
    } catch (error) {
      console.error('Error adding bill:', error);
      throw error;
    }
  }

  /**
   * Delete a bill
   */
  static async deleteBill(billId: string): Promise<void> {
    try {
      const bills = await this.loadBills();
      const filtered = bills.filter(b => b.id !== billId);
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));

      // Cancel notification
      await this.cancelNotification(billId);
    } catch (error) {
      console.error('Error deleting bill:', error);
      throw error;
    }
  }

  /**
   * Update a bill
   */
  static async updateBill(billId: string, updates: Partial<Bill>): Promise<Bill> {
    try {
      const bills = await this.loadBills();
      const index = bills.findIndex(b => b.id === billId);

      if (index === -1) throw new Error('Bill not found');

      bills[index] = { ...bills[index], ...updates };
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(bills));

      return bills[index];
    } catch (error) {
      console.error('Error updating bill:', error);
      throw error;
    }
  }

  /**
   * Get days until due date
   */
  static getDaysUntilDue(bill: Bill): number {
    const due = new Date(bill.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Get bills by status
   */
  static async getBillsByStatus(status: 'urgent' | 'upcoming' | 'overdue'): Promise<Bill[]> {
    try {
      const bills = await this.loadBills();
      return bills.filter(bill => {
        if (!bill.isActive) return false;

        const daysUntil = this.getDaysUntilDue(bill);

        switch (status) {
          case 'urgent':
            return daysUntil <= bill.reminderDays && daysUntil > 0;
          case 'upcoming':
            return daysUntil > 0;
          case 'overdue':
            return daysUntil <= 0;
          default:
            return false;
        }
      });
    } catch (error) {
      console.error('Error getting bills by status:', error);
      return [];
    }
  }

  /**
   * Get upcoming bills
   */
  static async getUpcomingBills(days: number): Promise<Bill[]> {
    try {
      const bills = await this.loadBills();
      return bills.filter(bill => {
        if (!bill.isActive) return false;
        const daysUntil = this.getDaysUntilDue(bill);
        return daysUntil > 0 && daysUntil <= days;
      });
    } catch (error) {
      console.error('Error getting upcoming bills:', error);
      return [];
    }
  }

  /**
   * Mark bill as paid
   */
  static async markAsPaid(billId: string): Promise<void> {
    try {
      const bills = await this.loadBills();
      const bill = bills.find(b => b.id === billId);

      if (!bill) throw new Error('Bill not found');

      bill.paymentHistory.push({
        date: new Date().toISOString(),
        amount: bill.amount,
      });

      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(bills));
    } catch (error) {
      console.error('Error marking bill as paid:', error);
      throw error;
    }
  }

  /**
   * Get bills for a specific date
   */
  static async getBillsForDate(date: Date): Promise<Bill[]> {
    try {
      const bills = await this.loadBills();
      const dateStr = date.toISOString().split('T')[0];

      return bills.filter(bill => {
        const billDateStr = bill.dueDate.split('T')[0];
        return billDateStr === dateStr && bill.isActive;
      });
    } catch (error) {
      console.error('Error getting bills for date:', error);
      return [];
    }
  }

  /**
   * Schedule notification for a bill
   */
  private static async scheduleNotification(bill: Bill): Promise<void> {
    try {
      const daysUntil = this.getDaysUntilDue(bill);
      const notificationDays = bill.reminderDays;

      if (daysUntil > 0 && daysUntil <= notificationDays) {
        const trigger = new Date(bill.dueDate);
        trigger.setDate(trigger.getDate() - notificationDays);

        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Bill Reminder',
            body: `${bill.name} is due in ${notificationDays} days`,
            data: { billId: bill.id },
          },
          trigger: trigger.getTime() > Date.now() ? trigger : null,
        } as any);
      }
    } catch (error) {
      console.warn('Notification scheduling warning:', error);
    }
  }

  /**
   * Cancel notification for a bill
   */
  private static async cancelNotification(billId: string): Promise<void> {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      const billNotification = notifications.find(
        n => n.content.data?.billId === billId
      );

      if (billNotification) {
        await Notifications.cancelScheduledNotificationAsync(billNotification.identifier);
      }
    } catch (error) {
      console.warn('Error canceling notification:', error);
    }
  }

  /**
   * Reschedule all bills' notifications
   */
  static async rescheduleAllNotifications(): Promise<void> {
    try {
      const bills = await this.loadBills();
      await Notifications.cancelAllScheduledNotificationsAsync();

      for (const bill of bills) {
        await this.scheduleNotification(bill);
      }
    } catch (error) {
      console.warn('Error rescheduling notifications:', error);
    }
  }
}

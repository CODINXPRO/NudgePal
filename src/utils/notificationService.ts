// Notification Service - Disabled for Expo Go compatibility
// Notifications require a development build in Expo SDK 53+
// All notification features are disabled to prevent Metro bundler crashes

export interface NotificationSettings {
  hydrationEnabled: boolean;
  hydrationInterval: number;
  habitsEnabled: boolean;
  billsEnabled: boolean;
  billsReminderDays: number;
  soundEnabled: boolean;
}

const defaultSettings: NotificationSettings = {
  hydrationEnabled: false,
  hydrationInterval: 75,
  habitsEnabled: false,
  billsEnabled: false,
  billsReminderDays: 3,
  soundEnabled: false,
};

class NotificationService {
  private settings: NotificationSettings = defaultSettings;
  private isInitialized = false;

  async initialize() {
    this.isInitialized = true;
    console.log('Notifications disabled for Expo Go - requires development build');
  }

  async getSettings(): Promise<NotificationSettings> {
    return this.settings;
  }

  async updateSettings(newSettings: Partial<NotificationSettings>) {
    this.settings = { ...this.settings, ...newSettings };
  }

  async scheduleHydrationReminder(time: string) {
    console.log('Hydration reminder scheduling disabled for Expo Go');
  }

  async scheduleHabitReminder(habitName: string, time: string) {
    console.log('Habit reminder scheduling disabled for Expo Go');
  }

  async scheduleBillReminder(billName: string, daysBeforeDue: number) {
    console.log('Bill reminder scheduling disabled for Expo Go');
  }

  async cancelAllReminders() {
    console.log('Canceling reminders disabled for Expo Go');
  }

  async getScheduledNotifications() {
    return [];
  }
}

const notificationService = new NotificationService();

export { notificationService };
export default notificationService;
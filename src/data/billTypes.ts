// Bill type definitions and configurations
export const BILL_TYPES = {
  ONE_TIME: 'one_time',
  RECURRING: 'recurring',
} as const;

export const RECURRENCE_OPTIONS = {
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
} as const;

export const BILL_CATEGORIES = [
  'Subscriptions',
  'Electricity',
  'Water',
  'Internet',
  'Rent',
  'Loan',
  'Insurance',
  'Medical',
  'Transportation',
  'Entertainment',
  'Other',
] as const;

export const BILL_STATUS = {
  UPCOMING: 'upcoming',
  DUE_TODAY: 'due_today',
  OVERDUE: 'overdue',
  PAID: 'paid',
} as const;

export interface BillPaymentHistory {
  date: string; // ISO date string
  amount: number;
  notes?: string;
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  category: typeof BILL_CATEGORIES[number];
  due_date: string; // ISO date string (YYYY-MM-DD)
  reminder_date?: string; // ISO date string
  bill_type: typeof BILL_TYPES[keyof typeof BILL_TYPES];
  created_at: string;
  
  // Recurring bill specific fields
  recurrence?: typeof RECURRENCE_OPTIONS[keyof typeof RECURRENCE_OPTIONS];
  next_due_date?: string; // For recurring bills
  payment_history?: BillPaymentHistory[];
  
  // UI state
  is_paid?: boolean;
  paid_date?: string;
}

export type BillType = typeof BILL_TYPES[keyof typeof BILL_TYPES];
export type RecurrenceType = typeof RECURRENCE_OPTIONS[keyof typeof RECURRENCE_OPTIONS];
export type BillStatus = typeof BILL_STATUS[keyof typeof BILL_STATUS];

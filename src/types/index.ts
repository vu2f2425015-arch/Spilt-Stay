export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  avatar_url: string;
  venmo_handle?: string;
  cash_app_handle?: string;
  bio?: string;
  currency?: string;
  is_onboarded?: boolean;
}

export interface GroupMember {
  id: string;
  user_id: string;
  full_name: string;
  phone_number?: string;
  email: string;
  avatar_url: string;
  role: 'owner' | 'admin' | 'member';
  balance: number; // positive = owed money, negative = owes money
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  members: GroupMember[];
  user_balance: number; // Current logged-in user balance in this group
  last_activity: string;
  join_code?: string;
}

export interface ExpenseSplit {
  user_id: string;
  full_name: string;
  phone_number?: string;
  avatar_url: string;
  amount_owed: number;
  paid: boolean;
}

export interface Expense {
  id: string;
  group_id: string;
  paid_by: string;
  paid_by_name: string;
  paid_by_avatar: string;
  title: string;
  amount: number;
  category: 'rent' | 'groceries' | 'utilities' | 'entertainment' | 'travel' | 'other';
  expense_date: string;
  splits: ExpenseSplit[];
}

export interface Settlement {
  id: string;
  group_id: string;
  payer_id: string;
  payer_name: string;
  payee_id: string;
  payee_name: string;
  amount: number;
  payment_method: 'venmo' | 'cash_app' | 'bank_transfer' | 'cash';
  settled_at: string;
}

export interface RecurringExpense {
  id: string;
  group_id: string;
  title: string;
  amount: number;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  next_due: string;
  payer_id: string;
  payer_name: string;
  category: string;
}

export interface SMSNotification {
  id: string;
  recipient_name: string;
  phone_number: string;
  message: string;
  sent_at: string;
  status: 'sent' | 'delivered';
  whatsapp_url?: string;
}

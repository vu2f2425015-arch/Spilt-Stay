import { Group, Expense, Settlement, RecurringExpense, SMSNotification, GroupMember, UserProfile } from '../types';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../utils/currency';

const STORAGE_KEYS = {
  GROUPS: 'splitstay_groups_v2',
  EXPENSES: 'splitstay_expenses_v2',
  SETTLEMENTS: 'splitstay_settlements_v2',
  RECURRING: 'splitstay_recurring_v2',
  NOTIFICATIONS: 'splitstay_sms_notifications_v2',
  PROFILE: 'splitstay_user_profile_v2'
};

const DEFAULT_PROFILE: UserProfile = {
  id: 'user_current',
  full_name: 'Alex Morgan',
  email: 'alex@example.com',
  phone_number: '+1 (555) 019-2831',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  venmo_handle: '@alex-morgan',
  cash_app_handle: '$alexmorgan',
  bio: 'Apartment 4B resident • Primary utility payer',
  currency: 'USD ($)'
};

// Safe Local Storage Helper
const getStored = <T>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    const parsed = JSON.parse(item);
    return Array.isArray(fallback) && !Array.isArray(parsed) ? fallback : parsed;
  } catch (err) {
    console.error(`Error reading ${key} from localStorage:`, err);
    return fallback;
  }
};

const saveStored = <T>(key: string, value: T) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Failed to save ${key} to localStorage:`, err);
  }
};

let groupsState: Group[] = getStored(STORAGE_KEYS.GROUPS, []);
let expensesState: Expense[] = getStored(STORAGE_KEYS.EXPENSES, []);
let settlementsState: Settlement[] = getStored(STORAGE_KEYS.SETTLEMENTS, []);
let recurringState: RecurringExpense[] = getStored(STORAGE_KEYS.RECURRING, []);
let notificationsState: SMSNotification[] = getStored(STORAGE_KEYS.NOTIFICATIONS, []);
let profileState: UserProfile = getStored(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE);

// Utility to sanitize groups data so array fields are never undefined
const sanitizeGroup = (g: Group): Group => {
  return {
    ...g,
    members: Array.isArray(g?.members) ? g.members : [],
    user_balance: typeof g?.user_balance === 'number' ? g.user_balance : 0,
    last_activity: g?.last_activity || 'Just now'
  };
};

export const apiService = {
  isConfigured: true,

  // --- GROUPS ---
  async getGroups(): Promise<Group[]> {
    const profile = getStored<UserProfile>(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE);
    const localGroups = getStored<Group[]>(STORAGE_KEYS.GROUPS, []);
    
    if (supabase && profile.email && !profile.email.includes('alex@example.com')) {
      try {
        const { data: memberRecords, error: memberError } = await supabase
          .from('group_members')
          .select('group_id')
          .ilike('email', profile.email.trim());

        if (!memberError && memberRecords && memberRecords.length > 0) {
          const groupIds = Array.from(new Set(memberRecords.map(m => m.group_id)));
          
          const { data: remoteGroups } = await supabase
            .from('groups')
            .select('*')
            .in('id', groupIds);

          const { data: remoteMembers } = await supabase
            .from('group_members')
            .select('*')
            .in('group_id', groupIds);

          if (remoteGroups && remoteGroups.length > 0) {
            const assembled: Group[] = remoteGroups.map(rg => {
              const members = (remoteMembers || [])
                .filter(m => m.group_id === rg.id)
                .map(m => ({
                  id: m.id,
                  user_id: m.user_id || m.id,
                  full_name: m.full_name,
                  email: m.email,
                  phone_number: m.phone_number,
                  avatar_url: m.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
                  role: (m.role as 'owner' | 'admin' | 'member') || 'member',
                  balance: Number(m.balance || 0)
                }));

              const myMem = members.find(m => m.email.toLowerCase() === profile.email.toLowerCase());
              return {
                id: rg.id,
                name: rg.name,
                description: rg.description || '',
                join_code: rg.join_code || undefined,
                created_at: rg.created_at ? rg.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
                last_activity: rg.last_activity || 'Recent',
                user_balance: myMem ? myMem.balance : 0,
                members
              };
            });

            // Safely merge remote groups with local groups
            const remoteIds = new Set(assembled.map(g => g.id));
            const extraLocal = localGroups.filter(g => !remoteIds.has(g.id));
            groupsState = [...assembled, ...extraLocal];
            saveStored(STORAGE_KEYS.GROUPS, groupsState);
            return groupsState.map(sanitizeGroup);
          }
        }
      } catch (err) {
        console.warn('Supabase fetch groups error:', err);
      }
    }

    groupsState = localGroups.length > 0 ? localGroups : groupsState;
    return groupsState.map(sanitizeGroup);
  },

  async createGroup(
    name: string,
    description: string,
    rawMembers: { name: string; phone?: string; email?: string }[] = []
  ): Promise<Group> {
    const defaultAvatars = [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    ];

    const profile = getStored<UserProfile>(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE);
    const joinCode = 'STAY-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    
    const currentMember: GroupMember = {
      id: `mem-${Date.now()}-0`,
      user_id: profile.id || `user-${Date.now()}`,
      full_name: profile.full_name || 'Alex Morgan',
      email: profile.email ? profile.email.trim().toLowerCase() : 'alex@example.com',
      phone_number: profile.phone_number || '+1 (555) 019-2831',
      avatar_url: profile.avatar_url || defaultAvatars[0],
      role: 'owner',
      balance: 0.00,
    };

    const parsedMembers: GroupMember[] = rawMembers
      .filter(m => m.name && m.name.trim().length > 0)
      .map((m, idx) => ({
        id: `mem-${Date.now()}-${idx + 1}`,
        user_id: `user_${Date.now()}_${idx}`,
        full_name: m.name.trim(),
        phone_number: m.phone ? m.phone.trim() : undefined,
        email: m.email && m.email.trim() ? m.email.trim().toLowerCase() : `${m.name.toLowerCase().replace(/\s+/g, '')}@example.com`,
        avatar_url: defaultAvatars[(idx + 1) % defaultAvatars.length],
        role: 'member',
        balance: 0.00,
      }));

    const newGroup: Group = {
      id: `group-${Date.now()}`,
      name: name.trim(),
      description: description ? description.trim() : '',
      join_code: joinCode,
      created_at: new Date().toISOString().split('T')[0],
      last_activity: 'Just created',
      user_balance: 0.00,
      members: [currentMember, ...parsedMembers]
    };

    groupsState = [newGroup, ...groupsState];
    saveStored(STORAGE_KEYS.GROUPS, groupsState);

    if (supabase) {
      try {
        await supabase.from('groups').insert([{
          id: newGroup.id,
          name: newGroup.name,
          description: newGroup.description,
          join_code: joinCode,
          created_by: currentMember.user_id,
          created_at: new Date().toISOString(),
          last_activity: 'Just created'
        }]);

        const supabaseMembers = [currentMember, ...parsedMembers].map(m => ({
          id: m.id,
          group_id: newGroup.id,
          user_id: m.user_id,
          email: m.email.toLowerCase(),
          full_name: m.full_name,
          phone_number: m.phone_number,
          avatar_url: m.avatar_url,
          role: m.role,
          balance: m.balance
        }));

        await supabase.from('group_members').insert(supabaseMembers);
      } catch (err) {
        console.warn('Supabase group create warning:', err);
      }
    }

    return sanitizeGroup(newGroup);
  },

  async joinGroupWithCode(joinCode: string): Promise<Group | null> {
    const cleanCode = joinCode.trim().toUpperCase();
    const profile = getStored<UserProfile>(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE);

    let targetGroup: Group | null = null;

    if (supabase) {
      try {
        const { data: remoteGroups } = await supabase
          .from('groups')
          .select('*')
          .ilike('join_code', cleanCode);

        if (remoteGroups && remoteGroups.length > 0) {
          const rg = remoteGroups[0];
          
          const { data: remoteMembers } = await supabase
            .from('group_members')
            .select('*')
            .eq('group_id', rg.id);

          const members: GroupMember[] = (remoteMembers || []).map(m => ({
            id: m.id,
            user_id: m.user_id || m.id,
            full_name: m.full_name,
            email: m.email,
            phone_number: m.phone_number,
            avatar_url: m.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
            role: (m.role as 'owner' | 'admin' | 'member') || 'member',
            balance: Number(m.balance || 0)
          }));

          const alreadyMember = members.some(m => 
            (m.email && profile.email && m.email.toLowerCase() === profile.email.toLowerCase()) || 
            (m.user_id && profile.id && m.user_id === profile.id)
          );

          if (!alreadyMember) {
            const newMem: GroupMember = {
              id: `mem-${Date.now()}`,
              user_id: profile.id || `user-${Date.now()}`,
              full_name: profile.full_name || 'Roommate',
              email: profile.email ? profile.email.trim().toLowerCase() : 'user@example.com',
              phone_number: profile.phone_number,
              avatar_url: profile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
              role: 'member',
              balance: 0.00
            };

            await supabase.from('group_members').insert([{
              id: newMem.id,
              group_id: rg.id,
              user_id: newMem.user_id,
              email: newMem.email,
              full_name: newMem.full_name,
              phone_number: newMem.phone_number,
              avatar_url: newMem.avatar_url,
              role: newMem.role,
              balance: 0.00
            }]);

            members.push(newMem);
          }

          targetGroup = {
            id: rg.id,
            name: rg.name,
            description: rg.description || '',
            join_code: rg.join_code || cleanCode,
            created_at: rg.created_at ? rg.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
            last_activity: 'Joined via code',
            user_balance: 0.00,
            members
          };
        }
      } catch (err) {
        console.warn('Supabase join group error:', err);
      }
    }

    if (!targetGroup) {
      const localGroups = getStored<Group[]>(STORAGE_KEYS.GROUPS, []);
      const found = localGroups.find(g => g.join_code && g.join_code.toUpperCase() === cleanCode);
      if (found) {
        targetGroup = found;
        const alreadyMem = targetGroup.members.some(m => m.email.toLowerCase() === profile.email.toLowerCase());
        if (!alreadyMem) {
          targetGroup.members.push({
            id: `mem-${Date.now()}`,
            user_id: profile.id || `user-${Date.now()}`,
            full_name: profile.full_name || 'Roommate',
            email: profile.email || 'user@example.com',
            phone_number: profile.phone_number,
            avatar_url: profile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
            role: 'member',
            balance: 0.00
          });
        }
      }
    }

    if (targetGroup) {
      const localGroups = getStored<Group[]>(STORAGE_KEYS.GROUPS, []);
      const existsIndex = localGroups.findIndex(g => g.id === targetGroup!.id);
      if (existsIndex !== -1) {
        localGroups[existsIndex] = targetGroup;
      } else {
        localGroups.unshift(targetGroup);
      }
      groupsState = localGroups;
      saveStored(STORAGE_KEYS.GROUPS, groupsState);
      return sanitizeGroup(targetGroup);
    }

    return null;
  },

  async addMemberToGroup(groupId: string, name: string, phone: string, email?: string): Promise<Group | null> {
    const groupIndex = groupsState.findIndex(g => g.id === groupId);
    if (groupIndex === -1) return null;

    const group = groupsState[groupIndex];
    const memberEmail = email && email.trim() ? email.trim().toLowerCase() : `${name.toLowerCase().replace(/\s+/g, '')}@example.com`;
    const newMember: GroupMember = {
      id: `mem-${Date.now()}`,
      user_id: `user_${Date.now()}`,
      full_name: name.trim(),
      phone_number: phone ? phone.trim() : undefined,
      email: memberEmail,
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      role: 'member',
      balance: 0.00,
    };

    group.members = [...(group.members || []), newMember];
    group.last_activity = 'Member added';
    groupsState[groupIndex] = group;
    saveStored(STORAGE_KEYS.GROUPS, groupsState);

    if (supabase) {
      try {
        await supabase.from('group_members').insert([{
          id: newMember.id,
          group_id: groupId,
          user_id: newMember.user_id,
          email: memberEmail,
          full_name: newMember.full_name,
          phone_number: newMember.phone_number,
          avatar_url: newMember.avatar_url,
          role: newMember.role,
          balance: 0.00
        }]);
      } catch (err) {
        console.warn('Supabase add member warning:', err);
      }
    }

    return sanitizeGroup(group);
  },

  async deleteGroup(groupId: string): Promise<boolean> {
    groupsState = groupsState.filter(g => g.id !== groupId);
    expensesState = expensesState.filter(e => e.group_id !== groupId);
    settlementsState = settlementsState.filter(s => s.group_id !== groupId);
    recurringState = recurringState.filter(r => r.group_id !== groupId);

    saveStored(STORAGE_KEYS.GROUPS, groupsState);
    saveStored(STORAGE_KEYS.EXPENSES, expensesState);
    saveStored(STORAGE_KEYS.SETTLEMENTS, settlementsState);
    saveStored(STORAGE_KEYS.RECURRING, recurringState);
    return true;
  },

  // --- EXPENSES & SMS NOTIFICATIONS ---
  async getExpenses(groupId: string): Promise<Expense[]> {
    if (expensesState.length === 0) {
      expensesState = getStored(STORAGE_KEYS.EXPENSES, []);
    }
    return expensesState.filter(e => e.group_id === groupId);
  },

  async addExpense(expenseData: {
    group_id: string;
    paid_by: string;
    paid_by_name: string;
    title: string;
    amount: number;
    category: Expense['category'];
    splits: { user_id: string; full_name: string; phone_number?: string; amount_owed: number }[];
    sendSMSNotification?: boolean;
  }): Promise<{ expense: Expense; notificationsSent: SMSNotification[] }> {
    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      group_id: expenseData.group_id,
      paid_by: expenseData.paid_by,
      paid_by_name: expenseData.paid_by_name,
      paid_by_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      title: expenseData.title,
      amount: expenseData.amount,
      category: expenseData.category,
      expense_date: new Date().toISOString().split('T')[0],
      splits: expenseData.splits.map(s => ({
        user_id: s.user_id,
        full_name: s.full_name,
        phone_number: s.phone_number,
        avatar_url: '',
        amount_owed: s.amount_owed,
        paid: s.user_id === expenseData.paid_by
      }))
    };

    expensesState = [newExpense, ...expensesState];
    saveStored(STORAGE_KEYS.EXPENSES, expensesState);

    // Send SMS & WhatsApp Notifications to members with phone numbers
    const notificationsSent: SMSNotification[] = [];
    if (expenseData.sendSMSNotification !== false) {
      const userCurr = this.getUserProfile().currency;
      const formattedTotal = formatCurrency(expenseData.amount, userCurr);

      for (const split of expenseData.splits) {
        if (split.user_id !== expenseData.paid_by && split.phone_number) {
          const formattedSplit = formatCurrency(split.amount_owed, userCurr);
          const msg = `SplitStay Alert: ${expenseData.paid_by_name} added '${expenseData.title}' (${formattedTotal}). Your split is ${formattedSplit}.`;
          
          const notif: SMSNotification = {
            id: `sms-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            recipient_name: split.full_name,
            phone_number: split.phone_number,
            message: msg,
            sent_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'delivered'
          };
          notificationsSent.push(notif);

          // Invoke Supabase send-whatsapp Edge Function if configured
          if (supabase) {
            supabase.functions.invoke('send-whatsapp', {
              body: {
                phone_number: split.phone_number,
                message: msg
              }
            }).then(res => {
              if (res.error) {
                console.error('WhatsApp Edge Function Error:', res.error);
              } else {
                console.log('WhatsApp Message Sent Successfully:', res.data);
              }
            }).catch(err => console.error('Error triggering send-whatsapp Edge Function:', err));
          }
        }
      }
      if (notificationsSent.length > 0) {
        notificationsState = [...notificationsSent, ...notificationsState];
        saveStored(STORAGE_KEYS.NOTIFICATIONS, notificationsState);
      }
    }
    
    // Update group member balances safely
    const groupIndex = groupsState.findIndex(g => g.id === expenseData.group_id);
    if (groupIndex !== -1) {
      const group = groupsState[groupIndex];
      const members = Array.isArray(group.members) ? group.members : [];
      
      group.members = members.map(m => {
        let delta = 0;
        if (m.user_id === expenseData.paid_by) {
          const othersOwed = expenseData.splits
            .filter(s => s.user_id !== expenseData.paid_by)
            .reduce((sum, s) => sum + s.amount_owed, 0);
          delta += othersOwed;
        } else {
          const mySplit = expenseData.splits.find(s => s.user_id === m.user_id);
          if (mySplit) {
            delta -= mySplit.amount_owed;
          }
        }
        return { ...m, balance: m.balance + delta };
      });

      const userMem = group.members.find(m => m.user_id === 'user_current');
      group.user_balance = userMem ? userMem.balance : 0;
      group.last_activity = 'Expense added';

      saveStored(STORAGE_KEYS.GROUPS, groupsState);
    }

    return { expense: newExpense, notificationsSent };
  },

  // --- SETTLEMENTS ---
  async getSettlements(groupId: string): Promise<Settlement[]> {
    if (settlementsState.length === 0) {
      settlementsState = getStored(STORAGE_KEYS.SETTLEMENTS, []);
    }
    return settlementsState.filter(s => s.group_id === groupId);
  },

  async addSettlement(settlementData: {
    group_id: string;
    payer_id: string;
    payer_name: string;
    payee_id: string;
    payee_name: string;
    payee_phone?: string;
    amount: number;
    payment_method: Settlement['payment_method'];
    sendSMS?: boolean;
  }): Promise<{ settlement: Settlement; notification?: SMSNotification }> {
    const newSettlement: Settlement = {
      id: `set-${Date.now()}`,
      group_id: settlementData.group_id,
      payer_id: settlementData.payer_id,
      payer_name: settlementData.payer_name,
      payee_id: settlementData.payee_id,
      payee_name: settlementData.payee_name,
      amount: settlementData.amount,
      payment_method: settlementData.payment_method,
      settled_at: new Date().toISOString()
    };

    settlementsState = [newSettlement, ...settlementsState];
    saveStored(STORAGE_KEYS.SETTLEMENTS, settlementsState);

    let notification: SMSNotification | undefined;
    if (settlementData.sendSMS && settlementData.payee_phone) {
      const userCurr = this.getUserProfile().currency;
      const formattedAmount = formatCurrency(settlementData.amount, userCurr);
      const msg = `SplitStay Payment Alert: ${settlementData.payer_name} paid you ${formattedAmount} via ${settlementData.payment_method.toUpperCase()}.`;
      
      notification = {
        id: `sms-${Date.now()}`,
        recipient_name: settlementData.payee_name,
        phone_number: settlementData.payee_phone,
        message: msg,
        sent_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'delivered'
      };
      notificationsState = [notification, ...notificationsState];
      saveStored(STORAGE_KEYS.NOTIFICATIONS, notificationsState);

      // Invoke Supabase send-whatsapp Edge Function if configured
      if (supabase) {
        supabase.functions.invoke('send-whatsapp', {
          body: {
            phone_number: settlementData.payee_phone,
            message: msg
          }
        }).then(res => {
          if (res.error) {
            console.error('WhatsApp Edge Function Settlement Error:', res.error);
          } else {
            console.log('WhatsApp Settlement Message Sent Successfully:', res.data);
          }
        }).catch(err => console.error('Error triggering send-whatsapp Edge Function:', err));
      }
    }

    // Adjust balances
    const groupIndex = groupsState.findIndex(g => g.id === settlementData.group_id);
    if (groupIndex !== -1) {
      const group = groupsState[groupIndex];
      const members = Array.isArray(group.members) ? group.members : [];
      group.members = members.map(m => {
        if (m.user_id === settlementData.payer_id) {
          return { ...m, balance: m.balance + settlementData.amount };
        }
        if (m.user_id === settlementData.payee_id) {
          return { ...m, balance: m.balance - settlementData.amount };
        }
        return m;
      });

      const userMem = group.members.find(m => m.user_id === 'user_current');
      group.user_balance = userMem ? userMem.balance : 0;
      group.last_activity = 'Payment settled';

      saveStored(STORAGE_KEYS.GROUPS, groupsState);
    }

    return { settlement: newSettlement, notification };
  },

  // --- RECURRING ---
  async getRecurring(groupId: string): Promise<RecurringExpense[]> {
    if (recurringState.length === 0) {
      recurringState = getStored(STORAGE_KEYS.RECURRING, []);
    }
    return recurringState.filter(r => r.group_id === groupId);
  },

  // --- NOTIFICATIONS LOG ---
  getNotifications(): SMSNotification[] {
    return notificationsState;
  },

  // --- PROFILE MANAGEMENT ---
  getUserProfile(): UserProfile {
    if (!profileState || !profileState.full_name) {
      profileState = getStored(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE);
    }
    return profileState;
  },

  updateUserProfile(updated: Partial<UserProfile>): UserProfile {
    if (updated.email && profileState.email && updated.email.toLowerCase() !== profileState.email.toLowerCase()) {
      groupsState = [];
    }

    profileState = { ...profileState, ...updated };
    saveStored(STORAGE_KEYS.PROFILE, profileState);

    // Sync current user's name & avatar across all groups & members
    groupsState = groupsState.map(g => ({
      ...g,
      members: g.members.map(m => {
        if (m.user_id === profileState.id || m.email.toLowerCase() === profileState.email.toLowerCase()) {
          return {
            ...m,
            full_name: profileState.full_name,
            phone_number: profileState.phone_number,
            email: profileState.email,
            avatar_url: profileState.avatar_url
          };
        }
        return m;
      })
    }));
    saveStored(STORAGE_KEYS.GROUPS, groupsState);

    return profileState;
  },

  clearAllLocalData() {
    Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
    groupsState = [];
    expensesState = [];
    settlementsState = [];
    recurringState = [];
    notificationsState = [];
    profileState = DEFAULT_PROFILE;
  }
};

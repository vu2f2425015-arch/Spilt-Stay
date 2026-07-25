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

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

// Local-mode-only placeholder profile. When Clerk is configured, App.tsx
// overwrites this with the real signed-in user's id/email/name on load,
// and every "who am I" comparison below reads that id dynamically rather
// than hardcoding a literal string - so the same code path is correct in
// both local demo mode and real multi-user mode.
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

// Generate a collision-resistant id. crypto.randomUUID() is available in
// all modern browsers (and Vite's dev/build targets); Date.now()-based
// ids could collide across two members acting in the same millisecond.
const uid = (prefix: string): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
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

// Normalize a join code down to its bare alphanumeric core so
// "STAY-AB12", "stay-ab12", and "AB12" all compare equal - but nothing
// else does. (The previous implementation used fuzzy substring matching,
// which could match the wrong group on short codes.)
const normalizeCode = (raw: string): string =>
  raw.trim().toUpperCase().replace(/^STAY-?/, '').replace(/[^A-Z0-9]/g, '');

const codeForGroup = (g: { id: string; join_code?: string }): string => {
  if (g.join_code) return normalizeCode(g.join_code);
  // Deterministic fallback for legacy rows created before join_code existed
  return (g.id || 'ROOM').replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase();
};

const mapRemoteMember = (m: any): GroupMember => ({
  id: m.id,
  user_id: m.user_id || m.id,
  full_name: m.full_name,
  email: m.email,
  phone_number: m.phone_number,
  avatar_url: m.avatar_url || DEFAULT_AVATAR,
  role: (m.role as 'owner' | 'admin' | 'member') || 'member',
  balance: Number(m.balance || 0)
});

export const apiService = {
  isConfigured: true,

  // The single source of truth for "who is the signed-in user right now".
  // Every balance/ownership comparison below should go through this
  // instead of a hardcoded id, so the same logic works for the local
  // demo profile and for real Clerk-authenticated users alike.
  getCurrentUserId(): string {
    return profileState.id;
  },

  // --- GROUPS ---
  async getGroups(): Promise<Group[]> {
    const profile = getStored<UserProfile>(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE);
    const localGroups = getStored<Group[]>(STORAGE_KEYS.GROUPS, []);

    if (supabase && profile.email && !profile.email.includes('alex@example.com')) {
      try {
        // RLS scopes group_members to rows the caller is allowed to see,
        // but we still filter defensively by user_id/email to be explicit
        // about which memberships belong to this user.
        const { data: memberRecords, error: memberError } = await supabase
          .from('group_members')
          .select('group_id')
          .or(`user_id.eq.${profile.id},email.ilike.${profile.email.trim()}`);

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
                .map(mapRemoteMember);

              const myMem = members.find(m => m.user_id === profile.id) ||
                members.find(m => m.email && m.email.toLowerCase() === profile.email.toLowerCase());

              return {
                id: rg.id,
                name: rg.name,
                description: rg.description || '',
                join_code: rg.join_code || codeForGroup(rg),
                created_at: rg.created_at ? rg.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
                last_activity: rg.last_activity || 'Recent',
                user_balance: myMem ? myMem.balance : 0,
                members
              };
            });

            // Supabase is authoritative once configured & the user is signed
            // in with a real account. Local storage is kept only as an
            // offline mirror for that same account - we no longer silently
            // keep around unrelated locally-cached groups from a previous
            // (possibly different) local session.
            groupsState = assembled;
            saveStored(STORAGE_KEYS.GROUPS, groupsState);
            return groupsState.map(sanitizeGroup);
          }

          // Signed in, but no remote groups found for this account.
          groupsState = [];
          saveStored(STORAGE_KEYS.GROUPS, groupsState);
          return [];
        }
      } catch (err) {
        console.warn('Supabase fetch groups error:', err);
      }
    }

    groupsState = (localGroups.length > 0 ? localGroups : groupsState).map(g => ({
      ...g,
      join_code: g.join_code || codeForGroup(g)
    }));
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
      id: uid('mem'),
      user_id: profile.id || uid('user'),
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
        id: uid('mem'),
        user_id: uid('user'),
        full_name: m.name.trim(),
        phone_number: m.phone ? m.phone.trim() : undefined,
        email: m.email && m.email.trim() ? m.email.trim().toLowerCase() : `${m.name.toLowerCase().replace(/\s+/g, '')}@example.com`,
        avatar_url: defaultAvatars[(idx + 1) % defaultAvatars.length],
        role: 'member',
        balance: 0.00,
      }));

    const newGroup: Group = {
      id: uid('group'),
      name: name.trim(),
      description: description ? description.trim() : '',
      join_code: joinCode,
      created_at: new Date().toISOString().split('T')[0],
      last_activity: 'Just created',
      user_balance: 0.00,
      members: [currentMember, ...parsedMembers]
    };

    if (supabase) {
      try {
        const { error: groupErr } = await supabase.from('groups').insert([{
          id: newGroup.id,
          name: newGroup.name,
          description: newGroup.description,
          join_code: joinCode,
          created_by: currentMember.user_id,
          created_at: new Date().toISOString(),
          last_activity: 'Just created'
        }]);
        if (groupErr) throw groupErr;

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

        const { error: memErr } = await supabase.from('group_members').insert(supabaseMembers);
        if (memErr) throw memErr;
      } catch (err) {
        console.warn('Supabase group create warning (group saved locally only):', err);
      }
    }

    groupsState = [newGroup, ...groupsState];
    saveStored(STORAGE_KEYS.GROUPS, groupsState);

    return sanitizeGroup(newGroup);
  },

  async joinGroupWithCode(joinCode: string): Promise<Group | null> {
    const target = normalizeCode(joinCode);
    if (!target) return null;

    const profile = getStored<UserProfile>(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE);
    let targetGroup: Group | null = null;

    if (supabase) {
      try {
        // The "groups_select_member" RLS policy only lets a signed-in user
        // SELECT groups they already belong to, so a plain
        // `supabase.from('groups').select('*')` here would always come
        // back empty for a group you're trying to join for the first
        // time. find_group_by_code() is a SECURITY DEFINER function that
        // resolves the code without requiring membership first.
        const { data: matchedRows, error: rpcErr } = await supabase.rpc('find_group_by_code', {
          code_input: target
        });
        if (rpcErr) throw rpcErr;
        const rg = matchedRows && matchedRows[0];

        if (rg) {
          const newMem: GroupMember = {
            id: uid('mem'),
            user_id: profile.id || uid('user'),
            full_name: profile.full_name || 'Roommate',
            email: profile.email ? profile.email.trim().toLowerCase() : 'user@example.com',
            phone_number: profile.phone_number,
            avatar_url: profile.avatar_url || DEFAULT_AVATAR,
            role: 'member',
            balance: 0.00
          };

          // Insert self as a member first. This is allowed even before
          // we're a member, since the insert policy permits a user
          // adding themself. We do this BEFORE reading the roster below,
          // because that read is membership-gated and would otherwise
          // come back empty too.
          const { error: insertErr } = await supabase.from('group_members').insert([{
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
          // A unique-violation here just means this account already
          // joined this group previously - not a real failure.
          if (insertErr && insertErr.code !== '23505') throw insertErr;

          // Now that we're a member, RLS lets us read the full roster.
          const { data: remoteMembers } = await supabase
            .from('group_members')
            .select('*')
            .eq('group_id', rg.id);

          const members: GroupMember[] = (remoteMembers || []).map(mapRemoteMember);

          if (!rg.join_code) {
            await supabase.from('groups').update({ join_code: `STAY-${target}` }).eq('id', rg.id);
          }

          targetGroup = {
            id: rg.id,
            name: rg.name,
            description: rg.description || '',
            join_code: rg.join_code || `STAY-${target}`,
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
      const localGroups = getStored<Group[]>(STORAGE_KEYS.GROUPS, groupsState);
      const candidates = [...localGroups, ...groupsState];
      const found = candidates.find(g => codeForGroup(g) === target);

      if (found) {
        targetGroup = { ...found, members: [...found.members] };
        targetGroup.join_code = `STAY-${target}`;

        const alreadyMem = targetGroup.members.some(m =>
          m.user_id === profile.id ||
          (m.email && profile.email && m.email.toLowerCase() === profile.email.toLowerCase())
        );
        if (!alreadyMem) {
          targetGroup.members.push({
            id: uid('mem'),
            user_id: profile.id || uid('user'),
            full_name: profile.full_name || 'Roommate',
            email: profile.email ? profile.email.trim().toLowerCase() : 'user@example.com',
            phone_number: profile.phone_number,
            avatar_url: profile.avatar_url || DEFAULT_AVATAR,
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
      id: uid('mem'),
      user_id: uid('user'),
      full_name: name.trim(),
      phone_number: phone ? phone.trim() : undefined,
      email: memberEmail,
      avatar_url: DEFAULT_AVATAR,
      role: 'member',
      balance: 0.00,
    };

    if (supabase) {
      try {
        const { error } = await supabase.from('group_members').insert([{
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
        if (error) throw error;
      } catch (err) {
        console.warn('Supabase add member warning (saved locally only):', err);
      }
    }

    group.members = [...(group.members || []), newMember];
    group.last_activity = 'Member added';
    groupsState[groupIndex] = group;
    saveStored(STORAGE_KEYS.GROUPS, groupsState);

    return sanitizeGroup(group);
  },

  async deleteGroup(groupId: string): Promise<boolean> {
    if (supabase) {
      try {
        // ON DELETE CASCADE on every child table's group_id FK handles
        // expenses/splits/settlements/recurring/members cleanup remotely.
        await supabase.from('groups').delete().eq('id', groupId);
      } catch (err) {
        console.warn('Supabase delete group warning:', err);
      }
    }

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
    if (supabase) {
      try {
        const { data: remoteExpenses, error } = await supabase
          .from('expenses')
          .select('*')
          .eq('group_id', groupId)
          .order('created_at', { ascending: false });

        if (!error && remoteExpenses) {
          const { data: remoteSplits } = await supabase
            .from('expense_splits')
            .select('*')
            .eq('group_id', groupId);

          const assembled: Expense[] = remoteExpenses.map(re => ({
            id: re.id,
            group_id: re.group_id,
            paid_by: re.payer_id,
            paid_by_name: re.payer_name || '',
            paid_by_avatar: DEFAULT_AVATAR,
            title: re.title,
            amount: Number(re.amount),
            category: re.category,
            expense_date: re.date,
            splits: (remoteSplits || [])
              .filter(s => s.expense_id === re.id)
              .map(s => ({
                user_id: s.member_id,
                full_name: s.member_name,
                phone_number: s.phone_number,
                avatar_url: '',
                amount_owed: Number(s.amount),
                paid: Boolean(s.paid)
              }))
          }));

          expensesState = [
            ...assembled,
            ...expensesState.filter(e => e.group_id !== groupId)
          ];
          saveStored(STORAGE_KEYS.EXPENSES, expensesState);
          return assembled;
        }
      } catch (err) {
        console.warn('Supabase fetch expenses error (falling back to local cache):', err);
      }
    }

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
    const expenseDate = new Date().toISOString().split('T')[0];
    const newExpense: Expense = {
      id: uid('exp'),
      group_id: expenseData.group_id,
      paid_by: expenseData.paid_by,
      paid_by_name: expenseData.paid_by_name,
      paid_by_avatar: DEFAULT_AVATAR,
      title: expenseData.title,
      amount: expenseData.amount,
      category: expenseData.category,
      expense_date: expenseDate,
      splits: expenseData.splits.map(s => ({
        user_id: s.user_id,
        full_name: s.full_name,
        phone_number: s.phone_number,
        avatar_url: '',
        amount_owed: s.amount_owed,
        paid: s.user_id === expenseData.paid_by
      }))
    };

    if (supabase) {
      try {
        const { error: expErr } = await supabase.from('expenses').insert([{
          id: newExpense.id,
          group_id: newExpense.group_id,
          title: newExpense.title,
          amount: newExpense.amount,
          category: newExpense.category,
          date: newExpense.expense_date,
          payer_id: newExpense.paid_by,
          payer_name: newExpense.paid_by_name
        }]);
        if (expErr) throw expErr;

        const splitRows = newExpense.splits.map(s => ({
          id: uid('split'),
          expense_id: newExpense.id,
          group_id: newExpense.group_id,
          member_id: s.user_id,
          member_name: s.full_name,
          phone_number: s.phone_number,
          amount: s.amount_owed,
          paid: s.paid
        }));
        const { error: splitErr } = await supabase.from('expense_splits').insert(splitRows);
        if (splitErr) throw splitErr;
      } catch (err) {
        console.warn('Supabase add expense warning (saved locally only):', err);
      }
    }

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
            id: uid('sms'),
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

    // Update group member balances (locally, and mirrored to Supabase so
    // every member's view of the group stays in sync, not just this
    // browser's local cache).
    const groupIndex = groupsState.findIndex(g => g.id === expenseData.group_id);
    if (groupIndex !== -1) {
      const group = groupsState[groupIndex];
      const members = Array.isArray(group.members) ? group.members : [];

      const updatedMembers = members.map(m => {
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

      group.members = updatedMembers;
      const userMem = group.members.find(m => m.user_id === this.getCurrentUserId());
      group.user_balance = userMem ? userMem.balance : 0;
      group.last_activity = 'Expense added';

      saveStored(STORAGE_KEYS.GROUPS, groupsState);

      if (supabase) {
        const client = supabase;
        try {
          await Promise.all(
            updatedMembers
              .filter(m => {
                const orig = members.find(om => om.id === m.id);
                return orig && orig.balance !== m.balance;
              })
              .map(m => client.from('group_members').update({ balance: m.balance }).eq('id', m.id))
          );
        } catch (err) {
          console.warn('Supabase balance sync warning after expense:', err);
        }
      }
    }

    return { expense: newExpense, notificationsSent };
  },

  // --- SETTLEMENTS ---
  async getSettlements(groupId: string): Promise<Settlement[]> {
    if (supabase) {
      try {
        const { data: remoteSettlements, error } = await supabase
          .from('settlements')
          .select('*')
          .eq('group_id', groupId)
          .order('created_at', { ascending: false });

        if (!error && remoteSettlements) {
          const assembled: Settlement[] = remoteSettlements.map(rs => ({
            id: rs.id,
            group_id: rs.group_id,
            payer_id: rs.payer_id,
            payer_name: rs.payer_name || '',
            payee_id: rs.payee_id,
            payee_name: rs.payee_name || '',
            amount: Number(rs.amount),
            payment_method: rs.payment_method,
            settled_at: rs.created_at || rs.date
          }));

          settlementsState = [
            ...assembled,
            ...settlementsState.filter(s => s.group_id !== groupId)
          ];
          saveStored(STORAGE_KEYS.SETTLEMENTS, settlementsState);
          return assembled;
        }
      } catch (err) {
        console.warn('Supabase fetch settlements error (falling back to local cache):', err);
      }
    }

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
      id: uid('set'),
      group_id: settlementData.group_id,
      payer_id: settlementData.payer_id,
      payer_name: settlementData.payer_name,
      payee_id: settlementData.payee_id,
      payee_name: settlementData.payee_name,
      amount: settlementData.amount,
      payment_method: settlementData.payment_method,
      settled_at: new Date().toISOString()
    };

    if (supabase) {
      try {
        const { error } = await supabase.from('settlements').insert([{
          id: newSettlement.id,
          group_id: newSettlement.group_id,
          payer_id: newSettlement.payer_id,
          payer_name: newSettlement.payer_name,
          payee_id: newSettlement.payee_id,
          payee_name: newSettlement.payee_name,
          amount: newSettlement.amount,
          payment_method: newSettlement.payment_method,
          date: newSettlement.settled_at
        }]);
        if (error) throw error;
      } catch (err) {
        console.warn('Supabase add settlement warning (saved locally only):', err);
      }
    }

    settlementsState = [newSettlement, ...settlementsState];
    saveStored(STORAGE_KEYS.SETTLEMENTS, settlementsState);

    let notification: SMSNotification | undefined;
    if (settlementData.sendSMS && settlementData.payee_phone) {
      const userCurr = this.getUserProfile().currency;
      const formattedAmount = formatCurrency(settlementData.amount, userCurr);
      const msg = `SplitStay Payment Alert: ${settlementData.payer_name} paid you ${formattedAmount} via ${settlementData.payment_method.toUpperCase()}.`;

      notification = {
        id: uid('sms'),
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

    // Adjust balances (local + mirrored to Supabase)
    const groupIndex = groupsState.findIndex(g => g.id === settlementData.group_id);
    if (groupIndex !== -1) {
      const group = groupsState[groupIndex];
      const members = Array.isArray(group.members) ? group.members : [];
      const updatedMembers = members.map(m => {
        if (m.user_id === settlementData.payer_id) {
          return { ...m, balance: m.balance + settlementData.amount };
        }
        if (m.user_id === settlementData.payee_id) {
          return { ...m, balance: m.balance - settlementData.amount };
        }
        return m;
      });

      group.members = updatedMembers;
      const userMem = group.members.find(m => m.user_id === this.getCurrentUserId());
      group.user_balance = userMem ? userMem.balance : 0;
      group.last_activity = 'Payment settled';

      saveStored(STORAGE_KEYS.GROUPS, groupsState);

      if (supabase) {
        const client = supabase;
        try {
          const changed = updatedMembers.filter(m =>
            m.user_id === settlementData.payer_id || m.user_id === settlementData.payee_id
          );
          await Promise.all(
            changed.map(m => client.from('group_members').update({ balance: m.balance }).eq('id', m.id))
          );
        } catch (err) {
          console.warn('Supabase balance sync warning after settlement:', err);
        }
      }
    }

    return { settlement: newSettlement, notification };
  },

  // --- RECURRING ---
  async getRecurring(groupId: string): Promise<RecurringExpense[]> {
    if (supabase) {
      try {
        const { data: remoteRecurring, error } = await supabase
          .from('recurring_expenses')
          .select('*')
          .eq('group_id', groupId);

        if (!error && remoteRecurring) {
          const assembled: RecurringExpense[] = remoteRecurring.map(rr => ({
            id: rr.id,
            group_id: rr.group_id,
            title: rr.title,
            amount: Number(rr.amount),
            frequency: rr.frequency,
            next_due: rr.next_due,
            payer_id: rr.payer_id,
            payer_name: rr.payer_name || '',
            category: rr.category
          }));

          recurringState = [
            ...assembled,
            ...recurringState.filter(r => r.group_id !== groupId)
          ];
          saveStored(STORAGE_KEYS.RECURRING, recurringState);
          return assembled;
        }
      } catch (err) {
        console.warn('Supabase fetch recurring error (falling back to local cache):', err);
      }
    }

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

  async syncUserProfile(clerkUser: {
    id: string;
    name: string;
    email: string;
    avatar: string;
    phone?: string;
  }): Promise<UserProfile> {
    let localProfile = getStored<UserProfile>(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE);

    if (localProfile.id !== clerkUser.id) {
      localProfile = {
        id: clerkUser.id,
        full_name: clerkUser.name || 'SplitStay User',
        email: clerkUser.email || '',
        avatar_url: clerkUser.avatar || DEFAULT_AVATAR,
        phone_number: clerkUser.phone || '',
        currency: 'USD ($)',
        is_onboarded: false
      };
    } else {
      if (clerkUser.name && (!localProfile.full_name || localProfile.full_name === 'Alex Morgan')) {
        localProfile.full_name = clerkUser.name;
      }
      if (clerkUser.email && (!localProfile.email || localProfile.email === 'alex@example.com')) {
        localProfile.email = clerkUser.email;
      }
      if (clerkUser.avatar) {
        localProfile.avatar_url = clerkUser.avatar;
      }
      if (clerkUser.phone) {
        localProfile.phone_number = clerkUser.phone;
      }
    }

    if (supabase && clerkUser.id) {
      try {
        const { data: remoteProfile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', clerkUser.id)
          .maybeSingle();

        if (!error && remoteProfile) {
          localProfile = {
            ...localProfile,
            full_name: remoteProfile.full_name || localProfile.full_name,
            email: remoteProfile.email || localProfile.email,
            phone_number: remoteProfile.phone_number || localProfile.phone_number,
            avatar_url: remoteProfile.avatar_url || localProfile.avatar_url,
            venmo_handle: remoteProfile.venmo_handle || localProfile.venmo_handle,
            cash_app_handle: remoteProfile.cash_app_handle || localProfile.cash_app_handle,
            bio: remoteProfile.bio || localProfile.bio,
            currency: remoteProfile.currency || localProfile.currency || 'USD ($)',
            is_onboarded: true
          };
        }
      } catch (err) {
        console.warn('Supabase remote profile fetch warning:', err);
      }
    }

    if (localProfile.phone_number && localProfile.phone_number.trim().length > 0) {
      localProfile.is_onboarded = true;
    }

    profileState = localProfile;
    saveStored(STORAGE_KEYS.PROFILE, profileState);
    return profileState;
  },

  updateUserProfile(updated: Partial<UserProfile>): UserProfile {
    if (updated.email && profileState.email && updated.email.toLowerCase() !== profileState.email.toLowerCase()) {
      groupsState = [];
    }

    const merged: UserProfile = {
      ...profileState,
      ...updated,
      phone_number: (updated.phone_number !== undefined && updated.phone_number !== '')
        ? updated.phone_number
        : (profileState.phone_number || '')
    };

    profileState = merged;
    saveStored(STORAGE_KEYS.PROFILE, profileState);

    // Sync current user's name & avatar across all groups & members
    groupsState = groupsState.map(g => ({
      ...g,
      members: g.members.map(m => {
        if (m.user_id === profileState.id || (m.email && profileState.email && m.email.toLowerCase() === profileState.email.toLowerCase())) {
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

    if (supabase && profileState.id) {
      supabase.from('profiles').upsert([{
        id: profileState.id,
        email: profileState.email,
        full_name: profileState.full_name,
        avatar_url: profileState.avatar_url,
        phone_number: profileState.phone_number,
        updated_at: new Date().toISOString()
      }]).then(res => {
        if (res.error) console.warn('Supabase profile sync warning:', res.error);
      });
    }

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

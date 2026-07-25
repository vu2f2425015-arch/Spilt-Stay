import React, { useState, useEffect } from 'react';
import { SignedIn, SignedOut, useUser, useAuth } from '@clerk/clerk-react';
import { Group, Expense, Settlement, RecurringExpense, SMSNotification } from './types';
import { apiService } from './services/api';
import { setClerkTokenGetter, supabase } from './lib/supabase';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { GroupDetail } from './components/GroupDetail';
import { AddExpenseModal } from './components/AddExpenseModal';
import { SettleUpModal } from './components/SettleUpModal';
import { NewGroupModal } from './components/NewGroupModal';
import { NotificationsModal } from './components/NotificationsModal';
import { SettingsModal } from './components/SettingsModal';
import { ProfileModal } from './components/ProfileModal';
import { JoinGroupModal } from './components/JoinGroupModal';
import { AuthScreen } from './components/AuthScreen';
import { UserProfile } from './types';

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';
const isClerkConfigured = Boolean(
  clerkKey && 
  !clerkKey.includes('placeholder') && 
  clerkKey.startsWith('pk_')
);

// React Error Boundary Component to prevent blank screen crashes
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('SplitStay Caught Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background text-on-background flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-error-container/30 border border-error text-error flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">warning</span>
          </div>
          <h2 className="text-xl font-bold text-on-surface">Something went wrong</h2>
          <p className="text-sm text-on-surface-variant max-w-md">
            {this.state.error?.message || 'An unexpected rendering error occurred.'}
          </p>
          <button
            onClick={() => {
              apiService.clearAllLocalData();
              window.location.reload();
            }}
            className="bg-primary-container text-on-primary-container px-6 py-2.5 rounded-xl font-semibold text-sm shadow-md"
          >
            Reset Workspace & Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function App() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [recurring, setRecurring] = useState<RecurringExpense[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>(apiService.getUserProfile());
  const [loading, setLoading] = useState(true);
  const [activeToast, setActiveToast] = useState<string | null>(null);

  // Modal States
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isSettleUpOpen, setIsSettleUpOpen] = useState(false);
  const [isNewGroupOpen, setIsNewGroupOpen] = useState(false);
  const [isJoinGroupOpen, setIsJoinGroupOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Give the Supabase client a way to fetch a fresh Clerk session token for
  // every request, so RLS policies (which key off auth.jwt()->>'sub') can
  // actually authorize the signed-in user instead of seeing an anonymous
  // request. This has to be wired up whenever sign-in state changes.
  useEffect(() => {
    if (isClerkConfigured && isSignedIn) {
      setClerkTokenGetter(() => getToken());
    } else {
      setClerkTokenGetter(null);
    }
    return () => setClerkTokenGetter(null);
  }, [isClerkConfigured, isSignedIn, getToken]);

  // Sync Clerk user profile data upon sign in and reload groups for the authenticated account
  useEffect(() => {
    if (isClerkConfigured && isLoaded) {
      if (isSignedIn && user) {
        const clerkName = user.fullName || user.firstName || 'SplitStay User';
        const clerkEmail = user.primaryEmailAddress?.emailAddress || '';
        const clerkAvatar = user.imageUrl || '';
        const clerkPhone = user.primaryPhoneNumber?.phoneNumber || '';

        apiService.syncUserProfile({
          id: user.id,
          name: clerkName,
          email: clerkEmail,
          avatar: clerkAvatar,
          phone: clerkPhone,
        }).then((syncedProfile) => {
          setUserProfile(syncedProfile);
          loadGroups();
        });
      } else {
        setGroups([]);
        setSelectedGroup(null);
      }
    }
  }, [isLoaded, isSignedIn, user?.id, user?.primaryEmailAddress?.emailAddress]);

  // Load Groups safely
  const loadGroups = async () => {
    setLoading(true);
    try {
      const data = await apiService.getGroups();
      setGroups(data || []);
    } catch (err) {
      console.error('Failed loading groups:', err);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  // Live-sync: without this, a change made by a roommate (or from the
  // Supabase dashboard / a different device) only shows up after a full
  // page reload, because we only ever fetch data on mount / after our
  // own actions. Subscribing to Postgres changes on the relevant tables
  // keeps every open tab in sync automatically.
  useEffect(() => {
    const client = supabase;
    if (!(isClerkConfigured && isSignedIn) || !client) return;

    const channel = client
      .channel('splitstay-live-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'groups' }, () => {
        loadGroups();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_members' }, () => {
        loadGroups();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => {
        loadGroups();
        if (selectedGroup) apiService.getExpenses(selectedGroup.id).then(setExpenses);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expense_splits' }, () => {
        loadGroups();
        if (selectedGroup) apiService.getExpenses(selectedGroup.id).then(setExpenses);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settlements' }, () => {
        loadGroups();
        if (selectedGroup) apiService.getSettlements(selectedGroup.id).then(setSettlements);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recurring_expenses' }, () => {
        if (selectedGroup) apiService.getRecurring(selectedGroup.id).then(setRecurring);
      })
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [isClerkConfigured, isSignedIn, selectedGroup?.id]);

  // Delete Group Action
  const handleDeleteGroup = async (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    const confirmDelete = window.confirm(`Are you sure you want to delete '${group.name}'? This action will delete the group for all roommates.`);
    if (!confirmDelete) return;

    await apiService.deleteGroup(groupId);
    if (selectedGroup?.id === groupId) {
      setSelectedGroup(null);
    }
    const freshGroups = await apiService.getGroups();
    setGroups(freshGroups);
    showToast(`Group '${group.name}' has been deleted.`);
  };

  // Leave Group Action
  const handleLeaveGroup = async (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    const groupName = group ? group.name : 'Group';
    await apiService.leaveGroup(groupId);
    if (selectedGroup?.id === groupId) {
      setSelectedGroup(null);
    }
    const freshGroups = await apiService.getGroups();
    setGroups(freshGroups);
    showToast(`You have left '${groupName}'.`);
  };

  // Load details when a group is selected
  useEffect(() => {
    if (selectedGroup) {
      apiService.getExpenses(selectedGroup.id).then(setExpenses);
      apiService.getSettlements(selectedGroup.id).then(setSettlements);
      apiService.getRecurring(selectedGroup.id).then(setRecurring);
    }
  }, [selectedGroup]);

  // Toast Helper
  const showToast = (message: string) => {
    setActiveToast(message);
    setTimeout(() => setActiveToast(null), 6000);
  };

  const handleSaveProfile = (updated: Partial<UserProfile>) => {
    const updatedProfile = apiService.updateUserProfile({
      ...updated,
      is_onboarded: true
    });
    setUserProfile(updatedProfile);
    loadGroups();
    showToast('Profile saved & synced across groups!');
  };

  // Actions
  const handleAddExpense = async (expenseData: Parameters<typeof apiService.addExpense>[0]) => {
    const { notificationsSent } = await apiService.addExpense(expenseData);
    const freshGroups = await apiService.getGroups();
    setGroups(freshGroups);
    
    if (selectedGroup) {
      const updatedExpenses = await apiService.getExpenses(selectedGroup.id);
      setExpenses(updatedExpenses);
      const refetchedGroup = freshGroups.find(g => g.id === selectedGroup.id);
      if (refetchedGroup) setSelectedGroup(refetchedGroup);
    }

    if (notificationsSent && notificationsSent.length > 0) {
      const names = notificationsSent.map(n => `${n.recipient_name} (${n.phone_number})`).join(', ');
      showToast(`📱 Automated WhatsApp/SMS Alert sent to: ${names}`);
    } else {
      showToast(`Expense '${expenseData.title}' added successfully!`);
    }
  };

  const handleSettleUp = async (settlementData: Parameters<typeof apiService.addSettlement>[0]) => {
    const { notification } = await apiService.addSettlement(settlementData);
    const freshGroups = await apiService.getGroups();
    setGroups(freshGroups);
    
    if (selectedGroup) {
      const updatedSettlements = await apiService.getSettlements(selectedGroup.id);
      setSettlements(updatedSettlements);
      const refetchedGroup = freshGroups.find(g => g.id === selectedGroup.id);
      if (refetchedGroup) setSelectedGroup(refetchedGroup);
    }

    if (notification) {
      showToast(`📱 Automated WhatsApp/SMS Payment alert sent to ${notification.recipient_name} (${notification.phone_number})`);
    } else {
      showToast(`Payment of $${settlementData.amount.toFixed(2)} recorded!`);
    }
  };

  const handleCreateGroup = async (name: string, description: string) => {
    const newGroup = await apiService.createGroup(name, description);
    const freshGroups = await apiService.getGroups();
    setGroups(freshGroups);
    setSelectedGroup(newGroup);
    showToast(`Group '${name}' created! Share the join code so roomies can hop in.`);
  };

  const handleAddMember = async (groupId: string, name: string, email: string, phone: string) => {
    const updatedGroup = await apiService.addMemberToGroup(groupId, name, phone, email);
    const freshGroups = await apiService.getGroups();
    setGroups(freshGroups);
    if (updatedGroup) setSelectedGroup(updatedGroup);
    showToast(`Added ${name} (${email}) to group!`);
  };

  const handleJoinGroup = async (code: string) => {
    const joinedGroup = await apiService.joinGroupWithCode(code);
    if (joinedGroup) {
      const freshGroups = await apiService.getGroups();
      setGroups(freshGroups);
      setSelectedGroup(joinedGroup);
      showToast(`Joined group '${joinedGroup.name}' successfully!`);
      return true;
    }
    return false;
  };

  if (isClerkConfigured && !isLoaded) {
    return (
      <div className="min-h-screen bg-background text-on-background flex flex-col items-center justify-center gap-3">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
        <p className="text-sm font-semibold text-on-surface-variant">Connecting to Clerk Authentication...</p>
      </div>
    );
  }

  const appBody = (
    <div className="min-h-screen bg-background text-on-background flex flex-col font-sans relative">
      {/* Toast Notification Popup */}
      {activeToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-surface-container-highest border border-primary/50 text-on-surface px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <span className="material-symbols-outlined text-primary text-xl">notifications_active</span>
          <span className="text-sm font-semibold">{activeToast}</span>
          <button
            onClick={() => setActiveToast(null)}
            className="text-on-surface-variant hover:text-on-surface ml-2"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      )}

      {/* Top Navigation */}
      <Header
        groups={groups}
        selectedGroup={selectedGroup}
        onSelectGroup={setSelectedGroup}
        onOpenNewGroup={() => setIsNewGroupOpen(true)}
        onOpenJoinGroup={() => setIsJoinGroupOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        userProfile={userProfile}
        isClerkConfigured={isClerkConfigured}
      />

      {/* Database/Auth Warning Banner if placeholders active */}
      {(!apiService.isConfigured || !isClerkConfigured) && (
        <div className="bg-surface-container-low border-b border-primary/20 text-xs px-4 py-2 text-center text-on-surface-variant flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-primary text-sm">info</span>
          <span>
            Running in <strong>Clean Local Mode</strong>. Provide <code>VITE_CLERK_PUBLISHABLE_KEY</code> & <code>VITE_SUPABASE_URL</code> in <code>.env</code> for live cloud database sync.
          </span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-container-max w-full mx-auto px-4 md:px-xl py-lg">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-on-surface-variant gap-3">
            <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
            <span>Loading SplitStay workspace...</span>
          </div>
        ) : selectedGroup ? (
          <GroupDetail
            group={selectedGroup}
            expenses={expenses}
            settlements={settlements}
            recurring={recurring}
            onBack={() => setSelectedGroup(null)}
            onOpenAddExpense={() => setIsAddExpenseOpen(true)}
            onOpenSettleUp={() => setIsSettleUpOpen(true)}
            onDeleteGroup={handleDeleteGroup}
            onLeaveGroup={handleLeaveGroup}
            onAddMember={handleAddMember}
            currencySetting={userProfile?.currency}
            currentUserId={userProfile.id}
          />
        ) : (
          <Dashboard
            groups={groups}
            onSelectGroup={setSelectedGroup}
            onOpenNewGroup={() => setIsNewGroupOpen(true)}
            onOpenJoinGroup={() => setIsJoinGroupOpen(true)}
            onOpenAddExpense={() => setIsAddExpenseOpen(true)}
            onDeleteGroup={handleDeleteGroup}
            onLeaveGroup={handleLeaveGroup}
            currencySetting={userProfile?.currency}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-outline-variant/30 py-md px-4 text-center text-xs text-on-surface-variant/60">
        SplitStay Financial Clarity • Supabase & Clerk Integration • SMS Phone Alerts
      </footer>

      {/* Modals */}
      {isAddExpenseOpen && (
        <AddExpenseModal
          groups={groups}
          selectedGroup={selectedGroup}
          onClose={() => setIsAddExpenseOpen(false)}
          currencySetting={userProfile?.currency}
          onAddExpense={handleAddExpense}
        />
      )}

      {isSettleUpOpen && (
        <SettleUpModal
          groups={groups}
          selectedGroup={selectedGroup}
          onClose={() => setIsSettleUpOpen(false)}
          currencySetting={userProfile?.currency}
          currentUserId={userProfile.id}
          onSettleUp={handleSettleUp}
        />
      )}

      {isNewGroupOpen && (
        <NewGroupModal
          onClose={() => setIsNewGroupOpen(false)}
          onCreateGroup={handleCreateGroup}
        />
      )}

      {isJoinGroupOpen && (
        <JoinGroupModal
          onClose={() => setIsJoinGroupOpen(false)}
          onJoinGroup={handleJoinGroup}
        />
      )}

      {isNotificationsOpen && (
        <NotificationsModal
          onClose={() => setIsNotificationsOpen(false)}
        />
      )}

      {isSettingsOpen && (
        <SettingsModal
          profile={userProfile}
          onClose={() => setIsSettingsOpen(false)}
          onSaveProfile={(updated) => {
            const updatedProfile = apiService.updateUserProfile(updated);
            setUserProfile(updatedProfile);
            showToast(`Currency updated to ${updated.currency || 'preferred currency'}`);
          }}
          onResetWorkspace={() => {
            apiService.clearAllLocalData();
            loadGroups();
            setSelectedGroup(null);
            setUserProfile(apiService.getUserProfile());
            showToast('Workspace data has been reset.');
          }}
        />
      )}

      {isProfileOpen && (
        <ProfileModal
          profile={userProfile}
          onClose={() => setIsProfileOpen(false)}
          onSaveProfile={handleSaveProfile}
        />
      )}
    </div>
  );

  // Only prompt first-time new users for initial profile setup. Returning users
  // and users who have already saved their profile or provided details won't be prompted again.
  const needsOnboarding = isClerkConfigured && isLoaded && isSignedIn && !userProfile.is_onboarded && !userProfile.phone_number;

  return (
    <ErrorBoundary>
      {isClerkConfigured ? (
        <>
          <SignedOut>
            <AuthScreen />
          </SignedOut>
          <SignedIn>
            {needsOnboarding ? (
              <ProfileModal
                profile={userProfile}
                required
                onClose={() => {}}
                onSaveProfile={handleSaveProfile}
              />
            ) : (
              appBody
            )}
          </SignedIn>
        </>
      ) : (
        appBody
      )}
    </ErrorBoundary>
  );
}

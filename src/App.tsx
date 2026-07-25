import React, { useState, useEffect } from 'react';
import { Group, Expense, Settlement, RecurringExpense, SMSNotification } from './types';
import { apiService } from './services/api';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { GroupDetail } from './components/GroupDetail';
import { AddExpenseModal } from './components/AddExpenseModal';
import { SettleUpModal } from './components/SettleUpModal';
import { NewGroupModal } from './components/NewGroupModal';
import { NotificationsModal } from './components/NotificationsModal';
import { SettingsModal } from './components/SettingsModal';
import { ProfileModal } from './components/ProfileModal';
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
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

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

  // Delete Group Action
  const handleDeleteGroup = async (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    const confirmDelete = window.confirm(`Are you sure you want to delete '${group.name}'? This action cannot be undone.`);
    if (!confirmDelete) return;

    await apiService.deleteGroup(groupId);
    await loadGroups();
    if (selectedGroup?.id === groupId) {
      setSelectedGroup(null);
    }
    showToast(`Group '${group.name}' has been deleted.`);
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

  // Actions
  const handleAddExpense = async (expenseData: Parameters<typeof apiService.addExpense>[0]) => {
    const { notificationsSent } = await apiService.addExpense(expenseData);
    await loadGroups();
    
    if (selectedGroup) {
      const updatedExpenses = await apiService.getExpenses(selectedGroup.id);
      setExpenses(updatedExpenses);
      const updatedGroups = await apiService.getGroups();
      const refetchedGroup = updatedGroups.find(g => g.id === selectedGroup.id);
      if (refetchedGroup) setSelectedGroup(refetchedGroup);
    }

    if (notificationsSent && notificationsSent.length > 0) {
      const names = notificationsSent.map(n => `${n.recipient_name} (${n.phone_number})`).join(', ');
      showToast(`📱 SMS Notification sent to: ${names}`);
    } else {
      showToast(`Expense '${expenseData.title}' added successfully!`);
    }
  };

  const handleSettleUp = async (settlementData: Parameters<typeof apiService.addSettlement>[0]) => {
    const { notification } = await apiService.addSettlement(settlementData);
    await loadGroups();
    
    if (selectedGroup) {
      const updatedSettlements = await apiService.getSettlements(selectedGroup.id);
      setSettlements(updatedSettlements);
      const updatedGroups = await apiService.getGroups();
      const refetchedGroup = updatedGroups.find(g => g.id === selectedGroup.id);
      if (refetchedGroup) setSelectedGroup(refetchedGroup);
    }

    if (notification) {
      showToast(`📱 SMS Payment alert sent to ${notification.recipient_name} (${notification.phone_number})`);
    } else {
      showToast(`Payment of $${settlementData.amount.toFixed(2)} recorded!`);
    }
  };

  const handleCreateGroup = async (
    name: string,
    description: string,
    rawMembers: { name: string; phone?: string }[]
  ) => {
    const newGroup = await apiService.createGroup(name, description, rawMembers);
    await loadGroups();
    setSelectedGroup(newGroup);
    showToast(`Group '${name}' created with ${newGroup.members.length} members!`);
  };

  return (
    <ErrorBoundary>
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
              currencySetting={userProfile?.currency}
            />
          ) : (
            <Dashboard
              groups={groups}
              onSelectGroup={setSelectedGroup}
              onOpenNewGroup={() => setIsNewGroupOpen(true)}
              onOpenAddExpense={() => setIsAddExpenseOpen(true)}
              onDeleteGroup={handleDeleteGroup}
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
            onSettleUp={handleSettleUp}
          />
        )}

        {isNewGroupOpen && (
          <NewGroupModal
            onClose={() => setIsNewGroupOpen(false)}
            onCreateGroup={handleCreateGroup}
            userName={userProfile?.full_name}
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
            onSaveProfile={(updated) => {
              const updatedProfile = apiService.updateUserProfile(updated);
              setUserProfile(updatedProfile);
              loadGroups();
              showToast('Profile saved & synced across groups!');
            }}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}

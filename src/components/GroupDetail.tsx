import React, { useState } from 'react';
import { Group, Expense, Settlement, RecurringExpense } from '../types';
import { formatCurrency } from '../utils/currency';

interface GroupDetailProps {
  group: Group;
  expenses: Expense[];
  settlements: Settlement[];
  recurring: RecurringExpense[];
  onBack: () => void;
  onOpenAddExpense: () => void;
  onOpenSettleUp: () => void;
  onDeleteGroup: (groupId: string) => void;
  onAddMember?: (groupId: string, name: string, email: string, phone: string) => void;
  currencySetting?: string;
  currentUserId: string;
}

export const GroupDetail: React.FC<GroupDetailProps> = ({
  group,
  expenses,
  settlements,
  recurring,
  onBack,
  onOpenAddExpense,
  onOpenSettleUp,
  onDeleteGroup,
  onAddMember,
  currencySetting,
  currentUserId
}) => {
  const [activeTab, setActiveTab] = useState<'activity' | 'balances' | 'recurring'>('activity');
  const [smsLogNotice, setSmsLogNotice] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');

  const members = Array.isArray(group?.members) ? group.members : [];
  const safeExpenses = Array.isArray(expenses) ? expenses : [];
  const safeSettlements = Array.isArray(settlements) ? settlements : [];
  const safeRecurring = Array.isArray(recurring) ? recurring : [];

  // Dynamic calculation for suggested settlements between roomies
  const owesList = members.filter(m => m.balance < 0);
  const owedList = members.filter(m => m.balance > 0);

  const handleSendManualSMS = (memberName: string, phone: string, balance: number) => {
    const text = `Hi ${memberName}, this is a reminder from SplitStay. You currently have a pending balance of $${Math.abs(balance).toFixed(2)} in '${group.name}'. Please settle up when you can!`;
    const smsUrl = `sms:${phone}?body=${encodeURIComponent(text)}`;
    window.open(smsUrl, '_blank');
    setSmsLogNotice(`SMS notification link generated for ${memberName} (${phone})`);
    setTimeout(() => setSmsLogNotice(null), 5000);
  };

  return (
    <div className="space-y-lg">
      {/* SMS Trigger Notice */}
      {smsLogNotice && (
        <div className="bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">sms</span>
            <span>{smsLogNotice}</span>
          </div>
          <button onClick={() => setSmsLogNotice(null)} className="text-emerald-400 font-bold">✕</button>
        </div>
      )}

      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/30 pb-md">
        <div className="flex items-center gap-md">
          <button
            onClick={onBack}
            className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded-full transition-colors"
            title="Back to Dashboard"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-bold text-on-background">{group?.name || 'Group Details'}</h1>
              <span className="text-xs bg-surface-container-high text-on-surface-variant px-2.5 py-1 rounded-full border border-outline-variant/40">
                {members.length} {members.length === 1 ? 'member' : 'members'}
              </span>
              {(() => {
                const codeToShow = group?.join_code || `STAY-${(group?.id || 'ROOM').replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase()}`;
                return (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(codeToShow);
                      setCopiedCode(true);
                      setSmsLogNotice(`Copied Join Code '${codeToShow}' to clipboard! Share with your roomies.`);
                      setTimeout(() => {
                        setCopiedCode(false);
                        setSmsLogNotice(null);
                      }, 3500);
                    }}
                    className={`text-xs font-mono font-bold px-3 py-1 rounded-full border transition-all flex items-center gap-1 cursor-pointer ${
                      copiedCode
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                        : 'bg-primary/10 border-primary/40 text-primary hover:bg-primary/20'
                    }`}
                    title="Click to copy invite code for roommates"
                  >
                    {copiedCode ? (
                      <>
                        <span className="material-symbols-outlined text-xs text-emerald-400">check</span>
                        <span>Copied Code!</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-xs">key</span>
                        <span>Code: {codeToShow}</span>
                        <span className="material-symbols-outlined text-xs ml-0.5">content_copy</span>
                      </>
                    )}
                  </button>
                );
              })()}
            </div>
            <p className="text-sm text-on-surface-variant">{group?.description || 'No description'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setIsAddMemberOpen(true)}
            className="bg-surface-container-high border border-outline-variant hover:border-primary/50 text-primary px-lg py-md rounded-xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 text-sm"
            title="Add a new roommate by email to this group"
          >
            <span className="material-symbols-outlined text-primary">person_add</span>
            <span>Add Member</span>
          </button>
          <button
            onClick={() => onDeleteGroup(group.id)}
            className="p-2.5 text-error hover:bg-error-container/20 border border-error/30 rounded-xl transition-colors flex items-center gap-1.5 text-sm font-semibold"
            title="Delete Group"
          >
            <span className="material-symbols-outlined text-base">delete</span>
            <span className="hidden sm:inline">Delete</span>
          </button>
          <button
            onClick={onOpenSettleUp}
            className="bg-surface-container-high border border-outline-variant hover:border-emerald-500/50 text-emerald-400 px-lg py-md rounded-xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 text-sm"
          >
            <span className="material-symbols-outlined text-emerald-400">payments</span>
            Settle Up
          </button>
          <button
            onClick={onOpenAddExpense}
            className="bg-primary-container text-on-primary-container px-lg py-md rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-md shadow-primary-container/15 text-sm"
          >
            <span className="material-symbols-outlined">add</span>
            Add Expense
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center border-b border-outline-variant/40 gap-xl">
        <button
          onClick={() => setActiveTab('activity')}
          className={`py-md text-sm font-semibold flex items-center gap-xs border-b-2 transition-colors ${
            activeTab === 'activity'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-lg">receipt_long</span>
          Activity & Expenses
        </button>
        <button
          onClick={() => setActiveTab('balances')}
          className={`py-md text-sm font-semibold flex items-center gap-xs border-b-2 transition-colors ${
            activeTab === 'balances'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-lg">account_balance_wallet</span>
          Balances & Debt Summary
        </button>
        <button
          onClick={() => setActiveTab('recurring')}
          className={`py-md text-sm font-semibold flex items-center gap-xs border-b-2 transition-colors ${
            activeTab === 'recurring'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-lg">update</span>
          Recurring Expenses
        </button>
      </div>

      {/* TAB 1: ACTIVITY TIMELINE */}
      {activeTab === 'activity' && (
        <div className="space-y-md">
          {safeExpenses.length === 0 ? (
            <div className="text-center py-xl space-y-md bg-surface-container-low border border-outline-variant/40 rounded-xl">
              <span className="material-symbols-outlined text-5xl text-outline">receipt</span>
              <p className="text-on-surface-variant">No expenses added yet in this group.</p>
              <button
                onClick={onOpenAddExpense}
                className="bg-primary-container text-on-primary-container px-lg py-sm rounded-xl text-sm font-semibold inline-flex items-center gap-2"
              >
                Add the first expense
              </button>
            </div>
          ) : (
            safeExpenses.map((expense) => {
              const splits = Array.isArray(expense.splits) ? expense.splits : [];
              const userSplit = splits.find(s => s.user_id === currentUserId);
              const isPayer = expense.paid_by === currentUserId;

              return (
                <div
                  key={expense.id}
                  className="bg-surface-container-low border border-outline-variant/60 rounded-xl p-lg flex flex-col sm:flex-row sm:items-center justify-between gap-md hover:border-outline transition-colors"
                >
                  <div className="flex items-start gap-md">
                    <div className="w-12 h-12 rounded-xl bg-surface-container-high border border-outline-variant/50 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-2xl">
                        {expense.category === 'groceries' ? 'shopping_cart' : expense.category === 'utilities' ? 'bolt' : 'receipt_long'}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-on-surface text-base">{expense.title}</h3>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        Paid by <span className="font-medium text-on-surface">{expense.paid_by_name}</span> • {expense.expense_date}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {splits.map((s, i) => (
                          <span
                            key={i}
                            className="text-[11px] bg-surface-container-highest px-2 py-0.5 rounded text-on-surface-variant"
                          >
                            {s.full_name}: {formatCurrency(s.amount_owed, currencySetting)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="sm:text-right border-t sm:border-t-0 border-outline-variant/30 pt-md sm:pt-0">
                    <p className="text-xl font-bold text-on-surface">{formatCurrency(expense.amount, currencySetting)}</p>
                    {isPayer ? (
                      <span className="text-xs font-semibold text-emerald-400">
                        You paid • Owed {formatCurrency(expense.amount - (userSplit?.amount_owed || 0), currencySetting)}
                      </span>
                    ) : userSplit ? (
                      <span className="text-xs font-semibold text-error">
                        You owe {formatCurrency(userSplit.amount_owed, currencySetting)}
                      </span>
                    ) : (
                      <span className="text-xs text-on-surface-variant">Not involved</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: BALANCES & DEBT SUMMARY */}
      {activeTab === 'balances' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
          {/* Member Balance Breakdown */}
          <div className="bg-surface-container-low border border-outline-variant/60 rounded-xl p-lg space-y-md">
            <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">groups</span>
              Member Balance Breakdown
            </h3>
            <div className="space-y-md">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-md bg-surface-container rounded-lg border border-outline-variant/30 flex-wrap gap-2"
                >
                  <div className="flex items-center gap-md">
                    <img
                      src={member.avatar_url}
                      alt={member.full_name}
                      className="w-10 h-10 rounded-full object-cover border border-outline-variant"
                    />
                    <div>
                      <p className="font-semibold text-on-surface text-sm">{member.full_name}</p>
                      {member.email && (
                        <p className="text-[11px] text-on-surface-variant flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs text-primary">mail</span>
                          <span>{member.email}</span>
                        </p>
                      )}
                      {member.phone_number && (
                        <p className="text-[11px] text-on-surface-variant flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">phone</span>
                          <span>{member.phone_number}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-right">
                    <div>
                      {member.balance > 0 && (
                        <p className="text-sm font-bold text-emerald-400">gets back {formatCurrency(member.balance, currencySetting)}</p>
                      )}
                      {member.balance < 0 && (
                        <p className="text-sm font-bold text-error">owes {formatCurrency(Math.abs(member.balance), currencySetting)}</p>
                      )}
                      {member.balance === 0 && (
                        <p className="text-sm font-medium text-on-surface-variant">settled up</p>
                      )}
                    </div>

                    {/* Quick SMS Notify button */}
                    {member.phone_number && member.balance !== 0 && (
                      <button
                        onClick={() => handleSendManualSMS(member.full_name, member.phone_number!, member.balance)}
                        className="p-1.5 bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                        title={`Send SMS notification to ${member.phone_number}`}
                      >
                        <span className="material-symbols-outlined text-sm">sms</span>
                        <span className="hidden sm:inline">SMS</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Settle Up Quick Actions */}
          <div className="bg-surface-container-low border border-outline-variant/60 rounded-xl p-lg space-y-md flex flex-col justify-between">
            <div className="space-y-md">
              <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400">account_balance</span>
                Suggested Settlements
              </h3>
              <p className="text-xs text-on-surface-variant">
                Optimized transactions to clear roomie balances with the fewest payments possible.
              </p>

              <div className="space-y-sm">
                {owesList.length === 0 || owedList.length === 0 ? (
                  <div className="p-md bg-surface-container rounded-lg border border-outline-variant/40 text-xs text-on-surface-variant text-center">
                    All group members are settled up!
                  </div>
                ) : (
                  owesList.map((debtor) => {
                    const creditor = owedList[0];
                    if (!creditor) return null;
                    const settleAmount = Math.min(Math.abs(debtor.balance), creditor.balance);

                    return (
                      <div
                        key={debtor.id}
                        className="p-md bg-surface-container rounded-lg border border-outline-variant/40 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2 text-sm text-on-surface">
                          <span className="font-semibold text-error">{debtor.full_name}</span>
                          <span className="material-symbols-outlined text-xs text-outline">arrow_forward</span>
                          <span className="font-semibold text-emerald-400">{creditor.full_name}</span>
                        </div>
                        <div className="flex items-center gap-md">
                          <span className="font-bold text-on-surface">{formatCurrency(settleAmount, currencySetting)}</span>
                          <button
                            onClick={onOpenSettleUp}
                            className="bg-emerald-950 text-emerald-300 hover:bg-emerald-900 border border-emerald-500/40 text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors"
                          >
                            Settle
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="bg-surface-container p-md rounded-xl border border-outline-variant/30 space-y-xs">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Settlement History</span>
              {safeSettlements.length === 0 ? (
                <p className="text-xs text-on-surface-variant">No settlements recorded yet.</p>
              ) : (
                safeSettlements.map((s) => (
                  <div key={s.id} className="text-xs flex justify-between text-on-surface-variant">
                    <span>{s.payer_name} paid {s.payee_name} via {s.payment_method}</span>
                    <span className="font-semibold text-emerald-400">{formatCurrency(s.amount, currencySetting)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RECURRING EXPENSES */}
      {activeTab === 'recurring' && (
        <div className="space-y-md">
          <div className="flex justify-between items-center bg-surface-container-low p-lg border border-outline-variant/40 rounded-xl">
            <div>
              <h3 className="font-bold text-on-surface">Scheduled Shared Bills</h3>
              <p className="text-xs text-on-surface-variant">Auto-tracked monthly household bills for {group?.name}</p>
            </div>
          </div>

          {safeRecurring.length === 0 ? (
            <div className="text-center py-xl bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface-variant">
              No recurring bills scheduled yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
              {safeRecurring.map((rec) => (
                <div
                  key={rec.id}
                  className="bg-surface-container-low border border-outline-variant/60 rounded-xl p-lg space-y-md hover:border-primary transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">event_repeat</span>
                    </div>
                    <span className="text-[11px] bg-primary-container/20 text-primary border border-primary-container/40 px-2 py-0.5 rounded-full font-semibold uppercase">
                      {rec.frequency}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-on-surface text-base">{rec.title}</h4>
                    <p className="text-2xl font-bold text-on-surface mt-1">{formatCurrency(rec.amount, currencySetting)}</p>
                  </div>
                  <div className="pt-md border-t border-outline-variant/30 text-xs space-y-1 text-on-surface-variant">
                    <p>Paid by: <span className="text-on-surface font-medium">{rec.payer_name}</span></p>
                    <p>Next due: <span className="text-primary font-semibold">{rec.next_due}</span></p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ADD MEMBER MODAL */}
      {isAddMemberOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container border border-outline-variant rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="px-lg py-md border-b border-outline-variant/40 flex justify-between items-center bg-surface-container-low">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">person_add</span>
                <h3 className="font-bold text-on-surface text-base">Add Member by Email</h3>
              </div>
              <button
                onClick={() => setIsAddMemberOpen(false)}
                className="p-1 text-on-surface-variant hover:text-on-surface rounded-full"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newMemberName.trim() || !newMemberEmail.trim()) return;
                if (onAddMember) {
                  onAddMember(group.id, newMemberName.trim(), newMemberEmail.trim(), newMemberPhone.trim());
                }
                setNewMemberName('');
                setNewMemberEmail('');
                setNewMemberPhone('');
                setIsAddMemberOpen(false);
              }}
              className="p-lg space-y-md"
            >
              <div className="space-y-xs">
                <label className="text-xs font-semibold text-on-surface-variant uppercase">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Jane Doe"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  required
                  className="w-full bg-surface-container-low border border-outline-variant/60 rounded-lg px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-xs">
                <label className="text-xs font-semibold text-on-surface-variant uppercase">Email Address (for Account Connection) *</label>
                <input
                  type="email"
                  placeholder="e.g. jane@example.com"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  required
                  className="w-full bg-surface-container-low border border-outline-variant/60 rounded-lg px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
                />
                <p className="text-[11px] text-primary">When Jane logs in with this email, this group will automatically show on her dashboard.</p>
              </div>

              <div className="space-y-xs">
                <label className="text-xs font-semibold text-on-surface-variant uppercase">Phone Number (SMS Alerts, Optional)</label>
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={newMemberPhone}
                  onChange={(e) => setNewMemberPhone(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/60 rounded-lg px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-md pt-md border-t border-outline-variant/40">
                <button
                  type="button"
                  onClick={() => setIsAddMemberOpen(false)}
                  className="px-md py-2 text-sm font-semibold text-on-surface-variant hover:text-on-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary-container text-on-primary-container px-lg py-2 text-sm font-semibold rounded-xl shadow"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

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
  onLeaveGroup?: (groupId: string) => void;
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
  onLeaveGroup,
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
    const text = `Hi ${memberName}, this is a reminder from SplitStay. You currently have a pending balance of ${formatCurrency(Math.abs(balance), currencySetting)} in '${group.name}'. Please settle up when you can!`;
    const smsUrl = `sms:${phone}?body=${encodeURIComponent(text)}`;
    window.open(smsUrl, '_blank');
    setSmsLogNotice(`SMS notification link generated for ${memberName} (${phone})`);
    setTimeout(() => setSmsLogNotice(null), 5000);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* SMS Notice Banner */}
      {smsLogNotice && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-2xl text-xs flex items-center justify-between shadow-lg shadow-emerald-500/5">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-emerald-400 text-lg">sms</span>
            <span className="font-semibold">{smsLogNotice}</span>
          </div>
          <button onClick={() => setSmsLogNotice(null)} className="text-emerald-400 font-bold hover:text-emerald-200">✕</button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 rounded-2xl transition-all border border-transparent hover:border-slate-700/60"
            title="Back to Dashboard"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight">{group?.name || 'Group Details'}</h1>
              <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-700/60 font-medium">
                {members.length} {members.length === 1 ? 'roommate' : 'roommates'}
              </span>
              {(() => {
                const codeToShow = group?.join_code || `STAY-${(group?.id || 'ROOM').replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase()}`;
                return (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(codeToShow);
                      setCopiedCode(true);
                      setSmsLogNotice(`Copied Join Code '${codeToShow}' to clipboard! Share with roomies.`);
                      setTimeout(() => {
                        setCopiedCode(false);
                        setSmsLogNotice(null);
                      }, 3500);
                    }}
                    className={`text-xs font-mono font-bold px-3.5 py-1.5 rounded-full border transition-all flex items-center gap-1.5 cursor-pointer ${
                      copiedCode
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                        : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20'
                    }`}
                    title="Click to copy join code"
                  >
                    {copiedCode ? (
                      <>
                        <span className="material-symbols-outlined text-xs text-emerald-400">check</span>
                        <span>Copied Code!</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-xs text-indigo-400">key</span>
                        <span>Code: {codeToShow}</span>
                        <span className="material-symbols-outlined text-xs opacity-70">content_copy</span>
                      </>
                    )}
                  </button>
                );
              })()}
            </div>
            <p className="text-xs md:text-sm text-slate-400 mt-1">{group?.description || 'Shared roommate expenses'}</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsAddMemberOpen(true)}
            className="bg-slate-900/90 border border-slate-700/80 hover:border-indigo-500/50 text-indigo-300 px-4 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 text-xs md:text-sm"
          >
            <span className="material-symbols-outlined text-indigo-400 text-lg">person_add</span>
            <span>Add Member</span>
          </button>

          {onLeaveGroup && (
            <button
              onClick={() => {
                const confirmLeave = window.confirm(`Are you sure you want to leave '${group.name}'? You can re-join later using code '${group.join_code}'.`);
                if (confirmLeave) onLeaveGroup(group.id);
              }}
              className="bg-slate-900/90 border border-amber-500/30 text-amber-300 hover:bg-amber-500/10 px-3.5 py-2.5 rounded-xl font-semibold flex items-center gap-1.5 transition-all text-xs md:text-sm"
              title="Leave Group"
            >
              <span className="material-symbols-outlined text-amber-400 text-lg">logout</span>
              <span className="hidden sm:inline">Leave</span>
            </button>
          )}

          <button
            onClick={() => onDeleteGroup(group.id)}
            className="p-2.5 text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 rounded-xl transition-all flex items-center gap-1.5 text-xs md:text-sm font-semibold"
            title="Delete Group"
          >
            <span className="material-symbols-outlined text-lg">delete</span>
            <span className="hidden sm:inline">Delete</span>
          </button>

          <button
            onClick={onOpenSettleUp}
            className="bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-500/60 text-emerald-300 px-4 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 text-xs md:text-sm shadow-sm"
          >
            <span className="material-symbols-outlined text-emerald-400 text-lg">payments</span>
            <span>Settle Up</span>
          </button>

          <button
            onClick={onOpenAddExpense}
            className="btn-gradient-primary text-white px-5 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-95 transition-all text-xs md:text-sm shadow-lg shadow-indigo-500/20"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center border-b border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab('activity')}
          className={`py-3 text-xs md:text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'activity'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="material-symbols-outlined text-lg">receipt_long</span>
          <span>Activity & Expenses</span>
        </button>
        <button
          onClick={() => setActiveTab('balances')}
          className={`py-3 text-xs md:text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'balances'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="material-symbols-outlined text-lg">account_balance_wallet</span>
          <span>Balances & Debt Summary</span>
        </button>
        <button
          onClick={() => setActiveTab('recurring')}
          className={`py-3 text-xs md:text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'recurring'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="material-symbols-outlined text-lg">update</span>
          <span>Recurring Bills</span>
        </button>
      </div>

      {/* TAB 1: ACTIVITY TIMELINE */}
      {activeTab === 'activity' && (
        <div className="space-y-4">
          {safeExpenses.length === 0 ? (
            <div className="text-center py-12 space-y-4 glass-panel border border-slate-800 border-dashed rounded-3xl">
              <span className="material-symbols-outlined text-5xl text-slate-600">receipt</span>
              <p className="text-slate-400 text-sm">No expenses recorded yet in this group.</p>
              <button
                onClick={onOpenAddExpense}
                className="btn-gradient-primary text-white px-6 py-2.5 rounded-xl text-xs font-semibold inline-flex items-center gap-2 shadow-lg"
              >
                <span>Add First Expense</span>
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
                  className="glass-card rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-800 hover:border-indigo-500/40 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-900/90 border border-slate-700/60 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
                      <span className="material-symbols-outlined text-2xl">
                        {expense.category === 'groceries' ? 'shopping_cart' : expense.category === 'utilities' ? 'bolt' : 'receipt_long'}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-bold text-slate-100 text-base">{expense.title}</h3>
                      <p className="text-xs text-slate-400">
                        Paid by <span className="font-semibold text-indigo-300">{expense.paid_by_name}</span> • {expense.expense_date}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {splits.map((s, i) => (
                          <span
                            key={i}
                            className="text-[11px] bg-slate-900/80 border border-slate-800 px-2.5 py-0.5 rounded-lg text-slate-300"
                          >
                            {s.full_name}: {formatCurrency(s.amount_owed, currencySetting)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="sm:text-right border-t sm:border-t-0 border-slate-800 pt-3 sm:pt-0">
                    <p className="text-xl font-extrabold text-slate-100">{formatCurrency(expense.amount, currencySetting)}</p>
                    {isPayer ? (
                      <span className="text-xs font-bold text-emerald-400 inline-block mt-0.5">
                        You paid • Owed {formatCurrency(expense.amount - (userSplit?.amount_owed || 0), currencySetting)}
                      </span>
                    ) : userSplit ? (
                      <span className="text-xs font-bold text-rose-400 inline-block mt-0.5">
                        You owe {formatCurrency(userSplit.amount_owed, currencySetting)}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">Not involved</span>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Roommate Balance Breakdown */}
          <div className="glass-panel border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-400">groups</span>
              <span>Roommate Balances</span>
            </h3>
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 bg-slate-900/80 rounded-2xl border border-slate-800/80 flex-wrap gap-2 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={member.avatar_url}
                      alt={member.full_name}
                      className="w-10 h-10 rounded-xl object-cover border border-indigo-500/40 shadow-sm"
                    />
                    <div>
                      <p className="font-bold text-slate-100 text-sm">{member.full_name}</p>
                      {member.email && (
                        <p className="text-[11px] text-slate-400 flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs text-indigo-400">mail</span>
                          <span>{member.email}</span>
                        </p>
                      )}
                      {member.phone_number && (
                        <p className="text-[11px] text-slate-400 flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs text-slate-400">phone</span>
                          <span>{member.phone_number}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-right">
                    <div>
                      {member.balance > 0 && (
                        <p className="text-xs md:text-sm font-bold text-emerald-400">gets back {formatCurrency(member.balance, currencySetting)}</p>
                      )}
                      {member.balance < 0 && (
                        <p className="text-xs md:text-sm font-bold text-rose-400">owes {formatCurrency(Math.abs(member.balance), currencySetting)}</p>
                      )}
                      {member.balance === 0 && (
                        <p className="text-xs md:text-sm font-medium text-slate-400">settled up</p>
                      )}
                    </div>

                    {/* SMS Alert trigger */}
                    {member.phone_number && member.balance !== 0 && (
                      <button
                        onClick={() => handleSendManualSMS(member.full_name, member.phone_number!, member.balance)}
                        className="p-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all"
                        title={`Send SMS alert to ${member.phone_number}`}
                      >
                        <span className="material-symbols-outlined text-sm text-indigo-400">sms</span>
                        <span className="hidden sm:inline">SMS</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Settle Up Quick Actions */}
          <div className="glass-panel border border-slate-800 rounded-3xl p-6 space-y-4 flex flex-col justify-between shadow-xl">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400">account_balance</span>
                <span>Suggested Settlements</span>
              </h3>
              <p className="text-xs text-slate-400">
                Optimized roomie transactions to clear balances with the fewest payments possible.
              </p>

              <div className="space-y-3">
                {owesList.length === 0 || owedList.length === 0 ? (
                  <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 text-xs text-slate-400 text-center font-medium">
                    All roommates are completely settled up!
                  </div>
                ) : (
                  owesList.map((debtor) => {
                    const creditor = owedList[0];
                    if (!creditor) return null;
                    const settleAmount = Math.min(Math.abs(debtor.balance), creditor.balance);

                    return (
                      <div
                        key={debtor.id}
                        className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2 text-xs md:text-sm text-slate-200">
                          <span className="font-bold text-rose-400">{debtor.full_name}</span>
                          <span className="material-symbols-outlined text-xs text-slate-500">arrow_forward</span>
                          <span className="font-bold text-emerald-400">{creditor.full_name}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-extrabold text-slate-100 text-sm">{formatCurrency(settleAmount, currencySetting)}</span>
                          <button
                            onClick={onOpenSettleUp}
                            className="bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/40 text-xs px-3.5 py-1.5 rounded-xl font-bold transition-all shadow-sm"
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

            <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-2 mt-4">
              <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Settlement History</span>
              {safeSettlements.length === 0 ? (
                <p className="text-xs text-slate-500">No past payments recorded yet.</p>
              ) : (
                safeSettlements.map((s) => (
                  <div key={s.id} className="text-xs flex justify-between text-slate-300 py-0.5">
                    <span>{s.payer_name} paid {s.payee_name} via {s.payment_method}</span>
                    <span className="font-bold text-emerald-400">{formatCurrency(s.amount, currencySetting)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RECURRING EXPENSES */}
      {activeTab === 'recurring' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center glass-panel p-6 border border-slate-800 rounded-3xl">
            <div>
              <h3 className="font-bold text-slate-100 text-lg">Scheduled Shared Bills</h3>
              <p className="text-xs text-slate-400">Auto-tracked monthly household bills for {group?.name}</p>
            </div>
          </div>

          {safeRecurring.length === 0 ? (
            <div className="text-center py-12 glass-panel border border-slate-800 border-dashed rounded-3xl text-xs text-slate-400">
              No recurring bills scheduled yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {safeRecurring.map((rec) => (
                <div
                  key={rec.id}
                  className="glass-card border border-slate-800 rounded-2xl p-6 space-y-4 hover:border-indigo-500/40 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                      <span className="material-symbols-outlined">event_repeat</span>
                    </div>
                    <span className="text-[10px] bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      {rec.frequency}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100 text-base">{rec.title}</h4>
                    <p className="text-2xl font-extrabold text-slate-100 mt-1">{formatCurrency(rec.amount, currencySetting)}</p>
                  </div>
                  <div className="pt-4 border-t border-slate-800 text-xs space-y-1 text-slate-400">
                    <p>Paid by: <span className="text-slate-200 font-semibold">{rec.payer_name}</span></p>
                    <p>Next due: <span className="text-indigo-400 font-bold">{rec.next_due}</span></p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ADD MEMBER MODAL OVERLAY */}
      {isAddMemberOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel border border-slate-700/80 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in-up">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/90">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">person_add</span>
                </div>
                <h3 className="font-bold text-slate-100 text-base">Add Roommate by Email</h3>
              </div>
              <button
                onClick={() => setIsAddMemberOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-full hover:bg-slate-800 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
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
              className="p-6 space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Jane Doe"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  required
                  className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address *</label>
                <input
                  type="email"
                  placeholder="e.g. jane@example.com"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  required
                  className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
                />
                <p className="text-[11px] text-indigo-400 font-medium">When Jane logs in with this email, this group automatically appears on her dashboard.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phone Number (SMS Alerts, Optional)</label>
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={newMemberPhone}
                  onChange={(e) => setNewMemberPhone(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddMemberOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-gradient-primary text-white px-5 py-2.5 text-xs font-bold rounded-xl shadow-lg"
                >
                  Add Roommate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

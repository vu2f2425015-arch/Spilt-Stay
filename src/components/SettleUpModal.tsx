import React, { useState } from 'react';
import { Group, Settlement } from '../types';
import { getCurrencySymbol, formatCurrency } from '../utils/currency';

interface SettleUpModalProps {
  groups: Group[];
  selectedGroup: Group | null;
  onClose: () => void;
  currencySetting?: string;
  currentUserId: string;
  onSettleUp: (settlement: {
    group_id: string;
    payer_id: string;
    payer_name: string;
    payee_id: string;
    payee_name: string;
    payee_phone?: string;
    amount: number;
    payment_method: Settlement['payment_method'];
    sendSMS?: boolean;
  }) => void;
}

export const SettleUpModal: React.FC<SettleUpModalProps> = ({
  groups,
  selectedGroup,
  onClose,
  currencySetting,
  currentUserId,
  onSettleUp
}) => {
  const currencySymbol = getCurrencySymbol(currencySetting);
  const [groupId, setGroupId] = useState(selectedGroup ? selectedGroup.id : groups[0]?.id || '');
  const currentGroup = groups.find(g => g.id === groupId) || groups[0];
  const members = currentGroup ? (Array.isArray(currentGroup.members) ? currentGroup.members : []) : [];

  // Debtor should be default payer, Creditor should be default payee
  const defaultDebtor = members.find(m => m.balance < 0) || members[1] || members[0];
  const defaultCreditor = members.find(m => m.balance > 0) || members[0];

  const [payerId, setPayerId] = useState(defaultDebtor?.user_id || currentUserId);
  const [payeeId, setPayeeId] = useState(defaultCreditor?.user_id || '');
  
  // Calculate suggested amount in active currency
  const initialSuggestedUSD = defaultDebtor ? Math.abs(defaultDebtor.balance) : 0;

  const [amount, setAmount] = useState(initialSuggestedUSD > 0 ? (initialSuggestedUSD).toFixed(2) : '');
  const [paymentMethod, setPaymentMethod] = useState<Settlement['payment_method']>('cash');
  const [sendSMS, setSendSMS] = useState(true);

  // Sync payer and payee if group changes
  React.useEffect(() => {
    if (members.length > 0) {
      const debtor = members.find(m => m.balance < 0) || members[1] || members[0];
      const creditor = members.find(m => m.balance > 0) || members[0];
      setPayerId(debtor.user_id);
      setPayeeId(creditor.user_id !== debtor.user_id ? creditor.user_id : (members.find(m => m.user_id !== debtor.user_id)?.user_id || ''));
      if (debtor && Math.abs(debtor.balance) > 0) {
        setAmount(Math.abs(debtor.balance).toFixed(2));
      }
    }
  }, [groupId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0 || !currentGroup) return;

    const payerMember = members.find(m => m.user_id === payerId) || members[0];
    const payeeMember = members.find(m => m.user_id === payeeId) || members[1];
    
    if (!payerMember || !payeeMember || payerMember.user_id === payeeMember.user_id) return;

    const userEnteredAmount = Number(parseFloat(amount).toFixed(2));

    onSettleUp({
      group_id: groupId,
      payer_id: payerMember.user_id,
      payer_name: payerMember.full_name,
      payee_id: payeeMember.user_id,
      payee_name: payeeMember.full_name,
      payee_phone: payeeMember.phone_number,
      amount: userEnteredAmount,
      payment_method: paymentMethod,
      sendSMS
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel border border-slate-700/80 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl space-y-4 p-6 animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <span className="material-symbols-outlined text-xl">payments</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Record Settlement Payment</h2>
              <p className="text-xs text-slate-400">Clear balances between roommates</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-100 rounded-full hover:bg-slate-800 transition-colors">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Group Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Group Workspace *</label>
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
            >
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          {/* Payer & Payee Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Who Paid? *</label>
              <select
                value={payerId}
                onChange={(e) => setPayerId(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-4 py-2.5 text-xs md:text-sm text-slate-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
              >
                {members.map(m => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.full_name} {m.balance < 0 ? `(owes ${formatCurrency(Math.abs(m.balance), currencySetting)})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Paid To Whom? *</label>
              <select
                value={payeeId}
                onChange={(e) => setPayeeId(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-4 py-2.5 text-xs md:text-sm text-slate-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
              >
                {members.map(m => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.full_name} {m.balance > 0 ? `(is owed ${formatCurrency(m.balance, currencySetting)})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Amount ({currencySymbol}) *</label>
              {initialSuggestedUSD > 0 && (
                <span className="text-[11px] text-emerald-400 font-bold">
                  Suggested: {formatCurrency(initialSuggestedUSD, currencySetting)}
                </span>
              )}
            </div>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-4 py-2.5 text-emerald-400 font-extrabold text-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
            />
          </div>

          {/* Payment Method Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Payment Method</label>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: 'cash', label: 'Cash / Other', icon: 'payments' },
                { id: 'venmo', label: 'Venmo', icon: 'send' },
                { id: 'cash_app', label: 'Cash App', icon: 'attach_money' },
                { id: 'bank_transfer', label: 'Bank Transfer', icon: 'account_balance' },
              ].map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id as Settlement['payment_method'])}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${
                    paymentMethod === m.id
                      ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 shadow-lg shadow-emerald-950/50'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-emerald-400">{m.icon}</span>
                    <span>{m.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* SMS Toggle */}
          <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-emerald-400">chat</span>
              <div>
                <p className="text-xs font-bold text-slate-200">Send Payment SMS & WhatsApp Alert</p>
                <p className="text-[11px] text-slate-400">Notify roomie via SMS or WhatsApp</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={sendSMS}
              onChange={(e) => setSendSMS(e.target.checked)}
              className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-6 py-2.5 text-xs rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2"
            >
              <span>Record Payment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

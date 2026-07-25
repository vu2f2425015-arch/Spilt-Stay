import React, { useState } from 'react';
import { Group, Settlement } from '../types';
import { getCurrencySymbol, formatCurrency, parseInputAmountToUSD } from '../utils/currency';

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
  const initialSuggestedFormatted = initialSuggestedUSD > 0 ? (initialSuggestedUSD * (parseInputAmountToUSD(1, currencySetting) === 1 ? 1 : 1)).toFixed(2) : '50.00';
  
  const [amount, setAmount] = useState(initialSuggestedFormatted);
  const [paymentMethod, setPaymentMethod] = useState<Settlement['payment_method']>('venmo');
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0 || !currentGroup) return;

    const payerMember = members.find(m => m.user_id === payerId) || members[0];
    const payeeMember = members.find(m => m.user_id === payeeId) || members[1];
    
    if (!payerMember || !payeeMember || payerMember.user_id === payeeMember.user_id) return;

    const userEnteredAmount = parseFloat(amount);
    const amountInUSD = parseInputAmountToUSD(userEnteredAmount, currencySetting);

    onSettleUp({
      group_id: groupId,
      payer_id: payerMember.user_id,
      payer_name: payerMember.full_name,
      payee_id: payeeMember.user_id,
      payee_name: payeeMember.full_name,
      payee_phone: payeeMember.phone_number,
      amount: amountInUSD,
      payment_method: paymentMethod,
      sendSMS
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface-container border border-outline-variant rounded-xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-lg py-md border-b border-outline-variant/40 flex justify-between items-center bg-surface-container-low shrink-0">
          <div className="flex items-center gap-md">
            <div className="w-9 h-9 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
              <span className="material-symbols-outlined">payments</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-on-surface">Settle Up Debt</h2>
              <p className="text-xs text-on-surface-variant">Record a payment & notify roomie via SMS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-on-surface-variant hover:text-on-surface rounded-full hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-lg space-y-lg overflow-y-auto flex-1">
          {/* Select Group */}
          <div className="space-y-xs">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Group</label>
            <select
              value={groupId}
              onChange={(e) => {
                setGroupId(e.target.value);
                const g = groups.find(x => x.id === e.target.value);
                const mems = g && Array.isArray(g.members) ? g.members : [];
                const others = mems.filter(m => m.user_id !== currentUserId);
                if (others[0]) setPayeeId(others[0].user_id);
              }}
              className="w-full bg-surface-container-low border border-outline-variant/60 rounded-lg px-md py-2.5 text-on-surface focus:border-primary focus:outline-none"
            >
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          {/* Payer Selection */}
          <div className="space-y-xs">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Who is Paying?</label>
            <select
              value={payerId}
              onChange={(e) => {
                setPayerId(e.target.value);
                const selectedPayer = members.find(m => m.user_id === e.target.value);
                if (selectedPayer && Math.abs(selectedPayer.balance) > 0) {
                  setAmount(Math.abs(selectedPayer.balance).toFixed(2));
                }
              }}
              className="w-full bg-surface-container-low border border-outline-variant/60 rounded-lg px-md py-2.5 text-on-surface focus:border-primary focus:outline-none"
            >
              {members.map(m => (
                <option key={m.user_id} value={m.user_id}>
                  {m.full_name} {m.balance < 0 ? `(owes ${formatCurrency(Math.abs(m.balance), currencySetting)})` : m.balance > 0 ? `(gets back ${formatCurrency(m.balance, currencySetting)})` : '(settled)'}
                </option>
              ))}
            </select>
          </div>

          {/* Payee Selection */}
          <div className="space-y-xs">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Who gets paid? (Recipient)</label>
            <select
              value={payeeId}
              onChange={(e) => setPayeeId(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/60 rounded-lg px-md py-2.5 text-on-surface focus:border-primary focus:outline-none"
            >
              {members.filter(m => m.user_id !== payerId).map(m => (
                <option key={m.user_id} value={m.user_id}>
                  {m.full_name} {m.phone_number ? `(${m.phone_number})` : ''} {m.balance > 0 ? `(gets back ${formatCurrency(m.balance, currencySetting)})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div className="space-y-xs">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Payment Amount ({currencySymbol})</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full bg-surface-container-low border border-outline-variant/60 rounded-lg px-md py-2.5 text-emerald-400 font-bold text-xl focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Payment Method Picker */}
          <div className="space-y-xs">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Payment Method</label>
            <div className="grid grid-cols-2 gap-sm">
              {[
                { id: 'venmo', label: 'Venmo', icon: 'send' },
                { id: 'cash_app', label: 'Cash App', icon: 'attach_money' },
                { id: 'bank_transfer', label: 'Bank Transfer', icon: 'account_balance' },
                { id: 'cash', label: 'Cash / Other', icon: 'payments' },
              ].map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id as Settlement['payment_method'])}
                  className={`p-md rounded-lg border text-sm font-semibold flex items-center gap-2 transition-all ${
                    paymentMethod === m.id
                      ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                      : 'bg-surface-container-low border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">{m.icon}</span>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* SMS Alert Toggle */}
          <div className="bg-surface-container-low p-md rounded-lg border border-outline-variant/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-400">sms</span>
              <div>
                <p className="text-xs font-bold text-on-surface">Send Payment SMS Alert</p>
                <p className="text-[11px] text-on-surface-variant">Notify roomie via SMS when settled</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={sendSMS}
              onChange={(e) => setSendSMS(e.target.checked)}
              className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-md pt-md border-t border-outline-variant/40">
            <button
              type="button"
              onClick={onClose}
              className="px-lg py-md text-sm font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-xl py-md text-sm font-semibold rounded-xl shadow-lg shadow-emerald-900/30 active:scale-95 transition-all"
            >
              Record Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

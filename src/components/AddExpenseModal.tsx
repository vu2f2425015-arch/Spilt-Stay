import React, { useState } from 'react';
import { Group, Expense } from '../types';
import { getCurrencySymbol, formatCurrency, parseInputAmountToUSD } from '../utils/currency';

interface AddExpenseModalProps {
  groups: Group[];
  selectedGroup: Group | null;
  onClose: () => void;
  currencySetting?: string;
  onAddExpense: (expense: {
    group_id: string;
    paid_by: string;
    paid_by_name: string;
    title: string;
    amount: number;
    category: Expense['category'];
    splits: { user_id: string; full_name: string; phone_number?: string; amount_owed: number }[];
    sendSMSNotification?: boolean;
  }) => void;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  groups,
  selectedGroup,
  onClose,
  currencySetting,
  onAddExpense
}) => {
  const currencySymbol = getCurrencySymbol(currencySetting);
  const [groupId, setGroupId] = useState(selectedGroup ? selectedGroup.id : groups[0]?.id || '');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Expense['category']>('groceries');

  const currentGroup = groups.find(g => g.id === groupId) || groups[0];
  const members = currentGroup ? (Array.isArray(currentGroup.members) ? currentGroup.members : []) : [];

  const [paidBy, setPaidBy] = useState(members[0]?.user_id || 'user_current');
  const [sendSMS, setSendSMS] = useState(true);

  // Sync paidBy whenever groupId or members list changes
  React.useEffect(() => {
    if (members.length > 0) {
      if (!paidBy || !members.some(m => m.user_id === paidBy)) {
        setPaidBy(members[0].user_id);
      }
    }
  }, [groupId, members]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount || parseFloat(amount) <= 0 || !currentGroup) return;

    const userEnteredAmount = parseFloat(amount);
    // Convert entered amount in active currency back to base USD for stored database state
    const numAmountInUSD = parseInputAmountToUSD(userEnteredAmount, currencySetting);

    const memberCount = Math.max(members.length, 1);
    const equalSplit = numAmountInUSD / memberCount;

    const splits = members.map(m => ({
      user_id: m.user_id,
      full_name: m.full_name,
      phone_number: m.phone_number,
      amount_owed: Math.round(equalSplit * 100) / 100
    }));

    const payerMember = members.find(m => m.user_id === paidBy);

    onAddExpense({
      group_id: groupId,
      paid_by: paidBy,
      paid_by_name: payerMember ? payerMember.full_name : 'You',
      title,
      amount: numAmountInUSD,
      category,
      splits,
      sendSMSNotification: sendSMS
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <div className="bg-surface-container border border-outline-variant rounded-xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-lg py-md border-b border-outline-variant/40 flex justify-between items-center bg-surface-container-low shrink-0">
          <div className="flex items-center gap-md">
            <div className="w-9 h-9 rounded-lg bg-primary-container/20 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined">add_shopping_cart</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-on-surface">Add Expense</h2>
              <p className="text-xs text-on-surface-variant">Split bill fairly & send SMS alerts</p>
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
              onChange={(e) => setGroupId(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/60 rounded-lg px-md py-2.5 text-on-surface focus:border-primary focus:outline-none"
            >
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div className="space-y-xs">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Description</label>
            <input
              type="text"
              placeholder="e.g. Groceries, Utility Bill, Dinner"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-surface-container-low border border-outline-variant/60 rounded-lg px-md py-2.5 text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none"
            />
          </div>

          {/* Amount & Category */}
          <div className="grid grid-cols-2 gap-md">
            <div className="space-y-xs">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Amount ({currencySymbol})</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full bg-surface-container-low border border-outline-variant/60 rounded-lg px-md py-2.5 text-on-surface font-bold text-lg focus:border-primary focus:outline-none"
              />
            </div>
            <div className="space-y-xs">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Expense['category'])}
                className="w-full bg-surface-container-low border border-outline-variant/60 rounded-lg px-md py-2.5 text-on-surface focus:border-primary focus:outline-none"
              >
                <option value="groceries">Groceries</option>
                <option value="rent">Rent</option>
                <option value="utilities">Utilities</option>
                <option value="entertainment">Entertainment</option>
                <option value="travel">Travel</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Paid By */}
          <div className="space-y-xs">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Paid By</label>
            <select
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/60 rounded-lg px-md py-2.5 text-on-surface focus:border-primary focus:outline-none"
            >
              {members.map(m => (
                <option key={m.user_id} value={m.user_id}>
                  {m.full_name} {m.phone_number ? `(${m.phone_number})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* SMS Notification Toggle */}
          <div className="bg-surface-container-low p-md rounded-lg border border-outline-variant/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">sms</span>
              <div>
                <p className="text-xs font-bold text-on-surface">Send Phone SMS Alerts</p>
                <p className="text-[11px] text-on-surface-variant">Notify roomies via phone SMS when saved</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={sendSMS}
              onChange={(e) => setSendSMS(e.target.checked)}
              className="w-4 h-4 accent-primary rounded cursor-pointer"
            />
          </div>

          {/* Split Preview */}
          {amount && parseFloat(amount) > 0 && members.length > 0 && (
            <div className="bg-surface-container-low p-md rounded-lg border border-outline-variant/40 text-xs space-y-1">
              <span className="font-semibold text-primary">Split Breakdown ({members.length} members):</span>
              <p className="text-on-surface-variant">
                {currencySymbol}{(parseFloat(amount) / members.length).toFixed(2)} per person.
              </p>
            </div>
          )}

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
              className="bg-primary-container text-on-primary-container px-xl py-md text-sm font-semibold rounded-xl shadow-lg shadow-primary-container/20 active:scale-95 transition-all"
            >
              Save & Notify
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

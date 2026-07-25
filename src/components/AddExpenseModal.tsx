import React, { useState } from 'react';
import { Group, Expense } from '../types';
import { getCurrencySymbol, formatCurrency } from '../utils/currency';

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

    const userEnteredAmount = Number(parseFloat(amount).toFixed(2));
    const memberCount = Math.max(members.length, 1);

    const baseSplit = Math.floor((userEnteredAmount / memberCount) * 100) / 100;
    let remainder = Number((userEnteredAmount - (baseSplit * memberCount)).toFixed(2));

    const splits = members.map(m => {
      let memberSplit = baseSplit;
      if (remainder > 0.001) {
        memberSplit = Number((memberSplit + 0.01).toFixed(2));
        remainder = Number((remainder - 0.01).toFixed(2));
      }
      return {
        user_id: m.user_id,
        full_name: m.full_name,
        phone_number: m.phone_number,
        amount_owed: memberSplit
      };
    });

    const payerMember = members.find(m => m.user_id === paidBy);

    onAddExpense({
      group_id: groupId,
      paid_by: paidBy,
      paid_by_name: payerMember ? payerMember.full_name : 'You',
      title,
      amount: userEnteredAmount,
      category,
      splits,
      sendSMSNotification: sendSMS
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <div className="glass-panel border border-slate-700/80 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in-up max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <span className="material-symbols-outlined text-xl">add_shopping_cart</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Add Shared Expense</h2>
              <p className="text-xs text-slate-400">Split bills fairly & notify roommates</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-full hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Select Group */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Group Workspace</label>
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
            >
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Expense Description</label>
            <input
              type="text"
              placeholder="e.g. Weekly Groceries, Electricity Bill, Dinner"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
            />
          </div>

          {/* Amount & Category */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Amount ({currencySymbol})</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-4 py-2.5 text-slate-100 font-extrabold text-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Expense['category'])}
                className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
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
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Paid By</label>
            <select
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
            >
              {members.map(m => (
                <option key={m.user_id} value={m.user_id}>
                  {m.full_name} {m.phone_number ? `(${m.phone_number})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* SMS Toggle */}
          <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-indigo-400">chat</span>
              <div>
                <p className="text-xs font-bold text-slate-200">Send Instant SMS Alerts</p>
                <p className="text-[11px] text-slate-400">Notify roomies via SMS and WhatsApp</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={sendSMS}
              onChange={(e) => setSendSMS(e.target.checked)}
              className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
            />
          </div>

          {/* Split Preview */}
          {amount && parseFloat(amount) > 0 && members.length > 0 && (
            <div className="bg-indigo-500/10 p-4 rounded-xl border border-indigo-500/30 text-xs space-y-1">
              <span className="font-bold text-indigo-300">Split Preview ({members.length} roommates):</span>
              <p className="text-slate-300">
                {formatCurrency(parseFloat(amount) / members.length, currencySetting)} per person.
              </p>
            </div>
          )}

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
              className="btn-gradient-primary text-white px-6 py-2.5 text-xs font-bold rounded-xl shadow-lg"
            >
              Save & Notify
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

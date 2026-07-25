import React, { useState } from 'react';

interface NewGroupModalProps {
  onClose: () => void;
  onCreateGroup: (name: string, description: string) => void;
}

export const NewGroupModal: React.FC<NewGroupModalProps> = ({
  onClose,
  onCreateGroup
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onCreateGroup(name.trim(), description.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="glass-panel border border-slate-700/80 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <span className="material-symbols-outlined text-xl">group_add</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Create New Group</h2>
              <p className="text-xs text-slate-400">Share your join code so roomies can join instantly</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Group Name *</label>
            <input
              type="text"
              placeholder="e.g. Apartment 4B, Road Trip 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description</label>
            <input
              type="text"
              placeholder="e.g. Shared rent, groceries & internet split"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
            />
          </div>

          <div className="bg-indigo-500/10 p-4 rounded-xl border border-indigo-500/30 text-xs text-slate-300 flex items-center gap-2.5">
            <span className="material-symbols-outlined text-base text-indigo-400 shrink-0">key</span>
            <span>
              Once created, share the 6-character Join Code with your roommates so they can hop in!
            </span>
          </div>

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
              className="btn-gradient-primary text-white px-6 py-2.5 text-xs font-bold rounded-xl shadow-lg active:scale-95 transition-all"
            >
              Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

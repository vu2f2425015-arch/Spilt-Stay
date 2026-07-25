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
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface-container border border-outline-variant rounded-xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-lg py-md border-b border-outline-variant/40 flex justify-between items-center bg-surface-container-low shrink-0">
          <div className="flex items-center gap-md">
            <div className="w-9 h-9 rounded-lg bg-primary-container/20 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined">group_add</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-on-surface">Create New Group</h2>
              <p className="text-xs text-on-surface-variant">
                You'll get a join code to share afterward, so roomies can add themselves
              </p>
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
          <div className="space-y-xs">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Group Name *</label>
            <input
              type="text"
              placeholder="e.g. Apartment 4B, Hawaii Trip"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              className="w-full bg-surface-container-low border border-outline-variant/60 rounded-lg px-md py-2.5 text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none"
            />
          </div>

          <div className="space-y-xs">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Description</label>
            <input
              type="text"
              placeholder="e.g. Household rent & utilities split"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/60 rounded-lg px-md py-2.5 text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none"
            />
          </div>

          <div className="bg-surface-container-low p-sm rounded-lg border border-outline-variant/30 text-xs text-on-surface-variant flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-primary">key</span>
            <span>
              You'll be added as the owner. Once the group is created, share its join code with
              roommates so they can join themselves — no need to add anyone here.
            </span>
          </div>

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
              Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

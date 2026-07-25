import React, { useState } from 'react';

interface MemberInput {
  name: string;
  phone: string;
}

interface NewGroupModalProps {
  onClose: () => void;
  onCreateGroup: (name: string, description: string, members: MemberInput[]) => void;
  userName?: string;
}

export const NewGroupModal: React.FC<NewGroupModalProps> = ({
  onClose,
  onCreateGroup,
  userName = 'You'
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [members, setMembers] = useState<MemberInput[]>([
    { name: '', phone: '' }
  ]);

  const handleAddMemberRow = () => {
    setMembers([...members, { name: '', phone: '' }]);
  };

  const handleRemoveMemberRow = (index: number) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  const handleMemberChange = (index: number, field: keyof MemberInput, value: string) => {
    const updated = [...members];
    updated[index][field] = value;
    setMembers(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const validMembers = members.filter(m => m.name.trim().length > 0);
    onCreateGroup(name.trim(), description.trim(), validMembers);
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
              <p className="text-xs text-on-surface-variant">Add roomies by name and phone number for SMS alerts</p>
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

          {/* Members list with Phone Numbers */}
          <div className="space-y-sm">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Roommates / Members (Name & Phone)
              </label>
              <span className="text-[11px] text-primary">📱 Automatic SMS Alerts</span>
            </div>

            <div className="bg-surface-container-low p-sm rounded-lg border border-outline-variant/30 text-xs text-on-surface-variant mb-2">
              You ({userName}) are automatically added as the group owner. Add roomies below:
            </div>

            <div className="space-y-md">
              {members.map((member, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
                    <input
                      type="text"
                      placeholder={`Roommate ${idx + 1} Name`}
                      value={member.name}
                      onChange={(e) => handleMemberChange(idx, 'name', e.target.value)}
                      className="bg-surface-container border border-outline-variant/50 rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary focus:outline-none"
                    />
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-on-surface-variant text-base">
                        smartphone
                      </span>
                      <input
                        type="tel"
                        placeholder="Phone (e.g. +1 555 123 4567)"
                        value={member.phone}
                        onChange={(e) => handleMemberChange(idx, 'phone', e.target.value)}
                        className="w-full bg-surface-container border border-outline-variant/50 rounded-lg pl-8 pr-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>
                  {members.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMemberRow(idx)}
                      className="p-2 text-error hover:bg-error-container/20 rounded-lg transition-colors"
                      title="Remove member"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddMemberRow}
              className="mt-2 text-xs font-semibold text-primary flex items-center gap-1 hover:underline pt-1"
            >
              <span className="material-symbols-outlined text-sm">add_circle</span>
              Add Another Roommate
            </button>
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

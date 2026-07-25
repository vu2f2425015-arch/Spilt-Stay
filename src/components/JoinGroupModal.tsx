import React, { useState } from 'react';

interface JoinGroupModalProps {
  onClose: () => void;
  onJoinGroup: (code: string) => Promise<boolean>;
}

export const JoinGroupModal: React.FC<JoinGroupModalProps> = ({
  onClose,
  onJoinGroup
}) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return;

    setLoading(true);
    setErrorMsg(null);
    try {
      const success = await onJoinGroup(cleanCode);
      if (success) {
        onClose();
      } else {
        setErrorMsg(`Group not found for code '${cleanCode}'. Double check the code and try again.`);
      }
    } catch (err) {
      setErrorMsg('Failed to join group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface-container border border-outline-variant rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="px-lg py-md border-b border-outline-variant/40 flex justify-between items-center bg-surface-container-low">
          <div className="flex items-center gap-md">
            <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center border border-primary/30">
              <span className="material-symbols-outlined">key</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-on-surface">Join Group with Code</h2>
              <p className="text-xs text-on-surface-variant">Enter the 6-character invite code from your roommate</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-on-surface-variant hover:text-on-surface rounded-full hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-lg space-y-md">
          {errorMsg && (
            <div className="bg-error-container/30 border border-error text-error text-xs p-3 rounded-xl flex items-center gap-2">
              <span className="material-symbols-outlined text-sm shrink-0">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-xs">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Group Join Code *</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-3 text-primary text-xl">pin</span>
              <input
                type="text"
                placeholder="e.g. STAY4B or JOIN92"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                required
                maxLength={10}
                autoFocus
                className="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl pl-10 pr-md py-3 text-lg font-mono font-bold tracking-widest text-primary placeholder:text-on-surface-variant/30 uppercase focus:border-primary focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-on-surface-variant pt-1">
              💡 Ask your roommate for the Group Code shown on their group screen.
            </p>
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
              disabled={loading || !code.trim()}
              className="bg-primary-container text-on-primary-container px-xl py-md text-sm font-semibold rounded-xl shadow-lg shadow-primary-container/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                  <span>Joining...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">login</span>
                  <span>Join Group</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

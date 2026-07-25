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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="glass-panel border border-slate-700/80 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <span className="material-symbols-outlined text-xl">key</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Join Group with Code</h2>
              <p className="text-xs text-slate-400">Enter the 6-character code from your roommate</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-full hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs p-3.5 rounded-2xl flex items-center gap-2.5">
              <span className="material-symbols-outlined text-rose-400 text-base shrink-0">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Group Join Code *</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-3.5 text-indigo-400 text-xl">pin</span>
              <input
                type="text"
                placeholder="e.g. STAY4B or JOIN92"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                required
                maxLength={10}
                autoFocus
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-2xl pl-11 pr-4 py-3 text-xl font-mono font-extrabold tracking-widest text-indigo-300 placeholder-slate-600 uppercase focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
              />
            </div>
            <p className="text-[11px] text-slate-400 pt-1">
              💡 Ask your roommate for the Join Code displayed on their group header screen.
            </p>
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
              disabled={loading || !code.trim()}
              className="btn-gradient-primary text-white px-6 py-2.5 text-xs font-bold rounded-xl shadow-lg active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
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

import React, { useState } from 'react';
import { UserProfile } from '../types';

interface SettingsModalProps {
  profile: UserProfile;
  onClose: () => void;
  onSaveProfile: (updated: Partial<UserProfile>) => void;
  onResetWorkspace: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  profile,
  onClose,
  onSaveProfile,
  onResetWorkspace
}) => {
  const [currency, setCurrency] = useState(profile.currency || 'USD ($)');
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [emailDigest, setEmailDigest] = useState(false);

  const handleSave = () => {
    onSaveProfile({ currency });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="glass-panel border border-slate-700/80 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in-up max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <span className="material-symbols-outlined text-xl">settings</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Workspace Settings</h2>
              <p className="text-xs text-slate-400">Manage application preferences & data</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-full hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Default Currency */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Default Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
            >
              <option value="INR (₹)">INR (₹) - Indian Rupee</option>
              <option value="USD ($)">USD ($) - US Dollar</option>
              <option value="EUR (€)">EUR (€) - Euro</option>
              <option value="GBP (£)">GBP (£) - British Pound</option>
              <option value="CAD ($)">CAD ($) - Canadian Dollar</option>
            </select>
          </div>

          {/* Preferences */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Notification Preferences</label>
            
            <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-indigo-400">sms</span>
                <div>
                  <p className="text-xs font-bold text-slate-200">Default SMS Alerts</p>
                  <p className="text-[11px] text-slate-400">Enable SMS alert checkbox by default</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={smsAlerts}
                onChange={(e) => setSmsAlerts(e.target.checked)}
                className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
              />
            </div>

            <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-indigo-400">mail</span>
                <div>
                  <p className="text-xs font-bold text-slate-200">Weekly Summary Email</p>
                  <p className="text-[11px] text-slate-400">Receive email updates on balances</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={emailDigest}
                onChange={(e) => setEmailDigest(e.target.checked)}
                className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Data Reset Section */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <label className="text-xs font-bold text-rose-400 uppercase tracking-wider">Danger Zone</label>
            <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-2xl space-y-3">
              <div>
                <p className="text-xs font-bold text-slate-100">Reset Local Cache</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Clear stored local offline cache & temporary logs.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Are you sure you want to clear all local cache data?')) {
                    onResetWorkspace();
                    onClose();
                  }
                }}
                className="bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-rose-300 text-xs font-bold px-4 py-2 rounded-xl transition-all"
              >
                Reset Local Cache
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex justify-end shrink-0">
          <button
            onClick={handleSave}
            className="btn-gradient-primary text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};

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
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface-container border border-outline-variant rounded-xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="px-lg py-md border-b border-outline-variant/40 flex justify-between items-center bg-surface-container-low shrink-0">
          <div className="flex items-center gap-md">
            <div className="w-9 h-9 rounded-lg bg-primary-container/20 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined">settings</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-on-surface">Workspace Settings</h2>
              <p className="text-xs text-on-surface-variant">Manage application preferences & data</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-on-surface-variant hover:text-on-surface rounded-full hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Form Content */}
        <div className="p-lg overflow-y-auto space-y-lg flex-1">
          {/* Default Currency */}
          <div className="space-y-xs">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Default Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/60 rounded-lg px-md py-2.5 text-on-surface focus:border-primary focus:outline-none"
            >
              <option value="USD ($)">USD ($) - US Dollar</option>
              <option value="EUR (€)">EUR (€) - Euro</option>
              <option value="GBP (£)">GBP (£) - British Pound</option>
              <option value="INR (₹)">INR (₹) - Indian Rupee</option>
              <option value="CAD ($)">CAD ($) - Canadian Dollar</option>
            </select>
          </div>

          {/* Preferences */}
          <div className="space-y-sm">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Notification Preferences</label>
            
            <div className="bg-surface-container-low p-md rounded-lg border border-outline-variant/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">sms</span>
                <div>
                  <p className="text-xs font-bold text-on-surface">Default SMS Notifications</p>
                  <p className="text-[11px] text-on-surface-variant">Enable SMS alert checkbox by default</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={smsAlerts}
                onChange={(e) => setSmsAlerts(e.target.checked)}
                className="w-4 h-4 accent-primary rounded cursor-pointer"
              />
            </div>

            <div className="bg-surface-container-low p-md rounded-lg border border-outline-variant/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">mail</span>
                <div>
                  <p className="text-xs font-bold text-on-surface">Weekly Expense Summary</p>
                  <p className="text-[11px] text-on-surface-variant">Receive email updates on balances</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={emailDigest}
                onChange={(e) => setEmailDigest(e.target.checked)}
                className="w-4 h-4 accent-primary rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Data Reset Section */}
          <div className="pt-md border-t border-outline-variant/40 space-y-sm">
            <label className="text-xs font-semibold text-error uppercase tracking-wider">Danger Zone</label>
            <div className="bg-error-container/10 border border-error-container/30 p-md rounded-xl space-y-md">
              <div>
                <p className="text-xs font-bold text-on-surface">Reset Local Workspace</p>
                <p className="text-[11px] text-on-surface-variant mt-0.5">
                  Clear all stored local groups, expenses, settlements, and SMS logs.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Are you sure you want to clear all local data?')) {
                    onResetWorkspace();
                    onClose();
                  }
                }}
                className="bg-error-container/30 hover:bg-error-container/50 border border-error text-error text-xs font-bold px-4 py-2 rounded-lg transition-colors"
              >
                Reset All Local Data
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-lg py-md border-t border-outline-variant/40 bg-surface-container-low flex justify-end shrink-0">
          <button
            onClick={handleSave}
            className="bg-primary-container text-on-primary-container px-lg py-sm rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};

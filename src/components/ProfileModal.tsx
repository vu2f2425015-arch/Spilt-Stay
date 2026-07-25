import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { UserProfile } from '../types';

interface ProfileModalProps {
  profile: UserProfile;
  onClose: () => void;
  onSaveProfile: (updated: Partial<UserProfile>) => void;
  // Onboarding mode: shown right after sign-in when a required detail
  // (currently phone number, needed for SMS/WhatsApp alerts) is missing.
  // Hides the Cancel/close controls and requires phone before saving.
  required?: boolean;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  profile,
  onClose,
  onSaveProfile,
  required = false
}) => {
  const { user } = useUser();
  const clerkEmail = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || '';
  const clerkFullName = user?.fullName || '';

  const [fullName, setFullName] = useState(profile.full_name || clerkFullName || 'Alex Morgan');
  const [email, setEmail] = useState(clerkEmail || profile.email || 'alex@example.com');

  useEffect(() => {
    if (clerkEmail && (!profile.email || profile.email === 'alex@example.com')) {
      setEmail(clerkEmail);
    }
    if (clerkFullName && (!profile.full_name || profile.full_name === 'Alex Morgan')) {
      setFullName(clerkFullName);
    }
  }, [clerkEmail, clerkFullName]);

  const [phone, setPhone] = useState(profile.phone_number || '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || user?.imageUrl || '');
  const [venmo, setVenmo] = useState(profile.venmo_handle || '');
  const [cashApp, setCashApp] = useState(profile.cash_app_handle || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [currency, setCurrency] = useState(profile.currency || 'USD ($)');
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  const sampleAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile({
      full_name: fullName.trim(),
      email: email.trim(),
      phone_number: phone.trim(),
      avatar_url: avatarUrl.trim(),
      venmo_handle: venmo.trim(),
      cash_app_handle: cashApp.trim(),
      bio: bio.trim(),
      currency
    });
    setIsSavedNotice(true);
    setTimeout(() => {
      setIsSavedNotice(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <div className="bg-surface-container border border-outline-variant rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-lg py-md border-b border-outline-variant/40 flex justify-between items-center bg-surface-container-low shrink-0">
          <div className="flex items-center gap-md">
            <div className="w-10 h-10 rounded-full border-2 border-primary overflow-hidden shrink-0">
              <img src={avatarUrl || sampleAvatars[0]} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-on-surface">
                {required ? 'Complete Your Profile' : 'Your Account Profile'}
              </h2>
              <p className="text-xs text-on-surface-variant">
                {required
                  ? 'We need a phone number to send you SMS/WhatsApp expense alerts before you continue.'
                  : 'Update contact info & payment tags for roomies'}
              </p>
            </div>
          </div>
          {!required && (
            <button
              onClick={onClose}
              className="p-1.5 text-on-surface-variant hover:text-on-surface rounded-full hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          )}
        </div>

        {/* Saved Toast Banner */}
        {isSavedNotice && (
          <div className="bg-emerald-950 border-b border-emerald-500/50 text-emerald-300 px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 animate-in fade-in">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            <span>Profile details updated & synced across all your groups!</span>
          </div>
        )}

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="p-lg overflow-y-auto space-y-lg flex-1">
          {/* Avatar Selector */}
          <div className="space-y-xs">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Choose Profile Avatar</label>
            <div className="flex items-center gap-3">
              {sampleAvatars.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAvatarUrl(url)}
                  className={`w-11 h-11 rounded-full border-2 overflow-hidden transition-all ${
                    avatarUrl === url ? 'border-primary scale-110 shadow-lg shadow-primary/30' : 'border-outline-variant/50 hover:border-on-surface-variant'
                  }`}
                >
                  <img src={url} alt={`Avatar ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Full Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
            <div className="space-y-xs">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Full Name *</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full bg-surface-container-low border border-outline-variant/60 rounded-lg px-md py-2.5 text-on-surface focus:border-primary focus:outline-none"
              />
            </div>
            <div className="space-y-xs">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider flex items-center justify-between">
                <span>Email Address</span>
                {clerkEmail && <span className="text-[10px] text-primary">✓ Clerk Verified</span>}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                readOnly={Boolean(clerkEmail)}
                className={`w-full bg-surface-container-low border border-outline-variant/60 rounded-lg px-md py-2.5 text-on-surface focus:border-primary focus:outline-none ${clerkEmail ? 'opacity-80 cursor-not-allowed' : ''}`}
              />
            </div>
          </div>

          {/* Phone Number & Preferred Currency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
            <div className="space-y-xs">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Phone Number (SMS Alerts)
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-primary text-base">phone</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-surface-container-low border border-outline-variant/60 rounded-lg pl-8 pr-md py-2.5 text-on-surface focus:border-primary focus:outline-none"
                />
              </div>
              {required && (
                <p className="text-[11px] text-on-surface-variant pt-1">
                  Roommates get SMS/WhatsApp alerts at this number when expenses are added or settled.
                </p>
              )}
            </div>
            <div className="space-y-xs">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Preferred Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/60 rounded-lg px-md py-2.5 text-on-surface focus:border-primary focus:outline-none"
              >
                <option value="USD ($)">USD ($)</option>
                <option value="EUR (€)">EUR (€)</option>
                <option value="GBP (£)">GBP (£)</option>
                <option value="INR (₹)">INR (₹)</option>
                <option value="CAD ($)">CAD ($)</option>
              </select>
            </div>
          </div>

          {/* Payment Tags */}
          <div className="space-y-xs">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Payment Handles (Optional)</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-emerald-400 text-base">send</span>
                <input
                  type="text"
                  placeholder="Venmo e.g. @username"
                  value={venmo}
                  onChange={(e) => setVenmo(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/60 rounded-lg pl-8 pr-md py-2 text-sm text-on-surface focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-emerald-400 text-base">attach_money</span>
                <input
                  type="text"
                  placeholder="Cash App e.g. $cashtag"
                  value={cashApp}
                  onChange={(e) => setCashApp(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/60 rounded-lg pl-8 pr-md py-2 text-sm text-on-surface focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Bio / Roommate Note */}
          <div className="space-y-xs">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Bio / Household Note</label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g. Room 2 occupant • I usually manage rent payments."
              className="w-full bg-surface-container-low border border-outline-variant/60 rounded-lg p-md text-sm text-on-surface focus:border-primary focus:outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-md pt-md border-t border-outline-variant/40">
            {!required ? (
              <button
                type="button"
                onClick={onClose}
                className="px-lg py-md text-sm font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-xl transition-colors"
              >
                Cancel
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onSaveProfile({
                    full_name: fullName.trim(),
                    email: email.trim(),
                    phone_number: phone.trim(),
                    avatar_url: avatarUrl.trim(),
                    venmo_handle: venmo.trim(),
                    cash_app_handle: cashApp.trim(),
                    bio: bio.trim(),
                    currency,
                    is_onboarded: true
                  });
                  onClose();
                }}
                className="px-lg py-md text-sm font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-xl transition-colors"
              >
                Skip for Now
              </button>
            )}
            <button
              type="submit"
              className="bg-primary-container text-on-primary-container px-xl py-md text-sm font-semibold rounded-xl shadow-lg shadow-primary-container/20 active:scale-95 transition-all"
            >
              {required ? 'Save & Continue' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

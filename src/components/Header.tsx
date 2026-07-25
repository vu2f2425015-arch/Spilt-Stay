import React from 'react';
import { SignedIn, SignedOut, UserButton, SignInButton, useUser } from '@clerk/clerk-react';
import { Group } from '../types';

interface HeaderProps {
  groups: Group[];
  selectedGroup: Group | null;
  onSelectGroup: (group: Group | null) => void;
  onOpenNewGroup: () => void;
  onOpenJoinGroup?: () => void;
  onOpenNotifications: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  userProfile?: { full_name: string; avatar_url?: string };
  isClerkConfigured: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  groups,
  selectedGroup,
  onSelectGroup,
  onOpenNewGroup,
  onOpenJoinGroup,
  onOpenNotifications,
  onOpenSettings,
  onOpenProfile,
  userProfile,
  isClerkConfigured
}) => {
  const { user } = useUser();

  const displayName = userProfile?.full_name || (user ? user.fullName : null) || 'Alex Morgan';
  const avatarUrl = userProfile?.avatar_url || undefined;

  return (
    <header className="sticky top-0 z-40 bg-[#0b0f19]/80 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/20">
      <div className="flex justify-between items-center w-full px-4 md:px-xl py-3.5 max-w-container-max mx-auto">
        <div className="flex items-center gap-3 md:gap-xl">
          {/* Brand Logo */}
          <button 
            onClick={() => onSelectGroup(null)}
            className="flex items-center gap-2.5 text-left group shrink-0"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-white text-2xl">pie_chart</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl md:text-2xl font-extrabold tracking-tight gradient-text-indigo leading-none">SplitStay</span>
              <span className="text-[10px] tracking-wider font-semibold text-indigo-300 uppercase opacity-80">Shared Living</span>
            </div>
          </button>

          {/* Group Switcher & Join Button */}
          <div className="flex items-center gap-2.5">
            <div className="relative group">
              <button className="flex items-center gap-2 bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700/60 px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-semibold text-slate-200 transition-all shadow-sm group-hover:border-indigo-500/50">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                <span className="truncate max-w-[100px] sm:max-w-[150px] md:max-w-none">
                  {selectedGroup ? selectedGroup.name : 'All Groups'}
                </span>
                <span className="material-symbols-outlined text-slate-400 text-sm group-hover:text-indigo-400 transition-colors">expand_more</span>
              </button>

              <div className="absolute left-0 top-full mt-2 w-64 glass-panel border border-slate-700/60 rounded-2xl shadow-2xl py-2.5 hidden group-hover:block z-50 animate-fade-in-up">
                <div className="px-3.5 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Your Workspaces
                </div>
                <button
                  onClick={() => onSelectGroup(null)}
                  className={`w-full text-left px-4 py-2.5 text-xs md:text-sm flex items-center gap-2.5 hover:bg-slate-800/80 transition-colors ${!selectedGroup ? 'text-indigo-400 font-semibold bg-indigo-500/10 border-l-2 border-indigo-500' : 'text-slate-300'}`}
                >
                  <span className="material-symbols-outlined text-lg text-indigo-400">dashboard</span>
                  <span>Dashboard (All Groups)</span>
                </button>
                <div className="my-1.5 border-t border-slate-800" />
                {groups.map(g => (
                  <button
                    key={g.id}
                    onClick={() => onSelectGroup(g)}
                    className={`w-full text-left px-4 py-2 text-xs md:text-sm flex items-center justify-between hover:bg-slate-800/80 transition-colors ${selectedGroup?.id === g.id ? 'text-indigo-400 font-semibold bg-indigo-500/10 border-l-2 border-indigo-500' : 'text-slate-300'}`}
                  >
                    <span className="truncate">{g.name}</span>
                    {g.user_balance !== 0 && (
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ml-2 ${g.user_balance > 0 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'}`}>
                        {g.user_balance > 0 ? `+${g.user_balance.toFixed(0)}` : `-${Math.abs(g.user_balance).toFixed(0)}`}
                      </span>
                    )}
                  </button>
                ))}
                <div className="my-1.5 border-t border-slate-800" />
                {onOpenJoinGroup && (
                  <button
                    onClick={onOpenJoinGroup}
                    className="w-full text-left px-4 py-2 text-xs md:text-sm text-indigo-400 flex items-center gap-2 hover:bg-slate-800/80 transition-colors font-medium"
                  >
                    <span className="material-symbols-outlined text-base">key</span>
                    <span>Join Group with Code</span>
                  </button>
                )}
                <button
                  onClick={onOpenNewGroup}
                  className="w-full text-left px-4 py-2 text-xs md:text-sm text-indigo-400 flex items-center gap-2 hover:bg-slate-800/80 transition-colors font-medium"
                >
                  <span className="material-symbols-outlined text-base">add_circle</span>
                  <span>Create New Group</span>
                </button>
              </div>
            </div>

            {onOpenJoinGroup && (
              <button
                onClick={onOpenJoinGroup}
                className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-500/15 to-purple-500/15 border border-indigo-500/30 hover:border-indigo-500/60 text-indigo-300 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm hover:shadow-indigo-500/20 active:scale-95 shrink-0"
                title="Join a roommate group using a 6-character code"
              >
                <span className="material-symbols-outlined text-sm text-indigo-400">key</span>
                <span className="hidden sm:inline">Join Code</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Section: Notifications, Settings & Clerk Profile */}
        <div className="flex items-center gap-2.5">
          <button 
            onClick={onOpenNotifications}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-all rounded-xl relative border border-transparent hover:border-slate-700/60"
            title="Notifications & SMS Alerts"
          >
            <span className="material-symbols-outlined text-xl">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full" />
          </button>
          
          <button 
            onClick={onOpenSettings}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-all rounded-xl border border-transparent hover:border-slate-700/60"
            title="Workspace Settings"
          >
            <span className="material-symbols-outlined text-xl">settings</span>
          </button>

          {/* Clerk Auth Button */}
          {isClerkConfigured && (
            <>
              <SignedIn>
                <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "w-8 h-8 rounded-xl border-2 border-indigo-500/50 hover:scale-105 transition-transform" } }} />
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="btn-gradient-primary text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-lg transition-all flex items-center gap-1.5 active:scale-95">
                    <span className="material-symbols-outlined text-sm">login</span>
                    <span>Sign In</span>
                  </button>
                </SignInButton>
              </SignedOut>
            </>
          )}

          {/* User Profile Pill */}
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-2.5 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/60 hover:border-indigo-500/40 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer group shadow-sm"
            title="Edit Profile Details"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-7 h-7 rounded-lg object-cover border border-indigo-500/60" />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/50 text-indigo-300 flex items-center justify-center font-bold text-xs">
                {displayName[0] || 'A'}
              </div>
            )}
            <span className="text-xs text-slate-200 group-hover:text-indigo-300 font-semibold hidden sm:inline">
              {displayName}
            </span>
            <span className="material-symbols-outlined text-xs text-slate-400 group-hover:text-indigo-400">edit</span>
          </button>
        </div>
      </div>
    </header>
  );
};

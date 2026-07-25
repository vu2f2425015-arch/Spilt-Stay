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
    <header className="bg-surface-dim border-b border-outline-variant/30 sticky top-0 z-40">
      <div className="flex justify-between items-center w-full px-4 md:px-xl py-md max-w-container-max mx-auto">
        <div className="flex items-center gap-2 md:gap-xl">
          {/* Logo / Brand */}
          <button 
            onClick={() => onSelectGroup(null)}
            className="flex items-center gap-1.5 md:gap-2 text-left text-headline-md font-bold text-primary hover:opacity-90 transition-opacity shrink-0"
          >
            <span className="material-symbols-outlined text-primary text-2xl md:text-3xl">pie_chart</span>
            <span className="text-lg md:text-2xl font-bold tracking-tight text-primary">SplitStay</span>
          </button>

          {/* Group Switcher & Join Button */}
          <div className="flex items-center gap-2 md:gap-3">
            <div className="relative group">
              <button className="flex items-center gap-xs bg-surface-container-low border border-outline-variant/40 px-2.5 md:px-md py-1.5 md:py-sm rounded-lg hover:bg-surface-container-highest transition-colors">
                <span className="text-xs md:text-label-md font-medium text-on-surface truncate max-w-[90px] sm:max-w-[140px] md:max-w-none">
                  {selectedGroup ? selectedGroup.name : 'All Groups'}
                </span>
                <span className="material-symbols-outlined text-on-surface-variant text-sm">expand_more</span>
              </button>

              <div className="absolute left-0 top-full mt-1 w-56 bg-surface-container border border-outline-variant rounded-xl shadow-xl py-2 hidden group-hover:block z-50">
                <button
                  onClick={() => onSelectGroup(null)}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-surface-container-high transition-colors ${!selectedGroup ? 'text-primary font-semibold' : 'text-on-surface'}`}
                >
                  <span className="material-symbols-outlined text-base">dashboard</span>
                  Dashboard (All Groups)
                </button>
                <div className="my-1 border-t border-outline-variant/50" />
                {groups.map(g => (
                  <button
                    key={g.id}
                    onClick={() => onSelectGroup(g)}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-surface-container-high transition-colors ${selectedGroup?.id === g.id ? 'text-primary font-semibold' : 'text-on-surface-variant'}`}
                  >
                    <span className="truncate">{g.name}</span>
                    {g.user_balance !== 0 && (
                      <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ml-2 ${g.user_balance > 0 ? 'bg-emerald-950 text-emerald-300' : 'bg-error-container/40 text-error'}`}>
                        {g.user_balance > 0 ? `+$${g.user_balance.toFixed(0)}` : `-$${Math.abs(g.user_balance).toFixed(0)}`}
                      </span>
                    )}
                  </button>
                ))}
                <div className="my-1 border-t border-outline-variant/50" />
                {onOpenJoinGroup && (
                  <button
                    onClick={onOpenJoinGroup}
                    className="w-full text-left px-4 py-2 text-sm text-primary flex items-center gap-2 hover:bg-surface-container-high transition-colors font-medium"
                  >
                    <span className="material-symbols-outlined text-base">key</span>
                    Join Group with Code
                  </button>
                )}
                <button
                  onClick={onOpenNewGroup}
                  className="w-full text-left px-4 py-2 text-sm text-primary flex items-center gap-2 hover:bg-surface-container-high transition-colors font-medium"
                >
                  <span className="material-symbols-outlined text-base">add_circle</span>
                  Create New Group
                </button>
              </div>
            </div>

            {onOpenJoinGroup && (
              <button
                onClick={onOpenJoinGroup}
                className="flex items-center gap-1.5 bg-primary/10 border border-primary/40 hover:bg-primary/20 text-primary px-2.5 md:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-sm hover:shadow active:scale-95 shrink-0"
                title="Join a roommate group using a 6-character code"
              >
                <span className="material-symbols-outlined text-sm">key</span>
                <span className="hidden sm:inline">Join Group</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Section: Notifications & Clerk User Profile */}
        <div className="flex items-center gap-md">
          <button 
            onClick={onOpenNotifications}
            className="p-2 text-on-surface-variant hover:bg-surface-container-low transition-colors rounded-full relative"
            title="Notifications & SMS Log"
          >
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
          </button>
          
          <button 
            onClick={onOpenSettings}
            className="p-2 text-on-surface-variant hover:bg-surface-container-low transition-colors rounded-full"
            title="Settings & Workspace Preferences"
          >
            <span className="material-symbols-outlined">settings</span>
          </button>

          {/* Clerk Auth / Profile Button */}
          {isClerkConfigured && (
            <>
              <SignedIn>
                <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "w-8 h-8 border border-primary hover:scale-105 transition-transform" } }} />
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="bg-primary hover:bg-primary-hover text-on-primary font-semibold text-xs px-3.5 py-1.5 rounded-full shadow transition-all flex items-center gap-1.5 active:scale-95">
                    <span className="material-symbols-outlined text-sm">login</span>
                    Sign In
                  </button>
                </SignInButton>
              </SignedOut>
            </>
          )}

          <button
            onClick={onOpenProfile}
            className="flex items-center gap-2 bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/50 px-3 py-1.5 rounded-full transition-colors cursor-pointer group"
            title="Edit Profile Details"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-8 h-8 rounded-full object-cover border border-primary" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary text-primary flex items-center justify-center font-bold text-xs">
                {displayName[0] || 'A'}
              </div>
            )}
            <span className="text-xs text-on-surface group-hover:text-primary font-semibold hidden sm:inline">
              {displayName}
            </span>
            <span className="material-symbols-outlined text-xs text-on-surface-variant group-hover:text-primary">edit</span>
          </button>
        </div>
      </div>
    </header>
  );
};

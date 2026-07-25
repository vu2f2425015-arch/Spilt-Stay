import React from 'react';
import { Group } from '../types';
import { formatCurrency } from '../utils/currency';

interface DashboardProps {
  groups: Group[];
  onSelectGroup: (group: Group) => void;
  onOpenNewGroup: () => void;
  onOpenJoinGroup?: () => void;
  onOpenAddExpense: () => void;
  onDeleteGroup: (groupId: string) => void;
  onLeaveGroup?: (groupId: string) => void;
  currencySetting?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({
  groups,
  onSelectGroup,
  onOpenNewGroup,
  onOpenJoinGroup,
  onOpenAddExpense,
  onDeleteGroup,
  onLeaveGroup,
  currencySetting
}) => {
  const totalOwedToYou = groups
    .filter(g => (Number(g.user_balance) || 0) > 0)
    .reduce((sum, g) => sum + (Number(g.user_balance) || 0), 0);

  const totalYouOwe = groups
    .filter(g => (Number(g.user_balance) || 0) < 0)
    .reduce((sum, g) => sum + Math.abs(Number(g.user_balance) || 0), 0);

  const netTotal = totalOwedToYou - totalYouOwe;

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Welcome Header */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        <div className="md:col-span-6 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <span>Workspace Overview</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-100 tracking-tight">Your Expense Groups</h1>
          <p className="text-sm text-slate-400">
            {groups.length === 0
              ? 'Start tracking shared expenses with roommates & friends seamlessly.'
              : `Managing split expenses across ${groups.length} active ${groups.length === 1 ? 'circle' : 'circles'}.`}
          </p>
        </div>
        <div className="md:col-span-6 flex flex-col sm:flex-row gap-3 justify-end flex-wrap">
          {onOpenJoinGroup && (
            <button
              onClick={onOpenJoinGroup}
              className="w-full sm:w-auto bg-slate-900/90 border border-indigo-500/30 hover:border-indigo-500/60 text-indigo-300 px-5 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 text-xs md:text-sm shadow-lg shadow-indigo-500/5 hover:shadow-indigo-500/20"
              title="Join a roommate's group using a 6-character code"
            >
              <span className="material-symbols-outlined text-indigo-400 text-lg">key</span>
              <span>Join with Code</span>
            </button>
          )}
          {groups.length > 0 && (
            <button
              onClick={onOpenAddExpense}
              className="w-full sm:w-auto bg-slate-900/90 border border-slate-700/80 hover:border-indigo-500/50 text-slate-200 px-5 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 text-xs md:text-sm shadow-sm"
            >
              <span className="material-symbols-outlined text-indigo-400 text-lg">add_card</span>
              <span>Add Expense</span>
            </button>
          )}
          <button
            onClick={onOpenNewGroup}
            className="w-full sm:w-auto btn-gradient-primary text-white px-6 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-95 transition-all text-xs md:text-sm"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            <span>New Group</span>
          </button>
        </div>
      </section>

      {/* High Level Balance Summary Banner (If groups exist) */}
      {groups.length > 0 ? (
        <div className="relative overflow-hidden rounded-2xl p-6 glass-panel border border-slate-700/60 shadow-2xl bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-emerald-950/30">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative z-10">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                <span className="text-xs uppercase tracking-wider font-bold text-slate-400">Total Net Balance</span>
              </div>
              <p className={`text-2xl md:text-3xl font-extrabold truncate ${netTotal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {netTotal >= 0 ? `+${formatCurrency(netTotal, currencySetting)}` : formatCurrency(netTotal, currencySetting)}
              </p>
            </div>

            <div className="space-y-1.5 border-t sm:border-t-0 sm:border-l border-slate-800 pt-4 sm:pt-0 sm:pl-6 min-w-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-xs uppercase tracking-wider font-bold text-slate-400">You Are Owed</span>
              </div>
              <p className="text-2xl md:text-3xl font-extrabold text-emerald-400 truncate">
                +{formatCurrency(totalOwedToYou, currencySetting)}
              </p>
            </div>

            <div className="space-y-1.5 border-t sm:border-t-0 sm:border-l border-slate-800 pt-4 sm:pt-0 sm:pl-6 min-w-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span className="text-xs uppercase tracking-wider font-bold text-slate-400">You Owe</span>
              </div>
              <p className="text-2xl md:text-3xl font-extrabold text-rose-400 truncate">
                -{formatCurrency(totalYouOwe, currencySetting)}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Grid or Empty State */}
      {groups.length === 0 ? (
        <div className="glass-panel border border-slate-800 border-dashed rounded-3xl p-12 text-center space-y-6 max-w-xl mx-auto my-8">
          <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 mx-auto flex items-center justify-center animate-float">
            <span className="material-symbols-outlined text-4xl">group_add</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-100">No Groups Found</h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              You don't have any active expense groups. Create a group for your apartment, trip, or household to start splitting bills.
            </p>
          </div>
          <button
            onClick={onOpenNewGroup}
            className="btn-gradient-primary text-white px-8 py-3.5 rounded-xl font-semibold inline-flex items-center gap-2.5 shadow-xl shadow-indigo-500/20 active:scale-95 transition-all text-sm"
          >
            <span className="material-symbols-outlined">add</span>
            <span>Create Your First Group</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => {
            const isOwed = group.user_balance > 0;
            const owes = group.user_balance < 0;
            const isSettled = group.user_balance === 0;

            return (
              <div
                key={group.id}
                onClick={() => onSelectGroup(group)}
                className="glass-card rounded-2xl p-6 space-y-6 cursor-pointer group relative overflow-hidden flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-slate-100 group-hover:text-indigo-400 transition-colors">
                          {group.name}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-1">
                        {group.description || `Last activity ${group.last_activity}`}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {onLeaveGroup && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const confirmLeave = window.confirm(`Are you sure you want to leave '${group.name}'? You can re-join later using code '${group.join_code}'.`);
                            if (confirmLeave) onLeaveGroup(group.id);
                          }}
                          className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors z-10"
                          title="Leave Group"
                        >
                          <span className="material-symbols-outlined text-sm">logout</span>
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteGroup(group.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors z-10"
                        title="Delete Group"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                      <span className="material-symbols-outlined text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all">
                        chevron_right
                      </span>
                    </div>
                  </div>

                  {/* Join Code Pill */}
                  <div className="flex items-center gap-2">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-700/60 text-[11px] font-mono text-indigo-300 font-semibold">
                      <span className="material-symbols-outlined text-xs text-indigo-400">key</span>
                      <span>{group.join_code}</span>
                    </div>
                  </div>

                  {/* Roommate Avatars */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex avatar-group">
                      {group.members.slice(0, 3).map((member) => (
                        <div
                          key={member.id}
                          className="w-8 h-8 rounded-lg border-2 border-slate-900 overflow-hidden bg-slate-800 shadow"
                          title={member.full_name}
                        >
                          <img
                            src={member.avatar_url}
                            alt={member.full_name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                      {group.members.length > 3 && (
                        <div className="w-8 h-8 rounded-lg border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-300 shadow">
                          +{group.members.length - 3}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 font-medium">
                      {group.members.length} {group.members.length === 1 ? 'roommate' : 'roommates'}
                    </span>
                  </div>
                </div>

                {/* Balance Badge Container */}
                <div className="pt-4 border-t border-slate-800">
                  {owes && (
                    <div className="bg-rose-500/10 border border-rose-500/20 px-3.5 py-2.5 rounded-xl flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-rose-400 text-lg">account_balance_wallet</span>
                      <span className="text-xs md:text-sm font-bold text-rose-300">
                        You owe {formatCurrency(Math.abs(group.user_balance), currencySetting)}
                      </span>
                    </div>
                  )}
                  {isOwed && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2.5 rounded-xl flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-emerald-400 text-lg">payments</span>
                      <span className="text-xs md:text-sm font-bold text-emerald-300">
                        You are owed {formatCurrency(group.user_balance, currencySetting)}
                      </span>
                    </div>
                  )}
                  {isSettled && (
                    <div className="bg-slate-800/50 border border-slate-700/50 px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 text-slate-400">
                      <span className="material-symbols-outlined text-emerald-400 text-lg">check_circle</span>
                      <span className="text-xs md:text-sm font-medium text-slate-300">All settled up</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

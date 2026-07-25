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
  currencySetting?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({
  groups,
  onSelectGroup,
  onOpenNewGroup,
  onOpenJoinGroup,
  onOpenAddExpense,
  onDeleteGroup,
  currencySetting
}) => {
  const totalOwedToYou = groups
    .filter(g => g.user_balance > 0)
    .reduce((sum, g) => sum + g.user_balance, 0);

  const totalYouOwe = groups
    .filter(g => g.user_balance < 0)
    .reduce((sum, g) => sum + Math.abs(g.user_balance), 0);

  const netTotal = totalOwedToYou - totalYouOwe;

  return (
    <div className="space-y-xl">
      {/* Welcome Header */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-lg items-end">
        <div className="md:col-span-6 space-y-xs">
          <h1 className="text-headline-lg font-bold text-on-background">Your Groups</h1>
          <p className="text-body-md text-on-surface-variant">
            {groups.length === 0
              ? 'Start tracking shared expenses with roommates & friends.'
              : `Managing split expenses across ${groups.length} active ${groups.length === 1 ? 'circle' : 'circles'}.`}
          </p>
        </div>
        <div className="md:col-span-6 flex flex-col sm:flex-row gap-2.5 justify-end flex-wrap">
          {onOpenJoinGroup && (
            <button
              onClick={onOpenJoinGroup}
              className="w-full sm:w-auto bg-surface-container-high border border-outline-variant hover:border-primary text-primary px-lg py-md rounded-xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 text-sm"
              title="Join a roommate's group using a 6-character code"
            >
              <span className="material-symbols-outlined text-primary">key</span>
              <span>Join with Code</span>
            </button>
          )}
          {groups.length > 0 && (
            <button
              onClick={onOpenAddExpense}
              className="w-full sm:w-auto bg-surface-container-high border border-outline-variant hover:border-primary text-on-surface px-lg py-md rounded-xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 text-sm"
            >
              <span className="material-symbols-outlined text-primary">add_card</span>
              Add Expense
            </button>
          )}
          <button
            onClick={onOpenNewGroup}
            className="w-full sm:w-auto bg-primary-container text-on-primary-container px-xl py-md rounded-xl font-semibold flex items-center justify-center gap-md active:scale-95 transition-transform shadow-lg shadow-primary-container/15 text-sm"
          >
            <span className="material-symbols-outlined">add</span>
            New Group
          </button>
        </div>
      </section>

      {/* High Level Balance Summary Banner (If groups exist) */}
      {groups.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-md bg-surface-container-low border border-outline-variant/50 rounded-xl p-lg">
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant">Total Net Balance</span>
            <p className={`text-2xl font-bold ${netTotal >= 0 ? 'text-emerald-400' : 'text-error'}`}>
              {netTotal >= 0 ? `+${formatCurrency(netTotal, currencySetting)}` : formatCurrency(netTotal, currencySetting)}
            </p>
          </div>
          <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-outline-variant/30 pt-3 sm:pt-0 sm:pl-lg">
            <span className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant">You are owed</span>
            <p className="text-2xl font-bold text-emerald-400">
              +{formatCurrency(totalOwedToYou, currencySetting)}
            </p>
          </div>
          <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-outline-variant/30 pt-3 sm:pt-0 sm:pl-lg">
            <span className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant">You owe</span>
            <p className="text-2xl font-bold text-error">
              -{formatCurrency(totalYouOwe, currencySetting)}
            </p>
          </div>
        </div>
      ) : null}

      {/* Bento Grid or Clean Empty State */}
      {groups.length === 0 ? (
        <div className="bg-surface-container-low border border-outline-variant/50 border-dashed rounded-2xl p-12 text-center space-y-6 max-w-xl mx-auto my-8">
          <div className="w-16 h-16 rounded-2xl bg-primary-container/20 border border-primary-container/40 text-primary mx-auto flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl">group_add</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-on-surface">No Groups Found</h2>
            <p className="text-sm text-on-surface-variant max-w-md mx-auto">
              You don't have any expense groups yet. Create a group for your apartment, road trip, or household to start splitting bills.
            </p>
          </div>
          <button
            onClick={onOpenNewGroup}
            className="bg-primary-container text-on-primary-container px-6 py-3 rounded-xl font-semibold inline-flex items-center gap-2 shadow-lg shadow-primary-container/20 hover:opacity-90 transition-all text-sm"
          >
            <span className="material-symbols-outlined">add</span>
            Create Your First Group
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
          {groups.map((group) => {
            const isOwed = group.user_balance > 0;
            const owes = group.user_balance < 0;
            const isSettled = group.user_balance === 0;

            return (
              <div
                key={group.id}
                onClick={() => onSelectGroup(group)}
                className="bg-surface-container-low border border-outline-variant rounded-xl p-lg space-y-lg cursor-pointer card-glow transition-all duration-200 hover:-translate-y-1 group relative overflow-hidden"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="text-headline-md font-bold text-on-surface group-hover:text-primary transition-colors">
                      {group.name}
                    </h3>
                    <p className="text-xs text-on-surface-variant">
                      {group.description || `Last activity ${group.last_activity}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteGroup(group.id);
                      }}
                      className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded-lg transition-colors z-10"
                      title="Delete Group"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                    <span className="material-symbols-outlined text-on-surface-variant group-hover:text-on-surface transition-colors">
                      chevron_right
                    </span>
                  </div>
                </div>

                {/* Roommate Avatars */}
                <div className="flex items-center justify-between">
                  <div className="flex avatar-group">
                    {group.members.slice(0, 3).map((member) => (
                      <div
                        key={member.id}
                        className="w-8 h-8 rounded-full border-2 border-surface-container-low overflow-hidden bg-secondary-container"
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
                      <div className="w-8 h-8 rounded-full border-2 border-surface-container-low bg-secondary-container flex items-center justify-center text-[10px] font-bold text-on-secondary-container">
                        +{group.members.length - 3}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-on-surface-variant">
                    {group.members.length} {group.members.length === 1 ? 'member' : 'members'}
                  </span>
                </div>

                {/* Balance Badge Container */}
                <div className="pt-md border-t border-outline-variant">
                  {owes && (
                    <div className="bg-error-container/20 border border-error-container/30 px-md py-sm rounded-lg flex items-center gap-sm">
                      <span className="material-symbols-outlined text-error text-[20px]">account_balance_wallet</span>
                      <span className="text-sm font-semibold text-error">
                        You owe {formatCurrency(Math.abs(group.user_balance), currencySetting)}
                      </span>
                    </div>
                  )}
                  {isOwed && (
                    <div className="bg-emerald-950/40 border border-emerald-500/30 px-md py-sm rounded-lg flex items-center gap-sm">
                      <span className="material-symbols-outlined text-emerald-400 text-[20px]">payments</span>
                      <span className="text-sm font-semibold text-emerald-300">
                        You are owed {formatCurrency(group.user_balance, currencySetting)}
                      </span>
                    </div>
                  )}
                  {isSettled && (
                    <div className="bg-surface-container border border-outline-variant/40 px-md py-sm rounded-lg flex items-center gap-sm text-on-surface-variant">
                      <span className="material-symbols-outlined text-[20px]">check_circle</span>
                      <span className="text-sm font-medium">All settled up</span>
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

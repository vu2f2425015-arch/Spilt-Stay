import React from 'react';
import { apiService } from '../services/api';

interface NotificationsModalProps {
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ onClose }) => {
  const notifications = apiService.getNotifications();

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <div className="bg-surface-container border border-outline-variant rounded-xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="px-lg py-md border-b border-outline-variant/40 flex justify-between items-center bg-surface-container-low shrink-0">
          <div className="flex items-center gap-md">
            <div className="w-9 h-9 rounded-lg bg-primary-container/20 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined">notifications</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-on-surface">Notifications & SMS/WhatsApp Alerts</h2>
              <p className="text-xs text-on-surface-variant">Live record of automated roomie alerts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-on-surface-variant hover:text-on-surface rounded-full hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-lg overflow-y-auto space-y-md flex-1">
          {notifications.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 rounded-full bg-surface-container-high border border-outline-variant/40 flex items-center justify-center mx-auto text-on-surface-variant">
                <span className="material-symbols-outlined text-2xl">notifications_off</span>
              </div>
              <p className="text-sm font-semibold text-on-surface">No notifications yet</p>
              <p className="text-xs text-on-surface-variant max-w-xs mx-auto">
                When you add an expense or settle debt with alerts toggled on, your sent logs will appear here.
              </p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className="bg-surface-container-low border border-outline-variant/50 p-md rounded-xl space-y-1.5 hover:border-primary/50 transition-colors"
              >
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-primary flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">sms</span>
                    {notif.recipient_name} ({notif.phone_number})
                  </span>
                  <span className="text-on-surface-variant text-[11px]">{notif.sent_at}</span>
                </div>
                <p className="text-xs text-on-surface leading-relaxed bg-surface-container/60 p-2.5 rounded-lg border border-outline-variant/30 font-mono">
                  {notif.message}
                </p>
                <div className="flex justify-end">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                    ✓ {notif.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-lg py-md border-t border-outline-variant/40 bg-surface-container-low flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="bg-surface-container-high text-on-surface px-lg py-sm rounded-xl text-sm font-semibold hover:bg-surface-container-highest transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

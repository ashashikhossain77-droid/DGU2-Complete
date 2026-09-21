/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Bell, CheckCircle2, AlertTriangle, Info, Trash2, ArrowRight, Layers, FileSpreadsheet } from 'lucide-react';
import { NotificationItem } from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
  onNavigate?: (tab: string, lineNo?: string) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onClearAll,
  onNavigate
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#fbfaf6] border border-[#d9d2c2] rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#e7e1d5] pb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#176f78]" />
            <h3 className="font-display text-xl font-bold uppercase text-[#17343a]">
              Floor Alerts &amp; IE Notifications
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl hover:bg-[#e7e1d5] text-slate-500 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#527078]">
              No active floor alerts at this time.
            </div>
          ) : (
            notifications.map(item => {
              const isAlert = item.type === 'alert';
              const isWarning = item.type === 'warning';
              const isWipAlert = item.id.includes('wip-alert') || item.title.toLowerCase().includes('wip');

              return (
                <div
                  key={item.id}
                  onClick={() => onMarkAsRead(item.id)}
                  className={`p-3.5 rounded-2xl border text-xs cursor-pointer transition-all ${
                    item.read
                      ? 'border-[#e7e1d5] bg-white opacity-70'
                      : isWipAlert
                      ? 'border-rose-300 bg-rose-50/70 ring-1 ring-rose-400/40'
                      : isAlert
                      ? 'border-rose-300 bg-rose-50/40'
                      : isWarning
                      ? 'border-amber-300 bg-amber-50/40'
                      : 'border-[#176f78]/30 bg-[#dceceb]/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      {isWipAlert ? (
                        <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                          <Layers className="w-3.5 h-3.5" />
                        </div>
                      ) : isAlert ? (
                        <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      ) : isWarning ? (
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      ) : (
                        <Info className="w-4 h-4 text-[#176f78] shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-[#17343a] text-xs sm:text-sm">{item.title}</span>
                          {isWipAlert && (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-600 text-white tracking-wider animate-pulse">
                              WIP THRESHOLD EXCEEDED
                            </span>
                          )}
                          {item.lineNo && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#f1eee6] text-[#176f78] border border-[#d9d2c2]">
                              Line {item.lineNo}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#527078] mt-1 leading-relaxed">
                          {item.message}
                        </p>

                        {/* Quick action buttons for WIP alerts */}
                        {isWipAlert && onNavigate && (
                          <div className="mt-2.5 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onMarkAsRead(item.id);
                                onNavigate('reports', item.lineNo);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[#176f78] text-white text-[10px] font-bold flex items-center gap-1 hover:bg-[#125860] transition-colors cursor-pointer"
                            >
                              <FileSpreadsheet className="w-3 h-3" />
                              <span>View in Reports</span>
                            </button>
                            {item.lineNo && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onMarkAsRead(item.id);
                                  onNavigate('linedata', item.lineNo);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-white border border-[#d9d2c2] text-[#17343a] text-[10px] font-bold flex items-center gap-1 hover:bg-[#f1eee6] transition-colors cursor-pointer"
                              >
                                <ArrowRight className="w-3 h-3" />
                                <span>Inspect Line {item.lineNo}</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {!item.read && (
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 mt-1"></span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-2 text-right font-mono-numbers">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-[#e7e1d5]">
          <button
            onClick={onClearAll}
            className="flex items-center gap-1 text-xs text-rose-600 hover:underline font-bold cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#176f78] text-white text-xs font-bold hover:bg-[#12555c] cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

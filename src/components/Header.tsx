/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Bell, Sun, Moon, Gauge, Award, CheckCircle2, Loader2, Check, ShieldCheck, Sparkles, User, Upload } from 'lucide-react';
import { SaveStatus, UserProfile } from '../types';

interface HeaderProps {
  theme: string;
  onToggleTheme: () => void;
  unreadCount: number;
  onOpenNotifications: () => void;
  onLogoClick?: () => void;
  onOpenScorecard?: () => void;
  scorecardScore?: number;
  activeDataset?: string;
  onSelectDataset?: (dataset: string) => void;
  onReloadDebonair?: () => void;
  saveStatus?: SaveStatus;
  activeDate?: string;
  onSelectDate?: (date: string) => void;
  onOpenRoles?: () => void;
  onOpenChat?: () => void;
  profile?: UserProfile;
  onOpenProfile?: () => void;
  onOpenDatabase?: (tab?: 'backup' | 'csv-import') => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  unreadCount,
  onOpenNotifications,
  onLogoClick,
  onOpenScorecard,
  scorecardScore,
  saveStatus = 'idle',
  activeDate,
  onSelectDate,
  onOpenRoles,
  onOpenChat,
  profile,
  onOpenProfile,
  onOpenDatabase
}) => {
  const isDark = theme === 'dark';

  return (
    <header
      id="app-top-header"
      className="sticky top-0 z-40 border-b border-[#d9d2c2] bg-[#fbfaf6]/95 backdrop-blur-md transition-colors cockpit-header"
    >
      <div className="mx-auto max-w-[1500px] px-3 sm:px-6">
        <div className="flex h-14 items-center justify-between gap-2 sm:gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              id="top-brand-logo-btn"
              onClick={onLogoClick}
              title="IE Daily Control - Home"
              aria-label="IE Daily Control Home"
              className="flex items-center gap-2.5 text-left group focus:outline-hidden cursor-pointer"
            >
              <div
                id="top-brand-logo-icon"
                className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-[#176f78] to-[#0f4e55] text-white flex items-center justify-center shadow-xs shrink-0 group-hover:from-[#1b7f89] group-hover:to-[#135d65] group-hover:shadow-md transition-all duration-200 border border-[#176f78]/30 overflow-hidden"
              >
                <div className="absolute inset-0 bg-radial from-white/20 via-transparent to-transparent pointer-events-none" />
                <Gauge className="w-5 h-5 stroke-[2.2] text-[#fbfaf6] drop-shadow-xs transition-transform duration-200 group-hover:scale-105" />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex flex-col">
                  <span className="font-extrabold text-xs sm:text-sm tracking-tight text-[#17343a] leading-none uppercase font-display">
                    IE / DAILY
                  </span>
                  <span className="font-extrabold text-xs sm:text-sm tracking-tight text-[#17343a] leading-none uppercase mt-0.5 font-display">
                    CONTROL
                  </span>
                </div>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] border border-[hsl(var(--accent)/.55)]">
                  LIVE / PROD
                </span>
              </div>
            </button>
          </div>

          {/* Center-Right: Live Status Indicator */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {saveStatus === 'saving' && (
              <div
                id="header-save-status-indicator"
                role="status"
                aria-live="polite"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/35 text-amber-800 dark:text-amber-200 text-xs font-bold animate-pulse shadow-2xs"
                title="Saving line and checklist updates to local storage"
              >
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600 dark:text-amber-400" />
                <span>Saving...</span>
              </div>
            )}

            {saveStatus === 'saved' && (
              <div
                id="header-save-status-indicator"
                role="status"
                aria-live="polite"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-800 dark:text-emerald-200 text-xs font-bold shadow-2xs transition-all duration-300"
                title="All updates successfully saved"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Saved</span>
              </div>
            )}

            {saveStatus === 'idle' && (
              <div
                id="header-save-status-indicator"
                className="hidden lg:flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] text-[#527078] opacity-75 hover:opacity-100 transition-opacity"
                title="LocalStorage state synced"
              >
                <Check className="w-3 h-3 text-emerald-600" />
                <span>Saved</span>
              </div>
            )}
          </div>

          {/* Right Action Icons: Scorecard, User Profile & Notifications */}
          <div className="flex items-center gap-2">
            {/* User Profile / OAuth Button */}
            {onOpenProfile && (
              <button
                id="top-user-profile-btn"
                onClick={onOpenProfile}
                title={`Profile: ${profile?.name || 'Engineer'} (${profile?.jobTitle || 'IE'})`}
                className="h-9 px-2 sm:px-2.5 rounded-xl border border-[#d9d2c2] bg-white hover:bg-[#f1eee6] text-[#17343a] flex items-center gap-2 transition-all text-xs font-bold cursor-pointer shadow-2xs"
              >
                {profile?.photoURL ? (
                  <img
                    src={profile.photoURL}
                    alt={profile.name}
                    className="w-5 h-5 rounded-full object-cover border border-[#d9d2c2]"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-md bg-[#176f78] text-white flex items-center justify-center text-[10px] font-bold">
                    {profile?.name ? profile.name.slice(0, 1).toUpperCase() : 'IE'}
                  </div>
                )}
                <span className="hidden md:inline max-w-[100px] truncate text-[11px] font-semibold">
                  {profile?.name ? profile.name.split(' ')[0] : 'Profile'}
                </span>
                {profile?.googleUid && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Google OAuth Linked" />
                )}
              </button>
            )}

            {/* Import Data Button */}
            {onOpenDatabase && (
              <button
                id="top-import-data-btn"
                type="button"
                onClick={() => onOpenDatabase('csv-import')}
                title="Import Line Data from CSV / Excel or Restore Backup"
                className="h-9 px-2.5 sm:px-3 rounded-xl border border-emerald-600/30 bg-emerald-500/10 hover:bg-emerald-600 text-emerald-700 hover:text-white flex items-center gap-1.5 transition-all text-xs font-bold cursor-pointer shadow-2xs group"
              >
                <Upload className="w-4 h-4 shrink-0 text-emerald-700 group-hover:text-white" />
                <span className="hidden sm:inline font-display uppercase tracking-wide">Import Data</span>
              </button>
            )}

            {/* Performance Scorecard Button */}
            {onOpenScorecard && (
              <button
                id="top-scorecard-btn"
                onClick={onOpenScorecard}
                title="Open IE Performance Scorecard Modal"
                className="h-9 px-2.5 sm:px-3 rounded-xl border border-[#176f78]/30 bg-[#176f78]/10 hover:bg-[#176f78] text-[#176f78] hover:text-white flex items-center gap-1.5 transition-all text-xs font-bold cursor-pointer shadow-2xs group"
              >
                <Award className="w-4 h-4 shrink-0 text-[#176f78] group-hover:text-white" />
                <span className="hidden md:inline font-display uppercase tracking-wide">Scorecard</span>
                {typeof scorecardScore === 'number' && (
                  <span className="px-1.5 py-0.5 rounded-md bg-[#176f78] text-white text-[10px] font-mono-numbers group-hover:bg-white group-hover:text-[#176f78] transition-colors">
                    {scorecardScore}%
                  </span>
                )}
              </button>
            )}

            {/* Notifications Button */}
            <button
              id="top-notifications-btn"
              onClick={onOpenNotifications}
              title="Notifications & Floor Alerts"
              aria-label="Notifications"
              className="relative w-9 h-9 rounded-xl border border-[#d9d2c2] bg-white text-slate-700 hover:text-[#176f78] hover:border-[#176f78] flex items-center justify-center transition-colors shadow-2xs cursor-pointer focus:outline-hidden"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-bold text-[9px] flex items-center justify-center shadow-xs">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

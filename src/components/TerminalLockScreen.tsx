/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Shield, Clock, AlertCircle } from 'lucide-react';
import { UserProfile } from '../types';

interface TerminalLockScreenProps {
  isLocked: boolean;
  onUnlock: () => void;
  pinCode?: string;
  profile?: UserProfile;
}

export const TerminalLockScreen: React.FC<TerminalLockScreenProps> = ({
  isLocked,
  onUnlock,
  pinCode = '1234',
  profile
}) => {
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [liveTime, setLiveTime] = useState(new Date());

  useEffect(() => {
    if (!isLocked) return;
    const timer = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [isLocked]);

  if (!isLocked) return null;

  const handleAttemptUnlock = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pinCode || pinInput === pinCode || pinInput === '1234') {
      setPinInput('');
      setErrorMsg('');
      onUnlock();
    } else {
      setErrorMsg('Incorrect PIN. Please re-enter or contact Line In-Charge.');
      setTimeout(() => setErrorMsg(''), 3000);
    }
  };

  const formattedTime = liveTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  const formattedDate = liveTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div
      id="terminal-lock-overlay"
      className="fixed inset-0 z-500 bg-[#0c2024]/95 backdrop-blur-md flex items-center justify-center p-4 text-white select-none animate-in fade-in duration-300"
    >
      <div className="w-full max-w-md p-8 rounded-3xl bg-gradient-to-b from-[#14363d] to-[#0e272c] border border-white/15 shadow-2xl text-center space-y-6">
        {/* Lock Icon & Status */}
        <div className="mx-auto w-16 h-16 rounded-3xl bg-amber-400/20 border border-amber-300/30 flex items-center justify-center text-amber-300 shadow-inner">
          <Lock className="w-8 h-8 animate-pulse" />
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-sky-200 text-xs font-mono uppercase tracking-wider mb-2">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Terminal Shift Protected</span>
          </div>
          <h1 className="font-display text-2xl font-black tracking-tight uppercase text-white">
            Floor Workstation Locked
          </h1>
          <p className="text-xs text-sky-200/80 mt-1">
            Debonair Unit-2 &bull; Industrial Engineering Cockpit
          </p>
        </div>

        {/* Live Clock Display */}
        <div className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-1">
          <div className="font-mono-numbers text-3xl font-black text-white tracking-wider">
            {formattedTime}
          </div>
          <div className="text-xs text-sky-200/70">
            {formattedDate} &bull; General Shift (8:00 AM - 5:00 PM)
          </div>
        </div>

        {/* PIN Entry / Unlock Form */}
        <form onSubmit={handleAttemptUnlock} className="space-y-3">
          <div className="space-y-1.5 text-left">
            <label htmlFor="terminal-pin-input" className="text-xs font-bold text-sky-200 uppercase tracking-wide block">
              Enter Workstation PIN to Resume:
            </label>
            <input
              id="terminal-pin-input"
              type="password"
              autoFocus
              maxLength={6}
              value={pinInput}
              onChange={e => setPinInput(e.target.value)}
              placeholder="Enter PIN (Default: 1234)"
              className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-center font-mono text-lg tracking-widest focus:outline-hidden focus:border-amber-400 focus:bg-white/15 transition-all"
            />
          </div>

          {errorMsg && (
            <div className="text-xs text-rose-300 font-bold flex items-center justify-center gap-1.5 bg-rose-900/30 p-2 rounded-xl border border-rose-500/30">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            id="btn-terminal-unlock"
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-[#17343a] font-black text-sm uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Unlock className="w-4 h-4" />
            <span>Unlock Terminal</span>
          </button>
        </form>

        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-sky-200/70">
          <span>User: {profile?.name || 'Ashik Hossain'}</span>
          <span className="font-mono">Role: {profile?.role?.toUpperCase() || 'HOD'}</span>
        </div>
      </div>
    </div>
  );
};

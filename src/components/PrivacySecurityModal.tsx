/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Shield,
  Lock,
  Eye,
  EyeOff,
  Clock,
  KeyRound,
  FileCheck,
  AlertCircle,
  Database,
  Trash2,
  CheckCircle2,
  History,
  Info
} from 'lucide-react';
import { PrivacySecuritySettings, SecurityAuditEntry, UserProfile } from '../types';

interface PrivacySecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PrivacySecuritySettings;
  onUpdateSettings: (updated: PrivacySecuritySettings) => void;
  onLockTerminal: () => void;
  auditTrail: SecurityAuditEntry[];
  onClearCache?: () => void;
  profile?: UserProfile;
}

export const PrivacySecurityModal: React.FC<PrivacySecurityModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onLockTerminal,
  auditTrail,
  onClearCache,
  profile
}) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'access' | 'data' | 'audit'>('privacy');
  const [pinInput, setPinInput] = useState(settings.pinCode || '1234');
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [pinSavedMsg, setPinSavedMsg] = useState(false);

  if (!isOpen) return null;

  const handleTogglePrivacyMode = () => {
    onUpdateSettings({
      ...settings,
      privacyModeEnabled: !settings.privacyModeEnabled
    });
  };

  const handleToggleBlurFigures = () => {
    onUpdateSettings({
      ...settings,
      blurSensitiveProductionFigures: !settings.blurSensitiveProductionFigures
    });
  };

  const handleSavePin = () => {
    onUpdateSettings({
      ...settings,
      pinLockEnabled: true,
      pinCode: pinInput
    });
    setIsSettingPin(false);
    setPinSavedMsg(true);
    setTimeout(() => setPinSavedMsg(false), 2000);
  };

  const handleAutoLockChange = (minutes: number) => {
    onUpdateSettings({
      ...settings,
      autoLockMinutes: minutes
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-3xl bg-[#fbfaf6] border border-[#d9d2c2] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e7e1d5] bg-gradient-to-r from-[#17343a] to-[#12555c] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-teal-300">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-white uppercase tracking-tight">
                Enterprise Privacy &amp; Security Controls
              </h2>
              <p className="text-xs text-teal-100/80">
                Factory data confidentiality, terminal lock, and local audit compliance
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#e7e1d5] bg-white px-6 gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`py-3 px-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'privacy'
                ? 'border-[#176f78] text-[#176f78]'
                : 'border-transparent text-[#527078] hover:text-[#17343a]'
            }`}
          >
            <EyeOff className="w-4 h-4" />
            <span>Screen Privacy Masking</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('access')}
            className={`py-3 px-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'access'
                ? 'border-[#176f78] text-[#176f78]'
                : 'border-transparent text-[#527078] hover:text-[#17343a]'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Terminal Lock &amp; PIN</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('data')}
            className={`py-3 px-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'data'
                ? 'border-[#176f78] text-[#176f78]'
                : 'border-transparent text-[#527078] hover:text-[#17343a]'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Data Protection</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`py-3 px-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'audit'
                ? 'border-[#176f78] text-[#176f78]'
                : 'border-transparent text-[#527078] hover:text-[#17343a]'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Audit Trail</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* TAB 1: Privacy Mode / Screen Redaction */}
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-200/70 text-xs text-[#17343a] leading-relaxed flex items-start gap-3">
                <Info className="w-4 h-4 text-[#176f78] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#176f78]">Visitor &amp; Presentation Privacy Shield:</strong> When conducting floor tours, external buyer audits, or sharing presentations, activate Privacy Mode to mask confidential garment style numbers, buyer brand references, and operator personal IDs.
                </div>
              </div>

              {/* Master Privacy Toggle */}
              <div
                onClick={handleTogglePrivacyMode}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                  settings.privacyModeEnabled
                    ? 'border-[#176f78] bg-teal-50/30 shadow-xs'
                    : 'border-[#d9d2c2] bg-white hover:border-[#527078]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl shrink-0 ${
                    settings.privacyModeEnabled ? 'bg-[#176f78] text-white' : 'bg-[#f1eee6] text-[#527078]'
                  }`}>
                    {settings.privacyModeEnabled ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#17343a]">
                      Enable Privacy Shield &amp; Data Redaction
                    </div>
                    <p className="text-xs text-[#527078] mt-0.5 leading-normal">
                      Automatically redacts sensitive buyer names (e.g. &quot;Debonair&quot; &rarr; &quot;Buyer [PROTECTED]&quot;) and garment style codes across dashboard cards and report tables.
                    </p>
                  </div>
                </div>

                <div
                  className={`w-12 h-6.5 flex items-center rounded-full p-1 transition-colors shrink-0 ${
                    settings.privacyModeEnabled ? 'bg-[#176f78]' : 'bg-[#d9d2c2]'
                  }`}
                >
                  <div
                    className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition-transform ${
                      settings.privacyModeEnabled ? 'translate-x-5.5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>

              {/* Secondary Privacy Toggle: Blur Production Values */}
              <div
                onClick={handleToggleBlurFigures}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                  settings.blurSensitiveProductionFigures
                    ? 'border-[#176f78] bg-teal-50/30 shadow-xs'
                    : 'border-[#d9d2c2] bg-white hover:border-[#527078]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl shrink-0 ${
                    settings.blurSensitiveProductionFigures ? 'bg-[#176f78] text-white' : 'bg-[#f1eee6] text-[#527078]'
                  }`}>
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#17343a]">
                      Soft-Blur Factory Output &amp; Production Totals
                    </div>
                    <p className="text-xs text-[#527078] mt-0.5 leading-normal">
                      Applies subtle visual CSS blur over exact piece-rate counts and financial SMV estimates until hovered by an authorized supervisor.
                    </p>
                  </div>
                </div>

                <div
                  className={`w-12 h-6.5 flex items-center rounded-full p-1 transition-colors shrink-0 ${
                    settings.blurSensitiveProductionFigures ? 'bg-[#176f78]' : 'bg-[#d9d2c2]'
                  }`}
                >
                  <div
                    className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition-transform ${
                      settings.blurSensitiveProductionFigures ? 'translate-x-5.5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Terminal Lock & PIN */}
          {activeTab === 'access' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white border border-[#d9d2c2] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#176f78]" />
                    <span className="text-xs font-bold uppercase text-[#17343a]">Immediate Terminal Lock</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                    Floor Terminal Ready
                  </span>
                </div>

                <p className="text-xs text-[#527078] leading-relaxed">
                  Stepping away from the IE workstation to conduct a stopwatch time study or attend a line meeting? Lock the screen immediately to protect unauthorized changes.
                </p>

                <button
                  type="button"
                  id="btn-lock-terminal-now"
                  onClick={() => {
                    onClose();
                    onLockTerminal();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#17343a] hover:bg-[#176f78] text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                >
                  <Lock className="w-4 h-4" />
                  <span>Lock Terminal Now (Shift Protected)</span>
                </button>
              </div>

              {/* Inactivity Auto-Lock Setting */}
              <div className="p-4 rounded-2xl bg-white border border-[#d9d2c2] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#176f78]" />
                    <span className="text-xs font-bold uppercase text-[#17343a]">Inactivity Auto-Lock Timer</span>
                  </div>
                  <span className="text-xs font-mono-numbers font-bold text-[#176f78]">
                    {settings.autoLockMinutes === 0 ? 'Disabled' : `${settings.autoLockMinutes} minutes`}
                  </span>
                </div>

                <p className="text-xs text-[#527078]">
                  Automatically locks the interface if no mouse or keyboard activity is detected on the sewing line terminal.
                </p>

                <div className="grid grid-cols-4 gap-2 pt-1">
                  {[0, 5, 15, 30].map(mins => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => handleAutoLockChange(mins)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        settings.autoLockMinutes === mins
                          ? 'bg-[#176f78] text-white border-[#176f78] shadow-xs'
                          : 'bg-[#f1eee6] text-[#17343a] border-[#d9d2c2] hover:bg-[#e6e2d8]'
                      }`}
                    >
                      {mins === 0 ? 'Off' : `${mins} min`}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4-Digit Unlock PIN Configuration */}
              <div className="p-4 rounded-2xl bg-white border border-[#d9d2c2] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-[#176f78]" />
                    <span className="text-xs font-bold uppercase text-[#17343a]">Workstation Unlock PIN</span>
                  </div>
                  <span className="text-[10px] text-[#527078] font-mono-numbers">
                    Current PIN: &bull;&bull;&bull;&bull;
                  </span>
                </div>

                {isSettingPin ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={pinInput}
                      onChange={e => setPinInput(e.target.value)}
                      placeholder="Enter 4-6 digit PIN"
                      className="flex-1 px-3 py-1.5 rounded-xl border border-[#d9d2c2] text-xs font-mono text-center tracking-widest focus:outline-hidden focus:border-[#176f78]"
                    />
                    <button
                      type="button"
                      onClick={handleSavePin}
                      className="px-4 py-1.5 rounded-xl bg-[#176f78] text-white text-xs font-bold hover:bg-[#12555c] transition-colors cursor-pointer"
                    >
                      Save PIN
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsSettingPin(false)}
                      className="px-3 py-1.5 rounded-xl bg-[#f1eee6] text-[#527078] text-xs font-bold hover:bg-[#e6e2d8] transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#527078]">
                      Default PIN: <code className="bg-[#f1eee6] px-1.5 py-0.5 rounded font-bold text-[#17343a]">1234</code> (Quick floor unlock enabled)
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsSettingPin(true)}
                      className="px-3 py-1.5 rounded-xl border border-[#d9d2c2] text-xs font-bold text-[#176f78] hover:bg-teal-50 transition-colors cursor-pointer"
                    >
                      Change PIN
                    </button>
                  </div>
                )}

                {pinSavedMsg && (
                  <p className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> PIN updated successfully!
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Data Protection & Local Storage */}
          {activeTab === 'data' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white border border-[#d9d2c2] space-y-3">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold uppercase text-[#17343a]">Local Data Isolation &amp; Zero Leakage</span>
                </div>
                <div className="text-xs text-[#527078] space-y-2 leading-relaxed">
                  <p>
                    <strong>100% Client-Side Privacy:</strong> All sewing line configurations, checklist evaluations, and manpower allocation records remain strictly isolated within your browser storage.
                  </p>
                  <p>
                    <strong>No External Telemetry:</strong> No analytics cookies, third-party user trackers, or sensitive factory piece-rate data are ever transmitted to unauthorized external servers.
                  </p>
                  <p>
                    <strong>GDPR &amp; Enterprise Compliance:</strong> Compliant with standard industrial data sovereignty policies, ensuring line-level records stay within factory domain boundaries.
                  </p>
                </div>
              </div>

              {/* Data Sanitization */}
              <div className="p-4 rounded-2xl bg-white border border-[#d9d2c2] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-rose-600" />
                    <span className="text-xs font-bold uppercase text-[#17343a]">Local Cache Sanitization</span>
                  </div>
                </div>

                <p className="text-xs text-[#527078] leading-relaxed">
                  Clear cached shift memories and temporary session states when handing over this computer to another plant or department.
                </p>

                {onClearCache && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to sanitize local shift cache? All saved changes will be cleanly refreshed.')) {
                        onClearCache();
                        onClose();
                      }
                    }}
                    className="py-2 px-4 rounded-xl border border-rose-300 text-rose-700 bg-rose-50 hover:bg-rose-100 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Sanitize Local Storage &amp; Reset Cache</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Audit Trail */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-[#527078]">
                <span>Workstation Security Events ({auditTrail.length} records)</span>
                <span className="font-mono-numbers">Current User: {profile?.name || 'Ashik Hossain'}</span>
              </div>

              <div className="divide-y divide-[#e7e1d5] border border-[#d9d2c2] rounded-2xl bg-white overflow-hidden max-h-72 overflow-y-auto">
                {auditTrail.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#527078]">
                    No security events recorded in this session.
                  </div>
                ) : (
                  auditTrail.map(event => (
                    <div key={event.id} className="p-3 hover:bg-[#fbfaf6] text-xs flex items-start justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            event.severity === 'security' ? 'bg-amber-500' : event.severity === 'warning' ? 'bg-rose-500' : 'bg-emerald-500'
                          }`} />
                          <strong className="text-[#17343a]">{event.action}</strong>
                          <span className="text-[10px] text-[#527078] font-mono-numbers">
                            by {event.user}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#527078] pl-4">{event.details}</p>
                      </div>
                      <span className="text-[10px] font-mono-numbers text-[#527078] shrink-0">
                        {event.timestamp}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-[#e7e1d5] bg-white flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[#527078]">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>Industrial Security Standard v2.4</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#176f78] text-white text-xs font-bold hover:bg-[#12555c] transition-colors cursor-pointer shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

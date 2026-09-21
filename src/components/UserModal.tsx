/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, User, Mail, BadgeCheck, Check, Save, Shield, Sliders, ShieldCheck, LogOut, Loader2, AlertCircle } from 'lucide-react';
import { UserProfile, RoleTier } from '../types';
import { ROLE_TIERS as DEFAULT_ROLE_TIERS } from '../mockData';
import { RoleManager } from './RoleManager';
import { googleSignIn, googleSignOut } from '../lib/firebaseAuth';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  roleTiers?: RoleTier[];
  onUpdateRoleTiers?: (tiers: RoleTier[]) => void;
  initialTab?: 'profile' | 'roles';
}

const TIER_TO_ROLE: Record<string, UserProfile['role']> = {
  tier_0: 'admin',
  tier_1: 'hod',
  tier_2: 'manager',
  tier_3: 'assistant_manager',
  tier_4: 'officer'
};

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
  roleTiers = DEFAULT_ROLE_TIERS,
  onUpdateRoleTiers,
  initialTab = 'profile'
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'roles'>(initialTab);
  const [name, setName] = useState<string>(profile.name);
  const [email, setEmail] = useState<string>(profile.email);
  const [employeeId, setEmployeeId] = useState<string>(profile.employeeId || 'IE-9042');
  const [assignedUnit, setAssignedUnit] = useState<string>(profile.assignedUnit || 'Unit 01 (Sewing)');
  const [shift, setShift] = useState<string>(profile.shift || 'General Shift (8:00 AM - 5:00 PM)');
  const [selectedTierId, setSelectedTierId] = useState<string>(profile.tierId || 'tier_1');
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isSigningInWithGoogle, setIsSigningInWithGoogle] = useState<boolean>(false);
  const [googleAuthError, setGoogleAuthError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentRoleTier: RoleTier =
    roleTiers.find(r => r.id === selectedTierId) || roleTiers[0] || DEFAULT_ROLE_TIERS[0];

  const handleGoogleSignIn = async () => {
    setIsSigningInWithGoogle(true);
    setGoogleAuthError(null);
    try {
      const res = await googleSignIn();
      if (res?.user) {
        const u = res.user;
        const newName = u.displayName || name;
        const newEmail = u.email || email;
        const newPhoto = u.photoURL || undefined;
        setName(newName);
        setEmail(newEmail);
        onUpdateProfile({
          ...profile,
          name: newName,
          email: newEmail,
          photoURL: newPhoto,
          googleUid: u.uid
        });
      }
    } catch (err: any) {
      console.error('Google Sign In failed:', err);
      setGoogleAuthError(err.message || 'Authentication was interrupted or canceled.');
    } finally {
      setIsSigningInWithGoogle(false);
    }
  };

  const handleGoogleSignOut = async () => {
    try {
      await googleSignOut();
      onUpdateProfile({
        ...profile,
        photoURL: undefined,
        googleUid: undefined
      });
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const systemRole = TIER_TO_ROLE[selectedTierId] || (currentRoleTier.systemRole.toLowerCase() as any) || 'officer';
    onUpdateProfile({
      ...profile,
      name: name.trim(),
      email: email.trim(),
      employeeId: employeeId.trim(),
      assignedUnit: assignedUnit.trim(),
      shift: shift.trim(),
      jobTitle: currentRoleTier.name,
      tierId: selectedTierId,
      role: systemRole
    });
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 500);
  };

  const handleRoleTiersUpdated = (updatedTiers: RoleTier[]) => {
    if (onUpdateRoleTiers) {
      onUpdateRoleTiers(updatedTiers);
    }
    // If the active profile's tier was updated, keep jobTitle aligned
    const updatedCurrent = updatedTiers.find(t => t.id === selectedTierId);
    if (updatedCurrent && updatedCurrent.name !== profile.jobTitle) {
      onUpdateProfile({
        ...profile,
        jobTitle: updatedCurrent.name
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-3xl bg-[#fbfaf6] border border-[#d9d2c2] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#e7e1d5] bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#176f78] text-white flex items-center justify-center shadow-xs">
                {activeTab === 'profile' ? <User className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
              </div>
              <div>
                <h2 className="font-display text-base sm:text-lg font-bold uppercase text-[#17343a]">
                  {activeTab === 'profile' ? 'Industrial Engineer Profile' : 'System Role & Permissions Manager'}
                </h2>
                <p className="text-xs text-[#527078]">
                  {activeTab === 'profile'
                    ? 'Floor credential settings, personal ID, and assigned operational tier'
                    : 'Configure and update every role title, hierarchy level, sign-offs, and rights'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#527078] hover:text-[#17343a] hover:bg-[#f1eee6] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tab Bar */}
          <div className="flex items-center gap-2 mt-4 p-1 rounded-2xl bg-[#f1eee6] border border-[#d9d2c2] w-full sm:w-auto self-start">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-white text-[#17343a] shadow-xs'
                  : 'text-[#527078] hover:text-[#17343a]'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Engineer Profile</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('roles')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'roles'
                  ? 'bg-white text-[#17343a] shadow-xs'
                  : 'text-[#527078] hover:text-[#17343a]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#176f78]" />
              <span>Manage &amp; Update Roles</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-[#dceceb] text-[#176f78]">
                {roleTiers.length}
              </span>
            </button>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'roles' ? (
            <RoleManager
              roleTiers={roleTiers}
              onUpdateRoleTiers={handleRoleTiersUpdated}
              activeTierId={selectedTierId}
              onSelectActiveTier={(tierId) => setSelectedTierId(tierId)}
            />
          ) : (
            <form onSubmit={handleSaveProfile} className="space-y-5">
              {/* Identity Preview Card */}
              <div className="p-4 rounded-2xl bg-white border border-[#d9d2c2] flex items-center gap-4">
                {profile.photoURL ? (
                  <img
                    src={profile.photoURL}
                    alt={name}
                    className="w-14 h-14 rounded-2xl object-cover border border-[#d9d2c2] shadow-xs"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center font-display text-xl font-bold text-white shadow-xs"
                    style={{ backgroundColor: currentRoleTier.color || '#176f78' }}
                  >
                    {currentRoleTier.shortCode}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-[#17343a]">{name}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#dceceb] text-[#176f78] border border-[#b2d6d8]">
                      {currentRoleTier.shortCode} • Level {currentRoleTier.level}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#f1eee6] text-[#527078] border border-[#d9d2c2]">
                      {currentRoleTier.systemRole}
                    </span>
                  </div>
                  <p className="text-xs text-[#527078] font-medium">{currentRoleTier.name}</p>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-[#527078] flex-wrap">
                    <span className="font-mono-numbers">{employeeId}</span>
                    <span>•</span>
                    <span>{assignedUnit}</span>
                    <span>•</span>
                    <span className="text-[#176f78] font-bold">{shift}</span>
                  </div>
                </div>
              </div>

              {/* Google OAuth Profile Link Section */}
              <div className="p-4 rounded-2xl bg-[#f4f7f6] border border-[#d2e3e1] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#17343a] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#176f78]" />
                    Google Account Verification (OAuth 2.0)
                  </span>
                  {profile.googleUid && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Verified Identity
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#527078]">
                  Sign in with your Google Workspace or corporate email to automatically create and sync your factory IE profile.
                </p>

                {googleAuthError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{googleAuthError}</span>
                  </div>
                )}

                {profile.googleUid ? (
                  <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white border border-[#d9d2c2]">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      {profile.photoURL ? (
                        <img
                          src={profile.photoURL}
                          alt="Google Avatar"
                          className="w-7 h-7 rounded-full object-cover shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-[#176f78] text-white flex items-center justify-center text-xs font-bold shrink-0">
                          G
                        </div>
                      )}
                      <div className="truncate text-xs">
                        <span className="font-bold text-[#17343a] block truncate">{profile.email}</span>
                        <span className="text-[10px] text-emerald-700 font-semibold">Active OAuth Session</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleGoogleSignOut}
                      className="px-2.5 py-1 rounded-lg border border-[#d9d2c2] text-[11px] font-bold text-[#527078] hover:bg-rose-50 hover:text-rose-700 transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>Disconnect</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isSigningInWithGoogle}
                    className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl bg-white hover:bg-gray-50 border border-[#d9d2c2] shadow-2xs text-xs font-bold text-[#17343a] transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSigningInWithGoogle ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#176f78]" />
                        <span>Signing in with Google...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" viewBox="0 0 48 48">
                          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                          <path fill="none" d="M0 0h48v48H0z" />
                        </svg>
                        <span>Sign in with Google to create / link profile</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Form Fields */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] text-xs text-[#17343a] bg-white focus:outline-hidden focus:ring-1 focus:ring-[#176f78]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                      Employee ID
                    </label>
                    <input
                      type="text"
                      required
                      value={employeeId}
                      onChange={e => setEmployeeId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] text-xs text-[#17343a] bg-white focus:outline-hidden focus:ring-1 focus:ring-[#176f78]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                      Assigned Factory Unit
                    </label>
                    <input
                      type="text"
                      required
                      value={assignedUnit}
                      onChange={e => setAssignedUnit(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] text-xs text-[#17343a] bg-white focus:outline-hidden focus:ring-1 focus:ring-[#176f78]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Work Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#527078]" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-[#d9d2c2] text-xs text-[#17343a] bg-white focus:outline-hidden focus:ring-1 focus:ring-[#176f78]"
                    />
                  </div>
                </div>

                {/* Assigned Shift Selection */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Assigned Operational Shift
                  </label>
                  <select
                    value={shift}
                    onChange={e => setShift(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] text-xs text-[#17343a] bg-white focus:outline-hidden focus:ring-1 focus:ring-[#176f78]"
                  >
                    <option value="General Shift (8:00 AM - 5:00 PM)">General Shift 8:00 AM to 5:00 PM (Standard Default)</option>
                    <option value="Shift 02 (Evening Overtime 17:00 - 21:00)">Shift 02 (Evening Overtime 17:00 - 21:00)</option>
                    <option value="Shift 03 (Night Shift 21:00 - 05:00)">Shift 03 (Night Shift 21:00 - 05:00)</option>
                  </select>
                </div>

                {/* Role Tier Selection */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold uppercase text-[#527078]">
                      Authorization Role Tier
                    </label>
                    <button
                      type="button"
                      onClick={() => setActiveTab('roles')}
                      className="text-[11px] font-bold text-[#176f78] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Sliders className="w-3 h-3" />
                      <span>Configure Roles</span>
                    </button>
                  </div>
                  <select
                    value={selectedTierId}
                    onChange={e => setSelectedTierId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] text-xs font-bold text-[#17343a] bg-white focus:outline-hidden focus:ring-1 focus:ring-[#176f78]"
                  >
                    {roleTiers.map(tier => (
                      <option key={tier.id} value={tier.id}>
                        {tier.shortCode} - {tier.name} (Level {tier.level})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Active Permission Badges */}
              <div className="p-3.5 rounded-2xl bg-[#f1eee6] border border-[#d9d2c2] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-[#527078] block">
                    Active Role Privileges:
                  </span>
                  <span className="text-[10px] text-[#527078]">
                    Sign-off: <strong>{currentRoleTier.checklistSignoff}</strong> • Edit: <strong>{currentRoleTier.systemEdit}</strong>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-[#17343a]">
                    <BadgeCheck
                      className={`w-4 h-4 ${
                        currentRoleTier.canManageLines ? 'text-[#176f78]' : 'text-[#527078]/40'
                      }`}
                    />
                    <span className={currentRoleTier.canManageLines ? 'font-bold' : 'text-[#527078]'}>
                      Manage Lines &amp; Setup
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#17343a]">
                    <BadgeCheck
                      className={`w-4 h-4 ${
                        currentRoleTier.canEditLineData ? 'text-[#176f78]' : 'text-[#527078]/40'
                      }`}
                    />
                    <span className={currentRoleTier.canEditLineData ? 'font-bold' : 'text-[#527078]'}>
                      Edit Line Data &amp; SMV
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#17343a]">
                    <BadgeCheck
                      className={`w-4 h-4 ${
                        currentRoleTier.canApproveChecklist ? 'text-emerald-700' : 'text-[#527078]/40'
                      }`}
                    />
                    <span className={currentRoleTier.canApproveChecklist ? 'font-bold' : 'text-[#527078]'}>
                      Sign-off 12-Task Audits
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#17343a]">
                    <BadgeCheck
                      className={`w-4 h-4 ${
                        currentRoleTier.canExport ? 'text-[#176f78]' : 'text-[#527078]/40'
                      }`}
                    />
                    <span className={currentRoleTier.canExport ? 'font-bold' : 'text-[#527078]'}>
                      Export Reports &amp; CSV
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-[#d9d2c2] text-xs font-bold text-[#527078] hover:bg-[#f1eee6] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#176f78] text-white text-xs font-bold hover:bg-[#12555c] transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  {isSaved ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Update Profile</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

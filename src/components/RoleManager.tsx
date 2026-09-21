/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  Edit3,
  Trash2,
  Plus,
  RotateCcw,
  Check,
  X,
  Copy,
  AlertTriangle,
  Lock,
  CheckCircle2,
  BadgeCheck,
  Sparkles,
  Sliders,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { RoleTier } from '../types';
import { ROLE_TIERS as DEFAULT_ROLE_TIERS } from '../mockData';

interface RoleManagerProps {
  roleTiers: RoleTier[];
  onUpdateRoleTiers: (tiers: RoleTier[]) => void;
  activeTierId?: string;
  onSelectActiveTier?: (tierId: string) => void;
}

const COLOR_PRESETS = [
  { name: 'Teal', hex: '#0e7490' },
  { name: 'Purple', hex: '#7c3aed' },
  { name: 'Sky Blue', hex: '#0284c7' },
  { name: 'Emerald', hex: '#059669' },
  { name: 'Orange', hex: '#ea580c' },
  { name: 'Crimson', hex: '#dc2626' },
  { name: 'Indigo', hex: '#4f46e5' },
  { name: 'Slate', hex: '#475569' }
];

const SYSTEM_ROLE_OPTIONS = [
  'ADMIN',
  'HOD',
  'MANAGER',
  'IE_ASST_MANAGER',
  'LINE_IE',
  'QUALITY_LEAD',
  'MAINTENANCE_LEAD',
  'WORK_STUDY_OFFICER',
  'FLOOR_SUPERVISOR'
];

export const RoleManager: React.FC<RoleManagerProps> = ({
  roleTiers,
  onUpdateRoleTiers,
  activeTierId,
  onSelectActiveTier
}) => {
  const [editingTierId, setEditingTierId] = useState<string | null>(null);
  const [draftTier, setDraftTier] = useState<RoleTier | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleStartEdit = (tier: RoleTier) => {
    setEditingTierId(tier.id);
    setDraftTier({ ...tier });
  };

  const handleCancelEdit = () => {
    setEditingTierId(null);
    setDraftTier(null);
  };

  const handleSaveDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftTier) return;

    const updated = roleTiers.map(t => (t.id === draftTier.id ? draftTier : t));
    onUpdateRoleTiers(updated);
    showToast(`Role "${draftTier.name}" successfully updated.`);
    setEditingTierId(null);
    setDraftTier(null);
  };

  const handleAddNewRole = () => {
    const nextLevel = Math.max(...roleTiers.map(r => r.level), 0) + 1;
    const newId = `tier_${Date.now()}`;
    const newRole: RoleTier = {
      id: newId,
      level: nextLevel,
      name: `Custom Role Level ${nextLevel}`,
      shortCode: `T${nextLevel}`,
      color: '#0e7490',
      description: 'Custom floor role created with dedicated operational permissions and responsibilities.',
      systemRole: 'WORK_STUDY_OFFICER',
      systemEdit: 'Full',
      deletionReset: 'Restricted',
      checklistSignoff: 'Submit Only',
      managesTiers: 'Self Only',
      canManageLines: false,
      canEditLineData: true,
      canApproveChecklist: false,
      canCreateTodos: true,
      canExport: true
    };

    const updated = [...roleTiers, newRole];
    onUpdateRoleTiers(updated);
    setEditingTierId(newId);
    setDraftTier({ ...newRole });
    showToast(`New role "Custom Role Level ${nextLevel}" created. Edit parameters below.`);
  };

  const handleDuplicateRole = (tier: RoleTier) => {
    const nextLevel = Math.max(...roleTiers.map(r => r.level), 0) + 1;
    const newId = `tier_${Date.now()}`;
    const duplicated: RoleTier = {
      ...tier,
      id: newId,
      level: nextLevel,
      name: `${tier.name} (Copy)`,
      shortCode: `${tier.shortCode}B`
    };

    const updated = [...roleTiers, duplicated];
    onUpdateRoleTiers(updated);
    setEditingTierId(newId);
    setDraftTier({ ...duplicated });
    showToast(`Duplicated role as "${duplicated.name}".`);
  };

  const handleDeleteRole = (tierId: string) => {
    if (roleTiers.length <= 1) {
      alert('At least one role tier must remain in the system.');
      return;
    }
    const target = roleTiers.find(t => t.id === tierId);
    if (!window.confirm(`Are you sure you want to delete role "${target?.name || tierId}"?`)) {
      return;
    }

    const updated = roleTiers.filter(t => t.id !== tierId);
    onUpdateRoleTiers(updated);
    if (editingTierId === tierId) {
      setEditingTierId(null);
      setDraftTier(null);
    }
    showToast(`Role "${target?.name}" removed.`);
  };

  const handleResetToDefaults = () => {
    onUpdateRoleTiers(DEFAULT_ROLE_TIERS);
    setShowResetConfirm(false);
    setEditingTierId(null);
    setDraftTier(null);
    showToast('All roles reset to factory default baseline configuration.');
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 rounded-xl bg-[#17343a] text-white flex items-center justify-between gap-2 text-xs font-bold shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-white/60 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#f1eee6] border border-[#d9d2c2]">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#176f78]" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#17343a]">
              System Role &amp; Permission Configurations ({roleTiers.length} Roles)
            </h4>
          </div>
          <p className="text-[11px] text-[#527078] mt-0.5">
            Modify any role name, authority level, sign-off privileges, and operational access
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleAddNewRole}
            className="px-3 py-1.5 rounded-xl bg-[#176f78] hover:bg-[#12555c] text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Role</span>
          </button>

          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#f1eee6] text-[#527078] hover:text-[#17343a] border border-[#d9d2c2] font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            title="Restore initial system default roles"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* Reset Confirmation Prompt */}
      {showResetConfirm && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2 text-xs animate-in fade-in">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Reset all roles to factory defaults?</span>
              <p className="text-[11px] text-amber-800 mt-0.5">
                This will overwrite any customized role titles, authority permissions, or newly added tiers and restore the standard T0 through T4 hierarchy.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowResetConfirm(false)}
              className="px-3 py-1 rounded-lg border border-amber-300 text-amber-800 hover:bg-amber-100 font-bold text-[11px] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleResetToDefaults}
              className="px-3 py-1 rounded-lg bg-amber-600 text-white hover:bg-amber-700 font-bold text-[11px] shadow-2xs cursor-pointer"
            >
              Yes, Reset Roles
            </button>
          </div>
        </div>
      )}

      {/* Roles List */}
      <div className="space-y-3">
        {roleTiers.map(tier => {
          const isEditing = editingTierId === tier.id;
          const isActive = tier.id === activeTierId;

          if (isEditing && draftTier) {
            return (
              <form
                key={tier.id}
                onSubmit={handleSaveDraft}
                className="p-4 sm:p-5 rounded-3xl bg-white border-2 border-[#176f78] shadow-md space-y-4 animate-in fade-in"
              >
                <div className="flex items-center justify-between pb-3 border-b border-[#e7e1d5]">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs"
                      style={{ backgroundColor: draftTier.color }}
                    >
                      {draftTier.shortCode}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#17343a]">
                        Editing Role: {draftTier.name}
                      </h4>
                      <span className="text-[10px] text-[#527078]">
                        ID: {draftTier.id} • Tier Level {draftTier.level}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-[#f1eee6]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Main Fields Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  {/* Role Name */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                      Role Title &amp; Designation *
                    </label>
                    <input
                      type="text"
                      required
                      value={draftTier.name}
                      onChange={e => setDraftTier({ ...draftTier, name: e.target.value })}
                      placeholder="e.g. Quality Assurance Manager"
                      className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] text-xs font-bold text-[#17343a] bg-white focus:outline-hidden focus:ring-1 focus:ring-[#176f78]"
                    />
                  </div>

                  {/* Short Code & Level */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                      Short Code (Avatar Tag) *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={4}
                      value={draftTier.shortCode}
                      onChange={e =>
                        setDraftTier({ ...draftTier, shortCode: e.target.value.toUpperCase() })
                      }
                      placeholder="T1, T2, QA"
                      className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] font-mono font-bold text-xs text-[#17343a] bg-white focus:outline-hidden focus:ring-1 focus:ring-[#176f78]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                      Hierarchy Level (0 = Highest) *
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={20}
                      required
                      value={draftTier.level}
                      onChange={e =>
                        setDraftTier({ ...draftTier, level: parseInt(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] font-mono font-bold text-xs text-[#17343a] bg-white focus:outline-hidden focus:ring-1 focus:ring-[#176f78]"
                    />
                  </div>

                  {/* System Role Designation */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                      System Role Designation *
                    </label>
                    <div className="space-y-1">
                      <input
                        type="text"
                        required
                        value={draftTier.systemRole}
                        onChange={e =>
                          setDraftTier({ ...draftTier, systemRole: e.target.value.toUpperCase() })
                        }
                        placeholder="e.g. MANAGER, LINE_IE"
                        className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] font-mono font-bold text-xs text-[#17343a] bg-white focus:outline-hidden focus:ring-1 focus:ring-[#176f78]"
                      />
                      <div className="flex items-center gap-1 flex-wrap pt-0.5">
                        <span className="text-[10px] text-[#527078]">Presets:</span>
                        {SYSTEM_ROLE_OPTIONS.slice(0, 5).map(opt => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setDraftTier({ ...draftTier, systemRole: opt })}
                            className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-[#f1eee6] text-[#176f78] hover:bg-[#e7e1d5] cursor-pointer"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Color Preset Palette */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                      Theme Badge Color
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {COLOR_PRESETS.map(c => (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => setDraftTier({ ...draftTier, color: c.hex })}
                          className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                            draftTier.color.toLowerCase() === c.hex.toLowerCase()
                              ? 'scale-115 border-[#17343a] shadow-xs'
                              : 'border-transparent hover:scale-105'
                          }`}
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        />
                      ))}
                      <input
                        type="color"
                        value={draftTier.color}
                        onChange={e => setDraftTier({ ...draftTier, color: e.target.value })}
                        className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                        title="Custom Color"
                      />
                    </div>
                  </div>

                  {/* Role Description */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                      Operational Mandate &amp; Description
                    </label>
                    <textarea
                      rows={2}
                      value={draftTier.description}
                      onChange={e => setDraftTier({ ...draftTier, description: e.target.value })}
                      placeholder="Outline operational scope and responsibilities..."
                      className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] text-xs text-[#17343a] bg-white focus:outline-hidden focus:ring-1 focus:ring-[#176f78]"
                    />
                  </div>

                  {/* Operational Authority Settings */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                      System Edit Authority
                    </label>
                    <select
                      value={draftTier.systemEdit}
                      onChange={e => setDraftTier({ ...draftTier, systemEdit: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] text-xs font-bold text-[#17343a] bg-white"
                    >
                      <option value="Full">Full (Create / Edit Any Operational Data)</option>
                      <option value="Read-Only">Read-Only (Floor Monitoring Only)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                      Deletion &amp; Reset Authority
                    </label>
                    <select
                      value={draftTier.deletionReset}
                      onChange={e => setDraftTier({ ...draftTier, deletionReset: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] text-xs font-bold text-[#17343a] bg-white"
                    >
                      <option value="Authorized">Authorized (Can delete lines / wipe shift data)</option>
                      <option value="Restricted">Restricted (Deletion blocked)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                      Checklist Sign-off Authority
                    </label>
                    <select
                      value={draftTier.checklistSignoff}
                      onChange={e =>
                        setDraftTier({ ...draftTier, checklistSignoff: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] text-xs font-bold text-[#17343a] bg-white"
                    >
                      <option value="Authorized">Authorized (Can complete &amp; sign off)</option>
                      <option value="Submit Only">Submit Only (Line-level entry only)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                      Manages Tiers Scope
                    </label>
                    <input
                      type="text"
                      value={draftTier.managesTiers}
                      onChange={e => setDraftTier({ ...draftTier, managesTiers: e.target.value })}
                      placeholder="e.g. T1, T2, T3, T4 or Self Only"
                      className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] text-xs font-bold text-[#17343a] bg-white"
                    />
                  </div>

                  {/* Granular Capabilities Toggles */}
                  <div className="sm:col-span-2 pt-2 border-t border-[#e7e1d5] space-y-2">
                    <span className="text-[11px] font-bold uppercase text-[#527078] block">
                      Feature &amp; Operational Permissions
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-[#fbfaf6] p-3 rounded-2xl border border-[#d9d2c2]">
                      <label className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={draftTier.canManageLines}
                          onChange={e =>
                            setDraftTier({ ...draftTier, canManageLines: e.target.checked })
                          }
                          className="w-4 h-4 rounded text-[#176f78] focus:ring-[#176f78]"
                        />
                        <span className="font-bold text-[#17343a]">
                          Manage Sewing Lines (Add / Remove)
                        </span>
                      </label>

                      <label className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={draftTier.canEditLineData}
                          onChange={e =>
                            setDraftTier({ ...draftTier, canEditLineData: e.target.checked })
                          }
                          className="w-4 h-4 rounded text-[#176f78] focus:ring-[#176f78]"
                        />
                        <span className="font-bold text-[#17343a]">
                          Edit Line Balancing, SMV &amp; Telemetry
                        </span>
                      </label>

                      <label className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={draftTier.canApproveChecklist}
                          onChange={e =>
                            setDraftTier({ ...draftTier, canApproveChecklist: e.target.checked })
                          }
                          className="w-4 h-4 rounded text-[#176f78] focus:ring-[#176f78]"
                        />
                        <span className="font-bold text-[#17343a]">
                          Approve Daily 12-Task IE Checklists
                        </span>
                      </label>

                      <label className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={draftTier.canCreateTodos}
                          onChange={e =>
                            setDraftTier({ ...draftTier, canCreateTodos: e.target.checked })
                          }
                          className="w-4 h-4 rounded text-[#176f78] focus:ring-[#176f78]"
                        />
                        <span className="font-bold text-[#17343a]">
                          Create To-Do Tasks &amp; Gemba Schedules
                        </span>
                      </label>

                      <label className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={draftTier.canExport}
                          onChange={e =>
                            setDraftTier({ ...draftTier, canExport: e.target.checked })
                          }
                          className="w-4 h-4 rounded text-[#176f78] focus:ring-[#176f78]"
                        />
                        <span className="font-bold text-[#17343a]">
                          Export Reports, Excel &amp; CSV Data
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e7e1d5]">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2 rounded-xl border border-[#d9d2c2] text-xs font-bold text-[#527078] hover:bg-[#f1eee6] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#176f78] hover:bg-[#12555c] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Save Role Configuration</span>
                  </button>
                </div>
              </form>
            );
          }

          return (
            <div
              key={tier.id}
              className={`p-4 rounded-3xl border transition-all duration-200 bg-white ${
                isActive
                  ? 'border-[#0e7490] ring-2 ring-[#0e7490]/20 shadow-sm'
                  : 'border-[#d9d2c2] hover:border-[#b5ac97]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {/* Short Code Avatar */}
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-xs"
                    style={{ backgroundColor: tier.color }}
                  >
                    {tier.shortCode}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm text-[#17343a] leading-tight">
                        {tier.name}
                      </h4>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold uppercase bg-[#f1eee6] text-[#527078] border border-[#d9d2c2]">
                        Level {tier.level}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono uppercase font-bold bg-[#dceceb] text-[#176f78] border border-[#b2d6d8]">
                        {tier.systemRole}
                      </span>
                      {isActive && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Active Profile Role
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#527078] mt-1 line-clamp-2">
                      {tier.description}
                    </p>

                    {/* Quick Permissions Badges */}
                    <div className="flex items-center gap-2 mt-2 text-[11px] flex-wrap">
                      <span className="text-[#527078]">
                        Sign-off:{' '}
                        <strong
                          className={
                            tier.checklistSignoff === 'Authorized'
                              ? 'text-emerald-700'
                              : 'text-amber-800'
                          }
                        >
                          {tier.checklistSignoff}
                        </strong>
                      </span>
                      <span>•</span>
                      <span className="text-[#527078]">
                        Edit: <strong>{tier.systemEdit}</strong>
                      </span>
                      <span>•</span>
                      <span className="text-[#527078]">
                        Reset: <strong>{tier.deletionReset}</strong>
                      </span>
                      <span>•</span>
                      <span className="text-[#527078]">
                        Manages: <strong className="font-mono">{tier.managesTiers}</strong>
                      </span>
                    </div>

                    {/* Capability Tags */}
                    <div className="flex items-center gap-1 mt-2 flex-wrap text-[10px]">
                      {tier.canManageLines && (
                        <span className="px-2 py-0.5 rounded-md bg-[#f1eee6] text-[#17343a] border border-[#d9d2c2]">
                          Lines
                        </span>
                      )}
                      {tier.canEditLineData && (
                        <span className="px-2 py-0.5 rounded-md bg-[#f1eee6] text-[#17343a] border border-[#d9d2c2]">
                          Line Data &amp; SMV
                        </span>
                      )}
                      {tier.canApproveChecklist && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Sign-off
                        </span>
                      )}
                      {tier.canCreateTodos && (
                        <span className="px-2 py-0.5 rounded-md bg-[#f1eee6] text-[#17343a] border border-[#d9d2c2]">
                          Tasks
                        </span>
                      )}
                      {tier.canExport && (
                        <span className="px-2 py-0.5 rounded-md bg-[#f1eee6] text-[#17343a] border border-[#d9d2c2]">
                          Export
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {onSelectActiveTier && !isActive && (
                    <button
                      type="button"
                      onClick={() => onSelectActiveTier(tier.id)}
                      className="px-2.5 py-1 rounded-xl bg-[#f1eee6] hover:bg-[#e7e1d5] text-[#17343a] font-bold text-xs border border-[#d9d2c2] transition-colors cursor-pointer"
                      title="Set as active profile role"
                    >
                      Activate
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleStartEdit(tier)}
                    className="p-1.5 rounded-xl bg-white hover:bg-[#f1eee6] text-[#176f78] border border-[#d9d2c2] transition-colors cursor-pointer"
                    title={`Edit ${tier.name}`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDuplicateRole(tier)}
                    className="p-1.5 rounded-xl bg-white hover:bg-[#f1eee6] text-[#527078] border border-[#d9d2c2] transition-colors cursor-pointer"
                    title="Duplicate role"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteRole(tier.id)}
                    className="p-1.5 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-[#d9d2c2] transition-colors cursor-pointer"
                    title="Delete role"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

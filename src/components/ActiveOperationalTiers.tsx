/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  Check,
  ArrowRight,
  Edit3,
  Trash2,
  CheckSquare,
  Users,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Lock,
  Sliders
} from 'lucide-react';
import { RoleTier, UserProfile } from '../types';
import { ROLE_TIERS as DEFAULT_ROLE_TIERS } from '../mockData';

interface ActiveOperationalTiersProps {
  currentTierId: string;
  onSelectTier: (tier: RoleTier) => void;
  profile?: UserProfile;
  roleTiers?: RoleTier[];
  onOpenRoleEditor?: (tierId?: string) => void;
}

export const ActiveOperationalTiers: React.FC<ActiveOperationalTiersProps> = ({
  currentTierId,
  onSelectTier,
  profile,
  roleTiers = DEFAULT_ROLE_TIERS,
  onOpenRoleEditor
}) => {
  // Allow toggling card expanded states; default all expanded for full transparency
  const [expandedTiers, setExpandedTiers] = useState<Record<string, boolean>>({
    tier_0: true,
    tier_1: true,
    tier_2: true,
    tier_3: true,
    tier_4: true
  });

  const toggleExpand = (id: string) => {
    setExpandedTiers(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="space-y-4">
      {/* Header Info Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-2xl bg-[#f1eee6] border border-[#d9d2c2]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#176f78] text-white flex items-center justify-center shrink-0 shadow-2xs">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#17343a]">
              Active System Role &amp; Operational Tier's ({roleTiers.length} Roles)
            </h4>
            <p className="text-[11px] text-[#527078]">
              Select a tier level to simulate permission authorities or edit role parameters
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {onOpenRoleEditor && (
            <button
              type="button"
              onClick={() => onOpenRoleEditor()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#176f78] text-white text-xs font-bold hover:bg-[#12555c] transition-colors shadow-2xs cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Configure Roles</span>
            </button>
          )}

          {profile && (
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-[#d9d2c2] shadow-2xs">
              <span className="text-[10px] text-[#527078] uppercase font-bold">Active User:</span>
              <span className="text-xs font-bold text-[#17343a]">{profile.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Cards List matching user screenshot */}
      <div className="space-y-3.5">
        {roleTiers.map(tier => {
          const isActive = tier.id === currentTierId;
          const isExpanded = expandedTiers[tier.id] ?? true;

          return (
            <div
              key={tier.id}
              className={`rounded-3xl border transition-all duration-200 overflow-hidden shadow-2xs ${
                isActive
                  ? 'border-[#0e7490] bg-[#f0fdfa]/40 ring-2 ring-[#0e7490]/20 shadow-md'
                  : 'border-[#d9d2c2] bg-white hover:border-[#b5ac97]'
              }`}
            >
              {/* Card Header */}
              <div
                onClick={() => toggleExpand(tier.id)}
                className="p-4 sm:p-5 cursor-pointer select-none flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-3.5">
                  {/* Circle Shortcode Avatar with Dynamic Color */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-xs"
                    style={{ backgroundColor: tier.color || '#176f78' }}
                  >
                    {tier.shortCode}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-base text-[#17343a] leading-tight">
                        {tier.name}
                      </h4>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-[#f1eee6] text-[#527078] border border-[#d9d2c2]">
                        {tier.shortCode}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#dceceb] text-[#176f78] border border-[#b2d6d8]">
                        {tier.systemRole}
                      </span>
                    </div>
                    <div className="text-[11px] font-bold text-[#527078] mt-0.5">
                      Tier Level {tier.level}
                    </div>
                    <p className="text-xs text-[#527078] mt-1 font-medium leading-relaxed">
                      {tier.description}
                    </p>
                  </div>
                </div>

                {/* Right Badge / Status & Edit Action */}
                <div className="flex items-center gap-2 shrink-0">
                  {onOpenRoleEditor && (
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        onOpenRoleEditor(tier.id);
                      }}
                      className="p-1.5 rounded-xl bg-white hover:bg-[#f1eee6] text-[#176f78] border border-[#d9d2c2] transition-colors cursor-pointer"
                      title={`Edit ${tier.name}`}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {isActive ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#dcfce7] text-[#15803d] border border-[#bbf7d0]">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      Active Role
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-[#7a8b90] hidden sm:inline-block">
                      Click to Activate
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      toggleExpand(tier.id);
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-[#f1eee6]"
                    title={isExpanded ? 'Collapse' : 'Expand'}
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Card Body & Details (Expandable) */}
              {isExpanded && (
                <div className="px-4 sm:px-5 pb-5 pt-1 space-y-4 border-t border-[#f1eee6]">
                  {/* System Role Header & Authority Matrix */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-xs font-bold pb-2 border-b border-[#f1eee6]">
                      <span className="uppercase text-[11px] tracking-wider text-[#527078]">
                        SYSTEM ROLE:
                      </span>
                      <span className="font-mono uppercase font-extrabold text-[#17343a] bg-[#f1eee6] px-2 py-0.5 rounded border border-[#d9d2c2]">
                        {tier.systemRole}
                      </span>
                    </div>

                    {/* Permissions 4-Item List */}
                    <div className="mt-3 space-y-2.5 text-xs">
                      {/* System Edit */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[#527078]">
                          <Edit3 className="w-3.5 h-3.5 text-[#176f78]" />
                          <span>System Edit</span>
                        </div>
                        <span
                          className={`font-bold ${
                            tier.systemEdit === 'Full'
                              ? 'text-[#17343a]'
                              : 'text-[#527078]'
                          }`}
                        >
                          {tier.systemEdit}
                        </span>
                      </div>

                      {/* Deletion & Reset */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[#527078]">
                          <Trash2 className="w-3.5 h-3.5 text-[#176f78]" />
                          <span>Deletion &amp; Reset</span>
                        </div>
                        <span
                          className={`font-bold ${
                            tier.deletionReset === 'Authorized'
                              ? 'text-emerald-700'
                              : 'text-[#527078]'
                          }`}
                        >
                          {tier.deletionReset}
                        </span>
                      </div>

                      {/* Checklist Sign-off */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[#527078]">
                          <CheckSquare className="w-3.5 h-3.5 text-[#176f78]" />
                          <span>Checklist Sign-off</span>
                        </div>
                        <span
                          className={`font-bold ${
                            tier.checklistSignoff === 'Authorized'
                              ? 'text-emerald-700'
                              : 'text-amber-800'
                          }`}
                        >
                          {tier.checklistSignoff}
                        </span>
                      </div>

                      {/* Manages Tiers */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[#527078]">
                          <Users className="w-3.5 h-3.5 text-[#176f78]" />
                          <span>Manages Tiers</span>
                        </div>
                        <span className="font-mono text-xs font-bold text-[#17343a]">
                          {tier.managesTiers}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-2 flex items-center gap-2">
                    {isActive ? (
                      <button
                        type="button"
                        disabled
                        className="flex-1 py-2.5 px-4 rounded-2xl bg-[#0e7490] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-default"
                      >
                        <Check className="w-4 h-4 stroke-[2.5]" />
                        <span>Active System Role</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onSelectTier(tier)}
                        className="flex-1 py-2.5 px-4 rounded-2xl bg-[#f1eee6] hover:bg-[#e7e1d5] text-[#17343a] font-bold text-xs border border-[#d9d2c2] flex items-center justify-center gap-2 transition-all hover:shadow-2xs active:scale-[0.99] cursor-pointer"
                      >
                        <span>Switch to Role &amp; Tier {tier.level}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}

                    {onOpenRoleEditor && (
                      <button
                        type="button"
                        onClick={() => onOpenRoleEditor(tier.id)}
                        className="py-2.5 px-4 rounded-2xl bg-white hover:bg-[#f1eee6] text-[#176f78] border border-[#d9d2c2] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Edit role properties"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Role</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

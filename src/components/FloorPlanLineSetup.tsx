/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  LayoutGrid,
  Building2,
  Sliders,
  Layers,
  Users,
  Play,
  Wrench,
  Pause,
  Sparkles,
  MapPin,
  ChevronRight,
  Columns,
  FileSpreadsheet
} from 'lucide-react';
import { LineEntry, UserProfile } from '../types';
import { VisualFloorPlan } from './VisualFloorPlan';
import { LineConfigurationTeams } from './LineConfigurationTeams';

export type FloorSetupSubView = 'floor-plan' | 'line-setup' | 'split-view';

export interface FloorPlanLineSetupProps {
  lines: LineEntry[];
  onSaveLine: (updatedLine: LineEntry) => void;
  onAddNewLine: (newLine: LineEntry) => void;
  onDeleteLine?: (lineNo: string) => void;
  onDeleteFloor?: (floorName: string, mode: 'delete_all_lines' | 'reassign', targetFloor?: string) => void;
  onReorderLines?: (reorderedFloorLines: LineEntry[]) => void;
  onNavigate: (tab: string, lineNo?: string) => void;
  activeDate?: string;
  profile?: UserProfile;
  initialSubView?: FloorSetupSubView;
  initialLineNo?: string;
  onOpenDatabase?: (tab?: 'backup' | 'csv-import') => void;
}

export const FloorPlanLineSetup: React.FC<FloorPlanLineSetupProps> = ({
  lines,
  onSaveLine,
  onAddNewLine,
  onDeleteLine,
  onDeleteFloor,
  onReorderLines,
  onNavigate,
  activeDate,
  profile,
  initialSubView = 'floor-plan',
  initialLineNo,
  onOpenDatabase
}) => {
  const [activeSubView, setActiveSubView] = useState<FloorSetupSubView>(initialSubView);
  const [syncedFloor, setSyncedFloor] = useState<string | undefined>(undefined);
  const [selectedTargetLineNo, setSelectedTargetLineNo] = useState<string | undefined>(initialLineNo);

  // Compute key summary statistics across all lines
  const stats = useMemo(() => {
    const totalLines = lines.length;
    const activeLines = lines.filter(l => l.isActive !== false && l.status !== 'Stopped' && l.status !== 'Maintenance').length;
    const maintLines = lines.filter(l => l.status === 'Maintenance').length;
    const stoppedLines = lines.filter(l => l.isActive === false || l.status === 'Stopped').length;

    const floors = Array.from(new Set(lines.map(l => l.floor || 'Floor 01'))).filter(Boolean);
    const totalStaff = lines.reduce((acc, l) => acc + (l.teamMembers?.length || 0), 0);

    return {
      totalLines,
      activeLines,
      maintLines,
      stoppedLines,
      totalFloors: floors.length,
      totalStaff,
      floors
    };
  }, [lines]);

  // Seamless switch handlers between Floor Plan and Line Setup
  const handleSwitchToSetup = (lineNo?: string) => {
    if (lineNo) {
      setSelectedTargetLineNo(lineNo);
    }
    setActiveSubView('line-setup');
  };

  const handleSwitchToFloorPlan = (floorName?: string, lineNo?: string) => {
    if (floorName) {
      setSyncedFloor(floorName);
    }
    if (lineNo) {
      setSelectedTargetLineNo(lineNo);
    }
    setActiveSubView('floor-plan');
  };

  return (
    <div id="floor-plan-line-setup-merged-cockpit" className="space-y-6">
      {/* ────────────────────────────────────────────────────────── */}
      {/* UNIFIED MASTER CONTROL HEADER & SUBVIEW SWITCHER           */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-[#d9d2c2] rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#e7e1d5] pb-5">
          <div className="space-y-1.5">
            <button
              id="btn-merged-back-to-dashboard"
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="inline-flex items-center gap-2 text-xs font-bold text-[#176f78] hover:text-[#125860] transition-colors cursor-pointer mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Factory Dashboard</span>
            </button>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-[#176f78]/10 text-[#176f78] border border-[#176f78]/30">
                MERGED OPERATIONS MODULE
              </span>
              <span className="text-xs text-[#527078] font-mono-numbers">
                {activeDate || 'Live Factory Production'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17343a] tracking-tight uppercase font-display flex items-center gap-2.5">
              <LayoutGrid className="w-7 h-7 text-[#176f78]" />
              <span>Floor Plan &amp; Line Setup</span>
            </h1>

            <p className="text-xs sm:text-sm text-[#527078] max-w-3xl">
              Unified control center for visual shop floor spatial mapping, drag-and-drop bay layout rearrangement,
              live line operational controls, and complete apparel production line configuration with team staffing.
            </p>
          </div>

          {/* Sub-View Switcher Tabs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            <div
              id="floor-setup-subview-toggle-bar"
              className="flex items-center bg-[#f1eee6] p-1 rounded-2xl border border-[#d9d2c2] shadow-2xs"
            >
              <button
                type="button"
                id="btn-subview-floor-plan"
                onClick={() => setActiveSubView('floor-plan')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeSubView === 'floor-plan'
                    ? 'bg-[#176f78] text-white shadow-xs'
                    : 'text-[#527078] hover:text-[#17343a] hover:bg-[#e7e1d5]'
                }`}
                title="View spatial floor plan map, bay layouts, and status toggles"
              >
                <LayoutGrid className="w-4 h-4" />
                <span>Floor Plan Map</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono-numbers ${
                    activeSubView === 'floor-plan'
                      ? 'bg-white/20 text-white'
                      : 'bg-white border border-[#d9d2c2] text-[#176f78]'
                  }`}
                >
                  {stats.activeLines}/{stats.totalLines}
                </span>
              </button>

              <button
                type="button"
                id="btn-subview-line-setup"
                onClick={() => setActiveSubView('line-setup')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeSubView === 'line-setup'
                    ? 'bg-[#176f78] text-white shadow-xs'
                    : 'text-[#527078] hover:text-[#17343a] hover:bg-[#e7e1d5]'
                }`}
                title="Configure production lines, teams, apartments, and machinery"
              >
                <Building2 className="w-4 h-4" />
                <span>Line &amp; Teams Setup</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono-numbers ${
                    activeSubView === 'line-setup'
                      ? 'bg-white/20 text-white'
                      : 'bg-white border border-[#d9d2c2] text-[#176f78]'
                  }`}
                >
                  {stats.totalLines}
                </span>
              </button>

              <button
                type="button"
                id="btn-subview-split-view"
                onClick={() => setActiveSubView('split-view')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeSubView === 'split-view'
                    ? 'bg-[#176f78] text-white shadow-xs'
                    : 'text-[#527078] hover:text-[#17343a] hover:bg-[#e7e1d5]'
                }`}
                title="View both Floor Plan and Line Setup simultaneously in split mode"
              >
                <Columns className="w-4 h-4" />
                <span className="hidden sm:inline">Split View</span>
              </button>
            </div>

            {onOpenDatabase && (
              <button
                type="button"
                id="btn-import-csv-lines-floor-setup"
                onClick={() => onOpenDatabase('csv-import')}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                title="Import and validate new sewing line configurations via CSV spreadsheet"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Import CSV Lines</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Operational Telemetry Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-[#fbfaf6] border border-[#e7e1d5] flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase font-bold text-[#527078]">Configured Lines</div>
              <div className="text-xl font-extrabold text-[#17343a] font-mono-numbers">
                {stats.totalLines} <span className="text-xs font-normal text-[#527078]">Lines</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
              <Play className="w-4 h-4 fill-current" />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#fbfaf6] border border-[#e7e1d5] flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase font-bold text-[#527078]">Active Operations</div>
              <div className="text-xl font-extrabold text-emerald-700 font-mono-numbers">
                {stats.activeLines} <span className="text-xs font-normal text-[#527078]">Running</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {stats.totalLines > 0 ? Math.round((stats.activeLines / stats.totalLines) * 100) : 0}% Up
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#fbfaf6] border border-[#e7e1d5] flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase font-bold text-[#527078]">Factory Floors</div>
              <div className="text-xl font-extrabold text-[#17343a] font-mono-numbers">
                {stats.totalFloors} <span className="text-xs font-normal text-[#527078]">Floors</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#fbfaf6] border border-[#e7e1d5] flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase font-bold text-[#527078]">Staff Assigned</div>
              <div className="text-xl font-extrabold text-[#176f78] font-mono-numbers">
                {stats.totalStaff} <span className="text-xs font-normal text-[#527078]">Personnel</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* RENDER ACTIVE SUBVIEW                                      */}
      {/* ────────────────────────────────────────────────────────── */}

      {/* Mode 1: Fullscreen Visual Floor Plan */}
      {activeSubView === 'floor-plan' && (
        <section id="unified-view-floor-plan" className="animate-fadeIn">
          <VisualFloorPlan
            lines={lines}
            onSaveLine={onSaveLine}
            onReorderLines={onReorderLines}
            onNavigate={onNavigate}
            activeDate={activeDate}
            profile={profile}
            initialFloor={syncedFloor}
            onSwitchToSetup={handleSwitchToSetup}
            hideTopHeader={false}
          />
        </section>
      )}

      {/* Mode 2: Fullscreen Line & Teams Setup */}
      {activeSubView === 'line-setup' && (
        <section id="unified-view-line-setup" className="animate-fadeIn">
          <LineConfigurationTeams
            lines={lines}
            onSaveLine={onSaveLine}
            onAddNewLine={onAddNewLine}
            onDeleteLine={onDeleteLine}
            onDeleteFloor={onDeleteFloor}
            onNavigate={onNavigate}
            profile={profile}
            initialFloorFilter={syncedFloor}
            onSwitchToFloorPlan={handleSwitchToFloorPlan}
            hideTopHeader={false}
          />
        </section>
      )}

      {/* Mode 3: Split Workstation View (Side-by-Side or Stacked) */}
      {activeSubView === 'split-view' && (
        <section id="unified-view-split" className="space-y-8 animate-fadeIn">
          {/* Top Half: Floor Plan */}
          <div className="border border-[#d9d2c2] rounded-3xl p-4 sm:p-6 bg-[#fbfaf6] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#e7e1d5] pb-3">
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-[#176f78]" />
                <h2 className="text-lg font-bold text-[#17343a]">Visual Floor Plan Map</h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveSubView('floor-plan')}
                className="text-xs font-bold text-[#176f78] hover:underline flex items-center gap-1"
              >
                <span>Expand Fullscreen Map</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <VisualFloorPlan
              lines={lines}
              onSaveLine={onSaveLine}
              onReorderLines={onReorderLines}
              onNavigate={onNavigate}
              activeDate={activeDate}
              profile={profile}
              initialFloor={syncedFloor}
              onSwitchToSetup={handleSwitchToSetup}
              hideTopHeader={false}
            />
          </div>

          {/* Bottom Half: Line & Team Configuration */}
          <div className="border border-[#d9d2c2] rounded-3xl p-4 sm:p-6 bg-[#fbfaf6] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#e7e1d5] pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#176f78]" />
                <h2 className="text-lg font-bold text-[#17343a]">Line Configuration &amp; Teams</h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveSubView('line-setup')}
                className="text-xs font-bold text-[#176f78] hover:underline flex items-center gap-1"
              >
                <span>Expand Fullscreen Setup</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <LineConfigurationTeams
              lines={lines}
              onSaveLine={onSaveLine}
              onAddNewLine={onAddNewLine}
              onDeleteLine={onDeleteLine}
              onDeleteFloor={onDeleteFloor}
              onNavigate={onNavigate}
              profile={profile}
              initialFloorFilter={syncedFloor}
              onSwitchToFloorPlan={handleSwitchToFloorPlan}
              hideTopHeader={false}
            />
          </div>
        </section>
      )}
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Calendar,
  TrendingUp,
  Award,
  Layers,
  Users,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  BarChart3,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  GitCompare,
  Percent,
  Clock,
  Shirt,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { LineEntry, ChecklistMap, UserProfile, TodoItem } from '../types';
import { MonthlyAuditCalendar } from './MonthlyAuditCalendar';
import { AiAuditView } from './AiAuditView';
import { getTodayDateStr } from '../utils';

interface MonthlySummaryProps {
  lines: LineEntry[];
  checklists?: ChecklistMap;
  selectedDate?: string;
  onSelectDate?: (date: string) => void;
  onNavigate?: (tab: string) => void;
  profile?: UserProfile;
  onAddTodo?: (item: Partial<TodoItem>) => void;
}

export const MonthlySummary: React.FC<MonthlySummaryProps> = ({
  lines,
  checklists = {},
  selectedDate = getTodayDateStr(),
  onSelectDate = () => {},
  onNavigate,
  profile,
  onAddTodo
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'audit_calendar' | 'efficiency_trends' | 'ai_audit'>('efficiency_trends');
  const [selectedMonth, setSelectedMonth] = useState('September 2026');

  // Toggle between 'single' and 'comparative' views for production KPIs
  const [kpiViewMode, setKpiViewMode] = useState<'single' | 'comparative'>('single');

  // Current month daily history (September 2026)
  const currentMonthHistory = [
    { day: 1, eff: 82.5, pcs: 4400 },
    { day: 2, eff: 84.0, pcs: 4520 },
    { day: 3, eff: 83.2, pcs: 4480 },
    { day: 4, eff: 85.5, pcs: 4650 },
    { day: 5, eff: 86.0, pcs: 4700 },
    { day: 6, eff: 87.2, pcs: 4780 },
    { day: 7, eff: 86.8, pcs: 4720 },
    { day: 8, eff: 88.0, pcs: 4850 },
    { day: 9, eff: 87.5, pcs: 4800 },
    { day: 10, eff: 88.4, pcs: 4890 },
    { day: 11, eff: 89.0, pcs: 4950 },
    { day: 12, eff: 88.2, pcs: 4880 },
    { day: 13, eff: 86.5, pcs: 4750 },
    { day: 14, eff: 87.0, pcs: 4800 },
    { day: 15, eff: 88.6, pcs: 4910 },
    { day: 16, eff: 87.4, pcs: 4840 }
  ];

  // Previous month daily history (August 2026)
  const previousMonthHistory = [
    { day: 1, eff: 80.0, pcs: 4100 },
    { day: 2, eff: 81.5, pcs: 4220 },
    { day: 3, eff: 81.0, pcs: 4180 },
    { day: 4, eff: 82.5, pcs: 4300 },
    { day: 5, eff: 83.0, pcs: 4350 },
    { day: 6, eff: 84.2, pcs: 4420 },
    { day: 7, eff: 83.8, pcs: 4380 },
    { day: 8, eff: 84.5, pcs: 4480 },
    { day: 9, eff: 84.0, pcs: 4430 },
    { day: 10, eff: 85.2, pcs: 4550 },
    { day: 11, eff: 85.8, pcs: 4600 },
    { day: 12, eff: 84.9, pcs: 4510 },
    { day: 13, eff: 83.5, pcs: 4390 },
    { day: 14, eff: 84.0, pcs: 4420 },
    { day: 15, eff: 85.2, pcs: 4560 },
    { day: 16, eff: 84.1, pcs: 4450 }
  ];

  // Single month buyers
  const buyersSummary = [
    { buyer: 'H&M', lines: 'L18, L21', totalPcs: 34500, avgEff: 87.5, smv: 0.88 },
    { buyer: 'Zara', lines: 'L19', totalPcs: 14200, avgEff: 82.0, smv: 1.25 },
    { buyer: 'Gap', lines: 'L20', totalPcs: 19800, avgEff: 90.0, smv: 0.95 },
    { buyer: 'Uniqlo', lines: 'L24', totalPcs: 23600, avgEff: 92.0, smv: 0.80 }
  ];

  // Comparative buyers summary (Current vs Previous)
  const comparativeBuyers = [
    {
      buyer: 'H&M',
      lines: 'L18, L21',
      currPcs: 34500,
      prevPcs: 31200,
      currEff: 87.5,
      prevEff: 84.0,
      pcsDeltaPct: '+10.6%',
      effDelta: '+3.5%'
    },
    {
      buyer: 'Zara',
      lines: 'L19',
      currPcs: 14200,
      prevPcs: 15100,
      currEff: 82.0,
      prevEff: 81.5,
      pcsDeltaPct: '-5.9%',
      effDelta: '+0.5%'
    },
    {
      buyer: 'Gap',
      lines: 'L20',
      currPcs: 19800,
      prevPcs: 17900,
      currEff: 90.0,
      prevEff: 86.2,
      pcsDeltaPct: '+10.6%',
      effDelta: '+3.8%'
    },
    {
      buyer: 'Uniqlo',
      lines: 'L24',
      currPcs: 23600,
      prevPcs: 20400,
      currEff: 92.0,
      prevEff: 88.0,
      pcsDeltaPct: '+15.7%',
      effDelta: '+4.0%'
    }
  ];

  // Comparative Line performance (Current vs Previous)
  const comparativeLines = [
    { lineNo: '18', style: 'Basic Crewneck', currEff: 85.0, prevEff: 81.2, diff: '+3.8%', trend: 'up' },
    { lineNo: '19', style: 'Polo Pique', currEff: 82.0, prevEff: 79.5, diff: '+2.5%', trend: 'up' },
    { lineNo: '20', style: 'Slim Chino Pants', currEff: 88.5, prevEff: 86.0, diff: '+2.5%', trend: 'up' },
    { lineNo: '21', style: 'Oversized Hoodie', currEff: 86.5, prevEff: 83.0, diff: '+3.5%', trend: 'up' },
    { lineNo: '24', style: 'Seamless Dry Fit Tee', currEff: 92.0, prevEff: 87.4, diff: '+4.6%', trend: 'up' }
  ];

  return (
    <div className="space-y-6">
      {/* Sub-Tab Navigation Bar with AI Audit Tab */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d9d2c2] pb-3">
        <div className="flex items-center gap-1.5 sm:gap-2 bg-[#f1eee6] p-1.5 rounded-2xl border border-[#d9d2c2]">
          <button
            id="monthly-tab-trends"
            onClick={() => setActiveSubTab('efficiency_trends')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'efficiency_trends'
                ? 'bg-white text-[#17343a] shadow-xs'
                : 'text-[#527078] hover:text-[#17343a]'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-[#176f78]" />
            <span>Efficiency & Production KPIs</span>
          </button>

          <button
            id="monthly-tab-calendar"
            onClick={() => setActiveSubTab('audit_calendar')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'audit_calendar'
                ? 'bg-white text-[#17343a] shadow-xs'
                : 'text-[#527078] hover:text-[#17343a]'
            }`}
          >
            <Calendar className="w-4 h-4 text-[#176f78]" />
            <span>Activity & Audit Log</span>
          </button>

          <button
            id="monthly-tab-ai-audit"
            onClick={() => setActiveSubTab('ai_audit')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
              activeSubTab === 'ai_audit'
                ? 'bg-[#176f78] text-white shadow-xs'
                : 'text-[#527078] hover:text-[#17343a]'
            }`}
          >
            <Sparkles className={`w-4 h-4 ${activeSubTab === 'ai_audit' ? 'text-amber-300' : 'text-[#176f78]'}`} />
            <span>AI Floor & IE Audit</span>
            <span className="hidden sm:inline px-1.5 py-0.2 rounded-full text-[9px] font-extrabold uppercase bg-amber-400 text-amber-950">
              New
            </span>
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-2 text-xs text-[#527078]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          <span>IE Daily Control Protocol Active</span>
        </div>
      </div>

      {/* Content depending on selected sub-tab */}
      {activeSubTab === 'audit_calendar' && (
        <MonthlyAuditCalendar
          checklists={checklists}
          selectedDate={selectedDate}
          onSelectDate={onSelectDate}
          onNavigate={onNavigate}
          profile={profile}
        />
      )}

      {activeSubTab === 'ai_audit' && (
        <AiAuditView
          lines={lines}
          checklists={checklists}
          profile={profile}
          onAddTodo={onAddTodo}
        />
      )}

      {activeSubTab === 'efficiency_trends' && (
        <>
          {/* Header Card with 'Single Month' vs 'Comparative' View Toggle */}
          <div className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#dceceb] text-[#176f78]">
                    Executive IE Performance
                  </span>
                  <span className="text-xs text-[#527078]">Monthly Factory Benchmark</span>
                </div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase text-[#17343a] tracking-tight">
                  {kpiViewMode === 'comparative'
                    ? 'Comparative Monthly KPI Analysis'
                    : 'Monthly Efficiency & Output Analysis'}
                </h1>
                <p className="text-xs sm:text-sm text-[#527078] mt-1">
                  {kpiViewMode === 'comparative'
                    ? 'Side-by-side performance comparison of September 2026 vs. August 2026 across line efficiency, output volumes, absenteeism, and buyer shares.'
                    : 'Historical daily trends, buyer performance matrix, line balance stability, and monthly learning curves.'}
                </p>
              </div>

              {/* Controls: Single vs Comparative Toggle + Month Selector */}
              <div className="flex flex-wrap items-center gap-3">
                {/* View Mode Toggle Segmented Control */}
                <div
                  id="monthly-kpi-view-toggle"
                  className="flex items-center gap-1 bg-[#f1eee6] p-1 rounded-2xl border border-[#d9d2c2]"
                >
                  <button
                    id="toggle-single-month-btn"
                    onClick={() => setKpiViewMode('single')}
                    aria-pressed={kpiViewMode === 'single'}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      kpiViewMode === 'single'
                        ? 'bg-white text-[#17343a] shadow-2xs font-extrabold'
                        : 'text-[#527078] hover:text-[#17343a]'
                    }`}
                  >
                    Single Month
                  </button>

                  <button
                    id="toggle-comparative-btn"
                    onClick={() => setKpiViewMode('comparative')}
                    aria-pressed={kpiViewMode === 'comparative'}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      kpiViewMode === 'comparative'
                        ? 'bg-[#176f78] text-white shadow-xs font-extrabold'
                        : 'text-[#527078] hover:text-[#17343a]'
                    }`}
                  >
                    <GitCompare className="w-3.5 h-3.5" />
                    <span>Comparative</span>
                  </button>
                </div>

                {/* Month Navigator */}
                <div className="flex items-center gap-1 bg-[#f1eee6] p-1 rounded-2xl border border-[#d9d2c2]">
                  <button
                    title="Previous Month"
                    className="p-1.5 rounded-xl hover:bg-[#e7e1d5] text-[#17343a] cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-2.5 text-xs font-bold text-[#17343a] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#176f78]" />
                    {selectedMonth}
                  </span>
                  <button
                    title="Next Month"
                    className="p-1.5 rounded-xl hover:bg-[#e7e1d5] text-[#17343a] cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* View 1: SINGLE MONTH KPI CARDS */}
            {kpiViewMode === 'single' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-[#e7e1d5]">
                <div className="p-3.5 rounded-xl bg-[#f1eee6] border border-[#d9d2c2]">
                  <span className="text-[10px] text-[#527078] font-bold uppercase">Monthly Avg Efficiency</span>
                  <div className="font-display text-2xl font-bold text-[#176f78] font-mono-numbers">86.8%</div>
                  <span className="text-[10px] text-emerald-600 font-bold">+1.8% vs Target</span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#f1eee6] border border-[#d9d2c2]">
                  <span className="text-[10px] text-[#527078] font-bold uppercase">Monthly Output MTD</span>
                  <div className="font-display text-2xl font-bold text-[#17343a] font-mono-numbers">92,100</div>
                  <span className="text-[10px] text-[#527078]">Finished Garments</span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#f1eee6] border border-[#d9d2c2]">
                  <span className="text-[10px] text-[#527078] font-bold uppercase">Avg Absenteeism</span>
                  <div className="font-display text-2xl font-bold text-rose-600 font-mono-numbers">5.8%</div>
                  <span className="text-[10px] text-emerald-600 font-bold">Within 7% threshold</span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#f1eee6] border border-[#d9d2c2]">
                  <span className="text-[10px] text-[#527078] font-bold uppercase">Top Line Benchmark</span>
                  <div className="font-display text-2xl font-bold text-[#17343a]">Line 24</div>
                  <span className="text-[10px] text-emerald-600 font-bold font-mono-numbers">92.0% Monthly Avg</span>
                </div>
              </div>
            )}

            {/* View 2: COMPARATIVE KPI METRIC CARDS (Current vs Previous Month) */}
            {kpiViewMode === 'comparative' && (
              <div className="mt-6 pt-5 border-t border-[#e7e1d5] space-y-4">
                {/* Comparison Header Ribbon */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-[#dceceb] border border-[#176f78]/20 text-xs">
                  <div className="flex items-center gap-2">
                    <GitCompare className="w-4 h-4 text-[#176f78]" />
                    <span className="font-bold text-[#17343a]">
                      Baseline: <strong>September 2026</strong> (Current) vs. <strong>August 2026</strong> (Previous Month)
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveSubTab('ai_audit')}
                    className="flex items-center gap-1 font-bold text-[#176f78] hover:underline cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#176f78]" />
                    <span>Run AI Comparative Diagnosis</span>
                  </button>
                </div>

                {/* 6 Side-by-side Comparative Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* KPI 1: Efficiency */}
                  <div className="p-4 rounded-xl bg-[#f1eee6] border border-[#d9d2c2]">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#527078] font-bold uppercase">Monthly Avg Efficiency</span>
                      <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        +3.4%
                      </span>
                    </div>
                    <div className="flex items-baseline gap-3 mt-2">
                      <div>
                        <div className="text-[10px] text-[#527078] font-bold">CURRENT (SEPT)</div>
                        <div className="font-display text-2xl font-extrabold text-[#176f78] font-mono-numbers">86.8%</div>
                      </div>
                      <div className="text-slate-400 font-bold">vs</div>
                      <div>
                        <div className="text-[10px] text-[#527078]">PREVIOUS (AUG)</div>
                        <div className="font-display text-xl font-bold text-slate-600 font-mono-numbers">83.4%</div>
                      </div>
                    </div>
                    <div className="text-[10px] text-[#527078] mt-1.5">
                      Target 85.0% achieved (+1.8% over target benchmark)
                    </div>
                  </div>

                  {/* KPI 2: Production Volume */}
                  <div className="p-4 rounded-xl bg-[#f1eee6] border border-[#d9d2c2]">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#527078] font-bold uppercase">Total Garment Output (MTD)</span>
                      <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        +8.9%
                      </span>
                    </div>
                    <div className="flex items-baseline gap-3 mt-2">
                      <div>
                        <div className="text-[10px] text-[#527078] font-bold">CURRENT (SEPT)</div>
                        <div className="font-display text-2xl font-extrabold text-[#17343a] font-mono-numbers">92,100</div>
                      </div>
                      <div className="text-slate-400 font-bold">vs</div>
                      <div>
                        <div className="text-[10px] text-[#527078]">PREVIOUS (AUG)</div>
                        <div className="font-display text-xl font-bold text-slate-600 font-mono-numbers">84,600</div>
                      </div>
                    </div>
                    <div className="text-[10px] text-emerald-600 font-bold mt-1.5">
                      +7,500 finished garments gain
                    </div>
                  </div>

                  {/* KPI 3: Absenteeism Rate */}
                  <div className="p-4 rounded-xl bg-[#f1eee6] border border-[#d9d2c2]">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#527078] font-bold uppercase">Operator Absenteeism</span>
                      <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <ArrowDownRight className="w-3.5 h-3.5" />
                        -1.4% (Improved)
                      </span>
                    </div>
                    <div className="flex items-baseline gap-3 mt-2">
                      <div>
                        <div className="text-[10px] text-[#527078] font-bold">CURRENT (SEPT)</div>
                        <div className="font-display text-2xl font-extrabold text-emerald-700 font-mono-numbers">5.8%</div>
                      </div>
                      <div className="text-slate-400 font-bold">vs</div>
                      <div>
                        <div className="text-[10px] text-[#527078]">PREVIOUS (AUG)</div>
                        <div className="font-display text-xl font-bold text-slate-600 font-mono-numbers">7.2%</div>
                      </div>
                    </div>
                    <div className="text-[10px] text-[#527078] mt-1.5">
                      Threshold ≤ 7.0% met across all sewing units
                    </div>
                  </div>

                  {/* KPI 4: Earned Standard Allowed Hours (SAH) */}
                  <div className="p-4 rounded-xl bg-[#f1eee6] border border-[#d9d2c2]">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#527078] font-bold uppercase">Earned SAH (Standard Hours)</span>
                      <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        +12.5%
                      </span>
                    </div>
                    <div className="flex items-baseline gap-3 mt-2">
                      <div>
                        <div className="text-[10px] text-[#527078] font-bold">CURRENT (SEPT)</div>
                        <div className="font-display text-2xl font-extrabold text-[#176f78] font-mono-numbers">1,151 hrs</div>
                      </div>
                      <div className="text-slate-400 font-bold">vs</div>
                      <div>
                        <div className="text-[10px] text-[#527078]">PREVIOUS (AUG)</div>
                        <div className="font-display text-xl font-bold text-slate-600 font-mono-numbers">1,023 hrs</div>
                      </div>
                    </div>
                    <div className="text-[10px] text-[#527078] mt-1.5">
                      +128 hours productive standard content delivered
                    </div>
                  </div>

                  {/* KPI 5: Target Benchmark Adherence */}
                  <div className="p-4 rounded-xl bg-[#f1eee6] border border-[#d9d2c2]">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#527078] font-bold uppercase">Target Adherence Rate</span>
                      <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        +5.5%
                      </span>
                    </div>
                    <div className="flex items-baseline gap-3 mt-2">
                      <div>
                        <div className="text-[10px] text-[#527078] font-bold">CURRENT (SEPT)</div>
                        <div className="font-display text-2xl font-extrabold text-[#17343a] font-mono-numbers">91.5%</div>
                      </div>
                      <div className="text-slate-400 font-bold">vs</div>
                      <div>
                        <div className="text-[10px] text-[#527078]">PREVIOUS (AUG)</div>
                        <div className="font-display text-xl font-bold text-slate-600 font-mono-numbers">86.0%</div>
                      </div>
                    </div>
                    <div className="text-[10px] text-[#527078] mt-1.5">
                      Shift production target met on 15 of 16 days
                    </div>
                  </div>

                  {/* KPI 6: Defect Rate / DHU */}
                  <div className="p-4 rounded-xl bg-[#f1eee6] border border-[#d9d2c2]">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#527078] font-bold uppercase">End-of-Line DHU (Defects)</span>
                      <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <ArrowDownRight className="w-3.5 h-3.5" />
                        -0.8% (Quality Gain)
                      </span>
                    </div>
                    <div className="flex items-baseline gap-3 mt-2">
                      <div>
                        <div className="text-[10px] text-[#527078] font-bold">CURRENT (SEPT)</div>
                        <div className="font-display text-2xl font-extrabold text-emerald-700 font-mono-numbers">1.7%</div>
                      </div>
                      <div className="text-slate-400 font-bold">vs</div>
                      <div>
                        <div className="text-[10px] text-[#527078]">PREVIOUS (AUG)</div>
                        <div className="font-display text-xl font-bold text-slate-600 font-mono-numbers">2.5%</div>
                      </div>
                    </div>
                    <div className="text-[10px] text-emerald-700 font-bold mt-1.5">
                      Significant reduction in skip-stitch and puckering
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SINGLE MONTH: Daily Trend Chart */}
          {kpiViewMode === 'single' && (
            <div className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-display text-lg sm:text-xl font-bold uppercase text-[#17343a] tracking-tight">
                    Daily Efficiency Trend vs 85% Benchmark
                  </h2>
                  <p className="text-xs text-[#527078]">
                    Daily factory-wide production efficiency percentage across all sewing units
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#dceceb] text-[#176f78]">
                  Target: 85.0%
                </span>
              </div>

              {/* SVG Daily Chart */}
              <div className="h-56 w-full relative pt-4">
                <svg viewBox="0 0 700 150" className="w-full h-full overflow-visible">
                  <line x1="40" y1="20" x2="680" y2="20" stroke="#e7e1d5" strokeDasharray="3 3" />
                  <line x1="40" y1="60" x2="680" y2="60" stroke="#e7e1d5" strokeDasharray="3 3" />
                  <line x1="40" y1="100" x2="680" y2="100" stroke="#e7e1d5" strokeDasharray="3 3" />

                  <line x1="40" y1="50" x2="680" y2="50" stroke="#e6813e" strokeWidth="1.5" strokeDasharray="4 4" />
                  <text x="630" y="44" fontSize="9" fill="#e6813e" fontWeight="bold">85% TARGET</text>

                  <text x="10" y="24" fontSize="9" fill="#527078">95%</text>
                  <text x="10" y="64" fontSize="9" fill="#527078">85%</text>
                  <text x="10" y="104" fontSize="9" fill="#527078">75%</text>

                  {currentMonthHistory.map((item, i) => {
                    const x = 50 + i * 40;
                    const height = (item.eff - 70) * 4;
                    const y = 120 - height;
                    const isOverTarget = item.eff >= 85;

                    return (
                      <g key={item.day} className="cursor-pointer group">
                        <rect
                          x={x}
                          y={y}
                          width="22"
                          height={height}
                          rx="4"
                          fill={isOverTarget ? '#176f78' : '#e6813e'}
                          className="transition-opacity hover:opacity-80"
                        />
                        <text
                          x={x + 11}
                          y={y - 5}
                          fontSize="8"
                          fontWeight="bold"
                          fill="#17343a"
                          textAnchor="middle"
                          className="font-mono-numbers opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          {item.eff}%
                        </text>
                        <text
                          x={x + 11}
                          y="136"
                          fontSize="9"
                          fill="#527078"
                          textAnchor="middle"
                          fontFamily="IBM Plex Mono"
                        >
                          {item.day}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          )}

          {/* COMPARATIVE: Dual Series Daily Chart (Current Month vs Previous Month) */}
          {kpiViewMode === 'comparative' && (
            <div className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] p-5 sm:p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="font-display text-lg sm:text-xl font-bold uppercase text-[#17343a] tracking-tight flex items-center gap-2">
                    <GitCompare className="w-5 h-5 text-[#176f78]" />
                    <span>Daily Efficiency Progression: September vs. August</span>
                  </h2>
                  <p className="text-xs text-[#527078]">
                    Day-by-day factory output run rate comparing current month progress with the prior month
                  </p>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 text-xs font-bold">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-[#176f78]" />
                    <span className="text-[#17343a]">Sept 2026 (Current)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-[#c9982f]" />
                    <span className="text-slate-600">Aug 2026 (Previous)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#e6813e]">
                    <span className="w-4 h-0.5 border-t-2 border-dashed border-[#e6813e]" />
                    <span>85% Benchmark</span>
                  </div>
                </div>
              </div>

              {/* SVG Comparative Chart */}
              <div className="h-60 w-full relative pt-4">
                <svg viewBox="0 0 700 160" className="w-full h-full overflow-visible">
                  {/* Grid Lines */}
                  <line x1="40" y1="20" x2="680" y2="20" stroke="#e7e1d5" strokeDasharray="3 3" />
                  <line x1="40" y1="60" x2="680" y2="60" stroke="#e7e1d5" strokeDasharray="3 3" />
                  <line x1="40" y1="100" x2="680" y2="100" stroke="#e7e1d5" strokeDasharray="3 3" />

                  {/* Benchmark 85% Line */}
                  <line x1="40" y1="50" x2="680" y2="50" stroke="#e6813e" strokeWidth="1.5" strokeDasharray="4 4" />
                  <text x="630" y="44" fontSize="9" fill="#e6813e" fontWeight="bold">85% TARGET</text>

                  {/* Axis Y Labels */}
                  <text x="10" y="24" fontSize="9" fill="#527078">95%</text>
                  <text x="10" y="64" fontSize="9" fill="#527078">85%</text>
                  <text x="10" y="104" fontSize="9" fill="#527078">75%</text>

                  {/* Dual Bars for Each Day */}
                  {currentMonthHistory.map((curr, i) => {
                    const prev = previousMonthHistory[i] || { eff: 80, pcs: 4000 };
                    const groupX = 46 + i * 40;

                    // Current Month Bar (Teal)
                    const currHeight = (curr.eff - 70) * 3.8;
                    const currY = 125 - currHeight;

                    // Previous Month Bar (Gold/Bronze)
                    const prevHeight = (prev.eff - 70) * 3.8;
                    const prevY = 125 - prevHeight;

                    return (
                      <g key={curr.day} className="cursor-pointer group">
                        {/* Previous Month Bar */}
                        <rect
                          x={groupX}
                          y={prevY}
                          width="12"
                          height={prevHeight}
                          rx="3"
                          fill="#c9982f"
                          opacity="0.85"
                          className="hover:opacity-100 transition-opacity"
                        />

                        {/* Current Month Bar */}
                        <rect
                          x={groupX + 14}
                          y={currY}
                          width="12"
                          height={currHeight}
                          rx="3"
                          fill="#176f78"
                          className="hover:opacity-100 transition-opacity"
                        />

                        {/* Hover Tooltip showing delta */}
                        <text
                          x={groupX + 13}
                          y={Math.min(currY, prevY) - 6}
                          fontSize="8"
                          fontWeight="bold"
                          fill="#17343a"
                          textAnchor="middle"
                          className="font-mono-numbers opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          +{(curr.eff - prev.eff).toFixed(1)}%
                        </text>

                        {/* Day Label */}
                        <text
                          x={groupX + 13}
                          y="142"
                          fontSize="9"
                          fill="#527078"
                          textAnchor="middle"
                          fontFamily="IBM Plex Mono"
                        >
                          D{curr.day}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              <div className="mt-3 p-3 rounded-xl bg-[#f1eee6] border border-[#d9d2c2] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#527078]">
                <span>
                  <strong>Comparative Insight:</strong> Daily variance indicates consistent positive gains across Days 4 through 16, driven by reduced morning line ramp-up time.
                </span>
                <span className="font-bold text-emerald-700 font-mono-numbers">
                  Net Period Gain: +3.4% Points
                </span>
              </div>
            </div>
          )}

          {/* Buyer Breakdown & Line Comparative / Single Rankings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Buyer Breakdown */}
            <div className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] p-5 shadow-xs">
              <h2 className="font-display text-lg font-bold uppercase text-[#17343a] mb-1">
                {kpiViewMode === 'comparative'
                  ? 'Buyer Volume & Efficiency Comparison'
                  : 'Buyer-wise Efficiency & Volume Share'}
              </h2>
              <p className="text-xs text-[#527078] mb-4">
                {kpiViewMode === 'comparative'
                  ? 'Growth trajectories and efficiency deltas by apparel buyer accounts'
                  : 'Aggregated output and average SAM by international apparel buyers'}
              </p>

              <div className="space-y-3">
                {kpiViewMode === 'single'
                  ? buyersSummary.map(b => (
                      <div
                        key={b.buyer}
                        className="p-3.5 rounded-xl border border-[#e7e1d5] bg-[#f1eee6]/50 flex items-center justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#17343a]">{b.buyer}</span>
                            <span className="text-[10px] text-[#527078] bg-[#f1eee6] px-1.5 py-0.2 rounded font-mono-numbers">
                              {b.lines}
                            </span>
                          </div>
                          <div className="text-xs text-[#527078] mt-0.5">
                            Total Output: <strong className="text-[#17343a] font-mono-numbers">{(b.totalPcs ?? 0).toLocaleString()}</strong> pcs • SMV: {b.smv.toFixed(2)} min
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-display text-lg font-bold text-[#176f78] font-mono-numbers">
                            {b.avgEff}%
                          </span>
                          <div className="text-[10px] text-[#527078]">Avg Efficiency</div>
                        </div>
                      </div>
                    ))
                  : comparativeBuyers.map(b => (
                      <div
                        key={b.buyer}
                        className="p-3.5 rounded-xl border border-[#e7e1d5] bg-[#f1eee6]/50 flex items-center justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#17343a]">{b.buyer}</span>
                            <span className="text-[10px] text-[#527078] bg-[#f1eee6] px-1.5 py-0.2 rounded font-mono-numbers">
                              {b.lines}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                              {b.pcsDeltaPct} pcs
                            </span>
                          </div>
                          <div className="text-xs text-[#527078] mt-0.5">
                            Output: <strong className="text-[#17343a] font-mono-numbers">{(b.currPcs ?? 0).toLocaleString()}</strong> (vs {(b.prevPcs ?? 0).toLocaleString()})
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="flex items-center gap-1.5 justify-end">
                            <span className="font-display text-lg font-bold text-[#176f78] font-mono-numbers">
                              {b.currEff}%
                            </span>
                            <span className="text-xs font-bold text-emerald-600 font-mono-numbers">
                              ({b.effDelta})
                            </span>
                          </div>
                          <div className="text-[10px] text-[#527078]">vs {b.prevEff}% Aug</div>
                        </div>
                      </div>
                    ))}
              </div>
            </div>

            {/* Line League Table / Comparative Variance */}
            <div className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] p-5 shadow-xs">
              <h2 className="font-display text-lg font-bold uppercase text-[#17343a] mb-1">
                {kpiViewMode === 'comparative'
                  ? 'Sewing Line Month-over-Month Variance'
                  : 'Monthly Sewing Lines Ranking'}
              </h2>
              <p className="text-xs text-[#527078] mb-4">
                {kpiViewMode === 'comparative'
                  ? 'Comparative line balance, target adherence, and efficiency progression'
                  : 'Benchmark ranking by consistency, target adherence, and absenteeism'}
              </p>

              <div className="space-y-3">
                {kpiViewMode === 'single'
                  ? lines.map((line, idx) => (
                      <div
                        key={line.id}
                        className="p-3.5 rounded-xl border border-[#e7e1d5] bg-[#f1eee6]/50 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-lg bg-[#dceceb] text-[#176f78] font-bold font-display text-sm flex items-center justify-center shrink-0">
                            #{idx + 1}
                          </span>
                          <div>
                            <div className="font-bold text-xs text-[#17343a]">
                              Line {line.lineNo} ({line.style})
                            </div>
                            <div className="text-[10px] text-[#527078]">
                              {line.floor} • Buyer: {line.buyer}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-display text-base font-bold text-[#176f78] font-mono-numbers">
                            {line.efficiency}%
                          </div>
                          <div className="text-[10px] text-emerald-600 font-bold">
                            Target Met
                          </div>
                        </div>
                      </div>
                    ))
                  : comparativeLines.map(line => (
                      <div
                        key={line.lineNo}
                        className="p-3.5 rounded-xl border border-[#e7e1d5] bg-[#f1eee6]/50 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-lg bg-[#176f78] text-white font-bold font-display text-sm flex items-center justify-center shrink-0">
                            L{line.lineNo}
                          </span>
                          <div>
                            <div className="font-bold text-xs text-[#17343a]">
                              Line {line.lineNo} ({line.style})
                            </div>
                            <div className="text-[10px] text-[#527078]">
                              Aug: {line.prevEff}% • Sept: {line.currEff}%
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="flex items-center gap-1.5 justify-end">
                            <span className="font-display text-base font-bold text-[#176f78] font-mono-numbers">
                              {line.currEff}%
                            </span>
                            <span className="inline-flex items-center text-xs font-bold text-emerald-600 font-mono-numbers bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                              <ArrowUpRight className="w-3 h-3" />
                              {line.diff}
                            </span>
                          </div>
                          <div className="text-[10px] text-emerald-700 font-bold">
                            Productivity Enhanced
                          </div>
                        </div>
                      </div>
                    ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

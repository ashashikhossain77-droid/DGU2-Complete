/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Users,
  Layers,
  Clock,
  Target,
  CheckCircle2,
  XCircle,
  RotateCw,
  Award,
  FileSpreadsheet,
  Calendar,
  ChevronLeft,
  ChevronRight,
  BarChart2,
  LayoutGrid,
  Upload
} from 'lucide-react';
import { LineEntry, DashboardLayout, UserProfile, RoleTier } from '../types';
import { calculateFactoryOverall, calculateLineMetrics } from '../utils';
import { DailyProductivityInsights } from './DailyProductivityInsights';
import { MorningHuddleTimer } from './MorningHuddleTimer';
import { QuickReportsWidget } from './QuickReportsWidget';
import { ROLE_TIERS } from '../mockData';
import { motion, AnimatePresence } from 'motion/react';

interface DashboardProps {
  lines: LineEntry[];
  todayDate: string;
  activeDate?: string;
  onSelectDate?: (date: string) => void;
  layout: DashboardLayout;
  onNavigate: (tab: string) => void;
  onSelectLine: (lineNo: string) => void;
  checklistCompletion: number;
  checklistCounts?: {
    done: number;
    pending: number;
    notDone: number;
    total: number;
  };
  profile?: UserProfile;
  onOpenUserModal?: () => void;
  onOpenScorecard?: () => void;
  selectedLineNo?: string;
  onSaveLine?: (updatedLine: LineEntry) => void;
  onChecklistCompleted?: () => void;
  privacyMode?: boolean;
  roleTiers?: RoleTier[];
  onOpenDatabase?: (tab?: 'backup' | 'csv-import') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  lines,
  todayDate,
  activeDate,
  onSelectDate,
  layout,
  onNavigate,
  onSelectLine,
  checklistCompletion,
  checklistCounts = { done: 0, pending: 25, notDone: 0, total: 25 },
  profile,
  onOpenUserModal,
  onOpenScorecard,
  selectedLineNo = '18',
  onSaveLine,
  onChecklistCompleted,
  privacyMode = false,
  roleTiers,
  onOpenDatabase
}) => {
  const availableRoleTiers = roleTiers && roleTiers.length > 0 ? roleTiers : ROLE_TIERS;
  const currentTier =
    availableRoleTiers.find(t => t.id === (profile?.tierId || 'tier_0')) || availableRoleTiers[0];

  const effectiveDate = activeDate || todayDate;

  // Filter lines by selected date
  const displayLines = React.useMemo(() => {
    const dayLines = lines.filter(l => l.date === effectiveDate);
    return dayLines.length > 0 ? dayLines : lines;
  }, [lines, effectiveDate]);

  const factory = calculateFactoryOverall(displayLines);

  // Live Ticking Clock (updates every second)
  const [liveDate, setLiveDate] = React.useState<Date>(new Date());
  React.useEffect(() => {
    const timer = setInterval(() => {
      setLiveDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format live digital time: "11:46:16 AM"
  const formattedLiveTime = React.useMemo(() => {
    return liveDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  }, [liveDate]);

  // Format full live date string: "Thursday, September 17, 2026"
  const formattedFullLiveDate = React.useMemo(() => {
    return liveDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }, [liveDate]);

  // Dynamic Shift Progress calculation (08:00 - 17:00 shift)
  const shiftProgress = React.useMemo(() => {
    const hours = liveDate.getHours();
    const minutes = liveDate.getMinutes();
    const currentMinFromMidnight = hours * 60 + minutes;
    const shiftStartMin = 8 * 60; // 08:00
    const shiftEndMin = 17 * 60; // 17:00
    const totalShiftMin = shiftEndMin - shiftStartMin; // 540 min

    if (currentMinFromMidnight < shiftStartMin) {
      return {
        isBeforeShift: true,
        phaseName: 'Pre-Shift Line Preparation & Morning Top 5 Stand-Up',
        pct: 0,
        elapsedText: 'Pre-Shift (08:00 AM Start)',
        remainingText: 'Full 8h General Shift Ahead'
      };
    } else if (currentMinFromMidnight >= shiftEndMin) {
      return {
        isAfterShift: true,
        phaseName: 'Shift Completed • Evening IE Reconciliation',
        pct: 100,
        elapsedText: 'Full 8h Shift Completed',
        remainingText: 'General Shift Concluded'
      };
    } else {
      const elapsedMin = currentMinFromMidnight - shiftStartMin;
      const remainingMin = shiftEndMin - currentMinFromMidnight;
      const pct = Math.min(100, Math.round((elapsedMin / totalShiftMin) * 100));

      const elapsedH = Math.floor(elapsedMin / 60);
      const elapsedM = elapsedMin % 60;
      const remH = Math.floor(remainingMin / 60);
      const remM = remainingMin % 60;

      let phase = 'Active Sewing Output Run';
      if (elapsedMin < 60) phase = 'Hour 1 Target Pacing & Bottleneck Balancing';
      else if (elapsedMin < 240) phase = 'Peak Morning Production Drive';
      else if (elapsedMin < 300) phase = 'Mid-Shift Relief & Line Balancing';
      else if (elapsedMin < 480) phase = 'Afternoon Target Acceleration';
      else phase = 'Final Hour Output Reconciliation';

      return {
        phaseName: phase,
        pct,
        elapsedText: `${elapsedH}h ${elapsedM}m elapsed`,
        remainingText: `${remH}h ${remM}m remaining`
      };
    }
  }, [liveDate]);

  // Morning Huddle state & line status
  const [isHuddleOpen, setIsHuddleOpen] = React.useState(false);

  const activeLine = React.useMemo(() => {
    return lines.find(l => l.lineNo === selectedLineNo) || lines[0];
  }, [lines, selectedLineNo]);

  const hasHuddleToday = React.useMemo(() => {
    return lines.some(
      l => l.top5?.held === 'yes' || (l.remarks && l.remarks.toLowerCase().includes('huddle'))
    );
  }, [lines]);

  // Sync state & live timer for the 30s auto-update card
  const [syncTime, setSyncTime] = React.useState('07:22:20 AM');
  const [isSyncing, setIsSyncing] = React.useState(false);

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setSyncTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      const now = new Date();
      setSyncTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      );
      setIsSyncing(false);
    }, 600);
  };

  const formattedEyebrowDate = React.useMemo(() => {
    try {
      const d = new Date(todayDate);
      if (!isNaN(d.getTime())) {
        const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
        const day = d.getDate();
        const year = d.getFullYear();
        return `${month} ${day}, ${year}`;
      }
    } catch {}
    return 'SEP 17, 2026';
  }, [todayDate]);

  // Active Floor filter for Bottleneck Watchlist & Upcoming Style Changeovers
  const [selectedDashboardFloor, setSelectedDashboardFloor] = React.useState<string>('all');

  // Dynamic target baseline & variance
  const targetEffBaseline = displayLines.length > 10 ? 60.0 : 85.0;
  const effVariance = Math.round((factory.overallEfficiency - targetEffBaseline) * 10) / 10;
  const effVarianceText = effVariance >= 0 ? `+${effVariance}% vs ${targetEffBaseline}% Target` : `${effVariance}% vs ${targetEffBaseline}% Target`;
  const isEffPositive = effVariance >= 0;

  // Floor Level Aggregates (e.g. Padma, Meghna, Karnophuli, Korotoya, Shitalokshya, Turag)
  const floorSummaries = React.useMemo(() => {
    const map = new Map<string, {
      floor: string;
      lines: LineEntry[];
      targetProd: number;
      achievedProd: number;
      manpower: number;
      producedMin: number;
      availMin: number;
    }>();

    displayLines.forEach(l => {
      const fl = l.floor || 'Floor 01';
      if (!map.has(fl)) {
        map.set(fl, {
          floor: fl,
          lines: [],
          targetProd: 0,
          achievedProd: 0,
          manpower: 0,
          producedMin: 0,
          availMin: 0
        });
      }
      const entry = map.get(fl)!;
      entry.lines.push(l);
      entry.targetProd += l.targetProd;
      entry.achievedProd += l.achievedProd;
      entry.manpower += l.plannedMP;
      const m = calculateLineMetrics(l);
      entry.producedMin += m.standardProducedMinutes;
      entry.availMin += m.availableMinutes;
    });

    return Array.from(map.values()).map(e => {
      const eff = e.availMin > 0 ? Math.round((e.producedMin / e.availMin) * 1000) / 10 : 0;
      const variance = e.achievedProd - e.targetProd;
      return {
        ...e,
        efficiencyPct: eff,
        variancePcs: variance,
        lineNumbers: e.lines.map(l => l.lineNo)
      };
    });
  }, [displayLines]);

  // Circular gauge calculations
  const gaugeTheta = ((Math.min(checklistCompletion, 100) / 100) * 360 - 90) * (Math.PI / 180);
  const gaugeDotX = 50 + 38 * Math.cos(gaugeTheta);
  const gaugeDotY = 50 + 38 * Math.sin(gaugeTheta);

  // Hourly production simulation data
  const hourlyData = [
    { hour: '08-09', actual: 480, target: 550 },
    { hour: '09-10', actual: 560, target: 600 },
    { hour: '10-11', actual: 610, target: 600 },
    { hour: '11-12', actual: 630, target: 620 },
    { hour: '12-13', actual: 350, target: 400 }, // Lunch break shift transition
    { hour: '13-14', actual: 640, target: 620 },
    { hour: '14-15', actual: 670, target: 650 },
    { hour: '15-16', actual: 690, target: 660 },
    { hour: '16-17', actual: 210, target: 200 }
  ];

  return (
    <div className="space-y-6">
      {/* ────────────────────────────────────────────────────────── */}
      {/* EXECUTIVE OVERVIEW HEADER CARD: Live Clock & IE Command Pulse */}
      {/* ────────────────────────────────────────────────────────── */}
      {layout.showHero && (
        <section id="executive-overview-header-card" className="space-y-4">
          {/* Main Command Hero Container */}
          <div className="rounded-3xl bg-gradient-to-br from-[#103138] via-[#143e47] to-[#0c262b] bg-[#12363e] text-white border border-[#1b434b] p-5 sm:p-7 shadow-xl relative overflow-hidden space-y-6">
            {/* Ambient Subtle Glows */}
            <div className="absolute -right-24 -top-24 w-80 h-80 rounded-full bg-amber-300/10 blur-3xl pointer-events-none" />
            <div className="absolute -left-24 -bottom-24 w-80 h-80 rounded-full bg-blue-300/10 blur-3xl pointer-events-none" />

            {/* Top Row: Live Clock, Active Shift, User Role, and Telemetry Status */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 border-b border-white/10 pb-4 sm:pb-5 relative z-10">
              {/* Live Clock Section */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-[11px] sm:text-xs">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-[9px] sm:text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>LIVE SHIFT</span>
                  </span>
                  <span className="text-sky-200/90 font-medium">
                    {formattedFullLiveDate}
                  </span>
                  <span className="text-white/30 hidden sm:inline">•</span>
                  <span className="text-[11px] sm:text-xs font-bold text-amber-300 block sm:inline w-full sm:w-auto">
                    {shiftProgress.phaseName}
                  </span>
                </div>

                {/* Big Digital Monospace Clock */}
                <div className="flex items-baseline justify-between sm:justify-start gap-2 sm:gap-3 flex-wrap">
                  <span
                    id="hero-live-clock-digits"
                    className="font-mono-numbers text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-none drop-shadow-xs"
                  >
                    {formattedLiveTime}
                  </span>
                  <div className="text-[11px] sm:text-xs text-sky-200/90 font-mono-numbers flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                    <span>Shift: 8:00 AM - 5:00 PM</span>
                  </div>
                </div>

                {/* Dynamic Shift Progress Bar */}
                <div className="flex items-center gap-2 sm:gap-3 pt-1 max-w-md">
                  <div className="flex-1 h-2 bg-white/15 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${shiftProgress.pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-bold font-mono-numbers text-sky-200/90 whitespace-nowrap">
                    {shiftProgress.pct}% ({shiftProgress.elapsedText})
                  </span>
                </div>
              </div>

              {/* Right: Operational Role & Sync Status */}
              <div className="flex items-center gap-2 flex-wrap self-stretch sm:self-start lg:self-center justify-between sm:justify-start pt-1 sm:pt-0">
                <button
                  onClick={onOpenUserModal}
                  title="Click to view or switch Active System Role & Operational Tiers"
                  className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-all shadow-xs cursor-pointer flex-1 sm:flex-initial justify-center"
                >
                  <span
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full text-white text-[8px] sm:text-[9px] font-black flex items-center justify-center shrink-0"
                    style={{ backgroundColor: currentTier.color }}
                  >
                    {currentTier.shortCode}
                  </span>
                  <span className="truncate">
                    Role: <strong className="font-mono text-teal-300">{currentTier.systemRole}</strong>
                  </span>
                </button>

                {/* Telemetry Auto-Update Badge */}
                <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs text-sky-100 shrink-0">
                  <span className="text-[10px] sm:text-[11px] text-sky-200 font-mono-numbers">
                    Sync: {syncTime}
                  </span>
                  <button
                    onClick={handleManualSync}
                    title="Manual Floor Telemetry Ping"
                    className="p-0.5 sm:p-1 rounded-lg hover:bg-white/20 text-sky-200 hover:text-white transition-colors cursor-pointer"
                  >
                    <RotateCw className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isSyncing ? 'animate-spin text-teal-300' : ''}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Hero Main Content: 2-Column Command Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
              {/* Column 1 (Left 7 Cols): Factory Operational Pulse & Output Progress */}
              <div className="lg:col-span-7 space-y-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-300 block">
                    Executive Overview
                  </span>
                  <h2 className="font-display text-2xl sm:text-3xl font-black uppercase text-white tracking-tight leading-tight">
                    Industrial Engineering Command Center
                  </h2>
                  <p className="text-xs text-sky-100/80 mt-1 max-w-xl">
                    Real-time sewing line tracking, dynamic takt pitch pace, in-line WIP buffer compliance, and 10-minute Top 5 morning alignment.
                  </p>
                </div>

                {/* 3 Executive Metrics Banners: Responsive Layout for Mobile and Tablet */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 pt-1">
                  {/* 1. Factory Efficiency */}
                  <div
                    id="executive-metric-efficiency"
                    className="p-3 sm:p-3.5 rounded-2xl bg-white/10 border border-white/15 flex flex-col justify-between space-y-1.5 transition-all"
                  >
                    <div className="flex items-center justify-between text-[11px] text-sky-200 font-bold uppercase tracking-wider">
                      <span>Plant Efficiency</span>
                      <div className="w-6 h-6 rounded-lg bg-teal-400/20 flex items-center justify-center">
                        <TrendingUp className="w-3.5 h-3.5 text-teal-300" />
                      </div>
                    </div>
                    <div className="flex items-baseline justify-between sm:block">
                      <div className="text-2xl sm:text-3xl font-black font-mono-numbers text-white leading-none">
                        {factory.overallEfficiency}%
                      </div>
                      <span className={`text-[10px] sm:text-[11px] font-bold sm:mt-1.5 block ${isEffPositive ? 'text-emerald-300' : 'text-amber-300'}`}>
                        {effVarianceText}
                      </span>
                    </div>
                  </div>

                  {/* 2. Output Volume */}
                  <div
                    id="executive-metric-output"
                    className="p-3 sm:p-3.5 rounded-2xl bg-white/10 border border-white/15 flex flex-col justify-between space-y-1.5 transition-all"
                  >
                    <div className="flex items-center justify-between text-[11px] text-sky-200 font-bold uppercase tracking-wider">
                      <span>Output vs Target</span>
                      <div className="w-6 h-6 rounded-lg bg-amber-400/20 flex items-center justify-center">
                        <Target className="w-3.5 h-3.5 text-amber-300" />
                      </div>
                    </div>
                    <div className="flex items-baseline justify-between sm:block">
                      <div className="text-2xl sm:text-3xl font-black font-mono-numbers text-white leading-none">
                        {factory.totalAchievedProd.toLocaleString()}
                      </div>
                      <span className="text-[10px] sm:text-[11px] text-sky-200 font-mono-numbers sm:mt-1.5 block">
                        / {factory.totalTargetProd.toLocaleString()} pcs target
                      </span>
                    </div>
                  </div>

                  {/* 3. Manpower & Attendance */}
                  <div
                    id="executive-metric-attendance"
                    className="p-3 sm:p-3.5 rounded-2xl bg-white/10 border border-white/15 flex flex-col justify-between space-y-1.5 transition-all sm:col-span-2 lg:col-span-1"
                  >
                    <div className="flex items-center justify-between text-[11px] text-sky-200 font-bold uppercase tracking-wider">
                      <span>Operator Attendance</span>
                      <div className="w-6 h-6 rounded-lg bg-emerald-400/20 flex items-center justify-center">
                        <Users className="w-3.5 h-3.5 text-emerald-300" />
                      </div>
                    </div>
                    <div className="flex items-baseline justify-between sm:block">
                      <div className="text-2xl sm:text-3xl font-black font-mono-numbers text-white leading-none">
                        {factory.attendanceRate}%
                      </div>
                      <span className="text-[10px] sm:text-[11px] text-sky-200 font-mono-numbers sm:mt-1.5 block">
                        {factory.totalPresent} Present • {factory.totalAbsent} Absent
                      </span>
                    </div>
                  </div>
                </div>

                {/* Active Lines & WIP Status Footer */}
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs text-sky-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>
                      <strong>{factory.activeLinesCount} Sewing Lines</strong> Active
                      <span className="text-sky-200/80 ml-1 font-mono-numbers text-[11px]">
                        ({floorSummaries.length > 0 ? `${floorSummaries.length} floors` : 'Debonair Unit-2'} • {lines.slice(0, 6).map(l => `L${l.lineNo}`).join(', ')}{lines.length > 6 ? ` +${lines.length - 6} more` : ''})
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono-numbers text-[11px]">
                    <span>Total In-Line WIP: <strong className="text-white">{factory.totalWip.toLocaleString()} pcs</strong></span>
                  </div>
                </div>
              </div>

              {/* Column 2 (Right 5 Cols): Morning Huddle & Protocol Readiness */}
              <div className="lg:col-span-5 flex flex-col justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white/10 border border-white/20">
                {/* Morning Huddle Card */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-300 animate-pulse" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                        10-Minute Morning Huddle
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      hasHuddleToday ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                    }`}>
                      {hasHuddleToday ? 'Meeting Recorded' : 'Stand-up Due'}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-display text-lg font-bold text-white uppercase tracking-tight">
                      Top 5 Operational Alignment
                    </h3>
                    <p className="text-xs text-sky-100/80 mt-0.5 leading-relaxed">
                      10-minute stand-up with Line Supervisors to review bottlenecks, hourly piece targets, and record key takeaways directly into Line Remarks.
                    </p>
                  </div>

                  {/* Huddle Action Button */}
                  <button
                    id="btn-launch-morning-huddle"
                    type="button"
                    onClick={() => setIsHuddleOpen(true)}
                    className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-[#17343a] font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
                  >
                    <Clock className="w-4 h-4 fill-current" />
                    <span>Start 10-Min Morning Huddle</span>
                  </button>

                  {/* Current Active Line Remarks Preview */}
                  <div className="p-2.5 rounded-xl bg-black/20 border border-white/10 text-[11px] space-y-1">
                    <div className="flex items-center justify-between text-sky-200">
                      <span>Active Line: <strong>Line {activeLine.lineNo} ({activeLine.style})</strong></span>
                      <button
                        type="button"
                        onClick={() => setIsHuddleOpen(true)}
                        className="text-amber-300 hover:underline font-bold text-[10px]"
                      >
                        Edit Remarks →
                      </button>
                    </div>
                    <p className="text-white/80 line-clamp-2 italic">
                      "{activeLine.remarks || 'No remarks recorded yet. Start huddle to log takeaways.'}"
                    </p>
                  </div>
                </div>

                {/* Protocol Compliance Mini Dial */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="38" stroke="currentColor" strokeWidth="9" fill="transparent" className="text-white/15" />
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          stroke="currentColor"
                          strokeWidth="9"
                          fill="transparent"
                          strokeDasharray={238.76}
                          strokeDashoffset={238.76 * (1 - Math.min(checklistCompletion, 100) / 100)}
                          strokeLinecap="round"
                          className="text-amber-400 transition-all duration-700"
                        />
                      </svg>
                      <span className="absolute text-xs font-black font-mono-numbers text-white">
                        {checklistCompletion}%
                      </span>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-white">
                        Protocol Compliance
                      </div>
                      <div className="text-[11px] text-sky-200/80">
                        {checklistCounts.done} Done • {checklistCounts.pending} Pending
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onNavigate('checklist')}
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors shrink-0 cursor-pointer"
                  >
                    Activity Tracking →
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Action Navigation Bar */}
            {layout.showQuickActions && (
              <div className="pt-3 sm:pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs relative z-10">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar -mx-1 px-1 sm:mx-0 sm:px-0 flex-nowrap sm:flex-wrap">
                  <button
                    type="button"
                    onClick={() => setIsHuddleOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold transition-colors cursor-pointer shrink-0 text-xs"
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-300" />
                    <span>Morning Huddle</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onNavigate('checklist')}
                    className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-colors cursor-pointer shrink-0 text-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Daily Tracking ({checklistCounts.done}/{checklistCounts.total})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onNavigate('reports')}
                    className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-colors cursor-pointer shrink-0 text-xs"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-teal-300" />
                    <span>Reports</span>
                  </button>

                  {onOpenScorecard && (
                    <button
                      type="button"
                      onClick={onOpenScorecard}
                      className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-colors cursor-pointer shrink-0 text-xs"
                    >
                      <Award className="w-3.5 h-3.5 text-amber-300" />
                      <span>IE Scorecard</span>
                    </button>
                  )}

                  {onOpenDatabase && (
                    <button
                      id="dashboard-quick-import-data-btn"
                      type="button"
                      onClick={() => onOpenDatabase('csv-import')}
                      className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 font-bold transition-colors cursor-pointer shrink-0 text-xs"
                      title="Import Line Configurations from Excel / CSV"
                    >
                      <Upload className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Import Data</span>
                    </button>
                  )}
                </div>

                <span className="text-[10px] sm:text-[11px] text-sky-200/80 font-mono-numbers">
                  Shift: 8:00 AM - 5:00 PM • 8.0 Std Hours
                </span>
              </div>
            )}
          </div>

          {/* Status Counts Row */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`status-counts-${effectiveDate}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3"
            >
              {/* Card 1: DONE */}
              <div className="rounded-2xl bg-white border border-[#e7e1d5] p-4 shadow-2xs hover:shadow-xs transition-shadow">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wide">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <span>DONE</span>
                </div>
                <div className="text-4xl font-extrabold font-mono-numbers text-[#17343a] mt-2">
                  {checklistCounts.done}
                </div>
                <div className="text-xs text-[#527078] mt-1 font-medium">
                  of {checklistCounts.total} IE tasks verified
                </div>
              </div>

              {/* Card 2: PENDING */}
              <div className="rounded-2xl bg-white border border-[#e7e1d5] p-4 shadow-2xs hover:shadow-xs transition-shadow">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wide">
                  <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <span>PENDING</span>
                </div>
                <div className="text-4xl font-extrabold font-mono-numbers text-[#17343a] mt-2">
                  {checklistCounts.pending}
                </div>
                <div className="text-xs text-[#527078] mt-1 font-medium">
                  tasks awaiting floor audit
                </div>
              </div>

              {/* Card 3: NOT DONE */}
              <div className="rounded-2xl bg-white border border-[#e7e1d5] p-4 shadow-2xs hover:shadow-xs transition-shadow">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-700 uppercase tracking-wide">
                  <div className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center">
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                  </div>
                  <span>NOT DONE</span>
                </div>
                <div className="text-4xl font-extrabold font-mono-numbers text-[#17343a] mt-2">
                  {checklistCounts.notDone}
                </div>
                <div className="text-xs text-[#527078] mt-1 font-medium">
                  marked non-compliant
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </section>
      )}

      {/* Morning Huddle 10-Minute Timer Modal */}
      <MorningHuddleTimer
        isOpen={isHuddleOpen}
        onClose={() => setIsHuddleOpen(false)}
        lines={lines}
        selectedLineNo={selectedLineNo}
        onSelectLineNo={onSelectLine}
        onSaveLineRemarks={(lineId, remarks, top5Notes) => {
          const lineToUpdate = lines.find(l => l.id === lineId);
          if (lineToUpdate && onSaveLine) {
            const updated: LineEntry = {
              ...lineToUpdate,
              remarks: remarks,
              top5: {
                ...lineToUpdate.top5,
                held: 'yes',
                notes: top5Notes || remarks
              }
            };
            onSaveLine(updated);
          }
        }}
        onChecklistCompleted={onChecklistCompleted}
      />

      {/* 4 Key Metrics Cards with framer-motion slide-in animation */}
      {layout.showStats && (
        <AnimatePresence mode="wait">
          <motion.div
            key={`summary-cards-${effectiveDate}`}
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -28 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="flex overflow-x-auto snap-x snap-mandatory sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-2 sm:pb-0 no-scrollbar -mx-2 sm:mx-0 px-2 sm:px-0"
          >
            {/* 1. Overall Efficiency */}
            <div className="w-[82vw] max-w-[300px] shrink-0 snap-start sm:w-auto sm:max-w-none sm:shrink rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] p-4 sm:p-5 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-[#527078] font-bold uppercase tracking-wider mb-2">
                <span>Factory Efficiency</span>
                <div className="w-8 h-8 rounded-xl bg-[#dceceb] text-[#176f78] flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-3xl sm:text-4xl font-bold text-[#17343a] tracking-tight">
                  {factory.overallEfficiency}%
                </span>
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded border ${
                  isEffPositive
                    ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
                    : 'text-amber-700 bg-amber-50 border-amber-200'
                }`}>
                  {effVarianceText}
                </span>
              </div>
              <div className="mt-3">
                <div className="h-2 w-full rounded-full bg-[#f1eee6] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#176f78] transition-all duration-500"
                    style={{ width: `${Math.min(factory.overallEfficiency, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] text-[#527078] mt-1 font-mono-numbers">
                  <span>Produced: {(factory.totalProducedMinutes ?? 0).toLocaleString()} min</span>
                  <span>Available: {(factory.totalAvailableMinutes ?? 0).toLocaleString()} min</span>
                </div>
              </div>
            </div>

            {/* 2. Total Achieved Production */}
            <div className="w-[82vw] max-w-[300px] shrink-0 snap-start sm:w-auto sm:max-w-none sm:shrink rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] p-4 sm:p-5 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-[#527078] font-bold uppercase tracking-wider mb-2">
                <span>Total Production Output</span>
                <div className="w-8 h-8 rounded-xl bg-[#f8e5d7] text-[#e6813e] flex items-center justify-center">
                  <Target className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-3xl sm:text-4xl font-bold text-[#17343a] tracking-tight">
                  {(factory.totalAchievedProd ?? 0).toLocaleString()}
                </span>
                <span className="text-xs text-[#527078] font-mono-numbers">
                  / {(factory.totalTargetProd ?? 0).toLocaleString()} Pcs
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-[#527078]">
                <span className="font-medium">Target Achievement</span>
                <span className="font-bold font-mono-numbers text-[#17343a]">
                  {Math.round((factory.totalAchievedProd / factory.totalTargetProd) * 100)}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-[#f1eee6] overflow-hidden mt-1">
                <div
                  className="h-full rounded-full bg-[#e6813e] transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      (factory.totalAchievedProd / factory.totalTargetProd) * 100,
                      100
                    )}%`
                  }}
                ></div>
              </div>
            </div>

            {/* 3. Manpower & Attendance */}
            <div className="w-[82vw] max-w-[300px] shrink-0 snap-start sm:w-auto sm:max-w-none sm:shrink rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] p-4 sm:p-5 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-[#527078] font-bold uppercase tracking-wider mb-2">
                <span>Sewing Manpower Attendance</span>
                <div className="w-8 h-8 rounded-xl bg-[#f5e9c8] text-[#c9982f] flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-3xl sm:text-4xl font-bold text-[#17343a] tracking-tight">
                  {factory.attendanceRate}%
                </span>
                <span className="text-xs text-[#527078]">Present Rate</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-[#527078]">
                  Present: <strong className="text-[#17343a] font-mono-numbers">{factory.totalPresent}</strong>
                </span>
                <span className="text-rose-600 font-bold">
                  Absent: <span className="font-mono-numbers">{factory.totalAbsent}</span>
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-[#f1eee6] overflow-hidden mt-1 flex">
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: `${factory.attendanceRate}%` }}
                ></div>
                <div
                  className="h-full bg-rose-400"
                  style={{ width: `${100 - factory.attendanceRate}%` }}
                ></div>
              </div>
            </div>

            {/* 4. Active Sewing Lines */}
            <div className="w-[82vw] max-w-[300px] shrink-0 snap-start sm:w-auto sm:max-w-none sm:shrink rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] p-4 sm:p-5 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-[#527078] font-bold uppercase tracking-wider mb-2">
                <span>Active Sewing Lines</span>
                <div className="w-8 h-8 rounded-xl bg-[#e5eaeb] text-[#3f5a60] flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-3xl sm:text-4xl font-bold text-[#17343a] tracking-tight">
                  {factory.activeLinesCount}
                </span>
                <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  100% Running
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-[#527078]">
                <span>In-Line Buffer WIP:</span>
                <span className="font-mono-numbers font-bold text-[#17343a]">
                  {(factory.totalWip ?? 0).toLocaleString()} pcs
                </span>
              </div>
              <div className="text-[10px] text-[#527078] mt-1 font-mono-numbers truncate" title={lines.map(l => `L${l.lineNo}`).join(', ')}>
                Lines: {lines.slice(0, 8).map(l => `L${l.lineNo}`).join(', ')}{lines.length > 8 ? ` +${lines.length - 8} more` : ''}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Quick Reports Widget with slide-in animation */}
      {layout.showQuickReports !== false && (
        <AnimatePresence mode="wait">
          <motion.div
            key={`quick-reports-${effectiveDate}`}
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -28 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          >
            <QuickReportsWidget
              lines={displayLines}
              effectiveDate={effectiveDate}
              factoryOverallEfficiency={factory.overallEfficiency}
              totalTargetProd={factory.totalTargetProd}
              totalAchievedProd={factory.totalAchievedProd}
              totalWip={factory.totalWip}
              totalPresentMP={factory.totalPresent}
              totalAbsentMP={factory.totalAbsent}
              attendanceRate={factory.attendanceRate}
              activeLinesCount={factory.activeLinesCount}
              totalProducedMin={factory.totalProducedMinutes ?? 0}
              totalAvailMin={factory.totalAvailableMinutes ?? 0}
              onNavigateToLine={onSelectLine}
              privacyMode={privacyMode}
            />
          </motion.div>
        </AnimatePresence>
      )}

      {/* Sewing Floor Performance Breakdown (Padma, Meghna, Karnophuli, Korotoya, Shitalokshya, Turag) */}
      {floorSummaries.length > 1 && (
        <div className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#e7e1d5] pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#dceceb] text-[#176f78]">
                  Unit-2 Sewing Floor Rollup
                </span>
                <span className="text-xs text-[#527078] font-medium">
                  {lines.length} Active Lines Across {floorSummaries.length} Production Floors
                </span>
              </div>
              <h3 className="font-display text-lg sm:text-xl font-bold uppercase text-[#17343a] tracking-tight mt-0.5">
                Floor Target vs. Achievement &amp; Efficiency Breakdown
              </h3>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="text-xs text-[#527078] font-mono-numbers">
                Total Target: <strong className="text-[#17343a]">{factory.totalTargetProd.toLocaleString()} pcs</strong> • Output: <strong className="text-[#17343a]">{factory.totalAchievedProd.toLocaleString()} pcs</strong>
              </div>
              <button
                type="button"
                id="open-floor-plan-map-btn"
                onClick={() => onNavigate('floor-plan')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#176f78] text-white hover:bg-[#125860] text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Visual Floor Plan Map</span>
              </button>
            </div>
          </div>

          <div className="flex overflow-x-auto snap-x snap-mandatory sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-3 pb-2 sm:pb-0 no-scrollbar -mx-2 sm:mx-0 px-2 sm:px-0">
            {floorSummaries.map(fs => {
              const targetMetPct = fs.targetProd > 0 ? Math.round((fs.achievedProd / fs.targetProd) * 100) : 0;
              const isGood = fs.efficiencyPct >= 40;
              return (
                <div
                  key={fs.floor}
                  onClick={() => setSelectedDashboardFloor(selectedDashboardFloor === fs.floor ? 'all' : fs.floor)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer w-[82vw] max-w-[300px] shrink-0 snap-start sm:w-auto sm:max-w-none sm:shrink ${
                    selectedDashboardFloor === fs.floor
                      ? 'border-[#176f78] bg-[#dceceb]/30 shadow-xs ring-1 ring-[#176f78]'
                      : 'border-[#e7e1d5] bg-white hover:border-[#176f78]/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#17343a]">{fs.floor}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono-numbers ${
                        isGood
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {fs.efficiencyPct}% Eff
                    </span>
                  </div>

                  <div className="mt-2 flex items-baseline justify-between text-xs">
                    <span className="text-[#527078]">Achieved / Target:</span>
                    <span className="font-mono-numbers font-bold text-[#17343a]">
                      {fs.achievedProd.toLocaleString()}{' '}
                      <span className="font-normal text-[#527078]">/ {fs.targetProd.toLocaleString()}</span>
                    </span>
                  </div>

                  <div className="mt-1.5 h-2 w-full rounded-full bg-[#f1eee6] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isGood ? 'bg-[#176f78]' : 'bg-[#e6813e]'
                      }`}
                      style={{ width: `${Math.min(targetMetPct, 100)}%` }}
                    />
                  </div>

                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-[#527078]">
                    <span>
                      {fs.lines.length} Lines ({fs.lines.map(l => `L${l.lineNo}`).join(', ')})
                    </span>
                    <span className="font-mono-numbers font-bold text-[#17343a]">
                      {fs.manpower} MP
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Daily Productivity Insights: Shift Target vs Actual Gap Progress Indicator */}
      <DailyProductivityInsights
        lines={lines}
        onSelectLine={onSelectLine}
        onNavigate={onNavigate}
      />

      {/* Grid: Line Balancing Graph & Hour-by-Hour Output */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Balancing Graph / Learning Curve */}
        {layout.showBalancingGraph && (
          <div className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-display text-lg sm:text-xl font-bold uppercase text-[#17343a] tracking-tight">
                    Line Balancing & Learning Curve Ramp-Up
                  </h3>
                  <p className="text-xs text-[#527078]">
                    Planned vs achieved ramp-up progression across style start days
                  </p>
                </div>
                <span className="text-[10px] font-bold uppercase bg-[#dceceb] text-[#176f78] px-2 py-0.5 rounded">
                  IE Standard
                </span>
              </div>

              {/* Learning Curve Stage Cards */}
              <div className="grid grid-cols-4 gap-2 mb-4 text-center">
                <div className="p-2 rounded-xl bg-[#f1eee6] border border-[#d9d2c2]">
                  <div className="text-[10px] text-[#527078] uppercase font-bold">Day 01</div>
                  <div className="font-display text-lg font-bold text-[#17343a]">60%</div>
                  <div className="text-[9px] text-emerald-600 font-bold">L21 on Day 1</div>
                </div>
                <div className="p-2 rounded-xl bg-[#f1eee6] border border-[#d9d2c2]">
                  <div className="text-[10px] text-[#527078] uppercase font-bold">Day 02</div>
                  <div className="font-display text-lg font-bold text-[#17343a]">75%</div>
                  <div className="text-[9px] text-emerald-600 font-bold">L19 on Day 2</div>
                </div>
                <div className="p-2 rounded-xl bg-[#f1eee6] border border-[#d9d2c2]">
                  <div className="text-[10px] text-[#527078] uppercase font-bold">Day 03</div>
                  <div className="font-display text-lg font-bold text-[#17343a]">85%</div>
                  <div className="text-[9px] text-[#527078]">Build-up</div>
                </div>
                <div className="p-2 rounded-xl bg-[#dceceb] border border-[#176f78]/30">
                  <div className="text-[10px] text-[#176f78] uppercase font-bold">Day 04+</div>
                  <div className="font-display text-lg font-bold text-[#176f78]">90-95%</div>
                  <div className="text-[9px] text-[#176f78] font-bold">L18, L20, L24</div>
                </div>
              </div>

              {/* Visual SVG Curve */}
              <div className="h-44 w-full relative pt-2">
                <svg viewBox="0 0 400 130" className="w-full h-full overflow-visible">
                  {/* Grid lines */}
                  <line x1="40" y1="15" x2="380" y2="15" stroke="#e7e1d5" strokeDasharray="3 3" />
                  <line x1="40" y1="45" x2="380" y2="45" stroke="#e7e1d5" strokeDasharray="3 3" />
                  <line x1="40" y1="75" x2="380" y2="75" stroke="#e7e1d5" strokeDasharray="3 3" />
                  <line x1="40" y1="105" x2="380" y2="105" stroke="#e7e1d5" strokeDasharray="3 3" />

                  {/* Y Axis labels */}
                  <text x="10" y="20" fontSize="9" fill="#527078" fontFamily="IBM Plex Mono">100%</text>
                  <text x="10" y="50" fontSize="9" fill="#527078" fontFamily="IBM Plex Mono">80%</text>
                  <text x="10" y="80" fontSize="9" fill="#527078" fontFamily="IBM Plex Mono">60%</text>
                  <text x="10" y="110" fontSize="9" fill="#527078" fontFamily="IBM Plex Mono">40%</text>

                  {/* Planned Target Line (Dashed Orange) */}
                  <path
                    d="M 60 80 Q 150 45, 240 30 T 360 22"
                    fill="none"
                    stroke="#e6813e"
                    strokeWidth="2.5"
                    strokeDasharray="4 4"
                  />

                  {/* Achieved Curve (Solid Teal) */}
                  <path
                    d="M 60 76 Q 150 38, 240 26 T 360 18"
                    fill="none"
                    stroke="#176f78"
                    strokeWidth="3.5"
                  />

                  {/* Points */}
                  <circle cx="60" cy="76" r="4.5" fill="#176f78" />
                  <circle cx="150" cy="38" r="4.5" fill="#176f78" />
                  <circle cx="240" cy="26" r="4.5" fill="#176f78" />
                  <circle cx="360" cy="18" r="5" fill="#176f78" />

                  {/* X Axis labels */}
                  <text x="50" y="125" fontSize="10" fill="#527078" fontWeight="bold">Day 1</text>
                  <text x="140" y="125" fontSize="10" fill="#527078" fontWeight="bold">Day 2</text>
                  <text x="230" y="125" fontSize="10" fill="#527078" fontWeight="bold">Day 3</text>
                  <text x="345" y="125" fontSize="10" fill="#176f78" fontWeight="bold">Peak (D4)</text>
                </svg>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#e7e1d5] text-xs">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-xs text-[#17343a] font-medium">
                  <span className="w-3 h-1 bg-[#176f78] rounded"></span> Actual Output Curve
                </span>
                <span className="flex items-center gap-1.5 text-xs text-[#527078]">
                  <span className="w-3 h-1 bg-[#e6813e] rounded border-b border-dashed"></span> Planned Ramp-up
                </span>
              </div>
              <button
                onClick={() => onNavigate('linedata')}
                className="text-xs font-bold text-[#176f78] hover:underline"
              >
                View Balancing Graphs →
              </button>
            </div>
          </div>
        )}

        {/* Hour-by-Hour Production */}
        {layout.showIO && (
          <div className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-display text-lg sm:text-xl font-bold uppercase text-[#17343a] tracking-tight">
                    Hourly Factory Output (Hour-by-Hour)
                  </h3>
                  <p className="text-xs text-[#527078]">
                    Tracking hourly piece output against 620 pcs/hr standard pace
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <Clock className="w-3.5 h-3.5" />
                  <span>On Pace</span>
                </div>
              </div>

              {/* Hour bars */}
              <div className="space-y-2 mt-4">
                {hourlyData.map(h => {
                  const pct = Math.min((h.actual / h.target) * 100, 100);
                  const isMet = h.actual >= h.target;

                  return (
                    <div key={h.hour} className="flex items-center gap-3 text-xs">
                      <span className="w-14 font-mono-numbers text-[11px] text-[#527078] font-bold">
                        {h.hour}
                      </span>
                      <div className="flex-1 h-3.5 rounded-md bg-[#f1eee6] overflow-hidden relative">
                        <div
                          className={`h-full rounded-md transition-all duration-300 ${
                            isMet ? 'bg-[#176f78]' : 'bg-[#e6813e]'
                          }`}
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                      <div className="w-24 text-right font-mono-numbers text-[11px]">
                        <strong className="text-[#17343a]">{h.actual}</strong>
                        <span className="text-[#527078]">/{h.target}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#e7e1d5] text-xs mt-3">
              <span className="text-[#527078]">Cumulative today: <strong className="text-[#17343a] font-mono-numbers">{(factory.totalAchievedProd ?? 0).toLocaleString()} pcs</strong></span>
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">Current rate: 642 pcs/hr</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottlenecks & Style Changeovers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Critical Bottlenecks */}
        <div className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-display text-lg sm:text-xl font-bold uppercase text-[#17343a] tracking-tight">
                Floor Bottlenecks &amp; Cycle Time Watchlist
              </h3>
              <p className="text-xs text-[#527078]">
                Stations with observed cycle time exceeding takt/target pace
              </p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
              Live Audited
            </span>
          </div>

          {floorSummaries.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs mb-3">
              <button
                onClick={() => setSelectedDashboardFloor('all')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors shrink-0 cursor-pointer ${
                  selectedDashboardFloor === 'all'
                    ? 'bg-[#176f78] text-white'
                    : 'bg-[#f1eee6] text-[#527078] hover:bg-[#e7e1d5]'
                }`}
              >
                All Floors ({lines.length})
              </button>
              {floorSummaries.map(fs => (
                <button
                  key={fs.floor}
                  onClick={() => setSelectedDashboardFloor(fs.floor)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors shrink-0 cursor-pointer ${
                    selectedDashboardFloor === fs.floor
                      ? 'bg-[#176f78] text-white'
                      : 'bg-[#f1eee6] text-[#527078] hover:bg-[#e7e1d5]'
                  }`}
                >
                  {fs.floor} ({fs.lines.length})
                </button>
              ))}
            </div>
          )}

          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {(selectedDashboardFloor === 'all'
              ? lines
              : lines.filter(l => l.floor === selectedDashboardFloor)
            ).map(line => (
              <div
                key={line.id}
                className="p-3 rounded-xl border border-[#e7e1d5] bg-[#f1eee6]/50 flex items-start justify-between gap-3 hover:bg-[#f1eee6] transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[#176f78] bg-[#dceceb] px-1.5 py-0.5 rounded">
                      L{line.lineNo}
                    </span>
                    <span className="font-bold text-xs text-[#17343a]">
                      {line.bottleneck.station}
                    </span>
                    <span
                      className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                        line.bottleneck.status === 'high'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {line.bottleneck.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#527078] mt-0.5">
                    {line.floor} • Style: <span className="font-medium text-[#17343a]">{line.style}</span>
                  </div>
                  <p className="text-[11px] text-[#527078] mt-1">
                    <strong>Action:</strong> {line.bottleneck.action || 'Standard operation monitored'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono-numbers font-bold text-xs text-[#17343a]">
                    {line.bottleneck.cycleTime}s
                  </div>
                  <div className="text-[10px] text-[#527078] font-mono-numbers">
                    Target: {line.bottleneck.targetCT}s
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Style Changeovers */}
        {layout.showUpcoming && (
          <div className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-display text-lg sm:text-xl font-bold uppercase text-[#17343a] tracking-tight">
                  Upcoming Style Changeovers &amp; T.R Samples
                </h3>
                <p className="text-xs text-[#527078]">
                  Critical 10-day style input schedules and technical sample readiness
                </p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#dceceb] text-[#176f78]">
                10-Day File
              </span>
            </div>

            {floorSummaries.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs mb-3">
                <button
                  onClick={() => setSelectedDashboardFloor('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors shrink-0 cursor-pointer ${
                    selectedDashboardFloor === 'all'
                      ? 'bg-[#176f78] text-white'
                      : 'bg-[#f1eee6] text-[#527078] hover:bg-[#e7e1d5]'
                  }`}
                >
                  All Floors ({lines.length})
                </button>
                {floorSummaries.map(fs => (
                  <button
                    key={fs.floor}
                    onClick={() => setSelectedDashboardFloor(fs.floor)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors shrink-0 cursor-pointer ${
                      selectedDashboardFloor === fs.floor
                        ? 'bg-[#176f78] text-white'
                        : 'bg-[#f1eee6] text-[#527078] hover:bg-[#e7e1d5]'
                    }`}
                  >
                    {fs.floor} ({fs.lines.length})
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {(selectedDashboardFloor === 'all'
                ? lines
                : lines.filter(l => l.floor === selectedDashboardFloor)
              ).map(line => (
                <div
                  key={line.id}
                  className="p-3 rounded-xl border border-[#e7e1d5] bg-[#f1eee6]/50 flex items-center justify-between gap-3 hover:bg-[#f1eee6] transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-[#176f78]">Line {line.lineNo}</span>
                      <span className="font-bold text-xs text-[#17343a]">{line.nextStyle}</span>
                    </div>
                    <div className="text-[11px] text-[#527078] mt-0.5">
                      {line.floor} • Order Qty: {(line.orderQty ?? 0).toLocaleString()} pcs • Buyer: {line.buyer || 'General'}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold font-mono-numbers bg-[#f1eee6] border border-[#d9d2c2] text-[#17343a]">
                      {line.nextStyleDate}
                    </span>
                    <div className="text-[10px] text-[#176f78] font-bold mt-0.5">
                      T.R Sample Ready
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

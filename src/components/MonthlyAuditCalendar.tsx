/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldCheck,
  Award,
  Filter,
  Download,
  ExternalLink,
  ClipboardList,
  AlertTriangle,
  ArrowRight,
  FileSpreadsheet
} from 'lucide-react';
import { ChecklistMap, ChecklistStatus, UserProfile } from '../types';
import {
  CHECKLIST_TASK_COUNT,
  IE_DAILY_TASKS,
  normalizeChecklistStatuses
} from '../mockData';
import { downloadCSV, formatDateLabel, getTodayDateStr } from '../utils';

interface MonthlyAuditCalendarProps {
  checklists: ChecklistMap;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onNavigate?: (tab: string) => void;
  profile?: UserProfile;
}

export const MonthlyAuditCalendar: React.FC<MonthlyAuditCalendarProps> = ({
  checklists,
  selectedDate,
  onSelectDate,
  onNavigate,
  profile
}) => {
  // Current view year & month (default to selectedDate's year & month)
  const initialDate = useMemo(() => {
    const parts = selectedDate.split('-').map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return { year: parts[0], month: parts[1] - 1 }; // month 0-indexed
    }
    return { year: 2026, month: 8 }; // September 2026 default
  }, [selectedDate]);

  const [viewYear, setViewYear] = useState(initialDate.year);
  const [viewMonth, setViewMonth] = useState(initialDate.month);
  const [activeDate, setActiveDate] = useState(selectedDate);
  const [complianceFilter, setComplianceFilter] = useState<'all' | 'perfect' | 'pending' | 'action_needed'>('all');

  const todayStr = getTodayDateStr();

  // Navigation handlers
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(prev => prev - 1);
      setViewMonth(11);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(prev => prev + 1);
      setViewMonth(0);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  const handleTodayJump = () => {
    const today = new Date();
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setActiveDate(todayStr);
    onSelectDate(todayStr);
  };

  const monthName = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  // Calendar grid calculations
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun, 1 = Mon, etc.

  // Build calendar matrix
  const calendarCells = useMemo(() => {
    const cells: Array<{
      day: number;
      dateStr: string;
      isCurrentMonth: boolean;
      statuses: ChecklistStatus[];
      doneCount: number;
      pendingCount: number;
      noCount: number;
      compliancePct: number;
      hasAudit: boolean;
      isToday: boolean;
      isSelected: boolean;
      isWeekend: boolean;
      isHoliday: boolean;
    }> = [];

    // Days in current month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayOfWeek = new Date(viewYear, viewMonth, day).getDay(); // 0 = Sun, 1 = Mon, ..., 5 = Fri, 6 = Sat
      const isHoliday = dayOfWeek === 5; // Friday is the official factory weekly holiday
      const isWeekend = isHoliday;
      const statuses = normalizeChecklistStatuses(checklists[dateStr]);
      const hasAudit = !!checklists[dateStr];
      const doneCount = statuses.filter(s => s === 'yes').length;
      const pendingCount = statuses.filter(s => s === 'pending').length;
      const noCount = statuses.filter(s => s === 'no').length;
      const compliancePct = Math.round((doneCount / CHECKLIST_TASK_COUNT) * 100);

      cells.push({
        day,
        dateStr,
        isCurrentMonth: true,
        statuses,
        doneCount,
        pendingCount,
        noCount,
        compliancePct,
        hasAudit,
        isToday: dateStr === todayStr,
        isSelected: dateStr === activeDate,
        isWeekend,
        isHoliday
      });
    }

    return cells;
  }, [viewYear, viewMonth, daysInMonth, checklists, todayStr, activeDate]);

  // Aggregate stats for the active month
  const monthlyStats = useMemo(() => {
    const auditedDays = calendarCells.filter(c => c.hasAudit && c.doneCount > 0);
    const totalDone = auditedDays.reduce((acc, c) => acc + c.doneCount, 0);
    const totalCheckpoints = auditedDays.length * CHECKLIST_TASK_COUNT;
    const avgCompliance = totalCheckpoints > 0 ? Math.round((totalDone / totalCheckpoints) * 100) : 0;
    const perfectDays = calendarCells.filter(c => c.doneCount === CHECKLIST_TASK_COUNT).length;
    const actionNeededDays = calendarCells.filter(c => c.noCount > 0).length;
    const fridayHolidaysCount = calendarCells.filter(c => c.isHoliday).length;
    const totalWorkingDays = calendarCells.filter(c => !c.isHoliday).length;

    return {
      auditedDaysCount: auditedDays.length,
      avgCompliance,
      perfectDays,
      actionNeededDays,
      fridayHolidaysCount,
      totalWorkingDays
    };
  }, [calendarCells]);

  // Data for the active selected day
  const activeDayData = useMemo(() => {
    const found = calendarCells.find(c => c.dateStr === activeDate);
    if (found) return found;

    const statuses = normalizeChecklistStatuses(checklists[activeDate]);
    const [ay, am, ad] = activeDate.split('-').map(Number);
    const dayOfWeek = !isNaN(ay) && !isNaN(am) && !isNaN(ad) ? new Date(ay, am - 1, ad).getDay() : -1;
    const isHoliday = dayOfWeek === 5;

    return {
      day: parseInt(activeDate.split('-')[2] || '1', 10),
      dateStr: activeDate,
      isCurrentMonth: true,
      statuses,
      doneCount: statuses.filter(s => s === 'yes').length,
      pendingCount: statuses.filter(s => s === 'pending').length,
      noCount: statuses.filter(s => s === 'no').length,
      compliancePct: Math.round((statuses.filter(s => s === 'yes').length / CHECKLIST_TASK_COUNT) * 100),
      hasAudit: !!checklists[activeDate],
      isToday: activeDate === todayStr,
      isSelected: true,
      isWeekend: isHoliday,
      isHoliday
    };
  }, [calendarCells, activeDate, checklists, todayStr]);

  // Checklist item verification notes mapping
  const taskAuditObservations: Record<number, string> = {
    1: 'Ramp-up target communicated to Line 21 supervisor. Day 1 learning slope verified.',
    2: 'Day 2 balance graph verified for Line 19 zipper operation. Bottleneck buffer deployed.',
    3: 'Peak 70% threshold reached on Line 20. Operator cycle timing synchronized.',
    4: 'Line 18 Day 4 peak achieved at 90% efficiency. Residual pacing gap audited.',
    5: '6-7 Day line estimate projection submitted for bulk shipment clearance.',
    6: 'Stopwatch study completed on collar attach & sleeve hem stations.',
    7: 'Next style technical folder, attachments, and mock sample approved with QC lead.',
    8: 'T.R trial sample reviewed and signed off with production floor management.',
    9: 'Hourly visual board updated; WIP accumulation kept under 300 pieces threshold.',
    10: 'Individual operator skill matrix updated; floater assigned to low-output pitch station.',
    11: 'Kaizen shadow board mounted within 30cm reach for needle change tools.',
    12: 'Line efficiency calculation audited against total paid manpower minutes.'
  };

  // Export Monthly Audit Log as CSV
  const handleExportMonthlyLog = () => {
    const headers = [
      'Date',
      'Day of Month',
      'Audited Status',
      'Completed Tasks',
      'Pending Tasks',
      'Marked Deficient',
      'Compliance %',
      ...IE_DAILY_TASKS.map(t => `Task ${t.id}: ${t.title}`)
    ];

    const rows = calendarCells.map(c => {
      const taskStatuses = c.statuses.map(s => (s === 'yes' ? 'VERIFIED' : s === 'no' ? 'DEFICIENT' : 'PENDING'));
      let auditedStatus = c.hasAudit ? 'AUDITED' : 'SCHEDULED';
      if (c.isHoliday) {
        auditedStatus = c.doneCount > 0 ? 'FRIDAY HOLIDAY (AUDITED)' : 'FRIDAY HOLIDAY (OFF)';
      }
      return [
        c.dateStr,
        c.day,
        auditedStatus,
        c.doneCount,
        c.pendingCount,
        c.noCount,
        `${c.compliancePct}%`,
        ...taskStatuses
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    downloadCSV(`IE_Daily_Control_Monthly_Audit_Log_${viewYear}_${viewMonth + 1}.csv`, csvContent);
  };

  return (
    <div className="space-y-6">
      {/* ────────────────────────────────────────────────────────── */}
      {/* HEADER & MONTH NAVIGATION */}
      {/* ────────────────────────────────────────────────────────── */}
       <div className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] p-5 sm:p-6 shadow-xs surface-card monthly-intro">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#dceceb] text-[#176f78] flex items-center gap-1">
                <CalendarIcon className="w-3 h-3" />
                <span>Monthly Compliance & Audit Calendar</span>
              </span>
              <span className="text-xs text-[#527078]">IE Daily Control Protocol</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase text-[#17343a] tracking-tight page-title">
              Monthly Activity & Audit Log
            </h1>
            <p className="text-xs sm:text-sm text-[#527078] mt-1">
              Calendar tracking of the {CHECKLIST_TASK_COUNT}-Task IE Daily Activity Tracking, auditor verification trails, and floor compliance trends.
            </p>
          </div>

          {/* Month Switcher & Export */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleTodayJump}
              className="px-3 py-1.5 rounded-xl border border-[#d9d2c2] bg-white text-xs font-bold text-[#17343a] hover:bg-[#e7e1d5] transition-colors"
            >
              Today
            </button>

            <div className="flex items-center gap-1 bg-[#f1eee6] p-1 rounded-2xl border border-[#d9d2c2]">
              <button
                onClick={handlePrevMonth}
                title="Previous Month"
                className="p-1.5 rounded-xl hover:bg-[#e7e1d5] text-[#17343a] transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 text-xs font-bold font-mono-numbers text-[#17343a] flex items-center gap-1.5 select-none min-w-[140px] justify-center">
                <CalendarIcon className="w-3.5 h-3.5 text-[#176f78]" />
                {monthName}
              </span>

              <button
                onClick={handleNextMonth}
                title="Next Month"
                className="p-1.5 rounded-xl hover:bg-[#e7e1d5] text-[#17343a] transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleExportMonthlyLog}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#176f78] text-white hover:bg-[#12555c] transition-colors text-xs font-bold shadow-2xs"
              title="Download full monthly audit records as CSV"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">Export Audit Log</span>
            </button>
          </div>
        </div>

        {/* 4 Top KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-[#e7e1d5]">
          {/* Card 1: Factory Compliance Avg */}
          <div className="p-3.5 rounded-xl bg-white border border-[#e7e1d5] shadow-2xs">
            <div className="flex items-center justify-between text-[10px] text-[#527078] font-bold uppercase mb-1">
              <span>Avg Compliance</span>
              <Award className="w-3.5 h-3.5 text-[#176f78]" />
            </div>
            <div className="font-display text-2xl font-bold text-[#176f78] font-mono-numbers">
              {monthlyStats.avgCompliance}%
            </div>
            <span className="text-[10px] text-emerald-700 font-medium">
              Across {monthlyStats.auditedDaysCount} Audited Days
            </span>
          </div>

          {/* Card 2: Audited Working Days */}
          <div className="p-3.5 rounded-xl bg-white border border-[#e7e1d5] shadow-2xs">
            <div className="flex items-center justify-between text-[10px] text-[#527078] font-bold uppercase mb-1">
              <span>Working Days Audited</span>
              <ShieldCheck className="w-3.5 h-3.5 text-[#176f78]" />
            </div>
            <div className="font-display text-2xl font-bold text-[#17343a] font-mono-numbers">
              {monthlyStats.auditedDaysCount}{' '}
              <span className="text-xs text-[#527078] font-normal font-sans">
                / {monthlyStats.totalWorkingDays} working days
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-[#527078] mt-0.5">
              <span>{Math.round((monthlyStats.auditedDaysCount / (monthlyStats.totalWorkingDays || 1)) * 100)}% Coverage</span>
              <span className="text-amber-800 font-semibold">• {monthlyStats.fridayHolidaysCount} Friday Holidays</span>
            </div>
          </div>

          {/* Card 3: Perfect Score Days */}
          <div className="p-3.5 rounded-xl bg-white border border-[#e7e1d5] shadow-2xs">
            <div className="flex items-center justify-between text-[10px] text-[#527078] font-bold uppercase mb-1">
              <span>100% Verified Days</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="font-display text-2xl font-bold text-emerald-700 font-mono-numbers">
              {monthlyStats.perfectDays}
            </div>
            <span className="text-[10px] text-emerald-600 font-medium">
              {CHECKLIST_TASK_COUNT} of {CHECKLIST_TASK_COUNT} Tasks Signed Off
            </span>
          </div>

          {/* Card 4: Open Action Needed Days */}
          <div className="p-3.5 rounded-xl bg-white border border-[#e7e1d5] shadow-2xs">
            <div className="flex items-center justify-between text-[10px] text-[#527078] font-bold uppercase mb-1">
              <span>Attention Needed</span>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="font-display text-2xl font-bold text-amber-700 font-mono-numbers">
              {monthlyStats.actionNeededDays}
            </div>
            <span className="text-[10px] text-amber-700 font-medium">
              Days with Marked Deficiencies
            </span>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* INTERACTIVE CALENDAR UI */}
      {/* ────────────────────────────────────────────────────────── */}
       <div className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] p-5 sm:p-6 shadow-xs space-y-4 surface-card audit-calendar">
        {/* Calendar Controls & Legend */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e7e1d5] pb-3">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg font-bold uppercase text-[#17343a] tracking-tight">
              {monthName} Calendar Grid
            </h2>
            <span className="text-xs text-[#527078]">Click any day to inspect IE audit log</span>
          </div>

          {/* Color Legend */}
          <div className="flex items-center gap-3 text-[11px] text-[#527078] flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>≥90% Compliant</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>50-89% Pending</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>&lt;50% Non-Compliant</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-amber-500" />
              <span className="text-amber-900 font-bold">Friday (Weekly Holiday)</span>
            </div>
          </div>
        </div>

        {/* 7-Day Weekday Headers */}
        <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-bold uppercase tracking-wider text-[#527078]">
          <div className="py-1">Sun</div>
          <div className="py-1">Mon</div>
          <div className="py-1">Tue</div>
          <div className="py-1">Wed</div>
          <div className="py-1">Thu</div>
          <div className="py-1 flex items-center justify-center gap-1 text-amber-900 bg-amber-100/80 border border-amber-300 rounded-md font-extrabold">
            <span>Fri</span>
            <span className="text-[8px] px-1 py-0.2 rounded bg-amber-600 text-white font-black tracking-tight">
              HOLIDAY
            </span>
          </div>
          <div className="py-1">Sat</div>
        </div>

        {/* Calendar Days Matrix */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {/* Leading blank offset cells */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div
              key={`blank-${i}`}
              className="min-h-[76px] sm:min-h-[92px] rounded-xl bg-[#f1eee6]/30 border border-transparent pointer-events-none"
            />
          ))}

          {/* Month Days */}
          {calendarCells.map(cell => {
            const isSelected = cell.dateStr === activeDate;
            const isToday = cell.isToday;
            const isFriday = cell.isHoliday;

            // Determine badge colors based on compliance
            let badgeBg = 'bg-slate-100 text-slate-700 border-slate-200';
            let progressBg = 'bg-slate-400';
            let cardBorder = isSelected
              ? 'border-[#176f78] ring-2 ring-[#176f78]/30 shadow-md'
              : isFriday
              ? 'border-amber-200 hover:border-amber-400'
              : 'border-[#e7e1d5] hover:border-[#176f78]/60';

            if (cell.doneCount > 0) {
              if (cell.compliancePct >= 90) {
                badgeBg = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                progressBg = 'bg-emerald-500';
              } else if (cell.compliancePct >= 50) {
                badgeBg = 'bg-amber-50 text-amber-800 border-amber-200';
                progressBg = 'bg-amber-500';
              } else {
                badgeBg = 'bg-rose-50 text-rose-800 border-rose-200';
                progressBg = 'bg-rose-500';
              }
            }

            return (
              <button
                key={cell.dateStr}
                onClick={() => {
                  setActiveDate(cell.dateStr);
                  onSelectDate(cell.dateStr);
                }}
                className={`min-h-[76px] sm:min-h-[92px] rounded-xl p-2 sm:p-2.5 text-left transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? 'bg-white'
                    : isFriday
                    ? 'bg-[#fbf7ed] hover:bg-[#f6f0dd]'
                    : 'bg-white hover:bg-[#fbfaf6]'
                } border ${cardBorder}`}
              >
                {/* Day Number and Today Indicator */}
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`font-mono-numbers text-xs sm:text-sm font-bold ${
                      isToday
                        ? 'w-6 h-6 rounded-full bg-[#176f78] text-white flex items-center justify-center -ml-0.5'
                        : isSelected
                        ? 'text-[#176f78]'
                        : isFriday
                        ? 'text-amber-950 font-black'
                        : 'text-[#17343a]'
                    }`}
                  >
                    {cell.day}
                  </span>

                  {isFriday ? (
                    cell.doneCount > 0 ? (
                      <span className="text-[9px] font-bold font-mono-numbers px-1.5 py-0.2 rounded border bg-amber-50 text-amber-900 border-amber-300">
                        {cell.compliancePct}%
                      </span>
                    ) : (
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300">
                        Holiday
                      </span>
                    )
                  ) : cell.doneCount > 0 ? (
                    <span
                      className={`text-[10px] font-bold font-mono-numbers px-1.5 py-0.2 rounded border ${badgeBg}`}
                    >
                      {cell.compliancePct}%
                    </span>
                  ) : (
                    <span className="text-[9px] font-semibold text-[#738287]">Pending</span>
                  )}
                </div>

                {/* Middle: Checklist task completion pills / micro-bar */}
                <div className="my-1">
                  <div className="h-1.5 w-full rounded-full bg-[#f1eee6] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isFriday && cell.doneCount === 0 ? 'bg-amber-300' : progressBg
                      }`}
                      style={{ width: `${cell.doneCount === 0 && isFriday ? 100 : cell.compliancePct}%` }}
                    />
                  </div>
                </div>

                {/* Bottom text info */}
                <div className="flex items-center justify-between text-[9px] text-[#527078] font-mono-numbers">
                  {isFriday && cell.doneCount === 0 ? (
                    <span className="text-amber-800 font-semibold uppercase tracking-tight text-[8.5px]">
                      Weekly Holiday
                    </span>
                  ) : (
                    <span>{cell.doneCount}/{CHECKLIST_TASK_COUNT} Done</span>
                  )}
                  {cell.noCount > 0 && (
                    <span className="text-rose-600 font-bold flex items-center">
                      • {cell.noCount} No
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* DETAILED AUDIT INSPECTOR FOR THE SELECTED DATE */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] p-5 sm:p-6 shadow-xs space-y-5">
        {/* Selected Date Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#e7e1d5] pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#dceceb] text-[#176f78] font-mono-numbers">
                DATE: {activeDayData.dateStr}
              </span>
              <span className="text-xs text-[#527078] font-medium">
                {formatDateLabel(activeDayData.dateStr)}
              </span>
              {activeDayData.isHoliday && (
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                  <span>🌴</span>
                  <span>Friday Weekly Holiday</span>
                </span>
              )}
            </div>
            <h3 className="font-display text-xl sm:text-2xl font-bold uppercase text-[#17343a] tracking-tight flex items-center gap-2">
              <span>Daily Checklist Audit Inspector</span>
              {activeDayData.compliancePct === 100 && (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              )}
            </h3>
            <p className="text-xs text-[#527078] mt-0.5">
              Verification audit trail, task sign-offs, and floor countermeasures recorded for this date.
            </p>
          </div>

          {/* Quick Action: Open in Daily Checklist */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onSelectDate(activeDayData.dateStr);
                if (onNavigate) onNavigate('checklist');
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#176f78] text-white hover:bg-[#12555c] transition-colors text-xs font-bold shadow-xs"
            >
              <span>Open in Daily Checklist</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Friday Weekly Holiday Banner */}
        {activeDayData.isHoliday && (
          <div className="rounded-2xl bg-amber-50/90 border border-amber-200 p-4 flex items-start sm:items-center justify-between gap-4 text-amber-900 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-200/90 text-amber-900 flex items-center justify-center shrink-0 text-lg shadow-2xs font-black">
                🌴
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-extrabold uppercase tracking-wide text-amber-950">
                    Official Factory Weekly Holiday (Friday)
                  </span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-amber-600 text-white">
                    Factory Closed
                  </span>
                </div>
                <p className="text-[11px] text-amber-900/85 mt-0.5">
                  Friday is the designated weekly plant holiday. Regular garment assembly lines are offline. Daily IE audit sign-offs are optional for scheduled preventive maintenance, sample development, or overtime batches.
                </p>
              </div>
            </div>
            <div className="shrink-0 hidden md:block text-right border-l border-amber-200 pl-4">
              <span className="text-[10px] uppercase font-bold text-amber-800/70 block">Operating Status</span>
              <span className="text-xs font-black text-amber-900">Scheduled Rest Day</span>
            </div>
          </div>
        )}

        {/* Auditor Verification Card */}
        <div className="rounded-2xl bg-white border border-[#e7e1d5] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#dceceb] text-[#176f78] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#17343a]">
                Auditor Sign-off: {profile?.name || 'MD. Ashikur Rahman'} ({profile?.jobTitle || 'Senior IE Manager'})
              </div>
              <div className="text-[11px] text-[#527078] mt-0.5">
                Audit Timestamp: Verified at 17:30 BST • Status:{' '}
                <strong className={activeDayData.doneCount === CHECKLIST_TASK_COUNT ? 'text-emerald-700' : 'text-amber-700'}>
                  {activeDayData.doneCount === CHECKLIST_TASK_COUNT
                    ? '100% Standard Compliance Verified'
                    : `${activeDayData.doneCount} of ${CHECKLIST_TASK_COUNT} Tasks Verified (${activeDayData.pendingCount} Pending)`}
                </strong>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            <div className="text-right">
              <div className="text-[10px] text-[#527078] uppercase font-bold">Daily Compliance</div>
              <div className="font-display text-2xl font-bold font-mono-numbers text-[#17343a]">
                {activeDayData.compliancePct}%
              </div>
            </div>
          </div>
        </div>

        {/* IE Daily Activity audit breakdown table */}
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-[#527078] mb-1">
            IE Daily Activity Checkpoints for this Date:
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {IE_DAILY_TASKS.map((task, idx) => {
              const status: ChecklistStatus = activeDayData.statuses[idx] || 'pending';
              const isYes = status === 'yes';
              const isNo = status === 'no';
              const isPending = status === 'pending';

              return (
                <div
                  key={task.id}
                  className={`rounded-2xl border p-3.5 transition-all flex flex-col justify-between ${
                    isYes
                      ? 'bg-white border-[#e7e1d5]'
                      : isNo
                      ? 'bg-rose-50/40 border-rose-200'
                      : 'bg-[#fbfaf6] border-[#d9d2c2]'
                  }`}
                >
                  <div className="space-y-1.5">
                    {/* Top line: Task number, Category & Status Pill */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono-numbers text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#f1eee6] text-[#527078]">
                          #{String(task.id).padStart(2, '0')}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wide text-[#176f78] bg-[#dceceb] px-1.5 py-0.5 rounded">
                          {task.category}
                        </span>
                      </div>

                      {/* Status Tag */}
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          isYes
                            ? 'bg-emerald-100 text-emerald-800'
                            : isNo
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isYes ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>VERIFIED</span>
                          </>
                        ) : isNo ? (
                          <>
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>NOT DONE</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>PENDING</span>
                          </>
                        )}
                      </span>
                    </div>

                    {/* Task Title */}
                    <div className="font-bold text-xs text-[#17343a] leading-tight">
                      {task.title}
                    </div>

                    {/* Task Standard Requirement */}
                    <div className="text-[11px] text-[#527078] leading-normal">
                      {task.hint}
                    </div>

                    {/* Recorded Audit Observation */}
                    {isYes && taskAuditObservations[task.id] && (
                      <div className="text-[10px] text-emerald-800 bg-emerald-50/70 rounded-lg p-1.5 border border-emerald-100/80 mt-1">
                        <strong>Verified Note:</strong> {taskAuditObservations[task.id]}
                      </div>
                    )}

                    {isNo && (
                      <div className="text-[10px] text-rose-800 bg-rose-50 rounded-lg p-1.5 border border-rose-200 mt-1">
                        <strong>Deficiency Flag:</strong> Immediate floor supervisor countermeasure required.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

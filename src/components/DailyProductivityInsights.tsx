/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Zap,
  Gauge,
  HelpCircle,
  Filter,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  LayoutGrid,
  MoveHorizontal,
  Smartphone,
  Building2
} from 'lucide-react';
import { LineEntry } from '../types';
import { calculateLineMetrics } from '../utils';

interface DailyProductivityInsightsProps {
  lines: LineEntry[];
  onSelectLine?: (lineNo: string) => void;
  onNavigate?: (tab: string) => void;
}

export const DailyProductivityInsights: React.FC<DailyProductivityInsightsProps> = ({
  lines,
  onSelectLine,
  onNavigate
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'gap' | 'ahead'>('all');
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  
  // Responsive layout mode: 'scroll' (horizontal carousel) vs 'grid' (multi-column)
  // On smaller screens (< 768px), horizontal scroll is the primary optimal view
  const [viewMode, setViewMode] = useState<'scroll' | 'grid'>('scroll');
  
  // Carousel scroll container reference and state
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  // Available production floors in active lines
  const availableFloors = useMemo(() => {
    const floorSet = new Set<string>();
    lines.forEach(l => {
      if (l.floor) floorSet.add(l.floor);
    });
    return Array.from(floorSet).sort();
  }, [lines]);

  // Aggregated totals across all active sewing lines
  const totalTargetProd = lines.reduce((sum, l) => sum + l.targetProd, 0);
  const totalAchievedProd = lines.reduce((sum, l) => sum + l.achievedProd, 0);
  const totalGapUnits = totalAchievedProd - totalTargetProd; // negative = shortfall, positive = surplus
  const gapPercentage = totalTargetProd > 0 ? (totalGapUnits / totalTargetProd) * 100 : 0;
  const progressRatio = totalTargetProd > 0 ? Math.min((totalAchievedProd / totalTargetProd) * 100, 100) : 0;

  // Shift timing metrics (Standard 8.0 hr sewing shift, currently simulated at 6.5 hours elapsed)
  const shiftHoursTotal = 8.0;
  const shiftHoursElapsed = 6.5;
  const shiftHoursRemaining = Math.max(0, shiftHoursTotal - shiftHoursElapsed);
  const shiftTimeElapsedPct = (shiftHoursElapsed / shiftHoursTotal) * 100; // 81.25%

  // Current pace vs pace required to eliminate the gap
  const currentRunRatePerHour = shiftHoursElapsed > 0 ? Math.round(totalAchievedProd / shiftHoursElapsed) : 0;
  const targetStandardPacePerHour = Math.round(totalTargetProd / shiftHoursTotal);
  const unitsRemainingToTarget = Math.max(0, totalTargetProd - totalAchievedProd);
  const requiredRunRatePerHour =
    shiftHoursRemaining > 0 ? Math.round(unitsRemainingToTarget / shiftHoursRemaining) : 0;

  // Projected output at current pace
  const projectedShiftOutput = Math.round(totalAchievedProd + currentRunRatePerHour * shiftHoursRemaining);
  const projectedVsTargetPct = totalTargetProd > 0 ? Math.round((projectedShiftOutput / totalTargetProd) * 100) : 0;

  // Pace Delta: output % vs time elapsed %
  const paceDeltaPct = Math.round((progressRatio - shiftTimeElapsedPct) * 10) / 10;
  const isAheadOfTimePace = paceDeltaPct >= 0;

  // Filter lines by both status gap and selected floor
  const filteredLines = useMemo(() => {
    return lines.filter(line => {
      if (selectedFloor !== 'all' && line.floor !== selectedFloor) return false;
      const gap = line.achievedProd - line.targetProd;
      if (filterMode === 'gap') return gap < 0;
      if (filterMode === 'ahead') return gap >= 0;
      return true;
    });
  }, [lines, filterMode, selectedFloor]);

  const linesWithGapCount = useMemo(() => {
    return lines.filter(l => (selectedFloor === 'all' || l.floor === selectedFloor) && l.achievedProd < l.targetProd).length;
  }, [lines, selectedFloor]);

  const linesAheadCount = useMemo(() => {
    return lines.filter(l => (selectedFloor === 'all' || l.floor === selectedFloor) && l.achievedProd >= l.targetProd).length;
  }, [lines, selectedFloor]);

  // Update carousel scroll indicators and active card
  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 12);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 12);

    const maxScroll = scrollWidth - clientWidth;
    const progress = maxScroll > 0 ? (scrollLeft / maxScroll) * 100 : 0;
    setScrollProgress(progress);

    // Approximate active card (assuming ~320px per card)
    const cardWidth = 320;
    const index = Math.round(scrollLeft / cardWidth);
    setActiveCardIndex(Math.max(0, Math.min(index, filteredLines.length - 1)));
  }, [filteredLines.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [updateScrollState, filteredLines]);

  const handleScrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  return (
    <section className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] p-5 sm:p-6 shadow-xs space-y-6">
      {/* Component Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e7e1d5] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#dceceb] text-[#176f78] flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" />
              <span>Shift Telemetry & Variance</span>
            </span>
            <span className="text-xs text-[#527078] font-medium">
              Hour 6.5 of 8.0 • General Shift (8:00 AM - 5:00 PM)
            </span>
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-bold uppercase text-[#17343a] tracking-tight flex items-center gap-2">
            <span>Daily Productivity Insights</span>
          </h2>
          <p className="text-xs text-[#527078] mt-0.5">
            Real-time variance analysis between shift target quotas and floor outputs with dynamic recovery pace forecasting.
          </p>
        </div>

        {/* Status Pill Badge */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <div
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${
              totalGapUnits >= 0
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : Math.abs(totalGapUnits) < 500
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {totalGapUnits >= 0 ? (
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-rose-600" />
            )}
            <span>
              {totalGapUnits >= 0
                ? `+${(totalGapUnits ?? 0).toLocaleString()} Pcs Above Target`
                : `${Math.abs(totalGapUnits ?? 0).toLocaleString()} Pcs Production Gap`}
            </span>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 1. MAIN PRODUCTION GAP PROGRESS INDICATOR */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white border border-[#e7e1d5] p-5 shadow-2xs space-y-4">
        {/* Top Numbers Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#527078] mb-1 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-[#176f78]" />
              <span>Shift Target vs Actual Output Progress</span>
            </div>
            <div className="flex items-baseline gap-3 flex-wrap">
              <div className="flex items-baseline gap-1">
                <span className="font-display text-3xl sm:text-4xl font-extrabold text-[#17343a] font-mono-numbers">
                  {(totalAchievedProd ?? 0).toLocaleString()}
                </span>
                <span className="text-sm font-semibold text-[#527078]">
                  / {(totalTargetProd ?? 0).toLocaleString()} pcs
                </span>
              </div>

              <div
                className={`px-2.5 py-0.5 rounded-lg text-xs font-bold font-mono-numbers ${
                  progressRatio >= shiftTimeElapsedPct
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {progressRatio.toFixed(1)}% Completed
              </div>
            </div>
          </div>

          {/* Variance & Remaining Quota */}
          <div className="flex items-center gap-4 text-right">
            <div className="p-2.5 rounded-xl bg-[#fbfaf6] border border-[#e7e1d5]">
              <div className="text-[10px] font-bold uppercase text-[#527078]">Net Variance</div>
              <div
                className={`text-base font-extrabold font-mono-numbers ${
                  totalGapUnits >= 0 ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                {totalGapUnits >= 0 ? `+${(totalGapUnits ?? 0).toLocaleString()}` : `${(totalGapUnits ?? 0).toLocaleString()}`} pcs
              </div>
              <div className="text-[10px] text-[#738287] font-medium font-mono-numbers">
                ({gapPercentage > 0 ? `+${gapPercentage.toFixed(1)}` : gapPercentage.toFixed(1)}%)
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-[#fbfaf6] border border-[#e7e1d5]">
              <div className="text-[10px] font-bold uppercase text-[#527078]">Remaining To Quota</div>
              <div className="text-base font-extrabold font-mono-numbers text-[#17343a]">
                {(unitsRemainingToTarget ?? 0).toLocaleString()} pcs
              </div>
              <div className="text-[10px] text-[#527078] font-medium">
                in 1.5 hrs remaining
              </div>
            </div>
          </div>
        </div>

        {/* The Multi-Segment Visual Progress Indicator */}
        <div className="space-y-2 pt-2">
          {/* Progress Bar Container */}
          <div className="relative h-6 w-full rounded-xl bg-[#f1eee6] border border-[#d9d2c2] overflow-hidden p-0.5">
            {/* Achieved Units Bar */}
            <div
              className={`h-full rounded-lg transition-all duration-700 flex items-center justify-end px-2 text-[10px] font-bold text-white font-mono-numbers ${
                progressRatio >= 100
                  ? 'bg-emerald-600'
                  : progressRatio >= 80
                  ? 'bg-[#176f78]'
                  : 'bg-amber-600'
              }`}
              style={{ width: `${progressRatio}%` }}
            >
              {progressRatio >= 18 && `${progressRatio.toFixed(1)}%`}
            </div>

            {/* Shift Time Elapsed Marker (Vertical Line Pin) */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-[#d96b27] z-10 pointer-events-none"
              style={{ left: `${shiftTimeElapsedPct}%` }}
              title={`Shift Time Elapsed: ${shiftTimeElapsedPct.toFixed(1)}%`}
            >
              <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-[#d96b27] rotate-45" />
            </div>
          </div>

          {/* Scale Labels & Time Pace Marker Note */}
          <div className="flex items-center justify-between text-[11px] text-[#527078]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#176f78] inline-block" />
              <span>
                Actual Production: <strong className="text-[#17343a] font-mono-numbers">{(totalAchievedProd ?? 0).toLocaleString()} pcs</strong> ({progressRatio.toFixed(1)}%)
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[#d96b27] font-semibold">
              <Clock className="w-3 h-3" />
              <span>
                Shift Elapsed Marker: <strong className="font-mono-numbers">{shiftTimeElapsedPct.toFixed(1)}%</strong> ({shiftHoursElapsed}h of {shiftHoursTotal}h)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#f1eee6] border border-[#d9d2c2] inline-block" />
              <span>
                Shift Target: <strong className="text-[#17343a] font-mono-numbers">{(totalTargetProd ?? 0).toLocaleString()} pcs</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic IE Pace Recommendation Banner */}
        <div className="rounded-xl bg-[#fbfaf6] border border-[#e7e1d5] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                isAheadOfTimePace ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}
            >
              <Gauge className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-[#17343a]">
                {isAheadOfTimePace
                  ? `Floor Output is +${paceDeltaPct}% Ahead of Elapsed Shift Time`
                  : `Floor Output is Lagging Shift Time by ${Math.abs(paceDeltaPct)}%`}
              </div>
              <div className="text-[#527078] text-[11px]">
                Current speed: <strong className="text-[#17343a] font-mono-numbers">{currentRunRatePerHour} pcs/hr</strong> •
                Required speed to clear gap: <strong className="text-[#17343a] font-mono-numbers">{requiredRunRatePerHour} pcs/hr</strong>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <span className="text-[10px] text-[#527078] uppercase font-bold">Projected Shift Output</span>
              <div className="font-display font-bold text-sm text-[#17343a] font-mono-numbers">
                ~{(projectedShiftOutput ?? 0).toLocaleString()} pcs ({projectedVsTargetPct}%)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 2. LINE-BY-LINE GAP BREAKDOWN MATRIX (RESPONSIVE CAROUSEL & GRID) */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="space-y-3.5">
        {/* Section Header & Responsive Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-[#f3f0e8]/80 p-3 rounded-2xl border border-[#e2dcd0]">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-display text-sm sm:text-base font-bold uppercase text-[#17343a] tracking-tight flex items-center gap-2">
                <span>Line-by-Line Production Gap & Recovery Breakdown</span>
              </h3>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#dceceb] text-[#176f78]">
                {filteredLines.length} {filteredLines.length === 1 ? 'Line' : 'Lines'}
              </span>
            </div>
            <p className="text-[11px] text-[#527078]">
              Inspect live performance variance for each sewing line. On mobile, swipe horizontally or use arrow buttons.
            </p>
          </div>

          {/* Controls Cluster: Floor Filters, Gap Filters & View Mode */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
            {/* Floor Selection (if multiple floors exist) */}
            {availableFloors.length > 1 && (
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#d9d2c2] text-xs">
                <button
                  onClick={() => setSelectedFloor('all')}
                  className={`px-2 py-0.5 rounded-lg font-bold text-[11px] transition-colors ${
                    selectedFloor === 'all'
                      ? 'bg-[#176f78] text-white shadow-2xs'
                      : 'text-[#527078] hover:text-[#17343a]'
                  }`}
                >
                  All Floors
                </button>
                {availableFloors.map(floor => (
                  <button
                    key={floor}
                    onClick={() => setSelectedFloor(floor)}
                    className={`px-2 py-0.5 rounded-lg font-bold text-[11px] transition-colors ${
                      selectedFloor === floor
                        ? 'bg-[#176f78] text-white shadow-2xs'
                        : 'text-[#527078] hover:text-[#17343a]'
                    }`}
                  >
                    {floor}
                  </button>
                ))}
              </div>
            )}

            {/* Gap Status Filter Pills */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#d9d2c2] text-xs">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                  filterMode === 'all'
                    ? 'bg-[#17343a] text-white shadow-2xs'
                    : 'text-[#527078] hover:text-[#17343a]'
                }`}
              >
                All ({lines.length})
              </button>
              <button
                onClick={() => setFilterMode('gap')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors flex items-center gap-1 ${
                  filterMode === 'gap'
                    ? 'bg-rose-700 text-white shadow-2xs'
                    : 'text-[#527078] hover:text-rose-600'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span>Gap ({linesWithGapCount})</span>
              </button>
              <button
                onClick={() => setFilterMode('ahead')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors flex items-center gap-1 ${
                  filterMode === 'ahead'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-[#527078] hover:text-emerald-600'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Ahead ({linesAheadCount})</span>
              </button>
            </div>

            {/* View Mode Switcher: Scrollable Cards vs Grid */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#d9d2c2]">
              <button
                type="button"
                onClick={() => setViewMode('scroll')}
                className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === 'scroll'
                    ? 'bg-[#176f78] text-white shadow-2xs'
                    : 'text-[#527078] hover:text-[#17343a]'
                }`}
                title="Horizontal Scrollable Card Carousel"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="text-[11px]">Scroll</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === 'grid'
                    ? 'bg-[#176f78] text-white shadow-2xs'
                    : 'text-[#527078] hover:text-[#17343a]'
                }`}
                title="Standard Grid Layout"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="text-[11px]">Grid</span>
              </button>
            </div>

            {/* Horizontal Scroll Navigation Controls */}
            {viewMode === 'scroll' && filteredLines.length > 0 && (
              <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-xl border border-[#d9d2c2]">
                <span className="text-[11px] font-mono-numbers font-bold text-[#17343a] mr-1">
                  {Math.min(activeCardIndex + 1, filteredLines.length)}/{filteredLines.length}
                </span>
                <button
                  type="button"
                  onClick={handleScrollLeft}
                  disabled={!canScrollLeft}
                  className={`p-1 rounded-lg transition-colors ${
                    canScrollLeft
                      ? 'text-[#17343a] hover:bg-[#f1eee6] active:bg-[#e7e1d5]'
                      : 'text-stone-300 cursor-not-allowed'
                  }`}
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleScrollRight}
                  disabled={!canScrollRight}
                  className={`p-1 rounded-lg transition-colors ${
                    canScrollRight
                      ? 'text-[#17343a] hover:bg-[#f1eee6] active:bg-[#e7e1d5]'
                      : 'text-stone-300 cursor-not-allowed'
                  }`}
                  aria-label="Scroll right"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Swipe Hint Notice */}
        {viewMode === 'scroll' && (
          <div className="flex sm:hidden items-center justify-between text-[11px] text-[#527078] px-1">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-[#176f78] animate-pulse" />
              <span>Swipe horizontally to browse line cards</span>
            </span>
            <span className="font-mono-numbers font-semibold text-[#17343a]">
              Line {activeCardIndex + 1} of {filteredLines.length}
            </span>
          </div>
        )}

        {/* Line Metrics Cards Container (Scrollable Carousel or Multi-Column Grid) */}
        {filteredLines.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-[#d9d2c2] text-[#527078]">
            <p className="font-medium text-sm">No sewing lines found matching the selected filter criteria.</p>
            <button
              onClick={() => {
                setFilterMode('all');
                setSelectedFloor('all');
              }}
              className="mt-2 text-xs font-bold text-[#176f78] underline cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div
            ref={scrollRef}
            tabIndex={0}
            className={
              viewMode === 'scroll'
                ? "flex overflow-x-auto snap-x snap-mandatory gap-3.5 pb-3.5 pt-1 px-1 scroll-smooth no-scrollbar -mx-2 sm:mx-0 focus:outline-hidden"
                : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5"
            }
          >
            {filteredLines.map(line => {
              const metrics = calculateLineMetrics(line);
              const lineGap = line.achievedProd - line.targetProd;
              const linePct = line.targetProd > 0 ? (line.achievedProd / line.targetProd) * 100 : 0;
              const isAhead = lineGap >= 0;
              const isCritical = linePct < 80;

              // Visual Alert: current efficiency falls below targetEff by > 10%
              const currentEff = metrics.efficiencyPct || line.efficiency || 0;
              const targetEff = line.targetEff || metrics.targetEffPct || 0;
              const effDrop = targetEff - currentEff;
              const isEffAlert = effDrop > 10;

              return (
                <div
                  key={line.id || line.lineNo}
                  className={`rounded-2xl border p-4 shadow-2xs transition-all cursor-pointer group relative flex flex-col justify-between select-none ${
                    viewMode === 'scroll'
                      ? 'w-[84vw] sm:w-[320px] max-w-[340px] shrink-0 snap-start'
                      : 'w-full'
                  } ${
                    isEffAlert
                      ? 'border-2 border-rose-500 ring-2 ring-rose-400/80 ring-offset-2 animate-pulse bg-rose-50/40 shadow-rose-100'
                      : 'border-[#e7e1d5] bg-white hover:border-[#176f78]/50 hover:shadow-xs'
                  }`}
                  onClick={() => {
                    if (onSelectLine) onSelectLine(line.lineNo);
                    if (onNavigate) onNavigate('linedata');
                  }}
                >
                  {/* Visual Alert Badge: Efficiency below target by > 10% */}
                  {isEffAlert && (
                    <div className="mb-2.5 flex items-center justify-between px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[10px] font-extrabold tracking-wide uppercase shadow-xs animate-pulse">
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-white shrink-0" />
                        <span>EFF ALERT: -{Math.round(effDrop)}% Below Target</span>
                      </div>
                      <span className="font-mono-numbers">({currentEff}% vs {targetEff}%)</span>
                    </div>
                  )}

                  {/* Top Metadata Row: Floor, Line Number & Variance Badge */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#527078]">
                        <Building2 className="w-3 h-3 text-[#176f78]" />
                        <span>{line.floor || 'Unit-2'} • {line.apartment || 'Floor 01'}</span>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono-numbers shrink-0 ${
                          isAhead
                            ? 'bg-emerald-100 text-emerald-800'
                            : isCritical
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isAhead ? `+${lineGap} pcs` : `${lineGap} pcs`}
                      </span>
                    </div>

                    {/* Line Header with Buyer & Style */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="px-2 py-0.5 rounded-md font-bold text-xs bg-[#dceceb] text-[#176f78] font-mono-numbers shrink-0">
                          Line {line.lineNo}
                        </span>
                        <span className="text-[11px] font-medium text-[#527078] truncate" title={`${line.buyer} • ${line.style}`}>
                          {line.buyer} • {line.style}
                        </span>
                      </div>
                    </div>

                    {/* Operational Badges: Planned MP & In-line WIP Buffer */}
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#f1eee6] text-[#527078] font-mono-numbers">
                        {line.plannedMP || 45} MP
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#f1eee6] text-[#527078] font-mono-numbers">
                        WIP: {line.wip ?? 0} pcs
                      </span>
                      {line.smv > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#f1eee6] text-[#527078] font-mono-numbers">
                          SMV {line.smv.toFixed(1)}
                        </span>
                      )}
                    </div>

                    {/* Efficiency Comparison Metric Box */}
                    <div className="flex items-center justify-between text-[11px] mb-2 px-2.5 py-1.5 rounded-lg bg-[#f8f6f0] border border-[#e7e1d5]/60">
                      <span className="text-[#527078] font-bold">Line Efficiency:</span>
                      <div className="flex items-center gap-1.5 font-mono-numbers text-xs">
                        <span className={`font-bold ${isEffAlert ? 'text-rose-600 font-extrabold' : 'text-[#17343a]'}`}>
                          {currentEff}%
                        </span>
                        <span className="text-[#527078] font-normal">/ Target {targetEff}%</span>
                      </div>
                    </div>

                    {/* Production Output Numbers */}
                    <div className="flex items-baseline justify-between mb-1.5">
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-bold font-mono-numbers text-[#17343a]">
                          {(line.achievedProd ?? 0).toLocaleString()}
                        </span>
                        <span className="text-xs text-[#527078] font-mono-numbers">
                          / {(line.targetProd ?? 0).toLocaleString()} pcs
                        </span>
                      </div>
                      <div className="text-xs font-bold font-mono-numbers text-[#17343a]">
                        {linePct.toFixed(1)}%
                      </div>
                    </div>

                    {/* Progress Indicator Bar */}
                    <div className="h-2 w-full rounded-full bg-[#f1eee6] overflow-hidden relative mb-2">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isAhead
                            ? 'bg-emerald-500'
                            : isCritical
                            ? 'bg-rose-500'
                            : 'bg-[#e6813e]'
                        }`}
                        style={{ width: `${Math.min(linePct, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Details Footer: Bottleneck station & Inspect link */}
                  <div className="flex items-center justify-between text-[10px] text-[#527078] pt-2 border-t border-[#f1eee6] mt-1">
                    <div className="truncate max-w-[170px]" title={`Bottleneck: ${line.bottleneck?.station || 'None'}`}>
                      <span className="font-semibold text-[#17343a]">Bottleneck:</span>{' '}
                      <span>{line.bottleneck?.station || 'Balanced'}</span>
                    </div>

                    <span className="inline-flex items-center gap-0.5 font-bold text-[#176f78] group-hover:underline shrink-0">
                      <span>Inspect</span>
                      <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Scroll Progress Track Indicator for Horizontal Carousel */}
        {viewMode === 'scroll' && filteredLines.length > 1 && (
          <div className="space-y-1 pt-1">
            <div className="h-1.5 w-full bg-[#e7e1d5]/70 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#176f78] transition-all duration-150 rounded-full"
                style={{ width: `${Math.max(8, scrollProgress)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-[#527078] px-0.5">
              <span>Scroll or swipe to view all {filteredLines.length} sewing lines</span>
              <span className="font-mono-numbers">
                Card {Math.min(activeCardIndex + 1, filteredLines.length)} of {filteredLines.length}
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

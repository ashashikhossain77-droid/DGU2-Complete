/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Users,
  TrendingUp,
  Clock,
  Shirt,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  ChevronRight,
  Activity,
  ShieldCheck,
  Zap,
  BarChart3,
  Search
} from 'lucide-react';
import { LineEntry, UserProfile, ChecklistMap } from '../types';
import {
  calculateLineMetrics,
  calculateFactoryOverall,
  calculateStyleWipThreshold,
  calculateStyleSummary,
  calculateDayWiseSummaries,
  calculateDayOverDayVariance,
  exportReportToCSV,
  downloadCSV,
  formatDateLabel,
  isFridayHoliday
} from '../utils';

interface ReportsProps {
  lines: LineEntry[];
  todayDate: string;
  activeDate?: string;
  onSelectDate?: (date: string) => void;
  checklists?: ChecklistMap;
  profile: UserProfile;
  onNavigate?: (tab: string, lineNo?: string) => void;
  onDeleteFloor?: (floorName: string, mode: 'delete_all_lines' | 'reassign', targetFloor?: string) => void;
}

export const Reports: React.FC<ReportsProps> = ({
  lines,
  todayDate,
  activeDate,
  onSelectDate,
  checklists,
  profile,
  onNavigate
}) => {
  const [reportDate, setReportDate] = useState(todayDate);
  const [floorFilter, setFloorFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [reportView, setReportView] = useState<'all' | 'day_wise' | 'summaries' | 'matrix'>('all');

  // Day-wise multi-day aggregated ledger
  const dayWiseSummaries = useMemo(() => {
    return calculateDayWiseSummaries(lines, checklists);
  }, [lines, checklists]);

  // Overall Factory Summarized Metrics
  const factory = useMemo(() => calculateFactoryOverall(lines), [lines]);

  // Aggregated Style & Buyer Summarized Metrics
  const styleSummaries = useMemo(() => calculateStyleSummary(lines), [lines]);

  // Filtered Lines for the Detailed Matrix
  const filteredLines = useMemo(() => {
    return lines.filter(l => {
      const matchFloor = floorFilter === 'all' || l.floor.toLowerCase().includes(floorFilter.toLowerCase());
      const matchSearch =
        !searchQuery ||
        l.style.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.buyer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.lineNo.includes(searchQuery);
      return matchFloor && matchSearch;
    });
  }, [lines, floorFilter, searchQuery]);

  // Style WIP Audit Data
  const styleWipData = useMemo(() => {
    return lines.map(line => {
      const wipInfo = calculateStyleWipThreshold(line);
      return {
        line,
        wipInfo
      };
    });
  }, [lines]);

  // Floor-wise Aggregated Summaries
  const floorSummaries = useMemo(() => {
    const map = new Map<string, {
      floor: string;
      linesCount: number;
      targetProd: number;
      achievedProd: number;
      presentMP: number;
      absentMP: number;
      producedMinutes: number;
      availableMinutes: number;
      totalWip: number;
    }>();

    lines.forEach(line => {
      const metrics = calculateLineMetrics(line);
      const floorKey = line.floor.includes('Floor 01') ? 'Floor 01' : line.floor.includes('Floor 02') ? 'Floor 02' : line.floor;

      if (!map.has(floorKey)) {
        map.set(floorKey, {
          floor: floorKey,
          linesCount: 1,
          targetProd: line.targetProd,
          achievedProd: line.achievedProd,
          presentMP: metrics.totalPresentMP,
          absentMP: metrics.totalAbsentMP,
          producedMinutes: metrics.standardProducedMinutes,
          availableMinutes: metrics.availableMinutes,
          totalWip: line.wip
        });
      } else {
        const item = map.get(floorKey)!;
        item.linesCount += 1;
        item.targetProd += line.targetProd;
        item.achievedProd += line.achievedProd;
        item.presentMP += metrics.totalPresentMP;
        item.absentMP += metrics.totalAbsentMP;
        item.producedMinutes += metrics.standardProducedMinutes;
        item.availableMinutes += metrics.availableMinutes;
        item.totalWip += line.wip;
      }
    });

    return Array.from(map.values()).map(item => {
      const effPct = item.availableMinutes > 0 ? Math.round((item.producedMinutes / item.availableMinutes) * 1000) / 10 : 0;
      const attRate = (item.presentMP + item.absentMP) > 0 ? Math.round((item.presentMP / (item.presentMP + item.absentMP)) * 1000) / 10 : 100;
      return {
        ...item,
        effPct,
        attRate
      };
    });
  }, [lines]);

  // Hourly Factory Output Summarized Data
  const hourlyOutputSummary = [
    { hour: '08:00 - 09:00', actual: 580, target: 620, cumulative: 580 },
    { hour: '09:00 - 10:00', actual: 640, target: 620, cumulative: 1220 },
    { hour: '10:00 - 11:00', actual: 660, target: 620, cumulative: 1880 },
    { hour: '11:00 - 12:00', actual: 630, target: 620, cumulative: 2510 },
    { hour: '13:00 - 14:00', actual: 650, target: 620, cumulative: 3160 },
    { hour: '14:00 - 15:00', actual: 670, target: 620, cumulative: 3830 },
    { hour: '15:00 - 16:00', actual: 680, target: 620, cumulative: 4510 },
    { hour: '16:00 - 17:00', actual: 630, target: 620, cumulative: 5140 }
  ];

  // Export CSV Handler
  const handleExportCSV = () => {
    const csv = exportReportToCSV(lines, reportDate);
    downloadCSV(`IE_Summarized_Shift_Report_${reportDate}.csv`, csv);
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  const breachedWipLinesCount = styleWipData.filter(d => d.wipInfo.isBreached).length;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div id="reports-header-card" className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-[#dceceb] text-[#176f78] tracking-wider">
                Consolidated IE Audit Suite
              </span>
              <span className="text-xs text-[#527078] font-medium">Shift Summarized Analytics &amp; Control Logs</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase text-[#17343a] tracking-tight">
              Factory IE Summarized Reports
            </h1>
            <p className="text-xs sm:text-sm text-[#527078] mt-1 max-w-3xl leading-relaxed">
              Consolidated executive performance summaries, style-level production rollups, calculated WIP buffer compliance, and floor line telemetry.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              id="btn-export-csv"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#176f78] text-white hover:bg-[#12555c] transition-colors text-xs font-bold shadow-2xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV (With Summaries)</span>
            </button>
            <button
              id="btn-print-report"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#f1eee6] border border-[#d9d2c2] text-[#17343a] hover:bg-[#e7e1d5] transition-colors text-xs font-bold cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Sheet</span>
            </button>
          </div>
        </div>

        {/* View Switcher & Filter Controls */}
        <div className="mt-5 pt-4 border-t border-[#e7e1d5] flex flex-wrap items-center justify-between gap-4 text-xs">
          {/* View Mode Tabs */}
          <div className="flex items-center p-1 bg-[#f1eee6] rounded-xl border border-[#d9d2c2]">
            <button
              id="btn-view-all"
              type="button"
              onClick={() => setReportView('all')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                reportView === 'all'
                  ? 'bg-white text-[#17343a] shadow-2xs'
                  : 'text-[#527078] hover:text-[#17343a]'
              }`}
            >
              Full Consolidated Report
            </button>
            <button
              id="btn-view-summaries"
              type="button"
              onClick={() => setReportView('summaries')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                reportView === 'summaries'
                  ? 'bg-white text-[#17343a] shadow-2xs'
                  : 'text-[#527078] hover:text-[#17343a]'
              }`}
            >
              Executive &amp; Style Summaries
            </button>
            <button
              id="btn-view-matrix"
              type="button"
              onClick={() => setReportView('matrix')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                reportView === 'matrix'
                  ? 'bg-white text-[#17343a] shadow-2xs'
                  : 'text-[#527078] hover:text-[#17343a]'
              }`}
            >
              Detailed Line Matrix
            </button>
            <button
              id="btn-view-daywise"
              type="button"
              onClick={() => setReportView('day_wise')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                reportView === 'day_wise'
                  ? 'bg-white text-[#17343a] shadow-2xs'
                  : 'text-[#527078] hover:text-[#17343a]'
              }`}
            >
              Day-wise Production Ledger
            </button>
          </div>

          {/* Date, Floor, Search Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-[#f1eee6] px-3 py-1.5 rounded-xl border border-[#d9d2c2]">
              <Calendar className="w-3.5 h-3.5 text-[#176f78]" />
              <input
                id="input-report-date"
                type="date"
                value={reportDate}
                onChange={e => e.target.value && setReportDate(e.target.value)}
                className="bg-transparent font-bold font-mono-numbers text-[#17343a] focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2 bg-[#f1eee6] px-3 py-1.5 rounded-xl border border-[#d9d2c2]">
              <Filter className="w-3.5 h-3.5 text-[#176f78]" />
              <select
                id="select-floor-filter"
                value={floorFilter}
                onChange={e => setFloorFilter(e.target.value)}
                className="bg-transparent font-bold text-[#17343a] focus:outline-hidden cursor-pointer"
              >
                <option value="all">All Sewing Floors ({lines.length} Lines)</option>
                {floorSummaries.map(fs => (
                  <option key={fs.floor} value={fs.floor}>
                    {fs.floor} ({fs.linesCount} Lines)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-[#f1eee6] px-3 py-1.5 rounded-xl border border-[#d9d2c2]">
              <Search className="w-3.5 h-3.5 text-[#527078]" />
              <input
                id="input-report-search"
                type="text"
                placeholder="Filter style or line..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs text-[#17343a] placeholder-[#527078] focus:outline-hidden w-28 sm:w-36"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          1. EXECUTIVE SUMMARIZED DATA SECTION
      ======================================================== */}
      {(reportView === 'all' || reportView === 'summaries') && (
        <div className="space-y-6">
          {/* Executive KPI Summarized Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Efficiency Summary */}
            <div id="summary-card-efficiency" className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] p-5 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-[#527078] font-bold uppercase tracking-wider mb-2">
                <span>Plant Efficiency</span>
                <TrendingUp className="w-4 h-4 text-[#176f78]" />
              </div>
              <div className="font-display text-3xl font-black text-[#17343a] font-mono-numbers">
                {factory.overallEfficiency}%
              </div>
              <div className="text-xs text-[#527078] mt-2 flex items-center justify-between border-t border-[#e7e1d5] pt-2">
                <span>Standard Produced:</span>
                <span className="font-bold text-[#17343a] font-mono-numbers">
                  {factory.totalProducedMinutes.toLocaleString()} min
                </span>
              </div>
              <div className="text-xs text-[#527078] mt-1 flex items-center justify-between">
                <span>Available Operator:</span>
                <span className="font-bold text-[#17343a] font-mono-numbers">
                  {factory.totalAvailableMinutes.toLocaleString()} min
                </span>
              </div>
            </div>

            {/* Card 2: Production Volume Summary */}
            <div id="summary-card-production" className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] p-5 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-[#527078] font-bold uppercase tracking-wider mb-2">
                <span>Total Output vs Target</span>
                <Shirt className="w-4 h-4 text-[#176f78]" />
              </div>
              <div className="font-display text-3xl font-black text-[#17343a] font-mono-numbers">
                {factory.totalAchievedProd.toLocaleString()}
                <span className="text-sm font-normal text-[#527078] ml-1">
                  / {factory.totalTargetProd.toLocaleString()} pcs
                </span>
              </div>
              <div className="text-xs text-[#527078] mt-2 flex items-center justify-between border-t border-[#e7e1d5] pt-2">
                <span>Achievement Rate:</span>
                <span className={`font-bold font-mono-numbers ${
                  factory.totalAchievedProd >= factory.totalTargetProd ? 'text-emerald-700' : 'text-amber-700'
                }`}>
                  {factory.totalTargetProd > 0 ? Math.round((factory.totalAchievedProd / factory.totalTargetProd) * 100) : 0}%
                </span>
              </div>
              <div className="text-xs text-[#527078] mt-1 flex items-center justify-between">
                <span>Shift Variance:</span>
                <span className={`font-bold font-mono-numbers ${
                  factory.targetVariance >= 0 ? 'text-emerald-700' : 'text-rose-600'
                }`}>
                  {factory.targetVariance >= 0 ? `+${factory.targetVariance}` : factory.targetVariance} pcs
                </span>
              </div>
            </div>

            {/* Card 3: Manpower & Attendance Summary */}
            <div id="summary-card-manpower" className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] p-5 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-[#527078] font-bold uppercase tracking-wider mb-2">
                <span>Manpower Attendance</span>
                <Users className="w-4 h-4 text-[#176f78]" />
              </div>
              <div className="font-display text-3xl font-black text-[#17343a] font-mono-numbers">
                {factory.attendanceRate}%
              </div>
              <div className="text-xs text-[#527078] mt-2 flex items-center justify-between border-t border-[#e7e1d5] pt-2">
                <span>Present Operators/Helpers:</span>
                <span className="font-bold text-emerald-700 font-mono-numbers">
                  {factory.totalPresent} staff
                </span>
              </div>
              <div className="text-xs text-[#527078] mt-1 flex items-center justify-between">
                <span>Unplanned Absenteeism:</span>
                <span className="font-bold text-rose-600 font-mono-numbers">
                  {factory.totalAbsent} staff ({factory.totalAbsent * 8}h loss)
                </span>
              </div>
            </div>

            {/* Card 4: In-Line WIP Buffer & Flow Summary */}
            <div id="summary-card-wip" className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] p-5 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-[#527078] font-bold uppercase tracking-wider mb-2">
                <span>In-Line Buffer WIP</span>
                <Layers className="w-4 h-4 text-[#176f78]" />
              </div>
              <div className="font-display text-3xl font-black text-[#17343a] font-mono-numbers">
                {factory.totalWip.toLocaleString()}
                <span className="text-sm font-normal text-[#527078] ml-1">pcs</span>
              </div>
              <div className="text-xs text-[#527078] mt-2 flex items-center justify-between border-t border-[#e7e1d5] pt-2">
                <span>Style Buffer Compliance:</span>
                <span className={`font-bold font-mono-numbers ${
                  breachedWipLinesCount === 0 ? 'text-emerald-700' : 'text-rose-600'
                }`}>
                  {lines.length - breachedWipLinesCount} / {lines.length} Compliant
                </span>
              </div>
              <div className="text-xs text-[#527078] mt-1 flex items-center justify-between">
                <span>WIP Overload Alerts:</span>
                <span className={`font-bold font-mono-numbers ${
                  breachedWipLinesCount > 0 ? 'text-rose-600' : 'text-[#527078]'
                }`}>
                  {breachedWipLinesCount} Style{breachedWipLinesCount !== 1 ? 's' : ''} Exceeded
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================
              2. AGGREGATED STYLE & BUYER PRODUCTION SUMMARY TABLE
          ======================================================== */}
          <div id="summary-styles-table-container" className="rounded-2xl border border-[#d9d2c2] bg-white p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#e7e1d5] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Shirt className="w-5 h-5 text-[#176f78]" />
                  <h3 className="font-display text-lg sm:text-xl font-bold uppercase text-[#17343a]">
                    Aggregated Style &amp; Buyer Production Summary
                  </h3>
                </div>
                <p className="text-xs text-[#527078] mt-0.5">
                  Consolidated production volume, SMV values, manpower allocation, and weighted efficiency grouped by garment style.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#f1eee6] text-[#17343a] border border-[#d9d2c2] self-start sm:self-auto">
                {styleSummaries.length} Active Garment Styles
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                  <tr className="border-b border-slate-300">
                    <th className="py-2.5 px-3 border-r border-slate-200">Garment Style</th>
                    <th className="py-2.5 px-3 border-r border-slate-200">Buyer</th>
                    <th className="py-2.5 px-2.5 border-r border-slate-200 text-center">Lines</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 text-right">Order Qty</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 text-right">Shift Target</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 text-right">Achieved</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 text-right">Variance</th>
                    <th className="py-2.5 px-2.5 border-r border-slate-200 text-right">SMV</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 text-center">MP (P/A)</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 text-right font-black">Efficiency</th>
                    <th className="py-2.5 px-3 text-center">Fulfillment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {styleSummaries.map(s => {
                    const isFmtMet = s.totalAchievedProd >= s.totalTargetProd;
                    return (
                      <tr key={s.style} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-[#17343a] border-r border-slate-200">
                          {s.style}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-600 border-r border-slate-200">
                          {s.buyer}
                        </td>
                        <td className="py-2.5 px-2.5 border-r border-slate-200 text-center">
                          <div className="flex items-center justify-center gap-1 flex-wrap">
                            {s.lineNumbers.map(l => (
                              <span
                                key={l}
                                onClick={() => onNavigate && onNavigate('linedata', l)}
                                className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#dceceb] text-[#176f78] cursor-pointer hover:underline"
                              >
                                L{l}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono-numbers text-slate-600">
                          {s.totalOrderQty.toLocaleString()} pcs
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono-numbers">
                          {s.totalTargetProd.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono-numbers font-bold text-[#17343a]">
                          {s.totalAchievedProd.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono-numbers font-bold">
                          <span className={s.variancePcs >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                            {s.variancePcs >= 0 ? `+${s.variancePcs}` : s.variancePcs}
                          </span>
                        </td>
                        <td className="py-2.5 px-2.5 border-r border-slate-200 text-right font-mono-numbers text-slate-700">
                          {s.avgSmv.toFixed(2)}m
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono-numbers">
                          <span className="font-bold text-slate-800">{s.totalPresentMP}</span> / <span className="text-rose-600">{s.totalAbsentMP}</span>
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono-numbers font-bold">
                          <span className={s.avgEfficiencyPct >= 85 ? 'text-emerald-700' : 'text-amber-700'}>
                            {s.avgEfficiencyPct}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isFmtMet ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {s.fulfillmentPct}% Target
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ========================================================
              3. STYLE WIP LEVEL & CALCULATED THRESHOLD AUDIT SUMMARY
          ======================================================== */}
          <div id="summary-wip-audit-container" className="rounded-2xl border border-[#d9d2c2] bg-white p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#e7e1d5] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#176f78]" />
                  <h3 className="font-display text-lg sm:text-xl font-bold uppercase text-[#17343a]">
                    Style In-Line WIP vs Calculated Threshold Summary
                  </h3>
                </div>
                <p className="text-xs text-[#527078] mt-0.5">
                  Calculated standard WIP buffer based on style SMV complexity, shift takt pace, and allowable buffer hours (1.8h - 2.5h).
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  {breachedWipLinesCount} High WIP Trigger{breachedWipLinesCount !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                  <tr className="border-b border-slate-300">
                    <th className="py-2.5 px-3 border-r border-slate-200">Line</th>
                    <th className="py-2.5 px-3 border-r border-slate-200">Garment Style</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 text-right">Hourly Pace</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 text-right">Buffer Allowance</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 text-right font-black">Calculated Threshold</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 text-right font-black">Current WIP</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 text-center">Buffer Status</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 text-right">Buffer Variance</th>
                    <th className="py-2.5 px-3">Bottleneck &amp; IE Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {styleWipData.map(({ line, wipInfo }) => {
                    const isExceeded = wipInfo.isBreached;
                    return (
                      <tr key={line.id} className={`hover:bg-slate-50 transition-colors ${
                        isExceeded ? 'bg-rose-50/40' : ''
                      }`}>
                        <td className="py-2.5 px-3 font-bold border-r border-slate-200">
                          <span
                            onClick={() => onNavigate && onNavigate('linedata', line.lineNo)}
                            className="text-[#176f78] hover:underline cursor-pointer font-bold"
                          >
                            Line {line.lineNo}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-[#17343a] border-r border-slate-200">
                          {line.style}
                          <span className="text-[10px] text-slate-400 block">{line.buyer}</span>
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono-numbers text-slate-600">
                          {wipInfo.hourlyTarget} pcs/hr
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono-numbers text-slate-600">
                          {wipInfo.bufferHours} hrs buffer
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono-numbers font-bold text-[#17343a]">
                          {wipInfo.threshold} pcs
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono-numbers font-black">
                          <span className={isExceeded ? 'text-rose-600 text-sm' : 'text-[#17343a]'}>
                            {line.wip} pcs
                          </span>
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            wipInfo.wipStatus === 'critical'
                              ? 'bg-rose-600 text-white'
                              : wipInfo.wipStatus === 'caution'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {wipInfo.wipStatus === 'critical' ? 'High WIP Alert' : wipInfo.wipStatus === 'caution' ? 'Buffer Caution' : 'Optimal'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono-numbers font-bold">
                          <span className={isExceeded ? 'text-rose-600' : 'text-emerald-700'}>
                            {isExceeded ? `+${wipInfo.overloadPcs} pcs` : `${line.wip - wipInfo.threshold} pcs`}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[11px]">
                          <strong className="text-[#17343a]">{line.bottleneck.station}</strong> ({line.bottleneck.cycleTime}s vs {line.bottleneck.targetCT}s)
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {isExceeded
                              ? 'Action: Restrict input bundle release; reassign floater to clear station.'
                              : line.bottleneck.action || 'Standard pull flow observed'}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300">
                  <tr>
                    <td colSpan={5} className="py-2.5 px-3 border-r border-slate-200 uppercase text-slate-700">
                      Total Factory WIP Accumulation
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono-numbers font-black text-sm text-[#17343a]">
                      {factory.totalWip.toLocaleString()} pcs
                    </td>
                    <td colSpan={3} className="py-2.5 px-3 text-slate-600 text-[11px]">
                      {breachedWipLinesCount === 0
                        ? 'All lines operating within style Kanban buffer thresholds.'
                        : `${breachedWipLinesCount} line(s) currently exceed standard buffer capacity; line supervisor action required.`}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* ========================================================
              4. HOURLY SHIFT OUTPUT & FLOOR-WISE SUMMARIES (2-COL)
          ======================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hourly Output Summary */}
            <div id="summary-hourly-pace-container" className="rounded-2xl border border-[#d9d2c2] bg-white p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#e7e1d5] pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#176f78]" />
                  <h3 className="font-display text-lg font-bold uppercase text-[#17343a]">
                    Hourly Factory Output &amp; Pace Summary
                  </h3>
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Shift Pace: 642 pcs/hr
                </span>
              </div>

              <div className="space-y-2.5">
                {hourlyOutputSummary.map(item => {
                  const pct = Math.min(100, Math.round((item.actual / item.target) * 100));
                  const isMet = item.actual >= item.target;

                  return (
                    <div key={item.hour} className="flex items-center gap-3 text-xs">
                      <span className="w-28 font-mono-numbers text-[11px] text-[#527078] font-bold shrink-0">
                        {item.hour}
                      </span>
                      <div className="flex-1 h-3 rounded-md bg-slate-100 overflow-hidden relative">
                        <div
                          className={`h-full rounded-md transition-all duration-300 ${
                            isMet ? 'bg-[#176f78]' : 'bg-[#e6813e]'
                          }`}
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                      <div className="w-24 text-right font-mono-numbers text-[11px] shrink-0">
                        <strong className="text-[#17343a]">{item.actual}</strong>
                        <span className="text-[#527078]">/{item.target} pcs</span>
                      </div>
                      <span className={`w-12 text-right text-[10px] font-bold font-mono-numbers ${
                        isMet ? 'text-emerald-700' : 'text-amber-700'
                      }`}>
                        {pct}%
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-[#e7e1d5] flex items-center justify-between text-xs text-[#527078]">
                <span>Cumulative Shift Output: <strong className="text-[#17343a] font-mono-numbers">{(factory.totalAchievedProd ?? 0).toLocaleString()} pcs</strong></span>
                <span className="text-emerald-700 font-bold">Target: {(factory.totalTargetProd ?? 0).toLocaleString()} pcs</span>
              </div>
            </div>

            {/* Floor-wise Comparative Summary */}
            <div id="summary-floor-rollup-container" className="rounded-2xl border border-[#d9d2c2] bg-white p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#e7e1d5] pb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#176f78]" />
                  <h3 className="font-display text-lg font-bold uppercase text-[#17343a]">
                    Floor-Wise Operational Rollup
                  </h3>
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#f1eee6] text-[#17343a]">
                  2 Production Units
                </span>
              </div>

              <div className="space-y-4">
                {floorSummaries.map(f => (
                  <div key={f.floor} className="p-4 rounded-xl border border-[#e7e1d5] bg-[#fbfaf6] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded font-bold text-xs bg-[#176f78] text-white">
                          {f.floor}
                        </span>
                        <span className="text-xs font-bold text-[#17343a]">
                          {f.linesCount} Active Lines
                        </span>
                      </div>
                      <span className="font-display text-lg font-bold text-[#17343a] font-mono-numbers">
                        {f.effPct}% Eff
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="p-2 rounded-lg bg-white border border-[#e7e1d5]">
                        <span className="text-[10px] text-[#527078] block">Target Output</span>
                        <span className="font-bold font-mono-numbers text-[#17343a]">{f.targetProd.toLocaleString()} pcs</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white border border-[#e7e1d5]">
                        <span className="text-[10px] text-[#527078] block">Achieved Output</span>
                        <span className="font-bold font-mono-numbers text-[#17343a]">{f.achievedProd.toLocaleString()} pcs</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white border border-[#e7e1d5]">
                        <span className="text-[10px] text-[#527078] block">Present Staff</span>
                        <span className="font-bold font-mono-numbers text-emerald-700">{f.presentMP} (Att: {f.attRate}%)</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white border border-[#e7e1d5]">
                        <span className="text-[10px] text-[#527078] block">In-Line WIP</span>
                        <span className="font-bold font-mono-numbers text-[#17343a]">{f.totalWip.toLocaleString()} pcs</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-[#e7e1d5] text-xs text-[#527078]">
                Floor comparison indicates balanced operator attendance and pitch pace across units.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          DAY-WISE FACTORY PRODUCTION LEDGER & MULTI-DAY ANALYSIS
      ======================================================== */}
      {(reportView === 'all' || reportView === 'day_wise') && (
        <div id="day-wise-production-ledger" className="rounded-2xl border border-[#d9d2c2] bg-white p-6 shadow-2xs space-y-6">
          {/* Header & Controls */}
          <div className="border-b border-[#e7e1d5] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#176f78] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#176f78]" />
                <span>Multi-Day Factory Telemetry • Historical Production Log</span>
              </div>
              <h2 className="font-display text-2xl font-bold uppercase text-[#17343a] tracking-tight">
                Day-wise Production Ledger &amp; Variance Analysis
              </h2>
              <div className="text-xs text-[#527078] font-medium mt-0.5">
                Comparing operational records across production days (including Debonair Unit-2 34-line dataset on 17 Sep)
              </div>
            </div>

            <button
              id="btn-export-daywise-csv"
              type="button"
              onClick={() => {
                const csvRows = [
                  ['Date', 'Active Lines', 'Target Prod (Pcs)', 'Achieved Prod (Pcs)', 'Variance (Pcs)', 'Efficiency (%)', 'Present MP', 'Absent MP', 'Produced Min', 'Available Min', 'Checklist (%)'],
                  ...dayWiseSummaries.map(d => [
                    d.date,
                    d.totalLines,
                    d.targetProd,
                    d.achievedProd,
                    d.variancePcs,
                    `${d.efficiencyPct}%`,
                    d.presentMP,
                    d.absentMP,
                    d.producedMinutes,
                    d.availableMinutes,
                    `${d.checklistCompliancePct}%`
                  ])
                ];
                const csvContent = csvRows.map(r => r.join(',')).join('\n');
                downloadCSV(csvContent, `ie_day_wise_production_summary_${new Date().toISOString().split('T')[0]}.csv`);
              }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#d9d2c2] bg-[#fbfaf6] hover:bg-[#f1eee6] text-xs font-bold text-[#17343a] transition-all cursor-pointer self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5 text-[#176f78]" />
              <span>Export Day-wise CSV</span>
            </button>
          </div>

          {/* High-level Multi-Day Rollup KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-[#e7e1d5] bg-[#fbfaf6]">
              <span className="text-[11px] font-bold uppercase text-[#527078] block">Recorded Production Days</span>
              <span className="font-display text-2xl font-bold text-[#17343a] font-mono-numbers">
                {dayWiseSummaries.length} Days
              </span>
              <span className="text-[11px] text-[#527078] block mt-1">Multi-day historical ledger</span>
            </div>

            <div className="p-4 rounded-xl border border-[#e7e1d5] bg-[#fbfaf6]">
              <span className="text-[11px] font-bold uppercase text-[#527078] block">Peak Day Efficiency</span>
              <span className="font-display text-2xl font-bold text-emerald-700 font-mono-numbers">
                {dayWiseSummaries.length > 0 ? Math.max(...dayWiseSummaries.map(d => d.efficiencyPct)) : 0}%
              </span>
              <span className="text-[11px] text-[#527078] block mt-1">Highest shift plant average</span>
            </div>

            <div className="p-4 rounded-xl border border-[#e7e1d5] bg-[#fbfaf6]">
              <span className="text-[11px] font-bold uppercase text-[#527078] block">Total Multi-Day Output</span>
              <span className="font-display text-2xl font-bold text-[#17343a] font-mono-numbers">
                {dayWiseSummaries.reduce((sum, d) => sum + d.achievedProd, 0).toLocaleString()} pcs
              </span>
              <span className="text-[11px] text-[#527078] block mt-1">Across all logged shifts</span>
            </div>

            <div className="p-4 rounded-xl border border-[#e7e1d5] bg-[#fbfaf6]">
              <span className="text-[11px] font-bold uppercase text-[#527078] block">Avg Output / Active Line</span>
              <span className="font-display text-2xl font-bold text-[#176f78] font-mono-numbers">
                {dayWiseSummaries.length > 0
                  ? Math.round(
                      dayWiseSummaries.reduce((sum, d) => sum + d.achievedProd, 0) /
                      Math.max(1, dayWiseSummaries.reduce((sum, d) => sum + d.totalLines, 0))
                    )
                  : 0} pcs/line
              </span>
              <span className="text-[11px] text-[#527078] block mt-1">Average line productivity</span>
            </div>
          </div>

          {/* Visual Day-by-Day Production Pace Comparison Cards */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#527078]">
              Day-by-Day Output Pace &amp; Volume Trajectory
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {dayWiseSummaries.map(summary => {
                const isSelectedDay = summary.date === (activeDate || reportDate);
                const targetPct = summary.targetProd > 0 ? Math.round((summary.achievedProd / summary.targetProd) * 100) : 0;
                const isOverTarget = summary.achievedProd >= summary.targetProd;

                return (
                  <div
                    key={summary.date}
                    className={`p-4 rounded-xl border transition-all ${
                      isSelectedDay
                        ? 'border-[#176f78] bg-[#176f78]/5 ring-1 ring-[#176f78]'
                        : 'border-[#e7e1d5] bg-[#fbfaf6] hover:border-[#176f78]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-[#17343a] font-mono-numbers">
                          {formatDateLabel(summary.date)}
                        </span>
                        {isFridayHoliday(summary.date) && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-extrabold uppercase flex items-center gap-1">
                            <span>🌴</span>
                            <span>Weekly Holiday</span>
                          </span>
                        )}
                        {summary.date === '2026-09-17' && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[9px] font-bold uppercase">
                            Debonair Unit-2
                          </span>
                        )}
                      </div>
                      <span className={`px-2 py-0.5 rounded font-mono-numbers text-xs font-bold ${
                        summary.efficiencyPct >= 75
                          ? 'bg-emerald-100 text-emerald-800'
                          : summary.efficiencyPct >= 50
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {summary.efficiencyPct}% Eff
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between text-[#527078]">
                        <span>Output Achieved:</span>
                        <span className="font-bold font-mono-numbers text-[#17343a]">
                          {summary.achievedProd.toLocaleString()} / {summary.targetProd.toLocaleString()} pcs
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className={`h-full transition-all ${isOverTarget ? 'bg-emerald-600' : 'bg-[#176f78]'}`}
                          style={{ width: `${Math.min(100, targetPct)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-[#e7e1d5] text-[11px] text-[#527078]">
                        <span>Active Lines: <strong>{summary.totalLines}</strong></span>
                        <span>Att Rate: <strong>{summary.attendanceRate}%</strong></span>
                        <span>Checklist: <strong>{summary.checklistCompliancePct}%</strong></span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (onSelectDate) onSelectDate(summary.date);
                          setReportDate(summary.date);
                        }}
                        className={`w-full mt-2 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                          isSelectedDay
                            ? 'bg-[#176f78] text-white'
                            : 'bg-white border border-[#d9d2c2] text-[#17343a] hover:bg-[#f1eee6]'
                        }`}
                      >
                        {isSelectedDay ? 'Active Selected Day' : 'Inspect This Day'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Full Historical Day-by-Day Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#527078]">
              Comprehensive Day-by-Day Industrial Engineering Ledger
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse font-sans min-w-[900px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                    <th className="py-2.5 px-3 border-r border-slate-200">Date &amp; Dataset</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 text-center">Lines</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 text-right">Target (Pcs)</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 text-right">Produced (Pcs)</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 text-right">Variance</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 text-center">Plant Eff</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 text-center">Manpower</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 text-right">Std Produced Min</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 text-center">Checklist</th>
                    <th className="py-2.5 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {dayWiseSummaries.map(row => {
                    const isSelected = row.date === (activeDate || reportDate);
                    return (
                      <tr
                        key={row.date}
                        className={`hover:bg-slate-50 transition-colors ${
                          isSelected ? 'bg-sky-50/50' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 font-bold border-r border-slate-200">
                          <div className="flex items-center gap-2">
                            <span className="font-mono-numbers text-[#17343a]">{row.date}</span>
                            {row.date === '2026-09-17' ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                                Debonair Unit-2 (34 Lines)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium">
                                Standard Shift
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center border-r border-slate-200 font-mono-numbers font-bold">
                          {row.totalLines}
                        </td>
                        <td className="py-2.5 px-3 text-right border-r border-slate-200 font-mono-numbers">
                          {row.targetProd.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right border-r border-slate-200 font-mono-numbers font-bold text-[#17343a]">
                          {row.achievedProd.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right border-r border-slate-200 font-mono-numbers font-bold">
                          <span className={row.variancePcs >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                            {row.variancePcs >= 0 ? `+${row.variancePcs}` : row.variancePcs} ({row.targetProd > 0 ? Math.round((row.variancePcs / row.targetProd) * 100) : 0}%)
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center border-r border-slate-200">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-mono-numbers font-bold ${
                            row.efficiencyPct >= 75
                              ? 'bg-emerald-100 text-emerald-800'
                              : row.efficiencyPct >= 50
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {row.efficiencyPct}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center border-r border-slate-200 text-[11px] font-mono-numbers">
                          <span className="text-emerald-700 font-bold">{row.presentMP}</span>
                          <span className="text-slate-400"> / </span>
                          <span className="text-rose-600">{row.absentMP}</span>
                          <span className="text-slate-500 text-[10px] block">({row.attendanceRate}%)</span>
                        </td>
                        <td className="py-2.5 px-3 text-right border-r border-slate-200 font-mono-numbers">
                          {row.producedMinutes.toLocaleString()} min
                        </td>
                        <td className="py-2.5 px-3 text-center border-r border-slate-200 font-mono-numbers">
                          <span className={`font-bold ${row.checklistCompliancePct >= 80 ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {row.checklistCompliancePct}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              if (onSelectDate) onSelectDate(row.date);
                              setReportDate(row.date);
                              if (onNavigate) onNavigate('dashboard');
                            }}
                            className="px-2.5 py-1 rounded bg-[#176f78] text-white hover:bg-[#145f67] text-[10px] font-bold cursor-pointer transition-colors"
                          >
                            Open in Dashboard
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          5. DETAILED LINE TELEMETRY MATRIX SHEET
      ======================================================== */}
      {(reportView === 'all' || reportView === 'matrix') && (
        <div id="printable-report-sheet" className="rounded-2xl border border-[#d9d2c2] bg-white p-6 shadow-2xs space-y-6">
          {/* Formal Document Header */}
          <div className="border-b border-black/10 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#176f78]">
                Industrial Engineering Department • Shift Audit &amp; Line Inspection
              </div>
              <h2 className="font-display text-2xl font-bold uppercase text-black tracking-tight">
                Garment Line Efficiency &amp; Shift Telemetry Matrix
              </h2>
              <div className="text-xs text-slate-500 font-medium mt-0.5">
                Shift Date: <strong>{formatDateLabel(reportDate)}</strong>
                {isFridayHoliday(reportDate) && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-[10px] inline-flex items-center gap-1">
                    <span>🌴</span>
                    <span>Weekly Holiday</span>
                  </span>
                )} • Shift: <strong>General Shift (8:00 AM - 5:00 PM)</strong> • Factory Unit: Plant #1 • Showing {filteredLines.length} Lines
              </div>
            </div>

            <div className="text-left sm:text-right text-xs font-mono-numbers text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div>Doc Ref: <strong>#IE-CR-{reportDate.replace(/-/g, '')}</strong></div>
              <div>Audit Sign-off: <strong>{profile.name} ({profile.jobTitle})</strong></div>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                <tr className="border-b border-slate-300">
                  <th className="py-2.5 px-2.5 border-r border-slate-200">Line</th>
                  <th className="py-2.5 px-2.5 border-r border-slate-200">Floor</th>
                  <th className="py-2.5 px-2.5 border-r border-slate-200">Buyer</th>
                  <th className="py-2.5 px-2.5 border-r border-slate-200">Style</th>
                  <th className="py-2.5 px-2.5 border-r border-slate-200 text-right">SMV</th>
                  <th className="py-2.5 px-2.5 border-r border-slate-200 text-center">MP (P/A)</th>
                  <th className="py-2.5 px-2.5 border-r border-slate-200 text-right">Target</th>
                  <th className="py-2.5 px-2.5 border-r border-slate-200 text-right">Achieved</th>
                  <th className="py-2.5 px-2.5 border-r border-slate-200 text-right">Variance</th>
                  <th className="py-2.5 px-2.5 border-r border-slate-200 text-right">WIP (Act/Thresh)</th>
                  <th className="py-2.5 px-2.5 border-r border-slate-200 text-right">Prod. Min</th>
                  <th className="py-2.5 px-2.5 border-r border-slate-200 text-right font-black">Eff %</th>
                  <th className="py-2.5 px-2.5">Bottleneck Station &amp; Mitigation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {filteredLines.map(line => {
                  const m = calculateLineMetrics(line);
                  const wip = calculateStyleWipThreshold(line);
                  const isOverTarget = m.efficiencyPct >= line.targetEff;

                  return (
                    <tr key={line.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2 px-2.5 font-bold border-r border-slate-200">
                        <span
                          onClick={() => onNavigate && onNavigate('linedata', line.lineNo)}
                          className="text-[#176f78] hover:underline cursor-pointer font-bold"
                        >
                          Line {line.lineNo}
                        </span>
                      </td>
                      <td className="py-2 px-2.5 border-r border-slate-200 text-[11px]">
                        {line.floor}
                      </td>
                      <td className="py-2 px-2.5 border-r border-slate-200 font-medium">
                        {line.buyer}
                      </td>
                      <td className="py-2 px-2.5 border-r border-slate-200 text-[11px] truncate max-w-[130px]" title={line.style}>
                        {line.style}
                      </td>
                      <td className="py-2 px-2.5 border-r border-slate-200 font-mono-numbers text-right">
                        {line.smv.toFixed(2)}
                      </td>
                      <td className="py-2 px-2.5 border-r border-slate-200 font-mono-numbers text-center">
                        <strong>{m.totalPresentMP}</strong> / <span className="text-rose-600">{m.totalAbsentMP}</span>
                      </td>
                      <td className="py-2 px-2.5 border-r border-slate-200 font-mono-numbers text-right">
                        {line.targetProd}
                      </td>
                      <td className="py-2 px-2.5 border-r border-slate-200 font-mono-numbers font-bold text-right">
                        {line.achievedProd}
                      </td>
                      <td className="py-2 px-2.5 border-r border-slate-200 font-mono-numbers font-bold text-right">
                        <span className={m.variancePcs >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                          {m.variancePcs >= 0 ? `+${m.variancePcs}` : m.variancePcs}
                        </span>
                      </td>
                      <td className="py-2 px-2.5 border-r border-slate-200 font-mono-numbers text-right">
                        <span className={wip.isBreached ? 'text-rose-600 font-bold' : 'text-slate-800'}>
                          {line.wip}
                        </span>
                        <span className="text-slate-400 text-[10px]"> / {wip.threshold}</span>
                      </td>
                      <td className="py-2 px-2.5 border-r border-slate-200 font-mono-numbers text-right">
                        {(m.standardProducedMinutes ?? 0).toLocaleString()}
                      </td>
                      <td className="py-2 px-2.5 border-r border-slate-200 font-display text-sm font-bold text-right">
                        <span className={isOverTarget ? 'text-emerald-700' : 'text-amber-700'}>
                          {m.efficiencyPct}%
                        </span>
                      </td>
                      <td className="py-2 px-2.5 text-[11px]">
                        <strong>{line.bottleneck.station}</strong> ({line.bottleneck.cycleTime}s vs {line.bottleneck.targetCT}s)
                        {line.bottleneck.action && (
                          <div className="text-[10px] text-slate-500">{line.bottleneck.action}</div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Total Footer Row */}
              <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300">
                <tr>
                  <td colSpan={4} className="py-2.5 px-2.5 border-r border-slate-200 uppercase text-slate-700">
                    Total Plant Summary
                  </td>
                  <td className="py-2.5 px-2.5 border-r border-slate-200 font-mono-numbers text-right">-</td>
                  <td className="py-2.5 px-2.5 border-r border-slate-200 font-mono-numbers text-center">
                    {factory.totalPresent} / <span className="text-rose-600">{factory.totalAbsent}</span>
                  </td>
                  <td className="py-2.5 px-2.5 border-r border-slate-200 font-mono-numbers text-right">
                    {(factory.totalTargetProd ?? 0).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-2.5 border-r border-slate-200 font-mono-numbers text-right">
                    {(factory.totalAchievedProd ?? 0).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-2.5 border-r border-slate-200 font-mono-numbers text-right">
                    <span className={factory.targetVariance >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                      {factory.targetVariance >= 0 ? `+${factory.targetVariance}` : factory.targetVariance}
                    </span>
                  </td>
                  <td className="py-2.5 px-2.5 border-r border-slate-200 font-mono-numbers text-right">
                    {factory.totalWip.toLocaleString()} pcs
                  </td>
                  <td className="py-2.5 px-2.5 border-r border-slate-200 font-mono-numbers text-right">
                    {(factory.totalProducedMinutes ?? 0).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-2.5 border-r border-slate-200 font-display text-base text-[#176f78] text-right">
                    {factory.overallEfficiency}%
                  </td>
                  <td className="py-2.5 px-2.5 text-[11px] text-slate-600">
                    Attendance Rate: {factory.attendanceRate}% • Lines: {factory.activeLinesCount}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Verification Footer Signatures */}
          <div className="pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-slate-600">
            <div>
              <div className="font-bold uppercase text-[10px] text-slate-400">Prepared By</div>
              <div className="mt-4 pt-2 border-t border-slate-300 font-medium">
                Industrial Engineering Officer
              </div>
            </div>
            <div>
              <div className="font-bold uppercase text-[10px] text-slate-400">Reviewed By</div>
              <div className="mt-4 pt-2 border-t border-slate-300 font-medium">
                Senior IE Executive / Floor Manager
              </div>
            </div>
            <div>
              <div className="font-bold uppercase text-[10px] text-slate-400">Approved By</div>
              <div className="mt-4 pt-2 border-t border-slate-300 font-medium">
                Factory Production General Manager
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

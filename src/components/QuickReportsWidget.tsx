/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  FileText,
  TrendingUp,
  Layers,
  Users,
  Copy,
  Download,
  Check,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Shield,
  Printer
} from 'lucide-react';
import { LineEntry } from '../types';
import { calculateLineMetrics, calculateStyleWipThreshold } from '../utils';

interface QuickReportsWidgetProps {
  lines: LineEntry[];
  effectiveDate: string;
  factoryOverallEfficiency: number;
  totalTargetProd: number;
  totalAchievedProd: number;
  totalWip: number;
  totalPresentMP: number;
  totalAbsentMP: number;
  attendanceRate: number;
  activeLinesCount: number;
  totalProducedMin: number;
  totalAvailMin: number;
  onNavigateToLine?: (lineNo: string) => void;
  privacyMode?: boolean;
}

export const QuickReportsWidget: React.FC<QuickReportsWidgetProps> = ({
  lines,
  effectiveDate,
  factoryOverallEfficiency,
  totalTargetProd,
  totalAchievedProd,
  totalWip,
  totalPresentMP,
  totalAbsentMP,
  attendanceRate,
  activeLinesCount,
  totalProducedMin,
  totalAvailMin,
  onNavigateToLine,
  privacyMode = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [filterFloor, setFilterFloor] = useState<string>('all');

  // Compute detailed analytics across active lines
  const analytics = useMemo(() => {
    let operatorsCount = 0;
    let helpersCount = 0;
    let ironersCount = 0;
    let linesMeetingTarget = 0;
    let highWipCount = 0;
    let totalBufferThreshold = 0;

    const lineBreakdown = lines.map(line => {
      const metrics = calculateLineMetrics(line);
      const wipInfo = calculateStyleWipThreshold(line);
      const opPresent = line.mp?.Operator?.present ?? Math.round(line.plannedMP * 0.8);
      const helpPresent = line.mp?.Helper?.present ?? Math.round(line.plannedMP * 0.15);
      const ironPresent = line.mp?.['Iron Man']?.present ?? Math.max(0, line.plannedMP - opPresent - helpPresent);

      operatorsCount += opPresent;
      helpersCount += helpPresent;
      ironersCount += ironPresent;
      totalBufferThreshold += wipInfo.threshold;

      if (wipInfo.isBreached) {
        highWipCount++;
      }

      const eff = metrics.efficiencyPct;
      if (eff >= (metrics.targetEffPct ?? 60)) {
        linesMeetingTarget++;
      }

      return {
        line,
        metrics,
        wipInfo,
        efficiencyPct: eff,
        targetEff: line.targetEff || (lines.length > 10 ? 60 : 85),
        isMeetingTarget: eff >= (line.targetEff || (lines.length > 10 ? 60 : 85)),
        operators: opPresent,
        helpers: helpPresent,
        ironers: ironPresent,
        totalMP: opPresent + helpPresent + ironPresent,
        wip: line.wip,
        achievedProd: line.achievedProd,
        targetProd: line.targetProd,
        variancePcs: line.achievedProd - line.targetProd
      };
    });

    const avgWipPerLine = activeLinesCount > 0 ? Math.round(totalWip / activeLinesCount) : 0;
    const avgMpPerLine = activeLinesCount > 0 ? Math.round((totalPresentMP / activeLinesCount) * 10) / 10 : 0;
    const targetAttainmentPct = totalTargetProd > 0 ? Math.round((totalAchievedProd / totalTargetProd) * 100) : 0;

    return {
      lineBreakdown,
      operatorsCount,
      helpersCount,
      ironersCount,
      linesMeetingTarget,
      linesLagging: Math.max(0, activeLinesCount - linesMeetingTarget),
      highWipCount,
      totalBufferThreshold,
      avgWipPerLine,
      avgMpPerLine,
      targetAttainmentPct
    };
  }, [lines, totalWip, totalTargetProd, totalAchievedProd, totalPresentMP, activeLinesCount]);

  // Copy Executive Summary text for WhatsApp/Email/Shift Reporting
  const handleCopySummary = () => {
    const summaryText = [
      `=== FACTORY IE QUICK REPORT: ${effectiveDate} ===`,
      `Active Sewing Lines: ${activeLinesCount} lines running`,
      `---------------------------------------------`,
      `1. DAILY EFFICIENCY:`,
      `   • Overall Factory Efficiency: ${factoryOverallEfficiency}%`,
      `   • Output Achieved: ${totalAchievedProd.toLocaleString()} pcs / ${totalTargetProd.toLocaleString()} pcs (${analytics.targetAttainmentPct}%)`,
      `   • Lines Meeting Target: ${analytics.linesMeetingTarget} / ${activeLinesCount}`,
      `   • Standard Produced Time: ${totalProducedMin.toLocaleString()} min / Available: ${totalAvailMin.toLocaleString()} min`,
      ``,
      `2. TOTAL IN-LINE WIP COUNT:`,
      `   • Total In-Line WIP: ${totalWip.toLocaleString()} pcs`,
      `   • Average WIP per Line: ${analytics.avgWipPerLine.toLocaleString()} pcs`,
      `   • Buffer Health Status: ${analytics.highWipCount > 0 ? `${analytics.highWipCount} Lines Over Buffer Limit` : 'All Lines Within Balanced Buffer'}`,
      ``,
      `3. TOTAL MANPOWER ALLOCATION:`,
      `   • Total Present Headcount: ${totalPresentMP} (${attendanceRate}% Attendance)`,
      `   • Breakdown: ${analytics.operatorsCount} Operators, ${analytics.helpersCount} Helpers, ${analytics.ironersCount} Ironers/Specialists`,
      `   • Total Absent: ${totalAbsentMP} operators`,
      `   • Average Manpower / Line: ${analytics.avgMpPerLine} personnel`,
      `---------------------------------------------`,
      `Generated by Remix IE Daily Control Cockpit`
    ].join('\n');

    navigator.clipboard.writeText(summaryText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }).catch(() => {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  };

  // Download formatted CSV/TXT Report
  const handleDownloadReport = () => {
    const csvRows = [
      ['Line', 'Floor', 'Style', 'Target Pcs', 'Achieved Pcs', 'Variance Pcs', 'Efficiency %', 'Target Eff %', 'WIP Pcs', 'Operators', 'Helpers', 'Total MP', 'WIP Buffer Status'],
      ...analytics.lineBreakdown.map(item => [
        `Line ${item.line.lineNo}`,
        item.line.floor || 'Floor 01',
        privacyMode ? 'Style [REDACTED]' : item.line.style,
        item.targetProd,
        item.achievedProd,
        item.variancePcs,
        `${item.efficiencyPct}%`,
        `${item.targetEff}%`,
        item.wip,
        item.operators,
        item.helpers,
        item.totalMP,
        item.wipInfo.isBreached ? `High (+${item.wipInfo.overloadPcs} over)` : 'Normal'
      ])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Quick_IE_Report_${effectiveDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter breakdown rows by floor if user selected a filter
  const filteredBreakdown = useMemo(() => {
    if (filterFloor === 'all') return analytics.lineBreakdown;
    return analytics.lineBreakdown.filter(item => (item.line.floor || 'Floor 01') === filterFloor);
  }, [analytics.lineBreakdown, filterFloor]);

  const uniqueFloors = useMemo(() => {
    const set = new Set<string>();
    lines.forEach(l => set.add(l.floor || 'Floor 01'));
    return Array.from(set);
  }, [lines]);

  return (
    <div
      id="quick-reports-widget"
      className="rounded-3xl border border-[#d9d2c2] bg-[#fbfaf6] shadow-2xs overflow-hidden transition-all duration-300"
    >
      {/* Widget Header Strip */}
      <div className="px-5 py-4 bg-gradient-to-r from-[#17343a] to-[#12555c] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center text-teal-300 shadow-inner">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-black text-base sm:text-lg tracking-tight uppercase text-white">
                Quick Reports &bull; Daily Executive Summary
              </h2>
              {privacyMode && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/30 text-[10px] font-bold text-emerald-300">
                  <Shield className="w-3 h-3" />
                  <span>Privacy Masked</span>
                </span>
              )}
            </div>
            <p className="text-xs text-teal-100/80 mt-0.5">
              Instant multi-pillar snapshot across {activeLinesCount} active sewing lines for {effectiveDate}
            </p>
          </div>
        </div>

        {/* Quick Report Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            id="btn-copy-quick-report"
            onClick={handleCopySummary}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer border border-white/15 shadow-2xs"
            title="Copy formatted summary to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Summary</span>
              </>
            )}
          </button>

          <button
            type="button"
            id="btn-download-quick-report"
            onClick={handleDownloadReport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer border border-white/15 shadow-2xs"
            title="Download CSV spreadsheet"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Export CSV</span>
          </button>

          <button
            type="button"
            id="btn-print-quick-report"
            onClick={handlePrint}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer border border-white/15 shadow-2xs"
            title="Print or save as PDF"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3 Core Summary Pillars at a Glance */}
      <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-[#e7e1d5]">
        {/* Pillar 1: Daily Efficiency */}
        <div
          id="qr-pillar-efficiency"
          className="p-4 rounded-2xl border border-[#d9d2c2] bg-white shadow-2xs flex flex-col justify-between space-y-3"
        >
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#527078]">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#176f78]" />
              <span>1. Daily Efficiency</span>
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              factoryOverallEfficiency >= (lines.length > 10 ? 60 : 85)
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}>
              {factoryOverallEfficiency >= (lines.length > 10 ? 60 : 85) ? 'Target Met' : 'Under Target'}
            </span>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl sm:text-4xl font-black text-[#17343a] tracking-tight">
                {factoryOverallEfficiency}%
              </span>
              <span className="text-xs text-[#527078] font-mono-numbers">
                (Baseline: {lines.length > 10 ? '60.0%' : '85.0%'})
              </span>
            </div>
            <p className="text-xs text-[#527078] mt-1">
              Standard Minutes: <strong className="text-[#17343a] font-mono-numbers">{totalProducedMin.toLocaleString()}</strong> produced / <span className="font-mono-numbers">{totalAvailMin.toLocaleString()}</span> available
            </p>
          </div>

          <div className="pt-2 border-t border-[#f1eee6] space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-[#527078]">Output Attainment:</span>
              <span className="font-bold text-[#17343a] font-mono-numbers">
                {totalAchievedProd.toLocaleString()} / {totalTargetProd.toLocaleString()} pcs ({analytics.targetAttainmentPct}%)
              </span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-[#527078]">Lines on Target:</span>
              <span className="font-bold text-emerald-700 font-mono-numbers">
                {analytics.linesMeetingTarget} on target &bull; <span className="text-amber-700">{analytics.linesLagging} lagging</span>
              </span>
            </div>
          </div>
        </div>

        {/* Pillar 2: Total In-Line WIP Count */}
        <div
          id="qr-pillar-wip"
          className="p-4 rounded-2xl border border-[#d9d2c2] bg-white shadow-2xs flex flex-col justify-between space-y-3"
        >
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#527078]">
            <span className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-600" />
              <span>2. Total In-Line WIP</span>
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              analytics.highWipCount === 0
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}>
              {analytics.highWipCount === 0 ? 'Buffer Healthy' : `${analytics.highWipCount} High WIP Lines`}
            </span>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl sm:text-4xl font-black text-[#17343a] tracking-tight">
                {totalWip.toLocaleString()}
              </span>
              <span className="text-xs text-[#527078] font-bold uppercase">
                Pieces in flow
              </span>
            </div>
            <p className="text-xs text-[#527078] mt-1">
              Average across lines: <strong className="text-[#17343a] font-mono-numbers">{analytics.avgWipPerLine.toLocaleString()} pcs/line</strong>
            </p>
          </div>

          <div className="pt-2 border-t border-[#f1eee6] space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-[#527078]">Buffer Threshold Sum:</span>
              <span className="font-bold text-[#17343a] font-mono-numbers">
                {analytics.totalBufferThreshold.toLocaleString()} pcs target max
              </span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-[#527078]">Buffer Breach Warning:</span>
              <span className={`font-bold font-mono-numbers ${analytics.highWipCount > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                {analytics.highWipCount > 0 ? `${analytics.highWipCount} lines exceed buffer` : 'Zero buffer violations'}
              </span>
            </div>
          </div>
        </div>

        {/* Pillar 3: Total Manpower */}
        <div
          id="qr-pillar-manpower"
          className="p-4 rounded-2xl border border-[#d9d2c2] bg-white shadow-2xs flex flex-col justify-between space-y-3"
        >
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#527078]">
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-sky-600" />
              <span>3. Total Manpower</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800">
              {attendanceRate}% Present
            </span>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl sm:text-4xl font-black text-[#17343a] tracking-tight">
                {totalPresentMP.toLocaleString()}
              </span>
              <span className="text-xs text-[#527078] font-bold uppercase">
                Present Operators &amp; Helpers
              </span>
            </div>
            <p className="text-xs text-[#527078] mt-1">
              Average line density: <strong className="text-[#17343a] font-mono-numbers">{analytics.avgMpPerLine} personnel/line</strong>
            </p>
          </div>

          <div className="pt-2 border-t border-[#f1eee6] space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-[#527078]">Role Composition:</span>
              <span className="font-bold text-[#17343a] font-mono-numbers text-[11px]">
                {analytics.operatorsCount} Ops &bull; {analytics.helpersCount} Helpers &bull; {analytics.ironersCount} Iron
              </span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-[#527078]">Absenteeism:</span>
              <span className="font-bold text-rose-600 font-mono-numbers">
                {totalAbsentMP} absent ({Math.round(100 - attendanceRate)}% loss rate)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Drilldown Toggle Button */}
      <div className="px-5 py-3 bg-[#f1eee6]/50 flex items-center justify-between">
        <div className="text-xs text-[#527078] font-medium flex items-center gap-2">
          <span>Detailed Line Performance Matrix ({filteredBreakdown.length} lines)</span>
          {uniqueFloors.length > 1 && isExpanded && (
            <div className="flex items-center gap-1 ml-2">
              <span className="text-[10px] uppercase font-bold text-[#17343a]">Floor:</span>
              <select
                value={filterFloor}
                onChange={e => setFilterFloor(e.target.value)}
                className="text-xs bg-white border border-[#d9d2c2] rounded-lg px-2 py-0.5 text-[#17343a] focus:outline-hidden"
              >
                <option value="all">All Floors</option>
                {uniqueFloors.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <button
          type="button"
          id="btn-toggle-quick-reports-drilldown"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-[#d9d2c2] hover:border-[#176f78] text-[#176f78] font-bold text-xs transition-colors cursor-pointer shadow-2xs"
        >
          <span>{isExpanded ? 'Hide Line Breakdown' : 'Expand Line Breakdown'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expanded Line-by-Line Breakdown Table */}
      {isExpanded && (
        <div className="overflow-x-auto p-4 border-t border-[#e7e1d5] bg-white">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#d9d2c2] text-[#527078] uppercase text-[10px] font-bold bg-[#fbfaf6]">
                <th className="py-2 px-3">Line #</th>
                <th className="py-2 px-3">Floor</th>
                <th className="py-2 px-3">Style</th>
                <th className="py-2 px-3 text-right">Target</th>
                <th className="py-2 px-3 text-right">Actual</th>
                <th className="py-2 px-3 text-right">Variance</th>
                <th className="py-2 px-3 text-right">Efficiency %</th>
                <th className="py-2 px-3 text-right">In-Line WIP</th>
                <th className="py-2 px-3 text-right">Manpower</th>
                <th className="py-2 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1eee6]">
              {filteredBreakdown.map((item, idx) => {
                const isEven = idx % 2 === 0;
                const effColor = item.efficiencyPct >= item.targetEff ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold';
                const varColor = item.variancePcs >= 0 ? 'text-emerald-700' : 'text-rose-700';

                return (
                  <tr
                    key={item.line.id || item.line.lineNo}
                    onClick={() => onNavigateToLine && onNavigateToLine(item.line.lineNo)}
                    className={`${isEven ? 'bg-white' : 'bg-[#fbfaf6]'} hover:bg-teal-50/40 cursor-pointer transition-colors`}
                    title="Click to jump to Line IE detail"
                  >
                    <td className="py-2 px-3 font-bold text-[#17343a] font-mono-numbers">
                      Line {item.line.lineNo}
                    </td>
                    <td className="py-2 px-3 text-[#527078] font-medium">
                      {item.line.floor || 'Floor 01'}
                    </td>
                    <td className="py-2 px-3 font-bold text-[#17343a] max-w-[140px] truncate">
                      {privacyMode ? 'Style [REDACTED]' : item.line.style}
                    </td>
                    <td className="py-2 px-3 text-right font-mono-numbers text-[#527078]">
                      {item.targetProd}
                    </td>
                    <td className="py-2 px-3 text-right font-mono-numbers font-bold text-[#17343a]">
                      {item.achievedProd}
                    </td>
                    <td className={`py-2 px-3 text-right font-mono-numbers font-bold ${varColor}`}>
                      {item.variancePcs >= 0 ? `+${item.variancePcs}` : item.variancePcs}
                    </td>
                    <td className={`py-2 px-3 text-right font-mono-numbers ${effColor}`}>
                      {item.efficiencyPct}%
                    </td>
                    <td className="py-2 px-3 text-right font-mono-numbers">
                      <span className={item.wipInfo.isBreached ? 'text-amber-700 font-bold' : 'text-[#17343a]'}>
                        {item.wip} pcs
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono-numbers text-[#527078]">
                      {item.totalMP} ({item.operators} Op)
                    </td>
                    <td className="py-2 px-3 text-center">
                      {item.isMeetingTarget ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>On Pace</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          <span>Lagging</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

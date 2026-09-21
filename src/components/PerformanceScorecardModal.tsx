/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  X,
  Award,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  ArrowRight,
  Sparkles,
  BarChart3,
  Layers,
  ChevronRight,
  Lightbulb
} from 'lucide-react';
import { LineEntry, ChecklistMap, ScorecardResult } from '../types';
import { calculateScorecardMetrics } from '../utils';

interface PerformanceScorecardModalProps {
  isOpen: boolean;
  onClose: () => void;
  lines: LineEntry[];
  checklists: ChecklistMap;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onNavigate: (tab: string) => void;
}

export const PerformanceScorecardModal: React.FC<PerformanceScorecardModalProps> = ({
  isOpen,
  onClose,
  lines,
  checklists,
  selectedDate,
  onSelectDate,
  onNavigate
}) => {
  if (!isOpen) return null;

  const scorecard: ScorecardResult = calculateScorecardMetrics(lines, checklists, selectedDate);
  const { pillars, efficiencyPillar, checklistPillar, bottleneckPillar, recommendations } = scorecard;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-[#fbfaf6] border border-[#d9d2c2] shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e7e1d5] bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#176f78] text-white flex items-center justify-center shadow-xs">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg sm:text-xl font-bold uppercase text-[#17343a] tracking-tight">
                  Daily Factory IE Performance Scorecard
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#dceceb] text-[#176f78] border border-[#b2d6d8]">
                  Weighted Composite
                </span>
              </div>
              <p className="text-xs text-[#527078]">
                Multivariate evaluation across line efficiency, checklist compliance &amp; bottleneck resolution
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Date Selector */}
            <div className="flex items-center gap-1.5 bg-[#f1eee6] px-2.5 py-1.5 rounded-xl border border-[#d9d2c2] text-xs">
              <Calendar className="w-3.5 h-3.5 text-[#527078]" />
              <input
                type="date"
                value={selectedDate}
                onChange={e => onSelectDate(e.target.value)}
                className="bg-transparent text-xs font-mono-numbers text-[#17343a] focus:outline-hidden cursor-pointer"
              />
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#527078] hover:text-[#17343a] hover:bg-[#f1eee6] transition-colors cursor-pointer"
              aria-label="Close scorecard"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Executive Grade Banner */}
          <div className="p-5 rounded-2xl bg-white border border-[#d9d2c2] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-center gap-5">
              {/* Grade Badge */}
              <div
                className="w-20 h-20 rounded-2xl flex flex-col items-center justify-center font-display font-black text-3xl shadow-sm border-2"
                style={{
                  backgroundColor: `${scorecard.gradeColor}15`,
                  borderColor: scorecard.gradeColor,
                  color: scorecard.gradeColor
                }}
              >
                <span>{scorecard.grade}</span>
                <span className="text-[10px] font-bold tracking-normal uppercase font-sans">
                  Grade
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="font-display text-xl font-bold uppercase"
                    style={{ color: scorecard.gradeColor }}
                  >
                    {scorecard.gradeLabel}
                  </span>
                  <span className="font-mono-numbers text-xs font-bold text-[#527078]">
                    • Score: {scorecard.overallScore}/100
                  </span>
                </div>
                <p className="text-xs text-[#527078] mt-1 max-w-lg leading-relaxed">
                  Composite performance aggregated from {efficiencyPillar.linesCount} active sewing lines and {checklistPillar.totalTasks} field checklist checkpoints.
                </p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-4 text-center sm:border-l sm:border-[#e7e1d5] sm:pl-6">
              <div>
                <span className="text-[10px] font-bold uppercase text-[#527078] block">Efficiency</span>
                <span className="font-mono-numbers text-lg font-bold text-[#17343a]">
                  {efficiencyPillar.averageAchievedEff}%
                </span>
              </div>
              <div className="w-px h-8 bg-[#e7e1d5]" />
              <div>
                <span className="text-[10px] font-bold uppercase text-[#527078] block">Checklist</span>
                <span className="font-mono-numbers text-lg font-bold text-[#17343a]">
                  {checklistPillar.completionPct}%
                </span>
              </div>
              <div className="w-px h-8 bg-[#e7e1d5]" />
              <div>
                <span className="text-[10px] font-bold uppercase text-[#527078] block">Resolution</span>
                <span className="font-mono-numbers text-lg font-bold text-[#17343a]">
                  {bottleneckPillar.mitigationAdherencePct}%
                </span>
              </div>
            </div>
          </div>

          {/* 3 Core Evaluation Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Pillar 1: Line Efficiency */}
            <div className="p-4 rounded-xl bg-white border border-[#d9d2c2] shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#eef7f7] text-[#176f78] flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <span className="font-display text-xs font-bold uppercase text-[#17343a]">
                    Pillar 1: Efficiency
                  </span>
                </div>
                <span className="text-[10px] font-mono-numbers font-bold text-[#527078] bg-[#f1eee6] px-1.5 py-0.5 rounded">
                  Weight: {pillars.efficiency.weightPct}%
                </span>
              </div>

              <div>
                <div className="flex items-baseline justify-between">
                  <span className="font-mono-numbers text-2xl font-black text-[#17343a]">
                    {pillars.efficiency.scorePct}%
                  </span>
                  <span className="text-xs font-bold text-emerald-700">
                    +{pillars.efficiency.weightedScore.toFixed(1)} pts
                  </span>
                </div>
                <p className="text-[11px] text-[#527078] mt-1">{pillars.efficiency.headline}</p>
              </div>

              <div className="pt-2 border-t border-[#e7e1d5] space-y-1 text-xs font-mono-numbers">
                <div className="flex justify-between text-[#527078]">
                  <span>Attainment Ratio:</span>
                  <span className="font-bold text-[#17343a]">{efficiencyPillar.attainmentRatio}%</span>
                </div>
                <div className="flex justify-between text-[#527078]">
                  <span>Target vs Achieved:</span>
                  <span className="font-bold text-[#17343a]">
                    {efficiencyPillar.averageAchievedEff}% / {efficiencyPillar.averageTargetEff}%
                  </span>
                </div>
                <div className="flex justify-between text-[#527078]">
                  <span>On-Target Lines:</span>
                  <span className="font-bold text-emerald-700">
                    {efficiencyPillar.linesOnTargetCount} / {efficiencyPillar.linesCount} lines
                  </span>
                </div>
              </div>
            </div>

            {/* Pillar 2: Checklist Execution */}
            <div className="p-4 rounded-xl bg-white border border-[#d9d2c2] shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="font-display text-xs font-bold uppercase text-[#17343a]">
                    Pillar 2: Checklists
                  </span>
                </div>
                <span className="text-[10px] font-mono-numbers font-bold text-[#527078] bg-[#f1eee6] px-1.5 py-0.5 rounded">
                  Weight: {pillars.checklist.weightPct}%
                </span>
              </div>

              <div>
                <div className="flex items-baseline justify-between">
                  <span className="font-mono-numbers text-2xl font-black text-[#17343a]">
                    {pillars.checklist.scorePct}%
                  </span>
                  <span className="text-xs font-bold text-emerald-700">
                    +{pillars.checklist.weightedScore.toFixed(1)} pts
                  </span>
                </div>
                <p className="text-[11px] text-[#527078] mt-1">{pillars.checklist.headline}</p>
              </div>

              <div className="pt-2 border-t border-[#e7e1d5] space-y-1 text-xs font-mono-numbers">
                <div className="flex justify-between text-[#527078]">
                  <span>Completed Audits:</span>
                  <span className="font-bold text-emerald-700">
                    {checklistPillar.completedTasks} / {checklistPillar.totalTasks}
                  </span>
                </div>
                <div className="flex justify-between text-[#527078]">
                  <span>Pending Followup:</span>
                  <span className="font-bold text-amber-700">{checklistPillar.pendingTasks}</span>
                </div>
                <div className="flex justify-between text-[#527078]">
                  <span>Not Done Tasks:</span>
                  <span className="font-bold text-rose-700">{checklistPillar.notDoneTasks}</span>
                </div>
              </div>
            </div>

            {/* Pillar 3: Bottleneck Mitigation */}
            <div className="p-4 rounded-xl bg-white border border-[#d9d2c2] shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <span className="font-display text-xs font-bold uppercase text-[#17343a]">
                    Pillar 3: Bottlenecks
                  </span>
                </div>
                <span className="text-[10px] font-mono-numbers font-bold text-[#527078] bg-[#f1eee6] px-1.5 py-0.5 rounded">
                  Weight: {pillars.bottleneck.weightPct}%
                </span>
              </div>

              <div>
                <div className="flex items-baseline justify-between">
                  <span className="font-mono-numbers text-2xl font-black text-[#17343a]">
                    {pillars.bottleneck.scorePct}%
                  </span>
                  <span className="text-xs font-bold text-emerald-700">
                    +{pillars.bottleneck.weightedScore.toFixed(1)} pts
                  </span>
                </div>
                <p className="text-[11px] text-[#527078] mt-1">{pillars.bottleneck.headline}</p>
              </div>

              <div className="pt-2 border-t border-[#e7e1d5] space-y-1 text-xs font-mono-numbers">
                <div className="flex justify-between text-[#527078]">
                  <span>Resolved Stations:</span>
                  <span className="font-bold text-emerald-700">
                    {bottleneckPillar.resolvedCount} / {bottleneckPillar.totalBottlenecks}
                  </span>
                </div>
                <div className="flex justify-between text-[#527078]">
                  <span>Critical Bottlenecks:</span>
                  <span className="font-bold text-rose-700">{bottleneckPillar.criticalCount}</span>
                </div>
                <div className="flex justify-between text-[#527078]">
                  <span>Avg Cycle Time vs Pitch:</span>
                  <span className="font-bold text-[#17343a]">
                    {bottleneckPillar.averageCycleTime}s / {bottleneckPillar.averageTargetCT}s
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actionable IE Recommendations */}
          <div className="p-4 rounded-xl bg-white border border-[#d9d2c2] shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-[#17343a]">
              <Lightbulb className="w-4 h-4 text-[#176f78]" />
              <span>Prioritized Industrial Engineering Directives</span>
            </div>

            <div className="space-y-2">
              {recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-[#fbfaf6] border border-[#e7e1d5] flex items-start gap-2.5 text-xs text-[#17343a]"
                >
                  <span className="font-mono-numbers font-bold text-[#176f78] bg-[#dceceb] px-1.5 py-0.2 rounded text-[10px]">
                    0{idx + 1}
                  </span>
                  <span className="leading-relaxed">{rec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Shortcuts Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <span className="text-xs text-[#527078]">Navigate directly to module:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onNavigate('lines');
                  onClose();
                }}
                className="px-3 py-1.5 rounded-xl border border-[#d9d2c2] bg-white text-xs font-bold text-[#17343a] hover:bg-[#f1eee6] transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>Lines &amp; Curves</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  onNavigate('daily-checklist');
                  onClose();
                }}
                className="px-3 py-1.5 rounded-xl border border-[#d9d2c2] bg-white text-xs font-bold text-[#17343a] hover:bg-[#f1eee6] transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>Field Checklist</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  onNavigate('ie-simulator');
                  onClose();
                }}
                className="px-3 py-1.5 rounded-xl bg-[#176f78] text-white text-xs font-bold hover:bg-[#12555c] transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
              >
                <span>IE Simulator</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-[#e7e1d5] bg-white flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#17343a] text-white text-xs font-bold hover:bg-[#0f2428] transition-colors cursor-pointer"
          >
            Close Scorecard
          </button>
        </div>
      </div>
    </div>
  );
};

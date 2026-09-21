/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Calendar, TrendingUp, Info, CheckCircle2, Sliders, ArrowRight } from 'lucide-react';
import { SMVWeight, StyleNature } from '../types';
import { STYLE_PROGRESSION_MATRIX, getProgressionTargetEff } from '../data/learningCurveMatrix';

interface StyleProgressionModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSMVWeight?: SMVWeight;
  activeStyleNature?: StyleNature;
}

export const StyleProgressionModal: React.FC<StyleProgressionModalProps> = ({
  isOpen,
  onClose,
  activeSMVWeight = 'light',
  activeStyleNature = 'new'
}) => {
  const [selectedNature, setSelectedNature] = useState<StyleNature>(activeStyleNature);
  const [selectedWeight, setSelectedWeight] = useState<SMVWeight>(activeSMVWeight);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  if (!isOpen) return null;

  const currentCurve = STYLE_PROGRESSION_MATRIX[selectedNature][selectedWeight];
  const day1Eff = currentCurve[0];
  const day6Eff = currentCurve[5];
  const day20Eff = currentCurve[19];
  const day40Eff = currentCurve[39];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl bg-[#fbfaf6] border border-[#d9d2c2] shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e7e1d5] bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#176f78] text-white flex items-center justify-center shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg sm:text-xl font-bold uppercase text-[#17343a] tracking-tight">
                  Standard 40-Day Style Progression Matrix
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#dceceb] text-[#176f78] border border-[#b2d6d8]">
                  IE Standard Matrix
                </span>
              </div>
              <p className="text-xs text-[#527078]">
                Garment manufacturing learning curve ramp-up targets across 40 production days
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#527078] hover:text-[#17343a] hover:bg-[#f1eee6] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Controls Bar */}
        <div className="px-6 py-3.5 bg-[#f1eee6]/80 border-b border-[#e7e1d5] flex flex-wrap items-center justify-between gap-4">
          {/* Style Nature Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-[#527078]">Style Nature:</span>
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#d9d2c2]">
              <button
                type="button"
                onClick={() => setSelectedNature('new')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedNature === 'new'
                    ? 'bg-[#176f78] text-white shadow-xs'
                    : 'text-[#527078] hover:text-[#17343a]'
                }`}
              >
                New Style (Initial)
              </button>
              <button
                type="button"
                onClick={() => setSelectedNature('repeat')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedNature === 'repeat'
                    ? 'bg-[#8c531b] text-white shadow-xs'
                    : 'text-[#527078] hover:text-[#17343a]'
                }`}
              >
                Repeat Style (&le; 3 Mos)
              </button>
            </div>
          </div>

          {/* SMV Weight Classification */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-[#527078]">SMV Weight:</span>
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#d9d2c2]">
              <button
                type="button"
                onClick={() => setSelectedWeight('light')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedWeight === 'light'
                    ? 'bg-[#17343a] text-white shadow-xs'
                    : 'text-[#527078] hover:text-[#17343a]'
                }`}
              >
                Light (0–30 min)
              </button>
              <button
                type="button"
                onClick={() => setSelectedWeight('medium')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedWeight === 'medium'
                    ? 'bg-[#17343a] text-white shadow-xs'
                    : 'text-[#527078] hover:text-[#17343a]'
                }`}
              >
                Medium (31–60 min)
              </button>
              <button
                type="button"
                onClick={() => setSelectedWeight('heavy')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedWeight === 'heavy'
                    ? 'bg-[#17343a] text-white shadow-xs'
                    : 'text-[#527078] hover:text-[#17343a]'
                }`}
              >
                Heavy (&gt;60 min)
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Key Milestone Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-white border border-[#d9d2c2] shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-[#527078]">Day 1 Launch</span>
              <div className="font-mono-numbers text-2xl font-black text-[#17343a] mt-0.5">
                {day1Eff}%
              </div>
              <span className="text-[10px] text-[#527078] block">Setup &amp; balance initiation</span>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-[#d9d2c2] border-l-4 border-l-[#176f78] shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-[#176f78]">Day 6 Stabilization</span>
              <div className="font-mono-numbers text-2xl font-black text-[#176f78] mt-0.5">
                {day6Eff}%
              </div>
              <span className="text-[10px] text-[#527078] block">Standard 6-day ramp period</span>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-[#d9d2c2] shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-[#527078]">Day 20 Maturation</span>
              <div className="font-mono-numbers text-2xl font-black text-[#17343a] mt-0.5">
                {day20Eff}%
              </div>
              <span className="text-[10px] text-[#527078] block">Peak batch proficiency</span>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-[#d9d2c2] border-l-4 border-l-emerald-600 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-emerald-700">Day 40 Ceiling</span>
              <div className="font-mono-numbers text-2xl font-black text-emerald-700 mt-0.5">
                {day40Eff}%
              </div>
              <span className="text-[10px] text-[#527078] block">Max benchmark efficiency</span>
            </div>
          </div>

          {/* 40-Day Visual Chart Bars */}
          <div className="p-4 rounded-xl bg-white border border-[#d9d2c2] shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="font-bold text-[#17343a] flex items-center gap-2">
                <span>Efficiency Curve Trend</span>
                <span className="font-normal text-[#527078]">
                  ({selectedNature === 'new' ? 'New Style' : 'Repeat Style'} • {selectedWeight.toUpperCase()} SMV)
                </span>
              </div>
              {hoveredDay && (
                <div className="font-mono-numbers font-bold text-xs text-[#176f78]">
                  Day {hoveredDay}: {currentCurve[hoveredDay - 1]}% Target
                </div>
              )}
            </div>

            <div className="h-40 w-full flex items-end justify-between gap-1 pt-4 pb-1">
              {currentCurve.map((eff, index) => {
                const dayNum = index + 1;
                const heightPct = Math.min(100, Math.max(12, (eff / 100) * 100));
                const isDay6 = dayNum === 6;
                const isHovered = hoveredDay === dayNum;

                return (
                  <div
                    key={dayNum}
                    onMouseEnter={() => setHoveredDay(dayNum)}
                    onMouseLeave={() => setHoveredDay(null)}
                    className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                  >
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t-xs transition-all ${
                        isHovered
                          ? 'bg-[#17343a]'
                          : isDay6
                          ? 'bg-amber-500'
                          : dayNum <= 6
                          ? 'bg-[#176f78]'
                          : 'bg-[#95b8bc]'
                      }`}
                    />
                    {dayNum % 5 === 0 && (
                      <span className="text-[8px] font-mono-numbers text-[#527078] mt-1">
                        {dayNum}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-[10px] text-[#527078] pt-1 border-t border-[#e7e1d5]">
              <span>Day 1</span>
              <span className="font-bold text-amber-700">Day 6 (Standard Ramp Gate)</span>
              <span>Day 20</span>
              <span>Day 40 (Terminal Benchmark)</span>
            </div>
          </div>

          {/* 40-Day Matrix Table */}
          <div className="overflow-x-auto rounded-xl border border-[#d9d2c2] bg-white shadow-xs">
            <table className="w-full text-center text-xs border-collapse">
              <thead className="bg-[#f1eee6] border-b border-[#d9d2c2] text-[11px] font-bold text-[#17343a]">
                <tr>
                  <th className="p-2 border-r border-[#e7e1d5] w-14">Day</th>
                  <th className="p-2 border-r border-[#e7e1d5] bg-[#eef7f7]">Light (0–30m)</th>
                  <th className="p-2 border-r border-[#e7e1d5]">Medium (31–60m)</th>
                  <th className="p-2 border-r border-[#e7e1d5]">Heavy (&gt;60m)</th>
                  <th className="p-2">Standard IE Gate Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e7e1d5] font-mono-numbers text-[11px]">
                {Array.from({ length: 40 }).map((_, index) => {
                  const dayNum = index + 1;
                  const lightEff = STYLE_PROGRESSION_MATRIX[selectedNature].light[index];
                  const mediumEff = STYLE_PROGRESSION_MATRIX[selectedNature].medium[index];
                  const heavyEff = STYLE_PROGRESSION_MATRIX[selectedNature].heavy[index];
                  const isDay6 = dayNum === 6;

                  return (
                    <tr
                      key={dayNum}
                      className={`hover:bg-[#fbfaf6] ${isDay6 ? 'bg-amber-50/70 font-bold' : ''}`}
                    >
                      <td className="p-2 border-r border-[#e7e1d5] font-bold text-[#17343a]">
                        D{dayNum}
                      </td>
                      <td className={`p-2 border-r border-[#e7e1d5] ${selectedWeight === 'light' ? 'bg-[#eef7f7] font-bold text-[#176f78]' : 'text-[#17343a]'}`}>
                        {lightEff}%
                      </td>
                      <td className={`p-2 border-r border-[#e7e1d5] ${selectedWeight === 'medium' ? 'bg-[#eef7f7] font-bold text-[#176f78]' : 'text-[#17343a]'}`}>
                        {mediumEff}%
                      </td>
                      <td className={`p-2 border-r border-[#e7e1d5] ${selectedWeight === 'heavy' ? 'bg-[#eef7f7] font-bold text-[#176f78]' : 'text-[#17343a]'}`}>
                        {heavyEff}%
                      </td>
                      <td className="p-2 font-sans text-left text-[10px] text-[#527078]">
                        {dayNum === 1 && 'First day line input; balancing fine-tuning'}
                        {dayNum === 2 && 'Hour-by-hour pacing established'}
                        {dayNum === 3 && 'Critical bottleneck station intervention'}
                        {dayNum === 6 && 'Standard 6-Day Ramp Gate Signoff'}
                        {dayNum === 10 && 'Batch efficiency baseline locked'}
                        {dayNum === 20 && 'Operator muscle memory matured'}
                        {dayNum === 40 && 'Terminal efficiency asymptote reached'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* IE Standard Rules Card */}
          <div className="p-4 rounded-xl bg-[#fff8e8] border border-[#f5e0b0] text-xs text-[#8c531b] flex items-start gap-3">
            <Info className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold">Standard Work Rules for Learning Curve Implementation:</span>
              <p className="leading-relaxed">
                1. <strong>Repeat Style Rule:</strong> Any style reintroduced on the same sewing line within 3 months begins on the <strong>Repeat Style Curve</strong> with elevated baseline efficiency.
                <br />
                2. <strong>6-Day Ramp Gate:</strong> In accordance with Industrial Engineering SOPs, all production lines must achieve their Day 6 target before transitioning to normal operating status.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#e7e1d5] bg-white flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#176f78] text-white text-xs font-bold hover:bg-[#12555c] transition-colors cursor-pointer shadow-xs"
          >
            Close Chart
          </button>
        </div>
      </div>
    </div>
  );
};

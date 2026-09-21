/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Calculator,
  Sliders,
  CheckCircle2,
  Clock,
  Wrench,
  Layers,
  Sparkles,
  TrendingUp,
  Copy,
  Check,
  Building2,
  RefreshCw,
  Plus,
  HelpCircle,
  FileText
} from 'lucide-react';
import { LineEntry, LeanActionItem, UserProfile } from '../types';

interface CapacityCalculatorWorkspaceProps {
  onBack: () => void;
  lines?: LineEntry[];
  selectedLineNo?: string;
  onSaveLine?: (line: LineEntry) => void;
  actions: LeanActionItem[];
  onUpdateActions: (actions: LeanActionItem[]) => void;
  profile?: UserProfile;
}

export const CapacityCalculatorWorkspace: React.FC<CapacityCalculatorWorkspaceProps> = ({
  onBack,
  lines = [],
  selectedLineNo = '18',
  onSaveLine,
  actions,
  onUpdateActions,
  profile
}) => {
  // Current active line selection
  const [activeLineNo, setActiveLineNo] = useState<string>(selectedLineNo);

  const selectedLine = useMemo(() => {
    return lines.find(l => l.lineNo === activeLineNo) || lines[0];
  }, [lines, activeLineNo]);

  // Mode for Machine Hours: 'calculate' (machines * hours) or 'direct' (manual input)
  const [hoursInputMode, setHoursInputMode] = useState<'calculate' | 'direct'>('calculate');

  // Core Inputs
  const [activeMachines, setActiveMachines] = useState<number>(() => {
    return selectedLine?.machineCount || selectedLine?.plannedMP || 40;
  });
  const [workingHours, setWorkingHours] = useState<number>(() => {
    return selectedLine?.workingHours || 8.0;
  });
  const [directMachineHours, setDirectMachineHours] = useState<number>(() => {
    const m = selectedLine?.machineCount || selectedLine?.plannedMP || 40;
    const h = selectedLine?.workingHours || 8.0;
    return m * h;
  });
  const [plannedSMV, setPlannedSMV] = useState<number>(() => {
    return selectedLine?.smv || 18.5;
  });
  const [targetEfficiency, setTargetEfficiency] = useState<number>(() => {
    return selectedLine?.targetEff || 85.0;
  });
  const [orderQty, setOrderQty] = useState<number>(() => {
    return selectedLine?.orderQty || 10000;
  });

  // Feedback states
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedReport, setCopiedReport] = useState(false);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync inputs when activeLine changes
  useEffect(() => {
    if (selectedLine) {
      const m = selectedLine.machineCount || selectedLine.plannedMP || 40;
      const h = selectedLine.workingHours || 8.0;
      setActiveMachines(m);
      setWorkingHours(h);
      setDirectMachineHours(m * h);
      setPlannedSMV(selectedLine.smv || 18.5);
      setTargetEfficiency(selectedLine.targetEff || 85.0);
      setOrderQty(selectedLine.orderQty || 10000);
    }
  }, [activeLineNo, selectedLine]);

  // Derived Total Machine Hours
  const totalMachineHours = useMemo(() => {
    if (hoursInputMode === 'calculate') {
      return activeMachines * workingHours;
    }
    return directMachineHours;
  }, [hoursInputMode, activeMachines, workingHours, directMachineHours]);

  // Core Industrial Engineering Capacity Computations:
  // Formula:
  // Theoretical Daily Capacity = (Total Machine Hours * 60) / Planned SMV
  // Target Daily Output = Theoretical Daily Capacity * (Target Efficiency / 100)
  const theoreticalDailyCapacity = useMemo(() => {
    if (plannedSMV <= 0) return 0;
    return Math.round((totalMachineHours * 60) / plannedSMV);
  }, [totalMachineHours, plannedSMV]);

  const targetDailyOutput = useMemo(() => {
    return Math.round(theoreticalDailyCapacity * (targetEfficiency / 100));
  }, [theoreticalDailyCapacity, targetEfficiency]);

  const theoreticalHourlyRate = useMemo(() => {
    if (workingHours <= 0) return 0;
    return Math.round(theoreticalDailyCapacity / workingHours);
  }, [theoreticalDailyCapacity, workingHours]);

  const targetHourlyRate = useMemo(() => {
    if (workingHours <= 0) return 0;
    return Math.round(targetDailyOutput / workingHours);
  }, [targetDailyOutput, workingHours]);

  // Pitch Time (seconds/piece): (SMV * 60) / Machines
  const pitchTimeSeconds = useMemo(() => {
    if (activeMachines <= 0) return 0;
    return (plannedSMV * 60) / activeMachines;
  }, [plannedSMV, activeMachines]);

  const targetPitchTimeSeconds = useMemo(() => {
    if (targetEfficiency <= 0) return 0;
    return pitchTimeSeconds / (targetEfficiency / 100);
  }, [pitchTimeSeconds, targetEfficiency]);

  // Order Delivery Schedule
  const totalMachineHoursRequiredForOrder = useMemo(() => {
    if (targetEfficiency <= 0) return 0;
    return Math.round((orderQty * plannedSMV) / (60 * (targetEfficiency / 100)));
  }, [orderQty, plannedSMV, targetEfficiency]);

  const estimatedDaysToComplete = useMemo(() => {
    if (targetDailyOutput <= 0) return 0;
    return +(orderQty / targetDailyOutput).toFixed(1);
  }, [orderQty, targetDailyOutput]);

  // Multi-Efficiency Sensitivity Matrix
  const sensitivityData = useMemo(() => {
    const effSteps = [50, 60, 70, 80, 85, 90, 95, 100];
    return effSteps.map(eff => {
      const daily = Math.round(theoreticalDailyCapacity * (eff / 100));
      const hourly = workingHours > 0 ? Math.round(daily / workingHours) : 0;
      const pitch = eff > 0 ? +(pitchTimeSeconds / (eff / 100)).toFixed(1) : 0;
      return {
        efficiency: eff,
        daily,
        hourly,
        pitch,
        isCurrent: Math.round(targetEfficiency) === eff,
        tier:
          eff === 100
            ? 'Theoretical (100%)'
            : eff >= 90
            ? 'High Performing'
            : eff >= 80
            ? 'Factory Standard'
            : 'Learning Ramp-Up'
      };
    });
  }, [theoreticalDailyCapacity, workingHours, pitchTimeSeconds, targetEfficiency]);

  // Action: Apply target capacity to selected Line
  const handleApplyToLine = () => {
    if (!selectedLine || !onSaveLine) {
      triggerToast('Line target updated in temporary workspace.');
      return;
    }

    const updatedLine: LineEntry = {
      ...selectedLine,
      smv: plannedSMV,
      targetProd: targetDailyOutput,
      targetEff: targetEfficiency,
      workingHours: workingHours,
      machineCount: activeMachines,
      remarks: `Target updated via Capacity Calculator: ${targetDailyOutput.toLocaleString()} pcs/day (Eff: ${targetEfficiency}%, SMV: ${plannedSMV} min, Total Machine Hrs: ${totalMachineHours.toFixed(1)}h)`
    };

    onSaveLine(updatedLine);
    triggerToast(`Line ${selectedLine.lineNo} daily target successfully set to ${targetDailyOutput.toLocaleString()} pcs!`);
  };

  // Action: Save as Kaizen / Action Item
  const handleSaveAsKaizen = () => {
    const newAction: LeanActionItem = {
      id: `cap-act-${Date.now()}`,
      methodId: 'capacity-calculator',
      methodName: 'Line Capacity Planning',
      lineNo: selectedLine?.lineNo || '18',
      title: `Capacity Study: Line ${selectedLine?.lineNo || '18'} - ${plannedSMV} min SMV`,
      issue: `Theoretical capacity evaluated at ${theoreticalDailyCapacity.toLocaleString()} pcs (Total Machine Hours: ${totalMachineHours.toFixed(1)}h). Planned output set at ${targetDailyOutput.toLocaleString()} pcs at ${targetEfficiency}% efficiency.`,
      solution: `Align hourly target to ${targetHourlyRate} pcs/hr and synchronize workstation pitch time to ${targetPitchTimeSeconds.toFixed(1)}s.`,
      expectedBenefit: `Guaranteed delivery of ${orderQty.toLocaleString()} units within ${estimatedDaysToComplete} working days without overtime spikes.`,
      status: 'in_progress',
      owner: profile?.name || 'IE Industrial Engineer',
      createdAt: new Date().toISOString()
    };

    onUpdateActions([newAction, ...actions]);
    triggerToast(`Logged Capacity Planning Action for Line ${selectedLine?.lineNo || '18'}!`);
  };

  // Action: Copy Report to Clipboard
  const handleCopyReport = () => {
    const reportText = `
=== INDUSTRIAL ENGINEERING CAPACITY REPORT ===
Factory Line: Line ${selectedLine?.lineNo || '18'} (${selectedLine?.floor || 'Floor 01'} - ${selectedLine?.apartment || 'Apartment A'})
Garment Style: ${selectedLine?.style || 'Basic Apparel'} (Buyer: ${selectedLine?.buyer || 'Global Buyer'})
Date: ${new Date().toLocaleDateString()}
Evaluator: ${profile?.name || 'IE Industrial Engineering'}

--- INPUT PARAMETERS ---
Planned SMV: ${plannedSMV} min/piece
Active Sewing Machines: ${activeMachines} machines
Shift Working Hours: ${workingHours} hrs/shift
Total Machine Hours: ${totalMachineHours.toFixed(1)} machine-hours
Target Line Efficiency: ${targetEfficiency}%
Order Size: ${orderQty.toLocaleString()} pcs

--- CALCULATED CAPACITY METRICS ---
Theoretical Daily Capacity (100% Eff): ${theoreticalDailyCapacity.toLocaleString()} pcs/day
Target Daily Production Output: ${targetDailyOutput.toLocaleString()} pcs/day
Theoretical Hourly Run Rate: ${theoreticalHourlyRate} pcs/hr
Target Hourly Run Rate: ${targetHourlyRate} pcs/hr
Theoretical Pitch Time: ${pitchTimeSeconds.toFixed(1)} sec/pc
Target Pitch Time: ${targetPitchTimeSeconds.toFixed(1)} sec/pc

--- ORDER COMPLETION PROJECTION ---
Total Machine Hours Needed: ${totalMachineHoursRequiredForOrder.toLocaleString()} machine-hours
Estimated Completion Time: ${estimatedDaysToComplete} working days
===============================================
`.trim();

    navigator.clipboard.writeText(reportText);
    setCopiedReport(true);
    triggerToast('IE Capacity Report copied to clipboard!');
    setTimeout(() => setCopiedReport(false), 2500);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e7e1d5] pb-4">
        <div className="space-y-1">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#527078] hover:text-[#176f78] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Lean Toolkit</span>
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Calculator className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17343a] tracking-tight">
                Capacity Calculator
              </h1>
              <p className="text-xs sm:text-sm text-[#527078] font-medium">
                Input total machine hours &amp; planned SMV to determine theoretical daily production capacity.
              </p>
            </div>
          </div>
        </div>

        {/* Line Selector */}
        <div className="flex items-center gap-2">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#738287] block">
              Active Line Selection
            </span>
            <span className="text-xs font-semibold text-[#17343a]">
              {selectedLine?.floor} • {selectedLine?.apartment || 'Apartment A'}
            </span>
          </div>

          <select
            value={activeLineNo}
            onChange={e => setActiveLineNo(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-white border border-[#d9d2c2] text-xs font-extrabold text-[#17343a] shadow-2xs focus:outline-hidden focus:border-[#176f78]"
          >
            {lines.map(l => (
              <option key={l.lineNo} value={l.lineNo}>
                Line {l.lineNo} - {l.style} ({l.buyer})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-bold flex items-center justify-between shadow-2xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* EXECUTIVE RESULTS DECK (Hero Output Cards)                 */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Theoretical Daily Capacity */}
        <div className="p-5 rounded-3xl bg-linear-to-br from-[#0c4a60] to-[#176f78] text-white shadow-sm space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-200">
              Theoretical Capacity (100%)
            </span>
            <span className="px-2 py-0.5 rounded-md bg-white/20 text-white text-[10px] font-mono-numbers font-bold">
              MAX LIMIT
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-black font-mono-numbers tracking-tight">
            {theoreticalDailyCapacity.toLocaleString()}{' '}
            <span className="text-sm font-bold text-cyan-200">pcs/day</span>
          </div>
          <div className="text-xs text-cyan-100 flex items-center justify-between border-t border-white/15 pt-2">
            <span>Hourly: <strong className="text-white font-mono-numbers">{theoreticalHourlyRate}</strong> pcs/hr</span>
            <span>Pitch: <strong className="text-white font-mono-numbers">{pitchTimeSeconds.toFixed(1)}</strong>s</span>
          </div>
        </div>

        {/* Card 2: Target Daily Production */}
        <div className="p-5 rounded-3xl bg-white border border-[#d9d2c2] shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#527078]">
              Target Output ({targetEfficiency}%)
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
              PLANNED
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-black font-mono-numbers text-[#17343a] tracking-tight">
            {targetDailyOutput.toLocaleString()}{' '}
            <span className="text-sm font-bold text-[#527078]">pcs/day</span>
          </div>
          <div className="text-xs text-[#527078] flex items-center justify-between border-t border-[#f0eee6] pt-2">
            <span>Target Hourly: <strong className="text-[#17343a] font-mono-numbers">{targetHourlyRate}</strong> pcs/hr</span>
            <span>Eff Loss: <strong className="text-amber-600 font-mono-numbers">{(100 - targetEfficiency).toFixed(0)}%</strong></span>
          </div>
        </div>

        {/* Card 3: Total Machine Hours */}
        <div className="p-5 rounded-3xl bg-white border border-[#d9d2c2] shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#527078]">
              Total Machine Hours
            </span>
            <Clock className="w-4 h-4 text-[#d96b27]" />
          </div>
          <div className="text-3xl sm:text-4xl font-black font-mono-numbers text-[#17343a] tracking-tight">
            {totalMachineHours.toFixed(1)}{' '}
            <span className="text-sm font-bold text-[#527078]">hrs</span>
          </div>
          <div className="text-xs text-[#527078] flex items-center justify-between border-t border-[#f0eee6] pt-2">
            <span>Available Mins: <strong className="text-[#17343a] font-mono-numbers">{(totalMachineHours * 60).toLocaleString()}</strong></span>
            <span>Active Beds: <strong className="text-[#17343a] font-mono-numbers">{activeMachines}</strong></span>
          </div>
        </div>

        {/* Card 4: Order Delivery Timeline */}
        <div className="p-5 rounded-3xl bg-white border border-[#d9d2c2] shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#527078]">
              Order Schedule ({orderQty.toLocaleString()} Pcs)
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl sm:text-4xl font-black font-mono-numbers text-[#17343a] tracking-tight">
            {estimatedDaysToComplete}{' '}
            <span className="text-sm font-bold text-[#527078]">days</span>
          </div>
          <div className="text-xs text-[#527078] flex items-center justify-between border-t border-[#f0eee6] pt-2">
            <span>Required M-Hrs: <strong className="text-[#17343a] font-mono-numbers">{totalMachineHoursRequiredForOrder.toLocaleString()}</strong></span>
            <span>Target Pitch: <strong className="text-[#17343a] font-mono-numbers">{targetPitchTimeSeconds.toFixed(1)}</strong>s</span>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* INTERACTIVE INPUT CONTROL PANEL                            */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Parameter Form (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-white border border-[#d9d2c2] shadow-2xs space-y-5">
          <div className="flex items-center justify-between border-b border-[#f0eee6] pb-3">
            <div className="flex items-center gap-2.5">
              <Sliders className="w-4 h-4 text-[#176f78]" />
              <h2 className="text-base sm:text-lg font-extrabold text-[#17343a]">
                Line Capacity Parameters
              </h2>
            </div>
            <span className="text-xs font-semibold text-[#527078]">
              Selected: Line {selectedLine?.lineNo || '18'} ({selectedLine?.style})
            </span>
          </div>

          {/* 1. Total Machine Hours Mode Toggle & Inputs */}
          <div className="space-y-3 p-4 rounded-2xl bg-[#f5f3ec] border border-[#e7e1d5]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-[#17343a] uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#176f78]" />
                <span>1. Total Machine Hours (Input)</span>
              </label>

              {/* Mode switch */}
              <div className="flex items-center bg-white rounded-lg p-0.5 border border-[#d9d2c2] text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setHoursInputMode('calculate')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    hoursInputMode === 'calculate'
                      ? 'bg-[#176f78] text-white shadow-2xs'
                      : 'text-[#527078] hover:text-[#17343a]'
                  }`}
                >
                  Machines × Hours
                </button>
                <button
                  type="button"
                  onClick={() => setHoursInputMode('direct')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    hoursInputMode === 'direct'
                      ? 'bg-[#176f78] text-white shadow-2xs'
                      : 'text-[#527078] hover:text-[#17343a]'
                  }`}
                >
                  Direct Hours
                </button>
              </div>
            </div>

            {hoursInputMode === 'calculate' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-[#527078]">
                    Active Sewing Machines
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={activeMachines}
                    onChange={e => {
                      const v = parseInt(e.target.value, 10) || 1;
                      setActiveMachines(v);
                      setDirectMachineHours(v * workingHours);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d9d2c2] bg-white text-sm font-bold text-[#17343a] font-mono-numbers focus:border-[#176f78] focus:outline-hidden"
                  />
                  <span className="text-[10px] text-[#738287]">
                    Line workstations operating simultaneously
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-[#527078]">
                    Shift Working Hours
                  </span>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="24"
                    value={workingHours}
                    onChange={e => {
                      const v = parseFloat(e.target.value) || 1;
                      setWorkingHours(v);
                      setDirectMachineHours(activeMachines * v);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d9d2c2] bg-white text-sm font-bold text-[#17343a] font-mono-numbers focus:border-[#176f78] focus:outline-hidden"
                  />
                  <span className="text-[10px] text-[#738287]">
                    Standard shift (e.g. 8.0 hrs, 9.0 hrs with OT)
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-[#527078]">
                  Direct Machine Hours Entry
                </span>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={directMachineHours}
                  onChange={e => setDirectMachineHours(parseFloat(e.target.value) || 1)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#d9d2c2] bg-white text-sm font-bold text-[#17343a] font-mono-numbers focus:border-[#176f78] focus:outline-hidden"
                />
                <span className="text-[10px] text-[#738287]">
                  Total cumulative machine-hours available across the entire sewing line per day
                </span>
              </div>
            )}

            <div className="text-xs font-bold text-[#17343a] flex items-center justify-between pt-1 border-t border-[#e7e1d5]">
              <span>Resulting Total Machine Hours:</span>
              <span className="font-mono-numbers text-sm text-[#0e7490] font-black">
                {totalMachineHours.toFixed(1)} hrs ({ (totalMachineHours * 60).toLocaleString() } minutes)
              </span>
            </div>
          </div>

          {/* 2. Planned SMV (Standard Minute Value) Input */}
          <div className="space-y-2 p-4 rounded-2xl bg-[#f5f3ec] border border-[#e7e1d5]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-[#17343a] uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#176f78]" />
                <span>2. Planned SMV (Standard Minute Value)</span>
              </label>
              <span className="text-xs font-bold text-[#0e7490] font-mono-numbers">
                {(plannedSMV * 60).toFixed(1)} seconds/pc
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              <div className="sm:col-span-2">
                <input
                  type="number"
                  step="0.01"
                  min="0.05"
                  value={plannedSMV}
                  onChange={e => setPlannedSMV(parseFloat(e.target.value) || 0.1)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#d9d2c2] bg-white text-base font-black text-[#17343a] font-mono-numbers focus:border-[#176f78] focus:outline-hidden"
                  placeholder="e.g. 18.5"
                />
              </div>

              {/* Quick SMV presets */}
              <div className="flex flex-wrap gap-1">
                {[0.85, 1.25, 14.5, 18.5, 24.0].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setPlannedSMV(val)}
                    className="px-2 py-1 rounded-lg bg-white border border-[#d9d2c2] hover:border-[#176f78] text-[10px] font-bold font-mono-numbers text-[#17343a] cursor-pointer"
                  >
                    {val}m
                  </button>
                ))}
              </div>
            </div>
            <span className="text-[10px] text-[#738287] block">
              Standard garment assembly time in minutes per single garment unit.
            </span>
          </div>

          {/* 3. Target Line Efficiency Slider & Presets */}
          <div className="space-y-3 p-4 rounded-2xl bg-[#f5f3ec] border border-[#e7e1d5]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-[#17343a] uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[#176f78]" />
                <span>3. Target Line Efficiency %</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="10"
                  max="120"
                  value={targetEfficiency}
                  onChange={e => setTargetEfficiency(parseFloat(e.target.value) || 50)}
                  className="w-16 px-2 py-1 rounded-lg border border-[#d9d2c2] bg-white text-xs font-extrabold font-mono-numbers text-[#17343a] text-center"
                />
                <span className="text-xs font-bold text-[#17343a]">%</span>
              </div>
            </div>

            <input
              type="range"
              min="40"
              max="100"
              step="1"
              value={targetEfficiency}
              onChange={e => setTargetEfficiency(parseFloat(e.target.value))}
              className="w-full accent-[#176f78] cursor-pointer"
            />

            {/* Efficiency Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { label: 'Day 1 (60%)', val: 60 },
                { label: 'Ramp-up (75%)', val: 75 },
                { label: 'Target (85%)', val: 85 },
                { label: 'High (90%)', val: 90 },
                { label: 'Peak (95%)', val: 95 },
                { label: 'Theoretical (100%)', val: 100 }
              ].map(item => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => setTargetEfficiency(item.val)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    targetEfficiency === item.val
                      ? 'bg-[#176f78] text-white'
                      : 'bg-white text-[#527078] border border-[#d9d2c2] hover:border-[#176f78]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Order Size & Simulation Parameter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#374151]">
                Simulate Order Size (Pcs)
              </label>
              <input
                type="number"
                step="500"
                value={orderQty}
                onChange={e => setOrderQty(parseInt(e.target.value, 10) || 1000)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#d9d2c2] bg-white text-sm font-bold text-[#17343a] font-mono-numbers"
              />
            </div>

            <div className="p-3 rounded-xl bg-white border border-[#e7e1d5] text-xs space-y-0.5">
              <span className="text-[10px] font-bold text-[#738287] uppercase block">
                Estimated Delivery Window
              </span>
              <div className="font-extrabold text-[#17343a]">
                {estimatedDaysToComplete} Days on Line {selectedLine?.lineNo || '18'}
              </div>
              <span className="text-[11px] text-[#527078]">
                Requires {totalMachineHoursRequiredForOrder.toLocaleString()} machine-hours
              </span>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="pt-2 border-t border-[#f0eee6] flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleApplyToLine}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0c4a60] hover:bg-[#083647] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Apply to Line {selectedLine?.lineNo || '18'} Target</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAsKaizen}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-[#d9d2c2] hover:border-[#176f78] text-[#17343a] text-xs font-bold shadow-2xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#176f78]" />
                <span>Log to Kaizen Board</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleCopyReport}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-[#d9d2c2] hover:bg-[#f5f3ec] text-[#527078] text-xs font-bold transition-all cursor-pointer"
            >
              {copiedReport ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copiedReport ? 'Copied!' : 'Copy IE Report'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Sensitivity Matrix & Formula Breakdown (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Engineering Formula Card */}
          <div className="p-5 rounded-3xl bg-white border border-[#d9d2c2] shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#176f78]" />
              <h3 className="text-sm font-extrabold text-[#17343a]">
                Apparel Engineering Formula Standard
              </h3>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#f5f3ec] border border-[#e7e1d5] space-y-2 text-xs font-mono">
              <div className="text-[#17343a] font-bold">
                Theoretical Capacity (Pcs) =
              </div>
              <div className="text-[#0e7490] font-black pl-3">
                (Total Machine Hours × 60) ÷ Planned SMV
              </div>
              <div className="text-[11px] text-[#738287] border-t border-[#e7e1d5] pt-1.5">
                = ({totalMachineHours.toFixed(1)}h × 60) ÷ {plannedSMV}m ={' '}
                <strong className="text-[#17343a] font-bold">
                  {theoreticalDailyCapacity.toLocaleString()} pcs
                </strong>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#f5f3ec] border border-[#e7e1d5] space-y-2 text-xs font-mono">
              <div className="text-[#17343a] font-bold">
                Target Daily Output =
              </div>
              <div className="text-emerald-700 font-black pl-3">
                Theoretical Capacity × (Target Efficiency % ÷ 100)
              </div>
              <div className="text-[11px] text-[#738287] border-t border-[#e7e1d5] pt-1.5">
                = {theoreticalDailyCapacity.toLocaleString()} × ({targetEfficiency}%) ={' '}
                <strong className="text-[#17343a] font-bold">
                  {targetDailyOutput.toLocaleString()} pcs
                </strong>
              </div>
            </div>
          </div>

          {/* Sensitivity Table */}
          <div className="p-5 rounded-3xl bg-white border border-[#d9d2c2] shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-[#17343a]">
                Multi-Efficiency Sensitivity Matrix
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#738287]">
                SMV: {plannedSMV}m
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-[#e7e1d5] text-[10px] uppercase font-bold text-[#738287]">
                    <th className="py-2 px-1">Eff %</th>
                    <th className="py-2 px-1 text-right">Daily Pcs</th>
                    <th className="py-2 px-1 text-right">Hourly Rate</th>
                    <th className="py-2 px-1 text-right">Pitch (s)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0eee6]">
                  {sensitivityData.map(row => (
                    <tr
                      key={row.efficiency}
                      onClick={() => setTargetEfficiency(row.efficiency)}
                      className={`cursor-pointer transition-colors ${
                        row.isCurrent
                          ? 'bg-[#176f78]/10 font-bold text-[#17343a]'
                          : 'hover:bg-[#f5f3ec] text-[#527078]'
                      }`}
                    >
                      <td className="py-2 px-1 flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            row.efficiency === 100
                              ? 'bg-cyan-500'
                              : row.efficiency >= 85
                              ? 'bg-emerald-500'
                              : row.efficiency >= 70
                              ? 'bg-amber-500'
                              : 'bg-rose-400'
                          }`}
                        />
                        <span>{row.efficiency}%</span>
                        {row.isCurrent && (
                          <span className="text-[9px] px-1 rounded bg-[#176f78] text-white">
                            ACTIVE
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-1 text-right font-mono-numbers font-bold text-[#17343a]">
                        {row.daily.toLocaleString()}
                      </td>
                      <td className="py-2 px-1 text-right font-mono-numbers">
                        {row.hourly} pcs/h
                      </td>
                      <td className="py-2 px-1 text-right font-mono-numbers">
                        {row.pitch}s
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-[11px] text-[#738287] pt-1 text-center">
              Click any efficiency row to immediately simulate and preview targets.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

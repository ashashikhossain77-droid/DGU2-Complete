/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Sliders,
  Gauge,
  Workflow,
  Clock,
  Users,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  TrendingUp,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Minus,
  ArrowRight,
  Printer,
  Sparkles,
  Check,
  ShieldCheck,
  Wrench,
  Layers,
  ChevronRight,
  Info,
  Percent,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Target,
  Calendar
} from 'lucide-react';
import {
  LineEntry,
  UserProfile,
  OperationStep,
  MachineRequirement,
  HandoffCheckItem,
  LineHandoffSignoff,
  StyleNature,
  SMVWeight
} from '../types';
import {
  SIMULATOR_PRESETS,
  DEFAULT_HANDOFF_CHECKLIST,
  DEFAULT_HANDOFF_SIGNOFFS,
  calculateSimulatorMetrics,
  calculatePitchAnalysis
} from '../data/simulatorPresets';
import {
  getSMVWeight,
  getProgressionTargetEff,
  generateLineLearningCurve,
  calculateBalancingLossAnalysis
} from '../data/learningCurveMatrix';
import { StyleProgressionModal } from './StyleProgressionModal';

interface IESimulatorProps {
  lines: LineEntry[];
  selectedLineNo?: string;
  onSelectLineNo?: (lineNo: string) => void;
  onApplyToLine: (lineNo: string, updates: Partial<LineEntry>) => void;
  onAddNewLineWithSimulation: (lineData: Partial<LineEntry>) => void;
  profile: UserProfile;
  onNavigate: (tab: string) => void;
}

type SimulatorSubTab =
  | 'target-efficiency'
  | 'standards-balancing'
  | 'line-handoff'
  | 'production-flow'
  | 'manpower-balancing'
  | 'learning-curve';

export const IESimulator: React.FC<IESimulatorProps> = ({
  lines,
  onApplyToLine,
  onAddNewLineWithSimulation,
  profile,
  onNavigate
}) => {
  // Active Sub-Tab
  const [activeSubTab, setActiveSubTab] = useState<SimulatorSubTab>('target-efficiency');

  // Selected Preset
  const [selectedPresetId, setSelectedPresetId] = useState<string>(SIMULATOR_PRESETS[0].id);
  const activePreset = useMemo(
    () => SIMULATOR_PRESETS.find(p => p.id === selectedPresetId) || SIMULATOR_PRESETS[0],
    [selectedPresetId]
  );

  // Core Simulation Parameters (customizable)
  const [styleName, setStyleName] = useState<string>(activePreset.styleName);
  const [buyer, setBuyer] = useState<string>(activePreset.buyer);
  const [smvMinutes, setSmvMinutes] = useState<number>(activePreset.totalSMV);
  const [operators, setOperators] = useState<number>(activePreset.recommendedOperators);
  const [helpers, setHelpers] = useState<number>(activePreset.recommendedHelpers);
  const [ironers, setIroners] = useState<number>(activePreset.recommendedIroners);
  const [workingHours, setWorkingHours] = useState<number>(8);
  const [overtimeHours, setOvertimeHours] = useState<number>(0);
  const [targetEffPct, setTargetEffPct] = useState<number>(85);

  // Shift deductions & minute balancing
  const [morningBriefingMins, setMorningBriefingMins] = useState<number>(10);
  const [teaBreakMins, setTeaBreakMins] = useState<number>(15);
  const [cleanUpMins, setCleanUpMins] = useState<number>(10);
  const [absenteeismRate, setAbsenteeismRate] = useState<number>(5.5); // %
  const [gradeAPct, setGradeAPct] = useState<number>(45); // %
  const [gradeBPct, setGradeBPct] = useState<number>(40); // %
  const [gradeCPct, setGradeCPct] = useState<number>(15); // %

  // Operations & Pitch diagram state
  const [operations, setOperations] = useState<OperationStep[]>(activePreset.operations);

  // Machine requirements & Handoff state
  const [machines, setMachines] = useState<MachineRequirement[]>(activePreset.machines);
  const [handoffChecks, setHandoffChecks] = useState<HandoffCheckItem[]>(DEFAULT_HANDOFF_CHECKLIST);
  const [signoffs, setSignoffs] = useState<LineHandoffSignoff[]>(DEFAULT_HANDOFF_SIGNOFFS);

  // Modals & UI states
  const [showApplyModal, setShowApplyModal] = useState<boolean>(false);
  const [selectedTargetLineNo, setSelectedTargetLineNo] = useState<string>(lines[0]?.lineNo || '18');
  const [applySuccessToast, setApplySuccessToast] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [simStyleNature, setSimStyleNature] = useState<StyleNature>('new');
  const [showSimProgressionModal, setShowSimProgressionModal] = useState<boolean>(false);

  // Expand / Collapse state for Standards & Balancing sections (Ref: Images 2, 3 & 4)
  const [expandedStandardsSections, setExpandedStandardsSections] = useState<Record<string, boolean>>({
    lossAnalysis: true,        // 1. Debonair Ltd. Unit - 02 Balancing & Estimated Loss Analysis (Ref: Image 3 Standard)
    activityTargets: true,     // 2. IE Balancing & Floor Execution Activity Targets (Ref: Image 2)
    styleClassification: true  // 3. Garment Style Classification & 6-Day Period Rule (Ref: Image 4)
  });

  const toggleStandardsSection = (key: string) => {
    setExpandedStandardsSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const isAllStandardsExpanded = Object.values(expandedStandardsSections).every(Boolean);

  const toggleAllStandardsSections = () => {
    const nextState = !isAllStandardsExpanded;
    setExpandedStandardsSections({
      lossAnalysis: nextState,
      activityTargets: nextState,
      styleClassification: nextState
    });
  };

  // State for Standards & Balancing (Images 2, 3 & 4) Simulation Parameters
  const [balancingSourceMode, setBalancingSourceMode] = useState<'preset' | 'line'>('preset');
  const [simBalancingLineNo, setSimBalancingLineNo] = useState<string>(lines[0]?.lineNo || '18');
  const [simTacctSeconds, setSimTacctSeconds] = useState<number>(Math.round(activePreset.totalSMV * 60));
  const [simMaxCTSeconds, setSimMaxCTSeconds] = useState<number>(
    Math.round((activePreset.totalSMV * 60) / activePreset.recommendedOperators * 1.25) || 45
  );
  const [simHourlyEstimate, setSimHourlyEstimate] = useState<number>(120);
  const [simCurrentPrdnHourly, setSimCurrentPrdnHourly] = useState<number>(112);
  const [simTotalOperators, setSimTotalOperators] = useState<number>(activePreset.recommendedOperators);

  // IE Activity Targets (Image 2) State
  const [simTheoreticalBalancePct, setSimTheoreticalBalancePct] = useState<number>(96.2);
  const [simBalancingErrorPct, setSimBalancingErrorPct] = useState<number>(3.8);
  const [simCapacityEstimatePct, setSimCapacityEstimatePct] = useState<number>(12.5);
  const [simRightManVerified, setSimRightManVerified] = useState<boolean>(true);
  const [simRightMachineVerified, setSimRightMachineVerified] = useState<boolean>(true);
  const [simNeedleDowntimeMinutes, setSimNeedleDowntimeMinutes] = useState<number>(18);

  // 6-Day Period Rule (Image 4) Day & History simulation state
  const [simLcCurrentDay, setSimLcCurrentDay] = useState<number>(2);
  const [simDayRecords, setSimDayRecords] = useState<Array<{
    day: number;
    achievedQty?: number;
    notes?: string;
  }>>([
    { day: 1, achievedQty: 480, notes: 'Initial pilot bundle feeding' },
    { day: 2, achievedQty: 560, notes: 'Pacing & helper flow stabilized' },
    { day: 3, achievedQty: 0, notes: '' },
    { day: 4, achievedQty: 0, notes: '' },
    { day: 5, achievedQty: 0, notes: '' },
    { day: 6, achievedQty: 0, notes: '' }
  ]);

  // Production Flow live animation state
  const [isFlowSimRunning, setIsFlowSimRunning] = useState<boolean>(false);
  const [flowWipBuffer, setFlowWipBuffer] = useState<{ [opId: string]: number }>({});
  const [simCompletedPcs, setSimCompletedPcs] = useState<number>(0);

  // When preset changes, reset the operations, machines, and style details
  const handlePresetSelect = (presetId: string) => {
    const preset = SIMULATOR_PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    setSelectedPresetId(presetId);
    setStyleName(preset.styleName);
    setBuyer(preset.buyer);
    setSmvMinutes(preset.totalSMV);
    setOperators(preset.recommendedOperators);
    setHelpers(preset.recommendedHelpers);
    setIroners(preset.recommendedIroners);
    setOperations(preset.operations);
    setMachines(preset.machines);
    setSimCompletedPcs(0);
    setFlowWipBuffer({});

    // Sync Standards & Balancing parameters
    const baseTacct = Math.round(preset.totalSMV * 60);
    const baseOps = preset.recommendedOperators;
    const baseMaxCT = Math.round((preset.totalSMV * 60) / preset.recommendedOperators * 1.25);
    const baseEstimate = Math.round((preset.recommendedOperators * 8 * 60 * 0.85) / preset.totalSMV / 8);
    setSimTacctSeconds(baseTacct);
    setSimTotalOperators(baseOps);
    setSimMaxCTSeconds(baseMaxCT);
    setSimHourlyEstimate(baseEstimate);
    setSimCurrentPrdnHourly(Math.round(baseEstimate * 0.94));
  };

  // Real-time calculations for metrics
  const metrics = useMemo(() => {
    return calculateSimulatorMetrics({
      smvMinutes,
      operators,
      helpers,
      ironers,
      workingHours,
      overtimeHours,
      targetEffPct
    });
  }, [smvMinutes, operators, helpers, ironers, workingHours, overtimeHours, targetEffPct]);

  // Pitch diagram analysis
  const pitchAnalysis = useMemo(() => {
    return calculatePitchAnalysis(operations, metrics.pitchTimeSeconds);
  }, [operations, metrics.pitchTimeSeconds]);

  // Manpower Working Minutes Calculations
  const minuteBalancing = useMemo(() => {
    const totalManpower = operators + helpers + ironers;
    const grossMinutes = (workingHours + overtimeHours) * 60;
    const nonProductiveAllowances = morningBriefingMins + teaBreakMins + cleanUpMins;
    const netWorkingMinutes = Math.max(0, grossMinutes - nonProductiveAllowances);

    // Absenteeism deduction
    const effectivePresentManpower = Math.max(
      1,
      Math.round(totalManpower * (1 - absenteeismRate / 100))
    );
    const absentManpower = totalManpower - effectivePresentManpower;

    const totalAvailableManMinutes = effectivePresentManpower * netWorkingMinutes;
    const totalGrossAvailableMinutes = totalManpower * grossMinutes;

    // Standard produced minutes at target
    const standardEarnedMinutes = Math.round(metrics.targetProductionPcs * smvMinutes);
    const balanceLossMinutes = Math.max(0, Math.round(totalAvailableManMinutes * (pitchAnalysis.balanceLossPct / 100)));

    // Skill factor calculation
    // Grade A: 100%, Grade B: 85%, Grade C: 70%
    const avgSkillIndex = ((gradeAPct * 1.0 + gradeBPct * 0.85 + gradeCPct * 0.70) / 100).toFixed(2);

    return {
      totalManpower,
      grossMinutes,
      nonProductiveAllowances,
      netWorkingMinutes,
      effectivePresentManpower,
      absentManpower,
      totalAvailableManMinutes,
      totalGrossAvailableMinutes,
      standardEarnedMinutes,
      balanceLossMinutes,
      avgSkillIndex
    };
  }, [
    operators,
    helpers,
    ironers,
    workingHours,
    overtimeHours,
    morningBriefingMins,
    teaBreakMins,
    cleanUpMins,
    absenteeismRate,
    gradeAPct,
    gradeBPct,
    gradeCPct,
    metrics.targetProductionPcs,
    smvMinutes,
    pitchAnalysis.balanceLossPct
  ]);

  // Handoff Readiness Calculation
  const handoffScore = useMemo(() => {
    const passedCount = handoffChecks.filter(c => c.status === 'pass').length;
    const approvedSignoffs = signoffs.filter(s => s.status === 'approved').length;

    const checkPct = (passedCount / handoffChecks.length) * 60; // 60% weight
    const signoffPct = (approvedSignoffs / signoffs.length) * 40; // 40% weight
    return Math.round(checkPct + signoffPct);
  }, [handoffChecks, signoffs]);

  // Production flow stepper animation
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isFlowSimRunning) {
      interval = setInterval(() => {
        setSimCompletedPcs(prev => prev + 2);
        setFlowWipBuffer(prev => {
          const next: { [id: string]: number } = { ...prev };
          operations.forEach(op => {
            const current = next[op.id] || Math.floor(Math.random() * 8 + 3);
            const delta = Math.floor(Math.random() * 3) - 1;
            next[op.id] = Math.max(1, Math.min(25, current + delta));
          });
          return next;
        });
      }, 1200);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isFlowSimRunning, operations]);

  // Auto-rebalance line helper (rebalances bottleneck operations)
  const handleAutoRebalance = () => {
    const targetPitch = metrics.pitchTimeSeconds;
    const updated = operations.map(op => {
      // If cycle time exceeds pitch time, split with additional operator or helper
      if (op.cycleTimeSec > targetPitch) {
        const newOps = op.operators + 1;
        const newCT = Math.round((op.smvSec / newOps) * 10) / 10;
        return {
          ...op,
          operators: newOps,
          cycleTimeSec: newCT,
          pitchStatus: newCT > targetPitch ? ('bottleneck' as const) : ('ok' as const)
        };
      }
      return op;
    });

    setOperations(updated);
    // Recalculate total operators
    const totalOps = updated.reduce((acc, curr) => acc + curr.operators, 0);
    setOperators(totalOps);
  };

  // Adjust operator count on a specific operation
  const handleOpOperatorChange = (opId: string, delta: number) => {
    setOperations(prev =>
      prev.map(op => {
        if (op.id === opId) {
          const newOps = Math.max(1, op.operators + delta);
          const newCT = Math.round((op.smvSec / newOps) * 10) / 10;
          return {
            ...op,
            operators: newOps,
            cycleTimeSec: newCT
          };
        }
        return op;
      })
    );
  };

  // Toggle checklist item status
  const handleToggleChecklistStatus = (itemId: string) => {
    setHandoffChecks(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          const nextStatus = item.status === 'pass' ? 'fail' : item.status === 'fail' ? 'pending' : 'pass';
          return { ...item, status: nextStatus };
        }
        return item;
      })
    );
  };

  // Sign off handoff protocol
  const handleSignoff = (role: string) => {
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setSignoffs(prev =>
      prev.map(s => {
        if (s.role === role) {
          return {
            ...s,
            status: 'approved',
            signedAt: `Today, ${nowStr}`,
            signedByName: `${profile.name} (${profile.jobTitle})`
          };
        }
        return s;
      })
    );
  };

  const criticalBottleneckOp = useMemo(
    () => operations.find(o => o.pitchStatus === 'bottleneck') || operations[0],
    [operations]
  );

  // Real-time calculated Debonair Unit-02 Balancing Analysis (Ref: Image 3 Standard & Image 2 Targets)
  const currentBalancingAnalysis = useMemo(() => {
    const selectedLine = lines.find(l => l.lineNo === simBalancingLineNo);
    const effectiveTacct = balancingSourceMode === 'line' && selectedLine?.balancingAnalysis
      ? selectedLine.balancingAnalysis.tacctSeconds
      : simTacctSeconds;
    const effectiveOperators = balancingSourceMode === 'line' && selectedLine?.balancingAnalysis
      ? selectedLine.balancingAnalysis.totalOperators
      : simTotalOperators;
    const effectiveMaxCT = balancingSourceMode === 'line' && selectedLine?.balancingAnalysis
      ? selectedLine.balancingAnalysis.maxCTSeconds
      : simMaxCTSeconds;
    const effectivePrdn = balancingSourceMode === 'line' && selectedLine?.balancingAnalysis
      ? selectedLine.balancingAnalysis.currentProductionPcsPerHour
      : simCurrentPrdnHourly;
    const effectiveEst = balancingSourceMode === 'line' && selectedLine?.balancingAnalysis
      ? selectedLine.balancingAnalysis.estimatePcsPerHour
      : simHourlyEstimate;

    const base = calculateBalancingLossAnalysis(
      effectiveTacct,
      effectiveOperators,
      effectiveMaxCT,
      effectivePrdn,
      effectiveEst
    );

    return {
      ...base,
      theoreticalBalancePct: simTheoreticalBalancePct,
      balancingErrorPct: simBalancingErrorPct,
      capacityEstimatePct: simCapacityEstimatePct,
      rightManInRightProcess: simRightManVerified,
      rightMachineForProcess: simRightMachineVerified,
      needleDowntimeMinutes: simNeedleDowntimeMinutes
    };
  }, [
    balancingSourceMode,
    simBalancingLineNo,
    lines,
    simTacctSeconds,
    simTotalOperators,
    simMaxCTSeconds,
    simCurrentPrdnHourly,
    simHourlyEstimate,
    simTheoreticalBalancePct,
    simBalancingErrorPct,
    simCapacityEstimatePct,
    simRightManVerified,
    simRightMachineVerified,
    simNeedleDowntimeMinutes
  ]);

  // Apply simulated setup to floor line
  const handleExecuteApplyToLine = () => {
    const selectedLine = lines.find(l => l.lineNo === selectedTargetLineNo);

    const updates: Partial<LineEntry> = {
      style: styleName,
      buyer: buyer,
      smv: smvMinutes,
      plannedMP: metrics.totalManpower,
      workingHours: metrics.grossWorkingHours,
      targetEff: targetEffPct,
      targetProd: metrics.targetProductionPcs,
      bottleneck: {
        station: criticalBottleneckOp ? criticalBottleneckOp.name : 'Assembly',
        cycleTime: criticalBottleneckOp ? criticalBottleneckOp.cycleTimeSec : metrics.pitchTimeSeconds,
        targetCT: metrics.pitchTimeSeconds,
        status: criticalBottleneckOp?.pitchStatus === 'bottleneck' ? 'high' : 'ok',
        action: `IE Simulated setup deployed. Pitch time ${metrics.pitchTimeSeconds}s with ${operators} ops.`
      },
      mp: {
        Operator: { present: operators, absent: 0 },
        Helper: { present: helpers, absent: 0 },
        'Iron Man': { present: ironers, absent: 0 }
      },
      remarks: `Applied from IE Simulator (${activePreset.garmentCategory}). Target: ${metrics.targetProductionPcs} pcs/day.`,
      learningCurve: generateLineLearningCurve(
        smvMinutes,
        metrics.totalManpower,
        metrics.grossWorkingHours,
        simStyleNature,
        simLcCurrentDay,
        simStyleNature === 'repeat'
      ),
      balancingAnalysis: currentBalancingAnalysis
    };

    if (selectedLine) {
      onApplyToLine(selectedLine.lineNo, updates);
      setApplySuccessToast(`Simulated setup applied to Line ${selectedLine.lineNo} successfully!`);
    } else {
      onAddNewLineWithSimulation({
        ...updates,
        lineNo: selectedTargetLineNo,
        floor: 'Padma Floor'
      });
      setApplySuccessToast(`New Line ${selectedTargetLineNo} initialized with simulated IE plan!`);
    }

    setShowApplyModal(false);
    setTimeout(() => setApplySuccessToast(null), 3500);
  };

  // Direct quick apply of balancing & standards to a line
  const handleApplyBalancingOnlyToLine = (targetLineNo: string) => {
    const targetLine = lines.find(l => l.lineNo === targetLineNo);
    if (!targetLine) return;
    onApplyToLine(targetLineNo, {
      balancingAnalysis: currentBalancingAnalysis,
      learningCurve: generateLineLearningCurve(
        targetLine.smv || smvMinutes,
        targetLine.plannedMP || metrics.totalManpower,
        targetLine.workingHours || 8,
        simStyleNature,
        simLcCurrentDay,
        simStyleNature === 'repeat'
      )
    });
    setApplySuccessToast(`Debonair Unit-02 Balancing & Standards applied to Line ${targetLineNo}!`);
    setTimeout(() => setApplySuccessToast(null), 3500);
  };

  // 6-Day Learning Curve Progression (Image 4 Standard)
  const smvWeight = useMemo(() => getSMVWeight(smvMinutes), [smvMinutes]);

  const sixDayLearningCurve = useMemo(() => {
    const totalAvailMin = metrics.totalGrossAvailableMinutes;
    const days = [1, 2, 3, 4, 5, 6].map(dayNum => {
      const targetEff = getProgressionTargetEff(dayNum, simStyleNature, smvWeight);
      const pcs = Math.round((totalAvailMin * (targetEff / 100)) / (smvMinutes > 0 ? smvMinutes : 1));
      let note = '';
      if (dayNum === 1) note = 'Initial machine setup, bundle feeding, initial layout seam pacing';
      else if (dayNum === 2) note = 'Needle handling & seam pacing improvement, helper flow stabilized';
      else if (dayNum === 3) note = 'Critical bottleneck stations balanced, pitch time aligned';
      else if (dayNum === 4) note = 'Pacing matched to standard takt, WIP buffer stabilized';
      else if (dayNum === 5) note = 'Operator speed approaching rated standard';
      else note = '6-Day Learning Curve Ramp Completed, target steady-state reached';

      return {
        day: `Day ${dayNum}`,
        dayNum,
        targetEff,
        pcs,
        note
      };
    });

    const total6DaysPcs = days.reduce((acc, d) => acc + d.pcs, 0);
    const fullTarget6DaysPcs = metrics.targetProductionPcs * 6;
    const learningLossPcs = Math.max(0, fullTarget6DaysPcs - total6DaysPcs);
    const learningLossHours = Math.round((learningLossPcs * smvMinutes) / 60);

    return {
      days,
      total6DaysPcs,
      fullTarget6DaysPcs,
      learningLossPcs,
      learningLossHours,
      avgRampEff: Math.round(days.reduce((acc, d) => acc + d.targetEff, 0) / 6)
    };
  }, [metrics.totalGrossAvailableMinutes, metrics.targetProductionPcs, smvMinutes, simStyleNature, smvWeight]);

  return (
    <div className="space-y-6 pb-12">
      {/* Toast notification */}
      {applySuccessToast && (
        <div className="fixed top-18 right-6 z-50 rounded-xl bg-emerald-800 text-white px-4 py-3 shadow-xl flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{applySuccessToast}</span>
        </div>
      )}

      {/* Header Banner & Preset Quick-Switch */}
      <div className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#0c4a60] text-white">
                IE Engineering Suite v3.2
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#dceceb] text-[#176f78] border border-[#b2d6d8]">
                Garment Line Setup & Execution
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase text-[#17343a] tracking-tight">
              Line Setup, IE Planning & Floor Simulator
            </h1>
            <p className="text-xs sm:text-sm text-[#527078] mt-1 max-w-3xl">
              Simulate automatic target output & line efficiency, verify pre-production technical handoff,
              balance operator pitch time & workstation bottlenecks, and calculate manpower working hours/minutes.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              id="ie-sim-apply-btn"
              onClick={() => setShowApplyModal(true)}
              className="px-4 py-2.5 rounded-xl bg-[#176f78] hover:bg-[#125860] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs cursor-pointer transition-all"
            >
              <Workflow className="w-4 h-4" />
              <span>Apply to Floor Line</span>
            </button>

            <button
              id="ie-sim-export-btn"
              onClick={() => setShowExportModal(true)}
              className="px-3.5 py-2.5 rounded-xl border border-[#d9d2c2] bg-white hover:bg-[#f1eee6] text-[#17343a] font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs cursor-pointer transition-all"
            >
              <Printer className="w-4 h-4 text-[#176f78]" />
              <span className="hidden sm:inline">Setup Sheet</span>
            </button>
          </div>
        </div>

        {/* Garment Style Presets Bar */}
        <div className="mt-5 pt-4 border-t border-[#e7e1d5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#527078] uppercase">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Garment Style Presets:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {SIMULATOR_PRESETS.map(preset => {
              const isSelected = preset.id === selectedPresetId;
              return (
                <button
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#17343a] text-white shadow-xs'
                      : 'bg-white border border-[#d9d2c2] text-[#527078] hover:text-[#17343a] hover:bg-[#f1eee6]'
                  }`}
                >
                  <span>{preset.styleName}</span>
                  <span className="ml-1.5 opacity-70 font-mono-numbers">({preset.totalSMV}m)</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sub-Tabs Navigation Bar */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#e7e1d5]/50 border border-[#d9d2c2] overflow-x-auto">
        <button
          id="subtab-target-eff"
          onClick={() => setActiveSubTab('target-efficiency')}
          className={`flex-1 min-w-[160px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeSubTab === 'target-efficiency'
              ? 'bg-white text-[#176f78] shadow-xs'
              : 'text-[#527078] hover:text-[#17343a]'
          }`}
        >
          <Gauge className="w-4 h-4" />
          <span>1. Target &amp; Efficiency</span>
        </button>

        <button
          id="subtab-standards-balancing"
          onClick={() => setActiveSubTab('standards-balancing')}
          className={`flex-1 min-w-[210px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeSubTab === 'standards-balancing'
              ? 'bg-white text-[#176f78] shadow-xs'
              : 'text-[#527078] hover:text-[#17343a]'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>2. Standards &amp; Balancing (Ref: 2, 3, 4)</span>
          <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono-numbers ${
            currentBalancingAnalysis.balancingStatus === 'Stable'
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-amber-100 text-amber-800'
          }`}>
            {currentBalancingAnalysis.balancingLossPct}% Loss
          </span>
        </button>

        <button
          id="subtab-line-handoff"
          onClick={() => setActiveSubTab('line-handoff')}
          className={`flex-1 min-w-[160px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeSubTab === 'line-handoff'
              ? 'bg-white text-[#176f78] shadow-xs'
              : 'text-[#527078] hover:text-[#17343a]'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>3. Line Setup &amp; Handoff</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono-numbers bg-emerald-100 text-emerald-800">
            {handoffScore}%
          </span>
        </button>

        <button
          id="subtab-production-flow"
          onClick={() => setActiveSubTab('production-flow')}
          className={`flex-1 min-w-[160px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeSubTab === 'production-flow'
              ? 'bg-white text-[#176f78] shadow-xs'
              : 'text-[#527078] hover:text-[#17343a]'
          }`}
        >
          <Workflow className="w-4 h-4" />
          <span>4. Flow &amp; Pitch Diagram</span>
          {pitchAnalysis.bottleneckCount > 0 && (
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono-numbers bg-amber-100 text-amber-800">
              {pitchAnalysis.bottleneckCount} BN
            </span>
          )}
        </button>

        <button
          id="subtab-manpower-balancing"
          onClick={() => setActiveSubTab('manpower-balancing')}
          className={`flex-1 min-w-[160px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeSubTab === 'manpower-balancing'
              ? 'bg-white text-[#176f78] shadow-xs'
              : 'text-[#527078] hover:text-[#17343a]'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>5. Working Mins Balancing</span>
        </button>

        <button
          id="subtab-learning-curve"
          onClick={() => setActiveSubTab('learning-curve')}
          className={`flex-1 min-w-[160px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeSubTab === 'learning-curve'
              ? 'bg-white text-[#176f78] shadow-xs'
              : 'text-[#527078] hover:text-[#17343a]'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>6. 6-Day Learning Curve</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: AUTOMATIC TARGET & EFFICIENCY SIMULATOR                        */}
      {/* ========================================================================= */}
      {activeSubTab === 'target-efficiency' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Real-Time KPI Result Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* KPI 1: Target Production */}
            <div className="p-4 rounded-2xl bg-white border border-[#e7e1d5] border-l-[4px] border-l-[#176f78] shadow-2xs">
              <span className="text-[11px] font-bold text-[#527078] uppercase">Target Output</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-mono-numbers text-2xl sm:text-3xl font-black text-[#17343a]">
                  {(metrics.targetProductionPcs ?? 0).toLocaleString()}
                </span>
                <span className="text-xs font-bold text-[#527078]">pcs</span>
              </div>
              <span className="text-[10px] text-emerald-700 font-bold mt-1 block">
                {metrics.targetHourlyRatePcs} pcs/hr pace
              </span>
            </div>

            {/* KPI 2: Pitch Time */}
            <div className="p-4 rounded-2xl bg-white border border-[#e7e1d5] border-l-[4px] border-l-amber-500 shadow-2xs">
              <span className="text-[11px] font-bold text-[#527078] uppercase">Pitch Time (Takt)</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-mono-numbers text-2xl sm:text-3xl font-black text-[#17343a]">
                  {metrics.pitchTimeSeconds}
                </span>
                <span className="text-xs font-bold text-[#527078]">sec</span>
              </div>
              <span className="text-[10px] text-[#527078] font-medium mt-1 block">
                {(metrics.pitchTimeSeconds / 60).toFixed(2)} min / pc
              </span>
            </div>

            {/* KPI 3: Target Efficiency */}
            <div className="p-4 rounded-2xl bg-white border border-[#e7e1d5] border-l-[4px] border-l-emerald-500 shadow-2xs">
              <span className="text-[11px] font-bold text-[#527078] uppercase">Target Efficiency</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-mono-numbers text-2xl sm:text-3xl font-black text-[#17343a]">
                  {targetEffPct}%
                </span>
              </div>
              <span className="text-[10px] text-[#527078] font-medium mt-1 block">
                Benchmark: 85.0%
              </span>
            </div>

            {/* KPI 4: Total Manpower */}
            <div className="p-4 rounded-2xl bg-white border border-[#e7e1d5] border-l-[4px] border-l-sky-600 shadow-2xs">
              <span className="text-[11px] font-bold text-[#527078] uppercase">Total Manpower</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-mono-numbers text-2xl sm:text-3xl font-black text-[#17343a]">
                  {metrics.totalManpower}
                </span>
                <span className="text-xs font-bold text-[#527078]">persons</span>
              </div>
              <span className="text-[10px] text-[#527078] font-medium mt-1 block">
                {operators} Ops • {helpers} Hlp • {ironers} Irn
              </span>
            </div>

            {/* KPI 5: Standard Allowed Hours */}
            <div className="p-4 rounded-2xl bg-white border border-[#e7e1d5] border-l-[4px] border-l-indigo-500 shadow-2xs">
              <span className="text-[11px] font-bold text-[#527078] uppercase">Standard Allowed Hrs</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-mono-numbers text-2xl sm:text-3xl font-black text-[#17343a]">
                  {metrics.producedSAH}
                </span>
                <span className="text-xs font-bold text-[#527078]">SAH</span>
              </div>
              <span className="text-[10px] text-[#527078] font-medium mt-1 block">
                Earned production value
              </span>
            </div>

            {/* KPI 6: Total Available Labor Mins */}
            <div className="p-4 rounded-2xl bg-white border border-[#e7e1d5] border-l-[4px] border-l-purple-500 shadow-2xs">
              <span className="text-[11px] font-bold text-[#527078] uppercase">Available Labor Mins</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-mono-numbers text-2xl sm:text-3xl font-black text-[#17343a]">
                  {(metrics.totalAvailableMinutes / 1000).toFixed(1)}k
                </span>
                <span className="text-xs font-bold text-[#527078]">min</span>
              </div>
              <span className="text-[10px] text-[#527078] font-medium mt-1 block">
                {metrics.grossWorkingHours} hrs × {metrics.totalManpower} MP
              </span>
            </div>
          </div>

          {/* Interactive Parameters Controls Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 5 Cols: Sliders & Form Controls */}
            <div className="lg:col-span-5 rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] p-5 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#e7e1d5]">
                <h3 className="font-display text-base font-bold uppercase text-[#17343a]">
                  Simulator Parameters
                </h3>
                <span className="text-xs font-mono-numbers text-[#176f78] font-bold bg-[#dceceb] px-2 py-0.5 rounded">
                  Live Recalculating
                </span>
              </div>

              {/* Style & Buyer Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#527078] uppercase block mb-1">
                    Style Code
                  </label>
                  <input
                    type="text"
                    value={styleName}
                    onChange={e => setStyleName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-[#d9d2c2] bg-white text-xs font-bold text-[#17343a] focus:outline-none focus:border-[#176f78]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#527078] uppercase block mb-1">
                    Buyer Name
                  </label>
                  <input
                    type="text"
                    value={buyer}
                    onChange={e => setBuyer(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-[#d9d2c2] bg-white text-xs font-bold text-[#17343a] focus:outline-none focus:border-[#176f78]"
                  />
                </div>
              </div>

              {/* Standard Minute Value (SMV) - Unrestricted / No Limit */}
              <div className="space-y-2 bg-[#f1eee6]/40 p-3 rounded-xl border border-[#e7e1d5]">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#17343a]">Standard Minute Value (SMV):</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                      No Limit
                    </span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-[#dceceb] text-[#176f78] capitalize">
                      {smvWeight} weight
                    </span>
                  </div>
                  <span className="font-mono-numbers text-[11px] text-[#527078]">
                    ({(smvMinutes * 60).toFixed(0)} sec)
                  </span>
                </div>

                {/* Direct Number Input & Stepper Buttons */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      id="simulator-smv-input"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={smvMinutes === 0 ? '' : smvMinutes}
                      onChange={e => {
                        const valStr = e.target.value;
                        if (valStr === '') {
                          setSmvMinutes(0);
                          return;
                        }
                        const val = parseFloat(valStr);
                        if (!isNaN(val) && val >= 0) {
                          setSmvMinutes(val);
                          setSimTacctSeconds(Math.round(val * 60));
                        }
                      }}
                      placeholder="Enter SMV in minutes (no limit)"
                      className="w-full px-3 py-1.5 rounded-lg border border-[#d9d2c2] bg-white text-sm font-mono-numbers font-extrabold text-[#176f78] focus:outline-hidden focus:border-[#176f78] pr-12 shadow-2xs"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#527078] pointer-events-none">
                      min
                    </span>
                  </div>

                  {/* Quick Steppers */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const next = Math.max(0.1, Math.round((smvMinutes - 1) * 10) / 10);
                        setSmvMinutes(next);
                        setSimTacctSeconds(Math.round(next * 60));
                      }}
                      className="px-2 py-1.5 rounded-lg bg-white border border-[#d9d2c2] hover:bg-[#f1eee6] text-xs font-bold text-[#17343a] transition-colors cursor-pointer"
                      title="Decrease by 1.0 min"
                    >
                      -1m
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const next = Math.max(0.1, Math.round((smvMinutes - 0.1) * 100) / 100);
                        setSmvMinutes(next);
                        setSimTacctSeconds(Math.round(next * 60));
                      }}
                      className="px-2 py-1.5 rounded-lg bg-white border border-[#d9d2c2] hover:bg-[#f1eee6] text-xs font-bold text-[#17343a] transition-colors cursor-pointer"
                      title="Decrease by 0.1 min"
                    >
                      -0.1m
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const next = Math.round((smvMinutes + 0.1) * 100) / 100;
                        setSmvMinutes(next);
                        setSimTacctSeconds(Math.round(next * 60));
                      }}
                      className="px-2 py-1.5 rounded-lg bg-white border border-[#d9d2c2] hover:bg-[#f1eee6] text-xs font-bold text-[#17343a] transition-colors cursor-pointer"
                      title="Increase by 0.1 min"
                    >
                      +0.1m
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const next = Math.round((smvMinutes + 1) * 10) / 10;
                        setSmvMinutes(next);
                        setSimTacctSeconds(Math.round(next * 60));
                      }}
                      className="px-2 py-1.5 rounded-lg bg-white border border-[#d9d2c2] hover:bg-[#f1eee6] text-xs font-bold text-[#17343a] transition-colors cursor-pointer"
                      title="Increase by 1.0 min"
                    >
                      +1m
                    </button>
                  </div>
                </div>

                {/* Range Slider with dynamic auto-expanding max */}
                <div>
                  <input
                    type="range"
                    min={0.1}
                    max={Math.max(100, Math.ceil(((smvMinutes || 10) * 1.4) / 10) * 10)}
                    step={0.1}
                    value={smvMinutes || 0.1}
                    onChange={e => {
                      const val = parseFloat(e.target.value);
                      setSmvMinutes(val);
                      setSimTacctSeconds(Math.round(val * 60));
                    }}
                    className="w-full accent-[#176f78] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[#527078] font-mono-numbers mt-0.5">
                    <span>0.1m</span>
                    <span>30m (Light)</span>
                    <span>60m (Medium)</span>
                    <span>{Math.max(100, Math.ceil(((smvMinutes || 10) * 1.4) / 10) * 10)}m (Auto-scales)</span>
                  </div>
                </div>

                {/* Common Garment SMV Presets */}
                <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
                  <span className="text-[10px] font-bold text-[#527078] uppercase">Quick Presets:</span>
                  {[
                    { label: 'T-Shirt', smv: 12.5 },
                    { label: 'Polo', smv: 18.2 },
                    { label: 'Trouser', smv: 28.5 },
                    { label: 'Debonair Jacket', smv: 46.8 },
                    { label: 'Heavy Parka', smv: 65.0 },
                    { label: 'Outerwear Coat', smv: 95.0 }
                  ].map(p => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        setSmvMinutes(p.smv);
                        setSimTacctSeconds(Math.round(p.smv * 60));
                      }}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                        Math.abs(smvMinutes - p.smv) < 0.05
                          ? 'bg-[#176f78] text-white border-[#176f78]'
                          : 'bg-white text-[#527078] border-[#d9d2c2] hover:border-[#176f78] hover:text-[#17343a]'
                      }`}
                    >
                      {p.label} ({p.smv}m)
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Efficiency % */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-[#17343a]">Target Efficiency Level:</span>
                  <span className="font-mono-numbers font-extrabold text-emerald-700 text-sm">
                    {targetEffPct}%
                  </span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={100}
                  step={1}
                  value={targetEffPct}
                  onChange={e => setTargetEffPct(parseInt(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#527078] font-mono-numbers mt-1">
                  <span>50% (Day 1)</span>
                  <span>75% (Day 2)</span>
                  <span>85% (Benchmark)</span>
                  <span>95% (Peak)</span>
                </div>
              </div>

              {/* Working Hours & Overtime */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-[11px] font-bold text-[#527078] uppercase block mb-1">
                    Standard Shift (Hrs)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setWorkingHours(prev => Math.max(6, prev - 1))}
                      className="w-8 h-8 rounded-lg border border-[#d9d2c2] bg-white flex items-center justify-center font-bold text-[#17343a] hover:bg-[#f1eee6]"
                    >
                      -
                    </button>
                    <span className="flex-1 text-center font-mono-numbers font-bold text-sm text-[#17343a]">
                      {workingHours} hrs
                    </span>
                    <button
                      onClick={() => setWorkingHours(prev => Math.min(10, prev + 1))}
                      className="w-8 h-8 rounded-lg border border-[#d9d2c2] bg-white flex items-center justify-center font-bold text-[#17343a] hover:bg-[#f1eee6]"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#527078] uppercase block mb-1">
                    Overtime (OT Hrs)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setOvertimeHours(prev => Math.max(0, prev - 1))}
                      className="w-8 h-8 rounded-lg border border-[#d9d2c2] bg-white flex items-center justify-center font-bold text-[#17343a] hover:bg-[#f1eee6]"
                    >
                      -
                    </button>
                    <span className="flex-1 text-center font-mono-numbers font-bold text-sm text-[#17343a]">
                      {overtimeHours} hrs
                    </span>
                    <button
                      onClick={() => setOvertimeHours(prev => Math.min(4, prev + 1))}
                      className="w-8 h-8 rounded-lg border border-[#d9d2c2] bg-white flex items-center justify-center font-bold text-[#17343a] hover:bg-[#f1eee6]"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Manpower Distribution */}
              <div className="pt-2">
                <label className="text-[11px] font-bold text-[#527078] uppercase block mb-2">
                  Line Manpower Setup
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {/* Operators */}
                  <div className="p-2.5 rounded-xl bg-white border border-[#d9d2c2] text-center">
                    <span className="text-[10px] font-bold text-[#527078] block">Operators</span>
                    <div className="flex items-center justify-center gap-1.5 mt-1">
                      <button
                        onClick={() => setOperators(prev => Math.max(10, prev - 1))}
                        className="w-6 h-6 rounded bg-[#f1eee6] text-xs font-bold hover:bg-[#e7e1d5]"
                      >
                        -
                      </button>
                      <span className="font-mono-numbers font-extrabold text-sm text-[#17343a]">
                        {operators}
                      </span>
                      <button
                        onClick={() => setOperators(prev => Math.min(60, prev + 1))}
                        className="w-6 h-6 rounded bg-[#f1eee6] text-xs font-bold hover:bg-[#e7e1d5]"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Helpers */}
                  <div className="p-2.5 rounded-xl bg-white border border-[#d9d2c2] text-center">
                    <span className="text-[10px] font-bold text-[#527078] block">Helpers</span>
                    <div className="flex items-center justify-center gap-1.5 mt-1">
                      <button
                        onClick={() => setHelpers(prev => Math.max(1, prev - 1))}
                        className="w-6 h-6 rounded bg-[#f1eee6] text-xs font-bold hover:bg-[#e7e1d5]"
                      >
                        -
                      </button>
                      <span className="font-mono-numbers font-extrabold text-sm text-[#17343a]">
                        {helpers}
                      </span>
                      <button
                        onClick={() => setHelpers(prev => Math.min(15, prev + 1))}
                        className="w-6 h-6 rounded bg-[#f1eee6] text-xs font-bold hover:bg-[#e7e1d5]"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Ironers */}
                  <div className="p-2.5 rounded-xl bg-white border border-[#d9d2c2] text-center">
                    <span className="text-[10px] font-bold text-[#527078] block">Iron / Finish</span>
                    <div className="flex items-center justify-center gap-1.5 mt-1">
                      <button
                        onClick={() => setIroners(prev => Math.max(1, prev - 1))}
                        className="w-6 h-6 rounded bg-[#f1eee6] text-xs font-bold hover:bg-[#e7e1d5]"
                      >
                        -
                      </button>
                      <span className="font-mono-numbers font-extrabold text-sm text-[#17343a]">
                        {ironers}
                      </span>
                      <button
                        onClick={() => setIroners(prev => Math.min(8, prev + 1))}
                        className="w-6 h-6 rounded bg-[#f1eee6] text-xs font-bold hover:bg-[#e7e1d5]"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 7 Cols: Sensitivity Matrix & Learning Curve */}
            <div className="lg:col-span-7 space-y-6">
              {/* Sensitivity Matrix: Hours vs Efficiency */}
              <div className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-display text-base font-bold uppercase text-[#17343a]">
                      What-If Sensitivity Matrix (Output in Pcs)
                    </h3>
                    <p className="text-xs text-[#527078]">
                      Dynamic simulation cross-referencing shift duration against line efficiency
                    </p>
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-white border border-[#d9d2c2] text-[#527078]">
                    Click cell to adopt
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-[#e7e1d5] text-[#527078]">
                        <th className="py-2 px-3 font-bold">Shift Duration</th>
                        <th className="py-2 px-2 text-center font-bold">70% Eff</th>
                        <th className="py-2 px-2 text-center font-bold">75% Eff</th>
                        <th className="py-2 px-2 text-center font-bold">80% Eff</th>
                        <th className="py-2 px-2 text-center font-bold">85% Eff</th>
                        <th className="py-2 px-2 text-center font-bold">90% Eff</th>
                        <th className="py-2 px-2 text-center font-bold text-emerald-700">95% Eff</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e7e1d5]/60 font-mono-numbers">
                      {[8, 9, 10].map(hrs => {
                        return (
                          <tr key={hrs} className="hover:bg-white/60 transition-colors">
                            <td className="py-2.5 px-3 font-bold text-[#17343a] flex items-center gap-1.5">
                              <span>{hrs} Hours</span>
                              {hrs > 8 && (
                                <span className="text-[9px] font-normal text-amber-700 bg-amber-50 px-1 rounded">
                                  +{hrs - 8}h OT
                                </span>
                              )}
                            </td>
                            {[70, 75, 80, 85, 90, 95].map(eff => {
                              const calcMins = metrics.totalManpower * (hrs * 60);
                              const output = Math.round((calcMins * (eff / 100)) / smvMinutes);
                              const isCurrent =
                                hrs === metrics.grossWorkingHours && eff === targetEffPct;

                              return (
                                <td
                                  key={eff}
                                  onClick={() => {
                                    setWorkingHours(Math.min(hrs, 8));
                                    setOvertimeHours(Math.max(0, hrs - 8));
                                    setTargetEffPct(eff);
                                  }}
                                  className={`py-2 px-2 text-center cursor-pointer transition-all ${
                                    isCurrent
                                      ? 'bg-[#176f78] text-white font-extrabold rounded-md shadow-xs'
                                      : 'hover:bg-[#dceceb] text-[#17343a] font-semibold'
                                  }`}
                                  title={`Adopt ${hrs}h at ${eff}% efficiency`}
                                >
                                  {(output ?? 0).toLocaleString()}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 6-Day Learning Curve & Build-Up Simulator */}
              <div className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-display text-base font-bold uppercase text-[#17343a]">
                      6-Day Ramp-Up &amp; Learning Curve Projection
                    </h3>
                    <p className="text-xs text-[#527078]">
                      Standard 6-day period progression ({simStyleNature} style, {smvWeight} weight)
                    </p>
                  </div>
                  <span className="text-xs font-mono-numbers font-bold text-[#176f78] bg-[#dceceb] px-2 py-0.5 rounded">
                    Steady: {(metrics.targetProductionPcs ?? 0).toLocaleString()} pcs
                  </span>
                </div>

                <div className="space-y-3">
                  {sixDayLearningCurve.days.map((lc, idx) => {
                    return (
                      <div key={lc.day} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#17343a]">{lc.day}</span>
                            <span className="text-[11px] text-[#527078]">({lc.note})</span>
                          </div>
                          <div className="flex items-center gap-2 font-mono-numbers">
                            <span className="font-bold text-[#17343a]">{(lc.pcs ?? 0).toLocaleString()} pcs</span>
                            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-bold">
                              {lc.targetEff}% Eff
                            </span>
                          </div>
                        </div>

                        <div className="w-full h-3 rounded-md bg-[#e7e1d5] overflow-hidden">
                          <div
                            className={`h-full rounded-md transition-all ${
                              idx === 5 ? 'bg-[#176f78]' : 'bg-[#e6813e]'
                            }`}
                            style={{ width: `${lc.targetEff}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: IE STANDARDS & BALANCING SUITE (Ref: Images 2, 3 & 4)          */}
      {/* ========================================================================= */}
      {activeSubTab === 'standards-balancing' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Master Control & Section Toggle Bar */}
          <div className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] p-5 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#0c4a60] text-white">
                    Debonair Ltd. Unit - 02
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#dceceb] text-[#176f78] border border-[#b2d6d8]">
                    Governing IE Standards Suite
                  </span>
                </div>
                <h2 className="font-display text-xl sm:text-2xl font-bold uppercase text-[#17343a]">
                  IE Standards, Balancing Loss &amp; 6-Day Progression
                </h2>
                <p className="text-xs text-[#527078] mt-0.5 max-w-3xl">
                  Centralized IE governing benchmarks: Debonair Unit-02 Balancing Loss Equation (Ref: Image 3),
                  Floor Execution Activity Targets (Ref: Image 2), and Style Classification with 6-Day Period Rule (Ref: Image 4).
                </p>
              </div>

              {/* Master Expand/Collapse & Mode Controls */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                {/* Master Expand / Collapse Toggle Button */}
                <button
                  type="button"
                  id="toggle-all-standards-btn"
                  onClick={toggleAllStandardsSections}
                  className="px-3 py-2 rounded-xl bg-white border border-[#d9d2c2] text-[#17343a] hover:bg-[#f1eee6] text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-all"
                >
                  {isAllStandardsExpanded ? (
                    <>
                      <ChevronUp className="w-4 h-4 text-[#176f78]" />
                      <span>Collapse All Sections</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 text-[#176f78]" />
                      <span>Expand All Sections</span>
                    </>
                  )}
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono-numbers bg-[#f1eee6] text-[#527078]">
                    {Object.values(expandedStandardsSections).filter(Boolean).length} of 3 Open
                  </span>
                </button>

                {/* Simulation Mode Toggle */}
                <div className="flex items-center p-0.5 rounded-xl bg-white border border-[#d9d2c2]">
                  <button
                    type="button"
                    onClick={() => setBalancingSourceMode('preset')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      balancingSourceMode === 'preset'
                        ? 'bg-[#176f78] text-white shadow-xs'
                        : 'text-[#527078] hover:text-[#17343a]'
                    }`}
                  >
                    Preset Model
                  </button>
                  <button
                    type="button"
                    onClick={() => setBalancingSourceMode('line')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      balancingSourceMode === 'line'
                        ? 'bg-[#176f78] text-white shadow-xs'
                        : 'text-[#527078] hover:text-[#17343a]'
                    }`}
                  >
                    Floor Line Data
                  </button>
                </div>

                {balancingSourceMode === 'line' && (
                  <select
                    value={simBalancingLineNo}
                    onChange={e => setSimBalancingLineNo(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-white border border-[#d9d2c2] text-xs font-bold text-[#17343a] focus:outline-hidden focus:ring-1 focus:ring-[#176f78]"
                  >
                    {lines.map(l => (
                      <option key={l.lineNo} value={l.lineNo}>
                        Line {l.lineNo} — {l.style} ({l.buyer})
                      </option>
                    ))}
                  </select>
                )}

                <button
                  type="button"
                  onClick={() => handleApplyBalancingOnlyToLine(simBalancingLineNo)}
                  className="px-3.5 py-2 rounded-xl bg-[#176f78] hover:bg-[#12555c] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                >
                  <Workflow className="w-3.5 h-3.5" />
                  <span>Apply to Line {simBalancingLineNo}</span>
                </button>
              </div>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* SECTION 1: DEBONAIR BALANCING & ESTIMATED LOSS ANALYSIS (IMAGE 3)     */}
          {/* ===================================================================== */}
          <div className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] overflow-hidden shadow-xs">
            {/* Collapsible Section Header */}
            <button
              type="button"
              id="header-debonair-balancing"
              onClick={() => toggleStandardsSection('lossAnalysis')}
              className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-[#f1eee6]/60 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#176f78] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-base sm:text-lg font-bold uppercase text-[#17343a]">
                      Debonair Ltd. Unit - 02 Balancing &amp; Estimated Loss Analysis (Ref: Image 3 Standard)
                    </h3>
                  </div>
                  <p className="text-xs text-[#527078]">
                    Standard plant loss equation: [ (N × CTmax) − ΣT ] / (N × CTmax) × 100 with potential &amp; min capacity
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className={`px-2.5 py-1 rounded-full text-xs font-mono-numbers font-bold ${
                  currentBalancingAnalysis.balancingStatus === 'Stable'
                    ? 'bg-emerald-100 text-emerald-800'
                    : currentBalancingAnalysis.balancingStatus === 'Critical'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  Status: {currentBalancingAnalysis.balancingStatus} • {currentBalancingAnalysis.balancingLossPct}% Loss
                </span>
                <div className="p-1 rounded-lg text-[#527078] hover:bg-[#e7e1d5] ml-1">
                  {expandedStandardsSections.lossAnalysis ? (
                    <ChevronUp className="w-5 h-5 text-[#176f78]" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[#527078]" />
                  )}
                </div>
              </div>
            </button>

            {/* Section 1 Body (Expand/Collapse) */}
            {expandedStandardsSections.lossAnalysis && (
              <div className="p-5 border-t border-[#e7e1d5] space-y-5 animate-fadeIn">
                {/* Real-time KPI Card Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className="p-3 rounded-xl bg-white border border-[#d9d2c2]">
                    <span className="text-[10px] font-bold text-[#527078] uppercase block">TACCT (ΣT)s</span>
                    <span className="font-mono-numbers text-lg font-black text-[#17343a]">
                      {currentBalancingAnalysis.tacctSeconds}s
                    </span>
                    <span className="text-[10px] text-[#527078] block">({(currentBalancingAnalysis.tacctSeconds / 60).toFixed(2)} min)</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-[#d9d2c2]">
                    <span className="text-[10px] font-bold text-[#527078] uppercase block">Max CT (CTmax)</span>
                    <span className="font-mono-numbers text-lg font-black text-rose-600">
                      {currentBalancingAnalysis.maxCTSeconds}s
                    </span>
                    <span className="text-[10px] text-rose-700 block">Bottleneck cycle</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-[#d9d2c2]">
                    <span className="text-[10px] font-bold text-[#527078] uppercase block">Balancing Loss %</span>
                    <span className={`font-mono-numbers text-lg font-black ${
                      currentBalancingAnalysis.balancingLossPct > 25 ? 'text-rose-600' : 'text-amber-600'
                    }`}>
                      {currentBalancingAnalysis.balancingLossPct}%
                    </span>
                    <span className="text-[10px] text-[#527078] block">Formula Eq 1</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-[#d9d2c2]">
                    <span className="text-[10px] font-bold text-[#527078] uppercase block">Potential (Pcs/Hr)</span>
                    <span className="font-mono-numbers text-lg font-black text-[#17343a]">
                      {currentBalancingAnalysis.potentialPcsPerHour}
                    </span>
                    <span className="text-[10px] text-[#527078] block">3600 / CTmax</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-[#d9d2c2]">
                    <span className="text-[10px] font-bold text-[#527078] uppercase block">Estimate (Pcs/Hr)</span>
                    <span className="font-mono-numbers text-lg font-black text-[#176f78]">
                      {currentBalancingAnalysis.estimatePcsPerHour}
                    </span>
                    <span className="text-[10px] text-[#527078] block">Min Cap: {currentBalancingAnalysis.minCapacityPcsPerHour}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-[#d9d2c2]">
                    <span className="text-[10px] font-bold text-[#527078] uppercase block">Est. Loss %</span>
                    <span className={`font-mono-numbers text-lg font-black ${
                      currentBalancingAnalysis.estimatedLossPct < 0 ? 'text-rose-600' : 'text-emerald-600'
                    }`}>
                      {currentBalancingAnalysis.estimatedLossPct > 0 ? `+${currentBalancingAnalysis.estimatedLossPct}%` : `${currentBalancingAnalysis.estimatedLossPct}%`}
                    </span>
                    <span className="text-[10px] text-[#527078] block">vs Hourly Est</span>
                  </div>
                </div>

                {/* Debonair Unit-02 Standard Table (Exact Image 3 Spec) */}
                <div className="overflow-x-auto border border-[#d9d2c2] rounded-xl bg-white shadow-xs">
                  <table className="w-full text-center text-xs border-collapse">
                    <thead className="bg-[#17343a] text-white text-[11px] font-bold uppercase tracking-wider">
                      <tr>
                        <th className="p-2.5 border-r border-[#2c4c54]">Line</th>
                        <th className="p-2.5 border-r border-[#2c4c54]">Buyer</th>
                        <th className="p-2.5 border-r border-[#2c4c54]">Running Style</th>
                        <th className="p-2.5 border-r border-[#2c4c54]">TACCT (&Sigma;T)s</th>
                        <th className="p-2.5 border-r border-[#2c4c54]">TTL OPTR (N)</th>
                        <th className="p-2.5 border-r border-[#2c4c54] bg-rose-950/60">Max CT (CTmax)</th>
                        <th className="p-2.5 border-r border-[#2c4c54] bg-[#125860]">Balancing Loss %</th>
                        <th className="p-2.5 border-r border-[#2c4c54]">Status</th>
                        <th className="p-2.5 border-r border-[#2c4c54]">Potential</th>
                        <th className="p-2.5 border-r border-[#2c4c54]">Estimate</th>
                        <th className="p-2.5 border-r border-[#2c4c54]">Min Cap</th>
                        <th className="p-2.5 border-r border-[#2c4c54]">Current Prdn</th>
                        <th className="p-2.5 bg-slate-800">Est. Loss %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e7e1d5] font-mono-numbers">
                      <tr className="hover:bg-[#fbfaf6] bg-[#f7fcfc]">
                        <td className="p-3 font-sans font-bold text-[#17343a] border-r border-[#e7e1d5]">
                          Line {simBalancingLineNo}
                        </td>
                        <td className="p-3 font-sans font-bold text-[#527078] border-r border-[#e7e1d5]">
                          {buyer}
                        </td>
                        <td className="p-3 font-sans font-bold text-[#17343a] border-r border-[#e7e1d5]">
                          {styleName}
                        </td>
                        <td className="p-3 font-bold text-[#176f78] border-r border-[#e7e1d5]">
                          {currentBalancingAnalysis.tacctSeconds}s
                        </td>
                        <td className="p-3 font-bold text-[#17343a] border-r border-[#e7e1d5]">
                          {currentBalancingAnalysis.totalOperators}
                        </td>
                        <td className="p-3 font-bold text-rose-600 bg-rose-50/50 border-r border-[#e7e1d5]">
                          {currentBalancingAnalysis.maxCTSeconds}s
                        </td>
                        <td className="p-3 font-bold text-amber-700 bg-amber-50/50 border-r border-[#e7e1d5]">
                          {currentBalancingAnalysis.balancingLossPct}%
                        </td>
                        <td className="p-3 font-sans border-r border-[#e7e1d5]">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            currentBalancingAnalysis.balancingStatus === 'Stable'
                              ? 'bg-emerald-100 text-emerald-800'
                              : currentBalancingAnalysis.balancingStatus === 'Critical'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {currentBalancingAnalysis.balancingStatus}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-[#17343a] border-r border-[#e7e1d5]">
                          {currentBalancingAnalysis.potentialPcsPerHour}
                        </td>
                        <td className="p-3 font-bold text-[#176f78] border-r border-[#e7e1d5]">
                          {currentBalancingAnalysis.estimatePcsPerHour}
                        </td>
                        <td className="p-3 text-[#527078] border-r border-[#e7e1d5]">
                          {currentBalancingAnalysis.minCapacityPcsPerHour}
                        </td>
                        <td className="p-3 font-bold text-[#17343a] border-r border-[#e7e1d5]">
                          {currentBalancingAnalysis.currentProductionPcsPerHour}
                        </td>
                        <td className={`p-3 font-bold ${
                          currentBalancingAnalysis.estimatedLossPct < 0 ? 'text-rose-600' : 'text-emerald-700'
                        }`}>
                          {currentBalancingAnalysis.estimatedLossPct > 0 ? `+${currentBalancingAnalysis.estimatedLossPct}%` : `${currentBalancingAnalysis.estimatedLossPct}%`}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Interactive Parameter Tuning Grid */}
                <div className="p-4 rounded-xl bg-white border border-[#d9d2c2] space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h4 className="font-display text-xs font-bold uppercase text-[#17343a] flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-[#176f78]" />
                      <span>Interactive Balancing Loss Simulator Variables</span>
                    </h4>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (criticalBottleneckOp) {
                            setSimMaxCTSeconds(criticalBottleneckOp.cycleTimeSec);
                          }
                          setSimTacctSeconds(Math.round(smvMinutes * 60));
                          setSimTotalOperators(operators);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#f1eee6] text-[#17343a] hover:bg-[#e7e1d5] text-[11px] font-bold border border-[#d9d2c2] cursor-pointer"
                      >
                        Sync with Bottleneck ({criticalBottleneckOp ? `${criticalBottleneckOp.cycleTimeSec}s` : 'Auto'})
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
                    <div>
                      <label className="block text-[10px] font-bold text-[#527078] uppercase mb-1">
                        TACCT (&Sigma;T) in Seconds
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={simTacctSeconds}
                        onChange={e => setSimTacctSeconds(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 rounded-lg border border-[#d9d2c2] text-xs font-mono-numbers font-bold text-[#17343a] focus:ring-1 focus:ring-[#176f78]"
                      />
                      <span className="text-[9px] text-[#527078] mt-0.5 block">Total garment work content</span>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#527078] uppercase mb-1">
                        TTL Operators (N)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={120}
                        value={simTotalOperators}
                        onChange={e => setSimTotalOperators(parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-1.5 rounded-lg border border-[#d9d2c2] text-xs font-mono-numbers font-bold text-[#17343a] focus:ring-1 focus:ring-[#176f78]"
                      />
                      <span className="text-[9px] text-[#527078] mt-0.5 block">Total sewing operators</span>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-rose-700 uppercase mb-1">
                        Max CT (CTmax) Sec
                      </label>
                      <input
                        type="number"
                        min={5}
                        max={300}
                        value={simMaxCTSeconds}
                        onChange={e => setSimMaxCTSeconds(parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-1.5 rounded-lg border border-rose-300 text-xs font-mono-numbers font-bold text-rose-700 focus:ring-1 focus:ring-rose-500"
                      />
                      <span className="text-[9px] text-rose-600 mt-0.5 block">Slowest cycle station</span>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#527078] uppercase mb-1">
                        Hourly Estimate (Pcs)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={1000}
                        value={simHourlyEstimate}
                        onChange={e => setSimHourlyEstimate(parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-1.5 rounded-lg border border-[#d9d2c2] text-xs font-mono-numbers font-bold text-[#17343a] focus:ring-1 focus:ring-[#176f78]"
                      />
                      <span className="text-[9px] text-[#527078] mt-0.5 block">IE hourly target estimate</span>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#527078] uppercase mb-1">
                        Current Prdn (Pcs/Hr)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={1000}
                        value={simCurrentPrdnHourly}
                        onChange={e => setSimCurrentPrdnHourly(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 rounded-lg border border-[#d9d2c2] text-xs font-mono-numbers font-bold text-[#17343a] focus:ring-1 focus:ring-[#176f78]"
                      />
                      <span className="text-[9px] text-[#527078] mt-0.5 block">Actual floor output run</span>
                    </div>
                  </div>
                </div>

                {/* Debonair Standard Equation Note */}
                <div className="p-3.5 rounded-xl bg-[#eef7f7] border border-[#b2d6d8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#0c4a60]">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-[#176f78] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Debonair Unit-02 Governing Equation (Ref: Image 3):</span>
                      <code className="font-mono text-[11px] bg-white/80 px-2 py-0.5 rounded border border-[#b2d6d8] mt-1 inline-block">
                        Balancing Loss % = [ (Total Operators &times; Max CT) &minus; TACCT ] / (Total Operators &times; Max CT) &times; 100
                      </code>
                    </div>
                  </div>
                  <div className="text-[11px] font-mono-numbers shrink-0">
                    <span className="font-bold">Benchmarking:</span> &lt;15% Stable (Target) • 15&ndash;35% High Loss • &gt;35% Critical Bottleneck
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ===================================================================== */}
          {/* SECTION 2: IE BALANCING & FLOOR EXECUTION ACTIVITY TARGETS (IMAGE 2)  */}
          {/* ===================================================================== */}
          <div className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] overflow-hidden shadow-xs">
            {/* Collapsible Section Header */}
            <button
              type="button"
              id="header-activity-targets"
              onClick={() => toggleStandardsSection('activityTargets')}
              className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-[#f1eee6]/60 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#8c531b] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-base sm:text-lg font-bold uppercase text-[#17343a]">
                      IE Balancing &amp; Floor Execution Activity Targets (Ref: Image 2)
                    </h3>
                  </div>
                  <p className="text-xs text-[#527078]">
                    Six sequential activity gates: Theoretical balance, error tolerance, capacity buffer, operator assignment &amp; needle downtime
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="px-2.5 py-1 rounded-full text-xs font-mono-numbers font-bold bg-[#f1eee6] text-[#8c531b] border border-[#d9d2c2]">
                  Targets: &gt;95% Bal • &lt;5% Err • &gt;10% Cap • 18m DT
                </span>
                <div className="p-1 rounded-lg text-[#527078] hover:bg-[#e7e1d5] ml-1">
                  {expandedStandardsSections.activityTargets ? (
                    <ChevronUp className="w-5 h-5 text-[#8c531b]" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[#527078]" />
                  )}
                </div>
              </div>
            </button>

            {/* Section 2 Body (Expand/Collapse) */}
            {expandedStandardsSections.activityTargets && (
              <div className="p-5 border-t border-[#e7e1d5] space-y-4 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* SEQ 01: Theoretical Balance */}
                  <div className="p-4 rounded-xl bg-white border border-[#d9d2c2] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#8c531b] bg-[#fcf8f2] px-2 py-0.5 rounded border border-[#f0dfc8]">
                        SEQ 01 • Target: &gt; 95%
                      </span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        simTheoreticalBalancePct >= 95 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {simTheoreticalBalancePct >= 95 ? 'Compliant' : 'Sub-Optimal'}
                      </span>
                    </div>
                    <div className="font-display font-bold text-sm text-[#17343a]">
                      Theoretical Line Balance
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono-numbers text-2xl font-black text-[#17343a]">
                        {simTheoreticalBalancePct}%
                      </span>
                      <span className="text-xs text-[#527078]">Floor Target: &gt; 95%</span>
                    </div>
                    <input
                      type="range"
                      min={80}
                      max={100}
                      step={0.1}
                      value={simTheoreticalBalancePct}
                      onChange={e => setSimTheoreticalBalancePct(parseFloat(e.target.value))}
                      className="w-full accent-[#8c531b]"
                    />
                  </div>

                  {/* SEQ 02: Balancing Error */}
                  <div className="p-4 rounded-xl bg-white border border-[#d9d2c2] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#176f78] bg-[#eef7f7] px-2 py-0.5 rounded border border-[#b2d6d8]">
                        SEQ 02 • Target: &lt; 5%
                      </span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        simBalancingErrorPct <= 5 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {simBalancingErrorPct <= 5 ? 'Compliant' : 'Excess Error'}
                      </span>
                    </div>
                    <div className="font-display font-bold text-sm text-[#17343a]">
                      Balancing Error Allowance
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono-numbers text-2xl font-black text-[#17343a]">
                        {simBalancingErrorPct}%
                      </span>
                      <span className="text-xs text-[#527078]">Floor Target: &lt; 5%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={15}
                      step={0.1}
                      value={simBalancingErrorPct}
                      onChange={e => setSimBalancingErrorPct(parseFloat(e.target.value))}
                      className="w-full accent-[#176f78]"
                    />
                  </div>

                  {/* SEQ 03: Capacity Estimate */}
                  <div className="p-4 rounded-xl bg-white border border-[#d9d2c2] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#0c4a60] bg-[#e7f1f5] px-2 py-0.5 rounded border border-[#b8d4df]">
                        SEQ 03 • Target: &gt; 10%
                      </span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        simCapacityEstimatePct >= 10 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {simCapacityEstimatePct >= 10 ? 'Compliant' : 'Low Reserve'}
                      </span>
                    </div>
                    <div className="font-display font-bold text-sm text-[#17343a]">
                      Capacity Estimate Buffer
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono-numbers text-2xl font-black text-[#17343a]">
                        +{simCapacityEstimatePct}%
                      </span>
                      <span className="text-xs text-[#527078]">Floor Target: &gt; 10%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={25}
                      step={0.5}
                      value={simCapacityEstimatePct}
                      onChange={e => setSimCapacityEstimatePct(parseFloat(e.target.value))}
                      className="w-full accent-[#0c4a60]"
                    />
                  </div>

                  {/* SEQ 04.1: Right Man in Right Process */}
                  <div className="p-4 rounded-xl bg-white border border-[#d9d2c2] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#17343a] bg-[#f1eee6] px-2 py-0.5 rounded">
                        SEQ 04.1 • Manpower
                      </span>
                      <button
                        type="button"
                        onClick={() => setSimRightManVerified(!simRightManVerified)}
                        className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
                          simRightManVerified
                            ? 'bg-emerald-600 text-white'
                            : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                        }`}
                      >
                        {simRightManVerified ? '100% Assigned' : 'Verification Needed'}
                      </button>
                    </div>
                    <div className="font-display font-bold text-sm text-[#17343a]">
                      Right Man in Right Process
                    </div>
                    <p className="text-xs text-[#527078]">
                      Operator skill matrix match: Grade A on critical stations, Grade B on standard seams.
                    </p>
                  </div>

                  {/* SEQ 04.2: Right Machine for Process */}
                  <div className="p-4 rounded-xl bg-white border border-[#d9d2c2] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#17343a] bg-[#f1eee6] px-2 py-0.5 rounded">
                        SEQ 04.2 • Machinery
                      </span>
                      <button
                        type="button"
                        onClick={() => setSimRightMachineVerified(!simRightMachineVerified)}
                        className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
                          simRightMachineVerified
                            ? 'bg-emerald-600 text-white'
                            : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                        }`}
                      >
                        {simRightMachineVerified ? '100% Ready' : 'Setup Incomplete'}
                      </button>
                    </div>
                    <div className="font-display font-bold text-sm text-[#17343a]">
                      Right Machine for Process
                    </div>
                    <p className="text-xs text-[#527078]">
                      Feed-off-the-arm, overlock, lockstitch, and bar-tack RPM calibration &amp; needle sizes locked.
                    </p>
                  </div>

                  {/* SEQ 05: Needle Downtime */}
                  <div className="p-4 rounded-xl bg-white border border-[#d9d2c2] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#0c4a60] bg-[#eef7f7] px-2 py-0.5 rounded border border-[#b2d6d8]">
                        SEQ 05 • Target: 18 Min
                      </span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        simNeedleDowntimeMinutes <= 18 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {simNeedleDowntimeMinutes <= 18 ? 'Within Limit' : 'Excess Downtime'}
                      </span>
                    </div>
                    <div className="font-display font-bold text-sm text-[#17343a]">
                      Needle Downtime Tolerance
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono-numbers text-2xl font-black text-[#17343a]">
                        {simNeedleDowntimeMinutes} Min
                      </span>
                      <span className="text-xs text-[#527078]">Target: 18 Min max</span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={45}
                      value={simNeedleDowntimeMinutes}
                      onChange={e => setSimNeedleDowntimeMinutes(parseInt(e.target.value))}
                      className="w-full accent-[#0c4a60]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ===================================================================== */}
          {/* SECTION 3: GARMENT STYLE CLASSIFICATION & 6-DAY PERIOD RULE (IMAGE 4) */}
          {/* ===================================================================== */}
          <div className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] overflow-hidden shadow-xs">
            {/* Collapsible Section Header */}
            <div
              id="header-style-classification"
              onClick={() => toggleStandardsSection('styleClassification')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleStandardsSection('styleClassification');
                }
              }}
              className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-[#f1eee6]/60 transition-colors cursor-pointer select-none"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0c4a60] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-base sm:text-lg font-bold uppercase text-[#17343a]">
                      Garment Style Classification &amp; 6-Day Period Rule (Ref: Image 4)
                    </h3>
                  </div>
                  <p className="text-xs text-[#527078]">
                    Automatically looks up efficiency targets from the Style Progression Chart (Initial Run vs &le; 3 Months Repeat)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="px-2.5 py-1 rounded-full text-xs font-mono-numbers font-bold bg-[#dceceb] text-[#176f78]">
                  Day {simLcCurrentDay} of 6 • {simStyleNature === 'new' ? 'New Style' : 'Repeat Style (+5% Boost)'}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSimProgressionModal(true);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#176f78] text-white font-bold text-xs flex items-center gap-1 shadow-xs hover:bg-[#125860] cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>40-Day Chart</span>
                </button>
                <div className="p-1 rounded-lg text-[#527078] hover:bg-[#e7e1d5] ml-1">
                  {expandedStandardsSections.styleClassification ? (
                    <ChevronUp className="w-5 h-5 text-[#0c4a60]" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[#527078]" />
                  )}
                </div>
              </div>
            </div>

            {/* Section 3 Body (Expand/Collapse) */}
            {expandedStandardsSections.styleClassification && (
              <div className="p-5 border-t border-[#e7e1d5] space-y-5 animate-fadeIn text-xs">
                {/* Style Nature & Weight Configuration Strip */}
                <div className="p-4 rounded-xl bg-white border border-[#d9d2c2] space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Style Nature Selector */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1.5">
                        Style Nature Classification
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setSimStyleNature('new')}
                          className={`p-2.5 rounded-xl text-center font-bold transition-all cursor-pointer ${
                            simStyleNature === 'new'
                              ? 'bg-[#176f78] text-white shadow-xs'
                              : 'bg-[#f1eee6] text-[#527078] hover:bg-[#e7e1d5] border border-[#d9d2c2]'
                          }`}
                        >
                          New Style
                          <span className="block text-[10px] font-normal opacity-80">Initial Run</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSimStyleNature('repeat')}
                          className={`p-2.5 rounded-xl text-center font-bold transition-all cursor-pointer ${
                            simStyleNature === 'repeat'
                              ? 'bg-[#8c531b] text-white shadow-xs'
                              : 'bg-[#f1eee6] text-[#527078] hover:bg-[#e7e1d5] border border-[#d9d2c2]'
                          }`}
                        >
                          Repeat Style
                          <span className="block text-[10px] font-normal opacity-80">&le; 3 Months (+5%)</span>
                        </button>
                      </div>
                    </div>

                    {/* SMV Weight Classification */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1.5">
                        SMV Weight Category
                      </label>
                      <div className="p-2.5 rounded-xl bg-[#f1eee6] border border-[#d9d2c2] flex items-center justify-between">
                        <div>
                          <div className="font-bold text-[#17343a] capitalize">{smvWeight} Weight</div>
                          <div className="text-[10px] text-[#527078]">
                            {smvWeight === 'light' ? '0 - 30 Min' : smvWeight === 'medium' ? '31 - 60 Min' : '> 61 Min'}
                          </div>
                        </div>
                        <span className="px-2 py-1 rounded-md text-[11px] font-mono-numbers font-bold bg-white text-[#176f78] border border-[#d9d2c2]">
                          {smvMinutes} min SMV
                        </span>
                      </div>
                    </div>

                    {/* Current Period Day */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1.5">
                        Current Period Day (1 to 6)
                      </label>
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5, 6].map(dayNum => (
                          <button
                            key={dayNum}
                            type="button"
                            onClick={() => setSimLcCurrentDay(dayNum)}
                            className={`flex-1 py-2 rounded-lg font-bold text-center transition-all cursor-pointer ${
                              simLcCurrentDay === dayNum
                                ? 'bg-[#176f78] text-white shadow-xs'
                                : 'bg-[#f1eee6] text-[#527078] hover:bg-[#e7e1d5] border border-[#d9d2c2]'
                            }`}
                          >
                            D{dayNum}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Debonair Standard Rule Callout */}
                  <div className="p-3 rounded-lg bg-[#fbfaf6] border border-[#e7e1d5] text-[11px] text-[#527078] flex items-start gap-2">
                    <Info className="w-4 h-4 text-[#176f78] shrink-0 mt-0.5" />
                    <div>
                      <strong>Standard Rule (Ref: Image 4):</strong> 01. If any style input starts again within 3 months, it will be considered as repeat style. Repeat styles feature a higher Day 1 target (+5% boost) due to operator process familiarity. The standard learning curve ramp-up period is exactly <strong>6 days</strong> before reaching normal operations.
                    </div>
                  </div>
                </div>

                {/* 6-Day Period Progression Visual Comparison Bar Chart */}
                <div className="p-4 rounded-xl bg-white border border-[#d9d2c2] space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h4 className="font-display text-xs font-bold uppercase text-[#17343a] flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#176f78]" />
                      <span>6-Day Progression Comparison (Planned Target vs Simulated Output)</span>
                    </h4>
                    <div className="flex items-center gap-3 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-xs bg-[#176f78]" />
                        <span className="text-[#527078]">Planned Target</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-xs bg-emerald-500" />
                        <span className="text-[#527078]">Achieved Output</span>
                      </div>
                    </div>
                  </div>

                  {/* Dual Bar Display Grid */}
                  <div className="grid grid-cols-6 gap-2 pt-2 border-t border-[#e7e1d5]">
                    {[1, 2, 3, 4, 5, 6].map(dayNum => {
                      const isCurrent = simLcCurrentDay === dayNum;
                      const plannedEff = getProgressionTargetEff(dayNum, simStyleNature, smvWeight);
                      const dayRec = simDayRecords.find(r => r.day === dayNum);
                      const achievedQty = dayRec?.achievedQty || 0;
                      const totalAvailMin = metrics.totalGrossAvailableMinutes;
                      const plannedPcs = Math.round((totalAvailMin * (plannedEff / 100)) / (smvMinutes > 0 ? smvMinutes : 1));
                      const achievedEff = achievedQty > 0
                        ? Math.min(100, Math.round(((achievedQty * smvMinutes) / (totalAvailMin || 1)) * 100))
                        : 0;

                      const maxPercent = 75;
                      const plannedHeight = Math.min(100, (plannedEff / maxPercent) * 100);
                      const achievedHeight = Math.min(100, (achievedEff / maxPercent) * 100);

                      return (
                        <div
                          key={dayNum}
                          className={`p-2.5 rounded-xl border flex flex-col items-center justify-between transition-all ${
                            isCurrent
                              ? 'bg-[#eef7f7] border-[#176f78] shadow-xs'
                              : 'bg-[#fbfaf6] border-[#d9d2c2]'
                          }`}
                        >
                          <div className="text-center w-full">
                            <span className={`text-[10px] font-bold block ${
                              isCurrent ? 'text-[#176f78]' : 'text-[#527078]'
                            }`}>
                              Day {dayNum}
                            </span>
                            {isCurrent && (
                              <span className="px-1 py-0.2 rounded text-[8px] font-bold bg-[#176f78] text-white uppercase inline-block">
                                Active
                              </span>
                            )}
                          </div>

                          <div className="w-full h-24 flex items-end justify-center gap-1.5 py-1">
                            <div
                              style={{ height: `${plannedHeight}%` }}
                              className="w-3.5 sm:w-4 bg-[#176f78] rounded-t-sm transition-all cursor-pointer"
                              title={`Planned Target: ${plannedEff}% (${plannedPcs} pcs)`}
                            />
                            <div
                              style={{ height: `${achievedHeight}%` }}
                              className={`w-3.5 sm:w-4 rounded-t-sm transition-all cursor-pointer ${
                                achievedEff >= plannedEff
                                  ? 'bg-emerald-500'
                                  : achievedEff > 0
                                  ? 'bg-amber-500'
                                  : 'bg-slate-200'
                              }`}
                              title={`Achieved: ${achievedEff}% (${achievedQty} pcs)`}
                            />
                          </div>

                          <div className="text-center text-[10px] font-mono-numbers">
                            <span className="text-[#176f78] font-bold block">{plannedEff}%</span>
                            <span className={`${
                              achievedEff >= plannedEff
                                ? 'text-emerald-700 font-bold'
                                : achievedEff > 0
                                ? 'text-amber-700'
                                : 'text-slate-400'
                            }`}>
                              {achievedEff > 0 ? `${achievedEff}%` : '—'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Day-by-Day Interactive Telemetry & Logging Table */}
                <div className="overflow-x-auto border border-[#d9d2c2] rounded-xl bg-white shadow-xs">
                  <table className="w-full text-center text-xs border-collapse">
                    <thead className="bg-[#f1eee6] border-b border-[#d9d2c2] text-[11px] font-bold text-[#17343a]">
                      <tr>
                        <th className="p-2.5 border-r border-[#e7e1d5] w-20">Period Day</th>
                        <th className="p-2.5 border-r border-[#e7e1d5] bg-[#eef7f7]">Planned Eff %</th>
                        <th className="p-2.5 border-r border-[#e7e1d5] bg-[#eef7f7]">Target Pcs</th>
                        <th className="p-2.5 border-r border-[#e7e1d5] bg-[#e6f4ea]">Achieved / Sim Pcs</th>
                        <th className="p-2.5 border-r border-[#e7e1d5] bg-[#e6f4ea]">Achieved Eff %</th>
                        <th className="p-2.5 border-r border-[#e7e1d5]">Variance (Pcs)</th>
                        <th className="p-2.5 border-r border-[#e7e1d5]">Status</th>
                        <th className="p-2.5 text-left">Floor Focus Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e7e1d5]">
                      {[1, 2, 3, 4, 5, 6].map(dayNum => {
                        const isCurrent = simLcCurrentDay === dayNum;
                        const plannedEff = getProgressionTargetEff(dayNum, simStyleNature, smvWeight);
                        const totalAvailMin = metrics.totalGrossAvailableMinutes;
                        const plannedQty = Math.round((totalAvailMin * (plannedEff / 100)) / (smvMinutes > 0 ? smvMinutes : 1));
                        const dayRec = simDayRecords.find(r => r.day === dayNum) || { day: dayNum, achievedQty: 0, notes: '' };
                        const achievedQty = dayRec.achievedQty || 0;
                        const achievedEff = achievedQty > 0
                          ? Math.min(100, Math.round(((achievedQty * smvMinutes) / (totalAvailMin || 1)) * 100))
                          : 0;
                        const variancePcs = achievedQty > 0 ? achievedQty - plannedQty : 0;
                        const isAhead = variancePcs >= 0;

                        return (
                          <tr
                            key={dayNum}
                            className={`hover:bg-[#fbfaf6] ${isCurrent ? 'bg-[#f0f9f9]' : ''}`}
                          >
                            <td className="p-2.5 border-r border-[#e7e1d5] font-bold text-[#17343a]">
                              Day - {dayNum}
                              {isCurrent && (
                                <span className="block text-[9px] text-[#176f78] uppercase font-bold">Active</span>
                              )}
                            </td>
                            <td className="p-2.5 border-r border-[#e7e1d5] font-mono-numbers font-bold text-[#176f78] bg-[#eef7f7]/30">
                              {plannedEff}%
                            </td>
                            <td className="p-2.5 border-r border-[#e7e1d5] font-mono-numbers font-bold text-[#17343a] bg-[#eef7f7]/30">
                              {plannedQty} pcs
                            </td>
                            <td className="p-2 border-r border-[#e7e1d5] bg-[#e6f4ea]/30">
                              <input
                                type="number"
                                value={achievedQty || ''}
                                onChange={e => {
                                  const val = parseInt(e.target.value) || 0;
                                  setSimDayRecords(prev =>
                                    prev.map(r => r.day === dayNum ? { ...r, achievedQty: val } : r)
                                  );
                                }}
                                placeholder="Simulate pcs"
                                className="w-24 px-2 py-1 rounded-lg border border-[#d9d2c2] font-mono-numbers font-bold text-center bg-white text-[#17343a] focus:ring-1 focus:ring-emerald-500"
                              />
                            </td>
                            <td className="p-2.5 border-r border-[#e7e1d5] font-mono-numbers font-bold text-emerald-800 bg-[#e6f4ea]/30">
                              {achievedEff > 0 ? `${achievedEff}%` : '—'}
                            </td>
                            <td className={`p-2.5 border-r border-[#e7e1d5] font-mono-numbers font-bold ${
                              achievedQty === 0 ? 'text-slate-400' : isAhead ? 'text-emerald-700' : 'text-rose-600'
                            }`}>
                              {achievedQty === 0 ? '—' : isAhead ? `+${variancePcs}` : `${variancePcs}`}
                            </td>
                            <td className="p-2.5 border-r border-[#e7e1d5]">
                              {achievedQty === 0 ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                                  Pending
                                </span>
                              ) : isAhead ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  On Track
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                                  Behind
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 text-left text-[11px] text-[#527078]">
                              {dayNum === 1 && 'Initial machine setup, bundle feeding & seam pacing'}
                              {dayNum === 2 && 'Seam pacing improvement, helper flow stabilized'}
                              {dayNum === 3 && 'Critical bottleneck stations balanced, pitch aligned'}
                              {dayNum === 4 && 'Pacing matched to standard takt, buffer stabilized'}
                              {dayNum === 5 && 'Operator speed approaching rated standard'}
                              {dayNum === 6 && '6-Day Ramp Completed, target steady-state reached'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {activeSubTab === 'line-handoff' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Handoff Status Summary */}
          <div className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#0c4a60] text-white flex flex-col items-center justify-center shrink-0 shadow-xs">
                  <span className="font-mono-numbers text-2xl font-black">{handoffScore}%</span>
                  <span className="text-[9px] uppercase tracking-wider text-sky-200">READY</span>
                </div>
                <div>
                  <h3 className="font-display text-lg sm:text-xl font-bold uppercase text-[#17343a]">
                    Pre-Production Technical Handoff Scorecard
                  </h3>
                  <p className="text-xs text-[#527078] mt-0.5">
                    Formal validation between IE, Maintenance Mechanics, Sewing Line Supervisors, and QA.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setHandoffChecks(prev => prev.map(item => ({ ...item, status: 'pass' })));
                    setSignoffs(prev => prev.map(s => ({ ...s, status: 'approved' })));
                  }}
                  className="px-3 py-1.5 rounded-lg border border-[#d9d2c2] bg-white hover:bg-[#f1eee6] text-xs font-bold text-[#17343a] flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Mark 100% Ready</span>
                </button>
              </div>
            </div>
          </div>

          {/* Machine Requirement & Layout Table */}
          <div className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-base font-bold uppercase text-[#17343a]">
                  Machine Inventory & Calibration Status
                </h3>
                <p className="text-xs text-[#527078]">
                  Total {machines.reduce((acc, m) => acc + m.requiredCount, 0)} machines planned for {styleName}
                </p>
              </div>
              <span className="text-xs font-mono-numbers text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-200">
                100% Machine Layout Verified
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-[#e7e1d5] text-[#527078]">
                    <th className="py-2.5 px-3 font-bold">Machine Type / Classification</th>
                    <th className="py-2.5 px-3 font-bold">Standard Model</th>
                    <th className="py-2.5 px-2 text-center font-bold">Req.</th>
                    <th className="py-2.5 px-2 text-center font-bold">Installed</th>
                    <th className="py-2.5 px-2 text-center font-bold">Calibrated</th>
                    <th className="py-2.5 px-3 font-bold">Gauge / Technical Spec</th>
                    <th className="py-2.5 px-3 text-right font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e7e1d5]/60 font-mono-numbers">
                  {machines.map(m => {
                    const isAllCalibrated = m.calibratedCount >= m.requiredCount;
                    return (
                      <tr key={m.type} className="hover:bg-white/60">
                        <td className="py-2.5 px-3 font-bold text-[#17343a] font-sans">
                          {m.type}
                        </td>
                        <td className="py-2.5 px-3 text-[#527078] font-sans">{m.name}</td>
                        <td className="py-2.5 px-2 text-center font-bold text-[#17343a]">
                          {m.requiredCount}
                        </td>
                        <td className="py-2.5 px-2 text-center text-emerald-700 font-bold">
                          {m.installedCount}
                        </td>
                        <td className="py-2.5 px-2 text-center text-emerald-700 font-bold">
                          {m.calibratedCount}
                        </td>
                        <td className="py-2.5 px-3 text-[#527078] font-sans">{m.gaugeSpec}</td>
                        <td className="py-2.5 px-3 text-right">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase font-sans ${
                              isAllCalibrated
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{isAllCalibrated ? 'Passed' : 'Partial'}</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Handoff Inspection Checkpoints */}
          <div className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-base font-bold uppercase text-[#17343a]">
                  Technical Setup Checklist & Audits
                </h3>
                <p className="text-xs text-[#527078]">
                  Click status tags to cycle Pass / Fail / Pending
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              {handoffChecks.map(item => {
                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl border border-[#e7e1d5] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#17343a]">{item.item}</span>
                        <span className="text-[10px] font-mono-numbers font-bold text-[#527078] bg-[#f1eee6] px-1.5 py-0.2 rounded">
                          {item.responsible}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#527078] mt-1">{item.standard}</p>
                      {item.notes && (
                        <p className="text-[10px] text-emerald-700 font-medium mt-0.5">
                          ✓ Verified: {item.notes}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleToggleChecklistStatus(item.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold uppercase shrink-0 transition-all cursor-pointer ${
                        item.status === 'pass'
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : item.status === 'fail'
                          ? 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                          : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                      }`}
                    >
                      {item.status.toUpperCase()}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Digital 4-Way Technical Sign-off Protocol */}
          <div className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-base font-bold uppercase text-[#17343a]">
                  Digital 4-Way Technical Sign-Off Sheet
                </h3>
                <p className="text-xs text-[#527078]">
                  Mandatory sign-offs required prior to cutting bundle release
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {signoffs.map(sign => {
                const isApproved = sign.status === 'approved';
                return (
                  <div
                    key={sign.role}
                    className="p-4 rounded-xl border border-[#e7e1d5] bg-white flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-[#17343a]">{sign.title}</span>
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                            isApproved
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {sign.status}
                        </span>
                      </div>
                      <div className="text-xs text-[#176f78] font-bold mt-2 font-mono-numbers">
                        {sign.signedByName}
                      </div>
                      <p className="text-[11px] text-[#527078] mt-1.5 line-clamp-3">
                        "{sign.comments}"
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#e7e1d5] flex items-center justify-between text-[10px]">
                      <span className="text-[#527078] font-mono-numbers">{sign.signedAt}</span>
                      {!isApproved ? (
                        <button
                          onClick={() => handleSignoff(sign.role)}
                          className="px-2 py-1 rounded bg-[#176f78] text-white font-bold cursor-pointer hover:bg-[#125860]"
                        >
                          Sign Now
                        </button>
                      ) : (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Signed
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: IE PLANNING, PITCH DIAGRAM & PRODUCTION FLOW                    */}
      {/* ========================================================================= */}
      {activeSubTab === 'production-flow' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Pitch Analysis Summary Card */}
          <div className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-[#527078] uppercase">Line Balancing Score:</span>
                  <span className="font-mono-numbers font-black text-xl text-[#17343a]">
                    {pitchAnalysis.lineBalanceEfficiencyPct}%
                  </span>
                  <span className="text-[10px] text-[#527078]">
                    (Balance Loss: {pitchAnalysis.balanceLossPct}%)
                  </span>
                </div>
                <h3 className="font-display text-lg font-bold uppercase text-[#17343a]">
                  Workstation Pitch Time & Cycle Time Balancing
                </h3>
                <p className="text-xs text-[#527078] mt-0.5">
                  Target Pitch Time: <strong className="text-[#176f78] font-mono-numbers">{metrics.pitchTimeSeconds} seconds</strong> across {operations.length} workstations.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="auto-rebalance-btn"
                  onClick={handleAutoRebalance}
                  className="px-3.5 py-2 rounded-xl bg-[#176f78] hover:bg-[#125860] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Auto-Balance Bottlenecks</span>
                </button>
              </div>
            </div>

            {/* Visual Pitch Diagram Bar Chart */}
            <div className="mt-6 pt-4 border-t border-[#e7e1d5]">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-[#17343a]">Pitch Diagram (Cycle Time vs. Pitch Takt Line):</span>
                <div className="flex items-center gap-4 text-[11px]">
                  <span className="flex items-center gap-1 text-rose-700 font-bold">
                    <span className="w-3 h-0.5 bg-rose-500 border border-rose-500"></span> Pitch Takt ({metrics.pitchTimeSeconds}s)
                  </span>
                  <span className="flex items-center gap-1 text-amber-700">
                    <span className="w-2.5 h-2.5 bg-amber-500 rounded-xs"></span> Bottleneck Station
                  </span>
                  <span className="flex items-center gap-1 text-emerald-700">
                    <span className="w-2.5 h-2.5 bg-[#176f78] rounded-xs"></span> Balanced Station
                  </span>
                </div>
              </div>

              {/* Responsive SVG / HTML Bar Chart */}
              <div className="relative h-56 w-full rounded-xl bg-white border border-[#e7e1d5] p-3 flex items-end justify-between gap-1 overflow-x-auto">
                {/* Reference Pitch Line */}
                {metrics.pitchTimeSeconds > 0 && (
                  <div
                    className="absolute inset-x-3 border-b-2 border-dashed border-rose-500 z-10 pointer-events-none flex items-center justify-end pr-2"
                    style={{
                      bottom: `${Math.min(
                        90,
                        Math.max(10, (metrics.pitchTimeSeconds / (pitchAnalysis.maxCycleTimeSec * 1.25 || 50)) * 100)
                      )}%`
                    }}
                  >
                    <span className="bg-rose-500 text-white font-mono-numbers text-[9px] font-bold px-1.5 py-0.2 rounded shadow-xs">
                      Takt: {metrics.pitchTimeSeconds}s
                    </span>
                  </div>
                )}

                {operations.map((op, idx) => {
                  const maxCT = pitchAnalysis.maxCycleTimeSec * 1.25 || 50;
                  const barHeightPct = Math.min(100, Math.max(8, (op.cycleTimeSec / maxCT) * 100));
                  const isBottleneck = op.pitchStatus === 'bottleneck';
                  const isUnderloaded = op.pitchStatus === 'underloaded';

                  return (
                    <div
                      key={op.id}
                      className="flex-1 min-w-[28px] max-w-[50px] flex flex-col items-center h-full justify-end group relative cursor-pointer"
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute -top-12 z-30 hidden group-hover:flex flex-col items-center bg-[#17343a] text-white p-1.5 rounded text-[10px] whitespace-nowrap shadow-lg">
                        <span className="font-bold">Op #{op.opNo}: {op.name}</span>
                        <span className="font-mono-numbers">
                          CT: {op.cycleTimeSec}s ({op.operators} ops) • {op.machineType}
                        </span>
                      </div>

                      {/* Value tag on top of bar */}
                      <span className="text-[9px] font-mono-numbers font-bold text-[#527078] mb-1 group-hover:text-[#17343a]">
                        {op.cycleTimeSec}s
                      </span>

                      {/* Bar fill */}
                      <div
                        className={`w-full rounded-t-md transition-all ${
                          isBottleneck
                            ? 'bg-amber-500 group-hover:bg-amber-600'
                            : isUnderloaded
                            ? 'bg-sky-400 group-hover:bg-sky-500'
                            : 'bg-[#176f78] group-hover:bg-[#125860]'
                        }`}
                        style={{ height: `${barHeightPct}%` }}
                      />

                      {/* Operation number tag */}
                      <span className="text-[10px] font-mono-numbers font-bold text-[#17343a] mt-1.5">
                        #{op.opNo}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Operations Balancing & Machine Allocation List */}
          <div className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-base font-bold uppercase text-[#17343a]">
                  Operation Sequence & Cycle Time Matrix
                </h3>
                <p className="text-xs text-[#527078]">
                  Adjust operators to simulate workstation cycle time impact
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-[#e7e1d5] text-[#527078]">
                    <th className="py-2.5 px-2 text-center font-bold">#</th>
                    <th className="py-2.5 px-3 font-bold">Operation Description</th>
                    <th className="py-2.5 px-3 font-bold">Machine Type</th>
                    <th className="py-2.5 px-2 text-center font-bold">SMV (Sec)</th>
                    <th className="py-2.5 px-2 text-center font-bold">Allocated Ops</th>
                    <th className="py-2.5 px-2 text-center font-bold">Cycle Time</th>
                    <th className="py-2.5 px-3 font-bold">Folder / Jig</th>
                    <th className="py-2.5 px-2 text-center font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e7e1d5]/60 font-mono-numbers">
                  {operations.map(op => {
                    const isBottleneck = op.pitchStatus === 'bottleneck';

                    return (
                      <tr
                        key={op.id}
                        className={`hover:bg-white/70 transition-colors ${
                          isBottleneck ? 'bg-amber-50/60' : ''
                        }`}
                      >
                        <td className="py-2.5 px-2 text-center font-bold text-[#17343a]">
                          {op.opNo}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-[#17343a] font-sans">
                          {op.name}
                        </td>
                        <td className="py-2.5 px-3 text-[#527078] font-sans">
                          {op.machineType}
                        </td>
                        <td className="py-2.5 px-2 text-center text-[#17343a] font-bold">
                          {op.smvSec}s
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpOperatorChange(op.id, -1)}
                              className="w-5 h-5 rounded bg-white border border-[#d9d2c2] flex items-center justify-center text-xs font-bold hover:bg-[#f1eee6]"
                            >
                              -
                            </button>
                            <span className="font-bold text-[#17343a]">{op.operators}</span>
                            <button
                              onClick={() => handleOpOperatorChange(op.id, 1)}
                              className="w-5 h-5 rounded bg-white border border-[#d9d2c2] flex items-center justify-center text-xs font-bold hover:bg-[#f1eee6]"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-center font-bold text-[#17343a]">
                          {op.cycleTimeSec}s
                        </td>
                        <td className="py-2.5 px-3 text-[#527078] font-sans">
                          {op.folderOrAttachment || 'Standard Guide'}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-sans ${
                              isBottleneck
                                ? 'bg-amber-100 text-amber-800'
                                : op.pitchStatus === 'underloaded'
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {op.pitchStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Interactive Production Flow & Bundle Movement Stepper */}
          <div className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-display text-base font-bold uppercase text-[#17343a]">
                  Floor Production Flow & WIP Buffer Stepper
                </h3>
                <p className="text-xs text-[#527078]">
                  Simulates progressive garment bundles passing through the sewing line
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFlowSimRunning(prev => !prev)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                    isFlowSimRunning
                      ? 'bg-amber-600 text-white hover:bg-amber-700'
                      : 'bg-[#176f78] text-white hover:bg-[#125860]'
                  }`}
                >
                  {isFlowSimRunning ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pause Flow</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>Start Flow Simulation</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setIsFlowSimRunning(false);
                    setSimCompletedPcs(0);
                    setFlowWipBuffer({});
                  }}
                  className="p-1.5 rounded-lg border border-[#d9d2c2] bg-white text-[#527078] hover:bg-[#f1eee6]"
                  title="Reset Flow"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Stepper Flow Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
              <div className="p-3 rounded-xl bg-white border border-[#d9d2c2]">
                <span className="text-[10px] font-bold text-[#527078] uppercase">1. Cutting Buffer</span>
                <div className="font-mono-numbers text-lg font-black text-[#17343a] mt-1">
                  120 pcs
                </div>
                <span className="text-[10px] text-emerald-700 font-medium">Staged & Tagged</span>
              </div>

              <div className="p-3 rounded-xl bg-white border border-[#d9d2c2]">
                <span className="text-[10px] font-bold text-[#527078] uppercase">2. Pre-Assembly</span>
                <div className="font-mono-numbers text-lg font-black text-[#17343a] mt-1">
                  {flowWipBuffer['op-1'] || 14} pcs
                </div>
                <span className="text-[10px] text-[#527078] font-medium">Tape & Rib Loops</span>
              </div>

              <div className="p-3 rounded-xl bg-white border border-[#d9d2c2]">
                <span className="text-[10px] font-bold text-[#527078] uppercase">3. Neck & Collar</span>
                <div className="font-mono-numbers text-lg font-black text-[#17343a] mt-1">
                  {flowWipBuffer['op-4'] || 18} pcs
                </div>
                <span className="text-[10px] text-amber-700 font-medium">Overlock Cylinder</span>
              </div>

              <div className="p-3 rounded-xl bg-white border border-[#d9d2c2]">
                <span className="text-[10px] font-bold text-[#527078] uppercase">4. Sleeve & Side</span>
                <div className="font-mono-numbers text-lg font-black text-[#17343a] mt-1">
                  {flowWipBuffer['op-8'] || 22} pcs
                </div>
                <span className="text-[10px] text-[#527078] font-medium">Body Construction</span>
              </div>

              <div className="p-3 rounded-xl bg-white border border-[#d9d2c2]">
                <span className="text-[10px] font-bold text-[#527078] uppercase">5. Hemming / Close</span>
                <div className="font-mono-numbers text-lg font-black text-[#17343a] mt-1">
                  {flowWipBuffer['op-10'] || 12} pcs
                </div>
                <span className="text-[10px] text-[#527078] font-medium">Flatlock Hemmer</span>
              </div>

              <div className="p-3 rounded-xl bg-white border border-[#176f78] bg-[#dceceb]/30">
                <span className="text-[10px] font-bold text-[#176f78] uppercase">6. End-Line QC</span>
                <div className="font-mono-numbers text-lg font-black text-[#176f78] mt-1">
                  {simCompletedPcs} pcs
                </div>
                <span className="text-[10px] text-emerald-700 font-bold">Passed Inspection</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: MANPOWER WORKING HOURS & MINUTES BALANCING ENGINE              */}
      {/* ========================================================================= */}
      {activeSubTab === 'manpower-balancing' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Minute Balancing Overview Card */}
          <div className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#dceceb] text-[#176f78]">
                  IE Labor Economics Engine
                </span>
                <h3 className="font-display text-lg sm:text-xl font-bold uppercase text-[#17343a] mt-1">
                  Manpower Working Hours & Minute Utilization Balance
                </h3>
                <p className="text-xs text-[#527078] mt-0.5">
                  Analyze gross available man-minutes vs. standard earned minutes and eliminate non-productive balance losses.
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-[#527078] block">Weighted Skill Rating</span>
                <span className="font-mono-numbers text-2xl font-black text-[#176f78]">
                  {(parseFloat(minuteBalancing.avgSkillIndex) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>

          {/* 3-Column Detailed Minutes Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Column 1: Shift Time Deductions */}
            <div className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#e7e1d5]">
                <h4 className="font-bold text-xs uppercase text-[#17343a]">1. Shift Duration & Deductions</h4>
                <span className="text-[10px] font-mono-numbers text-[#527078]">
                  {minuteBalancing.grossMinutes}m Gross
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[#527078]">Morning Top 5 Meeting:</span>
                    <span className="font-mono-numbers font-bold text-[#17343a]">{morningBriefingMins} mins</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={25}
                    step={5}
                    value={morningBriefingMins}
                    onChange={e => setMorningBriefingMins(parseInt(e.target.value))}
                    className="w-full accent-[#176f78] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[#527078]">Tea & Fatigue Break:</span>
                    <span className="font-mono-numbers font-bold text-[#17343a]">{teaBreakMins} mins</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={30}
                    step={5}
                    value={teaBreakMins}
                    onChange={e => setTeaBreakMins(parseInt(e.target.value))}
                    className="w-full accent-[#176f78] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[#527078]">End-Shift 5S Clean-up:</span>
                    <span className="font-mono-numbers font-bold text-[#17343a]">{cleanUpMins} mins</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={20}
                    step={5}
                    value={cleanUpMins}
                    onChange={e => setCleanUpMins(parseInt(e.target.value))}
                    className="w-full accent-[#176f78] cursor-pointer"
                  />
                </div>

                <div className="pt-2 border-t border-[#e7e1d5] flex justify-between font-bold">
                  <span className="text-[#17343a]">Net Productive Mins / Operator:</span>
                  <span className="font-mono-numbers text-[#176f78] text-sm">
                    {minuteBalancing.netWorkingMinutes} min
                  </span>
                </div>
              </div>
            </div>

            {/* Column 2: Manpower & Absenteeism */}
            <div className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#e7e1d5]">
                <h4 className="font-bold text-xs uppercase text-[#17343a]">2. Manpower & Absenteeism</h4>
                <span className="text-[10px] font-mono-numbers text-[#527078]">
                  {minuteBalancing.totalManpower} MP Total
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[#527078]">Floor Absenteeism Rate:</span>
                    <span className="font-mono-numbers font-bold text-rose-700">{absenteeismRate}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={20}
                    step={0.5}
                    value={absenteeismRate}
                    onChange={e => setAbsenteeismRate(parseFloat(e.target.value))}
                    className="w-full accent-rose-600 cursor-pointer"
                  />
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-[#e7e1d5] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#527078]">Effective Present Workers:</span>
                    <span className="font-mono-numbers font-bold text-emerald-700">
                      {minuteBalancing.effectivePresentManpower} persons
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#527078]">Estimated Absent Workers:</span>
                    <span className="font-mono-numbers font-bold text-rose-700">
                      {minuteBalancing.absentManpower} persons
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#e7e1d5] flex justify-between font-bold">
                  <span className="text-[#17343a]">Effective Available Man-Mins:</span>
                  <span className="font-mono-numbers text-[#176f78] text-sm">
                    {(minuteBalancing.totalAvailableManMinutes ?? 0).toLocaleString()} min
                  </span>
                </div>
              </div>
            </div>

            {/* Column 3: Skill Matrix & Labor Balance */}
            <div className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#e7e1d5]">
                <h4 className="font-bold text-xs uppercase text-[#17343a]">3. Skill Matrix & Lost Minutes</h4>
                <span className="text-[10px] font-mono-numbers text-[#527078]">
                  Grade Ratio
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[#527078]">Grade A (Top Stitchers &gt;90%):</span>
                    <span className="font-mono-numbers font-bold text-[#17343a]">{gradeAPct}%</span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={80}
                    step={5}
                    value={gradeAPct}
                    onChange={e => setGradeAPct(parseInt(e.target.value))}
                    className="w-full accent-[#176f78] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[#527078]">Grade B (Standard 75-89%):</span>
                    <span className="font-mono-numbers font-bold text-[#17343a]">{gradeBPct}%</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={60}
                    step={5}
                    value={gradeBPct}
                    onChange={e => setGradeBPct(parseInt(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                <div className="pt-2 border-t border-[#e7e1d5] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#527078]">Earned Standard Minutes:</span>
                    <span className="font-mono-numbers font-bold text-[#17343a]">
                      {(minuteBalancing.standardEarnedMinutes ?? 0).toLocaleString()} min
                    </span>
                  </div>
                  <div className="flex justify-between text-rose-700 font-bold">
                    <span>Balance Loss Minutes:</span>
                    <span className="font-mono-numbers">
                      -{(minuteBalancing.balanceLossMinutes ?? 0).toLocaleString()} min
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Man-Minute Balance Sheet Table */}
          <div className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] p-5 shadow-xs">
            <h4 className="font-display text-base font-bold uppercase text-[#17343a] mb-3">
              Comprehensive Shift Minutes Balance Statement
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-[#e7e1d5] text-[#527078]">
                    <th className="py-2.5 px-3 font-bold">Minute Category</th>
                    <th className="py-2.5 px-3 font-bold">Calculation Formula</th>
                    <th className="py-2.5 px-2 text-center font-bold">Duration (Min)</th>
                    <th className="py-2.5 px-2 text-center font-bold">% of Gross</th>
                    <th className="py-2.5 px-3 font-bold">Industrial Engineering Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e7e1d5]/60 font-mono-numbers">
                  <tr className="hover:bg-white/60">
                    <td className="py-2.5 px-3 font-bold text-[#17343a] font-sans">Gross Clock Minutes</td>
                    <td className="py-2.5 px-3 text-[#527078] font-sans">Total MP × Gross Shift Hrs × 60</td>
                    <td className="py-2.5 px-2 text-center font-bold text-[#17343a]">
                      {(minuteBalancing.totalGrossAvailableMinutes ?? 0).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-2 text-center text-[#527078]">100.0%</td>
                    <td className="py-2.5 px-3 text-[#527078] font-sans">Total scheduled shift attendance capacity</td>
                  </tr>

                  <tr className="hover:bg-white/60">
                    <td className="py-2.5 px-3 font-bold text-amber-800 font-sans">Authorized Allowances</td>
                    <td className="py-2.5 px-3 text-[#527078] font-sans">Briefing + Tea Breaks + 5S Clean</td>
                    <td className="py-2.5 px-2 text-center font-bold text-amber-700">
                      {((minuteBalancing.nonProductiveAllowances ?? 0) * (minuteBalancing.totalManpower ?? 0)).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-2 text-center text-amber-700">
                      {(
                        (((minuteBalancing.nonProductiveAllowances ?? 0) * (minuteBalancing.totalManpower ?? 0)) /
                          (minuteBalancing.totalGrossAvailableMinutes || 1)) *
                        100
                      ).toFixed(1)}
                      %
                    </td>
                    <td className="py-2.5 px-3 text-[#527078] font-sans">Ergonomic recovery and operational alignment</td>
                  </tr>

                  <tr className="hover:bg-white/60">
                    <td className="py-2.5 px-3 font-bold text-emerald-800 font-sans">Standard Earned Minutes</td>
                    <td className="py-2.5 px-3 text-[#527078] font-sans">Achieved Production × Garment SMV</td>
                    <td className="py-2.5 px-2 text-center font-bold text-emerald-700">
                      {(minuteBalancing.standardEarnedMinutes ?? 0).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-2 text-center text-emerald-700">
                      {(
                        ((minuteBalancing.standardEarnedMinutes ?? 0) / (minuteBalancing.totalGrossAvailableMinutes || 1)) *
                        100
                      ).toFixed(1)}
                      %
                    </td>
                    <td className="py-2.5 px-3 text-[#527078] font-sans">Direct value-added sewing garment output</td>
                  </tr>

                  <tr className="hover:bg-white/60 bg-amber-50/40">
                    <td className="py-2.5 px-3 font-bold text-rose-800 font-sans">Line Balancing Loss</td>
                    <td className="py-2.5 px-3 text-[#527078] font-sans">Net Available Mins × (100% - Balance Eff%)</td>
                    <td className="py-2.5 px-2 text-center font-bold text-rose-700">
                      {(minuteBalancing.balanceLossMinutes ?? 0).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-2 text-center text-rose-700">
                      {pitchAnalysis.balanceLossPct}%
                    </td>
                    <td className="py-2.5 px-3 text-rose-800 font-sans font-medium">
                      Operator waiting waste caused by bottleneck stations
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 5: 6-DAY LEARNING CURVE RAMP-UP SIMULATOR                         */}
      {/* ========================================================================= */}
      {activeSubTab === 'learning-curve' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Real-Time KPI Result Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white border border-[#e7e1d5] border-l-[4px] border-l-[#176f78] shadow-2xs">
              <span className="text-[11px] font-bold text-[#527078] uppercase">6-Day Ramp Avg Eff</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-mono-numbers text-2xl sm:text-3xl font-black text-[#17343a]">
                  {sixDayLearningCurve.avgRampEff}%
                </span>
              </div>
              <span className="text-[10px] text-[#527078] font-medium mt-1 block">
                Steady Target: {targetEffPct}%
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#e7e1d5] border-l-[4px] border-l-emerald-600 shadow-2xs">
              <span className="text-[11px] font-bold text-[#527078] uppercase">Total 6-Day Output</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-mono-numbers text-2xl sm:text-3xl font-black text-emerald-800">
                  {(sixDayLearningCurve.total6DaysPcs ?? 0).toLocaleString()}
                </span>
                <span className="text-xs font-bold text-[#527078]">pcs</span>
              </div>
              <span className="text-[10px] text-emerald-700 font-bold mt-1 block">
                Day 1 ({sixDayLearningCurve.days[0]?.pcs ?? 0}p) → Day 6 ({sixDayLearningCurve.days[5]?.pcs ?? 0}p)
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#e7e1d5] border-l-[4px] border-l-amber-500 shadow-2xs">
              <span className="text-[11px] font-bold text-[#527078] uppercase">Ramp-Up Learning Loss</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-mono-numbers text-2xl sm:text-3xl font-black text-amber-700">
                  -{(sixDayLearningCurve.learningLossPcs ?? 0).toLocaleString()}
                </span>
                <span className="text-xs font-bold text-[#527078]">pcs</span>
              </div>
              <span className="text-[10px] text-amber-800 font-medium mt-1 block">
                {sixDayLearningCurve.learningLossHours} std earned hrs absorbed
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#e7e1d5] border-l-[4px] border-l-[#0c4a60] shadow-2xs">
              <span className="text-[11px] font-bold text-[#527078] uppercase">SMV Classification</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-display text-xl sm:text-2xl font-black text-[#17343a] capitalize">
                  {smvWeight}
                </span>
              </div>
              <span className="text-[10px] text-[#527078] font-medium mt-1 block">
                {smvMinutes.toFixed(2)} min ({smvWeight === 'light' ? '<30m' : smvWeight === 'medium' ? '31-60m' : '>60m'})
              </span>
            </div>
          </div>

          {/* Style Nature & 6-Day Period Controls Banner */}
          <div className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-base font-bold uppercase text-[#17343a]">
                  6-Day Learning Curve Period &amp; Style Nature Setup
                </h3>
                <p className="text-xs text-[#527078]">
                  Governed by Debonair Ltd. Unit - 02 Industrial Engineering Style Progression Table (Image 4)
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowSimProgressionModal(true)}
                className="px-3.5 py-2 rounded-xl bg-[#176f78] text-white font-bold text-xs flex items-center gap-2 shadow-xs hover:bg-[#125860] cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>View Full 40-Day Chart</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1.5">
                  Garment Style Nature
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSimStyleNature('new')}
                    className={`p-3 rounded-xl text-center font-bold text-xs transition-all cursor-pointer ${
                      simStyleNature === 'new'
                        ? 'bg-[#176f78] text-white shadow-xs'
                        : 'bg-white text-[#527078] hover:bg-[#f1eee6] border border-[#d9d2c2]'
                    }`}
                  >
                    New Style
                    <span className="block text-[10px] font-normal opacity-85 mt-0.5">Initial Line Feed</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSimStyleNature('repeat')}
                    className={`p-3 rounded-xl text-center font-bold text-xs transition-all cursor-pointer ${
                      simStyleNature === 'repeat'
                        ? 'bg-[#8c531b] text-white shadow-xs'
                        : 'bg-white text-[#527078] hover:bg-[#f1eee6] border border-[#d9d2c2]'
                    }`}
                  >
                    Repeat Style
                    <span className="block text-[10px] font-normal opacity-85 mt-0.5">&le; 3 Months Re-run</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1.5">
                  SMV Category
                </label>
                <div className="p-3 rounded-xl bg-white border border-[#d9d2c2] flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#17343a] capitalize text-xs block">{smvWeight} Weight</span>
                    <span className="text-[10px] text-[#527078]">
                      {smvWeight === 'light' ? '0 to 30 Min' : smvWeight === 'medium' ? '31 to 60 Min' : '> 61 Min'}
                    </span>
                  </div>
                  <span className="px-2 py-1 rounded bg-[#f1eee6] text-[#176f78] font-bold font-mono-numbers text-xs">
                    {smvMinutes.toFixed(2)} min
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1.5">
                  Simulated Line Manpower
                </label>
                <div className="p-3 rounded-xl bg-white border border-[#d9d2c2] flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#17343a] text-xs block">{metrics.totalManpower} Workers</span>
                    <span className="text-[10px] text-[#527078]">{workingHours} hrs/shift ({(metrics.totalGrossAvailableMinutes ?? 0).toLocaleString()} min)</span>
                  </div>
                  <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-800 font-bold font-mono-numbers text-xs">
                    {operators} Ops + {helpers} Hlp
                  </span>
                </div>
              </div>
            </div>

            {/* Standard Rule Callout from Image 4 */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#fff8e8] border border-[#f5e0b0] text-xs text-[#8c531b]">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong>Debonair IE Rule:</strong> "01. If any style input starts again within 3 months, it will be considered as repeat style." Repeat styles feature a higher Day 1 target (+5% boost) due to operator process familiarity. The standard learning curve ramp-up period is exactly <strong>6 days</strong>.
              </div>
            </div>
          </div>

          {/* 6-Day Period Progression Visual Chart */}
          <div className="rounded-2xl border border-[#d9d2c2] bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-display text-sm font-bold uppercase text-[#17343a] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#176f78]" />
                <span>6-Day Daily Ramp-Up Efficiency Curve</span>
              </h4>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-[#527078]">Style Nature: <strong className="text-[#17343a] capitalize">{simStyleNature} Style</strong></span>
                <span className="text-[#527078]">Category: <strong className="text-[#176f78] capitalize">{smvWeight}</strong></span>
              </div>
            </div>

            {/* Visual Bar Grid */}
            <div className="grid grid-cols-6 gap-2 pt-3 border-t border-[#e7e1d5]">
              {sixDayLearningCurve.days.map(d => {
                const barHeight = Math.round((d.targetEff / 75) * 100);
                return (
                  <div key={d.dayNum} className="p-3 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2] flex flex-col items-center justify-between">
                    <span className="text-xs font-bold text-[#17343a]">{d.day}</span>
                    <div className="w-full h-32 flex items-end justify-center py-2">
                      <div
                        style={{ height: `${barHeight}%` }}
                        className="w-8 sm:w-12 bg-gradient-to-t from-[#176f78] to-[#2ca0ac] rounded-t-md transition-all shadow-xs flex items-center justify-center"
                      >
                        <span className="text-[10px] text-white font-bold font-mono-numbers">
                          {d.targetEff}%
                        </span>
                      </div>
                    </div>
                    <div className="text-center">
                      <span className="font-mono-numbers font-bold text-xs text-[#17343a] block">
                        {d.pcs} pcs
                      </span>
                      <span className="text-[10px] text-[#527078]">
                        {Math.round(d.pcs / workingHours)} pcs/h
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 6-Day Detailed Ramp Simulation Table */}
          <div className="rounded-2xl border border-[#d9d2c2] bg-white overflow-hidden shadow-xs">
            <div className="p-4 bg-[#f1eee6] border-b border-[#d9d2c2] flex items-center justify-between">
              <div>
                <h4 className="font-display text-sm font-bold uppercase text-[#17343a]">
                  6-Day Floor Execution Ramp Plan
                </h4>
                <p className="text-xs text-[#527078]">
                  Daily target efficiency, production output, and industrial engineering pacing notes
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#176f78] text-white font-mono-numbers">
                Target: {metrics.targetProductionPcs} pcs/day
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-center border-collapse">
                <thead className="bg-[#fbfaf6] border-b border-[#e7e1d5] text-[11px] font-bold text-[#527078]">
                  <tr>
                    <th className="p-3 border-r border-[#e7e1d5] text-left">Period Day</th>
                    <th className="p-3 border-r border-[#e7e1d5] bg-[#eef7f7] text-[#176f78]">Target Efficiency %</th>
                    <th className="p-3 border-r border-[#e7e1d5] bg-[#eef7f7] text-[#176f78]">Daily Output (Pcs)</th>
                    <th className="p-3 border-r border-[#e7e1d5]">Hourly Pace</th>
                    <th className="p-3 border-r border-[#e7e1d5]">Cumulative Pcs</th>
                    <th className="p-3 text-left">Industrial Engineering Floor Focus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e7e1d5]">
                  {sixDayLearningCurve.days.map((d, i) => {
                    const cumulative = sixDayLearningCurve.days.slice(0, i + 1).reduce((sum, item) => sum + item.pcs, 0);
                    return (
                      <tr key={d.dayNum} className="hover:bg-[#fbfaf6]">
                        <td className="p-3 border-r border-[#e7e1d5] font-bold text-[#17343a] text-left">
                          {d.day}
                        </td>
                        <td className="p-3 border-r border-[#e7e1d5] font-mono-numbers font-bold text-base text-[#176f78] bg-[#eef7f7]/30">
                          {d.targetEff}%
                        </td>
                        <td className="p-3 border-r border-[#e7e1d5] font-mono-numbers font-bold text-sm text-[#17343a] bg-[#eef7f7]/30">
                          {d.pcs} pcs
                        </td>
                        <td className="p-3 border-r border-[#e7e1d5] font-mono-numbers text-[#527078]">
                          {Math.round(d.pcs / workingHours)} pcs/hr
                        </td>
                        <td className="p-3 border-r border-[#e7e1d5] font-mono-numbers font-bold text-emerald-800">
                          {(cumulative ?? 0).toLocaleString()} pcs
                        </td>
                        <td className="p-3 text-left text-[#527078]">
                          {d.note}
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

      {/* ========================================================================= */}
      {/* MODAL: APPLY SIMULATION TO FLOOR LINE                                     */}
      {/* ========================================================================= */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-[#d9d2c2] shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#e7e1d5]">
              <div className="flex items-center gap-2">
                <Workflow className="w-5 h-5 text-[#176f78]" />
                <h3 className="font-display text-lg font-bold uppercase text-[#17343a]">
                  Apply Simulated Setup to Floor Line
                </h3>
              </div>
              <button
                onClick={() => setShowApplyModal(false)}
                className="w-7 h-7 rounded-full bg-[#f1eee6] text-[#527078] hover:text-[#17343a] flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-[#527078]">
                This will deploy the simulated Industrial Engineering parameters directly into the live production floor telemetry:
              </p>

              <div className="p-3 rounded-xl bg-[#f1eee6] space-y-1.5 font-mono-numbers">
                <div className="flex justify-between">
                  <span className="font-sans text-[#527078]">Style & Buyer:</span>
                  <span className="font-bold text-[#17343a]">{styleName} ({buyer})</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-sans text-[#527078]">Standard Minute Value (SMV):</span>
                  <span className="font-bold text-[#176f78]">{smvMinutes.toFixed(2)} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-sans text-[#527078]">Daily Target Output:</span>
                  <span className="font-bold text-emerald-700">{metrics.targetProductionPcs} pcs</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-sans text-[#527078]">Planned Manpower:</span>
                  <span className="font-bold text-[#17343a]">{metrics.totalManpower} workers</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-sans text-[#527078]">Pitch Time Benchmark:</span>
                  <span className="font-bold text-amber-700">{metrics.pitchTimeSeconds} sec</span>
                </div>
              </div>

              <div>
                <label className="font-bold text-[#17343a] block mb-1.5 uppercase tracking-wide">
                  Select Target Production Line:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {lines.map(line => (
                    <button
                      key={line.lineNo}
                      onClick={() => setSelectedTargetLineNo(line.lineNo)}
                      className={`p-2 rounded-xl text-center font-bold transition-all cursor-pointer ${
                        selectedTargetLineNo === line.lineNo
                          ? 'bg-[#176f78] text-white shadow-xs'
                          : 'bg-[#f1eee6] text-[#17343a] hover:bg-[#e7e1d5]'
                      }`}
                    >
                      Line {line.lineNo}
                    </button>
                  ))}
                  <button
                    onClick={() => setSelectedTargetLineNo('New Line 25')}
                    className={`p-2 rounded-xl text-center font-bold transition-all cursor-pointer ${
                      selectedTargetLineNo === 'New Line 25'
                        ? 'bg-[#176f78] text-white shadow-xs'
                        : 'bg-white border border-dashed border-[#176f78] text-[#176f78]'
                    }`}
                  >
                    + New Line
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#e7e1d5] flex items-center justify-end gap-2">
              <button
                onClick={() => setShowApplyModal(false)}
                className="px-4 py-2 rounded-xl border border-[#d9d2c2] text-xs font-bold text-[#527078] hover:bg-[#f1eee6]"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteApplyToLine}
                className="px-5 py-2 rounded-xl bg-[#176f78] hover:bg-[#125860] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Confirm & Apply to Floor</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EXPORTABLE / PRINTABLE IE TECHNICAL LINE SETUP SHEET              */}
      {/* ========================================================================= */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn">
          <div className="w-full max-w-3xl rounded-2xl bg-white border border-[#d9d2c2] shadow-2xl p-6 sm:p-8 space-y-6 my-8">
            {/* Modal Actions Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#e7e1d5] print:hidden">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[#176f78]" />
                <h3 className="font-display text-lg font-bold uppercase text-[#17343a]">
                  IE Technical Line Setup & Handoff Sheet
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-lg bg-[#176f78] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-[#125860]"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="w-7 h-7 rounded-full bg-[#f1eee6] text-[#527078] hover:text-[#17343a] flex items-center justify-center font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Document Body */}
            <div className="space-y-6 text-xs text-[#17343a]">
              {/* Document Header */}
              <div className="flex items-start justify-between pb-4 border-b-2 border-[#17343a]">
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight text-[#17343a]">
                    INDUSTRIAL ENGINEERING DEPARTMENT
                  </h2>
                  <p className="text-xs text-[#527078] font-bold">
                    Garment Manufacturing Division • Technical Line Setup & Balance Sheet
                  </p>
                </div>
                <div className="text-right font-mono-numbers">
                  <div className="font-bold text-sm">DOC REF: IE-LS-{new Date().getFullYear()}-0917</div>
                  <div className="text-[#527078]">Date: {new Date().toLocaleDateString()}</div>
                </div>
              </div>

              {/* Style Specification Meta Table */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-[#f1eee6] font-mono-numbers">
                <div>
                  <span className="text-[10px] text-[#527078] block font-sans">Buyer:</span>
                  <span className="font-bold text-sm">{buyer}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#527078] block font-sans">Style Code:</span>
                  <span className="font-bold text-sm">{styleName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#527078] block font-sans">Garment SMV:</span>
                  <span className="font-bold text-sm">{smvMinutes.toFixed(2)} mins</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#527078] block font-sans">Target Output:</span>
                  <span className="font-bold text-sm text-[#176f78]">{metrics.targetProductionPcs} pcs/day</span>
                </div>
              </div>

              {/* Summary Metrics Strip */}
              <div className="grid grid-cols-3 gap-3 p-3 border border-[#d9d2c2] rounded-xl font-mono-numbers text-center">
                <div>
                  <span className="text-[10px] text-[#527078] block font-sans">Pitch Time (Takt):</span>
                  <span className="font-black text-sm">{metrics.pitchTimeSeconds}s</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#527078] block font-sans">Line Balancing Eff:</span>
                  <span className="font-black text-sm text-emerald-700">{pitchAnalysis.lineBalanceEfficiencyPct}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#527078] block font-sans">Allocated Manpower:</span>
                  <span className="font-black text-sm">{metrics.totalManpower} ({operators} Ops + {helpers} Hlp)</span>
                </div>
              </div>

              {/* Operations Table */}
              <div>
                <h4 className="font-bold uppercase mb-2">Operation Sequence & Workstations</h4>
                <table className="w-full text-[11px] border border-[#d9d2c2] text-left">
                  <thead className="bg-[#f1eee6] font-bold border-b border-[#d9d2c2]">
                    <tr>
                      <th className="p-1.5 text-center">#</th>
                      <th className="p-1.5">Operation Description</th>
                      <th className="p-1.5">Machine Classification</th>
                      <th className="p-1.5 text-center">SMV</th>
                      <th className="p-1.5 text-center">Ops</th>
                      <th className="p-1.5 text-center">Cycle Time</th>
                      <th className="p-1.5">Folder / Jig Spec</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e7e1d5] font-mono-numbers">
                    {operations.map(op => (
                      <tr key={op.id}>
                        <td className="p-1.5 text-center font-bold">{op.opNo}</td>
                        <td className="p-1.5 font-sans font-bold">{op.name}</td>
                        <td className="p-1.5 font-sans text-[#527078]">{op.machineType}</td>
                        <td className="p-1.5 text-center">{op.smvSec}s</td>
                        <td className="p-1.5 text-center font-bold">{op.operators}</td>
                        <td className="p-1.5 text-center font-bold">{op.cycleTimeSec}s</td>
                        <td className="p-1.5 font-sans text-[#527078]">{op.folderOrAttachment || 'Standard'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 4-Way Technical Signatures Footer */}
              <div className="pt-6 border-t-2 border-[#17343a] grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="border-t border-[#527078] pt-1">
                  <div className="font-bold">Line Industrial Engineer</div>
                  <div className="text-[10px] text-[#527078]">{profile.name}</div>
                  <div className="text-[9px] text-emerald-700 font-bold mt-1">APPROVED ✓</div>
                </div>
                <div className="border-t border-[#527078] pt-1">
                  <div className="font-bold">Production Supervisor</div>
                  <div className="text-[10px] text-[#527078]">Rafiqul Islam</div>
                  <div className="text-[9px] text-emerald-700 font-bold mt-1">APPROVED ✓</div>
                </div>
                <div className="border-t border-[#527078] pt-1">
                  <div className="font-bold">Maintenance Mechanic</div>
                  <div className="text-[10px] text-[#527078]">Kabir Ahmed</div>
                  <div className="text-[9px] text-emerald-700 font-bold mt-1">APPROVED ✓</div>
                </div>
                <div className="border-t border-[#527078] pt-1">
                  <div className="font-bold">Floor QA Manager</div>
                  <div className="text-[10px] text-[#527078]">Nasreen Akter</div>
                  <div className="text-[9px] text-emerald-700 font-bold mt-1">APPROVED ✓</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Style Progression Chart Modal */}
      <StyleProgressionModal
        isOpen={showSimProgressionModal}
        onClose={() => setShowSimProgressionModal(false)}
        activeSMVWeight={smvWeight}
        activeStyleNature={simStyleNature}
      />
    </div>
  );
};

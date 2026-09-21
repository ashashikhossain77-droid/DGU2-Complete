/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Layers,
  Save,
  Plus,
  TrendingUp,
  AlertTriangle,
  Users,
  Clock,
  Sparkles,
  CheckCircle2,
  FileText,
  Sliders,
  Activity,
  Calendar,
  Info,
  Check,
  Flame,
  ArrowUpRight,
  Percent,
  Timer,
  Target,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trash2,
  X,
  Search,
  Building2,
  Upload,
  Download,
  RefreshCw
} from 'lucide-react';
import { LineEntry, StyleNature, SMVWeight, LearningCurveDayRecord, BalancingLossAnalysis, BuildUpCurve } from '../types';
import { calculateLineMetrics } from '../utils';
import {
  getSMVWeight,
  getProgressionTargetEff,
  generateLineLearningCurve,
  calculateBalancingLossAnalysis
} from '../data/learningCurveMatrix';
import { StyleProgressionModal } from './StyleProgressionModal';
import { TelemetryImportModal } from './TelemetryImportModal';
import { generateTelemetryCSV, downloadTelemetryCSV } from '../utils/telemetryCsv';

export type LineSortCriterion = 'lineNo' | 'efficiency' | 'wip';
export type SortDirection = 'asc' | 'desc';

interface LineDataProps {
  lines: LineEntry[];
  selectedLineNo: string;
  onSelectLineNo: (lineNo: string) => void;
  onSaveLine: (line: LineEntry) => void;
  onAddNewLine?: (customLine?: LineEntry | Partial<LineEntry>) => void;
  onDeleteLine?: (identifier: string | number) => void;
  onDeleteFloor?: (floorName: string, mode: 'delete_all_lines' | 'reassign', targetFloor?: string) => void;
  onNavigate?: (tab: string) => void;
  activeDate?: string;
  onSelectDate?: (date: string) => void;
}

export const LineData: React.FC<LineDataProps> = ({
  lines,
  selectedLineNo,
  onSelectLineNo,
  onSaveLine,
  onAddNewLine,
  onDeleteLine,
  onDeleteFloor,
  onNavigate,
  activeDate,
  onSelectDate
}) => {
  const [filterDate, setFilterDate] = useState<string>(activeDate || 'all');
  const [selectedFloorFilter, setSelectedFloorFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<LineSortCriterion>('lineNo');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Modals & Notifications
  const [isAddLineModalOpen, setIsAddLineModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [lineToDelete, setLineToDelete] = useState<LineEntry | null>(null);
  const [isDirectoryModalOpen, setIsDirectoryModalOpen] = useState(false);
  const [directorySearch, setDirectorySearch] = useState('');
  const [isFloorManagerOpen, setIsFloorManagerOpen] = useState(false);
  const [floorManagerSearch, setFloorManagerSearch] = useState('');
  const [isDeleteFloorModalOpen, setIsDeleteFloorModalOpen] = useState(false);
  const [floorToDelete, setFloorToDelete] = useState<{
    name: string;
    lines: LineEntry[];
    totalOutput: number;
    totalMP: number;
    avgEff: number;
    totalWip: number;
  } | null>(null);
  const [deleteFloorMode, setDeleteFloorMode] = useState<'delete_all_lines' | 'reassign'>('delete_all_lines');
  const [reassignTargetFloor, setReassignTargetFloor] = useState<string>('');
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  const showToastNotification = (msg: string) => {
    setToastNotification(msg);
    setTimeout(() => setToastNotification(null), 3500);
  };

  // Add Line Form State
  const [addLineNo, setAddLineNo] = useState('');
  const [addFloor, setAddFloor] = useState('Padma Floor');
  const [addBuyer, setAddBuyer] = useState('H&M');
  const [addStyle, setAddStyle] = useState('Polo Shirt Classic');
  const [addSmv, setAddSmv] = useState('14.50');
  const [addWorkingHours, setAddWorkingHours] = useState('8.0');
  const [addTargetEff, setAddTargetEff] = useState('85');
  const [addOperators, setAddOperators] = useState('28');
  const [addHelpers, setAddHelpers] = useState('6');
  const [addIronMan, setAddIronMan] = useState('2');
  const [addWip, setAddWip] = useState('200');
  const [addRemarks, setAddRemarks] = useState('Commissioned sewing line');

  // Available unique dates
  const availableDates = React.useMemo(() => {
    const set = new Set<string>();
    lines.forEach(l => {
      if (l.date) set.add(l.date);
    });
    return Array.from(set).sort().reverse();
  }, [lines]);

  // Aggregated Floors / Units breakdown
  const floorList = React.useMemo(() => {
    const map = new Map<string, {
      name: string;
      lines: LineEntry[];
      totalOutput: number;
      totalTarget: number;
      totalWip: number;
      totalMP: number;
    }>();

    lines.forEach(l => {
      const fl = (l.floor || 'Padma Floor').trim();
      if (!map.has(fl)) {
        map.set(fl, {
          name: fl,
          lines: [],
          totalOutput: 0,
          totalTarget: 0,
          totalWip: 0,
          totalMP: 0
        });
      }
      const data = map.get(fl)!;
      data.lines.push(l);
      data.totalOutput += l.achievedProd || 0;
      data.totalTarget += l.targetProd || 0;
      data.totalWip += l.wip || 0;
      data.totalMP += l.plannedMP || 0;
    });

    return Array.from(map.values())
      .map(f => ({
        ...f,
        avgEfficiency: f.lines.length > 0
          ? Math.round(f.lines.reduce((acc, l) => acc + (l.efficiency || 0), 0) / f.lines.length)
          : 0
      }))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  }, [lines]);

  const filteredLines = React.useMemo(() => {
    let result = lines;
    if (filterDate && filterDate !== 'all') {
      const dateMatches = result.filter(l => l.date === filterDate);
      if (dateMatches.length > 0) result = dateMatches;
    }
    if (selectedFloorFilter && selectedFloorFilter !== 'all') {
      const floorMatches = result.filter(l => (l.floor || '').trim().toLowerCase() === selectedFloorFilter.trim().toLowerCase());
      if (floorMatches.length > 0) result = floorMatches;
    }
    return result;
  }, [lines, filterDate, selectedFloorFilter]);

  // Sorted Lines computation
  const sortedLines = React.useMemo(() => {
    return [...filteredLines].sort((a, b) => {
      if (sortBy === 'efficiency') {
        const effA = a.efficiency ?? 0;
        const effB = b.efficiency ?? 0;
        if (effA !== effB) {
          return sortDirection === 'desc' ? effB - effA : effA - effB;
        }
      } else if (sortBy === 'wip') {
        const wipA = a.wip ?? 0;
        const wipB = b.wip ?? 0;
        if (wipA !== wipB) {
          return sortDirection === 'desc' ? wipB - wipA : wipA - wipB;
        }
      }

      // Default or secondary sort: Line Number
      const numA = parseInt(a.lineNo.replace(/\D/g, ''), 10);
      const numB = parseInt(b.lineNo.replace(/\D/g, ''), 10);
      if (!isNaN(numA) && !isNaN(numB) && numA !== numB) {
        return sortBy === 'lineNo' && sortDirection === 'desc' ? numB - numA : numA - numB;
      }
      return sortBy === 'lineNo' && sortDirection === 'desc'
        ? b.lineNo.localeCompare(a.lineNo, undefined, { numeric: true })
        : a.lineNo.localeCompare(b.lineNo, undefined, { numeric: true });
    });
  }, [filteredLines, sortBy, sortDirection]);

  const currentLine = filteredLines.find(l => l.lineNo === selectedLineNo) || lines.find(l => l.lineNo === selectedLineNo) || lines[0];

  const handleOpenAddLineModal = () => {
    const nextNumericLine = lines.reduce((max, l) => {
      const num = parseInt(l.lineNo.replace(/\D/g, ''), 10);
      return !isNaN(num) && num > max ? num : max;
    }, 0);
    setAddLineNo(String(nextNumericLine > 0 ? nextNumericLine + 1 : lines.length + 1));
    if (currentLine) {
      setAddFloor(currentLine.floor || 'Padma Floor');
      setAddBuyer(currentLine.buyer || 'H&M');
      setAddStyle(currentLine.style || 'Polo Shirt Classic');
    }
    setIsAddLineModalOpen(true);
  };

  const handleCreateLineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanLineNo = addLineNo.replace(/line\s*/i, '').trim();
    if (!cleanLineNo) {
      alert('Please provide a valid line number.');
      return;
    }

    const smvVal = parseFloat(addSmv) || 14.5;
    const hoursVal = parseFloat(addWorkingHours) || 8.0;
    const targetEffVal = parseFloat(addTargetEff) || 85.0;
    const opVal = parseInt(addOperators, 10) || 28;
    const helpVal = parseInt(addHelpers, 10) || 6;
    const ironVal = parseInt(addIronMan, 10) || 2;
    const totalMP = opVal + helpVal + ironVal;
    const totalAvailMin = totalMP * hoursVal * 60;
    const targetProdVal = Math.round((totalAvailMin / smvVal) * (targetEffVal / 100));

    const newLine: LineEntry = {
      id: Date.now(),
      date: filterDate !== 'all' ? filterDate : (activeDate || '2026-09-17'),
      lineNo: cleanLineNo,
      floor: addFloor.trim() || 'Padma Floor',
      buyer: addBuyer.trim() || 'H&M',
      style: addStyle.trim() || 'Polo Shirt Classic',
      smv: smvVal,
      plannedMP: totalMP,
      workingHours: hoursVal,
      targetEff: targetEffVal,
      targetProd: targetProdVal,
      achievedProd: 0,
      efficiency: 0,
      remarks: addRemarks.trim() || 'Newly commissioned line setup',
      orderQty: 10000,
      dailyInput: targetProdVal,
      dailyOutput: 0,
      wip: parseInt(addWip, 10) || 200,
      balancingGraph: 'day1',
      nextStyle: '',
      nextStyleDate: '',
      mp: {
        Operator: { present: opVal, absent: 0 },
        Helper: { present: helpVal, absent: 0 },
        'Iron Man': { present: ironVal, absent: 0 }
      },
      balanceMethod: 'IE Line Balancing',
      balanceNotes: 'New line layout ramp-up',
      top5: {
        held: 'yes',
        attendance: 100,
        items: ['Initial machine inspection', 'Critical operation verification'],
        notes: 'Line setup complete'
      },
      bottleneck: {
        station: 'Main Assembly',
        cycleTime: Math.round(smvVal * 2.2),
        targetCT: Math.round(smvVal * 2.0),
        status: 'ok',
        action: 'Operator assigned and guide fixture calibrated'
      },
      timeStudy: {
        done: 'yes',
        type: 'both',
        observedRate: 110,
        standardRate: 120
      },
      buildUp: {
        day: '1',
        plannedPct: 50,
        achievedPct: 50,
        operators: totalMP
      },
      lineIE: {
        name: 'IE Lead',
        level: 'Senior IE',
        period: 'daily'
      }
    };

    if (onAddNewLine) {
      onAddNewLine(newLine);
    }
    onSelectLineNo(cleanLineNo);
    setIsAddLineModalOpen(false);
    showToastNotification(`Line ${cleanLineNo} created successfully!`);
  };

  const handleRequestDelete = (line: LineEntry) => {
    if (lines.length <= 1) {
      alert('Cannot delete: Factory requires at least one active sewing line.');
      return;
    }
    setLineToDelete(line);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!lineToDelete) return;
    const deletedNo = lineToDelete.lineNo;
    if (onDeleteLine) {
      onDeleteLine(deletedNo);
    }
    const remaining = sortedLines.filter(l => l.lineNo !== deletedNo);
    if (remaining.length > 0) {
      onSelectLineNo(remaining[0].lineNo);
    }
    setIsDeleteConfirmOpen(false);
    setLineToDelete(null);
    showToastNotification(`Line ${deletedNo} deleted successfully.`);
  };

  const handleRequestDeleteFloor = (floorName: string) => {
    const trimmed = floorName.trim();
    if (floorList.length <= 1) {
      alert(`Cannot delete floor "${floorName}": The factory requires at least one active production floor/unit.`);
      return;
    }

    const matchedLines = lines.filter(l => (l.floor || '').trim().toLowerCase() === trimmed.toLowerCase());
    const remainingFloors = floorList.filter(f => f.name.toLowerCase() !== trimmed.toLowerCase());

    setFloorToDelete({
      name: floorName,
      lines: matchedLines,
      totalOutput: matchedLines.reduce((acc, l) => acc + (l.achievedProd || 0), 0),
      totalMP: matchedLines.reduce((acc, l) => acc + (l.plannedMP || 0), 0),
      avgEff: matchedLines.length > 0 ? Math.round(matchedLines.reduce((acc, l) => acc + (l.efficiency || 0), 0) / matchedLines.length) : 0,
      totalWip: matchedLines.reduce((acc, l) => acc + (l.wip || 0), 0)
    });
    setDeleteFloorMode('delete_all_lines');
    setReassignTargetFloor(remainingFloors[0]?.name || '');
    setIsDeleteFloorModalOpen(true);
  };

  const handleConfirmDeleteFloor = () => {
    if (!floorToDelete) return;
    const floorName = floorToDelete.name;

    if (onDeleteFloor) {
      onDeleteFloor(floorName, deleteFloorMode, reassignTargetFloor);
    }

    if (deleteFloorMode === 'delete_all_lines') {
      const remainingLines = lines.filter(l => (l.floor || '').trim().toLowerCase() !== floorName.trim().toLowerCase());
      if (remainingLines.length > 0 && !remainingLines.some(l => l.lineNo === selectedLineNo)) {
        onSelectLineNo(remainingLines[0].lineNo);
      }
      showToastNotification(`Floor "${floorName}" and its ${floorToDelete.lines.length} lines deleted.`);
    } else {
      showToastNotification(`Floor "${floorName}" deleted: ${floorToDelete.lines.length} lines transferred to ${reassignTargetFloor}.`);
    }

    if (selectedFloorFilter.toLowerCase() === floorName.trim().toLowerCase()) {
      setSelectedFloorFilter('all');
    }

    setIsDeleteFloorModalOpen(false);
    setFloorToDelete(null);
  };

  // Local draft state for editing
  const [formData, setFormData] = useState<LineEntry>(() => initializeLineData(currentLine));
  const [saveToast, setSaveToast] = useState(false);
  const [showProgressionModal, setShowProgressionModal] = useState(false);

  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    planning: true,
    manpower: true,
    top5: true,
    bottleneck: true,
    timeStudy: true,
    learningCurve: true
  });

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const isAllExpanded = Object.values(expandedSections).every(Boolean);

  const toggleAllSections = () => {
    const nextState = !isAllExpanded;
    setExpandedSections({
      planning: nextState,
      manpower: nextState,
      top5: nextState,
      bottleneck: nextState,
      timeStudy: nextState,
      learningCurve: nextState
    });
  };

  // Sync draft when selected line changes
  useEffect(() => {
    if (currentLine) {
      setFormData(initializeLineData(currentLine));
    }
  }, [currentLine?.lineNo, currentLine?.id]);

  function initializeLineData(entry: LineEntry): LineEntry {
    const smv = entry.smv || 1.0;
    const totalMP =
      (entry.mp?.Operator?.present ?? 28) +
      (entry.mp?.Helper?.present ?? 8) +
      (entry.mp?.['Iron Man']?.present ?? 3);

    const learningCurve = entry.learningCurve || generateLineLearningCurve(
      smv,
      totalMP || 40,
      entry.workingHours || 8,
      'new',
      2,
      false
    );

    const tacct = Math.round(smv * 60 * 60); // Default total cycle seconds
    const maxCT = entry.bottleneck?.cycleTime || 55.0;
    const balancingAnalysis = entry.balancingAnalysis || calculateBalancingLossAnalysis(
      tacct,
      totalMP || 40,
      maxCT,
      entry.achievedProd ? Math.round(entry.achievedProd / (entry.workingHours || 8)) : 90,
      entry.targetProd ? Math.round(entry.targetProd / (entry.workingHours || 8)) : 110
    );

    return {
      ...entry,
      learningCurve,
      balancingAnalysis
    };
  }

  const metrics = calculateLineMetrics(formData);
  const smvWeight = getSMVWeight(formData.smv);

  // Learning curve safe accessor
  const lc = formData.learningCurve || generateLineLearningCurve(
    formData.smv,
    metrics.totalPresentMP || 40,
    formData.workingHours || 8,
    'new',
    2,
    false
  );

  // Balancing analysis safe accessor
  const ba = formData.balancingAnalysis || calculateBalancingLossAnalysis(
    Math.round(formData.smv * 60 * 60),
    metrics.totalPresentMP || 40,
    formData.bottleneck?.cycleTime || 55.0,
    Math.round(formData.achievedProd / (formData.workingHours || 8)),
    Math.round(formData.targetProd / (formData.workingHours || 8))
  );

  // Telemetry modal state
  const [isTelemetryModalOpen, setIsTelemetryModalOpen] = useState(false);

  // Update Line Build-Up parameters
  const handleUpdateBuildUp = (updates: Partial<BuildUpCurve>) => {
    setFormData(prev => ({
      ...prev,
      buildUp: {
        ...prev.buildUp,
        ...updates
      }
    }));
  };

  // Update day fields (plannedEff, plannedQty, achievedQty, notes) in 6-day curve
  const handleUpdateDayField = (
    dayIndex: number,
    field: keyof LearningCurveDayRecord,
    value: any
  ) => {
    const totalAvailMin = (metrics.totalPresentMP || 40) * (formData.workingHours || 8) * 60;
    const smv = formData.smv > 0 ? formData.smv : 1;
    const newHistory = [...lc.history];
    const record = { ...newHistory[dayIndex] };

    if (field === 'plannedEff') {
      const plannedEff = Math.max(0, Math.min(100, Number(value) || 0));
      record.plannedEff = plannedEff;
      record.plannedQty = Math.round((totalAvailMin * (plannedEff / 100)) / smv);
    } else if (field === 'plannedQty') {
      const plannedQty = Math.max(0, Number(value) || 0);
      record.plannedQty = plannedQty;
      record.plannedEff = totalAvailMin > 0 ? Math.round(((plannedQty * smv) / totalAvailMin) * 100) : 0;
    } else if (field === 'achievedQty') {
      const achievedQty = Math.max(0, Number(value) || 0);
      record.achievedQty = achievedQty;
      record.achievedEff = totalAvailMin > 0 ? Math.round(((achievedQty * smv) / totalAvailMin) * 100) : 0;
    } else {
      (record as any)[field] = value;
    }

    record.variancePcs = (record.achievedQty || 0) - record.plannedQty;
    record.variancePct = record.plannedQty > 0 ? Math.round((record.variancePcs / record.plannedQty) * 100) : 0;

    newHistory[dayIndex] = record;
    setFormData(prev => ({
      ...prev,
      learningCurve: {
        ...lc,
        history: newHistory
      }
    }));
  };

  // Recalculate curve targets from matrix while preserving achieved logs & notes
  const handleRecalculateTargets = () => {
    const isRepeat = lc.styleNature === 'repeat';
    const newLC = generateLineLearningCurve(
      formData.smv,
      metrics.totalPresentMP || 40,
      formData.workingHours || 8,
      lc.styleNature,
      lc.currentDay,
      isRepeat
    );
    const mergedHistory = newLC.history.map((h, i) => {
      const oldRec = lc.history[i];
      const achQty = oldRec?.achievedQty || 0;
      const totalAvailMin = (metrics.totalPresentMP || 40) * (formData.workingHours || 8) * 60;
      const smv = formData.smv > 0 ? formData.smv : 1;
      const achEff = totalAvailMin > 0 && achQty > 0 ? Math.round(((achQty * smv) / totalAvailMin) * 100) : 0;
      return {
        ...h,
        achievedQty: achQty,
        achievedEff: achEff,
        variancePcs: achQty - h.plannedQty,
        variancePct: h.plannedQty > 0 ? Math.round(((achQty - h.plannedQty) / h.plannedQty) * 100) : 0,
        notes: oldRec?.notes || ''
      };
    });
    setFormData(prev => ({
      ...prev,
      learningCurve: {
        ...newLC,
        history: mergedHistory
      }
    }));
    showToastNotification(`Targets recalculated from ${lc.styleNature} style progression matrix.`);
  };

  // Export current line telemetry
  const handleExportTelemetry = () => {
    const csvContent = generateTelemetryCSV(
      lc,
      formData.buildUp,
      formData.lineNo,
      formData.smv,
      metrics.totalPresentMP || 40,
      formData.workingHours || 8
    );
    downloadTelemetryCSV(`telemetry_line_${formData.lineNo}_${formData.date || 'current'}.csv`, csvContent);
    showToastNotification(`Telemetry log for Line ${formData.lineNo} exported successfully!`);
  };

  // Apply imported telemetry
  const handleApplyImportedTelemetry = (imported: {
    history: LearningCurveDayRecord[];
    buildUp?: Partial<BuildUpCurve>;
  }) => {
    setFormData(prev => ({
      ...prev,
      learningCurve: {
        ...lc,
        history: imported.history
      },
      buildUp: imported.buildUp
        ? { ...prev.buildUp, ...imported.buildUp }
        : prev.buildUp
    }));
    showToastNotification(`Telemetry imported for Line ${formData.lineNo} successfully!`);
  };

  // Update learning curve parameter
  const handleUpdateLearningCurve = (
    updates: Partial<typeof lc>
  ) => {
    const updatedLC = { ...lc, ...updates };
    setFormData(prev => ({
      ...prev,
      learningCurve: updatedLC
    }));
  };

  // Update day output in 6-day curve
  const handleUpdateDayRecord = (
    dayIndex: number,
    achievedQty: number,
    notes?: string
  ) => {
    const totalAvailMin = metrics.totalPresentMP * formData.workingHours * 60;
    const smv = formData.smv > 0 ? formData.smv : 1;
    const newHistory = [...lc.history];
    const record = newHistory[dayIndex];
    if (record) {
      const producedMinutes = achievedQty * smv;
      const achievedEff = totalAvailMin > 0 ? Math.round((producedMinutes / totalAvailMin) * 100) : 0;
      const variancePcs = achievedQty - record.plannedQty;
      const variancePct = record.plannedQty > 0 ? Math.round((variancePcs / record.plannedQty) * 100) : 0;

      newHistory[dayIndex] = {
        ...record,
        achievedQty,
        achievedEff,
        variancePcs,
        variancePct,
        notes: notes ?? record.notes
      };

      setFormData(prev => ({
        ...prev,
        learningCurve: {
          ...lc,
          history: newHistory
        }
      }));
    }
  };

  // Re-generate curve when Style Nature changes
  const handleStyleNatureChange = (nature: StyleNature) => {
    const isRepeat = nature === 'repeat';
    const newLC = generateLineLearningCurve(
      formData.smv,
      metrics.totalPresentMP || 40,
      formData.workingHours || 8,
      nature,
      lc.currentDay,
      isRepeat
    );
    setFormData(prev => ({
      ...prev,
      learningCurve: newLC
    }));
  };

  // Balancing Analysis update
  const handleBalancingParamChange = (field: 'tacctSeconds' | 'totalOperators' | 'maxCTSeconds' | 'currentProductionPcsPerHour' | 'estimatePcsPerHour', val: number) => {
    const updated = { ...ba, [field]: val };
    const recalculated = calculateBalancingLossAnalysis(
      field === 'tacctSeconds' ? val : ba.tacctSeconds,
      field === 'totalOperators' ? val : ba.totalOperators,
      field === 'maxCTSeconds' ? val : ba.maxCTSeconds,
      field === 'currentProductionPcsPerHour' ? val : ba.currentProductionPcsPerHour,
      field === 'estimatePcsPerHour' ? val : ba.estimatePcsPerHour
    );
    setFormData(prev => ({
      ...prev,
      balancingAnalysis: {
        ...recalculated,
        theoreticalBalancePct: ba.theoreticalBalancePct,
        balancingErrorPct: ba.balancingErrorPct,
        capacityEstimatePct: ba.capacityEstimatePct,
        rightManInRightProcess: ba.rightManInRightProcess,
        rightMachineForProcess: ba.rightMachineForProcess,
        needleDowntimeMinutes: ba.needleDowntimeMinutes
      }
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: LineEntry = {
      ...formData,
      efficiency: metrics.efficiencyPct,
      learningCurve: lc,
      balancingAnalysis: ba
    };
    onSaveLine(updated);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card matching Image 1 */}
      <div className="rounded-3xl border border-[#d9d2c2] bg-[#fbfaf6] p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#dceceb] text-[#176f78]">
                <Activity className="w-3 h-3" />
                Garment IE Floor Telemetry
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase text-[#17343a] tracking-tight">
              Line Data Collection
            </h1>
            <p className="text-xs sm:text-sm text-[#527078] mt-0.5 max-w-xl">
              Record hourly output, SMV, manpower absents, bottleneck takt cycle times, and Top 5 monitoring.
            </p>
          </div>

          {/* Line Selection Buttons & Action */}
          <div className="flex flex-col gap-2 items-end w-full sm:w-auto">
            {/* Quick Day Presets */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
              <span className="text-[11px] text-[#527078] mr-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#176f78]" />
                Day:
              </span>
              {availableDates.map(d => {
                const count = lines.filter(l => l.date === d).length;
                const formatted = new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      setFilterDate(d);
                      if (onSelectDate) onSelectDate(d);
                    }}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-[11px] font-bold ${
                      filterDate === d
                        ? 'bg-[#176f78] text-white shadow-2xs'
                        : 'bg-[#f1eee6] text-[#527078] hover:bg-[#e7e1d5]'
                    }`}
                  >
                    {formatted} ({count}L)
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setFilterDate('all')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-[11px] font-bold ${
                  filterDate === 'all'
                    ? 'bg-[#176f78] text-white shadow-2xs'
                    : 'bg-[#f1eee6] text-[#527078] hover:bg-[#e7e1d5]'
                }`}
              >
                All ({lines.length})
              </button>
            </div>

            {/* Quick Line Selector Row */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 max-w-full">
              {sortedLines.map(line => {
                const isSelected = line.lineNo === selectedLineNo;
                return (
                  <button
                    key={line.id}
                    onClick={() => onSelectLineNo(line.lineNo)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#176f78] text-white shadow-xs'
                        : 'bg-[#f1eee6] text-[#527078] hover:bg-[#e7e1d5] border border-[#d9d2c2]'
                    }`}
                  >
                    <span>Line {line.lineNo}</span>
                    {sortBy === 'efficiency' && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono-numbers ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : line.efficiency >= 80
                          ? 'bg-emerald-100 text-emerald-800'
                          : line.efficiency >= 60
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {line.efficiency}%
                      </span>
                    )}
                    {sortBy === 'wip' && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono-numbers ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : (line.wip ?? 0) > 350
                          ? 'bg-rose-100 text-rose-800'
                          : (line.wip ?? 0) > 220
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        {line.wip ?? 0} wip
                      </span>
                    )}
                  </button>
                );
              })}
              <button
                onClick={handleOpenAddLineModal}
                title="Add New Sewing Line"
                className="p-1.5 rounded-xl bg-[#176f78] text-white hover:bg-[#125860] transition-colors cursor-pointer shrink-0 shadow-2xs flex items-center gap-1 text-xs font-bold px-2.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('simulator')}
                  className="px-3 py-1.5 rounded-xl bg-[#f1eee6] text-[#176f78] hover:bg-[#dceceb] border border-[#d9d2c2] text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer ml-1"
                  title="Open IE Simulator"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Simulate Setup</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sorting Controls Bar */}
        <div className="mt-4 pt-3 border-t border-[#e7e1d5] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#527078] uppercase tracking-wider">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#176f78]" />
              <span>Sort By:</span>
            </div>

            {/* Segmented Buttons */}
            <div className="inline-flex rounded-xl bg-[#f1eee6] p-0.5 border border-[#d9d2c2]">
              {/* Line Number */}
              <button
                type="button"
                onClick={() => {
                  if (sortBy === 'lineNo') {
                    setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
                  } else {
                    setSortBy('lineNo');
                    setSortDirection('asc');
                  }
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  sortBy === 'lineNo'
                    ? 'bg-white text-[#176f78] shadow-2xs'
                    : 'text-[#527078] hover:text-[#17343a]'
                }`}
                title="Sort by Line Number"
              >
                <span>Line No</span>
                {sortBy === 'lineNo' && (
                  sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-[#176f78]" /> : <ArrowDown className="w-3 h-3 text-[#176f78]" />
                )}
              </button>

              {/* Efficiency */}
              <button
                type="button"
                onClick={() => {
                  if (sortBy === 'efficiency') {
                    setSortDirection(prev => (prev === 'desc' ? 'asc' : 'desc'));
                  } else {
                    setSortBy('efficiency');
                    setSortDirection('desc');
                  }
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  sortBy === 'efficiency'
                    ? 'bg-white text-[#176f78] shadow-2xs'
                    : 'text-[#527078] hover:text-[#17343a]'
                }`}
                title="Sort by Efficiency (High / Low)"
              >
                <span>Efficiency</span>
                {sortBy === 'efficiency' && (
                  sortDirection === 'desc' ? <ArrowDown className="w-3 h-3 text-[#176f78]" /> : <ArrowUp className="w-3 h-3 text-[#176f78]" />
                )}
              </button>

              {/* WIP Level */}
              <button
                type="button"
                onClick={() => {
                  if (sortBy === 'wip') {
                    setSortDirection(prev => (prev === 'desc' ? 'asc' : 'desc'));
                  } else {
                    setSortBy('wip');
                    setSortDirection('desc');
                  }
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  sortBy === 'wip'
                    ? 'bg-white text-[#176f78] shadow-2xs'
                    : 'text-[#527078] hover:text-[#17343a]'
                }`}
                title="Sort by WIP Level (High / Low)"
              >
                <span>WIP Level</span>
                {sortBy === 'wip' && (
                  sortDirection === 'desc' ? <ArrowDown className="w-3 h-3 text-[#176f78]" /> : <ArrowUp className="w-3 h-3 text-[#176f78]" />
                )}
              </button>
            </div>

            {/* Quick Dropdown Selector */}
            <select
              value={`${sortBy}-${sortDirection}`}
              onChange={(e) => {
                const [criterion, dir] = e.target.value.split('-') as [LineSortCriterion, SortDirection];
                setSortBy(criterion);
                setSortDirection(dir);
              }}
              className="text-xs font-bold py-1 px-2.5 rounded-xl bg-white border border-[#d9d2c2] text-[#17343a] cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#176f78]"
            >
              <option value="lineNo-asc">Line Number (1 → 34)</option>
              <option value="lineNo-desc">Line Number (34 → 1)</option>
              <option value="efficiency-desc">Efficiency (High → Low)</option>
              <option value="efficiency-asc">Efficiency (Low → High)</option>
              <option value="wip-desc">WIP Level (High → Low)</option>
              <option value="wip-asc">WIP Level (Low → High)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsDirectoryModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#f1eee6] border border-[#d9d2c2] text-xs font-bold text-[#527078] hover:text-[#17343a] flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              title="Open Directory of All Lines"
            >
              <Layers className="w-3.5 h-3.5 text-[#176f78]" />
              <span>Line Directory ({sortedLines.length})</span>
            </button>

            <button
              type="button"
              onClick={handleOpenAddLineModal}
              className="px-3 py-1.5 rounded-xl bg-[#176f78] text-white hover:bg-[#125860] text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              title="Add New Sewing Line"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Line</span>
            </button>
          </div>
        </div>

        {/* Capture Line Record Banner (Image 1 Header Banner) */}
        <div className="mt-5 p-4 rounded-2xl bg-white border border-[#e7e1d5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <div>
              <div className="font-display text-base font-bold uppercase text-[#17343a]">
                Capture Line Record — Line {formData.lineNo}
              </div>
              <div className="text-xs text-[#527078]">
                {formData.floor} • Style: <strong className="text-[#17343a]">{formData.style}</strong> ({formData.buyer}) • SMV: <strong className="text-[#176f78]">{formData.smv} min</strong>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            <div className="px-3.5 py-1.5 rounded-full bg-[#eef7f7] border border-[#b2d8d8] flex items-center gap-2">
              <span className="text-[11px] font-bold text-[#527078] uppercase">Efficiency:</span>
              <span className="font-display text-lg font-bold text-[#176f78] font-mono-numbers">
                {metrics.efficiencyPct}%
              </span>
            </div>

            {onDeleteLine && (
              <button
                type="button"
                onClick={() => handleRequestDelete(currentLine)}
                className="px-3.5 py-1.5 rounded-full border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title={`Delete Line ${formData.lineNo}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Line</span>
              </button>
            )}
          </div>
        </div>

        {/* Real-time KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="p-3 rounded-xl bg-[#f1eee6] border border-[#d9d2c2]">
            <span className="text-[10px] text-[#527078] font-bold uppercase block">Efficiency</span>
            <div className="font-display text-xl sm:text-2xl font-bold text-[#176f78] font-mono-numbers">
              {metrics.efficiencyPct}%
            </div>
            <span className="text-[10px] text-[#527078]">Target: {formData.targetEff}%</span>
          </div>

          <div className="p-3 rounded-xl bg-[#f1eee6] border border-[#d9d2c2]">
            <span className="text-[10px] text-[#527078] font-bold uppercase block">Output vs Target</span>
            <div className="font-display text-xl sm:text-2xl font-bold text-[#17343a] font-mono-numbers">
              {formData.achievedProd}
              <span className="text-xs text-[#527078] font-sans font-normal"> / {formData.targetProd}</span>
            </div>
            <span className="text-[10px] text-emerald-700 font-bold">
              {metrics.variancePcs >= 0 ? `+${metrics.variancePcs} pcs` : `${metrics.variancePcs} pcs`}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#f1eee6] border border-[#d9d2c2]">
            <span className="text-[10px] text-[#527078] font-bold uppercase block">Present Manpower</span>
            <div className="font-display text-xl sm:text-2xl font-bold text-[#17343a] font-mono-numbers">
              {metrics.totalPresentMP}
              <span className="text-xs text-[#527078] font-sans font-normal"> MP</span>
            </div>
            <span className="text-[10px] text-rose-600 font-bold">
              {metrics.totalAbsentMP} Absent ({metrics.absenteeismPct}%)
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#f1eee6] border border-[#d9d2c2]">
            <span className="text-[10px] text-[#527078] font-bold uppercase block">Produced Minutes</span>
            <div className="font-display text-xl sm:text-2xl font-bold text-[#17343a] font-mono-numbers">
              {metrics.standardProducedMinutes}
            </div>
            <span className="text-[10px] text-[#527078]">Avail: {metrics.availableMinutes} min</span>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSave} className="space-y-4">
        {/* Section Navigation & Expand/Collapse Master Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border border-[#d9d2c2] shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#eef7f7] text-[#176f78]">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#17343a] uppercase tracking-wide">
                Line Telemetry Logging Sections
              </span>
              <span className="text-[11px] text-[#527078] ml-2">
                ({Object.values(expandedSections).filter(Boolean).length} of 6 Open)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleAllSections}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#d9d2c2] bg-[#fbfaf6] text-xs font-bold text-[#527078] hover:text-[#17343a] hover:bg-[#f1eee6] shadow-2xs transition-all cursor-pointer"
            >
              {isAllExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              <span>{isAllExpanded ? "Collapse All Sections" : "Expand All Sections"}</span>
            </button>
          </div>
        </div>

        {/* ================= SECTION 1: Line Setup & IE Planning ================= */}
        <div className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => toggleSection("planning")}
            className="w-full p-4 flex items-center justify-between bg-white border-b border-[#e7e1d5] text-left hover:bg-[#fbfaf6] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#eef7f7] text-[#176f78] border border-[#c4e5e5]">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display text-base sm:text-lg font-bold uppercase text-[#17343a]">
                  Line Setup &amp; IE Planning
                </h2>
                <p className="text-xs text-[#527078]">
                  SMV, working hours, planned manpower, buyer style specifications
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono-numbers px-2.5 py-1 rounded-full bg-[#f1eee6] text-[#527078] font-bold">
                SMV {formData.smv}m • {smvWeight}
              </span>
              {expandedSections.planning ? (
                <ChevronUp className="w-4 h-4 text-[#527078]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#527078]" />
              )}
            </div>
          </button>

          {expandedSections.planning && (
            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Line Number
                  </label>
                  <input
                    type="text"
                    value={formData.lineNo}
                    onChange={e => setFormData({ ...formData, lineNo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#d9d2c2] font-bold text-[#17343a]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Floor Location
                  </label>
                  <input
                    type="text"
                    value={formData.floor}
                    onChange={e => setFormData({ ...formData, floor: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#d9d2c2] text-[#17343a]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Buyer / Customer
                  </label>
                  <input
                    type="text"
                    value={formData.buyer}
                    onChange={e => setFormData({ ...formData, buyer: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#d9d2c2] text-[#17343a]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Running Style Name
                  </label>
                  <input
                    type="text"
                    value={formData.style}
                    onChange={e => setFormData({ ...formData, style: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#d9d2c2] text-[#17343a] font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Standard Allowed Minutes (SMV)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={formData.smv}
                      onChange={e => setFormData({ ...formData, smv: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#d9d2c2] font-mono-numbers font-bold text-[#176f78]"
                    />
                    <span className="absolute right-3 top-2 text-[10px] font-bold uppercase text-[#527078]">
                      {smvWeight}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Planned Shift Hours
                  </label>
                  <input
                    type="number"
                    value={formData.workingHours}
                    onChange={e => setFormData({ ...formData, workingHours: parseInt(e.target.value) || 8 })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#d9d2c2] font-mono-numbers"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Planned Target Eff %
                  </label>
                  <input
                    type="number"
                    value={formData.targetEff}
                    onChange={e => setFormData({ ...formData, targetEff: parseInt(e.target.value) || 80 })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#d9d2c2] font-mono-numbers text-[#176f78] font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Planned Target Output (Pcs)
                  </label>
                  <input
                    type="number"
                    value={formData.targetProd}
                    onChange={e => setFormData({ ...formData, targetProd: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#d9d2c2] font-mono-numbers font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#e7e1d5]">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">Order Qty</label>
                  <input
                    type="number"
                    value={formData.orderQty}
                    onChange={e => setFormData({ ...formData, orderQty: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#d9d2c2] font-mono-numbers"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">Daily Input</label>
                  <input
                    type="number"
                    value={formData.dailyInput}
                    onChange={e => setFormData({ ...formData, dailyInput: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#d9d2c2] font-mono-numbers"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">Daily Output</label>
                  <input
                    type="number"
                    value={formData.dailyOutput}
                    onChange={e => setFormData({ ...formData, dailyOutput: parseInt(e.target.value) || 0, achievedProd: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#d9d2c2] font-mono-numbers font-bold text-[#176f78]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">Current WIP (Pcs)</label>
                  <input
                    type="number"
                    value={formData.wip}
                    onChange={e => setFormData({ ...formData, wip: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#d9d2c2] font-mono-numbers"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================= SECTION 2: Manpower Allocation & Absenteeism Balancing ================= */}
        <div className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => toggleSection("manpower")}
            className="w-full p-4 flex items-center justify-between bg-white border-b border-[#e7e1d5] text-left hover:bg-[#fbfaf6] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#fef7e0] text-[#b06000] border border-[#feefa3]">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display text-base sm:text-lg font-bold uppercase text-[#17343a]">
                  Manpower Allocation &amp; Absenteeism Balancing
                </h2>
                <p className="text-xs text-[#527078]">
                  Operators, helpers, iron men, absenteeism rate &amp; balance method
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono-numbers px-2.5 py-1 rounded-full bg-[#fef7e0] text-[#8c4600] font-bold">
                Present: {metrics.totalPresentMP} • Absent: {metrics.totalAbsentMP}
              </span>
              {expandedSections.manpower ? (
                <ChevronUp className="w-4 h-4 text-[#527078]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#527078]" />
              )}
            </div>
          </button>

          {expandedSections.manpower && (
            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Operator */}
                <div className="p-3.5 rounded-xl bg-white border border-[#d9d2c2] space-y-2">
                  <div className="font-bold text-[#17343a] text-xs uppercase flex items-center justify-between">
                    <span>Machine Operators</span>
                    <span className="text-[10px] text-[#527078]">Core Sewing</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-[#527078] block font-bold uppercase">Present</span>
                      <input
                        type="number"
                        value={formData.mp.Operator.present}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            mp: {
                              ...formData.mp,
                              Operator: {
                                ...formData.mp.Operator,
                                present: parseInt(e.target.value) || 0
                              }
                            }
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#d9d2c2] font-mono-numbers font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-rose-600 block font-bold uppercase">Absent</span>
                      <input
                        type="number"
                        value={formData.mp.Operator.absent}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            mp: {
                              ...formData.mp,
                              Operator: {
                                ...formData.mp.Operator,
                                absent: parseInt(e.target.value) || 0
                              }
                            }
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#d9d2c2] font-mono-numbers text-rose-600 font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Helper */}
                <div className="p-3.5 rounded-xl bg-white border border-[#d9d2c2] space-y-2">
                  <div className="font-bold text-[#17343a] text-xs uppercase flex items-center justify-between">
                    <span>Floor Helpers</span>
                    <span className="text-[10px] text-[#527078]">Bundles &amp; Trimming</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-[#527078] block font-bold uppercase">Present</span>
                      <input
                        type="number"
                        value={formData.mp.Helper.present}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            mp: {
                              ...formData.mp,
                              Helper: {
                                ...formData.mp.Helper,
                                present: parseInt(e.target.value) || 0
                              }
                            }
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#d9d2c2] font-mono-numbers font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-rose-600 block font-bold uppercase">Absent</span>
                      <input
                        type="number"
                        value={formData.mp.Helper.absent}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            mp: {
                              ...formData.mp,
                              Helper: {
                                ...formData.mp.Helper,
                                absent: parseInt(e.target.value) || 0
                              }
                            }
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#d9d2c2] font-mono-numbers text-rose-600 font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Iron Man */}
                <div className="p-3.5 rounded-xl bg-white border border-[#d9d2c2] space-y-2">
                  <div className="font-bold text-[#17343a] text-xs uppercase flex items-center justify-between">
                    <span>Iron Men / Pressers</span>
                    <span className="text-[10px] text-[#527078]">Intermediate Press</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-[#527078] block font-bold uppercase">Present</span>
                      <input
                        type="number"
                        value={formData.mp['Iron Man'].present}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            mp: {
                              ...formData.mp,
                              'Iron Man': {
                                ...formData.mp['Iron Man'],
                                present: parseInt(e.target.value) || 0
                              }
                            }
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#d9d2c2] font-mono-numbers font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-rose-600 block font-bold uppercase">Absent</span>
                      <input
                        type="number"
                        value={formData.mp['Iron Man'].absent}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            mp: {
                              ...formData.mp,
                              'Iron Man': {
                                ...formData.mp['Iron Man'],
                                absent: parseInt(e.target.value) || 0
                              }
                            }
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#d9d2c2] font-mono-numbers text-rose-600 font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Balancing Method & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#e7e1d5]">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Absenteeism Mitigation Method
                  </label>
                  <select
                    value={formData.balanceMethod}
                    onChange={e => setFormData({ ...formData, balanceMethod: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#d9d2c2] text-xs font-bold"
                  >
                    <option value="Overtime">Overtime (OT for critical stations)</option>
                    <option value="Borrowed from other line">Borrowed from Other Line / Training Pool</option>
                    <option value="Re-allocated from non-bottleneck">Re-allocated from Non-Bottleneck Process</option>
                    <option value="Float operator assigned">Multi-skilled Float Operator Assigned</option>
                    <option value="Buffer stock consumption">WIP Buffer Consumption</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Balancing Action Notes
                  </label>
                  <input
                    type="text"
                    value={formData.balanceNotes}
                    onChange={e => setFormData({ ...formData, balanceNotes: e.target.value })}
                    placeholder="e.g. 2 operators worked 1 hr OT to absorb backlog"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#d9d2c2]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================= SECTION 3: Top 5 Meeting Monitoring ================= */}
        <div className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => toggleSection('top5')}
            className="w-full p-4 flex items-center justify-between bg-white border-b border-[#e7e1d5] text-left hover:bg-[#fbfaf6] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#f3e8fd] text-[#7627bb] border border-[#e9d5ff]">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display text-base sm:text-lg font-bold uppercase text-[#17343a]">
                  Top 5 Meeting Monitoring
                </h2>
                <p className="text-xs text-[#527078]">
                  Daily floor alignment, critical defect resolutions &amp; team attendance
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
                formData.top5.held === 'yes' ? 'bg-[#f3e8fd] text-[#7627bb]' : 'bg-rose-100 text-rose-700'
              }`}>
                Status: {formData.top5.held.toUpperCase()}
              </span>
              {expandedSections.top5 ? (
                <ChevronUp className="w-4 h-4 text-[#527078]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#527078]" />
              )}
            </div>
          </button>

          {expandedSections.top5 && (
            <div className="p-5 space-y-4 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-xl bg-white border border-[#d9d2c2]">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-[#17343a] uppercase">Meeting Conducted?</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, top5: { ...formData.top5, held: 'yes' } })}
                      className={`px-3 py-1 rounded-lg font-bold ${
                        formData.top5.held === 'yes'
                          ? 'bg-[#176f78] text-white shadow-xs'
                          : 'bg-[#f1eee6] text-[#527078]'
                      }`}
                    >
                      YES
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, top5: { ...formData.top5, held: 'no' } })}
                      className={`px-3 py-1 rounded-lg font-bold ${
                        formData.top5.held === 'no'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-[#f1eee6] text-[#527078]'
                      }`}
                    >
                      NO
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#527078] uppercase">Attendance %:</span>
                  <input
                    type="number"
                    value={formData.top5.attendance}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        top5: { ...formData.top5, attendance: parseInt(e.target.value) || 0 }
                      })
                    }
                    className="w-20 px-2.5 py-1 rounded-lg border border-[#d9d2c2] font-mono-numbers font-bold"
                  />
                  <span>%</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1.5">
                  Top 5 Floor Review Items Discussed
                </label>
                <div className="space-y-1.5">
                  {formData.top5.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#f1eee6] text-[#17343a] font-bold flex items-center justify-center text-[10px] shrink-0">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={item}
                        onChange={e => {
                          const newItems = [...formData.top5.items];
                          newItems[idx] = e.target.value;
                          setFormData({
                            ...formData,
                            top5: { ...formData.top5, items: newItems }
                          });
                        }}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-[#d9d2c2] text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                  Meeting Resolution &amp; Supervisor Acknowledgement
                </label>
                <input
                  type="text"
                  value={formData.top5.notes || ''}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      top5: { ...formData.top5, notes: e.target.value }
                    })
                  }
                  placeholder="Supervisor confirmed all actions acknowledged by batch chiefs"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#d9d2c2]"
                />
              </div>
            </div>
          )}
        </div>

        {/* ================= SECTION 4: Bottleneck Flow Analysis & Cycle Time Checking ================= */}
        <div className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => toggleSection('bottleneck')}
            className="w-full p-4 flex items-center justify-between bg-white border-b border-[#e7e1d5] text-left hover:bg-[#fbfaf6] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display text-base sm:text-lg font-bold uppercase text-[#17343a]">
                  Bottleneck Flow Analysis &amp; Cycle Time Checking
                </h2>
                <p className="text-xs text-[#527078]">
                  Pacing station study, takt vs observed cycle times &amp; line balancing action
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono-numbers px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 font-bold">
                {formData.bottleneck.station || 'Critical'} • {formData.bottleneck.cycleTime}s
              </span>
              {expandedSections.bottleneck ? (
                <ChevronUp className="w-4 h-4 text-[#527078]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#527078]" />
              )}
            </div>
          </button>

          {expandedSections.bottleneck && (
            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Critical Bottleneck Station Name
                  </label>
                  <input
                    type="text"
                    value={formData.bottleneck.station}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        bottleneck: { ...formData.bottleneck, station: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#d9d2c2] font-bold text-[#17343a]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Observed Cycle Time (sec)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.bottleneck.cycleTime}
                    onChange={e => {
                      const ct = parseFloat(e.target.value) || 0;
                      setFormData({
                        ...formData,
                        bottleneck: { ...formData.bottleneck, cycleTime: ct }
                      });
                      handleBalancingParamChange('maxCTSeconds', ct);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#d9d2c2] font-mono-numbers font-bold text-rose-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Target Cycle Time (sec)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.bottleneck.targetCT}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        bottleneck: {
                          ...formData.bottleneck,
                          targetCT: parseFloat(e.target.value) || 0
                        }
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#d9d2c2] font-mono-numbers font-bold text-[#176f78]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                  Corrective Action Taken at Station
                </label>
                <input
                  type="text"
                  value={formData.bottleneck.action}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      bottleneck: { ...formData.bottleneck, action: e.target.value }
                    })
                  }
                  placeholder="e.g. Assigned senior multi-skilled operator & added guide attachment"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#d9d2c2]"
                />
              </div>
            </div>
          )}
        </div>

        {/* ================= SECTION 5: Time / Production Study ================= */}
        <div className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => toggleSection("timeStudy")}
            className="w-full p-4 flex items-center justify-between bg-white border-b border-[#e7e1d5] text-left hover:bg-[#fbfaf6] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#e0f2fe] text-[#0369a1] border border-[#bae6fd]">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display text-base sm:text-lg font-bold uppercase text-[#17343a]">
                  Time / Production Study
                </h2>
                <p className="text-xs text-[#527078]">
                  Stopwatch audit, standard vs observed output rate &amp; operator rating
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono-numbers px-2.5 py-1 rounded-full bg-[#e0f2fe] text-[#0369a1] font-bold">
                Study: {formData.timeStudy.done.toUpperCase()} • {formData.timeStudy.observedRate} pcs/h
              </span>
              {expandedSections.timeStudy ? (
                <ChevronUp className="w-4 h-4 text-[#527078]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#527078]" />
              )}
            </div>
          </button>

          {expandedSections.timeStudy && (
            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Study Conducted
                  </label>
                  <select
                    value={formData.timeStudy.done}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        timeStudy: { ...formData.timeStudy, done: e.target.value as any }
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#d9d2c2] font-bold"
                  >
                    <option value="yes">YES - Full Study Completed</option>
                    <option value="partial">PARTIAL - Sample Audit Only</option>
                    <option value="no">NO - Pending</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Study Type
                  </label>
                  <select
                    value={formData.timeStudy.type}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        timeStudy: { ...formData.timeStudy, type: e.target.value as any }
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#d9d2c2]"
                  >
                    <option value="time">Time Study (Snap-back / Continuous)</option>
                    <option value="production">Production Study (Output Log)</option>
                    <option value="both">Both (Time &amp; Motion Analysis)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Observed Rate (Pcs / Hr)
                  </label>
                  <input
                    type="number"
                    value={formData.timeStudy.observedRate}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        timeStudy: {
                          ...formData.timeStudy,
                          observedRate: parseInt(e.target.value) || 0
                        }
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#d9d2c2] font-mono-numbers font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Standard Target Rate (Pcs / Hr)
                  </label>
                  <input
                    type="number"
                    value={formData.timeStudy.standardRate}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        timeStudy: {
                          ...formData.timeStudy,
                          standardRate: parseInt(e.target.value) || 0
                        }
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#d9d2c2] font-mono-numbers font-bold text-[#176f78]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                  IE Findings &amp; Motion Waste Observations
                </label>
                <input
                  type="text"
                  value={formData.timeStudy.findings || ''}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      timeStudy: { ...formData.timeStudy, findings: e.target.value }
                    })
                  }
                  placeholder="e.g. Material handling delay accounts for 4.2s per garment"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#d9d2c2]"
                />
              </div>
            </div>
          )}
        </div>

        {/* ================= SECTION 6: Line Build-Up & 6-Day Learning Curve Telemetry Logging ================= */}
        <div className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] overflow-hidden shadow-xs">
          <div className="w-full p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white border-b border-[#e7e1d5] text-left">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => toggleSection("learningCurve")}
                className="p-2.5 rounded-xl bg-[#176f78] text-white shadow-xs hover:bg-[#125860] cursor-pointer shrink-0"
              >
                <TrendingUp className="w-5 h-5" />
              </button>
              <div onClick={() => toggleSection("learningCurve")} className="cursor-pointer">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-display text-base sm:text-lg font-bold uppercase text-[#17343a]">
                    Line Build-Up &amp; 6-Day Learning Curve Telemetry Logging
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#176f78] text-white">
                    Period: 6 Days
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Import &amp; Updateable
                  </span>
                </div>
                <p className="text-xs text-[#527078]">
                  Import/export CSV telemetry, update daily targets &amp; actual logs, and adjust line build-up ramp
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono-numbers px-2.5 py-1 rounded-full bg-[#dceceb] text-[#176f78] font-bold">
                Day {lc.currentDay} of 6 • Target {getProgressionTargetEff(lc.currentDay, lc.styleNature, smvWeight)}%
              </span>

              {/* Import Telemetry Button */}
              <button
                type="button"
                onClick={() => setIsTelemetryModalOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-[#17343a] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs hover:bg-[#224b53] cursor-pointer"
                title="Import 6-Day Curve & Build-Up Telemetry from CSV or Excel"
              >
                <Upload className="w-3.5 h-3.5 text-amber-300" />
                <span>Import Telemetry</span>
              </button>

              {/* Export CSV Button */}
              <button
                type="button"
                onClick={handleExportTelemetry}
                className="px-2.5 py-1 rounded-lg bg-white border border-[#d9d2c2] text-[#176f78] font-bold text-xs flex items-center gap-1.5 shadow-2xs hover:bg-[#f1eee6] cursor-pointer"
                title="Export Line Telemetry Log to CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>

              {/* Sync Targets Button */}
              <button
                type="button"
                onClick={handleRecalculateTargets}
                className="px-2.5 py-1 rounded-lg bg-white border border-[#d9d2c2] text-[#527078] hover:text-[#17343a] font-bold text-xs flex items-center gap-1 shadow-2xs hover:bg-[#f1eee6] cursor-pointer"
                title="Recalculate targets from Style Progression matrix"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Sync</span>
              </button>

              <button
                type="button"
                onClick={() => setShowProgressionModal(true)}
                className="px-2.5 py-1 rounded-lg bg-[#176f78] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs hover:bg-[#125860] cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>40-Day</span>
              </button>

              <button
                type="button"
                onClick={() => toggleSection("learningCurve")}
                className="p-1 rounded-lg text-[#527078] hover:bg-[#f1eee6] cursor-pointer ml-1"
              >
                {expandedSections.learningCurve ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {expandedSections.learningCurve && (
            <div className="p-5 space-y-4 text-xs">
              {/* Style Nature & Weight Configuration Banner */}
              <div className="p-4 rounded-2xl bg-white border border-[#d9d2c2] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-display text-sm font-bold uppercase text-[#17343a]">
                      Garment Style Classification &amp; 6-Day Period Rule
                    </h3>
                    <p className="text-[11px] text-[#527078]">
                      Automatically looks up efficiency targets from the Style Progression Chart (Image 4)
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowProgressionModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-[#176f78] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs hover:bg-[#125860] cursor-pointer"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>View Full 40-Day Chart</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  {/* Style Nature Selector */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                      Style Nature
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleStyleNatureChange('new')}
                        className={`p-2.5 rounded-xl text-center font-bold transition-all ${
                          lc.styleNature === 'new'
                            ? 'bg-[#176f78] text-white shadow-xs'
                            : 'bg-[#f1eee6] text-[#527078] hover:bg-[#e7e1d5] border border-[#d9d2c2]'
                        }`}
                      >
                        New Style
                        <span className="block text-[10px] font-normal opacity-80">Initial Run</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStyleNatureChange('repeat')}
                        className={`p-2.5 rounded-xl text-center font-bold transition-all ${
                          lc.styleNature === 'repeat'
                            ? 'bg-[#8c531b] text-white shadow-xs'
                            : 'bg-[#f1eee6] text-[#527078] hover:bg-[#e7e1d5] border border-[#d9d2c2]'
                        }`}
                      >
                        Repeat Style
                        <span className="block text-[10px] font-normal opacity-80">&le; 3 Months</span>
                      </button>
                    </div>
                  </div>

                  {/* SMV Weight Classification */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                      SMV Weight Category
                    </label>
                    <div className="p-2.5 rounded-xl bg-[#f1eee6] border border-[#d9d2c2] flex items-center justify-between">
                      <div>
                        <div className="font-bold text-[#17343a] capitalize">{smvWeight} weight</div>
                        <div className="text-[10px] text-[#527078]">
                          {smvWeight === 'light' ? '0 - 30 Min' : smvWeight === 'medium' ? '31 - 60 Min' : '>61 Min'}
                        </div>
                      </div>
                      <span className="px-2 py-1 rounded-md text-[11px] font-mono-numbers font-bold bg-white text-[#176f78] border border-[#d9d2c2]">
                        {formData.smv} min SMV
                      </span>
                    </div>
                  </div>

                  {/* Current Learning Curve Day */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                      Current Period Day (1 to 6)
                    </label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5, 6].map(dayNum => (
                        <button
                          key={dayNum}
                          type="button"
                          onClick={() => handleUpdateLearningCurve({ currentDay: dayNum })}
                          className={`flex-1 py-2 rounded-xl font-mono-numbers font-bold text-center transition-all ${
                            lc.currentDay === dayNum
                              ? 'bg-[#17343a] text-white shadow-xs ring-2 ring-[#176f78]'
                              : 'bg-[#f1eee6] text-[#527078] hover:bg-[#e7e1d5] border border-[#d9d2c2]'
                          }`}
                        >
                          D{dayNum}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Important Rule Banner from Image 4 */}
                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-[#fff8e8] border border-[#f5e0b0] text-[11px] text-[#8c531b]">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <strong>Standard Rule:</strong> If any style input starts again within 3 months in the same line, it is considered a <strong>Repeat Style</strong> (higher target curve on Days 1-5). Learning curve ramp-up period is standardized to <strong>6 days</strong> before reaching normal operations.
                  </div>
                </div>
              </div>

              {/* LINE BUILD-UP RAMP-UP & OPERATOR ALLOCATION TELEMETRY CARD */}
              <div className="p-4 rounded-2xl bg-white border border-[#d9d2c2] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#e7e1d5]">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-[#dceceb] text-[#176f78]">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-display text-xs font-bold uppercase text-[#17343a]">
                        Line Build-Up Ramp-Up &amp; Operator Allocation Telemetry
                      </h4>
                      <p className="text-[11px] text-[#527078]">
                        Progressive loading stage, planned vs achieved ramp efficiency, and active workstation manpower
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold font-mono-numbers ${
                      (formData.buildUp.achievedPct ?? 50) >= (formData.buildUp.plannedPct ?? 50)
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      Ramp Status: {(formData.buildUp.achievedPct ?? 50) >= (formData.buildUp.plannedPct ?? 50) ? 'On Target / Ahead' : 'Ramp Lag'} (
                      {(formData.buildUp.achievedPct ?? 50) - (formData.buildUp.plannedPct ?? 50) >= 0 ? '+' : ''}
                      {(formData.buildUp.achievedPct ?? 50) - (formData.buildUp.plannedPct ?? 50)}%)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                  {/* Build-Up Stage Day */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                      Build-Up Stage / Day
                    </label>
                    <select
                      value={formData.buildUp.day || '1'}
                      onChange={e => handleUpdateBuildUp({ day: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2] text-xs font-bold text-[#17343a] focus:ring-1 focus:ring-[#176f78]"
                    >
                      <option value="1">Day 1 - Initial Feeder Ramp</option>
                      <option value="2">Day 2 - Sub-Assembly Loading</option>
                      <option value="3">Day 3 - Line Balancing</option>
                      <option value="4">Day 4 - Output Stabilization</option>
                      <option value="5">Day 5 - Peak Speed Tuning</option>
                      <option value="6">Day 6 - Standard Steady State</option>
                      <option value="stable">Full Steady Production</option>
                    </select>
                  </div>

                  {/* Planned Ramp Efficiency % */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                      Planned Ramp Eff %
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.buildUp.plannedPct ?? 50}
                        onChange={e => handleUpdateBuildUp({ plannedPct: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2] text-xs font-bold text-[#176f78] focus:ring-1 focus:ring-[#176f78]"
                      />
                      <span className="absolute right-3 top-2 text-xs font-bold text-[#527078]">%</span>
                    </div>
                  </div>

                  {/* Achieved Ramp Efficiency % */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                      Achieved Ramp Eff %
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.buildUp.achievedPct ?? 50}
                        onChange={e => handleUpdateBuildUp({ achievedPct: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2] text-xs font-bold text-emerald-800 focus:ring-1 focus:ring-emerald-600"
                      />
                      <span className="absolute right-3 top-2 text-xs font-bold text-[#527078]">%</span>
                    </div>
                  </div>

                  {/* Allocated Build-Up Operators */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold uppercase text-[#527078]">
                        Allocated Operators
                      </label>
                      <button
                        type="button"
                        onClick={() => handleUpdateBuildUp({ operators: metrics.totalPresentMP || 36 })}
                        className="text-[10px] text-[#176f78] hover:underline font-bold"
                      >
                        Use MP ({metrics.totalPresentMP})
                      </button>
                    </div>
                    <input
                      type="number"
                      min="1"
                      value={formData.buildUp.operators ?? metrics.totalPresentMP}
                      onChange={e => handleUpdateBuildUp({ operators: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2] text-xs font-bold text-[#17343a] focus:ring-1 focus:ring-[#176f78]"
                    />
                  </div>
                </div>

                {/* Build-Up Stage Notes */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Build-Up Floor Observations &amp; Balancing Notes
                  </label>
                  <input
                    type="text"
                    value={formData.buildUp.notes || ''}
                    onChange={e => handleUpdateBuildUp({ notes: e.target.value })}
                    placeholder="e.g. Day 1 initial feeder loading completed, front placket operator required cross-training"
                    className="w-full px-3 py-2 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2] text-xs text-[#17343a] focus:ring-1 focus:ring-[#176f78]"
                  />
                </div>
              </div>

              {/* 6-Day Period Progression Visual Comparison Bar Chart */}
              <div className="p-4 rounded-2xl bg-white border border-[#d9d2c2] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-display text-xs font-bold uppercase text-[#17343a] flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#176f78]" />
                    <span>6-Day Learning Curve Progression (Planned vs Achieved Efficiency)</span>
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

                {/* Bar Grid for the 6 Days */}
                <div className="grid grid-cols-6 gap-2 pt-2 border-t border-[#e7e1d5]">
                  {lc.history.slice(0, 6).map((item) => {
                    const isCurrent = lc.currentDay === item.day;
                    const maxPercent = 85; // scale height
                    const plannedHeight = Math.min(100, (item.plannedEff / maxPercent) * 100);
                    const achievedHeight = Math.min(100, ((item.achievedEff || 0) / maxPercent) * 100);

                    return (
                      <div
                        key={item.day}
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
                            Day {item.day}
                          </span>
                          {isCurrent && (
                            <span className="px-1 py-0.2 rounded text-[8px] font-bold bg-[#176f78] text-white uppercase inline-block">
                              Active
                            </span>
                          )}
                        </div>

                        {/* Dual Bar Display */}
                        <div className="w-full h-24 flex items-end justify-center gap-1.5 py-1">
                          {/* Planned Bar */}
                          <div
                            style={{ height: `${plannedHeight}%` }}
                            className="w-3.5 sm:w-4 bg-[#176f78] rounded-t-sm transition-all relative group cursor-pointer"
                            title={`Planned: ${item.plannedEff}% (${item.plannedQty} pcs)`}
                          />
                          {/* Achieved Bar */}
                          <div
                            style={{ height: `${achievedHeight}%` }}
                            className={`w-3.5 sm:w-4 rounded-t-sm transition-all cursor-pointer ${
                              item.achievedEff >= item.plannedEff
                                ? 'bg-emerald-500'
                                : item.achievedEff > 0
                                ? 'bg-amber-500'
                                : 'bg-slate-200'
                            }`}
                            title={`Achieved: ${item.achievedEff}% (${item.achievedQty} pcs)`}
                          />
                        </div>

                        {/* Efficiency Labels */}
                        <div className="text-center text-[10px] font-mono-numbers">
                          <span className="text-[#176f78] font-bold block">{item.plannedEff}%</span>
                          <span className={`${
                            item.achievedEff >= item.plannedEff
                              ? 'text-emerald-700 font-bold'
                              : item.achievedEff > 0
                              ? 'text-amber-700'
                              : 'text-slate-400'
                          }`}>
                            {item.achievedEff > 0 ? `${item.achievedEff}%` : '—'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Day-by-Day Interactive Telemetry & Logging Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase text-[#17343a]">
                      6-Day Interactive Telemetry Log (Direct Inline Editing)
                    </span>
                    <span className="text-[10px] text-[#527078]">
                      Click and edit planned efficiency %, targets, actual output pcs, or notes
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsTelemetryModalOpen(true)}
                    className="text-xs text-[#176f78] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Import from CSV/Excel</span>
                  </button>
                </div>

                <div className="overflow-x-auto border border-[#d9d2c2] rounded-2xl bg-white shadow-xs">
                  <table className="w-full text-center text-xs border-collapse">
                    <thead className="bg-[#f1eee6] border-b border-[#d9d2c2] text-[11px] font-bold text-[#17343a]">
                      <tr>
                        <th className="p-2.5 border-r border-[#e7e1d5] w-24">Period Day</th>
                        <th className="p-2.5 border-r border-[#e7e1d5] bg-[#eef7f7] w-28">Planned Eff %</th>
                        <th className="p-2.5 border-r border-[#e7e1d5] bg-[#eef7f7] w-32">Planned Target Pcs</th>
                        <th className="p-2.5 border-r border-[#e7e1d5] bg-[#e6f4ea] w-32">Achieved Log Pcs</th>
                        <th className="p-2.5 border-r border-[#e7e1d5] bg-[#e6f4ea] w-28">Achieved Eff %</th>
                        <th className="p-2.5 border-r border-[#e7e1d5] w-28">Variance (Pcs / %)</th>
                        <th className="p-2.5 border-r border-[#e7e1d5]">Daily Floor Notes &amp; Observations</th>
                        <th className="p-2.5 w-24">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e7e1d5]">
                      {lc.history.slice(0, 6).map((item, idx) => {
                        const isCurrent = lc.currentDay === item.day;
                        const isAhead = (item.variancePcs || 0) >= 0;

                        return (
                          <tr
                            key={item.day}
                            className={`hover:bg-[#fbfaf6] ${isCurrent ? 'bg-[#f0f9f9]' : ''}`}
                          >
                            <td className="p-2.5 border-r border-[#e7e1d5] font-bold text-[#17343a]">
                              <button
                                type="button"
                                onClick={() => handleUpdateLearningCurve({ currentDay: item.day })}
                                className="hover:text-[#176f78] cursor-pointer"
                                title="Click to set as current active day"
                              >
                                Day - {item.day}
                              </button>
                              {isCurrent && (
                                <span className="block text-[9px] text-[#176f78] uppercase font-bold">Active Today</span>
                              )}
                            </td>

                            {/* Editable Planned Eff % */}
                            <td className="p-1.5 border-r border-[#e7e1d5] bg-[#eef7f7]/30">
                              <div className="relative flex items-center justify-center">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={item.plannedEff}
                                  onChange={e => handleUpdateDayField(idx, 'plannedEff', e.target.value)}
                                  className="w-20 px-2 py-1 rounded-lg border border-[#d9d2c2] font-mono-numbers font-bold text-center bg-white text-[#176f78] focus:ring-1 focus:ring-[#176f78]"
                                  title="Edit planned efficiency %"
                                />
                                <span className="text-[10px] text-[#527078] ml-1 font-bold">%</span>
                              </div>
                            </td>

                            {/* Editable Target Pcs */}
                            <td className="p-1.5 border-r border-[#e7e1d5] bg-[#eef7f7]/30">
                              <input
                                type="number"
                                min="0"
                                value={item.plannedQty}
                                onChange={e => handleUpdateDayField(idx, 'plannedQty', e.target.value)}
                                className="w-24 px-2 py-1 rounded-lg border border-[#d9d2c2] font-mono-numbers font-bold text-center bg-white text-[#17343a] focus:ring-1 focus:ring-[#176f78]"
                                title="Edit planned quantity target"
                              />
                            </td>

                            {/* Editable Achieved Output Log Pcs */}
                            <td className="p-1.5 border-r border-[#e7e1d5] bg-[#e6f4ea]/30">
                              <input
                                type="number"
                                min="0"
                                value={item.achievedQty || ''}
                                onChange={e => handleUpdateDayField(idx, 'achievedQty', e.target.value)}
                                placeholder="Log pcs"
                                className="w-24 px-2 py-1 rounded-lg border border-emerald-300 font-mono-numbers font-bold text-center bg-white text-emerald-900 focus:ring-1 focus:ring-emerald-500"
                                title="Enter actual achieved quantity"
                              />
                            </td>

                            {/* Achieved Eff % (Auto-calculated) */}
                            <td className="p-2.5 border-r border-[#e7e1d5] font-mono-numbers font-bold text-emerald-800 bg-[#e6f4ea]/30">
                              {item.achievedEff > 0 ? `${item.achievedEff}%` : '—'}
                            </td>

                            {/* Variance (Pcs / %) */}
                            <td className={`p-2.5 border-r border-[#e7e1d5] font-mono-numbers font-bold ${
                              item.achievedQty === 0 ? 'text-slate-400' : isAhead ? 'text-emerald-700' : 'text-rose-600'
                            }`}>
                              {item.achievedQty === 0 ? (
                                '—'
                              ) : (
                                <span>
                                  {isAhead ? `+${item.variancePcs}` : `${item.variancePcs}`} pcs
                                  <span className="block text-[10px] font-normal opacity-85">
                                    ({isAhead ? `+${item.variancePct}` : `${item.variancePct}`}%)
                                  </span>
                                </span>
                              )}
                            </td>

                            {/* Editable Daily Notes */}
                            <td className="p-1.5 border-r border-[#e7e1d5] text-left">
                              <input
                                type="text"
                                value={item.notes || ''}
                                onChange={e => handleUpdateDayField(idx, 'notes', e.target.value)}
                                placeholder="IE observations, motor replacements, feeding notes..."
                                className="w-full px-2.5 py-1 rounded-lg border border-[#d9d2c2] text-xs text-[#17343a] bg-white focus:ring-1 focus:ring-[#176f78]"
                              />
                            </td>

                            {/* Status */}
                            <td className="p-2.5">
                              {item.achievedQty === 0 ? (
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
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* General Remarks & Save Actions */}
        <div className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] p-5 shadow-xs space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
              General Line Remarks &amp; IE Lead Handover Summary
            </label>
            <textarea
              rows={2}
              value={formData.remarks}
              onChange={e => setFormData({ ...formData, remarks: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-white border border-[#d9d2c2] text-xs text-[#17343a] focus:outline-hidden focus:ring-1 focus:ring-[#176f78]"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[#e7e1d5]">
            <div className="text-xs text-[#527078]">
              {saveToast && (
                <span className="flex items-center gap-1.5 text-emerald-600 font-bold animate-bounce">
                  <CheckCircle2 className="w-4 h-4" />
                  Line {formData.lineNo} telemetry &amp; 6-day learning curve saved successfully!
                </span>
              )}
            </div>

            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#176f78] text-white hover:bg-[#12555c] transition-colors text-xs font-bold shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Line Data</span>
            </button>
          </div>
        </div>
      </form>

      {/* Full 40-Day Style Progression Chart Modal */}
      <StyleProgressionModal
        isOpen={showProgressionModal}
        onClose={() => setShowProgressionModal(false)}
        activeSMVWeight={smvWeight}
        activeStyleNature={lc.styleNature}
      />

      {/* Telemetry Import Modal */}
      <TelemetryImportModal
        isOpen={isTelemetryModalOpen}
        onClose={() => setIsTelemetryModalOpen(false)}
        onApplyTelemetry={handleApplyImportedTelemetry}
        lineNo={formData.lineNo}
        smv={formData.smv}
        totalMP={metrics.totalPresentMP || 40}
        workingHours={formData.workingHours || 8}
      />

      {/* Add New Line Modal */}
      {isAddLineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full border border-[#d9d2c2] shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#e7e1d5]">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-[#dceceb] text-[#176f78]">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold uppercase text-[#17343a]">
                    Add New Sewing Line
                  </h3>
                  <p className="text-xs text-[#527078]">
                    Configure line allocation, manpower targets, style parameters, and IE balancing.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddLineModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-[#f1eee6] text-[#527078] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLineSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Line Number / Designation *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 35 or 18-B"
                    value={addLineNo}
                    onChange={e => setAddLineNo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2] text-xs font-bold text-[#17343a] focus:outline-none focus:ring-1 focus:ring-[#176f78]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Floor / Module Unit
                  </label>
                  <select
                    value={addFloor}
                    onChange={e => setAddFloor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2] text-xs font-bold text-[#17343a] focus:outline-none focus:ring-1 focus:ring-[#176f78]"
                  >
                    <option value="Padma Floor">Padma (Floor 1)</option>
                    <option value="Meghna Floor">Meghna (Floor 2)</option>
                    <option value="Karnophuli Floor">Karnophuli (Floor 3)</option>
                    <option value="Korotoya Floor">Korotoya (Floor 4)</option>
                    <option value="Shitalokshya Floor">Shitalokshya (Floor 5)</option>
                    <option value="Turag Floor">Turag (Floor 6)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Buyer / Brand Account
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. H&M, Target, Zara"
                    value={addBuyer}
                    onChange={e => setAddBuyer(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2] text-xs text-[#17343a] focus:outline-none focus:ring-1 focus:ring-[#176f78]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Active Garment Style
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Polo Shirt Classic"
                    value={addStyle}
                    onChange={e => setAddStyle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2] text-xs text-[#17343a] focus:outline-none focus:ring-1 focus:ring-[#176f78]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Standard SMV (Min)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    value={addSmv}
                    onChange={e => setAddSmv(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2] text-xs font-mono-numbers text-[#17343a] focus:outline-none focus:ring-1 focus:ring-[#176f78]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Planned Shift Hours
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="16"
                    value={addWorkingHours}
                    onChange={e => setAddWorkingHours(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2] text-xs font-mono-numbers text-[#17343a] focus:outline-none focus:ring-1 focus:ring-[#176f78]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Target Efficiency %
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={addTargetEff}
                    onChange={e => setAddTargetEff(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2] text-xs font-mono-numbers text-[#17343a] focus:outline-none focus:ring-1 focus:ring-[#176f78]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Initial Floor WIP (Pcs)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={addWip}
                    onChange={e => setAddWip(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2] text-xs font-mono-numbers text-[#17343a] focus:outline-none focus:ring-1 focus:ring-[#176f78]"
                  />
                </div>
              </div>

              {/* Manpower Allocation breakdown */}
              <div className="p-3 rounded-2xl bg-[#fbfaf6] border border-[#e7e1d5] space-y-2">
                <span className="text-[11px] font-bold uppercase text-[#527078] block">
                  Planned Manpower Allocation
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-[#527078]">Operators</label>
                    <input
                      type="number"
                      min="1"
                      value={addOperators}
                      onChange={e => setAddOperators(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#d9d2c2] text-xs font-mono-numbers font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#527078]">Helpers</label>
                    <input
                      type="number"
                      min="0"
                      value={addHelpers}
                      onChange={e => setAddHelpers(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#d9d2c2] text-xs font-mono-numbers font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#527078]">Iron Man</label>
                    <input
                      type="number"
                      min="0"
                      value={addIronMan}
                      onChange={e => setAddIronMan(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#d9d2c2] text-xs font-mono-numbers font-bold"
                    />
                  </div>
                </div>
                <div className="text-[11px] text-[#176f78] font-bold pt-1">
                  Total Planned MP: {(parseInt(addOperators, 10) || 0) + (parseInt(addHelpers, 10) || 0) + (parseInt(addIronMan, 10) || 0)} Operators &amp; Helpers
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                  Remarks / Commissioning Note
                </label>
                <input
                  type="text"
                  value={addRemarks}
                  onChange={e => setAddRemarks(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2] text-xs text-[#17343a] focus:outline-none focus:ring-1 focus:ring-[#176f78]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e7e1d5]">
                <button
                  type="button"
                  onClick={() => setIsAddLineModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#d9d2c2] text-xs font-bold text-[#527078] hover:bg-[#f1eee6] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#176f78] hover:bg-[#125860] text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create &amp; Select Line</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && lineToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-[#d9d2c2] shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold uppercase text-[#17343a]">
                  Delete Sewing Line {lineToDelete.lineNo}?
                </h3>
                <p className="text-xs text-[#527078]">
                  This action permanently removes this line from the factory dataset.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#fbfaf6] border border-[#e7e1d5] text-xs space-y-1.5 text-[#527078]">
              <div><strong>Style:</strong> <span className="text-[#17343a]">{lineToDelete.style}</span></div>
              <div><strong>Buyer:</strong> <span className="text-[#17343a]">{lineToDelete.buyer}</span></div>
              <div><strong>Floor:</strong> <span className="text-[#17343a]">{lineToDelete.floor}</span></div>
              <div><strong>Output:</strong> <span className="text-[#17343a]">{lineToDelete.achievedProd} / {lineToDelete.targetProd} pcs</span></div>
              <div>
                <strong>Efficiency:</strong> <span className="text-[#176f78] font-bold">{lineToDelete.efficiency}%</span> • <strong>WIP:</strong> <span className="text-[#17343a] font-bold">{lineToDelete.wip ?? 0} pcs</span>
              </div>
            </div>

            <p className="text-xs text-rose-700 bg-rose-50/80 p-2.5 rounded-xl border border-rose-200/60">
              Warning: All hourly logs, manpower allocations, bottleneck takt records, and Top 5 data for Line {lineToDelete.lineNo} will be removed.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e7e1d5]">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteConfirmOpen(false);
                  setLineToDelete(null);
                }}
                className="px-4 py-2 rounded-xl border border-[#d9d2c2] text-xs font-bold text-[#527078] hover:bg-[#f1eee6] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* All Lines Directory Table Modal */}
      {isDirectoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-4xl w-full border border-[#d9d2c2] shadow-2xl space-y-4 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#e7e1d5] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-[#dceceb] text-[#176f78]">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold uppercase text-[#17343a]">
                    Factory Sewing Lines Directory
                  </h3>
                  <p className="text-xs text-[#527078]">
                    Overview of all {sortedLines.length} lines sorted by {sortBy.toUpperCase()} ({sortDirection.toUpperCase()}).
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsDirectoryModalOpen(false);
                    handleOpenAddLineModal();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#176f78] text-white hover:bg-[#125860] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsDirectoryModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-[#f1eee6] text-[#527078] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filter and Search Bar inside Directory */}
            <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#527078]" />
                <input
                  type="text"
                  placeholder="Filter by Line #, Buyer, Style or Floor..."
                  value={directorySearch}
                  onChange={e => setDirectorySearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2] text-xs text-[#17343a] focus:outline-none focus:ring-1 focus:ring-[#176f78]"
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[11px] font-bold text-[#527078]">Quick Sort:</span>
                <button
                  type="button"
                  onClick={() => {
                    setSortBy('efficiency');
                    setSortDirection(prev => (sortBy === 'efficiency' && prev === 'desc' ? 'asc' : 'desc'));
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold border transition-colors cursor-pointer ${
                    sortBy === 'efficiency'
                      ? 'bg-[#176f78] text-white border-[#176f78]'
                      : 'bg-[#f1eee6] text-[#527078] border-[#d9d2c2] hover:bg-[#e7e1d5]'
                  }`}
                >
                  Efficiency {sortBy === 'efficiency' ? (sortDirection === 'desc' ? '↓' : '↑') : ''}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSortBy('wip');
                    setSortDirection(prev => (sortBy === 'wip' && prev === 'desc' ? 'asc' : 'desc'));
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold border transition-colors cursor-pointer ${
                    sortBy === 'wip'
                      ? 'bg-[#176f78] text-white border-[#176f78]'
                      : 'bg-[#f1eee6] text-[#527078] border-[#d9d2c2] hover:bg-[#e7e1d5]'
                  }`}
                >
                  WIP Level {sortBy === 'wip' ? (sortDirection === 'desc' ? '↓' : '↑') : ''}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSortBy('lineNo');
                    setSortDirection(prev => (sortBy === 'lineNo' && prev === 'asc' ? 'desc' : 'asc'));
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold border transition-colors cursor-pointer ${
                    sortBy === 'lineNo'
                      ? 'bg-[#176f78] text-white border-[#176f78]'
                      : 'bg-[#f1eee6] text-[#527078] border-[#d9d2c2] hover:bg-[#e7e1d5]'
                  }`}
                >
                  Line # {sortBy === 'lineNo' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-y-auto flex-1 border border-[#e7e1d5] rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#f1eee6] sticky top-0 text-[#17343a] text-[11px] font-bold uppercase tracking-wider border-b border-[#d9d2c2]">
                  <tr>
                    <th className="p-3">Line #</th>
                    <th className="p-3">Floor / Unit</th>
                    <th className="p-3">Buyer &amp; Style</th>
                    <th className="p-3 text-right">SMV</th>
                    <th className="p-3 text-right">Planned MP</th>
                    <th className="p-3 text-right">Output / Target</th>
                    <th className="p-3 text-right">Efficiency</th>
                    <th className="p-3 text-right">WIP Level</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e7e1d5]">
                  {sortedLines
                    .filter(l => {
                      if (!directorySearch) return true;
                      const q = directorySearch.toLowerCase();
                      return (
                        l.lineNo.toLowerCase().includes(q) ||
                        l.buyer.toLowerCase().includes(q) ||
                        l.style.toLowerCase().includes(q) ||
                        l.floor.toLowerCase().includes(q)
                      );
                    })
                    .map(line => {
                      const isCurrent = line.lineNo === selectedLineNo;
                      return (
                        <tr
                          key={line.id}
                          className={`hover:bg-[#fbfaf6] transition-colors ${
                            isCurrent ? 'bg-[#eef7f7]/60 font-semibold' : ''
                          }`}
                        >
                          <td className="p-3 font-bold text-[#17343a]">
                            <span className="inline-flex items-center gap-1.5">
                              Line {line.lineNo}
                              {isCurrent && (
                                <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-[#176f78] text-white">
                                  Active
                                </span>
                              )}
                            </span>
                          </td>
                          <td className="p-3 text-[#527078] text-[11px]">{line.floor}</td>
                          <td className="p-3">
                            <div className="font-bold text-[#17343a]">{line.style}</div>
                            <div className="text-[11px] text-[#527078]">{line.buyer}</div>
                          </td>
                          <td className="p-3 text-right font-mono-numbers text-[#176f78]">
                            {line.smv}m
                          </td>
                          <td className="p-3 text-right font-mono-numbers text-[#527078]">
                            {line.plannedMP}
                          </td>
                          <td className="p-3 text-right font-mono-numbers">
                            <span className="font-bold text-[#17343a]">{line.achievedProd}</span>
                            <span className="text-[#527078]"> / {line.targetProd}</span>
                          </td>
                          <td className="p-3 text-right font-mono-numbers">
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              line.efficiency >= 80
                                ? 'bg-emerald-100 text-emerald-800'
                                : line.efficiency >= 60
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {line.efficiency}%
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono-numbers">
                            <span className={`font-bold ${
                              (line.wip ?? 0) > 350
                                ? 'text-rose-600'
                                : (line.wip ?? 0) > 220
                                ? 'text-amber-600'
                                : 'text-[#17343a]'
                            }`}>
                              {line.wip ?? 0} pcs
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  onSelectLineNo(line.lineNo);
                                  setIsDirectoryModalOpen(false);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-[#f1eee6] hover:bg-[#dceceb] text-[#176f78] text-xs font-bold transition-colors cursor-pointer"
                              >
                                Select
                              </button>
                              {onDeleteLine && (
                                <button
                                  type="button"
                                  onClick={() => handleRequestDelete(line)}
                                  className="p-1 rounded-lg hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                                  title={`Delete Line ${line.lineNo}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
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

      {/* Toast Notification */}
      {toastNotification && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#17343a] text-white shadow-xl text-xs font-bold animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastNotification}</span>
          <button
            type="button"
            onClick={() => setToastNotification(null)}
            className="ml-2 text-white/60 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

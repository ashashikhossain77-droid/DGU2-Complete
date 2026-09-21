/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Activity,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Play,
  Pause,
  Users,
  Gauge,
  Clock,
  ArrowRight,
  Search,
  SlidersHorizontal,
  Layers,
  Info,
  ChevronRight,
  RefreshCw,
  Compass,
  LayoutGrid,
  Map as MapIcon,
  ShieldAlert,
  Eye,
  Check,
  RotateCcw,
  Sparkles,
  Shirt,
  Box,
  Sliders,
  ChevronDown,
  ChevronLeft,
  GripVertical,
  Move,
  ArrowUpDown
} from 'lucide-react';
import { LineEntry, LineStatus, UserProfile } from '../types';

export interface VisualFloorPlanProps {
  lines: LineEntry[];
  onSaveLine: (updatedLine: LineEntry) => void;
  onReorderLines?: (reorderedFloorLines: LineEntry[]) => void;
  onNavigate: (tab: string, lineNo?: string) => void;
  activeDate?: string;
  profile?: UserProfile;
  initialFloor?: string;
  hideTopHeader?: boolean;
  onSwitchToSetup?: (lineNo?: string) => void;
}

// Helper to determine normalized line status
export function getLineStatus(line: LineEntry): LineStatus {
  if (line.status) return line.status;
  if (line.isActive === false) return 'Stopped';
  return 'Active';
}

export const VisualFloorPlan: React.FC<VisualFloorPlanProps> = ({
  lines,
  onSaveLine,
  onReorderLines,
  onNavigate,
  activeDate,
  profile,
  initialFloor,
  hideTopHeader = false,
  onSwitchToSetup
}) => {
  // Extract all unique floors present in dataset
  const availableFloors = useMemo(() => {
    const floorsSet = new Set<string>();
    lines.forEach(l => {
      if (l.floor && l.floor.trim().length > 0) {
        floorsSet.add(l.floor.trim());
      }
    });
    const arr = Array.from(floorsSet);
    if (arr.length === 0) return ['Padma Floor', 'Meghna Floor', 'Korotoya Floor'];
    return arr;
  }, [lines]);

  // Active Floor State
  const [selectedFloor, setSelectedFloor] = useState<string>(() => {
    if (initialFloor && availableFloors.includes(initialFloor)) return initialFloor;
    return availableFloors[0] || 'Padma Floor';
  });

  // Filter & Search States
  const [statusFilter, setStatusFilter] = useState<'ALL' | LineStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'blueprint' | 'stations' | 'compact'>('blueprint');
  
  // Selected line for full inspection modal
  const [inspectingLine, setInspectingLine] = useState<LineEntry | null>(null);

  // Status Change Toast Feedback
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'warning' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'warning' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(prev => (prev?.text === text ? null : prev));
    }, 3200);
  };

  // Local layout order state: map of floorKey -> array of line IDs
  const [customFloorOrder, setCustomFloorOrder] = useState<Record<string, number[]>>(() => {
    const initial: Record<string, number[]> = {};
    if (typeof window !== 'undefined') {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('deb_floor_order_')) {
            const raw = localStorage.getItem(key);
            if (raw) {
              const floorPart = key.replace('deb_floor_order_', '');
              initial[floorPart] = JSON.parse(raw);
            }
          }
        }
      } catch (e) {
        console.error('Error loading floor layout orders', e);
      }
    }
    return initial;
  });

  // Reorder mode toggle for IE managers
  const [isReorderMode, setIsReorderMode] = useState<boolean>(false);

  // Drag and Drop tracking states
  const [draggedLineId, setDraggedLineId] = useState<number | null>(null);
  const [dragOverLineId, setDragOverLineId] = useState<number | null>(null);

  // Filter lines for current floor and active date if applicable, respecting custom IE layout order
  const floorLines = useMemo(() => {
    let result = lines.filter(l => (l.floor || 'Padma Floor').trim() === selectedFloor.trim());
    
    // If activeDate specified, prioritize date matching, else use whatever is in floor
    if (activeDate) {
      const dateFiltered = result.filter(l => l.date === activeDate);
      if (dateFiltered.length > 0) {
        result = dateFiltered;
      }
    }

    const floorKey = selectedFloor.trim().replace(/\s+/g, '_').toLowerCase();
    const savedOrder = customFloorOrder[floorKey];

    // Sort logically: Custom Floor Order -> explicit floorOrder field -> natural numeric ascending
    return result.sort((a, b) => {
      if (savedOrder && savedOrder.length > 0) {
        const idxA = savedOrder.indexOf(a.id);
        const idxB = savedOrder.indexOf(b.id);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
      }

      if (a.floorOrder !== undefined && b.floorOrder !== undefined) {
        return a.floorOrder - b.floorOrder;
      }
      if (a.floorOrder !== undefined) return -1;
      if (b.floorOrder !== undefined) return 1;

      const numA = parseInt(a.lineNo, 10);
      const numB = parseInt(b.lineNo, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.lineNo.localeCompare(b.lineNo);
    });
  }, [lines, selectedFloor, activeDate, customFloorOrder]);

  // Handle Drag & Drop reordering between lines
  const handleReorder = (draggedId: number, targetId: number) => {
    if (draggedId === targetId) return;

    const currentList = [...floorLines];
    const fromIndex = currentList.findIndex(l => l.id === draggedId);
    const toIndex = currentList.findIndex(l => l.id === targetId);

    if (fromIndex === -1 || toIndex === -1) return;

    const [movedItem] = currentList.splice(fromIndex, 1);
    currentList.splice(toIndex, 0, movedItem);

    const updatedWithOrder = currentList.map((l, index) => ({
      ...l,
      floorOrder: index + 1
    }));

    const floorKey = selectedFloor.trim().replace(/\s+/g, '_').toLowerCase();
    const newIdOrder = updatedWithOrder.map(l => l.id);

    setCustomFloorOrder(prev => ({
      ...prev,
      [floorKey]: newIdOrder
    }));

    try {
      localStorage.setItem(`deb_floor_order_${floorKey}`, JSON.stringify(newIdOrder));
    } catch (e) {
      console.error('Failed to save floor order to localStorage', e);
    }

    if (onReorderLines) {
      onReorderLines(updatedWithOrder);
    } else {
      updatedWithOrder.forEach(l => onSaveLine(l));
    }

    showToast(`Line ${movedItem.lineNo} moved to Bay #${toIndex + 1} on ${selectedFloor}`, 'success');
  };

  // Move line one slot backward or forward
  const handleMoveLineStep = (lineId: number, direction: 'up' | 'down') => {
    const currentList = [...floorLines];
    const idx = currentList.findIndex(l => l.id === lineId);
    if (idx === -1) return;

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= currentList.length) return;

    const targetId = currentList[targetIdx].id;
    handleReorder(lineId, targetId);
  };

  // Reset floor order to standard numeric ascending (Line 1, 2, 3...)
  const handleResetFloorOrder = () => {
    const floorKey = selectedFloor.trim().replace(/\s+/g, '_').toLowerCase();
    
    const sorted = [...floorLines].sort((a, b) => {
      const numA = parseInt(a.lineNo, 10);
      const numB = parseInt(b.lineNo, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.lineNo.localeCompare(b.lineNo);
    });

    const updatedWithOrder = sorted.map((l, index) => ({
      ...l,
      floorOrder: index + 1
    }));

    setCustomFloorOrder(prev => {
      const next = { ...prev };
      delete next[floorKey];
      return next;
    });

    try {
      localStorage.removeItem(`deb_floor_order_${floorKey}`);
    } catch (e) {
      console.error('Failed to clear floor order in localStorage', e);
    }

    if (onReorderLines) {
      onReorderLines(updatedWithOrder);
    } else {
      updatedWithOrder.forEach(l => onSaveLine(l));
    }

    showToast(`Floor layout reset to default numerical sequence (Line 1-${floorLines.length})`, 'warning');
  };

  // Aggregated Floor Telemetry
  const floorMetrics = useMemo(() => {
    const total = floorLines.length;
    let active = 0;
    let maintenance = 0;
    let stopped = 0;
    let totalTarget = 0;
    let totalAchieved = 0;
    let totalMP = 0;
    let sumEff = 0;
    let bottlenecksCount = 0;

    floorLines.forEach(l => {
      const st = getLineStatus(l);
      if (st === 'Active') active++;
      else if (st === 'Maintenance') maintenance++;
      else if (st === 'Stopped') stopped++;

      totalTarget += l.targetProd || 0;
      totalAchieved += l.achievedProd || 0;
      totalMP += l.plannedMP || 0;
      sumEff += l.efficiency || 0;

      if (l.bottleneck && (l.bottleneck.status === 'critical' || l.bottleneck.status === 'high')) {
        bottlenecksCount++;
      }
    });

    const avgEff = total > 0 ? Math.round(sumEff / total) : 0;
    const outputPct = totalTarget > 0 ? Math.round((totalAchieved / totalTarget) * 100) : 0;

    return {
      total,
      active,
      maintenance,
      stopped,
      totalTarget,
      totalAchieved,
      totalMP,
      avgEff,
      outputPct,
      bottlenecksCount
    };
  }, [floorLines]);

  // Apply search and status filter to displayed lines
  const displayedLines = useMemo(() => {
    return floorLines.filter(l => {
      const st = getLineStatus(l);
      if (statusFilter !== 'ALL' && st !== statusFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesLineNo = l.lineNo.toLowerCase().includes(q);
        const matchesStyle = (l.style || '').toLowerCase().includes(q);
        const matchesBuyer = (l.buyer || '').toLowerCase().includes(q);
        const matchesApartment = (l.apartment || '').toLowerCase().includes(q);
        return matchesLineNo || matchesStyle || matchesBuyer || matchesApartment;
      }
      return true;
    });
  }, [floorLines, statusFilter, searchQuery]);

  // Handler to toggle status of an individual line
  const handleSetLineStatus = (line: LineEntry, newStatus: LineStatus, reason?: string) => {
    const currentStatus = getLineStatus(line);
    if (currentStatus === newStatus && !reason) return;

    const updatedLine: LineEntry = {
      ...line,
      status: newStatus,
      isActive: newStatus === 'Active',
      statusReason: reason || (newStatus === 'Active' ? 'Running scheduled production' : newStatus === 'Maintenance' ? 'Mechanical tuning / machine maintenance' : 'Line stopped / idle')
    };

    onSaveLine(updatedLine);

    if (inspectingLine?.id === line.id) {
      setInspectingLine(updatedLine);
    }

    const type = newStatus === 'Active' ? 'success' : newStatus === 'Maintenance' ? 'warning' : 'error';
    showToast(`Line ${line.lineNo} set to ${newStatus.toUpperCase()}`, type);
  };

  // Batch status update for all lines on current floor
  const handleBatchStatus = (newStatus: LineStatus) => {
    floorLines.forEach(line => {
      const updatedLine: LineEntry = {
        ...line,
        status: newStatus,
        isActive: newStatus === 'Active',
        statusReason: `Batch updated all lines on ${selectedFloor} to ${newStatus}`
      };
      onSaveLine(updatedLine);
    });
    showToast(`All ${floorLines.length} lines on ${selectedFloor} set to ${newStatus.toUpperCase()}`, newStatus === 'Active' ? 'success' : 'warning');
  };

  return (
    <div id="visual-floor-plan-container" className="space-y-6 animate-fadeIn pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 animate-slideDown">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl border text-sm font-semibold text-white ${
              toastMessage.type === 'success'
                ? 'bg-emerald-600 border-emerald-500'
                : toastMessage.type === 'warning'
                ? 'bg-amber-600 border-amber-500'
                : 'bg-rose-600 border-rose-500'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : toastMessage.type === 'warning' ? (
              <Wrench className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Top Header Card: Title, Floor Tabs, and Floor Level KPI Cockpit */}
      <div className="bg-white border border-[#d9d2c2] rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#e7e1d5] pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-[#176f78]/10 text-[#176f78] border border-[#176f78]/30">
                INDUSTRIAL COCKPIT
              </span>
              <span className="text-xs text-[#527078] font-mono-numbers">
                {activeDate || 'Live Factory State'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#17343a] tracking-tight uppercase font-display flex items-center gap-2.5">
              <LayoutGrid className="w-6 h-6 text-[#176f78]" />
              Visual Sewing Floor Plan & Line Map
            </h1>
            <p className="text-xs sm:text-sm text-[#527078] mt-0.5">
              Interactive schematic map of sewing lines, operator workstations, real-time output pacing, and line operational state control.
            </p>
          </div>

          {/* Quick Batch Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="batch-all-active-btn"
              onClick={() => handleBatchStatus('Active')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition-all cursor-pointer shadow-2xs"
              title="Set all lines on this floor to Active"
            >
              <Play className="w-3.5 h-3.5 fill-emerald-700" />
              <span>All Active</span>
            </button>
            <button
              id="batch-all-maint-btn"
              onClick={() => handleBatchStatus('Maintenance')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold transition-all cursor-pointer shadow-2xs"
              title="Set all lines on this floor to Maintenance"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Shift Maintenance</span>
            </button>
            <button
              id="navigate-lines-config-btn"
              onClick={() => (onSwitchToSetup ? onSwitchToSetup() : onNavigate('line-management'))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#17343a] text-[#fbfaf6] hover:bg-[#1f434b] text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Line Configuration</span>
            </button>

            {/* IE Physical Layout Rearrangement Mode Toggle */}
            <button
              id="toggle-reorder-mode-btn"
              onClick={() => setIsReorderMode(prev => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs border ${
                isReorderMode
                  ? 'bg-[#176f78] text-white border-[#176f78] ring-2 ring-[#176f78]/30 shadow-sm'
                  : 'bg-white hover:bg-[#f1eee6] text-[#17343a] border-[#d9d2c2]'
              }`}
              title="Toggle drag-and-drop floor rearrangement mode"
            >
              <GripVertical className="w-3.5 h-3.5" />
              <span>{isReorderMode ? 'Rearrange Mode (Active)' : 'Rearrange Layout'}</span>
            </button>

            <button
              id="reset-floor-order-btn"
              onClick={handleResetFloorOrder}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#f1eee6] text-[#527078] hover:text-[#17343a] border border-[#d9d2c2] text-xs font-bold transition-all cursor-pointer shadow-2xs"
              title="Reset layout order on this floor to default numerical sequence"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Order</span>
            </button>
          </div>
        </div>

        {/* Floor Selection Tabs */}
        <div className="mt-5 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
            <span className="text-xs font-bold uppercase text-[#527078] mr-1 shrink-0 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#176f78]" /> Floor:
            </span>
            {availableFloors.map(floorName => {
              const count = lines.filter(l => (l.floor || '').trim() === floorName.trim()).length;
              const isSelected = selectedFloor === floorName;
              return (
                <button
                  key={floorName}
                  id={`floor-tab-${floorName.replace(/\s+/g, '-').toLowerCase()}`}
                  onClick={() => setSelectedFloor(floorName)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 border ${
                    isSelected
                      ? 'bg-[#176f78] text-white border-[#176f78] shadow-sm'
                      : 'bg-[#fbfaf6] text-[#17343a] border-[#d9d2c2] hover:bg-[#f1eee6]'
                  }`}
                >
                  <span>{floorName}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono-numbers ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-[#e7e1d5] text-[#527078]'
                    }`}
                  >
                    {count} Lines
                  </span>
                </button>
              );
            })}
          </div>

          {/* View Mode Segment */}
          <div className="flex items-center gap-1 bg-[#f1eee6] p-1 rounded-xl border border-[#d9d2c2] text-xs font-semibold">
            <button
              onClick={() => setViewMode('blueprint')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'blueprint'
                  ? 'bg-white text-[#17343a] shadow-xs font-bold'
                  : 'text-[#527078] hover:text-[#17343a]'
              }`}
              title="Spatial Floor Map Layout"
            >
              <Compass className="w-3.5 h-3.5 text-[#176f78]" />
              <span className="hidden sm:inline">Floor Blueprint</span>
            </button>
            <button
              onClick={() => setViewMode('stations')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'stations'
                  ? 'bg-white text-[#17343a] shadow-xs font-bold'
                  : 'text-[#527078] hover:text-[#17343a]'
              }`}
              title="Station Conveyor View"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#176f78]" />
              <span className="hidden sm:inline">Workstations</span>
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'compact'
                  ? 'bg-white text-[#17343a] shadow-xs font-bold'
                  : 'text-[#527078] hover:text-[#17343a]'
              }`}
              title="Compact Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-[#176f78]" />
              <span className="hidden sm:inline">Compact</span>
            </button>
          </div>
        </div>

        {/* Floor Level Live Telemetry Counters */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Active Status Card */}
          <div
            onClick={() => setStatusFilter(statusFilter === 'Active' ? 'ALL' : 'Active')}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              statusFilter === 'Active'
                ? 'bg-emerald-100 border-emerald-500 shadow-xs'
                : 'bg-emerald-50/70 border-emerald-200/80 hover:bg-emerald-100/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase text-emerald-800 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Active Lines
              </span>
              <Play className="w-3.5 h-3.5 text-emerald-700 fill-emerald-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-emerald-950 font-mono-numbers">
                {floorMetrics.active}
              </span>
              <span className="text-xs text-emerald-700 font-medium font-mono-numbers">
                / {floorMetrics.total} lines
              </span>
            </div>
          </div>

          {/* Maintenance Card */}
          <div
            onClick={() => setStatusFilter(statusFilter === 'Maintenance' ? 'ALL' : 'Maintenance')}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              statusFilter === 'Maintenance'
                ? 'bg-amber-100 border-amber-500 shadow-xs'
                : 'bg-amber-50/70 border-amber-200/80 hover:bg-amber-100/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase text-amber-800 flex items-center gap-1">
                <Wrench className="w-3 h-3 text-amber-700" />
                Maintenance
              </span>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-amber-950 font-mono-numbers">
                {floorMetrics.maintenance}
              </span>
              <span className="text-xs text-amber-700 font-medium font-mono-numbers">
                repairing
              </span>
            </div>
          </div>

          {/* Stopped Card */}
          <div
            onClick={() => setStatusFilter(statusFilter === 'Stopped' ? 'ALL' : 'Stopped')}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              statusFilter === 'Stopped'
                ? 'bg-rose-100 border-rose-500 shadow-xs'
                : 'bg-rose-50/70 border-rose-200/80 hover:bg-rose-100/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase text-rose-800 flex items-center gap-1">
                <XCircle className="w-3 h-3 text-rose-700" />
                Stopped
              </span>
              <Pause className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-rose-950 font-mono-numbers">
                {floorMetrics.stopped}
              </span>
              <span className="text-xs text-rose-700 font-medium font-mono-numbers">
                halted
              </span>
            </div>
          </div>

          {/* Floor Efficiency */}
          <div className="p-3 rounded-xl border border-[#d9d2c2] bg-[#fbfaf6]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase text-[#527078]">
                Floor Efficiency
              </span>
              <Gauge className="w-3.5 h-3.5 text-[#176f78]" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-[#17343a] font-mono-numbers">
                {floorMetrics.avgEff}%
              </span>
              <span className="text-[11px] text-[#527078]">avg floor rate</span>
            </div>
          </div>

          {/* Floor Output vs Target */}
          <div className="p-3 rounded-xl border border-[#d9d2c2] bg-[#fbfaf6]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase text-[#527078]">
                Live Output Pcs
              </span>
              <Shirt className="w-3.5 h-3.5 text-[#176f78]" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-[#17343a] font-mono-numbers">
                {floorMetrics.totalAchieved.toLocaleString()}
              </span>
              <span className="text-xs text-[#527078] font-mono-numbers">
                / {floorMetrics.totalTarget.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Total Floor Manpower */}
          <div className="p-3 rounded-xl border border-[#d9d2c2] bg-[#fbfaf6]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase text-[#527078]">
                Floor Manpower
              </span>
              <Users className="w-3.5 h-3.5 text-[#176f78]" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-[#17343a] font-mono-numbers">
                {floorMetrics.totalMP}
              </span>
              <span className="text-[11px] text-[#527078]">operators & helpers</span>
            </div>
          </div>
        </div>

        {/* Filter / Search Bar */}
        <div className="mt-5 pt-4 border-t border-[#e7e1d5] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#527078] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by line #, style, or buyer..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#fbfaf6] border border-[#d9d2c2] rounded-xl text-xs text-[#17343a] placeholder-[#527078] focus:outline-hidden focus:border-[#176f78]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1">
            <span className="text-[11px] font-bold uppercase text-[#527078] shrink-0">Filter Status:</span>
            {(['ALL', 'Active', 'Maintenance', 'Stopped'] as const).map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 border ${
                  statusFilter === st
                    ? st === 'Active'
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : st === 'Maintenance'
                      ? 'bg-amber-700 text-white border-amber-700'
                      : st === 'Stopped'
                      ? 'bg-rose-700 text-white border-rose-700'
                      : 'bg-[#17343a] text-white border-[#17343a]'
                    : 'bg-white border-[#d9d2c2] text-[#527078] hover:bg-[#f1eee6]'
                }`}
              >
                {st === 'ALL' ? 'All Lines' : st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Floor Blueprint / Spatial Schematic Canvas */}
      <div className="bg-[#fbfaf6] border border-[#d9d2c2] rounded-3xl p-4 sm:p-7 shadow-xs relative overflow-hidden">
        {/* IE Shop Floor Rearrange Mode Active Guidance Banner */}
        {isReorderMode && (
          <div className="mb-5 p-3.5 sm:p-4 rounded-2xl bg-[#eef8f9] border border-[#176f78]/40 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#176f78] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Move className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-[#17343a] uppercase text-xs tracking-wide">
                    IE Shop-Floor Physical Rearrangement Active
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#176f78]/15 text-[#176f78]">
                    Drag & Drop Enabled
                  </span>
                </div>
                <p className="text-xs text-[#527078] mt-0.5">
                  Grab any line card or grip handle to physically rearrange virtual bay positions across the shop floor. Changes persist automatically.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={handleResetFloorOrder}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-[#d9d2c2] text-xs font-bold text-[#527078] hover:text-[#17343a] transition-colors cursor-pointer"
                title="Reset to 1, 2, 3... order"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset 1-N</span>
              </button>
              <button
                type="button"
                onClick={() => setIsReorderMode(false)}
                className="px-3 py-1.5 rounded-lg bg-[#176f78] text-white text-xs font-bold hover:bg-[#125860] transition-colors cursor-pointer shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Architectural Factory Markers */}
        <div className="flex items-center justify-between border-b-2 border-dashed border-[#d9d2c2] pb-3 mb-6 text-[11px] font-extrabold uppercase text-[#527078] font-mono-numbers">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#176f78]/30"></span>
            <span>WEST BAY: MATERIAL SUPPLY & BUNDLE LOADING ZONE</span>
          </div>
          <div className="flex items-center gap-3">
            <span>FLOOR: {selectedFloor.toUpperCase()}</span>
            <span>•</span>
            <span>MAIN GANGWAY (3.5M CLEAR AISLE)</span>
          </div>
          <div className="flex items-center gap-2">
            <span>EAST BAY: QUALITY AUDIT & FINISHED GOODS</span>
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-700/30"></span>
          </div>
        </div>

        {/* Empty State */}
        {displayedLines.length === 0 && (
          <div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-[#d9d2c2]">
            <Layers className="w-12 h-12 text-[#527078]/40 mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#17343a] uppercase font-display">
              No sewing lines match current criteria
            </h3>
            <p className="text-xs text-[#527078] mt-1 max-w-md mx-auto">
              Try adjusting your status filter or search query, or select another production floor.
            </p>
            <button
              onClick={() => {
                setStatusFilter('ALL');
                setSearchQuery('');
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-[#176f78] text-white text-xs font-bold hover:bg-[#125860] transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Lines Grid: Blueprint Spatial View */}
        {displayedLines.length > 0 && viewMode === 'blueprint' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {displayedLines.map((line, idx) => {
              const status = getLineStatus(line);
              const isActive = status === 'Active';
              const isMaintenance = status === 'Maintenance';
              const isStopped = status === 'Stopped';

              const effColor =
                line.efficiency >= 60
                  ? 'text-emerald-700'
                  : line.efficiency >= 40
                  ? 'text-amber-700'
                  : 'text-rose-700';

              const effBg =
                line.efficiency >= 60
                  ? 'bg-emerald-500'
                  : line.efficiency >= 40
                  ? 'bg-amber-500'
                  : 'bg-rose-500';

              return (
                <div
                  key={line.id}
                  id={`floor-line-card-${line.lineNo}`}
                  draggable={isReorderMode}
                  onDragStart={e => {
                    e.dataTransfer.setData('text/plain', String(line.id));
                    e.dataTransfer.effectAllowed = 'move';
                    setDraggedLineId(line.id);
                  }}
                  onDragOver={e => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (dragOverLineId !== line.id) {
                      setDragOverLineId(line.id);
                    }
                  }}
                  onDragLeave={e => {
                    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                    if (dragOverLineId === line.id) {
                      setDragOverLineId(null);
                    }
                  }}
                  onDrop={e => {
                    e.preventDefault();
                    const sourceIdStr = e.dataTransfer.getData('text/plain');
                    const sourceId = sourceIdStr ? parseInt(sourceIdStr, 10) : draggedLineId;
                    if (sourceId && sourceId !== line.id) {
                      handleReorder(sourceId, line.id);
                    }
                    setDraggedLineId(null);
                    setDragOverLineId(null);
                  }}
                  onDragEnd={() => {
                    setDraggedLineId(null);
                    setDragOverLineId(null);
                  }}
                  className={`relative rounded-2xl border-2 transition-all shadow-xs overflow-hidden flex flex-col justify-between ${
                    draggedLineId === line.id
                      ? 'opacity-40 scale-[0.98] border-dashed border-[#176f78] bg-[#f0f9fa]'
                      : dragOverLineId === line.id
                      ? 'ring-4 ring-[#176f78]/30 border-2 border-[#176f78] bg-[#eef8f9] shadow-lg scale-[1.01]'
                      : isActive
                      ? 'bg-white border-emerald-500/80 hover:shadow-md'
                      : isMaintenance
                      ? 'bg-amber-50/40 border-amber-500/80 hover:shadow-md'
                      : 'bg-slate-50 border-rose-400/70 hover:shadow-md'
                  }`}
                >
                  {/* Top Status Accent Bar */}
                  <div
                    className={`h-2 w-full ${
                      isActive
                        ? 'bg-emerald-500'
                        : isMaintenance
                        ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600'
                        : 'bg-rose-500'
                    }`}
                  />

                  {/* Drop Target Indicator Bar */}
                  {dragOverLineId === line.id && draggedLineId !== line.id && (
                    <div className="bg-[#176f78] text-white text-xs font-bold py-1.5 px-3 flex items-center justify-center gap-2 shadow-inner animate-pulse">
                      <ArrowUpDown className="w-3.5 h-3.5" />
                      <span>Drop to place before Line {line.lineNo} (Bay Slot #{idx + 1})</span>
                    </div>
                  )}

                  {/* Card Main Body */}
                  <div className="p-4 sm:p-5 space-y-4">
                    {/* Line Header: Line Number, Apartment, Style, and Live Status Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-display border shadow-xs ${
                            isActive
                              ? 'bg-emerald-700 text-white border-emerald-800'
                              : isMaintenance
                              ? 'bg-amber-600 text-white border-amber-700'
                              : 'bg-rose-700 text-white border-rose-800'
                          }`}
                        >
                          <span className="text-[10px] uppercase font-bold tracking-wider leading-none">Line</span>
                          <span className="text-xl font-black font-mono-numbers leading-none mt-0.5">
                            {line.lineNo}
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-display font-extrabold text-base text-[#17343a] uppercase tracking-tight">
                              Line {line.lineNo}
                            </h3>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#e7e1d5] text-[#527078] border border-[#d9d2c2]">
                              {line.apartment || `Bay ${(idx % 6) + 1}`}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-[#17343a] truncate max-w-[240px] sm:max-w-xs mt-0.5">
                            {line.style || 'Standard Garment Assembly'}
                          </p>
                          <p className="text-[11px] text-[#527078]">
                            Buyer: <span className="font-bold text-[#17343a]">{line.buyer}</span> • SMV: <span className="font-mono-numbers font-bold text-[#176f78]">{line.smv}m</span>
                          </p>
                        </div>
                      </div>

                      {/* Header Controls: Drag Handle, Slot Number, Shift Buttons & Status Badge */}
                      <div className="flex flex-col items-end gap-2">
                        {/* Drag Handle & Step Shift Controls */}
                        <div className="flex items-center gap-1.5">
                          <div
                            draggable={true}
                            onDragStart={e => {
                              e.stopPropagation();
                              e.dataTransfer.setData('text/plain', String(line.id));
                              e.dataTransfer.effectAllowed = 'move';
                              setDraggedLineId(line.id);
                            }}
                            className="px-2 py-1 rounded-lg bg-[#f1eee6] hover:bg-[#e7e1d5] text-[#527078] hover:text-[#17343a] cursor-grab active:cursor-grabbing transition-colors border border-[#d9d2c2] flex items-center gap-1 shrink-0 select-none shadow-2xs"
                            title={`Drag to reposition Line ${line.lineNo} (Bay Slot #${idx + 1})`}
                          >
                            <GripVertical className="w-3.5 h-3.5 text-[#176f78]" />
                            <span className="text-[10px] font-mono-numbers font-extrabold text-[#17343a]">
                              Bay #{idx + 1}
                            </span>
                          </div>

                          <div className="flex items-center border border-[#d9d2c2] rounded-lg overflow-hidden bg-white shadow-2xs">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={e => {
                                e.stopPropagation();
                                handleMoveLineStep(line.id, 'up');
                              }}
                              className="p-1 hover:bg-[#f1eee6] text-[#527078] hover:text-[#17343a] disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                              title="Shift line backward 1 bay slot"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === displayedLines.length - 1}
                              onClick={e => {
                                e.stopPropagation();
                                handleMoveLineStep(line.id, 'down');
                              }}
                              className="p-1 hover:bg-[#f1eee6] text-[#527078] hover:text-[#17343a] disabled:opacity-25 disabled:cursor-not-allowed transition-colors border-l border-[#d9d2c2]"
                              title="Shift line forward 1 bay slot"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase border ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              : isMaintenance
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-rose-100 text-rose-900 border-rose-300'
                          }`}
                        >
                          {isActive && (
                            <>
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              <span>Active</span>
                            </>
                          )}
                          {isMaintenance && (
                            <>
                              <Wrench className="w-3.5 h-3.5 text-amber-700" />
                              <span>Maintenance</span>
                            </>
                          )}
                          {isStopped && (
                            <>
                              <XCircle className="w-3.5 h-3.5 text-rose-700" />
                              <span>Stopped</span>
                            </>
                          )}
                        </div>
                        {line.statusReason && (
                          <span className="text-[10px] text-[#527078] max-w-[140px] truncate text-right" title={line.statusReason}>
                            {line.statusReason}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Interactive 3-Way Status Toggle Segment Control */}
                    <div className="bg-[#f1eee6] p-1.5 rounded-xl border border-[#d9d2c2]">
                      <div className="flex items-center justify-between mb-1.5 px-1">
                        <span className="text-[10px] font-bold uppercase text-[#527078] tracking-wider">
                          Toggle Operational Status:
                        </span>
                        <span className="text-[10px] font-mono-numbers font-semibold text-[#176f78]">
                          1-Click Instant State
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {/* ACTIVE BUTTON */}
                        <button
                          type="button"
                          id={`line-${line.lineNo}-status-active-btn`}
                          onClick={() => handleSetLineStatus(line, 'Active')}
                          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-extrabold uppercase transition-all cursor-pointer border ${
                            isActive
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                              : 'bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-50'
                          }`}
                        >
                          <Play className={`w-3 h-3 ${isActive ? 'fill-white' : 'fill-emerald-700'}`} />
                          <span>Active</span>
                        </button>

                        {/* MAINTENANCE BUTTON */}
                        <button
                          type="button"
                          id={`line-${line.lineNo}-status-maint-btn`}
                          onClick={() => handleSetLineStatus(line, 'Maintenance')}
                          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-extrabold uppercase transition-all cursor-pointer border ${
                            isMaintenance
                              ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                              : 'bg-white text-amber-800 border-amber-200 hover:bg-amber-50'
                          }`}
                        >
                          <Wrench className="w-3 h-3" />
                          <span>Maintenance</span>
                        </button>

                        {/* STOPPED BUTTON */}
                        <button
                          type="button"
                          id={`line-${line.lineNo}-status-stopped-btn`}
                          onClick={() => handleSetLineStatus(line, 'Stopped')}
                          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-extrabold uppercase transition-all cursor-pointer border ${
                            isStopped
                              ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                              : 'bg-white text-rose-800 border-rose-200 hover:bg-rose-50'
                          }`}
                        >
                          <Pause className="w-3 h-3" />
                          <span>Stopped</span>
                        </button>
                      </div>
                    </div>

                    {/* Workstation Conveyor Schematic */}
                    <div className="bg-[#fbfaf6] border border-[#d9d2c2] rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-[#17343a] flex items-center gap-1.5">
                          <Box className="w-3.5 h-3.5 text-[#176f78]" />
                          Sewing Line Machine Flow (Input &rarr; Output)
                        </span>
                        <span className="font-mono-numbers text-[#527078]">
                          {line.plannedMP} Present MP
                        </span>
                      </div>

                      {/* Visual Conveyor Track */}
                      <div className="relative py-2 px-1">
                        {/* Central Conveyor Belt Line */}
                        <div className="absolute top-1/2 left-4 right-4 h-1.5 -translate-y-1/2 bg-[#d9d2c2] rounded-full overflow-hidden">
                          {isActive && (
                            <div className="w-full h-full bg-linear-to-r from-emerald-300 via-emerald-500 to-emerald-400 animate-pulse" />
                          )}
                          {isMaintenance && (
                            <div className="w-full h-full bg-amber-400" />
                          )}
                        </div>

                        {/* Station Nodes along the line */}
                        <div className="relative flex items-center justify-between text-center gap-1">
                          {/* Node 1: Input Station */}
                          <div className="flex flex-col items-center">
                            <div className="w-7 h-7 rounded-lg bg-white border border-[#d9d2c2] flex items-center justify-center shadow-2xs text-[10px] font-bold text-[#17343a]">
                              IN
                            </div>
                            <span className="text-[9px] font-mono-numbers text-[#527078] mt-1">
                              {line.dailyInput || line.targetProd}p
                            </span>
                          </div>

                          {/* Node 2: Sewing Prep / SNLS */}
                          <div className="flex flex-col items-center">
                            <div className="w-7 h-7 rounded-lg bg-white border border-[#d9d2c2] flex items-center justify-center shadow-2xs text-[10px] font-bold text-[#176f78]">
                              SNLS
                            </div>
                            <span className="text-[9px] text-[#527078] mt-1">
                              {line.mp?.Operator?.present || Math.round(line.plannedMP * 0.7)}op
                            </span>
                          </div>

                          {/* Node 3: Bottleneck Station (Highlighted) */}
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-8 h-8 rounded-lg border flex items-center justify-center shadow-xs text-[10px] font-extrabold ${
                                line.bottleneck?.status === 'critical'
                                  ? 'bg-rose-100 border-rose-500 text-rose-800 animate-pulse'
                                  : line.bottleneck?.status === 'high'
                                  ? 'bg-amber-100 border-amber-500 text-amber-800'
                                  : 'bg-emerald-100 border-emerald-500 text-emerald-800'
                              }`}
                              title={`Bottleneck Station: ${line.bottleneck?.station || 'None'}`}
                            >
                              BN
                            </div>
                            <span className="text-[9px] font-bold text-rose-700 mt-1 truncate max-w-[60px]">
                              {line.bottleneck?.cycleTime ? `${line.bottleneck.cycleTime}s` : 'OK'}
                            </span>
                          </div>

                          {/* Node 4: Overlock / Assembly */}
                          <div className="flex flex-col items-center">
                            <div className="w-7 h-7 rounded-lg bg-white border border-[#d9d2c2] flex items-center justify-center shadow-2xs text-[10px] font-bold text-[#176f78]">
                              O/L
                            </div>
                            <span className="text-[9px] text-[#527078] mt-1">
                              {line.mp?.Helper?.present || 8}hlp
                            </span>
                          </div>

                          {/* Node 5: Iron & Finishing */}
                          <div className="flex flex-col items-center">
                            <div className="w-7 h-7 rounded-lg bg-white border border-[#d9d2c2] flex items-center justify-center shadow-2xs text-[10px] font-bold text-[#17343a]">
                              IRON
                            </div>
                            <span className="text-[9px] text-[#527078] mt-1">
                              {line.mp?.['Iron Man']?.present || 3}im
                            </span>
                          </div>

                          {/* Node 6: Output / QC Station */}
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-7 h-7 rounded-lg border flex items-center justify-center shadow-2xs text-[10px] font-bold ${
                                isActive
                                  ? 'bg-emerald-700 text-white border-emerald-800'
                                  : 'bg-slate-700 text-white border-slate-800'
                              }`}
                            >
                              QC
                            </div>
                            <span className="text-[9px] font-mono-numbers font-bold text-emerald-700 mt-1">
                              {line.achievedProd}p
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Bottleneck Warning Note if High or Critical */}
                      {line.bottleneck && (line.bottleneck.status === 'critical' || line.bottleneck.status === 'high') && (
                        <div className="flex items-center gap-1.5 p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px]">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                          <span className="truncate">
                            <span className="font-bold">Bottleneck:</span> {line.bottleneck.station} ({line.bottleneck.cycleTime}s vs {line.bottleneck.targetCT}s)
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Progress Bar & Output Telemetry */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#17343a]">
                          Efficiency: <span className={`font-mono-numbers font-black ${effColor}`}>{line.efficiency}%</span>
                          <span className="text-[10px] font-normal text-[#527078] ml-1">(Target: {line.targetEff}%)</span>
                        </span>
                        <span className="font-mono-numbers font-bold text-[#17343a]">
                          {line.achievedProd} / {line.targetProd} pcs
                        </span>
                      </div>

                      <div className="w-full h-2 rounded-full bg-[#e7e1d5] overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${effBg}`}
                          style={{ width: `${Math.min(100, Math.max(5, (line.achievedProd / (line.targetProd || 1)) * 100))}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="bg-[#f1eee6] border-t border-[#d9d2c2] px-4 py-2.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setInspectingLine(line)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-[#d9d2c2] text-xs font-bold text-[#17343a] hover:bg-[#fbfaf6] transition-colors cursor-pointer shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#176f78]" />
                        <span>Inspect Line</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onNavigate('linedata', line.lineNo)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-[#d9d2c2] text-xs font-bold text-[#17343a] hover:bg-[#fbfaf6] transition-colors cursor-pointer shadow-2xs"
                      >
                        <Layers className="w-3.5 h-3.5 text-[#176f78]" />
                        <span className="hidden sm:inline">Balancing</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-[#527078]">Line Chief:</span>
                      <span className="text-[11px] font-bold text-[#17343a]">
                        {line.lineIE?.name || 'Assigned Lead'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Stations Conveyor List View */}
        {displayedLines.length > 0 && viewMode === 'stations' && (
          <div className="space-y-4">
            {displayedLines.map((line, idx) => {
              const status = getLineStatus(line);
              return (
                <div
                  key={line.id}
                  id={`floor-line-station-${line.lineNo}`}
                  draggable={isReorderMode}
                  onDragStart={e => {
                    e.dataTransfer.setData('text/plain', String(line.id));
                    e.dataTransfer.effectAllowed = 'move';
                    setDraggedLineId(line.id);
                  }}
                  onDragOver={e => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (dragOverLineId !== line.id) {
                      setDragOverLineId(line.id);
                    }
                  }}
                  onDragLeave={e => {
                    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                    if (dragOverLineId === line.id) {
                      setDragOverLineId(null);
                    }
                  }}
                  onDrop={e => {
                    e.preventDefault();
                    const sourceIdStr = e.dataTransfer.getData('text/plain');
                    const sourceId = sourceIdStr ? parseInt(sourceIdStr, 10) : draggedLineId;
                    if (sourceId && sourceId !== line.id) {
                      handleReorder(sourceId, line.id);
                    }
                    setDraggedLineId(null);
                    setDragOverLineId(null);
                  }}
                  onDragEnd={() => {
                    setDraggedLineId(null);
                    setDragOverLineId(null);
                  }}
                  className={`bg-white border rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
                    draggedLineId === line.id
                      ? 'opacity-40 border-dashed border-[#176f78] bg-[#f0f9fa]'
                      : dragOverLineId === line.id
                      ? 'ring-4 ring-[#176f78]/30 border-2 border-[#176f78] bg-[#eef8f9] shadow-md'
                      : 'border-[#d9d2c2]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Drag Handle & Step Shift Controls */}
                    <div className="flex items-center gap-1 shrink-0">
                      <div
                        draggable={true}
                        onDragStart={e => {
                          e.stopPropagation();
                          e.dataTransfer.setData('text/plain', String(line.id));
                          e.dataTransfer.effectAllowed = 'move';
                          setDraggedLineId(line.id);
                        }}
                        className="px-2 py-1 rounded-lg bg-[#f1eee6] hover:bg-[#e7e1d5] text-[#527078] hover:text-[#17343a] cursor-grab active:cursor-grabbing transition-colors border border-[#d9d2c2] flex items-center gap-1 select-none shadow-2xs"
                        title={`Drag to reposition Line ${line.lineNo} (Bay Slot #${idx + 1})`}
                      >
                        <GripVertical className="w-3.5 h-3.5 text-[#176f78]" />
                        <span className="text-[10px] font-mono-numbers font-extrabold text-[#17343a]">
                          #{idx + 1}
                        </span>
                      </div>

                      <div className="flex items-center border border-[#d9d2c2] rounded-lg overflow-hidden bg-white shadow-2xs">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={e => {
                            e.stopPropagation();
                            handleMoveLineStep(line.id, 'up');
                          }}
                          className="p-1 hover:bg-[#f1eee6] text-[#527078] hover:text-[#17343a] disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                          title="Shift line backward 1 bay slot"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === displayedLines.length - 1}
                          onClick={e => {
                            e.stopPropagation();
                            handleMoveLineStep(line.id, 'down');
                          }}
                          className="p-1 hover:bg-[#f1eee6] text-[#527078] hover:text-[#17343a] disabled:opacity-25 disabled:cursor-not-allowed transition-colors border-l border-[#d9d2c2]"
                          title="Shift line forward 1 bay slot"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div
                      className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center font-display font-black text-white shrink-0 ${
                        status === 'Active'
                          ? 'bg-emerald-700'
                          : status === 'Maintenance'
                          ? 'bg-amber-600'
                          : 'bg-rose-700'
                      }`}
                    >
                      <span className="text-[9px] uppercase">Line</span>
                      <span className="text-lg leading-none">{line.lineNo}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#17343a]">Line {line.lineNo}</span>
                        <span className="text-xs text-[#527078]">({line.floor})</span>
                        <span className="text-xs font-bold text-[#176f78]">{line.buyer}</span>
                      </div>
                      <p className="text-xs text-[#527078] truncate max-w-sm">{line.style}</p>
                    </div>
                  </div>

                  {/* Status Toggle Segment */}
                  <div className="flex items-center gap-1.5 bg-[#f1eee6] p-1 rounded-xl border border-[#d9d2c2]">
                    <button
                      onClick={() => handleSetLineStatus(line, 'Active')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        status === 'Active'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-emerald-800 hover:bg-emerald-50'
                      }`}
                    >
                      Active
                    </button>
                    <button
                      onClick={() => handleSetLineStatus(line, 'Maintenance')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        status === 'Maintenance'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-amber-800 hover:bg-amber-50'
                      }`}
                    >
                      Maintenance
                    </button>
                    <button
                      onClick={() => handleSetLineStatus(line, 'Stopped')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        status === 'Stopped'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'text-rose-800 hover:bg-rose-50'
                      }`}
                    >
                      Stopped
                    </button>
                  </div>

                  {/* Efficiency and Actions */}
                  <div className="flex items-center gap-4">
                    <div className="text-right font-mono-numbers">
                      <div className="text-sm font-extrabold text-[#17343a]">{line.efficiency}% Eff</div>
                      <div className="text-xs text-[#527078]">{line.achievedProd}/{line.targetProd} pcs</div>
                    </div>

                    <button
                      onClick={() => setInspectingLine(line)}
                      className="p-2 rounded-xl bg-[#f1eee6] hover:bg-[#e7e1d5] text-[#17343a] transition-colors"
                      title="Inspect Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Compact Grid View */}
        {displayedLines.length > 0 && viewMode === 'compact' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {displayedLines.map((line, idx) => {
              const status = getLineStatus(line);
              return (
                <div
                  key={line.id}
                  id={`floor-line-compact-${line.lineNo}`}
                  draggable={isReorderMode}
                  onDragStart={e => {
                    e.dataTransfer.setData('text/plain', String(line.id));
                    e.dataTransfer.effectAllowed = 'move';
                    setDraggedLineId(line.id);
                  }}
                  onDragOver={e => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (dragOverLineId !== line.id) {
                      setDragOverLineId(line.id);
                    }
                  }}
                  onDragLeave={e => {
                    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                    if (dragOverLineId === line.id) {
                      setDragOverLineId(null);
                    }
                  }}
                  onDrop={e => {
                    e.preventDefault();
                    const sourceIdStr = e.dataTransfer.getData('text/plain');
                    const sourceId = sourceIdStr ? parseInt(sourceIdStr, 10) : draggedLineId;
                    if (sourceId && sourceId !== line.id) {
                      handleReorder(sourceId, line.id);
                    }
                    setDraggedLineId(null);
                    setDragOverLineId(null);
                  }}
                  onDragEnd={() => {
                    setDraggedLineId(null);
                    setDragOverLineId(null);
                  }}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    draggedLineId === line.id
                      ? 'opacity-40 border-dashed border-[#176f78] bg-[#f0f9fa]'
                      : dragOverLineId === line.id
                      ? 'ring-4 ring-[#176f78]/30 border-2 border-[#176f78] bg-[#eef8f9] shadow-md'
                      : status === 'Active'
                      ? 'bg-emerald-50/80 border-emerald-300'
                      : status === 'Maintenance'
                      ? 'bg-amber-50/80 border-amber-300'
                      : 'bg-rose-50/80 border-rose-300'
                  }`}
                >
                  {/* Top Bay Index & Mini Grip Handle */}
                  <div className="flex items-center justify-between mb-1 text-[10px] text-[#527078] font-mono-numbers">
                    <div
                      draggable={true}
                      onDragStart={e => {
                        e.stopPropagation();
                        e.dataTransfer.setData('text/plain', String(line.id));
                        e.dataTransfer.effectAllowed = 'move';
                        setDraggedLineId(line.id);
                      }}
                      className="cursor-grab active:cursor-grabbing p-0.5 hover:bg-[#e7e1d5] rounded flex items-center gap-0.5"
                      title="Drag to rearrange"
                    >
                      <GripVertical className="w-3 h-3 text-[#176f78]" />
                      <span className="font-extrabold text-[#17343a]">#{idx + 1}</span>
                    </div>

                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={e => {
                          e.stopPropagation();
                          handleMoveLineStep(line.id, 'up');
                        }}
                        className="p-0.5 hover:bg-[#e7e1d5] rounded disabled:opacity-20"
                        title="Move left"
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === displayedLines.length - 1}
                        onClick={e => {
                          e.stopPropagation();
                          handleMoveLineStep(line.id, 'down');
                        }}
                        className="p-0.5 hover:bg-[#e7e1d5] rounded disabled:opacity-20"
                        title="Move right"
                      >
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="font-display font-black text-lg text-[#17343a]">
                    Line {line.lineNo}
                  </div>
                  <div className="text-[11px] font-mono-numbers text-[#527078]">
                    {line.efficiency}% Eff
                  </div>

                  {/* Mini Status Dropdown */}
                  <div className="mt-2 flex items-center justify-center gap-1">
                    <button
                      onClick={() => handleSetLineStatus(line, 'Active')}
                      title="Set Active"
                      className={`w-6 h-6 rounded flex items-center justify-center ${
                        status === 'Active' ? 'bg-emerald-600 text-white' : 'bg-white border text-emerald-700'
                      }`}
                    >
                      <Play className="w-3 h-3 fill-current" />
                    </button>
                    <button
                      onClick={() => handleSetLineStatus(line, 'Maintenance')}
                      title="Set Maintenance"
                      className={`w-6 h-6 rounded flex items-center justify-center ${
                        status === 'Maintenance' ? 'bg-amber-600 text-white' : 'bg-white border text-amber-700'
                      }`}
                    >
                      <Wrench className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleSetLineStatus(line, 'Stopped')}
                      title="Set Stopped"
                      className={`w-6 h-6 rounded flex items-center justify-center ${
                        status === 'Stopped' ? 'bg-rose-600 text-white' : 'bg-white border text-rose-700'
                      }`}
                    >
                      <Pause className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Line Inspection & Maintenance Detail Modal */}
      {inspectingLine && (
        <div
          id="line-inspection-modal"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fadeIn"
          onClick={() => setInspectingLine(null)}
        >
          <div
            className="w-full max-w-2xl bg-white border border-[#d9d2c2] rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 animate-scaleUp overflow-y-auto max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#e7e1d5] pb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-display font-black text-white ${
                    getLineStatus(inspectingLine) === 'Active'
                      ? 'bg-emerald-700'
                      : getLineStatus(inspectingLine) === 'Maintenance'
                      ? 'bg-amber-600'
                      : 'bg-rose-700'
                  }`}
                >
                  <span className="text-[10px] uppercase">Line</span>
                  <span className="text-xl leading-none">{inspectingLine.lineNo}</span>
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-[#17343a] uppercase font-display">
                    Line {inspectingLine.lineNo} - Floor Station Inspector
                  </h2>
                  <p className="text-xs text-[#527078]">
                    {inspectingLine.floor} • {inspectingLine.apartment || 'Main Bay'} • Date: {inspectingLine.date}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setInspectingLine(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-[#f1eee6] transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Quick Status Setter Segment */}
            <div className="p-4 rounded-2xl bg-[#fbfaf6] border border-[#d9d2c2] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-[#17343a]">
                  Current Operational Status
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase ${
                    getLineStatus(inspectingLine) === 'Active'
                      ? 'bg-emerald-100 text-emerald-800'
                      : getLineStatus(inspectingLine) === 'Maintenance'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {getLineStatus(inspectingLine)}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleSetLineStatus(inspectingLine, 'Active')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-extrabold uppercase transition-all cursor-pointer border ${
                    getLineStatus(inspectingLine) === 'Active'
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                      : 'bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-50'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Set Active</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSetLineStatus(inspectingLine, 'Maintenance')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-extrabold uppercase transition-all cursor-pointer border ${
                    getLineStatus(inspectingLine) === 'Maintenance'
                      ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                      : 'bg-white text-amber-800 border-amber-200 hover:bg-amber-50'
                  }`}
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Maintenance</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSetLineStatus(inspectingLine, 'Stopped')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-extrabold uppercase transition-all cursor-pointer border ${
                    getLineStatus(inspectingLine) === 'Stopped'
                      ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                      : 'bg-white text-rose-800 border-rose-200 hover:bg-rose-50'
                  }`}
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>Stop Line</span>
                </button>
              </div>

              {/* Status Reason Preset selector */}
              <div className="pt-2">
                <span className="text-[11px] font-bold text-[#527078] block mb-1">
                  Log Status Reason / Maintenance Note:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Normal Production Running',
                    'Routine Blade & Needle Maintenance',
                    'Sewing Machine Motor Repair',
                    'Style Changeover Re-balancing',
                    'Fabric Bundle Starved / Input Shortage',
                    'Operator Attendance Shortage'
                  ].map(reason => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => {
                        const st = reason.includes('Maintenance') || reason.includes('Repair')
                          ? 'Maintenance'
                          : reason.includes('Shortage') || reason.includes('Starved')
                          ? 'Stopped'
                          : 'Active';
                        handleSetLineStatus(inspectingLine, st, reason);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white border border-[#d9d2c2] text-[10px] font-semibold text-[#17343a] hover:bg-[#f1eee6] transition-colors"
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Production & Garment Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2]">
                <span className="text-[10px] uppercase font-bold text-[#527078]">Buyer / Brand</span>
                <p className="font-bold text-sm text-[#17343a] mt-0.5 truncate">{inspectingLine.buyer}</p>
              </div>
              <div className="p-3 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2]">
                <span className="text-[10px] uppercase font-bold text-[#527078]">Garment Style</span>
                <p className="font-bold text-sm text-[#17343a] mt-0.5 truncate">{inspectingLine.style}</p>
              </div>
              <div className="p-3 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2]">
                <span className="text-[10px] uppercase font-bold text-[#527078]">SMV Benchmark</span>
                <p className="font-bold text-sm text-[#176f78] mt-0.5 font-mono-numbers">{inspectingLine.smv} min</p>
              </div>
              <div className="p-3 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2]">
                <span className="text-[10px] uppercase font-bold text-[#527078]">Planned Manpower</span>
                <p className="font-bold text-sm text-[#17343a] mt-0.5 font-mono-numbers">{inspectingLine.plannedMP} operators</p>
              </div>
            </div>

            {/* Bottleneck Analysis */}
            {inspectingLine.bottleneck && (
              <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-rose-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    Critical Bottleneck Station
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-rose-200 text-rose-900">
                    {inspectingLine.bottleneck.status}
                  </span>
                </div>
                <p className="text-sm font-bold text-rose-950">
                  {inspectingLine.bottleneck.station}
                </p>
                <p className="text-xs text-rose-800">
                  Cycle Time: <span className="font-mono-numbers font-bold">{inspectingLine.bottleneck.cycleTime}s</span> (Target: <span className="font-mono-numbers font-bold">{inspectingLine.bottleneck.targetCT}s</span>)
                </p>
                <p className="text-xs text-rose-900 mt-1">
                  <span className="font-bold">Recovery Action:</span> {inspectingLine.bottleneck.action}
                </p>
              </div>
            )}

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-between border-t border-[#e7e1d5] pt-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const lineNo = inspectingLine.lineNo;
                    setInspectingLine(null);
                    onNavigate('linedata', lineNo);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#176f78] text-white text-xs font-bold hover:bg-[#125860] transition-colors cursor-pointer"
                >
                  <span>Open Balancing</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const lineNo = inspectingLine.lineNo;
                    setInspectingLine(null);
                    if (onSwitchToSetup) {
                      onSwitchToSetup(lineNo);
                    } else {
                      onNavigate('line-management', lineNo);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#d9d2c2] hover:bg-[#f1eee6] text-[#17343a] text-xs font-bold transition-colors cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5 text-[#176f78]" />
                  <span>Configure Line & Teams</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setInspectingLine(null)}
                className="px-4 py-2 rounded-xl bg-[#f1eee6] text-[#17343a] text-xs font-bold hover:bg-[#e7e1d5] transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

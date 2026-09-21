/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Layers,
  Users,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Sliders,
  Calculator,
  Building2,
  UserCheck,
  Wrench,
  ShieldCheck,
  Phone,
  Clock,
  Briefcase,
  Sparkles,
  Check,
  X,
  Award,
  Zap,
  LayoutGrid,
  MapPin
} from 'lucide-react';
import { LineEntry, LineTeamMember, UserProfile } from '../types';
import { AiTeamAssignmentModal } from './AiTeamAssignmentModal';

export interface LineConfigurationTeamsProps {
  lines: LineEntry[];
  onSaveLine: (updatedLine: LineEntry) => void;
  onAddNewLine: (newLine: LineEntry) => void;
  onDeleteLine?: (lineNo: string) => void;
  onDeleteFloor?: (floorName: string, mode: 'delete_all_lines' | 'reassign', targetFloor?: string) => void;
  onNavigate: (tab: string, lineNo?: string) => void;
  profile?: UserProfile;
  hideTopHeader?: boolean;
  onSwitchToFloorPlan?: (floorName?: string, lineNo?: string) => void;
  initialFloorFilter?: string;
}

const DEFAULT_ROLES = [
  'Line Supervisor',
  'Senior IE Lead',
  'Quality In-Charge (QC)',
  'Maintenance Mechanic',
  'Floor In-Charge',
  'Feeding In-Charge',
  'Finishing In-Charge'
];

export const LineConfigurationTeams: React.FC<LineConfigurationTeamsProps> = ({
  lines,
  onSaveLine,
  onAddNewLine,
  onDeleteLine,
  onDeleteFloor,
  onNavigate,
  profile,
  hideTopHeader = false,
  onSwitchToFloorPlan,
  initialFloorFilter
}) => {
  // Form state matching screenshot
  const [lineNoInput, setLineNoInput] = useState('');
  const [floorInput, setFloorInput] = useState('Floor 01');
  const [apartmentInput, setApartmentInput] = useState('Apartment A');
  const [isActiveInput, setIsActiveInput] = useState(true);
  const [pendingTeamMembers, setPendingTeamMembers] = useState<LineTeamMember[]>([]);

  // Floor deletion state
  const [floorToDelete, setFloorToDelete] = useState<string | null>(null);
  const [deleteFloorMode, setDeleteFloorMode] = useState<'delete_all_lines' | 'reassign'>('delete_all_lines');
  const [reassignTargetFloor, setReassignTargetFloor] = useState<string>('');

  // Additional planning fields for comprehensive line setup
  const [buyerInput, setBuyerInput] = useState('H&M');
  const [styleInput, setStyleInput] = useState('Polo Shirt Classic');
  const [smvInput, setSmvInput] = useState('18.50');
  const [machinesInput, setMachinesInput] = useState('40');
  const [manpowerInput, setManpowerInput] = useState('45');
  const [workingHoursInput, setWorkingHoursInput] = useState('8.0');
  const [targetEffInput, setTargetEffInput] = useState('85');
  const [orderQtyInput, setOrderQtyInput] = useState('12000');
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  // Modals state
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [memberTargetLineNo, setMemberTargetLineNo] = useState<string | null>(null); // null = draft form
  const [memberName, setMemberName] = useState('');
  const [memberRole, setMemberRole] = useState(DEFAULT_ROLES[0]);
  const [memberContact, setMemberContact] = useState('');
  const [memberShift, setMemberShift] = useState('General Shift (8:00 AM - 5:00 PM)');

  // Edit existing line modal state
  const [editingLine, setEditingLine] = useState<LineEntry | null>(null);

  // Gemini AI Team Assignment Modal state
  const [aiModalLine, setAiModalLine] = useState<LineEntry | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // Filter & Search states for the directory
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFloorFilter, setSelectedFloorFilter] = useState('all');
  const [selectedApartmentFilter, setSelectedApartmentFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Success Notification banner
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const showNotification = (msg: string) => {
    setSuccessBanner(msg);
    setTimeout(() => setSuccessBanner(null), 4000);
  };

  // Handlers for Gemini AI Team Assignment
  const handleOpenAiModal = (targetLine: LineEntry) => {
    setAiModalLine(targetLine);
    setIsAiModalOpen(true);
  };

  const handleOpenAiModalForDraft = () => {
    const smvVal = parseFloat(smvInput) || 18.5;
    const targetEffVal = parseFloat(targetEffInput) || 85.0;
    const mpVal = parseInt(manpowerInput, 10) || 45;
    const machinesVal = parseInt(machinesInput, 10) || 40;

    const draftLine: LineEntry = {
      id: 999999,
      date: new Date().toISOString().split('T')[0],
      lineNo: lineNoInput.trim() || 'New Line Draft',
      floor: floorInput.trim() || 'Floor 01',
      apartment: apartmentInput.trim() || 'Apartment A',
      isActive: isActiveInput,
      buyer: buyerInput.trim() || 'Global Brand',
      style: styleInput.trim() || 'Garment Style',
      smv: smvVal,
      plannedMP: mpVal,
      machineCount: machinesVal,
      workingHours: parseFloat(workingHoursInput) || 8.0,
      targetEff: targetEffVal,
      targetProd: 1200,
      achievedProd: 0,
      efficiency: 0,
      remarks: 'Draft line configuration',
      orderQty: parseInt(orderQtyInput, 10) || 10000,
      dailyInput: 0,
      dailyOutput: 0,
      wip: 100,
      balancingGraph: 'day1',
      nextStyle: styleInput.trim(),
      nextStyleDate: new Date().toISOString().split('T')[0],
      mp: {
        Operator: { present: 30, absent: 0 },
        Helper: { present: 0, absent: 0 },
        'Iron Man': { present: 0, absent: 0 }
      },
      balanceMethod: 'Initial Pitch Flow',
      balanceNotes: 'New layout',
      top5: {
        held: 'no',
        attendance: 0,
        items: [],
        notes: 'Draft line pending first Top 5 meeting.'
      },
      bottleneck: {
        station: 'Collar / Neckline Seam Join',
        cycleTime: Math.round(smvVal * 2.5),
        targetCT: Math.round(smvVal * 2.0),
        status: 'critical',
        action: 'Review draft balance and assign a trained operator before activation.'
      },
      timeStudy: {
        done: 'no',
        type: 'both',
        observedRate: 0,
        standardRate: 0,
        findings: 'Complete a baseline study after the first production run.'
      },
      buildUp: {
        day: '1',
        plannedPct: 0,
        achievedPct: 0,
        operators: mpVal,
        notes: 'Draft line has no production history yet.'
      },
      lineIE: {
        name: profile?.name || 'IE Lead',
        level: profile?.role || 'Industrial Engineering',
        period: new Date().toISOString().slice(0, 7),
        weeklyNotes: 'Draft line configuration pending review.'
      },
      teamMembers: pendingTeamMembers
    };

    setAiModalLine(draftLine);
    setIsAiModalOpen(true);
  };

  const handleApplyAiAssignments = (targetLineNo: string, newMembers: LineTeamMember[]) => {
    // If target line is draft or matches current input
    if (targetLineNo === 'New Line Draft' || targetLineNo === 'New' || targetLineNo === lineNoInput.trim()) {
      setPendingTeamMembers(newMembers);
      showNotification(`Assigned ${newMembers.length} AI-optimized team members to new line form.`);
      return;
    }

    // Find line in lines
    const existing = lines.find(l => l.lineNo === targetLineNo);
    if (existing) {
      const updated: LineEntry = {
        ...existing,
        teamMembers: newMembers
      };
      onSaveLine(updated);
      showNotification(`Gemini AI successfully assigned ${newMembers.length} team members to Line ${targetLineNo} based on individual skill ratings!`);
    }
  };

  // Distinct floors & apartments list
  const floorOptions = useMemo(() => {
    const set = new Set<string>();
    lines.forEach(l => {
      if (l.floor) set.add(l.floor);
    });
    return Array.from(set);
  }, [lines]);

  const apartmentOptions = useMemo(() => {
    const set = new Set<string>();
    lines.forEach(l => {
      if (l.apartment) set.add(l.apartment);
    });
    return Array.from(set);
  }, [lines]);

  // Filtered lines
  const filteredLines = useMemo(() => {
    return lines.filter(line => {
      const matchesSearch =
        line.lineNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (line.style && line.style.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (line.buyer && line.buyer.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (line.teamMembers &&
          line.teamMembers.some(tm => tm.name.toLowerCase().includes(searchQuery.toLowerCase())));

      const matchesFloor =
        selectedFloorFilter === 'all' || line.floor.toLowerCase().includes(selectedFloorFilter.toLowerCase());

      const matchesApartment =
        selectedApartmentFilter === 'all' ||
        (line.apartment && line.apartment.toLowerCase().includes(selectedApartmentFilter.toLowerCase()));

      const matchesStatus =
        selectedStatusFilter === 'all' ||
        (selectedStatusFilter === 'active' ? line.isActive !== false : line.isActive === false);

      return matchesSearch && matchesFloor && matchesApartment && matchesStatus;
    });
  }, [lines, searchQuery, selectedFloorFilter, selectedApartmentFilter, selectedStatusFilter]);

  // Factory Summary Metrics
  const summaryStats = useMemo(() => {
    const totalLines = lines.length;
    const activeLines = lines.filter(l => l.isActive !== false).length;
    const totalStaff = lines.reduce((acc, l) => acc + (l.teamMembers?.length || 0), 0);
    const totalMachines = lines.reduce((acc, l) => acc + (l.machineCount || l.plannedMP || 35), 0);
    const floorsCount = new Set(lines.map(l => l.floor)).size;

    return { totalLines, activeLines, totalStaff, totalMachines, floorsCount };
  }, [lines]);

  // Handle Add Member Submit
  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName.trim()) return;

    const newMember: LineTeamMember = {
      id: `tm-${Date.now()}`,
      name: memberName.trim(),
      role: memberRole,
      contact: memberContact.trim() || undefined,
      shift: memberShift
    };

    if (memberTargetLineNo === null) {
      // Adding to draft form
      setPendingTeamMembers(prev => [...prev, newMember]);
    } else {
      // Adding to existing line
      const target = lines.find(l => l.lineNo === memberTargetLineNo);
      if (target) {
        const updatedMembers = [...(target.teamMembers || []), newMember];
        onSaveLine({ ...target, teamMembers: updatedMembers });
        showNotification(`Assigned ${newMember.name} (${newMember.role}) to Line ${target.lineNo}`);
      }
    }

    // Reset modal
    setMemberName('');
    setMemberContact('');
    setIsAddMemberModalOpen(false);
    setMemberTargetLineNo(null);
  };

  // Handle Add New Line
  const handleAddNewLineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanLineNo = lineNoInput.replace(/line\s*/i, '').trim();
    if (!cleanLineNo) {
      alert('Please enter a valid line number (e.g. 18 or Line 18).');
      return;
    }

    // Check duplicate
    if (lines.some(l => l.lineNo === cleanLineNo)) {
      alert(`Line ${cleanLineNo} already exists in the factory. Please choose another number or edit existing Line ${cleanLineNo}.`);
      return;
    }

    const smvVal = parseFloat(smvInput) || 18.5;
    const workingHoursVal = parseFloat(workingHoursInput) || 8.0;
    const targetEffVal = parseFloat(targetEffInput) || 85.0;
    const mpVal = parseInt(manpowerInput, 10) || 45;
    const machinesVal = parseInt(machinesInput, 10) || mpVal;
    const orderQtyVal = parseInt(orderQtyInput, 10) || 10000;

    // Calculate theoretical daily capacity: (Total Machine Hours * 60) / SMV * (Target Eff / 100)
    const totalMachineHours = machinesVal * workingHoursVal;
    const targetProdComputed = Math.round(((totalMachineHours * 60) / smvVal) * (targetEffVal / 100));

    const todayStr = new Date().toISOString().split('T')[0];

    const newLine: LineEntry = {
      id: Date.now(),
      date: todayStr,
      lineNo: cleanLineNo,
      floor: floorInput.trim() || 'Floor 01',
      apartment: apartmentInput.trim() || 'Apartment A',
      isActive: isActiveInput,
      buyer: buyerInput.trim() || 'Global Buyer',
      style: styleInput.trim() || 'Basic Apparel',
      smv: smvVal,
      plannedMP: mpVal,
      machineCount: machinesVal,
      workingHours: workingHoursVal,
      targetEff: targetEffVal,
      targetProd: targetProdComputed > 0 ? targetProdComputed : 1200,
      achievedProd: 0,
      efficiency: 0,
      remarks: `Newly configured line. Ready for shift loading. Floor: ${floorInput}, Unit: ${apartmentInput}`,
      orderQty: orderQtyVal,
      dailyInput: 0,
      dailyOutput: 0,
      wip: 100,
      balancingGraph: 'day1',
      nextStyle: styleInput.trim(),
      nextStyleDate: todayStr,
      mp: {
        Operator: { present: Math.round(mpVal * 0.75), absent: 0 },
        Helper: { present: Math.round(mpVal * 0.18), absent: 0 },
        'Iron Man': { present: Math.max(1, Math.round(mpVal * 0.07)), absent: 0 }
      },
      balanceMethod: 'Initial Layout',
      balanceNotes: 'New line configured with standard work station spacing',
      top5: {
        held: 'no',
        attendance: 0,
        items: [
          'Verify needle and feeder calibration',
          'Review golden sample specifications',
          'Align hourly output targets',
          'Confirm bundle feeder sequencing',
          'Review safety guards on cutting & pressing'
        ],
        notes: 'Initial startup huddle scheduled'
      },
      bottleneck: {
        station: 'Major Assembly Seam',
        cycleTime: (smvVal * 60) / machinesVal,
        targetCT: (smvVal * 60) / machinesVal,
        status: 'ok',
        action: 'Station balancing verified',
        notes: 'Standard work combination sheet deployed'
      },
      timeStudy: {
        done: 'no',
        type: 'both',
        observedRate: 0,
        standardRate: Math.round(targetProdComputed / workingHoursVal)
      },
      buildUp: {
        day: '1',
        plannedPct: 60,
        achievedPct: 0,
        operators: mpVal,
        notes: 'Day 1 line startup'
      },
      lineIE: {
        name: profile?.name || 'Mahmudul Hoque',
        level: 'sr_executive',
        period: 'daily',
        weeklyNotes: 'Initial production line setup'
      },
      teamMembers: pendingTeamMembers
    };

    onAddNewLine(newLine);
    showNotification(`Line ${cleanLineNo} successfully added to ${floorInput} (${apartmentInput})!`);

    // Reset Form
    setLineNoInput('');
    setFloorInput('Floor 01');
    setApartmentInput('Apartment A');
    setPendingTeamMembers([]);
    setIsActiveInput(true);
  };

  // Toggle Line Active status
  const handleToggleLineActive = (line: LineEntry) => {
    const updated: LineEntry = {
      ...line,
      isActive: line.isActive === false ? true : false
    };
    onSaveLine(updated);
    showNotification(`Line ${line.lineNo} marked as ${updated.isActive ? 'Active' : 'Inactive'}.`);
  };

  // Remove team member from line
  const handleRemoveMember = (line: LineEntry, memberId: string) => {
    const updatedMembers = (line.teamMembers || []).filter(m => m.id !== memberId);
    onSaveLine({ ...line, teamMembers: updatedMembers });
  };

  // Delete line
  const handleDeleteLineConfirm = (lineNo: string) => {
    if (window.confirm(`Are you sure you want to delete Line ${lineNo}? This will remove all associated workstation and IE tracking data.`)) {
      if (onDeleteLine) {
        onDeleteLine(lineNo);
      }
      showNotification(`Line ${lineNo} removed from factory registry.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* ────────────────────────────────────────────────────────── */}
      {/* SCREENSHOT TOP HEADER: ← Dashboard, Title & Subtitle       */}
      {/* ────────────────────────────────────────────────────────── */}
      {!hideTopHeader && (
        <div className="space-y-2">
          <button
            id="btn-back-to-dashboard"
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#17343a] hover:text-[#0e7490] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <div className="pt-1">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#17343a] tracking-tight leading-tight">
              Line Configuration &amp; Teams
            </h1>
            <p className="text-sm sm:text-base text-[#527078] mt-1 font-medium">
              Define apparel production lines, floor units, and structured team staffing.
            </p>
          </div>
        </div>
      )}

      {/* Success Banner */}
      {successBanner && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-bold flex items-center justify-between shadow-2xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessBanner(null)}
            className="text-emerald-700 hover:text-emerald-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Factory Floor & Capacity Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-[#e7e1d5] shadow-2xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#738287] flex items-center justify-between">
            <span>Configured Lines</span>
            <Layers className="w-3.5 h-3.5 text-[#176f78]" />
          </div>
          <div className="text-2xl font-black font-mono-numbers text-[#17343a]">
            {summaryStats.totalLines}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold">
            {summaryStats.activeLines} Active on floor
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#e7e1d5] shadow-2xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#738287] flex items-center justify-between">
            <span>Floor Modules</span>
            <Building2 className="w-3.5 h-3.5 text-[#d96b27]" />
          </div>
          <div className="text-2xl font-black font-mono-numbers text-[#17343a]">
            {summaryStats.floorsCount} Floors
          </div>
          <div className="text-[11px] text-[#527078] font-semibold">
            {apartmentOptions.length || 2} Apartments / Units
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#e7e1d5] shadow-2xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#738287] flex items-center justify-between">
            <span>Key Staff Assigned</span>
            <Users className="w-3.5 h-3.5 text-[#176f78]" />
          </div>
          <div className="text-2xl font-black font-mono-numbers text-[#17343a]">
            {summaryStats.totalStaff}
          </div>
          <div className="text-[11px] text-[#527078] font-semibold">
            Supervisors &amp; IE Personnel
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#e7e1d5] shadow-2xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#738287] flex items-center justify-between">
            <span>Plant Machines</span>
            <Wrench className="w-3.5 h-3.5 text-[#17343a]" />
          </div>
          <div className="text-2xl font-black font-mono-numbers text-[#17343a]">
            {summaryStats.totalMachines}
          </div>
          <div className="text-[11px] text-[#527078] font-semibold">
            Active sewing beds
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* EXACT SCREENSHOT CARD: "Add New Production Line"          */}
      {/* ────────────────────────────────────────────────────────── */}
      <section
        id="card-add-new-production-line"
        className="rounded-3xl bg-white border border-[#e5e7eb] shadow-xs p-6 sm:p-7 space-y-6"
      >
        {/* Card Title */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center">
            <Layers className="w-5 h-5 stroke-[2.2]" />
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#111827] tracking-tight">
            Add New Production Line
          </h2>
        </div>

        {/* Add Form */}
        <form onSubmit={handleAddNewLineSubmit} className="space-y-5">
          {/* Line Number input */}
          <div className="space-y-1.5">
            <label
              htmlFor="input-line-number"
              className="block text-sm font-semibold text-[#374151]"
            >
              Line Number
            </label>
            <input
              id="input-line-number"
              type="text"
              value={lineNoInput}
              onChange={e => setLineNoInput(e.target.value)}
              placeholder="e.g. 18 or Line 18"
              required
              className="w-full px-4 py-3 rounded-xl border border-[#d1d5db] bg-white text-[#111827] text-base placeholder:text-[#9ca3af] focus:outline-hidden focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 transition-all font-medium"
            />
          </div>

          {/* Two-Column Grid: Floor & Apartment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="input-floor"
                className="block text-sm font-semibold text-[#374151]"
              >
                Floor
              </label>
              <input
                id="input-floor"
                type="text"
                value={floorInput}
                onChange={e => setFloorInput(e.target.value)}
                placeholder="Floor 01"
                required
                className="w-full px-4 py-3 rounded-xl border border-[#d1d5db] bg-white text-[#111827] text-base placeholder:text-[#9ca3af] focus:outline-hidden focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 transition-all font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="input-apartment"
                className="block text-sm font-semibold text-[#374151]"
              >
                Apartment
              </label>
              <input
                id="input-apartment"
                type="text"
                value={apartmentInput}
                onChange={e => setApartmentInput(e.target.value)}
                placeholder="Apartment A"
                required
                className="w-full px-4 py-3 rounded-xl border border-[#d1d5db] bg-white text-[#111827] text-base placeholder:text-[#9ca3af] focus:outline-hidden focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 transition-all font-medium"
              />
            </div>
          </div>

          {/* Structured Team Members Section Header & Add Member Button */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-[#374151]">
                <Users className="w-4 h-4 text-sky-600" />
                <span>Structured Team Members</span>
              </div>

              <button
                id="btn-add-member"
                type="button"
                onClick={() => {
                  setMemberTargetLineNo(null);
                  setIsAddMemberModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#e0f2fe] hover:bg-[#bae6fd] text-[#0369a1] font-bold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Member</span>
              </button>
            </div>

            {/* Empty State Box matching Screenshot */}
            {pendingTeamMembers.length === 0 ? (
              <div className="rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] p-6 text-center text-xs sm:text-sm text-[#475569] font-medium leading-relaxed">
                No team members assigned to this line yet. Click &quot;Add Member&quot; to record key supervisors.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {pendingTeamMembers.map((tm, idx) => (
                  <div
                    key={tm.id || idx}
                    className="p-3 rounded-xl bg-[#f0fdf4] border border-emerald-200 flex items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-emerald-950 flex items-center gap-2">
                        <span>{tm.name}</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          {tm.role}
                        </span>
                      </div>
                      <div className="text-[11px] text-emerald-700">
                        {tm.shift || 'General Shift'} {tm.contact ? `• ${tm.contact}` : ''}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPendingTeamMembers(prev => prev.filter((_, i) => i !== idx))}
                      className="p-1 rounded-lg hover:bg-emerald-200 text-emerald-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Optional Advanced IE Production Parameters Toggle */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              className="text-xs font-bold text-[#2563eb] hover:underline flex items-center gap-1.5 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{showAdvancedSettings ? 'Hide IE Parameters' : '+ Configure Target Style, SMV & Capacity Specs'}</span>
            </button>

            {showAdvancedSettings && (
              <div className="p-4 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 animate-fadeIn">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#475569]">Target Garment Style</label>
                  <input
                    type="text"
                    value={styleInput}
                    onChange={e => setStyleInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#cbd5e1] text-xs font-medium"
                    placeholder="e.g. Polo Shirt"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#475569]">Planned SMV (Min)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={smvInput}
                    onChange={e => setSmvInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#cbd5e1] text-xs font-medium font-mono-numbers"
                    placeholder="18.5"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#475569]">Sewing Machines Count</label>
                  <input
                    type="number"
                    value={machinesInput}
                    onChange={e => setMachinesInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#cbd5e1] text-xs font-medium font-mono-numbers"
                    placeholder="40"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#475569]">Planned Manpower</label>
                  <input
                    type="number"
                    value={manpowerInput}
                    onChange={e => setManpowerInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#cbd5e1] text-xs font-medium font-mono-numbers"
                    placeholder="45"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#475569]">Shift Working Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    value={workingHoursInput}
                    onChange={e => setWorkingHoursInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#cbd5e1] text-xs font-medium font-mono-numbers"
                    placeholder="8.0"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#475569]">Target Efficiency %</label>
                  <input
                    type="number"
                    value={targetEffInput}
                    onChange={e => setTargetEffInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#cbd5e1] text-xs font-medium font-mono-numbers"
                    placeholder="85"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Bottom Row matching Screenshot: Checkbox & Blue Add Line button */}
          <div className="pt-2 border-t border-[#f3f4f6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Checkbox */}
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                id="checkbox-line-active"
                type="checkbox"
                checked={isActiveInput}
                onChange={e => setIsActiveInput(e.target.checked)}
                className="w-5 h-5 rounded-md text-[#2563eb] border-[#d1d5db] focus:ring-[#2563eb] focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-sm font-semibold text-[#111827]">
                Line Active &amp; Ready for Production
              </span>
            </label>

            {/* Blue Add Line Button */}
            <button
              id="btn-submit-add-line"
              type="submit"
              className="px-6 py-3 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-sm shadow-sm hover:shadow-md transition-all cursor-pointer text-center"
            >
              Add Line
            </button>
          </div>
        </form>
      </section>

      {/* ────────────────────────────────────────────────────────── */}
      {/* FACTORY LINES DIRECTORY & TEAM ROSTER                      */}
      {/* ────────────────────────────────────────────────────────── */}
      <section className="space-y-4 pt-4">
        {/* Directory Controls & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#17343a] tracking-tight">
              Factory Production Lines Directory
            </h2>
            <p className="text-xs text-[#527078] mt-0.5">
              {filteredLines.length} of {lines.length} production lines matching current floor filter
            </p>
          </div>

          {/* Search bar */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-[#738287] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search line, style, supervisor..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#d9d2c2] bg-white text-xs text-[#17343a] placeholder:text-[#9ca3af] focus:outline-hidden focus:border-[#176f78]"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-[#527078] flex items-center gap-1 text-[11px] uppercase">
            <Filter className="w-3 h-3" /> Filter Floor:
          </span>
          <button
            onClick={() => setSelectedFloorFilter('all')}
            className={`px-3 py-1 rounded-full font-bold transition-all ${
              selectedFloorFilter === 'all'
                ? 'bg-[#176f78] text-white'
                : 'bg-white text-[#527078] border border-[#d9d2c2] hover:bg-[#f5f3ec]'
            }`}
          >
            All Floors
          </button>
          {floorOptions.map(fl => (
            <button
              key={fl}
              onClick={() => setSelectedFloorFilter(fl)}
              className={`px-3 py-1 rounded-full font-bold transition-all ${
                selectedFloorFilter === fl
                  ? 'bg-[#176f78] text-white'
                  : 'bg-white text-[#527078] border border-[#d9d2c2] hover:bg-[#f5f3ec]'
              }`}
            >
              {fl}
            </button>
          ))}

          <span className="text-[#d9d2c2] mx-1">|</span>

          {/* Status filter */}
          <button
            onClick={() => setSelectedStatusFilter('all')}
            className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
              selectedStatusFilter === 'all' ? 'bg-[#17343a] text-white' : 'bg-white text-[#527078] border border-[#d9d2c2]'
            }`}
          >
            All Status
          </button>
          <button
            onClick={() => setSelectedStatusFilter('active')}
            className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
              selectedStatusFilter === 'active' ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-700 border border-emerald-300'
            }`}
          >
            Active Only
          </button>
          <button
            onClick={() => setSelectedStatusFilter('inactive')}
            className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
              selectedStatusFilter === 'inactive' ? 'bg-slate-600 text-white' : 'bg-white text-slate-600 border border-slate-300'
            }`}
          >
            Inactive
          </button>

          {onDeleteFloor && selectedFloorFilter !== 'all' && floorOptions.length > 1 && (
            <button
              type="button"
              onClick={() => {
                setFloorToDelete(selectedFloorFilter);
                setDeleteFloorMode('delete_all_lines');
                const remaining = floorOptions.filter(f => f.trim().toLowerCase() !== selectedFloorFilter.trim().toLowerCase());
                setReassignTargetFloor(remaining[0] || '');
              }}
              className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 hover:border-rose-300 transition-colors cursor-pointer"
              title={`Delete or reassign ${selectedFloorFilter}`}
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Delete Floor &quot;{selectedFloorFilter}&quot;</span>
            </button>
          )}
        </div>

        {/* Lines Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredLines.map(line => {
            const isLineActive = line.isActive !== false;
            const staffList = line.teamMembers || [];

            // Calculate current theoretical daily capacity
            const machinesCount = line.machineCount || line.plannedMP || 35;
            const totalHours = machinesCount * line.workingHours;
            const theoreticalCap = line.smv > 0 ? Math.round((totalHours * 60) / line.smv) : 0;
            const targetCap = Math.round(theoreticalCap * (line.targetEff / 100));

            return (
              <div
                key={line.id || line.lineNo}
                className={`p-5 rounded-3xl bg-white border transition-all shadow-2xs space-y-4 ${
                  isLineActive ? 'border-[#d9d2c2] hover:border-[#176f78]' : 'border-slate-300 bg-slate-50/70 opacity-90'
                }`}
              >
                {/* Header: Line Number, Status & Floor Tag */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-10 h-10 rounded-2xl bg-[#0c4a60] text-white flex items-center justify-center font-black text-base shadow-xs">
                      {line.lineNo}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-extrabold text-[#17343a] leading-tight">
                          Line {line.lineNo}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            isLineActive
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-200 text-slate-700 border border-slate-300'
                          }`}
                        >
                          {isLineActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="text-xs text-[#527078] font-medium flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3 text-[#176f78]" />
                        <span>{line.floor}</span>
                        <span>•</span>
                        <span className="font-semibold text-[#17343a]">{line.apartment || 'Apartment A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Dropdown / Quick Buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (onSwitchToFloorPlan) {
                          onSwitchToFloorPlan(line.floor, line.lineNo);
                        } else {
                          onNavigate('floor-plan', line.lineNo);
                        }
                      }}
                      title="View on Floor Map"
                      className="p-1.5 rounded-xl border border-[#d9d2c2] hover:border-[#176f78] text-[#527078] hover:text-[#176f78] bg-white transition-colors cursor-pointer"
                    >
                      <LayoutGrid className="w-4 h-4 text-[#176f78]" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleLineActive(line)}
                      title={isLineActive ? 'Deactivate Line' : 'Activate Line'}
                      className={`p-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                        isLineActive
                          ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                          : 'border-slate-300 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {isLineActive ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditingLine(line)}
                      title="Edit Line Configuration"
                      className="p-1.5 rounded-xl border border-[#d9d2c2] hover:border-[#176f78] text-[#527078] hover:text-[#176f78] bg-white transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {onDeleteLine && (
                      <button
                        type="button"
                        onClick={() => handleDeleteLineConfirm(line.lineNo)}
                        title="Delete Line"
                        className="p-1.5 rounded-xl border border-rose-200 hover:border-rose-400 text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Running Garment Style & Planned SMV */}
                <div className="p-3 rounded-2xl bg-[#f5f3ec] border border-[#e7e1d5] flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-[#738287]">
                      Current Style &amp; Buyer
                    </div>
                    <div className="font-bold text-[#17343a] text-sm">
                      {line.style} <span className="text-[#527078] font-normal">({line.buyer})</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-[#738287]">
                      Planned SMV
                    </div>
                    <div className="font-mono-numbers font-black text-sm text-[#0e7490]">
                      {line.smv.toFixed(2)} min
                    </div>
                  </div>
                </div>

                {/* Engineering Metrics Strip */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-white border border-[#e7e1d5]">
                    <span className="text-[10px] text-[#738287] font-semibold block">Machines / MP</span>
                    <span className="font-bold font-mono-numbers text-[#17343a]">
                      {machinesCount} M / {line.plannedMP} Op
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-white border border-[#e7e1d5]">
                    <span className="text-[10px] text-[#738287] font-semibold block">Daily Target</span>
                    <span className="font-bold font-mono-numbers text-[#17343a]">
                      {line.targetProd.toLocaleString()} pcs
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-white border border-[#e7e1d5]">
                    <span className="text-[10px] text-[#738287] font-semibold block">Theoretical Cap</span>
                    <span className="font-bold font-mono-numbers text-emerald-700">
                      {theoreticalCap.toLocaleString()} pcs
                    </span>
                  </div>
                </div>

                {/* Structured Team Members List */}
                <div className="space-y-2 pt-1 border-t border-[#f0eee6]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#17343a] flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#176f78]" />
                      <span>Structured Team Staff ({staffList.length})</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        setMemberTargetLineNo(line.lineNo);
                        setIsAddMemberModalOpen(true);
                      }}
                      className="text-[11px] font-bold text-[#2563eb] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Assign Staff</span>
                    </button>
                  </div>

                  {staffList.length === 0 ? (
                    <div className="py-2 px-3 rounded-xl bg-white border border-dashed border-[#d9d2c2] text-center text-[11px] text-[#738287]">
                      No supervisors assigned. Click &quot;Assign Staff&quot; to designate line leaders.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {staffList.map(tm => (
                        <div
                          key={tm.id}
                          className="p-2.5 rounded-xl bg-white border border-[#e7e1d5] flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="space-y-0.5 overflow-hidden">
                            <div className="font-bold text-[#17343a] truncate">{tm.name}</div>
                            <div className="text-[10px] text-[#176f78] font-bold uppercase tracking-wider truncate">
                              {tm.role}
                            </div>
                            {tm.contact && (
                              <div className="text-[10px] text-[#738287] truncate flex items-center gap-1">
                                <Phone className="w-2.5 h-2.5" />
                                <span>{tm.contact}</span>
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveMember(line, tm.id)}
                            title="Remove staff assignment"
                            className="p-1 text-slate-400 hover:text-rose-500 rounded-md transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Quick Action Buttons */}
                <div className="pt-2 border-t border-[#f0eee6] flex items-center justify-between gap-2 flex-wrap text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate('linedata', line.lineNo);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#176f78]/10 hover:bg-[#176f78] text-[#176f78] hover:text-white font-bold transition-all cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Workstation Balancing</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      // Navigate to Lean Toolkit with Capacity Calculator
                      onNavigate('lean-toolkit', line.lineNo);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500 text-amber-800 hover:text-white font-bold transition-all cursor-pointer"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    <span>Capacity Calculator</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────── */}
      {/* MODAL: ADD STRUCTURED TEAM MEMBER                          */}
      {/* ────────────────────────────────────────────────────────── */}
      {isAddMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-[#d9d2c2] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#17343a]">
                    Add Structured Team Member
                  </h3>
                  <p className="text-xs text-[#527078]">
                    {memberTargetLineNo
                      ? `Assigning supervisor to Line ${memberTargetLineNo}`
                      : 'Adding to pending new line draft'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddMemberModalOpen(false)}
                className="p-1 rounded-lg text-[#527078] hover:text-[#17343a] hover:bg-[#f1eee6]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="space-y-3.5 pt-1">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#374151]">Full Name</label>
                <input
                  type="text"
                  required
                  value={memberName}
                  onChange={e => setMemberName(e.target.value)}
                  placeholder="e.g. Md. Karim Ullah"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#d1d5db] text-sm focus:border-[#2563eb] focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#374151]">Operational Role</label>
                <select
                  value={memberRole}
                  onChange={e => setMemberRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#d1d5db] text-sm focus:border-[#2563eb] focus:outline-hidden bg-white"
                >
                  {DEFAULT_ROLES.map(r => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#374151]">Contact / Phone / ID</label>
                <input
                  type="text"
                  value={memberContact}
                  onChange={e => setMemberContact(e.target.value)}
                  placeholder="e.g. +880 1712-345678 or EMP-401"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#d1d5db] text-sm focus:border-[#2563eb] focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#374151]">Assigned Shift</label>
                <select
                  value={memberShift}
                  onChange={e => setMemberShift(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#d1d5db] text-sm focus:border-[#2563eb] focus:outline-hidden bg-white"
                >
                  <option value="General Shift (8:00 AM - 5:00 PM)">General Shift (8:00 AM - 5:00 PM) [Default]</option>
                  <option value="Shift 02 (Evening Overtime 17:00 - 21:00)">Shift 02 (Evening Overtime 17:00 - 21:00)</option>
                  <option value="Shift 03 (Night Shift 21:00 - 05:00)">Shift 03 (Night Shift 21:00 - 05:00)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddMemberModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#d1d5db] text-xs font-bold text-[#374151] hover:bg-[#f3f4f6]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold shadow-xs"
                >
                  Save Team Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* MODAL: EDIT EXISTING LINE CONFIGURATION                    */}
      {/* ────────────────────────────────────────────────────────── */}
      {editingLine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-[#d9d2c2] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-[#0c4a60] text-white flex items-center justify-center font-bold text-sm">
                  {editingLine.lineNo}
                </span>
                <div>
                  <h3 className="font-extrabold text-base text-[#17343a]">
                    Edit Line {editingLine.lineNo} Configuration
                  </h3>
                  <p className="text-xs text-[#527078]">Update floor assignment, running style, and planning metrics</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingLine(null)}
                className="p-1 rounded-lg text-[#527078] hover:text-[#17343a] hover:bg-[#f1eee6]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 pt-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#374151]">Floor</label>
                  <input
                    type="text"
                    value={editingLine.floor}
                    onChange={e => setEditingLine({ ...editingLine, floor: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#d1d5db] text-xs font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#374151]">Apartment</label>
                  <input
                    type="text"
                    value={editingLine.apartment || 'Apartment A'}
                    onChange={e => setEditingLine({ ...editingLine, apartment: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#d1d5db] text-xs font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#374151]">Running Style</label>
                  <input
                    type="text"
                    value={editingLine.style}
                    onChange={e => setEditingLine({ ...editingLine, style: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#d1d5db] text-xs font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#374151]">Buyer</label>
                  <input
                    type="text"
                    value={editingLine.buyer}
                    onChange={e => setEditingLine({ ...editingLine, buyer: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#d1d5db] text-xs font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#374151]">Planned SMV</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingLine.smv}
                    onChange={e => setEditingLine({ ...editingLine, smv: parseFloat(e.target.value) || 0.1 })}
                    className="w-full px-3 py-2 rounded-xl border border-[#d1d5db] text-xs font-bold font-mono-numbers"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#374151]">Machines</label>
                  <input
                    type="number"
                    value={editingLine.machineCount || 38}
                    onChange={e => setEditingLine({ ...editingLine, machineCount: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 rounded-xl border border-[#d1d5db] text-xs font-bold font-mono-numbers"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#374151]">Working Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editingLine.workingHours}
                    onChange={e => setEditingLine({ ...editingLine, workingHours: parseFloat(e.target.value) || 8 })}
                    className="w-full px-3 py-2 rounded-xl border border-[#d1d5db] text-xs font-bold font-mono-numbers"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#374151]">Target Efficiency %</label>
                  <input
                    type="number"
                    value={editingLine.targetEff}
                    onChange={e => setEditingLine({ ...editingLine, targetEff: parseFloat(e.target.value) || 50 })}
                    className="w-full px-3 py-2 rounded-xl border border-[#d1d5db] text-xs font-bold font-mono-numbers"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#374151]">Daily Target (Pcs)</label>
                  <input
                    type="number"
                    value={editingLine.targetProd}
                    onChange={e => setEditingLine({ ...editingLine, targetProd: parseInt(e.target.value, 10) || 100 })}
                    className="w-full px-3 py-2 rounded-xl border border-[#d1d5db] text-xs font-bold font-mono-numbers"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="modal-edit-is-active"
                  checked={editingLine.isActive !== false}
                  onChange={e => setEditingLine({ ...editingLine, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-[#2563eb]"
                />
                <label htmlFor="modal-edit-is-active" className="text-xs font-bold text-[#111827] cursor-pointer">
                  Line Active &amp; Scheduled for Shift Run
                </label>
              </div>

              <div className="pt-3 border-t flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingLine(null)}
                  className="px-4 py-2 rounded-xl border border-[#d1d5db] text-xs font-bold text-[#374151] hover:bg-[#f3f4f6]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSaveLine(editingLine);
                    showNotification(`Line ${editingLine.lineNo} updated successfully.`);
                    setEditingLine(null);
                  }}
                  className="px-5 py-2 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ────────────────────────────────────────────────────────── */}
      {/* MODAL: DELETE FLOOR CONFIRMATION                           */}
      {/* ────────────────────────────────────────────────────────── */}
      {floorToDelete && onDeleteFloor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-xl border border-rose-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-rose-100">
              <div className="flex items-center gap-2 text-rose-700">
                <Trash2 className="w-5 h-5" />
                <h3 className="text-base font-extrabold">Confirm Floor Deletion</h3>
              </div>
              <button
                type="button"
                onClick={() => setFloorToDelete(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#527078]">
              <p>
                You have selected to delete floor <strong className="text-[#17343a]">&quot;{floorToDelete}&quot;</strong>.
                There are currently <strong className="text-[#17343a]">{lines.filter(l => (l.floor || '').trim().toLowerCase() === floorToDelete.trim().toLowerCase()).length}</strong> line(s) assigned to this floor.
              </p>

              <div className="space-y-2 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900">
                <div className="font-bold text-xs">Choose Action Mode:</div>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="delete-mode-teams"
                    value="delete_all_lines"
                    checked={deleteFloorMode === 'delete_all_lines'}
                    onChange={() => setDeleteFloorMode('delete_all_lines')}
                    className="mt-0.5 text-rose-600"
                  />
                  <span>
                    <strong className="block text-rose-900">Delete all lines on this floor</strong>
                    Permanently remove all sewing lines and team setups assigned to this floor.
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                  <input
                    type="radio"
                    name="delete-mode-teams"
                    value="reassign"
                    checked={deleteFloorMode === 'reassign'}
                    onChange={() => setDeleteFloorMode('reassign')}
                    className="mt-0.5 text-blue-600"
                  />
                  <span>
                    <strong className="block text-blue-900">Reassign lines to another floor</strong>
                    Keep all lines and team setups, moving them to a selected target floor.
                  </span>
                </label>

                {deleteFloorMode === 'reassign' && (
                  <div className="pt-2 pl-6">
                    <label className="block text-[11px] font-bold text-blue-950 mb-1">
                      Select Target Destination Floor:
                    </label>
                    <select
                      value={reassignTargetFloor}
                      onChange={e => setReassignTargetFloor(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-blue-300 bg-white text-xs font-semibold text-[#17343a]"
                    >
                      {floorOptions
                        .filter(f => f.trim().toLowerCase() !== floorToDelete.trim().toLowerCase())
                        .map(targetFl => (
                          <option key={targetFl} value={targetFl}>
                            {targetFl}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setFloorToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-[#527078] hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteFloor && floorToDelete) {
                    onDeleteFloor(floorToDelete, deleteFloorMode, reassignTargetFloor);
                    showNotification(`Floor "${floorToDelete}" successfully removed.`);
                    setSelectedFloorFilter('all');
                    setFloorToDelete(null);
                  }
                }}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

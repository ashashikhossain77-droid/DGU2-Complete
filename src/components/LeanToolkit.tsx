/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Sparkles,
  Trash2,
  RotateCw,
  Timer,
  BarChart3,
  AlertTriangle,
  Gauge,
  FileText,
  Columns3,
  Glasses,
  ClipboardCheck,
  ShieldCheck,
  ChevronRight,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  Layers,
  Wrench,
  Calculator,
  ArrowUpRight,
  X
} from 'lucide-react';
import { LeanMethod, LeanActionItem, UserProfile, LineEntry } from '../types';
import { LEAN_METHODS } from '../mockData';
import { LeanToolWorkspace } from './LeanToolWorkspace';
import { CapacityCalculatorWorkspace } from './CapacityCalculatorWorkspace';

interface LeanToolkitProps {
  actions: LeanActionItem[];
  onUpdateActions: (actions: LeanActionItem[]) => void;
  profile: UserProfile;
  lines?: LineEntry[];
  onSaveLine?: (line: LineEntry) => void;
  selectedLineNo?: string;
  initialToolId?: string | null;
}

export const LeanToolkit: React.FC<LeanToolkitProps> = ({
  actions,
  onUpdateActions,
  profile,
  lines = [],
  onSaveLine,
  selectedLineNo = '18',
  initialToolId = null
}) => {
  const [activeToolId, setActiveToolId] = useState<string | null>(initialToolId);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'tools' | 'kaizen_board'>('tools');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New action form state
  const [methodSelect, setMethodSelect] = useState('capacity-calculator');
  const [targetLine, setTargetLine] = useState(selectedLineNo);
  const [title, setTitle] = useState('');
  const [issue, setIssue] = useState('');
  const [solution, setSolution] = useState('');
  const [benefit, setBenefit] = useState('');

  // Icon mapping according to screenshot
  const getToolIcon = (id: string) => {
    switch (id) {
      case 'capacity-calculator':
        return Calculator;
      case '5s-audit':
        return Sparkles;
      case '7-wastes':
        return Trash2;
      case 'kaizen-pdca':
        return RotateCw;
      case 'smed-changeover':
        return Timer;
      case 'takt-yamazumi':
        return BarChart3;
      case 'andon-board':
        return AlertTriangle;
      case 'oee-tpm':
        return Gauge;
      case 'a3-problem-solving':
        return FileText;
      case 'kanban-wip':
        return Columns3;
      case 'gemba-walk':
        return Glasses;
      case 'standard-work':
        return ClipboardCheck;
      case 'poka-yoke':
        return ShieldCheck;
      default:
        return Sparkles;
    }
  };

  const handleCreateAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const matchedMethod = LEAN_METHODS.find(m => m.id === methodSelect);
    const mName = matchedMethod?.name || matchedMethod?.title || methodSelect;

    const newAction: LeanActionItem = {
      id: `lean-act-${Date.now()}`,
      methodId: methodSelect,
      methodName: mName,
      lineNo: targetLine,
      title: title.trim(),
      issue: issue.trim() || 'Floor inefficiency identified during walk',
      solution: solution.trim() || 'Lean countermeasure deployed',
      expectedBenefit: benefit.trim() || 'Improved line flow and ergonomics',
      status: 'in_progress',
      owner: profile.name,
      createdAt: new Date().toISOString()
    };

    onUpdateActions([newAction, ...actions]);
    setIsModalOpen(false);
    setTitle('');
    setIssue('');
    setSolution('');
    setBenefit('');
  };

  const toggleActionStatus = (id: string) => {
    const updated = actions.map(act => {
      if (act.id !== id) return act;
      const nextStatus =
        act.status === 'completed'
          ? ('in_progress' as const)
          : ('completed' as const);
      return {
        ...act,
        status: nextStatus,
        completedAt: nextStatus === 'completed' ? new Date().toISOString() : undefined
      };
    });
    onUpdateActions(updated);
  };

  const filteredMethods = LEAN_METHODS.filter(m => {
    const name = (m.name || m.title || '').toLowerCase();
    const desc = (m.description || m.purpose || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || desc.includes(query);
  });

  const activeMethod = LEAN_METHODS.find(m => m.id === activeToolId);

  // If Capacity Calculator is active, render dedicated CapacityCalculatorWorkspace
  if (activeToolId === 'capacity-calculator') {
    return (
      <CapacityCalculatorWorkspace
        onBack={() => setActiveToolId(null)}
        lines={lines}
        selectedLineNo={selectedLineNo}
        onSaveLine={onSaveLine}
        actions={actions}
        onUpdateActions={onUpdateActions}
        profile={profile}
      />
    );
  }

  // If another tool workspace is open, show the dedicated interactive tool workspace
  if (activeMethod) {
    return (
      <LeanToolWorkspace
        method={activeMethod}
        onBack={() => setActiveToolId(null)}
        actions={actions}
        onUpdateActions={onUpdateActions}
        profile={profile}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header Matching Uploaded Screenshot */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#527078] block mb-1">
            LEAN MANUFACTURING
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17343a] tracking-tight">
            Lean toolkit
          </h1>
          <p className="text-xs sm:text-sm text-[#527078] mt-1">
            Twelve tools for continuous improvement on the sewing floor.
          </p>
        </div>

        {/* View Switcher & Action Button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-xl bg-[#f1eee6] border border-[#d9d2c2] text-xs font-bold">
            <button
              onClick={() => setViewMode('tools')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'tools'
                  ? 'bg-white text-[#17343a] shadow-2xs'
                  : 'text-[#527078] hover:text-[#17343a]'
              }`}
            >
              12 Lean Tools
            </button>
            <button
              onClick={() => setViewMode('kaizen_board')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'kaizen_board'
                  ? 'bg-white text-[#17343a] shadow-2xs'
                  : 'text-[#527078] hover:text-[#17343a]'
              }`}
            >
              Kaizen Log ({actions.length})
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#176f78] text-white hover:bg-[#12555c] transition-colors text-xs font-bold shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Log Kaizen</span>
          </button>
        </div>
      </div>

      {viewMode === 'tools' ? (
        <div className="space-y-4">
          {/* Quick Search */}
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#527078]" />
              <input
                type="text"
                placeholder="Search tools & elements..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-[#d9d2c2] text-[#17343a] focus:outline-hidden shadow-2xs"
              />
            </div>
            <span className="text-xs text-[#527078] hidden sm:block">
              Click any tool to launch its interactive workspace
            </span>
          </div>

          {/* Featured Tool: Line Capacity Calculator */}
          <div
            id="featured-capacity-calculator-banner"
            onClick={() => setActiveToolId('capacity-calculator')}
            className="p-4 sm:p-5 rounded-3xl bg-linear-to-r from-[#0c4a60] via-[#176f78] to-[#12555c] text-white shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                <Calculator className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 text-[10px] font-extrabold uppercase tracking-wide">
                    NEW IE TOOL
                  </span>
                  <span className="text-xs font-bold text-cyan-200 uppercase tracking-wider">
                    Production Planning
                  </span>
                </div>
                <h2 className="text-lg font-extrabold text-white tracking-tight">
                  Line Capacity Calculator
                </h2>
                <p className="text-xs text-cyan-100 max-w-xl">
                  Input total machine hours and planned SMV to determine theoretical daily production capacity, pitch takt time, and delivery targets.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <span className="px-4 py-2 rounded-xl bg-white text-[#0c4a60] font-extrabold text-xs shadow-xs group-hover:bg-cyan-50 transition-colors flex items-center gap-1.5">
                <span>Launch Calculator</span>
                <ArrowUpRight className="w-4 h-4" />
              </span>
            </div>
          </div>

          {/* 13 Tools List - Exactly matching the screenshot design */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredMethods.map(method => {
              const IconComp = getToolIcon(method.id);
              const toolTitle = method.title || method.name;
              const toolDesc = method.description;

              return (
                <div
                  key={method.id}
                  id={`tool-card-${method.id}`}
                  onClick={() => setActiveToolId(method.id)}
                  className="group relative flex items-center justify-between p-4 rounded-2xl bg-white border border-[#d9d2c2] hover:border-[#176f78] shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Icon container matching screenshot */}
                    <div className="w-12 h-12 rounded-xl bg-[#f1eee6] border border-[#e7e1d5] flex items-center justify-center text-[#17343a] group-hover:bg-[#dceceb] group-hover:text-[#176f78] group-hover:border-[#176f78]/30 transition-all shrink-0">
                      <IconComp className="w-5 h-5 stroke-[1.75]" />
                    </div>

                    <div className="min-w-0 pr-2">
                      <h3 className="font-bold text-sm sm:text-base text-[#17343a] group-hover:text-[#176f78] transition-colors leading-snug truncate">
                        {toolTitle}
                      </h3>
                      <p className="text-xs text-[#527078] mt-0.5 line-clamp-1">
                        {toolDesc}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-bold text-[#176f78] bg-[#dceceb] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline">
                      Open Tool
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#176f78] group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Kaizen Action Board */
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-[#d9d2c2] shadow-2xs">
            <div>
              <h2 className="font-bold text-sm text-[#17343a]">Active Floor Kaizen Actions</h2>
              <p className="text-[11px] text-[#527078]">Continuous improvement initiatives logged across all lines</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#176f78] text-white text-xs font-bold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Action</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {actions.map(act => (
              <div
                key={act.id}
                className="p-4 rounded-2xl bg-white border border-[#d9d2c2] shadow-2xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#dceceb] text-[#176f78]">
                      Line {act.lineNo}
                    </span>
                    <span className="text-xs font-bold text-[#527078]">{act.methodName}</span>
                  </div>
                  <button
                    onClick={() => toggleActionStatus(act.id)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                      act.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {act.status === 'completed' ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Completed</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5" />
                        <span>In Progress</span>
                      </>
                    )}
                  </button>
                </div>

                <h3 className="font-bold text-sm text-[#17343a]">{act.title}</h3>
                <p className="text-xs text-[#527078]">{act.solution}</p>

                <div className="flex items-center justify-between text-[11px] text-[#527078] pt-2 border-t border-[#e7e1d5]">
                  <span>Owner: {act.owner}</span>
                  <span className="text-emerald-700 font-medium">{act.expectedBenefit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal for Logging New Kaizen */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#d9d2c2] shadow-xl w-full max-w-lg p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-[#e7e1d5] pb-3">
              <div>
                <h3 className="font-bold text-base text-[#17343a]">Log Floor Kaizen Action</h3>
                <p className="text-xs text-[#527078]">Connect an improvement idea to one of the 12 tools</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-[#f1eee6]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAction} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#527078]">Lean Tool</label>
                  <select
                    value={methodSelect}
                    onChange={e => setMethodSelect(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-[#f1eee6] border border-[#d9d2c2] text-[#17343a]"
                  >
                    {LEAN_METHODS.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.title || m.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#527078]">Sewing Line</label>
                  <select
                    value={targetLine}
                    onChange={e => setTargetLine(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-[#f1eee6] border border-[#d9d2c2] text-[#17343a]"
                  >
                    <option value="18">Line 18 (Polo Shirts)</option>
                    <option value="19">Line 19 (Casual Tees)</option>
                    <option value="20">Line 20 (Jackets)</option>
                    <option value="21">Line 21 (Fleece Hoodies)</option>
                    <option value="22">Line 22 (Cargo Pants)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-[#527078]">Kaizen Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Folder guide for collar placket assembly"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-[#f1eee6] border border-[#d9d2c2] text-[#17343a]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-[#527078]">Identified Issue / Waste</label>
                <input
                  type="text"
                  placeholder="e.g., Operator manually folding fabric with iron (38s)"
                  value={issue}
                  onChange={e => setIssue(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-[#f1eee6] border border-[#d9d2c2] text-[#17343a]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-[#527078]">Proposed Countermeasure</label>
                <textarea
                  rows={2}
                  placeholder="e.g., Fabricate custom stainless steel folding attachment"
                  value={solution}
                  onChange={e => setSolution(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-[#f1eee6] border border-[#d9d2c2] text-[#17343a]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-[#527078]">Expected Benefit</label>
                <input
                  type="text"
                  placeholder="e.g., Save 12s per piece, eliminates puckering defect"
                  value={benefit}
                  onChange={e => setBenefit(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-[#f1eee6] border border-[#d9d2c2] text-[#17343a]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#f1eee6] text-[#527078] hover:text-[#17343a] font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#176f78] text-white hover:bg-[#12555c] font-bold"
                >
                  Save Kaizen Action
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

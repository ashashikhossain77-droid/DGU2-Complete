/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  CheckCircle2,
  AlertTriangle,
  Users,
  Award,
  Zap,
  RotateCw,
  Gauge,
  Sliders,
  Wrench,
  ShieldCheck,
  Check,
  Search,
  Filter,
  Phone,
  Clock,
  Briefcase,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { LineEntry, LineTeamMember, CandidateTeamMember, TeamAssignmentRecommendation, SuggestedTeamAssignment } from '../types';
import { CANDIDATE_TEAM_POOL } from '../data/teamSkillPool';

interface AiTeamAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  line: LineEntry;
  onApplyAssignments: (targetLineNo: string, members: LineTeamMember[]) => void;
  allLines?: LineEntry[];
}

export const AiTeamAssignmentModal: React.FC<AiTeamAssignmentModalProps> = ({
  isOpen,
  onClose,
  line,
  onApplyAssignments,
  allLines = []
}) => {
  const [activeTab, setActiveTab] = useState<'suggestions' | 'skill_pool'>('suggestions');
  const [isLoading, setIsLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<TeamAssignmentRecommendation | null>(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);

  // Candidate pool search & filter
  const [candidateSearch, setCandidateSearch] = useState('');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('all');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');

  // Loading animation simulation
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading) {
      setLoadingStep(1);
      timer = setInterval(() => {
        setLoadingStep(prev => (prev < 3 ? prev + 1 : prev));
      }, 900);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(timer);
  }, [isLoading]);

  // Fetch AI Recommendations
  const fetchAiSuggestions = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/ai-team-assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          line: {
            lineNo: line.lineNo,
            floor: line.floor,
            apartment: line.apartment,
            buyer: line.buyer,
            style: line.style,
            smv: line.smv,
            targetEff: line.targetEff,
            targetProd: line.targetProd,
            bottleneck: line.bottleneck,
            plannedMP: line.plannedMP,
            machineCount: line.machineCount || 40,
            workingHours: line.workingHours,
            balanceMethod: line.balanceMethod
          },
          candidates: CANDIDATE_TEAM_POOL
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.recommendation) {
        setRecommendation(data.recommendation);
        // Pre-select all suggested assignments
        const allIds = new Set<string>(data.recommendation.suggestedAssignments.map((a: SuggestedTeamAssignment) => a.memberId));
        setSelectedMemberIds(allIds);
      } else {
        throw new Error('Invalid recommendation payload received');
      }
    } catch (err: any) {
      console.error('Failed to generate AI team assignments:', err);
      setErrorMsg(err.message || 'Unable to connect to AI assignment service. Using offline IE rules.');
    } finally {
      setIsLoading(false);
    }
  };

  // Run on first open if no recommendation exists for this line
  useEffect(() => {
    if (isOpen && (!recommendation || recommendation.lineNo !== line.lineNo)) {
      fetchAiSuggestions();
    }
  }, [isOpen, line.lineNo]);

  if (!isOpen) return null;

  // Toggle selection of individual suggested assignment
  const handleToggleMember = (memberId: string) => {
    setSelectedMemberIds(prev => {
      const next = new Set(prev);
      if (next.has(memberId)) {
        next.delete(memberId);
      } else {
        next.add(memberId);
      }
      return next;
    });
  };

  // Select/Deselect all
  const handleToggleAll = () => {
    if (!recommendation) return;
    if (selectedMemberIds.size === recommendation.suggestedAssignments.length) {
      setSelectedMemberIds(new Set());
    } else {
      setSelectedMemberIds(new Set(recommendation.suggestedAssignments.map(a => a.memberId)));
    }
  };

  // Apply to Line
  const handleApply = () => {
    if (!recommendation) return;

    const chosenAssignments = recommendation.suggestedAssignments.filter(a => selectedMemberIds.has(a.memberId));
    if (chosenAssignments.length === 0) {
      alert('Please select at least one team member to apply.');
      return;
    }

    const convertedMembers: LineTeamMember[] = chosenAssignments.map(a => ({
      id: `tm-${Date.now()}-${a.memberId}`,
      name: a.name,
      role: a.role,
      contact: a.contact,
      shift: a.shift,
      skillGrade: a.skillGrade,
      assignedStation: a.assignedWorkstation,
      fitScore: a.fitScore,
      rationale: a.rationale,
      specialties: a.matchedSkills,
      efficiencyRating: a.efficiencyRating
    }));

    onApplyAssignments(line.lineNo, convertedMembers);
    onClose();
  };

  // Filtered candidate pool
  const filteredCandidates = CANDIDATE_TEAM_POOL.filter(c => {
    const matchSearch =
      c.name.toLowerCase().includes(candidateSearch.toLowerCase()) ||
      c.primaryRole.toLowerCase().includes(candidateSearch.toLowerCase()) ||
      c.specialties.some(s => s.toLowerCase().includes(candidateSearch.toLowerCase())) ||
      c.criticalOperations.some(op => op.toLowerCase().includes(candidateSearch.toLowerCase()));

    const matchGrade = selectedGradeFilter === 'all' || c.skillGrade === selectedGradeFilter;
    const matchRole = selectedRoleFilter === 'all' || c.primaryRole.toLowerCase().includes(selectedRoleFilter.toLowerCase());

    return matchSearch && matchGrade && matchRole;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-5xl bg-[#fbfaf6] rounded-3xl shadow-2xl border border-[#d9d2c2] flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-white border-b border-[#e7e1d5] flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="w-9 h-9 rounded-2xl bg-[#176f78] text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-5 h-5 text-amber-300 fill-amber-300/20" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-extrabold text-[#17343a] tracking-tight">
                    Gemini AI Team Assignment Optimizer
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <Zap className="w-3 h-3 text-emerald-600" />
                    <span>Skill Matrix Matched</span>
                  </span>
                </div>
                <p className="text-xs text-[#527078]">
                  Matches individual operator &amp; supervisor skill ratings directly to Line {line.lineNo}&apos;s critical bottleneck, SMV, and style requirements.
                </p>
              </div>
            </div>

            {/* Line Specs Chips */}
            <div className="flex items-center gap-2 flex-wrap pt-2 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-[#0c4a60] text-white font-bold text-[11px]">
                Line {line.lineNo} ({line.floor || 'Floor 01'})
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[#eef6f6] border border-[#dceceb] text-[#176f78] font-bold text-[11px]">
                Style: {line.style} ({line.buyer})
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white border border-[#e7e1d5] text-[#17343a] font-mono-numbers font-medium text-[11px]">
                SMV: {line.smv.toFixed(2)} min • Target Eff: {line.targetEff}%
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 font-medium text-[11px] flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                <span>Bottleneck: {line.bottleneck?.station || 'Seam Assembly'} (CT: {line.bottleneck?.cycleTime || 45}s vs Target: {line.bottleneck?.targetCT || 38}s)</span>
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#527078] hover:text-[#17343a] hover:bg-[#f1eee6] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-3 bg-white border-b border-[#e7e1d5] flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('suggestions')}
              className={`pb-3 px-3 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'suggestions'
                  ? 'border-[#176f78] text-[#176f78]'
                  : 'border-transparent text-[#738287] hover:text-[#17343a]'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>AI Assignment Recommendations</span>
              {recommendation && (
                <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-[#176f78]/10 text-[#176f78]">
                  {recommendation.suggestedAssignments.length} Members
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('skill_pool')}
              className={`pb-3 px-3 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'skill_pool'
                  ? 'border-[#176f78] text-[#176f78]'
                  : 'border-transparent text-[#738287] hover:text-[#17343a]'
              }`}
            >
              <Users className="w-4 h-4 text-[#176f78]" />
              <span>Candidate Skill Matrix Bench</span>
              <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700">
                {CANDIDATE_TEAM_POOL.length} Profiles
              </span>
            </button>
          </div>

          {activeTab === 'suggestions' && (
            <button
              type="button"
              disabled={isLoading}
              onClick={fetchAiSuggestions}
              className="mb-2 text-xs font-bold text-[#176f78] hover:text-[#12555c] flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#dceceb] bg-[#f0f9f9] hover:bg-[#e2f3f3] transition-colors cursor-pointer disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Re-Analyze with Gemini AI</span>
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* TAB 1: AI SUGGESTIONS */}
          {activeTab === 'suggestions' && (
            <>
              {isLoading ? (
                <div className="p-12 text-center space-y-4 max-w-md mx-auto my-8">
                  <div className="relative w-16 h-16 mx-auto">
                    <div className="absolute inset-0 rounded-full border-4 border-[#dceceb] border-t-[#176f78] animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-amber-500 animate-pulse" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-[#17343a] text-lg">
                      Evaluating Skill Ratings &amp; Pitch Balance
                    </h3>
                    <p className="text-xs text-[#527078] mt-1">
                      Gemini AI is analyzing operator competencies against Line {line.lineNo} requirements...
                    </p>
                  </div>
                  <div className="space-y-1.5 text-left bg-white p-4 rounded-2xl border border-[#e7e1d5] text-xs">
                    <div className={`flex items-center gap-2 ${loadingStep >= 1 ? 'text-emerald-700 font-bold' : 'text-[#738287]'}`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Matching bottleneck station &quot;{line.bottleneck?.station}&quot;</span>
                    </div>
                    <div className={`flex items-center gap-2 ${loadingStep >= 2 ? 'text-emerald-700 font-bold' : 'text-[#738287]'}`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Filtering operator skill matrix for {line.style}</span>
                    </div>
                    <div className={`flex items-center gap-2 ${loadingStep >= 3 ? 'text-emerald-700 font-bold' : 'text-[#738287]'}`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Balancing pitch time &amp; allocating floater buffers</span>
                    </div>
                  </div>
                </div>
              ) : recommendation ? (
                <div className="space-y-6">
                  {/* Top KPI Summary Banner */}
                  <div className="p-5 rounded-3xl bg-linear-to-r from-[#0c4a60] to-[#176f78] text-white shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/20 pb-3">
                      <div>
                        <span className="text-[11px] uppercase tracking-wider text-teal-200 font-bold">
                          AI Assignment Recommendation
                        </span>
                        <h3 className="text-lg sm:text-xl font-black text-white">
                          {recommendation.recommendationTitle}
                        </h3>
                      </div>
                      <span className="text-xs text-teal-100 font-mono-numbers">
                        Generated at {recommendation.generatedAt}
                      </span>
                    </div>

                    {/* Metrics Strip */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10 space-y-0.5">
                        <div className="text-[11px] text-teal-100 font-medium">Predicted Efficiency</div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black font-mono-numbers text-white">
                            {recommendation.predictedEfficiency}%
                          </span>
                          <span className="text-xs font-bold text-emerald-300">
                            {recommendation.efficiencyLift}
                          </span>
                        </div>
                        <div className="text-[10px] text-teal-200">Baseline Target: {line.targetEff}%</div>
                      </div>

                      <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10 space-y-0.5">
                        <div className="text-[11px] text-teal-100 font-medium">Balancing Index Score</div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black font-mono-numbers text-white">
                            {recommendation.balancingScore}/100
                          </span>
                          <span className="text-xs font-bold text-teal-200">
                            Optimal Line Pitch
                          </span>
                        </div>
                        <div className="text-[10px] text-teal-200">Smooth WIP bundle flow</div>
                      </div>

                      <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10 space-y-0.5">
                        <div className="text-[11px] text-teal-100 font-medium">Selected Team Roster</div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black font-mono-numbers text-white">
                            {selectedMemberIds.size} of {recommendation.suggestedAssignments.length}
                          </span>
                          <span className="text-xs font-bold text-amber-300">
                            Personnel
                          </span>
                        </div>
                        <div className="text-[10px] text-teal-200">100% Core Roles Covered</div>
                      </div>
                    </div>

                    {/* Bottleneck Strategy Callout */}
                    <div className="p-3 rounded-2xl bg-black/20 border border-white/15 text-xs space-y-1">
                      <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5" />
                        <span>Bottleneck Neutralization Strategy</span>
                      </div>
                      <p className="text-teal-50 leading-relaxed">
                        {recommendation.bottleneckStrategy}
                      </p>
                    </div>
                  </div>

                  {/* Assignments List Header with Select All */}
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <div>
                      <h4 className="font-extrabold text-base text-[#17343a]">
                        Recommended Team Members ({recommendation.suggestedAssignments.length})
                      </h4>
                      <p className="text-xs text-[#527078]">
                        Select or uncheck personnel before saving to Line {line.lineNo}.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleToggleAll}
                      className="text-xs font-bold text-[#176f78] hover:underline cursor-pointer"
                    >
                      {selectedMemberIds.size === recommendation.suggestedAssignments.length
                        ? 'Deselect All'
                        : 'Select All'}
                    </button>
                  </div>

                  {/* Team Members Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {recommendation.suggestedAssignments.map(member => {
                      const isSelected = selectedMemberIds.has(member.memberId);
                      const isGradeAPlus = member.skillGrade === 'A+';
                      const isGradeA = member.skillGrade === 'A';

                      return (
                        <div
                          key={member.memberId}
                          onClick={() => handleToggleMember(member.memberId)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer relative space-y-3 ${
                            isSelected
                              ? 'bg-white border-[#176f78] ring-2 ring-[#176f78]/20 shadow-xs'
                              : 'bg-white/60 border-[#e7e1d5] opacity-75 hover:opacity-100 hover:border-[#cbd5e1]'
                          }`}
                        >
                          {/* Card Top: Checkbox, Name, Role & Skill Grade */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                                  isSelected
                                    ? 'bg-[#176f78] border-[#176f78] text-white'
                                    : 'border-[#cbd5e1] bg-white'
                                }`}
                              >
                                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>
                              <div>
                                <div className="font-extrabold text-sm text-[#17343a] flex items-center gap-2">
                                  <span>{member.name}</span>
                                  <span
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                                      isGradeAPlus
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                        : isGradeA
                                        ? 'bg-teal-100 text-teal-800 border border-teal-300'
                                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                                    }`}
                                  >
                                    Grade {member.skillGrade}
                                  </span>
                                </div>
                                <div className="text-xs font-bold text-[#176f78] mt-0.5">
                                  {member.role}
                                </div>
                              </div>
                            </div>

                            {/* Fit Score Badge */}
                            <div className="text-right">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black bg-sky-50 text-sky-800 border border-sky-200">
                                <Award className="w-3 h-3 text-sky-600" />
                                <span>{member.fitScore}% Fit</span>
                              </span>
                              {member.efficiencyRating && (
                                <div className="text-[10px] text-[#527078] font-mono-numbers mt-0.5">
                                  Eff: {member.efficiencyRating}%
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Assigned Workstation Strip */}
                          <div className="p-2.5 rounded-xl bg-[#f5f3ec] border border-[#e7e1d5] text-xs">
                            <span className="text-[10px] uppercase font-bold text-[#738287] block">
                              Assigned Workstation &amp; Responsibility
                            </span>
                            <span className="font-bold text-[#17343a]">
                              {member.assignedWorkstation}
                            </span>
                          </div>

                          {/* IE Rationale */}
                          <p className="text-xs text-[#527078] leading-relaxed">
                            <strong className="text-[#17343a]">IE Rationale:</strong> {member.rationale}
                          </p>

                          {/* Matched Skills Tags */}
                          <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-[#f0eee6]">
                            <span className="text-[10px] text-[#738287] font-semibold">Matched:</span>
                            {member.matchedSkills.map((sk, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md bg-white border border-[#d9d2c2] text-[#17343a] text-[10px] font-medium"
                              >
                                {sk}
                              </span>
                            ))}
                            {member.contact && (
                              <span className="text-[10px] text-[#738287] ml-auto font-mono-numbers">
                                {member.contact}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* IE Analysis Notes Box */}
                  {recommendation.ieAnalysisNotes && (
                    <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs space-y-1">
                      <div className="font-bold text-amber-900 flex items-center gap-1.5 text-xs uppercase tracking-wide">
                        <Clock className="w-3.5 h-3.5 text-amber-700" />
                        <span>Tactical Morning Top 5 Directives</span>
                      </div>
                      <p className="text-amber-950 leading-relaxed">
                        {recommendation.ieAnalysisNotes}
                      </p>
                    </div>
                  )}
                </div>
              ) : errorMsg ? (
                <div className="p-8 text-center bg-rose-50 rounded-2xl border border-rose-200 space-y-3">
                  <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
                  <div className="font-bold text-rose-900 text-sm">{errorMsg}</div>
                  <button
                    type="button"
                    onClick={fetchAiSuggestions}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs"
                  >
                    Retry AI Analysis
                  </button>
                </div>
              ) : null}
            </>
          )}

          {/* TAB 2: CANDIDATE SKILL MATRIX POOL */}
          {activeTab === 'skill_pool' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-base text-[#17343a]">
                    Factory Operator &amp; Supervisor Skill Matrix Bench
                  </h3>
                  <p className="text-xs text-[#527078]">
                    Verified skill ratings, machine competencies, and historical quality pass rates.
                  </p>
                </div>

                {/* Search */}
                <div className="relative min-w-[220px]">
                  <Search className="w-3.5 h-3.5 text-[#738287] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={candidateSearch}
                    onChange={e => setCandidateSearch(e.target.value)}
                    placeholder="Search candidate, skill, machine..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#d9d2c2] bg-white text-xs text-[#17343a] focus:outline-hidden focus:border-[#176f78]"
                  />
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-bold text-[#738287] text-[11px] uppercase">Grade:</span>
                {['all', 'A+', 'A', 'B+'].map(gr => (
                  <button
                    key={gr}
                    type="button"
                    onClick={() => setSelectedGradeFilter(gr)}
                    className={`px-2.5 py-1 rounded-full font-bold text-[11px] transition-all cursor-pointer ${
                      selectedGradeFilter === gr
                        ? 'bg-[#176f78] text-white'
                        : 'bg-white text-[#527078] border border-[#d9d2c2]'
                    }`}
                  >
                    {gr === 'all' ? 'All Grades' : `Grade ${gr}`}
                  </button>
                ))}

                <span className="text-[#d9d2c2] mx-1">|</span>

                <span className="font-bold text-[#738287] text-[11px] uppercase">Role:</span>
                {['all', 'Supervisor', 'Bottleneck', 'IE', 'QC', 'Mechanic', 'Float'].map(ro => (
                  <button
                    key={ro}
                    type="button"
                    onClick={() => setSelectedRoleFilter(ro)}
                    className={`px-2.5 py-1 rounded-full font-bold text-[11px] transition-all cursor-pointer ${
                      selectedRoleFilter === ro
                        ? 'bg-[#17343a] text-white'
                        : 'bg-white text-[#527078] border border-[#d9d2c2]'
                    }`}
                  >
                    {ro === 'all' ? 'All Roles' : ro}
                  </button>
                ))}
              </div>

              {/* Candidates Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredCandidates.map(cand => (
                  <div
                    key={cand.id}
                    className="p-4 rounded-2xl bg-white border border-[#e7e1d5] shadow-2xs space-y-3 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-extrabold text-[#17343a] text-sm">{cand.name}</div>
                        <div className="text-[11px] font-bold text-[#176f78]">{cand.primaryRole}</div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                          cand.skillGrade === 'A+'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : cand.skillGrade === 'A'
                            ? 'bg-teal-100 text-teal-800 border border-teal-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        Grade {cand.skillGrade} ({cand.overallScore}/100)
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-1.5 p-2 rounded-xl bg-[#f5f3ec] text-center font-mono-numbers">
                      <div>
                        <span className="text-[9px] text-[#738287] block">Efficiency</span>
                        <strong className="text-[#17343a]">{cand.efficiencyRatingPct}%</strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-[#738287] block">Quality</span>
                        <strong className="text-emerald-700">{cand.qualityPassRatePct}%</strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-[#738287] block">Attendance</span>
                        <strong className="text-[#17343a]">{cand.attendancePct}%</strong>
                      </div>
                    </div>

                    {/* Critical Operations & Machines */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-[#738287] uppercase block">Critical Operations:</span>
                      <div className="flex flex-wrap gap-1">
                        {cand.criticalOperations.map((op, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px]">
                            {op}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-[#738287] uppercase block">Specialties:</span>
                      <div className="flex flex-wrap gap-1">
                        {cand.specialties.map((sp, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded bg-sky-50 text-sky-800 text-[10px]">
                            {sp}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#f0eee6] flex items-center justify-between text-[10px] text-[#738287]">
                      <span>Exp: {cand.experienceYears} Years</span>
                      <span className="font-mono-numbers">{cand.contact}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-white border-t border-[#e7e1d5] flex items-center justify-between gap-3 flex-wrap">
          <div className="text-xs text-[#527078]">
            {activeTab === 'suggestions' && recommendation && (
              <span>
                <strong>{selectedMemberIds.size}</strong> team members selected for assignment to <strong>Line {line.lineNo}</strong>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#d1d5db] text-xs font-bold text-[#374151] hover:bg-[#f3f4f6] cursor-pointer"
            >
              Cancel
            </button>

            {activeTab === 'suggestions' && (
              <button
                type="button"
                disabled={isLoading || !recommendation || selectedMemberIds.size === 0}
                onClick={handleApply}
                className="px-5 py-2 rounded-xl bg-[#176f78] hover:bg-[#12555c] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Apply {selectedMemberIds.size} AI Assignments to Line {line.lineNo}</span>
              </button>
            )}

            {activeTab === 'skill_pool' && (
              <button
                type="button"
                onClick={() => setActiveTab('suggestions')}
                className="px-5 py-2 rounded-xl bg-[#176f78] hover:bg-[#12555c] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Return to AI Recommendations</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
  ArrowLeft,
  Plus,
  CheckCircle2,
  XCircle,
  Play,
  Pause,
  RotateCcw,
  Check,
  TrendingUp,
  AlertCircle,
  Clock,
  Printer
} from 'lucide-react';
import { LeanMethod, LeanActionItem, UserProfile } from '../types';
import { CapacityCalculatorWorkspace } from './CapacityCalculatorWorkspace';

interface LeanToolWorkspaceProps {
  method: LeanMethod;
  onBack: () => void;
  actions: LeanActionItem[];
  onUpdateActions: (actions: LeanActionItem[]) => void;
  profile: UserProfile;
}

export const LeanToolWorkspace: React.FC<LeanToolWorkspaceProps> = ({
  method,
  onBack,
  actions,
  onUpdateActions,
  profile
}) => {
  // Common states
  const [selectedLine, setSelectedLine] = useState('18');

  // --- 1. 5S Audit State ---
  const [fiveSArea, setFiveSArea] = useState('Line 18 Sewing Floor');
  const [fiveSScores, setFiveSScores] = useState({
    sort: 4,
    setInOrder: 5,
    shine: 4,
    standardize: 4,
    sustain: 3
  });
  const [redTags, setRedTags] = useState([
    { id: 'rt-1', item: 'Broken needle plate on St #04', station: 'Station 04', action: 'Replace with 1/4" feed dog', status: 'disposed' },
    { id: 'rt-2', item: 'Unidentified thread cones on floor', station: 'Station 09', action: 'Return to thread staging bin', status: 'open' },
    { id: 'rt-3', item: 'Damaged ergonomic chair height lever', station: 'Station 14', action: 'Maintenance ticket #412', status: 'open' }
  ]);
  const [newRedTagItem, setNewRedTagItem] = useState('');
  const [newRedTagStation, setNewRedTagStation] = useState('Station 02');

  const total5SScore = (Object.values(fiveSScores) as number[]).reduce((a: number, b: number) => a + b, 0);
  const fiveSPct = Math.round((total5SScore / 25) * 100);

  // --- 2. 7 Wastes (TIMWOOD+T) State ---
  const [wastesData, setWastesData] = useState([
    { category: 'Waiting', code: 'W', lostMins: 42, color: '#e6813e', desc: 'Needle thread break & mechanic wait' },
    { category: 'Motion', code: 'M', lostMins: 35, color: '#176f78', desc: 'Excess reach for bundle parts & scissors' },
    { category: 'Defects', code: 'D', lostMins: 28, color: '#dc2626', desc: 'Skipped stitch rework on collar join' },
    { category: 'Inventory', code: 'I', lostMins: 22, color: '#854d0e', desc: 'Over-accumulated bundles between stations' },
    { category: 'Transport', code: 'T', lostMins: 18, color: '#64748b', desc: 'Carrying cut pieces from prep tables' },
    { category: 'Overprocessing', code: 'O', lostMins: 14, color: '#0891b2', desc: 'Double pressing and excessive trimming' },
    { category: 'Overproduction', code: 'O', lostMins: 10, color: '#7c3aed', desc: 'Sewing ahead of line takt pace' },
    { category: 'Talent / Skills', code: '+T', lostMins: 8, color: '#059669', desc: 'Underutilized floater skill on basic seam' }
  ]);
  const [wasteNote, setWasteNote] = useState('');
  const [wasteMins, setWasteMins] = useState('10');
  const [wasteCat, setWasteCat] = useState('Waiting');

  // --- 3. Kaizen PDCA State ---
  const [kaizenCards, setKaizenCards] = useState([
    { id: 'k-1', line: '18', title: 'Folder attachment for placket fold', stage: 'act', beforeSec: 38, afterSec: 26, owner: profile.name },
    { id: 'k-2', line: '18', title: 'Color-coded bobbin thread carousel', stage: 'check', beforeSec: 22, afterSec: 14, owner: 'Supervisor Karim' },
    { id: 'k-3', line: '19', title: 'Foot-switch pedal angle adjustment', stage: 'do', beforeSec: 45, afterSec: 39, owner: 'IE Officer M. Hasan' },
    { id: 'k-4', line: '20', title: 'Pre-cut fusible interlining dispenser', stage: 'plan', beforeSec: 32, afterSec: 24, owner: 'Ashikur Rahman' }
  ]);
  const [newKaizenTitle, setNewKaizenTitle] = useState('');
  const [newKaizenLine, setNewKaizenLine] = useState('18');

  // --- 4. SMED Changeover State ---
  const [smedTimerRunning, setSmedTimerRunning] = useState(false);
  const [smedSeconds, setSmedSeconds] = useState(720); // 12 mins
  const [smedTasks, setSmedTasks] = useState([
    { id: 's-1', title: 'Pre-stage tech-pack and trim sample card', type: 'external', done: true },
    { id: 's-2', title: 'Pre-wind 15 bobbins with correct style thread', type: 'external', done: true },
    { id: 's-3', title: 'Verify folder attachment and needle gauge on mock bench', type: 'external', done: true },
    { id: 's-4', title: 'Stop line & remove previous style needle plate', type: 'internal', done: false },
    { id: 's-5', title: 'Install new folder jig & adjust feed dog height', type: 'internal', done: false },
    { id: 's-6', title: 'Run first production test mock piece & QA check', type: 'internal', done: false }
  ]);

  useEffect(() => {
    let interval: any;
    if (smedTimerRunning) {
      interval = setInterval(() => {
        setSmedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [smedTimerRunning]);

  // --- 5. Takt & Yamazumi State ---
  const [taktTimeSec, setTaktTimeSec] = useState(40.0);
  const [yamazumiStations, setYamazumiStations] = useState([
    { name: '01. Collar Band', va: 26, nva: 6, wait: 3 },
    { name: '02. Shoulder Join', va: 34, nva: 8, wait: 3 }, // Over takt!
    { name: '03. Sleeve Set', va: 28, nva: 7, wait: 4 },
    { name: '04. Side Seam', va: 32, nva: 9, wait: 2 }, // Over takt!
    { name: '05. Bottom Hem', va: 24, nva: 5, wait: 6 },
    { name: '06. Label & Tack', va: 20, nva: 4, wait: 8 }
  ]);

  // --- 6. Andon Board State ---
  const [andonCalls, setAndonCalls] = useState([
    { id: 'an-1', line: '18', station: 'St #07 (Sleeve Attach)', type: 'Machine', message: 'Thread tension sensor fault', time: '4 min ago', status: 'acknowledged' },
    { id: 'an-2', line: '19', station: 'St #12 (Bottom Hem)', type: 'Quality', message: 'Puckering on seam allowance', time: '1 min ago', status: 'pending' },
    { id: 'an-3', line: '18', station: 'St #02 (Front Prep)', type: 'Material', message: 'Main label trim shortage', time: '7 min ago', status: 'acknowledged' }
  ]);

  // --- 7. OEE / TPM State ---
  const [oeeInputs, setOeeInputs] = useState({
    plannedMins: 480,
    downtimeMins: 38,
    idealRatePerHour: 120,
    totalOutputPcs: 840,
    defectPcs: 16
  });

  const operatingMins = oeeInputs.plannedMins - oeeInputs.downtimeMins;
  const availabilityPct = Math.round((operatingMins / oeeInputs.plannedMins) * 1000) / 10;
  const potentialOutput = (operatingMins / 60) * oeeInputs.idealRatePerHour;
  const performancePct = Math.min(100, Math.round((oeeInputs.totalOutputPcs / potentialOutput) * 1000) / 10);
  const qualityPct = Math.round(((oeeInputs.totalOutputPcs - oeeInputs.defectPcs) / oeeInputs.totalOutputPcs) * 1000) / 10;
  const oeeTotalPct = Math.round(((availabilityPct * performancePct * qualityPct) / 10000) * 10) / 10;

  // --- 8. A3 Problem Solving State ---
  const [a3Data, setA3Data] = useState({
    title: 'Elimination of Collar Puckering on Style Polo-2026',
    author: profile.name,
    targetLine: 'Line 18',
    background: 'Customer quality audit flagged 3.8% collar wavy puckering on dry-fit polo pique fabric.',
    currentCondition: 'Average rework rate at Station 06 is 42 pieces per shift, causing 35 min lost operator time.',
    targetCondition: 'Zero puckering defect (<0.5%) and station cycle time stabilized at 32 seconds.',
    why1: 'Why does collar have puckering? -> Tension imbalance between upper needle and lower looper.',
    why2: 'Why is tension imbalanced? -> Slippage of silicone thread spool on high-speed rotation.',
    why3: 'Why does spool slip? -> Missing felt pad cushion on spindle pin.',
    why4: 'Why was felt pad missing? -> Replaced with standard metal washer during last changeover.',
    why5: 'Root Cause: No standard visual fixture checklist for machine mechanic setup before style launch.',
    countermeasure: 'Install magnetic anti-slip spool lock and add check to SMED changeover sheet.',
    verification: 'Track next 500 pcs run with inline inspector signing off zero puckering.'
  });

  // --- 9. Kanban / WIP Control State ---
  const [kanbanBuffers, setKanbanBuffers] = useState([
    { stage: 'Cutting Store', current: 480, min: 200, max: 600, status: 'safe' },
    { stage: 'Front & Back Prep', current: 160, min: 100, max: 300, status: 'safe' },
    { stage: 'Collar & Sleeve Assembly', current: 310, min: 100, max: 280, status: 'overflow' },
    { stage: 'Line Assembly', current: 220, min: 150, max: 350, status: 'safe' },
    { stage: 'Finishing & Pressing', current: 85, min: 90, max: 250, status: 'low' }
  ]);

  // --- 10. Gemba Walk State ---
  const [gembaNotes, setGembaNotes] = useState([
    { id: 'g-1', time: '09:30 AM', line: '18', station: 'St #04', finding: 'Operator standing to reach cut panel bundles', waste: 'Motion', action: 'Adjusted bundle trolley height to 85cm' },
    { id: 'g-2', time: '11:45 AM', line: '19', station: 'St #08', finding: 'WIP overflowing on conveyor ramp', waste: 'Inventory', action: 'Temporarily reassigned floater to clear bottleneck' },
    { id: 'g-3', time: '02:15 PM', line: '20', station: 'St #14', finding: 'Scissors blunt causing double trimming cuts', waste: 'Overprocessing', action: 'Replaced with auto thread snips' }
  ]);
  const [newGembaLine, setNewGembaLine] = useState('18');
  const [newGembaStation, setNewGembaStation] = useState('Station 06');
  const [newGembaFinding, setNewGembaFinding] = useState('');
  const [newGembaWaste, setNewGembaWaste] = useState('Motion');
  const [newGembaAction, setNewGembaAction] = useState('');

  // --- 11. Standard Work State ---
  const [standardWorkSteps, setStandardWorkSteps] = useState([
    { id: 'sw-1', step: 'Pick up front body panel from bundle crate', manualSec: 2.5, machineSec: 0, walkSec: 1.0 },
    { id: 'sw-2', step: 'Align collar band into folder guide', manualSec: 3.8, machineSec: 0, walkSec: 0 },
    { id: 'sw-3', step: 'Sew collar seam (single needle lockstitch)', manualSec: 1.2, machineSec: 18.5, walkSec: 0 },
    { id: 'sw-4', step: 'Trim thread & inspect edge alignment', manualSec: 4.0, machineSec: 0, walkSec: 0 },
    { id: 'sw-5', step: 'Place completed piece into downstream chute', manualSec: 1.8, machineSec: 0, walkSec: 0.8 }
  ]);

  const totalManualSec = standardWorkSteps.reduce((acc, s) => acc + s.manualSec, 0);
  const totalMachineSec = standardWorkSteps.reduce((acc, s) => acc + s.machineSec, 0);
  const totalWalkSec = standardWorkSteps.reduce((acc, s) => acc + s.walkSec, 0);
  const totalCycleSec = Math.round((totalManualSec + totalMachineSec + totalWalkSec) * 10) / 10;

  // --- 12. Poka-Yoke State ---
  const [pokaYokeFixtures, setPokaYokeFixtures] = useState([
    { id: 'py-1', line: '18', station: 'Station 04 (Collar Set)', name: 'Magnetic Seam Guide Folder', defectPrevented: 'Uneven collar margin (< 2mm)', status: 'active', inspectedDate: 'Today' },
    { id: 'py-2', line: '18', station: 'Station 08 (Sleeve Hem)', name: 'Auto-Stop Optical Needle Sensor', defectPrevented: 'Run-off stitch on stretch knit', status: 'active', inspectedDate: 'Today' },
    { id: 'py-3', line: '19', station: 'Station 11 (Placket Stitch)', name: 'Color-Coded Notch Laser Alignment', defectPrevented: 'Skewed placket box center', status: 'active', inspectedDate: 'Yesterday' },
    { id: 'py-4', line: '20', station: 'Station 15 (Button Hole)', name: 'Pneumatic Fabric Clamp Lock', defectPrevented: 'Misaligned button distance', status: 'maintenance', inspectedDate: '3 days ago' }
  ]);

  // Method Icon Renderer
  const getToolIcon = () => {
    switch (method.id) {
      case '5s-audit': return Sparkles;
      case '7-wastes': return Trash2;
      case 'kaizen-pdca': return RotateCw;
      case 'smed-changeover': return Timer;
      case 'takt-yamazumi': return BarChart3;
      case 'andon-board': return AlertTriangle;
      case 'oee-tpm': return Gauge;
      case 'a3-problem-solving': return FileText;
      case 'kanban-wip': return Columns3;
      case 'gemba-walk': return Glasses;
      case 'standard-work': return ClipboardCheck;
      case 'poka-yoke': return ShieldCheck;
      default: return Sparkles;
    }
  };

  const IconComponent = getToolIcon();

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Breadcrumb & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-[#d9d2c2] shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            id="back-to-lean-toolkit-btn"
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#f1eee6] border border-[#d9d2c2] text-xs font-bold text-[#17343a] hover:bg-[#e7e1d5] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[#176f78]" />
            <span>Back to 12 Tools</span>
          </button>

          <div className="h-5 w-px bg-[#d9d2c2]" />

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-800">
              <IconComponent className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#527078]">
                Lean Toolkit Workspace
              </span>
              <h2 className="text-sm font-bold text-[#17343a] leading-tight">
                {method.title || method.name}
              </h2>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#527078]">Target Sewing Line:</span>
          <select
            value={selectedLine}
            onChange={e => setSelectedLine(e.target.value)}
            className="px-2.5 py-1 text-xs font-bold rounded-xl bg-[#f1eee6] border border-[#d9d2c2] text-[#17343a] focus:outline-hidden"
          >
            <option value="18">Line 18 (Polo Shirts)</option>
            <option value="19">Line 19 (Casual Tees)</option>
            <option value="20">Line 20 (Jackets)</option>
            <option value="21">Line 21 (Fleece Hoodies)</option>
            <option value="22">Line 22 (Cargo Pants)</option>
          </select>
        </div>
      </div>

      {/* Tool Header Description Box */}
      <div className="p-5 rounded-2xl bg-[#fbfaf6] border border-[#d9d2c2] shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-[#dceceb] text-[#176f78] px-2 py-0.5 rounded">
              {method.category.toUpperCase()} TOOL
            </span>
            <h1 className="font-display text-2xl font-bold uppercase text-[#17343a] mt-1.5">
              {method.title || method.name}
            </h1>
            <p className="text-xs sm:text-sm text-[#527078] mt-1 max-w-3xl">
              {method.description || method.purpose}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white border border-[#d9d2c2] flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-[#dceceb] text-[#176f78] flex items-center justify-center font-bold font-mono-numbers">
              {method.index || '01'}
            </div>
            <div>
              <div className="text-[10px] text-[#527078] font-bold uppercase">Focus Metric</div>
              <div className="text-xs font-bold text-[#17343a]">{method.focusMetric || 'Floor Efficiency'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CAPACITY CALCULATOR TOOL */}
      {/* ========================================================================= */}
      {method.id === 'capacity-calculator' && (
        <CapacityCalculatorWorkspace
          onBack={onBack}
          actions={actions}
          onUpdateActions={onUpdateActions}
          profile={profile}
        />
      )}

      {/* ========================================================================= */}
      {/* 1. 5S AUDIT INTERACTIVE TOOL */}
      {/* ========================================================================= */}
      {method.id === '5s-audit' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Scorecard */}
            <div className="lg:col-span-7 p-5 rounded-2xl bg-white border border-[#d9d2c2] shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#e7e1d5] pb-3">
                <div>
                  <h3 className="font-bold text-sm text-[#17343a]">5S Audit Scorecard</h3>
                  <p className="text-[11px] text-[#527078]">Evaluate Sort, Set in Order, Shine, Standardize, and Sustain</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase text-[#527078]">Calculated Score</span>
                  <div className="text-2xl font-bold font-mono-numbers text-[#176f78]">
                    {fiveSPct}%
                  </div>
                </div>
              </div>

              {/* 5 Pillars Sliders */}
              <div className="space-y-3">
                {[
                  { key: 'sort', name: '1S - Sort (Seiri)', desc: 'Remove all unnecessary items, broken scissors, excess trims' },
                  { key: 'setInOrder', name: '2S - Set in Order (Seiton)', desc: 'Shadow boards, marked bobbin holders, clear WIP limits' },
                  { key: 'shine', name: '3S - Shine (Seiso)', desc: 'Machines cleaned, lint blown out, oil leaks prevented' },
                  { key: 'standardize', name: '4S - Standardize (Seiketsu)', desc: 'Visual SOPs posted, color codes, standard work heights' },
                  { key: 'sustain', name: '5S - Sustain (Shitsuke)', desc: 'Daily 5-minute end-of-shift audits conducted by operators' }
                ].map(item => (
                  <div key={item.key} className="p-3 rounded-xl bg-[#fbfaf6] border border-[#e7e1d5] space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#17343a]">{item.name}</span>
                      <span className="font-bold font-mono-numbers text-[#176f78]">
                        {(fiveSScores as any)[item.key]} / 5 pts
                      </span>
                    </div>
                    <p className="text-[11px] text-[#527078]">{item.desc}</p>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={(fiveSScores as any)[item.key]}
                      onChange={e =>
                        setFiveSScores(prev => ({
                          ...prev,
                          [item.key]: parseInt(e.target.value)
                        }))
                      }
                      className="w-full accent-[#176f78] cursor-pointer"
                    />
                  </div>
                ))}
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Audit Status: {fiveSPct >= 85 ? 'Grade A - Certified' : 'Requires Corrective Action'}</span>
                </span>
                <button
                  onClick={() => alert(`5S Audit for ${fiveSArea} recorded with score ${fiveSPct}%!`)}
                  className="px-4 py-2 rounded-xl bg-[#176f78] text-white text-xs font-bold hover:bg-[#12555c] transition-colors"
                >
                  Save 5S Audit Record
                </button>
              </div>
            </div>

            {/* Red Tag Registry */}
            <div className="lg:col-span-5 p-5 rounded-2xl bg-white border border-[#d9d2c2] shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#e7e1d5] pb-3">
                <h3 className="font-bold text-sm text-[#17343a] flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                  <span>Red-Tag Floor Registry</span>
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                  {redTags.filter(r => r.status === 'open').length} Open
                </span>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {redTags.map(tag => (
                  <div key={tag.id} className="p-2.5 rounded-xl border border-[#e7e1d5] bg-[#fbfaf6] text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#17343a]">{tag.item}</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          tag.status === 'open' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {tag.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#527078]">
                      <span>{tag.station}</span>
                      <span>Action: {tag.action}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Red Tag */}
              <div className="pt-2 border-t border-[#e7e1d5] space-y-2">
                <span className="text-[11px] font-bold text-[#17343a]">Add New Red-Tagged Item</span>
                <input
                  type="text"
                  placeholder="Defective part, scrap or obsolete tool..."
                  value={newRedTagItem}
                  onChange={e => setNewRedTagItem(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-[#f1eee6] border border-[#d9d2c2] text-[#17343a]"
                />
                <button
                  onClick={() => {
                    if (!newRedTagItem) return;
                    setRedTags(prev => [
                      { id: `rt-${Date.now()}`, item: newRedTagItem, station: newRedTagStation, action: 'To be audited by line lead', status: 'open' },
                      ...prev
                    ]);
                    setNewRedTagItem('');
                  }}
                  className="w-full py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-colors flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Attach Floor Red-Tag</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. 7 WASTES (TIMWOOD+T) TOOL */}
      {/* ========================================================================= */}
      {method.id === '7-wastes' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Pareto Chart & Waste Breakdown */}
            <div className="lg:col-span-8 p-5 rounded-2xl bg-white border border-[#d9d2c2] shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#e7e1d5] pb-3">
                <div>
                  <h3 className="font-bold text-sm text-[#17343a]">TIMWOOD+T Lost Minutes Pareto</h3>
                  <p className="text-[11px] text-[#527078]">Total recorded waste today: {wastesData.reduce((a, b) => a + b.lostMins, 0)} minutes</p>
                </div>
                <span className="text-xs font-bold text-[#176f78] bg-[#dceceb] px-2.5 py-1 rounded-xl">
                  Target: &lt; 60 Mins/Shift
                </span>
              </div>

              {/* Bars */}
              <div className="space-y-3">
                {wastesData.map(w => {
                  const maxMins = Math.max(...wastesData.map(x => x.lostMins));
                  const pct = Math.round((w.lostMins / maxMins) * 100);
                  return (
                    <div key={w.category} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#17343a] flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-md bg-[#f1eee6] text-[#17343a] text-[10px] font-bold flex items-center justify-center">
                            {w.code}
                          </span>
                          <span>{w.category}</span>
                        </span>
                        <span className="text-[11px] text-[#527078]">
                          <strong className="text-[#17343a] font-mono-numbers">{w.lostMins}</strong> mins lost
                        </span>
                      </div>
                      <div className="h-2.5 w-full bg-[#f1eee6] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: w.color }}
                        />
                      </div>
                      <p className="text-[10px] text-[#527078] italic">{w.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Waste Observation Logger */}
            <div className="lg:col-span-4 p-5 rounded-2xl bg-white border border-[#d9d2c2] shadow-2xs space-y-3">
              <h3 className="font-bold text-sm text-[#17343a]">Log Floor Waste Observation</h3>
              <p className="text-[11px] text-[#527078]">Capture non-value added time seen during walks</p>

              <div className="space-y-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#527078]">Waste Category</label>
                  <select
                    value={wasteCat}
                    onChange={e => setWasteCat(e.target.value)}
                    className="w-full mt-0.5 px-3 py-1.5 text-xs rounded-xl bg-[#f1eee6] border border-[#d9d2c2] text-[#17343a]"
                  >
                    {wastesData.map(w => (
                      <option key={w.category} value={w.category}>{w.category} ({w.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-[#527078]">Minutes Lost</label>
                  <input
                    type="number"
                    value={wasteMins}
                    onChange={e => setWasteMins(e.target.value)}
                    className="w-full mt-0.5 px-3 py-1.5 text-xs rounded-xl bg-[#f1eee6] border border-[#d9d2c2] text-[#17343a]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-[#527078]">Observation / Root Cause</label>
                  <textarea
                    rows={3}
                    placeholder="Describe operator motion, wait reason, or defect..."
                    value={wasteNote}
                    onChange={e => setWasteNote(e.target.value)}
                    className="w-full mt-0.5 px-3 py-1.5 text-xs rounded-xl bg-[#f1eee6] border border-[#d9d2c2] text-[#17343a]"
                  />
                </div>

                <button
                  onClick={() => {
                    const mins = parseInt(wasteMins) || 5;
                    setWastesData(prev =>
                      prev.map(w => (w.category === wasteCat ? { ...w, lostMins: w.lostMins + mins } : w))
                    );
                    setWasteNote('');
                    alert(`Logged ${mins} mins lost under ${wasteCat}!`);
                  }}
                  className="w-full py-2 rounded-xl bg-[#176f78] text-white text-xs font-bold hover:bg-[#12555c] transition-colors"
                >
                  Log Waste Incident
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. KAIZEN PDCA TOOL */}
      {/* ========================================================================= */}
      {method.id === 'kaizen-pdca' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-[#d9d2c2]">
            <div>
              <h3 className="font-bold text-sm text-[#17343a]">Plan-Do-Check-Act Kaizen Cycle Board</h3>
              <p className="text-[11px] text-[#527078]">Manage continuous improvement cards across all floor stages</p>
            </div>
            <button
              onClick={() => {
                const title = prompt('Enter new Kaizen title:');
                if (title) {
                  setKaizenCards(prev => [
                    { id: `k-${Date.now()}`, line: selectedLine, title, stage: 'plan', beforeSec: 40, afterSec: 32, owner: profile.name },
                    ...prev
                  ]);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#176f78] text-white text-xs font-bold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Kaizen Card</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(['plan', 'do', 'check', 'act'] as const).map(stage => {
              const stageLabels = {
                plan: { title: '1. Plan (Problem)', desc: 'Define current CT & jig idea', color: 'border-amber-400 bg-amber-50/50' },
                do: { title: '2. Do (Trial)', desc: '1-Operator mock floor trial', color: 'border-sky-400 bg-sky-50/50' },
                check: { title: '3. Check (Verify)', desc: 'Cycle time before vs after', color: 'border-emerald-400 bg-emerald-50/50' },
                act: { title: '4. Act (Standardize)', desc: 'Rollout & Standard Work sheet', color: 'border-purple-400 bg-purple-50/50' }
              };
              const cardsInStage = kaizenCards.filter(c => c.stage === stage);

              return (
                <div key={stage} className={`p-4 rounded-2xl border-2 ${stageLabels[stage].color} space-y-3`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs uppercase text-[#17343a]">{stageLabels[stage].title}</h4>
                      <p className="text-[10px] text-[#527078]">{stageLabels[stage].desc}</p>
                    </div>
                    <span className="text-xs font-bold font-mono-numbers px-2 py-0.5 rounded-full bg-white border border-[#d9d2c2]">
                      {cardsInStage.length}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {cardsInStage.map(card => (
                      <div key={card.id} className="p-3 rounded-xl bg-white border border-[#d9d2c2] shadow-2xs space-y-1.5">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-[#176f78]">Line {card.line}</span>
                          <span className="text-[#527078]">{card.owner}</span>
                        </div>
                        <div className="font-bold text-xs text-[#17343a] leading-snug">{card.title}</div>
                        <div className="text-[10px] text-emerald-700 font-mono-numbers flex items-center justify-between">
                          <span>Before: {card.beforeSec}s</span>
                          <span>After: {card.afterSec}s</span>
                          <span className="font-bold text-emerald-600">-{card.beforeSec - card.afterSec}s</span>
                        </div>
                        <div className="pt-1 flex items-center justify-end">
                          <button
                            onClick={() => {
                              const nextStage = stage === 'plan' ? 'do' : stage === 'do' ? 'check' : stage === 'check' ? 'act' : 'plan';
                              setKaizenCards(prev =>
                                prev.map(c => (c.id === card.id ? { ...c, stage: nextStage } : c))
                              );
                            }}
                            className="text-[10px] font-bold text-[#176f78] hover:underline"
                          >
                            Advance Stage →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SMED CHANGEOVER TOOL */}
      {/* ========================================================================= */}
      {method.id === 'smed-changeover' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Stopwatch & Summary */}
            <div className="lg:col-span-4 p-5 rounded-2xl bg-white border border-[#d9d2c2] shadow-2xs space-y-4 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#527078]">
                Active Style Changeover Timer
              </span>
              <div className="font-mono-numbers text-4xl font-bold text-[#176f78]">
                {Math.floor(smedSeconds / 60)}:{(smedSeconds % 60).toString().padStart(2, '0')}
              </div>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setSmedTimerRunning(!smedTimerRunning)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-colors ${
                    smedTimerRunning ? 'bg-amber-600' : 'bg-emerald-600'
                  }`}
                >
                  {smedTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{smedTimerRunning ? 'Pause' : 'Start Changeover'}</span>
                </button>
                <button
                  onClick={() => setSmedSeconds(0)}
                  className="p-2 rounded-xl bg-[#f1eee6] border border-[#d9d2c2] text-[#527078] hover:text-[#17343a]"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              <div className="pt-3 border-t border-[#e7e1d5] text-left text-xs space-y-1.5">
                <div className="flex items-center justify-between text-[#527078]">
                  <span>Baseline Style Change:</span>
                  <span className="font-bold text-[#17343a]">38.0 Mins</span>
                </div>
                <div className="flex items-center justify-between text-emerald-700">
                  <span>Current SMED Target:</span>
                  <span className="font-bold">&lt; 15.0 Mins</span>
                </div>
                <div className="flex items-center justify-between text-[#176f78] font-bold">
                  <span>Line Stoppage Reduced By:</span>
                  <span>-60.5%</span>
                </div>
              </div>
            </div>

            {/* Internal vs External Task Checklist */}
            <div className="lg:col-span-8 p-5 rounded-2xl bg-white border border-[#d9d2c2] shadow-2xs space-y-4">
              <h3 className="font-bold text-sm text-[#17343a]">
                Internal vs. External Setup Task Conversion
              </h3>
              <p className="text-[11px] text-[#527078]">
                External tasks MUST be done while line is still sewing old style. Only internal tasks require line stoppage.
              </p>

              <div className="space-y-2">
                {smedTasks.map(t => (
                  <div
                    key={t.id}
                    onClick={() =>
                      setSmedTasks(prev =>
                        prev.map(x => (x.id === t.id ? { ...x, done: !x.done } : x))
                      )
                    }
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      t.done
                        ? 'border-emerald-300 bg-emerald-50/50'
                        : 'border-[#d9d2c2] bg-[#fbfaf6]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold ${
                          t.done ? 'bg-emerald-600 text-white' : 'border border-slate-400'
                        }`}
                      >
                        {t.done && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <span className={`text-xs ${t.done ? 'line-through text-slate-500 font-medium' : 'text-[#17343a] font-bold'}`}>
                        {t.title}
                      </span>
                    </div>

                    <span
                      className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        t.type === 'external' ? 'bg-sky-100 text-sky-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {t.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAKT & YAMAZUMI TOOL */}
      {/* ========================================================================= */}
      {method.id === 'takt-yamazumi' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white border border-[#d9d2c2] shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e7e1d5] pb-3">
              <div>
                <h3 className="font-bold text-sm text-[#17343a]">Yamazumi Operator Workload Stack vs. Takt Time</h3>
                <p className="text-[11px] text-[#527078]">Spot uneven station loading and bottleneck cycle times instantly</p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-[#17343a]">Takt Time:</span>
                <input
                  type="number"
                  step="0.5"
                  value={taktTimeSec}
                  onChange={e => setTaktTimeSec(parseFloat(e.target.value) || 35)}
                  className="w-16 px-2 py-1 text-xs font-bold font-mono-numbers rounded-lg bg-[#f1eee6] border border-[#d9d2c2] text-[#176f78]"
                />
                <span className="text-[#527078]">sec</span>
              </div>
            </div>

            {/* Yamazumi Chart Bars */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
              {yamazumiStations.map(st => {
                const totalCT = st.va + st.nva + st.wait;
                const isOverTakt = totalCT > taktTimeSec;
                return (
                  <div key={st.name} className="flex flex-col items-center p-3 rounded-xl bg-[#fbfaf6] border border-[#e7e1d5] text-center space-y-2">
                    <div className="text-xs font-bold text-[#17343a] truncate w-full">{st.name}</div>
                    <div className="h-44 w-12 bg-white rounded-lg border border-[#d9d2c2] flex flex-col-reverse relative p-1">
                      {/* Takt threshold line */}
                      <div
                        className="absolute inset-x-0 border-t-2 border-rose-500 border-dashed z-10"
                        style={{ bottom: `${(taktTimeSec / 50) * 100}%` }}
                        title={`Takt Time: ${taktTimeSec}s`}
                      />

                      {/* Wait */}
                      <div
                        className="w-full bg-slate-300 rounded-xs mb-0.5"
                        style={{ height: `${(st.wait / 50) * 100}%` }}
                        title={`Wait: ${st.wait}s`}
                      />
                      {/* NVA */}
                      <div
                        className="w-full bg-amber-400 rounded-xs mb-0.5"
                        style={{ height: `${(st.nva / 50) * 100}%` }}
                        title={`Non-Value Added: ${st.nva}s`}
                      />
                      {/* VA */}
                      <div
                        className="w-full bg-[#176f78] rounded-xs"
                        style={{ height: `${(st.va / 50) * 100}%` }}
                        title={`Value Added: ${st.va}s`}
                      />
                    </div>

                    <div className="text-[11px] font-mono-numbers">
                      <span className={`font-bold ${isOverTakt ? 'text-rose-600' : 'text-emerald-700'}`}>
                        {totalCT}s
                      </span>
                      <span className="text-[10px] text-[#527078] block">
                        {isOverTakt ? 'BOTTLENECK' : 'BALANCED'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-[#e7e1d5]">
              <div className="flex items-center gap-4 text-[11px]">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-xs bg-[#176f78]" /> Value-Added</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-xs bg-amber-400" /> Non-Value Added</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-xs bg-slate-300" /> Wait / Motion</span>
                <span className="flex items-center gap-1.5 text-rose-600 font-bold">--- Takt Pace ({taktTimeSec}s)</span>
              </div>
              <button
                onClick={() => {
                  setYamazumiStations([
                    { name: '01. Collar Band', va: 26, nva: 6, wait: 3 },
                    { name: '02. Shoulder Join', va: 29, nva: 5, wait: 3 },
                    { name: '03. Sleeve Set', va: 28, nva: 7, wait: 2 },
                    { name: '04. Side Seam', va: 30, nva: 5, wait: 2 },
                    { name: '05. Bottom Hem', va: 28, nva: 5, wait: 3 },
                    { name: '06. Label & Tack', va: 24, nva: 4, wait: 4 }
                  ]);
                  alert('Line operations leveled! Station times rebalanced under Takt.');
                }}
                className="px-3 py-1.5 rounded-xl bg-[#176f78] text-white text-xs font-bold"
              >
                Simulate Re-Balancing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. ANDON BOARD TOOL */}
      {/* ========================================================================= */}
      {method.id === 'andon-board' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { type: 'Quality', color: 'bg-rose-500 hover:bg-rose-600', icon: AlertTriangle, desc: 'Puckering, skipped stitch, oil stain' },
              { type: 'Machine', color: 'bg-amber-500 hover:bg-amber-600', icon: AlertCircle, desc: 'Needle break, looper timing, motor' },
              { type: 'Material', color: 'bg-sky-500 hover:bg-sky-600', icon: FileText, desc: 'Shortage of trims, labels, threads' },
              { type: 'Floater', color: 'bg-purple-500 hover:bg-purple-600', icon: TrendingUp, desc: 'Assistance needed on buffer' }
            ].map(call => (
              <button
                key={call.type}
                onClick={() => {
                  setAndonCalls(prev => [
                    { id: `an-${Date.now()}`, line: selectedLine, station: 'Station 05', type: call.type, message: `Live floor call for ${call.type}`, time: 'Just now', status: 'pending' },
                    ...prev
                  ]);
                }}
                className={`${call.color} text-white p-4 rounded-2xl flex flex-col items-center justify-center text-center shadow-xs transition-transform active:scale-95`}
              >
                <call.icon className="w-6 h-6 mb-1.5" />
                <span className="font-bold text-sm">{call.type} Call</span>
                <span className="text-[10px] text-white/80 mt-0.5">{call.desc}</span>
              </button>
            ))}
          </div>

          {/* Active Calls Table */}
          <div className="p-5 rounded-2xl bg-white border border-[#d9d2c2] shadow-2xs space-y-3">
            <h3 className="font-bold text-sm text-[#17343a] flex items-center justify-between">
              <span>Active Sewing Floor Andon Queue</span>
              <span className="text-xs text-[#527078] font-normal">Average Response Time: 2.1 Mins</span>
            </h3>

            <div className="space-y-2">
              {andonCalls.map(c => (
                <div key={c.id} className="p-3 rounded-xl border border-[#d9d2c2] bg-[#fbfaf6] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded font-bold text-[10px] uppercase bg-rose-100 text-rose-800">
                      Line {c.line}
                    </span>
                    <div>
                      <div className="font-bold text-[#17343a]">{c.station} - {c.type}</div>
                      <div className="text-[11px] text-[#527078]">{c.message} • {c.time}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {c.status === 'pending' ? (
                      <button
                        onClick={() =>
                          setAndonCalls(prev =>
                            prev.map(x => (x.id === c.id ? { ...x, status: 'acknowledged' } : x))
                          )
                        }
                        className="px-2.5 py-1 rounded-lg bg-amber-500 text-white font-bold text-[11px]"
                      >
                        Acknowledge
                      </button>
                    ) : (
                      <button
                        onClick={() => setAndonCalls(prev => prev.filter(x => x.id !== c.id))}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px]"
                      >
                        Resolve & Clear
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. OEE / TPM TOOL */}
      {/* ========================================================================= */}
      {method.id === 'oee-tpm' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* OEE Calculator Inputs */}
            <div className="lg:col-span-6 p-5 rounded-2xl bg-white border border-[#d9d2c2] shadow-2xs space-y-4">
              <h3 className="font-bold text-sm text-[#17343a]">OEE Parameter Inputs</h3>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#527078]">Planned Shift Mins</label>
                  <input
                    type="number"
                    value={oeeInputs.plannedMins}
                    onChange={e => setOeeInputs({ ...oeeInputs, plannedMins: parseInt(e.target.value) || 480 })}
                    className="w-full mt-1 px-3 py-1.5 rounded-xl bg-[#f1eee6] border border-[#d9d2c2] font-mono-numbers"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#527078]">Downtime Mins</label>
                  <input
                    type="number"
                    value={oeeInputs.downtimeMins}
                    onChange={e => setOeeInputs({ ...oeeInputs, downtimeMins: parseInt(e.target.value) || 0 })}
                    className="w-full mt-1 px-3 py-1.5 rounded-xl bg-[#f1eee6] border border-[#d9d2c2] font-mono-numbers"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#527078]">Ideal Rate (Pcs/Hr)</label>
                  <input
                    type="number"
                    value={oeeInputs.idealRatePerHour}
                    onChange={e => setOeeInputs({ ...oeeInputs, idealRatePerHour: parseInt(e.target.value) || 120 })}
                    className="w-full mt-1 px-3 py-1.5 rounded-xl bg-[#f1eee6] border border-[#d9d2c2] font-mono-numbers"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#527078]">Total Output (Pcs)</label>
                  <input
                    type="number"
                    value={oeeInputs.totalOutputPcs}
                    onChange={e => setOeeInputs({ ...oeeInputs, totalOutputPcs: parseInt(e.target.value) || 0 })}
                    className="w-full mt-1 px-3 py-1.5 rounded-xl bg-[#f1eee6] border border-[#d9d2c2] font-mono-numbers"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-bold uppercase text-[#527078]">Defective Pieces (Rework/Scrap)</label>
                  <input
                    type="number"
                    value={oeeInputs.defectPcs}
                    onChange={e => setOeeInputs({ ...oeeInputs, defectPcs: parseInt(e.target.value) || 0 })}
                    className="w-full mt-1 px-3 py-1.5 rounded-xl bg-[#f1eee6] border border-[#d9d2c2] font-mono-numbers"
                  />
                </div>
              </div>
            </div>

            {/* OEE Gauge Breakdown */}
            <div className="lg:col-span-6 p-5 rounded-2xl bg-white border border-[#d9d2c2] shadow-2xs space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-sm text-[#17343a]">Availability × Performance × Quality</h3>
                <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                  <div className="p-3 rounded-xl bg-[#fbfaf6] border border-[#e7e1d5]">
                    <div className="text-[10px] font-bold text-[#527078]">Availability</div>
                    <div className="text-xl font-bold font-mono-numbers text-[#17343a] mt-0.5">{availabilityPct}%</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#fbfaf6] border border-[#e7e1d5]">
                    <div className="text-[10px] font-bold text-[#527078]">Performance</div>
                    <div className="text-xl font-bold font-mono-numbers text-[#17343a] mt-0.5">{performancePct}%</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#fbfaf6] border border-[#e7e1d5]">
                    <div className="text-[10px] font-bold text-[#527078]">Quality</div>
                    <div className="text-xl font-bold font-mono-numbers text-[#17343a] mt-0.5">{qualityPct}%</div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#dceceb]/50 border border-[#176f78]/30 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#176f78]">Overall Equipment Effectiveness</div>
                  <div className="text-[11px] text-[#527078]">World Class Benchmark &gt; 85%</div>
                </div>
                <div className="text-3xl font-bold font-mono-numbers text-[#176f78]">
                  {oeeTotalPct}%
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. A3 PROBLEM SOLVING TOOL */}
      {/* ========================================================================= */}
      {method.id === 'a3-problem-solving' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-[#d9d2c2] shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e7e1d5] pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase text-[#527078]">One-Page Root Cause & Countermeasures</span>
                <input
                  type="text"
                  value={a3Data.title}
                  onChange={e => setA3Data({ ...a3Data, title: e.target.value })}
                  className="font-display text-lg font-bold text-[#17343a] w-full mt-1 border-b border-dashed border-slate-300 focus:outline-hidden"
                />
              </div>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#f1eee6] border border-[#d9d2c2] text-xs font-bold text-[#17343a]"
              >
                <Printer className="w-3.5 h-3.5 text-[#176f78]" />
                <span>Print A3 Sheet</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-[#fbfaf6] border border-[#e7e1d5] space-y-1.5">
                <span className="font-bold text-[#17343a] uppercase text-[10px]">1. Background & Problem Statement</span>
                <textarea
                  rows={2}
                  value={a3Data.background}
                  onChange={e => setA3Data({ ...a3Data, background: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg bg-white border border-[#d9d2c2]"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-[#fbfaf6] border border-[#e7e1d5] space-y-1.5">
                <span className="font-bold text-[#17343a] uppercase text-[10px]">2. Target Condition / Goal</span>
                <textarea
                  rows={2}
                  value={a3Data.targetCondition}
                  onChange={e => setA3Data({ ...a3Data, targetCondition: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg bg-white border border-[#d9d2c2]"
                />
              </div>

              <div className="md:col-span-2 p-3.5 rounded-xl bg-[#fbfaf6] border border-[#e7e1d5] space-y-2">
                <span className="font-bold text-[#17343a] uppercase text-[10px]">3. 5-Whys Root Cause Analysis</span>
                {[
                  { key: 'why1', label: 'Why 1' },
                  { key: 'why2', label: 'Why 2' },
                  { key: 'why3', label: 'Why 3' },
                  { key: 'why4', label: 'Why 4' },
                  { key: 'why5', label: 'Why 5 (Root Cause)' }
                ].map(item => (
                  <div key={item.key} className="flex items-center gap-2">
                    <span className="w-20 text-[10px] font-bold text-[#176f78] shrink-0">{item.label}:</span>
                    <input
                      type="text"
                      value={(a3Data as any)[item.key]}
                      onChange={e => setA3Data({ ...a3Data, [item.key]: e.target.value })}
                      className="w-full px-2.5 py-1 text-xs rounded-lg bg-white border border-[#d9d2c2]"
                    />
                  </div>
                ))}
              </div>

              <div className="p-3.5 rounded-xl bg-[#fbfaf6] border border-[#e7e1d5] space-y-1.5">
                <span className="font-bold text-[#17343a] uppercase text-[10px]">4. Proposed Countermeasures</span>
                <textarea
                  rows={2}
                  value={a3Data.countermeasure}
                  onChange={e => setA3Data({ ...a3Data, countermeasure: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg bg-white border border-[#d9d2c2]"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-[#fbfaf6] border border-[#e7e1d5] space-y-1.5">
                <span className="font-bold text-[#17343a] uppercase text-[10px]">5. Verification & Standardization</span>
                <textarea
                  rows={2}
                  value={a3Data.verification}
                  onChange={e => setA3Data({ ...a3Data, verification: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg bg-white border border-[#d9d2c2]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. KANBAN / WIP CONTROL TOOL */}
      {/* ========================================================================= */}
      {method.id === 'kanban-wip' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white border border-[#d9d2c2] shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#e7e1d5] pb-3">
              <div>
                <h3 className="font-bold text-sm text-[#17343a]">Sewing Floor Pull System & WIP Limits</h3>
                <p className="text-[11px] text-[#527078]">Prevent bundle piles and starvation between processes</p>
              </div>
              <button
                onClick={() => alert('Replenishment pull signal dispatched to Cutting Store!')}
                className="px-3 py-1.5 rounded-xl bg-[#176f78] text-white text-xs font-bold"
              >
                Dispatch Pull Signal
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {kanbanBuffers.map(b => (
                <div key={b.stage} className="p-3.5 rounded-xl bg-[#fbfaf6] border border-[#e7e1d5] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#17343a] truncate">{b.stage}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        b.status === 'safe'
                          ? 'bg-emerald-100 text-emerald-800'
                          : b.status === 'overflow'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>

                  <div className="text-center py-2">
                    <div className="text-2xl font-bold font-mono-numbers text-[#17343a]">{b.current}</div>
                    <span className="text-[10px] text-[#527078]">Pcs in Buffer</span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-[#527078] pt-1 border-t border-[#e7e1d5]">
                    <span>Min: {b.min}</span>
                    <span>Max: {b.max}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. GEMBA WALK TOOL */}
      {/* ========================================================================= */}
      {method.id === 'gemba-walk' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Walk Observations List */}
            <div className="lg:col-span-8 p-5 rounded-2xl bg-white border border-[#d9d2c2] shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#e7e1d5] pb-3">
                <div>
                  <h3 className="font-bold text-sm text-[#17343a]">Daily Floor Gemba Observations</h3>
                  <p className="text-[11px] text-[#527078]">What the IE observed directly at the point of work</p>
                </div>
                <span className="text-xs font-mono-numbers text-[#527078]">{gembaNotes.length} Findings Recorded</span>
              </div>

              <div className="space-y-2.5">
                {gembaNotes.map(n => (
                  <div key={n.id} className="p-3 rounded-xl bg-[#fbfaf6] border border-[#e7e1d5] text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#17343a] flex items-center gap-2">
                        <span className="text-[#176f78]">{n.time}</span>
                        <span>•</span>
                        <span>Line {n.line} ({n.station})</span>
                      </span>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#dceceb] text-[#176f78]">
                        {n.waste}
                      </span>
                    </div>
                    <p className="text-[#17343a]">{n.finding}</p>
                    <div className="text-[11px] text-emerald-700 font-medium">Immediate Action: {n.action}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Gemba Logger */}
            <div className="lg:col-span-4 p-5 rounded-2xl bg-white border border-[#d9d2c2] shadow-2xs space-y-3">
              <h3 className="font-bold text-sm text-[#17343a]">Record Walk Finding</h3>

              <div className="space-y-2 text-xs">
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#527078]">Line & Station</label>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="text"
                      value={newGembaLine}
                      onChange={e => setNewGembaLine(e.target.value)}
                      className="w-16 px-2.5 py-1.5 rounded-xl bg-[#f1eee6] border border-[#d9d2c2]"
                      placeholder="Line"
                    />
                    <input
                      type="text"
                      value={newGembaStation}
                      onChange={e => setNewGembaStation(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 rounded-xl bg-[#f1eee6] border border-[#d9d2c2]"
                      placeholder="Station"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-[#527078]">Observed Waste</label>
                  <select
                    value={newGembaWaste}
                    onChange={e => setNewGembaWaste(e.target.value)}
                    className="w-full mt-1 px-2.5 py-1.5 rounded-xl bg-[#f1eee6] border border-[#d9d2c2]"
                  >
                    <option value="Motion">Excess Operator Motion</option>
                    <option value="Waiting">Waiting for Cut Parts</option>
                    <option value="Defects">Defective Stitching</option>
                    <option value="Inventory">Bundle Overflow</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-[#527078]">Finding Description</label>
                  <textarea
                    rows={2}
                    placeholder="What did you see with your own eyes?"
                    value={newGembaFinding}
                    onChange={e => setNewGembaFinding(e.target.value)}
                    className="w-full mt-1 px-2.5 py-1.5 rounded-xl bg-[#f1eee6] border border-[#d9d2c2]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-[#527078]">Immediate Floor Action</label>
                  <input
                    type="text"
                    placeholder="Action taken on the spot..."
                    value={newGembaAction}
                    onChange={e => setNewGembaAction(e.target.value)}
                    className="w-full mt-1 px-2.5 py-1.5 rounded-xl bg-[#f1eee6] border border-[#d9d2c2]"
                  />
                </div>

                <button
                  onClick={() => {
                    if (!newGembaFinding) return;
                    setGembaNotes(prev => [
                      {
                        id: `g-${Date.now()}`,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        line: newGembaLine,
                        station: newGembaStation,
                        finding: newGembaFinding,
                        waste: newGembaWaste,
                        action: newGembaAction || 'Follow-up with line supervisor'
                      },
                      ...prev
                    ]);
                    setNewGembaFinding('');
                    setNewGembaAction('');
                  }}
                  className="w-full py-2 rounded-xl bg-[#176f78] text-white text-xs font-bold hover:bg-[#12555c] transition-colors"
                >
                  Save Walk Finding
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 11. STANDARD WORK TOOL */}
      {/* ========================================================================= */}
      {method.id === 'standard-work' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white border border-[#d9d2c2] shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#e7e1d5] pb-3">
              <div>
                <h3 className="font-bold text-sm text-[#17343a]">Standard Work Combination Sheet (SWCS)</h3>
                <p className="text-[11px] text-[#527078]">Breakdown of manual handling, machine cycle time, and walking vs takt</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase text-[#527078]">Total Operation Cycle</span>
                <div className="text-2xl font-bold font-mono-numbers text-[#176f78]">{totalCycleSec}s</div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#f1eee6] text-[#527078] uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5 rounded-l-xl">Sequence Element</th>
                    <th className="p-2.5 text-right">Manual (s)</th>
                    <th className="p-2.5 text-right">Machine (s)</th>
                    <th className="p-2.5 text-right rounded-r-xl">Walk (s)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e7e1d5]">
                  {standardWorkSteps.map(step => (
                    <tr key={step.id}>
                      <td className="p-2.5 font-medium text-[#17343a]">{step.step}</td>
                      <td className="p-2.5 text-right font-mono-numbers text-[#176f78]">{step.manualSec}s</td>
                      <td className="p-2.5 text-right font-mono-numbers text-amber-700">{step.machineSec}s</td>
                      <td className="p-2.5 text-right font-mono-numbers text-slate-500">{step.walkSec}s</td>
                    </tr>
                  ))}
                  <tr className="font-bold bg-[#fbfaf6]">
                    <td className="p-2.5 text-[#17343a]">Total Sub-Elements</td>
                    <td className="p-2.5 text-right text-[#176f78]">{Math.round(totalManualSec * 10) / 10}s</td>
                    <td className="p-2.5 text-right text-amber-700">{Math.round(totalMachineSec * 10) / 10}s</td>
                    <td className="p-2.5 text-right text-slate-500">{Math.round(totalWalkSec * 10) / 10}s</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 12. POKA-YOKE TOOL */}
      {/* ========================================================================= */}
      {method.id === 'poka-yoke' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white border border-[#d9d2c2] shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#e7e1d5] pb-3">
              <div>
                <h3 className="font-bold text-sm text-[#17343a]">Station Error-Proofing (Poka-Yoke) Registry</h3>
                <p className="text-[11px] text-[#527078]">Jigs, optical sensors, and physical guides installed on the floor</p>
              </div>
              <button
                onClick={() => {
                  const name = prompt('Fixture name:');
                  if (name) {
                    setPokaYokeFixtures(prev => [
                      { id: `py-${Date.now()}`, line: selectedLine, station: 'Station 05', name, defectPrevented: 'Defective fold', status: 'active', inspectedDate: 'Today' },
                      ...prev
                    ]);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#176f78] text-white text-xs font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Register New Fixture</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {pokaYokeFixtures.map(f => (
                <div key={f.id} className="p-4 rounded-xl bg-[#fbfaf6] border border-[#e7e1d5] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#17343a] flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#176f78]" />
                      <span>{f.name}</span>
                    </span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        f.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {f.status}
                    </span>
                  </div>

                  <div className="text-xs text-[#527078]">
                    <strong>Target Station:</strong> Line {f.line} - {f.station}
                  </div>
                  <div className="text-xs text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200">
                    <strong>Defect Prevented:</strong> {f.defectPrevented}
                  </div>
                  <div className="text-[10px] text-[#527078] text-right">
                    Last Inspection: {f.inspectedDate}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

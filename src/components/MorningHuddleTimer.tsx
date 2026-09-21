/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  Plus,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Sparkles,
  Save,
  Users,
  ChevronRight,
  HelpCircle,
  Volume2,
  VolumeX,
  X,
  Target,
  Flame,
  ArrowRight
} from 'lucide-react';
import { LineEntry } from '../types';

interface MorningHuddleTimerProps {
  isOpen: boolean;
  onClose: () => void;
  lines: LineEntry[];
  selectedLineNo?: string;
  onSelectLineNo?: (lineNo: string) => void;
  onSaveLineRemarks: (lineId: number, remarks: string, top5Notes?: string) => void;
  onChecklistCompleted?: () => void;
}

// Standard 10-Minute Top 5 Agenda Phases
const HUDDLE_PHASES = [
  {
    phase: 1,
    title: 'Previous Day Losses & Efficiency Review',
    timeRange: 'Min 0:00 - 3:00',
    minSecond: 0,
    maxSecond: 180,
    objective: 'Analyze yesterday’s downtime, line balance gaps, and target shortfalls.',
    prompts: [
      'Did we hit yesterday’s efficiency target? If not, what was the primary bottleneck station?',
      'Review any operator absenteeism and re-balance plan for this shift.',
      'Check cutting bundle feeding schedule.'
    ]
  },
  {
    phase: 2,
    title: 'Today’s Takt Pace & Bottleneck Mitigation',
    timeRange: 'Min 3:00 - 6:00',
    minSecond: 180,
    maxSecond: 360,
    objective: 'Confirm hourly piece targets and station cycle time balance.',
    prompts: [
      'Confirm hourly target pace (e.g. 140 pcs/hr) with batch supervisors.',
      'Review station cycle times against target takt pitch time.',
      'Designate floater/relief operator for the known bottleneck operation.'
    ]
  },
  {
    phase: 3,
    title: 'Quality Critical Points & In-Line Buffer',
    timeRange: 'Min 6:00 - 8:00',
    minSecond: 360,
    maxSecond: 480,
    objective: 'Prevent defect propagation and maintain optimal style WIP buffer.',
    prompts: [
      'Inspect previous 10 garments from end-line inspection table.',
      'Verify machine needle condition, thread tension, and seam allowance gauge.',
      'Ensure in-line WIP buffer does not exceed calculated style threshold.'
    ]
  },
  {
    phase: 4,
    title: 'Takeaways, Commitment & Floor Sign-off',
    timeRange: 'Min 8:00 - 10:00',
    minSecond: 480,
    maxSecond: 600,
    objective: 'Record key action items in Line Remarks and commit supervisors.',
    prompts: [
      'Summarize key operational priorities for the first 4 hours.',
      'Record specific action takeaways in the line Remarks field.',
      'Obtain verbal commitment from Line IE, Floor Supervisor, and Quality Chief.'
    ]
  }
];

// Quick suggestion chips for common garment IE takeaways
const TAKEAWAY_PRESETS = [
  'Confirmed hourly target of 145 pcs/hr; aligned supervisor on hour 1-4 pacing.',
  'Bottleneck station: assigned experienced floater to support zipper attachment.',
  'Calibrated machine feed dog and folder guide to resolve puckering defect.',
  'Restricted bundle input release to keep in-line WIP within 320 pcs threshold.',
  'Operator cross-training scheduled at station 12 during mid-shift relief.',
  'End-line DHU audit target set at < 1.5%; double-checking critical collar topstitch.'
];

export const MorningHuddleTimer: React.FC<MorningHuddleTimerProps> = ({
  isOpen,
  onClose,
  lines,
  selectedLineNo,
  onSelectLineNo,
  onSaveLineRemarks,
  onChecklistCompleted
}) => {
  const TOTAL_DURATION_SEC = 600; // 10 minutes

  // Active line selection
  const [activeLineNo, setActiveLineNo] = useState<string>(selectedLineNo || lines[0]?.lineNo || '18');
  useEffect(() => {
    if (selectedLineNo) {
      setActiveLineNo(selectedLineNo);
    }
  }, [selectedLineNo]);

  const currentLine = useMemo(() => {
    return lines.find(l => l.lineNo === activeLineNo) || lines[0];
  }, [lines, activeLineNo]);

  // Timer state
  const [secondsRemaining, setSecondsRemaining] = useState<number>(TOTAL_DURATION_SEC);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [hasFinished, setHasFinished] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Remarks state
  const [remarksText, setRemarksText] = useState<string>('');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Synchronize remarks when line changes
  useEffect(() => {
    if (currentLine) {
      setRemarksText(currentLine.remarks || '');
    }
  }, [currentLine?.id]);

  // Timer Interval
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning && secondsRemaining > 0) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            setHasFinished(true);
            playCompletionSound();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, secondsRemaining]);

  // Gentle Web Audio Chime
  const playCompletionSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } catch {
      // Audio context might be restricted before interaction
    }
  };

  // Format MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainderSecs = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remainderSecs).padStart(2, '0')}`;
  };

  // Elapsed seconds and percentage
  const elapsedSec = TOTAL_DURATION_SEC - secondsRemaining;
  const progressPct = Math.min(100, Math.round((elapsedSec / TOTAL_DURATION_SEC) * 100));

  // Current Phase
  const currentPhase = useMemo(() => {
    return (
      HUDDLE_PHASES.find(p => elapsedSec >= p.minSecond && elapsedSec < p.maxSecond) ||
      HUDDLE_PHASES[HUDDLE_PHASES.length - 1]
    );
  }, [elapsedSec]);

  // Handlers
  const handleToggleTimer = () => {
    if (hasFinished) {
      setSecondsRemaining(TOTAL_DURATION_SEC);
      setHasFinished(false);
      setIsRunning(true);
    } else {
      setIsRunning(!isRunning);
    }
  };

  const handleResetTimer = () => {
    setIsRunning(false);
    setSecondsRemaining(TOTAL_DURATION_SEC);
    setHasFinished(false);
  };

  const handleAddMinute = () => {
    setSecondsRemaining(prev => Math.min(TOTAL_DURATION_SEC * 2, prev + 60));
    setHasFinished(false);
  };

  const handleApplyPreset = (preset: string) => {
    setRemarksText(prev => {
      const trimmed = prev.trim();
      if (!trimmed) return preset;
      if (trimmed.includes(preset)) return trimmed;
      return `${trimmed} | ${preset}`;
    });
  };

  const handleSaveTakeaways = () => {
    if (!currentLine) return;
    const finalRemarks = remarksText.trim() || 'Top 5 Huddle completed. Standard operational targets agreed.';
    onSaveLineRemarks(currentLine.id, finalRemarks, `Top 5 Huddle takeaway: ${finalRemarks}`);

    if (onChecklistCompleted) {
      onChecklistCompleted();
    }

    setSaveSuccessMessage(`Successfully updated Remarks on Line ${currentLine.lineNo} (${currentLine.style})!`);
    setTimeout(() => {
      setSaveSuccessMessage(null);
    }, 4000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div
        id="morning-huddle-modal"
        className="w-full max-w-3xl rounded-3xl bg-[#fbfaf6] border border-[#d9d2c2] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Top Bar */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#17343a] via-[#1b434b] to-[#12555c] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400 text-[#17343a]">
                  IE Protocol Item #1
                </span>
                <span className="text-xs text-sky-200">10-Minute Standard Duration</span>
              </div>
              <h2 className="font-display text-lg sm:text-xl font-bold uppercase tracking-tight text-white">
                Morning Huddle (Top 5 Meeting) Timer
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute Chime' : 'Unmute Chime'}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-white/60" />}
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Active Line & Style Selector Banner */}
          <div className="rounded-2xl border border-[#d9d2c2] bg-white p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#dceceb] text-[#176f78] flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#527078] block">
                  Active Huddle Line
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-display text-base font-bold text-[#17343a]">
                    Line {currentLine?.lineNo || '18'} — {currentLine?.style}
                  </span>
                  <span className="text-xs text-[#527078] font-medium">({currentLine?.buyer})</span>
                </div>
              </div>
            </div>

            {/* Line Dropdown */}
            <div className="flex items-center gap-2">
              <label htmlFor="huddle-line-select" className="text-xs font-bold text-[#527078]">
                Switch Line:
              </label>
              <select
                id="huddle-line-select"
                value={activeLineNo}
                onChange={e => {
                  setActiveLineNo(e.target.value);
                  if (onSelectLineNo) onSelectLineNo(e.target.value);
                }}
                className="bg-[#f1eee6] border border-[#d9d2c2] text-[#17343a] text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-hidden cursor-pointer"
              >
                {lines.map(line => (
                  <option key={line.id} value={line.lineNo}>
                    Line {line.lineNo} ({line.style.substring(0, 18)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ========================================================
              TIMER DISPLAY & CONTROLS SECTION
          ======================================================== */}
          <div className="rounded-3xl bg-gradient-to-b from-[#17343a] to-[#0d2226] text-white p-6 sm:p-7 shadow-lg relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-teal-400/10 blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              {/* Left: Clock Display & Status */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${isRunning ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-200">
                    {hasFinished
                      ? '10-Minute Top 5 Completed'
                      : isRunning
                      ? 'Huddle In Progress'
                      : 'Huddle Timer Ready'}
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span
                    id="huddle-digital-clock"
                    className="font-mono-numbers text-5xl sm:text-6xl md:text-7xl font-black tracking-tight text-white leading-none"
                  >
                    {formatTime(secondsRemaining)}
                  </span>
                  <span className="text-xs text-sky-200/80 font-mono-numbers">
                    / 10:00 min
                  </span>
                </div>

                <p className="text-xs text-sky-100/70 font-medium">
                  {secondsRemaining <= 120 && secondsRemaining > 0 ? (
                    <span className="text-amber-300 font-bold animate-pulse">
                      Wrapping up: Final 2 minutes! Record takeaways in the Remarks box below.
                    </span>
                  ) : hasFinished ? (
                    <span className="text-emerald-300 font-bold">
                      Meeting target time reached! Please ensure takeaways are saved into Line Remarks.
                    </span>
                  ) : (
                    'Standard stand-up meeting with Supervisor, Quality Batch Chief, and Line IE.'
                  )}
                </p>
              </div>

              {/* Right: Controls */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  id="btn-toggle-huddle-timer"
                  type="button"
                  onClick={handleToggleTimer}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm shadow-md transition-all cursor-pointer ${
                    isRunning
                      ? 'bg-amber-400 text-[#17343a] hover:bg-amber-300'
                      : 'bg-emerald-500 text-white hover:bg-emerald-400'
                  }`}
                >
                  {isRunning ? (
                    <>
                      <Pause className="w-4 h-4 fill-current" />
                      <span>Pause Huddle</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>{hasFinished ? 'Restart Huddle' : 'Start 10-Min Timer'}</span>
                    </>
                  )}
                </button>

                <button
                  id="btn-reset-huddle-timer"
                  type="button"
                  onClick={handleResetTimer}
                  className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  title="Reset to 10:00"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  id="btn-add-min-huddle-timer"
                  type="button"
                  onClick={handleAddMinute}
                  className="flex items-center gap-1 px-3 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer"
                  title="Add 1 Extra Minute"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+1 Min</span>
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-5 space-y-1.5">
              <div className="flex justify-between text-[11px] text-sky-200/80 font-mono-numbers">
                <span>Phase {currentPhase.phase} of 4: {currentPhase.title}</span>
                <span>{progressPct}% Elapsed</span>
              </div>
              <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-400 to-amber-300 rounded-full transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* ========================================================
              ACTIVE PHASE GUIDANCE & AGENDA PROMPTS
          ======================================================== */}
          <div className="rounded-2xl border border-[#d9d2c2] bg-white p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#e7e1d5] pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#176f78] text-white text-xs font-bold flex items-center justify-center">
                  {currentPhase.phase}
                </span>
                <h4 className="font-display text-sm font-bold uppercase text-[#17343a]">
                  Current Discussion: {currentPhase.title}
                </h4>
              </div>
              <span className="text-[11px] font-mono-numbers text-[#527078] font-bold">
                {currentPhase.timeRange}
              </span>
            </div>

            <p className="text-xs text-[#527078] font-medium">
              {currentPhase.objective}
            </p>

            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#738287] block">
                Recommended Line IE Guiding Prompts:
              </span>
              <ul className="space-y-1 text-xs text-[#17343a]">
                {currentPhase.prompts.map((prompt, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#176f78] font-bold">•</span>
                    <span>{prompt}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ========================================================
              TAKEAWAYS & REMARKS RECORDING SECTION (KEY FEATURE)
          ======================================================== */}
          <div id="huddle-takeaways-box" className="rounded-2xl border-2 border-[#176f78]/30 bg-[#fbfaf6] p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#176f78]" />
                <div>
                  <h3 className="font-display text-base font-bold uppercase text-[#17343a]">
                    Record Huddle Takeaways in Line {currentLine?.lineNo} Remarks
                  </h3>
                  <p className="text-xs text-[#527078]">
                    This updates the 'Remarks' field of the active line in real-time.
                  </p>
                </div>
              </div>

              {saveSuccessMessage && (
                <span className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 animate-fadeIn">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{saveSuccessMessage}</span>
                </span>
              )}
            </div>

            {/* Quick Suggestion Presets */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#527078] block mb-1.5">
                Quick Takeaway Templates (Click to Insert):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {TAKEAWAY_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="text-left text-[11px] px-2.5 py-1 rounded-lg bg-white border border-[#d9d2c2] hover:border-[#176f78] hover:bg-[#dceceb]/40 text-[#17343a] transition-all cursor-pointer font-medium"
                  >
                    + {preset.substring(0, 48)}...
                  </button>
                ))}
              </div>
            </div>

            {/* Live Textarea */}
            <div>
              <label htmlFor="huddle-remarks-input" className="sr-only">
                Huddle Remarks Input
              </label>
              <textarea
                id="huddle-remarks-input"
                rows={3}
                value={remarksText}
                onChange={e => setRemarksText(e.target.value)}
                placeholder="Enter agreed shift targets, bottleneck mitigations, floater operator assignments, or quality directives for this line..."
                className="w-full p-3 text-xs bg-white rounded-xl border border-[#d9d2c2] focus:border-[#176f78] focus:ring-1 focus:ring-[#176f78] focus:outline-hidden text-[#17343a] placeholder-[#738287]"
              />
            </div>

            {/* Save Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
              <span className="text-[11px] text-[#527078]">
                Current Line: <strong>Line {currentLine?.lineNo} ({currentLine?.style})</strong> • Target: <strong>{currentLine?.targetProd} pcs</strong>
              </span>

              <button
                id="btn-save-huddle-remarks"
                type="button"
                onClick={handleSaveTakeaways}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#176f78] hover:bg-[#12555c] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Takeaways to Line Remarks</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-[#f1eee6] border-t border-[#d9d2c2] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[#527078]">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Standard Industrial Engineering Top 5 SOP Compliant</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white border border-[#d9d2c2] text-[#17343a] hover:bg-[#e7e1d5] text-xs font-bold transition-colors cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  XCircle,
  Calendar,
  CheckCheck,
  RotateCcw,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ClipboardList
} from 'lucide-react';
import { ChecklistMap, ChecklistStatus, UserProfile } from '../types';
import { CHECKLIST_TASK_COUNT, IE_DAILY_TASKS, normalizeChecklistStatuses } from '../mockData';
import { formatDateLabel, getOffsetDateStr, isFridayHoliday } from '../utils';

interface DailyChecklistProps {
  checklists: ChecklistMap;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onUpdateTaskStatus: (date: string, taskIndex: number, status: ChecklistStatus) => void;
  onBatchUpdateChecklist: (date: string, statuses: ChecklistStatus[]) => void;
  profile: UserProfile;
  onNavigate?: (tab: string) => void;
}

export const DailyChecklist: React.FC<DailyChecklistProps> = ({
  checklists,
  selectedDate,
  onSelectDate,
  onUpdateTaskStatus,
  onBatchUpdateChecklist,
  profile,
  onNavigate
}) => {
  const [taskNotes, setTaskNotes] = useState<Record<number, string>>({
    0: 'Ramp-up milestones and operator loading plan aligned with supervisor.',
    1: '1st vs 2nd day balance graph logged; cycle variance minimized.',
    2: '70% production target achieved on Line 20.',
    3: '4th day graph completed; bottleneck station cycle balanced.',
    4: 'Day 6-7 estimate prepared with manpower and efficiency evidence.',
    5: 'Collar attach station analyzed; countermeasure applied.',
    6: 'Tech pack and trims confirmed 10 days ahead.',
    7: 'T.R sample passed initial audit; 2 open actions tracked.',
    8: 'Shift A floor status logged across all active lines.',
    9: 'Critical station operators tracked; helper assigned to Line 19.',
    10: 'Pneumatic thread wiper jig installed; saved 3.2s per piece.',
    11: 'Shift running efficiency logged at 87.4% against 85% target.',
    12: 'Tomorrow line target forecast calculated based on line balance.'
  });

  const currentStatuses: ChecklistStatus[] = normalizeChecklistStatuses(checklists[selectedDate]);
  const isFriday = isFridayHoliday(selectedDate);

  const completedCount = currentStatuses.filter(s => s === 'yes').length;
  const pendingCount = currentStatuses.filter(s => s === 'pending').length;
  const noCount = currentStatuses.filter(s => s === 'no').length;
  const completionPercentage = Math.round((completedCount / CHECKLIST_TASK_COUNT) * 100);

  const handleNoteChange = (idx: number, text: string) => {
    setTaskNotes(prev => ({ ...prev, [idx]: text }));
  };

  const handlePrevDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() - 1);
    const yStr = date.getFullYear();
    const mStr = String(date.getMonth() + 1).padStart(2, '0');
    const dStr = String(date.getDate()).padStart(2, '0');
    onSelectDate(`${yStr}-${mStr}-${dStr}`);
  };

  const handleNextDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + 1);
    const yStr = date.getFullYear();
    const mStr = String(date.getMonth() + 1).padStart(2, '0');
    const dStr = String(date.getDate()).padStart(2, '0');
    onSelectDate(`${yStr}-${mStr}-${dStr}`);
  };

  const markAllYes = () => {
    onBatchUpdateChecklist(selectedDate, Array(CHECKLIST_TASK_COUNT).fill('yes'));
  };

  const resetAll = () => {
    onBatchUpdateChecklist(selectedDate, Array(CHECKLIST_TASK_COUNT).fill('pending'));
  };

  return (
    <div className="space-y-6">
      {/* Header & Date Navigation */}
      <div className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] p-5 sm:p-6 shadow-xs surface-card checklist-intro">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#dceceb] text-[#176f78] section-kicker">
                IE Daily Activity Inspection Protocol
              </span>
              <span className="text-xs text-[#527078]">{CHECKLIST_TASK_COUNT}-Task Verification Protocol</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase text-[#17343a] tracking-tight page-title">
              IE Daily Activity Tracking
            </h1>
            <p className="text-xs sm:text-sm text-[#527078] mt-1">
              Audit learning curve plans, line balancing graphs, bottleneck flow, style input dates, T.R samples, operator tracking, and shift targets.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Date Picker Bar */}
            <div className="flex items-center gap-2 bg-[#f1eee6] p-1.5 rounded-2xl border border-[#d9d2c2]">
              <button
                onClick={handlePrevDay}
                title="Previous Day"
                className="p-1.5 rounded-xl hover:bg-[#e7e1d5] text-[#17343a] transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 px-3">
                <Calendar className="w-4 h-4 text-[#176f78]" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => e.target.value && onSelectDate(e.target.value)}
                  className="bg-transparent text-xs font-bold font-mono-numbers text-[#17343a] focus:outline-hidden cursor-pointer"
                />
              </div>
              <button
                onClick={handleNextDay}
                title="Next Day"
                className="p-1.5 rounded-xl hover:bg-[#e7e1d5] text-[#17343a] transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {isFriday && (
              <span className="px-3 py-2 rounded-2xl bg-amber-100 text-amber-900 border border-amber-300 text-xs font-extrabold flex items-center gap-1.5 shadow-2xs">
                <span>🌴</span>
                <span>Friday Holiday</span>
              </span>
            )}

            {onNavigate && (
              <button
                onClick={() => onNavigate('monthly')}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border border-[#d9d2c2] bg-white hover:bg-[#f1eee6] text-[#17343a] text-xs font-bold transition-all shadow-2xs"
                title="View Monthly Activity & Audit Log with Calendar UI"
              >
                <Calendar className="w-3.5 h-3.5 text-[#176f78]" />
                <span>Monthly Audit Calendar</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress & Quick Actions */}
        <div className="mt-6 pt-5 border-t border-[#e7e1d5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-bold text-[#17343a] flex items-center gap-1.5">
                <span>Checklist Compliance:</span>
                <span className="text-[#176f78] font-mono-numbers font-black">{completionPercentage}%</span>
              </span>
              <span className="text-[#527078] font-mono-numbers text-[11px]">
                 {completedCount}/{CHECKLIST_TASK_COUNT} Tasks Done
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-[#f1eee6] overflow-hidden flex">
              <div
                className="h-full bg-[#176f78] transition-all duration-300"
                 style={{ width: `${(completedCount / CHECKLIST_TASK_COUNT) * 100}%` }}
              ></div>
              <div
                className="h-full bg-amber-400 transition-all duration-300"
                 style={{ width: `${(pendingCount / CHECKLIST_TASK_COUNT) * 100}%` }}
              ></div>
              <div
                className="h-full bg-rose-400 transition-all duration-300"
                 style={{ width: `${(noCount / CHECKLIST_TASK_COUNT) * 100}%` }}
              ></div>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono-numbers mt-1 text-[#527078]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#176f78]"></span> {completedCount} Done
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span> {pendingCount} Pending
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-400"></span> {noCount} Not Met
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={markAllYes}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#dceceb] text-[#176f78] hover:bg-[#c9e4e2] text-xs font-bold transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark All Done</span>
            </button>
            <button
              onClick={resetAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#f1eee6] border border-[#d9d2c2] text-slate-600 hover:bg-[#e7e1d5] text-xs font-bold transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

       {/* Friday Weekly Holiday Protocol Banner */}
      {isFriday && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/95 p-4 sm:p-5 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-200/90 text-amber-900 flex items-center justify-center shrink-0 text-xl font-black shadow-2xs">
              🌴
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-wide text-amber-950 flex items-center gap-2 flex-wrap">
                <span>Official Factory Weekly Holiday (Friday)</span>
                <span className="px-2 py-0.5 rounded bg-amber-600 text-white text-[9px] font-extrabold uppercase">
                  Plant Offline
                </span>
              </div>
              <p className="text-xs text-amber-900/85 mt-0.5 max-w-2xl">
                Friday is the designated weekly rest day for DGU2. Standard line production is halted. Verification checklist is optional for special overtime operations, mechanical line overhauls, or pilot trial runs.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-xl bg-amber-200/80 text-amber-950 shrink-0 self-start sm:self-center border border-amber-300/80">
            Weekly Rest Day
          </span>
        </div>
      )}

      {/* Full IE + SL task cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {IE_DAILY_TASKS.map((task, idx) => {
          const status = currentStatuses[idx] || 'pending';

          return (
             <div
              key={task.id}
               className={`rounded-2xl border p-4 transition-all duration-200 checklist-task ${
                status === 'yes'
                  ? 'border-emerald-200 bg-[#fbfaf6] shadow-2xs'
                  : status === 'pending'
                  ? 'border-amber-200 bg-[#fbfaf6]'
                  : 'border-rose-200 bg-[#fbfaf6]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-[#f1eee6] border border-[#d9d2c2] text-[#176f78] font-bold font-mono-numbers text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {String(task.id).padStart(2, '0')}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                        task.category === 'SL Control'
                          ? 'bg-[#fff2cf] text-[#946200]'
                          : 'bg-[#f1eee6] text-[#527078]'
                      }`}>
                        {task.category}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-[#17343a] mt-0.5 leading-snug">
                      {task.title}
                    </h3>
                    <p className="text-xs text-[#527078] mt-1 leading-relaxed">
                      {task.hint}
                    </p>
                  </div>
                </div>

                {/* Status Toggle Buttons */}
                <div className="flex items-center gap-1 shrink-0 bg-[#f1eee6] p-1 rounded-xl border border-[#d9d2c2]">
                  <button
                    onClick={() => onUpdateTaskStatus(selectedDate, idx, 'yes')}
                    title="Mark Done"
                    className={`p-1.5 rounded-lg transition-all ${
                      status === 'yes'
                        ? 'bg-emerald-600 text-white shadow-xs font-bold'
                        : 'text-slate-400 hover:text-emerald-700'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onUpdateTaskStatus(selectedDate, idx, 'pending')}
                    title="Mark Pending"
                    className={`p-1.5 rounded-lg transition-all ${
                      status === 'pending'
                        ? 'bg-amber-500 text-white shadow-xs font-bold'
                        : 'text-slate-400 hover:text-amber-700'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onUpdateTaskStatus(selectedDate, idx, 'no')}
                    title="Mark Not Met / Action Needed"
                    className={`p-1.5 rounded-lg transition-all ${
                      status === 'no'
                        ? 'bg-rose-500 text-white shadow-xs font-bold'
                        : 'text-slate-400 hover:text-rose-700'
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Observation / Note Input */}
              <div className="mt-3 pt-3 border-t border-[#e7e1d5]/80">
                <input
                  type="text"
                  placeholder="Record floor notes or specific line observations..."
                  value={taskNotes[idx] || ''}
                  onChange={e => handleNoteChange(idx, e.target.value)}
                  className="w-full text-xs px-3 py-1.5 rounded-xl bg-[#f1eee6]/60 border border-[#e7e1d5] text-[#17343a] placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-[#176f78]"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Audit & Management Sign-Off Stamp */}
      <div className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#dceceb] text-[#176f78] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm text-[#17343a]">
                IE Daily Activity Floor Audit Verification
              </h4>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Audited & Approved
              </span>
            </div>
            <p className="text-xs text-[#527078] mt-0.5">
              Verified by {profile.name} ({profile.jobTitle}) for Shift A inspection cycle.
            </p>
          </div>
        </div>

        <div className="text-right text-xs font-mono-numbers text-[#527078] border-t sm:border-t-0 pt-3 sm:pt-0 border-[#e7e1d5]">
          <div>Shift Verification ID: #SL-CHK-{selectedDate.replace(/-/g, '')}</div>
          <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
            Compliance Score: {completionPercentage}%
          </div>
        </div>
      </div>
    </div>
  );
};

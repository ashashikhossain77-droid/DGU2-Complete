/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LineEntry, ChecklistMap, ChecklistStatus, ScorecardResult, DayWiseSummary, DayOverDayVariance } from './types';
import { generateLineLearningCurve, calculateBalancingLossAnalysis } from './data/learningCurveMatrix';
import { CHECKLIST_TASK_COUNT, normalizeChecklistStatuses } from './mockData';

// Format helper
export function getTodayDateStr(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getOffsetDateStr(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isFridayHoliday(dateStr: string): boolean {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.getDay() === 5; // 5 = Friday (official weekly factory holiday)
  } catch {
    return false;
  }
}

export function isWorkingDay(dateStr: string): boolean {
  return !isFridayHoliday(dateStr);
}

export function formatDateLabel(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

// Generate realistic default line entries
export function generateDefaultLineEntries(): LineEntry[] {
  const today = getTodayDateStr();
  const yesterday = getOffsetDateStr(-1);
  const dayBefore = getOffsetDateStr(-2);

  return [
    {
      id: 1,
      date: today,
      lineNo: '18',
      floor: 'Padma Floor',
      buyer: 'H&M',
      style: 'TS-2401 Crewneck',
      smv: 0.85,
      plannedMP: 40,
      workingHours: 8,
      targetEff: 85,
      targetProd: 1200,
      achievedProd: 1080,
      efficiency: 90,
      remarks: 'Smooth run, neckline attachment improved after method change',
      orderQty: 15000,
      dailyInput: 1150,
      dailyOutput: 1080,
      wip: 320,
      balancingGraph: 'day4',
      nextStyle: 'TS-2501 Winter Thermal',
      nextStyleDate: getOffsetDateStr(5),
      mp: {
        Operator: { present: 28, absent: 2 },
        Helper: { present: 8, absent: 1 },
        'Iron Man': { present: 3, absent: 0 }
      },
      balanceMethod: 'Overtime',
      balanceNotes: '2 operators worked 1 hr OT to absorb backlog',
      top5: {
        held: 'yes',
        attendance: 95,
        items: [
          'Rib attach thread tension check completed',
          'Needle break rate reduced to <0.5%',
          'Hourly output target 145 pcs aligned',
          'Helper bundle handling optimized',
          'End-line inspector feedback recorded'
        ],
        notes: 'Line supervisor confirmed all 5 actions acknowledged by batch chiefs'
      },
      bottleneck: {
        station: 'Cuff & Hem stitch',
        cycleTime: 48.5,
        targetCT: 45.0,
        status: 'ok',
        action: 'Guide attachment added to folder',
        notes: 'Within 7% of target cycle time'
      },
      timeStudy: {
        done: 'yes',
        type: 'time',
        observedRate: 142,
        standardRate: 150,
        findings: 'Operator motion efficiency 94.6%'
      },
      buildUp: {
        day: '4',
        plannedPct: 90,
        achievedPct: 90,
        operators: 39,
        notes: 'Learning curve peak achieved ahead of schedule'
      },
      lineIE: {
        name: 'Mahmudul Hoque',
        level: 'sr_executive',
        period: 'daily',
        weeklyNotes: 'On track to meet weekly shipping milestone',
        monthlyNotes: 'Consistent line efficiency >88%',
        additionalInfo: 'Line ready for upcoming audit inspection'
      },
      learningCurve: generateLineLearningCurve(0.85, 39, 8, 'repeat', 4, true),
      balancingAnalysis: calculateBalancingLossAnalysis(4590, 39, 48.5, 135, 150)
    },
    {
      id: 2,
      date: today,
      lineNo: '19',
      floor: 'Padma Floor',
      buyer: 'Zara',
      style: 'JK-1180 Windbreaker',
      smv: 1.25,
      plannedMP: 45,
      workingHours: 8,
      targetEff: 80,
      targetProd: 900,
      achievedProd: 720,
      efficiency: 80,
      remarks: 'Zipper insertion bottleneck addressed with temporary helper',
      orderQty: 8500,
      dailyInput: 750,
      dailyOutput: 720,
      wip: 410,
      balancingGraph: 'day2',
      nextStyle: 'JK-1200 Bomber',
      nextStyleDate: getOffsetDateStr(2),
      mp: {
        Operator: { present: 24, absent: 4 },
        Helper: { present: 6, absent: 2 },
        'Iron Man': { present: 2, absent: 1 }
      },
      balanceMethod: 'Borrowed from other line',
      balanceNotes: '2 operators borrowed from training pool',
      top5: {
        held: 'yes',
        attendance: 90,
        items: [
          'Zipper slider test done with QC',
          'Interlining fusing heat calibrated at 140°C',
          'Pocket welt placement template deployed',
          'Helper sorting tags validated',
          'WIP buffer maintained at 30 pcs'
        ],
        notes: 'Supervisor instructed on continuous piece flow'
      },
      bottleneck: {
        station: 'Front zipper attach',
        cycleTime: 62.0,
        targetCT: 52.0,
        status: 'high',
        action: 'Assigned senior multi-skilled operator',
        notes: 'Cycle time dropped from 68s to 62s'
      },
      timeStudy: {
        done: 'yes',
        type: 'production',
        observedRate: 90,
        standardRate: 112,
        findings: 'Material handling delay accounts for 4.2s per garment'
      },
      buildUp: {
        day: '2',
        plannedPct: 75,
        achievedPct: 80,
        operators: 32,
        notes: 'Target achieved despite 4 absentees'
      },
      lineIE: {
        name: 'Mahmudul Hoque',
        level: 'sr_executive',
        period: 'daily',
        weeklyNotes: 'Focus on zipper station balancing',
        monthlyNotes: 'Targeting 85% stable efficiency by Friday',
        additionalInfo: 'Fabric lot change scheduled tomorrow morning'
      },
      learningCurve: generateLineLearningCurve(1.25, 32, 8, 'new', 2, false),
      balancingAnalysis: calculateBalancingLossAnalysis(4648, 32, 62.0, 90, 112)
    },
    {
      id: 3,
      date: today,
      lineNo: '20',
      floor: 'Meghna Floor',
      buyer: 'Gap',
      style: 'PL-3302 Pique Polo',
      smv: 0.95,
      plannedMP: 38,
      workingHours: 8,
      targetEff: 88,
      targetProd: 1100,
      achievedProd: 990,
      efficiency: 90,
      remarks: 'Placket folding accurate, collar rib tension stable',
      orderQty: 12000,
      dailyInput: 1050,
      dailyOutput: 990,
      wip: 180,
      balancingGraph: 'complete',
      nextStyle: 'PL-3305 Long Sleeve',
      nextStyleDate: getOffsetDateStr(8),
      mp: {
        Operator: { present: 26, absent: 1 },
        Helper: { present: 7, absent: 0 },
        'Iron Man': { present: 3, absent: 0 }
      },
      balanceMethod: 'Overtime',
      balanceNotes: 'Regular line balance maintained',
      top5: {
        held: 'yes',
        attendance: 100,
        items: [
          'Box placket stitch quality reviewed',
          'Collar point symmetry matched spec',
          'Buttons pull test passed at 90N',
          'Thread trim speed enhanced',
          'Operator fatigue reduction rest breaks'
        ],
        notes: 'Excellent teamwork and communication'
      },
      bottleneck: {
        station: 'Collar join & band',
        cycleTime: 44.0,
        targetCT: 43.5,
        status: 'ok',
        action: 'Standard gauge foot applied',
        notes: 'Very stable cycle'
      },
      timeStudy: {
        done: 'yes',
        type: 'both',
        observedRate: 128,
        standardRate: 135,
        findings: 'High pitch operator performance'
      },
      buildUp: {
        day: 'stable',
        plannedPct: 90,
        achievedPct: 90,
        operators: 36,
        notes: 'Stable production phase'
      },
      lineIE: {
        name: 'Mahmudul Hoque',
        level: 'sr_executive',
        period: 'daily',
        weeklyNotes: 'Consistently top performing line this week',
        monthlyNotes: 'Ready for lean benchmark showcase'
      }
    },
    {
      id: 4,
      date: today,
      lineNo: '21',
      floor: 'Meghna Floor',
      buyer: 'H&M',
      style: 'TS-2410 V-Neck',
      smv: 0.90,
      plannedMP: 36,
      workingHours: 8,
      targetEff: 85,
      targetProd: 1000,
      achievedProd: 850,
      efficiency: 85,
      remarks: 'V-neck center point alignment monitored hourly',
      orderQty: 10000,
      dailyInput: 900,
      dailyOutput: 850,
      wip: 250,
      balancingGraph: 'day1',
      nextStyle: 'TS-2420 Henley',
      nextStyleDate: getOffsetDateStr(9),
      mp: {
        Operator: { present: 25, absent: 3 },
        Helper: { present: 7, absent: 1 },
        'Iron Man': { present: 2, absent: 0 }
      },
      balanceMethod: 'Reduced target',
      balanceNotes: 'Adjusted target for first day run',
      top5: {
        held: 'yes',
        attendance: 88,
        items: [
          'V-neck tape binding tension fixed',
          'Shoulder stay tape position checked',
          'Bottom hem twin needle guide set',
          'Bundling sequence clarified',
          'Safety guard on overlock machines'
        ],
        notes: 'Day 1 setup complete'
      },
      bottleneck: {
        station: 'V-neck insert & topstitch',
        cycleTime: 54.0,
        targetCT: 48.0,
        status: 'high',
        action: 'Pre-creasing jig supplied',
        notes: 'Expect improvement tomorrow'
      },
      timeStudy: {
        done: 'partial',
        type: 'time',
        observedRate: 106,
        standardRate: 125,
        findings: 'First day learning curve underway'
      },
      buildUp: {
        day: '1',
        plannedPct: 60,
        achievedPct: 85,
        operators: 34,
        notes: 'Better than planned first day'
      },
      lineIE: {
        name: 'Sharmin Sultana',
        level: 'executive',
        period: 'daily',
        weeklyNotes: 'Style transition completed successfully',
        monthlyNotes: 'Expected to reach 85%+ in 2 days'
      }
    },
    {
      id: 5,
      date: today,
      lineNo: '24',
      floor: 'Karnophuli Floor',
      buyer: 'Uniqlo',
      style: 'PL-1100 Dry-Ex',
      smv: 0.80,
      plannedMP: 42,
      workingHours: 8,
      targetEff: 92,
      targetProd: 1300,
      achievedProd: 1200,
      efficiency: 92,
      remarks: 'Synthetic fabric handling optimal, zero static issues reported',
      orderQty: 20000,
      dailyInput: 1250,
      dailyOutput: 1200,
      wip: 90,
      balancingGraph: 'complete',
      nextStyle: 'PL-1150 Mesh Polo',
      nextStyleDate: getOffsetDateStr(5),
      mp: {
        Operator: { present: 30, absent: 0 },
        Helper: { present: 9, absent: 1 },
        'Iron Man': { present: 3, absent: 0 }
      },
      balanceMethod: 'Extra operators',
      balanceNotes: '1 extra floating helper deployed',
      top5: {
        held: 'yes',
        attendance: 100,
        items: [
          'Silicon spray applied to needle bars',
          'Mesh panel match points verified',
          'Heat seal brand label test approved',
          'Anti-snagging glove check enforced',
          'Inspection light intensity checked (1000 lux)'
        ],
        notes: 'Standard operating procedures fully complied'
      },
      bottleneck: {
        station: 'Raglan sleeve join',
        cycleTime: 39.0,
        targetCT: 38.0,
        status: 'ok',
        action: 'Differential feed fine-tuned',
        notes: 'Puckering eliminated'
      },
      timeStudy: {
        done: 'yes',
        type: 'time',
        observedRate: 152,
        standardRate: 160,
        findings: 'High consistency across all operators'
      },
      buildUp: {
        day: 'stable',
        plannedPct: 92,
        achievedPct: 92,
        operators: 42,
        notes: 'Target exceeded consistently'
      },
      lineIE: {
        name: 'Sharmin Sultana',
        level: 'executive',
        period: 'daily',
        weeklyNotes: 'Uniqlo auditor praised layout and visual management',
        monthlyNotes: 'Model line candidate'
      }
    },
    // Yesterday historical records
    {
      id: 101,
      date: yesterday,
      lineNo: '18',
      floor: 'Padma Floor',
      buyer: 'H&M',
      style: 'TS-2401 Crewneck',
      smv: 0.85,
      plannedMP: 40,
      workingHours: 8,
      targetEff: 85,
      targetProd: 1200,
      achievedProd: 1044,
      efficiency: 87,
      remarks: 'Moderate run, minor machine needle downtime',
      orderQty: 15000,
      dailyInput: 1100,
      dailyOutput: 1044,
      wip: 350,
      balancingGraph: 'day2',
      nextStyle: 'TS-2501 Winter Thermal',
      nextStyleDate: getOffsetDateStr(6),
      mp: {
        Operator: { present: 27, absent: 3 },
        Helper: { present: 8, absent: 1 },
        'Iron Man': { present: 3, absent: 0 }
      },
      balanceMethod: 'Overtime',
      balanceNotes: '1 hr OT planned',
      top5: {
        held: 'yes',
        attendance: 90,
        items: ['Rib attach check', 'Needle inspection routine'],
        notes: 'Standard checks'
      },
      bottleneck: {
        station: 'Cuff stitch',
        cycleTime: 49.0,
        targetCT: 45.0,
        status: 'ok',
        action: 'Attachment adjusted'
      },
      timeStudy: {
        done: 'yes',
        type: 'time',
        observedRate: 135,
        standardRate: 150,
        findings: 'Standard pace'
      },
      buildUp: {
        day: '3',
        plannedPct: 85,
        achievedPct: 87,
        operators: 38,
        notes: 'Build-up progression'
      },
      lineIE: {
        name: 'Mahmudul Hoque',
        level: 'sr_executive',
        period: 'daily'
      }
    },
    {
      id: 102,
      date: yesterday,
      lineNo: '19',
      floor: 'Padma Floor',
      buyer: 'Zara',
      style: 'JK-1180 Windbreaker',
      smv: 1.25,
      plannedMP: 45,
      workingHours: 8,
      targetEff: 80,
      targetProd: 900,
      achievedProd: 756,
      efficiency: 84,
      remarks: 'Zipper operator worked full shift without bottleneck',
      orderQty: 8500,
      dailyInput: 800,
      dailyOutput: 756,
      wip: 380,
      balancingGraph: 'day1',
      nextStyle: 'JK-1200 Bomber',
      nextStyleDate: getOffsetDateStr(3),
      mp: {
        Operator: { present: 26, absent: 2 },
        Helper: { present: 7, absent: 1 },
        'Iron Man': { present: 3, absent: 0 }
      },
      balanceMethod: 'Overtime',
      balanceNotes: 'Normal shift',
      top5: {
        held: 'yes',
        attendance: 92,
        items: ['Zipper verify'],
        notes: 'On target'
      },
      bottleneck: {
        station: 'Zipper install',
        cycleTime: 65.0,
        targetCT: 60.0,
        status: 'high',
        action: 'Support helper assigned'
      },
      timeStudy: {
        done: 'yes',
        type: 'time',
        observedRate: 95,
        standardRate: 110,
        findings: 'Acceptable speed'
      },
      buildUp: {
        day: '1',
        plannedPct: 70,
        achievedPct: 84,
        operators: 36,
        notes: 'Good initial start'
      },
      lineIE: {
        name: 'Mahmudul Hoque',
        level: 'sr_executive',
        period: 'daily'
      }
    }
  ];
}

// Generate realistic checklists for today and past 28 days
export function generateDefaultChecklists(): ChecklistMap {
  const map: ChecklistMap = {};
  const today = getTodayDateStr();
  
  // Today: 9 completed, 3 pending, 1 action needed (13 tasks total)
  map[today] = ['yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'pending', 'pending', 'pending', 'no'];

  // Past 28 days (13 tasks each)
  for (let i = 1; i <= 28; i++) {
    const dStr = getOffsetDateStr(-i);
    if (i % 5 === 0) {
      map[dStr] = ['yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes'];
    } else if (i % 3 === 0) {
      map[dStr] = ['yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'pending', 'yes', 'yes', 'yes'];
    } else if (i % 2 === 0) {
      map[dStr] = ['yes', 'yes', 'yes', 'yes', 'pending', 'yes', 'yes', 'yes', 'pending', 'yes', 'no', 'yes', 'yes'];
    } else {
      map[dStr] = ['yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'pending', 'yes', 'yes', 'yes', 'yes', 'yes'];
    }
  }

  // Explicit status for September 17, 2026 (Debonair Unit-2 Full Inspection)
  map['2026-09-17'] = ['yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'pending', 'yes', 'yes'];

  return map;
}

// IE Metrics calculations
export function calculateLineMetrics(line: LineEntry) {
  const totalPresentMP =
    line.mp.Operator.present + line.mp.Helper.present + line.mp['Iron Man'].present;
  const totalAbsentMP =
    line.mp.Operator.absent + line.mp.Helper.absent + line.mp['Iron Man'].absent;
  const totalAllocatedMP = totalPresentMP + totalAbsentMP;

  const totalWorkingMins = line.workingHours * 60;
  const availableMinutes = totalPresentMP * totalWorkingMins;
  const standardProducedMinutes = line.achievedProd * line.smv;

  const calculatedEff =
    availableMinutes > 0 ? (standardProducedMinutes / availableMinutes) * 100 : 0;

  const plannedProducedMins = line.targetProd * line.smv;
  const targetAvailableMins = line.plannedMP * totalWorkingMins;
  const calculatedTargetEff =
    targetAvailableMins > 0 ? (plannedProducedMins / targetAvailableMins) * 100 : 0;

  const variancePcs = line.achievedProd - line.targetProd;
  const absenteeismPct = totalAllocatedMP > 0 ? (totalAbsentMP / totalAllocatedMP) * 100 : 0;

  return {
    totalPresentMP,
    totalAbsentMP,
    totalAllocatedMP,
    availableMinutes: Math.round(availableMinutes),
    standardProducedMinutes: Math.round(standardProducedMinutes),
    efficiencyPct: Math.round(calculatedEff * 10) / 10,
    targetEffPct: Math.round(calculatedTargetEff * 10) / 10,
    variancePcs,
    absenteeismPct: Math.round(absenteeismPct * 10) / 10
  };
}

export function calculateFactoryOverall(lines: LineEntry[]) {
  let totalProducedMinutes = 0;
  let totalAvailableMinutes = 0;
  let totalAchievedProd = 0;
  let totalTargetProd = 0;
  let totalPresent = 0;
  let totalAbsent = 0;
  let totalWip = 0;

  for (const line of lines) {
    const metrics = calculateLineMetrics(line);
    totalProducedMinutes += metrics.standardProducedMinutes;
    totalAvailableMinutes += metrics.availableMinutes;
    totalAchievedProd += line.achievedProd;
    totalTargetProd += line.targetProd;
    totalPresent += metrics.totalPresentMP;
    totalAbsent += metrics.totalAbsentMP;
    totalWip += line.wip;
  }

  const overallEfficiency =
    totalAvailableMinutes > 0 ? (totalProducedMinutes / totalAvailableMinutes) * 100 : 0;
  const targetVariance = totalAchievedProd - totalTargetProd;
  const attendanceRate =
    totalPresent + totalAbsent > 0 ? (totalPresent / (totalPresent + totalAbsent)) * 100 : 100;

  return {
    overallEfficiency: Math.round(overallEfficiency * 10) / 10,
    totalAchievedProd,
    totalTargetProd,
    targetVariance,
    totalPresent,
    totalAbsent,
    totalWip,
    attendanceRate: Math.round(attendanceRate * 10) / 10,
    totalProducedMinutes: Math.round(totalProducedMinutes),
    totalAvailableMinutes: Math.round(totalAvailableMinutes),
    activeLinesCount: lines.length
  };
}

// Calculate Day-wise Production Summaries across all recorded dates
export function calculateDayWiseSummaries(
  allLines: LineEntry[],
  checklists: ChecklistMap = {}
): DayWiseSummary[] {
  const datesSet = new Set<string>();

  allLines.forEach(l => {
    if (l.date) datesSet.add(l.date);
  });
  Object.keys(checklists).forEach(d => datesSet.add(d));

  // Ensure key dates are always present
  datesSet.add('2026-09-17');
  datesSet.add(getOffsetDateStr(-1));
  datesSet.add(getTodayDateStr());

  const sortedDates = Array.from(datesSet).sort((a, b) => b.localeCompare(a));

  return sortedDates.map(dStr => {
    const dayLines = allLines.filter(l => l.date === dStr);
    const factory = calculateFactoryOverall(dayLines);

    const statuses = normalizeChecklistStatuses(checklists[dStr]);
    const doneCount = statuses.filter(s => s === 'yes').length;
    const checklistPct = Math.round((doneCount / CHECKLIST_TASK_COUNT) * 100);

    return {
      date: dStr,
      formattedDate: formatDateLabel(dStr),
      linesCount: dayLines.length,
      totalLines: dayLines.length,
      totalTargetProd: factory.totalTargetProd,
      targetProd: factory.totalTargetProd,
      totalAchievedProd: factory.totalAchievedProd,
      achievedProd: factory.totalAchievedProd,
      targetVariance: factory.targetVariance,
      variancePcs: factory.targetVariance,
      overallEfficiency: factory.overallEfficiency,
      efficiencyPct: factory.overallEfficiency,
      totalPresentMP: factory.totalPresent,
      presentMP: factory.totalPresent,
      totalAbsentMP: factory.totalAbsent,
      absentMP: factory.totalAbsent,
      attendanceRate: factory.attendanceRate,
      producedMinutes: factory.totalProducedMinutes,
      availableMinutes: factory.totalAvailableMinutes,
      checklistCompletionPct: checklistPct,
      checklistCompliancePct: checklistPct,
      totalWip: factory.totalWip,
      isDebonair: dStr === '2026-09-17'
    };
  });
}

// Calculate Day-over-Day variance between active date and previous recorded date
export function calculateDayOverDayVariance(
  allLines: LineEntry[],
  currentDate: string
) {
  const currentLines = allLines.filter(l => l.date === currentDate);
  const currentFactory = calculateFactoryOverall(currentLines);

  // Find the previous date in the dataset
  const allDates = Array.from(new Set(allLines.map(l => l.date).filter(Boolean)))
    .sort((a, b) => a.localeCompare(b));
  
  const currentIdx = allDates.indexOf(currentDate);
  const previousDate = currentIdx > 0 ? allDates[currentIdx - 1] : null;

  if (!previousDate) {
    return {
      hasPreviousData: false,
      currentDate,
      previousDate: null,
      outputDiffPcs: 0,
      outputDiffPct: 0,
      efficiencyDiffPts: 0,
      targetDiffPcs: 0
    };
  }

  const prevLines = allLines.filter(l => l.date === previousDate);
  const prevFactory = calculateFactoryOverall(prevLines);

  const outputDiffPcs = currentFactory.totalAchievedProd - prevFactory.totalAchievedProd;
  const outputDiffPct = prevFactory.totalAchievedProd > 0
    ? Math.round(((outputDiffPcs) / prevFactory.totalAchievedProd) * 1000) / 10
    : 0;
  const efficiencyDiffPts = Math.round((currentFactory.overallEfficiency - prevFactory.overallEfficiency) * 10) / 10;
  const targetDiffPcs = currentFactory.totalTargetProd - prevFactory.totalTargetProd;

  return {
    hasPreviousData: true,
    currentDate,
    previousDate,
    outputDiffPcs,
    outputDiffPct,
    efficiencyDiffPts,
    targetDiffPcs
  };
}

// Calculate style WIP threshold and summary analytics
export interface StyleWipThresholdInfo {
  threshold: number;
  hourlyTarget: number;
  bufferHours: number;
  isBreached: boolean;
  overloadPcs: number;
  wipStatus: 'optimal' | 'caution' | 'critical';
}

/**
 * Calculates the recommended in-line Work-In-Progress (WIP) buffer threshold
 * for a specific garment style based on IE takt pace and standard buffer hours.
 *
 * Formula:
 * 1. Hourly Target Pace = Target Production / Working Hours (default 8h)
 * 2. Buffer Hours factor based on style complexity/SMV:
 *    - SMV >= 1.20 min: 2.5 hours buffer allowance
 *    - SMV >= 0.85 min: 2.0 hours buffer allowance
 *    - SMV < 0.85 min: 1.8 hours buffer allowance
 * 3. Calculated Threshold = Math.round(Hourly Target Pace * Buffer Hours)
 * (With a standard minimum floor of 150 pcs).
 */
export function calculateStyleWipThreshold(line: LineEntry): StyleWipThresholdInfo {
  const hours = line.workingHours > 0 ? line.workingHours : 8;
  const target = line.targetProd > 0 ? line.targetProd : 1000;
  const hourlyTarget = Math.round((target / hours) * 10) / 10;

  // Buffer hours factor based on garment SMV / construction complexity
  let bufferHours = 2.0;
  if (line.smv >= 1.2) {
    bufferHours = 2.5;
  } else if (line.smv < 0.85) {
    bufferHours = 1.8;
  }

  const calculated = Math.round(hourlyTarget * bufferHours);
  const threshold = Math.max(150, calculated);
  const currentWip = line.wip ?? 0;
  const isBreached = currentWip > threshold;
  const overloadPcs = isBreached ? currentWip - threshold : 0;

  let wipStatus: 'optimal' | 'caution' | 'critical' = 'optimal';
  if (isBreached) {
    wipStatus = 'critical';
  } else if (currentWip > threshold * 0.85) {
    wipStatus = 'caution';
  }

  return {
    threshold,
    hourlyTarget,
    bufferHours,
    isBreached,
    overloadPcs,
    wipStatus
  };
}

export interface StyleAggregatedSummary {
  style: string;
  buyer: string;
  lineNumbers: string[];
  totalTargetProd: number;
  totalAchievedProd: number;
  totalOrderQty: number;
  totalWip: number;
  totalThreshold: number;
  wipStatus: 'optimal' | 'caution' | 'critical';
  avgSmv: number;
  totalPresentMP: number;
  totalAbsentMP: number;
  avgEfficiencyPct: number;
  variancePcs: number;
  fulfillmentPct: number;
  bottlenecks: string[];
}

export function calculateStyleSummary(lines: LineEntry[]): StyleAggregatedSummary[] {
  const styleMap = new Map<string, {
    style: string;
    buyer: string;
    lineNumbers: string[];
    totalTargetProd: number;
    totalAchievedProd: number;
    totalOrderQty: number;
    totalWip: number;
    totalThreshold: number;
    smvSum: number;
    totalPresentMP: number;
    totalAbsentMP: number;
    producedMinSum: number;
    availableMinSum: number;
    bottlenecks: Set<string>;
    count: number;
  }>();

  for (const line of lines) {
    const key = line.style.trim().toLowerCase();
    const wipInfo = calculateStyleWipThreshold(line);
    const metrics = calculateLineMetrics(line);

    if (!styleMap.has(key)) {
      styleMap.set(key, {
        style: line.style,
        buyer: line.buyer,
        lineNumbers: [line.lineNo],
        totalTargetProd: line.targetProd,
        totalAchievedProd: line.achievedProd,
        totalOrderQty: line.orderQty,
        totalWip: line.wip,
        totalThreshold: wipInfo.threshold,
        smvSum: line.smv,
        totalPresentMP: metrics.totalPresentMP,
        totalAbsentMP: metrics.totalAbsentMP,
        producedMinSum: metrics.standardProducedMinutes,
        availableMinSum: metrics.availableMinutes,
        bottlenecks: new Set([line.bottleneck.station]),
        count: 1
      });
    } else {
      const entry = styleMap.get(key)!;
      if (!entry.lineNumbers.includes(line.lineNo)) {
        entry.lineNumbers.push(line.lineNo);
      }
      entry.totalTargetProd += line.targetProd;
      entry.totalAchievedProd += line.achievedProd;
      entry.totalOrderQty += line.orderQty;
      entry.totalWip += line.wip;
      entry.totalThreshold += wipInfo.threshold;
      entry.smvSum += line.smv;
      entry.totalPresentMP += metrics.totalPresentMP;
      entry.totalAbsentMP += metrics.totalAbsentMP;
      entry.producedMinSum += metrics.standardProducedMinutes;
      entry.availableMinSum += metrics.availableMinutes;
      if (line.bottleneck.station) {
        entry.bottlenecks.add(line.bottleneck.station);
      }
      entry.count += 1;
    }
  }

  return Array.from(styleMap.values()).map(entry => {
    const avgEfficiencyPct =
      entry.availableMinSum > 0
        ? Math.round((entry.producedMinSum / entry.availableMinSum) * 1000) / 10
        : 0;
    const variancePcs = entry.totalAchievedProd - entry.totalTargetProd;
    const fulfillmentPct =
      entry.totalTargetProd > 0
        ? Math.round((entry.totalAchievedProd / entry.totalTargetProd) * 100)
        : 0;

    let wipStatus: 'optimal' | 'caution' | 'critical' = 'optimal';
    if (entry.totalWip > entry.totalThreshold) {
      wipStatus = 'critical';
    } else if (entry.totalWip > entry.totalThreshold * 0.85) {
      wipStatus = 'caution';
    }

    return {
      style: entry.style,
      buyer: entry.buyer,
      lineNumbers: entry.lineNumbers.sort((a, b) => parseInt(a) - parseInt(b)),
      totalTargetProd: entry.totalTargetProd,
      totalAchievedProd: entry.totalAchievedProd,
      totalOrderQty: entry.totalOrderQty,
      totalWip: entry.totalWip,
      totalThreshold: entry.totalThreshold,
      wipStatus,
      avgSmv: Math.round((entry.smvSum / entry.count) * 100) / 100,
      totalPresentMP: entry.totalPresentMP,
      totalAbsentMP: entry.totalAbsentMP,
      avgEfficiencyPct,
      variancePcs,
      fulfillmentPct,
      bottlenecks: Array.from(entry.bottlenecks)
    };
  });
}

// Export CSV string
export function exportReportToCSV(lines: LineEntry[], dateStr: string): string {
  const factory = calculateFactoryOverall(lines);
  const styleSummaries = calculateStyleSummary(lines);

  const headers = [
    'Line No',
    'Floor',
    'Buyer',
    'Style',
    'SMV',
    'Working Hrs',
    'Present MP',
    'Absent MP',
    'Target Prod',
    'Achieved Prod',
    'Variance Pcs',
    'Produced Mins',
    'Available Mins',
    'Efficiency %',
    'In-Line WIP',
    'WIP Threshold',
    'WIP Status',
    'Bottleneck Station',
    'Cycle Time (s)',
    'Remarks'
  ];

  const rows = lines.map(line => {
    const m = calculateLineMetrics(line);
    const wip = calculateStyleWipThreshold(line);
    return [
      `Line ${line.lineNo}`,
      `"${line.floor}"`,
      `"${line.buyer}"`,
      `"${line.style}"`,
      line.smv.toFixed(2),
      line.workingHours,
      m.totalPresentMP,
      m.totalAbsentMP,
      line.targetProd,
      line.achievedProd,
      m.variancePcs,
      m.standardProducedMinutes,
      m.availableMinutes,
      `${m.efficiencyPct}%`,
      line.wip,
      wip.threshold,
      wip.wipStatus.toUpperCase(),
      `"${line.bottleneck.station}"`,
      line.bottleneck.cycleTime,
      `"${line.remarks.replace(/"/g, '""')}"`
    ].join(',');
  });

  const factorySummaryLines = [
    '',
    '=== FACTORY OVERALL SUMMARIZED METRICS ===',
    `Report Date,${dateStr}`,
    `Active Lines,${factory.activeLinesCount}`,
    `Overall Efficiency,${factory.overallEfficiency}%`,
    `Total Planned Target,${factory.totalTargetProd} pcs`,
    `Total Achieved Production,${factory.totalAchievedProd} pcs`,
    `Target Variance,${factory.targetVariance >= 0 ? `+${factory.targetVariance}` : factory.targetVariance} pcs`,
    `Total Produced Standard Minutes,${factory.totalProducedMinutes} min`,
    `Total Available Minutes,${factory.totalAvailableMinutes} min`,
    `Manpower Attendance Rate,${factory.attendanceRate}% (Present: ${factory.totalPresent} / Absent: ${factory.totalAbsent})`,
    `Total Factory In-Line WIP,${factory.totalWip} pcs`,
    '',
    '=== AGGREGATED STYLE PERFORMANCE & WIP BUFFER SUMMARY ===',
    'Style,Buyer,Lines,Order Qty,Target Prod,Achieved Prod,Variance,Fulfillment %,Current WIP,Threshold WIP,WIP Status,Avg SMV,Efficiency %',
    ...styleSummaries.map(s => [
      `"${s.style}"`,
      `"${s.buyer}"`,
      `"${s.lineNumbers.map(l => `L${l}`).join(' ')}"`,
      s.totalOrderQty,
      s.totalTargetProd,
      s.totalAchievedProd,
      s.variancePcs,
      `${s.fulfillmentPct}%`,
      s.totalWip,
      s.totalThreshold,
      s.wipStatus.toUpperCase(),
      s.avgSmv.toFixed(2),
      `${s.avgEfficiencyPct}%`
    ].join(','))
  ];

  return [headers.join(','), ...rows, ...factorySummaryLines].join('\n');
}

export function downloadCSV(filename: string, text: string) {
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Calculate Overall IE Effectiveness Scorecard based on the 3 core pillars
export function calculateScorecardMetrics(
  lines: LineEntry[],
  checklists: ChecklistMap,
  selectedDate: string,
  customWeights?: { efficiency: number; checklist: number; bottleneck: number }
): ScorecardResult {
  const weights = customWeights || { efficiency: 0.4, checklist: 0.3, bottleneck: 0.3 };

  // 1. Efficiency Pillar
  const activeLines = lines.length > 0 ? lines : [];
  let totalAchievedEff = 0;
  let totalTargetEff = 0;
  let linesOnTargetCount = 0;
  let criticalLinesCount = 0;

  activeLines.forEach(line => {
    totalAchievedEff += line.efficiency;
    totalTargetEff += line.targetEff;
    if (line.efficiency >= line.targetEff) {
      linesOnTargetCount++;
    }
    if (line.targetEff - line.efficiency > 10) {
      criticalLinesCount++;
    }
  });

  const averageAchievedEff =
    activeLines.length > 0 ? Math.round((totalAchievedEff / activeLines.length) * 10) / 10 : 0;
  const averageTargetEff =
    activeLines.length > 0 ? Math.round((totalTargetEff / activeLines.length) * 10) / 10 : 0;
  const attainmentRatio =
    averageTargetEff > 0 ? Math.round((averageAchievedEff / averageTargetEff) * 100 * 10) / 10 : 0;

  // Efficiency Score: Blend of achieved efficiency and attainment ratio against target
  const efficiencyScorePct = Math.min(
    100,
    Math.max(
      0,
      Math.round((averageAchievedEff * 0.5 + Math.min(attainmentRatio, 100) * 0.5) * 10) / 10
    )
  );

  // 2. Checklist Pillar
  const currentStatuses = normalizeChecklistStatuses(checklists[selectedDate]);
  const totalTasks = CHECKLIST_TASK_COUNT;
  const completedTasks = currentStatuses.filter(s => s === 'yes').length;
  const pendingTasks = currentStatuses.filter(s => s === 'pending').length;
  const notDoneTasks = currentStatuses.filter(s => s === 'no').length;

  const checklistCompletionPct = Math.round((completedTasks / totalTasks) * 100 * 10) / 10;
  const checklistScorePct = checklistCompletionPct;

  // 3. Bottleneck Resolution Pillar
  const totalBottlenecks = activeLines.length;
  let resolvedCount = 0;
  let highRiskCount = 0;
  let criticalCount = 0;
  let totalCycleTime = 0;
  let totalTargetCT = 0;
  let bottleneckScoreSum = 0;

  activeLines.forEach(line => {
    const b = line.bottleneck;
    totalCycleTime += b?.cycleTime || 45;
    totalTargetCT += b?.targetCT || 45;

    const status = b?.status || 'ok';
    const hasAction = Boolean(b?.action && b.action.trim().length > 3);

    if (status === 'ok') {
      resolvedCount++;
      bottleneckScoreSum += 100;
    } else if (status === 'high') {
      highRiskCount++;
      bottleneckScoreSum += hasAction ? 70 : 40;
    } else {
      // critical
      criticalCount++;
      bottleneckScoreSum += hasAction ? 45 : 20;
    }

    // Cycle time variance penalty or reward
    if (b && b.targetCT > 0 && b.cycleTime <= b.targetCT * 1.02) {
      bottleneckScoreSum = Math.min(bottleneckScoreSum + 5, 100);
    }
  });

  const bottleneckScorePct =
    activeLines.length > 0
      ? Math.min(100, Math.max(0, Math.round((bottleneckScoreSum / activeLines.length) * 10) / 10))
      : 80;

  const averageCycleTime =
    activeLines.length > 0 ? Math.round((totalCycleTime / activeLines.length) * 10) / 10 : 0;
  const averageTargetCT =
    activeLines.length > 0 ? Math.round((totalTargetCT / activeLines.length) * 10) / 10 : 0;
  const mitigationAdherencePct =
    totalBottlenecks > 0
      ? Math.round(((resolvedCount + highRiskCount * 0.7) / totalBottlenecks) * 100 * 10) / 10
      : 100;

  // Composite Calculation
  const efficiencyWeighted = Math.round(efficiencyScorePct * weights.efficiency * 10) / 10;
  const checklistWeighted = Math.round(checklistScorePct * weights.checklist * 10) / 10;
  const bottleneckWeighted = Math.round(bottleneckScorePct * weights.bottleneck * 10) / 10;
  const overallScore = Math.min(
    100,
    Math.max(
      0,
      Math.round((efficiencyWeighted + checklistWeighted + bottleneckWeighted) * 10) / 10
    )
  );

  // Determine Grade
  let grade: 'A+' | 'A' | 'B' | 'C' | 'D' = 'B';
  let gradeLabel = 'Acceptable Operations';
  let gradeColor = '#0284c7';

  if (overallScore >= 90) {
    grade = 'A+';
    gradeLabel = 'World-Class IE Benchmarking';
    gradeColor = '#059669'; // emerald
  } else if (overallScore >= 80) {
    grade = 'A';
    gradeLabel = 'High IE Operational Effectiveness';
    gradeColor = '#0d9488'; // teal
  } else if (overallScore >= 70) {
    grade = 'B';
    gradeLabel = 'Standard Operations (Balancing Active)';
    gradeColor = '#0284c7'; // sky / blue
  } else if (overallScore >= 60) {
    grade = 'C';
    gradeLabel = 'Action Required (Loss & Bottleneck Alert)';
    gradeColor = '#d97706'; // amber
  } else {
    grade = 'D';
    gradeLabel = 'Critical Non-Compliance (Floor Escalation)';
    gradeColor = '#e11d48'; // rose
  }

  // Recommendations Generation
  const recommendations: string[] = [];

  if (criticalLinesCount > 0) {
    recommendations.push(
      `${criticalLinesCount} sewing line(s) have efficiency falling >10% below target. Deploy floaters and perform pitch-time balance immediately.`
    );
  } else if (averageAchievedEff >= averageTargetEff) {
    recommendations.push(
      `Line efficiency targets met across plant (${averageAchievedEff}% avg vs ${averageTargetEff}% plan). Maintain current line pace and pitch feeding.`
    );
  } else {
    recommendations.push(
      `Plant efficiency gap is ${(averageTargetEff - averageAchievedEff).toFixed(1)}%. Review WIP balance between front and back assembly.`
    );
  }

  if (pendingTasks > 0) {
    recommendations.push(
      `${pendingTasks} daily IE control checklist item(s) pending sign-off for ${selectedDate}. Complete hourly audits before shift closing.`
    );
  } else {
    recommendations.push(`100% daily IE control checklists verified. High floor compliance.`);
  }

  if (criticalCount > 0 || highRiskCount > 0) {
    recommendations.push(
      `${criticalCount + highRiskCount} bottleneck station(s) require IE intervention. Verify guide folders, machine RPM, and operator handling motion.`
    );
  } else {
    recommendations.push(
      `All line bottleneck stations operating within standard takt time tolerance window (<1.05 CT).`
    );
  }

  return {
    overallScore,
    grade,
    gradeLabel,
    gradeColor,
    pillars: {
      efficiency: {
        name: 'Average Line Efficiency',
        weightPct: Math.round(weights.efficiency * 100),
        scorePct: efficiencyScorePct,
        weightedScore: efficiencyWeighted,
        status:
          efficiencyScorePct >= 85
            ? 'excellent'
            : efficiencyScorePct >= 75
            ? 'good'
            : efficiencyScorePct >= 65
            ? 'warning'
            : 'critical',
        headline: `${averageAchievedEff}% Achieved vs ${averageTargetEff}% Target`,
        details: `${linesOnTargetCount} of ${activeLines.length} lines on or above target (${attainmentRatio}% attainment ratio)`
      },
      checklist: {
        name: 'IE Checklist Completion',
        weightPct: Math.round(weights.checklist * 100),
        scorePct: checklistScorePct,
        weightedScore: checklistWeighted,
        status:
          checklistScorePct >= 85
            ? 'excellent'
            : checklistScorePct >= 70
            ? 'good'
            : checklistScorePct >= 50
            ? 'warning'
            : 'critical',
        headline: `${completedTasks} of ${totalTasks} Tasks Completed (${checklistCompletionPct}%)`,
        details: `${pendingTasks} pending sign-off, ${notDoneTasks} flagged incomplete for ${selectedDate}`
      },
      bottleneck: {
        name: 'Timely Bottleneck Resolution',
        weightPct: Math.round(weights.bottleneck * 100),
        scorePct: bottleneckScorePct,
        weightedScore: bottleneckWeighted,
        status:
          bottleneckScorePct >= 80
            ? 'excellent'
            : bottleneckScorePct >= 65
            ? 'good'
            : bottleneckScorePct >= 50
            ? 'warning'
            : 'critical',
        headline: `${resolvedCount} of ${totalBottlenecks} Bottlenecks Stabilized`,
        details: `Avg Cycle Time: ${averageCycleTime}s vs Target ${averageTargetCT}s (${highRiskCount} moderate, ${criticalCount} critical)`
      }
    },
    efficiencyPillar: {
      averageAchievedEff,
      averageTargetEff,
      attainmentRatio,
      linesOnTargetCount,
      linesCount: activeLines.length,
      criticalLinesCount
    },
    checklistPillar: {
      totalTasks,
      completedTasks,
      pendingTasks,
      notDoneTasks,
      completionPct: checklistCompletionPct
    },
    bottleneckPillar: {
      totalBottlenecks,
      resolvedCount,
      highRiskCount,
      criticalCount,
      averageCycleTime,
      averageTargetCT,
      mitigationAdherencePct
    },
    recommendations
  };
}


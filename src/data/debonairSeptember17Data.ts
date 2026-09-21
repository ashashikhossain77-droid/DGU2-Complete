/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LineEntry } from '../types';

export const DEBONAIR_SEPTEMBER_17_DATE = '2026-09-17';

export const DEBONAIR_SEPTEMBER_17_LINES: LineEntry[] = [
  // PADMA FLOOR (Lines 1 - 6)
  {
    id: 1701,
    date: DEBONAIR_SEPTEMBER_17_DATE,
    lineNo: '1',
    floor: 'Padma Floor',
    apartment: 'Unit 2 - Padma',
    isActive: true,
    buyer: 'H&M',
    style: 'HERBERT LIGHT PADDED HOOD',
    smv: 42.17,
    plannedMP: 60,
    workingHours: 10.0,
    targetEff: 60,
    targetProd: 512,
    achievedProd: 24,
    efficiency: 3,
    remarks: 'Shortage: -488. Available: 36000m, Produce: 1012m. Line Chief: BAYZED. Days Run: 37.',
    orderQty: 10000,
    dailyInput: 512,
    dailyOutput: 24,
    wip: 488,
    balancingGraph: 'day4',
    nextStyle: 'HERBERT LIGHT PADDED HOOD',
    nextStyleDate: '2026-09-25',
    mp: {
      Operator: { present: 48, absent: 0 },
      Helper: { present: 9, absent: 0 },
      'Iron Man': { present: 3, absent: 0 }
    },
    balanceMethod: 'Rebalance & Line Tuning',
    balanceNotes: 'Line running day 37. Extreme bottleneck encountered at hood padding assembly.',
    top5: {
      held: 'yes',
      attendance: 100,
      items: [
        'Hood padding stitching alignment check',
        'Quilting tension calibration',
        'Line output pacing review with Bayzed',
        'Feeding bundle sequence audit',
        'Sewing machine motor speed test'
      ],
      notes: 'Line Chief Bayzed committed to recovery action plan.'
    },
    bottleneck: {
      station: 'Hood padding assembly & join',
      cycleTime: 78.5,
      targetCT: 42.17,
      status: 'critical',
      action: 'Assign senior floater and adjust seam guides',
      notes: 'Operating far below target pace'
    },
    timeStudy: {
      done: 'yes',
      type: 'both',
      observedRate: 24,
      standardRate: 51,
      findings: 'Padding bundle handling delay in early shift'
    },
    buildUp: {
      day: '37',
      plannedPct: 60,
      achievedPct: 3,
      operators: 48,
      notes: 'Severe run disturbance; technical intervention needed'
    },
    lineIE: {
      name: 'BAYZED (Line Chief) / IE Lead',
      level: 'executive',
      period: 'daily',
      weeklyNotes: 'Immediate bottleneck de-escalation requested'
    }
  },
  {
    id: 1702,
    date: DEBONAIR_SEPTEMBER_17_DATE,
    lineNo: '2',
    floor: 'Padma Floor',
    apartment: 'Unit 2 - Padma',
    isActive: true,
    buyer: 'OTCF',
    style: 'JAF 1156',
    smv: 45.20,
    plannedMP: 60,
    workingHours: 10.0,
    targetEff: 60,
    targetProd: 478,
    achievedProd: 350,
    efficiency: 44,
    remarks: 'Shortage: -128. Available: 36000m, Produce: 15820m. Line Chief: A.RAUF. Days Run: 9.',
    orderQty: 8500,
    dailyInput: 478,
    dailyOutput: 350,
    wip: 290,
    balancingGraph: 'day3',
    nextStyle: 'JAF 1156',
    nextStyleDate: '2026-09-24',
    mp: {
      Operator: { present: 48, absent: 0 },
      Helper: { present: 9, absent: 0 },
      'Iron Man': { present: 3, absent: 0 }
    },
    balanceMethod: 'Target Pacing',
    balanceNotes: 'Day 9 running. Output 350 pcs against 478 target (44% eff / 73% eff prf).',
    top5: {
      held: 'yes',
      attendance: 98,
      items: [
        'Collar rib attachment verification',
        'Front zipper feed consistency',
        'Target pacing for 35 pcs/hour rate',
        'WIP bundle buffer control',
        'End-line inspection feedback'
      ],
      notes: 'Line Chief A.Rauf managing steady ramp-up.'
    },
    bottleneck: {
      station: 'Front zipper attach',
      cycleTime: 52.0,
      targetCT: 45.2,
      status: 'high',
      action: 'Add zipper guide attachment',
      notes: 'Within striking distance of target pace'
    },
    timeStudy: {
      done: 'yes',
      type: 'time',
      observedRate: 35,
      standardRate: 48,
      findings: 'Smooth sewing flow across mid-stations'
    },
    buildUp: {
      day: '9',
      plannedPct: 60,
      achievedPct: 44,
      operators: 48,
      notes: 'Steady ramp-up on day 9'
    },
    lineIE: {
      name: 'A.RAUF (Line Chief) / IE Lead',
      level: 'executive',
      period: 'daily'
    }
  },
  {
    id: 1703,
    date: DEBONAIR_SEPTEMBER_17_DATE,
    lineNo: '3',
    floor: 'Padma Floor',
    apartment: 'Unit 2 - Padma',
    isActive: true,
    buyer: 'H&M',
    style: 'QUINN LIGHT BOMBER JKT',
    smv: 28.49,
    plannedMP: 61,
    workingHours: 11.0,
    targetEff: 60,
    targetProd: 848,
    achievedProd: 811,
    efficiency: 57,
    remarks: 'Shortage: -37. Available: 40260m, Produce: 23105m. Line Chief: TUHIN. Days Run: 9. 96% Effi Perf!',
    orderQty: 12000,
    dailyInput: 850,
    dailyOutput: 811,
    wip: 210,
    balancingGraph: 'complete',
    nextStyle: 'QUINN LIGHT BOMBER JKT',
    nextStyleDate: '2026-09-28',
    mp: {
      Operator: { present: 49, absent: 0 },
      Helper: { present: 9, absent: 0 },
      'Iron Man': { present: 3, absent: 0 }
    },
    balanceMethod: 'Continuous Flow',
    balanceNotes: 'Outstanding run. 811 pcs produced (96% effi performance relative to 60% plan).',
    top5: {
      held: 'yes',
      attendance: 100,
      items: [
        'Sleeve rib attach quality review',
        'Lining pocket welt alignment',
        'Takt pace 74 pcs/hour achieved',
        'Zero machine breakdowns recorded',
        'Good housekeeping maintained'
      ],
      notes: 'Line Chief Tuhin led top-tier performance on Padma floor.'
    },
    bottleneck: {
      station: 'Lining sleeve insertion',
      cycleTime: 29.5,
      targetCT: 28.49,
      status: 'ok',
      action: 'Standard guide verified',
      notes: 'Bottleneck effectively dissolved'
    },
    timeStudy: {
      done: 'yes',
      type: 'both',
      observedRate: 74,
      standardRate: 77,
      findings: 'Near 100% pacing efficiency'
    },
    buildUp: {
      day: '9',
      plannedPct: 60,
      achievedPct: 57,
      operators: 49,
      notes: 'Target achieved with minimal gap'
    },
    lineIE: {
      name: 'TUHIN (Line Chief) / IE Lead',
      level: 'sr_executive',
      period: 'daily'
    }
  },
  {
    id: 1704,
    date: DEBONAIR_SEPTEMBER_17_DATE,
    lineNo: '4',
    floor: 'Padma Floor',
    apartment: 'Unit 2 - Padma',
    isActive: true,
    buyer: 'H&M',
    style: 'QUINN LIGHT BOMBER JKT',
    smv: 28.49,
    plannedMP: 62,
    workingHours: 11.0,
    targetEff: 60,
    targetProd: 862,
    achievedProd: 432,
    efficiency: 30,
    remarks: 'Shortage: -430. Available: 40920m, Produce: 12308m. Line Chief: AKTAR. Days Run: 23.',
    orderQty: 15000,
    dailyInput: 862,
    dailyOutput: 432,
    wip: 430,
    balancingGraph: 'day3',
    nextStyle: 'QUINN LIGHT BOMBER JKT',
    nextStyleDate: '2026-09-30',
    mp: {
      Operator: { present: 50, absent: 0 },
      Helper: { present: 9, absent: 0 },
      'Iron Man': { present: 3, absent: 0 }
    },
    balanceMethod: 'Overtime Support',
    balanceNotes: 'Line 4 running same style as Line 3; balancing gap identified at pocket attachment.',
    top5: {
      held: 'yes',
      attendance: 98,
      items: [
        'Pocket zipper insertion jig adjustment',
        'Compare workstation pace with Line 3 benchmark',
        'Bundle flow smoothing',
        'Operator rotation at neck seam',
        'Mechanic folder inspection'
      ],
      notes: 'Line Chief Aktar coordinating method transfer from Line 3.'
    },
    bottleneck: {
      station: 'Side welt pocket stitch',
      cycleTime: 44.0,
      targetCT: 28.49,
      status: 'critical',
      action: 'Deploy secondary helper and pre-folder',
      notes: 'Primary line slowing factor'
    },
    timeStudy: {
      done: 'yes',
      type: 'time',
      observedRate: 39,
      standardRate: 78,
      findings: 'Operators struggling with zipper curve'
    },
    buildUp: {
      day: '23',
      plannedPct: 60,
      achievedPct: 30,
      operators: 50,
      notes: 'Underperforming compared to planned 60%'
    },
    lineIE: {
      name: 'AKTAR (Line Chief) / IE Lead',
      level: 'executive',
      period: 'daily'
    }
  },
  {
    id: 1705,
    date: DEBONAIR_SEPTEMBER_17_DATE,
    lineNo: '5',
    floor: 'Padma Floor',
    apartment: 'Unit 2 - Padma',
    isActive: true,
    buyer: 'H&M',
    style: 'DANNY MID PADDED JKT',
    smv: 46.76,
    plannedMP: 62,
    workingHours: 10.0,
    targetEff: 70,
    targetProd: 557,
    achievedProd: 540,
    efficiency: 68,
    remarks: 'Shortage: -17. Available: 37200m, Produce: 25250m. Line Chief: MOHASIN. Days Run: 115. 97% Effi Perf!',
    orderQty: 25000,
    dailyInput: 557,
    dailyOutput: 540,
    wip: 180,
    balancingGraph: 'complete',
    nextStyle: 'DANNY MID PADDED JKT',
    nextStyleDate: '2026-10-15',
    mp: {
      Operator: { present: 50, absent: 0 },
      Helper: { present: 9, absent: 0 },
      'Iron Man': { present: 3, absent: 0 }
    },
    balanceMethod: 'Mature Line Standardization',
    balanceNotes: 'Day 115 veteran line. Stable operation, achieved 68% eff (97% of 70% plan).',
    top5: {
      held: 'yes',
      attendance: 100,
      items: [
        'Daily morning 5S audit passed',
        'Padded quilt symmetry check',
        'Hourly count 54 pcs sustained',
        'Zero defect audit at end-line',
        'Thread tension verification'
      ],
      notes: 'Line Chief Mohasin maintained exemplary line discipline.'
    },
    bottleneck: {
      station: 'Padded sleeve join',
      cycleTime: 47.0,
      targetCT: 46.76,
      status: 'ok',
      action: 'Standard guide maintained',
      notes: 'Balanced line'
    },
    timeStudy: {
      done: 'yes',
      type: 'production',
      observedRate: 54,
      standardRate: 56,
      findings: 'Operators operating at 97% standard pace'
    },
    buildUp: {
      day: '115',
      plannedPct: 70,
      achievedPct: 68,
      operators: 50,
      notes: 'Mature line at target performance'
    },
    lineIE: {
      name: 'MOHASIN (Line Chief) / IE Lead',
      level: 'sr_executive',
      period: 'daily'
    }
  },
  {
    id: 1706,
    date: DEBONAIR_SEPTEMBER_17_DATE,
    lineNo: '6',
    floor: 'Padma Floor',
    apartment: 'Unit 2 - Padma',
    isActive: true,
    buyer: 'H&M',
    style: 'DANNY MID PADDED JKT',
    smv: 46.76,
    plannedMP: 62,
    workingHours: 10.0,
    targetEff: 70,
    targetProd: 557,
    achievedProd: 550,
    efficiency: 69,
    remarks: 'Shortage: -7. Available: 37200m, Produce: 25718m. Line Chief: HAMID. Days Run: 57. 99% Effi Perf!',
    orderQty: 22000,
    dailyInput: 557,
    dailyOutput: 550,
    wip: 160,
    balancingGraph: 'complete',
    nextStyle: 'DANNY MID PADDED JKT',
    nextStyleDate: '2026-10-10',
    mp: {
      Operator: { present: 50, absent: 0 },
      Helper: { present: 9, absent: 0 },
      'Iron Man': { present: 3, absent: 0 }
    },
    balanceMethod: 'High Pacing Flow',
    balanceNotes: 'Day 57 running. Near 100% target achievement (550 vs 557 pcs, 69% eff).',
    top5: {
      held: 'yes',
      attendance: 100,
      items: [
        'Padding batting thickness check',
        'Front placket topstitch alignment',
        'Target 55 pcs/hour achieved consistently',
        'Trim waste segregation',
        'Operator ergonomics check'
      ],
      notes: 'Line Chief Hamid delivered 99% of target plan.'
    },
    bottleneck: {
      station: 'Bottom hem padded close',
      cycleTime: 46.5,
      targetCT: 46.76,
      status: 'ok',
      action: 'Tension roller adjusted',
      notes: 'Optimal cycle pace'
    },
    timeStudy: {
      done: 'yes',
      type: 'both',
      observedRate: 55,
      standardRate: 56,
      findings: 'Consistent cycle times across operators'
    },
    buildUp: {
      day: '57',
      plannedPct: 70,
      achievedPct: 69,
      operators: 50,
      notes: 'Target virtually achieved'
    },
    lineIE: {
      name: 'HAMID (Line Chief) / IE Lead',
      level: 'sr_executive',
      period: 'daily'
    }
  },

  // MEGHNA FLOOR (Lines 7 - 12)
  {
    id: 1707,
    date: DEBONAIR_SEPTEMBER_17_DATE,
    lineNo: '7',
    floor: 'Meghna Floor',
    apartment: 'Unit 2 - Meghna',
    isActive: true,
    buyer: 'OTCF',
    style: 'JAF 434',
    smv: 41.02,
    plannedMP: 60,
    workingHours: 10.0,
    targetEff: 60,
    targetProd: 527,
    achievedProd: 300,
    efficiency: 34,
    remarks: 'Shortage: -227. Available: 36000m, Produce: 12306m. Line Chief: Anisur. Days Run: 7.',
    orderQty: 7500,
    dailyInput: 527,
    dailyOutput: 300,
    wip: 320,
    balancingGraph: 'day3',
    nextStyle: 'JAF 434',
    nextStyleDate: '2026-09-24',
    mp: {
      Operator: { present: 48, absent: 0 },
      Helper: { present: 9, absent: 0 },
      'Iron Man': { present: 3, absent: 0 }
    },
    balanceMethod: 'Line Ramp-Up',
    balanceNotes: 'Day 7 learning curve. Production reached 300 pcs.',
    top5: {
      held: 'yes',
      attendance: 98,
      items: ['Collar preparation', 'Bundle transport', 'Target alignment'],
      notes: 'Line Chief Anisur focusing on day 7 speed ramp.'
    },
    bottleneck: {
      station: 'Collar joining',
      cycleTime: 55.0,
      targetCT: 41.02,
      status: 'high',
      action: 'Helper deployed',
      notes: 'Improving motion sequence'
    },
    timeStudy: {
      done: 'yes',
      type: 'time',
      observedRate: 30,
      standardRate: 53,
      findings: 'Operators adapting to fabric weight'
    },
    buildUp: {
      day: '7',
      plannedPct: 60,
      achievedPct: 34,
      operators: 48,
      notes: 'Day 7 ramp up'
    },
    lineIE: {
      name: 'Anisur (Line Chief) / IE Lead',
      level: 'executive',
      period: 'daily'
    }
  },
  {
    id: 1708,
    date: DEBONAIR_SEPTEMBER_17_DATE,
    lineNo: '8',
    floor: 'Meghna Floor',
    apartment: 'Unit 2 - Meghna',
    isActive: true,
    buyer: 'OTCF',
    style: 'JAM 1144',
    smv: 43.15,
    plannedMP: 60,
    workingHours: 10.0,
    targetEff: 60,
    targetProd: 501,
    achievedProd: 360,
    efficiency: 43,
    remarks: 'Shortage: -141. Available: 36000m, Produce: 15534m. Line Chief: Sagor. Days Run: 11.',
    orderQty: 8000,
    dailyInput: 501,
    dailyOutput: 360,
    wip: 250,
    balancingGraph: 'day4',
    nextStyle: 'JAM 1144',
    nextStyleDate: '2026-09-27',
    mp: {
      Operator: { present: 48, absent: 0 },
      Helper: { present: 9, absent: 0 },
      'Iron Man': { present: 3, absent: 0 }
    },
    balanceMethod: 'Balancing Adjustments',
    balanceNotes: 'Day 11. Efficiency reached 43% (72% performance ratio).',
    top5: {
      held: 'yes',
      attendance: 97,
      items: ['Pocket flap stitch', 'Waistband join', 'Hourly targets'],
      notes: 'Line Chief Sagor leading steady progress.'
    },
    bottleneck: {
      station: 'Waistband attachment',
      cycleTime: 49.0,
      targetCT: 43.15,
      status: 'high',
      action: 'Folder gauge aligned',
      notes: 'Cycle time closing toward target'
    },
    timeStudy: {
      done: 'yes',
      type: 'time',
      observedRate: 36,
      standardRate: 50,
      findings: 'Smooth operation across body assembly'
    },
    buildUp: {
      day: '11',
      plannedPct: 60,
      achievedPct: 43,
      operators: 48,
      notes: 'Day 11 progression'
    },
    lineIE: {
      name: 'Sagor (Line Chief) / IE Lead',
      level: 'executive',
      period: 'daily'
    }
  },
  {
    id: 1709,
    date: DEBONAIR_SEPTEMBER_17_DATE,
    lineNo: '9',
    floor: 'Meghna Floor',
    apartment: 'Unit 2 - Meghna',
    isActive: true,
    buyer: 'BEST SELLER',
    style: 'ONS BOWIE SOFTSHELL BOMBER',
    smv: 26.96,
    plannedMP: 62,
    workingHours: 9.76,
    targetEff: 40,
    targetProd: 539,
    achievedProd: 360,
    efficiency: 27,
    remarks: 'Shortage: -179. Available: 36300m, Produce: 9706m. Line Chief: RUBEL. Days Run: 2. 67% Effi Perf on Day 2.',
    orderQty: 10000,
    dailyInput: 539,
    dailyOutput: 360,
    wip: 300,
    balancingGraph: 'day2',
    nextStyle: 'ONS BOWIE SOFTSHELL BOMBER',
    nextStyleDate: '2026-09-30',
    mp: {
      Operator: { present: 50, absent: 0 },
      Helper: { present: 9, absent: 0 },
      'Iron Man': { present: 3, absent: 0 }
    },
    balanceMethod: 'New Style Changeover',
    balanceNotes: 'Day 2 run with 40% initial target eff. 360 pcs achieved (67% of day-2 plan).',
    top5: {
      held: 'yes',
      attendance: 100,
      items: ['Softshell fabric feed tension', 'Bonded seam sealing', 'Day 2 curve check'],
      notes: 'Line Chief Rubel monitoring softshell feeding.'
    },
    bottleneck: {
      station: 'Softshell bonding & seam tape',
      cycleTime: 38.0,
      targetCT: 26.96,
      status: 'high',
      action: 'Guide clamp set',
      notes: 'New style learning curve'
    },
    timeStudy: {
      done: 'yes',
      type: 'time',
      observedRate: 37,
      standardRate: 55,
      findings: 'Operators adapting quickly to softshell fabric'
    },
    buildUp: {
      day: '2',
      plannedPct: 40,
      achievedPct: 27,
      operators: 50,
      notes: 'Day 2 build up'
    },
    lineIE: {
      name: 'RUBEL (Line Chief) / IE Lead',
      level: 'executive',
      period: 'daily'
    }
  },
  {
    id: 1710,
    date: DEBONAIR_SEPTEMBER_17_DATE,
    lineNo: '10',
    floor: 'Meghna Floor',
    apartment: 'Unit 2 - Meghna',
    isActive: true,
    buyer: 'H&M',
    style: 'QUINN LIGHT BOMBER JKT',
    smv: 28.49,
    plannedMP: 60,
    workingHours: 11.0,
    targetEff: 50,
    targetProd: 695,
    achievedProd: 550,
    efficiency: 40,
    remarks: 'Shortage: -145. Available: 39600m, Produce: 15670m. Line Chief: OMOL. Days Run: 3. 79% Effi Perf on Day 3.',
    orderQty: 14000,
    dailyInput: 695,
    dailyOutput: 550,
    wip: 280,
    balancingGraph: 'day3',
    nextStyle: 'QUINN LIGHT BOMBER JKT',
    nextStyleDate: '2026-10-02',
    mp: {
      Operator: { present: 48, absent: 0 },
      Helper: { present: 9, absent: 0 },
      'Iron Man': { present: 3, absent: 0 }
    },
    balanceMethod: 'Ramp-up Acceleration',
    balanceNotes: 'Day 3 run. Solid output of 550 pcs (79% of planned 50% target efficiency).',
    top5: {
      held: 'yes',
      attendance: 98,
      items: ['Rib waist join', 'Zipper length check', 'Day 3 target review'],
      notes: 'Line Chief Omol driving prompt bundle progression.'
    },
    bottleneck: {
      station: 'Rib cuff insertion',
      cycleTime: 35.0,
      targetCT: 28.49,
      status: 'high',
      action: 'Folder jig deployed',
      notes: 'Rapidly approaching target pitch'
    },
    timeStudy: {
      done: 'yes',
      type: 'both',
      observedRate: 50,
      standardRate: 63,
      findings: 'Pacing accelerating from morning'
    },
    buildUp: {
      day: '3',
      plannedPct: 50,
      achievedPct: 40,
      operators: 48,
      notes: 'Day 3 build up'
    },
    lineIE: {
      name: 'OMOL (Line Chief) / IE Lead',
      level: 'executive',
      period: 'daily'
    }
  },
  {
    id: 1711,
    date: DEBONAIR_SEPTEMBER_17_DATE,
    lineNo: '11',
    floor: 'Meghna Floor',
    apartment: 'Unit 2 - Meghna',
    isActive: true,
    buyer: 'H&M',
    style: 'DANNY MID PADDED JKT',
    smv: 46.76,
    plannedMP: 60,
    workingHours: 10.0,
    targetEff: 70,
    targetProd: 539,
    achievedProd: 570,
    efficiency: 74,
    remarks: 'Surplus: +31! Available: 36000m, Produce: 26653m. Line Chief: SOHEL. Days Run: 39. 106% EFFI PERF - TOP LINE!',
    orderQty: 20000,
    dailyInput: 539,
    dailyOutput: 570,
    wip: 140,
    balancingGraph: 'complete',
    nextStyle: 'DANNY MID PADDED JKT',
    nextStyleDate: '2026-10-12',
    mp: {
      Operator: { present: 48, absent: 0 },
      Helper: { present: 9, absent: 0 },
      'Iron Man': { present: 3, absent: 0 }
    },
    balanceMethod: 'Benchmark Line',
    balanceNotes: 'STAR PERFORMER: 570 pcs (+31 surplus pcs!), 74% eff, 106% performance index.',
    top5: {
      held: 'yes',
      attendance: 100,
      items: [
        'Celebrated surplus target milestone',
        'Padding stitch tension perfect',
        'Zero defect inspection',
        'Sustained 57 pcs/hr pace',
        'Clean work cell recognition'
      ],
      notes: 'Line Chief Sohel commended by floor management.'
    },
    bottleneck: {
      station: 'Collar hood attach',
      cycleTime: 45.0,
      targetCT: 46.76,
      status: 'ok',
      action: 'None required - line in peak balance',
      notes: 'Station beating standard takt'
    },
    timeStudy: {
      done: 'yes',
      type: 'both',
      observedRate: 57,
      standardRate: 54,
      findings: 'Operators operating above 100% rated pace'
    },
    buildUp: {
      day: '39',
      plannedPct: 70,
      achievedPct: 74,
      operators: 48,
      notes: 'Exceeded target efficiency'
    },
    lineIE: {
      name: 'SOHEL (Line Chief) / IE Lead',
      level: 'sr_executive',
      period: 'daily'
    }
  },
  {
    id: 1712,
    date: DEBONAIR_SEPTEMBER_17_DATE,
    lineNo: '12',
    floor: 'Meghna Floor',
    apartment: 'Unit 2 - Meghna',
    isActive: true,
    buyer: 'CLINTON',
    style: 'CB2703 8415',
    smv: 16.45,
    plannedMP: 58,
    workingHours: 10.0,
    targetEff: 60,
    targetProd: 1269,
    achievedProd: 400,
    efficiency: 19,
    remarks: 'Shortage: -869. Available: 34800m, Produce: 6580m. Line Chief: ANAMUL. Days Run: 4. Low SMV line.',
    orderQty: 18000,
    dailyInput: 1269,
    dailyOutput: 400,
    wip: 600,
    balancingGraph: 'day2',
    nextStyle: 'CB2703 8415',
    nextStyleDate: '2026-09-28',
    mp: {
      Operator: { present: 46, absent: 0 },
      Helper: { present: 9, absent: 0 },
      'Iron Man': { present: 3, absent: 0 }
    },
    balanceMethod: 'Pacing Recovery',
    balanceNotes: 'Day 4 run. Low SMV 16.45 requires high piece count. Output 400 against 1269 target.',
    top5: {
      held: 'yes',
      attendance: 96,
      items: ['Rapid bundle handling', 'Takt pace coaching', 'Short cycle balancing'],
      notes: 'Line Chief Anamul organizing rebalance for piece-rate pacing.'
    },
    bottleneck: {
      station: 'Fast side seam run',
      cycleTime: 28.0,
      targetCT: 16.45,
      status: 'critical',
      action: 'Split operation into 2 parallel stations',
      notes: 'Cycle time needs reduction by half'
    },
    timeStudy: {
      done: 'yes',
      type: 'time',
      observedRate: 40,
      standardRate: 127,
      findings: 'Operators unaccustomed to rapid short-cycle motions'
    },
    buildUp: {
      day: '4',
      plannedPct: 60,
      achievedPct: 19,
      operators: 46,
      notes: 'Day 4 ramp up'
    },
    lineIE: {
      name: 'ANAMUL (Line Chief) / IE Lead',
      level: 'executive',
      period: 'daily'
    }
  },

  // KARNOPHULI FLOOR (Lines 13 - 17)
  {
    id: 1713,
    date: DEBONAIR_SEPTEMBER_17_DATE,
    lineNo: '13',
    floor: 'Karnophuli Floor',
    apartment: 'Unit 2 - Karnophuli',
    isActive: true,
    buyer: 'C&A',
    style: '2264499 FUTURE SENSE JKT',
    smv: 30.97,
    plannedMP: 57,
    workingHours: 11.11,
    targetEff: 60,
    targetProd: 736,
    achievedProd: 430,
    efficiency: 35,
    remarks: 'Shortage: -306. Available: 37980m, Produce: 13317m. Line Chief: NEWAS ALAM. Days Run: 8.',
    orderQty: 12000,
    dailyInput: 736,
    dailyOutput: 430,
    wip: 350,
    balancingGraph: 'day3',
    nextStyle: '2264499 FUTURE SENSE JKT',
    nextStyleDate: '2026-09-29',
    mp: {
      Operator: { present: 45, absent: 0 },
      Helper: { present: 9, absent: 0 },
      'Iron Man': { present: 3, absent: 0 }
    },
    balanceMethod: 'Overtime Balance',
    balanceNotes: 'Day 8 running with 11.11 WH. Produced 430 pcs (35% eff / 58% performance ratio).',
    top5: {
      held: 'yes',
      attendance: 98,
      items: ['Collar binding', 'Lining attach', '11h shift fatigue management'],
      notes: 'Line Chief Newas Alam adjusting mid-line WIP buffers.'
    },
    bottleneck: {
      station: 'Sleeve cuff elastic insertion',
      cycleTime: 42.0,
      targetCT: 30.97,
      status: 'high',
      action: 'Elastic pre-cut helper added',
      notes: 'Addressing feeding delays'
    },
    timeStudy: {
      done: 'yes',
      type: 'time',
      observedRate: 39,
      standardRate: 66,
      findings: 'Handling improvements identified'
    },
    buildUp: {
      day: '8',
      plannedPct: 60,
      achievedPct: 35,
      operators: 45,
      notes: 'Day 8 build up'
    },
    lineIE: {
      name: 'NEWAS ALAM (Line Chief) / IE Lead',
      level: 'executive',
      period: 'daily'
    }
  },
  {
    id: 1714,
    date: DEBONAIR_SEPTEMBER_17_DATE,
    lineNo: '14',
    floor: 'Karnophuli Floor',
    apartment: 'Unit 2 - Karnophuli',
    isActive: true,
    buyer: 'OTCF',
    style: 'JAF 1147',
    smv: 43.65,
    plannedMP: 58,
    workingHours: 10.07,
    targetEff: 60,
    targetProd: 482,
    achievedProd: 330,
    efficiency: 41,
    remarks: 'Shortage: -152. Available: 35040m, Produce: 14405m. Line Chief: SHOHAG MIA. Days Run: 9.',
    orderQty: 9000,
    dailyInput: 482,
    dailyOutput: 330,
    wip: 240,
    balancingGraph: 'day3',
    nextStyle: 'JAF 1147',
    nextStyleDate: '2026-09-28',
    mp: {
      Operator: { present: 46, absent: 0 },
      Helper: { present: 9, absent: 0 },
      'Iron Man': { present: 3, absent: 0 }
    },
    balanceMethod: 'Ramp-Up Support',
    balanceNotes: 'Day 9 running. 330 pcs produced at 41% efficiency (69% performance index).',
    top5: {
      held: 'yes',
      attendance: 98,
      items: ['Shoulder reinforcement tape', 'Pocket welt accuracy', 'Pacing targets'],
      notes: 'Line Chief Shohag Mia tracking hourly counts.'
    },
    bottleneck: {
      station: 'Front zipper insert',
      cycleTime: 51.0,
      targetCT: 43.65,
      status: 'high',
      action: 'Align zipper guide foot',
      notes: 'Closing in on standard'
    },
    timeStudy: {
      done: 'yes',
      type: 'time',
      observedRate: 33,
      standardRate: 48,
      findings: 'Steady progression'
    },
    buildUp: {
      day: '9',
      plannedPct: 60,
      achievedPct: 41,
      operators: 46,
      notes: 'Day 9 build up'
    },
    lineIE: {
      name: 'SHOHAG MIA (Line Chief) / IE Lead',
      level: 'executive',
      period: 'daily'
    }
  },
  {
    id: 1715,
    date: DEBONAIR_SEPTEMBER_17_DATE,
    lineNo: '15',
    floor: 'Karnophuli Floor',
    apartment: 'Unit 2 - Karnophuli',
    isActive: true,
    buyer: 'BEST SELLER',
    style: 'LANDO LIFE BOMBER',
    smv: 35.75,
    plannedMP: 60,
    workingHours: 10.03,
    targetEff: 60,
    targetProd: 606,
    achievedProd: 600,
    efficiency: 59,
    remarks: 'Shortage: -6 only! Available: 36120m, Produce: 21450m. Line Chief: SOHIDUL. Days Run: 17. 99% Effi Perf!',
    orderQty: 15000,
    dailyInput: 606,
    dailyOutput: 600,
    wip: 120,
    balancingGraph: 'complete',
    nextStyle: 'LANDO LIFE BOMBER',
    nextStyleDate: '2026-10-08',
    mp: {
      Operator: { present: 48, absent: 0 },
      Helper: { present: 9, absent: 0 },
      'Iron Man': { present: 3, absent: 0 }
    },
    balanceMethod: 'Synchronized Pitch',
    balanceNotes: 'OUTSTANDING PERFORMANCE: 600 pcs vs 606 target (99% target fulfillment, 59% eff).',
    top5: {
      held: 'yes',
      attendance: 100,
      items: [
        'Maintained 60 pcs/hour rhythm',
        'Bomber collar ribbed join precision',
        'Zero quality rejections reported',
        'Clean line workspace',
        'Worker engagement commendation'
      ],
      notes: 'Line Chief Sohidul commended for smooth flow.'
    },
    bottleneck: {
      station: 'Bomber collar rib stitch',
      cycleTime: 36.0,
      targetCT: 35.75,
      status: 'ok',
      action: 'None - line running in harmony',
      notes: 'Near perfect takt matching'
    },
    timeStudy: {
      done: 'yes',
      type: 'both',
      observedRate: 60,
      standardRate: 60,
      findings: 'Operator motion efficiency 99.1%'
    },
    buildUp: {
      day: '17',
      plannedPct: 60,
      achievedPct: 59,
      operators: 48,
      notes: 'Peak line stability'
    },
    lineIE: {
      name: 'SOHIDUL (Line Chief) / IE Lead',
      level: 'sr_executive',
      period: 'daily'
    }
  },
  {
    id: 1716,
    date: DEBONAIR_SEPTEMBER_17_DATE,
    lineNo: '16',
    floor: 'Karnophuli Floor',
    apartment: 'Unit 2 - Karnophuli',
    isActive: true,
    buyer: 'C&A',
    style: '2268995 BASIC PADDED BOMBER',
    smv: 40.47,
    plannedMP: 59,
    workingHours: 10.03,
    targetEff: 60,
    targetProd: 527,
    achievedProd: 420,
    efficiency: 48,
    remarks: 'Shortage: -107. Available: 35520m, Produce: 16997m. Line Chief: PABEL. Days Run: 26. 80% Effi Perf.',
    orderQty: 16000,
    dailyInput: 527,
    dailyOutput: 420,
    wip: 220,
    balancingGraph: 'day4',
    nextStyle: '2268995 BASIC PADDED BOMBER',
    nextStyleDate: '2026-10-05',
    mp: {
      Operator: { present: 47, absent: 0 },
      Helper: { present: 9, absent: 0 },
      'Iron Man': { present: 3, absent: 0 }
    },
    balanceMethod: 'Balanced Line Pacing',
    balanceNotes: 'Day 26. 420 pcs produced (48% eff / 80% efficiency performance ratio).',
    top5: {
      held: 'yes',
      attendance: 98,
      items: ['Padding stitch density', 'Sleeve insertion smoothness', 'Target alignment'],
      notes: 'Line Chief Pabel focusing on late-afternoon pacing.'
    },
    bottleneck: {
      station: 'Sleeve insertion',
      cycleTime: 44.0,
      targetCT: 40.47,
      status: 'high',
      action: 'Adjust differential feed',
      notes: 'Pacing stable'
    },
    timeStudy: {
      done: 'yes',
      type: 'time',
      observedRate: 42,
      standardRate: 53,
      findings: 'Smooth line flow'
    },
    buildUp: {
      day: '26',
      plannedPct: 60,
      achievedPct: 48,
      operators: 47,
      notes: 'Day 26 progression'
    },
    lineIE: {
      name: 'PABEL (Line Chief) / IE Lead',
      level: 'executive',
      period: 'daily'
    }
  },
  {
    id: 1717,
    date: DEBONAIR_SEPTEMBER_17_DATE,
    lineNo: '17',
    floor: 'Karnophuli Floor',
    apartment: 'Unit 2 - Karnophuli',
    isActive: true,
    buyer: 'OTCF',
    style: 'JAF 1156',
    smv: 45.20,
    plannedMP: 58,
    workingHours: 10.0,
    targetEff: 60,
    targetProd: 462,
    achievedProd: 310,
    efficiency: 40,
    remarks: 'Shortage: -152. Available: 34800m, Produce: 14012m. Line Chief: EMON. Days Run: 10.',
    orderQty: 8000,
    dailyInput: 462,
    dailyOutput: 310,
    wip: 250,
    balancingGraph: 'day3',
    nextStyle: 'JAF 1156',
    nextStyleDate: '2026-09-27',
    mp: {
      Operator: { present: 46, absent: 0 },
      Helper: { present: 9, absent: 0 },
      'Iron Man': { present: 3, absent: 0 }
    },
    balanceMethod: 'Line Rebalancing',
    balanceNotes: 'Day 10 run. 310 pcs produced at 40% eff (67% performance ratio).',
    top5: {
      held: 'yes',
      attendance: 98,
      items: ['Collar attachment test', 'Front zipper feed', 'Shift target'],
      notes: 'Line Chief Emon keeping bundle flow steady.'
    },
    bottleneck: {
      station: 'Collar attachment',
      cycleTime: 52.0,
      targetCT: 45.2,
      status: 'high',
      action: 'Deploy folder attachment',
      notes: 'Cycle time approaching standard'
    },
    timeStudy: {
      done: 'yes',
      type: 'time',
      observedRate: 31,
      standardRate: 46,
      findings: 'Consistent assembly tempo'
    },
    buildUp: {
      day: '10',
      plannedPct: 60,
      achievedPct: 40,
      operators: 46,
      notes: 'Day 10 build up'
    },
    lineIE: {
      name: 'EMON (Line Chief) / IE Lead',
      level: 'executive',
      period: 'daily'
    }
  },

  // KOROTOYA FLOOR (Lines 18 - 23)
  {
    id: 1718,
    date: DEBONAIR_SEPTEMBER_17_DATE,
    lineNo: '18',
    floor: 'Korotoya Floor',
    apartment: 'Unit 2 - Korotoya',
    isActive: true,
    buyer: 'OTCF',
    style: 'JAM 433',
    smv: 42.03,
    plannedMP: 63,
    workingHours: 10.0,
    targetEff: 60,
    targetProd: 540,
    achievedProd: 350,
    efficiency: 39,
    remarks: 'Shortage: -190. Available: 37800m, Produce: 14711m. Line Chief: BABU. Days Run: 25. 65% Effi Perf.',
    orderQty: 10000,
    dailyInput: 540,
    dailyOutput: 350,
    wip: 280,
    balancingGraph: 'day4',
    nextStyle: 'JAM 433',
    nextStyleDate: '2026-10-01',
    mp: {
      Operator: { present: 50, absent: 0 },
      Helper: { present: 10, absent: 0 },
      'Iron Man': { present: 3, absent: 0 }
    },
    balanceMethod: 'Bottleneck Management',
    balanceNotes: 'Day 25. 350 pcs output at 39% eff against 60% planned target.',
    top5: {
      held: 'yes',
      attendance: 98,
      items: ['Collar band join', 'Hem topstitch', 'Hourly tally checks', 'Thread tension', 'Bundle tracking'],
      notes: 'Line Chief Babu coordinating with floor mechanics.'
    },
    bottleneck: {
      station: 'Collar band join',
      cycleTime: 50.0,
      targetCT: 42.03,
      status: 'high',
      action: 'Assign second operator for collar trim',
      notes: 'Reducing bundle wait time'
    },
    timeStudy: {
      done: 'yes',
      type: 'both',
      observedRate: 35,
      standardRate: 54,
      findings: 'Pacing stable with occasional bundle wait'
    },
    buildUp: {
      day: '25',
      plannedPct: 60,
      achievedPct: 39,
      operators: 50,
      notes: 'Day 25 performance'
    },
    lineIE: {
      name: 'BABU (Line Chief) / IE Lead',
      level: 'executive',
      period: 'daily'
    }
  },
  {
    id: 1719,
    date: DEBONAIR_SEPTEMBER_17_DATE,
    lineNo: '19',
    floor: 'Korotoya Floor',
    apartment: 'Unit 2 - Korotoya',
    isActive: true,
    buyer: 'C&A',
    style: '2264857 TG 30274306',
    smv: 31.45,
    plannedMP: 63,
    workingHours: 10.0,
    targetEff: 60,
    targetProd: 721,
    achievedProd: 200,
    efficiency: 17,
    remarks: 'Shortage: -521. Available: 37800m, Produce: 6290m. Line Chief: ROBIUL. Days Run: 7.',
    orderQty: 11000,
    dailyInput: 721,
    dailyOutput: 200,
    wip: 520,
    balancingGraph: 'day3',
    nextStyle: '2264857 TG 30274306',
    nextStyleDate: '2026-09-28',
    mp: {
      Operator: { present: 50, absent: 0 },
      Helper: { present: 10, absent: 0 },
      'Iron Man': { present: 3, absent: 0 }
    },
    balanceMethod: 'Line Rebalancing',
    balanceNotes: 'Day 7 ramp up. 200 pcs produced; bottleneck identified in pocket welt stitch.',
    top5: {
      held: 'yes',
      attendance: 97,
      items: ['Pocket welt template', 'Line pacing instruction', 'Hourly target monitoring'],
      notes: 'Line Chief Robiul working with IE on template guide.'
    },
    bottleneck: {
      station: 'Pocket welt stitch',
      cycleTime: 52.0,
      targetCT: 31.45,
      status: 'critical',
      action: 'Provide acrylic folding template',
      notes: 'Key friction point in flow'
    },
    timeStudy: {
      done: 'yes',
      type: 'time',
      observedRate: 20,
      standardRate: 72,
      findings: 'Severe manual folding delay'
    },
    buildUp: {
      day: '7',
      plannedPct: 60,
      achievedPct: 17,
      operators: 50,
      notes: 'Day 7 ramp up'
    },
    lineIE: {
      name: 'ROBIUL (Line Chief) / IE Lead',
      level: 'executive',
      period: 'daily'
    }
  },
  {
    id: 1720,
    date: DEBONAIR_SEPTEMBER_17_DATE,
    lineNo: '20',
    floor: 'Korotoya Floor',
    apartment: 'Unit 2 - Korotoya',
    isActive: true,
    buyer: 'C&A',
    style: '2268450 TB30274205 B',
    smv: 32.35,
    plannedMP: 61,
    workingHours: 9.18,
    targetEff: 60,
    targetProd: 623,
    achievedProd: 280,
    efficiency: 27,
    remarks: 'Shortage: -343. Available: 33600m, Produce: 9058m. Line Chief: SAIDUR. Days Run: 4.',
    orderQty: 9500,
    dailyInput: 623,
    dailyOutput: 280,
    wip: 380,
    balancingGraph: 'day2',
    nextStyle: '2268450 TB30274205 B',
    nextStyleDate: '2026-09-26',
    mp: {
      Operator: { present: 48, absent: 0 },
      Helper: { present: 10, absent: 0 },
      'Iron Man': { present: 3, absent: 0 }
    },
    balanceMethod: 'New Style Ramp-Up',
    balanceNotes: 'Day 4. Produced 280 pcs with 9.18 WH (27% eff / 45% eff performance).',
    top5: {
      held: 'yes',
      attendance: 98,
      items: ['Front placket fold', 'Buttonhole alignment', 'Shift pacing'],
      notes: 'Line Chief Saidur overseeing day 4 progression.'
    },
    bottleneck: {
      station: 'Placket topstitch',
      cycleTime: 44.0,
      targetCT: 32.35,
      status: 'high',
      action: 'Install edge guide folder',
      notes: 'Improving cycle rate'
    },
    timeStudy: {
      done: 'yes',
      type: 'time',
      observedRate: 30,
      standardRate: 68,
      findings: 'Operators learning style nuances'
    },
    buildUp: {
      day: '4',
      plannedPct: 60,
      achievedPct: 27,
      operators: 48,
      notes: 'Day 4 ramp up'
    },
    lineIE: {
      name: 'SAIDUR (Line Chief) / IE Lead',
      level: 'executive',
      period: 'daily'
    }
  },
  {
    id: 1721,
    date: DEBONAIR_SEPTEMBER_17_DATE,
    lineNo: '21',
    floor: 'Korotoya Floor',
    apartment: 'Unit 2 - Korotoya',
    isActive: true,
    buyer: 'C&A',
    style: '2268450 TB30274205 B',
    smv: 32.35,
    plannedMP: 61,
    workingHours: 9.02,
    targetEff: 60,
    targetProd: 612,
    achievedProd: 230,
    efficiency: 23,
    remarks: 'Shortage: -382. Available: 33000m, Produce: 7441m. Line Chief: ARIFUL ISLAM. Days Run: 4.',
    orderQty: 9000,
    dailyInput: 612,
    dailyOutput: 230,
    wip: 400,
    balancingGraph: 'day2',
    nextStyle: '2268450 TB30274205 B',
    nextStyleDate: '2026-09-26',
    mp: {
      Operator: { present: 48, absent: 0 },
      Helper: { present: 10, absent: 0 },
      'Iron Man': { present: 3, absent: 0 }
    },
    balanceMethod: 'New Style Ramp-Up',
    balanceNotes: 'Day 4 on TB30274205 B. Produced 230 pcs with 9.02 WH (23% eff).',
    top5: {
      held: 'yes',
      attendance: 98,
      items: ['Collar point symmetry', 'Twin needle bottom hem', 'Bundle flow'],
      notes: 'Line Chief Ariful Islam accelerating station training.'
    },
    bottleneck: {
      station: 'Bottom hem twin needle',
      cycleTime: 46.0,
      targetCT: 32.35,
      status: 'high',
      action: 'Use calibrated hem folder',
      notes: 'Eliminating wavy stitching'
    },
    timeStudy: {
      done: 'yes',
      type: 'time',
      observedRate: 25,
      standardRate: 68,
      findings: 'Operators building speed'
    },
    buildUp: {
      day: '4',
      plannedPct: 60,
      achievedPct: 23,
      operators: 48,
      notes: 'Day 4 ramp up'
    },
    lineIE: {
      name: 'ARIFUL ISLAM (Line Chief) / IE Lead',
      level: 'executive',
      period: 'daily'
    }
  },
  {
    id: 1722,
    date: DEBONAIR_SEPTEMBER_17_DATE,
    lineNo: '22',
    floor: 'Korotoya Floor',
    apartment: 'Unit 2 - Korotoya',
    isActive: true,
    buyer: 'C&A',
    style: '2264499 FUTURE SENSE JKT',
    smv: 30.97,
    plannedMP: 57,
    workingHours: 10.98,
    targetEff: 60,
    targetProd: 728,
    achievedProd: 430,
    efficiency: 35,
    remarks: 'Shortage: -298. Available: 37560m, Produce: 13317m. Line Chief: SHAKIL. Days Run: 16. 59% Effi Perf.',
    orderQty: 13000,
    dailyInput: 728,
    dailyOutput: 430,
    wip: 290,
    balancingGraph: 'day4',
    nextStyle: '2264499 FUTURE SENSE JKT',
    nextStyleDate: '2026-10-02',
    mp: {
      Operator: { present: 45, absent: 0 },
      Helper: { present: 9, absent: 0 },
      'Iron Man': { present: 3, absent: 0 }
    },
    balanceMethod: 'Overtime Balance',
    balanceNotes: 'Day 16 run. 430 pcs produced with 10.98 WH (35% eff / 59% performance).',
    top5: {
      held: 'yes',
      attendance: 98,
      items: ['Sleeve attach', 'Lining join', 'Overtime shift target', 'WIP buffer'],
      notes: 'Line Chief Shakil driving steady afternoon throughput.'
    },
    bottleneck: {
      station: 'Sleeve attach to body',
      cycleTime: 39.0,
      targetCT: 30.97,
      status: 'high',
      action: 'Fine tune armhole notches',
      notes: 'Matching pieces accurately'
    },
    timeStudy: {
      done: 'yes',
      type: 'time',
      observedRate: 39,
      standardRate: 66,
      findings: 'Steady output pace'
    },
    buildUp: {
      day: '16',
      plannedPct: 60,
      achievedPct: 35,
      operators: 45,
      notes: 'Day 16 performance'
    },
    lineIE: {
      name: 'SHAKIL (Line Chief) / IE Lead',
      level: 'executive',
      period: 'daily'
    }
  },
  {
    id: 1723,
    date: DEBONAIR_SEPTEMBER_17_DATE,
    lineNo: '23',
    floor: 'Korotoya Floor',
    apartment: 'Unit 2 - Korotoya',
    isActive: true,
    buyer: 'C&A',
    style: '2264854 TG 15244303',
    smv: 28.45,
    plannedMP: 55,
    workingHours: 9.82,
    targetEff: 60,
    targetProd: 683,
    achievedProd: 395,
    efficiency: 35,
    remarks: 'Shortage: -288. Available: 32400m, Produce: 11238m. Line Chief: SAMIM. Days Run: 6. 58% Effi Perf.',
    orderQty: 10500,
    dailyInput: 683,
    dailyOutput: 395,
    wip: 300,
    balancingGraph: 'day3',
    nextStyle: '2264854 TG 15244303',
    nextStyleDate: '2026-09-29',
    mp: {
      Operator: { present: 43, absent: 0 },
      Helper: { present: 9, absent: 0 },
      'Iron Man': { present: 3, absent: 0 }
    },
    balanceMethod: 'Line Ramp-Up',
    balanceNotes: 'Day 6. 395 pcs produced (35% eff / 58% performance index).',
    top5: {
      held: 'yes',
      attendance: 98,
      items: ['Collar stand fold', 'Cuff attachment', 'Day 6 ramp targets'],
      notes: 'Line Chief Samim monitoring station cycle times.'
    },
    bottleneck: {
      station: 'Collar stand topstitch',
      cycleTime: 36.0,
      targetCT: 28.45,
      status: 'high',
      action: 'Use compensative foot',
      notes: 'Improves stitching speed'
    },
    timeStudy: {
      done: 'yes',
      type: 'time',
      observedRate: 40,
      standardRate: 70,
      findings: 'Smooth line progression'
    },
    buildUp: {
      day: '6',
      plannedPct: 60,
      achievedPct: 35,
      operators: 43,
      notes: 'Day 6 ramp up'
    },
    lineIE: {
      name: 'SAMIM (Line Chief) / IE Lead',
      level: 'executive',
      period: 'daily'
    }
  },

  // SHITALOKSHYA FLOOR (Lines 24 - 29)
  {
    id: 1724,
    date: DEBONAIR_SEPTEMBER_17_DATE,
    lineNo: '24',
    floor: 'Shitalokshya Floor',
    apartment: 'Unit 2 - Shitalokshya',
    isActive: true,
    buyer: 'C&A',
    style: '2264855 TG 15274304',
    smv: 32.09,
    plannedMP: 59,
    workingHours: 9.97,
    targetEff: 60,
    targetProd: 660,
    achievedProd: 355,
    efficiency: 32,
    remarks: 'Shortage: -305. Available: 35280m, Produce: 11392m. Line Chief: Nur Alam. Days Run: 8. 54% Effi Perf.',
    orderQty: 11000,
    dailyInput: 660,
    dailyOutput: 355,
    wip: 310,
    balancingGraph: 'day3',
    nextStyle: '2264855 TG 15274304',
    nextStyleDate: '2026-09-30',
    mp: {
      Operator: { present: 47, absent: 0 },
      Helper: { present: 9, absent: 0 },
      'Iron Man': { present: 3, absent: 0 }
    },
    balanceMethod: 'Line Ramp-Up',
    balanceNotes: 'Day 8 running. 355 pcs produced at 32% efficiency (54% performance index).',
    top5: {
      held: 'yes',
      attendance: 98,
      items: ['Collar notch match', 'Side seam overlock', 'Bundle control'],
      notes: 'Line Chief Nur Alam directing bundle distribution.'
    },
    bottleneck: {
      station: 'Side seam overlock run',
      cycleTime: 41.0,
      targetCT: 32.09,
      status: 'high',
      action: 'Check differential feed tension',
      notes: 'Smooth fabric feeding'
    },
    timeStudy: {
      done: 'yes',
      type: 'time',
      observedRate: 35,
      standardRate: 66,
      findings: 'Pacing accelerating steadily'
    },
    buildUp: {
      day: '8',
      plannedPct: 60,
      achievedPct: 32,
      operators: 47,
      notes: 'Day 8 progression'
    },
    lineIE: {
      name: 'Nur Alam (Line Chief) / IE Lead',
      level: 'executive',
      period: 'daily'
    }
  },
  {
    id: 1725,
    date: DEBONAIR_SEPTEMBER_17_DATE,
    lineNo: '25',
    floor: 'Shitalokshya Floor',
    apartment: 'Unit 2 - Shitalokshya',
    isActive: true,
    buyer: 'C&A',
    style: '2264499 FUTURE SENSE JKT',
    smv: 30.97,
    plannedMP: 58,
    workingHours: 10.95,
    targetEff: 60,
    targetProd: 738,
    achievedProd: 208,
    efficiency: 17,
    remarks: 'Shortage: -530. Available: 38100m, Produce: 6442m. Line Chief: JAFOR. Days Run: 8.',
    orderQty: 12000,
    dailyInput: 738,
    dailyOutput: 208,
    wip: 530,
    balancingGraph: 'day3',
    nextStyle: '2264499 FUTURE SENSE JKT',
    nextStyleDate: '2026-09-29',
    mp: {
      Operator: { present: 46, absent: 0 },
      Helper: { present: 9, absent: 0 },
      'Iron Man': { present: 3, absent: 0 }
    },
    balanceMethod: 'Line Rebalancing',
    balanceNotes: 'Day 8. 208 pcs produced; zipper attachment bottleneck observed.',
    top5: {
      held: 'yes',
      attendance: 98,
      items: ['Zipper insert training', 'Hourly count visibility', 'Floater allocation'],
      notes: 'Line Chief Jafor requesting senior floater assistance.'
    },
    bottleneck: {
      station: 'Front zipper attachment',
      cycleTime: 55.0,
      targetCT: 30.97,
      status: 'critical',
      action: 'Deploy senior operator floater',
      notes: 'Major line bottleneck'
    },
    timeStudy: {
      done: 'yes',
      type: 'time',
      observedRate: 19,
      standardRate: 67,
      findings: 'Operators need method coaching'
    },
    buildUp: {
      day: '8',
      plannedPct: 60,
      achievedPct: 17,
      operators: 46,
      notes: 'Day 8 build up'
    },
    lineIE: {
      name: 'JAFOR (Line Chief) / IE Lead',
      level: 'executive',
      period: 'daily'
    }
  },
  {
    id: 1726,
    date: DEBONAIR_SEPTEMBER_17_DATE,
    lineNo: '26',
    floor: 'Shitalokshya Floor',
    apartment: 'Unit 2 - Shitalokshya',
    isActive: true,
    buyer: 'C&A',
    style: '2264857 TG 30274306',
    smv: 31.45,
    plannedMP: 58,
    workingHours: 9.97,
    targetEff: 60,
    targetProd: 662,
    achievedProd: 248,
    efficiency: 22,
    remarks: 'Shortage: -414. Available: 34680m, Produce: 7800m. Line Chief: BADOL. Days Run: 6.',
    orderQty: 10000,
    dailyInput: 662,
    dailyOutput: 248,
    wip: 420,
    balancingGraph: 'day3',
    nextStyle: '2264857 TG 30274306',
    nextStyleDate: '2026-09-28',
    mp: {
      Operator: { present: 46, absent: 0 },
      Helper: { present: 9, absent: 0 },
      'Iron Man': { present: 3, absent: 0 }
    },
    balanceMethod: 'Line Ramp-Up',
    balanceNotes: 'Day 6. 248 pcs produced (22% eff / 37% performance ratio).',
    top5: {
      held: 'yes',
      attendance: 98,
      items: ['Pocket flap attachment', 'Line rebalance check', 'Bundle flow control'],
      notes: 'Line Chief Badol focusing on pocket flap accuracy.'
    },
    bottleneck: {
      station: 'Pocket flap stitch',
      cycleTime: 46.0,
      targetCT: 31.45,
      status: 'high',
      action: 'Install gauge foot',
      notes: 'Steadily improving'
    },
    timeStudy: {
      done: 'yes',
      type: 'time',
      observedRate: 25,
      standardRate: 66,
      findings: 'Handling rhythm improving'
    },
    buildUp: {
      day: '6',
      plannedPct: 60,
      achievedPct: 22,
      operators: 46,
      notes: 'Day 6 ramp up'
    },
    lineIE: {
      name: 'BADOL (Line Chief) / IE Lead',
      level: 'executive',
      period: 'daily'
    }
  },
  {
    id: 1727,
    date: DEBONAIR_SEPTEMBER_17_DATE,
    lineNo: '27',
    floor: 'Shitalokshya Floor',
    apartment: 'Unit 2 - Shitalokshya',
    isActive: true,
    buyer: 'C&A',
    style: '2264499 FUTURE SENSE JKT',
    smv: 30.97,
    plannedMP: 58,
    workingHours: 11.91,
    targetEff: 60,
    targetProd: 803,
    achievedProd: 275,
    efficiency: 21,
    remarks: 'Shortage: -528. Available: 41460m, Produce: 8517m. Line Chief: NAHIDUL. Days Run: 14.',
    orderQty: 14000,
    dailyInput: 803,
    dailyOutput: 275,
    wip: 520,
    balancingGraph: 'day3',
    nextStyle: '2264499 FUTURE SENSE JKT',
    nextStyleDate: '2026-10-02',
    mp: {
      Operator: { present: 46, absent: 0 },
      Helper: { present: 9, absent: 0 },
      'Iron Man': { present: 3, absent: 0 }
    },
    balanceMethod: 'Overtime Shift',
    balanceNotes: 'Day 14. 11.91 working hours. 275 pcs produced (21% eff / 34% performance ratio).',
    top5: {
      held: 'yes',
      attendance: 98,
      items: ['Long shift fatigue rotation', 'Cuff join test', 'Hourly pacing board'],
      notes: 'Line Chief Nahidul managing long-shift operator rotation.'
    },
    bottleneck: {
      station: 'Cuff rib elastic join',
      cycleTime: 47.0,
      targetCT: 30.97,
      status: 'high',
      action: 'Pre-stitch elastic rings',
      notes: 'Simplifies main assembly'
    },
    timeStudy: {
      done: 'yes',
      type: 'time',
      observedRate: 23,
      standardRate: 67,
      findings: 'Operators fatigued in late shift'
    },
    buildUp: {
      day: '14',
      plannedPct: 60,
      achievedPct: 21,
      operators: 46,
      notes: 'Day 14 performance'
    },
    lineIE: {
      name: 'NAHIDUL (Line Chief) / IE Lead',
      level: 'executive',
      period: 'daily'
    }
  },
  {
    id: 1728,
    date: DEBONAIR_SEPTEMBER_17_DATE,
    lineNo: '28',
    floor: 'Shitalokshya Floor',
    apartment: 'Unit 2 - Shitalokshya',
    isActive: true,
    buyer: 'C&A',
    style: '2264857 TG 30274306',
    smv: 31.45,
    plannedMP: 58,
    workingHours: 9.97,
    targetEff: 60,
    targetProd: 662,
    achievedProd: 290,
    efficiency: 26,
    remarks: 'Shortage: -372. Available: 34680m, Produce: 9121m. Line Chief: Kabir. Days Run: 6. 44% Effi Perf.',
    orderQty: 10000,
    dailyInput: 662,
    dailyOutput: 290,
    wip: 380,
    balancingGraph: 'day3',
    nextStyle: '2264857 TG 30274306',
    nextStyleDate: '2026-09-28',
    mp: {
      Operator: { present: 46, absent: 0 },
      Helper: { present: 9, absent: 0 },
      'Iron Man': { present: 3, absent: 0 }
    },
    balanceMethod: 'Line Ramp-Up',
    balanceNotes: 'Day 6. 290 pcs produced (26% eff / 44% performance ratio).',
    top5: {
      held: 'yes',
      attendance: 98,
      items: ['Front placket seam', 'Side pocket positioning', 'Line balance targets'],
      notes: 'Line Chief Kabir tracking station tempos.'
    },
    bottleneck: {
      station: 'Front placket seam',
      cycleTime: 44.0,
      targetCT: 31.45,
      status: 'high',
      action: 'Use seam guide attachment',
      notes: 'Steadily improving'
    },
    timeStudy: {
      done: 'yes',
      type: 'time',
      observedRate: 29,
      standardRate: 66,
      findings: 'Smooth line flow'
    },
    buildUp: {
      day: '6',
      plannedPct: 60,
      achievedPct: 26,
      operators: 46,
      notes: 'Day 6 ramp up'
    },
    lineIE: {
      name: 'Kabir (Line Chief) / IE Lead',
      level: 'executive',
      period: 'daily'
    }
  },
  {
    id: 1729,
    date: DEBONAIR_SEPTEMBER_17_DATE,
    lineNo: '29',
    floor: 'Shitalokshya Floor',
    apartment: 'Unit 2 - Shitalokshya',
    isActive: true,
    buyer: 'C&A',
    style: '2264499 FUTURE SENSE JKT',
    smv: 30.97,
    plannedMP: 57,
    workingHours: 10.58,
    targetEff: 60,
    targetProd: 701,
    achievedProd: 200,
    efficiency: 17,
    remarks: 'Shortage: -501. Available: 36180m, Produce: 6194m. Line Chief: SAMIM. Days Run: 15.',
    orderQty: 12000,
    dailyInput: 701,
    dailyOutput: 200,
    wip: 500,
    balancingGraph: 'day3',
    nextStyle: '2264499 FUTURE SENSE JKT',
    nextStyleDate: '2026-10-01',
    mp: {
      Operator: { present: 45, absent: 0 },
      Helper: { present: 9, absent: 0 },
      'Iron Man': { present: 3, absent: 0 }
    },
    balanceMethod: 'Line Rebalancing',
    balanceNotes: 'Day 15. 200 pcs produced at 17% eff. Rebalancing needed across collar and pocket.',
    top5: {
      held: 'yes',
      attendance: 98,
      items: ['Collar join accuracy', 'Pocket zipper feed', 'Floor pacing action plan'],
      notes: 'Line Chief Samim reallocating helper support.'
    },
    bottleneck: {
      station: 'Collar join to body',
      cycleTime: 54.0,
      targetCT: 30.97,
      status: 'critical',
      action: 'Assign second operator for collar trim',
      notes: 'Needs immediate rebalance'
    },
    timeStudy: {
      done: 'yes',
      type: 'time',
      observedRate: 19,
      standardRate: 66,
      findings: 'Bundle buildup at station 12'
    },
    buildUp: {
      day: '15',
      plannedPct: 60,
      achievedPct: 17,
      operators: 45,
      notes: 'Day 15 performance'
    },
    lineIE: {
      name: 'SAMIM (Line Chief) / IE Lead',
      level: 'executive',
      period: 'daily'
    }
  },

  // TURAG FLOOR (Lines 30 - 34)
  {
    id: 1730,
    date: DEBONAIR_SEPTEMBER_17_DATE,
    lineNo: '30',
    floor: 'Turag Floor',
    apartment: 'Unit 2 - Turag',
    isActive: true,
    buyer: 'OTCF',
    style: 'JAM 1151',
    smv: 50.97,
    plannedMP: 61,
    workingHours: 9.26,
    targetEff: 60,
    targetProd: 399,
    achievedProd: 266,
    efficiency: 40,
    remarks: 'Shortage: -133. Available: 33900m, Produce: 13558m. Line Chief: ASHRAFUL. Days Run: 19. 67% Effi Perf.',
    orderQty: 8000,
    dailyInput: 399,
    dailyOutput: 266,
    wip: 200,
    balancingGraph: 'day4',
    nextStyle: 'JAM 1151',
    nextStyleDate: '2026-10-04',
    mp: {
      Operator: { present: 48, absent: 0 },
      Helper: { present: 10, absent: 0 },
      'Iron Man': { present: 3, absent: 0 }
    },
    balanceMethod: 'Balanced Flow',
    balanceNotes: 'Day 19. High SMV 50.97 style. 266 pcs produced (40% eff / 67% performance ratio).',
    top5: {
      held: 'yes',
      attendance: 98,
      items: ['Heavy jacket quilt alignment', 'Collar insert', 'Hourly target checks'],
      notes: 'Line Chief Ashraful managing heavy jacket assembly.'
    },
    bottleneck: {
      station: 'Padded collar insertion',
      cycleTime: 58.0,
      targetCT: 50.97,
      status: 'high',
      action: 'Pre-trim seam allowance',
      notes: 'Helps operator feed smoothly'
    },
    timeStudy: {
      done: 'yes',
      type: 'both',
      observedRate: 29,
      standardRate: 43,
      findings: 'Handling heavy fabric requires extra table support'
    },
    buildUp: {
      day: '19',
      plannedPct: 60,
      achievedPct: 40,
      operators: 48,
      notes: 'Day 19 performance'
    },
    lineIE: {
      name: 'ASHRAFUL (Line Chief) / IE Lead',
      level: 'executive',
      period: 'daily'
    }
  },
  {
    id: 1731,
    date: DEBONAIR_SEPTEMBER_17_DATE,
    lineNo: '31',
    floor: 'Turag Floor',
    apartment: 'Unit 2 - Turag',
    isActive: true,
    buyer: 'OTCF',
    style: 'JAM 1152',
    smv: 54.91,
    plannedMP: 61,
    workingHours: 8.48,
    targetEff: 60,
    targetProd: 339,
    achievedProd: 200,
    efficiency: 35,
    remarks: 'Shortage: -139. Available: 31020m, Produce: 10982m. Line Chief: FARUK. Days Run: 20. High SMV 54.91.',
    orderQty: 7500,
    dailyInput: 339,
    dailyOutput: 200,
    wip: 220,
    balancingGraph: 'day4',
    nextStyle: 'JAM 1152',
    nextStyleDate: '2026-10-05',
    mp: {
      Operator: { present: 48, absent: 0 },
      Helper: { present: 10, absent: 0 },
      'Iron Man': { present: 3, absent: 0 }
    },
    balanceMethod: 'High SMV Pacing',
    balanceNotes: 'Day 20 on highest SMV style (54.91 min). 200 pcs achieved (35% eff / 59% performance).',
    top5: {
      held: 'yes',
      attendance: 98,
      items: ['Heavy coat lining stitch', 'Sleeve quilting match', 'Hourly target alignment'],
      notes: 'Line Chief Faruk tracking heavy lining seam lines.'
    },
    bottleneck: {
      station: 'Heavy coat lining stitch',
      cycleTime: 65.0,
      targetCT: 54.91,
      status: 'high',
      action: 'Provide extension table support',
      notes: 'Reduces operator fabric pull resistance'
    },
    timeStudy: {
      done: 'yes',
      type: 'time',
      observedRate: 24,
      standardRate: 40,
      findings: 'Fabric weight is primary cycle driver'
    },
    buildUp: {
      day: '20',
      plannedPct: 60,
      achievedPct: 35,
      operators: 48,
      notes: 'Day 20 performance'
    },
    lineIE: {
      name: 'FARUK (Line Chief) / IE Lead',
      level: 'executive',
      period: 'daily'
    }
  },
  {
    id: 1732,
    date: DEBONAIR_SEPTEMBER_17_DATE,
    lineNo: '32',
    floor: 'Turag Floor',
    apartment: 'Unit 2 - Turag',
    isActive: true,
    buyer: 'OTCF',
    style: 'JAM 466',
    smv: 43.03,
    plannedMP: 60,
    workingHours: 9.37,
    targetEff: 60,
    targetProd: 470,
    achievedProd: 250,
    efficiency: 32,
    remarks: 'Shortage: -220. Available: 33720m, Produce: 10758m. Line Chief: BABU MIYA. Days Run: 25. 53% Effi Perf.',
    orderQty: 9000,
    dailyInput: 470,
    dailyOutput: 250,
    wip: 260,
    balancingGraph: 'day4',
    nextStyle: 'JAM 466',
    nextStyleDate: '2026-10-02',
    mp: {
      Operator: { present: 48, absent: 0 },
      Helper: { present: 9, absent: 0 },
      'Iron Man': { present: 3, absent: 0 }
    },
    balanceMethod: 'Line Rebalancing',
    balanceNotes: 'Day 25. 250 pcs produced at 32% efficiency against 60% plan.',
    top5: {
      held: 'yes',
      attendance: 98,
      items: ['Front zipper insertion', 'Collar rib attach', 'Target pacing check'],
      notes: 'Line Chief Babu Miya reviewing bundle cycle times.'
    },
    bottleneck: {
      station: 'Front zipper insertion',
      cycleTime: 52.0,
      targetCT: 43.03,
      status: 'high',
      action: 'Align zipper guide attachment',
      notes: 'Closing cycle gap'
    },
    timeStudy: {
      done: 'yes',
      type: 'time',
      observedRate: 27,
      standardRate: 50,
      findings: 'Pacing steady'
    },
    buildUp: {
      day: '25',
      plannedPct: 60,
      achievedPct: 32,
      operators: 48,
      notes: 'Day 25 performance'
    },
    lineIE: {
      name: 'BABU MIYA (Line Chief) / IE Lead',
      level: 'executive',
      period: 'daily'
    }
  },
  {
    id: 1733,
    date: DEBONAIR_SEPTEMBER_17_DATE,
    lineNo: '33',
    floor: 'Turag Floor',
    apartment: 'Unit 2 - Turag',
    isActive: true,
    buyer: 'OTCF',
    style: 'JAF 472',
    smv: 37.35,
    plannedMP: 60,
    workingHours: 9.50,
    targetEff: 60,
    targetProd: 549,
    achievedProd: 185,
    efficiency: 20,
    remarks: 'Shortage: -364. Available: 34200m, Produce: 6910m. Line Chief: ALAMIN. Days Run: 10.',
    orderQty: 8500,
    dailyInput: 549,
    dailyOutput: 185,
    wip: 390,
    balancingGraph: 'day3',
    nextStyle: 'JAF 472',
    nextStyleDate: '2026-09-27',
    mp: {
      Operator: { present: 48, absent: 0 },
      Helper: { present: 9, absent: 0 },
      'Iron Man': { present: 3, absent: 0 }
    },
    balanceMethod: 'Line Rebalancing',
    balanceNotes: 'Day 10. 185 pcs produced (20% eff / 34% performance ratio).',
    top5: {
      held: 'yes',
      attendance: 98,
      items: ['Pocket flap stitch', 'Bottom hem binding', 'Shift target coaching'],
      notes: 'Line Chief Alamin requesting technician check on binder.'
    },
    bottleneck: {
      station: 'Bottom hem binding',
      cycleTime: 50.0,
      targetCT: 37.35,
      status: 'high',
      action: 'Clean and reset tape binder nozzle',
      notes: 'Binder friction resolved'
    },
    timeStudy: {
      done: 'yes',
      type: 'time',
      observedRate: 20,
      standardRate: 58,
      findings: 'Binder downtime reduced output'
    },
    buildUp: {
      day: '10',
      plannedPct: 60,
      achievedPct: 20,
      operators: 48,
      notes: 'Day 10 ramp up'
    },
    lineIE: {
      name: 'ALAMIN (Line Chief) / IE Lead',
      level: 'executive',
      period: 'daily'
    }
  },
  {
    id: 1734,
    date: DEBONAIR_SEPTEMBER_17_DATE,
    lineNo: '34',
    floor: 'Turag Floor',
    apartment: 'Unit 2 - Turag',
    isActive: true,
    buyer: 'OTCF',
    style: 'JAM 466',
    smv: 36.46,
    plannedMP: 45,
    workingHours: 9.20,
    targetEff: 60,
    targetProd: 409,
    achievedProd: 70,
    efficiency: 10,
    remarks: 'Shortage: -339. Available: 24840m, Produce: 2552m. Line Chief: RAJIB. Days Run: 7. Partial MP: 45.',
    orderQty: 6000,
    dailyInput: 409,
    dailyOutput: 70,
    wip: 340,
    balancingGraph: 'day3',
    nextStyle: 'JAM 466',
    nextStyleDate: '2026-09-25',
    mp: {
      Operator: { present: 36, absent: 0 },
      Helper: { present: 6, absent: 0 },
      'Iron Man': { present: 3, absent: 0 }
    },
    balanceMethod: 'Line Rebalancing & Feeding Support',
    balanceNotes: 'Day 7. 45 MP allocated. Output 70 pcs; fabric feeding interruption resolved in late shift.',
    top5: {
      held: 'yes',
      attendance: 96,
      items: ['Fabric bundle feeding priority', 'Line balance with 45 MP', 'Station pitch alignment'],
      notes: 'Line Chief Rajib aligning line with cutting department.'
    },
    bottleneck: {
      station: 'Bundle intake & sorting',
      cycleTime: 58.0,
      targetCT: 36.46,
      status: 'critical',
      action: 'Ensure uninterrupted bundle flow from cutting',
      notes: 'Feeding delay impacted shift'
    },
    timeStudy: {
      done: 'yes',
      type: 'time',
      observedRate: 8,
      standardRate: 44,
      findings: 'Bundle starve in first 3 hours'
    },
    buildUp: {
      day: '7',
      plannedPct: 60,
      achievedPct: 10,
      operators: 36,
      notes: 'Day 7 ramp up'
    },
    lineIE: {
      name: 'RAJIB (Line Chief) / IE Lead',
      level: 'executive',
      period: 'daily'
    }
  }
];

export const DEBONAIR_UNIT_2_SUMMARY = {
  company: 'DEBONAIR LIMITED (UNIT-2)',
  reportName: 'DAILY SEWING TARGET, ACHIEVEMENT & EFFICIENCY REPORT',
  date: DEBONAIR_SEPTEMBER_17_DATE,
  totalLines: 34,
  averageSMV: 36.91,
  averageWorkingHours: 10.04,
  totalManpower: 2014,
  dayTarget: 20993,
  dayProduction: 11769,
  shortageExcess: -9224,
  plannedEfficiencyPct: 60,
  achievedEfficiencyPct: 35,
  efficiencyPerformancePct: 58,
  totalAvailableMinutes: 1215960,
  totalProducedMinutes: 426121,
  machineBreakdownMinutes: 0,
  minutesVariance: -789839,
  floors: [
    {
      name: 'Padma Floor',
      lines: 'Lines 1 - 6',
      avgSMV: 39.65,
      avgWH: 10.33,
      totalMP: 367,
      dayTarget: 3814,
      dayProduction: 2707,
      shortage: -1107,
      planEffiPct: 63,
      achvEffiPct: 45,
      effiPerfPct: 72,
      availableMin: 227580,
      produceMin: 103214,
      varianceMin: -124366
    },
    {
      name: 'Meghna Floor',
      lines: 'Lines 7 - 12',
      avgSMV: 33.81,
      avgWH: 10.13,
      totalMP: 360,
      dayTarget: 4069,
      dayProduction: 2540,
      shortage: -1529,
      planEffiPct: 57,
      achvEffiPct: 40,
      effiPerfPct: 70,
      availableMin: 218700,
      produceMin: 86448,
      varianceMin: -132252
    },
    {
      name: 'Karnophuli Floor',
      lines: 'Lines 13 - 17',
      avgSMV: 39.21,
      avgWH: 10.25,
      totalMP: 292,
      dayTarget: 2812,
      dayProduction: 2090,
      shortage: -722,
      planEffiPct: 60,
      achvEffiPct: 45,
      effiPerfPct: 74,
      availableMin: 179460,
      produceMin: 80181,
      varianceMin: -99279
    },
    {
      name: 'Korotoya Floor',
      lines: 'Lines 18 - 23',
      avgSMV: 32.93,
      avgWH: 9.83,
      totalMP: 360,
      dayTarget: 3907,
      dayProduction: 1885,
      shortage: -2022,
      planEffiPct: 60,
      achvEffiPct: 29,
      effiPerfPct: 49,
      availableMin: 212160,
      produceMin: 62054,
      varianceMin: -150106
    },
    {
      name: 'Shitalokshya Floor',
      lines: 'Lines 24 - 29',
      avgSMV: 31.32,
      avgWH: 10.56,
      totalMP: 348,
      dayTarget: 4225,
      dayProduction: 1576,
      shortage: -2649,
      planEffiPct: 60,
      achvEffiPct: 22,
      effiPerfPct: 37,
      availableMin: 220380,
      produceMin: 49465,
      varianceMin: -170915
    },
    {
      name: 'Turag Floor',
      lines: 'Lines 30 - 34',
      avgSMV: 44.54,
      avgWH: 9.16,
      totalMP: 287,
      dayTarget: 2166,
      dayProduction: 971,
      shortage: -1195,
      planEffiPct: 60,
      achvEffiPct: 28,
      effiPerfPct: 47,
      availableMin: 157680,
      produceMin: 44759,
      varianceMin: -112921
    }
  ]
};

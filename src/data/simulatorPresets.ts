/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  IESimulatorPreset,
  OperationStep,
  MachineRequirement,
  HandoffCheckItem,
  LineHandoffSignoff
} from '../types';

export const SIMULATOR_PRESETS: IESimulatorPreset[] = [
  {
    id: 'preset-basic-crewneck',
    styleName: 'TS-2401 Crewneck Basic',
    buyer: 'H&M',
    garmentCategory: 'Knit T-Shirt',
    totalSMV: 12.5,
    recommendedOperators: 28,
    recommendedHelpers: 6,
    recommendedIroners: 2,
    operations: [
      {
        id: 'op-1',
        opNo: 1,
        name: 'Shoulder Join (with Mobilon tape)',
        section: 'preparation',
        machineType: '4-Thread Overlock',
        smvSec: 24,
        operators: 2,
        cycleTimeSec: 24.0,
        pitchStatus: 'ok',
        folderOrAttachment: 'Mobilon Tape Guide',
        operatorGrade: 'A'
      },
      {
        id: 'op-2',
        opNo: 2,
        name: 'Rib Collar Make & Close',
        section: 'preparation',
        machineType: 'Single Needle Lockstitch',
        smvSec: 22,
        operators: 2,
        cycleTimeSec: 22.0,
        pitchStatus: 'ok',
        operatorGrade: 'B'
      },
      {
        id: 'op-3',
        opNo: 3,
        name: 'Neck Rib Attach to Body',
        section: 'assembly',
        machineType: '4-Thread Overlock',
        smvSec: 32,
        operators: 3,
        cycleTimeSec: 26.5,
        pitchStatus: 'ok',
        folderOrAttachment: 'Neck Rib Tension Roller',
        operatorGrade: 'A'
      },
      {
        id: 'op-4',
        opNo: 4,
        name: 'Back Neck Piping / Tape Attach',
        section: 'assembly',
        machineType: 'Flatlock Cylinder Bed',
        smvSec: 28,
        operators: 2,
        cycleTimeSec: 28.0,
        pitchStatus: 'ok',
        folderOrAttachment: '1/2" Fold Folder Guide',
        operatorGrade: 'A'
      },
      {
        id: 'op-5',
        opNo: 5,
        name: 'Sleeve Join to Armhole (Open)',
        section: 'assembly',
        machineType: '4-Thread Overlock',
        smvSec: 36,
        operators: 3,
        cycleTimeSec: 27.0,
        pitchStatus: 'ok',
        operatorGrade: 'B'
      },
      {
        id: 'op-6',
        opNo: 6,
        name: 'Side Seam Close with Care Label',
        section: 'assembly',
        machineType: '4-Thread Overlock',
        smvSec: 38,
        operators: 3,
        cycleTimeSec: 28.5,
        pitchStatus: 'bottleneck',
        folderOrAttachment: 'Label Inserter Device',
        operatorGrade: 'B'
      },
      {
        id: 'op-7',
        opNo: 7,
        name: 'Sleeve Hem Fold & Stitch',
        section: 'finishing',
        machineType: 'Coverstitch Flatbed',
        smvSec: 30,
        operators: 3,
        cycleTimeSec: 25.0,
        pitchStatus: 'ok',
        folderOrAttachment: 'Hemming Guide 3/4"',
        operatorGrade: 'B'
      },
      {
        id: 'op-8',
        opNo: 8,
        name: 'Bottom Hem Fold & Stitch',
        section: 'finishing',
        machineType: 'Coverstitch Flatbed',
        smvSec: 34,
        operators: 3,
        cycleTimeSec: 26.0,
        pitchStatus: 'ok',
        folderOrAttachment: 'Hemming Guide 1"',
        operatorGrade: 'A'
      }
    ],
    machines: [
      {
        type: '4-Thread Overlock',
        name: 'Pegasus M952 Series High Speed',
        requiredCount: 11,
        installedCount: 11,
        calibratedCount: 11,
        gaugeSpec: 'Gauge 2.0mm / Needle B27 #11'
      },
      {
        type: 'Single Needle Lockstitch',
        name: 'Juki DDL-9000C Direct Drive',
        requiredCount: 4,
        installedCount: 4,
        calibratedCount: 4,
        gaugeSpec: 'Needle DBx1 #11 light ball point'
      },
      {
        type: 'Coverstitch Flatbed',
        name: 'Yamato VG2700 High-Speed Flatbed',
        requiredCount: 7,
        installedCount: 7,
        calibratedCount: 7,
        gaugeSpec: 'Gauge 5.6mm (7/32") UY128GAS'
      },
      {
        type: 'Flatlock Cylinder Bed',
        name: 'Brother S-7300A Electronic',
        requiredCount: 4,
        installedCount: 4,
        calibratedCount: 4,
        gaugeSpec: 'Cylinder arm piping folder 12mm'
      }
    ]
  },
  {
    id: 'preset-pique-polo',
    styleName: 'PL-101 Pique Polo Shirt',
    buyer: 'Target',
    garmentCategory: 'Polo Shirt',
    totalSMV: 18.5,
    recommendedOperators: 36,
    recommendedHelpers: 8,
    recommendedIroners: 3,
    operations: [
      {
        id: 'op-p1',
        opNo: 1,
        name: 'Placket Fuse & Crease Iron',
        section: 'preparation',
        machineType: 'Steam Iron Station',
        smvSec: 28,
        operators: 2,
        cycleTimeSec: 28.0,
        pitchStatus: 'ok',
        operatorGrade: 'B'
      },
      {
        id: 'op-p2',
        opNo: 2,
        name: 'Box Placket Attach to Center Front',
        section: 'preparation',
        machineType: 'Single Needle Lockstitch',
        smvSec: 46,
        operators: 3,
        cycleTimeSec: 32.0,
        pitchStatus: 'bottleneck',
        folderOrAttachment: 'Placket Center Fold Gauge',
        operatorGrade: 'A'
      },
      {
        id: 'op-p3',
        opNo: 3,
        name: 'Shoulder Join + Reinforcement Tape',
        section: 'assembly',
        machineType: '4-Thread Overlock',
        smvSec: 30,
        operators: 3,
        cycleTimeSec: 26.0,
        pitchStatus: 'ok',
        operatorGrade: 'B'
      },
      {
        id: 'op-p4',
        opNo: 4,
        name: 'Flat Knit Rib Collar Attach',
        section: 'assembly',
        machineType: 'Single Needle Lockstitch',
        smvSec: 42,
        operators: 4,
        cycleTimeSec: 30.5,
        pitchStatus: 'ok',
        folderOrAttachment: 'Neck Seam Guide',
        operatorGrade: 'A'
      },
      {
        id: 'op-p5',
        opNo: 5,
        name: 'Collar Neckband Piping Cover',
        section: 'assembly',
        machineType: 'Single Needle Lockstitch',
        smvSec: 34,
        operators: 3,
        cycleTimeSec: 28.0,
        pitchStatus: 'ok',
        operatorGrade: 'B'
      },
      {
        id: 'op-p6',
        opNo: 6,
        name: 'Rib Sleeve Cuff Join',
        section: 'assembly',
        machineType: '4-Thread Overlock',
        smvSec: 32,
        operators: 3,
        cycleTimeSec: 27.0,
        pitchStatus: 'ok',
        operatorGrade: 'B'
      },
      {
        id: 'op-p7',
        opNo: 7,
        name: 'Side Vent Make & Close Seam',
        section: 'finishing',
        machineType: '4-Thread Overlock',
        smvSec: 44,
        operators: 4,
        cycleTimeSec: 31.0,
        pitchStatus: 'bottleneck',
        operatorGrade: 'A'
      },
      {
        id: 'op-p8',
        opNo: 8,
        name: 'Buttonhole & Button Attach',
        section: 'finishing',
        machineType: 'Electronic Buttonhole Machine',
        smvSec: 36,
        operators: 3,
        cycleTimeSec: 26.0,
        pitchStatus: 'ok',
        operatorGrade: 'A'
      }
    ],
    machines: [
      {
        type: 'Single Needle Lockstitch',
        name: 'Juki DDL-9000C Direct Drive',
        requiredCount: 14,
        installedCount: 14,
        calibratedCount: 14,
        gaugeSpec: 'DBx1 #12 ball point'
      },
      {
        type: '4-Thread Overlock',
        name: 'Pegasus M952 Series',
        requiredCount: 12,
        installedCount: 12,
        calibratedCount: 12,
        gaugeSpec: 'Gauge 2.0mm / B27 #11'
      },
      {
        type: 'Electronic Buttonhole Machine',
        name: 'Brother HE-800B Electronic Lockstitch',
        requiredCount: 3,
        installedCount: 3,
        calibratedCount: 3,
        gaugeSpec: 'Knife 1/2" index spec'
      },
      {
        type: 'Button Sewing Machine',
        name: 'Juki MB-1800 Electronic',
        requiredCount: 3,
        installedCount: 3,
        calibratedCount: 3,
        gaugeSpec: '4-Hole Cross Stitch Clamp'
      }
    ]
  },
  {
    id: 'preset-fleece-hoodie',
    styleName: 'HD-303 Fleece Pullover Hoodie',
    buyer: 'Nike',
    garmentCategory: 'Knit Outerwear',
    totalSMV: 22.0,
    recommendedOperators: 42,
    recommendedHelpers: 9,
    recommendedIroners: 3,
    operations: [
      {
        id: 'op-h1',
        opNo: 1,
        name: 'Kangaroo Pocket Hem & Topstitch',
        section: 'preparation',
        machineType: 'Twin Needle Lockstitch',
        smvSec: 42,
        operators: 3,
        cycleTimeSec: 31.0,
        pitchStatus: 'ok',
        operatorGrade: 'A'
      },
      {
        id: 'op-h2',
        opNo: 2,
        name: 'Kangaroo Pocket Attach to Front Body',
        section: 'preparation',
        machineType: 'Single Needle Lockstitch',
        smvSec: 52,
        operators: 4,
        cycleTimeSec: 33.5,
        pitchStatus: 'bottleneck',
        folderOrAttachment: 'Pocket Template Jig',
        operatorGrade: 'A'
      },
      {
        id: 'op-h3',
        opNo: 3,
        name: 'Hood Center Join & Drawcord Eyelets',
        section: 'preparation',
        machineType: '4-Thread Overlock',
        smvSec: 36,
        operators: 3,
        cycleTimeSec: 29.0,
        pitchStatus: 'ok',
        operatorGrade: 'B'
      },
      {
        id: 'op-h4',
        opNo: 4,
        name: 'Shoulder Join + Reinforce Tape',
        section: 'assembly',
        machineType: '4-Thread Overlock',
        smvSec: 32,
        operators: 3,
        cycleTimeSec: 28.0,
        pitchStatus: 'ok',
        operatorGrade: 'B'
      },
      {
        id: 'op-h5',
        opNo: 5,
        name: 'Hood Assembly Attach to Neckline',
        section: 'assembly',
        machineType: '4-Thread Overlock',
        smvSec: 48,
        operators: 4,
        cycleTimeSec: 32.5,
        pitchStatus: 'bottleneck',
        operatorGrade: 'A'
      },
      {
        id: 'op-h6',
        opNo: 6,
        name: 'Sleeve Join to Armhole',
        section: 'assembly',
        machineType: '4-Thread Overlock',
        smvSec: 38,
        operators: 3,
        cycleTimeSec: 30.0,
        pitchStatus: 'ok',
        operatorGrade: 'B'
      },
      {
        id: 'op-h7',
        opNo: 7,
        name: 'Side Seam Close 4-Thread',
        section: 'assembly',
        machineType: '4-Thread Overlock',
        smvSec: 44,
        operators: 4,
        cycleTimeSec: 30.0,
        pitchStatus: 'ok',
        operatorGrade: 'B'
      },
      {
        id: 'op-h8',
        opNo: 8,
        name: 'Rib Cuff & Bottom Rib Hem Attach',
        section: 'finishing',
        machineType: '4-Thread Overlock Cylinder',
        smvSec: 46,
        operators: 4,
        cycleTimeSec: 31.5,
        pitchStatus: 'ok',
        folderOrAttachment: 'Cuff Expander Guide',
        operatorGrade: 'A'
      }
    ],
    machines: [
      {
        type: '4-Thread Overlock Heavy Duty',
        name: 'Pegasus EXT Series Heavy Knit',
        requiredCount: 18,
        installedCount: 18,
        calibratedCount: 18,
        gaugeSpec: 'Gauge 3.0mm / Needle B27 #14'
      },
      {
        type: 'Single Needle Lockstitch',
        name: 'Juki DDL-9000C',
        requiredCount: 8,
        installedCount: 8,
        calibratedCount: 8,
        gaugeSpec: 'DBx1 #14 ball point'
      },
      {
        type: 'Twin Needle Lockstitch',
        name: 'Brother T-8422C Direct Drive',
        requiredCount: 4,
        installedCount: 4,
        calibratedCount: 4,
        gaugeSpec: 'Gauge 1/4" heavy setup'
      }
    ]
  }
];

export const DEFAULT_HANDOFF_CHECKLIST: HandoffCheckItem[] = [
  {
    id: 'chk-1',
    category: 'machine_mechanical',
    item: 'Needle Gauge & Point Calibration',
    standard: 'All machines equipped with certified needle sizes (Ball point for knits, Sharp for woven). Zero needle deflection.',
    status: 'pass',
    responsible: 'Maintenance Lead',
    notes: 'Checked across all 28 workstations'
  },
  {
    id: 'chk-2',
    category: 'attachments_jigs',
    item: 'Folder & Tension Device Fitment',
    standard: 'Mobilon tape guide, hemming folders, and neckline roller guides locked to machine bed within 0.5mm alignment.',
    status: 'pass',
    responsible: 'Line IE',
    notes: 'Piping folder tested on sample mockups'
  },
  {
    id: 'chk-3',
    category: 'quality_sample',
    item: 'Approved Golden Seal PP Sample on Line Board',
    standard: 'Signed buyer approved PP sample and technical pack visible on center line inspection board.',
    status: 'pass',
    responsible: 'QA Executive',
    notes: 'Buyer Golden Seal #GS-992 signed'
  },
  {
    id: 'chk-4',
    category: 'manpower_skill',
    item: 'Critical Station Operator Skill Matrix Signoff',
    standard: 'Grade A operators assigned to neckline, shoulder joining, and topstitch stations with prior experience.',
    status: 'pass',
    responsible: 'Production Supervisor',
    notes: '100% skill match verified'
  },
  {
    id: 'chk-5',
    category: 'material_wip',
    item: 'Cut Bundle Availability & Numbering Check',
    standard: 'Minimum 2.5 hours of cut bundles with proper shade numbering loaded at line input table.',
    status: 'pass',
    responsible: 'Cutting / Input Lead',
    notes: '1,400 pcs bundled and inspected'
  }
];

export const DEFAULT_HANDOFF_SIGNOFFS: LineHandoffSignoff[] = [
  {
    role: 'IE_LEAD',
    title: 'Industrial Engineering Lead',
    signedByName: 'Nasir Uddin (Sr. IE)',
    status: 'approved',
    signedAt: new Date().toISOString().split('T')[0],
    comments: 'Line layout, pitch time, and balancing analysis verified compliant.'
  },
  {
    role: 'FLOOR_SUPERVISOR',
    title: 'Production Floor Supervisor',
    signedByName: 'Rafiqul Islam',
    status: 'approved',
    signedAt: new Date().toISOString().split('T')[0],
    comments: 'Line manpower present and allocated according to operation bulletin.'
  },
  {
    role: 'MAINTENANCE_INCHARGE',
    title: 'Maintenance & Mechanical Lead',
    signedByName: 'Kabir Ahmed',
    status: 'approved',
    signedAt: new Date().toISOString().split('T')[0],
    comments: 'All 34 machines oiled, calibrated, and safety tested.'
  },
  {
    role: 'QUALITY_ASSURANCE',
    title: 'Floor QA Executive',
    signedByName: 'Nasreen Akter',
    status: 'approved',
    signedAt: new Date().toISOString().split('T')[0],
    comments: 'Initial 5 mockups passed SPI and dimensional tolerance audits.'
  }
];

export interface SimulatorInputParams {
  smvMinutes: number;
  operators: number;
  helpers: number;
  ironers: number;
  workingHours: number;
  overtimeHours: number;
  targetEffPct: number;
}

export interface SimulatorMetricsResult {
  targetProductionPcs: number;
  targetHourlyRatePcs: number;
  pitchTimeSeconds: number;
  totalManpower: number;
  producedSAH: number;
  totalAvailableMinutes: number;
  grossWorkingHours: number;
  totalGrossAvailableMinutes: number;
  dailyProduction100Pct: number;
  operatorPitchSeconds: number;
  capacityPerOperator: number;
}

export function calculateSimulatorMetrics(params: SimulatorInputParams): SimulatorMetricsResult {
  const smv = params.smvMinutes > 0 ? params.smvMinutes : 1.0;
  const totalManpower = params.operators + params.helpers + params.ironers;
  const grossWorkingHours = params.workingHours + params.overtimeHours;
  const totalAvailableMinutes = totalManpower * grossWorkingHours * 60;
  const totalGrossAvailableMinutes = totalAvailableMinutes;

  const dailyProduction100Pct = Math.round(totalAvailableMinutes / smv);
  const targetProductionPcs = Math.round(dailyProduction100Pct * (params.targetEffPct / 100));
  const targetHourlyRatePcs = grossWorkingHours > 0 ? Math.round(targetProductionPcs / grossWorkingHours) : 0;
  const producedSAH = Math.round((targetProductionPcs * smv) / 60);

  // Pitch time in seconds (per operator)
  const pitchTimeSeconds =
    params.operators > 0 ? Math.round(((smv * 60) / params.operators) * 10) / 10 : 0;
  const operatorPitchSeconds = pitchTimeSeconds;
  const capacityPerOperator = params.operators > 0 ? Math.round(targetProductionPcs / params.operators) : 0;

  return {
    targetProductionPcs,
    targetHourlyRatePcs,
    pitchTimeSeconds,
    totalManpower,
    producedSAH,
    totalAvailableMinutes,
    grossWorkingHours,
    totalGrossAvailableMinutes,
    dailyProduction100Pct,
    operatorPitchSeconds,
    capacityPerOperator
  };
}

export interface PitchAnalysisResult {
  balanceLossPct: number;
  lineBalanceEfficiencyPct: number;
  bottleneckCount: number;
  maxCycleTimeSec: number;
  minCycleTimeSec: number;
  avgCycleTimeSec: number;
  smoothnessIndex: number;
}

export function calculatePitchAnalysis(
  operations: OperationStep[],
  pitchTimeSeconds: number
): PitchAnalysisResult {
  if (!operations || operations.length === 0) {
    return {
      balanceLossPct: 12.0,
      lineBalanceEfficiencyPct: 88.0,
      bottleneckCount: 0,
      maxCycleTimeSec: 30,
      minCycleTimeSec: 20,
      avgCycleTimeSec: 25,
      smoothnessIndex: 3.2
    };
  }

  const cycleTimes = operations.map(o => o.cycleTimeSec || 25);
  const maxCycleTimeSec = Math.max(...cycleTimes, 1);
  const minCycleTimeSec = Math.min(...cycleTimes, 1);
  const totalWorkSec = operations.reduce((acc, o) => acc + (o.smvSec || o.cycleTimeSec || 25), 0);
  const totalAssignedTimeSec = operations.reduce((acc, o) => acc + ((o.operators || 1) * maxCycleTimeSec), 0);

  const avgCycleTimeSec = Math.round(
    cycleTimes.reduce((acc, c) => acc + c, 0) / Math.max(1, cycleTimes.length)
  );

  const bottleneckCount = operations.filter(
    o => o.pitchStatus === 'bottleneck' || o.cycleTimeSec > pitchTimeSeconds * 1.05
  ).length;

  const balanceLossPct =
    totalAssignedTimeSec > 0
      ? Math.max(
          0,
          Math.min(
            100,
            Math.round((1 - totalWorkSec / totalAssignedTimeSec) * 100 * 10) / 10
          )
        )
      : 12.0;

  const lineBalanceEfficiencyPct = Math.max(0, Math.min(100, Math.round((100 - balanceLossPct) * 10) / 10));

  // Smoothness index: square root of sum of squared deviations from pitch time
  const squaredDiffs = operations.reduce((acc, o) => {
    const diff = (o.cycleTimeSec || 0) - pitchTimeSeconds;
    return acc + diff * diff;
  }, 0);
  const smoothnessIndex = Math.round(Math.sqrt(squaredDiffs / operations.length) * 10) / 10;

  return {
    balanceLossPct,
    lineBalanceEfficiencyPct,
    bottleneckCount,
    maxCycleTimeSec,
    minCycleTimeSec,
    avgCycleTimeSec,
    smoothnessIndex
  };
}

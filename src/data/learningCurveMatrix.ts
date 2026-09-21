/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  StyleNature,
  SMVWeight,
  LearningCurveDayRecord,
  LineLearningCurve,
  BalancingLossAnalysis
} from '../types';

/**
 * Standard 40-Day Style Progression Target Matrix
 * Referenced from Industrial Engineering Standard Work Guidelines
 * Categorized by SMV Weight:
 *  - Light: 0 - 30 Minutes
 *  - Medium: 31 - 60 Minutes
 *  - Heavy: > 60 Minutes
 * And Style Nature:
 *  - New Style (Initial production run)
 *  - Repeat Style (Input reintroduced within 3 months on same line)
 */

export const STYLE_PROGRESSION_MATRIX = {
  new: {
    light: [
      28, 38, 48, 58, 68, 76, 80, 82, 84, 85,
      85, 86, 86, 87, 87, 88, 88, 88, 89, 89,
      90, 90, 90, 91, 91, 91, 92, 92, 92, 92,
      93, 93, 93, 93, 94, 94, 94, 94, 95, 95
    ],
    medium: [
      24, 32, 42, 52, 62, 70, 75, 78, 80, 82,
      83, 84, 84, 85, 85, 86, 86, 86, 87, 87,
      88, 88, 88, 89, 89, 89, 90, 90, 90, 90,
      91, 91, 91, 91, 92, 92, 92, 92, 93, 93
    ],
    heavy: [
      20, 28, 36, 46, 56, 64, 70, 74, 76, 78,
      80, 81, 82, 82, 83, 83, 84, 84, 85, 85,
      86, 86, 86, 87, 87, 87, 88, 88, 88, 88,
      89, 89, 89, 89, 90, 90, 90, 90, 91, 91
    ]
  },
  repeat: {
    light: [
      45, 55, 65, 74, 80, 85, 86, 87, 88, 88,
      89, 89, 90, 90, 90, 91, 91, 91, 92, 92,
      92, 93, 93, 93, 93, 94, 94, 94, 94, 94,
      95, 95, 95, 95, 95, 96, 96, 96, 96, 96
    ],
    medium: [
      40, 50, 60, 68, 76, 82, 84, 85, 86, 86,
      87, 87, 88, 88, 88, 89, 89, 89, 90, 90,
      90, 91, 91, 91, 91, 92, 92, 92, 92, 92,
      93, 93, 93, 93, 93, 94, 94, 94, 94, 94
    ],
    heavy: [
      35, 45, 54, 62, 70, 76, 79, 81, 82, 83,
      84, 84, 85, 85, 86, 86, 86, 87, 87, 87,
      88, 88, 88, 89, 89, 89, 89, 90, 90, 90,
      90, 91, 91, 91, 91, 91, 92, 92, 92, 92
    ]
  }
};

/**
 * Classify garment SMV into SMV Weight bracket
 */
export function getSMVWeight(smv: number): SMVWeight {
  if (smv <= 30) return 'light';
  if (smv <= 60) return 'medium';
  return 'heavy';
}

/**
 * Get the target efficiency for a specific period day
 * Accepts (day, smvWeight, styleNature) or (day, styleNature, smvWeight)
 */
export function getProgressionTargetEff(
  day: number,
  arg2: SMVWeight | StyleNature | string,
  arg3: SMVWeight | StyleNature | string
): number {
  const isNature2 = arg2 === 'new' || arg2 === 'repeat';
  const isNature3 = arg3 === 'new' || arg3 === 'repeat';
  const styleNature: 'new' | 'repeat' = isNature2 ? (arg2 as any) : isNature3 ? (arg3 as any) : 'new';

  const isWeight2 = arg2 === 'light' || arg2 === 'medium' || arg2 === 'heavy';
  const isWeight3 = arg3 === 'light' || arg3 === 'medium' || arg3 === 'heavy';
  const smvWeight: 'light' | 'medium' | 'heavy' = isWeight2 ? (arg2 as any) : isWeight3 ? (arg3 as any) : 'light';

  const curve = STYLE_PROGRESSION_MATRIX[styleNature]?.[smvWeight] ?? STYLE_PROGRESSION_MATRIX.new.light;
  const safeIndex = Math.max(0, Math.min(day - 1, curve.length - 1));
  return curve[safeIndex] ?? 70;
}

/**
 * Generate 6-day standard learning curve record history for an operational line
 */
export function generateLineLearningCurve(
  smv: number,
  totalMP: number,
  workingHours: number = 8,
  styleNature: StyleNature = 'new',
  currentDay: number = 2,
  isRepeatWithin3Months: boolean = false
): LineLearningCurve {
  const smvWeight = getSMVWeight(smv);
  const totalAvailMinPerDay = totalMP * workingHours * 60;
  const validSmv = smv > 0 ? smv : 1.0;

  const history: LearningCurveDayRecord[] = [];

  for (let day = 1; day <= 6; day++) {
    const plannedEff = getProgressionTargetEff(day, smvWeight, styleNature);
    const plannedQty = Math.round((totalAvailMinPerDay * (plannedEff / 100)) / validSmv);

    let achievedEff = 0;
    let achievedQty = 0;
    let variancePcs = 0;
    let variancePct = 0;
    let notes = '';

    if (day < currentDay) {
      // Completed historical days with realistic logged outputs
      const performanceVariation = day === 1 ? 1.02 : 0.98;
      achievedQty = Math.round(plannedQty * performanceVariation);
      achievedEff = Math.round(((achievedQty * validSmv) / totalAvailMinPerDay) * 100);
      variancePcs = achievedQty - plannedQty;
      variancePct = plannedQty > 0 ? Math.round((variancePcs / plannedQty) * 100) : 0;
      notes = day === 1 ? 'Initial line setup completed' : 'Batch pacing stabilized';
    } else if (day === currentDay) {
      // Today in progress: partial/current pace
      achievedQty = Math.round(plannedQty * 0.85);
      achievedEff = Math.round(((achievedQty * validSmv) / totalAvailMinPerDay) * 100);
      variancePcs = achievedQty - plannedQty;
      variancePct = plannedQty > 0 ? Math.round((variancePcs / plannedQty) * 100) : 0;
      notes = 'Shift underway; pacing logged at 3PM';
    }

    history.push({
      day,
      plannedEff,
      achievedEff,
      plannedQty,
      achievedQty,
      variancePcs,
      variancePct,
      notes
    });
  }

  return {
    periodDays: 6,
    currentDay,
    styleNature,
    smvWeight,
    history,
    isRepeatWithin3Months,
    notes: `6-Day IE ramp-up curve for ${styleNature.toUpperCase()} style (${smvWeight} weight bracket)`
  };
}

/**
 * Calculate balancing loss and capacity estimate metrics
 * Based on Industrial Engineering line balancing equations:
 *  - Tacct Time = Total Work Content (sum of SMV in seconds)
 *  - Pitch Time = Tacct Time / Total Operators (N)
 *  - Balancing Loss % = 1 - (Tacct Time / (N * CTmax))
 *  - Potential Output = 3600 / CTmax pcs/hr
 *  - Estimate Output = 3600 / Pitch Time pcs/hr
 */
export function calculateBalancingLossAnalysis(
  tacctSeconds: number,
  totalOperators: number,
  maxCTSeconds: number,
  currentHourlyProd: number = 90,
  estimateHourlyProd?: number
): BalancingLossAnalysis {
  const safeOperators = Math.max(1, totalOperators);
  const safeMaxCT = Math.max(1, maxCTSeconds);
  const safeTacct = Math.max(1, tacctSeconds);

  // Pitch Time (Takt Time per station)
  const pitchTimeSeconds = Math.round((safeTacct / safeOperators) * 10) / 10;

  // Balancing Loss % formula
  const theoreticalCapacity = safeOperators * safeMaxCT;
  const balanceEfficiency = Math.min(1, safeTacct / theoreticalCapacity);
  const balancingLossPct = Math.max(
    0,
    Math.min(100, Math.round((1 - balanceEfficiency) * 100 * 10) / 10)
  );

  // Status classification
  let balancingStatus: BalancingLossAnalysis['balancingStatus'] = 'Stable';
  if (balancingLossPct > 25) {
    balancingStatus = 'High Loss';
  } else if (balancingLossPct > 15) {
    balancingStatus = 'Critical';
  } else if (balancingLossPct < 5) {
    balancingStatus = 'Overloaded/Verify Data';
  }

  // Hourly throughput potentials
  const potentialPcsPerHour = Math.round(3600 / safeMaxCT);
  const calculatedEstimate = pitchTimeSeconds > 0 ? Math.round(3600 / pitchTimeSeconds) : 0;
  const estimatePcsPerHour = estimateHourlyProd && estimateHourlyProd > 0 ? estimateHourlyProd : calculatedEstimate;
  const minCapacityPcsPerHour = Math.round(potentialPcsPerHour * 0.85);
  const currentProductionPcsPerHour = currentHourlyProd > 0 ? currentHourlyProd : Math.round(estimatePcsPerHour * 0.92);

  // Estimated throughput loss percentage against potential
  const estimatedLossPct =
    potentialPcsPerHour > 0
      ? Math.max(
          0,
          Math.min(
            100,
            Math.round(((potentialPcsPerHour - currentProductionPcsPerHour) / potentialPcsPerHour) * 100)
          )
        )
      : 0;

  // Theoretical Balance & Tolerances
  const theoreticalBalancePct = Math.round(Math.max(0, 100 - balancingLossPct) * 10) / 10;
  const balancingErrorPct = Math.round(Math.abs(balancingLossPct - 12) * 10) / 10;

  return {
    tacctSeconds: safeTacct,
    totalOperators: safeOperators,
    maxCTSeconds: safeMaxCT,
    pitchTimeSeconds,
    balancingLossPct,
    balancingStatus,
    potentialPcsPerHour,
    estimatePcsPerHour,
    minCapacityPcsPerHour,
    currentProductionPcsPerHour,
    estimatedLossPct,
    remarks: `Balancing loss: ${balancingLossPct}%. Bottleneck CT: ${safeMaxCT}s vs Pitch: ${pitchTimeSeconds}s.`,
    theoreticalBalancePct,
    balancingErrorPct,
    capacityEstimatePct: 12.5,
    rightManInRightProcess: true,
    rightMachineForProcess: true,
    needleDowntimeMinutes: 18
  };
}

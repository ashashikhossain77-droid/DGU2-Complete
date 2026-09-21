/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as XLSX from 'xlsx';
import { BuildUpCurve, LearningCurveDayRecord, LineLearningCurve, StyleNature } from '../types';

/**
 * Generate a complete CSV export for a line's 6-Day Learning Curve and Line Build-Up Telemetry
 */
export function generateTelemetryCSV(
  learningCurve: LineLearningCurve,
  buildUp: BuildUpCurve,
  lineNo: string,
  smv: number,
  totalMP: number,
  hours: number
): string {
  const lines: string[] = [];

  // Header metadata comments
  lines.push(`# IE TELEMETRY LOG - SEWING LINE ${lineNo}`);
  lines.push(`# Exported: ${new Date().toISOString()}`);
  lines.push(`# Parameters: SMV=${smv} min | MP=${totalMP} | Hours=${hours} hrs | Nature=${learningCurve.styleNature}`);
  lines.push('');

  // 1. Line Build-Up Parameters Section
  lines.push('[LINE_BUILD_UP]');
  lines.push('BuildUpDay,PlannedRampEffPct,AchievedRampEffPct,AllocatedOperators,Notes');
  lines.push(
    `"${buildUp.day}",${buildUp.plannedPct ?? 50},${buildUp.achievedPct ?? 50},${buildUp.operators ?? totalMP},"${(buildUp.notes || '').replace(/"/g, '""')}"`
  );
  lines.push('');

  // 2. 6-Day Learning Curve Telemetry Table
  lines.push('[6_DAY_LEARNING_CURVE]');
  lines.push('Day,PlannedEffPct,PlannedQtyPcs,AchievedQtyPcs,AchievedEffPct,VariancePcs,Notes');
  learningCurve.history.slice(0, 6).forEach(rec => {
    lines.push(
      `${rec.day},${rec.plannedEff},${rec.plannedQty},${rec.achievedQty || 0},${rec.achievedEff || 0},${rec.variancePcs || 0},"${(rec.notes || '').replace(/"/g, '""')}"`
    );
  });

  return lines.join('\n');
}

/**
 * Generate a clean standard CSV template that users can fill out in Excel or Google Sheets
 */
export function generateTelemetryTemplateCSV(): string {
  const lines: string[] = [
    '# Standard Telemetry Import Template for Sewing Line Build-Up & 6-Day Learning Curve',
    '# You can fill in the rows below and import directly into the app.',
    '',
    '[LINE_BUILD_UP]',
    'BuildUpDay,PlannedRampEffPct,AchievedRampEffPct,AllocatedOperators,Notes',
    'Day 1,50,48,36,"Initial line feed & bobbin check ramp-up"',
    '',
    '[6_DAY_LEARNING_CURVE]',
    'Day,PlannedEffPct,PlannedQtyPcs,AchievedQtyPcs,Notes',
    '1,28,322,310,"Day 1 trial pieces, mock-up run"',
    '2,38,437,425,"Feed dog alignment adjusted at 11am"',
    '3,48,552,560,"Target met, helper added to front placket"',
    '4,58,667,650,"Needle thread tension checked"',
    '5,68,782,790,"Overtime hour utilized for bottleneck clearance"',
    '6,76,874,880,"Full 6-day curve stabilized for steady-state run"'
  ];

  return lines.join('\n');
}

/**
 * Trigger direct client-side download of a CSV file
 */
export function downloadTelemetryCSV(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface TelemetryParseResult {
  success: boolean;
  learningCurve?: {
    styleNature?: StyleNature;
    currentDay?: number;
    history: LearningCurveDayRecord[];
    notes?: string;
  };
  buildUp?: Partial<BuildUpCurve>;
  errors: string[];
  warnings: string[];
}

/**
 * Parse telemetry text (supports structured formats with sections, or simple tabular CSVs)
 */
export function parseTelemetryCSV(
  text: string,
  smv: number = 18.5,
  totalMP: number = 40,
  hours: number = 8
): TelemetryParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const rawLines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (rawLines.length === 0) {
    return { success: false, errors: ['File or text content is empty.'], warnings };
  }

  const effectiveSMV = smv > 0 ? smv : 18.5;
  const effectiveMP = totalMP > 0 ? totalMP : 40;
  const effectiveHours = hours > 0 ? hours : 8;
  const totalAvailMin = effectiveMP * effectiveHours * 60;

  const parsedHistory: Record<number, LearningCurveDayRecord> = {};
  let parsedBuildUp: Partial<BuildUpCurve> | undefined;

  let currentSection: 'NONE' | 'BUILD_UP' | 'LEARNING_CURVE' = 'NONE';

  // Helper to split CSV row handling quoted commas
  const parseCSVRow = (rowStr: string): string[] => {
    const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
    const entries: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = regex.exec(rowStr)) !== null) {
      let val = match[1];
      if (val === undefined) break;
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.substring(1, val.length - 1).replace(/""/g, '"');
      }
      entries.push(val.trim());
      if (regex.lastIndex >= rowStr.length && !rowStr.endsWith(',')) break;
    }
    return entries.filter((_, idx) => idx < 15);
  };

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];

    // Comments
    if (line.startsWith('#')) {
      // Look for StyleNature hint
      if (line.toLowerCase().includes('nature=repeat')) {
        // Will apply repeat style
      }
      continue;
    }

    // Section headers
    if (line.toUpperCase().includes('[LINE_BUILD_UP]')) {
      currentSection = 'BUILD_UP';
      continue;
    }
    if (line.toUpperCase().includes('[6_DAY_LEARNING_CURVE]') || line.toUpperCase().includes('[LEARNING_CURVE]')) {
      currentSection = 'LEARNING_CURVE';
      continue;
    }

    const cols = parseCSVRow(line);
    if (cols.length === 0) continue;

    const firstColLower = cols[0].toLowerCase();

    // Check if this is a header row
    if (
      firstColLower.includes('buildup') ||
      firstColLower.includes('day') ||
      firstColLower.includes('period') ||
      firstColLower.includes('step')
    ) {
      // Header row
      if (firstColLower.includes('buildup')) {
        currentSection = 'BUILD_UP';
      } else if (firstColLower.includes('day')) {
        currentSection = 'LEARNING_CURVE';
      }
      continue;
    }

    // Process based on section or row structure
    if (currentSection === 'BUILD_UP') {
      const dayVal = cols[0] || '1';
      const plannedEff = parseFloat(cols[1]) || 50;
      const achievedEff = parseFloat(cols[2]) || plannedEff;
      const operators = parseInt(cols[3], 10) || effectiveMP;
      const notes = cols[4] || '';

      parsedBuildUp = {
        day: dayVal.replace(/[^0-9a-zA-Z -]/g, ''),
        plannedPct: plannedEff,
        achievedPct: achievedEff,
        operators,
        notes
      };
      // Reset section after parsing build up row
      currentSection = 'NONE';
    } else {
      // Assume Learning Curve day row
      // Try to extract Day number
      const dayMatch = cols[0].match(/\d+/);
      if (dayMatch) {
        const dayNum = parseInt(dayMatch[0], 10);
        if (dayNum >= 1 && dayNum <= 6) {
          const plannedEff = parseFloat(cols[1]) || 30;
          let plannedQty = parseInt(cols[2], 10);
          if (isNaN(plannedQty) || plannedQty <= 0) {
            plannedQty = Math.round((totalAvailMin * (plannedEff / 100)) / effectiveSMV);
          }

          const achievedQty = parseInt(cols[3], 10) || 0;
          let achievedEff = parseFloat(cols[4]);
          if (isNaN(achievedEff) || achievedEff === 0) {
            achievedEff = achievedQty > 0 ? Math.round(((achievedQty * effectiveSMV) / totalAvailMin) * 100) : 0;
          }

          const notes = cols[5] || cols[4] || '';
          const variancePcs = achievedQty - plannedQty;
          const variancePct = plannedQty > 0 ? Math.round((variancePcs / plannedQty) * 100) : 0;

          parsedHistory[dayNum] = {
            day: dayNum,
            plannedEff,
            plannedQty,
            achievedQty,
            achievedEff,
            variancePcs,
            variancePct,
            notes
          };
        }
      }
    }
  }

  // Construct complete 6 days history
  const finalHistory: LearningCurveDayRecord[] = [];
  for (let d = 1; d <= 6; d++) {
    if (parsedHistory[d]) {
      finalHistory.push(parsedHistory[d]);
    } else {
      // Generate standard fallback for missing days
      const defaultEff = [28, 38, 48, 58, 68, 76][d - 1];
      const defaultQty = Math.round((totalAvailMin * (defaultEff / 100)) / effectiveSMV);
      finalHistory.push({
        day: d,
        plannedEff: defaultEff,
        plannedQty: defaultQty,
        achievedQty: 0,
        achievedEff: 0,
        variancePcs: -defaultQty,
        variancePct: -100,
        notes: ''
      });
      warnings.push(`Day ${d} was missing in import; generated baseline target.`);
    }
  }

  if (Object.keys(parsedHistory).length === 0 && !parsedBuildUp) {
    return {
      success: false,
      errors: ['Could not detect valid telemetry rows. Expected columns: Day, PlannedEff, PlannedQty, AchievedQty, Notes'],
      warnings
    };
  }

  return {
    success: true,
    learningCurve: {
      currentDay: 1,
      history: finalHistory,
      notes: 'Imported telemetry configuration'
    },
    buildUp: parsedBuildUp,
    errors,
    warnings
  };
}

/**
 * Parse an uploaded File (CSV or Excel XLSX/XLS)
 */
export async function parseTelemetryFile(
  file: File,
  smv: number = 18.5,
  totalMP: number = 40,
  hours: number = 8
): Promise<TelemetryParseResult> {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[firstSheetName];
          const csvText = XLSX.utils.sheet_to_csv(sheet);
          resolve(parseTelemetryCSV(csvText, smv, totalMP, hours));
        } catch (err: any) {
          resolve({
            success: false,
            errors: [`Failed to parse Excel workbook: ${err?.message || 'Unknown error'}`],
            warnings: []
          });
        }
      };
      reader.onerror = () => {
        resolve({
          success: false,
          errors: ['Failed to read uploaded file.'],
          warnings: []
        });
      };
      reader.readAsArrayBuffer(file);
    });
  } else {
    // Treat as plain text / CSV
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = (e.target?.result as string) || '';
        resolve(parseTelemetryCSV(text, smv, totalMP, hours));
      };
      reader.onerror = () => {
        resolve({
          success: false,
          errors: ['Failed to read uploaded CSV file.'],
          warnings: []
        });
      };
      reader.readAsText(file);
    });
  }
}

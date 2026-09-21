/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as XLSX from 'xlsx';
import { LineEntry, LineStatus, LineManpower } from '../types';

export interface ValidatedLineRow {
  rowIndex: number; // 1-indexed (excluding header)
  rawRow: Record<string, string>;
  status: 'valid' | 'warning' | 'error';
  errors: string[];
  warnings: string[];
  parsedData: {
    lineNo: string;
    floor: string;
    apartment?: string;
    buyer: string;
    style: string;
    smv: number;
    plannedMP: number;
    workingHours: number;
    targetEff: number;
    targetProd: number;
    machineCount: number;
    status: LineStatus;
    operators: number;
    helpers: number;
    ironMan: number;
    orderQty: number;
    wip: number;
    remarks: string;
    date?: string;
  };
}

export interface CSVValidationResult {
  headers: string[];
  matchedFields: Record<string, string>; // original header -> mapped canonical field
  missingRequiredFields: string[];
  validatedRows: ValidatedLineRow[];
  totalRows: number;
  validCount: number;
  warningCount: number;
  errorCount: number;
}

// Canonical field mapping
const FIELD_ALIASES: Record<string, string> = {
  // lineNo
  lineno: 'lineNo',
  line_no: 'lineNo',
  line: 'lineNo',
  linenumber: 'lineNo',
  'line number': 'lineNo',
  'line #': 'lineNo',
  line_id: 'lineNo',
  lineid: 'lineNo',

  // floor
  floor: 'floor',
  floor_name: 'floor',
  'floor name': 'floor',
  location: 'floor',
  building: 'floor',
  unit: 'floor',

  // apartment / bay / section
  apartment: 'apartment',
  bay: 'apartment',
  section: 'apartment',
  zone: 'apartment',

  // buyer
  buyer: 'buyer',
  customer: 'buyer',
  brand: 'buyer',
  'buyer name': 'buyer',

  // style
  style: 'style',
  'style name': 'style',
  'style no': 'style',
  styleno: 'style',
  item: 'style',
  garment: 'style',
  product: 'style',

  // smv (Standard Minute Value / SAM)
  smv: 'smv',
  sam: 'smv',
  'standard minute value': 'smv',
  'standard minutes': 'smv',
  standardminute: 'smv',

  // plannedMP
  plannedmp: 'plannedMP',
  planned_mp: 'plannedMP',
  mp: 'plannedMP',
  manpower: 'plannedMP',
  'planned manpower': 'plannedMP',
  totalmp: 'plannedMP',
  'total mp': 'plannedMP',
  operators_total: 'plannedMP',

  // workingHours
  workinghours: 'workingHours',
  working_hours: 'workingHours',
  hours: 'workingHours',
  'work hours': 'workingHours',
  'shift hours': 'workingHours',
  shifthours: 'workingHours',

  // targetEff
  targeteff: 'targetEff',
  target_eff: 'targetEff',
  targetefficiency: 'targetEff',
  'target efficiency': 'targetEff',
  efficiency: 'targetEff',
  'eff%': 'targetEff',
  'target%': 'targetEff',

  // targetProd
  targetprod: 'targetProd',
  target_prod: 'targetProd',
  target: 'targetProd',
  'daily target': 'targetProd',
  'target production': 'targetProd',
  targetpcs: 'targetProd',
  'target pcs': 'targetProd',

  // machineCount
  machinecount: 'machineCount',
  machine_count: 'machineCount',
  machines: 'machineCount',
  'machine count': 'machineCount',
  'total machines': 'machineCount',

  // status
  status: 'status',
  'line status': 'status',
  state: 'status',

  // operators
  operators: 'operators',
  operator: 'operators',
  'operator count': 'operators',
  sewing_operators: 'operators',

  // helpers
  helpers: 'helpers',
  helper: 'helpers',
  'helper count': 'helpers',

  // ironMan
  ironman: 'ironMan',
  'iron man': 'ironMan',
  iron_man: 'ironMan',
  ironers: 'ironMan',

  // orderQty
  orderqty: 'orderQty',
  order_qty: 'orderQty',
  'order quantity': 'orderQty',
  'order qty': 'orderQty',

  // wip
  wip: 'wip',
  'work in progress': 'wip',
  'wip pcs': 'wip',

  // remarks
  remarks: 'remarks',
  remark: 'remarks',
  notes: 'remarks',
  comment: 'remarks',
  comments: 'remarks',

  // date
  date: 'date',
  production_date: 'date',
  'production date': 'date'
};

/**
 * Robust CSV / TSV / Semicolon-delimited parser supporting quoted fields
 */
export function parseCSV(rawText: string): { headers: string[]; rows: string[][] } {
  // Strip UTF-8 BOM if present
  let text = rawText.replace(/^\uFEFF/, '').trim();
  if (!text) return { headers: [], rows: [] };

  // Detect delimiter (tab, semicolon, or comma)
  const firstLine = text.split(/\r?\n/)[0] || '';
  let delimiter = ',';
  if (firstLine.includes('\t') && (firstLine.match(/\t/g)?.length || 0) >= (firstLine.match(/,/g)?.length || 0)) {
    delimiter = '\t';
  } else if (firstLine.includes(';') && (firstLine.match(/;/g)?.length || 0) > (firstLine.match(/,/g)?.length || 0)) {
    delimiter = ';';
  }

  // Parse lines considering quoted fields
  const lines: string[] = [];
  let currentLine = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentLine += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((char === '\r' && nextChar === '\n') || char === '\n') {
      if (inQuotes) {
        currentLine += '\n';
      } else {
        lines.push(currentLine);
        currentLine = '';
        if (char === '\r' && nextChar === '\n') i++;
      }
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim()) {
    lines.push(currentLine);
  }

  if (lines.length === 0) return { headers: [], rows: [] };

  // Split each line into fields by delimiter
  const parseRow = (line: string): string[] => {
    const fields: string[] = [];
    let field = '';
    let inQ = false;

    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      const nextC = line[i + 1];

      if (c === '"') {
        if (inQ && nextC === '"') {
          field += '"';
          i++;
        } else {
          inQ = !inQ;
        }
      } else if (c === delimiter && !inQ) {
        fields.push(field.trim());
        field = '';
      } else {
        field += c;
      }
    }
    fields.push(field.trim());
    return fields;
  };

  const rawHeaders = parseRow(lines[0]);
  const headers = rawHeaders.map(h => h.replace(/^["']|["']$/g, '').trim());

  const rows = lines
    .slice(1)
    .filter(l => l.trim().length > 0)
    .map(parseRow);

  return { headers, rows };
}

/**
 * Validate parsed CSV rows against sewing line configuration standards
 */
export function validateCSVData(
  headers: string[],
  rows: string[][],
  existingLines: LineEntry[] = [],
  activeDate: string = new Date().toISOString().split('T')[0]
): CSVValidationResult {
  const matchedFields: Record<string, string> = {};
  const foundCanonicalFields = new Set<string>();

  headers.forEach(header => {
    const clean = header.toLowerCase().replace(/[\s_-]+/g, ' ').trim();
    const cleanNoSpace = header.toLowerCase().replace(/[\s_-]+/g, '');
    const canonical = FIELD_ALIASES[clean] || FIELD_ALIASES[cleanNoSpace];
    if (canonical) {
      matchedFields[header] = canonical;
      foundCanonicalFields.add(canonical);
    }
  });

  const missingRequiredFields: string[] = [];
  if (!foundCanonicalFields.has('lineNo')) missingRequiredFields.push('Line No');
  if (!foundCanonicalFields.has('buyer')) missingRequiredFields.push('Buyer');
  if (!foundCanonicalFields.has('style')) missingRequiredFields.push('Style');

  const existingLineNos = new Map<string, LineEntry>();
  existingLines.forEach(l => {
    existingLineNos.set(l.lineNo.trim().toLowerCase(), l);
  });

  const seenInCsv = new Set<string>();
  const validatedRows: ValidatedLineRow[] = [];

  let validCount = 0;
  let warningCount = 0;
  let errorCount = 0;

  rows.forEach((rowValues, index) => {
    const rowIndex = index + 1;
    const rawRow: Record<string, string> = {};
    const rowCanonicalData: Record<string, string> = {};

    headers.forEach((h, hIdx) => {
      const val = (rowValues[hIdx] || '').replace(/^["']|["']$/g, '').trim();
      rawRow[h] = val;
      const canonical = matchedFields[h];
      if (canonical) {
        rowCanonicalData[canonical] = val;
      }
    });

    // If completely empty row, skip
    if (Object.values(rawRow).every(v => !v)) return;

    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Line No validation
    const rawLineNo = rowCanonicalData['lineNo'] || '';
    let lineNo = rawLineNo.trim();
    if (!lineNo) {
      errors.push('Missing required Line Number');
    } else {
      const normLineNo = lineNo.toLowerCase();
      if (seenInCsv.has(normLineNo)) {
        errors.push(`Duplicate Line Number "${lineNo}" repeated in CSV dataset`);
      } else {
        seenInCsv.add(normLineNo);
      }

      if (existingLineNos.has(normLineNo)) {
        warnings.push(`Line "${lineNo}" already exists in factory database (will update existing configuration)`);
      }
    }

    // 2. Floor validation
    let floor = rowCanonicalData['floor'] || '';
    if (!floor) {
      floor = 'Floor 01 (Padma)';
      warnings.push('Floor not specified; assigned default "Floor 01 (Padma)"');
    }

    // 3. Buyer validation
    let buyer = rowCanonicalData['buyer'] || '';
    if (!buyer) {
      buyer = 'Standard Buyer';
      warnings.push('Buyer not specified; defaulted to "Standard Buyer"');
    }

    // 4. Style validation
    let style = rowCanonicalData['style'] || '';
    if (!style) {
      errors.push('Missing required Style description / code');
    }

    // 5. SMV (Standard Minute Value) validation
    const rawSmv = rowCanonicalData['smv'] || '';
    let smv = parseFloat(rawSmv);
    if (!rawSmv || isNaN(smv) || smv <= 0) {
      errors.push(`Invalid SMV value "${rawSmv}". Must be a positive decimal or number (e.g. 14.5 or 0.85)`);
      smv = 12.0;
    } else if (smv > 120) {
      warnings.push(`SMV (${smv} min) is unusually high (>120 min) for standard apparel sewing`);
    } else if (smv < 0.1) {
      warnings.push(`SMV (${smv} min) is unusually low (<0.1 min)`);
    }

    // 6. Planned MP (Manpower) validation
    const rawMP = rowCanonicalData['plannedMP'] || '';
    let plannedMP = parseInt(rawMP, 10);
    if (!rawMP || isNaN(plannedMP) || plannedMP <= 0) {
      errors.push(`Invalid Manpower "${rawMP}". Must be a positive integer (e.g. 38)`);
      plannedMP = 36;
    } else if (plannedMP > 150) {
      warnings.push(`Planned Manpower (${plannedMP}) is unusually large for a single sewing line`);
    }

    // 7. Working Hours validation
    const rawHours = rowCanonicalData['workingHours'] || '';
    let workingHours = parseFloat(rawHours);
    if (!rawHours || isNaN(workingHours) || workingHours <= 0) {
      workingHours = 8;
      if (rawHours) warnings.push(`Invalid Working Hours "${rawHours}"; defaulted to standard 8 hrs`);
    } else if (workingHours > 24) {
      errors.push('Working hours cannot exceed 24 hours per day');
    }

    // 8. Target Efficiency %
    const rawEff = (rowCanonicalData['targetEff'] || '').replace('%', '');
    let targetEff = parseFloat(rawEff);
    if (!rawEff || isNaN(targetEff) || targetEff <= 0) {
      targetEff = 85;
      if (rawEff) warnings.push(`Invalid Target Efficiency "${rawEff}"; defaulted to standard 85%`);
    } else {
      // If user provided 0.85 instead of 85, convert
      if (targetEff > 0 && targetEff <= 1) {
        targetEff = Math.round(targetEff * 100);
      }
      if (targetEff > 150) {
        warnings.push(`Target efficiency (${targetEff}%) exceeds standard realistic ceiling of 150%`);
      }
    }

    // 9. Target Production Pcs (Auto-calculated via standard IE formula if missing)
    const rawTarget = rowCanonicalData['targetProd'] || '';
    let targetProd = parseInt(rawTarget, 10);
    if (!rawTarget || isNaN(targetProd) || targetProd <= 0) {
      // Standard IE Capacity Formula: (MP * Hours * 60 * TargetEff%) / SMV
      targetProd = Math.round((plannedMP * workingHours * 60 * (targetEff / 100)) / smv);
      if (targetProd <= 0) targetProd = 1000;
      warnings.push(`Target production auto-calculated using IE formula: ${targetProd} pcs/day`);
    }

    // 10. Machine Count
    const rawMachines = rowCanonicalData['machineCount'] || '';
    let machineCount = parseInt(rawMachines, 10);
    if (!rawMachines || isNaN(machineCount) || machineCount < 0) {
      machineCount = Math.max(1, plannedMP - Math.round(plannedMP * 0.15));
    }

    // 11. Status
    const rawStatus = (rowCanonicalData['status'] || '').toLowerCase();
    let status: LineStatus = 'Active';
    if (rawStatus === 'maintenance' || rawStatus === 'maint') {
      status = 'Maintenance';
    } else if (rawStatus === 'stopped' || rawStatus === 'inactive' || rawStatus === 'idle') {
      status = 'Stopped';
    }

    // 12. Manpower Sub-allocations (operators, helpers, ironMan)
    const rawOps = rowCanonicalData['operators'] || '';
    let operators = parseInt(rawOps, 10);
    if (isNaN(operators) || operators <= 0) {
      operators = Math.max(1, Math.round(plannedMP * 0.75));
    }

    const rawHelpers = rowCanonicalData['helpers'] || '';
    let helpers = parseInt(rawHelpers, 10);
    if (isNaN(helpers) || helpers < 0) {
      helpers = Math.max(1, Math.round(plannedMP * 0.18));
    }

    const rawIron = rowCanonicalData['ironMan'] || '';
    let ironMan = parseInt(rawIron, 10);
    if (isNaN(ironMan) || ironMan < 0) {
      ironMan = Math.max(1, plannedMP - operators - helpers);
    }

    // 13. Other optional fields
    const apartment = rowCanonicalData['apartment'] || undefined;
    const orderQty = parseInt(rowCanonicalData['orderQty'] || '', 10) || 15000;
    const wip = parseInt(rowCanonicalData['wip'] || '', 10) || Math.round(targetProd * 0.25);
    const remarks = rowCanonicalData['remarks'] || 'Imported via CSV Line Setup';
    const date = rowCanonicalData['date'] || activeDate;

    // Determine row status
    let rowStatus: 'valid' | 'warning' | 'error' = 'valid';
    if (errors.length > 0) {
      rowStatus = 'error';
      errorCount++;
    } else if (warnings.length > 0) {
      rowStatus = 'warning';
      warningCount++;
    } else {
      validCount++;
    }

    validatedRows.push({
      rowIndex,
      rawRow,
      status: rowStatus,
      errors,
      warnings,
      parsedData: {
        lineNo,
        floor,
        apartment,
        buyer,
        style,
        smv,
        plannedMP,
        workingHours,
        targetEff,
        targetProd,
        machineCount,
        status,
        operators,
        helpers,
        ironMan,
        orderQty,
        wip,
        remarks,
        date
      }
    });
  });

  return {
    headers,
    matchedFields,
    missingRequiredFields,
    validatedRows,
    totalRows: validatedRows.length,
    validCount,
    warningCount,
    errorCount
  };
}

/**
 * Converts a validated row into a fully-fledged, production-ready LineEntry
 */
export function convertValidatedRowToLineEntry(
  row: ValidatedLineRow,
  defaultDate: string,
  idSeed: number
): LineEntry {
  const data = row.parsedData;
  const cycleTimeSec = parseFloat(((data.smv * 60) / Math.max(1, data.operators)).toFixed(1));
  const targetCTSec = parseFloat((cycleTimeSec * 0.95).toFixed(1));

  const mpBreakdown: LineManpower = {
    Operator: { present: data.operators, absent: 0 },
    Helper: { present: data.helpers, absent: 0 },
    'Iron Man': { present: data.ironMan, absent: 0 }
  };

  return {
    id: idSeed,
    date: data.date || defaultDate,
    lineNo: data.lineNo,
    floor: data.floor,
    apartment: data.apartment,
    isActive: data.status !== 'Stopped',
    status: data.status,
    buyer: data.buyer,
    style: data.style,
    smv: data.smv,
    plannedMP: data.plannedMP,
    workingHours: data.workingHours,
    targetEff: data.targetEff,
    targetProd: data.targetProd,
    achievedProd: data.status === 'Active' ? Math.round(data.targetProd * 0.88) : 0,
    efficiency: data.status === 'Active' ? data.targetEff : 0,
    remarks: data.remarks,
    orderQty: data.orderQty,
    dailyInput: data.targetProd,
    dailyOutput: data.status === 'Active' ? Math.round(data.targetProd * 0.88) : 0,
    wip: data.wip,
    machineCount: data.machineCount,
    balancingGraph: 'day2',
    nextStyle: '',
    nextStyleDate: '',
    mp: mpBreakdown,
    balanceMethod: 'IE Workstation Balancing',
    balanceNotes: 'Line configuration established via CSV import batch',
    top5: {
      held: 'yes',
      attendance: 98,
      items: [
        'Line balancing verified against SMV breakdown',
        'Needle guards and pressure feet checked',
        'Hourly target board configured',
        'Quality control audit checkpoints mapped',
        'Material feeder buffer stocked'
      ],
      notes: 'Initial production shift kickoff completed'
    },
    bottleneck: {
      station: 'Critical Assembly Station',
      cycleTime: cycleTimeSec,
      targetCT: targetCTSec,
      status: 'ok',
      action: 'Standard method instructions verified'
    },
    timeStudy: {
      done: 'yes',
      type: 'both',
      observedRate: Math.round(data.targetProd / data.workingHours),
      standardRate: Math.round((data.targetProd / data.workingHours) * 1.05),
      findings: 'Imported line baseline operational values established'
    },
    buildUp: {
      day: '1',
      plannedPct: 60,
      achievedPct: 58,
      operators: data.operators,
      notes: 'Ramp-up schedule initiated'
    },
    lineIE: {
      name: 'Line IE Executive',
      level: 'executive',
      period: 'daily',
      weeklyNotes: 'Imported line commissioned successfully'
    },
    teamMembers: [
      {
        id: `tm-sup-${idSeed}`,
        name: `Supervisor (${data.lineNo})`,
        role: 'Line Supervisor',
        skillGrade: 'A+',
        shift: 'General',
        efficiencyRating: 95
      },
      {
        id: `tm-ie-${idSeed}`,
        name: `IE Specialist (${data.lineNo})`,
        role: 'Line IE Lead',
        skillGrade: 'A+',
        shift: 'General',
        efficiencyRating: 96
      },
      {
        id: `tm-mech-${idSeed}`,
        name: `Mechanic (${data.lineNo})`,
        role: 'Maintenance Mechanic',
        skillGrade: 'A',
        shift: 'General',
        efficiencyRating: 92
      }
    ]
  };
}

/**
 * Standard Garment Line Setup CSV template content with realistic demonstration data
 */
export const SAMPLE_CSV_LINES = `Line No,Floor,Apartment,Buyer,Style,SMV,Planned MP,Working Hours,Target Eff%,Target Prod,Machine Count,Status,Operators,Helpers,Iron Man,Remarks
Line 35,Floor 01 (Padma),Bay A-1,H&M,TS-4200 Heavyweight Crewneck,14.5,38,8,85,1340,32,Active,28,7,3,New autumn order commissioning
Line 36,Floor 01 (Padma),Bay A-2,Target,JK-9100 Puffer Vest,22.8,42,8,80,885,38,Active,32,7,3,Down-fill baffle assembly line
Line 37,Floor 02 (Meghna),Bay B-1,Zara,BL-3020 Embroidered Blouse,18.2,36,8,82,975,30,Active,27,6,3,Delicate chiffon fabrication
Line 38,Floor 02 (Meghna),Bay B-2,Next UK,TR-5500 Chino Trouser,24.0,45,8,85,955,40,Active,34,8,3,Double-needle waistband setup
Line 39,Floor 03 (Karnophuli),Bay C-1,Debonair Private Label,SW-1100 Raglan Sweatshirt,16.4,40,8,85,1245,35,Active,30,7,3,Rib cuff overlock stations
Line 40,Floor 03 (Karnophuli),Bay C-2,Levi's,DN-8800 Stretch Denim,26.5,48,8,80,870,44,Maintenance,36,9,3,Scheduled folder calibration`;

/**
 * Check if a file is an Excel spreadsheet (.xlsx, .xls)
 */
export function isExcelFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    name.endsWith('.xlsx') ||
    name.endsWith('.xls') ||
    file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    file.type === 'application/vnd.ms-excel'
  );
}

/**
 * Parse an Excel workbook (.xlsx, .xls) using SheetJS
 * Converts selected worksheet directly into standardized CSV text for validator
 */
export async function parseExcelFile(
  file: File,
  sheetIndexOrName?: number | string
): Promise<{
  text: string;
  sheetNames: string[];
  activeSheet: string;
  totalSheets: number;
  rowCount: number;
}> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const sheetNames = workbook.SheetNames;

  if (sheetNames.length === 0) {
    throw new Error('The uploaded Excel workbook contains no readable worksheets.');
  }

  let activeSheet: string;
  if (typeof sheetIndexOrName === 'string' && sheetNames.includes(sheetIndexOrName)) {
    activeSheet = sheetIndexOrName;
  } else if (typeof sheetIndexOrName === 'number' && sheetNames[sheetIndexOrName]) {
    activeSheet = sheetNames[sheetIndexOrName];
  } else {
    activeSheet = sheetNames[0];
  }

  const worksheet = workbook.Sheets[activeSheet];
  const csvText = XLSX.utils.sheet_to_csv(worksheet, { blankrows: false });
  const lines = csvText.trim().split(/\r?\n/).filter(l => l.trim().length > 0);
  const rowCount = Math.max(0, lines.length - 1);

  return {
    text: csvText,
    sheetNames,
    activeSheet,
    totalSheets: sheetNames.length,
    rowCount
  };
}

/**
 * Generate and download a formatted Microsoft Excel (.xlsx) Line Setup Template
 * includes sample line configurations and a second Data Dictionary specification sheet
 */
export function exportExcelTemplate(fileName = 'Sewing_Line_Setup_Template.xlsx'): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Line_Configurations
  const data = [
    [
      'Line No',
      'Floor',
      'Apartment',
      'Buyer',
      'Style',
      'SMV',
      'Planned MP',
      'Working Hours',
      'Target Eff%',
      'Target Prod',
      'Machine Count',
      'Status',
      'Operators',
      'Helpers',
      'Iron Man',
      'Remarks'
    ],
    [
      'Line 35',
      'Floor 01 (Padma)',
      'Bay A-1',
      'H&M',
      'TS-4200 Heavyweight Crewneck',
      14.5,
      38,
      8,
      85,
      1340,
      32,
      'Active',
      28,
      7,
      3,
      'New autumn order commissioning'
    ],
    [
      'Line 36',
      'Floor 01 (Padma)',
      'Bay A-2',
      'Target',
      'JK-9100 Puffer Vest',
      22.8,
      42,
      8,
      80,
      885,
      38,
      'Active',
      32,
      7,
      3,
      'Down-fill baffle assembly line'
    ],
    [
      'Line 37',
      'Floor 02 (Meghna)',
      'Bay B-1',
      'Zara',
      'BL-3020 Embroidered Blouse',
      18.2,
      36,
      8,
      82,
      975,
      30,
      'Active',
      27,
      6,
      3,
      'Delicate chiffon fabrication'
    ],
    [
      'Line 38',
      'Floor 02 (Meghna)',
      'Bay B-2',
      'Next UK',
      'TR-5500 Chino Trouser',
      24.0,
      45,
      8,
      85,
      955,
      40,
      'Active',
      34,
      8,
      3,
      'Double-needle waistband setup'
    ],
    [
      'Line 39',
      'Floor 03 (Karnophuli)',
      'Bay C-1',
      'Debonair Private Label',
      'SW-1100 Raglan Sweatshirt',
      16.4,
      40,
      8,
      85,
      1245,
      35,
      'Active',
      30,
      7,
      3,
      'Rib cuff overlock stations'
    ],
    [
      'Line 40',
      'Floor 03 (Karnophuli)',
      'Bay C-2',
      "Levi's",
      'DN-8800 Stretch Denim',
      26.5,
      48,
      8,
      80,
      870,
      44,
      'Maintenance',
      36,
      9,
      3,
      'Scheduled folder calibration'
    ]
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [
    { wch: 12 }, // Line No
    { wch: 20 }, // Floor
    { wch: 12 }, // Apartment
    { wch: 18 }, // Buyer
    { wch: 28 }, // Style
    { wch: 8 },  // SMV
    { wch: 12 }, // Planned MP
    { wch: 14 }, // Working Hours
    { wch: 12 }, // Target Eff%
    { wch: 12 }, // Target Prod
    { wch: 14 }, // Machine Count
    { wch: 12 }, // Status
    { wch: 10 }, // Operators
    { wch: 10 }, // Helpers
    { wch: 10 }, // Iron Man
    { wch: 32 }  // Remarks
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Line_Configurations');

  // Sheet 2: Field Specifications & Data Dictionary
  const guideData = [
    ['Field Header', 'Required?', 'Data Type', 'Accepted Header Aliases', 'Validation Rules & Factory Engineering Logic'],
    ['Line No', 'YES', 'Text/Number', 'Line No, Line, Line #, LineID, LineNumber', 'Unique sewing line code (e.g. "Line 25", "31"). Cannot be empty.'],
    ['Buyer', 'YES', 'Text', 'Buyer, Customer, Brand, Buyer Name', 'Garment buyer / retail brand name.'],
    ['Style', 'YES', 'Text', 'Style, Style No, Style Name, Item, Product', 'Running style description or code.'],
    ['Floor', 'NO (Default)', 'Text', 'Floor, Building, Unit, Location', 'Factory floor / unit name. Defaults to "Floor 01 (Padma)" if omitted.'],
    ['Apartment', 'NO', 'Text', 'Apartment, Bay, Section, Zone', 'Bay or zone code in the physical factory layout (e.g. "Bay A-1").'],
    ['SMV', 'NO (Calc)', 'Decimal', 'SMV, SAM, Standard Minute Value, Standard Minutes', 'Standard Minute Value per piece. Must be > 0.'],
    ['Planned MP', 'NO (Calc)', 'Integer', 'Planned MP, MP, Manpower, Total MP', 'Total planned line headcount.'],
    ['Working Hours', 'NO (Default)', 'Decimal', 'Working Hours, Shift Hours, Hours', 'Shift working hours (default: 8.0 hrs). Max: 24 hrs.'],
    ['Target Eff%', 'NO (Default)', 'Number', 'Target Eff%, Target Efficiency, Efficiency, Eff%', 'Planned target efficiency % (default: 85%). Values <= 1 are treated as decimals.'],
    ['Target Prod', 'NO (Auto-calc)', 'Integer', 'Target Prod, Daily Target, Target Pcs, Target', 'Daily target pcs. Auto-calculated via standard formula if missing.'],
    ['Machine Count', 'NO (Auto-calc)', 'Integer', 'Machine Count, Machines, Total Machines', 'Total machines installed. Defaults to Planned MP - 15%.'],
    ['Status', 'NO (Default)', 'Text', 'Status, Line Status, State', '"Active", "Maintenance", or "Stopped".'],
    ['Operators', 'NO (Auto-calc)', 'Integer', 'Operators, Sewing Operators, Operator Count', 'Sewing operators. Defaults to ~75% of Planned MP.'],
    ['Helpers', 'NO (Auto-calc)', 'Integer', 'Helpers, Helper Count', 'Feeders / helpers. Defaults to ~15% of Planned MP.'],
    ['Iron Man', 'NO (Auto-calc)', 'Integer', 'Iron Man, Ironers', 'Ironing / finishing pressers. Defaults to ~10% of Planned MP.'],
    ['Remarks', 'NO', 'Text', 'Remarks, Notes, Comments', 'Notes, PO numbers, or ramp-up stage comments.']
  ];

  const wsGuide = XLSX.utils.aoa_to_sheet(guideData);
  wsGuide['!cols'] = [
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
    { wch: 45 },
    { wch: 65 }
  ];
  XLSX.utils.book_append_sheet(wb, wsGuide, 'Field_Specifications');

  XLSX.writeFile(wb, fileName);
}

/**
 * Download standard CSV template
 */
export function downloadCSVTemplate(fileName = 'sewing_line_configuration_template.csv'): void {
  const blob = new Blob([SAMPLE_CSV_LINES], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

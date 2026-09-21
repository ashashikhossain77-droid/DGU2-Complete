/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useMemo } from 'react';
import {
  X,
  Database,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  FileSpreadsheet,
  Copy,
  Check,
  Filter,
  Layers,
  ArrowRight,
  Info,
  Sparkles,
  FileText,
  Search,
  FileUp,
  Table,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  SlidersHorizontal,
  CheckSquare
} from 'lucide-react';
import { LineEntry, ChecklistMap, TodoItem, LeanActionItem } from '../types';
import {
  parseCSV,
  validateCSVData,
  convertValidatedRowToLineEntry,
  SAMPLE_CSV_LINES,
  ValidatedLineRow,
  CSVValidationResult,
  isExcelFile,
  parseExcelFile,
  exportExcelTemplate,
  downloadCSVTemplate
} from '../utils/csvLineImporter';

interface DatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  lines: LineEntry[];
  checklists: ChecklistMap;
  todos: TodoItem[];
  leanActions: LeanActionItem[];
  onRestoreData: (data: any) => void;
  onResetFactoryData: () => void;
  activeDataset?: string;
  onLoadDebonairData?: () => void;
  onImportLines?: (importedLines: LineEntry[], mode?: 'upsert' | 'append' | 'replace') => void;
  activeDate?: string;
  initialTab?: 'backup' | 'csv-import';
}

export const DatabaseModal: React.FC<DatabaseModalProps> = ({
  isOpen,
  onClose,
  lines,
  checklists,
  todos,
  leanActions,
  onRestoreData,
  onResetFactoryData,
  activeDataset = 'debonair_sep17',
  onLoadDebonairData,
  onImportLines,
  activeDate = '2026-09-17',
  initialTab = 'backup'
}) => {
  const [activeTab, setActiveTab] = useState<'backup' | 'csv-import'>(initialTab);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);
  const csvFileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // CSV / Excel State
  const [csvRawText, setCsvRawText] = useState<string>('');
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [fileFormat, setFileFormat] = useState<'excel' | 'csv' | 'pasted' | null>(null);
  const [excelFileRef, setExcelFileRef] = useState<File | null>(null);
  const [excelSheetNames, setExcelSheetNames] = useState<string[]>([]);
  const [selectedExcelSheet, setSelectedExcelSheet] = useState<string>('');
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const [inputMode, setInputMode] = useState<'upload' | 'paste'>('upload');
  const [filterStatus, setFilterStatus] = useState<'all' | 'valid' | 'warning' | 'error'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFieldMapping, setShowFieldMapping] = useState<boolean>(false);
  const [importMode, setImportMode] = useState<'upsert' | 'append' | 'replace'>('upsert');
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);

  // Parse and validate CSV data
  const validationResult: CSVValidationResult = useMemo(() => {
    if (!csvRawText.trim()) {
      return {
        headers: [],
        matchedFields: {},
        missingRequiredFields: [],
        validatedRows: [],
        totalRows: 0,
        validCount: 0,
        warningCount: 0,
        errorCount: 0
      };
    }

    const { headers, rows } = parseCSV(csvRawText);
    return validateCSVData(headers, rows, lines, activeDate);
  }, [csvRawText, lines, activeDate]);

  if (!isOpen) return null;

  // Handlers for JSON Backup
  const handleExportJSON = () => {
    const backup = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      lines,
      checklists,
      todos,
      leanActions
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ie_daily_control_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.lines && parsed.checklists) {
          onRestoreData(parsed);
          alert('Database restored successfully from backup file!');
          onClose();
        } else {
          alert('Invalid backup file schema.');
        }
      } catch (err) {
        alert('Failed to parse backup JSON.');
      }
    };
    reader.readAsText(file);
  };

  // Process File Upload (Supports both Excel .xlsx / .xls and CSV / TSV / text)
  const processUploadedFile = async (file: File) => {
    setIsProcessingFile(true);
    setFileError(null);
    setCsvFileName(file.name);
    setImportSuccessMessage(null);

    try {
      if (isExcelFile(file)) {
        setFileFormat('excel');
        setExcelFileRef(file);
        const parsed = await parseExcelFile(file);
        setExcelSheetNames(parsed.sheetNames);
        setSelectedExcelSheet(parsed.activeSheet);
        setCsvRawText(parsed.text);
      } else {
        setFileFormat('csv');
        setExcelFileRef(null);
        setExcelSheetNames([]);
        setSelectedExcelSheet('');
        const reader = new FileReader();
        reader.onload = event => {
          const text = event.target?.result as string;
          setCsvRawText(text || '');
        };
        reader.onerror = () => {
          setFileError('Could not read the uploaded file.');
        };
        reader.readAsText(file);
      }
    } catch (err: any) {
      setFileError(err?.message || 'Failed to parse spreadsheet file. Please verify file integrity.');
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setInputMode('upload');
      processUploadedFile(file);
    }
  };

  // Switch sheet in Excel workbook
  const handleSheetChange = async (sheetName: string) => {
    if (!excelFileRef) return;
    setIsProcessingFile(true);
    setFileError(null);
    try {
      const parsed = await parseExcelFile(excelFileRef, sheetName);
      setSelectedExcelSheet(sheetName);
      setCsvRawText(parsed.text);
    } catch (err: any) {
      setFileError(err?.message || 'Failed to read the selected Excel worksheet.');
    } finally {
      setIsProcessingFile(false);
    }
  };

  // Load sample template into CSV
  const handleLoadSample = () => {
    setCsvRawText(SAMPLE_CSV_LINES);
    setCsvFileName('sample_garment_line_configurations.csv');
    setFileFormat('csv');
    setExcelFileRef(null);
    setExcelSheetNames([]);
    setSelectedExcelSheet('');
    setFileError(null);
    setImportSuccessMessage(null);
  };

  const handleDownloadExcelTemplate = () => {
    exportExcelTemplate('Sewing_Line_Configuration_Template.xlsx');
  };

  const handleDownloadCsvTemplate = () => {
    downloadCSVTemplate('sewing_line_configuration_template.csv');
  };

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(SAMPLE_CSV_LINES);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2000);
  };

  const handleClearCsv = () => {
    setCsvRawText('');
    setCsvFileName(null);
    setFileFormat(null);
    setExcelFileRef(null);
    setExcelSheetNames([]);
    setSelectedExcelSheet('');
    setFileError(null);
    setSearchQuery('');
    setImportSuccessMessage(null);
    if (csvFileInputRef.current) {
      csvFileInputRef.current.value = '';
    }
  };

  // Execution: Import validated rows
  const handleExecuteImport = () => {
    const rowsToImport = validationResult.validatedRows.filter(
      r => r.status === 'valid' || r.status === 'warning'
    );

    if (rowsToImport.length === 0) {
      alert('No valid line configurations available to import. Please review validation errors.');
      return;
    }

    if (importMode === 'replace') {
      const confirmed = confirm(
        `Are you sure you want to REPLACE ALL ${lines.length} current factory lines with ${rowsToImport.length} imported line(s)? This will overwrite current line registries.`
      );
      if (!confirmed) return;
    }

    const timestampSeed = Date.now();
    const importedLineEntries: LineEntry[] = rowsToImport.map((row, idx) =>
      convertValidatedRowToLineEntry(row, activeDate, timestampSeed + idx)
    );

    if (onImportLines) {
      onImportLines(importedLineEntries, importMode);
      setImportSuccessMessage(
        `Successfully imported and validated ${importedLineEntries.length} sewing line configurations into the factory registry using "${importMode === 'upsert' ? 'Update & Add' : importMode === 'append' ? 'Append New Only' : 'Replace All'}" strategy.`
      );
    } else {
      alert(`Imported ${importedLineEntries.length} lines.`);
    }
  };

  // Filter and search rows
  const filteredRows = useMemo(() => {
    return validationResult.validatedRows.filter(row => {
      if (filterStatus !== 'all' && row.status !== filterStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const p = row.parsedData;
        const match =
          p.lineNo.toLowerCase().includes(q) ||
          p.floor.toLowerCase().includes(q) ||
          (p.apartment && p.apartment.toLowerCase().includes(q)) ||
          p.buyer.toLowerCase().includes(q) ||
          p.style.toLowerCase().includes(q) ||
          p.status.toLowerCase().includes(q) ||
          (p.remarks && p.remarks.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [validationResult.validatedRows, filterStatus, searchQuery]);

  const isDebonair = activeDataset === 'debonair_sep17';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div
        className={`bg-[#fbfaf6] border border-[#d9d2c2] rounded-3xl w-full shadow-2xl transition-all duration-200 flex flex-col my-auto ${
          activeTab === 'csv-import' ? 'max-w-5xl max-h-[92vh]' : 'max-w-xl'
        }`}
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between border-b border-[#e7e1d5] p-5 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#176f78] text-white flex items-center justify-center shadow-xs">
              {activeTab === 'csv-import' ? (
                <FileSpreadsheet className="w-5 h-5" />
              ) : (
                <Database className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-lg sm:text-xl font-bold uppercase tracking-tight text-[#17343a]">
                  Factory Database &amp; Line Setup
                </h3>
              </div>
              <p className="text-xs text-[#527078]">
                System backups, factory defaults, and rapid CSV / Excel line commissioning
              </p>
            </div>
          </div>

          <button
            id="close-database-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-[#e7e1d5] text-slate-500 transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#e7e1d5] bg-[#f1eee6]/60 px-5 shrink-0">
          <button
            id="db-tab-backup"
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'backup'
                ? 'border-[#176f78] text-[#176f78] bg-white/60'
                : 'border-transparent text-[#527078] hover:text-[#17343a]'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Database &amp; Backup</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-[#e7e1d5] text-[#527078] font-mono-numbers">
              {lines.length} Lines
            </span>
          </button>

          <button
            id="db-tab-csv-import"
            type="button"
            onClick={() => setActiveTab('csv-import')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer relative ${
              activeTab === 'csv-import'
                ? 'border-[#176f78] text-[#176f78] bg-white/60'
                : 'border-transparent text-[#527078] hover:text-[#17343a]'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Import Lines (CSV / Excel)</span>
            <span className="ml-1 text-[9px] uppercase px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold">
              Line Setup
            </span>
          </button>
        </div>

        {/* TAB 1: Backup & Storage */}
        {activeTab === 'backup' && (
          <div className="p-6 space-y-5 overflow-y-auto">
            <p className="text-xs text-[#527078] leading-relaxed">
              All sewing line telemetries, 12-task daily checklists, floor schedules, and Lean Kaizens are stored locally and synced with high-availability client storage.
            </p>

            {/* Database Records Count */}
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-3.5 rounded-2xl bg-white border border-[#e7e1d5]">
                <div className="text-[10px] text-[#527078] uppercase font-bold">Sewing Lines</div>
                <div className="font-bold text-base text-[#17343a] font-mono-numbers">{lines.length} Records</div>
                <div className="text-[10px] text-[#176f78] mt-0.5">Active across all factory floors</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-white border border-[#e7e1d5]">
                <div className="text-[10px] text-[#527078] uppercase font-bold">Checklists</div>
                <div className="font-bold text-base text-[#17343a] font-mono-numbers">{Object.keys(checklists).length} Days Logged</div>
                <div className="text-[10px] text-[#176f78] mt-0.5">Daily audit checklists</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-white border border-[#e7e1d5]">
                <div className="text-[10px] text-[#527078] uppercase font-bold">Floor Tasks</div>
                <div className="font-bold text-base text-[#17343a] font-mono-numbers">{todos.length} Active</div>
                <div className="text-[10px] text-[#176f78] mt-0.5">Point-of-work IE actions</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-white border border-[#e7e1d5]">
                <div className="text-[10px] text-[#527078] uppercase font-bold">Kaizens Logged</div>
                <div className="font-bold text-base text-[#17343a] font-mono-numbers">{leanActions.length} Actions</div>
                <div className="text-[10px] text-[#176f78] mt-0.5">Lean continuous improvements</div>
              </div>
            </div>

            {/* Factory Production Datasets */}
            <div className="p-4 rounded-2xl bg-[#f1eee6] border border-[#d9d2c2] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#527078]">
                  Factory Dataset Baseline
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#dceceb] text-[#176f78]">
                  Debonair Unit-2 (34 Lines)
                </span>
              </div>

              {onLoadDebonairData && (
                <button
                  type="button"
                  onClick={() => {
                    onLoadDebonairData();
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer bg-[#176f78] text-white border-[#176f78] hover:bg-[#12555c] shadow-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                    <div className="text-left">
                      <div>Reload 17 Sep 2026: Debonair Unit-2</div>
                      <div className="text-[10px] font-normal text-white/80">
                        Full 34 lines across Padma, Meghna, Karnophuli, Korotoya, Shitalokshya, Turag
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-mono-numbers px-2 py-0.5 rounded bg-white/20 shrink-0">
                    34 Lines
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveTab('csv-import')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer bg-white border-[#d9d2c2] text-[#176f78] hover:bg-[#dceceb]"
              >
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-[#176f78]" />
                  <span>Configure New Lines with CSV Import</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#176f78]" />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleExportJSON}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-[#176f78] text-white hover:bg-[#12555c] transition-colors text-xs font-bold cursor-pointer shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Download Full Database Backup (JSON)</span>
              </button>

              <input
                type="file"
                accept=".json"
                ref={jsonFileInputRef}
                onChange={handleImportJSON}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => jsonFileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-white border border-[#d9d2c2] text-[#17343a] hover:bg-[#f1eee6] transition-colors text-xs font-bold cursor-pointer"
              >
                <Upload className="w-4 h-4 text-[#176f78]" />
                <span>Restore Backup File (JSON)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm('Reset all sewing lines and checklists back to factory initial state?')) {
                    onResetFactoryData();
                    onClose();
                  }
                }}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 transition-colors text-xs font-bold cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset to Factory Defaults</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: CSV & Excel Line Importer & Validator */}
        {activeTab === 'csv-import' && (
          <div className="p-5 space-y-4 overflow-y-auto flex-1 flex flex-col">
            {/* Header & Feature Guide */}
            <div className="bg-white border border-[#e7e1d5] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div>
                <div className="flex items-center gap-2 text-[#17343a] font-bold text-sm">
                  <FileSpreadsheet className="w-4 h-4 text-[#176f78]" />
                  <span>Import &amp; Validate Line Configurations (CSV / Excel)</span>
                </div>
                <p className="text-xs text-[#527078] mt-0.5 leading-relaxed">
                  Streamline line setup by uploading Microsoft Excel workbooks (<code className="font-mono text-emerald-700">.xlsx, .xls</code>) or <code className="font-mono text-[#176f78]">.csv</code> spreadsheets. Includes automatic header alias mapping, SMV checks, and IE capacity formula verification.
                </p>
              </div>

              {/* Sample & Template Actions */}
              <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="px-2.5 py-1.5 rounded-xl bg-[#dceceb] hover:bg-[#cbe2e1] text-[#176f78] text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Load 6 pre-configured sample garment lines across multiple floors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Load Sample</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadExcelTemplate}
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  title="Download formatted Microsoft Excel (.xlsx) template with sample data and specification guide"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Template (.xlsx)</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadCsvTemplate}
                  className="px-2.5 py-1.5 rounded-xl bg-white border border-[#d9d2c2] hover:bg-[#f1eee6] text-[#17343a] text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Download standard CSV template"
                >
                  <Download className="w-3.5 h-3.5 text-[#176f78]" />
                  <span className="hidden sm:inline">Template (.csv)</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyTemplate}
                  className="p-1.5 rounded-xl bg-white border border-[#d9d2c2] hover:bg-[#f1eee6] text-[#527078] text-xs font-bold transition-colors cursor-pointer"
                  title="Copy CSV/TSV table to clipboard"
                >
                  {copiedTemplate ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>

                {csvRawText && (
                  <button
                    type="button"
                    onClick={handleClearCsv}
                    className="px-2 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer"
                    title="Clear input data"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Success message banner */}
            {importSuccessMessage && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">
                  <div className="font-bold">Line Configurations Successfully Integrated!</div>
                  <div>{importSuccessMessage}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setImportSuccessMessage(null)}
                  className="text-emerald-700 hover:text-emerald-900 font-bold cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Error banner if file parsing failed */}
            {fileError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">
                  <div className="font-bold">Error Reading Spreadsheet File</div>
                  <div>{fileError}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setFileError(null)}
                  className="text-rose-700 hover:text-rose-900 font-bold cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Input Selection: Upload Spreadsheet vs Paste Raw Text */}
            <div className="space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setInputMode('upload')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                      inputMode === 'upload'
                        ? 'bg-[#176f78] text-white shadow-2xs'
                        : 'bg-[#f1eee6] text-[#527078] hover:text-[#17343a]'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Spreadsheet (Excel / CSV)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode('paste')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                      inputMode === 'paste'
                        ? 'bg-[#176f78] text-white shadow-2xs'
                        : 'bg-[#f1eee6] text-[#527078] hover:text-[#17343a]'
                    }`}
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Paste Tabular / TSV Data</span>
                  </button>
                </div>

                {csvFileName && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold flex items-center gap-1">
                      {fileFormat === 'excel' ? (
                        <>
                          <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                          <span>Excel (.xlsx/.xls)</span>
                        </>
                      ) : (
                        <>
                          <FileText className="w-3 h-3 text-[#176f78]" />
                          <span>CSV / TSV</span>
                        </>
                      )}
                    </span>
                    <span className="text-[11px] text-[#527078] font-mono-numbers truncate max-w-xs">
                      <strong className="text-[#17343a]">{csvFileName}</strong>
                    </span>
                  </div>
                )}
              </div>

              {inputMode === 'upload' ? (
                <div className="space-y-2">
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => csvFileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#d9d2c2] hover:border-[#176f78] bg-[#fbfaf6] hover:bg-[#dceceb]/20 rounded-2xl p-6 text-center cursor-pointer transition-all relative"
                  >
                    <input
                      type="file"
                      accept=".xlsx, .xls, .csv, .tsv, .txt, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/csv, text/tab-separated-values"
                      ref={csvFileInputRef}
                      onChange={handleFileUpload}
                      className="hidden"
                    />

                    {isProcessingFile ? (
                      <div className="py-2 flex flex-col items-center gap-2 text-[#176f78]">
                        <RefreshCw className="w-6 h-6 animate-spin" />
                        <span className="text-xs font-bold">Parsing spreadsheet data...</span>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-2xl bg-[#dceceb] text-[#176f78] flex items-center justify-center mx-auto mb-2">
                          <FileSpreadsheet className="w-6 h-6" />
                        </div>
                        <div className="text-xs font-bold text-[#17343a]">
                          Click to select or drag and drop Excel (.xlsx, .xls) or CSV file here
                        </div>
                        <div className="text-[11px] text-[#527078] mt-1.5 flex items-center justify-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded font-mono text-[10px] font-bold">
                            .xlsx
                          </span>
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded font-mono text-[10px] font-bold">
                            .xls
                          </span>
                          <span className="inline-flex items-center gap-1 bg-[#f1eee6] text-[#17343a] border border-[#d9d2c2] px-1.5 py-0.5 rounded font-mono text-[10px] font-bold">
                            .csv
                          </span>
                          <span className="inline-flex items-center gap-1 bg-[#f1eee6] text-[#17343a] border border-[#d9d2c2] px-1.5 py-0.5 rounded font-mono text-[10px] font-bold">
                            .tsv
                          </span>
                          <span className="text-slate-400">|</span>
                          <span>Auto-detects columns, delimiters, and worksheet tabs</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Multi-sheet Selector if Excel file has multiple sheets */}
                  {excelSheetNames.length > 1 && (
                    <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span className="text-emerald-900 font-bold">Workbook Worksheets:</span>
                        <span className="text-[#527078] text-[11px]">
                          ({excelSheetNames.length} sheets found in workbook)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-[11px] text-[#527078] font-semibold">Active Sheet:</label>
                        <select
                          value={selectedExcelSheet}
                          onChange={e => handleSheetChange(e.target.value)}
                          className="bg-white border border-emerald-300 text-emerald-950 font-bold px-2.5 py-1 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-xs cursor-pointer shadow-2xs"
                        >
                          {excelSheetNames.map(sheet => (
                            <option key={sheet} value={sheet}>
                              {sheet}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <textarea
                    rows={5}
                    value={csvRawText}
                    onChange={e => {
                      setCsvRawText(e.target.value);
                      setFileFormat('pasted');
                      setImportSuccessMessage(null);
                    }}
                    placeholder={`Line No,Floor,Apartment,Buyer,Style,SMV,Planned MP,Working Hours,Target Eff%,Target Prod\nLine 35,Floor 01 (Padma),Bay A-1,H&M,TS-4200 Crewneck,14.5,38,8,85,1340\nLine 36,Floor 01 (Padma),Bay A-2,Target,JK-9100 Vest,22.8,42,8,80,885\nLine 37,Floor 02 (Meghna),Bay B-1,Zara,BL-3020 Blouse,18.2,36,8,82,975`}
                    className="w-full text-xs font-mono bg-white border border-[#d9d2c2] rounded-2xl p-3 focus:border-[#176f78] focus:outline-hidden text-[#17343a] leading-relaxed shadow-inner"
                  />
                  <div className="text-[10px] text-[#527078] mt-1 flex items-center justify-between">
                    <span>You can copy cells directly from Microsoft Excel or Google Sheets (Ctrl+C / Cmd+C) and paste here.</span>
                    <span className="font-mono-numbers">{csvRawText.length} characters</span>
                  </div>
                </div>
              )}
            </div>

            {/* Validation Metrics & Status Summary */}
            {csvRawText && (
              <div className="space-y-3">
                {/* Validation Counters */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-3 rounded-xl bg-white border border-[#e7e1d5] flex items-center justify-between shadow-2xs">
                    <div>
                      <div className="text-[10px] text-[#527078] uppercase font-bold">Total Rows</div>
                      <div className="font-bold text-base text-[#17343a] font-mono-numbers">
                        {validationResult.totalRows}
                      </div>
                    </div>
                    <Layers className="w-4 h-4 text-slate-400" />
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between shadow-2xs">
                    <div>
                      <div className="text-[10px] text-emerald-800 uppercase font-bold">Valid Lines</div>
                      <div className="font-bold text-base text-emerald-700 font-mono-numbers">
                        {validationResult.validCount}
                      </div>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between shadow-2xs">
                    <div>
                      <div className="text-[10px] text-amber-800 uppercase font-bold">Warnings</div>
                      <div className="font-bold text-base text-amber-700 font-mono-numbers">
                        {validationResult.warningCount}
                      </div>
                    </div>
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  </div>

                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between shadow-2xs">
                    <div>
                      <div className="text-[10px] text-rose-800 uppercase font-bold">Errors</div>
                      <div className="font-bold text-base text-rose-700 font-mono-numbers">
                        {validationResult.errorCount}
                      </div>
                    </div>
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                  </div>
                </div>

                {/* Missing required headers banner */}
                {validationResult.missingRequiredFields.length > 0 && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>
                      <strong>Missing required header column(s):</strong>{' '}
                      {validationResult.missingRequiredFields.join(', ')}. Please check your spreadsheet headers.
                    </span>
                  </div>
                )}

                {/* Field Mapping Inspector Toggle */}
                <div className="border border-[#e7e1d5] rounded-xl bg-[#fbfaf6] p-2.5">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setShowFieldMapping(!showFieldMapping)}
                      className="flex items-center gap-2 text-xs font-bold text-[#17343a] hover:text-[#176f78] cursor-pointer"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5 text-[#176f78]" />
                      <span>
                        Header Auto-Mapping ({Object.keys(validationResult.matchedFields).length} recognized columns)
                      </span>
                      {showFieldMapping ? (
                        <ChevronUp className="w-3.5 h-3.5 text-[#527078]" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-[#527078]" />
                      )}
                    </button>

                    <span className="text-[11px] text-[#527078]">
                      {Object.keys(validationResult.matchedFields).length} of {validationResult.headers.length} headers mapped
                    </span>
                  </div>

                  {showFieldMapping && (
                    <div className="mt-2 pt-2 border-t border-[#e7e1d5] space-y-2 text-xs">
                      <div className="flex flex-wrap gap-1.5">
                        {validationResult.headers.map(header => {
                          const canonical = validationResult.matchedFields[header];
                          return (
                            <div
                              key={header}
                              className={`px-2 py-1 rounded-lg border text-[11px] flex items-center gap-1.5 ${
                                canonical
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold'
                                  : 'bg-slate-50 border-slate-200 text-slate-500'
                              }`}
                            >
                              <span className="font-mono">{header}</span>
                              {canonical ? (
                                <>
                                  <ArrowRight className="w-3 h-3 text-emerald-600" />
                                  <span className="font-bold text-[#17343a]">{canonical}</span>
                                </>
                              ) : (
                                <span className="text-[10px] text-slate-400">(ignored)</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-[10px] text-[#527078]">
                        The validator recognizes synonyms like <code className="bg-slate-100 px-1 rounded">SAM</code> for SMV, <code className="bg-slate-100 px-1 rounded">Line #</code> for Line No, and <code className="bg-slate-100 px-1 rounded">Total MP</code> for Planned MP.
                      </p>
                    </div>
                  )}
                </div>

                {/* Table Filter & Search Controls */}
                <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                  <div className="flex items-center gap-1 text-xs flex-wrap">
                    <Filter className="w-3.5 h-3.5 text-[#527078] mr-1" />
                    <button
                      type="button"
                      onClick={() => setFilterStatus('all')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        filterStatus === 'all'
                          ? 'bg-[#17343a] text-white'
                          : 'bg-[#f1eee6] text-[#527078] hover:bg-[#e7e1d5]'
                      }`}
                    >
                      All ({validationResult.totalRows})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterStatus('valid')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        filterStatus === 'valid'
                          ? 'bg-emerald-700 text-white'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      Valid ({validationResult.validCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterStatus('warning')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        filterStatus === 'warning'
                          ? 'bg-amber-700 text-white'
                          : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                      }`}
                    >
                      Warnings ({validationResult.warningCount})
                    </button>
                    {validationResult.errorCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setFilterStatus('error')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          filterStatus === 'error'
                            ? 'bg-rose-700 text-white'
                            : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                        }`}
                      >
                        Errors ({validationResult.errorCount})
                      </button>
                    )}
                  </div>

                  {/* Search bar inside imported batch */}
                  <div className="relative flex items-center">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search line, style, buyer..."
                      className="pl-8 pr-3 py-1 bg-white border border-[#d9d2c2] rounded-xl text-xs text-[#17343a] focus:outline-hidden focus:border-[#176f78] w-48 sm:w-56"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="text-slate-400 hover:text-slate-600 text-xs px-1.5"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>

                {/* Validated Rows Table */}
                <div className="border border-[#d9d2c2] rounded-2xl overflow-hidden bg-white shadow-2xs">
                  <div className="overflow-x-auto max-h-64 sm:max-h-72">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-[#f1eee6] text-[#527078] uppercase text-[10px] font-bold tracking-wider sticky top-0 z-10 border-b border-[#d9d2c2]">
                        <tr>
                          <th className="py-2.5 px-3">#</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Line &amp; Floor</th>
                          <th className="py-2.5 px-3">Buyer &amp; Style</th>
                          <th className="py-2.5 px-3 text-right">SMV</th>
                          <th className="py-2.5 px-3 text-right">MP (O/H/I)</th>
                          <th className="py-2.5 px-3 text-right">Hours</th>
                          <th className="py-2.5 px-3 text-right">Target Pcs</th>
                          <th className="py-2.5 px-3">Validation Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e7e1d5]">
                        {filteredRows.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="py-6 text-center text-xs text-[#527078]">
                              No lines match the selected filter or search query.
                            </td>
                          </tr>
                        ) : (
                          filteredRows.map(row => {
                            const p = row.parsedData;
                            // Theoretical capacity calculation
                            const theoreticalTarget = Math.round(
                              (p.plannedMP * p.workingHours * 60 * (p.targetEff / 100)) / (p.smv || 1)
                            );
                            const targetDiff = Math.abs(p.targetProd - theoreticalTarget);
                            const hasTargetVariance = p.targetProd > 0 && theoreticalTarget > 0 && targetDiff > (theoreticalTarget * 0.25);

                            return (
                              <tr
                                key={row.rowIndex}
                                className={`hover:bg-[#fbfaf6] transition-colors ${
                                  row.status === 'error'
                                    ? 'bg-rose-50/40'
                                    : row.status === 'warning'
                                    ? 'bg-amber-50/20'
                                    : ''
                                }`}
                              >
                                <td className="py-2 px-3 font-mono-numbers text-slate-400 text-[11px]">
                                  {row.rowIndex}
                                </td>
                                <td className="py-2 px-3 whitespace-nowrap">
                                  {row.status === 'valid' && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>Valid</span>
                                    </span>
                                  )}
                                  {row.status === 'warning' && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                      <AlertTriangle className="w-3 h-3" />
                                      <span>Warning</span>
                                    </span>
                                  )}
                                  {row.status === 'error' && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                      <AlertCircle className="w-3 h-3" />
                                      <span>Error</span>
                                    </span>
                                  )}
                                </td>
                                <td className="py-2 px-3">
                                  <div className="font-bold text-[#17343a] flex items-center gap-1.5">
                                    <span>{p.lineNo || '—'}</span>
                                    {p.status !== 'Active' && (
                                      <span className="text-[9px] px-1 py-0.2 rounded bg-slate-200 text-slate-700 font-semibold">
                                        {p.status}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-[#527078] truncate max-w-[130px]">
                                    {p.floor}
                                    {p.apartment ? ` • ${p.apartment}` : ''}
                                  </div>
                                </td>
                                <td className="py-2 px-3">
                                  <div className="font-semibold text-[#17343a] truncate max-w-[170px]" title={p.style}>
                                    {p.style || '—'}
                                  </div>
                                  <div className="text-[10px] text-[#176f78] font-medium">{p.buyer}</div>
                                </td>
                                <td className="py-2 px-3 text-right font-mono-numbers font-bold text-[#17343a]">
                                  {p.smv}
                                </td>
                                <td className="py-2 px-3 text-right font-mono-numbers">
                                  <div className="font-bold text-[#17343a]">{p.plannedMP}</div>
                                  <div className="text-[9px] text-[#527078]" title="Operators / Helpers / Ironers">
                                    {p.operators}/{p.helpers}/{p.ironMan}
                                  </div>
                                </td>
                                <td className="py-2 px-3 text-right font-mono-numbers text-[#527078]">
                                  {p.workingHours}h
                                </td>
                                <td className="py-2 px-3 text-right font-mono-numbers">
                                  <div className="font-bold text-[#176f78]">
                                    {p.targetProd.toLocaleString()}
                                  </div>
                                  {theoreticalTarget > 0 && (
                                    <div
                                      className={`text-[9px] ${
                                        hasTargetVariance ? 'text-amber-700 font-semibold' : 'text-slate-400'
                                      }`}
                                      title={`Formula Capacity: ${theoreticalTarget.toLocaleString()} pcs at ${p.targetEff}% efficiency`}
                                    >
                                      IE: {theoreticalTarget.toLocaleString()}
                                    </div>
                                  )}
                                </td>
                                <td className="py-2 px-3">
                                  {row.errors.length > 0 && (
                                    <div className="text-rose-700 text-[11px] font-medium leading-tight">
                                      {row.errors.join('; ')}
                                    </div>
                                  )}
                                  {row.warnings.length > 0 && (
                                    <div className="text-amber-700 text-[10px] leading-tight mt-0.5">
                                      {row.warnings.join('; ')}
                                    </div>
                                  )}
                                  {row.errors.length === 0 && row.warnings.length === 0 && (
                                    <span className="text-emerald-700 text-[10px] font-medium">
                                      All parameters within standard factory limits
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Import Configuration & Mode Selector */}
                <div className="p-3.5 rounded-2xl bg-[#f1eee6] border border-[#d9d2c2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-[#17343a] flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-[#176f78]" />
                      <span>Import Strategy</span>
                    </div>
                    <div className="text-[11px] text-[#527078] mt-0.5">
                      Select how imported lines merge with the active factory registry
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-[#17343a] cursor-pointer bg-white px-2.5 py-1.5 rounded-xl border border-[#d9d2c2] hover:bg-[#fbfaf6]">
                      <input
                        type="radio"
                        name="importMode"
                        value="upsert"
                        checked={importMode === 'upsert'}
                        onChange={() => setImportMode('upsert')}
                        className="text-[#176f78] focus:ring-[#176f78]"
                      />
                      <span>Update &amp; Add (Upsert)</span>
                    </label>

                    <label className="flex items-center gap-1.5 text-xs font-semibold text-[#17343a] cursor-pointer bg-white px-2.5 py-1.5 rounded-xl border border-[#d9d2c2] hover:bg-[#fbfaf6]">
                      <input
                        type="radio"
                        name="importMode"
                        value="append"
                        checked={importMode === 'append'}
                        onChange={() => setImportMode('append')}
                        className="text-[#176f78] focus:ring-[#176f78]"
                      />
                      <span>Append New Only</span>
                    </label>

                    <label className="flex items-center gap-1.5 text-xs font-semibold text-[#17343a] cursor-pointer bg-white px-2.5 py-1.5 rounded-xl border border-[#d9d2c2] hover:bg-[#fbfaf6]">
                      <input
                        type="radio"
                        name="importMode"
                        value="replace"
                        checked={importMode === 'replace'}
                        onChange={() => setImportMode('replace')}
                        className="text-rose-600 focus:ring-rose-600"
                      />
                      <span>Replace All Lines</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Empty State / Instructional Callout */}
            {!csvRawText && (
              <div className="p-4 rounded-2xl bg-[#f1eee6]/60 border border-[#d9d2c2] space-y-2">
                <div className="text-xs font-bold text-[#17343a] flex items-center gap-2">
                  <Info className="w-4 h-4 text-[#176f78]" />
                  <span>Standard Excel &amp; CSV Column Header Reference</span>
                </div>
                <p className="text-[11px] text-[#527078] leading-relaxed">
                  Your Excel sheet or CSV table should ideally include headers such as:{' '}
                  <code className="text-[#176f78] font-bold font-mono">
                    Line No, Floor, Buyer, Style, SMV, Planned MP, Working Hours, Target Eff%, Target Prod
                  </code>
                  . Optional columns include <code className="font-mono">Apartment, Machine Count, Status, Operators, Helpers, Iron Man, Remarks</code>.
                  Daily target production will automatically calculate using standard IE capacity formulas <code className="font-mono">(MP * Hours * 60 * Eff%) / SMV</code> if omitted!
                </p>
              </div>
            )}
          </div>
        )}

        {/* Modal Bottom Action Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-5 pt-3 border-t border-[#e7e1d5] bg-[#fbfaf6] shrink-0">
          {activeTab === 'csv-import' ? (
            <>
              <div className="text-xs text-[#527078] text-center sm:text-left">
                {validationResult.totalRows > 0 ? (
                  <span>
                    Ready to import:{' '}
                    <strong className="text-emerald-700 font-mono-numbers">
                      {validationResult.validCount + validationResult.warningCount} valid line(s)
                    </strong>
                    {validationResult.errorCount > 0 && (
                      <span className="text-rose-700 ml-1">
                        ({validationResult.errorCount} row(s) have errors and will be skipped)
                      </span>
                    )}
                  </span>
                ) : (
                  <span>Upload or paste a CSV above to begin validation.</span>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#f1eee6] hover:bg-[#e7e1d5] text-[#527078] text-xs font-bold transition-colors cursor-pointer"
                >
                  Close
                </button>

                <button
                  type="button"
                  id="execute-csv-import-btn"
                  onClick={handleExecuteImport}
                  disabled={validationResult.validCount + validationResult.warningCount === 0}
                  className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                    validationResult.validCount + validationResult.warningCount > 0
                      ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>
                    Import {validationResult.validCount + validationResult.warningCount} Validated Lines
                  </span>
                </button>
              </div>
            </>
          ) : (
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-[#f1eee6] hover:bg-[#e7e1d5] text-[#527078] text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

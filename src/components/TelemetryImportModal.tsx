/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Download,
  X,
  RefreshCw,
  Table,
  Layers,
  ArrowRight
} from 'lucide-react';
import { BuildUpCurve, LearningCurveDayRecord, LineLearningCurve } from '../types';
import {
  parseTelemetryCSV,
  parseTelemetryFile,
  downloadTelemetryCSV,
  generateTelemetryTemplateCSV,
  TelemetryParseResult
} from '../utils/telemetryCsv';

interface TelemetryImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  lineNo: string;
  smv: number;
  totalMP: number;
  workingHours: number;
  onApplyTelemetry: (imported: {
    history: LearningCurveDayRecord[];
    buildUp?: Partial<BuildUpCurve>;
  }) => void;
}

export const TelemetryImportModal: React.FC<TelemetryImportModalProps> = ({
  isOpen,
  onClose,
  lineNo,
  smv,
  totalMP,
  workingHours,
  onApplyTelemetry
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<TelemetryParseResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const template = generateTelemetryTemplateCSV();
    downloadTelemetryCSV(`telemetry_template_line_${lineNo || 'sample'}.csv`, template);
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setFileName(file.name);
    try {
      const res = await parseTelemetryFile(file, smv, totalMP, workingHours);
      setParseResult(res);
    } catch (err: any) {
      setParseResult({
        success: false,
        errors: [`File read failure: ${err?.message || 'Unknown error'}`],
        warnings: []
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleParsePasted = () => {
    if (!pastedText.trim()) return;
    setIsProcessing(true);
    try {
      const res = parseTelemetryCSV(pastedText, smv, totalMP, workingHours);
      setParseResult(res);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApply = () => {
    if (!parseResult || !parseResult.success || !parseResult.learningCurve) return;
    onApplyTelemetry({
      history: parseResult.learningCurve.history,
      buildUp: parseResult.buildUp
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl p-6 max-w-2xl w-full border border-[#d9d2c2] shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#e7e1d5]">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-[#dceceb] text-[#176f78]">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold uppercase text-[#17343a]">
                Import Telemetry Data — Line {lineNo}
              </h3>
              <p className="text-xs text-[#527078]">
                Import 6-Day Learning Curve &amp; Line Build-Up Ramp-up Telemetry (CSV / Excel / Sheets)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-[#f1eee6] text-[#527078] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center bg-[#f1eee6] p-0.5 rounded-xl border border-[#d9d2c2]">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-white text-[#17343a] shadow-2xs'
                  : 'text-[#527078] hover:text-[#17343a]'
              }`}
            >
              Upload CSV / Excel
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('paste')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'paste'
                  ? 'bg-white text-[#17343a] shadow-2xs'
                  : 'text-[#527078] hover:text-[#17343a]'
              }`}
            >
              Paste CSV Text
            </button>
          </div>

          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#d9d2c2] text-[#176f78] hover:bg-[#f1eee6] font-bold transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV Template</span>
          </button>
        </div>

        {/* Tab 1: Upload File */}
        {activeTab === 'upload' && (
          <div className="space-y-3">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-[#176f78] bg-[#dceceb]/30'
                  : 'border-[#d9d2c2] hover:border-[#176f78] bg-[#fbfaf6]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls,text/csv"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-[#dceceb] text-[#176f78] flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-[#17343a] mb-1">
                {fileName ? fileName : 'Click to select or drag & drop telemetry file'}
              </p>
              <p className="text-xs text-[#527078]">
                Supports .CSV, .XLSX, and .XLS files with 6-day curve &amp; build-up parameters
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Paste Raw CSV Text */}
        {activeTab === 'paste' && (
          <div className="space-y-3">
            <textarea
              rows={6}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste comma-separated rows here, e.g.:&#10;Day,PlannedEffPct,PlannedQtyPcs,AchievedQtyPcs,Notes&#10;1,28,322,310,Initial trial run&#10;2,38,437,425,Feeder adjusted..."
              className="w-full font-mono text-xs p-3 rounded-2xl bg-[#fbfaf6] border border-[#d9d2c2] text-[#17343a] focus:outline-hidden focus:ring-1 focus:ring-[#176f78]"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleParsePasted}
                disabled={!pastedText.trim() || isProcessing}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#176f78] text-white text-xs font-bold hover:bg-[#12555c] transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                <span>Parse Pasted Data</span>
              </button>
            </div>
          </div>
        )}

        {/* Parse Preview */}
        {parseResult && (
          <div className="space-y-3 pt-2 border-t border-[#e7e1d5]">
            {parseResult.success ? (
              <>
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Telemetry successfully parsed! Review before applying:</span>
                </div>

                {/* Build-Up preview if found */}
                {parseResult.buildUp && (
                  <div className="p-3 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2] space-y-1">
                    <span className="text-[10px] font-bold uppercase text-[#527078] flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-[#176f78]" />
                      Line Build-Up Ramp-Up Configuration:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1 font-mono-numbers">
                      <div>
                        <span className="text-[#527078] block text-[10px]">Ramp Day:</span>
                        <span className="font-bold text-[#17343a]">{parseResult.buildUp.day || 'Day 1'}</span>
                      </div>
                      <div>
                        <span className="text-[#527078] block text-[10px]">Planned Ramp %:</span>
                        <span className="font-bold text-[#176f78]">{parseResult.buildUp.plannedPct}%</span>
                      </div>
                      <div>
                        <span className="text-[#527078] block text-[10px]">Achieved Ramp %:</span>
                        <span className="font-bold text-emerald-700">{parseResult.buildUp.achievedPct}%</span>
                      </div>
                      <div>
                        <span className="text-[#527078] block text-[10px]">Allocated MP:</span>
                        <span className="font-bold text-[#17343a]">{parseResult.buildUp.operators} Ops</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 6-Day records table preview */}
                {parseResult.learningCurve && (
                  <div className="border border-[#d9d2c2] rounded-xl overflow-hidden">
                    <div className="bg-[#f1eee6] px-3 py-1.5 text-[10px] font-bold uppercase text-[#527078] flex items-center justify-between">
                      <span>6-Day Learning Curve Telemetry Preview</span>
                      <span>6 Days Loaded</span>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      <table className="w-full text-left text-xs font-mono-numbers border-collapse">
                        <thead className="bg-[#fbfaf6] text-[10px] text-[#527078] uppercase border-b border-[#e7e1d5]">
                          <tr>
                            <th className="p-2">Day</th>
                            <th className="p-2">Plan Eff</th>
                            <th className="p-2">Plan Pcs</th>
                            <th className="p-2">Log Pcs</th>
                            <th className="p-2">Log Eff</th>
                            <th className="p-2">Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e7e1d5]">
                          {parseResult.learningCurve.history.map((d) => (
                            <tr key={d.day} className="hover:bg-[#fbfaf6]">
                              <td className="p-2 font-bold text-[#17343a]">Day {d.day}</td>
                              <td className="p-2 text-[#176f78]">{d.plannedEff}%</td>
                              <td className="p-2">{d.plannedQty}</td>
                              <td className="p-2 font-bold text-emerald-700">{d.achievedQty}</td>
                              <td className="p-2 font-bold text-[#17343a]">{d.achievedEff}%</td>
                              <td className="p-2 text-[#527078] truncate max-w-[140px]">{d.notes || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Telemetry Parsing Errors:</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  {parseResult.errors.map((e, idx) => (
                    <li key={idx}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Modal Actions */}
        <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#e7e1d5]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#d9d2c2] text-xs text-[#527078] hover:bg-[#f1eee6] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={!parseResult || !parseResult.success}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#176f78] text-white text-xs font-bold hover:bg-[#12555c] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer"
          >
            <span>Apply to Line {lineNo}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

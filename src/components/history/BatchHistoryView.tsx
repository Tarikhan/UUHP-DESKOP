import React from 'react';
import { History, Download, Trash2, FileSpreadsheet, HardDrive, Clock, CheckCircle2 } from 'lucide-react';
import { PdfFileItem, BatchStats } from '../../types/pdf';

interface BatchHistoryViewProps {
  files: PdfFileItem[];
  stats: BatchStats;
  onClearHistory: () => void;
  onDownloadFile: (item: PdfFileItem) => void;
}

export const BatchHistoryView: React.FC<BatchHistoryViewProps> = ({
  files,
  stats,
  onClearHistory,
  onDownloadFile,
}) => {
  const completedFiles = files.filter((f) => f.status === 'completed' && f.compressedBytes);

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const handleExportCsv = () => {
    if (completedFiles.length === 0) return;

    const headers = ['Document Name', 'Pages', 'Original Bytes', 'Compressed Bytes', 'Saved Bytes', 'Reduction %', 'Time (ms)', 'Processed At'];
    const rows = completedFiles.map((f) => [
      `"${f.name}"`,
      f.pageCount,
      f.originalSize,
      f.compressedSize || 0,
      f.originalSize - (f.compressedSize || 0),
      f.reductionRatio ? (f.reductionRatio * 100).toFixed(2) : '0',
      f.timeTakenMs || 0,
      `"${new Date(f.timestamp).toISOString()}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `UHHP_PDF_Compression_Audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <History className="w-5 h-5 text-blue-400" />
            Session Audit Logs & Performance
          </h2>
          <p className="text-xs text-slate-400">
            Real-time audit log of all PDF documents compressed in your local memory workspace.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {completedFiles.length > 0 && (
            <>
              <button
                onClick={handleExportCsv}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export CSV Report</span>
              </button>
              <button
                onClick={onClearHistory}
                className="px-3 py-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear History</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Documents Processed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100 tabular-nums">
            {stats.processedCount}
          </p>
          <p className="text-[11px] text-slate-500">Total successful compressions</p>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Disk Space Reclaimed</span>
            <HardDrive className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 tabular-nums">
            {formatBytes(stats.totalSavedBytes)}
          </p>
          <p className="text-[11px] text-slate-500">
            Avg: {(stats.averageReductionRatio * 100).toFixed(1)}% reduction
          </p>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Original Payload</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-slate-200 tabular-nums">
            {formatBytes(stats.totalOriginalBytes)}
          </p>
          <p className="text-[11px] text-slate-500">Compressed to {formatBytes(stats.totalCompressedBytes)}</p>
        </div>
      </div>

      {/* Table */}
      {completedFiles.length === 0 ? (
        <div className="p-12 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
          No compressed files logged yet. Process files in the Batch Queue to view audit logs here.
        </div>
      ) : (
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-4">Document</th>
                <th className="py-2.5 px-4 text-right">Original</th>
                <th className="py-2.5 px-4 text-right">Compressed</th>
                <th className="py-2.5 px-4 text-right">Space Saved</th>
                <th className="py-2.5 px-4 text-right">Speed</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {completedFiles.map((file) => {
                const savingsPct =
                  file.reductionRatio !== null ? (file.reductionRatio * 100).toFixed(1) : null;
                return (
                  <tr key={file.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-200 truncate max-w-xs">{file.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {file.pageCount} {file.pageCount === 1 ? 'page' : 'pages'} ·{' '}
                        {new Date(file.timestamp).toLocaleTimeString()}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-slate-400">
                      {formatBytes(file.originalSize)}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums font-semibold text-emerald-400">
                      {formatBytes(file.compressedSize || 0)}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums">
                      <span className="text-emerald-400 font-bold">-{savingsPct}%</span>
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-slate-400">
                      {file.timeTakenMs ? `${(file.timeTakenMs / 1000).toFixed(1)}s` : '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onDownloadFile(file)}
                        className="px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white rounded transition-colors inline-flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

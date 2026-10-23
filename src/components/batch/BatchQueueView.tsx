import React, { useRef, useState } from 'react';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Download,
  Trash2,
  Eye,
  FileArchive,
  Play,
  RotateCcw,
  Sparkles,
  Search,
  LayoutList,
  LayoutGrid,
} from 'lucide-react';
import { PdfFileItem } from '../../types/pdf';

interface BatchQueueViewProps {
  files: PdfFileItem[];
  isProcessingBatch: boolean;
  batchProgress: number; // 0 - 100
  onAddFiles: (files: FileList | File[]) => void;
  onLoadSamples: () => void;
  onCompressAll: () => void;
  onCompressSingle: (id: string) => void;
  onRemoveFile: (id: string) => void;
  onClearAll: () => void;
  onDownloadSingle: (item: PdfFileItem) => void;
  onDownloadAllZip: () => void;
  onOpenCompare: (item: PdfFileItem) => void;
}

export const BatchQueueView: React.FC<BatchQueueViewProps> = ({
  files,
  isProcessingBatch,
  batchProgress,
  onAddFiles,
  onLoadSamples,
  onCompressAll,
  onCompressSingle,
  onRemoveFile,
  onClearAll,
  onDownloadSingle,
  onDownloadAllZip,
  onOpenCompare,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onAddFiles(e.dataTransfer.files);
    }
  };

  const filteredFiles = files.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter === 'pending') return item.status === 'idle' || item.status === 'processing';
    if (statusFilter === 'completed') return item.status === 'completed';
    return true;
  });

  const pendingCount = files.filter((f) => f.status === 'idle').length;
  const completedCount = files.filter((f) => f.status === 'completed').length;
  const totalOriginalBytes = files.reduce((acc, f) => acc + f.originalSize, 0);
  const totalCompressedBytes = files.reduce(
    (acc, f) => acc + (f.compressedSize !== null ? f.compressedSize : f.originalSize),
    0
  );
  const totalSavedBytes = Math.max(0, totalOriginalBytes - totalCompressedBytes);

  return (
    <div
      className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950 relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onAddFiles(e.target.files);
            e.target.value = '';
          }
        }}
      />

      {/* Drag Overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-blue-600/20 backdrop-blur-sm border-2 border-dashed border-blue-400 z-40 flex flex-col items-center justify-center pointer-events-none">
          <UploadCloud className="w-16 h-16 text-blue-300 animate-bounce mb-3" />
          <p className="text-lg font-semibold text-white">Drop PDF files to add to batch</p>
          <p className="text-xs text-blue-200 mt-1">Multi-page PDFs supported · Processed locally</p>
        </div>
      )}

      {/* Toolbar */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-900/60 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter files in queue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/60"
            />
          </div>

          {/* Status filter tabs */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800 shrink-0">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                statusFilter === 'all'
                  ? 'bg-slate-800 text-slate-100 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({files.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                statusFilter === 'pending'
                  ? 'bg-slate-800 text-slate-100 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                statusFilter === 'completed'
                  ? 'bg-slate-800 text-slate-100 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Done ({completedCount})
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'table' ? 'bg-slate-800 text-blue-400' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Table List View"
            >
              <LayoutList className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'grid' ? 'bg-slate-800 text-blue-400' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Grid Card View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={onLoadSamples}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Load 3 authentic sample PDFs to test batch compression instantly"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Load Samples</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm shadow-blue-900/40"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Add Files</span>
          </button>

          {files.length > 0 && (
            <button
              onClick={onClearAll}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors border border-transparent hover:border-rose-900/40"
              title="Clear all files from queue"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {files.length === 0 ? (
          /* Empty Queue State */
          <div className="h-full min-h-[380px] flex flex-col items-center justify-center border-2 border-dashed border-slate-800/80 rounded-2xl bg-slate-900/20 p-8 text-center max-w-2xl mx-auto my-auto">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mb-4 text-blue-400 shadow-lg shadow-black/30">
              <FileText className="w-8 h-8" />
            </div>

            <h3 className="text-base font-semibold text-slate-100 mb-1">
              No PDF files in compression queue
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
              Drag and drop multiple PDF documents here, or click below to choose files or test with authentic sample decks.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium flex items-center gap-2 transition-colors shadow-sm shadow-blue-900/50"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Select PDF Files</span>
              </button>
              <button
                onClick={onLoadSamples}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Load 3 Sample PDFs</span>
              </button>
            </div>

            <div className="mt-8 flex items-center gap-6 text-[11px] text-slate-400 border-t border-slate-800/60 pt-4">
              <span>Supports batch files up to 200MB</span>
              <span>·</span>
              <span>All multi-page structures preserved</span>
              <span>·</span>
              <span>100% Client-side sandbox</span>
            </div>
          </div>
        ) : filteredFiles.length === 0 ? (
          /* No match for current search */
          <div className="text-center py-16 text-slate-400 text-xs">
            No files match filter criteria "{searchQuery}"
          </div>
        ) : viewMode === 'table' ? (
          /* Table View */
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-4 w-12 text-center">#</th>
                  <th className="py-2.5 px-4">Document Name</th>
                  <th className="py-2.5 px-4 text-right">Pages</th>
                  <th className="py-2.5 px-4 text-right">Original Size</th>
                  <th className="py-2.5 px-4 text-right">Compressed</th>
                  <th className="py-2.5 px-4 text-right">Reduction</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
                {filteredFiles.map((item, index) => {
                  const isProcessing = item.status === 'processing';
                  const isDone = item.status === 'completed';
                  const isError = item.status === 'error';
                  const savingsPct =
                    item.reductionRatio !== null ? (item.reductionRatio * 100).toFixed(1) : null;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      <td className="py-3 px-4 text-center text-slate-400 tabular-nums">
                        {index + 1}
                      </td>

                      {/* Name & Thumbnail */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-10 rounded bg-slate-800 border border-slate-700/60 shrink-0 overflow-hidden flex items-center justify-center">
                            {item.thumbnailUrl ? (
                              <img
                                src={item.thumbnailUrl}
                                alt="preview"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <FileText className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0 max-w-xs sm:max-w-md">
                            <p className="font-medium text-slate-200 truncate">{item.name}</p>
                            <p className="text-[11px] text-slate-400">
                              Added {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Pages */}
                      <td className="py-3 px-4 text-right tabular-nums text-slate-400">
                        {item.pageCount} {item.pageCount === 1 ? 'page' : 'pages'}
                      </td>

                      {/* Original Size */}
                      <td className="py-3 px-4 text-right tabular-nums text-slate-300">
                        {formatBytes(item.originalSize)}
                      </td>

                      {/* Compressed Size */}
                      <td className="py-3 px-4 text-right tabular-nums">
                        {item.compressedSize !== null ? (
                          <span className="font-semibold text-emerald-400">
                            {formatBytes(item.compressedSize)}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Reduction % */}
                      <td className="py-3 px-4 text-right tabular-nums">
                        {savingsPct !== null ? (
                          <span className="font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-900/60 px-2 py-0.5 rounded text-[11px]">
                            -{savingsPct}%
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        {isProcessing ? (
                          <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center gap-1.5 text-blue-400 text-[11px]">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Compressing ({item.progress}%)</span>
                            </div>
                            <div className="w-24 bg-slate-800 rounded-full h-1 overflow-hidden">
                              <div
                                className="bg-blue-500 h-full transition-all duration-300"
                                style={{ width: `${item.progress}%` }}
                              />
                            </div>
                          </div>
                        ) : isDone ? (
                          <div className="inline-flex items-center gap-1 text-emerald-400 text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Optimized</span>
                          </div>
                        ) : isError ? (
                          <div className="inline-flex items-center gap-1 text-rose-400 text-xs" title={item.errorMessage || ''}>
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Failed</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">Ready</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isDone ? (
                            <>
                              <button
                                onClick={() => onOpenCompare(item)}
                                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
                                title="Inspect Side-by-Side Visual Compare"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onDownloadSingle(item)}
                                className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-950/50 rounded transition-colors"
                                title="Download compressed PDF"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => onCompressSingle(item.id)}
                              disabled={isProcessing}
                              className="px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white rounded transition-colors flex items-center gap-1"
                            >
                              <Play className="w-3 h-3" />
                              <span>Compress</span>
                            </button>
                          )}

                          <button
                            onClick={() => onRemoveFile(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors opacity-70 group-hover:opacity-100"
                            title="Remove file"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredFiles.map((item) => {
              const isProcessing = item.status === 'processing';
              const isDone = item.status === 'completed';
              const savingsPct =
                item.reductionRatio !== null ? (item.reductionRatio * 100).toFixed(1) : null;

              return (
                <div
                  key={item.id}
                  className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-xl p-3 flex flex-col justify-between transition-colors space-y-3"
                >
                  <div className="space-y-2.5">
                    {/* Thumbnail & Badges */}
                    <div className="relative aspect-[4/3] rounded-lg bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
                      {item.thumbnailUrl ? (
                        <img
                          src={item.thumbnailUrl}
                          alt="preview"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <FileText className="w-10 h-10 text-slate-400" />
                      )}

                      {/* Reduction Pill */}
                      {savingsPct !== null && (
                        <div className="absolute top-2 right-2 bg-emerald-950/90 border border-emerald-800 text-emerald-300 text-xs font-bold px-2 py-0.5 rounded shadow">
                          -{savingsPct}%
                        </div>
                      )}

                      <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-sm text-slate-400 text-[10px] px-1.5 py-0.5 rounded">
                        {item.pageCount} {item.pageCount === 1 ? 'page' : 'pages'}
                      </div>
                    </div>

                    {/* Title */}
                    <div>
                      <h4 className="text-xs font-semibold text-slate-200 truncate" title={item.name}>
                        {item.name}
                      </h4>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1 tabular-nums">
                        <span>Original: {formatBytes(item.originalSize)}</span>
                        {item.compressedSize !== null && (
                          <span className="text-emerald-400 font-medium">
                            {formatBytes(item.compressedSize)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress or Actions */}
                  <div className="pt-2 border-t border-slate-800/80">
                    {isProcessing ? (
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-blue-400">
                          <span>Compressing...</span>
                          <span className="tabular-nums">{item.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-blue-500 h-full transition-all duration-200"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-1.5">
                        {isDone ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => onOpenCompare(item)}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs flex items-center gap-1 transition-colors"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Compare</span>
                            </button>
                            <button
                              onClick={() => onDownloadSingle(item)}
                              className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs flex items-center gap-1 transition-colors"
                            >
                              <Download className="w-3 h-3" />
                              <span>Save</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => onCompressSingle(item.id)}
                            className="w-full py-1 bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white rounded text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <Play className="w-3 h-3" />
                            <span>Compress PDF</span>
                          </button>
                        )}

                        <button
                          onClick={() => onRemoveFile(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Batch Execution Bar */}
      {files.length > 0 && (
        <div className="p-3 bg-slate-900/95 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0 backdrop-blur-md">
          {/* Summary Metric Strip */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="font-semibold text-white tabular-nums">{files.length}</span>
              <span className="text-slate-400">Total Files</span>
            </div>

            <div className="text-slate-700">|</div>

            <div className="text-slate-400">
              Original: <span className="text-slate-200 tabular-nums">{formatBytes(totalOriginalBytes)}</span>
            </div>

            {completedCount > 0 && (
              <>
                <div className="text-slate-700">|</div>
                <div className="text-slate-400">
                  Compressed:{' '}
                  <span className="text-slate-200 tabular-nums">{formatBytes(totalCompressedBytes)}</span>
                </div>
                <div className="text-slate-700">|</div>
                <div className="text-emerald-400 font-semibold flex items-center gap-1">
                  <span>Saved {formatBytes(totalSavedBytes)}</span>
                  {totalOriginalBytes > 0 && (
                    <span className="tabular-nums">
                      (-{((totalSavedBytes / totalOriginalBytes) * 100).toFixed(1)}%)
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2">
            {completedCount > 0 && (
              <button
                onClick={onDownloadAllZip}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
                title="Download all compressed PDFs as a single ZIP package (Cmd/Ctrl + D)"
              >
                <FileArchive className="w-3.5 h-3.5 text-amber-400" />
                <span>Download All (ZIP)</span>
              </button>
            )}

            <button
              onClick={onCompressAll}
              disabled={isProcessingBatch || pendingCount === 0}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                isProcessingBatch
                  ? 'bg-blue-600/50 text-blue-200 cursor-not-allowed'
                  : pendingCount === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/60'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/50'
              }`}
            >
              {isProcessingBatch ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Compressing Batch ({batchProgress}%)...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>
                    Compress {pendingCount > 0 ? `(${pendingCount} Pending)` : 'All'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

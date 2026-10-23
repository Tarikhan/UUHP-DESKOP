import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Download,
  SplitSquareVertical,
  Columns,
  Layers,
  ArrowRight,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { PdfFileItem } from '../../types/pdf';
import { renderPageToCanvas } from '../../services/pdfCompressor';

interface CompareModalProps {
  item: PdfFileItem | null;
  allItems: PdfFileItem[];
  onClose: () => void;
  onSelectFile: (item: PdfFileItem) => void;
  onDownload: (item: PdfFileItem) => void;
}

export const CompareModal: React.FC<CompareModalProps> = ({
  item,
  allItems,
  onClose,
  onSelectFile,
  onDownload,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [renderMode, setRenderMode] = useState<'side-by-side' | 'slider'>('side-by-side');
  const [sliderPosition, setSliderPosition] = useState(50); // percent 0-100
  const [isLoadingPages, setIsLoadingPages] = useState(false);

  const origCanvasRef = useRef<HTMLCanvasElement>(null);
  const compCanvasRef = useRef<HTMLCanvasElement>(null);

  const completedFiles = allItems.filter((f) => f.status === 'completed' && f.compressedBytes);
  const activeItem = item || completedFiles[0] || null;

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [activeItem?.id]);

  useEffect(() => {
    if (!activeItem) return;

    let isMounted = true;
    setIsLoadingPages(true);

    const render = async () => {
      try {
        if (origCanvasRef.current && activeItem.originalBytes) {
          await renderPageToCanvas(activeItem.originalBytes, currentPage, origCanvasRef.current, zoomLevel);
        }
        if (compCanvasRef.current && activeItem.compressedBytes) {
          await renderPageToCanvas(activeItem.compressedBytes, currentPage, compCanvasRef.current, zoomLevel);
        }
      } catch (err) {
        console.error('Failed to render comparison pages:', err);
      } finally {
        if (isMounted) setIsLoadingPages(false);
      }
    };

    render();

    return () => {
      isMounted = false;
    };
  }, [activeItem, currentPage, zoomLevel]);

  if (!activeItem) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
          <SplitSquareVertical className="w-7 h-7" />
        </div>
        <h3 className="text-base font-semibold text-slate-200">No Compressed Document Selected</h3>
        <p className="text-xs text-slate-500 max-w-sm">
          Compress one or more files in your batch queue to inspect visual fidelity side-by-side.
        </p>
      </div>
    );
  }

  const savingsPct =
    activeItem.reductionRatio !== null ? (activeItem.reductionRatio * 100).toFixed(1) : null;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
      {/* Top Inspector Header */}
      <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Document Selector & Stats */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-200">Document:</span>
            <select
              value={activeItem.id}
              onChange={(e) => {
                const found = allItems.find((f) => f.id === e.target.value);
                if (found) onSelectFile(found);
              }}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-200 py-1 px-2.5 rounded-lg focus:outline-none focus:border-blue-500"
            >
              {completedFiles.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs tabular-nums">
            <span className="text-slate-400">Original: {formatBytes(activeItem.originalSize)}</span>
            <ArrowRight className="w-3 h-3 text-slate-600" />
            <span className="text-emerald-400 font-semibold">
              Compressed: {formatBytes(activeItem.compressedSize || 0)}
            </span>
            {savingsPct && (
              <span className="bg-emerald-950/60 text-emerald-400 border border-emerald-800/80 px-1.5 py-0.2 rounded text-[10px] font-bold">
                -{savingsPct}%
              </span>
            )}
          </div>
        </div>

        {/* Page Navigation & Zoom & Download */}
        <div className="flex items-center gap-2">
          {/* Page Navigator */}
          <div className="flex items-center gap-1 bg-slate-950 px-1 py-0.5 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:hover:text-slate-400 rounded"
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-slate-300 tabular-nums text-xs">
              Page {currentPage} of {activeItem.pageCount}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(activeItem.pageCount, p + 1))}
              disabled={currentPage >= activeItem.pageCount}
              className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:hover:text-slate-400 rounded"
              title="Next Page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-slate-950 px-1 py-0.5 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
              className="p-1 text-slate-400 hover:text-slate-200 rounded"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1 text-[11px] text-slate-300 tabular-nums">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(2.0, z + 0.2))}
              className="p-1 text-slate-400 hover:text-slate-200 rounded"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Save button */}
          <button
            onClick={() => onDownload(activeItem)}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm shadow-blue-900/40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Save PDF</span>
          </button>
        </div>
      </div>

      {/* Main Dual Viewport */}
      <div className="flex-1 overflow-auto p-4 flex items-start justify-center gap-6 bg-slate-950/70">
        {/* Left Side: Original */}
        <div className="flex flex-col items-center space-y-2">
          <div className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-md text-xs font-semibold text-slate-300 flex items-center gap-2">
            <span>Original Source</span>
            <span className="text-slate-500 tabular-nums">({formatBytes(activeItem.originalSize)})</span>
          </div>
          <div className="border border-slate-800 rounded-xl overflow-hidden shadow-2xl bg-white max-w-full">
            <canvas ref={origCanvasRef} className="block" />
          </div>
        </div>

        {/* Right Side: Compressed */}
        <div className="flex flex-col items-center space-y-2">
          <div className="px-3 py-1 bg-emerald-950/40 border border-emerald-800/80 rounded-md text-xs font-semibold text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Optimized Output</span>
            <span className="text-emerald-300 tabular-nums">
              ({formatBytes(activeItem.compressedSize || 0)})
            </span>
          </div>
          <div className="border border-slate-800 rounded-xl overflow-hidden shadow-2xl bg-white max-w-full">
            <canvas ref={compCanvasRef} className="block" />
          </div>
        </div>
      </div>
    </div>
  );
};

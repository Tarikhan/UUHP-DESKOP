/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DesktopWindowChrome } from './components/desktop/DesktopWindowChrome';
import { DesktopSidebar } from './components/desktop/DesktopSidebar';
import { BatchQueueView } from './components/batch/BatchQueueView';
import { PresetSettingsPanel } from './components/presets/PresetSettingsPanel';
import { CompareModal } from './components/compare/CompareModal';
import { BatchHistoryView } from './components/history/BatchHistoryView';
import { ShortcutsModal } from './components/shortcuts/ShortcutsModal';
import { ActiveView, BatchStats, CompressionSettings, PdfFileItem } from './types/pdf';
import { compressPdf, generateThumbnail, getPdfInfo } from './services/pdfCompressor';
import { downloadSingleFile, exportBatchAsZip } from './services/zipExporter';
import { generateSampleBatchPdfs } from './services/sampleGenerator';
import { Check, Info, AlertCircle, X } from 'lucide-react';

export default function App() {
  const [files, setFiles] = useState<PdfFileItem[]>([]);
  const [activeView, setActiveView] = useState<ActiveView>('queue');
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [selectedCompareItem, setSelectedCompareItem] = useState<PdfFileItem | null>(null);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Hidden file input for global Add Files action
  const globalFileInputRef = useRef<HTMLInputElement>(null);

  // Compression engine default settings
  const [settings, setSettings] = useState<CompressionSettings>({
    preset: 'balanced',
    dpi: 144,
    quality: 0.75,
    grayscale: false,
    stripMetadata: true,
    rasterizePages: true,
    targetSizeKb: null,
  });

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((curr) => (curr?.message === message ? null : curr));
    }, 4000);
  }, []);

  // Compute live session stats
  const completedItems = files.filter((f) => f.status === 'completed' && f.compressedSize !== null);
  const totalOriginalBytes = completedItems.reduce((acc, f) => acc + f.originalSize, 0);
  const totalCompressedBytes = completedItems.reduce((acc, f) => acc + (f.compressedSize || 0), 0);
  const totalSavedBytes = Math.max(0, totalOriginalBytes - totalCompressedBytes);
  const averageReductionRatio =
    completedItems.length > 0 && totalOriginalBytes > 0 ? totalSavedBytes / totalOriginalBytes : 0;

  const stats: BatchStats = {
    totalFiles: files.length,
    processedCount: completedItems.length,
    totalOriginalBytes,
    totalCompressedBytes,
    totalSavedBytes,
    averageReductionRatio,
  };

  // Add files to queue
  const handleAddFiles = async (newFileList: FileList | File[]) => {
    const fileArray = Array.from(newFileList).filter((f) => f.name.toLowerCase().endsWith('.pdf') || f.type === 'application/pdf');

    if (fileArray.length === 0) {
      showToast('Please select valid PDF documents (.pdf)', 'error');
      return;
    }

    showToast(`Loading ${fileArray.length} document${fileArray.length > 1 ? 's' : ''}...`, 'info');

    const addedItems: PdfFileItem[] = [];

    for (const file of fileArray) {
      try {
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        const { pageCount } = await getPdfInfo(bytes);
        const thumb = await generateThumbnail(bytes);

        addedItems.push({
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          name: file.name,
          originalSize: file.size || bytes.length,
          compressedSize: null,
          pageCount,
          originalBytes: bytes,
          compressedBytes: null,
          status: 'idle',
          progress: 0,
          thumbnailUrl: thumb,
          errorMessage: null,
          reductionRatio: null,
          timeTakenMs: null,
          timestamp: Date.now(),
        });
      } catch (err) {
        console.error('Error reading PDF file:', err);
      }
    }

    setFiles((prev) => [...prev, ...addedItems]);
    showToast(`Added ${addedItems.length} PDF${addedItems.length > 1 ? 's' : ''} to compression queue`, 'success');
  };

  // Load sample PDFs
  const handleLoadSamples = async () => {
    showToast('Synthesizing 3 realistic multi-page sample documents...', 'info');
    try {
      const samples = await generateSampleBatchPdfs();
      const newItems: PdfFileItem[] = [];

      for (const s of samples) {
        const thumb = await generateThumbnail(s.bytes);
        newItems.push({
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          name: s.name,
          originalSize: s.bytes.length,
          compressedSize: null,
          pageCount: s.pageCount,
          originalBytes: s.bytes,
          compressedBytes: null,
          status: 'idle',
          progress: 0,
          thumbnailUrl: thumb,
          errorMessage: null,
          reductionRatio: null,
          timeTakenMs: null,
          timestamp: Date.now(),
        });
      }

      setFiles((prev) => [...prev, ...newItems]);
      showToast('Loaded 3 sample PDFs (Presentation Deck, Contract Scan, Spec)', 'success');
    } catch (err) {
      console.error('Failed to load sample batch', err);
      showToast('Failed to generate sample documents', 'error');
    }
  };

  // Compress a single PDF file
  const handleCompressSingle = async (id: string) => {
    const item = files.find((f) => f.id === id);
    if (!item) return;

    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: 'processing', progress: 5, errorMessage: null } : f))
    );

    const startTime = performance.now();

    try {
      const { compressedBytes, savingsRatio } = await compressPdf(item.originalBytes, settings, (pct) => {
        setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, progress: pct } : f)));
      });

      const elapsed = Math.round(performance.now() - startTime);

      setFiles((prev) =>
        prev.map((f) =>
          f.id === id
            ? {
                ...f,
                compressedBytes,
                compressedSize: compressedBytes.length,
                reductionRatio: savingsRatio,
                status: 'completed',
                progress: 100,
                timeTakenMs: elapsed,
              }
            : f
        )
      );

      showToast(`Optimized ${item.name} (-${(savingsRatio * 100).toFixed(1)}%)`, 'success');
    } catch (err: any) {
      console.error('Compression error:', err);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === id
            ? {
                ...f,
                status: 'error',
                errorMessage: err?.message || 'Compression failed',
                progress: 0,
              }
            : f
        )
      );
      showToast(`Compression failed for ${item.name}`, 'error');
    }
  };

  // Compress all pending PDFs in queue
  const handleCompressAll = async () => {
    const pendingItems = files.filter((f) => f.status === 'idle' || f.status === 'error');
    if (pendingItems.length === 0) {
      showToast('All documents in queue are already compressed', 'info');
      return;
    }

    setIsProcessingBatch(true);
    setBatchProgress(0);

    let completedInRun = 0;
    const totalPending = pendingItems.length;

    for (let i = 0; i < totalPending; i++) {
      const item = pendingItems[i];
      setFiles((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status: 'processing', progress: 5 } : f))
      );

      const startTime = performance.now();

      try {
        const { compressedBytes, savingsRatio } = await compressPdf(item.originalBytes, settings, (pct) => {
          setFiles((prev) => prev.map((f) => (f.id === item.id ? { ...f, progress: pct } : f)));
        });

        const elapsed = Math.round(performance.now() - startTime);

        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? {
                  ...f,
                  compressedBytes,
                  compressedSize: compressedBytes.length,
                  reductionRatio: savingsRatio,
                  status: 'completed',
                  progress: 100,
                  timeTakenMs: elapsed,
                }
              : f
          )
        );
        completedInRun++;
      } catch (err: any) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? {
                  ...f,
                  status: 'error',
                  errorMessage: err?.message || 'Compression failed',
                  progress: 0,
                }
              : f
          )
        );
      }

      setBatchProgress(Math.round(((i + 1) / totalPending) * 100));
    }

    setIsProcessingBatch(false);
    showToast(`Batch compression finished (${completedInRun} of ${totalPending} files succeeded)`, 'success');
  };

  // Export all as ZIP
  const handleDownloadAllZip = async () => {
    const completed = files.filter((f) => f.status === 'completed' && f.compressedBytes);
    if (completed.length === 0) {
      showToast('No compressed files available to export', 'error');
      return;
    }

    showToast('Creating ZIP archive...', 'info');
    try {
      await exportBatchAsZip(completed, 'UHHP_Batch_Compressed.zip');
      showToast('ZIP archive downloaded successfully', 'success');
    } catch (err: any) {
      console.error('ZIP export error:', err);
      showToast(err?.message || 'Failed to generate ZIP archive', 'error');
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      if (isCmdOrCtrl && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        globalFileInputRef.current?.click();
      } else if (isCmdOrCtrl && e.key === 'Enter') {
        e.preventDefault();
        handleCompressAll();
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleDownloadAllZip();
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setFiles((prev) => prev.filter((f) => f.status !== 'completed'));
        showToast('Cleared completed items from queue', 'info');
      } else if (e.key === 'Escape') {
        setIsShortcutsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [files]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 select-none">
      <input
        ref={globalFileInputRef}
        type="file"
        multiple
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleAddFiles(e.target.files);
            e.target.value = '';
          }
        }}
      />

      {/* Top Desktop Window Chrome */}
      <DesktopWindowChrome
        onAddFilesClick={() => globalFileInputRef.current?.click()}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        queueCount={files.length}
      />

      {/* Main Desktop Window Body: Sidebar + Active Viewport */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <DesktopSidebar
          activeView={activeView}
          setActiveView={setActiveView}
          queueCount={files.length}
          stats={stats}
          settings={settings}
        />

        {/* Viewport Router */}
        <main className="flex-1 flex flex-col overflow-hidden bg-slate-950">
          {activeView === 'queue' && (
            <BatchQueueView
              files={files}
              isProcessingBatch={isProcessingBatch}
              batchProgress={batchProgress}
              onAddFiles={handleAddFiles}
              onLoadSamples={handleLoadSamples}
              onCompressAll={handleCompressAll}
              onCompressSingle={handleCompressSingle}
              onRemoveFile={(id) => setFiles((prev) => prev.filter((f) => f.id !== id))}
              onClearAll={() => {
                setFiles([]);
                showToast('Batch queue cleared', 'info');
              }}
              onDownloadSingle={downloadSingleFile}
              onDownloadAllZip={handleDownloadAllZip}
              onOpenCompare={(item) => {
                setSelectedCompareItem(item);
                setActiveView('compare');
              }}
            />
          )}

          {activeView === 'presets' && (
            <PresetSettingsPanel
              settings={settings}
              onUpdateSettings={(newVals) => setSettings((s) => ({ ...s, ...newVals }))}
              onApplyAndCompress={() => {
                setActiveView('queue');
                handleCompressAll();
              }}
              pendingCount={files.filter((f) => f.status === 'idle').length}
            />
          )}

          {activeView === 'compare' && (
            <CompareModal
              item={selectedCompareItem}
              allItems={files}
              onClose={() => setActiveView('queue')}
              onSelectFile={(item) => setSelectedCompareItem(item)}
              onDownload={downloadSingleFile}
            />
          )}

          {activeView === 'history' && (
            <BatchHistoryView
              files={files}
              stats={stats}
              onClearHistory={() => setFiles([])}
              onDownloadFile={downloadSingleFile}
            />
          )}
        </main>
      </div>

      {/* Shortcuts Modal */}
      <ShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />

      {/* Desktop Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-200 shadow-2xl animate-in slide-in-from-bottom-2 duration-150">
          {toast.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-blue-400 shrink-0" />
          )}
          <span className="font-medium">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-slate-500 hover:text-slate-300"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

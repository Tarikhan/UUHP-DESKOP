import React, { useState } from 'react';
import { Maximize2, Minimize2, Keyboard, ShieldCheck, Sparkles, FolderPlus } from 'lucide-react';

interface DesktopWindowChromeProps {
  onAddFilesClick: () => void;
  onOpenShortcuts: () => void;
  queueCount: number;
}

export const DesktopWindowChrome: React.FC<DesktopWindowChromeProps> = ({
  onAddFilesClick,
  onOpenShortcuts,
  queueCount,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <header className="h-11 bg-slate-950/80 border-b border-slate-800/80 backdrop-blur-md flex items-center justify-between px-4 select-none shrink-0 z-30">
      {/* Zone 1: Window Controls + Brand Wordmark */}
      <div className="flex items-center gap-3">
        {/* macOS style traffic lights */}
        <div className="flex items-center gap-2 pr-2">
          <div
            className="w-3 h-3 rounded-full bg-rose-500/80 hover:bg-rose-500 transition-colors cursor-pointer shadow-sm shadow-rose-950"
            title="Close Window"
          />
          <div
            className="w-3 h-3 rounded-full bg-amber-500/80 hover:bg-amber-500 transition-colors cursor-pointer shadow-sm shadow-amber-950"
            title="Minimize"
          />
          <div
            onClick={toggleFullscreen}
            className="w-3 h-3 rounded-full bg-emerald-500/80 hover:bg-emerald-500 transition-colors cursor-pointer shadow-sm shadow-emerald-950 flex items-center justify-center text-[7px] text-emerald-950 opacity-90"
            title={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
          >
            {isFullscreen ? '–' : '+'}
          </div>
        </div>

        {/* Brand Lockup */}
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md overflow-hidden bg-[#232122] border border-amber-500/40 shrink-0 flex items-center justify-center">
            <img
              src="/assets/aistudio/Backup_of_Backup_of_LOGO_UKSHIN_HOTI_FINAL2_5aff067f.jpg"
              alt="UHHP"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-xs font-semibold tracking-wider text-slate-200">
            UHHP DESKTOP
          </span>
          <span className="text-slate-600 text-xs">/</span>
          <span className="text-xs text-slate-400 font-medium">Batch PDF Compression Engine</span>
        </div>
      </div>

      {/* Zone 2: Window Status / Security Center */}
      <div className="hidden md:flex items-center gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-1.5 text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Local In-Memory Engine</span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400">Zero Cloud Upload</span>
        </div>

        {queueCount > 0 && (
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span className="tabular-nums">{queueCount}</span>
            <span>in queue</span>
          </div>
        )}
      </div>

      {/* Zone 3: Desktop Shortcuts & Quick Action */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenShortcuts}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded transition-colors text-xs flex items-center gap-1"
          title="Keyboard Shortcuts (Cmd/Ctrl + /)"
        >
          <Keyboard className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-[11px]">Shortcuts</span>
        </button>

        <button
          onClick={toggleFullscreen}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded transition-colors"
          title={isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={onAddFilesClick}
          className="ml-1 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm shadow-blue-900/50"
        >
          <FolderPlus className="w-3.5 h-3.5" />
          <span>Add PDFs</span>
        </button>
      </div>
    </header>
  );
};

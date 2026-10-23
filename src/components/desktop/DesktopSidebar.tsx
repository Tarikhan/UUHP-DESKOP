import React from 'react';
import {
  Layers,
  Sliders,
  SplitSquareVertical,
  History,
  FileCheck,
  HardDriveDownload,
  Zap,
  Shield,
} from 'lucide-react';
import { ActiveView, BatchStats, CompressionSettings } from '../../types/pdf';

interface DesktopSidebarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  queueCount: number;
  stats: BatchStats;
  settings: CompressionSettings;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  activeView,
  setActiveView,
  queueCount,
  stats,
  settings,
}) => {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const navItems: { id: ActiveView; label: string; icon: React.ReactNode; badge?: string | number }[] = [
    {
      id: 'queue',
      label: 'Batch Queue',
      icon: <Layers className="w-4 h-4" />,
      badge: queueCount > 0 ? queueCount : undefined,
    },
    {
      id: 'presets',
      label: 'Compression Engine',
      icon: <Sliders className="w-4 h-4" />,
      badge: settings.preset.toUpperCase(),
    },
    {
      id: 'compare',
      label: 'Visual Inspector',
      icon: <SplitSquareVertical className="w-4 h-4" />,
    },
    {
      id: 'history',
      label: 'Session Logs',
      icon: <History className="w-4 h-4" />,
      badge: stats.processedCount > 0 ? stats.processedCount : undefined,
    },
  ];

  return (
    <aside className="w-64 bg-slate-900/90 border-r border-slate-800 flex flex-col justify-between shrink-0 select-none">
      {/* Top: App Brand & Navigation */}
      <div className="p-4 space-y-6">
        {/* App Lockup */}
        <div className="flex items-center gap-3 px-1">
          <div className="w-11 h-11 rounded-xl overflow-hidden border border-amber-500/40 shadow-md shadow-black/50 shrink-0 bg-[#232122] flex items-center justify-center">
            <img
              src="/assets/aistudio/Backup_of_Backup_of_LOGO_UKSHIN_HOTI_FINAL2_5aff067f.jpg"
              alt="UHHP Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-slate-100 tracking-tight leading-tight truncate">
              UHHP Desktop
            </h1>
            <p className="text-[11px] text-amber-400 font-medium truncate">
              Universiteti "Ukshin Hoti"
            </p>
          </div>
        </div>

        {/* Primary View Navigation */}
        <nav className="space-y-1">
          <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase px-2 mb-2">
            Workspace
          </p>
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  {item.icon}
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] tabular-nums font-semibold px-1.5 py-0.5 rounded ${
                      isActive
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Current Active Engine Profile Card */}
        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium">Active Engine</span>
            <span className="text-blue-400 font-semibold capitalize">{settings.preset}</span>
          </div>

          <div className="space-y-1 text-[11px] text-slate-400">
            <div className="flex justify-between">
              <span>Target DPI</span>
              <span className="text-slate-300 tabular-nums">{settings.dpi} DPI</span>
            </div>
            <div className="flex justify-between">
              <span>Quality Factor</span>
              <span className="text-slate-300 tabular-nums">{Math.round(settings.quality * 100)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Grayscale Mode</span>
              <span className={settings.grayscale ? 'text-amber-400' : 'text-slate-400'}>
                {settings.grayscale ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Metadata Strip</span>
              <span className="text-emerald-400">Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Session Savings & Privacy Guarantee */}
      <div className="p-4 border-t border-slate-800/80 space-y-3 bg-slate-950/40">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <HardDriveDownload className="w-3.5 h-3.5 text-blue-400" />
              Session Saved
            </span>
            <span className="text-xs font-bold text-emerald-400 tabular-nums">
              {formatBytes(stats.totalSavedBytes)}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Avg Reduction</span>
            <span className="font-semibold text-slate-200 tabular-nums">
              {stats.averageReductionRatio > 0
                ? `-${(stats.averageReductionRatio * 100).toFixed(1)}%`
                : '0.0%'}
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800/60 flex items-center gap-2 text-[11px] text-slate-400">
          <Shield className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span className="leading-tight">Files processed locally in memory. Zero data transmitted.</span>
        </div>
      </div>
    </aside>
  );
};

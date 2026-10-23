import React from 'react';
import {
  Zap,
  Gauge,
  Printer,
  FileCheck2,
  SlidersHorizontal,
  Check,
  Info,
  Layers,
  Sparkles,
} from 'lucide-react';
import { CompressionPreset, CompressionSettings } from '../../types/pdf';

interface PresetSettingsPanelProps {
  settings: CompressionSettings;
  onUpdateSettings: (newSettings: Partial<CompressionSettings>) => void;
  onApplyAndCompress: () => void;
  pendingCount: number;
}

export const PresetSettingsPanel: React.FC<PresetSettingsPanelProps> = ({
  settings,
  onUpdateSettings,
  onApplyAndCompress,
  pendingCount,
}) => {
  const presets: {
    id: CompressionPreset;
    title: string;
    description: string;
    reductionEst: string;
    dpi: number;
    quality: number;
    grayscale: boolean;
    recommended?: boolean;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'extreme',
      title: 'Extreme Compression',
      description: 'Maximum reduction for large attachments, email limits, and long-term archiving.',
      reductionEst: '~70% – 85% smaller',
      dpi: 72,
      quality: 0.5,
      grayscale: false,
      icon: <Zap className="w-5 h-5 text-amber-400" />,
    },
    {
      id: 'balanced',
      title: 'Balanced (Recommended)',
      description: 'Superb balance between crisp text readability and substantial space savings.',
      reductionEst: '~50% – 70% smaller',
      dpi: 144,
      quality: 0.75,
      grayscale: false,
      recommended: true,
      icon: <Gauge className="w-5 h-5 text-blue-400" />,
    },
    {
      id: 'high_quality',
      title: 'High Fidelity / Print Ready',
      description: 'High resolution images preserved for viewing on 4K displays and physical printing.',
      reductionEst: '~30% – 50% smaller',
      dpi: 200,
      quality: 0.88,
      grayscale: false,
      icon: <Printer className="w-5 h-5 text-purple-400" />,
    },
    {
      id: 'lossless',
      title: 'Lossless Structural Clean',
      description: 'Recompresses object streams and cleans bloated metadata without touching vector paths.',
      reductionEst: '~10% – 30% smaller',
      dpi: 300,
      quality: 1.0,
      grayscale: false,
      icon: <FileCheck2 className="w-5 h-5 text-emerald-400" />,
    },
  ];

  const handleSelectPreset = (p: typeof presets[0]) => {
    onUpdateSettings({
      preset: p.id,
      dpi: p.dpi,
      quality: p.quality,
      grayscale: p.grayscale,
    });
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto space-y-6">
      {/* Title & Introduction */}
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-blue-400" />
          Compression Engine & Tuning
        </h2>
        <p className="text-xs text-slate-400">
          Choose an automated compression profile or fine-tune custom DPI downsampling, image stream re-encoding, and grayscale filtering.
        </p>
      </div>

      {/* Preset Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {presets.map((preset) => {
          const isSelected = settings.preset === preset.id;
          return (
            <div
              key={preset.id}
              onClick={() => handleSelectPreset(preset)}
              className={`relative p-4 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-blue-950/30 border-blue-500 shadow-md shadow-blue-950/50'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-slate-800 border border-slate-700/60">
                      {preset.icon}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                        {preset.title}
                        {preset.recommended && (
                          <span className="text-[10px] bg-blue-600/30 text-blue-400 border border-blue-500/40 px-1.5 py-0.2 rounded font-medium">
                            Default
                          </span>
                        )}
                      </h3>
                      <p className="text-[11px] font-semibold text-emerald-400 mt-0.5">
                        {preset.reductionEst}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-600 text-white'
                        : 'border-slate-700 bg-slate-800'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">{preset.description}</p>
              </div>

              {/* Technical specs strip */}
              <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center gap-3 text-[11px] text-slate-400 tabular-nums">
                <span>{preset.dpi} DPI</span>
                <span>·</span>
                <span>Quality {Math.round(preset.quality * 100)}%</span>
                <span>·</span>
                <span>Flate Streams</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Fine-Tuning Section */}
      <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-200">Custom Engine Parameters</span>
            {settings.preset === 'custom' && (
              <span className="text-[10px] text-amber-400 bg-amber-950/40 border border-amber-900/60 px-2 py-0.5 rounded">
                Custom Mode Active
              </span>
            )}
          </div>
          <button
            onClick={() => onUpdateSettings({ preset: 'custom' })}
            className={`text-xs px-2.5 py-1 rounded transition-colors ${
              settings.preset === 'custom'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Unlock Custom Controls
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* DPI Resolution Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 font-medium">Target DPI (Downsampling)</span>
              <span className="text-blue-400 font-semibold tabular-nums">{settings.dpi} DPI</span>
            </div>
            <input
              type="range"
              min="72"
              max="300"
              step="12"
              value={settings.dpi}
              onChange={(e) =>
                onUpdateSettings({
                  preset: 'custom',
                  dpi: parseInt(e.target.value, 10),
                })
              }
              className="w-full accent-blue-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>72 (Compact)</span>
              <span>150 (Standard)</span>
              <span>300 (Print)</span>
            </div>
          </div>

          {/* JPEG Quality Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 font-medium">Image Quality Factor</span>
              <span className="text-blue-400 font-semibold tabular-nums">
                {Math.round(settings.quality * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="20"
              max="95"
              step="5"
              value={Math.round(settings.quality * 100)}
              onChange={(e) =>
                onUpdateSettings({
                  preset: 'custom',
                  quality: parseInt(e.target.value, 10) / 100,
                })
              }
              className="w-full accent-blue-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>20% (Aggressive)</span>
              <span>75% (Balanced)</span>
              <span>95% (Near Lossless)</span>
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-800/80">
          {/* Grayscale Mode */}
          <label className="flex items-center gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 cursor-pointer hover:border-slate-700 transition-colors">
            <input
              type="checkbox"
              checked={settings.grayscale}
              onChange={(e) =>
                onUpdateSettings({
                  preset: 'custom',
                  grayscale: e.target.checked,
                })
              }
              className="w-4 h-4 accent-blue-500 rounded bg-slate-800 border-slate-700"
            />
            <div className="text-left">
              <p className="text-xs font-medium text-slate-200">Convert to Grayscale (B&W)</p>
              <p className="text-[11px] text-slate-400">
                Drastically slashes size for scanned contracts, receipts, and text invoices.
              </p>
            </div>
          </label>

          {/* Strip Metadata */}
          <label className="flex items-center gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 cursor-pointer hover:border-slate-700 transition-colors">
            <input
              type="checkbox"
              checked={settings.stripMetadata}
              onChange={(e) =>
                onUpdateSettings({
                  stripMetadata: e.target.checked,
                })
              }
              className="w-4 h-4 accent-blue-500 rounded bg-slate-800 border-slate-700"
            />
            <div className="text-left">
              <p className="text-xs font-medium text-slate-200">Strip All Hidden Metadata</p>
              <p className="text-[11px] text-slate-400">
                Purges author, software signatures, creation timestamps, and redundant XMP packets.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Apply Action Strip */}
      <div className="flex items-center justify-between p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <Info className="w-4 h-4 text-blue-400 shrink-0" />
          <span>
            Preset applies immediately to all pending and newly added PDF documents.
          </span>
        </div>

        {pendingCount > 0 && (
          <button
            onClick={onApplyAndCompress}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm shadow-blue-900/50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Apply & Compress {pendingCount} Pending</span>
          </button>
        )}
      </div>
    </div>
  );
};

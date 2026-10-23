export type CompressionPreset = 'extreme' | 'balanced' | 'high_quality' | 'lossless' | 'custom';

export interface CompressionSettings {
  preset: CompressionPreset;
  dpi: number; // 72, 96, 120, 144, 200, 300
  quality: number; // 0.2 to 1.0 (JPEG compression)
  grayscale: boolean; // convert pages/images to grayscale
  stripMetadata: boolean; // strip author, producer, title, xmp
  rasterizePages: boolean; // render canvas for max compression
  targetSizeKb: number | null; // target file size threshold
}

export interface PdfFileItem {
  id: string;
  name: string;
  originalSize: number; // bytes
  compressedSize: number | null; // bytes
  pageCount: number;
  originalBytes: Uint8Array;
  compressedBytes: Uint8Array | null;
  status: 'idle' | 'processing' | 'completed' | 'error';
  progress: number; // 0 - 100
  thumbnailUrl: string | null;
  errorMessage: string | null;
  reductionRatio: number | null; // e.g. 0.68 for 68% saved
  timeTakenMs: number | null;
  timestamp: number;
}

export interface BatchStats {
  totalFiles: number;
  processedCount: number;
  totalOriginalBytes: number;
  totalCompressedBytes: number;
  totalSavedBytes: number;
  averageReductionRatio: number;
}

export type ActiveView = 'queue' | 'presets' | 'compare' | 'history';

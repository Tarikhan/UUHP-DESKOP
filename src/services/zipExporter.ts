import JSZip from 'jszip';
import { PdfFileItem } from '../types/pdf';

/**
 * Packs all successfully compressed PDF files into a single ZIP archive
 */
export async function exportBatchAsZip(
  files: PdfFileItem[],
  zipFilename: string = 'UHHP_Compressed_Batch.zip',
  onProgress?: (percent: number) => void
): Promise<void> {
  const zip = new JSZip();

  let count = 0;
  for (const item of files) {
    if (item.compressedBytes && item.status === 'completed') {
      const baseName = item.name.replace(/\.pdf$/i, '');
      const compressedName = `${baseName}_uhhp_compressed.pdf`;
      zip.file(compressedName, item.compressedBytes);
      count++;
    }
  }

  if (count === 0) {
    throw new Error('No compressed files available to export');
  }

  const content = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      onProgress?.(Math.round(metadata.percent));
    }
  );

  // Trigger download
  const url = URL.createObjectURL(content);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = zipFilename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/**
 * Downloads a single compressed PDF file
 */
export function downloadSingleFile(item: PdfFileItem): void {
  const bytes = item.compressedBytes || item.originalBytes;
  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  const baseName = item.name.replace(/\.pdf$/i, '');
  anchor.download = `${baseName}_uhhp_compressed.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

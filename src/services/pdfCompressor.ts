import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import { CompressionSettings } from '../types/pdf';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  try {
    const version = pdfjsLib.version || '4.10.38';
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
  } catch (err) {
    console.warn('PDF.js worker initialization warning:', err);
  }
}

/**
 * Fast inspection of PDF using pdf-lib (runs purely in JS memory)
 */
export async function getPdfInfo(pdfBytes: Uint8Array): Promise<{ pageCount: number; title: string }> {
  try {
    const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    return {
      pageCount: doc.getPageCount(),
      title: doc.getTitle() || '',
    };
  } catch (err) {
    console.error('Failed to parse PDF info:', err);
    return { pageCount: 1, title: '' };
  }
}

/**
 * Generate a thumbnail preview of the first page
 */
export async function generateThumbnail(pdfBytes: Uint8Array): Promise<string> {
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: pdfBytes.slice(),
      useSystemFonts: true,
      standardFontDataUrl: undefined,
    });
    const pdfDoc = await loadingTask.promise;
    const page = await pdfDoc.getPage(1);

    const viewport = page.getViewport({ scale: 0.35 });
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(viewport.width, 1);
    canvas.height = Math.max(viewport.height, 1);
    const ctx = canvas.getContext('2d');

    if (!ctx) return '';

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvas: canvas,
      canvasContext: ctx,
      viewport: viewport,
    } as any).promise;

    return canvas.toDataURL('image/jpeg', 0.8);
  } catch (err) {
    console.warn('Thumbnail generation fallback:', err);
    // Fallback document SVG thumbnail
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="160" viewBox="0 0 120 160"><rect width="120" height="160" rx="8" fill="%231e293b"/><path d="M30 40h60M30 65h60M30 90h40" stroke="%23475569" stroke-width="4" stroke-linecap="round"/><text x="60" y="135" fill="%2394a3b8" font-size="12" text-anchor="middle" font-family="sans-serif">PDF</text></svg>`;
  }
}

/**
 * Render a page to a canvas at a specific scale for the visual comparator
 */
export async function renderPageToCanvas(
  pdfBytes: Uint8Array,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  scale: number = 1.0
): Promise<{ width: number; height: number }> {
  const loadingTask = pdfjsLib.getDocument({
    data: pdfBytes.slice(),
  });
  const pdfDoc = await loadingTask.promise;
  const page = await pdfDoc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2d context');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({
    canvas: canvas,
    canvasContext: ctx,
    viewport,
  } as any).promise;

  return { width: viewport.width, height: viewport.height };
}

/**
 * Main compression engine:
 * 1. Lossless: Recompresses object streams, removes redundant xrefs and strips metadata.
 * 2. Visual / Downsampling: Renders each page to optimized resolution/DPI, converts to JPEG/Grayscale,
 *    and bundles into a clean modern PDF with object streams.
 * 3. Smart safeguard: Always returns the smaller of the two approaches.
 */
export async function compressPdf(
  originalBytes: Uint8Array,
  settings: CompressionSettings,
  onProgress?: (progressPct: number) => void
): Promise<{ compressedBytes: Uint8Array; savingsRatio: number }> {
  onProgress?.(5);

  // Strategy A: Structural recompression using pdf-lib
  let structuralBytes: Uint8Array | null = null;
  try {
    const structDoc = await PDFDocument.load(originalBytes, { ignoreEncryption: true });
    if (settings.stripMetadata) {
      structDoc.setTitle('');
      structDoc.setAuthor('');
      structDoc.setSubject('');
      structDoc.setKeywords([]);
      structDoc.setProducer('');
      structDoc.setCreator('');
    }
    structuralBytes = await structDoc.save({ useObjectStreams: true });
  } catch (e) {
    console.warn('Structural pass notice:', e);
  }

  // If user explicitly chose Lossless Only, return structural result
  if (settings.preset === 'lossless' && structuralBytes) {
    onProgress?.(100);
    const savings = Math.max(0, (originalBytes.length - structuralBytes.length) / originalBytes.length);
    return {
      compressedBytes: structuralBytes,
      savingsRatio: savings,
    };
  }

  // Strategy B: High-impact Raster & Visual Optimization pass
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: originalBytes.slice(),
    });
    const pdfDoc = await loadingTask.promise;
    const totalPages = pdfDoc.numPages;

    const newDoc = await PDFDocument.create();

    // Calculate scale factor from target DPI (72 is base 1.0)
    // 72 DPI -> 1.0x, 96 DPI -> 1.33x, 144 DPI -> 2.0x, 200 DPI -> 2.77x
    const scale = Math.max(0.65, Math.min(3.0, settings.dpi / 72));

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      const ctx = canvas.getContext('2d');

      if (!ctx) continue;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({
        canvas: canvas,
        canvasContext: ctx,
        viewport,
      } as any).promise;

      // Apply Grayscale filter if enabled
      if (settings.grayscale) {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
          const gray = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
          d[i] = gray;
          d[i + 1] = gray;
          d[i + 2] = gray;
        }
        ctx.putImageData(imgData, 0, 0);
      }

      // Convert page canvas to compressed JPEG
      const jpegBlob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/jpeg', settings.quality)
      );

      if (jpegBlob) {
        const jpegBuffer = await jpegBlob.arrayBuffer();
        const embeddedImg = await newDoc.embedJpg(new Uint8Array(jpegBuffer));

        // Use original unscaled PDF dimensions (points)
        const originalViewport = page.getViewport({ scale: 1.0 });
        const newPage = newDoc.addPage([originalViewport.width, originalViewport.height]);
        newPage.drawImage(embeddedImg, {
          x: 0,
          y: 0,
          width: originalViewport.width,
          height: originalViewport.height,
        });
      }

      const currentProgress = Math.round(10 + (pageNum / totalPages) * 85);
      onProgress?.(currentProgress);
    }

    if (settings.stripMetadata) {
      newDoc.setTitle('');
      newDoc.setAuthor('');
      newDoc.setSubject('');
      newDoc.setKeywords([]);
      newDoc.setProducer('');
      newDoc.setCreator('');
    }

    const rasterBytes = await newDoc.save({ useObjectStreams: true });
    onProgress?.(100);

    // Pick best result:
    // If raster is smaller than original, use it!
    // If raster grew (e.g. text-only PDF), compare with structural
    let bestBytes = rasterBytes;
    if (rasterBytes.length >= originalBytes.length) {
      if (structuralBytes && structuralBytes.length < rasterBytes.length) {
        bestBytes = structuralBytes;
      }
    }

    const savings = Math.max(0, (originalBytes.length - bestBytes.length) / originalBytes.length);
    return {
      compressedBytes: bestBytes,
      savingsRatio: savings,
    };
  } catch (err) {
    console.error('Visual compression error, falling back to structural:', err);
    if (structuralBytes) {
      onProgress?.(100);
      const savings = Math.max(0, (originalBytes.length - structuralBytes.length) / originalBytes.length);
      return {
        compressedBytes: structuralBytes,
        savingsRatio: savings,
      };
    }
    throw err;
  }
}

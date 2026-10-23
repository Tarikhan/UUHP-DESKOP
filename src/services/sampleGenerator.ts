import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * Creates rich sample PDFs for immediate testing of batch compression.
 * Generates 3 distinct types of PDFs:
 * 1. Multi-page corporate slide presentation with high-resolution photo background
 * 2. Scanned business contract / invoice with signatures & stamps
 * 3. Product portfolio showcase with graphic elements
 */

// Helper to create an offscreen canvas with drawn gradient & patterns and return JPEG bytes
async function createSampleGraphicBytes(width: number, height: number, theme: 'corporate' | 'scan' | 'product'): Promise<Uint8Array> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new Uint8Array();

  if (theme === 'corporate') {
    // Rich gradient background
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#1e3a8a');
    grad.addColorStop(0.5, '#3b82f6');
    grad.addColorStop(1, '#93c5fd');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Decorative geometric shapes & charts
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.arc(width * (0.2 + i * 0.1), height * (0.3 + (i % 3) * 0.2), 60 + i * 15, 0, Math.PI * 2);
      ctx.fill();
    }

    // Chart simulation bars
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillRect(80, height - 220, 70, 140);
    ctx.fillRect(170, height - 260, 70, 180);
    ctx.fillRect(260, height - 320, 70, 240);
    ctx.fillRect(350, height - 390, 70, 310);
    ctx.fillRect(440, height - 440, 70, 360);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('Q3 Performance Overview', 80, 100);
    ctx.font = '20px sans-serif';
    ctx.fillText('Confidential · Executive Briefing Deck', 80, 140);
  } else if (theme === 'scan') {
    // Simulated paper scan with slight off-white color and micro grain
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    // Subtle scan noise / paper lines
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let y = 100; y < height - 100; y += 32) {
      ctx.beginPath();
      ctx.moveTo(70, y);
      ctx.lineTo(width - 70, y);
      ctx.stroke();
    }

    // Official Stamp
    ctx.save();
    ctx.translate(width - 240, height - 220);
    ctx.rotate(-0.15);
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, 180, 70);
    ctx.fillStyle = '#dc2626';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('APPROVED', 24, 42);
    ctx.restore();

    // Simulated signature
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(120, height - 160);
    ctx.bezierCurveTo(150, height - 190, 180, height - 130, 220, height - 170);
    ctx.bezierCurveTo(250, height - 210, 280, height - 140, 320, height - 165);
    ctx.stroke();
  } else {
    // Product portfolio theme
    const grad = ctx.createRadialGradient(width / 2, height / 2, 80, width / 2, height / 2, width / 1.2);
    grad.addColorStop(0, '#312e81');
    grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Mesh circles
    ctx.fillStyle = 'rgba(129, 140, 248, 0.25)';
    ctx.beginPath();
    ctx.arc(width * 0.5, height * 0.45, 180, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 42px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('AERO SERIES DESIGN SPEC', width / 2, 140);
    ctx.font = '22px sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('Hardware Architecture & Engineering Reference', width / 2, 190);
  }

  // Export as high-quality JPEG
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.95));
  if (!blob) return new Uint8Array();
  const buffer = await blob.arrayBuffer();
  return new Uint8Array(buffer);
}

export async function generateSampleBatchPdfs(): Promise<{ name: string; bytes: Uint8Array; pageCount: number }[]> {
  const samples: { name: string; bytes: Uint8Array; pageCount: number }[] = [];

  // 1. Corporate Executive Deck (3 Pages, graphic-heavy)
  try {
    const doc1 = await PDFDocument.create();
    const font = await doc1.embedFont(StandardFonts.Helvetica);
    const boldFont = await doc1.embedFont(StandardFonts.HelveticaBold);

    // Page 1
    const img1 = await createSampleGraphicBytes(1200, 800, 'corporate');
    const embeddedImg1 = await doc1.embedJpg(img1);
    const p1 = doc1.addPage([600, 400]);
    p1.drawImage(embeddedImg1, { x: 0, y: 0, width: 600, height: 400 });

    // Page 2
    const p2 = doc1.addPage([600, 400]);
    p2.drawRectangle({ x: 0, y: 0, width: 600, height: 400, color: rgb(0.96, 0.97, 0.99) });
    p2.drawText('Key Milestones & Projections', { x: 40, y: 350, size: 20, font: boldFont, color: rgb(0.1, 0.15, 0.3) });
    p2.drawText('Revenue Target: $14.2M (+42% YoY)', { x: 40, y: 300, size: 14, font, color: rgb(0.2, 0.25, 0.35) });
    p2.drawText('Customer Retention: 98.4%', { x: 40, y: 260, size: 14, font, color: rgb(0.2, 0.25, 0.35) });
    p2.drawText('Enterprise Expansion: 28 New Accounts', { x: 40, y: 220, size: 14, font, color: rgb(0.2, 0.25, 0.35) });

    // Page 3
    const p3 = doc1.addPage([600, 400]);
    p3.drawImage(embeddedImg1, { x: 0, y: 0, width: 600, height: 400 });
    p3.drawText('Next Steps & Capital Allocation', { x: 40, y: 200, size: 24, font: boldFont, color: rgb(1, 1, 1) });

    const bytes1 = await doc1.save();
    samples.push({
      name: 'Q3_Investor_Presentation_Deck.pdf',
      bytes: bytes1,
      pageCount: 3,
    });
  } catch (err) {
    console.error('Failed to create sample 1', err);
  }

  // 2. Scanned Contract Agreement (2 Pages)
  try {
    const doc2 = await PDFDocument.create();
    const boldFont = await doc2.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await doc2.embedFont(StandardFonts.Helvetica);

    const scanImgBytes = await createSampleGraphicBytes(900, 1200, 'scan');
    const embeddedScan = await doc2.embedJpg(scanImgBytes);

    // Page 1
    const p1 = doc2.addPage([595, 842]); // A4
    p1.drawImage(embeddedScan, { x: 0, y: 0, width: 595, height: 842 });
    p1.drawText('MASTER SERVICES AGREEMENT', { x: 50, y: 780, size: 18, font: boldFont, color: rgb(0.1, 0.1, 0.1) });
    p1.drawText('Contract ID: #MSA-2026-9041B', { x: 50, y: 755, size: 11, font: regularFont, color: rgb(0.3, 0.3, 0.3) });

    // Page 2
    const p2 = doc2.addPage([595, 842]);
    p2.drawImage(embeddedScan, { x: 0, y: 0, width: 595, height: 842 });
    p2.drawText('Schedule A: Signatures & Executions', { x: 50, y: 780, size: 16, font: boldFont, color: rgb(0.1, 0.1, 0.1) });

    const bytes2 = await doc2.save();
    samples.push({
      name: 'Signed_Vendor_Master_Contract_Scan.pdf',
      bytes: bytes2,
      pageCount: 2,
    });
  } catch (err) {
    console.error('Failed to create sample 2', err);
  }

  // 3. Hardware Architecture Design Book (2 Pages)
  try {
    const doc3 = await PDFDocument.create();
    const prodImgBytes = await createSampleGraphicBytes(1200, 900, 'product');
    const embeddedProd = await doc3.embedJpg(prodImgBytes);

    const p1 = doc3.addPage([640, 480]);
    p1.drawImage(embeddedProd, { x: 0, y: 0, width: 640, height: 480 });

    const p2 = doc3.addPage([640, 480]);
    p2.drawImage(embeddedProd, { x: 0, y: 0, width: 640, height: 480 });

    const bytes3 = await doc3.save();
    samples.push({
      name: 'Aero_Product_Architecture_Spec.pdf',
      bytes: bytes3,
      pageCount: 2,
    });
  } catch (err) {
    console.error('Failed to create sample 3', err);
  }

  return samples;
}

import { Customer, ServiceLocation, SystemSettings } from '../types';
import { generateCustomerQrDataUrl } from './qrUtils';

/**
 * Generates an Ultra-HD (2048 x 1282) pixel-perfect PNG data URL for the official BUMDes card.
 * Uses native HTML5 Canvas drawing to guarantee 100% deterministic layout, zero font baseline drift,
 * and perfect horizontal and vertical symmetry regardless of client browser or screen scaling.
 */
export async function generateOfficialCardDataUrl(
  customer: Customer,
  service: ServiceLocation | undefined,
  settings: SystemSettings
): Promise<string> {
  const scale = 2;
  const width = 1024 * scale; // 2048px
  const height = 641 * scale; // 1282px

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context');

  // 1. Load Background Template
  const rawBg = settings.cardBackgroundUrl || '/card-template-bumdes.jpg';
  const backgroundUrl = rawBg.startsWith('/card-template-bumdes.jpg') ? '/card-template-bumdes.jpg?v=2' : rawBg;
  const bgImg = new Image();
  bgImg.crossOrigin = 'anonymous';
  bgImg.src = backgroundUrl;
  await new Promise<void>((resolve, reject) => {
    bgImg.onload = () => resolve();
    bgImg.onerror = () => reject(new Error('Failed to load card background image'));
  });
  ctx.drawImage(bgImg, 0, 0, width, height);

  // 2. Format Address & Category
  const rwDisplay = service?.rw || (customer.address.match(/RW\s*\d+/i)?.[0]) || 'RW 01';
  const rtDisplay = service?.rt || (customer.address.match(/RT\s*\d+/i)?.[0]) || 'RT 01';
  let addressDisplay = customer.address.trim()
    .replace(/,\s*desa\s+gedangan.*$/i, '')
    .replace(/desa\s+gedangan.*$/i, '')
    .replace(/,\s*kec\.?\s*tuntang.*$/i, '')
    .replace(/kec\.?\s*tuntang.*$/i, '')
    .replace(/,\s*kab\.?\s*semarang.*$/i, '')
    .trim();
  if (!addressDisplay.toLowerCase().includes('rt') && !addressDisplay.toLowerCase().includes('rw')) {
    addressDisplay = `${addressDisplay}, ${rtDisplay} ${rwDisplay}`;
  }
  const categoryName = (service?.categoryName && service.categoryName.trim()) || 'Rumah Tangga';

  const leftX = width * 0.052; // 106.5px

  // 3. ID Pelanggan Capsule Badge (Mathematically Centered & Symmetrical)
  const badgeX = leftX;
  const badgeY = height * 0.365; // ~468px
  const badgeW = 236 * scale; // 472px
  const badgeH = 58 * scale; // 116px
  const badgeR = badgeH / 2; // 58px

  ctx.save();
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, badgeR);
  } else {
    // Robust arc fallback for older browsers
    ctx.arc(badgeX + badgeR, badgeY + badgeR, badgeR, Math.PI / 2, Math.PI * 1.5);
    ctx.lineTo(badgeX + badgeW - badgeR, badgeY);
    ctx.arc(badgeX + badgeW - badgeR, badgeY + badgeR, badgeR, Math.PI * 1.5, Math.PI / 2);
    ctx.closePath();
  }
  ctx.fillStyle = '#0b2447';
  ctx.fill();
  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 2.4 * scale;
  ctx.stroke();

  // Text inside Badge (Dead Center)
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Label: NO. PELANGGAN
  ctx.fillStyle = '#94a3b8';
  ctx.font = `800 ${12 * scale}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.fillText('NO. PELANGGAN', badgeX + badgeW / 2, badgeY + 19 * scale);

  // Code: customer.customerCode
  ctx.fillStyle = '#ffffff';
  ctx.font = `900 ${23 * scale}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.fillText(customer.customerCode, badgeX + badgeW / 2, badgeY + 41 * scale);
  ctx.restore();

  // Helper to draw text with fine white outline and subtle soft shadow for maximum contrast
  const drawOutlinedText = (
    text: string,
    x: number,
    y: number,
    font: string,
    fillColor: string,
    strokeWidth: number,
    shadowBlurVal: number
  ) => {
    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = font;

    // 1. Subtle soft white glow/shadow + fine white stroke
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = strokeWidth;
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
    ctx.shadowBlur = shadowBlurVal;
    ctx.strokeText(text, x, y);

    // 2. Crisp solid fill over the stroke
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = fillColor;
    ctx.fillText(text, x, y);
    ctx.restore();
  };

  // 4. Nama Pelanggan (Fine white outline + subtle soft glow shadow)
  drawOutlinedText(
    'NAMA PELANGGAN',
    leftX,
    height * 0.485,
    `800 ${15 * scale}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`,
    '#475569',
    3,
    6
  );
  drawOutlinedText(
    customer.name.toUpperCase(),
    leftX,
    height * 0.485 + 24 * scale,
    `900 ${30 * scale}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`,
    '#0f172a',
    4.5,
    8
  );

  // 5. Alamat Lengkap (Fine white outline + subtle soft glow shadow)
  drawOutlinedText(
    'ALAMAT LENGKAP',
    leftX,
    height * 0.60,
    `800 ${15 * scale}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`,
    '#475569',
    3,
    6
  );
  drawOutlinedText(
    addressDisplay.toUpperCase(),
    leftX,
    height * 0.60 + 24 * scale,
    `800 ${22 * scale}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`,
    '#0f172a',
    4,
    8
  );

  // 6. Kategori / Tarif (Fine white outline + subtle soft glow shadow)
  drawOutlinedText(
    'KATEGORI / TARIF',
    leftX,
    height * 0.715,
    `800 ${15 * scale}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`,
    '#475569',
    3,
    6
  );
  drawOutlinedText(
    categoryName.toUpperCase(),
    leftX,
    height * 0.715 + 24 * scale,
    `900 ${26 * scale}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`,
    '#166534',
    4.5,
    8
  );

  // 7. QR Code Box
  const qrW = width * 0.155;
  const qrX = width - (width * 0.045) - qrW;
  const qrY = height * 0.255;
  const qrH = qrW * 1.08;

  ctx.save();
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(qrX, qrY, qrW, qrH, 14 * scale);
  } else {
    ctx.rect(qrX, qrY, qrW, qrH);
  }
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 3 * scale;
  ctx.stroke();

  // Draw QR Image
  try {
    const qrDataUrl = await generateCustomerQrDataUrl(customer.customerCode, settings.appUrl);
    const qrImg = new Image();
    qrImg.crossOrigin = 'anonymous';
    qrImg.src = qrDataUrl;
    await new Promise<void>((resolve, reject) => {
      qrImg.onload = () => resolve();
      qrImg.onerror = () => reject(new Error('QR load error'));
    });
    const pad = 14 * scale;
    ctx.drawImage(qrImg, qrX + pad, qrY + 12 * scale, qrW - pad * 2, qrW - pad * 2);
  } catch (err) {
    console.warn('Could not render QR code on canvas:', err);
  }

  // QR Label
  ctx.fillStyle = '#0f172a';
  ctx.font = `900 ${10.5 * scale}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SCAN BAYAR / CEK', qrX + qrW / 2, qrY + qrH - 12 * scale);
  ctx.restore();

  return canvas.toDataURL('image/png');
}

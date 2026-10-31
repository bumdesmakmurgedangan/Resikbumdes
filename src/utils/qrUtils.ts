import QRCode from 'qrcode';

/**
 * Generates a clean, crisp data URL (base64 image) for customer QR code.
 * Encodes deep-link format if appUrl is available or pure customerCode.
 */
export async function generateCustomerQrDataUrl(
  customerCode: string,
  appUrl?: string
): Promise<string> {
  const code = (customerCode || '').trim();
  if (!code) return '';

  // Encode clean URL so standard camera phones can also scan and open directly
  let targetPayload = code;
  if (appUrl) {
    try {
      const baseUrl = appUrl.replace(/\/+$/, '');
      targetPayload = `${baseUrl}/?code=${encodeURIComponent(code)}`;
    } catch {
      targetPayload = code;
    }
  } else if (typeof window !== 'undefined' && window.location?.origin) {
    targetPayload = `${window.location.origin}/?code=${encodeURIComponent(code)}`;
  }

  try {
    return await QRCode.toDataURL(targetPayload, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 320,
      color: {
        dark: '#0f172a', // Deep slate for sharp barcode reading
        light: '#ffffff'
      }
    });
  } catch (err) {
    console.error('Failed to generate QR code', err);
    return '';
  }
}

/**
 * Parses scanned text from QR scanner.
 * Supports:
 * - URL format (e.g. https://domain.com/?code=PLG-RW03-0025 or ?customer=...)
 * - Raw customer code (e.g. PLG-RW03-0025)
 */
export function parseScannedCustomerCode(rawText: string): string {
  if (!rawText) return '';
  const text = rawText.trim();

  // 1. Try URL parsing
  if (text.startsWith('http://') || text.startsWith('https://')) {
    try {
      const url = new URL(text);
      const codeParam = url.searchParams.get('code') || 
                        url.searchParams.get('customer') || 
                        url.searchParams.get('id');
      if (codeParam) {
        return codeParam.trim();
      }

      // Check URL path like /customer/PLG-RW03-0025
      const parts = url.pathname.split('/').filter(Boolean);
      for (const part of parts) {
        if (/^PLG-|^[A-Z0-9-]{6,}$/i.test(part)) {
          return part.trim();
        }
      }
    } catch {
      // Fallback to regex
    }
  }

  // 2. Direct regex match for customer code pattern like PLG-RW03-0025
  const match = text.match(/PLG-[A-Za-z0-9-]+/i);
  if (match) {
    return match[0].trim();
  }

  // 3. Raw return if it looks like an identifier
  return text.replace(/^[?&]code=/, '').trim();
}

/**
 * Synthesizes a crisp, polite audio confirmation chime on scan success
 * without requiring external sound files.
 */
export function playSuccessBeep() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12); // E6 note

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.18);
  } catch (err) {
    // Audio context may be blocked by autoplay policies in some scenarios, ignore silently
  }
}

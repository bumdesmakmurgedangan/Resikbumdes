import React, { useEffect, useState } from 'react';
import { Customer, ServiceLocation, SystemSettings } from '../../types';
import { generateCustomerQrDataUrl } from '../../utils/qrUtils';
import { Phone } from 'lucide-react';

interface CustomerCardProps {
  customer: Customer;
  service?: ServiceLocation;
  settings: SystemSettings;
  variant?: 'single' | 'sheet';
  qrDataUrl?: string; // Precomputed QR data URL for batch performance
}

export const CustomerCard: React.FC<CustomerCardProps> = ({
  customer,
  service,
  settings,
  variant = 'single',
  qrDataUrl: initialQrUrl
}) => {
  const [qrUrl, setQrUrl] = useState<string>(initialQrUrl || '');

  useEffect(() => {
    if (initialQrUrl) {
      setQrUrl(initialQrUrl);
      return;
    }

    let active = true;
    generateCustomerQrDataUrl(customer.customerCode, settings.appUrl).then(url => {
      if (active) setQrUrl(url);
    });

    return () => {
      active = false;
    };
  }, [customer.customerCode, settings.appUrl, initialQrUrl]);

  // Address and RW details
  const rwDisplay = service?.rw || (customer.address.match(/RW\s*\d+/i)?.[0]) || 'RW 01';
  const rtDisplay = service?.rt || (customer.address.match(/RT\s*\d+/i)?.[0]) || 'RT 01';
  const categoryName = (service?.categoryName && service.categoryName.trim()) || 'Rumah Tangga';

  // Format single-line address: REMOVE Desa Gedangan, Kec. Tuntang as explicitly requested
  const formatAddress = () => {
    let raw = customer.address.trim();
    // Strip village, district, or regency details to keep address single-line and spacious
    raw = raw
      .replace(/,\s*desa\s+gedangan.*$/i, '')
      .replace(/desa\s+gedangan.*$/i, '')
      .replace(/,\s*kec\.?\s*tuntang.*$/i, '')
      .replace(/kec\.?\s*tuntang.*$/i, '')
      .replace(/,\s*kab\.?\s*semarang.*$/i, '')
      .trim();

    if (!raw.toLowerCase().includes('rt') && !raw.toLowerCase().includes('rw')) {
      raw = `${raw}, ${rtDisplay} ${rwDisplay}`;
    }
    return raw;
  };

  const addressDisplay = formatAddress();
  const phoneDisplay = settings.phoneWhatsapp || '0851-5073-6692';

  // Theme settings: Default to BUMDES_OFFICIAL
  const theme = settings.cardTheme || 'BUMDES_OFFICIAL';
  const rawBg = settings.cardBackgroundUrl || '/card-template-bumdes.jpg';
  const backgroundUrl = rawBg.startsWith('/card-template-bumdes.jpg') ? '/card-template-bumdes.jpg?v=2' : rawBg;
  const isOfficialTemplate = theme === 'BUMDES_OFFICIAL' || backgroundUrl.includes('card-template-bumdes');

  // Category Icon helper: Returns clean inline SVG for 100% html2canvas compatibility
  const renderCategorySvg = (color: string = '#ffffff', size: number = 10) => {
    const cat = categoryName.toLowerCase();
    if (cat.includes('umkm') || cat.includes('toko') || cat.includes('warung')) {
      // Store / Shop icon
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <path d="M9 22V12h6v10" />
        </svg>
      );
    }
    if (cat.includes('perusahaan') || cat.includes('industri') || cat.includes('pabrik')) {
      // Building icon
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
          <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
          <path d="M9 22v-4h6v4" />
          <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" />
        </svg>
      );
    }
    // Default Home icon
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    );
  };

  // =========================================================================
  // 1. VARIANT: SHEET (A4 8-CARDS GRID PRINT & DOWNLOAD)
  // =========================================================================
  if (variant === 'sheet') {
    if (isOfficialTemplate) {
      return (
        <div
          className="relative w-full h-[58mm] max-h-[58mm] rounded-xl border border-dashed border-slate-300 overflow-hidden shadow-sm page-avoid-break print:shadow-none print:border-slate-400 select-none bg-white font-sans"
        >
          {/* Background template */}
          <img
            src={backgroundUrl}
            alt="Card Template"
            className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
            crossOrigin="anonymous"
          />

          {/* 1. No. Pelanggan Badge (Badge Kapsul Navy Ringkas & Simetris) */}
          <div
            style={{
              position: 'absolute',
              top: '36.5%',
              left: '5.2%',
              backgroundColor: '#0b2447',
              border: '1px solid #2563eb',
              borderRadius: '9999px',
              padding: '3px 7px 1.5px 7px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              display: 'inline-block',
              textAlign: 'center',
              whiteSpace: 'nowrap'
            }}
          >
            <div
              style={{
                fontSize: '4.5px',
                fontWeight: 800,
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                lineHeight: 1,
                marginBottom: '1px',
                textAlign: 'center'
              }}
            >
              NO. PELANGGAN
            </div>
            <div
              style={{
                fontSize: '7.5px',
                fontWeight: 900,
                color: '#ffffff',
                letterSpacing: '0.04em',
                lineHeight: 1,
                margin: 0,
                padding: 0,
                textAlign: 'center'
              }}
            >
              {customer.customerCode}
            </div>
          </div>

          {/* 2. Nama Pelanggan (Garis Halus + Sedikit Shadow Kontras) */}
          <div
            style={{
              position: 'absolute',
              top: '48.5%',
              left: '5.2%',
              maxWidth: '48%'
            }}
          >
            <span style={{ fontSize: '5.5px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', lineHeight: 1, display: 'block', marginBottom: '1px', textShadow: '0 0 2px #ffffff' }}>
              NAMA PELANGGAN
            </span>
            <p style={{ fontSize: '9.5px', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', lineHeight: 1.2, margin: 0, textShadow: '-0.4px -0.4px 0 #ffffff, 0.4px -0.4px 0 #ffffff, -0.4px 0.4px 0 #ffffff, 0.4px 0.4px 0 #ffffff, 0 0 3px rgba(255,255,255,0.9)' }}>
              {customer.name}
            </p>
          </div>

          {/* 3. Alamat Lengkap (Single Line - Garis Halus + Sedikit Shadow) */}
          <div
            style={{
              position: 'absolute',
              top: '60%',
              left: '5.2%',
              maxWidth: '48%'
            }}
          >
            <span style={{ fontSize: '5.5px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', lineHeight: 1, display: 'block', marginBottom: '1px', textShadow: '0 0 2px #ffffff' }}>
              ALAMAT LENGKAP
            </span>
            <p style={{ fontSize: '7.5px', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, margin: 0, textTransform: 'uppercase', textShadow: '-0.35px -0.35px 0 #ffffff, 0.35px -0.35px 0 #ffffff, -0.35px 0.35px 0 #ffffff, 0.35px 0.35px 0 #ffffff, 0 0 3px rgba(255,255,255,0.9)' }}>
              {addressDisplay}
            </p>
          </div>

          {/* 4. Kategori / Tarif (Teks Bersih - Garis Halus + Sedikit Shadow) */}
          <div
            style={{
              position: 'absolute',
              top: '71.5%',
              left: '5.2%',
              maxWidth: '48%'
            }}
          >
            <span style={{ fontSize: '5.5px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', lineHeight: 1, display: 'block', marginBottom: '1px', textShadow: '0 0 2px #ffffff' }}>
              KATEGORI / TARIF
            </span>
            <p style={{ fontSize: '8.5px', fontWeight: 900, color: '#166534', lineHeight: 1.2, margin: 0, textTransform: 'uppercase', textShadow: '-0.4px -0.4px 0 #ffffff, 0.4px -0.4px 0 #ffffff, -0.4px 0.4px 0 #ffffff, 0.4px 0.4px 0 #ffffff, 0 0 3px rgba(255,255,255,0.9)' }}>
              {categoryName}
            </p>
          </div>

          {/* 5. QR Code Box (Shifted to right under KARTU PELANGGAN RESMI) */}
          <div
            className="absolute z-10 flex flex-col items-center justify-center p-0.5 bg-white rounded-lg border-2 border-[#10b981] shadow-xs text-slate-900"
            style={{ top: '25.5%', right: '4.5%', width: '15.5%' }}
          >
            {qrUrl ? (
              <img
                src={qrUrl}
                alt={`QR ${customer.customerCode}`}
                className="w-full aspect-square object-contain rounded"
              />
            ) : (
              <div className="w-full aspect-square bg-slate-100 animate-pulse rounded" />
            )}
            <span className="text-[4.5px] font-black text-slate-900 tracking-wider uppercase mt-0.5 text-center">
              SCAN BAYAR
            </span>
          </div>

          {/* Footer: Official template has phone 0851-5073-6692 printed */}
        </div>
      );
    }

    // Fallback Sheet Mode for other themes (Emerald Gold, Royal Navy, Modern Clean)
    return (
      <div
        className={`relative w-full h-[58mm] max-h-[58mm] rounded-xl border border-dashed border-slate-300 p-2.5 flex flex-col justify-between overflow-hidden shadow-sm page-avoid-break print:shadow-none print:border-slate-400 select-none ${
          theme === 'ROYAL_NAVY'
            ? 'bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#0369a1] text-white'
            : theme === 'MODERN_CLEAN'
            ? 'bg-gradient-to-br from-white via-slate-50 to-emerald-50/70 text-slate-900 border border-slate-300'
            : 'bg-gradient-to-br from-[#042f2e] via-[#065f46] to-[#022c22] text-white'
        }`}
      >
        <div className="flex items-center justify-between pb-1 border-b border-white/15">
          <span className="text-[9px] font-black tracking-wide text-white uppercase">
            {settings.bumdesName || 'BUMDES MAKMUR GEDANGAN'}
          </span>
          <span className="text-[7.5px] font-bold px-1.5 py-0.5 rounded bg-white/15 text-emerald-200">
            {rwDisplay} / {rtDisplay}
          </span>
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-2 items-center my-auto py-0.5">
          <div className="space-y-1 min-w-0 pr-1">
            <div className="inline-block bg-slate-950/90 text-emerald-300 font-mono text-[9.5px] font-bold px-1.5 py-0.5 rounded">
              {customer.customerCode}
            </div>
            <p className="text-[11px] font-black text-white truncate">{customer.name}</p>
            <p className="text-[8px] text-slate-200 truncate">{addressDisplay}</p>
            <p className="text-[8px] text-emerald-300 font-bold">{categoryName}</p>
          </div>
          <div className="flex flex-col items-center justify-center p-1 bg-white rounded-lg text-slate-900 shrink-0">
            {qrUrl && <img src={qrUrl} alt="" className="w-[16mm] h-[16mm] object-contain rounded" />}
            <span className="text-[6px] font-black text-slate-800 tracking-wider uppercase mt-0.5">SCAN BAYAR</span>
          </div>
        </div>

        <div className="pt-1 border-t border-white/15 flex items-center justify-between text-[7px] text-emerald-200/80">
          <span>Retribusi Sampah Desa</span>
          <span>CS: {phoneDisplay}</span>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. VARIANT: SINGLE CARD (RESPONSIVE PREVIEW IN MODAL & DIRECT DOWNLOAD)
  // =========================================================================
  if (isOfficialTemplate) {
    return (
      <div
        id="customer-card-render-target"
        className="relative w-full max-w-[480px] aspect-[1024/641] rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden border border-emerald-500/20 select-none print:shadow-none print:border-slate-800 bg-white font-sans"
      >
        {/* Crisp Template Background Image */}
        <img
          src={backgroundUrl}
          alt="Card Template"
          className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
          crossOrigin="anonymous"
        />

        {/* 1. No. Pelanggan Badge (Badge Kapsul Navy Ringkas & Simetris) */}
        <div
          style={{
            position: 'absolute',
            top: '36.5%',
            left: '5.2%',
            backgroundColor: '#0b2447',
            border: '1.2px solid #2563eb',
            borderRadius: '9999px',
            padding: '5px 14px 3px 14px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            display: 'inline-block',
            textAlign: 'center',
            whiteSpace: 'nowrap'
          }}
        >
          <div
            style={{
              fontSize: '6.5px',
              fontWeight: 800,
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              lineHeight: 1,
              marginBottom: '1.5px',
              textAlign: 'center'
            }}
          >
            NO. PELANGGAN
          </div>
          <div
            style={{
              fontSize: '11.5px',
              fontWeight: 900,
              color: '#ffffff',
              letterSpacing: '0.05em',
              lineHeight: 1,
              margin: 0,
              padding: 0,
              textAlign: 'center'
            }}
          >
            {customer.customerCode}
          </div>
        </div>

        {/* 2. Nama Pelanggan (Garis Halus + Sedikit Shadow Kontras) */}
        <div
          style={{
            position: 'absolute',
            top: '48.5%',
            left: '5.2%',
            maxWidth: '52%'
          }}
        >
          <span
            style={{
              fontSize: '8px',
              fontWeight: 800,
              color: '#475569',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              lineHeight: 1,
              display: 'block',
              marginBottom: '2px',
              textShadow: '-0.5px -0.5px 0 #ffffff, 0.5px -0.5px 0 #ffffff, -0.5px 0.5px 0 #ffffff, 0.5px 0.5px 0 #ffffff, 0 0 4px rgba(255,255,255,0.9)'
            }}
          >
            NAMA PELANGGAN
          </span>
          <h4
            style={{
              fontSize: '15px',
              fontWeight: 900,
              color: '#0f172a',
              textTransform: 'uppercase',
              lineHeight: 1.2,
              margin: 0,
              padding: 0,
              textShadow: '-0.8px -0.8px 0 #ffffff, 0.8px -0.8px 0 #ffffff, -0.8px 0.8px 0 #ffffff, 0.8px 0.8px 0 #ffffff, 0 1px 5px rgba(255,255,255,0.95)'
            }}
          >
            {customer.name}
          </h4>
        </div>

        {/* 3. Alamat Lengkap (Single line - Garis Halus + Sedikit Shadow) */}
        <div
          style={{
            position: 'absolute',
            top: '60%',
            left: '5.2%',
            maxWidth: '52%'
          }}
        >
          <span
            style={{
              fontSize: '8px',
              fontWeight: 800,
              color: '#475569',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              lineHeight: 1,
              display: 'block',
              marginBottom: '2px',
              textShadow: '-0.5px -0.5px 0 #ffffff, 0.5px -0.5px 0 #ffffff, -0.5px 0.5px 0 #ffffff, 0.5px 0.5px 0 #ffffff, 0 0 4px rgba(255,255,255,0.9)'
            }}
          >
            ALAMAT LENGKAP
          </span>
          <p
            style={{
              fontSize: '11.5px',
              fontWeight: 800,
              color: '#0f172a',
              lineHeight: 1.25,
              margin: 0,
              textTransform: 'uppercase',
              textShadow: '-0.7px -0.7px 0 #ffffff, 0.7px -0.7px 0 #ffffff, -0.7px 0.7px 0 #ffffff, 0.7px 0.7px 0 #ffffff, 0 1px 4px rgba(255,255,255,0.95)'
            }}
          >
            {addressDisplay}
          </p>
        </div>

        {/* 4. Kategori / Tarif (Teks Bersih - Garis Halus + Sedikit Shadow) */}
        <div
          style={{
            position: 'absolute',
            top: '71.5%',
            left: '5.2%',
            maxWidth: '52%'
          }}
        >
          <span
            style={{
              fontSize: '8px',
              fontWeight: 800,
              color: '#475569',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              lineHeight: 1,
              display: 'block',
              marginBottom: '2px',
              textShadow: '-0.5px -0.5px 0 #ffffff, 0.5px -0.5px 0 #ffffff, -0.5px 0.5px 0 #ffffff, 0.5px 0.5px 0 #ffffff, 0 0 4px rgba(255,255,255,0.9)'
            }}
          >
            KATEGORI / TARIF
          </span>
          <p
            style={{
              fontSize: '13px',
              fontWeight: 900,
              color: '#166534',
              textTransform: 'uppercase',
              lineHeight: 1.2,
              margin: 0,
              padding: 0,
              textShadow: '-0.8px -0.8px 0 #ffffff, 0.8px -0.8px 0 #ffffff, -0.8px 0.8px 0 #ffffff, 0.8px 0.8px 0 #ffffff, 0 1px 5px rgba(255,255,255,0.95)'
            }}
          >
            {categoryName}
          </p>
        </div>

        {/* 5. QR Code Box (Shifted to the right under 'KARTU PELANGGAN RESMI' - truck is completely clear!) */}
        <div
          className="absolute z-10 flex flex-col items-center justify-center p-1 sm:p-1.5 rounded-xl sm:rounded-2xl bg-white text-slate-900 shadow-md border-2 border-[#10b981]"
          style={{ top: '25.5%', right: '4.5%', width: '15.5%' }}
        >
          {qrUrl ? (
            <img
              src={qrUrl}
              alt={`QR ${customer.customerCode}`}
              className="w-full aspect-square object-contain rounded-md"
            />
          ) : (
            <div className="w-full aspect-square bg-slate-100 animate-pulse rounded-md flex items-center justify-center">
              <span className="text-[7px] text-slate-400 font-medium">QR...</span>
            </div>
          )}
          <span className="text-[5px] sm:text-[6.5px] font-black text-slate-900 tracking-wider uppercase mt-0.5 text-center">
            SCAN BAYAR / CEK
          </span>
        </div>

        {/* Footer: Official template has phone number pre-printed, so no duplicate overlay */}
        {!isOfficialTemplate && (
          <div className="absolute z-10 bottom-2 right-3 text-white flex items-center gap-1 text-[10px] font-black">
            <Phone size={12} className="text-white" />
            <span>{phoneDisplay}</span>
          </div>
        )}
      </div>
    );
  }

  // Fallback Single Card for custom themes
  return (
    <div
      id="customer-card-render-target"
      className={`relative w-full max-w-[480px] aspect-[1024/641] rounded-2xl sm:rounded-3xl p-5 shadow-xl flex flex-col justify-between overflow-hidden border border-emerald-500/30 select-none ${
        theme === 'ROYAL_NAVY'
          ? 'bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#0369a1] text-white'
          : theme === 'MODERN_CLEAN'
          ? 'bg-gradient-to-br from-white via-slate-50 to-emerald-50/70 text-slate-900 border border-slate-300'
          : 'bg-gradient-to-br from-[#042f2e] via-[#065f46] to-[#022c22] text-white'
      }`}
    >
      <div className="flex items-center justify-between pb-2 border-b border-white/15">
        <div>
          <span className="text-xs font-black tracking-wide uppercase">
            {settings.bumdesName || 'BUMDES MAKMUR GEDANGAN'}
          </span>
          <p className="text-[9px] text-emerald-200">KARTU PELANGGAN RESMI</p>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/15">
          {rwDisplay} / {rtDisplay}
        </span>
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-3 items-center my-auto py-1">
        <div className="space-y-1.5 min-w-0 pr-2">
          <div className="inline-block bg-slate-950/90 text-emerald-300 font-mono text-xs font-bold px-2 py-0.5 rounded">
            {customer.customerCode}
          </div>
          <h4 className="text-sm sm:text-base font-black">{customer.name}</h4>
          <p className="text-[10px] opacity-90">{addressDisplay}</p>
          <p className="text-[10px] font-bold text-emerald-300">{categoryName}</p>
        </div>
        <div className="flex flex-col items-center justify-center p-1.5 bg-white rounded-xl text-slate-900 shrink-0">
          {qrUrl && <img src={qrUrl} alt="" className="w-18 h-18 sm:w-20 sm:h-20 object-contain rounded" />}
          <span className="text-[7px] font-black text-slate-800 tracking-wider uppercase mt-1">SCAN BAYAR</span>
        </div>
      </div>

      <div className="pt-2 border-t border-white/15 flex items-center justify-between text-[9px] opacity-80">
        <span>Unit Usaha Kebersihan RESIK</span>
        <span>Hotline: {phoneDisplay}</span>
      </div>
    </div>
  );
};

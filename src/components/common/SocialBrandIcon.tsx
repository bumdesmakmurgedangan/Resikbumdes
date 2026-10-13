import React from 'react';
import { Globe } from 'lucide-react';

interface SocialBrandIconProps {
  type: string;
  className?: string;
}

export const SocialBrandIcon: React.FC<SocialBrandIconProps> = ({ type, className = 'w-4 h-4' }) => {
  const normType = (type || '').toUpperCase().trim();

  switch (normType) {
    case 'WHATSAPP':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 9.27 20.92 6.78 19.05 4.9 17.18 3.03 14.69 2 12.04 2zm0 1.67c2.21 0 4.27.86 5.83 2.42 1.55 1.56 2.41 3.63 2.41 5.83 0 4.54-3.7 8.24-8.24 8.24-1.38 0-2.74-.36-3.95-1.04l-.3-.18-3.13.82.84-3.05-.2-.32a8.196 8.196 0 01-1.25-4.47c0-4.54 3.7-8.24 8.24-8.24zm-3.2 3.75c-.19 0-.5.07-.76.35-.27.29-1.01.98-1.01 2.39s1.03 2.77 1.17 2.96c.14.19 2 3.06 4.84 4.29.68.29 1.2.47 1.61.6.68.21 1.3.18 1.79.11.55-.08 1.68-.69 1.92-1.35.24-.67.24-1.24.17-1.36-.07-.12-.25-.19-.53-.33-.28-.14-1.65-.81-1.9-.91-.25-.09-.44-.14-.62.14-.19.28-.71.91-.87 1.09-.16.19-.32.21-.6.07-.28-.14-1.16-.43-2.21-1.36-.82-.73-1.37-1.63-1.53-1.91-.16-.28-.02-.43.12-.57.13-.13.28-.33.42-.49.14-.16.19-.28.28-.46.09-.19.05-.35-.02-.49-.07-.14-.62-1.49-.85-2.04-.22-.54-.45-.47-.62-.48-.15-.01-.33-.01-.5-.01z"
            fill="#25D366"
          />
        </svg>
      );

    case 'INSTAGRAM':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="resik-ig-grad" x1="2" y1="22" x2="22" y2="2" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#f09433" />
              <stop offset="25%" stopColor="#e6683c" />
              <stop offset="50%" stopColor="#dc2743" />
              <stop offset="75%" stopColor="#cc2366" />
              <stop offset="100%" stopColor="#bc1888" />
            </linearGradient>
          </defs>
          <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" stroke="url(#resik-ig-grad)" strokeWidth="2.2" />
          <circle cx="12" cy="12" r="4.3" stroke="url(#resik-ig-grad)" strokeWidth="2.2" />
          <circle cx="17.2" cy="6.8" r="1.2" fill="url(#resik-ig-grad)" />
        </svg>
      );

    case 'TIKTOK':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M19.589 6.686a4.793 4.793 0 01-3.77-4.245V2h-3.445v13.672a2.89 2.89 0 01-2.889 2.889 2.89 2.89 0 01-2.889-2.889 2.89 2.89 0 012.889-2.889c.358 0 .701.066 1.018.187V9.458a6.31 6.31 0 00-1.018-.083A6.335 6.335 0 003.15 15.71a6.335 6.335 0 006.335 6.334 6.335 6.335 0 006.334-6.334V8.892a8.163 8.163 0 004.77 1.528V6.984a4.83 4.83 0 01-1-.298z"
            fill="#0F172A"
          />
        </svg>
      );

    case 'FACEBOOK':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10.5" fill="#1877F2" />
          <path
            d="M15.15 12.65l.44-2.86h-2.75V7.93c0-.78.38-1.54 1.61-1.54h1.24V3.95s-1.13-.19-2.2-.19c-2.25 0-3.72 1.36-3.72 3.83v2.2H7.26v2.86h2.51V19.6c.51.08 1.03.12 1.56.12s1.05-.04 1.56-.12v-6.95h2.26z"
            fill="#FFFFFF"
          />
        </svg>
      );

    case 'YOUTUBE':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"
            fill="#FF0000"
          />
          <path d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#FFFFFF" />
        </svg>
      );

    case 'WEBSITE':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      );

    case 'EMAIL':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" fill="#EA4335" fillOpacity="0.12" stroke="#EA4335" strokeWidth="1.8" />
          <path d="M3 6.5l9 6 9-6" stroke="#EA4335" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'MAP':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
            fill="#EA4335"
          />
          <circle cx="12" cy="9" r="3.2" fill="#FFFFFF" />
        </svg>
      );

    default:
      return <Globe className={className} />;
  }
};

/**
 * Returns color badge styling configuration for each brand
 */
export const getSocialBadgeStyle = (type: string) => {
  const normType = (type || '').toUpperCase().trim();
  switch (normType) {
    case 'WHATSAPP':
      return {
        badgeBg: 'bg-emerald-50 text-emerald-600 border border-emerald-200/70',
        hoverBorder: 'hover:border-emerald-300 hover:bg-emerald-50/40',
        brandName: 'WhatsApp'
      };
    case 'INSTAGRAM':
      return {
        badgeBg: 'bg-pink-50 text-pink-600 border border-pink-200/70',
        hoverBorder: 'hover:border-pink-300 hover:bg-pink-50/40',
        brandName: 'Instagram'
      };
    case 'TIKTOK':
      return {
        badgeBg: 'bg-slate-100 text-slate-900 border border-slate-200',
        hoverBorder: 'hover:border-slate-400 hover:bg-slate-50',
        brandName: 'TikTok'
      };
    case 'FACEBOOK':
      return {
        badgeBg: 'bg-blue-50 text-blue-600 border border-blue-200/70',
        hoverBorder: 'hover:border-blue-300 hover:bg-blue-50/40',
        brandName: 'Facebook'
      };
    case 'YOUTUBE':
      return {
        badgeBg: 'bg-red-50 text-red-600 border border-red-200/70',
        hoverBorder: 'hover:border-red-300 hover:bg-red-50/40',
        brandName: 'YouTube'
      };
    case 'WEBSITE':
      return {
        badgeBg: 'bg-sky-50 text-sky-600 border border-sky-200/70',
        hoverBorder: 'hover:border-sky-300 hover:bg-sky-50/40',
        brandName: 'Website'
      };
    case 'EMAIL':
      return {
        badgeBg: 'bg-rose-50 text-rose-600 border border-rose-200/70',
        hoverBorder: 'hover:border-rose-300 hover:bg-rose-50/40',
        brandName: 'Email'
      };
    case 'MAP':
      return {
        badgeBg: 'bg-amber-50 text-amber-600 border border-amber-200/70',
        hoverBorder: 'hover:border-amber-300 hover:bg-amber-50/40',
        brandName: 'Google Maps'
      };
    default:
      return {
        badgeBg: 'bg-slate-50 text-slate-600 border border-slate-200',
        hoverBorder: 'hover:border-brand-300 hover:bg-brand-50/40',
        brandName: 'Link'
      };
  }
};

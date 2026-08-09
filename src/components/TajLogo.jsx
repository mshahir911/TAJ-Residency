import React from 'react';

/**
 * Official Taj Residency Brand Logo & Shield Emblem
 * Features the signature golden circle ring with 3-pillar geometric shield crest
 * Location: Adivaram • Phone: 9961701414
 */
export default function TajLogo({
  size = 48,
  showText = false,
  showLocation = false,
  className = ''
}) {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* Golden Crest Emblem */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-md"
      >
        <defs>
          <linearGradient id="tajGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F5D77F" />
            <stop offset="45%" stopColor="#C9A24B" />
            <stop offset="100%" stopColor="#8F6E26" />
          </linearGradient>
          <radialGradient id="tajGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#C9A24B" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#C9A24B" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient Dark Navy Circle Background */}
        <circle cx="50" cy="50" r="48" fill="#0A1120" />
        <circle cx="50" cy="50" r="48" fill="url(#tajGlow)" />

        {/* Golden Outer Ring */}
        <circle
          cx="50"
          cy="50"
          r="40"
          stroke="url(#tajGoldGrad)"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        
        {/* Subtle Inner Ring Accent */}
        <circle
          cx="50"
          cy="50"
          r="34"
          stroke="#C9A24B"
          strokeWidth="0.75"
          strokeOpacity="0.4"
        />

        {/* 3-Pillar Shield Crest Emblem */}
        <g fill="url(#tajGoldGrad)">
          {/* Center Main Pillar (Taller & Tapered Point) */}
          <path d="M46.5 27 H53.5 V65 L50 71 L46.5 65 Z" />

          {/* Left Pillar */}
          <path d="M36 30 H43 V60 L36 52 Z" />

          {/* Right Pillar */}
          <path d="M57 30 H64 V52 L57 60 Z" />
        </g>
      </svg>

      {/* Optional Integrated Typography */}
      {showText && (
        <div className="flex flex-col">
          <span className="font-display font-bold text-white text-base sm:text-lg leading-tight tracking-wider uppercase">
            Taj Residency
          </span>
          {showLocation ? (
            <div className="flex items-center gap-1 text-[10px] font-mono text-[#C9A24B] font-semibold tracking-wider uppercase mt-0.5">
              <span>📍 Adivaram</span>
              <span className="text-slate-400">•</span>
              <span>9961701414</span>
            </div>
          ) : (
            <span className="text-[9px] font-mono tracking-[0.2em] text-[#C9A24B] uppercase font-semibold">
              Property Management System
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Little flat vignettes for tea-break ideas (96×96, light from the top-left,
 * one highlight + one shade per form). Decorative.
 * Local to the break card — the art area may replace them with richer spots.
 */
import type { ReactNode } from 'react';
import type { SuggestionArt } from './suggestions';

const C = {
  persimmon: '#F2733A',
  persimmonEdge: '#C9551F',
  sky: '#5AAEE0',
  skyEdge: '#3B8BBD',
  skySoft: '#DCF0FB',
  honey: '#FFC23D',
  honeyEdge: '#D99A14',
  matcha: '#6FB25C',
  matchaEdge: '#4E8C3D',
  chai: '#B9825A',
  chaiEdge: '#9C6A45',
  cream: '#FFF9F0',
  ink: '#3B2A20',
  cookie: '#E2A866',
  cookieEdge: '#C4874A',
};

export function BreakArt({ kind, size = 88 }: { kind: SuggestionArt; size?: number }) {
  return (
    <svg viewBox="0 0 96 96" width={size} height={size} aria-hidden="true" focusable="false">
      {ART[kind]}
    </svg>
  );
}

const ART: Record<SuggestionArt, ReactNode> = {
  water: (
    <g>
      <ellipse cx="48" cy="86" rx="22" ry="4" fill="#3B2A20" opacity="0.1" />
      <path d="M26 18h44l-5.5 60a7 7 0 0 1-7 6.4H38.5a7 7 0 0 1-7-6.4z" fill={C.skySoft} />
      <path d="M29.4 44h37.2l-3.1 34a7 7 0 0 1-7 6.4H39.5a7 7 0 0 1-7-6.4z" fill={C.sky} />
      <path d="M58 44h8.6l-3.1 34a7 7 0 0 1-7 6.4h-3z" fill={C.skyEdge} opacity="0.55" />
      <rect x="33" y="24" width="5" height="44" rx="2.5" fill="#fff" opacity="0.8" />
      <path d="M76 20c0 0 6 7.2 6 11a6 6 0 0 1-12 0c0-3.8 6-11 6-11z" fill={C.sky} />
      <circle cx="74" cy="31" r="1.8" fill="#fff" opacity="0.8" />
    </g>
  ),
  stretch: (
    <g>
      <ellipse cx="48" cy="88" rx="20" ry="4" fill="#3B2A20" opacity="0.1" />
      <rect x="24" y="12" width="10" height="34" rx="5" fill={C.chai} transform="rotate(-24 29 44)" />
      <rect x="62" y="12" width="10" height="34" rx="5" fill={C.chai} transform="rotate(24 67 44)" />
      <rect x="36" y="42" width="24" height="30" rx="12" fill={C.persimmon} />
      <path d="M52 42h-4a12 12 0 0 1 12 12v6a12 12 0 0 1-8 11.3z" fill={C.persimmonEdge} opacity="0.5" />
      <rect x="38" y="64" width="9" height="22" rx="4.5" fill={C.chaiEdge} />
      <rect x="49" y="64" width="9" height="22" rx="4.5" fill={C.chaiEdge} />
      <circle cx="48" cy="32" r="11" fill={C.chai} />
      <circle cx="44" cy="28" r="3" fill="#fff" opacity="0.35" />
      <path d="M14 16l4 4M82 16l-4 4M48 4v5" stroke={C.honey} strokeWidth="4" strokeLinecap="round" />
    </g>
  ),
  eyes: (
    <g>
      <path d="M8 50Q48 14 88 50Q48 86 8 50z" fill="#fff" />
      <path d="M8 50Q48 86 88 50Q48 74 8 50z" fill={C.skySoft} />
      <circle cx="48" cy="50" r="17" fill={C.sky} />
      <path d="M48 33a17 17 0 0 1 0 34a13 17 0 0 0 0-34z" fill={C.skyEdge} opacity="0.5" />
      <circle cx="48" cy="50" r="7.5" fill={C.ink} />
      <circle cx="42" cy="44" r="4" fill="#fff" />
      <rect x="60" y="6" width="30" height="20" rx="10" fill={C.honey} />
      <text x="75" y="21" textAnchor="middle" fontFamily="Fredoka Variable, Fredoka, sans-serif" fontWeight="700" fontSize="14" fill={C.ink}>
        20
      </text>
    </g>
  ),
  breathe: (
    <g>
      <circle cx="48" cy="48" r="40" fill={C.sky} opacity="0.18" />
      <circle cx="48" cy="48" r="28" fill={C.sky} opacity="0.35" />
      <circle cx="48" cy="48" r="16" fill={C.sky} />
    </g>
  ),
  window: (
    <g>
      <rect x="12" y="10" width="72" height="70" rx="12" fill={C.chai} />
      <rect x="18" y="16" width="60" height="58" rx="8" fill={C.skySoft} />
      <circle cx="62" cy="30" r="8" fill={C.honey} />
      <path d="M18 60q16-16 30-4t30-6v16a8 8 0 0 1-8 8H26a8 8 0 0 1-8-8z" fill={C.matcha} />
      <path d="M48 56q14 8 30-6v16a8 8 0 0 1-8 8H40z" fill={C.matchaEdge} opacity="0.45" />
      <circle cx="30" cy="34" r="6" fill="#fff" />
      <circle cx="37" cy="31" r="7" fill="#fff" />
      <circle cx="43" cy="35" r="5" fill="#fff" />
      <rect x="45" y="16" width="6" height="58" fill={C.chai} />
      <rect x="18" y="42" width="60" height="6" fill={C.chai} />
      <rect x="6" y="78" width="84" height="9" rx="4.5" fill={C.chaiEdge} />
    </g>
  ),
  walk: (
    <g>
      <path d="M14 84C30 70 26 50 44 40s30-8 40-28" stroke={C.honey} strokeWidth="5" strokeLinecap="round" strokeDasharray="1 11" fill="none" />
      <g transform="rotate(-20 32 62)">
        <ellipse cx="32" cy="64" rx="9" ry="13" fill={C.chai} />
        <circle cx="25" cy="48" r="3" fill={C.chai} />
        <circle cx="30.5" cy="46" r="3" fill={C.chai} />
        <circle cx="36" cy="47" r="3" fill={C.chai} />
        <circle cx="40" cy="50.5" r="2.6" fill={C.chai} />
      </g>
      <g transform="rotate(10 60 36)">
        <ellipse cx="60" cy="38" rx="9" ry="13" fill={C.chaiEdge} />
        <circle cx="53" cy="22" r="3" fill={C.chaiEdge} />
        <circle cx="58.5" cy="20" r="3" fill={C.chaiEdge} />
        <circle cx="64" cy="21" r="3" fill={C.chaiEdge} />
        <circle cx="68" cy="24.5" r="2.6" fill={C.chaiEdge} />
      </g>
    </g>
  ),
  snack: (
    <g>
      <defs>
        <mask id="kettle-bite">
          <rect width="96" height="96" fill="#fff" />
          <circle cx="80" cy="26" r="9" fill="#000" />
          <circle cx="84" cy="40" r="8" fill="#000" />
        </mask>
      </defs>
      <ellipse cx="48" cy="86" rx="26" ry="4" fill="#3B2A20" opacity="0.1" />
      <g mask="url(#kettle-bite)">
        <circle cx="48" cy="48" r="34" fill={C.cookie} />
        <path d="M48 14a34 34 0 0 1 0 68a28 34 0 0 0 0-68z" fill={C.cookieEdge} opacity="0.55" />
        <circle cx="36" cy="36" r="4" fill="#6B4A33" />
        <circle cx="56" cy="44" r="4.5" fill="#6B4A33" />
        <circle cx="40" cy="60" r="4" fill="#6B4A33" />
        <circle cx="60" cy="64" r="3.5" fill="#6B4A33" />
        <circle cx="28" cy="50" r="3" fill="#6B4A33" />
        <ellipse cx="34" cy="26" rx="8" ry="4" fill="#fff" opacity="0.3" transform="rotate(-30 34 26)" />
      </g>
    </g>
  ),
  shoulders: (
    <g>
      <rect x="22" y="52" width="52" height="34" rx="17" fill={C.persimmon} />
      <path d="M58 52h-2a18 18 0 0 1 18 18v0a17 17 0 0 1-9 15z" fill={C.persimmonEdge} opacity="0.5" />
      <circle cx="48" cy="40" r="13" fill={C.chai} />
      <circle cx="43" cy="35" r="3.5" fill="#fff" opacity="0.35" />
      <path d="M16 46a34 34 0 0 1 20-30" stroke={C.sky} strokeWidth="6" strokeLinecap="round" fill="none" />
      <path d="M30 10l7 6-8 5" stroke={C.sky} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M80 46a34 34 0 0 0-20-30" stroke={C.sky} strokeWidth="6" strokeLinecap="round" fill="none" />
      <path d="M66 10l-7 6 8 5" stroke={C.sky} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </g>
  ),
};

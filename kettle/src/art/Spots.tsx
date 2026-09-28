/**
 * Spot illustrations: onboarding (daily-goal vessels, rhythms, notifications),
 * break suggestions, empty states. 160×160 each, on an optional soft backdrop
 * that follows the theme. OWNER: art area.
 */
import type { ReactNode } from 'react';
import { PAL } from './palette';
import { ArtSvg, Shaded, Sparkles, Steam, artStyles as s, useArtId, useLive } from './kit';
import { ChaiArt } from './Mascot';
import { TinArt } from './Objects';

interface SpotBase {
  size?: number;
  /** Soft circular backdrop (default true). */
  backdrop?: boolean;
  animate?: boolean;
  className?: string;
  title?: string;
}

function Spot({ size = 160, backdrop = true, bg, live, className, title, children, name }: SpotBase & { bg: string; live: boolean; children: ReactNode; name: string }) {
  return (
    <ArtSvg viewBox="0 0 160 160" width={size} height={size} live={live} className={className} title={title} data-art={name}>
      {backdrop && <circle cx="80" cy="80" r="74" fill={bg} />}
      {children}
    </ArtSvg>
  );
}

const Floor = ({ w = 44, y = 132 }: { w?: number; y?: number }) => <ellipse cx="80" cy={y} rx={w} ry="5.5" fill="var(--art-shadow)" />;

/* ------------------------------------------------------------------ */
/* Daily goal vessels: sip · cup · pot · kettle                         */
/* ------------------------------------------------------------------ */

export type GoalVesselKind = 'sip' | 'cup' | 'pot' | 'kettle';

export function GoalVessel({ kind, ...p }: SpotBase & { kind: GoalVesselKind }) {
  const id = useArtId();
  const live = useLive(p.animate);
  let art: ReactNode;
  switch (kind) {
    case 'sip':
      art = (
        <>
          <Floor w={30} />
          <rect x="52" y="120" width="56" height="10" rx="5" fill={PAL.skyShade} />
          <path d="M100 100 C110 100 110 114 99 114" stroke={PAL.skyShade} strokeWidth="6" fill="none" strokeLinecap="round" />
          <Shaded d="M58 94 H102 V104 C102 115 94 122 84 122 H76 C66 122 58 115 58 104 Z" id={`${id}-a`} base={PAL.sky} shade={PAL.skyShade} dx={-5} dy={-3}>
            <rect x="63" y="99" width="5" height="14" rx="2.5" fill={PAL.skyHi} opacity="0.85" />
          </Shaded>
          <ellipse cx="80" cy="94" rx="22" ry="4.5" fill={PAL.skyShade} />
          <ellipse cx="80" cy="94.6" rx="18.5" ry="2.8" fill={PAL.tea} />
          <Steam x={80} y={86} scale={0.6} count={2} />
        </>
      );
      break;
    case 'cup':
      art = (
        <>
          <Floor w={38} />
          <path d="M106 86 C124 84 125 114 106 116" stroke={PAL.persimmonShade} strokeWidth="9" fill="none" strokeLinecap="round" />
          <Shaded d="M46 76 H110 V106 C110 121 100 130 85 130 H71 C56 130 46 121 46 106 Z" id={`${id}-a`} base={PAL.persimmon} shade={PAL.persimmonShade} dx={-7} dy={-3}>
            <rect x="53" y="84" width="7" height="28" rx="3.5" fill={PAL.persimmonHi} opacity="0.8" />
          </Shaded>
          <ellipse cx="78" cy="76" rx="32" ry="7" fill={PAL.persimmonShade} />
          <ellipse cx="78" cy="76.8" rx="27" ry="4.4" fill={PAL.tea} />
          <path d="M70 114 C70 101 79 95 88 95 C88 107 80 114 70 114 Z" fill={PAL.white} opacity="0.92" />
          <Steam x={78} y={66} scale={0.95} />
        </>
      );
      break;
    case 'pot':
      art = (
        <>
          <Floor w={50} />
          <path d="M44 100 C34 96 28 86 24 72" stroke={PAL.matchaShade} strokeWidth="10" fill="none" strokeLinecap="round" />
          <path d="M112 78 C136 76 136 116 112 116" stroke={PAL.matchaShade} strokeWidth="9" fill="none" strokeLinecap="round" />
          <Shaded d="M80 62 C104 62 120 78 120 98 C120 118 104 130 80 130 C56 130 40 118 40 98 C40 78 56 62 80 62 Z" id={`${id}-a`} base={PAL.matcha} shade={PAL.matchaShade} dx={-8} dy={-5}>
            <path d="M50 96 C50 84 56 76 66 71" stroke={PAL.matchaHi} strokeWidth="7" strokeLinecap="round" fill="none" />
          </Shaded>
          <rect x="44" y="104" width="72" height="7" fill={PAL.matchaShade} opacity="0.5" />
          <path d="M58 64 C60 55 69 51 80 51 C91 51 100 55 102 64 Z" fill={PAL.matchaShade} />
          <circle cx="80" cy="47" r="6.5" fill={PAL.honey} />
          <circle cx="78.6" cy="45.6" r="2" fill={PAL.honeyHi} />
          <g transform="translate(24 66)">
            <Steam x={0} y={0} scale={0.55} count={2} />
          </g>
        </>
      );
      break;
    default:
      art = (
        <>
          <Floor w={52} />
          <g transform="translate(20 8) scale(1.88)">
            <KettleBody id={id} />
          </g>
          <g transform="translate(26 70)">
            <Steam x={0} y={0} scale={0.8} />
          </g>
          <Sparkles pts={[[128, 36, 7], [140, 70, 4]]} color={PAL.honey} />
        </>
      );
  }
  return (
    <Spot {...p} bg="var(--honey-soft)" live={live} name={`goal-${kind}`}>
      {art}
    </Spot>
  );
}

/** Kettle body in a 64-box (same construction as the logo mark, with a bigger knob). */
function KettleBody({ id }: { id: string }) {
  const body = 'M12.5 46 C12.5 33 20.5 25 32 25 C43.5 25 51.5 33 51.5 46 C51.5 52 47.5 56 41.5 56 H22.5 C16.5 56 12.5 52 12.5 46 Z';
  return (
    <g>
      <path d="M19.5 31 C17.5 9 46.5 9 44.5 31" stroke="#9E643D" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M17 47 C12 45 8.5 40 6.5 33.5" stroke={PAL.persimmonShade} strokeWidth="6.5" fill="none" strokeLinecap="round" />
      <Shaded d={body} id={`${id}-kb`} base={PAL.persimmon} shade={PAL.persimmonShade} dx={-4} dy={-2.5}>
        <path d="M18.5 43 C18.5 37 21 33 25.5 30.5" stroke={PAL.persimmonHi} strokeWidth="3.4" strokeLinecap="round" fill="none" />
      </Shaded>
      <rect x="16" y="52.5" width="32" height="4.6" rx="2.3" fill={PAL.persimmonShade} />
      <path d="M21 27.5 C22.5 23.5 26.5 22 32 22 C37.5 22 41.5 23.5 43 27.5 Z" fill={PAL.persimmonShade} />
      <path d="M33.2 14.6 C35.4 11 40 10.4 42.6 12.1 C40.3 15.1 36.4 15.9 33.2 14.6 Z" fill={PAL.leaf} />
      <circle cx="32" cy="19" r="5.2" fill={PAL.yuzuShade} />
      <circle cx="31.3" cy="18.3" r="4.3" fill={PAL.yuzu} />
      <circle cx="29.9" cy="16.8" r="1.3" fill={PAL.yuzuHi} />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Rhythms: three brews — classic amber, deep dark, gentle green        */
/* ------------------------------------------------------------------ */

export type RhythmSpotKind = 'classic' | 'deep' | 'gentle';

const GLASS = 'rgba(236, 246, 252, 0.9)';
const GLASS_EDGE = '#C9E2F2';

export function RhythmSpot({ rhythm, ...p }: SpotBase & { rhythm: RhythmSpotKind }) {
  const live = useLive(p.animate);
  let art: ReactNode;
  let bg = 'var(--persimmon-soft)';
  if (rhythm === 'classic') {
    art = (
      <>
        <Floor w={34} />
        <path d="M104 84 C118 84 118 108 103 108" stroke={GLASS_EDGE} strokeWidth="7" fill="none" strokeLinecap="round" />
        <path d="M52 66 H108 L103 118 C102.5 124 98 128 92 128 H68 C62 128 57.5 124 57 118 Z" fill={GLASS} />
        <path d="M55 84 H105 L103 118 C102.5 124 98 128 92 128 H68 C62 128 57.5 124 57 118 Z" fill="#E08A3C" />
        <path d="M55 84 H105 L104.5 90 H55.5 Z" fill="#F2A860" />
        <rect x="62" y="72" width="5" height="46" rx="2.5" fill={PAL.white} opacity="0.7" />
        <path d="M52 66 H108" stroke={GLASS_EDGE} strokeWidth="4" strokeLinecap="round" />
        <Steam x={80} y={58} scale={0.9} />
      </>
    );
  } else if (rhythm === 'deep') {
    bg = '#3C3260';
    art = (
      <>
        <g fill={PAL.honeyHi}>
          <circle cx="124" cy="52" r="2" />
          <circle cx="70" cy="28" r="2.4" />
          <circle cx="132" cy="92" r="1.6" />
          <circle cx="30" cy="96" r="1.6" />
        </g>
        <path d="M40 30 A15 15 0 1 0 54 50 A12 12 0 1 1 40 30 Z" fill={PAL.honey} />
        <ellipse cx="80" cy="136" rx="36" ry="5" fill="rgba(0,0,0,0.25)" />
        <path d="M104 70 C122 70 122 104 103 104" stroke={GLASS_EDGE} strokeWidth="7" fill="none" strokeLinecap="round" opacity="0.8" />
        <rect x="54" y="44" width="52" height="90" rx="12" fill={GLASS} opacity="0.95" />
        <path d="M54 64 H106 V122 A12 12 0 0 1 94 134 H66 A12 12 0 0 1 54 122 Z" fill="#6E3419" />
        <path d="M54 64 H106 V70 H54 Z" fill="#8E4A22" />
        <rect x="60" y="50" width="5" height="76" rx="2.5" fill={PAL.white} opacity="0.55" />
        <path d="M86 44 C88 36 92 30 98 27" stroke={PAL.oat} strokeWidth="2" fill="none" strokeLinecap="round" />
        <rect x="95" y="18" width="14" height="13" rx="3" fill={PAL.persimmon} />
        <path d="M99 26.5 C99 22.5 102 21 105 21 C105 25 103 26.5 99 26.5 Z" fill={PAL.white} opacity="0.9" />
        <rect x="74" y="92" width="16" height="20" rx="4" fill="#B98A5A" opacity="0.85" />
      </>
    );
  } else {
    bg = 'var(--sky-soft)';
    art = (
      <>
        <Floor w={36} y={128} />
        <path d="M42 88 H118 C118 110 102 124 80 124 C58 124 42 110 42 88 Z" fill={GLASS} />
        <path d="M45 96 H115 C112 113 98 122 80 122 C62 122 48 113 45 96 Z" fill="#BFDD8C" />
        <path d="M45 96 H115 L114 100 H46 Z" fill="#D5EAA9" />
        <path d="M42 88 H118" stroke={GLASS_EDGE} strokeWidth="4" strokeLinecap="round" />
        <path d="M52 94 C54 106 60 113 68 117" stroke={PAL.white} strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.8" />
        <g className={s.float}>
          <path d="M78 96 C78 88 85 83 94 83 C94 91 87 96 78 96 Z" fill={PAL.leaf} />
          <path d="M78 96 C87 96 94 91 94 83 Z" fill={PAL.leafShade} />
        </g>
        <g transform="translate(80 80)">
          <Steam x={0} y={0} scale={0.6} count={2} />
        </g>
        <Sparkles pts={[[122, 50, 5], [38, 60, 4]]} color={PAL.sky} />
      </>
    );
  }
  return (
    <Spot {...p} bg={bg} live={live} name={`rhythm-${rhythm}`}>
      {art}
    </Spot>
  );
}

/* ------------------------------------------------------------------ */
/* Notification permission: the kettle whistles, a bell answers         */
/* ------------------------------------------------------------------ */

export function NotifySpot(p: SpotBase) {
  const id = useArtId();
  const live = useLive(p.animate);
  return (
    <Spot {...p} bg="var(--berry-soft)" live={live} name="notify">
      <Floor w={46} y={134} />
      <g transform="translate(30 20) scale(1.75)">
        <KettleBody id={id} />
      </g>
      {/* whistle lines */}
      <g stroke={PAL.persimmon} strokeWidth="4.5" strokeLinecap="round" fill="none">
        <path d="M30 64 L22 58" />
        <path d="M34 56 L30 46" />
        <path d="M26 72 L16 72" />
      </g>
      {/* bell bubble */}
      <g className={s.float}>
        <path d="M104 22 H136 A12 12 0 0 1 148 34 V56 A12 12 0 0 1 136 68 H124 L112 78 L114 68 H104 A12 12 0 0 1 92 56 V34 A12 12 0 0 1 104 22 Z" fill="var(--surface, #fff)" />
        <g className={s.ring}>
          <circle cx="120" cy="58" r="4" fill={PAL.persimmon} />
          <path d="M120 30 A10 10 0 0 1 130 40 V47 L133 52 C134 54 133 56 131 56 H109 C107 56 106 54 107 52 L110 47 V40 A10 10 0 0 1 120 30 Z" fill={PAL.honey} />
          <path d="M114 42 A6 6 0 0 1 118 36" stroke={PAL.honeyHi} strokeWidth="2.6" strokeLinecap="round" fill="none" />
        </g>
      </g>
    </Spot>
  );
}

/* ------------------------------------------------------------------ */
/* Break suggestions                                                   */
/* ------------------------------------------------------------------ */

export type BreakSpotKind = 'stretch' | 'water' | 'eyes' | 'breathe';

export function BreakSpot({ kind, ...p }: SpotBase & { kind: BreakSpotKind }) {
  const id = useArtId();
  const live = useLive(p.animate);
  let art: ReactNode;
  switch (kind) {
    case 'stretch':
      art = (
        <g transform="translate(14 16) scale(0.66)">
          <ChaiArt pose="stretch" id={id} />
        </g>
      );
      break;
    case 'water':
      art = (
        <>
          <Floor w={30} y={134} />
          <path d="M54 36 H106 L99 124 C98.5 129 95 132 90 132 H70 C65 132 61.5 129 61 124 Z" fill={GLASS} />
          <path d="M57 62 H103 L99 124 C98.5 129 95 132 90 132 H70 C65 132 61.5 129 61 124 Z" fill="#9FD3F2" />
          <path d="M57 62 H103 L102.5 68 H57.5 Z" fill="#C3E5F8" />
          <rect x="64" y="44" width="5" height="78" rx="2.5" fill={PAL.white} opacity="0.75" />
          <g fill={PAL.white} opacity="0.85">
            <circle cx="84" cy="100" r="3" />
            <circle cx="90" cy="84" r="2.2" />
            <circle cx="78" cy="116" r="2" />
          </g>
          <path d="M54 36 H106" stroke={GLASS_EDGE} strokeWidth="4" strokeLinecap="round" />
          {/* yuzu slice on the rim */}
          <g transform="translate(104 38) rotate(-18)">
            <circle r="15" fill={PAL.yuzuShade} />
            <circle r="12.5" fill="#FFE59A" />
            <g stroke={PAL.yuzu} strokeWidth="2.4">
              {[0, 60, 120].map((a) => (
                <path key={a} d="M0 -11 V11" transform={`rotate(${a})`} />
              ))}
            </g>
            <circle r="2.4" fill={PAL.yuzu} />
          </g>
          <g className={s.float}>
            <path d="M126 76 C129 80 131 83 131 85.5 A5 5 0 0 1 121 85.5 C121 83 123 80 126 76 Z" fill={PAL.sky} />
            <path d="M38 96 C40 99 41.5 101 41.5 103 A3.5 3.5 0 0 1 34.5 103 C34.5 101 36 99 38 96 Z" fill={PAL.sky} />
          </g>
        </>
      );
      break;
    case 'eyes':
      art = (
        <>
          <rect x="28" y="30" width="104" height="96" rx="16" fill="#9E643D" />
          <rect x="36" y="38" width="88" height="80" rx="10" fill="#BFE3F7" />
          <clipPath id={`${id}-win`}>
            <rect x="36" y="38" width="88" height="80" rx="10" />
          </clipPath>
          <g clipPath={`url(#${id}-win)`}>
            <circle cx="104" cy="60" r="10" fill={PAL.honey} />
            <path d="M30 100 L58 70 L76 88 L96 64 L130 100 V124 H30 Z" fill="#8FB9D6" />
            <path d="M58 70 L66 79 L60 82 L52 77 Z M96 64 L105 74 L98 77 L90 71 Z" fill={PAL.white} opacity="0.9" />
            <path d="M30 108 C50 98 70 102 90 106 C104 109 118 104 130 100 V124 H30 Z" fill={PAL.matcha} />
            <path d="M30 116 C54 110 80 112 130 110 V124 H30 Z" fill={PAL.matchaShade} />
            <path d="M52 50 q4 -4 8 0 q4 -4 8 0" stroke={PAL.ink} strokeWidth="2.4" fill="none" strokeLinecap="round" />
          </g>
          <path d="M80 38 V118 M36 78 H124" stroke="#9E643D" strokeWidth="5" />
          <rect x="22" y="120" width="116" height="10" rx="5" fill="#B8784A" />
        </>
      );
      break;
    default:
      art = (
        <>
          <circle className={s.breath} cx="80" cy="80" r="62" fill={PAL.sky} opacity="0.18" />
          <circle className={s.breath} cx="80" cy="80" r="46" fill={PAL.sky} opacity="0.28" style={{ animationDelay: '-0.3s' }} />
          <circle className={s.breath} cx="80" cy="80" r="30" fill={PAL.sky} opacity="0.5" style={{ animationDelay: '-0.6s' }} />
          <g className={s.float}>
            <path d="M68 92 C68 76 80 66 96 66 C96 82 85 92 68 92 Z" fill={PAL.leaf} />
            <path d="M68 92 C85 92 96 82 96 66 Z" fill={PAL.leafShade} />
            <path d="M70 90 C78 82 86 75 92 70" stroke={PAL.leafHi} strokeWidth="2" fill="none" strokeLinecap="round" />
          </g>
        </>
      );
  }
  return (
    <Spot {...p} bg={kind === 'breathe' ? 'transparent' : 'var(--sky-soft)'} backdrop={kind === 'breathe' ? false : p.backdrop} live={live} name={`break-${kind}`}>
      {art}
    </Spot>
  );
}

/* ------------------------------------------------------------------ */
/* Empty states                                                        */
/* ------------------------------------------------------------------ */

export type EmptySpotKind = 'stats' | 'history' | 'badges' | 'quests';

export function EmptySpot({ kind, ...p }: SpotBase & { kind: EmptySpotKind }) {
  const id = useArtId();
  const live = useLive(p.animate);
  let art: ReactNode;
  switch (kind) {
    case 'history':
      art = (
        <>
          <Floor w={54} y={128} />
          <path d="M80 50 C66 42 46 42 30 46 V118 C46 114 66 114 80 122 Z" fill="#F7EEE1" />
          <path d="M80 50 C94 42 114 42 130 46 V118 C114 114 94 114 80 122 Z" fill="#FFF8EE" />
          <path d="M80 50 V122" stroke="#E2D1BA" strokeWidth="3" />
          <path d="M30 118 C46 114 66 114 80 122 C94 114 114 114 130 118 V124 C114 120 94 120 80 128 C66 120 46 120 30 124 Z" fill={PAL.oatShade} />
          <g stroke="#E6D6C1" strokeWidth="3" strokeLinecap="round">
            <path d="M40 62 H68" />
            <path d="M40 74 H64" />
            <path d="M92 62 H120" />
          </g>
          <g transform="translate(112 86) rotate(38)">
            <rect x="-5" y="-30" width="10" height="42" rx="3" fill={PAL.honey} />
            <rect x="-5" y="-30" width="10" height="8" rx="3" fill={PAL.berry} />
            <path d="M-5 12 L0 22 L5 12 Z" fill="#F3D2A6" />
            <path d="M-1.6 18.6 L0 22 L1.6 18.6 Z" fill={PAL.ink} />
          </g>
          <Sparkles pts={[[44, 36, 6], [128, 30, 4]]} color={PAL.honey} />
        </>
      );
      break;
    case 'badges':
      art = (
        <>
          <path d="M80 34 L113 53 V91 L80 110 L47 91 V53 Z" fill="var(--art-bubble)" transform="translate(0 4)" strokeLinejoin="round" stroke="var(--art-bubble)" strokeWidth="14" />
          <path d="M80 34 L113 53 V91 L80 110 L47 91 V53 Z" fill="var(--art-soft)" strokeLinejoin="round" stroke="var(--art-soft)" strokeWidth="14" />
          <path d="M80 50 Q83 69 100 72 Q83 75 80 94 Q77 75 60 72 Q77 69 80 50 Z" fill="var(--art-bubble)" />
          <Sparkles pts={[[124, 40, 7], [36, 110, 5]]} color={PAL.honey} />
        </>
      );
      break;
    case 'quests':
      art = (
        <>
          <Floor w={36} y={132} />
          <g transform="translate(80 128) scale(0.9) translate(-60 -108)">
            <TinArt id={id} />
          </g>
          <g transform="translate(116 104)">
            <circle r="18" fill="var(--paper, #fff9f0)" />
            <circle r="15" fill={PAL.matcha} />
            <path d="M-7 0.5 L-2 5.5 L8 -5" stroke={PAL.white} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </g>
        </>
      );
      break;
    default:
      art = (
        <>
          <Floor w={46} y={130} />
          <rect x="34" y="118" width="80" height="10" rx="5" fill={PAL.oatShade} />
          <path d="M102 82 C118 82 118 106 101 106" stroke={PAL.oatShade} strokeWidth="8" fill="none" strokeLinecap="round" />
          <Shaded d="M40 72 H106 V92 C106 108 96 118 80 118 H66 C50 118 40 108 40 92 Z" id={`${id}-c`} base={PAL.oat} shade={PAL.oatShade} dx={-7} dy={-3}>
            <rect x="47" y="80" width="6" height="22" rx="3" fill={PAL.oatHi} />
          </Shaded>
          <ellipse cx="73" cy="72" rx="33" ry="6.5" fill={PAL.oatShade} />
          <ellipse cx="73" cy="72.8" rx="28" ry="4" fill="#E9DCC8" />
          {/* waiting tea bag */}
          <g transform="translate(122 64) rotate(12)">
            <path d="M0 -26 V-8" stroke="#D8C6AE" strokeWidth="2" strokeLinecap="round" />
            <rect x="-6" y="-38" width="12" height="12" rx="3" fill={PAL.persimmon} />
            <path d="M-10 -8 H10 L8 16 C7.6 19 5.6 21 2.6 21 H-2.6 C-5.6 21 -7.6 19 -8 16 Z" fill="#F0E2CC" />
            <path d="M-8 4 H8 L7 16 C6.8 18.5 5 20 2.6 20 H-2.6 C-5 20 -6.8 18.5 -7 16 Z" fill="#B97A45" opacity="0.7" />
          </g>
          <g stroke="var(--art-steam)" strokeWidth="4" strokeLinecap="round" strokeDasharray="1 9" fill="none">
            <path d="M66 60 C60 50 72 44 66 32" />
            <path d="M80 60 C74 50 86 44 80 32" />
          </g>
        </>
      );
  }
  return (
    <Spot {...p} bg="var(--art-softer)" live={live} name={`empty-${kind}`}>
      {art}
    </Spot>
  );
}

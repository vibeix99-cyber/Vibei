/**
 * Chai the capybara. OWNER: art area.
 *
 * Construction (v2 — capybara, not bear): a tall, flat-fronted barrel head that
 * merges into a barrel body with no neck; the lower face is one blunt snout
 * block in a slightly darker, warmer brown (no cream patch); a wide flat nose
 * sits on the snout's top edge with a tiny split-lip "ω" under it; small calm
 * eyes set high and wide; tiny round ears at the upper back corners; stubby legs.
 * Flat geometric forms, one highlight + one shade per form, light from the
 * top-left, no outlines. Props contract is stable: pose, size, animate, className, title.
 */
import { useId, type ReactNode } from 'react';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { PAL, safeId } from './palette';
import s from './art.module.css';

export type MascotPose =
  | 'idle'
  | 'wave'
  | 'focus'
  | 'sleep'
  | 'sip'
  | 'cheer'
  | 'proud'
  | 'concerned'
  | 'think'
  | 'peek'
  | 'stretch';

export interface MascotProps {
  pose?: MascotPose;
  /** Rendered width/height in px (square viewBox). */
  size?: number;
  /** Idle life (breathing/blinking). Automatically off under reduced motion. */
  animate?: boolean;
  className?: string;
  /** Accessible label; decorative (aria-hidden) when omitted. */
  title?: string;
}

type Eyes = 'calm' | 'open' | 'closed' | 'happy' | 'sparkle' | 'worried' | 'look';
type Mouth = 'w' | 'open' | 'smug' | 'wavy' | 'flat' | 'o' | 'yawn' | 'none';

/* Chai's own colors (kept here so the character is self-contained). */
const F = {
  fur: '#C98B5B',
  furShade: '#A96F47',
  furHi: '#DEA676',
  snout: '#B0764D',
  snoutShade: '#93603E',
  snoutHi: '#C58C5E',
  ear: '#9A6440',
  earIn: '#6E4329',
  leg: '#8A5536',
  legHi: '#A7704A',
  paw: '#8A5536',
  pawHi: '#A7704A',
  nose: '#352219',
  eye: '#2A1B13',
  lid: '#7A4C30',
  mouth: '#4A2B1D',
  tongue: '#EF7F7C',
  blush: '#F0877F',
  tuft: '#A56C45',
};

/* ---------- geometry (head top at y=34, centre x=100, chin at y=163) ---------- */

const HEAD = 'M100 34 C132 34 148 38 148 66 V121 C148 149 131 163 100 163 C69 163 52 149 52 121 V66 C52 38 68 34 100 34 Z';
/** Everything below this curve (clipped to the head) is the snout block. */
const SNOUT_REGION = 'M30 112 C50 80 150 80 170 112 V200 H30 Z';

/** Sitting barrel body behind the head. */
const SIT = 'M100 98 C147 98 169 123 169 153 C169 178 151 189 100 189 C49 189 31 178 31 153 C31 123 53 98 100 98 Z';
/** Lying (sleep): long and low. */
const LIE = 'M100 122 C154 122 184 138 184 162 C184 181 163 190 100 190 C37 190 16 181 16 162 C16 138 46 122 100 122 Z';

/* ---------- parts ---------- */

function Barrel({ d, id, tufts = false }: { d: string; id: string; tufts?: boolean }) {
  return (
    <g>
      <clipPath id={`${id}-bd`}>
        <path d={d} />
      </clipPath>
      <path d={d} fill={F.furShade} />
      <g clipPath={`url(#${id}-bd)`}>
        <path d={d} fill={F.fur} transform="translate(-9 -7)" />
      </g>
      {tufts && (
        <g stroke={F.tuft} strokeWidth="3" strokeLinecap="round" opacity="0.8">
          <path d="M40 134 l4 -6" />
          <path d="M37 148 l4 -6" />
          <path d="M160 134 l-4 -6" />
          <path d="M163 148 l-4 -6" />
        </g>
      )}
    </g>
  );
}

function Legs({ y = 176, spread = 17 }: { y?: number; spread?: number }) {
  return (
    <g>
      {[100 - spread, 100 + spread].map((x) => (
        <g key={x}>
          <rect x={x - 8.5} y={y} width="17" height="15" rx="7" fill={F.leg} />
          <ellipse cx={x - 2.5} cy={y + 4} rx="3.4" ry="2.2" fill={F.legHi} opacity="0.8" />
        </g>
      ))}
    </g>
  );
}

function Yuzu({ x = 100, y = 34, rot = 0 }: { x?: number; y?: number; rot?: number }) {
  // (x, y) = contact point on the head.
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <g className={s.yuzu}>
        <path d="M2 -26 C8 -37 20 -39 27 -34 C21 -25 11 -22 2 -26 Z" fill={PAL.leaf} />
        <path d="M2 -26 C11 -22 21 -25 27 -34 C19 -29 10 -27 2 -26 Z" fill={PAL.leafShade} />
        <ellipse cx="0" cy="-12.5" rx="15" ry="13.2" fill={PAL.yuzuShade} />
        <ellipse cx="-2" cy="-14.2" rx="12.8" ry="11.3" fill={PAL.yuzu} />
        <ellipse cx="-6" cy="-18.6" rx="4.3" ry="2.8" fill={PAL.yuzuHi} transform="rotate(-30 -6 -18.6)" />
        <g fill={PAL.yuzuShade} opacity="0.75">
          <circle cx="5" cy="-16" r="0.95" />
          <circle cx="8" cy="-10.5" r="0.85" />
          <circle cx="3" cy="-7.5" r="0.85" />
          <circle cx="-4" cy="-9.5" r="0.75" />
        </g>
        <rect x="-1.7" y="-29" width="3.4" height="5.2" rx="1.7" fill={PAL.stem} />
      </g>
    </g>
  );
}

function star(cx: number, cy: number, r: number): string {
  const k = r * 0.22;
  return `M${cx} ${cy - r} Q${cx + k} ${cy - k} ${cx + r} ${cy} Q${cx + k} ${cy + k} ${cx} ${cy + r} Q${cx - k} ${cy + k} ${cx - r} ${cy} Q${cx - k} ${cy - k} ${cx} ${cy - r} Z`;
}

function Eye({ x, y, kind: k0, big }: { x: number; y: number; kind: Eyes; big: boolean }) {
  // Lids turn into heavy "brows" at small sizes: fall back to friendly dots there.
  const kind: Eyes = big && k0 === 'calm' ? 'open' : k0;
  const r = big ? 7.2 : 5.4;
  const sw = big ? 4.4 : 3.3;
  switch (kind) {
    case 'closed':
      return <path d={`M${x - 6.5} ${y - 1} Q${x} ${y + 5} ${x + 6.5} ${y - 1}`} stroke={F.eye} strokeWidth={sw} strokeLinecap="round" fill="none" />;
    case 'happy':
      return <path d={`M${x - 6.5} ${y + 2.5} Q${x} ${y - 5} ${x + 6.5} ${y + 2.5}`} stroke={F.eye} strokeWidth={sw} strokeLinecap="round" fill="none" />;
    case 'sparkle':
      return (
        <g>
          <circle cx={x} cy={y} r={r + 1.3} fill={F.eye} />
          <path d={star(x - 1.6, y - 1.8, 3.6)} fill={PAL.white} />
          <circle cx={x + 2.2} cy={y + 2.3} r="1" fill={PAL.white} />
        </g>
      );
    case 'worried':
      return (
        <g>
          <circle cx={x} cy={y} r={r + 0.6} fill={F.eye} />
          <circle cx={x - 1.7} cy={y - 1.9} r="2.2" fill={PAL.white} />
          <circle cx={x + 1.9} cy={y + 2} r="1" fill={PAL.white} />
        </g>
      );
    case 'open':
      return (
        <g>
          <circle cx={x} cy={y} r={r} fill={F.eye} />
          <circle cx={x - 1.6} cy={y - 1.8} r={big ? 2.4 : 1.9} fill={PAL.white} />
        </g>
      );
    case 'look':
      return (
        <g>
          <circle cx={x} cy={y} r={r} fill={F.eye} />
          <circle cx={x + 1.4} cy={y - 2} r={big ? 2.4 : 1.9} fill={PAL.white} />
        </g>
      );
    default: {
      // calm / half-lidded: the serene, unbothered capybara look. The lid follows
      // the eye's own curve (a soft dome, not a flat cut) so it reads content, not skeptical.
      const rr = r + 0.9;
      const top = y - rr * 0.42;
      return (
        <g>
          <ellipse cx={x} cy={y} rx={rr} ry={rr * 0.98} fill={F.eye} />
          <path d={`M${x - rr - 1.2} ${y - 0.4} C${x - rr} ${top - 2.6} ${x + rr} ${top - 2.6} ${x + rr + 1.2} ${y - 0.4} C${x + rr * 0.7} ${top + 1.2} ${x - rr * 0.7} ${top + 1.2} ${x - rr - 1.2} ${y - 0.4} Z`} fill={F.fur} />
          <path d={`M${x - rr - 1.2} ${y - 0.4} C${x - rr * 0.7} ${top + 1.2} ${x + rr * 0.7} ${top + 1.2} ${x + rr + 1.2} ${y - 0.4}`} stroke={F.lid} strokeWidth={big ? 3 : 2.3} strokeLinecap="round" fill="none" />
          <circle cx={x - 1.7} cy={y + 0.9} r={big ? 1.9 : 1.5} fill={PAL.white} />
        </g>
      );
    }
  }
}

function MouthShape({ kind }: { kind: Mouth }) {
  const st = { stroke: F.mouth, strokeWidth: 2.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  switch (kind) {
    case 'w':
      return (
        <g {...st}>
          <path d="M100 104 V113" />
          <path d="M92.5 112.5 Q96.3 117 100 113 Q103.7 117 107.5 112.5" />
        </g>
      );
    case 'smug':
      return (
        <g {...st}>
          <path d="M100 104 V112.5" />
          <path d="M90.5 110.5 Q95.3 117.5 100 112.5 Q104.7 117.5 109.5 110.5" />
        </g>
      );
    case 'open':
      return (
        <g>
          <path d="M100 104 V110" {...st} />
          <path d="M90.5 110 Q100 112 109.5 110 Q109 124 100 124 Q91 124 90.5 110 Z" fill={F.mouth} />
          <path d="M94 120 Q100 115.5 106 120 Q104 124 100 124 Q96 124 94 120 Z" fill={F.tongue} />
        </g>
      );
    case 'yawn':
      return (
        <g>
          <path d="M100 104 V109" {...st} />
          <ellipse cx="100" cy="117" rx="6.2" ry="7.8" fill={F.mouth} />
          <ellipse cx="100" cy="121" rx="3.8" ry="2.8" fill={F.tongue} />
        </g>
      );
    case 'wavy':
      return (
        <g {...st}>
          <path d="M100 104 V112" />
          <path d="M92 116 Q96 112 100 115 Q104 118 108 114" />
        </g>
      );
    case 'flat':
      return (
        <g {...st}>
          <path d="M100 104 V113" />
          <path d="M95 114.5 Q101 113 107 114" />
        </g>
      );
    case 'o':
      return (
        <g>
          <path d="M100 104 V109" {...st} />
          <ellipse cx="100" cy="114" rx="3" ry="3.5" fill={F.mouth} />
        </g>
      );
    default:
      return null;
  }
}

interface HeadProps {
  id: string;
  eyes: Eyes;
  mouth: Mouth;
  brows?: 'worried' | 'hmm';
  blush?: number;
  big: boolean;
  /** Placement: translate, then rotate/scale about the chin. */
  x?: number;
  y?: number;
  rot?: number;
  k?: number;
  yuzuRot?: number;
  yuzuX?: number;
  noYuzu?: boolean;
}

/** Head = ears + barrel head + snout block + face + yuzu, in the local head frame. */
function Head({ id, eyes, mouth, brows, blush = 0.5, big, x = 0, y = 0, rot = 0, k = 1, yuzuRot = 0, yuzuX = 100, noYuzu }: HeadProps) {
  const open = eyes !== 'closed' && eyes !== 'happy';
  const tf = `translate(${x} ${y}) rotate(${rot} 100 163) translate(100 163) scale(${k}) translate(-100 -163)`;
  return (
    <g transform={tf}>
      {/* ears: tiny, round, at the upper back corners */}
      <g className={s.earL}>
        <circle cx="57" cy="45" r="8.2" fill={F.ear} />
        <circle cx="55.2" cy="43.4" r="3.8" fill={F.earIn} />
      </g>
      <g className={s.earR}>
        <circle cx="143" cy="45" r="8.2" fill={F.ear} />
        <circle cx="144.8" cy="43.4" r="3.8" fill={F.earIn} />
      </g>
      {/* barrel head */}
      <clipPath id={`${id}-hd`}>
        <path d={HEAD} />
      </clipPath>
      <path d={HEAD} fill={F.furShade} />
      <g clipPath={`url(#${id}-hd)`}>
        <path d={HEAD} fill={F.fur} transform="translate(-7 -5)" />
        <path d="M58 70 C58 52 66 42 80 39 C70 47 65 57 64 71 Z" fill={F.furHi} opacity="0.75" />
        {/* snout block: same family, darker & warmer; its top plane catches the light */}
        <path d={SNOUT_REGION} fill={F.snoutShade} />
        <g>
          <clipPath id={`${id}-sn`}>
            <path d={SNOUT_REGION} />
          </clipPath>
          <g clipPath={`url(#${id}-sn)`}>
            <path d={HEAD} fill={F.snout} transform="translate(-7 -5)" />
            <path d="M57 101 C66 92 82 88.4 100 88" stroke={F.snoutHi} strokeWidth="6" strokeLinecap="round" fill="none" transform="translate(0 3.4)" />
          </g>
        </g>
        {/* coarse fur tufts on the crown */}
        {!big && (
          <g stroke={F.furShade} strokeWidth="2.6" strokeLinecap="round" opacity="0.7">
            <path d="M92 40 l2 5" />
            <path d="M100 39 v5" />
            <path d="M108 40 l-2 5" />
          </g>
        )}
      </g>
      {/* blush on the snout sides */}
      <ellipse cx="65" cy="122" rx={big ? 9 : 7.5} ry={big ? 6 : 4.8} fill={F.blush} opacity={blush} />
      <ellipse cx="135" cy="122" rx={big ? 9 : 7.5} ry={big ? 6 : 4.8} fill={F.blush} opacity={blush} />
      {/* wide, flat nose on the snout's top edge */}
      {big ? (
        <path d="M78 96 C78 91 86 89.5 100 89.5 C114 89.5 122 91 122 96 C122 101.5 113 104.5 100 104.5 C87 104.5 78 101.5 78 96 Z" fill={F.nose} />
      ) : (
        <>
          <path d="M80 96.5 C80 91.5 86 90 100 90 C114 90 120 91.5 120 96.5 C120 102.5 111.5 105.5 100 105.5 C88.5 105.5 80 102.5 80 96.5 Z" fill={F.nose} />
          <ellipse cx="91" cy="93.6" rx="5.4" ry="1.7" fill={PAL.white} opacity="0.4" />
        </>
      )}
      {!big && <MouthShape kind={mouth} />}
      {/* eyes: small, set high and wide */}
      <g className={open ? s.blink : undefined}>
        <Eye x={70} y={63} kind={eyes} big={big} />
        <Eye x={130} y={63} kind={eyes} big={big} />
      </g>
      {brows === 'worried' && (
        <g stroke={F.lid} strokeWidth="3" strokeLinecap="round" fill="none">
          <path d="M61 54 Q67 51.5 75 48" />
          <path d="M139 54 Q133 51.5 125 48" />
        </g>
      )}
      {brows === 'hmm' && <path d="M123 51 Q131 45.5 140 49" stroke={F.lid} strokeWidth="3" strokeLinecap="round" fill="none" />}
      {!noYuzu && <Yuzu x={yuzuX} y={34.5} rot={yuzuRot} />}
    </g>
  );
}

/** Curved arm ending in a mitten paw (optionally showing its pad). */
function BentArm({ d, end, w = 17, pad }: { d: string; end: [number, number]; w?: number; pad?: boolean }) {
  const r = w * 0.64;
  return (
    <g>
      <path d={d} stroke={F.paw} strokeWidth={w} strokeLinecap="round" fill="none" />
      <Paw x={end[0]} y={end[1]} r={r} />
      {pad && (
        <g fill="#D9A57A">
          <ellipse cx={end[0]} cy={end[1] + r * 0.18} rx={r * 0.46} ry={r * 0.38} />
          <circle cx={end[0] - r * 0.5} cy={end[1] - r * 0.42} r={r * 0.17} />
          <circle cx={end[0]} cy={end[1] - r * 0.58} r={r * 0.17} />
          <circle cx={end[0] + r * 0.5} cy={end[1] - r * 0.42} r={r * 0.17} />
        </g>
      )}
    </g>
  );
}

/** Round little paw with a soft sheen (top-left). */
function Paw({ x, y, r = 9 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={F.paw} />
      <ellipse cx={x - r * 0.3} cy={y - r * 0.38} rx={r * 0.45} ry={r * 0.28} fill={F.pawHi} opacity="0.7" transform={`rotate(-25 ${x - r * 0.3} ${y - r * 0.38})`} />
    </g>
  );
}

function Mug({ x, y, rot = 0, id }: { x: number; y: number; rot?: number; id: string }) {
  // (x, y) = centre of the mug's front face. 44 wide x 36 tall.
  const body = 'M-22 -16 H22 V8 C22 16 16 20 8 20 H-8 C-16 20 -22 16 -22 8 Z';
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <path d="M20 -7 C33 -8 34 10 20 10" stroke={PAL.persimmonShade} strokeWidth="6" fill="none" strokeLinecap="round" />
      <clipPath id={`${id}-mug`}>
        <path d={body} />
      </clipPath>
      <path d={body} fill={PAL.persimmonShade} />
      <g clipPath={`url(#${id}-mug)`}>
        <path d={body} fill={PAL.persimmon} transform="translate(-6 -3)" />
        <rect x="-17" y="-10" width="5" height="20" rx="2.5" fill={PAL.persimmonHi} opacity="0.8" />
      </g>
      <ellipse cx="0" cy="-16" rx="22" ry="4.5" fill={PAL.persimmonShade} />
      <ellipse cx="0" cy="-15.4" rx="18.5" ry="3" fill={PAL.tea} />
      <path d="M-3 4 C-3 -3 3 -6 8 -6 C8 1 3 4 -3 4 Z" fill={PAL.paper} opacity="0.9" />
    </g>
  );
}

function Sparkles({ pts, color = PAL.honey }: { pts: [number, number, number][]; color?: string }) {
  return (
    <g fill={color}>
      {pts.map(([x, y, r], i) => (
        <path key={i} className={s.twinkle} d={star(x, y, r)} />
      ))}
    </g>
  );
}

function Shadow({ w = 64, className, y = 189 }: { w?: number; className?: string; y?: number }) {
  return <ellipse className={className} cx="100" cy={y} rx={w} ry="7.5" fill="var(--art-shadow)" />;
}

/* ---------- poses ---------- */

function renderPose(pose: MascotPose, id: string, big: boolean): ReactNode {
  switch (pose) {
    case 'wave':
      return (
        <>
          <Shadow />
          <g className={s.breathe}>
            <g className={s.wave}>
              <BentArm d="M152 144 Q172 130 176 98" end={[176, 92]} w={17} pad />
            </g>
            <Barrel d={SIT} id={id} />
            <Legs />
            <Head id={id} rot={-3} eyes="open" mouth="w" blush={0.62} big={big} />
          </g>
        </>
      );
    case 'focus':
      return (
        <>
          <Shadow />
          <g className={s.breathe}>
            <Barrel d={SIT} id={id} />
            <Legs />
            <Head id={id} eyes="closed" mouth="w" blush={0.55} big={big} />
            <Mug x={100} y={172} id={id} />
            <Paw x={76} y={171} />
            <Paw x={124} y={171} />
          </g>
        </>
      );
    case 'sip':
      return (
        <>
          <Shadow />
          <g className={s.breathe}>
            <Barrel d={SIT} id={id} />
            <Legs />
            <Head id={id} eyes="closed" mouth="none" blush={0.8} big={big} />
            <g className={s.sipMug}>
              <Mug x={101} y={140} rot={-6} id={id} />
              <Paw x={78} y={145} />
              <Paw x={124} y={143} />
            </g>
          </g>
          {/* vapor in front of the face: light wisps read on the snout in both themes */}
          <g stroke="rgba(255, 245, 235, 0.8)" strokeWidth="4.2" strokeLinecap="round" fill="none">
            <path className={s.steam} d="M92 120 C87 112 96 107 91 96" />
            <path className={s.steam} d="M109 118 C104 110 113 105 108 92" />
          </g>
        </>
      );
    case 'sleep':
      return (
        <>
          <Shadow w={82} y={190} />
          <g className={s.breathe}>
            <Barrel d={LIE} id={id} tufts={false} />
            <Head id={id} x={-6} y={27} k={0.84} rot={-12} eyes="closed" mouth="o" blush={0.55} big={big} yuzuRot={24} yuzuX={114} />
            <Paw x={76} y={185} r={8.5} />
            <Paw x={110} y={186} r={8.5} />
          </g>
          <g fill="none" stroke="var(--art-z)" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round">
            <path className={s.z} d="M150 70 h11 l-11 13 h11" />
            <path className={s.z} d="M166 44 h14 l-14 16 h14" />
            <path className={s.z} d="M144 34 h8 l-8 10 h8" />
          </g>
        </>
      );
    case 'cheer':
      return (
        <>
          <Shadow w={52} className={s.jumpShadow} y={190} />
          <g transform="translate(0 6)">
            <g className={s.jump}>
              <g className={s.cheerArmL}>
                <BentArm d="M52 128 Q34 116 30 88" end={[30, 84]} />
              </g>
              <g className={s.cheerArmR}>
                <BentArm d="M148 128 Q166 116 170 88" end={[170, 84]} />
              </g>
              <Barrel d={SIT} id={id} />
              <Legs y={172} />
              <Head id={id} y={-4} eyes="happy" mouth="open" blush={0.75} big={big} yuzuRot={-6} />
            </g>
          </g>
          <Sparkles pts={[[26, 44, 8], [178, 42, 7], [172, 150, 5]]} />
        </>
      );
    case 'proud':
      return (
        <>
          <Shadow />
          <g className={s.breathe}>
            <Barrel d={SIT} id={id} />
            <Legs />
            <Head id={id} y={-3} eyes="sparkle" mouth="smug" blush={0.7} big={big} yuzuRot={5} />
          </g>
          <Sparkles pts={[[30, 50, 8], [170, 22, 9], [180, 76, 5]]} />
        </>
      );
    case 'concerned':
      return (
        <>
          <Shadow />
          <g className={s.sway}>
            <g className={s.breathe}>
              <Barrel d={SIT} id={id} />
              <Legs />
              <Head id={id} rot={4} eyes="worried" mouth="wavy" brows="worried" blush={0.45} big={big} yuzuRot={-8} />
              <Paw x={90} y={161} />
              <Paw x={110} y={161} />
            </g>
          </g>
        </>
      );
    case 'think':
      return (
        <>
          <Shadow />
          <g className={s.breathe}>
            <Barrel d={SIT} id={id} />
            <Legs />
            <Head id={id} rot={-5} eyes="look" mouth="flat" brows="hmm" blush={0.4} big={big} yuzuRot={-10} />
            <BentArm d="M150 174 Q157 152 145 136" end={[143, 133]} w={17} />
          </g>
          <g fill="var(--art-bubble)">
            <circle className={s.thinkDot} cx="160" cy="42" r="4.5" />
            <circle className={s.thinkDot} cx="172" cy="28" r="6" />
            <circle className={s.thinkDot} cx="185" cy="10" r="7.5" />
          </g>
        </>
      );
    case 'peek':
      return (
        <g className={s.peekBob}>
          <Head id={id} y={66} eyes="open" mouth="none" blush={0.45} big={big} yuzuRot={-4} />
          <Paw x={66} y={197} r={13} />
          <Paw x={134} y={197} r={13} />
        </g>
      );
    case 'stretch':
      return (
        <>
          <Shadow />
          <g className={s.breathe}>
            <g className={s.stretchArmL}>
              <BentArm d="M56 124 Q34 104 30 64" end={[30, 60]} />
            </g>
            <g className={s.stretchArmR}>
              <BentArm d="M144 124 Q166 104 170 64" end={[170, 60]} />
            </g>
            <Barrel d={SIT} id={id} />
            <Legs />
            <Head id={id} y={-3} eyes="closed" mouth="yawn" blush={0.55} big={big} yuzuRot={6} />
          </g>
        </>
      );
    default:
      return (
        <>
          <Shadow />
          <g className={s.breathe}>
            <Barrel d={SIT} id={id} />
            <Legs />
            <Head id={id} eyes="calm" mouth="w" big={big} />
          </g>
        </>
      );
  }
}

/**
 * Chai's drawing as a bare <g> in a 200×200 space, for embedding inside other
 * illustrations (spots, the nook fallback, app icons). The host <svg> must carry
 * the art root class (and `live` for animation) — see ArtSvg in ./kit.
 */
export function ChaiArt({ pose = 'idle', id, big = false }: { pose?: MascotPose; id: string; big?: boolean }) {
  return <g data-pose={pose}>{renderPose(pose, id, big)}</g>;
}

export function Mascot({ pose = 'idle', size = 160, animate = true, className, title }: MascotProps) {
  const reduced = useReducedMotion();
  const live = animate && !reduced;
  const id = safeId(useId());
  // Optical adjustment: at small sizes, bigger eyes/nose and no fine mouth detail.
  const big = size < 72;
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={[s.root, live ? s.live : '', pose === 'peek' ? s.clip : '', className].filter(Boolean).join(' ')}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      data-pose={pose}
      focusable="false"
    >
      <g key={pose} className={s.arrive}>
        {renderPose(pose, id, big)}
      </g>
    </svg>
  );
}

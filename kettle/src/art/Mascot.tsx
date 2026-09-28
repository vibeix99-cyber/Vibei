/**
 * Chai the capybara. OWNER: art area.
 * Flat geometric construction (circles + rounded shapes), one highlight and
 * one shade per form, light from the top-left, no outlines.
 * Props contract is stable: pose, size, animate, className, title.
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

type Eyes = 'open' | 'closed' | 'happy' | 'sparkle' | 'worried' | 'look';
type Mouth = 'w' | 'open' | 'smug' | 'wavy' | 'flat' | 'o' | 'yawn' | 'none';

/* ---------- geometry ---------- */

/** Sitting loaf (head + body are one soft form). */
const LOAF = 'M100 54 C145 54 163 70 165 112 C167 160 158 188 100 188 C42 188 33 160 35 112 C37 70 55 54 100 54 Z';
/** Taller loaf for jumping / stretching. */
const TALL = 'M100 44 C143 44 161 61 163 104 C165 154 156 184 100 184 C44 184 35 154 37 104 C39 61 57 44 100 44 Z';
/** Melted loaf for sleeping. */
const FLAT = 'M100 92 C150 92 180 112 181 146 C182 174 160 188 100 188 C40 188 18 174 19 146 C20 112 50 92 100 92 Z';

/* ---------- parts ---------- */

function Body({ d, id, dy = 0, chest }: { d: string; id: string; dy?: number; chest?: boolean }) {
  return (
    <g transform={dy ? `translate(0 ${dy})` : undefined}>
      <clipPath id={`${id}-b`}>
        <path d={d} />
      </clipPath>
      <path d={d} fill={PAL.furShade} />
      <g clipPath={`url(#${id}-b)`}>
        <path d={d} fill={PAL.fur} transform="translate(-8 -7)" />
        <path d="M45 100 C46 82 57 70 76 65 C63 75 56 86 51 101 Z" fill={PAL.furHi} opacity="0.65" />
        {chest && <ellipse cx="96" cy="166" rx="30" ry="11" fill={PAL.furHi} opacity="0.55" />}
      </g>
    </g>
  );
}

function Ears({ dx = 0, dy = 0 }: { dx?: number; dy?: number }) {
  return (
    <g transform={`translate(${dx} ${dy})`}>
      <g className={s.earL}>
        <ellipse cx="57" cy="66" rx="8.4" ry="7.6" fill={PAL.ear} transform="rotate(-24 57 66)" />
        <ellipse cx="55.6" cy="65" rx="3.9" ry="3.3" fill={PAL.earIn} transform="rotate(-24 55.6 65)" />
      </g>
      <g className={s.earR}>
        <ellipse cx="143" cy="66" rx="8.4" ry="7.6" fill={PAL.ear} transform="rotate(24 143 66)" />
        <ellipse cx="144.4" cy="65" rx="3.9" ry="3.3" fill={PAL.earIn} transform="rotate(24 144.4 65)" />
      </g>
    </g>
  );
}

function Yuzu({ x = 100, y = 57, rot = 0 }: { x?: number; y?: number; rot?: number }) {
  // (x, y) = contact point on the head.
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <g className={s.yuzu}>
        {/* leaf */}
        <path d="M2 -27 C8 -38 20 -40 27 -35 C21 -26 11 -23 2 -27 Z" fill={PAL.leaf} />
        <path d="M2 -27 C11 -23 21 -26 27 -35 C19 -30 10 -28 2 -27 Z" fill={PAL.leafShade} />
        {/* fruit */}
        <ellipse cx="0" cy="-13" rx="16" ry="14" fill={PAL.yuzuShade} />
        <ellipse cx="-2.2" cy="-14.8" rx="13.6" ry="12" fill={PAL.yuzu} />
        <ellipse cx="-6.5" cy="-19.5" rx="4.6" ry="3" fill={PAL.yuzuHi} transform="rotate(-30 -6.5 -19.5)" />
        <g fill={PAL.yuzuShade} opacity="0.75">
          <circle cx="5" cy="-17" r="1" />
          <circle cx="8.5" cy="-11" r="0.9" />
          <circle cx="3" cy="-8" r="0.9" />
          <circle cx="-4" cy="-10" r="0.8" />
        </g>
        {/* stem nub */}
        <rect x="-1.8" y="-30" width="3.6" height="5.5" rx="1.8" fill={PAL.stem} />
      </g>
    </g>
  );
}

function Eye({ x, y, kind, big }: { x: number; y: number; kind: Eyes; big: boolean }) {
  const r = big ? 7.4 : 5.8;
  const sw = big ? 4.4 : 3.4;
  switch (kind) {
    case 'closed':
      return <path d={`M${x - 7} ${y - 1} Q${x} ${y + 6} ${x + 7} ${y - 1}`} stroke={PAL.eye} strokeWidth={sw} strokeLinecap="round" fill="none" />;
    case 'happy':
      return <path d={`M${x - 7} ${y + 3} Q${x} ${y - 6} ${x + 7} ${y + 3}`} stroke={PAL.eye} strokeWidth={sw} strokeLinecap="round" fill="none" />;
    case 'sparkle':
      return (
        <g>
          <circle cx={x} cy={y} r={r + 1.6} fill={PAL.eye} />
          <path d={star(x - 2, y - 2.2, 4.2)} fill={PAL.white} />
          <circle cx={x + 2.6} cy={y + 2.8} r="1.2" fill={PAL.white} />
        </g>
      );
    case 'worried':
      return (
        <g>
          <circle cx={x} cy={y} r={r + 0.8} fill={PAL.eye} />
          <circle cx={x - 2} cy={y - 2.2} r="2.5" fill={PAL.white} />
          <circle cx={x + 2.2} cy={y + 2.4} r="1.2" fill={PAL.white} />
        </g>
      );
    case 'look':
      return (
        <g>
          <circle cx={x} cy={y} r={r} fill={PAL.eye} />
          <circle cx={x + 1.6} cy={y - 2.2} r={big ? 2.6 : 2} fill={PAL.white} />
        </g>
      );
    default:
      return (
        <g>
          <ellipse cx={x} cy={y} rx={r} ry={r * 1.08} fill={PAL.eye} />
          <circle cx={x - 1.9} cy={y - 2.1} r={big ? 2.7 : 2.15} fill={PAL.white} />
          <circle cx={x + 2.1} cy={y + 2.5} r={big ? 1.2 : 0.95} fill={PAL.white} opacity="0.75" />
        </g>
      );
  }
}

function MouthShape({ kind }: { kind: Mouth }) {
  const st = { stroke: PAL.mouth, strokeWidth: 2.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  switch (kind) {
    case 'w':
      return (
        <g {...st}>
          <path d="M100 120 V132" />
          <path d="M91.5 131.5 Q95.7 137 100 132 Q104.3 137 108.5 131.5" />
        </g>
      );
    case 'smug':
      return (
        <g {...st}>
          <path d="M100 120 V131" />
          <path d="M89 128.5 Q94.5 137 100 131 Q105.5 137 111 128.5" />
        </g>
      );
    case 'open':
      return (
        <g>
          <path d="M100 120 V130" {...st} />
          <path d="M89.5 129 Q100 131 110.5 129 Q110 145 100 145 Q90 145 89.5 129 Z" fill={PAL.mouth} />
          <path d="M93.5 140.5 Q100 135.5 106.5 140.5 Q104.5 145 100 145 Q95.5 145 93.5 140.5 Z" fill={PAL.tongue} />
        </g>
      );
    case 'yawn':
      return (
        <g>
          <path d="M100 120 V127" {...st} />
          <ellipse cx="100" cy="136" rx="7" ry="9" fill={PAL.mouth} />
          <ellipse cx="100" cy="141" rx="4.4" ry="3.4" fill={PAL.tongue} />
        </g>
      );
    case 'wavy':
      return (
        <g {...st}>
          <path d="M100 120 V130" />
          <path d="M91 135 Q95.5 130.5 100 133.5 Q104.5 136.5 109 132" />
        </g>
      );
    case 'flat':
      return (
        <g {...st}>
          <path d="M100 120 V131" />
          <path d="M95 133 Q101 131 108 132" />
        </g>
      );
    case 'o':
      return (
        <g>
          <path d="M100 120 V127" {...st} />
          <ellipse cx="100" cy="133" rx="3.6" ry="4.2" fill={PAL.mouth} />
        </g>
      );
    default:
      return null;
  }
}

interface FaceProps {
  id: string;
  dx?: number;
  dy?: number;
  eyes: Eyes;
  mouth: Mouth;
  brows?: 'worried' | 'hmm';
  blush?: number;
  big: boolean;
}

function Face({ id, dx = 0, dy = 0, eyes, mouth, brows, blush = 0.55, big }: FaceProps) {
  const open = eyes === 'open' || eyes === 'look' || eyes === 'worried' || eyes === 'sparkle';
  // Broad, tall capybara snout: nose sits at its top, long upper lip below.
  const muzzle = 'M100 98 C127 98 141 106 141 126 C141 149 126 159 100 159 C74 159 59 149 59 126 C59 106 73 98 100 98 Z';
  return (
    <g transform={`translate(${dx} ${dy})`}>
      {/* blush */}
      <ellipse cx="47" cy="124" rx={big ? 10 : 8.5} ry={big ? 7 : 5.6} fill={PAL.blush} opacity={blush} />
      <ellipse cx="153" cy="124" rx={big ? 10 : 8.5} ry={big ? 7 : 5.6} fill={PAL.blush} opacity={blush} />
      {/* muzzle */}
      <clipPath id={`${id}-m`}>
        <path d={muzzle} />
      </clipPath>
      <path d={muzzle} fill={PAL.creamShade} />
      <g clipPath={`url(#${id}-m)`}>
        <path d={muzzle} fill={PAL.cream} transform="translate(-5 -6)" />
      </g>
      {/* nose: wide dark oval at the top of the snout */}
      <path
        d={big
          ? 'M76 110 C76 101 87 99.5 100 99.5 C113 99.5 124 101 124 110 C124 119 112 124 100 124 C88 124 76 119 76 110 Z'
          : 'M79 109 C79 101.5 88.5 100.5 100 100.5 C111.5 100.5 121 101.5 121 109 C121 116.5 111 120.5 100 120.5 C89 120.5 79 116.5 79 109 Z'}
        fill={PAL.nose}
      />
      <ellipse cx="90.5" cy="105.2" rx="5.2" ry="2.1" fill={PAL.white} opacity="0.62" transform="rotate(-6 90.5 105.2)" />
      {/* whisker dots */}
      {!big && (
        <g fill={PAL.creamShade}>
          <circle cx="75" cy="128" r="1.6" />
          <circle cx="70" cy="134" r="1.6" />
          <circle cx="125" cy="128" r="1.6" />
          <circle cx="130" cy="134" r="1.6" />
        </g>
      )}
      {!big && <MouthShape kind={mouth} />}
      {/* eyes */}
      <g className={open ? s.blink : undefined}>
        <Eye x={66} y={84} kind={eyes} big={big} />
        <Eye x={134} y={84} kind={eyes} big={big} />
      </g>
      {brows === 'worried' && (
        <g stroke={PAL.earIn} strokeWidth="3.4" strokeLinecap="round" fill="none">
          <path d="M56 72 Q63 69.5 71 66" />
          <path d="M144 72 Q137 69.5 129 66" />
        </g>
      )}
      {brows === 'hmm' && (
        <path d="M125 69 Q133 62.5 143 66" stroke={PAL.earIn} strokeWidth="3.4" strokeLinecap="round" fill="none" />
      )}
    </g>
  );
}

/** Stubby arm = round-capped capsule, a touch darker than the body, with a soft sheen. */
function Arm({ x1, y1, x2, y2, w = 18 }: { x1: number; y1: number; x2: number; y2: number; w?: number }) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  // unit normal pointing up-left (towards the light)
  let nx = -dy / len;
  let ny = dx / len;
  if (nx + ny > 0) {
    nx = -nx;
    ny = -ny;
  }
  const o = w * 0.22;
  return (
    <g>
      <path d={`M${x1} ${y1} L${x2} ${y2}`} stroke={PAL.paw} strokeWidth={w} strokeLinecap="round" />
      {len > 8 && <path
        d={`M${x1 + nx * o} ${y1 + ny * o} L${x2 + nx * o} ${y2 + ny * o}`}
        stroke={PAL.pawHi}
        strokeWidth={w * 0.28}
        strokeLinecap="round"
        opacity="0.55"
      />}
    </g>
  );
}

/** Curved arm (quadratic) for bent poses, ending in a mitten paw (optionally showing its pad). */
function BentArm({ d, end, w = 18, pad }: { d: string; end: [number, number]; w?: number; pad?: boolean }) {
  const r = w * 0.64;
  return (
    <g>
      <path d={d} stroke={PAL.paw} strokeWidth={w} strokeLinecap="round" fill="none" />
      <Paw x={end[0]} y={end[1]} r={r} />
      {pad && (
        <g fill={PAL.creamShade}>
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
function Paw({ x, y, r = 9.5 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={PAL.paw} />
      <ellipse cx={x - r * 0.3} cy={y - r * 0.38} rx={r * 0.45} ry={r * 0.28} fill={PAL.pawHi} opacity="0.7" transform={`rotate(-25 ${x - r * 0.3} ${y - r * 0.38})`} />
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
      {/* rim + tea */}
      <ellipse cx="0" cy="-16" rx="22" ry="4.5" fill={PAL.persimmonShade} />
      <ellipse cx="0" cy="-15.4" rx="18.5" ry="3" fill={PAL.tea} />
      {/* little leaf emblem */}
      <path d="M-3 4 C-3 -3 3 -6 8 -6 C8 1 3 4 -3 4 Z" fill={PAL.paper} opacity="0.9" />
    </g>
  );
}

function star(cx: number, cy: number, r: number): string {
  const k = r * 0.22;
  return `M${cx} ${cy - r} Q${cx + k} ${cy - k} ${cx + r} ${cy} Q${cx + k} ${cy + k} ${cx} ${cy + r} Q${cx - k} ${cy + k} ${cx - r} ${cy} Q${cx - k} ${cy - k} ${cx} ${cy - r} Z`;
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

function Shadow({ w = 62, className, y = 188 }: { w?: number; className?: string; y?: number }) {
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
            <Ears />
            <Body d={LOAF} id={id} />
            <Face id={id} eyes="open" mouth="open" blush={0.65} big={big} />
            <Yuzu />
            <Paw x={82} y={179} />
            <g className={s.wave}>
              <BentArm d="M150 144 Q170 128 175 98" end={[175, 90]} w={18} pad />
            </g>
          </g>
        </>
      );
    case 'focus':
      return (
        <>
          <Shadow />
          <g className={s.breathe}>
            <Ears />
            <Body d={LOAF} id={id} />
            <Face id={id} eyes="closed" mouth="w" blush={0.6} big={big} />
            <Yuzu />
            <Mug x={100} y={168} id={id} />
            <Paw x={77} y={167} />
            <Paw x={123} y={167} />
          </g>
        </>
      );
    case 'sip':
      return (
        <>
          <Shadow />
          <g className={s.breathe}>
            <Ears />
            <Body d={LOAF} id={id} />
            <Face id={id} eyes="happy" mouth="none" blush={0.85} big={big} />
            <Yuzu />
            <g className={s.sipMug}>
              <Mug x={101} y={150} rot={-6} id={id} />
              <Paw x={79} y={154} />
              <Paw x={124} y={152} />
            </g>
          </g>
          {/* vapor in front of the face: light wisps read on fur and nose in both themes */}
          <g stroke="rgba(255, 255, 255, 0.78)" strokeWidth="4.4" strokeLinecap="round" fill="none">
            <path className={s.steam} d="M93 130 C88 122 97 117 92 106" />
            <path className={s.steam} d="M109 128 C104 120 113 115 108 100" />
          </g>
        </>
      );
    case 'sleep':
      return (
        <>
          <Shadow w={80} />
          <g className={s.breathe}>
            <Ears dx={0} dy={36} />
            <Body d={FLAT} id={id} />
            <Face id={id} dy={32} eyes="closed" mouth="o" blush={0.6} big={big} />
            <Yuzu x={121} y={95} rot={18} />
            <Paw x={84} y={183} r={8.5} />
            <Paw x={116} y={183} r={8.5} />
          </g>
          <g fill="none" stroke="var(--art-z)" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round">
            <path className={s.z} d="M150 66 h11 l-11 13 h11" />
            <path className={s.z} d="M166 40 h14 l-14 16 h14" />
            <path className={s.z} d="M142 30 h8 l-8 10 h8" />
          </g>
        </>
      );
    case 'cheer':
      return (
        <>
          <Shadow w={52} className={s.jumpShadow} y={190} />
          <g transform="translate(0 7)">
          <g className={s.jump}>
            <g className={s.cheerArmL}>
              <Arm x1={56} y1={124} x2={30} y2={84} />
            </g>
            <g className={s.cheerArmR}>
              <Arm x1={144} y1={124} x2={170} y2={84} />
            </g>
            <Ears dy={-9} />
            <Body d={TALL} id={id} dy={-4} />
            <Face id={id} dy={-10} eyes="happy" mouth="open" blush={0.75} big={big} />
            <Yuzu y={40} rot={-6} />
            <Paw x={84} y={176} r={8.5} />
            <Paw x={116} y={176} r={8.5} />
          </g>
          </g>
          <Sparkles pts={[[28, 46, 8], [176, 40, 7], [168, 150, 5]]} />
        </>
      );
    case 'proud':
      return (
        <>
          <Shadow />
          <g className={s.breathe}>
            <Ears dy={-6} />
            <Body d={TALL} id={id} dy={4} />
            <Face id={id} dy={-8} eyes="sparkle" mouth="smug" blush={0.7} big={big} />
            <Yuzu y={49} rot={5} />
            <Paw x={84} y={181} r={8.5} />
            <Paw x={116} y={181} r={8.5} />
          </g>
          <Sparkles pts={[[32, 52, 8], [170, 32, 9], [180, 84, 5]]} />
        </>
      );
    case 'concerned':
      return (
        <>
          <Shadow />
          <g className={s.sway}>
            <g className={s.breathe}>
              <Ears />
              <Body d={LOAF} id={id} />
              <Face id={id} eyes="worried" mouth="wavy" brows="worried" blush={0.5} big={big} />
              <Yuzu rot={-8} />
              <Paw x={90} y={168} />
              <Paw x={110} y={168} />
            </g>
          </g>
        </>
      );
    case 'think':
      return (
        <>
          <Shadow />
          <g transform="rotate(-4 100 188)">
            <g className={s.breathe}>
              <Ears />
              <Body d={LOAF} id={id} />
              <Face id={id} dx={4} dy={-2} eyes="look" mouth="flat" brows="hmm" blush={0.45} big={big} />
              <Yuzu rot={-10} />
              <Paw x={82} y={179} />
              <Arm x1={137} y1={173} x2={124} y2={161} w={18} />
              <Paw x={121} y={158} r={10.5} />
            </g>
          </g>
          <g fill="var(--art-bubble)">
            <circle className={s.thinkDot} cx="162" cy="56" r="4.5" />
            <circle className={s.thinkDot} cx="174" cy="40" r="6" />
            <circle className={s.thinkDot} cx="186" cy="20" r="8" />
          </g>
        </>
      );
    case 'peek':
      return (
        <g className={s.peekBob}>
          <Ears dy={58} />
          <Body d={LOAF} id={id} dy={60} />
          <Face id={id} dy={58} eyes="open" mouth="none" blush={0.5} big={big} />
          <Yuzu y={117} rot={-4} />
          <Paw x={64} y={197} r={14} />
          <Paw x={136} y={197} r={14} />
        </g>
      );
    case 'stretch':
      return (
        <>
          <Shadow />
          <g className={s.breathe}>
            <g className={s.stretchArmL}>
              <BentArm d="M58 118 Q34 100 28 64" end={[28, 60]} />
            </g>
            <g className={s.stretchArmR}>
              <BentArm d="M142 118 Q166 100 172 64" end={[172, 60]} />
            </g>
            <Ears dy={-8} />
            <Body d={TALL} id={id} dy={4} />
            <Face id={id} dy={-6} eyes="closed" mouth="yawn" blush={0.6} big={big} />
            <Yuzu y={50} rot={6} />
            <Paw x={84} y={181} r={8.5} />
            <Paw x={116} y={181} r={8.5} />
          </g>
        </>
      );
    default:
      return (
        <>
          <Shadow />
          <g className={s.breathe}>
            <Ears />
            <Body d={LOAF} id={id} />
            <Face id={id} eyes="open" mouth="w" big={big} />
            <Yuzu />
            <Paw x={82} y={179} />
            <Paw x={118} y={179} />
          </g>
        </>
      );
  }
}

/**
 * Chai's drawing as a bare <g> in a 200×200 space, for embedding inside other
 * illustrations (spots, the nook fallback). The host <svg> must carry the art
 * root class (and `live` for animation) — see ArtSvg in ./kit.
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

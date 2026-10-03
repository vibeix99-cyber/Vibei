/**
 * The kettle that is the timer. OWNER: core-loop area.
 *
 * A squat enamel stovetop kettle in the brand persimmon: a swan-neck spout with a hinged whistle cap, a wire
 * bail with a wooden grip and the yuzu knob from the logo, on a small cast-iron burner. Drawn the way Chai is
 * drawn: flat forms, no outlines, light from the top-left, one shade and one highlight per form.
 *
 * Progress is never a fill (no "water level", never a greyed-out kettle). It is carried by:
 *   - the heat gauge on the belly: a needle sweeping a warm arc (glanceable; the digits stay the exact time);
 *     time added with +5 shows as a honey segment at the end of the arc, and the needle eases back;
 *   - the flame under the kettle and a warm under-glow on the belly (grow with progress);
 *   - the steam plume, in three steps: a curl → two billows → a full plume with puffs breaking away.
 * paused: flame out, no steam, gauge holds · rest (tea break): off the heat, a small curl, gauge full
 * whistle: cap flipped open, a stream of steam puffs blooming into a cloud, lid lifted, notes. Every state is a
 * still that reads without motion; motion (CSS keyframes on transforms/opacity only) is added on top and is off
 * under reduced motion.
 */
import { useId, type CSSProperties } from 'react';
import { PAL } from '@/art';
import s from './Kettle.module.css';

export type KettleState = 'run' | 'paused' | 'whistle' | 'rest';

/** viewBox: room for the plume and the notes around the kettle. The burner's bottom edge is y = 282. */
export const KETTLE_VIEW = { x: -70, y: -40, w: 370, h: 340 } as const;
/** Burner centre x and bottom y in viewBox units (for placing the kettle on a surface). */
export const KETTLE_FOOT = { cx: 166, bottom: 282, halfWidth: 77 } as const;

const BODY = 'M88 232 C80 204 90 172 118 158 C136 149 194 149 212 158 C240 172 250 204 242 232 C239 242 230 247 218 247 H112 C100 247 91 242 88 232 Z';
const SPOUT = 'M100 205 C80 204 66 196 58 178 C54 168 51 158 49 149 L65 144 C67 156 71 167 77 175 C85 186 95 191 106 193 Z';
const WOOD = { base: '#C98B55', hi: '#E2AE74', shade: '#8A5534' };
const STEEL = { base: '#6E6272', hi: '#9A8FA0' };
const INK = '#3B2A20';

// ---------------------------------------------------------------- steam
type Lobe = [x: number, y: number, r: number];
/*
 * Steam is drawn like Chai's forms: one fused silhouette per billow, no outlines, a lit face offset to the
 * top-left and clipped to the silhouette, so the shade is a soft crescent inside the shape (never a rim).
 * Anchored at the spout tip (0,0).
 */
const NECK: Lobe[] = [[0, 0, 4.4], [-1, -4, 5.4], [-2.5, -8.5, 6.4], [-3.5, -13, 7.4], [-3.5, -18, 8.4], [-2.5, -23, 9.4], [-1.5, -28, 10.2]];
const BILLOW_1: Lobe[] = [[-4, -38, 11.5], [7, -43, 10], [-12, -48, 9.5], [1, -52, 12.5], [-6, -60, 9]];
const BILLOW_2: Lobe[] = [[5, -70, 11], [16, -80, 13.5], [0, -84, 15], [12, -96, 13], [-10, -94, 10.5], [3, -104, 11]];
const PUFFS: Lobe[] = [[-6, -124, 9], [6, -130, 7.5], [-1, -136, 6]];
const WISP: Lobe[] = [[1, -148, 4.5], [7, -152, 3.2]];

function Cloud({ id, lobes, className, style }: { id: string; lobes: Lobe[]; className?: string; style?: CSSProperties }) {
  return (
    <g className={className} style={style}>
      <clipPath id={id}>
        {lobes.map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} />
        ))}
      </clipPath>
      <g className={s.steamShade}>
        {lobes.map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} />
        ))}
      </g>
      <g className={s.steamLit} clipPath={`url(#${id})`}>
        {lobes.map(([x, y, r], i) => (
          <circle key={i} cx={x - 2.6} cy={y - 2.6} r={r * 0.97} />
        ))}
      </g>
    </g>
  );
}

/*
 * The whistle: steam leaves the spout as a quick stream of separate puffs along the spout's axis (each a little
 * bigger, with air between them — no solid cone), then blooms into a cloud. Motion streams the puffs outward.
 */
const AXIS: [number, number] = [-0.4, -0.917];
const JET_PUFFS: [dist: number, r: number][] = [[7, 4.6], [17, 5.8], [29, 7.2], [43, 8.8], [59, 10.6]];
const BLOOM_C: [number, number] = [AXIS[0] * 84 + 4, AXIS[1] * 84];
const BLOOM: Lobe[] = [
  [BLOOM_C[0] + 8, BLOOM_C[1] + 8, 16],
  [BLOOM_C[0] - 12, BLOOM_C[1] + 2, 18],
  [BLOOM_C[0] + 2, BLOOM_C[1] - 12, 21],
  [BLOOM_C[0] - 22, BLOOM_C[1] - 18, 15],
  [BLOOM_C[0] + 18, BLOOM_C[1] - 20, 14],
  [BLOOM_C[0] - 6, BLOOM_C[1] - 34, 16],
  [BLOOM_C[0] + 12, BLOOM_C[1] - 38, 11],
];
const BLOOM_PUFFS: Lobe[] = [[BLOOM_C[0] - 14, BLOOM_C[1] - 62, 9.5], [BLOOM_C[0] + 6, BLOOM_C[1] - 68, 7.5], [BLOOM_C[0] - 26, BLOOM_C[1] - 72, 5.5]];

function Jet({ id }: { id: string }) {
  return (
    <g className={s.jet}>
      {JET_PUFFS.map(([d, r], i) => (
        <g key={i} className={s.jetPuff} style={{ ['--i' as string]: i, ['--dx' as string]: `${AXIS[0] * 12}px`, ['--dy' as string]: `${AXIS[1] * 12}px` }}>
          <Cloud id={`${id}-p${i}`} lobes={[[AXIS[0] * d, AXIS[1] * d, r]]} />
        </g>
      ))}
      <Cloud id={`${id}-bloom`} lobes={BLOOM} className={s.bloom} />
      <Cloud id={`${id}-bloomp`} lobes={BLOOM_PUFFS} className={s.bloomPuffs} />
      <g className={s.speed} strokeLinecap="round">
        {[
          [20, -6, 15],
          [27, -27, 11],
          [-27, -8, 11],
        ].map(([x, y, len], i) => (
          <line key={i} x1={x} y1={y} x2={x + AXIS[0] * len} y2={y + AXIS[1] * len} />
        ))}
      </g>
    </g>
  );
}

// ---------------------------------------------------------------- gauge
/** Gauge: 240° sweep from lower-left (210°) clockwise to lower-right (−30°). */
const G = { x: 192, y: 201, r: 28 };
const A0 = (210 * Math.PI) / 180;
const SWEEP = (240 * Math.PI) / 180;
const at = (f: number, r: number) => [G.x + r * Math.cos(A0 - SWEEP * f), G.y - r * Math.sin(A0 - SWEEP * f)] as const;
const ARC_R = G.r - 8;
const FULL_ARC = (() => {
  const [x0, y0] = at(0, ARC_R);
  const [x1, y1] = at(1, ARC_R);
  return `M${x0} ${y0} A${ARC_R} ${ARC_R} 0 1 1 ${x1} ${y1}`;
})();
const NEEDLE_TIP = at(0, G.r - 6);

export interface KettleProps {
  /** 0..1 through the brew (elapsed ÷ planned, including added time). */
  progress: number;
  state: KettleState;
  /** Fraction of the plan where added time begins (planned − added) ÷ planned; 1 when nothing was added. */
  addedFrom?: number;
  /** Night lighting (dark theme): a soft lavender rim from the window. */
  night?: boolean;
  /** Width in CSS px (height follows the viewBox). */
  width: number;
  reduced?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function Kettle({ progress, state, addedFrom = 1, night = false, width, reduced = false, className, style }: KettleProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const whistle = state === 'whistle';
  const paused = state === 'paused';
  const rest = state === 'rest';
  const p = whistle || rest ? 1 : Math.min(1, Math.max(0, progress));
  const heat = paused || rest ? 0 : whistle ? 1 : 0.25 + 0.75 * p; // never zero while brewing
  const stage = rest ? 1 : p < 0.2 ? 1 : p < 0.6 ? 2 : 3;
  const steamOn = !whistle && !paused;
  const ext = Math.min(1, Math.max(0, addedFrom));
  const extended = ext < 0.999;
  const label = whistle
    ? 'The kettle is whistling'
    : rest
      ? 'The kettle is resting off the heat'
      : paused
        ? 'The kettle is paused; the flame is out'
        : `The kettle is ${Math.round(p * 100)}% of the way to the whistle`;

  return (
    <svg
      viewBox={`${KETTLE_VIEW.x} ${KETTLE_VIEW.y} ${KETTLE_VIEW.w} ${KETTLE_VIEW.h}`}
      width={width}
      height={(width * KETTLE_VIEW.h) / KETTLE_VIEW.w}
      className={[s.kettle, className].filter(Boolean).join(' ')}
      style={style}
      data-state={state}
      data-reduced={reduced || undefined}
      data-night={night || undefined}
      role="img"
      aria-label={label}
    >
      <defs>
        <clipPath id={`${uid}-b`}>
          <path d={BODY} />
        </clipPath>
        <radialGradient id={`${uid}-glow`} cx="50%" cy="100%" r="70%">
          <stop offset="0%" stopColor={PAL.honey} stopOpacity="0.95" />
          <stop offset="100%" stopColor={PAL.honey} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${uid}-flame`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={PAL.honey} stopOpacity="0.9" />
          <stop offset="100%" stopColor={PAL.persimmon} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* burner: the kettle stands on a trivet so the flames show beneath it */}
      <ellipse cx="166" cy="256" rx={80 * (0.6 + 0.4 * heat)} ry={20 * (0.6 + 0.4 * heat)} fill={`url(#${uid}-flame)`} opacity={heat * (night ? 1 : 0.8)} className={s.fade} />
      <path d="M98 264 H234 C240 264 243 268 243 272 V274 C243 279 239 282 234 282 H98 C93 282 89 279 89 274 V272 C89 268 92 264 98 264 Z" className={s.plate} />
      <rect x="98" y="264" width="136" height="4" rx="2" className={s.plateHi} />
      <path d="M112 264 V250 H120 V264 Z M212 264 V250 H220 V264 Z" className={s.trivet} />
      <g className={s.flames} opacity={heat > 0 ? 1 : 0}>
        {[128, 147, 166, 185, 204].map((x, i) => {
          const h = (4 + 9 * heat) * (i === 2 ? 1.2 : i % 2 ? 1 : 0.8);
          const w = 5.5;
          return (
            <g key={x} className={s.flame} style={{ ['--i' as string]: i }}>
              <path d={`M${x - w} 264 C${x - w} ${264 - h * 0.55} ${x - 1} ${264 - h * 0.8} ${x} ${264 - h} C${x + 1} ${264 - h * 0.8} ${x + w} ${264 - h * 0.55} ${x + w} 264 Z`} fill={PAL.persimmonHi} opacity={0.65 + 0.35 * heat} />
              <path d={`M${x - 2.6} 264 C${x - 2.6} ${264 - h * 0.35} ${x} ${264 - h * 0.6} ${x} ${264 - h * 0.6} C${x} ${264 - h * 0.6} ${x + 2.6} ${264 - h * 0.35} ${x + 2.6} 264 Z`} fill={PAL.honey} />
            </g>
          );
        })}
      </g>

      <g className={s.body}>
        {/* handle: wire bail from two lugs to a wooden grip */}
        <path d="M116 164 C108 132 116 102 134 92" stroke={STEEL.base} strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M214 164 C222 132 214 102 196 92" stroke={STEEL.base} strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M116 162 C110 134 116 108 130 96" stroke={STEEL.hi} strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.8" />
        <rect x="128" y="80" width="74" height="21" rx="10.5" fill={WOOD.shade} />
        <rect x="128" y="78" width="74" height="18" rx="9" fill={WOOD.base} />
        <rect x="136" y="81" width="46" height="4" rx="2" fill={WOOD.hi} opacity="0.9" />
        <rect x="112" y="156" width="12" height="14" rx="4" fill={PAL.persimmonShade} />
        <rect x="206" y="156" width="12" height="14" rx="4" fill={PAL.persimmonShade} />

        {/* spout (swan neck) */}
        <path d={SPOUT} fill={PAL.persimmonShade} />
        <path d="M98 199 C80 198 69 191 62 176 C59 168 57 160 55 152 L63 150 C65 159 68 167 73 174 C80 184 90 188 100 190 Z" fill={PAL.persimmon} />
        <path d="M60 156 C61 163 63 169 66 174" stroke={PAL.persimmonHi} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.9" />

        {/* body: base shade, lit face offset to the top-left, warm under-glow from the flame */}
        <path d={BODY} fill={PAL.persimmonShade} />
        <g clipPath={`url(#${uid}-b)`}>
          <path d={BODY} fill={PAL.persimmon} transform="translate(-10 -7)" />
          <ellipse cx="166" cy="266" rx="112" ry="52" fill={`url(#${uid}-glow)`} opacity={0.08 + 0.42 * heat} className={s.fade} />
          {night && <path d="M88 232 C80 204 90 172 118 158 C136 149 194 149 212 158" stroke="#C9B6F2" strokeWidth="5" fill="none" opacity="0.35" />}
        </g>
        <path d="M104 214 C101 194 110 176 128 166" stroke={PAL.persimmonHi} strokeWidth="7" strokeLinecap="round" fill="none" opacity="0.85" />
        <circle cx="137" cy="163" r="3.5" fill="#FFE2CF" opacity="0.9" />
        <path d="M104 238 C110 244 118 246 126 246 H206 C214 246 222 244 228 238 C226 246 220 250 210 250 H122 C112 250 106 246 104 238 Z" fill={PAL.persimmonShade} />
        <ellipse cx="165" cy="155" rx="44" ry="8" fill={PAL.persimmonShade} />

        {/* heat gauge: big enough to read at phone size */}
        <g className={s.gauge} data-extended={extended || undefined}>
          <circle cx={G.x} cy={G.y + 1.5} r={G.r + 4} fill={PAL.persimmonShade} />
          <circle cx={G.x} cy={G.y} r={G.r + 2} fill="#E9C9A8" />
          <circle cx={G.x} cy={G.y} r={G.r} fill="#FFF6EA" />
          <path d={FULL_ARC} pathLength={1} className={s.track} />
          <path d={FULL_ARC} pathLength={1} className={s.fill} style={{ strokeDasharray: `${Math.min(p, ext)} 2` }} />
          {extended && <path d={FULL_ARC} pathLength={1} className={s.added} style={{ strokeDasharray: `0 ${ext} ${1 - ext} 2` }} />}
          <g className={s.needle} style={{ transform: `rotate(${(240 * p).toFixed(2)}deg)`, transformOrigin: `${G.x}px ${G.y}px` }}>
            <line x1={G.x} y1={G.y} x2={NEEDLE_TIP[0]} y2={NEEDLE_TIP[1]} stroke={INK} strokeWidth="4.2" strokeLinecap="round" />
          </g>
          <circle cx={G.x} cy={G.y} r="4.4" fill={INK} />
          <circle cx={G.x - 1.1} cy={G.y - 1.1} r="1.4" fill="#fff" opacity="0.55" />
        </g>

        {/* lid + yuzu knob (lifts and rattles when whistling) */}
        <g className={s.lid}>
          <path d="M124 156 C128 138 146 131 165 131 C184 131 202 138 206 156 Z" fill={PAL.persimmonShade} />
          <path d="M124 156 C128 138 146 131 165 131 C184 131 202 138 206 156 Z" fill={PAL.persimmon} transform="translate(-4 -3)" />
          <path d="M140 146 C144 139 151 136 158 135" stroke={PAL.persimmonHi} strokeWidth="3" strokeLinecap="round" fill="none" />
          <rect x="120" y="152" width="90" height="7" rx="3.5" fill={PAL.persimmonShade} />
          <path d="M166 105 C172 96 184 94 190 99 C184 106 174 108 166 105 Z" fill={PAL.leaf} />
          <path d="M166 105 C174 108 184 106 190 99 C182 103 174 104 166 105 Z" fill={PAL.leafShade} />
          <circle cx="165" cy="118" r="12.5" fill={PAL.yuzuShade} />
          <circle cx="163" cy="116" r="10.5" fill={PAL.yuzu} />
          <circle cx="159.5" cy="112" r="3" fill={PAL.yuzuHi} />
        </g>

        {/* whistle cap on the spout tip (hinged; flips open when whistling) */}
        <g className={s.cap}>
          <path d="M44 148 C42 140 48 134 56 134 C62 134 67 138 67 144 L66 147 Z" fill={PAL.persimmonShade} />
          <rect x="60" y="126" width="4" height="12" rx="2" fill={STEEL.base} transform="rotate(20 62 132)" />
        </g>
        <ellipse cx="56" cy="147" rx="7" ry="3.5" fill="#6B2E17" transform="rotate(-20 56 147)" className={s.mouth} />
      </g>

      {/* steam: three stepped sizes while brewing; none while paused; the stream at the whistle */}
      <g transform="translate(56 142)" className={s.plume} data-on={steamOn || undefined}>
        <Cloud id={`${uid}-n`} lobes={NECK} className={s.sway0} />
        <g className={s.b1} data-small={stage === 1 || undefined}>
          <Cloud id={`${uid}-b1`} lobes={BILLOW_1} className={s.sway1} />
        </g>
        <Cloud id={`${uid}-b2`} lobes={BILLOW_2} className={s.sway2} style={{ opacity: stage >= 2 ? 1 : 0 }} />
        <Cloud id={`${uid}-pf`} lobes={PUFFS} className={s.sway3} style={{ opacity: stage >= 3 ? 1 : 0 }} />
        <Cloud id={`${uid}-w`} lobes={WISP} className={s.sway3} style={{ opacity: stage >= 3 ? (night ? 1 : 0.8) : 0 }} />
      </g>
      {whistle && (
        <g transform="translate(55 143)">
          <Jet id={`${uid}-jet`} />
        </g>
      )}
      {whistle && (
        <g className={s.notes}>
          {[
            [206, 60, -8],
            [238, 88, 10],
          ].map(([x, y, r], i) => (
            <g key={i} transform={`translate(${x} ${y})`}>
              <g className={s.note} style={{ ['--i' as string]: i }}>
                <g transform={`rotate(${r})`}>
                  <ellipse cx="0" cy="16" rx="7" ry="5.4" />
                  <rect x="5" y="-8" width="3" height="24" rx="1.5" />
                  <path d="M8 -8 q10 4 8 13 q-3 -7 -8 -7 Z" />
                </g>
              </g>
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}

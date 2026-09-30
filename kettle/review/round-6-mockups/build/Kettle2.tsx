/**
 * Round-6 MOCKUP v2 (not wired into the app): the kettle that is the timer.
 *
 * Character: a squat enamel stovetop kettle in the brand persimmon, a swan-neck spout with a hinged whistle cap,
 * a wire bail handle with a wooden grip (Chai's wood tones) and the yuzu knob from the logo. Drawn the way Chai
 * is drawn: flat forms, no outlines, light from the top-left, one shade + one highlight per form.
 *
 * Progress is NOT a fill (no "water level", never a greyed-out kettle). It is carried by:
 *   - the heat gauge on the belly: a needle sweeping a warm arc (the exact fraction; digits give the exact time)
 *   - the stove flame (grows), a soft warm under-glow on the lower belly, and the steam plume (3 stepped sizes)
 * paused: flame off, gauge holds, only a faint wisp · extended: gauge gains a "+5" segment, needle eases back
 * whistle: cap flipped open, a jet plume with notes, lid lifted; static-readable without any motion.
 *
 * `t` (seconds) only adds gentle sway/flicker for the motion prototype; with reduced motion it is ignored.
 */
import { PAL } from '@/art';

/** rest = the tea break: off the flame, gauge full, a small curl of steam as it cools */
export type KettleState = 'run' | 'paused' | 'whistle' | 'rest';

const BODY = 'M88 232 C80 204 90 172 118 158 C136 149 194 149 212 158 C240 172 250 204 242 232 C239 242 230 247 218 247 H112 C100 247 91 242 88 232 Z';
const SPOUT = 'M100 205 C80 204 66 196 58 178 C54 168 51 158 49 149 L65 144 C67 156 71 167 77 175 C85 186 95 191 106 193 Z';
const WOOD = { base: '#C98B55', hi: '#E2AE74', shade: '#8A5534' };
const STEEL = { base: '#6E6272', hi: '#9A8FA0' };

type Lobe = [x: number, y: number, r: number];

/*
 * Steam, drawn like Chai's forms: one fused silhouette per billow, no outlines, a lit face offset to the top-left
 * and clipped to the silhouette, so the shade is a soft crescent on the lower-right *inside* the shape (never a rim).
 * The rising plume is built from a thin neck, then billows that grow and thin out with height; the top one breaks
 * away. Anchored at the spout tip (0,0).
 */
const NECK: Lobe[] = [[0, 0, 4.4], [-1, -4, 5.4], [-2.5, -8.5, 6.4], [-3.5, -13, 7.4], [-3.5, -18, 8.4], [-2.5, -23, 9.4], [-1.5, -28, 10.2]];
const BILLOW_1: Lobe[] = [[-4, -38, 11.5], [7, -43, 10], [-12, -48, 9.5], [1, -52, 12.5], [-6, -60, 9]];
const BILLOW_2: Lobe[] = [[5, -70, 11], [16, -80, 13.5], [0, -84, 15], [12, -96, 13], [-10, -94, 10.5], [3, -104, 11]];
const PUFFS: Lobe[] = [[-6, -124, 9], [6, -130, 7.5], [-1, -136, 6]];
const WISP: Lobe[] = [[1, -148, 4.5], [7, -152, 3.2]];

function Cloud({ id, lobes, dark, dx = 0, opacity = 1 }: { id: string; lobes: Lobe[]; dark: boolean; dx?: number; opacity?: number }) {
  const main = dark ? '#FFF3E8' : '#FFFFFF';
  const shade = dark ? '#CDBFD2' : '#E4DAE6';
  const circles = (off: number, key: string) => lobes.map(([x, y, r], i) => <circle key={key + i} cx={x + dx + off} cy={y + off} r={r} />);
  return (
    <g opacity={opacity}>
      <clipPath id={id}>{circles(0, 'c')}</clipPath>
      <g fill={shade}>{circles(0, 's')}</g>
      <g fill={main} clipPath={`url(#${id})`}>{lobes.map(([x, y, r], i) => <circle key={'m' + i} cx={x + dx - 2.6} cy={y - 2.6} r={r * 0.97} />)}</g>
    </g>
  );
}

/** stage 1 = neck + first billow, 2 = + second billow, 3 = full plume with puffs breaking away */
function Plume({ id, stage, dark, t = 0, live = false }: { id: string; stage: 1 | 2 | 3; dark: boolean; t?: number; live?: boolean }) {
  const sw = (h: number, ph: number) => (live ? Math.sin(t * 1.5 + ph) * (1 + h * 5) : 0);
  const grow = stage === 1 ? 0.8 : 1;
  return (
    <g>
      <Cloud id={`${id}-n`} lobes={NECK} dark={dark} />
      {stage >= 1 && (
        <g transform={`scale(${grow})`}>
          <Cloud id={`${id}-b1`} lobes={BILLOW_1} dark={dark} dx={sw(0.3, 0)} />
        </g>
      )}
      {stage >= 2 && <Cloud id={`${id}-b2`} lobes={BILLOW_2} dark={dark} dx={sw(0.6, 0.9)} opacity={0.96} />}
      {stage >= 3 && <Cloud id={`${id}-p`} lobes={PUFFS} dark={dark} dx={sw(1, 1.7)} />}
      {stage >= 3 && <Cloud id={`${id}-w`} lobes={WISP} dark={dark} dx={sw(1.3, 2.3)} opacity={dark ? 1 : 0.8} />}
    </g>
  );
}

/*
 * The whistle: a straight, fast jet leaving the spout along its axis (a fused wedge, speed lines beside it),
 * blooming into a big cloud. Unmistakable as a still: nothing about it depends on motion.
 */
function Jet({ id, dark, t = 0, live = false }: { id: string; dark: boolean; t?: number; live?: boolean }) {
  const d = [-0.52, -0.855];
  const core: Lobe[] = [];
  for (let i = 0; i <= 10; i++) {
    const s = i * 5.5;
    core.push([d[0] * s + (live ? Math.sin(t * 40 + i) * 0.6 : 0), d[1] * s, 4.6 + i * 1.25]);
  }
  const cx = d[0] * 78;
  const cy = d[1] * 78;
  const bloom: Lobe[] = [[cx + 8, cy + 8, 17], [cx - 12, cy + 2, 19], [cx + 2, cy - 12, 22], [cx - 22, cy - 18, 16], [cx + 18, cy - 20, 15], [cx - 6, cy - 34, 17], [cx + 12, cy - 38, 12]];
  const puffs: Lobe[] = [[cx - 14, cy - 62, 10], [cx + 6, cy - 68, 8], [cx - 26, cy - 72, 6]];
  const line = dark ? 'rgba(255,241,228,0.7)' : 'rgba(120,96,104,0.42)';
  const drift = live ? (t * 22) % 10 : 0;
  return (
    <g>
      <Cloud id={`${id}-j`} lobes={core} dark={dark} />
      <Cloud id={`${id}-jb`} lobes={bloom} dark={dark} dx={live ? Math.sin(t * 1.4) * 3 : 0} />
      <Cloud id={`${id}-jp`} lobes={puffs} dark={dark} dx={live ? Math.sin(t * 1.2 + 1) * 5 : 0} />
      <g stroke={line} strokeWidth="3.4" strokeLinecap="round">
        {[
          [20, -6, 16],
          [26, -26, 12],
          [-26, -8, 12],
        ].map(([x, y, len], i) => (
          <line key={i} x1={x + d[0] * drift} y1={y + d[1] * drift} x2={x + d[0] * (len + drift)} y2={y + d[1] * (len + drift)} />
        ))}
      </g>
    </g>
  );
}

export function Kettle2({
  progress,
  state = 'run',
  extended = false,
  night = false,
  size = 300,
  t = 0,
  reduced = true,
  ground = true,
}: {
  progress: number;
  state?: KettleState;
  extended?: boolean;
  night?: boolean;
  size?: number;
  t?: number;
  reduced?: boolean;
  /** draw its own ground shadow (off when a scene draws shared contact shadows) */
  ground?: boolean;
}) {
  const whistle = state === 'whistle';
  const paused = state === 'paused';
  const rest = state === 'rest';
  const p = whistle || rest ? 1 : Math.min(1, Math.max(0, progress));
  const heat = paused || rest ? 0 : whistle ? 1 : 0.25 + 0.75 * p; // flame + glow (never zero while brewing)
  const stage = rest ? 1 : p < 0.2 ? 1 : p < 0.6 ? 2 : 3; // steam steps: a small curl from the start, fuller later
  const live = !reduced;
  const sway = live ? Math.sin(t * 1.3) * 3 : 0;
  const flick = live ? 1 + Math.sin(t * 9) * 0.06 + Math.sin(t * 13.7) * 0.04 : 1;
  const id = `k2${Math.round(p * 1000)}${state}${night ? 'n' : 'd'}${extended ? 'x' : ''}`;
  // gauge geometry: 240° sweep from 210° (lower-left) clockwise to -30° (lower-right)
  const G = { x: 196, y: 207, r: 17 };
  const a0 = (210 * Math.PI) / 180;
  const sweep = (240 * Math.PI) / 180;
  const at = (f: number, r = G.r - 5) => [G.x + r * Math.cos(a0 - sweep * f), G.y - r * Math.sin(a0 - sweep * f)];
  const arc = (f0: number, f1: number, r = G.r - 5) => {
    const [x0, y0] = at(f0, r);
    const [x1, y1] = at(f1, r);
    return `M${x0} ${y0} A${r} ${r} 0 ${sweep * (f1 - f0) > Math.PI ? 1 : 0} 1 ${x1} ${y1}`;
  };
  const extFrom = extended ? 25 / 30 : 1;
  const [nx, ny] = at(p, G.r - 4);
  const lidLift = whistle ? (live ? -6 - Math.abs(Math.sin(t * 24)) * 4 : -6) : 0;
  const lidTilt = whistle ? (live ? -8 + Math.sin(t * 31) * 4 : -8) : 0;

  return (
    <svg viewBox="-70 -40 370 340" width={size} height={(size * 340) / 370} role="img" aria-label={whistle ? 'The kettle is whistling' : rest ? 'The kettle is resting (tea time)' : paused ? 'The kettle is resting (paused)' : `The kettle is ${Math.round(p * 100)}% of the way to the whistle`}>
      <defs>
        <clipPath id={`${id}-b`}>
          <path d={BODY} />
        </clipPath>
        <radialGradient id={`${id}-glow`} cx="50%" cy="100%" r="70%">
          <stop offset="0%" stopColor={PAL.honey} stopOpacity="0.95" />
          <stop offset="100%" stopColor={PAL.honey} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-flame`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={PAL.honey} stopOpacity="0.9" />
          <stop offset="100%" stopColor={PAL.persimmon} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* --- stove: a small cast-iron burner; the kettle rests on a trivet so the flames show beneath it --- */}
      {ground && <ellipse cx="166" cy="283" rx="96" ry="8" fill={night ? 'rgba(10,6,14,0.5)' : 'rgba(59,42,32,0.18)'} />}
      <ellipse cx="166" cy="256" rx={80 * (0.6 + 0.4 * heat)} ry={20 * (0.6 + 0.4 * heat)} fill={`url(#${id}-flame)`} opacity={heat * (night ? 1 : 0.8)} />
      <path d="M98 264 H234 C240 264 243 268 243 272 V274 C243 279 239 282 234 282 H98 C93 282 89 279 89 274 V272 C89 268 92 264 98 264 Z" fill={night ? '#2B2230' : '#4A3D4E'} />
      <rect x="98" y="264" width="136" height="4" rx="2" fill={night ? '#3D3244' : '#655569'} />
      <path d="M112 264 V250 H120 V264 Z M212 264 V250 H220 V264 Z" fill={night ? '#3D3244' : '#584A5C'} />
      {/* flames: grow with heat; off while paused */}
      {heat > 0 &&
        [128, 147, 166, 185, 204].map((x, i) => {
          const h = (4 + 9 * heat) * (i === 2 ? 1.2 : i % 2 ? 1 : 0.8) * (live ? flick * (1 + Math.sin(t * 7 + i * 2) * 0.05) : 1);
          const w = 5.5;
          return (
            <g key={x}>
              <path d={`M${x - w} 264 C${x - w} ${264 - h * 0.55} ${x - 1} ${264 - h * 0.8} ${x} ${264 - h} C${x + 1} ${264 - h * 0.8} ${x + w} ${264 - h * 0.55} ${x + w} 264 Z`} fill={PAL.persimmonHi} opacity={0.65 + 0.35 * heat} />
              <path d={`M${x - 2.6} 264 C${x - 2.6} ${264 - h * 0.35} ${x} ${264 - h * 0.6} ${x} ${264 - h * 0.6} C${x} ${264 - h * 0.6} ${x + 2.6} ${264 - h * 0.35} ${x + 2.6} 264 Z`} fill={PAL.honey} />
            </g>
          );
        })}

      <g transform={whistle && live ? `rotate(${Math.sin(t * 20) * 1.2} 166 250)` : undefined}>
        {/* --- handle: wire bail from two lugs to a wooden grip --- */}
        <path d="M116 164 C108 132 116 102 134 92" stroke={STEEL.base} strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M214 164 C222 132 214 102 196 92" stroke={STEEL.base} strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M116 162 C110 134 116 108 130 96" stroke={STEEL.hi} strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.8" />
        <rect x="128" y="80" width="74" height="21" rx="10.5" fill={WOOD.shade} />
        <rect x="128" y="78" width="74" height="18" rx="9" fill={WOOD.base} />
        <rect x="136" y="81" width="46" height="4" rx="2" fill={WOOD.hi} opacity="0.9" />
        <rect x="112" y="156" width="12" height="14" rx="4" fill={PAL.persimmonShade} />
        <rect x="206" y="156" width="12" height="14" rx="4" fill={PAL.persimmonShade} />

        {/* --- spout (swan neck) --- */}
        <path d={SPOUT} fill={PAL.persimmonShade} />
        <path d="M98 199 C80 198 69 191 62 176 C59 168 57 160 55 152 L63 150 C65 159 68 167 73 174 C80 184 90 188 100 190 Z" fill={PAL.persimmon} />
        <path d="M60 156 C61 163 63 169 66 174" stroke={PAL.persimmonHi} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.9" />

        {/* --- body: base shade, lit face offset to the top-left, warm under-glow from the flame --- */}
        <path d={BODY} fill={PAL.persimmonShade} />
        <g clipPath={`url(#${id}-b)`}>
          <path d={BODY} fill={PAL.persimmon} transform="translate(-10 -7)" />
          <ellipse cx="166" cy="266" rx="112" ry="52" fill={`url(#${id}-glow)`} opacity={0.08 + 0.42 * heat} />
          {night && <path d="M88 232 C80 204 90 172 118 158 C136 149 194 149 212 158" stroke="#C9B6F2" strokeWidth="5" fill="none" opacity="0.35" />}
        </g>
        <path d="M104 214 C101 194 110 176 128 166" stroke={PAL.persimmonHi} strokeWidth="7" strokeLinecap="round" fill="none" opacity="0.85" />
        <circle cx="137" cy="163" r="3.5" fill="#FFE2CF" opacity="0.9" />
        {/* foot ring */}
        <path d="M104 238 C110 244 118 246 126 246 H206 C214 246 222 244 228 238 C226 246 220 250 210 250 H122 C112 250 106 246 104 238 Z" fill={PAL.persimmonShade} />
        {/* lid seat */}
        <ellipse cx="165" cy="155" rx="44" ry="8" fill={PAL.persimmonShade} />

        {/* --- heat gauge --- */}
        <circle cx={G.x} cy={G.y} r={G.r + 3} fill={PAL.persimmonShade} />
        <circle cx={G.x} cy={G.y} r={G.r} fill="#FFF4E3" />
        <path d={arc(0, 1)} stroke="#EBD7BA" strokeWidth="4" fill="none" strokeLinecap="round" />
        {p > 0.01 && <path d={arc(0, Math.min(p, extFrom))} stroke={PAL.persimmon} strokeWidth="4" fill="none" strokeLinecap="round" />}
        {extended && <path d={arc(extFrom, 1)} stroke={PAL.honey} strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.95" />}
        <line x1={G.x} y1={G.y} x2={nx} y2={ny} stroke="#3B2A20" strokeWidth="2.6" strokeLinecap="round" />
        <circle cx={G.x} cy={G.y} r="2.6" fill="#3B2A20" />

        {/* --- lid + yuzu knob (lifts and rattles when whistling) --- */}
        <g transform={`translate(0 ${lidLift}) rotate(${lidTilt} 165 150)`}>
          <path d="M124 156 C128 138 146 131 165 131 C184 131 202 138 206 156 Z" fill={PAL.persimmonShade} />
          <path d="M124 156 C128 138 146 131 165 131 C184 131 202 138 206 156 Z" fill={PAL.persimmon} transform="translate(-4 -3)" clipPath="none" />
          <path d="M140 146 C144 139 151 136 158 135" stroke={PAL.persimmonHi} strokeWidth="3" strokeLinecap="round" fill="none" />
          <rect x="120" y="152" width="90" height="7" rx="3.5" fill={PAL.persimmonShade} />
          <path d="M166 105 C172 96 184 94 190 99 C184 106 174 108 166 105 Z" fill={PAL.leaf} />
          <path d="M166 105 C174 108 184 106 190 99 C182 103 174 104 166 105 Z" fill={PAL.leafShade} />
          <circle cx="165" cy="118" r="12.5" fill={PAL.yuzuShade} />
          <circle cx="163" cy="116" r="10.5" fill={PAL.yuzu} />
          <circle cx="159.5" cy="112" r="3" fill={PAL.yuzuHi} />
        </g>

        {/* --- whistle cap on the spout tip (hinged; flips open when whistling) --- */}
        <g transform={whistle ? 'rotate(-75 64 141)' : undefined}>
          <path d="M44 148 C42 140 48 134 56 134 C62 134 67 138 67 144 L66 147 Z" fill={PAL.persimmonShade} />
          <rect x="60" y="126" width="4" height="12" rx="2" fill={STEEL.base} transform="rotate(20 62 132)" />
        </g>
        {whistle && <ellipse cx="56" cy="147" rx="7" ry="3.5" fill="#6B2E17" transform="rotate(-20 56 147)" />}
      </g>

      {/* --- steam: stepped sizes while brewing, none while paused (flame off), the jet at the whistle --- */}
      {!whistle && !paused && (
        <g transform="translate(56 142)">
          <Plume id={`${id}-pl`} stage={stage as 1 | 2 | 3} dark={night} t={t} live={live} />
        </g>
      )}
      {whistle && (
        <g transform={`translate(55 143) ${live ? `scale(${Math.min(1, 0.3 + t * 1.6)})` : ''}`}>
          <Jet id={`${id}-jt`} dark={night} t={t} live={live} />
        </g>
      )}
      {whistle && (
        <g fill={PAL.honeyShade}>
          {[
            [206, 60, -8],
            [238, 88, 10],
          ].map(([x, y, r], i) => (
            <g key={i} transform={`translate(${x} ${live ? y - ((t * 30 + i * 12) % 36) : y}) rotate(${r})`}>
              <ellipse cx="0" cy="16" rx="7" ry="5.4" />
              <rect x="5" y="-8" width="3" height="24" rx="1.5" />
              <path d="M8 -8 q10 4 8 13 q-3 -7 -8 -7 Z" />
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}

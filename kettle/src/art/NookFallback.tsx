/**
 * Static nook illustration — shown while the 3D room loads, and instead of it
 * when motion is reduced, 3D is off or WebGL is unavailable.
 *
 * It is the same room as the three.js diorama (src/scene/engine/*): a cutaway
 * box with a sage wainscot, plank floor, arched window, iron stove + persimmon
 * kettle, floor lamp, rug and round low table, at the 3D camera's resting angle
 * (see NookFallbackLook.ts). `time` picks the light (window sky, wall tones,
 * lamp glow); `weather` the window; `steam` the kettle; `items` the unlocked
 * cozy things. Transparent by default around the room so it floats on the
 * host's backdrop exactly like the canvas; `fit="meet"` keeps it all in view.
 * OWNER: art area.
 */
import type { ReactNode } from 'react';
import { PAL } from './palette';
import { ArtSvg, Shaded, star, artStyles as s, useArtId, useLive } from './kit';
import { ChaiArt, type MascotPose } from './Mascot';
import { K, LOOKS, M_BACK, M_FLOOR, M_LEFT, R, VIEW, box, planeX, planeY, planeZ, poly, pt, px, type NookLook, type NookTime } from './NookFallbackLook';

export type { NookTime } from './NookFallbackLook';
export type NookWeather = 'clear' | 'rain' | 'snow';

export interface NookFallbackProps {
  weather?: NookWeather;
  /** Time of day: sky outside, wall light, lamp glow. Default 'night'. */
  time?: NookTime;
  /** 0..1 — how much steam the kettle is making (e.g. focus progress). */
  steam?: number;
  /** Unlocked item ids (see ITEMS). Unknown ids are ignored. */
  items?: readonly string[];
  /** Chai's pose, or null to leave the cushion empty. */
  chai?: MascotPose | null;
  animate?: boolean;
  className?: string;
  title?: string;
  /** CSS width/height (default 100% × 100%). */
  width?: number | string;
  height?: number | string;
  /** SVG preserveAspectRatio: 'meet' (default) keeps the whole room in view; 'slice' fills the box. */
  fit?: 'slice' | 'meet';
  /** Paint the soft time-of-day backdrop behind the room (default true). Pass false to float it on the host's background. */
  backdrop?: boolean;
}

// 3D palette (src/scene/engine/palette.ts)
const W = {
  cream: '#FFF1DE',
  woodHi: '#E2AE74',
  wood: '#C98B55',
  woodMid: '#B07443',
  woodDeep: '#8A5534',
  woodDark: '#6B3F26',
  iron: '#4A3F52',
  ironHi: '#5C506A',
  ironDeep: '#382F40',
  brass: '#E0A83E',
  espresso: '#4A3226',
  terracotta: '#D9774E',
  sage: '#9DBE8C',
  sageDeep: '#86AA76',
  sageHi: '#B5D1A6',
} as const;

const TABLE = { x: 0.45, z: 0.55, r: 0.79, h: 0.61 };
const LAMP = { x: -2.62, z: -1.92 };
const STOVE = { x: -2.6, z: 0.28 };
const CHAI = { x: -0.95, z: 1.15 };
const WIN = { u0: -16, u1: 60, v0: -50, v1: -136, spring: -98, r: 38 };

// ---- static room shell (module scope: computed once)
const SLAB = box(R.x0 - R.wall, R.x1 + 0.12, -0.41, -0.05, R.zB - R.wall, R.zF + 0.12);
const WALL_TOP = poly([
  [R.x0 - R.wall, R.h, R.zF],
  [R.x0 - R.wall, R.h, R.zB - R.wall],
  [R.x1, R.h, R.zB - R.wall],
  [R.x1, R.h, R.zB],
  [R.x0, R.h, R.zB],
  [R.x0, R.h, R.zF],
]);
const BACK_CAP = poly([
  [R.x1, R.h, R.zB],
  [R.x1, R.h, R.zB - R.wall],
  [R.x1, -0.05, R.zB - R.wall],
  [R.x1, -0.05, R.zB],
]);
const LEFT_CAP = poly([
  [R.x0 - R.wall, R.h, R.zF],
  [R.x0, R.h, R.zF],
  [R.x0, -0.05, R.zF],
  [R.x0 - R.wall, -0.05, R.zF],
]);
/** Interior (floor + both walls) — clip for light pools and the night veil. */
const INTERIOR = poly([
  [R.x0, 0, R.zF],
  [R.x0, R.h, R.zF],
  [R.x0, R.h, R.zB],
  [R.x1, R.h, R.zB],
  [R.x1, 0, R.zB],
  [R.x1, 0, R.zF],
]);
const PLANKS = (() => {
  const n = 11;
  const pw = ((R.x1 - R.x0) * K) / n;
  const len = (R.zF - R.zB) * K;
  const out: { x: number; y: number; w: number; h: number; t: number }[] = [];
  for (let i = 0; i < n; i++) {
    const x = R.x0 * K + pw * i;
    const split = 0.3 + ((i * 0.37) % 0.45);
    const a = len * split;
    out.push({ x: x + 0.7, y: R.zB * K + 0.7, w: pw - 1.4, h: a - 1.4, t: i % 4 });
    out.push({ x: x + 0.7, y: R.zB * K + a + 0.7, w: pw - 1.4, h: len - a - 1.4, t: (i + 2) % 4 });
  }
  return out;
})();
const GROOVES_BACK = Array.from({ length: 10 }, (_, i) => R.x0 * K + 22 + i * 24.8);
const GROOVES_LEFT = Array.from({ length: 8 }, (_, i) => -R.zF * K + 22 + i * 24.8);
const ARCH = `M${WIN.u0} ${WIN.v0} V${WIN.spring} A${WIN.r} ${WIN.r} 0 0 1 ${WIN.u1} ${WIN.spring} V${WIN.v0} Z`;
const ARCH_FRAME = `M${WIN.u0 - 5} ${WIN.v0 + 4} V${WIN.spring} A${WIN.r + 5} ${WIN.r + 5} 0 0 1 ${WIN.u1 + 5} ${WIN.spring} V${WIN.v0 + 4} Z`;
const SILL = box(-0.72, 1.82, 1.1, 1.2, R.zB, R.zB + 0.4);
const STOVE_PARTS = {
  plinth: box(STOVE.x - 0.45, STOVE.x + 0.45, 0.2, 0.3, STOVE.z - 0.54, STOVE.z + 0.54),
  body: box(STOVE.x - 0.41, STOVE.x + 0.41, 0.3, 1.12, STOVE.z - 0.5, STOVE.z + 0.5),
  plate: box(STOVE.x - 0.47, STOVE.x + 0.47, 1.12, 1.21, STOVE.z - 0.56, STOVE.z + 0.56),
  legs: [
    box(STOVE.x + 0.24, STOVE.x + 0.36, 0, 0.2, STOVE.z + 0.32, STOVE.z + 0.44),
    box(STOVE.x + 0.24, STOVE.x + 0.36, 0, 0.2, STOVE.z - 0.44, STOVE.z - 0.32),
    box(STOVE.x - 0.36, STOVE.x - 0.24, 0, 0.2, STOVE.z + 0.32, STOVE.z + 0.44),
  ],
  pipe: (() => {
    const [a, b] = px(STOVE.x - 0.3, 1.21, STOVE.z - 0.36);
    const [, c] = px(STOVE.x - 0.3, 3.05, STOVE.z - 0.36);
    const [d, e] = px(R.x0, 3.23, STOVE.z - 0.36);
    return { d: `M${a} ${b} V${c} Q${a} ${e + 2} ${d} ${e}`, x: a, base: b, top: c, wall: [d, e] as const };
  })(),
};

// ---- helpers

function Sprite({ at, s: k = 1, children }: { at: readonly [number, number, number]; s?: number; children: ReactNode }) {
  const [x, y] = px(at[0], at[1], at[2]);
  return <g transform={`translate(${x} ${y})${k !== 1 ? ` scale(${k})` : ''}`}>{children}</g>;
}

function Box({ b, top, side, front }: { b: ReturnType<typeof box>; top: string; side: string; front: string }) {
  return (
    <>
      <path d={b.top} fill={top} />
      <path d={b.side} fill={side} />
      <path d={b.front} fill={front} />
    </>
  );
}

/** A disc lying flat at height y (e.g. rug, table top), in world units. */
function Disc({ x, z, y = 0, rx, rz = rx, fill, opacity }: { x: number; z: number; y?: number; rx: number; rz?: number; fill: string; opacity?: number }) {
  return <ellipse transform={planeY(y)} cx={x * K} cy={z * K} rx={rx * K} ry={rz * K} fill={fill} opacity={opacity} />;
}

// ---- component

export function NookFallback({
  weather = 'clear',
  time = 'night',
  steam = 0.6,
  items = [],
  chai = 'focus',
  animate = true,
  className,
  title = 'Your cozy nook',
  width = '100%',
  height = '100%',
  fit = 'meet',
  backdrop = true,
}: NookFallbackProps) {
  const id = useArtId();
  const live = useLive(animate);
  const L = LOOKS[time] ?? LOOKS.night;
  const has = (k: string) => items.includes(k);
  const st = Math.max(0, Math.min(1, steam));
  const lampOn = L.lamp;
  const kotatsu = has('kotatsu');

  const [lx, ly] = px(LAMP.x, 2.42, LAMP.z);

  return (
    <ArtSvg
      viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`}
      width={width}
      height={height}
      preserveAspectRatio={`xMidYMid ${fit}`}
      live={live}
      className={className}
      title={title}
      style={{ display: 'block', overflow: 'hidden' }}
      data-art="nook-fallback"
    >
      <defs>
        <radialGradient id={`${id}-pool`}>
          <stop offset="0" stopColor="#FFC77A" stopOpacity="0.95" />
          <stop offset="0.5" stopColor="#FFB45E" stopOpacity="0.4" />
          <stop offset="1" stopColor="#FFB45E" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-fire`}>
          <stop offset="0" stopColor="#FF9A4C" stopOpacity="0.8" />
          <stop offset="1" stopColor="#FF7A2A" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-sky`} gradientUnits="userSpaceOnUse" x1="0" y1={WIN.v1} x2="0" y2={WIN.v0 - 6}>
          <stop offset="0" stopColor={L.skyTop} />
          <stop offset="0.55" stopColor={L.skyMid} />
          <stop offset="1" stopColor={L.skyBottom} />
        </linearGradient>
        <clipPath id={`${id}-in`}>
          <path d={INTERIOR} />
        </clipPath>
        {backdrop && (
          <radialGradient id={`${id}-bg`} gradientUnits="userSpaceOnUse" cx="0" cy="-80" r="300">
            <stop offset="0" stopColor={L.bgInner} />
            <stop offset="1" stopColor={L.bgOuter} />
          </radialGradient>
        )}
      </defs>

      {backdrop && <rect x={VIEW.x - 2000} y={VIEW.y - 2000} width={VIEW.w + 4000} height={VIEW.h + 4000} fill={`url(#${id}-bg)`} />}

      {/* ---------- shell: slab, floor, walls ---------- */}
      <path d={SLAB.top} fill={L.slab} />
      <path d={SLAB.side} fill={L.slabSide} />
      <path d={SLAB.front} fill={L.slab} />
      <g transform={M_FLOOR}>
        <rect x={R.x0 * K} y={R.zB * K} width={(R.x1 - R.x0) * K} height={(R.zF - R.zB) * K} fill={L.seam} />
        {PLANKS.map((p, i) => (
          <rect key={i} x={p.x} y={p.y} width={p.w} height={p.h} rx="1.2" fill={L.planks[p.t]} />
        ))}
        {/* daylight through the window */}
        <path d="M2 -98 H80 L104 -6 H26 Z" fill={L.winColor} opacity={L.win} />
      </g>

      <g transform={M_LEFT}>
        <rect x={-R.zF * K} y={-R.h * K} width={(R.zF - R.zB) * K} height={R.h * K} fill={L.wallLeft} />
        <WallTrim look={L} from={-R.zF * K} to={-R.zB * K} grooves={GROOVES_LEFT} />
      </g>
      <g transform={M_BACK}>
        <rect x={R.x0 * K} y={-R.h * K} width={(R.x1 - R.x0) * K} height={R.h * K} fill={L.wallBack} />
        <WallTrim look={L} from={R.x0 * K} to={R.x1 * K} grooves={GROOVES_BACK} />
      </g>
      <path d={WALL_TOP} fill={L.wallTop} />
      <path d={BACK_CAP} fill={L.wallEdge} />
      <path d={LEFT_CAP} fill={L.wallEdge} />

      {/* lamp light pools on walls + floor */}
      {lampOn > 0.05 && (
        <g clipPath={`url(#${id}-in)`} opacity={lampOn * 0.8}>
          <circle transform={M_BACK} cx={(LAMP.x + 0.55) * K} cy={-2.5 * K} r="84" fill={`url(#${id}-pool)`} />
          <circle transform={M_LEFT} cx={-(LAMP.z + 0.55) * K} cy={-2.5 * K} r="74" fill={`url(#${id}-pool)`} />
          <circle transform={M_FLOOR} cx={(LAMP.x + 0.6) * K} cy={(LAMP.z + 0.7) * K} r="70" fill={`url(#${id}-pool)`} />
        </g>
      )}

      {/* ---------- wall things ---------- */}
      {has('painting') && <Painting />}
      {has('fairyLights') && <FairyLights lamp={lampOn} />}
      {has('shelf') && <Shelf />}
      <Window id={id} look={L} weather={weather} />
      <Curtains look={L} />
      <Box b={SILL} top={L.sill[0]} side={L.sill[1]} front={L.sill[2]} />

      {/* stove pipe (behind the kettle) */}
      <path d={STOVE_PARTS.pipe.d} stroke={W.ironDeep} strokeWidth="8.8" fill="none" />
      <path d={`M${STOVE_PARTS.pipe.x - 2} ${STOVE_PARTS.pipe.top} V${STOVE_PARTS.pipe.base}`} stroke={W.ironHi} strokeWidth="2" opacity="0.8" />
      <ellipse cx={STOVE_PARTS.pipe.wall[0] + 1} cy={STOVE_PARTS.pipe.wall[1]} rx="3" ry="7" fill={W.ironDeep} />

      {has('lantern') && <Lantern id={id} lamp={lampOn} />}
      {has('pothos') && <Pothos />}

      {/* ---------- floor things, back to front ---------- */}
      <Rug />
      <Lamp id={id} look={L} />
      {has('books') && <Books />}
      {has('monstera') && <Monstera />}
      <Stove id={id} />
      {has('recordPlayer') && <RecordCrate />}
      {has('telescope') && <Telescope />}
      {has('catBed') && <CatBed />}
      {has('cushion') && (
        <>
          <Disc x={CHAI.x} z={CHAI.z} y={0.02} rx={0.5} fill={PAL.honeyShade} />
          <Disc x={CHAI.x} z={CHAI.z} y={0.1} rx={0.48} fill={PAL.honey} />
          <Disc x={CHAI.x - 0.08} z={CHAI.z - 0.1} y={0.1} rx={0.26} fill={PAL.honeyHi} opacity={0.6} />
        </>
      )}
      {chai && (
        <Sprite at={[CHAI.x, has('cushion') ? 0.1 : 0.02, CHAI.z]}>
          <g transform="translate(-28 -52.6) scale(0.28)">
            <ChaiArt pose={chai} id={`${id}-chai`} />
          </g>
        </Sprite>
      )}
      {kotatsu ? <Kotatsu /> : <Table />}
      <OnTable id={id} teaSet={has('teaSet')} kotatsu={kotatsu} />
      {has('blanket') && <Basket />}

      {/* evening: the room is lit by the lamp alone */}
      {L.veil > 0 && <path d={INTERIOR} fill="#2A1F45" opacity={L.veil} />}
      {/* lamp halo + stove glow sit above the veil */}
      <circle cx={lx} cy={ly} r="34" fill={`url(#${id}-pool)`} opacity={lampOn * 0.85} className={s.glow} />
      <StoveFire id={id} night={lampOn} />
      {/* kettle steam */}
      {st > 0.02 && <KettleSteam st={st} />}
    </ArtSvg>
  );
}

// ---------------------------------------------------------------- shell parts

function WallTrim({ look, from, to, grooves }: { look: NookLook; from: number; to: number; grooves: number[] }) {
  const w = to - from;
  return (
    <>
      <rect x={from} y={-42} width={w} height={42} fill={look.sage} />
      {grooves.map((u) => (
        <rect key={u} x={u} y={-34} width="1.6" height="26" rx="0.8" fill={look.sageDeep} />
      ))}
      <rect x={from} y={-44.4} width={w} height={3.8} rx="1.5" fill={look.trim} />
      <rect x={from} y={-6.4} width={w} height={6.4} fill={look.trim} />
      <rect x={from} y={-1.6} width={w} height={1.6} fill={look.sageDeep} opacity="0.35" />
    </>
  );
}

function Window({ id, look: L, weather }: { id: string; look: NookLook; weather: NookWeather }) {
  const clip = `${id}-win`;
  const cx = (WIN.u0 + WIN.u1) / 2;
  let wx: ReactNode = null;
  if (weather === 'rain') {
    const drops = Array.from({ length: 30 }, (_, i) => {
      const x = WIN.u0 + 2 + ((i * 37) % 80);
      const y = -150 + ((i * 53) % 160);
      return <path key={i} d={`M${x} ${y} l-2.4 7`} />;
    });
    wx = (
      <g className={s.rain} stroke={L.rain} strokeWidth="1.5" strokeLinecap="round" opacity="0.85">
        {drops}
        <g transform="translate(0 -160)">{drops}</g>
      </g>
    );
  } else if (weather === 'snow') {
    const flakes = Array.from({ length: 24 }, (_, i) => {
      const x = WIN.u0 + 2 + ((i * 41) % 78);
      const y = -150 + ((i * 29) % 160);
      return <circle key={i} cx={x} cy={y} r={i % 3 ? 1.3 : 1.9} />;
    });
    wx = (
      <g className={s.snow} fill="#FFFFFF" opacity="0.92">
        {flakes}
        <g transform="translate(0 -160)">{flakes}</g>
      </g>
    );
  }
  const cloud = (x: number, y: number, k: number, fill: string) => (
    <g transform={`translate(${x} ${y}) scale(${k})`} fill={fill}>
      <ellipse cx="0" cy="0" rx="11" ry="5" />
      <circle cx="-4" cy="-3" r="5" />
      <circle cx="3" cy="-5" r="6" />
    </g>
  );
  const grey = weather === 'rain' || weather === 'snow';
  return (
    <g transform={M_BACK}>
      <path d={ARCH_FRAME} fill={L.frame} />
      <path d={ARCH} fill={`url(#${id}-sky)`} />
      <clipPath id={clip}>
        <path d={ARCH} />
      </clipPath>
      <g clipPath={`url(#${clip})`}>
        {L.stars > 0 && !grey && (
          <g fill="#FFF1C9" opacity={L.stars}>
            <path d={star(-4, -118, 2.4)} className={s.twinkle} />
            <path d={star(14, -104, 1.8)} className={s.twinkle} />
            <path d={star(52, -92, 2)} className={s.twinkle} />
            <circle cx="30" cy="-128" r="0.9" />
            <circle cx="-8" cy="-92" r="0.8" />
            <circle cx="36" cy="-84" r="0.8" />
          </g>
        )}
        {L.moon > 0 && weather !== 'rain' && (
          <g opacity={L.moon}>
            <circle cx="40" cy="-112" r="10" fill="#FFE3A1" opacity="0.18" />
            <circle cx="40" cy="-112" r="5.5" fill="#FFE3A1" />
            <circle cx="42.6" cy="-114.2" r="4.6" fill={L.skyTop} />
          </g>
        )}
        {L.sun > 0 && !grey && (
          <g>
            <circle cx={time2sunX(L)} cy={time2sunY(L)} r="11" fill="#FFF3C4" opacity="0.5" />
            <circle cx={time2sunX(L)} cy={time2sunY(L)} r="6.5" fill="#FFE08A" />
          </g>
        )}
        {L.clouds > 0 && !grey && (
          <g opacity={L.clouds}>
            {cloud(2, -112, 0.8, '#FFFFFF')}
            {cloud(46, -96, 0.6, '#FFFFFF')}
          </g>
        )}
        {grey && (
          <>
            <rect x={WIN.u0} y={WIN.v1} width={WIN.u1 - WIN.u0} height={WIN.v0 - WIN.v1} fill={L.lamp > 0.5 ? '#1C1830' : '#8E9CB4'} opacity={L.lamp > 0.5 ? 0.25 : 0.32} />
            {cloud(0, -122, 1.2, L.lamp > 0.5 ? '#3F3862' : '#DCE4EE')}
            {cloud(46, -118, 1, L.lamp > 0.5 ? '#3A3358' : '#E6ECF3')}
          </>
        )}
        {/* far hill + neighbour house, near hill + round trees */}
        <path d={`M${WIN.u0 - 2} -66 C0 -74 14 -72 26 -68 C38 -64 50 -72 ${WIN.u1 + 2} -70 V-40 H${WIN.u0 - 2} Z`} fill={L.hillFar} />
        {weather === 'snow' && <path d={`M${WIN.u0 - 2} -66 C0 -74 14 -72 26 -68 C38 -64 50 -72 ${WIN.u1 + 2} -70 V-67 C50 -69 38 -61 26 -65 C14 -69 0 -71 ${WIN.u0 - 2} -63 Z`} fill="#FFFFFF" opacity="0.9" />}
        <g transform="translate(4 -72)">
          <rect x="-6" y="-6" width="12" height="9" fill={L.hillNear} />
          <path d="M-8 -6 L0 -13 L8 -6 Z" fill={L.hillNear} />
          <rect x="1" y="-4" width="3.2" height="3.2" fill={L.houseLight ? PAL.honey : L.hillFar} />
        </g>
        <path d={`M${WIN.u0 - 2} -56 C4 -62 18 -60 30 -57 C42 -54 52 -60 ${WIN.u1 + 2} -58 V-40 H${WIN.u0 - 2} Z`} fill={L.hillNear} />
        <g fill={L.hillNear}>
          <circle cx="47" cy="-62" r="5" />
          <circle cx="55" cy="-60" r="3.5" />
          <circle cx="-4" cy="-59" r="4" />
        </g>
        {wx}
        {/* glass sheen */}
        <path d={`M${WIN.u0} -80 L${WIN.u0 + 30} -136 H${WIN.u0 + 40} L${WIN.u0 + 4} -68 Z`} fill="#FFFFFF" opacity="0.1" />
      </g>
      {/* muntins */}
      <path d={`M${cx} ${WIN.v0} V${WIN.v1} M${WIN.u0} ${WIN.spring} H${WIN.u1}`} stroke={L.frame} strokeWidth="2.8" />
      <path d={`M${WIN.u0} ${WIN.v0} V${WIN.spring} A${WIN.r} ${WIN.r} 0 0 1 ${WIN.u1} ${WIN.spring} V${WIN.v0}`} stroke="#E6D2B8" strokeWidth="1.2" fill="none" />
    </g>
  );
}
const time2sunX = (L: NookLook) => (L.sun >= 1 ? 6 : 44);
const time2sunY = (L: NookLook) => (L.sun >= 1 ? -84 : -118);

const DRAPE =
  'M-6.4 -144.8 C-8 -136 -8 -124 -7 -112 C-6 -100 -4 -88 -3.6 -80.8 C-6 -70 -10 -56 -11 -44 C-11 -41 -10 -38.8 -8 -38.8 H8 C10 -38.8 11 -41 11 -44 C10 -56 6 -70 3.6 -80.8 C4 -88 6 -100 7 -112 C8 -124 8 -136 6.4 -144.8 Z';

function Curtains({ look: L }: { look: NookLook }) {
  const cx = (WIN.u0 + WIN.u1) / 2;
  return (
    <g transform={M_BACK}>
      {[-1, 1].map((side) => (
        <g key={side} transform={`translate(${cx + side * 49.2} 0)`}>
          <path d={DRAPE} fill={L.curtain} />
          <path d={side < 0 ? 'M2 -140 C3 -120 1 -96 0 -82 M1 -76 C3 -64 5 -52 5 -40' : 'M-2 -140 C-3 -120 -1 -96 0 -82 M-1 -76 C-3 -64 -5 -52 -5 -40'} stroke={L.curtainShade} strokeWidth="2.4" strokeLinecap="round" fill="none" />
          <ellipse cx="0" cy="-80.8" rx="5.4" ry="2.4" fill={PAL.honey} />
        </g>
      ))}
      <rect x={cx - 61} y={-146.2} width="122" height="2.8" rx="1.4" fill={W.woodDeep} />
      <circle cx={cx - 62} cy={-144.8} r="2.8" fill={W.brass} />
      <circle cx={cx + 62} cy={-144.8} r="2.8" fill={W.brass} />
    </g>
  );
}

// ---------------------------------------------------------------- furniture

function Rug() {
  const x = 0.2;
  const z = 0.55;
  return (
    <>
      <Disc x={x} z={z} rx={2.05} rz={1.55} fill={PAL.berryShade} />
      <Disc x={x} z={z} y={0.02} rx={1.9} rz={1.42} fill={W.cream} />
      <Disc x={x} z={z} y={0.025} rx={1.72} rz={1.27} fill={PAL.berry} />
      <Disc x={x} z={z} y={0.03} rx={1.05} rz={0.72} fill={W.cream} />
      <Disc x={x} z={z} y={0.035} rx={0.9} rz={0.6} fill={PAL.berryHi} />
    </>
  );
}

function Lamp({ id, look: L }: { id: string; look: NookLook }) {
  const [bx, by] = px(LAMP.x, 0, LAMP.z);
  const sb = px(LAMP.x, 2.2, LAMP.z)[1];
  const stp = px(LAMP.x, 2.86, LAMP.z)[1];
  const lit = L.lamp > 0.5;
  const shade = lit ? '#FFE7BC' : W.cream;
  return (
    <g>
      <ellipse cx={bx} cy={by + 1} rx="16" ry="6" fill="rgba(40,20,30,0.18)" />
      <ellipse cx={bx} cy={by} rx="12" ry="4.6" fill={W.espresso} />
      <ellipse cx={bx} cy={by - 1.6} rx="9" ry="3.2" fill="#5E4232" />
      <rect x={bx - 1.4} y={sb} width="2.8" height={by - sb - 2} fill={W.brass} />
      <rect x={bx - 1.4} y={sb} width="1" height={by - sb - 2} fill="#F3C877" />
      <circle cx={bx} cy={by - 1.2 * K * 0.921} r="2.4" fill={W.brass} />
      <path d={`M${bx - 17.6} ${sb} L${bx - 10.4} ${stp} H${bx + 10.4} L${bx + 17.6} ${sb} Z`} fill={shade} />
      <path d={`M${bx + 4} ${stp} H${bx + 10.4} L${bx + 17.6} ${sb} H${bx + 8} Z`} fill={lit ? '#FFD796' : '#EAD6BA'} />
      <ellipse cx={bx} cy={sb} rx="17.6" ry="6.4" fill={lit ? `url(#${id}-pool)` : '#E6CFB0'} opacity={lit ? 1 : 0.9} />
      <path d={`M${bx - 17.6} ${sb} A17.6 6.4 0 0 0 ${bx + 17.6} ${sb}`} stroke={PAL.persimmon} strokeWidth="1.8" fill="none" />
      <ellipse cx={bx} cy={stp} rx="10.4" ry="3.6" fill={lit ? '#FFF1D2' : '#F6E6CF'} stroke={PAL.persimmon} strokeWidth="1.4" />
    </g>
  );
}

function Stove({ id }: { id: string }) {
  const P = STOVE_PARTS;
  return (
    <g>
      <Disc x={STOVE.x + 0.1} z={STOVE.z + 0.1} rx={0.72} rz={0.8} fill="rgba(30,15,30,0.22)" />
      {P.legs.map((b, i) => (
        <Box key={i} b={b} top={W.ironDeep} side={W.ironDeep} front="#2B2432" />
      ))}
      <Box b={P.plinth} top={W.ironDeep} side={W.ironDeep} front="#2B2432" />
      <Box b={P.body} top={W.iron} side={W.iron} front={W.ironDeep} />
      <Box b={P.plate} top={W.ironHi} side={W.ironDeep} front="#2B2432" />
      <g transform={planeX(STOVE.x + 0.41)}>
        {/* brass trim, ash drawer, fire window */}
        <rect x={-(STOVE.z + 0.46) * K} y={-1.06 * K} width={0.92 * K} height="1.4" rx="0.7" fill={W.brass} />
        <rect x={-(STOVE.z + 0.27) * K} y={-0.41 * K} width={0.54 * K} height="4" rx="1.6" fill={W.ironDeep} />
        <rect x={-(STOVE.z + 0.06) * K} y={-0.37 * K - 0.6} width={0.12 * K} height="1.4" rx="0.7" fill={W.brass} />
        <circle cx={-STOVE.z * K} cy={-0.62 * K} r="9" fill="#FF8A3C" />
        <path d={`M${-STOVE.z * K - 5} ${-0.62 * K + 6} C${-STOVE.z * K - 5} ${-0.62 * K} ${-STOVE.z * K - 1} ${-0.62 * K - 2} ${-STOVE.z * K} ${-0.62 * K - 6} C${-STOVE.z * K + 2} ${-0.62 * K - 1} ${-STOVE.z * K + 5} ${-0.62 * K} ${-STOVE.z * K + 5} ${-0.62 * K + 6} Z`} fill={PAL.honey} className={s.shimmer} />
        <path d={`M${-STOVE.z * K - 3.6} ${-0.62 * K - 8} V${-0.62 * K + 8} M${-STOVE.z * K} ${-0.62 * K - 9} V${-0.62 * K + 9} M${-STOVE.z * K + 3.6} ${-0.62 * K - 8} V${-0.62 * K + 8}`} stroke={W.ironDeep} strokeWidth="1.1" />
        <circle cx={-STOVE.z * K} cy={-0.62 * K} r="9" fill="none" stroke={W.brass} strokeWidth="2" />
        <rect x={-(STOVE.z + 0.34) * K - 1} y={-0.62 * K - 3} width="2" height="6" rx="1" fill={W.brass} />
      </g>
      <Sprite at={[STOVE.x, 1.21, STOVE.z]}>
        <Kettle id={id} />
      </Sprite>
    </g>
  );
}

/** The persimmon kettle (the 3D one: cream belly band, dark wood handle, spout to the right). */
function Kettle({ id }: { id: string }) {
  const body = 'M-12 0 C-16 0 -17.2 -3 -17 -6.5 C-16.8 -11 -14 -15.2 -9 -17.2 C-6 -18.2 6 -18.2 9 -17.2 C14 -15.2 16.8 -11 17 -6.5 C17.2 -3 16 0 12 0 Z';
  return (
    <g>
      <ellipse cx="0" cy="0" rx="15" ry="3.6" fill="rgba(20,10,20,0.35)" />
      <path d="M-10.4 -20 C-10.4 -33 9.2 -33 9.2 -20" stroke={W.woodDark} strokeWidth="3.2" fill="none" strokeLinecap="round" />
      <path d="M11 -9 L22 -17.6" stroke={PAL.persimmonShade} strokeWidth="5.4" strokeLinecap="round" />
      <path d="M11 -9 L21 -16.8" stroke={PAL.persimmon} strokeWidth="3.6" strokeLinecap="round" />
      <circle cx="23" cy="-18.6" r="2.6" fill={W.cream} />
      <Shaded d={body} id={`${id}-kt`} base={PAL.persimmon} shade={PAL.persimmonShade} dx={-3} dy={-2}>
        <rect x="-18" y="-9" width="36" height="2.4" fill={W.cream} />
        <path d="M-12 -12 C-10.5 -14.6 -8 -15.8 -5.5 -16.2" stroke={PAL.persimmonHi} strokeWidth="2.2" strokeLinecap="round" fill="none" />
      </Shaded>
      <ellipse cx="0" cy="-17.6" rx="7.6" ry="2.4" fill={PAL.persimmonShade} />
      <circle cx="0" cy="-20" r="2.4" fill={W.cream} />
    </g>
  );
}

function KettleSteam({ st }: { st: number }) {
  const [x, y] = px(STOVE.x, 1.21, STOVE.z);
  // White puffs from the spout tip, drifting up (a soft rim keeps them readable on the cream day wall).
  const groups: [number, number, number][][] = [
    [
      [0, -3, 3.6],
      [-2, -9.5, 5],
    ],
    [
      [-4.5, -18, 6],
      [-1, -25, 4.6],
    ],
    [
      [-7, -34, 7],
      [-2, -42, 5.2],
    ],
  ];
  const n = st > 0.7 ? 3 : st > 0.35 ? 2 : 1;
  return (
    <g transform={`translate(${x + 23} ${y - 20})`} opacity={0.55 + st * 0.45}>
      {groups.slice(0, n).map((g, i) => (
        <g key={i} className={s.steam}>
          {g.map(([cx, cy, r], j) => (
            <circle key={`o${j}`} cx={cx} cy={cy} r={r + 0.9} fill="rgba(150,120,130,0.28)" />
          ))}
          {g.map(([cx, cy, r], j) => (
            <circle key={j} cx={cx} cy={cy} r={r} fill="#FFFFFF" />
          ))}
        </g>
      ))}
    </g>
  );
}

function StoveFire({ id, night }: { id: string; night: number }) {
  const [x, y] = px(STOVE.x + 0.42, 0.62, STOVE.z);
  return <circle cx={x} cy={y} r="26" fill={`url(#${id}-fire)`} opacity={0.2 + night * 0.55} className={s.glow} />;
}

function Table() {
  const { x, z, r, h } = TABLE;
  const legs = [0, 1, 2, 3]
    .map((i) => {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      return { lx: x + Math.cos(a) * 0.5, lz: z + Math.sin(a) * 0.5 };
    })
    .sort((a, b) => a.lx * 0.49 + a.lz * 0.78 - (b.lx * 0.49 + b.lz * 0.78));
  const [tx, ty] = px(x, h, z);
  const [, tb] = px(x, 0.5, z);
  return (
    <g>
      <Disc x={x} z={z} y={0.04} rx={0.9} fill="rgba(60,20,40,0.2)" />
      {legs.map((l, i) => {
        const [lx, ly] = px(l.lx, 0.04, l.lz);
        return <rect key={i} x={lx - 2} y={ly - 0.5 * K * 0.92} width="4" height={0.5 * K * 0.92} rx="1.6" fill={W.woodMid} />;
      })}
      <ellipse cx={tx} cy={tb} rx={r * K} ry={r * K * 0.389} fill={W.woodMid} />
      <rect x={tx - r * K} y={ty} width={r * K * 2} height={tb - ty} fill={W.woodMid} />
      <ellipse cx={tx} cy={ty} rx={r * K} ry={r * K * 0.389} fill={W.woodHi} />
      <ellipse cx={tx - 4} cy={ty - 1} rx={r * K - 9} ry={r * K * 0.389 - 4} fill="#EDBD86" />
    </g>
  );
}

function Kotatsu() {
  const { x, z } = TABLE;
  const quilt = box(x - 0.82, x + 0.82, 0.02, 0.52, z - 0.82, z + 0.82);
  const top = box(x - 0.92, x + 0.92, 0.52, 0.62, z - 0.92, z + 0.92);
  return (
    <g>
      <Disc x={x + 0.1} z={z + 0.1} rx={1.25} fill="rgba(60,20,40,0.2)" />
      <Box b={quilt} top={W.sage} side={W.sage} front={W.sageDeep} />
      <g transform={planeZ(z + 0.82)} stroke={W.sageHi} strokeWidth="1.2" opacity="0.7">
        <path d={`M${(x - 0.5) * K} -18 V-2 M${x * K} -18 V-2 M${(x + 0.5) * K} -18 V-2`} />
      </g>
      <g transform={planeX(x + 0.82)} stroke={W.sageHi} strokeWidth="1.2" opacity="0.7">
        <path d={`M${-(z - 0.5) * K} -18 V-2 M${-z * K} -18 V-2 M${-(z + 0.5) * K} -18 V-2`} />
      </g>
      <Box b={top} top={W.woodHi} side={W.wood} front={W.woodMid} />
    </g>
  );
}

function OnTable({ id, teaSet, kotatsu }: { id: string; teaSet: boolean; kotatsu: boolean }) {
  const h = kotatsu ? 0.62 : TABLE.h;
  if (teaSet) {
    return (
      <g>
        <Sprite at={[TABLE.x - 0.12, h, TABLE.z - 0.1]}>
          <path d="M8 -6 C13 -6 14 -11 16 -13" stroke={W.cream} strokeWidth="2.4" strokeLinecap="round" fill="none" />
          <path d="M-8 -9 C-12 -9 -12 -3 -8 -3" stroke="#E6D2B8" strokeWidth="1.8" fill="none" />
          <Shaded d="M-9 -1 C-10 -8 -6 -12 0 -12 C6 -12 10 -8 9 -1 C8 0.5 -8 0.5 -9 -1 Z" id={`${id}-tp`} base={W.cream} shade="#E6D2B8" dx={-2} dy={-1.5} />
          <path d="M-5 -11.5 C-4 -14.5 4 -14.5 5 -11.5 Z" fill={PAL.persimmon} />
          <circle cx="0" cy="-15" r="1.6" fill={PAL.persimmonShade} />
          <path d="M-8 -6 H8" stroke={W.sage} strokeWidth="1.6" />
        </Sprite>
        <Sprite at={[TABLE.x + 0.42, h, TABLE.z + 0.1]}>
          <path d="M-3.6 -5 H3.6 C3.6 -1.5 2 0 0 0 C-2 0 -3.6 -1.5 -3.6 -5 Z" fill={W.cream} />
          <ellipse cx="0" cy="-5" rx="3.6" ry="1.2" fill={PAL.tea} />
        </Sprite>
        <Sprite at={[TABLE.x + 0.1, h, TABLE.z + 0.42]}>
          <path d="M-3.6 -5 H3.6 C3.6 -1.5 2 0 0 0 C-2 0 -3.6 -1.5 -3.6 -5 Z" fill={W.cream} />
          <ellipse cx="0" cy="-5" rx="3.6" ry="1.2" fill={PAL.tea} />
        </Sprite>
      </g>
    );
  }
  return (
    <Sprite at={[TABLE.x + 0.2, h, TABLE.z + 0.05]}>
      <path d="M5 -7 C8.5 -7 8.5 -2.5 5 -2.5" stroke={PAL.skyShade} strokeWidth="1.6" fill="none" />
      <path d="M-5.4 -10 H5.4 V-1.4 C5.4 -0.4 4.6 0.4 3.6 0.4 H-3.6 C-4.6 0.4 -5.4 -0.4 -5.4 -1.4 Z" fill={PAL.sky} />
      <rect x="-5.4" y="-10" width="3" height="10" fill={PAL.skyHi} opacity="0.5" />
      <ellipse cx="0" cy="-10" rx="5.4" ry="1.8" fill={PAL.tea} />
      <path className={s.steam} d="M0 -13 C-2 -16 2 -18 0 -22" stroke="#FFFFFF" strokeOpacity="0.8" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </Sprite>
  );
}

// ---------------------------------------------------------------- cozy things

function FairyLights({ lamp }: { lamp: number }) {
  const bulbs = [PAL.honey, PAL.berryHi, PAL.skyHi, PAL.matchaHi];
  const run = (from: number, to: number) => {
    const n = Math.round((to - from) / 32);
    const step = (to - from) / n;
    let d = `M${from} -152`;
    const pts: [number, number][] = [];
    for (let i = 0; i < n; i++) {
      const a = from + step * i;
      d += ` Q${a + step / 2} -140 ${a + step} -152`;
      pts.push([a + step * 0.3, -147.2], [a + step * 0.5, -146], [a + step * 0.7, -147.2]);
    }
    return { d, pts };
  };
  const back = run(R.x0 * K + 4, R.x1 * K - 4);
  const left = run(-R.zF * K + 4, -R.zB * K - 4);
  const draw = (r: { d: string; pts: [number, number][] }, m: string) => (
    <g transform={m}>
      <path d={r.d} stroke="#3A2B30" strokeWidth="0.9" fill="none" opacity="0.7" />
      {lamp > 0.5 && r.pts.map(([x, y], i) => <circle key={`g${i}`} cx={x} cy={y + 1.6} r="4.2" fill={bulbs[i % 4]} opacity="0.25" />)}
      {r.pts.map(([x, y], i) => (
        <circle key={i} className={s.twinkle} cx={x} cy={y + 1.6} r="1.7" fill={bulbs[i % 4]} />
      ))}
    </g>
  );
  return (
    <>
      {draw(left, M_LEFT)}
      {draw(back, M_BACK)}
    </>
  );
}

function Shelf() {
  const u = -1.45 * K;
  return (
    <g transform={M_BACK}>
      <path d={`M${u - 16} -97 L${u - 12} -88 M${u + 16} -97 L${u + 12} -88`} stroke={W.woodDeep} strokeWidth="2.4" strokeLinecap="round" />
      {/* honey jar, persimmon tin, vase + sprig, framed photo, yuzu */}
      <rect x={u - 19} y={-109} width="6.4" height="8" rx="1.6" fill={PAL.honey} />
      <rect x={u - 19} y={-110} width="6.4" height="2.4" rx="1" fill={PAL.honeyShade} />
      <rect x={u - 11} y={-108} width="5" height="7" rx="1.2" fill={PAL.persimmon} />
      <path d={`M${u - 2} -101 C${u - 4} -104 ${u - 3} -107 ${u} -108 C${u + 3} -107 ${u + 4} -104 ${u + 2} -101 Z`} fill={W.cream} />
      <path d={`M${u} -108 C${u - 1} -112 ${u + 1} -115 ${u + 4} -116`} stroke={PAL.leafHi} strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <rect x={u + 6} y={-110} width="8" height="9" rx="1" fill={W.woodHi} />
      <rect x={u + 7.4} y={-108.6} width="5.2" height="6.2" fill={PAL.skyHi} />
      <circle cx={u + 18} cy={-103.4} r="2.6" fill={PAL.yuzu} />
      <rect x={u - 22} y={-101} width="44" height="3.6" rx="1.4" fill={W.woodMid} />
      <rect x={u - 22} y={-98.4} width="44" height="1.2" fill={W.woodDeep} opacity="0.6" />
    </g>
  );
}

function Painting() {
  const u = -1.3 * K;
  return (
    <g transform={M_LEFT}>
      <rect x={u - 19} y={-117} width="38" height="30" rx="2" fill={W.woodHi} />
      <rect x={u - 15.5} y={-113.5} width="31" height="23" fill="#FFF1DE" />
      <path d={`M${u - 15.5} -96 L${u - 6} -108 L${u} -101 L${u + 6} -106 L${u + 15.5} -95 V-90.5 H${u - 15.5} Z`} fill="#8C7DB8" />
      <path d={`M${u - 6} -108 L${u - 3.6} -105 L${u - 8} -104.4 Z`} fill="#FFFFFF" />
      <path d={`M${u - 15.5} -93.4 C${u - 6} -96 ${u + 4} -94 ${u + 15.5} -95 V-90.5 H${u - 15.5} Z`} fill={PAL.matcha} />
      <circle cx={u + 9} cy={-109} r="2.6" fill={PAL.persimmon} />
    </g>
  );
}

function Lantern({ id, lamp }: { id: string; lamp: number }) {
  const at = { x: -1.9, z: 1.75 };
  const [ax, ay] = px(R.x0, 3.72, at.z);
  const [bx, by] = px(at.x, 3.72, at.z);
  const [cx, cy] = px(at.x, 3.2, at.z);
  return (
    <g>
      <path d={`M${ax} ${ay} L${bx} ${by} M${ax + 2} ${ay + 6} L${ax + 12} ${ay - 0.6}`} stroke="#3A2B30" strokeWidth="1.8" strokeLinecap="round" />
      <path d={`M${bx} ${by} V${cy - 13}`} stroke="#3A2B30" strokeWidth="0.9" />
      {lamp > 0.2 && <circle className={s.glow} cx={cx} cy={cy} r="30" fill={`url(#${id}-pool)`} opacity={0.7 * lamp} />}
      <ellipse cx={cx} cy={cy} rx="11" ry="12.6" fill={lamp > 0.5 ? '#FFEFD2' : W.cream} />
      <path d={`M${cx + 3} ${cy - 12} C${cx + 11} ${cy - 8} ${cx + 11} ${cy + 8} ${cx + 3} ${cy + 12} C${cx + 8} ${cy + 4} ${cx + 8} ${cy - 4} ${cx + 3} ${cy - 12} Z`} fill={lamp > 0.5 ? '#FFD9A0' : '#EAD6BA'} />
      <path d={`M${cx - 10.4} ${cy - 4} H${cx + 10.4} M${cx - 11} ${cy + 1} H${cx + 11} M${cx - 10.2} ${cy + 6} H${cx + 10.2}`} stroke="#EAC99C" strokeWidth="0.8" />
      <rect x={cx - 6} y={cy - 14.2} width="12" height="3" rx="1.4" fill={PAL.persimmon} />
      <rect x={cx - 6} y={cy + 11.2} width="12" height="3" rx="1.4" fill={PAL.persimmon} />
      <path d={`M${cx} ${cy + 14} V${cy + 19}`} stroke={PAL.berry} strokeWidth="1.6" strokeLinecap="round" />
    </g>
  );
}

function Pothos() {
  const [x, y] = px(1.45, 1.2, R.zB + 0.18);
  const leaves: [number, number, number][] = [
    [-7, 6, -30],
    [-9, 13, 30],
    [-8, 21, -20],
    [-10, 29, 25],
    [6, 5, 30],
    [8, 12, -25],
    [7, 20, 20],
    [-2, -9, -20],
    [4, -11, 30],
    [-6, -8, 50],
  ];
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-5 -2 C-9 8 -7 20 -10 32 M5 -2 C8 8 6 16 8 24" stroke={PAL.leafShade} strokeWidth="1.1" fill="none" />
      <path d="M-6 -7 H6 L4.6 0 H-4.6 Z" fill={W.terracotta} />
      <rect x="-6.8" y="-8" width="13.6" height="2.8" rx="1.2" fill="#B85C38" />
      {leaves.map(([lx, ly, rot], i) => (
        <ellipse key={i} cx={lx} cy={ly} rx="3.4" ry="2.3" transform={`rotate(${rot} ${lx} ${ly})`} fill={i % 3 ? PAL.leaf : PAL.leafHi} />
      ))}
    </g>
  );
}

function Books() {
  const x = -1.55;
  const z = -2.08;
  const b = [
    { x0: x - 0.32, x1: x + 0.3, y0: 0, y1: 0.13, z0: z - 0.24, z1: z + 0.24, c: PAL.persimmonShade },
    { x0: x - 0.26, x1: x + 0.26, y0: 0.13, y1: 0.24, z0: z - 0.2, z1: z + 0.2, c: PAL.matchaShade },
    { x0: x - 0.3, x1: x + 0.24, y0: 0.24, y1: 0.36, z0: z - 0.22, z1: z + 0.2, c: PAL.berryHi },
    { x0: x - 0.2, x1: x + 0.18, y0: 0.36, y1: 0.45, z0: z - 0.16, z1: z + 0.14, c: PAL.honeyHi },
  ];
  return (
    <g>
      {b.map((k, i) => (
        <Box key={i} b={box(k.x0, k.x1, k.y0, k.y1, k.z0, k.z1)} top={k.c} side="#FFF6E8" front={k.c} />
      ))}
      <Sprite at={[x, 0.45, z]}>
        <path d="M-1.4 0 V-7 H1.4 V0 Z" fill={W.cream} />
        <path d="M0 -7 C-1.6 -9 0 -11 0 -12 C1 -11 1.8 -9 0 -7 Z" fill={PAL.honey} />
      </Sprite>
    </g>
  );
}

function Monstera() {
  return (
    <Sprite at={[-0.78, 0.06, -1.86]}>
      <g>
        {/* leaves: big split hearts on arching stems */}
        <path d="M0 -18 C-4 -40 -18 -54 -30 -58 M0 -18 C2 -44 10 -64 22 -76 M0 -18 C6 -34 20 -44 34 -46 M0 -18 C-2 -36 -6 -62 -8 -84" stroke={PAL.leafShade} strokeWidth="1.6" fill="none" />
        <Leaf x={-30} y={-58} r={-60} k={1} c={PAL.leafShade} />
        <Leaf x={34} y={-46} r={70} k={0.95} c={PAL.leaf} />
        <Leaf x={22} y={-76} r={30} k={1.05} c={PAL.leaf} />
        <Leaf x={-8} y={-84} r={-10} k={1.1} c={PAL.leafHi} />
        <path d="M-11 -18 H11 L9 0 H-9 Z" fill={W.cream} />
        <path d="M3 -18 H11 L9 0 H4 Z" fill="#EAD9C2" />
        <ellipse cx="0" cy="-18" rx="11" ry="3.6" fill="#E6D2B8" />
        <ellipse cx="0" cy="-18" rx="8.6" ry="2.4" fill={W.woodDark} />
      </g>
    </Sprite>
  );
}

function Leaf({ x, y, r, k, c }: { x: number; y: number; r: number; k: number; c: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${k})`}>
      <path d="M0 12 C-14 8 -16 -6 -8 -12 C-4 -15 0 -12 0 -10 C0 -12 4 -15 8 -12 C16 -6 14 8 0 12 Z" fill={c} />
      <path d="M0 11 V-9 M0 2 L-9 -3 M0 6 L9 1 M0 -2 L9 -7" stroke={PAL.leafShade} strokeWidth="1" opacity="0.8" />
      <path d="M-12 -2 L-6 -1 M12 3 L6 3" stroke={c === PAL.leafShade ? PAL.leaf : PAL.leafShade} strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
    </g>
  );
}

function RecordCrate() {
  const x = 2.3;
  const z = -2.02;
  const crate = box(x - 0.45, x + 0.45, 0, 0.8, z - 0.3, z + 0.3);
  const player = box(x - 0.42, x + 0.42, 0.8, 0.95, z - 0.28, z + 0.28);
  const spines = [PAL.persimmon, PAL.honey, PAL.sky, PAL.berry, PAL.matcha, W.cream, PAL.skyShade];
  return (
    <g>
      <Box b={crate} top={W.wood} side={W.woodMid} front={W.wood} />
      <g transform={planeZ(z + 0.3)}>
        <rect x={(x - 0.4) * K} y={-0.74 * K} width={0.8 * K} height={0.66 * K} fill={W.woodDark} />
        {spines.map((c, i) => (
          <rect key={i} x={(x - 0.38) * K + i * 4.4} y={-0.66 * K + (i % 3) * 1.4} width="3.8" height={0.58 * K - (i % 3) * 1.4} rx="0.8" fill={c} />
        ))}
      </g>
      <Box b={player} top={PAL.skyHi} side={PAL.sky} front={PAL.skyShade} />
      <ellipse transform={planeY(0.96)} cx={(x - 0.08) * K} cy={z * K} rx="9" ry="9" fill={PAL.ink} />
      <ellipse transform={planeY(0.96)} cx={(x - 0.08) * K} cy={z * K} rx="2.8" ry="2.8" fill={PAL.honey} />
      <path d={`M${pt(x + 0.34, 0.99, z - 0.2)} L${pt(x + 0.1, 0.99, z + 0.05)}`} stroke="#D8D8E2" strokeWidth="1.4" strokeLinecap="round" />
    </g>
  );
}

function Telescope() {
  const x = 1.75;
  const z = -1.05;
  const apex = px(x, 1.05, z);
  const feet = [px(x - 0.35, 0, z + 0.2), px(x + 0.3, 0, z + 0.25), px(x, 0, z - 0.4)];
  const a = px(x + 0.35, 0.8, z + 0.25);
  const b = px(x - 0.35, 1.5, z - 0.45);
  const ang = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  return (
    <g>
      <path d={feet.map((f) => `M${apex[0]} ${apex[1]} L${f[0]} ${f[1]}`).join(' ')} stroke={W.woodMid} strokeWidth="2" strokeLinecap="round" />
      <g transform={`translate(${a[0]} ${a[1]}) rotate(${ang})`}>
        <rect x="0" y="-4" width={len} height="8" rx="3" fill={PAL.sky} />
        <rect x="0" y="-4" width={len} height="3" rx="1.5" fill={PAL.skyHi} />
        <rect x={len - 5} y="-5.4" width="6" height="10.8" rx="2" fill={PAL.skyShade} />
        <rect x={len * 0.45} y="-4.4" width="3" height="8.8" fill={W.brass} />
      </g>
    </g>
  );
}

function CatBed() {
  const x = -2.45;
  const z = 1.72;
  return (
    <g>
      <Disc x={x} z={z} y={0} rx={0.5} fill={PAL.skyShade} />
      <Disc x={x} z={z} y={0.14} rx={0.5} fill={PAL.sky} />
      <Disc x={x} z={z} y={0.15} rx={0.36} fill={PAL.skyHi} />
      <Sprite at={[x, 0.15, z]}>
        <ellipse cx="1" cy="-3.6" rx="11" ry="5.6" fill="#F6EBDD" />
        <path d="M10 -2 C14 -2 13 3 7 2" stroke="#E6D7C4" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <circle cx="-7" cy="-5" r="5" fill="#F6EBDD" />
        <path d="M-11 -8 L-10.6 -12.4 L-7.6 -9.2 M-5.6 -9.4 L-3 -12.2 L-2.8 -8" fill="#F6EBDD" stroke="#F6EBDD" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M-10.2 -9.6 L-10 -11 L-8.8 -9.8" fill={PAL.persimmonHi} />
        <path d="M-10 -4.6 q1.2 1 2.4 0 M-6.4 -4.6 q1.2 1 2.4 0" stroke="#5A4A55" strokeWidth="0.8" fill="none" strokeLinecap="round" />
      </Sprite>
    </g>
  );
}

function Basket() {
  return (
    <Sprite at={[2.05, 0.03, 1.65]}>
      <path d="M-11 -18 C-6 -26 6 -26 12 -18 Z" fill={PAL.berry} />
      <path d="M-8 -21 H9 M-5 -24 H6" stroke="#FFFFFF" strokeWidth="1.6" opacity="0.7" />
      <circle cx="10" cy="-19" r="5" fill={PAL.honey} />
      <path d="M7 -21 C10 -18 12 -22 14 -18" stroke={PAL.honeyShade} strokeWidth="0.9" fill="none" />
      <path d="M-15 -16 H15 L12.6 0 C8 2 -8 2 -12.6 0 Z" fill={W.woodHi} />
      <path d="M-14.4 -11 H14.4 M-13.6 -6 H13.6 M-13 -1.4 H13" stroke={W.wood} strokeWidth="1.3" />
      <path d="M4 -16 H15 L12.6 0 C10 1.2 7 1.6 4 1.8 Z" fill={W.wood} opacity="0.45" />
      <ellipse cx="0" cy="-16" rx="15" ry="3.2" fill={W.woodMid} />
      <path d="M-10 -16 C-12 -8 -10 -2 -7 2" stroke={PAL.honey} strokeWidth="3" fill="none" strokeLinecap="round" />
    </Sprite>
  );
}

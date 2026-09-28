/**
 * Static nook illustration — used when WebGL is unavailable / 3D is off.
 * A small warmly-lit room at night: window (clear / rain / snow), a kettle on
 * a little stove (steam follows `steam` 0..1), lamp, rug, Chai, and any
 * unlocked items from src/progress/items.ts. Fills its box (slice).
 * OWNER: art area.
 */
import type { ReactNode } from 'react';
import { PAL } from './palette';
import { ArtSvg, Shaded, artStyles as s, useArtId, useLive } from './kit';
import { ChaiArt, type MascotPose } from './Mascot';

export type NookWeather = 'clear' | 'rain' | 'snow';

export interface NookFallbackProps {
  weather?: NookWeather;
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
  /** SVG preserveAspectRatio (default: fill the box, crop the edges). */
  fit?: 'slice' | 'meet';
}

const C = {
  wall: '#4A3A5E',
  wallLow: '#3E3050',
  trim: '#5C4873',
  floor: '#6B4535',
  floorDark: '#5A392C',
  plank: '#5F3D2F',
  frame: '#A86E45',
  frameShade: '#87552F',
  sky: '#2A3468',
  skyLow: '#3A4A82',
  moon: '#FFE3A1',
  star: '#FFF1C9',
  curtain: '#C65B6D',
  curtainShade: '#A5475A',
  glow: '#FFC56E',
  wood: '#B8784A',
  woodShade: '#8E5634',
  stove: '#3A3046',
  stoveHi: '#4D4260',
  burner: '#FF8A4C',
};

export function NookFallback({
  weather = 'clear',
  steam = 0.6,
  items = [],
  chai = 'focus',
  animate = true,
  className,
  title = 'Your cozy nook',
  width = '100%',
  height = '100%',
  fit = 'slice',
}: NookFallbackProps) {
  const id = useArtId();
  const live = useLive(animate);
  const has = (k: string) => items.includes(k);
  const st = Math.max(0, Math.min(1, steam));

  return (
    <ArtSvg
      viewBox="0 0 480 320"
      width={width}
      height={height}
      preserveAspectRatio={`xMidYMid ${fit}`}
      live={live}
      className={className}
      title={title}
      style={{ display: 'block', background: C.wall }}
      data-art="nook-fallback"
    >
      {/* walls + lamp light pool */}
      <rect width="480" height="320" fill={C.wall} />
      <g fill={C.glow}>
        <circle cx="452" cy="130" r="210" opacity="0.035" />
        <circle cx="452" cy="130" r="165" opacity="0.04" />
        <circle cx="452" cy="130" r="120" opacity="0.05" />
        <circle cx="452" cy="130" r="80" opacity="0.06" />
      </g>
      <rect y="196" width="480" height="44" fill={C.wallLow} />
      <rect y="192" width="480" height="6" fill={C.trim} />

      {/* painting */}
      {has('painting') && (
        <g>
          <rect x="302" y="46" width="78" height="60" rx="5" fill={C.woodShade} />
          <rect x="308" y="52" width="66" height="48" rx="2" fill="#F6E3C4" />
          <path d="M308 92 L330 66 L344 80 L356 68 L374 90 V100 H308 Z" fill="#7FA7C9" />
          <path d="M330 66 L336 73 L331 75 L325 72 Z M356 68 L362 75 L357 77 L351 73 Z" fill={PAL.white} />
          <path d="M308 94 C330 88 350 92 374 90 V100 H308 Z" fill={PAL.matcha} />
          <circle cx="362" cy="60" r="5" fill={PAL.persimmon} />
        </g>
      )}

      {/* wall shelf */}
      {has('shelf') && (
        <g transform="translate(10 0)">
          <rect x="292" y="136" width="100" height="8" rx="3" fill={C.wood} />
          <path d="M302 144 L310 156 M382 144 L374 156" stroke={C.woodShade} strokeWidth="4" strokeLinecap="round" />
          <rect x="300" y="116" width="14" height="20" rx="4" fill={PAL.honey} />
          <rect x="300" y="116" width="14" height="6" rx="3" fill={PAL.honeyShade} />
          <rect x="318" y="110" width="8" height="26" rx="2" fill={PAL.berry} />
          <rect x="327" y="114" width="8" height="22" rx="2" fill={PAL.sky} />
          <rect x="336" y="118" width="7" height="18" rx="2" fill={PAL.oat} />
          <path d="M356 136 C354 128 356 122 362 120 C368 122 370 128 368 136 Z" fill="#E9D8C1" />
          <path d="M362 120 C360 112 364 106 370 104 M362 120 C360 113 355 109 350 108" stroke={PAL.matcha} strokeWidth="3" strokeLinecap="round" fill="none" />
          <circle cx="382" cy="130" r="6" fill={PAL.yuzu} />
        </g>
      )}

      {/* window */}
      <Window id={id} weather={weather} fairy={has('fairyLights')} />

      {/* hanging pothos */}
      {has('pothos') && (
        <g className={s.sway} style={{ transformOrigin: '120px 0px' }}>
          <path d="M120 0 V26" stroke="#D8C3A5" strokeWidth="2" />
          <path d="M106 26 H134 L130 44 H110 Z" fill={PAL.persimmon} />
          <rect x="104" y="24" width="32" height="6" rx="3" fill={PAL.persimmonShade} />
          <g fill={PAL.matcha}>
            <path d="M112 40 C104 56 106 76 100 96" stroke={PAL.matchaShade} strokeWidth="2" fill="none" />
            <path d="M128 40 C136 54 132 68 138 84" stroke={PAL.matchaShade} strokeWidth="2" fill="none" />
            {[
              [106, 50],
              [102, 66],
              [104, 82],
              [99, 95],
              [133, 50],
              [134, 64],
              [137, 80],
              [120, 44],
            ].map(([x, y], i) => (
              <ellipse key={i} cx={x} cy={y} rx="6" ry="4" transform={`rotate(${i % 2 ? 30 : -30} ${x} ${y})`} fill={i % 3 ? PAL.matcha : PAL.matchaHi} />
            ))}
          </g>
        </g>
      )}

      {/* paper lantern */}
      {has('lantern') && (
        <g className={s.sway} style={{ transformOrigin: '270px 0px' }}>
          <path d="M270 0 V20" stroke="#D8C3A5" strokeWidth="2" />
          <circle className={s.glow} cx="270" cy="42" r="34" fill={C.glow} opacity="0.12" />
          <ellipse cx="270" cy="42" rx="18" ry="22" fill="#FFE2B0" />
          <path d="M256 30 H284 M253 42 H287 M256 54 H284" stroke="#F2C57E" strokeWidth="2" />
          <rect x="262" y="18" width="16" height="4" rx="2" fill={C.woodShade} />
          <rect x="262" y="62" width="16" height="4" rx="2" fill={C.woodShade} />
        </g>
      )}

      {/* floor */}
      <rect y="240" width="480" height="80" fill={C.floor} />
      <g stroke={C.plank} strokeWidth="2">
        <path d="M0 262 H480 M0 288 H480" />
        <path d="M60 240 V262 M190 240 V262 M330 240 V262 M120 262 V288 M260 262 V288 M410 262 V288 M40 288 V320 M200 288 V320 M360 288 V320" />
      </g>
      <rect y="240" width="480" height="5" fill={C.floorDark} opacity="0.7" />

      {/* monstera */}
      {has('monstera') && (
        <g>
          <g fill={PAL.matcha}>
            <path d="M20 200 C-10 190 -14 150 4 132 C20 150 26 176 20 200 Z" fill={PAL.matchaShade} />
            <path d="M22 196 C18 160 34 130 62 124 C66 156 50 184 22 196 Z" />
            <path d="M18 204 C4 176 8 150 26 136" stroke={PAL.matchaShade} strokeWidth="3" fill="none" />
            <path d="M24 204 C40 180 56 176 72 180 C64 196 44 206 24 204 Z" fill={PAL.matchaHi} />
          </g>
          <path d="M4 206 H44 L40 244 H8 Z" fill="#E9D8C1" />
          <rect x="2" y="202" width="44" height="8" rx="4" fill="#D9C4A8" />
        </g>
      )}

      {/* stove + kettle */}
      <g>
        <ellipse cx="78" cy="286" rx="52" ry="6" fill="rgba(0,0,0,0.25)" />
        <rect x="34" y="214" width="88" height="70" rx="10" fill={C.stove} />
        <rect x="34" y="214" width="88" height="10" rx="5" fill={C.stoveHi} />
        <rect x="46" y="236" width="64" height="34" rx="8" fill="#2A2233" />
        <g className={s.shimmer}>
          <rect x="52" y="242" width="52" height="22" rx="6" fill={C.burner} opacity="0.85" />
          <path d="M60 262 C60 252 66 248 68 244 C70 250 74 252 74 262 Z M80 262 C80 250 88 246 90 242 C92 250 96 254 96 262 Z" fill={PAL.honey} />
        </g>
        <rect x="42" y="282" width="10" height="8" rx="3" fill={C.stove} />
        <rect x="104" y="282" width="10" height="8" rx="3" fill={C.stove} />
        <g transform="translate(46 150) scale(1.02)">
          <NookKettle id={id} />
        </g>
        {st > 0.02 && (
          <g transform="translate(52 186)" opacity={0.35 + st * 0.65} stroke="rgba(255,240,225,0.6)" strokeWidth="5" strokeLinecap="round" fill="none">
            <path className={s.steam} d="M0 0 C-8 -10 6 -16 -2 -30" />
            {st > 0.35 && <path className={s.steam} d="M-12 -4 C-20 -14 -6 -20 -14 -34" />}
            {st > 0.7 && <path className={s.steam} d="M10 -6 C2 -16 16 -22 8 -40" />}
          </g>
        )}
      </g>

      {/* books by the stove */}
      {has('books') && (
        <g>
          <rect x="128" y="276" width="42" height="11" rx="3" fill={PAL.sky} />
          <rect x="132" y="266" width="36" height="10" rx="3" fill={PAL.honey} />
          <rect x="126" y="256" width="40" height="10" rx="3" fill={PAL.berry} />
          <path d="M130 259 H162 M134 269 H164 M132 279 H166" stroke={PAL.white} strokeOpacity="0.35" strokeWidth="2" />
        </g>
      )}

      {/* telescope */}
      {has('telescope') && (
        <g>
          <path d="M150 250 L160 214 L170 250 M160 214 V250" stroke={C.woodShade} strokeWidth="4" strokeLinecap="round" />
          <g transform="rotate(-32 160 212)">
            <rect x="140" y="204" width="46" height="14" rx="5" fill="#8E9FB4" />
            <rect x="182" y="202" width="10" height="18" rx="3" fill="#6E8098" />
            <rect x="146" y="206" width="16" height="3" rx="1.5" fill="#C3CEDB" />
          </g>
        </g>
      )}

      {/* rug */}
      <ellipse cx="236" cy="296" rx="112" ry="20" fill="#B85C68" />
      <ellipse cx="236" cy="295" rx="94" ry="14.5" fill="#E09A7E" />
      <ellipse cx="236" cy="294.5" rx="72" ry="9.5" fill="#F3C59C" />

      {/* kotatsu or low table */}
      {has('kotatsu') ? (
        <g>
          <ellipse cx="352" cy="298" rx="62" ry="7" fill="rgba(0,0,0,0.22)" />
          <path d="M292 240 H412 L420 294 C408 300 296 300 284 294 Z" fill="#E7A33E" />
          <path d="M292 240 H412 L414 256 C380 262 324 262 290 256 Z" fill="#F2BC5C" />
          <path d="M306 250 V292 M334 252 V296 M362 252 V296 M390 250 V292" stroke="#D08C2C" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
          <rect x="284" y="230" width="136" height="12" rx="5" fill={C.wood} />
        </g>
      ) : (
        <g>
          <ellipse cx="350" cy="292" rx="56" ry="6" fill="rgba(0,0,0,0.22)" />
          <rect x="302" y="248" width="9" height="42" rx="3" fill={C.woodShade} />
          <rect x="392" y="248" width="9" height="42" rx="3" fill={C.woodShade} />
          <rect x="294" y="238" width="116" height="14" rx="6" fill={C.wood} />
          <rect x="294" y="248" width="116" height="4" fill={C.woodShade} opacity="0.5" />
        </g>
      )}
      {/* on the table */}
      {has('teaSet') ? (
        <g>
          <path d="M318 222 C312 222 308 216 306 210" stroke={PAL.matchaShade} strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M340 206 C354 206 354 226 340 226" stroke={PAL.matchaShade} strokeWidth="4" fill="none" />
          <ellipse cx="330" cy="222" rx="16" ry="14" fill={PAL.matcha} />
          <path d="M320 212 C322 206 338 206 340 212 Z" fill={PAL.matchaShade} />
          <circle cx="330" cy="206" r="3" fill={PAL.honey} />
          <path d="M356 224 H372 C372 232 368 236 364 236 C360 236 356 232 356 224 Z" fill="#F3E6D3" />
          <path d="M378 224 H394 C394 232 390 236 386 236 C382 236 378 232 378 224 Z" fill="#F3E6D3" />
        </g>
      ) : (
        <g>
          <path d="M366 218 C374 218 374 230 366 230" stroke={PAL.persimmonShade} strokeWidth="4" fill="none" />
          <path d="M346 212 H368 V230 C368 234 365 237 361 237 H353 C349 237 346 234 346 230 Z" fill={PAL.persimmon} />
          <ellipse cx="357" cy="212" rx="11" ry="2.6" fill={PAL.tea} />
        </g>
      )}

      {/* record player on a crate */}
      {has('recordPlayer') && (
        <g>
          <rect x="420" y="246" width="50" height="44" rx="5" fill={C.woodShade} />
          <path d="M424 262 H466 M424 276 H466" stroke={C.wood} strokeWidth="3" />
          <rect x="416" y="232" width="58" height="16" rx="5" fill={PAL.berryShade} />
          <ellipse cx="440" cy="232" rx="17" ry="4.5" fill="#2A2233" />
          <ellipse cx="440" cy="232" rx="5" ry="1.5" fill={PAL.honey} />
          <path d="M466 224 L456 232" stroke="#C3CEDB" strokeWidth="2.4" strokeLinecap="round" />
        </g>
      )}

      {/* floor lamp */}
      <g>
        <circle className={s.glow} cx="452" cy="126" r="46" fill={C.glow} opacity="0.2" />
        <rect x="449" y="140" width="6" height="150" rx="3" fill="#2E2638" />
        <ellipse cx="452" cy="290" rx="18" ry="5" fill="#2E2638" />
        <path d="M430 136 L438 100 H466 L474 136 Z" fill="#F9C66E" />
        <path d="M430 136 L438 100 H446 L440 136 Z" fill="#FFE0A6" />
        <rect x="428" y="134" width="48" height="5" rx="2.5" fill="#E4A94C" />
      </g>

      {/* blanket */}
      {has('blanket') && (
        <g>
          <rect x="258" y="276" width="46" height="12" rx="5" fill={PAL.sky} />
          <rect x="262" y="266" width="40" height="11" rx="5" fill={PAL.honey} />
          <path d="M268 266 V277 M278 266 V277 M288 266 V277" stroke={PAL.honeyShade} strokeWidth="2" />
          <path d="M266 276 V288 M278 276 V288 M290 276 V288" stroke={PAL.skyShade} strokeWidth="2" />
        </g>
      )}

      {/* cushion + Chai */}
      {has('cushion') && (
        <g>
          <ellipse cx="214" cy="294" rx="40" ry="10" fill={PAL.berryShade} />
          <ellipse cx="214" cy="289" rx="38" ry="9" fill={PAL.berry} />
          <circle cx="214" cy="289" r="3" fill={PAL.berryShade} />
        </g>
      )}
      {chai && (
        <g transform={`translate(162 ${has('cushion') ? 190 : 200}) scale(0.52)`}>
          <ChaiArt pose={chai} id={`${id}-chai`} />
        </g>
      )}

      {/* tiny visitor */}
      {has('catBed') && (
        <g>
          <ellipse cx="96" cy="306" rx="30" ry="9" fill="#8E9FB4" />
          <ellipse cx="96" cy="302" rx="24" ry="6" fill="#C3CEDB" />
          <ellipse cx="96" cy="298" rx="18" ry="9" fill="#F3E6D3" />
          <circle cx="84" cy="295" r="7" fill="#F3E6D3" />
          <path d="M79 290 L80 284 L84 289 M86 289 L90 285 L89 291" fill="#F3E6D3" stroke="#F3E6D3" strokeWidth="2" strokeLinejoin="round" />
          <path d="M80 296 q2 1.5 4 0 M85 296 q2 1.5 4 0" stroke={PAL.ink} strokeWidth="1.3" fill="none" strokeLinecap="round" />
          <path d="M112 300 C120 296 118 306 108 304" stroke="#E2CDB2" strokeWidth="4" fill="none" strokeLinecap="round" />
        </g>
      )}
    </ArtSvg>
  );
}

function NookKettle({ id }: { id: string }) {
  const body = 'M8 58 C8 40 20 30 36 30 C52 30 64 40 64 58 C64 66 59 70 51 70 H21 C13 70 8 66 8 58 Z';
  return (
    <g>
      <path d="M17 38 C14 12 58 12 55 38" stroke="#9E643D" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M13 58 C7 55 3 48 1 40" stroke={PAL.persimmonShade} strokeWidth="8" fill="none" strokeLinecap="round" />
      <Shaded d={body} id={`${id}-nk`} base={PAL.persimmon} shade={PAL.persimmonShade} dx={-6} dy={-3}>
        <path d="M15 54 C15 46 19 40 25 37" stroke={PAL.persimmonHi} strokeWidth="4.5" strokeLinecap="round" fill="none" />
      </Shaded>
      <path d="M22 33 C24 28 29 26 36 26 C43 26 48 28 50 33 Z" fill={PAL.persimmonShade} />
      <circle cx="36" cy="23" r="5.5" fill={PAL.yuzu} />
    </g>
  );
}

function Window({ id, weather, fairy }: { id: string; weather: NookWeather; fairy: boolean }) {
  const clip = `${id}-win`;
  let wx: ReactNode = null;
  if (weather === 'rain') {
    const drops = Array.from({ length: 26 }, (_, i) => {
      const x = 150 + ((i * 37) % 120);
      const y = 40 + ((i * 53) % 150);
      return <path key={i} d={`M${x} ${y} l-4 12`} />;
    });
    wx = (
      <g className={s.rain} stroke="#9FC3E8" strokeWidth="2.2" strokeLinecap="round" opacity="0.7">
        {drops}
        <g transform="translate(0 -160)">{drops}</g>
      </g>
    );
  } else if (weather === 'snow') {
    const flakes = Array.from({ length: 22 }, (_, i) => {
      const x = 148 + ((i * 41) % 126);
      const y = 40 + ((i * 29) % 150);
      return <circle key={i} cx={x} cy={y} r={i % 3 ? 2.2 : 3} />;
    });
    wx = (
      <g className={s.snow} fill={PAL.white} opacity="0.9">
        {flakes}
        <g transform="translate(0 -160)">{flakes}</g>
      </g>
    );
  }
  return (
    <g>
      {/* curtains back */}
      <rect x="122" y="30" width="176" height="8" rx="4" fill={C.woodShade} />
      <rect x="132" y="40" width="156" height="148" rx="14" fill={C.frameShade} />
      <rect x="138" y="44" width="144" height="138" rx="10" fill={C.sky} />
      <clipPath id={clip}>
        <rect x="138" y="44" width="144" height="138" rx="10" />
      </clipPath>
      <g clipPath={`url(#${clip})`}>
        <rect x="138" y="130" width="144" height="60" fill={C.skyLow} />
        {weather !== 'rain' && (
          <>
            <circle cx="248" cy="78" r="16" fill={C.moon} />
            <circle cx="255" cy="72" r="14" fill={C.sky} opacity={weather === 'snow' ? 0 : 1} />
          </>
        )}
        {weather === 'clear' && (
          <g fill={C.star}>
            <circle cx="160" cy="64" r="2" />
            <circle cx="190" cy="92" r="1.6" />
            <circle cx="212" cy="58" r="2.4" />
            <circle cx="170" cy="120" r="1.4" />
            <circle cx="268" cy="118" r="1.8" />
          </g>
        )}
        {weather === 'rain' && <path d="M138 70 C160 58 180 66 196 60 C214 52 236 62 282 54 V44 H138 Z" fill="#3B4679" />}
        {/* far hills */}
        <path d="M138 168 C170 150 196 160 220 152 C244 144 262 156 282 150 V190 H138 Z" fill="#232B55" />
        {wx}
      </g>
      {/* frame bars */}
      <path d="M210 44 V182 M138 112 H282" stroke={C.frame} strokeWidth="7" />
      <rect x="132" y="40" width="156" height="148" rx="14" fill="none" stroke={C.frame} strokeWidth="7" />
      {/* sill + tiny plant */}
      <rect x="122" y="184" width="176" height="12" rx="5" fill={C.wood} />
      <path d="M264 184 L260 170 H276 L272 184 Z" fill={PAL.oat} />
      <path d="M268 170 C266 160 270 154 276 152 M268 170 C266 162 260 158 254 158" stroke={PAL.matcha} strokeWidth="3.4" strokeLinecap="round" fill="none" />
      {/* curtains */}
      <path d="M116 36 H146 C142 80 150 150 138 206 H112 C118 150 110 80 116 36 Z" fill={C.curtain} />
      <path d="M128 40 C126 90 132 150 124 204" stroke={C.curtainShade} strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M304 36 H274 C278 80 270 150 282 206 H308 C302 150 310 80 304 36 Z" fill={C.curtain} />
      <path d="M292 40 C294 90 288 150 296 204" stroke={C.curtainShade} strokeWidth="4" fill="none" strokeLinecap="round" />
      {fairy && (
        <g>
          <path d="M118 40 Q164 64 210 42 Q256 64 302 40" stroke="#6E5A80" strokeWidth="1.6" fill="none" />
          {[
            [130, 46],
            [148, 53],
            [168, 55],
            [188, 51],
            [230, 51],
            [250, 55],
            [270, 53],
            [290, 46],
          ].map(([x, y], i) => (
            <circle key={i} className={s.twinkle} cx={x} cy={y} r="3.4" fill={[PAL.honey, PAL.berryHi, PAL.skyHi, PAL.matchaHi][i % 4]} />
          ))}
        </g>
      )}
    </g>
  );
}

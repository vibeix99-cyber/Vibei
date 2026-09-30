/**
 * Round-6 MOCKUP ONLY (not wired into the app): the illustrated kettle as the timer.
 * Built from the app's own KettleMark shapes (src/art/Objects.tsx) and palette, scaled up.
 *
 *  progress 0..1  warmth rises inside the body like a fill line (cold oat → brand persimmon),
 *                 the stove glow strengthens, and steam arrives in steps: 0 / 1 / 2 / 3 wisps
 *  whistle        lid lifts, steam jet, notes; motion lines + a small tilt unless reduced motion
 *
 * Every state is a pure function of props, so reduced motion = the same stills without drift/shake.
 */
import { PAL } from '@/art';

const BODY = 'M12.5 46 C12.5 33 20.5 25 32 25 C43.5 25 51.5 33 51.5 46 C51.5 52 47.5 56 41.5 56 H22.5 C16.5 56 12.5 52 12.5 46 Z';
const COLD = '#EBD7BA';
const COLD_SHADE = '#D9C19F';

export function HeroKettle({ progress, whistle = false, reduced = false, size = 260, dark = false }: { progress: number; whistle?: boolean; reduced?: boolean; size?: number; dark?: boolean }) {
  const p = whistle ? 1 : Math.min(1, Math.max(0, progress));
  const level = 56 - 31 * p; // body spans y 25..56 in the mark's 64-box
  const wisps = whistle ? 3 : p < 0.12 ? 0 : p < 0.4 ? 1 : p < 0.75 ? 2 : 3;
  const glow = whistle ? 0.85 : 0.12 + 0.55 * p;
  const tilt = whistle && !reduced ? -4 : 0;
  const id = `hk${Math.round(p * 1000)}${whistle ? 'w' : ''}${dark ? 'd' : ''}`;
  return (
    <svg viewBox="0 0 260 250" width={size} height={(size * 250) / 260} role="img" aria-label={whistle ? 'The kettle is whistling' : `The kettle is ${Math.round(p * 100)}% warm`}>
      <defs>
        <radialGradient id={`${id}-g`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={PAL.honey} stopOpacity="0.9" />
          <stop offset="100%" stopColor={PAL.persimmon} stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${id}-c`}>
          <path d={BODY} />
        </clipPath>
      </defs>

      {/* stove glow + plate */}
      <ellipse cx="148" cy="214" rx="112" ry="30" fill={`url(#${id}-g)`} opacity={glow} />
      <rect x="86" y="214" width="124" height="14" rx="7" fill={dark ? '#1a1220' : '#4A3A48'} />
      {[118, 148, 178].map((x, i) => {
        const h = 3 + 7 * (whistle ? 1 : p) * (i === 1 ? 1.2 : 1);
        return <path key={x} d={`M${x - 5} 214 Q${x} ${214 - h * 1.6} ${x + 5} 214 Z`} fill={i === 1 ? PAL.honey : PAL.persimmon} opacity={0.35 + 0.65 * (whistle ? 1 : p)} />;
      })}

      <g transform={`rotate(${tilt} 148 212)`}>
        <g transform="translate(40 18) scale(3.4)">
          {/* handle + spout (brand colours) */}
          <path d="M19.5 31 C17.5 9 46.5 9 44.5 31" stroke="#9E643D" strokeWidth="5.2" fill="none" strokeLinecap="round" />
          <path d="M17 47 C12 45 8.5 40 6.5 33.5" stroke={p > 0.5 ? PAL.persimmonShade : COLD_SHADE} strokeWidth="6.6" fill="none" strokeLinecap="round" />
          {/* body: cold oat above the warmth line, persimmon below */}
          <g clipPath={`url(#${id}-c)`}>
            <rect x="10" y="20" width="44" height="40" fill={COLD} />
            <rect x="10" y="20" width="12" height="40" fill={COLD_SHADE} opacity="0.5" />
            <path d={`M10 ${level} q5.5 -1.6 11 0 t11 0 t11 0 t11 0 V60 H10 Z`} fill={PAL.persimmon} />
            <path d={`M10 ${level + 0.9} q5.5 -1.6 11 0 t11 0 t11 0 t11 0`} stroke={PAL.persimmonHi} strokeWidth="1" fill="none" opacity={p > 0.02 && p < 0.99 ? 0.9 : 0} />
            <rect x="10" y="20" width="9" height="40" fill={PAL.persimmonShade} opacity={0.55 * p} />
          </g>
          <path d="M18.5 43 C18.5 37 21 33 25.5 30.5" stroke="#FFFFFF" strokeOpacity="0.55" strokeWidth="2.6" strokeLinecap="round" fill="none" />
          <rect x="16" y="52.5" width="32" height="5" rx="2.5" fill={p > 0.5 ? PAL.persimmonShade : COLD_SHADE} />
          {/* lid + yuzu knob (lifts when whistling) */}
          <g transform={whistle ? 'translate(1 -4) rotate(-10 32 26)' : undefined}>
            <rect x="20" y="25.6" width="24" height="4" rx="2" fill={PAL.persimmonShade} />
            <path d="M22 27 C23.3 23.2 27 21.8 32 21.8 C37 21.8 40.7 23.2 42 27 Z" fill={PAL.persimmon} />
            <path d="M33.2 14.6 C35.4 11 40 10.4 42.6 12.1 C40.3 15.1 36.4 15.9 33.2 14.6 Z" fill={PAL.leaf} />
            <circle cx="32" cy="19" r="5.4" fill={PAL.yuzuShade} />
            <circle cx="31.3" cy="18.3" r="4.5" fill={PAL.yuzu} />
            <circle cx="29.9" cy="16.7" r="1.35" fill={PAL.yuzuHi} />
          </g>
        </g>
        {/* steam from the spout tip (~62, 132): stepped, never drifting in stills */}
        {!whistle &&
          [0, 1, 2].slice(0, wisps).map((i) => (
            <path
              key={i}
              d={`M${60 - i * 9} ${124 - i * 4} c-10 -12 8 -20 -2 -34 c-8 -12 6 -20 -1 -32`}
              stroke={dark ? 'rgba(255,245,235,0.75)' : 'rgba(150,120,110,0.55)'}
              strokeWidth={7 - i}
              strokeLinecap="round"
              fill="none"
              opacity={0.55 + 0.45 * p}
            />
          ))}
        {whistle && (
          <g>
            {[
              [52, 112, 14],
              [38, 92, 18],
              [30, 66, 22],
              [44, 42, 17],
              [24, 30, 13],
            ].map(([x, y, r], i) => (
              <circle key={i} cx={x} cy={y} r={r} fill={dark ? 'rgba(255,248,240,0.85)' : 'rgba(255,255,255,0.95)'} stroke={dark ? 'none' : 'rgba(150,120,110,0.25)'} strokeWidth="2" />
            ))}
            {[
              [92, 40],
              [118, 70],
              [70, 18],
            ].map(([x, y], i) => (
              <g key={i} transform={`translate(${x} ${y}) rotate(${i % 2 ? 12 : -10})`} fill={PAL.honeyShade}>
                <ellipse cx="0" cy="14" rx="6" ry="4.6" />
                <rect x="4.2" y="-6" width="2.6" height="20" rx="1.2" />
                <path d="M6.8 -6 q8 3 7 11 q-2 -6 -7 -6 Z" />
              </g>
            ))}
          </g>
        )}
      </g>
      {whistle && !reduced && (
        <g stroke={PAL.persimmon} strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.8">
          <path d="M226 120 q10 12 0 26" />
          <path d="M238 112 q14 18 0 40" />
          <path d="M74 186 q-10 -10 -4 -24" />
        </g>
      )}
    </svg>
  );
}

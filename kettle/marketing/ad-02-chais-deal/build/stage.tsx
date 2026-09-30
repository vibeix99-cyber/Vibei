/**
 * Ad 02 "Chai's deal" edit layer. Every frame is a pure function of the query string.
 *
 *   mode=opening  rise=0..1 (Chai rises over the list) · kettle=0..1 (tiny kettle slid into place)
 *                 collapse=0..1 (the towering list settles into one task card)
 *   mode=caption  text=…  (`*word*` renders in honey, `|` breaks the line) · align=right · size=px
 *   mode=end      t=seconds since the end card began (0 … 2)
 *
 * Chai, the kettle and the wordmark are the app's own components (src/art), never redrawn.
 */
import '@/styles/global.css';
import { createRoot } from 'react-dom/client';
import { Logo, Mascot, PAL } from '@/art';

const q = new URLSearchParams(location.search);
const num = (k: string, d = 0) => Number(q.get(k) ?? d);
const clamp = (v: number) => Math.min(1, Math.max(0, v));
const ease = (k: number) => k * k * (3 - 2 * k);
const easeOutBack = (k: number) => 1 + 2.2 * Math.pow(k - 1, 3) + 1.2 * Math.pow(k - 1, 2);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const root = createRoot(document.getElementById('root')!);

/* ------------------------------------------------------------------ opening */
// Geometry (px in the 1080×1920 frame). Caption band: y 250–470. Platform UI covers y > 1520 and x > 960.
const DESK = 1640; // desk surface starts here
const FRONT = { x0: 170, x1: 870, top: 880, base: 1720 }; // front face of the paper tower
const DEPTH = { dx: 44, dy: -34 }; // top face / side face offset (a thin 3/4 view)
const CARD_TOP = 1400; // where the front edge lands when the tower has settled into one card
const LIFT = 330; // …and the whole desk rises by this much so the card sits mid-frame
const ZOOM = 1.18; // …with a gentle push-in on the card
const CHAI = 400; // Mascot size; its peek pose sits on the bottom edge of its box
const CHAI_X = 510; // Chai's centre
const KETTLE = 164;
const KX = [515, 690]; // tiny kettle: hidden behind Chai's head → beside Chai on the top face

// A fixed, hand-tuned set of row lengths (no text: lettering is added only where it is meant to be read).
const ROWS = [0.78, 0.55, 0.9, 0.62, 0.7, 0.45, 0.84, 0.6, 0.73, 0.5, 0.88, 0.58, 0.67, 0.8, 0.52, 0.74];

function Pencil({ x, y, rot, k = 1 }: { x: number; y: number; rot: number; k?: number }) {
  // A plain yellow pencil (the same pencil as the live-action shot).
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${k})`}>
      <ellipse cx="-20" cy="16" rx="170" ry="7" fill="rgba(20,10,20,0.25)" />
      <rect x="-150" y="-11" width="236" height="22" fill={PAL.honey} />
      <rect x="-150" y="-11" width="236" height="7" fill={PAL.honeyHi} />
      <rect x="-150" y="4" width="236" height="7" fill={PAL.honeyShade} />
      <path d="M86 -11 L136 0 L86 11 Z" fill={PAL.oat} />
      <path d="M86 4 L136 0 L86 11 Z" fill={PAL.oatShade} />
      <path d="M121 -3.3 L136 0 L121 3.3 Z" fill={PAL.ink} />
      <rect x="-176" y="-11" width="28" height="22" fill={PAL.steel} />
      <rect x="-176" y="-11" width="28" height="6" fill={PAL.steelHi} />
      <rect x="-200" y="-11" width="26" height="22" rx="6" fill={PAL.berry} />
      <rect x="-200" y="-11" width="26" height="6" rx="3" fill={PAL.berryHi} />
    </g>
  );
}

function Opening() {
  const rise = clamp(num('rise', 1));
  const kettle = clamp(num('kettle', 0));
  const c = ease(clamp(num('collapse', 0)));
  const top = lerp(FRONT.top, CARD_TOP, c);
  const { x0, x1, base } = FRONT;
  const w = x1 - x0;
  const rowGap = 46;
  // Rows fade out from the top while the edge sinks; the one task fades in on the settled card.
  const rows = ROWS.map((len, i) => {
    const y0 = FRONT.top + 60 + i * rowGap;
    const y = y0 + (top - FRONT.top);
    return { y, len, a: y < base - 40 ? clamp(1 - (c * 2.2 - i * 0.05)) : 0 };
  });
  const notes = clamp(1 - c * 3);
  const label = clamp((c - 0.5) / 0.45);
  const chaiY = top - CHAI + (1 - ease(rise)) * CHAI * 0.75; // Chai's box bottom sits on the front edge
  const kx = lerp(KX[0], KX[1], ease(kettle));
  const sheets = Math.max(0, Math.floor((base - top) / 9));
  const cam = `translate(0px, ${-LIFT * c}px) scale(${lerp(1, ZOOM, c)})`;

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(80% 50% at 50% 50%, #5b3d66 0%, #37263f 55%, #231929 100%)' }}>
      {/* warm lamp light from the upper left */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(60% 34% at 22% 36%, rgba(255,194,61,0.16), transparent 72%)' }} />
      <div style={{ position: 'absolute', inset: 0, transform: cam, transformOrigin: '540px 1300px' }}>
        <svg width="1080" height="2400" viewBox="0 0 1080 2400" style={{ position: 'absolute', left: 0, top: 0 }}>
          {/* desk */}
          <rect x="-200" y={DESK} width="1480" height="900" fill="#7A4A33" />
          <rect x="-200" y={DESK} width="1480" height="10" fill="#94603F" />
          <ellipse cx={540 + 22} cy={base + 4} rx={w * 0.58} ry="20" fill="rgba(20,10,20,0.32)" />
          {/* side face: stacked sheet edges */}
          <path d={`M${x1} ${top} L${x1 + DEPTH.dx} ${top + DEPTH.dy} L${x1 + DEPTH.dx} ${base + DEPTH.dy} L${x1} ${base} Z`} fill={PAL.oatShade} />
          {Array.from({ length: sheets }, (_, i) => {
            const y = top + 9 * (i + 1);
            return <path key={i} d={`M${x1} ${y} L${x1 + DEPTH.dx} ${y + DEPTH.dy}`} stroke={PAL.oat} strokeWidth="2" />;
          })}
          {/* top face */}
          <path d={`M${x0} ${top} L${x0 + DEPTH.dx} ${top + DEPTH.dy} L${x1 + DEPTH.dx} ${top + DEPTH.dy} L${x1} ${top} Z`} fill={PAL.oatHi} />
          {/* front face: the top sheet of the list */}
          <rect x={x0} y={top} width={w} height={base - top} fill={PAL.paper} />
          <rect x={x0} y={top} width={w} height="8" fill="#ffffff" opacity="0.7" />
          <rect x={x0 + 78} y={top} width="3" height={base - top} fill={PAL.berryHi} opacity={0.55 * (1 - c)} />
          {rows.map((r, i) => (
            <g key={i} opacity={r.a}>
              <rect x={x0 + 104} y={r.y - 15} width="30" height="30" rx="8" fill="none" stroke={PAL.oatShade} strokeWidth="4" />
              <rect x={x0 + 160} y={r.y - 7} width={(w - 220) * r.len} height="14" rx="7" fill="#E6D6BF" />
            </g>
          ))}
          <g opacity={notes}>
            <g transform={`translate(${x1 - 70} ${top + 360}) rotate(7)`}>
              <rect x="-80" y="-80" width="160" height="160" rx="6" fill={PAL.honey} />
              <rect x="-80" y="-80" width="160" height="30" rx="6" fill={PAL.honeyShade} opacity="0.45" />
              <rect x="-52" y="-14" width="104" height="12" rx="6" fill={PAL.honeyShade} />
              <rect x="-52" y="16" width="66" height="12" rx="6" fill={PAL.honeyShade} />
            </g>
            <g transform={`translate(${x0 + 10} ${top + 560}) rotate(-8)`}>
              <rect x="-70" y="-70" width="140" height="140" rx="6" fill={PAL.berryHi} />
              <rect x="-46" y="-12" width="92" height="12" rx="6" fill={PAL.berry} />
              <rect x="-46" y="16" width="56" height="12" rx="6" fill={PAL.berry} />
            </g>
          </g>
          {/* the one task, lettered in the edit */}
          <g opacity={label}>
            <rect x={x0 + 56} y={top + 88} width="50" height="50" rx="13" fill="none" stroke={PAL.persimmon} strokeWidth="6.5" />
            <text x={x0 + 136} y={top + 133} fontFamily="Fredoka, var(--font-display)" fontWeight="600" fontSize="66" fill={PAL.ink}>
              Chapter 3 notes
            </text>
          </g>
        </svg>
        {/* Chai rises over the front edge; everything below the edge is hidden behind the list */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: top, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: CHAI_X - CHAI / 2, top: chaiY, width: CHAI, height: CHAI }}>
            <Mascot pose="peek" size={CHAI} animate={false} />
          </div>
          {kettle > 0 && (
            <div style={{ position: 'absolute', left: kx, top: top - 16 - (KETTLE * 57.5) / 64, width: KETTLE, height: KETTLE }}>
              <Logo variant="mark" size={KETTLE} animate={false} />
            </div>
          )}
        </div>
        {/* the pencil lies still on the top of the list, left of Chai */}
        <svg width="1080" height="2400" viewBox="0 0 1080 2400" style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}>
          <Pencil x={262} y={top - 18} rot={-3} k={0.8} />
        </svg>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ caption */
function Caption({ text }: { text: string }) {
  // align=right + size: a smaller pill in the right half, so the kettle's steam on the left stays visible.
  const right = q.get('align') === 'right';
  return (
    <div className="band" style={right ? { left: 430, justifyItems: 'end' } : undefined}>
      <div className="pill" style={q.get('size') ? { fontSize: num('size') } : undefined}>
        {text.split('|').map((l, i) => (
          <div key={i}>{l.split('*').map((part, j) => (j % 2 ? <em key={j}>{part}</em> : part))}</div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ end card */
function EndCard() {
  const t = num('t', 2);
  const k = (from: number, dur: number) => clamp((t - from) / dur);
  const pop = k(0, 0.5);
  const s = pop < 1 ? 0.6 + 0.4 * easeOutBack(pop) : 1;
  const rise = (from: number) => ({ opacity: ease(k(from, 0.4)), transform: `translateY(${(1 - ease(k(from, 0.4))) * 26}px)` });
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(70% 42% at 50% 40%, #5a3a58 0%, #3a2742 45%, #241a2d 100%)' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(40% 24% at 50% 38%, rgba(255,194,61,0.18), transparent 70%)' }} />
      <div style={{ position: 'absolute', left: 540 - 270, top: 380, width: 540, height: 540, opacity: ease(k(0, 0.25)), transform: `scale(${s})`, transformOrigin: '50% 85%' }}>
        <Mascot pose="sip" size={540} animate={false} />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 960, display: 'flex', justifyContent: 'center', ...rise(0.3) }}>
        <Logo variant="full" size={132} animate={false} title="Kettle" />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1150, textAlign: 'center', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 64, color: '#fff9f0', ...rise(0.5) }}>
        A cozy focus timer
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1270, display: 'flex', justifyContent: 'center', ...rise(0.75) }}>
        <div style={{ fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 46, color: '#241a2d', background: '#ffc23d', padding: '16px 40px 18px', borderRadius: 999 }}>
          Follow for launch.
        </div>
      </div>
    </div>
  );
}

const mode = q.get('mode');
if (mode === 'opening') root.render(<Opening />);
else if (mode === 'caption') root.render(<Caption text={q.get('text') ?? ''} />);
else if (mode === 'end') root.render(<EndCard />);
(window as unknown as { __ready: boolean }).__ready = true;

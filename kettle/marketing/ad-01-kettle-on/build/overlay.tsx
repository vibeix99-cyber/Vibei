/** Ad 01 edit layer: captions, time card, tap ripple, end card — with the app's real art components. */
import '@/styles/global.css';
import { createRoot } from 'react-dom/client';
import { Logo, Mascot } from '@/art';

const q = new URLSearchParams(location.search);
const mode = q.get('mode');
const root = createRoot(document.getElementById('root')!);

/** Caption text: `*word*` renders in honey; `|` breaks the line. */
function Caption({ text }: { text: string }) {
  const lines = text.split('|');
  return (
    <div className="band">
      <div className="pill">
        {lines.map((l, i) => (
          <div key={i}>{l.split('*').map((part, j) => (j % 2 ? <em key={j}>{part}</em> : part))}</div>
        ))}
      </div>
    </div>
  );
}

function EndCard() {
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(70% 45% at 50% 42%, #4a3560 0%, #241a2d 70%)' }}>
      <style>{`
        @keyframes pop { 0% { transform: scale(.55); opacity: 0 } 60% { transform: scale(1.06); opacity: 1 } 100% { transform: scale(1) } }
        @keyframes rise { from { transform: translateY(24px); opacity: 0 } to { transform: none; opacity: 1 } }
        .chai { position: absolute; left: 50%; top: 430px; width: 560px; margin-left: -280px; animation: pop .55s cubic-bezier(.2,.8,.3,1.2) both; }
        .word { position: absolute; left: 0; right: 0; top: 1030px; display: flex; justify-content: center; animation: rise .45s .35s ease-out both; }
        .line { position: absolute; left: 0; right: 0; top: 1210px; text-align: center; font-family: var(--font-display); font-weight: 700; font-size: 84px; color: #fff9f0; animation: rise .45s .55s ease-out both; }
        .sub { position: absolute; left: 0; right: 0; top: 1320px; text-align: center; font-family: var(--font-body); font-weight: 700; font-size: 44px; color: #b39af0; animation: rise .45s .7s ease-out both; }
      `}</style>
      <div className="chai"><Mascot pose="wave" size={560} animate title="Chai" /></div>
      <div className="word"><Logo variant="full" size={120} title="Kettle" /></div>
      <div className="line">Put the kettle on.</div>
      <div className="sub">a cozy focus timer</div>
    </div>
  );
}

if (mode === 'caption') root.render(<Caption text={q.get('text') ?? ''} />);
else if (mode === 'scrim') root.render(<div className="scrim" />);
else if (mode === 'time') root.render(<div className="time"><div>25 minutes<br />later…</div></div>);
else if (mode === 'ripple') {
  const k = Number(q.get('k') ?? 0); // 0..1
  const x = Number(q.get('x')), y = Number(q.get('y'));
  root.render(<div className="ripple" style={{ left: x, top: y, transform: `scale(${0.5 + k * 0.9})`, opacity: 1 - k }} />);
} else if (mode === 'end') root.render(<EndCard />);
(window as unknown as { __ready: boolean }).__ready = true;

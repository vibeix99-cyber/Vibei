/**
 * Tab title + dynamic favicon. OWNER: timer area.
 *
 *   "12:34 · Focusing — Kettle"   "4:10 · Tea break — Kettle"   "12:34 · Paused — Kettle"
 *
 * The favicon becomes a small progress ring (persimmon for focus, sky for
 * breaks) around a mug; it is redrawn only when the ring visibly changes.
 * Idle restores the page's own title and `favicon.svg`. Runs in every tab and
 * keeps ticking in background tabs (the ticker is worker-driven), which is the
 * whole point: you can glance at the tab strip.
 */
import { on } from '@/lib/events';
import { subscribeTimerView, getTimerView } from './view';
import type { Phase, TimerView } from './types';

const APP = 'Kettle';

/** "4:10", "12:34", "1:05:09" — no leading zero, never shows 0:00 early (ceil). */
export function compactClock(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}

export function phaseLabel(phase: Phase): string {
  return phase === 'focus' ? 'Focusing' : phase === 'longBreak' ? 'Long tea break' : 'Tea break';
}

/** The tab title for a view, or null when the timer is idle (restore the page's own title). */
export function timerTitle(v: Pick<TimerView, 'status' | 'phase' | 'seconds'>): string | null {
  if (v.status === 'idle') return null;
  const clock = compactClock(v.seconds);
  if (v.status === 'paused') return `${clock} · ${v.phase === 'focus' ? 'Paused' : 'Break paused'} — ${APP}`;
  return `${clock} · ${phaseLabel(v.phase)} — ${APP}`;
}

/** Title shown in a hidden tab right after a phase ends, until the user comes back. */
export function completionTitle(phase: Phase): string {
  return phase === 'focus' ? `Tea’s ready — ${APP}` : `Break’s over — ${APP}`;
}

// ---------- favicon ----------

const FALLBACK = { focus: '#e8612b', break: '#3494d1', track: '#f3e6d3', paused: '#9c8672' };

function cssColor(name: string, fallback: string): string {
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  } catch {
    return fallback;
  }
}

/** Ring quantisation: 60 steps round the circle — redraw only when a step changes. */
export function faviconKey(v: Pick<TimerView, 'status' | 'phase' | 'progress'>): string {
  if (v.status === 'idle') return 'idle';
  return `${v.phase === 'focus' ? 'f' : 'b'}${v.status === 'paused' ? 'p' : 'r'}${Math.floor(v.progress * 60)}`;
}

let canvas: HTMLCanvasElement | null = null;

export function drawFavicon(v: Pick<TimerView, 'status' | 'phase' | 'progress'>): string | null {
  try {
    canvas ??= document.createElement('canvas');
    const S = 64;
    canvas.width = S;
    canvas.height = S;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const paused = v.status === 'paused';
    const tone = paused
      ? FALLBACK.paused
      : v.phase === 'focus'
        ? cssColor('--persimmon', FALLBACK.focus)
        : cssColor('--sky', FALLBACK.break);
    ctx.clearRect(0, 0, S, S);
    const c = S / 2;
    const r = 26;
    // Track
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.strokeStyle = FALLBACK.track;
    ctx.beginPath();
    ctx.arc(c, c, r, 0, Math.PI * 2);
    ctx.stroke();
    // Progress (fills clockwise from the top as the kettle heats)
    const p = Math.min(1, Math.max(0, v.progress));
    if (p > 0.004) {
      ctx.strokeStyle = tone;
      ctx.beginPath();
      ctx.arc(c, c, r, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = tone;
    if (paused) {
      // Pause bars
      roundRect(ctx, 22, 21, 7, 22, 3);
      roundRect(ctx, 35, 21, 7, 22, 3);
    } else {
      // Mug: body + handle
      roundRect(ctx, 19, 23, 21, 20, 5);
      ctx.lineWidth = 4.5;
      ctx.strokeStyle = tone;
      ctx.beginPath();
      ctx.arc(41, 32, 5.5, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
    }
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}

interface IconBackup {
  el: HTMLLinkElement;
  href: string | null;
  type: string | null;
  created: boolean;
}

let backup: IconBackup | null = null;
let lastKey = 'idle';

function defaultFaviconHref(): string {
  return `${import.meta.env.BASE_URL}favicon.svg`;
}

function setFavicon(dataUrl: string): void {
  if (!backup) {
    let el = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
    let created = false;
    if (!el) {
      el = document.createElement('link');
      el.rel = 'icon';
      document.head.appendChild(el);
      created = true;
    }
    backup = { el, href: el.getAttribute('href'), type: el.getAttribute('type'), created };
  }
  backup.el.type = 'image/png';
  backup.el.href = dataUrl;
}

function restoreFavicon(): void {
  if (!backup) return;
  const { el, href, type, created } = backup;
  if (type) el.setAttribute('type', type);
  else el.removeAttribute('type');
  if (href) el.setAttribute('href', href);
  else if (created) {
    el.setAttribute('type', 'image/svg+xml');
    el.setAttribute('href', defaultFaviconHref());
  } else el.removeAttribute('href');
  backup = null;
}

// ---------- wiring ----------

let baseTitle: string | null = null;
let ownTitle: string | null = null;
let pendingDone: Phase | null = null;
let started = false;

function setTitle(t: string | null): void {
  if (t == null) {
    if (baseTitle != null && document.title === ownTitle) document.title = baseTitle;
    baseTitle = null;
    ownTitle = null;
    return;
  }
  if (baseTitle == null) baseTitle = document.title;
  else if (document.title !== ownTitle) baseTitle = document.title; // someone else (route titles) changed it meanwhile
  if (document.title !== t) document.title = t;
  ownTitle = t;
}

function render(v: TimerView): void {
  if (v.status === 'idle' && pendingDone && document.visibilityState === 'hidden') setTitle(completionTitle(pendingDone));
  else {
    if (v.status !== 'idle' || document.visibilityState === 'visible') pendingDone = null;
    setTitle(timerTitle(v));
  }
  const key = faviconKey(v);
  if (key === lastKey) return;
  lastKey = key;
  if (key === 'idle') restoreFavicon();
  else {
    const url = drawFavicon(v);
    if (url) setFavicon(url);
  }
}

export function initTabPresence(): void {
  if (started || typeof document === 'undefined') return;
  started = true;
  const markDone = ({ phase }: { phase: Phase }) => {
    if (document.visibilityState === 'hidden') pendingDone = phase;
  };
  on('timer:complete', markDone);
  on('timer:sync', ({ kind, phase }) => {
    if (kind === 'complete') markDone({ phase });
  });
  subscribeTimerView((v) => render(v));
  document.addEventListener('visibilitychange', () => render(getTimerView()));
  render(getTimerView());
}

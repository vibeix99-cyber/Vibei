/** "25:00", "1:05:09" — for timers. Rounds UP so 0.2s left shows 0:01, never 0:00 early. */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const ss = String(s).padStart(2, '0');
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${ss}`;
  return `${String(m).padStart(2, '0')}:${ss}`;
}

/** "25 min", "1 h 5 min", "45 sec" — human durations. */
export function formatDuration(ms: number, opts: { short?: boolean } = {}): string {
  const totalMin = Math.round(ms / 60000);
  if (ms < 60000) return `${Math.max(0, Math.round(ms / 1000))} sec`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return opts.short ? `${h}h` : `${h} h`;
  return opts.short ? `${h}h ${m}m` : `${h} h ${m} min`;
}

/** Screen-reader friendly: "12 minutes 5 seconds remaining" */
export function spokenDuration(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  const parts: string[] = [];
  if (m) parts.push(`${m} minute${m === 1 ? '' : 's'}`);
  if (s || !m) parts.push(`${s} second${s === 1 ? '' : 's'}`);
  return parts.join(' ');
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

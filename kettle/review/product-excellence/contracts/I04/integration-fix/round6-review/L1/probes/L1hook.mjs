// L1 instrumentation preload (node --import ./L1hook.mjs probe.mjs ...). Leaves the probes' own files unedited.
// - logs /proc/loadavg + `uptime` + UTC at the start (context creation) and end (context close) of every run
// - optionally (L1_VIDEO_DIR) turns on Playwright recordVideo for each context -> $L1_VIDEO_DIR/run<idx>/
// Nothing else is changed: no timers, no events, no input.
import { readFileSync, appendFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
const meta = JSON.parse(process.env.L1_META ?? '{}');
const runlog = process.env.L1_RUNLOG;
const vdir = process.env.L1_VIDEO_DIR;
let n = 0;
const snap = () => ({ utc: new Date().toISOString(), loadavg: readFileSync('/proc/loadavg', 'utf8').trim(), uptime: execSync('uptime').toString().trim() });
function patch(mod) {
  const bt = mod.chromium;
  if (bt.__l1patched) return;
  bt.__l1patched = true;
  const launch = bt.launch.bind(bt);
  bt.launch = async (...a) => {
    const b = await launch(...a);
    const newContext = b.newContext.bind(b);
    b.newContext = async (opts = {}) => {
      const idx = n++;
      const o = { ...opts };
      if (vdir) o.recordVideo = { dir: `${vdir}/run${idx}`, size: { width: o.viewport.width, height: o.viewport.height } };
      const rec = { ...meta, run: idx, pid: process.pid, video: !!vdir, start: snap() };
      const ctx = await newContext(o);
      const close = ctx.close.bind(ctx);
      ctx.close = async (...x) => { rec.end = snap(); if (runlog) appendFileSync(runlog, JSON.stringify(rec) + '\n'); return close(...x); };
      return ctx;
    };
    return b;
  };
}
patch(await import('playwright'));
patch(await import('/home/user/Vibei/kettle/node_modules/playwright/index.mjs'));

// Scratch preload (NODE_OPTIONS=--require): records every console error/warning and page error of every page the
// Playwright test runner opens, tagged with the running test. Does not touch any spec. Output: $TH_CONSOLE_LOG (jsonl).
const fs = require('fs');
const Module = require('module');
const out = process.env.TH_CONSOLE_LOG;
const dbg = (m) => { if (process.env.TH_DBG) process.stderr.write('[th ' + process.pid + '] ' + m + '\n'); };
if (out && !Module.__thLoad) {
  const rec = (o) => { try { fs.appendFileSync(out, JSON.stringify({ t: Date.now(), ...current(), ...o }) + '\n'); } catch {} };
  let cur = null; // the running test, set by the worker's test-info lookup below
  const current = () => {
    try {
      const g = Module._load('/home/user/Vibei/kettle/node_modules/playwright/lib/common/globals.js', module, false);
      const info = g.currentTestInfo();
      if (info) return { file: info.file.split('/').pop(), title: info.title, project: info.project.name };
    } catch (e) { dbg('who failed ' + e.message); }
    return { file: '?', title: '?', project: '?' };
  };
  const hookPage = (page) => {
    if (page.__thHooked) return; page.__thHooked = true;
    page.on('console', (m) => {
      const type = m.type();
      if (type === 'error' || type === 'warning') {
        let loc = ''; try { const l = m.location(); loc = l.url + ':' + l.lineNumber; } catch {}
        rec({ kind: 'console', type, text: m.text().slice(0, 1200), loc });
      }
    });
    page.on('pageerror', (e) => rec({ kind: 'pageerror', text: String((e && e.message) || e).slice(0, 1200) }));
  };
  const hookCtx = (ctx) => { ctx.on('page', hookPage); try { ctx.pages().forEach(hookPage); } catch {} };
  const patched = new WeakSet();
  const patch = (bt) => {
    const proto = Object.getPrototypeOf(bt);
    if (patched.has(proto)) return; patched.add(proto);
    const launch = proto.launch;
    dbg('patching BrowserType.launch');
    proto.launch = async function (...a) {
      const b = await launch.apply(this, a);
      dbg('launched');
      const nc = b.newContext.bind(b); b.newContext = async (...x) => { const c = await nc(...x); hookCtx(c); return c; };
      const np = b.newPage.bind(b); b.newPage = async (...x) => { const p = await np(...x); hookPage(p); return p; };
      return b;
    };
  };
  const load = Module._load;
  Module.__thLoad = load;
  Module._load = function (request, parent, isMain) {
    const r = load.apply(this, arguments);
    try { if (r && r.chromium && typeof r.chromium.launch === 'function') patch(r.chromium); } catch (e) { dbg('patch failed ' + e.message); }
    return r;
  };
}

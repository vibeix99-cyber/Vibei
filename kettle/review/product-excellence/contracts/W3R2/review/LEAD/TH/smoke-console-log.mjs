// LEAD-5 (W3R2 TH): does Chromium's own log (--enable-logging=stderr) carry page console.error lines? A smoke test.
import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-logging=stderr', '--v=0'] });
const p = await b.newPage();
await p.setContent('<script>console.error("LEAD5-SMOKE %s marker", "x"); console.warn("LEAD5-WARN")</script>');
await p.waitForTimeout(300);
await b.close();

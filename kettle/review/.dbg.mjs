import { chromium } from 'playwright';
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
await p.goto('http://127.0.0.1:5190/?debug&seed=fresh&onboarded=0#/welcome', { waitUntil: 'networkidle' }); await p.waitForTimeout(1000);
const dump = async (tag) => console.log(tag, JSON.stringify(await p.evaluate(() => [...document.querySelectorAll('button,[role=radio],[role=option],input')].map(b => `${b.getAttribute('role')||b.tagName.toLowerCase()}:${(b.getAttribute('aria-label')||b.innerText||b.placeholder||'').trim().replace(/\s+/g,' ').slice(0,40)}${b.disabled||b.getAttribute('aria-disabled')==='true'?'[dis]':''}`))));
await p.getByRole('button', { name: /get started/i }).click(); await p.waitForTimeout(900); await dump('name');
await p.locator('input').first().fill('Robin'); await p.waitForTimeout(200); await dump('name-filled');

import { launch, newCtx, shot, facts } from './lib.mjs';
const base = process.argv[2];
const b = await launch();
const ctx = await newCtx(b, { vw: 390, vh: 844 });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('pageerror', e.message));
await page.goto(`${base}/?debug&seed=fresh&theme=light#/`); await page.waitForFunction(() => window.__kettle); await page.waitForTimeout(800);
await page.getByRole('button', { name: /set things up first/i }).click(); await page.waitForTimeout(800);
console.log('name', JSON.stringify(await facts(page)), (await page.locator('button,input').evaluateAll(e=>e.map(x=>x.tagName+':'+(x.innerText||x.placeholder||x.getAttribute('aria-label'))))).join('|'));
await page.locator('input').first().fill('Robin'); 
for (let i=0;i<7;i++){
  const btns = await page.locator('button').evaluateAll(e=>e.map(x=>x.innerText.replace(/\n/g,' ')));
  console.log(i, await page.evaluate(()=>document.querySelector('[data-step]')?.dataset.step), JSON.stringify((await facts(page)).chai.map(c=>c.pose+':'+c.box.join(','))), btns.join('|'));
  await page.screenshot({path:`/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/w3r3/k-w${i}.png`});
  const step = await page.evaluate(()=>document.querySelector('[data-step]')?.dataset.step);
  if (step==='goal') await page.getByRole('radio').first().click().catch(()=>{});
  if (step==='rhythm') await page.getByRole('radio').first().click().catch(()=>{});
  if (step==='ambience') await page.getByRole('radio').first().click().catch(()=>{});
  const cont = page.getByRole('button', { name: /^(continue|next|skip|not now|let.?s go|put the kettle on)/i }).first();
  await page.waitForTimeout(300);
  if (await cont.count()) await cont.click(); else break;
  await page.waitForTimeout(900);
}
await b.close();

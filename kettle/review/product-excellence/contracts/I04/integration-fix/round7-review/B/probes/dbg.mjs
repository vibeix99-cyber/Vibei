// Lane B debug (setup check): which app save fails with storage full and raises the warning.
import { launch, newCtx, open, seedAndFill, sleep, WARN_FN } from './blib.mjs';
const b = await launch();
const ctx = await newCtx(b, { W: 375, H: 667, text: 100, theme: 'light' });
const p = await ctx.newPage();
p.on('console', (m) => { if (m.type() === 'error') console.log('console', m.text().slice(0, 200)); });
await open(p, process.argv[2], 'light');
console.log('fill', await seedAndFill(p));
const st = async (label) => console.log(label, JSON.stringify(await p.evaluate((WF) => ({ w: !!eval(WF)(), writes: window.__obs.writes.slice(-4), ev: window.__obs.warnEv, said: window.__obs.said }), WARN_FN)));
await st('after fill');
console.log('timer keys', await p.evaluate(() => Object.keys(window.__kettle).join(',')));
await p.evaluate(() => window.__kettle.timer.setState({})); await sleep(1500); await st('timer.setState({})');
await p.evaluate(() => window.__kettle.progress.setState({})); await sleep(1500); await st('progress.setState({})');
await p.evaluate(() => { const k = window.__kettle; k.settings.getState().set({ name: k.settings.getState().name }); }); await sleep(1500); await st('settings same name');
await p.evaluate(() => { const k = window.__kettle; k.timer.setState({ lastIntent: 'x' }); }); await sleep(1500); await st('timer lastIntent');
await b.close();

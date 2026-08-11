// CRITIC HARNESS (4b) — clean ducking test. Fire cues that carry almost no
// energy below 200 Hz, then measure the MIX's sub-200 Hz band (which can only
// be the music) against the bed-only render. A duck shows as a bass drop.
import { chromium } from 'playwright';
const PORT = 8813;
const b = await chromium.launch({ args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage();
await p.goto(`http://127.0.0.1:${PORT}/index.html`,{waitUntil:'domcontentloaded'});
await p.waitForFunction(()=>window.__ARENA&&window.__ARENA.ready,null,{timeout:60000});
await p.evaluate(()=>window.__ARENA.ready);
const R = await p.evaluate(async () => {
  const lab = await import('/tests/critic/audiolab.js');
  const SR = lab.SR, DUR = 5.0;
  const mono=(x)=>{const L=x.getChannelData(0),Rr=x.getChannelData(1),n=L.length,o=new Float32Array(n);for(let i=0;i<n;i++)o[i]=(L[i]+Rr[i])/2;return o;};
  // 4th-order-ish lowpass: 4 cascaded one-poles at 200 Hz
  const lp=(x,fc)=>{const a=Math.exp(-2*Math.PI*fc/SR);const o=new Float32Array(x.length);let s1=0,s2=0,s3=0,s4=0;
    for(let i=0;i<x.length;i++){s1=a*s1+(1-a)*x[i];s2=a*s2+(1-a)*s1;s3=a*s3+(1-a)*s2;s4=a*s4+(1-a)*s3;o[i]=s4;}return o;};
  const rms=(x,i0,i1)=>{let s=0;for(let i=i0;i<i1;i++)s+=x[i]*x[i];return Math.sqrt(s/(i1-i0));};
  const db=(v)=>+(20*Math.log10(v+1e-12)).toFixed(2);
  const bed = mono(await lab.render((A)=>A.scheduleMusicOffline('battle',DUR,0.6),DUR,{seed:31}));
  const bedLo = lp(bed,200);
  const out={};
  for (const k of ['super','ui_select','text_blip','crit','heal','shield','miss','ui_move']) {
    const cue = mono(await lab.render((A)=>A.sfx(k),2.5,{seed:31}));
    const cueLo = lp(cue,200);
    const mix = mono(await lab.render((A)=>{A.scheduleMusicOffline('battle',DUR,0.6);A.sfx(k);},DUR,{seed:31}));
    const mixLo = lp(mix,200);
    const w=[[0.02,0.25],[0.25,0.8]];
    const row={cueBassLeak_dbBelowBed:null};
    row.cueBassLeak_dbBelowBed = +(db(rms(cueLo,Math.floor(0.02*SR),Math.floor(0.25*SR))) - db(rms(bedLo,Math.floor(0.02*SR),Math.floor(0.25*SR)))).toFixed(2);
    for (const [a0,a1] of w) {
      const i0=Math.floor(a0*SR), i1=Math.floor(a1*SR);
      row[`bass ${a0}-${a1}s`] = { bed: db(rms(bedLo,i0,i1)), mix: db(rms(mixLo,i0,i1)), delta: +(db(rms(mixLo,i0,i1))-db(rms(bedLo,i0,i1))).toFixed(2) };
    }
    out[k]=row;
  }
  return out;
});
console.log('DUCK TEST — sub-200 Hz band of the mix vs bed-only. Music owns this band.');
console.log('If the music ducks, delta goes clearly negative while the cue plays.\n');
console.log('cue         cueBassLeak   bass .02-.25s (bed/mix/delta)     bass .25-.8s (bed/mix/delta)');
for (const [k,v] of Object.entries(R)) {
  const a=v['bass 0.02-0.25s'], c=v['bass 0.25-0.8s'];
  console.log(`  ${k.padEnd(11)} ${String(v.cueBassLeak_dbBelowBed).padStart(7)} dB   ${String(a.bed).padEnd(8)}${String(a.mix).padEnd(8)}${String(a.delta).padStart(6)}          ${String(c.bed).padEnd(8)}${String(c.mix).padEnd(8)}${String(c.delta).padStart(6)}`);
}
await b.close();

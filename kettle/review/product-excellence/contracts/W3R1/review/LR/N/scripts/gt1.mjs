import { readFileSync } from 'node:fs';
const { PNG } = (await import('playwright-core/lib/utilsBundle')).default ?? (await import('playwright-core/lib/utilsBundle'));
const [fa, fb] = process.argv.slice(2); const A = PNG.sync.read(readFileSync(fa)), B = PNG.sync.read(readFileSync(fb)); const W = A.width;
let x0=1e9,x1=-1,y0=1e9,y1=-1,n=0; for (let i=0;i<W*A.height;i++){const o=i*4; let d=0; for(let c=0;c<4;c++) d=Math.max(d,Math.abs(A.data[o+c]-B.data[o+c])); if(d>2){n++; const x=i%W,y=(i-x)/W; x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}}
console.log(JSON.stringify({above2:n,bbox:[x0,y0,x1,y1]}));

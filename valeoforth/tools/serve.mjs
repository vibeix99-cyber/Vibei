// Minimal static server: node tools/serve.mjs <dir> <port>
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const dir = path.resolve(process.argv[2] ?? 'dist'); const port = Number(process.argv[3] ?? 4173);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.woff2': 'font/woff2', '.json': 'application/json', '.txt': 'text/plain', '.xml': 'application/xml' };
http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(dir, p); if (!f.startsWith(dir)) { res.writeHead(403); return res.end(); }
  fs.readFile(f, (e, buf) => {
    if (e) { const nf = path.join(dir, '404.html'); res.writeHead(404, { 'content-type': types['.html'] }); return fs.existsSync(nf) ? res.end(fs.readFileSync(nf)) : res.end('not found'); }
    res.writeHead(200, { 'content-type': types[path.extname(f)] ?? 'application/octet-stream', 'cache-control': 'no-store' }); res.end(buf);
  });
}).listen(port, () => console.log(`http://localhost:${port}/`));

// node hooks-audit.cjs <file.tsx> : lists every hook call (use[A-Z]...) with the function it is in and whether it is
// conditional (if / ?: / right side of && || ??), in a loop, in a switch case, in try, in a nested function, or after an
// early return. A rules-of-hooks check over the AST, not a substitute for reading the code.
const fs = require('fs');
const root = '/home/user/Vibei/kettle/node_modules/';
const { parse } = require(root + '@babel/parser');
const traverse = require(root + '@babel/traverse').default;
const file = process.argv[2];
const ast = parse(fs.readFileSync(file, 'utf8'), { sourceType: 'module', plugins: ['jsx', 'typescript'] });
const isHook = (n) => n.type === 'CallExpression' && ((n.callee.type === 'Identifier' && /^use[A-Z0-9]/.test(n.callee.name)) || (n.callee.type === 'MemberExpression' && n.callee.property.type === 'Identifier' && /^use[A-Z0-9]/.test(n.callee.property.name)));
const nameOf = (fp) => fp.node.id?.name || (fp.parent.type === 'VariableDeclarator' ? fp.parent.id.name : null);
const rows = [];
traverse(ast, {
  CallExpression(p) {
    if (!isHook(p.node)) return;
    const hook = p.node.callee.name || p.node.callee.property.name;
    const flags = [];
    let fn = null;
    for (let a = p; a; a = a.parentPath) {
      const par = a.parentPath; if (!par) break;
      const n = par.node, key = a.key;
      if (/Function/.test(n.type) && !fn) { fn = par; break; }
      if (n.type === 'IfStatement' && key !== 'test') flags.push('if');
      if (n.type === 'ConditionalExpression' && key !== 'test') flags.push('?:');
      if (n.type === 'LogicalExpression' && key === 'right') flags.push(n.operator + '-right');
      if (/^(For|ForIn|ForOf|While|DoWhile)Statement$/.test(n.type)) flags.push('loop');
      if (n.type === 'SwitchCase') flags.push('switch');
      if (n.type === 'TryStatement') flags.push('try');
      if (n.type === 'CatchClause') flags.push('catch');
    }
    if (!fn) return;
    // nested function? (the nearest function must be the component/hook itself)
    const fname = nameOf(fn);
    const owner = fn;
    let early = false;
    // an earlier `return` anywhere in the owner's own body (not in nested functions), before this call
    fn.traverse({ Function(q) { q.skip(); }, ReturnStatement(q) { if (q.node.end <= p.node.start && q.getFunctionParent() === owner) early = true; } });
    if (early) flags.push('after-return');
    const comp = /^[A-Z]/.test(fname || '') || /^use[A-Z]/.test(fname || '');
    if (!comp) flags.push('in-non-component:' + (fname || 'anonymous'));
    rows.push({ line: p.node.loc.start.line, fn: fname || '(anonymous)', hook, flags });
  },
});
const bad = rows.filter((r) => r.flags.length);
for (const r of rows) console.log(`${file.split('/').pop()}:${r.line}  ${r.fn}  ${r.hook}${r.flags.length ? '  <-- ' + r.flags.join(',') : ''}`);
console.log(`${rows.length} hook calls, ${bad.length} flagged`);

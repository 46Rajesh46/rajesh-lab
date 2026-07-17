// Prove a .real file contains zero JavaScript: strip comments and string
// literals (HTML/CSS lives in strings), then hunt for JS constructs.
const fs = require('fs');
const src = fs.readFileSync(process.argv[2], 'utf8');
const noComments = src.split(/\r?\n/).filter((l) => !l.trim().startsWith('#')).join('\n');
const code = noComments.replace(/"(?:[^"\\]|\\.)*"/gs, '"STR"');

const JS = [
  ['arrow function  =>', /=>/g],
  ['method call     .map/.filter/.sort/...', /\.(map|filter|sort|some|find|findIndex|slice|split|replace|includes|toLowerCase|join|push)\s*\(/g],
  ['constructor     new X', /\bnew\s+[A-Z]/g],
  ['require()', /\brequire\s*\(/g],
  ['process.env', /process\.env/g],
  ['req/res internals', /\b(req|res)\./g],
  ['function keyword', /\bfunction\b/g],
  ['const/var', /\b(const|var)\b/g],
  ['return', /\breturn\b/g],
];
let bad = 0;
for (const [name, re] of JS) {
  const hits = (code.match(re) || []).length;
  if (hits) { bad += hits; console.log('  ' + name + ': ' + hits + '  <-- JavaScript!'); }
}
console.log(bad ? '  TOTAL JavaScript constructs: ' + bad : '  ZERO JavaScript constructs. 100% RealScript.');

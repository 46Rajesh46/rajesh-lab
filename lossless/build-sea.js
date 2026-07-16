// build-sea.js — bundle the CLI + its modules into ONE file for Node's
// Single Executable Application feature (SEA runs a single script).
// A tiny inline module registry lets the bundled files require each other;
// anything else falls through to Node's real require (built-ins).
'use strict';
const fs = require('fs');
const MODS = ['cm.js', 'lpaq.js', 'router.js', 'archive.js', 'enc.js', 'bench.js', 'rz.js'];

let out = `// AUTO-GENERATED — do not edit. Bundle of: ${MODS.join(', ')}
'use strict';
const __mods = {}, __cache = {};
function __def(n, f) { __mods[n] = f; }
function __req(n) {
  if (__mods[n]) {
    if (__cache[n]) return __cache[n].exports;
    const m = { exports: {} }; __cache[n] = m; __mods[n](m, m.exports, __req); return m.exports;
  }
  return require(n);
}
`;
for (const m of MODS) {
  const body = fs.readFileSync('./' + m, 'utf8').replace(/^#!.*\n/, '');
  out += `__def(${JSON.stringify('./' + m)}, function (module, exports, require) {\n${body}\n});\n`;
}
out += `__req('./rz.js');\n`;
fs.writeFileSync('rz.sea.js', out);
console.log('wrote rz.sea.js (' + out.length + ' bytes)');

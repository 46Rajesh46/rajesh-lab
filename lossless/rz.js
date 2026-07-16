#!/usr/bin/env node
// rz — lossless compressor CLI. Compress/restore with the best-of-all codecs,
// or benchmark against gzip/brotli/xz/zstd. See FORMAT.md for the .rz spec.
'use strict';
const fs = require('fs'), path = require('path');
const { pack, unpack } = require('./router.js');
const { createArchive, listArchive, extractAll } = require('./archive.js');
const { encrypt, decrypt, isEncrypted } = require('./enc.js');
const bench = require('./bench.js');

const human = (n) => n >= 1e6 ? (n / 1e6).toFixed(2) + ' MB' : n >= 1e3 ? (n / 1e3).toFixed(1) + ' KB' : n + ' B';

// pull an optional password flag (-p / --password PASSWORD) out of argv
let password = null;
const raw = process.argv.slice(2), args = [];
for (let i = 0; i < raw.length; i++) {
  if (raw[i] === '-p' || raw[i] === '--password') password = raw[++i];
  else args.push(raw[i]);
}
const [cmd, a, b] = args;
const seal = (buf) => password ? encrypt(buf, password) : buf;
const open = (buf) => {
  if (isEncrypted(buf)) { if (!password) throw new Error('this .rz is encrypted — add -p <password>'); return decrypt(buf, password); }
  return buf;
};

function usage() {
  console.log(`rz — lossless compressor (best-of-all-codecs)

  rz pack   <file> [out.rz]        compress one file
  rz unpack <file.rz> [out]        restore one file, byte-for-byte
  rz a <archive.rz> <files...>     create a multi-file archive
  rz l <archive.rz>                list an archive's contents
  rz x <archive.rz> [out-dir]      extract an archive (default: current dir)
  rz bench  <file|folder>          compare vs gzip / brotli / xz / zstd
  rz ui                            open the graphical File Manager (GUI)

  add  -p <password>  to any pack/unpack/a/l/x to AES-256 encrypt/decrypt.
Install external codecs (optional) to add them to the lineup: zstd, xz.`);
}

// keep extraction inside the target dir (no path traversal)
function safeJoin(dir, name) {
  const dest = path.resolve(dir, name);
  if (dest !== path.resolve(dir) && !dest.startsWith(path.resolve(dir) + path.sep)) throw new Error('unsafe path: ' + name);
  return dest;
}

try {
if (cmd === 'pack') {
  if (!a) { usage(); process.exit(1); }
  const inp = fs.readFileSync(a), out = b || a + '.rz', p = pack(inp);
  const bytes = seal(p.bytes);
  fs.writeFileSync(out, bytes);
  console.log(`packed ${a} (${human(inp.length)}) -> ${out} (${human(bytes.length)})  ${(inp.length / bytes.length).toFixed(2)}x  via ${p.name}${password ? ' + encrypted' : ''}`);
} else if (cmd === 'unpack') {
  if (!a) { usage(); process.exit(1); }
  const out = b || (a.endsWith('.rz') ? a.slice(0, -3) : a + '.out');
  fs.writeFileSync(out, unpack(open(fs.readFileSync(a))));
  console.log(`restored ${a} -> ${out}`);
} else if (cmd === 'a') {
  const arch = a, inputs = args.slice(2);
  if (!arch || !inputs.length) { usage(); process.exit(1); }
  const files = inputs.map((f) => ({ name: path.basename(f), buf: fs.readFileSync(f) }));
  const out = seal(createArchive(files));
  fs.writeFileSync(arch, out);
  const orig = files.reduce((s, f) => s + f.buf.length, 0);
  console.log(`archived ${files.length} file(s) (${human(orig)}) -> ${arch} (${human(out.length)})  ${(orig / out.length).toFixed(2)}x${password ? ' + encrypted' : ''}`);
} else if (cmd === 'l') {
  if (!a) { usage(); process.exit(1); }
  const entries = listArchive(open(fs.readFileSync(a)));
  console.log(`${a} — ${entries.length} file(s)\n`);
  for (const e of entries) console.log(`  ${human(e.origLen).padStart(9)} -> ${human(e.compLen).padStart(9)}  ${(e.origLen / e.compLen).toFixed(2)}x  ${e.name}`);
} else if (cmd === 'x') {
  if (!a) { usage(); process.exit(1); }
  const outDir = b || '.';
  const files = extractAll(open(fs.readFileSync(a)));
  for (const f of files) {
    const dest = safeJoin(outDir, f.name);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, f.buf);
    console.log('  ' + f.name);
  }
  console.log(`extracted ${files.length} file(s) -> ${path.resolve(outDir)}`);
} else if (cmd === 'bench') {
  if (!a) { usage(); process.exit(1); }
  bench.run(a);
} else if (cmd === 'ui') {
  require('./ui.js');                       // starts the 7-Zip-style GUI + opens the browser
} else usage();
} catch (e) { console.error('rz: ' + e.message); process.exit(1); }

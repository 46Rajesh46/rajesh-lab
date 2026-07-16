#!/usr/bin/env node
// rz — lossless compressor CLI. Compress/restore with the best-of-all codecs,
// or benchmark against gzip/brotli/xz/zstd. See FORMAT.md for the .rz spec.
'use strict';
const fs = require('fs');
const { pack, unpack } = require('./router.js');
const bench = require('./bench.js');

const human = (n) => n >= 1e6 ? (n / 1e6).toFixed(2) + ' MB' : n >= 1e3 ? (n / 1e3).toFixed(1) + ' KB' : n + ' B';
const [cmd, a, b] = process.argv.slice(2);

function usage() {
  console.log(`rz — lossless compressor (best-of-all-codecs)

  rz pack   <file> [out.rz]     compress (auto-picks the smallest codec)
  rz unpack <file.rz> [out]     restore, byte-for-byte
  rz bench  <file|folder>       compare vs gzip / brotli / xz / zstd

Install external codecs (optional) to add them to the lineup: zstd, xz.`);
}

if (cmd === 'pack') {
  if (!a) { usage(); process.exit(1); }
  const inp = fs.readFileSync(a), out = b || a + '.rz', p = pack(inp);
  fs.writeFileSync(out, p.bytes);
  console.log(`packed ${a} (${human(inp.length)}) -> ${out} (${human(p.bytes.length)})  ${(inp.length / p.bytes.length).toFixed(2)}x  via ${p.name}`);
} else if (cmd === 'unpack') {
  if (!a) { usage(); process.exit(1); }
  const out = b || (a.endsWith('.rz') ? a.slice(0, -3) : a + '.out');
  fs.writeFileSync(out, unpack(fs.readFileSync(a)));
  console.log(`restored ${a} -> ${out}`);
} else if (cmd === 'bench') {
  if (!a) { usage(); process.exit(1); }
  bench.run(a);
} else usage();

// router.js — a "try-all, keep-smallest" ensemble compressor.
// For each input it runs EVERY available codec, keeps the smallest, and writes a
// 1-byte tag so decompression knows which decoder to use. Result is >= the best
// single tool on every input. Load-heavy on purpose ("let the system take the load").
// Lossless — every round-trip is proven byte-for-byte with SHA-256.
//
//   node lossless/router.js --selftest
//   node lossless/router.js <file>              # show which codec wins + verify
//   node lossless/router.js pack   <in> <out>   # write the smallest encoding
//   node lossless/router.js unpack <in> <out>   # restore it
'use strict';
const zlib = require('zlib'), crypto = require('crypto'), cp = require('child_process'), fs = require('fs');
const cm = require('./cm.js');

const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');

// Wrap an external CLI codec (zstd/xz/…). Returns null if the tool isn't installed
// or fails — so the router silently skips unavailable codecs.
function ext(bin, cArgs, dArgs) {
  const run = (args, buf) => {
    const r = cp.spawnSync(bin, args, { input: buf, maxBuffer: 1 << 30 });
    return (r.error || r.status !== 0) ? null : r.stdout;
  };
  return { c: (b) => run(cArgs, b), d: (b) => run(dArgs, b) };
}

// tag byte -> codec. Order doesn't matter; the smallest output wins.
const CODECS = [
  { tag: 0, name: 'store',  c: (b) => b,                          d: (b) => b },
  { tag: 1, name: 'gzip',   c: (b) => zlib.gzipSync(b, { level: 9 }), d: (b) => zlib.gunzipSync(b) },
  { tag: 2, name: 'brotli', c: (b) => zlib.brotliCompressSync(b), d: (b) => zlib.brotliDecompressSync(b) },
  { tag: 3, name: 'cm',     c: (b) => cm.compress(b),             d: (b) => cm.decompress(b) },
  { tag: 4, name: 'zstd',   ...ext('zstd', ['-19', '-c'], ['-d', '-c']) },
  { tag: 5, name: 'xz',     ...ext('xz', ['-9', '-c'], ['-dc']) },
];
const byTag = Object.fromEntries(CODECS.map((c) => [c.tag, c]));

// Try every codec, return the smallest tagged encoding: [tag byte][payload].
function pack(buf) {
  let best = null;
  for (const codec of CODECS) {
    let out;
    try { out = codec.c(buf); } catch (e) { out = null; }
    if (out == null) continue;                       // unavailable / failed
    if (!best || out.length < best.out.length) best = { codec, out };
  }
  return { tag: best.codec.tag, name: best.codec.name,
           bytes: Buffer.concat([Buffer.from([best.codec.tag]), best.out]) };
}
function unpack(data) { return byTag[data[0]].d(data.subarray(1)); }

// --- reporting ---
function trySizes(buf) {
  return CODECS.map((c) => {
    let out; try { out = c.c(buf); } catch (e) { out = null; }
    return { name: c.name, len: out == null ? null : out.length + 1 };  // +1 tag byte
  });
}
function report(label, buf) {
  const rows = trySizes(buf);
  const best = rows.filter((r) => r.len != null).reduce((a, b) => (b.len < a.len ? b : a));
  const restored = unpack(pack(buf).bytes);
  const ok = sha(buf) === sha(restored);
  console.log('\n' + label + '  (' + buf.length + ' B)   router zero-loss: ' + (ok ? '✓' : '✗ FAIL'));
  for (const r of rows) {
    const tag = r.len == null ? '  (not installed)' : String(r.len).padStart(9) + ' B' + (r.name === best.name ? '   <-- WINNER' : '');
    console.log('  ' + r.name.padEnd(7) + tag);
  }
}

function selftest() {
  const cases = [
    ['empty', Buffer.alloc(0)],
    ['one byte', Buffer.from([42])],
    ['repetitive text', Buffer.from('ab '.repeat(2000))],
    ['random (incompressible)', crypto.randomBytes(4000)],
    ['source code', fs.readFileSync(__filename)],
  ];
  for (const [name, buf] of cases) {
    const p = pack(buf);
    if (sha(buf) !== sha(unpack(p.bytes))) throw new Error('FAIL: lost data on ' + name);
  }
  console.log('router selftest ✓ — try-all/keep-smallest round-trips byte-for-byte on all cases.');
}

if (require.main === module) {
  const [a, b, c] = process.argv.slice(2);
  if (a === '--selftest') selftest();
  else if (a === 'pack')   { const p = pack(fs.readFileSync(b)); fs.writeFileSync(c, p.bytes); console.log('packed with ' + p.name + ' -> ' + p.bytes.length + ' B'); }
  else if (a === 'unpack') { fs.writeFileSync(c, unpack(fs.readFileSync(b))); console.log('restored -> ' + c); }
  else if (a)              report(a, fs.readFileSync(a));
  else console.log('usage: --selftest | <file> | pack <in> <out> | unpack <in> <out>');
}
module.exports = { pack, unpack, CODECS };

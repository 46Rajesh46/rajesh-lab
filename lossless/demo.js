// demo.js — lossless compression, proven byte-for-byte with a SHA-256 round-trip.
// Zero deps: Node's built-in zlib gives gzip + brotli.
// run:  node lossless/demo.js        |  node lossless/demo.js --selftest
'use strict';
const zlib = require('zlib'), crypto = require('crypto');

const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');

const CODECS = {
  gzip:   { c: (b) => zlib.gzipSync(b, { level: 9 }), d: (b) => zlib.gunzipSync(b) },
  brotli: { c: (b) => zlib.brotliCompressSync(b),     d: (b) => zlib.brotliDecompressSync(b) },
};

// Compress, decompress, and confirm the result equals the input by hash.
function roundtrip(name, data) {
  const { c, d } = CODECS[name];
  const packed = c(data);
  const back = d(packed);
  const zeroLoss = sha(data) === sha(back);          // the ONLY definition of "zero loss"
  return { name, inBytes: data.length, outBytes: packed.length,
           ratio: (100 * packed.length / data.length).toFixed(1) + '%', zeroLoss };
}

function report(label, data) {
  console.log('\n' + label + '  (' + data.length + ' bytes)');
  for (const name of Object.keys(CODECS)) {
    const r = roundtrip(name, data);
    console.log('  ' + name.padEnd(7) + '-> ' + String(r.outBytes).padStart(7) + ' bytes  ' +
      r.ratio.padStart(6) + '   zero-loss: ' + (r.zeroLoss ? '✓' : '✗ FAIL'));
  }
}

function selftest() {
  const text = Buffer.from('the quick brown fox '.repeat(500));   // repetitive -> compresses well
  const rand = crypto.randomBytes(20000);                          // random -> cannot compress
  for (const name of Object.keys(CODECS)) {
    if (!roundtrip(name, text).zeroLoss) throw new Error('FAIL: ' + name + ' lost data on text');
    if (!roundtrip(name, rand).zeroLoss) throw new Error('FAIL: ' + name + ' lost data on random');
  }
  // Pigeonhole in action: random data does NOT shrink (proves no free lunch).
  if (roundtrip('gzip', rand).outBytes <= rand.length * 0.98)
    throw new Error('FAIL: random data unexpectedly shrank — impossible');
  console.log('lossless selftest ✓ — gzip + brotli round-trip byte-for-byte; random data does not shrink.');
}

if (require.main === module) {
  if (process.argv[2] === '--selftest') selftest();
  else {
    report('Repetitive text', Buffer.from('the quick brown fox '.repeat(500)));
    report('Random bytes (incompressible)', crypto.randomBytes(20000));
  }
}
module.exports = { roundtrip };

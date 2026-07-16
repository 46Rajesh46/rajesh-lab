// cm.js — a real context-model arithmetic compressor (the mechanism that beats gzip
// and, scaled up, is how cmix/PAQ beat 7zip). Order-3 bitwise model + binary
// arithmetic (range) coder. Pure JS, zero deps. Lossless — proven by SHA-256.
//
//   node lossless/cm.js --selftest
//   node lossless/cm.js <file>      # compare cm vs gzip vs brotli on a real file
'use strict';
const zlib = require('zlib'), crypto = require('crypto'), fs = require('fs');

const CTXBITS = 22, SIZE = 1 << CTXBITS;   // 4M contexts (8 MB table)

// Predicts one bit at a time from a hash of the last 3 bytes + the partial byte.
class Model {
  constructor() { this.t = new Uint16Array(SIZE).fill(32768); this.h3 = 0; this.c0 = 1; this.ci = 0; }
  p() {                                     // 12-bit P(next bit = 1), in [1,4095]
    let x = Math.imul(this.h3, 0x9E3779B1) ^ Math.imul(this.c0, 0x85EBCA77);
    this.ci = (x >>> (32 - CTXBITS));
    const v = this.t[this.ci] >> 4;
    return v < 1 ? 1 : v > 4095 ? 4095 : v;
  }
  update(bit) {                             // adapt the context, then advance state
    const t = this.t, ci = this.ci;
    if (bit) t[ci] += (65536 - t[ci]) >> 5; else t[ci] -= t[ci] >> 5;
    this.c0 = (this.c0 << 1) | bit;
    if (this.c0 >= 256) { this.h3 = ((this.h3 << 8) | (this.c0 & 255)) & 0xFFFFFF; this.c0 = 1; }
  }
}

function compress(buf) {
  const m = new Model(), out = [];
  let x1 = 0, x2 = 0xffffffff >>> 0;
  out.push((buf.length >>> 24) & 255, (buf.length >>> 16) & 255, (buf.length >>> 8) & 255, buf.length & 255);
  for (let i = 0; i < buf.length; i++) {
    for (let b = 7; b >= 0; b--) {
      const bit = (buf[i] >> b) & 1, p = m.p();
      const xmid = (x1 + ((x2 - x1) >>> 12) * p) >>> 0;
      if (bit) x2 = xmid; else x1 = (xmid + 1) >>> 0;
      m.update(bit);
      while (((x1 ^ x2) & 0xff000000) === 0) { out.push(x2 >>> 24); x1 = (x1 << 8) >>> 0; x2 = ((x2 << 8) | 255) >>> 0; }
    }
  }
  for (let i = 0; i < 4; i++) { out.push(x1 >>> 24); x1 = (x1 << 8) >>> 0; }
  return Buffer.from(out);
}

function decompress(data) {
  const m = new Model(), out = [];
  const n = ((data[0] << 24) | (data[1] << 16) | (data[2] << 8) | data[3]) >>> 0;
  let x1 = 0, x2 = 0xffffffff >>> 0, x = 0, pos = 4;
  for (let i = 0; i < 4; i++) x = ((x << 8) | (data[pos++] | 0)) >>> 0;
  for (let k = 0; k < n; k++) {
    let byte = 0;
    for (let b = 0; b < 8; b++) {
      const p = m.p();
      const xmid = (x1 + ((x2 - x1) >>> 12) * p) >>> 0;
      const bit = (x >>> 0) <= xmid ? 1 : 0;
      if (bit) x2 = xmid; else x1 = (xmid + 1) >>> 0;
      m.update(bit);
      while (((x1 ^ x2) & 0xff000000) === 0) { x1 = (x1 << 8) >>> 0; x2 = ((x2 << 8) | 255) >>> 0; x = ((x << 8) | (data[pos++] | 0)) >>> 0; }
      byte = (byte << 1) | bit;
    }
    out.push(byte);
  }
  return Buffer.from(out);
}

const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const bpc = (bytes, orig) => (8 * bytes / orig).toFixed(3) + ' bpc';

function bench(label, buf) {
  const cm = compress(buf), gz = zlib.gzipSync(buf, { level: 9 }), br = zlib.brotliCompressSync(buf);
  const ok = sha(buf) === sha(decompress(cm));
  console.log('\n' + label + '  (' + buf.length + ' bytes)   cm zero-loss: ' + (ok ? '✓' : '✗ FAIL'));
  console.log('  cm (this) : ' + String(cm.length).padStart(8) + '  ' + bpc(cm.length, buf.length));
  console.log('  gzip -9   : ' + String(gz.length).padStart(8) + '  ' + bpc(gz.length, buf.length) +
    '   cm is ' + (cm.length < gz.length ? (100 * (1 - cm.length / gz.length)).toFixed(1) + '% SMALLER ✓' : 'bigger'));
  console.log('  brotli    : ' + String(br.length).padStart(8) + '  ' + bpc(br.length, buf.length) + '   (state-of-the-art baseline)');
}

function selftest() {
  const cases = [
    Buffer.from('the quick brown fox jumps over the lazy dog. '.repeat(300)),
    crypto.randomBytes(5000),
    Buffer.from(''),
    Buffer.from([0]),
    fs.readFileSync(__filename),          // compress this source file
  ];
  for (const c of cases) if (sha(c) !== sha(decompress(compress(c)))) throw new Error('FAIL: lost data on a ' + c.length + '-byte input');
  console.log('cm selftest ✓ — order-3 arithmetic coder round-trips byte-for-byte on all cases.');
}

if (require.main === module) {
  const a = process.argv[2];
  if (a === '--selftest') selftest();
  else if (a) bench(a, fs.readFileSync(a));
  else { console.log('usage: node lossless/cm.js --selftest | <file>'); }
}
module.exports = { compress, decompress };

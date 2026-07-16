// lpaq.js — a context-MIXING lossless compressor (PAQ-lite). Several context models
// of different orders each predict the next bit; a logistic mixer blends them; an
// arithmetic coder stores the result. This is the mechanism that beats gzip and, at
// full scale, beats LZMA. Deterministic integer math -> portable & lossless.
// Verify: node lossless/lpaq.js --selftest
'use strict';
const crypto = require('crypto');

// ---- integer squash/stretch (PAQ standard) -> keep it deterministic across machines
const SQ = [1,2,3,6,10,16,27,45,73,120,194,310,488,747,1101,1546,2047,2549,2994,3348,3607,3785,3901,3975,4022,4050,4068,4079,4085,4089,4092,4093,4094];
function squash(d) { if (d >= 2047) return 4095; if (d <= -2047) return 0; const w = d & 127; d = (d >> 7) + 16; return (SQ[d] * (128 - w) + SQ[d + 1] * w + 64) >> 7; }
const STRETCH = new Int16Array(4096);
(function () { let pi = 0; for (let x = -2047; x <= 2047; x++) { const v = squash(x); for (let j = pi; j <= v; j++) STRETCH[j] = x; pi = v + 1; } for (let j = pi; j < 4096; j++) STRETCH[j] = 2047; })();

const ORDERS = [0, 1, 2, 3, 4, 6];
const NCTX = ORDERS.length;
const N = NCTX + 1;                        // context models + 1 match model (last input)
const MB = 22, MASK = (1 << MB) - 1;
const HB = 21, HSIZE = 1 << HB, MINLEN = 4;   // match model hash table + min context

class Predictor {
  constructor() {
    this.t = []; for (let i = 0; i < NCTX; i++) { const a = new Uint16Array(1 << MB); a.fill(32768); this.t.push(a); }
    this.h = new Int32Array(NCTX);         // per-order history hash
    this.w = new Int32Array(N).fill((65536 / N) | 0); // mixer weights (16.16)
    this.st = new Int32Array(N);
    this.idx = new Int32Array(NCTX);
    this.recent = [];                      // last <=6 bytes, for order hashes
    this.c0 = 1; this.bcount = 0; this.pr = 2048;
    // match model
    this.buf = [];                         // full history (both sides build it identically)
    this.ht = new Int32Array(HSIZE);       // ctx hash -> next-byte index
    this.matchPtr = 0; this.matchLen = 0; this.matchByte = -1;
  }
  p() {
    let dot = 0;
    for (let i = 0; i < NCTX; i++) {
      const id = (Math.imul(this.h[i], 2654435761) ^ Math.imul(this.c0, 0x9E3779B1)) >>> (32 - MB);
      this.idx[i] = id;
      const s = STRETCH[this.t[i][id] >> 4];
      this.st[i] = s; dot += s * this.w[i];
    }
    // match model input: predict the bit from the byte that followed last time
    let ms = 0;
    if (this.matchByte >= 0) {
      const predBit = (this.matchByte >> (7 - this.bcount)) & 1;
      let strength = this.matchLen * 160; if (strength > 2047) strength = 2047;
      ms = predBit ? strength : -strength;
    }
    this.st[NCTX] = ms; dot += ms * this.w[NCTX];
    let pr = squash(dot >> 16);
    this.pr = pr < 1 ? 1 : pr > 4094 ? 4094 : pr;
    return this.pr;
  }
  update(bit) {
    const err = ((bit << 12) - this.pr) * 7;             // mixer learning rate
    for (let i = 0; i < N; i++) this.w[i] += (this.st[i] * err + 0x8000) >> 16;
    for (let i = 0; i < NCTX; i++) {
      const t = this.t[i], id = this.idx[i];
      if (bit) t[id] += (65536 - t[id]) >> 5; else t[id] -= t[id] >> 5;
    }
    // if the partial byte diverged from the predicted match byte, drop the match for this byte
    if (this.matchByte >= 0 && ((this.matchByte >> (7 - this.bcount)) & 1) !== bit) this.matchByte = -1;
    this.c0 = (this.c0 << 1) | bit; this.bcount++;
    if (this.bcount === 8) {                              // byte complete
      const c = this.c0 & 255;
      this.recent.push(c); if (this.recent.length > 6) this.recent.shift();
      const rb = this.recent, L = rb.length;
      for (let i = 0; i < NCTX; i++) {
        const o = ORDERS[i]; let hh = Math.imul(o + 1, 0x9E3779B1);
        for (let k = 0; k < o && k < L; k++) hh = Math.imul(hh ^ rb[L - 1 - k], 0x85EBCA77);
        this.h[i] = hh;
      }
      // --- match model bookkeeping ---
      this.buf.push(c); const pos = this.buf.length;
      if (this.matchLen > 0 && this.matchPtr < pos - 1 && this.buf[this.matchPtr] === c) { this.matchPtr++; this.matchLen++; }
      else {
        this.matchLen = 0;
        if (pos >= MINLEN) {
          let hh = 0; for (let k = 0; k < MINLEN; k++) hh = Math.imul(hh ^ this.buf[pos - 1 - k], 0x85EBCA77);
          hh = (hh >>> (32 - HB)) & (HSIZE - 1);
          const cand = this.ht[hh];
          if (cand > 0 && cand < pos) { this.matchPtr = cand; this.matchLen = 1; }
        }
      }
      if (pos >= MINLEN) {
        let hh = 0; for (let k = 0; k < MINLEN; k++) hh = Math.imul(hh ^ this.buf[pos - 1 - k], 0x85EBCA77);
        hh = (hh >>> (32 - HB)) & (HSIZE - 1);
        this.ht[hh] = pos;                                // this context -> predicts buf[pos]
      }
      this.matchByte = (this.matchLen > 0 && this.matchPtr < pos) ? this.buf[this.matchPtr] : -1;
      this.c0 = 1; this.bcount = 0;
    }
  }
}

function compress(buf) {
  const m = new Predictor(), out = [];
  let x1 = 0, x2 = 0xffffffff >>> 0;
  out.push((buf.length >>> 24) & 255, (buf.length >>> 16) & 255, (buf.length >>> 8) & 255, buf.length & 255);
  for (let i = 0; i < buf.length; i++) for (let b = 7; b >= 0; b--) {
    const bit = (buf[i] >> b) & 1, p = m.p();
    const xmid = (x1 + ((x2 - x1) >>> 12) * p) >>> 0;
    if (bit) x2 = xmid; else x1 = (xmid + 1) >>> 0;
    m.update(bit);
    while (((x1 ^ x2) & 0xff000000) === 0) { out.push(x2 >>> 24); x1 = (x1 << 8) >>> 0; x2 = ((x2 << 8) | 255) >>> 0; }
  }
  for (let i = 0; i < 4; i++) { out.push(x1 >>> 24); x1 = (x1 << 8) >>> 0; }
  return Buffer.from(out);
}

function decompress(data) {
  const m = new Predictor(), out = [];
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

if (require.main === module && process.argv[2] === '--selftest') {
  const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
  const fs = require('fs');
  const cases = [Buffer.alloc(0), Buffer.from([7]), Buffer.from('mississippi '.repeat(400)), crypto.randomBytes(3000), fs.readFileSync(__filename)];
  for (const c of cases) if (sha(c) !== sha(decompress(compress(c)))) throw new Error('FAIL: lost data on ' + c.length + ' bytes');
  console.log('lpaq selftest ✓ — context-mixing coder round-trips byte-for-byte.');
}
module.exports = { compress, decompress };

// demo.js — build the dictionary and HONESTLY measure the "P199,999" idea.
// Shows: index-substitution barely helps (often hurts); gzip already wins.
// run:  node compress/demo.js            (benchmark)
//       node compress/demo.js --build    (also write dict.csv + dict.sample.csv)
//       node compress/demo.js --selftest
'use strict';
const fs = require('fs'), zlib = require('zlib'), path = require('path');
const DIR = __dirname;

const words = fs.readFileSync(path.join(DIR, 'words_alpha.txt'), 'utf8').split(/\r?\n/).filter(Boolean);
const index = new Map();               // word -> 1-based index (a = 1)
words.forEach((w, i) => index.set(w, i + 1));

// The dictionary everyone can use: index,word
function buildCsv() {
  const lines = words.map((w, i) => (i + 1) + ',' + w);
  fs.writeFileSync(path.join(DIR, 'dict.csv'), 'index,word\n' + lines.join('\n') + '\n');
  fs.writeFileSync(path.join(DIR, 'dict.sample.csv'), 'index,word\n' + lines.slice(0, 200).join('\n') + '\n');
  console.log('wrote dict.csv (' + words.length + ' words) + dict.sample.csv');
}

const encode = (t) => t.replace(/[a-z]+/g, m => { const id = index.get(m); return id ? 'P' + id : m; });
const decode = (t) => t.replace(/P(\d+)/g, (_, n) => words[+n - 1]);
const bytes = (s) => Buffer.byteLength(s, 'utf8');
const gz = (s) => zlib.gzipSync(Buffer.from(s, 'utf8')).length;

function benchmark() {
  const sample = 'hello world this is a small program that prints hello world to the screen and stores every word in a dictionary for everyone in the world to use';
  const enc = encode(sample);
  const r = bytes(sample);
  const p = (n) => (100 * n / r).toFixed(0) + '% of raw';
  console.log('hello ->', index.get('hello'), '| world ->', index.get('world'), '(6-digit indices on the alphabetical list)\n');
  console.log('raw text          :', bytes(sample), 'bytes  (100%)');
  console.log('index-substituted :', bytes(enc), 'bytes  (' + p(bytes(enc)) + ')   <- the "P199,999" idea');
  console.log('gzip(raw)         :', gz(sample), 'bytes  (' + p(gz(sample)) + ')   <- built-in, free');
  console.log('gzip(index-subst) :', gz(enc), 'bytes  (' + p(gz(enc)) + ')');
}

function selftest() {
  if (index.get('hello') !== 135730) throw new Error('FAIL: hello index ' + index.get('hello'));
  const s = 'hello world';
  if (decode(encode(s)) !== s) throw new Error('FAIL: round-trip broke: ' + decode(encode(s)));
  // The honest point, asserted: index-substitution does NOT beat gzip here.
  const enc = encode('hello world this is a small dictionary program for everyone');
  if (gz('hello world this is a small dictionary program for everyone') >= bytes(enc))
    throw new Error('FAIL: expected gzip to beat naive substitution');
  console.log('compress selftest ✓ — round-trip works; gzip beats naive index-substitution.');
}

if (require.main === module) {
  const a = process.argv[2];
  if (a === '--build') buildCsv();
  else if (a === '--selftest') selftest();
  else benchmark();
}
module.exports = { index, words, encode, decode };

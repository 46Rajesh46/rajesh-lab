// bench.js — measure our tool vs the market on a corpus. Reports ratio + speed
// per codec, exactly how public benchmarks (lzbench, Squash, LTCB) do it.
// Point it at a standard corpus for market-comparable numbers:
//   Silesia:  http://sun.aei.polsl.pl/~sdeor/corpus/silesia.zip
//   enwik8:   http://mattmahoney.net/dc/enwik8.zip   (Hutter Prize text)
//
//   node lossless/bench.js <file|dir>
'use strict';
const fs = require('fs'), path = require('path');
const { CODECS, pack } = require('./router.js');

const filesIn = (p) => fs.statSync(p).isFile() ? [p]
  : fs.readdirSync(p).map((f) => path.join(p, f)).filter((f) => fs.statSync(f).isFile());
const human = (n) => n >= 1e6 ? (n / 1e6).toFixed(2) + ' MB' : n >= 1e3 ? (n / 1e3).toFixed(1) + ' KB' : n + ' B';

function main() {
  const target = process.argv[2];
  if (!target) { console.log('usage: node lossless/bench.js <file|dir>'); return; }
  const files = filesIn(target);
  const names = [...CODECS.map((c) => c.name), 'router'];
  const size = {}, ms = {}, na = {};
  for (const n of names) { size[n] = 0; ms[n] = 0; }

  let orig = 0;
  for (const f of files) {
    const buf = fs.readFileSync(f); orig += buf.length;
    for (const c of CODECS) {
      const t = process.hrtime.bigint();
      let out; try { out = c.c(buf); } catch (e) { out = null; }
      ms[c.name] += Number(process.hrtime.bigint() - t) / 1e6;
      if (out == null) na[c.name] = true; else size[c.name] += out.length + 1;
    }
    const t = process.hrtime.bigint();
    const p = pack(buf); ms.router += Number(process.hrtime.bigint() - t) / 1e6;
    size.router += p.bytes.length;
  }

  console.log('\ncorpus: ' + files.length + ' file(s), ' + human(orig) + ' original\n');
  console.log('  codec     compressed     ratio    comp speed');
  console.log('  ' + '-'.repeat(46));
  for (const n of names) {
    if (na[n]) { console.log('  ' + n.padEnd(9) + '(not installed)'); continue; }
    const ratio = (orig / size[n]).toFixed(2) + 'x';
    const mbps = (orig / 1e6 / (ms[n] / 1000)).toFixed(1) + ' MB/s';
    console.log('  ' + n.padEnd(9) + human(size[n]).padEnd(14) + ratio.padEnd(9) + mbps);
  }
  console.log('\n  (higher ratio = smaller output. router = best-of-all per file.)');
}
main();

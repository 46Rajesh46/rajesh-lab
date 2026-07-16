// qscript.js — QScript: a tiny readable quantum language. Node only, no install.
// Runs on top of qsim.js. A program is a few lines; each line is one gate.
//
//   qubits 2        # allocate N qubits, all |0>
//   h q0            # Hadamard (superposition) on qubit 0
//   x q1            # NOT / bit-flip
//   z q0            # phase flip
//   cnot q0 q1      # entangle: control q0, target q1
//   measure 1000    # sample the state 1000 times, print histogram
//   # lines starting with # are comments
//
// Run:  node quantum/qscript.js quantum/examples/bell.q
// Test: node quantum/qscript.js --selftest
'use strict';

const { newState, H, X, Z, CNOT, measure } = require('./qsim');

const qnum = (tok) => {
  const q = parseInt(String(tok).replace(/^q/, ''), 10);
  if (!Number.isInteger(q) || q < 0) throw new Error('bad qubit: ' + tok);
  return q;
};

// Run QScript source; returns the last measurement histogram (or null).
function run(src, { log = console.log } = {}) {
  let amp = null, n = 0, last = null;
  const lines = src.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].replace(/#.*/, '').trim();
    if (!line) continue;
    const [op, ...args] = line.split(/\s+/);
    const need = (k) => { if (args.length !== k) throw new Error(`line ${i + 1}: ${op} needs ${k} arg(s)`); };
    switch (op) {
      case 'qubits': need(1); n = qnum('q' + args[0]); amp = newState(n); break;
      case 'h':      need(1); amp = H(amp, qnum(args[0])); break;
      case 'x':      need(1); amp = X(amp, qnum(args[0])); break;
      case 'z':      need(1); amp = Z(amp, qnum(args[0])); break;
      case 'cnot':   need(2); amp = CNOT(amp, qnum(args[0]), qnum(args[1])); break;
      case 'measure':need(1); last = measure(amp, n, parseInt(args[0], 10)); log(last); break;
      default: throw new Error(`line ${i + 1}: unknown op "${op}"`);
    }
    if (amp === null && op !== 'qubits') throw new Error(`line ${i + 1}: "qubits N" must come first`);
  }
  return last;
}

function selftest() {
  // Bell program: only 00/11 may appear — never 01/10 (entanglement).
  const counts = run('qubits 2\nh q0\ncnot q0 q1\nmeasure 1000', { log() {} });
  const split = (counts['01'] || 0) + (counts['10'] || 0);
  if (split !== 0) throw new Error('FAIL: entanglement broken, saw ' + split);
  // X flips |0> -> |1>: measuring must give "1" every time.
  const one = run('qubits 1\nx q0\nmeasure 100', { log() {} });
  if ((one['1'] || 0) !== 100) throw new Error('FAIL: x gate, got ' + JSON.stringify(one));
  console.log('QScript selftest ✓ — bell (00/11 only) and x-gate pass.');
}

if (require.main === module) {
  const arg = process.argv[2];
  if (arg === '--selftest') selftest();
  else if (arg) run(require('fs').readFileSync(arg, 'utf8'));
  else console.log('usage: node quantum/qscript.js <file.q> | --selftest');
}

module.exports = { run };

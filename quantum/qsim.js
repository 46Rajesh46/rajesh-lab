// qsim.js — a tiny quantum simulator in pure JS. No install (Node only, already here).
// Demonstrates the thing that makes qubits different from bits: ENTANGLEMENT.
//
// A state of n qubits is 2^n complex amplitudes. Measuring gives outcome k with
// probability |amplitude_k|^2. Classical bits can't do superposition/entanglement.
// ponytail: dense state-vector sim — fine to ~20 qubits, then 2^n memory bites. That's physics, not laziness.
'use strict';

const S = 1 / Math.SQRT2;

function newState(n) {
  const amp = new Array(1 << n).fill(0).map(() => [0, 0]); // [re, im] per basis state
  amp[0] = [1, 0]; // start in |00...0>
  return amp;
}

// Hadamard on qubit q: puts it into superposition (equal parts 0 and 1).
//   |0> -> (|0>+|1>)/√2 ,  |1> -> (|0>-|1>)/√2
function H(amp, q) {
  const res = amp.map(() => [0, 0]);
  for (let k = 0; k < amp.length; k++) {
    if ((k >> q) & 1) continue;          // handle each 0/1 pair once, from the 0 side
    const k0 = k, k1 = k | (1 << q);
    const [a0r, a0i] = amp[k0], [a1r, a1i] = amp[k1];
    res[k0] = [S * (a0r + a1r), S * (a0i + a1i)];
    res[k1] = [S * (a0r - a1r), S * (a0i - a1i)];
  }
  return res;
}

// CNOT: if control qubit is 1, flip the target qubit. This is what entangles them.
function CNOT(amp, control, target) {
  const res = amp.map((p) => [p[0], p[1]]);
  for (let k = 0; k < amp.length; k++) {
    if (((k >> control) & 1) && !((k >> target) & 1)) {
      const j = k | (1 << target);
      const tmp = res[k]; res[k] = res[j]; res[j] = tmp;
    }
  }
  return res;
}

// X (NOT): flip qubit q. |0> <-> |1>.
function X(amp, q) {
  const res = amp.map((p) => [p[0], p[1]]);
  for (let k = 0; k < amp.length; k++) {
    if (!((k >> q) & 1)) {
      const j = k | (1 << q);
      const tmp = res[k]; res[k] = res[j]; res[j] = tmp;
    }
  }
  return res;
}

// Z: phase flip — negate the amplitude of every state where qubit q is 1.
function Z(amp, q) {
  return amp.map((p, k) => ((k >> q) & 1) ? [-p[0], -p[1]] : [p[0], p[1]]);
}

// Measure all qubits `shots` times; return a histogram of outcomes.
function measure(amp, n, shots) {
  const probs = amp.map(([re, im]) => re * re + im * im);
  const counts = {};
  for (let s = 0; s < shots; s++) {
    let r = Math.random(), k = 0;
    while (r > probs[k] && k < probs.length - 1) { r -= probs[k]; k++; }
    const bits = k.toString(2).padStart(n, '0');
    counts[bits] = (counts[bits] || 0) + 1;
  }
  return counts;
}

// --- Bell state: H on qubit 0, then CNOT(0 -> 1). Perfectly entangled. ---
function bellDemo() {
  let s = newState(2);
  s = H(s, 0);
  s = CNOT(s, 0, 1);
  const counts = measure(s, 2, 1000);
  console.log('Bell state, 1000 measurements:', counts);
  // Sanity check: only "00" and "11" ever appear — NEVER "01" or "10".
  // The two qubits are linked: measuring one instantly determines the other.
  const impossible = (counts['01'] || 0) + (counts['10'] || 0);
  if (impossible !== 0) throw new Error('FAIL: entanglement broken, saw ' + impossible + ' split outcomes');
  console.log('check ✓ — only correlated outcomes (00/11), never 01/10. That is entanglement.');
}

if (require.main === module) bellDemo();

module.exports = { newState, H, X, Z, CNOT, measure };

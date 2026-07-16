# Rajesh Lab

Everything from one project: inventing my own programming languages, exploring
quantum computing, and a straight-talking plan for records and recognition.
Created by **Rajesh**. Runs with **no new software** — only Node (already on this
PC via Laragon).

## What's inside

| Folder / file | What it is | Status |
|---------------|-----------|--------|
| [`realscript/`](realscript/) | **RealScript** — my own full-stack web language. One-file compiler, `.real` → JavaScript → live server. Pages, forms, storage, JSON APIs. | working ✅ |
| [`quantum/`](quantum/) | **qsim.js** — a tiny quantum simulator in pure JS. Runs a real entangled Bell state. The seed for a future "QScript" quantum language. | working ✅ |
| [`AMBITION-ROADMAP.md`](AMBITION-ROADMAP.md) | Honest plan: 12 record targets rated by realism, the real recognition ladder, and the straight answer on the Nobel question. | plan |

## Run it (nothing to install)

```
# RealScript — a full-stack web app in ~20 lines
node realscript/realc.js realscript/examples/guestbook.real      # open http://localhost:3000
node realscript/realc.js --selftest                              # tests

# A one-line web server
#   the file contains just:  route "/" show "Hello World"

# Quantum — watch two qubits entangle
node quantum/qsim.js
```

## The honest north stars (from the roadmap)

- **Near-term, winnable by myself this year:** world's smallest full-stack web
  language, smallest quantum language, first language built for AI generation —
  all self-verifiable once built, measured, and published with a timestamp.
- **Real Guinness-viable feats:** *fastest* and *most-people-at-once* records
  (Guinness rejects "smallest" — no metric).
- **The Nobel, answered straight:** a language / quantum computing **cannot** win
  the Peace Prize (that's for peace work), and there's no Nobel for computing.
  The real summits are the **Physics Nobel** (a hardware discovery) or the
  **Turing Award** (computing). Earned, never bought — money is not the gate.
- **Quantum is free to start:** IBM Quantum gives free access to *real* quantum
  computers online; this laptop simulates small ones. No expensive hardware needed.

## Next steps

- [ ] Build **QScript** (tiny quantum language) on top of `qsim.js`.
- [ ] Measure exact compiler byte counts → lock the "smallest" claims.
- [ ] Push to GitHub, MIT + my name, so the timestamps make "first"/"smallest" defensible.

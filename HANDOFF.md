# HANDOFF — Rajesh Lab (paste this into a new workspace to continue)

## Who & what
Rajesh is building his own programming languages and exploring quantum
computing, with a long-term goal of records and serious recognition. Everything
lives in a folder called `rajesh-lab/` (copy the whole folder to the new
workspace). Runs with **no new software** — only Node.js.

## What already exists and works (verified)
1. **RealScript** — `realscript/realc.js` — a one-file compiler for Rajesh's own
   full-stack web language. Compiles `.real` → JavaScript → a live Node HTTP
   server. Features: `serve on`, `store X` (persistent JSON collection), `page`
   (full HTML + built-in dark CSS), `route`, `api`, `on post` (+`body`), `let`,
   `show` (HTML out), `give` (JSON out), `redirect`, one-line forms
   (`route "/" show "Hello"`), and a bare-line JS escape hatch. POST bodies
   parsed (JSON + form), 1MB cap, 400/413/500 handled. MIT licensed to Rajesh.
   - Run: `node realscript/realc.js realscript/examples/guestbook.real` → http://localhost:3000
   - Test: `node realscript/realc.js --selftest`
   - Full CRUD demo (form → store → redirect → list → JSON API) = `examples/guestbook.real`.
2. **qsim.js** — `quantum/qsim.js` — a tiny pure-JS quantum simulator. Runs a
   real entangled **Bell state** (H + CNOT + measure); verified that only 00/11
   appear, never 01/10. Seed for a future "QScript" quantum language.
   - Run: `node quantum/qsim.js`
3. **AMBITION-ROADMAP.md** — the honest records/recognition plan (see below).

## Design principles (the "why")
- A high-level language wins by **hiding boilerplate**: one keyword expands into
  many lines. Same trick Python uses (`print()` vs Java's ceremony).
- **Token savings come from the SOURCE Claude writes, not the compiled output.**
  Compiled code expands (and is never read by an LLM) — its size is irrelevant.
- Optimize for **predictable, readable syntax** so an AI generates it reliably.
  There's a real tradeoff: ultra-tiny/cryptic syntax = fewer tokens but LESS
  reliable generation. Readable keywords that each do a lot = the sweet spot.
- **Reuse an existing runtime** (Node/JS) instead of rebuilding an ecosystem —
  the only sane way to ship a new web language. RealScript already has a
  compiler; "compile to a standalone .exe" (bundling Node) is the path to
  zero-install-for-anyone, using Node's built-in Single Executable feature — do
  NOT write a native compiler from scratch (months, unnecessary).

## The honest facts (already settled with Rajesh — don't re-litigate)
- **"World's smallest language" is NOT a Guinness-sanctionable category** (no
  agreed metric, gameable). Guinness accepts **timed feats** and
  **mass-participation** records. "World's smallest full-stack/quantum language
  by compiler bytes" is **self-claimable & verifiable** (publish + timestamp).
- **A programming language / quantum computing CANNOT win a Nobel Peace Prize.**
  The Peace Prize is for peace/human-rights work. There is **no Nobel for
  computing**. Real summits for this work: **Physics Nobel** (a hardware
  discovery, research career) or the **Turing Award** (computing). Earned, never
  bought — money is not the gate.
- **Quantum is free to start**: IBM Quantum (quantum.ibm.com) gives free access
  to REAL quantum computers online; a laptop simulates small ones. No expensive
  hardware needed.

## Goals
- **This year (winnable solo):** finish tiny languages, measure exact compiler
  byte counts, publish with timestamps → claim "world's smallest full-stack web
  language," "world's smallest quantum language," "first language built for AI
  generation."
- **Guinness-viable feats:** fastest to build a working app in a self-made
  language; most people coding in it at once (needs an audience).
- **Long game:** open-source impact → esolangs.org listing → blog/HN reach →
  (lifetime) Turing Award / Physics Nobel.

## Immediate next steps (pick up here)
1. **Build QScript** — a tiny readable quantum language on top of `qsim.js`
   (e.g. `qubits 2` / `h q0` / `cnot q0 q1` / `measure 1000`), add gates
   (`x`, `z`), test it.
2. **Measure byte counts** of each compiler → lock the "smallest" claims.
3. **Push to GitHub**, MIT + Rajesh's name, so timestamps make claims defensible.
4. Optional: add `--exe` build mode to RealScript (Node Single Executable) for
   true zero-install distribution; write a "start quantum for free" step-by-step.

## Working style Rajesh likes
Ship the working thing, verify it live (run it / test it — don't just claim it),
keep it to the fewest files, and be honest about what's real vs a wish.

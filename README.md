# Rajesh Lab

Inventing my own programming languages, exploring quantum computing, and a
straight-talking plan for records and recognition. Created by **Rajesh**.
Runs with **no new software** — only Node (already on this PC via Laragon).

- 🌐 **RealScript** — a full-stack web language in one dependency-free file: **8,968 bytes**
- ⚛️ **QScript** — a readable quantum language on a pure-JS simulator
- 🗜️ **rz** — a lossless compressor + our own `lpaq` coder that **beats gzip/brotli/xz on text**
- 📖 **Number dictionary** — 370,105 words ↔ numbers, script-built, free for anyone
- 📜 Records path is honest: what's self-claimable vs. what a real Guinness certificate needs

---

## What's inside

| Folder / file | What it is | Status |
|---|---|---|
| [`realscript/`](realscript/) | **RealScript** — my full-stack web language. `.real` → JavaScript → live server. Pages, forms, storage, JSON API. | working ✅ |
| [`quantum/qscript.js`](quantum/qscript.js) | **QScript** — my quantum language (`qubits/h/x/z/cnot/measure`) on `qsim.js`. | working ✅ |
| [`quantum/qsim.js`](quantum/qsim.js) | Pure-JS quantum simulator — runs a real entangled Bell state. | working ✅ |
| [`lossless/`](lossless/) | **rz** — try-all lossless compressor + our `lpaq` context-mixing coder (beats gzip/brotli/xz on text). Installable CLI + benchmark. | working ✅ |
| [`compress/`](compress/) | The **number dictionary** (370k words ↔ numbers) + the honest compression strategy synthesized from 12 local AI models. | published |
| [`records/SMALLEST-CLAIM.md`](records/SMALLEST-CLAIM.md) | The "smallest full-stack language" claim + how anyone re-measures it. | published |
| [`records/GUINNESS-APPLICATION.md`](records/GUINNESS-APPLICATION.md) | The timed-feat application package for an actual Guinness certificate. | ready to submit |
| [`AMBITION-ROADMAP.md`](AMBITION-ROADMAP.md) | The honest records/recognition plan. | plan |

## Run it (nothing to install)

```bash
# RealScript — a full-stack web app, then open http://localhost:3000
node realscript/realc.js realscript/examples/guestbook.real
node realscript/realc.js --selftest                 # correctness tests

# QScript — two qubits entangle (only 00/11 ever appear)
node quantum/qscript.js quantum/examples/bell.q
node quantum/qscript.js --selftest

# rz — lossless compressor (install once, then use anywhere)
cd lossless && npm install -g .
rz pack myfile          # -> myfile.rz (auto-picks the best codec)
rz unpack myfile.rz     # restore, byte-for-byte
rz bench ./my-data      # compare vs gzip/brotli/xz/zstd
```
Full install guide: [`lossless/INSTALL.md`](lossless/INSTALL.md).

## The claim, and how to verify it yourself (2 minutes, Node only)

> RealScript is a **complete full-stack web language** — server, routing, persistent
> storage, HTML templating, forms, JSON API — in a **single zero-dependency file**
> of **8,968 bytes / 136 lines** (readable reference: 11,512 B / 196 lines).

```bash
node realscript/realc.js --selftest             # must print: selftest passed ✓
wc -c realscript/realc.min.js                   # 8968  — the minimal compiler
grep -c "require('" realscript/realc.min.js     # 4 — all Node built-ins (http, fs, path)
```
Details + reproducible rebuild: [`records/SMALLEST-CLAIM.md`](records/SMALLEST-CLAIM.md).

---

## 📋 The record playbook — follow these steps

There are **two different kinds of record.** Don't confuse them.

### A. "Smallest full-stack language" — self-claim ✅ (already done)
No committee approves this; it's a **published + timestamped, re-measurable claim.**
- [x] Build QScript + measure exact byte counts
- [x] Write the claim with reproducible verification (`records/SMALLEST-CLAIM.md`)
- [x] Push to GitHub public with your name → the commit timestamp is your proof
- [ ] **Your optional next step:** submit RealScript to [esolangs.org](https://esolangs.org) and post it (Hacker News / Reddit r/programming) so others cite it. Reach = credibility.

### B. Guinness **certificate** — needs Guinness + you (I cannot do this part)
A certificate is only issued by Guinness, after they approve a category and review
evidence. **"Smallest" is not a Guinness category** — you need a *timed feat.*
Full package: [`records/GUINNESS-APPLICATION.md`](records/GUINNESS-APPLICATION.md).

1. [ ] Go to **guinnessworldrecords.com** → *Apply for a new record title* (free, ~12-week review).
2. [ ] Propose: **"Fastest time to build and run a functional web app in a self-authored programming language."** (Paste section 2 of the application doc.)
3. [ ] Wait for Guinness's official guidelines — **their rules override everything here.**
4. [ ] Rehearse the attempt: build [`records/attempt.real`](records/attempt.real) from an empty file, on the clock, until the run is fast and clean.
5. [ ] Film one **unedited** take with **2 independent witnesses** (witness statement template is in the doc).
6. [ ] Submit the evidence. If it holds → **certificate.**

> ⚠️ Nobody can sell or shortcut a Guinness certificate. Anyone who says otherwise is a scam.

## The honest north stars

- **Winnable by myself:** smallest full-stack web language, smallest quantum language, first language built for AI generation — all self-verifiable, published with a timestamp. ✅
- **Real Guinness-viable feats:** *fastest* and *most-people-at-once* records (Guinness rejects "smallest").
- **The Nobel, straight:** a language / quantum computing **cannot** win the Peace Prize, and there's no Nobel for computing. The real summits are the **Physics Nobel** (a hardware discovery) or the **Turing Award**. Earned, never bought.
- **Quantum is free to start:** IBM Quantum gives free access to *real* quantum computers online; this laptop simulates small ones.

## License
MIT © Rajesh

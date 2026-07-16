# Compression strategy — the honest plan

Your instinct — **frequent things should get short codes** — is 100% correct and
is one of the most important ideas in computing. But three parts of the plan don't
work the way they look. Here's the straight version, backed by measurements you can
re-run (`node compress/demo.js`).

## What I measured (real, on the 370,105-word list)
```
raw text          : 144 bytes  (100%)
index-substituted : 211 bytes  (147%)  <- the "P199,999" idea — it got BIGGER
gzip(raw)         : 109 bytes  ( 76%)  <- Node's built-in zlib, free
gzip(index-subst) : 120 bytes  ( 83%)  <- substituting first even HURTS gzip
```
Why it got bigger: on the alphabetical dwyl list **hello = 135730** (6 digits) for a
5-letter word. Rare words are worse: **zymurgy = 369405**. Numbering words by
*spelling order* gives long codes to short common words. That's the bug.

## The real name for your idea
Assigning short codes to frequent tokens is **entropy coding** — Huffman (1952) and
arithmetic coding. It's exactly what **gzip, zstd, brotli** and **LLM tokenizers
(BPE)** already do. You reinvented a real, powerful idea. To make it *win*, two fixes:

### Fix 1 — rank the dictionary by FREQUENCY, not spelling
`the`, `of`, `and` → 1, 2, 3… ; `hello` ≈ rank 100 (3 digits, not 6). Only then do
common words get short codes. Frequency comes from a real corpus — **google-10000-english**,
**Google Books n-grams**, or the `wordfreq` dataset. **Not from an LLM/Ollama** — an
LLM can't reliably enumerate or rank 370k words and would hallucinate. Numbering a
word list is a 3-line deterministic script (that's `demo.js`), not an AI job.

### Fix 2 — variable-length codes over TOKENS, not decimal digits
Give the top 256 tokens (including `print`, `(`, `)`, `"`) a **1-byte** code, the next
65k a 2-byte code, etc. (varint / Huffman). Then `print("hello world")` really does
shrink to a few bytes — and the **compiler/IDE expands codes ↔ readable text**, which
is your "the compiler does the work" idea, done correctly.

## Three hard limits (don't fight these — you'll lose)
1. **Shannon entropy.** A word that appears with probability `p` costs **at least
   −log₂(p) bits**. You cannot beat that by inventing new symbols. A bigger base
   (0–9 → custom symbols → base-256) only shortens the *digit string* by a constant
   factor; the information floor doesn't move. gzip already sits near this floor.
2. **Don't reinvent gzip.** Node ships `zlib`. Your scheme has to *beat* it to be
   worth existing — and naive substitution didn't (83% vs 76%). If you can't beat it,
   **wrap it**: `zlib.gzipSync(...)`.
3. **A qubit cannot store a word.** Measuring a qubit gives exactly **one classical
   bit** (0 or 1) — the continuous amplitude collapses and is unreadable. Your own
   `quantum/qsim.js` proves it: the Bell state only ever reads `00`/`11`, never a
   stored "0.199". **Holevo's theorem:** n qubits carry at most n classical bits of
   accessible information. So "one qubit = one dictionary word" is physically
   impossible. (Superdense coding gets 2 bits/qubit *with* pre-shared entanglement —
   still two bits, not a whole index.)

## "Can a whole sentence be one code?" — `hello how are you = a7`
**Yes for a fixed set of common phrases, no for all sentences.** This is a real,
named technique — a **phrasebook / dictionary of phrases** (and it's what LZ77/gzip
do automatically: they code repeated chunks by a short back-reference).

The catch is **counting (the pigeonhole principle)**, not cleverness:
- `a7` is 2 characters → there are only ~36² ≈ **1,296** possible 2-char codes.
  So **at most ~1,296 sentences** can ever have a 2-char code. Sentence #1,297 needs
  a longer one.
- The meaning "hello how are you" didn't vanish — it moved into the **shared table**
  both sides must already have. Real size = `code` + `its share of the table`. For a
  phrase you send often, the table cost is paid once and amortized → **real win**.
  For a one-off or arbitrary sentence, the table would have to list more sentences
  than there are atoms → impossible to pre-share.

**So the useful version of your idea:** a **snippet / macro system** — `a7` expands
to a frequent phrase or code block, stored in a table shipped with the compiler/IDE.
That's genuinely valuable (it's autocomplete/templates) and fits your "IDE makes it
easy to write" plan. Just remember: it compresses the *common* phrases you chose in
advance, never every possible sentence. Information is conserved.

## Where the real win actually is — and it's already your project
For **source code a human writes**, the biggest lever isn't packing digits, it's
**fewer tokens**. RealScript already does this: one keyword expands to many lines.
That beats character-level tricks *and* stays readable, which is exactly why an AI
can generate it reliably. Lean into that — it's a bigger, safer win than symbol golf.

## The buildable plan (ranked, lazy-first)
1. ✅ **Dictionary built** (`index = line number`) + honest benchmark → `compress/demo.js`.
   Regenerate the CSV anytime: `node compress/demo.js --build` → `dict.csv`.
2. Swap in a **frequency-ranked** word list (google-10000-english for the common head).
3. Write a **byte-level var-length codec** (top-256 = 1 byte) over source **tokens**.
4. **Benchmark vs gzip** on real `.real` files. Beat it, or wrap it — measure, don't assume.
5. If it wins: ship a **compressed source format + IDE** that shows codes as readable
   text. *That* is the novel, defensible artifact.

## One-line reality check
Naive index substitution isn't compression (measured 147%). Inventing symbols buys a
constant factor, never beats Shannon. Qubits can't store words. The real path —
frequency codes + fewer tokens + wrap gzip — is buildable today, and step 1 is done.

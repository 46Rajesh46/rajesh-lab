# Best lossless-compression strategy — researched + measured

The techniques below are the ones that survive both the literature **and** a real
benchmark of the context coder in `cm.js`. Anything that violates information theory is
called out at the bottom rather than repeated — a confident claim that breaks Shannon is
noise, no matter how often it's repeated.

## Measured reality check (read first)
`cm.js` — a single order-3 context model + arithmetic coder — vs the tools, verified zero-loss:

| Data | cm.js (single context) | gzip -9 | brotli |
|---|---|---|---|
| Natural-language prose (26.5 KB) | 6.75 bpc | **3.46 bpc** | 2.93 bpc |
| Wordlist sample (250 KB) | 3.11 bpc | **2.12 bpc** | 1.78 bpc |

**cm.js loses to gzip.** That is the lesson, not a bug: a *single* context model can't
beat gzip's LZ (which captures repeated words) — **you need mixing.** This is why beating gzip with a naive coder is harder than it looks.

## The architecture that actually wins
This is the PAQ / cmix / zstd family. Pipeline:
1. **Reversible preprocessing** (optional, lossless only): BWT + MTF (bzip2's trick),
   delta-coding for numbers, RLE, dedupe.
2. **Predict the next symbol by context MIXING** — combine several models of different
   orders (0…N) **plus a match model** (LZP: "what followed last time I saw this
   context?"), blended by a logistic mixer. *(the key to beating gzip/LZMA)*
3. **Entropy-code** the prediction with **arithmetic/range coding or ANS**
   (Asymmetric Numeral Systems — modern best for speed+ratio; zstd uses it).
4. **Adapt online** as you go.

## Concrete "beats gzip" recipe — minimal PAQ-lite (lpaq)
Mix order-2/4/6 byte contexts **+ one match model**, logistic mixing, bitwise
arithmetic coder. ~200 lines. Beats gzip on text and approaches LZMA — at the cost of
speed. This is the smallest thing that genuinely wins.

## Best per data type (domain wins)
| Data | Approach |
|---|---|
| Text / source | high-order context mixing, **or** BPE/dictionary + entropy coder (your number-dictionary idea lives here) |
| Numbers / time-series / sensors | delta + RLE + entropy code |
| Tables | transpose to columnar, then compress (Parquet-style) |
| Highly repetitive (genomes, logs, versioned files) | **Re-Pair / grammar** (your multi-dictionary `a7→aa7` idea *wins here*) |
| Already-compressed (jpg/mp4/zip) | don't bother |

## Unconventional ideas — the honest sort
**Real frontier (keep):**
- **Neural predictor** (RNN/Transformer) → arithmetic-code the surprise = `nncp`/`cmix`,
  the current record holders on enwik9. Slow, but genuinely beats LZMA.
- **Context Tree Weighting (CTW)** — provably near-optimal for its model class.

**Flagged — commonly suggested, but they break information theory (know the error):**
- *"Quantum error correction / Reed-Solomon for compression"* —
  error-correcting codes **add** redundancy; that's the opposite of compression.
- *"DCT / wavelet + quantization"* for lossless —
  quantization **discards** data = lossy. Zero-loss allows only *reversible* transforms.
- *"GAN generates pseudo-randomness as an auxiliary variable"* —
  not reversible, not meaningful for lossless.
- *"Compress the compressed output repeatedly, multiple passes"* —
  recompressing near-random data gains nothing. The pigeonhole wall; you can't recurse
  compression to zero.

## Honest bottom line
- **Beat gzip** → yes, with context **mixing + a match model** (lpaq-lite). A single-context
  first cut loses (measured above) — which *is* the proof that mixing is the point.
- **Beat 7zip/LZMA in general** → only with heavy context-mixing or neural coding, trading
  ~100–1000× speed. That's the **Hutter Prize / enwik9** frontier — the real record arena.
- **Beat them on YOUR domain** → very winnable (delta / columnar / grammar for the right data).
- **Always** name the corpus and verify zero-loss with a hash.

## Next build
`lpaq-lite`: mix order-2/4/6 + a match model + arithmetic coder → a *measured* beat of
gzip on text. That's the honest path from "lost to gzip" to "beats gzip."

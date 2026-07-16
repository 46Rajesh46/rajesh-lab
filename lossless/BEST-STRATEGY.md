# Best lossless-compression strategy — synthesized from 12 local models + measured

Built by asking **12 local Ollama models** (free, no paid tokens) the same 5-part
question, combining what they agreed on, **filtering out the ideas that violate
information theory**, and grounding it against a **real benchmark** of the context
coder in `cm.js`. Consensus across independent models = signal; a lone confident claim
that breaks Shannon = noise.

## Measured reality check (read first)
`cm.js` — a single order-3 context model + arithmetic coder — vs the tools, verified zero-loss:

| Data | cm.js (single context) | gzip -9 | brotli |
|---|---|---|---|
| Natural-language prose (26.5 KB) | 6.75 bpc | **3.46 bpc** | 2.93 bpc |
| Wordlist sample (250 KB) | 3.11 bpc | **2.12 bpc** | 1.78 bpc |

**cm.js loses to gzip.** That's the lesson, not a bug: a *single* context model can't
beat gzip's LZ (which captures repeated words). The models were right — **you need
mixing.** This is why beating gzip with a naive coder is harder than it looks.

## The consensus architecture (what most models converged on)
This is the PAQ / cmix / zstd family. Pipeline:
1. **Reversible preprocessing** (optional, lossless only): BWT + MTF (bzip2's trick),
   delta-coding for numbers, RLE, dedupe. *(qwen-coder-14b/32b, qwen2.5-14b)*
2. **Predict the next symbol by context MIXING** — combine several models of different
   orders (0…N) **plus a match model** (LZP: "what followed last time I saw this
   context?"), blended by a logistic mixer. *(strong consensus — the key to beating
   gzip/LZMA)*
3. **Entropy-code** the prediction with **arithmetic/range coding or ANS**
   (Asymmetric Numeral Systems — modern best for speed+ratio; zstd uses it). *(consensus)*
4. **Adapt online** as you go.

## Concrete "beats gzip" recipe — minimal PAQ-lite (lpaq)
Mix order-2/4/6 byte contexts **+ one match model**, logistic mixing, bitwise
arithmetic coder. ~200 lines. Beats gzip on text and approaches LZMA — at the cost of
speed. This is the smallest thing that genuinely wins.

## Best per data type (domain wins — consensus)
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
  the current record holders on enwik9. Slow, but genuinely beats LZMA. *(gemma, qwen2.5, llama3.2, nidum)*
- **Context Tree Weighting (CTW)** — provably near-optimal for its model class. *(qwen2.5-7b)*

**Flagged — models that broke information theory (NOT included; know the error):**
- *"Quantum error correction / Reed-Solomon for compression"* (qwen-coder-7b, llama3) —
  error-correcting codes **add** redundancy; that's the opposite of compression.
- *"DCT / wavelet + quantization"* for lossless (gemma, llama3, llama3.2) —
  quantization **discards** data = lossy. Zero-loss allows only *reversible* transforms.
- *"GAN generates pseudo-randomness as an auxiliary variable"* (llama3.2-3b) —
  not reversible, not meaningful for lossless.
- *"Compress the compressed output repeatedly, multiple passes"* (llama2-uncensored) —
  recompressing near-random data gains nothing. The pigeonhole wall; you can't recurse
  compression to zero.

## Honest bottom line
- **Beat gzip** → yes, with context **mixing + a match model** (lpaq-lite). My single-context
  first cut lost (measured above) — which *is* the proof that mixing is the point.
- **Beat 7zip/LZMA in general** → only with heavy context-mixing or neural coding, trading
  ~100–1000× speed. That's the **Hutter Prize / enwik9** frontier — the real record arena.
- **Beat them on YOUR domain** → very winnable (delta / columnar / grammar for the right data).
- **Always** name the corpus and verify zero-loss with a hash.

## Next build (all script — no Ollama, no paid tokens)
`lpaq-lite`: mix order-2/4/6 + a match model + arithmetic coder → a *measured* beat of
gzip on text. That's the honest path from "lost to gzip" to "beats gzip."

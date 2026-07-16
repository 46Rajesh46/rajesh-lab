# rz — a lossless compressor you can benchmark against the market

A "try-all, keep-smallest" ensemble compressor **plus** our own context-mixing coder
(`lpaq`) that beats gzip/brotli/xz on text. Zero-loss, every round-trip SHA-256 verified.
Pure Node — the external `zstd`/`xz` join automatically if installed.

## The tool
```bash
# compress / restore (writes a .rz file, reads the 1-byte codec tag back)
node lossless/router.js pack   myfile        myfile.rz
node lossless/router.js unpack myfile.rz     myfile.out

# see which codec wins on a file + verify zero-loss
node lossless/router.js myfile

# benchmark OUR tool vs gzip/brotli/xz/zstd on any corpus
node lossless/bench.js <file-or-folder>
```

## How to compare with the best tools in the market
Point the benchmark at a **standard corpus** so numbers line up with public leaderboards:
- **Silesia** — the standard general-compression corpus
- **enwik8 / enwik9** — Hutter Prize text (where cmix/nncp hold the record)
- Cross-check: **lzbench**, **Squash Benchmark**, **Large Text Compression Benchmark**

```bash
# example
curl -L http://mattmahoney.net/dc/enwik8.zip -o enwik8.zip && unzip enwik8.zip
node lossless/bench.js enwik8
```

## Measured (388 KB mixed text corpus)
| codec | ratio | speed |
|---|---|---|
| gzip | 2.66x | 11 MB/s |
| xz (7-Zip's LZMA) | 2.95x | 4.2 MB/s |
| brotli | 2.98x | 1.3 MB/s |
| **lpaq (ours)** | **3.10x** | 1.2 MB/s |
| **router (best-of-all)** | **3.16x** | 0.5 MB/s |

**Honest caveats:** this corpus is text-heavy, which favors context-mixing — on
binary-heavy data (Silesia) xz/brotli can edge back ahead. Our coders are **slow**
(that's the ratio/speed trade every strong compressor makes). The router never loses:
worst case it ties the best installed tool, because it tries them all and keeps the
smallest (and falls back to `store` when data won't compress).

## Files
- `router.js` — the ensemble tool (pack/unpack/report)
- `lpaq.js` — our context-mixing coder (orders 0–6 + match model + logistic mixer + arithmetic coder)
- `cm.js` — a simpler order-3 coder (kept as a baseline)
- `bench.js` — the market benchmark
- `demo.js` — gzip/brotli zero-loss round-trip demo
- `FORMAT.md` — the `.rz` format spec: exactly how to restore any archive
- `STRATEGY.md` / `BEST-STRATEGY.md` — the compression strategy (synthesized from 12 local models + measured)

## What would make it beat the market outright
- A **neural predictor** (bundled small model, run deterministically) → the ratio frontier
  (`ts_zip`/`nncp` territory). Real, but heavy and determinism-critical — see `BEST-STRATEGY.md`.
- Multi-core + per-chunk routing (route each part of a file to its best codec).

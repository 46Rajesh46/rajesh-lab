# Lossless compression — the best strategy (zero loss, perfect recovery)

"Zero loss" means `decompress(compress(x))` returns **x, byte-for-byte**. Every real
lossless codec guarantees that by definition. So the strategy is **not** inventing an
algorithm — it's **picking the right existing one for your data and proving the
round-trip with a hash.**

## The one rule
> Don't write your own compressor. Choose a proven codec, match it to your data,
> and verify: `sha256(x) == sha256(decompress(compress(x)))`.

## How every lossless compressor works (so you can reason about yours)
Two stages, always:
1. **Model repetition** — find repeated sequences and replace them with short
   back-references (the "LZ" family: LZ77/LZ78).
2. **Entropy-code** — give frequent symbols short codes (Huffman / arithmetic / ANS),
   pushing size toward the **Shannon floor** (−Σ p·log₂p bits).

gzip, zstd, brotli, xz are all just different balances of these two.

## Pick by data + need
| Your situation | Use | Why |
|---|---|---|
| Best all-round default | **zstd** (`zstd -19`, or `--ultra -22`) | near-max ratio, very fast, tunable, supports trained dictionaries |
| Maximum ratio, speed doesn't matter | **xz / LZMA** | highest ratio of the common tools |
| Real-time / streaming / must be fast | **lz4** or `zstd -1` | GB/s throughput |
| Web assets served to browsers | **brotli** | best text ratio, decodes natively in browsers |
| Must work literally everywhere / legacy | **gzip (DEFLATE)** | universal, built into everything |
| Already-compressed (jpg, mp4, mp3, zip, docx, png) | **don't compress** | ~incompressible; you'd burn CPU for ~0% |

## Squeeze more — lossless PREPROCESSING (do this *before* the codec)
Still perfectly reversible; just rearranges data so the codec finds more structure:
- **Deduplicate** identical blocks/files first (content-addressed).
- **tar many small files** into one stream so the dictionary is shared across them.
- **Delta-encode** sorted numbers / timestamps / sensor readings (store differences, not values).
- **Columnar + transpose** tabular data so like-values sit together (this is what Parquet/ORC do).
- **Sort** records when order is irrelevant (groups similar rows → better matches).
- **Train a dictionary** (`zstd --train`) for many small similar payloads (e.g. JSON messages).

## Prove zero loss (never trust — verify)
The *only* definition of zero loss is a passing round-trip:
```
sha256(original) === sha256(decompress(compress(original)))
```
`lossless/demo.js` does exactly this for gzip and brotli and prints the ratios.

## The floor you cannot beat (set honest expectations)
- **Shannon entropy:** you cannot go below the information content of the data.
- **Counting / pigeonhole theorem:** **no lossless algorithm shrinks every input.**
  If some inputs get smaller, others must get larger. Random, encrypted, or
  already-compressed data will **not** compress — that's a proof, not a weak tool.
  (Anyone claiming "compress any file by 50%, repeatedly" is selling a scam — it would
  let you shrink data to zero.)

## Practical default (if you want one answer)
- **Storage / archives:** `zstd -19` (or `xz` if you need the last few %).
- **Speed-critical:** `lz4` or `zstd -1`.
- **Web:** `brotli`.
- **Zero deps, right now (Node):** `zlib` already gives you **gzip + brotli** — see `demo.js`.
- **Always** verify with a hash. Every time.

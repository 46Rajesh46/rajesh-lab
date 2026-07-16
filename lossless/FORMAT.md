# .rz format — the pattern to follow for unzipping

A `.rz` file is dead simple: **one tag byte, then the payload.**

```
byte 0     : codec tag (which compressor was used)
byte 1..N  : that codec's compressed payload
```

To **restore**: read byte 0, pick the decoder from the table, run it on the rest.

## Codec tags
| tag | codec | how to decompress the payload |
|----|--------|-------------------------------|
| 0 | store  | payload IS the data (copy as-is) |
| 1 | gzip   | DEFLATE — any zlib/gunzip |
| 2 | brotli | Brotli decode — any brotli lib |
| 3 | cm     | our order-3 arithmetic coder (see below) |
| 4 | zstd   | `zstd -d` |
| 5 | xz     | `xz -d` (LZMA) |
| 6 | lpaq   | our context-mixing coder (see below) |

Tags 0,1,2,4,5 are **standard formats** — any language/tool can read them. Only 3 and 6
are ours, and both are fully specified here so anyone can write a decoder.

## Payload format for our coders (tags 3 and 6)
```
bytes 0..3 : original length, big-endian uint32
bytes 4..  : binary arithmetic-coded bitstream
```
Decoder algorithm (identical for cm and lpaq — only the predictor differs):
1. Read the 4-byte length `n`.
2. Init a 32-bit binary arithmetic decoder (`x1=0, x2=0xffffffff`, read 4 bytes into `x`).
3. For each of `n` bytes, for each of 8 bits (MSB first):
   - ask the predictor for `p` = P(next bit = 1), scaled to 12 bits,
   - `xmid = x1 + ((x2-x1) >> 12) * p`; `bit = (x <= xmid) ? 1 : 0`,
   - narrow the range (`bit` → `x2=xmid`, else `x1=xmid+1`), renormalize by pulling bytes,
   - feed `bit` back into the predictor so it adapts identically to the encoder.

## The one rule that makes it lossless: DETERMINISM
The decoder must reproduce the encoder's predictions **exactly**. That requires:
- the **same predictor code** (same orders, table sizes, update rates, mixer weights init),
- **integer-only math** (no floats that can differ across machines — that's why the
  squash/stretch tables and all counters are integers),
- MSB-first bit order and big-endian length, as above.

The predictor *is* the format. `cm.js` and `lpaq.js` in this folder are the reference
implementations — port them faithfully and any machine can restore any `.rz` file.

## Versioning
If you change a predictor (orders, rates, models), it is a **new format** — bump a
version byte before shipping, or old archives won't decode. Never change a predictor
silently; that breaks every archive made with the old one.

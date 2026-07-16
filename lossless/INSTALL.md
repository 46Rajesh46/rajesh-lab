# Install & use `rz`

A lossless compressor that auto-picks the best codec and can benchmark itself against
gzip / brotli / xz / zstd. **Prerequisite: Node.js 18+** (`node -v`). Get it from
[nodejs.org](https://nodejs.org) — or it's already on this PC via Laragon.

---

## Option A — install as a global command (recommended)
```bash
cd lossless
npm install -g .
```
Now `rz` works from any folder:
```bash
rz pack   report.pdf              # -> report.pdf.rz
rz unpack report.pdf.rz           # -> report.pdf
rz bench  ./my-data               # compare vs the market
```
Uninstall: `npm uninstall -g rz-compress`

## Option B — no install, run directly
```bash
node lossless/rz.js pack   myfile
node lossless/rz.js unpack myfile.rz
node lossless/rz.js bench  myfile
```

## Option C — Windows launcher
Add the `lossless` folder to your PATH, then use `rz` from any terminal (via `rz.bat`):
```bat
rz pack myfile
```

---

## Add more codecs (optional)
`rz` auto-detects external tools and adds them to the "try-all" lineup — no config:
```bash
winget install Facebook.Zstandard     # zstd
winget install tukaani.xz             # xz / LZMA (7-Zip's engine)
```
If they aren't installed, `rz` just skips them.

## Use it
```bash
rz pack <file> [out.rz]      compress (auto-picks the smallest codec, prints which won)
rz unpack <file.rz> [out]    restore, byte-for-byte
rz bench <file|folder>       ratio + speed vs every codec
```

## Compare against the best tools in the market
Point `bench` at a standard corpus so results match public leaderboards:
```bash
curl -L http://mattmahoney.net/dc/enwik8.zip -o enwik8.zip && unzip enwik8.zip
rz bench enwik8
```
Corpora: **Silesia** (general), **enwik8/enwik9** (Hutter Prize text). Cross-check with
**lzbench** / **Squash Benchmark**.

## Verify it's lossless yourself
```bash
npm test            # runs the round-trip self-tests (SHA-256 verified)
```

## Restoring without this tool
The `.rz` format is one tag byte + payload — fully documented in
[`FORMAT.md`](FORMAT.md), so a decoder can be written in any language.

## Advanced: a standalone .exe (no Node needed)
Node can bundle itself into a single executable via its built-in
[Single Executable Applications](https://nodejs.org/api/single-executable-applications.html)
feature (uses `postject` to inject the blob). It's extra moving parts, so it's not shipped
here — ask if you want it built.

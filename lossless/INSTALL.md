# Install & use `rz`

A lossless compressor with a 7-Zip-style GUI. Auto-picks the best codec, does multi-file
archives + AES-256 encryption, and benchmarks itself against gzip / brotli / xz / zstd.

---

## Easiest — the Setup installer (no Node, no admin)
Download **`rz-setup.zip`** from the [Releases](../../releases) page, unzip, and
double-click **`install.bat`**. It installs the `rz` command, a Start-Menu app
**"rz File Manager"** (the GUI), and a right-click **"Compress with rz"** on any file.
(SmartScreen may warn — More info → Run anyway. Uninstall: `uninstall.bat`.)

```
rz ui                    open the graphical File Manager
rz pack myfile           compress   ·   rz a box.rz a b c   bundle   ·   rz x box.rz   extract
```

*The options below are for developers who have Node.js and want to run from source.*

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

## Option E — the GUI (drag & drop, like 7-Zip)
A local web app: drag files to compress, drop a `.rz` to extract. Runs on your machine —
nothing is uploaded.
```bash
cd lossless
node ui.js          # then open http://localhost:8737
# or on Windows, double-click  rz-ui.bat  (opens the browser for you)
```

## Add more codecs (optional)
`rz` auto-detects external tools and adds them to the "try-all" lineup — no config:
```bash
winget install Facebook.Zstandard     # zstd
winget install tukaani.xz             # xz / LZMA (7-Zip's engine)
```
If they aren't installed, `rz` just skips them.

## Use it
```bash
rz pack <file> [out.rz]      compress one file (auto-picks the smallest codec)
rz unpack <file.rz> [out]    restore one file, byte-for-byte

rz a <archive.rz> <files...> bundle many files into one archive
rz l <archive.rz>            list an archive's contents (no extract)
rz x <archive.rz> [out-dir]  extract an archive

rz bench <file|folder>       ratio + speed vs every codec

# encryption — add -p <password> to any of the above (AES-256-GCM)
rz pack secret.pdf -p mypass
rz unpack secret.pdf.rz -p mypass       # wrong password is rejected
```
In the **GUI** (`node ui.js`): drag **multiple files** → they bundle into one archive;
drop a multi-file `.rz` → browse it and Save individual files; type a **password** to
encrypt/decrypt. Everything runs locally.

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

## Option D — standalone `rz.exe` (no Node needed)
A single Windows executable that runs on any PC **without Node installed**.

**Download:** grab `rz.exe` from the repo's **[Releases](../../releases)** page, then run it
from a terminal:
```bat
rz.exe pack   myfile
rz.exe unpack myfile.rz
rz.exe bench  myfolder
```
Put its folder on PATH to just type `rz`. First run, Windows SmartScreen may warn (it's
unsigned) → **More info → Run anyway**.

**Or build it yourself** (needs Node once; the exe then needs nothing):
```bat
cd lossless
build-exe.bat
```
Note: the exe is ~92 MB because it embeds the Node runtime — that's normal for single-file
Node executables. The `npm`/`rz` command (Option A) is far smaller if you already have Node.

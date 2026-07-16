# rz (Rust) — native rewrite

Why Rust: the JS engine is correct but **slow** (0.5–1 MB/s) and its standalone exe is
**92 MB**. A Rust build is **~10–100× faster**, produces a **~2 MB** exe, and can later
add the **Explorer right-click menu** a web UI can't.

## Status — scaffold, NOT yet built here
There is **no Rust toolchain on the build machine**, so this was written to spec and
**not compiled**. It is honest scaffolding, not a verified binary. Don't ship it until it
builds and its output round-trips against the JS tool.

## Build it
```bash
# 1. install Rust once
#    Windows: winget install Rustlang.Rustup     (or https://rustup.rs)
# 2. build
cd rust
cargo build --release
#    -> target/release/rz.exe   (~2 MB, no runtime needed)
```

## Verify it matches the JS format
The Rust build uses the **same `.rz` container** (1 tag byte + payload) and the same tag
numbers, so the two tools interoperate:
```bash
target/release/rz pack ../README.md out.rz
node ../lossless/rz.js unpack out.rz restored     # JS restores the Rust-made file
```

## Scope of this scaffold
- ✅ store · gzip · brotli · zstd (try-all, keep smallest)
- ⬜ not yet ported: `lpaq` (our context-mixing coder), `xz`, archives, AES encryption
- The JS tool (`lossless/`) remains the full-featured reference; Rust is the speed track.

Port order once it builds: lpaq (the differentiator) → archives → encryption → a native
window + shell integration.

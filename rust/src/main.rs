// rz (Rust) — native try-all lossless compressor. Same .rz container as the JS tool:
// one tag byte + payload. Runs every codec, keeps the smallest. Fast, tiny binary.
//
// STATUS: scaffold. Verified to match the JS format on paper; NOT yet compiled here
// (no Rust toolchain on the build machine). To build: install rustup, then
//   cd rust && cargo build --release   ->  target/release/rz(.exe)  (~2 MB)
//
// Tags match the JS router exactly so archives interoperate:
//   0 store · 1 gzip · 2 brotli · 4 zstd   (3=cm, 5=xz, 6=lpaq are JS-only for now)

use std::io::{Read, Write};
use std::fs;

fn gzip(d: &[u8]) -> Vec<u8> {
    use flate2::{write::GzEncoder, Compression};
    let mut e = GzEncoder::new(Vec::new(), Compression::best());
    e.write_all(d).unwrap();
    e.finish().unwrap()
}
fn gunzip(d: &[u8]) -> Vec<u8> {
    use flate2::read::GzDecoder;
    let mut out = Vec::new();
    GzDecoder::new(d).read_to_end(&mut out).unwrap();
    out
}
fn brotli_c(d: &[u8]) -> Vec<u8> {
    let mut out = Vec::new();
    let mut r = d;
    brotli::BrotliCompress(&mut r, &mut out, &Default::default()).unwrap();
    out
}
fn brotli_d(d: &[u8]) -> Vec<u8> {
    let mut out = Vec::new();
    let mut r = d;
    brotli::BrotliDecompress(&mut r, &mut out).unwrap();
    out
}

/// Try every codec, keep the smallest; prepend the winning tag byte.
fn pack(data: &[u8]) -> Vec<u8> {
    let mut best: (u8, Vec<u8>) = (0, data.to_vec()); // store
    for (tag, out) in [(1u8, gzip(data)), (2u8, brotli_c(data)), (4u8, zstd::encode_all(data, 19).unwrap())] {
        if out.len() < best.1.len() { best = (tag, out); }
    }
    let mut v = Vec::with_capacity(best.1.len() + 1);
    v.push(best.0);
    v.extend_from_slice(&best.1);
    v
}

fn unpack(data: &[u8]) -> Vec<u8> {
    let (tag, body) = (data[0], &data[1..]);
    match tag {
        0 => body.to_vec(),
        1 => gunzip(body),
        2 => brotli_d(body),
        4 => zstd::decode_all(body).unwrap(),
        t => panic!("codec tag {} not supported by the Rust build yet (use the JS tool)", t),
    }
}

fn main() {
    let a: Vec<String> = std::env::args().collect();
    match a.get(1).map(String::as_str) {
        Some("pack") => {
            let inp = fs::read(&a[2]).unwrap();
            let out = a.get(3).cloned().unwrap_or(format!("{}.rz", a[2]));
            let packed = pack(&inp);
            fs::write(&out, &packed).unwrap();
            println!("packed {} ({} B) -> {} ({} B)  {:.2}x", a[2], inp.len(), out, packed.len(), inp.len() as f64 / packed.len() as f64);
        }
        Some("unpack") => {
            let out = a.get(3).cloned().unwrap_or_else(|| a[2].trim_end_matches(".rz").to_string());
            fs::write(&out, unpack(&fs::read(&a[2]).unwrap())).unwrap();
            println!("restored {} -> {}", a[2], out);
        }
        _ => println!("usage: rz pack <file> [out.rz] | rz unpack <file.rz> [out]"),
    }
}

// archive.js — multi-file .rz archives (the 7-Zip "many files in one" feature).
// Layout: [file blobs][central directory][16-byte EOCD] — ZIP-style, so listing is cheap.
// Each blob = router.pack output (self-describing: starts with a codec tag), so the
// central directory lets you LIST or extract ONE file without touching the rest.
'use strict';
const { pack, unpack } = require('./router.js');
const MAGIC = 'RZARC1';                       // 6 bytes, in the EOCD footer

// files: [{ name, buf }] -> one archive Buffer
function createArchive(files) {
  const blobs = [], cd = []; let offset = 0;
  for (const f of files) {
    const blob = pack(f.buf).bytes;
    const name = Buffer.from(f.name, 'utf8');
    const rec = Buffer.alloc(14 + name.length);
    rec.writeUInt16BE(name.length, 0);
    rec.writeUInt32BE(offset, 2);             // where this blob starts
    rec.writeUInt32BE(blob.length, 6);        // compressed length (incl tag)
    rec.writeUInt32BE(f.buf.length, 10);      // original length
    name.copy(rec, 14);
    cd.push(rec); blobs.push(blob); offset += blob.length;
  }
  const data = Buffer.concat(blobs), cdBuf = Buffer.concat(cd);
  const eocd = Buffer.alloc(16);
  eocd.writeUInt32BE(data.length, 0);         // central directory starts after the data
  eocd.writeUInt16BE(files.length, 4);
  eocd.writeUInt32BE(cdBuf.length, 6);
  eocd.write(MAGIC, 10, 'ascii');
  return Buffer.concat([data, cdBuf, eocd]);
}

const isArchive = (b) => b.length >= 16 && b.toString('ascii', b.length - 6) === MAGIC;

// list contents WITHOUT extracting
function listArchive(arc) {
  if (!isArchive(arc)) throw new Error('not an rz archive');
  const eocd = arc.subarray(arc.length - 16);
  const cdOffset = eocd.readUInt32BE(0), count = eocd.readUInt16BE(4);
  const entries = []; let p = cdOffset;
  for (let i = 0; i < count; i++) {
    const nameLen = arc.readUInt16BE(p);
    entries.push({
      name: arc.toString('utf8', p + 14, p + 14 + nameLen),
      dataOffset: arc.readUInt32BE(p + 2),
      compLen: arc.readUInt32BE(p + 6),
      origLen: arc.readUInt32BE(p + 10),
    });
    p += 14 + nameLen;
  }
  return entries;
}

const extractOne = (arc, e) => unpack(arc.subarray(e.dataOffset, e.dataOffset + e.compLen));
const extractAll = (arc) => listArchive(arc).map((e) => ({ name: e.name, buf: extractOne(arc, e) }));

if (require.main === module && process.argv[2] === '--selftest') {
  const crypto = require('crypto');
  const files = [
    { name: 'a.txt', buf: Buffer.from('hello '.repeat(500)) },
    { name: 'sub/b.bin', buf: crypto.randomBytes(2000) },
    { name: 'c.md', buf: Buffer.from('# title\n' + 'word '.repeat(300)) },
  ];
  const arc = createArchive(files);
  const list = listArchive(arc);
  if (list.length !== 3) throw new Error('FAIL: list count');
  for (const f of files) {
    const e = list.find((x) => x.name === f.name);
    const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
    if (sha(extractOne(arc, e)) !== sha(f.buf)) throw new Error('FAIL: ' + f.name + ' corrupted');
  }
  console.log('archive selftest ✓ — create/list/extract-one round-trips byte-for-byte (' + arc.length + ' B archive).');
}

module.exports = { createArchive, listArchive, extractOne, extractAll, isArchive };

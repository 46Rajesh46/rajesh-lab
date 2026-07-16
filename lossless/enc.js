// enc.js — optional password protection for .rz. Compress-THEN-encrypt (encrypting
// first would make data incompressible). Uses Node's built-in AES-256-GCM (authenticated:
// a wrong password or tampering fails loudly) with a scrypt-derived key. Not home-rolled.
// Layout: "RZE1"(4) | salt(16) | iv(12) | authTag(16) | ciphertext
'use strict';
const crypto = require('crypto');
const MAGIC = Buffer.from('RZE1');
const HDR = 4 + 16 + 12 + 16;

function encrypt(buf, password) {
  const salt = crypto.randomBytes(16), iv = crypto.randomBytes(12);
  const key = crypto.scryptSync(Buffer.from(password, 'utf8'), salt, 32);
  const c = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([c.update(buf), c.final()]);
  return Buffer.concat([MAGIC, salt, iv, c.getAuthTag(), ct]);
}

const isEncrypted = (b) => b.length >= HDR && b.subarray(0, 4).equals(MAGIC);

function decrypt(buf, password) {
  if (!isEncrypted(buf)) throw new Error('not encrypted');
  const salt = buf.subarray(4, 20), iv = buf.subarray(20, 32), tag = buf.subarray(32, 48), ct = buf.subarray(48);
  const key = crypto.scryptSync(Buffer.from(password, 'utf8'), salt, 32);
  const d = crypto.createDecipheriv('aes-256-gcm', key, iv);
  d.setAuthTag(tag);
  try { return Buffer.concat([d.update(ct), d.final()]); }
  catch (e) { throw new Error('wrong password or corrupted data'); }
}

if (require.main === module && process.argv[2] === '--selftest') {
  const data = Buffer.from('secret payload '.repeat(50));
  const enc = encrypt(data, 'hunter2');
  if (!isEncrypted(enc)) throw new Error('FAIL: magic');
  if (!decrypt(enc, 'hunter2').equals(data)) throw new Error('FAIL: round-trip');
  let rejected = false; try { decrypt(enc, 'wrong'); } catch (e) { rejected = true; }
  if (!rejected) throw new Error('FAIL: wrong password was accepted!');
  console.log('enc selftest ✓ — AES-256-GCM round-trips; wrong password is rejected.');
}

module.exports = { encrypt, decrypt, isEncrypted };

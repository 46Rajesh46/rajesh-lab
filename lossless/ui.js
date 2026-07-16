// ui.js — a local web GUI for rz. Drag files in, compress/extract with one click.
// 7-Zip usability, modern look. Zero deps (Node http + our router). Nothing leaves
// your machine. Run:  node lossless/ui.js   ->  http://localhost:8737
'use strict';
const http = require('http');
const { pack, unpack, FAST } = require('./router.js');
const { createArchive, isArchive, listArchive, extractOne } = require('./archive.js');
const { encrypt, decrypt, isEncrypted } = require('./enc.js');
const PORT = 8737;
const archives = new Map(); let aid = 0;      // cache opened archives for per-file extract
const pwOf = (req) => req.headers['x-password'] || '';
const seal = (buf, pw) => pw ? encrypt(buf, pw) : buf;
const open = (buf, pw) => isEncrypted(buf) ? decrypt(buf, pw) : buf;   // throws on wrong pw

const readBody = (req, cb) => {
  const chunks = []; let size = 0;
  req.on('data', (c) => { size += c.length; if (size > 400e6) { req.destroy(); return; } chunks.push(c); });
  req.on('end', () => cb(Buffer.concat(chunks)));
};

const HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>rz — compressor</title>
<style>
  :root{--bg:#0b0d12;--panel:#12151d;--line:#232838;--txt:#e8ebf2;--dim:#8b93a7;--accent:#6c8cff;--good:#37d39b}
  *{box-sizing:border-box}
  body{margin:0;font:15px/1.55 ui-sans-serif,system-ui,Segoe UI,Roboto,sans-serif;background:
    radial-gradient(1200px 600px at 80% -10%,#1a2036 0,transparent 60%),var(--bg);color:var(--txt);min-height:100vh}
  .wrap{max-width:760px;margin:0 auto;padding:40px 22px 60px}
  h1{font-size:26px;margin:0 0 2px;letter-spacing:-.5px}
  h1 span{color:var(--accent)}
  .sub{color:var(--dim);margin:0 0 26px}
  .drop{border:1.5px dashed var(--line);border-radius:16px;background:var(--panel);
    padding:48px 20px;text-align:center;transition:.18s;cursor:pointer}
  .drop.hot{border-color:var(--accent);background:#151a27;transform:translateY(-1px)}
  .drop b{display:block;font-size:18px;margin-bottom:4px}
  .drop small{color:var(--dim)}
  .row{display:flex;align-items:center;gap:14px;background:var(--panel);border:1px solid var(--line);
    border-radius:12px;padding:12px 14px;margin-top:12px}
  .row .nm{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .row .meta{color:var(--dim);font-size:13px;font-variant-numeric:tabular-nums}
  .tag{font-size:12px;color:var(--good);border:1px solid #234;border-radius:20px;padding:2px 9px}
  a.dl,button{font:inherit;border:0;border-radius:9px;padding:8px 14px;cursor:pointer;text-decoration:none}
  button{background:var(--accent);color:#fff}
  a.dl{background:#1c2233;color:var(--txt);border:1px solid var(--line)}
  .spin{color:var(--dim);font-size:13px}
  footer{color:var(--dim);font-size:12.5px;margin-top:34px;text-align:center}
  .seg{display:inline-flex;background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:3px;margin:0 0 18px;gap:2px}
  .seg button{background:transparent;color:var(--dim);padding:6px 16px;border-radius:8px}
  .seg button.on{background:var(--accent);color:#fff}
  .tourney{width:100%;margin-top:10px;display:grid;grid-template-columns:56px 1fr auto;gap:4px 10px;align-items:center}
  .tourney .cn{color:var(--dim);font-size:12px}
  .tourney .bar{height:8px;border-radius:6px;background:#1c2233;overflow:hidden}
  .tourney .fill{height:100%;background:var(--line)}
  .tourney .win .fill{background:var(--good)}
  .tourney .sz{font-size:12px;color:var(--dim);font-variant-numeric:tabular-nums}
  .tourney .win .sz{color:var(--good)}
</style></head><body><div class="wrap">
  <h1>r<span>z</span> compressor</h1>
  <p class="sub">Drag files to compress. Drop a <code>.rz</code> to extract. Runs locally — nothing is uploaded.</p>
  <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:18px">
    <div class="seg" id="seg" style="margin:0">
      <button data-mode="max" class="on">Max ratio</button>
      <button data-mode="fast">Fast</button>
    </div>
    <input id="pw" type="password" placeholder="password (optional)" autocomplete="off"
      style="font:inherit;padding:8px 12px;border-radius:10px;border:1px solid var(--line);background:var(--panel);color:var(--txt)">
  </div>
  <div class="drop" id="drop">
    <b>Drop files here</b><small>or click to choose — best codec is picked automatically</small>
    <input type="file" id="file" multiple hidden>
  </div>
  <div id="list"></div>
  <footer>rz · best-of-all lossless · gzip · brotli · xz · lpaq (ours)</footer>
</div>
<script>
const drop=document.getElementById('drop'),file=document.getElementById('file'),list=document.getElementById('list'),seg=document.getElementById('seg'),pw=document.getElementById('pw');
const kb=n=>n>=1e6?(n/1e6).toFixed(2)+' MB':n>=1e3?(n/1e3).toFixed(1)+' KB':n+' B';
const H=()=>pw.value?{'X-Password':pw.value}:{};
let mode='max';
seg.addEventListener('click',e=>{ if(!e.target.dataset.mode)return; mode=e.target.dataset.mode;
  [...seg.children].forEach(b=>b.classList.toggle('on',b.dataset.mode===mode)); });
drop.onclick=()=>file.click();
['dragover','dragenter'].forEach(e=>drop.addEventListener(e,ev=>{ev.preventDefault();drop.classList.add('hot')}));
['dragleave','drop'].forEach(e=>drop.addEventListener(e,ev=>{ev.preventDefault();drop.classList.remove('hot')}));
drop.addEventListener('drop',ev=>handle([...ev.dataTransfer.files]));
file.addEventListener('change',()=>handle([...file.files]));

function handle(files){
  const archives=files.filter(f=>f.name.endsWith('.rz')), plain=files.filter(f=>!f.name.endsWith('.rz'));
  archives.forEach(extract);
  if(plain.length>1) bundle(plain);            // multiple files -> one archive
  else plain.forEach(compress);
}

async function compress(f){
  const row=addRow(f.name, mode==='fast'?'compressing (fast)…':'racing codecs…');
  const buf=await f.arrayBuffer();
  const r=await fetch('/pack?mode='+mode,{method:'POST',body:buf,headers:H()});
  const blob=await r.blob();
  const codec=r.headers.get('X-Codec'), o=+r.headers.get('X-Orig'), p=+r.headers.get('X-Packed');
  const results=JSON.parse(r.headers.get('X-Results')||'[]');
  row.done(kb(o)+' → '+kb(p)+'  ·  '+(o/p).toFixed(2)+'x', codec, blob, f.name+'.rz', results, o);
}

async function bundle(files){
  const row=addRow(files.length+' files → archive.rz', 'bundling…');
  const bufs=await Promise.all(files.map(f=>f.arrayBuffer()));
  const metas=files.map((f,i)=>({name:f.name,len:bufs[i].byteLength}));
  const head=new TextEncoder().encode(JSON.stringify(metas));
  const total=4+head.length+bufs.reduce((s,b)=>s+b.byteLength,0);
  const body=new Uint8Array(total); new DataView(body.buffer).setUint32(0,head.length);
  body.set(head,4); let off=4+head.length;
  for(const b of bufs){ body.set(new Uint8Array(b),off); off+=b.byteLength; }
  const r=await fetch('/archive',{method:'POST',body,headers:H()});
  if(!r.ok){ row.fail(await r.text()); return; }
  const blob=await r.blob(), o=+r.headers.get('X-Orig'), p=+r.headers.get('X-Packed');
  row.done(kb(o)+' → '+kb(p)+'  ·  '+(o/p).toFixed(2)+'x', 'archive '+r.headers.get('X-Count')+(pw.value?'+enc':''), blob, 'archive.rz');
}
async function extract(f){
  const row=addRow(f.name, 'reading…');
  const buf=await f.arrayBuffer();
  const meta=await (await fetch('/open',{method:'POST',body:buf,headers:H()})).json();
  if(meta.encrypted){ row.fail('encrypted — type the password above, then re-drop'); return; }
  if(meta.error){ row.fail(meta.error); return; }
  if(meta.archive){ row.archive(meta); return; }               // multi-file: browse it
  const r=await fetch('/unpack',{method:'POST',body:buf,headers:H()}); // single file: restore
  if(!r.ok){ row.fail(await r.text()); return; }
  const blob=await r.blob();
  row.done(kb(f.size)+' → '+kb(blob.size)+'  restored', 'extract', blob, f.name.replace(/\\.rz$/,''));
}
function addRow(name, status){
  const el=document.createElement('div'); el.className='row';
  el.innerHTML='<div class="nm">'+name+'</div><div class="meta spin">'+status+'</div>';
  list.prepend(el);
  return {
    done(meta,tag,blob,dlname,results,orig){
      const url=URL.createObjectURL(blob);
      let tourney='';
      if(results&&results.length){
        const max=Math.max(...results.map(r=>r.len)), win=Math.min(...results.map(r=>r.len));
        tourney='<div class="tourney">'+results.sort((a,b)=>a.len-b.len).map(r=>
          '<div class="cn '+(r.len===win?'win':'')+'">'+r.name+'</div>'
          +'<div class="bar '+(r.len===win?'win':'')+'"><div class="fill" style="width:'+(100*r.len/max).toFixed(0)+'%"></div></div>'
          +'<div class="sz '+(r.len===win?'win':'')+'">'+kb(r.len)+(orig?' · '+(orig/r.len).toFixed(2)+'x':'')+'</div>'
        ).join('')+'</div>';
      }
      el.innerHTML='<div style="display:flex;align-items:center;gap:14px;width:100%">'
        +'<div class="nm">'+name+'</div><span class="tag">'+tag+'</span>'
        +'<div class="meta">'+meta+'</div><a class="dl" href="'+url+'" download="'+dlname+'">Save</a></div>'+tourney;
      el.style.flexDirection='column'; el.style.alignItems='stretch';
    },
    archive(meta){
      el.style.flexDirection='column'; el.style.alignItems='stretch';
      el.innerHTML='<div style="display:flex;gap:10px;align-items:center"><div class="nm">'+name
        +'</div><span class="tag">archive · '+meta.entries.length+' files</span></div>'
        +'<div class="tourney" style="grid-template-columns:1fr auto auto">'+meta.entries.map(e=>
          '<div class="cn" style="color:var(--txt);overflow:hidden;text-overflow:ellipsis">'+e.name+'</div>'
          +'<div class="sz">'+kb(e.origLen)+'</div>'
          +'<button data-id="'+meta.id+'" data-i="'+e.i+'" data-nm="'+e.name.replace(/"/g,'')+'">Save</button>'
        ).join('')+'</div>';
      el.querySelectorAll('button').forEach(btn=>btn.onclick=async()=>{
        btn.textContent='…';
        const r=await fetch('/extract?id='+btn.dataset.id+'&i='+btn.dataset.i);
        const blob=await r.blob(), u=URL.createObjectURL(blob);
        const link=document.createElement('a'); link.href=u; link.download=btn.dataset.nm.split('/').pop(); link.click();
        btn.textContent='Save';
      });
    },
    fail(msg){ el.querySelector('.meta').textContent='error: '+msg; }
  };
}
</script></body></html>`;

http.createServer((req, res) => {
  const p = req.url.split('?')[0];
  if (req.method === 'GET' && p === '/') { res.setHeader('Content-Type', 'text/html'); res.end(HTML); return; }
  if (req.method === 'POST' && p === '/pack') {
    const fast = /(?:\?|&)mode=fast/.test(req.url), pw = pwOf(req);
    readBody(req, (buf) => {
      try {
        const r = pack(buf, fast ? { only: FAST } : {});
        const bytes = seal(r.bytes, pw);
        res.setHeader('X-Codec', r.name + (pw ? '+enc' : '')); res.setHeader('X-Orig', buf.length); res.setHeader('X-Packed', bytes.length);
        res.setHeader('X-Results', JSON.stringify(r.all));
        res.setHeader('Content-Type', 'application/octet-stream'); res.end(bytes);
      } catch (e) { res.statusCode = 500; res.end(String(e.message)); }
    }); return;
  }
  if (req.method === 'POST' && p === '/archive') {              // bundle many files -> one archive
    const pw = pwOf(req);
    readBody(req, (buf) => {
      try {
        const hlen = buf.readUInt32BE(0);
        const metas = JSON.parse(buf.toString('utf8', 4, 4 + hlen));
        let off = 4 + hlen; const files = [];
        for (const m of metas) { files.push({ name: m.name, buf: buf.subarray(off, off + m.len) }); off += m.len; }
        const orig = files.reduce((s, f) => s + f.buf.length, 0);
        const bytes = seal(createArchive(files), pw);
        res.setHeader('X-Count', files.length); res.setHeader('X-Orig', orig); res.setHeader('X-Packed', bytes.length);
        res.setHeader('Content-Type', 'application/octet-stream'); res.end(bytes);
      } catch (e) { res.statusCode = 500; res.end(String(e.message)); }
    }); return;
  }
  if (req.method === 'POST' && p === '/unpack') {
    const pw = pwOf(req);
    readBody(req, (buf) => {
      try { res.setHeader('Content-Type', 'application/octet-stream'); res.end(unpack(open(buf, pw))); }
      catch (e) { res.statusCode = 500; res.end(String(e.message)); }
    }); return;
  }
  if (req.method === 'POST' && p === '/open') {                 // is this .rz a multi-file archive?
    const pw = pwOf(req);
    readBody(req, (raw) => {
      res.setHeader('Content-Type', 'application/json');
      if (isEncrypted(raw) && !pw) { res.end('{"encrypted":true}'); return; }
      let buf; try { buf = open(raw, pw); } catch (e) { res.statusCode = 400; res.end('{"error":"wrong password"}'); return; }
      if (!isArchive(buf)) { res.end('{"archive":false}'); return; }
      const id = ++aid; archives.set(id, buf);                  // cache DECRYPTED archive
      if (archives.size > 8) archives.delete(archives.keys().next().value);
      const entries = listArchive(buf).map((e, i) => ({ name: e.name, origLen: e.origLen, compLen: e.compLen, i }));
      res.end(JSON.stringify({ archive: true, id, entries }));
    }); return;
  }
  if (req.method === 'GET' && p === '/extract') {                // pull one file out of a cached archive
    const q = new URLSearchParams(req.url.split('?')[1] || '');
    const arc = archives.get(+q.get('id'));
    if (!arc) { res.statusCode = 404; res.end('archive expired — re-drop it'); return; }
    try { res.setHeader('Content-Type', 'application/octet-stream'); res.end(extractOne(arc, listArchive(arc)[+q.get('i')])); }
    catch (e) { res.statusCode = 500; res.end(String(e.message)); }
    return;
  }
  res.statusCode = 404; res.end('not found');
}).listen(PORT, () => console.log('rz UI ▸ open http://localhost:' + PORT));

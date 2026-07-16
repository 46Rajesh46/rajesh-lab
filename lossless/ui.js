// ui.js — rz File Manager: a 7-Zip-style local GUI (toolbar, columns, folder
// navigation, multi-select, extract/test), plus compress & AES-256 encryption.
// Zero deps (Node http + our modules). Runs locally; nothing is uploaded.
//   node lossless/ui.js   (or  rz ui  from the exe)  ->  http://localhost:8737
'use strict';
const http = require('http');
const { pack, unpack, FAST } = require('./router.js');
const { createArchive, isArchive, listArchive, extractOne } = require('./archive.js');
const { encrypt, decrypt, isEncrypted } = require('./enc.js');
const PORT = 8737;
const archives = new Map(); let aid = 0;
const pwOf = (req) => req.headers['x-password'] || '';
const seal = (buf, pw) => pw ? encrypt(buf, pw) : buf;
const open = (buf, pw) => isEncrypted(buf) ? decrypt(buf, pw) : buf;

const readBody = (req, cb) => {
  const chunks = []; let size = 0;
  req.on('data', (c) => { size += c.length; if (size > 400e6) { req.destroy(); return; } chunks.push(c); });
  req.on('end', () => cb(Buffer.concat(chunks)));
};

const HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>rz File Manager</title>
<style>
  :root{--bg:#0b0d12;--panel:#12151d;--panel2:#151a24;--line:#232838;--txt:#e8ebf2;--dim:#8b93a7;--accent:#6c8cff;--good:#37d39b;--sel:#243154}
  *{box-sizing:border-box}
  body{margin:0;font:14px/1.5 ui-sans-serif,system-ui,Segoe UI,Roboto,sans-serif;background:var(--bg);color:var(--txt);height:100vh;overflow:hidden}
  .app{display:flex;flex-direction:column;height:100vh}
  .bar{display:flex;align-items:center;gap:8px;padding:10px 14px;background:var(--panel);border-bottom:1px solid var(--line);flex-wrap:wrap}
  .brand{font-weight:700;font-size:16px;margin-right:6px}.brand span{color:var(--accent)}
  .tb{display:flex;gap:6px}
  .tb button{font:inherit;display:flex;flex-direction:column;align-items:center;gap:2px;background:var(--panel2);border:1px solid var(--line);color:var(--txt);border-radius:9px;padding:7px 12px;cursor:pointer;min-width:64px;font-size:12px}
  .tb button .ic{font-size:16px}
  .tb button:hover:not(:disabled){border-color:var(--accent)}
  .tb button:disabled{opacity:.4;cursor:default}
  .spacer{flex:1}
  .seg{display:inline-flex;background:var(--panel2);border:1px solid var(--line);border-radius:9px;padding:3px;gap:2px}
  .seg button{font:inherit;background:transparent;color:var(--dim);padding:5px 12px;border:0;border-radius:7px;cursor:pointer;font-size:12px}
  .seg button.on{background:var(--accent);color:#fff}
  input.pw{font:inherit;padding:7px 11px;border-radius:9px;border:1px solid var(--line);background:var(--panel2);color:var(--txt)}
  .crumbs{display:flex;align-items:center;gap:6px;padding:8px 16px;background:var(--panel2);border-bottom:1px solid var(--line);font-size:13px;color:var(--dim);min-height:37px}
  .crumbs a{color:var(--accent);cursor:pointer;text-decoration:none}
  .grid{flex:1;overflow:auto;position:relative}
  table{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}
  thead th{position:sticky;top:0;background:var(--panel);text-align:left;padding:8px 14px;font-weight:600;font-size:12px;color:var(--dim);border-bottom:1px solid var(--line);cursor:pointer;user-select:none;white-space:nowrap}
  thead th.num{text-align:right}
  tbody td{padding:7px 14px;border-bottom:1px solid #1a1f2b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:340px}
  tbody td.num{text-align:right;color:var(--dim)}
  tbody tr{cursor:default}
  tbody tr.sel{background:var(--sel)}
  tbody tr:hover{background:#182034}
  .nm .ic{margin-right:8px}
  .empty{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--dim);gap:6px;pointer-events:none}
  .empty b{color:var(--txt);font-size:16px}
  .status{display:flex;justify-content:space-between;padding:7px 16px;background:var(--panel);border-top:1px solid var(--line);font-size:12px;color:var(--dim)}
  .drag .grid{outline:2px dashed var(--accent);outline-offset:-8px}
  a.hidden{display:none}
</style></head><body><div class="app">
  <div class="bar">
    <div class="brand">r<span>z</span></div>
    <div class="tb">
      <button id="bAdd"><span class="ic">＋</span>Add</button>
      <button id="bComp" disabled><span class="ic">🗜️</span>Compress</button>
      <button id="bExtract" disabled><span class="ic">⤓</span>Extract</button>
      <button id="bTest" disabled><span class="ic">✓</span>Test</button>
      <button id="bRemove" disabled><span class="ic">🗑</span>Remove</button>
    </div>
    <div class="spacer"></div>
    <div class="seg" id="seg"><button data-mode="max" class="on">Max</button><button data-mode="fast">Fast</button></div>
    <input class="pw" id="pw" type="password" placeholder="password" autocomplete="off">
    <input type="file" id="file" multiple hidden>
  </div>
  <div class="crumbs" id="crumbs">Staging — add or drag files to compress</div>
  <div class="grid" id="grid">
    <table><thead><tr>
      <th data-k="name">Name</th><th data-k="size" class="num">Size</th>
      <th data-k="packed" class="num">Packed</th><th data-k="ratio" class="num">Ratio</th>
      <th data-k="kind">Method</th>
    </tr></thead><tbody id="rows"></tbody></table>
    <div class="empty" id="empty"><b>Drag files here</b><span>or click Add — drop a .rz to browse it</span></div>
  </div>
  <div class="status"><span id="stLeft">0 items</span><span id="stRight">rz · local · nothing uploaded</span></div>
</div>
<a id="dl" class="hidden"></a>
<script>
const $=id=>document.getElementById(id), rows=$('rows');
const kb=n=>n>=1e9?(n/1e9).toFixed(2)+' GB':n>=1e6?(n/1e6).toFixed(2)+' MB':n>=1e3?(n/1e3).toFixed(1)+' KB':(n|0)+' B';
const H=()=>$('pw').value?{'X-Password':$('pw').value}:{};
let mode='max', view='stage', sortK='name', sortDir=1, cwd='';
let stage=[];          // {file,name,size}
let arc=null;          // {id, entries:[{name,origLen,compLen,i}]}

$('seg').onclick=e=>{ if(!e.target.dataset.mode)return; mode=e.target.dataset.mode;
  [...$('seg').children].forEach(b=>b.classList.toggle('on',b.dataset.mode===mode)); };
$('bAdd').onclick=()=>$('file').click();
$('file').onchange=()=>{ addToStage([...$('file').files]); $('file').value=''; };
$('bRemove').onclick=()=>{ stage=stage.filter(s=>!s.sel); render(); };
$('bComp').onclick=compress;
$('bExtract').onclick=()=>extractSel(true);
$('bTest').onclick=testArchive;

// drag & drop
const app=document.querySelector('.app');
['dragover','dragenter'].forEach(e=>app.addEventListener(e,ev=>{ev.preventDefault();app.classList.add('drag')}));
['dragleave','drop'].forEach(e=>app.addEventListener(e,ev=>{ev.preventDefault();if(e==='drop'||!app.contains(ev.relatedTarget))app.classList.remove('drag')}));
app.addEventListener('drop',ev=>{ ev.preventDefault(); app.classList.remove('drag');
  const files=[...ev.dataTransfer.files]; const rz=files.find(f=>f.name.endsWith('.rz'));
  if(rz) openArchive(rz); else addToStage(files); });

function addToStage(files){ view='stage'; arc=null; cwd='';
  for(const f of files) stage.push({file:f,name:f.name,size:f.size,sel:false}); render(); }

// column sort
document.querySelectorAll('thead th').forEach(th=>th.onclick=()=>{
  const k=th.dataset.k; sortDir = sortK===k? -sortDir : 1; sortK=k; render(); });

function currentItems(){
  if(view==='stage') return stage.map(s=>({name:s.name,size:s.size,packed:null,ratio:null,kind:'—',ref:s}));
  // browse: show entries under cwd, folding subfolders
  const seen=new Map(); const items=[];
  for(const e of arc.entries){
    if(cwd && !e.name.startsWith(cwd)) continue;
    const rest=e.name.slice(cwd.length);
    const slash=rest.indexOf('/');
    if(slash>=0){ const folder=rest.slice(0,slash+1);
      if(!seen.has(folder)){ seen.set(folder,{name:folder,size:0,packed:0,ratio:null,kind:'folder',folder:cwd+folder}); items.push(seen.get(folder)); }
      const f=seen.get(folder); f.size+=e.origLen; f.packed+=e.compLen;
    } else items.push({name:rest,size:e.origLen,packed:e.compLen,ratio:e.origLen/e.compLen,kind:'file',ref:e});
  }
  for(const it of items) if(it.kind==='folder') it.ratio=it.packed? it.size/it.packed:null;
  return items;
}

function render(){
  const items=currentItems();
  const dir=sortDir, k=sortK;
  items.sort((a,b)=>{ if(a.kind==='folder'&&b.kind!=='folder')return -1; if(b.kind==='folder'&&a.kind!=='folder')return 1;
    let x=a[k],y=b[k]; if(x==null)x=-1; if(y==null)y=-1; return (x<y?-1:x>y?1:0)*dir; });
  rows.innerHTML=items.map((it,i)=>{
    const icon=it.kind==='folder'?'📁':it.kind==='file'?'📄':'📄';
    const ratio=it.ratio?it.ratio.toFixed(2)+'x':'';
    return '<tr data-i="'+i+'" class="'+(it.ref&&it.ref.sel?'sel':'')+'">'
      +'<td class="nm"><span class="ic">'+icon+'</span>'+it.name+'</td>'
      +'<td class="num">'+(it.size?kb(it.size):'')+'</td>'
      +'<td class="num">'+(it.packed?kb(it.packed):'')+'</td>'
      +'<td class="num">'+ratio+'</td><td>'+it.kind+'</td></tr>';
  }).join('');
  [...rows.children].forEach((tr,i)=>{
    const it=items[i];
    tr.onclick=e=>{ if(it.ref){ it.ref.sel=!it.ref.sel; tr.classList.toggle('sel'); updateButtons(); } };
    tr.ondblclick=()=>{ if(it.kind==='folder'){ cwd=it.folder; render(); } };
  });
  $('empty').style.display=items.length?'none':'flex';
  crumbs(); updateButtons();
  $('stLeft').textContent=items.length+' item'+(items.length===1?'':'s');
}

function crumbs(){
  if(view==='stage'){ $('crumbs').textContent='Staging — '+stage.length+' file(s) ready to compress'; return; }
  let html='<a data-p="">'+ (arc.name||'archive.rz') +'</a>';
  let acc=''; for(const part of cwd.split('/').filter(Boolean)){ acc+=part+'/'; html+=' / <a data-p="'+acc+'">'+part+'</a>'; }
  $('crumbs').innerHTML=html;
  $('crumbs').querySelectorAll('a').forEach(a=>a.onclick=()=>{ cwd=a.dataset.p; render(); });
}

function updateButtons(){
  const stageMode=view==='stage';
  $('bComp').disabled=!(stageMode&&stage.length);
  $('bRemove').disabled=!(stageMode&&stage.some(s=>s.sel));
  $('bExtract').disabled=!(!stageMode&&arc);
  $('bTest').disabled=!(!stageMode&&arc);
}

function saveBlob(blob,name){ const a=$('dl'); a.href=URL.createObjectURL(blob); a.download=name; a.click(); }

async function compress(){
  if(stage.length===1){
    const f=stage[0].file, buf=await f.arrayBuffer();
    const r=await fetch('/pack?mode='+mode,{method:'POST',body:buf,headers:H()});
    const blob=await r.blob(); saveBlob(blob,f.name+'.rz');
    $('stRight').textContent=f.name+' → '+r.headers.get('X-Codec')+'  '+(+r.headers.get('X-Orig')/+r.headers.get('X-Packed')).toFixed(2)+'x';
  } else {
    const bufs=await Promise.all(stage.map(s=>s.file.arrayBuffer()));
    const metas=stage.map((s,i)=>({name:s.name,len:bufs[i].byteLength}));
    const head=new TextEncoder().encode(JSON.stringify(metas));
    const body=new Uint8Array(4+head.length+bufs.reduce((a,b)=>a+b.byteLength,0));
    new DataView(body.buffer).setUint32(0,head.length); body.set(head,4);
    let off=4+head.length; for(const b of bufs){ body.set(new Uint8Array(b),off); off+=b.byteLength; }
    const r=await fetch('/archive',{method:'POST',body,headers:H()});
    const blob=await r.blob(); saveBlob(blob,'archive.rz');
    $('stRight').textContent='archived '+r.headers.get('X-Count')+' files  '+(+r.headers.get('X-Orig')/+r.headers.get('X-Packed')).toFixed(2)+'x';
  }
}

async function openArchive(f){
  const buf=await f.arrayBuffer();
  const meta=await (await fetch('/open',{method:'POST',body:buf,headers:H()})).json();
  if(meta.encrypted){ $('stRight').textContent='encrypted — type password, then re-drop'; return; }
  if(meta.error){ $('stRight').textContent=meta.error; return; }
  if(!meta.archive){ // single file: just restore
    const r=await fetch('/unpack',{method:'POST',body:buf,headers:H()});
    if(!r.ok){ $('stRight').textContent=await r.text(); return; }
    saveBlob(await r.blob(), f.name.replace(/\\.rz$/,'')); $('stRight').textContent='restored '+f.name; return;
  }
  view='browse'; cwd=''; arc={id:meta.id,name:f.name,entries:meta.entries.map((e,i)=>({...e,sel:false,i}))}; render();
}

async function extractSel(){
  const chosen=arc.entries.filter(e=>e.sel);
  const list=chosen.length?chosen:arc.entries;   // none selected -> extract all
  for(const e of list){
    const r=await fetch('/extract?id='+arc.id+'&i='+e.i);
    if(r.ok) saveBlob(await r.blob(), e.name.split('/').pop());
  }
  $('stRight').textContent='extracted '+list.length+' file(s)';
}

async function testArchive(){
  let ok=0,bad=0;
  for(const e of arc.entries){ const r=await fetch('/extract?id='+arc.id+'&i='+e.i); if(r.ok)ok++; else bad++; }
  $('stRight').textContent='Test: '+ok+' OK'+(bad?', '+bad+' FAILED':'  ✓ archive intact');
}
render();
</script></body></html>`;

const server = http.createServer((req, res) => {
  const p = req.url.split('?')[0];
  if (req.method === 'GET' && p === '/') { res.setHeader('Content-Type', 'text/html'); res.end(HTML); return; }
  if (req.method === 'POST' && p === '/pack') {
    const fast = /(?:\?|&)mode=fast/.test(req.url), pw = pwOf(req);
    readBody(req, (buf) => {
      try { const r = pack(buf, fast ? { only: FAST } : {}); const bytes = seal(r.bytes, pw);
        res.setHeader('X-Codec', r.name + (pw ? '+enc' : '')); res.setHeader('X-Orig', buf.length); res.setHeader('X-Packed', bytes.length);
        res.setHeader('Content-Type', 'application/octet-stream'); res.end(bytes);
      } catch (e) { res.statusCode = 500; res.end(String(e.message)); }
    }); return;
  }
  if (req.method === 'POST' && p === '/archive') {
    const pw = pwOf(req);
    readBody(req, (buf) => {
      try { const hlen = buf.readUInt32BE(0); const metas = JSON.parse(buf.toString('utf8', 4, 4 + hlen));
        let off = 4 + hlen; const files = [];
        for (const m of metas) { files.push({ name: m.name, buf: buf.subarray(off, off + m.len) }); off += m.len; }
        const orig = files.reduce((s, f) => s + f.buf.length, 0); const bytes = seal(createArchive(files), pw);
        res.setHeader('X-Count', files.length); res.setHeader('X-Orig', orig); res.setHeader('X-Packed', bytes.length);
        res.setHeader('Content-Type', 'application/octet-stream'); res.end(bytes);
      } catch (e) { res.statusCode = 500; res.end(String(e.message)); }
    }); return;
  }
  if (req.method === 'POST' && p === '/unpack') {
    const pw = pwOf(req);
    readBody(req, (buf) => { try { res.setHeader('Content-Type', 'application/octet-stream'); res.end(unpack(open(buf, pw))); }
      catch (e) { res.statusCode = 500; res.end(String(e.message)); } }); return;
  }
  if (req.method === 'POST' && p === '/open') {
    const pw = pwOf(req);
    readBody(req, (raw) => {
      res.setHeader('Content-Type', 'application/json');
      if (isEncrypted(raw) && !pw) { res.end('{"encrypted":true}'); return; }
      let buf; try { buf = open(raw, pw); } catch (e) { res.statusCode = 400; res.end('{"error":"wrong password"}'); return; }
      if (!isArchive(buf)) { res.end('{"archive":false}'); return; }
      const id = ++aid; archives.set(id, buf); if (archives.size > 8) archives.delete(archives.keys().next().value);
      const entries = listArchive(buf).map((e, i) => ({ name: e.name, origLen: e.origLen, compLen: e.compLen, i }));
      res.end(JSON.stringify({ archive: true, id, entries }));
    }); return;
  }
  if (req.method === 'GET' && p === '/extract') {
    const q = new URLSearchParams(req.url.split('?')[1] || '');
    const arc = archives.get(+q.get('id'));
    if (!arc) { res.statusCode = 404; res.end('archive expired — re-drop it'); return; }
    try { res.setHeader('Content-Type', 'application/octet-stream'); res.end(extractOne(arc, listArchive(arc)[+q.get('i')])); }
    catch (e) { res.statusCode = 500; res.end(String(e.message)); }
    return;
  }
  res.statusCode = 404; res.end('not found');
});

server.listen(PORT, () => {
  const url = 'http://localhost:' + PORT;
  console.log('rz File Manager ▸ ' + url);
  if (process.env.RZ_NOOPEN !== '1') { try { require('child_process').exec((process.platform === 'win32' ? 'start "" ' : process.platform === 'darwin' ? 'open ' : 'xdg-open ') + url); } catch (e) {} }
});

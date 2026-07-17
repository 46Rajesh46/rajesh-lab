# RealScript — the claim

**Author:** Rajesh J · **License:** MIT · **Language:** RealScript v0.4

## The claim
> **RealScript is a full-stack web language in which you never write JavaScript.**
> Routing, HTML templating, forms, CRUD storage, login sessions, search, and a JSON
> API are all language keywords — a complete website's source contains **zero**
> JavaScript constructs (no arrow functions, no `.map/.filter/.sort`, no `new`, no
> `require()`, no `req/res`). Its entire compiler is a **single dependency-free file**
> of **17,603 bytes / 250 lines** (readable reference: 21,916 B / 346 lines),
> transpiling to JavaScript and running on Node.js with **zero third-party dependencies**.

This is a **self-claimable, publicly verifiable** record (published + git-timestamped).
It is **not** a Guinness category — Guinness has no "language" records. The strength here
is that it is reproducible in 60 seconds, not that a committee blessed it.

## Why this claim, and not "world's smallest"
The old claim was *"world's smallest full-stack web language" (9,345 B)*. It was honest
but weak: **"smallest" is gameable** — anyone can golf a few hundred bytes off and take
it, and there's no agreed metric for what counts as a language.

**"You never write JavaScript" is a property, not a number.** It can't be beaten by
shaving bytes; it can only be matched by doing the same work. Going pure cost **+8.3 KB**
of compiler (9,345 → 17,603 B) — that is the honest price, and it bought a claim nobody
can trivially copy. The compiler is still one file with zero dependencies, and still
orders of magnitude smaller than any web framework.

## The proof: a real website with zero JavaScript
[`realscript/examples/realblog.real`](../realscript/examples/realblog.real) — **RealBlog**:
a working site with a post feed, full-text search, single-post pages, an about page,
**admin login with server-side sessions**, publish/unpublish drafts, delete, and a JSON API.

Every construct is a keyword:

| Job | RealScript | (no JavaScript needed) |
|---|---|---|
| read a URL query | `let q = query "q"` | ~~`new URL(req.url).searchParams.get("q")`~~ |
| loop + filter + sort | `each p in posts where p.published newest first do` | ~~`.filter(...).sort((a,b)=>...).map(...)`~~ |
| search | `where p.hay contains q` | ~~`.toLowerCase().includes(...)`~~ |
| protect a page | `require login` | ~~cookie parsing + session lookup + 302~~ |
| log in / out | `start session` / `end session` | ~~`crypto.randomBytes` + `Set-Cookie`~~ |
| create / update / delete | `add {..} to posts` · `set p.done to not p.done` · `remove p from posts where ...` | ~~`.push/.splice` + manual save~~ |
| escape user text | `safe p.title` | ~~`.replace(/[&<>"']/g, ...)`~~ |

## Verify it yourself (60 seconds, Node only)
```bash
node realscript/realc.js --selftest                 # must print: selftest passed ✓
node tools/purity.js realscript/examples/realblog.real   # must print: ZERO JavaScript constructs
wc -c realscript/realc.min.js                       # 17603 — the whole compiler
grep -c "require('" realscript/realc.min.js         # 4 — all Node built-ins (http, fs, path)

node realscript/realc.js realscript/examples/realblog.real   # -> localhost:3000, a real site
```
`realc.min.js` is `realc.js` with only blank lines, comment-only lines and indentation
removed (newlines kept — no semantic golfing). It passes the identical self-test.

**Rebuild the minimal file (reproducible):**
```
node -e "const fs=require('fs');const s=fs.readFileSync('realscript/realc.js','utf8');fs.writeFileSync('realscript/realc.min.js',s.split(/\r?\n/).filter(l=>{const t=l.trim();return t&&!t.startsWith('//')}).map(l=>l.trim()).join('\n')+'\n')"
```

## Changelog (the numbers move — keep it honest)
- **v0.4** — 17,603 B. **Zero-JavaScript.** Added `each/where/newest first`, `if/else`,
  `if any|no ... where`, `add/set/save/remove`, `require login`, `start/end session`,
  and the expressions `query`, `env`, `count of`, `date`, `now`, `short`, `safe`,
  `contains`, `is/is not/and/or/not`. All four example apps verified zero-JS.
  Claim changed from "smallest" to "no JavaScript" — see reasoning above.
- **v0.3** — 9,345 B. Stores gained `save()` (real update/delete) and `esc()` (XSS-safe output).
- **v0.2** — 8,968 B. First published claim ("smallest full-stack web language").

## Honest caveats
- Not Guinness-sanctionable. Published, timestamped, verifiable — nothing more.
- "Zero JavaScript" means **the source you write**. The compiler emits JavaScript and runs
  on Node — that's the deliberate design (reuse a runtime instead of rebuilding an ecosystem).
  The claim is about the language you author in, and the purity check proves it.
- Client-side `<script>` inside an HTML string is the browser's business, not the language's.

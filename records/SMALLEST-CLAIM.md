# RealScript — "world's smallest full-stack web language" claim

**Author:** Rajesh J · **License:** MIT · **Language:** RealScript v0.2

## The claim
> RealScript is a **complete full-stack web language** — HTTP server, routing,
> persistent storage, HTML page templating, form handling, and a JSON API —
> implemented in a **single dependency-free file** of **9,345 bytes / 139 lines**
> (readable reference: 12,339 bytes / 204 lines). It transpiles to JavaScript and
> runs on Node.js with **zero third-party dependencies**.

This is a **self-claimable, publicly verifiable** record (published + git-timestamped).
It is **not** a Guinness category — "smallest language" has no official adjudicator
or agreed metric. The strength here is reproducibility, not a certificate.

## Why "full-stack" is honest here
One `.real` file gives you all of this (see `realscript/examples/guestbook.real`):

| Layer | RealScript feature |
|---|---|
| Server | `serve on 3000` — real Node HTTP server |
| Routing | `route` / `page` / `api` / `on post` |
| Templating | `page ... do` → full styled HTML document |
| Forms | `on post` + `body.field` (JSON + urlencoded parsed) |
| Persistence | `store x` → JSON-backed collection with `x.add()` |
| JSON API | `api ... do` + `give` |
| Safety | 1 MB body cap, 400/404/405/413/500 handled |

## The metric (measured, reproducible)
```
node realscript/realc.js --selftest            # correctness gate — must print "selftest passed ✓"
wc -c realscript/realc.min.js                  # 9345  — the minimal single-file compiler
wc -c realscript/realc.js                      # 12339 — readable reference
grep -c "require('" realscript/realc.min.js    # 4 — all Node built-ins (http, fs, path)
```
`realc.min.js` is `realc.js` with only blank lines, comment-only lines, and
per-line indentation removed (newlines kept — no semantic golfing). It passes the
identical self-test and serves a real app, so it is provably the same program.

**Rebuild the minimal file from source (reproducible):**
```
node -e "const fs=require('fs');const s=fs.readFileSync('realscript/realc.js','utf8');fs.writeFileSync('realscript/realc.min.js',s.split(/\r?\n/).filter(l=>{const t=l.trim();return t&&!t.startsWith('//')}).map(l=>l.trim()).join('\n')+'\n')"
```

## How a third party verifies it (2 minutes, Node only)
1. `git clone <repo>` — commit timestamp = your authorship date.
2. `node realscript/realc.js --selftest` → `selftest passed ✓`
3. `node realscript/realc.js realscript/examples/guestbook.real` → open http://localhost:3000, sign the guestbook, hit `/api/entries`.
4. `wc -c realscript/realc.min.js` → 9345.

## Changelog (the number moves — keep it honest)
- **v0.2 → v0.3** (9,345 B, was 8,968 B): the language gained **real CRUD** — stores now
  expose `save()` so apps can update and delete, not just append — and **`esc()`**, which
  escapes user text before it's shown (without it, any app displaying user input was a
  stored-XSS hole). The claim is "smallest **full-stack**"; a language that can't update or
  delete, or that can't safely show user input, wasn't honestly full-stack. Proof:
  [`realscript/examples/taskboard.real`](../realscript/examples/taskboard.real).

## Honest caveats
- Not Guinness-sanctionable. This is a published, timestamped, verifiable claim — nothing more, nothing less.
- "Smallest" depends on the metric you state; state it exactly (single file, zero deps, byte count) and let anyone re-measure.
- Design tension (from the project's own principles): RealScript optimizes for *readable* keywords so an AI generates it reliably. Golfing the compiler smaller would trade that away — the readable `realc.js` stays the reference; `realc.min.js` is only the size proof.

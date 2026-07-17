# RealScript

A tiny, readable web language — created by **Rajesh**. You write `.real` files;
RealScript transpiles them to JavaScript and runs a real HTTP server. No
framework, no dependencies, just Node.

```
serve on 3000

route "/" do
  show "<h1>Hello from RealScript</h1>"
end

route "/hi" do
  let name = "Rajesh"
  show "Hi " + name
end
```

## Run it

```
node realc.js examples/hello.real
```

Then open http://localhost:3000. On Windows you can also double-click `run.bat`.

## Build to plain JavaScript

```
node realc.js examples/hello.real --build   # writes examples/hello.real.js
```

## Language, in full

| Statement                    | Meaning                                              |
|------------------------------|------------------------------------------------------|
| `serve on 3000`              | Set the port the server listens on.                  |
| `store users`                | A **persistent** collection saved to `users.json`. `users.add(x)` appends+saves; `users.save()` persists edits/deletes → **full CRUD**. |
| `esc(x)`                     | Escapes user text before you `show` it. Use it for anything a user typed — otherwise you've built an XSS hole. |
| `page "/x" title "Home" do`  | A full **HTML page** with built-in styling; `show` appends to the body. |
| `route "/x" do`              | A raw handler; `show` sends the whole response.      |
| `api "/x" do`                | A **backend** JSON handler (GET).                    |
| `on post "/x" do`            | A **POST** handler; read submitted fields from `body`. |
| `let name = value`           | Declare a variable inside a handler.                 |
| `show expr`                  | HTML out.                                            |
| `give expr`                  | JSON out.                                            |
| `redirect expr`              | 302 redirect to a URL.                               |
| `users.add({ ... })`         | Any bare line runs as JavaScript (escape hatch).     |
| `end`                        | Close the current handler.                           |
| `# ...`                      | Comment.                                             |

Expressions (`"text"`, `+`, variables, `{ ... }` objects, and JS like
`list.map(...).join('')` for loops) are ordinary JavaScript. `page`/`route` +
`show` is your frontend; `api`/`on post` + `give` + `store` is your backend —
all in one `.real` file.

**Full-stack example:** [`examples/guestbook.real`](examples/guestbook.real) is a
complete app — a styled page, a form, persistent storage, a redirect, and a JSON
API — in ~20 lines. Run it and open http://localhost:3000:

```
node realc.js examples/guestbook.real
```

Pages come **pre-styled** (a clean dark theme), so anything you generate looks
decent with zero CSS. POST bodies (JSON and form-encoded) are parsed for you,
capped at 1MB, with 400/413/500 handled — you just read `body`.

## Why it's real, and where it's small

RealScript runs on Node's runtime, so it inherits JavaScript's ecosystem
instead of rebuilding it — the only sane way to ship a new web language. The
whole compiler is one file, [`realc.js`](realc.js). It already does styled
pages, forms, POST parsing, persistence, and JSON APIs. Deliberately **not**
built yet (add when you need them): dynamic URL params (`/user/:id`), sessions
& login, file uploads, and template partials. Each is one more keyword.

## Test

```
node realc.js --selftest
```

## License

MIT © 2026 Rajesh. You invented it, your name stays on it — anyone using
RealScript keeps this license and credit.

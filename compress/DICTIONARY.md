# The number dictionary — a standard word ↔ number map anyone can use

A stable mapping between every English word and a number, free for anyone to use.

- **`dict.csv`** — `number,word` for all **370,105** words. `number = alphabetical position` (a = 1).
- **`dict.sample.csv`** — the first 200 rows, to see the format without the 6 MB file.
- **`words_alpha.txt`** — the source list (from [dwyl/english-words](https://github.com/dwyl/english-words), public domain). The number of any word is just its **line number**.

```
number,word
1,a
2,aa
3,aaa
...
135730,hello
367569,world
370105,zzz
```

## How to use it
- **word → number** and **number → word** are a plain lookup. In Node:
  ```js
  const { index, words } = require('./demo.js');
  index.get('hello');   // 135730
  words[135730 - 1];    // 'hello'
  ```
- Regenerate the whole thing anytime (deterministic, reproducible):
  ```
  node compress/demo.js --build      # writes dict.csv + dict.sample.csv
  ```

## Why this is hallucination-proof
It is **built by a script**, not generated. The number is a counted position, so a wrong
entry is impossible by construction. Nothing is guessed at any point: enumerating and
numbering 370k items is arithmetic, and arithmetic belongs in code.

## Honest note on usefulness
This alphabetical numbering is **stable and shareable** but is **not** a compression win
on its own (common short words get large numbers — `hello` = 135730). To make the
dictionary useful for *shrinking* data, re-rank it by **word frequency** (`the` = 1,
`of` = 2 …) so common words get small numbers — see [`STRATEGY.md`](STRATEGY.md). That
re-ranking is also a script, driven by a real frequency corpus.

MIT / public-domain source. Use freely.

# Guinness World Records — application package (Rajesh)

**Honest scope:** I cannot issue the certificate. Only Guinness can, after they
approve an application and review evidence. This package is everything on *your*
side: the record to propose, what to film, who must witness, and the rehearsed
attempt. Guinness sets the final rules — treat theirs as law when they arrive.

---

## 1. The record to propose

> **"Fastest time to build and run a functional web application in a
> self-authored programming language."**

Why this one (and not "smallest language"):
- **Measurable** — it's a *time*. Guinness accepts timed feats; they reject
  vague superlatives like "smallest," which have no agreed metric.
- **You can actually do it** — RealScript already exists and works. The feat is
  typing a working app from a blank file and running it, against the clock.
- **Verifiable** — one continuous video + timestamps + witnesses.

## 2. What to enter on guinnessworldrecords.com

Register (free), choose **"Apply for a new record title"** (standard, ~12wk review).
Paste these when asked:

- **Proposed title:** Fastest time to build and run a functional web application
  in a self-authored programming language.
- **Description:** The applicant, using a programming language of their own
  design and authorship (RealScript), types the complete source of a functional
  web application from an empty file and starts it, producing a live app that
  serves a page, accepts form input, persists data, and returns JSON — measured
  from first keystroke to the app responding in a browser.
- **Why it deserves a record:** Combines original language design with a timed
  human feat; both the language and the run are fully evidenced and repeatable.
- **How it's measured:** Elapsed time, first keystroke → the running app's page
  loading in a browser, on one unedited video.

> They may rename it, tighten it, or set a minimum bar. Whatever guidelines they
> send back **override this document** — build to theirs.

## 3. Evidence plan (what Guinness will demand)

- [ ] **One continuous, unedited video** — screen + a wall clock or on-screen
      timer visible the whole time. No cuts.
- [ ] Start: empty `attempt.real` (or blank editor) shown on camera.
- [ ] End: the browser at `http://localhost:3000` showing the working app +
      a successful form submit + the `/api/todos` JSON. Stop the clock there.
- [ ] **Two independent witnesses** present, ideally one a software professional.
      They watch the whole attempt and sign the statement below.
- [ ] The RealScript source + this repo, timestamped (git commit / GitHub push)
      to prove the language is yours and predates the attempt.
- [ ] Timing by an independent method (stopwatch operator or on-screen timer app).

## 4. Witness statement template (print, 2 copies, wet-signed)

```
GUINNESS WORLD RECORDS — WITNESS STATEMENT

Record attempted: Fastest time to build and run a functional web application
                  in a self-authored programming language.
Attempt by:       Rajesh ______________________
Date / location:  ____________________________________
Measured time:    ______ min ______ sec

I confirm I was physically present for the entire attempt, that it was
performed without cuts or assistance, that the application was built live from
an empty file in the applicant's own language, and ran successfully in a
browser at the stated time.

Witness name:        ____________________________
Profession / why qualified: _____________________
Signature / date:    ____________________________
```

## 5. The rehearsed attempt

`attempt.real` in this folder is the target app (verified working: page + form +
persistent store + JSON API). Practice run:

1. Open an empty file. Start the timer / clock on first keystroke.
2. Type the contents of `attempt.real`.
3. `node ../realscript/realc.js attempt.real`
4. Open `http://localhost:3000`, add a task, show `/api/todos`. **Stop timer.**

Rehearse until the run is clean and fast. Reset before each take:
`rm -f records/todos.json`.

---

## Reality checklist (don't skip)
- Nothing is a record until Guinness approves the category — **apply first**.
- Their guidelines beat this doc. Build to theirs.
- A certificate is earned through evidence, not paid for. Anyone selling one is a scam.

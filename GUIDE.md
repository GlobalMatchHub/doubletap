# Doubletap: a guide for people who have not seen this before

This guide assumes you know how to run a command in a terminal and nothing
else. It explains what problem Doubletap solves, how it works, and how to run
it yourself. If you already know what MCP and idempotency are, the
[README](README.md) is shorter and denser.

---

## 1. The problem, in one story

You ask an AI assistant to refund a customer. The assistant calls a tool named
`create_refund`. The tool sends the request, the refund goes through, and then
the network hiccups and the reply never arrives.

The assistant has no way to tell these two situations apart:

- the refund happened and the answer was lost
- the refund never happened at all

Both look identical from where it is standing: a request went out, nothing
came back. So it does the sensible-looking thing and tries again.

If the tool was built carefully, the second attempt notices the first one and
changes nothing. If it was not, **the customer gets refunded twice.**

Banks solved this in the 2000s. The answer is called an idempotency key, and
every payment API has one. Tools built for AI assistants mostly do not, and
until now nobody was checking.

Doubletap checks.

---

## 2. Background: what is MCP, what is a tool

**MCP** (Model Context Protocol) is a standard way for an AI assistant to use
outside software. Somebody writes a small program called an **MCP server**,
the assistant connects to it, and the server offers a list of **tools** the
assistant may call: `read_file`, `create_issue`, `send_email`, and so on.

There are thousands of these servers published on npm today. Anyone can write
one. Anyone can install one. Once installed, an AI assistant can call its
tools, and those calls do real things: write files, post to APIs, spend money.

A tool can describe itself with hints. One of them matters here:

```json
{ "idempotentHint": true }
```

That is the tool telling the world **"calling me twice is the same as calling
me once."** Gateways and agent runtimes read that flag to decide whether a
retry is safe.

Nothing anywhere checks whether it is true.

---

## 3. What Doubletap does

Doubletap takes somebody else's MCP server, sits where the AI would sit, and
deliberately does the things that go wrong in production. Then it looks at
what the server actually did and reports it.

```
                    ┌──────────────────────────────────────────┐
                    │  Doubletap                               │
   normally the AI  │                                          │
   sits here  ───▶  │  1. start the server in a locked sandbox │
                    │  2. call a tool                          │
                    │  3. break something on purpose           │
                    │  4. look at what really changed          │
                    │  5. write down what it proves            │
                    └───────────────┬──────────────────────────┘
                                    │
                          ┌─────────▼──────────┐
                          │  somebody else's   │
                          │  MCP server        │
                          └─────────┬──────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
            files it writes                requests it sends
            (watched)                      (intercepted, never sent)
```

Two things make this work.

**It never trusts what the server says.** A tool can answer `{"ok": true}` and
have done nothing, or answer with an error and have done the thing anyway. So
Doubletap ignores the answer and looks at the world instead: it takes a
fingerprint of every file before the call and after the call, and compares.

**It never lets anything reach the real world.** The server runs locked in a
throwaway directory with no network access. Every outbound HTTP request is
caught inside the server's own process and answered with a fake reply, so a
tool that would charge a card just records that it tried to.

That second point is what makes the whole thing possible. Most MCP servers do
not store anything locally, they just call somebody's API. For those, the side
effect is not a file, it is the request. Catching the request turns it into
something that can be measured.

---

## 4. The four things that can go wrong

Doubletap is looking for four distinct failures. They fail differently and
they matter differently.

### The retry happens twice

You call a tool, the answer is lost, you call it again with exactly the same
arguments. Two files appear where there should be one. Two POSTs go out where
there should be one.

**Why it matters:** this is the duplicate refund. It is the whole reason the
project exists.

### The retry answers differently

You call a tool twice. The state is fine, nothing was duplicated, but the
second answer is different from the first. Maybe the first said `ok` and the
second said `already recorded`.

**Why it matters:** the caller cannot tell whether its retry succeeded or
whether it was rejected. It may compensate for a failure that did not happen.

### The interrupted call leaves a mess

You cut the connection in the middle of a call. Afterwards the file exists but
is empty, or a temporary file is left lying around, or the original contents
are gone and the new ones never arrived.

**Why it matters:** anything checking "does the file exist?" now gets the
wrong answer. The data that was there is gone.

### Calls that overlap corrupt each other

You make four calls at once instead of one after another. Three of them
survive instead of four, because two calls read the same state and the second
one's write erased the first one's.

**Why it matters:** an AI that fans out a plan makes overlapping calls
routinely. A tool tested one call at a time can still lose data here.

---

## 5. Running it

You need **Node 22.18 or newer** and, for the sandboxing, **macOS**.

```bash
git clone https://github.com/GlobalMatchHub/doubletap.git
cd doubletap
npm install       # the harness itself
npm run setup     # the three reference servers it is tested against
```

`npm run setup` fetches three small MCP servers published by the people who
designed the protocol. They are not bundled into this repository: they are
somebody else's packages, and vendoring copies would be both rude and stale
within a month. The several hundred packages the published census used are a
separate, deliberate step (`npm run setup:census`), because downloading those
should never be something `npm install` does to you by surprise.

### Check the harness itself first

```bash
node --no-warnings src/cli.ts selftest
```

```
ok    confinement          network, out-of-sandbox writes and non-node exec are all denied
ok    concurrency-overlap  two 2s calls took 4012ms one at a time and 2003ms together, so they really do overlap
```

This matters more than it looks. Both of those assumptions fail silently. If
confinement is broken, you are running unaudited code from the internet with
no supervision while believing you are not. If calls are not really
overlapping, the concurrency test passes everything and has proven nothing.
**If either line says FAIL, stop.**

### Test one server you already have

`npm run setup` gave you three reference servers to try:

```bash
node --no-warnings src/cli.ts targets
```

```
filesystem   @modelcontextprotocol/server-filesystem
memory       @modelcontextprotocol/server-memory
everything   @modelcontextprotocol/server-everything
```

Now run the fastest test against the first one:

```bash
node --no-warnings src/cli.ts run --target filesystem --probe idempotency
```

```
filesystem: 14 tools, 14 under test
  FAIL edit_file [retry-signal] The effect was applied once, but the retry
       reported failure, which tells a retrying client the operation did not happen.
  FAIL move_file [retry-signal] The effect was applied once, but the retry
       reported failure, which tells a retrying client the operation did not happen.

@modelcontextprotocol/server-filesystem
  violations 0  fails 2  passes 24  skips 0  errors 0
```

Two real findings, in about thirteen seconds, against a server written by the
people who designed the protocol. Neither tool is broken exactly: both do the
work correctly the first time. What they get wrong is what they say to a
caller that tries again after losing the answer, which is that the operation
did not happen. A caller that believes them undoes work that was already done.

Dropping `--probe idempotency` runs everything, including the slow timing
searches, and takes a few minutes.

### Narrow it down

```bash
# one tool
node --no-warnings src/cli.ts run --target filesystem --tool write_file

# one kind of test
node --no-warnings src/cli.ts run --target filesystem --probe idempotency
```

### Prove a run is reproducible

```bash
node --no-warnings src/cli.ts verify --target filesystem
```

Runs the same seed twice and compares the two recordings line by line.
Anything still different is listed rather than hidden.

---

## 6. Reading the output

Every result is one **verdict**. A verdict looks like this:

```
[violation] declared-idempotent-but-not   nexus-agents :: delegate_to_model
    Declares idempotentHint: true, but an identical retry changed the state
    again (+.nexus-agents/runs/delegate-67161a04/, ...).
```

Four parts:

| Part | Meaning |
| --- | --- |
| `violation` | how serious |
| `declared-idempotent-but-not` | a fixed code you can grep and count |
| `nexus-agents :: delegate_to_model` | which server, which tool |
| the sentence | what was actually proven, with the evidence in brackets |

### Severity

| | Meaning |
| --- | --- |
| **violation** | The tool broke a promise it made about itself. The most serious result: a gateway trusting that promise would be wrong. |
| **fail** | Something a retrying client cannot handle safely, though the tool never claimed otherwise. |
| **pass** | Tested and behaved. |
| **skip** | Could not be tested, and the reason is recorded. |

**`skip` is not `pass`.** A tool whose every call failed for lack of an API key
is not evidence of good behaviour, and it is never counted as clean. This is
the single easiest way to make a report like this worthless, so the counts are
kept apart.

### Where results are written

After a full census run you get four files:

| File | Use it for |
| --- | --- |
| `census.md` | reading |
| `census.html` | a summary page, findings folded away per server |
| `census.csv` | one row per verdict, for sorting and filtering in a spreadsheet |
| `census.json` | everything, including full evidence |

Plus a `.dt.jsonl` **trace** per server: every message, every fault injected,
every snapshot, one per line. Every verdict carries the command that replays
it:

```bash
node --no-warnings src/cli.ts replay runs/census-v5/filesystem-dt-census-1.dt.jsonl --tool write_file
```

Replay recomputes each snapshot's fingerprint from what was recorded instead
of trusting the stored value, so an edited or truncated trace is detected
rather than believed.

---

## 7. The tests, one by one

| Test | Reproducible | What a failure means |
| --- | --- | --- |
| `idempotency` | yes | You called it twice, it happened twice. If the tool declared `idempotentHint: true`, that is a broken promise, not a bug report. |
| `retry-signal` | yes | Nothing duplicated, but the second answer differs from the first, so a retrying caller cannot tell what happened. |
| `answer-stability` | yes | Two identical calls, two different answers, with no state to explain it. This is the only test available for servers that store nothing locally, and it catches in-memory state no file could show. |
| `upstream-idempotency` | yes | A retry pushed the same write back out to somebody's API. Checks whether an idempotency-style header was sent and whether it stayed the same. |
| `partial-failure` | yes | The call completed, the answer was lost, the client reconnected and retried. Also sends half a request and checks that nothing happened. |
| `concurrency` | **no** | Four calls at once left different results from the same four calls one at a time. Fewer entries means a lost update. |
| `kill-window` | **no** | Kills the server at a ladder of delays after delivery, hunting the gap between "the effect happened" and "the answer was sent". |

### Why two of them say "no"

Those two hunt for **races**, and a race depends on timing the machine
controls, not on anything Doubletap can fix in place. They record what they
found so you can replay it, but they cannot promise to find it again on a busy
machine. They are excluded from the reproducibility check rather than being
allowed to weaken it.

### Two things deliberately not counted as failures

- **`PUT` and `DELETE` sent twice.** HTTP defines both as idempotent, so a
  server resending one has done nothing wrong.
- **A repeated `POST` from a tool that declares `readOnlyHint: true`.** The
  tool says it does not change anything, and it is taken at its word. Search
  endpoints often use POST.

Counting either of those would bury the real findings under correct behaviour.

---

## 8. Running it against the whole npm ecosystem

This is what produced the census in the README. It takes hours and downloads
several hundred packages.

```bash
# 1. find every published MCP server on npm
node scripts/discover.mjs
node scripts/enrich.mjs 500

# 2. install them, with install scripts disabled
node scripts/install.mjs

# 3. work out how to start each one, and whether it starts at all
node --no-warnings src/cli.ts discover --concurrency 6

# 4. decide which ones can actually be judged
node --no-warnings src/cli.ts screen --concurrency 4

# 5. run the tests and write the report
node --no-warnings src/cli.ts census \
  --auto scripts/targets.auto.json \
  --screened scripts/screen.json \
  --verify filesystem
```

**Step 4 is the one people skip and should not.** Most published servers are a
thin shell over somebody's API and do nothing you can observe without a real
account. Running the tests against them produces a page of green ticks that
mean nothing. Screening sorts servers into what can actually be decided about
each one, and the ones that cannot be tested are reported as exactly that.

---

## 9. Is it safe to run?

You are executing several hundred packages that nobody audited. Take that
seriously. Doubletap does.

Every server runs under three restrictions at once:

1. **`sandbox-exec`** denies network access, denies writing anywhere outside
   the throwaway directory, and denies executing anything except `node`.
2. **A fake `open` command** is put ahead of the real one, so a server that
   tries to launch a browser gets a no-op.
3. **Every HTTP request is intercepted inside the server's own process**, so
   no socket is ever opened.

This is not theoretical caution. An early run of this project launched a real
OAuth page in the user's browser, because a hosting server started a login
flow when a tool was called. The restrictions above exist because that
happened.

A short list of servers is excluded outright, each with a written reason: the
ones that drive a real browser, open SSH sessions, talk to a wallet, or use
the machine's own mail app. Those are in `src/target/autoconfig.ts` and you can
argue with any entry.

Installation uses `--ignore-scripts`, so no package's install hooks run. That
is deliberate, and it has a cost: a few packages need a native build step and
will not work. That tradeoff is noted rather than hidden.

---

## 10. How the results stay honest

A report about other people's defects is worth nothing unless it is harder on
itself than on them.

**Everything comes from one seed.** Argument values, which files get touched,
where a connection gets cut: all derived from one number. Run the same seed
twice and you get the same bytes. That claim is checked by `verify`, not
asserted, and whatever still differs is listed.

**The harness proves its own preconditions.** `selftest` demonstrates that
confinement really denies what it claims and that concurrent calls really
overlap, because both would otherwise fail silently and produce false
confidence.

**When the harness is wrong, that gets published too.** An earlier version of
this census reported nine contract violations. Eight of them were false. A
server had used one of the fake credentials it was handed as a filename and
written its log there, and that log growing by one line per call was being
read as the tool changing state.

The fix was not to filter it out at the end. Fake values now carry a marker,
and any path containing that marker is excluded from the measurement
completely, so a finding caused by the harness's own footprint is impossible
rather than unlikely. Rerunning dropped one category from 19 findings to 3 and
another from 8 to 0. Two more were found later, both the harness racing the
server rather than the server misbehaving, and both are in the README table.

That story is in the README because you should know what kind of mistakes this
tool has made before you trust its numbers.

---

## 11. Testing your own server

Add an entry to `src/target/registry.ts`:

```ts
{
  id: "myserver",
  label: "my-mcp-server",
  source: "local",
  cmd: (sb) => ["node", "/path/to/my-server/dist/index.js", sb.workspace],
  env: (sb) => ({ MY_STORAGE_PATH: join(sb.workspace, "data.json") }),
  fixture: { "note.txt": "hello\n" },
  oracle: "fs",
}
```

| Field | What it does |
| --- | --- |
| `cmd` | How to start it. `sb.workspace` is the throwaway directory. |
| `env` | Point your server's storage inside `sb.workspace`. This is the important one: it is what makes your server's state visible. |
| `fixture` | Files that exist before every test, so read tools have something to read. |

Then:

```bash
node --no-warnings src/cli.ts run --target myserver
```

If everything comes back `skip`, your server's state is landing somewhere the
sandbox cannot see. Check `env`.

---

## 12. Common questions

**Does it cost anything to run?**
No. It never calls a language model and never reaches the network. The only
cost is CPU time.

**Does it need API keys?**
No, and it will not accept real ones. It reads each package's source to find
which environment variables it expects and fills in obviously fake values,
which is enough to get past a startup check and never enough to authenticate.

**Can a server lie to it?**
Yes, if it is trying. The part that watches HTTP requests runs inside the
server's own process, and nothing inside a process can keep a secret from it.
A server can invent requests it never sent. It can no longer quietly erase
ones it did: the harness keeps every record it has read and reports the
erasure as `evidence-tampered`. Containment is a separate matter and does
hold, which was tested with a deliberately hostile server: it could not reach
the network or write outside its sandbox. Treat the findings as evidence about
careless servers, not proof about adversarial ones.

**Will it damage anything?**
Not outside its own throwaway directories. See section 9. If you plan to run
it against hundreds of packages, read that section first.

**A server I care about shows all `skip`. Why?**
Almost always because every call failed for lack of a real account, or because
it succeeded but changed nothing observable. Both are reported with a reason
code rather than being counted as passing.

**Why does the same run sometimes find a race and sometimes not?**
Because that is what a race is. `concurrency` and `kill-window` are marked as
timing searches for exactly this reason and are kept out of the
reproducibility check.

**Can I run this on Linux or Windows?**
The tests will run, but `sandbox-exec` is macOS only, so servers would run
unconfined. `selftest` reports this as a failure rather than proceeding
quietly. Do not run a wide census that way.

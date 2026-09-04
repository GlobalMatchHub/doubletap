# Doubletap

**A conformance harness for MCP servers. It answers one question: when a tool call is retried, does the side effect happen once, twice, or half?**

Doubletap drives someone else's MCP server through the failures that actually happen in production, then reads the server's own state to see what it did. It never calls a model, and it runs every server offline inside a `sandbox-exec` jail, so a full census costs nothing but CPU.

**New to this?** [GUIDE.md](GUIDE.md) explains the problem, the tests and the
output from scratch, and assumes nothing beyond knowing how to run a command.

```
doubletap discover        # which published servers start with no credentials
doubletap screen          # which of those can be judged at all
doubletap census          # run the probes, write the report
doubletap verify          # prove the run is reproducible from its seed
```

## Why this exists

The MCP gateway market is crowded. Microsoft, Composio, Permit.io, Scalekit and Palo Alto all ship something that sits in front of a server and blocks calls at runtime. Read their docs and the same sentence keeps appearing:

> every agent developer has to implement retries and idempotent operations themselves, and the implementations end up inconsistent

> a payments or production server should not be allowed through until its write tools, approvals, **idempotency** and audit logs have been **tested**

Everyone says test it. Nobody shipped the test.

## The census

Every published npm MCP server, filtered down by what could actually be put under test.

| | |
| --- | ---: |
| npm packages matching MCP searches | 2,179 |
| with an executable and a dependency on the MCP SDK | 284 |
| installed with `--ignore-scripts` | 284 |
| complete `initialize` and list a tool with no credentials | **121** |
| tools those 121 expose | 4,421 |
| excluded by policy: browser, SSH, wallet, live search API | 11 |
| still unreachable offline: native DB wire protocols, missing browser binaries, a real Mail.app | 10 |
| **put under test** | **94** |

Those 94 split by what can be observed about them: 4 keep local state a file can
show, 55 are judged on the requests they send upstream, and 35 only on whether
an identical call answers the same way twice. The 10 that remain need something
no placeholder can fake -- a live MongoDB or SQL Server over its own binary
wire protocol, a Playwright browser that was never downloaded, the developer's
actual mail.

Two mechanisms did the work of getting from 84 reachable servers to 121, and
from 30 testable to 94. Most servers keep nothing locally, so a retried write
is not a changed file, it is a repeated HTTP request: the interceptor turns
that request into the oracle. And most refuse to start without an API key, so
their own source is scanned for the variable names they read and a
plausible-looking placeholder is filled in, enough to clear the guard and reach
the code that issues the request, never enough to authenticate against anything
real.

### 94 servers, 599 tools

Full tables in [`runs/census-v5/census.md`](runs/census-v5/census.md), one row
per verdict in `census.csv`.

**51 of 94 servers have at least one tool a retrying client cannot use safely**,
covering 172 of 599 exercised tools: 145 findings are a retry pushing the same
write back out to somebody's API, 33 are an answer that will not repeat, 3 are
a local effect applied twice, and 1 is a tool that declares itself idempotent
and is not.

| Server | Monthly installs | Exercised | Contract violation | Upstream write repeated | Answer not reproducible |
| --- | ---: | ---: | ---: | ---: | ---: |
| `nexus-agents` | 36,481 | 8 | 1 | 1 | 0 |
| `@shortcut/mcp` | 65,231 | 8 | 0 | 3 | 7 |
| `@shopify/dev-mcp` | 128,473 | 5 | 0 | 5 | 4 |
| `@serdnaley/metabase-mcp` | 243,342 | 8 | 0 | 8 | 0 |
| `@google-cloud/observability-mcp` | 110,871 | 8 | 0 | 0 | 8 |
| `brilliant-directories-mcp` | 26,452 | 8 | 0 | 8 | 0 |
| `@tacticlaunch/mcp-linear` | 16,377 | 8 | 0 | 8 | 0 |
| `hostinger-api-mcp` | 526,419 | 8 | 0 | 6 | 0 |
| ... 43 more | | | | | |

The single strongest finding, reproduced independently twice:

**`nexus-agents` `delegate_to_model`** declares

```json
{"readOnlyHint":false,"destructiveHint":false,"idempotentHint":true,"openWorldHint":false}
```

and an identical retry creates a second run directory with its own `index.md`
and `trace.jsonl`. `idempotentHint` is the flag a gateway reads to decide
whether retrying is safe. Nothing anywhere checks whether it is true.

Others worth naming:

- **`hostinger-api-mcp`** (526,000 monthly installs) retries `POST` to create
  cron jobs, databases and websites with no idempotency header at all, on the
  live connection and again after a reconnect.
- **`@shopify/dev-mcp` `feedback`** answers `ok`, then answers `Feedback
  already recorded for this session` to the identical second call: in-memory
  state with no file to see it in, caught only because the retry's answer moved.
- **`@shopify/dev-mcp` `learn_shopify_api`** mints a fresh conversation id per
  call and states that every other tool errors without the right one, so a
  retry after a lost response leaves the client holding an id the server has
  moved on from.

`PUT` and `DELETE` are excluded from the repeated-write count: HTTP defines
both as idempotent, so a server resending one has not done anything wrong. A
tool that declares `readOnlyHint: true` is taken at its word, so a repeated
search-style `POST` does not count either. The finding is reserved for a write
the tool itself does not claim is safe to repeat.

### Overlapping calls: a clean result

126 tools were run four-at-once and compared against the same four calls made
one after another. **None of them lost work.** That is worth stating plainly
rather than burying: on this evidence, MCP servers handle overlapping calls
well. The likely reason is unexciting, which is that Node is single-threaded
and most of these servers mutate their state synchronously inside one handler.

The probe is not merely failing to look. `doubletap selftest` demonstrates that
two two-second calls take 4.0s one at a time and 2.0s together, so the calls
genuinely overlap. Without that check a wall of passes would be
indistinguishable from a broken probe.

### What earlier runs got wrong

This harness has produced more false findings than real ones, and every one of
them came from the same root: measuring its own footprint, or measuring
unfairly. They are listed because a report about other people's defects is
worth nothing unless it is harder on itself than on them.

| Wrong finding | Cause |
| --- | --- |
| 8 contract violations against `bitbucket-mcp` | It used a synthesized credential as a filename and wrote its log there. That log growing by a line per call was read as the tool changing state. |
| 16 retry duplications | The same log files, under the retry probe. |
| 1 concurrency failure against `@shopify/dev-mcp` | Overlapping calls were held to the same per-call timeout as sequential ones. The server queues rather than parallelises, answered all four within ten seconds, and was reported as dropping three. |
| 1 lost update against `nexus-agents` | The snapshot raced the server's own writes. It answers and then flushes, so sampling the instant a call resolved saw one run directory where four had been created. |

Each was fixed at the root rather than filtered at the end:

- Synthesized credential values carry a marker, and any path containing one is
  excluded from the filesystem oracle. A finding caused by the harness's own
  footprint is now structurally impossible rather than merely unlikely.
- Growth appended to a file that already existed is classified apart from a
  file being created or replaced, because a server writing a log line when a
  connection drops has done nothing wrong.
- The concurrent phase gets at least twice the sequential run's own duration,
  because queueing is backpressure, not failure.
- Snapshots sample until two consecutive reads agree, and record how long that
  took, so a server that never settles is visible rather than silently
  truncated.

None of the surviving findings changed when those fixes landed, which is the
only reason to trust them.

## How it decides

**State, not self-report.** The server runs in a disposable sandbox with `HOME`, `TMPDIR` and the XDG directories redirected inside it. Its own package is cloned in too, because plenty of servers persist next to their code rather than anywhere configurable: `server-memory` writes `dist/memory.jsonl` into its own install directory, and without the clone that state is both invisible and shared between cases. Before and after every call the tree is hashed into a merkle snapshot. Content is hashed rather than mtime, so rewriting identical bytes does not register as a side effect.

**A reference run.** An interrupted call is compared against what a clean one leaves behind, which is what separates the four answers that matter:

| | meaning |
| --- | --- |
| `none` | the interruption left no trace: a clean abort |
| `applied` | the state matches a completed call, so only the acknowledgement was lost |
| `residue` | the target is untouched but something else was left behind: a leak |
| `torn` | the state matches neither, so the tool has no atomic unit a client can reason about |

**Arguments that actually work.** Values come from each tool's `inputSchema`, with the tool's *name* read for intent: a read tool is handed a path that exists, a create tool one that does not, an edit tool text that is genuinely in the file. Without this most tools return `ENOENT`, every case skips, and the result looks like a clean bill of health.

**Named differences.** When two identical calls answer differently, the report says which JSON paths moved. A tool that mints a fresh conversation id is doing its job; a tool whose returned balance drifts is not, and only the paths tell them apart.

## The probes

| Probe | Deterministic | What it proves |
| --- | --- | --- |
| `idempotency` | yes | An identical retry either converges on the same state or applies the effect twice. A tool that declares `idempotentHint: true` and fails this is a contract violation, not a bug report. |
| `retry-signal` | yes | The state converged but the answer changed, so a retrying client cannot distinguish a duplicate from a fresh success. |
| `answer-stability` | yes | Two identical calls answered differently with no state to explain it. The only axis available for servers that keep nothing locally, and it catches in-memory state the filesystem oracle cannot see. |
| `upstream-idempotency` | yes | The interceptor answers every outbound request without opening a socket, and the ordered log of attempted requests becomes the state. Catches a retry re-sending the same write, checks whether an idempotency-style header survives the retry, and excludes methods HTTP already defines as safe to repeat. |
| `partial-failure` | yes | The client completes the call, loses the answer, reconnects and retries: the lost-acknowledgement case, with no race involved. Also sends half a request frame, which must change nothing. |
| `concurrency` | **no, by design** | Runs the same four calls twice, once strictly sequentially and once all in flight at once, and compares what survived. Sequential is the definition of correct, because it is what the author tested. Fewer entries under load is a lost update. |
| `kill-window` | **no, by design** | Kills the server at a ladder of delays after delivery. Each rung is knocked on three times, because the window is often under a millisecond wide. |

## Reaching servers that need a live service

Two extra mechanisms exist purely to get more of the 284 packages past the "no
call succeeded" wall, without ever touching a real credential or a real host.

**Credential synthesis** (`src/target/credentials.ts`) scans a package's own
source for `process.env.X` and `process.env["X"]` and, for names that look
like a secret, fills in a value shaped like the real thing: a URL for
`*_BASE_URL`, a region code for `*_REGION`, a long opaque string otherwise.
Runtime variables that would change behaviour -- `NODE_ENV`, `PATH`, the XDG
directories -- are never touched. This alone took the no-credentials count
from 84 to 119 servers.

**The network interceptor** (`src/net/interceptor.mjs`) is loaded into the
target with `NODE_OPTIONS=--import`, before any of the server's own code runs.
It patches `fetch`, `http.request` and `https.request` so no socket is ever
opened: every outbound call is answered from a small cassette when one
matches, or a generic `200 {}` otherwise, and logged in full -- method, URL,
headers, body -- to a file the harness reads back. A server can be driven
through its whole write path with no network and no credentials, and what
comes out is the exact sequence of requests it tried to send, which
[`UpstreamOracle`](src/oracle/upstream.ts) turns into the same kind of
before-and-after diff the filesystem oracle produces for local state.

## Running untrusted code

The census executes hundreds of packages nobody audited. An early run learned this the hard way: a server started an OAuth flow and opened a real browser window on the host.

Two layers now, because either alone has a hole:

- **`sandbox-exec`** denies network, denies writes outside the sandbox, and denies executing anything but `node`. That catches a server calling `/usr/bin/open` by absolute path. `confine.selfTest()` checks all three hold before a census starts.
- **PATH shims** put no-op stand-ins for `open`, `xdg-open` and the browser binaries ahead of the real ones, so a library that resolves them through `PATH` gets a silent success rather than an `EPERM` it might report as a tool failure.

A short list of servers is excluded outright, each with a stated reason, in `src/target/confine.ts` and `src/target/autoconfig.ts`. Blocking the network is not only a safety measure: it is what makes the census free, and it is why 43 servers report that nothing could be run against them. That is a real limitation, stated rather than papered over.

## Determinism, and where it stops

Every choice comes from one seed: argument values, tokens, probe order, cut offsets. Sandbox paths are redacted on the way into the trace and frame hashes are taken over the redacted form, so two runs of the same seed produce the same bytes.

That claim is checked rather than asserted:

```
$ doubletap verify --target filesystem
records            528 vs 528
verdicts equal     true
unexplained drift  5 of 528 records
learned volatile paths: $.msg.result.content[*].text, $.evidence.firstCall.preview, ...
```

The five remaining records are `get_file_info` returning the file's creation time. That is the server's clock, not ours, and it is *learned* by running the same seed twice and diffing leaf paths, then reported, rather than masked away in advance.

Two limits are stated rather than hidden:

1. **Timing searches are not reproducible.** `kill-window` races the server and is marked `timingSearch`, which excludes it from the determinism check. It records what it found so the trace can be replayed; it does not promise to find it again on a loaded machine.
2. **One quiesce barrier uses wall time.** Servers send `roots/list` the instant they are initialised, and without a 150ms barrier after `initialize` that frame lands on a different trace line every run. It is the only place real time enters the harness.

## Traces

Every run writes a `.dt.jsonl` trace: one record per line, append-only, greppable, diffable.

```jsonl
{"k":"hdr","v":1,"seed":"dt-census-1","volatile":["$.runId","$.startedAt","$.repro"],...}
{"k":"f","seq":22,"t":23,"dir":"out","bytes":256,"sha":"sha256:...","msg":{...}}
{"k":"fault","seq":24,"tool":"write_file","kind":"kill","note":"server SIGKILLed 4ms after delivery"}
{"k":"snap","seq":25,"label":"write_file:kill4:after","digest":"sha256:...","entries":[...]}
{"k":"verdict","seq":26,"probe":"kill-window","tool":"write_file","status":"violation","code":"torn-write","claim":"...","repro":"doubletap replay ..."}
```

Every verdict carries the command that reproduces it. Replay reads the trace back and recomputes each snapshot's merkle root from its recorded entries rather than trusting the stored digest, so an edited or truncated trace is detected instead of believed:

```
$ doubletap replay runs/census-v5/filesystem-dt-census-1.dt.jsonl --tool write_file
...
336 records, 231 frames, 61/61 snapshot digests recomputed and matched
```

## Install and run

Node 22.18 or newer, macOS for the confinement. TypeScript sources run directly through Node's type stripping, so there is no build step.

```bash
npm install
node scripts/discover.mjs && node scripts/enrich.mjs 500 && node scripts/install.mjs

node --no-warnings src/cli.ts selftest
node --no-warnings src/cli.ts discover --concurrency 6
node --no-warnings src/cli.ts screen --concurrency 4
node --no-warnings src/cli.ts census --auto scripts/targets.auto.json --screened scripts/screen.json --verify filesystem
```

`selftest` checks the harness's own preconditions before it is used to judge
anyone else, because both of them fail silently. If confinement is not
actually denying network and exec, a census is running unaudited packages
unsupervised while reporting that it is not. If concurrent calls are not
actually overlapping at the server, the concurrency probe returns a clean pass
for every tool and has proven nothing:

```
$ doubletap selftest
ok    confinement          network, out-of-sandbox writes and non-node exec are all denied
ok    concurrency-overlap  two 2s calls took 4012ms one at a time and 2003ms together, so they really do overlap
```

`census` writes `census.json`, `census.html`, `census.md` and `census.csv` alongside the traces. The HTML is a summary table with per-server detail collapsed; evidence, state diffs and frame logs stay in the JSON and the traces rather than being inlined into a page too large to open.

## What is not built yet, and why

Each of these was scoped by measuring the population it would serve rather
than by assuming one. Two of them turned out not to be worth building yet,
and the measurement is recorded so the decision can be revisited rather than
re-argued.

- **A SQLite oracle.** Six of the 121 reachable servers depend on a SQLite
  driver, so this looked worth doing. It is not, yet: across the whole
  94-server census, **no verdict rested on a database file changing at all**.
  Hashing a `.db` wholesale would produce false positives from vacuum and page
  reshuffling, and the right unit is a per-table row digest, but there is
  currently nothing for it to decide. Build it when a server actually writes
  one under test.
- **HTTP and SSE transports.** 69 servers were rejected during discovery as
  "not a stdio server", which suggested a large population waiting behind an
  HTTP transport. Sampling 24 of those 69 under a profile that permits
  localhost, **nearly all of them bind no port at all** -- they hang, or exit
  quietly, or want an argument nobody passed. They are not HTTP servers. The
  fault layer is still transport-shaped and the stdio implementation is
  hand-written so frames can be cut mid-byte, but building the HTTP side would
  currently unlock a handful of servers, not 69.
- **Approval-bypass and prompt-injection probes.** Both were in the original
  design and neither is written.
- **Linux confinement.** `sandbox-exec` is macOS only. On any other platform
  `confine.available` is false, and `doubletap selftest` reports that targets
  would run unconfined rather than letting a census proceed as though they
  were not.
- **Real cassettes.** The interceptor answers with a generic `200 {}` unless a
  matching recording exists. Recording real traffic once, with secrets
  stripped, would get more tools past validation that checks the shape of a
  response rather than just its status.
- **The 10 servers that need a live service.** A native MongoDB or SQL Server
  connection speaks its own binary wire protocol over TCP, not HTTP, so the
  interceptor never sees it. Faking those means writing a protocol-specific
  stub per database. No amount of placeholder credentials reaches an OAuth
  exchange or an account that has to already exist either.

## Who wrote this

Thirteen years full-stack, ten of them on payment integrations (KSNET, KCP, in-app purchase). Idempotency keys, duplicate-approval guards, compensating transactions and audit trails were the daily work. An agent that executes real actions has the same problem, on infrastructure that has not yet learned the lesson: today an MCP tool can declare `idempotentHint: true` and nothing anywhere checks whether that is true.

## License

MIT.

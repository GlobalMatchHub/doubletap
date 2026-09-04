Repo:  https://github.com/nexus-substrate/nexus-agents/issues
Title: delegate_to_model declares idempotentHint: true, but a retry creates a second run

---

Hi, and thanks for the work on this.

I have been building a test harness that checks whether MCP tools behave the
way their annotations promise when a call is retried, and `delegate_to_model`
came up. I want to be upfront that this is an automated finding, so please tell
me if I have misread the intent.

**What the tool declares** (v8.3.0, from `tools/list`):

```json
{
  "title": "Delegate to Model",
  "readOnlyHint": false,
  "destructiveHint": false,
  "idempotentHint": true,
  "openWorldHint": false
}
```

**What happens.** Two identical calls with identical arguments create two
separate run directories:

```
.nexus-agents/runs/delegate-34df2a8a/    index.md, trace.jsonl
.nexus-agents/runs/delegate-d3c4871a/    index.md, trace.jsonl
```

Reproduced on 8.3.0 across independent runs; the directory hashes differ each
time, so the second call is not recognising the first.

**Why it matters.** `idempotentHint: true` is what a gateway or agent runtime
reads to decide that retrying is safe. The situation it exists for is a lost
response: the call succeeded, the answer never arrived, and the client cannot
tell that apart from "never happened". If it retries on the strength of that
flag, the delegation runs twice, which for a tool that delegates to a model
means paying twice and getting two divergent traces.

**Two ways out, and you are much better placed than I am to judge which.**

1. Make it idempotent, by deriving the run id from the arguments so an
   identical call resolves to the existing run rather than a new one.
2. Drop `idempotentHint` (or set it to `false`). Nothing is wrong with a tool
   that is not idempotent; the mismatch is the only problem here, and this is
   the smaller change.

**Reproducing it.** The harness is at
https://github.com/GlobalMatchHub/doubletap (MIT). It runs servers offline
inside a sandbox with no network, so nothing reached your API:

```bash
npm install && npm run setup
node --no-warnings src/cli.ts run --target nexus-agents --tool delegate_to_model --probe idempotency
```

Or without any of that: call the tool twice with the same arguments and look at
`.nexus-agents/runs/`.

**Please push back if this is wrong.** The harness has produced false findings
before, all of them documented in its README, and I would rather hear that this
is one than have you spend time on it. Happy to share the full trace.

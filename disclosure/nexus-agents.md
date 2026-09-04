Repo:  https://github.com/nexus-substrate/nexus-agents/issues
Title: delegate_to_model declares idempotentHint: true, but a retry creates a second run

---

Hi, and thanks for the work on this.

I have been testing published MCP servers for what happens when a tool call is
retried after a lost response, and `delegate_to_model` came up. This started
from an automated harness, so please tell me if I have misread the intent, but
I have reproduced it by hand as well.

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

**What happens.** Two calls with identical arguments create two separate run
directories, each with its own `index.md` and `trace.jsonl`:

```
.nexus-agents/runs/delegate-34df2a8a/
.nexus-agents/runs/delegate-d3c4871a/
```

The directory hashes differ every time, so the second call is not recognising
the first. Reproduced on 8.3.0 across independent runs.

**Why it matters.** `idempotentHint: true` is what a gateway or agent runtime
reads to decide that retrying is safe. The situation it exists for is a lost
response: the call succeeded, the answer never arrived, and the client cannot
tell that apart from "never happened". If it retries on the strength of that
flag, the delegation runs twice, which for a tool that delegates to a model
means paying twice and getting two divergent traces.

**Two ways out, and you are much better placed than I am to judge which.**

1. Make it idempotent, by deriving the run id from the arguments so an
   identical call resolves to the existing run rather than a new one.
2. Drop `idempotentHint`, or set it to `false`. Nothing is wrong with a tool
   that is not idempotent, and this is the smaller change. The mismatch is the
   only problem here.

**Reproducing it without any tooling:** call `delegate_to_model` twice with the
same arguments and look at `.nexus-agents/runs/`.

**Or with the harness** ([Doubletap](https://github.com/GlobalMatchHub/doubletap), MIT).
It runs servers offline inside a sandbox with no network access, so nothing
reached any API:

```bash
git clone https://github.com/GlobalMatchHub/doubletap && cd doubletap
npm install
npm install --prefix servers --ignore-scripts nexus-agents
node --no-warnings src/cli.ts run --package nexus-agents --tool delegate_to_model --probe idempotency
```

```
VIOLATION delegate_to_model [idempotency] Declares idempotentHint: true, but an
identical retry changed the state again (+.nexus-agents/runs/delegate-70a99b30/, ...)
```

**Please push back if this is wrong.** That harness has produced false findings
before, seven classes of them, all documented in its README with their causes.
I would rather hear that this is another one than have you spend time on it.
Happy to share the full trace.

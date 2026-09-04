Repo:  https://github.com/hostinger/api-mcp-server/issues
Title: Write tools resend identical POSTs on retry with no idempotency header

---

Hi, thanks for maintaining this.

I have been testing published MCP servers for what happens when a tool call is
retried after a lost response, and wanted to flag what I found here. This came
out of an automated harness, so please correct me where I have it wrong.

**What happens** (v1.55.1). Calling `agency-hosting_createANewWebsiteV1` twice
with identical arguments sends the same request upstream twice, byte for byte:

```
call 1:  POST /api/agency-hosting/v1/orders/7/websites/setups
call 2:  POST /api/agency-hosting/v1/orders/7/websites/setups   (identical body)
```

Neither carries an idempotency header of any kind. The same pattern appears on
other write tools, including `agency-hosting_createWebsiteCronJobV1` and
`agency-hosting_createWebsiteDatabaseV1`. It holds both on a live connection
and after a reconnect, so there is no in-memory deduplication being lost on
restart either.

The tool annotates itself correctly as a write:

```json
{ "title": "Create a new website", "readOnlyHint": false, "destructiveHint": false }
```

so this is not an annotation problem. The declaration is right; the retry
behaviour is the question.

**Why it matters.** An MCP client cannot distinguish "the call succeeded and
the answer was lost" from "the call never arrived". Retrying is the normal
response, and agent runtimes do it automatically. As written, a retry of these
tools provisions a second website, a second database, a second cron job.

**The question I cannot answer from outside.** Does the Hostinger API accept an
idempotency key on these endpoints? If it does, having the MCP server generate
one per logical call and reuse it across retries would close this. If it does
not, then the gap is upstream of this repository and this issue is really a
request to raise it there.

**Nothing reached your API and no account was touched.** The harness intercepts
every outbound request inside the server's own process and answers it with a
stub, and the server additionally runs under a sandbox that denies network
access outright. What it records is what the server tried to send.

**Reproducing it** ([Doubletap](https://github.com/GlobalMatchHub/doubletap), MIT):

```bash
git clone https://github.com/GlobalMatchHub/doubletap && cd doubletap
npm install
npm install --prefix servers --ignore-scripts hostinger-api-mcp
node --no-warnings src/cli.ts run --package hostinger-api-mcp \
  --tool agency-hosting_createANewWebsiteV1 --probe upstream-idempotency
```

**Please tell me if this is wrong.** That harness has produced false findings
before, seven classes of them, all documented in its README with their causes,
and I would rather be corrected than waste your time. Full request traces
available if useful.

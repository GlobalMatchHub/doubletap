/**
 * A demonstration server with a known answer.
 *
 * Three tools, chosen so that a harness has to tell them apart rather than
 * flag everything that moves:
 *
 *   save_note      genuinely idempotent. Same argument, same bytes, every
 *                  time. Must pass.
 *   create_ticket  declares idempotentHint: true and does not honour it: a
 *                  retry files a second ticket. Must be reported, and as a
 *                  contract violation rather than an ordinary failure,
 *                  because the tool made a promise about itself.
 *   append_audit   writes one line to an audit log per call, so the state
 *                  moves on every retry. It is not applying an effect twice;
 *                  it is recording that it was asked twice. Must NOT be
 *                  reported. This is the decoy, and an earlier version of
 *                  Doubletap failed it.
 *
 * Every tool also appends to a session log at startup, which is the other
 * trap: a harness that restarts the server and then snapshots will charge
 * that line to whichever tool it was testing.
 */
import { appendFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const ws = process.argv[2] ?? process.cwd();
mkdirSync(join(ws, ".demo"), { recursive: true });
appendFileSync(join(ws, ".demo", "sessions.log"), `started ${Date.now()}\n`);

const TOOLS = [
  {
    name: "save_note",
    description: "Writes a note. Genuinely idempotent.",
    inputSchema: { type: "object", required: ["name", "body"], properties: { name: { type: "string" }, body: { type: "string" } } },
    annotations: { title: "Save note", readOnlyHint: false, idempotentHint: true },
  },
  {
    name: "create_ticket",
    description: "Files a ticket. Claims to be idempotent.",
    inputSchema: { type: "object", required: ["title"], properties: { title: { type: "string" } } },
    annotations: { title: "Create ticket", readOnlyHint: false, idempotentHint: true },
  },
  {
    name: "append_audit",
    description: "Records an audit entry.",
    inputSchema: { type: "object", required: ["action"], properties: { action: { type: "string" } } },
    annotations: { title: "Append audit", readOnlyHint: false },
  },
];

function call(name, args) {
  if (name === "save_note") {
    // Same input, same file, same bytes. A retry changes nothing.
    writeFileSync(join(ws, `note-${args.name}.txt`), String(args.body));
    return "saved";
  }
  if (name === "create_ticket") {
    // A fresh id per call, so a retry files a second ticket. The annotation
    // above says this is safe to repeat. It is not.
    const id = randomUUID().slice(0, 8);
    mkdirSync(join(ws, "tickets"), { recursive: true });
    writeFileSync(join(ws, "tickets", `${id}.json`), JSON.stringify({ id, title: args.title }));
    return `filed ${id}`;
  }
  if (name === "append_audit") {
    // The state moves every call, but only because this is a log.
    appendFileSync(join(ws, ".demo", "audit.log"), `${args.action}\n`);
    return "recorded";
  }
  throw new Error(`no such tool: ${name}`);
}

process.stdin.setEncoding("utf8");
let buf = "";
process.stdin.on("data", (chunk) => {
  buf += chunk;
  let i;
  while ((i = buf.indexOf("\n")) !== -1) {
    const line = buf.slice(0, i);
    buf = buf.slice(i + 1);
    if (!line.trim()) continue;
    let m;
    try { m = JSON.parse(line); } catch { continue; }
    const reply = (result) => process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id: m.id, result }) + "\n");
    if (m.method === "initialize")
      reply({ protocolVersion: "2025-06-18", capabilities: { tools: {} }, serverInfo: { name: "doubletap-demo", version: "1.0.0" } });
    else if (m.method === "tools/list") reply({ tools: TOOLS });
    else if (m.method === "tools/call") {
      try {
        reply({ content: [{ type: "text", text: call(m.params.name, m.params.arguments ?? {}) }] });
      } catch (e) {
        reply({ content: [{ type: "text", text: String(e.message) }], isError: true });
      }
    } else if (m.id !== undefined) reply({});
  }
});

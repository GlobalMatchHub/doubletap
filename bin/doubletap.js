#!/usr/bin/env node
// Node 22.18+ strips TypeScript types natively, so the sources run as they are
// and there is no build step between reading the code and running it.
import "../src/cli.ts";

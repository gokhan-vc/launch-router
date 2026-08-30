#!/usr/bin/env npx tsx
import readline from "node:readline";
import { handleJsonRpc, type JsonRpcReq } from "./jsonrpc.js";

const rl = readline.createInterface({ input: process.stdin });

rl.on("line", async (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  let msg: JsonRpcReq;
  try {
    msg = JSON.parse(trimmed) as JsonRpcReq;
  } catch {
    process.stderr.write("invalid json\n");
    return;
  }
  const out = await handleJsonRpc(msg);
  if (out == null) return;
  process.stdout.write(`${JSON.stringify(out)}\n`);
});

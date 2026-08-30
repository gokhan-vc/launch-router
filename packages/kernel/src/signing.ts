import type { PadId } from "./intent.js";

/** Same Sign on Mini App, MCP, curl, and any agent with the user's wallet or Bankr user key. */
export type HowToSign = {
  surfaces: string[];
  action: string;
  never: string[];
};

const UNPROVEN: HowToSign = {
  surfaces: [],
  action: "Unproven — no sign payload. Do not invent a tx.",
  never: ["fake calldata", "hot wallet on the router"],
};

export const HOW_TO_SIGN: Record<PadId, HowToSign> = {
  clanker: {
    surfaces: ["mini-app", "mcp", "clanker-sdk", "agent-wallet"],
    action:
      "Pass payload.config to Clanker SDK deploy() with the user's wallet. Mini App Sign and get_sign_payload return the same object.",
    never: [
      "router hot wallet",
      "broadcast / send_transaction / deploy tools on this origin",
    ],
  },
  bankr: {
    surfaces: ["mini-app", "mcp", "curl", "agent-http"],
    action:
      "POST payload.url from the user's machine with X-API-Key: their bk_usr_ key. simulateOnly true, then check feeDistribution against expectedSplit (57/36.1/1.9/5, no partner). Then the same body with simulateOnly false. Never send the key to launch.numetal.xyz.",
    never: [
      "bk_ptr_ partner keys",
      "X-Partner-Key",
      "sending the Bankr key to the launch-router origin",
    ],
  },
  poolsfun: {
    surfaces: ["mini-app", "mcp", "wallet", "eth_sendTransaction"],
    action:
      "User wallet sends payload.tx (PartyFactory.launch) on Robinhood 4663. creator must equal msg.sender. Re-read startTickFor at send time. Mini App Sign and get_sign_payload return the same tx.",
    never: [
      "router broadcast",
      "creator != signer",
      "stale expectedStartTick",
    ],
  },
  pons: UNPROVEN,
  feelcash: UNPROVEN,
  poolstrade: UNPROVEN,
  pumpfun: UNPROVEN,
  flap: UNPROVEN,
};

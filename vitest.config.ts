import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@numetal/launch-kernel": `${root}packages/kernel/src/index.ts`,
      "@numetal/adapter-clanker": `${root}packages/adapters/clanker/src/index.ts`,
      "@numetal/adapter-bankr": `${root}packages/adapters/bankr/src/index.ts`,
      "@numetal/adapter-poolsfun": `${root}packages/adapters/poolsfun/src/index.ts`,
      "@numetal/launch-telegram": `${root}packages/telegram/src/commands.ts`,
    },
  },
  test: {
    include: ["packages/**/test/**/*.test.ts"],
  },
});

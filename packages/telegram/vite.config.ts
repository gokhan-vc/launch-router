import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../..", import.meta.url));

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  resolve: {
    alias: {
      "@numetal/launch-kernel": `${root}/packages/kernel/src/index.ts`,
      "@numetal/adapter-clanker": `${root}/packages/adapters/clanker/src/index.ts`,
      "@numetal/adapter-bankr": `${root}/packages/adapters/bankr/src/index.ts`,
      "@numetal/adapter-poolsfun": `${root}/packages/adapters/poolsfun/src/index.ts`,
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    port: 5177,
    host: true,
  },
  optimizeDeps: {
    exclude: ["clanker-sdk"],
  },
});

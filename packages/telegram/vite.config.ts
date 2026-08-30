import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../..", import.meta.url));

export default defineConfig({
  plugins: [react()],
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
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL("./index.html", import.meta.url)),
        app: fileURLToPath(new URL("./app.html", import.meta.url)),
      },
    },
  },
  server: {
    port: 5177,
    host: true,
  },
  optimizeDeps: {
    exclude: ["clanker-sdk"],
  },
});

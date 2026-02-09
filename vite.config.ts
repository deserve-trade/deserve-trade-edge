import { reactRouter } from "@react-router/dev/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = fileURLToPath(new URL(".", import.meta.url));
const tweetnaclShim = resolve(rootDir, "app/lib/vendor/tweetnacl-default.ts");

export default defineConfig({
  optimizeDeps: {
    exclude: ["@phantom/react-sdk", "@phantom/browser-sdk", "@solana/web3.js"],
    include: ["buffer", "tweetnacl", "eventemitter3", "bn.js", "bs58", "jayson/lib/client/browser", "@solana/buffer-layout", "borsh"],
  },
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
  ],
});

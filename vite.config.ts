import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": resolve(rootDir, "src") },
  },
  server: {
    port: 5174,
    proxy: {
      "/api": {
        target: process.env.VO_API_ORIGIN || "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});

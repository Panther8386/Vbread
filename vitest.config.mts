import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  // Nạp .env.local (URL, anon key, service_role key) vào process.env cho test.
  const env = loadEnv(mode, process.cwd(), "");
  for (const [key, value] of Object.entries(env)) {
    if (!(key in process.env)) process.env[key] = value;
  }

  return {
    plugins: [react()],
    test: {
      environment: "jsdom",
      globals: true,
      include: ["src/**/*.test.{ts,tsx}"],
      testTimeout: 30000,
      hookTimeout: 30000,
      pool: "forks",
    },
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
    },
  };
});

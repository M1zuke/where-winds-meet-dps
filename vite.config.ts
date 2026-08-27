import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"
import react, { reactCompilerPreset } from "@vitejs/plugin-react"
import babel from "@rolldown/plugin-babel"

export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset({ target: "19" })] })],
  server: { port: 5173, strictPort: true },
  css: {
    preprocessorOptions: {
      scss: {
        loadPaths: [fileURLToPath(new URL("src/styles", import.meta.url))],
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    execArgv: ["--no-experimental-webstorage"],
  },
})

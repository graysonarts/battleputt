import { defineConfig } from "vite";
import wasm from "vite-plugin-wasm";

export default defineConfig({
  build: {
    target: "esnext",
  },
  base: "/battleputt/",
  plugins: [wasm({})],
});

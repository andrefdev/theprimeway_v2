import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  // Bundle workspace package so it's not needed at runtime
  noExternal: ["@repo/shared"],
});

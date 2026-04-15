import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  // Bundle @prisma/client into the output so tsup handles CJS→ESM interop
  // (Prisma client is CJS; Node ESM can't do named imports from CJS)
  noExternal: ["@prisma/client"],
});

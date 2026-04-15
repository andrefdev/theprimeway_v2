import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    "types/index": "src/types/index.ts",
    "validators/index": "src/validators/index.ts",
    "constants/index": "src/constants/index.ts",
    "constants/plans": "src/constants/plans.ts",
    "utils/index": "src/utils/index.ts",
  },
  format: ["esm"],
  dts: true,
  splitting: false,
  clean: true,
});

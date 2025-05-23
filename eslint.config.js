import { config } from "@susisu/eslint-config";
import globals from "globals";

export default config(
  {
    tsconfigRootDir: import.meta.dirname,
  },
  {
    languageOptions: {
      globals: {
        ...globals.es2024,
        ...globals.node,
      },
    },
    rules: {
      // async / await を使わずに async / await を再現するのが主旨なので, async 関数にすることを要求しない
      "@typescript-eslint/promise-function-async": "off",
    },
  },
);

import copy from "rollup-plugin-copy";
import esbuild from "rollup-plugin-esbuild";
import replace from "@rollup/plugin-replace";
import pkg from "./package.json" assert { type: "json" };

export default {
  input: "src/index.ts",
  plugins: [
    replace({
      include: "src/index.ts",
      preventAssignment: true,
      values: {
        __version: JSON.stringify(pkg.version),
      },
    }),
    esbuild(),
    copy({
      targets: [{ src: "src/storylets.ink", dest: "patches" }],
    }),
  ],
  output: [
    {
      file: `patches/storylets.js`,
      format: "es",
    },
  ],
};

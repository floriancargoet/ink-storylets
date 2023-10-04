import copy from "rollup-plugin-copy";
import esbuild from "rollup-plugin-esbuild";

export default {
  input: "src/index.ts",
  plugins: [
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

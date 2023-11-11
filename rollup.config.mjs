import copy from "rollup-plugin-copy";
import esbuild from "rollup-plugin-esbuild";
import replace from "@rollup/plugin-replace";
import pkg from "./package.json" assert { type: "json" };

export default [
  // Pure ink
  {
    input: "src/pure-ink/index.ts",
    plugins: [
      esbuild(),
      copy({
        targets: [{ src: "src/core/storylets.ink", dest: "dist/pure-ink" }],
      }),
    ],
    output: [
      {
        file: `dist/pure-ink/storylets.js`,
        format: "iife",
      },
    ],
  },
  // Calico patch
  {
    input: "src/calico/index.ts",
    plugins: [
      replace({
        include: "src/calico/index.ts",
        preventAssignment: true,
        values: {
          __version: JSON.stringify(pkg.version),
        },
      }),
      esbuild(),
      copy({
        targets: [
          { src: "src/core/storylets.ink", dest: "dist/calico/patches" },
        ],
      }),
    ],
    output: [
      {
        file: `dist/calico/patches/storylets.js`,
        format: "es",
      },
    ],
  },
];

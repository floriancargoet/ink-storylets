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
        hook: "writeBundle",
        targets: [
          { src: "src/core/storylets.ink", dest: "dist/pure-ink" },
          { src: "src/core/storylets.ink", dest: "demo/pure-ink" },
          { src: "dist/pure-ink/storylets.js", dest: "demo/pure-ink" },
        ],
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
        hook: "writeBundle",
        targets: [
          { src: "src/core/storylets.ink", dest: "dist/calico" },
          { src: "src/core/storylets.ink", dest: "demo/calico" },
          { src: "dist/calico/storylets.js", dest: "demo/calico" },
        ],
      }),
    ],
    output: [
      {
        file: `dist/calico/storylets.js`,
        format: "es",
      },
    ],
  },
];

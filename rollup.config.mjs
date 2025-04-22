import copy from "rollup-plugin-copy";
import esbuild from "rollup-plugin-esbuild";
import replace from "@rollup/plugin-replace";
import { dts } from "rollup-plugin-dts";
import pkg from "./package.json" with { type: "json" };

const basePlugins = [
  // Typescript
  esbuild(),
];

function copyInkToDemoDist(name) {
  return copy({
    // Copy after the output is compiled
    hook: "writeBundle",
    targets: [
      { src: "src/core/storylets.ink", dest: `dist/${name}` },
      {
        src: ["src/core/storylets.ink", `dist/${name}/storylets.js`],
        dest: `demo/${name}`,
      },
    ],
  });
}

export default [
  // Pure ink as global
  {
    input: "src/entries/ink-global.ts",
    plugins: [...basePlugins, copyInkToDemoDist("ink-global")],
    output: [
      {
        file: `dist/ink-global/storylets.js`,
        format: "iife",
      },
    ],
  },
  // Pure ink as ES module with typings
  {
    input: "src/entries/ink-esm.ts",
    plugins: [...basePlugins, copyInkToDemoDist("ink-esm")],
    output: [
      {
        file: `dist/ink-esm/storylets.js`,
        format: "es",
      },
    ],
  },
  {
    input: "src/entries/ink-esm.ts",
    plugins: [dts()],
    output: [
      {
        file: `dist/ink-esm/storylets.d.ts`,
        format: "es",
      },
    ],
  },
  // Calico patch
  {
    input: "src/entries/calico.ts",
    plugins: [
      ...basePlugins,
      // Inject version
      replace({
        include: "src/entries/calico.ts",
        preventAssignment: true,
        values: {
          __version: JSON.stringify(pkg.version),
        },
      }),
      copyInkToDemoDist("calico"),
    ],
    output: [
      {
        file: `dist/calico/storylets.js`,
        format: "es",
      },
    ],
  },
];

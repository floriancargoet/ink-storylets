import { Storylets } from "../core/Storylets";
import { StoryletsDebugger } from "../core/StoryletsDebugger";

const credits = {
  emoji: "🧶",
  name: "Storylets",
  author: "Florian Cargoët",
  // @ts-expect-error Injected by rollup
  version: __version,
  description: "Storylets",
  licences: {
    self: "2023",
  },
};

const options = {};

declare global {
  interface Window {
    storyletsDebugger: StoryletsDebugger;
  }
}

Patches.add(
  function () {
    const storylets = new Storylets(this.ink);
    window.storyletsDebugger = new StoryletsDebugger(storylets);
    console.log("A storylet debugger is available as 'storyletsDebugger'.");
  },
  options,
  credits
);

export default { options, credits };

import { Storylets } from "./Storylets";
import { StoryletsDebugger } from "./StoryletsDebugger";

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

Patches.add(
  function () {
    const storylets = new Storylets(this.ink);
    // @ts-ignore
    window.storyletsDebugger = new StoryletsDebugger(storylets);

    ExternalFunctions.add("storylets_select", (selectQuery: string) =>
      storylets.select(selectQuery)
    );

    ExternalFunctions.add("storylets_get_next", () => storylets.getNext());
    ExternalFunctions.add(
      "storylets_get_prop",
      <T>(storyletName: string, propName: string, defaultValue: T) =>
        storylets.getProp(storyletName, propName, defaultValue)
    );
  },
  options,
  credits
);

export default { options: options, credits: credits };

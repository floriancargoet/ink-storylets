import { Storylets } from "./Storylets";

const credits = {
  emoji: "🧶",
  name: "Storylets2",
  author: "Florian Cargoët",
  version: "1.1",
  description: "Storylets",
  licences: {
    self: "2023",
  },
};

const options = {};

Patches.add(
  function () {
    const storylets = new Storylets(this.ink);

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

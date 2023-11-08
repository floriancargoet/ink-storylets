import { Story } from "inkjs/engine/Story";
import { Container } from "inkjs/engine/Container";
import { Path } from "inkjs/engine/Path";

import { Storylet } from "./Storylet";
import { parseSelectQuery } from "./SelectQuery";
import { shuffleArray, shuffleWithFrequency, take } from "./utils";

export class Storylets {
  // The ink story
  story: Story;
  // Store the iterable between ink calls
  iterable: IterableIterator<Storylet> | null = null;
  // Special divert variable, used as "null" for the divert type
  nullDivert: Path;
  // The detected storylets
  storylets: Array<Storylet>;

  constructor(story: Story) {
    this.story = story;
    // Find all "#storylet" or "#storylet: category" knots
    const knots = Array.from(
      story.mainContentContainer.namedContent.values()
    ) as unknown as Array<Container>;
    this.storylets = knots
      .map((knot) => Storylet.tryCreate(story, knot))
      .filter((s): s is Storylet => {
        if (s == null) return false;
        if (!s.isValid) {
          console.error(
            `Couldn't find a stitch named "content" in storylet "${s.knot.name}".`
          );
        }
        return s.isValid;
      });

    // Find special stitch named null_stitch
    const storyletsInternal = story.KnotContainerWithName("storylets_internal");
    const nullStitch = storyletsInternal?.namedContent.get("null_stitch") as
      | Container
      | undefined;
    if (!nullStitch) {
      throw new Error(
        "Ink story is missing a 'storylet_internal.null_stitch' stitch."
      );
    }
    this.nullDivert = nullStitch.path;
  }

  select(selectQuery: string) {
    const query = parseSelectQuery(selectQuery);
    // Start with open storylets
    let available = this.storylets.filter((s) => s.open);

    if (query.category) {
      const qCategories = query.category.map((c) => c.trim());
      available = available.filter((s) =>
        qCategories.every((c) => s.categories.includes(c))
      );
    }

    if (query.filter) {
      for (const filterFnName of query.filter) {
        const fnContainer = this.story.KnotContainerWithName(filterFnName);
        if (fnContainer) {
          available = available.filter((s) => {
            const { output, returned } = this.story.EvaluateFunction(
              filterFnName,
              [s.knot.name],
              true
            );
            // Log anything that was printed
            if (output) {
              console.log(filterFnName, output);
            }
            return returned;
          });
        } else {
          console.log("Filter function not found:", filterFnName);
        }
      }
    }
    // Find the max exclusivity in the remaining storylets
    const maxExclusivity = available.reduce(
      (max, s) => Math.max(max, s.exclusivity),
      0
    );

    // Only keep storylets matching this max exclusivity
    available = available.filter((s) => s.exclusivity === maxExclusivity);

    // Random can produce an iterable (to avoid computing all values)
    let randomIterable: IterableIterator<Storylet> | undefined;
    if (query.random) {
      if (query.random === "uniform") {
        shuffleArray(available);
      } else {
        // Use frequency
        randomIterable = shuffleWithFrequency(available);
      }
    } else {
      // Sort by urgency
      available.sort((a, b) => b.urgency - a.urgency);
    }

    // No max or negative or zero means all.
    if (query.max != null && query.max > 0) {
      available = take(query.max, randomIterable ?? available);
    }

    this.iterable = available.values();
  }

  // Consume one storylet in the iterable and return its divert (or the null divert)
  getNext() {
    if (!this.iterable) return this.nullDivert;
    const { value, done } = this.iterable.next();
    if (done) return this.nullDivert;
    return value.divert;
  }

  // Expose storylet prop getter to ink.
  getProp<T>(storyletName: string, propName: string, defaultValue: T) {
    const storylet = this.storylets.find((s) => s.knot.name === storyletName);
    return storylet?.get(propName, defaultValue) ?? defaultValue;
  }
}

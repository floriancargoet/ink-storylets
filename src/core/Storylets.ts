import type { Story } from "inkjs/engine/Story";
import type { Container } from "inkjs/engine/Container";

import { Storylet } from "./Storylet";
import { parseSelectQuery } from "./SelectQuery";
import {
  createEvaluatorFlow,
  destroyEvaluatorFlow,
  shuffleArray,
  shuffleByFrequency,
  take,
  provideRandom,
} from "./utils";

export class Storylets {
  // The ink story
  story;
  // Special divert variable, used as "null" for the divert type
  nullDivert;
  // The detected storylets
  storylets;
  // Store the iterable between ink calls
  iterable: IterableIterator<Storylet> | null = null;

  constructor(story: Story) {
    provideRandom((min, max) => {
      return story.EvaluateFunction("ink_random", [min, max]);
    });
    this.story = story;
    this.nullDivert = this.fetchNullDivert();
    this.storylets = this.fetchStorylets();
    this.bindExternalFunctions();
  }

  fetchStorylets() {
    // Find all "#storylet" or "#storylet: category" knots
    const knots = Array.from(
      this.story.mainContentContainer.namedContent.values()
    ) as unknown as Array<Container>;
    // Wrap them in Storylet instances
    return knots
      .map((knot) => Storylet.tryCreate(this.story, knot))
      .filter((s): s is Storylet => {
        if (s == null) return false;
        if (!s.isValid) {
          console.error(
            `Couldn't find a stitch named "content" in storylet "${s.knot.name}".`
          );
        }
        return s.isValid;
      });
  }

  fetchNullDivert() {
    // Find special stitch named null_stitch
    const storyletsInternal =
      this.story.KnotContainerWithName("storylets_internal");
    const nullStitch = storyletsInternal?.namedContent.get("null_stitch") as
      | Container
      | undefined;
    if (!nullStitch) {
      throw new Error(
        "Ink story is missing a 'storylets_internal.null_stitch' stitch."
      );
    }
    // Use its path as a "null divert"
    return nullStitch.path;
  }

  bindExternalFunctions() {
    const bindings = {
      storylets_select: this.select.bind(this),
      storylets_get_next: this.getNext.bind(this),
      storylets_get_prop: this.getProp.bind(this),
    };
    for (const [name, fn] of Object.entries(bindings)) {
      this.story.BindExternalFunction(name, fn);
    }
  }

  select(selectQuery: string) {
    // We're going to evaluate of lot of ink containers, so we handle the flow so that only one is created.
    createEvaluatorFlow(this.story);

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
        randomIterable = shuffleByFrequency(available);
      }
    } else {
      // Sort by urgency
      available.sort((a, b) => b.urgency - a.urgency);
    }

    // No max or negative or zero means all.
    const count = query.max != null && query.max > 0 ? query.max : Infinity;

    this.iterable = take(count, randomIterable ?? available);
    destroyEvaluatorFlow(this.story);
  }

  // Consume one storylet in the iterable and return its divert (or the null divert)
  getNext() {
    if (!this.iterable) return this.nullDivert;
    const { value, done } = this.iterable.next();
    if (done) return this.nullDivert;
    return value.divert ?? this.nullDivert;
  }

  // Expose storylet prop getter to ink.
  getProp(storyletName: string, propName: string, defaultValue: any): unknown {
    const storylet = this.storylets.find((s) => s.knot.name === storyletName);
    return storylet?.get(propName, defaultValue) ?? defaultValue;
  }
}

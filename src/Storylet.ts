import { Story } from "inkjs/engine/Story";
import { Container } from "inkjs/engine/Container";

import { splitTag, splitCategories, evaluateContainer } from "./utils";

export class Storylet {
  story: Story;
  knot: Container;
  categories: Array<string>;
  contentStitch: Container;

  static tryCreate(story: Story, knot: Container) {
    if (!knot.name) return;
    const tags = story.TagsForContentAtPath(knot.name);
    if (!tags) return;
    for (const tag of tags) {
      let [tagName, categoryNames = "default"] = splitTag(tag);
      if (tagName == "storylet") {
        const categories = splitCategories(categoryNames);
        return new Storylet(story, knot, categories);
      }
    }
  }

  constructor(story: Story, knot: Container, categories: Array<string>) {
    this.story = story;
    this.knot = knot;
    this.categories = categories;
    this.contentStitch = this.getStitch("content");
  }

  toJSON() {
    return {
      name: this.knot.name,
      categories: this.categories,
      open: this.open,
      exclusivity: this.exclusivity,
      urgency: this.urgency,
      frequency: this.frequency,
    };
  }

  getStitch(name: string) {
    return this.knot.namedContent.get(name) as Container;
  }

  get<T>(propName: string, defaultValue: T): T {
    const stitch = this.getStitch(propName);
    if (stitch) {
      return evaluateContainer(this.story, stitch) ?? defaultValue;
    }
    return defaultValue;
  }

  // Shortcut for the usual getters
  get open() {
    return this.get("open", true);
  }
  get exclusivity() {
    return this.get("exclusivity", 0);
  }
  get urgency() {
    return this.get("urgency", 0);
  }
  get frequency() {
    return this.get("frequency", 1);
  }

  get isValid() {
    // TODO: check that it ends as a tunnel
    return this.contentStitch != null;
  }
  get divert() {
    return this.contentStitch.path;
  }
}

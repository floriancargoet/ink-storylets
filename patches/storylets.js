function take(n, list) {
  const taken = [];
  for (const item of list) {
    if (n-- === 0)
      break;
    taken.push(item);
  }
  return taken;
}
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
function shuffleWithFrequency(list) {
  function* gen() {
    while (list.length > 0) {
      const s = pickWithFrequency(list);
      yield s;
      list = [...list];
      list.splice(list.indexOf(s), 1);
    }
  }
  return gen();
}
function pickWithFrequency(items) {
  const weights = [];
  let sum = 0;
  for (let i = 0; i < items.length; i++) {
    sum += items[i].frequency;
    weights.push(sum);
  }
  const index = Math.floor(Math.random() * sum);
  let start = 0, end = weights.length - 1;
  while (start <= end) {
    let mid = Math.floor((start + end) / 2);
    if (index < weights[mid]) {
      end = mid - 1;
    } else {
      start = mid + 1;
    }
  }
  return items[start];
}
function splitTag(tag = "") {
  let [name, value] = tag.split(":", 2);
  name = name.toLowerCase().trim();
  value = value?.toLowerCase().trim();
  return [name, value];
}
function splitCategories(str) {
  return str.split(",").map((s) => s.trim()).filter(Boolean);
}
const EVAL_FLOW = "storylets evaluator";
function createEvaluatorFlow(story) {
  story.SwitchFlow(EVAL_FLOW);
}
function destroyEvaluatorFlow(story) {
  story.SwitchToDefaultFlow();
  story.RemoveFlow(EVAL_FLOW);
}
function evaluateContainer(story, container) {
  if (!container || !story)
    return null;
  const flowManagedByCaller = story.currentFlowName === EVAL_FLOW;
  if (!flowManagedByCaller) {
    createEvaluatorFlow(story);
  }
  const savedContent = [...container.content];
  const savedOutputStream = [
    // @ts-expect-error private
    ...story.state._currentFlow.outputStream
  ];
  for (let i = container.content.length - 1; i >= 0; i--) {
    if (isEvalOutput(container.content[i])) {
      container.content.splice(i);
      break;
    }
  }
  const result = EvaluateExpression.call(
    story,
    container
  );
  story.state._currentFlow.outputStream = savedOutputStream;
  container._content = savedContent;
  if (!flowManagedByCaller) {
    destroyEvaluatorFlow(story);
  }
  return result?.value ?? null;
}
function isEvalOutput(obj) {
  return obj.commandType === 1;
}
function EvaluateExpression(exprContainer) {
  const startCallStackHeight = this.state.callStack.elements.length;
  this.state.callStack.Push(
    0
    /* PushPopType.Tunnel */
  );
  this._temporaryEvaluationContainer = this._mainContentContainer;
  this.state.SetChosenPath(exprContainer.path, false);
  const evalStackHeight = this.state.evaluationStack.length;
  this.Continue();
  this._temporaryEvaluationContainer = null;
  if (this.state.callStack.elements.length > startCallStackHeight) {
    this.state.PopCallStack();
  }
  const endStackHeight = this.state.evaluationStack.length;
  if (endStackHeight > evalStackHeight) {
    return this.state.PopEvaluationStack();
  } else {
    return null;
  }
}

class Storylet {
  static tryCreate(story, knot) {
    if (!knot.name)
      return;
    const tags = story.TagsForContentAtPath(knot.name);
    if (!tags)
      return;
    for (const tag of tags) {
      let [tagName, categoryNames = "default"] = splitTag(tag);
      if (tagName == "storylet") {
        const categories = splitCategories(categoryNames);
        return new Storylet(story, knot, categories);
      }
    }
  }
  constructor(story, knot, categories) {
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
      frequency: this.frequency
    };
  }
  getStitch(name) {
    return this.knot.namedContent.get(name);
  }
  get(propName, defaultValue) {
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
    return this.contentStitch != null;
  }
  get divert() {
    return this.contentStitch.path;
  }
}

const defaultRandom = "frequency";
function parseSelectQuery(str) {
  const params = new URLSearchParams(str);
  const query = {};
  for (const key of params.keys()) {
    const values = params.getAll(key);
    const value0 = values[0];
    switch (key) {
      case "random":
        if ("uniform" === value0 || "frequency" === value0) {
          query.random = value0;
        } else if (!["0", "false"].includes(value0)) {
          query.random = defaultRandom;
        }
        break;
      case "max":
        const max = parseInt(value0);
        if (!Number.isNaN(max)) {
          query.max = max;
        }
        break;
      case "category":
      default:
        query[key] = values;
    }
  }
  return query;
}

class Storylets {
  constructor(story) {
    // Store the iterable between ink calls
    this.iterable = null;
    this.story = story;
    const knots = Array.from(
      story.mainContentContainer.namedContent.values()
    );
    this.storylets = knots.map((knot) => Storylet.tryCreate(story, knot)).filter((s) => {
      if (s == null)
        return false;
      if (!s.isValid) {
        console.error(
          `Couldn't find a stitch named "content" in storylet "${s.knot.name}".`
        );
      }
      return s.isValid;
    });
    const storyletsInternal = story.KnotContainerWithName("storylets_internal");
    const nullStitch = storyletsInternal?.namedContent.get("null_stitch");
    if (!nullStitch) {
      throw new Error(
        "Ink story is missing a 'storylet_internal.null_stitch' stitch."
      );
    }
    this.nullDivert = nullStitch.path;
  }
  select(selectQuery) {
    createEvaluatorFlow(this.story);
    const query = parseSelectQuery(selectQuery);
    let available = this.storylets.filter((s) => s.open);
    if (query.category) {
      const qCategories = query.category.map((c) => c.trim());
      available = available.filter(
        (s) => qCategories.every((c) => s.categories.includes(c))
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
    const maxExclusivity = available.reduce(
      (max, s) => Math.max(max, s.exclusivity),
      0
    );
    available = available.filter((s) => s.exclusivity === maxExclusivity);
    let randomIterable;
    if (query.random) {
      if (query.random === "uniform") {
        shuffleArray(available);
      } else {
        randomIterable = shuffleWithFrequency(available);
      }
    } else {
      available.sort((a, b) => b.urgency - a.urgency);
    }
    if (query.max != null && query.max > 0) {
      available = take(query.max, randomIterable ?? available);
    }
    this.iterable = available.values();
    destroyEvaluatorFlow(this.story);
  }
  // Consume one storylet in the iterable and return its divert (or the null divert)
  getNext() {
    if (!this.iterable)
      return this.nullDivert;
    const { value, done } = this.iterable.next();
    if (done)
      return this.nullDivert;
    return value.divert;
  }
  // Expose storylet prop getter to ink.
  getProp(storyletName, propName, defaultValue) {
    const storylet = this.storylets.find((s) => s.knot.name === storyletName);
    return storylet?.get(propName, defaultValue) ?? defaultValue;
  }
}

function instanceOrObject(storylet, asInstance) {
  if (storylet == null)
    return void 0;
  return asInstance ? storylet : storylet.toJSON();
}
function instancesOrObjects(list, asInstances) {
  return asInstances ? list : list.map((s) => s.toJSON());
}
class StoryletsDebugger {
  constructor(storylets) {
    this.instance = storylets;
  }
  get(name, asInstance = false) {
    return instanceOrObject(
      this.instance.storylets.find((s) => s.knot.name === name),
      asInstance
    );
  }
  all(asInstances = false) {
    return instancesOrObjects(this.instance.storylets, asInstances);
  }
  select(selectQuery, asInstances = false) {
    const s = this.instance;
    s.select(selectQuery);
    if (s.iterable) {
      const result = [...s.iterable];
      s.iterable = null;
      return instancesOrObjects(result, asInstances);
    }
    return [];
  }
}

const credits = {
  emoji: "\u{1F9F6}",
  name: "Storylets",
  author: "Florian Cargo\xEBt",
  // @ts-expect-error Injected by rollup
  version: "0.2.1",
  description: "Storylets",
  licences: {
    self: "2023"
  }
};
const options = {};
Patches.add(
  function() {
    const storylets = new Storylets(this.ink);
    window.storyletsDebugger = new StoryletsDebugger(storylets);
    ExternalFunctions.add(
      "storylets_select",
      (selectQuery) => storylets.select(selectQuery)
    );
    ExternalFunctions.add("storylets_get_next", () => storylets.getNext());
    ExternalFunctions.add(
      "storylets_get_prop",
      (storyletName, propName, defaultValue) => storylets.getProp(storyletName, propName, defaultValue)
    );
  },
  options,
  credits
);
var index = { options, credits };

export { index as default };

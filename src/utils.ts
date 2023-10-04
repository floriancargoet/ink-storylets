import { Container } from "inkjs/engine/Container";
import { ControlCommand } from "inkjs/engine/ControlCommand";
import { Story } from "inkjs/engine/Story";
import { Value } from "inkjs/engine/Value";

export function take<T>(n: number, list: Iterable<T>): Array<T> {
  const taken = [];
  for (const item of list) {
    if (n-- === 0) break;
    taken.push(item);
  }
  return taken;
}

// Fisher-Yates
export function shuffleArray<T>(array: Array<T>) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

type HasFrequency = {
  frequency: number;
};

export function shuffleWithFrequency<T extends HasFrequency>(list: Array<T>) {
  // Use a generator so we don't pick more items than needed
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

function pickWithFrequency<T extends HasFrequency>(items: Array<T>) {
  const weights = [];
  let sum = 0;
  for (let i = 0; i < items.length; i++) {
    sum += items[i].frequency;
    weights.push(sum);
  }
  const index = Math.floor(Math.random() * sum);
  // Binary search
  let start = 0,
    end = weights.length - 1;
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

// "foo : bar, baz " =>["foo", "bar, baz"]
export function splitTag(tag = "") {
  let [name, value] = tag.split(":", 2);
  name = name.toLowerCase().trim();
  value = value?.toLowerCase().trim();
  return [name, value];
}

// "bar , baz ,," =>["bar", "baz"]
export function splitCategories(str: string) {
  return str
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

interface Stringifiable {
  toString: () => string;
}

export function evaluateContainer<T>(
  story: Story,
  container: Container
): T | null {
  if (!container || !story) return null;

  // Go to a dedicated flow so we don't break threads in progress in the current flow.
  story.SwitchFlow("storylets evaluator");
  // Save state to restore after our hack
  const content = [...container.content];
  // @ts-expect-error private
  const outputStream = [...(story.state._currentFlow as Flow).outputStream];

  // check if the container contains an expression,
  // and if and where we should crop it
  let lastIndex = -1;
  for (let i = container.content.length - 1; i >= 0; i--) {
    // commandType 1 (EvalOutput) will remove the value we want
    // from the evaluationStack, so we trim the array to stop that happening
    if ((container.content[i] as ControlCommand).commandType === 1) {
      lastIndex = i;
      break;
    }
  }

  if (lastIndex >= 0) {
    // crop the expression now so the result doesn't get removed
    // from the stack in the next step
    container.content.splice(lastIndex);
  }

  // then we evaluate it, and return that value from the stack
  const result = story.EvaluateExpression(container) as Value<Stringifiable>;

  // Restore the state to what it was before the hack
  // @ts-expect-error private
  (story.state._currentFlow as Flow).outputStream = outputStream;
  container._content = content;
  story.SwitchToDefaultFlow();

  return (result?.value as T) ?? null;
}

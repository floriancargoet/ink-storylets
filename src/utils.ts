import type { Container } from "inkjs/engine/Container";
import type { ControlCommand } from "inkjs/engine/ControlCommand";
import type { Story } from "inkjs/engine/Story";
import type { Value } from "inkjs/engine/Value";
import type { Flow } from "inkjs/engine/Flow";
import type { InkObject } from "inkjs/engine/Object";

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

export const EVAL_FLOW = "storylets evaluator";
export function createEvaluatorFlow(story: Story) {
  // Go to a dedicated flow so we don't break threads in progress in the main flow.
  story.SwitchFlow(EVAL_FLOW);
}
export function destroyEvaluatorFlow(story: Story) {
  story.SwitchToDefaultFlow();
  story.RemoveFlow(EVAL_FLOW);
}

// Modified version of calico's evaluateContainer
export function evaluateContainer<T>(
  story: Story,
  container: Container
): T | null {
  if (!container || !story) return null;

  // If we are already in the storylets evaluator flow, it means the caller manages the flow.
  const flowManagedByCaller = story.currentFlowName === EVAL_FLOW;

  if (!flowManagedByCaller) {
    createEvaluatorFlow(story);
  }

  // Save state & container to restore after our hack.
  const savedContent = [...container.content];
  const savedOutputStream = [
    // @ts-expect-error private
    ...(story.state._currentFlow as Flow).outputStream,
  ];

  // We need to locate the last expression of the container so we iterate in reverse.
  // and look for an EvalOutput instruction.
  for (let i = container.content.length - 1; i >= 0; i--) {
    if (isEvalOutput(container.content[i])) {
      // An EvalOutput instruction would pop from the stack the value that we want.
      // We truncate the instructions so that the value stays on the stack.
      container.content.splice(i);
      break;
    }
  }

  // Now the can evaluate this truncated container and return the value on the stack
  const result = EvaluateExpression.call(
    story,
    container
  ) as Value<Stringifiable>;

  // Restore the state & container to what it was before the hack
  // @ts-expect-error private
  (story.state._currentFlow as Flow).outputStream = savedOutputStream;
  container._content = savedContent;

  // Restore the flow if we are responsible for it.
  if (!flowManagedByCaller) {
    destroyEvaluatorFlow(story);
  }

  return (result?.value as T) ?? null;
}

function isEvalOutput(obj: InkObject) {
  return (obj as ControlCommand).commandType === 1 /* CommandType.EvalOutput */;
}

// Modified version of ink's EvaluateExpression with a fake _temporaryEvaluationContainer.
// Using a _temporaryEvaluationContainer breaks paths and we need them in expression such as TURNS_SINCE(-> knot)
// so we use the normal _mainContentContainer as temporary container so that the root is correct but ink still knows we are in a temp context.
// We also replace GoToStart with "go to start of container".
function EvaluateExpression(this: Story, exprContainer: Container) {
  const startCallStackHeight = this.state.callStack.elements.length;

  this.state.callStack.Push(0 /* PushPopType.Tunnel */);

  // @ts-ignore
  this._temporaryEvaluationContainer = this._mainContentContainer;
  // We don't go to the start of the story, we only want to go to the start of the container
  // this.state.GoToStart();
  // Choose path without counting visits or turns
  this.state.SetChosenPath(exprContainer.path, false);

  const evalStackHeight = this.state.evaluationStack.length;

  this.Continue();

  // @ts-ignore
  this._temporaryEvaluationContainer = null;

  // Should have fallen off the end of the Container, which should
  // have auto-popped, but just in case we didn't for some reason,
  // manually pop to restore the state (including currentPath).
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

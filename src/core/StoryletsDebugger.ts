import { Storylet } from "./Storylet";
import { Storylets } from "./Storylets";

function instanceOrObject(storylet: Storylet | undefined, asInstance: boolean) {
  if (storylet == null) return undefined;
  return asInstance ? storylet : storylet.toJSON();
}

function instancesOrObjects(list: Array<Storylet>, asInstances: boolean) {
  return asInstances ? list : list.map((s) => s.toJSON());
}

export class StoryletsDebugger {
  instance: Storylets;

  constructor(storylets: Storylets) {
    this.instance = storylets;
  }

  get(name: string, asInstance = false) {
    return instanceOrObject(
      this.instance.storylets.find((s) => s.knot.name === name),
      asInstance
    );
  }

  all(asInstances = false) {
    return instancesOrObjects(this.instance.storylets, asInstances);
  }

  select(selectQuery: string, asInstances = false) {
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

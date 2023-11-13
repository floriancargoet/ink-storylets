type SelectQuery = {
  category?: Array<string>;
  filter?: Array<string>;
  random?: "uniform" | "frequency";
  max?: number;
} & Record<string, Array<string>>;

const defaultRandom = "frequency";

export function parseSelectQuery(str: string) {
  const params = new URLSearchParams(str);
  const query: SelectQuery = {};
  for (const key of params.keys()) {
    const values = params.getAll(key);
    const value0 = values[0];
    switch (key) {
      case "random":
        if ("uniform" === value0 || "frequency" === value0) {
          query.random = value0;
        } else if (!["0", "false"].includes(value0)) {
          // Everything but 0 & false are converted to defaultRandom
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

import { Story } from "inkjs/engine/Story";

// Empty export to make this file a module
export {};

type CalicoOptions = Record<string, unknown>;
type CalicoCredits = Record<string, unknown>;
type Patches = {
  add: (
    callback: (this: CalicoStory) => void,
    options: CalicoOptions,
    credits: CalicoCredits
  ) => void;
};
type ExternalFunctions = {
  add: (name: string, func: (...args: Array<any>) => void) => void;
};

export type CalicoStory = {
  ink: Story;
};

declare global {
  const Patches: Patches;
  const ExternalFunctions: ExternalFunctions;
}

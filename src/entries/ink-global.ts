import { Storylets } from "../core/Storylets";
import { StoryletsDebugger } from "../core/StoryletsDebugger";

declare global {
  interface Window {
    Storylets: typeof Storylets;
    StoryletsDebugger: typeof StoryletsDebugger;
  }
}

// Just expose everyhting globally
window.Storylets = Storylets;
window.StoryletsDebugger = StoryletsDebugger;

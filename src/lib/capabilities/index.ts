import Monetization from "./Monetization.js";

export const monetization = new Monetization();
export { Monetization };

if (typeof window !== "undefined") {
  if (!window.monet) {
    Object.defineProperty(window, "monet", {
      writable: false,
      configurable: false,
      value: monetization,
    });
  }
}

import Cache from "./Cache.js";
import { ensureValidCapability } from "./UserPreferences.js";

export type Capability = `${string}/${string}`;
export type Result = { isSupported: boolean; details?: unknown };
export type Test = () => Promise<Result>;
export type Plugin = [name: Capability, test: Test];

export interface DetectOptions {
  bypassCache?: boolean;
}

class Lock {
  #locked = false;

  acquire() {
    if (this.#locked) {
      throw new Error("Already acquired.");
    }
    this.#locked = true;
  }

  unlock = () => {
    this.#locked = false;
  };

  isLocked() {
    return this.#locked;
  }
}

class CapabilityChangeEvent extends Event {
  constructor(
    public changeType: "define" | "undefine",
    public capability: Capability
  ) {
    super("change");
  }
}

class Capabilities extends Lock {
  #capabilities;
  #dispatchEvent;
  constructor(dispatchEvent: EventTarget["dispatchEvent"]) {
    super();
    this.#capabilities = new Map<Capability, () => ReturnType<Test>>();
    this.#dispatchEvent = dispatchEvent;
  }

  /**
   * Declare & define a website's capability to monetize by different methods.
   * The order of `define()` calls defines the order for website's monetization
   * preferences (first call being most preferred capability).
   * @param capability capability name
   * @param isUserCapable tests whether user is capable
   */
  define(capability: Capability, isUserCapable: Test): void {
    ensureValidCapability(capability);
    this.#capabilities.set(capability, isUserCapable);
    this.#dispatchEvent(new CapabilityChangeEvent("define", capability));
  }

  undefine(capability: Capability) {
    if (!this.#capabilities.has(capability)) {
      throw new Error("Capability not defined.");
    }
    const fn = this.#capabilities.get(capability)!;
    this.#capabilities.delete(capability);
    this.#dispatchEvent(new CapabilityChangeEvent("undefine", capability));
    return fn;
  }

  use([name, test]: Plugin): void {
    this.define(name, test);
  }

  list() {
    return [...this.#capabilities.keys()];
  }

  has(capability: Capability) {
    return this.#capabilities.has(capability);
  }

  get(capability: Capability) {
    return this.#capabilities.get(capability);
  }
}

export default class MonetizationCapabilities extends EventTarget {
  #capabilities;
  #cache;

  constructor() {
    super();
    this.#capabilities = new Capabilities(this.dispatchEvent.bind(this));
    this.#cache = new Cache({ enabled: false });
  }

  acquire() {
    this.#capabilities.acquire();
    return this.#capabilities;
  }

  list() {
    return this.#capabilities.list();
  }

  has(capability: Capability) {
    return this.#capabilities.has(capability);
  }

  async detect(capability: Capability, options: DetectOptions) {
    const { bypassCache = false } = options;
    const detectCapability = this.#capabilities.get(capability)!;
    if (!detectCapability || typeof detectCapability !== "function") {
      throw new Error(`Unrecognized capability: ${capability}`);
    }

    if (bypassCache) {
      return await detectCapability();
    }

    const cached: Result = await this.#cache.get(capability);
    if (cached) {
      return cached;
    }
    const result = await detectCapability();
    await this.#cache.set(capability, result);
    return result;
  }

  async clearCache() {
    await this.#cache.clear();
  }
}

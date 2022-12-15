/// <reference types="@webmonetization/types" />
import type { MonetizationExtendedDocument } from "@webmonetization/types";
import type {
  Capability,
  Result,
  Plugin,
} from "../MonetizationCapabilities.js";

const name: Capability = "webmonetization/*";

interface Options {
  /** Detection timeout in milliseconds. */
  timeout: number;
  /** Probe for active monetization when true. Takes longer but can be more accurate. */
  strict: boolean;
}

function isCapable({ timeout, strict = false }: Options) {
  return new Promise<Result>((resolve) => {
    const wm = (document as MonetizationExtendedDocument).monetization;
    if (!wm) {
      return resolve({
        isSupported: false,
        details: { message: "No document.monetization" },
      });
    } else {
      // if using simple mode, we don't detect transfer but presence
      // of document.monetization
      if (!strict) {
        return resolve({ isSupported: true });
      }
    }

    const timerId = setTimeout(() => {
      resolve({
        isSupported: false,
        details: { message: "Timeout" },
      });
      wm.removeEventListener("monetizationprogress", onProgress);
    }, timeout);
    wm.addEventListener("monetizationprogress", onProgress);

    function onProgress() {
      resolve({ isSupported: true });
      clearTimeout(timerId);
      wm.removeEventListener("monetizationprogress", onProgress);
    }
  });
}

export default function webmon(options: Partial<Options> = {}): Plugin {
  const timeout = Math.max(options.timeout || 0, 0);
  return [name, () => isCapable({ timeout })];
}

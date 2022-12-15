// this is a hybrid plugin that does both a version of webmon and fairpass
// probably a better way to do this...

import { monetization } from "..";

const name = "pass/fairpass";
const capabilities = monetization.capabilities.acquire();
capabilities.unlock(); // allow others to use the capabilities

function isCapableFree({ state, pass }) {
  return new Promise((resolve) => {
    const siteIsOpen = state === "open" ? true : false; // API request, returns: user passes + paywall status
    let isSupported = true;
    if (siteIsOpen) {
      monetization.userPreferences.allow("free/fairpass");
      capabilities.define("free/fairpass", () => ({ isSupported: true })); // MM: I think coupling the "possible capabilities" with the implementation of "does the user have this?" may be sub-ideal. We may want to do these at different moments, or at least re-define the implementation of "user has this thing"
    } else {
      isSupported = false; // site is closed, no free
      monetization.userPreferences.deny("free/fairpass");
    }

    return resolve({ isSupported, details: { siteIsOpen, state } });
  });
}

// does the user have a paid fairpass
function isCapableFairpass({ state, pass, passes }) {
  return new Promise((resolve) => {
    // const userHasFairPass = pass ? true : false;
    const siteIsOpen = state === "open" ? true : false; // API request, returns: user passes + paywall status

    let userHasFairPass = false;
    if (pass) {
      userHasFairPass = true;
    } else {
      for (const p of passes) {
        if (p.startsWith("fairpass/")) {
          // could be fairpass/member or fairpass/annual or fairpass/whatever
          userHasFairPass = true;
          break;
        }
      }
    }

    let isSupported = true;
    if (userHasFairPass) {
      monetization.userPreferences.allow("pass/fairpass");
      capabilities.define("pass/fairpass", () => ({ isSupported: true }));
    } else {
      monetization.userPreferences.deny("pass/fairpass");
      isSupported = false;
    }

    return resolve({
      isSupported,
      details: { userHasFairPass, siteIsOpen, state },
    });
  });
}

function isCapableWebmon({ timeout, strict = false }) {
  return new Promise((resolve) => {
    if (!document.monetization) {
      console.log("no document.monetization");
      resolve({
        isSupported: false,
        details: { message: "No document.monetization" },
      });
      return;
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

      document.monetization.removeEventListener(
        "monetizationstart",
        onProgress
      );
      document.monetization.removeEventListener(
        "monetizationprogress",
        onProgress
      );
    }, timeout);
    document.monetization.addEventListener("monetizationstart", onProgress);
    document.monetization.addEventListener("monetizationprogress", onProgress);
    function onProgress() {
      console.log("onProgress");
      resolve({ isSupported: true });
      clearTimeout(timerId);
      document.monetization.removeEventListener(
        "monetizationstart",
        onProgress
      );
      document.monetization.removeEventListener(
        "monetizationprogress",
        onProgress
      );
    }
  });
}

export function fairpass(options = {}) {
  return ["pass/fairpass", () => isCapableFairpass({ ...options })];
}

export function webmon(options = {}) {
  return ["webmon/*", () => isCapableWebmon({ ...options, strict: false })];
}

export function freepass(options = {}) {
  return ["free/fairpass", () => isCapableFree({ ...options })];
}

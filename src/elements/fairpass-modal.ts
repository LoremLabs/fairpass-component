import type { PropMap } from "../utils/custom-element.js";
import { init, ensureOneOf } from "../utils/custom-element.js";

import App from "@elements/FairPassModal/script.es.js";
import css from "@elements/FairPassModal/style.css";

// TODO?
const propMap: PropMap = {
  // subtitle: (value) => ({ subtitle: value }),
  // heading: (value) => ({ heading: value}),
  // href: (value) => ({ href: value }),
  // cta: (value) => ({ ctaText: value || defaults.ctaText }),
  // text: (value) => ({ text: value || defaults.text }),
  closeable: (value) => ({ closeable: value }),
};

init("fairpass-modal", propMap, App, css);

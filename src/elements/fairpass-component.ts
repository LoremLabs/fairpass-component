import type { PropMap } from "../utils/custom-element.js";
import { init } from "../utils/custom-element.js";

import App from "@elements/FairPass/script.es.js";
import css from "@elements/FairPass/style.css";
import * as defaults from "../components/FairPass/defaults";

const propMap: PropMap = {
  scope: (value) => ({ scope: value || defaults.scope }),
  scopePercent: (value) => ({
    scopePercent: parseInt(value, 10) || defaults.scopePercent,
  }),
  state: (value) => ({ state: value || defaults.state }),
  acceptable: (value) => ({ acceptable: value || defaults.acceptable }),
  pass: (value) => ({ pass: value || defaults.pass }),
  apiKey: (value) => ({ apiKey: value || defaults.apiKey }),
  debug: (value) => ({ debug: value }),
  hurrah: (value) => ({ hurrah: value }),
  threshold: (value) => ({ threshold: value }),
  mode: (value) => ({ mode: value }),
  simulate: (value) => ({ simulate: value }),
  disabled: (value) => ({ disabled: value }),
};

init("fair-pass", propMap, App, css);

import { type as defaultType } from "./constants";

interface AppConstructor {
  new (arg: {
    target: ShadowRoot | HTMLElement;
    props: Record<string, unknown>;
  });
  $set(props: Record<string, unknown>): void;
}

export type PropGetter = (
  value: string,
  el: HTMLElement
) => { [prop: string]: unknown };
export type PropMap = Record<string, PropGetter>;

export function init(
  name: string,
  propMap: PropMap,
  App: AppConstructor,
  css: string
) {
  // TODO: use a WeakMap
  let app: typeof App | null;
  let shadowRoot: ShadowRoot | null;
  const attributes = Object.keys(propMap);

  class MyComponent extends HTMLElement {
    static get observedAttributes() {
      return attributes;
    }

    constructor() {
      super();
      shadowRoot = this.attachShadow({ mode: "closed" });
    }

    attributeChangedCallback(attr: string, oldValue: string, newValue: string) {
      if (!app) return;
      if (oldValue === newValue) return;

      const props = propMap[attr](newValue, this);
      app.$set(props);
    }

    connectedCallback() {
      const props = {};
      for (const attr of attributes) {
        if (this.hasAttribute(attr)) {
          Object.assign(props, propMap[attr](this.getAttribute(attr), this));
        }
      }

      const style = document.createElement("style");
      style.textContent = css;
      shadowRoot.append(style);

      // const html = String.raw;
      //   shadowRoot.innerHTML = html`
      //   <slot hidden name="open-head">hi</slot>
      //   <slot hidden name="else">default else</slot>
      // `;

      const slots = [...this.querySelectorAll(':not([slot=""]')].reduce(
        (acc, div) => {
          // check if div is empty / with no children
          if (div.innerHTML !== "") {
            acc[div.slot] = div;
          }
          return acc;
        },
        {} as Record<string, HTMLSlotElement>
      );

      props.slots = slots;

      app = new App({ target: shadowRoot, props });
    }

    disconnectedCallback() {
      app = null;
      shadowRoot = null;
    }
  }

  customElements.define(name, MyComponent);
}

export function ensureOneOf<T>(
  value: any,
  options: T[],
  elem: HTMLElement,
  attr: string,
  defaultValue: T
): T {
  if (options.includes(value)) {
    return value;
  }

  const prefix = `<${elem.localName}>`;
  const opts = options.map((opt) => `"${opt}"`).join(", ");
  const msg = `Attribute "${attr}" must be one of: ${opts}.`;
  const info = `Defaulting to "${defaultValue}".`;
  console.warn(`${prefix}: ${msg} ${info}`);
  elem.setAttribute(attr, `${defaultValue}`);
  return defaultValue;
}

export function getTypeFromElement(el: HTMLElement) {
  const type = el.getAttribute("type");
  return type ? (type as typeof defaultType) : defaultType;
}
